/**
 * The Tribunal - Contacts Handlers
 * UI logic for the contacts section in the Ledger
 * 
 * SIMPLIFIED VERSION: 
 * - Add contact = just Name + optional Context
 * - Voices fill in the rest via dossier generation
 * - Edit still allows full control
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - Only load when actually needed
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _contactsData = null;
let _contactDossier = null;

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

async function getContactDossier() {
    if (!_contactDossier) {
        try {
            _contactDossier = await import('./contact-dossier.js');
        } catch (e) {
            console.error('[Contacts] Could not load contact-dossier:', e.message);
            _contactDossier = null;
        }
    }
    return _contactDossier;
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
 * Render a single contact card - now shows dossier content!
 */
async function renderContactCard(contact) {
    const contactsData = await getContactsData();
    const disposition = contactsData.getDisposition(contact.disposition);
    
    // Check if we have dossier content
    const hasDossier = contact.dossier?.consensus || contact.dossier?.voiceQuips?.length > 0;
    const hasVoiceOpinions = Object.keys(contact.voiceOpinions || {}).length > 0;
    
    // Build voice quips HTML if we have them
    let voiceQuipsHtml = '';
    if (contact.dossier?.voiceQuips?.length > 0) {
        voiceQuipsHtml = contact.dossier.voiceQuips.map(quip => `
            <div class="contact-voice-quip" data-voice="${quip.voiceId}">
                <span class="contact-voice-name">${quip.voiceName}</span>
                <span class="contact-voice-dash">–</span>
                <span class="contact-voice-text">"${quip.text}"</span>
            </div>
        `).join('');
    }
    
    // Status indicator for dossier
    let dossierStatus = '';
    if (hasDossier) {
        dossierStatus = `<span class="contact-dossier-status has-dossier" title="Dossier generated">●●●○○</span>`;
    } else if (hasVoiceOpinions) {
        dossierStatus = `<span class="contact-dossier-status partial" title="Voice opinions recorded">●●○○○</span>`;
    } else {
        dossierStatus = `<span class="contact-dossier-status empty" title="No dossier yet">●○○○○</span>`;
    }
    
    return `
        <div class="contact-card" data-contact-id="${contact.id}" data-disposition="${contact.disposition || 'neutral'}" data-expanded="false">
            <div class="contact-card-header">
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <span class="contact-disposition" style="color: ${disposition.color}">[${disposition.label.toUpperCase()}]</span>
                </div>
                ${dossierStatus}
            </div>
            
            <div class="contact-card-details">
                ${contact.context ? `<div class="contact-context">${contact.context}</div>` : ''}
                
                ${contact.dossier?.consensus ? `
                    <div class="contact-consensus">
                        <div class="contact-consensus-text">${contact.dossier.consensus}</div>
                        <button class="contact-regenerate-btn" data-contact-id="${contact.id}" title="Regenerate dossier">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                ` : `
                    <div class="contact-no-dossier">
                        <span class="contact-no-dossier-text">A void. A blank space where a person should be.</span>
                        <button class="contact-generate-btn" data-contact-id="${contact.id}">
                            <i class="fa-solid fa-brain"></i> GENERATE DOSSIER
                        </button>
                    </div>
                `}
                
                ${voiceQuipsHtml ? `
                    <div class="contact-voice-quips">
                        ${voiceQuipsHtml}
                    </div>
                ` : ''}
                
                <div class="contact-actions">
                    <button class="contact-action-btn contact-edit-btn" data-contact-id="${contact.id}">
                        EDIT
                    </button>
                    <button class="contact-action-btn contact-remove-btn" data-contact-id="${contact.id}">
                        DEL
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
// MODAL DIALOGS
// ═══════════════════════════════════════════════════════════════

/**
 * Show SIMPLIFIED add contact modal - just name + context
 */
async function showAddContactModal() {
    const modalHtml = `
        <div class="contact-modal-overlay" id="contact-modal-overlay">
            <div class="contact-modal contact-modal-add">
                <div class="contact-modal-header">
                    // NEW CASE FILE ENTRY
                </div>
                <div class="contact-modal-body">
                    <label class="contact-form-label">
                        NAME
                        <input type="text" id="contact-input-name" class="contact-form-input" 
                               placeholder="Who are they?">
                    </label>
                    
                    <label class="contact-form-label">
                        CONTEXT <span class="contact-form-optional">(optional)</span>
                        <textarea id="contact-input-context" class="contact-form-textarea" 
                                  placeholder="Where did you meet? What do you know?"></textarea>
                    </label>
                    
                    <div class="contact-form-hint">
                        <i class="fa-solid fa-brain"></i>
                        The voices will fill in the rest.
                    </div>
                </div>
                <div class="contact-modal-footer">
                    <button class="contact-modal-btn contact-modal-cancel" id="contact-modal-cancel">
                        CANCEL
                    </button>
                    <button class="contact-modal-btn contact-modal-save" id="contact-modal-save">
                        ADD CONTACT
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
                nameInput?.classList.add('contact-input-error');
                nameInput?.focus();
                return;
            }
            
            const contactsData = await getContactsData();
            const contact = contactsData.createContact({
                name,
                context: document.getElementById('contact-input-context')?.value?.trim() || '',
                disposition: 'neutral',  // Default - voices will suggest changes
                manuallyEdited: false
            });
            
            closeModal(contact);
        });
        
        // Remove error state on input
        nameInput?.addEventListener('input', () => {
            nameInput.classList.remove('contact-input-error');
        });
    });
}

