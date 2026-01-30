/**
 * The Tribunal - Inventory Generation
 * AI-powered item descriptions and voice commentary
 * 
 * "Everything in these pockets tells a story." — Perception
 */

import {
    INVENTORY_TYPES,
    inferInventoryType,
    getItemSkillAffinities,
    isConsumable,
    isAddictive,
    createInventoryItem
} from '../data/inventory.js';

// ═══════════════════════════════════════════════════════════════
// SKILL DATA (minimal subset for generation)
// ═══════════════════════════════════════════════════════════════

const SKILL_INFO = {
    logic: { name: 'Logic', personality: 'analytical, precise, skeptical' },
    encyclopedia: { name: 'Encyclopedia', personality: 'knowledgeable, tangential, eager to share facts' },
    rhetoric: { name: 'Rhetoric', personality: 'persuasive, argumentative, sees angles' },
    drama: { name: 'Drama', personality: 'theatrical, paranoid about lies, performative' },
    conceptualization: { name: 'Conceptualization', personality: 'artistic, abstract, sees deeper meaning' },
    visual_calculus: { name: 'Visual Calculus', personality: 'reconstructive, spatial, analytical' },
    volition: { name: 'Volition', personality: 'encouraging, warns of temptation, protective' },
    inland_empire: { name: 'Inland Empire', personality: 'mystical, cryptic, sees hidden truths' },
    empathy: { name: 'Empathy', personality: 'compassionate, reads emotional history' },
    authority: { name: 'Authority', personality: 'commanding, judges power dynamics' },
    suggestion: { name: 'Suggestion', personality: 'manipulative, sees how things could be used' },
    esprit_de_corps: { name: 'Esprit de Corps', personality: 'cop solidarity, senses police history' },
    endurance: { name: 'Endurance', personality: 'stoic, practical about survival' },
    pain_threshold: { name: 'Pain Threshold', personality: 'masochistic, appreciates suffering' },
    physical_instrument: { name: 'Physical Instrument', personality: 'brutish, respects strength' },
    electrochemistry: { name: 'Electrochemistry', personality: 'hedonistic, craves pleasure, addiction-focused' },
    half_light: { name: 'Half Light', personality: 'paranoid, fight-or-flight, sees threats' },
    shivers: { name: 'Shivers', personality: 'mystical connection to the city, poetic' },
    hand_eye_coordination: { name: 'Hand/Eye Coordination', personality: 'precise, appreciates fine motor control' },
    perception: { name: 'Perception', personality: 'notices details, sensory-focused' },
    reaction_speed: { name: 'Reaction Speed', personality: 'quick, impatient, action-oriented' },
    savoir_faire: { name: 'Savoir Faire', personality: 'cool, stylish, appreciates flair' },
    interfacing: { name: 'Interfacing', personality: 'mechanical intuition, loves gadgets' },
    composure: { name: 'Composure', personality: 'appearance-conscious, judges presentation' }
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build prompt for single item generation
 * @param {string} itemName - Name of the item
 * @param {string} type - Item type
 * @param {number} quantity - Quantity (for context)
 * @returns {string} System prompt
 */
function buildItemPrompt(itemName, type, quantity = 1) {
    const typeData = INVENTORY_TYPES[type] || INVENTORY_TYPES.other;
    const affinities = getItemSkillAffinities(type);
    const consumable = isConsumable(type);
    const addictive = isAddictive(type);
    
    // Get skill info for affinities
    const affinityInfo = affinities
        .filter(s => SKILL_INFO[s])
        .map(s => `${SKILL_INFO[s].name} (${SKILL_INFO[s].personality})`)
        .join(', ');
    
    let prompt = `You are generating an inventory item for a Disco Elysium-inspired game.

ITEM: "${itemName}" (${typeData.label})
${quantity > 1 ? `QUANTITY: ${quantity}` : ''}
${consumable ? 'TYPE: Consumable' : 'TYPE: Miscellaneous'}
${addictive ? 'WARNING: This is an addictive substance.' : ''}

Generate a JSON response with:
1. A short, evocative description (2-3 sentences, Disco Elysium style - world-weary, poetic, slightly absurd)
2. Two voice quips from skills that would have opinions about this item

Skill affinities for this item type: ${affinityInfo}

RESPONSE FORMAT (JSON only, no markdown):
{
  "description": "The item description here.",
  "voiceQuips": [
    { "skill": "skill_id", "text": "The quip text", "approves": true/false },
    { "skill": "skill_id", "text": "The quip text", "approves": true/false }
  ]
}

RULES:
- Description should be 2-3 sentences, evocative but concise
- Voice quips should be SHORT (under 15 words)
- One quip should approve/like the item, one should disapprove/warn about it
- Use skill_id format (e.g., "inland_empire", "electrochemistry")
- ${addictive ? 'ELECTROCHEMISTRY MUST be one of the voices and must APPROVE' : ''}
- Keep the tone darkly humorous, melancholic, philosophical
`;

    return prompt;
}

/**
 * Build prompt for batch item extraction
 * @param {string} text - Text to extract items from
 * @returns {string} System prompt
 */
function buildExtractionPrompt(text) {
    return `Extract inventory items from the following scene text. Look for objects that could be picked up, pocketed, or otherwise acquired.

TEXT:
${text}

For each item found, provide:
- name: Short descriptive name
- quantity: Number (default 1)
- type: One of: cigarettes, alcohol, stimulants, medicine, food, evidence, key, document, book, tool, weapon, photo, trinket, container, other

RESPONSE FORMAT (JSON array, no markdown):
[
  { "name": "Item Name", "quantity": 1, "type": "type_key" }
]

RULES:
- Only include items that could realistically be picked up
- Be specific about names (e.g., "Crumpled Pack of Astras" not just "Cigarettes")
- Include quantity when mentioned (e.g., "10x Cigarettes")
- Don't include large furniture, people, or abstract concepts
- Maximum 10 items
`;
}

// ═══════════════════════════════════════════════════════════════
// GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate full item data with description and quips
 * @param {string} itemName - Item name
 * @param {number} quantity - Quantity
 * @param {string} typeOverride - Optional type override
 * @returns {Promise<object|null>} Generated item or null
 */
export async function generateItemData(itemName, quantity = 1, typeOverride = null) {
    const type = typeOverride || inferInventoryType(itemName);
    
    try {
        // Try to use the API helper if available
        let apiHelper;
        try {
            apiHelper = await import('./api-helpers.js');
        } catch (e) {
            console.warn('[Inventory Gen] API helpers not available');
            return createFallbackItem(itemName, quantity, type);
        }
        
        const prompt = buildItemPrompt(itemName, type, quantity);
        const response = await apiHelper.generateWithPrompt(prompt);
        
        if (!response) {
            return createFallbackItem(itemName, quantity, type);
        }
        
        // Parse JSON response
        let parsed;
        try {
            // Clean up potential markdown wrapping
            const cleaned = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.warn('[Inventory Gen] Failed to parse response:', e);
            return createFallbackItem(itemName, quantity, type);
        }
        
        // Create item with generated data
        return createInventoryItem({
            name: itemName,
            type,
            quantity,
            description: parsed.description || '',
            voiceQuips: parsed.voiceQuips || [],
            source: 'ai-generated'
        });
        
    } catch (e) {
        console.error('[Inventory Gen] Generation failed:', e);
        return createFallbackItem(itemName, quantity, type);
    }
}

/**
 * Extract items from scene text
 * @param {string} text - Scene text
 * @returns {Promise<array>} Array of extracted item data
 */
export async function extractItemsFromText(text) {
    try {
        let apiHelper;
        try {
            apiHelper = await import('./api-helpers.js');
        } catch (e) {
            console.warn('[Inventory Gen] API helpers not available');
            return quickExtractItems(text);
        }
        
        const prompt = buildExtractionPrompt(text);
        const response = await apiHelper.generateWithPrompt(prompt);
        
        if (!response) {
            return quickExtractItems(text);
        }
        
        // Parse JSON response
        let parsed;
        try {
            const cleaned = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.warn('[Inventory Gen] Failed to parse extraction:', e);
            return quickExtractItems(text);
        }
        
        return Array.isArray(parsed) ? parsed : [];
        
    } catch (e) {
        console.error('[Inventory Gen] Extraction failed:', e);
        return quickExtractItems(text);
    }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK / QUICK EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Create fallback item without AI generation
 * @param {string} name - Item name
 * @param {number} quantity - Quantity
 * @param {string} type - Item type
 * @returns {object} Item data
 */
function createFallbackItem(name, quantity, type) {
    const typeData = INVENTORY_TYPES[type] || INVENTORY_TYPES.other;
    
    // Generate basic description
    const descriptions = {
        cigarettes: 'A familiar weight in your pocket. The smell of smoke clings to them.',
        alcohol: 'The promise of oblivion, bottled and portable.',
        stimulants: 'Chemical clarity in pill form. Your neurons await.',
        medicine: 'Basic supplies for basic survival. Nothing more.',
        food: 'Sustenance. Your body requires it, even if your soul doesn\'t.',
        evidence: 'Something that might mean something. Or nothing at all.',
        key: 'A small metal promise. Somewhere, a lock waits.',
        document: 'Words on paper. Someone thought they mattered.',
        book: 'Knowledge, compressed. Wisdom, maybe.',
        tool: 'Function over form. It does what it\'s meant to do.',
        weapon: 'The potential for violence, made manifest.',
        photo: 'A frozen moment. Someone\'s memory, now yours.',
        trinket: 'An object with no purpose except to exist.',
        container: 'A thing that holds other things.',
        other: 'An object. Its purpose unclear, its meaning uncertain.'
    };
    
    return createInventoryItem({
        name,
        type,
        quantity,
        description: descriptions[type] || descriptions.other,
        voiceQuips: generateFallbackQuips(type),
        source: 'fallback'
    });
}

/**
 * Generate basic fallback quips
 * @param {string} type - Item type
 * @returns {array} Voice quips
 */
function generateFallbackQuips(type) {
    const quipSets = {
        cigarettes: [
            { skill: 'electrochemistry', text: 'Yes. YES. Light it. Light it now.', approves: true },
            { skill: 'endurance', text: 'Your lungs have opinions about this.', approves: false }
        ],
        alcohol: [
            { skill: 'electrochemistry', text: 'The answer to everything. Drink.', approves: true },
            { skill: 'volition', text: 'You know where this leads.', approves: false }
        ],
        stimulants: [
            { skill: 'electrochemistry', text: 'Chemical enhancement. Beautiful.', approves: true },
            { skill: 'logic', text: 'This will have consequences.', approves: false }
        ],
        medicine: [
            { skill: 'endurance', text: 'Keep the machine running.', approves: true },
            { skill: 'pain_threshold', text: 'Pain builds character.', approves: false }
        ],
        food: [
            { skill: 'electrochemistry', text: 'Fuel for more adventures.', approves: true },
            { skill: 'composure', text: 'Eating on the job. Unprofessional.', approves: false }
        ],
        evidence: [
            { skill: 'logic', text: 'This could be important.', approves: true },
            { skill: 'inland_empire', text: 'It knows you touched it.', approves: false }
        ],
        weapon: [
            { skill: 'half_light', text: 'Good. Now you\'re ready.', approves: true },
            { skill: 'empathy', text: 'Violence solves nothing.', approves: false }
        ]
    };
    
    return quipSets[type] || [
        { skill: 'perception', text: 'You have this now.', approves: true },
        { skill: 'logic', text: 'Is this necessary?', approves: false }
    ];
}

/**
 * Quick keyword-based item extraction (no AI)
 * @param {string} text - Text to scan
 * @returns {array} Extracted items
 */
export function quickExtractItems(text) {
    const items = [];
    const textLower = text.toLowerCase();
    
    // Keyword patterns with quantity detection
    const patterns = [
        { pattern: /(\d+)\s*(?:x\s*)?(cigarette|cig|smoke)/gi, type: 'cigarettes', nameGen: (m) => `${m[1]}x Cigarettes` },
        { pattern: /pack\s+of\s+(\w+)/gi, type: 'cigarettes', nameGen: (m) => `Pack of ${m[1]}` },
        { pattern: /bottle\s+of\s+(\w+)/gi, type: 'alcohol', nameGen: (m) => `Bottle of ${m[1]}` },
        { pattern: /(beer|wine|vodka|whiskey|liquor)/gi, type: 'alcohol', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(pill|capsule|tablet)s?/gi, type: 'stimulants', nameGen: () => 'Pills' },
        { pattern: /(bandage|medkit|medicine|aspirin)/gi, type: 'medicine', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(sandwich|coffee|food|snack|candy)/gi, type: 'food', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(key|keycard)/gi, type: 'key', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(gun|pistol|knife|revolver)/gi, type: 'weapon', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(note|letter|document|paper)/gi, type: 'document', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(photo|photograph|picture)/gi, type: 'photo', nameGen: (m) => capitalize(m[1]) },
        { pattern: /(lighter|flashlight|tool)/gi, type: 'tool', nameGen: (m) => capitalize(m[1]) }
    ];
    
    for (const { pattern, type, nameGen } of patterns) {
        const matches = [...textLower.matchAll(new RegExp(pattern))];
        for (const match of matches.slice(0, 2)) { // Max 2 per type
            const name = nameGen(match);
            if (!items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
                items.push({
                    name,
                    quantity: parseInt(match[1]) || 1,
                    type
                });
            }
        }
    }
    
    return items.slice(0, 10);
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
