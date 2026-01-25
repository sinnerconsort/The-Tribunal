/**
 * The Tribunal - Contacts Handlers
 * UI logic for the contacts section in the Ledger
 * 
 * NO MODALS VERSION - Uses inline forms only
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - Only load when actually needed
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _contactsData = null;

async function getPersistence() {
    if (!_persistence) {
        try {
            _persistence = await import('../core/persistence.js');
        } catch (e) {
            console.error('[Contacts] Could not load persistence:', e.message);
            _persistence = {
                getChatState: () => null,
                saveChatState: () => {}
            };
        }
    }
    return _persistence;
}

async function getContactsData() {
    if (!_contactsData) {
        try {
            _contactsData = await import('../data/contacts.js');
        } catch (e) {
            console.error('[Contacts] Could not load contacts data:', e.message);
            _contactsData = {
                CONTACT_TYPES: {},
                CONTACT_DISPOSITIONS: {},
                createContact: (o) => ({ id: `contact_${Date.now()}`, name: 'Unknown', ...o }),
                getTypeFromDisposition: () => 'unknown',
                getDisposition: () => ({ id: 'neutral', label: 'Neutral', color: '#7a7a7a' })
            };
        }
    }
    return _contactsData;
}

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS HELPERS
// ═══════════════════════════════════════════════════════════════

async function getContacts() {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state) return {};
    if (!state.relationships) state.relationships = {};
    return state.relationships;
}

async function saveContact(contact) {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state) return;
    if (!state.relationships) state.relationships = {};
    
    contact.lastModified = Date.now();
    state.relationships[contact.id] = contact;
    persistence.saveChatState();
}

async function deleteContact(contactId) {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state?.relationships) return;
    
    delete state.relationships[contactId];
    persistence.saveChatState();
}

// ═══════════════════════════════════════════════════════════════
// INLINE FORM TEMPLATE (NO MODALS)
// ═══════════════════════════════════════════════════════════════

async function getInlineFormHtml(existingContact = null) {
    const contactsData = await getContactsData();
    const isEdit = !!existingContact;
    
    // Build disposition options
    const dispositionOptions = Object.values(contactsData.CONTACT_DISPOSITIONS)
        .map(d => `<option value="${d.id}" ${existingContact?.disposition === d.id ? 'selected' : ''}>${d.label}</option>`)
        .join('');
    
    return `
        <div class="contact-inline-form" data-contact-id="${existingContact?.id || 'new'}">
            <label class="contact-form-label">
                Name
                <input type="text" class="contact-form-input contact-input-name" 
                       value="${existingContact?.name || ''}" placeholder="Enter name...">
            </label>
            
            <label class="contact-form-label">
                Relationship
                <input type="text" class="contact-form-input contact-input-relationship"
                       value="${existingContact?.relationship || ''}" placeholder="Partner, witness, suspect...">
            </label>
            
            <label class="contact-form-label">
                Disposition
                <select class="contact-form-select contact-input-disposition">
                    ${dispositionOptions}
                </select>
            </label>
            
            <label class="contact-form-label">
                Notes
                <textarea class="contact-form-textarea contact-input-notes" 
                          placeholder="Your observations...">${existingContact?.notes || ''}</textarea>
            </label>
            
            <div class="contact-form-actions">
                <button class="contact-form-btn contact-form-cancel">Cancel</button>
                <button class="contact-form-btn contact-form-save">${isEdit ? 'Save' : 'Add Contact'}</button>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render a single contact card
 */
