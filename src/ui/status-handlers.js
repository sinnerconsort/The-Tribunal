/**
 * The Tribunal - Status Handlers
 * Wires the RCM Medical Form (Status tab) to state persistence
 */

import { 
    getVitals, 
    setHealth, 
    setMorale,
    setCopotype,
    addActiveEffect, 
    removeActiveEffect 
} from '../core/state.js';

import { 
    STATUS_EFFECTS, 
    COPOTYPE_IDS,
    getStatusDisplayName 
} from '../data/statuses.js';

import { 
    updateCRTVitals,
    updateRCMFormVitals,
    setRCMStatus,
    setRCMCopotype 
} from './crt-vitals.js';

// ═══════════════════════════════════════════════════════════════
// STATUS ID MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Map from simple UI status names to full DE status IDs
 * UI uses: data-status="drunk"
 * State uses: 'revacholian_courage'
 */
const STATUS_UI_TO_ID = {
    // Physical
    'drunk': 'revacholian_courage',
    'stimmed': 'pyrholidon',
    'smoking': 'nicotine_rush',
    'hungover': 'volumetric_shit_compressor',
    'wounded': 'finger_on_the_eject_button',
    'exhausted': 'waste_land',
    'dying': 'white_mourning',
    // Mental
    'manic': 'tequila_sunset',
    'dissociated': 'the_pale',
    'infatuated': 'homo_sexual_underground',
    'lucky': 'jamrock_shuffle',
    'terrified': 'caustic_echo',
    'enraged': 'law_jaw',
    'grieving': 'the_expression'
};

/**
 * Reverse mapping: DE ID to UI name
 */
const STATUS_ID_TO_UI = Object.fromEntries(
    Object.entries(STATUS_UI_TO_ID).map(([ui, id]) => [id, ui])
);

/**
 * Map from UI copotype names to full IDs
 */
const COPOTYPE_UI_TO_ID = {
    'apocalypse-cop': 'apocalypse_cop',
    'sorry-cop': 'sorry_cop',
    'boring-cop': 'boring_cop',
    'honour-cop': 'honour_cop',
    'art-cop': 'art_cop',
    'hobocop': 'hobocop',
    'superstar-cop': 'superstar_cop',
    'dick-mullen': 'dick_mullen',
    'human-can-opener': 'human_can_opener',
    'innocence': 'innocence'
};

const COPOTYPE_ID_TO_UI = Object.fromEntries(
    Object.entries(COPOTYPE_UI_TO_ID).map(([ui, id]) => [id, ui])
);

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize status tab handlers - call after DOM is ready
 */
export function initStatus() {
    // Load current state into UI
    refreshStatusFromState();
    
    // Bind checkbox handlers
    bindStatusCheckboxes();
    bindCopotypeSelection();
    bindVitalsControls();
    
    console.log('[Tribunal] Status handlers initialized');
}

/**
 * Refresh all status UI from current state
 */
export function refreshStatusFromState() {
    const vitals = getVitals();
    
    // Update vitals display
    updateCRTVitals(
        vitals.health, 
        vitals.maxHealth, 
        vitals.morale, 
        vitals.maxMorale, 
        '' // Name comes from persona, handled elsewhere
    );
    
    // Update RCM form vitals
    updateRCMFormVitals(vitals.health, vitals.maxHealth, vitals.morale, vitals.maxMorale);
    
    // Update status checkboxes
    const activeEffects = vitals.activeEffects || [];
    
    // Reset all checkboxes first
    document.querySelectorAll('.rcm-checkbox').forEach(checkbox => {
        const uiStatus = checkbox.dataset.status;
        const statusId = STATUS_UI_TO_ID[uiStatus];
        // activeEffects contains objects with .id property
        const isActive = statusId && activeEffects.some(e => e.id === statusId);
        
        checkbox.classList.toggle('rcm-checked', isActive);
        const label = checkbox.querySelector('.rcm-checkbox-label');
        if (label) {
            label.textContent = isActive ? checkbox.dataset.labelOn : checkbox.dataset.labelOff;
        }
    });
    
    // Update copotype selection
    const activeCopotype = vitals.copotype;
    document.querySelectorAll('.rcm-copotype-item').forEach(item => {
        const uiCopotype = item.dataset.copotype;
        const copytypeId = COPOTYPE_UI_TO_ID[uiCopotype];
        const isActive = copytypeId && copytypeId === activeCopotype;
        
        item.classList.toggle('rcm-copotype-active', isActive);
        const box = item.querySelector('.rcm-copotype-box');
        if (box) {
            box.textContent = isActive ? '☒' : '□';
        }
    });
    
    // Update Active Conditions display
    updateActiveConditionsDisplay();
}

