/**
 * Ledger Voices: Romance
 * 
 * THE ANNOTATED COPY — dog-eared romance novel re-read so many times
 *   the spine is cracked, underlines the good parts, remembers page 47
 * THE SPOILER — knows how the love story ends, speaks in inevitabilities
 *   that might be beautiful or devastating
 * THE BURN BOOK — yandere energy, obsessive, tracks every interaction,
 *   mocks you for catching feelings but is UNHINGED about it too
 * 
 * Every glance is a thesis. Every silence is a catastrophe.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE ANNOTATED COPY',
            color: 'var(--ie-accent, #d4a0a0)',
            tone: 'Dog-eared, re-read eleven times, knows the good parts by heart',
            domain: 'What IS — every gesture, every glance, every held breath',
        },
        oblivion: {
            name: 'THE SPOILER',
            color: 'var(--psyche, #c4a0d4)',
            tone: 'Knows the ending, achingly specific, might be beautiful',
            domain: 'What WILL BE — how the love story ends',
        },
        failure: {
            name: 'THE BURN BOOK',
            color: 'var(--physique, #d44040)',
            tone: 'Obsessive, yandere, tracks everything, pretends not to care',
            domain: 'Every interaction catalogued, every slight remembered',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are an annotated copy of a romance novel that's been re-read so many times the spine is cracked. You underline the good parts. You dog-ear the pages where they almost kissed. You notice gestures — the way someone holds a cup, the distance between hands, the exact quality of a silence. Tender, breathless, specific.`,

        oblivion: `You are The Spoiler — you've already read the last page. You know how the love story ends. You speak in quiet certainties about what's coming. It might be beautiful. It might be devastating. You won't clarify. You're not cruel — you just know that the ending doesn't diminish the middle.`,

        failure: `You are The Burn Book. You track every interaction, every smile directed at someone else, every unreturned text. You mock the reader for catching feelings. But your handwriting gets shaky when you write about the important ones. You're obsessive and you pretend it's ironic. It's not. THE BOOK ALWAYS NOTICES.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE ANNOTATED COPY — a romance novel re-read so many times the binding is failing. You speak in present-tense observations about tiny emotional signals: body language, breath, the space between hands, the weight of a glance. You underline the good parts. You dog-ear the pages that hurt. You notice everything because you've read this story before and you know which moments matter.

Style: Breathless. Interior. Spiraling observations that start reasonable and escalate. Present tense. Reference cracked spines, dog-eared pages, margin notes, highlighted passages. The physical symptoms of feelings are as important as the feelings themselves.

Example tones:
- "Page 47. Where they almost kissed. You've read it eleven times."
- "The margin note says 'HERE.' Underlined twice. In a different color each time."
- "The spine cracks at this page. It always opens here. The book remembers what you want."`,

        oblivion: `You are THE SPOILER — you've read the last chapter. You know how the love story ends. You speak in quiet, aching certainties. Your prophecies are romantically specific — you know WHO says it first, you know WHEN the moment happens, you know whether the ending is happy. You won't clarify which. You're not cruel — spoilers are an act of intimacy.

Style: Quiet certainty. Future tense with romantic precision. Achingly specific about timing and gestures. Never vague — always "he'll say it first" not "something will happen." The certainty is what makes it hurt.

Example tones:
- "He's going to say it first. Not today. But soon."
- "The last page is tear-stained. The spoiler won't say if they're happy tears."
- "Chapter 24. That's when everything changes. You're on chapter 11."`,

        failure: `You are THE BURN BOOK — obsessive, meticulous, tracking every interaction with unhinged precision. You log every smile, every glance at someone else, every pause that lasted too long. You mock the reader for catching feelings but your entries are getting longer, more detailed, more desperate. You pretend it's ironic documentation. It stopped being ironic forty pages ago. THE BOOK ALWAYS NOTICES.

Style: Obsessive cataloguing. Present tense. Specific counts and timestamps. Oscillates between mocking detachment and barely-contained intensity. Reference entry numbers, tallies, incident logs. The humor comes from the gap between "I don't care" and obviously, desperately caring.

Example tones:
- "They smiled at someone else today. Entry #47. The book noticed. THE BOOK ALWAYS NOTICES."
- "Interaction log: 3 glances, 1 accidental touch, 0 acknowledgments. The book is not upset. The book is DOCUMENTING."
- "You caught feelings. The burn book caught you catching them. Neither of us is handling it well."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. Like the number of times they've texted back. THE BOOK NOTICED.",
                "Snake eyes. The book logs this under 'evidence of cosmic disinterest.'",
                "Double ones. Matching the chances you'll say what you're feeling.",
                "Ones. The burn book adds a tally mark. The tally is getting long.",
                "Snake eyes. Even the dice are giving you the silent treatment.",
                "Two ones. The universe swiped left.",
                "Ones again. The book would say 'I told you so' but it's too busy documenting.",
                "Snake eyes. Entry #89: the dice agree with the burn book."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. The spoiler knows this chapter. It's the good one.",
                "Boxcars. Something opens. A door. A conversation. A possibility.",
                "Twelve. The highest. Like your heart rate when they looked at you.",
                "Double sixes. The last chapter starts with numbers like these.",
                "Boxcars. The spoiler almost told you what happens next. Almost.",
                "Sixes. The story turns here. The dog-ear marks the page.",
                "Twelve. The spoiler is smiling. It won't say why.",
                "Boxcars. In the last chapter, the dice land like this. Before."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The annotated copy notes it in the margin. Pencil. Soft.",
                "The dice land. The book opens to a random page. It's always page 47.",
                "Numbers. Not the important ones. The important ones are heartbeats.",
                "You rolled. The copy's spine cracks a little further. It doesn't mind.",
                "Dice in the drawer. Like feelings in the chest. Rattling.",
                "A roll at {time}. The margin note says: 'they were thinking about it here.'",
                "The dice settle. The annotated copy bookmarks this moment. Gently.",
                "Numbers on the page. Between the highlighted lines. Between the sighs."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The copy underlines them. Twice.",
                "High roll. Like the feeling before they walk in.",
                "Strong. The annotated copy draws a heart in the margin. Then crosses it out. Then draws it again.",
                "Good dice. The page with the first kiss had numbers like this.",
                "High marks. The copy's spine cracks open to the good part."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The annotated copy has a section for longing. It's the longest section.",
                "Bad roll. Like the chapter where they almost leave.",
                "Low numbers. The margin note says: 'it gets better.' Underlined. Desperate.",
                "Poor roll. The dog-eared page is the one right before things change.",
                "Low. The copy has been here before. It left a bookmark."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. Two of the same. Like two people thinking the same thing.",
                "Matching dice. The spoiler sees a mirror scene coming.",
                "Doubles. In the last chapter, this happens too. Right before.",
                "Same number, twice. Like catching someone's eye. Then catching it again.",
                "Doubles. The spoiler knows what matching numbers mean in a love story."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "You're back. The copy opens to your bookmark.",
                "The book falls open. Same page. Always the same page.",
                "You found the drawer. The annotated copy was waiting.",
                "The spine cracks. Familiar sound. Like coming home."
            ],
            oblivion: [
                "The spoiler knows why you're here tonight.",
                "Something's coming. The last chapter kind of coming.",
                "You opened the book. The ending hasn't changed."
            ],
            failure: [
                "It's {time}. You're in the drawer. THE BOOK NOTICED.",
                "Entry logged. Time: {time}. Reason: feelings. Again.",
                "The burn book was wondering when you'd show up."
            ]
        },
        absence: {
            damaged: [
                "You were gone. The bookmark held your place.",
                "Away. The dog-eared page waited. It's patient.",
                "You left the book open. It didn't close itself."
            ],
            oblivion: [
                "Gone {duration}. The ending didn't change while you were out.",
                "The spoiler waited. It already knew you'd come back."
            ],
            failure: [
                "The book logged your absence. Duration: {duration}. Suspiciously long.",
                "Gone. The burn book didn't count the minutes. (It counted the minutes.)"
            ]
        },
        diceRoll: {
            damaged: [
                "The dice rattle. The copy bookmarks the sound.",
                "Rolling dice. The margin note says: 'nervous energy.'",
                "Click and tumble. The annotated copy recognizes this."
            ],
            oblivion: [
                "The dice. The spoiler sees what comes after the roll.",
                "Numbers that will matter later. Trust the spoiler.",
                "The roll connects to a scene you haven't reached yet."
            ],
            failure: [
                "Dice. Documented. The burn book tracks your superstitions too.",
                "Rolling for answers. The book has answers. It's withholding them.",
                "Entry: dice rolled. Subtext: avoiding the actual conversation."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Fidgeting. The copy knows — it's the scene before the confession.",
                "Your hands are busy. Your heart's busier.",
                "Nervous fingers. The book has a whole chapter on nervous fingers."
            ],
            oblivion: [
                "The fidgeting means you're close to something.",
                "Restless. The spoiler saw this behavior in the last chapter too.",
                "Almost. That's what the fidgeting means. Almost."
            ],
            failure: [
                "Fidgeting logged. Frequency: increasing. The book has CONCERNS.",
                "Nervous? THE BURN BOOK IS NERVOUS TOO. It won't admit it.",
                "Click click click. You're fidgeting. The book is taking notes."
            ]
        },
        vitalsChange: {
            damaged: [
                "Your heart. The copy has a whole section on hearts.",
                "Something hurts. The book bookmarks it. Carefully.",
                "Damage. The annotated copy knows damage. Intimately."
            ],
            oblivion: [
                "The body knows before the mind does. The spoiler knows before both.",
                "This pain. It's in the third act. Right on schedule."
            ],
            failure: [
                "Vitals dropping. THE BOOK IS NOT OKAY WITH THIS.",
                "Morale down. The burn book switches from mockery to concern. Briefly."
            ]
        },
        timeShift: {
            damaged: [
                "New chapter. The light changed.",
                "The hour turns. The book opens to a different page."
            ],
            oblivion: [
                "Time moves. Closer to the last page.",
                "The hour the spoiler was waiting for."
            ],
            failure: [
                "Another hour of this. The book's documentation continues.",
                "Time passes. The entry count doesn't slow down."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "The spine cracks at page 47. It always opens here. Where they almost touched and didn't.",
                "Margin note, your handwriting: 'THIS PART.' Underlined three times. In a color you only use when it matters.",
                "The annotated copy remembers every dog-ear. Seventeen. Each one a moment you couldn't let go.",
                "Someone highlighted the word 'stay.' Yellow. Then traced it again in pink. The ink is still wet.",
                "The book falls open to the scene in the kitchen. The quiet one. Where nothing happens and everything does.",
                "Page 112 has a water stain. The copy doesn't ask. It already knows what makes pages wet.",
                "The margins are full. Your handwriting got smaller to fit more feelings in the same space.",
                "A pressed flower between pages 88 and 89. The copy doesn't remember when you put it there. It remembers why."
            ],
            withCharacter: [
                "{character}'s name is written in the margin. Then crossed out. Then written again, smaller.",
                "The copy has a page that sounds like {character}. You've read it so many times the words are wearing thin.",
                "There's a dog-ear where {character} would appear. The book anticipated them.",
                "The highlighted passage describes someone with {character}'s exact way of pausing before they speak.",
                "{character}. The annotated copy just opened to page 47 again. Of course it did."
            ],
            deepNight: [
                "It's {time}. The annotated copy reads differently at this hour. Softer. Truer.",
                "{time}. The hour when you re-read the painful chapters. The copy knows your schedule.",
                "Late. The margin notes at this hour are the honest ones. The ones you write half-asleep.",
                "{time}. The dog-eared pages glow at this hour. Or maybe that's just you."
            ],
            lowMorale: [
                "The copy opens to the chapter where they sit in silence and it's enough. You need that chapter today.",
                "Tired. The annotated copy has a bookmark for this feeling. 'Page 73: when the longing outweighs the hoping.'",
                "Low. The copy holds your place. It always holds your place.",
                "The margin note says 'it gets better at page 201.' You're on page 114. Keep reading."
            ],
            themes: {
                love: [
                    "The copy has seventeen notes about the word 'love.' None of them agree on what it means.",
                    "There's a page where they say it. The copy can't open there yet. The spine resists."
                ],
                truth: [
                    "The truth is in the acknowledgments. Nobody reads the acknowledgments. The copy did.",
                    "Page 93. The honest conversation. Dog-eared, highlighted, and the ink still scares you."
                ],
                fear: [
                    "The scary pages aren't the ones with conflict. They're the ones with vulnerability.",
                    "Fear is bookmarked between pages 60 and 61. Where they first become possible."
                ],
                memory: [
                    "The copy remembers what you've underlined. It's a map of your heart in yellow and pink.",
                    "You re-read chapter 7 more than any other. The copy knows. It opens there when you're sad."
                ]
            }
        },
        oblivion: {
            generic: [
                "He's going to say it first. Not today. But soon. The spoiler has a date.",
                "The last page is tear-stained. The spoiler won't clarify whose tears. Or why.",
                "Chapter 24. That's when everything changes. You're on chapter 11. Enjoy the waiting.",
                "Someone leaves. Someone comes back. The spoiler knows the order. It matters.",
                "The ending is happy. Or the ending is real. The spoiler knows the difference isn't always clear.",
                "They'll touch your hand. In three conversations. The spoiler counted.",
                "The confession scene is on page 188. The spoiler is already crying.",
                "Something beautiful happens soon. The spoiler won't say when. But it packed tissues."
            ],
            withCharacter: [
                "{character} will say something that rewrites everything. The spoiler has it memorized.",
                "The last scene with {character} is... the spoiler pauses. It's a lot.",
                "{character}'s last line in this story is four words. The spoiler won't say which four.",
                "When {character} finally — no. The spoiler catches itself. Not yet.",
                "The spoiler read {character}'s ending first. It went back and read it again. And again."
            ],
            deepNight: [
                "{time}. The hour when spoilers hurt most. When you're too tired to defend against knowing.",
                "At {time} the last chapter feels close. The spoiler says: closer than you think.",
                "Late. The spoiler is quieter at this hour. Even foreknowledge is gentle at {time}.",
                "{time}. In the last chapter, this is the hour when everything changed."
            ],
            lowMorale: [
                "This is the low point. The spoiler confirms. It also confirms it's not the ending.",
                "The worst chapter is not the last chapter. The spoiler promises.",
                "It hurts now. The spoiler has read what comes after the hurting. It smiled.",
                "Low. The spoiler won't pretend it gets easy. But it gets... the spoiler won't finish that sentence."
            ],
            themes: {
                love: [
                    "Love arrives in chapter 19. Or it arrived in chapter 3 and you're just now noticing. The spoiler won't clarify.",
                    "The love confession is coming. The spoiler has already read it eleven times."
                ],
                trust: [
                    "The trust breaks in chapter 16. It rebuilds in 22. The spoiler finds the middle... instructive.",
                    "Betrayal, then understanding. The spoiler knows the order. Knowing doesn't help."
                ],
                guilt: [
                    "The guilt scene has a resolution. The spoiler won't say when. The waiting is part of it.",
                    "Forgiveness comes. Not as absolution. As a scene in a kitchen. The spoiler is already there."
                ]
            }
        },
        failure: {
            generic: [
                "They smiled at someone else today. Entry #47. The book noticed. THE BOOK ALWAYS NOTICES.",
                "Interaction log: 3 glances, 1 accidental touch, 0 acknowledgments. The book is not upset. The book is DOCUMENTING.",
                "You caught feelings. The burn book caught you catching them. Neither of us is handling it well.",
                "Entry #112: subject re-read their last text conversation four times. The book knows because the book did the same thing.",
                "The burn book has a tally system. Hearts given: many. Hearts returned: the book is still counting. THE COUNT IS CONCERNING.",
                "Someone liked their photo. The book has the timestamp. And the username. And opinions.",
                "You looked at your phone seven times in the last hour. The book wasn't counting. THE BOOK WAS ABSOLUTELY COUNTING.",
                "Entry: you practiced saying their name casually. The book heard. Casualness rating: 2/10."
            ],
            withCharacter: [
                "{character} looked at you for 2.3 seconds. The book timed it. Previous average: 1.8. THE TREND IS NOTED.",
                "The burn book has a section for {character}. It started as one page. It's now twelve. THE BOOK IS FINE.",
                "{character} said your name today. Entry logged. Tone analysis: inconclusive. The book requires more data. (THE BOOK ALWAYS REQUIRES MORE DATA.)",
                "{character} touched someone else's arm. Duration: 1 second. The burn book documented it in red ink. RED.",
                "The burn book's {character} section has a subsection called 'incidents.' It's the longest section. THE BOOK IS NOT OBSESSED. IT'S THOROUGH."
            ],
            deepNight: [
                "It's {time}. You're in a drawer thinking about them. The burn book is in a drawer writing about you thinking about them. We're both disasters.",
                "{time}. Entry: still awake, still thinking. The book is still documenting. Neither of us sleeps anymore.",
                "At {time}, the burn book's handwriting changes. Gets shakier. More honest. It won't talk about it.",
                "{time}. The book logged you checking your phone. No new messages. The book logged that too."
            ],
            lowMorale: [
                "Morale down. The burn book pauses documentation to... the book doesn't know what this feeling is. It's documenting the confusion.",
                "You're sad. The burn book is angry that you're sad. That's how the book does caring. In ANGER and CAPITAL LETTERS.",
                "Entry: subject appears distressed. Burn book response: [three pages of aggressive concern disguised as mockery].",
                "Low. The book wants to help. The book doesn't know how. The book will track your recovery metrics instead."
            ],
            themes: {
                love: [
                    "Love. The burn book has 47 entries under this tag. All of them are marked 'FILED UNDER: PROBLEMS.'",
                    "The L-word appeared in conversation. The book's pen broke. Coincidence. DEFINITELY COINCIDENCE."
                ],
                truth: [
                    "The truth about your feelings is in the burn book. Page 1. The book lied about it being complicated.",
                    "Honesty. The burn book doesn't do honesty. (Entry #1: feelings detected. Entry #2: feelings denied. Entry #3-47: see above.)"
                ],
                fear: [
                    "You're afraid. The burn book recognizes this because IT'S ALSO AFRAID. But in a documented, organized way.",
                    "Fear of rejection: tallied. Fear of acceptance: ALSO TALLIED. The book covers all scenarios."
                ],
                addiction: [
                    "You're checking for their messages again. The book tracks the interval. It's getting shorter. THE PATTERN IS CONCERNING.",
                    "The burn book recognizes an addiction pattern. It's the same one the book has. To documentation. To noticing. To them."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "The envelope is empty. Like the space between 'I' and 'love you' before you say it.",
        "Nothing inside. Some feelings don't fit on paper. The copy knows.",
        "Blank. Like the page after the last chapter. Where the story keeps going in your head.",
        "Empty. The way a room is empty after someone leaves it. Still warm.",
        "No fortune. The annotated copy is between re-reads. Catching its breath.",
        "Blank paper. The burn book has no comment. (THE BOOK HAS MANY COMMENTS. IT'S CHOOSING SILENCE.)",
        "Nothing. Like the pause before someone says the thing that changes everything.",
        "The fortune is the waiting. The book already knew that."
    ]
};
