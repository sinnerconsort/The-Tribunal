/**
 * The Tribunal - Equipment Data Definitions
 * Clothing and accessories with stat bonuses and voice affinity
 * 
 * No slot limits - narrative-driven inventory
 * "If the story says you're wearing 10 rings, you're wearing 10 rings"
 */

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT TYPES & EMOJIS
// ═══════════════════════════════════════════════════════════════

export const EQUIPMENT_TYPES = {
    hat: { emoji: '🎩', label: 'Hat', pluralLabel: 'Hats' },
    glasses: { emoji: '👓', label: 'Glasses', pluralLabel: 'Glasses' },
    mask: { emoji: '🎭', label: 'Mask', pluralLabel: 'Masks' },
    jacket: { emoji: '🧥', label: 'Jacket', pluralLabel: 'Jackets' },
    coat: { emoji: '🧥', label: 'Coat', pluralLabel: 'Coats' },
    shirt: { emoji: '👔', label: 'Shirt', pluralLabel: 'Shirts' },
    vest: { emoji: '🦺', label: 'Vest', pluralLabel: 'Vests' },
    pants: { emoji: '👖', label: 'Pants', pluralLabel: 'Pants' },
    shorts: { emoji: '🩳', label: 'Shorts', pluralLabel: 'Shorts' },
    skirt: { emoji: '👗', label: 'Skirt', pluralLabel: 'Skirts' },
    dress: { emoji: '👗', label: 'Dress', pluralLabel: 'Dresses' },
    shoes: { emoji: '👞', label: 'Shoes', pluralLabel: 'Shoes' },
    boots: { emoji: '🥾', label: 'Boots', pluralLabel: 'Boots' },
    sneakers: { emoji: '👟', label: 'Sneakers', pluralLabel: 'Sneakers' },
    socks: { emoji: '🧦', label: 'Socks', pluralLabel: 'Socks' },
    gloves: { emoji: '🧤', label: 'Gloves', pluralLabel: 'Gloves' },
    scarf: { emoji: '🧣', label: 'Scarf', pluralLabel: 'Scarves' },
    tie: { emoji: '👔', label: 'Tie', pluralLabel: 'Ties' },
    belt: { emoji: '🪢', label: 'Belt', pluralLabel: 'Belts' },
    watch: { emoji: '⌚', label: 'Watch', pluralLabel: 'Watches' },
    ring: { emoji: '💍', label: 'Ring', pluralLabel: 'Rings' },
    necklace: { emoji: '📿', label: 'Necklace', pluralLabel: 'Necklaces' },
    bracelet: { emoji: '📿', label: 'Bracelet', pluralLabel: 'Bracelets' },
    earring: { emoji: '💎', label: 'Earring', pluralLabel: 'Earrings' },
    badge: { emoji: '🪪', label: 'Badge', pluralLabel: 'Badges' },
    bag: { emoji: '👜', label: 'Bag', pluralLabel: 'Bags' },
    backpack: { emoji: '🎒', label: 'Backpack', pluralLabel: 'Backpacks' },
    wallet: { emoji: '👛', label: 'Wallet', pluralLabel: 'Wallets' },
    underwear: { emoji: '🩲', label: 'Underwear', pluralLabel: 'Underwear' },
    other: { emoji: '📦', label: 'Other', pluralLabel: 'Other' }
};

// ═══════════════════════════════════════════════════════════════
// SKILL AFFINITIES FOR EQUIPMENT
// Which skills "vibe" with which equipment types
// ═══════════════════════════════════════════════════════════════

