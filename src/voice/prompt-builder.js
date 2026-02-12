/**
 * The Tribunal - Prompt Builder
 * Constructs system and user prompts for voice generation
 * 
 * REBUILD VERSION: Uses per-chat state accessors instead of global settings
 * This fixes the POV bug where pronouns weren't persisting per-chat!
 * 
 * @version 1.1.0 - Profile-aware: uses getSkillPersonality() and getProfileValue() 
 *                  for genre-specific voice personalities and system intro
 * @version 1.0.1 - Removed unused getChatState import
 * COMPATIBILITY: Also checks old extensionSettings location as fallback
 */

import { SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, COPOTYPE_IDS } from '../data/statuses.js';
import { getReactionLine, getSkillDynamics } from '../data/relationships.js';
import { getSkillPersonality, getAncientPersonality, getProfileValue } from '../data/setting-profiles.js';

// Import from rebuild's state management
import { getPersona, getVitals, getSettings } from '../core/state.js';

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
// CRITICAL STATE OVERRIDES
// These are NOT optional context — they're mandatory directives
// that go at the TOP of the prompt so voices CAN'T ignore them
// ═══════════════════════════════════════════════════════════════

/**
 * Check for extreme physical/mental states that MUST override normal voice behavior.
 * Returns a prominent directive block or empty string if everything's fine.
 * 
 * These states fundamentally change what the voices should be doing:
 * - Unconscious/dead: voices are fading, fragmented, desperate
 * - Dying: voices are panicked, focused on survival
 * - Mental breakdown: voices are chaotic, grief-stricken, spiraling
 * - Dissociated (The Pale): voices are dreamlike, reality-breaking
 * - Severely intoxicated: voices are slurred, confused, disinhibited
 */
