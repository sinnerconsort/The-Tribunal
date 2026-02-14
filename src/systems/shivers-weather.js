/**
 * The Tribunal - Shivers & Weather Module
 * Shivers generation, investigation seeds, and weather state management.
 * Extracted from newspaper-strip.js so investigation can use Shivers
 * without depending on the newspaper display component.
 * 
 * @version 1.0.0
 * 
 * Exports for investigation.js:
 *   getInvestigationSeed() / clearInvestigationSeed()
 *   getShiversState()  → { weather, period, location, lastQuip, investigationSeed }
 *   getCurrentWeather() → string
 *   regenerateShivers() → triggers new quip + seed generation
 *   initShiversWeather() → subscribe to weather events, set initial state
 */

import { getSettings } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// GENRE-AWARE SHIVERS NAME
// ═══════════════════════════════════════════════════════════════

let _getSkillName = null;

async function ensureSkillName() {
    if (_getSkillName) return;
    try {
        const mod = await import('../data/setting-profiles.js');
        _getSkillName = mod.getSkillName || mod.default?.getSkillName;
    } catch (e) {
        console.warn('[Shivers-Weather] Could not load setting-profiles:', e);
    }
}

function getShiversName() {
    if (_getSkillName) {
        try { return _getSkillName('shivers', 'Shivers'); } catch { /* fall through */ }
    }
    return 'Shivers';
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK QUIPS (shown instantly while AI generates)
// ═══════════════════════════════════════════════════════════════

const FALLBACK_QUIPS = {
    rain: {
        morning: "The rain arrived before dawn, patient and persistent. It drums against windows and pools in gutters, carrying the district's secrets toward the sea.",
        afternoon: "Afternoon rain transforms the streets into mirrors. Each puddle reflects a different version of the city—older, sadder, more honest.",
        evening: "Evening rain falls heavier now, as if the sky has been saving up its grief. Neon signs bleed color across wet pavement.",
        night: "Night rain speaks in whispers against your collar. The streets empty of everyone except those with nowhere else to be."
    },
    storm: {
        morning: "The storm rolled in like an argument that's been building for days. Lightning illuminates the district's bones—the old architecture, the cracked facades.",
        afternoon: "Thunder shakes the windows in their frames. The air tastes electric, metallic. This storm has opinions about this city.",
        evening: "The evening storm turns violent. Rain comes sideways now, finding every crack in your resolve. Power flickers in the old quarter.",
        night: "Night storms reveal what daylight hides. In the flash of lightning, you see the truth of every alley, every shadow that shouldn't move but does."
    },
    snow: {
        morning: "Snow fell while you slept, erasing yesterday's footprints. The district looks almost innocent now, wrapped in white gauze. But you know what's underneath.",
        afternoon: "The afternoon snow falls thick and silent, muffling the usual arguments and machinery. Even the drunks seem reverent.",
        evening: "Evening snow transforms the streetlights into halos. Everything moves slower, gentler. But the cold is serious—it seeps through boot soles and settles in joints.",
        night: "Snowfall at night carries its own silence, a pressure against the eardrums. Footsteps crunch too loud. Your breath ghosts away."
    },
    fog: {
        morning: "Morning fog hasn't lifted—it rarely does in this district. Shapes emerge from the grey and dissolve back into it. The familiar becomes uncertain.",
        afternoon: "Afternoon, and still the fog persists. Sound travels strangely—voices from unseen conversations, footsteps that could be anywhere.",
        evening: "Evening fog thickens, swallowing the streetlights whole. You navigate by memory and instinct. Everyone you pass could be anyone.",
        night: "Night fog makes the city into a maze of uncertain dimensions. You are walking through clouds that never rose."
    },
    clear: {
        morning: "Clear morning light arrives without mercy, exposing every stain, every crack, every poor decision made in darkness.",
        afternoon: "Clear skies press down with the weight of visibility. Nowhere to hide today—not for you, not for anyone.",
        evening: "The evening sky turns colors you don't have names for. Clear air carries sounds from blocks away—someone practicing accordion, badly.",
        night: "Clear night sky means the stars are watching. They've been watching for longer than this city has existed."
    },
    overcast: {
        morning: "Grey morning, like most mornings here. The clouds are thinking, have been thinking for days. No weather, just waiting.",
        afternoon: "Overcast afternoon—the sky refuses to commit. No rain, no sun, just a pressing weight of grey.",
        evening: "Dusk comes early under heavy clouds. The distinction between day and night blurs at the edges.",
        night: "No moon tonight, no stars—just cloud cover like a lid on a pot. The darkness feels thicker than usual."
    },
    wind: {
        morning: "The morning wind carries voices from the harbor—sailors cursing, gulls screaming, ropes snapping against masts.",
        afternoon: "Afternoon gusts tear through the district, scattering newspapers and regrets equally. Hold onto your hat.",
        evening: "Evening wind howls between buildings like grief finding its voice. Shutters bang. Somewhere, a door slams repeatedly.",
        night: "Night wind speaks in a language older than this city. It remembers what stood here before. It disapproves of what replaced it."
    }
};

// Fallback seeds when AI generation fails
const FALLBACK_SEEDS = {
    rain: [
        "water pooling in an unusual spot",
        "something washed up against the curb",
        "tracks visible in the wet pavement",
        "a reflection that doesn't match its source"
    ],
    storm: [
        "something displaced by the wind",
        "a flash of metal in the lightning",
        "debris that wasn't there before",
        "a sound that wasn't thunder"
    ],
    snow: [
        "disturbed snow near the wall",
        "footprints that stop abruptly",
        "something dark beneath the white",
        "warmth where there shouldn't be any"
    ],
    fog: [
        "a shape at the edge of visibility",
        "a sound with no clear source",
        "something that smells out of place",
        "movement in the peripheral"
    ],
    clear: [
        "a shadow that doesn't belong",
        "something catching the light",
        "a stain that tells a story",
        "marks on the wall at eye level"
    ],
    overcast: [
        "something half-hidden in the grey",
        "a detail that wants to be overlooked",
        "dust disturbed recently",
        "an object out of its context"
    ],
    wind: [
        "something that blew in from elsewhere",
        "papers scattered in a pattern",
        "a door that won't stay closed",
        "a sound carried from far away"
    ]
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentState = {
    weather: 'overcast',
    period: 'afternoon',
    location: null,
    investigationSeed: null,
    lastQuip: null
};

let weatherSubscription = null;
let shiversGenerating = false;
let shiversDebounceTimer = null;
let lastShiversKey = null;

// ═══════════════════════════════════════════════════════════════
// WEATHER KEY NORMALIZATION
// ═══════════════════════════════════════════════════════════════

function normalizeWeatherKey(weather) {
    return (weather || 'overcast').toLowerCase()
        .replace('-day', '').replace('-night', '')
        .replace('rainy', 'rain').replace('stormy', 'storm')
        .replace('snowy', 'snow').replace('foggy', 'fog')
        .replace('windy', 'wind').replace('cloudy', 'overcast')
        .replace('mist', 'fog');
}

function normalizePeriodKey(period) {
    const p = (period || '').toLowerCase();
    if (p.includes('dawn') || p.includes('morning') || p === 'day') return 'morning';
    if (p.includes('evening') || p === 'city-night') return 'evening';
    if (p.includes('night') || p === 'quiet-night' || p === 'latenight') return 'night';
    return 'afternoon';
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK HELPERS
// ═══════════════════════════════════════════════════════════════

function getShiversQuip(weather, period) {
    const weatherKey = normalizeWeatherKey(weather);
    const periodKey = normalizePeriodKey(period);
    const weatherQuips = FALLBACK_QUIPS[weatherKey] || FALLBACK_QUIPS.overcast;
    return weatherQuips[periodKey] || weatherQuips.afternoon;
}

function getFallbackSeed(weather) {
    const weatherKey = normalizeWeatherKey(weather);
    const seeds = FALLBACK_SEEDS[weatherKey] || FALLBACK_SEEDS.overcast;
    return seeds[Math.floor(Math.random() * seeds.length)];
}

// ═══════════════════════════════════════════════════════════════
// SCENE CONTEXT (from SillyTavern)
// ═══════════════════════════════════════════════════════════════

function getSceneContext() {
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (!ctx) return {};
        
        const result = {};
        
        // Last AI message — grab last ~300 chars for scene grounding
        const chat = ctx.chat;
        if (chat && chat.length > 0) {
            for (let i = chat.length - 1; i >= Math.max(0, chat.length - 5); i--) {
                const msg = chat[i];
                if (msg && !msg.is_user && msg.mes) {
                    const clean = msg.mes.replace(/<[^>]*>/g, '').trim();
                    result.sceneExcerpt = clean.length > 300 
                        ? '...' + clean.slice(-300) 
                        : clean;
                    break;
                }
            }
        }
        
        // Character card info
        const charData = ctx.characters?.[ctx.characterId];
        if (charData) {
            result.characterName = charData.name || '';
            if (charData.scenario) {
                result.scenario = charData.scenario.substring(0, 200);
            }
            if (charData.description) {
                result.worldHint = charData.description.substring(0, 150);
            }
        }
        
        // Group chat
        if (ctx.groupId && ctx.groups) {
            const group = ctx.groups.find(g => g.id === ctx.groupId);
            if (group?.name) result.groupName = group.name;
        }
        
        return result;
    } catch (e) {
        console.warn('[Shivers-Weather] Failed to get scene context:', e.message);
        return {};
    }
}

// ═══════════════════════════════════════════════════════════════
// SHIVERS AI PROMPT
// ═══════════════════════════════════════════════════════════════

function buildShiversPrompt(weather, period, location, sceneContext = {}) {
    const shiversName = getShiversName();
    const system = `You are ${shiversName.toUpperCase()} — the psychic voice of the environment itself. You feel every raindrop on every rooftop, every crack in every wall, every footstep on every street. You speak in short, evocative, melancholic prose. You are the SETTING made conscious.

CRITICAL RULES:
- ABSORB the scene context below. If the setting is an underground snow town full of monsters, you are THAT place — not a generic city. If it's a neon-drenched megacity, you are acid rain on chrome. If it's a medieval village, you are hearthsmoke and cobblestone.
- Your tone is always: observant, melancholic, poetic, slightly ominous.
- Never use "I" — you are "the district", "the cavern", "the streets", "the walls", "the air", "the path", whatever fits the ACTUAL setting.
- Never address the reader as "you" — describe what the world FEELS, not what the character experiences.
- Do NOT repeat the weather condition literally. Don't say "it's snowing." SHOW it through sensory detail specific to THIS place.
- Reference textures that belong to THIS world. A cave has crystal and stone. A ship has hull and bulkhead. A forest has bark and loam.

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "quip": "2-3 sentences of atmospheric Shivers prose. No more.",
  "seed": "A brief environmental detail that could be investigated — something Shivers noticed that might be a clue, an anomaly, or simply interesting. 5-15 words. Examples: 'disturbed snow near the lamp post', 'a door left slightly ajar', 'scratch marks on the stone floor', 'something metallic glinting in the gutter'. Make it specific to THIS scene and weather."
}

The "quip" is what the user sees. The "seed" is hidden metadata for the investigation system — it should be a concrete, discoverable detail that fits naturally with what Shivers is describing.`;

    const weatherDesc = weather || 'overcast';
    const periodDesc = period || 'afternoon';
    const locationDesc = location || 'the district';

    let userParts = [
        `Weather: ${weatherDesc}`,
        `Time: ${periodDesc}`,
        `Location: ${locationDesc}`
    ];
    
    if (sceneContext.scenario) {
        userParts.push(`Setting: ${sceneContext.scenario}`);
    } else if (sceneContext.worldHint) {
        userParts.push(`World: ${sceneContext.worldHint}`);
    }
    
    if (sceneContext.characterName) {
        userParts.push(`Characters present: ${sceneContext.characterName}`);
    }
    
    if (sceneContext.groupName) {
        userParts.push(`Group: ${sceneContext.groupName}`);
    }
    
    if (sceneContext.sceneExcerpt) {
        userParts.push(`\nRecent scene:\n${sceneContext.sceneExcerpt}`);
    }
    
    userParts.push(`\nGenerate the ${shiversName} observation as JSON with "quip" and "seed" fields.`);

    return { system, user: userParts.join('\n') };
}

// ═══════════════════════════════════════════════════════════════
// JSON EXTRACTION
// ═══════════════════════════════════════════════════════════════

function extractShiversJSON(response) {
    if (!response || typeof response !== 'string') return null;
    
    try {
        const parsed = JSON.parse(response.trim());
        if (parsed.quip) return parsed;
    } catch (e) {
        // Continue to extraction
    }
    
    const jsonMatch = response.match(/\{[\s\S]*?"quip"[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.quip) return parsed;
        } catch (e) {
            let repaired = jsonMatch[0];
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
            repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
            try {
                const parsed = JSON.parse(repaired);
                if (parsed.quip) return parsed;
            } catch (e2) { /* give up */ }
        }
    }
    
    // Fallback: treat entire response as quip
    if (response.trim().length > 10 && response.trim().length < 500) {
        return { quip: response.trim(), seed: null };
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// AI GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate an AI Shivers quip + investigation seed.
 * Uses callAPIWithTokens with a small budget (200 tokens).
 * Falls back to static quip + random seed on failure.
 */
async function generateShiversQuip(weather, period, location) {
    if (shiversGenerating) return null;
    
    const settings = getSettings();
    if (!settings?.enabled) return null;
    
    shiversGenerating = true;
    
    try {
        const { callAPIWithTokens } = await import('../voice/api-helpers.js');
        const sceneContext = getSceneContext();
        
        console.log('[Shivers-Weather] Generating:', {
            weather, period, location,
            hasScene: !!sceneContext.sceneExcerpt,
            character: sceneContext.characterName || 'none'
        });
        
        const prompt = buildShiversPrompt(weather, period, location, sceneContext);
        const response = await callAPIWithTokens(prompt.system, prompt.user, 200);
        const parsed = extractShiversJSON(response);
        
        if (parsed && parsed.quip && parsed.quip.trim().length > 10) {
            console.log('[Shivers-Weather] ✓ AI generated:', {
                quip: parsed.quip.substring(0, 60) + '...',
                seed: parsed.seed || 'none'
            });
            
            if (parsed.seed) {
                currentState.investigationSeed = parsed.seed;
            }
            
            return parsed.quip.trim();
        }
    } catch (e) {
        console.warn('[Shivers-Weather] AI generation failed, using fallback:', e.message);
    } finally {
        shiversGenerating = false;
    }
    
    // Fallback seed
    currentState.investigationSeed = getFallbackSeed(weather);
    return null;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE SHIVERS (called on weather change or manual refresh)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate new Shivers quip + seed for current weather/period.
 * Shows fallback immediately, then replaces with AI version.
 * Debounces rapid weather changes (500ms).
 * 
 * @param {Function} [onQuipReady] - Optional callback when quip updates: (quip, seed) => void
 */
function updateShivers(weather, period, onQuipReady) {
    const effectiveWeather = weather || currentState.weather;
    const effectivePeriod = period || currentState.period;
    const effectiveLocation = currentState.location;
    
    // Dedup: don't regenerate for same combo
    const shiversKey = `${effectiveWeather}|${effectivePeriod}|${effectiveLocation}`;
    if (shiversKey === lastShiversKey) return;
    lastShiversKey = shiversKey;
    
    // Step 1: Fallback quip immediately
    const fallbackQuip = getShiversQuip(effectiveWeather, effectivePeriod);
    currentState.lastQuip = fallbackQuip;
    currentState.investigationSeed = getFallbackSeed(effectiveWeather);
    
    // Notify listener with fallback
    if (onQuipReady) {
        onQuipReady(fallbackQuip, currentState.investigationSeed);
    }
    
    // Step 2: Debounced AI generation
    if (shiversDebounceTimer) clearTimeout(shiversDebounceTimer);
    
    shiversDebounceTimer = setTimeout(async () => {
        const aiQuip = await generateShiversQuip(effectiveWeather, effectivePeriod, effectiveLocation);
        
        if (aiQuip) {
            currentState.lastQuip = aiQuip;
            // Notify listener with AI quip
            if (onQuipReady) {
                onQuipReady(aiQuip, currentState.investigationSeed);
            }
        }
    }, 500);
}

// ═══════════════════════════════════════════════════════════════
// WEATHER EVENT HANDLING
// ═══════════════════════════════════════════════════════════════

/** Listener callback set by investigation (or whoever owns display) */
let _onQuipReady = null;

function onWeatherChange(data) {
    console.log('[Shivers-Weather] Weather change:', data);
    
    const { weather, period, location } = data;
    if (!weather && !period) return;
    
    if (weather) currentState.weather = weather;
    if (period) currentState.period = period;
    if (location) currentState.location = location;
    
    updateShivers(weather, period, _onQuipReady);
}

async function connectToWeatherSystem() {
    try {
        const weatherModule = await import('../systems/weather-integration.js');
        
        if (weatherModule.subscribe) {
            weatherSubscription = weatherModule.subscribe(onWeatherChange);
            console.log('[Shivers-Weather] ✓ Subscribed to weather events');
            
            // Get initial state
            if (weatherModule.getState) {
                const state = weatherModule.getState();
                if (state.weather || state.period) {
                    onWeatherChange(state);
                }
            }
        }
    } catch (e) {
        console.warn('[Shivers-Weather] Weather integration not available:', e.message);
    }
}

/**
 * Compute current period from real clock
 */
function computeCurrentPeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return 'DAWN';
    if (hour >= 7 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 20) return 'EVENING';
    if (hour >= 20 && hour < 23) return 'NIGHT';
    return 'LATE_NIGHT';
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current investigation seed (what Shivers noticed).
 * Called by investigation before running Perception scan.
 */
export function getInvestigationSeed() {
    return currentState.investigationSeed;
}

/**
 * Clear the investigation seed after Perception consumes it.
 */
export function clearInvestigationSeed() {
    console.log('[Shivers-Weather] Investigation seed consumed');
    currentState.investigationSeed = null;
}

/**
 * Get full Shivers state snapshot
 */
export function getShiversState() {
    return { ...currentState };
}

/**
 * Get current weather string (normalized)
 */
export function getCurrentWeather() {
    return currentState.weather || 'overcast';
}

/**
 * Get current period
 */
export function getCurrentPeriod() {
    return currentState.period || computeCurrentPeriod();
}

/**
 * Get the genre-aware Shivers display name
 */
export function getShiversDisplayName() {
    return getShiversName();
}

/**
 * Force regenerate Shivers quip + seed.
 * Returns a promise that resolves when the fallback is set
 * (AI generation continues in background).
 */
export function regenerateShivers(onQuipReady) {
    lastShiversKey = null;  // Clear dedup
    updateShivers(currentState.weather, currentState.period, onQuipReady || _onQuipReady);
}

/**
 * Register a callback for when Shivers quips update.
 * Callback signature: (quip: string, seed: string|null) => void
 */
export function onShiversUpdate(callback) {
    _onQuipReady = callback;
}

/**
 * Initialize Shivers weather system.
 * Connects to weather events and sets initial state.
 */
export async function initShiversWeather() {
    // Set initial period from clock
    currentState.period = computeCurrentPeriod();
    
    // Connect to weather system
    await connectToWeatherSystem();
    
    // Load genre-aware naming
    await ensureSkillName();
    
    // Listen for genre changes
    window.addEventListener('tribunal:genreChanged', async () => {
        await ensureSkillName();
    });
    
    // If no weather data came from subscription, generate initial state
    if (!currentState.lastQuip) {
        const fallback = getShiversQuip(currentState.weather, currentState.period);
        currentState.lastQuip = fallback;
        currentState.investigationSeed = getFallbackSeed(currentState.weather);
    }
    
    console.log('[Shivers-Weather] ✓ Initialized', {
        weather: currentState.weather,
        period: currentState.period,
        hasQuip: !!currentState.lastQuip,
        hasSeed: !!currentState.investigationSeed
    });
}

// ═══════════════════════════════════════════════════════════════
// DEBUG
// ═══════════════════════════════════════════════════════════════

export function debugShiversWeather() {
    return {
        currentState: { ...currentState },
        subscribed: !!weatherSubscription,
        shiversGenerating,
        lastShiversKey,
        shiversName: getShiversName()
    };
}
