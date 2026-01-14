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
 * Get available connection profiles for UI dropdown
 */
export function getAvailableProfiles() {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager?.profiles) {
        return [];
    }
    return ctx.extensionSettings.connectionManager.profiles.map(p => ({
        id: p.id,
        name: p.name
    }));
}

/**
 * Get profile ID by name from connection manager
 */
function getProfileIdByName(profileName) {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager) {
        console.log('[The Tribunal] No connection manager found');
        return null;
    }
    
    const connectionManager = ctx.extensionSettings.connectionManager;
    
    // "current" or empty = currently active profile
    if (profileName === 'current' || !profileName) {
        console.log('[The Tribunal] Using current profile:', connectionManager.selectedProfile);
        return connectionManager.selectedProfile;
    }
    
    // Find by name
    const profile = connectionManager.profiles?.find(p => p.name === profileName);
    if (profile) {
        console.log('[The Tribunal] Found profile by name:', profile.name, profile.id);
        return profile.id;
    }
    
    // Fallback to current
    console.log('[The Tribunal] Profile not found, using current:', connectionManager.selectedProfile);
    return connectionManager.selectedProfile;
}

/**
 * Extract text content from various response formats
 */
function extractResponseContent(response) {
    if (!response) return null;
    
    // If it's already a string, return it
    if (typeof response === 'string') {
        return response;
    }
    
    // Try various known response formats
    // Format 1: { content: "..." }
    if (response.content && typeof response.content === 'string') {
        return response.content;
    }
    
    // Format 2: { text: "..." }
    if (response.text && typeof response.text === 'string') {
        return response.text;
    }
    
    // Format 3: { message: "..." }
    if (response.message && typeof response.message === 'string') {
        return response.message;
    }
    
    // Format 4: { message: { content: "..." } }
    if (response.message?.content) {
        return response.message.content;
    }
    
    // Format 5: OpenAI-style { choices: [{ message: { content: "..." } }] }
    if (response.choices?.[0]?.message?.content) {
        return response.choices[0].message.content;
    }
    
    // Format 6: { choices: [{ text: "..." }] }
    if (response.choices?.[0]?.text) {
        return response.choices[0].text;
    }
    
    // Format 7: { data: { content: "..." } }
    if (response.data?.content) {
        return response.data.content;
    }
    
    // Format 8: { response: "..." }
    if (response.response && typeof response.response === 'string') {
        return response.response;
    }
    
    // Last resort: stringify and log for debugging
    console.warn('[The Tribunal] Unknown response format:', JSON.stringify(response).substring(0, 500));
    return null;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the active copotype (if any) and its voice style
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
// RELATIONSHIP-AWARE PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

function buildRelationshipContext(voiceData) {
    const relationships = [];
    const nicknames = [];
    
    const skillIds = voiceData.map(v => v.skillId);
    
    for (const voice of voiceData) {
        if (voice.isAncient) continue;
        
        const dynamics = getSkillDynamics(voice.skillId);
        if (!dynamics) continue;
        
        const presentRivals = dynamics.rivals.filter(r => skillIds.includes(r));
        if (presentRivals.length > 0) {
            const rivalNames = presentRivals.map(r => SKILLS[r]?.signature || r).join(', ');
            relationships.push(`${voice.skill.signature} argues with ${rivalNames}`);
        }
        
        const presentAllies = dynamics.allies.filter(a => skillIds.includes(a));
        if (presentAllies.length > 0) {
            const allyNames = presentAllies.map(a => SKILLS[a]?.signature || a).join(', ');
            relationships.push(`${voice.skill.signature} supports ${allyNames}`);
        }
        
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
        povInstruction = `Write in SECOND PERSON addressing ${charIdentity}.

IDENTITY RULES (READ CAREFULLY):
- ${charIdentity} = ALWAYS "you/your" in the output. NEVER use "${charPronouns.subject}/${charPronouns.object}" for ${charIdentity}.
- ${charIdentity}'s pronouns (${charPronouns.subject}/${charPronouns.object}) are provided for context only - since this is second person, ${charIdentity} is ALWAYS "you"
- These voices are INSIDE ${charIdentity}'s head, so ${charIdentity} = "you"

CRITICAL - NEVER REFER TO THE PLAYER CHARACTER BY NAME:
- WRONG: "This 'Ristel' is dangerous" or "Look at ${charIdentity}" 
- RIGHT: "You are dangerous" or "Look at yourself"
- The character name "${charIdentity}" is ONLY for your context - NEVER use it in your output
- You ARE ${charIdentity}. Talking about "${charIdentity}" in third person is ALWAYS wrong.

SCENE TEXT CONVERSION:
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

    let contextSection = '';
    if (characterContext.trim()) {
        contextSection = `
WHO "YOU" IS (the character whose head these voices are in):
${characterContext}
---`;
    }
    
    let perspectiveSection = '';
    if (scenePerspective.trim()) {
        perspectiveSection = `
SCENE PERSPECTIVE NOTES:
${scenePerspective}
---`;
    }

    let statusContext = '';
    if (activeStatuses.size > 0) {
        const statusNames = [...activeStatuses]
            .map(id => id.replace(/_/g, ' '))
            .filter(Boolean)
            .join(', ');
        statusContext = `\nCurrent state: ${statusNames}.`;
    }

    let copotypeSection = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        copotypeSection = `

COPOTYPE ACTIVE: ${activeCopotype.name}
This colors HOW all voices speak. Voice style flavor: ${activeCopotype.voiceStyle}
All skills should lean into this vibe while keeping their individual personalities.`;
    }

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

═══════════════════════════════════════════════════════════════
CRITICAL IDENTITY - READ THIS FIRST
═══════════════════════════════════════════════════════════════
${characterContext.trim() ? `THE PLAYER CHARACTER (whose head these voices are in):
${characterContext}

` : ''}${scenePerspective.trim() ? `SCENE PERSPECTIVE WARNING:
${scenePerspective}

` : ''}${povInstruction}

THE SCENE TEXT MAY BE WRITTEN FROM AN NPC'S PERSPECTIVE.
If the scene describes an NPC's feelings, sensations, or internal state - those are NOT "you".
"You" is ONLY ${charIdentity}. The voices observe NPCs from the OUTSIDE.

Example: If scene says "Gortash felt the impact" - voices should say "Look at him flinch" NOT "You felt the impact"
Example: If scene says "his back hit the wall" (about an NPC) - voices say "He hit that wall hard" NOT "Your back hit the wall"

═══════════════════════════════════════════════════════════════
THE VOICES SPEAKING THIS ROUND
═══════════════════════════════════════════════════════════════
${voiceDescriptions}
${relationshipSection}${reactionExamples}

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════
1. Format EXACTLY as: SKILL_NAME - dialogue
2. Keep each line 1-2 sentences MAX
3. Voices MUST react to each other - argue, agree, interrupt!
4. Failed checks = uncertain/wrong/bad advice
5. Critical success = profound insight. Critical failure = hilariously wrong
6. OBSERVE NPCs from the outside - what you SEE them do, not what they feel
7. Total: 4-12 voice lines with back-and-forth exchanges
${statusContext}${copotypeSection}

Output ONLY voice dialogue. No narration or explanation.`;

    return {
        system: systemPrompt,
        user: `Scene to react to: "${context.message.substring(0, 800)}"

REMEMBER: You are voices in ${charIdentity}'s head. If this scene is written from someone else's POV, translate it to what ${charIdentity} OBSERVES from the outside.

Generate the internal chorus.`
    };
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

/**
 * Main API call function - tries multiple methods
 */
export async function callAPI(systemPrompt, userPrompt) {
    const ctx = getContext();
    const useSTConnection = extensionSettings.connectionProfile && extensionSettings.connectionProfile !== 'none';
    
    console.log('[The Tribunal] API call config:', {
        connectionProfile: extensionSettings.connectionProfile,
        useSTConnection,
        hasConnectionManager: !!ctx?.ConnectionManagerRequestService
    });
    
    // Method 1: Use ST Connection Manager if configured
    if (useSTConnection && ctx?.ConnectionManagerRequestService) {
        try {
            return await callAPIViaConnectionManager(ctx, systemPrompt, userPrompt);
        } catch (err) {
            console.error('[The Tribunal] ConnectionManager failed:', err);
            // Fall through to direct fetch
        }
    }
    
    // Method 2: Direct fetch with extension's own API settings
    return await callAPIDirectFetch(systemPrompt, userPrompt);
}

/**
 * Call API via SillyTavern's ConnectionManagerRequestService
 */
async function callAPIViaConnectionManager(ctx, systemPrompt, userPrompt) {
    const profileName = extensionSettings.connectionProfile || 'current';
    const profileId = getProfileIdByName(profileName);
    
    if (!profileId) {
        throw new Error('No connection profile found');
    }
    
    console.log('[The Tribunal] Calling via ConnectionManager, profile:', profileName, 'id:', profileId);
    
    const response = await ctx.ConnectionManagerRequestService.sendRequest(
        profileId,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        extensionSettings.maxTokens || 600,
        {
            extractData: true,
            includePreset: false,  // Don't inherit RP preset - we provide our own system prompt
            includeInstruct: false
        },
        {
            temperature: extensionSettings.temperature || 0.9
        }
    );
    
    console.log('[The Tribunal] Raw response type:', typeof response);
    console.log('[The Tribunal] Raw response keys:', response ? Object.keys(response) : 'null');
    
    const content = extractResponseContent(response);
    
    if (!content) {
        console.error('[The Tribunal] Could not extract content from response:', response);
        throw new Error('Empty response from ConnectionManagerRequestService');
    }
    
    console.log('[The Tribunal] Extracted content length:', content.length);
    return content;
}

/**
 * Direct fetch to external API
 */
async function callAPIDirectFetch(systemPrompt, userPrompt) {
    let { apiEndpoint, apiKey, model, maxTokens, temperature } = extensionSettings;

    if (!apiEndpoint || !apiKey) {
        throw new Error('API not configured. Set API endpoint and key in settings, or select a ST connection profile.');
    }

    // Strip trailing slashes
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');
    
    // Ensure we have the full path
    const fullUrl = apiEndpoint.includes('/chat/completions') 
        ? apiEndpoint 
        : apiEndpoint + '/chat/completions';

    console.log('[The Tribunal] Direct fetch to:', fullUrl, 'Model:', model);

    let response;
    try {
        response = await fetch(fullUrl, {
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
        console.error('[The Tribunal] Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. This may be a CORS issue - try using a ST connection profile instead.`);
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
    const content = extractResponseContent(data);
    
    if (!content) {
        throw new Error('Empty response from API');
    }
    
    return content;
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
