/**
 * The Tribunal - World State Parser
 * Parses <!--- WORLD{...} ---> tags from messages
 * Updates location, weather, time, and player condition without API calls
 * 
 * @version 3.0.0 - Merged AI world state extraction
 *   - AI infers weather, time, location from chat context (no regex)
 *   - Runs after WORLD tag; only fills gaps WORLD tag didn't provide
 *   - Same applyWorldState() pipeline for both sources
 * 
 * @version 2.0.0 - Added PC condition fields (pc_physical, pc_mental)
 *   - WORLD tag now carries player physical/mental state
 *   - Maps conditions to status effect IDs (same mapping as ai-extractor)
 *   - Free condition detection on every message (no extra API call)
 * 
 * WORLD Tag Format:
 * <!--- WORLD{"weather":"Heavy Rain","temp":72,"location":"Outside Venue, Roseville","time":"11:30 PM","pc_physical":"wounded","pc_mental":"terrified"} --->
 */

import { 
    getCurrentLocation,
    setCurrentLocation,
    addLocation,
    addLocationEvent,
    getLedger,
    setWeather,
    setTime
} from '../core/state.js';
import { getChatState, saveChatState } from '../core/persistence.js';
import { setRPTime, setRPWeather } from '../ui/watch.js';
import { refreshLocations } from '../ui/location-handlers.js';

// Location memory generator (lazy loaded)
let locationMemoryModule = null;

async function getLocationMemoryGenerator() {
    if (!locationMemoryModule) {
        try {
            locationMemoryModule = await import('../voice/location-memory.js');
        } catch (e) {
            console.warn('[WorldParser] Location memory generator not available:', e.message);
        }
    }
    return locationMemoryModule;
}

// ═══════════════════════════════════════════════════════════════
// AI API HELPERS (lazy loaded for AI world state extraction)
// ═══════════════════════════════════════════════════════════════

let apiModule = null;

async function getAPI() {
    if (!apiModule) {
        try {
            apiModule = await import('../voice/api-helpers.js');
        } catch (e) {
            console.warn('[WorldParser] Could not load api-helpers for AI extraction:', e.message);
        }
    }
    return apiModule;
}

function getSTContext() {
    try {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            return SillyTavern.getContext();
        }
        if (typeof window !== 'undefined' && window.SillyTavern?.getContext) {
            return window.SillyTavern.getContext();
        }
    } catch { /* silent */ }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// CONDITION → STATUS MAPPING
// Same mapping used by ai-extractor.js for consistency.
// Plain English labels → internal status effect IDs.
// ═══════════════════════════════════════════════════════════════

const CONDITION_TO_STATUS = {
    // Physical conditions
    wounded:     'finger_on_the_eject_button',
    exhausted:   'waste_land',
    intoxicated: 'revacholian_courage',
    drugged:     'pyrholidon',
    poisoned:    'finger_on_the_eject_button',
    
    // Mental conditions
    terrified:    'caustic_echo',
    enraged:      'law_jaw',
    depressed:    'the_expression',
    dissociating: 'the_pale',
    manic:        'tequila_sunset',
    lovestruck:   'homo_sexual_underground'
};

// "All clear" conditions → remove related statuses
const CLEAR_CONDITIONS = {
    healthy: ['finger_on_the_eject_button', 'waste_land', 'white_mourning'],
    calm:    ['caustic_echo', 'law_jaw', 'the_expression', 'the_pale', 'tequila_sunset']
};

// ═══════════════════════════════════════════════════════════════
// WORLD TAG REGEX
// ═══════════════════════════════════════════════════════════════

// Matches: <!--- WORLD{...} ---> or <!-- WORLD{...} -->
const WORLD_TAG_REGEX = /<!-{2,3}\s*WORLD\s*(\{[\s\S]*?\})\s*-{2,3}>/i;

// ═══════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════

/**
 * Parse WORLD tag from message text
 * @param {string} messageText - The message to parse
 * @returns {Object|null} Parsed world state or null if no tag found
 */
