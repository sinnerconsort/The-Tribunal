/**
 * The Tribunal - Equipment Generation (FIXED)
 * AI-powered extraction for clothing/accessories
 * 
 * FIXES:
 * - Expanded pre-filter to catch more terms (appearance, materials, etc.)
 * - Prompt handles BOTH static persona descriptions AND dynamic events
 * - Better parsing for compound formats like "jacket+shirt+boots"
 * - Improved debug logging for mobile troubleshooting
 */

import { callAPI } from './api-helpers.js';
import { SKILLS } from '../data/skills.js';

// ═══════════════════════════════════════════════════════════════
// SKILL REFERENCE FOR PROMPT
// ═══════════════════════════════════════════════════════════════

const SKILL_REFERENCE = `
INTELLECT: logic, encyclopedia, rhetoric, drama, conceptualization, visual_calculus
PSYCHE: volition, inland_empire, empathy, authority, esprit_de_corps, suggestion
PHYSIQUE: endurance, pain_threshold, physical_instrument, electrochemistry, shivers, half_light
MOTORICS: hand_eye_coordination, perception, reaction_speed, savoir_faire, interfacing, composure
`;

const EQUIPMENT_TYPES = [
    'hat', 'headwear', 'glasses', 'eyewear', 'mask',
    'jacket', 'coat', 'shirt', 'top', 'vest',
    'pants', 'trousers', 'shorts', 'skirt',
    'shoes', 'boots', 'footwear',
    'gloves', 'jewelry', 'ring', 'necklace', 'bracelet',
    'watch', 'tie', 'scarf', 'belt',
    'bag', 'briefcase', 'backpack',
    'badge', 'pin', 'accessory', 'other'
];

// ═══════════════════════════════════════════════════════════════
// PRE-FILTER KEYWORDS (EXPANDED)
// Now catches persona descriptions, materials, and more
// ═══════════════════════════════════════════════════════════════

const CLOTHING_KEYWORDS = new RegExp([
    // Actions
    'wear', 'wearing', 'wore', 'wears',
    'put on', 'puts on', 'putting on',
    'takes off', 'taking off', 'took off',
    'removes?', 'removing', 'removed',
    'dressed', 'dressing', 'undress',
    'donning', 'donned', 'clad', 'sporting',
    
    // Persona/description markers (THE BIG FIX)
    'appearance', 'attire', 'outfit', 'garb', 'look',
    'clothing', 'clothes', 'wardrobe', 'getup',
    
    // Upper body
    'jacket', 'coat', 'blazer', 'hoodie', 'sweater', 'cardigan',
    'shirt', 't-shirt', 'tshirt', 'tee', 'blouse', 'top', 'tank',
    'vest', 'waistcoat', 'polo', 'tunic',
    
    // Lower body  
    'pants', 'trousers', 'jeans', 'slacks', 'chinos',
    'shorts', 'skirt', 'dress', 'gown', 'robe',
    
    // Footwear
    'shoes', 'boots', 'sneakers', 'trainers', 'heels',
    'sandals', 'loafers', 'flats', 'footwear',
    'socks', 'stockings',
    
    // Accessories
    'hat', 'cap', 'beanie', 'fedora', 'hood', 'headband',
    'glasses', 'sunglasses', 'shades', 'spectacles', 'goggles',
    'gloves', 'mittens',
    'scarf', 'tie', 'necktie', 'bowtie', 'cravat',
    'belt', 'suspenders',
    'watch', 'wristwatch',
    'ring', 'necklace', 'chain', 'pendant', 'bracelet', 'earring',
    'badge', 'pin', 'brooch', 'medal',
    'bag', 'purse', 'handbag', 'backpack', 'briefcase', 'satchel',
    'wallet', 'pockets?',
    'mask', 'bandana', 'balaclava',
    
    // Undergarments
    'underwear', 'boxers', 'briefs', 'panties', 'bra',
    
    // Materials (CRITICAL for persona cards like "leather jacket+mesh shirt")
    'leather', 'denim', 'cotton', 'silk', 'wool', 'linen',
    'mesh', 'lace', 'velvet', 'suede', 'canvas',
    'polyester', 'nylon', 'fleece', 'flannel',
    
    // Descriptors that precede clothing
    'black', 'white', 'red', 'blue', 'green', 'brown',
    'worn', 'tattered', 'ripped', 'torn', 'faded', 'stained',
    'old', 'new', 'fancy', 'casual', 'formal', 'vintage'
].join('|'), 'i');

