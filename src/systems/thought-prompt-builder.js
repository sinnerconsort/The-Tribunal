/**
 * The Tribunal - Thought Prompt Builder
 * 
 * Builds prompts for AI to generate Disco Elysium-style thoughts
 * dynamically based on persona, themes, and chat context.
 * 
 * @version 4.3.0 - Theme-based Lucide icons instead of AI emojis
 */

import { THEMES, getTopThemes, THEME_ICONS, FALLBACK_ICON } from '../data/thoughts.js';
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
        ? themes.map(t => `- **${t.name}**: intensity ${t.count}/10`).join('\n')
        : '- No strong themes detected yet - infer from context';
    
    const existingList = existingThoughts.length > 0
        ? `\n## EXISTING THOUGHTS (do not duplicate these names or concepts)\n${existingThoughts.map(n => `- ${n}`).join('\n')}`
        : '';
    
    const formattedPronouns = formatPronounGuidance(playerPronouns);
    
    // NOTE: We no longer ask for "icon" in the JSON since we derive it from theme
    return `You are the internal voice generator for The Tribunal, a Disco Elysium-inspired system.

## YOUR TASK
Generate ONE introspective thought in the style of Disco Elysium's Thought Cabinet.

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
  "name": "SHORT EVOCATIVE NAME IN ALL CAPS",
  "theme": "one of: identity|death|love|violence|mystery|substance|failure|authority|paranoia|philosophy|money|supernatural",
  "researchTime": 10,
  "problemText": "2-3 paragraphs of rambling, philosophical internal monologue. Question everything. Be poetic, fragmented, obsessive.",
  "solutionText": "2 paragraphs of twisted clarity. A conclusion that changes something - even if that change is just acceptance.",
  "researchBonus": { "skill_id": { "value": -1, "flavor": "brief reason" } },
  "internalizedBonus": { "skill_id": { "value": 1, "flavor": "brief reason" } },
  "specialEffect": null
}

## SKILL IDS (use these exact IDs)
logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus, volition, inland_empire, empathy, authority, esprit_de_corps, suggestion, endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light, hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure

## STYLE GUIDE
- Thoughts are OBSESSIVE and RECURSIVE
- They question everything, especially themselves
- The "problem" phase is CONFUSION - beautiful, poetic confusion
- The "solution" is not always positive - sometimes it's just... acceptance
- Use the character's actions and words as fuel for introspection
- Reference specific moments from the chat when possible`;
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

Generate a thought that crystallizes something from this interaction. What's bubbling beneath the surface? What does this conversation reveal about the user's relationship with this story?`;
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
    
    // NOTE: No "icon" field requested - we derive it from theme
    const system = `You generate Disco Elysium-style thoughts. The user is a ${perspective.type} (${perspective.description}).

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**
${existingNote}

Generate ONE thought about the concept provided. Output ONLY valid JSON:
{
  "name": "SHORT EVOCATIVE NAME IN CAPS",
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
    
    // NOTE: No "icon" field requested - theme is pre-determined
    const system = `You generate Disco Elysium-style thoughts. The user is a ${perspective.type}.

## CRITICAL: THEME SPIKE
The theme "${spikingTheme.name}" has reached critical mass in this story.
This thought MUST be primarily about ${spikingTheme.name.toLowerCase()}.

**CRITICAL - PLAYER PRONOUNS: Use ${playerPronouns} when addressing the player. Do not infer pronouns from narrative context.**

${persona?.context ? `User context: ${persona.context}` : ''}
${existingThoughts.length > 0 ? `\nExisting thoughts (don't duplicate): ${existingThoughts.join(', ')}` : ''}

Generate ONE thought that crystallizes what "${spikingTheme.name}" means in this story.

Output ONLY valid JSON:
{
  "name": "EVOCATIVE NAME RELATED TO ${spikingTheme.name.toUpperCase()}",
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
