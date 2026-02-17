/**
 * Discovery Contexts Data
 * Static data for narrator selection, object icons, and OBJECT VOICES
 * Extracted from discovery.js for maintainability
 * 
 * v2 - Added OBJECT_VOICES back (speaking objects like THE TIE)
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
// OBJECT VOICES - Speaking Objects (Disco Elysium style)
// Objects that can speak to the player when examined
// ═══════════════════════════════════════════════════════════════

export const OBJECT_VOICES = {
    // ─────────────────────────────────────────────────────────
    // CLOTHING & PERSONAL ITEMS
    // ─────────────────────────────────────────────────────────
    tie: {
        keywords: ['tie', 'necktie', 'cravat'],
        signature: 'THE HORRIFIC NECKTIE',
        icon: '👔',
        color: '#c0392b',
        personality: `A garish, loud tie that encourages impulsive, attention-seeking behavior. It whispers of parties, of spectacle, of making an impression that can never be forgotten—for better or worse. It wants to be *seen*.`,
        alignedSkill: 'electrochemistry'
    },
    jacket: {
        keywords: ['jacket', 'coat', 'blazer'],
        signature: 'THE WORN JACKET',
        icon: '🧥',
        color: '#7f8c8d',
        personality: `A jacket that has seen better days—and worse ones. It remembers every stain, every tear, every moment of disgrace. It knows what you've done in it. It doesn't judge. It just *remembers*.`,
        alignedSkill: 'composure'
    },
    shoes: {
        keywords: ['shoe', 'boot', 'sneaker', 'footwear'],
        signature: 'THE LONELY SHOE',
        icon: '👟',
        color: '#795548',
        personality: `Where is its pair? It doesn't know. It has been abandoned, separated from its purpose. It understands loss in a way you cannot.`,
        alignedSkill: 'empathy'
    },
    hat: {
        keywords: ['hat', 'cap', 'fedora', 'beanie'],
        signature: 'THE DETECTIVE\'S HAT',
        icon: '🎩',
        color: '#34495e',
        personality: `It makes you feel like a detective. A real detective. The kind from movies. The kind who solves cases and looks good doing it. Wear it. Become the character.`,
        alignedSkill: 'drama'
    },

    // ─────────────────────────────────────────────────────────
    // FURNITURE & FIXTURES
    // ─────────────────────────────────────────────────────────
    chair: {
        keywords: ['chair', 'seat', 'stool', 'throne'],
        signature: 'THE EMPTY CHAIR',
        icon: '🪑',
        color: '#8b4513',
        personality: `It has held so many people. Politicians, drunks, killers, lovers. It remembers the weight of them all. Sit in it. Add your weight to its memory.`,
        alignedSkill: 'shivers'
    },
    bed: {
        keywords: ['bed', 'mattress', 'cot'],
        signature: 'THE UNMADE BED',
        icon: '🛏️',
        color: '#6c5ce7',
        personality: `Sleep is escape. The bed knows this. It has cradled nightmares and dreams alike. It offers you oblivion, if you want it.`,
        alignedSkill: 'volition'
    },
    mirror: {
        keywords: ['mirror', 'reflection', 'glass'],
        signature: 'THE CRACKED MIRROR',
        icon: '🪞',
        color: '#a29bfe',
        personality: `Who is that looking back at you? The mirror shows the truth—but which truth? The one you present, or the one underneath? It's been cracked. By a fist, probably. Yours?`,
        alignedSkill: 'inland_empire'
    },
    door: {
        keywords: ['door', 'gate', 'entrance', 'exit'],
        signature: 'THE THRESHOLD',
        icon: '🚪',
        color: '#636e72',
        personality: `Every door is a choice. This side or that side. Safety or danger. The known or unknown. The door doesn't care which you choose. It just waits.`,
        alignedSkill: 'half_light'
    },
    window: {
        keywords: ['window', 'pane', 'glass'],
        signature: 'THE WATCHING WINDOW',
        icon: '🪟',
        color: '#74b9ff',
        personality: `It looks outward. But something might be looking in. The window is a membrane between worlds—fragile, transparent, treacherous.`,
        alignedSkill: 'perception'
    },
    lamp: {
        keywords: ['lamp', 'light', 'bulb', 'lantern'],
        signature: 'THE FLICKERING LAMP',
        icon: '💡',
        color: '#f1c40f',
        personality: `Light against darkness. Hope against despair. But the bulb is dying. It flickers. Soon it will go out, and then what?`,
        alignedSkill: 'conceptualization'
    },

    // ─────────────────────────────────────────────────────────
    // CONSUMABLES & VICES
    // ─────────────────────────────────────────────────────────
    bottle: {
        keywords: ['bottle', 'booze', 'liquor', 'alcohol', 'whiskey', 'beer', 'wine'],
        signature: 'THE EMPTY BOTTLE',
        icon: '🍾',
        color: '#9b59b6',
        personality: `It's empty now. But it remembers being full. It remembers the burn, the warmth, the temporary peace. Find another. Fill the void.`,
        alignedSkill: 'electrochemistry'
    },
    cigarette: {
        keywords: ['cigarette', 'smoke', 'ashtray', 'butt', 'tobacco'],
        signature: 'THE CIGARETTE BUTT',
        icon: '🚬',
        color: '#e67e22',
        personality: `Someone smoked this down to the filter. They needed it. They craved it. The nicotine is long gone, but the addiction lingers—in the air, in the walls, in you.`,
        alignedSkill: 'electrochemistry'
    },
    pill: {
        keywords: ['pill', 'medication', 'drug', 'prescription'],
        signature: 'THE LITTLE PILL',
        icon: '💊',
        color: '#e74c3c',
        personality: `Chemistry in solid form. It promises relief, clarity, escape. What does it actually deliver? Only one way to find out.`,
        alignedSkill: 'electrochemistry'
    },
    needle: {
        keywords: ['needle', 'syringe', 'injection'],
        signature: 'THE WAITING NEEDLE',
        icon: '💉',
        color: '#c0392b',
        personality: `Sharp. Direct. It bypasses all pretense and delivers straight to the blood. The needle doesn't lie about what it is.`,
        alignedSkill: 'electrochemistry'
    },
    coffee: {
        keywords: ['coffee', 'cup', 'mug', 'caffeine'],
        signature: 'THE COLD COFFEE',
        icon: '☕',
        color: '#6d4c41',
        personality: `It was hot once. Now it's cold, bitter, forgotten. Someone left it here when something more important demanded attention. Drink it anyway. You need the focus.`,
        alignedSkill: 'volition'
    },
    pizza: {
        keywords: ['pizza', 'slice', 'food'],
        signature: 'THE MOLDY PIZZA SLICE',
        icon: '🍕',
        color: '#d35400',
        personality: `It's been here for... days? Weeks? The mold has claimed it. But somewhere beneath the green fuzz, there's still cheese. Still calories. Still sustenance for the desperate.`,
        alignedSkill: 'endurance'
    },

    // ─────────────────────────────────────────────────────────
    // WEAPONS & DANGER
    // ─────────────────────────────────────────────────────────
    gun: {
        keywords: ['gun', 'pistol', 'revolver', 'firearm', 'weapon'],
        signature: 'THE LOADED GUN',
        icon: '🔫',
        color: '#2c3e50',
        personality: `Cold metal potential. It doesn't want anything—it's just a tool. But in your hand, it becomes an extension of your will. What does your will want?`,
        alignedSkill: 'half_light'
    },
    knife: {
        keywords: ['knife', 'blade', 'dagger', 'sharp'],
        signature: 'THE KITCHEN KNIFE',
        icon: '🔪',
        color: '#7f8c8d',
        personality: `Made for food. Used for worse. The blade doesn't discriminate between bread and flesh. It just cuts.`,
        alignedSkill: 'half_light'
    },

    // ─────────────────────────────────────────────────────────
    // DOCUMENTS & INFORMATION
    // ─────────────────────────────────────────────────────────
    book: {
        keywords: ['book', 'tome', 'novel', 'volume'],
        signature: 'THE DUSTY BOOK',
        icon: '📖',
        color: '#8e44ad',
        personality: `Knowledge bound in paper. Someone thought these words important enough to print. Are they? Open it. Find out.`,
        alignedSkill: 'encyclopedia'
    },
    newspaper: {
        keywords: ['newspaper', 'paper', 'news', 'headline'],
        signature: 'THE OLD NEWSPAPER',
        icon: '📰',
        color: '#bdc3c7',
        personality: `Yesterday's news. Already outdated, already irrelevant. But in its pages, frozen moments—scandals, deaths, weather reports for days long past.`,
        alignedSkill: 'encyclopedia'
    },
    photograph: {
        keywords: ['photo', 'photograph', 'picture', 'polaroid', 'image'],
        signature: 'THE FADED PHOTOGRAPH',
        icon: '📷',
        color: '#f39c12',
        personality: `A moment preserved. But who are these people? Are they happy? They look happy. Where are they now?`,
        alignedSkill: 'empathy'
    },
    letter: {
        keywords: ['letter', 'note', 'message', 'envelope'],
        signature: 'THE UNREAD LETTER',
        icon: '📝',
        color: '#16a085',
        personality: `Words meant for someone else. But you're here now, and they're not. The letter doesn't care who reads it. It just wants to be understood.`,
        alignedSkill: 'empathy'
    },

    // ─────────────────────────────────────────────────────────
    // MONEY & VALUE
    // ─────────────────────────────────────────────────────────
    money: {
        keywords: ['money', 'cash', 'coin', 'bill', 'réal', 'wallet'],
        signature: 'THE CRUMPLED BILLS',
        icon: '💵',
        color: '#27ae60',
        personality: `Paper that means everything. Paper that means nothing. It's just a promise—a shared delusion that this stuff has value. But you need it. Everyone needs it.`,
        alignedSkill: 'suggestion'
    },

    // ─────────────────────────────────────────────────────────
    // BODY PARTS & CREEPY
    // ─────────────────────────────────────────────────────────
    skull: {
        keywords: ['skull', 'bone', 'skeleton'],
        signature: 'THE GRINNING SKULL',
        icon: '💀',
        color: '#ecf0f1',
        personality: `Everyone ends up like this. A skull. A remnant. The grin isn't happy—skulls can't be happy. It's just the way the bones fall.`,
        alignedSkill: 'shivers'
    },
    eye: {
        keywords: ['eye', 'eyeball', 'eyes'],
        signature: 'THE WATCHING EYE',
        icon: '👁️',
        color: '#3498db',
        personality: `Is it watching you? It can't be—it's just an eye, detached, alone. But you feel watched. You're always being watched.`,
        alignedSkill: 'inland_empire'
    },
    hand: {
        keywords: ['hand', 'finger', 'palm', 'fist'],
        signature: 'THE SEVERED HAND',
        icon: '✋',
        color: '#e8d8c3',
        personality: `It used to grip things. Tools, weapons, other hands. Now it grips nothing. The hand is a reminder of what was.`,
        alignedSkill: 'visual_calculus'
    },

    // ─────────────────────────────────────────────────────────
    // TECHNOLOGY & MACHINES
    // ─────────────────────────────────────────────────────────
    phone: {
        keywords: ['phone', 'telephone', 'receiver'],
        signature: 'THE DEAD PHONE',
        icon: '📞',
        color: '#2c3e50',
        personality: `No dial tone. The line is dead—has been for years, maybe. Who would you call anyway? Who's left to call?`,
        alignedSkill: 'interfacing'
    },
    radio: {
        keywords: ['radio', 'speaker', 'broadcast'],
        signature: 'THE STATIC RADIO',
        icon: '📻',
        color: '#795548',
        personality: `White noise. Between the stations, there's only chaos—random signals from the void. Sometimes you think you hear voices in it. You don't.`,
        alignedSkill: 'shivers'
    },
    clock: {
        keywords: ['clock', 'watch', 'time', 'timepiece'],
        signature: 'THE STOPPED CLOCK',
        icon: '🕐',
        color: '#e74c3c',
        personality: `Time has stopped here. Frozen at this moment. But you keep moving through it, second by second, toward your end.`,
        alignedSkill: 'conceptualization'
    },

    // ─────────────────────────────────────────────────────────
    // VEHICLES & TRANSPORT
    // ─────────────────────────────────────────────────────────
    car: {
        keywords: ['car', 'vehicle', 'automobile'],
        signature: 'THE ABANDONED CAR',
        icon: '🚗',
        color: '#34495e',
        personality: `It used to go places. Now it rusts. The engine is silent, the tires flat. It's a monument to motion, frozen in place.`,
        alignedSkill: 'interfacing'
    },
    boat: {
        keywords: ['boat', 'ship', 'vessel'],
        signature: 'THE BEACHED BOAT',
        icon: '⛵',
        color: '#1abc9c',
        personality: `It was built for water, but here it sits on land—useless, beautiful, stranded. The sea calls to it. It cannot answer.`,
        alignedSkill: 'shivers'
    },

    // ─────────────────────────────────────────────────────────
    // INTERNAL / BIOLOGICAL (Ancient Voices style)
    // ─────────────────────────────────────────────────────────
    limbic_system: {
        keywords: ['fear', 'panic', 'terror', 'dread', 'anxiety'],
        signature: 'THE LIMBIC SYSTEM',
        icon: '🧠',
        color: '#c0392b',
        personality: `Your ancient alarm system. It doesn't think—it *reacts*. Fight. Flight. Freeze. It's kept your ancestors alive for millions of years. Trust it. Or don't. It doesn't care.`,
        alignedSkill: 'half_light'
    },
    reptilian_brain: {
        keywords: ['hunger', 'lust', 'survival', 'instinct', 'primal'],
        signature: 'THE ANCIENT REPTILIAN BRAIN',
        icon: '🦎',
        color: '#27ae60',
        personality: `Before thought, before language, before *you*—there was this. The cold calculator of survival. It wants food. It wants warmth. It wants to continue existing. That's all.`,
        alignedSkill: 'endurance'
    }
};

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

/**
 * Find an object voice that matches the given text
 * @param {string} text - Text to match against object keywords
 * @returns {Object|null} The matching object voice definition or null
 */
export function findObjectVoice(text) {
    const lowerText = text.toLowerCase();
    
    for (const [id, voice] of Object.entries(OBJECT_VOICES)) {
        if (voice.keywords.some(kw => lowerText.includes(kw))) {
            return { id, ...voice };
        }
    }
    
    return null;
}

/**
 * Get all object voices that might be relevant to a scene
 * @param {string} sceneText - The scene description
 * @param {number} maxVoices - Maximum number of voices to return
 * @returns {Array} Array of matching object voice definitions
 */
export function getRelevantObjectVoices(sceneText, maxVoices = 3) {
    const lowerScene = sceneText.toLowerCase();
    const matches = [];
    
    for (const [id, voice] of Object.entries(OBJECT_VOICES)) {
        const matchCount = voice.keywords.filter(kw => lowerScene.includes(kw)).length;
        if (matchCount > 0) {
            matches.push({ id, ...voice, relevance: matchCount });
        }
    }
    
    // Sort by relevance, return top matches
    matches.sort((a, b) => b.relevance - a.relevance);
    return matches.slice(0, maxVoices);
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
