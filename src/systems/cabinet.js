/**
 * The Tribunal - Thought Cabinet System
 * 
 * Bridge module: re-exports functions from state.js and thoughts.js
 * with the names that cabinet-handler.js expects.
 * 
 * @version 4.3.0 - Added theme discharge on internalize + passive decay
 * 
 * THEME SYSTEM (Option C):
 * - Themes increment from message scanning (via trackThemesInMessage)
 * - When a theme hits threshold (default 8), it can trigger auto-suggest
 * - When a thought is generated FROM a theme, that theme decrements
 * - When a thought is INTERNALIZED, its theme is discharged
 * - Themes that weren't hit in a message passively decay
 * - This creates a cycle: fill → discharge → refill
 * 
 * BONUS SYSTEM:
 * - researchBonus: Temporary effects while researching (usually penalties)
 * - internalizedBonus: Permanent effects when thought is complete
 * - Both support { skillId: { value: +/-N, flavor: "reason text" } }
 * 
 * SPECIAL EFFECTS:
 * - Unique modifiers stored on thoughts
 * - Can affect voices, checks, narrative, etc.
 */

import { 
    getChatState, 
    saveChatState,
    getSettings 
} from '../core/persistence.js';

import {
    getThoughtCabinet,
    startResearch as _startResearch,
    progressResearch,
    internalizeThought as _internalizeThought,
    forgetThought as _forgetThought,
    getPersona,
    setPersona
} from '../core/state.js';

import { 
    THEMES, 
    getTopThemes as _getTopThemes,
    detectThemes,
    incrementThemes,
    decrementTheme
} from '../data/thoughts.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MAX_RESEARCH_SLOTS = 4;
export const MAX_INTERNALIZED = 5;
export const THEME_CAP = 10;           // Max theme counter value
export const THEME_SPIKE_THRESHOLD = 8; // When to suggest auto-generation
export const THEME_DECAY_AMOUNT = 1;   // How much themes decay per message
export const THEME_INTERNALIZE_DISCHARGE = 5; // How much theme drops on internalize

// ═══════════════════════════════════════════════════════════════
// SPECIAL EFFECT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Known special effects that thoughts can have.
 * These affect gameplay in various ways.
 */
export const SPECIAL_EFFECTS = {
    // Voice modifiers
    VOICE_AMPLIFY: 'voice_amplify',       // A specific skill speaks more often
    VOICE_SILENCE: 'voice_silence',       // A specific skill is silenced
    VOICE_UNLOCK: 'voice_unlock',         // Unlock a hidden voice (Ancient Reptilian Brain, etc.)
    
    // Check modifiers  
    CHECK_EASIER: 'check_easier',         // Checks for a skill are easier
    CHECK_HARDER: 'check_harder',         // Checks for a skill are harder
    CRIT_RANGE_EXPAND: 'crit_range_expand', // Crits happen more often
    
    // Narrative effects
    UNLOCK_CASCADE: 'unlock_cascade',     // Unlock a cascade pattern
    MOOD_SHIFT: 'mood_shift',             // Change overall voice tone
    
    // Resource effects
    NO_BUFF_FROM: 'no_buff_from',         // "No positive effects from X"
    DOUBLE_PENALTY: 'double_penalty',     // Penalties from X are doubled
    HEAL_ON_TOPIC: 'heal_on_topic',       // Gain morale when topic appears
    
    // Meta effects
    THOUGHT_SLOT: 'thought_slot',         // +1 internalized slot
    RESEARCH_SPEED: 'research_speed',     // Research completes faster
};

// ═══════════════════════════════════════════════════════════════
// THEME FUNCTIONS (Option C) - WITH DECAY
// ═══════════════════════════════════════════════════════════════

/**
 * Get current theme counters
 * @returns {Object} { themeId: count }
 */
export function getThemeCounters() {
    const cabinet = getThoughtCabinet();
    return cabinet?.themes || {};
}

/**
 * Get top themes by count (wrapper for thoughts.js function)
 * @param {number} limit - Max themes to return
 * @returns {Array} Top themes with full data
 */
export function getTopThemes(limit = 3) {
    const counters = getThemeCounters();
    return _getTopThemes(counters, limit);
}

/**
 * Track themes in a message and update counters
 * Also applies passive decay to themes NOT detected in this message
 * Called on MESSAGE_RECEIVED to build up theme meters
 * @param {string} text - Message text to analyze
 * @returns {string[]} Detected theme IDs
 */
