/**
 * src/voice/prompt-builder.js - Chorus prompt building
 * Imports from: data/, core/
 */

import { SKILLS } from '../data/skills.js';
import { getPlayerContext } from '../core/state.js';

export function analyzeContext(message) {
    const lower = message.toLowerCase();
    return {
        message,
        emotionalIntensity: (lower.match(/!/g) || []).length * 0.2,
        dangerLevel: /blood|weapon|gun|knife|death/.test(lower) ? 0.7 : 0.2,
        socialComplexity: /lie|persuade|convince|trust/.test(lower) ? 0.6 : 0.2,
        mysteryLevel: /secret|hidden|clue|mystery/.test(lower) ? 0.6 : 0.2,
        physicalPresence: /room|place|weather|cold|hot/.test(lower) ? 0.5 : 0.2
    };
}

export function buildChorusPrompt(voiceData, context) {
    const player = getPlayerContext();
    
    const systemPrompt = `You simulate Disco Elysium's internal voice system.
Generate 2-4 brief skill reactions to the scene.

Format each as:
SKILL NAME: [check result] Voice text here.

Rules:
- Each voice 1-2 sentences max
- React to emotional/thematic content
- Match each skill's distinct personality
- Use second person ("you")`;

    const voiceDescriptions = voiceData.map(v => 
        `${v.skill.name}: ${v.checkResult?.success ? 'SUCCESS' : 'FAILURE'} (rolled ${v.checkResult?.total || '?'})`
    ).join('\n');

    const userPrompt = `Voices speaking: \n${voiceDescriptions}\n\nScene: "${context.message}"`;
    
    return { system: systemPrompt, user: userPrompt };
}
