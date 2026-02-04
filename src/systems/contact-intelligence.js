/**
 * The Tribunal - Contact Intelligence System
 * NPC Detection, Trait Extraction, Voice Opinion Tracking
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  DEFENSIVE BUILD - Every function guards itself, fully async             ║
 * ║  This module can NEVER break voice generation - it's a bonus feature     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * Deploy AFTER voice-affinities.js is confirmed working
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - Defensive loading with full error isolation
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _affinities = null;
let _initPromise = null;
let _initialized = false;

/**
 * Initialize all dependencies ONCE
 * Safe to call multiple times - will only run once
 */
async function ensureInitialized() {
    // Already done
    if (_initialized) return true;
    
    // In progress - wait for it
    if (_initPromise) return _initPromise;
    
    // Start initialization
    _initPromise = (async () => {
        try {
            // Load persistence
            try {
                _persistence = await import('../core/persistence.js');
                console.log('[Contact Intelligence] Persistence loaded');
            } catch (e) {
                console.warn('[Contact Intelligence] Persistence unavailable:', e.message);
                _persistence = null;
            }
            
            // Load affinities
            try {
                _affinities = await import('../data/voice-affinities.js');
                console.log('[Contact Intelligence] Voice affinities loaded');
            } catch (e) {
                console.warn('[Contact Intelligence] Voice affinities unavailable:', e.message);
                _affinities = null;
            }
            
            _initialized = true;
            return true;
        } catch (e) {
            console.error('[Contact Intelligence] Init failed:', e.message);
            _initialized = true; // Mark done so we don't retry forever
            return false;
        }
    })();
    
    return _initPromise;
}

// ═══════════════════════════════════════════════════════════════
// SAFE STATE ACCESS - Every function checks its own dependencies
// ═══════════════════════════════════════════════════════════════

/**
 * Safely get chat state - returns null if unavailable
 */
function getChatState() {
    try {
        return _persistence?.getChatState?.() || null;
    } catch (e) {
        console.warn('[Contact Intelligence] getChatState error:', e.message);
        return null;
    }
}

/**
 * Safely save chat state - silent no-op if unavailable
 */
function saveChatState() {
    try {
        _persistence?.saveChatState?.();
    } catch (e) {
        console.warn('[Contact Intelligence] saveChatState error:', e.message);
    }
}

/**
 * Get contacts from state - returns empty object if unavailable
 */
function getContacts() {
    const state = getChatState();
    if (!state) return {};
    if (!state.relationships) state.relationships = {};
    return state.relationships;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    // Sentiment thresholds for auto-disposition suggestions
    DISPOSITION_THRESHOLDS: {
        trusted: 15,      // +15 to +20
        neutral: 5,       // +5 to +14
        cautious: -4,     // -4 to +4
        suspicious: -14,  // -14 to -5
        hostile: -20      // -20 to -15
    },
    
    // How many mentions before suggesting "Add contact?"
    MENTION_THRESHOLD: 3,
    
    // How many top voices to show opinions from
    TOP_VOICES_COUNT: 3,
    
    // Score range for voice opinions
    OPINION_SCORE_RANGE: { min: -10, max: 10 }
};

// ═══════════════════════════════════════════════════════════════
// CHARACTER NAME EXCLUSION
// Gets player + AI character names to prevent adding them as contacts
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current player character name and AI character name
 * Used to exclude them from NPC detection
 * @returns {string[]} Array of names to exclude
 */
function getCharacterNames() {
    const names = [];
    try {
        // SillyTavern global context
        const ctx = window.SillyTavern?.getContext?.() || 
                     (typeof getContext === 'function' ? getContext() : null);
        if (ctx) {
            if (ctx.name1) names.push(ctx.name1); // Player character
            if (ctx.name2) names.push(ctx.name2); // AI character
        }
    } catch (e) {
        // Silent fail - names will just be empty
    }
    return names;
}