/**
 * Show FULL edit contact modal - allows disposition, notes, etc.
 */
async function showEditContactModal(existingContact) {
    const contactsData = await getContactsData();
    
    // Build disposition options
    const dispositionOptions = Object.values(contactsData.CONTACT_DISPOSITIONS)
        .map(d => `<option value="${d.id}" ${existingContact.disposition === d.id ? 'selected' : ''}>${d.label}</option>`)
        .join('');
    
    const modalHtml = `
        <div class="contact-modal-overlay" id="contact-modal-overlay">
            <div class="contact-modal contact-modal-edit">
                <div class="contact-modal-header">
                    // EDIT: ${existingContact.name.toUpperCase()}
                </div>
                <div class="contact-modal-body">
                    <label class="contact-form-label">
                        NAME
                        <input type="text" id="contact-input-name" class="contact-form-input" 
                               value="${existingContact.name || ''}">
                    </label>
                    
                    <label class="contact-form-label">
                        CONTEXT
                        <textarea id="contact-input-context" class="contact-form-textarea"
                                  placeholder="First impression, where you met...">${existingContact.context || ''}</textarea>
                    </label>
                    
                    <label class="contact-form-label">
                        YOUR READ
                        <select id="contact-input-disposition" class="contact-form-select">
                            ${dispositionOptions}
                        </select>
                    </label>
                    
                    <label class="contact-form-label">
                        NOTES
                        <textarea id="contact-input-notes" class="contact-form-textarea contact-form-notes" 
                                  placeholder="Additional observations...">${existingContact.notes || ''}</textarea>
                    </label>
                </div>
                <div class="contact-modal-footer">
                    <button class="contact-modal-btn contact-modal-cancel" id="contact-modal-cancel">
                        CANCEL
                    </button>
                    <button class="contact-modal-btn contact-modal-save" id="contact-modal-save">
                        SAVE CHANGES
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
                nameInput?.classList.add('contact-input-error');
                nameInput?.focus();
                return;
            }
            
            const contact = { ...existingContact };
            contact.name = name;
            contact.context = document.getElementById('contact-input-context')?.value?.trim() || '';
            contact.disposition = document.getElementById('contact-input-disposition')?.value || 'neutral';
            contact.notes = document.getElementById('contact-input-notes')?.value?.trim() || '';
            contact.manuallyEdited = true;
            
            closeModal(contact);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate dossier for a contact
 */
async function handleGenerateDossier(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    // Get the dossier generator
    const dossierModule = await getContactDossier();
    if (!dossierModule?.generateDossier) {
        console.error('[Contacts] Dossier generation not available');
        // Could show a toast here
        return;
    }
    
    // Find the card and show loading state
    const card = document.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    const generateBtn = card?.querySelector('.contact-generate-btn, .contact-regenerate-btn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
    }
    
    try {
        // Generate the dossier
        const dossier = await dossierModule.generateDossier(contact);
        
        if (dossier) {
            contact.dossier = dossier;
            await saveContact(contact);
            await renderContactsList();
        }
    } catch (e) {
        console.error('[Contacts] Dossier generation failed:', e);
        // Reset button state
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fa-solid fa-brain"></i> GENERATE DOSSIER';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle Add Contact button click
 */
async function handleAddContact() {
    const contact = await showAddContactModal();
    if (contact) {
        await saveContact(contact);
        await renderContactsList();
        
        // Optionally auto-generate dossier after adding
        // await handleGenerateDossier(contact.id);
    }
}

/**
 * Handle Edit button click
 */
async function handleEditContact(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const updated = await showEditContactModal(contact);
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
    
    // Delegate clicks on the list container
    const listEl = document.getElementById('contacts-list');
    if (listEl) {
        listEl.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.contact-edit-btn');
            const removeBtn = e.target.closest('.contact-remove-btn');
            const generateBtn = e.target.closest('.contact-generate-btn');
            const regenerateBtn = e.target.closest('.contact-regenerate-btn');
            
            if (editBtn) {
                e.stopPropagation();
                await handleEditContact(editBtn.dataset.contactId);
            } else if (removeBtn) {
                e.stopPropagation();
                await handleRemoveContact(removeBtn.dataset.contactId);
            } else if (generateBtn || regenerateBtn) {
                e.stopPropagation();
                const contactId = (generateBtn || regenerateBtn).dataset.contactId;
                await handleGenerateDossier(contactId);
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
