/**
 * Inland Empire - Voice Generation System
 * Context analysis, voice selection, API calls, and prompt building
 * 
 * Now with CASCADE SYSTEM - skills react to each other!
 * 
 * UPDATED: Uses SillyTavern's ConnectionManagerRequestService for API calls
 * instead of direct fetch (which gets blocked by CORS)
 * 
 * NOTE: Intrusive thoughts and object voices are now handled by
 * the discovery system (discovery.js v3) - objects are AI-generated
 */

import { SKILLS, ANCIENT_VOICES } from '../data/skills.js';
import { STATUS_EFFECTS, COPOTYPE_IDS } from '../data/statuses.js';
import {
    SKILL_DYNAMICS,
    CASCADE_RULES,
    getCascadeResponders,
    getReactionLine,
    getNickname,
    getSkillDynamics
} from '../data/relationships.js';
import {
    extensionSettings,
    activeStatuses,
    getEffectiveSkillLevel,
    getSkillLevel,
    getActiveAncientVoices,
    discoveryContext
} from '../core/state.js';
import { rollSkillCheck, determineCheckDifficulty } from '../systems/dice.js';
import { getResearchPenalties, hasSpecialEffect } from '../systems/cabinet.js';

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN CONNECTION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get SillyTavern context
 */
function getContext() {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
    }
    return null;
}

/**
 * Get profile ID by name from connection manager
 */
function getProfileIdByName(profileName) {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager) return null;
    
    const connectionManager = ctx.extensionSettings.connectionManager;
    
    // "current" = currently active profile
    if (profileName === 'current' || !profileName) {
        return connectionManager.selectedProfile;
    }
    
    // Find by name
    const profile = connectionManager.profiles?.find(p => p.name === profileName);
    return profile ? profile.id : connectionManager.selectedProfile;
}

/**
 * Get profile object by ID
 */
function getProfileById(profileId) {
    if (!profileId) return null;
    
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager) return null;
    
    return ctx.extensionSettings.connectionManager.profiles?.find(p => p.id === profileId) || null;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the active copotype (if any) and its voice style
 * Only one copotype can be active at a time due to mutual exclusivity
 */
function getActiveCopotype() {
    for (const statusId of activeStatuses) {
        if (COPOTYPE_IDS.includes(statusId)) {
            const copotype = STATUS_EFFECTS[statusId];
            if (copotype && copotype.voiceStyle) {
                return {
                    id: statusId,
                    name: copotype.name,
                    voiceStyle: copotype.voiceStyle
                };
            }
        }
    }
    return null;
}

export function analyzeContext(message) {
    const emotionalIndicators = [
        /!{2,}/, /\?{2,}/,
        /scream|shout|cry|sob|laugh/i,
        /furious|terrified|ecstatic/i
    ];
    const dangerIndicators = [
        /blood|wound|injury|hurt|pain/i,
        /gun|knife|weapon|attack|fight/i,
        /danger|threat|kill|die|death/i
    ];
    const socialIndicators = [
        /lie|lying|truth|honest|trust/i,
        /convince|persuade|manipulate/i,
        /feel|emotion|sad|happy|angry/i
    ];
    const mysteryIndicators = [
        /clue|evidence|investigate|discover/i,
        /secret|hidden|mystery|strange/i
    ];
    const physicalIndicators = [
        /room|building|street|place/i,
        /cold|hot|wind|rain/i,
        /machine|device|lock/i
    ];

    return {
        message,
        emotionalIntensity: emotionalIndicators.filter(r => r.test(message)).length / emotionalIndicators.length,
        dangerLevel: dangerIndicators.filter(r => r.test(message)).length / dangerIndicators.length,
        socialComplexity: socialIndicators.filter(r => r.test(message)).length / socialIndicators.length,
        mysteryLevel: mysteryIndicators.filter(r => r.test(message)).length / mysteryIndicators.length,
        physicalPresence: physicalIndicators.filter(r => r.test(message)).length / physicalIndicators.length
    };
}

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

    // ═══════════════════════════════════════════════════════════
    // CASCADE DETECTION - Who wants to respond?
    // ═══════════════════════════════════════════════════════════
    const cascadeSkills = [];
    
    for (const primary of primarySkills) {
        const responders = getCascadeResponders(primary.skillId, context.message);
        
        for (const responder of responders) {
            // Don't add if already in primary or cascade
            if (primarySkills.find(s => s.skillId === responder.skillId)) continue;
            if (cascadeSkills.find(s => s.skillId === responder.skillId)) continue;
            
            // Get skill data
            const skillData = SKILLS[responder.skillId];
            if (!skillData) continue;
            
            cascadeSkills.push({
                skillId: responder.skillId,
                skillName: skillData.name,
                score: 0.7, // Cascade skills get decent priority
                skillLevel: getSkillLevel(responder.skillId),
                attribute: skillData.attribute,
                isPrimary: false,
                isCascade: true,
                cascadeReason: responder.relationship,
                respondingTo: primary.skillId
            });
        }
    }

    // Combine: ancient voices + primary + cascade (limited)
    const selected = [
        ...ancientVoicesToSpeak,
        ...primarySkills,
        ...cascadeSkills.slice(0, CASCADE_RULES.maxCascadeVoices)
    ];

    return selected;
}

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP-AWARE PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build relationship context for the prompt
 * Tells the LLM who argues with whom, nicknames, etc.
 */
