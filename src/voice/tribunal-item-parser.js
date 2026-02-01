/**
 * The Tribunal - Improved Item Parser
 * Based on RPG Companion's battle-tested patterns
 * 
 * Handles AI formatting quirks:
 * - Parenthesis-aware splitting: "Sword (cursed, +2)" stays intact
 * - Decimal comma preservation: "1,000 gold" doesn't split
 * - Markdown stripping: **Bold Item** → Bold Item
 * - List marker removal: "- Item", "1. Item" → Item
 * - Bracket handling: [Sword, Shield] → Sword, Shield
 * - Newline conversion: "Item1\nItem2" → Item1, Item2
 */

// ═══════════════════════════════════════════════════════════════
// MAIN PARSER - Use this instead of .split()
// ═══════════════════════════════════════════════════════════════

/**
 * Parse item strings from AI responses into clean arrays.
 * This is the main function to use instead of simple .split()
 * 
 * @param {string} itemString - Item string from AI (various formats supported)
 * @returns {string[]} Array of clean item names, or empty array if none
 * 
 * @example
 * parseItems("Sword, Shield, 3x Potions") // ["Sword", "Shield", "3x Potions"]
 * parseItems("Leather Jacket (worn, vintage), Boots") // ["Leather Jacket (worn, vintage)", "Boots"]
 * parseItems("**Sword** (equipped), *Shield*") // ["Sword (equipped)", "Shield"]
 * parseItems("- Sword\n- Shield") // ["Sword", "Shield"]
 */
export function parseItems(itemString) {
    // Handle null/undefined/non-string
    if (!itemString || typeof itemString !== 'string') {
        return [];
    }

    let processed = itemString.trim();

    // Quick check for "None" or empty
    if (processed === '' || processed.toLowerCase() === 'none') {
        return [];
    }

    // STEP 1: Strip wrapping brackets/braces
    // AI sometimes wraps entire lists: [Sword, Shield]
    while (
        (processed.startsWith('[') && processed.endsWith(']')) ||
        (processed.startsWith('{') && processed.endsWith('}'))
    ) {
        processed = processed.slice(1, -1).trim();
        if (processed === '' || processed.toLowerCase() === 'none') {
            return [];
        }
    }

    // STEP 2: Strip wrapping quotes
    // AI sometimes quotes entire lists: "Sword, Shield"
    if ((processed.startsWith('"') && processed.endsWith('"')) ||
        (processed.startsWith("'") && processed.endsWith("'"))) {
        processed = processed.slice(1, -1).trim();
        if (processed === '' || processed.toLowerCase() === 'none') {
            return [];
        }
    }

    // STEP 3: Convert newlines to commas (OUTSIDE parentheses)
    // Handles newline-based lists: "Sword\nShield\nPotion"
    let withCommas = '';
    let parenDepth = 0;

    for (let i = 0; i < processed.length; i++) {
        const char = processed[i];

        if (char === '(') {
            parenDepth++;
            withCommas += char;
        } else if (char === ')') {
            parenDepth = Math.max(0, parenDepth - 1); // Graceful handling
            withCommas += char;
        } else if ((char === '\n' || char === '\r') && parenDepth === 0) {
            // Newline outside parentheses - convert to comma separator
            const prevChar = withCommas[withCommas.length - 1];
            if (prevChar && prevChar !== ',' && prevChar !== '\n') {
                withCommas += ',';
            }
        } else if ((char === '\n' || char === '\r') && parenDepth > 0) {
            // Newline inside parentheses - convert to space
            if (withCommas[withCommas.length - 1] !== ' ') {
                withCommas += ' ';
            }
        } else {
            withCommas += char;
        }
    }
    processed = withCommas;

    // STEP 4: Strip markdown formatting
    processed = processed
        .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
        .replace(/\*(.+?)\*/g, '$1')      // *italic* → italic
        .replace(/`(.+?)`/g, '$1')        // `code` → code
        .replace(/~~(.+?)~~/g, '$1');     // ~~strike~~ → strike

    // STEP 5: Normalize whitespace
    processed = processed.replace(/\s+/g, ' ');

    // STEP 6: Smart comma splitting (only split on commas OUTSIDE parentheses)
    // Also handles + and & separators commonly used for appearance
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
        } else if ((char === ',' || char === '+' || char === '|') && parenDepth === 0) {
            // Check if this comma is between digits (decimal separator like 1,000)
            const prevChar = i > 0 ? processed[i - 1] : '';
            const nextChar = i < processed.length - 1 ? processed[i + 1] : '';
            const isDecimalComma = char === ',' && /\d/.test(prevChar) && /\d/.test(nextChar);

            if (isDecimalComma) {
                // This is a decimal comma, not a separator - keep it
                currentItem += char;
            } else {
                // Separator found - finalize current item
                const cleaned = cleanSingleItem(currentItem);
                if (cleaned) {
                    items.push(cleaned);
                }
                currentItem = '';
            }
        } else if (char === '&' && parenDepth === 0) {
            // & is a separator but might be "Tom & Jerry" - check context
            // If surrounded by spaces, treat as separator
            const prevChar = i > 0 ? processed[i - 1] : '';
            const nextChar = i < processed.length - 1 ? processed[i + 1] : '';
            if (prevChar === ' ' && nextChar === ' ') {
                const cleaned = cleanSingleItem(currentItem);
                if (cleaned) {
                    items.push(cleaned);
                }
                currentItem = '';
            } else {
                currentItem += char;
            }
        } else {
            currentItem += char;
        }
    }

    // Don't forget the last item
    const cleaned = cleanSingleItem(currentItem);
    if (cleaned) {
        items.push(cleaned);
    }

    return items;
}