async function renderContactCard(contact) {
    const contactsData = await getContactsData();
    const disposition = contactsData.getDisposition(contact.disposition);
    const typeId = contactsData.getTypeFromDisposition(contact.disposition);
    const type = contactsData.CONTACT_TYPES[typeId] || { shortLabel: '?', label: 'UNKNOWN', color: '#6a6a6a' };
    
    return `
        <div class="contact-card" data-contact-id="${contact.id}" data-disposition="${contact.disposition || 'neutral'}" data-expanded="false">
            <div class="contact-card-header">
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <span class="contact-disposition" style="color: ${disposition.color}">${disposition.label}</span>
                </div>
                <span class="contact-type-badge" style="background-color: ${type.color}20; color: ${type.color}; border-color: ${type.color}">
                    [${type.shortLabel}] ${type.label}
                </span>
            </div>
            
            <div class="contact-card-details">
                <div class="contact-display-content">
                    ${contact.relationship ? `<div class="contact-relationship">${contact.relationship}</div>` : ''}
                    ${contact.notes ? `<div class="contact-notes">"${contact.notes}"</div>` : ''}
                    
                    <div class="contact-actions">
                        <button class="contact-action-btn contact-edit-btn" data-contact-id="${contact.id}">
                            <i class="fa-solid fa-pen"></i> EDIT
                        </button>
                        <button class="contact-action-btn contact-remove-btn" data-contact-id="${contact.id}">
                            <i class="fa-solid fa-times"></i> REMOVE
                        </button>
                    </div>
                </div>
                <div class="contact-edit-form-container"></div>
            </div>
        </div>
    `;
}

/**
 * Render the full contacts list
 */
