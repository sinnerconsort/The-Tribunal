/**
 * The Tribunal - Status Handlers
 * Wires the RCM Medical Form (Status tab) to state persistence
 * 
 * @version 1.0.1 - Removed 5 unused imports (COPOTYPE_IDS, DUAL_ANCIENT_TRIGGERS, SPINAL_CORD_COMBO, getStatusDisplayName, setRCMCopotype)
 */

import { 
    getVitals, 
    setHealth, 
    setMorale,
    setCopotype,
    addActiveEffect, 
    removeActiveEffect 
} from '../core/state.js';

import { getSkillName } from '../data/setting-profiles.js';

import { STATUS_EFFECTS } from '../data/statuses.js';

import { 
    updateCRTVitals,
    updateRCMFormVitals,
    setRCMStatus
} from './crt-vitals.js';

// ═══════════════════════════════════════════════════════════════
// ANCIENT VOICES DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Ancient Voices - Primal psychological constructs that speak during extreme states
 * These are older than the 24 skills - they represent base-level consciousness
 * 
 * TRIGGER RULES:
 * - The Pale (the_pale) → BOTH Ancient Reptilian Brain AND Limbic System
 * - Party Combo (any 2 of drunk/stimmed/manic) → Spinal Cord
 */
const ANCIENT_VOICES = {
    ancient_reptilian_brain: {
        id: 'ancient_reptilian_brain',
        name: 'Ancient Reptilian Brain',
        icon: 'fa-solid fa-brain',
        description: 'The oldest part of you. Survival. Fear. Hunger. The cold logic of a predator.',
        // ONLY triggered by The Pale - always speaks with Limbic System
        trigger: 'the_pale',
        triggerCondition: 'pale_only',
        personality: 'Cold, calculating, survival-focused. Speaks in primal imperatives.'
    },
    limbic_system: {
        id: 'limbic_system',
        name: 'Limbic System',
        icon: 'fa-solid fa-heart-pulse',
        description: 'Your emotional core. Memory. Feeling. The things that make you human.',
        // ONLY triggered by The Pale - always speaks with Ancient Reptilian Brain
        trigger: 'the_pale',
        triggerCondition: 'pale_only',
        personality: 'Raw emotion, memory fragments, overwhelming sensation. Speaks in feelings.'
    },
    spinal_cord: {
        id: 'spinal_cord',
        name: 'Spinal Cord',
        icon: 'fa-solid fa-bolt',
        description: 'Pure reaction. No thought, only motion. The party never stops.',
        // Triggered by any 2 of: drunk, stimmed, manic
        triggerCombo: ['revacholian_courage', 'pyrholidon', 'tequila_sunset'],
        triggerCondition: 'any_two', // Needs ANY 2 of the combo
        personality: 'Manic energy, disco fever, unstoppable momentum. PARTY.'
    }
};

/**
 * The Pale status ID - the ONLY trigger for ARB and Limbic
 */
const PALE_TRIGGER = 'the_pale';

/**
 * Party states for Spinal Cord - needs any 2
 */
const PARTY_STATES = ['revacholian_courage', 'pyrholidon', 'tequila_sunset'];
const SPINAL_CORD_MIN_PARTY_STATES = 2;

/**
 * Track previously active ancient voices to detect activation changes
 * Used to prevent toast spam - only show toast when voice NEWLY activates
 */
let previouslyActiveAncientVoiceIds = new Set();

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
// COPOTYPE DISPLAY NAME MAP (for profile card sync)
// ═══════════════════════════════════════════════════════════════

const COPOTYPE_DISPLAY_NAMES = {
    'apocalypse_cop': 'Apocalypse Cop',
    'sorry_cop': 'Sorry Cop',
    'boring_cop': 'Boring Cop',
    'honour_cop': 'Honour Cop',
    'art_cop': 'Art Cop',
    'hobocop': 'Hobocop',
    'superstar_cop': 'Superstar Cop',
    'dick_mullen': 'Dick Mullen',
    'human_can_opener': 'Human Can-Opener',
    'innocence': 'Innocence'
};

// ═══════════════════════════════════════════════════════════════
// CHAT SWITCH HANDLING (FIX)
// ═══════════════════════════════════════════════════════════════

/**
 * Reset module-level state when switching chats
 * Prevents stale data from bleeding between chats
 */
export function resetStatusState() {
    previouslyActiveAncientVoiceIds = new Set();
    console.log('[Tribunal] Status state reset for new chat');
}

