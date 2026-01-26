/**
 * The Tribunal - Weather Effects Module
 * Visual particle/overlay effects for atmosphere
 * 
 * Features:
 * - Background overlay (behind chat, subtle)
 * - Auto-detection from story content
 * - Manual override API
 * - Keyword triggers for Horror/Pale
 * - Light particle counts for mobile
 * 
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let effectsContainer = null;
let currentWeather = null;      // rain, snow, fog, wind, clear
let currentPeriod = null;       // day, city-night, quiet-night
let currentSpecial = null;      // pale, horror, indoor, null
let effectsEnabled = true;
let intensity = 'light';        // light, medium, heavy

// Particle counts based on intensity - balanced for mobile
const PARTICLE_COUNTS = {
    light:  { rain: 25, snow: 18, fog: 3, debris: 8, dust: 10, stars: 20, fireflies: 6 },
    medium: { rain: 45, snow: 30, fog: 4, debris: 12, dust: 18, stars: 35, fireflies: 10 },
    heavy:  { rain: 70, snow: 45, fog: 5, debris: 18, dust: 28, stars: 50, fireflies: 15 }
};

// ═══════════════════════════════════════════════════════════════
// KEYWORD DETECTION
// ═══════════════════════════════════════════════════════════════

const WEATHER_KEYWORDS = {
    rain: [
        'rain', 'raining', 'rains', 'rained', 'rainy', 'rainstorm',
        'downpour', 'drizzle', 'drizzling', 'shower', 'showers',
        'storm', 'stormy', 'storming', 'thunderstorm', 'thunder',
        'pouring', 'poured', 'wet', 'soaked', 'drenched', 'puddle', 'puddles',
        'lightning', 'monsoon', 'deluge'
    ],
    snow: [
        'snow', 'snowy', 'snowing', 'snowed', 'snowfall', 'snowflake', 'snowflakes',
        'blizzard', 'flurries', 'flurry', 'frost', 'frosty', 'frosted', 'frozen',
        'freezing', 'freeze', 'froze', 'ice', 'icy', 'icicle', 'icicles',
        'cold', 'frigid', 'bitter cold', 'winter', 'wintry', 'sleet',
        'hail', 'powder', 'snowdrift', 'whiteout', 'subzero'
    ],
    fog: [
        'fog', 'foggy', 'mist', 'misty', 'haze', 'hazy', 'smog', 'smoggy',
        'murky', 'overcast', 'grey', 'gray', 'gloomy', 'dim', 'obscured',
        'visibility', 'shroud', 'shrouded', 'veiled', 'thick air'
    ],
    wind: [
        'wind', 'windy', 'winds', 'gust', 'gusts', 'gusty', 'gusting',
        'breeze', 'breezy', 'gale', 'blustery', 'blowing', 'blown', 'blew',
        'howling', 'whistling', 'whipping', 'buffeted', 'swirling'
    ],
    clear: [
        'clear', 'sunny', 'bright', 'cloudless', 'fair', 'pleasant',
        'beautiful day', 'nice day', 'warm', 'sunshine', 'sunlight'
    ]
};

const PERIOD_KEYWORDS = {
    day: ['morning', 'afternoon', 'midday', 'noon', 'daylight', 'sunrise', 'dawn'],
    'city-night': ['night', 'evening', 'dusk', 'midnight', 'late night', 'neon', 'streetlight'],
    'quiet-night': ['countryside', 'rural', 'forest', 'lake', 'cabin', 'campfire', 'stargazing', 'crickets']
};

const SPECIAL_KEYWORDS = {
    horror: [
        'blood', 'scream', 'murder', 'killer', 'death', 'dead body', 'corpse',
        'knife', 'stabbed', 'slashed', 'terror', 'horrified', 'nightmare',
        'something behind', 'watching you', 'footsteps', 'breathing heavily',
        'heart pounding', 'heart racing', 'can\'t breathe', 'run', 'hide',
        'it\'s coming', 'don\'t look', 'help me', 'please no'
    ],
    pale: [
        'the pale', 'pale', 'unconscious', 'passed out', 'fainted', 'blackout',
        'dissociate', 'dissociating', 'dissociation', 'losing consciousness',
        'vision fading', 'world spinning', 'everything goes white', 'void',
        'nothing', 'emptiness', 'static', 'can\'t remember', 'who am i',
        'lost time', 'missing time', 'waking up', 'coming to'
    ],
    indoor: [
        'inside', 'indoors', 'room', 'apartment', 'house', 'building',
        'office', 'bar', 'cafe', 'restaurant', 'hotel', 'lobby',
        'bedroom', 'living room', 'kitchen', 'bathroom'
    ]
};

/**
 * Detect weather/period/special from text
 * @param {string} text - Message text to analyze
 * @returns {Object} Detected conditions
 */
export function detectConditionsFromText(text) {
    if (!text) return {};
    
    const lower = text.toLowerCase();
    const detected = {};
    
    // Check weather keywords
    for (const [weather, keywords] of Object.entries(WEATHER_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            detected.weather = weather;
            break;
        }
    }
    
    // Check period keywords
    for (const [period, keywords] of Object.entries(PERIOD_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            detected.period = period;
            break;
        }
    }
    
    // Check special keywords (horror takes priority over pale)
    for (const [special, keywords] of Object.entries(SPECIAL_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            detected.special = special;
            // Horror takes priority - don't break, let it override
            if (special === 'horror') break;
        }
    }
    
    return detected;
}

// ═══════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════

