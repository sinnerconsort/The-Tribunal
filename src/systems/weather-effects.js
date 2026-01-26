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

// Particle counts based on intensity
const PARTICLE_COUNTS = {
    light:  { rain: 40, snow: 25, fog: 3, debris: 8, dust: 12, stars: 25, fireflies: 8 },
    medium: { rain: 70, snow: 40, fog: 4, debris: 12, dust: 20, stars: 40, fireflies: 12 },
    heavy:  { rain: 100, snow: 60, fog: 5, debris: 18, dust: 30, stars: 60, fireflies: 18 }
};

// ═══════════════════════════════════════════════════════════════
// KEYWORD DETECTION
// ═══════════════════════════════════════════════════════════════

const WEATHER_KEYWORDS = {
    rain: ['rain', 'raining', 'downpour', 'drizzle', 'shower', 'storm', 'thunderstorm', 'pouring'],
    snow: ['snow', 'snowing', 'blizzard', 'flurries', 'frost', 'freezing', 'ice'],
    fog: ['fog', 'foggy', 'mist', 'misty', 'haze', 'hazy', 'smog'],
    wind: ['wind', 'windy', 'gust', 'breeze', 'gale', 'blustery'],
    clear: ['clear', 'sunny', 'bright', 'cloudless']
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
    z-index: 1;  /* Behind chat */
    overflow: hidden;
    transition: opacity 0.5s ease;
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
    color: rgba(255, 255, 255, 0.6);
    font-size: 10px;
    animation: fx-snow-fall linear infinite;
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
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
    layer.className = 'weather-layer';
    layer.dataset.effect = 'rain';
    
    const count = getParticleCount('rain');
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'weather-particle fx-rain-drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.animationDuration = `${0.5 + Math.random() * 0.3}s`;
        layer.appendChild(drop);
    }
    
    return layer;
}

function createSnow() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'snow';
    
    const count = getParticleCount('snow');
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'weather-particle fx-snowflake';
        flake.textContent = '❄';
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDelay = `${Math.random() * 10}s`;
        flake.style.animationDuration = `${8 + Math.random() * 6}s`;
        flake.style.fontSize = `${6 + Math.random() * 8}px`;
        layer.appendChild(flake);
    }
    
    return layer;
}

function createFog() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'fog';
    
    const count = getParticleCount('fog');
    for (let i = 0; i < count; i++) {
        const fog = document.createElement('div');
        fog.className = 'weather-particle fx-fog-layer';
        fog.style.bottom = `${i * 12}%`;
        fog.style.animationDelay = `${i * 4}s`;
        fog.style.animationDuration = `${18 + i * 4}s`;
        fog.style.opacity = `${0.2 - i * 0.04}`;
        layer.appendChild(fog);
    }
    
    return layer;
}

function createWind() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'wind';
    
    const count = getParticleCount('debris');
    // Papers
    for (let i = 0; i < Math.floor(count * 0.4); i++) {
        const paper = document.createElement('div');
        paper.className = 'weather-particle fx-debris-paper';
        paper.style.top = `${20 + Math.random() * 60}%`;
        paper.style.animationDelay = `${Math.random() * 8}s`;
        paper.style.animationDuration = `${4 + Math.random() * 3}s`;
        layer.appendChild(paper);
    }
    // Leaves
    for (let i = 0; i < Math.floor(count * 0.6); i++) {
        const leaf = document.createElement('div');
        leaf.className = 'weather-particle fx-debris-leaf';
        leaf.style.top = `${30 + Math.random() * 50}%`;
        leaf.style.animationDelay = `${Math.random() * 6}s`;
        leaf.style.animationDuration = `${3 + Math.random() * 2}s`;
        layer.appendChild(leaf);
    }
    
    return layer;
}

function createDay() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'day';
    
    // Haze
    const haze = document.createElement('div');
    haze.className = 'weather-particle fx-pale-haze';
    layer.appendChild(haze);
    
    // Sun
    const sun = document.createElement('div');
    sun.className = 'weather-particle fx-pale-sun';
    sun.style.top = '12%';
    sun.style.right = '15%';
    layer.appendChild(sun);
    
    // Dust motes
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'weather-particle fx-dust-mote';
        dust.style.left = `${Math.random() * 100}%`;
        dust.style.top = `${Math.random() * 100}%`;
        dust.style.animationDelay = `${Math.random() * 12}s`;
        dust.style.animationDuration = `${12 + Math.random() * 8}s`;
        layer.appendChild(dust);
    }
    
    return layer;
}

function createCityNight() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'city-night';
    
    const colors = ['#ff6b9d', '#4ecdc4', '#ffe66d', '#a855f7', '#f97316'];
    
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'weather-particle fx-night-overlay';
    layer.appendChild(overlay);
    
    // Stars (few, dim)
    const starCount = Math.floor(getParticleCount('stars') * 0.4);
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'weather-particle fx-city-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 40}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${3 + Math.random() * 3}s`;
        layer.appendChild(star);
    }
    
    // Neon puddles
    for (let i = 0; i < 4; i++) {
        const puddle = document.createElement('div');
        puddle.className = 'weather-particle fx-neon-puddle';
        puddle.style.setProperty('--neon-color', colors[i % colors.length]);
        puddle.style.bottom = `${5 + Math.random() * 12}%`;
        puddle.style.left = `${Math.random() * 80}%`;
        puddle.style.animationDelay = `${Math.random() * 3}s`;
        layer.appendChild(puddle);
    }
    
    // Distant lights
    for (let i = 0; i < 8; i++) {
        const light = document.createElement('div');
        light.className = 'weather-particle fx-distant-light';
        light.style.setProperty('--light-color', colors[Math.floor(Math.random() * colors.length)]);
        light.style.top = `${15 + Math.random() * 35}%`;
        light.style.left = `${Math.random() * 100}%`;
        light.style.animationDelay = `${Math.random() * 3}s`;
        light.style.animationDuration = `${2 + Math.random() * 2}s`;
        layer.appendChild(light);
    }
    
    return layer;
}