export const EQUIPMENT_SKILL_AFFINITIES = {
    // Headwear
    hat: ['authority', 'composure', 'savoir_faire'],
    glasses: ['perception', 'logic', 'encyclopedia'],
    mask: ['drama', 'inland_empire', 'composure'],
    
    // Outerwear
    jacket: ['composure', 'authority', 'half_light'],
    coat: ['composure', 'shivers', 'authority'],
    
    // Tops
    shirt: ['composure', 'suggestion', 'empathy'],
    vest: ['authority', 'composure', 'logic'],
    tie: ['authority', 'rhetoric', 'composure'],
    
    // Bottoms
    pants: ['composure', 'savoir_faire', 'authority'],
    shorts: ['electrochemistry', 'savoir_faire', 'physical_instrument'],
    skirt: ['suggestion', 'drama', 'composure'],
    dress: ['suggestion', 'drama', 'empathy'],
    
    // Footwear
    shoes: ['composure', 'authority', 'savoir_faire'],
    boots: ['authority', 'physical_instrument', 'endurance'],
    sneakers: ['savoir_faire', 'reaction_speed', 'hand_eye_coordination'],
    socks: ['endurance', 'composure', 'inland_empire'],
    
    // Accessories
    gloves: ['interfacing', 'hand_eye_coordination', 'composure'],
    scarf: ['composure', 'shivers', 'empathy'],
    belt: ['authority', 'composure', 'physical_instrument'],
    watch: ['perception', 'logic', 'composure'],
    
    // Jewelry
    ring: ['inland_empire', 'suggestion', 'empathy'],
    necklace: ['suggestion', 'drama', 'inland_empire'],
    bracelet: ['suggestion', 'electrochemistry', 'inland_empire'],
    earring: ['suggestion', 'perception', 'drama'],
    
    // Functional
    badge: ['authority', 'esprit_de_corps', 'rhetoric'],
    bag: ['interfacing', 'perception', 'logic'],
    backpack: ['endurance', 'interfacing', 'physical_instrument'],
    wallet: ['interfacing', 'logic', 'perception'],
    
    // Other
    underwear: ['electrochemistry', 'composure', 'endurance'],
    other: ['inland_empire', 'conceptualization', 'perception']
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT EQUIPMENT STATE
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_EQUIPMENT_STATE = {
    items: [],           // All equipment items
    ticketNumber: null,  // Randomly generated on first use
    lastUpdated: null
};

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT ITEM STRUCTURE
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new equipment item
 * @param {Object} params - Item parameters
 * @returns {Object} Equipment item object
 */
export function createEquipmentItem({
    name,
    type = 'other',
    description = '',
    bonuses = {},
    voiceQuips = [],
    equipped = true,
    source = 'manual'
}) {
    return {
        id: `equip_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name || 'Unknown Item',
        type: EQUIPMENT_TYPES[type] ? type : 'other',
        description: description || '',
        bonuses: bonuses || {},      // { composure: 1, authority: -1 }
        voiceQuips: voiceQuips || [], // [{ skill: 'composure', text: '...' }]
        equipped: equipped !== false,
        source: source,              // 'extracted', 'manual', 'ai-generated'
        createdAt: Date.now()
    };
}

/**
 * Get the emoji for an equipment type
 * @param {string} type - Equipment type key
 * @returns {string} Emoji character
 */
export function getEquipmentEmoji(type) {
    return EQUIPMENT_TYPES[type]?.emoji || EQUIPMENT_TYPES.other.emoji;
}

/**
 * Get the label for an equipment type
 * @param {string} type - Equipment type key
 * @param {boolean} plural - Whether to use plural form
 * @returns {string} Type label
 */
export function getEquipmentLabel(type, plural = false) {
    const typeData = EQUIPMENT_TYPES[type] || EQUIPMENT_TYPES.other;
    return plural ? typeData.pluralLabel : typeData.label;
}

/**
 * Get skill affinities for an equipment type
 * @param {string} type - Equipment type key
 * @returns {string[]} Array of skill IDs that vibe with this type
 */
export function getSkillAffinities(type) {
    return EQUIPMENT_SKILL_AFFINITIES[type] || EQUIPMENT_SKILL_AFFINITIES.other;
}

/**
 * Infer equipment type from item name
 * @param {string} name - Item name
 * @returns {string} Best-guess equipment type
 */
export function inferEquipmentType(name) {
    const nameLower = name.toLowerCase();
    
    // Check each type's keywords
    const typeKeywords = {
        hat: ['hat', 'cap', 'beanie', 'fedora', 'beret', 'hood', 'headband'],
        glasses: ['glasses', 'sunglasses', 'spectacles', 'shades', 'goggles', 'monocle'],
        mask: ['mask', 'balaclava', 'bandana'],
        jacket: ['jacket', 'blazer', 'hoodie', 'cardigan', 'sweater', 'jumper'],
        coat: ['coat', 'overcoat', 'trench', 'parka', 'raincoat'],
        shirt: ['shirt', 't-shirt', 'tee', 'blouse', 'top', 'tank top', 'polo'],
        vest: ['vest', 'waistcoat', 'gilet'],
        pants: ['pants', 'trousers', 'jeans', 'slacks', 'chinos'],
        shorts: ['shorts', 'trunks'],
        skirt: ['skirt'],
        dress: ['dress', 'gown', 'robe'],
        shoes: ['shoes', 'loafers', 'oxfords', 'heels', 'flats', 'sandals'],
        boots: ['boots', 'combat boots', 'ankle boots'],
        sneakers: ['sneakers', 'trainers', 'running shoes'],
        socks: ['socks', 'stockings'],
        gloves: ['gloves', 'mittens'],
        scarf: ['scarf', 'shawl', 'wrap'],
        tie: ['tie', 'necktie', 'bowtie', 'bow tie', 'cravat'],
        belt: ['belt', 'suspenders'],
        watch: ['watch', 'wristwatch', 'timepiece'],
        ring: ['ring', 'band', 'signet'],
        necklace: ['necklace', 'chain', 'pendant', 'choker', 'locket'],
        bracelet: ['bracelet', 'bangle', 'wristband', 'cuff'],
        earring: ['earring', 'ear ring', 'stud', 'hoop'],
        badge: ['badge', 'pin', 'brooch', 'medal', 'insignia'],
        bag: ['bag', 'purse', 'handbag', 'satchel', 'tote'],
        backpack: ['backpack', 'rucksack', 'knapsack'],
        wallet: ['wallet', 'billfold', 'money clip'],
        underwear: ['underwear', 'boxers', 'briefs', 'panties', 'bra', 'undershirt']
    };
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword)) {
                return type;
            }
        }
    }
    
    return 'other';
}

/**
 * Format stat bonuses for display
 * @param {Object} bonuses - { skillId: modifier }
 * @returns {string} Formatted string like "+1 COMP, -1 AUTH"
 */
export function formatBonuses(bonuses) {
    if (!bonuses || Object.keys(bonuses).length === 0) return '';
    
    const SKILL_ABBREVS = {
        logic: 'LOG', encyclopedia: 'ENC', rhetoric: 'RHET', drama: 'DRAMA',
        conceptualization: 'CONC', visual_calculus: 'VCAL',
        volition: 'VOL', inland_empire: 'INLE', empathy: 'EMP', authority: 'AUTH',
        suggestion: 'SUGG', esprit_de_corps: 'ESPR',
        endurance: 'END', pain_threshold: 'PAIN', physical_instrument: 'PHYS',
        electrochemistry: 'ELEC', half_light: 'HALF', shivers: 'SHIV',
        hand_eye_coordination: 'H/E', perception: 'PERC', reaction_speed: 'REAC',
        savoir_faire: 'SAV', interfacing: 'INTE', composure: 'COMP'
    };
    
    return Object.entries(bonuses)
        .filter(([_, mod]) => mod !== 0)
        .map(([skill, mod]) => {
            const abbrev = SKILL_ABBREVS[skill] || skill.toUpperCase().substr(0, 4);
            const sign = mod > 0 ? '+' : '';
            return `${sign}${mod} ${abbrev}`;
        })
        .join(', ');
}

/**
 * Generate a random Martinaise Cleaners ticket number
 * @returns {number} 4-digit ticket number
 */
export function generateTicketNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}
