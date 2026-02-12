/**
 * The Tribunal - Equipment Generation
 * 
 * Uses api-helpers.js with CUSTOM TOKEN LIMIT
 * Equipment needs 3000+ tokens, voices only need 600
 * 
 * WARDROBE HISTORY - Items are cached forever
 * - First generation: API call, save to wardrobe
 * - Re-equip same item: Instant from cache, no API
 * 
 * FIXED: parseItems() now handles parentheses correctly
 * "Leather Jacket (worn, vintage)" stays as ONE item
 */

import { callAPIWithTokens } from './api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const EQUIPMENT_MAX_TOKENS = 3000;  // Much higher than voice's 600

const SKILL_REFERENCE = `
INTELLECT: logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus
PSYCHE: volition, inland_empire, empathy, authority, esprit_de_corps, suggestion
PHYSIQUE: endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light
MOTORICS: hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure
`;

const VALID_SKILLS = [
    'logic', 'encyclopedia', 'rhetoric', 'drama', 'conceptualization', 'visual_calculus',
    'volition', 'inland_empire', 'empathy', 'authority', 'esprit_de_corps', 'suggestion',
    'endurance', 'pain_threshold', 'physical_instrument', 'electrochemistry', 'shivers', 'half_light',
    'hand_eye_coordination', 'perception', 'reaction_speed', 'savoir_faire', 'interfacing', 'composure'
];

const EQUIPMENT_TYPES = [
    'hat', 'headwear', 'glasses', 'eyewear', 'mask',
    'jacket', 'coat', 'shirt', 'top', 'vest',
    'pants', 'trousers', 'shorts', 'skirt', 'dress',
    'shoes', 'boots', 'footwear', 'socks',
    'gloves', 'jewelry', 'ring', 'necklace', 'bracelet', 'earring',
    'watch', 'tie', 'scarf', 'belt',
    'bag', 'briefcase', 'backpack', 'wallet',
    'badge', 'pin', 'accessory', 'underwear', 'other'
];

// ═══════════════════════════════════════════════════════════════
// FIXED: PARENTHESIS-AWARE ITEM PARSER
// Replaces broken .split(/[+&,;|\/]/) 
// ═══════════════════════════════════════════════════════════════

/**
 * Parse item strings with parenthesis-aware splitting
 * "Leather Jacket (worn, vintage), Boots" → ["Leather Jacket (worn, vintage)", "Boots"]
 * 
 * @param {string} itemString - Raw item list string
 * @returns {string[]} Array of cleaned item names
 */
function parseItems(itemString) {
    if (!itemString || typeof itemString !== 'string') return [];
    
    let processed = itemString.trim();
    if (processed === '' || processed.toLowerCase() === 'none') return [];
    
    // Strip wrapping brackets/quotes
    while (
        (processed.startsWith('[') && processed.endsWith(']')) ||
        (processed.startsWith('{') && processed.endsWith('}')) ||
        (processed.startsWith('"') && processed.endsWith('"')) ||
        (processed.startsWith("'") && processed.endsWith("'"))
    ) {
        processed = processed.slice(1, -1).trim();
        if (processed === '' || processed.toLowerCase() === 'none') return [];
    }
    
    // Convert newlines to commas (outside parentheses)
    let withCommas = '';
    let parenDepth = 0;
    for (let i = 0; i < processed.length; i++) {
        const char = processed[i];
        if (char === '(') {
            parenDepth++;
            withCommas += char;
        } else if (char === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
            withCommas += char;
        } else if ((char === '\n' || char === '\r') && parenDepth === 0) {
            if (withCommas[withCommas.length - 1] !== ',') {
                withCommas += ',';
            }
        } else {
            withCommas += char;
        }
    }
    processed = withCommas;
    
    // Strip markdown: **bold**, *italic*, `code`
    processed = processed
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1');
    
    // Smart comma splitting - only split outside parentheses
    const items = [];
    let currentItem = '';
    parenDepth = 0;
    
    for (let i = 0; i < processed.length; i++) {
        const char = processed[i];
        
        if (char === '(') {
            parenDepth++;
            currentItem += char;
        } else if (char === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
            currentItem += char;
        } else if ((char === ',' || char === '+' || char === '|' || char === ';') && parenDepth === 0) {
            // Check for decimal comma (1,000)
            const prevChar = i > 0 ? processed[i - 1] : '';
            const nextChar = i < processed.length - 1 ? processed[i + 1] : '';
            const isDecimalComma = char === ',' && /\d/.test(prevChar) && /\d/.test(nextChar);
            
            if (isDecimalComma) {
                currentItem += char;
            } else {
                const cleaned = cleanItemName(currentItem);
                if (cleaned) items.push(cleaned);
                currentItem = '';
            }
        } else if (char === '&' && parenDepth === 0) {
            // Only split on & if surrounded by spaces
            const prevChar = i > 0 ? processed[i - 1] : '';
            const nextChar = i < processed.length - 1 ? processed[i + 1] : '';
            if (prevChar === ' ' && nextChar === ' ') {
                const cleaned = cleanItemName(currentItem);
                if (cleaned) items.push(cleaned);
                currentItem = '';
            } else {
                currentItem += char;
            }
        } else {
            currentItem += char;
        }
    }
    
    // Don't forget last item
    const cleaned = cleanItemName(currentItem);
    if (cleaned) items.push(cleaned);
    
    return items;
}

