/**
 * The Tribunal - Voice Generation System
 * Context analysis, voice selection, API calls, and prompt building
 * 
 * Now with CASCADE SYSTEM - skills react to each other!
 * v0.3.1 - Status effect modifiers now apply to dice rolls!
 * 
 * REBUILD VERSION: Uses per-chat state accessors and new API helpers
 */

import { SKILLS, ANCIENT_VOICES } from '../data/skills.js';
import { CASCADE_RULES, getCascadeResponders } from '../data/relationships.js';
import { rollSkillCheck, rollSkillCheckWithStatuses, determineCheckDifficulty, calculateStatusModifier } from '../systems/dice.js';
import { getResearchPenalties, recordCriticalSuccess, recordCriticalFailure, recordAncientVoiceTriggered } from '../systems/cabinet.js';

// Import from rebuild's state management
import { getSkillLevel, getVoiceState, setLastGeneratedVoices, awakenVoice, getSettings, getVitals } from '../core/state.js';

// Import status handlers for active effects
import { getActiveStatuses } from '../ui/status-handlers.js';

// Import API helpers and prompt builder
import { callAPI, getAvailableProfiles } from './api-helpers.js';
import { analyzeContext, buildChorusPrompt, getActiveCopotype } from './prompt-builder.js';

// Re-export for external use
export { callAPI, getAvailableProfiles, analyzeContext };

// ═══════════════════════════════════════════════════════════════
// LOCAL STATE FOR DISCOVERY CONTEXT
// This tracks critical successes/failures within a generation cycle
// ═══════════════════════════════════════════════════════════════

const discoveryContext = {
    criticalSuccesses: {},
    criticalFailures: {},
    ancientVoiceTriggered: false,
    objectsSeen: new Set(),
    messageCount: 0
};

/**
 * Reset discovery context for new generation
 */
function resetDiscoveryContext() {
    discoveryContext.criticalSuccesses = {};
    discoveryContext.criticalFailures = {};
    discoveryContext.ancientVoiceTriggered = false;
}

// ═══════════════════════════════════════════════════════════════
// SKILL RELEVANCE CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get effective skill level with research penalties AND status modifiers
 * @param {string} skillId - Skill identifier
 * @param {string[]} activeStatusIds - Array of active status effect IDs
 * @returns {number} Effective level
 */
function getEffectiveSkillLevel(skillId, activeStatusIds = []) {
    const baseLevel = getSkillLevel(skillId);
    
    // Research penalties from Thought Cabinet
    const penalties = getResearchPenalties();
    const researchMod = penalties[skillId] || 0;
    
    // Status effect modifiers (drunk, manic, etc.)
    const statusMod = calculateStatusModifier(skillId, activeStatusIds);
    
    return Math.max(1, baseLevel + researchMod + statusMod);
}

/**
 * Get total modifier for a skill (research + status)
 * @param {string} skillId - Skill identifier
 * @param {string[]} activeStatusIds - Array of active status effect IDs
 * @returns {number} Total modifier value
 */
function getTotalSkillModifier(skillId, activeStatusIds = []) {
    const penalties = getResearchPenalties();
    const researchMod = penalties[skillId] || 0;
    const statusMod = calculateStatusModifier(skillId, activeStatusIds);
    return researchMod + statusMod;
}

export function calculateSkillRelevance(skillId, context) {
    const skill = SKILLS[skillId];
    if (!skill) return { skillId, score: 0, reasons: [] };

    const settings = getSettings();
    const activeStatusIds = getActiveStatuses();
    const statusModifier = calculateStatusModifier(skillId, activeStatusIds);

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

    // Status boost - positive modifiers make skill more likely to speak
    if (statusModifier > 0) score += statusModifier * 0.15;

    // Skill level influence
    score += getEffectiveSkillLevel(skillId, activeStatusIds) * 0.05;

    // Random variance
    score += (Math.random() - 0.5) * 0.2;

    return {
        skillId,
        skillName: skill.name,
        score: Math.max(0, Math.min(1, score)),
        skillLevel: getSkillLevel(skillId),
        statusModifier,
        attribute: attr
    };
}

