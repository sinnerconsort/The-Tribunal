/**
 * Weather Effects Module - The Tribunal
 * Clean CSS-class based implementation
 * 
 * FIXED: setWeather now handles object format from settings panel
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let effectsEnabled = true;
let currentWeather = 'clear';
let currentPeriod = 'day';
let currentSpecial = null;
let effectIntensity = 'medium';

// Particle counts - MOBILE OPTIMIZED (reduced for performance)
const PARTICLE_COUNTS = {
    light:  { rain: 15, snow: 12, fog: 2, debris: 4, dust: 6, stars: 12, fireflies: 4 },
    medium: { rain: 25, snow: 20, fog: 3, debris: 8, dust: 10, stars: 20, fireflies: 6 },
    heavy:  { rain: 40, snow: 30, fog: 4, debris: 12, dust: 15, stars: 30, fireflies: 8 }
};

function getParticleCount(type) {
    return PARTICLE_COUNTS[effectIntensity]?.[type] || PARTICLE_COUNTS.medium[type] || 10;
}

// ═══════════════════════════════════════════════════════════════
// CSS - All styles in one place
// ═══════════════════════════════════════════════════════════════

const WEATHER_CSS = `
/* Base layer - applies to all effects */
.tribunal-weather-layer {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
    overflow: hidden !important;
    z-index: 1 !important;
}

/* ═══════════════════════════════════════════════════════════════ */
/* SNOW */
/* ═══════════════════════════════════════════════════════════════ */
.fx-snowflake {
    position: absolute;
    color: white;
    text-shadow: 0 0 8px rgba(255,255,255,0.8);
    animation: snowfall linear infinite;
    will-change: transform, opacity;
}
@keyframes snowfall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 0.8; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* RAIN */
/* ═══════════════════════════════════════════════════════════════ */
.fx-raindrop {
    position: absolute;
    width: 2px;
    background: linear-gradient(transparent, rgba(174, 194, 224, 0.8));
    animation: rainfall linear infinite;
    will-change: transform, opacity;
}
@keyframes rainfall {
    0% { transform: translateY(-30px); opacity: 0; }
    10% { opacity: 0.8; }
    100% { transform: translateY(100vh); opacity: 0.2; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* FOG */
/* ═══════════════════════════════════════════════════════════════ */
.fx-mist {
    position: absolute;
    width: 200%;
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(200, 210, 220, 0.15) 25%,
        rgba(200, 210, 220, 0.2) 50%,
        rgba(200, 210, 220, 0.15) 75%,
        transparent 100%
    );
    animation: mistdrift linear infinite;
}
@keyframes mistdrift {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
}

/* ═══════════════════════════════════════════════════════════════ */
/* WIND */
/* ═══════════════════════════════════════════════════════════════ */
.fx-windstreak {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    border-radius: 2px;
    animation: windstreak linear infinite;
}
@keyframes windstreak {
    0% { transform: translateX(0); opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.4; }
    100% { transform: translateX(calc(100vw + 200px)); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* DAY */
/* ═══════════════════════════════════════════════════════════════ */
.fx-day-haze {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(255, 245, 200, 0.1) 0%, transparent 60%);
}
.fx-sun {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 240, 180, 0.6) 0%, rgba(255, 220, 100, 0.2) 40%, transparent 70%);
    animation: sunpulse 8s ease-in-out infinite;
}
.fx-dustmote {
    position: absolute;
    background: rgba(255, 245, 200, 0.7);
    border-radius: 50%;
    animation: dustfloat ease-in-out infinite;
}
@keyframes sunpulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
}
@keyframes dustfloat {
    0%, 100% { transform: translate(0, 0); opacity: 0.4; }
    25% { transform: translate(10px, -15px); opacity: 0.7; }
    50% { transform: translate(20px, 5px); opacity: 0.5; }
    75% { transform: translate(5px, 10px); opacity: 0.6; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* CITY NIGHT */
/* ═══════════════════════════════════════════════════════════════ */
.fx-night-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(15, 20, 40, 0.15) 0%, rgba(30, 25, 50, 0.1) 100%);
}
.fx-city-star {
    position: absolute;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    animation: twinkle ease-in-out infinite;
}
.fx-neon-puddle {
    position: absolute;
    border-radius: 50%;
    filter: blur(4px);
    animation: neonpulse ease-in-out infinite;
}
.fx-distant-light {
    position: absolute;
    border-radius: 50%;
    filter: blur(2px);
    animation: distantglow ease-in-out infinite;
}
@keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.9; }
}
@keyframes neonpulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.4; }
}
@keyframes distantglow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.3); }
}

