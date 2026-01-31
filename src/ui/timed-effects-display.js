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
 * Map status IDs to OBSERVED STATES checkbox values
 * These match the checkbox values in medical-form.html
 */
const STATUS_TO_CHECKBOX = {
    // Physical states
    revacholian_courage: 'drunk',
    nicotine_rush: 'smoking',
    pyrholidon: 'stimmed',
    speed_freaks_delight: 'stimmed',
    volumetric_shit_compressor: 'hungover',
    finger_on_the_eject_button: 'wounded',
    waste_land: 'exhausted',
    
    // Mental states (if applicable)
    the_expression: 'dissociated',
    the_pale: 'dissociated',
    white_mourning: 'grieving',
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
// CHECKBOX SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Sync OBSERVED STATES checkboxes with active effects
 * Call this after effects change
 */
function syncObservedStatesCheckboxes() {
    const effects = getTimedEffects();
    const activeCheckboxValues = new Set();
    
    // Build set of checkbox values that should be checked
    for (const effect of effects) {
        const checkboxValue = STATUS_TO_CHECKBOX[effect.id];
        if (checkboxValue) {
            activeCheckboxValues.add(checkboxValue);
        }
    }
    
    // Find all observed state checkboxes and sync them
    const checkboxes = document.querySelectorAll('.rcm-observed-checkbox, .observed-state-checkbox, input[name="observed_state"]');
    
    checkboxes.forEach(checkbox => {
        const value = checkbox.value || checkbox.dataset.state;
        if (value && STATUS_TO_CHECKBOX_VALUES.includes(value)) {
            const shouldBeChecked = activeCheckboxValues.has(value);
            if (checkbox.checked !== shouldBeChecked) {
                checkbox.checked = shouldBeChecked;
                console.log(`[TimedFX] ${shouldBeChecked ? 'Checked' : 'Unchecked'} observed state: ${value}`);
            }
        }
    });
}

// All possible checkbox values we manage
const STATUS_TO_CHECKBOX_VALUES = [
    'drunk', 'smoking', 'stimmed', 'hungover', 'wounded', 'exhausted', 'dying',
    'manic', 'dissociated', 'infatuated', 'lucky', 'terrified', 'enraged', 'grieving'
];

/**
 * Toggle a specific observed state checkbox
 */
function setObservedState(stateValue, checked) {
    const selectors = [
        `.rcm-observed-checkbox[value="${stateValue}"]`,
        `.observed-state-checkbox[value="${stateValue}"]`,
        `input[name="observed_state"][value="${stateValue}"]`,
        `input[data-state="${stateValue}"]`
    ];
    
    for (const selector of selectors) {
        const checkbox = document.querySelector(selector);
        if (checkbox) {
            checkbox.checked = checked;
            console.log(`[TimedFX] Set ${stateValue} = ${checked}`);
            return true;
        }
    }
    
    console.warn(`[TimedFX] Checkbox not found for state: ${stateValue}`);
    return false;
}

// ═══════════════════════════════════════════════════════════════
// RENDERING (No emojis - typewriter style)
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
 * Render a single timed effect (typewriter style, no emoji)
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
    
    // Typewriter-style indicator bar instead of emoji
    const indicator = type === 'debuff' ? '▌' : type === 'buff' ? '│' : '┃';
    
    return `
        <div class="rcm-timed-effect ${isExpiring ? 'expiring' : ''}" 
             data-status="${statusId}" 
             data-type="${type}"
             data-source="${source}">
            <span class="rcm-effect-indicator" data-type="${type}">${indicator}</span>
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
                <div class="rcm-timed-effects-header">▸ ACTIVE SUBSTANCES</div>
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
            <div class="rcm-timed-effects-header">▸ ACTIVE SUBSTANCES</div>
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
        
        // Also directly toggle the checkbox for immediate feedback
        const statusId = e.detail?.statusId;
        if (statusId && STATUS_TO_CHECKBOX[statusId]) {
            setObservedState(STATUS_TO_CHECKBOX[statusId], true);
        }
    });
    
    window.addEventListener('tribunal:effectRemoved', (e) => {
        updateTimedEffectsDisplay();
        
        // Check if any other effect still needs this checkbox
        const statusId = e.detail?.statusId;
        if (statusId && STATUS_TO_CHECKBOX[statusId]) {
            // Only uncheck if no other active effect uses this checkbox
            const effects = getTimedEffects();
            const checkboxValue = STATUS_TO_CHECKBOX[statusId];
            const stillActive = effects.some(eff => STATUS_TO_CHECKBOX[eff.id] === checkboxValue);
            if (!stillActive) {
                setObservedState(checkboxValue, false);
            }
        }
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
    setObservedState
};