const WEATHER_EFFECTS_CSS = `
/* ═══════════════════════════════════════════════════════════════
   WEATHER EFFECTS CONTAINER
   ═══════════════════════════════════════════════════════════════ */

#tribunal-weather-effects {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9990;  /* Very high for testing - will be above most things */
    overflow: hidden;
    transition: opacity 0.5s ease;
    /* DEBUG: Add visible background to confirm container exists */
    /* background: rgba(255, 0, 0, 0.1); */
}

#tribunal-weather-effects.effects-disabled {
    opacity: 0;
}

.weather-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
}

.weather-particle {
    position: absolute;
}

/* ═══════════════════════════════════════════════════════════════
   RAIN
   ═══════════════════════════════════════════════════════════════ */

.fx-rain-drop {
    width: 1px;
    height: 15px;
    background: linear-gradient(180deg, transparent 0%, rgba(174, 194, 224, 0.4) 100%);
    animation: fx-rain-fall linear infinite;
}

@keyframes fx-rain-fall {
    0% { transform: translateY(-20px); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% { transform: translateY(100vh); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════
   SNOW
   ═══════════════════════════════════════════════════════════════ */

.fx-snowflake {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    animation: fx-snow-fall linear infinite;
    text-shadow: 0 0 5px rgba(100, 150, 255, 0.8), 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes fx-snow-fall {
    0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.8; }
    50% { transform: translateY(50vh) translateX(15px) rotate(180deg); }
    90% { opacity: 0.6; }
    100% { transform: translateY(100vh) translateX(-10px) rotate(360deg); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════
   FOG (Harbor Fog)
   ═══════════════════════════════════════════════════════════════ */

.fx-fog-layer {
    width: 300%;
    height: 40%;
    background: linear-gradient(0deg,
        rgba(180, 190, 200, 0.2) 0%,
        rgba(180, 190, 200, 0.1) 40%,
        transparent 100%
    );
    animation: fx-fog-roll ease-in-out infinite;
}

@keyframes fx-fog-roll {
    0%, 100% { transform: translateX(-30%) scaleY(1); }
    50% { transform: translateX(-20%) scaleY(1.08); }
}

/* ═══════════════════════════════════════════════════════════════
   WIND (Debris)
   ═══════════════════════════════════════════════════════════════ */

.fx-debris-paper {
    width: 10px;
    height: 12px;
    background: rgba(200, 190, 170, 0.4);
    animation: fx-debris-blow ease-in-out infinite;
}

.fx-debris-leaf {
    width: 6px;
    height: 6px;
    background: rgba(100, 90, 60, 0.5);
    border-radius: 0 50% 50% 50%;
    animation: fx-debris-blow ease-in-out infinite;
}

@keyframes fx-debris-blow {
    0% { transform: translateX(-80px) translateY(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.7; }
    50% { transform: translateX(50vw) translateY(-40px) rotate(540deg); }
    90% { opacity: 0.5; }
    100% { transform: translateX(110vw) translateY(20px) rotate(1080deg); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════
   PALE SUN (Day)
   ═══════════════════════════════════════════════════════════════ */

.fx-pale-haze {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
        rgba(255, 250, 240, 0.06) 0%,
        transparent 50%
    );
}

.fx-pale-sun {
    width: 60px;
    height: 60px;
    background: radial-gradient(circle,
        rgba(255, 250, 240, 0.25) 0%,
        rgba(255, 250, 240, 0.08) 40%,
        transparent 70%
    );
    border-radius: 50%;
    animation: fx-sun-pulse ease-in-out 8s infinite;
}

.fx-dust-mote {
    width: 2px;
    height: 2px;
    background: rgba(255, 250, 230, 0.4);
    border-radius: 50%;
    animation: fx-dust-float ease-in-out infinite;
}

@keyframes fx-sun-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.08); opacity: 0.5; }
}

@keyframes fx-dust-float {
    0%, 100% { transform: translate(0, 0); opacity: 0.2; }
    25% { transform: translate(12px, -15px); opacity: 0.5; }
    50% { transform: translate(-8px, -25px); opacity: 0.3; }
    75% { transform: translate(15px, -10px); opacity: 0.4; }
}

/* ═══════════════════════════════════════════════════════════════
   CITY NIGHT
   ═══════════════════════════════════════════════════════════════ */

.fx-night-overlay {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
        rgba(10, 10, 25, 0.2) 0%,
        rgba(15, 15, 30, 0.15) 100%
    );
}

.fx-neon-puddle {
    width: 80px;
    height: 20px;
    background: radial-gradient(ellipse, var(--neon-color) 0%, transparent 70%);
    opacity: 0.2;
    animation: fx-neon-flicker 3s steps(2) infinite;
    filter: blur(4px);
}

@keyframes fx-neon-flicker {
    0%, 90%, 100% { opacity: 0.2; }
    92%, 96% { opacity: 0.08; }
}

.fx-city-star {
    width: 1px;
    height: 1px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: fx-star-twinkle ease-in-out infinite;
}

.fx-distant-light {
    width: 3px;
    height: 3px;
    background: var(--light-color);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--light-color);
    animation: fx-light-pulse ease-in-out infinite;
}

@keyframes fx-star-twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.7; }
}

@keyframes fx-light-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
}

/* ═══════════════════════════════════════════════════════════════
   QUIET NIGHT (Fireflies)
   ═══════════════════════════════════════════════════════════════ */

.fx-night-sky {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
        rgba(5, 10, 20, 0.3) 0%,
        rgba(10, 15, 25, 0.15) 60%,
        transparent 100%
    );
}

.fx-moon {
    width: 30px;
    height: 30px;
    background: radial-gradient(circle at 30% 30%,
        rgba(255, 255, 240, 0.7) 0%,
        rgba(230, 230, 210, 0.5) 50%,
        rgba(200, 200, 180, 0.2) 100%
    );
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(255, 255, 240, 0.2);
}

.fx-bright-star {
    width: 2px;
    height: 2px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
    animation: fx-star-pulse ease-in-out infinite;
}

@keyframes fx-star-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.2); }
}

.fx-firefly {
    width: 3px;
    height: 3px;
    background: rgba(200, 255, 150, 0.7);
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(200, 255, 150, 0.5);
    animation: fx-firefly-glow ease-in-out infinite;
}

@keyframes fx-firefly-glow {
    0%, 100% { opacity: 0; transform: translate(0, 0); }
    10% { opacity: 0.7; }
    30% { opacity: 0.9; transform: translate(15px, -20px); }
    50% { opacity: 0.2; transform: translate(-8px, -35px); }
    70% { opacity: 0.8; transform: translate(20px, -15px); }
    90% { opacity: 0.15; }
}

/* ═══════════════════════════════════════════════════════════════
   THE PALE (Sleep/Unconscious)
   ═══════════════════════════════════════════════════════════════ */

.fx-pale-void {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
        rgba(230, 230, 235, 0.85) 0%,
        rgba(220, 220, 225, 0.8) 50%,
        rgba(210, 210, 215, 0.75) 100%
    );
}

.fx-pale-static {
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.06;
    animation: fx-pale-shift 0.3s linear infinite;
    mix-blend-mode: multiply;
}

@keyframes fx-pale-shift {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-1%, 1%); }
    50% { transform: translate(1%, -1%); }
    75% { transform: translate(-1%, -1%); }
    100% { transform: translate(0, 0); }
}

.fx-pale-shimmer {
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(150, 140, 180, 0.3) 50%, transparent 100%);
    animation: fx-pale-scan 12s linear infinite;
}

@keyframes fx-pale-scan {
    0% { transform: translateY(-10vh); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(110vh); opacity: 0; }
}

.fx-memory-wisp {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba(180, 160, 200, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    animation: fx-memory-drift ease-in-out infinite;
    filter: blur(2px);
}

@keyframes fx-memory-drift {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
    25% { transform: translate(20px, -30px) scale(1.1); opacity: 0.4; }
    50% { transform: translate(-15px, -50px) scale(0.9); opacity: 0.15; }
    75% { transform: translate(25px, -20px) scale(1.05); opacity: 0.3; }
}

.fx-thought-symbol {
    font-size: 12px;
    color: rgba(120, 110, 140, 0.3);
    animation: fx-thought-float ease-in-out infinite;
    text-shadow: 0 0 8px rgba(150, 140, 170, 0.2);
}

@keyframes fx-thought-float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
    15% { opacity: 0.4; }
    50% { transform: translateY(-60px) rotate(12deg); opacity: 0.25; }
    85% { opacity: 0.1; }
}

/* ═══════════════════════════════════════════════════════════════
   INDOOR
   ═══════════════════════════════════════════════════════════════ */

.fx-indoor-warmth {
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at 30% 70%,
        rgba(255, 200, 150, 0.08) 0%,
        transparent 50%
    );
}

.fx-light-beam {
    width: 150px;
    height: 100%;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 250, 230, 0.02) 30%,
        rgba(255, 250, 230, 0.04) 50%,
        rgba(255, 250, 230, 0.02) 70%,
        transparent 100%
    );
    transform: skewX(-15deg);
    animation: fx-beam-sway 10s ease-in-out infinite;
}

@keyframes fx-beam-sway {
    0%, 100% { transform: skewX(-15deg) translateX(0); opacity: 0.7; }
    50% { transform: skewX(-12deg) translateX(15px); opacity: 0.9; }
}

.fx-indoor-dust {
    width: 2px;
    height: 2px;
    background: rgba(255, 250, 230, 0.3);
    border-radius: 50%;
    animation: fx-indoor-float linear infinite;
}

@keyframes fx-indoor-float {
    0% { transform: translateY(100vh) translateX(0); opacity: 0; }
    10% { opacity: 0.5; }
    50% { transform: translateY(50vh) translateX(20px); }
    90% { opacity: 0.3; }
    100% { transform: translateY(0) translateX(-15px); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════
   HORROR
   ═══════════════════════════════════════════════════════════════ */

.fx-horror-vignette {
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center,
        transparent 30%,
        rgba(0, 0, 0, 0.25) 65%,
        rgba(0, 0, 0, 0.5) 100%
    );
    animation: fx-vignette-breathe 4s ease-in-out infinite;
}

@keyframes fx-vignette-breathe {
    0%, 100% { 
        background: radial-gradient(ellipse at center,
            transparent 30%, rgba(0, 0, 0, 0.25) 65%, rgba(0, 0, 0, 0.5) 100%
        );
    }
    50% { 
        background: radial-gradient(ellipse at center,
            transparent 20%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0.6) 100%
        );
    }
}

.fx-horror-pulse {
    width: 100%;
    height: 100%;
    background: rgba(50, 0, 0, 0);
    animation: fx-heartbeat 2s ease-in-out infinite;
}

@keyframes fx-heartbeat {
    0%, 100% { background: rgba(50, 0, 0, 0); }
    15% { background: rgba(50, 0, 0, 0.04); }
    30% { background: rgba(50, 0, 0, 0); }
    45% { background: rgba(50, 0, 0, 0.06); }
    60% { background: rgba(50, 0, 0, 0); }
}

.fx-horror-flicker {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    animation: fx-horror-light 5s steps(1) infinite;
}

@keyframes fx-horror-light {
    0%, 100% { background: rgba(0, 0, 0, 0); }
    47% { background: rgba(0, 0, 0, 0); }
    48% { background: rgba(0, 0, 0, 0.12); }
    49% { background: rgba(0, 0, 0, 0); }
    50% { background: rgba(0, 0, 0, 0.08); }
    51% { background: rgba(0, 0, 0, 0); }
}

.fx-horror-grain {
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.03;
    animation: fx-grain-jitter 0.1s steps(3) infinite;
}

@keyframes fx-grain-jitter {
    0% { transform: translate(0, 0); }
    33% { transform: translate(1px, -1px); }
    66% { transform: translate(-1px, 1px); }
    100% { transform: translate(0, 0); }
}

.fx-horror-shadow {
    width: 150px;
    height: 250px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, transparent 100%);
    animation: fx-shadow-creep 15s ease-in-out infinite;
    filter: blur(15px);
}

@keyframes fx-shadow-creep {
    0%, 100% { transform: translateX(-100%) scaleX(0.5); opacity: 0; }
    40% { transform: translateX(0) scaleX(1); opacity: 0.4; }
    60% { transform: translateX(0) scaleX(1); opacity: 0.4; }
}

.fx-horror-drip {
    width: 2px;
    height: 0;
    background: linear-gradient(180deg, rgba(70, 15, 15, 0.5) 0%, rgba(50, 10, 10, 0.6) 100%);
    animation: fx-drip-fall 10s ease-in infinite;
    border-radius: 0 0 2px 2px;
}

@keyframes fx-drip-fall {
    0% { height: 0; top: 0; opacity: 0; }
    10% { height: 20px; opacity: 0.6; }
    30% { height: 20px; top: 0; }
    60% { height: 20px; top: 70%; opacity: 0.6; }
    80% { height: 10px; top: 85%; opacity: 0.3; }
    100% { height: 4px; top: 95%; opacity: 0; }
}
`;

