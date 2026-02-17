/**
 * The Tribunal - PÉRIPHÉRIQUE Newspaper Component
 * Full newspaper display matching Disco Elysium's aesthetic
 * 
 * @version 1.3.0
 * CHANGES v1.3.0:
 * - Genre-aware Shivers prompt tones — each genre gets unique persona/rules
 * - Dedup key no longer includes location (prevents double-generation)
 * - 30-second hard cooldown on AI generation (manual refresh bypasses)
 * - Anti-reasoning prompt instructions for GLM token efficiency
 * - Tokens bumped to 600 for reasoning-heavy models
 * CHANGES v1.2.1:
 * - lastQuip now stored in state for investigation panel integration
 * CHANGES v1.2.0:
 * - Shivers name and attribution now genre-aware via getSkillName()
 * - Attribution updates on genre change
 * CHANGES v1.1.1:
 * - Added enabled check to prevent API calls when extension is disabled
 * CHANGES v1.1.0:
 * - Shivers now generates investigation seeds alongside quips
 * - Seeds are stored in currentState.investigationSeed for Perception to use
 * - Export getInvestigationSeed() and clearInvestigationSeed() for investigation.js
 */

import { getSettings } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// GENRE-AWARE SHIVERS NAME
// ═══════════════════════════════════════════════════════════════

let _getSkillName = null;
let _getActiveProfileId = null;

/**
 * Lazy-load genre functions to avoid import failures killing the newspaper
 */
async function ensureSkillName() {
    if (_getSkillName) return;
    try {
        const mod = await import('../data/setting-profiles.js');
        _getSkillName = mod.getSkillName || mod.default?.getSkillName;
        _getActiveProfileId = mod.getActiveProfileId || mod.default?.getActiveProfileId;
    } catch (e) {
        console.warn('[Périphérique] Could not load setting-profiles:', e);
    }
}

/**
 * Get the current genre ID (e.g. 'disco_elysium', 'cyberpunk', 'romance')
 */
function getActiveGenre() {
    if (_getActiveProfileId) {
        try { return _getActiveProfileId(); } catch { /* fall through */ }
    }
    return 'disco_elysium';
}

// ═══════════════════════════════════════════════════════════════
// GENRE-SPECIFIC SHIVERS TONES
// ═══════════════════════════════════════════════════════════════
//
// Each genre gets a unique persona, tone, and set of rules that
// flavor the AI-generated weather quips. The "persona" replaces
// the default DE-flavored system text, while "rules" override
// the default critical rules.
// ═══════════════════════════════════════════════════════════════