function buildRelationshipContext(voiceData) {
    const relationships = [];
    const nicknames = [];
    
    const skillIds = voiceData.map(v => v.skillId);
    
    for (const voice of voiceData) {
        if (voice.isAncient) continue;
        
        const dynamics = getSkillDynamics(voice.skillId);
        if (!dynamics) continue;
        
        // Find rivals present in this conversation
        const presentRivals = dynamics.rivals.filter(r => skillIds.includes(r));
        if (presentRivals.length > 0) {
            const rivalNames = presentRivals.map(r => SKILLS[r]?.signature || r).join(', ');
            relationships.push(`${voice.skill.signature} argues with ${rivalNames}`);
        }
        
        // Find allies present
        const presentAllies = dynamics.allies.filter(a => skillIds.includes(a));
        if (presentAllies.length > 0) {
            const allyNames = presentAllies.map(a => SKILLS[a]?.signature || a).join(', ');
            relationships.push(`${voice.skill.signature} supports ${allyNames}`);
        }
        
        // Collect nicknames
        if (dynamics.nicknames) {
            const playerNick = dynamics.nicknames['_player'];
            if (playerNick) {
                nicknames.push(`${voice.skill.signature} calls the character "${playerNick}"`);
            }
            
            for (const [target, nick] of Object.entries(dynamics.nicknames)) {
                if (target.startsWith('_')) continue;
                if (skillIds.includes(target)) {
                    const targetName = SKILLS[target]?.signature || target;
                    nicknames.push(`${voice.skill.signature} calls ${targetName} "${nick}"`);
                }
            }
        }
    }
    
    // Note cascade relationships
    const cascadeVoices = voiceData.filter(v => v.isCascade);
    for (const cascade of cascadeVoices) {
        const respondingToSkill = SKILLS[cascade.respondingTo];
        if (respondingToSkill) {
            relationships.push(
                `${cascade.skill.signature} is responding to ${respondingToSkill.signature} (${cascade.cascadeReason})`
            );
        }
    }
    
    return { relationships, nicknames };
}

/**
 * Get sample reaction lines to seed the prompt
 */
function getSampleReactions(voiceData) {
    const samples = [];
    
    for (const voice of voiceData) {
        if (voice.isAncient || !voice.isCascade) continue;
        
        const reactionLine = getReactionLine(voice.skillId, voice.respondingTo);
        if (reactionLine) {
            samples.push({
                skill: voice.skill.signature,
                line: reactionLine,
                respondingTo: SKILLS[voice.respondingTo]?.signature
            });
        }
    }
    
    return samples;
}

