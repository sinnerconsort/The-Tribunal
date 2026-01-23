/**
 * The Tribunal - Thought Prompt Builder
 * 
 * Builds prompts for AI to generate Disco Elysium-style thoughts
 * dynamically based on persona, themes, and chat context.
 * 
 * @version 4.2.0 - Added pronoun support to prevent misgendering from narrative context
 */

import { THEMES, getTopThemes } from '../data/thoughts.js';
import { getPersona, getThoughtCabinet } from '../core/state.js';
import { getContext } from '../../../../../extensions.js';

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
        ? themes.map(t => `- **${t.name}** (${t.icon}): intensity ${t.count}/10`).join('\n')
        : '- No strong themes detected yet - infer from context';
    
    const existingList = existingThoughts.length > 0
        ? `\n## EXISTING THOUGHTS (do not duplicate these names or concepts)\n${existingThoughts.map(n => `- ${n}`).join('\n')}`
        : '';
    
    const formattedPronouns = formatPronounGuidance(playerPronouns);
    
    return `You are the internal voice generator for The Tribunal, a Disco Elysium-inspired system.

## YOUR TASK
Generate ONE introspective thought in the style of Disco Elysium's Thought Cabinet.

## THE USER'S PERSPECTIVE
${perspective.description}

${personaContext ? `**Who they are:** ${personaContext}` : '**No persona context provided** - generate something that fits the narrative.'}

## CRITICAL - PLAYER PRONOUNS
The player uses **${formattedPronouns}** pronouns. When your thought addresses the player (the "you" being spoken to), use these pronouns consistently. Do NOT infer different pronouns from characters in the chat or narrative context - the player is distinct from any characters they may be roleplaying with or observing.

## FRAMING RULES
${perspective.framing}
Example: ${perspective.example}

## CURRENT STORY THEMES
These themes have emerged from the ongoing story (pick one that fits, or infer from context):
${themeList}

Available theme IDs: ${Object.keys(THEMES).join(', ')}
${existingList}

## THOUGHT STRUCTURE
Generate a thought with ALL of these fields:

1. **name**: Short, evocative, slightly absurd (2-5 words in ALL CAPS style)
   Examples: "VOLUMETRIC SHIT COMPRESSOR", "THE FIFTEENTH INDOTRIBE", "HOMO-SEXUAL UNDERGROUND", "ACTUAL ART DEGREE"

2. **icon**: Single emoji that captures the vibe

3. **theme**: One theme ID from: ${Object.keys(THEMES).join(', ')}
   Pick the one most relevant to the thought's content.

4. **researchTime**: Number from 5-15 (how many messages to complete research)

5. **problemText**: 2-4 paragraphs of rambling, philosophical, stream-of-consciousness text.
   - This plays WHILE the thought is being researched
   - Question, spiral, contradict itself
   - Be slightly unhinged but profound
   - Reference the user's perspective (${perspective.type})
   - Use ${formattedPronouns} when addressing the player
   - End mid-thought, unresolved

6. **solutionText**: 2-3 paragraphs of resolution.
   - This plays WHEN the thought completes
   - Provide twisted clarity
   - Feel earned after the rambling
   - Can be darkly funny or painfully sincere

7. **researchBonus**: Skill penalties while researching (mental distraction)
   Format: { "skill_id": { "value": -1, "flavor": "brief reason" } }
   Use 1-2 skills, values of -1 or -2

8. **internalizedBonus**: Skill bonuses when complete (insight gained)
   Format: { "skill_id": { "value": 1, "flavor": "brief reason" } }
   Use 1-3 skills, values of +1 to +3

9. **specialEffect** (OPTIONAL - include for ~25% of thoughts):
   A special rule that changes gameplay. Format:
   { "type": "effect_type", "target": "what it affects", "description": "Human-readable description" }
   
   Effect types:
   - "toggle_state": Enables an observed state. Targets: ${[...OBSERVED_STATES.physical, ...OBSERVED_STATES.mental].join(', ')}
   - "unlock_copotype": Unlocks a cop classification. Targets: ${COPOTYPES.join(', ')}
   - "unlock_voice": Unlocks an ancient voice. Targets: ${ANCIENT_VOICES.join(', ')}
   - "no_buff_from": Blocks positive effects from a source. Targets: "alcohol", "drugs", "sleep"
   - "voice_amplify": Makes a skill speak more often. Target: any skill_id
   - "voice_silence": Silences a skill. Target: any skill_id
   
   Example: { "type": "toggle_state", "target": "waste_land", "description": "You're sober now. No positive effects from alcohol." }

## SKILL IDs (use underscores, lowercase)
**Intellect:** logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus
**Psyche:** volition, inland_empire, empathy, authority, esprit_de_corps, suggestion
**Physique:** endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light
**Motorics:** hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure

## OUTPUT FORMAT
Respond with ONLY valid JSON, no markdown, no explanation:
{
  "name": "THE THOUGHT NAME",
  "icon": "🎭",
  "theme": "identity",
  "researchTime": 10,
  "problemText": "Rambling philosophical text...",
  "solutionText": "Resolution text...",
  "researchBonus": { "volition": { "value": -1, "flavor": "Distracted by this idea" } },
  "internalizedBonus": { "inland_empire": { "value": 1, "flavor": "New perspective gained" } },
  "specialEffect": null
}

For specialEffect, either use null or include the object - don't skip the field.`;
}

