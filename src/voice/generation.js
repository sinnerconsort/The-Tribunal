/**
 * Inland Empire - Voice Generation System
 * Context analysis, voice selection, API calls, and prompt building
 * 
 * Now with CASCADE SYSTEM - skills react to each other!
 * 
 * UPDATED: Uses SillyTavern's ConnectionManagerRequestService for API calls
 * with proper response handling and fallback support
 */

import { SKILLS, ANCIENT_VOICES } from '../data/skills.js';
import {
    CASCADE_RULES,
    getCascadeResponders
} from '../data/relationships.js';
import {
    extensionSettings,
    getEffectiveSkillLevel,
    getSkillLevel,
    getActiveAncientVoices,
    discoveryContext
} from '../core/state.js';
import { rollSkillCheck, determineCheckDifficulty } from '../systems/dice.js';
import { getResearchPenalties } from '../systems/cabinet.js';

// Extracted modules
import { callAPI, getAvailableProfiles, getContext } from './api-helpers.js';
import { analyzeContext, buildChorusPrompt, getActiveCopotype } from './prompt-builder.js';

// Re-export for external use
export { callAPI, getAvailableProfiles, analyzeContext };

// ═══════════════════════════════════════════════════════════════
// SKILL RELEVANCE CALCULATION
// ═══════════════════════════════════════════════════════════════

export function calculateSkillRelevance(skillId, context) {
    const skill = SKILLS[skillId];
    if (!skill) return { skillId, score: 0, reasons: [] };

    const researchPenalties = getResearchPenalties();
    const statusModifier = extensionSettings.autoDetectStatus ? 
        getSkillModifier(skillId, researchPenalties) : 0;

    let score = 0;

    // Keyword matching
    const keywordMatches = skill.triggerConditions.filter(kw =>
        context.message.toLowerCase().includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) {
        score += Math.min(keywordMatches.length * 0.2, 0.6);
    }

    // Attribute bonuses based on context
    const attr = skill.attribute;
    if (attr === 'PSYCHE') score += context.emotionalIntensity * 0.4;
    if (attr === 'PHYSIQUE') score += context.dangerLevel * 0.5;
    if (attr === 'INTELLECT') score += context.mysteryLevel * 0.4;
    if (attr === 'MOTORICS') score += context.physicalPresence * 0.3;

    // Status boost
    if (statusModifier > 0) score += statusModifier * 0.25;

    // Skill level influence
    score += getEffectiveSkillLevel(skillId, researchPenalties) * 0.05;

    // Random variance
    score += (Math.random() - 0.5) * 0.2;

    return {
        skillId,
        skillName: skill.name,
        score: Math.max(0, Math.min(1, score)),
        skillLevel: getSkillLevel(skillId),
        attribute: attr
    };
}

function getSkillModifier(skillId, researchPenalties) {
    let modifier = 0;
    if (researchPenalties[skillId]) {
        modifier += researchPenalties[skillId];
    }
    return modifier;
}

// ═══════════════════════════════════════════════════════════════
// VOICE SELECTION (with CASCADE support)
// ═══════════════════════════════════════════════════════════════

