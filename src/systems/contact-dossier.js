/**
 * The Tribunal - Contact Dossier System
 * Generates voice-written dossiers for NPCs
 * 
 * v1.1.0 - Profile-aware dossier generation:
 *   - Pulls systemIntro + thoughtToneGuide from active setting profile
 *   - Uses getSkillPersonality() for genre-correct voice personalities
 *   - Reframed as "protagonist's perception" not neutral character sheet
 *   - Added "not enough data" guidance for low-context contacts
 *   - Lazy import for setting-profiles.js with graceful fallback
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Voice-authored NPC descriptions with strongest opinion quips            ║
 * ║  Regenerates on creation and when disposition shifts                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS
// ═══════════════════════════════════════════════════════════════

let _api = null;
let _skills = null;
let _profiles = null;
let _generatingFor = new Set(); // Prevent duplicate generation

async function getAPI() {
    if (!_api) {
        try {
            // Try multiple possible paths
            try {
                _api = await import('./api-helpers.js');
            } catch {
                try {
                    _api = await import('../voice/api-helpers.js');
                } catch {
                    _api = await import('../systems/api-helpers.js');
                }
            }
            console.log('[Dossier] API helpers loaded');
        } catch (e) {
            console.warn('[Dossier] API helpers not available:', e.message);
        }
    }
    return _api;
}

async function getSkills() {
    if (!_skills) {
        try {
            _skills = await import('../data/skills.js');
        } catch (e) {
            console.warn('[Dossier] Skills data not available:', e.message);
        }
    }
    return _skills;
}

async function getProfiles() {
    if (!_profiles) {
        try {
            _profiles = await import('../data/setting-profiles.js');
        } catch (e) {
            console.warn('[Dossier] Setting profiles not available:', e.message);
        }
    }
    return _profiles;
}

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
// DOSSIER GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Build the prompt for dossier generation
 * 
 * v1.1.0: Now profile-aware — pulls tone/style from active setting profile
 *         Uses getSkillPersonality() instead of raw skill.personality
 * 
 * @param {object} contact - Contact data
 * @param {Array} quipVoices - Selected voices for quips
 * @param {object} skills - Skills data for voice names/signatures
 * @param {object} profiles - Setting profiles module (optional)
 * @returns {object} { system, user }
 */
function buildDossierPrompt(contact, quipVoices, skills, profiles) {
    // Get voice personalities — prefer profile-aware version, fall back to raw
    const getPersonality = (voiceId) => {
        if (profiles?.getSkillPersonality) {
            return profiles.getSkillPersonality(voiceId);
        }
        const skill = skills?.SKILLS?.[voiceId];
        return skill?.personality || '';
    };

    const voicePersonalities = quipVoices.map(v => {
        const skill = skills?.SKILLS?.[v.voiceId];
        return {
            id: v.voiceId,
            name: skill?.signature || skill?.name || v.voiceId.toUpperCase(),
            stance: v.stance,
            score: v.score,
            personality: getPersonality(v.voiceId)
        };
    });

    // Pull profile-driven flavor
    const systemIntro = profiles?.getProfileValue?.('systemIntro', 
        'You generate internal mental voices for a roleplayer.') 
        || 'You generate internal mental voices for a roleplayer.';
    const thoughtTone = profiles?.getProfileValue?.('thoughtToneGuide',
        'Match the tone to the story.')
        || 'Match the tone to the story.';
    
    const system = `${systemIntro}

You are generating a dossier entry about an NPC as seen through the PROTAGONIST's eyes. This is how the protagonist's internal voices perceive and evaluate this person.

## TONE
${thoughtTone}

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

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
CONSENSUS: [2-3 sentence description from the protagonist's perspective]

${voicePersonalities.map(v => `${v.name}: [One punchy sentence or two short sentences]`).join('\n')}`;

    const user = `Generate a dossier entry for this person as seen by the PROTAGONIST:

NAME: ${contact.name}
RELATIONSHIP: ${contact.relationship || 'Unknown'}
DISPOSITION: ${contact.disposition || 'Neutral'}
DETECTED TRAITS: ${(contact.detectedTraits || []).join(', ') || 'None identified yet'}
CONTEXT: ${(contact.contexts || []).slice(0, 2).join(' ') || 'No context available — the protagonist has barely interacted with this person.'}

Remember: Consensus first (from the protagonist's perspective), then one quip per voice (${voicePersonalities.map(v => v.name).join(', ')}).`;

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
            const skill = _skills?.SKILLS?.[voice.voiceId];
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
        const api = await getAPI();
        const skills = await getSkills();
        const profiles = await getProfiles();
        
        if (!api?.callAPI) {
            console.warn('[Dossier] API not available - check import paths');
            return null;
        }
        
        // Select voices for quips
        const quipVoices = selectQuipVoices(contact.voiceOpinions);
        
        if (quipVoices.length === 0) {
            console.log('[Dossier] No voice opinions yet, using default voices');
            // Generate with default voices if no opinions yet
            quipVoices.push(
                { voiceId: 'logic', score: 0, stance: 'neutral' },
                { voiceId: 'inland_empire', score: 0, stance: 'neutral' },
                { voiceId: 'half_light', score: 0, stance: 'neutral' }
            );
        }
        
        _skills = skills; // Cache for parser
        
        // Build and send prompt
        const prompt = buildDossierPrompt(contact, quipVoices, skills, profiles);
        const response = await api.callAPI(prompt.system, prompt.user);
        
        // Parse response
        const dossier = parseDossierResponse(response, quipVoices);
        dossier.generatedAt = Date.now();
        dossier.triggerDisposition = contact.disposition;
        
        console.log('[Dossier] Generated:', dossier);
        return dossier;
        
    } catch (error) {
        console.error('[Dossier] Generation failed:', error);
        return null;
    } finally {
        // Always clear the lock
        _generatingFor.delete(contactId);
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
