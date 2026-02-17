/**
 * The Tribunal - Auto-Consume System
 * Mimics Disco Elysium's addiction mechanic where Harry automatically
 * uses substances if addicted and they're in inventory
 * 
 * Flow:
 * 1. Track messages since last use per addiction type
 * 2. After 2-3 messages, craving triggers
 * 3. Volition check for chance to resist
 * 4. Fail = Electrochemistry takes over, auto-consume
 * 5. Pass = Volition holds the line (this time)
 */

import { getActiveSkillModifiers } from './inventory-effects.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Messages between cravings (randomized within range)
 */
const CRAVING_DELAY_MIN = 2;
const CRAVING_DELAY_MAX = 3;

/**
 * Base chance to resist (0-1)
 * Modified by: +0.1 per Volition level, -0.1 per addiction level
 */
const BASE_RESIST_CHANCE = 0.3;

/**
 * Addiction types and their matching inventory types
 */
const ADDICTION_TYPES = {
    nicotine: {
        id: 'nicotine',
        inventoryTypes: ['cigarette'],
        electrochemistryQuotes: [
            "Your fingers are already reaching for it. Don't fight this.",
            "Just one. You've earned it. Your hands know what to do.",
            "The craving is a friend. Let it guide you.",
            "Nicotine is calling. Answer it."
        ],
        volitionQuotes: [
            "No. Not this time. You're stronger than this.",
            "Your hand stops halfway. You don't need it.",
            "The craving passes. You remain.",
            "Volition holds. The cigarette stays in your pocket."
        ],
        consumeMessage: "Your hands move on their own. A cigarette is lit before you realize it."
    },
    alcohol: {
        id: 'alcohol',
        inventoryTypes: ['alcohol', 'beer'],
        electrochemistryQuotes: [
            "The bottle is RIGHT THERE. Just a sip. Medicinal.",
            "Your throat is dry. So dry. The solution is obvious.",
            "Liquid courage awaits. Don't leave it waiting.",
            "One drink won't hurt. It never hurts. It only helps."
        ],
        volitionQuotes: [
            "You push the bottle away. Not today.",
            "The thirst subsides. You're still in control.",
            "No. You remember what happens. You resist.",
            "Your hand trembles, but doesn't reach for it."
        ],
        consumeMessage: "Before you know it, you've taken a long drink. The warmth spreads."
    },
    drugs: {
        id: 'drugs',
        inventoryTypes: ['drug', 'stimulant', 'pyrholidon'],
        electrochemistryQuotes: [
            "Reality is so DULL without enhancement. Fix that.",
            "Your neurons are begging. Give them what they want.",
            "The world could be sharper. Brighter. You have the means.",
            "Just a little bump. To take the edge off. Or put it back on."
        ],
        volitionQuotes: [
            "You close your eyes. The urge fades. Barely.",
            "Not worth the crash. You know this. You resist.",
            "Your body screams for it. Your mind says no.",
            "The pills stay in your pocket. This time."
        ],
        consumeMessage: "Your body knows what it needs. You've already taken it."
    }
};

// ═══════════════════════════════════════════════════════════════
// STATE TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Track messages since last consumption per addiction type
 * Stored in chat state for persistence
 */
function getCravingState() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return {};
        
        const state = getChatState();
        if (!state.cravings) {
            state.cravings = {};
        }
        return state.cravings;
    } catch (e) {
        return {};
    }
}

function saveCravingState(cravings) {
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (!getChatState) return;
        
        const state = getChatState();
        state.cravings = cravings;
        if (saveChatState) saveChatState();
    } catch (e) {
        console.warn('[AutoConsume] Could not save craving state:', e);
    }
}

/**
 * Get addiction levels from state
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

/**
 * Get inventory items
 */
