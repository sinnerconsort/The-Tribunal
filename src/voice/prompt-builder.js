/**
 * The Tribunal - Prompt Builder
 * Constructs system and user prompts for voice generation
 * 
 * REBUILD VERSION: Uses per-chat state accessors instead of global settings
 * This fixes the POV bug where pronouns weren't persisting per-chat!
 * 
 * @version 1.1.0 - Setting Profile integration (agnosticism refactor)
 * COMPATIBILITY: Also checks old extensionSettings location as fallback
 */

import { SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, COPOTYPE_IDS } from '../data/statuses.js';
import { getReactionLine, getSkillDynamics } from '../data/relationships.js';

// Import from rebuild's state management
import { getPersona, getVitals, getSettings } from '../core/state.js';

// Setting profile system — personality text & prompt flavor
import { getSkillPersonality, getAncientPersonality, getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// COPOTYPE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get the active copotype (if any) and its voice style
 */
export function getActiveCopotype() {
    const vitals = getVitals();
    
    // Check if copotype is set directly
    if (vitals.copotype) {
        const copotype = STATUS_EFFECTS[vitals.copotype];
        if (copotype?.voiceStyle) {
            return {
                id: vitals.copotype,
                name: copotype.name,
                voiceStyle: copotype.voiceStyle
            };
        }
    }
    
    // Fallback: check activeEffects for copotype status
    const activeEffects = vitals.activeEffects || [];
    for (const effect of activeEffects) {
        const effectId = typeof effect === 'string' ? effect : effect.id;
        if (COPOTYPE_IDS?.includes(effectId)) {
            const copotype = STATUS_EFFECTS[effectId];
            if (copotype?.voiceStyle) {
                return {
                    id: effectId,
                    name: copotype.name,
                    voiceStyle: copotype.voiceStyle
                };
            }
        }
    }
    
    return null;
}

/**
 * Get active status effect IDs from vitals
 * @returns {Set} Set of active effect IDs
 */
function getActiveStatusIds() {
    const vitals = getVitals();
    const activeEffects = vitals.activeEffects || [];
    
    // Convert to Set for compatibility with old code patterns
    const ids = new Set();
    for (const effect of activeEffects) {
        const effectId = typeof effect === 'string' ? effect : effect.id;
        if (effectId) ids.add(effectId);
    }
    
    return ids;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ANALYSIS
// ═══════════════════════════════════════════════════════════════

const EMOTIONAL_INDICATORS = [
    /!{2,}/, /\?{2,}/,
    /scream|shout|cry|sob|laugh/i,
    /furious|terrified|ecstatic/i
];

const DANGER_INDICATORS = [
    /blood|wound|injury|hurt|pain/i,
    /gun|knife|weapon|attack|fight/i,
    /danger|threat|kill|die|death/i
];

const SOCIAL_INDICATORS = [
    /lie|lying|truth|honest|trust/i,
    /convince|persuade|manipulate/i,
    /feel|emotion|sad|happy|angry/i
];

const MYSTERY_INDICATORS = [
    /clue|evidence|investigate|discover/i,
    /secret|hidden|mystery|strange/i
];

const PHYSICAL_INDICATORS = [
    /room|building|street|place/i,
    /cold|hot|wind|rain/i,
    /machine|device|lock/i
];

export function analyzeContext(message) {
    return {
        message,
        emotionalIntensity: EMOTIONAL_INDICATORS.filter(r => r.test(message)).length / EMOTIONAL_INDICATORS.length,
        dangerLevel: DANGER_INDICATORS.filter(r => r.test(message)).length / DANGER_INDICATORS.length,
        socialComplexity: SOCIAL_INDICATORS.filter(r => r.test(message)).length / SOCIAL_INDICATORS.length,
        mysteryLevel: MYSTERY_INDICATORS.filter(r => r.test(message)).length / MYSTERY_INDICATORS.length,
        physicalPresence: PHYSICAL_INDICATORS.filter(r => r.test(message)).length / PHYSICAL_INDICATORS.length
    };
}

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP CONTEXT BUILDING
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

// ═══════════════════════════════════════════════════════════════
// POV INSTRUCTION BUILDING
// ═══════════════════════════════════════════════════════════════

function buildPOVInstruction(povStyle, charIdentity, charPronouns) {
    if (povStyle === 'third') {
        return `Write in THIRD PERSON about ${charIdentity}. Use "${charIdentity}" or "${charPronouns.subject}/${charPronouns.object}" - NEVER "you".`;
    } else if (povStyle === 'first') {
        return `Write in FIRST PERSON. Use "I/me/my" - NEVER "you".`;
    } else {
        return `Write in SECOND PERSON addressing ${charIdentity}.

IDENTITY RULES (READ CAREFULLY):
- ${charIdentity} = ALWAYS "you/your" in the output. NEVER use "${charPronouns.subject}/${charPronouns.object}" for ${charIdentity}.
- ${charIdentity}'s pronouns (${charPronouns.subject}/${charPronouns.object}) are provided for context only - since this is second person, ${charIdentity} is ALWAYS "you"
- These voices are INSIDE ${charIdentity}'s head, so ${charIdentity} = "you"

CRITICAL - NEVER REFER TO THE PLAYER CHARACTER BY NAME:
- WRONG: "This '${charIdentity}' is dangerous" or "Look at ${charIdentity}" 
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
}

// ═══════════════════════════════════════════════════════════════
// PERSONA DATA RETRIEVAL (with backwards compatibility)
// ═══════════════════════════════════════════════════════════════

/**
 * Get persona/POV data with fallback to old extensionSettings location
 * This ensures compatibility during migration from old to new state structure
 */
function getPersonaWithFallback() {
    const persona = getPersona();
    const settings = getSettings();
    
    // Build merged persona, preferring per-chat (new) over global (old)
    return {
        // New location (persona.*) takes priority, fallback to old location (settings.*)
        name: persona.name || settings.characterName || '',
        pronouns: persona.pronouns || settings.characterPronouns || 'they',
        povStyle: persona.povStyle || settings.povStyle || 'second',
        context: persona.context || settings.characterContext || '',
        sceneNotes: persona.sceneNotes || settings.scenePerspective || ''
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildChorusPrompt(voiceData, context) {
    // === KEY FIX: Check BOTH locations with fallback ===
    const persona = getPersonaWithFallback();
    const settings = getSettings();
    
    const povStyle = persona.povStyle;
    const charName = persona.name;
    const pronouns = persona.pronouns;
    const characterContext = persona.context;
    const scenePerspective = persona.sceneNotes;

    const charIdentity = charName || 'the character';
    const pronounMap = {
        'she': { subject: 'she', object: 'her', possessive: 'her' },
        'he': { subject: 'he', object: 'him', possessive: 'his' },
        'they': { subject: 'they', object: 'them', possessive: 'their' }
    };
    const charPronouns = pronounMap[pronouns] || pronounMap['they'];
    
    const povInstruction = buildPOVInstruction(povStyle, charIdentity, charPronouns);

    // Status context - now reads from per-chat vitals
    let statusContext = '';
    const activeStatuses = getActiveStatusIds();
    if (activeStatuses.size > 0) {
        const statusNames = [...activeStatuses]
            .map(id => id.replace(/_/g, ' '))
            .filter(Boolean)
            .join(', ');
        statusContext = `\nCurrent state: ${statusNames}.`;
    }

    // Copotype section — uses profile's archetype label
    let copotypeSection = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        const archetypeLabel = getProfileValue('archetypeLabel', 'Copotype');
        copotypeSection = `

${archetypeLabel.toUpperCase()} ACTIVE: ${activeCopotype.name}
This colors HOW all voices speak. Voice style flavor: ${activeCopotype.voiceStyle}
All skills should lean into this vibe while keeping their individual personalities.`;
    }

    // Relationship context
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

    // Voice descriptions — now pulls personality from setting profile
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

        // Profile personality → skill.personality fallback
        const personality = v.isAncient
            ? (getAncientPersonality(v.skillId) || v.skill.personality)
            : (getSkillPersonality(v.skillId) || v.skill.personality);
        return `${v.skill.signature}${checkInfo}: ${personality}`;
    }).join('\n\n');

    // Build system prompt — uses profile's system intro
    const systemPrompt = `${getProfileValue('systemIntro')}

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
7. Total: EXACTLY ${voiceData.length} voice lines (one per voice listed above)
8. ONLY use the voices listed above - do NOT add any other skills
${statusContext}${copotypeSection}

Output ONLY voice dialogue. No narration or explanation.`;

    return {
        system: systemPrompt,
        user: `Scene to react to: "${context.message.substring(0, 800)}"

REMEMBER: You are voices in ${charIdentity}'s head. If this scene is written from someone else's POV, translate it to what ${charIdentity} OBSERVES from the outside.

Generate the internal chorus.`
    };
}
