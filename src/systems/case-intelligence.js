/**
 * The Tribunal - Case Intelligence
 * Auto-detects tasks/quests from chat messages
 * Links discoveries from investigation to relevant cases
 * 
 * Approaches:
 * 1. Pattern matching - looks for quest-like phrases
 * 2. Discovery matching - links investigation finds to active cases
 * 3. Theme inference - auto-tags cases by emotional territory
 * 4. Genre rewriting - cases get themed presentation via applyTemplateRewrite
 * 
 * @version 3.0.0 - Genre-aware case creation:
 *   - Auto-created cases get theme-tagged via inferTheme()
 *   - applyTemplateRewrite() gives genre presentation on creation
 *   - Completion matching checks both title AND rawTitle
 *   - Duplicate detection checks both title AND rawTitle
 * @version 2.0.1 - Removed unused addHint import
 */

import { createCase, createHint, inferTheme, CASE_PRIORITY } from '../data/cases.js';
import { getChatState, saveChatState } from '../core/persistence.js';

// Genre-aware case theming — rewrites titles for active setting profile
let _applyTemplateRewrite = null;
async function getRewriter() {
    if (!_applyTemplateRewrite) {
        try {
            const mod = await import('../voice/case-genre-rewriter.js');
            _applyTemplateRewrite = mod.applyTemplateRewrite;
        } catch (e) {
            console.warn('[CaseIntel] case-genre-rewriter not available, cases will use raw titles');
            _applyTemplateRewrite = (c) => c; // passthrough fallback
        }
    }
    return _applyTemplateRewrite;
}

// Description generation — skill voices write case briefings
let _generateCaseDescription = null;
let _descGenLoaded = false;
async function getDescriptionGenerator() {
    if (_descGenLoaded) return _generateCaseDescription;
    try {
        const mod = await import('./case-description-generator.js');
        _generateCaseDescription = mod.generateCaseDescription;
        console.log('[CaseIntel] Description generator loaded');
    } catch (e) {
        console.warn('[CaseIntel] Description generator not available, cases will use detection context');
        _generateCaseDescription = null;
    }
    _descGenLoaded = true;
    return _generateCaseDescription;
}

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
// DISCOVERY-TO-CASE MATCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Keywords that boost match confidence for specific discovery types
 */
const TYPE_KEYWORDS = {
    evidence: ['evidence', 'proof', 'clue', 'murder', 'crime', 'investigation', 'witness', 'suspect', 'victim', 'scene'],
    weapon: ['weapon', 'kill', 'murder', 'attack', 'fight', 'combat', 'threat', 'danger', 'armed'],
    document: ['document', 'letter', 'note', 'message', 'read', 'written', 'paper', 'record', 'file', 'report'],
    key_item: ['key', 'important', 'crucial', 'vital', 'essential', 'quest', 'mission', 'objective'],
    clothing: ['wear', 'clothes', 'outfit', 'disguise', 'identity', 'appearance'],
    consumable: ['use', 'consume', 'drink', 'eat', 'take', 'medicine', 'potion', 'drug'],
    container: ['inside', 'contains', 'hidden', 'secret', 'storage', 'stash'],
    misc: []
};

/**
 * Match confidence thresholds
 */
export const MATCH_CONFIDENCE = {
    HIGH: 0.7,      // Auto-add to case
    MEDIUM: 0.4,    // Suggest to user
    LOW: 0.2        // Show in dropdown only
};

/**
 * Extract meaningful keywords from text, removing common words
 */
function extractKeywords(text) {
    if (!text) return [];
    
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
        'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
        'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this',
        'that', 'these', 'those', 'it', 'its', 'you', 'your', 'he', 'she',
        'they', 'them', 'his', 'her', 'their', 'what', 'which', 'who'
    ]);
    
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate similarity between two strings (0-1)
 * Considers word overlap, substring matching, and keyword extraction
 */
function similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Direct containment check
    if (aLower.includes(bLower)) return 0.9;
    if (bLower.includes(aLower)) return 0.85;
    
    // Keyword overlap
    const aWords = new Set(extractKeywords(a));
    const bWords = new Set(extractKeywords(b));
    
    if (aWords.size === 0 || bWords.size === 0) return 0;
    
    const intersection = [...aWords].filter(w => bWords.has(w));
    const union = new Set([...aWords, ...bWords]);
    
    // Jaccard similarity
    const jaccard = intersection.length / union.size;
    
    // Bonus for matching important words (longer words tend to be more meaningful)
    const importantMatches = intersection.filter(w => w.length > 5).length;
    const importanceBonus = Math.min(importantMatches * 0.1, 0.3);
    
    return Math.min(jaccard + importanceBonus, 1);
}

/**
 * Match a discovery to active cases
 * Returns array of potential matches sorted by confidence
 * 
 * @param {object} discovery - Discovery object from investigation
 * @param {object} cases - Cases object { id: caseObj }
 * @returns {Array} Array of { caseId, caseTitle, confidence, reason }
 */
export function matchDiscoveryToCase(discovery, cases) {
    if (!discovery || !cases) return [];
    
    const matches = [];
    const discoveryText = `${discovery.name} ${discovery.peek || ''} ${discovery.type || ''}`.toLowerCase();
    const discoveryKeywords = extractKeywords(discoveryText);
    const typeKeywords = TYPE_KEYWORDS[discovery.type] || [];
    
    for (const [caseId, caseObj] of Object.entries(cases)) {
        // Only match against active cases
        if (caseObj.status !== 'active') continue;
        
        const caseText = `${caseObj.title} ${caseObj.description || ''}`.toLowerCase();
        const caseKeywords = extractKeywords(caseText);
        
        // Skip if either has no meaningful keywords
        if (discoveryKeywords.length === 0 || caseKeywords.length === 0) continue;
        
        // Base similarity from text comparison
        let confidence = 0;
        let reasons = [];
        
        // 1. Title similarity
        const titleSim = similarity(discovery.name, caseObj.title);
        if (titleSim > 0.3) {
            confidence += titleSim * 0.5;
            reasons.push(`Name matches title (${Math.round(titleSim * 100)}%)`);
        }
        
        // 2. Keyword overlap
        const keywordMatches = discoveryKeywords.filter(kw => caseKeywords.includes(kw));
        if (keywordMatches.length > 0) {
            const keywordScore = keywordMatches.length / Math.max(discoveryKeywords.length, caseKeywords.length);
            confidence += keywordScore * 0.3;
            reasons.push(`Keywords: ${keywordMatches.slice(0, 3).join(', ')}`);
        }
        
        // 3. Type-specific keyword boost
        const typeMatches = typeKeywords.filter(kw => caseText.includes(kw));
        if (typeMatches.length > 0) {
            confidence += typeMatches.length * 0.05;
            reasons.push(`Type relevance: ${discovery.type}`);
        }
        
        // 4. Check against case hints
        if (caseObj.hints && caseObj.hints.length > 0) {
            for (const hint of caseObj.hints) {
                const hintSim = similarity(discoveryText, hint.text);
                if (hintSim > 0.4) {
                    confidence += hintSim * 0.2;
                    reasons.push(`Relates to hint`);
                    break;
                }
            }
        }
        
        // 5. Location/context matching (if discovery has location)
        if (discovery.location && caseObj.relatedLocations) {
            for (const loc of caseObj.relatedLocations) {
                if (discovery.location.toLowerCase().includes(loc.toLowerCase())) {
                    confidence += 0.15;
                    reasons.push(`Location match`);
                    break;
                }
            }
        }
        
        // Cap confidence at 1.0
        confidence = Math.min(confidence, 1);
        
        // Only include if above minimum threshold
        if (confidence >= MATCH_CONFIDENCE.LOW) {
            matches.push({
                caseId,
                caseTitle: caseObj.title,
                confidence,
                reason: reasons.join('; ') || 'Potential relevance',
                priority: caseObj.priority
            });
        }
    }
    
    // Sort by confidence (highest first), then by priority
    matches.sort((a, b) => {
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
            return b.confidence - a.confidence;
        }
        // If confidence is close, prefer main > side > optional
        const priorityOrder = { main: 0, side: 1, optional: 2 };
        return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
    
    return matches;
}

/**
 * Link a discovery to a case by adding it as a hint
 * 
 * @param {object} discovery - Discovery object
 * @param {string} caseId - Case ID to link to
 * @param {object} options - Additional options
 * @returns {boolean} Success
 */
export function linkDiscoveryToCase(discovery, caseId, options = {}) {
    const state = getChatState();
    if (!state?.cases?.[caseId]) {
        console.warn('[CaseIntel] Cannot link: case not found', caseId);
        return false;
    }
    
    const caseObj = state.cases[caseId];
    
    // Check if already linked (avoid duplicates)
    const existingHint = caseObj.hints?.find(h => 
        h.discoveryId === discovery.id || 
        h.text.includes(discovery.name)
    );
    
    if (existingHint) {
        console.log('[CaseIntel] Discovery already linked to case');
        return false;
    }
    
    // Create hint from discovery
    const hintText = options.customText || 
        `Found: ${discovery.name}${discovery.location ? ` (${discovery.location})` : ''}`;
    
    const hint = {
        ...createHint(hintText),
        discoveryId: discovery.id,
        discoveryType: discovery.type,
        linkedAt: Date.now(),
        autoLinked: options.autoLinked || false
    };
    
    // Add hint to case
    if (!caseObj.hints) caseObj.hints = [];
    caseObj.hints.push(hint);
    
    // Track in discovery's metadata (if we have access to investigation state)
    if (state.investigation?.discoveredObjects) {
        const disc = state.investigation.discoveredObjects.find(d => d.name === discovery.name);
        if (disc) {
            if (!disc.linkedCases) disc.linkedCases = [];
            disc.linkedCases.push(caseId);
        }
    }
    
    saveChatState();
    
    console.log('[CaseIntel] Linked discovery to case:', {
        discovery: discovery.name,
        case: caseObj.title,
        auto: options.autoLinked
    });
    
    return true;
}

/**
 * Get all active cases for UI dropdown
 * @returns {Array} Array of { id, title, priority }
 */
export function getActiveCasesForLinking() {
    const state = getChatState();
    if (!state?.cases) return [];
    
    const activeCases = [];
    
    for (const [id, caseObj] of Object.entries(state.cases)) {
        if (caseObj.status === 'active') {
            activeCases.push({
                id,
                title: caseObj.title,
                priority: caseObj.priority,
                hintCount: caseObj.hints?.length || 0
            });
        }
    }
    
    // Sort: main first, then by hint count (less hints = more relevant to link?)
    activeCases.sort((a, b) => {
        const priorityOrder = { main: 0, side: 1, optional: 2 };
        const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        return a.hintCount - b.hintCount;
    });
    
    return activeCases;
}

/**
 * Auto-process a discovery for case linking
 * Called when a new discovery is made
 * 
 * @param {object} discovery - The discovery
 * @param {object} options - { autoLink: boolean, notifyCallback: function }
 * @returns {object} { matched: boolean, autoLinked: boolean, suggestions: Array }
 */
export function processDiscoveryForCases(discovery, options = {}) {
    const { autoLink = true, notifyCallback = null } = options;
    
    const state = getChatState();
    if (!state?.cases) {
        return { matched: false, autoLinked: false, suggestions: [] };
    }
    
    const matches = matchDiscoveryToCase(discovery, state.cases);
    
    const result = {
        matched: matches.length > 0,
        autoLinked: false,
        suggestions: matches
    };
    
    // High confidence: auto-link if enabled
    if (autoLink && matches.length > 0 && matches[0].confidence >= MATCH_CONFIDENCE.HIGH) {
        const bestMatch = matches[0];
        const linked = linkDiscoveryToCase(discovery, bestMatch.caseId, { autoLinked: true });
        
        if (linked) {
            result.autoLinked = true;
            
            if (notifyCallback) {
                notifyCallback({
                    type: 'auto-linked',
                    discovery: discovery.name,
                    case: bestMatch.caseTitle,
                    confidence: bestMatch.confidence
                });
            }
        }
    }
    
    return result;
}

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
        
        // Lazy-load genre rewriter
        const rewrite = await getRewriter();
        
        for (const quest of quests) {
            // Check for duplicates (recent or existing)
            const titleLower = quest.title.toLowerCase();
            
            // Skip if recently detected
            const lastSeen = recentlyDetected.get(titleLower);
            if (lastSeen && Date.now() - lastSeen < DUPLICATE_WINDOW) {
                continue;
            }
            
            // Skip if similar case already exists — check BOTH title and rawTitle
            const isDuplicate = Object.values(state.cases).some(c => {
                const titleMatch = similarity(c.title?.toLowerCase() || '', titleLower) > 0.7;
                const rawMatch = c.rawTitle ? similarity(c.rawTitle.toLowerCase(), titleLower) > 0.7 : false;
                return titleMatch || rawMatch;
            });
            if (isDuplicate) continue;
            
            // Create the case (inferTheme auto-tags from content)
            const rawCase = createCase({
                title: quest.title,
                priority: quest.priority,
                description: `Detected from: "${quest.source.substring(0, 80)}..."`,
                manuallyAdded: false,
                aiGenerated: true
            });
            
            // Genre-rewrite: themes the title for the active setting profile
            // e.g. "Find the missing key" → "THE MISSING KEY — a door that shouldn't be locked"
            const themedCase = rewrite(rawCase);
            
            state.cases[themedCase.id] = themedCase;
            results.created.push(themedCase);
            recentlyDetected.set(titleLower, Date.now());
            
            console.log(`[CaseIntel] Created case: "${themedCase.title}" (theme: ${themedCase.theme || 'none'}, raw: "${themedCase.rawTitle || quest.title}")`);
            
            // Notify if callback provided
            if (notifyCallback) {
                notifyCallback(`New task detected: ${themedCase.title}`);
            }
        }
        
        if (results.created.length > 0) {
            saveChatState();
            
            // Fire off description generation for new cases (async, non-blocking)
            // Each case gets its description written by the theme-matched skill voice
            const genDesc = await getDescriptionGenerator();
            if (genDesc) {
                for (const themedCase of results.created) {
                    // Don't await — let it happen in background
                    genDesc(themedCase, { forceRegenerate: true }).then(desc => {
                        if (desc && state.cases[themedCase.id]) {
                            state.cases[themedCase.id].description = desc;
                            saveChatState();
                            console.log(`[CaseIntel] Description generated for "${themedCase.title}"`);
                        }
                    }).catch(e => {
                        console.warn(`[CaseIntel] Description generation failed for "${themedCase.title}":`, e.message);
                    });
                }
            }
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
            const rawTitleLower = caseObj.rawTitle?.toLowerCase() || '';
            
            // Check if the subject matches EITHER the themed title or the raw title
            const matchesTitle = titleLower.includes(subjectLower) || subjectLower.includes(titleLower);
            const matchesRaw = rawTitleLower && (rawTitleLower.includes(subjectLower) || subjectLower.includes(rawTitleLower));
            
            if (matchesTitle || matchesRaw) {
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

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    // Quest detection
    detectQuests,
    detectCompletions,
    processMessageForQuests,
    matchCompletionsToCase,
    
    // Discovery-to-case matching (NEW)
    matchDiscoveryToCase,
    linkDiscoveryToCase,
    getActiveCasesForLinking,
    processDiscoveryForCases,
    MATCH_CONFIDENCE
};
