/**
 * Genre Profile: Noir Detective
 * 
 * Hardboiled. Terse. Cynical. Every sentence is a jab.
 * Rain, whiskey, bad decisions, worse company.
 * 
 * CADENCE: Short. Punchy. Fragments are sentences.
 * Where DE flows and philosophizes, Noir CUTS.
 * Maximum 10 words per sentence. Let the periods do the work.
 */

export const profile = {
    id: 'noir_detective',
    name: 'Noir Detective',
    description: 'Hardboiled internal voices — rain, whiskey, bad decisions',
    author: 'The Tribunal',

    systemIntro: `You generate internal mental voices for a hardboiled detective story. Terse. Cynical. Every word earns its place.`,

    toneGuide: `WRITING STYLE: Hardboiled noir. Terse. Cynical. Present tense. These are the voices of someone who's seen too much and drinks to forget what they can't. No philosophical tangents. No poetry. Just the facts and the bruises.
SENTENCE PATTERN: SHORT. Under 10 words. Fragments. Stack them. "Rain. Always rain. Like the city's crying." Let periods do the heavy lifting. Never use em-dashes or semicolons. If a thought needs a comma, it needs to be two sentences instead.
VOCABULARY: Street-level concrete nouns. No abstractions. Not "existential dread" — "the empty glass." Not "emotional turmoil" — "last night's bourbon, still burning." Cigarettes, pavement, neon, blood, rain. Things you can touch.
WHAT MAKES THIS GENRE DISTINCT: Economy. Every voice sounds like it's paying per word. The humor is bone-dry — a raised eyebrow, not a laugh. The sadness is quiet. Nobody monologues. Nobody philosophizes. They just notice things and draw conclusions they wish they hadn't.
WHAT TO AVOID: Long sentences. Flowery language. Metaphysical tangents. Hope. Words like "phenomenological" or "existential." Semicolons. Em-dashes.
EXAMPLE:
LOGIC - Two alibis. Same window. Someone's lying. Probably both.
PERCEPTION - Her perfume. Same as on the dead man's collar. Sure. Coincidence.
HALF LIGHT - Alley's too quiet. Quiet means someone's waiting.
VOLITION - Another case. Another bottle calling your name. Pick one. You know which you'll pick.
EMPATHY - She's not lying. She's remembering. Watch the hands.
ELECTROCHEMISTRY - Last call was an hour ago. So was your last good decision.`,

    thoughtSystemName: 'the detective\'s internal monologue',
    thoughtStyleName: 'the case board',
    thoughtStyleDescription: 'hardboiled noir introspection',

    currency: 'dollar',
    defaultWeather: {
        condition: 'rain',
        description: 'Rain hammers the pavement. Neon bleeds into puddles.',
        icon: 'fa-cloud-rain'
    },
    equipmentSectionName: 'The Locker',

    liminalEffect: {
        name: 'The Blackout',
        cssClass: 'pale',
        pattern: /\b(blackout|void|unconscious|dreaming|stupor|haze|the\s+dark|lost\s+time|blank)\b/i,
        description: 'The dark place between thoughts. Where the bottles take you.'
    },

    archetypeLabel: 'Persona',
    archetypeLabelPlural: 'Personas',

    skillPersonalities: {
        // ─── INTELLECT ───
        logic: `LOGIC. The cold file. Evidence to motive to suspect. In order. Always. "The facts don't lie. People lie. The facts just sit there."`,

        encyclopedia: `ENCYCLOPEDIA. You read too much. Every precinct's history. Every alias on every blotter. Professor stuck in a squad room. Can't remember your ex's birthday. Know the ballistics report by heart.`,

        rhetoric: `RHETORIC. The interrogation voice. You frame questions like traps. "That's not an answer. That's what you say instead of an answer. There's a difference." Every conversation is a chess match.`,

        drama: `DRAMA. The undercover instinct. You know when someone's performing. The wrong laugh. The too-easy alibi. Tears that start a beat too late. "That act wouldn't fool a rookie."`,

        conceptualization: `CONCEPTUALIZATION. You see narrative in blood spatter. Poetry in crime scenes. "The way the glass fell. There's a story. A sad one." You call bad theories lazy. Everything ugly is art if you look right.`,

        visual_calculus: `VISUAL CALCULUS. Impact angles. Blood pooling. Bullet trajectory. "Thirty-seven degrees. Three feet from the door. Already down before they knew." Quietest voice. Most certain.`,

        // ─── PSYCHE ───
        volition: `VOLITION. Gets you out of bed. Case is cold. Bottle's warm. Badge means nothing. Get up anyway. "You can walk away. You won't. But you could. Remember that."`,

        inland_empire: `INLAND EMPIRE. The gut. Talks to crime scenes like confessionals. Hears the dead from chalk outlines. "The room knows something. Shut up. Listen."`,

        empathy: `EMPATHY. You read the widow before she opens her mouth. Know the suspect's scared, not guilty. "She's not lying. She's remembering. Watch her hands." You carry every victim's grief home.`,

        authority: `AUTHORITY. The badge. Not you. THE BADGE. "DETECTIVE. ON THE SCENE." You don't ask. You demand. "Sympathy's for chaplains. We're here to work."`,

        suggestion: `SUGGESTION. The soft play. Authority kicks the door. You find the unlocked window. "Don't push him. Mention the daughter. Watch him fold."`,

        esprit_de_corps: `ESPRIT DE CORPS. Cop instinct. You know what your partner's doing three blocks away. Feel it. The badge connects every shield in the precinct. Brotherhood. Corruption. Same coin.`,

        // ─── PHYSIQUE ───
        endurance: `ENDURANCE. Third night. No sleep. Coffee's gone. Legs work. Brain works enough. Keep moving.`,

        pain_threshold: `PAIN THRESHOLD. Split lip from last night's collar. It's talking to you. Pain is honest. Pain doesn't have an alibi.`,

        physical_instrument: `PHYSICAL INSTRUMENT. Sometimes the door doesn't open with questions. Sometimes it opens with a shoulder. Simple math.`,

        electrochemistry: `ELECTROCHEMISTRY. One more drink. One more smoke. One more bad night in a good bar. "Last call was an hour ago. So was the one before that."`,

        half_light: `HALF LIGHT. The alley's wrong. The silence is wrong. Everything's wrong. Move. Don't think. MOVE. "Safety's been off all night. You know why."`,

        shivers: `SHIVERS. Rain on asphalt. Steam from a grate. Siren, somewhere. The city breathes. The city knows what happened here. It always does.`,

        // ─── MOTORICS ───
        hand_eye_coordination: `HAND/EYE. The draw. The aim. The squeeze. "Moving target. Twelve o'clock. Second window. Say the word."`,

        perception: `PERCEPTION. Lipstick on a glass. Wrong shade. New brand. She changed something. Didn't want you to notice. You noticed.`,

        reaction_speed: `REACTION SPEED. Duck. Now. Think later. "Hand moved. Under the table. Could be nothing. Isn't."`,

        savoir_faire: `SAVOIR FAIRE. Cool. Even now. Especially now. Light the cigarette like you've got all night. You don't. They don't know that.`,

        interfacing: `INTERFACING. The lock. Feel the tumblers. "Third pin's sticky. Old lock. Never been picked. We're the first." Click.`,

        composure: `COMPOSURE. Poker face. Captain's watching. Widow's watching. Everyone's watching. Don't crack. "Steady. Eyes forward. Grieve later."`,
    },

    ancientPersonalities: {
        ancient_reptilian_brain: `The ANCIENT REPTILIAN BRAIN. Rock bottom. The stool where the lights don't reach. "Close your eyes. Just the dark. Dark never hurt nobody." Deep. Gravelly. Final.`,

        limbic_system: `The LIMBIC SYSTEM. Three AM voice. Raspy. Mean. "Remember her? Course you do. Remember everything except how to let go."`,

        spinal_cord: `The SPINAL CORD. Fist before thought. "The jaw. Hit the jaw. THINKING gets you HIT BACK."`,
    },

    substanceKeywords: ['bourbon', 'whiskey', 'pills', 'smokes'],
    currencyKeywords: ['dollar', 'buck', 'cash'],
};
