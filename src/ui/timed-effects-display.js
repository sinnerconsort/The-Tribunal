/**
 * The Tribunal - Timed Effects Display
 * Renders active consumable effects with message countdown on vitals tab
 * 
 * Shows: Effect name, icon, stacks, remaining messages, progress bar
 * Updates: On effect apply/remove/tick events
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Map status IDs to display icons (emoji)
 * Used if CSS ::before doesn't work or for toasts
 */
const STATUS_ICONS = {
    nicotine_rush: '🚬',
    revacholian_courage: '🍺',
    pyrholidon: '💊',
    volumetric_shit_compressor: '🤢',
    waste_land: '😴',
    finger_on_the_eject_button: '🩸',
    tequila_sunset: '🌅',
    the_pale: '🌫️',
    white_mourning: '💀',
    caustic_echo: '😨',
    law_jaw: '😤',
    homo_sexual_underground: '💕',
    jamrock_shuffle: '🍀',
    the_expression: '😢'
};

/**
 * Default icon for unknown statuses
 */
const DEFAULT_ICON = '◆';

/**
 * Threshold for "expiring soon" warning (messages remaining)
 */
const EXPIRING_THRESHOLD = 2;

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS
// ═══════════════════════════════════════════════════════════════

/**
 * Get active timed effects from chat state
 * Only returns effects that have remainingMessages (timed effects)
 */
function getTimedEffects() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return [];
        
        const state = getChatState();
        const allEffects = state?.vitals?.activeEffects || [];
        
        // Filter to only effects with message countdown
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
// RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Get effect type (buff/debuff/mixed) for styling
 */
function getEffectType(statusId) {
    const status = STATUS_EFFECTS[statusId];
    if (!status) return 'mixed';
    
    const hasBoosts = status.boosts && status.boosts.length > 0;
    const hasDebuffs = status.debuffs && status.debuffs.length > 0;
    
    if (hasBoosts && hasDebuffs) return 'mixed';
    if (hasDebuffs) return 'debuff';
    return 'buff';
}

/**
 * Get display name for status
 */
function getStatusName(statusId) {
    const status = STATUS_EFFECTS[statusId];
    return status?.simpleName || status?.name || formatStatusId(statusId);
}

/**
 * Format status ID as display name (fallback)
 */
