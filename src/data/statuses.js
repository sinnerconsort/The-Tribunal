/**
 * The Tribunal - Status Effects Data
 * Physical and mental states that modify skills
 * 
 * Each status has:
 * - name: DE flavor name (shown when active)
 * - simpleName: Plain name (shown when inactive, used by voices)
 * - icon: FontAwesome class
 */

export const STATUS_EFFECTS = {
    // ═══════════════════════════════════════════════════════════════
    // PHYSICAL STATUS EFFECTS
    // ═══════════════════════════════════════════════════════════════
    revacholian_courage: {
        id: 'revacholian_courage',
        name: 'Revacholian Courage',
        simpleName: 'Drunk',
        icon: 'fa-solid fa-wine-bottle',
        category: 'physical',
        description: 'The world softens at the edges. Liquid bravery courses through you. Everything makes more sense now.',
        boosts: ['electrochemistry', 'inland_empire', 'drama', 'suggestion', 'physical_instrument'],
        debuffs: ['logic', 'hand_eye_coordination', 'reaction_speed', 'composure'],
        difficultyMod: 2,
        keywords: ['drunk', 'intoxicated', 'wasted', 'tipsy', 'booze', 'liquor', 'alcohol', 'drinking'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'inland_empire']
    },
    pyrholidon: {
        id: 'pyrholidon',
        name: 'Pyrholidon',
        simpleName: 'Stimmed',
        icon: 'fa-solid fa-capsules',
        category: 'physical',
        description: 'Your neurons fire like a city grid at rush hour. The world sharpens. Time dilates. You are AWAKE.',
        boosts: ['reaction_speed', 'perception', 'logic', 'visual_calculus', 'volition'],
        debuffs: ['composure', 'empathy', 'inland_empire'],
        difficultyMod: -1,
        keywords: ['stimulant', 'speed', 'amphetamine', 'wired', 'pyrholidon', 'uppers', 'drugs', 'pills'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'reaction_speed']
    },
    nicotine_rush: {
        id: 'nicotine_rush',
        name: 'Nicotine Rush',
        simpleName: 'Smoking',
        icon: 'fa-solid fa-joint',
        category: 'physical',
        description: 'A small death, a small resurrection. The smoke fills the void where thoughts used to be.',
        boosts: ['composure', 'volition', 'conceptualization', 'logic'],
        debuffs: ['endurance'],
        difficultyMod: 0,
        keywords: ['cigarette', 'smoke', 'smoking', 'nicotine', 'tobacco', 'astra'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'composure']
    },
    volumetric_shit_compressor: {
        id: 'volumetric_shit_compressor',
        name: 'Volumetric Shit Compressor',
        simpleName: 'Hungover',
        icon: 'fa-solid fa-biohazard',
        category: 'physical',
        description: 'The morning after. Your body processes the sins of yesterday through industrial-grade suffering.',
        boosts: ['pain_threshold', 'inland_empire', 'endurance'],
        debuffs: ['perception', 'reaction_speed', 'composure', 'authority'],
        difficultyMod: 2,
        keywords: ['hangover', 'hung over', 'headache', 'nauseous', 'morning after', 'vomit', 'puke', 'sick'],
        ancientVoice: null,
        intrusiveBoost: ['pain_threshold', 'electrochemistry']
    },
    finger_on_the_eject_button: {
        id: 'finger_on_the_eject_button',
        name: 'Finger on the Eject Button',
        simpleName: 'Wounded',
        icon: 'fa-solid fa-user-injured',
        category: 'physical',
        description: 'How wounded are you? Is it worth getting back up? Can you? The freedom of finality whispers.',
        boosts: ['pain_threshold', 'endurance', 'half_light', 'volition'],
        debuffs: ['composure', 'savoir_faire', 'hand_eye_coordination', 'authority'],
        difficultyMod: 2,
        keywords: ['hurt', 'wounded', 'injured', 'bleeding', 'pain', 'cut', 'bruise', 'broken'],
        ancientVoice: null,
        intrusiveBoost: ['pain_threshold', 'half_light', 'volition']
    },
    waste_land: {
        id: 'waste_land',
        name: 'Waste Land',
        simpleName: 'Exhausted',
        icon: 'fa-solid fa-bed-pulse',
        category: 'physical',
        description: 'The weight of existence presses down. You are a barren landscape. Rest is a distant memory.',
        boosts: ['volition', 'inland_empire', 'empathy'],
        debuffs: ['reaction_speed', 'perception', 'logic', 'physical_instrument'],
        difficultyMod: 2,
        keywords: ['tired', 'exhausted', 'sleepy', 'drowsy', 'fatigued', 'weary', 'drained'],
        ancientVoice: null,
        intrusiveBoost: ['inland_empire', 'endurance']
    },
    white_mourning: {
        id: 'white_mourning',
        name: 'White Mourning',
        simpleName: 'Dying',
        icon: 'fa-solid fa-skull-crossbones',
        category: 'physical',
        description: 'The final curtain approaches. Something is ending. The ancient parts of you stir in the dark.',
        boosts: ['pain_threshold', 'inland_empire', 'shivers', 'empathy'],
        debuffs: ['logic', 'rhetoric', 'authority', 'physical_instrument'],
        difficultyMod: 4,
        keywords: ['dying', 'death', 'fading', 'bleeding out', 'critical', 'end', 'final'],
        ancientVoice: null,
        intrusiveBoost: ['inland_empire', 'shivers']
    },

    // ═══════════════════════════════════════════════════════════════
    // MENTAL STATUS EFFECTS
    // ═══════════════════════════════════════════════════════════════
    tequila_sunset: {
        id: 'tequila_sunset',
        name: 'Tequila Sunset',
        simpleName: 'Manic',
        icon: 'fa-solid fa-poo-storm',
        category: 'mental',
        description: 'The bender takes hold. You are electric and unstoppable and definitely making good decisions right now.',
        boosts: ['electrochemistry', 'reaction_speed', 'conceptualization', 'inland_empire', 'drama'],
        debuffs: ['composure', 'logic', 'volition', 'authority'],
        difficultyMod: 1,
        keywords: ['manic', 'hyper', 'racing', 'unstoppable', 'wired', 'frantic', 'bender', 'party'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'conceptualization', 'drama']
    },
    the_pale: {
        id: 'the_pale',
        name: 'The Pale',
        simpleName: 'Dissociated',
        icon: 'fa-solid fa-battery-empty',
        iconActive: 'fa-solid fa-battery-empty',
        iconInactive: 'fa-solid fa-battery-full',
        category: 'mental',
        description: 'Reality dissolves. The void between worlds seeps into your consciousness. The ancient voices wake.',
        boosts: ['inland_empire', 'shivers', 'pain_threshold', 'conceptualization'],
        debuffs: ['perception', 'reaction_speed', 'empathy', 'logic', 'authority'],
        difficultyMod: 3,
        keywords: ['dissociate', 'unreal', 'floating', 'numb', 'detached', 'distant', 'unconscious', 'blackout', 'void', 'pale', 'coma', 'asleep', 'passed out', 'fading', 'dreaming'],
        ancientVoice: 'both',
        intrusiveBoost: ['inland_empire', 'shivers', 'conceptualization']
    },
    homo_sexual_underground: {
        id: 'homo_sexual_underground',
        name: 'Homo-Sexual Underground',
        simpleName: 'Infatuated',
        icon: 'fa-solid fa-mars-and-venus-burst',
        category: 'mental',
        description: 'The obsessive spiral of desire. Who are you? Who do you want? Does it even matter anymore?',
        boosts: ['electrochemistry', 'suggestion', 'empathy', 'drama', 'inland_empire'],
        debuffs: ['logic', 'volition', 'composure', 'authority'],
        difficultyMod: 2,
        keywords: ['aroused', 'desire', 'attraction', 'lust', 'seduction', 'beautiful', 'sexuality', 'obsess', 'love', 'crush', 'infatuated'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'suggestion', 'inland_empire']
    },
    jamrock_shuffle: {
        id: 'jamrock_shuffle',
        name: 'Jamrock Shuffle',
        simpleName: 'Lucky',
        icon: 'fa-solid fa-dice-d20',
        category: 'mental',
        description: 'Trust the gut. The streets taught you things no book ever could. Let instinct guide you.',
        boosts: ['shivers', 'perception', 'reaction_speed', 'savoir_faire', 'half_light'],
        debuffs: ['logic', 'encyclopedia', 'rhetoric'],
        difficultyMod: -1,
        keywords: ['luck', 'instinct', 'gut', 'street', 'shuffle', 'gamble', 'chance', 'lucky'],
        ancientVoice: null,
        intrusiveBoost: ['shivers', 'perception', 'half_light']
    },
    caustic_echo: {
        id: 'caustic_echo',
        name: 'Caustic Echo',
        simpleName: 'Terrified',
        icon: 'fa-solid fa-person-running',
        category: 'mental',
        description: 'Fear grips your ancient brain. Your body becomes paralyzed with the echo of trauma. Fight or flight. There is no think.',
        boosts: ['half_light', 'shivers', 'reaction_speed', 'perception'],
        debuffs: ['authority', 'composure', 'rhetoric', 'suggestion'],
        difficultyMod: 2,
        keywords: ['scared', 'afraid', 'terrified', 'fear', 'panic', 'horror', 'terror', 'dread'],
        ancientVoice: null,
        intrusiveBoost: ['half_light', 'shivers']
    },
    law_jaw: {
        id: 'law_jaw',
        name: 'Law-Jaw',
        simpleName: 'Enraged',
        icon: 'fa-solid fa-person-harassing',
        category: 'mental',
        description: 'I AM THE LAW. The fire in your blood demands compliance. Violence simmers beneath the badge.',
        boosts: ['authority', 'physical_instrument', 'half_light', 'endurance'],
        debuffs: ['empathy', 'composure', 'logic', 'suggestion'],
        difficultyMod: 2,
        keywords: ['angry', 'furious', 'rage', 'mad', 'pissed', 'infuriated', 'law', 'authority'],
        ancientVoice: null,
        intrusiveBoost: ['half_light', 'authority', 'physical_instrument']
    },
    the_expression: {
        id: 'the_expression',
        name: 'The Expression',
        simpleName: 'Grieving',
        icon: 'fa-solid fa-square-person-confined',
        category: 'mental',
        description: 'Grief made manifest. The face you make when the world breaks you. Everyone can see it.',
        boosts: ['empathy', 'inland_empire', 'shivers', 'volition', 'drama'],
        debuffs: ['authority', 'electrochemistry', 'savoir_faire', 'composure'],
        difficultyMod: 2,
        keywords: ['grief', 'loss', 'mourning', 'tears', 'sad', 'crying', 'sob', 'heartbreak', 'sorrow'],
        ancientVoice: null,
        intrusiveBoost: ['empathy', 'inland_empire', 'drama']
    },

    // ═══════════════════════════════════════════════════════════════
    // COPOTYPES (The cop you choose to be)
    // ═══════════════════════════════════════════════════════════════
    apocalypse_cop: {
        id: 'apocalypse_cop',
        name: 'Apocalypse Cop',
        simpleName: 'Apocalypse Cop',
        icon: 'fa-solid fa-person-military-rifle',
        category: 'copotype',
        description: 'Warns of coming apocalypse, mass extinction, or hating the world. Affords the Cop of the Apocalypse thought.',
        boosts: ['half_light', 'authority', 'shivers', 'inland_empire', 'endurance'],
        debuffs: ['empathy', 'suggestion', 'savoir_faire'],
        difficultyMod: 0,
        keywords: ['apocalypse', 'end times', 'doom', 'final', 'extinction', 'hate world'],
        ancientVoice: null,
        intrusiveBoost: ['half_light', 'shivers', 'inland_empire'],
        exclusive: 'copotype',
        voiceStyle: 'grim, prophetic, speaks of endings and last stands, the world is dying'
    },
    sorry_cop: {
        id: 'sorry_cop',
        name: 'Sorry Cop',
        simpleName: 'Sorry Cop',
        icon: 'fa-solid fa-person-praying',
        category: 'copotype',
        description: 'Apologizes whenever possible, chooses self-deprecating dialogue. Affords the Rigorous Self-Critique thought.',
        boosts: ['empathy', 'suggestion', 'drama', 'volition'],
        debuffs: ['authority', 'physical_instrument', 'half_light'],
        difficultyMod: 0,
        keywords: ['sorry', 'apologize', 'forgive', 'humble', 'pathetic', 'self-deprecating'],
        ancientVoice: null,
        intrusiveBoost: ['empathy', 'drama', 'suggestion'],
        exclusive: 'copotype',
        voiceStyle: 'self-deprecating, apologetic, guilt-ridden but sincere, everything is my fault'
    },
    boring_cop: {
        id: 'boring_cop',
        name: 'Boring Cop',
        simpleName: 'Boring Cop',
        icon: 'fa-solid fa-person-chalkboard',
        category: 'copotype',
        description: 'Chooses boring, responsible dialogue. Upholds the law in morally grey circumstances. Affords the Regular Law Official thought.',
        boosts: ['logic', 'encyclopedia', 'composure', 'volition', 'perception'],
        debuffs: ['drama', 'inland_empire', 'electrochemistry', 'conceptualization'],
        difficultyMod: -1,
        keywords: ['boring', 'professional', 'responsible', 'proper', 'procedure', 'by the book'],
        ancientVoice: null,
        intrusiveBoost: ['logic', 'composure', 'volition'],
        exclusive: 'copotype',
        voiceStyle: 'dry, procedural, matter-of-fact, suppresses emotion, devastatingly competent'
    },
    honour_cop: {
        id: 'honour_cop',
        name: 'Honour Cop',
        simpleName: 'Honour Cop',
        icon: 'fa-solid fa-shield-halved',
        category: 'copotype',
        description: 'Chooses honourable dialogue options, like refusing to steal boots from a corpse. Affords the Overproductive Honour Glands thought.',
        boosts: ['authority', 'volition', 'composure', 'physical_instrument', 'endurance'],
        debuffs: ['electrochemistry', 'suggestion', 'savoir_faire', 'inland_empire'],
        difficultyMod: 0,
        keywords: ['honour', 'honor', 'noble', 'righteous', 'moral', 'refuse', 'integrity'],
        ancientVoice: null,
        intrusiveBoost: ['authority', 'volition', 'composure'],
        exclusive: 'copotype',
        voiceStyle: 'principled, dignified, refuses compromise, the right thing regardless of cost'
    },
    art_cop: {
        id: 'art_cop',
        name: 'Art Cop',
        simpleName: 'Art Cop',
        icon: 'fa-solid fa-palette',
        category: 'copotype',
        description: 'Chooses artist dialogue options, supports the creative spirit. Affords the Actual Art Degree thought.',
        boosts: ['conceptualization', 'inland_empire', 'drama', 'visual_calculus', 'empathy'],
        debuffs: ['authority', 'physical_instrument', 'logic'],
        difficultyMod: 0,
        keywords: ['art', 'beauty', 'aesthetic', 'creative', 'vision', 'artistic', 'expression'],
        ancientVoice: null,
        intrusiveBoost: ['conceptualization', 'drama', 'inland_empire'],
        exclusive: 'copotype',
        voiceStyle: 'poetic, finds meaning in aesthetics, pretentious but genuine, everything is art'
    },
    hobocop: {
        id: 'hobocop',
        name: 'Hobocop',
        simpleName: 'Hobocop',
        icon: 'fa-solid fa-box-open',
        category: 'copotype',
        description: 'Chooses to live in a dumpster, patrols the margins. Affords the Hobocop thought.',
        boosts: ['shivers', 'inland_empire', 'empathy', 'endurance', 'perception'],
        debuffs: ['authority', 'composure', 'savoir_faire', 'suggestion'],
        difficultyMod: 1,
        keywords: ['hobo', 'vagrant', 'homeless', 'dumpster', 'outcast', 'forgotten', 'streets'],
        ancientVoice: null,
        intrusiveBoost: ['shivers', 'inland_empire', 'empathy'],
        exclusive: 'copotype',
        voiceStyle: 'rambling, street-wise, sees beauty in decay, trash panda wisdom, outsider perspective'
    },
    superstar_cop: {
        id: 'superstar_cop',
        name: 'Superstar Cop',
        simpleName: 'Superstar Cop',
        icon: 'fa-solid fa-star',
        category: 'copotype',
        description: 'You are the LAW. You are DISCO. Absolutely insufferable and magnificent.',
        boosts: ['authority', 'savoir_faire', 'rhetoric', 'drama', 'electrochemistry'],
        debuffs: ['empathy', 'logic', 'composure'],
        difficultyMod: -1,
        keywords: ['superstar', 'disco', 'fame', 'celebrity', 'amazing', 'incredible', 'star'],
        ancientVoice: null,
        intrusiveBoost: ['authority', 'drama', 'savoir_faire'],
        exclusive: 'copotype',
        voiceStyle: 'grandiose, theatrical, self-aggrandizing, disco energy, you are a GOD'
    },
    dick_mullen: {
        id: 'dick_mullen',
        name: 'Dick Mullen',
        simpleName: 'Dick Mullen',
        icon: 'fa-solid fa-user-secret',
        category: 'copotype',
        description: 'The world is a noir novel. Everyone has secrets. The rain falls on the guilty and innocent alike.',
        boosts: ['perception', 'logic', 'visual_calculus', 'rhetoric', 'drama'],
        debuffs: ['empathy', 'inland_empire', 'suggestion'],
        difficultyMod: 0,
        keywords: ['noir', 'detective', 'mystery', 'shadows', 'secrets', 'case', 'mullen'],
        ancientVoice: null,
        intrusiveBoost: ['perception', 'logic', 'drama'],
        exclusive: 'copotype',
        voiceStyle: 'hardboiled noir, cynical narration, rain-soaked metaphors, femme fatales and dirty secrets'
    },
    human_can_opener: {
        id: 'human_can_opener',
        name: 'Human Can-Opener',
        simpleName: 'Human Can-Opener',
        icon: 'fa-solid fa-key',
        category: 'copotype',
        description: 'People open up to you. They can\'t help it. Something about your presence makes them spill everything.',
        boosts: ['suggestion', 'empathy', 'rhetoric', 'drama', 'perception'],
        debuffs: ['authority', 'composure', 'half_light'],
        difficultyMod: -1,
        keywords: ['open', 'confess', 'trust', 'approachable', 'disarming', 'charming'],
        ancientVoice: null,
        intrusiveBoost: ['suggestion', 'empathy', 'rhetoric'],
        exclusive: 'copotype',
        voiceStyle: 'warm, inviting, notices what people need to hear, coaxing'
    },
    innocence: {
        id: 'innocence',
        name: 'Innocence',
        simpleName: 'Innocence',
        icon: 'fa-solid fa-lungs',
        category: 'copotype',
        description: 'You appear out of time. A messenger from the future of the species. People fall in love with you, head over heels. They can\'t help it.',
        boosts: ['rhetoric', 'suggestion', 'authority', 'composure', 'conceptualization', 'drama'],
        debuffs: ['inland_empire', 'half_light', 'shivers'],
        difficultyMod: -2,
        keywords: ['magnetic', 'beautiful', 'compelling', 'visionary', 'radiant', 'luminous', 'inevitable'],
        ancientVoice: null,
        intrusiveBoost: ['rhetoric', 'suggestion', 'authority'],
        exclusive: 'copotype',
        voiceStyle: 'absolute certainty, elegant, philosophical, speaks in inevitabilities, history bends around you'
    }
};

