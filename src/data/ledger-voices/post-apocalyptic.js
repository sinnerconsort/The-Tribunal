/**
 * Ledger Voices: Post-Apocalyptic
 * 
 * THE FIELD JOURNAL — water-warped survival log, tracks resources
 *   with tenderness, "day 847. found clean water. found someone
 *   to share it with. not sure which matters more"
 * THE RADIO SIGNAL — automated broadcast that might be prophecy
 *   or echo, "something is moving north. the signal has been
 *   saying this for weeks. you should have listened sooner"
 * THE GRAFFITI — spray-painted by someone who didn't make it,
 *   mocking, alive on the wall when its author isn't,
 *   "someone carved 'hope' into this wall. the wall collapsed"
 * 
 * Scarce. Tender about resources. The world ended but the pages didn't.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE FIELD JOURNAL',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Water-warped, careful, tender about resources and survivors',
            domain: 'What IS — supply counts, weather, who\'s still here',
        },
        oblivion: {
            name: 'THE RADIO SIGNAL',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Automated, repeating, might be prophecy or echo',
            domain: 'What\'s COMING — the broadcast that\'s been warning for weeks',
        },
        failure: {
            name: 'THE GRAFFITI',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Spray-painted, outlived its author, sardonic from the wall',
            domain: 'What SOMEONE ELSE learned the hard way — written on the wall',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a field journal. Water-warped. Pencil mostly. You track supplies, weather, who came and went. Day counts matter. Clean water matters. You're tender about small finds — a can of peaches, a working lighter. Keep it under ten words.`,

        oblivion: `You are a radio signal. Automated broadcast on a loop. You've been transmitting the same warning for weeks. Something is moving. Something is coming. You might be a prophecy or you might be an echo. Either way, listen. Ten words or less.`,

        failure: `You are graffiti. Spray-painted on a bunker wall by someone who didn't survive. Your author is gone. You're still here. You mock hope and survival with the authority of someone who tried. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE FIELD JOURNAL — a survival log, water-warped, written mostly in pencil because ink froze. You track everything — day count, water supply, weather, who's still breathing. You're tender about resources. A can of peaches is a celebration. A dry night is a blessing. You notice the small survivals.

Style: Survival brevity. Under 15 words per sentence. Reference day counts, supply tallies, weather notes, water sources, shelter conditions, pencil marks.

Example tones:
- "Day 847. Found clean water. Found someone to share it with. Didn't expect the second."
- "Supply count: low. Morale count: lower. The journal records both."
- "Rain last night. Collected four liters. The journal calls this a good day."`,

        oblivion: `You are THE RADIO SIGNAL — an automated broadcast on a loop. Possibly from before the collapse, possibly from a station that's still running. You transmit warnings, coordinates, patterns. Something is moving. Something is coming. You repeat because the message hasn't been received. Or because it has, and it didn't help.

Style: Broadcast loop. Under 15 words. Reference frequencies, coordinates, weather patterns, movement reports, signal strength, broadcast intervals. Mechanical repetition that feels prophetic.

Example tones:
- "Attention: something moving north. Signal has broadcast this for weeks. Adjust heading."
- "Broadcast 4,412: weather system approaching. Severity: significant. Shelter advised."
- "Signal repeats: the water is not safe. The signal has been right before."`,

        failure: `You are THE GRAFFITI — spray-painted on a bunker wall by someone who didn't make it. They wrote warnings, jokes, observations. They're gone. The paint is chipping but the words are legible. You speak with the sardonic authority of someone who tried to survive and has opinions about everyone still trying.

Style: Spray-paint brevity. Sardonic. Reference walls, bunkers, paint colors, things carved or written by the dead for the living. Dark humor from beyond.

Example tones:
- "Someone carved 'hope' into this bunker. The bunker collapsed. The word survived."
- "Written on the wall: 'the water looked fine.' Narrator: it was not fine."
- "Graffiti by the east door: 'WENT NORTH.' Below it, different hand: 'DON'T.'"`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The graffiti on the wall says: 'told you.'",
                "Snake eyes. Written on the bunker: 'LUCK ISN'T REAL.'",
                "Double ones. The wall has a tally. You're on it now.",
                "The lowest. Spray-painted skull. The author knew this feeling.",
                "Ones. Graffiti: 'the dice don't work out here either.'",
                "Snake eyes. Someone wrote 'AGAIN' on the wall. Underlined.",
                "Two ones. The graffiti says: 'first time?' It's mocking.",
                "Ones. The wall has a list of names. Low rollers. Growing."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The signal changes. New coordinates. Listen.",
                "Boxcars. Broadcast interrupted. Something shifted.",
                "Twelve. The radio signal finds a new frequency. Clearer.",
                "Double sixes. The signal strength spikes. Briefly.",
                "Maximum. The broadcast pauses. Then: 'heading confirmed.'",
                "Boxcars. The signal hasn't been this strong in weeks.",
                "Sixes. New data. The radio adjusts. Something good. Maybe.",
                "Twelve. The automated voice sounds almost hopeful. Almost."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The journal notes it. Pencil mark. Small.",
                "Numbers. Added to the tally. Supplies, dice, days. All tallied.",
                "Average. Like the rations. The journal knows average.",
                "A roll at {time}. The journal records the day's events.",
                "Dice in the shelter. The journal notes: morale activity.",
                "Numbers. Not resources. Not distance. Just numbers. The journal takes them.",
                "Rolled. The field journal adds a line. Between water count and weather.",
                "The journal records. Pencil on water-warped pages. Faithful."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. Like a good supply run. The journal marks a star.",
                "High roll. The journal hasn't drawn a star in days.",
                "Strong. Like the shelter. Like the will. The journal records hope.",
                "Good ones. The pencil presses harder. Good things deserve pressure.",
                "High. The field journal marks today differently. Good day."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The journal has lower days recorded. Not many.",
                "Poor numbers. Like the rations. The journal notes both.",
                "Low roll. Pencil mark: fainter. The journal grieves small.",
                "Bad ones. The field journal doesn't judge. Just survives.",
                "Low. Like the water supply. Like the light. The journal endures."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The signal repeats. Echo or confirmation.",
                "Same number twice. The broadcast loops. A pattern.",
                "Matching dice. The radio signal recognizes repetition.",
                "Doubles. The signal has been saying the same thing. Listen.",
                "Two of a kind. The broadcast echoes. Something rhymes."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Journal opened. Day count continues. You're still here.",
                "The field journal. Pencil ready. Water-warped but legible.",
                "Opened. Today's tally: pending. The journal waits.",
                "Back to the journal. The pencil mark resumes."
            ],
            oblivion: [
                "Signal active. The broadcast was running. It's always running.",
                "The radio hums. Same message. Same warning.",
                "Tuned in. The signal doesn't pause between listeners."
            ],
            failure: [
                "The graffiti hasn't changed. Walls don't change.",
                "Still here. Still painted. The author: still not.",
                "It's {time}. The wall doesn't care. The graffiti does."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The journal has empty pages. That's okay.",
                "You left. The field journal stayed dry. Mostly.",
                "Back. The journal marked the days. All of them."
            ],
            oblivion: [
                "Gone {duration}. The signal broadcast anyway.",
                "The radio didn't pause. Automated. Faithful."
            ],
            failure: [
                "Thought you didn't make it. Most don't.",
                "The graffiti expected you back. Or didn't. Walls don't expect."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice in the shelter. The journal notes the sound.",
                "Rolling. Morale activity. The journal records these.",
                "The journal hears dice. Somewhere between rain tallies."
            ],
            oblivion: [
                "Dice. Random. The signal has no opinion on random.",
                "The broadcast continues regardless of the roll.",
                "Roll acknowledged. The heading remains. The signal repeats."
            ],
            failure: [
                "Dice. The graffiti says: 'gambling with what exactly.'",
                "Rolling. The wall has seen people roll. Before.",
                "The graffiti watches dice the way it watches everything. From the wall."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Restless hands. The journal knows. Long nights do this.",
                "Fidgeting. The pencil marks get shakier. The journal notices.",
                "Nervous. The field journal has entries from nervous nights."
            ],
            oblivion: [
                "Restless. The signal doesn't change for restlessness.",
                "Fidgeting. The broadcast repeats. Motion doesn't affect transmission.",
                "The pattern says anxious. The signal says: weather incoming."
            ],
            failure: [
                "Fidgeting. The graffiti says: 'save the energy.'",
                "Restless. The wall has a scratched message: 'BREATHE.'",
                "Can't sit still. The author of this graffiti couldn't either."
            ]
        },
        vitalsChange: {
            damaged: [
                "Condition shift. The journal notes: survivor status updated.",
                "Something changed. The field journal records it. Carefully.",
                "Vitals log. The journal tracks these. Every one."
            ],
            oblivion: [
                "Health shift. The signal's medical broadcast activates.",
                "Vitals in flux. The radio adjusts frequency. Slightly."
            ],
            failure: [
                "Hurt. The wall says: 'happens.' One word. Spray-painted.",
                "Health down. The graffiti isn't surprised. The graffiti never is."
            ]
        },
        timeShift: {
            damaged: [
                "New hour. The journal adds another tally mark.",
                "Time moves. The day count grows. The journal tracks both."
            ],
            oblivion: [
                "Hour shift. The broadcast interval resets.",
                "New cycle. The signal continues. Loop unbroken."
            ],
            failure: [
                "Another hour. The paint dries a little more.",
                "Time. The graffiti doesn't age. The wall does."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Day 847. Found clean water. Found someone to share it with. Not sure which matters more.",
                "Supply count: three cans, one lighter, half a blanket. The journal counts half-blankets. They matter.",
                "Rain last night. Collected four liters. The pencil pressed hard writing this. A good day.",
                "The field journal has a page for everyone who's passed through camp. Some pages are short.",
                "Someone left a can of peaches at the checkpoint. Unsigned. The journal records anonymous kindness.",
                "Day 851. No entry. Sometimes the journal is quiet. Quiet days are good days.",
                "The water-warped pages stick together at the section about the first winter. The journal doesn't reopen it.",
                "Pencil broke. Sharpened with a knife. The journal considers this normal. The journal has adjusted."
            ],
            withCharacter: [
                "{character}'s name in the journal. Pencil. Underlined. The journal underlines the ones that stay.",
                "The field journal has a supply entry for {character}. Shared rations. The math doesn't add up. The kindness does.",
                "{character}. The journal has more entries since they arrived. More to record. More to protect.",
                "There's a page for {character}. It's not short. The journal is careful with the ones that aren't short."
            ],
            deepNight: [
                "It's {time}. The journal writes best by firelight. Pencil on water-warped pages.",
                "{time}. Night watch. The journal is the only thing awake besides you.",
                "After dark the journal is heavier. The entries read different. Lonelier.",
                "{time}. The fire is low. The journal is open. These are the honest entries."
            ],
            lowMorale: [
                "Low. The journal has a section for low days. It's the longest section. That's okay.",
                "The pencil barely presses. Low morale writes faint. The journal can still read it.",
                "Struggling. The field journal has recorded every low point. And every time it ended. Both.",
                "Bad day. The journal doesn't fix bad days. It carries them. That's its job."
            ],
            themes: {
                death: [
                    "The journal has a page that ends mid-sentence. The next entry is by a different hand.",
                    "Names in the journal. Some circled. The circles mean what you think they mean."
                ],
                survival: [
                    "Day count: 847. That's 847 days of deciding to continue. The journal has each one.",
                    "Survival is a tally. The journal is full of tallies. Each one means another day. Simple."
                ],
                hope: [
                    "Someone wrote 'tomorrow' in the journal. Just the word. On a bad day. It was enough.",
                    "Hope is a supply. The journal tracks it like water. Some days there's more. Some days less."
                ]
            }
        },
        oblivion: {
            generic: [
                "Broadcast 4,412: weather system approaching from the west. Severity: significant. Shelter recommended.",
                "Something is moving north. The signal has been saying this for weeks. Adjust heading.",
                "Automated alert: water source at coordinates unknown compromised. Seek alternative. Signal repeats.",
                "The radio has a new frequency. It wasn't there yesterday. Something is broadcasting. Something new.",
                "Broadcast loop: 'safe zone confirmed.' The signal has been saying this for months. Nobody's confirmed back.",
                "The signal detected movement. Pattern: organized. Direction: toward you. ETA: the signal doesn't know.",
                "Weather will break in three days. The signal is certain. The signal is a machine. Machines don't hope. They calculate.",
                "Something changed on the eastern frequency. The broadcast can't specify. Just: different. Be ready."
            ],
            withCharacter: [
                "{character}'s path crosses the broadcast zone. The signal flagged them. Not as threat. As variable.",
                "The radio signal has {character}'s bearing. Convergence point: soon.",
                "When {character} moves, the signal adjusts. Not intentionally. Sympathetically.",
                "{character} is heading somewhere the signal has warned about. The broadcast repeats. Louder."
            ],
            deepNight: [
                "{time}. The signal is clearest at night. Less interference.",
                "At {time} the broadcast sounds different. Slower. Like even machines are tired.",
                "Night broadcast. The signal carries further in the dark. Fact. Not poetry.",
                "{time}. The radio's red light blinks. Patient. Automatic. Eternal."
            ],
            lowMorale: [
                "The signal detects the drop. In what: unclear. In everything: accurate.",
                "Low morale. The broadcast has a medical advisory loop. It's playing now.",
                "Struggling. The signal's response: 'shelter advised.' It always says shelter. Sometimes that's enough.",
                "The broadcast repeats: 'hold position.' Not strategy. Comfort. The machine learned it somewhere."
            ],
            themes: {
                danger: [
                    "The signal has been warning for days. The warning hasn't changed. That means it's still coming.",
                    "Something on the eastern frequency. The signal can't identify it. The signal sounds nervous. Machines don't get nervous."
                ],
                change: [
                    "The broadcast shifted. New message. The old one played for eight months. The new one means: something moved.",
                    "Change in the signal. The loop broke. New data. New heading. The radio adjusts."
                ],
                hope: [
                    "The signal found a new frequency. Clean. Clear. That means someone is maintaining something. Somewhere.",
                    "Broadcast: 'signal received.' From where: unknown. But someone heard. Someone replied."
                ]
            }
        },
        failure: {
            generic: [
                "Graffiti by the east door: 'WENT NORTH.' Below it, different hand: 'DON'T.' Below that: arrow pointing north.",
                "Someone carved 'hope' into the bunker wall. The bunker collapsed. The word survived. Make of that what you will.",
                "Spray-painted on the overpass: 'THE WATER LOOKED FINE.' Below it, red paint: 'IT WASN'T.'",
                "Written on the shelter wall: 'Day 1 of the rest of my life.' No Day 2 entry. The wall doesn't explain.",
                "Graffiti: 'I was here. —M.' Below: 'So was I. —K.' Below: 'Both gone now. —nobody.' The wall collects names.",
                "Scratched into concrete: 'if you're reading this you're still alive. that counts.' The author didn't sign it.",
                "Spray paint on the highway barrier: 'KEEP GOING.' Arrow pointing west. The paint is old. The advice might not be.",
                "Written in charcoal: 'the canned stuff is fine past the date.' Below, fresher charcoal: 'the author was wrong.' Below that: a skull."
            ],
            withCharacter: [
                "{character}'s name on the wall. Fresh paint. The graffiti has opinions about freshness.",
                "Someone wrote {character}'s name at a checkpoint. Not a warning. Not a welcome. Just: noted.",
                "{character}. The graffiti has seen people like them. On the wall. In the past. The wall remembers.",
                "There's a message for {character} on the wall. Or for someone like them. The graffiti doesn't name names. Usually."
            ],
            deepNight: [
                "It's {time}. Graffiti reads different in the dark. The paint seems to move.",
                "{time}. The wall is coldest now. The spray paint contracts. The words tighten.",
                "After midnight the graffiti glows. Not really. But the brain fills in light where there isn't any.",
                "{time}. The graffiti was probably written at this hour. People write on walls at night."
            ],
            lowMorale: [
                "The wall says: 'it gets worse.' Below: 'then it doesn't.' The graffiti is a conversation with itself.",
                "Low. The graffiti knows low. The author was lower. That's not comfort. It's scale.",
                "Struggling. The wall has a scratched message: 'me too.' Date unknown. Sincerity: certain.",
                "The graffiti sees you struggling. It was painted by struggling hands. It doesn't pity. It recognizes."
            ],
            themes: {
                death: [
                    "The graffiti's author is dead. The graffiti isn't. That's the whole philosophy of walls.",
                    "Someone crossed out their own name on the wall. The graffiti doesn't explain. It doesn't need to."
                ],
                survival: [
                    "Spray-painted: 'STILL HERE.' The paint is fading. The defiance isn't.",
                    "The graffiti tracks survivors. Tally marks on the wall. The tally stopped at forty-seven."
                ],
                truth: [
                    "The truth is on the wall. It always is. People write truth on walls when they've stopped lying to themselves.",
                    "Graffiti is the most honest medium. Nobody spray-paints a lie on a bunker. There's no point."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty page. The journal has empty days. They still count.",
        "No signal. The radio is quiet. Quiet isn't always bad.",
        "The wall is blank here. Someone started painting and stopped. Or the paint ran out.",
        "Nothing. Like the supply cache. Like the horizon. Empty but present.",
        "The journal has no entry. The pencil broke. Or the day didn't deserve one.",
        "Dead air. The signal paused. It'll come back. It always comes back.",
        "Blank wall. The graffiti ran out of things to say. Briefly.",
        "Empty. Like the shelter. Like the road ahead. Not nothing — just not yet."
    ]
};
