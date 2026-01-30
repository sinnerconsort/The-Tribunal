/**
 * The Tribunal - Inventory Generation
 * 
 * Uses api-helpers.js with CUSTOM TOKEN LIMIT
 * Mirrors equipment-generation.js patterns exactly
 * 
 * STASH HISTORY - Items are cached forever
 * - First generation: API call, save to stash
 * - Re-add same item: Instant from cache, no API
 */

import { callAPIWithTokens } from './api-helpers.js';
import { 
    INVENTORY_TYPES, 
    inferInventoryType, 
    isConsumable, 
    isAddictive, 
    getAddictionData,
    createInventoryItem 
} from '../data/inventory.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const INVENTORY_MAX_TOKENS = 2000;  // Less than equipment since simpler items

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

// ═══════════════════════════════════════════════════════════════
// STASH KEY NORMALIZATION (mirrors wardrobe key)
// "Pack of Astras" → "pack-of-astras"
// ═══════════════════════════════════════════════════════════════

export function normalizeStashKey(name) {
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

/**
 * Make API call for inventory generation
 * Uses The Tribunal's configured profile with moderate token limit
 */
async function callInventoryAPI(systemPrompt, userPrompt) {
    console.log('[Inventory API] Calling with', INVENTORY_MAX_TOKENS, 'max tokens');
    
    try {
        const result = await callAPIWithTokens(systemPrompt, userPrompt, INVENTORY_MAX_TOKENS);
        return result;
    } catch (error) {
        console.error('[Inventory API] Call failed:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK EXTRACTION (no AI - for finding item names)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract inventory item names from text without AI
 * Used to find what items exist, then check stash/generate
 */
export function quickExtractItemNames(text) {
    if (!text) return [];
    
    const items = [];
    const seen = new Set();
    
    // Pattern 1: Inventory: ["item, item, item"]
    const inventoryMatch = text.match(/Inventory\s*:?\s*\[?"?([^\]"]+)"?\]?/i);
    if (inventoryMatch) {
        const rawItems = inventoryMatch[1].split(/[+&,;|\/]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const item of rawItems) {
            const normalized = normalizeItemName(item);
            if (normalized && !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    // Pattern 2: Items: [...] or Carrying: [...]
    const itemsMatch = text.match(/(?:Items|Carrying|Possessions|Belongings)\s*:?\s*\[?"?([^\]"]+)"?\]?/i);
    if (itemsMatch) {
        const rawItems = itemsMatch[1].split(/[+&,;|\/]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const item of rawItems) {
            const normalized = normalizeItemName(item);
            if (normalized && !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    // Pattern 3: Common consumables in prose
    const consumablePatterns = [
        /(\d+x?\s*)?(?:pack(?:s)?\s+of\s+)?cigarette(?:s)?/gi,
        /(\d+x?\s*)?(?:bottle(?:s)?\s+of\s+)?(?:beer|wine|whiskey|vodka|alcohol|booze)/gi,
        /(\d+x?\s*)?(?:can(?:s)?\s+of\s+)?(?:beer|soda|cola)/gi,
        /(\d+x?\s*)?pill(?:s)?/gi,
        /(\d+x?\s*)?(?:bag(?:s)?\s+of\s+)?(?:speed|amphetamine|pyrholidon)/gi,
        /lighter(?:s)?/gi,
        /match(?:es)?/gi,
        /key(?:s)?/gi,
        /wallet/gi,
        /phone/gi,
        /flashlight/gi,
        /knife|gun|pistol|weapon/gi,
        /note(?:s)?|letter(?:s)?|document(?:s)?/gi,
        /coin(?:s)?|money|cash|réal/gi,
        /photo(?:s)?|photograph(?:s)?/gi,
        /book(?:s)?/gi,
        /food|sandwich|snack/gi
    ];
    
    for (const pattern of consumablePatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const normalized = normalizeItemName(match[0]);
            if (normalized && normalized.length > 2 && !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    // Pattern 4: "pulls out a/an [item]" or "grabs a/an [item]" in prose
    const actionMatches = text.matchAll(/(?:pulls?\s+out|grabs?|picks?\s+up|takes?|holds?)\s+(?:a|an|the|some|his|her|their)?\s*([^.,;!?\n]+)/gi);
    for (const match of actionMatches) {
        const normalized = normalizeItemName(match[1]);
        if (normalized && normalized.length > 2 && normalized.split(' ').length <= 5 && !seen.has(normalized.toLowerCase())) {
            // Check if it looks like an inventory item
            const type = inferInventoryType(normalized);
            if (type !== 'other') {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    console.log('[Inventory] Quick extracted items:', items);
    return items;
}

/**
 * Extract items with quantities from text
 * Returns array of { name, quantity }
 */
export function quickExtractItemsWithQuantity(text) {
    if (!text) return [];
    
    const items = [];
    const seen = new Set();
    
    // Pattern: "Nx item" or "N item(s)" or "N x item"
    const quantityPatterns = [
        /(\d+)\s*x?\s*(cigarette(?:s)?|pack(?:s)?\s+of\s+cigarette(?:s)?)/gi,
        /(\d+)\s*x?\s*(pill(?:s)?)/gi,
        /(\d+)\s*x?\s*(bottle(?:s)?(?:\s+of\s+\w+)?)/gi,
        /(\d+)\s*x?\s*(coin(?:s)?|réal)/gi,
        /(\d+)\s*x?\s*(\w+(?:\s+\w+)?)/gi  // Generic "N item"
    ];
    
    for (const pattern of quantityPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const qty = parseInt(match[1], 10) || 1;
            const name = normalizeItemName(match[2]);
            if (name && !seen.has(name.toLowerCase())) {
                seen.add(name.toLowerCase());
                items.push({ name, quantity: qty });
            }
        }
    }
    
    // Also get items without explicit quantities (assume 1)
    const simpleItems = quickExtractItemNames(text);
    for (const name of simpleItems) {
        if (!seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            items.push({ name, quantity: 1 });
        }
    }
    
    return items;
}

function normalizeItemName(raw) {
    if (!raw) return null;
    
    let cleaned = raw
        .trim()
        .replace(/^["'\[\(]+|["'\]\)\.]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (cleaned.length < 2) return null;
    
    // Remove leading quantity indicators
    cleaned = cleaned.replace(/^\d+x?\s*/i, '');
    
    // Capitalize each word
    return cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate rich data for a single inventory item
 * Called only when item is NOT in stash
 */
export async function generateSingleItem(itemName, context = '') {
    console.log('[Inventory] Generating data for:', itemName);
    
    const inferredType = inferInventoryType(itemName);
    const typeInfo = INVENTORY_TYPES[inferredType];
    const addictive = isAddictive(inferredType);
    
    const systemPrompt = `You are channeling the internal skill voices of a Disco Elysium character. Every item tells a story. The skills in your head all have opinions about what you carry.

${addictive ? 'This is an ADDICTIVE substance. Electrochemistry should be EXCITED about it. Volition should DISAPPROVE.' : ''}

Output ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate rich Disco Elysium-style data for this inventory item:

ITEM: ${itemName}
TYPE: ${inferredType} (${typeInfo?.label || 'Unknown'})
CONTEXT: ${context || 'Found in the character\'s possession'}
${addictive ? `ADDICTIVE: Yes - this item feeds an addiction` : ''}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY this JSON structure:
{
  "name": "${itemName}",
  "type": "${inferredType}",
  "description": "2-3 sentence evocative description. Make it poetic and strange, in the style of Disco Elysium item descriptions.",
  "voiceQuips": [
    {"skill": "skill_id", "text": "One-liner about this item", "approves": true},
    {"skill": "other_skill", "text": "Different perspective one-liner", "approves": false}
  ]
}

QUIP GUIDELINES:
${addictive ? `
- electrochemistry MUST approve enthusiastically
- volition or logic SHOULD disapprove
` : `
- Pick skills that would have opinions on this item
- One approving, one disapproving (or both can approve/disapprove based on item)
`}
- Keep quips short and punchy (under 15 words)
- Channel the voice's personality

Generate 2 voice quips from different skills.`;

    try {
        const response = await callInventoryAPI(systemPrompt, userPrompt);
        
        if (!response) {
            console.warn('[Inventory] No API response for:', itemName);
            return createFallbackItem(itemName);
        }
        
        const parsed = parseItemResponse(response, itemName, inferredType);
        if (parsed) {
            console.log('[Inventory] ✓ Generated:', parsed.name);
            return parsed;
        }
        
        console.warn('[Inventory] Parse failed, using fallback for:', itemName);
        return createFallbackItem(itemName);
        
    } catch (error) {
        console.error('[Inventory] Generation error:', error);
        return createFallbackItem(itemName);
    }
}

// ═══════════════════════════════════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate data for multiple items in one API call
 * More efficient than individual calls
 */
export async function generateMultipleItems(itemNames, context = '') {
    if (!itemNames || itemNames.length === 0) return [];
    if (itemNames.length === 1) return [await generateSingleItem(itemNames[0], context)].filter(Boolean);
    
    console.log('[Inventory] Batch generating', itemNames.length, 'items');
    
    const itemList = itemNames.map(name => {
        const type = inferInventoryType(name);
        return `- ${name} (type: ${type})`;
    }).join('\n');
    
    const systemPrompt = `You are channeling the internal skill voices of a Disco Elysium character. Generate data for multiple inventory items. Output ONLY valid JSON array, no markdown.`;
    
    const userPrompt = `Generate Disco Elysium-style data for these inventory items:

${itemList}

CONTEXT: ${context || 'Items in the character\'s possession'}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY a JSON array:
[
  {
    "name": "Item Name",
    "type": "item_type",
    "description": "2-3 sentence evocative description.",
    "voiceQuips": [
      {"skill": "skill_id", "text": "One-liner", "approves": true},
      {"skill": "other_skill", "text": "One-liner", "approves": false}
    ]
  }
]

Generate 2 voice quips per item. Keep quips short (under 15 words).`;

    try {
        const response = await callInventoryAPI(systemPrompt, userPrompt);
        
        if (!response) {
            console.warn('[Inventory] No batch response');
            return await generateItemsIndividually(itemNames, context);
        }
        
        const parsed = parseBatchResponse(response, itemNames);
        if (parsed && parsed.length > 0) {
            console.log('[Inventory] ✓ Batch generated', parsed.length, 'items');
            return parsed;
        }
        
        // Fallback to individual generation
        return await generateItemsIndividually(itemNames, context);
        
    } catch (error) {
        console.error('[Inventory] Batch error:', error);
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

function parseItemResponse(response, expectedName, expectedType) {
    if (!response) return null;
    
    let cleaned = response.trim();
    
    // Remove markdown
    cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    
    // Find JSON object
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        return null;
    }
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const data = JSON.parse(cleaned);
        return validateItem(data, expectedName, expectedType);
    } catch (e) {
        // Try to repair
        try {
            const repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            const data = JSON.parse(repaired);
            return validateItem(data, expectedName, expectedType);
        } catch (e2) {
            return null;
        }
    }
}

function parseBatchResponse(response, expectedNames) {
    if (!response) return [];
    
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    
    // Find JSON array
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    
    if (arrayStart === -1 || arrayEnd === -1) {
        // Maybe it returned an object with items array
        const objStart = cleaned.indexOf('{');
        if (objStart !== -1) {
            try {
                const obj = JSON.parse(cleaned.slice(objStart));
                if (Array.isArray(obj.items)) {
                    return obj.items.map((item, i) => validateItem(item, expectedNames[i])).filter(Boolean);
                }
            } catch (e) {
                // Continue to fallback
            }
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

function validateItem(item, expectedName, expectedType = null) {
    if (!item) return null;
    
    const name = item.name || expectedName || 'Unknown Item';
    const type = expectedType || item.type || inferInventoryType(name);
    
    const validated = {
        name: name,
        type: type,
        category: isConsumable(type) ? 'consumable' : 'misc',
        addictive: isAddictive(type),
        addictionType: getAddictionData(type)?.type || null,
        description: item.description || '',
        voiceQuips: [],
        source: 'ai-generated',
        generatedAt: Date.now()
    };
    
    // Validate voice quips
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

// ═══════════════════════════════════════════════════════════════
// FALLBACK ITEM (when AI fails)
// ═══════════════════════════════════════════════════════════════

function createFallbackItem(name) {
    const type = inferInventoryType(name);
    const typeInfo = INVENTORY_TYPES[type];
    
    return {
        name: name,
        type: type,
        category: isConsumable(type) ? 'consumable' : 'misc',
        addictive: isAddictive(type),
        addictionType: getAddictionData(type)?.type || null,
        description: `A ${name.toLowerCase()}. It's yours now.`,
        voiceQuips: generateFallbackQuips(type),
        source: 'fallback',
        generatedAt: Date.now()
    };
}

function generateFallbackQuips(type) {
    const quips = {
        cigarettes: [
            { skill: 'electrochemistry', text: 'Light one up. You know you want to.', approves: true },
            { skill: 'volition', text: 'You\'re better than this dependency.', approves: false }
        ],
        alcohol: [
            { skill: 'electrochemistry', text: 'The good stuff. Pour one out for yourself.', approves: true },
            { skill: 'logic', text: 'Your liver would like a word.', approves: false }
        ],
        stimulants: [
            { skill: 'electrochemistry', text: 'Oh YES. This is the ticket.', approves: true },
            { skill: 'endurance', text: 'Your heart is already racing.', approves: false }
        ],
        medicine: [
            { skill: 'logic', text: 'Follow the dosage instructions.', approves: true },
            { skill: 'electrochemistry', text: 'Boring. No recreational potential.', approves: false }
        ],
        food: [
            { skill: 'endurance', text: 'Calories. Your body needs them.', approves: true },
            { skill: 'composure', text: 'Eat with some dignity, at least.', approves: false }
        ],
        key: [
            { skill: 'logic', text: 'Keep this safe. It opens something.', approves: true },
            { skill: 'inland_empire', text: 'What secrets does it guard?', approves: true }
        ],
        document: [
            { skill: 'encyclopedia', text: 'Read it carefully. Knowledge is power.', approves: true },
            { skill: 'rhetoric', text: 'Words on paper. Someone wanted these preserved.', approves: true }
        ],
        weapon: [
            { skill: 'half_light', text: 'You might need this. Keep it ready.', approves: true },
            { skill: 'empathy', text: 'Violence leaves marks on everyone.', approves: false }
        ],
        tool: [
            { skill: 'interfacing', text: 'A useful implement. Keep it handy.', approves: true },
            { skill: 'conceptualization', text: 'Function over form. Practical.', approves: true }
        ]
    };
    
    return quips[type] || [
        { skill: 'perception', text: 'An object. Yours now.', approves: true }
    ];
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    normalizeStashKey,
    quickExtractItemNames,
    quickExtractItemsWithQuantity,
    generateSingleItem,
    generateMultipleItems
};
