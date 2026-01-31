/**
 * The Tribunal - Inventory Effects
 * Bridges item consumption to status effects from statuses.js
 * 
 * Flow: consumeItem() → apply status → track messages → expire → withdrawal
 * 
 * Uses MESSAGE COUNT instead of real-time:
 * - Progress only when actively chatting
 * - Doesn't punish stepping away
 * - More like DE's action-based time
 * 
 * SMART LOOKUP (v2):
 * 1. item.effectId (AI-assigned at generation)
 * 2. Name pattern matching (fuzzy)
 * 3. Type fallback
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// ITEM TYPE → STATUS MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Maps inventory item types AND effect IDs to status effects
 * Duration in MESSAGE COUNT (not time!)
 */
export const CONSUMPTION_EFFECTS = {
    // ─────────────────────────────────────────────────────────────
    // BY ITEM TYPE (original behavior)
    // ─────────────────────────────────────────────────────────────
    cigarette: {
        id: 'nicotine_rush',
        duration: 4,
        stackable: false,
        particleEffect: 'smoke',
        electrochemistryQuote: "Oh yes. The sweet kiss of nicotine. Your old friend.",
        clears: []
    },
    alcohol: {
        id: 'revacholian_courage',
        duration: 8,
        stackable: true,
        maxStacks: 3,
        particleEffect: 'drunk',
        electrochemistryQuote: "The warmth spreads through you. This is what living feels like.",
        clears: ['volumetric_shit_compressor']
    },
    beer: {
        id: 'revacholian_courage',
        duration: 6,
        stackable: true,
        maxStacks: 3,
        particleEffect: 'drunk',
        electrochemistryQuote: "The warmth spreads through you. This is what living feels like.",
        clears: ['volumetric_shit_compressor']
    },
    drug: {
        id: 'pyrholidon',
        duration: 6,
        stackable: false,
        particleEffect: 'stimulant',
        electrochemistryQuote: "NEURONS FIRING. Time dilates. You are *awake*.",
        clears: ['waste_land']
    },
    stimulant: {
        id: 'pyrholidon',
        duration: 6,
        stackable: false,
        particleEffect: 'stimulant',
        electrochemistryQuote: "The world sharpens. Every detail crystalline.",
        clears: ['waste_land']
    },
    pyrholidon: {
        id: 'pyrholidon',
        duration: 8,
        stackable: false,
        particleEffect: 'pale',
        electrochemistryQuote: "Reality... bends. The Pale whispers at the edges.",
        clears: ['waste_land'],
        sideEffect: 'the_pale',
        sideEffectChance: 0.15
    },
    coffee: {
        id: 'nicotine_rush',
        duration: 3,
        stackable: false,
        particleEffect: null,
        electrochemistryQuote: "Caffeine. The socially acceptable stimulant.",
        clears: ['waste_land']
    },
    food: {
        id: null,
        healHealth: 1,
        healMorale: 1,
        particleEffect: null,
        electrochemistryQuote: null,
        clears: []
    },
    medicine: {
        id: null,
        healHealth: 2,
        particleEffect: null,
        electrochemistryQuote: "Chemistry doing its job. The body responds.",
        clears: ['finger_on_the_eject_button']
    },
    
    // ─────────────────────────────────────────────────────────────
    // BY EFFECT ID (for AI-assigned item.effectId)
    // ─────────────────────────────────────────────────────────────
    revacholian_courage: {
        id: 'revacholian_courage',
        duration: 6,
        stackable: true,
        maxStacks: 3,
        particleEffect: 'drunk',
        electrochemistryQuote: "The warmth spreads through you. This is what living feels like.",
        clears: ['volumetric_shit_compressor']
    },
    nicotine_rush: {
        id: 'nicotine_rush',
        duration: 4,
        stackable: false,
        particleEffect: 'smoke',
        electrochemistryQuote: "Oh yes. The sweet kiss of nicotine. Your old friend.",
        clears: []
    },
    speed_freaks_delight: {
        id: 'speed_freaks_delight',
        duration: 6,
        stackable: false,
        particleEffect: 'stimulant',
        electrochemistryQuote: "Your heart hammers. The world slows down. You are UNSTOPPABLE.",
        clears: ['waste_land']
    },
    satiated: {
        id: 'satiated',
        duration: 8,
        healHealth: 1,
        stackable: false,
        particleEffect: null,
        electrochemistryQuote: "Sustenance. Your body needed this.",
        clears: []
    },
    medicated: {
        id: 'medicated',
        duration: 6,
        healHealth: 2,
        stackable: false,
        particleEffect: null,
        electrochemistryQuote: "The pain fades. Modern chemistry at work.",
        clears: ['finger_on_the_eject_button']
    },
    the_expression: {
        id: 'the_expression',
        duration: 10,
        stackable: false,
        particleEffect: 'pale',
        electrochemistryQuote: "Reality fractures. The pale whispers secrets only you can hear.",
        clears: []
    }
};