export function buildChorusPrompt(voiceData, context) {
    const povStyle = extensionSettings.povStyle || 'second';
    const charName = extensionSettings.characterName || '';
    const pronouns = extensionSettings.characterPronouns || 'they';
    const characterContext = extensionSettings.characterContext || '';
    const scenePerspective = extensionSettings.scenePerspective || '';

    // POV instruction - must clearly establish WHO the character is
    let povInstruction;
    const charIdentity = charName || 'the character';
    const pronounMap = {
        'she': { subject: 'she', object: 'her', possessive: 'her' },
        'he': { subject: 'he', object: 'him', possessive: 'his' },
        'they': { subject: 'they', object: 'them', possessive: 'their' }
    };
    const charPronouns = pronounMap[pronouns] || pronounMap['they'];
    
    if (povStyle === 'third') {
        povInstruction = `Write in THIRD PERSON about ${charIdentity}. Use "${charIdentity}" or "${charPronouns.subject}/${charPronouns.object}" - NEVER "you".`;
    } else if (povStyle === 'first') {
        povInstruction = `Write in FIRST PERSON. Use "I/me/my" - NEVER "you".`;
    } else {
        // Second person - need to be VERY clear about identity
        povInstruction = `Write in SECOND PERSON addressing ${charIdentity}.

IDENTITY RULES (READ CAREFULLY):
- ${charIdentity} = ALWAYS "you/your" in the output. NEVER use "${charPronouns.subject}/${charPronouns.object}" for ${charIdentity}.
- ${charIdentity}'s pronouns (${charPronouns.subject}/${charPronouns.object}) are provided for context only - since this is second person, ${charIdentity} is ALWAYS "you"
- These voices are INSIDE ${charIdentity}'s head, so ${charIdentity} = "you"

CRITICAL - SCENE TEXT CONVERSION:
- The scene text may be written from ANY perspective (narrator, NPC POV, etc.)
- If the scene says "he watched her kick" where "her" = ${charIdentity}, you MUST convert to "you kicked" or "your kick"
- ALWAYS translate third-person references to ${charIdentity} into second person ("you/your")
- Example: Scene says "Danny saw her miss" → Voice says "You missed" NOT "she missed"

OTHER CHARACTERS (NPCs):
- Other people are NEVER "you" - they are separate individuals observed by ${charIdentity}
- Determine NPC pronouns from the SCENE TEXT: look at their names, physical descriptions, how they're referred to
- Use he/him for male NPCs, she/her for female NPCs, they/them if unclear
- Do NOT apply ${charIdentity}'s pronouns (${charPronouns.subject}/${charPronouns.object}) to NPCs`;
    }

    // Context section - make it clear this defines WHO "you" is
    let contextSection = '';
    if (characterContext.trim()) {
        contextSection = `
WHO "YOU" IS (the character whose head these voices are in):
${characterContext}
---`;
    }
    
    // Scene perspective notes
    let perspectiveSection = '';
    if (scenePerspective.trim()) {
        perspectiveSection = `
SCENE PERSPECTIVE NOTES:
${scenePerspective}
---`;
    }

    // Status context
    let statusContext = '';
    if (activeStatuses.size > 0) {
        const statusNames = [...activeStatuses]
            .map(id => id.replace(/_/g, ' '))
            .filter(Boolean)
            .join(', ');
        statusContext = `\nCurrent state: ${statusNames}.`;
    }

    // Copotype voice flavor - influences HOW all voices speak
    let copotypeSection = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        copotypeSection = `

COPOTYPE ACTIVE: ${activeCopotype.name}
This colors HOW all voices speak. Voice style flavor: ${activeCopotype.voiceStyle}
All skills should lean into this vibe while keeping their individual personalities.`;
    }

    // ═══════════════════════════════════════════════════════════
    // Build relationship context
    // ═══════════════════════════════════════════════════════════
    const { relationships, nicknames } = buildRelationshipContext(voiceData);
    const sampleReactions = getSampleReactions(voiceData);
    
    let relationshipSection = '';
    if (relationships.length > 0 || nicknames.length > 0) {
        relationshipSection = '\nSKILL DYNAMICS (use these!):\n';
        if (relationships.length > 0) {
            relationshipSection += relationships.map(r => `• ${r}`).join('\n') + '\n';
        }
        if (nicknames.length > 0) {
            relationshipSection += 'Nicknames: ' + nicknames.join('; ') + '\n';
        }
    }
    
    let reactionExamples = '';
    if (sampleReactions.length > 0) {
        reactionExamples = '\nEXAMPLE REACTIONS (adapt these, don\'t copy verbatim):\n';
        for (const sample of sampleReactions) {
            reactionExamples += `• ${sample.skill} responding to ${sample.respondingTo}: "${sample.line}"\n`;
        }
    }

    // Voice descriptions with check info
    const voiceDescriptions = voiceData.map(v => {
        let checkInfo = '';
        if (v.checkResult) {
            if (v.checkResult.isBoxcars) checkInfo = ' [CRITICAL SUCCESS - profound insight]';
            else if (v.checkResult.isSnakeEyes) checkInfo = ' [CRITICAL FAILURE - hilariously wrong]';
            else if (v.checkResult.success) checkInfo = ' [Success]';
            else checkInfo = ' [Failed - uncertain/bad advice]';
        } else if (v.isAncient) {
            checkInfo = ' [PRIMAL - speaks in fragments, poetically]';
        } else if (v.isCascade) {
            checkInfo = ` [REACTING to ${SKILLS[v.respondingTo]?.signature || v.respondingTo}]`;
        } else {
            checkInfo = ' [Passive]';
        }

        return `${v.skill.signature}${checkInfo}: ${v.skill.personality}`;
    }).join('\n\n');

    const systemPrompt = `You generate internal mental voices for a roleplayer, inspired by Disco Elysium's skill system.

THE VOICES SPEAKING THIS ROUND:
${voiceDescriptions}
${relationshipSection}${reactionExamples}
CRITICAL RULES:
1. ${povInstruction}
2. SCENE TEXT CONVERSION: The scene may describe ${charIdentity} in third person ("she kicked", "her foot"). CONVERT these to "you kicked", "your foot" in your output.
3. Voices MUST react to each other - argue, agree, interrupt, use nicknames!
4. Format EXACTLY as: SKILL_NAME - dialogue
5. Keep each line 1-2 sentences MAX
6. Failed checks = uncertain/wrong/bad advice
7. Critical success = profound insight. Critical failure = hilariously wrong
8. Ancient/Primal voices speak in fragments, poetically
9. CASCADE voices are RESPONDING to another voice - make this clear!
10. Let skills interrupt and talk over each other
11. Total: 4-12 voice lines, with back-and-forth exchanges
${contextSection}${perspectiveSection}${statusContext}${copotypeSection}

Output ONLY voice dialogue. No narration or explanation. Make them ARGUE and REACT.`;

    return {
        system: systemPrompt,
        user: `Scene: "${context.message.substring(0, 800)}"\n\nGenerate the internal chorus. Include skill arguments and reactions.`
    };
}

