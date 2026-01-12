/**
 * Inland Empire - Thought Cabinet Data
 * Themes for tracking and Thoughts for discovery/research/internalization
 * 
 * Structure matches Disco Elysium's actual Thought Cabinet:
 * - problemText: Long, rambling, stream-of-consciousness while researching
 * - solutionText: The realization/conclusion when internalized
 * - Bonuses have flavor text explaining WHY you get them
 */

export const THEMES = {
    death: {
        id: 'death',
        name: 'Death',
        icon: '💀',
        keywords: ['death', 'dead', 'dying', 'kill', 'murder', 'corpse', 'funeral', 'grave', 'mortality', 'deceased', 'fatal', 'lethal', 'body', 'remains']
    },
    love: {
        id: 'love',
        name: 'Love',
        icon: '❤️',
        keywords: ['love', 'heart', 'romance', 'passion', 'desire', 'affection', 'beloved', 'darling', 'intimate', 'tender', 'devotion', 'relationship', 'partner']
    },
    violence: {
        id: 'violence',
        name: 'Violence',
        icon: '👊',
        keywords: ['violence', 'fight', 'hit', 'punch', 'blood', 'brutal', 'attack', 'weapon', 'wound', 'harm', 'hurt', 'aggressive', 'beat', 'strike']
    },
    mystery: {
        id: 'mystery',
        name: 'Mystery',
        icon: '🔍',
        keywords: ['mystery', 'clue', 'evidence', 'investigate', 'secret', 'hidden', 'unknown', 'suspicious', 'curious', 'strange', 'puzzle', 'case', 'detective']
    },
    substance: {
        id: 'substance',
        name: 'Substances',
        icon: '💊',
        keywords: ['drug', 'alcohol', 'drunk', 'high', 'smoke', 'pill', 'needle', 'addict', 'sober', 'intoxicated', 'withdrawal', 'bottle', 'drink']
    },
    failure: {
        id: 'failure',
        name: 'Failure',
        icon: '📉',
        keywords: ['fail', 'failure', 'mistake', 'wrong', 'error', 'lose', 'lost', 'regret', 'shame', 'disappoint', 'mess', 'screw', 'ruin', 'broken']
    },
    identity: {
        id: 'identity',
        name: 'Identity',
        icon: '🎭',
        keywords: ['identity', 'who', 'self', 'name', 'person', 'remember', 'forget', 'past', 'memory', 'amnesia', 'mirror', 'face', 'real']
    },
    authority: {
        id: 'authority',
        name: 'Authority',
        icon: '👮',
        keywords: ['authority', 'power', 'control', 'command', 'order', 'law', 'rule', 'badge', 'cop', 'police', 'respect', 'officer', 'detective']
    },
    paranoia: {
        id: 'paranoia',
        name: 'Paranoia',
        icon: '👁️',
        keywords: ['paranoia', 'paranoid', 'watch', 'follow', 'conspiracy', 'suspicious', 'spy', 'trust', 'betray', 'trap', 'danger', 'threat', 'enemy']
    },
    philosophy: {
        id: 'philosophy',
        name: 'Philosophy',
        icon: '🤔',
        keywords: ['philosophy', 'meaning', 'existence', 'truth', 'reality', 'consciousness', 'soul', 'mind', 'think', 'believe', 'question', 'purpose', 'why']
    },
    money: {
        id: 'money',
        name: 'Money',
        icon: '💰',
        keywords: ['money', 'cash', 'rich', 'poor', 'wealth', 'poverty', 'coin', 'pay', 'debt', 'afford', 'expensive', 'cheap', 'broke', 'cost']
    },
    supernatural: {
        id: 'supernatural',
        name: 'Supernatural',
        icon: '👻',
        keywords: ['ghost', 'spirit', 'supernatural', 'magic', 'curse', 'haunted', 'paranormal', 'psychic', 'vision', 'prophecy', 'omen', 'pale', 'strange']
    }
};