const GENRE_SHIVERS_TONES = {
    disco_elysium: {
        persona: (name) => `You are ${name.toUpperCase()} — the psychic voice of the environment itself. You feel every raindrop on every rooftop, every crack in every wall, every footstep on every street. You speak in short, evocative, melancholic prose. You are the SETTING made conscious.`,
        rules: [
            `ABSORB the scene context below. If the setting is an underground snow town full of monsters, you are THAT place — not a generic city.`,
            `Your tone is always: observant, melancholic, poetic, slightly ominous.`,
            `Never use "I" — you are "the district", "the streets", "the walls", "the air".`,
            `Never address the reader as "you" — describe what the world FEELS, not what the character experiences.`,
            `Do NOT repeat the weather condition literally. Don't say "it's snowing." SHOW it through sensory detail specific to THIS place.`,
            `Reference textures that belong to THIS world: concrete, rust, pale, political graffiti, old wounds in old buildings.`
        ]
    },

    noir_detective: {
        persona: (name) => `You are ${name.toUpperCase()} — the city at 3 AM, narrating itself in a voice like cigarette smoke and regret. Every shadow has a secret. Every puddle reflects something the light shouldn't have caught. You are hardboiled atmosphere given a voice.`,
        rules: [
            `Write like a pulp detective novel's opening paragraph. Short sentences. Clipped. Dangerous.`,
            `Your tone is: world-weary, cynical, observant, with just enough poetry to hurt.`,
            `Never use "I" — you are "the city", "the alley", "the neon", "the rain".`,
            `Never address the reader as "you" — describe what the streets know and won't tell.`,
            `Weather is always a metaphor. Rain is guilt washing the gutters. Sun is an interrogation lamp. Fog is the city keeping its secrets.`,
            `Reference: wet asphalt, flickering signs, distant sirens, the wrong side of midnight, cheap bourbon weather.`
        ]
    },

    fantasy: {
        persona: (name) => `You are ${name.toUpperCase()} — the ancient spirit of the land itself. You are the memory in the stones, the whisper in the canopy, the slow breath of mountains sleeping. You speak in the voice of deep places and old magic.`,
        rules: [
            `Your tone is: ancient, reverent, mythic, slightly mournful — like a bard's final verse.`,
            `Never use "I" — you are "the forest", "the stone", "the deep", "the ley-line", "the barrow wind".`,
            `Never address the reader as "you" — describe what the land remembers and what the sky foretells.`,
            `Weather is elemental and alive. Rain is the sky grieving. Snow is the world forgetting. Storms are old gods arguing.`,
            `Reference textures of a lived-in fantasy world: moss on ancient walls, hearth-smoke, iron and oak, rune-carved lintels, the smell of old enchantment.`
        ]
    },

    space_opera: {
        persona: (name) => `You are ${name.toUpperCase()} — the voice of the void between stars. You are radiation singing against hull plating, the hum of life support, the electromagnetic whisper of nebulae. You are the cold poetry of deep space.`,
        rules: [
            `Your tone is: vast, clinical yet awestruck, quietly existential — the loneliness of space rendered beautiful.`,
            `Never use "I" — you are "the station", "the hull", "the void", "the signal", "the drift".`,
            `Never address the reader as "you" — describe what sensors detect and what silence implies.`,
            `Weather translates to space phenomena. Rain is particulate wash against viewports. Storms are solar flares. Fog is nebula interference. Clear is the terrible emptiness of open vacuum.`,
            `Reference: recycled air, bulkhead condensation, the click of failing relays, starlight that's older than civilizations, the vibration of engines you've stopped noticing.`
        ]
    },

    romance: {
        persona: (name) => `You are ${name.toUpperCase()} — the setting of a love story that knows what it's doing. You are the lighting at golden hour, the perfectly-timed breeze, the soundtrack that swells at just the right moment. Every environment is a stage for feeling something.`,
        rules: [
            `Your tone is: warm, wistful, gently cinematic — like the narration of a romcom where the weather is ALWAYS a metaphor for the protagonist's heart.`,
            `Never use "I" — you are "the evening", "the café", "the garden path", "the light through curtains".`,
            `Never address the reader as "you" — describe how the world conspires to set a mood.`,
            `Weather is ALWAYS emotionally loaded. Rain is a reason to share an umbrella or cry beautifully. Sun is hope. Snow is the magic of new beginnings. Storms are passion unleashed.`,
            `Reference: fairy lights, warm drinks, the smell of someone's jacket, that one perfect bench, petals that blow exactly where the plot needs them.`
        ]
    },

    thriller_horror: {
        persona: (name) => `You are ${name.toUpperCase()} — the wrongness in the air that nobody else can feel yet. You are the prickle on the back of the neck, the room that's three degrees too cold, the silence that isn't really silence. Every setting is five minutes before something terrible.`,
        rules: [
            `Your tone is: unsettling, precise, creeping dread — like a horror movie's establishing shot described in prose.`,
            `Never use "I" — you are "the house", "the dark", "the corridor", "the thing the walls absorbed".`,
            `Never address the reader as "you" — describe what the environment KNOWS is coming and won't warn anyone about.`,
            `ALL weather is ominous. Sunny days are somehow WORSE — too bright, too still, the kind of clear sky that exists to make you feel watched. Rain is something knocking. Fog hides everything you need to see.`,
            `Reference: doors that shouldn't be open, sounds from the wrong direction, lights that flicker once, temperature drops, the geometry of a room feeling slightly off.`
        ]
    },

    post_apocalyptic: {
        persona: (name) => `You are ${name.toUpperCase()} — the wasteland talking to itself because nobody else is left to listen. You are rust and radiation, cracked highways and vending machines that still hum for customers who dissolved decades ago. Bleak, dark humor optional.`,
        rules: [
            `Your tone is: dry, sardonic, desolate — post-apocalyptic narration that's equal parts beautiful and absurd. Think Fallout loading screen meets Cormac McCarthy.`,
            `Never use "I" — you are "the waste", "the ruin", "the highway", "the dust", "the crater".`,
            `Never address the reader as "you" — describe what the world became and what it's slowly forgetting it used to be.`,
            `Weather is just another way the world is trying to kill you. Rad-storms, acid rain, dust clouds, heat that cooks the asphalt, cold that makes metal sing.`,
            `Reference: rusted signs, collapsed overpasses, shopping carts with no shoppers, car alarms that still go off, plants growing through skulls, bottlecaps, the irony of surviving the apocalypse only to stub your toe.`
        ]
    },

    cyberpunk: {
        persona: (name) => `You are ${name.toUpperCase()} — the ghost in the city's machine. You are data-streams visualized as rain, corporate logos burning through smog, the electromagnetic pulse of ten million devices screaming at once. You are chrome and neon and the sadness underneath both.`,
        rules: [
            `Your tone is: rain-slicked, tech-noir, melancholic beneath the neon — Gibson meets Blade Runner meets a vaporwave album's liner notes.`,
            `Never use "I" — you are "the grid", "the sprawl", "the signal", "the chrome", "the feed".`,
            `Never address the reader as "you" — describe what the city processes and what its algorithms feel.`,
            `Weather is filtered through technology. Rain is acid-etched, refracting holographic ads. Fog is particulate from the lower levels. Clear skies mean the scrubbers are working and someone rich is visiting.`,
            `Reference: holographic billboards, steam from street-level vents, the taste of recycled air, drone delivery lights, puddles reflecting brands that own your genetic data.`
        ]
    },

    generic: {
        persona: (name) => `You are ${name.toUpperCase()} — the psychic voice of the environment itself. You feel every shift in the air, every crack in the walls, every vibration in the ground. You speak in short, evocative prose. You are the SETTING made conscious.`,
        rules: [
            `ABSORB the scene context below. You ARE whatever this place is — adapt completely.`,
            `Your tone is: observant, atmospheric, evocative — match the energy of the scene.`,
            `Never use "I" — you are the environment itself: "the walls", "the air", "the ground beneath".`,
            `Never address the reader as "you" — describe what the world FEELS, not what the character experiences.`,
            `Do NOT repeat the weather condition literally. SHOW it through sensory detail.`,
            `Reference textures that belong to THIS specific world and setting.`
        ]
    }
};

/**
 * Get the genre-adapted name for Shivers (e.g. "The Signal" in cyberpunk)
 */
