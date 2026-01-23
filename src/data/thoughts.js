/**
 * The Tribunal - Thought Cabinet Data (Simplified)
 * 
 * THEMES: Used for tracking what's happening in the story
 * Thoughts are now generated dynamically instead of preset
 * 
 * @version 4.0.0 - Rebuild
 */

// ============================================================================
// THEMES - Keep these! Used for auto-detection and thought generation context
// ============================================================================

export const THEMES = {
    death: {
        id: 'death',
        name: 'Death',
        icon: '💀',
        keywords: ['death', 'dead', 'dying', 'kill', 'murder', 'corpse', 'funeral', 'grave', 'mortality', 'deceased', 'fatal', 'lethal', 'body', 'remains']
    },
    love: {
        id: 'love',
        name: 'Love',
        icon: '❤️',
        keywords: ['love', 'heart', 'romance', 'passion', 'desire', 'affection', 'beloved', 'darling', 'intimate', 'tender', 'devotion', 'relationship', 'partner']
    },
    violence: {
        id: 'violence',
        name: 'Violence',
        icon: '👊',
        keywords: ['violence', 'fight', 'hit', 'punch', 'blood', 'brutal', 'attack', 'weapon', 'wound', 'harm', 'hurt', 'aggressive', 'beat', 'strike']
    },
    mystery: {
        id: 'mystery',
        name: 'Mystery',
        icon: '🔍',
        keywords: ['mystery', 'clue', 'evidence', 'investigate', 'secret', 'hidden', 'unknown', 'suspicious', 'curious', 'strange', 'puzzle', 'case', 'detective']
    },
    substance: {
        id: 'substance',
        name: 'Substances',
        icon: '💊',
        keywords: ['drug', 'alcohol', 'drunk', 'high', 'smoke', 'pill', 'needle', 'addict', 'sober', 'intoxicated', 'withdrawal', 'bottle', 'drink']
    },
    failure: {
        id: 'failure',
        name: 'Failure',
        icon: '📉',
        keywords: ['fail', 'failure', 'mistake', 'wrong', 'error', 'lose', 'lost', 'regret', 'shame', 'disappoint', 'mess', 'screw', 'ruin', 'broken']
    },
    identity: {
        id: 'identity',
        name: 'Identity',
        icon: '🎭',
        keywords: ['identity', 'who', 'self', 'name', 'person', 'remember', 'forget', 'past', 'memory', 'amnesia', 'mirror', 'face', 'real']
    },
    authority: {
        id: 'authority',
        name: 'Authority',
        icon: '👮',
        keywords: ['authority', 'power', 'control', 'command', 'order', 'law', 'rule', 'badge', 'cop', 'police', 'respect', 'officer', 'detective']
    },
    paranoia: {
        id: 'paranoia',
        name: 'Paranoia',
        icon: '👁️',
        keywords: ['paranoia', 'paranoid', 'watch', 'follow', 'conspiracy', 'suspicious', 'spy', 'trust', 'betray', 'trap', 'danger', 'threat', 'enemy']
    },
    philosophy: {
        id: 'philosophy',
        name: 'Philosophy',
        icon: '🤔',
        keywords: ['philosophy', 'meaning', 'existence', 'truth', 'reality', 'consciousness', 'soul', 'mind', 'think', 'believe', 'question', 'purpose', 'why']
    },
    money: {
        id: 'money',
        name: 'Money',
        icon: '💰',
        keywords: ['money', 'cash', 'rich', 'poor', 'wealth', 'poverty', 'coin', 'pay', 'debt', 'afford', 'expensive', 'cheap', 'broke', 'cost']
    },
    supernatural: {
        id: 'supernatural',
        name: 'Supernatural',
        icon: '👻',
        keywords: ['ghost', 'spirit', 'supernatural', 'magic', 'curse', 'haunted', 'paranormal', 'psychic', 'vision', 'prophecy', 'omen', 'pale', 'strange']
    }
};

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

const THEME_CAP = 10;  // Max value per theme to prevent runaway scaling

/**
 * Detect themes present in a text
 * @param {string} text - Text to analyze
 * @returns {string[]} Array of detected theme IDs
 */
export function detectThemes(text) {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const detected = [];
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        const hasKeyword = theme.keywords.some(keyword => 
            lowerText.includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
            detected.push(themeId);
        }
    }
    
    return detected;
}

/**
 * Increment theme counters based on detected themes
 * @param {Object} themeCounters - Current theme counters { themeId: count }
 * @param {string[]} detectedThemes - Array of theme IDs to increment
 * @returns {Object} Updated theme counters (capped)
 */
export function incrementThemes(themeCounters, detectedThemes) {
    const updated = { ...themeCounters };
    
    for (const themeId of detectedThemes) {
        if (THEMES[themeId]) {
            updated[themeId] = Math.min((updated[themeId] || 0) + 1, THEME_CAP);
        }
    }
    
    return updated;
}

/**
 * Decrement a theme counter (when thought is internalized)
 * @param {Object} themeCounters - Current theme counters
 * @param {string} themeId - Theme to decrement
 * @returns {Object} Updated theme counters
 */
export function decrementTheme(themeCounters, themeId) {
    if (!themeId || !themeCounters[themeId]) return themeCounters;
    
    return {
        ...themeCounters,
        [themeId]: Math.max(themeCounters[themeId] - 1, 0)
    };
}

/**
 * Get top themes by count
 * @param {Object} themeCounters - Theme counters { themeId: count }
 * @param {number} limit - Max themes to return
 * @returns {Array} Top themes with full data [{ id, name, icon, count }]
 */
export function getTopThemes(themeCounters, limit = 3) {
    return Object.entries(themeCounters || {})
        .filter(([id, count]) => count > 0 && THEMES[id])
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({
            id,
            name: THEMES[id].name,
            icon: THEMES[id].icon,
            count
        }));
}

/**
 * Check if any theme has reached "spike" level (suggesting thought generation)
 * @param {Object} themeCounters - Theme counters
 * @param {number} threshold - Count threshold for spike (default 8)
 * @returns {Object|null} Spiking theme or null
 */
export function getSpikingTheme(themeCounters, threshold = 8) {
    for (const [id, count] of Object.entries(themeCounters || {})) {
        if (count >= threshold && THEMES[id]) {
            return { id, ...THEMES[id], count };
        }
    }
    return null;
}

/**
 * Get theme by ID with full data
 * @param {string} themeId 
 * @returns {Object|null}
 */
export function getTheme(themeId) {
    return THEMES[themeId] || null;
}

/**
 * Get all theme IDs
 * @returns {string[]}
 */
export function getAllThemeIds() {
    return Object.keys(THEMES);
}

// ============================================================================
// THOUGHT STRUCTURE (for reference - generated thoughts should match this)
// ============================================================================

/**
 * Generated thoughts should have this structure:
 * {
 *   id: string,              // Generated: 'thought_' + timestamp
 *   name: string,            // Short evocative name
 *   icon: string,            // Emoji
 *   theme: string,           // Primary theme ID
 *   problemText: string,     // Long rambling text while researching
 *   solutionText: string,    // Conclusion when internalized
 *   researchBonus: {         // Penalties while researching
 *     [skillId]: { value: number, flavor: string }
 *   },
 *   internalizedBonus: {     // Rewards when complete
 *     [skillId]: { value: number, flavor: string }
 *   }
 * }
 */

// Export constants
export const THEME_CAP_VALUE = THEME_CAP;
