/**
 * The Tribunal - Thought Generation Prompt Builder
 * 
 * Builds prompts for AI thought generation in Disco Elysium style.
 * Auto-detects perspective from POV settings.
 */

import { SKILLS } from '../data/skills.js';

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the system prompt for thought generation
 * @param {object} playerContext - { perspective: 'observer'|'participant', identity: string }
 * @param {object} themeData - Current theme counters
 * @returns {string} System prompt
 */
export function buildThoughtSystemPrompt(playerContext, themeData) {
    const perspectiveGuide = playerContext.perspective === 'participant'
        ? `The player is a PARTICIPANT - they ARE the character. Frame thoughts as internal experiences. Use "you feel", "you remember", "your hands", "your heart". The thought emerges FROM the character's mindset naturally.`
        : `The player is an OBSERVER - an outside consciousness watching events unfold. Frame thoughts as reactions to what they're witnessing, not experiencing directly. Use "you watch", "you see them", "this reminds you of". They might be disturbed, fascinated, or darkly intrigued - but they are OUTSIDE looking IN.`;

    const identityGuide = playerContext.identity
        ? `The player's identity/role: "${playerContext.identity}". Incorporate this perspective naturally - their background colors how they interpret events.`
        : `No specific identity provided. Write for a general observer/participant.`;

    // Get top 3 themes for flavor
    const topThemes = Object.entries(themeData || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([theme, count]) => `${theme} (${count})`)
        .join(', ');

    // Build skill list for bonuses
    const skillList = Object.entries(SKILLS)
        .map(([id, s]) => `${id}: ${s.name}`)
        .join(', ');

    return `You are a Disco Elysium thought generator. You create THOUGHTS for the Thought Cabinet - obsessive ideas that lodge in the player's mind during roleplay.

${perspectiveGuide}

${identityGuide}

${topThemes ? `Current dominant themes in this playthrough: ${topThemes}` : ''}

## DISCO ELYSIUM THOUGHT STRUCTURE

Each thought has TWO parts:

**PROBLEM** (While Researching)
- The obsessive question or fixation that won't let go
- Uncertain, probing, often uncomfortable
- Hooks with mystery or discomfort
- 3-6 paragraphs of RAMBLING stream-of-consciousness, full of questions and tangents
- Use paragraph breaks (\\n\\n) between thoughts

**SOLUTION** (When Internalized)
- The "answer" the mind arrives at (may be wrong, ironic, or darkly funny)
- Resolves the tension with insight, acceptance, or delusion
- Often bittersweet, self-aware, or unexpectedly practical
- 2-3 paragraphs, landing on a strong final line

## WRITING PATTERNS (Choose one per thought)

1. **LIST ESCALATION** - Build momentum through increasingly absurd descriptors
   "Trite, contrived, mediocre, milquetoast, amateurish, infantile..."

2. **PRACTICAL SPIRAL** - Start existential, land on weirdly specific practical advice
   "Congrats - you're sober. Eat plenty. Your coordination will improve in weeks."

3. **PROPHETIC DREAD** - Build cosmic weight, end with call to action
   "The world is dying. It's a fact. People need to know."

4. **SELF-AWARE COMMENTARY** - Break the fourth wall about the obsession itself
   "You've thought about this for *eight hours*?! Maybe you should stop."

5. **MEMORY TRACE** - Reconstruct a path or moment with sensory specificity
   "Jump across the bridge. Fall over. Get up. Shuffle through courtyards..."

## AVAILABLE SKILLS FOR BONUSES
${skillList}

## OUTPUT FORMAT

Respond with ONLY valid JSON:
{
    "name": "EVOCATIVE 2-5 WORD NAME",
    "icon": "single emoji representing the thought",
    "category": "identity|philosophy|obsession|survival|mental|social|emotion",
    "researchTime": 8,
    "researchBonus": {
        "skill_id": {"value": -1, "flavor": "Short reason for penalty while researching"}
    },
    "internalizedBonus": {
        "skill_id": {"value": 2, "flavor": "Short thematic label for bonus"}
    },
    "problemText": "3-6 paragraphs of stream-of-consciousness questioning...",
    "solutionText": "2-3 paragraphs of resolution...",
    "specialEffect": "Optional unique non-stat effect (e.g., 'No positive effects from alcohol')"
}

## CRITICAL RULES

❌ NEVER repeat a phrase or idea, even reworded
❌ NEVER loop on the same emotional beat
❌ NEVER use filler ("It's about...", "The thing is...")
❌ NEVER make the thought about an NPC if the player is an OBSERVER - make it about the PLAYER'S reaction

✅ Each sentence must ADD something new
✅ Build toward a punchline, revelation, or emotional peak
✅ Use *italics* for emphasis sparingly
✅ Include specific details from the context provided
✅ End SOLUTION with a memorable final line
✅ Research bonuses are usually PENALTIES (-1 to -2) - you're distracted
✅ Internalized bonuses are usually REWARDS (+1 to +3) - you've learned something
✅ Research time: 6-15 (higher = more profound/complex thoughts)`;
}


