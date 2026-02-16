/**
 * The Tribunal - Case Description Generator
 * Theme-matched skill voices write case descriptions.
 * 
 * A mystery case gets described by LOGIC — clinical, deductive.
 * A love case gets described by EMPATHY — aching, personal.
 * A violence case gets described by HALF LIGHT — urgent, paranoid.
 * 
 * The skill voice "files" the case — it's not neutral, it has opinions,
 * it has a perspective, it URGES you to pay attention.
 * 
 * @version 1.0.0 - Initial build
 *   - THEME_VOICE_MAP: theme → skill ID routing
 *   - buildCaseDescriptionPrompt(): skill-voiced briefing prompts
 *   - generateCaseDescription(): independent API call for descriptions
 *   - getRecentSceneContext(): grabs last few messages for grounding
 *   - Defensive: falls back gracefully if API unavailable
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Each theme gets its own narrator who CARES about the case             ║
 * ║  for different reasons. This is what makes cases earn their place.     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { callAPIWithTokens } from '../voice/api-helpers.js';
import { getSkillPersonality, getSkillName, getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// THEME → SKILL VOICE ROUTING
// Which skill "files" a case for each emotional territory?
// ═══════════════════════════════════════════════════════════════

/**
 * Maps case themes to the skill voice that writes the description.
 * Each entry is [primarySkill, fallbackSkill] — if the primary's
 * personality isn't available, we try the fallback.
 */
const THEME_VOICE_MAP = {
    mystery:      ['logic',              'visual_calculus'],    // Analytical, deductive
    violence:     ['half_light',         'physical_instrument'],// Fight-or-flight, danger
    love:         ['empathy',            'inland_empire'],      // Emotional reading
    death:        ['inland_empire',      'empathy'],            // The dreamer, the beyond
    authority:    ['authority',           'rhetoric'],           // Command, control
    paranoia:     ['esprit_de_corps',    'half_light'],         // Group awareness, betrayal
    money:        ['interfacing',        'suggestion'],         // Systems, deals
    identity:     ['volition',           'inland_empire'],      // Willpower, sense of self
    substance:    ['electrochemistry',   'endurance'],          // The hedonist
    supernatural: ['shivers',            'inland_empire'],      // The uncanny
    failure:      ['composure',          'volition'],           // The mask over the wound
    philosophy:   ['conceptualization',  'encyclopedia'],       // Ideas, meaning-making
};

// Default voice for unthemed cases
const DEFAULT_VOICE = 'encyclopedia';

/**
 * Get the skill ID that should voice a case description.
 * Returns the themed skill, checking that a personality exists for it.
 * 
 * @param {string|null} theme - Case theme ID
 * @returns {string} Skill ID to use for voicing
 */
export function getVoiceForTheme(theme) {
    if (!theme || !THEME_VOICE_MAP[theme]) {
        return DEFAULT_VOICE;
    }
    
    const [primary, fallback] = THEME_VOICE_MAP[theme];
    
    // Check if primary has a personality available
    const primaryPersonality = getSkillPersonality(primary);
    if (primaryPersonality && primaryPersonality.length > 10) {
        return primary;
    }
    
    // Try fallback
    const fallbackPersonality = getSkillPersonality(fallback);
    if (fallbackPersonality && fallbackPersonality.length > 10) {
        return fallback;
    }
    
    return DEFAULT_VOICE;
}


// ═══════════════════════════════════════════════════════════════
// SCENE CONTEXT
// Grab recent chat messages for grounding the description.
// ═══════════════════════════════════════════════════════════════

/**
 * Get the last N messages from chat for scene context.
 * Keeps it light — just enough for the voice to reference what's happening.
 * 
 * @param {number} count - How many messages to grab (default 4)
 * @returns {string} Formatted scene context string
 */
function getRecentSceneContext(count = 4) {
    try {
        const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
            ? SillyTavern.getContext()
            : null;
        
        if (!ctx?.chat?.length) return '';
        
        const recent = ctx.chat.slice(-count);
        const lines = [];
        
        for (const msg of recent) {
            if (!msg.mes || msg.mes.length < 5) continue;
            
            const speaker = msg.is_user ? 'Player' : (msg.name || 'Character');
            // Truncate long messages
            const text = msg.mes.length > 300 ? msg.mes.substring(0, 300) + '...' : msg.mes;
            lines.push(`${speaker}: ${text}`);
        }
        
        return lines.join('\n');
    } catch (e) {
        console.warn('[CaseDesc] Could not get scene context:', e.message);
        return '';
    }
}


// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Urgency/perspective modifiers per theme.
 * These shape HOW the skill voice talks about the case —
 * what it cares about, what angle it takes.
 */
const THEME_URGENCY = {
    mystery:      'You sense the pieces don\'t fit yet. Something is being hidden. Observation is everything.',
    violence:     'Every instinct screams danger. The threat is real, immediate, visceral. ACT or be acted upon.',
    love:         'There\'s something fragile here, something that could break or bloom. You FEEL it.',
    death:        'Something is gone. Or going. The weight of absence presses. This matters more than they think.',
    authority:    'Order must be maintained. Or challenged. Power is shifting — which side are you on?',
    paranoia:     'Trust nothing at face value. There are layers here. Someone is watching. Someone always is.',
    money:        'Resources flow somewhere. Follow the value, follow the exchange. Everything has a price.',
    identity:     'Who you are is in question. Or who THEY are. The mirror is cracked and showing something wrong.',
    substance:    'The body wants. The mind rationalizes. There\'s a pull here that goes deeper than choice.',
    supernatural: 'Reality bends. Something is touching this moment from outside the normal. You felt it.',
    failure:      'Something went wrong. Something IS wrong. The question is whether it can be salvaged.',
    philosophy:   'There\'s a question underneath this. Not practical — existential. It won\'t let go.',
};

/**
 * Build the prompt for case description generation.
 * 
 * The skill voice writes a 2-3 sentence briefing that sounds like
 * THAT skill filing a report about what it noticed.
 * 
 * @param {object} caseObj - The case needing a description
 * @param {string} skillId - The skill ID writing the description
 * @returns {object} { system, user } prompt pair
 */
export function buildCaseDescriptionPrompt(caseObj, skillId) {
    const personality = getSkillPersonality(skillId);
    const skillName = getSkillName(skillId, skillId.toUpperCase());
    const theme = caseObj.theme || null;
    
    // Profile-driven flavor
    const systemIntro = getProfileValue('systemIntro',
        'You generate internal mental voices for a roleplayer.');
    const toneGuide = getProfileValue('toneGuide',
        'Match the tone to the story. Be specific, never generic.');
    
    // Theme-specific urgency
    const urgency = theme ? (THEME_URGENCY[theme] || '') : 'Something caught your attention. Pay attention.';
    
    // Scene context for grounding
    const sceneContext = getRecentSceneContext(4);
    const sceneBlock = sceneContext
        ? `\nRECENT SCENE:\n${sceneContext}\n`
        : '';
    
    const system = `${systemIntro}

You are ${skillName}. ${personality}

TASK: Write a case description — a 2-3 sentence briefing for a task/quest that just appeared. You are FILING this case. You noticed it, you care about it, you're telling the protagonist why it matters.

RULES:
- Write 2-3 sentences MAXIMUM. Tight, punchy, with personality.
- Write in YOUR voice — opinionated, specific, not neutral.
- Reference the scene if possible. Ground it in what's actually happening.
- This is a BRIEFING, not a philosophical musing. Be concrete.
- No quotation marks around the whole thing. No "Case filed:" prefix.
- Don't repeat the case title verbatim. Expand on it, give it context.
${toneGuide}

EMOTIONAL ANGLE: ${urgency}`;

    const user = `${sceneBlock}
CASE TITLE: ${caseObj.title}${caseObj.rawTitle ? `\nORIGINAL: ${caseObj.rawTitle}` : ''}
THEME: ${theme || 'general'}
PRIORITY: ${caseObj.priority || 'side'}

Write the case description. 2-3 sentences. Your voice. Your perspective. Go.`;

    return { system, user };
}


// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

// Prevent duplicate generation
const _generating = new Set();

/**
 * Generate a description for a case using the theme-matched skill voice.
 * Independent API call — does not interfere with main chat.
 * 
 * @param {object} caseObj - The case object (must have at least title)
 * @param {object} options - { forceRegenerate, maxTokens }
 * @returns {Promise<string|null>} Generated description, or null on failure
 */
