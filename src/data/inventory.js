/**
 * The Tribunal - Inventory Data Definitions
 * Consumables, miscellaneous items, and addiction mechanics
 * 
 * "One more won't hurt. What's one more?" — Electrochemistry
 */

// ═══════════════════════════════════════════════════════════════
// INVENTORY ITEM TYPES & CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const INVENTORY_CATEGORIES = {
    consumable: { label: 'Consumables', icon: 'fa-solid fa-flask', gridId: 'ie-consumables-grid' },
    misc: { label: 'Miscellaneous', icon: 'fa-solid fa-box', gridId: 'ie-misc-grid' }
};

export const INVENTORY_TYPES = {
    // ═══════════════════════════════════════════════════════════
    // SUBSTANCES (Addictive Consumables)
    // ═══════════════════════════════════════════════════════════
    cigarettes: {
        emoji: '🚬',
        label: 'Cigarettes',
        pluralLabel: 'Cigarettes',
        category: 'consumable',
        addictive: true,
        addictionType: 'nicotine',
        statusId: 'nicotine_rush',
        defaultDuration: 3, // messages
        skillAffinities: ['electrochemistry', 'composure', 'conceptualization'],
        keywords: ['cigarette', 'smoke', 'cig', 'astra', 'tobacco', 'pack']
    },
    alcohol: {
        emoji: '🍺',
        label: 'Alcohol',
        pluralLabel: 'Alcohol',
        category: 'consumable',
        addictive: true,
        addictionType: 'alcohol',
        statusId: 'revacholian_courage',
        defaultDuration: 5,
        skillAffinities: ['electrochemistry', 'inland_empire', 'drama'],
        keywords: ['beer', 'wine', 'vodka', 'whiskey', 'booze', 'liquor', 'drink', 'bottle', 'flask', 'spirit']
    },
    stimulants: {
        emoji: '💊',
        label: 'Stimulants',
        pluralLabel: 'Stimulants',
        category: 'consumable',
        addictive: true,
        addictionType: 'stimulants',
        statusId: 'pyrholidon',
        defaultDuration: 4,
        skillAffinities: ['electrochemistry', 'reaction_speed', 'logic'],
        keywords: ['speed', 'pyrholidon', 'pills', 'uppers', 'stimulant', 'amphetamine', 'drug', 'capsule']
    },

    // ═══════════════════════════════════════════════════════════
    // NON-ADDICTIVE CONSUMABLES
    // ═══════════════════════════════════════════════════════════
    medicine: {
        emoji: '💉',
        label: 'Medicine',
        pluralLabel: 'Medicine',
        category: 'consumable',
        addictive: false,
        healthRestore: 2,
        skillAffinities: ['endurance', 'pain_threshold', 'logic'],
        keywords: ['medicine', 'bandage', 'medkit', 'first aid', 'nosaphed', 'aspirin', 'painkiller', 'antidote']
    },
    food: {
        emoji: '🍔',
        label: 'Food',
        pluralLabel: 'Food',
        category: 'consumable',
        addictive: false,
        healthRestore: 1,
        moraleRestore: 1,
        skillAffinities: ['endurance', 'electrochemistry', 'empathy'],
        keywords: ['food', 'meal', 'sandwich', 'snack', 'bread', 'meat', 'fruit', 'coffee', 'tea', 'candy', 'chocolate']
    },

    // ═══════════════════════════════════════════════════════════
    // MISCELLANEOUS (Non-Consumable)
    // ═══════════════════════════════════════════════════════════
    evidence: {
        emoji: '🔍',
        label: 'Evidence',
        pluralLabel: 'Evidence',
        category: 'misc',
        skillAffinities: ['perception', 'logic', 'visual_calculus'],
        keywords: ['evidence', 'clue', 'proof', 'fingerprint', 'sample', 'trace', 'bullet', 'casing']
    },
    key: {
        emoji: '🔑',
        label: 'Key',
        pluralLabel: 'Keys',
        category: 'misc',
        skillAffinities: ['interfacing', 'perception', 'savoir_faire'],
        keywords: ['key', 'keycard', 'passkey', 'lockpick', 'keyring']
    },
    document: {
        emoji: '📄',
        label: 'Document',
        pluralLabel: 'Documents',
        category: 'misc',
        skillAffinities: ['encyclopedia', 'rhetoric', 'logic'],
        keywords: ['document', 'paper', 'letter', 'note', 'file', 'report', 'record', 'newspaper', 'manifest']
    },
    book: {
        emoji: '📖',
        label: 'Book',
        pluralLabel: 'Books',
        category: 'misc',
        skillAffinities: ['encyclopedia', 'conceptualization', 'rhetoric'],
        keywords: ['book', 'manual', 'journal', 'diary', 'tome', 'novel', 'magazine']
    },
    tool: {
        emoji: '🔧',
        label: 'Tool',
        pluralLabel: 'Tools',
        category: 'misc',
        skillAffinities: ['interfacing', 'hand_eye_coordination', 'physical_instrument'],
        keywords: ['tool', 'wrench', 'screwdriver', 'hammer', 'flashlight', 'rope', 'tape', 'lighter', 'match']
    },
    weapon: {
        emoji: '🔫',
        label: 'Weapon',
        pluralLabel: 'Weapons',
        category: 'misc',
        skillAffinities: ['half_light', 'authority', 'hand_eye_coordination'],
        keywords: ['gun', 'pistol', 'knife', 'blade', 'weapon', 'revolver', 'firearm', 'ammunition', 'bullet']
    },
    photo: {
        emoji: '📷',
        label: 'Photo',
        pluralLabel: 'Photos',
        category: 'misc',
        skillAffinities: ['perception', 'visual_calculus', 'empathy'],
        keywords: ['photo', 'photograph', 'picture', 'image', 'snapshot', 'polaroid']
    },
    trinket: {
        emoji: '🎲',
        label: 'Trinket',
        pluralLabel: 'Trinkets',
        category: 'misc',
        skillAffinities: ['inland_empire', 'conceptualization', 'shivers'],
        keywords: ['trinket', 'charm', 'token', 'souvenir', 'memento', 'dice', 'figurine', 'coin']
    },
    container: {
        emoji: '📦',
        label: 'Container',
        pluralLabel: 'Containers',
        category: 'misc',
        skillAffinities: ['perception', 'interfacing', 'logic'],
        keywords: ['box', 'bag', 'case', 'container', 'envelope', 'package', 'wallet', 'pouch']
    },
    other: {
        emoji: '❓',
        label: 'Item',
        pluralLabel: 'Items',
        category: 'misc',
        skillAffinities: ['perception', 'inland_empire', 'interfacing'],
        keywords: []
    }
};

