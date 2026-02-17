/**
 * The Tribunal - Context Gatherer
 * Scans chat history, character card, user persona, and world info
 * to build rich context for contact dossier generation.
 * 
 * v1.1.0 - Context contamination defense
 *   - Added verifyChatIdentity() to detect stale context during async operations
 *   - scanWorldInfo() now logs which WI book is being read for debugging
 *   - gatherRawIntel() captures chat identity at start and verifies at end
 *   - All scan functions get fresh context via getSTContext() (no caching)
 * 
 * v1.0.0 - Initial build
 *   - Chat history scanning (extracts name-relevant message snippets)
 *   - Character card description parsing
 *   - User persona scanning
 *   - World info / lorebook entry matching
 *   - AI summarization of gathered intel
 *   - Stores structured intel on contact objects
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  This module is DEFENSIVE - all functions guard themselves.              ║
 * ║  A failure here should never prevent dossier generation.                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { callAPI } from '../voice/api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// ST CONTEXT ACCESS
// ═══════════════════════════════════════════════════════════════

function getSTContext() {
    try {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            return SillyTavern.getContext();
        }
        if (typeof window !== 'undefined' && window.SillyTavern?.getContext) {
            return window.SillyTavern.getContext();
        }
    } catch (e) {
        console.warn('[Context Gatherer] Could not get ST context:', e.message);
    }
    return null;
}

/**
 * Get a fingerprint of the current chat for identity verification
 * Used to detect if a chat switch happened during async gathering
 * @returns {string|null} Chat identity string
 */