function createQuietNight() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'quiet-night';
    
    // Night sky
    const sky = document.createElement('div');
    sky.className = 'weather-particle fx-night-sky';
    layer.appendChild(sky);
    
    // Moon
    const moon = document.createElement('div');
    moon.className = 'weather-particle fx-moon';
    moon.style.top = '10%';
    moon.style.left = '20%';
    layer.appendChild(moon);
    
    // Stars
    const starCount = getParticleCount('stars');
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'weather-particle fx-bright-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 50}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${3 + Math.random() * 4}s`;
        star.style.width = `${1 + Math.random() * 1.5}px`;
        star.style.height = star.style.width;
        layer.appendChild(star);
    }
    
    // Fireflies
    const fireflyCount = getParticleCount('fireflies');
    for (let i = 0; i < fireflyCount; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'weather-particle fx-firefly';
        firefly.style.left = `${Math.random() * 80}%`;
        firefly.style.top = `${40 + Math.random() * 50}%`;
        firefly.style.animationDelay = `${Math.random() * 10}s`;
        firefly.style.animationDuration = `${6 + Math.random() * 6}s`;
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
    layer.className = 'weather-layer';
    layer.dataset.effect = 'indoor';
    
    // Warmth
    const warmth = document.createElement('div');
    warmth.className = 'weather-particle fx-indoor-warmth';
    layer.appendChild(warmth);
    
    // Light beams
    for (let i = 0; i < 2; i++) {
        const beam = document.createElement('div');
        beam.className = 'weather-particle fx-light-beam';
        beam.style.left = `${55 + i * 15}%`;
        beam.style.animationDelay = `${i * 2}s`;
        beam.style.animationDuration = `${10 + i * 2}s`;
        layer.appendChild(beam);
    }
    
    // Dust
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'weather-particle fx-indoor-dust';
        dust.style.left = `${45 + Math.random() * 45}%`;
        dust.style.animationDelay = `${Math.random() * 15}s`;
        dust.style.animationDuration = `${15 + Math.random() * 10}s`;
        layer.appendChild(dust);
    }
    
    return layer;
}

function createHorror() {
    const layer = document.createElement('div');
    layer.className = 'weather-layer';
    layer.dataset.effect = 'horror';
    
    // Vignette
    const vignette = document.createElement('div');
    vignette.className = 'weather-particle fx-horror-vignette';
    layer.appendChild(vignette);
    
    // Heartbeat pulse
    const pulse = document.createElement('div');
    pulse.className = 'weather-particle fx-horror-pulse';
    layer.appendChild(pulse);
    
    // Flicker
    const flicker = document.createElement('div');
    flicker.className = 'weather-particle fx-horror-flicker';
    layer.appendChild(flicker);
    
    // Grain
    const grain = document.createElement('div');
    grain.className = 'weather-particle fx-horror-grain';
    layer.appendChild(grain);
    
    // Creeping shadow
    const shadow = document.createElement('div');
    shadow.className = 'weather-particle fx-horror-shadow';
    shadow.style.top = '20%';
    shadow.style.left = '0';
    layer.appendChild(shadow);
    
    // Drips
    for (let i = 0; i < 2; i++) {
        const drip = document.createElement('div');
        drip.className = 'weather-particle fx-horror-drip';
        drip.style.left = `${25 + Math.random() * 50}%`;
        drip.style.animationDelay = `${i * 4 + Math.random() * 2}s`;
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
    if (!effectsContainer) return;
    
    if (type) {
        const layer = effectsContainer.querySelector(`[data-effect="${type}"]`);
        if (layer) layer.remove();
    } else {
        effectsContainer.innerHTML = '';
    }
}

function addEffect(type) {
    if (!effectsContainer || !EFFECT_CREATORS[type]) return;
    
    // Remove existing of same type
    clearEffects(type);
    
    const creator = EFFECT_CREATORS[type];
    if (creator) {
        const layer = creator();
        effectsContainer.appendChild(layer);
    }
}

/**
 * Update all effects based on current state
 */
function renderEffects() {
    if (!effectsContainer) return;
    
    clearEffects();
    
    if (!effectsEnabled) {
        effectsContainer.classList.add('effects-disabled');
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
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize weather effects system
 */
export function initWeatherEffects() {
    // Inject CSS
    if (!document.getElementById('tribunal-weather-effects-styles')) {
        const style = document.createElement('style');
        style.id = 'tribunal-weather-effects-styles';
        style.textContent = WEATHER_EFFECTS_CSS;
        document.head.appendChild(style);
    }
    
    // Create container
    if (!document.getElementById('tribunal-weather-effects')) {
        effectsContainer = document.createElement('div');
        effectsContainer.id = 'tribunal-weather-effects';
        document.body.insertBefore(effectsContainer, document.body.firstChild);
    } else {
        effectsContainer = document.getElementById('tribunal-weather-effects');
    }
    
    console.log('[WeatherEffects] Initialized');
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