// ═══════════════════════════════════════════════════════════════
// API CALLS - Using SillyTavern's Connection Manager
// ═══════════════════════════════════════════════════════════════

/**
 * Make API call using SillyTavern's ConnectionManagerRequestService
 * This routes through ST's backend, avoiding CORS issues
 */
export async function callAPI(systemPrompt, userPrompt) {
    const ctx = getContext();
    
    // Try ConnectionManagerRequestService first (preferred method)
    if (ctx?.ConnectionManagerRequestService) {
        return await callAPIViaConnectionManager(ctx, systemPrompt, userPrompt);
    }
    
    // Fallback to generateRaw if available
    if (typeof window !== 'undefined' && window.generateRaw) {
        console.log('[The Tribunal] Using generateRaw fallback');
        return await callAPIViaGenerateRaw(systemPrompt, userPrompt);
    }
    
    // Last resort: try direct fetch (will fail with CORS for most APIs)
    console.warn('[The Tribunal] No ST connection methods available, trying direct fetch (may fail due to CORS)');
    return await callAPIDirectFetch(systemPrompt, userPrompt);
}

/**
 * Call API via SillyTavern's ConnectionManagerRequestService
 */
async function callAPIViaConnectionManager(ctx, systemPrompt, userPrompt) {
    // Get profile - use extension setting or current
    const profileName = extensionSettings.connectionProfile || 'current';
    const profileId = getProfileIdByName(profileName);
    
    if (!profileId) {
        throw new Error('No connection profile available. Please set up a connection in SillyTavern.');
    }
    
    console.log('[The Tribunal] Using ConnectionManagerRequestService with profile:', profileName);
    
    try {
        const response = await ctx.ConnectionManagerRequestService.sendRequest(
            profileId,
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            extensionSettings.maxTokens || 600,
            {
                extractData: true,
                includePreset: true,
                includeInstruct: false  // Skip instruct templates for clean prompts
            },
            {
                temperature: extensionSettings.temperature || 0.9
            }
        );
        
        if (!response?.content) {
            throw new Error('Empty response from ConnectionManagerRequestService');
        }
        
        return response.content;
    } catch (error) {
        console.error('[The Tribunal] ConnectionManagerRequestService failed:', error);
        throw new Error(`API call failed: ${error.message}`);
    }
}

