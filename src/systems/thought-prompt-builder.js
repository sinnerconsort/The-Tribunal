/**
 * The Tribunal - Thought Prompt Builder
 * 
 * Builds prompts for AI to generate thoughts dynamically
 * based on persona, themes, and chat context.
 * 
 * @version 4.5.0 - Prompt tightening overhaul:
 *   - Added theme→skill affinity guide (model picks thematically relevant bonuses)
 *   - Constrained bonus values to -1/+1 strictly, 1-2 skills each
 *   - Added specialEffect examples with valid status targets
 *   - Shortened text requirements (150w problem, 80w solution vs uncapped paragraphs)
 *   - Name constraint: 2-5 words max
 *   - Directed user prompts: "fixate on ONE moment" vs "what's bubbling"
 *   - researchTime default 10→8 (thoughts complete slightly faster)
 * @version 4.4.0 - Setting Profile integration (agnosticism refactor)
 *                  All "Disco Elysium" string references now come from
 *                  the active setting profile via getProfileValue()
 */

import { THEMES, getTopThemes, THEME_ICONS, FALLBACK_ICON } from '../data/thoughts.js';
import { getPersona, getThoughtCabinet } from '../core/state.js';
import { getContext } from '../../../../../extensions.js';

// Setting profile system — prompt flavor text
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// STATUS TYPES (matches status-template.js / statuses.js)
// ═══════════════════════════════════════════════════════════════

/**
 * These are the observed states that exist in the Status tab.
 * Thoughts with specialEffects can toggle these when internalized.
 */
const OBSERVED_STATES = {
    physical: [
        'drunk', 'stimmed', 'smoking', 'volumetric_shit_compressor',
        'wounded', 'waste_land', 'dying', 'revacholian_courage'
    ],
    mental: [
        'manic', 'dissociated', 'infatuated', 'lucky', 
        'terrified', 'law_jaw', 'grieving'
    ]
};

const COPOTYPES = [
    'apocalypse_cop', 'sorry_cop', 'boring_cop', 'honour_cop',
    'art_cop', 'hobocop', 'superstar_cop', 'dick_mullen',
    'human_can_opener', 'innocence'
];

const ANCIENT_VOICES = [
    'ancient_reptilian_brain', 'limbic_system', 'spinal_cord'
];

// ═══════════════════════════════════════════════════════════════
// CONTEXT GATHERING
// ═══════════════════════════════════════════════════════════════

/**
 * Get recent chat messages for context
 * @param {number} count - Number of messages to retrieve
 * @returns {string[]} Array of message texts
 */
function getRecentMessages(count = 10) {
    try {
        const ctx = getContext();
        if (!ctx?.chat?.length) return [];
        
        const messages = [];
        const start = Math.max(0, ctx.chat.length - count);
        
        for (let i = start; i < ctx.chat.length; i++) {
            const msg = ctx.chat[i];
            if (msg?.mes) {
                const speaker = msg.is_user ? 'You' : (msg.name || 'Character');
                // Truncate very long messages
                const text = msg.mes.length > 500 
                    ? msg.mes.substring(0, 500) + '...' 
                    : msg.mes;
                messages.push(`${speaker}: ${text}`);
            }
        }
        
        return messages;
    } catch (e) {
        console.error('[Tribunal] Failed to get recent messages:', e);
        return [];
    }
}

/**
 * Get the character name from context
 * @returns {string}
 */
function getCharacterName() {
    try {
        const ctx = getContext();
        return ctx?.name2 || 'the character';
    } catch {
        return 'the character';
    }
}

/**
 * Get names of already-internalized thoughts to avoid duplicates
 * @returns {string[]}
 */