// ═══════════════════════════════════════════════════════════════
// SMART LOOKUP - Name patterns and type fallbacks
// ═══════════════════════════════════════════════════════════════

/**
 * Name patterns for fuzzy matching (priority 2)
 */
const NAME_PATTERNS = {
    revacholian_courage: /beer|wine|whiskey|whisky|vodka|rum|booze|liquor|spirits|ale|mead|commodore|brandy/i,
    nicotine_rush: /cigarette|cigar|cig|smoke|tobacco|astra/i,
    pyrholidon: /pyrholidon/i,
    speed_freaks_delight: /speed|amphetamine|upper|stimulant/i,
    the_expression: /hallucinogen|lsd|acid|mushroom|expression/i,
    satiated: /food|sandwich|bread|meal|snack|fruit|meat|soup|cheese/i,
    medicated: /medicine|pill|painkiller|aspirin|bandage|medkit|nosaphed/i
};

/**
 * Type fallbacks (priority 3)
 */
const TYPE_FALLBACKS = {
    alcohol: 'revacholian_courage',
    cigarette: 'nicotine_rush',
    drug: 'pyrholidon',
    stimulant: 'speed_freaks_delight',
    food: 'satiated',
    medicine: 'medicated'
};

/**
 * Find effect config using smart lookup:
 * 1. item.effectId (AI-assigned at generation)
 * 2. Name pattern matching (fuzzy)
 * 3. Direct type lookup
 * 4. Type fallback to effect ID
 * 
 * @param {object} options - { item, itemName, itemType }
 * @returns {object|null} Effect config or null
 */
function findEffectConfig(options = {}) {
    const { item } = options;
    const itemName = options.itemName || item?.name || '';
    const itemType = options.itemType || item?.type || '';
    
    // Priority 1: Explicit effectId from item (AI-assigned)
    const effectId = item?.effectId;
    if (effectId && effectId !== 'none' && CONSUMPTION_EFFECTS[effectId]) {
        console.log('[Effects] Using effectId:', effectId);
        return CONSUMPTION_EFFECTS[effectId];
    }
    
    // Priority 2: Name pattern matching
    const lowerName = itemName.toLowerCase();
    for (const [id, pattern] of Object.entries(NAME_PATTERNS)) {
        if (pattern.test(lowerName)) {
            console.log('[Effects] Matched by name pattern:', id);
            return CONSUMPTION_EFFECTS[id];
        }
    }
    
    // Priority 3: Direct type lookup (original behavior)
    if (itemType && CONSUMPTION_EFFECTS[itemType]) {
        console.log('[Effects] Using item type:', itemType);
        return CONSUMPTION_EFFECTS[itemType];
    }
    
    // Priority 4: Type fallback to effect ID
    const fallbackId = TYPE_FALLBACKS[itemType];
    if (fallbackId && CONSUMPTION_EFFECTS[fallbackId]) {
        console.log('[Effects] Using type fallback:', fallbackId);
        return CONSUMPTION_EFFECTS[fallbackId];
    }
    
    console.log('[Effects] No effect config found for:', itemName, 'type:', itemType);
    return null;
}

/**
 * Withdrawal mappings - what happens when effect expires
 */
