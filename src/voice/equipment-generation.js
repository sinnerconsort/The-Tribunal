/**
 * The Tribunal - Equipment Generation
 * AI-powered extraction and rich generation for clothing/accessories
 * 
 * Detects equipment mentioned in chat, then generates:
 * - Appropriate skill bonuses based on item vibe
 * - Flavor description from a skill voice's perspective
 * - 2-3 voice quips (approving/disapproving reactions)
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
// EXTRACTION + GENERATION PROMPT
// ═══════════════════════════════════════════════════════════════

function buildEquipmentPrompt(messageText, existingEquipment = []) {
    const existingNames = existingEquipment.map(e => `- ${e.name}`).join('\n') || 'None';
    
    return `Analyze this roleplay message for any clothing, accessories, or wearable items that the character finds, receives, puts on, or that are notably described.

<message>
${messageText}
</message>

<already_tracked>
${existingNames}
</already_tracked>

<skills>
${SKILL_REFERENCE}
</skills>

For each NEW item found (not already tracked), generate rich data. Respond with ONLY valid JSON:

{
  "equipment": [
    {
      "name": "Item name (e.g., 'Tattered Leather Duster')",
      "type": "One of: hat, glasses, jacket, coat, shirt, pants, shoes, boots, gloves, jewelry, ring, necklace, watch, tie, scarf, bag, badge, accessory, other",
      "bonuses": {
        "skill_id": modifier
      },
      "description": "2-3 sentence flavor description written from the perspective of the skill that most resonates with this item. Include the skill name in brackets at the start, e.g., '[SHIVERS] The coat remembers...'",
      "voiceQuips": [
        {
          "skill": "skill_id",
          "text": "One-liner reaction (1 sentence max)",
          "approves": true or false
        }
      ]
    }
  ],
  "removed": [
    {
      "name": "Name of item explicitly removed, discarded, or destroyed (must match existing)"
    }
  ]
}

RULES:
- Only extract SPECIFIC named/described items, not vague mentions
- Bonuses should be 1-3 skills, values between -2 and +2
- Match bonuses to the item's nature:
  * Intimidating/tough items → physical_instrument, authority, half_light
  * Stylish/flashy items → savoir_faire, drama, composure
  * Worn/rugged items → endurance, shivers, pain_threshold
  * Tech/gadgets → interfacing, visual_calculus, hand_eye_coordination
  * Weird/mystical items → inland_empire, shivers, conceptualization
  * Social/charming items → suggestion, empathy, esprit_de_corps
- Description should be evocative, in the voice of a Disco Elysium skill
- Generate 2-3 voice quips from different skills
- At least one quip should disapprove (find something wrong with the item)
- If no equipment found, return empty arrays
- "removed" is for items explicitly taken off, thrown away, or destroyed

Respond with ONLY the JSON, no explanation.`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract and generate equipment data from a message
 * @param {string} messageText - The chat message to analyze
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
    if (!messageText || messageText.length < 30) {
        return results;
    }
    
    // Quick pre-filter: does the message even mention clothing-related words?
    const clothingKeywords = /\b(wear|wearing|wore|put on|takes off|removes?|jacket|coat|shirt|pants|shoes|boots|hat|glasses|gloves|ring|necklace|watch|tie|scarf|badge|uniform|outfit|dressed|clothing|clothes|pockets?|belt|bag|briefcase)\b/i;
    
    if (!clothingKeywords.test(messageText)) {
        return results; // No clothing mentions, skip API call
    }
    
    try {
        const prompt = buildEquipmentPrompt(messageText, existingEquipment);
        
        const systemPrompt = `You are an expert at analyzing roleplay scenes for clothing and accessories mentioned. You generate rich, evocative item data in the style of Disco Elysium - where every item tells a story and the skills in your head have opinions about everything. Output only valid JSON.`;
        
        const response = await callAPI(systemPrompt, prompt, {
            maxTokens: 1500,
            temperature: 0.7, // Slightly creative for descriptions/quips
            timeout
        });
        
        if (!response) {
            results.error = 'No response from API';
            return results;
        }
        
        results.raw = response;
        
        // Parse response
        const parsed = parseEquipmentResponse(response);
        if (parsed) {
            results.equipment = parsed.equipment || [];
            results.removed = parsed.removed || [];
            
            // Validate and clean up equipment data
            results.equipment = results.equipment.map(validateEquipmentItem).filter(Boolean);
        } else {
            results.error = 'Failed to parse equipment response';
        }
        
    } catch (error) {
        console.error('[Equipment Gen] Generation error:', error);
        results.error = error.message;
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Parse the AI's JSON response
 */
