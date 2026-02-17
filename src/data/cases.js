/**
 * The Tribunal - Cases Data
 * Disco Elysium-style task/case tracking
 * 
 * Cases are grouped by the day they were discovered.
 * Each case can have sub-tasks, descriptions, and various states.
 * 
 * @version 2.0.0 - Theme-tagged cases:
 *   - Cases carry a theme field (mystery, love, violence, etc.)
 *   - inferTheme() auto-tags based on title/description content
 *   - CASE_THEME_KEYWORDS maps content words → theme IDs
 *   - sourceThoughtId/sourceThoughtName for thought-spawned cases
 */

// ═══════════════════════════════════════════════════════════════
// CASE STATES
// ═══════════════════════════════════════════════════════════════

export const CASE_STATUS = {
    ACTIVE: 'active',           // White text, normal
    COMPLETED: 'completed',     // Strikethrough
    FAILED: 'failed',           // Red strikethrough
    TIMED: 'timed'              // Has a time limit (⏱ icon)
};

// ═══════════════════════════════════════════════════════════════
// CASE PRIORITIES (for sorting within a day)
// ═══════════════════════════════════════════════════════════════

export const CASE_PRIORITY = {
    MAIN: 'main',               // Primary investigation thread
    SIDE: 'side',               // Side task
    OPTIONAL: 'optional'        // Optional/discoverable
};

// ═══════════════════════════════════════════════════════════════
// CASE THEME INFERENCE
// Maps content keywords → theme IDs for auto-tagging.
// A case about "murder weapon" gets tagged mystery+violence.
// The FIRST match with highest keyword count wins.
// ═══════════════════════════════════════════════════════════════

export const CASE_THEME_KEYWORDS = {
    mystery: [
        'investigate', 'clue', 'evidence', 'mystery', 'secret', 'hidden',
        'discover', 'uncover', 'truth', 'suspicious', 'missing', 'strange',
        'solve', 'enigma', 'puzzle', 'cipher', 'riddle', 'unknown',
        'disappearance', 'trace', 'lead', 'witness', 'alibi', 'suspect'
    ],
    violence: [
        'kill', 'fight', 'defeat', 'destroy', 'attack', 'weapon',
        'murder', 'blood', 'wound', 'combat', 'battle', 'war',
        'threat', 'danger', 'armed', 'hunt', 'ambush', 'confront',
        'slay', 'execute', 'revenge', 'duel', 'assault'
    ],
    love: [
        'love', 'heart', 'romance', 'kiss', 'feelings', 'relationship',
        'beloved', 'affection', 'desire', 'passion', 'jealousy', 'longing',
        'letter', 'confession', 'admirer', 'devotion', 'betray', 'trust',
        'together', 'alone', 'miss', 'embrace', 'gift'
    ],
    death: [
        'death', 'dead', 'die', 'grave', 'funeral', 'corpse',
        'ghost', 'spirit', 'afterlife', 'mourning', 'loss', 'memorial',
        'remains', 'tomb', 'cemetery', 'eulogy', 'departed', 'soul'
    ],
    authority: [
        'order', 'command', 'law', 'rule', 'power', 'control',
        'leader', 'obey', 'authority', 'rank', 'duty', 'enforce',
        'justice', 'court', 'judge', 'arrest', 'badge', 'uniform',
        'hierarchy', 'rebellion', 'submit', 'defiance'
    ],
    paranoia: [
        'follow', 'watch', 'spy', 'conspiracy', 'paranoia', 'trust',
        'betray', 'lie', 'deceive', 'trap', 'surveillance', 'bug',
        'shadow', 'listening', 'double', 'infiltrate', 'mole', 'agent',
        'suspicious', 'plot', 'scheme'
    ],
    money: [
        'money', 'gold', 'treasure', 'pay', 'debt', 'steal',
        'buy', 'sell', 'trade', 'profit', 'wealth', 'fortune',
        'coin', 'price', 'deal', 'negotiate', 'bribe', 'ransom',
        'heist', 'vault', 'reward', 'bounty', 'loot'
    ],
    identity: [
        'remember', 'forget', 'identity', 'past', 'memory', 'self',
        'mirror', 'name', 'who', 'face', 'recognize', 'amnesia',
        'origin', 'birth', 'home', 'belong', 'purpose', 'destiny'
    ],
    substance: [
        'drug', 'drink', 'alcohol', 'smoke', 'addiction', 'sober',
        'intoxicated', 'dose', 'pill', 'potion', 'elixir', 'brew',
        'withdrawal', 'craving', 'stash', 'dealer', 'fix', 'high'
    ],
    supernatural: [
        'magic', 'spell', 'curse', 'supernatural', 'ancient', 'ritual',
        'prophecy', 'vision', 'omen', 'artifact', 'relic', 'enchant',
        'demon', 'divine', 'sacred', 'profane', 'portal', 'dimension',
        'haunted', 'apparition', 'oracle', 'hex', 'arcane', 'rune'
    ],
    failure: [
        'fail', 'mistake', 'regret', 'sorry', 'apologize', 'wrong',
        'broken', 'ruin', 'shame', 'guilt', 'disappoint', 'lose',
        'abandon', 'neglect', 'coward', 'weak'
    ],
    philosophy: [
        'meaning', 'exist', 'purpose', 'truth', 'believe', 'faith',
        'question', 'morality', 'ethics', 'conscience', 'free will',
        'nihilism', 'absurd', 'reason', 'wisdom'
    ]
};

