/**
 * The Tribunal - Timed Effects Display
 * Renders active consumable effects with message countdown on vitals tab
 * 
 * Shows: Effect name, stacks, remaining messages, progress bar
 * Updates: On effect apply/remove/tick events
 * Syncs: OBSERVED STATES checkboxes with active effects
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Map effect IDs to UI checkbox data-status values
 * Must match STATUS_UI_TO_ID in status-handlers.js
 */
const EFFECT_ID_TO_UI_STATUS = {
    // Physical states
    revacholian_courage: 'drunk',
    nicotine_rush: 'smoking',
    pyrholidon: 'stimmed',
    speed_freaks_delight: 'stimmed',
    volumetric_shit_compressor: 'hungover',
    finger_on_the_eject_button: 'wounded',
    waste_land: 'exhausted',
    white_mourning: 'dying',
    
    // Mental states
    tequila_sunset: 'manic',
    the_pale: 'dissociated',
    the_expression: 'grieving',
    homo_sexual_underground: 'infatuated',
    jamrock_shuffle: 'lucky',
    caustic_echo: 'terrified',
    law_jaw: 'enraged'
};

const EXPIRING_THRESHOLD = 2;

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS
// ═══════════════════════════════════════════════════════════════

function getTimedEffects() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return [];
        
        const state = getChatState();
        const allEffects = state?.vitals?.activeEffects || [];
        
        return allEffects.filter(e => 
            typeof e.remainingMessages === 'number' && 
            e.remainingMessages > 0
        );
    } catch (e) {
        console.warn('[TimedFX] Could not get effects:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// CHECKBOX SYNC - Uses .rcm-checkbox[data-status] + .rcm-checked
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle observed state checkbox by UI status name
 * Uses the same structure as status-handlers.js
 * 
 * @param {string} uiStatus - The data-status value (e.g., 'drunk', 'smoking')
 * @param {boolean} checked - Whether to check or uncheck
 */
function setObservedState(uiStatus, checked) {
    const checkbox = document.querySelector(`.rcm-checkbox[data-status="${uiStatus}"]`);
    if (!checkbox) {
        console.warn(`[TimedFX] Checkbox not found: data-status="${uiStatus}"`);
        return false;
    }
    
    if (checked) {
        checkbox.classList.add('rcm-checked');
    } else {
        checkbox.classList.remove('rcm-checked');
    }
    
    // Update label if it has labelOn/labelOff data attributes
    const label = checkbox.querySelector('.rcm-checkbox-label');
    if (label) {
        const labelText = checked ? checkbox.dataset.labelOn : checkbox.dataset.labelOff;
        if (labelText) label.textContent = labelText;
    }
    
    console.log(`[TimedFX] Set ${uiStatus} = ${checked}`);
    return true;
}

/**
 * Get UI status name for an effect ID
 */
function getUIStatusForEffect(effectId) {
    return EFFECT_ID_TO_UI_STATUS[effectId] || null;
}

/**
 * Sync all observed state checkboxes with current active effects
 */
function syncObservedStatesCheckboxes() {
    const effects = getTimedEffects();
    
    // Build set of UI statuses that should be checked
    const activeUIStatuses = new Set();
    for (const effect of effects) {
        const uiStatus = getUIStatusForEffect(effect.id);
        if (uiStatus) {
            activeUIStatuses.add(uiStatus);
        }
    }
    
    // Sync all managed checkboxes
    const managedStatuses = Object.values(EFFECT_ID_TO_UI_STATUS);
    const uniqueStatuses = [...new Set(managedStatuses)];
    
    for (const uiStatus of uniqueStatuses) {
        const shouldBeChecked = activeUIStatuses.has(uiStatus);
        const checkbox = document.querySelector(`.rcm-checkbox[data-status="${uiStatus}"]`);
        
        if (checkbox) {
            const isCurrentlyChecked = checkbox.classList.contains('rcm-checked');
            if (isCurrentlyChecked !== shouldBeChecked) {
                setObservedState(uiStatus, shouldBeChecked);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDERING (Typewriter style - no emojis)
// ═══════════════════════════════════════════════════════════════

function getEffectType(statusId) {
    const status = STATUS_EFFECTS[statusId];
    if (!status) return 'mixed';
    
    const hasBoosts = status.boosts && status.boosts.length > 0;
    const hasDebuffs = status.debuffs && status.debuffs.length > 0;
    
    if (hasBoosts && hasDebuffs) return 'mixed';
    if (hasDebuffs) return 'debuff';
    return 'buff';
}

function getStatusName(statusId, effect) {
    if (effect?.name) return effect.name;
    
    const status = STATUS_EFFECTS?.[statusId];
    if (status) return status.simpleName || status.name;
    
    return formatStatusId(statusId);
}

function formatStatusId(id) {
    if (!id) return 'Unknown';
    return id
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getProgressPercent(remaining, maxDuration = 10) {
    return Math.min(100, Math.round((remaining / maxDuration) * 100));
}

/**
 * Render a single timed effect (typewriter style)
 */
function renderEffect(effect) {
    const statusId = effect.id;
    const remaining = effect.remainingMessages || 0;
    const stacks = effect.stacks || 1;
    const source = effect.source || 'consumption';
    
    const type = getEffectType(statusId);
    const name = getStatusName(statusId, effect);
    const progress = getProgressPercent(remaining);
    const isExpiring = remaining <= EXPIRING_THRESHOLD;
    
    // Typewriter-style indicator instead of emoji
    const indicator = type === 'debuff' ? '▌' : '│';
    
    return `
        <div class="rcm-timed-effect ${isExpiring ? 'expiring' : ''}" 
             data-status="${statusId}" 
             data-type="${type}"
             data-source="${source}">
            <span class="rcm-effect-icon">${indicator}</span>
            <span class="rcm-effect-name">
                ${name}${stacks > 1 ? ` <span class="rcm-effect-stacks">×${stacks}</span>` : ''}
            </span>
            <div class="rcm-effect-countdown">
                <div class="rcm-effect-progress">
                    <div class="rcm-effect-progress-fill ${isExpiring ? 'low' : ''}" 
                         style="width: ${progress}%"></div>
                </div>
                <span class="rcm-effect-msgs">${remaining} <span class="rcm-effect-unit">msg</span></span>
            </div>
        </div>
    `;
}

function renderTimedEffectsSection(effects) {
    if (!effects || effects.length === 0) {
        return `
            <div class="rcm-timed-effects">
                <div class="rcm-timed-effects-header">ACTIVE SUBSTANCES</div>
                <div class="rcm-timed-effects-empty">(system clear)</div>
            </div>
        `;
    }
    
    const sorted = [...effects].sort((a, b) => {
        const typeOrder = { buff: 0, mixed: 1, debuff: 2 };
        const typeA = typeOrder[getEffectType(a.id)] ?? 1;
        const typeB = typeOrder[getEffectType(b.id)] ?? 1;
        
        if (typeA !== typeB) return typeA - typeB;
        return (a.remainingMessages || 0) - (b.remainingMessages || 0);
    });
    
    return `
        <div class="rcm-timed-effects">
            <div class="rcm-timed-effects-header">ACTIVE SUBSTANCES</div>
            <div class="rcm-timed-effects-list">
                ${sorted.map(e => renderEffect(e)).join('')}
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// DOM UPDATE
// ═══════════════════════════════════════════════════════════════

export function updateTimedEffectsDisplay() {
    const container = document.getElementById('rcm-timed-effects-container');
    if (!container) {
        console.warn('[TimedFX] Container not found');
        return;
    }
    
    const effects = getTimedEffects();
    container.innerHTML = renderTimedEffectsSection(effects);
    
    // Sync checkboxes with current effects
    syncObservedStatesCheckboxes();
    
    console.log('[TimedFX] Display updated:', effects.length, 'active effects');
}

export function injectTimedEffectsContainer() {
    if (document.getElementById('rcm-timed-effects-container')) {
        return true;
    }
    
    // Strategy 1: Find #rcm-active-effects
    const activeEffectsEl = document.getElementById('rcm-active-effects');
    if (activeEffectsEl) {
        const section = activeEffectsEl.closest('.rcm-section');
        if (section) {
            const container = document.createElement('div');
            container.id = 'rcm-timed-effects-container';
            section.insertAdjacentElement('afterend', container);
            console.log('[TimedFX] Container injected after #rcm-active-effects section');
            return true;
        }
        const container = document.createElement('div');
        container.id = 'rcm-timed-effects-container';
        activeEffectsEl.insertAdjacentElement('afterend', container);
        return true;
    }
    
    // Strategy 2: Find by section header text
    let insertAfter = null;
    document.querySelectorAll('.rcm-section-header').forEach(header => {
        const text = header.textContent?.toLowerCase() || '';
        if (text.includes('active conditions')) {
            insertAfter = header.closest('.rcm-section') || header.parentElement;
        }
    });
    
    if (insertAfter) {
        const container = document.createElement('div');
        container.id = 'rcm-timed-effects-container';
        insertAfter.insertAdjacentElement('afterend', container);
        return true;
    }
    
    // Strategy 3: Find the medical form
    const medicalForm = document.querySelector('.rcm-medical-form');
    if (medicalForm) {
        const firstSection = medicalForm.querySelector('.rcm-section');
        if (firstSection) {
            const container = document.createElement('div');
            container.id = 'rcm-timed-effects-container';
            firstSection.insertAdjacentElement('afterend', container);
            return true;
        }
    }
    
    // Strategy 4: Fallback
    const statusTab = document.querySelector('.ie-tab-content[data-tab-content="status"]');
    if (statusTab) {
        const container = document.createElement('div');
        container.id = 'rcm-timed-effects-container';
        if (statusTab.children.length > 0) {
            statusTab.children[0].insertAdjacentElement('afterend', container);
        } else {
            statusTab.appendChild(container);
        }
        return true;
    }
    
    console.warn('[TimedFX] Could not find injection point');
    return false;
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

function bindEffectEvents() {
    window.addEventListener('tribunal:effectApplied', (e) => {
        updateTimedEffectsDisplay();
        
        // Immediately toggle the checkbox
        const statusId = e.detail?.statusId;
        const uiStatus = getUIStatusForEffect(statusId);
        if (uiStatus) {
            setObservedState(uiStatus, true);
        }
    });
    
    window.addEventListener('tribunal:effectRemoved', (e) => {
        // Check if any other active effect still needs this checkbox
        const statusId = e.detail?.statusId;
        const uiStatus = getUIStatusForEffect(statusId);
        
        if (uiStatus) {
            const effects = getTimedEffects();
            // Check if any remaining effect maps to the same UI status
            const stillActive = effects.some(eff => getUIStatusForEffect(eff.id) === uiStatus);
            if (!stillActive) {
                setObservedState(uiStatus, false);
            }
        }
        
        updateTimedEffectsDisplay();
    });
    
    window.addEventListener('tribunal:messageTick', () => {
        updateTimedEffectsDisplay();
    });
    
    console.log('[TimedFX] Event listeners bound');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let initialized = false;

export function initTimedEffectsDisplay() {
    if (initialized) return;
    
    const injected = injectTimedEffectsContainer();
    if (!injected) {
        console.warn('[TimedFX] Init failed - no container');
        return;
    }
    
    bindEffectEvents();
    updateTimedEffectsDisplay();
    
    initialized = true;
    console.log('[TimedFX] Initialized');
}

export function reinitTimedEffectsDisplay() {
    initialized = false;
    initTimedEffectsDisplay();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    initTimedEffectsDisplay,
    reinitTimedEffectsDisplay,
    updateTimedEffectsDisplay,
    injectTimedEffectsContainer,
    getTimedEffects,
    syncObservedStatesCheckboxes,
    setObservedState,
    getUIStatusForEffect
};
