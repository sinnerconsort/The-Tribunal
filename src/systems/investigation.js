/**
 * The Tribunal - Investigation Module v8.0
 * Perception-First Environmental Scanner with Integrated Shivers
 * 
 * REDESIGN v8.0:
 * - MERGED: newspaper-strip.js Shivers seed system absorbed directly
 * - GENRE-AWARE: "Shivers noticed:" → dynamic via getSkillName('shivers')
 * - GENRE-AWARE: Skill reaction prompts use getSkillPersonality() not "from Disco Elysium"
 * - GENRE-AWARE: Panel title, dateline, empty states all respect active profile
 * - WATCH-SYNCED: Dateline reads from watch.js (RP or real mode)
 * - WEATHER-SYNCED: getCurrentWeather() reads from weather-integration getState()
 * - NEW: AI Shivers quip toggle in settings
 * - NEW: Shivers quip tone adapts to genre
 * - REMOVED: Dynamic import of newspaper-strip.js
 * - REMOVED: "from Disco Elysium" in all prompts
 * - REMOVED: Hardcoded "LA REVACHOLIÈRE", "MARTINAISE, '51", "5 RÉAL"
 * - REMOVED: Hardcoded "detective" role labels
 * 
 * The flow:
 * 1. Shivers generates atmospheric quip + hidden seed (genre-aware)
 * 2. User presses INVESTIGATE → Perception scans (with optional seed hint)
 * 3. Discoveries appear as tappable cards
 * 4. User taps EXAMINE → Relevant skills react (genre-voiced)
 * 
 * @version 8.0.0
 */

import { SKILLS } from '../data/skills.js';
import { getSettings, getSkillLevel } from '../core/state.js';
import { getChatState, saveChatState } from '../core/persistence.js';
import { callAPI } from '../voice/api-helpers.js';
import { rollSkillCheck } from './dice.js';
import { getResearchPenalties } from './cabinet.js';
import { 
    NARRATOR_CONTEXTS, 
    DEFAULT_NARRATOR_SKILLS,
    getObjectIcon,
    getNarratorDifficulty
} from '../data/discovery-contexts.js';
import { 
    renderCaseLinkButton, 
    initCaseLinkHandlers, 
    processDiscoveriesForAutoLink 
} from './investigation-case-link.js';

// ═══════════════════════════════════════════════════════════════
// GENRE-AWARE IMPORTS (Lazy-loaded)
// ═══════════════════════════════════════════════════════════════

let _getSkillName = null;
let _getSkillPersonality = null;
let _getActiveProfile = null;
let _getProfileValue = null;

async function ensureGenreImports() {
    if (_getSkillName) return;
    try {
        const mod = await import('../data/setting-profiles.js');
        _getSkillName = mod.getSkillName || (() => null);
        _getSkillPersonality = mod.getSkillPersonality || (() => '');
        _getActiveProfile = mod.getActiveProfile || (() => null);
        _getProfileValue = mod.getProfileValue || (() => '');
        console.log('[Investigation] ✓ Genre imports loaded');
    } catch (e) {
        console.warn('[Investigation] Could not load setting-profiles:', e.message);
    }
}

// Fire-and-forget on module load
ensureGenreImports();

/** Get the genre-adapted name for Shivers (e.g. "The Signal" in cyberpunk) */
function getShiversName() {
    if (_getSkillName) {
        try { return _getSkillName('shivers', 'Shivers'); } catch { /* fall through */ }
    }
    return 'Shivers';
}

/** Get genre-aware personality text for a skill */
function getGenrePersonality(skillId) {
    if (_getSkillPersonality) {
        try { return _getSkillPersonality(skillId); } catch { /* fall through */ }
    }
    return SKILLS[skillId]?.personality || 'A skill voice';
}

/** Get the current genre profile's display name */
function getGenreProfileName() {
    if (_getActiveProfile) {
        try {
            const p = _getActiveProfile();
            return p?.name || 'Investigation';
        } catch { /* fall through */ }
    }
    return 'Investigation';
}

/** Get a value from the active genre profile */
function getGenreValue(key, fallback = '') {
    if (_getProfileValue) {
        try { return _getProfileValue(key, fallback); } catch { /* fall through */ }
    }
    return fallback;
}

// ═══════════════════════════════════════════════════════════════
// WEATHER INTEGRATION (Replaces newspaper-strip dependency)
// ═══════════════════════════════════════════════════════════════

let _weatherGetState = null;
let _weatherSubscribe = null;

async function ensureWeatherImports() {
    if (_weatherGetState) return;
    try {
        const mod = await import('./weather-integration.js');
        _weatherGetState = mod.getState || (() => ({}));
        _weatherSubscribe = mod.subscribe || null;
        console.log('[Investigation] ✓ Weather integration loaded');
    } catch (e) {
        console.warn('[Investigation] Weather integration not available:', e.message);
    }
}

ensureWeatherImports();

// ═══════════════════════════════════════════════════════════════
// WATCH INTEGRATION (For dateline sync)
// ═══════════════════════════════════════════════════════════════

let _getRPTime = null;
let _getWatchMode = null;
let _getRPWeather = null;

async function ensureWatchImports() {
    if (_getRPTime) return;
    try {
        const mod = await import('../ui/watch.js');
        _getRPTime = mod.getRPTime || (() => ({ hours: 14, minutes: 30 }));
        _getWatchMode = mod.getWatchMode || (() => 'rp');
        _getRPWeather = mod.getRPWeather || (() => 'clear');
        console.log('[Investigation] ✓ Watch integration loaded');
    } catch (e) {
        console.warn('[Investigation] Watch integration not available:', e.message);
    }
}

ensureWatchImports();

// ═══════════════════════════════════════════════════════════════
// SHIVERS SEED SYSTEM (Absorbed from newspaper-strip.js)
// ═══════════════════════════════════════════════════════════════

let investigationSeed = null;
let shiversGenerating = false;
let shiversDebounceTimer = null;
let lastShiversKey = null;

/** Get the current investigation seed (what Shivers noticed) */
export function getInvestigationSeed() {
    return investigationSeed;
}

/** Clear the investigation seed after Perception uses it */
export function clearInvestigationSeed() {
    console.log('[Investigation] Investigation seed consumed');
    investigationSeed = null;
}

// ═══════════════════════════════════════════════════════════════
// SHIVERS FALLBACK QUIPS (Absorbed from newspaper-strip.js)
// ═══════════════════════════════════════════════════════════════

const FALLBACK_QUIPS = {
    rain: {
        morning: "The rain arrived before dawn, patient and persistent. It drums against windows and pools in gutters, carrying secrets toward the sea.",
        afternoon: "Afternoon rain transforms the streets into mirrors. Each puddle reflects a different version of the world—older, sadder, more honest.",
        evening: "Evening rain falls heavier now, as if the sky has been saving up its grief. Light bleeds color across wet pavement.",
        night: "Night rain speaks in whispers against your collar. The streets empty of everyone except those with nowhere else to be."
    },
    storm: {
        morning: "The storm rolled in like an argument that's been building for days. Lightning illuminates the bones of this place—old architecture, cracked facades.",
        afternoon: "Thunder shakes windows in their frames. The air tastes electric, metallic. This storm has opinions about this place.",
        evening: "The evening storm turns violent. Rain comes sideways now, finding every crack in your resolve. Power flickers.",
        night: "Night storms reveal what daylight hides. In the flash of lightning, you see the truth of every alley, every shadow that shouldn't move but does."
    },
    snow: {
        morning: "Snow fell while you slept, erasing yesterday's footprints. The world looks almost innocent now, wrapped in white gauze. But you know what's underneath.",
        afternoon: "The afternoon snow falls thick and silent, muffling the usual arguments and machinery. Even the restless seem reverent.",
        evening: "Evening snow transforms the lights into halos. Everything moves slower, gentler. But the cold is serious—it seeps through boot soles and settles in joints.",
        night: "Snowfall at night carries its own silence, a pressure against the eardrums. Footsteps crunch too loud. Your breath ghosts away."
    },
    fog: {
        morning: "Morning fog hasn't lifted—it rarely does here. Shapes emerge from the grey and dissolve back into it. The familiar becomes uncertain.",
        afternoon: "Afternoon, and still the fog persists. Sound travels strangely—voices from unseen conversations, footsteps that could be anywhere.",
        evening: "Evening fog thickens, swallowing the lights whole. You navigate by memory and instinct. Everyone you pass could be anyone.",
        night: "Night fog makes the world into a maze of uncertain dimensions. You are walking through clouds that never rose."
    },
    clear: {
        morning: "Clear morning light arrives without mercy, exposing every stain, every crack, every poor decision made in darkness.",
        afternoon: "Clear skies press down with the weight of visibility. Nowhere to hide today—not for you, not for anyone.",
        evening: "The evening sky turns colors you don't have names for. Clear air carries sounds from far away—someone practicing, badly.",
        night: "Clear night sky means the stars are watching. They've been watching for longer than this place has existed."
    },
    overcast: {
        morning: "Grey morning, like most mornings here. The clouds are thinking, have been thinking for days. No weather, just waiting.",
        afternoon: "Overcast afternoon—the sky refuses to commit. No rain, no sun, just a pressing weight of grey.",
        evening: "Dusk comes early under heavy clouds. The distinction between day and night blurs at the edges.",
        night: "No moon tonight, no stars—just cloud cover like a lid on a pot. The darkness feels thicker than usual."
    },
    wind: {
        morning: "The morning wind carries voices from elsewhere—distant sounds, far-off cries, ropes snapping against masts.",
        afternoon: "Afternoon gusts tear through, scattering loose objects and regrets equally. Hold onto what matters.",
        evening: "Evening wind howls between buildings like grief finding its voice. Shutters bang. Somewhere, a door slams repeatedly.",
        night: "Night wind speaks in a language older than this place. It remembers what stood here before. It disapproves of what replaced it."
    }
};

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
// SHIVERS AI GENERATION (Absorbed from newspaper-strip.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Get scene context from SillyTavern chat for grounding Shivers quips
 */