export const WITHDRAWAL_EFFECTS = {
    revacholian_courage: {
        withdrawalId: 'volumetric_shit_compressor',
        duration: 10,
        quote: "The bill comes due. Your body remembers every drink."
    },
    pyrholidon: {
        withdrawalId: 'waste_land',
        duration: 8,
        quote: "The high fades. Reality crashes back, heavier than before."
    },
    nicotine_rush: {
        withdrawalId: null,
        addictionThreshold: 3,
        quote: "Your fingers twitch. The craving gnaws."
    }
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE EFFECTS TRACKING (Message-count based)
// ═══════════════════════════════════════════════════════════════

/**
 * Get active effects from chat state
 * Each effect now has: { id, name, remainingMessages, stacks, source }
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
// MESSAGE TICK - Call this on each new message!
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message tick - decrements all active effects
 * Call this from MESSAGE_RECEIVED event handler
 * @returns {object} { expired: [], remaining: [] }
 */
export function onMessageTick() {
    const activeEffects = getActiveEffects();
    const expired = [];
    const remaining = [];
    
    for (const effect of activeEffects) {
        effect.remainingMessages--;
        
        if (effect.remainingMessages <= 0) {
            expired.push(effect);
            console.log(`[Effects] ${effect.id} expired after message tick`);
        } else {
            remaining.push(effect);
        }
    }
    
    // Save remaining effects
    saveActiveEffects(remaining);
    
    // Process expirations (withdrawals, etc.)
    for (const effect of expired) {
        emitEffectRemoved(effect.id);
        checkWithdrawal(effect.id);
    }
    
    return { expired, remaining };
}

// ═══════════════════════════════════════════════════════════════
// APPLY / REMOVE EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply a status effect from consuming an item
 * Uses smart lookup: effectId → name match → type fallback
 * 
 * @param {string} itemType - Type of item consumed (for backwards compat)
 * @param {object} options - { item, ... }
 * @returns {object} Result { success, statusId, effect, message }
 */
export function applyConsumptionEffect(itemType, options = {}) {
    const { item } = options;
    
    // Use smart lookup
    const effectConfig = findEffectConfig({
        item,
        itemName: item?.name,
        itemType: itemType
    });
    
    if (!effectConfig) {
        console.log(`[Effects] No effect config for: ${item?.name || itemType}`);
        return { success: false, message: 'No effect for this item' };
    }
    
    // Handle food/healing items (no status)
    if (!effectConfig.id) {
        return handleHealingItem(effectConfig, options);
    }

    const statusData = STATUS_EFFECTS[effectConfig.id];
    if (!statusData) {
        console.warn(`[Effects] Status not found: ${effectConfig.id}`);
        return { success: false, message: 'Status effect not found' };
    }
    
    const activeEffects = getActiveEffects();
    
    // Clear any effects this item clears (from config)
    let clearedEffects = [];
    if (effectConfig.clears && effectConfig.clears.length > 0) {
        for (const clearId of effectConfig.clears) {
            const idx = activeEffects.findIndex(e => e.id === clearId);
            if (idx >= 0) {
                clearedEffects.push(clearId);
                activeEffects.splice(idx, 1);
                console.log(`[Effects] Cleared: ${clearId}`);
            }
        }
    }
    
    const existingIdx = activeEffects.findIndex(e => e.id === effectConfig.id);
    const duration = effectConfig.duration || effectConfig.messages || 6;
    
    if (existingIdx >= 0) {
        // Effect already active
        if (effectConfig.stackable && activeEffects[existingIdx].stacks < (effectConfig.maxStacks || 3)) {
            // Stack it - add stacks AND refresh duration
            activeEffects[existingIdx].stacks++;
            activeEffects[existingIdx].remainingMessages = duration;
            console.log(`[Effects] Stacked ${effectConfig.id} to ${activeEffects[existingIdx].stacks}`);
        } else {
            // Refresh duration
            activeEffects[existingIdx].remainingMessages = duration;
            console.log(`[Effects] Refreshed ${effectConfig.id} to ${duration} messages`);
        }
    } else {
        // New effect
        activeEffects.push({
            id: effectConfig.id,
            name: statusData.simpleName || statusData.name,
            remainingMessages: duration,
            stacks: 1,
            source: 'consumption'
        });
        console.log(`[Effects] Applied ${effectConfig.id} for ${duration} messages`);
    }
    
    saveActiveEffects(activeEffects);
    
    // Trigger particle effect if configured
    if (effectConfig.particleEffect) {
        triggerParticleEffect(effectConfig.particleEffect);
    }
    
    // Emit events
    emitEffectApplied(effectConfig.id, statusData);
    for (const cleared of clearedEffects) {
        emitEffectRemoved(cleared);
    }
    
    return {
        success: true,
        statusId: effectConfig.id,
        effect: statusData,
        remainingMessages: duration,
        electrochemistryQuote: effectConfig.electrochemistryQuote,
        clearedEffects: clearedEffects,
        message: `${statusData.name} applied`
    };
}

/**
 * Handle healing items (food, medicine)
 */
function handleHealingItem(effectConfig, options) {
    // Clear any effects this item clears
    if (effectConfig && effectConfig.clears && effectConfig.clears.length > 0) {
        const activeEffects = getActiveEffects();
        let clearedAny = false;
        for (const clearId of effectConfig.clears) {
            const idx = activeEffects.findIndex(e => e.id === clearId);
            if (idx >= 0) {
                activeEffects.splice(idx, 1);
                clearedAny = true;
                console.log(`[Effects] Healing cleared: ${clearId}`);
            }
        }
        if (clearedAny) saveActiveEffects(activeEffects);
    }
    
    // TODO: Hook into vitals system for actual healing
    const healed = [];
    
    if (effectConfig?.healHealth) {
        healed.push(`+${effectConfig.healHealth} Health`);
    }
    if (effectConfig?.healMorale) {
        healed.push(`+${effectConfig.healMorale} Morale`);
    }
    
    return {
        success: true,
        id: null,
        healing: true,
        message: healed.join(', ') || 'Consumed'
    };
}

/**
 * Remove a status effect manually
 * @param {string} statusId - Status to remove
 */
export function removeEffect(statusId) {
    const activeEffects = getActiveEffects();
    const filtered = activeEffects.filter(e => e.id !== statusId);
    
    if (filtered.length !== activeEffects.length) {
        saveActiveEffects(filtered);
        emitEffectRemoved(statusId);
        console.log(`[Effects] Removed: ${statusId}`);
    }
}

/**
 * Check if withdrawal should apply when effect ends
 * Uses WITHDRAWAL_EFFECTS config
 */
function checkWithdrawal(expiredStatusId) {
    const config = WITHDRAWAL_EFFECTS[expiredStatusId];
    if (!config) return;
    
    // Check if this has an addiction threshold
    if (config.addictionCheck && !config.withdrawalId) {
        const addictions = getAddictions();
        const threshold = config.addictionThreshold || 3;
        // Check relevant addiction type
        if (addictions?.cigarette?.level >= threshold || addictions?.nicotine?.level >= threshold) {
            console.log(`[Effects] ${config.quote}`);
            // Could apply a craving status here in the future
        }
        return;
    }
    
    // Apply withdrawal effect
    if (config.withdrawalId) {
        applyWithdrawalEffect(config.withdrawalId, {
            messages: config.duration || config.messages || 8,
            quote: config.quote
        });
    }
}

/**
 * Apply a withdrawal/comedown effect (message-based)
 */
function applyWithdrawalEffect(statusId, options = {}) {
    const status = STATUS_EFFECTS[statusId];
    
    if (!status) {
        console.warn('[Effects] Withdrawal status not found:', statusId);
        return;
    }
    
    const activeEffects = getActiveEffects();
    const duration = options.messages || 8;
    
    // Don't stack withdrawal - just apply/refresh
    const existingIdx = activeEffects.findIndex(e => e.id === statusId);
    if (existingIdx >= 0) {
        activeEffects[existingIdx].remainingMessages = duration;
    } else {
        activeEffects.push({
            id: statusId,
            name: status.simpleName || status.name,
            remainingMessages: duration,
            stacks: 1,
            source: 'withdrawal'
        });
    }
    
    saveActiveEffects(activeEffects);
    emitEffectApplied(statusId, status);
    
    // Toast the withdrawal
    if (typeof toastr !== 'undefined' && options.quote) {
        toastr.warning(options.quote, status.name, { timeOut: 4000 });
    }
    
    console.log(`[Effects] Withdrawal applied: ${statusId} for ${duration} messages`);
}

/**
 * Get addiction levels from inventory state
 */
function getAddictions() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return {};
        const state = getChatState();
        return state?.inventory?.addictions || {};
    } catch (e) {
        return {};
    }
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
        const status = STATUS_EFFECTS[effect.id];
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
    return getActiveEffects().map(e => e.id);
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger a visual particle effect
 * @param {string} effectType - smoke, drunk, stimulant, pale
 */