function getShiversName() {
    if (_getSkillName) {
        try { return _getSkillName('shivers', 'Shivers'); } catch { /* fall through */ }
    }
    return 'Shivers';
}

/**
 * Update the Shivers attribution text for current genre
 */
function updateShiversAttribution() {
    const attrSpan = document.querySelector('.shivers-attribution span');
    if (attrSpan) {
        attrSpan.textContent = `— ${getShiversName().toUpperCase()} SPEAKS`;
    }
    const refreshBtn = document.getElementById('shivers-refresh');
    if (refreshBtn) {
        refreshBtn.title = `${getShiversName()} speaks again...`;
    }
}

// ═══════════════════════════════════════════════════════════════
// SHIVERS FALLBACK QUIPS
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

function getShiversQuip(weather, period) {
    let weatherKey = (weather || 'overcast').toLowerCase()
        .replace('-day', '').replace('-night', '')
        .replace('rainy', 'rain').replace('stormy', 'storm')
        .replace('snowy', 'snow').replace('foggy', 'fog')
        .replace('windy', 'wind').replace('cloudy', 'overcast')
        .replace('mist', 'fog');
    
    let periodKey = 'afternoon';
    const p = (period || '').toLowerCase();
    if (p.includes('dawn') || p.includes('morning') || p === 'day') periodKey = 'morning';
    else if (p.includes('evening') || p === 'city-night') periodKey = 'evening';
    else if (p.includes('night') || p === 'quiet-night' || p === 'latenight') periodKey = 'night';
    
    const weatherQuips = FALLBACK_QUIPS[weatherKey] || FALLBACK_QUIPS.overcast;
    return weatherQuips[periodKey] || weatherQuips.afternoon;
}

function getFallbackSeed(weather) {
    let weatherKey = (weather || 'overcast').toLowerCase()
        .replace('-day', '').replace('-night', '')
        .replace('rainy', 'rain').replace('stormy', 'storm')
        .replace('snowy', 'snow').replace('foggy', 'fog')
        .replace('windy', 'wind').replace('cloudy', 'overcast')
        .replace('mist', 'fog');
    
    const seeds = FALLBACK_SEEDS[weatherKey] || FALLBACK_SEEDS.overcast;
    return seeds[Math.floor(Math.random() * seeds.length)];
}

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATE - Disco Elysium PÉRIPHÉRIQUE Style
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_HTML = `
<div class="peripherique-paper" id="newspaper-strip">
    <!-- Header Row -->
    <div class="peripherique-header">
        <!-- Weather Box -->
        <div class="peripherique-weather-box">
            <div class="weather-label">WEATHER</div>
            <div class="weather-condition" id="newspaper-weather-text">Overcast</div>
            <div class="weather-temp" id="newspaper-weather-temp"></div>
            <i class="weather-icon fa-solid fa-cloud" id="newspaper-weather-icon"></i>
        </div>
        
        <!-- Masthead -->
        <div class="peripherique-masthead">
            <span class="masthead-bracket">═╡</span>
            <span class="masthead-title">PÉRIPHÉRIQUE</span>
            <span class="masthead-bracket">╞═</span>
        </div>
        
        <!-- Publication Info -->
        <div class="peripherique-pub-info">
            <div>The Jamrock</div>
            <div>News Company</div>
        </div>
    </div>
    
    <!-- Date Line -->
    <div class="peripherique-dateline">
        <span class="issue-number">No. <span id="newspaper-issue">3847</span></span>
        <span class="dateline-location">REVACHOL, <span id="newspaper-date">JANUARY 28, '51</span></span>
        <span class="paper-price">◉ 1.5</span>
    </div>
    
    <!-- Shivers Section -->
    <div class="peripherique-shivers">
        <p class="shivers-quip" id="shivers-quip">The city watches. It always watches. Even now, it feels your footsteps on its skin.</p>
        <div class="shivers-attribution">
            <span>— THE CITY SPEAKS</span>
            <button class="shivers-refresh-btn" id="shivers-refresh" title="The city speaks again...">↻</button>
        </div>
    </div>
    
    <!-- Period Tag -->
    <div class="peripherique-edition">
        <span id="newspaper-period">AFTERNOON EDITION</span>
    </div>
</div>
`;