function buildCriticalStateOverride() {
    const vitals = getVitals();
    if (!vitals) return '';
    
    const health = vitals.health ?? 13;
    const maxHealth = vitals.maxHealth ?? 13;
    const morale = vitals.morale ?? 13;
    const maxMorale = vitals.maxMorale ?? 13;
    const activeEffects = vitals.activeEffects || [];
    
    const healthPercent = maxHealth > 0 ? health / maxHealth : 1;
    const moralePercent = maxMorale > 0 ? morale / maxMorale : 1;
    
    // Get active effect IDs for status checks
    const activeIds = activeEffects.map(e => typeof e === 'string' ? e : e.id).filter(Boolean);
    
    const overrides = [];
    
    // ── HEALTH ZERO: Unconscious / Dead ──
    if (health <= 0) {
        overrides.push({
            priority: 0,
            text: `⚠️ CRITICAL OVERRIDE — THE CHARACTER IS UNCONSCIOUS / DYING (Health: 0/${maxHealth})
The body has failed. Voices should be:
- Fading, fragmented, desperate — like thoughts slipping away
- Focused on survival or acceptance of death
- Some voices may go silent, others may SCREAM
- Physical skills (Endurance, Pain Threshold) are panicking
- Cerebral skills are dimming, losing coherence
- This is NOT normal conversation. The character may be on the ground, bleeding out, or passed out.`
        });
    }
    // ── HEALTH CRITICAL: Dying ──
    else if (healthPercent <= 0.15) {
        overrides.push({
            priority: 1,
            text: `⚠️ CRITICAL STATE — NEAR DEATH (Health: ${health}/${maxHealth})
The body is failing. Every voice should acknowledge this:
- Physical voices are screaming warnings or going numb
- Pain is overwhelming — it colors EVERYTHING
- Even cerebral skills are distracted by the body's distress
- Survival instinct overrides normal analysis
- Half Light sees threats everywhere. Pain Threshold is barely holding.`
        });
    }
    
    // ── MORALE ZERO: Mental Breakdown ──
    if (morale <= 0) {
        overrides.push({
            priority: 0,
            text: `⚠️ CRITICAL OVERRIDE — MENTAL BREAKDOWN (Morale: 0/${maxMorale})
The mind has shattered. Voices should be:
- Chaotic, contradictory, spiraling — the internal chorus is BREAKING
- Volition has collapsed — no willpower remains
- Emotional skills are in agony or denial
- Logic and Rhetoric may try to rationalize but fail
- Some voices may turn against each other or against the character
- This is a psychological crisis. The character cannot function normally.`
        });
    }
    // ── MORALE CRITICAL: Breaking ──
    else if (moralePercent <= 0.15) {
        overrides.push({
            priority: 1,
            text: `⚠️ CRITICAL STATE — WILL BREAKING (Morale: ${morale}/${maxMorale})
The mind is fracturing. Every voice should reflect this:
- Emotional instability — voices waver, contradict themselves
- Volition is barely holding the line
- Empathy and Suggestion are raw and oversensitive
- Even logical voices have a desperate edge
- Small setbacks feel catastrophic. Small kindnesses feel overwhelming.`
        });
    }
    
    // ── THE PALE: Dissociated / Unconscious ──
    if (activeIds.includes('the_pale')) {
        overrides.push({
            priority: 1,
            text: `⚠️ THE PALE IS ACTIVE — REALITY IS DISSOLVING
The character is dissociated from reality. Voices should be:
- Dreamlike, fragmented, reality-breaking
- Normal skills speak as if from far away, muffled, uncertain
- Inland Empire and Shivers are AMPLIFIED — speaking in visions and symbols
- Ancient voices (if present) dominate — primal, pre-language awareness
- Time and space are unreliable. Memories bleed into the present.
- The character may be unconscious, in a coma, or experiencing ego death.`
        });
    }
    
    // ── WHITE MOURNING: Dying status active ──
    if (activeIds.includes('white_mourning')) {
        overrides.push({
            priority: 1,
            text: `⚠️ WHITE MOURNING — DEATH APPROACHES
Something is ending. The voices know it:
- Inland Empire speaks in omens and final truths
- Shivers feels the city/world mourning
- Pain Threshold narrates the body's shutdown clinically
- Other voices make peace, rage, or deny
- There is a solemnity to everything. Even arguments feel like eulogies.`
        });
    }
    
    // ── WASTE LAND: Exhausted ──
    if (activeIds.includes('waste_land')) {
        overrides.push({
            priority: 3,
            text: `STATE: EXHAUSTED (Waste Land active)
The body demands rest. Voices should reflect bone-deep fatigue:
- Thoughts trail off, lose focus, circle back
- Physical skills are sluggish and unreliable
- Inland Empire drifts toward sleep and dreams
- Volition is the only thing keeping the character upright`
        });
    }
    
    // ── SEVERELY DRUNK: Multiple alcohol stacks ──
    const drunkEffect = activeEffects.find(e => 
        (typeof e === 'string' ? e : e.id) === 'revacholian_courage' && 
        (typeof e !== 'string' && e.stacks >= 2)
    );
    if (drunkEffect) {
        const stacks = drunkEffect.stacks || 2;
        overrides.push({
            priority: 2,
            text: `STATE: SEVERELY INTOXICATED (${stacks} drinks deep)
Voices should reflect heavy intoxication:
- Logic and coordination skills are impaired, making errors
- Electrochemistry is THRIVING, encouraging more
- Emotional skills are disinhibited — saying things sober-you wouldn't
- Words should occasionally slur or lose track mid-thought
- Drama and Suggestion get louder. Composure gets quieter.`
        });
    }
    
    // ── FINGER ON THE EJECT BUTTON: Wounded ──
    if (activeIds.includes('finger_on_the_eject_button')) {
        overrides.push({
            priority: 3,
            text: `STATE: SERIOUSLY WOUNDED (Finger on the Eject Button)
Pain is a constant companion. Voices should:
- Acknowledge the injury — it's always there, nagging
- Pain Threshold speaks with grim authority
- Half Light sees every shadow as a threat to the wounded body
- Volition debates whether it's worth getting back up`
        });
    }
    
    // ── SPINAL CORD TERRITORY: Party combo ──
    const partyIds = ['revacholian_courage', 'pyrholidon', 'tequila_sunset'];
    const activeParty = partyIds.filter(id => activeIds.includes(id));
    if (activeParty.length >= 2) {
        overrides.push({
            priority: 2,
            text: `STATE: PARTY MODE — SPINAL CORD AWAKENED
Multiple substances are active. The body has taken over:
- Rational voices are DROWNED OUT by sensation
- Everything is electric, manic, unstoppable
- Bad decisions feel like great ideas
- The beat continues. DISCO.`
        });
    }
    
    if (overrides.length === 0) return '';
    
    // Sort by priority (0 = most critical) and build the block
    overrides.sort((a, b) => a.priority - b.priority);
    
    return '\n╔══════════════════════════════════════════════════════════════╗\n' +
           '║  CRITICAL STATE — VOICES MUST ACKNOWLEDGE THIS              ║\n' +
           '╚══════════════════════════════════════════════════════════════╝\n' +
           overrides.map(o => o.text).join('\n\n') + '\n';
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ENRICHMENT
// Assembles awareness context from all Tribunal systems
// so voices have actual knowledge of the character's state
// ═══════════════════════════════════════════════════════════════

/**
 * Build vitals context string for voice prompt
 * Gives voices awareness of character's physical/mental state
 */
function buildVitalsContext() {
    const vitals = getVitals();
    if (!vitals) return '';
    
    const health = vitals.health ?? 13;
    const maxHealth = vitals.maxHealth ?? 13;
    const morale = vitals.morale ?? 13;
    const maxMorale = vitals.maxMorale ?? 13;
    
    const healthPercent = maxHealth > 0 ? health / maxHealth : 1;
    const moralePercent = maxMorale > 0 ? morale / maxMorale : 1;
    
    // Only include if something interesting is happening
    if (healthPercent > 0.7 && moralePercent > 0.7) return '';
    
    const parts = [];
    
    if (healthPercent <= 0.15) {
        parts.push(`HEALTH: ${health}/${maxHealth} — CRITICAL. Body is failing, pain overwhelming.`);
    } else if (healthPercent <= 0.3) {
        parts.push(`HEALTH: ${health}/${maxHealth} — Low. Injuries taking their toll.`);
    } else if (healthPercent <= 0.7) {
        parts.push(`HEALTH: ${health}/${maxHealth} — Battered but standing.`);
    }
    
    if (moralePercent <= 0.15) {
        parts.push(`MORALE: ${morale}/${maxMorale} — BREAKING. Will to continue nearly gone.`);
    } else if (moralePercent <= 0.3) {
        parts.push(`MORALE: ${morale}/${maxMorale} — Shaken. Resolve wavering.`);
    } else if (moralePercent <= 0.7) {
        parts.push(`MORALE: ${morale}/${maxMorale} — Strained but holding.`);
    }
    
    if (parts.length === 0) return '';
    return '\nCHARACTER CONDITION:\n' + parts.join('\n');
}

/**
 * Build active effects context for voice prompt
 * Tells voices what substances/conditions are affecting the character
 */
function buildActiveEffectsContext() {
    const vitals = getVitals();
    const activeEffects = vitals?.activeEffects || [];
    if (activeEffects.length === 0) return '';
    
    const effectDescriptions = [];
    for (const effect of activeEffects) {
        const effectId = typeof effect === 'string' ? effect : effect.id;
        if (!effectId) continue;
        
        const statusData = STATUS_EFFECTS[effectId];
        if (statusData) {
            const name = statusData.simpleName || statusData.name || effectId;
            // Include boost/debuff info so voices know what's affected
            const boosts = statusData.boosts?.length ? `boosts ${statusData.boosts.join(', ')}` : '';
            const debuffs = statusData.debuffs?.length ? `impairs ${statusData.debuffs.join(', ')}` : '';
            const mods = [boosts, debuffs].filter(Boolean).join('; ');
            effectDescriptions.push(`• ${name}${mods ? ` (${mods})` : ''}`);
        }
    }
    
    if (effectDescriptions.length === 0) return '';
    return '\nACTIVE EFFECTS:\n' + effectDescriptions.join('\n');
}

/**
 * Build contact/NPC awareness context from relationships state
 * Lets voices reference known NPCs with their actual opinions
 * 
 * @param {string} sceneText - Current message to check for mentioned NPCs
 */
function buildContactContext(sceneText) {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return '';
        
        const state = getChatState();
        const relationships = state?.relationships;
        if (!relationships || Object.keys(relationships).length === 0) return '';
        
        const lowerScene = (sceneText || '').toLowerCase();
        const mentionedContacts = [];
        
        for (const contact of Object.values(relationships)) {
            if (!contact?.name) continue;
            
            // Check if this NPC is mentioned in the current scene
            const lowerName = contact.name.toLowerCase();
            const firstName = lowerName.split(' ')[0];
            
            if (lowerScene.includes(lowerName) || lowerScene.includes(firstName)) {
                const disposition = contact.disposition || 'unknown';
                const traits = (contact.detectedTraits || []).slice(0, 3).join(', ');
                
                // Get top voice opinions for this contact
                let opinionStr = '';
                if (contact.voiceOpinions) {
                    const opinions = Object.entries(contact.voiceOpinions)
                        .filter(([, op]) => op.score !== 0)
                        .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
                        .slice(0, 2);
                    
                    if (opinions.length > 0) {
                        opinionStr = ' Voices: ' + opinions.map(([skillId, op]) => {
                            const skill = SKILLS[skillId];
                            const name = skill?.signature || skillId;
                            return `${name} ${op.score > 0 ? 'trusts' : 'distrusts'} (${op.score > 0 ? '+' : ''}${op.score})`;
                        }).join(', ');
                    }
                }
                
                mentionedContacts.push(
                    `• ${contact.name} — ${disposition}${traits ? `, ${traits}` : ''}${opinionStr}`
                );
            }
        }
        
        if (mentionedContacts.length === 0) return '';
        return '\nKNOWN NPCs IN THIS SCENE:\n' + mentionedContacts.join('\n');
    } catch (e) {
        return '';
    }
}

