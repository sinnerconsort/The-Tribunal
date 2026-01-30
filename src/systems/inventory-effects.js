/**
 * The Tribunal - Inventory Effects
 * Bridges item consumption to status effects from statuses.js
 * 
 * Flow: consumeItem() → apply status → start timer → expire → remove status
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// ITEM TYPE → STATUS MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Maps inventory item types to status effects and durations
 * Duration in milliseconds (60000 = 1 minute)
 */
export const CONSUMPTION_EFFECTS = {
    cigarette: {
        statusId: 'nicotine_rush',
        duration: 5 * 60 * 1000,  // 5 minutes
        stackable: false,         // Refreshes timer, doesn't stack
        particleEffect: 'smoke',
        electrochemistryQuote: "Oh yes. The sweet kiss of nicotine. Your old friend."
    },
    alcohol: {
        statusId: 'revacholian_courage',
        duration: 10 * 60 * 1000, // 10 minutes
        stackable: true,          // Can intensify (track stacks)
        maxStacks: 3,
        particleEffect: 'drunk',
        electrochemistryQuote: "The warmth spreads through you. This is what living feels like."
    },
    drug: {
        statusId: 'pyrholidon',
        duration: 8 * 60 * 1000,  // 8 minutes
        stackable: false,
        particleEffect: 'stimulant',
        electrochemistryQuote: "NEURONS FIRING. Time dilates. You are *awake*."
    },
    stimulant: {
        statusId: 'pyrholidon',
        duration: 8 * 60 * 1000,
        stackable: false,
        particleEffect: 'stimulant',
        electrochemistryQuote: "The world sharpens. Every detail crystalline."
    },
    pyrholidon: {
        statusId: 'pyrholidon',
        duration: 10 * 60 * 1000,
        stackable: false,
        particleEffect: 'pale',
        electrochemistryQuote: "Reality... bends. The Pale whispers at the edges."
    },
    food: {
        statusId: null,           // No status, just healing
        healHealth: 1,
        healMorale: 1,
        particleEffect: null,
        electrochemistryQuote: null
    },
    coffee: {
        statusId: 'nicotine_rush', // Similar focus effect
        duration: 3 * 60 * 1000,
        stackable: false,
        particleEffect: null,
        electrochemistryQuote: "Caffeine. The socially acceptable stimulant."
    }
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE EFFECTS TRACKING
// ═══════════════════════════════════════════════════════════════

// In-memory active effect timers (cleared on page reload)
// Persistent state is in chat_metadata.tribunal.vitals.activeEffects
const activeTimers = new Map();

/**
 * Get active effects from chat state
 * @returns {Array} Active effect objects
 */
export function getActiveEffects() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return [];
        
        const state = getChatState();
        return state?.vitals?.activeEffects || [];
    } catch (e) {
        console.warn('[Effects] Could not get active effects:', e);
        return [];
    }
}

/**
 * Save active effects to chat state
 * @param {Array} effects - Active effects array
 */