/**
 * Infer a theme from case title + description content.
 * Returns the theme ID with the most keyword matches, or null.
 * 
 * @param {string} title - Case title
 * @param {string} description - Case description
 * @returns {string|null} Theme ID or null if no strong match
 */
export function inferTheme(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const words = text.split(/\s+/);
    
    let bestTheme = null;
    let bestScore = 0;
    
    for (const [themeId, keywords] of Object.entries(CASE_THEME_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            // Check both whole-word and substring (for stemming: "murdered" matches "murder")
            if (words.some(w => w.includes(keyword) || keyword.includes(w))) {
                score++;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestTheme = themeId;
        }
    }
    
    // Require at least 1 keyword match to tag
    return bestScore >= 1 ? bestTheme : null;
}

// ═══════════════════════════════════════════════════════════════
// DATA STRUCTURE
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new case/task
 * @param {object} options
 * @returns {object} Case object
 */
export function createCase(options = {}) {
    const now = Date.now();
    
    // Auto-infer theme if not provided
    const theme = options.theme || inferTheme(options.title || '', options.description || '');
    
    return {
        id: options.id || `case_${now}`,
        
        // Content
        title: options.title || 'Untitled Task',
        rawTitle: options.rawTitle || null,       // Original pre-genre-rewrite title
        description: options.description || '',
        
        // Categorization
        priority: options.priority || CASE_PRIORITY.SIDE,
        status: options.status || CASE_STATUS.ACTIVE,
        theme: theme,                             // mystery, love, violence, etc.
        
        // Timing
        filedAt: options.filedAt || now,
        filedDay: options.filedDay || getCurrentDay(),
        completedAt: options.completedAt || null,
        deadline: options.deadline || null,  // For timed tasks
        
        // Relationships
        parentId: options.parentId || null,  // For sub-tasks
        subtasks: options.subtasks || [],    // Array of case IDs
        
        // Hints/leads (sub-bullets in DE)
        hints: options.hints || [],          // Array of { text, completed }
        
        // Metadata
        discoveredVia: options.discoveredVia || null,  // How was this discovered?
        relatedContacts: options.relatedContacts || [], // Contact IDs
        relatedLocations: options.relatedLocations || [], // Location IDs
        
        // Source tracking
        sourceThoughtId: options.sourceThoughtId || null,     // If spawned from thought cabinet
        sourceThoughtName: options.sourceThoughtName || null,  // Display name of source thought
        
        // For AI tracking
        manuallyAdded: options.manuallyAdded ?? true,
        aiGenerated: options.aiGenerated ?? false
    };
}

/**
 * Create a hint/lead for a case
 * @param {string} text 
 * @param {boolean} completed 
 * @returns {object}
 */
export function createHint(text, completed = false) {
    return {
        id: `hint_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text,
        completed,
        addedAt: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// DAY HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current in-game day
 * For now, just uses real day names. Could tie into a world state later.
 */
export function getCurrentDay() {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
}

/**
 * Format a timestamp for display
 * @param {number} timestamp 
 * @returns {string} e.g., "MONDAY 09:28"
 */
export function formatFiledTime(timestamp, day = null) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const dayName = day || getCurrentDay();
    return `${dayName} ${hours}:${minutes}`;
}

// ═══════════════════════════════════════════════════════════════
// CASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Mark a case as completed
 * @param {object} caseObj 
 * @returns {object} Updated case
 */
export function completeCase(caseObj) {
    return {
        ...caseObj,
        status: CASE_STATUS.COMPLETED,
        completedAt: Date.now()
    };
}

/**
 * Mark a case as failed
 * @param {object} caseObj 
 * @returns {object} Updated case
 */
export function failCase(caseObj) {
    return {
        ...caseObj,
        status: CASE_STATUS.FAILED,
        completedAt: Date.now()
    };
}

/**
 * Reopen a completed/failed case
 * @param {object} caseObj 
 * @returns {object} Updated case
 */
export function reopenCase(caseObj) {
    return {
        ...caseObj,
        status: CASE_STATUS.ACTIVE,
        completedAt: null
    };
}

/**
 * Toggle a hint's completion state
 * @param {object} caseObj 
 * @param {string} hintId 
 * @returns {object} Updated case
 */
export function toggleHint(caseObj, hintId) {
    return {
        ...caseObj,
        hints: caseObj.hints.map(h => 
            h.id === hintId ? { ...h, completed: !h.completed } : h
        )
    };
}

/**
 * Add a hint to a case
 * @param {object} caseObj 
 * @param {string} hintText 
 * @returns {object} Updated case
 */
export function addHint(caseObj, hintText) {
    return {
        ...caseObj,
        hints: [...caseObj.hints, createHint(hintText)]
    };
}

// ═══════════════════════════════════════════════════════════════
// GROUPING & SORTING
// ═══════════════════════════════════════════════════════════════

/**
 * Group cases by the day they were filed
 * @param {object} cases - Object of { id: caseObj }
 * @returns {object} { 'MONDAY': [...], 'TUESDAY': [...] }
 */
export function groupCasesByDay(cases) {
    const groups = {};
    
    // Day order for sorting (most recent first in DE)
    const dayOrder = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    for (const caseObj of Object.values(cases)) {
        const day = caseObj.filedDay || 'UNKNOWN';
        if (!groups[day]) {
            groups[day] = [];
        }
        groups[day].push(caseObj);
    }
    
    // Sort cases within each day by priority then by filed time
    for (const day of Object.keys(groups)) {
        groups[day].sort((a, b) => {
            // Main > Side > Optional
            const priorityOrder = { main: 0, side: 1, optional: 2 };
            const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by filed time (newest first)
            return b.filedAt - a.filedAt;
        });
    }
    
    return groups;
}

/**
 * Separate active and closed cases
 * @param {object} cases - Object of { id: caseObj }
 * @returns {object} { active: {...}, closed: {...} }
 */
export function separateActiveClosed(cases) {
    const active = {};
    const closed = {};
    
    for (const [id, caseObj] of Object.entries(cases)) {
        // Skip sub-tasks - they show under their parent
        if (caseObj.parentId) continue;
        
        if (caseObj.status === CASE_STATUS.COMPLETED || caseObj.status === CASE_STATUS.FAILED) {
            closed[id] = caseObj;
        } else {
            active[id] = caseObj;
        }
    }
    
    return { active, closed };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
    CASE_STATUS,
    CASE_PRIORITY,
    CASE_THEME_KEYWORDS,
    createCase,
    createHint,
    inferTheme,
    getCurrentDay,
    formatFiledTime,
    completeCase,
    failCase,
    reopenCase,
    toggleHint,
    addHint,
    groupCasesByDay,
    separateActiveClosed
};