export function parseWorldTag(messageText) {
    if (!messageText || typeof messageText !== 'string') {
        return null;
    }
    
    const match = messageText.match(WORLD_TAG_REGEX);
    if (!match || !match[1]) {
        return null;
    }
    
    try {
        const jsonStr = match[1];
        const worldData = JSON.parse(jsonStr);
        
        console.log('[WorldParser] Found WORLD tag:', worldData);
        return worldData;
    } catch (e) {
        console.warn('[WorldParser] Failed to parse WORLD tag JSON:', e.message);
        return null;
    }
}

/**
 * Extract location parts from a location string
 * @param {string} locationStr - e.g. "Outside Venue, Roseville"
 * @returns {Object} { name, district }
 */
function parseLocationString(locationStr) {
    if (!locationStr) return { name: 'Unknown Location', district: null };
    
    // Check for "Place, District" format
    const parts = locationStr.split(',').map(s => s.trim());
    
    if (parts.length >= 2) {
        return {
            name: parts[0],
            district: parts.slice(1).join(', ')
        };
    }
    
    return {
        name: locationStr.trim(),
        district: null
    };
}

/**
 * Parse time string to hours and minutes
 * Handles: "11:30 PM", "3:45 AM", "14:30", "2:00pm"
 * @param {string} timeStr - Time string
 * @returns {Object|null} { hours: 0-23, minutes: 0-59 } or null
 */
function parseTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Try 12-hour format: "11:30 PM", "3:45 am", "2:00PM"
    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const isPM = ampmMatch[3].toUpperCase() === 'PM';
        
        // Convert to 24-hour
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        return { hours, minutes };
    }
    
    // Try 24-hour format: "14:30", "08:00"
    const militaryMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
        return {
            hours: parseInt(militaryMatch[1], 10),
            minutes: parseInt(militaryMatch[2], 10)
        };
    }
    
    return null;
}

/**
 * Map weather strings to watch-compatible values
 * watch.js uses: clear, clear-day, clear-night, cloudy, rain, rainy, 
 *                storm, stormy, snow, snowy, fog, foggy, wind, windy, mist
 */
function normalizeWeatherForWatch(weatherStr) {
    if (!weatherStr) return null;
    
    const lower = weatherStr.toLowerCase().trim();
    
    // Direct mappings
    const WEATHER_MAP = {
        'clear': 'clear-day',
        'sunny': 'clear-day',
        'cloudy': 'cloudy',
        'overcast': 'cloudy',
        'rain': 'rainy',
        'rainy': 'rainy',
        'raining': 'rainy',
        'light rain': 'rainy',
        'drizzle': 'rainy',
        'drizzling': 'rainy',
        'light drizzle': 'rainy',
        'heavy drizzle': 'rainy',
        'heavy rain': 'stormy',
        'downpour': 'stormy',
        'storm': 'stormy',
        'stormy': 'stormy',
        'thunderstorm': 'stormy',
        'snow': 'snowy',
        'snowy': 'snowy',
        'snowing': 'snowy',
        'light snow': 'snowy',
        'heavy snow': 'snowy',
        'blizzard': 'snowy',
        'sleet': 'rainy',
        'hail': 'stormy',
        'fog': 'foggy',
        'foggy': 'foggy',
        'mist': 'foggy',
        'misty': 'foggy',
        'haze': 'foggy',
        'hazy': 'foggy',
        'wind': 'windy',
        'windy': 'windy'
    };
    
    // Check direct match
    if (WEATHER_MAP[lower]) {
        return WEATHER_MAP[lower];
    }
    
    // Check partial matches
    if (lower.includes('drizzl')) return 'rainy';
    if (lower.includes('rain')) return 'rainy';
    if (lower.includes('storm') || lower.includes('thunder')) return 'stormy';
    if (lower.includes('snow') || lower.includes('blizzard')) return 'snowy';
    if (lower.includes('fog') || lower.includes('mist') || lower.includes('haz')) return 'foggy';
    if (lower.includes('wind')) return 'windy';
    if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
    if (lower.includes('clear') || lower.includes('sunny')) return 'clear-day';
    
    // Return as-is if no mapping found
    return lower;
}

