/**
 * The Tribunal - Equipment Generation
 * 
 * INDEPENDENT API CALLS - Does NOT use api-helpers.js
 * Equipment needs 3000+ tokens, voices only need 600
 * 
 * WARDROBE HISTORY - Items are cached forever
 * - First generation: API call, save to wardrobe
 * - Re-equip same item: Instant from cache, no API
 */

import { getContext } from '../../../../../extensions.js';

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
// DIRECT API CALL (bypasses api-helpers.js token limit)
// ═══════════════════════════════════════════════════════════════

/**
 * Make a direct API call for equipment generation
 * Uses ST's connection but with our own token limit
 */
async function callEquipmentAPI(systemPrompt, userPrompt) {
    console.log('[Equipment API] Making direct call with', EQUIPMENT_MAX_TOKENS, 'max tokens');
    
    try {
        // Method 1: Try ST's generateQuietPrompt (cleanest integration)
        if (typeof window.SillyTavern?.getContext === 'function') {
            const ctx = window.SillyTavern.getContext();
            if (typeof ctx.generateQuietPrompt === 'function') {
                console.log('[Equipment API] Using generateQuietPrompt');
                const result = await ctx.generateQuietPrompt(userPrompt, false, false, '', '', EQUIPMENT_MAX_TOKENS);
                return result;
            }
        }
        
        // Method 2: Try generateRaw if available
        if (typeof window.generateRaw === 'function') {
            console.log('[Equipment API] Using generateRaw');
            const result = await window.generateRaw(userPrompt, null, false, false, systemPrompt, EQUIPMENT_MAX_TOKENS);
            return result;
        }
        
        // Method 3: Direct fetch to ST's API proxy
        console.log('[Equipment API] Using direct fetch');
        const response = await fetch('/api/backends/chat-completions/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: EQUIPMENT_MAX_TOKENS,
                temperature: 0.7,
            })
        });
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
        }
        if (data.content) {
            return data.content;
        }
        if (typeof data === 'string') {
            return data;
        }
        
        console.warn('[Equipment API] Unexpected response format:', data);
        return null;
        
    } catch (error) {
        console.error('[Equipment API] Call failed:', error);
        
        // Method 4: Fallback - try the extension's own API helper but warn about tokens
        try {
            console.log('[Equipment API] Falling back to api-helpers (token limit may apply)');
            const { callAPI } = await import('./api-helpers.js');
            return await callAPI(systemPrompt, userPrompt, { maxTokens: EQUIPMENT_MAX_TOKENS });
        } catch (e) {
            console.error('[Equipment API] All methods failed');
            return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK EXTRACTION (no AI - for finding item names)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract item names from text without AI
 * Used to find what items exist, then check wardrobe/generate
 */
export function quickExtractItemNames(text) {
    if (!text) return [];
    
    const items = [];
    const seen = new Set();
    
    // Pattern 1: Appearance: ["item+item+item"]
    const appearanceMatch = text.match(/Appearance\s*:?\s*\[?"?([^\]"]+)"?\]?/i);
    if (appearanceMatch) {
        const rawItems = appearanceMatch[1].split(/[+&,;|\/]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const item of rawItems) {
            const normalized = normalizeItemName(item);
            if (normalized && !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    // Pattern 2: Clothing: [...] or Wearing: [...]
    const clothingMatch = text.match(/(?:Clothing|Wearing|Outfit)\s*:?\s*\[?"?([^\]"]+)"?\]?/i);
    if (clothingMatch) {
        const rawItems = clothingMatch[1].split(/[+&,;|\/]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const item of rawItems) {
            const normalized = normalizeItemName(item);
            if (normalized && !seen.has(normalized.toLowerCase())) {
                seen.add(normalized.toLowerCase());
                items.push(normalized);
            }
        }
    }
    
    // Pattern 3: "wearing a/an [item]" in prose
    const wearingMatches = text.matchAll(/wearing\s+(?:a|an|the)?\s*([^.,;!?\n]+)/gi);
    for (const match of wearingMatches) {
        const normalized = normalizeItemName(match[1]);
        if (normalized && normalized.length > 2 && normalized.split(' ').length <= 5 && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            items.push(normalized);
        }
    }
    
    console.log('[Equipment] Quick extracted items:', items);
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
 * Generate rich data for a single item
 * Called only when item is NOT in wardrobe
 */
export async function generateSingleItem(itemName, context = '') {
    console.log('[Equipment] Generating data for:', itemName);
    
    const systemPrompt = `You are channeling the internal skill voices of a Disco Elysium character. Every item of clothing tells a story. The skills in your head all have opinions about what you wear.

Output ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate rich Disco Elysium-style data for this clothing/accessory item:

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

/**
 * Generate multiple items in a single API call (more efficient)
 */
export async function generateMultipleItems(itemNames, context = '') {
    if (!itemNames || itemNames.length === 0) return [];
    
    // For 1-2 items, generate individually
    if (itemNames.length <= 2) {
        const results = [];
        for (const name of itemNames) {
            const item = await generateSingleItem(name, context);
            if (item) results.push(item);
        }
        return results;
    }
    
    console.log('[Equipment] Batch generating', itemNames.length, 'items');
    
    const systemPrompt = `You are channeling the internal skill voices of a Disco Elysium character. Generate data for multiple clothing items. Output ONLY valid JSON array.`;

    const itemList = itemNames.map((n, i) => `${i + 1}. ${n}`).join('\n');
    
    const userPrompt = `Generate Disco Elysium-style data for these items:

${itemList}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY a JSON array:
[
  {
    "name": "Item Name",
    "type": "hat|glasses|jacket|coat|shirt|pants|shoes|boots|gloves|ring|necklace|watch|tie|scarf|belt|bag|badge|other",
    "bonuses": {"skill_id": modifier},
    "description": "[SKILL_NAME] 2-3 evocative sentences.",
    "voiceQuips": [
      {"skill": "skill_id", "text": "One-liner", "approves": true},
      {"skill": "skill_id", "text": "One-liner", "approves": false}
    ]
  }
]

Keep descriptions concise. 1-2 bonuses per item. 2 quips per item.`;

    try {
        const response = await callEquipmentAPI(systemPrompt, userPrompt);
        
        if (!response) {
            console.warn('[Equipment] Batch generation failed, falling back to individual');
            return await generateItemsIndividually(itemNames, context);
        }
        
        const parsed = parseBatchResponse(response, itemNames);
        if (parsed && parsed.length > 0) {
            console.log('[Equipment] ✓ Batch generated', parsed.length, 'items');
            return parsed;
        }
        
        // Fallback to individual generation
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
        return validateItem(data, expectedName);
    } catch (e) {
        // Try to repair
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
    
    // Find JSON array
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    
    if (arrayStart === -1 || arrayEnd === -1) {
        // Maybe it returned an object with equipment array
        const objStart = cleaned.indexOf('{');
        if (objStart !== -1) {
            try {
                const obj = JSON.parse(cleaned.slice(objStart));
                if (Array.isArray(obj.equipment)) {
                    return obj.equipment.map((item, i) => validateItem(item, expectedNames[i])).filter(Boolean);
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
    
    // Validate bonuses
    if (item.bonuses && typeof item.bonuses === 'object') {
        for (const [skill, value] of Object.entries(item.bonuses)) {
            const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
            const numValue = parseInt(value, 10);
            if (VALID_SKILLS.includes(normalizedSkill) && !isNaN(numValue)) {
                validated.bonuses[normalizedSkill] = Math.max(-2, Math.min(2, numValue));
            }
        }
    }
    
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

function normalizeType(type) {
    if (!type) return 'other';
    const lower = type.toLowerCase().trim();
    
    if (EQUIPMENT_TYPES.includes(lower)) return lower;
    
    // Fuzzy matching
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
    generateMultipleItems
};
