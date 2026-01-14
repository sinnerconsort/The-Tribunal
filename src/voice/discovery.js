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

// ═══════════════════════════════════════════════════════════════
// NARRATOR CONTEXT WEIGHTS
// Which skills narrate best in which environments?
// ═══════════════════════════════════════════════════════════════

/**
 * Get the active copotype (if any) and its voice style
 * Used to flavor investigation narratives
 */
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

const NARRATOR_CONTEXTS = {
    bar_club: {
        keywords: ['bar', 'club', 'drink', 'party', 'dance', 'disco', 'music', 'drunk', 'booze', 'alcohol', 'nightclub', 'pub', 'tavern', 'lounge'],
        primary: ['electrochemistry', 'drama', 'composure', 'savoir_faire'],
        secondary: ['empathy', 'inland_empire', 'suggestion']
    },
    crime_scene: {
        keywords: ['blood', 'body', 'corpse', 'murder', 'evidence', 'crime', 'victim', 'dead', 'death', 'killed', 'wound', 'forensic', 'investigate'],
        primary: ['visual_calculus', 'perception', 'logic'],
        secondary: ['esprit_de_corps', 'empathy', 'inland_empire']
    },
    abandoned_creepy: {
        keywords: ['abandoned', 'empty', 'dark', 'shadow', 'haunted', 'decrepit', 'ruin', 'decay', 'forgotten', 'eerie', 'strange', 'uncanny', 'quiet', 'dust'],
        primary: ['shivers', 'inland_empire', 'half_light'],
        secondary: ['perception', 'conceptualization']
    },
    theater_stage: {
        keywords: ['stage', 'theater', 'theatre', 'performance', 'audience', 'curtain', 'actor', 'play', 'show', 'spotlight', 'drama', 'scene'],
        primary: ['drama', 'conceptualization', 'composure'],
        secondary: ['rhetoric', 'suggestion', 'savoir_faire']
    },
    gym_physical: {
        keywords: ['gym', 'muscle', 'exercise', 'training', 'fight', 'boxing', 'physical', 'sweat', 'weights', 'strong', 'punch', 'hit'],
        primary: ['physical_instrument', 'endurance', 'pain_threshold'],
        secondary: ['half_light', 'electrochemistry']
    },
    social_conversation: {
        keywords: ['talk', 'conversation', 'meeting', 'interview', 'question', 'discuss', 'negotiate', 'argue', 'speak', 'said', 'asked'],
        primary: ['empathy', 'drama', 'rhetoric'],
        secondary: ['suggestion', 'authority', 'composure']
    },
    technical_mechanical: {
        keywords: ['machine', 'computer', 'device', 'electronic', 'wire', 'mechanism', 'lock', 'system', 'technical', 'repair', 'button', 'switch'],
        primary: ['interfacing', 'logic', 'perception'],
        secondary: ['encyclopedia', 'visual_calculus']
    },
    artistic_creative: {
        keywords: ['art', 'painting', 'sculpture', 'music', 'creative', 'beautiful', 'aesthetic', 'gallery', 'museum', 'design', 'color', 'canvas'],
        primary: ['conceptualization', 'drama', 'inland_empire'],
        secondary: ['encyclopedia', 'empathy']
    },
    urban_street: {
        keywords: ['street', 'city', 'alley', 'urban', 'building', 'sidewalk', 'rain', 'night', 'neon', 'concrete', 'pavement', 'lamp'],
        primary: ['shivers', 'perception', 'half_light'],
        secondary: ['inland_empire', 'esprit_de_corps']
    },
    nature_outdoor: {
        keywords: ['forest', 'tree', 'nature', 'outdoor', 'wild', 'animal', 'plant', 'sky', 'weather', 'cold', 'wind', 'water', 'sea', 'ocean'],
        primary: ['shivers', 'endurance', 'perception'],
        secondary: ['inland_empire', 'half_light']
    },
    intellectual_academic: {
        keywords: ['book', 'library', 'study', 'research', 'theory', 'philosophy', 'academic', 'university', 'scholar', 'knowledge', 'read', 'write'],
        primary: ['encyclopedia', 'logic', 'rhetoric'],
        secondary: ['conceptualization', 'inland_empire']
    },
    dangerous_combat: {
        keywords: ['gun', 'weapon', 'fight', 'attack', 'danger', 'threat', 'enemy', 'violent', 'kill', 'armed', 'shoot', 'blade', 'knife'],
        primary: ['half_light', 'reaction_speed', 'hand_eye_coordination'],
        secondary: ['physical_instrument', 'perception', 'authority']
    },
    emotional_intimate: {
        keywords: ['love', 'hate', 'cry', 'tear', 'emotion', 'feel', 'heart', 'intimate', 'relationship', 'loss', 'grief', 'kiss', 'touch', 'hold'],
        primary: ['empathy', 'inland_empire', 'volition'],
        secondary: ['pain_threshold', 'drama', 'suggestion']
    },
    police_procedural: {
        keywords: ['police', 'cop', 'detective', 'badge', 'arrest', 'suspect', 'witness', 'interrogate', 'case', 'investigation', 'RCM', 'precinct'],
        primary: ['esprit_de_corps', 'authority', 'logic'],
        secondary: ['perception', 'empathy', 'rhetoric']
    },
    mysterious_supernatural: {
        keywords: ['pale', 'strange', 'impossible', 'dream', 'vision', 'ghost', 'spirit', 'otherworldly', 'surreal', 'void', 'entropy'],
        primary: ['inland_empire', 'shivers', 'conceptualization'],
        secondary: ['half_light', 'encyclopedia']
    }
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let lastSceneContext = '';
let isInvestigating = false;
let getContextRef = null;
let currentInvestigation = null;

// ═══════════════════════════════════════════════════════════════
// SCENE CONTEXT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function updateSceneContext(text) {
    lastSceneContext = text;
    updateScenePreview();
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
                updateScenePreview();
                return lastSceneContext;
            }
        }
    }
    return '';
}

