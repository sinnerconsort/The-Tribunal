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
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let initialized = false;

/**
 * Initialize auto-consume system
 * Hooks into message tick events
 */
export function initAutoConsume() {
    if (initialized) return;
    
    // Listen for message ticks
    window.addEventListener('tribunal:messageTick', () => {
        checkCravings();
    });
    
    // Also listen for MESSAGE_RECEIVED if messageTick isn't firing
    // (This is a backup - ideally messageTick handles it)
    
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
    ADDICTION_TYPES
};