export function trackThemesInMessage(text) {
    const state = getChatState();
    if (!state) return [];
    
    // Initialize themes if needed
    if (!state.thoughtCabinet) state.thoughtCabinet = {};
    if (!state.thoughtCabinet.themes) {
        state.thoughtCabinet.themes = {};
    }
    
    const detected = detectThemes(text);
    const themes = state.thoughtCabinet.themes;
    
    // Check settings for decay
    // FIX: Use themeDecayRate from settings, default to 0 (disabled)
    const settings = getSettings();
    const decayRate = settings?.thoughts?.themeDecayRate ?? 0;
    const decayEnabled = decayRate > 0;
    
    // Apply decay to themes NOT detected in this message
    if (decayEnabled) {
        for (const themeId of Object.keys(themes)) {
            if (!detected.includes(themeId) && themes[themeId] > 0) {
                themes[themeId] = Math.max(0, themes[themeId] - decayRate);
            }
        }
    }
    
    // Increment detected themes
    // Only increment if we found themes (skip generic messages)
    if (detected.length > 0) {
        for (const themeId of detected) {
            const current = themes[themeId] || 0;
            themes[themeId] = Math.min(THEME_CAP, current + 1);
        }
        
        console.log('[Tribunal] Themes tracked:', detected, '→', themes);
    }
    
    // Clean up themes at 0
    for (const themeId of Object.keys(themes)) {
        if (themes[themeId] <= 0) {
            delete themes[themeId];
        }
    }
    
    saveChatState();
    return detected;
}

/**
 * Decrement a theme counter (called when thought is generated from theme)
 * Part of Option C: themes "discharge" when used
 * @param {string} themeId - Theme to decrement
 * @param {number} amount - How much to decrement (default: reset to 0)
 */
export function dischargeTheme(themeId, amount = null) {
    const state = getChatState();
    if (!state?.thoughtCabinet?.themes) return;
    
    if (amount === null) {
        // Full discharge - reset to 0
        state.thoughtCabinet.themes[themeId] = 0;
    } else {
        // Partial discharge
        const current = state.thoughtCabinet.themes[themeId] || 0;
        state.thoughtCabinet.themes[themeId] = Math.max(0, current - amount);
    }
    
    console.log('[Tribunal] Theme discharged:', themeId, '→', state.thoughtCabinet.themes[themeId]);
    saveChatState();
}

/**
 * Discharge theme associated with a thought
 * Called when a thought is internalized
 * @param {Object} thought - The thought object (should have .theme property)
 */