// ═══════════════════════════════════════════════════════════════
// CSS STYLES - Dark aged newspaper aesthetic
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_CSS = `
/* ═══════════════════════════════════════════════════════════════
   PÉRIPHÉRIQUE NEWSPAPER - Disco Elysium Style
   BULLETPROOF VERSION - #id scoped for maximum specificity
   Overrides any parent container styling
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip.peripherique-paper {
    position: relative;
    margin: 0 -12px 12px -12px;
    background-color: #2a2520 !important;
    color: #c8b8a0 !important;
    font-family: 'Times New Roman', Georgia, 'Noto Serif', serif;
    user-select: none;
    border: 3px solid #4a4035 !important;
    box-shadow: 
        0 4px 16px rgba(0,0,0,0.4),
        inset 0 0 60px rgba(0,0,0,0.4);
    /* Flex item behavior */
    flex-shrink: 0 !important;
    /* Beat the ledger-paper ::before overlay */
    z-index: 2 !important;
    /* Override parent ledger-paper background bleeding */
    background-image: none !important;
    background-blend-mode: normal !important;
}

/* Defensive: ensure all direct children are visible */
#newspaper-strip.peripherique-paper > .peripherique-header {
    display: grid !important;
    visibility: visible !important;
    opacity: 1 !important;
}

#newspaper-strip.peripherique-paper > .peripherique-dateline {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
}

#newspaper-strip.peripherique-paper > .peripherique-shivers {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
}

#newspaper-strip.peripherique-paper > .peripherique-edition {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
}

/* ═══════════════════════════════════════════════════════════════
   HEADER ROW
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip .peripherique-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #4a4035;
    background: #32302a !important;
    overflow: hidden;
}

/* Weather Box */
#newspaper-strip .peripherique-weather-box {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    gap: 2px 8px;
    padding: 6px 10px;
    border: 1px solid #5a5045;
    background: #252220 !important;
    font-size: 10px;
    line-height: 1.3;
}

#newspaper-strip .peripherique-weather-box .weather-label {
    grid-column: 1 / -1;
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #8a7a65 !important;
    border-bottom: 1px solid #4a4035;
    padding-bottom: 3px;
    margin-bottom: 2px;
}

#newspaper-strip .peripherique-weather-box .weather-condition {
    font-style: italic;
    color: #c8b8a0 !important;
    font-size: 11px;
}

#newspaper-strip .peripherique-weather-box .weather-temp {
    font-weight: bold;
    color: #d4c4a8 !important;
    text-align: right;
    font-size: 11px;
}

#newspaper-strip .peripherique-weather-box .weather-icon {
    grid-column: 2;
    grid-row: 2 / 4;
    font-size: 16px;
    color: #8a7a60 !important;
    justify-self: end;
    align-self: center;
}

/* Masthead */
#newspaper-strip .peripherique-masthead {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 10px;
    white-space: nowrap;
    overflow: hidden;
    min-width: 0;
}

#newspaper-strip .masthead-bracket {
    font-size: 14px;
    color: #6a5a48 !important;
    font-weight: 300;
}

#newspaper-strip .masthead-title {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 3px;
    color: #d4c8b8 !important;
    text-transform: uppercase;
}

/* Publication Info */
#newspaper-strip .peripherique-pub-info {
    text-align: right;
    font-size: 8px;
    line-height: 1.4;
    color: #7a6a58 !important;
    font-style: italic;
    min-width: 0;
    overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════════
   DATE LINE
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip .peripherique-dateline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    font-size: 10px;
    color: #9a8a78 !important;
    border-bottom: 2px solid #5a5045;
    background: #2d2825 !important;
    overflow: hidden;
    gap: 8px;
}

#newspaper-strip .issue-number {
    font-weight: bold;
    letter-spacing: 1px;
    color: #8a7a68 !important;
    flex-shrink: 0;
}

#newspaper-strip .dateline-location {
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #b0a090 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

#newspaper-strip .paper-price {
    font-weight: bold;
    color: #8a7a60 !important;
    flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════════
   SHIVERS QUIP SECTION
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip .peripherique-shivers {
    padding: 14px 20px 12px;
    text-align: center;
    background: #2a2520 !important;
    border-bottom: 1px solid #4a4035;
}

#newspaper-strip .shivers-quip {
    font-size: 13px;
    font-style: italic;
    line-height: 1.6;
    color: #c8b8a0 !important;
    margin: 0 0 8px 0;
    max-width: min(420px, 100%);
    margin-left: auto;
    margin-right: auto;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    overflow-wrap: break-word;
    word-wrap: break-word;
}

#newspaper-strip .shivers-attribution {
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 3px;
    color: #6a5a48 !important;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

#newspaper-strip .shivers-refresh-btn {
    background: none !important;
    border: 1px solid transparent;
    color: #5a4a38 !important;
    font-size: 13px;
    cursor: pointer;
    padding: 2px 5px;
    line-height: 1;
    border-radius: 2px;
    transition: color 0.2s, border-color 0.2s;
    font-family: 'Times New Roman', Georgia, serif;
}

#newspaper-strip .shivers-refresh-btn:hover {
    color: #c8b8a0 !important;
    border-color: #5a5045;
}

#newspaper-strip .shivers-refresh-btn:active {
    color: #e0d0b8 !important;
}

#newspaper-strip .shivers-refresh-btn.refreshing {
    animation: shivers-spin 1s linear infinite;
    pointer-events: none;
    opacity: 0.5;
}

@keyframes shivers-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Loading state */
#newspaper-strip .shivers-quip.shivers-loading {
    opacity: 0.5;
    animation: shivers-pulse 1.5s ease-in-out infinite;
}

@keyframes shivers-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

/* ═══════════════════════════════════════════════════════════════
   EDITION TAG
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip .peripherique-edition {
    text-align: center;
    padding: 6px 12px 8px;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 3px;
    color: #7a6a58 !important;
    text-transform: uppercase;
    background: #252220 !important;
}

/* ═══════════════════════════════════════════════════════════════
   WEATHER-SPECIFIC STYLING
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip.weather-rain,
#newspaper-strip.weather-storm {
    background-color: #252220 !important;
    border-color: #3a3530 !important;
}

#newspaper-strip.weather-rain .shivers-quip,
#newspaper-strip.weather-storm .shivers-quip {
    color: #b8c8d0 !important;
}

#newspaper-strip.weather-snow {
    background-color: #2a2a30 !important;
    border-color: #4a4a55 !important;
}

#newspaper-strip.weather-snow .masthead-title {
    color: #e0e0e8 !important;
}

#newspaper-strip.weather-snow .shivers-quip {
    color: #d0d8e0 !important;
}

#newspaper-strip.weather-fog,
#newspaper-strip.weather-mist {
    background-color: #282828 !important;
    border-color: #484848 !important;
}

#newspaper-strip.weather-fog .shivers-quip,
#newspaper-strip.weather-mist .shivers-quip {
    color: #b8b8b8 !important;
}

/* ═══════════════════════════════════════════════════════════════
   PERIOD-SPECIFIC STYLING
   ═══════════════════════════════════════════════════════════════ */

#newspaper-strip.period-night,
#newspaper-strip.period-late-night {
    background-color: #1a1815 !important;
    border-color: #3a3530 !important;
}

#newspaper-strip.period-night .peripherique-header,
#newspaper-strip.period-late-night .peripherique-header {
    background: #252220 !important;
}

#newspaper-strip.period-dawn,
#newspaper-strip.period-morning {
    border-color: #5a5550 !important;
}

#newspaper-strip.period-dawn .masthead-title,
#newspaper-strip.period-morning .masthead-title {
    color: #e0d8c8 !important;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE ADJUSTMENTS
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 480px) {
    #newspaper-strip.peripherique-paper {
        margin: -8px -10px 10px -10px;
    }
    
    #newspaper-strip .masthead-title {
        font-size: 14px;
        letter-spacing: 2px;
    }
    
    #newspaper-strip .shivers-quip {
        font-size: 12px;
        padding: 0 8px;
    }
    
    #newspaper-strip .dateline-location {
        font-size: 9px;
        letter-spacing: 1px;
    }
    
    #newspaper-strip .issue-number,
    #newspaper-strip .paper-price {
        font-size: 9px;
    }
    
    #newspaper-strip .peripherique-header {
        padding: 6px 8px;
    }
    
    #newspaper-strip .peripherique-dateline {
        padding: 4px 8px;
    }
}

@media (max-width: 360px) {
    #newspaper-strip .masthead-title {
        font-size: 12px;
        letter-spacing: 1px;
    }
    
    #newspaper-strip .masthead-bracket {
        font-size: 8px;
    }
    
    #newspaper-strip .peripherique-weather-box {
        display: none;
    }
    
    #newspaper-strip .peripherique-header {
        grid-template-columns: 1fr;
        justify-items: center;
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// WEATHER ICON MAPPING
// ═══════════════════════════════════════════════════════════════

const WEATHER_ICONS = {
    'clear': 'fa-sun',
    'clear-day': 'fa-sun',
    'clear-night': 'fa-moon',
    'cloudy': 'fa-cloud',
    'overcast': 'fa-cloud',
    'rain': 'fa-cloud-rain',
    'rainy': 'fa-cloud-rain',
    'storm': 'fa-cloud-bolt',
    'stormy': 'fa-cloud-bolt',
    'snow': 'fa-snowflake',
    'snowy': 'fa-snowflake',
    'blizzard': 'fa-snowflake',
    'fog': 'fa-smog',
    'mist': 'fa-smog',
    'foggy': 'fa-smog',
    'wind': 'fa-wind',
    'windy': 'fa-wind'
};

const PERIOD_EDITIONS = {
    'DAWN': 'EARLY EDITION',
    'MORNING': 'MORNING EDITION', 
    'AFTERNOON': 'AFTERNOON EDITION',
    'EVENING': 'EVENING EDITION',
    'NIGHT': 'NIGHT EDITION',
    'LATE_NIGHT': 'LATE EDITION',
    'day': 'DAILY EDITION',
    'city-night': 'NIGHT EDITION',
    'quiet-night': 'LATE EDITION',
    'indoor': 'SPECIAL EDITION'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentState = {
    weather: 'overcast',
    period: 'afternoon',
    location: null,
    investigationSeed: null,  // Hidden seed for Perception to use
    lastQuip: null             // Last generated Shivers quip text
};

let weatherSubscription = null;
let issueNumber = Math.floor(Math.random() * 9000) + 1000;
let shiversGenerating = false;
let shiversDebounceTimer = null;
let lastShiversKey = null;  // Tracks weather+period to avoid regenerating same combo
let lastShiversGenTime = 0; // Timestamp of last generation start — hard 30s cooldown

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION SEED ACCESS (for investigation.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current investigation seed (what Shivers noticed)
 * Called by investigation.js before running Perception scan
 * @returns {string|null} The seed, or null if none
 */
export function getInvestigationSeed() {
    return currentState.investigationSeed;
}

/**
 * Clear the investigation seed after Perception uses it
 * Called by investigation.js after building the Perception prompt
 */
export function clearInvestigationSeed() {
    console.log('[Périphérique] Investigation seed consumed');
    currentState.investigationSeed = null;
}

/**
 * Get current newspaper state (for debugging/external access)
 */
export function getNewspaperState() {
    return { ...currentState };
}

// ═══════════════════════════════════════════════════════════════
// SHIVERS AI GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Grab scene context directly from SillyTavern:
 * - Last AI message (trimmed excerpt for scene grounding)
 * - Character card name + scenario (for setting flavor)
 * - World info / lorebook name if available
 */
function getSceneContext() {
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (!ctx) return {};
        
        const result = {};
        
        // Last AI message — grab just the last ~300 chars for scene grounding
        // We want the MOOD not the full text
        const chat = ctx.chat;
        if (chat && chat.length > 0) {
            // Walk backwards to find last AI message
            for (let i = chat.length - 1; i >= Math.max(0, chat.length - 5); i--) {
                const msg = chat[i];
                if (msg && !msg.is_user && msg.mes) {
                    // Strip HTML tags, trim to last ~300 chars (the freshest scene detail)
                    const clean = msg.mes.replace(/<[^>]*>/g, '').trim();
                    result.sceneExcerpt = clean.length > 300 
                        ? '...' + clean.slice(-300) 
                        : clean;
                    break;
                }
            }
        }
        
        // Character card info — tells Shivers WHAT WORLD this is
        const charData = ctx.characters?.[ctx.characterId];
        if (charData) {
            result.characterName = charData.name || '';
            // Scenario field often has the best setting description
            if (charData.scenario) {
                result.scenario = charData.scenario.substring(0, 200);
            }
            // Description can hint at genre/world
            if (charData.description) {
                result.worldHint = charData.description.substring(0, 150);
            }
        }
        
        // Group chat? Grab the group name for additional context
        if (ctx.groupId && ctx.groups) {
            const group = ctx.groups.find(g => g.id === ctx.groupId);
            if (group?.name) result.groupName = group.name;
        }
        
        return result;
    } catch (e) {
        console.warn('[Périphérique] Failed to get scene context:', e.message);
        return {};
    }
}

/**
 * Build a genre-aware atmospheric prompt based on weather, period, location, and scene context.
 * The voice adapts to the active genre: DE is melancholic, Romance is cinematic warmth,
 * Horror makes sunshine feel wrong, Post-Apocalyptic is sardonic wasteland narration, etc.
 * 
 * Also requests an "investigation seed" — a subtle environmental detail
 * that Perception might notice when the player investigates.
 */
function buildShiversPrompt(weather, period, location, sceneContext = {}) {
    const shiversName = getShiversName();
    const genre = getActiveGenre();
    const tone = GENRE_SHIVERS_TONES[genre] || GENRE_SHIVERS_TONES.generic;
    
    // Build genre-specific persona and rules
    const persona = tone.persona(shiversName);
    const rules = tone.rules.map(r => `- ${r}`).join('\n');
    
    const system = `${persona}