// ═══════════════════════════════════════════════════════════════
// DISPOSITION MAPPING (Local copy to avoid import dependency)
// ═══════════════════════════════════════════════════════════════

const DISPOSITION_TO_TYPE = {
    trusted: 'informant',
    neutral: 'unknown', 
    cautious: 'witness',
    suspicious: 'accomplice',
    hostile: 'suspect'
};

function getTypeFromDisposition(disposition) {
    return DISPOSITION_TO_TYPE[disposition] || 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// NPC DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Common words to exclude from NPC detection
 */
const COMMON_WORDS = new Set([
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'and', 'but', 'or', 'so', 'if', 'then', 'because', 'although',
    'what', 'who', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any', 'no',
    'not', 'only', 'just', 'also', 'very', 'too', 'really', 'quite',
    // Common RP/story words that aren't names
    'door', 'room', 'floor', 'wall', 'window', 'table', 'chair',
    'hand', 'hands', 'eyes', 'face', 'head', 'voice', 'words',
    'moment', 'time', 'day', 'night', 'morning', 'evening',
    'something', 'nothing', 'everything', 'anything',
    'way', 'thing', 'place', 'world', 'life', 'death'
]);

/**
 * Dialogue patterns that indicate NPC names (high confidence)
 */
const DIALOGUE_PATTERNS = [
    /[""]([^""]+)[""]\s*(?:said|asked|replied|muttered|whispered|shouted|exclaimed|answered)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|muttered|whispered|shouted|exclaimed|answered)\s*[,:]?\s*[""]([^""]+)[""]/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says|asks|replies|mutters|whispers|shouts|exclaims|answers)/gi
];

/**
 * Action patterns that suggest names (medium confidence)
 */
const NAME_PATTERNS = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:looks|watches|stares|glances|turns|walks|moves|steps|reaches|grabs|takes)/gim,
    /(?:to|at|with|from|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:eyes|face|voice|hand|hands|expression|tone)/gi
];

/**
 * Detect potential NPC names from message text
 * @param {string} messageText - The chat message to scan
 * @param {string[]} excludeNames - Names to exclude (player character, AI character, etc.)
 * @returns {Map} Map of name -> { count, confidence, contexts }
 */
export function detectPotentialNPCs(messageText, excludeNames = []) {
    if (!messageText || typeof messageText !== 'string') {
        return new Map();
    }
    
    // Build exclusion set from provided names (case-insensitive, includes first names)
    const excluded = new Set();
    for (const name of excludeNames) {
        if (!name) continue;
        excluded.add(name.toLowerCase().trim());
        // Also exclude first name only (e.g. "Harry" from "Harry Du Bois")
        const firstName = name.trim().split(/\s+/)[0];
        if (firstName && firstName.length > 1) {
            excluded.add(firstName.toLowerCase());
        }
    }
    
    const detected = new Map();
    
    const addDetection = (name, confidence, context) => {
        const normalized = name?.trim();
        if (!normalized || normalized.length < 2) return;
        if (COMMON_WORDS.has(normalized.toLowerCase())) return;
        
        // FIX (Bug 4): Skip player character and AI character names
        if (excluded.has(normalized.toLowerCase())) return;
        // Also check first name of detected multi-word names
        const detectedFirst = normalized.split(/\s+/)[0];
        if (detectedFirst && excluded.has(detectedFirst.toLowerCase())) return;
        
        // Skip single short words
        const words = normalized.split(/\s+/);
        if (words.length === 1 && words[0].length < 3) return;
        
        if (!detected.has(normalized)) {
            detected.set(normalized, { count: 0, confidence: 0, contexts: [] });
        }
        
        const entry = detected.get(normalized);
        entry.count++;
        entry.confidence = Math.max(entry.confidence, confidence);
        if (context && entry.contexts.length < 3) {
            entry.contexts.push(context.substring(0, 100));
        }
    };
    
    // Check dialogue patterns (high confidence)
    for (const pattern of DIALOGUE_PATTERNS) {
        try {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(messageText)) !== null) {
                const potentialNames = match.slice(1).filter(m => m && /^[A-Z]/.test(m));
                for (const name of potentialNames) {
                    if (!name.startsWith('"') && !name.startsWith('"')) {
                        addDetection(name, 0.9, match[0]);
                    }
                }
            }
        } catch (e) {
            // Regex failed, skip this pattern
        }
    }
    
    // Check name patterns (medium confidence)
    for (const pattern of NAME_PATTERNS) {
        try {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(messageText)) !== null) {
                if (match[1]) {
                    addDetection(match[1], 0.6, match[0]);
                }
            }
        } catch (e) {
            // Regex failed, skip this pattern
        }
    }
    
    // Simple capitalized word detection (low confidence)
    try {
        const simpleCapitalized = messageText.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g) || [];
        for (const name of simpleCapitalized) {
            if (!COMMON_WORDS.has(name.toLowerCase())) {
                addDetection(name, 0.3, null);
            }
        }
    } catch (e) {
        // Regex failed
    }
    
    return detected;
}