function saveActiveEffects(effects) {
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (!getChatState) return;
        
        const state = getChatState();
        if (state?.vitals) {
            state.vitals.activeEffects = effects;
            if (saveChatState) saveChatState();
        }
    } catch (e) {
        console.warn('[Effects] Could not save active effects:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// APPLY / REMOVE EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply a status effect from consuming an item
 * @param {string} itemType - Type of item consumed (cigarette, alcohol, etc.)
 * @param {object} options - Additional options
 * @returns {object} Result { success, statusId, effect, message }
 */
export function applyConsumptionEffect(itemType, options = {}) {
    const effectConfig = CONSUMPTION_EFFECTS[itemType];
    
    if (!effectConfig) {
        console.log(`[Effects] No effect config for item type: ${itemType}`);
        return { success: false, message: 'No effect for this item' };
    }
    
    // Handle food/healing items (no status)
    if (!effectConfig.statusId) {
        return handleHealingItem(effectConfig, options);
    }
    
    const statusData = STATUS_EFFECTS[effectConfig.statusId];
    if (!statusData) {
        console.warn(`[Effects] Status not found: ${effectConfig.statusId}`);
        return { success: false, message: 'Status effect not found' };
    }
    
    const activeEffects = getActiveEffects();
    const existingIdx = activeEffects.findIndex(e => e.statusId === effectConfig.statusId);
    
    const now = Date.now();
    const expiresAt = now + effectConfig.duration;
    
    if (existingIdx >= 0) {
        // Effect already active
        if (effectConfig.stackable && activeEffects[existingIdx].stacks < (effectConfig.maxStacks || 3)) {
            // Stack it
            activeEffects[existingIdx].stacks++;
            activeEffects[existingIdx].expiresAt = expiresAt;
            activeEffects[existingIdx].appliedAt = now;
        } else {
            // Refresh timer
            activeEffects[existingIdx].expiresAt = expiresAt;
            activeEffects[existingIdx].appliedAt = now;
        }
    } else {
        // New effect
        activeEffects.push({
            statusId: effectConfig.statusId,
            appliedAt: now,
            expiresAt: expiresAt,
            stacks: 1,
            source: itemType
        });
    }
    
    saveActiveEffects(activeEffects);
    
    // Start expiration timer
    startExpirationTimer(effectConfig.statusId, effectConfig.duration);
    
    // Trigger particle effect if configured
    if (effectConfig.particleEffect) {
        triggerParticleEffect(effectConfig.particleEffect);
    }
    
    // Emit event for UI updates
    emitEffectApplied(effectConfig.statusId, statusData);
    
    return {
        success: true,
        statusId: effectConfig.statusId,
        effect: statusData,
        duration: effectConfig.duration,
        electrochemistryQuote: effectConfig.electrochemistryQuote,
        message: `${statusData.name} applied`
    };
}

/**
 * Handle healing items (food, medicine)
 */
function handleHealingItem(effectConfig, options) {
    // TODO: Hook into vitals system
    const healed = [];
    
    if (effectConfig.healHealth) {
        healed.push(`+${effectConfig.healHealth} Health`);
    }
    if (effectConfig.healMorale) {
        healed.push(`+${effectConfig.healMorale} Morale`);
    }
    
    return {
        success: true,
        statusId: null,
        healing: true,
        message: healed.join(', ') || 'Consumed'
    };
}

/**
 * Remove a status effect
 * @param {string} statusId - Status to remove
 */
export function removeEffect(statusId) {
    const activeEffects = getActiveEffects();
    const filtered = activeEffects.filter(e => e.statusId !== statusId);
    
    if (filtered.length !== activeEffects.length) {
        saveActiveEffects(filtered);
        
        // Clear timer
        if (activeTimers.has(statusId)) {
            clearTimeout(activeTimers.get(statusId));
            activeTimers.delete(statusId);
        }
        
        // Emit event
        emitEffectRemoved(statusId);
        
        console.log(`[Effects] Removed: ${statusId}`);
    }
}

/**
 * Start timer to auto-remove effect when it expires
 */
function startExpirationTimer(statusId, duration) {
    // Clear existing timer
    if (activeTimers.has(statusId)) {
        clearTimeout(activeTimers.get(statusId));
    }
    
    const timer = setTimeout(() => {
        console.log(`[Effects] ${statusId} expired`);
        removeEffect(statusId);
        
        // Check for withdrawal effects
        checkWithdrawal(statusId);
    }, duration);
    
    activeTimers.set(statusId, timer);
}

/**
 * Check if withdrawal should apply when effect ends
 */
function checkWithdrawal(expiredStatusId) {
    // TODO: Implement addiction/withdrawal mechanics
    // If player has high addiction level and effect expires,
    // could apply negative status like 'volumetric_shit_compressor'
}

// ═══════════════════════════════════════════════════════════════
// SKILL MODIFIER CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get total skill modifiers from all active effects
 * @returns {object} { skillId: modifier, ... }
 */
export function getActiveSkillModifiers() {
    const activeEffects = getActiveEffects();
    const modifiers = {};
    
    for (const effect of activeEffects) {
        const status = STATUS_EFFECTS[effect.statusId];
        if (!status) continue;
        
        // Apply boosts (+1 per stack)
        for (const skill of (status.boosts || [])) {
            modifiers[skill] = (modifiers[skill] || 0) + (effect.stacks || 1);
        }
        
        // Apply debuffs (-1 per stack)
        for (const skill of (status.debuffs || [])) {
            modifiers[skill] = (modifiers[skill] || 0) - (effect.stacks || 1);
        }
    }
    
    return modifiers;
}

/**
 * Get modifier for a specific skill
 * @param {string} skillId - Skill to check
 * @returns {number} Total modifier (can be negative)
 */
export function getSkillModifier(skillId) {
    const mods = getActiveSkillModifiers();
    return mods[skillId] || 0;
}

/**
 * Get list of active status IDs (for ancient voice checks, etc.)
 * @returns {string[]} Array of active status IDs
 */
export function getActiveStatusIds() {
    return getActiveEffects().map(e => e.statusId);
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger a visual particle effect
 * @param {string} effectType - smoke, drunk, stimulant, pale
 */
function triggerParticleEffect(effectType) {
    // Hook into weather-effects.js particle system if available
    if (window.TribunalWeather?.startParticleEffect) {
        window.TribunalWeather.startParticleEffect(effectType);
        return;
    }
    
    // Fallback: dispatch event for other systems to handle
    window.dispatchEvent(new CustomEvent('tribunal:particle', {
        detail: { effect: effectType }
    }));
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

function emitEffectApplied(statusId, statusData) {
    window.dispatchEvent(new CustomEvent('tribunal:effectApplied', {
        detail: { statusId, status: statusData }
    }));
}

function emitEffectRemoved(statusId) {
    window.dispatchEvent(new CustomEvent('tribunal:effectRemoved', {
        detail: { statusId }
    }));
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize effect timers from saved state
 * Call this on extension load / chat change
 */
export function initEffectTimers() {
    const activeEffects = getActiveEffects();
    const now = Date.now();
    
    for (const effect of activeEffects) {
        const remaining = effect.expiresAt - now;
        
        if (remaining <= 0) {
            // Already expired - remove it
            removeEffect(effect.statusId);
        } else {
            // Start timer for remaining time
            startExpirationTimer(effect.statusId, remaining);
            console.log(`[Effects] Restored timer for ${effect.statusId}: ${Math.round(remaining/1000)}s remaining`);
        }
    }
}

/**
 * Clear all timers (for cleanup)
 */
export function clearAllTimers() {
    for (const [statusId, timer] of activeTimers) {
        clearTimeout(timer);
    }
    activeTimers.clear();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    CONSUMPTION_EFFECTS,
    applyConsumptionEffect,
    removeEffect,
    getActiveEffects,
    getActiveSkillModifiers,
    getSkillModifier,
    getActiveStatusIds,
    initEffectTimers,
    clearAllTimers
};