function getInternalizedThoughtNames() {
    try {
        const cabinet = getThoughtCabinet();
        if (!cabinet?.internalized || !cabinet?.customThoughts) return [];
        
        return cabinet.internalized
            .map(id => cabinet.customThoughts[id]?.name)
            .filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * Get names of thoughts currently being researched
 * @returns {string[]}
 */
function getResearchingThoughtNames() {
    try {
        const cabinet = getThoughtCabinet();
        if (!cabinet?.researching || !cabinet?.customThoughts) return [];
        
        return Object.keys(cabinet.researching)
            .map(id => cabinet.customThoughts[id]?.name)
            .filter(Boolean);
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// PERSPECTIVE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Determine the thought perspective based on POV style
 * @returns {Object} { type, description }
 */
function getThoughtPerspective() {
    const persona = getPersona();
    const povStyle = persona?.povStyle || 'second';
    
    if (povStyle === 'first') {
        // First person = You ARE the character = Participant
        return {
            type: 'participant',
            description: 'You ARE the protagonist, living this story from the inside.',
            framing: 'Address the user directly as "you" - these are YOUR thoughts about YOUR actions and feelings.',
            example: '"Why did you say that? What were you hoping to achieve?"'
        };
    } else {
        // Second/Third person = You're watching = Observer
        return {
            type: 'observer',
            description: 'You are WATCHING the protagonist, observing their story unfold.',
            framing: 'Address the user as someone observing - "you" refers to the watcher, not the character.',
            example: '"Why does part of you understand them? What does their choice reveal?"'
        };
    }
}

/**
 * Format pronouns for prompt injection
 * Handles various formats: "he/him", "He/Him", "they", etc.
 * @param {string} pronouns - Raw pronoun string from persona
 * @returns {string} Formatted pronoun guidance
 */
function formatPronounGuidance(pronouns) {
    if (!pronouns) return 'they/them';
    
    const lower = pronouns.toLowerCase().trim();
    
    // Already in "x/y" format
    if (lower.includes('/')) {
        return lower;
    }
    
    // Single word - expand to full format
    const expansions = {
        'he': 'he/him',
        'him': 'he/him',
        'she': 'she/her',
        'her': 'she/her',
        'they': 'they/them',
        'them': 'they/them',
        'it': 'it/its',
        'xe': 'xe/xem',
        'ze': 'ze/zir',
        'fae': 'fae/faer'
    };
    
    return expansions[lower] || pronouns;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the system prompt for thought generation
 * @param {Object} perspective - From getThoughtPerspective()
 * @param {Object[]} themes - Top themes array
 * @param {string} personaContext - User's "who are you" context
 * @param {string[]} existingThoughts - Names of internalized/researching thoughts
 * @param {string} playerPronouns - Player's pronouns from profile
 * @returns {string}
 */
function buildSystemPrompt(perspective, themes, personaContext, existingThoughts, playerPronouns = 'they/them') {
    const themeList = themes.length > 0
        ? themes.map(t => `- **${t.name}**: intensity ${t.count}/10`).join('\n')
        : '- No strong themes detected yet - infer from context';
    
    const existingList = existingThoughts.length > 0
        ? `\n## EXISTING THOUGHTS (do not duplicate these names or concepts)\n${existingThoughts.map(n => `- ${n}`).join('\n')}`
        : '';
    
    const formattedPronouns = formatPronounGuidance(playerPronouns);

    // Profile-driven flavor text
    const systemName = getProfileValue('thoughtSystemName');
    const styleName = getProfileValue('thoughtStyleName');
    const styleDesc = getProfileValue('thoughtStyleDescription');
    
    // NOTE: We no longer ask for "icon" in the JSON since we derive it from theme
    return `You are the internal voice generator for ${systemName}.

## YOUR TASK
Generate ONE ${styleDesc} in the style of ${styleName}.

## THE USER'S PERSPECTIVE
${perspective.description}

${personaContext ? `**Who they are:** ${personaContext}` : '**No persona context provided** - generate something that fits the narrative.'}

**CRITICAL - PLAYER PRONOUNS: Use ${formattedPronouns} when addressing the player. Do not infer pronouns from narrative context.**

## FRAMING
${perspective.framing}
Example: ${perspective.example}

## ACTIVE THEMES
${themeList}
${existingList}

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:
{
  "name": "SHORT EVOCATIVE NAME IN ALL CAPS (2-5 words max)",
  "theme": "one of: identity|death|love|violence|mystery|substance|failure|authority|paranoia|philosophy|money|supernatural",
  "researchTime": 8,
  "problemText": "1-2 short paragraphs. Questioning, obsessive, sometimes absurd, sometimes practical. Max 150 words.",
  "solutionText": "1 paragraph of resolution — could be poetic, could be bluntly practical, could be darkly funny. Max 100 words.",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "Short Label" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "Label" }, "other_skill": { "value": -1, "flavor": "Label" } },
  "specialEffect": null
}

## BONUS RULES
- researchBonus: 1-2 skills with -1 penalty each. The unresolved thought distracts you.
- internalizedBonus: 1-4 skills with a MIX of +1 AND -1 values. The thought CHANGES you —
  it doesn't just reward you. A sobriety thought gives +1 volition but -1 electrochemistry, -1 inland_empire.
  A violence thought gives +1 physical_instrument but -1 empathy. Most internalized thoughts
  should have at least one penalty alongside their bonuses.
- Values: -1 or +1 normally, occasionally +2 for the primary bonus of a transformative thought.
- Pick skills that THEMATICALLY connect (see affinity guide below).
- "flavor" is a 2-4 word LABEL, not a sentence. Examples: "Sober", "Bad PR", "Insomnia", "Return of the self", "Rambling madman", "Liquid courage"

## THEME → SKILL AFFINITIES (pick bonuses from the related skills)
- death: empathy, inland_empire, pain_threshold, composure
- love: empathy, suggestion, drama, electrochemistry, composure
- violence: half_light, physical_instrument, reaction_speed, endurance, authority
- mystery: logic, visual_calculus, perception, encyclopedia, rhetoric
- substance: electrochemistry, endurance, composure, volition, inland_empire
- failure: volition, composure, inland_empire, rhetoric, authority
- identity: inland_empire, shivers, conceptualization, esprit_de_corps, volition
- authority: authority, rhetoric, suggestion, esprit_de_corps, drama
- paranoia: half_light, perception, shivers, visual_calculus, inland_empire
- philosophy: conceptualization, encyclopedia, rhetoric, logic, inland_empire
- money: interfacing, rhetoric, suggestion, savoir_faire, composure
- supernatural: shivers, inland_empire, conceptualization, perception, empathy

## SPECIAL EFFECTS (optional — use sparingly, only when the thought truly warrants it)
If the thought has a dramatic enough concept, you may include ONE specialEffect:
- { "type": "voice_amplify", "target": "skill_id", "description": "Skill speaks louder" }
- { "type": "voice_silence", "target": "skill_id", "description": "Skill goes quiet" }
- { "type": "toggle_state", "target": "status_id", "description": "Activates a condition" }
  Valid status targets: revacholian_courage, pyrholidon, tequila_sunset, the_pale, caustic_echo, the_expression
- { "type": "no_buff_from", "target": "source_name", "description": "Blocks buffs from a source" }
Most thoughts should have "specialEffect": null. Only ~20% should have one.

## SKILL IDS (use these exact IDs)
logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus, volition, inland_empire, empathy, authority, esprit_de_corps, suggestion, endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light, hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure

## STYLE GUIDE
- Names: evocative, 2-5 words, ALL CAPS. Think case file labels, band names, medical diagnoses.
  Examples: "WASTE LAND OF REALITY", "RIGOROUS SELF-CRITIQUE", "ACTUAL ART DEGREE"
- Problem text: can be philosophical questioning, neurotic fixation, absurdist tangent, or earnest confusion.
  NOT always poetic. Sometimes it's blunt: "There's something you can't get out of your head."
  Sometimes it's unhinged. Match the tone to the theme.
- Solution text: can be twisted wisdom, practical advice, dark comedy, or resigned acceptance.
  "Congrats — you're sober." is a valid solution. So is cosmic horror. Match the thought.
- Reference SPECIFIC moments from the chat. Don't be generic.
- The thought should feel like internalizing it genuinely changes how you approach the story —
  the bonuses and penalties should feel like CONSEQUENCES of accepting this truth about yourself.`;
}

/**
 * Build the user prompt with chat context
 * @param {string[]} messages - Recent chat messages
 * @param {string} characterName - Name of the character
 * @returns {string}
 */
function buildUserPrompt(messages, characterName) {
    const chatContext = messages.length > 0
        ? messages.join('\n\n')
        : 'No recent chat context available.';
    
    return `The user is engaged with ${characterName}.

Recent conversation:
---
${chatContext}
---

Generate a thought that latches onto ONE specific moment, choice, or tension from this conversation. Don't summarize — fixate on something. What did the user do or say (or fail to say) that reveals something deeper? Ground the thought in a CONCRETE detail from the scene above.`;
}

/**
 * Build the full prompt for thought generation
 * @param {Object} options - Options from thought-generation.js
 * @returns {Object} { system, user, meta }
 */
export function buildThoughtPrompt(options = {}) {
    const persona = getPersona();
    const personaContext = persona?.context || '';
    const playerPronouns = persona?.pronouns || 'they';
    
    // Get perspective based on POV
    const perspective = getThoughtPerspective();
    
    // Get top themes from cabinet
    const cabinet = getThoughtCabinet();
    const themes = getTopThemes(cabinet?.themes || {}, 5);
    
    // Get existing thoughts to avoid duplicates
    const internalized = getInternalizedThoughtNames();
    const researching = getResearchingThoughtNames();
    const existingThoughts = [...internalized, ...researching];
    
    // Get recent chat
    const recentMessages = getRecentMessages(options.messageCount || 10);
    const characterName = getCharacterName();
    
    return {
        system: buildSystemPrompt(perspective, themes, personaContext, existingThoughts, playerPronouns),
        user: buildUserPrompt(recentMessages, characterName),
        
        // Metadata for debugging
        meta: {
            perspective: perspective.type,
            playerPronouns,
            themeCount: themes.length,
            topThemes: themes.map(t => t.id),
            messageCount: recentMessages.length,
            hasPersona: !!personaContext,
            existingThoughts: existingThoughts.length
        }
    };
}

/**
 * Parse the AI response into a thought object
 * Icons are now derived from theme, not from AI response
 * @param {string} response - Raw AI response
 * @returns {Object|null} Parsed thought or null on failure
 */
export function parseThoughtResponse(response) {
    if (!response) return null;
    
    try {
        // Try to extract JSON from response (in case there's extra text)
        let jsonStr = response.trim();
        
        // Handle markdown code blocks
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```\s*/g, '');
        }
        
        // Find JSON object boundaries
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            jsonStr = jsonStr.substring(start, end + 1);
        }
        
        const thought = JSON.parse(jsonStr);
        
        // Validate required fields
        if (!thought.name || !thought.problemText || !thought.solutionText) {
            console.error('[Tribunal] Thought missing required fields:', thought);
            return null;
        }
        
        // Normalize the name to uppercase style
        const normalizedName = thought.name.toUpperCase();
        
        // Get icon from theme (NOT from AI response)
        // This ensures consistent Lucide icons across all thoughts
        const themeIcon = thought.theme ? THEME_ICONS[thought.theme] : null;
        const icon = themeIcon || FALLBACK_ICON;
        
        // Ensure proper structure
        return {
            name: normalizedName,
            icon: icon,  // Lucide SVG from theme, not AI emoji
            theme: thought.theme || null,
            researchTime: thought.researchTime || 10,
            problemText: thought.problemText,
            solutionText: thought.solutionText,
            researchBonus: thought.researchBonus || {},
            internalizedBonus: thought.internalizedBonus || {},
            specialEffect: thought.specialEffect || null
        };
        
    } catch (e) {
        console.error('[Tribunal] Failed to parse thought response:', e);
        console.error('[Tribunal] Raw response:', response);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK THOUGHT (for manual/slash command use)
// ═══════════════════════════════════════════════════════════════

/**
 * Build a simpler prompt for quick thought generation with a specific concept
 * @param {string} concept - The concept/question to build a thought around
 * @returns {Object} { system, user, meta }
 */
export function buildQuickThoughtPrompt(concept) {
    const persona = getPersona();
    const perspective = getThoughtPerspective();
    const playerPronouns = formatPronounGuidance(persona?.pronouns || 'they');
    const existingThoughts = [...getInternalizedThoughtNames(), ...getResearchingThoughtNames()];
    
    const existingNote = existingThoughts.length > 0
        ? `\nExisting thoughts (don't duplicate): ${existingThoughts.join(', ')}`
        : '';

    const styleDesc = getProfileValue('thoughtStyleDescription');
    
    // NOTE: No "icon" field requested - we derive it from theme
    const system = `You generate ${styleDesc}s. The user is a ${perspective.type} (${perspective.description}).

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**
${existingNote}

Generate ONE thought about the concept provided. Output ONLY valid JSON:
{
  "name": "SHORT EVOCATIVE NAME IN CAPS (2-5 words)",
  "theme": "identity|death|love|violence|mystery|substance|failure|authority|paranoia|philosophy|money|supernatural",
  "researchTime": 8,
  "problemText": "1-2 short paragraphs — questioning, absurd, practical, or neurotic. Max 150 words.",
  "solutionText": "1 paragraph of resolution — poetic, practical, or darkly funny. Max 100 words.",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "Short Label" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "Label" }, "other_skill": { "value": -1, "flavor": "Label" } },
  "specialEffect": null
}

BONUS RULES: Research: 1-2 skills at -1. Internalized: 1-4 skills, MIX of +1 and -1 (the thought changes you, not just rewards you). Flavor is a 2-4 word label like "Sober" or "Bad PR".

Skills: logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus, volition, inland_empire, empathy, authority, esprit_de_corps, suggestion, endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light, hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure`;

    const user = `${persona?.context ? `User context: ${persona.context}\n\n` : ''}Generate a thought about: "${concept}"`;
    
    return { 
        system, 
        user,
        meta: {
            perspective: perspective.type,
            playerPronouns,
            concept,
            existingThoughts: existingThoughts.length
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// THEME-TRIGGERED THOUGHT
// ═══════════════════════════════════════════════════════════════

/**
 * Build a prompt specifically for when a theme has "spiked"
 * This creates more focused thoughts around that theme
 * @param {Object} spikingTheme - { id, name, icon, count }
 * @returns {Object} { system, user, meta }
 */
export function buildThemeTriggeredPrompt(spikingTheme) {
    const persona = getPersona();
    const perspective = getThoughtPerspective();
    const playerPronouns = formatPronounGuidance(persona?.pronouns || 'they');
    const recentMessages = getRecentMessages(10);
    const characterName = getCharacterName();
    const existingThoughts = [...getInternalizedThoughtNames(), ...getResearchingThoughtNames()];

    const styleDesc = getProfileValue('thoughtStyleDescription');
    
    // NOTE: No "icon" field requested - theme is pre-determined
    const system = `You generate ${styleDesc}s. The user is a ${perspective.type}.

## CRITICAL: THEME SPIKE
The theme "${spikingTheme.name}" has reached critical mass in this story.
This thought MUST be primarily about ${spikingTheme.name.toLowerCase()}.

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**

${persona?.context ? `User context: ${persona.context}` : ''}
${existingThoughts.length > 0 ? `\nExisting thoughts (don't duplicate): ${existingThoughts.join(', ')}` : ''}

Generate ONE thought that crystallizes what "${spikingTheme.name}" means in this SPECIFIC story — not in the abstract. Anchor it to something concrete from the conversation.

Output ONLY valid JSON:
{
  "name": "EVOCATIVE NAME RELATED TO ${spikingTheme.name.toUpperCase()} (2-5 words)",
  "theme": "${spikingTheme.id}",
  "researchTime": 8,
  "problemText": "1-2 short paragraphs — obsessive, absurd, practical, or neurotic. Max 150 words.",
  "solutionText": "1 paragraph — what ${spikingTheme.name.toLowerCase()} actually means here. Max 100 words.",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "Short Label" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "Label" }, "other_skill": { "value": -1, "flavor": "Label" } },
  "specialEffect": null
}

BONUS RULES: Research: 1-2 skills at -1. Internalized: 1-4 skills, MIX of +1 and -1 (the thought changes you, not just rewards you). Flavor is a 2-4 word label.`;

    const chatContext = recentMessages.length > 0
        ? recentMessages.join('\n\n')
        : 'No recent context available.';

    const user = `The user is talking to ${characterName}.

Recent conversation where "${spikingTheme.name}" has been building:
---
${chatContext}
---

Pick ONE specific moment from above where "${spikingTheme.name.toLowerCase()}" hit hardest. Build the thought around THAT moment — not the theme in general.`;

    return {
        system,
        user,
        meta: {
            perspective: perspective.type,
            playerPronouns,
            triggeredTheme: spikingTheme.id,
            themeIntensity: spikingTheme.count,
            existingThoughts: existingThoughts.length
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { OBSERVED_STATES, COPOTYPES, ANCIENT_VOICES };
