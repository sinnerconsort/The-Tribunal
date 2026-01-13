/**
 * The Tribunal - Vitals Detector
 * Analyzes narrative text to detect health/morale impacts
 * Phase 2 Implementation
 */

import {
    HEALTH_DAMAGE_KEYWORDS,
    HEALTH_RESTORE_KEYWORDS,
    MORALE_DAMAGE_KEYWORDS,
    MORALE_RESTORE_KEYWORDS,
    SEVERITY_VALUES,
    SENSITIVITY_MULTIPLIERS,
    PROTAGONIST_INDICATORS,
    NEGATION_WORDS,
    DIALOGUE_PATTERNS,
    COMPOUND_HEALTH_DAMAGE,
    COMPOUND_MORALE_DAMAGE,
    COMPOUND_HEALTH_RESTORE,
    COMPOUND_MORALE_RESTORE,
    getSeverityForKeyword
} from './patterns.js';

// ═══════════════════════════════════════════════════════════════
// DETECTION RESULT TYPE
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} DetectionResult
 * @property {number} healthDelta - Change to health (negative = damage)
 * @property {number} moraleDelta - Change to morale (negative = damage)
 * @property {string[]} healthReasons - Keywords that triggered health change
 * @property {string[]} moraleReasons - Keywords that triggered morale change
 * @property {string} severity - Overall severity level detected
 * @property {boolean} detected - Whether any changes were detected
 */

// ═══════════════════════════════════════════════════════════════
// TEXT PREPROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Remove dialogue from text to focus on narrative description
 * @param {string} text - Raw message text
 * @returns {string} Text with dialogue removed
 */
function stripDialogue(text) {
    let cleaned = text;
    
    // Remove quoted dialogue
    cleaned = cleaned.replace(/[""][^""]*[""]/g, ' ');
    cleaned = cleaned.replace(/[''][^'']*['']/g, ' ');
    
    // Remove standard quotes
    cleaned = cleaned.replace(/"[^"]*"/g, ' ');
    cleaned = cleaned.replace(/'[^']*'/g, ' ');
    
    return cleaned;
}

/**
 * Extract sentences that are likely about the protagonist
 * @param {string} text - Preprocessed text
 * @param {string} protagonistName - Character name to look for
 * @returns {string[]} Array of relevant sentences
 */
function extractProtagonistSentences(text, protagonistName = '') {
    // Split into sentences (rough)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Build protagonist patterns
    const namePatterns = protagonistName 
        ? [protagonistName.toLowerCase(), ...PROTAGONIST_INDICATORS]
        : PROTAGONIST_INDICATORS;
    
    // Filter to sentences mentioning protagonist
    return sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return namePatterns.some(pattern => {
            // Word boundary check to avoid false positives
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(lower);
        });
    });
}

/**
 * Check if a sentence is negated
 * @param {string} sentence - Sentence to check
 * @param {string} keyword - The keyword we're checking for negation around
 * @returns {boolean} True if the keyword's meaning is negated
 */
function isNegated(sentence, keyword) {
    const lower = sentence.toLowerCase();
    const keywordIndex = lower.indexOf(keyword.toLowerCase());
    
    if (keywordIndex === -1) return false;
    
    // Check for negation words in the ~30 chars before the keyword
    const prefix = lower.substring(Math.max(0, keywordIndex - 30), keywordIndex);
    
    return NEGATION_WORDS.some(neg => prefix.includes(neg));
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Find compound phrases in text
 * @param {string} text - Text to search
 * @param {Object} compoundDict - Dictionary of compound phrases
 * @returns {Array} Array of {phrase, severity} matches
 */
function findCompoundPhrases(text, compoundDict) {
    const lower = text.toLowerCase();
    const matches = [];
    
    for (const [phrase, severity] of Object.entries(compoundDict)) {
        if (lower.includes(phrase)) {
            // Check for negation
            if (!isNegated(text, phrase)) {
                matches.push({ phrase, severity });
            }
        }
    }
    
    return matches;
}

/**
 * Find single keywords in text
 * @param {string} text - Text to search
 * @param {Object} keywordDict - Dictionary organized by severity
 * @param {string[]} excludePhrases - Phrases to skip (already matched as compounds)
 * @returns {Array} Array of {keyword, severity} matches
 */
function findKeywords(text, keywordDict, excludePhrases = []) {
    const lower = text.toLowerCase();
    const matches = [];
    
    // Create exclusion check
    const shouldExclude = (keyword) => {
        return excludePhrases.some(phrase => 
            phrase.toLowerCase().includes(keyword.toLowerCase())
        );
    };
    
    for (const [severity, keywords] of Object.entries(keywordDict)) {
        for (const keyword of keywords) {
            // Skip if part of already-matched compound
            if (shouldExclude(keyword)) continue;
            
            // Word boundary match
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lower)) {
                // Check for negation
                if (!isNegated(text, keyword)) {
                    matches.push({ keyword, severity });
                }
            }
        }
    }
    
    return matches;
}

