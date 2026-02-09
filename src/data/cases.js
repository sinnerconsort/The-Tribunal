/**
 * The Tribunal - Cases Data
 * Disco Elysium-style task/case tracking
 * 
 * Cases are grouped by the day they were discovered.
 * Each case can have sub-tasks, descriptions, and various states.
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
// DATA STRUCTURE
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new case/task
 * @param {object} options
 * @returns {object} Case object
 */
export function createCase(options = {}) {
    const now = Date.now();
    return {
        id: options.id || `case_${now}`,
        
        // Content
        title: options.title || 'Untitled Task',
        description: options.description || '',
        
        // Categorization
        priority: options.priority || CASE_PRIORITY.SIDE,
        status: options.status || CASE_STATUS.ACTIVE,
        
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
    createCase,
    createHint,
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