/**
 * Build the user prompt with recent context
 * @param {string[]} recentMessages - Recent chat messages
 * @param {string} characterName - Name of the character being talked to
 * @returns {string}
 */
function buildUserPrompt(recentMessages, characterName) {
    const chatContext = recentMessages.length > 0
        ? recentMessages.join('\n\n')
        : 'No recent messages available - generate something introspective and universal.';
    
    return `## RECENT STORY CONTEXT
The user is interacting with: ${characterName}

Recent conversation:
---
${chatContext}
---

Based on this context and any themes present, generate a thought that feels relevant to what's happening. The thought should resonate with the user's experience of this narrative - it could be about the character, the situation, the user's role as observer/participant, or something deeper that the conversation has stirred up.

The name should be memorable and slightly absurd in that Disco Elysium way.

Remember: Output ONLY the JSON object, nothing else.`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Build complete prompt for thought generation
 * @param {Object} options - Optional overrides
 * @returns {Object} { system, user, meta } prompts ready for API call
 */
export function buildThoughtPrompt(options = {}) {
    // Get persona context (the USER's "who are you", not the character)
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
        
        // Ensure proper structure
        return {
            name: normalizedName,
            icon: thought.icon || '💭',
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
    
    const system = `You generate Disco Elysium-style thoughts. The user is a ${perspective.type} (${perspective.description}).

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**
${existingNote}

Generate ONE thought about the concept provided. Output ONLY valid JSON:
{
  "name": "SHORT EVOCATIVE NAME IN CAPS",
  "icon": "emoji",
  "theme": "identity|death|love|violence|mystery|substance|failure|authority|paranoia|philosophy|money|supernatural",
  "researchTime": 10,
  "problemText": "2-3 paragraphs of rambling philosophical questioning",
  "solutionText": "2 paragraphs of twisted clarity/resolution",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "reason" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "reason" } },
  "specialEffect": null
}

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
    
    const system = `You generate Disco Elysium-style thoughts. The user is a ${perspective.type}.

## CRITICAL: THEME SPIKE
The theme "${spikingTheme.name}" (${spikingTheme.icon}) has reached critical mass in this story.
This thought MUST be primarily about ${spikingTheme.name.toLowerCase()}.

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**

${persona?.context ? `User context: ${persona.context}` : ''}
${existingThoughts.length > 0 ? `\nExisting thoughts (don't duplicate): ${existingThoughts.join(', ')}` : ''}

Generate ONE thought that crystallizes what "${spikingTheme.name}" means in this story.

Output ONLY valid JSON:
{
  "name": "EVOCATIVE NAME RELATED TO ${spikingTheme.name.toUpperCase()}",
  "icon": "emoji",
  "theme": "${spikingTheme.id}",
  "researchTime": 10,
  "problemText": "Why does ${spikingTheme.name.toLowerCase()} keep appearing? What does it mean? Ramble philosophically...",
  "solutionText": "The resolution - what ${spikingTheme.name.toLowerCase()} really means here...",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "reason" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "reason" } },
  "specialEffect": null
}`;

    const chatContext = recentMessages.length > 0
        ? recentMessages.join('\n\n')
        : 'No recent context available.';

    const user = `The user is talking to ${characterName}.

Recent conversation where "${spikingTheme.name}" has been building:
---
${chatContext}
---

Generate a thought that captures what all this ${spikingTheme.name.toLowerCase()} means.`;

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