/**
 * Full handler for chat switch - call this from CHAT_CHANGED
 * Resets state, refreshes UI, and re-initializes tracking
 */
export function onChatChanged() {
    // 1. Reset module-level state
    resetStatusState();
    
    // 2. Refresh UI from new chat's state
    refreshStatusFromState();
    
    // 3. Re-initialize ancient voice tracking from new state
    const currentVoices = getActiveAncientVoices();
    previouslyActiveAncientVoiceIds = new Set(currentVoices.map(v => v.id));
    
    console.log('[Tribunal] Status handlers refreshed for chat switch');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize status tab handlers - call after DOM is ready
 */
export function initStatus() {
    // Load current state into UI
    refreshStatusFromState();
    
    // Initialize the ancient voice tracking from current state
    const currentVoices = getActiveAncientVoices();
    previouslyActiveAncientVoiceIds = new Set(currentVoices.map(v => v.id));
    
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
    
    // Update Ancient Voices display
    updateAncientVoicesDisplay();
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
    const formatSkill = (id) => getSkillName(id, id.replace(/_/g, ' ')).toUpperCase();
    
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
// ANCIENT VOICES DETECTION & DISPLAY
// ═══════════════════════════════════════════════════════════════

/**
 * Get currently active ancient voices based on status effects
 * 
 * TRIGGER RULES:
 * - The Pale (the_pale) → BOTH Ancient Reptilian Brain AND Limbic System
 * - Party Combo (any 2 of drunk/stimmed/manic) → Spinal Cord
 * 
 * @returns {Array} Array of active ancient voice objects
 */
export function getActiveAncientVoices() {
    const vitals = getVitals();
    const activeEffects = vitals.activeEffects || [];
    const activeEffectIds = activeEffects.map(e => 
        typeof e === 'string' ? e : e.id
    ).filter(Boolean);
    
    const activeVoices = [];
    
    // ═══════════════════════════════════════════════════════════
    // THE PALE → Ancient Reptilian Brain + Limbic System (BOTH)
    // This is the ONLY way these two voices can speak
    // ═══════════════════════════════════════════════════════════
    if (activeEffectIds.includes(PALE_TRIGGER)) {
        activeVoices.push({ 
            ...ANCIENT_VOICES.ancient_reptilian_brain, 
            triggerType: 'pale',
            activatedBy: 'the_pale'
        });
        activeVoices.push({ 
            ...ANCIENT_VOICES.limbic_system, 
            triggerType: 'pale',
            activatedBy: 'the_pale'
        });
    }
    
    // ═══════════════════════════════════════════════════════════
    // PARTY COMBO → Spinal Cord
    // Requires any 2 of: drunk, stimmed, manic
    // ═══════════════════════════════════════════════════════════
    const activePartyStates = PARTY_STATES.filter(state => 
        activeEffectIds.includes(state)
    );
    
    if (activePartyStates.length >= SPINAL_CORD_MIN_PARTY_STATES) {
        // Get the display names for the trigger tooltip
        const triggerNames = activePartyStates.map(id => 
            STATUS_EFFECTS[id]?.simpleName || id
        ).join(' + ');
        
        activeVoices.push({ 
            ...ANCIENT_VOICES.spinal_cord, 
            triggerType: 'party_combo',
            activatedBy: triggerNames
        });
    }
    
    return activeVoices;
}

/**
 * Update the Psychological Anomalies (ancient voices) section in the UI
 */
function updateAncientVoicesDisplay() {
    const container = document.getElementById('rcm-ancient-voices');
    if (!container) {
        // Try alternate ID
        const altContainer = document.querySelector('.rcm-ancient-voices-list');
        if (!altContainer) {
            console.log('[Tribunal] Ancient voices container not found');
            return;
        }
        updateAncientVoicesContainer(altContainer);
        return;
    }
    
    updateAncientVoicesContainer(container);
}

/**
 * Update a specific ancient voices container element
 */
function updateAncientVoicesContainer(container) {
    const activeVoices = getActiveAncientVoices();
    
    if (activeVoices.length === 0) {
        container.innerHTML = '<span class="rcm-anomalies-empty"><em>(no anomalies detected)</em></span>';
        return;
    }
    
    // Build display HTML for each active voice
    const voiceElements = activeVoices.map(voice => {
        const triggerInfo = voice.activatedBy 
            ? STATUS_EFFECTS[voice.activatedBy]?.name || voice.activatedBy
            : voice.triggerCombo?.map(id => STATUS_EFFECTS[id]?.simpleName || id).join(' + ');
        
        return `
            <div class="rcm-ancient-voice ${voice.id}">
                <div class="ancient-voice-header">
                    <i class="${voice.icon}"></i>
                    <span class="ancient-voice-name">${voice.name}</span>
                </div>
                <div class="ancient-voice-trigger">
                    <small>triggered by: ${triggerInfo}</small>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = voiceElements;
}

/**
 * Check for NEWLY activated ancient voices and show toast
 * Only shows toast when a voice transitions from inactive to active
 */
function checkAncientVoiceActivation() {
    const currentVoices = getActiveAncientVoices();
    const currentVoiceIds = new Set(currentVoices.map(v => v.id));
    
    // Find voices that are NOW active but WEREN'T before
    const newlyActivated = currentVoices.filter(v => 
        !previouslyActiveAncientVoiceIds.has(v.id)
    );
    
    // Update tracking for next check
    previouslyActiveAncientVoiceIds = currentVoiceIds;
    
    // Show toasts only for newly activated voices
    if (newlyActivated.length > 0 && typeof toastr !== 'undefined') {
        // Check for The Pale trigger (ARB + Limbic together)
        const paleVoice = newlyActivated.find(v => v.triggerType === 'pale');
        if (paleVoice) {
            toastr.warning('🧠 ANCIENT VOICES STIR - Reality dissolves...', 'The Pale', { timeOut: 3000 });
        }
        
        // Check for Spinal Cord (party combo)
        const spinalVoice = newlyActivated.find(v => v.id === 'spinal_cord');
        if (spinalVoice) {
            toastr.warning('⚡ SPINAL CORD AWAKENS - The party never stops!', 'DISCO', { timeOut: 3000 });
        }
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
            
            // Update Active Conditions display
            updateActiveConditionsDisplay();
            
            // Update Ancient Voices display
            updateAncientVoicesDisplay();
            
            // Check for ancient voice activation (smart toast - only on NEW activation)
            checkAncientVoiceActivation();
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
            
            // Update Active Conditions display
            updateActiveConditionsDisplay();
            
            // Update profile card copotype display
            updateProfileCopotype(copytypeId, isCurrentlyActive);
        });
    });
}

/**
 * Update the profile card's copotype display when changed in status tab
 */
function updateProfileCopotype(copytypeId, wasCleared) {
    const copytypeEl = document.getElementById('tribunal-copotype');
    if (!copytypeEl) return;
    
    if (wasCleared || !copytypeId) {
        copytypeEl.textContent = 'Unknown';
    } else {
        // Get display name from lookup or STATUS_EFFECTS
        const displayName = COPOTYPE_DISPLAY_NAMES[copytypeId] 
            || STATUS_EFFECTS[copytypeId]?.name 
            || formatCopotypeId(copytypeId);
        copytypeEl.textContent = displayName;
    }
}

/**
 * Format a copotype ID for display (fallback)
 * e.g., 'human_can_opener' -> 'Human Can-Opener'
 */
function formatCopotypeId(id) {
    if (!id) return 'Unknown';
    return id
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('Can Opener', 'Can-Opener');
}

// ═══════════════════════════════════════════════════════════════
// WINDOW EXPOSURE & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

// Expose for other modules (timed-effects-display, etc.)
window.TribunalStatus = {
    refreshStatusFromState,
    updateActiveConditionsDisplay,
    setStatusByUIName,
    isStatusActive,
    getActiveStatuses,
    resetStatusState,      // NEW: For chat switching
    onChatChanged          // NEW: For chat switching
};

// Listen for refresh requests from other modules
window.addEventListener('tribunal:statusRefreshNeeded', () => {
    refreshStatusFromState();
});

// Also refresh when effects change
window.addEventListener('tribunal:effectApplied', () => {
    updateActiveConditionsDisplay();
});

window.addEventListener('tribunal:effectRemoved', () => {
    updateActiveConditionsDisplay();
});

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
    
    // Update ancient voices
    updateAncientVoicesDisplay();
    
    // Check for ancient voice activation (smart toast)
    checkAncientVoiceActivation();
}

/**
 * Get ancient voices data (for voice generation system)
 * @returns {Object} The ANCIENT_VOICES definitions
 */
export function getAncientVoicesData() {
    return ANCIENT_VOICES;
}