function getChatFingerprint() {
    try {
        const ctx = getSTContext();
        if (!ctx) return null;
        
        // Combine character ID + chat length + character name for a unique-enough fingerprint
        const charId = ctx.characterId ?? 'none';
        const charName = ctx.name2 || 'unknown';
        const chatLen = ctx.chat?.length || 0;
        return `${charId}:${charName}:${chatLen}`;
    } catch (e) {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// CHAT HISTORY SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Scan chat history for messages mentioning a contact name
 * Extracts relevant snippets with surrounding context
 * 
 * @param {string} contactName - Name to search for
 * @param {object} options - { maxMessages, maxSnippets, snippetRadius }
 * @returns {object[]} Array of { role, snippet, messageIndex }
 */
function scanChatHistory(contactName, options = {}) {
    const {
        maxMessages = 100,    // How far back to scan
        maxSnippets = 15,     // Max snippets to collect
        snippetRadius = 150   // Characters before/after the name mention
    } = options;
    
    const ctx = getSTContext();
    if (!ctx?.chat?.length) return [];
    
    const snippets = [];
    const lowerName = contactName.toLowerCase();
    const firstName = lowerName.split(/\s+/)[0];
    
    // Scan from newest to oldest, up to maxMessages
    const startIdx = Math.max(0, ctx.chat.length - maxMessages);
    
    for (let i = ctx.chat.length - 1; i >= startIdx && snippets.length < maxSnippets; i--) {
        const msg = ctx.chat[i];
        if (!msg?.mes || typeof msg.mes !== 'string') continue;
        
        const text = msg.mes;
        const lowerText = text.toLowerCase();
        
        // Check if this message mentions the contact
        if (!lowerText.includes(lowerName) && !lowerText.includes(firstName)) continue;
        
        // Extract snippet around the mention
        const mentionIdx = lowerText.indexOf(lowerName);
        const actualIdx = mentionIdx >= 0 ? mentionIdx : lowerText.indexOf(firstName);
        
        if (actualIdx < 0) continue;
        
        const start = Math.max(0, actualIdx - snippetRadius);
        const end = Math.min(text.length, actualIdx + contactName.length + snippetRadius);
        
        let snippet = text.substring(start, end).trim();
        
        // Add ellipsis indicators
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        // Clean up any markdown/HTML artifacts
        snippet = snippet
            .replace(/<[^>]+>/g, '')           // Strip HTML
            .replace(/\*+([^*]+)\*+/g, '$1')  // Strip bold/italic markdown
            .replace(/\s+/g, ' ')              // Collapse whitespace
            .trim();
        
        if (snippet.length < 20) continue; // Too short to be useful
        
        const role = msg.is_user ? 'protagonist' : 'narration';
        snippets.push({ role, snippet, messageIndex: i });
    }
    
    return snippets;
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER CARD SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Check the AI character's card/description for mentions of the contact
 * @param {string} contactName - Name to search for
 * @returns {string|null} Relevant excerpt or null
 */
function scanCharacterCard(contactName) {
    try {
        const ctx = getSTContext();
        if (!ctx) return null;
        
        // Get current character data
        const charId = ctx.characterId;
        const characters = ctx.characters;
        if (charId === undefined || !characters?.[charId]) return null;
        
        const char = characters[charId];
        const lowerName = contactName.toLowerCase();
        const firstName = lowerName.split(/\s+/)[0];
        
        // Check various character card fields
        const fieldsToCheck = [
            char.description,
            char.personality,
            char.scenario,
            char.mes_example,       // Example messages
            char.first_mes,         // First message / greeting
            char.system_prompt,     // Character's system prompt
            // Check extensions data too (sometimes has extra lore)
            char.data?.extensions?.depth_prompt?.prompt
        ].filter(Boolean);
        
        const excerpts = [];
        
        for (const field of fieldsToCheck) {
            if (typeof field !== 'string') continue;
            const lowerField = field.toLowerCase();
            
            if (!lowerField.includes(lowerName) && !lowerField.includes(firstName)) continue;
            
            // Extract relevant sentences
            const sentences = field.split(/[.!?\n]+/);
            for (const sentence of sentences) {
                const lowerSentence = sentence.toLowerCase();
                if (lowerSentence.includes(lowerName) || lowerSentence.includes(firstName)) {
                    const cleaned = sentence.trim();
                    if (cleaned.length > 10 && cleaned.length < 500) {
                        excerpts.push(cleaned);
                    }
                }
            }
        }
        
        if (excerpts.length === 0) return null;
        
        // Return up to 5 relevant sentences
        return excerpts.slice(0, 5).join('. ');
    } catch (e) {
        console.warn('[Context Gatherer] Character card scan error:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// USER PERSONA SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Check the user's persona for mentions of the contact
 * @param {string} contactName - Name to search for
 * @returns {string|null} Relevant excerpt or null
 */
function scanUserPersona(contactName) {
    try {
        const ctx = getSTContext();
        if (!ctx) return null;
        
        const lowerName = contactName.toLowerCase();
        const firstName = lowerName.split(/\s+/)[0];
        
        // Try various ways ST stores persona data
        const personaSources = [
            ctx.persona,                          // Direct persona text
            ctx.user_avatar_description,          // Avatar description  
            ctx.default_persona,                  // Default persona
        ].filter(Boolean);
        
        // Also check for persona in chat metadata
        if (ctx.chat_metadata?.persona) {
            personaSources.push(ctx.chat_metadata.persona);
        }
        
        for (const source of personaSources) {
            if (typeof source !== 'string') continue;
            const lowerSource = source.toLowerCase();
            
            if (!lowerSource.includes(lowerName) && !lowerSource.includes(firstName)) continue;
            
            // Extract relevant sentences
            const sentences = source.split(/[.!?\n]+/);
            const relevant = sentences
                .filter(s => {
                    const l = s.toLowerCase();
                    return l.includes(lowerName) || l.includes(firstName);
                })
                .map(s => s.trim())
                .filter(s => s.length > 10 && s.length < 500);
            
            if (relevant.length > 0) {
                return relevant.slice(0, 3).join('. ');
            }
        }
        
        return null;
    } catch (e) {
        console.warn('[Context Gatherer] Persona scan error:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// WORLD INFO / LOREBOOK SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Check world info / lorebook entries for mentions of the contact
 * 
 * DEFENSIVE: Logs which WI sources are being read for debugging.
 * If you see entries from a lorebook that shouldn't be active,
 * that means ST's world info hasn't finished updating after a chat switch.
 * 
 * @param {string} contactName - Name to search for
 * @returns {string|null} Relevant world info content or null
 */
function scanWorldInfo(contactName) {
    try {
        const ctx = getSTContext();
        if (!ctx) return null;
        
        const lowerName = contactName.toLowerCase();
        const firstName = lowerName.split(/\s+/)[0];
        
        // SillyTavern stores world info in various places
        const worldInfoSources = [];
        let sourceLabels = []; // For debugging which sources we're reading
        
        // Method 1: Direct world info from context
        if (ctx.worldInfo) {
            if (Array.isArray(ctx.worldInfo)) {
                worldInfoSources.push(...ctx.worldInfo);
                sourceLabels.push(`ctx.worldInfo (${ctx.worldInfo.length} entries)`);
            } else if (typeof ctx.worldInfo === 'object') {
                const entries = Object.values(ctx.worldInfo);
                worldInfoSources.push(...entries);
                sourceLabels.push(`ctx.worldInfo object (${entries.length} entries)`);
            }
        }
        
        // Method 2: Chat-attached world info
        if (ctx.chat_metadata?.world_info) {
            const chatWI = ctx.chat_metadata.world_info;
            if (Array.isArray(chatWI)) {
                worldInfoSources.push(...chatWI);
                sourceLabels.push(`chat_metadata.world_info (${chatWI.length} entries)`);
            } else if (typeof chatWI === 'object') {
                const entries = Object.values(chatWI);
                worldInfoSources.push(...entries);
                sourceLabels.push(`chat_metadata.world_info object (${entries.length} entries)`);
            }
        }
        
        // Method 3: Try global world info book
        // NOTE: This is the most dangerous source for cross-chat contamination.
        // If called during a chat transition, getWorldInfoData() may return the
        // previous chat's lorebook before ST finishes loading the new one.
        try {
            if (typeof getWorldInfoData === 'function') {
                const wiData = getWorldInfoData();
                if (wiData?.entries) {
                    const entries = Object.values(wiData.entries);
                    worldInfoSources.push(...entries);
                    sourceLabels.push(`getWorldInfoData() (${entries.length} entries, book: ${wiData.name || 'unnamed'})`);
                }
            }
        } catch (e) {
            // Not available, that's fine
        }
        
        if (sourceLabels.length > 0) {
            console.log(`[Context Gatherer] World info sources for "${contactName}":`, sourceLabels.join(', '));
        }
        
        const relevantEntries = [];
        
        for (const entry of worldInfoSources) {
            if (!entry) continue;
            
            // Check if entry's keys/triggers match the contact name
            const keys = [
                ...(Array.isArray(entry.key) ? entry.key : [entry.key]),
                ...(Array.isArray(entry.keysecondary) ? entry.keysecondary : [entry.keysecondary]),
                entry.comment,
                entry.uid
            ].filter(Boolean).map(k => String(k).toLowerCase());
            
            const content = entry.content || entry.text || '';
            const lowerContent = content.toLowerCase();
            
            // Match if keys contain the name OR content mentions the name
            const keyMatch = keys.some(k => 
                k.includes(lowerName) || k.includes(firstName) ||
                lowerName.includes(k)
            );
            
            const contentMatch = lowerContent.includes(lowerName) || lowerContent.includes(firstName);
            
            if (keyMatch || contentMatch) {
                const cleaned = content
                    .replace(/<[^>]+>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                    
                if (cleaned.length > 10 && cleaned.length < 1000) {
                    relevantEntries.push(cleaned);
                }
            }
        }
        
        if (relevantEntries.length === 0) return null;
        
        // Return up to 3 entries, truncated
        return relevantEntries
            .slice(0, 3)
            .map(e => e.length > 300 ? e.substring(0, 300) + '...' : e)
            .join('\n\n');
    } catch (e) {
        console.warn('[Context Gatherer] World info scan error:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// RAW INTEL GATHERING (combines all sources)
// ═══════════════════════════════════════════════════════════════

/**
 * Gather raw intel from all available sources
 * 
 * FIXED: Captures chat fingerprint at start and verifies it hasn't changed
 * after gathering. If the chat switched during gathering, the results
 * are flagged as potentially contaminated.
 * 
 * @param {string} contactName - Contact name to search for
 * @param {object} contact - Full contact object (for existing data)
 * @returns {object} { chatSnippets, characterCard, persona, worldInfo, existingData, _stale }
 */
export function gatherRawIntel(contactName, contact = {}) {
    console.log(`[Context Gatherer] Gathering intel for: ${contactName}`);
    
    // Capture chat identity at start
    const startFingerprint = getChatFingerprint();
    
    const intel = {
        chatSnippets: [],
        characterCard: null,
        persona: null,
        worldInfo: null,
        existingData: {
            context: contact.context || null,
            relationship: contact.relationship || null,
            notes: contact.notes || null,
            detectedTraits: contact.detectedTraits || []
        },
        _stale: false // Flag for contamination detection
    };
    
    // 1. Scan chat history
    try {
        intel.chatSnippets = scanChatHistory(contactName);
        console.log(`[Context Gatherer] Chat: ${intel.chatSnippets.length} snippets found`);
    } catch (e) {
        console.warn('[Context Gatherer] Chat scan failed:', e.message);
    }
    
    // 2. Scan character card
    try {
        intel.characterCard = scanCharacterCard(contactName);
        if (intel.characterCard) {
            console.log(`[Context Gatherer] Character card: found references`);
        }
    } catch (e) {
        console.warn('[Context Gatherer] Card scan failed:', e.message);
    }
    
    // 3. Scan user persona
    try {
        intel.persona = scanUserPersona(contactName);
        if (intel.persona) {
            console.log(`[Context Gatherer] Persona: found references`);
        }
    } catch (e) {
        console.warn('[Context Gatherer] Persona scan failed:', e.message);
    }
    
    // 4. Scan world info
    try {
        intel.worldInfo = scanWorldInfo(contactName);
        if (intel.worldInfo) {
            console.log(`[Context Gatherer] World info: found entries`);
        }
    } catch (e) {
        console.warn('[Context Gatherer] World info scan failed:', e.message);
    }
    
    // Verify chat hasn't changed during gathering
    const endFingerprint = getChatFingerprint();
    if (startFingerprint && endFingerprint && startFingerprint !== endFingerprint) {
        console.warn(`[Context Gatherer] ⚠️ CHAT CHANGED during intel gathering!`);
        console.warn(`  Start: ${startFingerprint}`);
        console.warn(`  End:   ${endFingerprint}`);
        console.warn(`  Results may contain data from the wrong chat.`);
        intel._stale = true;
    }
    
    return intel;
}

// ═══════════════════════════════════════════════════════════════
// AI SUMMARIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Build a compact text representation of gathered intel for the AI
 * @param {string} contactName
 * @param {object} rawIntel - From gatherRawIntel()
 * @returns {string} Formatted text for AI consumption
 */
function formatIntelForAI(contactName, rawIntel) {
    const parts = [];
    
    // Existing user-provided data
    const existing = rawIntel.existingData;
    if (existing.context) parts.push(`USER-PROVIDED CONTEXT: ${existing.context}`);
    if (existing.relationship) parts.push(`USER-PROVIDED RELATIONSHIP: ${existing.relationship}`);
    if (existing.notes) parts.push(`USER-PROVIDED NOTES: ${existing.notes}`);
    if (existing.detectedTraits?.length > 0) {
        parts.push(`DETECTED TRAITS: ${existing.detectedTraits.join(', ')}`);
    }
    
    // Character card info
    if (rawIntel.characterCard) {
        parts.push(`FROM CHARACTER CARD:\n${rawIntel.characterCard}`);
    }
    
    // Persona info
    if (rawIntel.persona) {
        parts.push(`FROM PROTAGONIST'S PERSONA:\n${rawIntel.persona}`);
    }
    
    // World info
    if (rawIntel.worldInfo) {
        parts.push(`FROM WORLD LORE:\n${rawIntel.worldInfo}`);
    }
    
    // Chat snippets (most recent first, limit total length)
    if (rawIntel.chatSnippets?.length > 0) {
        const chatParts = rawIntel.chatSnippets
            .slice(0, 10)
            .map(s => `[${s.role}]: ${s.snippet}`)
            .join('\n');
        parts.push(`FROM CHAT HISTORY (${rawIntel.chatSnippets.length} mentions found):\n${chatParts}`);
    }
    
    if (parts.length === 0) {
        return 'NO DATA AVAILABLE — This contact has no context from any source.';
    }
    
    return parts.join('\n\n---\n\n');
}

/**
 * Use AI to summarize gathered intel into structured contact data
 * @param {string} contactName - Contact name
 * @param {object} rawIntel - From gatherRawIntel()
 * @returns {Promise<object>} { summary, relationship, keyFacts[], traits[] }
 */
export async function summarizeIntel(contactName, rawIntel) {
    const formattedIntel = formatIntelForAI(contactName, rawIntel);
    
    // If there's basically no data, skip the API call
    if (formattedIntel.includes('NO DATA AVAILABLE')) {
        return {
            summary: 'No information available from any source.',
            relationship: 'Unknown',
            keyFacts: [],
            traits: rawIntel.existingData.detectedTraits || [],
            sources: []
        };
    }
    
    // Get profile-driven tone
    const thoughtTone = getProfileValue('thoughtToneGuide',
        'Match the tone to the story.');
    
    const systemPrompt = `You are an intelligence analyst compiling a brief on a person of interest. Summarize the available data into a concise, actionable profile.

## TONE
${thoughtTone}

## OUTPUT FORMAT
Respond with EXACTLY these fields, one per line:
SUMMARY: [2-3 sentence overview of who this person is and their significance]
RELATIONSHIP: [One phrase describing their relationship to the protagonist — e.g. "ex-lover", "bandmate", "suspicious stranger", "trusted ally"]
KEY_FACTS: [Comma-separated list of concrete facts — e.g. "guitarist for Consort of Sin, met at the bar, has a scar on left hand"]
TRAITS: [Comma-separated personality traits — e.g. "guarded, charming, unpredictable"]

## RULES
- Only state things supported by the data. Don't invent.
- If data is sparse, say so. "Insufficient data" is valid.
- Focus on what matters for the PROTAGONIST's relationship with this person.
- Keep it brief. This is a field report, not a novel.`;

    const userPrompt = `Compile a brief on: ${contactName}

AVAILABLE INTELLIGENCE:
${formattedIntel}

Remember: SUMMARY, RELATIONSHIP, KEY_FACTS, TRAITS — one field per line.`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parseIntelResponse(response, rawIntel);
    } catch (e) {
        console.error('[Context Gatherer] AI summarization failed:', e.message);
        // Return what we can from raw data alone
        return {
            summary: rawIntel.existingData.context || 'AI summarization failed — raw data available.',
            relationship: rawIntel.existingData.relationship || 'Unknown',
            keyFacts: [],
            traits: rawIntel.existingData.detectedTraits || [],
            sources: getSources(rawIntel)
        };
    }
}

/**
 * Parse AI summarization response into structured data
 */
function parseIntelResponse(response, rawIntel) {
    const result = {
        summary: '',
        relationship: '',
        keyFacts: [],
        traits: [],
        sources: getSources(rawIntel)
    };
    
    if (!response || typeof response !== 'string') return result;
    
    const lines = response.split('\n').map(l => l.trim()).filter(Boolean);
    
    for (const line of lines) {
        const summaryMatch = line.match(/^SUMMARY:\s*(.+)$/i);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim();
            continue;
        }
        
        const relMatch = line.match(/^RELATIONSHIP:\s*(.+)$/i);
        if (relMatch) {
            result.relationship = relMatch[1].trim();
            continue;
        }
        
        const factsMatch = line.match(/^KEY_FACTS:\s*(.+)$/i);
        if (factsMatch) {
            result.keyFacts = factsMatch[1]
                .split(',')
                .map(f => f.trim())
                .filter(f => f.length > 2);
            continue;
        }
        
        const traitsMatch = line.match(/^TRAITS:\s*(.+)$/i);
        if (traitsMatch) {
            result.traits = traitsMatch[1]
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 2);
            continue;
        }
    }
    
    // Fallback: if parsing failed, use the whole response as summary
    if (!result.summary && response.length > 20) {
        result.summary = response.substring(0, 300);
    }
    
    // Merge detected traits from existing data
    const existingTraits = rawIntel.existingData?.detectedTraits || [];
    if (existingTraits.length > 0) {
        const allTraits = new Set([...result.traits, ...existingTraits]);
        result.traits = Array.from(allTraits);
    }
    
    return result;
}

/**
 * Get source labels for what data was found
 */
function getSources(rawIntel) {
    const sources = [];
    if (rawIntel.chatSnippets?.length > 0) sources.push(`chat (${rawIntel.chatSnippets.length} mentions)`);
    if (rawIntel.characterCard) sources.push('character card');
    if (rawIntel.persona) sources.push('persona');
    if (rawIntel.worldInfo) sources.push('world info');
    if (rawIntel.existingData?.context) sources.push('user-provided');
    return sources;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

/**
 * Gather context from all sources and summarize with AI
 * Call this before generating a dossier.
 * 
 * FIXED: Checks for stale data flag and warns caller
 * 
 * @param {object} contact - Contact object with at least { name }
 * @param {boolean} useAI - Whether to use AI summarization (default true)
 * @returns {Promise<object>} Structured intel { summary, relationship, keyFacts, traits, sources, raw }
 */
export async function gatherAndSummarizeIntel(contact, useAI = true) {
    if (!contact?.name) {
        console.warn('[Context Gatherer] No contact name provided');
        return null;
    }
    
    console.log(`[Context Gatherer] === Gathering intel for: ${contact.name} ===`);
    
    // Step 1: Gather raw intel from all sources
    const rawIntel = gatherRawIntel(contact.name, contact);
    
    // Warn if data may be contaminated from a chat switch
    if (rawIntel._stale) {
        console.warn(`[Context Gatherer] ⚠️ Intel for ${contact.name} may contain cross-chat data!`);
        // Continue anyway — stale data is better than no data, and the user
        // can always regenerate the dossier after the switch completes
    }
    
    // Check if we have anything to work with
    const hasData = rawIntel.chatSnippets.length > 0 ||
                    rawIntel.characterCard ||
                    rawIntel.persona ||
                    rawIntel.worldInfo ||
                    rawIntel.existingData.context ||
                    rawIntel.existingData.relationship;
    
    if (!hasData) {
        console.log(`[Context Gatherer] No data found for ${contact.name} from any source`);
        return {
            summary: null,
            relationship: contact.relationship || null,
            keyFacts: [],
            traits: contact.detectedTraits || [],
            sources: [],
            raw: rawIntel
        };
    }
    
    // Step 2: AI summarization (if enabled and we have enough data)
    if (useAI) {
        try {
            const intel = await summarizeIntel(contact.name, rawIntel);
            intel.raw = rawIntel;
            intel.gatheredAt = Date.now();
            
            console.log(`[Context Gatherer] Intel gathered:`, {
                sources: intel.sources,
                summaryLength: intel.summary?.length || 0,
                keyFacts: intel.keyFacts?.length || 0,
                traits: intel.traits?.length || 0
            });
            
            return intel;
        } catch (e) {
            console.error('[Context Gatherer] AI summarization failed:', e.message);
            // Fall through to non-AI path
        }
    }
    
    // Non-AI path: just compile what we have
    const parts = [];
    if (rawIntel.existingData.context) parts.push(rawIntel.existingData.context);
    if (rawIntel.existingData.relationship) parts.push(`Relationship: ${rawIntel.existingData.relationship}`);
    if (rawIntel.characterCard) parts.push(rawIntel.characterCard);
    if (rawIntel.persona) parts.push(rawIntel.persona);
    if (rawIntel.chatSnippets.length > 0) {
        parts.push(rawIntel.chatSnippets.slice(0, 3).map(s => s.snippet).join(' '));
    }
    
    return {
        summary: parts.join('. ').substring(0, 500),
        relationship: rawIntel.existingData.relationship || null,
        keyFacts: [],
        traits: rawIntel.existingData.detectedTraits || [],
        sources: getSources(rawIntel),
        raw: rawIntel,
        gatheredAt: Date.now()
    };
}
