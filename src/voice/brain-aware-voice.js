/**
 * Brain-Aware Voice — Prompt Enhancement & Observation Parsing
 * 
 * Enhances voice generation prompts with attribute brain context.
 * Parses voice-time observations from output and routes them to brains.
 * 
 * Integration: wraps the existing prompt builder, doesn't replace it.
 * The buildChorusPrompt() in prompt-builder.js calls into this module
 * to get the brain context block.
 * 
 * @version 1.0.0
 */

import {
    isBrainEnabled,
    getBrainForVoice,
    getAttributeForVoice,
    serializeBrainForVoice,
    voiceWriteToBrain,
    getBrainConfig
} from '../systems/attribute-brains.js';

// ═══════════════════════════════════════════════════════════════
// BRAIN CONTEXT FOR VOICE PROMPTS
// ═══════════════════════════════════════════════════════════════

/**
 * Build the brain context block for a voice's generation prompt.
 * Returns a formatted section telling the voice about its domain's
 * observations, with instructions to interpret (not repeat verbatim).
 * 
 * @param {string} skillId - The voice/skill being generated
 * @returns {string} Brain context block to inject, or empty string
 */
export function buildBrainContextForVoice(skillId) {
    if (!isBrainEnabled()) return '';

    const brainText = serializeBrainForVoice(skillId);
    if (!brainText) return '';

    return `
═══════════════════════════════════════════════════════════════
DOMAIN OBSERVATIONS (interpret through your personality — do NOT repeat verbatim)
═══════════════════════════════════════════════════════════════
${brainText}

These are shared factual notes from your cognitive domain. Other voices in your domain read the same notes and may reach completely different conclusions. Reference observations naturally when relevant — your response should be YOUR unique take, not a recitation.`;
}

/**
 * Build the observation instruction for voice-time writes.
 * Only included if the brain has room for more observations.
 * 
 * @param {string} skillId - The voice/skill being generated
 * @returns {string} Observation instruction, or empty string
 */
export function buildObservationInstruction(skillId) {
    if (!isBrainEnabled()) return '';

    const brain = getBrainForVoice(skillId);
    if (!brain) return '';

    const { maxThoughtsPerBrain } = getBrainConfig();
    const thoughtCount = Object.keys(brain.thoughts || {}).length;

    // Don't ask for observations if brain is full
    if (thoughtCount >= maxThoughtsPerBrain) return '';

    return `
If you notice a genuinely NEW fact not already noted above, you may add it at the very end:
[OBSERVE: key_name = Neutral observation without your personal spin.]
This is optional. Most responses won't include this. Maximum ONE per response.`;
}

/**
 * Build the full brain enhancement for a voice prompt.
 * Call this from buildChorusPrompt() to get the combined block.
 * 
 * @param {Array} voiceData - Array of { skillId, ... } for all voices this round
 * @returns {string} Combined brain context block for all voices
 */
export function buildBrainEnhancementBlock(voiceData) {
    if (!isBrainEnabled()) return '';
    
    // Collect unique attributes represented this round
    const attributesSeen = new Set();
    const brainBlocks = [];
    
    for (const v of voiceData) {
        if (v.isAncient) continue; // Ancient voices don't read brains
        
        const attrId = getAttributeForVoice(v.skillId);
        if (!attrId || attributesSeen.has(attrId)) continue;
        
        attributesSeen.add(attrId);
        const brainText = serializeBrainForVoice(v.skillId);
        if (brainText) {
            const attrName = attrId.toUpperCase();
            brainBlocks.push(`[${attrName} observations]\n${brainText}`);
        }
    }
    
    if (brainBlocks.length === 0) return '';
    
    // Check if any voice can write (brain not full)
    let observeNote = '';
    for (const v of voiceData) {
        if (v.isAncient) continue;
        const instruction = buildObservationInstruction(v.skillId);
        if (instruction) {
            observeNote = `
OPTIONAL OBSERVATION: If a voice notices something genuinely NEW, it may end its line with:
[OBSERVE: key_name = Neutral fact without personality spin.]
Maximum ONE observation total across all voices. Most rounds will have none.`;
            break;
        }
    }
    
    return `
═══════════════════════════════════════════════════════════════
COGNITIVE MEMORY (shared observations — interpret through each voice's personality)
═══════════════════════════════════════════════════════════════
${brainBlocks.join('\n\n')}

Voices share these observations within their domain. They interpret the SAME facts differently based on personality. Reference naturally when relevant.${observeNote}`;
}