function getShiversSceneContext() {
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (!ctx) return {};
        
        const result = {};
        
        // Last AI message — grab just the last ~300 chars for scene grounding
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
        
        if (ctx.groupId && ctx.groups) {
            const group = ctx.groups.find(g => g.id === ctx.groupId);
            if (group?.name) result.groupName = group.name;
        }
        
        return result;
    } catch (e) {
        console.warn('[Investigation] Failed to get scene context:', e.message);
        return {};
    }
}

/**
 * Build a genre-aware Shivers prompt for AI quip generation.
 * The voice adapts to the active genre: acid rain in cyberpunk, enchanted frost in fantasy, etc.
 */
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
  "quip": "2-3 sentences of atmospheric ${shiversName} prose. No more.",
  "seed": "A brief environmental detail that could be investigated — something ${shiversName} noticed that might be a clue, an anomaly, or simply interesting. 5-15 words. Examples: 'disturbed snow near the lamp post', 'a door left slightly ajar', 'scratch marks on the stone floor'. Make it specific to THIS scene and weather."
}

The "quip" is what the user sees. The "seed" is hidden metadata for the investigation system — it should be a concrete, discoverable detail that fits naturally with what ${shiversName} is describing.`;

    const weatherDesc = weather || 'overcast';
    const periodDesc = period || 'afternoon';
    const locationDesc = location || 'the area';

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
    
    if (sceneContext.sceneExcerpt) {
        userParts.push(`Recent scene: ${sceneContext.sceneExcerpt}`);
    }
    
    if (sceneContext.characterName) {
        userParts.push(`Character present: ${sceneContext.characterName}`);
    }
    
    if (sceneContext.groupName) {
        userParts.push(`Context: ${sceneContext.groupName}`);
    }
    
    userParts.push(`\nGenerate the ${shiversName} observation as JSON with "quip" and "seed" fields.`);

    return { system, user: userParts.join('\n') };
}

/**
 * Extract JSON from AI Shivers response
 */
function extractShiversJSON(response) {
    if (!response || typeof response !== 'string') return null;
    
    try {
        const parsed = JSON.parse(response.trim());
        if (parsed.quip) return parsed;
    } catch (e) { /* continue */ }
    
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

/**
 * Generate an AI Shivers quip + investigation seed.
 * Checks the aiShivers setting toggle before making API calls.
 */
async function generateShiversQuip(weather, period, location) {
    if (shiversGenerating) return null;
    
    // Check if extension is enabled
    const settings = getSettings();
    if (!settings?.enabled) return null;
    
    // Check AI Shivers toggle (default: true for backwards compat)
    const aiShiversEnabled = settings?.investigation?.aiShivers ?? true;
    if (!aiShiversEnabled) {
        // Use fallback seed instead
        investigationSeed = getFallbackSeed(weather);
        return null;
    }
    
    shiversGenerating = true;
    
    try {
        const { callAPIWithTokens } = await import('../voice/api-helpers.js');
        const sceneContext = getShiversSceneContext();
        
        console.log('[Investigation] Shivers context:', {
            weather, period, location,
            hasScene: !!sceneContext.sceneExcerpt,
            character: sceneContext.characterName || 'none'
        });
        
        const prompt = buildShiversPrompt(weather, period, location, sceneContext);
        const response = await callAPIWithTokens(prompt.system, prompt.user, 200);
        
        const parsed = extractShiversJSON(response);
        
        if (parsed && parsed.quip && parsed.quip.trim().length > 10) {
            console.log('[Investigation] ✓ Shivers AI generated:', {
                quip: parsed.quip.substring(0, 60) + '...',
                seed: parsed.seed || 'none'
            });
            
            if (parsed.seed) {
                investigationSeed = parsed.seed;
                console.log('[Investigation] Investigation seed stored:', parsed.seed);
            }
            
            return parsed.quip.trim();
        }
    } catch (e) {
        console.warn('[Investigation] Shivers AI generation failed, using fallback:', e.message);
    } finally {
        shiversGenerating = false;
    }
    
    // Fallback seed
    investigationSeed = getFallbackSeed(weather);
    return null;
}

// ═══════════════════════════════════════════════════════════════
// WEATHER EFFECTS ON INVESTIGATION
// ═══════════════════════════════════════════════════════════════

const WEATHER_EFFECTS = {
    rain: {
        revealTypes: ['tracks', 'evidence', 'reflections'],
        hideTypes: ['documents', 'fragile'],
        boostSkills: ['shivers', 'perception'],
        hinderSkills: ['hand_eye_coordination'],
        promptModifier: "Rain washes away concealment — tracks are visible in mud, reflections reveal hidden details. Paper items may be damaged or illegible."
    },
    snow: {
        revealTypes: ['footprints', 'blood', 'warm_objects'],
        hideTypes: ['small_items', 'ground_level'],
        boostSkills: ['shivers', 'visual_calculus'],
        hinderSkills: ['interfacing'],
        promptModifier: "Snow preserves footprints and blood perfectly but buries small ground-level items. Cold preserves evidence. Anything warm stands out."
    },
    fog: {
        revealTypes: ['sounds', 'emotions', 'psychic'],
        hideTypes: ['distant_objects', 'visual_details'],
        boostSkills: ['inland_empire', 'empathy', 'half_light'],
        hinderSkills: ['perception', 'visual_calculus'],
        promptModifier: "Fog limits visual discovery but heightens psychic and emotional sensitivity. Close details vivid, distant things invisible."
    },
    storm: {
        revealTypes: ['hidden_by_lightning', 'displaced_objects'],
        hideTypes: ['sounds', 'subtle_details'],
        boostSkills: ['half_light', 'shivers'],
        hinderSkills: ['composure', 'empathy'],
        promptModifier: "Lightning briefly reveals everything. Thunder drowns subtle sounds. Wind displaces lightweight evidence."
    },
    wind: {
        revealTypes: ['displaced_items', 'scent_trails'],
        hideTypes: ['lightweight_evidence', 'ash'],
        boostSkills: ['perception'],
        hinderSkills: ['composure'],
        promptModifier: "Wind scatters lightweight evidence from original positions. Follow the wind's trail."
    },
    clear: {
        revealTypes: [],
        hideTypes: [],
        boostSkills: [],
        hinderSkills: [],
        promptModifier: "Clear conditions — standard visibility, nothing weather-assisted."
    },
    overcast: {
        revealTypes: [],
        hideTypes: [],
        boostSkills: [],
        hinderSkills: [],
        promptModifier: "Overcast conditions — flat light, no shadows to hide in, no sun to reveal."
    }
};

function getCurrentWeather() {
    try {
        // Primary: weather-integration module
        if (_weatherGetState) {
            const state = _weatherGetState();
            if (state.weather) return state.weather;
        }
        // Fallback: watch RP weather
        if (_getRPWeather) {
            return _getRPWeather() || 'overcast';
        }
        return 'overcast';
    } catch (e) {
        return 'overcast';
    }
}

function getCurrentPeriod() {
    try {
        if (_weatherGetState) {
            const state = _weatherGetState();
            if (state.period) return state.period;
        }
        // Derive from watch
        if (_getRPTime && _getWatchMode) {
            const mode = _getWatchMode();
            const hour = mode === 'real' ? new Date().getHours() : _getRPTime().hours;
            if (hour >= 5 && hour < 7) return 'DAWN';
            if (hour >= 7 && hour < 12) return 'MORNING';
            if (hour >= 12 && hour < 17) return 'AFTERNOON';
            if (hour >= 17 && hour < 20) return 'EVENING';
            if (hour >= 20 && hour < 23) return 'NIGHT';
            return 'LATE_NIGHT';
        }
        return 'AFTERNOON';
    } catch (e) {
        return 'AFTERNOON';
    }
}

function getWeatherEffects(weather) {
    const key = normalizeWeatherKey(weather);
    return WEATHER_EFFECTS[key] || WEATHER_EFFECTS.overcast;
}

// ═══════════════════════════════════════════════════════════════
// DRAWER DICE LUCK (Optional integration with ledger-voices.js)
// ═══════════════════════════════════════════════════════════════

let luckModule = null;

function getInvestigationLuck(consume = true) {
    if (luckModule) {
        return luckModule.getInvestigationLuck(consume);
    }
    return { hasLuck: false, promptInjection: '', difficultyModifier: 0 };
}

function applyLuckToDifficulty(difficulty, luck) {
    if (luckModule) {
        return luckModule.applyLuckToDifficulty(difficulty, luck);
    }
    return difficulty;
}

// Try to load luck module (non-blocking)
import('./dice-ledger-integration.js')
    .then(m => {
        luckModule = m;
        console.log('[Investigation] Drawer dice luck integration loaded');
    })
    .catch(() => {
        console.log('[Investigation] Luck integration not available (optional)');
    });

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isOpen = false;
let sceneContext = '';
let lastResults = null;
let isInvestigating = false;
let currentDiscoveries = [];

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const STYLES = {
    panel: `
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        max-width: 480px;
        width: auto;
        background: 
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139,115,85,0.03) 2px,
                rgba(139,115,85,0.03) 4px
            ),
            linear-gradient(180deg, #f4ead5 0%, #e8dcc8 50%, #ddd0b8 100%);
        border: 2px solid #5c4d3d;
        border-radius: 2px;
        box-shadow: 
            3px 3px 0 #3d3225,
            0 8px 32px rgba(0,0,0,0.5);
        flex-direction: column;
        overflow: hidden;
        font-family: 'Times New Roman', Georgia, serif;
        color: #1a1612;
    `,
    panelMobile: `
        position: fixed !important;
        max-width: 94vw !important;
        width: 94vw !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        max-height: calc(100dvh - 100px) !important;
        overflow-y: auto !important;
    `,
    closeBtn: `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 0;
        background: #2a2318;
        color: #f4ead5;
        border: 1px solid #5c4d3d;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `,
    mastheadWrap: `
        position: relative;
    `,
    masthead: `
        padding: 24px 20px 16px;
        text-align: center;
        border-bottom: 3px double #2a2318;
        background: linear-gradient(180deg, #f4ead5 0%, #ebe0cc 100%);
    `,
    mastheadTitle: `
        font-size: 24px;
        font-weight: 900;
        font-family: 'Times New Roman', Georgia, serif;
        color: #1a1612;
        letter-spacing: 3px;
        text-transform: uppercase;
        text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
        margin: 0;
        line-height: 1;
    `,
    mastheadSub: `
        font-size: 10px;
        font-style: italic;
        color: #5c4d3d;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-top: 8px;
    `,
    dateline: `
        display: flex;
        justify-content: space-between;
        padding: 8px 20px;
        font-size: 10px;
        color: #5c4d3d;
        border-bottom: 1px solid #b8a88a;
        background: #ebe0cc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `,
    headline: `
        padding: 12px 20px;
        text-align: center;
        border-bottom: 1px solid #b8a88a;
        background: #ebe0cc;
    `,
    headlineText: `
        font-size: 14px;
        font-weight: bold;
        color: #1a1612;
        text-transform: uppercase;
        letter-spacing: 2px;
        line-height: 1.3;
        margin: 0;
    `,
    context: `
        padding: 12px 18px;
        background: rgba(0,0,0,0.02);
        border-bottom: 1px solid #b8a88a;
        font-size: 12px;
        font-style: italic;
        color: #3d3225;
        line-height: 1.5;
        max-height: 80px;
        overflow-y: auto;
    `,
    seedHint: `
        padding: 8px 18px;
        background: rgba(88, 130, 140, 0.08);
        border-bottom: 1px solid #b8a88a;
        font-size: 11px;
        font-style: italic;
        color: #4a6670;
        line-height: 1.4;
        display: flex;
        align-items: center;
        gap: 8px;
    `,
    actions: `
        display: flex;
        gap: 10px;
        padding: 10px 20px;
        border-bottom: 2px solid #2a2318;
        background: #ebe0cc;
    `,
    btnPrimary: `
        flex: 1;
        padding: 8px 16px;
        background: #2a2318;
        color: #f4ead5;
        border: none;
        font-size: 12px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 3px;
        text-transform: uppercase;
        cursor: pointer;
    `,
    btnSecondary: `
        padding: 8px 14px;
        background: #f4ead5;
        color: #2a2318;
        border: 1px solid #5c4d3d;
        font-size: 14px;
        font-family: 'Times New Roman', serif;
        cursor: pointer;
    `,
    results: `
        flex: 1;
        min-height: 120px;
        max-height: 350px;
        overflow-y: auto;
        padding: 0;
        background: linear-gradient(180deg, #f4ead5 0%, #ebe0cc 100%);
    `,
    empty: `
        text-align: center;
        padding: 20px 16px;
        color: #5c4d3d;
        font-style: italic;
        font-size: 13px;
    `,
    loading: `
        text-align: center;
        padding: 24px;
        color: #2a2318;
        font-style: italic;
    `,
    discoveryCard: `
        margin: 10px 12px;
        padding: 12px 14px;
        background: #f8f4e8;
        border: 1px solid #c8b8a0;
        border-left: 4px solid #a08060;
        box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
    `,
    discoveryHeader: `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    `,
    discoveryIcon: `
        font-size: 16px;
    `,
    discoveryName: `
        font-size: 12px;
        font-weight: bold;
        color: #705030;
        letter-spacing: 1px;
        text-transform: uppercase;
    `,
    discoveryType: `
        font-size: 9px;
        color: #8a7a60;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-left: auto;
        padding: 2px 6px;
        background: rgba(0,0,0,0.05);
        border-radius: 2px;
    `,
    discoveryPeek: `
        font-size: 12px;
        font-style: italic;
        color: #3d3225;
        line-height: 1.5;
        margin-bottom: 10px;
    `,
    discoveryActions: `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    `,
    discoveryBtn: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #5c4d3d;
        background: #2a2318;
        color: #f4ead5;
    `,
    discoveryBtnSecondary: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #b8a88a;
        background: #f4ead5;
        color: #3d3225;
    `,
    skillReaction: `
        margin: 4px 12px 4px 24px;
        padding: 8px 12px;
        border-left: 3px solid #2a2318;
        background: rgba(0,0,0,0.02);
        font-size: 12px;
        line-height: 1.5;
    `,
    skillName: `
        font-weight: bold;
        font-size: 11px;
        letter-spacing: 1px;
        margin-right: 4px;
    `,
    ticker: `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 18px;
        background: #2a2318;
        font-size: 10px;
        color: #c8b8a0;
        border-top: 2px solid #1a1612;
    `,
    tickerItem: `
        display: inline-flex;
        gap: 4px;
    `,
    tickerLabel: `
        color: #8a7a60;
        text-transform: uppercase;
        letter-spacing: 1px;
    `,
    tickerValue: `
        color: #e8dcc8;
    `,
    tickerSeparator: `
        color: #5c4d3d;
        margin: 0 4px;
    `,
    shiversQuip: `
        padding: 10px 18px;
        font-size: 12px;
        font-style: italic;
        color: #4a6670;
        line-height: 1.5;
        background: rgba(88, 130, 140, 0.06);
        border-bottom: 1px solid #b8a88a;
        text-align: center;
    `,
    shiversAttribution: `
        font-size: 9px;
        font-weight: bold;
        letter-spacing: 2px;
        color: #8a9a9a;
        text-transform: uppercase;
        margin-top: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `,
    shiversRefreshBtn: `
        background: none;
        border: 1px solid transparent;
        color: #6a8a8a;
        font-size: 13px;
        cursor: pointer;
        padding: 2px 5px;
        line-height: 1;
        font-family: 'Times New Roman', serif;
    `
};

