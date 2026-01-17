/**
 * src/voice/generation.js - Voice selection and generation
 * Imports from: data/, core/, systems/, voice/
 */

import { SKILLS } from '../data/skills.js';
import { getEffectiveSkillLevel } from '../core/state.js';
import { rollSkillCheck } from '../systems/dice.js';
import { analyzeContext, buildChorusPrompt } from './prompt-builder.js';
import { callAPI } from './api-helpers.js';

export function selectSpeakingSkills(context, options = {}) {
    const { minVoices = 2, maxVoices = 4 } = options;
    const analysis = analyzeContext(context.message);
    
    // Simple selection based on context
    const candidates = [];
    
    if (analysis.dangerLevel > 0.5) {
        candidates.push('halfLight', 'perception');
    }
    if (analysis.emotionalIntensity > 0.5) {
        candidates.push('inlandEmpire', 'empathy');
    }
    if (analysis.socialComplexity > 0.5) {
        candidates.push('drama', 'suggestion');
    }
    if (analysis.mysteryLevel > 0.5) {
        candidates.push('logic', 'visualCalculus');
    }
    
    // Always include at least volition
    if (!candidates.includes('volition')) candidates.push('volition');
    
    // Shuffle and limit
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, maxVoices);
}

export async function generateVoices(selectedSkills, context, getContext) {
    // Roll checks for each skill
    const voiceData = selectedSkills.map(skillId => ({
        skillId,
        skill: SKILLS[skillId],
        checkResult: rollSkillCheck(skillId)
    }));
    
    // Build and send prompt
    const prompt = buildChorusPrompt(voiceData, context);
    const response = await callAPI(prompt.system, prompt.user, getContext);
    
    // Parse response
    return parseChorusResponse(response, voiceData);
}

export function parseChorusResponse(response, voiceData) {
    if (!response) return [];
    
    const voices = [];
    const lines = response.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z\s/]+):\s*(?:\[.*?\])?\s*(.+)$/);
        if (match) {
            const skillName = match[1].trim();
            const text = match[2].trim();
            const skillEntry = Object.entries(SKILLS).find(
                ([_, s]) => s.name.toUpperCase() === skillName
            );
            
            voices.push({
                skill: skillName,
                text,
                color: skillEntry?.[1]?.color || '#a3a3a3',
                skillId: skillEntry?.[0]
            });
        }
    }
    
    return voices;
}