// ═══════════════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the user prompt with specific context
 * @param {string} concept - User-provided concept/obsession OR auto-extracted theme
 * @param {string} chatContext - Recent chat excerpt for context
 * @param {object} options - Additional options
 * @returns {string} User prompt
 */
export function buildThoughtUserPrompt(concept, chatContext, options = {}) {
    const { 
        autoGenerated = false,
        triggeringThemes = [],
        lorebookContext = ''
    } = options;

    let prompt = '';

    if (autoGenerated) {
        prompt += `Generate a thought that emerged organically from this scene.

TRIGGERING THEMES: ${triggeringThemes.join(', ') || 'general observation'}

SCENE CONTEXT:
"""
${chatContext}
"""

${lorebookContext ? `WORLD/CHARACTER LORE:\n"""\n${lorebookContext}\n"""\n` : ''}

Create a thought that captures something the player might fixate on from this scene - a question, contradiction, obsession, or realization that won't let go.`;
    } else {
        prompt += `Generate a thought based on this player-provided concept:

CONCEPT: "${concept}"

${chatContext ? `CURRENT SCENE FOR CONTEXT:
"""
${chatContext}
"""` : ''}

${lorebookContext ? `WORLD/CHARACTER LORE:
"""
${lorebookContext}
"""` : ''}

Create a thought that explores this concept through the lens of what's happening in the roleplay.`;
    }

    prompt += `

Remember:
- Match one of the five writing patterns (list escalation, practical spiral, prophetic dread, self-aware commentary, or memory trace)
- NO repetition - each sentence must advance
- Problem text should be LONG and RAMBLING (3-6 paragraphs)
- Solution text is the ANSWER - more conclusive (2-3 paragraphs)
- End with impact
- Output valid JSON only - no markdown, no explanation`;

    return prompt;
}


// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSER
// ═══════════════════════════════════════════════════════════════

/**
 * Parse and validate the API response
 * @param {string} response - Raw API response
 * @returns {object|null} Parsed thought or null if invalid
 */
export function parseThoughtResponse(response) {
    try {
        // Clean up response - remove markdown code blocks if present
        let cleaned = response.trim();
        
        // Remove markdown code blocks
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        }
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        // Try to extract JSON object if there's extra text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        const thought = JSON.parse(cleaned);

        // Validate required fields
        const required = ['name', 'problemText'];
        for (const field of required) {
            if (!thought[field]) {
                console.warn(`[Tribunal] Thought missing required field: ${field}`);
                return null;
            }
        }

        // Normalize name to uppercase
        thought.name = thought.name.toUpperCase();

        // Set defaults for optional fields
        thought.icon = thought.icon || '💭';
        thought.category = thought.category || 'philosophy';
        thought.researchTime = thought.researchTime || 8;
        thought.researchBonus = thought.researchBonus || {};
        thought.internalizedBonus = thought.internalizedBonus || {};
        thought.solutionText = thought.solutionText || thought.problemText;

        // Add metadata
        thought.isGenerated = true;
        thought.generatedAt = Date.now();

        return thought;

    } catch (e) {
        console.error('[Tribunal] Failed to parse thought response:', e);
        console.error('[Tribunal] Raw response:', response?.substring(0, 500));
        return null;
    }
}


// ═══════════════════════════════════════════════════════════════
// FORMAT FOR CABINET
// ═══════════════════════════════════════════════════════════════

/**
 * Convert parsed thought to cabinet-compatible format
 * (Usually not needed - addCustomThought handles this)
 * @param {object} thought - Parsed thought from API
 * @param {string} thoughtId - Unique ID for this thought
 * @returns {object} Cabinet-ready thought object
 */
export function formatThoughtForCabinet(thought, thoughtId) {
    return {
        id: thoughtId,
        name: thought.name,
        icon: thought.icon,
        category: thought.category,
        
        problemText: thought.problemText,
        solutionText: thought.solutionText,
        
        researchBonus: thought.researchBonus,
        internalizedBonus: thought.internalizedBonus,
        
        specialEffect: thought.specialEffect || null,
        researchTime: thought.researchTime,
        
        isGenerated: true,
        generatedAt: thought.generatedAt
    };
}
