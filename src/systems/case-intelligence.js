/**
 * The Tribunal - Case Intelligence
 * Auto-detects tasks/quests from chat messages
 * 
 * Approaches:
 * 1. Pattern matching - looks for quest-like phrases
 * 2. (Future) AI extraction - asks model to identify objectives
 */

import { createCase, CASE_PRIORITY } from '../data/cases.js';
import { getChatState, saveChatState } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// QUEST DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════

/**
 * Patterns that suggest a quest/task is being given
 * Each pattern has:
 * - regex: The pattern to match
 * - priority: Suggested priority for detected tasks
 * - extract: Function to extract the task title from the match
 */
const QUEST_PATTERNS = [
    // Direct imperatives - "You must find the key"
    {
        regex: /you (?:must|need to|have to|should|ought to) ([^.!?]{10,60})/gi,
        priority: CASE_PRIORITY.MAIN,
        extract: (match) => capitalizeFirst(match[1].trim())
    },
    
    // Quest assignments - "Your mission is to..."
    {
        regex: /your (?:quest|mission|task|objective|goal) (?:is|will be) (?:to )?([^.!?]{10,60})/gi,
        priority: CASE_PRIORITY.MAIN,
        extract: (match) => capitalizeFirst(match[1].trim())
    },
    
    // Find/Retrieve quests - "Find the ancient artifact"
    {
        regex: /(?:^|\. )(?:find|locate|retrieve|recover|fetch|get|obtain|acquire) (?:the |a |an )?([^.!?]{5,50})/gi,
        priority: CASE_PRIORITY.SIDE,
        extract: (match) => `Find ${match[1].trim()}`
    },
    
    // Defeat/Kill quests - "Defeat the dragon"
    {
        regex: /(?:^|\. )(?:defeat|kill|destroy|eliminate|stop|confront) (?:the |a |an )?([^.!?]{5,50})/gi,
        priority: CASE_PRIORITY.SIDE,
        extract: (match) => `Defeat ${match[1].trim()}`
    },
    
    // Talk/Speak quests - "Talk to the merchant"
    {
        regex: /(?:^|\. )(?:talk to|speak (?:to|with)|ask|question|interrogate|interview) (?:the |a |an )?([^.!?]{5,50})/gi,
        priority: CASE_PRIORITY.SIDE,
        extract: (match) => `Talk to ${match[1].trim()}`
    },
    
    // Go/Travel quests - "Go to the castle"
    {
        regex: /(?:^|\. )(?:go to|travel to|head to|visit|explore|investigate) (?:the |a |an )?([^.!?]{5,50})/gi,
        priority: CASE_PRIORITY.SIDE,
        extract: (match) => `Go to ${match[1].trim()}`
    },
    
    // Protect/Escort quests
    {
        regex: /(?:^|\. )(?:protect|escort|guard|defend|save) (?:the |a |an )?([^.!?]{5,50})/gi,
        priority: CASE_PRIORITY.MAIN,
        extract: (match) => `Protect ${match[1].trim()}`
    },
    
    // Deliver quests
    {
        regex: /(?:^|\. )(?:deliver|bring|take|carry) (?:the |a |an )?([^.!?]{5,50}) to/gi,
        priority: CASE_PRIORITY.SIDE,
        extract: (match) => `Deliver ${match[1].trim()}`
    },
    
    // Optional hints - "You could also..." "If you want..."
    {
        regex: /(?:you could(?: also)?|if you (?:want|wish)|optionally|perhaps you should) ([^.!?]{10,60})/gi,
        priority: CASE_PRIORITY.OPTIONAL,
        extract: (match) => capitalizeFirst(match[1].trim())
    }
];

/**
 * Phrases that indicate a quest might be completed
 */