// ═══════════════════════════════════════════════════════════════
// CASCADE BRAIN CONTEXT
// ═══════════════════════════════════════════════════════════════

/**
 * When a cascade fires (Voice B reacting to Voice A), build context
 * noting shared vs cross-domain awareness.
 * 
 * @param {string} respondingSkillId - Voice B (reacting)
 * @param {string} triggerSkillId - Voice A (triggered the cascade)
 * @returns {string} Additional context for cascade prompt, or empty string
 */
export function buildCascadeBrainContext(respondingSkillId, triggerSkillId) {
    if (!isBrainEnabled()) return '';
    
    const respondingAttr = getAttributeForVoice(respondingSkillId);
    const triggerAttr = getAttributeForVoice(triggerSkillId);
    
    if (!respondingAttr || !triggerAttr) return '';
    
    if (respondingAttr === triggerAttr) {
        return '(You share the same cognitive domain — you see the same observations but interpret them differently.)';
    }
    
    // Cross-attribute: mention what the other domain knows
    const triggerBrain = serializeBrainForVoice(triggerSkillId);
    if (triggerBrain) {
        return `(Their domain's observations:\n${triggerBrain})`;
    }
    
    return '';
}

// ═══════════════════════════════════════════════════════════════
// VOICE OUTPUT PARSING (Observation Extraction)
// ═══════════════════════════════════════════════════════════════

/**
 * Parse voice output to extract [OBSERVE: ...] tags.
 * Returns cleaned display text and any observations to write.
 * 
 * @param {string} voiceOutput - Raw AI response text
 * @returns {{ cleanedText: string, observations: Array<{ key: string, value: string }> }}
 */
export function parseVoiceObservations(voiceOutput) {
    if (!voiceOutput) return { cleanedText: '', observations: [] };

    const observations = [];
    const observePattern = /\[OBSERVE:\s*([a-z_][a-z0-9_]*)\s*=\s*([^\]]+)\]/gi;

    let match;
    while ((match = observePattern.exec(voiceOutput)) !== null) {
        observations.push({
            key: match[1].toLowerCase().trim(),
            value: match[2].trim()
        });
    }

    // Remove [OBSERVE: ...] tags from display text
    const cleanedText = voiceOutput
        .replace(observePattern, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return { cleanedText, observations };
}

/**
 * Process voice generation results: extract observations and write to brains.
 * Call this after parseChorusResponse() with the parsed voice lines.
 * 
 * @param {Array} voiceResults - Parsed voice results from generation
 * @returns {Array} Cleaned voice results (observations stripped from content)
 */
export function processVoiceBrainWrites(voiceResults) {
    if (!isBrainEnabled() || !voiceResults) return voiceResults;
    
    let totalWritten = 0;
    
    for (const voice of voiceResults) {
        if (!voice.content) continue;
        
        const { cleanedText, observations } = parseVoiceObservations(voice.content);
        
        // Update the display content (strip [OBSERVE:] tags)
        if (observations.length > 0) {
            voice.content = cleanedText;
        }
        
        // Write observations to the voice's attribute brain (max 1 per voice)
        for (const obs of observations.slice(0, 1)) {
            const success = voiceWriteToBrain(voice.skillId, obs.key, obs.value);
            if (success) {
                totalWritten++;
                console.log(`[Tribunal Brains] ${voice.skillId} observed: ${obs.key}`);
            }
        }
    }
    
    if (totalWritten > 0) {
        console.log(`[Tribunal Brains] ${totalWritten} voice-time observation(s) written`);
    }
    
    return voiceResults;
}
