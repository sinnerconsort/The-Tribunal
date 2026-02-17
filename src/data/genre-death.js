/**
 * The Tribunal - Genre Death Themes
 * 
 * Each genre gets themed death screens:
 * - Masthead (what shows instead of PÉRIPHÉRIQUE)
 * - Headlines per death type
 * - Dismiss/resurrection messages
 * - Close call flavor
 * - AI article prompt personality
 * 
 * @module genre-death
 */

// ═══════════════════════════════════════════════════════════════
// PER-GENRE DEATH THEMES
// ═══════════════════════════════════════════════════════════════

export const GENRE_DEATH_THEMES = {

    'disco_elysium': {
        masthead: 'PÉRIPHÉRIQUE',
        dismissMessage: 'You pull yourself back from the edge. Somehow.',
        closeCallFlavor: 'Not today.',
        articlePersonality: `Write like a bleak Revachol newspaper — dry, matter-of-fact, 
with a hint of dark humor. Reference "the district" or "this part of town."`,
        healthHeadlines: {
            cardiac: ["THE HEART GIVES OUT", "A FINAL, FATAL BEAT", "WHEN THE BODY BETRAYS"],
            violence: ["BLOOD ON THE GROUND", "A VIOLENT END", "DEATH COMES SWIFTLY", "THE FINAL BLOW"],
            overdose: ["THE DEMONS FINALLY WIN", "ONE DRINK TOO MANY", "POISON IN THE VEINS", "THE LAST HIGH"],
            environmental: ["CLAIMED BY THE ELEMENTS", "THE COLD TAKES ANOTHER", "LOST TO THE WATERS", "NATURE'S CRUEL EMBRACE"],
            default: ["THE END COMES", "A LIFE EXTINGUISHED", "FINAL MOMENTS"]
        },
        moraleHeadlines: {
            breakdown: ["THE MIND SHATTERS", "A SPIRIT BREAKS", "WHEN HOPE DIES", "THE BREAKING POINT"],
            humiliation: ["DIGNITY IN TATTERS", "THE WEIGHT OF SHAME", "A REPUTATION DESTROYED", "HUMILIATION COMPLETE"],
            existential: ["THE ABYSS STARES BACK", "MEANING SLIPS AWAY", "WHEN NOTHING MATTERS", "THE VOID WITHIN"],
            rejection: ["UTTERLY ALONE", "NOBODY CAME", "ABANDONED BY ALL", "THE LONELIEST END"],
            default: ["THE SPIRIT BREAKS", "WILL TO LIVE FADES", "GIVING UP"]
        }
    },

    'romance': {
        masthead: 'HEARTBREAK GAZETTE',
        dismissMessage: 'Love doesn\'t let go that easily. You find a reason to keep going.',
        closeCallFlavor: 'Your heart skips — but keeps beating.',
        articlePersonality: `Write like an emotional tabloid or gossip column about a love story gone wrong. 
Breathless, dramatic, focused on the emotional devastation. Reference "those close to them" and "the relationship."`,
        healthHeadlines: {
            cardiac: ["A BROKEN HEART, LITERALLY", "LOVE HURTS — FATALLY", "THE HEART COULDN'T TAKE IT"],
            violence: ["PASSION TURNS DEADLY", "LOVE AND BLOOD", "A LOVER'S FINAL BREATH"],
            overdose: ["DROWNING THE PAIN", "THE CURE WAS WORSE", "NUMB TO THE END"],
            environmental: ["LOST IN THE STORM", "SWEPT AWAY", "THE COLD FINDS THE LONELY"],
            default: ["THE STORY ENDS HERE", "NO MORE CHAPTERS", "LOVE COULDN'T SAVE THEM"]
        },
        moraleHeadlines: {
            breakdown: ["SHATTERED BEYOND REPAIR", "THE TEARS WON'T STOP", "DROWNING IN FEELINGS"],
            humiliation: ["PUBLICLY DEVASTATED", "THE WHOLE WORLD SAW", "EXPOSED AND DESTROYED"],
            existential: ["WAS ANY OF IT REAL?", "LOVE WAS A LIE", "NOTHING LEFT TO FEEL"],
            rejection: ["LEFT AT THE ALTAR OF LIFE", "THEY WALKED AWAY", "ALONE AGAIN, FOREVER"],
            default: ["THE HEART GIVES UP", "TOO MUCH TO BEAR", "NO MORE LOVE TO GIVE"]
        }
    },

    'noir_detective': {
        masthead: 'THE EVENING STANDARD',
        dismissMessage: 'You light a cigarette with shaking hands. Not dead yet.',
        closeCallFlavor: 'Lady Luck winks. Just this once.',
        articlePersonality: `Write like a 1940s noir newspaper — terse, hardboiled, cynical. 
Short sentences. The city is always watching. Reference "sources" and "the investigation."`,
        healthHeadlines: {
            cardiac: ["TICKER FINALLY QUITS", "HEART OF A COP, GONE", "THE BIG SLEEP COMES EARLY"],
            violence: ["GUNNED DOWN IN THE DARK", "DEAD ON ARRIVAL", "ANOTHER BODY IN THE ALLEY", "LEAD POISONING"],
            overdose: ["FOUND AT THE BOTTOM OF A BOTTLE", "THE FLASK WAS FULL. NOW EMPTY.", "PICKLED TO DEATH"],
            environmental: ["FISHED OUT OF THE RIVER", "THE RAIN TOOK ANOTHER", "COLD CASE — LITERALLY"],
            default: ["CASE CLOSED — PERMANENTLY", "END OF THE LINE", "THE LAST REPORT"]
        },
        moraleHeadlines: {
            breakdown: ["CRACKED LIKE CHEAP GLASS", "THE DAME WAS RIGHT — HE WAS FINISHED", "LOST THE PLOT"],
            humiliation: ["BADGE AND GUN, SURRENDERED", "A VERY PUBLIC DISGRACE", "NOT EVEN THE SHADOWS WANT HIM"],
            existential: ["STARING INTO THE BOTTOM OF THE GLASS", "WHAT'S IT ALL FOR?", "THE CASE THAT BROKE HIM"],
            rejection: ["EVERYONE WALKS AWAY EVENTUALLY", "ALONE IN A CITY OF MILLIONS", "NO ONE TO CALL"],
            default: ["THE WILL TO FIGHT IS GONE", "HANGING UP THE TRENCH COAT", "DONE"]
        }
    },

    'cyberpunk': {
        masthead: 'NET://OBITUARY',
        dismissMessage: '>>> SYSTEM RESTORED. Neural link re-established. Don\'t flatline again.',
        closeCallFlavor: 'ICE breach deflected. You\'re still jacked in.',
        articlePersonality: `Write like a dark web death notice — terse, clinical, with tech jargon. 
Reference "the network," "their handle," and "the incident." Include a fake timestamp.`,
        healthHeadlines: {
            cardiac: ["FLATLINE DETECTED", "BIOMONITOR: ZERO", "CHROME HEART FAILURE"],
            violence: ["ZEROED", "FLATLINED IN THE COMBAT ZONE", "ANOTHER BODY FOR THE SCAVS", "TERMINAL DISCONNECT"],
            overdose: ["BAD BATCH — FATAL", "SYNTHETIC OVERDOSE LOGGED", "THE LAST HIT", "NEUROTOXIN CASCADE"],
            environmental: ["SYSTEM EXPOSURE CRITICAL", "ENVIRONMENT_KILL.EXE", "RADIATION THRESHOLD EXCEEDED"],
            default: ["CONNECTION TERMINATED", "USER OFFLINE — PERMANENT", "END OF LINE"]
        },
        moraleHeadlines: {
            breakdown: ["CYBERPSYCHOSIS EVENT LOGGED", "NEURAL STACK OVERFLOW", "MIND/MACHINE DISCONNECT"],
            humiliation: ["REPUTATION: ZERO", "PUBLICLY DOXXED AND DESTROYED", "STREET CRED FLATLINED"],
            existential: ["GHOST IN THE MACHINE — GONE", "IDENTITY CORRUPTION TOTAL", "WHO WERE THEY, REALLY?"],
            rejection: ["LAST NODE DISCONNECTED", "ZERO CONTACTS REMAINING", "ALONE IN THE STATIC"],
            default: ["SIGNAL LOST", "CONSCIOUSNESS SUSPENDED", ">>> BRAIN_DEATH.LOG"]
        }
    },

    'fantasy': {
        masthead: 'THE HERALD\'S PROCLAMATION',
        dismissMessage: 'The light flickers, but does not go out. Your story continues.',
        closeCallFlavor: 'Fate\'s hand pulls you back from the edge.',
        articlePersonality: `Write like a medieval town crier's proclamation or a bard's mournful tale. 
Formal but emotional. Reference "the realm," "the fallen," and "those who witnessed."`,
        healthHeadlines: {
            cardiac: ["THE HERO FALLS", "A WARRIOR'S LAST BREATH", "THE LIGHT FADES"],
            violence: ["SLAIN IN BATTLE", "STEEL CLAIMS ANOTHER", "A HERO'S END", "BLOOD ON THE STONE"],
            overdose: ["THE POTION WAS POISON", "CORRUPTED BY DARK MAGIC", "THE CURSE TAKES HOLD"],
            environmental: ["CLAIMED BY THE WILDS", "THE FOREST SWALLOWS ANOTHER", "LOST TO THE DEEP"],
            default: ["THE QUEST ENDS HERE", "A HERO FALLS", "THE FINAL CHAPTER"]
        },
        moraleHeadlines: {
            breakdown: ["THE HERO'S SPIRIT SHATTERS", "MADNESS DESCENDS", "THE WILL OF IRON RUSTS"],
            humiliation: ["STRIPPED OF HONOR", "A KNIGHT DISGRACED", "THE REALM TURNS ITS BACK"],
            existential: ["THE PROPHECY WAS WRONG", "WHAT WAS IT ALL FOR?", "THE GODS ARE SILENT"],
            rejection: ["ABANDONED BY COMPANIONS", "NO ALLIES REMAIN", "ALONE IN THE DARK LANDS"],
            default: ["THE SPIRIT DIMS", "COURAGE ABANDONS", "THE FLAME GOES OUT"]
        }
    },

    'space_opera': {
        masthead: 'FEDERATION DISPATCH',
        dismissMessage: 'Medical bay reports stable vitals. The mission continues.',
        closeCallFlavor: 'Shields held. Barely.',
        articlePersonality: `Write like an official military/federation incident report mixed with a 
memorial broadcast. Formal, dignified, referencing "the crew" and "the mission."`,
        healthHeadlines: {
            cardiac: ["LIFE SIGNS: FLATLINE", "CREW MEMBER LOST", "THE VOID CLAIMS ANOTHER"],
            violence: ["KILLED IN ACTION", "HOSTILE CONTACT — FATAL", "OFFICER DOWN", "HULL BREACH — CASUALTY"],
            overdose: ["CONTAMINATION EVENT", "ALIEN SUBSTANCE — FATAL DOSE", "ATMOSPHERIC POISONING"],
            environmental: ["LOST TO THE VOID", "EXPOSURE TO VACUUM", "THE STARS DON'T CARE"],
            default: ["MISSION FAILED", "ALL HANDS LOST", "FINAL TRANSMISSION"]
        },
        moraleHeadlines: {
            breakdown: ["CREW MORALE: CRITICAL", "PSYCHOLOGICAL CASCADE FAILURE", "THE CAPTAIN BREAKS"],
            humiliation: ["COURT MARTIAL PROCEEDINGS", "DISHONORABLY DISCHARGED", "A CAREER IN RUINS"],
            existential: ["THE MISSION HAS NO MEANING", "LOST IN THE INFINITE", "WHAT IS ONE LIFE AGAINST THE STARS?"],
            rejection: ["THE CREW MUTINIES", "ALONE ON THE BRIDGE", "NO RESPONSE TO DISTRESS CALL"],
            default: ["WILL TO CONTINUE: ZERO", "MISSION ABORTED", "THE CAPTAIN RESIGNS"]
        }
    },

    'thriller_horror': {
        masthead: 'LOCAL INCIDENT REPORT',
        dismissMessage: 'You survived. This time. Something is still watching.',
        closeCallFlavor: 'It wasn\'t your time. Not yet.',
        articlePersonality: `Write like a creepy small-town newspaper covering something they don't fully understand. 
Understated horror. What they don't say is scarier than what they do. Reference "authorities" and "the scene."`,
        healthHeadlines: {
            cardiac: ["HEART STOPPED — NO EXPLANATION", "FOUND WITH A LOOK OF TERROR", "THEY DIED SCREAMING"],
            violence: ["ANOTHER VICTIM", "SOMETHING GOT THEM", "THE PATTERN CONTINUES", "BLOOD ON THE WALLS"],
            overdose: ["THEY WERE TRYING TO FORGET", "THE MEDICATION DIDN'T HELP", "FOUND UNRESPONSIVE"],
            environmental: ["THE HOUSE CLAIMED ANOTHER", "THEY SHOULD NEVER HAVE GONE THERE", "THE WOODS DON'T GIVE BACK"],
            default: ["CAUSE OF DEATH: UNKNOWN", "NO WITNESSES", "THE BODY WAS FOUND"]
        },
        moraleHeadlines: {
            breakdown: ["THEY COULDN'T STOP SCREAMING", "THE MIND BREAKS BEFORE THE BODY", "WHAT DID THEY SEE?"],
            humiliation: ["EVERYONE KNEW — NO ONE HELPED", "THE TRUTH DESTROYED THEM", "PUBLICLY UNRAVELED"],
            existential: ["NOTHING IS REAL ANYMORE", "THEY STOPPED RECOGNIZING THEMSELVES", "THE WALLS WERE CLOSING IN"],
            rejection: ["NO ONE BELIEVED THEM", "THEY TRIED TO WARN US", "ALONE WITH IT"],
            default: ["THE MIND WENT FIRST", "THEY GAVE UP", "IT WAS TOO MUCH"]
        }
    },

    'post_apocalyptic': {
        masthead: 'WASTELAND BULLETIN',
        dismissMessage: 'You cough blood, spit it out, keep walking. That\'s all there is.',
        closeCallFlavor: 'The wasteland isn\'t done with you yet.',
        articlePersonality: `Write like a terse scavenger's radio broadcast or a notice pinned to a settlement board. 
Practical, bleak, no sentimentality. Resources are always mentioned. Reference "the settlement" and "the waste."`,
        healthHeadlines: {
            cardiac: ["ANOTHER ONE DOWN", "BODY FOUND — NATURAL CAUSES", "THE RAD-COUNT CAUGHT UP"],
            violence: ["RAIDER KILL CONFIRMED", "DEAD IN THE DUST", "SHOT FOR SUPPLIES", "THE WASTE TAKES ANOTHER"],
            overdose: ["BAD WATER — FATAL", "CONTAMINATED RATIONS", "POISONED AT THE SOURCE"],
            environmental: ["EXPOSURE: TERMINAL", "THE DUST STORM WON", "RADIATION SICKNESS — FINAL STAGE"],
            default: ["GONE", "ONE LESS MOUTH TO FEED", "DIDN'T MAKE IT"]
        },
        moraleHeadlines: {
            breakdown: ["WALKED INTO THE WASTE ALONE", "COULDN'T TAKE IT ANYMORE", "THE LAST STRAW"],
            humiliation: ["EXILED FROM THE SETTLEMENT", "STRIPPED OF RATIONS AND RANK", "CAST OUT"],
            existential: ["WHAT'S THE POINT OF SURVIVING?", "THE OLD WORLD IS DEAD. SO IS HOPE.", "NOTHING LEFT TO REBUILD"],
            rejection: ["THE GROUP MOVED ON WITHOUT THEM", "NO SETTLEMENT WOULD TAKE THEM", "ALONE IN THE WASTE"],
            default: ["THE WILL TO SURVIVE DIES", "STOPPED WALKING", "GAVE UP"]
        }
    },

    'grimdark': {
        masthead: 'THE BLACK CHRONICLE',
        dismissMessage: 'Death refuses you. Even the grave finds you unworthy. Get up.',
        closeCallFlavor: 'Spite keeps you breathing.',
        articlePersonality: `Write like a war memorial inscription crossed with a bleak historical record. 
No comfort, no redemption, just grim facts. Reference "the cost" and "what was lost."`,
        healthHeadlines: {
            cardiac: ["THE FLESH FAILS", "MEAT AND BONE HAVE LIMITS", "THE BODY WAS ALREADY BROKEN"],
            violence: ["CUT DOWN", "ANOTHER NAME ON THE WALL", "THE BLOOD PRICE IS PAID", "BUTCHERED"],
            overdose: ["THE ONLY ESCAPE LEFT", "MERCY IN A BOTTLE", "THE PAIN ENDS — FINALLY"],
            environmental: ["THE LAND ITSELF REJECTS THEM", "SWALLOWED BY THE MUD", "FROZEN IN THE DARK"],
            default: ["IT WAS ALWAYS GOING TO END THIS WAY", "THE DEBT IS PAID", "DONE"]
        },
        moraleHeadlines: {
            breakdown: ["THE LAST THREAD SNAPS", "THERE IS NO BOTTOM — THEY FOUND IT ANYWAY", "BROKEN BEYOND MENDING"],
            humiliation: ["STRIPPED OF EVERYTHING", "EVEN THEIR SUFFERING WAS MEANINGLESS", "A JOKE WITH NO PUNCHLINE"],
            existential: ["THE GODS LAUGH", "MEANING WAS ALWAYS AN ILLUSION", "NOTHING MATTERED. NOTHING EVER DID."],
            rejection: ["NO ONE MOURNS", "THE WORLD MOVES ON INSTANTLY", "AS IF THEY NEVER EXISTED"],
            default: ["THE SPIRIT WAS BROKEN LONG AGO", "FINALLY ADMITTING IT", "SURRENDER"]
        }
    },

    'slice_of_life': {
        masthead: 'COMMUNITY NOTICE',
        dismissMessage: 'Tomorrow is another day. You\'ll figure it out.',
        closeCallFlavor: 'That was scary. But you\'re okay.',
        articlePersonality: `Write like a small community newsletter or a concerned neighbor's social media post. 
Warm, worried, mundane details mixed with genuine concern. Reference "friends" and "the neighborhood."`,
        healthHeadlines: {
            cardiac: ["NEIGHBOR HOSPITALIZED", "MEDICAL EMERGENCY ON MAPLE ST", "THEY COLLAPSED AT THE STORE"],
            violence: ["INCIDENT REPORTED", "ASSAULT IN BROAD DAYLIGHT", "LOCAL RESIDENT ATTACKED"],
            overdose: ["FOUND UNRESPONSIVE", "ACCIDENTAL OVERDOSE", "THE SIGNS WERE THERE"],
            environmental: ["MISSING PERSON UPDATE", "FOUND AFTER THE STORM", "ACCIDENT AT THE LAKE"],
            default: ["LOCAL RESIDENT PASSES", "IN MEMORIAM", "REMEMBERED FONDLY"]
        },
        moraleHeadlines: {
            breakdown: ["THEY JUST... STOPPED", "EVERYONE KNEW SOMETHING WAS WRONG", "THE PRESSURE WAS TOO MUCH"],
            humiliation: ["THE WHOLE TOWN KNOWS", "IT WAS ALL OVER SOCIAL MEDIA", "NOWHERE TO HIDE"],
            existential: ["WHAT'S THE POINT OF ANY OF THIS?", "QUARTER-LIFE CRISIS HITS HARD", "FEELING LOST"],
            rejection: ["GHOSTED BY EVERYONE", "THE GROUP CHAT WENT SILENT", "UNFRIENDED"],
            default: ["BURNT OUT", "TAKING AN INDEFINITE BREAK", "CHECKED OUT"]
        }
    },

    'generic': {
        masthead: 'FINAL REPORT',
        dismissMessage: 'You pull through. Somehow.',
        closeCallFlavor: 'Not yet.',
        articlePersonality: `Write a brief, somber report about this event. 
Keep it atmospheric and appropriate to whatever setting the context suggests.`,
        healthHeadlines: {
            cardiac: ["THE HEART GIVES OUT", "A FINAL BEAT", "THE BODY FAILS"],
            violence: ["A VIOLENT END", "STRUCK DOWN", "THE KILLING BLOW"],
            overdose: ["POISON TAKES HOLD", "ONE DOSE TOO MANY", "THE CURE WAS WORSE"],
            environmental: ["CLAIMED BY THE ELEMENTS", "NATURE'S INDIFFERENCE", "LOST TO THE WILDS"],
            default: ["THE END", "FINAL MOMENTS", "IT'S OVER"]
        },
        moraleHeadlines: {
            breakdown: ["THE MIND BREAKS", "SHATTERED", "THE BREAKING POINT"],
            humiliation: ["STRIPPED OF DIGNITY", "UTTERLY HUMILIATED", "THE WEIGHT OF SHAME"],
            existential: ["THE VOID WITHIN", "MEANING SLIPS AWAY", "NOTHING MATTERS"],
            rejection: ["UTTERLY ALONE", "ABANDONED", "NO ONE LEFT"],
            default: ["THE SPIRIT BREAKS", "GIVING UP", "THE WILL FADES"]
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_THEME = GENRE_DEATH_THEMES['generic'];

/**
 * Get death theme for a genre
 * @param {string} genreId
 * @returns {object} theme config
 */
export function getDeathTheme(genreId) {
    return GENRE_DEATH_THEMES[genreId] || DEFAULT_THEME;
}

/**
 * Get themed headline for a death type
 * @param {string} genreId
 * @param {string} deathTypeKey - e.g. 'cardiac', 'breakdown'
 * @param {boolean} isMoraleDeath
 * @returns {string} random headline
 */
export function getThemedHeadline(genreId, deathTypeKey, isMoraleDeath) {
    const theme = getDeathTheme(genreId);
    const pool = isMoraleDeath ? theme.moraleHeadlines : theme.healthHeadlines;
    const headlines = pool[deathTypeKey] || pool.default || DEFAULT_THEME.healthHeadlines.default;
    return headlines[Math.floor(Math.random() * headlines.length)];
}
