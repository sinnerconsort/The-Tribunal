/**
 * Inland Empire - Discovery System v3
 * "Slay the Princess" style narrated investigations
 * 
 * FEATURES:
 * - One narrator skill describes the scene through their lens
 * - 2-4 skill reactors comment beneath
 * - RNG chance for ONE dynamic object voice (AI-generated, context-aware)
 * - POV support (second/third/first person from settings)
 * - Skill checks affect narrator reliability
 */

import { SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, COPOTYPE_IDS } from '../data/statuses.js';
import { extensionSettings, saveState, getEffectiveSkillLevel, activeStatuses } from '../core/state.js';
import { callAPI } from './generation.js';
import { rollSkillCheck } from '../systems/dice.js';
import { getResearchPenalties } from '../systems/cabinet.js';

// Extracted data
import { 
    NARRATOR_CONTEXTS, 
    DEFAULT_NARRATOR_SKILLS,
    getObjectIcon,
    getNarratorDifficulty,
    getDifficultyName 
} from '../data/discovery-contexts.js';

// Extracted UI
import {
    setContextRef,
    setCurrentInvestigation,
    getCurrentInvestigation,
    updateScenePreview,
    createThoughtBubbleFAB as createFABBase,
    createDiscoveryModal as createModalBase,
    toggleDiscoveryModal as toggleModalBase,
    renderInvestigation,
    setInvestigateButtonLoading,
    updateEmptyState,
    setFABScanning,
    showFABSuccess
} from '../ui/discovery-ui.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let lastSceneContext = '';
let isInvestigating = false;
let getContextRef = null;

// ═══════════════════════════════════════════════════════════════
// COPOTYPE DETECTION
// ═══════════════════════════════════════════════════════════════

function getActiveCopotype() {
    for (const statusId of activeStatuses) {
        if (COPOTYPE_IDS && COPOTYPE_IDS.includes(statusId)) {
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
// SCENE CONTEXT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function updateSceneContext(text) {
    lastSceneContext = text;
    updateScenePreview(text);
}

export function getSceneContext() {
    return lastSceneContext;
}

export function ensureSceneContext(getContext) {
    if (lastSceneContext) return lastSceneContext;
    
    const context = getContext?.();
    if (context?.chat?.length) {
        for (let i = context.chat.length - 1; i >= 0; i--) {
            const msg = context.chat[i];
            if (!msg.is_user && msg.mes) {
                lastSceneContext = msg.mes;
                updateScenePreview(lastSceneContext);
                return lastSceneContext;
            }
        }
    }
    return '';
}

// ═══════════════════════════════════════════════════════════════
// NARRATOR SELECTION
// ═══════════════════════════════════════════════════════════════

function analyzeSceneContext(sceneText) {
    const lowerScene = sceneText.toLowerCase();
    const contextScores = {};
    
    for (const [contextId, context] of Object.entries(NARRATOR_CONTEXTS)) {
        const matches = context.keywords.filter(kw => lowerScene.includes(kw));
        if (matches.length > 0) {
            contextScores[contextId] = {
                score: matches.length,
                matches: matches,
                primary: context.primary,
                secondary: context.secondary
            };
        }
    }
    
    return contextScores;
}

function selectNarrator(sceneText) {
    const researchPenalties = getResearchPenalties();
    const contextScores = analyzeSceneContext(sceneText);
    
    const narratorPool = [];
    
    // Add narrators based on context matches
    for (const [contextId, data] of Object.entries(contextScores)) {
        // Primary narrators get high weight
        for (const skillId of data.primary) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getEffectiveSkillLevel(skillId, researchPenalties);
            const existing = narratorPool.find(n => n.skillId === skillId);
            
            if (existing) {
                existing.weight += data.score * 3 + level;
                existing.contexts.push(contextId);
                existing.relevance = 'primary';
            } else {
                narratorPool.push({
                    skillId,
                    skill,
                    level,
                    weight: data.score * 3 + level,
                    contexts: [contextId],
                    relevance: 'primary'
                });
            }
        }
        
        // Secondary narrators get medium weight
        for (const skillId of data.secondary) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getEffectiveSkillLevel(skillId, researchPenalties);
            const existing = narratorPool.find(n => n.skillId === skillId);
            
            if (existing) {
                existing.weight += data.score * 1.5 + level * 0.5;
                if (existing.relevance !== 'primary') {
                    existing.contexts.push(contextId);
                    existing.relevance = 'secondary';
                }
            } else {
                narratorPool.push({
                    skillId,
                    skill,
                    level,
                    weight: data.score * 1.5 + level * 0.5,
                    contexts: [contextId],
                    relevance: 'secondary'
                });
            }
        }
    }
    
    // Fallback to default narrators if no context matches
    if (narratorPool.length === 0) {
        for (const skillId of DEFAULT_NARRATOR_SKILLS) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getEffectiveSkillLevel(skillId, researchPenalties);
            narratorPool.push({
                skillId,
                skill,
                level,
                weight: level + Math.random() * 3,
                contexts: [],
                relevance: 'neutral'
            });
        }
    }
    
    // Sort by weight and select
    narratorPool.sort((a, b) => b.weight - a.weight);
    
    const topCandidates = narratorPool.slice(0, Math.min(5, narratorPool.length));
    const totalWeight = topCandidates.reduce((sum, n) => sum + n.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const candidate of topCandidates) {
        random -= candidate.weight;
        if (random <= 0) {
            return candidate;
        }
    }
    
    return topCandidates[0];
}