// ═══════════════════════════════════════════════════════════════
// VOICE SELECTION (with CASCADE support)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if ancient voices should be allowed to speak
 * Ancient voices only emerge during critical/compromised states
 * @returns {boolean} Whether ancient voices can speak
 */
function shouldAllowAncientVoices() {
    const vitals = getVitals();
    
    // Check vitals status - only allow in dire situations
    if (vitals.status === 'critical' || vitals.status === 'compromised') {
        return true;
    }
    
    // Check explicit ancient voice triggers in state
    if (vitals.ancientVoices && vitals.ancientVoices.length > 0) {
        return true;
    }
    
    // Check for specific status effects that might awaken ancient voices
    const ancientTriggerEffects = ['unconscious', 'sleeping', 'dying', 'breakdown', 'dissociating'];
    if (vitals.activeEffects && vitals.activeEffects.some(e => 
        ancientTriggerEffects.includes(e.id?.toLowerCase()) || 
        ancientTriggerEffects.includes(e.name?.toLowerCase())
    )) {
        return true;
    }
    
    // Check raw health/morale percentages
    const healthPercent = vitals.maxHealth > 0 ? (vitals.health / vitals.maxHealth) * 100 : 100;
    const moralePercent = vitals.maxMorale > 0 ? (vitals.morale / vitals.maxMorale) * 100 : 100;
    
    // Ancient voices stir when health or morale drops below 25%
    if (healthPercent < 25 || moralePercent < 25) {
        return true;
    }
    
    return false;
}

/**
 * Get active ancient voices from voice state
 * Ancient voices are GATED by vitals - they only speak in dire situations
 * @returns {array} Array of active ancient voice IDs (empty if conditions not met)
 */
function getActiveAncientVoices() {
    // CRITICAL: Ancient voices must be earned through suffering
    if (!shouldAllowAncientVoices()) {
        return [];
    }
    
    const vitals = getVitals();
    const activeAncient = [];
    
    // If there are explicit ancient voice triggers, use those
    if (vitals.ancientVoices && vitals.ancientVoices.length > 0) {
        return vitals.ancientVoices;
    }
    
    // Otherwise, determine which ancient voice(s) based on state
    const healthPercent = vitals.maxHealth > 0 ? (vitals.health / vitals.maxHealth) * 100 : 100;
    const moralePercent = vitals.maxMorale > 0 ? (vitals.morale / vitals.maxMorale) * 100 : 100;
    
    // Ancient Reptilian Brain - speaks when approaching death/oblivion
    if (healthPercent < 20 || vitals.status === 'critical') {
        activeAncient.push('ancient_reptilian_brain');
    }
    
    // Limbic System - speaks during emotional devastation
    if (moralePercent < 20 || vitals.status === 'critical') {
        activeAncient.push('limbic_system');
    }
    
    // Spinal Cord - only speaks during party/dance states (requires specific effect)
    if (vitals.activeEffects?.some(e => 
        ['dancing', 'disco', 'party', 'rhythm'].includes(e.id?.toLowerCase()) ||
        ['dancing', 'disco', 'party', 'rhythm'].includes(e.name?.toLowerCase())
    )) {
        activeAncient.push('spinal_cord');
    }
    
    return activeAncient;
}