// ═══════════════════════════════════════════════════════════════
// EFFECT GENERATORS
// ═══════════════════════════════════════════════════════════════

function getParticleCount(type) {
    return PARTICLE_COUNTS[intensity]?.[type] || PARTICLE_COUNTS.light[type] || 10;
}

function createRain() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-rain-' + Date.now();
    layer.dataset.effect = 'rain';
    
    // Inject CSS keyframes if not already present
    if (!document.getElementById('tribunal-rain-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-rain-keyframes';
        style.textContent = `
            @keyframes tribunal-rainfall {
                0% { transform: translateY(-30px); opacity: 0; }
                10% { opacity: 0.8; }
                100% { transform: translateY(100vh); opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        overflow: hidden !important;
        z-index: 1 !important;
    `);
    
    const count = getParticleCount('rain');
    
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        const duration = 0.5 + Math.random() * 0.4;
        const delay = Math.random() * 2;
        const height = 20 + Math.random() * 15; // 20-35px
        
        drop.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 100}% !important;
            top: -30px !important;
            width: 2px !important;
            height: ${height}px !important;
            background: linear-gradient(transparent, rgba(174, 194, 224, 0.8)) !important;
            pointer-events: none !important;
            opacity: 0 !important;
            animation: tribunal-rainfall ${duration}s linear ${delay}s infinite !important;
        `);
        
        layer.appendChild(drop);
    }
    
    return layer;
}

function createSnow() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-snow-' + Date.now();
    layer.dataset.effect = 'snow';
    
    // Inject CSS keyframes if not already present
    if (!document.getElementById('tribunal-snow-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-snow-keyframes';
        style.textContent = `
            @keyframes tribunal-snowfall {
                0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 0.7; }
                100% { transform: translateY(100vh) translateX(30px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        overflow: hidden !important;
        z-index: 1 !important;
    `);
    
    const count = getParticleCount('snow');
    
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.textContent = '❄';
        const duration = 10 + Math.random() * 10;
        const delay = Math.random() * duration;
        const size = 14 + Math.random() * 12; // 14-26px
        
        flake.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 100}% !important;
            top: -20px !important;
            color: rgba(255, 255, 255, 0.8) !important;
            font-size: ${size}px !important;
            text-shadow: 0 0 8px rgba(255,255,255,0.9) !important;
            pointer-events: none !important;
            opacity: 0 !important;
            animation: tribunal-snowfall ${duration}s linear ${delay}s infinite !important;
        `);
        
        layer.appendChild(flake);
    }
    
    return layer;
}

