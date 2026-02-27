/**
 * Brain Batch Updater — Background Update Cycle
 * 
 * Every N messages, makes ONE API call that reviews recent chat context
 * and updates all four attribute brains. Reuses The Tribunal's existing
 * API infrastructure (callAPIWithTokens from api-helpers.js).
 * 
 * Flow:
 *   MESSAGE_RECEIVED → incrementCounter → if due → runBatchUpdate()
 *     → build prompt with all 4 brain states + recent messages
 *     → API call via existing callAPIWithTokens
 *     → parse response into per-attribute operations
 *     → apply operations to brain state
 *     → reset counter
 * 
 * @version 1.0.0
 */

import { getContext } from '../../../../extensions.js';
import { callAPIWithTokens } from '../voice/api-helpers.js';
import { getVitals } from '../core/state.js';
import {
    isBrainEnabled,
    serializeAllBrainsForPrompt,
    applyBatchUpdate,
    resetBrainCounter,
    ATTRIBUTE_IDS
} from './attribute-brains.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isUpdating = false;

// ═══════════════════════════════════════════════════════════════
// CONTEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract recent chat messages for the batch update prompt.
 * Strips AI reasoning tags and HTML.
 * 
 * @param {number} depth - Number of messages to include
 * @returns {string} Formatted recent chat block
 */