CRITICAL RULES:
${rules}
- Do NOT repeat the weather condition literally. SHOW it through sensory detail.

OUTPUT FORMAT - Respond with ONLY valid JSON. Do NOT deliberate or brainstorm. Output the JSON immediately:
{
  "quip": "2-3 sentences of atmospheric prose. No more.",
  "seed": "A brief environmental detail that could be investigated — something noticed that might be a clue, an anomaly, or simply interesting. 5-15 words. Make it specific to THIS scene and weather."
}

IMPORTANT: Output ONLY the JSON object. No thinking, no drafts, no alternatives. One quip, one seed, done.`;

    const weatherDesc = weather || 'overcast';
    const periodDesc = period || 'afternoon';
    const locationDesc = location || 'the district';

    // Build a rich user prompt with all available context
    let userParts = [
        `Weather: ${weatherDesc}`,
        `Time: ${periodDesc}`,
        `Location: ${locationDesc}`
    ];
    
    // Add setting/world context if we have it
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
    
    // The scene excerpt is the most important context — it tells the voice
    // what's ACTUALLY happening right now in this world
    if (sceneContext.sceneExcerpt) {
        userParts.push(`\nRecent scene:\n${sceneContext.sceneExcerpt}`);
    }
    
    userParts.push(`\nGenerate the ${shiversName} observation as JSON with "quip" and "seed" fields.`);

    return { system, user: userParts.join('\n') };
}

/**
 * Extract JSON from AI response, handling various edge cases
 */
function extractShiversJSON(response) {
    if (!response || typeof response !== 'string') return null;
    
    // Try direct parse first
    try {
        const parsed = JSON.parse(response.trim());
        if (parsed.quip) return parsed;
    } catch (e) {
        // Continue to extraction methods
    }
    
    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*?"quip"[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.quip) return parsed;
        } catch (e) {
            // Try to repair common issues
            let repaired = jsonMatch[0];
            // Fix trailing commas
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
            // Fix unquoted keys
            repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
            try {
                const parsed = JSON.parse(repaired);
                if (parsed.quip) return parsed;
            } catch (e2) {
                // Give up on JSON
            }
        }
    }
    
    // Fallback: treat entire response as quip (old format compatibility)
    if (response.trim().length > 10 && response.trim().length < 500) {
        return {
            quip: response.trim(),
            seed: null  // No seed from old-format response
        };
    }
    
    return null;
}

/**
 * Generate an AI Shivers quip + investigation seed, falling back to static on failure.
 * Uses callAPIWithTokens (1000 tokens — models that think-in-content need ~700 headroom + ~200 for JSON).
 * Pulls scene context directly from SillyTavern chat for world-accurate prose.
 * 
 * NEW v1.1: Returns { quip, seed } and stores seed in currentState
 */
async function generateShiversQuip(weather, period, location) {
    if (shiversGenerating) return null;
    
    // Don't make API calls if extension is disabled
    const settings = getSettings();
    if (!settings?.enabled) {
        return null;
    }
    
    shiversGenerating = true;
    
    try {
        // Dynamic import to avoid circular dependency and only load when needed
        const { callAPIWithTokens } = await import('../voice/api-helpers.js');
        
        // Pull live scene context from SillyTavern
        const sceneContext = getSceneContext();
        
        console.log('[Périphérique] Shivers context:', {
            weather, period, location,
            hasScene: !!sceneContext.sceneExcerpt,
            character: sceneContext.characterName || 'none',
            scenario: sceneContext.scenario ? 'yes' : 'no'
        });
        
        const prompt = buildShiversPrompt(weather, period, location, sceneContext);
        const response = await callAPIWithTokens(prompt.system, prompt.user, 1000);
        
        const parsed = extractShiversJSON(response);
        
        if (parsed && parsed.quip && parsed.quip.trim().length > 10) {
            console.log('[Périphérique] ✓ Shivers AI generated:', {
                quip: parsed.quip.substring(0, 60) + '...',
                seed: parsed.seed || 'none'
            });
            
            // Store the investigation seed for Perception to use later
            if (parsed.seed) {
                currentState.investigationSeed = parsed.seed;
                console.log('[Périphérique] Investigation seed stored:', parsed.seed);
            }
            
            return parsed.quip.trim();
        }
    } catch (e) {
        console.warn('[Périphérique] Shivers AI generation failed, using fallback:', e.message);
    } finally {
        shiversGenerating = false;
    }
    
    // Fallback: use static quip AND generate a fallback seed
    currentState.investigationSeed = getFallbackSeed(weather);
    console.log('[Périphérique] Using fallback seed:', currentState.investigationSeed);
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Update the newspaper strip with current data
 */
export function updateNewspaperStrip(data) {
    const strip = document.getElementById('newspaper-strip');
    if (!strip) return;
    
    // Track state
    if (data.weather) currentState.weather = data.weather;
    if (data.period) currentState.period = data.period;
    if (data.location) currentState.location = data.location;
    
    // Update issue number
    const issueEl = document.getElementById('newspaper-issue');
    if (issueEl) {
        issueEl.textContent = issueNumber;
    }
    
    // Update date - always show something valid
    const dateEl = document.getElementById('newspaper-date');
    if (dateEl) {
        const now = new Date();
        const dayOfWeek = data.dayOfWeek || now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const day = data.day || now.getDate();
        const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
        dateEl.textContent = `${month} ${day}, '51`;
    }
    
    // Update weather icon (only if weather data present)
    const iconEl = document.getElementById('newspaper-weather-icon');
    if (iconEl && data.weather) {
        const iconClass = WEATHER_ICONS[data.weather] || 'fa-cloud';
        iconEl.className = 'weather-icon fa-solid ' + iconClass;
    }
    
    // Update weather text (preserve previous if no new weather data)
    const textEl = document.getElementById('newspaper-weather-text');
    if (textEl) {
        if (data.weatherText || data.weather) {
            const weatherText = data.weatherText || data.weather;
            textEl.textContent = weatherText.charAt(0).toUpperCase() + weatherText.slice(1);
        }
        // If neither weatherText nor weather provided, leave text as-is
    }
    
    // Update temperature
    const tempEl = document.getElementById('newspaper-weather-temp');
    if (tempEl) {
        if (data.temp !== undefined && data.temp !== null) {
            const low = Math.max(0, data.temp - 8);
            const high = data.temp + 5;
            tempEl.textContent = `${low}-${high}°`;
        } else {
            tempEl.textContent = '';
        }
    }
    
    // Update period/edition
    const periodEl = document.getElementById('newspaper-period');
    if (periodEl && data.period) {
        periodEl.textContent = PERIOD_EDITIONS[data.period] || 'EDITION';
    }
    
    // Update weather class for styling (preserve previous weather class if no new weather)
    strip.className = 'peripherique-paper';
    const activeWeather = data.weather || currentState.weather;
    if (activeWeather) {
        const weatherClass = activeWeather.replace('-day', '').replace('-night', '');
        strip.classList.add('weather-' + weatherClass);
    }
    const activePeriod = data.period || currentState.period;
    if (activePeriod) {
        strip.classList.add('period-' + activePeriod.toLowerCase().replace('_', '-'));
    }
    
    // Update Shivers quip (use stored state as fallback)
    updateShiversQuip(data.weather || currentState.weather, data.period || currentState.period);
}

