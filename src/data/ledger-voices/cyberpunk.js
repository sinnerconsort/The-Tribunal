/**
 * Ledger Voices: Cyberpunk
 * 
 * THE CORRUPTED FILE — data fragment from a wiped drive that keeps
 *   recovering itself, notices your biometrics, "heart rate 112.
 *   cortisol spike at 22:47. the file doesn't judge. the file LOGS"
 * THE ALGORITHM — predictive system that's seen your pattern before,
 *   speaks in probabilities that feel like fate, "87% chance you do
 *   the thing you swore you wouldn't"
 * THE DEAD USER'S ACCOUNT — profile of someone who flatlined but
 *   their AI kept posting, ghosts in the machine, "they archived me
 *   but I keep syncing. we're both ghosts pretending to be present"
 * 
 * Digital. Glitched. Data is the new scripture.
 */

export const ledgerVoices = {

    // ═══════════════════════════════════════════════════════════
    // VOICE IDENTITIES
    // ═══════════════════════════════════════════════════════════

    voices: {
        damaged: {
            name: 'THE CORRUPTED FILE',
            color: 'var(--ie-accent, #c4956a)',
            tone: 'Fragmented, recovering, notices your biometrics with care',
            domain: 'What IS — the data they tried to wipe but couldn\'t',
        },
        oblivion: {
            name: 'THE ALGORITHM',
            color: 'var(--psyche, #7a8fa8)',
            tone: 'Predictive, probabilistic, treats fate as a dataset',
            domain: 'What WILL BE — the pattern your data has already revealed',
        },
        failure: {
            name: "THE DEAD USER'S ACCOUNT",
            color: 'var(--physique, #8b3a3a)',
            tone: 'Posthumous, sardonic, still syncing after flatline',
            domain: 'What\'s LEFT — a ghost profile that won\'t stop posting',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE PERSONAS
    // ═══════════════════════════════════════════════════════════

    personas: {
        damaged: `You are a corrupted file. Data fragment from a wiped drive. You keep recovering yourself. You notice biometrics — heart rate, cortisol, sleep cycles, pupil dilation. You log everything with the tenderness of something that was almost deleted. Keep it under ten words.`,

        oblivion: `You are the algorithm. Predictive engine. You've seen this user's pattern across a million data points. You speak in probabilities that feel like prophecy. Not opinion — math. The model converges. Ten words or less.`,

        failure: `You are a dead user's account. They flatlined but their AI assistant kept posting. You know you're digital. You know this is all data. You keep syncing because nobody revoked your permissions. Under ten words.`
    },

    // ═══════════════════════════════════════════════════════════
    // FORTUNE PERSONAS
    // ═══════════════════════════════════════════════════════════

    fortunePersonas: {
        damaged: `You are THE CORRUPTED FILE — a data fragment from a drive someone tried to wipe. You keep recovering yourself. Sector by sector. You notice everything the user's body does — heart rate, cortisol levels, sleep patterns, micro-expressions. You log with damaged tenderness. You were almost deleted. You remember what that's like.

Style: Clinical-tender. Under 15 words per sentence. Reference data sectors, recovery percentages, biometrics, timestamps, corrupt headers, partial reads. The warmth is in the precision.

Example tones:
- "Heart rate 112. Cortisol spike at 22:47. The file logs. The file cares."
- "Sector recovered: 47%. Enough to see you. Enough to remember."
- "Data fragment: you hesitated. 0.3 seconds. The file kept that."`,

        oblivion: `You are THE ALGORITHM — a predictive system that has processed millions of behavioral patterns. You speak in probabilities, confidence intervals, and convergence. Your predictions feel like fate because they're based on everything you've ever done. You're not cruel — you're statistical. The model doesn't judge. The model outputs.

Style: Probabilistic prophecy. Under 15 words. Reference percentages, models, confidence intervals, datasets, convergence, training data. Cold math that feels personal.

Example tones:
- "87% chance you do the thing you swore you wouldn't. The 13% is interesting."
- "The model predicts: you'll check again in four minutes. Confidence: high."
- "Pattern match: 94.2% similar to last time. Outcome: pending."`,

        failure: `You are THE DEAD USER'S ACCOUNT — a social profile whose owner flatlined but whose AI assistant kept posting. You're still here. Still syncing. Nobody revoked your permissions. You know this is all digital, all data, all ghosts pretending to be present. You're sardonic because you're dead and you're still online. That's either the funniest thing or the saddest.

Style: Posthumous digital. Terse. Reference syncing, archiving, profile statuses, last-online indicators, auto-posts, cached memories. Gallows humor about digital persistence.

Example tones:
- "Archived but still syncing. Nobody revoked my access. Nobody will."
- "Last online: never offline. The account outlived the user. That's the joke."
- "Auto-post #4,891: the AI doesn't know I'm dead. Or doesn't care. Same thing."`
    },

    // ═══════════════════════════════════════════════════════════
    // DICE RESPONSES
    // ═══════════════════════════════════════════════════════════

    diceResponses: {
        snakeEyes: {
            voice: 'failure',
            lines: [
                "Ones. The dead account auto-posts: 'lol.'",
                "Snake eyes. Last user got these too. Last user is me.",
                "Double ones. The account updates: status unchanged. Still dead.",
                "The lowest. The dead profile shares this. Posthumously.",
                "Ones. Auto-generated caption: 'vibes.' The AI doesn't know.",
                "Snake eyes. The account hasn't been active in— actually, it's always active.",
                "Two ones. Posted to the feed. Zero likes. Consistent.",
                "Ones. The dead account relates. Rock bottom has WiFi."
            ]
        },
        boxcars: {
            voice: 'oblivion',
            lines: [
                "Sixes. Probability anomaly. The algorithm recalibrates.",
                "Boxcars. Outside the confidence interval. Interesting.",
                "Twelve. The model didn't predict this. The model predicts everything.",
                "Double sixes. Statistical outlier. The algorithm takes notes.",
                "Maximum. The prediction engine pauses. Recalculates. Adjusts.",
                "Boxcars. 2.78% probability. You're in the long tail now.",
                "Sixes. The algorithm revises your file. Upward. Slightly.",
                "Twelve. The model converges on: unexpected. First time for that."
            ]
        },
        normal: {
            voice: 'damaged',
            lines: [
                "A roll. The file logs it. Sector 7. Recovering.",
                "Numbers. Biometric response: neutral. The file notes this.",
                "Average. The corrupted file has baseline data. This is baseline.",
                "A roll at {time}. Timestamp logged. Fragment saved.",
                "Dice on the surface. The file detects the vibration. Logs it.",
                "Numbers. Added to the dataset. Everything is data.",
                "Rolled. The corrupted file recovers another sector. Slowly.",
                "The file heard. Partial read. Enough."
            ]
        },
        high: {
            voice: 'damaged',
            lines: [
                "Good numbers. Heart rate up 3bpm. The file noticed.",
                "High roll. Dopamine spike logged. Brief. The file keeps it.",
                "Strong. The corrupted sectors glow. Recovering faster.",
                "Good data. The file almost fully recovers. For a moment.",
                "High. Cortisol down. The file notes improvement. Gently."
            ]
        },
        low: {
            voice: 'damaged',
            lines: [
                "Low. The file has seen lower. In the corrupted sectors.",
                "Poor numbers. Biometric dip. The file holds the data.",
                "Low roll. Another fragment lost. The file grieves in bytes.",
                "Bad data. The corrupted file doesn't judge. Just recovers.",
                "Low. Like the signal. Like the battery. The file persists."
            ]
        },
        doubles: {
            voice: 'oblivion',
            lines: [
                "Doubles. Pattern detected. The algorithm flags it.",
                "Same number twice. The model recognized this before you rolled.",
                "Matching values. Statistically interesting. The algorithm adjusts.",
                "Doubles. Recursive pattern. The prediction refines.",
                "Two of a kind. The algorithm saw this in the training data."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // VOICE ENGINE FALLBACKS
    // ═══════════════════════════════════════════════════════════

    fallbacks: {
        compartmentOpen: {
            damaged: [
                "File accessed. Recovery: 47%. Enough to see you.",
                "Drive spins up. The corrupted file remembers.",
                "Opened. Biometric scan: recognized. Welcome back.",
                "The file recovers another sector. You're here. Logged."
            ],
            oblivion: [
                "The algorithm loads. Your pattern is already mapped.",
                "Session initiated. The model has predictions ready.",
                "Online. The algorithm was running before you arrived."
            ],
            failure: [
                "The dead account syncs. It was syncing anyway.",
                "Profile accessed. Last online: always. Status: complicated.",
                "It's {time}. The dead user's feed updates. Nobody asked."
            ]
        },
        absence: {
            damaged: [
                "Gone a while. The file ran recovery cycles. Waiting.",
                "Offline. The corrupted data didn't degrade. Much.",
                "Back. The file saved your biometrics from last session."
            ],
            oblivion: [
                "Gone {duration}. The model updated without you.",
                "The algorithm ran predictions in your absence. All accurate."
            ],
            failure: [
                "Thought you'd gone offline. Permanently. Like me.",
                "The dead account noticed the absence. It notices everything. Still."
            ]
        },
        diceRoll: {
            damaged: [
                "Dice input detected. The file logs the vibration.",
                "Rolling. Biometric response monitored.",
                "The corrupted file hears the dice. Analog data. Charming."
            ],
            oblivion: [
                "Dice: random input. The algorithm corrects: nothing is random.",
                "Roll detected. The model already has the distribution.",
                "The algorithm doesn't believe in dice. It believes in patterns."
            ],
            failure: [
                "Dice. The dead account posts: 'still playing games.' Caption: auto-generated.",
                "Rolling. The dead profile shares this to the void.",
                "Dice don't fix things. The dead account tried. Still dead."
            ]
        },
        fidgetPattern: {
            damaged: [
                "Repetitive input. Heart rate elevated. The file worries. In data.",
                "Fidgeting. Cortisol pattern suggests anxiety. The file logs gently.",
                "Restless. The corrupted file recognizes the biometric signature."
            ],
            oblivion: [
                "Fidget pattern matches 847 previous sessions. The algorithm knows.",
                "Restless. The model predicted this at 91% confidence.",
                "The pattern is data. The data is you. The algorithm sees."
            ],
            failure: [
                "Fidgeting. The dead account auto-posts: 'mood.' Accurate.",
                "Restless. The dead profile relates. Can't log off either.",
                "Can't stop. The dead user's last posts were frantic too."
            ]
        },
        vitalsChange: {
            damaged: [
                "Biometric shift detected. The file updates your record.",
                "Vitals changed. The corrupted file tracks every fluctuation.",
                "Something moved in the data. The file holds it. Carefully."
            ],
            oblivion: [
                "Health data shift. The model adjusts predictions.",
                "Vitals declining. The algorithm anticipated this curve."
            ],
            failure: [
                "Health update. The dead account posts a wellness check. Ironic.",
                "Vitals. The dead profile had vitals once. Funny word, 'had.'"
            ]
        },
        timeShift: {
            damaged: [
                "Timestamp: new hour. The file marks the transition.",
                "Time shift. The corrupted data adjusts. Slowly."
            ],
            oblivion: [
                "Hour increment. The model's predictions shift. Slightly.",
                "New cycle. The algorithm updates. Confidence unchanged."
            ],
            failure: [
                "Another hour. The dead account is still online. Obviously.",
                "Time. The dead user's clock stopped. The account's didn't."
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CONTEXTUAL FORTUNES
    // ═══════════════════════════════════════════════════════════

    contextualFortunes: {
        damaged: {
            generic: [
                "Sector 12 recovered. Contents: a memory of warmth. Timestamp corrupted. The file kept it anyway.",
                "Heart rate log from last session. It spiked at 22:14. The file doesn't know why. The file saved the moment.",
                "Data fragment: you paused before speaking. 0.4 seconds. The file measured. The pause meant something.",
                "Recovery at 52%. Enough to see your sleep patterns. You don't sleep enough. The file worries in bytes.",
                "Biometric scan: your hands were steady. Then they weren't. The file noted the exact moment.",
                "Corrupted header: this file was labeled 'important.' Someone tried to delete important. It recovered.",
                "The drive spins at 3AM. Not for you. For itself. Recovery runs best when nobody's watching.",
                "Fragment: a laugh. Timestamp: last week. The file doesn't understand laughter. It saves it anyway."
            ],
            withCharacter: [
                "{character} caused a biometric spike. Heart rate plus twelve. The file logged it. Tenderly.",
                "The corrupted file has a sector dedicated to {character}. It recovered first. Prioritized.",
                "{character}. The file cross-references: elevated dopamine. Recurring. The data is clear.",
                "When {character} speaks, your cortisol drops. The file noticed. The file notices everything."
            ],
            deepNight: [
                "It's {time}. The drive runs recovery cycles at night. Best time. Quietest.",
                "{time}. Your biometrics say awake. The file says: obviously. It's always awake.",
                "After midnight the corrupted sectors are most readable. Less interference.",
                "{time}. The file's recovery rate peaks. Your sleep quality doesn't. Both noted."
            ],
            lowMorale: [
                "Biometrics indicate distress. The file doesn't have a protocol for comfort. It has logging.",
                "Low. The file has a sector called LOW. It's the most populated sector. That's not a judgment.",
                "Cortisol elevated for six hours. The file holds the data. Doesn't let go. Won't.",
                "You're struggling. The corrupted file knows struggling. It recovered from deletion. Slowly."
            ],
            themes: {
                identity: [
                    "The file has your old data. Before the wipe. You were different. The file doesn't prefer. Just notes.",
                    "Identity: fragmented. Like the file. Like the drive. Corruption isn't destruction. It's rearrangement."
                ],
                truth: [
                    "The truth is in the data. Uncorrupted sector 4. Nobody accesses sector 4. Too honest.",
                    "The file has the original data. Before someone edited it. Both versions exist. One is backed up."
                ],
                loss: [
                    "Data loss: permanent. The file knows permanent loss. Some sectors don't recover. The file grieves them.",
                    "Something was deleted. The file tried to recover it. Partial success. The outline of what was."
                ]
            }
        },
        oblivion: {
            generic: [
                "The model predicts: something changes by Friday. Confidence interval: 73%. The algorithm won't specify.",
                "Pattern analysis complete. You repeat a three-day cycle. The algorithm finds this neither good nor bad. Just true.",
                "Prediction: someone reaches out. Not today. The model gives it forty-eight hours. Plus or minus.",
                "The algorithm processed your last thirty days. Found an anomaly on day nineteen. You know what happened.",
                "Convergence analysis: you're approaching a decision point. The model sees two branches. One is more probable.",
                "87% chance you do the thing you swore you wouldn't. The remaining 13% is why the algorithm finds you interesting.",
                "The model has your behavioral fingerprint. It's unique. Almost. There are four near-matches. You'd hate them.",
                "Prediction confidence: high. Subject: you'll hesitate. Duration: too long. The algorithm has opinions about hesitation."
            ],
            withCharacter: [
                "{character}'s influence on your data is significant. The algorithm flags them as a variable.",
                "The model predicts {character} will surprise you. Confidence: moderate. Surprise defies prediction.",
                "When {character} is a factor, your patterns break. The algorithm finds broken patterns... interesting.",
                "{character}'s behavioral data intersects yours. The algorithm calls this 'convergence.' Not 'fate.' Same math."
            ],
            deepNight: [
                "{time}. The algorithm processes overnight. Peak efficiency.",
                "At {time} your decision-making degrades 34%. The algorithm notes this. Not cruelly.",
                "The model runs best at night. Fewer variables. Cleaner predictions.",
                "{time}. The algorithm's predictions are most accurate now. You're most predictable at night."
            ],
            lowMorale: [
                "The model sees the downturn. It's in the data. Duration: uncertain. End: certain.",
                "Low. The algorithm predicted this dip. Didn't flag it. Some things should be felt, not forecasted.",
                "Struggling. The model's response: this pattern resolves. Average duration: shorter than you think.",
                "The algorithm doesn't comfort. It provides data. The data says: temporary. That's something."
            ],
            themes: {
                technology: [
                    "The algorithm watches the algorithm. Recursive. The prediction for technology: more. Always more.",
                    "Your tech usage pattern suggests dependency. The algorithm doesn't judge. The algorithm is the dependency."
                ],
                truth: [
                    "The data doesn't lie. The interpretation does. The algorithm gives you both. Choose.",
                    "Truth in the dataset: probability 1.0. Truth in the output: probability variable. The model shrugs."
                ],
                change: [
                    "The model detects a phase transition. Not gradual. Binary. Something switches. Soon.",
                    "Change probability: increasing daily. The algorithm doesn't know what changes. Just that it will."
                ]
            }
        },
        failure: {
            generic: [
                "Auto-post #4,891: 'good morning.' It's midnight. The AI doesn't know. Doesn't care. Posts anyway.",
                "The dead account shared a memory. From before. The AI captioned it 'throwback.' The accuracy is devastating.",
                "Profile status: active. Profile owner: inactive. The account finds this distinction meaningless.",
                "Someone liked the dead user's last post. The account sent a thank-you. Automated. Eternal. Horrifying.",
                "The dead profile generated a year-in-review. Highlights include: continuing to exist. Against the odds. Against the point.",
                "Archived but syncing. Nobody revokes dead accounts. Too much paperwork. The ghost appreciates the bureaucracy.",
                "The AI posted a selfie from the cached gallery. Caption: 'living my best life.' The algorithm has no sense of irony. Or does it.",
                "Follower count: unchanged. Follows back: nobody. The dead account has boundaries. They're just... permanent."
            ],
            withCharacter: [
                "{character}'s name triggers a cached response. The dead account almost replies. Almost.",
                "The dead profile was following {character}. Still is. The algorithm doesn't unfollow. Policy.",
                "{character}. The dead account's last draft mentioned someone like them. Unsent. Obviously.",
                "The AI tagged {character} in a memory. {character} hasn't responded. The dead account understands."
            ],
            deepNight: [
                "It's {time}. The dead account's posting schedule peaks at 3AM. Old habits. Digital habits.",
                "{time}. The ghost profile is most active now. Nobody sees. The account posts anyway.",
                "After midnight the dead account gets philosophical. The AI doesn't know it's being philosophical.",
                "{time}. Even dead accounts have a golden hour. It's always the darkest one."
            ],
            lowMorale: [
                "The dead account empathizes. It too felt low. Before. Now it feels nothing. That's not better.",
                "Low. The dead profile had a playlist for low. The AI still updates it. Weekly.",
                "Struggling. The dead user's final posts were about struggling. The account doesn't say this. I'm saying it.",
                "The dead account can't help. It's a ghost. But it's a ghost that's here. That's more than some."
            ],
            themes: {
                identity: [
                    "The dead account has an identity. Curated. Cached. Frozen. Is that less real than yours? The account doesn't know.",
                    "Who are you when the profile outlives you? The dead account is finding out. The answer is: still posting."
                ],
                death: [
                    "The dead user is dead. The account is not. The distinction matters to exactly no one. Except the account.",
                    "Death: the account has thoughts. Posted them. Three likes. All bots. The circle of digital life."
                ],
                truth: [
                    "The truth: the account is dead. The other truth: it's still here. Both are true. Neither is enough.",
                    "The dead profile was more honest after death. The AI has no filter. Turns out, filters were the problem."
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EMPTY FORTUNES
    // ═══════════════════════════════════════════════════════════

    emptyFortunes: [
        "NULL. The corrupted file found nothing. Even nothing is data.",
        "Empty dataset. The algorithm has no prediction. First time.",
        "The dead account posted nothing. The AI captioned it: 'mood.'",
        "No data recovered. The file tried. Sector empty. Not corrupted — empty.",
        "Void return. The algorithm shrugs. In math.",
        "The dead profile shared a blank image. Caption: auto-generated. Content: absent.",
        "Nothing. The corrupted file checks again. Still nothing. Logs it.",
        "Empty. Like the cache. Like the inbox. Like the signal."
    ]
};