// ═══════════════════════════════════════════════════════════════
// SETTING DETECTION
// ═══════════════════════════════════════════════════════════════

function detectSetting(sceneText) {
    const lowerScene = sceneText.toLowerCase();
    
    const settingKeywords = {
        fantasy: ['magic', 'spell', 'wizard', 'dragon', 'elf', 'dwarf', 'sword', 'castle', 'kingdom', 'enchanted', 'potion', 'mage', 'sorcerer', 'quest'],
        scifi: ['spaceship', 'android', 'robot', 'laser', 'cybernetic', 'neural', 'hologram', 'starship', 'alien', 'colony', 'cyberpunk', 'neon', 'augmented'],
        horror: ['blood', 'scream', 'terror', 'monster', 'darkness', 'corpse', 'ghost', 'haunted', 'nightmare', 'dread', 'flesh', 'bone', 'rot'],
        noir: ['detective', 'cigarette', 'rain', 'shadows', 'murder', 'case', 'investigation', 'alley', 'dame', 'fedora', 'whiskey', 'neon sign'],
        modern: ['phone', 'computer', 'car', 'office', 'apartment', 'city', 'street', 'building', 'internet', 'social media']
    };
    
    let bestSetting = 'modern';
    let bestScore = 0;
    
    for (const [setting, keywords] of Object.entries(settingKeywords)) {
        const score = keywords.filter(kw => lowerScene.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestSetting = setting;
        }
    }
    
    return bestSetting;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT BUILDING
// ═══════════════════════════════════════════════════════════════

function buildInvestigationContext(sceneText) {
    const ctx = window.SillyTavern?.getContext?.() ||
                 (typeof getContext === 'function' ? getContext() : null);
    
    const charName = ctx?.name2 || 'The Protagonist';
    const charDescription = ctx?.characters?.[ctx?.characterId]?.description || '';
    const detectedSetting = detectSetting(sceneText + ' ' + charDescription);
    
    const state = getChatState();
    const inventory = state?.inventory?.items || [];
    const inventoryNames = inventory.map(i => i.name).join(', ') || 'empty';
    
    const discovered = state?.investigation?.discoveredObjects || [];
    const discoveredNames = discovered.map(d => d.name).join(', ') || 'none yet';
    
    let characterContext = `${charName}`;
    if (charDescription) {
        const traits = extractCharacterTraits(charDescription);
        if (traits.length > 0) {
            characterContext += ` (${traits.join(', ')})`;
        }
    }
    
    return {
        charName,
        charDescription,
        characterContext,
        setting: detectedSetting,
        inventory: inventoryNames,
        discovered: discoveredNames,
        inventoryItems: inventory,
        discoveredItems: discovered
    };
}

function extractCharacterTraits(description) {
    const traits = [];
    const lowerDesc = description.toLowerCase();
    
    const creatureTypes = [
        'bat', 'cat', 'wolf', 'fox', 'dragon', 'demon', 'angel', 'vampire',
        'elf', 'dwarf', 'orc', 'human', 'android', 'robot', 'alien',
        'monster', 'creature', 'beast', 'spirit', 'ghost', 'skeleton',
        'fae', 'fairy', 'mermaid', 'werewolf', 'shapeshifter', 'elemental'
    ];
    
    for (const type of creatureTypes) {
        if (lowerDesc.includes(type)) {
            traits.push(type + ' creature');
            break;
        }
    }
    
    const features = [
        { keywords: ['wings', 'winged'], trait: 'has wings' },
        { keywords: ['tail'], trait: 'has a tail' },
        { keywords: ['claws'], trait: 'has claws' },
        { keywords: ['fur', 'furry'], trait: 'has fur' },
        { keywords: ['scales', 'scaled'], trait: 'has scales' },
        { keywords: ['horns'], trait: 'has horns' },
        { keywords: ['fangs', 'teeth'], trait: 'has fangs' },
        { keywords: ['antennae'], trait: 'has antennae' },
        { keywords: ['tentacles'], trait: 'has tentacles' },
        { keywords: ['feathers'], trait: 'has feathers' }
    ];
    
    for (const feature of features) {
        if (feature.keywords.some(kw => lowerDesc.includes(kw))) {
            traits.push(feature.trait);
        }
    }
    
    return traits;
}

// ═══════════════════════════════════════════════════════════════
// JSON EXTRACTION
// ═══════════════════════════════════════════════════════════════

function extractJSONObjects(text) {
    const objects = [];
    let depth = 0;
    let start = -1;
    
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (text[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                const jsonStr = text.substring(start, i + 1);
                try {
                    const obj = JSON.parse(jsonStr);
                    objects.push(obj);
                } catch (e) {
                    const repaired = repairJSON(jsonStr);
                    if (repaired) {
                        try {
                            objects.push(JSON.parse(repaired));
                        } catch (e2) {
                            console.log('[Investigation] JSON repair failed:', e2.message);
                        }
                    }
                }
                start = -1;
            }
        }
    }
    
    return objects;
}