/**
 * Find or create a location by name
 * @param {string} name - Location name
 * @param {string|null} district - District/region
 * @returns {Object} The location object
 */
function findOrCreateLocation(name, district) {
    const ledger = getLedger();
    const locations = ledger?.locations || [];
    
    // Try to find existing location (case-insensitive)
    const nameLower = name.toLowerCase();
    let existing = locations.find(l => l.name.toLowerCase() === nameLower);
    
    if (existing) {
        // Update district if we have new info
        if (district && !existing.district) {
            existing.district = district;
        }
        return existing;
    }
    
    // Create new location
    const newLoc = {
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name,
        district: district,
        visited: true,
        events: [],
        discovered: new Date().toISOString(),
        source: 'world_tag'
    };
    
    addLocation(newLoc);
    console.log('[WorldParser] Created new location:', name);
    
    return newLoc;
}

// ═══════════════════════════════════════════════════════════════
// CONDITION PROCESSOR
// ═══════════════════════════════════════════════════════════════

/**
 * Apply PC condition from WORLD tag to status effects
 * @param {string|null} physical - e.g. "wounded", "healthy", null
 * @param {string|null} mental - e.g. "terrified", "calm", null
 * @param {boolean} notify - Show toasts
 * @returns {{ changed: boolean, applied: string[], cleared: string[] }}
 */
function applyConditionFromWorldTag(physical, mental, notify = true) {
    const applied = [];
    const cleared = [];
    
    const state = getChatState();
    if (!state) return { changed: false, applied, cleared };
    
    if (!state.vitals) state.vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13, activeEffects: [] };
    if (!state.vitals.activeEffects) state.vitals.activeEffects = [];
    
    const activeEffects = state.vitals.activeEffects;
    const activeIds = activeEffects.map(e => typeof e === 'string' ? e : e.id);
    
    for (const value of [physical, mental]) {
        if (!value || typeof value !== 'string') continue;
        const lower = value.toLowerCase().trim();
        if (lower === 'null' || lower === '') continue;
        
        // Check if it's a "clear" condition (healthy/calm)
        if (CLEAR_CONDITIONS[lower]) {
            for (const statusId of CLEAR_CONDITIONS[lower]) {
                const idx = activeEffects.findIndex(e => {
                    const id = typeof e === 'string' ? e : e.id;
                    const source = typeof e === 'string' ? 'unknown' : e.source;
                    return id === statusId && (source === 'world-tag' || source === 'ai-detected' || source === 'detected');
                });
                if (idx >= 0) {
                    const name = activeEffects[idx].name || statusId;
                    activeEffects.splice(idx, 1);
                    cleared.push(statusId);
                    console.log(`[WorldParser] Cleared: ${name}`);
                }
            }
            continue;
        }
        
        // Map to status ID
        const statusId = CONDITION_TO_STATUS[lower];
        if (!statusId) continue;
        
        // Don't duplicate
        if (activeIds.includes(statusId)) continue;
        
        activeEffects.push({
            id: statusId,
            name: lower.charAt(0).toUpperCase() + lower.slice(1),
            source: 'world-tag',
            remainingMessages: null,
            stacks: 1
        });
        applied.push(statusId);
        console.log(`[WorldParser] Applied condition: ${lower} → ${statusId}`);
        
        if (notify && typeof toastr !== 'undefined') {
            toastr.info(
                `Condition: ${lower}`,
                'World State',
                { timeOut: 2000 }
            );
        }
    }
    
    const changed = applied.length > 0 || cleared.length > 0;
    
    if (changed) {
        // Dispatch events for UI refresh
        window.dispatchEvent(new CustomEvent('tribunal:statusRefreshNeeded'));
        window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
            detail: {
                health: state.vitals.health,
                maxHealth: state.vitals.maxHealth,
                morale: state.vitals.morale,
                maxMorale: state.vitals.maxMorale,
                statusChange: true,
                source: 'world-tag'
            }
        }));
    }
    
    return { changed, applied, cleared };
}

