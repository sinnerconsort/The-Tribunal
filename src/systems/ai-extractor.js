/**
 * The Tribunal - AI Extractor
 * Uses AI to extract game state from chat messages
 * 
 * EXPANDED: Now extracts:
 * - Quests/Cases (existing)
 * - Contacts/NPCs (existing)
 * - Locations (existing)
 * - Equipment/Clothing (NEW)
 * - Inventory items (NEW)
 * - Vitals changes - HP/Morale (NEW)
 * 
 * This is more accurate than regex patterns because the AI understands context.
 */

import { getSettings, getChatState, saveChatState } from '../core/state.js';

// Try to import API helpers - handle both possible function names
let callAPIWithTokens = null;
let callAPI = null;

try {
    const apiHelpers = await import('../voice/api-helpers.js');
    callAPIWithTokens = apiHelpers.callAPIWithTokens;
    callAPI = apiHelpers.callAPI;
    console.log('[AI Extractor] API helpers loaded:', {
        callAPIWithTokens: !!callAPIWithTokens,
        callAPI: !!callAPI
    });
} catch (e) {
    console.error('[AI Extractor] Failed to load api-helpers:', e.message);
}

/**
 * Wrapper to call API with either function
 */
async function makeAPICall(systemPrompt, userPrompt, maxTokens) {
    if (callAPIWithTokens) {
        return await makeAPICall(systemPrompt, userPrompt, maxTokens);
    } else if (callAPI) {
        return await callAPI(systemPrompt, userPrompt, { maxTokens, temperature: 0.3 });
    } else {
        console.error('[AI Extractor] No API function available!');
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXTRACTION PROMPT (EXPANDED)
// ═══════════════════════════════════════════════════════════════

/**
 * Build the extraction prompt for analyzing a message
 */
function buildExtractionPrompt(messageText, existingData = {}) {
    const {
        cases = [],
        contacts = [],
        locations = [],
        equipment = [],
        inventory = []
    } = existingData;
    
    // Format existing data for context
    const existingCaseTitles = cases.map(c => `- "${c.title}" (${c.status})`).join('\n') || 'None';
    const existingContactNames = contacts.map(c => `- ${c.name}`).join('\n') || 'None';
    const existingLocationNames = locations.map(l => `- ${l.name}${l.district ? ` (${l.district})` : ''}`).join('\n') || 'None';
    const existingEquipment = equipment.map(e => `- ${e.name}`).join('\n') || 'None';
    const existingInventory = inventory.map(i => `- ${i.name}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`).join('\n') || 'None';
    
    return `Analyze this roleplay message and extract game state changes.

<message>
${messageText}
</message>

<existing_quests>
${existingCaseTitles}
</existing_quests>

<existing_contacts>
${existingContactNames}
</existing_contacts>

<existing_locations>
${existingLocationNames}
</existing_locations>

<existing_equipment>
${existingEquipment}
</existing_equipment>

<existing_inventory>
${existingInventory}
</existing_inventory>

Extract ALL of the following. Respond with ONLY valid JSON (no markdown, no explanation):

{
  "quests": {
    "new": [{"title": "Quest title", "description": "What to do", "priority": "main|side|optional"}],
    "completed": [{"title": "Existing quest title", "evidence": "Why it's complete"}],
    "updated": [{"title": "Existing quest title", "newHint": "New info"}]
  },
  "contacts": {
    "new": [{"name": "NPC name", "description": "Who they are", "relationship": "hostile|unfriendly|neutral|friendly|lover"}],
    "updated": [{"name": "Existing NPC", "relationshipChange": "new level", "newInfo": "new details"}]
  },
  "locations": {
    "new": [{"name": "Place name", "district": "Area", "description": "What it is"}],
    "current": "Name of current location or null"
  },
  "equipment": {
    "gained": [{"name": "Clothing/accessory item name", "context": "How it was obtained"}],
    "lost": [{"name": "Item name", "context": "How it was lost/removed"}],
    "changed": [{"name": "Item name", "change": "What changed - damaged, repaired, etc."}]
  },
  "inventory": {
    "gained": [{"name": "Item name", "quantity": 1, "context": "How obtained"}],
    "lost": [{"name": "Item name", "quantity": 1, "context": "How lost/used"}]
  },
  "vitals": {
    "health": {"change": 0, "reason": "Why HP changed or null"},
    "morale": {"change": 0, "reason": "Why morale changed or null"}
  }
}

RULES:
- EQUIPMENT = wearable items ONLY: clothing, shoes, hats, glasses, jewelry, bags, watches, accessories
- EQUIPMENT is NOT: body features, hair, eyes, scars, tattoos, physical descriptions
- INVENTORY = carried/usable items: weapons, tools, consumables, documents, money, keys, etc.
- VITALS: health damage from injuries/exhaustion; morale damage from emotional trauma/failure
- Use positive numbers for gains, negative for losses
- For completed quests, title must closely match existing
- If nothing to extract, use empty arrays [] or 0 for vitals
- Only extract CLEAR, EXPLICIT changes - don't assume or infer`;
}

// ═══════════════════════════════════════════════════════════════
// PERSONA EXTRACTION (for Scan Persona button)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract equipment/clothing from a persona description using AI
 * This is for the "Scan Persona" feature
 * 
 * @param {string} personaText - The persona description
 * @returns {Promise<string[]>} Array of clothing item names
 */
export async function extractEquipmentFromPersona(personaText) {
    if (!personaText || personaText.length < 10) return [];
    
    console.log('[AI Extractor] Extracting equipment from persona...');
    
    try {
        const systemPrompt = `You extract ONLY wearable clothing and accessories from character descriptions.

EXTRACT these types of items:
- Garments: shirts, pants, jackets, coats, dresses, skirts, sweaters, hoodies, etc.
- Footwear: shoes, boots, sneakers, sandals, heels, etc.
- Accessories: hats, glasses, scarves, belts, ties, gloves, etc.
- Jewelry: rings, necklaces, bracelets, earrings, watches, chokers, etc.
- Bags: backpacks, purses, briefcases, satchels, etc.

DO NOT EXTRACT (these are body features, not clothing):
- Physical features: face shape, body type, height, weight, build
- Hair: hair color, hair style, hair length, facial hair, beards, mutton chops
- Eyes: eye color, eye shape
- Skin: skin color, skin tone, complexion, tan
- Body marks: scars, tattoos, birthmarks, freckles, moles, piercings
- Body parts: arms, legs, hands, face, chest
- Physical states: "bloated face", "burst capillaries", "ravaged look", "the expression"
- Abstract descriptions: "worn look", "tired appearance"
- Field labels: "Hair:", "Eyes:", "Appearance:", "Clothing:"

Respond with ONLY a JSON array of clothing item names, nothing else.
Keep item names concise but descriptive (e.g., "Black Leather Jacket", not just "Jacket").
If an item has a specific style or color mentioned, include it.
If no clothing items found, respond with: []`;

        const userPrompt = `Extract ONLY wearable clothing and accessories from this character description:

${personaText.substring(0, 3000)}

Respond with a JSON array of clothing item names only.`;

        const response = await makeAPICall(systemPrompt, userPrompt, 500);
        
        if (!response) {
            console.warn('[AI Extractor] No response for persona extraction');
            return [];
        }
        
        // Parse JSON array
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        
        if (arrayStart === -1 || arrayEnd === -1) {
            console.warn('[AI Extractor] No JSON array in response:', cleaned.substring(0, 100));
            return [];
        }
        
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
        
        const items = JSON.parse(cleaned);
        
        if (!Array.isArray(items)) return [];
        
        // Clean and validate
        const validItems = items
            .filter(item => typeof item === 'string' && item.trim().length > 1)
            .map(item => {
                let clean = item.trim();
                // Title case
                return clean.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            })
            .filter(item => item.length > 1 && item.length < 60);
        
        console.log('[AI Extractor] Extracted equipment from persona:', validItems);
        return validItems;
        
    } catch (error) {
        console.error('[AI Extractor] Persona extraction error:', error);
        return [];
    }
}

/**
 * Extract inventory items from BOTH persona AND chat context using AI
 * This mimics RPG Companion's "Refresh RPG Info" behavior
 * 
 * @param {string} personaText - The user's persona description
 * @param {string} chatContext - Recent chat messages
 * @returns {Promise<Array>} Array of inventory item objects
 */
export async function extractInventoryFromContext(personaText, chatContext) {
    console.log('[AI Extractor] Extracting inventory from persona + chat context...');
    console.log('[AI Extractor] Persona length:', personaText?.length || 0);
    console.log('[AI Extractor] Chat context length:', chatContext?.length || 0);
    
    const combinedText = `
=== CHARACTER PERSONA ===
${personaText || 'No persona provided.'}

=== RECENT ROLEPLAY ===
${chatContext || 'No chat context.'}
`.trim();

    if (combinedText.length < 30) {
        console.log('[AI Extractor] Combined text too short, skipping');
        return [];
    }
    
    console.log('[AI Extractor] Combined text preview:', combinedText.substring(0, 200) + '...');
    
    try {
        const systemPrompt = `You extract carried/pocket items from character descriptions and roleplay context.

Your job is to identify what items this character would reasonably have ON THEIR PERSON.

EXTRACT these types of items:
- Consumables: cigarettes, alcohol, drugs, food, gum, mints, candy, snacks
- Tools: lighters, flashlights, pens, phones, multitools, keys
- Personal effects: wallet, phone, keys (car keys, house keys), ID
- Documents: notes, letters, photos, business cards
- Money: cash, coins (estimate reasonable amounts based on context)
- Weapons: if mentioned, implied, or contextually appropriate
- Small accessories: headphones, glasses case, chapstick, etc.
- Context-specific items: items that make sense for the character's setting/situation

EXTRACTION RULES:
1. Include items EXPLICITLY mentioned in persona or chat
2. Include items the character USED, TOUCHED, or REFERENCED in chat
3. Include items that are STRONGLY IMPLIED (e.g., someone smoking = has cigarettes + lighter)
4. Include REASONABLE INFERENCES based on character type:
   - A modern human probably has: phone, wallet, keys
   - A smoker probably has: cigarettes, lighter
   - A student probably has: phone, pen, some cash
5. For consumables, estimate realistic quantities
6. Do NOT include clothing (that's equipment)
7. Do NOT include items clearly LOST or GIVEN AWAY in the chat
8. When in doubt, INCLUDE the item - it's better to have too many than too few

BE GENEROUS with inferences. If the character seems like they would have something, include it.

Respond with ONLY a JSON array:
[{"name": "Item Name", "quantity": 1, "type": "consumable|tool|document|money|weapon|misc", "reason": "brief reason"}]

If truly no items can be inferred, respond with: []`;

        const userPrompt = `Extract all pocket/carried items this character would have. Be generous with inferences based on character type and context:

${combinedText.substring(0, 4000)}

Return a JSON array of items with quantities. Remember: include reasonable inferences!`;

        console.log('[AI Extractor] Calling API...');
        const response = await makeAPICall(systemPrompt, userPrompt, 800);
        
        console.log('[AI Extractor] API response:', response ? response.substring(0, 300) : 'NULL/EMPTY');
        
        if (!response) {
            console.error('[AI Extractor] No response from API!');
            return [];
        }
        
        // Parse JSON array
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        
        if (arrayStart === -1 || arrayEnd === -1) {
            console.warn('[AI Extractor] No JSON array in inventory response:', cleaned.substring(0, 200));
            return [];
        }
        
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
        console.log('[AI Extractor] Cleaned JSON:', cleaned.substring(0, 200));
        
        const items = JSON.parse(cleaned);
        
        if (!Array.isArray(items)) {
            console.warn('[AI Extractor] Parsed result is not an array');
            return [];
        }
        
        // Clean and normalize items
        const validItems = items
            .filter(item => item && item.name && typeof item.name === 'string')
            .map(item => ({
                name: item.name.trim(),
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                type: item.type || inferInventoryType(item.name),
                reason: item.reason || null,
                source: 'ai-scan'
            }));
        
        console.log('[AI Extractor] Extracted inventory from context:', validItems.map(i => `${i.quantity}x ${i.name}`));
        return validItems;
        
    } catch (error) {
        console.error('[AI Extractor] Context inventory extraction error:', error);
        console.error('[AI Extractor] Error stack:', error.stack);
        return [];
    }
}

/**
 * Extract inventory items from a persona description using AI
 * 
 * @param {string} personaText - The persona description
 * @returns {Promise<Array>} Array of inventory item objects
 */
export async function extractInventoryFromPersona(personaText) {
    if (!personaText || personaText.length < 10) return [];
    
    console.log('[AI Extractor] Extracting inventory from persona...');
    
    try {
        const systemPrompt = `You extract ONLY carried/usable items from character descriptions.

EXTRACT these types of items:
- Weapons: guns, knives, batons, etc.
- Tools: lighters, flashlights, lockpicks, etc.
- Consumables: cigarettes, alcohol, drugs, food, medicine
- Documents: notes, letters, photos, IDs, badges
- Money: cash, coins, currency
- Keys and access items
- Small personal effects: wallet contents, pocket items

DO NOT EXTRACT:
- Clothing (that goes in equipment)
- Body features or descriptions
- Abstract concepts
- Things the character DOESN'T have

Respond with ONLY a JSON array of objects:
[{"name": "Item Name", "quantity": 1, "type": "weapon|tool|consumable|document|money|key|misc"}]

If no inventory items found, respond with: []`;

        const userPrompt = `Extract ONLY carried/usable items from this character description:

${personaText.substring(0, 3000)}

Respond with a JSON array.`;

        const response = await makeAPICall(systemPrompt, userPrompt, 500);
        
        if (!response) return [];
        
        // Parse JSON array
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        
        if (arrayStart === -1 || arrayEnd === -1) return [];
        
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
        
        const items = JSON.parse(cleaned);
        
        if (!Array.isArray(items)) return [];
        
        console.log('[AI Extractor] Extracted inventory from persona:', items);
        return items;
        
    } catch (error) {
        console.error('[AI Extractor] Inventory persona extraction error:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE EXTRACTION (for auto-extraction from AI responses)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract all game state changes from a message using AI
 * @param {string} messageText - The message to analyze
 * @param {object} options - Extraction options
 * @returns {Promise<object>} Extracted data
 */
export async function extractFromMessage(messageText, options = {}) {
    const {
        existingCases = [],
        existingContacts = [],
        existingLocations = [],
        existingEquipment = [],
        existingInventory = [],
        timeout = 30000
    } = options;
    
    const results = {
        quests: { new: [], completed: [], updated: [] },
        contacts: { new: [], updated: [] },
        locations: { new: [], visited: [], current: null },
        equipment: { gained: [], lost: [], changed: [] },
        inventory: { gained: [], lost: [] },
        vitals: { health: { change: 0, reason: null }, morale: { change: 0, reason: null } },
        error: null,
        raw: null
    };
    
    if (!messageText || messageText.length < 20) {
        return results;
    }
    
    try {
        const prompt = buildExtractionPrompt(messageText, {
            cases: existingCases,
            contacts: existingContacts,
            locations: existingLocations,
            equipment: existingEquipment,
            inventory: existingInventory
        });
        
        const systemPrompt = `You are a precise data extraction assistant for a Disco Elysium-style RPG system. Extract game state changes from roleplay messages. Output only valid JSON with no additional text or markdown formatting.`;
        
        const response = await makeAPICall(systemPrompt, prompt, 1500);
        
        if (!response) {
            results.error = 'No response from API';
            return results;
        }
        
        results.raw = response;
        
        const parsed = parseExtractionResponse(response);
        if (parsed) {
            results.quests = parsed.quests || results.quests;
            results.contacts = parsed.contacts || results.contacts;
            results.locations = parsed.locations || results.locations;
            results.equipment = parsed.equipment || results.equipment;
            results.inventory = parsed.inventory || results.inventory;
            results.vitals = parsed.vitals || results.vitals;
        } else {
            results.error = 'Failed to parse extraction response';
        }
        
    } catch (error) {
        console.error('[AI Extractor] Extraction error:', error);
        results.error = error.message;
    }
    
    return results;
}

/**
 * Parse the AI's JSON response, handling common formatting issues
 */
function parseExtractionResponse(response) {
    if (!response) return null;
    
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.warn('[AI Extractor] No JSON object found in response');
        return null;
    }
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const parsed = JSON.parse(cleaned);
        
        // Ensure all expected structures exist
        if (!parsed.quests) parsed.quests = { new: [], completed: [], updated: [] };
        if (!parsed.contacts) parsed.contacts = { new: [], updated: [] };
        if (!parsed.locations) parsed.locations = { new: [], visited: [], current: null };
        if (!parsed.equipment) parsed.equipment = { gained: [], lost: [], changed: [] };
        if (!parsed.inventory) parsed.inventory = { gained: [], lost: [] };
        if (!parsed.vitals) parsed.vitals = { health: { change: 0, reason: null }, morale: { change: 0, reason: null } };
        
        // Ensure arrays
        ['new', 'completed', 'updated'].forEach(k => {
            if (!Array.isArray(parsed.quests[k])) parsed.quests[k] = [];
        });
        ['new', 'updated'].forEach(k => {
            if (!Array.isArray(parsed.contacts[k])) parsed.contacts[k] = [];
        });
        ['new', 'visited'].forEach(k => {
            if (!Array.isArray(parsed.locations[k])) parsed.locations[k] = [];
        });
        ['gained', 'lost', 'changed'].forEach(k => {
            if (!Array.isArray(parsed.equipment[k])) parsed.equipment[k] = [];
        });
        ['gained', 'lost'].forEach(k => {
            if (!Array.isArray(parsed.inventory[k])) parsed.inventory[k] = [];
        });
        
        // Ensure vitals structure
        if (typeof parsed.vitals.health !== 'object') {
            parsed.vitals.health = { change: 0, reason: null };
        }
        if (typeof parsed.vitals.morale !== 'object') {
            parsed.vitals.morale = { change: 0, reason: null };
        }
        
        return parsed;
        
    } catch (e) {
        console.warn('[AI Extractor] JSON parse error:', e.message);
        
        // Try to repair common issues
        try {
            const repaired = cleaned
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']')
                .replace(/'/g, '"');
            return JSON.parse(repaired);
        } catch (e2) {
            console.error('[AI Extractor] Could not repair JSON');
            return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// PROCESS EXTRACTION RESULTS
// ═══════════════════════════════════════════════════════════════

/**
 * Process extraction results and update game state
 * @param {object} results - Results from extractFromMessage
 * @param {object} options - Processing options
 * @returns {Promise<object>} What was processed
 */
export async function processExtractionResults(results, options = {}) {
    const { notifyCallback } = options;
    
    const processed = {
        casesCreated: [],
        casesCompleted: [],
        casesUpdated: [],
        contactsCreated: [],
        contactsUpdated: [],
        locationsCreated: [],
        locationsVisited: [],
        currentLocationSet: null,
        equipmentGained: [],
        equipmentLost: [],
        inventoryGained: [],
        inventoryLost: [],
        healthChange: 0,
        moraleChange: 0
    };
    
    if (!results || results.error) {
        return processed;
    }
    
    const state = getChatState();
    if (!state) {
        console.warn('[AI Extractor] No chat state available');
        return processed;
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Equipment Changes
    // ─────────────────────────────────────────────────────────────
    if (results.equipment) {
        // Equipment gained
        if (results.equipment.gained?.length > 0) {
            if (!state.equipment) state.equipment = { items: [], wardrobe: {} };
            
            for (const item of results.equipment.gained) {
                if (!item.name) continue;
                
                // Check for duplicates
                const existingNames = state.equipment.items.map(e => e.name.toLowerCase());
                if (existingNames.includes(item.name.toLowerCase())) continue;
                
                const newEquipment = {
                    id: `equip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: item.name,
                    type: inferEquipmentType(item.name),
                    equipped: true,
                    source: 'ai-extracted',
                    context: item.context || null,
                    addedAt: Date.now()
                };
                
                state.equipment.items.push(newEquipment);
                processed.equipmentGained.push(newEquipment);
                
                if (notifyCallback) {
                    notifyCallback(`Acquired: ${item.name}`, 'equipment');
                }
            }
        }
        
        // Equipment lost
        if (results.equipment.lost?.length > 0 && state.equipment?.items) {
            for (const item of results.equipment.lost) {
                if (!item.name) continue;
                
                const idx = state.equipment.items.findIndex(e => 
                    similarity(e.name.toLowerCase(), item.name.toLowerCase()) > 0.7
                );
                
                if (idx !== -1) {
                    const removed = state.equipment.items.splice(idx, 1)[0];
                    processed.equipmentLost.push(removed);
                    
                    if (notifyCallback) {
                        notifyCallback(`Lost: ${removed.name}`, 'equipment-lost');
                    }
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Inventory Changes
    // ─────────────────────────────────────────────────────────────
    if (results.inventory) {
        // Inventory gained
        if (results.inventory.gained?.length > 0) {
            if (!state.inventory) state.inventory = { carried: [], stash: {}, money: 0 };
            if (!state.inventory.carried) state.inventory.carried = [];
            
            for (const item of results.inventory.gained) {
                if (!item.name) continue;
                
                // Check for existing item to stack
                const existing = state.inventory.carried.find(i =>
                    similarity(i.name.toLowerCase(), item.name.toLowerCase()) > 0.8
                );
                
                if (existing && existing.quantity !== undefined) {
                    existing.quantity += (item.quantity || 1);
                    processed.inventoryGained.push({ ...existing, added: item.quantity || 1 });
                } else {
                    const newItem = {
                        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: item.name,
                        type: item.type || inferInventoryType(item.name),
                        quantity: item.quantity || 1,
                        source: 'ai-extracted',
                        context: item.context || null,
                        addedAt: Date.now()
                    };
                    
                    state.inventory.carried.push(newItem);
                    processed.inventoryGained.push(newItem);
                }
                
                if (notifyCallback) {
                    const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
                    notifyCallback(`Found: ${item.name}${qty}`, 'inventory');
                }
            }
        }
        
        // Inventory lost
        if (results.inventory.lost?.length > 0 && state.inventory?.carried) {
            for (const item of results.inventory.lost) {
                if (!item.name) continue;
                
                const existing = state.inventory.carried.find(i =>
                    similarity(i.name.toLowerCase(), item.name.toLowerCase()) > 0.7
                );
                
                if (existing) {
                    const lostQty = item.quantity || 1;
                    
                    if (existing.quantity && existing.quantity > lostQty) {
                        existing.quantity -= lostQty;
                        processed.inventoryLost.push({ name: existing.name, quantity: lostQty });
                    } else {
                        // Remove entirely
                        const idx = state.inventory.carried.indexOf(existing);
                        if (idx !== -1) {
                            state.inventory.carried.splice(idx, 1);
                            processed.inventoryLost.push(existing);
                        }
                    }
                    
                    if (notifyCallback) {
                        notifyCallback(`Lost: ${item.name}`, 'inventory-lost');
                    }
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Vitals Changes
    // ─────────────────────────────────────────────────────────────
    if (results.vitals) {
        if (!state.vitals) state.vitals = { health: 10, maxHealth: 10, morale: 10, maxMorale: 10 };
        
        // Health change
        if (results.vitals.health?.change && results.vitals.health.change !== 0) {
            const change = parseInt(results.vitals.health.change, 10);
            if (!isNaN(change)) {
                const oldHealth = state.vitals.health;
                state.vitals.health = Math.max(0, Math.min(state.vitals.maxHealth, state.vitals.health + change));
                processed.healthChange = state.vitals.health - oldHealth;
                
                if (notifyCallback && processed.healthChange !== 0) {
                    const sign = processed.healthChange > 0 ? '+' : '';
                    const reason = results.vitals.health.reason ? `: ${results.vitals.health.reason}` : '';
                    notifyCallback(`Health ${sign}${processed.healthChange}${reason}`, 
                        processed.healthChange > 0 ? 'health-gain' : 'health-loss');
                }
            }
        }
        
        // Morale change
        if (results.vitals.morale?.change && results.vitals.morale.change !== 0) {
            const change = parseInt(results.vitals.morale.change, 10);
            if (!isNaN(change)) {
                const oldMorale = state.vitals.morale;
                state.vitals.morale = Math.max(0, Math.min(state.vitals.maxMorale, state.vitals.morale + change));
                processed.moraleChange = state.vitals.morale - oldMorale;
                
                if (notifyCallback && processed.moraleChange !== 0) {
                    const sign = processed.moraleChange > 0 ? '+' : '';
                    const reason = results.vitals.morale.reason ? `: ${results.vitals.morale.reason}` : '';
                    notifyCallback(`Morale ${sign}${processed.moraleChange}${reason}`, 
                        processed.moraleChange > 0 ? 'morale-gain' : 'morale-loss');
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Quests (existing logic)
    // ─────────────────────────────────────────────────────────────
    if (results.quests?.new?.length > 0) {
        if (!state.ledger) state.ledger = {};
        if (!state.ledger.cases) state.ledger.cases = [];
        
        for (const quest of results.quests.new) {
            if (!quest.title) continue;
            
            const existingTitles = state.ledger.cases.map(c => c.title.toLowerCase());
            if (existingTitles.includes(quest.title.toLowerCase())) continue;
            
            const newCase = {
                id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: quest.title,
                description: quest.description || '',
                status: 'active',
                priority: quest.priority || 'side',
                hints: quest.hints || [],
                notes: [],
                discovered: new Date().toISOString(),
                aiGenerated: true
            };
            
            state.ledger.cases.push(newCase);
            processed.casesCreated.push(newCase);
            
            if (notifyCallback) {
                notifyCallback(`New quest: ${quest.title}`, 'quest');
            }
        }
    }
    
    // Quest completion
    if (results.quests?.completed?.length > 0 && state.ledger?.cases) {
        for (const completed of results.quests.completed) {
            if (!completed.title) continue;
            
            const matchingCase = state.ledger.cases.find(c =>
                similarity(c.title.toLowerCase(), completed.title.toLowerCase()) > 0.7 &&
                c.status === 'active'
            );
            
            if (matchingCase) {
                matchingCase.status = 'closed';
                matchingCase.closedAt = new Date().toISOString();
                matchingCase.resolution = completed.evidence || 'Completed';
                processed.casesCompleted.push(matchingCase);
                
                if (notifyCallback) {
                    notifyCallback(`Quest complete: ${matchingCase.title}`, 'quest-complete');
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Contacts (existing logic)
    // ─────────────────────────────────────────────────────────────
    if (results.contacts?.new?.length > 0) {
        if (!state.contacts) state.contacts = {};
        
        for (const contact of results.contacts.new) {
            if (!contact.name) continue;
            
            const existingNames = Object.values(state.contacts).map(c => c.name.toLowerCase());
            if (existingNames.includes(contact.name.toLowerCase())) continue;
            
            const newContact = {
                id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: contact.name,
                description: contact.description || '',
                role: contact.role || '',
                relationship: mapRelationship(contact.relationship),
                aiGenerated: true,
                createdAt: Date.now()
            };
            
            state.contacts[newContact.id] = newContact;
            processed.contactsCreated.push(newContact);
            
            if (notifyCallback) {
                notifyCallback(`New contact: ${contact.name}`, 'contact');
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Locations (existing logic)
    // ─────────────────────────────────────────────────────────────
    if (results.locations?.new?.length > 0) {
        if (!state.ledger) state.ledger = {};
        if (!state.ledger.locations) state.ledger.locations = [];
        
        for (const location of results.locations.new) {
            if (!location.name) continue;
            
            const existingNames = state.ledger.locations.map(l => l.name.toLowerCase());
            if (existingNames.includes(location.name.toLowerCase())) continue;
            
            const newLocation = {
                id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: location.name,
                district: location.district || null,
                description: location.description || null,
                visited: false,
                events: [],
                discovered: new Date().toISOString(),
                aiGenerated: true
            };
            
            state.ledger.locations.push(newLocation);
            processed.locationsCreated.push(newLocation);
            
            if (notifyCallback) {
                notifyCallback(`New location: ${location.name}`, 'location');
            }
        }
    }
    
    // Current location
    if (results.locations?.current && state.ledger?.locations) {
        const currentName = results.locations.current;
        
        let matchingLocation = state.ledger.locations.find(l =>
            similarity(l.name.toLowerCase(), currentName.toLowerCase()) > 0.7
        );
        
        if (!matchingLocation) {
            matchingLocation = {
                id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: currentName,
                district: null,
                description: null,
                visited: true,
                events: [],
                discovered: new Date().toISOString(),
                aiGenerated: true
            };
            state.ledger.locations.push(matchingLocation);
            processed.locationsCreated.push(matchingLocation);
        }
        
        matchingLocation.visited = true;
        state.ledger.currentLocation = { ...matchingLocation };
        processed.currentLocationSet = matchingLocation;
    }
    
    // Save if anything changed
    const hasChanges = 
        processed.casesCreated.length > 0 ||
        processed.casesCompleted.length > 0 ||
        processed.contactsCreated.length > 0 ||
        processed.locationsCreated.length > 0 ||
        processed.equipmentGained.length > 0 ||
        processed.equipmentLost.length > 0 ||
        processed.inventoryGained.length > 0 ||
        processed.inventoryLost.length > 0 ||
        processed.healthChange !== 0 ||
        processed.moraleChange !== 0;
    
    if (hasChanges) {
        saveChatState();
    }
    
    return processed;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function mapRelationship(rel) {
    if (!rel) return 3;
    const lower = rel.toLowerCase();
    if (lower.includes('hostile') || lower.includes('enemy')) return 1;
    if (lower.includes('unfriendly') || lower.includes('suspicious')) return 2;
    if (lower.includes('neutral')) return 3;
    if (lower.includes('friendly') || lower.includes('friend')) return 4;
    if (lower.includes('lover') || lower.includes('romantic')) return 5;
    return 3;
}

function similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.includes(shorter)) {
        return shorter.length / longer.length;
    }
    
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = [...aWords].filter(w => bWords.has(w));
    
    return intersection.length / Math.max(aWords.size, bWords.size);
}

function inferEquipmentType(name) {
    if (!name) return 'other';
    const lower = name.toLowerCase();
    
    if (/jacket|hoodie|blazer|cardigan/.test(lower)) return 'jacket';
    if (/coat|trench|parka/.test(lower)) return 'coat';
    if (/shirt|blouse|top|tee/.test(lower)) return 'shirt';
    if (/pants|jeans|trousers|slacks/.test(lower)) return 'pants';
    if (/boots/.test(lower)) return 'boots';
    if (/shoes|sneakers|loafers|heels/.test(lower)) return 'shoes';
    if (/hat|cap|beanie|fedora/.test(lower)) return 'hat';
    if (/glasses|sunglasses|shades/.test(lower)) return 'glasses';
    if (/ring/.test(lower)) return 'ring';
    if (/necklace|chain|choker|pendant/.test(lower)) return 'necklace';
    if (/watch/.test(lower)) return 'watch';
    if (/gloves/.test(lower)) return 'gloves';
    if (/scarf/.test(lower)) return 'scarf';
    if (/bag|backpack|purse/.test(lower)) return 'bag';
    if (/earring/.test(lower)) return 'earring';
    if (/bracelet/.test(lower)) return 'bracelet';
    
    return 'other';
}

function inferInventoryType(name) {
    if (!name) return 'misc';
    const lower = name.toLowerCase();
    
    if (/gun|pistol|knife|weapon|blade/.test(lower)) return 'weapon';
    if (/cigarette|cig|astra|smoke/.test(lower)) return 'cigarette';
    if (/beer|wine|whiskey|vodka|alcohol|booze/.test(lower)) return 'alcohol';
    if (/pill|drug|speed|pyrholidon/.test(lower)) return 'drug';
    if (/lighter|zippo|match/.test(lower)) return 'lighter';
    if (/note|letter|document|photo|id|badge/.test(lower)) return 'document';
    if (/money|coin|cash|réal|real/.test(lower)) return 'money';
    if (/key/.test(lower)) return 'key';
    if (/food|sandwich|snack/.test(lower)) return 'food';
    if (/medicine|bandage|medkit/.test(lower)) return 'medicine';
    
    return 'misc';
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    extractFromMessage,
    extractEquipmentFromPersona,
    extractInventoryFromPersona,
    extractInventoryFromContext,
    processExtractionResults
};