export function selectSpeakingSkills(context, options = {}) {
    const { minVoices = 1, maxVoices = 4 } = options;
    const researchPenalties = getResearchPenalties();

    // Check for ancient voices first
    const ancientVoicesToSpeak = [];
    for (const ancientId of getActiveAncientVoices()) {
        const ancient = ANCIENT_VOICES[ancientId];
        if (ancient) {
            const keywordMatch = ancient.triggerConditions.some(kw =>
                context.message.toLowerCase().includes(kw.toLowerCase())
            );
            if (Math.random() < (keywordMatch ? 0.8 : 0.4)) {
                ancientVoicesToSpeak.push({
                    skillId: ancient.id,
                    skillName: ancient.name,
                    score: 1.0,
                    skillLevel: 6,
                    attribute: 'PRIMAL',
                    isAncient: true
                });
                discoveryContext.ancientVoiceTriggered = true;
            }
        }
    }

    // Calculate relevance for all skills
    const allRelevance = Object.keys(SKILLS)
        .map(id => calculateSkillRelevance(id, context))
        .filter(r => r.score >= 0.3)
        .sort((a, b) => b.score - a.score);

    // Determine number of PRIMARY voices based on intensity
    const intensity = Math.max(
        context.emotionalIntensity,
        context.dangerLevel,
        context.socialComplexity
    );
    const targetVoices = Math.round(minVoices + (maxVoices - minVoices) * intensity);

    // Select PRIMARY skills
    const primarySkills = [];
    for (const relevance of allRelevance) {
        if (primarySkills.length >= targetVoices) break;
        if (Math.random() < relevance.score * 0.8 + 0.2) {
            primarySkills.push({ ...relevance, isPrimary: true });
        }
    }

    // Ensure minimum voices
    while (primarySkills.length < minVoices && allRelevance.length > 0) {
        const next = allRelevance.find(r => !primarySkills.find(s => s.skillId === r.skillId));
        if (next) primarySkills.push({ ...next, isPrimary: true });
        else break;
    }

    // CASCADE DETECTION
    const cascadeSkills = [];
    
    for (const primary of primarySkills) {
        const responders = getCascadeResponders(primary.skillId, context.message);
        
        for (const responder of responders) {
            if (primarySkills.find(s => s.skillId === responder.skillId)) continue;
            if (cascadeSkills.find(s => s.skillId === responder.skillId)) continue;
            
            const skillData = SKILLS[responder.skillId];
            if (!skillData) continue;
            
            cascadeSkills.push({
                skillId: responder.skillId,
                skillName: skillData.name,
                score: 0.7,
                skillLevel: getSkillLevel(responder.skillId),
                attribute: skillData.attribute,
                isPrimary: false,
                isCascade: true,
                cascadeReason: responder.relationship,
                respondingTo: primary.skillId
            });
        }
    }

    const selected = [
        ...ancientVoicesToSpeak,
        ...primarySkills,
        ...cascadeSkills.slice(0, CASCADE_RULES.maxCascadeVoices)
    ];

    return selected;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

export function parseChorusResponse(response, voiceData) {
    const lines = response.trim().split('\n').filter(line => line.trim());
    const results = [];

    const skillMap = {};
    voiceData.forEach(v => {
        skillMap[v.skill.signature.toUpperCase()] = v;
        skillMap[v.skill.name.toUpperCase()] = v;
    });
    
    for (const [skillId, skill] of Object.entries(SKILLS)) {
        if (!skillMap[skill.signature.toUpperCase()]) {
            skillMap[skill.signature.toUpperCase()] = {
                skillId,
                skill,
                checkResult: null,
                isAncient: false,
                isCascade: false,
                effectiveLevel: getEffectiveSkillLevel(skillId)
            };
        }
    }

    for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z\s\/]+)\s*[-:–—]\s*(.+)$/i);
        if (match) {
            const voiceInfo = skillMap[match[1].trim().toUpperCase()];
            if (voiceInfo) {
                results.push({
                    skillId: voiceInfo.skillId,
                    skillName: voiceInfo.skill.name,
                    signature: voiceInfo.skill.signature,
                    color: voiceInfo.skill.color,
                    content: match[2].trim(),
                    checkResult: voiceInfo.checkResult,
                    isAncient: voiceInfo.isAncient,
                    isCascade: voiceInfo.isCascade,
                    success: true
                });
            }
        }
    }

    if (results.length === 0 && voiceData.length > 0 && response.trim()) {
        const v = voiceData[0];
        results.push({
            skillId: v.skillId,
            skillName: v.skill.name,
            signature: v.skill.signature,
            color: v.skill.color,
            content: response.trim().substring(0, 200),
            checkResult: v.checkResult,
            isAncient: v.isAncient,
            success: true
        });
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function generateVoices(selectedSkills, context) {
    if (!selectedSkills || selectedSkills.length === 0) {
        console.error('[The Tribunal] generateVoices called with no skills');
        return [];
    }

    const researchPenalties = getResearchPenalties();

    const voiceData = selectedSkills.map(selected => {
        let checkResult = null;

        if (!selected.isAncient) {
            const checkDecision = determineCheckDifficulty(selected, context);
            if (checkDecision.shouldCheck) {
                const effectiveLevel = getEffectiveSkillLevel(selected.skillId, researchPenalties);
                checkResult = rollSkillCheck(effectiveLevel, checkDecision.difficulty);

                if (checkResult.isBoxcars) {
                    discoveryContext.criticalSuccesses[selected.skillId] = true;
                }
                if (checkResult.isSnakeEyes) {
                    discoveryContext.criticalFailures[selected.skillId] = true;
                }
            }
        }

        const skill = selected.isAncient ?
            ANCIENT_VOICES[selected.skillId] :
            SKILLS[selected.skillId];

        if (!skill) {
            console.error('[The Tribunal] Could not find skill:', selected.skillId);
        }

        return {
            ...selected,
            skill: skill || { name: selected.skillId, signature: selected.skillId, color: '#888', personality: 'Unknown' },
            checkResult,
            effectiveLevel: selected.isAncient ? 6 : getEffectiveSkillLevel(selected.skillId, researchPenalties)
        };
    });

    const chorusPrompt = buildChorusPrompt(voiceData, context);

    console.log('[The Tribunal] Chorus prompt relationships:', 
        voiceData.filter(v => v.isCascade).map(v => `${v.skillId} -> ${v.respondingTo}`)
    );

    try {
        const response = await callAPI(chorusPrompt.system, chorusPrompt.user);
        const parsed = parseChorusResponse(response, voiceData);
        console.log('[The Tribunal] Generated', parsed.length, 'voice responses');
        return parsed;
    } catch (error) {
        console.error('[The Tribunal] Chorus generation failed:', error);
        throw error;
    }
}