// ═══════════════════════════════════════════════════════════════
// EXTRACTION + GENERATION PROMPT
// Now handles BOTH static descriptions AND dynamic events
// ═══════════════════════════════════════════════════════════════

function buildEquipmentPrompt(messageText, existingEquipment = []) {
    const existingNames = existingEquipment.map(e => `- ${e.name}`).join('\n') || 'None';
    
    return `Analyze this text for clothing, accessories, and wearable items.

This text may be ANY of these formats - handle them ALL:

1. PERSONA DESCRIPTION with appearance fields
   Example: Appearance: ["leather jacket+mesh shirt+boots"]
   → Extract: Leather Jacket, Mesh Shirt, Boots (3 items)

2. COMPOUND FORMAT with + or & separators
   Example: "open leather jacket+mesh shirt+leather pants"
   → Split into separate items

3. ROLEPLAY MESSAGE describing what someone wears/finds/acquires
   Example: "He adjusted his worn fedora and lit a cigarette"
   → Extract: Worn Fedora

4. CHARACTER DESCRIPTION listing someone's look
   Example: "wearing a tattered coat and scuffed boots"
   → Extract: Tattered Coat, Scuffed Boots

<text_to_analyze>
${messageText}
</text_to_analyze>

<already_tracked>
${existingNames}
</already_tracked>

<skills>
${SKILL_REFERENCE}
</skills>

EXTRACTION RULES:
- For compound "item+item+item" format: SPLIT into separate items
- Remove brackets [] and quotes "" around items
- Include descriptors (leather, worn, black, mesh, etc.)
- Capitalize properly: "leather jacket" → "Leather Jacket"
- SKIP items already in "already_tracked" above
- Be specific with names

For each NEW item, respond with ONLY valid JSON:

{
  "equipment": [
    {
      "name": "Item Name With Descriptors",
      "type": "hat|glasses|jacket|coat|shirt|pants|shoes|boots|gloves|jewelry|ring|necklace|watch|tie|scarf|bag|badge|accessory|other",
      "bonuses": {
        "skill_id": modifier
      },
      "description": "[SKILL_NAME] 2-3 sentence flavor description from that skill's perspective.",
      "voiceQuips": [
        {"skill": "skill_id", "text": "One-liner reaction", "approves": true},
        {"skill": "other_skill", "text": "Disapproving comment", "approves": false}
      ]
    }
  ],
  "removed": [
    {"name": "Item explicitly removed/discarded (must match existing)"}
  ]
}

BONUS GUIDELINES (1-3 skills, values -2 to +2):
- Intimidating/tough → physical_instrument, authority, half_light
- Stylish/flashy → savoir_faire, drama, composure
- Worn/rugged → endurance, shivers, pain_threshold
- Tech/gadgets → interfacing, visual_calculus, hand_eye_coordination
- Weird/mystical → inland_empire, shivers, conceptualization

If NO equipment found: {"equipment": [], "removed": []}

JSON only, no explanation.`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract and generate equipment data from a message or persona
 * @param {string} messageText - The text to analyze
 * @param {object} options - Options
 * @returns {Promise<object>} Generated equipment data
 */
export async function generateEquipmentFromMessage(messageText, options = {}) {
    const {
        existingEquipment = [],
        timeout = 30000
    } = options;
    
    const results = {
        equipment: [],
        removed: [],
        error: null,
        raw: null
    };
    
    // Skip very short messages
    if (!messageText || messageText.length < 20) {
        console.log('[Equipment Gen] ⏭️ Text too short:', messageText?.length || 0, 'chars');
        return results;
    }
    
    // Pre-filter check with expanded keywords
    if (!CLOTHING_KEYWORDS.test(messageText)) {
        console.log('[Equipment Gen] ⏭️ Pre-filter rejected');
        console.log('[Equipment Gen] Preview:', messageText.substring(0, 200));
        return results;
    }
    
    console.log('[Equipment Gen] ✓ Pre-filter passed');
    console.log('[Equipment Gen] 📄 Analyzing', messageText.length, 'chars...');
    console.log('[Equipment Gen] Preview:', messageText.substring(0, 300));
    
    try {
        const prompt = buildEquipmentPrompt(messageText, existingEquipment);
        
        const systemPrompt = `You are an expert at extracting clothing and accessories from text. You handle:
- Persona cards with Appearance fields (split "jacket+shirt+boots" into separate items)
- Roleplay messages describing what characters wear
- Character descriptions

Generate rich Disco Elysium-style item data. Output only valid JSON.`;
        
        console.log('[Equipment Gen] 📡 Calling API...');
        
        const response = await callAPI(systemPrompt, prompt, {
            maxTokens: 2500,
            temperature: 0.7,
            timeout
        });
        
        if (!response) {
            results.error = 'No response from API';
            console.log('[Equipment Gen] ❌ No API response');
            return results;
        }
        
        results.raw = response;
        console.log('[Equipment Gen] 📥 Response:', response.length, 'chars');
        
        // Parse response
        const parsed = parseEquipmentResponse(response);
        if (parsed) {
            results.equipment = parsed.equipment || [];
            results.removed = parsed.removed || [];
            
            // Validate and clean
            results.equipment = results.equipment.map(validateEquipmentItem).filter(Boolean);
            
            console.log('[Equipment Gen] ✅ Found', results.equipment.length, 'items:');
            results.equipment.forEach(item => console.log('   •', item.name, `(${item.type})`));
        } else {
            results.error = 'Failed to parse equipment response';
            console.log('[Equipment Gen] ❌ Parse failed');
        }
        
    } catch (error) {
        console.error('[Equipment Gen] Error:', error);
        results.error = error.message;
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

function parseEquipmentResponse(response) {
    if (!response) return null;
    
    let cleaned = response.trim();
    
    console.log('[Equipment Gen] Raw response preview:', cleaned.substring(0, 200));
    
    // Check for "no equipment" responses
    if (/"equipment"\s*:\s*\[\s*\]/.test(cleaned) || /no (clothing|equipment|items)/i.test(cleaned)) {
        console.log('[Equipment Gen] Response indicates no equipment');
        return { equipment: [], removed: [] };
    }
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```json?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.replace(/```json?\s*/gi, '');
    cleaned = cleaned.replace(/```/g, '');
    
    // Find JSON object with brace matching
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart === -1) {
        console.warn('[Equipment Gen] No JSON object found');
        return { equipment: [], removed: [] };
    }
    
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === '{') braceCount++;
        if (cleaned[i] === '}') braceCount--;
        if (braceCount === 0) {
            jsonEnd = i;
            break;
        }
    }
    
    if (jsonEnd === -1) {
        console.warn('[Equipment Gen] No matching closing brace');
        return { equipment: [], removed: [] };
    }
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed.equipment)) parsed.equipment = [];
        if (!Array.isArray(parsed.removed)) parsed.removed = [];
        console.log('[Equipment Gen] ✓ Parsed JSON:', parsed.equipment.length, 'items');
        return parsed;
    } catch (e) {
        console.error('[Equipment Gen] JSON parse error:', e.message);
        
        // Try to repair
        try {
            let repaired = cleaned
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']');
            const parsed = JSON.parse(repaired);
            if (!Array.isArray(parsed.equipment)) parsed.equipment = [];
            if (!Array.isArray(parsed.removed)) parsed.removed = [];
            console.log('[Equipment Gen] ✓ Repaired JSON');
            return parsed;
        } catch (e2) {
            return { equipment: [], removed: [] };
        }
    }
}

function validateEquipmentItem(item) {
    if (!item || !item.name) return null;
    
    const validated = {
        name: item.name.trim(),
        type: normalizeType(item.type),
        bonuses: {},
        description: item.description || '',
        voiceQuips: [],
        source: 'ai-extracted'
    };
    
    // Validate bonuses
    if (item.bonuses && typeof item.bonuses === 'object') {
        for (const [skill, value] of Object.entries(item.bonuses)) {
            const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
            const numValue = parseInt(value, 10);
            if (isValidSkill(normalizedSkill) && !isNaN(numValue)) {
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
    if (lower.includes('glass') || lower.includes('shade') || lower.includes('spectacle')) return 'glasses';
    if (lower.includes('jacket') || lower.includes('blazer') || lower.includes('hoodie')) return 'jacket';
    if (lower.includes('coat') || lower.includes('duster') || lower.includes('trench')) return 'coat';
    if (lower.includes('shirt') || lower.includes('blouse') || lower.includes('top') || lower.includes('tee')) return 'shirt';
    if (lower.includes('pant') || lower.includes('trouser') || lower.includes('jean')) return 'pants';
    if (lower.includes('boot')) return 'boots';
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('loafer')) return 'shoes';
    if (lower.includes('glove')) return 'gloves';
    if (lower.includes('ring') && !lower.includes('earring')) return 'ring';
    if (lower.includes('necklace') || lower.includes('chain') || lower.includes('pendant')) return 'necklace';
    if (lower.includes('watch')) return 'watch';
    if (lower.includes('tie')) return 'tie';
    if (lower.includes('scarf')) return 'scarf';
    if (lower.includes('belt')) return 'belt';
    if (lower.includes('bag') || lower.includes('briefcase') || lower.includes('satchel')) return 'bag';
    if (lower.includes('badge') || lower.includes('pin')) return 'badge';
    if (lower.includes('mask')) return 'mask';
    if (lower.includes('vest')) return 'vest';
    
    return 'other';
}

function isValidSkill(skillId) {
    const validSkills = [
        'logic', 'encyclopedia', 'rhetoric', 'drama', 'conceptualization', 'visual_calculus',
        'volition', 'inland_empire', 'empathy', 'authority', 'esprit_de_corps', 'suggestion',
        'endurance', 'pain_threshold', 'physical_instrument', 'electrochemistry', 'shivers', 'half_light',
        'hand_eye_coordination', 'perception', 'reaction_speed', 'savoir_faire', 'interfacing', 'composure'
    ];
    return validSkills.includes(skillId);
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM GENERATION (for manual adds)
// ═══════════════════════════════════════════════════════════════

export async function generateItemDetails(itemName, itemType = 'other', context = '') {
    const prompt = `Generate rich Disco Elysium-style data for this item:

Item: ${itemName}
Type: ${itemType}
Context: ${context || 'Found during investigation'}

<skills>
${SKILL_REFERENCE}
</skills>

Respond with ONLY valid JSON:
{
  "bonuses": {"skill_id": modifier},
  "description": "[SKILL_NAME] 2-3 evocative sentences from that skill's perspective.",
  "voiceQuips": [{"skill": "skill_id", "text": "One-liner", "approves": true}]
}`;

    try {
        const response = await callAPI(
            'You channel Disco Elysium skill voices. Every item tells a story.',
            prompt,
            { maxTokens: 800, temperature: 0.8 }
        );
        
        if (!response) return null;
        
        const cleaned = response.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
        const data = JSON.parse(cleaned);
        
        return {
            name: itemName,
            type: normalizeType(itemType),
            bonuses: data.bonuses || {},
            description: data.description || '',
            voiceQuips: data.voiceQuips || [],
            source: 'ai-generated'
        };
    } catch (error) {
        console.error('[Equipment Gen] Item details error:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    generateEquipmentFromMessage,
    generateItemDetails
};