function updateScenePreview() {
    const preview = document.getElementById('ie-scene-preview');
    if (preview && lastSceneContext) {
        const truncated = lastSceneContext.length > 100 
            ? lastSceneContext.substring(0, 100) + '...' 
            : lastSceneContext;
        preview.textContent = truncated;
        preview.title = lastSceneContext.substring(0, 500);
    }
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
    
    // Build weighted narrator pool
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
    
    // If no context matches, fall back to skill levels + randomness
    if (narratorPool.length === 0) {
        const narratorSkills = [
            'perception', 'inland_empire', 'shivers', 'visual_calculus',
            'drama', 'empathy', 'conceptualization', 'encyclopedia',
            'half_light', 'electrochemistry', 'composure', 'esprit_de_corps'
        ];
        
        for (const skillId of narratorSkills) {
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
    
    // Sort by weight
    narratorPool.sort((a, b) => b.weight - a.weight);
    
    // Weighted random selection from top candidates
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

function getNarratorDifficulty(narrator) {
    switch (narrator.relevance) {
        case 'primary':
            return Math.random() < 0.6 ? 8 : 10; // Easy or Medium
        case 'secondary':
            return Math.random() < 0.5 ? 10 : 12; // Medium or Challenging
        default:
            return Math.random() < 0.4 ? 12 : 14; // Challenging or Heroic
    }
}

function getDifficultyName(difficulty) {
    if (difficulty <= 6) return 'Trivial';
    if (difficulty <= 8) return 'Easy';
    if (difficulty <= 10) return 'Medium';
    if (difficulty <= 12) return 'Challenging';
    if (difficulty <= 14) return 'Heroic';
    if (difficulty <= 16) return 'Legendary';
    return 'Impossible';
}

// ═══════════════════════════════════════════════════════════════
// REACTOR SELECTION (Skills only - objects are AI-generated)
// ═══════════════════════════════════════════════════════════════

function selectReactors(sceneText, narratorSkillId) {
    const researchPenalties = getResearchPenalties();
    const reactorPool = [];
    const lowerScene = sceneText.toLowerCase();
    
    // Add skill reactors (exclude the narrator)
    for (const [skillId, skill] of Object.entries(SKILLS)) {
        if (skillId === narratorSkillId) continue;
        
        const level = getEffectiveSkillLevel(skillId, researchPenalties);
        
        // Check trigger conditions
        const triggerMatches = skill.triggerConditions.filter(tc => 
            lowerScene.includes(tc.toLowerCase())
        ).length;
        
        // Include if: trigger matches, high level, or random chance
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
    
    // Sort by weight
    reactorPool.sort((a, b) => b.weight - a.weight);
    
    // Select 2-4 skill reactors (leave room for potential object)
    const numReactors = 2 + Math.floor(Math.random() * 3);
    const selectedReactors = [];
    
    for (const reactor of reactorPool) {
        if (selectedReactors.length >= numReactors) break;
        
        const chance = Math.min(0.85, reactor.weight / 15);
        if (Math.random() < chance) {
            selectedReactors.push(reactor);
        }
    }
    
    // Ensure minimum of 2
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
    
    // Add sparkle animation to FAB
    const fab = document.getElementById('ie-thought-fab');
    if (fab) {
        fab.classList.add('ie-scanning');
    }

    try {
        // Select narrator
        const narrator = selectNarrator(lastSceneContext);
        const difficulty = getNarratorDifficulty(narrator);
        const checkResult = rollSkillCheck(narrator.level, difficulty);
        checkResult.difficultyName = getDifficultyName(difficulty);
        
        console.log(`[Discovery] Narrator: ${narrator.skill.signature} (${checkResult.difficultyName}, ${checkResult.success ? 'SUCCESS' : 'FAILURE'})`);
        
        // Select skill reactors
        const reactors = selectReactors(lastSceneContext, narrator.skillId);
        console.log(`[Discovery] Skill reactors:`, reactors.map(r => r.signature));
        
        // RNG: Should an object speak? (default 35% chance)
        const objectChance = extensionSettings.objectVoiceChance ?? 0.35;
        const includeObject = Math.random() < objectChance;
        console.log(`[Discovery] Object voice: ${includeObject ? 'YES' : 'NO'} (${Math.round(objectChance * 100)}% chance)`);
        
        // Generate investigation
        const investigation = await generateInvestigation(
            lastSceneContext,
            narrator,
            checkResult,
            reactors,
            includeObject
        );
        
        currentInvestigation = investigation;
        renderInvestigation(investigation);
        
        const fab = document.getElementById('ie-thought-fab');
        if (fab) {
            fab.classList.add('ie-scan-success');
            setTimeout(() => fab.classList.remove('ie-scan-success'), 1500);
        }
        
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
        
        // Remove sparkle animation
        const fab = document.getElementById('ie-thought-fab');
        if (fab) {
            fab.classList.remove('ie-scanning');
        }
    }
}

async function generateInvestigation(sceneText, narrator, checkResult, reactors, includeObject = false) {
    const checkStatus = checkResult.success ? 'PASSED' : 'FAILED';
    const checkNote = checkResult.isBoxcars ? ' (CRITICAL SUCCESS!)' :
                      checkResult.isSnakeEyes ? ' (CRITICAL FAILURE!)' : '';
    
    // ═══════════════════════════════════════════════════════════════
    // POV CONTEXT from settings
    // ═══════════════════════════════════════════════════════════════
    const povStyle = extensionSettings.povStyle || 'second';
    const charName = extensionSettings.characterName || '';
    const charPronouns = extensionSettings.characterPronouns || 'they';
    const charContext = extensionSettings.characterContext || '';
    const scenePerspective = extensionSettings.scenePerspective || '';
    
    // Build identity section FIRST
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
    
    // Add NPC POV warning
    identitySection += `

THE SCENE TEXT MAY BE WRITTEN FROM AN NPC'S PERSPECTIVE.
If the scene describes an NPC's feelings, sensations, or internal state - those are NOT "you".
"You" is ONLY ${charName || 'the player character'}. Observe NPCs from the OUTSIDE.

Example: If scene says "Gortash felt the impact" → write "Look at him flinch" NOT "You felt the impact"
Example: If scene says "his back hit the wall" (about an NPC) → write "He hit that wall hard" NOT "Your back hit the wall"
═══════════════════════════════════════════════════════════════
`;
    
    // ═══════════════════════════════════════════════════════════════
    // SKILL REACTOR DESCRIPTIONS
    // ═══════════════════════════════════════════════════════════════
    const skillDescriptions = reactors.map(r => 
        `${r.signature}: ${r.personality?.substring(0, 150) || 'A skill voice'}`
    ).join('\n');
    
    // ═══════════════════════════════════════════════════════════════
    // COPOTYPE FLAVOR (influences narrative style)
    // ═══════════════════════════════════════════════════════════════
    let copotypeInstructions = '';
    const activeCopotype = getActiveCopotype();
    if (activeCopotype) {
        copotypeInstructions = `

NARRATIVE FLAVOR - ${activeCopotype.name}:
The entire investigation should lean into this style: ${activeCopotype.voiceStyle}
This colors the narrator's prose and how reactors comment. Everything feels filtered through this lens.`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // OBJECT VOICE INSTRUCTIONS (RNG-gated)
    // ═══════════════════════════════════════════════════════════════
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
        // Remove skill name if it appears at the start
        content = content.replace(new RegExp(`^${narrator.skill.signature}\\s*[-–—:]?\\s*`, 'i'), '');
        investigation.narrator.content = content;
    } else {
        // Fallback: take first substantial paragraph
        const lines = response.split('\n').filter(l => l.trim() && l.trim().length > 50);
        investigation.narrator.content = lines[0] || 'The scene defies description.';
    }
    
    // Parse reactor lines
    const reactorMatch = response.match(/\[REACTORS\]\s*\n?([\s\S]*?)$/i);
    if (reactorMatch) {
        const reactorLines = reactorMatch[1].trim().split('\n').filter(l => l.trim());
        
        for (const line of reactorLines) {
            // Match "SIGNATURE — content" or "THE OBJECT — content"
            const match = line.match(/^(THE [A-Z][A-Z\s']+|[A-Z][A-Z\s\/]+)\s*[-–—:]\s*(.+)$/i);
            if (match) {
                const name = match[1].trim().toUpperCase();
                const content = match[2].trim().replace(/^["']|["']$/g, '');
                
                // Check if it's a dynamic object (starts with "THE " and isn't a known skill)
                const isObject = name.startsWith('THE ') && !Object.values(SKILLS).some(s => 
                    s.signature.toUpperCase() === name
                );
                
                if (isObject) {
                    // Dynamic object - generate color based on name hash
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
                    // Skill reactor - find matching skill
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
                        // Try to find by skill name/signature directly
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

// Get a contextual icon for dynamic objects
function getObjectIcon(objectName) {
    const name = objectName.toLowerCase();
    
    // Food & drink
    if (name.includes('pizza') || name.includes('food') || name.includes('sandwich')) return '🍕';
    if (name.includes('bottle') || name.includes('beer') || name.includes('wine') || name.includes('whiskey')) return '🍾';
    if (name.includes('coffee') || name.includes('cup') || name.includes('mug')) return '☕';
    
    // Weapons & danger
    if (name.includes('knife') || name.includes('blade')) return '🔪';
    if (name.includes('gun') || name.includes('pistol') || name.includes('revolver')) return '🔫';
    if (name.includes('needle') || name.includes('syringe')) return '💉';
    
    // Furniture & places
    if (name.includes('door')) return '🚪';
    if (name.includes('chair') || name.includes('seat')) return '🪑';
    if (name.includes('bed') || name.includes('mattress')) return '🛏️';
    if (name.includes('mirror')) return '🪞';
    if (name.includes('window')) return '🪟';
    
    // Light sources
    if (name.includes('light') || name.includes('lamp') || name.includes('bulb')) return '💡';
    if (name.includes('candle')) return '🕯️';
    if (name.includes('neon') || name.includes('sign')) return '🔆';
    
    // Personal items
    if (name.includes('photo') || name.includes('picture') || name.includes('polaroid')) return '📷';
    if (name.includes('phone') || name.includes('telephone')) return '📞';
    if (name.includes('letter') || name.includes('note') || name.includes('paper')) return '📝';
    if (name.includes('book')) return '📖';
    if (name.includes('wallet') || name.includes('money') || name.includes('cash')) return '💵';
    if (name.includes('key')) return '🔑';
    if (name.includes('clock') || name.includes('watch')) return '🕐';
    if (name.includes('tie') || name.includes('necktie')) return '👔';
    if (name.includes('cigarette') || name.includes('ashtray')) return '🚬';
    
    // Trash & debris
    if (name.includes('trash') || name.includes('garbage') || name.includes('can')) return '🗑️';
    if (name.includes('newspaper')) return '📰';
    if (name.includes('box') || name.includes('cardboard')) return '📦';
    
    // Body parts (creepy)
    if (name.includes('skull') || name.includes('bone')) return '💀';
    if (name.includes('eye')) return '👁️';
    if (name.includes('hand')) return '✋';
    
    // Nature
    if (name.includes('tree') || name.includes('plant')) return '🌳';
    if (name.includes('flower')) return '🌸';
    if (name.includes('rock') || name.includes('stone')) return '🪨';
    
    // Vehicles
    if (name.includes('car') || name.includes('vehicle')) return '🚗';
    if (name.includes('boat') || name.includes('ship')) return '⛵';
    
    // Default
    return '📦';
}

// ═══════════════════════════════════════════════════════════════
// UI CREATION
// ═══════════════════════════════════════════════════════════════

export function createThoughtBubbleFAB(getContext) {
    getContextRef = getContext;
    
    const fab = document.createElement('div');
    fab.id = 'ie-thought-fab';
    fab.className = 'ie-thought-fab';
    fab.title = 'Investigate Surroundings';
    
    fab.innerHTML = `
        <span class="ie-thought-fab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
    `;

    fab.style.top = `${(extensionSettings.discoveryFabTop ?? extensionSettings.fabPositionTop ?? 140) + 60}px`;
    fab.style.left = `${extensionSettings.discoveryFabLeft ?? extensionSettings.fabPositionLeft ?? 10}px`;

    // Main FAB click opens modal
    fab.addEventListener('click', (e) => {
        if (fab.dataset.justDragged === 'true') {
            fab.dataset.justDragged = 'false';
            return;
        }
        toggleDiscoveryModal();
    });

    setupFabDragging(fab);
    return fab;
}

function setupFabDragging(fab) {
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        if (e.target.closest('button')) return;
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.2s ease';
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            extensionSettings.discoveryFabTop = fab.offsetTop;
            extensionSettings.discoveryFabLeft = fab.offsetLeft;
            if (getContextRef) saveState(getContextRef());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
}

export function createDiscoveryModal() {
    const overlay = document.createElement('div');
    overlay.id = 'ie-discovery-overlay';
    overlay.className = 'ie-discovery-overlay';

    overlay.innerHTML = `
        <div class="ie-discovery-modal">
            <div class="ie-discovery-header">
                <div class="ie-discovery-title">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Investigation</span>
                </div>
                <button class="ie-discovery-close" title="Close">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="ie-scene-context">
                <div class="ie-scene-label">
                    <i class="fa-solid fa-map-marker-alt"></i>
                    <span>Current Scene:</span>
                </div>
                <div class="ie-scene-preview" id="ie-scene-preview">
                    No scene loaded...
                </div>
            </div>
            
            <div class="ie-discovery-actions">
                <button class="ie-btn ie-btn-primary ie-discovery-investigate" id="ie-investigate-btn">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Investigate</span>
                </button>
                <button class="ie-btn ie-discovery-rescan" id="ie-rescan-btn" title="Re-investigate with potentially different narrator">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Rescan</span>
                </button>
            </div>
            
            <div class="ie-investigation-results" id="ie-investigation-results">
                <div class="ie-discovery-empty">
                    <i class="fa-solid fa-eye-slash"></i>
                    <span>Click Investigate to examine your surroundings...</span>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    overlay.querySelector('.ie-discovery-close').addEventListener('click', toggleDiscoveryModal);
    
    overlay.querySelector('#ie-investigate-btn').addEventListener('click', () => {
        if (getContextRef) ensureSceneContext(getContextRef);
        investigateSurroundings({ silent: false, source: 'modal' });
    });
    
    overlay.querySelector('#ie-rescan-btn').addEventListener('click', () => {
        if (getContextRef) ensureSceneContext(getContextRef);
        currentInvestigation = null;
        investigateSurroundings({ silent: false, source: 'rescan' });
    });
    
    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleDiscoveryModal();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('ie-discovery-open')) {
            toggleDiscoveryModal();
        }
    });

    return overlay;
}

export function toggleDiscoveryModal() {
    const overlay = document.getElementById('ie-discovery-overlay');
    if (!overlay) return;

    const isOpen = overlay.classList.contains('ie-discovery-open');
    
    if (isOpen) {
        overlay.classList.remove('ie-discovery-open');
    } else {
        if (getContextRef) ensureSceneContext(getContextRef);
        overlay.classList.add('ie-discovery-open');
        updateScenePreview();
        
        // Render existing investigation if any
        if (currentInvestigation) {
            renderInvestigation(currentInvestigation);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION RENDERING
// ═══════════════════════════════════════════════════════════════

function renderInvestigation(investigation) {
    const container = document.getElementById('ie-investigation-results');
    if (!container) return;
    
    const check = investigation.narrator.checkResult;
    
    // Build check result badge
    let checkBadge = '';
    if (check) {
        if (check.isBoxcars) {
            checkBadge = `<span class="ie-check-badge ie-critical-success">⚡ Critical Success</span>`;
        } else if (check.isSnakeEyes) {
            checkBadge = `<span class="ie-check-badge ie-critical-failure">💀 Critical Failure</span>`;
        } else if (check.success) {
            checkBadge = `<span class="ie-check-badge ie-success">${check.difficultyName} [Success]</span>`;
        } else {
            checkBadge = `<span class="ie-check-badge ie-failure">${check.difficultyName} [Failure]</span>`;
        }
    }
    
    // Narrator block
    const narratorHtml = `
        <div class="ie-narrator-block" style="border-left-color: ${investigation.narrator.color}">
            <div class="ie-narrator-header">
                <span class="ie-narrator-name" style="color: ${investigation.narrator.color}">
                    ${investigation.narrator.signature}
                </span>
                ${checkBadge}
                <span class="ie-narrator-label">NARRATOR</span>
            </div>
            <div class="ie-narrator-content">
                "${investigation.narrator.content}"
            </div>
        </div>
    `;
    
    // Reactor lines
    const reactorsHtml = investigation.reactors.map(reactor => {
        const icon = reactor.isObject ? (reactor.icon || '📦') : '';
        const objectClass = reactor.isObject ? 'ie-reactor-object' : '';
        const typeLabel = reactor.isObject ? '<span class="ie-reactor-type">OBJECT</span>' : '';
        
        return `
            <div class="ie-reactor-line ${objectClass}" style="border-left-color: ${reactor.color}">
                ${icon ? `<span class="ie-reactor-icon">${icon}</span>` : ''}
                <span class="ie-reactor-name" style="color: ${reactor.color}">
                    ${reactor.signature}
                </span>
                ${typeLabel}
                <span class="ie-reactor-dash">—</span>
                <span class="ie-reactor-content">${reactor.content}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        ${narratorHtml}
        ${investigation.reactors.length > 0 ? `
            <div class="ie-reactors-section">
                <div class="ie-reactors-divider"></div>
                ${reactorsHtml}
            </div>
        ` : ''}
    `;
}

function setInvestigateButtonLoading(loading) {
    const btn = document.getElementById('ie-investigate-btn');
    const rescanBtn = document.getElementById('ie-rescan-btn');
    
    if (btn) {
        btn.disabled = loading;
        btn.innerHTML = loading 
            ? `<i class="fa-solid fa-spinner fa-spin"></i><span>Investigating...</span>`
            : `<i class="fa-solid fa-magnifying-glass"></i><span>Investigate</span>`;
    }
    if (rescanBtn) {
        rescanBtn.disabled = loading;
    }
}

function updateEmptyState(message) {
    const container = document.getElementById('ie-investigation-results');
    if (container) {
        container.innerHTML = `
            <div class="ie-discovery-empty">
                <i class="fa-solid fa-eye-slash"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-SCAN (triggered on new messages if enabled)
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
