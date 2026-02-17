/**
 * The Tribunal - Status Detection
 * 
 * THE MISSING BRIDGE: Scans AI messages for status keywords defined in
 * statuses.js and auto-applies/removes status effects.
 * 
 * Previously, the keywords array on every status was completely orphaned —
 * defined but never read. Statuses only activated via manual checkbox clicks
 * or inventory item consumption. If the AI wrote "you collapse from exhaustion,"
 * waste_land never turned on.
 * 
 * Call processMessageStatuses() on MESSAGE_RECEIVED alongside processMessageVitals().
 * 
 * @version 1.0.0
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Status categories that CAN be auto-detected from narrative text.
 * Copotypes are excluded — those are player identity choices, not conditions.
 */
const DETECTABLE_CATEGORIES = ['physical', 'mental'];

/**
 * Minimum keyword matches required to activate a status.
 * Prevents single-word false positives ("pain" alone shouldn't = wounded).
 * 
 * Some statuses need "you" context to avoid matching NPC descriptions.
 * e.g., "the guard looked exhausted" shouldn't make the PLAYER exhausted.
 */
const ACTIVATION_THRESHOLD = 2;

/**
 * Keywords that require "you/your/yourself" context within ~30 chars.
 * Without this, NPC descriptions trigger player statuses.
 */
const REQUIRES_YOU_CONTEXT = new Set([
    'finger_on_the_eject_button',   // "wounded" is super common for NPCs
    'waste_land',                   // "tired" / "exhausted" said about others
    'caustic_echo',                 // "scared" / "afraid" can be NPCs
    'law_jaw',                      // "angry" / "furious" can be NPCs
    'the_expression',               // "sad" / "crying" can be NPCs
    'homo_sexual_underground',      // "desire" / "attraction" can be about NPCs
    'tequila_sunset',               // "manic" / "hyper" can be NPCs
]);

/**
 * Statuses that should NOT auto-clear when keywords disappear.
 * These represent persistent conditions that need explicit resolution.
 */
const STICKY_STATUSES = new Set([
    'finger_on_the_eject_button',   // Wounds don't vanish between messages
    'white_mourning',               // Dying doesn't stop on its own
    'the_pale',                     // Unconsciousness persists
    'volumetric_shit_compressor',   // Hangovers last
]);

/**
 * Extended keywords beyond what's in statuses.js.
 * Fills gaps the user identified + common narrative phrasings.
 */
