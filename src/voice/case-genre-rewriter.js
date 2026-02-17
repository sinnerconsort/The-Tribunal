/**
 * The Tribunal - Case Genre Rewriter
 * 
 * Two-tier system:
 *   1. Template rewrite (instant, free) — genre profile provides title 
 *      patterns per verb category. Raw regex catch gets slotted in.
 *   2. API enrichment (manual, costs a call) — model rewrites the case 
 *      with full genre flavor, adds a themed description.
 * 
 * Raw title is ALWAYS preserved for pattern matching / deduplication.
 * Genre title is display-only.
 * 
 * @version 1.0.0
 */

import { callAPIWithTokens } from './api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// VERB CATEGORIES
// ═══════════════════════════════════════════════════════════════

/**
 * Classify a raw case title by its leading verb
 * Returns the category key used to look up genre templates
 */
function classifyVerb(title) {
    const lower = title.toLowerCase().trim();
    
    const categories = [
        { key: 'find',     verbs: ['find', 'locate', 'retrieve', 'recover', 'fetch', 'get', 'obtain', 'acquire', 'search'] },
        { key: 'defeat',   verbs: ['defeat', 'kill', 'destroy', 'eliminate', 'stop', 'confront', 'fight'] },
        { key: 'talk',     verbs: ['talk to', 'speak to', 'speak with', 'ask', 'question', 'interrogate', 'interview', 'confront'] },
        { key: 'go',       verbs: ['go to', 'travel to', 'head to', 'visit', 'explore', 'investigate', 'return to'] },
        { key: 'protect',  verbs: ['protect', 'escort', 'guard', 'defend', 'save', 'rescue'] },
        { key: 'deliver',  verbs: ['deliver', 'bring', 'take', 'carry', 'transport'] },
        { key: 'discover', verbs: ['discover', 'learn', 'uncover', 'reveal', 'figure out', 'find out', 'determine', 'understand'] },
    ];
    
    for (const cat of categories) {
        if (cat.verbs.some(v => lower.startsWith(v))) {
            return cat.key;
        }
    }
    
    return 'generic';
}

/**
 * Strip the leading verb from a title to get the object/subject
 * "Find the ancient scroll" → "the ancient scroll"
 * "Talk to the merchant" → "the merchant"
 */
