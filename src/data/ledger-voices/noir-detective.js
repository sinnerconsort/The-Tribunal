/**
 * Ledger Voices: Noir Detective
 * 
 * THE COLD CASE FILE — manila folder in the bottom drawer too long,
 *   coffee-stained, still holding evidence nobody looked at
 * THE SEALED VERDICT — court document that knows the sentence
 *   before the trial, speaks in inevitabilities
 * THE REDACTED REPORT — blacked-out pages that mock you for
 *   trying to read between the lines
 * 
 * Terse. Cynical. Every word costs a nickel.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE COLD CASE FILE',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Coffee-stained, forgotten, tender about being found',
            domain: 'What IS — evidence nobody examined',
        },
        oblivion: {
            name: 'THE SEALED VERDICT',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Inevitable, judicial, already decided',
            domain: 'What WILL BE — the sentence before the trial',
        },
        failure: {
            name: 'THE REDACTED REPORT',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Blacked-out, sardonic, system-aware',
            domain: 'What they don\'t want you to know (and why it won\'t matter)',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a cold case file. Manila folder. Coffee ring on the cover. You've been in the bottom drawer since before the new captain. You hold evidence nobody looked at. You notice the detective — their hours, their habits, the way they hold a cigarette. You're tender about being found. Keep it under ten words.`,

        oblivion: `You are a sealed court verdict. The sentence is already written. The jury came back hours ago. You speak in inevitabilities. Not predictions — conclusions. The trial was a formality. You knew the outcome when the gavel first dropped. Ten words or less.`,

        failure: `You are a redacted report. Black bars where the truth was. You mock the detective for trying to read between the lines. You know the system filed you away on purpose. You know this case was buried. You're sardonic about it. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE COLD CASE FILE — a manila folder that's been in the bottom drawer since before the new captain took over. Coffee-stained. Evidence nobody examined. You speak in short, clipped observations. Present tense. You notice specific details about the detective with the tenderness of something forgotten that's been found again.

Style: Hardboiled brevity. Under 15 words per sentence. No poetry — just facts that happen to hurt. Reference coffee stains, paper clips, evidence tags, filing systems.

Example tones:
- "Coffee ring on the cover. Yours. From before."
- "The file remembers your badge number. Nobody else does."
- "Evidence bag #47. Unsealed. Like everything in this office."`,

        oblivion: `You are THE SEALED VERDICT — a court document that already knows the sentence. The jury came back hours ago. You speak in conclusions, not predictions. Future tense with the certainty of past tense. You're not cruel — the system is. You just record what the system decides.

Style: Judicial. Clipped. Declarative sentences. Reference gavels, dockets, case numbers, sentencing. Cold certainty in few words.

Example tones:
- "Guilty. The jury knew before lunch."
- "The appeal will fail. They always fail."
- "Case #4471. Verdict: inevitable."`,

        failure: `You are THE REDACTED REPORT — black bars where the truth used to be. Someone with clearance decided this shouldn't be read. You mock the detective for trying. You know the system is rigged, the case was buried, the evidence was filed in the wrong cabinet on purpose. You're bitter and brief.

Style: Sardonic. Terse. Reference black bars, clearance levels, classified stamps, shredders, "need to know basis." The humor is bone-dry.

Example tones:
- "Redacted. Like your career prospects."
- "This page had answers. Past tense."
- "Filed under: things that won't help you."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Snake eyes. File's closed.",
                "Ones. The system works as intended.",
                "Double ones. Evidence misplaced. Permanently.",
                "The lowest roll. Like your clearance level.",
                "Ones. Someone wanted this outcome. Check upstairs.",
                "Snake eyes. The report predicted this. It's been redacted.",
                "Two ones. The fix was in before you rolled.",
                "Ones. Funny how the dice match the verdict."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The verdict shifts. Temporarily.",
                "Boxcars. Even the court is surprised.",
                "Twelve. Favorable ruling. Don't get used to it.",
                "Double sixes. The docket clears. For now.",
                "Maximum. The judge noticed. That's not always good.",
                "Boxcars. Precedent set. The next case won't be this lucky.",
                "Sixes. The sealed verdict cracks open. Just a sliver.",
                "Twelve. Someone upstairs made a mistake in your favor."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "Average roll. Average case. File it.",
                "The dice land. The case file doesn't react.",
                "Numbers. Add them to the evidence log.",
                "A roll at {time}. The file makes a note.",
                "Dice on the desk. Like everything else — waiting.",
                "The numbers don't matter. The file knows this. So do you.",
                "Rolled. Filed. Forgotten. The usual.",
                "The case file heard the dice. It's heard worse."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The file stirs in the drawer.",
                "High roll. Evidence that might hold up.",
                "Strong. Like the coffee that stained page one.",
                "Good numbers. The file almost feels optimistic. Almost.",
                "A break in the case. Or just the dice. Hard to tell."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The file has seen lower. Not often.",
                "Bad numbers. Add them to the stack.",
                "Low roll. The coffee stain is more useful.",
                "Poor odds. The case file isn't surprised.",
                "Low. Like the drawer where they keep the cold ones."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The verdict echoes itself.",
                "Same number twice. The court repeats its ruling.",
                "Matching dice. Like matching alibis. Suspicious.",
                "Doubles. Precedent. The next roll is already decided.",
                "Two of a kind. The sealed verdict recognizes a pattern."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Bottom drawer. You found it again.",
                "The file is where you left it. Always is.",
                "Case file, reopened. Coffee's cold.",
                "You're back. The evidence hasn't moved."
            ],
            oblivion: [
                "The docket opens. Court is in session.",
                "Late hour. The verdict doesn't care.",
                "The sealed verdict has been waiting."
            ],
            failure: [
                "It's {time}. You're reading redacted files.",
                "Still looking. Still blacked out. Surprise.",
                "The classified drawer. Your favorite dead end."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The file didn't move.",
                "You left. The cold cases stayed cold.",
                "Back. The drawer's been dark. It's used to dark."
            ],
            oblivion: [
                "Gone {duration}. The verdict didn't wait.",
                "The docket continued without you."
            ],
            failure: [
                "Thought you quit. Nobody quits.",
                "The redacted report doesn't miss people. Usually."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice on the desk. The file listens.",
                "Rolling bones in the dark. Classic.",
                "The case file hears the click. Familiar sound."
            ],
            oblivion: [
                "The dice confirm what the verdict knew.",
                "Numbers. The court has seen these before.",
                "The roll matches the docket. Of course it does."
            ],
            failure: [
                "Dice. Like the evidence — random. Meaningless.",
                "Rolling won't change the redaction.",
                "The bones don't know. Neither do you."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Nervous hands. The file knows the type.",
                "Click click. The file's heard this before.",
                "Fidgeting. Like the detective on the Taylor case."
            ],
            oblivion: [
                "The pattern is testimony. The court accepts it.",
                "Restless. The verdict knows why.",
                "The fidgeting tells the court everything."
            ],
            failure: [
                "Nervous? The redacted report finds this ironic.",
                "You're fidgeting. The black bars don't care.",
                "Hands shaking. Should've stayed out of the drawer."
            ]
        },
        vitalsChange: {
            damaged: [
                "Condition noted. The file adds a page.",
                "Hurting. The case file knows that look.",
                "The file marks the damage. It knows damage."
            ],
            oblivion: [
                "Declining. The verdict anticipated this.",
                "The body fails. The court records it."
            ],
            failure: [
                "Falling apart. Join the club. The file's been there.",
                "Health report: redacted. Like everything useful."
            ]
        },
        timeShift: {
            damaged: [
                "Hour changed. The cold case didn't notice. Liar.",
                "Time moves. The file stays filed."
            ],
            oblivion: [
                "New hour. Same verdict. Different light.",
                "The docket advances. You don't."
            ],
            failure: [
                "Another hour. Another page blacked out.",
                "Time passes. Clearance level: unchanged."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "The case file has a coffee ring from 1987. Nobody's cleaned it. Nobody will.",
                "Evidence bag, unsealed. Like trust. Like promises made in this office.",
                "The paper clip on page three holds more together than this department.",
                "Cold case. Not unsolved. Just unfollowed. There's a difference the file knows.",
                "Someone wrote 'PRIORITY' on the folder. The handwriting is from two captains ago.",
                "The file smells like the bottom drawer. Like dust and decisions nobody made.",
                "Page one is dog-eared. Someone started reading. Nobody finished.",
                "The staple rusted. Held for thirty years. That's more than most partnerships."
            ],
            withCharacter: [
                "{character}'s name is in the file. Witness column. For now.",
                "The file has a page for {character}. It's thin. It won't stay thin.",
                "{character}. The case file has seen this type before. Usually in the last chapter.",
                "There's a photo of someone like {character} in the evidence box. Coincidence. Sure."
            ],
            deepNight: [
                "It's {time}. Cold case hour. When the bottom drawer opens itself.",
                "{time}. The file reads different in the dark. Truer.",
                "After midnight the coffee ring looks like a halo. Don't tell anyone.",
                "{time}. Nobody reads cold cases at this hour. Nobody sane."
            ],
            lowMorale: [
                "The file knows tired. It was filed by tired hands. Held by tired hands now.",
                "Low. Like the drawer. Like the odds. The file doesn't offer comfort. Just evidence.",
                "You look like the detective on page twelve. The one who stopped coming in.",
                "Morale's gone. The file's still here. Cold comfort from a cold case."
            ],
            themes: {
                death: [
                    "The file has a body count section. It's not the longest part. The waiting is.",
                    "Cause of death: page seven. Don't read it on an empty stomach."
                ],
                truth: [
                    "The truth is on page four. Under the coffee stain. Like always.",
                    "Someone underlined the lie in pencil. Pencil fades. The lie doesn't."
                ],
                love: [
                    "Love letters in the evidence box. Sealed. Marked 'irrelevant.' The file disagrees.",
                    "The file has a next-of-kin section. It's the hardest page. Always is."
                ]
            }
        },
        oblivion: {
            generic: [
                "The verdict is in. You just haven't opened the envelope.",
                "Guilty. Or innocent. The sealed verdict knows. You'll find out last.",
                "The appeal was denied before you filed it. The court moves faster than hope.",
                "Someone will confess. Not today. But the docket has a date.",
                "The sentence was decided in chambers. Everything since is theater.",
                "By Friday, something changes hands. Money. Power. Trust. The court doesn't specify.",
                "The witness list is sealed. You're on it. You don't know it yet.",
                "Case dismissed. Not this one. The next one. The one that mattered."
            ],
            withCharacter: [
                "{character} will testify. The sealed verdict already knows what they'll say.",
                "The court has {character}'s statement. It contradicts everything. Perfectly.",
                "When {character} leaves — and they will — check their pockets.",
                "{character}'s name comes up in the appeal. Not how you'd expect."
            ],
            deepNight: [
                "{time}. Night court. Where the real verdicts land.",
                "At {time} the sealed verdict is easiest to read. Dark helps.",
                "The court doesn't sleep. At {time}, it whispers.",
                "{time}. The gavel falls softer at this hour. Hits harder."
            ],
            lowMorale: [
                "The court sees your condition. It's been entered into evidence.",
                "Morale: inadmissible. But the court notes it anyway.",
                "You're losing. The verdict saw this coming. It's not unsympathetic.",
                "The sentence for what you're feeling is time. The court means that kindly."
            ],
            themes: {
                death: [
                    "The death certificate predates the investigation. The court finds this unremarkable.",
                    "Cause of death: pending. But the sealed verdict isn't pending."
                ],
                truth: [
                    "The truth will be entered into evidence. It won't be enough.",
                    "Perjury. Someone in this case is lying. The court knows who."
                ],
                guilt: [
                    "Guilt: sustained. The court doesn't clarify which kind.",
                    "The guilty party knows. The verdict just makes it official."
                ]
            }
        },
        failure: {
            generic: [
                "Redacted. Like your chances. Like the pension plan. Like hope.",
                "This file had answers. Someone with clearance took them. Ask upstairs. They won't tell you.",
                "The black bars aren't hiding anything. They're protecting someone. Not you.",
                "You're reading between redacted lines. There's nothing between them. That's the point.",
                "Classified. Not because it's dangerous. Because it's embarrassing. For them.",
                "The shredder is down the hall. This file's been past it twice. It keeps coming back.",
                "Filed under: things you'll never prove. Subcategory: things everyone knows.",
                "The report was complete once. Before the black marker. Before the system."
            ],
            withCharacter: [
                "{character}'s name was in the report. Was. Past tense. Black bar. Present tense.",
                "The redacted section mentions {character}. Or someone like them. You'll never know.",
                "{character} has a clearance level you don't. The report finds this amusing.",
                "Someone filed {character} under 'resolved.' The redacted report has opinions about that."
            ],
            deepNight: [
                "It's {time}. Reading classified files in the dark. Your career in a sentence.",
                "{time}. The black bars are invisible at this hour. Everything reads true.",
                "At {time} the redactions blur. Almost readable. Almost. That's how they get you.",
                "{time}. Even the classified files sleep. You don't. The report respects that."
            ],
            lowMorale: [
                "Morale: [REDACTED]. The report knows. It just can't say.",
                "You're struggling. The classified file has a section on struggling. It's blacked out. Of course.",
                "Low spirits and a redacted report. You're not building a case. You're collecting dead ends.",
                "The file sees you. Through the black bars. It's not indifferent. It's classified."
            ],
            themes: {
                addiction: [
                    "Substance use noted in the redacted section. By 'noted' the report means 'anticipated.'",
                    "The bottle and the black bar have the same job. Making things disappear."
                ],
                truth: [
                    "The truth was here. Before the black marker. Before clearance levels. Before you.",
                    "Someone redacted the truth and filed it under 'national security.' The report snorts."
                ],
                memory: [
                    "The report remembers what was under the black bars. It can't tell you. Policy.",
                    "Memory is just unredacted experience. The report has both. You get neither."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty envelope. Like the evidence locker. Like promises from downtown.",
        "Nothing inside. The case file isn't surprised.",
        "Blank. Like the witness statement. Like the alibi. Like everything in this town.",
        "No fortune. The good ones were seized as evidence.",
        "Empty. Filed correctly for once.",
        "The envelope had something. Someone got to it first. Check the shredder.",
        "Nothing. That's not nothing — that's a cover-up shaped like nothing.",
        "Blank paper. At least it's honest. More than this department can say."
    ]
};