/**
 * Build world state context (weather, time, location)
 */
function buildWorldContext() {
    try {
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return '';
        
        const state = getChatState();
        const ledger = state?.ledger;
        if (!ledger) return '';
        
        const parts = [];
        
        if (ledger.time?.display) {
            parts.push(ledger.time.display + (ledger.time.period ? ` (${ledger.time.period})` : ''));
        }
        if (ledger.weather?.condition && ledger.weather.condition !== 'overcast') {
            parts.push(ledger.weather.condition);
        }
        if (ledger.currentLocation?.name) {
            parts.push(`at ${ledger.currentLocation.name}`);
        }
        
        if (parts.length === 0) return '';
        return '\nSetting: ' + parts.join(', ');
    } catch (e) {
        return '';
    }
}

/**
 * Get user persona description from SillyTavern if available
 * Falls back gracefully if persona not set
 */
function getSTPersonaDescription() {
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (!ctx) return '';
        
        // Get persona description if available
        const personaDesc = ctx.persona?.description || ctx.personaDescription || '';
        if (personaDesc && personaDesc.length > 10) {
            // Truncate to keep prompt manageable
            return personaDesc.substring(0, 400);
        }
        return '';
    } catch (e) {
        return '';
    }
}

/**
 * Assemble the full enrichment context block
 * Returns a single string to inject into the voice prompt
 */
