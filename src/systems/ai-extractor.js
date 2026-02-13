/**
 * The Tribunal - AI Extractor
 * Uses AI to extract game state from chat messages
 * 
 * @version 2.0.0 - AI-primary vitals + condition-to-status detection
 *   - Vitals changes now APPLIED to state (no longer log-only)
 *   - Added condition field: physical/mental/dying state detection
 *   - Maps AI conditions to status effect IDs (replaces regex as primary)
 *   - Dispatches tribunal:vitalsChanged + tribunal:statusRefreshNeeded events
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

import { getChatState, saveChatState } from '../core/state.js';

// Lazy-loaded API helpers - try both function names
let apiModule = null;

async function getAPIFunction() {
    if (!apiModule) {
        try {
            apiModule = await import('../voice/api-helpers.js');
        } catch (e) {
            console.error('[AI Extractor] Failed to import api-helpers:', e);
            return null;
        }
    }
    // Return whichever function exists
    return apiModule.callAPIWithTokens || apiModule.callAPI || null;
}

/**
 * Make an API call - handles both function signatures
 */
async function makeAPICall(systemPrompt, userPrompt, maxTokens) {
    const apiFn = await getAPIFunction();
    
    if (!apiFn) {
        console.error('[AI Extractor] No API function found in api-helpers!');
        return null;
    }
    
    try {
        // Try the callAPIWithTokens signature (system, user, tokens)
        if (apiModule.callAPIWithTokens) {
            console.log('[AI Extractor] Using callAPIWithTokens');
            return await apiModule.callAPIWithTokens(systemPrompt, userPrompt, maxTokens);
        }
        // Fall back to callAPI (system, user) - no third param!
        if (apiModule.callAPI) {
            console.log('[AI Extractor] Using callAPI (2 params)');
            return await apiModule.callAPI(systemPrompt, userPrompt);
        }
    } catch (e) {
        console.error('[AI Extractor] API call error:', e);
        return null;
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXTRACTION PROMPT (EXPANDED)
// ═══════════════════════════════════════════════════════════════

/**
 * Build the extraction prompt for analyzing a message
 */
function buildExtractionPrompt(messageText, existingData = {}, excludeNames = []) {
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
    
    // Identify the player character for the AI
    const playerName = excludeNames[0] || 'the player';
    
    return `Analyze this roleplay message and extract game state changes.
The PLAYER CHARACTER is named "${playerName}". All equipment, inventory, vitals, and condition changes refer to THIS character only.

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
    "gained": [{"name": "Item name", "quantity": 1, "type": "weapon|tool|consumable|document|money|key|misc", "context": "How obtained"}],
    "lost": [{"name": "Item name", "quantity": 1, "context": "How lost/used"}]
  },
  "vitals": {
    "health": {"change": 0, "reason": "Why HP changed or null"},
    "morale": {"change": 0, "reason": "Why morale changed or null"}
  },
  "condition": {
    "physical": "wounded|exhausted|intoxicated|drugged|poisoned|healthy|null",
    "mental": "terrified|enraged|depressed|dissociating|manic|lovestruck|calm|null",
    "dying": false
  }
}

RULES:
- CONTACTS: Extract only NPCs (non-player characters) with actual proper names. Do NOT extract common words, descriptions, locations, or generic nouns as contacts. A contact must be a named CHARACTER (person, entity with a name). "${playerName}" is the PLAYER — NEVER add them as a contact.${excludeNames.length > 0 ? `\n- EXCLUDED NAMES (these are the player/main character, NOT NPCs - never extract these): ${excludeNames.join(', ')}` : ''}
- EQUIPMENT = wearable items ONLY: clothing, shoes, hats, glasses, jewelry, bags, watches, accessories
- EQUIPMENT is NOT: body features, hair, eyes, scars, tattoos, physical descriptions
- EQUIPMENT changes apply to the PLAYER CHARACTER only — do NOT extract what NPCs are wearing
- INVENTORY = anything a character picks up, receives, finds, buys, is given, uses, or would logically carry. Think of it as an invisible bag of holding — weapons, tools, consumables, food, drinks, documents, money, keys, phones, books, gifts, trinkets, souvenirs, anything tangible that isn't worn as clothing
- If a character interacts with an object (picks it up, pockets it, is handed something, buys something), it goes in inventory
- INVENTORY changes apply to the PLAYER CHARACTER only — items that NPCs carry, show, or use do NOT go into the player's inventory unless the player explicitly takes or receives them
- VITALS: health damage from injuries/exhaustion; morale damage from emotional trauma/failure
- CONDITION: the PLAYER CHARACTER's current physical/mental state after this message
- CONDITION physical: "wounded" (injured/bleeding), "exhausted" (tired/drained), "intoxicated" (drunk), "drugged" (on substances), "poisoned", "healthy" (fine/uninjured), or null (unclear/unchanged)
- CONDITION mental: "terrified" (scared/panicking), "enraged" (angry/furious), "depressed" (sad/grieving), "dissociating" (detached/unreal), "manic" (hyper/euphoric), "lovestruck" (desire/attraction), "calm" (composed), or null (unclear/unchanged)
- CONDITION dying: true ONLY if the player character is dying or near death
- CONDITION describes the PLAYER only, not NPCs or other characters
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
    // Toast helper (if available)
    const toast = (msg, type = 'info') => {
        if (typeof toastr !== 'undefined') {
            toastr[type](msg, 'AI Extractor');
        }
        console.log(`[AI Extractor] ${type}: ${msg}`);
    };
    
    toast('Starting extraction...', 'info');
    
    const combinedText = `
PERSONA: ${personaText || 'None'}

ROLEPLAY:
${chatContext || 'None'}
`.trim();

    if (combinedText.length < 50) {
        toast('Text too short', 'warning');
        return [];
    }
    
    // Simpler, more direct prompt
    const systemPrompt = `Extract items the PLAYER CHARACTER would have in their invisible bag of holding. Think broadly — in every story, characters end up carrying all kinds of things.

Return ONLY a JSON array like: [{"name":"Cigarettes","quantity":10,"type":"consumable"}]

Types: consumable, tool, document, money, weapon, misc

INCLUDE generously:
- Anything explicitly mentioned as carried, held, pocketed, or owned by the PLAYER
- Items implied by the player's actions (smoking = cigarettes + lighter, drinking = a bottle/flask)
- Weapons the player mentions or implies having
- Phones, wallets, keys, bags and their contents
- Food, drinks, medicine, substances the player uses
- Documents, letters, photos, IDs, badges
- Tools, gadgets, devices
- Gifts, trinkets, souvenirs, mementos
- Money or currency mentioned

EXCLUDE:
- Clothing and accessories (those go in equipment)
- Body features or descriptions
- Furniture, buildings, vehicles (things too large to carry)
- Abstract concepts
- Items belonging to OTHER characters or NPCs — only the player's items

Return [] if truly no items found.`;

    const userPrompt = `What items would the PLAYER CHARACTER have on them? Be generous — if they'd logically have it, include it. Ignore items belonging to NPCs or other characters.

${combinedText.substring(0, 3000)}

Return JSON array only:`;

    try {
        toast('Calling API...', 'info');
        const response = await makeAPICall(systemPrompt, userPrompt, 600);
        
        if (!response) {
            toast('API returned null!', 'error');
            return [];
        }
        
        toast(`Got response: ${response.substring(0, 50)}...`, 'info');
        
        // Parse JSON
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        
        if (arrayStart === -1 || arrayEnd === -1) {
            toast('No JSON array in response', 'warning');
            return [];
        }
        
        cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
        
        const items = JSON.parse(cleaned);
        
        if (!Array.isArray(items)) {
            toast('Parsed result not an array', 'warning');
            return [];
        }
        
        toast(`Parsed ${items.length} items`, 'success');
        
        // Normalize items
        return items
            .filter(item => item && item.name)
            .map(item => ({
                name: String(item.name).trim(),
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                type: item.type || 'misc',
                source: 'ai-scan'
            }));
        
    } catch (error) {
        toast(`Error: ${error.message}`, 'error');
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
        const systemPrompt = `You extract items a character would carry — their invisible bag of holding. Think broadly about what someone described this way would logically have on them.

EXTRACT these types of items:
- Weapons: guns, knives, batons, anything used offensively/defensively
- Tools: lighters, flashlights, lockpicks, phones, gadgets
- Consumables: cigarettes, alcohol, drugs, food, medicine, drinks
- Documents: notes, letters, photos, IDs, badges, books
- Money: cash, coins, currency of any kind
- Keys and access items
- Personal effects: wallet contents, pocket items, bags and their contents
- Implied items: if they smoke, they have cigarettes AND a lighter

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
        excludeNames = [],
        timeout = 30000
    } = options;
    
    const results = {
        quests: { new: [], completed: [], updated: [] },
        contacts: { new: [], updated: [] },
        locations: { new: [], visited: [], current: null },
        equipment: { gained: [], lost: [], changed: [] },
        inventory: { gained: [], lost: [] },
        vitals: { health: { change: 0, reason: null }, morale: { change: 0, reason: null } },
        condition: { physical: null, mental: null, dying: false },
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
        }, excludeNames);
        
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
            results.condition = parsed.condition || results.condition;
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
        if (!parsed.condition) parsed.condition = { physical: null, mental: null, dying: false };
        
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
    const { notifyCallback, excludeNames = [] } = options;
    
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
        moraleChange: 0,
        statusesApplied: [],
        statusesCleared: []
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
                    const itemType = item.type || inferInventoryType(item.name);
                    const newItem = {
                        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: item.name,
                        type: itemType,
                        category: isConsumableType(itemType) ? 'consumable' : 'misc',
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
    // Process Vitals Changes (AI-PRIMARY)
    // AI extractor is now the primary source for vitals changes.
    // Regex (vitals-extraction.js) serves as fallback for when
    // AI extraction is disabled or doesn't run.
    // ─────────────────────────────────────────────────────────────
    if (results.vitals) {
        if (results.vitals.health?.change && results.vitals.health.change !== 0) {
            const delta = parseInt(results.vitals.health.change, 10) || 0;
            if (delta !== 0) {
                if (!state.vitals) state.vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13, activeEffects: [] };
                state.vitals.health = Math.max(0, Math.min(state.vitals.maxHealth || 13, (state.vitals.health || 13) + delta));
                processed.healthChange = delta;
                console.log(`[AI Extractor] Health ${delta > 0 ? '+' : ''}${delta}: ${results.vitals.health.reason || 'no reason'} → now ${state.vitals.health}/${state.vitals.maxHealth}`);
                
                if (notifyCallback) {
                    const verb = delta < 0 ? 'took damage' : 'healed';
                    notifyCallback(`${verb}: ${results.vitals.health.reason || `${Math.abs(delta)} HP`}`, delta < 0 ? 'loss' : 'gain');
                }
            }
        }
        if (results.vitals.morale?.change && results.vitals.morale.change !== 0) {
            const delta = parseInt(results.vitals.morale.change, 10) || 0;
            if (delta !== 0) {
                if (!state.vitals) state.vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13, activeEffects: [] };
                state.vitals.morale = Math.max(0, Math.min(state.vitals.maxMorale || 13, (state.vitals.morale || 13) + delta));
                processed.moraleChange = delta;
                console.log(`[AI Extractor] Morale ${delta > 0 ? '+' : ''}${delta}: ${results.vitals.morale.reason || 'no reason'} → now ${state.vitals.morale}/${state.vitals.maxMorale}`);
                
                if (notifyCallback) {
                    const verb = delta < 0 ? 'morale hit' : 'morale boost';
                    notifyCallback(`${verb}: ${results.vitals.morale.reason || `${Math.abs(delta)} Morale`}`, delta < 0 ? 'loss' : 'gain');
                }
            }
        }
        
        // Dispatch vitals changed event for CRT display + condition effects
        if (processed.healthChange !== 0 || processed.moraleChange !== 0) {
            window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
                detail: {
                    health: state.vitals.health,
                    maxHealth: state.vitals.maxHealth,
                    morale: state.vitals.morale,
                    maxMorale: state.vitals.maxMorale,
                    source: 'ai-extractor'
                }
            }));
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process Condition → Status Mapping
    // Maps AI-detected physical/mental states to status effect IDs.
    // More accurate than regex because the AI understands context
    // (metaphors, NPC vs player, past vs present tense, etc.)
    // ─────────────────────────────────────────────────────────────
    if (results.condition) {
        const conditionResult = applyConditionStatuses(state, results.condition);
        processed.statusesApplied = conditionResult.applied;
        processed.statusesCleared = conditionResult.cleared;
        
        if (conditionResult.applied.length > 0 || conditionResult.cleared.length > 0) {
            if (conditionResult.applied.length > 0) {
                console.log(`[AI Extractor] Conditions applied: ${conditionResult.applied.join(', ')}`);
            }
            if (conditionResult.cleared.length > 0) {
                console.log(`[AI Extractor] Conditions cleared: ${conditionResult.cleared.join(', ')}`);
            }
            
            window.dispatchEvent(new CustomEvent('tribunal:statusRefreshNeeded'));
            window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
                detail: {
                    health: state.vitals?.health,
                    maxHealth: state.vitals?.maxHealth,
                    morale: state.vitals?.morale,
                    maxMorale: state.vitals?.maxMorale,
                    statusChange: true,
                    source: 'ai-extractor'
                }
            }));
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
    // Process Contacts
    // FIX (Bug 5): Write to state.relationships (not state.contacts)
    // FIX (Bug 5): Use proper contact structure with disposition/context
    // FIX (Bug 4): Filter out player character and AI character names
    // FIX: Validate names to prevent garbage like "The Horror", "Heavily"
    // ─────────────────────────────────────────────────────────────
    if (results.contacts?.new?.length > 0) {
        if (!state.relationships) state.relationships = {};
        
        // Build exclusion set for persona names (case-insensitive)
        const excluded = new Set();
        for (const name of excludeNames) {
            if (!name) continue;
            excluded.add(name.toLowerCase().trim());
            const firstName = name.trim().split(/\s+/)[0];
            if (firstName && firstName.length > 1) {
                excluded.add(firstName.toLowerCase());
            }
        }
        
        // Name quality validation (inline version of looksLikeName)
        const ARTICLE_PREFIXES = new Set(['the', 'a', 'an', 'some', 'any', 'no', 'every', 'each', 'this', 'that']);
        const REJECT_WORDS = new Set([
            'agree', 'another', 'heavily', 'potential', 'creatures', 'houses',
            'horror', 'scare', 'shows', 'games', 'food', 'zones', 'birdie',
            'moment', 'suddenly', 'however', 'although', 'perhaps', 'actually',
            'someone', 'something', 'nothing', 'everything', 'everyone',
            'door', 'room', 'floor', 'wall', 'window', 'table', 'chair',
            'hand', 'hands', 'eyes', 'face', 'head', 'voice', 'words',
            'place', 'world', 'thing', 'things', 'way', 'time',
        ]);
        
        function isValidContactName(name) {
            if (!name || name.length < 2) return false;
            const words = name.trim().split(/\s+/);
            const lower = name.toLowerCase().trim();
            
            // Reject single common/generic words
            if (words.length === 1) {
                if (REJECT_WORDS.has(lower)) return false;
                // Reject words ending in non-name suffixes
                if (/(?:ing|tion|sion|ment|ness|ful|less|ous|ive|able|ible|ally|edly|ily|ity)$/i.test(name)) return false;
                if (name.length < 3) return false;
            }
            
            // Reject "The X" patterns - almost never real NPC names
            if (words.length >= 2 && ARTICLE_PREFIXES.has(words[0].toLowerCase())) return false;
            
            return true;
        }
        
        for (const contact of results.contacts.new) {
            if (!contact.name) continue;
            
            // FIX (Bug 4): Skip player/AI character names
            const contactLower = contact.name.toLowerCase().trim();
            if (excluded.has(contactLower)) {
                console.log(`[AI Extractor] Skipping excluded name: ${contact.name}`);
                continue;
            }
            const contactFirst = contactLower.split(/\s+/)[0];
            if (contactFirst && excluded.has(contactFirst)) {
                console.log(`[AI Extractor] Skipping excluded name (first name match): ${contact.name}`);
                continue;
            }
            
            // QUALITY GATE: Reject names that don't look like real character names
            if (!isValidContactName(contact.name)) {
                console.log(`[AI Extractor] Rejected non-name: "${contact.name}"`);
                continue;
            }
            
            // Check existing in relationships (the proper store)
            const existingNames = Object.values(state.relationships).map(c => c.name?.toLowerCase());
            if (existingNames.includes(contactLower)) continue;
            
            // FIX (Bug 5): Build proper contact structure matching createContact() schema
            const disposition = mapRelationshipToDisposition(contact.relationship);
            
            const newContact = {
                id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: contact.name,
                context: contact.description || '',   // AI description → context field
                relationship: '',                      // Legacy field, keep empty
                notes: '',
                disposition: disposition,
                type: DISPOSITION_TO_TYPE[disposition] || 'unknown',
                dossier: null,
                createdAt: Date.now(),
                lastModified: Date.now(),
                voiceOpinions: {},                     // Will be seeded by contact-intelligence
                detectedTraits: [],
                manuallyEdited: false,
                aiGenerated: true
            };
            
            state.relationships[newContact.id] = newContact;
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
        processed.moraleChange !== 0 ||
        processed.statusesApplied.length > 0 ||
        processed.statusesCleared.length > 0;
    
    if (hasChanges) {
        saveChatState();
    }
    
    return processed;
}

// ═══════════════════════════════════════════════════════════════
// CONDITION → STATUS MAPPING
// Maps AI-detected conditions to internal status effect IDs.
// The AI sees descriptive labels; we translate to game IDs.
// ═══════════════════════════════════════════════════════════════

const CONDITION_TO_STATUS = {
    // Physical conditions
    wounded:     'finger_on_the_eject_button',
    exhausted:   'waste_land',
    intoxicated: 'revacholian_courage',
    drugged:     'pyrholidon',
    poisoned:    'finger_on_the_eject_button',  // Treated as wound/damage
    
    // Mental conditions
    terrified:    'caustic_echo',
    enraged:      'law_jaw',
    depressed:    'the_expression',
    dissociating: 'the_pale',
    manic:        'tequila_sunset',
    lovestruck:   'homo_sexual_underground'
};

// Conditions that mean "this category is fine" → clear related statuses
const CLEAR_CONDITIONS = {
    healthy: ['finger_on_the_eject_button', 'waste_land', 'white_mourning'],
    calm:    ['caustic_echo', 'law_jaw', 'the_expression', 'the_pale', 'tequila_sunset']
};

/**
 * Apply/clear status effects based on AI-detected condition
 * @param {object} state - Current chat state
 * @param {object} condition - { physical, mental, dying }
 * @returns {{ applied: string[], cleared: string[] }}
 */
function applyConditionStatuses(state, condition) {
    const applied = [];
    const cleared = [];
    
    if (!state.vitals) state.vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13, activeEffects: [] };
    if (!state.vitals.activeEffects) state.vitals.activeEffects = [];
    
    const activeEffects = state.vitals.activeEffects;
    const activeIds = activeEffects.map(e => typeof e === 'string' ? e : e.id);
    
    // Handle "dying" flag → white_mourning
    if (condition.dying === true) {
        if (!activeIds.includes('white_mourning')) {
            activeEffects.push({
                id: 'white_mourning',
                name: 'White Mourning',
                source: 'ai-detected',
                remainingMessages: null,
                stacks: 1
            });
            applied.push('white_mourning');
        }
    }
    
    // Process physical + mental conditions
    for (const field of ['physical', 'mental']) {
        const value = condition[field]?.toLowerCase?.()?.trim();
        if (!value || value === 'null') continue;
        
        // Check if it's a "clear" condition
        if (CLEAR_CONDITIONS[value]) {
            for (const statusId of CLEAR_CONDITIONS[value]) {
                const idx = activeEffects.findIndex(e => 
                    (typeof e === 'string' ? e : e.id) === statusId &&
                    (typeof e === 'string' || e.source === 'ai-detected')
                );
                if (idx >= 0) {
                    activeEffects.splice(idx, 1);
                    cleared.push(statusId);
                }
            }
            continue;
        }
        
        // Map to status ID
        const statusId = CONDITION_TO_STATUS[value];
        if (!statusId) continue;
        
        // Don't duplicate
        if (activeIds.includes(statusId)) continue;
        
        activeEffects.push({
            id: statusId,
            name: value.charAt(0).toUpperCase() + value.slice(1),
            source: 'ai-detected',
            remainingMessages: null,
            stacks: 1
        });
        applied.push(statusId);
    }
    
    return { applied, cleared };
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

/**
 * Map AI extractor's relationship labels to proper disposition strings
 * The contact system uses: hostile|suspicious|neutral|cautious|trusted
 */
const DISPOSITION_TO_TYPE = {
    trusted: 'informant',
    neutral: 'unknown',
    cautious: 'witness',
    suspicious: 'accomplice',
    hostile: 'suspect'
};

function mapRelationshipToDisposition(rel) {
    if (!rel) return 'neutral';
    const lower = rel.toLowerCase();
    if (lower.includes('hostile') || lower.includes('enemy')) return 'hostile';
    if (lower.includes('unfriendly') || lower.includes('suspicious')) return 'suspicious';
    if (lower.includes('neutral')) return 'neutral';
    if (lower.includes('friendly') || lower.includes('friend')) return 'neutral';
    if (lower.includes('lover') || lower.includes('romantic')) return 'trusted';
    return 'neutral';
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

/**
 * Check if an inventory type should be categorized as consumable
 * Must match inventory-handlers.js categories so items render in the correct grid
 */
function isConsumableType(type) {
    return ['cigarette', 'alcohol', 'drug', 'food', 'medicine'].includes(type);
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
