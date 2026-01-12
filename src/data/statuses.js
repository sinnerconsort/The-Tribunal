/**
 * Inland Empire - Status Effects Data
 * Physical and mental states that modify skills
 * Full Disco Elysium flavor
 */

export const STATUS_EFFECTS = {
    // ═══════════════════════════════════════════════════════════════
    // PHYSICAL STATUS EFFECTS
    // ═══════════════════════════════════════════════════════════════
    revacholian_courage: {
        id: 'revacholian_courage',
        name: 'Revacholian Courage',
        icon: '🍺',
        category: 'physical',
        description: 'The world softens at the edges. Liquid bravery courses through you. Everything makes more sense now.',
        boosts: ['electrochemistry', 'inland_empire', 'drama', 'suggestion', 'physical_instrument'],
        debuffs: ['logic', 'hand_eye_coordination', 'reaction_speed', 'composure'],
        difficultyMod: 2,
        keywords: ['drunk', 'intoxicated', 'wasted', 'high', 'tipsy', 'booze', 'liquor', 'alcohol', 'drinking'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'inland_empire']
    },
    pyrholidon: {
        id: 'pyrholidon',
        name: 'Pyrholidon',
        icon: '💊',
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
        icon: '🚬',
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
        icon: '🤢',
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
        icon: '🩸',
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
        icon: '😴',
        category: 'physical',
        description: 'The weight of existence presses down. You are a barren landscape. Rest is a distant memory.',
        boosts: ['volition', 'inland_empire', 'empathy'],
        debuffs: ['reaction_speed', 'perception', 'logic', 'physical_instrument'],
        difficultyMod: 2,
        keywords: ['tired', 'exhausted', 'sleepy', 'drowsy', 'fatigued', 'weary', 'drained'],
        ancientVoice: null,
        intrusiveBoost: ['inland_empire', 'endurance']
    },
    the_hunger: {
        id: 'the_hunger',
        name: 'The Hunger',
        icon: '🍽️',
        category: 'physical',
        description: 'The body demands. The stomach is a void that echoes. Feed it or it will feed on you.',
        boosts: ['electrochemistry', 'perception', 'half_light'],
        debuffs: ['logic', 'composure', 'volition'],
        difficultyMod: 1,
        keywords: ['hungry', 'starving', 'famished', 'food', 'eat', 'starve'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'half_light']
    },
    martinaise_winter: {
        id: 'martinaise_winter',
        name: 'Martinaise Winter',
        icon: '🥶',
        category: 'physical',
        description: 'The cold seeps into your bones. The coast shows no mercy. You feel the pale at the edges.',
        boosts: ['shivers', 'pain_threshold', 'inland_empire', 'endurance'],
        debuffs: ['hand_eye_coordination', 'reaction_speed', 'interfacing'],
        difficultyMod: 2,
        keywords: ['cold', 'freezing', 'hypothermia', 'shivering', 'frost', 'winter', 'frozen'],
        ancientVoice: null,
        intrusiveBoost: ['shivers', 'inland_empire']
    },
    white_mourning: {
        id: 'white_mourning',
        name: 'White Mourning',
        icon: '💀',
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
        icon: '🌅',
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
        icon: '🌫️',
        category: 'mental',
        description: 'Reality dissolves. The void between worlds seeps into your consciousness. The ancient voices wake.',
        boosts: ['inland_empire', 'shivers', 'pain_threshold', 'conceptualization'],
        debuffs: ['perception', 'reaction_speed', 'empathy', 'logic', 'authority'],
        difficultyMod: 3,
        keywords: ['dissociate', 'unreal', 'floating', 'numb', 'detached', 'distant', 'unconscious', 'blackout', 'void', 'pale'],
        ancientVoice: 'both',
        intrusiveBoost: ['inland_empire', 'shivers', 'conceptualization']
    },
    homo_sexual_underground: {
        id: 'homo_sexual_underground',
        name: 'Homo-Sexual Underground',
        icon: '💜',
        category: 'mental',
        description: 'The obsessive spiral of desire. Who are you? Who do you want? Does it even matter anymore?',
        boosts: ['electrochemistry', 'suggestion', 'empathy', 'drama', 'inland_empire'],
        debuffs: ['logic', 'volition', 'composure', 'authority'],
        difficultyMod: 2,
        keywords: ['aroused', 'desire', 'attraction', 'lust', 'seduction', 'beautiful', 'sexuality', 'obsess'],
        ancientVoice: null,
        intrusiveBoost: ['electrochemistry', 'suggestion', 'inland_empire']
    },
    jamrock_shuffle: {
        id: 'jamrock_shuffle',
        name: 'Jamrock Shuffle',
        icon: '🎲',
        category: 'mental',
        description: 'Trust the gut. The streets taught you things no book ever could. Let instinct guide you.',
        boosts: ['shivers', 'perception', 'reaction_speed', 'savoir_faire', 'half_light'],
        debuffs: ['logic', 'encyclopedia', 'rhetoric'],
        difficultyMod: -1,
        keywords: ['luck', 'instinct', 'gut', 'street', 'shuffle', 'gamble', 'chance', 'lucky'],
        ancientVoice: null,
        intrusiveBoost: ['shivers', 'perception', 'half_light']
    },
    doom_spiral: {
        id: 'doom_spiral',
        name: 'Doom Spiral',
        icon: '👁️',
        category: 'mental',
        description: 'They are watching. They are always watching. The thought loops back on itself, tightening.',
        boosts: ['half_light', 'perception', 'shivers', 'visual_calculus'],
        debuffs: ['empathy', 'suggestion', 'composure', 'authority'],
        difficultyMod: 1,
        keywords: ['paranoid', 'suspicious', 'watching', 'followed', 'conspiracy', 'spiral', 'loop'],
        ancientVoice: null,
        intrusiveBoost: ['half_light', 'perception', 'shivers']
    },
    caustic_echo: {
        id: 'caustic_echo',
        name: 'Caustic Echo',
        icon: '😨',
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
        icon: '😤',
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
        icon: '😢',
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
    // COP ARCHETYPES (Mutually Exclusive Identity States)
    // ═══════════════════════════════════════════════════════════════
    apocalypse_cop: {
        id: 'apocalypse_cop',
        name: 'Apocalypse Cop',
        icon: '🔥',
        category: 'archetype',
        description: 'The badge still means something. Even at the end of all things.',
        boosts: ['half_light', 'authority', 'shivers', 'inland_empire', 'endurance'],
        debuffs: ['empathy', 'suggestion', 'savoir_faire'],
        difficultyMod: 0,
        keywords: ['apocalypse', 'end times', 'doom', 'final', 'revelation'],
        ancientVoice: null,
        intrusiveBoost: ['half_light', 'shivers', 'inland_empire'],
        exclusive: 'archetype'
    },
    sorry_cop: {
        id: 'sorry_cop',
        name: 'Sorry Cop',
        icon: '🙏',
        category: 'archetype',
        description: 'You apologize. For everything. For existing. It somehow works.',
        boosts: ['empathy', 'suggestion', 'drama', 'volition'],
        debuffs: ['authority', 'physical_instrument', 'half_light'],
        difficultyMod: 0,
        keywords: ['sorry', 'apologize', 'forgive', 'humble', 'pathetic', 'please'],
        ancientVoice: null,
        intrusiveBoost: ['empathy', 'drama', 'suggestion'],
        exclusive: 'archetype'
    },
    superstar_cop: {
        id: 'superstar_cop',
        name: 'Superstar Cop',
        icon: '⭐',
        category: 'archetype',
        description: 'You are the LAW. You are DISCO. You are absolutely insufferable and magnificent.',
        boosts: ['authority', 'savoir_faire', 'rhetoric', 'drama', 'electrochemistry'],
        debuffs: ['empathy', 'logic', 'composure'],
        difficultyMod: -1,
        keywords: ['superstar', 'disco', 'fame', 'celebrity', 'amazing', 'incredible'],
        ancientVoice: null,
        intrusiveBoost: ['authority', 'drama', 'savoir_faire'],
        exclusive: 'archetype'
    },
    hobocop: {
        id: 'hobocop',
        name: 'Hobocop',
        icon: '🗑️',
        category: 'archetype',
        description: 'You patrol the margins. The forgotten places. The people no one else sees.',
        boosts: ['shivers', 'inland_empire', 'empathy', 'endurance', 'perception'],
        debuffs: ['authority', 'composure', 'savoir_faire', 'suggestion'],
        difficultyMod: 1,
        keywords: ['hobo', 'vagrant', 'homeless', 'outcast', 'forgotten', 'streets'],
        ancientVoice: null,
        intrusiveBoost: ['shivers', 'inland_empire', 'empathy'],
        exclusive: 'archetype'
    },
    boring_cop: {
        id: 'boring_cop',
        name: 'Boring Cop',
        icon: '📋',
        category: 'archetype',
        description: 'By the book. Professional. Utterly, devastatingly competent.',
        boosts: ['logic', 'encyclopedia', 'composure', 'volition', 'perception'],
        debuffs: ['drama', 'inland_empire', 'electrochemistry', 'conceptualization'],
        difficultyMod: -1,
        keywords: ['boring', 'professional', 'competent', 'proper', 'correct', 'procedure'],
        ancientVoice: null,
        intrusiveBoost: ['logic', 'composure', 'volition'],
        exclusive: 'archetype'
    },
    art_cop: {
        id: 'art_cop',
        name: 'Art Cop',
        icon: '🎨',
        category: 'archetype',
        description: 'You see the beauty in everything. Even crime scenes. Especially crime scenes.',
        boosts: ['conceptualization', 'inland_empire', 'drama', 'visual_calculus', 'empathy'],
        debuffs: ['authority', 'physical_instrument', 'logic'],
        difficultyMod: 0,
        keywords: ['art', 'beauty', 'aesthetic', 'creative', 'vision', 'artistic'],
        ancientVoice: null,
        intrusiveBoost: ['conceptualization', 'drama', 'inland_empire'],
        exclusive: 'archetype'
    }
};

// Helper to get archetype statuses (for mutual exclusivity)
export const ARCHETYPE_IDS = Object.entries(STATUS_EFFECTS)
    .filter(([_, status]) => status.category === 'archetype')
    .map(([id, _]) => id);

// Statuses that trigger BOTH ancient voices (Ancient Reptilian Brain + Limbic System)
export const DUAL_ANCIENT_TRIGGERS = ['the_pale'];

// Combo triggers for Spinal Cord (party state)
export const SPINAL_CORD_COMBO = ['tequila_sunset', 'revacholian_courage'];