// ═══════════════════════════════════════════════════════════════
// ADDICTION SYSTEM
// ═══════════════════════════════════════════════════════════════

export const ADDICTION_TYPES = {
    nicotine: {
        name: 'Nicotine',
        statusId: 'nicotine_rush',
        withdrawalDebuff: ['composure', 'volition'],
        autoConsumeMessages: [
            'Your fingers move on their own. Another one. Just one more.',
            'The smoke fills your lungs before you even realize you\'ve lit it.',
            'One more won\'t hurt. What\'s one more?',
            'Your hand finds the pack. Old friend. Reliable friend.'
        ],
        emptyMessages: [
            'The pack is empty. EMPTY. Why didn\'t you buy more?',
            'No more. The last one is gone. This is a disaster.',
            'You crumple the empty pack. The void stares back.'
        ],
        satisfiedMessages: [
            'Ahhh. The sweet burn. Everything makes sense again.',
            'The smoke curls upward. A small death, a small resurrection.',
            'Nicotine hits. The world sharpens, then softens.'
        ]
    },
    alcohol: {
        name: 'Alcohol',
        statusId: 'revacholian_courage',
        withdrawalDebuff: ['authority', 'reaction_speed'],
        autoConsumeMessages: [
            'Hair of the dog. The only cure. Your hand finds the bottle.',
            'Just a little more. To take the edge off.',
            'The liquid courage calls to you. Who are you to refuse?',
            'One drink becomes two becomes the whole bottle.'
        ],
        emptyMessages: [
            'It\'s empty. The bottle is empty. This is very bad.',
            'You shake it. Nothing. The void where booze should be.',
            'Dry. Bone dry. The worst two words in any language.'
        ],
        satisfiedMessages: [
            'The warmth spreads. The world softens. You can handle anything now.',
            'Liquid fire. Liquid courage. Same thing really.',
            'Down the hatch. The edges blur beautifully.'
        ]
    },
    stimulants: {
        name: 'Stimulants',
        statusId: 'pyrholidon',
        withdrawalDebuff: ['reaction_speed', 'perception'],
        autoConsumeMessages: [
            'Stay awake. Stay alert. Stay ALIVE. Another pill.',
            'The crash is coming. Unless... yes. One more.',
            'Your neurons demand it. Who are you to argue with chemistry?',
            'Pop. Swallow. The world accelerates.'
        ],
        emptyMessages: [
            'No more. No more pills. The crash is coming. You can feel it.',
            'Empty bottle. Empty future. The weight descends.',
            'Gone. All gone. The slow creep of exhaustion begins.'
        ],
        satisfiedMessages: [
            'YES. The neurons fire. Time dilates. You are AWAKE.',
            'Everything clicks into place. Crystal clarity.',
            'The world sharpens. You could count the atoms.'
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Infer inventory type from item name
 * @param {string} name - Item name
 * @returns {string} Best-guess inventory type key
 */
export function inferInventoryType(name) {
    const nameLower = name.toLowerCase();
    
    for (const [type, data] of Object.entries(INVENTORY_TYPES)) {
        if (data.keywords && data.keywords.length > 0) {
            for (const keyword of data.keywords) {
                if (nameLower.includes(keyword)) {
                    return type;
                }
            }
        }
    }
    
    return 'other';
}

/**
 * Get category for an inventory type
 * @param {string} type - Inventory type key
 * @returns {string} Category key ('consumable' or 'misc')
 */
export function getItemCategory(type) {
    return INVENTORY_TYPES[type]?.category || 'misc';
}

/**
 * Check if item type is consumable
 * @param {string} type - Inventory type key
 * @returns {boolean}
 */
export function isConsumable(type) {
    return getItemCategory(type) === 'consumable';
}

/**
 * Check if item type is addictive
 * @param {string} type - Inventory type key
 * @returns {boolean}
 */
export function isAddictive(type) {
    return INVENTORY_TYPES[type]?.addictive === true;
}

/**
 * Get addiction data for an item type
 * @param {string} type - Inventory type key
 * @returns {object|null} Addiction type data or null
 */
export function getAddictionData(type) {
    const itemType = INVENTORY_TYPES[type];
    if (!itemType?.addictive || !itemType?.addictionType) return null;
    return ADDICTION_TYPES[itemType.addictionType] || null;
}

/**
 * Get skill affinities for an inventory type
 * @param {string} type - Inventory type key
 * @returns {string[]} Array of skill IDs
 */
export function getItemSkillAffinities(type) {
    return INVENTORY_TYPES[type]?.skillAffinities || INVENTORY_TYPES.other.skillAffinities;
}

/**
 * Get status effect ID for a consumable
 * @param {string} type - Inventory type key
 * @returns {string|null} Status effect ID or null
 */
export function getConsumableStatusId(type) {
    return INVENTORY_TYPES[type]?.statusId || null;
}

/**
 * Get random message from addiction type
 * @param {string} addictionType - 'nicotine', 'alcohol', or 'stimulants'
 * @param {string} messageType - 'autoConsume', 'empty', or 'satisfied'
 * @returns {string} Random message
 */
export function getAddictionMessage(addictionType, messageType) {
    const addiction = ADDICTION_TYPES[addictionType];
    if (!addiction) return '';
    
    const messages = {
        autoConsume: addiction.autoConsumeMessages,
        empty: addiction.emptyMessages,
        satisfied: addiction.satisfiedMessages
    };
    
    const arr = messages[messageType] || [];
    return arr[Math.floor(Math.random() * arr.length)] || '';
}

/**
 * Get emoji for inventory type
 * @param {string} type - Inventory type key
 * @returns {string} Emoji
 */
export function getInventoryEmoji(type) {
    return INVENTORY_TYPES[type]?.emoji || INVENTORY_TYPES.other.emoji;
}

/**
 * Get label for inventory type
 * @param {string} type - Inventory type key
 * @param {boolean} plural - Use plural form
 * @returns {string} Label
 */
export function getInventoryLabel(type, plural = false) {
    const typeData = INVENTORY_TYPES[type] || INVENTORY_TYPES.other;
    return plural ? typeData.pluralLabel : typeData.label;
}

// ═══════════════════════════════════════════════════════════════
// ITEM CREATION
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new inventory item
 * @param {object} params - Item parameters
 * @returns {object} Inventory item object
 */
export function createInventoryItem({
    name,
    type = null,
    quantity = 1,
    description = '',
    effect = null,
    voiceQuips = [],
    source = 'manual'
}) {
    // Auto-infer type if not provided
    const inferredType = type || inferInventoryType(name);
    const typeData = INVENTORY_TYPES[inferredType] || INVENTORY_TYPES.other;
    
    return {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name || 'Unknown Item',
        type: inferredType,
        category: typeData.category,
        quantity: Math.max(1, quantity),
        description: description || '',
        effect: effect || null, // { statusId, duration } for consumables
        voiceQuips: voiceQuips || [], // [{ skill, text, approves }]
        addictive: typeData.addictive || false,
        addictionType: typeData.addictionType || null,
        source: source, // 'extracted', 'manual', 'ai-generated'
        createdAt: Date.now()
    };
}

/**
 * Default inventory state
 */
export const DEFAULT_INVENTORY_STATE = {
    items: [],
    currency: 0,
    currencyUnit: 'réal',
    activeEffects: [], // [{ itemId, statusId, remainingDuration, addictionType }]
    addictionSettings: {
        autoConsume: true, // Electrochemistry auto-consumes when effect expires
        showWarnings: true // Show "running low" warnings
    },
    lastUpdated: null
};