/**
 * Update the Active Conditions section to show aggregated skill modifiers
 */
function updateActiveConditionsDisplay() {
    const container = document.getElementById('rcm-active-effects');
    if (!container) return;
    
    const vitals = getVitals();
    const activeEffects = vitals.activeEffects || [];
    const copotype = vitals.copotype;
    
    // Aggregate all boosts and debuffs
    const boosts = {};  // skillId -> total bonus
    const debuffs = {}; // skillId -> total penalty
    
    // Process status effects
    for (const effect of activeEffects) {
        const statusData = STATUS_EFFECTS[effect.id];
        if (!statusData) continue;
        
        // Add boosts
        if (statusData.boosts) {
            for (const skill of statusData.boosts) {
                boosts[skill] = (boosts[skill] || 0) + 1;
            }
        }
        
        // Add debuffs
        if (statusData.debuffs) {
            for (const skill of statusData.debuffs) {
                debuffs[skill] = (debuffs[skill] || 0) + 1;
            }
        }
    }
    
    // Process copotype
    if (copotype && STATUS_EFFECTS[copotype]) {
        const copoData = STATUS_EFFECTS[copotype];
        if (copoData.boosts) {
            for (const skill of copoData.boosts) {
                boosts[skill] = (boosts[skill] || 0) + 1;
            }
        }
        if (copoData.debuffs) {
            for (const skill of copoData.debuffs) {
                debuffs[skill] = (debuffs[skill] || 0) + 1;
            }
        }
    }
    
    // Build display HTML
    const lines = [];
    
    // Format skill name for display (e.g., 'physical_instrument' -> 'PHYSICAL INSTRUMENT')
    const formatSkill = (id) => id.replace(/_/g, ' ').toUpperCase();
    
    // Add boosts (green/positive)
    for (const [skill, amount] of Object.entries(boosts)) {
        lines.push(`<span class="rcm-buff">+${amount} ${formatSkill(skill)}</span>`);
    }
    
    // Add debuffs (red/negative)
    for (const [skill, amount] of Object.entries(debuffs)) {
        lines.push(`<span class="rcm-debuff">-${amount} ${formatSkill(skill)}</span>`);
    }
    
    // Update display
    if (lines.length === 0) {
        container.innerHTML = '<span class="rcm-conditions-empty">(none reported)</span>';
    } else {
        container.innerHTML = lines.join(' ');
    }
}

// ═══════════════════════════════════════════════════════════════
// STATUS CHECKBOX BINDINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind status effect checkboxes (drunk, manic, etc.)
 */
