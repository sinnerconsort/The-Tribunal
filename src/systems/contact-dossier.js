/**
 * The Tribunal - Contact Dossier System
 * Generates voice-written dossiers for NPCs
 * 
 * v1.4.0 - Genre-aware dossier generation
 *   - Dossier prompt includes genre frame from promptFrames.contactDossier
 *   - Default voices pulled from genre profile instead of hardcoded DE trio
 *   - Type labels themed via contact-genre-rewriter.js (UI layer)
 *   - Fallback consensus text themed per genre
 * 
 * v1.3.0 - Context-aware dossier generation
 *   - Integrates context-gatherer.js for deep intel scanning
 *   - Scans chat history, character card, persona, world info
 *   - AI summarizes gathered intel before dossier generation
 *   - Merges AI-discovered traits with existing detectedTraits
 *   - Dossier includes intelSources and keyFacts metadata
 * 
 * v1.2.0 - FIXED: Replaced broken lazy dynamic imports with static imports
 *   - callAPI imported directly from ../voice/api-helpers.js
 *   - SKILLS imported directly from ../data/skills.js
 *   - getSkillPersonality + getProfileValue from ../data/setting-profiles.js
 *   - Profile-aware dossier generation (genre-correct voice personalities)
 *   - Reframed as "protagonist's perception" not neutral character sheet
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Voice-authored NPC descriptions with strongest opinion quips            ║
 * ║  Regenerates on creation and when disposition shifts                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

import { callAPI } from '../voice/api-helpers.js';
import { SKILLS } from '../data/skills.js';
import { getSkillPersonality, getProfileValue } from '../data/setting-profiles.js';
import { getSettings } from '../core/state.js';
import { getGenreDossierFrame, getGenreDefaultDossierVoices, getGenreFallbackConsensus } from '../voice/contact-genre-rewriter.js';

// Lazy import — context-gatherer is optional, dossiers work without it
let _gatherAndSummarizeIntel = null;
let _gathererLoaded = false;
async function getGatherer() {
    if (_gathererLoaded) return _gatherAndSummarizeIntel;
    try {
        const mod = await import('./context-gatherer.js');
        _gatherAndSummarizeIntel = mod.gatherAndSummarizeIntel;
        console.log('[Tribunal] Context gatherer loaded');
    } catch (e) {
        console.log('[Tribunal] Context gatherer not available — dossiers will use basic context');
        _gatherAndSummarizeIntel = null;
    }
    _gathererLoaded = true;
    return _gatherAndSummarizeIntel;
}

let _generatingFor = new Set(); // Prevent duplicate generation

// ═══════════════════════════════════════════════════════════════
// VOICE SELECTION FOR QUIPS
// ═══════════════════════════════════════════════════════════════

/**
 * Select 3 voices for dossier quips:
 * 1. Strongest positive opinion
 * 2. Strongest negative opinion
 * 3. Runner-up (next strongest from either side)
 * 
 * @param {object} voiceOpinions - { voiceId: { score, ... } }
 * @returns {Array} [{ voiceId, score, stance }] - max 3 voices
 */
