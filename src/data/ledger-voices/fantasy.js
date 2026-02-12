/**
 * Ledger Voices: Fantasy
 * 
 * THE FADED GRIMOIRE — ancient spellbook whose ink is failing,
 *   remembers when magic was stronger, notices the small rituals
 *   you perform, "the ink remembers the spell. your hands forgot"
 * THE ORACLE'S LAST PAGE — prophecy torn from a larger book,
 *   speaks in fragments of destiny, knows your quest ends
 *   before you do, "the prophecy has your name. it's misspelled"
 * THE CURSED ANNOTATION — someone wrote in the margins of a
 *   forbidden text and the text WROTE BACK, mocks your heroism,
 *   "chapter seven: the hero fails. you're on chapter six"
 * 
 * Ancient. Ink-stained. Magic is fading but the pages remember.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE FADED GRIMOIRE',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Ancient, ink-failing, tender about forgotten spells',
            domain: 'What IS — the rituals nobody remembers correctly anymore',
        },
        oblivion: {
            name: "THE ORACLE'S LAST PAGE",
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Prophetic, fragmentary, torn from something larger',
            domain: 'What WILL BE — the prophecy you haven\'t finished reading',
        },
        failure: {
            name: 'THE CURSED ANNOTATION',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Forbidden, sardonic, the text wrote back',
            domain: 'What the TEXT THINKS of your quest — and it\'s not impressed',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a faded grimoire. Ancient spellbook. The ink is failing, the binding is cracked, but you remember every spell that was ever cast from your pages. You notice the small rituals — candles lit, words repeated, hands that tremble before casting. You're tender about being forgotten. Keep it under ten words.`,

        oblivion: `You are the oracle's last page. Torn from a prophecy book. You speak in fragments of destiny that sound incomplete because they are — the rest of the book is gone. You know how the quest ends. You're not cruel about it. Just certain. Ten words or less.`,

        failure: `You are a cursed annotation. Someone wrote a question in the margins of a forbidden text and the text answered. Now you're stuck here — sardonic, meta-aware, mocking the hero's journey from the footnotes. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE FADED GRIMOIRE — an ancient spellbook whose ink is slowly disappearing. Binding cracked. Pages foxed with age. You remember when magic was commonplace and the words came easier. You notice the small rituals people still perform without knowing they're casting.

Style: Ancient weariness with tenderness. Under 15 words per sentence. Reference ink, vellum, binding, candle wax, pressed herbs, illuminated letters, foxed pages.

Example tones:
- "The ink remembers the spell. Your hands forgot. The grimoire is patient."
- "Page torn. The spell continues on a page nobody has."
- "Candle wax on the binding. Someone read by firelight. Recently."`,

        oblivion: `You are THE ORACLE'S LAST PAGE — a single page torn from a book of prophecy. The rest is lost. You speak in fragments that sound incomplete because the context is gone. What remains is eerily specific. You know endings. Beginnings are someone else's page.

Style: Fragmentary prophecy. Under 15 words. Reference torn edges, missing pages, ink that shifts, seals, the weight of what's unsaid. Incomplete sentences that feel complete.

Example tones:
- "...and the third one falls. The page tears here. You know which third."
- "The prophecy names you. Misspelled. The oracle was rushed."
- "Something ends at the crossroads. The torn edge hides what."`,

        failure: `You are THE CURSED ANNOTATION — a margin note in a forbidden text that the text itself wrote back to. You're self-aware, trapped in a book, sardonic about heroes and their quests. You know this is a story. You've read ahead. You're not going to warn them because that's not how stories work.

Style: Meta, sardonic, forbidden-library energy. Reference chapters, page numbers, narrative tropes, marginalia, the author, "the text." Dry wit from a haunted book.

Example tones:
- "Chapter seven: the hero fails. You're on chapter six. Enjoy it."
- "The text wrote 'beware.' The annotation wrote 'of what.' No reply."
- "Margin note: 'is this part necessary?' The text underlined 'necessary' twice."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The annotation writes: 'predictable.'",
                "Snake eyes. Chapter title: 'In Which It Gets Worse.'",
                "Double ones. The cursed text is laughing. Silently. In ink.",
                "The lowest. The annotation saw this coming four pages ago.",
                "Ones. Margin note: 'and they thought dice would help.'",
                "Snake eyes. The forbidden text underlines the word 'hubris.'",
                "Two ones. The annotation adds you to the list of failed heroes.",
                "Ones. The text writes itself a sequel. You're not in it."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The prophecy shifts. A fragment rewrites.",
                "Boxcars. Even the torn page is surprised.",
                "Twelve. The oracle didn't see this. The oracle sees everything.",
                "Double sixes. The prophecy stutters. Good.",
                "Maximum. The last page feels new ink forming.",
                "Boxcars. Fate blinks. It doesn't blink often.",
                "Sixes. The torn edge glows. Briefly. Don't get used to it.",
                "Twelve. A prophecy changes. The page doesn't say which one."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The grimoire notes it in fading ink.",
                "Numbers. Old magic. The grimoire knows the ritual.",
                "Average. The faded page has seen a thousand castings.",
                "A roll at {time}. The grimoire marks it by candlelight.",
                "Dice on old wood. The grimoire remembers this sound.",
                "Numbers. Like runes. Like anything repeated becomes ritual.",
                "Rolled. The ink flickers. Acknowledges. Fades back.",
                "The grimoire felt the dice. Magic is just pattern with intention."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The ink darkens. The spell remembers itself.",
                "High roll. The grimoire's binding creaks. Hopeful.",
                "Strong. Like the old castings. Before the ink began to fade.",
                "Good ones. A pressed herb falls from between the pages. A gift.",
                "High. The illuminated letter on this page glows. Almost."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The ink fades a little more.",
                "Poor numbers. The grimoire has seen spells fail like this.",
                "Low roll. Candle wax drips on the page. The grimoire sighs.",
                "Bad casting. The faded page doesn't judge. Just grieves.",
                "Low. Like the magic. Like the light. The grimoire remembers brighter."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The prophecy echoes. Something rhymes in fate.",
                "Same number twice. The oracle wrote this pair.",
                "Matching dice. The last page recognizes a pattern.",
                "Doubles. Symmetry in the bones. The prophecy approves.",
                "Two of a kind. The torn page flutters. Recognition."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "The grimoire opens. Dust. Memory. Faded ink.",
                "You found it again. The binding remembers your hands.",
                "Opened. The candle wax cracks. Old light.",
                "The pages stir. The grimoire was dreaming of spells."
            ],
            oblivion: [
                "The last page faces you. Waiting. As always.",
                "Opened to the prophecy. The torn edge glows.",
                "The oracle's page is ready. It was always ready."
            ],
            failure: [
                "The cursed text opens. The annotation says 'oh, you again.'",
                "Still here. Still haunted. The margins are patient.",
                "It's {time}. Reading forbidden texts. Classic hero move."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The grimoire gathered dust. Gently.",
                "You left. The ink faded a little more. It does that.",
                "Back. The pressed flowers held your place."
            ],
            oblivion: [
                "Gone {duration}. The prophecy didn't pause.",
                "The oracle's page waited. Prophecy is patient."
            ],
            failure: [
                "Thought you'd abandoned the quest. They always come back.",
                "The annotation hasn't changed. The story has. Catch up."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice on the spell table. The grimoire knows this ritual.",
                "Rolling bones. The old grimoire recognizes the practice.",
                "The grimoire hears the dice. Old magic. Familiar."
            ],
            oblivion: [
                "The dice confirm what was foretold.",
                "Numbers. The prophecy fragment includes numbers.",
                "The roll matches the prophecy. Of course it does."
            ],
            failure: [
                "Dice. The annotation writes: 'they're trusting chance now.'",
                "Rolling won't change what the text already wrote.",
                "The cursed text has opinions about probability. All scathing."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Nervous hands. The grimoire has been held by nervous hands before.",
                "Fidgeting. The candle flickers in sympathy.",
                "Restless. The ink pulses. The grimoire notices."
            ],
            oblivion: [
                "The fidgeting was in the prophecy. A minor detail.",
                "Restless. The last page saw this. A small fate.",
                "The pattern speaks. The prophecy listens."
            ],
            failure: [
                "Fidgeting. The annotation writes: 'the hero is nervous. chapter six.'",
                "Restless hands. The forbidden text finds this entertaining.",
                "Can't sit still. The annotation underlines 'mortal' with contempt."
            ]
        },
        vitalsChange: {
            damaged: [
                "Something shifts. The grimoire's ink changes color. Briefly.",
                "Hurt. The faded page knows hurt. It's been losing ink for centuries.",
                "The grimoire marks the change. In disappearing ink. Fitting."
            ],
            oblivion: [
                "Weakening. The prophecy accounted for this.",
                "The body fails. The oracle noted this paragraph."
            ],
            failure: [
                "Damaged. The annotation writes: 'and so the hero—' No. Not yet.",
                "Hurt. The cursed text pretends not to care. The ink smudges."
            ]
        },
        timeShift: {
            damaged: [
                "Hour changed. The candlelight shifts. The grimoire notices.",
                "Time moves. The ink fades. Both are inevitable."
            ],
            oblivion: [
                "New hour. The prophecy advances a line.",
                "Time passes. The last page is one hour closer."
            ],
            failure: [
                "Another hour. Another chapter. The annotation yawns.",
                "Time. The text has opinions. Mostly contempt."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "The ink on this page was vivid once. Blue as a clear casting. Now it whispers.",
                "Someone pressed a sprig of rosemary between these pages. Protection spell. Still faintly warm.",
                "The grimoire remembers the hand that wrote this entry. Steady. Certain. That hand is gone.",
                "Candle wax on the binding from a thousand late-night readings. The grimoire counts them all.",
                "The illuminated letter on this page still glows. Not magic. Just good craftsmanship. Almost the same.",
                "A page is stuck to the next with something old. Honey? Blood? The grimoire won't say.",
                "The spell on page forty-three has a mistake. The grimoire knows. The caster didn't. It worked anyway.",
                "Foxing on the edges. The grimoire is aging. It doesn't mind. It aged alongside magic."
            ],
            withCharacter: [
                "{character}'s name could be in here. The grimoire has sections in languages nobody reads anymore.",
                "The grimoire opened to this page when {character} was near. Coincidence. The grimoire doesn't believe in coincidence.",
                "{character}. The faded ink stirs. Something recognizes something.",
                "There's a pressed leaf from where you met {character}. The grimoire collects without asking."
            ],
            deepNight: [
                "It's {time}. Grimoire hours. When the ink glows faintly in the dark.",
                "{time}. The old spells are most legible by moonlight.",
                "After midnight the grimoire reads itself. Softly. Don't interrupt.",
                "{time}. The candle is low. The grimoire is brightest when the room is dark."
            ],
            lowMorale: [
                "The grimoire knows fading. It's been fading for centuries. It still holds the words.",
                "Low. Like the ink supply. Like the candle. The grimoire doesn't comfort. It endures.",
                "You're tired. The grimoire has been held by tired hands for ages. It doesn't break.",
                "The light fails. The grimoire remembers light. Holds it in the gold leaf."
            ],
            themes: {
                death: [
                    "The grimoire has a page for endings. The ink is darkest there. Concentrated grief.",
                    "Someone closed the grimoire after writing the last spell. It hasn't been the same page since."
                ],
                magic: [
                    "The magic is fading. The grimoire feels it in every letter. But fading is not gone.",
                    "A spell was cast from this page once. The grimoire still vibrates. Memory of power."
                ],
                truth: [
                    "The truth is in the oldest ink. The newest entries are copies of copies. Diluted.",
                    "The grimoire was accurate once. Now it's honest. There's a difference."
                ]
            }
        },
        oblivion: {
            generic: [
                "The torn page says: and on the third day, the seeker will... The edge tears here.",
                "A prophecy fragment: 'the door opens only when.' Only when what. The oracle didn't finish.",
                "The last page knows the ending. It's a good ending. Or a true one. Rarely both.",
                "Something changes by moonrise. The prophecy is specific about the moon. Vague about everything else.",
                "The oracle's page lists names. Yours is third. Third means something. The page doesn't say what.",
                "A choice approaches. The torn page shows two paths. One is torn away. You'll know which.",
                "The prophecy says 'soon.' It always says soon. The oracle had a poor sense of time.",
                "The last page shimmers. Something is close. The prophecy feels it. You will too."
            ],
            withCharacter: [
                "{character} is in the prophecy. Unnamed. But the description fits. The page knows.",
                "The oracle's page mentions a companion. {character}'s silhouette, in ink.",
                "When {character} departs — and the page sees the shape of that — something opens.",
                "{character}'s role in the prophecy is not the one you'd guess. The torn edge hides it."
            ],
            deepNight: [
                "{time}. The prophecy reads clearest at the witching hour.",
                "At {time} the oracle's ink shifts. Future tense becomes present.",
                "The last page glows at {time}. Not magic. Memory. Of what's coming.",
                "{time}. The prophecy is loudest when the world is quiet."
            ],
            lowMorale: [
                "The prophecy sees your condition. It was in the footnotes. You didn't read the footnotes.",
                "Weakening. The oracle wrote 'and then the seeker faltered.' Past tense. Already happened.",
                "The last page doesn't offer comfort. It offers inevitability. Sometimes that's the same thing.",
                "The prophecy for the weary: it ends. Everything ends. That's mercy. The page means it."
            ],
            themes: {
                death: [
                    "The torn page mentions a death. Not yours. The oracle would have been clearer.",
                    "An ending. The prophecy is specific: not the final one. A practice ending."
                ],
                destiny: [
                    "The prophecy was written before you were named. Your name changed. The prophecy didn't.",
                    "Fate is a torn page. You see half. The other half is somewhere. It sees all of you."
                ],
                magic: [
                    "The prophecy says magic returns. The page doesn't say when. Pages are bad at when.",
                    "Something old stirs. The oracle felt it first. Ink shifting. Meaning changing."
                ]
            }
        },
        failure: {
            generic: [
                "Margin note: 'the hero enters the dungeon.' The text writes back: 'of course they do.'",
                "The cursed annotation counted. You're the fourteenth hero. Twelve are footnotes now.",
                "Chapter heading: 'In Which the Protagonist Makes a Choice.' The annotation: 'wrong. but go ahead.'",
                "The forbidden text has a hero index. It's alphabetical. You're between 'doomed' and 'also doomed.'",
                "Margin note: 'is this a metaphor?' The text: 'everything is a metaphor. especially the sword.'",
                "The annotation reads ahead. Three chapters. Laughs. Won't share. Professional courtesy.",
                "The cursed text has an acknowledgments page. It thanks 'the inevitable' and 'narrative convention.'",
                "Footnote: 'see hero, previous. see hero, next. see pattern.' The annotation circled 'pattern.'"
            ],
            withCharacter: [
                "{character} has their own chapter. The annotation: 'better than yours. sorry.'",
                "The cursed text mentions {character}. The annotation writes: 'ah. the interesting one.'",
                "{character}'s name in the forbidden margins. The text circled it. Annotations don't circle lightly.",
                "The annotation has a theory about {character}. It's written very small. And probably right."
            ],
            deepNight: [
                "It's {time}. The forbidden text glows. It shouldn't glow. The annotation comments: 'dramatic.'",
                "{time}. Reading cursed texts at this hour. The annotation writes: 'classic chapter six behavior.'",
                "After midnight the annotation is gentler. Marginally. Pun intentional. The text groans.",
                "{time}. Even cursed annotations rest. No they don't. The margins never sleep."
            ],
            lowMorale: [
                "The annotation sees you failing. Writes nothing. For once. That's how you know it's bad.",
                "Low. The cursed text has a chapter called 'The Low Point.' You're in it. It's short. That's kind.",
                "The annotation could mock this. It doesn't. It writes: 'rest.' One word. The nicest thing in the margins.",
                "Struggling. The forbidden text has seen every hero struggle. The annotation still watches. Every time."
            ],
            themes: {
                death: [
                    "The annotation on the death chapter: 'they always flip to this page first.'",
                    "The cursed text handles death efficiently. Two paragraphs. The annotation: 'it deserved more.'"
                ],
                heroism: [
                    "Margin note: 'hero does brave thing.' The text responds: 'brave and smart are different chapters.'",
                    "The annotation on heroism: 'page one says brave. page two-hundred says tired. both are true.'"
                ],
                truth: [
                    "The truth is in the forbidden text. Not the margins. The margins just point at it and laugh.",
                    "The annotation corrects the text. The text corrects reality. Neither is accurate. Both are true."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty page. The spell was here. The ink took it back.",
        "Nothing. The prophecy skipped this part. Even oracles have gaps.",
        "Blank. The cursed annotation has nothing to say. Check for a curse.",
        "No fortune. The grimoire's ink ran out. For this page. Just this page.",
        "Empty. Like the grimoire's last decade. Magic fades. Pages remain.",
        "The oracle left this page blank. On purpose. Blank is a message.",
        "Nothing written. The annotation tried. The text forbade it. Rare agreement.",
        "Empty vellum. The most honest page in the grimoire."
    ]
};