export async function generateCaseDescription(caseObj, options = {}) {
    const { forceRegenerate = false, maxTokens = 200 } = options;
    
    if (!caseObj?.title) {
        console.warn('[CaseDesc] No title provided, skipping generation');
        return null;
    }
    
    // Skip if already has a meaningful description (unless forced)
    if (!forceRegenerate && caseObj.description && 
        !caseObj.description.startsWith('Detected from:') &&
        caseObj.description.length > 20) {
        return caseObj.description;
    }
    
    // Prevent concurrent generation for same case
    if (_generating.has(caseObj.id)) {
        console.log('[CaseDesc] Already generating for', caseObj.id);
        return null;
    }
    
    _generating.add(caseObj.id);
    
    try {
        // Pick the voice
        const skillId = getVoiceForTheme(caseObj.theme);
        const skillName = getSkillName(skillId, skillId.toUpperCase());
        
        console.log(`[CaseDesc] Generating for "${caseObj.title}" — voice: ${skillName} (${skillId}), theme: ${caseObj.theme || 'none'}`);
        
        // Build prompt
        const { system, user } = buildCaseDescriptionPrompt(caseObj, skillId);
        
        // Call API with tight token budget
        const response = await callAPIWithTokens(system, user, maxTokens);
        
        if (!response || response.trim().length < 10) {
            console.warn('[CaseDesc] Empty or too-short response');
            return null;
        }
        
        // Clean up response
        const description = cleanDescription(response);
        
        console.log(`[CaseDesc] Generated: "${description.substring(0, 80)}..."`);
        
        return description;
        
    } catch (e) {
        console.error('[CaseDesc] Generation failed:', e.message);
        return null;
    } finally {
        _generating.delete(caseObj.id);
    }
}

/**
 * Clean up the AI response into a proper description.
 */
function cleanDescription(raw) {
    let text = raw.trim();
    
    // Remove common AI prefixes
    text = text.replace(/^(?:Case (?:filed|description|briefing)[:\-—]\s*)/i, '');
    text = text.replace(/^(?:Here'?s? (?:the|your|my) (?:case|briefing|description)[:\-—]\s*)/i, '');
    text = text.replace(/^[""]|[""]$/g, '');  // Wrapping quotes
    
    // Trim to ~3 sentences max (safety valve for verbose models)
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 3) {
        text = sentences.slice(0, 3).join(' ').trim();
    }
    
    return text;
}


// ═══════════════════════════════════════════════════════════════
// BATCH GENERATION (for upgrade/backfill)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate descriptions for all cases that are missing them.
 * Useful for upgrading existing cases after the feature is added.
 * 
 * @param {object} cases - Object of { id: caseObj }
 * @param {object} options - { delayMs, onProgress }
 * @returns {Promise<number>} Count of cases that got descriptions
 */
export async function backfillDescriptions(cases, options = {}) {
    const { delayMs = 2000, onProgress = null } = options;
    
    if (!cases) return 0;
    
    const needsDescription = Object.values(cases).filter(c => {
        return c.status === 'active' && 
               (!c.description || c.description.startsWith('Detected from:'));
    });
    
    if (needsDescription.length === 0) return 0;
    
    console.log(`[CaseDesc] Backfilling ${needsDescription.length} cases`);
    let count = 0;
    
    for (const caseObj of needsDescription) {
        const desc = await generateCaseDescription(caseObj, { forceRegenerate: true });
        if (desc) {
            caseObj.description = desc;
            caseObj.descriptionVoice = getVoiceForTheme(caseObj.theme);
            count++;
            
            if (onProgress) {
                onProgress(count, needsDescription.length, caseObj.title);
            }
        }
        
        // Rate limit: don't hammer the API
        if (count < needsDescription.length) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    
    console.log(`[CaseDesc] Backfilled ${count}/${needsDescription.length} cases`);
    return count;
}


// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { THEME_VOICE_MAP, THEME_URGENCY, DEFAULT_VOICE };

export default {
    THEME_VOICE_MAP,
    THEME_URGENCY,
    DEFAULT_VOICE,
    getVoiceForTheme,
    buildCaseDescriptionPrompt,
    generateCaseDescription,
    backfillDescriptions,
};
