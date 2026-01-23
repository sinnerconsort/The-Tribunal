/**
 * The Tribunal - Contacts Handlers
 * UI logic for the contacts section in the Ledger
 * 
 * SAFE VERSION: Uses lazy imports to avoid breaking extension on load
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
// MODAL DIALOG
// ═══════════════════════════════════════════════════════════════

/**
 * Show add/edit contact modal
 */
async function showContactModal(existingContact = null) {
    const contactsData = await getContactsData();
    const isEdit = !!existingContact;
    
    // Build disposition options
    const dispositionOptions = Object.values(contactsData.CONTACT_DISPOSITIONS)
        .map(d => `<option value="${d.id}" ${existingContact?.disposition === d.id ? 'selected' : ''}>${d.label}</option>`)
        .join('');
    
    const modalHtml = `
        <div class="contact-modal-overlay" id="contact-modal-overlay">
            <div class="contact-modal">
                <div class="contact-modal-header">
                    ${isEdit ? 'Edit Contact' : 'Add New Contact'}
                </div>
                <div class="contact-modal-body">
                    <label class="contact-form-label">
                        Name
                        <input type="text" id="contact-input-name" class="contact-form-input" 
                               value="${existingContact?.name || ''}" placeholder="Enter name...">
                    </label>
                    
                    <label class="contact-form-label">
                        Relationship
                        <input type="text" id="contact-input-relationship" class="contact-form-input"
                               value="${existingContact?.relationship || ''}" placeholder="Partner, witness, suspect...">
                    </label>
                    
                    <label class="contact-form-label">
                        Disposition
                        <select id="contact-input-disposition" class="contact-form-select">
                            ${dispositionOptions}
                        </select>
                    </label>
                    
                    <label class="contact-form-label">
                        Notes
                        <textarea id="contact-input-notes" class="contact-form-textarea" 
                                  placeholder="Your observations...">${existingContact?.notes || ''}</textarea>
                    </label>
                </div>
                <div class="contact-modal-footer">
                    <button class="contact-modal-btn contact-modal-cancel" id="contact-modal-cancel">Cancel</button>
                    <button class="contact-modal-btn contact-modal-save" id="contact-modal-save">
                        ${isEdit ? 'Save Changes' : 'Add Contact'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const overlay = document.getElementById('contact-modal-overlay');
    const saveBtn = document.getElementById('contact-modal-save');
    const cancelBtn = document.getElementById('contact-modal-cancel');
    const nameInput = document.getElementById('contact-input-name');
    
    // Focus name input
    setTimeout(() => nameInput?.focus(), 100);
    
    // Return promise that resolves when modal closes
    return new Promise((resolve) => {
        const closeModal = (result) => {
            overlay?.remove();
            resolve(result);
        };
        
        // Cancel
        cancelBtn?.addEventListener('click', () => closeModal(null));
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(null);
        });
        
        // Save
        saveBtn?.addEventListener('click', async () => {
            const name = document.getElementById('contact-input-name')?.value?.trim();
            if (!name) {
                nameInput?.focus();
                return;
            }
            
            const contactsData = await getContactsData();
            const contact = existingContact 
                ? { ...existingContact }
                : contactsData.createContact({});
            
            contact.name = name;
            contact.relationship = document.getElementById('contact-input-relationship')?.value?.trim() || '';
            contact.disposition = document.getElementById('contact-input-disposition')?.value || 'neutral';
            contact.notes = document.getElementById('contact-input-notes')?.value?.trim() || '';
            contact.manuallyEdited = true;
            
            closeModal(contact);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle Add Contact button click
 */
async function handleAddContact() {
    const contact = await showContactModal();
    if (contact) {
        await saveContact(contact);
        await renderContactsList();
    }
}

/**
 * Handle Edit button click
 */
async function handleEditContact(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const updated = await showContactModal(contact);
    if (updated) {
        await saveContact(updated);
        await renderContactsList();
    }
}

/**
 * Handle Remove button click
 */
async function handleRemoveContact(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    // Simple confirm
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
    console.log('[Contacts] Initializing handlers...');
    
    // Add Contact button
    const addBtn = document.getElementById('contacts-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', handleAddContact);
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
                await handleEditContact(contactId);
            } else if (removeBtn) {
                e.stopPropagation();
                const contactId = removeBtn.dataset.contactId;
                await handleRemoveContact(contactId);
            }
        });
    }
    
    // Initial render
    await renderContactsList();
    
    console.log('[Contacts] Handlers initialized');
}

/**
 * Refresh contacts display (call after chat change)
 */
export async function refreshContacts() {
    await renderContactsList();
}
