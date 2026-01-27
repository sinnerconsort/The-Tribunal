/**
 * Weather Effects Module - The Tribunal
 * CSS-based visual atmosphere effects
 * 
 * v5.1.0 - With event emitter for radio/ambient integration
 */

// ═══════════════════════════════════════════════════════════════
// EVENT EMITTER
// ═══════════════════════════════════════════════════════════════

const listeners = {
    weatherChange: [],
    periodChange: [],
    specialChange: [],
    anyChange: []
};

/**
 * Subscribe to weather changes
 * @param {string} event - 'weatherChange', 'periodChange', 'specialChange', or 'anyChange'
 * @param {function} callback - Called with { weather, period, special, intensity, previous }
 * @returns {function} Unsubscribe function
 */
export function onWeatherChange(event, callback) {
    if (!listeners[event]) {
        console.warn(`[WeatherEffects] Unknown event: ${event}, using 'anyChange'`);
        event = 'anyChange';
    }
    listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
        const idx = listeners[event].indexOf(callback);
        if (idx > -1) listeners[event].splice(idx, 1);
    };
}

/**
 * Convenience: subscribe to any weather/period/special change
 * @param {function} callback 
 * @returns {function} Unsubscribe
 */
export function subscribe(callback) {
    return onWeatherChange('anyChange', callback);
}