const COMPLETION_PATTERNS = [
    /you (?:have |'ve )?(?:completed|finished|accomplished|done|succeeded)/gi,
    /(?:quest|mission|task|objective) (?:complete|finished|accomplished|done)/gi,
    /(?:congratulations|well done|excellent).*(?:you|your)/gi,
    /you (?:found|retrieved|recovered|obtained|acquired|got) (?:the |a |an )?([^.!?]+)/gi,
    /you (?:defeated|killed|destroyed|eliminated|stopped) (?:the |a |an )?([^.!?]+)/gi,
    /you (?:reached|arrived at|made it to) (?:the |a |an )?([^.!?]+)/gi
];

// ═══════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Scan a message for potential quests/tasks
 * @param {string} messageText - The AI message to scan
 * @returns {Array} Array of detected quest objects
 */
export function detectQuests(messageText) {
    if (!messageText || typeof messageText !== 'string') return [];
    
    const detected = [];
    const seenTitles = new Set();
    
    for (const pattern of QUEST_PATTERNS) {
        // Reset regex state
        pattern.regex.lastIndex = 0;
        
        let match;
        while ((match = pattern.regex.exec(messageText)) !== null) {
            try {
                const title = pattern.extract(match);
                
                // Skip if too short, too long, or already seen
                if (!title || title.length < 5 || title.length > 80) continue;
                if (seenTitles.has(title.toLowerCase())) continue;
                
                // Skip if it looks like a fragment
                if (title.endsWith(' the') || title.endsWith(' a') || title.endsWith(' an')) continue;
                
                seenTitles.add(title.toLowerCase());
                
                detected.push({
                    title: cleanTitle(title),
                    priority: pattern.priority,
                    source: match[0].substring(0, 100) // First 100 chars for context
                });
            } catch (e) {
                console.warn('[CaseIntel] Pattern extraction error:', e);
            }
        }
    }
    
    return detected;
}

/**
 * Check if a message suggests quest completion
 * @param {string} messageText - The AI message to scan
 * @returns {Array} Array of potential completion hints
 */
export function detectCompletions(messageText) {
    if (!messageText || typeof messageText !== 'string') return [];
    
    const hints = [];
    
    for (const pattern of COMPLETION_PATTERNS) {
        pattern.lastIndex = 0;
        
        let match;
        while ((match = pattern.exec(messageText)) !== null) {
            hints.push({
                text: match[0],
                subject: match[1] || null // The thing that was completed/found/etc
            });
        }
    }
    
    return hints;
}

// ═══════════════════════════════════════════════════════════════
// AUTO-TRACKING
// ═══════════════════════════════════════════════════════════════

// Track recently detected quests to avoid duplicates
const recentlyDetected = new Map(); // title -> timestamp
const DUPLICATE_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * Process a message for quest detection and auto-create cases
 * @param {string} messageText - The AI message
 * @param {object} options - Processing options
 * @returns {object} Results of processing
 */
export async function processMessageForQuests(messageText, options = {}) {
    const { autoCreate = false, notifyCallback = null } = options;
    
    const results = {
        detected: [],
        created: [],
        completionHints: []
    };
    
    // Detect quests
    const quests = detectQuests(messageText);
    results.detected = quests;
    
    // Detect completions
    const completions = detectCompletions(messageText);
    results.completionHints = completions;
    
    // Auto-create cases if enabled
    if (autoCreate && quests.length > 0) {
        const state = getChatState();
        if (!state) return results;
        if (!state.cases) state.cases = {};
        
        for (const quest of quests) {
            // Check for duplicates (recent or existing)
            const titleLower = quest.title.toLowerCase();
            
            // Skip if recently detected
            const lastSeen = recentlyDetected.get(titleLower);
            if (lastSeen && Date.now() - lastSeen < DUPLICATE_WINDOW) {
                continue;
            }
            
            // Skip if similar case already exists
            const existingTitles = Object.values(state.cases).map(c => c.title.toLowerCase());
            if (existingTitles.some(t => similarity(t, titleLower) > 0.7)) {
                continue;
            }
            
            // Create the case
            const newCase = createCase({
                title: quest.title,
                priority: quest.priority,
                description: `Detected from: "${quest.source.substring(0, 80)}..."`,
                manuallyAdded: false,
                aiGenerated: true
            });
            
            state.cases[newCase.id] = newCase;
            results.created.push(newCase);
            recentlyDetected.set(titleLower, Date.now());
            
            // Notify if callback provided
            if (notifyCallback) {
                notifyCallback(`New task detected: ${quest.title}`);
            }
        }
        
        if (results.created.length > 0) {
            saveChatState();
        }
    }
    
    return results;
}

/**
 * Try to match completion hints to existing cases
 * @param {Array} completionHints - From detectCompletions
 * @param {object} cases - Current cases object
 * @returns {Array} Cases that might be complete
 */
export function matchCompletionsToCase(completionHints, cases) {
    const potentialMatches = [];
    
    if (!completionHints || !cases) return potentialMatches;
    
    for (const hint of completionHints) {
        if (!hint.subject) continue;
        
        const subjectLower = hint.subject.toLowerCase();
        
        for (const [id, caseObj] of Object.entries(cases)) {
            if (caseObj.status !== 'active') continue;
            
            const titleLower = caseObj.title.toLowerCase();
            
            // Check if the subject matches the case title
            if (titleLower.includes(subjectLower) || subjectLower.includes(titleLower)) {
                potentialMatches.push({
                    caseId: id,
                    caseTitle: caseObj.title,
                    hint: hint.text
                });
            }
        }
    }
    
    return potentialMatches;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanTitle(title) {
    return title
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/["""]/g, '')          // Remove quotes
        .replace(/\s*[,;]\s*$/, '')     // Remove trailing punctuation
        .trim();
}

/**
 * Simple similarity score between two strings (0-1)
 */
function similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1;
    
    // Check if one contains the other
    if (longer.includes(shorter)) return shorter.length / longer.length;
    
    // Simple word overlap
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = [...aWords].filter(w => bWords.has(w));
    
    return intersection.length / Math.max(aWords.size, bWords.size);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    detectQuests,
    detectCompletions,
    processMessageForQuests,
    matchCompletionsToCase
};