function createFog() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-fog-' + Date.now();
    layer.dataset.effect = 'fog';
    
    // Inject CSS keyframes if not already present
    if (!document.getElementById('tribunal-fog-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-fog-keyframes';
        style.textContent = `
            @keyframes tribunal-mistdrift {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Create mist layers - more visible now
    for (let i = 0; i < 3; i++) {
        const mist = document.createElement('div');
        const duration = 25 + i * 15;
        const opacity = 0.15 - i * 0.03; // 0.15, 0.12, 0.09
        
        mist.setAttribute('style', `
            position: absolute !important;
            top: ${30 + i * 25}% !important;
            left: 0 !important;
            width: 200% !important;
            height: 50% !important;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(200, 210, 220, ${opacity}) 25%,
                rgba(200, 210, 220, ${opacity * 1.3}) 50%,
                rgba(200, 210, 220, ${opacity}) 75%,
                transparent 100%
            ) !important;
            pointer-events: none !important;
            animation: tribunal-mistdrift ${duration}s linear infinite !important;
        `);
        
        layer.appendChild(mist);
    }
    
    return layer;
}

function createWind() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-wind-' + Date.now();
    layer.dataset.effect = 'wind';
    
    // Inject CSS keyframes if not already present
    if (!document.getElementById('tribunal-wind-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-wind-keyframes';
        style.textContent = `
            @keyframes tribunal-windstreak {
                0% { transform: translateX(0); opacity: 0; }
                10% { opacity: 0.7; }
                90% { opacity: 0.5; }
                100% { transform: translateX(calc(100vw + 200px)); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        overflow: hidden !important;
        z-index: 1 !important;
    `);
    
    const count = getParticleCount('debris');
    
    // Wind streaks - bigger and more visible
    for (let i = 0; i < count; i++) {
        const streak = document.createElement('div');
        const duration = 1.5 + Math.random() * 2;
        const delay = Math.random() * 4;
        const height = 2 + Math.random() * 2; // 2-4px thick
        const width = 60 + Math.random() * 80; // 60-140px long
        
        streak.setAttribute('style', `
            position: absolute !important;
            left: -150px !important;
            top: ${Math.random() * 100}% !important;
            width: ${width}px !important;
            height: ${height}px !important;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent) !important;
            border-radius: 2px !important;
            pointer-events: none !important;
            opacity: 0 !important;
            animation: tribunal-windstreak ${duration}s linear ${delay}s infinite !important;
        `);
        
        layer.appendChild(streak);
    }
    
    return layer;
}

function createDay() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-day-' + Date.now();
    layer.dataset.effect = 'day';
    
    // Inject CSS keyframes
    if (!document.getElementById('tribunal-day-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-day-keyframes';
        style.textContent = `
            @keyframes tribunal-dustfloat {
                0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
                25% { transform: translate(10px, -15px) rotate(90deg); opacity: 0.6; }
                50% { transform: translate(20px, 5px) rotate(180deg); opacity: 0.4; }
                75% { transform: translate(5px, 10px) rotate(270deg); opacity: 0.5; }
            }
            @keyframes tribunal-sunpulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Warm haze overlay
    const haze = document.createElement('div');
    haze.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: linear-gradient(180deg, rgba(255, 245, 200, 0.08) 0%, transparent 60%) !important;
        pointer-events: none !important;
    `);
    layer.appendChild(haze);
    
    // Sun glow
    const sun = document.createElement('div');
    sun.setAttribute('style', `
        position: absolute !important;
        top: 8% !important;
        right: 12% !important;
        width: 80px !important;
        height: 80px !important;
        background: radial-gradient(circle, rgba(255, 240, 180, 0.5) 0%, rgba(255, 220, 100, 0.2) 40%, transparent 70%) !important;
        border-radius: 50% !important;
        pointer-events: none !important;
        animation: tribunal-sunpulse 8s ease-in-out infinite !important;
    `);
    layer.appendChild(sun);
    
    // Dust motes
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        const size = 3 + Math.random() * 4;
        const duration = 12 + Math.random() * 10;
        const delay = Math.random() * duration;
        
        dust.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 100}% !important;
            top: ${Math.random() * 100}% !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background: rgba(255, 245, 200, 0.6) !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            animation: tribunal-dustfloat ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(dust);
    }
    
    return layer;
}

function createCityNight() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-citynight-' + Date.now();
    layer.dataset.effect = 'city-night';
    
    // Inject CSS keyframes
    if (!document.getElementById('tribunal-citynight-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-citynight-keyframes';
        style.textContent = `
            @keyframes tribunal-startwinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
            }
            @keyframes tribunal-neonpulse {
                0%, 100% { opacity: 0.15; }
                50% { opacity: 0.3; }
            }
            @keyframes tribunal-distantlight {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const colors = ['#ff6b9d', '#4ecdc4', '#ffe66d', '#a855f7', '#f97316'];
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Dark blue overlay
    const overlay = document.createElement('div');
    overlay.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: linear-gradient(180deg, rgba(15, 20, 40, 0.15) 0%, rgba(30, 25, 50, 0.1) 100%) !important;
        pointer-events: none !important;
    `);
    layer.appendChild(overlay);
    
    // Dim stars
    const starCount = Math.floor(getParticleCount('stars') * 0.4);
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        const size = 2 + Math.random() * 2;
        const duration = 3 + Math.random() * 3;
        const delay = Math.random() * duration;
        
        star.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 100}% !important;
            top: ${Math.random() * 40}% !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background: rgba(255, 255, 255, 0.6) !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            animation: tribunal-startwinkle ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(star);
    }
    
    // Neon reflections at bottom
    for (let i = 0; i < 4; i++) {
        const puddle = document.createElement('div');
        const color = colors[i % colors.length];
        const width = 60 + Math.random() * 80;
        const duration = 3 + Math.random() * 2;
        const delay = Math.random() * 3;
        
        puddle.setAttribute('style', `
            position: absolute !important;
            bottom: ${5 + Math.random() * 12}% !important;
            left: ${Math.random() * 80}% !important;
            width: ${width}px !important;
            height: 8px !important;
            background: linear-gradient(90deg, transparent, ${color}66, transparent) !important;
            border-radius: 50% !important;
            filter: blur(4px) !important;
            pointer-events: none !important;
            animation: tribunal-neonpulse ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(puddle);
    }
    
    // Distant window lights
    for (let i = 0; i < 8; i++) {
        const light = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 4 + Math.random() * 6;
        const duration = 2 + Math.random() * 2;
        const delay = Math.random() * 3;
        
        light.setAttribute('style', `
            position: absolute !important;
            top: ${15 + Math.random() * 35}% !important;
            left: ${Math.random() * 100}% !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background: ${color} !important;
            border-radius: 50% !important;
            filter: blur(2px) !important;
            pointer-events: none !important;
            animation: tribunal-distantlight ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(light);
    }
    
    return layer;
}

function createQuietNight() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-quietnight-' + Date.now();
    layer.dataset.effect = 'quiet-night';
    
    // Inject CSS keyframes
    if (!document.getElementById('tribunal-quietnight-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-quietnight-keyframes';
        style.textContent = `
            @keyframes tribunal-brightstar {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.3); }
            }
            @keyframes tribunal-firefly {
                0% { opacity: 0; transform: translate(0, 0); }
                20% { opacity: 0.8; }
                50% { opacity: 0.6; transform: translate(30px, -20px); }
                80% { opacity: 0.8; }
                100% { opacity: 0; transform: translate(60px, 10px); }
            }
            @keyframes tribunal-moonglow {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 0.85; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Night sky gradient
    const sky = document.createElement('div');
    sky.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: linear-gradient(180deg, rgba(10, 15, 35, 0.12) 0%, rgba(20, 25, 50, 0.08) 50%, transparent 100%) !important;
        pointer-events: none !important;
    `);
    layer.appendChild(sky);
    
    // Moon
    const moon = document.createElement('div');
    moon.setAttribute('style', `
        position: absolute !important;
        top: 10% !important;
        left: 20% !important;
        width: 50px !important;
        height: 50px !important;
        background: radial-gradient(circle, rgba(255, 255, 240, 0.9) 0%, rgba(255, 255, 220, 0.4) 50%, transparent 70%) !important;
        border-radius: 50% !important;
        pointer-events: none !important;
        animation: tribunal-moonglow 10s ease-in-out infinite !important;
    `);
    layer.appendChild(moon);
    
    // Stars
    const starCount = getParticleCount('stars');
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        const size = 2 + Math.random() * 3;
        const duration = 3 + Math.random() * 4;
        const delay = Math.random() * 5;
        
        star.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 100}% !important;
            top: ${Math.random() * 50}% !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background: white !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            animation: tribunal-brightstar ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(star);
    }
    
    // Fireflies
    const fireflyCount = getParticleCount('fireflies');
    for (let i = 0; i < fireflyCount; i++) {
        const firefly = document.createElement('div');
        const duration = 6 + Math.random() * 6;
        const delay = Math.random() * 10;
        
        firefly.setAttribute('style', `
            position: absolute !important;
            left: ${Math.random() * 80}% !important;
            top: ${40 + Math.random() * 50}% !important;
            width: 6px !important;
            height: 6px !important;
            background: radial-gradient(circle, rgba(180, 255, 100, 0.9) 0%, rgba(150, 255, 50, 0.4) 50%, transparent 70%) !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            animation: tribunal-firefly ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(firefly);
    }
    
    return layer;
}