/**
 * Cleans a single item string
 * Removes list markers, wrapping quotes, trims, and capitalizes
 * 
 * @param {string} item - Single item string to clean
 * @returns {string|null} Cleaned item or null if empty/invalid
 */
function cleanSingleItem(item) {
    if (!item || typeof item !== 'string') {
        return null;
    }

    let cleaned = item.trim();

    // Filter "None"
    if (cleaned === '' || cleaned.toLowerCase() === 'none') {
        return null;
    }

    // Strip list markers
    cleaned = cleaned.replace(/^[-•*]\s+/, '');     // "- Item" → "Item"
    cleaned = cleaned.replace(/^\d+\.\s+/, '');     // "1. Item" → "Item"
    cleaned = cleaned.replace(/^[a-z]\)\s+/i, '');  // "a) Item" → "Item"

    // Strip wrapping quotes from individual items
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }

    // Final empty check
    if (cleaned === '' || cleaned.toLowerCase() === 'none') {
        return null;
    }

    // Capitalize first letter for consistency
    // Preserves rest of string case (e.g., "iPhone" stays "iPhone")
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
}

// ═══════════════════════════════════════════════════════════════
// ITEM NAME NORMALIZATION (improved version)
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize an item name extracted from prose
 * More aggressive cleaning than parseItems for single extractions
 * 
 * @param {string} raw - Raw extracted text
 * @returns {string|null} Normalized name or null
 */
export function normalizeItemName(raw) {
    if (!raw) return null;
    
    let cleaned = raw.trim();
    
    // Remove surrounding punctuation and brackets
    cleaned = cleaned.replace(/^["'\[\(\{<]+|["'\]\)\}>.,;:!?]+$/g, '');
    
    // Strip markdown
    cleaned = cleaned
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    if (cleaned.length < 2) return null;
    
    // Don't accept items that are clearly not items
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
// SERIALIZATION - Convert array back to string
// ═══════════════════════════════════════════════════════════════

/**
 * Serialize items array back to string format
 * 
 * @param {string[]} itemArray - Array of item names
 * @param {string} separator - Separator to use (default ", ")
 * @returns {string} Serialized string or "None"
 */
export function serializeItems(itemArray, separator = ', ') {
    if (!itemArray || !Array.isArray(itemArray)) {
        return 'None';
    }

    const cleaned = itemArray
        .filter(item => item && typeof item === 'string' && item.trim() !== '')
        .map(item => item.trim());

    if (cleaned.length === 0) {
        return 'None';
    }

    return cleaned.join(separator);
}

// ═══════════════════════════════════════════════════════════════
// QUANTITY EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract quantity from item string
 * Handles: "3x Potions", "Potions (3)", "3 Potions"
 * 
 * @param {string} itemString - Item string with potential quantity
 * @returns {{name: string, quantity: number}}
 */
export function extractQuantity(itemString) {
    if (!itemString) return { name: '', quantity: 1 };
    
    let name = itemString.trim();
    let quantity = 1;
    
    // Pattern 1: "3x Potions" or "3 x Potions"
    const prefixMatch = name.match(/^(\d+)\s*x\s+(.+)$/i);
    if (prefixMatch) {
        quantity = parseInt(prefixMatch[1], 10);
        name = prefixMatch[2].trim();
        return { name, quantity };
    }
    
    // Pattern 2: "Potions (3)" or "Potions (x3)"
    const suffixMatch = name.match(/^(.+?)\s*\((?:x)?(\d+)\)$/i);
    if (suffixMatch) {
        name = suffixMatch[1].trim();
        quantity = parseInt(suffixMatch[2], 10);
        return { name, quantity };
    }
    
    // Pattern 3: "3 Potions" (number at start, not followed by 'x')
    const simpleMatch = name.match(/^(\d+)\s+([a-zA-Z].+)$/);
    if (simpleMatch) {
        quantity = parseInt(simpleMatch[1], 10);
        name = simpleMatch[2].trim();
        return { name, quantity };
    }
    
    return { name, quantity: 1 };
}

// ═══════════════════════════════════════════════════════════════
// STATUS/TAG EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract status tags from item string
 * Handles: "Sword (equipped)", "Armor (damaged, rusty)"
 * 
 * @param {string} itemString - Item string with potential status
 * @returns {{name: string, tags: string[]}}
 */
export function extractTags(itemString) {
    if (!itemString) return { name: '', tags: [] };
    
    // Match parenthetical content at end
    const match = itemString.match(/^(.+?)\s*\(([^)]+)\)$/);
    
    if (match) {
        const name = match[1].trim();
        const tagString = match[2];
        
        // Split tags by comma, clean each
        const tags = tagString
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t);
        
        return { name, tags };
    }
    
    return { name: itemString.trim(), tags: [] };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    parseItems,
    normalizeItemName,
    serializeItems,
    extractQuantity,
    extractTags
};