// ═══════════════════════════════════════════════════════════════
// LOCATION MEMORY GENERATION
// Fires async after location changes — generates a themed
// memory/impression and stores it in the location's events.
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a location memory and store it in the location's events array.
 * Fire-and-forget — does not block the caller.
 */
async function generateAndStoreLocationMemory(location, isReturning = false) {
    if (!location?.id || !location?.name) return;
    
    // Check if enabled
    const settings = window.TribunalState?.getSettings?.();
    if (settings?.worldState?.useAIWorldState === false) return;
    
    try {
        const memGen = await getLocationMemoryGenerator();
        if (!memGen?.generateLocationMemory) return;
        
        // Determine mode: is this a place the character has visited before?
        const hasExistingEvents = location.events && location.events.length > 0;
        const mode = (hasExistingEvents || location.visited) ? 'familiar' : 'new';
        
        const memory = await memGen.generateLocationMemory({
            locationName: location.name,
            district: location.district,
            mode,
            chatDepth: 5
        });
        
        if (memory?.text) {
            addLocationEvent(location.id, {
                text: memory.text,
                timestamp: memory.timestamp,
                aiGenerated: true,
                source: 'location-memory'
            });
            
            saveChatState();
            
            // Refresh notebook UI to show the new memory
            try { refreshLocations(); } catch { /* silent */ }
            
            console.log(`[WorldParser] Stored ${mode} memory for ${location.name}`);
        }
    } catch (e) {
        console.warn('[WorldParser] Location memory generation failed:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// STATE UPDATER
// ═══════════════════════════════════════════════════════════════

/**
 * Apply parsed world data to state
 * @param {Object} worldData - Parsed WORLD tag data
 * @param {Object} options - Options
 * @returns {Object} What was updated
 */
export function applyWorldState(worldData, options = {}) {
    if (!worldData) return { updated: false };
    
    const {
        updateLocation = true,
        updateWeather = true,
        updateTime = true,
        updateCondition = true,
        notify = true,
        refreshUI = true
    } = options;
    
    const result = {
        updated: false,
        location: null,
        weather: null,
        time: null,
        condition: null
    };
    
    // ─────────────────────────────────────────────────────────
    // LOCATION
    // ─────────────────────────────────────────────────────────
    if (updateLocation && worldData.location) {
        const { name, district } = parseLocationString(worldData.location);
        const currentLoc = getCurrentLocation();
        
        // Only update if location actually changed
        if (!currentLoc || currentLoc.name.toLowerCase() !== name.toLowerCase()) {
            const loc = findOrCreateLocation(name, district);
            const isReturning = !!currentLoc; // Had a previous location
            setCurrentLocation(loc);
            result.location = loc;
            result.updated = true;

            // Dispatch event for ledger awareness
            window.dispatchEvent(new CustomEvent('tribunal:locationChanged', { 
                detail: loc 
            }));
            
            if (notify && typeof toastr !== 'undefined') {
                toastr.info(`📍 ${name}`, 'Location', { timeOut: 2000 });
            }
            
            // Fire-and-forget: Generate a location memory for the notebook
            generateAndStoreLocationMemory(loc, isReturning);
        }
    }
    
    // ─────────────────────────────────────────────────────────
    // WEATHER
    // ─────────────────────────────────────────────────────────
    if (updateWeather && worldData.weather) {
        const weatherStr = worldData.weather;
        const temp = worldData.temp || worldData.temperature;
        
        // Update ledger weather (for persistence)
        // setWeather expects an object { condition, temp, ... }
        const weatherObj = { condition: weatherStr };
        if (temp !== undefined && temp !== null) weatherObj.temp = temp;
        setWeather(weatherObj);
        
        // Update watch display
        const watchWeather = normalizeWeatherForWatch(weatherStr);
        if (watchWeather) {
            try {
                setRPWeather(watchWeather);
                console.log('[WorldParser] Set watch weather to:', watchWeather);
            } catch (e) {
                console.warn('[WorldParser] Could not set watch weather:', e.message);
            }
        }
        
        result.weather = { condition: weatherStr, normalized: watchWeather, temp };
        result.updated = true;
    }
    
    // ─────────────────────────────────────────────────────────
    // TIME
    // ─────────────────────────────────────────────────────────
    if (updateTime && worldData.time) {
        const timeStr = worldData.time;
        
        // Parse time first so we can use it for both state and watch
        const parsed = parseTimeString(timeStr);
        
        // Update ledger time (for persistence)
        // setTime expects an object { display, period, ... }
        const timeObj = { display: timeStr };
        if (parsed) {
            // Add period for UI consumption
            const h = parsed.hours;
            if (h >= 5 && h < 7) timeObj.period = 'DAWN';
            else if (h >= 7 && h < 12) timeObj.period = 'MORNING';
            else if (h >= 12 && h < 17) timeObj.period = 'AFTERNOON';
            else if (h >= 17 && h < 20) timeObj.period = 'EVENING';
            else if (h >= 20 && h < 23) timeObj.period = 'NIGHT';
            else timeObj.period = 'LATE_NIGHT';
        }
        setTime(timeObj);
        
        // Update watch display
        if (parsed) {
            try {
                setRPTime(parsed.hours, parsed.minutes);
                console.log('[WorldParser] Set watch time to:', parsed.hours, ':', parsed.minutes);
            } catch (e) {
                console.warn('[WorldParser] Could not set watch time:', e.message);
            }
        }
        
        result.time = { display: timeStr, parsed };
        result.updated = true;
    }
    
    // ─────────────────────────────────────────────────────────
    // PLAYER CONDITION (pc_physical / pc_mental)
    // ─────────────────────────────────────────────────────────
    if (updateCondition && (worldData.pc_physical || worldData.pc_mental)) {
        const conditionResult = applyConditionFromWorldTag(
            worldData.pc_physical,
            worldData.pc_mental,
            notify
        );
        
        if (conditionResult.changed) {
            result.condition = conditionResult;
            result.updated = true;
        }
    }
    
    // ─────────────────────────────────────────────────────────
    // SAVE & REFRESH
    // ─────────────────────────────────────────────────────────
    if (result.updated) {
        saveChatState();
        
        if (refreshUI) {
            // Refresh Field Notebook
            if (typeof refreshLocations === 'function') {
                try {
                    refreshLocations();
                } catch (e) {
                    console.warn('[WorldParser] Could not refresh locations:', e.message);
                }
            }
        }
        
        console.log('[WorldParser] Applied world state:', result);
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message for WORLD tags and apply state changes
 * Call this from onNewAIMessage in index.js
 * 
 * @param {string} messageText - The message to process
 * @param {Object} options - Options passed to applyWorldState
 * @returns {Object} Result of applying world state
 */
export function processWorldTag(messageText, options = {}) {
    const worldData = parseWorldTag(messageText);
    
    if (!worldData) {
        return { updated: false, noTag: true };
    }
    
    return applyWorldState(worldData, options);
}

// ═══════════════════════════════════════════════════════════════
// WORLD TAG INJECTION (for Author's Note)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate the instruction text to inject into Author's Note
 * This tells the AI to include WORLD tags in responses
 */
export function getWorldTagInjectionText() {
    return `[System: Include a WORLD state tag at the start of each response in this exact format:
<!--- WORLD{"weather":"current weather","temp":temperature_number,"location":"Specific Place, District","time":"HH:MM AM/PM","pc_physical":"wounded|exhausted|intoxicated|drugged|healthy|null","pc_mental":"terrified|enraged|depressed|dissociating|manic|lovestruck|calm|null"} --->
Update these values to reflect the current scene. pc_physical and pc_mental describe the PLAYER CHARACTER's current state only — not NPCs or other characters. Use null if unchanged or unclear. Keep the tag on one line.]`;
}

/**
 * Get a shorter version for character cards
 */
export function getWorldTagInjectionShort() {
    return `[Always start responses with: <!--- WORLD{"weather":"...","temp":##,"location":"Place, Area","time":"H:MM PM","pc_physical":"wounded|exhausted|healthy|null","pc_mental":"terrified|calm|null"} --->
pc_physical/pc_mental = PLAYER only, not NPCs.]`;
}

// ═══════════════════════════════════════════════════════════════
// AI WORLD STATE EXTRACTION
// Asks the model to infer weather, time, location from chat context.
// Replaces regex weather pattern matching — the model wrote the scene,
// just ask it what's happening.
// ═══════════════════════════════════════════════════════════════

let lastAICallTime = 0;
const AI_DEBOUNCE_MS = 3000;

const AI_WORLD_STATE_PROMPT = `You are a scene analysis tool. Given recent roleplay chat messages, infer the current world state. Output ONLY valid JSON — no reasoning, no markdown, no backticks.

Return this exact structure:
{
  "weather": "<value or null>",
  "time": "<H:MM AM/PM or null>",
  "location": "<string or null>"
}

WEATHER must be one of: clear, cloudy, rain, storm, snow, fog, wind — or null if truly unclear.
TIME: Your best estimate of in-story time in 12h format with AM/PM. Use context clues (morning light, midnight, dinner time, etc). null only if absolutely no indication.
LOCATION: The current scene location as a short name. null if unknown.

Be decisive. Make your best inference from context — "the evening air" means ~7:00 PM. "Moonlight" = night. "After lunch" = ~1:00 PM. A bar scene with no time cues = default to ~8:00 PM. Pick something reasonable rather than returning null.`;

/**
 * Build concise context from recent chat for AI extraction
 */
function buildAIContextPrompt(skipFields = {}) {
    const ctx = getSTContext();
    if (!ctx?.chat?.length) return null;
    
    const recentMessages = ctx.chat.slice(-5);
    
    const chatExcerpt = recentMessages.map(msg => {
        const speaker = msg.is_user ? 'USER' : (msg.name || 'AI');
        const text = (msg.mes || '').replace(/<[^>]*>/g, '').substring(0, 300);
        return `[${speaker}]: ${text}`;
    }).join('\n');
    
    let knownState = '';
    if (skipFields.weather) knownState += `\nWeather already known: ${skipFields.weather}`;
    if (skipFields.time) knownState += `\nTime already known: ${skipFields.time}`;
    if (skipFields.location) knownState += `\nLocation already known: ${skipFields.location}`;
    
    const skipNote = knownState
        ? `\n\nALREADY KNOWN (return null for these):${knownState}`
        : '';
    
    return `Recent chat:\n${chatExcerpt}${skipNote}\n\nWhat is the current weather, time, and location?`;
}

/**
 * Parse AI response JSON with fallback for formatting issues
 */
function parseAIResponse(responseText) {
    if (!responseText) return null;
    
    let cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Build a WORLD-tag-compatible shape so applyWorldState() can consume it directly
        const result = {};
        
        // Weather — normalize to watch-compatible key
        if (parsed.weather && parsed.weather !== 'null') {
            const w = parsed.weather.toLowerCase().trim();
            // Quick normalize — applyWorldState will run normalizeWeatherForWatch on it
            result.weather = w;
        }
        
        // Time — pass through as string, parseTimeString() handles it
        if (parsed.time && parsed.time !== 'null') {
            result.time = parsed.time;
        }
        
        // Location — pass through as string
        if (parsed.location && parsed.location !== 'null' && parsed.location !== 'unknown') {
            result.location = parsed.location.trim();
        }
        
        return Object.keys(result).length > 0 ? result : null;
    } catch (e) {
        console.warn('[WorldParser/AI] JSON parse failed:', e.message);
        return null;
    }
}

/**
 * Extract world state from chat context using AI, then apply gaps.
 * Call this after processWorldTag() — it only fills in missing fields.
 * 
 * @param {string} messageText - Latest message text
 * @param {object} worldTagResult - Result from processWorldTag() (fields already set)
 * @returns {Promise<object|null>} What was applied, or null if skipped
 */
export async function extractAndApplyAIWorldState(messageText, worldTagResult = {}) {
    // Debounce
    const now = Date.now();
    if (now - lastAICallTime < AI_DEBOUNCE_MS) {
        console.log('[WorldParser/AI] Debounced');
        return null;
    }
    lastAICallTime = now;
    
    // Check settings
    const settings = window.TribunalState?.getSettings?.();
    if (!settings?.enabled) return null;
    if (settings?.worldState?.useAIWorldState === false) return null;
    
    // Build skip fields from what WORLD tag already provided
    const skipFields = {};
    if (worldTagResult.weather) skipFields.weather = worldTagResult.weather.condition || worldTagResult.weather;
    if (worldTagResult.time) skipFields.time = worldTagResult.time.display || worldTagResult.time;
    if (worldTagResult.location) skipFields.location = worldTagResult.location?.name || worldTagResult.location;
    
    // If WORLD tag provided everything, skip AI entirely
    if (skipFields.weather && skipFields.time && skipFields.location) {
        console.log('[WorldParser/AI] WORLD tag provided all fields, skipping');
        return null;
    }
    
    const userPrompt = buildAIContextPrompt(skipFields);
    if (!userPrompt) return null;
    
    const api = await getAPI();
    if (!api?.callAPIWithTokens) {
        console.warn('[WorldParser/AI] API not available');
        return null;
    }
    
    try {
        console.log('[WorldParser/AI] Extracting world state from chat context...');
        const response = await api.callAPIWithTokens(AI_WORLD_STATE_PROMPT, userPrompt, 150);
        
        if (!response) return null;
        
        const aiWorldData = parseAIResponse(response);
        if (!aiWorldData) {
            console.warn('[WorldParser/AI] Could not parse:', response.substring(0, 200));
            return null;
        }
        
        // Remove fields WORLD tag already provided
        if (skipFields.weather) delete aiWorldData.weather;
        if (skipFields.time) delete aiWorldData.time;
        if (skipFields.location) delete aiWorldData.location;
        
        if (Object.keys(aiWorldData).length === 0) {
            console.log('[WorldParser/AI] No new fields to apply');
            return null;
        }
        
        console.log('[WorldParser/AI] Applying AI-inferred state:', aiWorldData);
        
        // Feed directly into the same applyWorldState() used by WORLD tags
        const result = applyWorldState(aiWorldData, {
            updateLocation: !!aiWorldData.location,
            updateWeather: !!aiWorldData.weather,
            updateTime: !!aiWorldData.time,
            updateCondition: false,  // AI doesn't infer PC condition
            notify: false,           // Don't toast for AI inferences
            refreshUI: true
        });
        
        if (result.updated) {
            result.source = 'ai';
        }
        
        return result;
        
    } catch (e) {
        console.warn('[WorldParser/AI] Extraction failed:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// DEBUG
// ═══════════════════════════════════════════════════════════════

export function debugWorldParser() {
    return {
        currentLocation: getCurrentLocation(),
        ledger: getLedger(),
        testParse: (text) => parseWorldTag(text),
        testTime: (text) => parseTimeString(text),
        testWeather: (text) => normalizeWeatherForWatch(text)
    };
}

// Default export for convenience
export default {
    parseWorldTag,
    applyWorldState,
    processWorldTag,
    extractAndApplyAIWorldState,
    getWorldTagInjectionText,
    getWorldTagInjectionShort,
    debugWorldParser
};
