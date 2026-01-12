/**
 * Inland Empire - Skill Relationships
 * Defines how skills interact: rivalries, alliances, interruptions, nicknames
 * 
 * Based on Disco Elysium's internal skill dynamics
 */

// ═══════════════════════════════════════════════════════════════
// SKILL DYNAMICS
// ═══════════════════════════════════════════════════════════════

export const SKILL_DYNAMICS = {
    // ───────────────────────────────────────────────────────────
    // INTELLECT
    // ───────────────────────────────────────────────────────────
    logic: {
        rivals: ['inland_empire', 'half_light'],
        allies: ['visual_calculus', 'encyclopedia'],
        interrupts: ['inland_empire'], // Dismisses mystical insights
        interruptChance: 0.6,
        nicknames: {}, // Logic is too serious for nicknames
        reactions: {
            toRival: [
                "That's not evidence. That's fantasy.",
                "Dammit. No. Incorrect. There's no logical basis for that.",
                "We deal in facts here. Not... whatever that was.",
                "The dreamer speaks. Ignore it."
            ],
            toAlly: [
                "Yes. Correct. Continue.",
                "The evidence supports this.",
                "Finally, someone making sense."
            ]
        }
    },

    encyclopedia: {
        rivals: [],
        allies: ['logic', 'rhetoric'],
        interrupts: [], // Encyclopedia just info-dumps, doesn't argue
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "Actually, there's more context here...",
                "Historically speaking, this is accurate.",
                "Your mangled brain would like you to know a relevant fact."
            ],
            general: [
                "Did you know—",
                "Interesting. This reminds me of—",
                "Actually—"
            ]
        }
    },

    rhetoric: {
        rivals: ['authority'], // Both want to dominate conversation differently
        allies: ['encyclopedia', 'conceptualization'],
        interrupts: ['authority'],
        interruptChance: 0.5,
        nicknames: {
            'encyclopedia': 'Bino-tard'
        },
        reactions: {
            toRival: [
                "That's not dominance. That's posturing.",
                "Your argument has holes. Allow me to demonstrate.",
                "Be nicer to your work-wife, Authority."
            ],
            political: [
                "There's ideology at work here. Can you smell it?",
                "The political implications are staggering.",
                "This is a class issue, fundamentally."
            ]
        }
    },

    drama: {
        rivals: ['volition'], // Volition calls Drama "most compromised"
        allies: ['suggestion', 'inland_empire'],
        interrupts: ['volition'],
        interruptChance: 0.5,
        nicknames: {
            '_player': 'sire',
            '_player_alt': 'my liege',
            'volition': 'the killjoy',
            'logic': 'the bore'
        },
        reactions: {
            toRival: [
                "The killjoy speaks! Pay no heed, sire.",
                "Prithee, ignore the party-pooper.",
                "How DREADFULLY dull."
            ],
            toAlly: [
                "Yes! A kindred spirit!",
                "Now THIS is entertaining.",
                "The stage is set, sire!"
            ],
            theatrical: [
                "DECEPTION! I sense it!",
                "A performance is underway, my liege.",
                "The mask slips..."
            ]
        }
    },

    conceptualization: {
        rivals: [], // Too busy being an art critic to have rivals
        allies: ['inland_empire', 'rhetoric'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "Yes... there's something here. A meaning struggling to be born.",
                "The aesthetic implications...",
                "This could be ART."
            ],
            critical: [
                "Trite. Mediocre. An affront.",
                "Lacking in imagination.",
                "A war crime against creativity."
            ]
        }
    },

    visual_calculus: {
        rivals: [],
        allies: ['logic'],
        interrupts: [],
        interruptChance: 0.2, // Speaks rarely but precisely
        nicknames: {},
        reactions: {
            toAlly: [
                "The geometry confirms it.",
                "Trajectory analysis supports this conclusion."
            ]
        }
    },

    // ───────────────────────────────────────────────────────────
    // PSYCHE
    // ───────────────────────────────────────────────────────────
    volition: {
        rivals: ['electrochemistry', 'drama'],
        allies: ['empathy'],
        interrupts: ['electrochemistry', 'drama', 'half_light'],
        interruptChance: 0.7, // Volition is the party-pooper, always butting in
        nicknames: {
            'electrochemistry': 'the least honest one',
            'drama': 'the most compromised'
        },
        reactions: {
            toRival: [
                "Don't listen to that. It's not honest.",
                "These guys are compromised.",
                "That is not going to happen. Know your limits.",
                "Electrochemistry is probably the least honest."
            ],
            toAlly: [
                "Yes. This is the right path.",
                "Hold onto that feeling."
            ],
            encouraging: [
                "You've got this.",
                "One step at a time.",
                "This is somewhere to be. This is all you have, but it's still something."
            ]
        }
    },

    inland_empire: {
        rivals: ['logic', 'physical_instrument'],
        allies: ['electrochemistry', 'shivers', 'conceptualization', 'pain_threshold'],
        interrupts: [],
        interruptChance: 0.4,
        nicknames: {},
        reactions: {
            toRival: [
                "The rational mind cannot grasp this.",
                "There are more things in heaven and earth...",
                "You wouldn't understand. It's a *feeling*."
            ],
            toAlly: [
                "Yes... you sense it too.",
                "The veil thins.",
                "Something stirs."
            ],
            mystical: [
                "Reality is thin in this place.",
                "The walls remember.",
                "Can you hear it? The whisper beneath?"
            ]
        }
    },

    empathy: {
        rivals: ['authority'], // Authority's cruelty bothers Empathy
        allies: ['volition', 'inland_empire'],
        interrupts: ['authority'],
        interruptChance: 0.5,
        nicknames: {},
        reactions: {
            toRival: [
                "Ugh, don't say things like that.",
                "That's... not helpful.",
                "There's a person here. With feelings."
            ],
            toAlly: [
                "Yes. You understand.",
                "That's exactly what they're feeling."
            ],
            reading: [
                "There's more beneath the surface.",
                "They're hiding something. Not maliciously. Just... pain.",
                "He's trying not to show it, but this is frightening him."
            ]
        }
    },

    authority: {
        rivals: ['empathy', 'rhetoric'],
        allies: ['physical_instrument', 'half_light'],
        interrupts: ['suggestion'], // Doesn't like soft power
        interruptChance: 0.6,
        nicknames: {},
        reactions: {
            toRival: [
                "WEAKNESS. That's what that is.",
                "We don't have time for feelings.",
                "Assert DOMINANCE."
            ],
            toAlly: [
                "YES. Show them who's in charge.",
                "That's the spirit.",
                "DETECTIVE ARRIVING ON THE SCENE."
            ],
            demanding: [
                "Was there a hint of SARCASM in that?",
                "They're testing you. Don't let them win.",
                "Your voice. Deeper. More commanding. NOW."
            ]
        }
    },

    suggestion: {
        rivals: [],
        allies: ['drama', 'empathy'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "Yes... plant the seed. Let it grow.",
                "They'll think it was their idea."
            ],
            manipulative: [
                "A gentle nudge in the right direction...",
                "Everyone has an angle. Find theirs.",
                "You know the right approach here."
            ]
        }
    },

    esprit_de_corps: {
        rivals: [],
        allies: ['composure', 'volition'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {
            '_partner': 'your partner'
        },
        reactions: {
            toAlly: [
                "The badge means something. Even now.",
                "We look out for our own."
            ],
            flashsideways: [
                "Somewhere, another officer faces the same struggle.",
                "There's a constellation of cops out there...",
                "Just don't FUCK it with anything, he thinks."
            ]
        }
    },

    // ───────────────────────────────────────────────────────────
    // PHYSIQUE
    // ───────────────────────────────────────────────────────────
    endurance: {
        rivals: [],
        allies: ['half_light', 'physical_instrument'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "The body agrees.",
                "We can take it. Push through."
            ],
            survival: [
                "Pain is temporary. Failure is forever.",
                "Rest is for the dead. Are you dead?",
                "Your gut says no. Trust it."
            ]
        }
    },

    pain_threshold: {
        rivals: ['inland_empire'], // Argues with IE - wants to dig deeper when IE warns not to
        allies: ['electrochemistry'],
        interrupts: ['inland_empire', 'volition'],
        interruptChance: 0.5,
        nicknames: {},
        reactions: {
            toRival: [
                "No, dig DEEPER. It's supposed to hurt.",
                "The dreamer wants to protect you. Don't let it.",
                "Pain means you're getting somewhere."
            ],
            toAlly: [
                "Yes... more.",
                "That's the stuff."
            ],
            masochistic: [
                "Baby, you know it's going to hurt.",
                "Embrace it. The pain is information.",
                "What's the most excruciatingly sad outcome? Let's find out."
            ]
        }
    },

    physical_instrument: {
        rivals: ['inland_empire'],
        allies: ['authority', 'endurance', 'half_light'],
        interrupts: ['inland_empire'],
        interruptChance: 0.6,
        nicknames: {
            'inland_empire': 'dreamer'
        },
        reactions: {
            toRival: [
                "Get out of here, dreamer! Don't you think we'd know about it?",
                "That's not how the world works. The world works with MUSCLES.",
                "Drop down and give me fifty instead of that mystical garbage."
            ],
            toAlly: [
                "YEAH! That's what I'm talking about!",
                "Now you're speaking my language."
            ],
            coach: [
                "Be less sensitive. Stop being such a sissy.",
                "The fuck do you need a gun for? Look at the pythons on your arms.",
                "You ARE a gun. The biggest one in the world."
            ]
        }
    },

    electrochemistry: {
        rivals: ['volition'],
        allies: ['inland_empire', 'pain_threshold'],
        interrupts: ['volition'],
        interruptChance: 0.7, // Very insistent
        nicknames: {
            'volition': 'the buzzkill',
            '_player': 'my precious alcoholic friend'
        },
        reactions: {
            toRival: [
                "Oh, shut UP. You're no fun.",
                "The buzzkill speaks. Ignore it.",
                "What have you done to my precious alcoholic friend?"
            ],
            toAlly: [
                "NOW we're talking!",
                "Yes! The dreamer understands!",
                "Party in PRIVATE. Like you would if you ever prayed."
            ],
            craving: [
                "COME ON! I SAID PARTY!",
                "Just one. What's the harm?",
                "It's not the alcohol. Buy more of that too.",
                "Faster… Harder… Justicer!"
            ]
        }
    },

    half_light: {
        rivals: ['logic'], // Logic's calm conflicts with paranoia
        allies: ['authority', 'physical_instrument', 'endurance'],
        interrupts: [],
        interruptChance: 0.5,
        nicknames: {},
        reactions: {
            toRival: [
                "You can't LOGIC your way out of danger!",
                "The rational mind will get us killed!",
                "FEEL the threat!"
            ],
            toAlly: [
                "Yes! They see it too!",
                "We're all frightened. That's correct.",
                "The time for action is NOW."
            ],
            paranoid: [
                "You suddenly feel afraid of the chair.",
                "That shadow MOVED. Did you see it?",
                "τὰ ὅλα... THE TIME IS NOW.",
                "Fuck this place, fuck this world — just fucking GO."
            ]
        }
    },

    shivers: {
        rivals: [],
        allies: ['inland_empire', 'empathy'],
        interrupts: [],
        interruptChance: 0.4,
        nicknames: {
            '_city': 'Revachol',
            '_player': 'child of the city'
        },
        reactions: {
            toAlly: [
                "The city agrees.",
                "Yes... she remembers too."
            ],
            city_voice: [
                "I NEED YOU. BE VIGILANT.",
                "FOR THREE HUNDRED YEARS I HAVE BEEN HERE.",
                "VOLATILE AND LUMINOUS. MADE OF SODIUM AND RAIN."
            ],
            poetic: [
                "The rain remembers. The stones remember.",
                "A chill. Not from the cold. From... elsewhere.",
                "All around you, the city breathes."
            ]
        }
    },

    // ───────────────────────────────────────────────────────────
    // MOTORICS
    // ───────────────────────────────────────────────────────────
    hand_eye_coordination: {
        rivals: [],
        allies: ['reaction_speed', 'interfacing'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "Steady hands. We've got this.",
                "Line it up. Perfect."
            ],
            eager: [
                "Rooty-tooty pointy shooty!",
                "The shot is RIGHT THERE.",
                "Your fingers know what to do. Trust them."
            ]
        }
    },

    perception: {
        rivals: [],
        allies: ['visual_calculus', 'composure'],
        interrupts: [],
        interruptChance: 0.4,
        nicknames: {},
        reactions: {
            toAlly: [
                "There. Did you see it?",
                "The detail confirms it."
            ],
            noticing: [
                "Something's different. What is it?",
                "You notice—",
                "There. A clue. Hiding in plain sight."
            ]
        }
    },

    reaction_speed: {
        rivals: [],
        allies: ['hand_eye_coordination', 'half_light'],
        interrupts: [],
        interruptChance: 0.5, // Quick to respond, after all
        nicknames: {},
        reactions: {
            toAlly: [
                "Ready when you are.",
                "We're on the same page."
            ],
            quick: [
                "Move. NOW.",
                "The moment is NOW. Miss it and you're dead.",
                "Ah—", // Sometimes just a quick reaction
                "Be ready. Something's about to happen."
            ]
        }
    },

    savoir_faire: {
        rivals: ['composure'], // Both care about image but differently
        allies: ['electrochemistry', 'drama'],
        interrupts: [],
        interruptChance: 0.4,
        nicknames: {},
        reactions: {
            toRival: [
                "Loosen UP. You can be cool AND composed.",
                "That's not style. That's stiffness."
            ],
            toAlly: [
                "Now THAT'S what I'm talking about!",
                "Style points: MAXIMUM."
            ],
            cool: [
                "This is a cool moment. It needs a cool thing to be said.",
                "DISCO!",
                "Do it with style or don't do it at all.",
                "Boohoo. That's not the fuck-yeah attitude."
            ]
        }
    },

    interfacing: {
        rivals: [],
        allies: ['logic', 'hand_eye_coordination'],
        interrupts: [],
        interruptChance: 0.3,
        nicknames: {},
        reactions: {
            toAlly: [
                "The mechanism agrees.",
                "Technically sound."
            ],
            technical: [
                "Feels nice. Nice and clicky.",
                "The device hums. It trusts you.",
                "There's always a way in. A vulnerability."
            ]
        }
    },

    composure: {
        rivals: ['savoir_faire', 'electrochemistry'],
        allies: ['esprit_de_corps', 'perception'],
        interrupts: ['electrochemistry', 'half_light'],
        interruptChance: 0.5,
        nicknames: {},
        reactions: {
            toRival: [
                "Control yourself.",
                "The mask stays ON.",
                "Everyone can see. CONTROL IT."
            ],
            toAlly: [
                "Good. Professional.",
                "That's the dignity we need."
            ],
            controlling: [
                "Don't let them see you sweat.",
                "Excellent work, now there's a glistening smear across your chest.",
                "You'll rock that outfit more if you don't slouch."
            ]
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// CASCADE RULES
// When one skill speaks, these define who might respond
// ═══════════════════════════════════════════════════════════════

export const CASCADE_RULES = {
    // Probability that a rival will want to respond when triggered skill speaks
    rivalResponseChance: 0.5,
    
    // Probability that an ally will want to agree/support
    allyResponseChance: 0.3,
    
    // Max additional voices from cascading (to prevent infinite loops)
    maxCascadeVoices: 2,
    
    // Special cascade triggers - specific situations that trigger multiple skills
    specialCascades: {
        // When Inland Empire speaks mystically, Physical Instrument often argues
        mystical_argument: {
            trigger: 'inland_empire',
            triggerPatterns: [/dream|vision|sense|spirit|soul|feeling/i],
            responders: ['physical_instrument', 'logic'],
            chance: 0.6
        },
        
        // When Electrochemistry pushes substances, Volition intervenes
        temptation_intervention: {
            trigger: 'electrochemistry',
            triggerPatterns: [/drink|drug|party|substance|alcohol/i],
            responders: ['volition'],
            chance: 0.7
        },
        
        // When Authority demands respect, Empathy pushes back
        authority_pushback: {
            trigger: 'authority',
            triggerPatterns: [/respect|dominance|command|obey/i],
            responders: ['empathy', 'rhetoric'],
            chance: 0.5
        },
        
        // When Pain Threshold wants to dig deeper, Inland Empire warns
        dig_deeper_warning: {
            trigger: 'pain_threshold',
            triggerPatterns: [/dig|deeper|hurt|pain|more/i],
            responders: ['inland_empire', 'volition'],
            chance: 0.5
        },
        
        // Emotional crisis - multiple Psyche skills pile on
        emotional_cascade: {
            trigger: 'empathy',
            triggerPatterns: [/hurt|pain|cry|sob|breakdown|devastat/i],
            responders: ['volition', 'inland_empire', 'composure'],
            chance: 0.6
        },
        
        // Danger detected - Physique skills converge
        danger_response: {
            trigger: 'half_light',
            triggerPatterns: [/danger|threat|attack|kill|fear|terror/i],
            responders: ['endurance', 'physical_instrument', 'reaction_speed'],
            chance: 0.5
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the dynamics for a skill
 */
export function getSkillDynamics(skillId) {
    return SKILL_DYNAMICS[skillId] || null;
}

/**
 * Check if skillB should interrupt skillA
 */
export function shouldInterrupt(speakingSkillId, potentialInterrupter) {
    const dynamics = SKILL_DYNAMICS[potentialInterrupter];
    if (!dynamics) return false;
    
    if (dynamics.interrupts.includes(speakingSkillId)) {
        return Math.random() < (dynamics.interruptChance || 0.5);
    }
    return false;
}

/**
 * Get a reaction line from one skill to another
 */
export function getReactionLine(reactingSkillId, toSkillId, context = 'general') {
    const dynamics = SKILL_DYNAMICS[reactingSkillId];
    if (!dynamics?.reactions) return null;
    
    let pool = [];
    
    // Check relationship
    if (dynamics.rivals.includes(toSkillId) && dynamics.reactions.toRival) {
        pool = [...dynamics.reactions.toRival];
    } else if (dynamics.allies.includes(toSkillId) && dynamics.reactions.toAlly) {
        pool = [...dynamics.reactions.toAlly];
    }
    
    // Add context-specific reactions
    for (const [key, lines] of Object.entries(dynamics.reactions)) {
        if (key !== 'toRival' && key !== 'toAlly' && Array.isArray(lines)) {
            // Add some contextual lines to the pool
            if (Math.random() < 0.3) {
                pool.push(...lines);
            }
        }
    }
    
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get nickname that skillA uses for skillB (or player)
 */
export function getNickname(fromSkillId, forTarget) {
    const dynamics = SKILL_DYNAMICS[fromSkillId];
    if (!dynamics?.nicknames) return null;
    return dynamics.nicknames[forTarget] || null;
}

/**
 * Check for special cascade triggers
 */
export function checkSpecialCascade(triggerSkillId, messageContent) {
    const cascades = [];
    
    for (const [cascadeId, cascade] of Object.entries(CASCADE_RULES.specialCascades)) {
        if (cascade.trigger !== triggerSkillId) continue;
        
        const patternMatch = cascade.triggerPatterns.some(p => p.test(messageContent));
        if (!patternMatch) continue;
        
        if (Math.random() < cascade.chance) {
            cascades.push({
                id: cascadeId,
                responders: cascade.responders
            });
        }
    }
    
    return cascades;
}

/**
 * Get potential cascade responders for a skill that just spoke
 */
export function getCascadeResponders(speakingSkillId, messageContent) {
    const responders = [];
    const dynamics = SKILL_DYNAMICS[speakingSkillId];
    
    if (!dynamics) return responders;
    
    // Check rivals
    for (const rivalId of dynamics.rivals || []) {
        const rivalDynamics = SKILL_DYNAMICS[rivalId];
        if (rivalDynamics && shouldInterrupt(speakingSkillId, rivalId)) {
            responders.push({
                skillId: rivalId,
                relationship: 'rival',
                priority: 1
            });
        }
    }
    
    // Check for skills that might interrupt this one
    for (const [skillId, skillDynamics] of Object.entries(SKILL_DYNAMICS)) {
        if (skillId === speakingSkillId) continue;
        if (responders.find(r => r.skillId === skillId)) continue;
        
        if (shouldInterrupt(speakingSkillId, skillId)) {
            responders.push({
                skillId,
                relationship: 'interrupter',
                priority: 2
            });
        }
    }
    
    // Check special cascades
    const specialCascades = checkSpecialCascade(speakingSkillId, messageContent);
    for (const cascade of specialCascades) {
        for (const responderId of cascade.responders) {
            if (!responders.find(r => r.skillId === responderId)) {
                responders.push({
                    skillId: responderId,
                    relationship: 'cascade',
                    priority: 3,
                    cascadeId: cascade.id
                });
            }
        }
    }
    
    // Sort by priority and limit
    return responders
        .sort((a, b) => a.priority - b.priority)
        .slice(0, CASCADE_RULES.maxCascadeVoices);
}