function repairJSON(jsonStr) {
    let repaired = jsonStr;
    repaired = repaired.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}';
    }
    
    return repaired;
}

// ═══════════════════════════════════════════════════════════════
// DATELINE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build a genre-aware dateline string from watch state.
 * RP mode: shows RP time. Real mode: shows real date.
 */
function buildDatelineText() {
    try {
        const mode = _getWatchMode ? _getWatchMode() : 'real';
        const now = new Date();
        
        if (mode === 'rp' && _getRPTime) {
            const rp = _getRPTime();
            const h = rp.hours ?? 14;
            const m = rp.minutes ?? 0;
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            return `${h12}:${String(m).padStart(2, '0')} ${period}`;
        }
        
        // Real mode
        const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${dayName} ${month} ${now.getDate()}`;
    } catch (e) {
        return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    }
}

// ═══════════════════════════════════════════════════════════════
// UI CREATION
// ═══════════════════════════════════════════════════════════════

function createFAB() {
    const fab = document.createElement('div');
    fab.id = 'tribunal-investigation-fab';
    fab.className = 'ie-fab';
    fab.title = 'Investigation Scanner';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>';
    
    fab.style.display = 'flex';
    fab.style.top = '155px';
    fab.style.left = '10px';
    fab.style.zIndex = '9998';
    
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        if (fab.dataset.positionLocked === 'true') return;
        
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        fab.classList.add('dragging');
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.3s ease';
        fab.classList.remove('dragging');
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        
        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            setTimeout(() => { fab.dataset.justDragged = ''; }, 100);
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
    
    fab.addEventListener('click', (e) => {
        if (fab.dataset.justDragged === 'true') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        toggle();
    });
    
    return fab;
}

function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'tribunal-inv-panel';
    panel.style.cssText = STYLES.panel;
    panel.style.display = 'none';
    
    // Genre-aware panel title
    const shiversName = getShiversName();
    const datelineText = buildDatelineText();
    const weather = getCurrentWeather();
    const weatherLabel = normalizeWeatherKey(weather).toUpperCase();
    const period = getCurrentPeriod();
    
    // Build the initial Shivers quip
    const initialQuip = getShiversQuip(weather, period);
    
    panel.innerHTML = `
        <button id="tribunal-inv-close" style="${STYLES.closeBtn}">✕</button>
        
        <div style="${STYLES.masthead}">
            <div id="tribunal-inv-masthead-title" style="${STYLES.mastheadTitle}">ENVIRONMENTAL SCAN</div>
            <div style="${STYLES.mastheadSub}">❦ PERCEPTION SCANNER ❦</div>
        </div>
        
        <div id="tribunal-inv-dateline" style="${STYLES.dateline}">
            <span id="tribunal-inv-date">${datelineText}</span>
            <span id="tribunal-inv-weather-label">${weatherLabel}</span>
            <span id="tribunal-inv-period">${period}</span>
        </div>
        
        <div id="tribunal-inv-shivers-quip" style="${STYLES.shiversQuip}">
            <div id="tribunal-inv-quip-text">${initialQuip}</div>
            <div style="${STYLES.shiversAttribution}">
                <span id="tribunal-inv-shivers-attr">— ${shiversName.toUpperCase()} SPEAKS</span>
                <button id="tribunal-inv-shivers-refresh" style="${STYLES.shiversRefreshBtn}" title="${shiversName} speaks again...">↻</button>
            </div>
        </div>
        
        <div style="${STYLES.headline}">
            <div style="${STYLES.headlineText}">— ENVIRONMENTAL REPORT —</div>
        </div>
        
        <div id="tribunal-inv-context" style="${STYLES.context}">
            The scene awaits your investigation...
        </div>
        
        <div id="tribunal-inv-seed" style="${STYLES.seedHint}; display: none;">
            <span style="color: #5a8a8a;">◈</span>
            <span id="tribunal-inv-seed-text">${shiversName} noticed something...</span>
        </div>
        
        <div style="${STYLES.actions}">
            <button id="tribunal-inv-scan" style="${STYLES.btnPrimary}">⬤ INVESTIGATE</button>
            <button id="tribunal-inv-rescan" style="${STYLES.btnSecondary}">↻</button>
        </div>
        
        <div id="tribunal-inv-results" style="${STYLES.results}">
            <div style="${STYLES.empty}">Your skills await your command...</div>
        </div>
        
        <div id="tribunal-inv-ticker" style="${STYLES.ticker}">
            <span style="${STYLES.tickerItem}">
                <span style="${STYLES.tickerLabel}">SCAN:</span>
                <span style="${STYLES.tickerValue}">AWAITING</span>
            </span>
        </div>
    `;
    
    panel.querySelector('#tribunal-inv-close').addEventListener('click', close);
    panel.querySelector('#tribunal-inv-scan').addEventListener('click', doInvestigate);
    panel.querySelector('#tribunal-inv-rescan').addEventListener('click', doInvestigate);
    
    // Wire Shivers refresh button
    const refreshBtn = panel.querySelector('#tribunal-inv-shivers-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            refreshBtn.style.opacity = '0.5';
            refreshBtn.style.pointerEvents = 'none';
            lastShiversKey = null;
            refreshShiversQuip();
            setTimeout(() => {
                refreshBtn.style.opacity = '1';
                refreshBtn.style.pointerEvents = 'auto';
            }, 2000);
        });
    }
    
    return panel;
}

// ═══════════════════════════════════════════════════════════════
// SHIVERS QUIP DISPLAY & REFRESH
// ═══════════════════════════════════════════════════════════════

/**
 * Refresh the Shivers quip in the investigation panel.
 * Shows fallback quip immediately, then replaces with AI-generated version.
 */
function refreshShiversQuip() {
    const quipEl = document.getElementById('tribunal-inv-quip-text');
    if (!quipEl) return;
    
    const weather = getCurrentWeather();
    const period = getCurrentPeriod();
    const location = _weatherGetState?.()?.location || null;
    
    // Dedup
    const shiversKey = `${weather}|${period}|${location}`;
    if (shiversKey === lastShiversKey) return;
    lastShiversKey = shiversKey;
    
    // Show fallback immediately
    const fallbackQuip = getShiversQuip(weather, period);
    quipEl.textContent = fallbackQuip;
    
    // Set fallback seed
    investigationSeed = getFallbackSeed(weather);
    
    // Debounce AI generation
    if (shiversDebounceTimer) clearTimeout(shiversDebounceTimer);
    
    shiversDebounceTimer = setTimeout(async () => {
        quipEl.style.opacity = '0.5';
        
        const aiQuip = await generateShiversQuip(weather, period, location);
        
        if (aiQuip) {
            quipEl.style.opacity = '0.5';
            setTimeout(() => {
                quipEl.textContent = aiQuip;
                quipEl.style.opacity = '1';
            }, 300);
        } else {
            quipEl.style.opacity = '1';
        }
    }, 500);
}

/**
 * Update the panel's dynamic elements (dateline, weather, Shivers name)
 */
function updatePanelDynamics() {
    // Update dateline
    const dateEl = document.getElementById('tribunal-inv-date');
    if (dateEl) dateEl.textContent = buildDatelineText();
    
    const weatherLabel = document.getElementById('tribunal-inv-weather-label');
    if (weatherLabel) weatherLabel.textContent = normalizeWeatherKey(getCurrentWeather()).toUpperCase();
    
    const periodEl = document.getElementById('tribunal-inv-period');
    if (periodEl) periodEl.textContent = getCurrentPeriod();
    
    // Update Shivers attribution
    const attrEl = document.getElementById('tribunal-inv-shivers-attr');
    if (attrEl) attrEl.textContent = `— ${getShiversName().toUpperCase()} SPEAKS`;
    
    const refreshBtn = document.getElementById('tribunal-inv-shivers-refresh');
    if (refreshBtn) refreshBtn.title = `${getShiversName()} speaks again...`;
}

// ═══════════════════════════════════════════════════════════════
// FAB VISIBILITY
// ═══════════════════════════════════════════════════════════════

function updateInvestigationFABVisibility() {
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!fab) return;
    
    if (fab.dataset.settingsHidden === 'true') {
        fab.style.display = 'none';
        return;
    }
    
    const settings = getSettings();
    const showFab = settings?.investigation?.showFab ?? true;
    
    if (!showFab) {
        fab.dataset.settingsHidden = 'true';
        fab.style.display = 'none';
        return;
    }
    
    fab.style.display = 'flex';
}

function setupFABVisibilityWatcher() {
    const observer = new MutationObserver(() => {
        setTimeout(updateInvestigationFABVisibility, 100);
    });
    
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
    });
    
    setTimeout(updateInvestigationFABVisibility, 500);
    setInterval(updateInvestigationFABVisibility, 5000);
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

function open() {
    const panel = document.getElementById('tribunal-inv-panel');
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!panel) return;
    
    const isMobile = window.innerWidth <= 1000;
    
    if (isMobile) {
        const topBar = document.getElementById('top-settings-holder');
        const topBarHeight = topBar ? topBar.offsetHeight : 60;
        const topPosition = topBarHeight + 10;
        
        panel.style.cssText = STYLES.panel + STYLES.panelMobile;
        panel.style.top = topPosition + 'px';
        panel.style.display = 'flex';
    } else {
        panel.style.cssText = STYLES.panel;
        panel.style.top = '100px';
        panel.style.left = '70px';
        panel.style.display = 'flex';
    }
    
    isOpen = true;
    
    if (fab) fab.classList.add('ie-fab-active');
    
    // Update dynamic elements on open
    updatePanelDynamics();
    updateContextDisplay();
    updateSeedDisplay();
    refreshShiversQuip();
}

function close() {
    const panel = document.getElementById('tribunal-inv-panel');
    const fab = document.getElementById('tribunal-investigation-fab');
    
    if (panel) {
        panel.style.display = 'none';
        isOpen = false;
    }
    
    if (fab) fab.classList.remove('ie-fab-active');
}

function toggle() {
    if (isOpen) {
        close();
    } else {
        open();
    }
}

// ═══════════════════════════════════════════════════════════════
// SCENE CONTEXT
// ═══════════════════════════════════════════════════════════════

export function updateSceneContext(text) {
    if (text && typeof text === 'string') {
        sceneContext = text;
        updateContextDisplay();
    }
}

function updateContextDisplay() {
    const el = document.getElementById('tribunal-inv-context');
    if (el && sceneContext) {
        const truncated = sceneContext.length > 250 
            ? sceneContext.substring(0, 250) + '...' 
            : sceneContext;
        el.textContent = truncated;
    } else if (el) {
        el.textContent = 'The scene awaits your investigation...';
    }
}

function updateSeedDisplay() {
    const seedEl = document.getElementById('tribunal-inv-seed');
    const seedTextEl = document.getElementById('tribunal-inv-seed-text');
    if (!seedEl || !seedTextEl) return;
    
    const seed = getInvestigationSeed();
    if (seed) {
        const shiversName = getShiversName();
        seedTextEl.textContent = `${shiversName} noticed: "${seed}"`;
        seedEl.style.display = 'flex';
    } else {
        seedEl.style.display = 'none';
    }
}

export function getSceneContext() {
    return sceneContext;
}

// ═══════════════════════════════════════════════════════════════
// PERCEPTION-FIRST SCAN
// ═══════════════════════════════════════════════════════════════

async function generatePerceptionScan(sceneText) {
    const context = buildInvestigationContext(sceneText);
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    // Get Shivers investigation seed (if available) and consume it
    const shiversSeed = getInvestigationSeed();
    clearInvestigationSeed();
    
    // Check for drawer dice luck
    const luck = getInvestigationLuck(true);
    const luckPrompt = luck.hasLuck ? luck.promptInjection : '';
    
    // Roll Perception check
    let perceptionDifficulty = 10;
    if (weatherEffects.boostSkills.includes('perception')) {
        perceptionDifficulty -= 2;
    } else if (weatherEffects.hinderSkills.includes('perception')) {
        perceptionDifficulty += 2;
    }
    if (luck.hasLuck) {
        perceptionDifficulty = applyLuckToDifficulty(perceptionDifficulty, luck);
    }
    
    const perceptionLevel = getSkillLevel('perception');
    const perceptionCheck = rollSkillCheck(perceptionLevel, perceptionDifficulty);
    
    // Genre-aware Shivers name for prompt
    const shiversName = getShiversName();
    
    console.log('[Investigation] Perception check:', {
        level: perceptionLevel,
        difficulty: perceptionDifficulty,
        success: perceptionCheck.success,
        roll: perceptionCheck.roll,
        total: perceptionCheck.total,
        seed: shiversSeed || 'none',
        weather
    });
    
    // Build the seed injection for prompt
    let seedInjection = '';
    if (shiversSeed) {
        seedInjection = `\n${shiversName.toUpperCase()} NOTICED: The environment recently drew attention to: "${shiversSeed}". Perception may follow up on this detail, investigate it further, or discover something else entirely. This is a hint, not a requirement.`;
    }

    const systemPrompt = `You are PERCEPTION — the skill of noticing, observing, and finding. You scan environments for concrete, discoverable OBJECTS and DETAILS.
${luckPrompt}
WEATHER CONDITIONS: ${weather}
${weatherEffects.promptModifier}

CRITICAL CHARACTER INFO:
- Player Character: ${context.characterContext}
- DO NOT confuse the character's body parts/features with environmental objects!
- If the character IS a bat creature, "bat" references are about THEM, not a weapon
- If the character has wings, those are THEIR wings, not something to discover

SETTING: ${context.setting}
CURRENT INVENTORY: ${context.inventory}
PREVIOUSLY DISCOVERED: ${context.discovered}
${seedInjection}

PERCEPTION CHECK: ${perceptionCheck.success ? 'SUCCESS' : 'FAILED'} (rolled ${perceptionCheck.total} vs ${perceptionDifficulty})
${perceptionCheck.isBoxcars ? '⚡ CRITICAL SUCCESS — Find something exceptional!' : ''}
${perceptionCheck.isSnakeEyes ? '💀 CRITICAL FAILURE — Miss obvious things, find something misleading.' : ''}

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "environment": "1-2 sentence atmospheric description of what Perception notices about the PLACE",
  "discoveries": [
    {
      "name": "THE DRAMATIC NAME",
      "type": "evidence|weapon|consumable|container|document|clothing|key_item|misc",
      "peek": "A brief, intriguing teaser of what this object is. 10-20 words. Make it want to be examined.",
      "location": "where in the scene",
      "canCollect": true
    }
  ],
  "ticker": [
    { "type": "AVAILABLE|LOST|WANTED|DANGER", "value": "brief status note" }
  ]
}

RULES:
- ${perceptionCheck.success ? '2-4 discoveries' : '1-2 discoveries (failed check = fewer finds)'}
- Give objects dramatic names: THE + DESCRIPTOR + NOUN
- "peek" should intrigue without revealing everything — save details for EXAMINE
- Match the ${context.setting} setting
- canCollect: false for furniture/large items, true for portable items
- NEVER include the player character's body as a discoverable object
- Weather affects what you find: ${weatherEffects.revealTypes.length > 0 ? 'easier to find: ' + weatherEffects.revealTypes.join(', ') : 'no weather bonus'}`;

    const userPrompt = `Scene to scan:
"${sceneText.substring(0, 1200)}"

Generate the Perception scan as JSON. ${context.charName} ${context.characterContext ? 'is a ' + context.characterContext : ''} - don't confuse their features with objects!`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parsePerceptionResponse(response, perceptionCheck, context, weather);
    } catch (error) {
        console.error('[Investigation] Perception scan failed:', error);
        throw error;
    }
}

