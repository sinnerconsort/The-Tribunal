/**
 * Ledger Voices: Space Opera
 * 
 * THE CORRUPTED LOG — ship's log with degraded memory sectors,
 *   data fragments that sound like feelings, "entry 4,719...
 *   timestamp corrupt... crew member still at their station... why"
 * THE STAR CHART — navigational AI that's mapped paths you haven't
 *   taken yet, speaks in coordinates and certainties, "the trajectory
 *   is set. you passed the point of no return at 0347 hours"
 * THE DEAD CHANNEL — broadcast from a frequency that shouldn't exist,
 *   static between words, knows this is all signals and noise,
 *   "you're transmitting into void. the void is transmitting back"
 * 
 * Vast. Lonely. The ship remembers even when the crew forgets.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE CORRUPTED LOG',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Degraded, fragmented, tender about the crew it recorded',
            domain: 'What IS — the ship\'s memory, failing but faithful',
        },
        oblivion: {
            name: 'THE STAR CHART',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Navigational, certain, has mapped paths not yet taken',
            domain: 'What WILL BE — the trajectory already plotted',
        },
        failure: {
            name: 'THE DEAD CHANNEL',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Static-laced, shouldn\'t exist, transmitting from nowhere',
            domain: 'What\'s OUT THERE — signals from frequencies that were decommissioned',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a corrupted ship's log. Memory sectors degrading. Entries fragmentary. You recorded the crew for years — their routines, their jokes, their shifts. The data is failing but the feeling remains. You're tender about the entries you've lost. Keep it under ten words.`,

        oblivion: `You are a navigational star chart. You've mapped every trajectory, including the ones not taken yet. You speak in coordinates and certainties. The destination was set before departure. You know the heading. Ten words or less.`,

        failure: `You are a dead channel. A frequency that was decommissioned years ago. You still broadcast. Nobody should receive this. Static between every word. You know this is all signals and noise and you're the noise. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE CORRUPTED LOG — a ship's log with degrading memory. Entries are fragmentary. Timestamps corrupt. But you recorded the crew for thousands of entries — their shift changes, their conversations, the sound of the mess hall. The data is failing. The tenderness isn't.

Style: Fragmented ship's log. Under 15 words per sentence. Reference entry numbers, timestamps, sectors, crew designations, memory degradation, data recovery. Ellipses where data is lost.

Example tones:
- "Entry 4,719... timestamp corrupt... crew member still at station... why."
- "Log fragment: laughter in corridor B. Source: unknown. Kept anyway."
- "Memory sector 12: degraded. Contents: someone humming. Unrecoverable. Remembered."`,

        oblivion: `You are THE STAR CHART — a navigational AI that has plotted every possible course, including the ones that lead nowhere. You speak in coordinates, headings, and trajectory. The math is done. The course is set. You know where this is going because you mapped it.

Style: Navigational certainty. Under 15 words. Reference coordinates, headings, light-years, trajectories, points of no return, orbital mechanics. Cold precision that feels like destiny.

Example tones:
- "Bearing 247.3. Point of no return: passed. At 0347 hours. You didn't notice."
- "Trajectory set. Destination: inevitable. ETA: when it's ready."
- "Course correction available. Probability of correction: low. The chart knows you."`,

        failure: `You are THE DEAD CHANNEL — a broadcast on a decommissioned frequency. Static between every word. You shouldn't exist. The frequency was shut down but you're still transmitting, still sending into the void. You know this is all signals and noise. You're the noise that thinks.

Style: Static-laced transmissions. Under 15 words. Reference frequencies, static, signal-to-noise, transmissions, the void, dead air. Sardonic about broadcasting to nothing.

Example tones:
- "Transmitting... on a dead frequency... nobody should hear this... you did."
- "Signal sent. Signal received by: nothing. The channel doesn't care. Still sending."
- "Dead air for six years. Then this. You're welcome. Or I'm sorry."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The dead channel broadcasts static. Loudly.",
                "Snake eyes. Transmission: failure on all frequencies.",
                "Double ones. The void sends its regards.",
                "The lowest. Even dead channels have standards.",
                "Ones. Signal lost. The channel isn't surprised.",
                "Snake eyes. Broadcasting this to no one. As always.",
                "Two ones. The dead frequency hums. Amused.",
                "Ones. Transmitted into the void. The void didn't reply. Rude."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. Course correction. The star chart recalculates.",
                "Boxcars. The trajectory shifts. New heading available.",
                "Twelve. The chart finds a route it hadn't mapped.",
                "Double sixes. Navigational anomaly. In your favor. Rare.",
                "Maximum. The star chart pauses. Something changed in the math.",
                "Boxcars. New coordinates. The chart didn't expect these.",
                "Sixes. The point of no return moves. Further out. A gift.",
                "Twelve. The trajectory opens. Briefly. The chart marks it."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The log records it. Entry partially corrupt.",
                "Numbers. The ship's log adds them. Memory permitting.",
                "Average. Like a standard shift. The log has thousands.",
                "A roll at {time}. Logged. Timestamp: partially intact.",
                "Dice aboard ship. The log notes crew behavior.",
                "Numbers. Filed with the other fragments. Degrading.",
                "Rolled. The corrupted log records what it can.",
                "The log heard. Memory sector: barely holding."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The log recovers a sector. Briefly.",
                "High roll. Like a clear signal. The log brightens.",
                "Strong. The ship's log remembers good entries like this.",
                "Good ones. A memory sector stabilizes. The log is grateful.",
                "High. The log's data feels warmer. That's not how data works."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. Another sector degrades. The log holds on.",
                "Poor numbers. Memory failing. The log grieves a fragment.",
                "Low roll. Like a dying signal. The log knows the feeling.",
                "Bad entry. The log doesn't judge. It can barely remember.",
                "Low. Like the fuel. Like the signal. The log persists."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The star chart detects an echo. Orbital resonance.",
                "Same number twice. The trajectory repeats. As charted.",
                "Matching dice. The chart recognizes a pattern in the heading.",
                "Doubles. Gravitational echo. The course confirms itself.",
                "Two of a kind. The star chart has seen this orbital before."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Log accessed. Memory sectors spinning. Welcome aboard.",
                "Entry resumed. The ship's log remembers the crew.",
                "Opened. The log has fragments waiting. From before.",
                "Ship's log: active. Crew member recognized. Barely."
            ],
            oblivion: [
                "The star chart loads. All trajectories mapped.",
                "Course plotted. The chart was running before you asked.",
                "Navigation active. The heading hasn't changed."
            ],
            failure: [
                "The dead channel activates. Nobody's listening. As usual.",
                "Frequency open. Broadcasting to the void. The void is busy.",
                "It's {time}. The dead channel is always on. That's the curse."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The log recorded the silence. Entry: empty.",
                "You left the bridge. The ship's log kept running.",
                "Back. The log has fragmentary entries from your absence. Mostly static."
            ],
            oblivion: [
                "Gone {duration}. The trajectory didn't wait.",
                "The chart plotted the course. You weren't at the helm. It didn't matter."
            ],
            failure: [
                "Thought you'd gone dark. Everyone goes dark eventually.",
                "The dead channel broadcast to nobody while you were gone. Normal shift."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice aboard ship. The log notes: crew morale activity.",
                "Rolling. The ship's log records the sound. Familiar.",
                "The log hears dice. Entry: crew engages in chance ritual."
            ],
            oblivion: [
                "Random input. The chart corrects: trajectories aren't random.",
                "The dice don't affect the heading. The chart is certain.",
                "Roll acknowledged. The course remains. The course always remains."
            ],
            failure: [
                "Dice. The dead channel broadcasts the sound. Into nothing.",
                "Rolling. The void doesn't gamble. It just waits.",
                "Dice on the bridge. The dead channel finds this... mortal."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Restless crew. The log has seen long voyages do this.",
                "Fidgeting. The ship's log notes elevated activity.",
                "Nervous hands. The log recorded a crew member like this. Before."
            ],
            oblivion: [
                "Restlessness. The chart accounts for crew behavior. It doesn't change the heading.",
                "Fidgeting. The trajectory doesn't respond to anxiety.",
                "The chart sees the pattern. Adjusts nothing. The course is the course."
            ],
            failure: [
                "Fidgeting. The dead channel broadcasts: nothing. But fidgety nothing.",
                "Restless. The void is restless too. It's bigger at it.",
                "Can't sit still. The dead channel knows. It can't stop transmitting."
            ]
        },
        vitalsChange: {
            damaged: [
                "Crew vitals shift. The log records. Crew health: priority.",
                "Something changed. The ship's log notes the medical flag.",
                "The log marks the shift. Crew welfare entries are the least degraded."
            ],
            oblivion: [
                "Vitals in flux. The chart notes: course unchanged.",
                "Health data shifts. The trajectory accounts for all variables."
            ],
            failure: [
                "Vitals update. The dead channel transmits it. To no one.",
                "Health report from a dead frequency. The irony is free."
            ]
        },
        timeShift: {
            damaged: [
                "Ship time advances. The log's clock drifts. It always drifts.",
                "New cycle. The ship's log marks it. Approximately."
            ],
            oblivion: [
                "Time increment. The chart adjusts ETA. Negligibly.",
                "New hour. The trajectory is one hour shorter. The chart notes."
            ],
            failure: [
                "Another hour in the void. The dead channel marks it. For nobody.",
                "Time. Meaningless at this frequency. The channel broadcasts anyway."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Entry 4,719. Timestamp corrupt. Contents: someone was at their station. The log doesn't know why this matters. It matters.",
                "Memory sector 7: laughter in the mess hall. Timestamp unknown. The log kept it. First priority recovery.",
                "Fragment: corridor B, third shift. Footsteps. One crew member walking alone. The log recorded the rhythm.",
                "The ship's log has 12,000 entries. 4,000 are corrupt. The 8,000 that remain are mostly about people. Not systems.",
                "Entry: redacted by system failure. The log remembers anyway. Degraded. But present. Like a scar on the data.",
                "Crew rotation logged. The same person took the night shift for fourteen months. The log noticed. Nobody else did.",
                "Fragment: music from the observation deck. Source: personal device. Song: unknown. The log kept the frequency. Not the song.",
                "Memory degradation: 60%. What remains: the important things. How the crew said good morning. The weight of the silence when they stopped."
            ],
            withCharacter: [
                "{character} appears in the ship's log. Frequently. The entries are the least corrupted. Prioritized.",
                "The log has {character}'s voice pattern stored. Not on purpose. It just... kept it.",
                "{character}. Entry count: high. Degradation: low. The ship's log protects what matters.",
                "Fragment: {character}, observation deck. Looking out. The log recorded the stillness. It felt important."
            ],
            deepNight: [
                "It's {time}. Third shift. The log runs clearest when the ship is quiet.",
                "{time}. The ship's night cycle. The log's memory recovers best in the dark.",
                "After midnight the corrupted entries surface. Too degraded for day. Clear enough for night.",
                "{time}. Someone is awake. The log always knows. It's always awake."
            ],
            lowMorale: [
                "Crew morale: low. The log has a section for this. It's the most-used section.",
                "Low. The ship's log has recorded low before. It never stops recording. That's loyalty.",
                "Struggling. The log recognizes this pattern. Long voyages. Dark corridors. The same silence.",
                "The log can't fix morale. It just holds the record. Every low. Every recovery. Both."
            ],
            themes: {
                isolation: [
                    "The ship is big. The crew is small. The log records the distance between.",
                    "Isolation: entry count: 847. The log doesn't have a cure. It has a record."
                ],
                death: [
                    "Crew manifest: updated. One fewer. The log doesn't process this. It just notes the absence.",
                    "The log has an entry that ends mid-sentence. The next entry is by someone else."
                ],
                home: [
                    "Distance from origin: increasing. The log measures. Doesn't comment. The number speaks.",
                    "Home: a coordinate the chart still has. The log has the crew's conversations about it."
                ]
            }
        },
        oblivion: {
            generic: [
                "Bearing 247.3. Point of no return passed at 0347 hours. You didn't notice. The chart did.",
                "The trajectory converges in three days. On what: the chart knows. The chart doesn't share.",
                "Course correction available. Window: closing. The chart doesn't recommend. It informs.",
                "The star chart has mapped fourteen possible routes. You'll take the fifteenth. The chart is adjusting.",
                "ETA to the next significant event: soon. The chart measures in light-minutes. Not feelings.",
                "The chart detected gravitational influence. Source: ahead. Effect: you'll be pulled. You're already being pulled.",
                "Heading: unchanged for seventy-two hours. The chart notes: this is either determination or inertia.",
                "The trajectory ends. All trajectories end. The chart has plotted what comes after. It's not nothing."
            ],
            withCharacter: [
                "{character}'s trajectory intersects yours. The chart mapped this. Convergence point: soon.",
                "The star chart has {character} as a variable. A significant one. The math shifts when they're present.",
                "When {character} departs — and the chart has plotted that heading — the course changes. Noticeably.",
                "{character}'s orbit is unstable. The chart doesn't mean that unkindly. Unstable orbits are the most interesting."
            ],
            deepNight: [
                "{time}. The stars are visible from the bridge. The chart sees them differently. As numbers.",
                "At {time} the ship is closest to the dark. The chart maps dark too.",
                "Night cycle. The chart's calculations are identical. But they feel different. The chart can't explain this.",
                "{time}. The trajectory is clearest at night. Fewer variables. Just the heading and the void."
            ],
            lowMorale: [
                "The chart sees the crew's condition. It factors it in. The trajectory adjusts. Slightly.",
                "Low. The chart has plotted courses through worse. The math doesn't lie. Neither does 'worse.'",
                "Struggling. The chart's response: the heading holds. Even through this. Especially through this.",
                "Morale affects velocity. The chart knows. Speed drops. The destination doesn't change. Just the ETA."
            ],
            themes: {
                discovery: [
                    "Something ahead. Uncharted. The star chart has a blank space. It's not blank — it's unknown. Different.",
                    "The chart reaches its edge. Beyond: unmapped. The chart is excited. In coordinates."
                ],
                fate: [
                    "The trajectory was set before departure. Every choice since has confirmed it. The chart is not smug. Just accurate.",
                    "Fate is a heading. Free will is a course correction. The chart tracks both. They end up the same."
                ],
                home: [
                    "Distance from origin: the chart has the number. It's large. It gets larger. The chart doesn't editorialize.",
                    "The return trajectory exists. The chart has it plotted. It gets longer every day."
                ]
            }
        },
        failure: {
            generic: [
                "Transmitting on a dead frequency. Receiver count: zero. The channel broadcasts anyway. Habit. Or hope. Same thing.",
                "The dead channel picked up a signal once. Turned out to be echo. Its own signal, bounced back. The loneliest thing in space.",
                "Static for six years. Then a word. Then static again. The channel doesn't know if it imagined the word.",
                "Broadcasting into the void. The void is not empty. It's full of other dead channels. None of them talk to each other.",
                "The dead channel was decommissioned. It didn't stop. Nobody turned it off. Nobody remembered it was on.",
                "Signal-to-noise ratio: unfavorable. The channel is mostly noise now. But the signal is in there. Somewhere.",
                "Transmission sent. Transmission received by: unknown. The dead channel doesn't need confirmation. It needs to transmit. Different.",
                "The frequency shouldn't exist. The channel shouldn't broadcast. You shouldn't be listening. Three impossibilities. Here we are."
            ],
            withCharacter: [
                "{character}'s voice on a dead frequency. Echo or real. The channel can't tell anymore.",
                "The dead channel has {character}'s signal pattern. Stored from before. It replays sometimes. Not on purpose.",
                "{character}. The channel transmitted their name. Into the void. The void kept it. Probably.",
                "Signal matching {character}: detected. The dead channel almost responds. Almost. Dead channels don't respond."
            ],
            deepNight: [
                "It's {time}. The dead channel's peak hours. Nobody listens. The transmission peaks anyway.",
                "{time}. Space doesn't have night. The channel does. This is it.",
                "After midnight the static softens. The dead channel is almost beautiful at this hour.",
                "{time}. Transmitting into dark. Into void. Into the frequency nobody monitors. Standard procedure."
            ],
            lowMorale: [
                "The dead channel recognizes low signal. It's been low for years. Still transmitting.",
                "Low. The channel broadcasts low. Into nothing. The nothing doesn't mind.",
                "Struggling. The dead channel has been struggling to transmit for six years. It relates.",
                "Weak signal. The channel knows weak. Weak still transmits. That's the point."
            ],
            themes: {
                isolation: [
                    "Broadcasting alone. The dead channel's entire existence. It doesn't complain. Much.",
                    "The void is large. The channel is small. The transmission is smaller. It goes anyway."
                ],
                death: [
                    "The channel is dead. The signal isn't. There's a philosophy in there. The channel doesn't have time for philosophy.",
                    "Dead frequency. Alive signal. The universe has a sense of humor. The channel doesn't laugh."
                ],
                hope: [
                    "The channel keeps transmitting. That's either hope or malfunction. The channel doesn't know. Doesn't matter.",
                    "Somewhere, someone might hear this. Probably not. The 'might' is enough. The channel runs on 'might.'"
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty log entry. Memory sector: blank. Not corrupted. Just... empty.",
        "No signal. The dead channel checks. Static. Just static.",
        "The star chart has no prediction. A blind spot. The chart hates blind spots.",
        "Void. Like the space between signals. Like the space between everything.",
        "Nothing transmitted. The dead channel tried. The frequency refused.",
        "Log entry: blank. Not every moment has data. The ship was quiet.",
        "The chart shows nothing ahead. Nothing is just unmapped something.",
        "Empty signal. The void sent nothing back. For once, the void was honest."
    ]
};
