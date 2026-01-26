/**
 * The Tribunal - Contacts Handlers
 * UI logic for the contacts section in the Ledger
 * 
 * INLINE FORM VERSION: 
 * - No modals - forms expand inline in the ledger
 * - Add contact = just Name + optional Context
 * - Voices fill in the rest via dossier generation
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
// RENDERING - CONTACT CARDS
// ═══════════════════════════════════════════════════════════════

/**
 * Render a single contact card - shows dossier content
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
// INLINE FORMS - No modals needed!
// ═══════════════════════════════════════════════════════════════

/**
 * Show inline add form - MINIMAL VERSION
 * Replaces the empty state text with a compact form
 */
function showInlineAddForm() {
    // Check if form already exists
    if (document.getElementById('contact-inline-add-form')) {
        return;
    }
    
    const addBtn = document.getElementById('contacts-add-btn');
    const emptyState = document.getElementById('contacts-empty');
    
    if (!addBtn) return;
    
    // Hide the add button and empty state
    addBtn.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    
    // Super minimal form - replaces empty state
    const formHtml = `
        <div class="contact-inline-form" id="contact-inline-add-form">
            <div class="contact-mini-row">
                <input type="text" id="contact-input-name" class="contact-form-input contact-input-name" 
                       placeholder="Name..." autocomplete="off">
            </div>
            <div class="contact-mini-row">
                <input type="text" id="contact-input-context" class="contact-form-input contact-input-context" 
                       placeholder="Context (optional)..." autocomplete="off">
            </div>
            <div class="contact-mini-actions">
                <button class="contact-mini-btn contact-mini-cancel" id="contact-inline-cancel">✕</button>
                <button class="contact-mini-btn contact-mini-save" id="contact-inline-save">ADD</button>
            </div>
        </div>
    `;
    
    // Insert form where empty state was (inside contacts-list)
    const contactsList = document.getElementById('contacts-list');
    if (contactsList) {
        contactsList.insertAdjacentHTML('beforeend', formHtml);
    } else {
        // Fallback: insert after add button
        addBtn.insertAdjacentHTML('afterend', formHtml);
    }
    
    // Focus the name input
    const nameInput = document.getElementById('contact-input-name');
    setTimeout(() => nameInput?.focus(), 50);
    
    // Wire up buttons
    document.getElementById('contact-inline-cancel')?.addEventListener('click', hideInlineAddForm);
    document.getElementById('contact-inline-save')?.addEventListener('click', handleInlineAddSave);
    
    // Also handle Enter key to save
    nameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleInlineAddSave();
        }
    });
    
    // Remove error state on input
    nameInput?.addEventListener('input', () => {
        nameInput.classList.remove('contact-input-error');
    });
}
    
    // Wire up buttons
    document.getElementById('contact-inline-cancel')?.addEventListener('click', hideInlineAddForm);
    document.getElementById('contact-inline-save')?.addEventListener('click', handleInlineAddSave);
    
    // Remove error state on input
    nameInput?.addEventListener('input', () => {
        nameInput.classList.remove('contact-input-error');
    });
}

/**
 * Hide the inline add form
 */
function hideInlineAddForm() {
    const form = document.getElementById('contact-inline-add-form');
    const addBtn = document.getElementById('contacts-add-btn');
    
    form?.remove();
    if (addBtn) {
        addBtn.style.display = '';
    }
}

/**
 * Handle save from inline add form
 */
async function handleInlineAddSave() {
    const nameInput = document.getElementById('contact-input-name');
    const name = nameInput?.value?.trim();
    
    if (!name) {
        nameInput?.classList.add('contact-input-error');
        nameInput?.focus();
        return;
    }
    
    const contactsData = await getContactsData();
    const contact = contactsData.createContact({
        name,
        context: document.getElementById('contact-input-context')?.value?.trim() || '',
        disposition: 'neutral',
        manuallyEdited: false
    });
    
    await saveContact(contact);
    hideInlineAddForm();
    await renderContactsList();
}

/**
 * Show inline edit form (replaces the card content)
 */