// ═══════════════════════════════════════════════════════════════
// MAIN DETECTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze text for health/morale impacts
 * @param {string} text - The AI message text to analyze
 * @param {Object} options - Detection options
 * @param {string} options.protagonistName - Character name
 * @param {string} options.sensitivity - 'low', 'medium', or 'high'
 * @param {boolean} options.requireProtagonist - Only detect if protagonist mentioned
 * @returns {DetectionResult} Detection results
 */
export function detectVitalsChanges(text, options = {}) {
    const {
        protagonistName = '',
        sensitivity = 'medium',
        requireProtagonist = true
    } = options;
    
    // Initialize result
    const result = {
        healthDelta: 0,
        moraleDelta: 0,
        healthReasons: [],
        moraleReasons: [],
        severity: 'none',
        detected: false
    };
    
    if (!text || text.trim().length === 0) {
        return result;
    }
    
    // Preprocess
    const cleanedText = stripDialogue(text);
    
    // Get relevant sentences
    let relevantText = cleanedText;
    if (requireProtagonist) {
        const sentences = extractProtagonistSentences(cleanedText, protagonistName);
        if (sentences.length === 0) {
            // No protagonist mentions found
            return result;
        }
        relevantText = sentences.join('. ');
    }
    
    // Get sensitivity multiplier
    const multiplier = SENSITIVITY_MULTIPLIERS[sensitivity] || 1.0;
    
    // Track highest severity found
    let maxSeverity = 'none';
    const updateMaxSeverity = (sev) => {
        const order = ['none', 'minor', 'moderate', 'major', 'critical'];
        if (order.indexOf(sev) > order.indexOf(maxSeverity)) {
            maxSeverity = sev;
        }
    };
    
    // ─────────────────────────────────────────────────────────
    // HEALTH DETECTION
    // ─────────────────────────────────────────────────────────
    
    // Check compound phrases first (more accurate)
    const healthDamageCompounds = findCompoundPhrases(relevantText, COMPOUND_HEALTH_DAMAGE);
    const healthRestoreCompounds = findCompoundPhrases(relevantText, COMPOUND_HEALTH_RESTORE);
    
    // Get matched phrases for exclusion
    const matchedHealthPhrases = [
        ...healthDamageCompounds.map(m => m.phrase),
        ...healthRestoreCompounds.map(m => m.phrase)
    ];
    
    // Check single keywords (excluding already-matched compounds)
    const healthDamageKeywords = findKeywords(relevantText, HEALTH_DAMAGE_KEYWORDS, matchedHealthPhrases);
    const healthRestoreKeywords = findKeywords(relevantText, HEALTH_RESTORE_KEYWORDS, matchedHealthPhrases);
    
    // Calculate health delta
    let healthDamage = 0;
    let healthRestore = 0;
    
    for (const match of [...healthDamageCompounds, ...healthDamageKeywords]) {
        const severity = match.severity;
        const value = SEVERITY_VALUES[severity] || SEVERITY_VALUES.moderate;
        healthDamage += value;
        result.healthReasons.push(match.phrase || match.keyword);
        updateMaxSeverity(severity);
    }
    
    for (const match of [...healthRestoreCompounds, ...healthRestoreKeywords]) {
        const severity = match.severity;
        const value = SEVERITY_VALUES[severity] || SEVERITY_VALUES.moderate;
        healthRestore += value;
        result.healthReasons.push(`+${match.phrase || match.keyword}`);
        updateMaxSeverity(severity);
    }
    
    // Apply sensitivity and calculate net change
    result.healthDelta = Math.round((healthRestore - healthDamage) * multiplier);
    
    // ─────────────────────────────────────────────────────────
    // MORALE DETECTION
    // ─────────────────────────────────────────────────────────
    
    // Check compound phrases first
    const moraleDamageCompounds = findCompoundPhrases(relevantText, COMPOUND_MORALE_DAMAGE);
    const moraleRestoreCompounds = findCompoundPhrases(relevantText, COMPOUND_MORALE_RESTORE);
    
    // Get matched phrases for exclusion
    const matchedMoralePhrases = [
        ...moraleDamageCompounds.map(m => m.phrase),
        ...moraleRestoreCompounds.map(m => m.phrase)
    ];
    
    // Check single keywords
    const moraleDamageKeywords = findKeywords(relevantText, MORALE_DAMAGE_KEYWORDS, matchedMoralePhrases);
    const moraleRestoreKeywords = findKeywords(relevantText, MORALE_RESTORE_KEYWORDS, matchedMoralePhrases);
    
    // Calculate morale delta
    let moraleDamage = 0;
    let moraleRestore = 0;
    
    for (const match of [...moraleDamageCompounds, ...moraleDamageKeywords]) {
        const severity = match.severity;
        const value = SEVERITY_VALUES[severity] || SEVERITY_VALUES.moderate;
        moraleDamage += value;
        result.moraleReasons.push(match.phrase || match.keyword);
        updateMaxSeverity(severity);
    }
    
    for (const match of [...moraleRestoreCompounds, ...moraleRestoreKeywords]) {
        const severity = match.severity;
        const value = SEVERITY_VALUES[severity] || SEVERITY_VALUES.moderate;
        moraleRestore += value;
        result.moraleReasons.push(`+${match.phrase || match.keyword}`);
        updateMaxSeverity(severity);
    }
    
    // Apply sensitivity and calculate net change
    result.moraleDelta = Math.round((moraleRestore - moraleDamage) * multiplier);
    
    // ─────────────────────────────────────────────────────────
    // FINALIZE
    // ─────────────────────────────────────────────────────────
    
    result.severity = maxSeverity;
    result.detected = result.healthDelta !== 0 || result.moraleDelta !== 0;
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════

/**
 * Format detection result for display
 * @param {DetectionResult} result - Detection result
 * @returns {string} Human-readable summary
 */
export function formatDetectionResult(result) {
    if (!result.detected) {
        return 'No vitals changes detected';
    }
    
    const parts = [];
    
    if (result.healthDelta !== 0) {
        const sign = result.healthDelta > 0 ? '+' : '';
        const reasons = result.healthReasons.slice(0, 2).join(', ');
        parts.push(`Health ${sign}${result.healthDelta} (${reasons})`);
    }
    
    if (result.moraleDelta !== 0) {
        const sign = result.moraleDelta > 0 ? '+' : '';
        const reasons = result.moraleReasons.slice(0, 2).join(', ');
        parts.push(`Morale ${sign}${result.moraleDelta} (${reasons})`);
    }
    
    return parts.join(' | ');
}

/**
 * Quick check if text might contain vitals-relevant content
 * Use this for fast filtering before full detection
 * @param {string} text - Text to check
 * @returns {boolean} True if worth running full detection
 */
export function mightContainVitalsContent(text) {
    if (!text || text.length < 20) return false;
    
    const lower = text.toLowerCase();
    
    // Quick check for common indicator words
    const quickIndicators = [
        'hurt', 'pain', 'wound', 'heal', 'feel', 'hit',
        'proud', 'ashamed', 'happy', 'sad', 'angry',
        'blood', 'broken', 'better', 'worse'
    ];
    
    return quickIndicators.some(word => lower.includes(word));
}