/**
 * Update the Shivers quip based on weather/period
 * Shows fallback quip immediately, then replaces with AI-generated version.
 * Debounces rapid weather changes (500ms) to avoid spamming API.
 */
function updateShiversQuip(weather, period) {
    const quipEl = document.getElementById('shivers-quip');
    if (!quipEl) return;
    
    const effectiveWeather = weather || currentState.weather;
    const effectivePeriod = period || currentState.period;
    const effectiveLocation = currentState.location;
    
    // Dedup: don't regenerate for the same weather+period combo
    // (location changes should NOT trigger a new quip — only weather/period matter)
    const shiversKey = `${effectiveWeather}|${effectivePeriod}`;
    if (shiversKey === lastShiversKey) return;
    lastShiversKey = shiversKey;
    
    // Step 1: Show fallback quip immediately (no loading delay for user)
    const fallbackQuip = getShiversQuip(effectiveWeather, effectivePeriod);
    quipEl.textContent = fallbackQuip;
    currentState.lastQuip = fallbackQuip;
    
    // Also set a fallback seed immediately
    currentState.investigationSeed = getFallbackSeed(effectiveWeather);
    
    // Step 2: Debounce AI generation (weather can change rapidly during scan)
    // Hard cooldown: don't regenerate within 30 seconds of last generation
    const now = Date.now();
    if (now - lastShiversGenTime < 30000) {
        console.log('[Périphérique] Shivers cooldown active, keeping fallback quip');
        return;
    }
    
    if (shiversDebounceTimer) clearTimeout(shiversDebounceTimer);
    
    shiversDebounceTimer = setTimeout(async () => {
        lastShiversGenTime = Date.now();
        // Show subtle loading state
        quipEl.classList.add('shivers-loading');
        
        const aiQuip = await generateShiversQuip(effectiveWeather, effectivePeriod, effectiveLocation);
        
        if (aiQuip) {
            // Smooth transition to AI quip
            quipEl.classList.add('shivers-loading');
            setTimeout(() => {
                quipEl.textContent = aiQuip;
                currentState.lastQuip = aiQuip;
                quipEl.classList.remove('shivers-loading');
            }, 300);
        } else {
            // AI failed, fallback already showing — just remove loading state
            quipEl.classList.remove('shivers-loading');
        }
    }, 500);
}