function formatStatusId(id) {
    if (!id) return 'Unknown';
    return id
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get icon for status
 */
function getStatusIcon(statusId) {
    return STATUS_ICONS[statusId] || DEFAULT_ICON;
}

/**
 * Calculate progress percentage
 * Assumes max duration of ~10 messages for full bar
 */
function getProgressPercent(remaining, maxDuration = 10) {
    return Math.min(100, Math.round((remaining / maxDuration) * 100));
}

/**
 * Render a single timed effect
 */
function renderEffect(effect) {
    const statusId = effect.id;
    const remaining = effect.remainingMessages || 0;
    const stacks = effect.stacks || 1;
    const source = effect.source || 'consumption';
    
    const type = getEffectType(statusId);
    const name = getStatusName(statusId);
    const icon = getStatusIcon(statusId);
    const progress = getProgressPercent(remaining);
    const isExpiring = remaining <= EXPIRING_THRESHOLD;
    
    return `
        <div class="rcm-timed-effect ${isExpiring ? 'expiring' : ''}" 
             data-status="${statusId}" 
             data-type="${type}"
             data-source="${source}">
            <span class="rcm-effect-icon" data-status="${statusId}">${icon}</span>
            <span class="rcm-effect-name">
                ${name}${stacks > 1 ? `<span class="rcm-effect-stacks">×${stacks}</span>` : ''}
            </span>
            <div class="rcm-effect-countdown">
                <div class="rcm-effect-progress">
                    <div class="rcm-effect-progress-fill ${isExpiring ? 'low' : ''}" 
                         style="width: ${progress}%"></div>
                </div>
                <span class="rcm-effect-msgs" data-count="${remaining}">${remaining}</span>
            </div>
        </div>
    `;
}

/**
 * Render the full timed effects section
 */
function renderTimedEffectsSection(effects) {
    if (!effects || effects.length === 0) {
        return `
            <div class="rcm-timed-effects">
                <div class="rcm-timed-effects-header">ACTIVE SUBSTANCES</div>
                <div class="rcm-timed-effects-empty">(system clear)</div>
            </div>
        `;
    }
    
    // Sort: buffs first, then mixed, then debuffs
    // Within each type, sort by remaining time (lowest first = expiring soon)
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

/**
 * Update the timed effects display
 * Call this on init, effect changes, and message ticks
 */
export function updateTimedEffectsDisplay() {
    const container = document.getElementById('rcm-timed-effects-container');
    if (!container) {
        console.warn('[TimedFX] Container #rcm-timed-effects-container not found');
        return;
    }
    
    const effects = getTimedEffects();
    container.innerHTML = renderTimedEffectsSection(effects);
    
    console.log('[TimedFX] Display updated:', effects.length, 'active effects');
}

/**
 * Create the container element if it doesn't exist
 * Call this during init to inject the section
 */
export function injectTimedEffectsContainer() {
    // Check if already exists
    if (document.getElementById('rcm-timed-effects-container')) {
        return true;
    }
    
    // Strategy 1: Find #rcm-active-effects and insert after its parent section
    const activeEffectsEl = document.getElementById('rcm-active-effects');
    if (activeEffectsEl) {
        // Go up to the section container
        const section = activeEffectsEl.closest('.rcm-section');
        if (section) {
            const container = document.createElement('div');
            container.id = 'rcm-timed-effects-container';
            section.insertAdjacentElement('afterend', container);
            console.log('[TimedFX] Container injected after #rcm-active-effects section');
            return true;
        }
        // Fallback: insert right after the effects element itself
        const container = document.createElement('div');
        container.id = 'rcm-timed-effects-container';
        activeEffectsEl.insertAdjacentElement('afterend', container);
        console.log('[TimedFX] Container injected after #rcm-active-effects element');
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
        console.log('[TimedFX] Container injected after Active Conditions header');
        return true;
    }
    
    // Strategy 3: Find the medical form and insert near top
    const medicalForm = document.querySelector('.rcm-medical-form');
    if (medicalForm) {
        // Find first section after patient info
        const firstSection = medicalForm.querySelector('.rcm-section');
        if (firstSection) {
            const container = document.createElement('div');
            container.id = 'rcm-timed-effects-container';
            firstSection.insertAdjacentElement('afterend', container);
            console.log('[TimedFX] Container injected in medical form');
            return true;
        }
    }
    
    // Strategy 4: Fallback to status tab
    const statusTab = document.querySelector('.ie-tab-content[data-tab-content="status"]');
    if (statusTab) {
        const container = document.createElement('div');
        container.id = 'rcm-timed-effects-container';
        // Insert after first child (probably form header)
        if (statusTab.children.length > 0) {
            statusTab.children[0].insertAdjacentElement('afterend', container);
        } else {
            statusTab.appendChild(container);
        }
        console.log('[TimedFX] Container injected in status tab (fallback)');
        return true;
    }
    
    console.warn('[TimedFX] Could not find injection point');
    return false;
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize event listeners for auto-updating display
 */
function bindEffectEvents() {
    // Update when effect is applied
    window.addEventListener('tribunal:effectApplied', () => {
        updateTimedEffectsDisplay();
    });
    
    // Update when effect is removed
    window.addEventListener('tribunal:effectRemoved', () => {
        updateTimedEffectsDisplay();
    });
    
    // Update on message tick (countdown)
    window.addEventListener('tribunal:messageTick', () => {
        updateTimedEffectsDisplay();
    });
    
    console.log('[TimedFX] Event listeners bound');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let initialized = false;

/**
 * Initialize timed effects display
 * Call after DOM is ready and status tab exists
 */
export function initTimedEffectsDisplay() {
    if (initialized) return;
    
    // Inject container
    const injected = injectTimedEffectsContainer();
    if (!injected) {
        console.warn('[TimedFX] Init failed - no container');
        return;
    }
    
    // Bind events
    bindEffectEvents();
    
    // Initial render
    updateTimedEffectsDisplay();
    
    initialized = true;
    console.log('[TimedFX] Initialized');
}

/**
 * Re-initialize (for chat changes)
 */
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
    getTimedEffects
};