// ═══════════════════════════════════════════════════════════════
// CONTACT MATCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Get known contacts by lowercase name
 * @returns {Map} lowercase name -> contact object
 */
export function getKnownContactsByName() {
    const contacts = getContacts();
    const byName = new Map();
    
    for (const contact of Object.values(contacts)) {
        if (contact?.name) {
            byName.set(contact.name.toLowerCase(), contact);
        }
    }
    return byName;
}

/**
 * Find a contact matching a detected name
 * @param {string} detectedName 
 * @returns {object|null}
 */
export function findMatchingContact(detectedName) {
    if (!detectedName) return null;
    
    const knownContacts = getKnownContactsByName();
    const lowerName = detectedName.toLowerCase();
    
    // Exact match
    if (knownContacts.has(lowerName)) {
        return knownContacts.get(lowerName);
    }
    
    // Partial match
    for (const [contactName, contact] of knownContacts) {
        if (contactName.startsWith(lowerName) || lowerName.startsWith(contactName)) {
            return contact;
        }
        // First name match
        const firstName = contactName.split(/\s+/)[0];
        if (firstName === lowerName) {
            return contact;
        }
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// TRAIT EXTRACTION
// ═══════════════════════════════════════════════════════════════

const TRAIT_KEYWORDS = {
    // Positive
    kind: ['kind', 'gentle', 'caring', 'compassionate', 'warm', 'tender'],
    competent: ['competent', 'skilled', 'capable', 'efficient', 'professional'],
    honest: ['honest', 'truthful', 'sincere', 'genuine', 'frank'],
    calm: ['calm', 'composed', 'collected', 'steady', 'controlled'],
    strong: ['strong', 'powerful', 'muscular', 'tough', 'brawny'],
    clever: ['clever', 'smart', 'intelligent', 'sharp', 'bright'],
    charming: ['charming', 'charismatic', 'suave', 'smooth', 'alluring'],
    mysterious: ['mysterious', 'enigmatic', 'cryptic', 'secretive', 'strange'],
    dangerous: ['dangerous', 'threatening', 'menacing', 'intimidating'],
    vulnerable: ['vulnerable', 'wounded', 'hurt', 'broken', 'fragile'],
    
    // Role-based
    cop: ['cop', 'police', 'officer', 'detective', 'rcm', 'lieutenant'],
    criminal: ['criminal', 'thug', 'crook', 'gangster', 'dealer'],
    
    // Negative
    cruel: ['cruel', 'sadistic', 'vicious', 'brutal', 'heartless'],
    deceptive: ['deceptive', 'lying', 'dishonest', 'manipulative'],
    hostile: ['hostile', 'aggressive', 'antagonistic', 'confrontational'],
    arrogant: ['arrogant', 'condescending', 'superior', 'smug']
};

/**
 * Extract traits about an NPC from message context
 * @param {string} npcName 
 * @param {string} messageText 
 * @returns {string[]} Array of trait IDs
 */
export function extractTraitsFromContext(npcName, messageText) {
    if (!npcName || !messageText) return [];
    
    const detectedTraits = new Set();
    const lowerText = messageText.toLowerCase();
    const lowerName = npcName.toLowerCase();
    
    // Find sentences containing the NPC
    const sentences = messageText.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
        s.toLowerCase().includes(lowerName)
    );
    
    const contextText = relevantSentences.length > 0 
        ? relevantSentences.join(' ').toLowerCase()
        : lowerText;
    
    // Scan for trait keywords
    for (const [traitId, keywords] of Object.entries(TRAIT_KEYWORDS)) {
        for (const keyword of keywords) {
            if (contextText.includes(keyword)) {
                detectedTraits.add(traitId);
                break;
            }
        }
    }
    
    return Array.from(detectedTraits);
}

// ═══════════════════════════════════════════════════════════════
// VOICE OPINION SEEDING
// ═══════════════════════════════════════════════════════════════

/**
 * Generate initial voice opinions for a contact based on traits
 * @param {string[]} detectedTraits 
 * @returns {object} { voiceId: { score, comment, lastUpdated } }
 */
export function generateInitialVoiceOpinions(detectedTraits = []) {
    const opinions = {};
    
    // Check if affinities loaded
    if (!_affinities?.getVoicesWithStrongestOpinions) {
        return opinions;
    }
    
    try {
        const strongestVoices = _affinities.getVoicesWithStrongestOpinions(
            detectedTraits, 
            CONFIG.TOP_VOICES_COUNT * 2
        );
        
        for (const { voiceId, score } of strongestVoices.slice(0, CONFIG.TOP_VOICES_COUNT)) {
            opinions[voiceId] = {
                score: score,
                comment: null,
                lastUpdated: Date.now(),
                traits: detectedTraits
            };
        }
    } catch (e) {
        console.warn('[Contact Intelligence] generateInitialVoiceOpinions error:', e.message);
    }
    
    return opinions;
}

/**
 * Seed a contact with initial voice opinions
 * @param {string} contactId 
 * @param {string} contextText 
 */
export async function seedContactOpinions(contactId, contextText) {
    await ensureInitialized();
    
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return;
    
    try {
        const traits = extractTraitsFromContext(contact.name, contextText);
        const opinions = generateInitialVoiceOpinions(traits);
        
        contact.voiceOpinions = opinions;
        contact.detectedTraits = traits;
        
        saveChatState();
        
        console.log(`[Contact Intelligence] Seeded ${contact.name} with traits:`, traits);
    } catch (e) {
        console.warn('[Contact Intelligence] seedContactOpinions error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════

const POSITIVE_INDICATORS = [
    /\b(trust|like|good|kind|honest|reliable|friend|ally|help|safe)\b/i,
    /\b(admire|respect|appreciate|understand|genuine|sincere)\b/i,
    /\b(on your side|got your back|can count on|believe in)\b/i
];

const NEGATIVE_INDICATORS = [
    /\b(danger|threat|suspicious|lying|hiding|can't trust|don't trust)\b/i,
    /\b(enemy|hostile|cruel|manipulat|decei|betray|scheming)\b/i,
    /\b(something off|something wrong|bad feeling|watch out|be careful)\b/i,
    /\b(hate|despise|loathe|disgust)\b/i
];

const NEUTRAL_INDICATORS = [
    /\b(unclear|unknown|uncertain|hard to read|can't tell)\b/i,
    /\b(maybe|perhaps|might be|could be|not sure)\b/i
];

/**
 * Analyze voice dialogue for sentiment about an NPC
 * @param {string} voiceContent 
 * @param {string} npcName 
 * @returns {{ mentioned: boolean, sentiment: number, reason: string }}
 */
export function analyzeVoiceSentiment(voiceContent, npcName) {
    if (!voiceContent || !npcName) {
        return { mentioned: false, sentiment: 0, reason: null };
    }
    
    const lowerContent = voiceContent.toLowerCase();
    const lowerName = npcName.toLowerCase();
    const firstName = lowerName.split(' ')[0];
    
    // Check if NPC mentioned
    const mentioned = lowerContent.includes(lowerName) || lowerContent.includes(firstName);
    
    if (!mentioned) {
        return { mentioned: false, sentiment: 0, reason: null };
    }
    
    let sentiment = 0;
    let reasons = [];
    
    for (const pattern of POSITIVE_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment += 1;
            reasons.push('positive');
        }
    }
    
    for (const pattern of NEGATIVE_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment -= 1;
            reasons.push('negative');
        }
    }
    
    for (const pattern of NEUTRAL_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment = Math.round(sentiment * 0.5);
            reasons.push('uncertain');
        }
    }
    
    // Clamp to -3 to +3
    sentiment = Math.max(-3, Math.min(3, sentiment));
    
    return {
        mentioned: true,
        sentiment,
        reason: reasons.length > 0 ? reasons.join(', ') : 'mentioned'
    };
}

// ═══════════════════════════════════════════════════════════════
// VOICE OPINION UPDATES
// ═══════════════════════════════════════════════════════════════

/**
 * Update a voice's opinion of a contact
 * @param {string} contactId 
 * @param {string} voiceId 
 * @param {number} sentimentDelta 
 * @param {string} newContent 
 */
export function updateVoiceOpinion(contactId, voiceId, sentimentDelta, newContent = null) {
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return;
    
    try {
        if (!contact.voiceOpinions) {
            contact.voiceOpinions = {};
        }
        
        if (!contact.voiceOpinions[voiceId]) {
            // Get seed score from affinities if available
            let seedScore = 0;
            if (_affinities?.calculateSeedScore) {
                seedScore = _affinities.calculateSeedScore(voiceId, contact.detectedTraits || []);
            }
            
            contact.voiceOpinions[voiceId] = {
                score: seedScore,
                comment: null,
                lastUpdated: Date.now(),
                observationCount: 0
            };
        }
        
        const opinion = contact.voiceOpinions[voiceId];
        
        // Diminishing returns on repeated observations
        const impactFactor = Math.max(0.3, 1 - (opinion.observationCount * 0.1));
        const adjustedDelta = Math.round(sentimentDelta * impactFactor);
        
        opinion.score = Math.max(
            CONFIG.OPINION_SCORE_RANGE.min,
            Math.min(CONFIG.OPINION_SCORE_RANGE.max, opinion.score + adjustedDelta)
        );
        opinion.lastUpdated = Date.now();
        opinion.observationCount = (opinion.observationCount || 0) + 1;
        
        if (newContent && newContent.length > 10 && newContent.length < 150) {
            opinion.lastObservation = newContent;
        }
        
        saveChatState();
        
        console.log(`[Contact Intelligence] ${voiceId} → ${contact.name}: ${opinion.score} (${sentimentDelta > 0 ? '+' : ''}${adjustedDelta})`);
    } catch (e) {
        console.warn('[Contact Intelligence] updateVoiceOpinion error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// DISPOSITION CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate voice consensus score
 * @param {object} voiceOpinions 
 * @returns {number}
 */
export function calculateVoiceConsensus(voiceOpinions) {
    if (!voiceOpinions || Object.keys(voiceOpinions).length === 0) {
        return 0;
    }
    
    const scores = Object.values(voiceOpinions).map(o => o.score || 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
}

/**
 * Derive disposition from sentiment score
 * @param {number} score 
 * @returns {string}
 */
export function deriveDispositionFromScore(score) {
    const t = CONFIG.DISPOSITION_THRESHOLDS;
    
    if (score >= t.trusted) return 'trusted';
    if (score >= t.neutral) return 'neutral';
    if (score >= t.cautious) return 'cautious';
    if (score >= t.suspicious) return 'suspicious';
    return 'hostile';
}

/**
 * Recalculate a contact's disposition from voice opinions
 * @param {string} contactId 
 * @param {boolean} autoUpdate 
 * @returns {object|null}
 */
export function recalculateSentiment(contactId, autoUpdate = false) {
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return null;
    
    const consensus = calculateVoiceConsensus(contact.voiceOpinions);
    const suggestedDisposition = deriveDispositionFromScore(consensus);
    const currentDisposition = contact.disposition || 'neutral';
    const shouldChange = suggestedDisposition !== currentDisposition;
    
    if (autoUpdate && shouldChange && !contact.manuallyEdited) {
        contact.disposition = suggestedDisposition;
        contact.sentimentScore = consensus;
        saveChatState();
        console.log(`[Contact Intelligence] Auto-updated ${contact.name}: ${currentDisposition} → ${suggestedDisposition}`);
    }
    
    return {
        contactId,
        contactName: contact.name,
        currentDisposition,
        suggestedDisposition,
        sentimentScore: consensus,
        shouldChange,
        manuallyEdited: contact.manuallyEdited || false
    };
}

// ═══════════════════════════════════════════════════════════════
// PENDING CONTACTS BUFFER
// ═══════════════════════════════════════════════════════════════

/**
 * Get pending contacts buffer
 * @returns {object}
 */
export function getPendingContacts() {
    const state = getChatState();
    return state?.pendingContacts || {};
}

/**
 * Track a potential NPC mention
 * @param {string} name 
 * @param {string} context 
 */
export function trackPendingContact(name, context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.pendingContacts) {
        state.pendingContacts = {};
    }
    
    const normalized = name?.trim();
    if (!normalized) return;
    
    const now = Date.now();
    
    if (!state.pendingContacts[normalized]) {
        state.pendingContacts[normalized] = {
            count: 0,
            firstSeen: now,
            lastSeen: now,
            contexts: []
        };
    }
    
    const pending = state.pendingContacts[normalized];
    pending.count++;
    pending.lastSeen = now;
    if (context && pending.contexts.length < 5) {
        pending.contexts.push(context.substring(0, 150));
    }
    
    saveChatState();
}

/**
 * Get contacts ready to suggest
 * @returns {Array}
 */
export function getContactSuggestions() {
    const pending = getPendingContacts();
    const suggestions = [];
    
    for (const [name, data] of Object.entries(pending)) {
        if (findMatchingContact(name)) continue;
        
        if (data.count >= CONFIG.MENTION_THRESHOLD) {
            suggestions.push({
                name,
                mentionCount: data.count,
                firstSeen: data.firstSeen,
                contexts: data.contexts
            });
        }
    }
    
    return suggestions;
}

/**
 * Clear a name from pending
 * @param {string} name 
 */
export function clearPendingContact(name) {
    const state = getChatState();
    if (state?.pendingContacts?.[name]) {
        delete state.pendingContacts[name];
        saveChatState();
    }
}

// ═══════════════════════════════════════════════════════════════
// DISPOSITION SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get pending disposition suggestions
 * @returns {object}
 */
export function getDispositionSuggestions() {
    const state = getChatState();
    return state?.dispositionSuggestions || {};
}

/**
 * Accept a disposition suggestion
 * @param {string} contactId 
 */
export function acceptDispositionSuggestion(contactId) {
    const state = getChatState();
    const suggestion = state?.dispositionSuggestions?.[contactId];
    const contact = state?.relationships?.[contactId];
    
    if (suggestion && contact) {
        contact.disposition = suggestion.to;
        contact.sentimentScore = suggestion.score;
        delete state.dispositionSuggestions[contactId];
        saveChatState();
        console.log(`[Contact Intelligence] Accepted: ${contact.name} → ${suggestion.to}`);
    }
}

/**
 * Dismiss a disposition suggestion
 * @param {string} contactId 
 */
export function dismissDispositionSuggestion(contactId) {
    const state = getChatState();
    if (state?.dispositionSuggestions?.[contactId]) {
        delete state.dispositionSuggestions[contactId];
        saveChatState();
    }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Process voice opinions for mentioned contacts
// ═══════════════════════════════════════════════════════════════

function processVoiceOpinions(voiceResults, mentionedContacts) {
    if (!voiceResults?.length || !mentionedContacts?.size) return;
    
    for (const voice of voiceResults) {
        if (!voice.content || !voice.skillId) continue;
        
        for (const [npcName, contact] of mentionedContacts) {
            try {
                const analysis = analyzeVoiceSentiment(voice.content, npcName);
                
                if (analysis.mentioned && analysis.sentiment !== 0) {
                    updateVoiceOpinion(
                        contact.id,
                        voice.skillId,
                        analysis.sentiment,
                        voice.content
                    );
                }
            } catch (e) {
                // Skip this voice/contact pair
            }
        }
    }
}

function checkDispositionShifts(mentionedContacts) {
    for (const [npcName, contact] of mentionedContacts) {
        try {
            const result = recalculateSentiment(contact.id, false);
            
            if (result?.shouldChange && !result.manuallyEdited) {
                console.log(`[Contact Intelligence] Shift suggested: ${contact.name} ${result.currentDisposition} → ${result.suggestedDisposition}`);
                
                const state = getChatState();
                if (state) {
                    if (!state.dispositionSuggestions) {
                        state.dispositionSuggestions = {};
                    }
                    state.dispositionSuggestions[contact.id] = {
                        from: result.currentDisposition,
                        to: result.suggestedDisposition,
                        score: result.sentimentScore,
                        timestamp: Date.now()
                    };
                    saveChatState();
                }
            }
        } catch (e) {
            // Skip this contact
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN INTEGRATION HOOK
// Called from generation.js AFTER voices are generated
// 
// ⚠️ THIS FUNCTION MUST NEVER THROW - It's fire-and-forget
// ═══════════════════════════════════════════════════════════════

/**
 * Main hook called after voice generation
 * Scans for NPCs, updates opinions, tracks pending contacts
 * 
 * @param {array} voiceResults - Generated voice responses
 * @param {object} context - Context with message text
 */
export async function updateContactIntelligence(voiceResults, context) {
    // ═══════════════════════════════════════════════════════════
    // CRITICAL: Wrap EVERYTHING in try/catch
    // This function can NEVER break voice generation
    // ═══════════════════════════════════════════════════════════
    try {
        // Initialize dependencies
        await ensureInitialized();
        
        // Validate input
        if (!context?.message || typeof context.message !== 'string') {
            return;
        }
        
        console.log('[Contact Intelligence] Scanning for NPCs...');
        
        // FIX (Bug 4): Get character names to exclude from detection
        const excludeNames = getCharacterNames();
        
        // Detect potential NPCs (excluding player/AI character names)
        const detected = detectPotentialNPCs(context.message, excludeNames);
        
        if (detected.size === 0) {
            return;
        }
        
        console.log('[Contact Intelligence] Found:', Array.from(detected.keys()));
        
        // Find known contacts that were mentioned
        const mentionedContacts = new Map();
        
        for (const [name, data] of detected) {
            const existingContact = findMatchingContact(name);
            
            if (existingContact) {
                mentionedContacts.set(name, existingContact);
            } else if (data.confidence >= 0.5) {
                trackPendingContact(name, data.contexts?.[0]);
            }
        }
        
        // Process voice opinions if we have both contacts and voice results
        if (mentionedContacts.size > 0 && voiceResults?.length > 0) {
            processVoiceOpinions(voiceResults, mentionedContacts);
            checkDispositionShifts(mentionedContacts);
        }
        
        // Check for suggestions
        const suggestions = getContactSuggestions();
        if (suggestions.length > 0) {
            console.log('[Contact Intelligence] Suggestions ready:', suggestions.map(s => s.name));
        }
        
    } catch (e) {
        // NEVER let this error propagate
        console.warn('[Contact Intelligence] updateContactIntelligence error (non-fatal):', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { CONFIG };