export function selectSpeakingSkills(context, options = {}) {
    const settings = getSettings();
    const voiceSettings = settings?.voices || {};
    
    const { 
        minVoices = voiceSettings.minVoices || 1, 
        maxVoices = voiceSettings.maxVoicesPerTurn || 4 
    } = options;

    // Check for ancient voices first - NOW PROPERLY GATED
    const ancientVoicesToSpeak = [];
    const activeAncientIds = getActiveAncientVoices();
    
    for (const ancientId of activeAncientIds) {
        const ancient = ANCIENT_VOICES[ancientId];
        if (ancient) {
            const keywordMatch = ancient.triggerConditions.some(kw =>
                context.message.toLowerCase().includes(kw.toLowerCase())
            );
            // Higher chance if keywords match, lower otherwise (but still possible since conditions are already met)
            if (Math.random() < (keywordMatch ? 0.7 : 0.3)) {
                ancientVoicesToSpeak.push({
                    skillId: ancient.id,
                    skillName: ancient.name,
                    score: 1.0,
                    isAncient: true
                });
            }
        }
    }

    // Calculate relevance for all regular skills
    const allRelevance = Object.keys(SKILLS)
        .map(id => calculateSkillRelevance(id, context))
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
    
    // Get active statuses for effective level calculation
    const activeStatusIds = getActiveStatuses();

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
                effectiveLevel: getEffectiveSkillLevel(skillId, activeStatusIds)
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

    // Reset discovery context for this generation
    resetDiscoveryContext();
    
    // Get active status effects ONCE for all rolls
    const activeStatusIds = getActiveStatuses();
    
    console.log('[The Tribunal] Active statuses for roll modifiers:', activeStatusIds);

    const voiceData = selectedSkills.map(selected => {
        let checkResult = null;

        if (!selected.isAncient) {
            const checkDecision = determineCheckDifficulty(selected, context);
            if (checkDecision.shouldCheck) {
                // ═══════════════════════════════════════════════════════════
                // THIS IS THE KEY CHANGE - Use status modifiers in roll!
                // ═══════════════════════════════════════════════════════════
                const baseLevel = getSkillLevel(selected.skillId);
                
                // Roll with status modifiers applied
                checkResult = rollSkillCheckWithStatuses(
                    selected.skillId,           // Skill ID for modifier lookup
                    baseLevel,                  // Base skill level
                    checkDecision.difficulty,   // DC
                    activeStatusIds             // Active status effect IDs
                );
                
                // Log the modifier if any was applied
                if (checkResult.modifier !== 0) {
                    console.log(`[The Tribunal] ${selected.skillId}: base ${baseLevel} + status mod ${checkResult.modifier} = ${checkResult.effectiveSkill}`);
                }

                if (checkResult.isBoxcars) {
                    discoveryContext.criticalSuccesses[selected.skillId] = true;
                    recordCriticalSuccess(selected.skillId);
                }
                if (checkResult.isSnakeEyes) {
                    discoveryContext.criticalFailures[selected.skillId] = true;
                    recordCriticalFailure(selected.skillId);
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
            effectiveLevel: selected.isAncient ? 6 : getEffectiveSkillLevel(selected.skillId, activeStatusIds)
        };
    });

    const chorusPrompt = buildChorusPrompt(voiceData, context);

    console.log('[The Tribunal] Chorus prompt relationships:', 
        voiceData.filter(v => v.isCascade).map(v => `${v.skillId} -> ${v.respondingTo}`)
    );

    try {
        const response = await callAPI(chorusPrompt.system, chorusPrompt.user);
        const parsed = parseChorusResponse(response, voiceData);
        
        // Save generated voices to state
        setLastGeneratedVoices(parsed);
        
        // Mark awakened voices
        for (const voice of parsed) {
            awakenVoice(voice.skillId);
        }
        
        console.log('[The Tribunal] Generated', parsed.length, 'voice responses');
        return parsed;
    } catch (error) {
        console.error('[The Tribunal] Chorus generation failed:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTION: Full Generation Pipeline
// ═══════════════════════════════════════════════════════════════

/**
 * Complete voice generation from raw message text
 * @param {string} messageText - The scene/message to react to
 * @param {object} options - Optional overrides for voice count, etc.
 * @returns {Promise<array>} Generated voice results
 */
export async function generateVoicesForMessage(messageText, options = {}) {
    // 1. Analyze the context
    const context = analyzeContext(messageText);
    
    // 2. Select which skills will speak
    const selectedSkills = selectSpeakingSkills(context, options);
    
    if (selectedSkills.length === 0) {
        console.log('[The Tribunal] No skills selected to speak');
        return [];
    }
    
    // 3. Generate the voices
    return generateVoices(selectedSkills, context);
}
