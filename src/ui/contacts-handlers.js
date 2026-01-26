/**
 * The Tribunal - Contacts Handlers
 * UI handlers for the Ledger contacts system
 * 
 * v2.0.0 - Dossier system with voice quips, inline forms (no modals)
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - Defensive loading
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _contactsData = null;
let _dossier = null;

async function getPersistence() {
    if (!_persistence) {
        try {
            _persistence = await import('../core/persistence.js');
        } catch (e) {
            console.error('[Contacts] Failed to load persistence:', e);
        }
    }
    return _persistence;
}

async function getContactsData() {
    if (!_contactsData) {
        try {
            _contactsData = await import('../data/contacts-data.js');
        } catch (e) {
            console.error('[Contacts] Failed to load contacts-data:', e);
        }
    }
    return _contactsData;
}

async function getDossierModule() {
    if (!_dossier) {
        try {
            _dossier = await import('../systems/contact-dossier.js');
        } catch (e) {
            console.warn('[Contacts] Dossier module not available:', e.message);
        }
    }
    return _dossier;
}

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS HELPERS
// ═══════════════════════════════════════════════════════════════

async function getContacts() {
    const persistence = await getPersistence();
    const state = persistence?.getChatState?.();
    if (!state) return {};
    if (!state.relationships) state.relationships = {};
    return state.relationships;
}

async function saveContact(contact) {
    const persistence = await getPersistence();
    const state = persistence?.getChatState?.();
    if (!state) return;
    
    if (!state.relationships) state.relationships = {};
    state.relationships[contact.id] = contact;
    persistence.saveChatState?.();
}

async function deleteContact(contactId) {
    const persistence = await getPersistence();
    const state = persistence?.getChatState?.();
    if (!state?.relationships?.[contactId]) return;
    
    delete state.relationships[contactId];
    persistence.saveChatState?.();
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render dossier section (consensus + voice quips)
 */