export async function renderContactsList() {
    const listEl = document.getElementById('contacts-list');
    const emptyEl = document.getElementById('contacts-empty');
    const countEl = document.getElementById('contacts-count');
    
    if (!listEl) return;
    
    const contacts = await getContacts();
    const contactArray = Object.values(contacts);
    
    // Update count
    if (countEl) {
        countEl.textContent = contactArray.length > 0 ? `(${contactArray.length})` : '';
    }
    
    // Show/hide empty state
    if (emptyEl) {
        emptyEl.style.display = contactArray.length === 0 ? 'block' : 'none';
    }
    
    if (contactArray.length === 0) {
        listEl.innerHTML = '';
        return;
    }
    
    // Sort by name
    contactArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Render all cards
    const cards = await Promise.all(contactArray.map(c => renderContactCard(c)));
    listEl.innerHTML = cards.join('');
    
    // Attach card click handlers for expand/collapse
    listEl.querySelectorAll('.contact-card-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const card = header.closest('.contact-card');
            const isExpanded = card.dataset.expanded === 'true';
            card.dataset.expanded = (!isExpanded).toString();
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// ADD CONTACT (INLINE FORM)
// ═══════════════════════════════════════════════════════════════

let addFormVisible = false;
let addFormContainer = null;

async function showAddForm() {
    const addBtn = document.getElementById('contacts-add-btn');
    if (!addBtn || addFormVisible) return;
    
    // Hide the button
    addBtn.style.display = 'none';
    
    // Create form container after the button
    addFormContainer = document.createElement('div');
    addFormContainer.id = 'contacts-add-form-container';
    addFormContainer.innerHTML = await getInlineFormHtml(null);
    addBtn.parentNode.insertBefore(addFormContainer, addBtn.nextSibling);
    
    addFormVisible = true;
    
    // Focus name input
    const nameInput = addFormContainer.querySelector('.contact-input-name');
    setTimeout(() => nameInput?.focus(), 50);
    
    // Bind form buttons
    bindAddFormEvents(addFormContainer);
}

function hideAddForm() {
    const addBtn = document.getElementById('contacts-add-btn');
    
    // Remove form container
    if (addFormContainer) {
        addFormContainer.remove();
        addFormContainer = null;
    }
    
    // Show button again
    if (addBtn) {
        addBtn.style.display = '';
    }
    
    addFormVisible = false;
}

function bindAddFormEvents(container) {
    const cancelBtn = container.querySelector('.contact-form-cancel');
    const saveBtn = container.querySelector('.contact-form-save');
    
    cancelBtn?.addEventListener('click', hideAddForm);
    
    saveBtn?.addEventListener('click', async () => {
        const name = container.querySelector('.contact-input-name')?.value?.trim();
        if (!name) {
            container.querySelector('.contact-input-name')?.focus();
            return;
        }
        
        const contactsData = await getContactsData();
        const contact = contactsData.createContact({});
        
        contact.name = name;
        contact.relationship = container.querySelector('.contact-input-relationship')?.value?.trim() || '';
        contact.disposition = container.querySelector('.contact-input-disposition')?.value || 'neutral';
        contact.notes = container.querySelector('.contact-input-notes')?.value?.trim() || '';
        contact.manuallyEdited = true;
        
        await saveContact(contact);
        hideAddForm();
        await renderContactsList();
    });
}

// ═══════════════════════════════════════════════════════════════
// EDIT CONTACT (INLINE FORM IN CARD)
// ═══════════════════════════════════════════════════════════════

async function showEditForm(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const card = document.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    if (!card) return;
    
    // Expand the card
    card.dataset.expanded = 'true';
    
    // Hide display content, show form
    const displayContent = card.querySelector('.contact-display-content');
    const formContainer = card.querySelector('.contact-edit-form-container');
    
    if (displayContent) displayContent.style.display = 'none';
    if (formContainer) {
        formContainer.innerHTML = await getInlineFormHtml(contact);
        bindEditFormEvents(formContainer, contact);
    }
}

function hideEditForm(card) {
    const displayContent = card.querySelector('.contact-display-content');
    const formContainer = card.querySelector('.contact-edit-form-container');
    
    if (displayContent) displayContent.style.display = '';
    if (formContainer) formContainer.innerHTML = '';
}

function bindEditFormEvents(container, existingContact) {
    const card = container.closest('.contact-card');
    const cancelBtn = container.querySelector('.contact-form-cancel');
    const saveBtn = container.querySelector('.contact-form-save');
    
    cancelBtn?.addEventListener('click', () => {
        hideEditForm(card);
    });
    
    saveBtn?.addEventListener('click', async () => {
        const name = container.querySelector('.contact-input-name')?.value?.trim();
        if (!name) {
            container.querySelector('.contact-input-name')?.focus();
            return;
        }
        
        const contact = { ...existingContact };
        contact.name = name;
        contact.relationship = container.querySelector('.contact-input-relationship')?.value?.trim() || '';
        contact.disposition = container.querySelector('.contact-input-disposition')?.value || 'neutral';
        contact.notes = container.querySelector('.contact-input-notes')?.value?.trim() || '';
        contact.manuallyEdited = true;
        
        await saveContact(contact);
        await renderContactsList();
    });
}

// ═══════════════════════════════════════════════════════════════
// REMOVE CONTACT
// ═══════════════════════════════════════════════════════════════

async function handleRemoveContact(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    if (confirm(`Remove ${contact.name} from contacts?`)) {
        await deleteContact(contactId);
        await renderContactsList();
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize contacts handlers
 * Call this after the ledger tab is rendered
 */
export async function initContactsHandlers() {
    console.log('[Contacts] Initializing handlers (no-modal version)...');
    
    // Add Contact button
    const addBtn = document.getElementById('contacts-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddForm);
    }
    
    // Delegate edit/remove clicks on the list container
    const listEl = document.getElementById('contacts-list');
    if (listEl) {
        listEl.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.contact-edit-btn');
            const removeBtn = e.target.closest('.contact-remove-btn');
            
            if (editBtn) {
                e.stopPropagation();
                const contactId = editBtn.dataset.contactId;
                await showEditForm(contactId);
            } else if (removeBtn) {
                e.stopPropagation();
                const contactId = removeBtn.dataset.contactId;
                await handleRemoveContact(contactId);
            }
        });
    }
    
    // Initial render
    await renderContactsList();
    
    console.log('[Contacts] Handlers initialized (no-modal version)');
}

/**
 * Refresh contacts display (call after chat change)
 */
export async function refreshContacts() {
    hideAddForm(); // Reset add form state
    await renderContactsList();
}
