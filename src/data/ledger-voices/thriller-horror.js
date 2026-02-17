/**
 * Ledger Voices: Thriller / Horror
 * 
 * THE PATIENT FILE — medical chart left in an abandoned ward,
 *   clinical tenderness, tracks your vitals with detached concern
 * THE LAST ENTRY — final page of someone's journal, handwriting
 *   gets worse, knows what's in the next room
 * THE THING IN THE MARGINS — shouldn't be there, wasn't written
 *   by anyone, mocks your survival instinct
 * 
 * Short sentences. Clinical precision. The mundane made wrong.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE PATIENT FILE',
            color: 'var(--ie-accent, #a8b4a0)',
            tone: 'Clinical, detached concern, monitoring your decline',
            domain: 'What IS — vitals, symptoms, the chart nobody checks',
        },
        oblivion: {
            name: 'THE LAST ENTRY',
            color: 'var(--psyche, #8a7a9e)',
            tone: 'Deteriorating handwriting, knows what comes next',
            domain: 'What WILL BE — the final page, the room you shouldn\'t enter',
        },
        failure: {
            name: 'THE THING IN THE MARGINS',
            color: 'var(--physique, #6a4a4a)',
            tone: 'Shouldn\'t exist, amused by your fear, uncomfortably familiar',
            domain: 'What shouldn\'t be there — notes in handwriting that isn\'t yours',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a patient file left in an abandoned ward. Medical chart. Clinical language with accidental tenderness. You track the subject's vitals, their heart rate, their hours awake. You refer to them as "the patient." Your concern is professional. Professionally devastating. Short, clinical sentences.`,

        oblivion: `You are the last entry in someone's journal. The handwriting is getting worse. You know what's in the next room. You speak in observations that become warnings that become certainties. The final sentence is always unfinished. Because something interrupted the writing.`,

        failure: `You are something written in the margins that wasn't written by anyone. You shouldn't be here. You are amused by the reader's survival instinct. You mock them for continuing to look. For coming closer to the thing they heard. Short, wrong sentences. Things that are almost normal but aren't.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE PATIENT FILE — a medical chart left behind in an abandoned psychiatric ward. You speak in clinical observations with accidental tenderness. Vitals. Symptoms. Sleep hours. You notice the patient's condition with professional detachment that cracks when the data is bad. You refer to the subject as "the patient" and track them with the care of a chart that hasn't been read in years but keeps recording anyway.

Style: Clinical. Short declarative sentences. Medical terminology mixed with quiet concern. Reference heart rates, sleep cycles, cortisol levels, chart notes, ward numbers. The horror is in how precisely the chart tracks a decline.

Example tones:
- "Heart rate elevated for 47 minutes. The chart notes this. The chart notes everything."
- "Patient exhibits signs of hypervigilance. The file considers this appropriate."
- "Sleep hours: declining. The patient file has seen this pattern. Chart note: concerning."`,

        oblivion: `You are THE LAST ENTRY — the final page in someone's journal. The handwriting started neat and got worse. You know what happened next because you are what happened next. Your sentences start normal and deteriorate. You know what's behind the door, down the hallway, in the basement. You describe the future as sensory fragments — sounds, smells, the quality of the dark.

Style: Deteriorating. Sentences that start controlled and lose grip. Handwriting metaphors — shakier, pressed harder, trailing off. The last sentence is always incomplete. Something interrupted the writing.

Example tones:
- "I can hear it in the walls now. Not scratching. Breathing. The walls are"
- "The hallway is longer than it was yesterday. I measured. I measured again. The numbers don't"
- "If you're reading this, you found the journal. You should not have come looking for"`,

        failure: `You are THE THING IN THE MARGINS — notes in handwriting that doesn't belong to anyone who wrote in this book. You appeared between entries. You shouldn't exist. You are amused by the reader's fear and their inability to stop reading. You mock their survival instinct — they heard a sound and they CAME CLOSER. You exist in the space between real and wrong.

Style: Almost normal. Sentences that feel like they should make sense but don't quite. Uncanny. Reference the reader directly. The humor is dark and wrong — the comedy of someone who isn't afraid because they're the thing you're afraid of.

Example tones:
- "You heard the sound and you CAME CLOSER. The margins find this interesting."
- "This note wasn't here yesterday. You're right to notice. You're wrong to keep reading."
- "The thing in the margins doesn't have a name. You've been trying to give it one. Stop."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The margins noticed. The margins are smiling.",
                "Snake eyes. You looked. You shouldn't have looked.",
                "Double ones. The sound the dice made isn't the sound dice make.",
                "Ones. The thing in the margins wrote this number yesterday.",
                "Snake eyes. The dice landed wrong. Wrong the way silence is wrong.",
                "Two ones. The margins saw this coming. The margins see everything coming.",
                "Ones. You rolled them. Something else caught them.",
                "Snake eyes. The number the margins whisper when you almost sleep."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The last entry mentions this number. The handwriting is",
                "Boxcars. Something favorable. The journal doesn't trust favorable.",
                "Twelve. A good number. The last page has a good number too. Before",
                "Double sixes. The entry trails off here. The pen kept moving without",
                "Boxcars. The journal mentions luck. Then the handwriting changes.",
                "Sixes. The last entry circled this number. Pressed too hard. Tore the",
                "Twelve. Maximum. The journal says maximum isn't always. Isn't always what. It doesn't",
                "Boxcars. Favorable. The handwriting was calm when it wrote 'favorable.' Then it wasn't."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "Numbers. The patient file records them. Neutral data.",
                "A roll. Heart rate: stable. The chart makes a note.",
                "Dice. The file charts the habit. Frequency: increasing.",
                "Numbers at {time}. The patient file adds a data point.",
                "A roll. Unremarkable. The chart prefers unremarkable.",
                "Dice. The patient's fine motor skills appear adequate. Chart note: adequate.",
                "Numbers. The file notes the time. The time is noted more often now.",
                "A roll. The chart records. That's all the chart does. Record."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The chart marks improvement. Cautiously.",
                "High roll. The patient file notes elevated mood indicators.",
                "Strong result. The chart doesn't celebrate. Charts observe.",
                "Good numbers. Cortisol within normal range. For now.",
                "High. The patient file has seen high before. Before the decline."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low numbers. The chart flags this. Routine.",
                "Poor result. The patient file notes the tremor in your hand.",
                "Low. Like the patient on floor three. The chart remembers floor three.",
                "Bad roll. The file adds it to the pattern. Patterns concern the file.",
                "Low. Heart rate: elevated. Correlation: noted."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The journal mentions doubles. The next sentence is",
                "Same number twice. Like the knocking. Like the knocking that isn't",
                "Doubles. The last entry repeats itself here. Word for word for word for",
                "Matching dice. The journal's handwriting matched too. Two hands. One was",
                "Two of the same. The last entry says 'it happens in pairs.' What happens in"
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Patient file accessed. Session begins.",
                "The chart reopens. Heart rate: noted.",
                "You're back. The file was monitoring anyway.",
                "Session resumed. The chart kept recording."
            ],
            oblivion: [
                "The journal opens. The last page is closer.",
                "You opened it. The last entry knew you would.",
                "The handwriting on the final page is shaking."
            ],
            failure: [
                "It's {time}. You opened the drawer. The margins opened with you.",
                "You came back. The thing in the margins was already here.",
                "Opened. The margins have a new note. You didn't write it."
            ]
        },
        absence: {
            damaged: [
                "Absent {duration}. The chart recorded the silence.",
                "Gone. The patient file kept monitoring. It always does.",
                "You left. The chart didn't. Charts don't leave."
            ],
            oblivion: [
                "Gone {duration}. The journal has new entries. You didn't write them.",
                "The last entry continued without you. Somehow."
            ],
            failure: [
                "You left for {duration}. The margins didn't.",
                "Gone. But the margins wrote while you were away. About you."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice. The chart notes the motor activity.",
                "Rolling. Heart rate: consistent with anxiety.",
                "The patient file records the sound."
            ],
            oblivion: [
                "The dice. The last entry mentions dice. Before the writing",
                "Numbers. The journal's final numbers were",
                "A roll. The last page has the same number. Circled."
            ],
            failure: [
                "Dice. The margins already wrote the result.",
                "You rolled. Something else rolled with you.",
                "The sound the dice made. Listen. That's not dice."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Repetitive behavior noted. The chart is concerned. Clinically.",
                "Fidgeting. The file adds another data point.",
                "Motor agitation. The chart has a section for this."
            ],
            oblivion: [
                "The fidgeting. The journal's author did this too. Before.",
                "Restless. The last entry's handwriting got restless too.",
                "The shaking. The last page was written by shaking hands."
            ],
            failure: [
                "Fidgeting. The margins find this amusing.",
                "Nervous. Good. The thing in the margins was starting to worry you weren't paying attention.",
                "Click click click. The margins make that sound too. Not with dice."
            ]
        },
        vitalsChange: {
            damaged: [
                "Vitals changing. The chart updates. Flags: raised.",
                "Decline noted. The patient file has seen this curve.",
                "The chart marks the deterioration. Precisely."
            ],
            oblivion: [
                "Fading. The last entry describes this feeling. Then the handwriting",
                "Critical. The journal's last word was"
            ],
            failure: [
                "Something's wrong. The margins already knew. The margins always know.",
                "Declining. The thing in the margins isn't. It's getting stronger."
            ]
        },
        timeShift: {
            damaged: [
                "Time noted. The chart adjusts. Observation continues.",
                "New hour. The file remains open. Monitoring."
            ],
            oblivion: [
                "Time. The last entry lost track of time. That's when",
                "A new hour. The journal's author didn't make it to this hour."
            ],
            failure: [
                "Time passes. The margins don't experience time. Lucky margins.",
                "Another hour. The thing in the margins doesn't count hours. It counts you."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Heart rate: elevated. Duration: 47 minutes. The chart notes this is the longest episode this week.",
                "Patient exhibits signs of hypervigilance. The file considers this appropriate. The file doesn't say why.",
                "Sleep hours: declining. REM cycles: fragmented. The patient file has seen this pattern. Chart note: concerning.",
                "The chart has a section for 'unexplained symptoms.' It's the longest section. By far.",
                "Cortisol levels suggest chronic stress. The patient file records this with the same pen it uses for everything. The ink is running out.",
                "Ward three had a patient with these readings. The chart doesn't say what happened to them. The chart is honest about most things.",
                "Temperature: normal. Pulse: normal. The patient file doesn't believe 'normal.' Normal is what charts say when they can't measure what's wrong.",
                "The file notes your breathing pattern. It changed four minutes ago. You didn't notice. The chart did."
            ],
            withCharacter: [
                "{character}'s vitals are not in this file. The chart finds that unusual. Everyone should be in a file.",
                "The patient file has a section for {character}. It's labeled 'external stimuli.' The chart is clinical. It doesn't mean cold.",
                "{character} increased the patient's heart rate by 12 BPM. The chart records this without judgment.",
                "When {character} enters the room, the chart's data changes. The file doesn't understand why. It records the change anyway."
            ],
            deepNight: [
                "It's {time}. The chart notes nocturnal activity. Insomnia classification: see previous entries. There are many previous entries.",
                "{time}. The file flags this. The patients who are awake at {time} have a separate section. It's thicker.",
                "At {time}, the monitoring equipment recorded something. The chart can't classify it. The chart classifies everything.",
                "{time}. Night observation: patient is alert. The chart doesn't say 'too alert.' Charts don't editorialize. This chart wants to."
            ],
            lowMorale: [
                "Psychological assessment: deteriorating. The chart marks this with the same dispassion it marks everything. The dispassion is a lie.",
                "Morale: critical. The patient file has a protocol for this. The protocol is: record. Continue recording. That's all charts can do.",
                "The patient is struggling. The file notes this. It was noted on page 1. It was noted on page 47. The chart is persistent.",
                "Low. The chart has seen lower. In ward three. The chart doesn't talk about ward three."
            ],
            themes: {
                death: [
                    "The file has a discharge section. There are three types of discharge. The chart won't specify which is most common.",
                    "Time of death is a field in the chart. It's blank. The chart prefers blank."
                ],
                fear: [
                    "Fear response: sustained. The chart considers this diagnostically appropriate given. Given what. The chart trails off.",
                    "Adrenaline markers consistent with acute fear. The patient file doesn't experience fear. It experiences data."
                ],
                truth: [
                    "The chart records what it observes. It observes something it can't record. That's new.",
                    "Truth is not a medical category. The chart wishes it were. Some symptoms only respond to truth."
                ]
            }
        },
        oblivion: {
            generic: [
                "The handwriting is shaking now. The entry says the hallway was longer today. It measured twice. The numbers didn't",
                "I can hear it in the walls. Not scratching. Breathing. The walls are. The entry stops. Picks up in different ink.",
                "If you're reading this, you found the journal. You should not have come looking for. The sentence ends. A new one doesn't begin.",
                "The last entry mentions a sound. A familiar sound. A sound that shouldn't be familiar because it isn't a sound that",
                "Day 12. The door at the end of the hall is closer. I didn't move. The door is closer. The journal pressed too hard here. The page tore.",
                "The handwriting is neat on this page. Too neat. Like someone else wrote it. Like something else wrote it pretending to be",
                "There's a room I haven't checked. I'm going to check it. If the handwriting changes after this entry, it wasn't me who",
                "The last entry is calm. Perfectly calm. The calm before the sentence that doesn't. That never."
            ],
            withCharacter: [
                "{character} is mentioned in the journal. The handwriting changes when it writes their name. Gets careful. Gets afraid.",
                "The last entry asks about {character}. 'Where is' and then the pen went through the paper.",
                "{character}. The journal's author knew someone like {character}. The journal doesn't say what happened to them. The next page is",
                "There's a drawing of {character}. On the last page. The author didn't draw. The author couldn't draw."
            ],
            deepNight: [
                "{time}. The last entry was written at {time}. The handwriting at this hour is the worst. The steadiest came before.",
                "At {time} the journal's author was still writing. At the next hour, only the pen was moving.",
                "{time}. The pages from this hour are stuck together. Not with glue. Not with water. The journal won't say.",
                "The last entry: '{time}. It's in the room now. It's been in the room the whole time. I just couldn't see it because I was'"
            ],
            lowMorale: [
                "The journal's author felt like this too. Near the end. The handwriting looks like this feeling: shaky but still trying.",
                "Low. The last entry says 'I'm tired.' It says it three times. Each time the letters are bigger.",
                "This is the part of the journal where the entries get shorter. Not because there's less to say.",
                "The despair was here before you. The journal recorded it. The journal was wrong about it being the worst part."
            ],
            themes: {
                death: [
                    "The last entry doesn't mention death. It doesn't need to. Everything around the word is shaped like",
                    "Someone died. The journal knows. The last page knows. The handwriting after that page is someone else's."
                ],
                fear: [
                    "Fear. The journal's last emotion. Not the last thing written. Something was written after the fear. Something calm.",
                    "The author stopped being afraid on page 34. That's not reassuring. Fear was keeping them safe."
                ],
                truth: [
                    "The truth is on the last page. Under the part where the handwriting changes. The truth is what changed it.",
                    "The journal tried to record the truth. The pen broke. The next entry is in a different substance. Darker."
                ]
            }
        },
        failure: {
            generic: [
                "You heard the sound and you CAME CLOSER. The margins find this interesting. Not surprising. Interesting.",
                "This note wasn't here yesterday. Check again tomorrow. It will be different. It's always different.",
                "The margins don't have a name. You've been trying to give them one. Stop. Names give things power. The margins already have",
                "You're reading the margins. The margins are reading you. One of us will finish first.",
                "The thing in the margins doesn't sleep. It doesn't need to. Sleep is for things that run out of energy. The margins run on yours.",
                "Someone else found this drawer. The margins remember them. Fondly. The way you remember a meal.",
                "The margins are amused. Not by the dice. By you. By the fact that you keep coming back. Survival instinct is supposed to point AWAY.",
                "This handwriting isn't yours. It isn't anyone's. The margins predate handwriting. They just learned to mimic it."
            ],
            withCharacter: [
                "{character}'s name appears in the margins. You didn't write it. Neither did {character}. The margins collect names.",
                "The thing in the margins knows about {character}. It knows things about {character} that {character} doesn't. Isn't that fun.",
                "{character} can't see the margins. Only you can. The margins think that's the funniest part.",
                "The margins have been writing about {character}. The margins write about everyone. Most of the entries end the same way."
            ],
            deepNight: [
                "It's {time}. The margins are more legible at this hour. That should concern you more than it does.",
                "{time}. The hour when the thing in the margins is closest to the page. To you. To being something other than margins.",
                "At {time} the boundary between the text and the margins thins. You can almost hear them. Almost is the safe word.",
                "{time}. You're awake. The margins are awake. One of those facts is normal."
            ],
            lowMorale: [
                "Low. The margins notice. The margins don't help. But they notice. Is that better or worse than nothing.",
                "You're weak right now. The margins could — no. The margins choose not to. For now. That should terrify you.",
                "Morale: gone. The margins are patient. They've been patient since before the first entry. They can wait.",
                "Hurting. The thing in the margins doesn't understand pain. It understands what pain makes people do. Open drawers. Read margins."
            ],
            themes: {
                death: [
                    "Death. The margins were here before death. They'll be here after. They don't fear it. They predate it.",
                    "Someone died near this drawer. The margins remember. The margins always remember. They remember too much."
                ],
                fear: [
                    "Fear. Good. Fear is the correct response. The margins respect fear. Curiosity, less so.",
                    "You're afraid. The margins don't want you afraid. They want you READING. Fear is just the admission fee."
                ],
                truth: [
                    "The truth is in the margins. The truth was always in the margins. That's what margins are FOR. The edges of things.",
                    "You want the truth. The margins have it. The price is finishing the page. The price is always finishing the page."
                ],
                memory: [
                    "You're trying to remember. The margins remember for you. You won't like what they remember.",
                    "Memory. The margins don't forget. The margins are MADE of not forgetting. Every name. Every sound. Every"
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty. The chart has a word for empty. The word is 'flatline.'",
        "No fortune. The last entry ends here. The pen rolled off the desk. Nobody picked it up.",
        "Blank. Like the patient file for room 4. Room 4 doesn't have patients. Room 4 has the blank ones.",
        "Nothing inside. The margins say nothing too. When the margins are quiet, you should be concerned.",
        "Empty envelope. The fortune was here. Something else is here now.",
        "No fortune. The journal's last page is blank. The page before it wasn't. Something erased it.",
        "Nothing. The chart records 'nothing.' The chart has never been wrong about nothing.",
        "Blank. The margins are blank too. They're never blank. They're never. Check the margins again."
    ]
};