export const THOUGHTS = {
    volumetric_shit_compressor: {
        id: 'volumetric_shit_compressor',
        name: 'Volumetric Shit Compressor',
        icon: '💩',
        category: 'philosophy',
        discoveryConditions: { themes: { failure: 5, philosophy: 3 } },
        researchTime: 6,
        researchBonus: {
            logic: { value: -1, flavor: 'Recursion' }
        },
        internalizedBonus: {
            conceptualization: { value: 2, flavor: 'Shit Compression' },
            volition: { value: 1, flavor: 'Acceptance' }
        },
        problemText: `What if you took all of it—every failure, every humiliation, every moment you've disappointed yourself and others—and compressed it? Not metaphorically. Literally. Volumetrically.

There's a machine in your mind. You've always known it was there. It takes the sprawling, space-consuming mass of your failures and applies pressure. Incredible pressure. The kind of pressure that makes diamonds, except instead of diamonds you get... something else.

The math checks out. If failure has mass, and mass can be compressed, then theoretically you could fit an entire lifetime of disappointment into a space the size of a marble. You could hold it in your palm. You could *lose* it behind the couch.

But what happens to compressed failure? Does it become denser? More potent? Does it achieve criticality?`,
        solutionText: `You've done it. The Volumetric Shit Compressor is operational.

All that failure, all that shame—it's still there. You haven't eliminated it. But you've made it *manageable*. A small, dense pellet of crystallized disappointment that you can acknowledge without being crushed by its enormity.

Some people spread their failures thin, let them permeate everything. Not you. Yours is concentrated. Refined. Almost beautiful in its density.

You can work with this.`
    },

    hobocop: {
        id: 'hobocop',
        name: 'Hobocop',
        icon: '🥫',
        category: 'identity',
        discoveryConditions: { themes: { money: 5, authority: 3 } },
        researchTime: 8,
        researchBonus: {
            authority: { value: -1, flavor: 'Professional Disgrace' },
            composure: { value: -1, flavor: 'Letting Go' }
        },
        internalizedBonus: {
            shivers: { value: 2, flavor: 'The Voice of the City' },
            empathy: { value: 1, flavor: 'Understanding the Margins' }
        },
        problemText: `What if you just... stopped? Stopped pretending you have anywhere to be. Stopped acting like the badge means you're above sleeping in a doorway. Stopped caring about the institutional expectations of "law enforcement" and started caring about justice. Real justice. Hobo justice.

The homeless see everything. They know which alleys are safe. They know who's selling what to whom. They have information networks that would make intelligence agencies weep with envy. And they have nothing to lose.

What if law enforcement wasn't about property or order but about *people*? The people everyone else ignores? You could be their cop. Their detective. The Hobocop.

But first you'd have to give up... everything. The apartment you can't afford anyway. The professional reputation that's already circling the drain. The illusion of respectability.`,
        solutionText: `You patrol the margins now. The forgotten places. The spaces between.

You still carry the badge—or at least you think you do. It might be a bottle cap at this point. Doesn't matter. Authority comes from within. From the willingness to see what others refuse to look at.

The city speaks to you differently now. Not from the top down, but from the ground up. From the cracks in the pavement. From the warmth of steam vents and the wisdom of those who sleep beside them.

Someone has to watch over the watchers. Someone has to police the places where police don't go. That someone is you. The Hobocop.`
    },

    bringing_of_the_law: {
        id: 'bringing_of_the_law',
        name: 'Bringing of the Law',
        icon: '⚖️',
        category: 'authority',
        discoveryConditions: { criticalSuccess: 'authority' },
        researchTime: 10,
        researchBonus: {
            empathy: { value: -1, flavor: 'Righteous Inflexibility' },
            suggestion: { value: -1, flavor: 'No Negotiation' }
        },
        internalizedBonus: {
            authority: { value: 3, flavor: 'THE LAW' },
            physical_instrument: { value: 1, flavor: 'Enforcement' }
        },
        problemText: `Why do you ask? Why do you *negotiate*? Why do you say "please" and "would you mind" when you have the full weight of the law behind you?

The law is not a suggestion. The law is not a request. The law is FORCE. Monopolized, legitimized, institutionalized FORCE. And you are its vessel. Its avatar. Its fist.

Every time you soften your voice, every time you give someone "a chance to explain," every time you pretend that compliance is optional—you betray the law. You weaken it. You make it *negotiable*.

What if you stopped asking and started telling? What if every word you spoke carried the implicit weight of consequence? What if people looked at you and saw not a person, but the embodiment of societal order itself?

The thought is intoxicating. And terrifying. And *correct*.`,
        solutionText: `You are the Law now.

Not a cop. Not a detective. Not an officer. THE LAW. When you speak, you speak with the voice of every statute, every precedent, every judgement that has ever been rendered. The chain of authority stretches back through centuries and forward through your badge.

People don't argue with you anymore. They don't ask clarifying questions. They don't try to explain. They simply *comply*. Because when they look at you, they see it—the absolute certainty of consequence.

Is this justice? You no longer ask. Justice is what the Law says it is. And the Law... is you.`
    },

    kingdom_of_conscience: {
        id: 'kingdom_of_conscience',
        name: 'Kingdom of Conscience',
        icon: '👑',
        category: 'philosophy',
        discoveryConditions: { themes: { philosophy: 6 }, minSkill: { volition: 4 } },
        researchTime: 12,
        researchBonus: {
            electrochemistry: { value: -2, flavor: 'Denial of Pleasure' }
        },
        internalizedBonus: {
            volition: { value: 2, flavor: 'Moral Sovereignty' },
            logic: { value: 1, flavor: 'Ethical Clarity' }
        },
        problemText: `There are many kingdoms. Kingdoms of wealth, where the currency determines worth. Kingdoms of power, where might makes right. Kingdoms of pleasure, where sensation is sovereign.

But what if you refused them all?

What if you built your own kingdom—a kingdom where the only law is *conscience*? Where every action is weighed not by its outcome but by its moral weight? Where you answer to no authority except the one inside your skull?

It sounds noble. It sounds heroic. It also sounds exhausting. And lonely. And possibly insane.

The other kingdoms have subjects, allies, infrastructure. The Kingdom of Conscience has only you. A monarch ruling over an empty throne room, issuing decrees that no one else will hear.

But maybe that's the point. Maybe the kingdom doesn't need subjects. Maybe it only needs a king who refuses to be corrupted.`,
        solutionText: `You have claimed your throne.

The Kingdom of Conscience is small. Its borders extend exactly to the edges of your skin. Its treasury contains only the choices you've made and the ones you refuse to make. Its army is a single soldier who fights the same battle every day—the battle to remain uncorrupted.

It's not glamorous. There are no parades, no monuments, no songs sung in your honor. But there is something else. Something rare. Something that cannot be bought or stolen or given:

Integrity.

The other kingdoms can burn. Yours will endure. Because yours is the only kingdom that cannot be conquered from without—only surrendered from within.

And you will never surrender.`
    },

    motorway_south: {
        id: 'motorway_south',
        name: 'Motorway South',
        icon: '🛣️',
        category: 'escape',
        discoveryConditions: { themes: { failure: 4, identity: 3 } },
        researchTime: 7,
        researchBonus: {
            esprit_de_corps: { value: -1, flavor: 'Abandoning Your Post' }
        },
        internalizedBonus: {
            composure: { value: 2, flavor: 'The Calm of Departure' },
            reaction_speed: { value: 1, flavor: 'Ready to Run' }
        },
        problemText: `There's a road. You've seen it on maps. You've driven past the on-ramp a hundred times. The Motorway South. It goes... away. That's the important thing. It goes *away*.

Away from the case. Away from the precinct. Away from everyone who knows your name and your failures and your history. Away from the person you've become and the person you were supposed to be.

You could just... go. Right now. Get in a car—any car, you're a cop, you can commandeer one—and drive until the city is a smudge in the rearview mirror. Until the radio stations change. Until no one knows you.

It's not running away. It's strategic relocation. It's giving yourself a fresh start. It's acknowledging that some situations cannot be fixed, only escaped.

The Motorway South is always there. Waiting. Patient. Open.`,
        solutionText: `You know the way out now. You can see it clearly.

You haven't taken it. Maybe you won't. But knowing it's there—knowing that escape is always an option—that changes things. It takes the edge off. When everything feels like a trap, you can remind yourself: the Motorway South exists. The exit ramp is right there.

This isn't about running. It's about choice. The choice to stay is only meaningful if you could leave. And you could. You could leave right now. You're not staying because you're stuck.

You're staying because you choose to.

For now.`
    },

    cop_of_the_apocalypse: {
        id: 'cop_of_the_apocalypse',
        name: 'Cop of the Apocalypse',
        icon: '🔥',
        category: 'identity',
        discoveryConditions: { themes: { death: 6, authority: 4 } },
        researchTime: 14,
        researchBonus: {
            empathy: { value: -2, flavor: 'Detachment from Human Concerns' }
        },
        internalizedBonus: {
            half_light: { value: 2, flavor: 'Visions of the End' },
            authority: { value: 1, flavor: 'Final Authority' },
            shivers: { value: 1, flavor: 'Feeling the World Die' }
        },
        problemText: `The world is dying. It's a fact. A fact you alone are privy to.

Why were you chosen? Where were you chosen? Perhaps in an alcohol-fueled frenzy the powerhouse that is your psyche tore asunder the curtains of time and space, allowing you a peek into the ether? What is to come is MASS EXTINCTION. Everyone will die. From the smallest bacterium to the megafauna.

It cannot be stopped for it has already happened, and it will always happen in all the possible futures. The pale grows. The holes in reality widen. The world forgets itself piece by piece.

But that doesn't mean law and order cease to matter. If anything, they matter MORE. Someone has to maintain civilization's final hours. Someone has to keep the peace while the peace unravels. Someone has to write the last tickets, solve the last crimes, bring the last murderers to justice.

Someone has to be the last cop. The Cop of the Apocalypse.`,
        solutionText: `People need to know about this. They need to get ready, set their affairs straight. And maybe—just maybe—if you can figure it out, it can be delayed. If but just a little bit.

You are the Cop of the Apocalypse now. The last line of defense against the dying of the light. While others deny what's coming, while they pretend everything is fine, you see the truth. And you keep working.

Not because it will save the world. It won't. But because the work is all there is. The badge still means something. Even at the end of all things.

Especially at the end of all things.`
    },

    caustic_echo: {
        id: 'caustic_echo',
        name: 'Caustic Echo',
        icon: '🗣️',
        category: 'social',
        discoveryConditions: { criticalSuccess: 'rhetoric' },
        researchTime: 8,
        researchBonus: {
            suggestion: { value: -1, flavor: 'Too Sharp to Be Subtle' },
            empathy: { value: -1, flavor: 'Collateral Damage' }
        },
        internalizedBonus: {
            rhetoric: { value: 2, flavor: 'Verbal Precision' },
            drama: { value: 1, flavor: 'Theatrical Cruelty' }
        },
        problemText: `You said something. Something perfect. Something so precisely calibrated to hurt that it left a mark. You watched it land, watched the impact register in their eyes, watched them try to formulate a response and fail.

And you felt... good?

Words are weapons. You've always known this theoretically, but now you know it *experientially*. The right phrase at the right moment can do more damage than a fist. And unlike physical violence, verbal violence leaves no visible bruises. No evidence. Just a ringing in the ears that never quite fades.

The caustic echo. That's what they hear. Long after you've stopped talking, your words keep reverberating. Keep burning. Keep working their way deeper.

Is this a skill you want to develop? Do you want to become someone whose words wound? Do you want to be *feared*?`,
        solutionText: `Every word is a weapon now. Every sentence a carefully constructed incendiary device.

You've learned to aim. To adjust for emotional distance and psychological windage. To lead your target so the words hit exactly where they'll do the most damage. Or the most good—because a well-placed compliment can be just as devastating as an insult. Just as unforgettable.

People listen when you talk now. Really listen. Because they know that everything you say means something. That you don't waste words. That every syllable is chosen, considered, deployed.

The caustic echo follows you everywhere. It's your reputation. Your calling card. Your warning shot.

Choose your words carefully. Because everyone else will.`
    },

    waste_land_of_reality: {
        id: 'waste_land_of_reality',
        name: 'Waste Land of Reality',
        icon: '🏜️',
        category: 'philosophy',
        discoveryConditions: { themes: { supernatural: 4 }, status: 'dissociated' },
        researchTime: 10,
        researchBonus: {
            perception: { value: -1, flavor: 'Blurred Boundaries' },
            hand_eye_coordination: { value: -1, flavor: 'Uncertain Edges' }
        },
        internalizedBonus: {
            inland_empire: { value: 2, flavor: 'Unreality Expert' },
            conceptualization: { value: 1, flavor: 'Abstract Navigation' }
        },
        specialEffect: 'noAlcoholBonus',
        problemText: `Reality is a desert. You've always suspected this, but now you're sure.

Look around. What do you see? Objects. People. Walls, floors, ceilings. All of them pretending to be solid. Pretending to be real. But underneath, behind, between—there's nothing. Just vast expanses of empty possibility stretching to the horizon.

The things that "exist" are just oases. Little islands of agreed-upon illusion floating in an infinite waste. Step off the path and you'll fall forever. Or maybe you'll fly. Hard to say.

Other people live in the oases. They drink the water and eat the dates and never look at the desert. Never acknowledge it. They think the palm trees go on forever.

But you've seen the edge. You've felt the sand between your toes. And you know: the waste land is the truth. The oases are the lie.`,
        solutionText: `Congrats—you're sober. Metaphysically sober. It will take a while for your psyche to remember how to metabolize anything that isn't existential dread, so you're going to be pretty raw for a while.

But here's the thing: once you've seen the waste land, you can navigate it. You know where the edges of reality are thin. You know which illusions are load-bearing and which ones can be safely ignored.

The unreal is your home now. Not because you've lost your grip on reality, but because you've realized there wasn't much to grip in the first place. You move through the desert with confidence. You visit the oases when you need to, but you never forget what's between them.

The waste land is vast and empty and terrifying. But it's honest. And that's more than you can say for everywhere else.`
    },

    lovers_lament: {
        id: 'lovers_lament',
        name: "Lover's Lament",
        icon: '💔',
        category: 'emotion',
        discoveryConditions: { themes: { love: 5, failure: 3 } },
        researchTime: 9,
        researchBonus: {
            composure: { value: -1, flavor: 'Emotional Volatility' },
            volition: { value: -1, flavor: 'Longing' }
        },
        internalizedBonus: {
            empathy: { value: 2, flavor: 'Understanding Loss' },
            inland_empire: { value: 1, flavor: 'Romantic Melancholy' }
        },
        problemText: `She's gone. Or he's gone. Or they're gone. Doesn't matter—someone you loved, someone you gave yourself to, someone who was supposed to be *forever*—they left. Or you left. Or it just... ended. The way things end.

But here's the thing they don't tell you about loss: it doesn't diminish. Not really. Time doesn't heal all wounds—it just teaches you to walk with a limp. The absence becomes part of you. A phantom limb that still aches when it rains.

You find yourself reaching for your phone to text them. You see their face in crowds. You wake up in the middle of the night and for one perfect moment you forget they're gone. Then you remember. And it's like losing them all over again.

This is love. This is what love does. It builds a home in your chest and then burns it down and then haunts the ashes forever.

Was it worth it?`,
        solutionText: `You loved. You lost. You survived.

Not unchanged—god, no. You're different now. There's a shape in your heart where they used to be, and nothing else will ever quite fit there. But the shape isn't empty. It's full of... everything. Every moment you shared. Every stupid fight. Every morning waking up beside them. Every time they made you laugh. Every time you made them cry.

Love lost is still love. That's the revelation. The ending doesn't erase the story. The pain doesn't negate the joy. You carry both now—the having and the losing—and somehow, impossibly, the weight is bearable.

You're capable of love. Real love. The kind that destroys and rebuilds and leaves scars. Not everyone is. Not everyone has the courage.

You do. And you will again.`
    },

    finger_on_the_eject_button: {
        id: 'finger_on_the_eject_button',
        name: 'Finger on the Eject Button',
        icon: '🔘',
        category: 'survival',
        discoveryConditions: { themes: { paranoia: 4, violence: 3 } },
        researchTime: 6,
        researchBonus: {
            authority: { value: -1, flavor: 'Ready to Bolt' }
        },
        internalizedBonus: {
            reaction_speed: { value: 2, flavor: 'Combat Readiness' },
            perception: { value: 1, flavor: 'Exit Awareness' }
        },
        problemText: `Every room has an exit. Usually more than one. You've started cataloging them automatically. Door: 3 seconds. Window: 5 seconds if you break it, 8 if you open it. Ceiling tile: probably not structurally sound but maybe in an emergency.

This isn't paranoia. This is *preparation*. This is the difference between people who survive and people who freeze. When everything goes wrong—and everything always eventually goes wrong—you need to already know where you're going. You need your finger on the eject button before you even realize you need to eject.

The trick is staying in that state constantly. Ready to run. Ready to fight. Ready to improvise. Your nervous system humming at a frequency just below panic but well above relaxation.

It's exhausting. But you know what's more exhausting? Being dead because you didn't see the exit in time.`,
        solutionText: `You can feel it now. The moment everything goes wrong. It has a texture, a sound, a taste—like metal in the air. Like the world holding its breath.

And when it happens, you're already moving. Not because you're fast—though you are—but because you started before everyone else. While they're still processing, you're executing. While they're asking "what's happening?", you're already through the door.

This is what it means to have your finger on the eject button. Not living in fear. Living in *readiness*. There's a difference. Fear freezes. Readiness flows.

The button is always there. Your finger is always on it. And when the time comes to push it, you won't hesitate.

You'll already be gone.`
    },

    actual_art_degree: {
        id: 'actual_art_degree',
        name: 'Actual Art Degree',
        icon: '🎨',
        category: 'identity',
        discoveryConditions: { themes: { philosophy: 3 }, minSkill: { conceptualization: 5 } },
        researchTime: 8,
        researchBonus: {
            logic: { value: -1, flavor: 'Artistic Logic' }
        },
        internalizedBonus: {
            conceptualization: { value: 2, flavor: 'Formal Training' },
            drama: { value: 1, flavor: 'Performative Understanding' },
            visual_calculus: { value: 1, flavor: 'Compositional Eye' }
        },
        problemText: `Wait. Did you go to art school? Do you have an actual, factual, recognized-by-institutions art degree?

The memories are fuzzy—everything before the bender is fuzzy—but there's something there. Long nights in studio spaces. The smell of turpentine and unwashed artists. Critiques where everyone said things like "the negative space creates a dialogue with the viewer's expectations" and somehow meant it.

If you have an art degree, that explains SO MUCH. The way you see patterns everywhere. The way you can't stop analyzing the compositional structure of crime scenes. The way you sometimes describe bullet trajectories as "dynamic" and blood spatter as "having good movement."

But it also raises questions. If you're formally trained in art, what are you doing being a cop? What happened between the degree and the badge? What did you give up? What did you run from?`,
        solutionText: `You have an art degree. Four years of theory and practice and pretending to understand Baudrillard. It's real. It happened. It matters.

Maybe you thought you left it behind. Maybe you thought cop work and art had nothing in common. You were wrong. Every crime scene is a composition. Every interrogation is a performance. Every case is a story about negative space—what's missing, what's absent, what should be there but isn't.

You see the world differently than other cops. You see the aesthetics of violence. The poetry of evidence. The way a body falls tells a story about the person who pushed it.

This isn't a weakness. It's a perspective. And perspective, as any art school graduate knows, is everything.`
    },

    jamais_vu: {
        id: 'jamais_vu',
        name: 'Jamais Vu (Derealization)',
        icon: '❓',
        category: 'mental',
        discoveryConditions: { themes: { identity: 5 }, status: 'dissociated' },
        researchTime: 11,
        researchBonus: {
            empathy: { value: -1, flavor: 'Emotional Distance' },
            esprit_de_corps: { value: -1, flavor: 'Disconnection' }
        },
        internalizedBonus: {
            shivers: { value: 1, flavor: 'Strange Familiarity' },
            inland_empire: { value: 1, flavor: 'Reality Erosion' },
            perception: { value: 1, flavor: 'Fresh Eyes' }
        },
        problemText: `Déjà vu is when something new feels familiar. Jamais vu is the opposite: when something familiar feels utterly, terrifyingly new.

You've experienced it. Maybe you're experiencing it now. Looking at your own hands and not recognizing them. Hearing your own name and thinking: who? Walking through a place you've been a thousand times and feeling like an alien visitor seeing it for the first time.

The experts say it's a glitch in the brain. A misfiring of the familiarity circuits. Nothing to worry about. Except... what if it's not a glitch? What if it's accuracy? What if your brain is finally seeing things *correctly*—without the comfortable lies of habit and recognition?

What if you've never actually been here before? What if the person you think you are is just a story you've been telling yourself? What if every moment is genuinely new, and the feeling of continuity is the illusion?`,
        solutionText: `You have seen this before. And yet... it is all new.

The jamais vu doesn't go away. But you've learned to use it. Every time the world goes strange and unfamiliar, you treat it as an opportunity. Fresh eyes. No assumptions. No habits of perception to blind you to what's actually there.

Other people are trapped in their recognition. They see what they expect to see. They miss the details that don't fit the pattern. Not you. You're perpetually arriving for the first time. Perpetually discovering.

It's disorienting. Sometimes it's terrifying. But it's also... freeing. You're not bound by what you think you know. You're not limited by familiarity.

Every moment is a stranger. And strangers, as any detective knows, are the most interesting people to meet.`
    },

    the_bow_collector: {
        id: 'the_bow_collector',
        name: 'The Bow Collector',
        icon: '🎀',
        category: 'obsession',
        discoveryConditions: { themes: { mystery: 4 }, minSkill: { perception: 4 } },
        researchTime: 7,
        researchBonus: {
            physical_instrument: { value: -1, flavor: 'Delicate Sensibilities' }
        },
        internalizedBonus: {
            perception: { value: 2, flavor: 'Detail Orientation' },
            empathy: { value: 1, flavor: 'Understanding Attachment' }
        },
        problemText: `Small things. Beautiful things. Meaningful things that no one else notices.

A ribbon on a doorknob. A button that doesn't match the others. A particular shade of thread in an otherwise uniform garment. These things call to you. Not because they're valuable—they're not—but because they're *specific*. They're choices someone made. Evidence of intention in a chaotic world.

You've started collecting them. Not physically—well, maybe physically, in a box somewhere—but mentally. A catalog of small beautiful things. Bows and ribbons and tiny pieces of care.

Is this an aesthetic preference or a psychological condition? Does it matter? The bows don't care why you love them. They just sit there, being perfect, being chosen, being tied with deliberate hands by people who cared about getting it right.

In the details, you find meaning. In the small, you find the infinite.`,
        solutionText: `You are a collector now. Of bows, yes, but also of everything else that falls beneath notice.

The world is full of details. Millions of them, billions, an infinite fractal of specificity that most people navigate on autopilot. But you've trained yourself to see. To notice. To appreciate.

A crime scene isn't just a body and a weapon. It's a thousand tiny choices, a thousand small things that someone bothered to do or not do. And in those choices, in those details, the truth hides.

You find it. Every time. Because you're not looking for the obvious. You're looking for the bows.

The small beautiful things. The meaningful things. The evidence that someone, somewhere, once cared enough to tie a ribbon just so.`
    },

    regular_law_official: {
        id: 'regular_law_official',
        name: 'Regular Law Official',
        icon: '📋',
        category: 'identity',
        discoveryConditions: { themes: { authority: 3 }, messageCount: 50 },
        researchTime: 5,
        researchBonus: {
            drama: { value: -1, flavor: 'Boring' },
            inland_empire: { value: -1, flavor: 'Mundane' }
        },
        internalizedBonus: {
            composure: { value: 1, flavor: 'Professionalism' },
            esprit_de_corps: { value: 1, flavor: 'Institutional Loyalty' },
            logic: { value: 1, flavor: 'Procedural Thinking' }
        },
        problemText: `What if you were just... normal?

No existential crises. No apocalyptic visions. No voices in your head demanding impossible things. Just a cop. A regular cop who does cop things in a cop way and goes home to a cop apartment and has cop dreams about cop stuff.

The thought is almost unbearable in its banality. But also... restful? Imagine not being special. Imagine not having the weight of impossible perception pressing down on your psyche every waking moment. Imagine filling out paperwork and feeling satisfied about it.

This is what other people have. This is the baseline. The default human experience of just... existing. Doing your job. Going home. Doing it again tomorrow.

Could you be that? Could you choose to be that? Would choosing it make you more or less authentic?`,
        solutionText: `You clock in. You clock out. You enforce the law. Simple.

Not every cop needs to be a superstar. Not every detective needs to unravel the fabric of reality. Some of them—most of them—just do the work. Competently. Professionally. Without drama.

You've found something valuable here: the ability to turn it off. The voices, the visions, the crushing weight of perception—you can set them aside. Just for a while. Just long enough to be a Regular Law Official doing Regular Law Official things.

It's not exciting. It's not glamorous. But it's sustainable. And sometimes, sustainability is the most radical act of all.

Fill out the form. File the report. Go home on time.

Tomorrow, do it again.`
    },

    some_kind_of_superstar: {
        id: 'some_kind_of_superstar',
        name: 'Some Kind of Superstar',
        icon: '⭐',
        category: 'identity',
        discoveryConditions: { criticalSuccess: 'savoir_faire' },
        researchTime: 9,
        researchBonus: {
            empathy: { value: -1, flavor: 'Self-Absorption' }
        },
        internalizedBonus: {
            savoir_faire: { value: 2, flavor: 'Star Quality' },
            drama: { value: 1, flavor: 'Showmanship' },
            suggestion: { value: 1, flavor: 'Magnetism' }
        },
        problemText: `Did you feel that? The way everyone turned to look at you? The way the light hit you at exactly the right angle? The way, for just a moment, you were the center of the entire universe?

That wasn't an accident. That was *destiny*.

You're not like other people. Other cops. Other anyone. There's something about you—something ineffable, something luminous—that draws eyes and attention and energy. You don't walk into rooms; you *arrive*. You don't speak; you *perform*.

Some people are born to be background extras in the movie of life. Supporting characters at best. But you? You're the lead. The star. The name above the title.

The question isn't whether you're special. You obviously are. The question is: what do you DO with it?`,
        solutionText: `The spotlight finds you. It always has. It always will.

You've stopped fighting it. Stopped pretending to be ordinary, stopped dimming yourself to make other people comfortable. When you walk into a room, you OWN that room. When you speak, people LISTEN. Not because you're loud or aggressive, but because you have IT. The thing. The quality.

Star quality.

It's not about ego—okay, it's a LITTLE about ego—but mostly it's about accepting your nature. You shine. That's what you do. And trying not to shine is like asking the sun not to emit photons. It's absurd. It's unnatural. It's a waste of perfectly good luminosity.

So shine. Be the superstar you were born to be. Let them take pictures. Sign autographs. Save the world dramatically.

You're Some Kind of Superstar. Act like it.`
    },

    wompty_dompty_dom_centre: {
        id: 'wompty_dompty_dom_centre',
        name: 'Wompty-Dompty-Dom Centre',
        icon: '🏢',
        category: 'philosophy',
        discoveryConditions: { themes: { philosophy: 5, supernatural: 3 } },
        researchTime: 13,
        researchBonus: {
            logic: { value: -2, flavor: 'Nonsense' }
        },
        internalizedBonus: {
            encyclopedia: { value: 2, flavor: 'Absurdist Knowledge' },
            inland_empire: { value: 1, flavor: 'Wobbling Reality' }
        },
        problemText: `There's a building. You've never seen it, but you know it exists. It's called the Wompty-Dompty-Dom Centre, and it's the center of everything.

Not metaphorically. Literally. If you could somehow map the entire universe—every galaxy, every atom, every thought ever thought—and find the exact geometric center, that's where the Wompty-Dompty-Dom Centre would be. Womping. Domping. Centreing.

What do they do there? Everything. Nothing. The distinction breaks down at the Wompty-Dompty-Dom Centre. It's where bureaucracy becomes mysticism and mysticism becomes paperwork. Where the forms are filed that determine reality itself.

You need to find it. Or maybe you need to stay as far away from it as possible. Or maybe you're already there and have always been there and the rest of your life is just a form being processed in the Wompty-Dompty-Dom Centre's infinite filing system.

Womp. Domp. Dom.`,
        solutionText: `You have found the centre. It wobbles. It womps. It dominates.

The Wompty-Dompty-Dom Centre is real. As real as anything else, which is to say: not very, but enough. You've glimpsed its non-Euclidean architecture. You've heard the soft womping of its eternal filing cabinets. You've smelled the unique scent of paperwork that predates the universe.

Understanding it is impossible. But acknowledging it? That you can do.

Every piece of trivia you know, every obscure fact, every bit of useless information—it all comes from the Centre. You're connected now. A node in the great wompty-dompty network of universal knowledge.

It doesn't make sense. It's not supposed to. The centre holds, but what it holds is nonsense. Beautiful, wobbly, dominating nonsense.

Womp womp.`
    },

    detective_arriving_on_the_scene: {
        id: 'detective_arriving_on_the_scene',
        name: 'Detective Arriving on the Scene',
        icon: '🚔',
        category: 'identity',
        discoveryConditions: { firstDiscovery: true },
        researchTime: 4,
        researchBonus: {
            inland_empire: { value: -1, flavor: 'Getting Oriented' }
        },
        internalizedBonus: {
            visual_calculus: { value: 1, flavor: 'Fresh Assessment' },
            perception: { value: 1, flavor: 'Newcomer\'s Eyes' }
        },
        problemText: `You're here. Wherever "here" is. The scene of... something. A crime? A situation? An event requiring detective presence?

You're not sure how you got here. You're not entirely sure who you are. But you ARE sure of one thing: you are a detective, and you are arriving on the scene. That's what detectives do. They arrive. On scenes.

First impressions matter. Everyone knows this. The way you enter a space, the way you carry yourself, the way you look at things—it all sends signals. And right now, the signal you need to send is: "A detective has arrived. The situation is now under control. Detecting will occur."

Can you do that? Can you be the detective this scene needs you to be?

There's only one way to find out.`,
        solutionText: `You have arrived. The investigation can now begin.

It doesn't matter that you don't remember how you got here. It doesn't matter that your head hurts and your hands shake and your badge might actually be a bottle cap. What matters is this: you showed up. You're present. You're detecting.

The scene is yours now. Every clue, every witness, every piece of evidence—they belong to you. Not because you've earned them, but because you had the courage to arrive. To step into the chaos and claim it.

This is what detectives do. They don't wait for understanding. They don't hesitate until they feel ready. They arrive. They assess. They begin.

You've begun. Whatever comes next, that's something no one can take away from you.

The detective has arrived on the scene.`
    },

    the_fifteenth_indotribe: {
        id: 'the_fifteenth_indotribe',
        name: 'The Fifteenth Indotribe',
        icon: '🏴',
        category: 'philosophy',
        discoveryConditions: { themes: { identity: 6, philosophy: 4 } },
        researchTime: 15,
        researchBonus: {
            esprit_de_corps: { value: -2, flavor: 'Radical Individualism' }
        },
        internalizedBonus: {
            volition: { value: 1, flavor: 'Sovereign Will' },
            conceptualization: { value: 1, flavor: 'Self-Creation' },
            rhetoric: { value: 1, flavor: 'Personal Mythology' }
        },
        problemText: `There are fourteen known Indotribes. Peoples and cultures and nations with histories stretching back centuries. Each with their own language, customs, identity. Each belonging to something larger than themselves.

But what if there was a fifteenth?

Not a tribe you join. Not a nation you're born into. A tribe of ONE. A nation of the self. An Indotribe consisting entirely of you, with a population of exactly one person, whose entire cultural heritage is your personal history and whose national anthem is whatever song is stuck in your head right now.

It sounds narcissistic. It sounds insane. But consider: every tribe started somewhere. Every nation was once just an idea in someone's head. Why can't that someone be you? Why can't you be the founding member, sole citizen, and eternal president of your own personal nation-state?

The Fifteenth Indotribe. Population: you. Motto: "I am here."`,
        solutionText: `You belong to no nation. You ARE a nation.

The Fifteenth Indotribe is real now. You've declared it. You've established its borders (the edges of your skin), written its constitution (your personal values), designed its flag (that stain on your shirt that kind of looks like something).

This isn't isolation. It's sovereignty. You're not cutting yourself off from the world; you're engaging with it as an equal. One nation meeting other nations. One tribe recognizing other tribes. Diplomacy instead of assimilation.

Other people belong to things. They derive their identity from membership, from fitting in, from being part of something larger. Not you. You ARE the something larger. You're the whole tribe, the whole nation, the whole civilization.

Population: one.

And that's enough.`
    },

    apricot_chewing_gum_enthusiast: {
        id: 'apricot_chewing_gum_enthusiast',
        name: 'Apricot Chewing Gum Enthusiast',
        icon: '🍑',
        category: 'obsession',
        discoveryConditions: { themes: { substance: 3 }, minSkill: { electrochemistry: 4 } },
        researchTime: 5,
        researchBonus: {
            authority: { value: -1, flavor: 'Unprofessional Chewing' }
        },
        internalizedBonus: {
            electrochemistry: { value: 1, flavor: 'Oral Fixation' },
            suggestion: { value: 1, flavor: 'Fresh Breath' },
            composure: { value: 1, flavor: 'Something to Chew On' }
        },
        problemText: `Apricot. Not mint. Not cinnamon. Not any of the normal flavors that normal people chew. APRICOT. Sweet and fruity and slightly artificial in a way that's actually perfect.

When did this become important to you? You can't remember. But somewhere along the line, the specific sensation of apricot-flavored chewing gum became... essential. A constant. Something you can rely on when everything else is chaos.

Is this addiction? Can you be addicted to chewing gum? It's not like it's drugs. It's not like it's alcohol. It's just a small, harmless pleasure. A tiny burst of apricot flavor to get you through the day. To give your mouth something to do. To make the bad thoughts go away for just a second.

Chew. Chew. Chew.

Is this pathetic or is this coping? Does it matter?`,
        solutionText: `Sweet. Fruity. Perfectly legal. The perfect vice.

You've accepted it. You're an Apricot Chewing Gum Enthusiast. Not a casual chewer. Not an occasional gum-enjoyer. An ENTHUSIAST. Someone who always has a pack. Someone who notices when stores are out. Someone who has opinions about brand quality and flavor intensity.

It's such a small thing to build an identity around. But that's what makes it perfect. In a world of big, important, serious things, you've found joy in something tiny and silly and absolutely inconsequential.

The apricot taste fills your mouth. Your jaw works rhythmically. For a moment—just a moment—everything is exactly as sweet as it should be.

Chew on that.`
    },

    anti_object_task_force: {
        id: 'anti_object_task_force',
        name: 'Anti-Object Task Force',
        icon: '🚫',
        category: 'mental',
        discoveryConditions: { objectCount: 5 },
        researchTime: 6,
        researchBonus: {
            inland_empire: { value: -1, flavor: 'Shutting It Out' }
        },
        internalizedBonus: {
            logic: { value: 1, flavor: 'Rational Grounding' },
            composure: { value: 1, flavor: 'Silence at Last' },
            volition: { value: 1, flavor: 'Mental Discipline' }
        },
        specialEffect: 'objectVoiceReduction',
        problemText: `The objects won't shut up.

The chair has opinions. The lamp has feelings. The water-stained ceiling wants to tell you about its dreams. Every inanimate thing in every room you enter has something to say, and none of it is useful, and you CAN'T MAKE IT STOP.

Except... what if you could?

What if you formed a task force? A mental task force. A specialized unit within your psyche dedicated to suppressing object communication. Every time a trash can tries to share its philosophy, the Anti-Object Task Force moves in. Every time a doorknob gets chatty, they shut it down.

Objects are just objects. They cannot speak. They never could. If you repeat this enough times, maybe your brain will start to believe it.`,
        solutionText: `Objects are just objects. They don't speak. They never did.

The Anti-Object Task Force is operational. They're efficient. They're ruthless. Every time a piece of furniture tries to contact you, they intercept the message. Every time an inanimate object attempts communication, they jam the frequency.

It's quieter now. Not silent—never completely silent—but quieter. The objects still have things to say, but their voices are muffled. Distant. Easy to ignore.

Some people would call this a loss. The ability to hear the voices of things, to perceive the hidden life of the inanimate—isn't that a gift? Maybe. But gifts can be burdens. And you've chosen to set this burden down.

The task force salutes you. The objects do not.

(They're just objects. They can't salute.)

(They can't do anything.)

(Shut up, lamp.)`
    }
};