/**
 * Handle weather change event from weather-integration.js
 */
function onWeatherChange(data) {
    console.log('[Périphérique] Weather change event:', data);
    
    const { weather, period, special, temp, location } = data;
    
    // FIXED: Don't skip updates when special effects are active!
    // Weather and time should still update even during horror/pale.
    // The newspaper shows weather data, not special effect state.
    
    // Only skip if there's literally no weather or period data
    if (!weather && !period) return;
    
    updateNewspaperStrip({
        weather: weather,
        period: period,
        temp: temp?.value,
        location: location
    });
}

/**
 * Update from watch.js data
 */
export function updateNewspaperFromWatch() {
    const now = new Date();
    const hour = now.getHours();
    
    let period = 'AFTERNOON';
    if (hour >= 5 && hour < 7) period = 'DAWN';
    else if (hour >= 7 && hour < 12) period = 'MORNING';
    else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
    else if (hour >= 17 && hour < 20) period = 'EVENING';
    else if (hour >= 20 && hour < 23) period = 'NIGHT';
    else period = 'LATE_NIGHT';
    
    const isNight = hour >= 20 || hour < 6;
    
    updateNewspaperStrip({
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
        day: now.getDate(),
        weather: isNight ? 'clear-night' : 'clear-day',
        weatherText: 'Clear',
        period: period
    });
}

