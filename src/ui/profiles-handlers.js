/**
 * The Tribunal - Profiles Handlers
 * Wires the wallet/ID card UI to the state persistence layer
 */

import { 
    getPersona, 
    setPersona, 
    getAttributes, 
    setAttribute,
    getInventory
} from '../core/state.js';
import { 
    updateCardDisplay, 
    updateMoneyDisplay, 
    initCardFlip,
    flipCard 
} from './profiles-template.js';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize profiles tab - call after DOM is ready
 */
export function initProfiles() {
    // Set up card flip behavior
    initCardFlip();
    
    // Load current state into UI
    refreshProfilesFromState();
    
    // Bind all input handlers
    bindProfileInputs();
    bindStatButtons();
    bindActionButtons();
    
    console.log('[Tribunal] Profiles handlers initialized');
}

/**
 * Refresh all profile UI from current state
 */
export function refreshProfilesFromState() {
    const persona = getPersona();
    const attributes = getAttributes();
    const inventory = getInventory();
    
    // Build persona object in format updateCardDisplay expects
    const displayData = {
        id: 'current',
        name: persona.name || '',
        pronouns: persona.pronouns || 'they',
        povStyle: persona.povStyle || 'second',
        context: persona.context || '',
        sceneNotes: persona.sceneNotes || '',
        stats: {
            int: attributes.intellect || 3,
            psy: attributes.psyche || 3,
            fys: attributes.physique || 3,
            mot: attributes.motorics || 3
        }
    };
    
    updateCardDisplay(displayData);
    updateMoneyDisplay(inventory.money || 0);
}

// ═══════════════════════════════════════════════════════════════
// INPUT BINDINGS - Front of Card
// ═══════════════════════════════════════════════════════════════

/**
 * Bind profile input fields to state
 */
function bindProfileInputs() {
    // Name input (front of card)
    const nameInput = document.getElementById('tribunal-card-name');
    if (nameInput) {
        nameInput.addEventListener('change', (e) => {
            setPersona({ name: e.target.value });
            console.log('[Tribunal] Name updated:', e.target.value);
        });
        // Also save on blur for mobile
        nameInput.addEventListener('blur', (e) => {
            setPersona({ name: e.target.value });
        });
    }
    
    // Pronouns select (front of card)
    const pronounsSelect = document.getElementById('tribunal-card-pronouns');
    if (pronounsSelect) {
        pronounsSelect.addEventListener('change', (e) => {
            setPersona({ pronouns: e.target.value });
            console.log('[Tribunal] Pronouns updated:', e.target.value);
        });
    }
    
    // POV style select (back of card)
    const povSelect = document.getElementById('tribunal-pov-style');
    if (povSelect) {
        povSelect.addEventListener('change', (e) => {
            setPersona({ povStyle: e.target.value });
            console.log('[Tribunal] POV style updated:', e.target.value);
        });
    }
    
    // Character context textarea (back of card)
    const contextArea = document.getElementById('tribunal-char-context');
    if (contextArea) {
        contextArea.addEventListener('change', (e) => {
            setPersona({ context: e.target.value });
            console.log('[Tribunal] Context updated');
        });
        contextArea.addEventListener('blur', (e) => {
            setPersona({ context: e.target.value });
        });
    }
    
    // Scene notes textarea (back of card)
    const notesArea = document.getElementById('tribunal-scene-notes');
    if (notesArea) {
        notesArea.addEventListener('change', (e) => {
            setPersona({ sceneNotes: e.target.value });
            console.log('[Tribunal] Scene notes updated');
        });
        notesArea.addEventListener('blur', (e) => {
            setPersona({ sceneNotes: e.target.value });
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// STAT BUTTONS - Build Editor
// ═══════════════════════════════════════════════════════════════

/**
 * Bind stat +/- buttons
 */
function bindStatButtons() {
    const statButtons = document.querySelectorAll('.stat-btn');
    
    statButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action; // 'inc' or 'dec'
            const attr = btn.dataset.attr; // 'int', 'psy', 'fys', 'mot'
            
            if (!action || !attr) return;
            
            // Map short names to state attribute names
            const attrMap = {
                'int': 'intellect',
                'psy': 'psyche',
                'fys': 'physique',
                'mot': 'motorics'
            };
            
            const stateName = attrMap[attr];
            if (!stateName) return;
            
            const current = getAttributes()[stateName] || 3;
            const newValue = action === 'inc' ? current + 1 : current - 1;
            
            // Clamp to valid range (1-6)
            if (newValue < 1 || newValue > 6) {
                console.log(`[Tribunal] ${stateName} at limit: ${current}`);
                return;
            }
            
            // Check total points (max 12 for classic DE build)
            const attrs = getAttributes();
            const currentTotal = attrs.intellect + attrs.psyche + attrs.physique + attrs.motorics;
            const newTotal = currentTotal + (action === 'inc' ? 1 : -1);
            
            // Optional: enforce point limit
            // if (newTotal > 12 && action === 'inc') {
            //     console.log('[Tribunal] Point limit reached');
            //     return;
            // }
            
            // Update state
            setAttribute(stateName, newValue);
            
            // Update UI
            const displayEl = document.getElementById(`tribunal-stat-${attr}`);
            const editEl = document.getElementById(`tribunal-edit-${attr}`);
            if (displayEl) displayEl.textContent = newValue;
            if (editEl) editEl.textContent = newValue;
            
            // Update points display
            const pointsEl = document.getElementById('tribunal-build-points');
            if (pointsEl) pointsEl.textContent = newTotal;
            
            console.log(`[Tribunal] ${stateName}: ${current} → ${newValue}`);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind save/delete/flip buttons
 */
function bindActionButtons() {
    // Flip back button
    const flipBackBtn = document.getElementById('tribunal-flip-back');
    if (flipBackBtn) {
        flipBackBtn.addEventListener('click', () => {
            flipCard(false);
        });
    }
    
    // Save button
    const saveBtn = document.getElementById('tribunal-save-persona');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // State auto-saves, but this is a good place for explicit feedback
            if (typeof toastr !== 'undefined') {
                toastr.success('Persona saved!', 'The Tribunal');
            }
            flipCard(false);
            console.log('[Tribunal] Persona saved');
        });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('tribunal-delete-persona');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Reset persona to defaults?')) {
                // Reset to defaults
                setPersona({
                    name: '',
                    pronouns: 'they',
                    povStyle: 'second',
                    context: ''
                });
                setAttribute('intellect', 3);
                setAttribute('psyche', 3);
                setAttribute('physique', 3);
                setAttribute('motorics', 3);
                
                refreshProfilesFromState();
                flipCard(false);
                
                if (typeof toastr !== 'undefined') {
                    toastr.info('Persona reset', 'The Tribunal');
                }
                console.log('[Tribunal] Persona reset to defaults');
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API
// ═══════════════════════════════════════════════════════════════

/**
 * Update money display from state
 */
export function refreshMoney() {
    const inventory = getInventory();
    updateMoneyDisplay(inventory.money || 0);
}

/**
 * Get current persona from UI (for cases where UI might be ahead of state)
 */
export function getPersonaFromUI() {
    return {
        name: document.getElementById('tribunal-card-name')?.value || '',
        pronouns: document.getElementById('tribunal-card-pronouns')?.value || 'they',
        povStyle: document.getElementById('tribunal-pov-style')?.value || 'second',
        context: document.getElementById('tribunal-char-context')?.value || ''
    };
}