async function showInlineEditForm(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const contactsData = await getContactsData();
    const card = document.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    if (!card) return;
    
    // Build disposition options
    const dispositionOptions = Object.values(contactsData.CONTACT_DISPOSITIONS)
        .map(d => `<option value="${d.id}" ${contact.disposition === d.id ? 'selected' : ''}>${d.label}</option>`)
        .join('');
    
    // Store original content so we can restore on cancel
    const originalContent = card.innerHTML;
    card.dataset.originalContent = originalContent;
    card.dataset.editing = 'true';
    
    const formHtml = `
        <div class="contact-inline-form contact-inline-edit-form">
            <div class="contact-inline-form-header">
                // EDIT: ${contact.name.toUpperCase()}
            </div>
            <div class="contact-inline-form-body">
                <label class="contact-form-label">
                    NAME
                    <input type="text" id="contact-edit-name" class="contact-form-input" 
                           value="${contact.name || ''}" autocomplete="off">
                </label>
                
                <label class="contact-form-label">
                    CONTEXT
                    <textarea id="contact-edit-context" class="contact-form-textarea"
                              placeholder="First impression, where you met...">${contact.context || ''}</textarea>
                </label>
                
                <label class="contact-form-label">
                    YOUR READ
                    <select id="contact-edit-disposition" class="contact-form-select">
                        ${dispositionOptions}
                    </select>
                </label>
                
                <label class="contact-form-label">
                    NOTES
                    <textarea id="contact-edit-notes" class="contact-form-textarea contact-form-notes" 
                              placeholder="Additional observations...">${contact.notes || ''}</textarea>
                </label>
            </div>
            <div class="contact-inline-form-actions">
                <button class="contact-inline-btn contact-inline-cancel" data-contact-id="${contactId}">
                    CANCEL
                </button>
                <button class="contact-inline-btn contact-inline-save" data-contact-id="${contactId}">
                    SAVE
                </button>
            </div>
        </div>
    `;
    
    card.innerHTML = formHtml;
    
    // Find the scrollable panel content container and scroll to show the card
    const panelContent = document.querySelector('.ie-panel-content');
    if (panelContent && card) {
        setTimeout(() => {
            const cardRect = card.getBoundingClientRect();
            const containerRect = panelContent.getBoundingClientRect();
            const scrollNeeded = cardRect.bottom - containerRect.bottom + 20;
            
            if (scrollNeeded > 0) {
                panelContent.scrollTop += scrollNeeded;
            }
        }, 50);
    }
    
    // Focus name input (after scroll)
    const nameInput = document.getElementById('contact-edit-name');
    setTimeout(() => nameInput?.focus(), 150);
    
    // Wire up buttons
    card.querySelector('.contact-inline-cancel')?.addEventListener('click', () => hideInlineEditForm(contactId));
    card.querySelector('.contact-inline-save')?.addEventListener('click', () => handleInlineEditSave(contactId));
}

/**
 * Hide inline edit form (restore original card)
 */
async function hideInlineEditForm(contactId) {
    // Just re-render the whole list - simpler than restoring individual cards
    await renderContactsList();
}

/**
 * Handle save from inline edit form
 */
async function handleInlineEditSave(contactId) {
    const contacts = await getContacts();
    const contact = contacts[contactId];
    if (!contact) return;
    
    const nameInput = document.getElementById('contact-edit-name');
    const name = nameInput?.value?.trim();
    
    if (!name) {
        nameInput?.classList.add('contact-input-error');
        nameInput?.focus();
        return;
    }
    
    contact.name = name;
    contact.context = document.getElementById('contact-edit-context')?.value?.trim() || '';
    contact.disposition = document.getElementById('contact-edit-disposition')?.value || 'neutral';
    contact.notes = document.getElementById('contact-edit-notes')?.value?.trim() || '';
    contact.manuallyEdited = true;
    
    await saveContact(contact);
    await renderContactsList();
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
        return;
    }
    
    // Find the button and show loading state
    const generateBtn = document.querySelector(`.contact-generate-btn[data-contact-id="${contactId}"], .contact-regenerate-btn[data-contact-id="${contactId}"]`);
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
    }
    
    try {
        const dossier = await dossierModule.generateDossier(contact);
        
        if (dossier) {
            contact.dossier = dossier;
            await saveContact(contact);
            await renderContactsList();
        }
    } catch (e) {
        console.error('[Contacts] Dossier generation failed:', e);
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
 * Handle Add Contact button click - shows inline form
 */
function handleAddContact() {
    showInlineAddForm();
}

/**
 * Handle Edit button click - shows inline edit form
 */
async function handleEditContact(contactId) {
    await showInlineEditForm(contactId);
}

/**
 * Handle Remove button click
 */
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
    console.log('[Contacts] Initializing handlers...');
    
    // Add Contact button - shows inline form
    const addBtn = document.getElementById('contacts-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', handleAddContact);
    }
    
    // Delegate clicks on the list container
    const listEl = document.getElementById('contacts-list');
    if (listEl) {
        listEl.addEventListener('click', async (e) => {
            // Don't handle clicks if we're inside an edit form
            if (e.target.closest('.contact-inline-edit-form')) {
                return;
            }
            
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
    // Hide any open forms first
    hideInlineAddForm();
    await renderContactsList();
}
