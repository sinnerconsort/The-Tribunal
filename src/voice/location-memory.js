/**
 * The Tribunal - Location Memory Generator
 * Generates genre-themed memories/impressions for locations
 * 
 * Two modes:
 *   - "new"      → First impression. What the character notices walking in.
 *   - "familiar" → Returning to a known place. A memory surfaces.
 * 
 * Genre frames from the active profile control the tone.
 * Falls back to a neutral default if no genre frame is set.
 * 
 * @version 1.0.0
 */

import { callAPIWithTokens } from './api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_FRAME = {
    new: `Write a brief first impression of this place. What does the character 
notice? What's the atmosphere? One to two sentences, grounded in sensory detail.`,
    familiar: `Write a brief memory that surfaces on returning to this place. 
Something small and habitual — a detail that proves the character has been here 
before. One to two sentences, personal and specific.`
};

const MAX_TOKENS = 120;

// ═══════════════════════════════════════════════════════════════
// CONTEXT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get recent chat messages for scene context
 * @param {number} depth - How many recent messages to grab
 * @returns {string} Formatted recent chat excerpt
 */
function getRecentChatContext(depth = 5) {
    try {
        const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) 
            ? SillyTavern.getContext() 
            : null;
        
        if (!ctx?.chat?.length) return '';
        
        const recent = ctx.chat.slice(-depth);
        return recent.map(msg => {
            const role = msg.is_user ? 'Player' : 'Character';
            const text = (msg.mes || '').substring(0, 300);
            return `${role}: ${text}`;
        }).join('\n');
    } catch (e) {
        console.warn('[Tribunal] Could not read chat context:', e);
        return '';
    }
}

/**
 * Get the player character name
 * @returns {string}
 */
function getPlayerName() {
    try {
        const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) 
            ? SillyTavern.getContext() 
            : null;
        return ctx?.name1 || 'the character';
    } catch {
        return 'the character';
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a themed memory/impression for a location
 * 
 * @param {Object} options
 * @param {string} options.locationName - Name of the location
 * @param {string} [options.district] - District/area (optional)
 * @param {string} [options.mode='new'] - 'new' for first impression, 'familiar' for returning
 * @param {number} [options.chatDepth=5] - How many recent messages to include as context
 * @returns {Promise<{text: string, mode: string, aiGenerated: boolean, timestamp: string}|null>}
 */
export async function generateLocationMemory({
    locationName,
    district = null,
    mode = 'new',
    chatDepth = 5
} = {}) {
    if (!locationName) {
        console.warn('[Tribunal] generateLocationMemory: no location name');
        return null;
    }
    
    const effectiveMode = (mode === 'familiar') ? 'familiar' : 'new';
    
    console.log(`[Tribunal] Generating ${effectiveMode} memory for: ${locationName}`);
    
    // ─────────────────────────────────────────────────────────
    // Build genre frame
    // ─────────────────────────────────────────────────────────
    
    // Check for genre-specific location memory frame
    const genreFrames = getProfileValue('promptFrames.locationMemory');
    const toneGuide = getProfileValue('toneGuide') || '';
    
    let frame;
    if (genreFrames && typeof genreFrames === 'object') {
        // Genre profile has mode-specific frames
        frame = genreFrames[effectiveMode] || DEFAULT_FRAME[effectiveMode];
    } else if (typeof genreFrames === 'string') {
        // Genre profile has a single frame string for both modes
        frame = genreFrames;
    } else {
        frame = DEFAULT_FRAME[effectiveMode];
    }
    
    // ─────────────────────────────────────────────────────────
    // Build prompts
    // ─────────────────────────────────────────────────────────
    
    const playerName = getPlayerName();
    const chatContext = getRecentChatContext(chatDepth);
    const locationLabel = district 
        ? `${locationName} (${district})` 
        : locationName;
    
    const systemPrompt = `You generate short, evocative location memories for a roleplay tracking system.

${toneGuide ? `TONE:\n${toneGuide}\n` : ''}
${frame}

RULES:
- Write in second person ("you")
- One to two sentences MAXIMUM
- Be specific, not generic — pull from the scene context if available
- Do NOT narrate actions or advance the story — this is a memory, an impression, a feeling
- Do NOT use quotation marks around the entire response
- Output ONLY the memory text. No labels, no JSON, no explanation.`;

    const userPrompt = `Location: ${locationLabel}
Mode: ${effectiveMode === 'new' ? 'First time here' : 'Returning to a familiar place'}
Character: ${playerName}
${chatContext ? `\nRecent scene:\n${chatContext}` : ''}

Generate a ${effectiveMode === 'new' ? 'first impression' : 'returning memory'} for this location.`;

    // ─────────────────────────────────────────────────────────
    // Call API
    // ─────────────────────────────────────────────────────────
    
    try {
        const response = await callAPIWithTokens(systemPrompt, userPrompt, MAX_TOKENS);
        
        if (!response || response.trim().length === 0) {
            console.warn('[Tribunal] Empty location memory response');
            return null;
        }
        
        // Clean up response
        let text = response.trim();
        
        // Strip wrapping quotes if the model added them
        if ((text.startsWith('"') && text.endsWith('"')) || 
            (text.startsWith("'") && text.endsWith("'"))) {
            text = text.slice(1, -1).trim();
        }
        
        console.log(`[Tribunal] Generated ${effectiveMode} memory:`, text.substring(0, 80));
        
        return {
            text,
            mode: effectiveMode,
            aiGenerated: true,
            source: 'location-memory',
            timestamp: new Date().toISOString()
        };
        
    } catch (err) {
        console.error('[Tribunal] Location memory generation failed:', err);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// BATCH HELPER - Generate memories for multiple locations
// (Useful for "fill in" on first genre switch)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate memories for a list of locations that don't have any
 * @param {Array} locations - Array of location objects from state
 * @param {Object} [options]
 * @param {number} [options.maxLocations=5] - Cap to avoid API spam
 * @param {number} [options.delayMs=500] - Delay between calls
 * @returns {Promise<Array>} Array of { locationId, memory } results
 */
export async function fillMissingMemories(locations = [], { maxLocations = 5, delayMs = 500 } = {}) {
    const empty = locations.filter(loc => 
        !loc.events || loc.events.length === 0
    ).slice(0, maxLocations);
    
    if (empty.length === 0) return [];
    
    console.log(`[Tribunal] Filling memories for ${empty.length} locations`);
    
    const results = [];
    
    for (const loc of empty) {
        const memory = await generateLocationMemory({
            locationName: loc.name,
            district: loc.district,
            mode: loc.visited ? 'familiar' : 'new',
            chatDepth: 3
        });
        
        if (memory) {
            results.push({ locationId: loc.id, memory });
        }
        
        // Delay between calls to be nice to the API
        if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    
    return results;
}