function createPale() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'pale';
    
    // Void
    const voidEl = document.createElement('div');
    voidEl.className = 'weather-particle fx-pale-void';
    layer.appendChild(voidEl);
    
    // Static
    const staticEl = document.createElement('div');
    staticEl.className = 'weather-particle fx-pale-static';
    layer.appendChild(staticEl);
    
    // Shimmer lines
    for (let i = 0; i < 3; i++) {
        const shimmer = document.createElement('div');
        shimmer.className = 'weather-particle fx-pale-shimmer';
        shimmer.style.animationDelay = `${i * 4}s`;
        layer.appendChild(shimmer);
    }
    
    // Memory wisps
    for (let i = 0; i < 6; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'weather-particle fx-memory-wisp';
        wisp.style.left = `${Math.random() * 90}%`;
        wisp.style.top = `${Math.random() * 90}%`;
        wisp.style.animationDelay = `${Math.random() * 12}s`;
        wisp.style.animationDuration = `${12 + Math.random() * 8}s`;
        layer.appendChild(wisp);
    }
    
    // Thought symbols
    const symbols = ['◆', '◇', '?', '...', '∴', '○', '—', '※'];
    for (let i = 0; i < 8; i++) {
        const sym = document.createElement('div');
        sym.className = 'weather-particle fx-thought-symbol';
        sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        sym.style.left = `${Math.random() * 90}%`;
        sym.style.top = `${Math.random() * 90}%`;
        sym.style.animationDelay = `${Math.random() * 15}s`;
        sym.style.animationDuration = `${10 + Math.random() * 8}s`;
        layer.appendChild(sym);
    }
    
    return layer;
}