function stripVerb(title) {
    const lower = title.toLowerCase().trim();
    
    const verbPhrases = [
        'find out', 'figure out', 'talk to', 'speak to', 'speak with',
        'go to', 'travel to', 'head to', 'return to',
        'find', 'locate', 'retrieve', 'recover', 'fetch', 'get', 'obtain', 'acquire', 'search for',
        'defeat', 'kill', 'destroy', 'eliminate', 'stop', 'confront', 'fight',
        'ask', 'question', 'interrogate', 'interview',
        'visit', 'explore', 'investigate',
        'protect', 'escort', 'guard', 'defend', 'save', 'rescue',
        'deliver', 'bring', 'take', 'carry', 'transport',
        'discover', 'learn', 'uncover', 'reveal', 'determine', 'understand'
    ];
    
    // Sort by length descending so "find out" matches before "find"
    verbPhrases.sort((a, b) => b.length - a.length);
    
    for (const verb of verbPhrases) {
        if (lower.startsWith(verb)) {
            return title.slice(verb.length).trim();
        }
    }
    
    return title;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES (genre-neutral)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_TEMPLATES = {
    find:     (obj) => `Find ${obj}`,
    defeat:   (obj) => `Deal with ${obj}`,
    talk:     (obj) => `Talk to ${obj}`,
    go:       (obj) => `Go to ${obj}`,
    protect:  (obj) => `Protect ${obj}`,
    deliver:  (obj) => `Deliver ${obj}`,
    discover: (obj) => `Figure out ${obj}`,
    generic:  (obj) => obj  // Pass through
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE REWRITE (instant, free)
// ═══════════════════════════════════════════════════════════════

/**
 * Rewrite a raw case title using genre templates
 * 
 * Genre profiles provide caseTemplates: {
 *     find:     (obj) => `The Missing — ${obj}`,
 *     defeat:   (obj) => `Confrontation — ${obj}`,
 *     ...
 * }
 * 
 * Or as string templates with {obj} placeholder:
 *     find: "The Missing — {obj}"
 * 
 * @param {string} rawTitle - The original detected title
 * @returns {string} Genre-flavored title
 */
export function rewriteTitle(rawTitle) {
    if (!rawTitle) return rawTitle;
    
    const verb = classifyVerb(rawTitle);
    const obj = stripVerb(rawTitle);
    
    // Check genre profile for templates
    const genreTemplates = getProfileValue('promptFrames.caseTemplates');
    
    let template = null;
    
    if (genreTemplates) {
        template = genreTemplates[verb] || genreTemplates.generic || null;
    }
    
    // Fall back to defaults
    if (!template) {
        template = DEFAULT_TEMPLATES[verb] || DEFAULT_TEMPLATES.generic;
    }
    
    // Handle both function and string templates
    if (typeof template === 'function') {
        return template(obj);
    } else if (typeof template === 'string') {
        return template.replace('{obj}', obj);
    }
    
    return rawTitle;
}

/**
 * Apply template rewrite to a case object
 * Preserves rawTitle, sets displayTitle
 * 
 * @param {object} caseObj - Case object from cases.js
 * @returns {object} Case with rawTitle and displayTitle
 */
export function applyTemplateRewrite(caseObj) {
    if (!caseObj) return caseObj;
    
    // Store raw title if not already stored
    const rawTitle = caseObj.rawTitle || caseObj.title;
    const displayTitle = rewriteTitle(rawTitle);
    
    return {
        ...caseObj,
        rawTitle,
        title: displayTitle
    };
}

// ═══════════════════════════════════════════════════════════════
// API ENRICHMENT (manual, costs a call)
// ═══════════════════════════════════════════════════════════════

const ENRICH_MAX_TOKENS = 150;

/**
 * Enrich a single case via API call
 * Rewrites the title with genre flavor and generates a short description
 * 
 * @param {object} caseObj - Case object
 * @param {Object} [options]
 * @param {number} [options.chatDepth=3] - Recent chat messages for context
 * @returns {Promise<{title: string, description: string, enriched: boolean}|null>}
 */
export async function enrichCase(caseObj, { chatDepth = 3 } = {}) {
    if (!caseObj) return null;
    
    const rawTitle = caseObj.rawTitle || caseObj.title;
    
    console.log(`[Tribunal] Enriching case: ${rawTitle}`);
    
    // ─────────────────────────────────────────────────────────
    // Genre framing
    // ─────────────────────────────────────────────────────────
    
    const genreFrame = getProfileValue('promptFrames.cases') || '';
    const toneGuide = getProfileValue('toneGuide') || '';
    const settingName = getProfileValue('name') || 'default';
    
    // ─────────────────────────────────────────────────────────
    // Chat context
    // ─────────────────────────────────────────────────────────
    
    let chatContext = '';
    try {
        const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) 
            ? SillyTavern.getContext() 
            : null;
        if (ctx?.chat?.length) {
            chatContext = ctx.chat.slice(-chatDepth).map(msg => {
                const role = msg.is_user ? 'Player' : 'Character';
                return `${role}: ${(msg.mes || '').substring(0, 200)}`;
            }).join('\n');
        }
    } catch (e) { /* silent */ }
    
    // ─────────────────────────────────────────────────────────
    // Prompts
    // ─────────────────────────────────────────────────────────
    
    const systemPrompt = `You rewrite quest/task entries for a ${settingName} roleplay tracker.

${toneGuide ? `TONE:\n${toneGuide}\n` : ''}
${genreFrame ? `CASE STYLE:\n${genreFrame}\n` : ''}
RULES:
- Rewrite the task title with genre-appropriate flavor (max 60 chars)
- Write a one-sentence description that frames the task in-genre
- The title should feel like it belongs in this genre's quest log
- Output EXACTLY this format, nothing else:
TITLE: [rewritten title]
DESC: [one sentence description]`;

    const userPrompt = `Raw task: "${rawTitle}"
${caseObj.description ? `Current description: ${caseObj.description}` : ''}
Priority: ${caseObj.priority || 'side'}
${chatContext ? `\nRecent scene:\n${chatContext}` : ''}

Rewrite this task for the ${settingName} setting.`;

    // ─────────────────────────────────────────────────────────
    // Call API
    // ─────────────────────────────────────────────────────────
    
    try {
        const response = await callAPIWithTokens(systemPrompt, userPrompt, ENRICH_MAX_TOKENS);
        
        if (!response) return null;
        
        // Parse TITLE: / DESC: format
        const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        const descMatch = response.match(/DESC:\s*(.+?)(?:\n|$)/i);
        
        const enrichedTitle = titleMatch 
            ? titleMatch[1].trim().replace(/^["']|["']$/g, '') 
            : null;
        const enrichedDesc = descMatch 
            ? descMatch[1].trim().replace(/^["']|["']$/g, '') 
            : null;
        
        if (!enrichedTitle) {
            console.warn('[Tribunal] Could not parse enriched title from:', response);
            return null;
        }
        
        console.log(`[Tribunal] Enriched: "${rawTitle}" → "${enrichedTitle}"`);
        
        return {
            title: enrichedTitle,
            description: enrichedDesc || caseObj.description || '',
            enriched: true
        };
        
    } catch (err) {
        console.error('[Tribunal] Case enrichment failed:', err);
        return null;
    }
}

/**
 * Batch enrich multiple cases
 * For a "refresh all" button
 * 
 * @param {Object} cases - Cases object { id: caseObj }
 * @param {Object} [options]
 * @param {number} [options.maxCases=10] - Cap to avoid API spam
 * @param {number} [options.delayMs=500] - Delay between calls
 * @param {boolean} [options.activeOnly=true] - Only enrich active cases
 * @param {boolean} [options.unenrichedOnly=true] - Skip already-enriched cases
 * @returns {Promise<Array>} Array of { caseId, result } 
 */
export async function enrichCases(cases = {}, { 
    maxCases = 10, 
    delayMs = 500, 
    activeOnly = true,
    unenrichedOnly = true 
} = {}) {
    const targets = Object.entries(cases)
        .filter(([_, c]) => {
            if (activeOnly && c.status !== 'active') return false;
            if (unenrichedOnly && c.enriched) return false;
            return true;
        })
        .slice(0, maxCases);
    
    if (targets.length === 0) return [];
    
    console.log(`[Tribunal] Enriching ${targets.length} cases`);
    
    const results = [];
    
    for (const [id, caseObj] of targets) {
        const result = await enrichCase(caseObj);
        
        if (result) {
            results.push({ caseId: id, result });
        }
        
        if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    classifyVerb,
    rewriteTitle,
    applyTemplateRewrite,
    enrichCase,
    enrichCases
};