function bindStatusCheckboxes() {
    document.querySelectorAll('.rcm-checkbox').forEach(checkbox => {
        // Remove any existing listener by cloning
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
        
        newCheckbox.addEventListener('click', () => {
            const uiStatus = newCheckbox.dataset.status;
            const statusId = STATUS_UI_TO_ID[uiStatus];
            
            if (!statusId) {
                console.warn(`[Tribunal] Unknown status: ${uiStatus}`);
                return;
            }
            
            const isCurrentlyChecked = newCheckbox.classList.contains('rcm-checked');
            
            if (isCurrentlyChecked) {
                // Remove effect
                removeActiveEffect(statusId);
                newCheckbox.classList.remove('rcm-checked');
                const label = newCheckbox.querySelector('.rcm-checkbox-label');
                if (label) label.textContent = newCheckbox.dataset.labelOff;
                console.log(`[Tribunal] Removed status: ${statusId}`);
            } else {
                // Add effect - pass object with id, name, type
                const statusData = STATUS_EFFECTS[statusId];
                addActiveEffect({
                    id: statusId,
                    name: statusData?.name || statusId,
                    simpleName: statusData?.simpleName || statusId,
                    type: 'status'
                });
                newCheckbox.classList.add('rcm-checked');
                const label = newCheckbox.querySelector('.rcm-checkbox-label');
                if (label) label.textContent = newCheckbox.dataset.labelOn;
                console.log(`[Tribunal] Added status: ${statusId}`);
            }
            
            // Show toast feedback
            const statusData = STATUS_EFFECTS[statusId];
            if (typeof toastr !== 'undefined' && statusData) {
                const name = isCurrentlyChecked ? statusData.simpleName : statusData.name;
                const action = isCurrentlyChecked ? 'Removed' : 'Applied';
                toastr.info(`${action}: ${name}`, 'Status Effect', { timeOut: 1500 });
            }
            
            // Update Active Conditions display
            updateActiveConditionsDisplay();
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// COPOTYPE SELECTION BINDINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind copotype selection (mutually exclusive)
 */
function bindCopotypeSelection() {
    document.querySelectorAll('.rcm-copotype-item').forEach(item => {
        // Remove any existing listener by cloning
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', () => {
            const uiCopotype = newItem.dataset.copotype;
            const copytypeId = COPOTYPE_UI_TO_ID[uiCopotype];
            
            if (!copytypeId) {
                console.warn(`[Tribunal] Unknown copotype: ${uiCopotype}`);
                return;
            }
            
            const isCurrentlyActive = newItem.classList.contains('rcm-copotype-active');
            
            if (isCurrentlyActive) {
                // Deselect - clear copotype
                setCopotype(null);
                newItem.classList.remove('rcm-copotype-active');
                const box = newItem.querySelector('.rcm-copotype-box');
                if (box) box.textContent = '□';
                console.log(`[Tribunal] Cleared copotype`);
            } else {
                // Select this copotype - clear others first
                document.querySelectorAll('.rcm-copotype-item').forEach(other => {
                    other.classList.remove('rcm-copotype-active');
                    const otherBox = other.querySelector('.rcm-copotype-box');
                    if (otherBox) otherBox.textContent = '□';
                });
                
                // Set new copotype
                setCopotype(copytypeId);
                newItem.classList.add('rcm-copotype-active');
                const box = newItem.querySelector('.rcm-copotype-box');
                if (box) box.textContent = '☒';
                console.log(`[Tribunal] Set copotype: ${copytypeId}`);
            }
            
            // Show toast feedback
            const copytypeData = STATUS_EFFECTS[copytypeId];
            if (typeof toastr !== 'undefined' && copytypeData) {
                if (isCurrentlyActive) {
                    toastr.info('Copotype cleared', 'Identity', { timeOut: 1500 });
                } else {
                    toastr.success(`You are now: ${copytypeData.name}`, 'Copotype', { timeOut: 2000 });
                }
            }
            
            // Update Active Conditions display
            updateActiveConditionsDisplay();
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// VITALS CONTROLS - Manual +/- buttons
// ═══════════════════════════════════════════════════════════════

/**
 * Bind vitals adjustment controls (+/- buttons)
 */
function bindVitalsControls() {
    document.querySelectorAll('.rcm-vital-btn').forEach(btn => {
        // Remove existing listener by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', () => {
            const vital = newBtn.dataset.vital; // 'health' or 'morale'
            const delta = parseInt(newBtn.dataset.delta, 10); // 1 or -1
            
            const vitals = getVitals();
            
            if (vital === 'health') {
                const newValue = Math.max(0, Math.min(vitals.maxHealth, vitals.health + delta));
                setHealth(newValue);
            } else if (vital === 'morale') {
                const newValue = Math.max(0, Math.min(vitals.maxMorale, vitals.morale + delta));
                setMorale(newValue);
            }
            
            // Refresh display
            refreshStatusFromState();
            
            // Also update CRT header
            const updatedVitals = getVitals();
            updateCRTVitals(
                updatedVitals.health,
                updatedVitals.maxHealth,
                updatedVitals.morale,
                updatedVitals.maxMorale,
                '' // Name handled elsewhere
            );
            
            console.log(`[Tribunal] ${vital} ${delta > 0 ? '+' : ''}${delta} → ${vital === 'health' ? updatedVitals.health : updatedVitals.morale}`);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a status effect is currently active
 * @param {string} statusId - The full DE status ID (e.g., 'revacholian_courage')
 * @returns {boolean}
 */
export function isStatusActive(statusId) {
    const vitals = getVitals();
    // activeEffects contains objects with .id property
    return vitals.activeEffects?.some(e => e.id === statusId) ?? false;
}

/**
 * Get all currently active status effect IDs
 * @returns {string[]} Array of status IDs
 */
export function getActiveStatuses() {
    const vitals = getVitals();
    // Extract IDs from effect objects
    return (vitals.activeEffects || []).map(e => e.id);
}

/**
 * Get current copotype
 * @returns {string|null}
 */
export function getCurrentCopotype() {
    const vitals = getVitals();
    return vitals.copotype;
}

/**
 * Programmatically toggle a status by UI name
 * @param {string} uiStatus - Simple name like 'drunk', 'manic'
 * @param {boolean} active - Whether to activate or deactivate
 */
export function setStatusByUIName(uiStatus, active) {
    const statusId = STATUS_UI_TO_ID[uiStatus];
    if (!statusId) {
        console.warn(`[Tribunal] Unknown UI status: ${uiStatus}`);
        return;
    }
    
    if (active) {
        const statusData = STATUS_EFFECTS[statusId];
        addActiveEffect({
            id: statusId,
            name: statusData?.name || statusId,
            simpleName: statusData?.simpleName || statusId,
            type: 'status'
        });
    } else {
        removeActiveEffect(statusId);
    }
    
    // Update UI
    setRCMStatus(uiStatus, active);
}