function createIndoor() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-indoor-' + Date.now();
    layer.dataset.effect = 'indoor';
    
    // Inject CSS keyframes
    if (!document.getElementById('tribunal-indoor-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-indoor-keyframes';
        style.textContent = `
            @keyframes tribunal-beampulse {
                0%, 100% { opacity: 0.08; }
                50% { opacity: 0.15; }
            }
            @keyframes tribunal-indoordust {
                0% { transform: translate(0, 100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.4; }
                100% { transform: translate(30px, -20px) rotate(180deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Warm ambient overlay
    const warmth = document.createElement('div');
    warmth.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: radial-gradient(ellipse at 70% 30%, rgba(255, 240, 200, 0.08) 0%, transparent 60%) !important;
        pointer-events: none !important;
    `);
    layer.appendChild(warmth);
    
    // Light beams from window
    for (let i = 0; i < 2; i++) {
        const beam = document.createElement('div');
        const duration = 10 + i * 2;
        const delay = i * 2;
        
        beam.setAttribute('style', `
            position: absolute !important;
            top: 0 !important;
            left: ${55 + i * 15}% !important;
            width: 80px !important;
            height: 100% !important;
            background: linear-gradient(180deg, 
                rgba(255, 250, 220, 0.15) 0%, 
                rgba(255, 245, 200, 0.08) 50%, 
                transparent 100%
            ) !important;
            transform: skewX(-15deg) !important;
            pointer-events: none !important;
            animation: tribunal-beampulse ${duration}s ease-in-out ${delay}s infinite !important;
        `);
        layer.appendChild(beam);
    }
    
    // Floating dust in light beams
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        const size = 2 + Math.random() * 3;
        const duration = 15 + Math.random() * 10;
        const delay = Math.random() * 15;
        
        dust.setAttribute('style', `
            position: absolute !important;
            left: ${45 + Math.random() * 45}% !important;
            bottom: -10px !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background: rgba(255, 250, 220, 0.7) !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            animation: tribunal-indoordust ${duration}s linear ${delay}s infinite !important;
        `);
        layer.appendChild(dust);
    }
    
    return layer;
}