function parseEquipmentResponse(response) {
    if (!response) return null;
    
    let cleaned = response.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```json?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    // Find JSON object
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.warn('[Equipment Gen] No JSON found in response');
        return null;
    }
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const parsed = JSON.parse(cleaned);
        
        // Ensure arrays exist
        if (!Array.isArray(parsed.equipment)) parsed.equipment = [];
        if (!Array.isArray(parsed.removed)) parsed.removed = [];
        
        return parsed;
    } catch (e) {
        console.error('[Equipment Gen] JSON parse error:', e);
        return null;
    }
}

/**
 * Validate and clean up an equipment item
 */
function validateEquipmentItem(item) {
    if (!item || !item.name) return null;
    
    // Ensure required fields
    const validated = {
        name: item.name.trim(),
        type: normalizeType(item.type),
        bonuses: {},
        description: item.description || '',
        voiceQuips: [],
        source: 'ai-extracted'
    };
    
    // Validate bonuses (must be valid skill IDs, values -2 to +2)
    if (item.bonuses && typeof item.bonuses === 'object') {
        for (const [skill, value] of Object.entries(item.bonuses)) {
            const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
            const numValue = parseInt(value, 10);
            
            // Check if it's a valid skill
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
            .slice(0, 3); // Max 3 quips
    }
    
    return validated;
}

/**
 * Normalize equipment type to valid type
 */
function normalizeType(type) {
    if (!type) return 'other';
    
    const lower = type.toLowerCase().trim();
    
    // Direct match
    if (EQUIPMENT_TYPES.includes(lower)) return lower;
    
    // Fuzzy matching
    if (lower.includes('hat') || lower.includes('cap') || lower.includes('helmet')) return 'hat';
    if (lower.includes('glass') || lower.includes('eyewear') || lower.includes('spectacle')) return 'glasses';
    if (lower.includes('jacket') || lower.includes('blazer')) return 'jacket';
    if (lower.includes('coat') || lower.includes('duster') || lower.includes('overcoat')) return 'coat';
    if (lower.includes('shirt') || lower.includes('blouse') || lower.includes('top')) return 'shirt';
    if (lower.includes('pant') || lower.includes('trouser') || lower.includes('jean')) return 'pants';
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('loafer')) return 'shoes';
    if (lower.includes('boot')) return 'boots';
    if (lower.includes('glove')) return 'gloves';
    if (lower.includes('ring')) return 'ring';
    if (lower.includes('necklace') || lower.includes('chain') || lower.includes('pendant')) return 'necklace';
    if (lower.includes('watch')) return 'watch';
    if (lower.includes('tie') || lower.includes('necktie') || lower.includes('bowtie')) return 'tie';
    if (lower.includes('scarf')) return 'scarf';
    if (lower.includes('bag') || lower.includes('briefcase') || lower.includes('satchel')) return 'bag';
    if (lower.includes('badge') || lower.includes('pin')) return 'badge';
    if (lower.includes('belt')) return 'belt';
    if (lower.includes('jewel') || lower.includes('bracelet')) return 'jewelry';
    
    return 'other';
}

/**
 * Check if a skill ID is valid
 */
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

/**
 * Generate rich data for a manually added item
 * @param {string} itemName - Name of the item
 * @param {string} itemType - Type of item
 * @param {string} context - Optional context about how it was acquired
 * @returns {Promise<object>} Generated item data
 */
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
  "bonuses": {
    "skill_id": modifier (-2 to +2, 1-3 skills total)
  },
  "description": "2-3 sentence evocative description from the perspective of the most relevant skill. Start with [SKILL_NAME].",
  "voiceQuips": [
    {
      "skill": "skill_id",
      "text": "One-liner reaction",
      "approves": true or false
    }
  ]
}

Make it feel authentic to Disco Elysium - poetic, strange, and full of personality.`;

    try {
        const systemPrompt = `You are channeling the internal voices of a Disco Elysium character. Every item has meaning, every object tells a story, and the skills in your head all have opinions.`;
        
        const response = await callAPI(systemPrompt, prompt, {
            maxTokens: 800,
            temperature: 0.8
        });
        
        if (!response) return null;
        
        const parsed = parseEquipmentResponse(`{"equipment":[${response.includes('"bonuses"') ? response : '{}'}]}`);
        
        // Try direct parse if wrapper failed
        let data = null;
        try {
            const cleaned = response.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
            data = JSON.parse(cleaned);
        } catch (e) {
            // Fall back to equipment array parse
            if (parsed?.equipment?.[0]) {
                data = parsed.equipment[0];
            }
        }
        
        if (data) {
            return {
                name: itemName,
                type: normalizeType(itemType),
                bonuses: data.bonuses || {},
                description: data.description || '',
                voiceQuips: data.voiceQuips || [],
                source: 'ai-generated'
            };
        }
        
    } catch (error) {
        console.error('[Equipment Gen] Item details error:', error);
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    generateEquipmentFromMessage,
    generateItemDetails
};