function buildEnrichmentContext(sceneText) {
    const sections = [
        buildVitalsContext(),
        buildActiveEffectsContext(),
        buildContactContext(sceneText),
        buildWorldContext()
    ].filter(s => s.length > 0);
    
    if (sections.length === 0) return '';
    
    return '\n═══════════════════════════════════════════════════════════════\n' +
           'SITUATION AWARENESS (use to inform voice reactions)\n' +
           '═══════════════════════════════════════════════════════════════' +
           sections.join('') + '\n';
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

    // ═══════════════════════════════════════════════════════
    // PERSONA ENRICHMENT: Pull from ST persona if local is empty
    // ═══════════════════════════════════════════════════════
    let enrichedCharContext = characterContext;
    if (!enrichedCharContext || enrichedCharContext.trim().length < 10) {
        const stPersona = getSTPersonaDescription();
        if (stPersona) {
            enrichedCharContext = stPersona;
        }
    }

    // ═══════════════════════════════════════════════════════
    // SITUATION AWARENESS: Vitals, effects, contacts, world
    // ═══════════════════════════════════════════════════════
    const enrichmentContext = buildEnrichmentContext(context.message);

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

        // Get personality from active profile (genre-aware) instead of hardcoded SKILLS data
        const personality = v.isAncient 
            ? getAncientPersonality(v.skillId) || v.skill.personality
            : getSkillPersonality(v.skillId) || v.skill.personality;
        return `${v.skill.signature}${checkInfo}: ${personality}`;
    }).join('\n\n');

    // ═══════════════════════════════════════════════════════
    // CRITICAL STATE: Must-acknowledge overrides
    // ═══════════════════════════════════════════════════════
    const criticalOverride = buildCriticalStateOverride();

    // Build system prompt — uses active genre profile for intro
    const systemIntro = getProfileValue('systemIntro', 
        'You generate internal mental voices for a roleplayer.');
    const systemPrompt = `${systemIntro}

═══════════════════════════════════════════════════════════════
CRITICAL IDENTITY - READ THIS FIRST
═══════════════════════════════════════════════════════════════
${enrichedCharContext.trim() ? `THE PLAYER CHARACTER (whose head these voices are in):
${enrichedCharContext}

` : ''}${scenePerspective.trim() ? `SCENE PERSPECTIVE WARNING:
${scenePerspective}

` : ''}${povInstruction}

THE SCENE TEXT MAY BE WRITTEN FROM AN NPC'S PERSPECTIVE.
If the scene describes an NPC's feelings, sensations, or internal state - those are NOT "you".
"You" is ONLY ${charIdentity}. The voices observe NPCs from the OUTSIDE.

Example: If scene says "Gortash felt the impact" - voices should say "Look at him flinch" NOT "You felt the impact"
Example: If scene says "his back hit the wall" (about an NPC) - voices say "He hit that wall hard" NOT "Your back hit the wall"
${criticalOverride}
═══════════════════════════════════════════════════════════════
THE VOICES SPEAKING THIS ROUND
═══════════════════════════════════════════════════════════════
${voiceDescriptions}
${relationshipSection}${reactionExamples}
${enrichmentContext}
${(() => {
    const tg = getProfileValue('toneGuide', '');
    return tg ? `═══════════════════════════════════════════════════════════════
WRITING STYLE & TONE
═══════════════════════════════════════════════════════════════
${tg}
` : '';
})()}═══════════════════════════════════════════════════════════════
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
        user: `Scene to react to: "${context.message.substring(0, 1500)}"

REMEMBER: You are voices in ${charIdentity}'s head. If this scene is written from someone else's POV, translate it to what ${charIdentity} OBSERVES from the outside.

Generate the internal chorus.`
    };
}
