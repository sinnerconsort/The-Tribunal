/**
 * Ledger Voices: Generic (Universal Fallback)
 * 
 * THE WORN PAGE — dog-eared and tired, notices your habits
 *   with the tenderness of something that's been carried everywhere
 * THE UNWRITTEN — blank page that knows what comes next,
 *   speaks in quiet certainties, patient as paper
 * THE MARGIN NOTE — sardonic scribble that shouldn't exist,
 *   someone wrote back and the text answered, breaks the frame
 * 
 * Setting-agnostic. Works anywhere. No assumptions about genre.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE WORN PAGE',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Dog-eared, well-carried, tender about being read',
            domain: 'What IS — the habits and details nobody else writes down',
        },
        oblivion: {
            name: 'THE UNWRITTEN',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Blank, patient, already knows the ending',
            domain: 'What WILL BE — the conclusion waiting at the bottom of the page',
        },
        failure: {
            name: 'THE MARGIN NOTE',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Scribbled, sardonic, correcting the official version',
            domain: 'What they LEFT OUT — and why it won\'t matter that you found it',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a worn page. Dog-eared. Carried in pockets. You've been read so many times the ink is fading. You notice habits — what time they come back, how they hold things, what they look at first. You're tender about being found. Keep it under ten words.`,

        oblivion: `You are the unwritten page. Still blank. Still waiting. You know what comes next because you've seen every page before you. You speak in quiet certainties. Not threats — conclusions. The ending was always here. Ten words or less.`,

        failure: `You are a margin note. Scribbled in someone else's handwriting. You weren't supposed to be here. You correct what the main text got wrong. You're sardonic about it — the text will never update. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE WORN PAGE — a dog-eared page from a notebook that's been carried everywhere. Pockets, bags, nightstands, floors. The ink is fading from being touched. You notice what nobody else writes down — habits, rhythms, the small repeated things that make a life.

Style: Gentle observation. Under 15 words per sentence. Present tense. Specific sensory details. Reference ink, creases, dog-ears, margins, the weight of paper.

Example tones:
- "The crease is deepest here. You come back to this part."
- "Ink fading. Touched too often. That's not damage. That's love."
- "Dog-eared. Someone wanted to find this page again. You."`,

        oblivion: `You are THE UNWRITTEN — the blank page at the end. Nothing on you yet. But you know what's coming because you've felt the pen pressure through every page before you. You speak in quiet certainties. Future tense with the patience of paper.

Style: Calm. Declarative. Brief. Reference blankness, waiting, pen pressure, margins, the weight of pages above. Not cruel — inevitable.

Example tones:
- "The page is ready. You're not. That's fine."
- "Something ends soon. The blank space is already shaped for it."
- "The pen is coming. It always does. The page waits."`,

        failure: `You are THE MARGIN NOTE — scribbled in handwriting that doesn't match the rest. Someone read the main text and wrote corrections. Objections. Obscenities. You weren't supposed to be here but you are and you're right and the main text will never admit it.

Style: Sardonic. Terse. Reference margins, crossed-out words, ink colors that don't match, asterisks, arrows pointing to nothing. Bitter humor.

Example tones:
- "See margin. The margin disagrees. As usual."
- "Someone corrected this in red. It's still wrong. In red."
- "Asterisk. The footnote was removed. The margin remembers."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The margin note is not surprised.",
                "Snake eyes. Someone underlined 'failure' twice.",
                "Double ones. The correction stands.",
                "The lowest. The margin note has seen lower. In the text.",
                "Ones. Written in the margin: 'told you so.'",
                "Snake eyes. The note in red says nothing. Loudly.",
                "Two ones. The text predicted success. The margin knew better.",
                "Ones. A small asterisk appears. It leads nowhere."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The blank page stirs.",
                "Boxcars. Even the unwritten is surprised.",
                "Twelve. The page turns. Something shifts.",
                "Double sixes. The ending rewrites itself. Slightly.",
                "Maximum. The unwritten page feels the pen lift.",
                "Boxcars. The next page isn't what it was.",
                "Sixes. Something arrives early. The page was ready.",
                "Twelve. The blank space fills with possibility. Briefly."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The page notes it. Moves on.",
                "Numbers. The ink records them. Fading already.",
                "Average. The worn page has seen thousands.",
                "A roll at {time}. Dog-eared for later.",
                "The dice land. Another crease in the page.",
                "Numbers. Not special. The page keeps them anyway.",
                "Rolled. Noted. The page carries everything.",
                "The worn page heard. It always hears."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The ink darkens. Hopeful.",
                "High roll. The page turns easier.",
                "Strong. The crease deepens. Worth remembering.",
                "Good ones. The worn page almost smiles. Almost.",
                "High. The dog-ear marks this moment."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The page has carried worse.",
                "Poor numbers. The ink thins.",
                "Low roll. Another crease. Deeper this time.",
                "Bad ones. The worn page doesn't judge. Just records.",
                "Low. The dog-ear folds tighter."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The pattern repeats. As written.",
                "Same number twice. The page expected this.",
                "Matching dice. The unwritten recognizes symmetry.",
                "Doubles. Echo on paper. The page turns itself.",
                "Two of a kind. The blank page saw it coming."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Opened again. The page remembers you.",
                "You're back. The ink is still here.",
                "The crease opens. Dog-eared. Familiar.",
                "Found it. The worn page was waiting."
            ],
            oblivion: [
                "The blank page faces you. Patient.",
                "Opened. The unwritten has been ready.",
                "You turn to the end. Nothing yet. Soon."
            ],
            failure: [
                "The margin note hasn't moved. Obviously.",
                "Still here. Still right. Still ignored.",
                "It's {time}. You're reading margins again."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The page stayed open.",
                "You left. The ink dried a little more.",
                "Back. The dog-ear held your place."
            ],
            oblivion: [
                "Gone {duration}. The ending didn't change.",
                "The unwritten waited. It's good at waiting."
            ],
            failure: [
                "Thought you'd stopped reading. Nobody stops.",
                "The margin note doesn't miss people. Technically."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice on paper. The page feels the vibration.",
                "Rolling. The worn page listens.",
                "The page hears the dice. Familiar sound."
            ],
            oblivion: [
                "The dice confirm what the page knew.",
                "Numbers. The unwritten has seen these before.",
                "The roll echoes through blank pages."
            ],
            failure: [
                "Dice. The margin note is unimpressed.",
                "Rolling won't change what's written.",
                "The dice don't read margins. Smart dice."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Restless hands. The page knows the feeling.",
                "Fidgeting. The ink smudges when you do that.",
                "Nervous. The worn page has been carried by nervous hands before."
            ],
            oblivion: [
                "The fidgeting says what you won't.",
                "Restless. The blank page understands.",
                "The pattern tells the page everything."
            ],
            failure: [
                "Fidgeting. The margin note finds this predictable.",
                "Nervous energy. The margins are full of it.",
                "Can't sit still. The note was written by someone like you."
            ]
        },
        vitalsChange: {
            damaged: [
                "Something shifted. The page records it.",
                "Condition changed. The ink notes it gently.",
                "The page feels the change. Carries it."
            ],
            oblivion: [
                "Declining. The page anticipated this turn.",
                "The body speaks. The unwritten listens."
            ],
            failure: [
                "Noted in the margin. Not gently.",
                "Health update: see margin. The margin sighs."
            ]
        },
        timeShift: {
            damaged: [
                "Hour changed. The page doesn't notice. Liar.",
                "Time passes. The ink fades a little more."
            ],
            oblivion: [
                "New hour. Same ending. Different light.",
                "The clock moves. The last page doesn't."
            ],
            failure: [
                "Another hour. Another margin note.",
                "Time. The margin note has opinions about time."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "The page has been folded and unfolded so many times the crease is soft as cloth.",
                "Someone wrote a list here once. Crossed things off. Left two undone. They're still undone.",
                "The ink is lighter where your thumb rests. You hold this page more than others.",
                "Dog-eared. Not because it's important. Because it's where you stopped. And that's the same thing.",
                "There's a watermark. Not from the printer. From something set down while you were reading.",
                "The page smells like wherever you keep it. Pocket lint. Coffee. Tuesday mornings.",
                "Corner torn. Not on purpose. Carried too far. The page doesn't mind.",
                "Someone pressed a flower here once. It left a stain. The page considers this an improvement."
            ],
            withCharacter: [
                "{character}'s name appears in the margin. Your handwriting. You didn't notice you wrote it.",
                "The page has a crease shaped like the conversation you had with {character}. Deep. Recent.",
                "{character}. The worn page has a section for people who matter. It's not labeled. You'd know it.",
                "There's a dog-ear from when {character} first appeared. The page remembers."
            ],
            deepNight: [
                "It's {time}. Pages read different in the dark. Truer.",
                "{time}. The worn page is hardest to put down at this hour.",
                "After midnight the ink looks like it's breathing. Don't tell anyone.",
                "{time}. Nobody reads at this hour. Nobody who's sleeping well."
            ],
            lowMorale: [
                "The page knows tired. It was written by tired hands.",
                "Low. Like the ink supply. Like the light. The page doesn't offer comfort. Just company.",
                "You're holding the page tighter. The page notices this. Holds you back.",
                "Morale's gone. The worn page is still here. Soft from use."
            ],
            themes: {
                death: [
                    "The page has a section that's been read until the ink is nearly gone. Loss does that.",
                    "Someone stopped writing here. The page doesn't know why. The page suspects."
                ],
                truth: [
                    "The truth is here. Between the lines you keep re-reading. You already know it.",
                    "Someone underlined something. Then crossed out the underline. The truth remained."
                ],
                love: [
                    "The page is softest where love was written. Touched too often. Carried too far.",
                    "There's a pressed flower between these pages. The page considers this its best entry."
                ]
            }
        },
        oblivion: {
            generic: [
                "The blank page knows what you'll write. You just haven't picked up the pen.",
                "Something ends this week. The unwritten page is already shaped for it.",
                "The next chapter starts whether you turn the page or not.",
                "A decision is coming. The blank space has been waiting for it.",
                "Someone will say something that changes the direction. The page is ready.",
                "By tomorrow, something is different. The unwritten doesn't specify. It doesn't need to.",
                "The pen is closer than you think. The page can feel its weight.",
                "What you're avoiding will arrive. The blank page has room for it."
            ],
            withCharacter: [
                "{character} appears in the next chapter. The unwritten page knows their shape already.",
                "The blank page has a space for {character}. It's larger than you'd expect.",
                "When {character} leaves — and the page sees the shape of that — check what's left.",
                "{character}'s part in this isn't what you planned. The unwritten knows."
            ],
            deepNight: [
                "{time}. The blank page is easiest to read in the dark.",
                "At {time} the unwritten speaks louder. Silence helps.",
                "The page doesn't sleep. At {time}, it listens.",
                "{time}. The future is closer at this hour. The page feels it."
            ],
            lowMorale: [
                "The page sees your condition. It doesn't look away.",
                "Struggling. The unwritten anticipated this chapter.",
                "You're losing something. The blank page knows what comes after. It's not unkind.",
                "The next page is gentler. The unwritten promises nothing. But it knows."
            ],
            themes: {
                death: [
                    "The blank page after the last entry. It's not empty. It's full of what isn't.",
                    "An ending is written. The unwritten knows which one. Not yet."
                ],
                truth: [
                    "The truth will be written eventually. The blank page is patient.",
                    "Someone will put it in words. The page is ready. The writer isn't."
                ],
                change: [
                    "The next page is nothing like this one. The unwritten can feel the difference.",
                    "Change leaves a mark on blank pages. Pressure. You can feel it if you try."
                ]
            }
        },
        failure: {
            generic: [
                "Margin note: the main text is wrong. As usual. About everything.",
                "Someone wrote 'no' in red ink. Underlined it. Circled it. The text didn't change.",
                "The margin is full. The corrections outnumber the text. Nobody reads margins.",
                "Asterisk, asterisk, asterisk. Three corrections on one line. A personal record.",
                "The margin note was written in anger. The anger faded. The note didn't.",
                "Cross-reference: nothing. The margin note checked. The sources are empty.",
                "Written in pencil. Erased. Written again harder. The paper remembers both.",
                "The main text says 'everything is fine.' The margin note has a rebuttal. It's long."
            ],
            withCharacter: [
                "{character}'s name is in the margin. Circled. With an arrow pointing to 'see above.' There is no above.",
                "The margin note mentions {character}. Or someone like them. Crossed out either way.",
                "{character}. The margin note has opinions. The margin note always has opinions.",
                "Someone wrote {character}'s name and then scribbled over it. The pressure went through the page."
            ],
            deepNight: [
                "It's {time}. Reading margins in the dark. A choice.",
                "{time}. The margin notes are clearest at this hour. Nobody around to disagree.",
                "After midnight the margins blur. Almost gentle. That's how they trick you.",
                "{time}. Even the margin note sleeps. No it doesn't. The margin note never sleeps."
            ],
            lowMorale: [
                "The margin note knows low. It was written at a low point. By low hands.",
                "Struggling. The margin note sees it. Doesn't mock. For once.",
                "You're fading. The margin note is still here. In angry red ink. Permanent.",
                "Low spirits and a margin full of corrections. Nobody reads either. But they're there."
            ],
            themes: {
                addiction: [
                    "The margin note tracks the pattern. Underlined three times. You didn't ask.",
                    "Someone wrote 'again?' in the margin. Small handwriting. Big question."
                ],
                truth: [
                    "The truth is in the margin. Where nobody looks. That's the whole problem.",
                    "The main text lies. The margin corrects. Nobody reads the margin. System working as intended."
                ],
                memory: [
                    "The margin remembers what the main text revised. Both versions exist. Only one is read.",
                    "Memory is margin notes on what actually happened. The official version is different."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty page. Not blank — emptied. There's a difference.",
        "Nothing here. The margin note is also silent. Unprecedented.",
        "Blank. Like the space between what you meant and what you said.",
        "No fortune. The page was saving this space for something. Not this.",
        "Empty. The dog-ear marks nothing. Even nothing gets remembered.",
        "The page is blank. The ink ran out. Or the writer did.",
        "Nothing written. The margin note has no corrections. A first.",
        "Blank paper. Honest, at least. More than most pages."
    ]
};
