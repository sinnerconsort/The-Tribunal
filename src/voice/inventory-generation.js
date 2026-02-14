/**
 * The Tribunal - Inventory Generation
 * 
 * Uses api-helpers.js with CUSTOM TOKEN LIMIT
 * Mirrors equipment-generation.js patterns exactly
 * 
 * STASH HISTORY - Items are cached forever
 * - First generation: API call, save to stash
 * - Re-add same item: Instant from cache, no API
 * 
 * v1.1.0 - Genre-aware generation prompts and fallback quips
 * FIXED: parseItems() now handles parentheses correctly
 * "Pack of Astras (3x)" stays as ONE item
 */

import { callAPIWithTokens } from './api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';
import { 
    INVENTORY_TYPES, 
    inferInventoryType, 
    isConsumable, 
    isAddictive, 
    getAddictionData 
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
const VALID_EFFECT_IDS = {
    // Alcohol
    revacholian_courage: 'Alcohol - beer, wine, spirits. Boosts social skills, debuffs coordination.',
    
    // Tobacco
    nicotine_rush: 'Cigarettes, cigars, tobacco. Boosts focus skills, debuffs endurance.',
    
    // Drugs
    pyrholidon: 'The specific drug pyrholidon. Boosts perception, debuffs empathy.',
    speed_freaks_delight: 'Amphetamines, speed, uppers. Boosts motorics, debuffs composure.',
    
    // Food/Medicine
    satiated: 'Food - restores minor health, no skill effects.',
    medicated: 'Medicine, painkillers - restores health, minor debuffs.',
    
    // Special
    the_expression: 'Strong hallucinogenics. Boosts psyche, heavy debuffs.',
    
    // None
    none: 'No status effect - item is not a consumable or has no mechanical effect.'
};

const EFFECT_ID_REFERENCE = Object.entries(VALID_EFFECT_IDS)
    .map(([id, desc]) => `- ${id}: ${desc}`)
    .join('\n');

const VALID_SKILLS = [
    'logic', 'encyclopedia', 'rhetoric', 'drama', 'conceptualization', 'visual_calculus',
    'volition', 'inland_empire', 'empathy', 'authority', 'esprit_de_corps', 'suggestion',
    'endurance', 'pain_threshold', 'physical_instrument', 'electrochemistry', 'shivers', 'half_light',
    'hand_eye_coordination', 'perception', 'reaction_speed', 'savoir_faire', 'interfacing', 'composure'
];

// ═══════════════════════════════════════════════════════════════
// GENRE-AWARE ITEM TONES
// Controls how descriptions and quips are flavored
// ═══════════════════════════════════════════════════════════════

const GENRE_ITEM_TONES = {
    disco_elysium: {
        descStyle: 'Poetic and strange, like evidence from a crumbling world. Combine mundane observations with existential weight.',
        quipStyle: 'Channel Disco Elysium skill voices — each skill has a distinct personality. Electrochemistry is hedonistic, Logic is dry and analytical, Inland Empire is mystical and paranoid.',
        exampleDesc: 'A half-crushed pack. The foil catches light like a tiny sunset. Someone loved these once, or needed them, which is almost the same thing.',
    },
    noir_detective: {
        descStyle: 'Hardboiled and cynical. Every object has a story, and most of them end badly. Describe items like a PI cataloguing evidence.',
        quipStyle: 'Voices are world-weary and sharp. Logic deduces coldly, Empathy reads the room, Half Light keeps one hand near the gun.',
        exampleDesc: 'A lighter that\'s seen better days. The kind of thing you find in a dead man\'s pocket and wish you hadn\'t.',
    },
    fantasy: {
        descStyle: 'Evocative and lore-rich. Items feel like they have history — enchanted, cursed, or simply old enough to matter. Describe with a sense of wonder or dread.',
        quipStyle: 'Voices speak like advisors in a fantasy court — the wizard analyzes, the ranger assesses utility, the bard finds beauty.',
        exampleDesc: 'A vial of something luminous. The glass is warm to the touch and the liquid inside shifts color when no one is looking.',
    },
    cyberpunk: {
        descStyle: 'Tech-noir and street-smart. Items are either corporate products or jury-rigged street gear. Everything has specs, model numbers, or street value.',
        quipStyle: 'Voices are augmented and jacked-in. Logic runs cost-benefit, Interfacing evaluates tech specs, Electrochemistry rates the high.',
        exampleDesc: 'A stim injector, Arasaka manufacture, serial filed off. The dosage indicator reads 73%. Someone was saving the rest.',
    },
    space_opera: {
        descStyle: 'Vast and clinical with moments of cosmic wonder. Items are catalogued like ship inventory but carry the weight of deep space isolation.',
        quipStyle: 'Voices are mission-focused but haunted by the void. Logic calculates utility, Shivers feels the emptiness between stars.',
        exampleDesc: 'Standard-issue ration bar, vacuum-sealed. The packaging says "TERRAN BLEND" but nothing tastes like home out here.',
    },
    romance: {
        descStyle: 'Emotionally resonant. Items carry personal significance — gifts, mementos, comfort objects. Focus on what the item means, not just what it is.',
        quipStyle: 'Voices are emotionally attuned. Empathy reads the heart, Drama sees the romance, Volition counsels restraint.',
        exampleDesc: 'A dried flower pressed between pages. The petals have lost their color but not their meaning.',
    },
    thriller_horror: {
        descStyle: 'Unsettling and clinical. Describe items the way a forensic report would — precise details that make ordinary things feel wrong.',
        quipStyle: 'Voices are on edge. Logic tries to rationalize, Half Light screams danger, Inland Empire senses what can\'t be explained.',
        exampleDesc: 'A flashlight. The beam flickers at irregular intervals. The batteries are fresh. You checked.',
    },
    post_apocalyptic: {
        descStyle: 'Practical and scarce. Everything is salvage. Describe items by what they\'re worth, what they\'re made from, and how long they\'ll last.',
        quipStyle: 'Voices are survival-focused. Logic assesses trade value, Endurance evaluates calories, Half Light watches for thieves.',
        exampleDesc: 'A tin of something. The label rotted off years ago. Could be beans. Could be dog food. Either way, it\'s dinner.',
    },
    generic: {
        descStyle: 'Atmospheric and fitting to the scene. Describe items with character — what they look like, feel like, what story they tell.',
        quipStyle: 'Voices offer distinct perspectives — analytical, emotional, instinctive. Each sees the item differently.',
        exampleDesc: 'An object with a history. Scratched, used, carried. It belongs to someone now.',
    }
};

/**
 * Get the active genre's item tone
 */
function getGenreItemTone() {
    try {
        const { getActiveProfileId } = window.TribunalProfiles || {};
        const genreId = getActiveProfileId?.() || 'disco_elysium';
        return GENRE_ITEM_TONES[genreId] || GENRE_ITEM_TONES.generic;
    } catch {
        return GENRE_ITEM_TONES.disco_elysium;
    }
}

// ═══════════════════════════════════════════════════════════════
// FIXED: PARENTHESIS-AWARE ITEM PARSER
// "Pack of Astras (3x), Lighter" → ["Pack of Astras (3x)", "Lighter"]
// ═══════════════════════════════════════════════════════════════

/**
 * Parse item strings with parenthesis-aware splitting
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
                const cleaned = cleanItemString(currentItem);
                if (cleaned) items.push(cleaned);
                currentItem = '';
            }
        } else if (char === '&' && parenDepth === 0) {
            const prevChar = i > 0 ? processed[i - 1] : '';
            const nextChar = i < processed.length - 1 ? processed[i + 1] : '';
            if (prevChar === ' ' && nextChar === ' ') {
                const cleaned = cleanItemString(currentItem);
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
    const cleaned = cleanItemString(currentItem);
    if (cleaned) items.push(cleaned);
    
    return items;
}

/**
 * Clean a single item string (helper for parseItems)
 */
function cleanItemString(item) {
    if (!item || typeof item !== 'string') return null;
    
    let cleaned = item.trim();
    if (cleaned === '' || cleaned.toLowerCase() === 'none') return null;
    
    // Strip list markers
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
 * 
 * @param {string} text - Text to scan (AI message or user message)
 * @param {object} options - Extraction options
 * @param {string} options.playerName - Player character name for pattern matching
 * @param {boolean} options.isUserMessage - True if this is the user's own message
 */
export function quickExtractItemNames(text, options = {}) {
    if (!text) return [];
    
    const { playerName = '', isUserMessage = false } = options;
    const items = [];
    const seen = new Set();
    
    // ─────────────────────────────────────────────────────────────────
    // PLAYER NAME PATTERNS (works for both user and AI messages)
    // "[Name] pulls out a cigarette", "[Name] grabs the lighter"
    // Used when player writes in third person OR AI describes player
    // ─────────────────────────────────────────────────────────────────
    
    if (playerName) {
        // Escape regex special chars in name
        const escapedName = playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const namePatterns = [
            // "[Name] pulls out/grabs/takes/gets a [item]"
            new RegExp(`${escapedName}\\s+(?:pulls?\\s+out|grabs?|takes?|gets?|produces?|fishes?\\s+out|digs?\\s+out)\\s+(?:a|an|the|his|her|their)?\\s*([^.,;!?\\n]+)`, 'gi'),
            // "[Name] hands/gives/offers [someone] a [item]"
            new RegExp(`${escapedName}\\s+(?:hands?|gives?|offers?|passes?|tosses?)\\s+(?:\\w+\\s+)?(?:a|an|the)?\\s*([^.,;!?\\n]+)`, 'gi'),
            // "[Name] lights/smokes/drinks a [item]"
            new RegExp(`${escapedName}\\s+(?:lights?|smokes?|drinks?|uses?|consumes?)\\s+(?:a|an|the|his|her)?\\s*([^.,;!?\\n]+)`, 'gi'),
            // "[Name]'s cigarettes/lighter" (possessive - only known item types)
            new RegExp(`${escapedName}'s\\s+((?:pack\\s+of\\s+)?(?:cigarettes?|cigs?|smokes|lighter|zippo|matches|wallet|phone|keys?|gun|pistol|knife|badge|bottle|beer|whiskey))`, 'gi'),
        ];
        
        for (const pattern of namePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const normalized = normalizeItemName(match[1]);
                if (normalized && normalized.length > 2 && normalized.split(' ').length <= 4) {
                    const type = inferInventoryType(normalized);
                    if (type !== 'other' && !seen.has(normalized.toLowerCase())) {
                        seen.add(normalized.toLowerCase());
                        items.push(normalized);
                    }
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // FIRST PERSON PATTERNS (for users who write "I pull out...")
    // Only check in user messages
    // ─────────────────────────────────────────────────────────────────
    
    if (isUserMessage) {
        const firstPersonPatterns = [
            // "I pull out/grab/take a [item]"
            /\bI\s+(?:pull\s+out|grab|take|get|fish\s+out|dig\s+out|produce)\s+(?:a|an|the|my|some)?\s*([^.,;!?\n]+)/gi,
            // "I hand/give/offer [someone] a [item]"
            /\bI\s+(?:hand|give|offer|pass|toss)\s+(?:\w+\s+)?(?:a|an|the|my)?\s*([^.,;!?\n]+)/gi,
            // "I light a [cigarette]", "I smoke a [cigarette]"
            /\bI\s+(?:light|smoke|drink|use|consume)\s+(?:a|an|the|my)?\s*([^.,;!?\n]+)/gi,
        ];
        
        for (const pattern of firstPersonPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const normalized = normalizeItemName(match[1]);
                if (normalized && normalized.length > 2 && normalized.split(' ').length <= 5) {
                    const type = inferInventoryType(normalized);
                    if (type !== 'other' && !seen.has(normalized.toLowerCase())) {
                        seen.add(normalized.toLowerCase());
                        items.push(normalized);
                    }
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // SECOND PERSON PATTERNS (AI messages directed at player)
    // "You pull out a cigarette", "hands you a lighter"
    // ─────────────────────────────────────────────────────────────────
    
    if (!isUserMessage) {
        const receivePatterns = [
            // "hands YOU a [item]", "gives YOU the [item]"
            /(?:hands?|gives?|offers?|passes?|tosses?)\s+you\s+(?:a|an|the|some)?\s*([^.,;!?\n]+)/gi,
            // "YOU pull out/grab/take"
            /\byou\s+(?:pull\s+out|grab|take|get|fish\s+out|produce)\s+(?:a|an|the|your)?\s*([^.,;!?\n]+)/gi,
            // "YOU receive/accept" 
            /\byou\s+(?:receive|accept|pocket|pick\s*up)\s+(?:a|an|the|it)?\s*([^.,;!?\n]+)/gi,
            // "puts a [item] in YOUR hand/pocket"
            /puts?\s+(?:a|an|the|some)?\s*([^.,;!?\n]+?)\s+(?:in|into)\s+your/gi,
            // "slips [item] into YOUR pocket/hand"
            /slips?\s+(?:a|an|the|some)?\s*([^.,;!?\n]+?)\s+into\s+your/gi,
        ];
        
        for (const pattern of receivePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const normalized = normalizeItemName(match[1]);
                if (normalized && normalized.length > 2 && normalized.split(' ').length <= 5) {
                    const type = inferInventoryType(normalized);
                    if (type !== 'other' && !seen.has(normalized.toLowerCase())) {
                        seen.add(normalized.toLowerCase());
                        items.push(normalized);
                    }
                }
            }
        }
        
        // Pattern: "your cigarettes", "your lighter" (possession in AI text)
        const playerPossessionPatterns = [
            /\byour\s+(?:pack\s+of\s+)?(?:cigarette(?:s)?|cig(?:s)?|smokes)/gi,
            /\byour\s+(?:bottle\s+of\s+)?(?:beer|wine|whiskey|vodka|booze)/gi,
            /\byour\s+(?:lighter|zippo|matches)/gi,
            /\byour\s+(?:wallet|phone|keys?|knife|gun|pistol)/gi,
            /\byour\s+(?:badge|id\s*card|credentials)/gi,
        ];
        
        for (const pattern of playerPossessionPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const itemPart = match[0].replace(/^your\s+/i, '');
                const normalized = normalizeItemName(itemPart);
                if (normalized && normalized.length > 2 && !seen.has(normalized.toLowerCase())) {
                    seen.add(normalized.toLowerCase());
                    items.push(normalized);
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // PERSONA FORMAT (structured lists in persona description)
    // ─────────────────────────────────────────────────────────────────
    
    // Pattern: Inventory: ["item, item, item"]
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
    
    // Pattern: Items: [...] or Carrying: [...]
    const itemsMatch = text.match(/(?:Items|Carrying|Possessions|Belongings|On Person)\s*:?\s*\[?"?([^\]"]+)"?\]?/i);
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
    
    console.log('[Inventory] Extracted:', items, isUserMessage ? '(user)' : '(AI)', playerName ? `[${playerName}]` : '');
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
    
    let cleaned = raw.trim();
    
    // Remove surrounding punctuation and brackets
    cleaned = cleaned.replace(/^["'\[\(\{<]+|["'\]\)\}>.,;:!?]+$/g, '');
    
    // Strip markdown: **bold**, *italic*, `code`
    cleaned = cleaned
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1');
    
    // Strip list markers: "- item", "1. item"
    cleaned = cleaned.replace(/^[-•*]\s+/, '');
    cleaned = cleaned.replace(/^\d+\.\s+/, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    if (cleaned.length < 2) return null;
    
    // Remove leading quantity indicators
    cleaned = cleaned.replace(/^\d+x?\s*/i, '');
    
    // Don't accept non-items
    const invalidPatterns = [
        /^(the|a|an|some|his|her|their|your|my)$/i,
        /^(it|this|that|these|those)$/i,
        /^(and|or|but|with|from|to|for)$/i,
    ];
    if (invalidPatterns.some(p => p.test(cleaned))) {
        return null;
    }
    
    // Capitalize each word
    return cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM GENERATION (genre-aware)
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
    const consumable = isConsumable(inferredType);
    
    const genreIntro = getProfileValue('systemIntro', 
        'You are channeling the internal skill voices of a character.');
    const tone = getGenreItemTone();
    
    const systemPrompt = `${genreIntro} Every item tells a story. The skills in your head all have opinions about what you carry.

DESCRIPTION STYLE: ${tone.descStyle}
QUIP STYLE: ${tone.quipStyle}

${addictive ? 'This is an ADDICTIVE substance. Electrochemistry should be EXCITED about it. Volition should DISAPPROVE.' : ''}

Output ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate rich data for this inventory item:

ITEM: ${itemName}
TYPE: ${inferredType} (${typeInfo?.label || 'Unknown'})
CONSUMABLE: ${consumable ? 'Yes' : 'No'}
CONTEXT: ${context || 'Found in the character\'s possession'}
${addictive ? `ADDICTIVE: Yes - this item feeds an addiction` : ''}

<skills>
${SKILL_REFERENCE}
</skills>

<effect_ids>
${EFFECT_ID_REFERENCE}
</effect_ids>

Respond with ONLY this JSON structure:
{
  "name": "${itemName}",
  "type": "${inferredType}",
  "effectId": "${consumable ? 'CHOOSE_FROM_EFFECT_IDS' : 'none'}",
  "description": "2-3 sentence evocative description matching the setting tone.",
  "voiceQuips": [
    {"skill": "skill_id", "text": "One-liner about this item", "approves": true},
    {"skill": "other_skill", "text": "Different perspective one-liner", "approves": false}
  ]
}

EFFECT ID RULES:
- Pick the MOST APPROPRIATE effect_id from the list above
- Beer/wine/spirits → revacholian_courage
- Cigarettes/tobacco → nicotine_rush  
- Pyrholidon specifically → pyrholidon
- Speed/amphetamines → speed_freaks_delight
- Food → satiated
- Medicine/painkillers → medicated
- Non-consumables → none

QUIP GUIDELINES:
${addictive ? `
- electrochemistry MUST approve enthusiastically
- volition or logic SHOULD disapprove
` : `
- Pick skills that would have opinions on this item
- One approving, one disapproving (or both can approve/disapprove based on item)
`}
- Keep quips short and punchy (under 15 words)
- Channel each voice's personality

Generate 2 voice quips from different skills.`;

    try {
        const response = await callInventoryAPI(systemPrompt, userPrompt);
        
        if (!response) {
            console.warn('[Inventory] No API response for:', itemName);
            return createFallbackItem(itemName);
        }
        
        const parsed = parseItemResponse(response, itemName, inferredType);
        if (parsed) {
            console.log('[Inventory] ✓ Generated:', parsed.name, 'effectId:', parsed.effectId);
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
// BATCH GENERATION (genre-aware)
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
    
    const batchGenreIntro = getProfileValue('systemIntro', 
        'You are channeling the internal skill voices of a character.');
    const tone = getGenreItemTone();
    
    const systemPrompt = `${batchGenreIntro} Generate data for multiple inventory items.

DESCRIPTION STYLE: ${tone.descStyle}
QUIP STYLE: ${tone.quipStyle}

Output ONLY valid JSON array, no markdown.`;
    
    const userPrompt = `Generate data for these inventory items:

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
    const consumable = isConsumable(type);
    
    // Validate effectId - must be from valid list or infer from type
    let effectId = item.effectId || null;
    if (effectId && !VALID_EFFECT_IDS[effectId]) {
        console.warn('[Inventory] Invalid effectId:', effectId, '- inferring from type');
        effectId = null;
    }
    if (!effectId && consumable) {
        effectId = inferEffectIdFromType(type);
    }
    
    const validated = {
        name: name,
        type: type,
        category: consumable ? 'consumable' : 'misc',
        effectId: effectId || 'none',
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

/**
 * Infer effect ID from item type (fallback)
 */
function inferEffectIdFromType(type) {
    const typeToEffect = {
        cigarette: 'nicotine_rush',
        alcohol: 'revacholian_courage',
        drug: 'speed_freaks_delight',
        food: 'satiated',
        medicine: 'medicated'
    };
    return typeToEffect[type] || 'none';
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK ITEM (when AI fails) - genre-aware
// ═══════════════════════════════════════════════════════════════

function createFallbackItem(name) {
    const type = inferInventoryType(name);
    const typeInfo = INVENTORY_TYPES[type];
    const consumable = isConsumable(type);
    
    return {
        name: name,
        type: type,
        category: consumable ? 'consumable' : 'misc',
        effectId: inferEffectIdFromType(type),
        addictive: isAddictive(type),
        addictionType: getAddictionData(type)?.type || null,
        description: `A ${name.toLowerCase()}. It's yours now.`,
        voiceQuips: generateFallbackQuips(type),
        source: 'fallback',
        generatedAt: Date.now()
    };
}

/**
 * Genre-aware fallback quips when AI generation fails
 */
function generateFallbackQuips(type) {
    // These are intentionally genre-neutral — they work across all settings
    const quips = {
        cigarettes: [
            { skill: 'electrochemistry', text: 'Light one up. You know you want to.', approves: true },
            { skill: 'volition', text: 'You\'re better than this dependency.', approves: false }
        ],
        alcohol: [
            { skill: 'electrochemistry', text: 'The good stuff. Pour one out for yourself.', approves: true },
            { skill: 'logic', text: 'Your body would like a word.', approves: false }
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
// LOSS EXTRACTION - Items being consumed/lost/taken
// ═══════════════════════════════════════════════════════════════

/**
 * Extract items that were lost/consumed/taken from text
 * Used to auto-remove items from inventory
 */
export function extractLostItems(text) {
    if (!text) return [];
    
    const items = [];
    const seen = new Set();
    
    const lossPatterns = [
        // "you smoke/drink/consume/use the [item]"
        /(?:you\s+)?(?:smoke|drink|consume|use|inject|swallow|eat|finish)\s+(?:the|your|a|an)?\s*([^.,;!?\n]+)/gi,
        // "takes the [item] from you"
        /takes?\s+(?:the|your|a|an)?\s*([^.,;!?\n]+?)\s+(?:from|away)/gi,
        // "the [item] is gone/empty/finished"
        /(?:the|your)\s+([^.,;!?\n]+?)\s+(?:is|are)\s+(?:gone|empty|finished|depleted|used\s*up)/gi,
        // "you drop/lose/discard the [item]"
        /(?:you\s+)?(?:drop|lose|discard|throw\s+away|toss)\s+(?:the|your|a|an)?\s*([^.,;!?\n]+)/gi,
        // "last cigarette/pill/etc"
        /(?:your\s+)?last\s+([^.,;!?\n]+)/gi,
    ];
    
    for (const pattern of lossPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const normalized = normalizeItemName(match[1]);
            if (normalized && normalized.length > 2 && normalized.split(' ').length <= 4) {
                const type = inferInventoryType(normalized);
                if (type !== 'other' && !seen.has(normalized.toLowerCase())) {
                    seen.add(normalized.toLowerCase());
                    items.push(normalized);
                }
            }
        }
    }
    
    return items;
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE SCANNING - For recent messages and auto-extraction
// ═══════════════════════════════════════════════════════════════

/**
 * Get SillyTavern context (safe import)
 */
function getSTContext() {
    try {
        if (typeof window !== 'undefined' && window.SillyTavern?.getContext) {
            return window.SillyTavern.getContext();
        }
        // Fallback for direct import
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Scan recent AI messages for inventory items
 * @param {number} messageCount - How many recent messages to scan (default 3)
 * @returns {Promise<{gained: string[], lost: string[]}>}
 */
export async function scanRecentMessages(messageCount = 3) {
    const context = getSTContext();
    if (!context) {
        console.warn('[Inventory] Cannot access SillyTavern context');
        return { gained: [], lost: [] };
    }
    
    const chat = context.chat || [];
    if (chat.length === 0) {
        return { gained: [], lost: [] };
    }
    
    // Get last N AI messages (not user messages)
    const recentMessages = chat
        .slice(-messageCount * 2) // Get more to filter
        .filter(m => m.is_user === false)
        .slice(-messageCount)
        .map(m => m.mes)
        .join('\n\n');
    
    if (!recentMessages) {
        return { gained: [], lost: [] };
    }
    
    const gained = quickExtractItemNames(recentMessages);
    const lost = extractLostItems(recentMessages);
    
    console.log('[Inventory] Scanned messages - Gained:', gained, 'Lost:', lost);
    
    return { gained, lost };
}

/**
 * Extract inventory changes from a single message
 * Designed for MESSAGE_RECEIVED hook
 * @param {string} messageText - The message content
 * @returns {{gained: string[], lost: string[]}}
 */
export function extractFromMessage(messageText) {
    if (!messageText || messageText.length < 20) {
        return { gained: [], lost: [] };
    }
    
    const gained = quickExtractItemNames(messageText);
    const lost = extractLostItems(messageText);
    
    // Filter out items that appear in both (ambiguous)
    const lostSet = new Set(lost.map(i => i.toLowerCase()));
    const filteredGained = gained.filter(i => !lostSet.has(i.toLowerCase()));
    
    const gainedSet = new Set(filteredGained.map(i => i.toLowerCase()));
    const filteredLost = lost.filter(i => !gainedSet.has(i.toLowerCase()));
    
    return { 
        gained: filteredGained, 
        lost: filteredLost 
    };
}

/**
 * Full extraction pipeline for MESSAGE_RECEIVED
 * Extracts items, generates data, returns ready-to-add items
 * @param {string} messageText - The AI message
 * @param {object} options - Options
 * @param {function} options.getFromStash - Function to check stash cache
 * @param {function} options.saveToStash - Function to save to stash cache
 * @returns {Promise<{toAdd: object[], toRemove: string[]}>}
 */
export async function processMessageForInventory(messageText, options = {}) {
    const { getFromStash, saveToStash } = options;
    
    const { gained, lost } = extractFromMessage(messageText);
    
    const toAdd = [];
    const toRemove = lost;
    
    // Process gained items
    for (const itemName of gained) {
        // Check stash first
        let itemData = getFromStash?.(itemName);
        
        if (itemData) {
            toAdd.push(itemData);
        } else {
            // Generate new item data
            itemData = await generateSingleItem(itemName);
            if (itemData) {
                saveToStash?.(itemData);
                toAdd.push(itemData);
            }
        }
    }
    
    return { toAdd, toRemove };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    normalizeStashKey,
    quickExtractItemNames,
    quickExtractItemsWithQuantity,
    extractLostItems,
    scanRecentMessages,
    extractFromMessage,
    processMessageForInventory,
    generateSingleItem,
    generateMultipleItems,
    parseItems  // Exported for testing/reuse
};
