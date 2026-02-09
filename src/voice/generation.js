/**
 * The Tribunal - Voice Generation System
 * Context analysis, voice selection, API calls, and prompt building
 * 
 * Now with CASCADE SYSTEM - skills react to each other!
 * v0.3.3 - Removed unused imports (getVoiceState, getActiveCopotype)
 * 
 * REBUILD VERSION: Uses per-chat state accessors and new API helpers
 * 
 * FIXED: Ancient voice triggers now correctly use:
 * - The Pale (the_pale) → triggers BOTH Ancient Reptilian Brain AND Limbic System
 * - Party Combo (any 2 of: drunk/stimmed/manic) → triggers Spinal Cord
 */

import { SKILLS, ANCIENT_VOICES } from '../data/skills.js';
import { CASCADE_RULES, getCascadeResponders } from '../data/relationships.js';
import { rollSkillCheck, rollSkillCheckWithStatuses, determineCheckDifficulty, calculateStatusModifier } from '../systems/dice.js';
import { getResearchPenalties, recordCriticalSuccess, recordCriticalFailure, recordAncientVoiceTriggered } from '../systems/cabinet.js';

// Import from rebuild's state management
import { getSkillLevel, setLastGeneratedVoices, awakenVoice, getSettings, getVitals } from '../core/state.js';

// Import status handlers for active effects
import { getActiveStatuses } from '../ui/status-handlers.js';

// Import API helpers and prompt builder
import { callAPI, getAvailableProfiles } from './api-helpers.js';
import { analyzeContext, buildChorusPrompt } from './prompt-builder.js';

// Re-export for external use
export { callAPI, getAvailableProfiles, analyzeContext };

// ═══════════════════════════════════════════════════════════════
// ANCIENT VOICE TRIGGER DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * The Pale is the ONLY trigger for Ancient Reptilian Brain and Limbic System
 * They ALWAYS speak together during The Pale - never separately
 */
const PALE_TRIGGER = 'the_pale';

/**
 * Spinal Cord triggers on any 2 of these "party state" effects
 */
const PARTY_STATES = ['revacholian_courage', 'pyrholidon', 'tequila_sunset'];
const SPINAL_CORD_MIN_PARTY_STATES = 2;

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
 * FIXED: Get active ancient voices based on status effects
 * 
 * Ancient voice triggering rules:
 * - The Pale (the_pale) → BOTH Ancient Reptilian Brain AND Limbic System
 * - Party Combo (any 2 of drunk/stimmed/manic) → Spinal Cord
 * 
 * @returns {array} Array of active ancient voice IDs
 */
function getActiveAncientVoices() {
    const vitals = getVitals();
    const activeEffects = vitals.activeEffects || [];
    
    // Extract effect IDs (handle both string and object formats)
    const activeEffectIds = activeEffects.map(e => 
        typeof e === 'string' ? e : e.id
    ).filter(Boolean);
    
    const activeAncient = [];
    
    // ═══════════════════════════════════════════════════════════
    // THE PALE → Ancient Reptilian Brain + Limbic System (BOTH)
    // This is the ONLY way these two voices can speak
    // ═══════════════════════════════════════════════════════════
    if (activeEffectIds.includes(PALE_TRIGGER)) {
        console.log('[The Tribunal] The Pale detected - awakening ancient consciousness');
        activeAncient.push('ancient_reptilian_brain');
        activeAncient.push('limbic_system');
        
        // Record for thought cabinet / discovery system
        recordAncientVoiceTriggered?.('ancient_reptilian_brain');
        recordAncientVoiceTriggered?.('limbic_system');
    }
    
    // ═══════════════════════════════════════════════════════════
    // PARTY COMBO → Spinal Cord
    // Requires any 2 of: drunk (revacholian_courage), 
    //                    stimmed (pyrholidon), 
    //                    manic (tequila_sunset)
    // ═══════════════════════════════════════════════════════════
    const activePartyStates = PARTY_STATES.filter(state => 
        activeEffectIds.includes(state)
    );
    
    if (activePartyStates.length >= SPINAL_CORD_MIN_PARTY_STATES) {
        console.log('[The Tribunal] Party combo detected:', activePartyStates, '- awakening Spinal Cord');
        activeAncient.push('spinal_cord');
        
        // Record for thought cabinet / discovery system
        recordAncientVoiceTriggered?.('spinal_cord');
    }
    
    // Log what we found
    if (activeAncient.length > 0) {
        console.log('[The Tribunal] Active ancient voices:', activeAncient);
    }
    
    return activeAncient;
}

/**
 * Legacy function - kept for backwards compatibility but now just calls getActiveAncientVoices
 * @deprecated Use getActiveAncientVoices directly
 */
function shouldAllowAncientVoices() {
    return getActiveAncientVoices().length > 0;
}

/**
 * Select which skills will speak for this message
 * 
 * v0.3.2 FIX: Now properly enforces maxVoices as a TOTAL cap, not just primary voices.
 * Priority: Ancient voices > Primary voices > Cascade voices
 * 
 * @param {object} context - Analyzed message context
 * @param {object} options - Override options for min/max voices
 * @returns {array} Selected skills to generate voices for
 */
