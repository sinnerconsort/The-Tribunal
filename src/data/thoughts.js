/**
 * The Tribunal - Thought Cabinet Data (Simplified)
 * 
 * THEMES: Used for tracking what's happening in the story
 * Thoughts are now generated dynamically instead of preset
 * 
 * @version 4.1.0 - Lucide icons replacing emojis
 */

// ============================================================================
// LUCIDE ICONS - SVG strings for themes
// Using 16x16 size for inline use, currentColor for CSS control
// ============================================================================

export const THEME_ICONS = {
    death: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`,
    
    love: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    
    violence: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/></svg>`,
    
    mystery: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    
    substance: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
    
    failure: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
    
    identity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg>`,
    
    authority: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    
    paranoia: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97"/><path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"/><path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15"/><path d="M2 21v-4"/><path d="M7 9h.01"/></svg>`,
    
    philosophy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M12 18v-6"/></svg>`,
    
    money: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
    
    supernatural: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`
};

// Fallback icon for thoughts without a defined icon
export const FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;

// ============================================================================
// THEMES - Keep these! Used for auto-detection and thought generation context
// ============================================================================

export const THEMES = {
    death: {
        id: 'death',
        name: 'Death',
        icon: THEME_ICONS.death,
        keywords: ['death', 'dead', 'dying', 'kill', 'murder', 'corpse', 'funeral', 'grave', 'mortality', 'deceased', 'fatal', 'lethal', 'body', 'remains']
    },
    love: {
        id: 'love',
        name: 'Love',
        icon: THEME_ICONS.love,
        keywords: ['love', 'heart', 'romance', 'passion', 'desire', 'affection', 'beloved', 'darling', 'intimate', 'tender', 'devotion', 'relationship', 'partner']
    },
    violence: {
        id: 'violence',
        name: 'Violence',
        icon: THEME_ICONS.violence,
        keywords: ['violence', 'fight', 'hit', 'punch', 'blood', 'brutal', 'attack', 'weapon', 'wound', 'harm', 'hurt', 'aggressive', 'beat', 'strike']
    },
    mystery: {
        id: 'mystery',
        name: 'Mystery',
        icon: THEME_ICONS.mystery,
        keywords: ['mystery', 'clue', 'evidence', 'investigate', 'secret', 'hidden', 'unknown', 'suspicious', 'curious', 'strange', 'puzzle', 'case', 'detective']
    },
    substance: {
        id: 'substance',
        name: 'Substances',
        icon: THEME_ICONS.substance,
        keywords: ['drug', 'alcohol', 'drunk', 'high', 'smoke', 'pill', 'needle', 'addict', 'sober', 'intoxicated', 'withdrawal', 'bottle', 'drink']
    },
    failure: {
        id: 'failure',
        name: 'Failure',
        icon: THEME_ICONS.failure,
        keywords: ['fail', 'failure', 'mistake', 'wrong', 'error', 'lose', 'lost', 'regret', 'shame', 'disappoint', 'mess', 'screw', 'ruin', 'broken']
    },
    identity: {
        id: 'identity',
        name: 'Identity',
        icon: THEME_ICONS.identity,
        keywords: ['identity', 'who', 'self', 'name', 'person', 'remember', 'forget', 'past', 'memory', 'amnesia', 'mirror', 'face', 'real']
    },
    authority: {
        id: 'authority',
        name: 'Authority',
        icon: THEME_ICONS.authority,
        keywords: ['authority', 'power', 'control', 'command', 'order', 'law', 'rule', 'badge', 'cop', 'police', 'respect', 'officer', 'detective']
    },
    paranoia: {
        id: 'paranoia',
        name: 'Paranoia',
        icon: THEME_ICONS.paranoia,
        keywords: ['paranoia', 'paranoid', 'watch', 'follow', 'conspiracy', 'suspicious', 'spy', 'trust', 'betray', 'trap', 'danger', 'threat', 'enemy']
    },
    philosophy: {
        id: 'philosophy',
        name: 'Philosophy',
        icon: THEME_ICONS.philosophy,
        keywords: ['philosophy', 'meaning', 'existence', 'truth', 'reality', 'consciousness', 'soul', 'mind', 'think', 'believe', 'question', 'purpose', 'why']
    },
    money: {
        id: 'money',
        name: 'Money',
        icon: THEME_ICONS.money,
        keywords: ['money', 'cash', 'rich', 'poor', 'wealth', 'poverty', 'coin', 'pay', 'debt', 'afford', 'expensive', 'cheap', 'broke', 'cost']
    },
    supernatural: {
        id: 'supernatural',
        name: 'Supernatural',
        icon: THEME_ICONS.supernatural,
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

/**
 * Get icon for a theme (with fallback)
 * @param {string} themeId
 * @returns {string} SVG string
 */
export function getThemeIcon(themeId) {
    return THEME_ICONS[themeId] || FALLBACK_ICON;
}

// ============================================================================
// THOUGHT STRUCTURE (for reference - generated thoughts should match this)
// ============================================================================

/**
 * Generated thoughts should have this structure:
 * {
 *   id: string,              // Generated: 'thought_' + timestamp
 *   name: string,            // Short evocative name
 *   icon: string,            // SVG string or theme icon reference
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
