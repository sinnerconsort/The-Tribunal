/**
 * The Tribunal - Profiles Handlers
 * Wires the wallet/ID card UI to the state persistence layer
 * 
 * @version 1.1.0 - Genre selector wiring, genre change event dispatch
 */

import { 
    getPersona, setPersona, 
    getAttributes, setAttribute,
    getInventory, getVitals, getSettings
} from '../core/state.js';
import { 
    updateCardDisplay, updateMoneyDisplay, 
    initCardFlip, flipCard,
    updateCardLabelsForGenre, updateGenreSelector
} from './profiles-template.js';
import { getActiveProfileId } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initProfiles() {
    initCardFlip();
    refreshProfilesFromState();
    bindProfileInputs();
    bindStatButtons();
    bindActionButtons();
    bindCardSlots();
    bindGenreSelector();
    console.log('[Tribunal] Profiles handlers initialized');
}

export function refreshProfilesFromState() {
    const persona = getPersona();
    const attributes = getAttributes();
    const inventory = getInventory();
    const vitals = getVitals();
    
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
        },
        copotype: vitals.copotype || null
    };
    
    updateCardDisplay(displayData);
    updateMoneyDisplay(inventory.money || 0);
}

// ═══════════════════════════════════════════════════════════════
// INPUT BINDINGS
// ═══════════════════════════════════════════════════════════════

function bindProfileInputs() {
    const nameInput = document.getElementById('tribunal-card-name');
    if (nameInput) {
        nameInput.addEventListener('change', (e) => {
            setPersona({ name: e.target.value });
        });
        nameInput.addEventListener('blur', (e) => {
            setPersona({ name: e.target.value });
        });
    }
    
    const pronounsSelect = document.getElementById('tribunal-card-pronouns');
    if (pronounsSelect) {
        pronounsSelect.addEventListener('change', (e) => {
            setPersona({ pronouns: e.target.value });
        });
    }
    
    const povSelect = document.getElementById('tribunal-pov-style');
    if (povSelect) {
        povSelect.addEventListener('change', (e) => {
            setPersona({ povStyle: e.target.value });
        });
    }
    
    const contextArea = document.getElementById('tribunal-char-context');
    if (contextArea) {
        contextArea.addEventListener('change', (e) => {
            setPersona({ context: e.target.value });
        });
        contextArea.addEventListener('blur', (e) => {
            setPersona({ context: e.target.value });
        });
    }
    
    const notesArea = document.getElementById('tribunal-scene-notes');
    if (notesArea) {
        notesArea.addEventListener('change', (e) => {
            setPersona({ sceneNotes: e.target.value });
        });
        notesArea.addEventListener('blur', (e) => {
            setPersona({ sceneNotes: e.target.value });
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// STAT BUTTONS - Build Editor
// ═══════════════════════════════════════════════════════════════

function bindStatButtons() {
    document.querySelectorAll('.stat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const attr = btn.dataset.attr;
            if (!action || !attr) return;
            
            const attrMap = { 'int': 'intellect', 'psy': 'psyche', 'fys': 'physique', 'mot': 'motorics' };
            const stateName = attrMap[attr];
            if (!stateName) return;
            
            const current = getAttributes()[stateName] || 3;
            const newValue = action === 'inc' ? current + 1 : current - 1;
            
            if (newValue < 1 || newValue > 6) return;
            
            const attrs = getAttributes();
            const currentTotal = attrs.intellect + attrs.psyche + attrs.physique + attrs.motorics;
            const newTotal = currentTotal + (action === 'inc' ? 1 : -1);
            
            setAttribute(stateName, newValue);
            
            const displayEl = document.getElementById(`tribunal-stat-${attr}`);
            const editEl = document.getElementById(`tribunal-edit-${attr}`);
            if (displayEl) displayEl.textContent = newValue;
            if (editEl) editEl.textContent = newValue;
            
            const pointsEl = document.getElementById('tribunal-build-points');
            if (pointsEl) pointsEl.textContent = newTotal;
            
            console.log(`[Tribunal] ${stateName}: ${current} → ${newValue}`);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// GENRE SELECTOR
// ═══════════════════════════════════════════════════════════════

function bindGenreSelector() {
    const selector = document.getElementById('tribunal-genre-selector');
    if (!selector) return;
    
    updateGenreSelector();
    
    selector.addEventListener('change', (e) => {
        const newProfileId = e.target.value;
        if (!newProfileId) return;
        
        // Update setting in state
        const settings = getSettings();
        if (settings) {
            settings.genreProfile = newProfileId;
        }
        
        // Update all genre-dependent labels
        updateCardLabelsForGenre();
        
        // Dispatch so other modules react (accordion, status tab, MEF labels, etc.)
        window.dispatchEvent(new CustomEvent('tribunal:genreChanged', {
            detail: { profileId: newProfileId }
        }));
        
        console.log(`[Tribunal] Genre profile changed to: ${newProfileId}`);
    });
}

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════

function bindActionButtons() {
    const flipBackBtn = document.getElementById('tribunal-flip-back');
    if (flipBackBtn) {
        flipBackBtn.addEventListener('click', () => flipCard(false));
    }
    
    const saveBtn = document.getElementById('tribunal-save-persona');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            flipCard(false);
            console.log('[Tribunal] Persona saved');
        });
    }
    
    const deleteBtn = document.getElementById('tribunal-delete-persona');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Reset persona to defaults?')) {
                resetPersonaToDefaults();
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// CARD SLOTS
// ═══════════════════════════════════════════════════════════════

function bindCardSlots() {
    document.querySelectorAll('.slot-empty[data-action="create-persona"]').forEach(slot => {
        slot.addEventListener('click', () => {
            resetPersonaToDefaults();
            flipCard(true);
            setTimeout(() => {
                document.getElementById('tribunal-card-name')?.focus();
            }, 400);
            console.log('[Tribunal] New identity started');
        });
    });
}

function resetPersonaToDefaults() {
    setPersona({ name: '', pronouns: 'they', povStyle: 'second', context: '', sceneNotes: '' });
    setAttribute('intellect', 3);
    setAttribute('psyche', 3);
    setAttribute('physique', 3);
    setAttribute('motorics', 3);
    refreshProfilesFromState();
    flipCard(false);
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API
// ═══════════════════════════════════════════════════════════════

export function refreshMoney() {
    updateMoneyDisplay(getInventory().money || 0);
}

export function getPersonaFromUI() {
    return {
        name: document.getElementById('tribunal-card-name')?.value || '',
        pronouns: document.getElementById('tribunal-card-pronouns')?.value || 'they',
        povStyle: document.getElementById('tribunal-pov-style')?.value || 'second',
        context: document.getElementById('tribunal-char-context')?.value || ''
    };
}

export function onGenreChanged() {
    updateCardLabelsForGenre();
    refreshProfilesFromState();
}

// Listen for genre changes from other modules (e.g. settings tab)
window.addEventListener('tribunal:genreChanged', () => {
    updateCardLabelsForGenre();
});