function createHorror() {
    const layer = document.createElement('div');
    layer.id = 'tribunal-horror-' + Date.now();
    layer.dataset.effect = 'horror';
    
    // Inject CSS keyframes
    if (!document.getElementById('tribunal-horror-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-horror-keyframes';
        style.textContent = `
            @keyframes tribunal-heartbeat {
                0%, 100% { opacity: 0; }
                15% { opacity: 0.15; }
                30% { opacity: 0; }
                45% { opacity: 0.1; }
            }
            @keyframes tribunal-flicker {
                0%, 95%, 100% { opacity: 0; }
                96%, 98% { opacity: 0.4; }
            }
            @keyframes tribunal-creep {
                0% { transform: translateX(-100%); opacity: 0; }
                50% { opacity: 0.3; }
                100% { transform: translateX(100vw); opacity: 0; }
            }
            @keyframes tribunal-drip {
                0% { transform: translateY(-10px) scaleY(0.5); opacity: 0; }
                10% { opacity: 0.8; transform: scaleY(1); }
                100% { transform: translateY(100vh) scaleY(2); opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
    
    layer.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
    `);
    
    // Vignette
    const vignette = document.createElement('div');
    vignette.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(20, 0, 0, 0.25) 100%) !important;
        pointer-events: none !important;
    `);
    layer.appendChild(vignette);
    
    // Heartbeat pulse
    const pulse = document.createElement('div');
    pulse.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: radial-gradient(ellipse at center, rgba(80, 0, 0, 0.3) 0%, transparent 70%) !important;
        pointer-events: none !important;
        animation: tribunal-heartbeat 2s ease-in-out infinite !important;
    `);
    layer.appendChild(pulse);
    
    // Flicker
    const flicker = document.createElement('div');
    flicker.setAttribute('style', `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(255, 255, 255, 0.5) !important;
        pointer-events: none !important;
        animation: tribunal-flicker 8s linear infinite !important;
    `);
    layer.appendChild(flicker);
    
    // Creeping shadow
    const shadow = document.createElement('div');
    shadow.setAttribute('style', `
        position: absolute !important;
        top: 20% !important;
        left: 0 !important;
        width: 150px !important;
        height: 200px !important;
        background: linear-gradient(90deg, rgba(0, 0, 0, 0.4), transparent) !important;
        filter: blur(20px) !important;
        pointer-events: none !important;
        animation: tribunal-creep 20s linear infinite !important;
    `);
    layer.appendChild(shadow);
    
    // Blood drips
    for (let i = 0; i < 2; i++) {
        const drip = document.createElement('div');
        const delay = i * 4 + Math.random() * 2;
        
        drip.setAttribute('style', `
            position: absolute !important;
            left: ${25 + Math.random() * 50}% !important;
            top: -10px !important;
            width: 3px !important;
            height: 30px !important;
            background: linear-gradient(180deg, rgba(80, 0, 0, 0.8) 0%, rgba(120, 0, 0, 0.4) 100%) !important;
            border-radius: 0 0 3px 3px !important;
            pointer-events: none !important;
            animation: tribunal-drip 8s linear ${delay}s infinite !important;
        `);
        layer.appendChild(drip);
    }
    
    return layer;
}

// ═══════════════════════════════════════════════════════════════
// EFFECT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const EFFECT_CREATORS = {
    rain: createRain,
    snow: createSnow,
    fog: createFog,
    wind: createWind,
    clear: null,  // No visual effect
    day: createDay,
    'city-night': createCityNight,
    'quiet-night': createQuietNight,
    pale: createPale,
    indoor: createIndoor,
    horror: createHorror
};

function clearEffects(type = null) {
    // Clear from body (new approach)
    if (type) {
        // Remove specific type
        const layers = document.querySelectorAll(`.tribunal-weather-layer[data-weather-type="${type}"]`);
        layers.forEach(l => l.remove());
        // Also check old data-effect attribute
        const oldLayers = document.querySelectorAll(`[data-effect="${type}"]`);
        oldLayers.forEach(l => l.remove());
    } else {
        // Remove ALL weather layers
        const allLayers = document.querySelectorAll('.tribunal-weather-layer');
        allLayers.forEach(l => l.remove());
    }
    
    // Also clear container if it exists (legacy)
    if (effectsContainer) {
        if (type) {
            const layer = effectsContainer.querySelector(`[data-effect="${type}"]`);
            if (layer) layer.remove();
        } else {
            effectsContainer.innerHTML = '';
        }
    }
}

function addEffect(type) {
    console.log('[WeatherEffects] addEffect called:', type);
    
    if (!EFFECT_CREATORS[type]) {
        console.error('[WeatherEffects] No creator for type:', type);
        console.log('[WeatherEffects] Available types:', Object.keys(EFFECT_CREATORS));
        return;
    }
    
    // Remove existing of same type
    clearEffects(type);
    
    const creator = EFFECT_CREATORS[type];
    const layer = creator();
    
    if (layer) {
        // Add unique identifier
        layer.classList.add('tribunal-weather-layer');
        layer.dataset.weatherType = type;
        
        // BYPASS CONTAINER - add directly to body
        document.body.appendChild(layer);
        console.log('[WeatherEffects] Added layer DIRECTLY TO BODY for:', type);
    }
}

/**
 * Update all effects based on current state
 */