/**
 * Fallback: Call API via SillyTavern's generateRaw
 * This uses the main chat connection
 */
async function callAPIViaGenerateRaw(systemPrompt, userPrompt) {
    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    
    try {
        const result = await window.generateRaw(
            combinedPrompt,
            null,
            false,
            false,
            '',
            extensionSettings.maxTokens || 600
        );
        
        return result || '';
    } catch (error) {
        console.error('[The Tribunal] generateRaw failed:', error);
        throw error;
    }
}

/**
 * Last resort: Direct fetch (will fail with CORS for most external APIs)
 * Only works if the API has permissive CORS headers
 */
async function callAPIDirectFetch(systemPrompt, userPrompt) {
    let { apiEndpoint, apiKey, model, maxTokens, temperature } = extensionSettings;

    if (!apiEndpoint || !apiKey) {
        throw new Error('API not configured - check settings or use SillyTavern connection profiles');
    }

    // Strip trailing slashes and append the correct path
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');

    console.log('[The Tribunal] Direct fetch to:', apiEndpoint, 'Model:', model);

    let response;
    try {
        response = await fetch(apiEndpoint + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'glm-4-plus',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: maxTokens || 600,
                temperature: temperature || 0.9
            })
        });
    } catch (fetchError) {
        throw new Error(`Network error (likely CORS): ${fetchError.message}. Consider using SillyTavern connection profiles instead.`);
    }

    if (!response.ok) {
        let errorDetail = '';
        try {
            const errorBody = await response.text();
            errorDetail = errorBody.substring(0, 200);
        } catch (e) {}
        throw new Error(`API ${response.status}: ${errorDetail || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ||
           data.choices?.[0]?.text ||
           data.content || '';
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

export function parseChorusResponse(response, voiceData) {
    const lines = response.trim().split('\n').filter(line => line.trim());
    const results = [];

    // Build skill map for matching
    const skillMap = {};
    voiceData.forEach(v => {
        skillMap[v.skill.signature.toUpperCase()] = v;
        skillMap[v.skill.name.toUpperCase()] = v;
    });
    
    // Also add all skills for unexpected voices (cascades might generate extras)
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
        // Match patterns like "SKILL_NAME - dialogue" or "SKILL_NAME: dialogue"
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

    // Fallback if no lines parsed
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

    // Prepare voice data with checks
    const voiceData = selectedSkills.map(selected => {
        let checkResult = null;

        if (!selected.isAncient) {
            const checkDecision = determineCheckDifficulty(selected, context);
            if (checkDecision.shouldCheck) {
                const effectiveLevel = getEffectiveSkillLevel(selected.skillId, researchPenalties);
                checkResult = rollSkillCheck(effectiveLevel, checkDecision.difficulty);

                // Record criticals for thought discovery
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

    // Build and send prompt
    const chorusPrompt = buildChorusPrompt(voiceData, context);

    // Debug: Log the prompt relationships
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