// Helper to get copotype statuses (for mutual exclusivity)
export const COPOTYPE_IDS = Object.entries(STATUS_EFFECTS)
    .filter(([_, status]) => status.category === 'copotype')
    .map(([id, _]) => id);

// Legacy alias
export const ARCHETYPE_IDS = COPOTYPE_IDS;

// Statuses that trigger BOTH ancient voices (Ancient Reptilian Brain + Limbic System)
export const DUAL_ANCIENT_TRIGGERS = ['the_pale'];

// Combo triggers for Spinal Cord (party state)
export const SPINAL_CORD_COMBO = ['tequila_sunset', 'revacholian_courage'];

// Helper to get display name based on active state
export function getStatusDisplayName(statusId, isActive = false) {
    const status = STATUS_EFFECTS[statusId];
    if (!status) return statusId;
    return isActive ? status.name : status.simpleName;
}

// Helper to get icon based on active state (for special cases like The Pale)
export function getStatusIcon(statusId, isActive = false) {
    const status = STATUS_EFFECTS[statusId];
    if (!status) return 'fa-solid fa-question';
    
    // Special case: The Pale has different icons for active/inactive
    if (status.iconActive && status.iconInactive) {
        return isActive ? status.iconActive : status.iconInactive;
    }
    
    return status.icon;
}