function emit(event, data) {
    listeners[event]?.forEach(cb => {
        try { cb(data); } catch (e) { console.error('[WeatherEffects] Listener error:', e); }
    });
    // Always emit anyChange too
    if (event !== 'anyChange') {
        listeners.anyChange?.forEach(cb => {
            try { cb(data); } catch (e) { console.error('[WeatherEffects] Listener error:', e); }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let effectsEnabled = true;
let currentWeather = null;
let currentPeriod = null;
let currentSpecial = null;
let effectIntensity = 'medium';

const PARTICLE_COUNTS = {
    light:  { rain: 15, snow: 12, fog: 3, debris: 6, dust: 6, stars: 15, fireflies: 5, lightning: 1, waves: 3, smoke: 4 },
    medium: { rain: 30, snow: 20, fog: 4, debris: 10, dust: 10, stars: 25, fireflies: 8, lightning: 2, waves: 4, smoke: 6 },
    heavy:  { rain: 50, snow: 30, fog: 5, debris: 15, dust: 15, stars: 35, fireflies: 12, lightning: 3, waves: 5, smoke: 8 }
};

function getParticleCount(type) {
    return PARTICLE_COUNTS[effectIntensity]?.[type] || PARTICLE_COUNTS.medium[type] || 10;
}

// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════

const WEATHER_CSS = `
.tribunal-weather-layer {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    pointer-events: none !important;
    overflow: hidden !important;
    z-index: 10 !important;
}

/* SNOW */
.fx-snowflake {
    position: absolute;
    color: white;
    text-shadow: 0 0 8px rgba(255,255,255,0.8);
    animation: snowfall linear infinite;
    will-change: transform;
}
@keyframes snowfall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 0.8; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

/* RAIN */
.fx-raindrop {
    position: absolute;
    width: 2px;
    background: linear-gradient(transparent, rgba(174, 194, 224, 0.8));
    animation: rainfall linear infinite;
    will-change: transform;
}
@keyframes rainfall {
    0% { transform: translateY(-30px); opacity: 0; }
    10% { opacity: 0.8; }
    100% { transform: translateY(100vh); opacity: 0.2; }
}

/* STORM */
.fx-storm-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(20, 25, 35, 0.3) 0%, rgba(15, 20, 30, 0.2) 100%);
}
.fx-storm-rain {
    position: absolute;
    width: 2px;
    background: linear-gradient(transparent, rgba(180, 200, 230, 0.9));
    animation: stormrain linear infinite;
    transform: rotate(15deg);
}
.fx-lightning {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0);
    animation: lightning-flash ease-out infinite;
}
@keyframes stormrain {
    0% { transform: translateY(-50px) rotate(15deg); opacity: 0; }
    10% { opacity: 0.9; }
    100% { transform: translateY(100vh) rotate(15deg); opacity: 0.3; }
}
@keyframes lightning-flash {
    0%, 100% { background: rgba(255, 255, 255, 0); }
    1% { background: rgba(200, 220, 255, 0.6); }
    2% { background: rgba(255, 255, 255, 0); }
    3% { background: rgba(180, 200, 240, 0.4); }
    4% { background: rgba(255, 255, 255, 0); }
}

/* FOG */
.fx-fog-layer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, 
        rgba(180, 190, 200, 0.08) 0%, 
        rgba(160, 170, 180, 0.12) 30%,
        rgba(140, 150, 160, 0.15) 60%,
        rgba(120, 130, 140, 0.1) 100%
    );
}
.fx-mist {
    position: absolute;
    width: 250%;
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(180, 190, 200, 0.2) 20%,
        rgba(160, 170, 180, 0.3) 50%,
        rgba(180, 190, 200, 0.2) 80%,
        transparent 100%
    );
    animation: mistdrift linear infinite;
}
@keyframes mistdrift {
    0% { transform: translateX(-60%); }
    100% { transform: translateX(10%); }
}

/* WIND */
.fx-windstreak {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    border-radius: 2px;
    animation: windstreak linear infinite;
}
.fx-debris {
    position: absolute;
    font-size: 10px;
    opacity: 0.6;
    animation: debrisfly linear infinite;
}
@keyframes windstreak {
    0% { transform: translateX(-200px); opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.3; }
    100% { transform: translateX(100vw); opacity: 0; }
}
@keyframes debrisfly {
    0% { transform: translate(-50px, 0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.7; }
    50% { transform: translate(50vw, 20px) rotate(180deg); }
    90% { opacity: 0.5; }
    100% { transform: translate(100vw, -10px) rotate(360deg); opacity: 0; }
}

/* WAVES */
.fx-wave {
    position: absolute;
    bottom: 0;
    width: 200%;
    height: 60px;
    background: linear-gradient(180deg,
        rgba(60, 80, 100, 0.3) 0%,
        rgba(40, 60, 80, 0.4) 50%,
        rgba(30, 50, 70, 0.2) 100%
    );
    border-radius: 100% 100% 0 0;
    animation: waveroll ease-in-out infinite;
}
.fx-wave-foam {
    position: absolute;
    bottom: 0;
    width: 150%;
    height: 8px;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 20%,
        rgba(255, 255, 255, 0.5) 50%,
        rgba(255, 255, 255, 0.3) 80%,
        transparent 100%
    );
    animation: foamroll ease-in-out infinite;
}
@keyframes waveroll {
    0%, 100% { transform: translateX(-25%) scaleY(1); }
    50% { transform: translateX(-15%) scaleY(1.2); }
}
@keyframes foamroll {
    0%, 100% { transform: translateX(-20%); opacity: 0.4; }
    50% { transform: translateX(-10%); opacity: 0.7; }
}

/* SMOKE */
.fx-smoke-wisp {
    position: absolute;
    width: 40px;
    height: 80px;
    background: radial-gradient(ellipse at center,
        rgba(180, 180, 180, 0.15) 0%,
        rgba(150, 150, 150, 0.08) 40%,
        transparent 70%
    );
    filter: blur(3px);
    animation: smokerise ease-out infinite;
}
@keyframes smokerise {
    0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
    20% { opacity: 0.4; }
    50% { transform: translateY(-60px) scale(1) rotate(15deg); opacity: 0.3; }
    80% { opacity: 0.15; }
    100% { transform: translateY(-120px) scale(1.5) rotate(-10deg); opacity: 0; }
}

/* DAY */
.fx-day-haze {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(255, 245, 200, 0.12) 0%, transparent 50%);
}
.fx-sun {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 240, 180, 0.5) 0%, rgba(255, 220, 100, 0.15) 50%, transparent 70%);
    animation: sunpulse 8s ease-in-out infinite;
}
.fx-dustmote {
    position: absolute;
    background: rgba(255, 245, 200, 0.6);
    border-radius: 50%;
    animation: dustfloat ease-in-out infinite;
}
@keyframes sunpulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}
@keyframes dustfloat {
    0%, 100% { transform: translate(0, 0); opacity: 0.3; }
    25% { transform: translate(15px, -20px); opacity: 0.6; }
    50% { transform: translate(25px, 5px); opacity: 0.4; }
    75% { transform: translate(10px, 15px); opacity: 0.5; }
}

/* NIGHT */
.fx-night-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(10, 15, 30, 0.12) 0%, rgba(20, 25, 40, 0.08) 100%);
}
.fx-star {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: twinkle ease-in-out infinite;
}
@keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
}

/* QUIET NIGHT */
.fx-night-sky {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(10, 15, 35, 0.1) 0%, rgba(15, 20, 40, 0.06) 50%, transparent 100%);
}
.fx-moon {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 240, 0.85) 0%, rgba(255, 255, 220, 0.3) 50%, transparent 70%);
    animation: moonglow 10s ease-in-out infinite;
}
.fx-firefly {
    position: absolute;
    background: radial-gradient(circle, rgba(180, 255, 100, 0.9) 0%, rgba(150, 255, 50, 0.3) 50%, transparent 70%);
    border-radius: 50%;
    animation: firefly ease-in-out infinite;
}
@keyframes moonglow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0.9; }
}
@keyframes firefly {
    0% { opacity: 0; transform: translate(0, 0); }
    20% { opacity: 0.9; }
    50% { opacity: 0.5; transform: translate(40px, -25px); }
    80% { opacity: 0.8; }
    100% { opacity: 0; transform: translate(70px, 15px); }
}

/* INDOOR */
.fx-indoor-warmth {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at 70% 30%, rgba(255, 240, 200, 0.12) 0%, transparent 60%);
}
.fx-light-beam {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 250, 220, 0.15) 0%, rgba(255, 245, 200, 0.08) 50%, transparent 100%);
    transform: skewX(-15deg);
    animation: beampulse ease-in-out infinite;
}
.fx-indoor-dust {
    position: absolute;
    background: rgba(255, 250, 220, 0.7);
    border-radius: 50%;
    animation: indoordust linear infinite;
}
@keyframes beampulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.25; }
}
@keyframes indoordust {
    0% { transform: translate(0, 100vh); opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.4; }
    100% { transform: translate(40px, -30px); opacity: 0; }
}

/* HORROR */
.fx-vignette {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, transparent 30%, rgba(30, 0, 0, 0.4) 100%);
}
.fx-heartbeat {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, rgba(100, 0, 0, 0.25) 0%, transparent 60%);
    animation: heartbeat 1.8s ease-in-out infinite;
}
.fx-blood-drip {
    position: absolute;
    width: 3px;
    background: linear-gradient(180deg, rgba(140, 20, 20, 0.85) 0%, rgba(100, 10, 10, 0.5) 100%);
    border-radius: 0 0 50% 50%;
    animation: blooddrip linear infinite;
}
.fx-horror-flicker {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0);
    animation: horrorflicker 4s steps(1) infinite;
}
@keyframes heartbeat {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    15% { opacity: 0.5; transform: scale(1.03); }
    30% { opacity: 0.2; transform: scale(1); }
    45% { opacity: 0.4; transform: scale(1.02); }
}
@keyframes blooddrip {
    0% { transform: translateY(-80px); height: 0; opacity: 0; }
    10% { height: 40px; opacity: 0.9; }
    90% { opacity: 0.6; }
    100% { transform: translateY(100vh); height: 60px; opacity: 0; }
}
@keyframes horrorflicker {
    0%, 100% { background: rgba(0, 0, 0, 0); }
    45% { background: rgba(0, 0, 0, 0); }
    46% { background: rgba(0, 0, 0, 0.15); }
    47% { background: rgba(0, 0, 0, 0); }
    48% { background: rgba(0, 0, 0, 0.1); }
    49% { background: rgba(0, 0, 0, 0); }
}

/* PALE */
.fx-pale-void {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, rgba(200, 210, 220, 0.2) 0%, rgba(180, 190, 200, 0.12) 50%, rgba(160, 170, 180, 0.06) 100%);
}
.fx-pale-static {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(220, 230, 240, 0.06) 2px,
        rgba(220, 230, 240, 0.06) 4px
    );
    animation: palestatic 0.15s linear infinite;
}
.fx-pale-shimmer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(220, 230, 240, 0.12) 50%, transparent 100%);
    animation: paleshimmer 10s ease-in-out infinite;
}
.fx-memory-wisp {
    position: absolute;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(200, 210, 220, 0.25) 0%, transparent 70%);
    border-radius: 50%;
    animation: memorywisp ease-in-out infinite;
}
.fx-thought-symbol {
    position: absolute;
    font-family: serif;
    font-size: 16px;
    color: rgba(180, 190, 200, 0.5);
    animation: thoughtsymbol ease-in-out infinite;
}
@keyframes palestatic {
    0% { opacity: 0.4; }
    50% { opacity: 0.6; }
    100% { opacity: 0.4; }
}
@keyframes paleshimmer {
    0%, 100% { transform: translateX(-100%); opacity: 0; }
    50% { transform: translateX(100%); opacity: 1; }
}
@keyframes memorywisp {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.4); opacity: 0.5; }
}
@keyframes thoughtsymbol {
    0%, 100% { opacity: 0; transform: translateY(0); }
    50% { opacity: 0.7; transform: translateY(-25px); }
}
`;

// ═══════════════════════════════════════════════════════════════
// EFFECT CREATORS
// ═══════════════════════════════════════════════════════════════

function createLayer(effectType) {
    const layer = document.createElement('div');
    layer.className = 'tribunal-weather-layer';
    layer.dataset.effect = effectType;
    return layer;
}

function createSnow() {
    const layer = createLayer('snow');
    const count = getParticleCount('snow');
    const flakes = ['❄', '❅', '❆', '•'];
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'fx-snowflake';
        flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.fontSize = `${8 + Math.random() * 14}px`;
        flake.style.animationDuration = `${6 + Math.random() * 8}s`;
        flake.style.animationDelay = `${Math.random() * 8}s`;
        layer.appendChild(flake);
    }
    return layer;
}

function createRain() {
    const layer = createLayer('rain');
    const count = getParticleCount('rain');
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'fx-raindrop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.height = `${15 + Math.random() * 25}px`;
        drop.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        layer.appendChild(drop);
    }
    return layer;
}

function createStorm() {
    const layer = createLayer('storm');
    const overlay = document.createElement('div');
    overlay.className = 'fx-storm-overlay';
    layer.appendChild(overlay);
    
    const rainCount = getParticleCount('rain') * 1.5;
    for (let i = 0; i < rainCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'fx-storm-rain';
        drop.style.left = `${Math.random() * 120 - 10}%`;
        drop.style.height = `${20 + Math.random() * 35}px`;
        drop.style.animationDuration = `${0.25 + Math.random() * 0.25}s`;
        drop.style.animationDelay = `${Math.random() * 1.5}s`;
        layer.appendChild(drop);
    }
    
    const lightningCount = getParticleCount('lightning');
    for (let i = 0; i < lightningCount; i++) {
        const lightning = document.createElement('div');
        lightning.className = 'fx-lightning';
        lightning.style.animationDuration = `${6 + Math.random() * 8}s`;
        lightning.style.animationDelay = `${i * 3 + Math.random() * 4}s`;
        layer.appendChild(lightning);
    }
    return layer;
}

function createFog() {
    const layer = createLayer('fog');
    const fogBase = document.createElement('div');
    fogBase.className = 'fx-fog-layer';
    layer.appendChild(fogBase);
    
    const count = getParticleCount('fog');
    for (let i = 0; i < count; i++) {
        const mist = document.createElement('div');
        mist.className = 'fx-mist';
        mist.style.top = `${10 + (i * 20) + Math.random() * 15}%`;
        mist.style.height = `${80 + Math.random() * 120}px`;
        mist.style.animationDuration = `${25 + Math.random() * 20}s`;
        mist.style.animationDelay = `${i * 3 + Math.random() * 5}s`;
        layer.appendChild(mist);
    }
    return layer;
}

function createWind() {
    const layer = createLayer('wind');
    const streakCount = getParticleCount('debris');
    
    for (let i = 0; i < streakCount; i++) {
        const streak = document.createElement('div');
        streak.className = 'fx-windstreak';
        streak.style.top = `${Math.random() * 100}%`;
        streak.style.width = `${60 + Math.random() * 100}px`;
        streak.style.height = `${1 + Math.random() * 2}px`;
        streak.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
        streak.style.animationDelay = `${Math.random() * 4}s`;
        layer.appendChild(streak);
    }
    
    const debrisChars = ['🍂', '🍃', '·', '∘', '○'];
    const debrisCount = Math.floor(streakCount / 2);
    for (let i = 0; i < debrisCount; i++) {
        const debris = document.createElement('div');
        debris.className = 'fx-debris';
        debris.textContent = debrisChars[Math.floor(Math.random() * debrisChars.length)];
        debris.style.top = `${20 + Math.random() * 60}%`;
        debris.style.animationDuration = `${3 + Math.random() * 3}s`;
        debris.style.animationDelay = `${Math.random() * 5}s`;
        layer.appendChild(debris);
    }
    return layer;
}

function createWaves() {
    const layer = createLayer('waves');
    const waveCount = getParticleCount('waves');
    
    for (let i = 0; i < waveCount; i++) {
        const wave = document.createElement('div');
        wave.className = 'fx-wave';
        wave.style.bottom = `${i * 15}px`;
        wave.style.animationDuration = `${4 + i}s`;
        wave.style.animationDelay = `${i * 0.5}s`;
        wave.style.opacity = `${0.4 - i * 0.08}`;
        layer.appendChild(wave);
        
        const foam = document.createElement('div');
        foam.className = 'fx-wave-foam';
        foam.style.bottom = `${i * 15 + 50}px`;
        foam.style.animationDuration = `${4 + i}s`;
        foam.style.animationDelay = `${i * 0.5 + 0.5}s`;
        layer.appendChild(foam);
    }
    return layer;
}

function createSmoke() {
    const layer = createLayer('smoke');
    const smokeCount = getParticleCount('smoke');
    
    for (let i = 0; i < smokeCount; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'fx-smoke-wisp';
        wisp.style.left = `${20 + Math.random() * 60}%`;
        wisp.style.bottom = `${5 + Math.random() * 20}%`;
        wisp.style.animationDuration = `${3 + Math.random() * 3}s`;
        wisp.style.animationDelay = `${Math.random() * 4}s`;
        layer.appendChild(wisp);
    }
    return layer;
}

function createDay() {
    const layer = createLayer('day');
    const haze = document.createElement('div');
    haze.className = 'fx-day-haze';
    layer.appendChild(haze);
    
    const sun = document.createElement('div');
    sun.className = 'fx-sun';
    sun.style.top = '5%';
    sun.style.right = '10%';
    sun.style.width = '120px';
    sun.style.height = '120px';
    layer.appendChild(sun);
    
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'fx-dustmote';
        dust.style.left = `${Math.random() * 100}%`;
        dust.style.top = `${Math.random() * 100}%`;
        dust.style.width = `${2 + Math.random() * 3}px`;
        dust.style.height = dust.style.width;
        dust.style.animationDuration = `${5 + Math.random() * 6}s`;
        dust.style.animationDelay = `${Math.random() * 5}s`;
        layer.appendChild(dust);
    }
    return layer;
}

function createCityNight() {
    const layer = createLayer('city-night');
    const overlay = document.createElement('div');
    overlay.className = 'fx-night-overlay';
    layer.appendChild(overlay);
    
    const starCount = getParticleCount('stars');
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'fx-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 35}%`;
        star.style.width = `${1 + Math.random() * 2}px`;
        star.style.height = star.style.width;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        layer.appendChild(star);
    }
    return layer;
}