const EXTENDED_KEYWORDS = {
    waste_land: [
        'out of breath', 'winded', 'gasping', 'panting', 'barely standing',
        'can barely keep', 'eyes heavy', 'legs give', 'about to collapse',
        'dead on your feet', 'running on fumes', 'sleep-deprived', 'no sleep',
        'haven\'t slept', 'need to rest', 'body aches', 'bone-tired',
        'struggling to stay awake', 'eyelids droop', 'yawn'
    ],
    finger_on_the_eject_button: [
        'blood soaks', 'blood pools', 'losing blood', 'gunshot', 'stab wound',
        'gash', 'laceration', 'fractured', 'dislocated', 'concussion',
        'barely conscious', 'vision blurs', 'can\'t feel your',
        'limping', 'clutching your', 'doubled over', 'ribs crack',
        'teeth knocked', 'nose broken', 'jaw shattered'
    ],
    the_pale: [
        'losing consciousness', 'everything goes dark', 'world fades',
        'slipping away', 'blacks out', 'blacked out', 'passed out',
        'falls unconscious', 'knocked out', 'knocked unconscious',
        'fainted', 'fainting', 'collapses', 'goes limp',
        'eyes roll back', 'crumples', 'falls to the ground',
        'asleep', 'dozing', 'drifting off', 'deep sleep', 'coma',
        'out cold', 'lights out', 'world goes dark', 'vision darkens',
        'can\'t stay awake', 'consciousness fading', 'everything goes black'
    ],
    white_mourning: [
        'life flashes', 'this is it', 'final breath', 'heart stopping',
        'flatline', 'slipping away', 'the end', 'going dark',
        'can\'t hold on', 'everything fading', 'last thing you see',
        'body shutting down', 'organs failing'
    ],
    caustic_echo: [
        'heart pounds', 'heart racing', 'can\'t breathe', 'frozen in place',
        'fight or flight', 'blood runs cold', 'spine tingles',
        'hair stands', 'primal fear', 'gut-wrenching', 'stomach drops',
        'shaking with fear', 'trembling', 'cold sweat', 'adrenaline'
    ],
    law_jaw: [
        'seeing red', 'blood boils', 'fists clench', 'jaw tightens',
        'barely contain', 'snap', 'lose control', 'violence simmers',
        'want to hit', 'want to punch', 'teeth grind', 'white-knuckled'
    ],
    the_expression: [
        'tears fall', 'eyes sting', 'chest tight', 'lump in throat',
        'can\'t hold it', 'breaking down', 'heart aches', 'hollow',
        'empty inside', 'weight of loss', 'they\'re gone', 'never coming back'
    ],
    revacholian_courage: [
        'world spins', 'slurred', 'stumble', 'hiccup', 'room tilts',
        'double vision', 'liquid courage', 'another drink', 'one more drink',
        'warm buzz', 'pleasantly numb'
    ],
    tequila_sunset: [
        'can\'t sit still', 'talking fast', 'everything is possible',
        'invincible', 'unstoppable', 'electric', 'vibrating with energy',
        'million ideas', 'best idea ever', 'never felt better',
        'on top of the world', 'king of the world'
    ],
    homo_sexual_underground: [
        'heart skips', 'can\'t stop looking', 'pulse quickens',
        'drawn to', 'magnetized', 'captivated', 'mesmerized',
        'butterflies', 'cheeks flush', 'breath catches'
    ]
};

/**
 * Clearance keywords — when these appear, they can REMOVE a sticky status.
 * Maps status ID → array of clearance keyword patterns.
 */
const CLEARANCE_KEYWORDS = {
    finger_on_the_eject_button: [
        'wounds? heal', 'patched up', 'bandaged', 'stitched',
        'no longer bleeding', 'pain subsides', 'feeling better',
        'wounds? clos', 'fully recovered', 'good as new'
    ],
    waste_land: [
        'well-?rested', 'refreshed', 'energy returns', 'wide awake',
        'slept well', 'good night', 'feel rested', 'alert',
        'second wind', 'vigor returns'
    ],
    the_pale: [
        'reality returns', 'snap out of', 'come back to',
        'regain consciousness', 'wake up', 'eyes open',
        'world solidifies', 'grounded again', 'you\'re back'
    ],
    volumetric_shit_compressor: [
        'hangover fades', 'headache clears', 'stomach settles',
        'feeling human again', 'water helps', 'sobering up'
    ]
};

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION (same pattern as vitals-extraction)
// ═══════════════════════════════════════════════════════════════

const processedStatusMessages = new Set();

function statusFingerprint(text) {
    return `status:${text.length}:${text.substring(0, 100)}`;
}

export function resetStatusDetection() {
    processedStatusMessages.clear();
    console.log('[Status Detection] Tracking reset for new chat');
}

// ═══════════════════════════════════════════════════════════════
// "YOU" CONTEXT CHECKER
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a keyword match has "you/your/yourself" within proximity.
 * This prevents "the guard looked exhausted" from making the PLAYER exhausted.
 * 
 * @param {string} text - Full message text (lowercased)
 * @param {number} matchIndex - Where the keyword was found
 * @param {number} proximity - How many chars to look back/forward
 * @returns {boolean} Whether "you" context is nearby
 */