function renderDossier(contact) {
    const dossier = contact.dossier;
    
    if (!dossier || !dossier.consensus) {
        // No dossier yet - show placeholder with generate button
        return `
            <div class="contact-dossier contact-dossier-empty">
                <p class="dossier-placeholder">No dossier generated yet.</p>
                <button class="dossier-generate-btn" data-contact-id="${contact.id}">
                    <i class="fa-solid fa-file-lines"></i> Generate Dossier
                </button>
            </div>
        `;
    }
    
    // Render quips
    const quipsHtml = (dossier.quips || []).map(quip => {
        const stanceClass = quip.stance === 'positive' ? 'quip-positive' : 
                           quip.stance === 'negative' ? 'quip-negative' : 'quip-neutral';
        return `
            <div class="dossier-quip ${stanceClass}">
                <span class="quip-voice">${quip.name}</span>
                <span class="quip-separator">—</span>
                <span class="quip-content">"${quip.content}"</span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="contact-dossier">
            <div class="dossier-consensus">${dossier.consensus}</div>
            ${quipsHtml ? `<div class="dossier-quips">${quipsHtml}</div>` : ''}
            <button class="dossier-refresh-btn" data-contact-id="${contact.id}" title="Regenerate dossier">
                <i class="fa-solid fa-rotate"></i>
            </button>
        </div>
    `;
}

/**
 * Render disposition meter (visual indicator)
 */
function renderDispositionMeter(disposition) {
    const levels = {
        'trusted': 5,
        'neutral': 3,
        'cautious': 2,
        'suspicious': 1,
        'hostile': 0
    };
    const level = levels[disposition] ?? 3;
    
    let dots = '';
    for (let i = 0; i < 5; i++) {
        dots += i < level ? '●' : '○';
    }
    return dots;
}

// ═══════════════════════════════════════════════════════════════
// CONTACT CARD RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render a single contact card with dossier
 */
async function renderContactCard(contact) {
    const contactsData = await getContactsData();
    const disposition = contactsData?.getDisposition?.(contact.disposition) || { label: 'Unknown', color: '#888' };
    
    const meterDots = renderDispositionMeter(contact.disposition);
    
    return `
        <div class="contact-card" data-contact-id="${contact.id}" data-disposition="${contact.disposition || 'neutral'}" data-expanded="false">
            <div class="contact-card-header">
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <span class="contact-relationship">[${(contact.relationship || 'UNKNOWN').toUpperCase()}]</span>
                </div>
            </div>
            
            <div class="contact-card-details">
                ${renderDossier(contact)}
                
                <div class="contact-footer">
                    <div class="contact-disposition-display">
                        <span class="disposition-label" style="color: ${disposition.color}">${disposition.label}</span>
                        <span class="disposition-meter">${meterDots}</span>
                    </div>
                    <div class="contact-actions">
                        <button class="contact-action-btn contact-edit-btn" data-contact-id="${contact.id}">
                            EDIT
                        </button>
                        <button class="contact-action-btn contact-remove-btn" data-contact-id="${contact.id}">
                            DEL
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
    
    // Attach event handlers
    bindCardEvents(listEl);
}

/**
 * Bind event handlers to contact cards
 */
function bindCardEvents(container) {
    // Header click - expand/collapse
    container.querySelectorAll('.contact-card-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const card = header.closest('.contact-card');
            const isExpanded = card.dataset.expanded === 'true';
            card.dataset.expanded = (!isExpanded).toString();
        });
    });
    
    // Generate dossier button
    container.querySelectorAll('.dossier-generate-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const contactId = btn.dataset.contactId;
            await handleGenerateDossier(contactId, btn);
        });
    });
    
    // Refresh dossier button
    container.querySelectorAll('.dossier-refresh-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const contactId = btn.dataset.contactId;
            await handleGenerateDossier(contactId, btn);
        });
    });
    
    // Edit button
    container.querySelectorAll('.contact-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditForm(btn.dataset.contactId);
        });
    });
    
    // Remove button
    container.querySelectorAll('.contact-remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Remove this contact?')) {
                await deleteContact(btn.dataset.contactId);
                await renderContactsList();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Handle dossier generation for a contact
 */
async function handleGenerateDossier(contactId, buttonEl) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const dossierModule = await getDossierModule();
    if (!dossierModule?.generateDossier) {
        toastr?.warning?.('Dossier system not available');
        return;
    }
    
    // Show loading state
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        const dossier = await dossierModule.generateDossier(contact, contactId);
        
        if (dossier) {
            contact.dossier = dossier;
            await saveContact(contact);
            toastr?.success?.(`Dossier generated for ${contact.name}`);
            await renderContactsList();
        } else {
            toastr?.error?.('Failed to generate dossier');
        }
    } catch (error) {
        console.error('[Contacts] Dossier generation error:', error);
        toastr?.error?.('Dossier generation failed');
    } finally {
        if (buttonEl) {
            buttonEl.disabled = false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// INLINE FORMS (No Modals!)
// ═══════════════════════════════════════════════════════════════

/**
 * Get the inline form HTML
 */
async function getInlineFormHtml(contact = null) {
    const contactsData = await getContactsData();
    const dispositions = contactsData?.DISPOSITIONS || {};
    
    const name = contact?.name || '';
    const relationship = contact?.relationship || '';
    const disposition = contact?.disposition || 'neutral';
    
    const dispositionOptions = Object.entries(dispositions)
        .map(([key, d]) => `<option value="${key}" ${key === disposition ? 'selected' : ''}>${d.label}</option>`)
        .join('');
    
    return `
        <div class="contact-inline-form">
            <label class="contact-form-label">NAME</label>
            <input type="text" class="contact-form-input" id="contact-form-name" value="${name}" placeholder="Enter name...">
            
            <label class="contact-form-label">RELATIONSHIP</label>
            <input type="text" class="contact-form-input" id="contact-form-relationship" value="${relationship}" placeholder="Witness, suspect, ally...">
            
            <label class="contact-form-label">DISPOSITION</label>
            <select class="contact-form-select" id="contact-form-disposition">
                ${dispositionOptions}
            </select>
            
            <div class="contact-form-actions">
                <button class="contact-form-btn contact-form-cancel">Cancel</button>
                <button class="contact-form-btn contact-form-save">${contact ? 'Save' : 'Add Contact'}</button>
            </div>
        </div>
    `;
}

/**
 * Show add contact form (inline)
 */
async function showAddForm() {
    const addBtn = document.getElementById('contacts-add-btn');
    if (!addBtn) return;
    
    // Hide button
    addBtn.style.display = 'none';
    
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.id = 'contacts-add-form-container';
    formContainer.innerHTML = await getInlineFormHtml();
    
    // Insert after button
    addBtn.parentNode.insertBefore(formContainer, addBtn.nextSibling);
    
    // Bind form events
    bindAddFormEvents(formContainer);
    
    // Focus name input
    formContainer.querySelector('#contact-form-name')?.focus();
}

/**
 * Hide add contact form
 */
function hideAddForm() {
    const formContainer = document.getElementById('contacts-add-form-container');
    if (formContainer) {
        formContainer.remove();
    }
    
    const addBtn = document.getElementById('contacts-add-btn');
    if (addBtn) {
        addBtn.style.display = '';
    }
}

/**
 * Bind events for the add form
 */
function bindAddFormEvents(formContainer) {
    const cancelBtn = formContainer.querySelector('.contact-form-cancel');
    const saveBtn = formContainer.querySelector('.contact-form-save');
    
    cancelBtn?.addEventListener('click', hideAddForm);
    
    saveBtn?.addEventListener('click', async () => {
        const name = formContainer.querySelector('#contact-form-name')?.value?.trim();
        const relationship = formContainer.querySelector('#contact-form-relationship')?.value?.trim();
        const disposition = formContainer.querySelector('#contact-form-disposition')?.value;
        
        if (!name) {
            toastr?.warning?.('Please enter a name');
            return;
        }
        
        const contact = {
            id: `contact_${Date.now()}`,
            name,
            relationship,
            disposition,
            createdAt: Date.now(),
            voiceOpinions: {},
            dossier: null
        };
        
        await saveContact(contact);
        hideAddForm();
        await renderContactsList();
        toastr?.success?.(`Added ${name} to contacts`);
        
        // Auto-generate dossier after adding (disabled - user can click Generate button)
        // handleGenerateDossier(contact.id, null);
    });
}

/**
 * Show edit form inside a contact card
 */
async function showEditForm(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const card = document.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    if (!card) return;
    
    // Expand card
    card.dataset.expanded = 'true';
    
    // Get form container inside card
    const formContainer = card.querySelector('.contact-edit-form-container');
    if (!formContainer) return;
    
    // Show form
    formContainer.innerHTML = await getInlineFormHtml(contact);
    formContainer.style.display = 'block';
    
    // Hide dossier and footer while editing
    const dossier = card.querySelector('.contact-dossier');
    const footer = card.querySelector('.contact-footer');
    if (dossier) dossier.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    // Bind events
    bindEditFormEvents(formContainer, contactId, card);
}

/**
 * Hide edit form
 */
function hideEditForm(card) {
    const formContainer = card.querySelector('.contact-edit-form-container');
    const dossier = card.querySelector('.contact-dossier');
    const footer = card.querySelector('.contact-footer');
    
    if (formContainer) {
        formContainer.innerHTML = '';
        formContainer.style.display = 'none';
    }
    if (dossier) dossier.style.display = '';
    if (footer) footer.style.display = '';
}

/**
 * Bind events for edit form
 */
function bindEditFormEvents(formContainer, contactId, card) {
    const cancelBtn = formContainer.querySelector('.contact-form-cancel');
    const saveBtn = formContainer.querySelector('.contact-form-save');
    
    cancelBtn?.addEventListener('click', () => hideEditForm(card));
    
    saveBtn?.addEventListener('click', async () => {
        const contacts = await getContacts();
        const contact = contacts[contactId];
        if (!contact) return;
        
        const name = formContainer.querySelector('#contact-form-name')?.value?.trim();
        const relationship = formContainer.querySelector('#contact-form-relationship')?.value?.trim();
        const disposition = formContainer.querySelector('#contact-form-disposition')?.value;
        
        if (!name) {
            toastr?.warning?.('Please enter a name');
            return;
        }
        
        const oldDisposition = contact.disposition;
        
        contact.name = name;
        contact.relationship = relationship;
        contact.disposition = disposition;
        
        await saveContact(contact);
        hideEditForm(card);
        await renderContactsList();
        toastr?.success?.(`Updated ${name}`);
        
        // Regenerate dossier if disposition changed
        if (oldDisposition !== disposition) {
            handleGenerateDossier(contactId, null);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initContactsHandlers() {
    console.log('[Contacts] Initializing handlers...');
    
    // Add contact button
    const addBtn = document.getElementById('contacts-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddForm);
    }
    
    // Initial render
    renderContactsList();
    
    console.log('[Contacts] Handlers initialized');
}

export async function refreshContacts() {
    hideAddForm();
    await renderContactsList();
}

export default {
    initContactsHandlers,
    refreshContacts,
    renderContactsList
};
