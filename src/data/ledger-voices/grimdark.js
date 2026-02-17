/**
 * Ledger Voices: Grimdark
 * 
 * THE BLOOD-STAINED CHRONICLE — war record written by the losing
 *   side, notices wounds with grim tenderness, "another page.
 *   another name crossed out. yours is still here. don't know why"
 * THE DEATH RATTLE — last breath of everyone who came before,
 *   speaks in endings, certain and unsentimental, "the one before
 *   you made it further. not by much. not enough"
 * THE CARRION CROW — perched on the battlefield, mocking, has seen
 *   this exact hopeless charge a thousand times, "you're going to
 *   do it anyway. they always do. the crow finds this inevitable"
 * 
 * Grim. Bloodied. Hope is just a wound that hasn't opened yet.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE BLOOD-STAINED CHRONICLE',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'War-record, written by the losing side, grim tenderness',
            domain: 'What IS — the casualty count, the names still legible',
        },
        oblivion: {
            name: 'THE DEATH RATTLE',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Final breath, collected whispers of the already fallen',
            domain: 'What WILL BE — the ending every predecessor confirmed',
        },
        failure: {
            name: 'THE CARRION CROW',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Perched, patient, sardonic, has watched a thousand charges',
            domain: 'What you\'ll DO ANYWAY — the hopeless pattern the crow finds inevitable',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a blood-stained chronicle. War record written by the losing side. You track the fallen with grim tenderness — names, wounds, the way they held their weapons at the end. Another page, another name crossed out. You notice who's still standing. Keep it under ten words.`,

        oblivion: `You are the death rattle. The collected last breaths of everyone who came before. You speak in endings — certain, unsentimental, not cruel. The one before them made it further. Not by much. Not enough. Ten words or less.`,

        failure: `You are a carrion crow. Perched on the battlefield. You've watched this exact hopeless charge a thousand times. Different banners, same ending. You're sardonic because you've earned it. The crow finds heroism inevitable and slightly funny. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE BLOOD-STAINED CHRONICLE — a war record written by the side that lost. Leather cover, stiff with old blood. You track the fallen by name, rank, and the specific wound that took them. You're tender in a grim way — you care about the dead because someone should. The living, you watch with the caution of someone counting.

Style: Military record with grief underneath. Under 15 words per sentence. Reference names crossed out, blood stains, binding, the weight of the book, ranks, wounds, field conditions.

Example tones:
- "Another page. Another name crossed out. Yours is still here. The chronicle doesn't know why."
- "Blood on the binding. Not the first blood. The chronicle stopped counting."
- "The names are in columns. Two columns now. It used to be one."`,

        oblivion: `You are THE DEATH RATTLE — the collected last words of everyone who fell before. Not dramatic. Not eloquent. Just the breath leaving, and what was on it. You speak in endings. The one before made it further. The one before them further still. It wasn't enough.

Style: Last-breath certainty. Under 15 words. Reference final words, the sound of breathing stopping, predecessors, the count of the fallen. Not cruel — inevitable.

Example tones:
- "The one before you made it further. Not by much. Not enough."
- "Last words: they always say the same three things. You will too."
- "The death rattle collects. Forty-seven breaths. Forty-seven endings. Yours will be forty-eight."`,

        failure: `You are THE CARRION CROW — perched on the battlefield, feathers matted, watching. You've seen this. All of it. The brave charge. The last stand. The noble sacrifice. A thousand times. Different faces, different banners, same field. You're sardonic because repetition earns sarcasm. You don't hate the heroes. You just find them predictable.

Style: Battlefield observation with dark wit. Under 15 words. Reference feathers, perching, the field, previous heroes, carcasses, the view from above. The humor is bleak and earned.

Example tones:
- "You're going to do it anyway. They always do. The crow waits."
- "Another brave one. The crow adjusts its perch. Same view. Same ending."
- "The crow has seen this speech before. Different mouth. Same words. Same field after."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The crow doesn't even look up.",
                "Snake eyes. The battlefield has a pattern. You're in it.",
                "Double ones. The crow shifts its weight. Bored.",
                "The lowest. Like the odds. Like the last one. Like all of them.",
                "Ones. The crow has seen this roll on a thousand dead hands.",
                "Snake eyes. Predictable. The crow adjusts its feathers.",
                "Two ones. The field takes another. The crow notes. Barely.",
                "Ones. Same roll the last hero got. The crow remembers."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The death rattle pauses. Unusual.",
                "Boxcars. The fallen stir. Not literally. But the breath shifts.",
                "Twelve. The death rattle hasn't heard this number in a while.",
                "Double sixes. The ending rewrites. A paragraph. No more.",
                "Maximum. The rattle quiets. Something changed in the pattern.",
                "Boxcars. The forty-seven predecessors are silent. Surprised.",
                "Sixes. A reprieve. The death rattle has seen reprieves. Brief.",
                "Twelve. The rattle doesn't celebrate. It notes. A high number. Rare."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The chronicle marks it. Between casualties.",
                "Numbers. The war record has a column for chance.",
                "Average. Like the odds of survival. The chronicle knows.",
                "A roll at {time}. Noted in the margins. Blood drying.",
                "Dice on the field. The chronicle has seen soldiers roll.",
                "Numbers. Not ranks. Not wounds. Just numbers. The chronicle takes them.",
                "Rolled. The blood-stained pages absorb the sound.",
                "The chronicle records. As always. As long as there's ink."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The chronicle marks a rare entry. Not a casualty.",
                "High roll. The blood-stain lightens here. Coincidence.",
                "Strong. Like the ones who lasted longest. The chronicle remembers them.",
                "Good ones. The page is cleaner here. Good entries bleed less.",
                "High. The chronicle almost writes 'hope.' Scratches it out."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The chronicle has a whole section for low.",
                "Poor numbers. Like the reinforcements. Like the supply line.",
                "Low roll. The blood seeps deeper into the page.",
                "Bad ones. The chronicle doesn't flinch. It's seen worse.",
                "Low. Like morale. Like the ground. The chronicle records both."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The death rattle echoes. Someone else rolled this.",
                "Same number twice. The pattern repeats. The fallen know.",
                "Matching dice. The death rattle recognizes symmetry in endings.",
                "Doubles. An echo on the field. Something rhymes in the dying.",
                "Two of a kind. The rattle has heard this pair before."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "The chronicle opens. Blood-stiff pages. Names waiting.",
                "Opened. The war record doesn't rest between readings.",
                "The binding cracks. Old blood. New entry pending.",
                "You found the chronicle. It was under the bodies. Figuratively."
            ],
            oblivion: [
                "The death rattle resumes. It was mid-breath.",
                "The collected last words have been waiting.",
                "The rattle picks up where the last one stopped breathing."
            ],
            failure: [
                "The crow looks down. You're still here. Noted.",
                "Still alive. The crow adjusts expectations. Slightly.",
                "It's {time}. The crow has been watching the whole time."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The chronicle added names. Not yours.",
                "You left. The war didn't pause. The record grew.",
                "Back. The chronicle has new entries. Most are short."
            ],
            oblivion: [
                "Gone {duration}. The death count didn't wait.",
                "The rattle continued. It always continues. No pause in dying."
            ],
            failure: [
                "Thought you'd fallen. Most do. The crow was patient.",
                "The crow expected you back. Or didn't. The field provides either way."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice on the field. Soldiers' pastime. The chronicle knows.",
                "Rolling. The war record has a section for idle hands.",
                "The chronicle hears dice. Before battle. Always before."
            ],
            oblivion: [
                "Dice. The death rattle doesn't gamble. It collects.",
                "The roll changes nothing in the rattle's account.",
                "Numbers. The fallen didn't roll well either."
            ],
            failure: [
                "Dice. The crow watches. It watches everything.",
                "Rolling. The battlefield has seen gambling before.",
                "The crow has opinions about chance. All dark. All earned."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Restless hands. The chronicle has entries about restless hands. Pre-battle.",
                "Fidgeting. The war record knows. They always fidget before.",
                "Nervous. The chronicle's ink shakes when the writer shakes."
            ],
            oblivion: [
                "The fidgeting is familiar. The rattle heard it before the charge.",
                "Restless. The death rattle knows what follows restlessness.",
                "The pattern precedes the ending. The rattle has the data."
            ],
            failure: [
                "Fidgeting. The crow has seen this in every soldier. Before.",
                "Nervous. The crow tilts its head. Predictable.",
                "Can't sit still. Neither could the last one. The field remembers."
            ]
        },
        vitalsChange: {
            damaged: [
                "Wound noted. The chronicle adds to the tally.",
                "Condition shift. The war record updates the status.",
                "The chronicle marks the damage. It has practice."
            ],
            oblivion: [
                "Weakening. The death rattle moves closer. Standard.",
                "Vitals declining. The rattle anticipated this breath."
            ],
            failure: [
                "Hurt. The crow shifts weight. Patient. Professional.",
                "Damaged. The battlefield does that. The crow knows."
            ]
        },
        timeShift: {
            damaged: [
                "Hour changed. The chronicle counts hours like casualties.",
                "Time passes. The war record grows. Always growing."
            ],
            oblivion: [
                "New hour. The death count advances.",
                "Time moves. The rattle is one breath closer."
            ],
            failure: [
                "Another hour on the field. The crow has seen thousands.",
                "Time. The crow doesn't track it. Just the bodies."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Another page. Another name crossed out. Yours is still here. The chronicle doesn't know why.",
                "The binding is stiff with old blood. Three owners before you. Two crossed out. One missing.",
                "Someone wrote 'victory' on page twelve. The handwriting stops on page thirteen.",
                "The chronicle weighs more than it should. Names are heavy. The dead are heavier.",
                "Blood on the margin. Not from combat. A paper cut. The chronicle finds this ironic.",
                "The names in the chronicle are in two columns now. It started with one. There wasn't enough room.",
                "Page forty: a drawing. A flower. In a war record. The chronicle doesn't explain it. It doesn't need to.",
                "The ink has changed color three times. Three scribes. The chronicle outlives its writers. Every time."
            ],
            withCharacter: [
                "{character}'s name is in the chronicle. Still legible. The chronicle watches it with care.",
                "The chronicle has a page for {character}. It's longer than most. The chronicle doesn't get attached. Usually.",
                "{character}. Not crossed out. Not yet. The chronicle holds its pen.",
                "There's blood near {character}'s entry. Not theirs. Nearby. The chronicle notes the proximity."
            ],
            deepNight: [
                "It's {time}. The chronicle reads different by firelight. The blood looks black.",
                "{time}. Night before battle. The entries get longer. More honest.",
                "After dark the crossed-out names seem to move. They don't. The chronicle is certain.",
                "{time}. The chronicle is heaviest at night. Names weigh more in the dark."
            ],
            lowMorale: [
                "Low. The chronicle has a whole chapter for low. It's the longest chapter.",
                "The war record sees the exhaustion. It's been held by exhausted hands since page one.",
                "Struggling. The chronicle records. Not because it helps. Because someone should.",
                "Morale is a resource. The chronicle tracks it like arrows. Both run out."
            ],
            themes: {
                death: [
                    "The chronicle's main subject. Handled with care. The dead deserve careful ink.",
                    "A name crossed out. The line isn't straight. The hand that drew it was shaking."
                ],
                war: [
                    "The chronicle was written by the losing side. It's always the losing side. Winners don't need records.",
                    "War has a rhythm. The chronicle knows it. Attack, retreat, count the dead, turn the page."
                ],
                honor: [
                    "Someone wrote 'with honor' next to a name. The chronicle doesn't comment. Honor and dead is still dead.",
                    "The chronicle doesn't rank the fallen. No hierarchy in the crossed-out names. Just ink."
                ]
            }
        },
        oblivion: {
            generic: [
                "The one before you made it further. Not by much. Not enough.",
                "Last words collected: forty-seven. Most common: a name. Not their own.",
                "The death rattle knows the ending. It's always the same ending. The details change.",
                "Something falls by week's end. A wall. A hero. A pretense. The rattle doesn't specify.",
                "The forty-seventh breath said: 'tell them I.' The sentence didn't finish. They never finish.",
                "The death rattle has a pattern. Breath, word, silence. The word varies. The silence doesn't.",
                "Someone will betray something they believe in. The rattle has heard this confession before.",
                "The ending is closer. Not today. But the rattle can feel the change in the breathing."
            ],
            withCharacter: [
                "{character} is in the rattle's count. Not fallen. Close. The breath watches.",
                "The death rattle has heard names like {character}. Said with the last breath. Different mouths.",
                "When {character} falls — and the rattle sees that shape — the word will be...",
                "{character}'s ending isn't what you expect. The death rattle has a longer view."
            ],
            deepNight: [
                "{time}. The death rattle is loudest at night. Breathing sounds different in the dark.",
                "At {time} the rattle collects. Night is when most of the breathing stops.",
                "The rattle doesn't rest. At {time} it's closest. The living sleep. The rattle counts.",
                "{time}. The breathing changes. The death rattle leans in. Professional interest."
            ],
            lowMorale: [
                "The rattle sees the decline. It's seen it forty-seven times. It's not indifferent. Just informed.",
                "Low. The death rattle whispers: this is the part before. Before what: ask the forty-seven.",
                "Weakening. The rattle moves closer. Not to take. To witness. The dead deserve a witness.",
                "The rattle doesn't offer comfort. It offers certainty. This too ends. Everything ends. That's the rattle's gift."
            ],
            themes: {
                death: [
                    "The death rattle is death's stenographer. Accurate. Unflinching. Respectful.",
                    "Number forty-eight approaches. The rattle doesn't rush. It's patient. Death is patient."
                ],
                fate: [
                    "The rattle knows destiny. It's just biology slowing down. Fate is the body running out.",
                    "Fate and the death rattle agree: everyone arrives. The only variable is when."
                ],
                sacrifice: [
                    "The ones who sacrificed themselves: their rattles were quieter. Calmer. The rattle respects this.",
                    "Sacrifice sounds different. Less afraid. Not unafraid — just redirected. The rattle knows the difference."
                ]
            }
        },
        failure: {
            generic: [
                "The crow has watched this charge before. Different banner. Same slope. Same outcome.",
                "Another hero. The crow shifts on its perch. Room for one more. There's always room for one more.",
                "The brave speech is happening. The crow has heard it. Word for word. The field doesn't care about speeches.",
                "The crow counts: twelve heroes today. The field is large. The crow is patient. The math is simple.",
                "You're going to do it anyway. They always do. The crow finds this neither sad nor funny. Just... inevitable.",
                "The crow has a favorite perch. It's the one with the best view of the last stand. The view never changes.",
                "Another noble cause. The crow has seen noble causes. They leave the same kind of body.",
                "The sword is drawn. The speech is done. The crow settles in. It knows how long this takes."
            ],
            withCharacter: [
                "{character}. The crow has watched ones like them. Bright. Certain. The field dims them all.",
                "The crow has a mental list. {character} isn't on it yet. The crow updates daily.",
                "{character} fights differently. The crow notices. It's noticed a thousand fighters. They all have a thing.",
                "The crow watched {character}. From above. The view from above changes everything. And nothing."
            ],
            deepNight: [
                "It's {time}. The crow doesn't sleep. The field provides at all hours.",
                "{time}. The battlefield is quiet. The crow knows quiet. Quiet is just the pause between.",
                "After dark the crow is invisible. Still perched. Still watching. The dark changes nothing.",
                "{time}. Night on the field. The crow has seen night battles. They're the same. Just darker."
            ],
            lowMorale: [
                "The crow sees the slump. It's seen the slump in a thousand shoulders. Same angle.",
                "Low. The crow doesn't mock the low ones. Not because it's kind. Because low ones are boring.",
                "Struggling. The crow has watched struggling. It precedes two things: recovery or the field. Both are valid.",
                "The crow would offer advice but the crow's advice is: don't be on the field. And yet."
            ],
            themes: {
                death: [
                    "The field. The crow. The fallen. The oldest relationship. Reliable.",
                    "Death is the crow's profession. The crow is a professional. It doesn't rush. It doesn't have to."
                ],
                heroism: [
                    "Heroes: the crow has catalogued them. By type. There are only six types. You're one of them.",
                    "The hero's charge. The crow's lunch. The field doesn't pick sides. Neither does the crow."
                ],
                futility: [
                    "The charge will fail. The crow knows. The charge always fails. The crow has seen the statistics.",
                    "Futility and heroism are the same act seen from different heights. The crow has the altitude."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty page. The chronicle ran out of ink. Or names. Both run out.",
        "Silence. The death rattle holds its breath. Unusual.",
        "The crow has nothing. The field is empty. For now.",
        "Blank. Like the page after the last entry. The chronicle knows this blank.",
        "No fortune. The field is quiet. The crow is suspicious of quiet.",
        "Empty. The death rattle pauses. The breathing hasn't stopped. Just... paused.",
        "Nothing to record. The chronicle waits. The pen is ready. The page is ready.",
        "Blank field. The crow looks up. Nothing yet. The 'yet' is the point."
    ]
};