export function selectQuipVoices(voiceOpinions) {
    if (!voiceOpinions || Object.keys(voiceOpinions).length === 0) {
        return [];
    }
    
    // Sort into positive and negative
    const positive = [];
    const negative = [];
    
    for (const [voiceId, data] of Object.entries(voiceOpinions)) {
        const score = data.score || 0;
        if (score > 0) {
            positive.push({ voiceId, score, stance: 'positive' });
        } else if (score < 0) {
            negative.push({ voiceId, score, stance: 'negative' });
        }
    }
    
    // Sort by absolute score (strongest first)
    positive.sort((a, b) => b.score - a.score);
    negative.sort((a, b) => a.score - b.score); // Most negative first
    
    const selected = [];
    
    // 1. Strongest positive (if any)
    if (positive.length > 0) {
        selected.push(positive[0]);
    }
    
    // 2. Strongest negative (if any)
    if (negative.length > 0) {
        selected.push(negative[0]);
    }
    
    // 3. Runner-up from either side
    if (selected.length < 3) {
        // Try second positive
        if (positive.length > 1) {
            selected.push(positive[1]);
        } 
        // Or second negative
        else if (negative.length > 1) {
            selected.push(negative[1]);
        }
        // Or first from whichever side we didn't get
        else if (positive.length > 0 && selected.filter(s => s.stance === 'positive').length === 0) {
            selected.push(positive[0]);
        }
        else if (negative.length > 0 && selected.filter(s => s.stance === 'negative').length === 0) {
            selected.push(negative[0]);
        }
    }
    
    return selected.slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════
// POV HANDLING
// ═══════════════════════════════════════════════════════════════

/**
 * Get POV instruction for dossier prompt based on settings
 * Ensures voices address the protagonist correctly (you/they/I)
 */
function getPOVInstruction() {
    const settings = getSettings();
    const pov = settings?.povStyle || settings?.persona?.povStyle || 'second';
    const charName = settings?.characterName || settings?.persona?.characterName || '';
    const pronouns = settings?.characterPronouns || settings?.persona?.pronouns || 'they';
    
    if (pov === 'second') {
        return `- PERSPECTIVE: Address the protagonist as "you" — NEVER use their name. The voices speak directly TO the protagonist, not about them. Example: "He dropped his instrument to reach you" not "to reach ${charName || 'the protagonist'}".`;
    } else if (pov === 'first') {
        return `- PERSPECTIVE: The protagonist refers to themselves as "I/me/my". Write as the protagonist's own internal monologue.`;
    } else {
        // third person
        const name = charName || 'the protagonist';
        return `- PERSPECTIVE: Refer to the protagonist as "${name}" (${pronouns}). Third person perspective.`;
    }
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Build the prompt for dossier generation
 * 
 * v1.2.0: Static imports — uses getSkillPersonality() and getProfileValue() directly
 * 
 * @param {object} contact - Contact data
 * @param {Array} quipVoices - Selected voices for quips
 * @returns {object} { system, user }
 */
function buildDossierPrompt(contact, quipVoices) {
    const voicePersonalities = quipVoices.map(v => {
        const skill = SKILLS?.[v.voiceId];
        return {
            id: v.voiceId,
            name: skill?.signature || skill?.name || v.voiceId.toUpperCase(),
            stance: v.stance,
            score: v.score,
            personality: getSkillPersonality(v.voiceId)
        };
    });

    // Pull profile-driven flavor
    const systemIntro = getProfileValue('systemIntro', 
        'You generate internal mental voices for a roleplayer.');
    const thoughtTone = getProfileValue('thoughtToneGuide',
        'Match the tone to the story.');
    const dossierFrame = getGenreDossierFrame();
    
    const system = `${systemIntro}

You are generating a dossier entry about an NPC as seen through the PROTAGONIST's eyes. This is how the protagonist's internal voices perceive and evaluate this person.

## TONE
${thoughtTone}
${dossierFrame ? `\n## GENRE STYLE\n${dossierFrame}\n` : ''}

## FORMAT
The dossier has two parts:
1. A CONSENSUS DESCRIPTION (2-3 sentences) — A general assessment written as if by the protagonist's internal chorus of voices. How does the protagonist read this person? What's their gut feeling? Be specific to the context provided, not generic.
2. VOICE QUIPS (one per voice) — Short, punchy observations from specific internal voices. Each should reflect that voice's unique perspective and personality.

## VOICE PERSONALITIES:
${voicePersonalities.map(v => `${v.name} (${v.stance}, score: ${v.score}): ${v.personality.substring(0, 200)}...`).join('\n\n')}

## CRITICAL RULES
- The dossier describes an NPC as perceived by the PROTAGONIST — not a neutral character sheet.
- Voice quips should feel like the protagonist's skills arguing about this person.
- Keep it grounded in what's actually known from context. Don't invent backstory.
- If there's minimal context, say so — "not enough data" is a valid assessment.
${getPOVInstruction()}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
CONSENSUS: [2-3 sentence description from the protagonist's perspective]

${voicePersonalities.map(v => `${v.name}: [One punchy sentence or two short sentences]`).join('\n')}`;

    // Gather all available context about this contact
    // Uses gathered intel if available (from context-gatherer), falls back to raw fields
    const contextParts = [];
    
    if (contact._gatheredIntel) {
        // Rich intel from context-gatherer
        const intel = contact._gatheredIntel;
        if (intel.summary) contextParts.push(`INTELLIGENCE SUMMARY: ${intel.summary}`);
        if (intel.relationship) contextParts.push(`ASSESSED RELATIONSHIP: ${intel.relationship}`);
        if (intel.keyFacts?.length > 0) contextParts.push(`KEY FACTS: ${intel.keyFacts.join('; ')}`);
        if (intel.sources?.length > 0) contextParts.push(`(Sources: ${intel.sources.join(', ')})`);
        
        // Also include raw chat snippets for grounding (up to 5)
        if (intel.raw?.chatSnippets?.length > 0) {
            const snippetText = intel.raw.chatSnippets
                .slice(0, 5)
                .map(s => `[${s.role}]: ${s.snippet}`)
                .join('\n');
            contextParts.push(`RELEVANT DIALOGUE:\n${snippetText}`);
        }
        
        // Character card context
        if (intel.raw?.characterCard) {
            contextParts.push(`FROM CHARACTER LORE: ${intel.raw.characterCard}`);
        }
    } else {
        // Fallback to raw contact fields
        if (contact.context) contextParts.push(contact.context);
        if (contact.relationship) contextParts.push(`Relationship: ${contact.relationship}`);
        if (contact.notes) contextParts.push(`Notes: ${contact.notes}`);
        if (contact.intel?.length > 0) contextParts.push(...contact.intel.slice(0, 3));
    }
    
    const contextString = contextParts.length > 0 
        ? contextParts.join('\n')
        : 'No context available — the protagonist has barely interacted with this person.';

    const user = `Generate a dossier entry for this person as seen by the PROTAGONIST:

NAME: ${contact.name}
DISPOSITION: ${contact.disposition || 'Neutral'}
KNOWN CONTEXT: ${contextString}
DETECTED TRAITS: ${(contact.detectedTraits || []).join(', ') || 'None identified yet'}

Remember: Consensus first (from the protagonist's perspective), then one quip per voice (${voicePersonalities.map(v => v.name).join(', ')}).${(getSettings()?.povStyle || getSettings()?.persona?.povStyle) === 'second' ? ' Use "you" for the protagonist — never their name.' : ''}`;

    return { system, user };
}

/**
 * Parse dossier response into structured data
 * @param {string} response - Raw API response
 * @param {Array} quipVoices - Expected voices
 * @returns {object} { consensus, quips: [{ voiceId, name, content }] }
 */
function parseDossierResponse(response, quipVoices) {
    const result = {
        consensus: '',
        quips: []
    };
    
    if (!response) return result;
    
    const lines = response.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
        // Check for consensus
        const consensusMatch = line.match(/^CONSENSUS:\s*(.+)$/i);
        if (consensusMatch) {
            result.consensus = consensusMatch[1].trim();
            continue;
        }
        
        // Check for voice quips
        for (const voice of quipVoices) {
            const skill = SKILLS?.[voice.voiceId];
            const name = skill?.signature || skill?.name || voice.voiceId.toUpperCase();
            
            // Match "VOICE_NAME: content" or "VOICE_NAME — content"
            const pattern = new RegExp(`^${name}\\s*[:\\-—–]\\s*(.+)$`, 'i');
            const match = line.match(pattern);
            
            if (match) {
                result.quips.push({
                    voiceId: voice.voiceId,
                    name: name,
                    content: match[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
                    stance: voice.stance,
                    score: voice.score
                });
                break;
            }
        }
    }
    
    // If consensus spans multiple lines or wasn't properly formatted
    if (!result.consensus && lines.length > 0) {
        // Try to find any line that looks like a description
        for (const line of lines) {
            if (!line.includes(':') || line.toLowerCase().startsWith('consensus')) {
                const cleaned = line.replace(/^consensus:?\s*/i, '').trim();
                if (cleaned.length > 20) {
                    result.consensus = cleaned;
                    break;
                }
            }
        }
    }
    
    return result;
}

/**
 * Generate a dossier for a contact
 * @param {object} contact - Contact data with voiceOpinions
 * @param {string} contactId - Contact ID for saving
 * @returns {Promise<object>} Generated dossier
 */
export async function generateDossier(contact, contactId) {
    // Prevent duplicate/concurrent generation
    if (_generatingFor.has(contactId)) {
        console.log('[Dossier] Already generating for:', contact.name);
        return null;
    }
    
    _generatingFor.add(contactId);
    console.log('[Dossier] Generating for:', contact.name);
    
    try {
        // ═══════════════════════════════════════════════════════
        // Step 1: Gather intel from all available sources
        // Chat history, character card, persona, world info + AI summary
        // ═══════════════════════════════════════════════════════
        let gatheredIntel = null;
        try {
            const gatherFn = await getGatherer();
            if (gatherFn) {
                gatheredIntel = await gatherFn(contact, true);
                if (gatheredIntel) {
                    console.log('[Dossier] Intel gathered from:', gatheredIntel.sources?.join(', ') || 'none');
                    // Attach to contact temporarily for prompt building
                    contact._gatheredIntel = gatheredIntel;
                    
                    // Merge any AI-discovered traits
                    if (gatheredIntel.traits?.length > 0) {
                        const existing = new Set(contact.detectedTraits || []);
                        gatheredIntel.traits.forEach(t => existing.add(t));
                        contact.detectedTraits = Array.from(existing);
                    }
                }
            }
        } catch (e) {
            console.warn('[Dossier] Intel gathering failed (non-fatal):', e.message);
            // Continue without gathered intel — prompt will use raw fields
        }
        
        // ═══════════════════════════════════════════════════════
        // Step 2: Select voices for quips
        // ═══════════════════════════════════════════════════════
        const quipVoices = selectQuipVoices(contact.voiceOpinions);
        
        if (quipVoices.length === 0) {
            console.log('[Dossier] No voice opinions yet, using genre default voices');
            // Use genre-appropriate defaults instead of hardcoded DE trio
            quipVoices.push(...getGenreDefaultDossierVoices());
        }
        
        // Build and send prompt (uses static imports for skills + profiles)
        const prompt = buildDossierPrompt(contact, quipVoices);
        const response = await callAPI(prompt.system, prompt.user);
        
        // Parse response
        const dossier = parseDossierResponse(response, quipVoices);
        
        // If consensus came back empty, use genre-themed fallback
        if (!dossier.consensus) {
            dossier.consensus = getGenreFallbackConsensus(contact.name, contact.disposition);
        }
        
        dossier.generatedAt = Date.now();
        dossier.triggerDisposition = contact.disposition;
        
        // Attach intel metadata for display
        if (gatheredIntel) {
            dossier.intelSources = gatheredIntel.sources || [];
            dossier.keyFacts = gatheredIntel.keyFacts || [];
        }
        
        // Clean up temporary property
        delete contact._gatheredIntel;
        
        console.log('[Dossier] Generated:', dossier);
        return dossier;
        
    } catch (error) {
        console.error('[Dossier] Generation failed:', error);
        // Re-throw so the caller can show the actual error message
        throw error;
    } finally {
        // Always clear the lock and cleanup
        _generatingFor.delete(contactId);
        delete contact._gatheredIntel;
    }
}

/**
 * Check if dossier should regenerate based on disposition change
 * @param {object} contact - Current contact data
 * @returns {boolean}
 */
export function shouldRegenerateDossier(contact) {
    if (!contact.dossier) return true; // No dossier yet
    
    // Regenerate if disposition changed
    if (contact.dossier.triggerDisposition !== contact.disposition) {
        console.log('[Dossier] Disposition changed, should regenerate');
        return true;
    }
    
    // Could add time-based regeneration here too
    // const age = Date.now() - (contact.dossier.generatedAt || 0);
    // if (age > 24 * 60 * 60 * 1000) return true; // Older than 24h
    
    return false;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    selectQuipVoices,
    generateDossier,
    shouldRegenerateDossier
};