function extractRecentContext(depth) {
    try {
        const ctx = getContext();
        const chat = ctx?.chat;
        if (!chat || chat.length === 0) return '';

        const stripReasoning = (text) => {
            if (!text) return '';
            return text
                .replace(/<(thought|think|thinking|reasoning|reason)>[\s\S]*?<\/\1>/gi, '')
                .replace(/<(thought|think|thinking|reasoning|reason)\s*\/?>/gi, '')
                .trim();
        };

        const cleanMessage = (text) => {
            if (!text) return '';
            let cleaned = stripReasoning(text);
            cleaned = cleaned.replace(/<[^>]*>/g, ''); // strip HTML
            return cleaned.substring(0, 3000).trim();
        };

        const messagesToScan = Math.max(2, Math.min(depth, chat.length));
        const recentMessages = chat.slice(-messagesToScan);

        return recentMessages
            .map(msg => `${msg.name || 'Unknown'}: ${cleanMessage(msg.mes)}`)
            .filter(line => line.length > 15)
            .join('\n\n');
    } catch (e) {
        console.warn('[Tribunal Brains] Context extraction failed:', e);
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the batch update prompt.
 * @param {string} allBrainsText - Serialized brain states
 * @param {string} recentContext - Recent chat messages
 * @returns {{ system: string, user: string }}
 */
function buildBatchUpdatePrompt(allBrainsText, recentContext) {
    // Vitals note (only if below 70%)
    let vitalsNote = '';
    try {
        const vitals = getVitals();
        if (vitals) {
            const hPct = vitals.maxHealth > 0 ? Math.round((vitals.health / vitals.maxHealth) * 100) : 100;
            const mPct = vitals.maxMorale > 0 ? Math.round((vitals.morale / vitals.maxMorale) * 100) : 100;
            if (hPct < 70 || mPct < 70) {
                vitalsNote = `\nCHARACTER CONDITION: Health ${hPct}%, Morale ${mPct}%`;
                if (hPct <= 0) vitalsNote += ' — CHARACTER IS DEAD';
                else if (hPct <= 10) vitalsNote += ' — CRITICAL';
                if (mPct <= 0) vitalsNote += ' — BROKEN DOWN';
                else if (mPct <= 10) vitalsNote += ' — NEAR BREAKDOWN';
            }
        }
    } catch (e) { /* vitals optional */ }

    const system = `You are a cognitive observation system tracking four domains of awareness for a character in an interactive story.

YOUR TASK: Review recent events and update the shared observation notebooks.

CRITICAL RULES:
- Store NEUTRAL OBSERVATIONS — facts and sensory data, not opinions
- Write as if recording in a shared notebook multiple readers will use
- Each observation is ONE concise sentence
- Keys are snake_case, 1-4 descriptive words
- Only update domains affected by recent events
- Skip domains with no changes entirely
- Maximum 3 operations per domain per update
- DELETE observations that are resolved or no longer relevant
- Do NOT rephrase existing observations

THE FOUR DOMAINS:
[INTELLECT] Theories, contradictions, evidence, patterns, knowledge gaps
[PSYCHE] Emotional reads, trust assessments, social dynamics, willpower states
[PHYSIQUE] Bodily states, threats detected, cravings, pain, sensory memory
[MOTORICS] Spatial layout, mechanical details, environmental observations

OUTPUT FORMAT (only include domains with changes):
[DOMAIN_NAME]
key_name = Neutral factual observation.
DELETE key_to_remove

If nothing significant happened: NO_UPDATES`;

    const user = `CURRENT OBSERVATION NOTEBOOKS:
---
${allBrainsText}
---${vitalsNote}

RECENT EVENTS:
${recentContext}

Review and update. Only include domains with genuine changes. If nothing significant happened, output: NO_UPDATES`;

    return { system, user };
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Parse the batch update response into per-attribute operation sets.
 * Handles [DOMAIN] headers with key = value and DELETE key lines.
 * 
 * @param {string} responseText - Raw AI response
 * @returns {Array<{ attributeId: string, operations: Array }>}
 */
export function parseBatchUpdateResponse(responseText) {
    if (!responseText || responseText.trim() === 'NO_UPDATES') return [];

    const domainMap = {
        'INTELLECT': 'intellect',
        'PSYCHE': 'psyche',
        'PHYSIQUE': 'physique',
        'MOTORICS': 'motorics'
    };

    const results = [];
    let currentDomain = null;
    let currentOps = [];

    for (const rawLine of responseText.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        // Domain header: [INTELLECT], [PSYCHE], etc.
        const headerMatch = line.match(/^\[([A-Z]+)\]/);
        if (headerMatch && domainMap[headerMatch[1]]) {
            // Save previous domain
            if (currentDomain && currentOps.length > 0) {
                results.push({ attributeId: currentDomain, operations: [...currentOps] });
            }
            currentDomain = domainMap[headerMatch[1]];
            currentOps = [];
            continue;
        }

        if (!currentDomain) continue;

        // DELETE operation
        const deleteMatch = line.match(/^DELETE\s+([a-z_][a-z0-9_]*)/i);
        if (deleteMatch) {
            currentOps.push({ type: 'delete', key: deleteMatch[1].toLowerCase() });
            continue;
        }

        // Set/update: key_name = Observation text.
        const setMatch = line.match(/^([a-z_][a-z0-9_]*)\s*=\s*(.+)$/i);
        if (setMatch) {
            const key = setMatch[1].toLowerCase();
            let value = setMatch[2].trim();
            // Strip surrounding quotes/backticks
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'")) ||
                (value.startsWith('`') && value.endsWith('`'))) {
                value = value.slice(1, -1);
            }
            currentOps.push({ type: 'set', key, value });
            continue;
        }
    }

    // Don't forget the last domain
    if (currentDomain && currentOps.length > 0) {
        results.push({ attributeId: currentDomain, operations: [...currentOps] });
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// MAIN BATCH UPDATE
// ═══════════════════════════════════════════════════════════════

/**
 * Run a batch brain update.
 * Called when the message counter hits the interval.
 * 
 * @returns {Object|null} Update summary or null if skipped/failed
 */
export async function runBatchUpdate() {
    // Guards
    if (isUpdating) {
        console.log('[Tribunal Brains] Batch update already in progress');
        return null;
    }
    if (!isBrainEnabled()) return null;

    isUpdating = true;

    try {
        // 1. Gather context
        const recentContext = extractRecentContext(6);
        if (!recentContext.trim()) {
            console.log('[Tribunal Brains] No recent context, skipping');
            resetBrainCounter();
            return null;
        }

        // 2. Serialize current brain states
        const allBrainsText = serializeAllBrainsForPrompt();

        // 3. Build prompt
        const { system, user } = buildBatchUpdatePrompt(allBrainsText, recentContext);

        // 4. Call API (reuses Tribunal's existing API infrastructure)
        console.log('[Tribunal Brains] Running batch brain update...');
        const responseText = await callAPIWithTokens(system, user, 800);

        if (!responseText || responseText.trim() === 'NO_UPDATES') {
            console.log('[Tribunal Brains] No updates needed');
            resetBrainCounter();
            return { applied: 0, skipped: 0, byAttribute: {} };
        }

        // 5. Parse response
        const updateSet = parseBatchUpdateResponse(responseText);

        // 6. Apply operations
        const summary = applyBatchUpdate(updateSet);
        console.log(`[Tribunal Brains] Batch update: ${summary.applied} changes, ${summary.skipped} skipped`);

        // 7. Reset counter
        resetBrainCounter();

        // 8. Toast notification
        if (typeof toastr !== 'undefined' && summary.applied > 0) {
            const details = Object.entries(summary.byAttribute)
                .filter(([, v]) => v.added + v.updated + v.deleted > 0)
                .map(([attr, v]) => {
                    const parts = [];
                    if (v.added) parts.push(`+${v.added}`);
                    if (v.updated) parts.push(`~${v.updated}`);
                    if (v.deleted) parts.push(`-${v.deleted}`);
                    return `${attr}: ${parts.join(', ')}`;
                })
                .join(' | ');
            toastr.info(details, 'Cognitive update', { timeOut: 3000 });
        }

        return summary;

    } catch (err) {
        console.error('[Tribunal Brains] Batch update failed:', err);
        // Still reset counter so we don't spam retries
        resetBrainCounter();
        return null;
    } finally {
        isUpdating = false;
    }
}

/**
 * Check if a batch update is currently running.
 * @returns {boolean}
 */
export function isBatchUpdating() {
    return isUpdating;
}