/* ═══════════════════════════════════════════════════════════════ */
/* QUIET NIGHT */
/* ═══════════════════════════════════════════════════════════════ */
.fx-night-sky {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(180deg, rgba(10, 15, 35, 0.12) 0%, rgba(20, 25, 50, 0.08) 50%, transparent 100%);
}
.fx-moon {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 240, 0.9) 0%, rgba(255, 255, 220, 0.4) 50%, transparent 70%);
    animation: moonglow 10s ease-in-out infinite;
}
.fx-bright-star {
    position: absolute;
    background: white;
    border-radius: 50%;
    animation: brightstar ease-in-out infinite;
}
.fx-firefly {
    position: absolute;
    background: radial-gradient(circle, rgba(180, 255, 100, 0.9) 0%, rgba(150, 255, 50, 0.4) 50%, transparent 70%);
    border-radius: 50%;
    animation: firefly ease-in-out infinite;
}
@keyframes moonglow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0.9; }
}
@keyframes brightstar {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
}
@keyframes firefly {
    0% { opacity: 0; transform: translate(0, 0); }
    20% { opacity: 0.9; }
    50% { opacity: 0.6; transform: translate(30px, -20px); }
    80% { opacity: 0.8; }
    100% { opacity: 0; transform: translate(60px, 10px); }
}

/* ═══════════════════════════════════════════════════════════════ */
/* INDOOR */
/* ═══════════════════════════════════════════════════════════════ */
.fx-indoor-warmth {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at 70% 30%, rgba(255, 240, 200, 0.1) 0%, transparent 60%);
}
.fx-light-beam {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 250, 220, 0.18) 0%, rgba(255, 245, 200, 0.1) 50%, transparent 100%);
    transform: skewX(-15deg);
    animation: beampulse ease-in-out infinite;
}
.fx-indoor-dust {
    position: absolute;
    background: rgba(255, 250, 220, 0.8);
    border-radius: 50%;
    animation: indoordust linear infinite;
}
@keyframes beampulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.2; }
}
@keyframes indoordust {
    0% { transform: translate(0, 100vh); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.5; }
    100% { transform: translate(30px, -20px); opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* HORROR */
/* ═══════════════════════════════════════════════════════════════ */
.fx-vignette {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(20, 0, 0, 0.3) 100%);
}
.fx-heartbeat {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, rgba(80, 0, 0, 0.35) 0%, transparent 70%);
    animation: heartbeat 2s ease-in-out infinite;
}
.fx-blood-drip {
    position: absolute;
    width: 3px;
    background: linear-gradient(180deg, rgba(120, 20, 20, 0.9) 0%, rgba(80, 10, 10, 0.6) 100%);
    border-radius: 0 0 50% 50%;
    animation: blooddrip linear infinite;
}
@keyframes heartbeat {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    15% { opacity: 0.4; transform: scale(1.02); }
    30% { opacity: 0.2; transform: scale(1); }
    45% { opacity: 0.35; transform: scale(1.015); }
}
@keyframes blooddrip {
    0% { transform: translateY(-100px); height: 0; opacity: 0; }
    10% { height: 30px; opacity: 0.8; }
    90% { opacity: 0.6; }
    100% { transform: translateY(100vh); height: 50px; opacity: 0; }
}