function createQuietNight() {
    const layer = createLayer('quiet-night');
    const sky = document.createElement('div');
    sky.className = 'fx-night-sky';
    layer.appendChild(sky);
    
    const moon = document.createElement('div');
    moon.className = 'fx-moon';
    moon.style.top = '8%';
    moon.style.left = '15%';
    moon.style.width = '50px';
    moon.style.height = '50px';
    layer.appendChild(moon);
    
    const starCount = getParticleCount('stars');
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'fx-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 45}%`;
        star.style.width = `${1 + Math.random() * 2}px`;
        star.style.height = star.style.width;
        star.style.animationDuration = `${3 + Math.random() * 4}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        layer.appendChild(star);
    }
    
    const fireflyCount = getParticleCount('fireflies');
    for (let i = 0; i < fireflyCount; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'fx-firefly';
        firefly.style.left = `${Math.random() * 90}%`;
        firefly.style.top = `${35 + Math.random() * 55}%`;
        firefly.style.width = `${6 + Math.random() * 6}px`;
        firefly.style.height = firefly.style.width;
        firefly.style.animationDuration = `${4 + Math.random() * 5}s`;
        firefly.style.animationDelay = `${Math.random() * 8}s`;
        layer.appendChild(firefly);
    }
    return layer;
}

function createIndoor() {
    const layer = createLayer('indoor');
    const warmth = document.createElement('div');
    warmth.className = 'fx-indoor-warmth';
    layer.appendChild(warmth);
    
    for (let i = 0; i < 2; i++) {
        const beam = document.createElement('div');
        beam.className = 'fx-light-beam';
        beam.style.left = `${20 + i * 40}%`;
        beam.style.width = `${50 + Math.random() * 40}px`;
        beam.style.animationDuration = `${5 + Math.random() * 4}s`;
        beam.style.animationDelay = `${i * 2}s`;
        layer.appendChild(beam);
    }
    
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'fx-indoor-dust';
        dust.style.left = `${20 + Math.random() * 60}%`;
        dust.style.width = `${2 + Math.random() * 2}px`;
        dust.style.height = dust.style.width;
        dust.style.animationDuration = `${10 + Math.random() * 10}s`;
        dust.style.animationDelay = `${Math.random() * 12}s`;
        layer.appendChild(dust);
    }
    return layer;
}

function createHorror() {
    const layer = createLayer('horror');
    
    const vignette = document.createElement('div');
    vignette.className = 'fx-vignette';
    layer.appendChild(vignette);
    
    const heartbeat = document.createElement('div');
    heartbeat.className = 'fx-heartbeat';
    layer.appendChild(heartbeat);
    
    const flicker = document.createElement('div');
    flicker.className = 'fx-horror-flicker';
    layer.appendChild(flicker);
    
    for (let i = 0; i < 6; i++) {
        const drip = document.createElement('div');
        drip.className = 'fx-blood-drip';
        drip.style.left = `${Math.random() * 100}%`;
        drip.style.animationDuration = `${3 + Math.random() * 4}s`;
        drip.style.animationDelay = `${Math.random() * 6}s`;
        layer.appendChild(drip);
    }
    return layer;
}

function createPale() {
    const layer = createLayer('pale');
    
    const voidEl = document.createElement('div');
    voidEl.className = 'fx-pale-void';
    layer.appendChild(voidEl);
    
    const staticEl = document.createElement('div');
    staticEl.className = 'fx-pale-static';
    layer.appendChild(staticEl);
    
    for (let i = 0; i < 3; i++) {
        const shimmer = document.createElement('div');
        shimmer.className = 'fx-pale-shimmer';
        shimmer.style.animationDelay = `${i * 3}s`;
        layer.appendChild(shimmer);
    }
    
    for (let i = 0; i < 8; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'fx-memory-wisp';
        wisp.style.left = `${Math.random() * 85}%`;
        wisp.style.top = `${Math.random() * 85}%`;
        wisp.style.animationDuration = `${10 + Math.random() * 8}s`;
        wisp.style.animationDelay = `${Math.random() * 10}s`;
        layer.appendChild(wisp);
    }
    
    const symbols = ['◆', '◇', '?', '...', '∴', '○', '—', '※', '◈'];
    for (let i = 0; i < 10; i++) {
        const sym = document.createElement('div');
        sym.className = 'fx-thought-symbol';
        sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        sym.style.left = `${Math.random() * 90}%`;
        sym.style.top = `${Math.random() * 90}%`;
        sym.style.animationDuration = `${8 + Math.random() * 6}s`;
        sym.style.animationDelay = `${Math.random() * 12}s`;
        layer.appendChild(sym);
    }
    return layer;
}

// ═══════════════════════════════════════════════════════════════
// EFFECT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const EFFECT_CREATORS = {
    rain: createRain,
    snow: createSnow,
    storm: createStorm,
    fog: createFog,
    wind: createWind,
    waves: createWaves,
    smoke: createSmoke,
    clear: null,
    day: createDay,
    'city-night': createCityNight,
    'quiet-night': createQuietNight,
    pale: createPale,
    indoor: createIndoor,
    horror: createHorror
};

function clearEffects(type = null) {
    const selector = type 
        ? `.tribunal-weather-layer[data-effect="${type}"]` 
        : '.tribunal-weather-layer';
    document.querySelectorAll(selector).forEach(l => l.remove());
}

function addEffect(type) {
    if (!type || typeof type !== 'string') return false;
    const creator = EFFECT_CREATORS[type];
    if (!creator) return false;
    
    clearEffects(type);
    const layer = creator();
    if (layer) {
        document.body.appendChild(layer);
        return true;
    }
    return false;
}

function renderEffects() {
    if (!effectsEnabled) {
        clearEffects();
        return;
    }
    
    clearEffects();
    
    if (currentSpecial) {
        addEffect(currentSpecial);
        return;
    }
    
    if (currentWeather && currentWeather !== 'clear') {
        addEffect(currentWeather);
    }
    
    if (currentPeriod && currentPeriod !== 'day') {
        addEffect(currentPeriod);
    } else if (currentPeriod === 'day' && (!currentWeather || currentWeather === 'clear')) {
        addEffect('day');
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════

const WEATHER_PATTERNS = {
    storm: /\b(storm|stormy|thunder|thunderstorm|lightning|tempest|gale|downpour|torrential)\b/i,
    rain: /\b(rain|raining|rainy|drizzle|drizzling|shower|showers|wet|damp|precipitation)\b/i,
    snow: /\b(snow|snowing|snowy|blizzard|flurries|frost|frosted|freezing|ice|icy|sleet)\b/i,
    fog: /\b(fog|foggy|mist|misty|haze|hazy|murky|smog|overcast)\b/i,
    wind: /\b(wind|windy|gust|gusty|breezy|breeze)\b/i,
    waves: /\b(wave|waves|ocean|sea|harbor|harbour|dock|pier|beach|shore|coastal|tide)\b/i,
    smoke: /\b(smoke|smoking|cigarette|cigar|smok|exhale|ash|ashtray)\b/i,
    clear: /\b(clear|sunny|bright|cloudless|fair|beautiful day)\b/i
};

const PERIOD_PATTERNS = {
    'city-night': /\b(city night|urban night|neon|streetlight|downtown at night)\b/i,
    'quiet-night': /\b(night|nighttime|evening|dusk|dark|moonlight|moonlit|starry|midnight)\b/i,
    'day': /\b(day|daytime|morning|afternoon|noon|daylight|dawn|sunrise|sunset)\b/i,
    'indoor': /\b(inside|indoor|indoors|room|office|apartment|house|home|building|interior)\b/i
};

const SPECIAL_PATTERNS = {
    pale: /\b(pale|void|unconscious|dreaming|limbo|between|threshold|nowhere|dissociat)\b/i,
    horror: /\b(horror|dread|terror|fear|blood|bloody|murder|death|dead|corpse|scream|knife|stab)\b/i
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function setWeather(weatherOrState) {
    const previous = { weather: currentWeather, period: currentPeriod, special: currentSpecial };
    
    if (weatherOrState && typeof weatherOrState === 'object') {
        if ('weather' in weatherOrState) currentWeather = weatherOrState.weather || null;
        if ('period' in weatherOrState) currentPeriod = weatherOrState.period || null;
        if ('special' in weatherOrState) currentSpecial = weatherOrState.special || null;
    } else if (typeof weatherOrState === 'string') {
        currentWeather = weatherOrState || null;
    }
    
    renderEffects();
    
    // Emit events
    if (previous.weather !== currentWeather) {
        emit('weatherChange', { weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity, previous });
    }
}

export function setPeriod(period) {
    const previous = { weather: currentWeather, period: currentPeriod, special: currentSpecial };
    currentPeriod = period;
    renderEffects();
    
    if (previous.period !== currentPeriod) {
        emit('periodChange', { weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity, previous });
    }
}

export function setSpecialEffect(effect) {
    const previous = { weather: currentWeather, period: currentPeriod, special: currentSpecial };
    currentSpecial = effect;
    renderEffects();
    
    if (previous.special !== currentSpecial) {
        emit('specialChange', { weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity, previous });
    }
}

export function setIntensity(intensity) {
    if (['light', 'medium', 'heavy'].includes(intensity)) {
        effectIntensity = intensity;
        renderEffects();
    }
}

export function setEnabled(enabled) {
    effectsEnabled = enabled;
    renderEffects();
}

export function getState() {
    return { enabled: effectsEnabled, weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity };
}

export const getWeatherEffectsState = getState;

export function triggerPale() { setSpecialEffect('pale'); }
export function exitPale() { if (currentSpecial === 'pale') setSpecialEffect(null); }
export function isInPale() { return currentSpecial === 'pale'; }

export function triggerHorror(duration = 15000) {
    setSpecialEffect('horror');
    if (duration > 0) setTimeout(() => { if (currentSpecial === 'horror') setSpecialEffect(null); }, duration);
}
export function exitHorror() { if (currentSpecial === 'horror') setSpecialEffect(null); }

export function processMessageForWeather(message) {
    if (!message || typeof message !== 'string') return null;
    
    for (const [effect, pattern] of Object.entries(SPECIAL_PATTERNS)) {
        if (pattern.test(message)) {
            setSpecialEffect(effect);
            return { type: 'special', value: effect };
        }
    }
    
    for (const [weather, pattern] of Object.entries(WEATHER_PATTERNS)) {
        if (pattern.test(message)) {
            setWeather(weather);
            return { type: 'weather', value: weather };
        }
    }
    
    for (const [period, pattern] of Object.entries(PERIOD_PATTERNS)) {
        if (pattern.test(message)) {
            setPeriod(period);
            return { type: 'period', value: period };
        }
    }
    
    return null;
}

export const setWeatherState = setWeather;
export const setEffectsEnabled = setEnabled;
export const setEffectsIntensity = setIntensity;

export function initWeatherEffects() {
    if (!document.getElementById('tribunal-weather-css')) {
        const style = document.createElement('style');
        style.id = 'tribunal-weather-css';
        style.textContent = WEATHER_CSS;
        document.head.appendChild(style);
    }
    return true;
}

export function testEffect(effectType) {
    if (!document.getElementById('tribunal-weather-css')) initWeatherEffects();
    clearEffects();
    currentWeather = null;
    currentPeriod = null;
    currentSpecial = null;
    if (!effectType || effectType === 'clear') return true;
    return addEffect(effectType);
}

export function getAvailableEffects() {
    return {
        weather: ['rain', 'snow', 'storm', 'fog', 'wind', 'waves', 'smoke', 'clear'],
        period: ['day', 'city-night', 'quiet-night', 'indoor'],
        special: ['pale', 'horror']
    };
}

export default {
    init: initWeatherEffects,
    setWeather, setPeriod, setSpecialEffect, setIntensity, setEnabled, getState,
    triggerPale, exitPale, isInPale, triggerHorror, exitHorror,
    processMessageForWeather, testEffect, getAvailableEffects,
    onWeatherChange, subscribe,
    getWeatherEffectsState: getState,
    setWeatherState: setWeather,
    setEffectsEnabled: setEnabled,
    setEffectsIntensity: setIntensity
};