function hasYouContext(text, matchIndex, proximity = 60) {
    const start = Math.max(0, matchIndex - proximity);
    const end = Math.min(text.length, matchIndex + proximity);
    const window = text.substring(start, end);
    
    return /\b(you|your|yourself|you're|you've|you'd)\b/i.test(window);
}

// ═══════════════════════════════════════════════════════════════
// MAIN DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Scan a message for status-indicating keywords and return detected statuses.
 * 
 * @param {string} messageText - The AI message to analyze
 * @returns {{ activate: string[], deactivate: string[], events: string[] }}
 */
export function detectStatusesFromMessage(messageText) {
    if (!messageText || messageText.length < 30) {
        return { activate: [], deactivate: [], events: [] };
    }
    
    const lowerText = messageText.toLowerCase();
    const events = [];
    const scores = {}; // statusId → { matches: number, hasYouContext: boolean }
    
    // ── Score each detectable status ──
    for (const [statusId, statusData] of Object.entries(STATUS_EFFECTS)) {
        // Skip copotypes and non-detectable categories
        if (!DETECTABLE_CATEGORIES.includes(statusData.category)) continue;
        
        const allKeywords = [
            ...(statusData.keywords || []),
            ...(EXTENDED_KEYWORDS[statusId] || [])
        ];
        
        if (allKeywords.length === 0) continue;
        
        let matchCount = 0;
        let anyYouContext = false;
        
        for (const keyword of allKeywords) {
            const lowerKeyword = keyword.toLowerCase();
            let searchFrom = 0;
            
            while (true) {
                const idx = lowerText.indexOf(lowerKeyword, searchFrom);
                if (idx === -1) break;
                
                // Check word boundaries for single words (not phrases)
                if (!lowerKeyword.includes(' ')) {
                    const before = idx > 0 ? lowerText[idx - 1] : ' ';
                    const after = idx + lowerKeyword.length < lowerText.length 
                        ? lowerText[idx + lowerKeyword.length] : ' ';
                    
                    if (/\w/.test(before) || /\w/.test(after)) {
                        searchFrom = idx + 1;
                        continue; // Partial word match, skip
                    }
                }
                
                matchCount++;
                
                if (hasYouContext(lowerText, idx)) {
                    anyYouContext = true;
                }
                
                searchFrom = idx + lowerKeyword.length;
            }
        }
        
        if (matchCount > 0) {
            scores[statusId] = { matches: matchCount, hasYouContext: anyYouContext };
        }
    }
    
    // ── Determine activations ──
    const activate = [];
    
    for (const [statusId, score] of Object.entries(scores)) {
        const needsYou = REQUIRES_YOU_CONTEXT.has(statusId);
        
        // Must meet threshold
        if (score.matches < ACTIVATION_THRESHOLD) continue;
        
        // If this status needs "you" context, check for it
        if (needsYou && !score.hasYouContext) {
            // Allow override at very high match counts (4+) — if 4 keywords
            // match, it's probably about the player even without explicit "you"
            if (score.matches < 4) continue;
        }
        
        activate.push(statusId);
        const name = STATUS_EFFECTS[statusId].simpleName || STATUS_EFFECTS[statusId].name;
        events.push(`[Status detected: ${name} (${score.matches} keywords)]`);
    }
    
    // ── Check for clearance of sticky statuses ──
    const deactivate = [];
    
    for (const [statusId, clearKeywords] of Object.entries(CLEARANCE_KEYWORDS)) {
        let cleared = false;
        
        for (const keyword of clearKeywords) {
            // Clearance keywords can be regex-like patterns
            try {
                const pattern = new RegExp(keyword, 'i');
                if (pattern.test(lowerText)) {
                    cleared = true;
                    break;
                }
            } catch {
                // Plain string fallback
                if (lowerText.includes(keyword.toLowerCase())) {
                    cleared = true;
                    break;
                }
            }
        }
        
        if (cleared) {
            deactivate.push(statusId);
            const name = STATUS_EFFECTS[statusId]?.simpleName || statusId;
            events.push(`[Status cleared: ${name}]`);
        }
    }
    
    return { activate, deactivate, events };
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION WITH STATE
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message and auto-apply/remove statuses.
 * Call on MESSAGE_RECEIVED alongside processMessageVitals().
 * 
 * @param {string} messageText - The AI message
 * @returns {{ applied: string[], removed: string[], events: string[] }}
 */
export function processMessageStatuses(messageText) {
    // Dedup: skip if already processed
    const fingerprint = statusFingerprint(messageText || '');
    if (processedStatusMessages.has(fingerprint)) {
        return { applied: [], removed: [], events: [] };
    }
    processedStatusMessages.add(fingerprint);
    
    const { activate, deactivate, events } = detectStatusesFromMessage(messageText);
    
    const applied = [];
    const removed = [];
    
    const { getChatState, saveChatState } = window.TribunalState || {};
    if (!getChatState) {
        console.warn('[Status Detection] TribunalState not available');
        return { applied: [], removed: [], events };
    }
    
    const state = getChatState();
    if (!state.vitals) state.vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13, activeEffects: [] };
    if (!state.vitals.activeEffects) state.vitals.activeEffects = [];
    
    const activeEffects = state.vitals.activeEffects;
    const activeIds = activeEffects.map(e => typeof e === 'string' ? e : e.id);
    let changed = false;
    
    // ── Apply new statuses ──
    for (const statusId of activate) {
        if (activeIds.includes(statusId)) continue; // Already active
        
        const statusData = STATUS_EFFECTS[statusId];
        activeEffects.push({
            id: statusId,
            name: statusData.simpleName || statusData.name,
            source: 'detected',        // Mark as auto-detected (vs 'manual' or 'consumption')
            remainingMessages: null,    // Detected statuses don't expire on timer
            stacks: 1
        });
        
        applied.push(statusId);
        changed = true;
        
        console.log(`[Status Detection] Applied: ${statusData.simpleName || statusId}`);
        
        if (typeof toastr !== 'undefined') {
            toastr.info(
                statusData.description?.substring(0, 80) || '',
                statusData.simpleName || statusData.name,
                { timeOut: 3000 }
            );
        }
    }
    
    // ── Remove cleared statuses ──
    for (const statusId of deactivate) {
        const idx = activeEffects.findIndex(e => 
            (typeof e === 'string' ? e : e.id) === statusId
        );
        
        if (idx >= 0) {
            activeEffects.splice(idx, 1);
            removed.push(statusId);
            changed = true;
            
            const name = STATUS_EFFECTS[statusId]?.simpleName || statusId;
            console.log(`[Status Detection] Cleared: ${name}`);
            
            if (typeof toastr !== 'undefined') {
                toastr.success(`${name} has cleared`, 'Status Resolved', { timeOut: 2000 });
            }
        }
    }
    
    // ── Auto-clear non-sticky detected statuses if keywords absent ──
    // Only clear statuses that were AUTO-DETECTED (source: 'detected')
    // and are not in the sticky set and weren't just activated
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        const effectId = typeof effect === 'string' ? effect : effect.id;
        const source = typeof effect === 'string' ? 'unknown' : effect.source;
        
        // Only auto-clear statuses we auto-detected
        if (source !== 'detected') continue;
        // Don't clear sticky ones
        if (STICKY_STATUSES.has(effectId)) continue;
        // Don't clear if just activated this message
        if (applied.includes(effectId)) continue;
        // Don't clear if keywords still present (even below threshold)
        const statusData = STATUS_EFFECTS[effectId];
        if (!statusData) continue;
        
        const allKeywords = [
            ...(statusData.keywords || []),
            ...(EXTENDED_KEYWORDS[effectId] || [])
        ];
        
        const lowerText = (messageText || '').toLowerCase();
        const stillPresent = allKeywords.some(kw => lowerText.includes(kw.toLowerCase()));
        
        if (!stillPresent) {
            activeEffects.splice(i, 1);
            removed.push(effectId);
            changed = true;
            console.log(`[Status Detection] Auto-cleared: ${statusData.simpleName || effectId} (no keywords)`);
        }
    }
    
    if (changed) {
        if (saveChatState) saveChatState();
        
        // Notify UI to refresh
        window.dispatchEvent(new CustomEvent('tribunal:statusRefreshNeeded'));
        
        // Notify condition-effects for visual updates
        window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
            detail: {
                health: state.vitals.health,
                maxHealth: state.vitals.maxHealth,
                morale: state.vitals.morale,
                maxMorale: state.vitals.maxMorale,
                statusChange: true
            }
        }));
    }
    
    return { applied, removed, events };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    detectStatusesFromMessage,
    processMessageStatuses,
    resetStatusDetection
};