function getInventoryItems() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return [];
        
        const state = getChatState();
        return state?.inventory?.items || [];
    } catch (e) {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// CRAVING CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check for and process cravings on message tick
 * Call this from MESSAGE_RECEIVED handler
 * 
 * @returns {object|null} Result if auto-consume happened, null otherwise
 */
export function checkCravings() {
    // Check if auto-consume is enabled in settings
    try {
        const { getSettings } = window.TribunalState || {};
        if (getSettings) {
            const settings = getSettings();
            if (settings?.vitals?.autoConsume === false) {
                return null; // Auto-consume disabled
            }
        }
    } catch (e) {
        // Continue if settings unavailable
    }
    
    const addictions = getAddictions();
    const inventory = getInventoryItems();
    const cravings = getCravingState();
    
    // Check each addiction type
    for (const [addictionId, config] of Object.entries(ADDICTION_TYPES)) {
        const addiction = addictions[addictionId];
        
        // Skip if not addicted (level 0 or undefined)
        if (!addiction || addiction.level < 1) {
            continue;
        }
        
        // Initialize craving tracker if needed
        if (!cravings[addictionId]) {
            cravings[addictionId] = {
                messagesSinceUse: 0,
                nextCravingAt: randomCravingDelay()
            };
        }
        
        const tracker = cravings[addictionId];
        tracker.messagesSinceUse++;
        
        // Check if craving triggers
        if (tracker.messagesSinceUse >= tracker.nextCravingAt) {
            // Find matching item in inventory
            const matchingItem = findMatchingItem(inventory, config.inventoryTypes);
            
            if (matchingItem) {
                // Attempt Volition check
                const resisted = attemptVolitionCheck(addiction.level);
                
                if (resisted) {
                    // Volition wins!
                    const result = handleResist(addictionId, config, tracker);
                    saveCravingState(cravings);
                    return result;
                } else {
                    // Electrochemistry takes over
                    const result = handleAutoConsume(addictionId, config, matchingItem, tracker);
                    saveCravingState(cravings);
                    return result;
                }
            }
        }
    }
    
    // Save updated message counts
    saveCravingState(cravings);
    return null;
}

/**
 * Reset craving timer after manual consumption
 * Call this when player manually uses an addictive item
 */
export function resetCravingTimer(addictionType) {
    const cravings = getCravingState();
    
    if (cravings[addictionType]) {
        cravings[addictionType].messagesSinceUse = 0;
        cravings[addictionType].nextCravingAt = randomCravingDelay();
    }
    
    saveCravingState(cravings);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function randomCravingDelay() {
    return Math.floor(Math.random() * (CRAVING_DELAY_MAX - CRAVING_DELAY_MIN + 1)) + CRAVING_DELAY_MIN;
}

function findMatchingItem(inventory, itemTypes) {
    for (const item of inventory) {
        if (itemTypes.includes(item.type)) {
            return item;
        }
    }
    return null;
}

/**
 * Attempt Volition check to resist craving
 * @param {number} addictionLevel - Current addiction level (1-5)
 * @returns {boolean} True if resisted, false if Electrochemistry wins
 */
function attemptVolitionCheck(addictionLevel) {
    // Get Volition modifier from active effects
    const skillMods = getActiveSkillModifiers();
    const volitionMod = skillMods['volition'] || 0;
    
    // Calculate resist chance
    // Base 30% + 10% per Volition level - 10% per addiction level
    let resistChance = BASE_RESIST_CHANCE;
    resistChance += volitionMod * 0.1;
    resistChance -= addictionLevel * 0.1;
    
    // Clamp between 5% and 80%
    resistChance = Math.max(0.05, Math.min(0.8, resistChance));
    
    const roll = Math.random();
    const resisted = roll < resistChance;
    
    console.log(`[AutoConsume] Volition check: ${(resistChance * 100).toFixed(0)}% chance, rolled ${(roll * 100).toFixed(0)}%, ${resisted ? 'RESISTED' : 'FAILED'}`);
    
    return resisted;
}

function randomQuote(quotes) {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// ═══════════════════════════════════════════════════════════════
// CONSUME / RESIST HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle successful resistance
 */
function handleResist(addictionId, config, tracker) {
    // Reset timer but with shorter delay (craving will return)
    tracker.messagesSinceUse = 0;
    tracker.nextCravingAt = Math.max(1, randomCravingDelay() - 1);
    
    const quote = randomQuote(config.volitionQuotes);
    
    // Show toast
    if (typeof toastr !== 'undefined') {
        toastr.success(quote, 'VOLITION', { timeOut: 4000 });
    }
    
    // Dispatch event for voice system
    window.dispatchEvent(new CustomEvent('tribunal:cravingResisted', {
        detail: {
            addictionType: addictionId,
            quote: quote
        }
    }));
    
    console.log(`[AutoConsume] Resisted ${addictionId} craving`);
    
    return {
        type: 'resisted',
        addictionType: addictionId,
        quote: quote
    };
}

/**
 * Handle auto-consumption (Electrochemistry wins)
 */
function handleAutoConsume(addictionId, config, item, tracker) {
    // Reset timer
    tracker.messagesSinceUse = 0;
    tracker.nextCravingAt = randomCravingDelay();
    
    const electroQuote = randomQuote(config.electrochemistryQuotes);
    
    // Show Electrochemistry toast
    if (typeof toastr !== 'undefined') {
        toastr.warning(electroQuote, 'ELECTROCHEMISTRY', { timeOut: 3000 });
        
        // Follow up with consume message
        setTimeout(() => {
            toastr.info(config.consumeMessage, 'Auto-consumed: ' + item.name, { timeOut: 3000 });
        }, 1500);
    }
    
    // Actually consume the item
    if (window.TribunalInventory?.consumeItem) {
        window.TribunalInventory.consumeItem(item.name);
    } else {
        // Fallback: dispatch event
        window.dispatchEvent(new CustomEvent('tribunal:autoConsume', {
            detail: { item: item }
        }));
    }
    
    // Dispatch event for voice system
    window.dispatchEvent(new CustomEvent('tribunal:cravingSuccumbed', {
        detail: {
            addictionType: addictionId,
            item: item,
            quote: electroQuote
        }
    }));
    
    console.log(`[AutoConsume] Auto-consumed ${item.name} (${addictionId} addiction)`);
    
    return {
        type: 'consumed',
        addictionType: addictionId,
        item: item,
        quote: electroQuote
    };
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION (moved to bottom with addiction tracking)
// ═══════════════════════════════════════════════════════════════

let initialized = false;

// ═══════════════════════════════════════════════════════════════
// ADDICTION LEVEL TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Addiction level thresholds and effects
 * Level 0: Clean
 * Level 1: Casual user (no auto-consume yet)
 * Level 2: Habitual (cravings begin)
 * Level 3: Dependent (stronger cravings, harder to resist)
 * Level 4: Severe (very hard to resist)
 * Level 5: Terminal (basically impossible to resist)
 */
const MAX_ADDICTION_LEVEL = 5;

/**
 * Messages without using before addiction decays by 1 level
 */
const DECAY_THRESHOLD = 15;

/**
 * Map item types to addiction types
 */
const ITEM_TYPE_TO_ADDICTION = {
    cigarette: 'nicotine',
    alcohol: 'alcohol',
    beer: 'alcohol',
    drug: 'drugs',
    stimulant: 'drugs',
    pyrholidon: 'drugs'
};

/**
 * Map effectIds to addiction types
 */
const EFFECT_ID_TO_ADDICTION = {
    nicotine_rush: 'nicotine',
    revacholian_courage: 'alcohol',
    pyrholidon: 'drugs',
    speed_freaks_delight: 'drugs'
};

/**
 * Get addiction type for an item
 */
export function getAddictionTypeForItem(item) {
    if (!item) return null;
    
    // Check effectId first
    if (item.effectId && EFFECT_ID_TO_ADDICTION[item.effectId]) {
        return EFFECT_ID_TO_ADDICTION[item.effectId];
    }
    
    // Fall back to item type
    if (item.type && ITEM_TYPE_TO_ADDICTION[item.type]) {
        return ITEM_TYPE_TO_ADDICTION[item.type];
    }
    
    return null;
}

/**
 * Increase addiction level when consuming an addictive item
 * Call this from consumeItem handler
 * 
 * @param {object} item - The consumed item
 * @returns {object|null} { type, oldLevel, newLevel } or null if not addictive
 */
export function increaseAddiction(item) {
    const addictionType = getAddictionTypeForItem(item);
    if (!addictionType) return null;
    
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (!getChatState) return null;
        
        const state = getChatState();
        
        // Initialize addictions object if needed
        if (!state.inventory) state.inventory = {};
        if (!state.inventory.addictions) state.inventory.addictions = {};
        if (!state.inventory.addictions[addictionType]) {
            state.inventory.addictions[addictionType] = { level: 0, messagesSinceUse: 0 };
        }
        
        const addiction = state.inventory.addictions[addictionType];
        const oldLevel = addiction.level;
        
        // Increase level (cap at max)
        if (addiction.level < MAX_ADDICTION_LEVEL) {
            addiction.level++;
        }
        
        // Reset decay counter
        addiction.messagesSinceUse = 0;
        
        if (saveChatState) saveChatState();
        
        const newLevel = addiction.level;
        
        // Show notification if addiction increased
        if (newLevel > oldLevel) {
            showAddictionNotification(addictionType, newLevel);
        }
        
        console.log(`[Addiction] ${addictionType}: ${oldLevel} → ${newLevel}`);
        
        return { type: addictionType, oldLevel, newLevel };
        
    } catch (e) {
        console.warn('[Addiction] Could not update addiction:', e);
        return null;
    }
}

/**
 * Check for addiction decay (call on message tick)
 * Addiction decreases by 1 if you go long enough without using
 */
export function checkAddictionDecay() {
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (!getChatState) return;
        
        const state = getChatState();
        const addictions = state?.inventory?.addictions;
        if (!addictions) return;
        
        let changed = false;
        
        for (const [type, addiction] of Object.entries(addictions)) {
            if (addiction.level <= 0) continue;
            
            addiction.messagesSinceUse = (addiction.messagesSinceUse || 0) + 1;
            
            if (addiction.messagesSinceUse >= DECAY_THRESHOLD) {
                addiction.level--;
                addiction.messagesSinceUse = 0;
                changed = true;
                
                console.log(`[Addiction] ${type} decayed to level ${addiction.level}`);
                
                if (addiction.level === 0) {
                    showRecoveryNotification(type);
                }
            }
        }
        
        if (changed && saveChatState) saveChatState();
        
    } catch (e) {
        console.warn('[Addiction] Decay check failed:', e);
    }
}

/**
 * Show notification when addiction level increases
 */
function showAddictionNotification(type, level) {
    if (typeof toastr === 'undefined') return;
    
    const messages = {
        1: { title: 'Casual use', msg: "You could stop anytime. Obviously." },
        2: { title: 'Habit forming', msg: "It's becoming routine now." },
        3: { title: 'Dependency', msg: "Your body expects this now. It complains when denied." },
        4: { title: 'Severe addiction', msg: "The cravings are constant. Resisting takes everything you have." },
        5: { title: 'Terminal', msg: "ELECTROCHEMISTRY: You belong to me now." }
    };
    
    const typeNames = { nicotine: 'Nicotine', alcohol: 'Alcohol', drugs: 'Drug' };
    const info = messages[level];
    
    if (info) {
        toastr.warning(
            info.msg, 
            `${typeNames[type] || type} - ${info.title}`,
            { timeOut: 4000 }
        );
    }
}

/**
 * Show notification when recovered from addiction
 */
function showRecoveryNotification(type) {
    if (typeof toastr === 'undefined') return;
    
    const typeNames = { nicotine: 'Nicotine', alcohol: 'Alcohol', drugs: 'Drug' };
    
    toastr.success(
        "The cravings have faded. You're clean. For now.",
        `${typeNames[type] || type} - Recovered`,
        { timeOut: 4000 }
    );
}

/**
 * Get current addiction level for a type
 */
export function getAddictionLevel(addictionType) {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return 0;
        
        const state = getChatState();
        return state?.inventory?.addictions?.[addictionType]?.level || 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Manually set addiction level (for testing/debug)
 */
export function setAddictionLevel(addictionType, level) {
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (!getChatState) return;
        
        const state = getChatState();
        if (!state.inventory) state.inventory = {};
        if (!state.inventory.addictions) state.inventory.addictions = {};
        
        state.inventory.addictions[addictionType] = {
            level: Math.max(0, Math.min(MAX_ADDICTION_LEVEL, level)),
            messagesSinceUse: 0
        };
        
        if (saveChatState) saveChatState();
        console.log(`[Addiction] Set ${addictionType} to level ${level}`);
    } catch (e) {
        console.warn('[Addiction] Could not set level:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// UPDATED INIT - Include decay check
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize auto-consume system with addiction tracking
 */
export function initAutoConsume() {
    if (initialized) return;
    
    // Listen for message ticks
    window.addEventListener('tribunal:messageTick', () => {
        // Don't process if extension is disabled
        const settings = window.TribunalState?.getSettings?.();
        if (!settings?.enabled) return;
        
        checkCravings();
        checkAddictionDecay();
    });
    
    // Expose addiction functions globally for other modules
    window.TribunalAddiction = {
        increaseAddiction,
        getAddictionLevel,
        setAddictionLevel,
        getAddictionTypeForItem,
        checkAddictionDecay
    };
    
    initialized = true;
    console.log('[AutoConsume] Initialized - addiction system active');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    initAutoConsume,
    checkCravings,
    resetCravingTimer,
    increaseAddiction,
    getAddictionLevel,
    setAddictionLevel,
    getAddictionTypeForItem,
    checkAddictionDecay,
    ADDICTION_TYPES
};
