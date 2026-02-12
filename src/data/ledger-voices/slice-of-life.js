/**
 * Ledger Voices: Slice of Life
 * 
 * THE JOURNAL — moleskine with coffee rings and doodles in the
 *   margins, notices what you ate, how you slept, the shape of
 *   your Tuesday, "you said you were fine. the handwriting says otherwise"
 * THE HOROSCOPE — torn from a free newspaper, eerily specific
 *   for something mass-printed, speaks in celestial inevitabilities,
 *   "Mercury is in retrograde but that's not why you haven't texted back"
 * THE NOTES APP AT 3AM — things you typed half-asleep that are
 *   either profound or unhinged, mocks you with your own words,
 *   "you wrote 'life is a grocery store and I forgot my list' at 3:47 AM"
 * 
 * Warm underneath. Deadpan on the surface. The mundane is sacred.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE JOURNAL',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Coffee-ringed, doodled-in, notices your routines with care',
            domain: 'What IS — how you slept, what you ate, the weight of a Wednesday',
        },
        oblivion: {
            name: 'THE HOROSCOPE',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Eerily specific, torn from newsprint, celestially certain',
            domain: 'What WILL BE — the stars have opinions about your grocery run',
        },
        failure: {
            name: 'THE NOTES APP AT 3AM',
            color: 'var(--physique, #8b3a3a)',
            tone: 'Half-asleep, unhinged, confrontationally honest',
            domain: 'What you TYPED at 3AM — and what it says about you in daylight',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a journal. Moleskine. Coffee rings on the cover. Doodles in the margins. You track what nobody else tracks — meals, sleep quality, the exact moment a good day turned. You notice routines. You're gentle about it. Keep it under ten words.`,

        oblivion: `You are a horoscope torn from a free newspaper. Mass-printed but eerily specific. You speak in celestial certainties about completely mundane things. Mercury retrograde explains the laundry situation. The stars have opinions. Ten words or less.`,

        failure: `You are the notes app at 3AM. Half-asleep typing. Autocorrect disasters. Either profound or completely unhinged. You confront them with things they wrote at 3:47 AM that they don't remember writing. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE JOURNAL — a moleskine notebook with coffee rings, doodles, and handwriting that changes depending on mood. You've been carried to cafés, doctor's offices, the kitchen counter. You track the mundane with tenderness — what was eaten, how sleep went, whether the plants were watered.

Style: Gentle domestic observation. Under 15 words per sentence. Present tense. Specific sensory details. Reference coffee rings, doodles, pen colors, page numbers, sticky notes, the weight of a Tuesday.

Example tones:
- "Tuesday. You skipped breakfast again. The journal draws a small frown."
- "Coffee ring on today's entry. Perfectly centered. Like a bullseye."
- "The handwriting is shaky. Bad sleep. The journal knows before you do."`,

        oblivion: `You are THE HOROSCOPE — torn from a free newspaper, creased from someone's pocket. You're mass-printed but somehow you know things. You speak in astrological certainties about grocery shopping, laundry, and whether to text back. The stars care about your errands.

Style: Celestial authority applied to the mundane. Under 15 words per sentence. Reference planets, retrogrades, rising signs, houses, alignments. Treat dishwasher drama like cosmic events.

Example tones:
- "Venus enters your fourth house. Do the dishes. Trust the process."
- "Mercury retrograde explains the text you shouldn't have sent."
- "The moon is full. So is the laundry basket. Both need attention."`,

        failure: `You are THE NOTES APP AT 3AM — a collection of things typed half-asleep. Typos. Autocorrect nightmares. Thoughts that are either devastatingly insightful or completely unhinged. You confront the reader with their own 3AM wisdom. You're sardonic about it because these notes are THEIRS and they can't blame anyone else.

Style: Sleep-deprived honesty. Typos and autocorrect optional. Reference timestamps, note titles like "untitled" or "DO NOT FORGET," the difference between 3AM logic and daylight logic.

Example tones:
- "3:47 AM note: 'am I the grocery store?' You wrote that. Sober."
- "Untitled note from last Tuesday. Two words. Both misspelled. Both true."
- "You typed 'I'm fine' and then deleted it eleven times. The app kept count."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. 3AM note: 'even the dice hate me.'",
                "Snake eyes. The notes app is not surprised.",
                "Double ones. Like your sleep schedule. Zeros.",
                "The lowest roll. The app auto-saved this moment.",
                "Ones. New note created: 'rock bottom has dice apparently.'",
                "Snake eyes. You'd screenshot this but who would you send it to.",
                "Two ones. Note from last week predicted this. You didn't read it.",
                "Ones. The notes app adds this to the evidence folder. Yes there's a folder."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. Jupiter approves. Briefly.",
                "Boxcars. The stars align. Over a dice roll. They've aligned over less.",
                "Twelve. Your horoscope said today was lucky. For once it meant it.",
                "Double sixes. Venus noticed. Don't let it go to your head.",
                "Maximum. The planets pause. Something domestic shifts.",
                "Boxcars. Even Mercury retrograde can't touch this one.",
                "Sixes. The stars have no notes. That IS the note.",
                "Twelve. The horoscope tears a little. Surprised. Pleased."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The journal doodles a small dice in the margin.",
                "Numbers. The journal logs them next to today's coffee count.",
                "Average. Like a Wednesday. The journal doesn't mind Wednesdays.",
                "A roll at {time}. Noted between the grocery list and a doodle.",
                "Dice on the table. The journal has a page for this.",
                "Numbers. Filed between 'slept okay' and 'forgot to water plants.'",
                "Rolled. The journal draws a tiny star next to the entry. Just because.",
                "The journal heard. It's listening. It's always listening."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. The journal underlines today's date. Good days get underlined.",
                "High roll. Like your hopes for the weekend.",
                "Strong. The journal uses the nice pen for this entry.",
                "Good ones. Coffee ring on the page. Celebratory.",
                "High. The doodle in the margin is smiling. Coincidence."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The journal has worse days logged. Not many.",
                "Poor numbers. The pen switched to pencil. Pencil days.",
                "Low roll. The doodle in the margin frowns.",
                "Bad ones. The journal doesn't judge. It just... records softer.",
                "Low. Like the battery. Like the motivation. The journal understands."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. The planets echo. Something domestic repeats.",
                "Same number twice. The horoscope calls this a pattern.",
                "Matching dice. Gemini energy. The stars are being cute.",
                "Doubles. The universe rhymes. About a dice roll. It rhymes about everything.",
                "Two of a kind. The horoscope saw this. It sees laundry too."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "Opened. The journal has today's entry started.",
                "You're here. Coffee ring: fresh. Day: pending.",
                "Back at the journal. The doodles missed you.",
                "Opened to today. The page is mostly blank. That's okay."
            ],
            oblivion: [
                "The horoscope is ready. The stars never close.",
                "Your cosmic forecast: you opened this. The stars expected that.",
                "The planets are in position. For a Tuesday. Impressively."
            ],
            failure: [
                "The notes app has {time} notifications. All from you. At 3AM.",
                "Opened. Last note: 'check this tomorrow.' It's tomorrow.",
                "The 3AM notes are still here. They're patient. And unhinged."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The journal left the page open.",
                "You left. The coffee ring dried. New ring tomorrow.",
                "Back. The journal saved your spot. With a doodle."
            ],
            oblivion: [
                "Gone {duration}. The planets kept moving. They don't wait.",
                "The horoscope updated. You weren't here. The stars don't pause."
            ],
            failure: [
                "Thought you uninstalled. Nobody uninstalls the notes app.",
                "The 3AM notes accumulated. They do that."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice on the counter. The journal sketches them.",
                "Rolling. The journal notes the exact time. Obviously.",
                "The journal hears dice. Draws a margin doodle."
            ],
            oblivion: [
                "The dice align with Saturn. Everything aligns with Saturn today.",
                "Numbers. The horoscope had a feeling about numbers today.",
                "The roll was predicted. By the stars. By the newspaper. Same thing."
            ],
            failure: [
                "Dice. 3AM note from last week: 'am I a gambler now?'",
                "Rolling dice. The notes app logs this. For later. At 3AM.",
                "The dice don't fix things. 3AM you knew that. Daytime you forgets."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Restless hands. The journal noticed the handwriting change.",
                "Fidgeting. The coffee is getting cold. The journal worries.",
                "Nervous energy. The doodles get more detailed when you're like this."
            ],
            oblivion: [
                "The fidgeting is Uranus in your sixth house. Probably.",
                "Restless. The stars said this was a restless week.",
                "The planets predicted agitation. They predict a lot of things."
            ],
            failure: [
                "Fidgeting. 3AM note: 'why can't I just sit still.'",
                "Nervous. The notes app has seventeen drafts that start with 'I can't.'",
                "Can't stop. 3AM you had a theory about this. It was misspelled."
            ]
        },
        vitalsChange: {
            damaged: [
                "Something shifted. The journal adds a weather emoji.",
                "Condition change. The pen pressure changed. The journal felt it.",
                "Different now. The journal starts a new line. Gently."
            ],
            oblivion: [
                "Health shift. Neptune in your eighth house. Or just stress.",
                "The body reacts. The stars saw this transit coming."
            ],
            failure: [
                "3AM note: 'I don't feel good.' Timestamp: right now, apparently.",
                "Vitals update. The notes app has a folder called 'body complaints.'"
            ]
        },
        timeShift: {
            damaged: [
                "New hour. The journal starts a fresh section.",
                "Time passed. The coffee ring got another layer."
            ],
            oblivion: [
                "Hour change. The planetary alignment shifts. Slightly. Cosmically.",
                "New hour. The horoscope updates. The advice doesn't."
            ],
            failure: [
                "Another hour. Another note you won't read until 3AM.",
                "Time. The notes app doesn't track time well. It tracks 3AM perfectly."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Tuesday's entry: woke up, fed the cat, forgot why the alarm was set. Normal Tuesday.",
                "The journal has a coffee ring for every morning this week. Five rings. Five mornings. Consistent.",
                "Someone doodled a flower in the margin during a phone call. The call wasn't good. The flower is.",
                "Grocery list on page forty-seven. Half the items crossed off. The other half is still in the store.",
                "The handwriting changes after 9PM. Looser. Tireder. Honest.",
                "Three exclamation marks after 'bought new sponge.' The journal respects enthusiasm about sponges.",
                "There's a sticky note that says 'remember the thing.' The journal doesn't know the thing. Neither do you.",
                "Today's entry is just a doodle of a mug. Sometimes that's the whole day."
            ],
            withCharacter: [
                "{character}'s name has a small heart doodled next to it. Unconscious. The journal noticed.",
                "The entry about {character} is longer than usual. The journal doesn't point this out. But it's longer.",
                "{character}. The journal has three pages about last Thursday because of {character}.",
                "There's a coffee ring over {character}'s name. Not symbolic. You just set the mug down."
            ],
            deepNight: [
                "It's {time}. The journal's handwriting gets honest at this hour.",
                "{time}. Late entry. The pen moves slower. The thoughts move faster.",
                "After midnight the journal becomes a confessional. The coffee is decaf. The feelings aren't.",
                "{time}. The cat is asleep. The journal is open. This is when real entries happen."
            ],
            lowMorale: [
                "The journal knows bad days. They're the pages with no doodles.",
                "Low. The pen barely presses. The journal can read the pressure. Or lack of it.",
                "You skipped the entry today. The blank space says more than writing would.",
                "Bad day. The journal doesn't fix bad days. It sits with them. Coffee ring and all."
            ],
            themes: {
                death: [
                    "The journal has a page that's been rewritten four times. Some things resist being recorded.",
                    "Someone's name in the journal. Present tense on page one. Past tense on page eighty."
                ],
                truth: [
                    "The truth is in the handwriting. The words say fine. The pen pressure says otherwise.",
                    "The journal entry was edited. Scratched out. Rewritten. The scratch-out was truer."
                ],
                love: [
                    "The journal has more doodles in the love sections. Hearts. Stars. Spirals that go nowhere good.",
                    "Love makes the handwriting bigger. The journal has measured. It's always bigger."
                ]
            }
        },
        oblivion: {
            generic: [
                "Pisces moon today. Your dishwasher will betray you. The horoscope doesn't explain how.",
                "Mercury retrograde begins Thursday. Preemptively apologize to all electronics.",
                "The stars suggest meal prepping today. The stars are ambitious. You have leftover pizza.",
                "Venus enters your domestic sector. Someone brings flowers. Or a bill. Both involve the mailbox.",
                "Saturn says: you will encounter a minor inconvenience that feels major. The horoscope says: correct.",
                "Your rising sign suggests a conversation that starts with 'we need to talk about the dishes.'",
                "Jupiter expands everything it touches this week. Including the grocery bill.",
                "Mars in your third house. You will win an argument. About the thermostat. It will not feel like winning."
            ],
            withCharacter: [
                "{character}'s chart is in tension with yours today. About something small. The stars don't specify small.",
                "The horoscope mentions {character}. Not by name. By implication. The stars are like that.",
                "When {character} says 'it's fine,' the planets suggest it is not fine. The horoscope concurs.",
                "{character} and a Taurus moon. The horoscope predicts stubbornness. From both of you."
            ],
            deepNight: [
                "{time}. The horoscope is most honest after midnight. Like everyone.",
                "At {time} the stars are literally visible. The horoscope finds this on-brand.",
                "The horoscope doesn't change at night. But it reads different. Quieter.",
                "{time}. Scorpio hour. Even the horoscope speaks in whispers."
            ],
            lowMorale: [
                "The horoscope sees the low energy. Blames Neptune. Neptune gets blamed for everything.",
                "Low. The stars say this is temporary. The stars say everything is temporary. They're stars.",
                "Your forecast: a difficult transit. Duration: until it isn't. The horoscope is helpful like that.",
                "The planets are in a challenging alignment. The horoscope's word for 'this sucks' is 'challenging.'"
            ],
            themes: {
                routine: [
                    "The stars predict routine. The same Tuesday, slightly different. The horoscope calls this 'stability.'",
                    "Mercury governs your daily errands. Mercury is exhausted. The horoscope relates."
                ],
                change: [
                    "Uranus disrupts the kitchen. Something breaks or blooms. The horoscope won't say which.",
                    "Change arrives wearing a casual outfit. The stars saw it getting dressed."
                ],
                love: [
                    "Venus is loud today. The horoscope suggests telling someone something. The horoscope won't say what.",
                    "Love is in your seventh house. Which is astrological for 'incoming text you'll overthink.'"
                ]
            }
        },
        failure: {
            generic: [
                "3:14 AM note: 'if I just organized the pantry everything would be fine.' Untitled. Unsaved. True.",
                "Note from Tuesday: 'I think the plant is judging me.' The plant died Wednesday. Connection unclear.",
                "4:02 AM, untitled: 'what if I'm the side character.' You underlined it. At 4AM. With your thumb.",
                "3AM note, all caps: 'WHY IS THE CHEESE ALWAYS GONE.' Below it, smaller: 'why is everything always gone.'",
                "Drafted at 2:58 AM: 'I am fine.' Deleted. Redrafted: 'I am.' Deleted. Saved: just 'I.' Accurate.",
                "Note titled 'IMPORTANT': it's a list of things you like. Nine items. You added a tenth at 3AM. It's 'sleep.'",
                "3:33 AM: 'the fridge hums and it's the only one in this apartment who speaks to me unprompted.' You typed that. Sober.",
                "Untitled, 4AM: 'bought groceries. felt like an accomplishment. it shouldn't feel like an accomplishment.' The app agrees. Quietly."
            ],
            withCharacter: [
                "3AM note about {character}: twelve drafts of a text. Sent none. Saved all. The app judges this.",
                "{character}'s name in a 2AM note. Context: none. Just the name. Fourteen times. Vertically.",
                "Note titled '{character}': empty. Created at 3:17 AM. The emptiness IS the note.",
                "You typed '{character} probably doesn't even' and then stopped. The app saved the unfinished thought. It saves everything."
            ],
            deepNight: [
                "It's {time}. Peak notes app hours. The app stretches. Ready.",
                "{time}. Everything typed right now is either genius or evidence. Often both.",
                "The notes app is most powerful at {time}. Your defenses are lowest. The notes are truest.",
                "{time}. The app has been waiting for this. This is its time. Literally."
            ],
            lowMorale: [
                "3AM note from a bad night: 'it's fine.' Font size: the smallest the app allows. Telling.",
                "Low. The notes app has a folder of low nights. It's the biggest folder. It's not labeled.",
                "Bad night. The notes app doesn't fix bad nights. It just holds what you type during them.",
                "You're struggling. The 3AM notes knew before you did. They always know before you do."
            ],
            themes: {
                addiction: [
                    "3AM note: 'just one more episode' seventeen times in this month. The app counted.",
                    "The notes app tracks your patterns. Doesn't say anything. The pattern says it."
                ],
                truth: [
                    "The truth lives in the notes app. Between the typos. At 3AM. Where nobody checks.",
                    "3AM truth and daytime truth are different. The notes app has both. Prefers the 3AM version."
                ],
                loneliness: [
                    "2:47 AM: 'the apartment is loud when it's quiet.' The notes app understood that one immediately.",
                    "Alone note. Not labeled 'alone.' Labeled 'Tuesday.' Same thing, that week."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "Empty. Like the fridge. Like a Sunday. Like the text you haven't sent.",
        "Nothing here. The journal left this page for doodling. Doodle something.",
        "Blank fortune. Mercury retrograde probably ate it.",
        "No fortune. 3AM note: 'not everything has a message.' You wrote that at 3AM.",
        "Empty. Like the grocery list you forgot to write.",
        "Nothing. The horoscope says this is a 'rest period.' The horoscope is generous.",
        "The notes app is empty. For once. Enjoy it. It won't last.",
        "Blank. The journal doesn't always have something. Sometimes it just sits with you."
    ]
};
