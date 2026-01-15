/**
 * Prompt Builder for The Tribunal
 * Constructs system and user prompts for voice generation
 * Extracted from generation.js for maintainability
 */

import { SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, COPOTYPE_IDS } from '../data/statuses.js';
import {
    getReactionLine,
    getSkillDynamics
} from '../data/relationships.js';
import { extensionSettings, activeStatuses } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// COPOTYPE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get the active copotype (if any) and its voice style
 */
export function getActiveCopotype() {
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
// MAIN PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildChorusPrompt(voiceData, context) {
    const povStyle = extensionSettings.povStyle || 'second';
    const charName = extensionSettings.characterName || '';
    const pronouns = extensionSettings.characterPronouns || 'they';
    const characterContext = extensionSettings.characterContext || '';
    const scenePerspective = extensionSettings.scenePerspective || '';

    const charIdentity = charName || 'the character';
    const pronounMap = {
        'she': { subject: 'she', object: 'her', possessive: 'her' },
        'he': { subject: 'he', object: 'him', possessive: 'his' },
        'they': { subject: 'they', object: 'them', possessive: 'their' }
    };
    const charPronouns = pronounMap[pronouns] || pronounMap['they'];
    
    const povInstruction = buildPOVInstruction(povStyle, charIdentity, charPronouns);

    // Status context
    let statusContext = '';
    if (activeStatuses.size > 0) {
        const statusNames = [...activeStatuses]
            .map(id => id.replace(/_/g, ' '))
            .filter(Boolean)
            .join(', ');
        statusContext = `\nCurrent state: ${statusNames}.`;
    }

    // Copotype section
    let copotypeSection = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        copotypeSection = `

COPOTYPE ACTIVE: ${activeCopotype.name}
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

    // Voice descriptions
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

    // Build system prompt
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
