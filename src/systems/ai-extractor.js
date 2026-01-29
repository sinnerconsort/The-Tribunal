/**
 * The Tribunal - AI Extractor
 * Uses AI to extract cases/quests, contacts/NPCs, and locations from chat messages
 * 
 * This is more accurate than regex patterns because the AI understands context.
 * Makes a single API call to extract all types of data efficiently.
 */

import { getSettings, getChatState, saveChatState } from '../core/state.js';
import { callAPI } from '../voice/api-helpers.js';

// ═══════════════════════════════════════════════════════════════
// EXTRACTION PROMPT
// ═══════════════════════════════════════════════════════════════

/**
 * Build the extraction prompt for analyzing a message
 */
function buildExtractionPrompt(messageText, existingCases = [], existingContacts = [], existingLocations = []) {
    // Format existing data for context
    const existingCaseTitles = existingCases.map(c => `- "${c.title}" (${c.status})`).join('\n') || 'None';
    const existingContactNames = existingContacts.map(c => `- ${c.name}`).join('\n') || 'None';
    const existingLocationNames = existingLocations.map(l => `- ${l.name}${l.district ? ` (${l.district})` : ''}`).join('\n') || 'None';
    
    return `Analyze this roleplay message and extract any quests/tasks, NPCs/contacts, and locations mentioned.

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

Extract the following and respond with ONLY valid JSON (no markdown, no explanation):

{
  "quests": {
    "new": [
      {
        "title": "Brief quest title",
        "description": "What needs to be done",
        "priority": "main|side|optional",
        "hints": ["Sub-objective 1", "Sub-objective 2"]
      }
    ],
    "completed": [
      {
        "title": "Title of completed quest (must match existing)",
        "evidence": "What in the message indicates completion"
      }
    ],
    "updated": [
      {
        "title": "Title of quest to update (must match existing)", 
        "newHint": "New sub-objective or lead discovered"
      }
    ]
  },
  "contacts": {
    "new": [
      {
        "name": "Character name",
        "description": "Brief description of who they are",
        "role": "Their role (merchant, guard, villain, etc.)",
        "relationship": "hostile|unfriendly|neutral|friendly|lover",
        "firstImpression": "How they were introduced"
      }
    ],
    "updated": [
      {
        "name": "Name (must match existing)",
        "relationshipChange": "New relationship level if changed",
        "newInfo": "Any new information learned about them"
      }
    ]
  },
  "locations": {
    "new": [
      {
        "name": "Location name",
        "district": "District or region it's in (if mentioned)",
        "description": "Brief description of the place"
      }
    ],
    "visited": [
      {
        "name": "Name of location visited (must match existing)",
        "event": "What happened there in this message"
      }
    ],
    "current": "Name of location where the scene is currently taking place (if clearly established, or null)"
  }
}

Rules:
- Only extract CLEAR quests/tasks, not vague suggestions
- Only extract NAMED characters, not generic "a guard" or "someone"
- Only extract SPECIFIC named locations, not generic "a room" or "the street"
- For completed quests, the title must closely match an existing quest
- For "current" location, only set if the message clearly establishes where the scene is happening
- If nothing to extract, use empty arrays [] or null for current
- Respond with ONLY the JSON object, nothing else`;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract cases, contacts, and locations from a message using AI
 * @param {string} messageText - The message to analyze
 * @param {object} options - Extraction options
 * @returns {Promise<object>} Extracted data
 */
export async function extractFromMessage(messageText, options = {}) {
    const {
        existingCases = [],
        existingContacts = [],
        existingLocations = [],
        timeout = 30000
    } = options;
    
    const results = {
        quests: { new: [], completed: [], updated: [] },
        contacts: { new: [], updated: [] },
        locations: { new: [], visited: [], current: null },
        error: null,
        raw: null
    };
    
    if (!messageText || messageText.length < 20) {
        return results; // Too short to contain meaningful data
    }
    
    try {
        const prompt = buildExtractionPrompt(messageText, existingCases, existingContacts, existingLocations);
        
        // Use a focused system prompt for extraction
        const systemPrompt = `You are a precise data extraction assistant. Extract quest/task information, NPC/character information, and location information from roleplay messages. Output only valid JSON with no additional text or markdown formatting.`;
        
        const response = await callAPI(systemPrompt, prompt, {
            maxTokens: 1000,
            temperature: 0.3, // Low temperature for consistent structured output
            timeout
        });
        
        if (!response) {
            results.error = 'No response from API';
            return results;
        }
        
        results.raw = response;
        
        // Parse the JSON response
        const parsed = parseExtractionResponse(response);
        if (parsed) {
            results.quests = parsed.quests || results.quests;
            results.contacts = parsed.contacts || results.contacts;
            results.locations = parsed.locations || results.locations;
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
    
    // Clean up the response
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    // Remove any leading/trailing text before/after JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.warn('[AI Extractor] No JSON object found in response');
        return null;
    }
    
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    
    try {
        const parsed = JSON.parse(cleaned);
        
        // Validate structure
        if (!parsed.quests) parsed.quests = { new: [], completed: [], updated: [] };
        if (!parsed.contacts) parsed.contacts = { new: [], updated: [] };
        if (!parsed.locations) parsed.locations = { new: [], visited: [], current: null };
        
        // Ensure arrays
        if (!Array.isArray(parsed.quests.new)) parsed.quests.new = [];
        if (!Array.isArray(parsed.quests.completed)) parsed.quests.completed = [];
        if (!Array.isArray(parsed.quests.updated)) parsed.quests.updated = [];
        if (!Array.isArray(parsed.contacts.new)) parsed.contacts.new = [];
        if (!Array.isArray(parsed.contacts.updated)) parsed.contacts.updated = [];
        if (!Array.isArray(parsed.locations.new)) parsed.locations.new = [];
        if (!Array.isArray(parsed.locations.visited)) parsed.locations.visited = [];
        
        return parsed;
        
    } catch (e) {
        console.warn('[AI Extractor] JSON parse error:', e.message);
        console.warn('[AI Extractor] Attempted to parse:', cleaned.substring(0, 200));
        
        // Try to repair common JSON issues
        try {
            const repaired = repairJSON(cleaned);
            return JSON.parse(repaired);
        } catch (e2) {
            console.warn('[AI Extractor] JSON repair also failed');
            return null;
        }
    }
}

/**
 * Basic JSON repair for common AI output issues
 */
function repairJSON(str) {
    let fixed = str;
    
    // Fix trailing commas
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/,\s*]/g, ']');
    
    // Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');
    
    // Fix unquoted keys
    fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    return fixed;
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Process extraction results and update state
 * @param {object} results - Results from extractFromMessage
 * @param {object} options - Processing options
 */
export async function processExtractionResults(results, options = {}) {
    const { 
        notifyCallback = null,
        casesModule = null,
        contactsModule = null,
        locationsModule = null
    } = options;
    
    const processed = {
        casesCreated: [],
        casesCompleted: [],
        casesUpdated: [],
        contactsCreated: [],
        contactsUpdated: [],
        locationsCreated: [],
        locationsVisited: [],
        currentLocationSet: null
    };
    
    if (results.error) {
        console.warn('[AI Extractor] Skipping processing due to error:', results.error);
        return processed;
    }
    
    const state = getChatState();
    if (!state) return processed;
    
    // ─────────────────────────────────────────────────────────────
    // Process new quests
    // ─────────────────────────────────────────────────────────────
    if (casesModule && results.quests.new.length > 0) {
        if (!state.cases) state.cases = {};
        
        for (const quest of results.quests.new) {
            if (!quest.title) continue;
            
            // Check for duplicates
            const existingTitles = Object.values(state.cases).map(c => c.title.toLowerCase());
            if (existingTitles.includes(quest.title.toLowerCase())) {
                continue;
            }
            
            const newCase = casesModule.createCase({
                title: quest.title,
                description: quest.description || '',
                priority: quest.priority || 'side',
                hints: (quest.hints || []).map(h => casesModule.createHint(h)),
                manuallyAdded: false,
                aiGenerated: true
            });
            
            state.cases[newCase.id] = newCase;
            processed.casesCreated.push(newCase);
            
            if (notifyCallback) {
                notifyCallback(`New task: ${quest.title}`, 'case');
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process completed quests
    // ─────────────────────────────────────────────────────────────
    if (casesModule && results.quests.completed.length > 0 && state.cases) {
        for (const completed of results.quests.completed) {
            if (!completed.title) continue;
            
            // Find matching case (fuzzy match)
            const matchingCase = Object.values(state.cases).find(c => 
                c.status === 'active' && 
                similarity(c.title.toLowerCase(), completed.title.toLowerCase()) > 0.6
            );
            
            if (matchingCase) {
                const updated = casesModule.completeCase(matchingCase);
                state.cases[updated.id] = updated;
                processed.casesCompleted.push(updated);
                
                if (notifyCallback) {
                    notifyCallback(`Completed: ${updated.title}`, 'case-complete');
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process quest updates (new hints)
    // ─────────────────────────────────────────────────────────────
    if (casesModule && results.quests.updated.length > 0 && state.cases) {
        for (const update of results.quests.updated) {
            if (!update.title || !update.newHint) continue;
            
            const matchingCase = Object.values(state.cases).find(c =>
                c.status === 'active' &&
                similarity(c.title.toLowerCase(), update.title.toLowerCase()) > 0.6
            );
            
            if (matchingCase) {
                const updated = casesModule.addHint(matchingCase, update.newHint);
                state.cases[updated.id] = updated;
                processed.casesUpdated.push(updated);
                
                if (notifyCallback) {
                    notifyCallback(`New lead for: ${updated.title}`, 'case-hint');
                }
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process new contacts
    // ─────────────────────────────────────────────────────────────
    if (contactsModule && results.contacts.new.length > 0) {
        if (!state.contacts) state.contacts = {};
        
        for (const contact of results.contacts.new) {
            if (!contact.name) continue;
            
            // Check for duplicates
            const existingNames = Object.values(state.contacts).map(c => c.name.toLowerCase());
            if (existingNames.includes(contact.name.toLowerCase())) {
                continue;
            }
            
            const newContact = contactsModule.createContact({
                name: contact.name,
                description: contact.description || contact.firstImpression || '',
                role: contact.role || '',
                relationship: mapRelationship(contact.relationship),
                aiGenerated: true
            });
            
            state.contacts[newContact.id] = newContact;
            processed.contactsCreated.push(newContact);
            
            if (notifyCallback) {
                notifyCallback(`New contact: ${contact.name}`, 'contact');
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process contact updates
    // ─────────────────────────────────────────────────────────────
    if (contactsModule && results.contacts.updated.length > 0 && state.contacts) {
        for (const update of results.contacts.updated) {
            if (!update.name) continue;
            
            const matchingContact = Object.values(state.contacts).find(c =>
                similarity(c.name.toLowerCase(), update.name.toLowerCase()) > 0.7
            );
            
            if (matchingContact) {
                // Update relationship if changed
                if (update.relationshipChange) {
                    matchingContact.relationship = mapRelationship(update.relationshipChange);
                }
                
                // Append new info to description
                if (update.newInfo && !matchingContact.description.includes(update.newInfo)) {
                    matchingContact.description = matchingContact.description
                        ? `${matchingContact.description}\n${update.newInfo}`
                        : update.newInfo;
                }
                
                state.contacts[matchingContact.id] = matchingContact;
                processed.contactsUpdated.push(matchingContact);
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Process new locations
    // ─────────────────────────────────────────────────────────────
    if (locationsModule && results.locations.new.length > 0) {
        if (!state.ledger) state.ledger = {};
        if (!state.ledger.locations) state.ledger.locations = [];
        
        for (const location of results.locations.new) {
            if (!location.name) continue;
            
            // Check for duplicates
            const existingNames = state.ledger.locations.map(l => l.name.toLowerCase());
            if (existingNames.includes(location.name.toLowerCase())) {
                continue;
            }
            
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
    
    // ─────────────────────────────────────────────────────────────
    // Process visited locations (add events)
    // ─────────────────────────────────────────────────────────────
    if (locationsModule && results.locations.visited.length > 0 && state.ledger?.locations) {
        for (const visited of results.locations.visited) {
            if (!visited.name || !visited.event) continue;
            
            // Find matching location
            const matchingLocation = state.ledger.locations.find(l =>
                similarity(l.name.toLowerCase(), visited.name.toLowerCase()) > 0.7
            );
            
            if (matchingLocation) {
                // Mark as visited
                matchingLocation.visited = true;
                
                // Add event
                if (!matchingLocation.events) matchingLocation.events = [];
                matchingLocation.events.push({
                    text: visited.event,
                    timestamp: new Date().toISOString()
                });
                
                processed.locationsVisited.push(matchingLocation);
            }
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Set current location
    // ─────────────────────────────────────────────────────────────
    if (locationsModule && results.locations.current && state.ledger?.locations) {
        const currentName = results.locations.current;
        
        // Find matching location
        let matchingLocation = state.ledger.locations.find(l =>
            similarity(l.name.toLowerCase(), currentName.toLowerCase()) > 0.7
        );
        
        // If not found, create it
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
            
            if (notifyCallback) {
                notifyCallback(`New location: ${currentName}`, 'location');
            }
        }
        
        // Set as current
        matchingLocation.visited = true;
        state.ledger.currentLocation = { ...matchingLocation };
        processed.currentLocationSet = matchingLocation;
        
        if (notifyCallback) {
            notifyCallback(`Now at: ${matchingLocation.name}`, 'location-current');
        }
    }
    
    // Save if anything changed
    if (processed.casesCreated.length > 0 || 
        processed.casesCompleted.length > 0 || 
        processed.casesUpdated.length > 0 ||
        processed.contactsCreated.length > 0 ||
        processed.contactsUpdated.length > 0 ||
        processed.locationsCreated.length > 0 ||
        processed.locationsVisited.length > 0 ||
        processed.currentLocationSet) {
        saveChatState();
    }
    
    return processed;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Map relationship string to our standard levels
 */
function mapRelationship(rel) {
    if (!rel) return 3; // neutral
    
    const lower = rel.toLowerCase();
    
    if (lower.includes('hostile') || lower.includes('enemy')) return 1;
    if (lower.includes('unfriendly') || lower.includes('suspicious')) return 2;
    if (lower.includes('neutral')) return 3;
    if (lower.includes('friendly') || lower.includes('friend')) return 4;
    if (lower.includes('lover') || lower.includes('romantic') || lower.includes('intimate')) return 5;
    
    return 3; // default neutral
}

/**
 * Simple string similarity (0-1)
 */
function similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.includes(shorter)) {
        return shorter.length / longer.length;
    }
    
    // Word overlap
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = [...aWords].filter(w => bWords.has(w));
    
    return intersection.length / Math.max(aWords.size, bWords.size);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    extractFromMessage,
    processExtractionResults
};