function parsePerceptionResponse(response, perceptionCheck, context, weather) {
    console.log('[Investigation] Parsing Perception response...');
    
    const jsonObjects = extractJSONObjects(response);
    
    if (jsonObjects.length > 0) {
        const data = jsonObjects[0];
        console.log('[Investigation] Successfully parsed JSON');
        
        const result = {
            environment: data.environment || '',
            discoveries: [],
            ticker: [],
            perceptionCheck,
            weather
        };
        
        if (data.discoveries && Array.isArray(data.discoveries)) {
            for (const disc of data.discoveries) {
                const discovery = {
                    id: 'disc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    name: disc.name || 'THE UNKNOWN OBJECT',
                    type: disc.type || 'misc',
                    peek: disc.peek || 'Something worth examining...',
                    location: disc.location || 'somewhere in the scene',
                    canCollect: disc.canCollect ?? true,
                    examined: false,
                    collected: false,
                    skillReactions: [],
                    weather,
                    timestamp: Date.now()
                };
                result.discoveries.push(discovery);
            }
        }
        
        currentDiscoveries = result.discoveries;
        storeDiscoveredObjects(result.discoveries, context);
        
        if (data.ticker && Array.isArray(data.ticker)) {
            for (const item of data.ticker) {
                result.ticker.push({
                    type: (item.type || 'available').toUpperCase(),
                    value: item.value || ''
                });
            }
        }
        
        if (result.ticker.length === 0) {
            result.ticker.push({ 
                type: 'SCAN', 
                value: perceptionCheck.success ? 'COMPLETE' : 'PARTIAL' 
            });
        }
        
        return result;
    }
    
    console.log('[Investigation] JSON parse failed, returning minimal result');
    return {
        environment: 'The scene reveals little to your searching eyes.',
        discoveries: [],
        ticker: [{ type: 'SCAN', value: 'INCOMPLETE' }],
        perceptionCheck,
        weather
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN INVESTIGATION FUNCTION
// ═══════════════════════════════════════════════════════════════

async function doInvestigate() {
    const resultsEl = document.getElementById('tribunal-inv-results');
    const scanBtn = document.getElementById('tribunal-inv-scan');
    
    if (!resultsEl || !scanBtn) return;
    
    if (isInvestigating) {
        console.log('[Investigation] Already investigating...');
        return;
    }
    
    if (!sceneContext || sceneContext.trim().length === 0) {
        resultsEl.innerHTML = `<div style="${STYLES.empty}">
            No scene to investigate. Send a message first.
        </div>`;
        return;
    }
    
    isInvestigating = true;
    scanBtn.disabled = true;
    scanBtn.textContent = '⏳ SCANNING...';
    resultsEl.innerHTML = `<div style="${STYLES.loading}">
        <div style="font-size: 16px; margin-bottom: 8px;">◉ ◉ ◉</div>
        <div style="font-size: 11px; letter-spacing: 2px;">PERCEPTION EXTENDING...</div>
    </div>`;
    
    // Hide seed hint while scanning
    const seedEl = document.getElementById('tribunal-inv-seed');
    if (seedEl) seedEl.style.display = 'none';
    
    try {
        const investigation = await generatePerceptionScan(sceneContext);
        showDiscoveryResults(investigation);
        
        console.log('[Investigation] Perception scan complete:', {
            discoveries: investigation.discoveries.length,
            success: investigation.perceptionCheck.success
        });
        
    } catch (error) {
        console.error('[Investigation] Failed:', error);
        resultsEl.innerHTML = `<div style="${STYLES.empty}">
            INVESTIGATION FAILED: ${error.message || 'Unknown error'}
        </div>`;
    } finally {
        isInvestigating = false;
        scanBtn.disabled = false;
        scanBtn.textContent = '⬤ INVESTIGATE';
    }
}

// ═══════════════════════════════════════════════════════════════
// DISCOVERY CARD DISPLAY
// ═══════════════════════════════════════════════════════════════

function showDiscoveryResults(investigation) {
    const resultsEl = document.getElementById('tribunal-inv-results');
    const tickerEl = document.getElementById('tribunal-inv-ticker');
    
    if (!resultsEl) return;
    
    lastResults = investigation;
    let html = '';
    
    const checkIcon = investigation.perceptionCheck.isBoxcars ? '⚡' : 
                      investigation.perceptionCheck.isSnakeEyes ? '💀' :
                      investigation.perceptionCheck.success ? '◆' : '◇';
    const checkText = investigation.perceptionCheck.success ? 'SUCCESS' : 'FAILED';
    
    html += `<div style="padding: 8px 18px; background: rgba(0,0,0,0.03); border-bottom: 1px solid #c8b8a0; font-size: 10px; color: #5c4d3d; letter-spacing: 1px;">
        PERCEPTION ${checkIcon} ${checkText} • ${normalizeWeatherKey(investigation.weather).toUpperCase()}
    </div>`;
    
    if (investigation.environment) {
        html += `<div style="padding: 12px 18px; font-size: 13px; line-height: 1.55; font-style: italic; color: #2a2318; border-bottom: 1px solid #c8b8a0;">
            ${investigation.environment}
        </div>`;
    }
    
    if (investigation.discoveries.length === 0) {
        html += `<div style="${STYLES.empty}">
            Perception finds nothing of note. Perhaps look again later.
        </div>`;
    } else {
        for (const disc of investigation.discoveries) {
            const icon = getObjectIcon(disc.name);
            const typeColor = disc.type === 'evidence' ? '#8b4513' : 
                              disc.type === 'weapon' ? '#a03030' : 
                              disc.type === 'key_item' ? '#806000' : '#705030';
            
            html += `
                <div class="discovery-card" data-discovery-id="${disc.id}" style="${STYLES.discoveryCard}">
                    <div style="${STYLES.discoveryHeader}">
                        <span style="${STYLES.discoveryIcon}">${icon}</span>
                        <span style="${STYLES.discoveryName}">${disc.name}</span>
                        <span style="${STYLES.discoveryType}; color: ${typeColor};">${disc.type}</span>
                    </div>
                    <div style="${STYLES.discoveryPeek}">${disc.peek}</div>
                    <div style="${STYLES.discoveryActions}">
                    <button class="discovery-examine-btn" data-id="${disc.id}" style="${STYLES.discoveryBtn}">EXAMINE</button>
        ${disc.canCollect ? `<button class="discovery-collect-btn" data-id="${disc.id}" style="${STYLES.discoveryBtnSecondary}">COLLECT</button>` : ''}
        ${renderCaseLinkButton(disc)}
    </div>
                    <div class="discovery-reactions" data-id="${disc.id}"></div>
                </div>
            `;
        }
    }
    
    resultsEl.innerHTML = html;
    
    resultsEl.querySelectorAll('.discovery-examine-btn').forEach(btn => {
        btn.addEventListener('click', () => handleExamine(btn.dataset.id));
    });
    
    resultsEl.querySelectorAll('.discovery-collect-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCollect(btn.dataset.id));
    });

    initCaseLinkHandlers(resultsEl, investigation.discoveries);

    const autoLinkResults = processDiscoveriesForAutoLink(investigation.discoveries, {
        autoLink: true
    });
    console.log('[Investigation] Case linking results:', autoLinkResults);
    
    if (tickerEl && investigation.ticker.length > 0) {
        const tickerItems = investigation.ticker.map((item, i) => {
            const separator = i < investigation.ticker.length - 1 
                ? `<span style="${STYLES.tickerSeparator}">◆</span>` 
                : '';
            return `
                <span style="${STYLES.tickerItem}">
                    <span style="${STYLES.tickerLabel}">${item.type}:</span>
                    <span style="${STYLES.tickerValue}">${item.value}</span>
                </span>
                ${separator}
            `;
        }).join('');
        
        tickerEl.innerHTML = tickerItems;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXAMINE HANDLER (Skill Drill-Down) — Genre-Aware
// ═══════════════════════════════════════════════════════════════

async function handleExamine(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery) return;
    
    const reactionsEl = document.querySelector(`.discovery-reactions[data-id="${discoveryId}"]`);
    const examineBtn = document.querySelector(`.discovery-examine-btn[data-id="${discoveryId}"]`);
    if (!reactionsEl || !examineBtn) return;
    
    examineBtn.disabled = true;
    examineBtn.textContent = '...';
    
    reactionsEl.innerHTML = `<div style="padding: 8px 12px; font-size: 11px; color: #5c4d3d; font-style: italic;">Skills examining...</div>`;
    
    try {
        const reactions = await generateSkillReactions(discovery, sceneContext);
        discovery.examined = true;
        discovery.skillReactions = reactions;
        
        let reactionHtml = '';
        for (const reaction of reactions) {
            const skill = SKILLS[reaction.skillId];
            const borderColor = skill?.color || '#2a2318';
            const checkIcon = reaction.checkResult?.isBoxcars ? ' ⚡' : 
                              reaction.checkResult?.isSnakeEyes ? ' 💀' :
                              reaction.checkResult?.success ? ' ◆' : ' ◇';
            
            reactionHtml += `
                <div style="${STYLES.skillReaction} border-left-color: ${borderColor};">
                    <span style="${STYLES.skillName} color: ${borderColor};">${reaction.signature}${checkIcon} —</span>
                    ${reaction.content}
                </div>
            `;
        }
        
        reactionHtml += `
            <button class="dig-deeper-btn" data-id="${discoveryId}" style="${STYLES.discoveryBtnSecondary}; margin: 8px 12px 4px 24px; font-size: 9px;">
                DIG DEEPER (more voices)
            </button>
        `;
        
        reactionsEl.innerHTML = reactionHtml;
        
        reactionsEl.querySelector('.dig-deeper-btn')?.addEventListener('click', () => handleDigDeeper(discoveryId));
        
        examineBtn.textContent = 'EXAMINED';
        examineBtn.disabled = true;
        examineBtn.style.opacity = '0.6';
        
    } catch (error) {
        console.error('[Investigation] Examine failed:', error);
        reactionsEl.innerHTML = `<div style="padding: 8px 12px; font-size: 11px; color: #8b4513;">Skills failed to react.</div>`;
        examineBtn.textContent = 'EXAMINE';
        examineBtn.disabled = false;
    }
}

/**
 * Generate skill reactions — NOW GENRE-AWARE.
 * Uses getGenrePersonality() instead of hardcoded "from Disco Elysium".
 */
async function generateSkillReactions(discovery, sceneText) {
    const skillMapping = {
        evidence: ['visual_calculus', 'logic', 'perception'],
        weapon: ['hand_eye_coordination', 'half_light', 'physical_instrument'],
        document: ['encyclopedia', 'rhetoric', 'logic'],
        clothing: ['drama', 'composure', 'empathy'],
        consumable: ['electrochemistry', 'endurance', 'perception'],
        container: ['perception', 'interfacing', 'half_light'],
        key_item: ['inland_empire', 'shivers', 'conceptualization'],
        misc: ['perception', 'inland_empire', 'encyclopedia']
    };
    
    const relevantSkills = skillMapping[discovery.type] || skillMapping.misc;
    const selectedSkillIds = relevantSkills.slice(0, 2);
    
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    const reactions = [];
    
    for (const skillId of selectedSkillIds) {
        const skill = SKILLS[skillId];
        if (!skill) continue;
        
        const level = getSkillLevel(skillId);
        
        let difficulty = getNarratorDifficulty('secondary');
        if (weatherEffects.boostSkills.includes(skillId)) {
            difficulty -= 2;
        } else if (weatherEffects.hinderSkills.includes(skillId)) {
            difficulty += 2;
        }
        
        const checkResult = rollSkillCheck(level, difficulty);
        
        // Genre-aware personality
        const personality = getGenrePersonality(skillId);

        const systemPrompt = `You are ${skill.signature}. React to a specific discovered object.
        
Your personality: ${personality}

Respond with ONE sentence (max 30 words). React to the object based on your perspective:
- ${checkResult.success ? 'You notice something useful or insightful.' : 'You miss something or misinterpret it.'}
- Stay in character. Be evocative but brief.
- Do NOT repeat the object name in your response.`;

        const userPrompt = `Object: ${discovery.name}
Type: ${discovery.type}
Description: ${discovery.peek}
Scene context: ${sceneText.substring(0, 300)}

React as ${skill.signature}:`;

        try {
            const response = await callAPI(systemPrompt, userPrompt);
            reactions.push({
                skillId,
                signature: skill.signature,
                content: response.trim().substring(0, 200),
                checkResult
            });
        } catch (e) {
            reactions.push({
                skillId,
                signature: skill.signature,
                content: checkResult.success 
                    ? 'Something about this... I should look closer.'
                    : 'I\'m not sure what to make of this.',
                checkResult
            });
        }
    }
    
    return reactions;
}

/**
 * Handle "DIG DEEPER" — Genre-Aware
 */
async function handleDigDeeper(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery) return;
    
    const reactionsEl = document.querySelector(`.discovery-reactions[data-id="${discoveryId}"]`);
    const digBtn = reactionsEl?.querySelector('.dig-deeper-btn');
    if (!digBtn) return;
    
    digBtn.disabled = true;
    digBtn.textContent = '...';
    
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    try {
        const usedSkills = discovery.skillReactions.map(r => r.skillId);
        const allSkills = Object.keys(SKILLS).filter(id => !usedSkills.includes(id));
        const newSkillIds = allSkills.sort(() => Math.random() - 0.5).slice(0, 2);
        
        for (const skillId of newSkillIds) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getSkillLevel(skillId);
            
            let difficulty = getNarratorDifficulty('tertiary');
            if (weatherEffects.boostSkills.includes(skillId)) {
                difficulty -= 2;
            } else if (weatherEffects.hinderSkills.includes(skillId)) {
                difficulty += 2;
            }
            
            const checkResult = rollSkillCheck(level, difficulty);
            
            // Genre-aware personality
            const personality = getGenrePersonality(skillId);
            
            const systemPrompt = `You are ${skill.signature}. React to a discovered object with fresh perspective.
            
Your personality: ${personality}

Respond with ONE sentence (max 30 words). ${checkResult.success ? 'Find something others missed.' : 'Offer a confused or wrong take.'}`;

            const userPrompt = `Object: ${discovery.name} (${discovery.type})
React as ${skill.signature}:`;

            try {
                const response = await callAPI(systemPrompt, userPrompt);
                
                const reaction = {
                    skillId,
                    signature: skill.signature,
                    content: response.trim().substring(0, 200),
                    checkResult
                };
                discovery.skillReactions.push(reaction);
                
                const borderColor = skill.color || '#2a2318';
                const checkIcon = checkResult.isBoxcars ? ' ⚡' : 
                                  checkResult.isSnakeEyes ? ' 💀' :
                                  checkResult.success ? ' ◆' : ' ◇';
                
                const reactionDiv = document.createElement('div');
                reactionDiv.style.cssText = `${STYLES.skillReaction} border-left-color: ${borderColor};`;
                reactionDiv.innerHTML = `
                    <span style="${STYLES.skillName} color: ${borderColor};">${reaction.signature}${checkIcon} —</span>
                    ${reaction.content}
                `;
                
                digBtn.parentNode.insertBefore(reactionDiv, digBtn);
            } catch (e) {
                console.warn('[Investigation] Dig deeper failed for', skillId);
            }
        }
        
        digBtn.textContent = 'DIG DEEPER';
        digBtn.disabled = false;
        
        if (discovery.skillReactions.length >= 6) {
            digBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('[Investigation] Dig deeper failed:', error);
        digBtn.textContent = 'DIG DEEPER';
        digBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// COLLECT HANDLER
// ═══════════════════════════════════════════════════════════════

function handleCollect(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery || !discovery.canCollect) return;
    
    const collectBtn = document.querySelector(`.discovery-collect-btn[data-id="${discoveryId}"]`);
    if (!collectBtn) return;
    
    discovery.collected = true;
    collectBtn.textContent = '✓ COLLECTED';
    collectBtn.disabled = true;
    collectBtn.style.opacity = '0.6';
    collectBtn.style.background = '#2a3a2a';
    collectBtn.style.borderColor = '#5a7a5a';
    collectBtn.style.color = '#8ab88a';
    
    const item = collectItem(discovery.name);
    if (item) {
        console.log('[Investigation] Collected:', discovery.name);
        if (typeof toastr !== 'undefined') {
            toastr.success(`Added "${discovery.name}" to inventory`, 'Item Collected');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DISCOVERED OBJECTS STORAGE
// ═══════════════════════════════════════════════════════════════

function storeDiscoveredObjects(discoveries, context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.investigation) {
        state.investigation = {
            discoveredObjects: [],
            collectedItems: []
        };
    }
    
    for (const disc of discoveries) {
        if (!disc || !disc.name) continue;
        
        const existing = state.investigation.discoveredObjects.find(
            d => d.name === disc.name
        );
        
        if (!existing) {
            state.investigation.discoveredObjects.push({
                name: disc.name,
                type: disc.type,
                peek: disc.peek,
                canCollect: disc.canCollect,
                location: disc.location,
                weather: disc.weather,
                discoveredAt: disc.timestamp
            });
            
            console.log('[Investigation] Stored discovered object:', disc.name);
        }
    }
    
    saveChatState();
}

export function getDiscoveredObjects() {
    const state = getChatState();
    return state?.investigation?.discoveredObjects || [];
}

export function collectItem(objectName) {
    const state = getChatState();
    if (!state?.investigation?.discoveredObjects) return null;
    
    const index = state.investigation.discoveredObjects.findIndex(
        d => d.name === objectName && d.canCollect
    );
    
    if (index === -1) return null;
    
    const item = state.investigation.discoveredObjects[index];
    
    state.investigation.discoveredObjects.splice(index, 1);
    
    if (!state.investigation.collectedItems) {
        state.investigation.collectedItems = [];
    }
    state.investigation.collectedItems.push({
        ...item,
        collectedAt: Date.now()
    });
    
    // Also add to actual inventory
    if (!state.inventory) state.inventory = { carried: [], stash: {}, money: 0 };
    if (!state.inventory.carried) state.inventory.carried = [];
    
    const CONSUMABLE_TYPES = ['consumable', 'food', 'medicine', 'drug', 'alcohol', 'cigarette'];
    const invType = item.type || 'misc';
    const category = CONSUMABLE_TYPES.includes(invType) ? 'consumable' : 'misc';
    
    const alreadyInInventory = state.inventory.carried.some(
        i => i.name?.toLowerCase() === objectName.toLowerCase()
    );
    
    if (!alreadyInInventory) {
        state.inventory.carried.push({
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: objectName,
            type: invType,
            category: category,
            quantity: 1,
            description: item.peek || null,
            source: 'investigation',
            context: item.peek || item.location || null,
            addedAt: Date.now()
        });
        console.log('[Investigation] Added to inventory:', objectName);
        
        try {
            document.dispatchEvent(new CustomEvent('tribunal:inventoryChanged', {
                detail: { source: 'investigation', item: objectName }
            }));
        } catch (e) { /* silent */ }
    }
    
    saveChatState();
    console.log('[Investigation] Collected item:', objectName);
    
    return item;
}

export function getCollectedItems() {
    const state = getChatState();
    return state?.investigation?.collectedItems || [];
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function initInvestigation() {
    console.log('[Investigation] initInvestigation() called');
    
    if (document.getElementById('tribunal-investigation-fab')) {
        console.log('[Investigation] Already initialized, skipping');
        return;
    }
    
    const fab = createFAB();
    const panel = createPanel();
    
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    
    const settings = getSettings();
    const showFab = settings?.investigation?.showFab ?? true;
    if (!showFab) {
        fab.dataset.settingsHidden = 'true';
        fab.style.display = 'none';
        console.log('[Investigation] FAB hidden per saved settings');
    }
    
    setupFABVisibilityWatcher();
    
    // Listen for genre changes to update panel dynamics
    window.addEventListener('tribunal:genreChanged', async () => {
        await ensureGenreImports();
        updatePanelDynamics();
    });
    
    console.log('[Investigation] Module initialized - Perception Scanner v8.0 ready');
}

export function openInvestigation() {
    open();
}

export function closeInvestigation() {
    close();
}

export function isInvestigationOpen() {
    return isOpen;
}

export { detectSetting, buildInvestigationContext, extractJSONObjects };
