/**
 * Discovery Contexts Data
 * Static data for narrator selection and object icons
 * Extracted from discovery.js for maintainability
 */

// ═══════════════════════════════════════════════════════════════
// NARRATOR CONTEXT WEIGHTS
// Which skills narrate best in which environments?
// ═══════════════════════════════════════════════════════════════

export const NARRATOR_CONTEXTS = {
    bar_club: {
        keywords: ['bar', 'club', 'drink', 'party', 'dance', 'disco', 'music', 'drunk', 'booze', 'alcohol', 'nightclub', 'pub', 'tavern', 'lounge'],
        primary: ['electrochemistry', 'drama', 'composure', 'savoir_faire'],
        secondary: ['empathy', 'inland_empire', 'suggestion']
    },
    crime_scene: {
        keywords: ['blood', 'body', 'corpse', 'murder', 'evidence', 'crime', 'victim', 'dead', 'death', 'killed', 'wound', 'forensic', 'investigate'],
        primary: ['visual_calculus', 'perception', 'logic'],
        secondary: ['esprit_de_corps', 'empathy', 'inland_empire']
    },
    abandoned_creepy: {
        keywords: ['abandoned', 'empty', 'dark', 'shadow', 'haunted', 'decrepit', 'ruin', 'decay', 'forgotten', 'eerie', 'strange', 'uncanny', 'quiet', 'dust'],
        primary: ['shivers', 'inland_empire', 'half_light'],
        secondary: ['perception', 'conceptualization']
    },
    theater_stage: {
        keywords: ['stage', 'theater', 'theatre', 'performance', 'audience', 'curtain', 'actor', 'play', 'show', 'spotlight', 'drama', 'scene'],
        primary: ['drama', 'conceptualization', 'composure'],
        secondary: ['rhetoric', 'suggestion', 'savoir_faire']
    },
    gym_physical: {
        keywords: ['gym', 'muscle', 'exercise', 'training', 'fight', 'boxing', 'physical', 'sweat', 'weights', 'strong', 'punch', 'hit'],
        primary: ['physical_instrument', 'endurance', 'pain_threshold'],
        secondary: ['half_light', 'electrochemistry']
    },
    social_conversation: {
        keywords: ['talk', 'conversation', 'meeting', 'interview', 'question', 'discuss', 'negotiate', 'argue', 'speak', 'said', 'asked'],
        primary: ['empathy', 'drama', 'rhetoric'],
        secondary: ['suggestion', 'authority', 'composure']
    },
    technical_mechanical: {
        keywords: ['machine', 'computer', 'device', 'electronic', 'wire', 'mechanism', 'lock', 'system', 'technical', 'repair', 'button', 'switch'],
        primary: ['interfacing', 'logic', 'perception'],
        secondary: ['encyclopedia', 'visual_calculus']
    },
    artistic_creative: {
        keywords: ['art', 'painting', 'sculpture', 'music', 'creative', 'beautiful', 'aesthetic', 'gallery', 'museum', 'design', 'color', 'canvas'],
        primary: ['conceptualization', 'drama', 'inland_empire'],
        secondary: ['encyclopedia', 'empathy']
    },
    urban_street: {
        keywords: ['street', 'city', 'alley', 'urban', 'building', 'sidewalk', 'rain', 'night', 'neon', 'concrete', 'pavement', 'lamp'],
        primary: ['shivers', 'perception', 'half_light'],
        secondary: ['inland_empire', 'esprit_de_corps']
    },
    nature_outdoor: {
        keywords: ['forest', 'tree', 'nature', 'outdoor', 'wild', 'animal', 'plant', 'sky', 'weather', 'cold', 'wind', 'water', 'sea', 'ocean'],
        primary: ['shivers', 'endurance', 'perception'],
        secondary: ['inland_empire', 'half_light']
    },
    intellectual_academic: {
        keywords: ['book', 'library', 'study', 'research', 'theory', 'philosophy', 'academic', 'university', 'scholar', 'knowledge', 'read', 'write'],
        primary: ['encyclopedia', 'logic', 'rhetoric'],
        secondary: ['conceptualization', 'inland_empire']
    },
    dangerous_combat: {
        keywords: ['gun', 'weapon', 'fight', 'attack', 'danger', 'threat', 'enemy', 'violent', 'kill', 'armed', 'shoot', 'blade', 'knife'],
        primary: ['half_light', 'reaction_speed', 'hand_eye_coordination'],
        secondary: ['physical_instrument', 'perception', 'authority']
    },
    emotional_intimate: {
        keywords: ['love', 'hate', 'cry', 'tear', 'emotion', 'feel', 'heart', 'intimate', 'relationship', 'loss', 'grief', 'kiss', 'touch', 'hold'],
        primary: ['empathy', 'inland_empire', 'volition'],
        secondary: ['pain_threshold', 'drama', 'suggestion']
    },
    police_procedural: {
        keywords: ['police', 'cop', 'detective', 'badge', 'arrest', 'suspect', 'witness', 'interrogate', 'case', 'investigation', 'RCM', 'precinct'],
        primary: ['esprit_de_corps', 'authority', 'logic'],
        secondary: ['perception', 'empathy', 'rhetoric']
    },
    mysterious_supernatural: {
        keywords: ['pale', 'strange', 'impossible', 'dream', 'vision', 'ghost', 'spirit', 'otherworldly', 'surreal', 'void', 'entropy'],
        primary: ['inland_empire', 'shivers', 'conceptualization'],
        secondary: ['half_light', 'encyclopedia']
    }
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT NARRATOR SKILLS (fallback when no context matches)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_NARRATOR_SKILLS = [
    'perception', 'inland_empire', 'shivers', 'visual_calculus',
    'drama', 'empathy', 'conceptualization', 'encyclopedia',
    'half_light', 'electrochemistry', 'composure', 'esprit_de_corps'
];

// ═══════════════════════════════════════════════════════════════
// OBJECT ICON MAPPING
// Get a contextual emoji icon for dynamic object voices
// ═══════════════════════════════════════════════════════════════

const OBJECT_ICONS = {
    // Food & drink
    food: { keywords: ['pizza', 'food', 'sandwich'], icon: '🍕' },
    drink: { keywords: ['bottle', 'beer', 'wine', 'whiskey'], icon: '🍾' },
    coffee: { keywords: ['coffee', 'cup', 'mug'], icon: '☕' },
    
    // Weapons & danger
    knife: { keywords: ['knife', 'blade'], icon: '🔪' },
    gun: { keywords: ['gun', 'pistol', 'revolver'], icon: '🔫' },
    needle: { keywords: ['needle', 'syringe'], icon: '💉' },
    
    // Furniture & places
    door: { keywords: ['door'], icon: '🚪' },
    chair: { keywords: ['chair', 'seat'], icon: '🪑' },
    bed: { keywords: ['bed', 'mattress'], icon: '🛏️' },
    mirror: { keywords: ['mirror'], icon: '🪞' },
    window: { keywords: ['window'], icon: '🪟' },
    
    // Light sources
    light: { keywords: ['light', 'lamp', 'bulb'], icon: '💡' },
    candle: { keywords: ['candle'], icon: '🕯️' },
    neon: { keywords: ['neon', 'sign'], icon: '🔆' },
    
    // Personal items
    photo: { keywords: ['photo', 'picture', 'polaroid'], icon: '📷' },
    phone: { keywords: ['phone', 'telephone'], icon: '📞' },
    letter: { keywords: ['letter', 'note', 'paper'], icon: '📝' },
    book: { keywords: ['book'], icon: '📖' },
    money: { keywords: ['wallet', 'money', 'cash'], icon: '💵' },
    key: { keywords: ['key'], icon: '🔑' },
    clock: { keywords: ['clock', 'watch'], icon: '🕐' },
    tie: { keywords: ['tie', 'necktie'], icon: '👔' },
    cigarette: { keywords: ['cigarette', 'ashtray'], icon: '🚬' },
    
    // Trash & debris
    trash: { keywords: ['trash', 'garbage', 'can'], icon: '🗑️' },
    newspaper: { keywords: ['newspaper'], icon: '📰' },
    box: { keywords: ['box', 'cardboard'], icon: '📦' },
    
    // Body parts (creepy)
    skull: { keywords: ['skull', 'bone'], icon: '💀' },
    eye: { keywords: ['eye'], icon: '👁️' },
    hand: { keywords: ['hand'], icon: '✋' },
    
    // Nature
    tree: { keywords: ['tree', 'plant'], icon: '🌳' },
    flower: { keywords: ['flower'], icon: '🌸' },
    rock: { keywords: ['rock', 'stone'], icon: '🪨' },
    
    // Vehicles
    car: { keywords: ['car', 'vehicle'], icon: '🚗' },
    boat: { keywords: ['boat', 'ship'], icon: '⛵' }
};

/**
 * Get a contextual emoji icon for a dynamic object name
 * @param {string} objectName - The object's name (e.g., "THE MOLDY PIZZA SLICE")
 * @returns {string} An emoji icon
 */
export function getObjectIcon(objectName) {
    const name = objectName.toLowerCase();
    
    for (const category of Object.values(OBJECT_ICONS)) {
        if (category.keywords.some(kw => name.includes(kw))) {
            return category.icon;
        }
    }
    
    return '📦'; // Default
}

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY HELPERS
// ═══════════════════════════════════════════════════════════════

export function getNarratorDifficulty(relevance) {
    switch (relevance) {
        case 'primary':
            return Math.random() < 0.6 ? 8 : 10; // Easy or Medium
        case 'secondary':
            return Math.random() < 0.5 ? 10 : 12; // Medium or Challenging
        default:
            return Math.random() < 0.4 ? 12 : 14; // Challenging or Heroic
    }
}

export function getDifficultyName(difficulty) {
    if (difficulty <= 6) return 'Trivial';
    if (difficulty <= 8) return 'Easy';
    if (difficulty <= 10) return 'Medium';
    if (difficulty <= 12) return 'Challenging';
    if (difficulty <= 14) return 'Heroic';
    if (difficulty <= 16) return 'Legendary';
    return 'Impossible';
}
