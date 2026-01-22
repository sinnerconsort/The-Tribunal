/**
 * The Tribunal - Thought Prompt Builder
 * 
 * Builds prompts for AI to generate Disco Elysium-style thoughts
 * dynamically based on persona, themes, and chat context.
 * 
 * @version 4.0.0 - Rebuild
 */

import { THEMES, getTopThemes } from '../data/thoughts.js';
import { getPersona, getThoughtCabinet } from '../core/state.js';
import { getContext } from '../../../../../extensions.js';

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
        return ctx?.name || 'the character';
    } catch {
        return 'the character';
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

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the system prompt for thought generation
 * @param {Object} perspective - From getThoughtPerspective()
 * @param {Object[]} themes - Top themes array
 * @param {string} personaContext - User's "who are you" context
 * @returns {string}
 */
function buildSystemPrompt(perspective, themes, personaContext) {
    const themeList = themes.length > 0
        ? themes.map(t => `- **${t.name}** (${t.icon}): intensity ${t.count}/10 - ${THEMES[t.id]?.keywords?.slice(0, 5).join(', ') || ''}`).join('\n')
        : '- No strong themes detected yet';
    
    return `You are the internal voice generator for The Tribunal, a Disco Elysium-inspired system.

## YOUR TASK
Generate ONE introspective thought in the style of Disco Elysium's Thought Cabinet.

## THE USER'S PERSPECTIVE
${perspective.description}

${personaContext ? `**Who they are:** ${personaContext}` : '**No persona context provided** - generate something universal.'}

## FRAMING RULES
${perspective.framing}
Example: ${perspective.example}

## CURRENT STORY THEMES
These themes have emerged from the ongoing story:
${themeList}

## THOUGHT STRUCTURE
Generate a thought with:

1. **name**: Short, evocative, slightly absurd (2-5 words). Examples: "Volumetric Shit Compressor", "Hobocop", "The Fifteenth Indotribe"

2. **icon**: Single emoji that captures the vibe

3. **theme**: Which theme from the list above this thought primarily relates to (use the theme ID like 'death', 'identity', etc.)

4. **researchTime**: Number from 5-15 (how many messages to complete research)

5. **problemText**: 2-4 paragraphs of rambling, philosophical, stream-of-consciousness text. This plays WHILE the thought is being researched. It should:
   - Question, spiral, contradict itself
   - Be slightly unhinged but profound
   - Reference the user's perspective (${perspective.type})
   - Touch on the relevant theme

6. **solutionText**: 2-3 paragraphs of resolution. This plays WHEN the thought completes. It should:
   - Provide a twisted kind of clarity
   - Feel earned after the rambling
   - Give the user something to hold onto

7. **researchBonus**: Skill penalties while researching (represents mental distraction)
   Format: { "skillId": { "value": -1, "flavor": "brief reason" } }
   Use 1-2 skills, values of -1 or -2

8. **internalizedBonus**: Skill bonuses when complete (the insight gained)
   Format: { "skillId": { "value": 1, "flavor": "brief reason" } }
   Use 1-3 skills, values of +1 or +2

## SKILL IDS (use these exactly)
Intellect: logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus
Psyche: volition, inland_empire, empathy, authority, esprit_de_corps, suggestion
Physique: endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light
Motorics: hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure

## OUTPUT FORMAT
Respond with ONLY valid JSON, no markdown, no explanation:
{
  "name": "...",
  "icon": "...",
  "theme": "...",
  "researchTime": 10,
  "problemText": "...",
  "solutionText": "...",
  "researchBonus": { "skillId": { "value": -1, "flavor": "..." } },
  "internalizedBonus": { "skillId": { "value": 1, "flavor": "..." } }
}`;
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
        : 'No recent messages available.';
    
    return `## RECENT STORY CONTEXT
The user is interacting with: ${characterName}

Recent conversation:
---
${chatContext}
---

Based on this context and the themes that have emerged, generate a thought that feels relevant to what's happening in the story. The thought should resonate with the user's experience of this narrative.

Remember: Output ONLY the JSON object, nothing else.`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Build complete prompt for thought generation
 * @param {Object} options - Optional overrides
 * @returns {Object} { system, user } prompts ready for API call
 */
export function buildThoughtPrompt(options = {}) {
    // Get persona context (the USER's "who are you", not the character)
    const persona = getPersona();
    const personaContext = persona?.context || '';
    
    // Get perspective based on POV
    const perspective = getThoughtPerspective();
    
    // Get top themes from cabinet
    const cabinet = getThoughtCabinet();
    const themes = getTopThemes(cabinet?.themes || {}, 5);
    
    // Get recent chat
    const recentMessages = getRecentMessages(options.messageCount || 10);
    const characterName = getCharacterName();
    
    return {
        system: buildSystemPrompt(perspective, themes, personaContext),
        user: buildUserPrompt(recentMessages, characterName),
        
        // Metadata for debugging
        meta: {
            perspective: perspective.type,
            themeCount: themes.length,
            messageCount: recentMessages.length,
            hasPersona: !!personaContext
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
        
        // Ensure proper structure
        return {
            name: thought.name,
            icon: thought.icon || '💭',
            theme: thought.theme || null,
            researchTime: thought.researchTime || 10,
            problemText: thought.problemText,
            solutionText: thought.solutionText,
            researchBonus: thought.researchBonus || {},
            internalizedBonus: thought.internalizedBonus || {}
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
 * @returns {Object} { system, user }
 */
export function buildQuickThoughtPrompt(concept) {
    const persona = getPersona();
    const perspective = getThoughtPerspective();
    
    const system = `You generate Disco Elysium-style thoughts. The user is a ${perspective.type} (${perspective.description}).

Generate ONE thought about the concept provided. Output ONLY valid JSON:
{
  "name": "Short Evocative Name",
  "icon": "emoji",
  "theme": "identity|death|love|violence|mystery|substance|failure|authority|paranoia|philosophy|money|supernatural",
  "researchTime": 10,
  "problemText": "2-3 paragraphs of rambling philosophical questioning",
  "solutionText": "2 paragraphs of twisted clarity/resolution",
  "researchBonus": { "skillId": { "value": -1, "flavor": "reason" } },
  "internalizedBonus": { "skillId": { "value": 1, "flavor": "reason" } }
}`;

    const user = `${persona?.context ? `User context: ${persona.context}\n\n` : ''}Generate a thought about: "${concept}"`;
    
    return { system, user };
}