function dischargeThoughtTheme(thought) {
    if (!thought?.theme) return;
    
    const settings = getSettings();
    // FIX: Use internalizeDischarge from settings (matching the defaults name)
    const dischargeAmount = settings?.thoughts?.internalizeDischarge ?? THEME_INTERNALIZE_DISCHARGE;
    
    console.log('[Tribunal] Discharging theme for internalized thought:', thought.name, '→', thought.theme);
    dischargeTheme(thought.theme, dischargeAmount);
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT ACCESSORS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a thought by ID from customThoughts
 * @param {string} thoughtId 
 * @returns {Object|null}
 */
export function getThought(thoughtId) {
    const cabinet = getThoughtCabinet();
    return cabinet?.customThoughts?.[thoughtId] || null;
}

/**
 * Get all discovered thoughts with full data
 * @returns {Object[]}
 */
export function getDiscoveredThoughts() {
    const cabinet = getThoughtCabinet();
    return (cabinet?.discovered || [])
        .map(id => cabinet.customThoughts?.[id])
        .filter(Boolean);
}

/**
 * Get all researching thoughts with full data and progress
 * @returns {Object[]}
 */
export function getResearchingThoughts() {
    const cabinet = getThoughtCabinet();
    if (!cabinet?.researching) return [];
    
    return Object.entries(cabinet.researching).map(([id, research]) => {
        const thought = cabinet.customThoughts?.[id];
        if (!thought) return null;
        
        return {
            ...thought,
            progress: research.progress || 0,
            startedAt: research.startedAt
        };
    }).filter(Boolean);
}

/**
 * Get all internalized thoughts with full data
 * @returns {Object[]}
 */
export function getInternalizedThoughts() {
    const cabinet = getThoughtCabinet();
    return (cabinet?.internalized || [])
        .map(id => cabinet.customThoughts?.[id])
        .filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// RESEARCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Start researching a thought
 * Wrapper that handles slot logic and cap checking
 * @param {string} thoughtId - Thought ID to research
 * @returns {true|{error: string}} True on success, error object on failure
 */
export function startResearch(thoughtId) {
    const state = getChatState();
    if (!state) return { error: 'no_state' };
    
    const cabinet = state.thoughtCabinet;
    
    // Check internalized cap (accounting for bonus slots)
    const maxSlots = getMaxInternalizedSlots();
    if ((cabinet.internalized || []).length >= maxSlots) {
        return { error: 'cap_reached' };
    }
    
    // Check research slot availability
    const currentResearching = Object.keys(cabinet.researching || {}).length;
    if (currentResearching >= MAX_RESEARCH_SLOTS) {
        return { error: 'no_slots' };
    }
    
    // Check if already researching
    if (cabinet.researching?.[thoughtId]) {
        return { error: 'already_researching' };
    }
    
    // Check if thought exists in discovered
    if (!cabinet.discovered?.includes(thoughtId)) {
        return { error: 'not_discovered' };
    }
    
    // Start research
    if (!cabinet.researching) cabinet.researching = {};
    
    const thought = cabinet.customThoughts?.[thoughtId];
    const researchTime = thought?.researchTime || 10;
    
    cabinet.researching[thoughtId] = {
        progress: 0,
        maxProgress: researchTime,
        startedAt: Date.now()
    };
    
    // Remove from discovered
    cabinet.discovered = cabinet.discovered.filter(id => id !== thoughtId);
    
    saveChatState();
    return true;
}

/**
 * Abandon research on a thought
 * @param {string} thoughtId - Thought ID to abandon
 * @returns {boolean} Success
 */
export function abandonResearch(thoughtId) {
    const state = getChatState();
    if (!state) return false;
    
    const cabinet = state.thoughtCabinet;
    
    if (!cabinet.researching?.[thoughtId]) {
        return false;
    }
    
    // Remove from researching
    delete cabinet.researching[thoughtId];
    
    // Add back to discovered
    if (!cabinet.discovered) cabinet.discovered = [];
    cabinet.discovered.push(thoughtId);
    
    saveChatState();
    return true;
}

/**
 * Get research progress for a thought
 * @param {string} thoughtId - Thought ID
 * @returns {Object} { progress, maxProgress, percent }
 */
export function getResearchProgress(thoughtId) {
    const cabinet = getThoughtCabinet();
    const research = cabinet?.researching?.[thoughtId];
    
    if (!research) {
        return { progress: 0, maxProgress: 10, percent: 0 };
    }
    
    const thought = cabinet.customThoughts?.[thoughtId];
    const maxProgress = research.maxProgress || thought?.researchTime || 10;
    const progress = research.progress || 0;
    
    // Apply research speed bonuses
    const speedMultiplier = getResearchSpeedMultiplier();
    const effectiveProgress = progress * speedMultiplier;
    
    return {
        progress: effectiveProgress,
        maxProgress,
        percent: Math.min(100, Math.round((effectiveProgress / maxProgress) * 100))
    };
}

/**
 * Advance research progress (called on message received)
 * @param {string} messageText - Message text (for keyword bonuses)
 * @returns {string[]} IDs of thoughts that completed
 */
export function advanceResearch(messageText = '') {
    const state = getChatState();
    if (!state?.thoughtCabinet?.researching) return [];
    
    const cabinet = state.thoughtCabinet;
    const completed = [];
    
    for (const [thoughtId, research] of Object.entries(cabinet.researching)) {
        const thought = cabinet.customThoughts?.[thoughtId];
        if (!thought) continue;
        
        // Base progress
        let progressGain = 1;
        
        // Bonus for theme keywords in message
        if (thought.theme && messageText) {
            const theme = THEMES[thought.theme];
            if (theme?.keywords) {
                const lowerText = messageText.toLowerCase();
                const keywordHits = theme.keywords.filter(kw => 
                    lowerText.includes(kw.toLowerCase())
                ).length;
                
                if (keywordHits > 0) {
                    progressGain += Math.min(keywordHits, 2); // Max +2 bonus
                }
            }
        }
        
        research.progress = (research.progress || 0) + progressGain;
        
        // Check completion
        const maxProgress = research.maxProgress || thought.researchTime || 10;
        if (research.progress >= maxProgress) {
            // Auto-internalize (calls our enhanced version)
            const internalized = internalizeThought(thoughtId);
            if (internalized) {
                completed.push(thoughtId);
            }
        }
    }
    
    if (completed.length > 0 || Object.keys(cabinet.researching).length > 0) {
        saveChatState();
    }
    
    return completed;
}

/**
 * Dismiss a discovered thought (don't want to research it)
 * @param {string} thoughtId 
 * @returns {boolean} Success
 */
export function dismissThought(thoughtId) {
    const state = getChatState();
    if (!state) return false;
    
    const cabinet = state.thoughtCabinet;
    
    const idx = (cabinet.discovered || []).indexOf(thoughtId);
    if (idx === -1) return false;
    
    cabinet.discovered.splice(idx, 1);
    
    if (!cabinet.dismissed) cabinet.dismissed = [];
    cabinet.dismissed.push(thoughtId);
    
    saveChatState();
    return true;
}

// ═══════════════════════════════════════════════════════════════
// INTERNALIZATION - NOW WITH THEME DISCHARGE
// ═══════════════════════════════════════════════════════════════

/**
 * Internalize a thought (complete research)
 * Applies permanent bonuses, special effects, AND discharges theme
 * @param {string} thoughtId 
 * @returns {Object|null} The internalized thought, or null on failure
 */
export function internalizeThought(thoughtId) {
    const state = getChatState();
    if (!state) return null;
    
    const cabinet = state.thoughtCabinet;
    
    // Must be researching
    if (!cabinet.researching?.[thoughtId]) {
        return null;
    }
    
    // Check cap
    const maxSlots = getMaxInternalizedSlots();
    if ((cabinet.internalized || []).length >= maxSlots) {
        return null;
    }
    
    const thought = cabinet.customThoughts?.[thoughtId];
    if (!thought) return null;
    
    // Remove from researching
    delete cabinet.researching[thoughtId];
    
    // Add to internalized
    if (!cabinet.internalized) cabinet.internalized = [];
    cabinet.internalized.push(thoughtId);
    
    // Mark completion time
    thought.internalizedAt = Date.now();
    
    console.log('[Tribunal] Thought internalized:', thought.name);
    console.log('[Tribunal] Bonuses:', thought.internalizedBonus);
    console.log('[Tribunal] Special effect:', thought.specialEffect);
    
    // DISCHARGE THE THOUGHT'S THEME
    dischargeThoughtTheme(thought);
    
    saveChatState();
    return thought;
}

/**
 * Forget an internalized thought
 * Removes bonuses and special effects
 * @param {string} thoughtId 
 * @returns {boolean} Success
 */
export function forgetThought(thoughtId) {
    const state = getChatState();
    if (!state) return false;
    
    const cabinet = state.thoughtCabinet;
    
    const idx = (cabinet.internalized || []).indexOf(thoughtId);
    if (idx === -1) return false;
    
    // Remove from internalized
    cabinet.internalized.splice(idx, 1);
    
    // Add to forgotten (can't re-discover)
    if (!cabinet.forgotten) cabinet.forgotten = [];
    cabinet.forgotten.push(thoughtId);
    
    console.log('[Tribunal] Thought forgotten:', thoughtId);
    
    saveChatState();
    return true;
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Add a generated thought to the cabinet
 * @param {Object} thought - Generated thought data
 * @returns {Object|null} The saved thought, or null on failure
 */
export function addGeneratedThought(thought) {
    const state = getChatState();
    if (!state) return null;
    
    if (!state.thoughtCabinet) {
        state.thoughtCabinet = {};
    }
    
    const cabinet = state.thoughtCabinet;
    
    // Generate ID if not present
    if (!thought.id) {
        thought.id = 'thought_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    // Initialize storage
    if (!cabinet.customThoughts) cabinet.customThoughts = {};
    if (!cabinet.discovered) cabinet.discovered = [];
    
    // Store the thought
    cabinet.customThoughts[thought.id] = thought;
    
    // Add to discovered
    cabinet.discovered.push(thought.id);
    
    console.log('[Tribunal] Thought added:', thought.name, '(', thought.id, ')');
    
    saveChatState();
    return thought;
}

// ═══════════════════════════════════════════════════════════════
// PLAYER CONTEXT
// ═══════════════════════════════════════════════════════════════

/**
 * Get player context for thought generation
 * @returns {Object} { perspective, identity }
 */
export function getPlayerContext() {
    const state = getChatState();
    return state?.thoughtCabinet?.playerContext || {
        perspective: 'observer',
        identity: ''
    };
}

/**
 * Set player context
 * @param {Object} context - { perspective?, identity? }
 */
export function setPlayerContext(context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.thoughtCabinet) state.thoughtCabinet = {};
    if (!state.thoughtCabinet.playerContext) {
        state.thoughtCabinet.playerContext = { perspective: 'observer', identity: '' };
    }
    
    Object.assign(state.thoughtCabinet.playerContext, context);
    saveChatState();
}

// ═══════════════════════════════════════════════════════════════
// CABINET STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Reset cabinet state (for chat changes)
 */
export function resetCabinetState() {
    const state = getChatState();
    if (!state) return;
    
    // Don't wipe everything - just reset transient data
    // Thoughts are per-chat and should persist
    console.log('[Tribunal] Cabinet state preserved for current chat');
}

/**
 * Get cabinet summary for UI
 * @returns {Object} { discovered, researching, internalized, maxInternalized }
 */
export function getCabinetSummary() {
    const cabinet = getThoughtCabinet();
    
    return {
        discovered: (cabinet?.discovered || []).length,
        researching: Object.keys(cabinet?.researching || {}).length,
        internalized: (cabinet?.internalized || []).length,
        maxInternalized: getMaxInternalizedSlots()
    };
}

// ═══════════════════════════════════════════════════════════════
// BONUS CALCULATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get total penalties from all researching thoughts
 * @returns {Object} { skillId: { value: total, flavors: ["reason1", "reason2"] } }
 */
export function getResearchPenalties() {
    const cabinet = getThoughtCabinet();
    const penalties = {};
    
    for (const thoughtId of Object.keys(cabinet?.researching || {})) {
        const thought = cabinet.customThoughts?.[thoughtId];
        
        if (thought?.researchBonus) {
            for (const [skillId, data] of Object.entries(thought.researchBonus)) {
                const value = typeof data === 'number' ? data : data.value;
                const flavor = typeof data === 'object' ? data.flavor : null;
                
                if (!penalties[skillId]) {
                    penalties[skillId] = { value: 0, flavors: [] };
                }
                
                penalties[skillId].value += value;
                if (flavor) {
                    penalties[skillId].flavors.push(flavor);
                }
            }
        }
    }
    
    return penalties;
}

/**
 * Get total bonuses from all internalized thoughts
 * @returns {Object} { skillId: { value: total, flavors: ["reason1", "reason2"] } }
 */
export function getInternalizedBonuses() {
    const cabinet = getThoughtCabinet();
    const bonuses = {};
    
    for (const thoughtId of cabinet?.internalized || []) {
        const thought = cabinet.customThoughts?.[thoughtId];
        
        if (thought?.internalizedBonus) {
            for (const [skillId, data] of Object.entries(thought.internalizedBonus)) {
                const value = typeof data === 'number' ? data : data.value;
                const flavor = typeof data === 'object' ? data.flavor : null;
                
                if (!bonuses[skillId]) {
                    bonuses[skillId] = { value: 0, flavors: [] };
                }
                
                bonuses[skillId].value += value;
                if (flavor) {
                    bonuses[skillId].flavors.push(flavor);
                }
            }
        }
    }
    
    return bonuses;
}

/**
 * Get combined skill modifiers (research penalties + internalized bonuses)
 * This is what should be applied to skill checks
 * @returns {Object} { skillId: netModifier }
 */
export function getSkillModifiers() {
    const penalties = getResearchPenalties();
    const bonuses = getInternalizedBonuses();
    
    const combined = {};
    
    // Add all penalties
    for (const [skillId, data] of Object.entries(penalties)) {
        combined[skillId] = (combined[skillId] || 0) + data.value;
    }
    
    // Add all bonuses
    for (const [skillId, data] of Object.entries(bonuses)) {
        combined[skillId] = (combined[skillId] || 0) + data.value;
    }
    
    return combined;
}

/**
 * Format bonuses for display (like the game shows them)
 * @param {Object} bonusObj - { skillId: { value, flavor } } or { skillId: number }
 * @returns {Array} [{ skillId, value, flavor, display: "+1 Inland Empire: Sober" }]
 */
export function formatBonusesForDisplay(bonusObj) {
    if (!bonusObj) return [];
    
    return Object.entries(bonusObj).map(([skillId, data]) => {
        const value = typeof data === 'number' ? data : data.value;
        const flavor = typeof data === 'object' ? data.flavor : null;
        
        const sign = value >= 0 ? '+' : '';
        const display = flavor 
            ? `${sign}${value} ${skillId}: ${flavor}`
            : `${sign}${value} ${skillId}`;
        
        return { skillId, value, flavor, display };
    });
}

// ═══════════════════════════════════════════════════════════════
// SPECIAL EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if any internalized thought has a specific effect
 * @param {string} effectType - Effect type from SPECIAL_EFFECTS
 * @returns {Object|null} The effect data if found, null otherwise
 */
export function hasSpecialEffect(effectType) {
    const cabinet = getThoughtCabinet();
    
    for (const thoughtId of cabinet?.internalized || []) {
        const thought = cabinet.customThoughts?.[thoughtId];
        
        if (thought?.specialEffect?.type === effectType) {
            return thought.specialEffect;
        }
    }
    
    return null;
}

/**
 * Get all active special effects
 * @returns {Array} Array of { type, target, value, fromThought }
 */
export function getActiveSpecialEffects() {
    const cabinet = getThoughtCabinet();
    const effects = [];
    
    for (const thoughtId of cabinet?.internalized || []) {
        const thought = cabinet.customThoughts?.[thoughtId];
        
        if (thought?.specialEffect) {
            effects.push({
                ...thought.specialEffect,
                fromThought: thought.name
            });
        }
    }
    
    return effects;
}

/**
 * Check if a specific buff source is blocked by "no buff from X" effects
 * @param {string} source - The source to check (e.g., "alcohol", "drugs")
 * @returns {boolean} True if buffs from this source are blocked
 */
export function isBuffBlocked(source) {
    const effect = hasSpecialEffect(SPECIAL_EFFECTS.NO_BUFF_FROM);
    return effect?.target?.toLowerCase() === source.toLowerCase();
}

/**
 * Get voice modifier for a skill (amplify/silence effects)
 * @param {string} skillId - Skill to check
 * @returns {Object} { amplified: boolean, silenced: boolean }
 */
export function getVoiceModifier(skillId) {
    const result = { amplified: false, silenced: false };
    
    const amplify = hasSpecialEffect(SPECIAL_EFFECTS.VOICE_AMPLIFY);
    if (amplify?.target === skillId) {
        result.amplified = true;
    }
    
    const silence = hasSpecialEffect(SPECIAL_EFFECTS.VOICE_SILENCE);
    if (silence?.target === skillId) {
        result.silenced = true;
    }
    
    return result;
}

/**
 * Get the maximum internalized slots (base + bonus)
 * @returns {number}
 */
export function getMaxInternalizedSlots() {
    let max = MAX_INTERNALIZED;
    
    const slotBonus = hasSpecialEffect(SPECIAL_EFFECTS.THOUGHT_SLOT);
    if (slotBonus) {
        max += slotBonus.value || 1;
    }
    
    return max;
}

/**
 * Get research speed multiplier from special effects
 * @returns {number} Multiplier (1.0 = normal, 1.5 = 50% faster)
 */
export function getResearchSpeedMultiplier() {
    const effect = hasSpecialEffect(SPECIAL_EFFECTS.RESEARCH_SPEED);
    return effect?.value || 1.0;
}

/**
 * Check if a theme is "spiking" (high enough to suggest thought generation)
 * @param {number} threshold - Count threshold (default: THEME_SPIKE_THRESHOLD)
 * @returns {Object|null} Spiking theme or null
 */
export function getSpikingTheme(threshold = THEME_SPIKE_THRESHOLD) {
    const themes = getThemeCounters();
    
    for (const [id, count] of Object.entries(themes)) {
        if (count >= threshold && THEMES[id]) {
            return { id, ...THEMES[id], count };
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// STUB EXPORTS (for compatibility with other code)
// ═══════════════════════════════════════════════════════════════

export function incrementMessageCount() {
    // Handled by state.js
}

export function recordCriticalSuccess(skillId) {
    console.log('[Tribunal] Critical success:', skillId);
    // Could track this for thought discovery conditions
}

export function recordCriticalFailure(skillId) {
    console.log('[Tribunal] Critical failure:', skillId);
    // Could track this for thought discovery conditions
}

export function recordAncientVoiceTriggered() {
    console.log('[Tribunal] Ancient voice triggered');
}

export function checkThoughtDiscovery() {
    // In the new system, thoughts are generated on demand, not auto-discovered
    return [];
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════

export { THEMES };