function triggerParticleEffect(effectType) {
    // Use the new condition effects system (separate from weather)
    if (window.TribunalConditionFX?.triggerConsumption) {
        window.TribunalConditionFX.triggerConsumption(effectType);
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
 * Initialize effects system - just logs active effects
 * (No timers needed - we use message ticks now!)
 * Call this on extension load / chat change
 */
export function initEffectTimers() {
    const activeEffects = getActiveEffects();
    
    if (activeEffects.length > 0) {
        console.log(`[Effects] Active effects:`, activeEffects.map(e => 
            `${e.id} (${e.remainingMessages} msgs left)`
        ).join(', '));
    } else {
        console.log('[Effects] No active effects');
    }
}

/**
 * Get effect preview text for UI
 */
export function getEffectPreviewText(statusId) {
    const effects = getActiveEffects();
    const effect = effects.find(e => e.id === statusId);
    if (!effect) return null;
    
    const status = STATUS_EFFECTS[statusId];
    return {
        name: status?.name || statusId,
        remaining: effect.remainingMessages,
        stacks: effect.stacks || 1
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    CONSUMPTION_EFFECTS,
    WITHDRAWAL_EFFECTS,
    applyConsumptionEffect,
    removeEffect,
    getActiveEffects,
    getActiveSkillModifiers,
    getSkillModifier,
    getActiveStatusIds,
    onMessageTick,
    initEffectTimers,
    getEffectPreviewText
};