function renderEffects() {
    console.log('[WeatherEffects] renderEffects called');
    console.log('[WeatherEffects] effectsContainer:', !!effectsContainer);
    console.log('[WeatherEffects] effectsEnabled:', effectsEnabled);
    console.log('[WeatherEffects] currentWeather:', currentWeather);
    console.log('[WeatherEffects] currentPeriod:', currentPeriod);
    console.log('[WeatherEffects] currentSpecial:', currentSpecial);
    
    if (!effectsContainer) {
        console.error('[WeatherEffects] No container in renderEffects!');
        return;
    }
    
    clearEffects();
    
    if (!effectsEnabled) {
        effectsContainer.classList.add('effects-disabled');
        console.log('[WeatherEffects] Effects disabled, adding class');
        return;
    }
    
    effectsContainer.classList.remove('effects-disabled');
    
    // Special effects override everything (Pale especially)
    if (currentSpecial === 'pale') {
        addEffect('pale');
        return;  // Pale takes over completely
    }
    
    // Add weather effect
    if (currentWeather && currentWeather !== 'clear') {
        console.log('[WeatherEffects] Adding weather effect:', currentWeather);
        addEffect(currentWeather);
    }
    
    // Add period effect (unless indoor)
    if (currentSpecial === 'indoor') {
        addEffect('indoor');
    } else if (currentPeriod) {
        addEffect(currentPeriod);
    }
    
    // Add horror on top if active
    if (currentSpecial === 'horror') {
        addEffect('horror');
    }
    
    console.log('[WeatherEffects] renderEffects complete. Container children:', effectsContainer.children.length);
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize weather effects system
 */
export function initWeatherEffects() {
    // Inject minimal CSS for animations (just keyframes)
    if (!document.getElementById('tribunal-weather-keyframes')) {
        const style = document.createElement('style');
        style.id = 'tribunal-weather-keyframes';
        style.textContent = `
            @keyframes tribunal-snow-fall {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 0.8; }
                100% { transform: translateY(100vh) translateX(20px) rotate(360deg); opacity: 0; }
            }
            @keyframes tribunal-rain-fall {
                0% { transform: translateY(-20px); opacity: 0; }
                10% { opacity: 0.7; }
                100% { transform: translateY(100vh); opacity: 0; }
            }
            @keyframes tribunal-fog-drift {
                0% { transform: translateX(-10%); }
                50% { transform: translateX(10%); }
                100% { transform: translateX(-10%); }
            }
        `;
        document.head.appendChild(style);
        console.log('[WeatherEffects] Keyframes CSS injected');
    }
    
    // Also inject full CSS
    if (!document.getElementById('tribunal-weather-effects-styles')) {
        const style = document.createElement('style');
        style.id = 'tribunal-weather-effects-styles';
        style.textContent = WEATHER_EFFECTS_CSS;
        document.head.appendChild(style);
        console.log('[WeatherEffects] Full CSS injected');
    }
    
    // Create container
    if (!document.getElementById('tribunal-weather-effects')) {
        effectsContainer = document.createElement('div');
        effectsContainer.id = 'tribunal-weather-effects';
        effectsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 9990;
            overflow: hidden;
        `;
        
        // Try to insert before chat, or fallback to body
        const chat = document.getElementById('chat');
        if (chat && chat.parentElement) {
            chat.parentElement.insertBefore(effectsContainer, chat);
            console.log('[WeatherEffects] Container inserted before chat');
        } else {
            document.body.appendChild(effectsContainer);
            console.log('[WeatherEffects] Container appended to body');
        }
        
        // Add debug indicator (small colored dot in corner)
        const debugDot = document.createElement('div');
        debugDot.id = 'weather-debug-indicator';
        debugDot.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 12px;
            height: 12px;
            background: #4a4;
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 4px #4a4;
        `;
        debugDot.title = 'Weather Effects Active';
        document.body.appendChild(debugDot);
        
    } else {
        effectsContainer = document.getElementById('tribunal-weather-effects');
    }
    
    console.log('[WeatherEffects] Initialized, container:', !!effectsContainer);
}

/**
 * Set weather condition
 * @param {string|null} weather - rain, snow, fog, wind, clear, or null
 */
export function setWeatherCondition(weather) {
    if (currentWeather === weather) return;
    currentWeather = weather;
    renderEffects();
    console.log('[WeatherEffects] Weather:', weather);
}

/**
 * Set time of day / period
 * @param {string|null} period - day, city-night, quiet-night, or null
 */
export function setTimeOfDay(period) {
    if (currentPeriod === period) return;
    currentPeriod = period;
    renderEffects();
    console.log('[WeatherEffects] Period:', period);
}

/**
 * Set special effect
 * @param {string|null} special - pale, horror, indoor, or null
 */
export function setSpecialEffect(special) {
    if (currentSpecial === special) return;
    currentSpecial = special;
    renderEffects();
    console.log('[WeatherEffects] Special:', special);
}

/**
 * Set complete weather state at once
 * @param {Object} state
 * @param {string} state.weather - Weather type
 * @param {string} state.period - Time period
 * @param {string} state.special - Special effect
 */
export function setWeatherState(state) {
    let changed = false;
    
    console.log('[WeatherEffects] setWeatherState called with:', state);
    console.log('[WeatherEffects] Container exists:', !!effectsContainer);
    console.log('[WeatherEffects] Effects enabled:', effectsEnabled);
    
    if (state.weather !== undefined && currentWeather !== state.weather) {
        currentWeather = state.weather;
        changed = true;
    }
    if (state.period !== undefined && currentPeriod !== state.period) {
        currentPeriod = state.period;
        changed = true;
    }
    if (state.special !== undefined && currentSpecial !== state.special) {
        currentSpecial = state.special;
        changed = true;
    }
    
    if (changed) {
        renderEffects();
        console.log('[WeatherEffects] State:', { weather: currentWeather, period: currentPeriod, special: currentSpecial });
    }
}

/**
 * Enable/disable effects
 * @param {boolean} enabled
 */
export function setEffectsEnabled(enabled) {
    effectsEnabled = enabled;
    renderEffects();
}

/**
 * Set particle intensity
 * @param {string} level - light, medium, heavy
 */
export function setEffectsIntensity(level) {
    if (['light', 'medium', 'heavy'].includes(level)) {
        intensity = level;
        renderEffects();
    }
}

/**
 * Process message text and auto-detect conditions
 * @param {string} text - Message text
 * @param {boolean} applyImmediately - Whether to apply detected conditions
 * @returns {Object} Detected conditions
 */
export function processMessageForWeather(text, applyImmediately = true) {
    const detected = detectConditionsFromText(text);
    
    if (applyImmediately && Object.keys(detected).length > 0) {
        setWeatherState(detected);
    }
    
    return detected;
}

/**
 * Get current state
 */
export function getWeatherEffectsState() {
    return {
        weather: currentWeather,
        period: currentPeriod,
        special: currentSpecial,
        enabled: effectsEnabled,
        intensity
    };
}

/**
 * Clear all effects and reset state
 */
export function clearWeatherEffects() {
    currentWeather = null;
    currentPeriod = null;
    currentSpecial = null;
    clearEffects();
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger horror mode (with optional auto-clear)
 * @param {number} duration - Duration in ms (0 = indefinite)
 */
export function triggerHorror(duration = 0) {
    setSpecialEffect('horror');
    
    if (duration > 0) {
        setTimeout(() => {
            if (currentSpecial === 'horror') {
                setSpecialEffect(null);
            }
        }, duration);
    }
}

/**
 * Trigger The Pale (for unconscious/dissociated states)
 */
export function triggerPale() {
    setSpecialEffect('pale');
}

/**
 * Exit The Pale
 */
export function exitPale() {
    if (currentSpecial === 'pale') {
        setSpecialEffect(null);
    }
}

/**
 * Check if currently in The Pale
 */
export function isInPale() {
    return currentSpecial === 'pale';
}