export function selectSpeakingSkills(context, options = {}) {
    const settings = getSettings();
    const voiceSettings = settings?.voices || {};
    
    const { 
        minVoices = voiceSettings.minVoices || 1, 
        maxVoices = voiceSettings.maxVoicesPerTurn || 4 
    } = options;

    // Check for ancient voices first - NOW CORRECTLY TRIGGERED
    const ancientVoicesToSpeak = [];
    const activeAncientIds = getActiveAncientVoices();
    
    for (const ancientId of activeAncientIds) {
        const ancient = ANCIENT_VOICES[ancientId];
        if (ancient) {
            // During The Pale or party states, ancient voices have HIGH chance to speak
            // They're already gated by status effects, so don't be too restrictive here
            const speakChance = ancient.triggerConditions?.some(kw =>
                context.message.toLowerCase().includes(kw.toLowerCase())
            ) ? 0.9 : 0.7; // High chance regardless - they're triggered for a reason
            
            if (Math.random() < speakChance) {
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

    // ═══════════════════════════════════════════════════════════════
    // FIX: Calculate remaining slots AFTER ancient voices
    // Ancient voices get priority, regular voices fill remaining slots
    // ═══════════════════════════════════════════════════════════════
    const remainingSlots = Math.max(minVoices, maxVoices - ancientVoicesToSpeak.length);

    // Determine number of PRIMARY voices based on intensity (within remaining slots)
    const intensity = Math.max(
        context.emotionalIntensity,
        context.dangerLevel,
        context.socialComplexity
    );
    const targetVoices = Math.min(
        remainingSlots,
        Math.round(minVoices + (maxVoices - minVoices) * intensity)
    );

    // Select PRIMARY skills
    const primarySkills = [];
    for (const relevance of allRelevance) {
        if (primarySkills.length >= targetVoices) break;
        if (Math.random() < relevance.score * 0.8 + 0.2) {
            primarySkills.push({ ...relevance, isPrimary: true });
        }
    }

    // Ensure minimum voices (if no ancient voices)
    const effectiveMin = ancientVoicesToSpeak.length > 0 ? 0 : minVoices;
    while (primarySkills.length < effectiveMin && allRelevance.length > 0) {
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

    // ═══════════════════════════════════════════════════════════════
    // FIX: Enforce TOTAL voice cap
    // Priority: Ancient voices > Primary voices > Cascade voices
    // ═══════════════════════════════════════════════════════════════
    const regularVoices = [...primarySkills, ...cascadeSkills.slice(0, CASCADE_RULES.maxCascadeVoices)];
    const slotsForRegular = Math.max(0, maxVoices - ancientVoicesToSpeak.length);
    
    const selected = [
        ...ancientVoicesToSpeak,
        ...regularVoices.slice(0, slotsForRegular)
    ];

    // Debug logging
    console.log(`[The Tribunal] Voice selection: ${ancientVoicesToSpeak.length} ancient + ${Math.min(regularVoices.length, slotsForRegular)} regular = ${selected.length} total (max: ${maxVoices})`);

    return selected;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

export function parseChorusResponse(response, voiceData) {
    const lines = response.trim().split('\n').filter(line => line.trim());
    const results = [];
    
    // ═══════════════════════════════════════════════════════════════
    // FIX: Only map SELECTED voices - don't accept hallucinated extras!
    // This ensures maxVoices cap is actually respected in output
    // ═══════════════════════════════════════════════════════════════
    const skillMap = {};
    const selectedSkillIds = new Set(voiceData.map(v => v.skillId));
    
    voiceData.forEach(v => {
        skillMap[v.skill.signature.toUpperCase()] = v;
        skillMap[v.skill.name.toUpperCase()] = v;
    });
    
    // NOTE: We intentionally do NOT add all skills to the map anymore.
    // If the AI hallucinates a skill that wasn't selected, it gets ignored.
    // This enforces the maxVoices cap on actual output.

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
            } else {
                // Log when we reject a hallucinated voice
                console.log('[Tribunal] Ignored non-selected voice:', match[1].trim());
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
    
    console.log(`[Tribunal] Parsed ${results.length} voice lines from ${voiceData.length} selected voices`);

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
        
        // ═══════════════════════════════════════════════════════════
        // CONTACT INTELLIGENCE HOOK - Fire and forget, NEVER blocks
        // This is a BONUS FEATURE - it must never break voice generation
        // ═══════════════════════════════════════════════════════════
        import('../systems/contact-intelligence.js')
            .then(ci => ci.updateContactIntelligence?.(parsed, context))
            .catch(() => {}); // Silent fail - voices are more important
        
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

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API - For other modules to check ancient voice state
// ═══════════════════════════════════════════════════════════════

/**
 * Check if ancient voices are currently active
 * @returns {boolean} True if any ancient voice is triggered
 */
export function areAncientVoicesActive() {
    return getActiveAncientVoices().length > 0;
}

/**
 * Get which ancient voices are currently triggered
 * @returns {string[]} Array of ancient voice IDs
 */
export function getTriggeredAncientVoices() {
    return getActiveAncientVoices();
}