// ═══════════════════════════════════════════════════════════════
// REACTOR SELECTION
// ═══════════════════════════════════════════════════════════════

function selectReactors(sceneText, narratorSkillId) {
    const researchPenalties = getResearchPenalties();
    const reactorPool = [];
    const lowerScene = sceneText.toLowerCase();
    
    for (const [skillId, skill] of Object.entries(SKILLS)) {
        if (skillId === narratorSkillId) continue;
        
        const level = getEffectiveSkillLevel(skillId, researchPenalties);
        
        const triggerMatches = skill.triggerConditions.filter(tc => 
            lowerScene.includes(tc.toLowerCase())
        ).length;
        
        if (triggerMatches > 0 || level >= 4 || Math.random() < 0.1) {
            reactorPool.push({
                id: skillId,
                name: skill.name,
                signature: skill.signature,
                color: skill.color,
                level,
                weight: triggerMatches * 2.5 + level + Math.random() * 2,
                isSkill: true,
                personality: skill.personality
            });
        }
    }
    
    reactorPool.sort((a, b) => b.weight - a.weight);
    
    const numReactors = 2 + Math.floor(Math.random() * 3);
    const selectedReactors = [];
    
    for (const reactor of reactorPool) {
        if (selectedReactors.length >= numReactors) break;
        
        const chance = Math.min(0.85, reactor.weight / 15);
        if (Math.random() < chance) {
            selectedReactors.push(reactor);
        }
    }
    
    while (selectedReactors.length < 2 && reactorPool.length > selectedReactors.length) {
        const next = reactorPool.find(r => !selectedReactors.find(s => s.id === r.id));
        if (next) selectedReactors.push(next);
        else break;
    }
    
    return selectedReactors.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION GENERATION
// ═══════════════════════════════════════════════════════════════

export async function investigateSurroundings(options = {}) {
    const { silent = false, source = 'manual' } = options;
    
    if (isInvestigating) {
        if (!silent) console.log('[Discovery] Already investigating...');
        return null;
    }
    
    if (!lastSceneContext && getContextRef) {
        ensureSceneContext(getContextRef);
    }
    
    if (!lastSceneContext) {
        if (!silent) console.warn('[Discovery] No scene context');
        updateEmptyState('No scene to investigate. Send a message first!');
        return null;
    }

    isInvestigating = true;
    setInvestigateButtonLoading(true);
    setFABScanning(true);

    try {
        const narrator = selectNarrator(lastSceneContext);
        const difficulty = getNarratorDifficulty(narrator.relevance);
        const checkResult = rollSkillCheck(narrator.level, difficulty);
        checkResult.difficultyName = getDifficultyName(difficulty);
        
        console.log(`[Discovery] Narrator: ${narrator.skill.signature} (${checkResult.difficultyName}, ${checkResult.success ? 'SUCCESS' : 'FAILURE'})`);
        
        const reactors = selectReactors(lastSceneContext, narrator.skillId);
        console.log(`[Discovery] Skill reactors:`, reactors.map(r => r.signature));
        
        const objectChance = extensionSettings.objectVoiceChance ?? 0.35;
        const includeObject = Math.random() < objectChance;
        console.log(`[Discovery] Object voice: ${includeObject ? 'YES' : 'NO'} (${Math.round(objectChance * 100)}% chance)`);
        
        const investigation = await generateInvestigation(
            lastSceneContext,
            narrator,
            checkResult,
            reactors,
            includeObject
        );
        
        setCurrentInvestigation(investigation);
        renderInvestigation(investigation);
        showFABSuccess();
        
        return investigation;
        
    } catch (error) {
        console.error('[Discovery] Investigation failed:', error);
        if (!silent) {
            updateEmptyState('Investigation failed. Check API settings.');
        }
        return null;
    } finally {
        isInvestigating = false;
        setInvestigateButtonLoading(false);
        setFABScanning(false);
    }
}

async function generateInvestigation(sceneText, narrator, checkResult, reactors, includeObject = false) {
    const checkStatus = checkResult.success ? 'PASSED' : 'FAILED';
    const checkNote = checkResult.isBoxcars ? ' (CRITICAL SUCCESS!)' :
                      checkResult.isSnakeEyes ? ' (CRITICAL FAILURE!)' : '';
    
    // POV CONTEXT from settings
    const povStyle = extensionSettings.povStyle || 'second';
    const charName = extensionSettings.characterName || '';
    const charPronouns = extensionSettings.characterPronouns || 'they';
    const charContext = extensionSettings.characterContext || '';
    const scenePerspective = extensionSettings.scenePerspective || '';
    
    // Build identity section
    let identitySection = `═══════════════════════════════════════════════════════════════
CRITICAL IDENTITY - READ THIS FIRST
═══════════════════════════════════════════════════════════════
`;
    
    if (charContext) {
        identitySection += `THE PLAYER CHARACTER (whose head these voices are in):
${charContext}

`;
    }
    
    if (scenePerspective) {
        identitySection += `SCENE PERSPECTIVE WARNING:
${scenePerspective}

`;
    }
    
    // POV instruction
    if (povStyle === 'second') {
        identitySection += `POV: Second person ("you/your"). All voices speak TO the player character "${charName || 'the protagonist'}".
"You" = ${charName || 'the player character'}. NEVER use "${charName}" by name in the output.`;
    } else if (povStyle === 'third' && charName) {
        const pronounMap = {
            'they': 'they/them/their',
            'he': 'he/him/his', 
            'she': 'she/her/her',
            'it': 'it/it/its'
        };
        identitySection += `POV: Third person. Character is "${charName}" (${pronounMap[charPronouns]}). Use name or pronouns, NOT "you".`;
    } else if (povStyle === 'first') {
        identitySection += `POV: First person ("I/me/my"). Internal monologue style.`;
    }
    
    identitySection += `

THE SCENE TEXT MAY BE WRITTEN FROM AN NPC'S PERSPECTIVE.
If the scene describes an NPC's feelings, sensations, or internal state - those are NOT "you".
"You" is ONLY ${charName || 'the player character'}. Observe NPCs from the OUTSIDE.

Example: If scene says "Gortash felt the impact" → write "Look at him flinch" NOT "You felt the impact"
Example: If scene says "his back hit the wall" (about an NPC) → write "He hit that wall hard" NOT "Your back hit the wall"
═══════════════════════════════════════════════════════════════
`;
    
    // Skill reactor descriptions
    const skillDescriptions = reactors.map(r => 
        `${r.signature}: ${r.personality?.substring(0, 150) || 'A skill voice'}`
    ).join('\n');
    
    // Copotype flavor
    let copotypeInstructions = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        copotypeInstructions = `

NARRATIVE FLAVOR - ${activeCopotype.name}:
The entire investigation should lean into this style: ${activeCopotype.voiceStyle}
This colors the narrator's prose and how reactors comment. Everything feels filtered through this lens.`;
    }
    
    // Object voice instructions
    const objectInstructions = includeObject ? `

OBJECT VOICE (INCLUDE ONE):
Find ONE interesting, specific object in the scene to give a voice. Look for:
- Something obviously important (a weapon, a key item, evidence)
- Something pathetically mundane (a crushed beer can, a broken chair, a flickering light)
- Something gross or absurd (moldy food, a stained mattress, a suspiciously wet newspaper)
- Something with history (an old photo, a child's toy in a bad place, a faded poster)
- Something the character might interact with

The object speaks AS ITSELF in first person. Give it personality based on what it IS and the scene context:
- A knife might be eager, hungry, or tired of waiting
- A broken bottle might be bitter, defeated, dangerous, or nostalgic
- Old food might be desperate, pathetic, taunting, or philosophical about decay
- A door might be weary, secretive, warning, or lonely
- A photograph might be accusatory, sad, or cryptic

Be SPECIFIC to THIS scene. The object should feel like it belongs HERE and has something to say about what's happening.
Format the object as: "THE [OBJECT NAME] — Their line"
Example: "THE MOLDY PIZZA SLICE — Just one bite. I dare you. What's the worst that could happen?"
Example: "THE FLICKERING STREETLIGHT — I've seen this before. It never ends well. Click. Click. Click."` 
    : '';

    const systemPrompt = `You are generating a "Slay the Princess" style scene investigation for a Disco Elysium RPG.

${identitySection}
THE NARRATOR: ${narrator.skill.signature}
Narrator's voice: ${narrator.skill.personality?.substring(0, 350)}

SKILL CHECK: ${checkStatus}${checkNote}
${!checkResult.success ? `
FAILED CHECK: Narrator's perception is UNRELIABLE:
- Filtered heavily through their obsessions and biases
- Missing obvious details while fixating on irrelevant ones
- Colored by their particular neuroses
- Still evocative, but not entirely trustworthy` : ''}
${checkResult.isSnakeEyes ? `
CRITICAL FAILURE: Narrator is SPECTACULARLY WRONG about something important. They confidently misread the situation in a way that's almost poetic in its wrongness.` : ''}
${checkResult.isBoxcars ? `
CRITICAL SUCCESS: Narrator perceives something PROFOUND - a deep truth about this place that others would miss entirely. Almost supernatural insight.` : ''}

SKILL REACTORS:
${skillDescriptions}
${objectInstructions}${copotypeInstructions}

RULES:
- RESPECT THE IDENTITY SECTION ABOVE - "you" is ONLY the player character, not NPCs
- Narrator: 3-5 sentences through their unique lens, NOT neutral description
- Skill reactors: ONE short line each (max 15 words), can disagree/warn/notice things
${includeObject ? '- Include exactly ONE contextual object voice at the end - must be something actually in the scene' : '- No object voice this time, only skill reactors'}
- NO generic lines - everything must be specific to THIS scene
- Reactors can argue with each other or the narrator
- If the scene is from an NPC's POV, translate it to what the PLAYER CHARACTER observes

FORMAT:
[NARRATOR]
(Narrator's evocative, biased paragraph)

[REACTORS]
SKILL SIGNATURE — Short reaction
SKILL SIGNATURE — Short reaction
${includeObject ? 'THE OBJECT NAME — Object speaking as itself (first person)' : ''}`;

    const userPrompt = `Scene to investigate:
"${sceneText.substring(0, 1500)}"

REMEMBER: You are voices in ${charName || 'the player character'}'s head. If this scene is written from someone else's POV, translate it to what ${charName || 'the player character'} OBSERVES from the outside.

Generate the investigation.
- Narrator: ${narrator.skill.signature} (${checkResult.success ? 'PASSED' : 'FAILED'}${checkNote})
- "You" = ${charName || 'the player character'} (NEVER NPCs)
- Skill reactors: ${reactors.map(r => r.signature).join(', ')}
${includeObject ? '- Find ONE interesting object in the scene to give a voice' : '- No object voice this time'}`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parseInvestigation(response, narrator, checkResult, reactors);
    } catch (error) {
        console.error('[Discovery] API call failed:', error);
        throw error;
    }
}

function parseInvestigation(response, narrator, checkResult, reactors) {
    const investigation = {
        narrator: {
            skillId: narrator.skillId,
            signature: narrator.skill.signature,
            color: narrator.skill.color,
            checkResult: checkResult,
            content: ''
        },
        reactors: []
    };
    
    // Parse narrator block
    const narratorMatch = response.match(/\[NARRATOR\]\s*\n?([\s\S]*?)(?=\[REACTORS\]|$)/i);
    if (narratorMatch) {
        let content = narratorMatch[1].trim();
        content = content.replace(new RegExp(`^${narrator.skill.signature}\\s*[-–—:]?\\s*`, 'i'), '');
        investigation.narrator.content = content;
    } else {
        const lines = response.split('\n').filter(l => l.trim() && l.trim().length > 50);
        investigation.narrator.content = lines[0] || 'The scene defies description.';
    }
    
    // Parse reactor lines
    const reactorMatch = response.match(/\[REACTORS\]\s*\n?([\s\S]*?)$/i);
    if (reactorMatch) {
        const reactorLines = reactorMatch[1].trim().split('\n').filter(l => l.trim());
        
        for (const line of reactorLines) {
            const match = line.match(/^(THE [A-Z][A-Z\s']+|[A-Z][A-Z\s\/]+)\s*[-–—:]\s*(.+)$/i);
            if (match) {
                const name = match[1].trim().toUpperCase();
                const content = match[2].trim().replace(/^["']|["']$/g, '');
                
                const isObject = name.startsWith('THE ') && !Object.values(SKILLS).some(s => 
                    s.signature.toUpperCase() === name
                );
                
                if (isObject) {
                    const hash = name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
                    const hue = Math.abs(hash) % 360;
                    
                    investigation.reactors.push({
                        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                        signature: name,
                        color: `hsl(${hue}, 40%, 55%)`,
                        icon: getObjectIcon(name),
                        isObject: true,
                        content: content
                    });
                } else {
                    const reactor = reactors.find(r => {
                        const sig = (r.signature || r.name || '').toUpperCase();
                        return sig === name || name.includes(sig) || sig.includes(name);
                    });
                    
                    if (reactor) {
                        investigation.reactors.push({
                            id: reactor.id,
                            signature: reactor.signature,
                            color: reactor.color,
                            isObject: false,
                            content: content
                        });
                    } else {
                        const skill = Object.values(SKILLS).find(s => 
                            s.signature.toUpperCase() === name ||
                            s.name.toUpperCase() === name
                        );
                        if (skill) {
                            investigation.reactors.push({
                                id: skill.id,
                                signature: skill.signature,
                                color: skill.color,
                                isObject: false,
                                content: content
                            });
                        }
                    }
                }
            }
        }
    }
    
    return investigation;
}

// ═══════════════════════════════════════════════════════════════
// UI WRAPPERS
// ═══════════════════════════════════════════════════════════════

export function createThoughtBubbleFAB(getContext) {
    getContextRef = getContext;
    setContextRef(getContext);
    return createFABBase(getContext, toggleDiscoveryModal);
}

export function createDiscoveryModal() {
    return createModalBase({
        toggleModal: toggleDiscoveryModal,
        investigate: investigateSurroundings,
        rescan: investigateSurroundings,
        ensureSceneContext
    });
}

export function toggleDiscoveryModal() {
    toggleModalBase(ensureSceneContext, lastSceneContext);
}

// ═══════════════════════════════════════════════════════════════
// AUTO-SCAN
// ═══════════════════════════════════════════════════════════════

export async function autoScan(messageText) {
    if (!extensionSettings.autoScanEnabled) return null;
    
    updateSceneContext(messageText);
    await new Promise(r => setTimeout(r, 500));
    
    return investigateSurroundings({ silent: true, source: 'auto' });
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { isInvestigating };
