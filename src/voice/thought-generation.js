/**
 * The Tribunal - Thought Generation
 * AI-powered custom thought creation for the Thought Cabinet
 * 
 * Restored from original Inland Empire implementation
 */

import { SKILLS } from '../data/skills.js';
import { extensionSettings, thoughtCabinet, saveState } from '../core/state.js';
import { callAPI, getContext } from './api-helpers.js';
import { addCustomThought, getTopThemes } from '../systems/cabinet.js';
import { showToast } from '../ui/toasts.js';

// ═══════════════════════════════════════════════════════════════
// THOUGHT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a custom thought via AI
 * @param {string} prompt - User-provided concept/obsession
 * @param {boolean} fromContext - Whether to include recent chat context
 * @param {string} perspective - 'observer' or 'participant'
 * @param {string} playerContext - Optional player identity context
 * @returns {object|null} - Generated thought or null on failure
 */
export async function generateThought(prompt, fromContext = false, perspective = 'observer', playerContext = '') {
    const ctx = getContext();
    
    // Get context from chat if requested
    let contextText = '';
    if (fromContext && ctx?.chat) {
        const recentMessages = ctx.chat.slice(-5) || [];
        contextText = recentMessages.map(m => m.mes).join('\n');
    }
    
    if (!prompt && !contextText) {
        showToast('Enter a concept or check "From chat"', 'error');
        return null;
    }

    // Build skill list for the prompt
    const skillList = Object.entries(SKILLS)
        .map(([id, s]) => `${id}: ${s.name}`)
        .join(', ');

    // Get theme hints from current tracking
    const topThemes = getTopThemes(3);
    const themeHint = topThemes.length > 0 
        ? topThemes.map(t => t.name).join(', ')
        : 'none tracked yet';

    // Player identity context
    const playerIdentity = playerContext 
        ? `The player identifies as: ${playerContext}`
        : 'The player is an unnamed protagonist observing events.';

    // Perspective-specific instructions
    const perspectiveInstructions = perspective === 'observer'
        ? `CRITICAL PERSPECTIVE - OBSERVER MODE:
${playerIdentity}

IMPORTANT: The thought belongs to the PLAYER CHARACTER, NOT any NPC in the scene.
- If there's a killer/villain/antagonist in the scene, the player is NOT that character
- The thought is about the player's REACTION to witnessing this NPC's behavior
- "Why does part of you understand them?" NOT "Why do you do this?"
- "What does it mean that you can see their logic?" NOT "The hunt is boring"
- The player observes, questions, wrestles with what they've seen
- They might be disturbed, fascinated, horrified, or darkly intrigued - but they are OUTSIDE looking IN
- Never write from the perpetrator's POV - write from the witness's POV
- Example: Instead of "You feel the thrill of the hunt" write "You watched them hunt. And something in you understood the thrill. That's what disturbs you."`
        : `CRITICAL PERSPECTIVE - PARTICIPANT MODE:
${playerIdentity}

- The thought emerges FROM the mindset shown in the scene
- The player IS the character having these thoughts naturally
- If they're a killer, the thought is about their philosophy of killing
- No external judgment or wrestling - this is how they genuinely think
- Second person "you" is someone fully inhabiting this headspace`;

    const systemPrompt = `You are a Disco Elysium thought generator. Create a single thought for the Thought Cabinet system.

Available skills for bonuses: ${skillList}

${perspectiveInstructions}

The dominant themes in this conversation are: ${themeHint}

Output ONLY valid JSON with this exact structure:
{
  "name": "Evocative 2-4 word name",
  "icon": "single emoji",
  "category": "philosophy|identity|obsession|survival|mental|social|emotion",
  "researchTime": 8,
  "researchBonus": {
    "skill_id": {"value": -1, "flavor": "Short reason for penalty"}
  },
  "internalizedBonus": {
    "skill_id": {"value": 2, "flavor": "Short thematic label"}
  },
  "problemText": "3-4 paragraphs of stream-of-consciousness questioning. Rambling, uncertain, philosophical. Written in second person. This is wrestling with the concept.",
  "solutionText": "2-3 paragraphs of resolution. The conclusion reached. More grounded but still poetic. What is realized after mulling it over."
}

TONE REQUIREMENTS:
- Problem text should be LONG and RAMBLING - stream of consciousness, full of questions, philosophical tangents
- Use paragraph breaks (\\n\\n) between thoughts
- Names should be evocative and slightly absurd like "Volumetric Shit Compressor" or "Finger on the Eject Button"
- Solution text is the ANSWER - more conclusive, sometimes bittersweet, often with dark humor
- Match Disco Elysium's darkly humorous, deeply philosophical, self-aware tone
- Second person throughout ("You", "Your")
- Research bonuses are penalties while researching (-1 to -2)
- Internalized bonuses are rewards (+1 to +3) with short flavor text explaining the bonus
- Research time 6-15 (higher = more profound/complex thoughts)`;

    const userPrompt = prompt 
        ? `Create a thought about: ${prompt}${contextText ? `\n\nScene context:\n${contextText}` : ''}`
        : `Generate a thought based on this scene:\n${contextText}`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        
        // Parse JSON from response
        let jsonStr = response;
        
        // Try to extract JSON if wrapped in markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }
        
        // Clean up common issues
        jsonStr = jsonStr.trim();
        
        // Parse the thought
        const thought = JSON.parse(jsonStr);
        
        // Validate required fields
        if (!thought.name || !thought.problemText) {
            throw new Error('Missing required thought fields');
        }
        
        // Set defaults for optional fields
        thought.icon = thought.icon || '💭';
        thought.category = thought.category || 'philosophy';
        thought.researchTime = thought.researchTime || 8;
        thought.researchBonus = thought.researchBonus || {};
        thought.internalizedBonus = thought.internalizedBonus || {};
        thought.solutionText = thought.solutionText || thought.problemText;
        
        return thought;
        
    } catch (error) {
        console.error('[The Tribunal] Thought generation failed:', error);
        throw error;
    }
}

/**
 * Handle the Generate Thought button click
 * Called from cabinet UI via callbacks
 */
export async function handleGenerateThought(prompt, fromContext, perspective, playerContext, refreshCabinetTab) {
    const loadingToast = showToast('Generating thought...', 'info', 30000);
    
    try {
        const thought = await generateThought(prompt, fromContext, perspective, playerContext);
        
        if (thought) {
            // Add to discovered thoughts
            const addedThought = addCustomThought(thought, getContext());
            saveState(getContext());
            
            // Hide loading toast
            if (loadingToast?.remove) loadingToast.remove();
            
            showToast(`Discovered: ${thought.name}`, 'success');
            
            // Refresh the cabinet UI
            if (refreshCabinetTab) refreshCabinetTab();
            
            return addedThought;
        }
    } catch (error) {
        // Hide loading toast
        if (loadingToast?.remove) loadingToast.remove();
        
        const errorMsg = error.message || 'Unknown error';
        showToast(`Generation failed: ${errorMsg}`, 'error');
        console.error('[The Tribunal] Generate thought error:', error);
    }
    
    return null;
}