/* ═══════════════════════════════════════════════════════════════ */
/* PALE */
/* ═══════════════════════════════════════════════════════════════ */
.fx-pale-void {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, rgba(180, 190, 200, 0.15) 0%, rgba(150, 160, 170, 0.1) 50%, transparent 100%);
}
.fx-pale-static {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(200, 210, 220, 0.03) 2px,
        rgba(200, 210, 220, 0.03) 4px
    );
    animation: palestatic 0.1s linear infinite;
}
.fx-pale-shimmer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(200, 210, 220, 0.08) 50%, transparent 100%);
    animation: paleshimmer 12s ease-in-out infinite;
}
.fx-memory-wisp {
    position: absolute;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(180, 190, 200, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    animation: memorywisp ease-in-out infinite;
}
.fx-thought-symbol {
    position: absolute;
    font-family: serif;
    font-size: 14px;
    color: rgba(150, 160, 170, 0.4);
    animation: thoughtsymbol ease-in-out infinite;
}
@keyframes palestatic {
    0% { opacity: 0.3; }
    50% { opacity: 0.5; }
    100% { opacity: 0.3; }
}
@keyframes paleshimmer {
    0%, 100% { transform: translateX(-100%); opacity: 0; }
    50% { transform: translateX(100%); opacity: 1; }
}
@keyframes memorywisp {
    0%, 100% { transform: scale(1); opacity: 0.2; }
    50% { transform: scale(1.5); opacity: 0.4; }
}
@keyframes thoughtsymbol {
    0%, 100% { opacity: 0; transform: translateY(0); }
    50% { opacity: 0.6; transform: translateY(-20px); }
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
        flake.style.fontSize = `${8 + Math.random() * 12}px`;
        flake.style.animationDuration = `${8 + Math.random() * 8}s`;
        flake.style.animationDelay = `${Math.random() * 10}s`;
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

function createFog() {
    const layer = createLayer('fog');
    const count = getParticleCount('fog');
    
    for (let i = 0; i < count; i++) {
        const mist = document.createElement('div');
        mist.className = 'fx-mist';
        mist.style.top = `${20 + Math.random() * 60}%`;
        mist.style.height = `${100 + Math.random() * 150}px`;
        mist.style.animationDuration = `${20 + Math.random() * 20}s`;
        mist.style.animationDelay = `${Math.random() * 10}s`;
        mist.style.opacity = `${0.1 + Math.random() * 0.15}`;
        layer.appendChild(mist);
    }
    return layer;
}

function createWind() {
    const layer = createLayer('wind');
    const count = getParticleCount('debris');
    
    for (let i = 0; i < count; i++) {
        const streak = document.createElement('div');
        streak.className = 'fx-windstreak';
        streak.style.top = `${Math.random() * 100}%`;
        streak.style.left = `-200px`;
        streak.style.width = `${80 + Math.random() * 120}px`;
        streak.style.height = `${1 + Math.random() * 2}px`;
        streak.style.animationDuration = `${1 + Math.random() * 1.5}s`;
        streak.style.animationDelay = `${Math.random() * 5}s`;
        layer.appendChild(streak);
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
    sun.style.width = '150px';
    sun.style.height = '150px';
    layer.appendChild(sun);
    
    const dustCount = getParticleCount('dust');
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'fx-dustmote';
        dust.style.left = `${Math.random() * 100}%`;
        dust.style.top = `${Math.random() * 100}%`;
        dust.style.width = `${2 + Math.random() * 3}px`;
        dust.style.height = dust.style.width;
        dust.style.animationDuration = `${4 + Math.random() * 6}s`;
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
        star.className = 'fx-city-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 40}%`;
        star.style.width = `${1 + Math.random() * 2}px`;
        star.style.height = star.style.width;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        layer.appendChild(star);
    }
    
    const neonColors = ['#ff00ff', '#00ffff', '#ff6600', '#00ff66'];
    for (let i = 0; i < 4; i++) {
        const puddle = document.createElement('div');
        puddle.className = 'fx-neon-puddle';
        puddle.style.left = `${10 + Math.random() * 80}%`;
        puddle.style.bottom = `${5 + Math.random() * 15}%`;
        puddle.style.width = `${30 + Math.random() * 50}px`;
        puddle.style.height = `${10 + Math.random() * 20}px`;
        puddle.style.background = neonColors[i];
        puddle.style.animationDuration = `${3 + Math.random() * 3}s`;
        puddle.style.animationDelay = `${Math.random() * 3}s`;
        layer.appendChild(puddle);
    }
    
    for (let i = 0; i < 6; i++) {
        const light = document.createElement('div');
        light.className = 'fx-distant-light';
        light.style.left = `${Math.random() * 100}%`;
        light.style.top = `${50 + Math.random() * 30}%`;
        light.style.width = `${4 + Math.random() * 6}px`;
        light.style.height = light.style.width;
        light.style.background = `rgba(255, ${200 + Math.random() * 55}, ${150 + Math.random() * 100}, 0.8)`;
        light.style.animationDuration = `${2 + Math.random() * 4}s`;
        light.style.animationDelay = `${Math.random() * 4}s`;
        layer.appendChild(light);
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
    moon.style.width = '60px';
    moon.style.height = '60px';
    layer.appendChild(moon);
    
    const starCount = getParticleCount('stars');
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'fx-bright-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 50}%`;
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
        firefly.style.top = `${40 + Math.random() * 50}%`;
        firefly.style.width = `${6 + Math.random() * 6}px`;
        firefly.style.height = firefly.style.width;
        firefly.style.animationDuration = `${4 + Math.random() * 4}s`;
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
        beam.style.width = `${60 + Math.random() * 40}px`;
        beam.style.animationDuration = `${6 + Math.random() * 4}s`;
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
        dust.style.animationDuration = `${8 + Math.random() * 8}s`;
        dust.style.animationDelay = `${Math.random() * 10}s`;
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
    
    for (let i = 0; i < 5; i++) {
        const drip = document.createElement('div');
        drip.className = 'fx-blood-drip';
        drip.style.left = `${Math.random() * 100}%`;
        drip.style.animationDuration = `${4 + Math.random() * 4}s`;
        drip.style.animationDelay = `${Math.random() * 8}s`;
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
        shimmer.style.animationDelay = `${i * 4}s`;
        layer.appendChild(shimmer);
    }
    
    for (let i = 0; i < 6; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'fx-memory-wisp';
        wisp.style.left = `${Math.random() * 90}%`;
        wisp.style.top = `${Math.random() * 90}%`;
        wisp.style.animationDuration = `${12 + Math.random() * 8}s`;
        wisp.style.animationDelay = `${Math.random() * 12}s`;
        layer.appendChild(wisp);
    }
    
    const symbols = ['◆', '◇', '?', '...', '∴', '○', '—', '※'];
    for (let i = 0; i < 8; i++) {
        const sym = document.createElement('div');
        sym.className = 'fx-thought-symbol';
        sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        sym.style.left = `${Math.random() * 90}%`;
        sym.style.top = `${Math.random() * 90}%`;
        sym.style.animationDuration = `${10 + Math.random() * 8}s`;
        sym.style.animationDelay = `${Math.random() * 15}s`;
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
    fog: createFog,
    wind: createWind,
    clear: null,
    day: createDay,
    'city-night': createCityNight,
    'quiet-night': createQuietNight,
    pale: createPale,
    indoor: createIndoor,
    horror: createHorror
};

function clearEffects(type = null) {
    if (type) {
        document.querySelectorAll(`.tribunal-weather-layer[data-effect="${type}"]`).forEach(l => l.remove());
    } else {
        document.querySelectorAll('.tribunal-weather-layer').forEach(l => l.remove());
    }
}

function addEffect(type) {
    console.log('[WeatherEffects] addEffect:', type);
    
    const creator = EFFECT_CREATORS[type];
    if (!creator) {
        console.log('[WeatherEffects] No creator for:', type);
        return;
    }
    
    clearEffects(type);
    
    const layer = creator();
    if (layer) {
        document.body.appendChild(layer);
        console.log('[WeatherEffects] Added to body:', type);
    }
}

function renderEffects() {
    console.log('[WeatherEffects] renderEffects - enabled:', effectsEnabled, 
                'weather:', currentWeather, 'period:', currentPeriod, 'special:', currentSpecial);
    
    if (!effectsEnabled) {
        clearEffects();
        return;
    }
    
    clearEffects();
    
    // Special effect overrides everything
    if (currentSpecial) {
        addEffect(currentSpecial);
        return;
    }
    
    // Weather effect
    if (currentWeather && currentWeather !== 'clear') {
        addEffect(currentWeather);
    }
    
    // Period effect
    if (currentPeriod && currentPeriod !== 'day') {
        addEffect(currentPeriod);
    } else if (currentPeriod === 'day' && currentWeather === 'clear') {
        addEffect('day');
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API - FIXED TO HANDLE OBJECT FORMAT
// ═══════════════════════════════════════════════════════════════

/**
 * Set weather state - handles both string and object formats
 * @param {string|object} weatherOrState - Either a weather string like 'rain' 
 *                                         or an object like { weather: 'rain', period: 'night' }
 */
export function setWeather(weatherOrState) {
    console.log('[WeatherEffects] setWeather called with:', weatherOrState);
    
    // Handle object format from settings panel: { weather, period, special }
    if (typeof weatherOrState === 'object' && weatherOrState !== null) {
        if ('weather' in weatherOrState) {
            currentWeather = weatherOrState.weather || 'clear';
        }
        if ('period' in weatherOrState) {
            currentPeriod = weatherOrState.period || 'day';
        }
        if ('special' in weatherOrState) {
            currentSpecial = weatherOrState.special;
        }
    } else {
        // Handle string format: setWeather('rain')
        currentWeather = weatherOrState || 'clear';
    }
    
    renderEffects();
}

export function setPeriod(period) {
    currentPeriod = period;
    renderEffects();
}

export function setSpecialEffect(effect) {
    currentSpecial = effect;
    renderEffects();
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
    return {
        enabled: effectsEnabled,
        weather: currentWeather,
        period: currentPeriod,
        special: currentSpecial,
        intensity: effectIntensity
    };
}

// Alias for compatibility
export const getWeatherEffectsState = getState;

export function triggerPale() {
    setSpecialEffect('pale');
}

export function exitPale() {
    if (currentSpecial === 'pale') {
        setSpecialEffect(null);
    }
}

export function isInPale() {
    return currentSpecial === 'pale';
}

export function triggerHorror(duration = 15000) {
    setSpecialEffect('horror');
    
    // Auto-clear horror after duration
    if (duration > 0) {
        setTimeout(() => {
            if (currentSpecial === 'horror') {
                setSpecialEffect(null);
            }
        }, duration);
    }
}

export function exitHorror() {
    if (currentSpecial === 'horror') {
        setSpecialEffect(null);
    }
}

// Process message for weather keywords
export function processMessageForWeather(message) {
    if (!message || typeof message !== 'string') return null;
    
    const text = message.toLowerCase();
    
    // Weather detection
    const weatherPatterns = {
        rain: /\b(rain|raining|rainy|downpour|drizzle|storm|stormy|thunderstorm)\b/,
        snow: /\b(snow|snowing|snowy|blizzard|flurries|frost|frosted)\b/,
        fog: /\b(fog|foggy|mist|misty|haze|hazy)\b/,
        wind: /\b(wind|windy|gust|gusty|breezy)\b/,
        clear: /\b(clear|sunny|bright|cloudless)\b/
    };
    
    for (const [weather, pattern] of Object.entries(weatherPatterns)) {
        if (pattern.test(text)) {
            setWeather(weather);
            return weather;
        }
    }
    
    return null;
}

// Aliases for compatibility
export const setWeatherState = setWeather;
export const setEffectsEnabled = setEnabled;
export const setEffectsIntensity = setIntensity;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initWeatherEffects() {
    // Inject CSS
    if (!document.getElementById('tribunal-weather-css')) {
        const style = document.createElement('style');
        style.id = 'tribunal-weather-css';
        style.textContent = WEATHER_CSS;
        document.head.appendChild(style);
        console.log('[WeatherEffects] CSS injected');
    }
    
    // Add debug indicator
    if (!document.getElementById('weather-init-indicator')) {
        const dot = document.createElement('div');
        dot.id = 'weather-init-indicator';
        dot.style.cssText = 'position:fixed;bottom:5px;left:5px;width:8px;height:8px;background:#0f0;border-radius:50%;z-index:99999;pointer-events:none;';
        document.body.appendChild(dot);
    }
    
    console.log('[WeatherEffects] Initialized');
    return true;
}

// Test function for settings panel
export function testEffect(effectType) {
    console.log('[WeatherEffects] Testing:', effectType);
    
    if (!document.getElementById('tribunal-weather-css')) {
        initWeatherEffects();
    }
    
    clearEffects();
    
    if (effectType === 'clear') {
        return;
    }
    
    // Handle both direct effect types and categorized input
    if (EFFECT_CREATORS[effectType]) {
        addEffect(effectType);
    } else {
        console.warn('[WeatherEffects] Unknown effect type:', effectType);
    }
}

export default {
    init: initWeatherEffects,
    setWeather,
    setPeriod,
    setSpecialEffect,
    setIntensity,
    setEnabled,
    getState,
    triggerPale,
    exitPale,
    isInPale,
    triggerHorror,
    exitHorror,
    processMessageForWeather,
    testEffect,
    // Aliases
    getWeatherEffectsState: getState,
    setWeatherState: setWeather,
    setEffectsEnabled: setEnabled,
    setEffectsIntensity: setIntensity
};