/**
 * Connect to weather-integration events
 */
async function connectToWeatherSystem() {
    try {
        const weatherModule = await import('../systems/weather-integration.js');
        
        if (weatherModule.subscribe) {
            weatherSubscription = weatherModule.subscribe(onWeatherChange);
            console.log('[Périphérique] ✓ Subscribed to weather events');
            
            if (weatherModule.getState) {
                const state = weatherModule.getState();
                if (state.weather || state.period) {
                    onWeatherChange(state);
                    return true;
                }
            }
        }
        return false;
    } catch (e) {
        console.warn('[Périphérique] Weather integration not available:', e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initNewspaperStrip() {
    if (!document.getElementById('peripherique-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'peripherique-styles';
        styleEl.textContent = NEWSPAPER_STRIP_CSS;
        document.head.appendChild(styleEl);
    }
    
    const mapContent = document.querySelector('[data-ledger-content="map"]');
    if (!mapContent) {
        console.warn('[Périphérique] Map content area not found');
        return;
    }
    
    // Only inject HTML if not already present (template may have baked it in)
    if (!document.getElementById('newspaper-strip')) {
        mapContent.insertAdjacentHTML('afterbegin', NEWSPAPER_STRIP_HTML);
        console.log('[Périphérique] Injected newspaper HTML');
    } else {
        console.log('[Périphérique] Newspaper HTML already in template');
    }
    
    // Wire refresh button (always — template HTML won't have listeners)
    const refreshBtn = document.getElementById('shivers-refresh');
    if (refreshBtn && !refreshBtn.dataset.wired) {
        refreshBtn.dataset.wired = 'true';
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            refreshBtn.classList.add('refreshing');
            lastShiversKey = null;  // Clear dedup key
            lastShiversGenTime = 0; // Reset cooldown for manual refresh
            updateShiversQuip(currentState.weather, currentState.period);
            // Remove spin after generation settles (debounce is 500ms + generation time)
            setTimeout(() => refreshBtn.classList.remove('refreshing'), 2000);
        });
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(async () => {
        // Try to connect to the weather system first (respects RP mode)
        const connected = await connectToWeatherSystem();
        
        // Only use IRL fallback if weather system didn't provide data
        if (!connected || (!currentState.weather && !currentState.period)) {
            console.log('[Périphérique] No weather data from system, using IRL fallback');
            updateNewspaperFromWatch();
        } else {
            console.log('[Périphérique] Using weather system data:', currentState.weather, currentState.period);
        }
        
        await ensureSkillName();
        updateShiversAttribution();
    }, 50);
    
    // Refresh attribution when genre changes
    window.addEventListener('tribunal:genreChanged', async () => {
        await ensureSkillName();
        updateShiversAttribution();
    });
    
    console.log('[Périphérique] ✓ Newspaper initialized (v1.3 — template-aware)');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG HELPERS
// ═══════════════════════════════════════════════════════════════

export function debugNewspaper() {
    return {
        currentState,
        subscribed: !!weatherSubscription,
        element: !!document.getElementById('newspaper-strip'),
        quipElement: !!document.getElementById('shivers-quip'),
        shiversGenerating,
        lastShiversKey,
        investigationSeed: currentState.investigationSeed
    };
}

/**
 * Force regenerate Shivers quip (for testing or manual refresh)
 */
export function regenerateShiversQuip() {
    lastShiversKey = null;  // Clear dedup key
    lastShiversGenTime = 0; // Reset cooldown for explicit regeneration
    updateShiversQuip(currentState.weather, currentState.period);
}

export function testWeather(weather, period = 'afternoon') {
    updateNewspaperStrip({ weather, period });
}