/**
 * Clean a single item name
 */
function cleanItemName(item) {
    if (!item || typeof item !== 'string') return null;
    
    let cleaned = item.trim();
    if (cleaned === '' || cleaned.toLowerCase() === 'none') return null;
    
    // Strip list markers: "- item", "1. item", "a) item"
    cleaned = cleaned.replace(/^[-•*]\s+/, '');
    cleaned = cleaned.replace(/^\d+\.\s+/, '');
    cleaned = cleaned.replace(/^[a-z]\)\s+/i, '');
    
    // Strip wrapping quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    if (cleaned === '' || cleaned.length < 2) return null;
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// ═══════════════════════════════════════════════════════════════
// WARDROBE KEY NORMALIZATION
// "Open Leather Jacket" → "open-leather-jacket"
// ═══════════════════════════════════════════════════════════════

export function normalizeWardrobeKey(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
        .replace(/\s+/g, '-')           // Spaces to dashes
        .replace(/-+/g, '-')            // Collapse multiple dashes
        .replace(/^-|-$/g, '');         // Trim dashes
}

// ═══════════════════════════════════════════════════════════════
// API CALL (uses api-helpers with custom token limit)
// ═══════════════════════════════════════════════════════════════

async function callEquipmentAPI(systemPrompt, userPrompt) {
    console.log('[Equipment API] Calling with', EQUIPMENT_MAX_TOKENS, 'max tokens');
    
    try {
        const result = await callAPIWithTokens(systemPrompt, userPrompt, EQUIPMENT_MAX_TOKENS);
        return result;
    } catch (error) {
        console.error('[Equipment API] Call failed:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK EXTRACTION (no AI - for finding item names)
// FIXED: Now uses parseItems() instead of broken .split()
// ═══════════════════════════════════════════════════════════════

/**
 * Extract clothing item names from text using AI
 * RPG Companion approach: AI understands context, regex doesn't
 * 
 * @param {string} text - Persona or message text
 * @returns {Promise<string[]>} Array of clothing item names
 */
export async function quickExtractItemNames(text) {
    if (!text) return [];
    
    console.log('[Equipment] AI-extracting clothing from text...');
    
    try {
        const items = await extractClothingWithAI(text);
        console.log('[Equipment] AI extracted:', items);
        return items;
    } catch (error) {
        console.warn('[Equipment] AI extraction failed, using fallback:', error.message);
        return fallbackExtractClothing(text);
    }
}

/**
 * AI-based clothing extraction (primary method)
 * Sends text to AI and asks for ONLY wearable items
 */
async function extractClothingWithAI(text) {
    const systemPrompt = `You extract ONLY wearable clothing and accessories from character descriptions.

EXTRACT these types of items:
- Garments: shirts, pants, jackets, coats, dresses, skirts, etc.
- Footwear: shoes, boots, sneakers, sandals, etc.
- Accessories: hats, glasses, scarves, belts, ties, etc.
- Jewelry: rings, necklaces, bracelets, earrings, watches, etc.
- Bags: backpacks, purses, briefcases, etc.

DO NOT extract:
- Physical features: face shape, body type, scars, tattoos, birthmarks
- Hair: hair color, hair style, facial hair, beards, mustaches
- Eyes: eye color, eye shape
- Skin: skin color, skin tone, complexion
- Body parts: arms, legs, hands, face
- Abstract descriptions: "ravaged look", "burst capillaries", "bloated face"
- Field labels: "Hair:", "Eyes:", "Appearance:"

Respond with ONLY a JSON array of item names, nothing else.
If no clothing items found, respond with: []`;

    const userPrompt = `Extract ONLY wearable clothing items from this text:

${text.substring(0, 2000)}

Respond with a JSON array of clothing item names only. Example: ["Black Leather Jacket", "Worn Jeans", "Combat Boots"]`;

    try {
        const response = await callAPIWithTokens(systemPrompt, userPrompt, 500);
        
        if (!response) return [];
        
        // Parse JSON response
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        
        if (arrayStart === -1 || arrayEnd === -1) return [];
        
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
        
        const items = JSON.parse(cleaned);
        
        if (!Array.isArray(items)) return [];
        
        // Clean and validate each item
        return items
            .filter(item => typeof item === 'string' && item.trim().length > 1)
            .map(item => {
                let clean = item.trim();
                // Capitalize first letter of each word
                return clean.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            })
            .filter(item => item.length > 1 && item.length < 60);
            
    } catch (error) {
        console.error('[Equipment] AI extraction parse error:', error);
        return [];
    }
}

/**
 * Fallback regex extraction - VERY strict, only high-confidence matches
 * Used when AI is unavailable
 */
function fallbackExtractClothing(text) {
    if (!text) return [];
    
    const items = [];
    const seen = new Set();
    
    // Only match explicit "wears/wearing [item]" patterns
    const wearingPatterns = [
        /(?:wears?|wearing)\s+(?:a|an|the)?\s*([^.,;!?\n]{3,40})/gi,
        /dressed\s+in\s+(?:a|an|the)?\s*([^.,;!?\n]{3,40})/gi,
    ];
    
    for (const pattern of wearingPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const item = match[1].trim();
            const normalized = normalizeItemName(item);
            
            if (normalized && 
                isDefinitelyClothing(normalized) && 
                !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    console.log('[Equipment] Fallback extracted:', items);
    return items;
}

/**
 * VERY strict clothing check - only high-confidence matches
 * Used for fallback when AI unavailable
 */
function isDefinitelyClothing(name) {
    if (!name || name.length < 3) return false;
    
    const lower = name.toLowerCase();
    
    // Must contain an actual clothing word
    const clothingWords = [
        'jacket', 'coat', 'shirt', 'blouse', 'top', 'sweater', 'hoodie', 'cardigan',
        'pants', 'jeans', 'trousers', 'shorts', 'slacks',
        'dress', 'skirt', 'gown',
        'suit', 'vest', 'blazer', 'tuxedo',
        'boots', 'shoes', 'sneakers', 'heels', 'sandals', 'loafers', 'flats',
        'hat', 'cap', 'beanie', 'fedora', 'beret',
        'glasses', 'sunglasses', 'shades',
        'gloves', 'mittens',
        'scarf', 'tie', 'belt', 'socks', 'stockings',
        'ring', 'necklace', 'bracelet', 'earring', 'watch', 'choker', 'pendant',
        'bag', 'backpack', 'purse', 'briefcase', 'wallet',
        'mask', 'bandana'
    ];
    
    for (const word of clothingWords) {
        if (lower.includes(word)) {
            return true;
        }
    }
    
    return false;
}

function normalizeItemName(raw) {
    if (!raw) return null;
    
    let cleaned = raw
        .trim()
        .replace(/^["'\[\(]+|["'\]\)\.]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (cleaned.length < 2) return null;
    
    // Capitalize each word
    return cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM GENERATION
// ═══════════════════════════════════════════════════════════════

export async function generateSingleItem(itemName, context = '') {
    console.log('[Equipment] Generating data for:', itemName);
    
    const genreIntro = getProfileValue('systemIntro', 
        'You are channeling the internal skill voices of a character.');
    const equipSection = getProfileValue('equipmentSectionName', 'The Wardrobe');
    
    const systemPrompt = `${genreIntro} Every item of clothing tells a story. The skills in your head all have opinions about what you wear.

Output ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate rich data for this clothing/accessory item, matching the tone of the setting:

ITEM: ${itemName}
CONTEXT: ${context || 'Part of the character\'s outfit'}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY this JSON structure:
{
  "name": "${itemName}",
  "type": "One of: hat, glasses, jacket, coat, shirt, pants, shoes, boots, gloves, ring, necklace, watch, tie, scarf, belt, bag, badge, mask, vest, other",
  "bonuses": {
    "skill_id": modifier
  },
  "description": "[SKILL_NAME] 2-3 sentence evocative description from that skill's perspective. Make it poetic and strange.",
  "voiceQuips": [
    {"skill": "skill_id", "text": "Approving one-liner", "approves": true},
    {"skill": "other_skill", "text": "Disapproving one-liner", "approves": false}
  ]
}

BONUS GUIDELINES (1-3 skills, values -2 to +2):
- Intimidating/tough → physical_instrument, authority, half_light
- Stylish/flashy → savoir_faire, drama, composure
- Worn/rugged → endurance, shivers, pain_threshold
- Tech/gadgets → interfacing, visual_calculus
- Weird/mystical → inland_empire, shivers, conceptualization
- Revealing/bold → drama, composure, electrochemistry

Generate 2 voice quips from different skills (one approving, one disapproving).`;

    try {
        const response = await callEquipmentAPI(systemPrompt, userPrompt);
        
        if (!response) {
            console.warn('[Equipment] No API response for:', itemName);
            return createFallbackItem(itemName);
        }
        
        const parsed = parseItemResponse(response, itemName);
        if (parsed) {
            console.log('[Equipment] ✓ Generated:', parsed.name);
            return parsed;
        }
        
        console.warn('[Equipment] Parse failed, using fallback for:', itemName);
        return createFallbackItem(itemName);
        
    } catch (error) {
        console.error('[Equipment] Generation error:', error);
        return createFallbackItem(itemName);
    }
}

// ═══════════════════════════════════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════════════════════════════════

export async function generateMultipleItems(itemNames, context = '') {
    if (!itemNames || itemNames.length === 0) return [];
    
    if (itemNames.length === 1) {
        const item = await generateSingleItem(itemNames[0], context);
        return item ? [item] : [];
    }
    
    console.log('[Equipment] Batch generating', itemNames.length, 'items');
    
    const genreIntro = getProfileValue('systemIntro', 
        'You are channeling the internal skill voices of a character.');
    
    const systemPrompt = `${genreIntro} Every item of clothing tells a story.

Output ONLY valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Generate data for these clothing/accessory items, matching the tone of the setting:

ITEMS: ${itemNames.join(', ')}
CONTEXT: ${context || 'Part of the character\'s outfit'}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY a JSON array:
[
  {
    "name": "Item Name",
    "type": "hat/glasses/jacket/coat/shirt/pants/shoes/boots/gloves/ring/necklace/watch/tie/scarf/belt/bag/badge/mask/vest/other",
    "bonuses": {"skill_id": modifier},
    "description": "[SKILL_NAME] Evocative description.",
    "voiceQuips": [{"skill": "skill_id", "text": "Quote", "approves": true}]
  }
]`;

    try {
        const response = await callEquipmentAPI(systemPrompt, userPrompt);
        
        if (!response) {
            return await generateItemsIndividually(itemNames, context);
        }
        
        const parsed = parseBatchResponse(response, itemNames);
        if (parsed && parsed.length > 0) {
            console.log('[Equipment] ✓ Batch generated', parsed.length, 'items');
            return parsed;
        }
        
        return await generateItemsIndividually(itemNames, context);
        
    } catch (error) {
        console.error('[Equipment] Batch error:', error);
        return await generateItemsIndividually(itemNames, context);
    }
}

async function generateItemsIndividually(itemNames, context) {
    const results = [];
    for (const name of itemNames) {
        const item = await generateSingleItem(name, context);
        if (item) results.push(item);
    }
    return results;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

function parseItemResponse(response, expectedName) {
    if (!response) return null;
    
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) return null;
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const data = JSON.parse(cleaned);
        return validateItem(data, expectedName);
    } catch (e) {
        try {
            const repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            const data = JSON.parse(repaired);
            return validateItem(data, expectedName);
        } catch (e2) {
            return null;
        }
    }
}

function parseBatchResponse(response, expectedNames) {
    if (!response) return [];
    
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    
    if (arrayStart === -1 || arrayEnd === -1) {
        const objStart = cleaned.indexOf('{');
        if (objStart !== -1) {
            try {
                const obj = JSON.parse(cleaned.slice(objStart));
                if (Array.isArray(obj.equipment)) {
                    return obj.equipment.map((item, i) => validateItem(item, expectedNames[i])).filter(Boolean);
                }
            } catch (e) {}
        }
        return [];
    }
    
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
    
    try {
        const data = JSON.parse(cleaned);
        if (!Array.isArray(data)) return [];
        return data.map((item, i) => validateItem(item, expectedNames[i] || item.name)).filter(Boolean);
    } catch (e) {
        try {
            const repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            const data = JSON.parse(repaired);
            if (!Array.isArray(data)) return [];
            return data.map((item, i) => validateItem(item, expectedNames[i] || item.name)).filter(Boolean);
        } catch (e2) {
            return [];
        }
    }
}

function validateItem(item, expectedName) {
    if (!item) return null;
    
    const validated = {
        name: item.name || expectedName || 'Unknown Item',
        type: normalizeType(item.type),
        bonuses: {},
        description: item.description || '',
        voiceQuips: [],
        source: 'ai-generated',
        generatedAt: Date.now()
    };
    
    if (item.bonuses && typeof item.bonuses === 'object') {
        for (const [skill, value] of Object.entries(item.bonuses)) {
            const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
            const numValue = parseInt(value, 10);
            if (VALID_SKILLS.includes(normalizedSkill) && !isNaN(numValue)) {
                validated.bonuses[normalizedSkill] = Math.max(-2, Math.min(2, numValue));
            }
        }
    }
    
    if (Array.isArray(item.voiceQuips)) {
        validated.voiceQuips = item.voiceQuips
            .filter(q => q && q.skill && q.text)
            .map(q => ({
                skill: q.skill.toLowerCase().replace(/\s+/g, '_'),
                text: q.text.trim(),
                approves: Boolean(q.approves)
            }))
            .slice(0, 3);
    }
    
    return validated;
}

function normalizeType(type) {
    if (!type) return 'other';
    const lower = type.toLowerCase().trim();
    
    if (EQUIPMENT_TYPES.includes(lower)) return lower;
    
    if (lower.includes('hat') || lower.includes('cap') || lower.includes('beanie')) return 'hat';
    if (lower.includes('glass') || lower.includes('shade')) return 'glasses';
    if (lower.includes('jacket') || lower.includes('hoodie')) return 'jacket';
    if (lower.includes('coat') || lower.includes('trench')) return 'coat';
    if (lower.includes('shirt') || lower.includes('top') || lower.includes('tee') || lower.includes('mesh')) return 'shirt';
    if (lower.includes('pant') || lower.includes('jean') || lower.includes('trouser')) return 'pants';
    if (lower.includes('boot')) return 'boots';
    if (lower.includes('shoe') || lower.includes('sneaker')) return 'shoes';
    if (lower.includes('glove')) return 'gloves';
    if (lower.includes('ring')) return 'ring';
    if (lower.includes('necklace') || lower.includes('chain')) return 'necklace';
    if (lower.includes('watch')) return 'watch';
    if (lower.includes('bag') || lower.includes('briefcase')) return 'bag';
    if (lower.includes('badge') || lower.includes('pin')) return 'badge';
    if (lower.includes('mask')) return 'mask';
    
    return 'other';
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK ITEM (when AI fails)
// ═══════════════════════════════════════════════════════════════

function createFallbackItem(name) {
    return {
        name: name,
        type: inferTypeFromName(name),
        bonuses: {},
        description: `A ${name.toLowerCase()}. It's yours.`,
        voiceQuips: [],
        source: 'fallback',
        generatedAt: Date.now()
    };
}

function inferTypeFromName(name) {
    const lower = name.toLowerCase();
    
    if (lower.includes('jacket') || lower.includes('hoodie')) return 'jacket';
    if (lower.includes('coat')) return 'coat';
    if (lower.includes('shirt') || lower.includes('top') || lower.includes('mesh')) return 'shirt';
    if (lower.includes('pants') || lower.includes('jeans')) return 'pants';
    if (lower.includes('boots')) return 'boots';
    if (lower.includes('shoes') || lower.includes('sneakers')) return 'shoes';
    if (lower.includes('hat') || lower.includes('cap')) return 'hat';
    if (lower.includes('glasses') || lower.includes('shades')) return 'glasses';
    if (lower.includes('gloves')) return 'gloves';
    if (lower.includes('watch')) return 'watch';
    if (lower.includes('ring')) return 'ring';
    if (lower.includes('necklace') || lower.includes('chain')) return 'necklace';
    if (lower.includes('bag') || lower.includes('backpack')) return 'bag';
    if (lower.includes('mask')) return 'mask';
    
    return 'other';
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    normalizeWardrobeKey,
    quickExtractItemNames,
    generateSingleItem,
    generateMultipleItems,
    parseItems  // Exported for testing/reuse
};
