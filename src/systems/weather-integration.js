/**
 * Weather Integration Module - The Tribunal
 * ALL-IN-ONE: Effects + Integration + Event Emitter
 * v3.3.0 - Special effects (Pale/Horror) now only trigger from USER messages, not AI narration
 *        - AI saying "blood" or "void" is storytelling; USER saying "I black out" is a state change
 *        - Weather/period patterns still scan all messages (AI describes the weather)
 *        - Special effects cleared when normal weather detected (no more sticky Pale)
 *        - Chat change resets all state before rescanning (no bleed between chats)
 *        - HTML comment world state parsing (invisible to user!)
 */

import { getContext } from '../../../../../extensions.js';
import { eventSource, event_types } from '../../../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// EVENT EMITTER
// ═══════════════════════════════════════════════════════════════

const listeners = { weatherChange: [], periodChange: [], specialChange: [], anyChange: [] };

export function onWeatherChange(event, callback) {
    if (!listeners[event]) event = 'anyChange';
    listeners[event].push(callback);
    return () => { const idx = listeners[event].indexOf(callback); if (idx > -1) listeners[event].splice(idx, 1); };
}

export function subscribe(callback) { return onWeatherChange('anyChange', callback); }

function emit(event, data) {
    console.log(`[Weather] Emitting ${event}:`, data);
    listeners[event]?.forEach(cb => { try { cb(data); } catch(e) { console.error('[Weather] Listener error:', e); } });
    if (event !== 'anyChange') listeners.anyChange?.forEach(cb => { try { cb(data); } catch(e) { console.error('[Weather] Listener error:', e); } });
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let effectsEnabled = true;
let currentWeather = null;
let currentPeriod = null;
let currentSpecial = null;
let currentTemp = null;
let currentLocation = null;
let effectIntensity = 'medium';
let initialized = false;
let config = { effectsEnabled: true, autoDetect: true, intensity: 'light', syncWithTimeOfDay: true, skipEventListeners: false };

const PARTICLE_COUNTS = {
    light:  { rain: 15, snow: 12, fog: 3, debris: 6, dust: 6, stars: 15, fireflies: 5, lightning: 1, waves: 3, smoke: 4 },
    medium: { rain: 30, snow: 20, fog: 4, debris: 10, dust: 10, stars: 25, fireflies: 8, lightning: 2, waves: 4, smoke: 6 },
    heavy:  { rain: 50, snow: 30, fog: 5, debris: 15, dust: 15, stars: 35, fireflies: 12, lightning: 3, waves: 5, smoke: 8 }
};

function getParticleCount(type) { return PARTICLE_COUNTS[effectIntensity]?.[type] || PARTICLE_COUNTS.medium[type] || 10; }

// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════

const WEATHER_CSS = `
.tribunal-weather-layer{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;pointer-events:none!important;overflow:hidden!important;z-index:10!important}
.fx-snowflake{position:absolute;color:white;text-shadow:0 0 8px rgba(255,255,255,0.8);animation:snowfall linear infinite}
@keyframes snowfall{0%{transform:translateY(-20px) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:0.8}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}
.fx-raindrop{position:absolute;width:2px;background:linear-gradient(transparent,rgba(174,194,224,0.8));animation:rainfall linear infinite}
@keyframes rainfall{0%{transform:translateY(-30px);opacity:0}10%{opacity:0.8}100%{transform:translateY(100vh);opacity:0.2}}
.fx-storm-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(20,25,35,0.3) 0%,rgba(15,20,30,0.2) 100%)}
.fx-storm-rain{position:absolute;width:2px;background:linear-gradient(transparent,rgba(180,200,230,0.9));animation:stormrain linear infinite;transform:rotate(15deg)}
.fx-lightning{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0);animation:lightning-flash ease-out infinite}
@keyframes stormrain{0%{transform:translateY(-50px) rotate(15deg);opacity:0}10%{opacity:0.9}100%{transform:translateY(100vh) rotate(15deg);opacity:0.3}}
@keyframes lightning-flash{0%,100%{background:rgba(255,255,255,0)}1%{background:rgba(200,220,255,0.6)}2%{background:rgba(255,255,255,0)}3%{background:rgba(180,200,240,0.4)}4%{background:rgba(255,255,255,0)}}
.fx-fog-layer{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(180,190,200,0.08) 0%,rgba(160,170,180,0.12) 30%,rgba(140,150,160,0.15) 60%,rgba(120,130,140,0.1) 100%)}
.fx-mist{position:absolute;width:250%;background:linear-gradient(90deg,transparent 0%,rgba(180,190,200,0.2) 20%,rgba(160,170,180,0.3) 50%,rgba(180,190,200,0.2) 80%,transparent 100%);animation:mistdrift linear infinite}
@keyframes mistdrift{0%{transform:translateX(-60%)}100%{transform:translateX(10%)}}
.fx-windstreak{position:absolute;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);border-radius:2px;animation:windstreak linear infinite}
.fx-debris{position:absolute;font-size:10px;opacity:0.6;animation:debrisfly linear infinite}
@keyframes windstreak{0%{transform:translateX(-200px);opacity:0}10%{opacity:0.5}90%{opacity:0.3}100%{transform:translateX(100vw);opacity:0}}
@keyframes debrisfly{0%{transform:translate(-50px,0) rotate(0deg);opacity:0}10%{opacity:0.7}50%{transform:translate(50vw,20px) rotate(180deg)}90%{opacity:0.5}100%{transform:translate(100vw,-10px) rotate(360deg);opacity:0}}
.fx-wave{position:absolute;bottom:0;width:200%;height:60px;background:linear-gradient(180deg,rgba(60,80,100,0.3) 0%,rgba(40,60,80,0.4) 50%,rgba(30,50,70,0.2) 100%);border-radius:100% 100% 0 0;animation:waveroll ease-in-out infinite}
.fx-wave-foam{position:absolute;bottom:0;width:150%;height:8px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.3) 20%,rgba(255,255,255,0.5) 50%,rgba(255,255,255,0.3) 80%,transparent 100%);animation:foamroll ease-in-out infinite}
@keyframes waveroll{0%,100%{transform:translateX(-25%) scaleY(1)}50%{transform:translateX(-15%) scaleY(1.2)}}
@keyframes foamroll{0%,100%{transform:translateX(-20%);opacity:0.4}50%{transform:translateX(-10%);opacity:0.7}}
.fx-smoke-wisp{position:absolute;width:40px;height:80px;background:radial-gradient(ellipse at center,rgba(180,180,180,0.15) 0%,rgba(150,150,150,0.08) 40%,transparent 70%);filter:blur(3px);animation:smokerise ease-out infinite}
@keyframes smokerise{0%{transform:translateY(0) scale(0.5) rotate(0deg);opacity:0}20%{opacity:0.4}50%{transform:translateY(-60px) scale(1) rotate(15deg);opacity:0.3}80%{opacity:0.15}100%{transform:translateY(-120px) scale(1.5) rotate(-10deg);opacity:0}}
.fx-day-haze{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(255,245,200,0.12) 0%,transparent 50%)}
.fx-sun{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,240,180,0.5) 0%,rgba(255,220,100,0.15) 50%,transparent 70%);animation:sunpulse 8s ease-in-out infinite}
.fx-dustmote{position:absolute;background:rgba(255,245,200,0.6);border-radius:50%;animation:dustfloat ease-in-out infinite}
@keyframes sunpulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:0.8;transform:scale(1.05)}}
@keyframes dustfloat{0%,100%{transform:translate(0,0);opacity:0.3}25%{transform:translate(15px,-20px);opacity:0.6}50%{transform:translate(25px,5px);opacity:0.4}75%{transform:translate(10px,15px);opacity:0.5}}
.fx-night-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(10,15,30,0.12) 0%,rgba(20,25,40,0.08) 100%)}
.fx-star{position:absolute;background:rgba(255,255,255,0.8);border-radius:50%;animation:twinkle ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
.fx-night-sky{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(10,15,35,0.1) 0%,rgba(15,20,40,0.06) 50%,transparent 100%)}
.fx-moon{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,240,0.85) 0%,rgba(255,255,220,0.3) 50%,transparent 70%);animation:moonglow 10s ease-in-out infinite}
.fx-firefly{position:absolute;background:radial-gradient(circle,rgba(180,255,100,0.9) 0%,rgba(150,255,50,0.3) 50%,transparent 70%);border-radius:50%;animation:firefly ease-in-out infinite}
@keyframes moonglow{0%,100%{opacity:0.7}50%{opacity:0.9}}
@keyframes firefly{0%{opacity:0;transform:translate(0,0)}20%{opacity:0.9}50%{opacity:0.5;transform:translate(40px,-25px)}80%{opacity:0.8}100%{opacity:0;transform:translate(70px,15px)}}
.fx-indoor-warmth{position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at 70% 30%,rgba(255,240,200,0.12) 0%,transparent 60%)}
.fx-light-beam{position:absolute;top:0;height:100%;background:linear-gradient(180deg,rgba(255,250,220,0.15) 0%,rgba(255,245,200,0.08) 50%,transparent 100%);transform:skewX(-15deg);animation:beampulse ease-in-out infinite}
.fx-indoor-dust{position:absolute;background:rgba(255,250,220,0.7);border-radius:50%;animation:indoordust linear infinite}
@keyframes beampulse{0%,100%{opacity:0.15}50%{opacity:0.25}}
@keyframes indoordust{0%{transform:translate(0,100vh);opacity:0}10%{opacity:0.6}90%{opacity:0.4}100%{transform:translate(40px,-30px);opacity:0}}
.fx-vignette{position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 30%,rgba(30,0,0,0.4) 100%)}
.fx-heartbeat{position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,rgba(100,0,0,0.25) 0%,transparent 60%);animation:heartbeat 1.8s ease-in-out infinite}
.fx-blood-drip{position:absolute;width:3px;background:linear-gradient(180deg,rgba(140,20,20,0.85) 0%,rgba(100,10,10,0.5) 100%);border-radius:0 0 50% 50%;animation:blooddrip linear infinite}
.fx-horror-flicker{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0);animation:horrorflicker 4s steps(1) infinite}
@keyframes heartbeat{0%,100%{opacity:0.15;transform:scale(1)}15%{opacity:0.5;transform:scale(1.03)}30%{opacity:0.2;transform:scale(1)}45%{opacity:0.4;transform:scale(1.02)}}
@keyframes blooddrip{0%{transform:translateY(-80px);height:0;opacity:0}10%{height:40px;opacity:0.9}90%{opacity:0.6}100%{transform:translateY(100vh);height:60px;opacity:0}}
@keyframes horrorflicker{0%,100%{background:rgba(0,0,0,0)}45%{background:rgba(0,0,0,0)}46%{background:rgba(0,0,0,0.15)}47%{background:rgba(0,0,0,0)}48%{background:rgba(0,0,0,0.1)}49%{background:rgba(0,0,0,0)}}
.fx-pale-void{position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,rgba(200,210,220,0.2) 0%,rgba(180,190,200,0.12) 50%,rgba(160,170,180,0.06) 100%)}
.fx-pale-static{position:absolute;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(220,230,240,0.06) 2px,rgba(220,230,240,0.06) 4px);animation:palestatic 0.15s linear infinite}
.fx-pale-shimmer{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent 0%,rgba(220,230,240,0.12) 50%,transparent 100%);animation:paleshimmer 10s ease-in-out infinite}
.fx-memory-wisp{position:absolute;width:100px;height:100px;background:radial-gradient(circle,rgba(200,210,220,0.25) 0%,transparent 70%);border-radius:50%;animation:memorywisp ease-in-out infinite}
.fx-thought-symbol{position:absolute;font-family:serif;font-size:16px;color:rgba(180,190,200,0.5);animation:thoughtsymbol ease-in-out infinite}
@keyframes palestatic{0%{opacity:0.4}50%{opacity:0.6}100%{opacity:0.4}}
@keyframes paleshimmer{0%,100%{transform:translateX(-100%);opacity:0}50%{transform:translateX(100%);opacity:1}}
@keyframes memorywisp{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(1.4);opacity:0.5}}
@keyframes thoughtsymbol{0%,100%{opacity:0;transform:translateY(0)}50%{opacity:0.7;transform:translateY(-25px)}}
`;

function injectCSS() {
    if (document.getElementById('tribunal-weather-css')) return true;
    const style = document.createElement('style');
    style.id = 'tribunal-weather-css';
    style.textContent = WEATHER_CSS;
    document.head.appendChild(style);
    console.log('[Weather] CSS injected');
    return true;
}

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
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-storm-overlay'}));
    const rainCount = Math.floor(getParticleCount('rain') * 1.5);
    for (let i = 0; i < rainCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'fx-storm-rain';
        drop.style.left = `${Math.random() * 120 - 10}%`;
        drop.style.height = `${20 + Math.random() * 35}px`;
        drop.style.animationDuration = `${0.25 + Math.random() * 0.25}s`;
        drop.style.animationDelay = `${Math.random() * 1.5}s`;
        layer.appendChild(drop);
    }
    for (let i = 0; i < getParticleCount('lightning'); i++) {
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
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-fog-layer'}));
    for (let i = 0; i < getParticleCount('fog'); i++) {
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
    for (let i = 0; i < Math.floor(streakCount / 2); i++) {
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
    for (let i = 0; i < getParticleCount('waves'); i++) {
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
    for (let i = 0; i < getParticleCount('smoke'); i++) {
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
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-day-haze'}));
    const sun = document.createElement('div');
    sun.className = 'fx-sun';
    Object.assign(sun.style, {top: '5%', right: '10%', width: '120px', height: '120px'});
    layer.appendChild(sun);
    for (let i = 0; i < getParticleCount('dust'); i++) {
        const dust = document.createElement('div');
        dust.className = 'fx-dustmote';
        const size = `${2 + Math.random() * 3}px`;
        Object.assign(dust.style, {left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: size, height: size, animationDuration: `${5+Math.random()*6}s`, animationDelay: `${Math.random()*5}s`});
        layer.appendChild(dust);
    }
    return layer;
}

function createCityNight() {
    const layer = createLayer('city-night');
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-night-overlay'}));
    for (let i = 0; i < getParticleCount('stars'); i++) {
        const star = document.createElement('div');
        star.className = 'fx-star';
        const size = `${1 + Math.random() * 2}px`;
        Object.assign(star.style, {left: `${Math.random()*100}%`, top: `${Math.random()*35}%`, width: size, height: size, animationDuration: `${2+Math.random()*3}s`, animationDelay: `${Math.random()*4}s`});
        layer.appendChild(star);
    }
    return layer;
}

function createQuietNight() {
    const layer = createLayer('quiet-night');
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-night-sky'}));
    const moon = document.createElement('div');
    moon.className = 'fx-moon';
    Object.assign(moon.style, {top: '8%', left: '15%', width: '50px', height: '50px'});
    layer.appendChild(moon);
    for (let i = 0; i < getParticleCount('stars'); i++) {
        const star = document.createElement('div');
        star.className = 'fx-star';
        const size = `${1 + Math.random() * 2}px`;
        Object.assign(star.style, {left: `${Math.random()*100}%`, top: `${Math.random()*45}%`, width: size, height: size, animationDuration: `${3+Math.random()*4}s`, animationDelay: `${Math.random()*5}s`});
        layer.appendChild(star);
    }
    for (let i = 0; i < getParticleCount('fireflies'); i++) {
        const firefly = document.createElement('div');
        firefly.className = 'fx-firefly';
        const size = `${6 + Math.random() * 6}px`;
        Object.assign(firefly.style, {left: `${Math.random()*90}%`, top: `${35+Math.random()*55}%`, width: size, height: size, animationDuration: `${4+Math.random()*5}s`, animationDelay: `${Math.random()*8}s`});
        layer.appendChild(firefly);
    }
    return layer;
}

function createIndoor() {
    const layer = createLayer('indoor');
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-indoor-warmth'}));
    for (let i = 0; i < 2; i++) {
        const beam = document.createElement('div');
        beam.className = 'fx-light-beam';
        Object.assign(beam.style, {left: `${20+i*40}%`, width: `${50+Math.random()*40}px`, animationDuration: `${5+Math.random()*4}s`, animationDelay: `${i*2}s`});
        layer.appendChild(beam);
    }
    for (let i = 0; i < getParticleCount('dust'); i++) {
        const dust = document.createElement('div');
        dust.className = 'fx-indoor-dust';
        const size = `${2 + Math.random() * 2}px`;
        Object.assign(dust.style, {left: `${20+Math.random()*60}%`, width: size, height: size, animationDuration: `${10+Math.random()*10}s`, animationDelay: `${Math.random()*12}s`});
        layer.appendChild(dust);
    }
    return layer;
}

function createHorror() {
    const layer = createLayer('horror');
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-vignette'}));
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-heartbeat'}));
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-horror-flicker'}));
    for (let i = 0; i < 6; i++) {
        const drip = document.createElement('div');
        drip.className = 'fx-blood-drip';
        Object.assign(drip.style, {left: `${Math.random()*100}%`, animationDuration: `${3+Math.random()*4}s`, animationDelay: `${Math.random()*6}s`});
        layer.appendChild(drip);
    }
    return layer;
}

function createPale() {
    const layer = createLayer('pale');
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-pale-void'}));
    layer.appendChild(Object.assign(document.createElement('div'), {className: 'fx-pale-static'}));
    for (let i = 0; i < 3; i++) {
        const shimmer = document.createElement('div');
        shimmer.className = 'fx-pale-shimmer';
        shimmer.style.animationDelay = `${i * 3}s`;
        layer.appendChild(shimmer);
    }
    for (let i = 0; i < 8; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'fx-memory-wisp';
        Object.assign(wisp.style, {left: `${Math.random()*85}%`, top: `${Math.random()*85}%`, animationDuration: `${10+Math.random()*8}s`, animationDelay: `${Math.random()*10}s`});
        layer.appendChild(wisp);
    }
    const symbols = ['◆', '◇', '?', '...', '∴', '○', '—', '※', '◈'];
    for (let i = 0; i < 10; i++) {
        const sym = document.createElement('div');
        sym.className = 'fx-thought-symbol';
        sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        Object.assign(sym.style, {left: `${Math.random()*90}%`, top: `${Math.random()*90}%`, animationDuration: `${8+Math.random()*6}s`, animationDelay: `${Math.random()*12}s`});
        layer.appendChild(sym);
    }
    return layer;
}

// ═══════════════════════════════════════════════════════════════
// EFFECT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const EFFECT_CREATORS = {
    rain: createRain, snow: createSnow, storm: createStorm, fog: createFog,
    wind: createWind, waves: createWaves, smoke: createSmoke, clear: null,
    day: createDay, 'city-night': createCityNight, 'quiet-night': createQuietNight,
    pale: createPale, indoor: createIndoor, horror: createHorror
};

function clearEffects(type = null) {
    const selector = type ? `.tribunal-weather-layer[data-effect="${type}"]` : '.tribunal-weather-layer';
    document.querySelectorAll(selector).forEach(l => l.remove());
}

function addEffect(type) {
    if (!type || typeof type !== 'string') return false;
    const creator = EFFECT_CREATORS[type];
    if (!creator) return false;
    clearEffects(type);
    const layer = creator();
    if (layer) { document.body.appendChild(layer); return true; }
    return false;
}

function renderEffects() {
    if (!effectsEnabled) { clearEffects(); return; }
    clearEffects();
    if (currentSpecial) { addEffect(currentSpecial); return; }
    if (currentWeather && currentWeather !== 'clear') addEffect(currentWeather);
    if (currentPeriod && currentPeriod !== 'day') addEffect(currentPeriod);
    else if (currentPeriod === 'day' && (!currentWeather || currentWeather === 'clear')) addEffect('day');
}

// ═══════════════════════════════════════════════════════════════
// WORLD STATE PARSING
// Supports: HTML comments (invisible), JSON blocks, raw JSON
// ═══════════════════════════════════════════════════════════════

/**
 * Try to extract world state from message
 * Priority order:
 * 1. HTML comment: <!--WORLD{...}--> (invisible to user!)
 * 2. JSON code block: ```json {...} ```
 * 3. Raw JSON with "weather" field
 * 
 * Recommended format for LLM system prompt:
 * <!--WORLD{"weather":"Snow","time":"3:45 PM","location":"Snowdin"}-->
 */
function extractWorldState(message) {
    if (!message || typeof message !== 'string') return null;
    
    // ═══════════════════════════════════════════════════════════
    // PRIORITY 1: HTML Comment (invisible to user!)
    // Format: <!--WORLD{...}-->
    // ═══════════════════════════════════════════════════════════
    // Match both <!-- WORLD{...} --> and <!--- WORLD{...} ---> (2 or 3 dashes)
    const htmlCommentPattern = /<!-{2,3}\s*WORLD\s*(\{[\s\S]*?\})\s*-{2,3}>/i;
    const commentMatch = message.match(htmlCommentPattern);
    if (commentMatch) {
        try {
            const parsed = JSON.parse(commentMatch[1]);
            if (parsed.weather || parsed.time || parsed.location) {
                console.log('[Weather] ✓ Parsed HTML comment world state:', parsed);
                return parsed;
            }
        } catch (e) {
            console.log('[Weather] HTML comment JSON parse failed:', e.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // PRIORITY 2: Visible JSON (fallback for older prompts)
    // ═══════════════════════════════════════════════════════════
    const visiblePatterns = [
        /```json\s*(\{[\s\S]*?"weather"[\s\S]*?\})\s*```/i,
        /```\s*(\{[\s\S]*?"weather"[\s\S]*?\})\s*```/i,
        /(\{[^{}]*"weather"\s*:\s*"[^"]+(?:"[^{}]*|\{[^{}]*\}[^{}]*)*\})/i
    ];
    
    for (const pattern of visiblePatterns) {
        const match = message.match(pattern);
        if (match) {
            try {
                const parsed = JSON.parse(match[1]);
                if (parsed.weather) {
                    console.log('[Weather] ✓ Parsed visible JSON world state:', parsed);
                    return parsed;
                }
            } catch (e) {
                console.log('[Weather] Visible JSON parse attempt failed:', e.message);
            }
        }
    }
    
    return null;
}

/**
 * Map JSON weather strings to internal weather types
 */
const JSON_WEATHER_MAP = {
    'clear': 'clear',
    'sunny': 'clear',
    'cloudy': 'fog',
    'overcast': 'fog',
    'rain': 'rain',
    'rainy': 'rain',
    'light rain': 'rain',
    'drizzle': 'rain',
    'drizzling': 'rain',
    'light drizzle': 'rain',
    'heavy drizzle': 'rain',
    'heavy rain': 'storm',
    'downpour': 'storm',
    'storm': 'storm',
    'stormy': 'storm',
    'thunderstorm': 'storm',
    'snow': 'snow',
    'snowy': 'snow',
    'snowing': 'snow',
    'light snow': 'snow',
    'heavy snow': 'snow',
    'blizzard': 'snow',
    'sleet': 'rain',
    'hail': 'storm',
    'fog': 'fog',
    'foggy': 'fog',
    'mist': 'fog',
    'misty': 'fog',
    'haze': 'fog',
    'hazy': 'fog',
    'wind': 'wind',
    'windy': 'wind'
};

function normalizeWeatherFromJSON(weatherStr) {
    if (!weatherStr) return null;
    const lower = weatherStr.toLowerCase().trim();
    
    // Direct match
    if (JSON_WEATHER_MAP[lower]) return JSON_WEATHER_MAP[lower];
    
    // Partial match fallback (handles AI variations like "Light Drizzle with Fog")
    if (lower.includes('drizzl') || lower.includes('rain')) return 'rain';
    if (lower.includes('storm') || lower.includes('thunder')) return 'storm';
    if (lower.includes('snow') || lower.includes('blizzard')) return 'snow';
    if (lower.includes('fog') || lower.includes('mist') || lower.includes('haz')) return 'fog';
    if (lower.includes('wind')) return 'wind';
    if (lower.includes('clear') || lower.includes('sunny')) return 'clear';
    
    return lower;
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD-BASED AUTO-DETECTION (FALLBACK)
// ═══════════════════════════════════════════════════════════════

const WEATHER_PATTERNS = {
    storm: /\b(storm|stormy|thunder|thunderstorm|lightning|tempest|gale|downpour|torrential)\b/i,
    rain: /\b(rain\w*|drizzl\w*|shower\w*|wet|damp\w*|precipitation)\b/i,
    snow: /\b(snow\w*|blizzard|flurries|frost\w*|freez\w*|ice|icy|sleet|frozen)\b/i,
    fog: /\b(fog\w*|mist\w*|haz[ey]\w*|murky|smog\w*|overcast)\b/i,
    wind: /\b(wind\w*|gust\w*|breez\w*)\b/i,
    waves: /\b(wave|waves|ocean|sea|harbor|harbour|dock|pier|beach|shore|coastal|tide)\b/i,
    smoke: /\b(smoke|smoking|cigarette|cigar|exhale|ash|ashtray)\b/i,
    clear: /\b(clear|sunny|bright|cloudless|fair|beautiful day)\b/i
};

// Period detection: explicit time-of-day words + numeric time strings (e.g. "6:45 PM")
// NO ambient words like "dark", "neon", "starry", "room", "house" — those are vibes, not time
const PERIOD_PATTERNS = {
    'quiet-night': /\b(nighttime|night\s+time|at\s+night|midnight|late\s+at\s+night|dead\s+of\s+night)\b/i,
    'city-night': /\b(nightlife|nightclub|evening|dusk|sunset|twilight)\b/i,
    'day': /\b(morning|midday|mid-day|noon|afternoon|dawn|daybreak|sunrise)\b/i
};

// Match explicit time strings: "6:45 PM", "3:00 AM", "23:30", "11pm"
const NUMERIC_TIME_PATTERN = /\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b|\b(\d{1,2})\s*(AM|PM|am|pm)\b|\b(\d{1,2}):(\d{2})\b/;

/**
 * Try to extract a period from a numeric time string in the message
 * "6:45 PM" → evening, "3:00 AM" → quiet-night, "11:30" → day, etc.
 */
function detectPeriodFromTime(message) {
    const match = message.match(NUMERIC_TIME_PATTERN);
    if (!match) return null;
    
    let hours;
    if (match[1] !== undefined) {
        // "6:45 PM" format
        hours = parseInt(match[1], 10);
        const isPM = match[3].toUpperCase() === 'PM';
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
    } else if (match[4] !== undefined) {
        // "11pm" format
        hours = parseInt(match[4], 10);
        const isPM = match[5].toUpperCase() === 'PM';
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
    } else if (match[6] !== undefined) {
        // "23:30" 24-hour format
        hours = parseInt(match[6], 10);
    } else {
        return null;
    }
    
    if (isNaN(hours) || hours < 0 || hours > 23) return null;
    
    // Map hour to period
    if (hours >= 6 && hours < 18) return 'day';
    if (hours >= 18 && hours < 22) return 'city-night';
    return 'quiet-night'; // 22-5
}

const SPECIAL_PATTERNS = {
    // Special effects ONLY trigger from USER messages (not AI narration)
    // Pale: user is describing their character losing consciousness or entering a dream state
    pale: /\b(unconscious|faint(?:s|ed|ing)?|blacks?\s*out|blacked?\s*out|dozing\s+off|falls?\s+asleep|asleep|dreaming|pass(?:es|ed)?\s+out|losing\s+consciousness)\b/i,
    // Horror: user is describing their character's fear/terror state
    horror: /\b(terrified|afraid|scared|horrified|panicking|panic(?:s|ked)?|petrified|paralyzed\s+with\s+fear|shaking\s+with\s+fear|trembling\s+in\s+fear)\b/i
};

// Horror detection - split into intense (instant trigger) vs mild (need multiple)
/**
 * Scan message for weather/period keywords (works on ANY message)
 * Special effects (pale, horror) ONLY trigger from user messages
 * @param {string} message - Message text
 * @param {boolean} isUser - Whether the message is from the user
 */
function scanForKeywords(message, isUser = false) {
    if (!message || typeof message !== 'string') return null;
    
    // Special effects — USER MESSAGES ONLY
    // AI narration naturally contains "blood", "void", "death" — that's storytelling, not state
    if (isUser) {
        if (SPECIAL_PATTERNS.horror?.test(message)) {
            console.log('[Weather] Horror triggered by user message');
            return { type: 'special', value: 'horror' };
        }
        
        if (SPECIAL_PATTERNS.pale?.test(message)) {
            console.log('[Weather] Pale triggered by user message');
            return { type: 'special', value: 'pale' };
        }
    }
    
    // Weather patterns — scan ALL messages (AI describes the weather)
    for (const [weather, pattern] of Object.entries(WEATHER_PATTERNS)) {
        if (pattern.test(message)) {
            return { type: 'weather', value: weather };
        }
    }
    
    // Period patterns — scan ALL messages (explicit time words)
    for (const [period, pattern] of Object.entries(PERIOD_PATTERNS)) {
        if (pattern.test(message)) {
            return { type: 'period', value: period };
        }
    }
    
    // Numeric time detection — "6:45 PM", "3am", "23:30" → derive period
    const numericPeriod = detectPeriodFromTime(message);
    if (numericPeriod) {
        console.log('[Weather] Period from numeric time:', numericPeriod);
        return { type: 'period', value: numericPeriod };
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED MESSAGE PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message for weather data
 * 1. First tries JSON world state extraction (any message)
 * 2. Falls back to keyword scanning (special effects = user only)
 * @param {string} message - Message text
 * @param {boolean} isUser - Whether this is a user message
 */
function processMessageForWeather(message, isUser = false) {
    if (!message || typeof message !== 'string') return null;
    
    console.log('[Weather] Processing message (length:', message.length, ', isUser:', isUser, ')');
    
    // Try JSON first
    const worldState = extractWorldState(message);
    if (worldState) {
        const weather = normalizeWeatherFromJSON(worldState.weather);
        if (weather) {
            console.log('[Weather] ✓ Using JSON weather:', weather);
            
            // Clear any lingering special effect - explicit JSON weather overrides Pale/horror
            if (currentSpecial) {
                console.log('[Weather] Clearing special effect', currentSpecial, '- JSON weather found');
                currentSpecial = null;
            }
            
            setWeather(weather);
            
            // Also extract temperature if available
            if (worldState.temperature?.value) {
                currentTemp = worldState.temperature;
                console.log('[Weather] Temperature:', currentTemp);
            } else if (worldState.temp !== undefined) {
                currentTemp = { value: worldState.temp };
                console.log('[Weather] Temperature:', currentTemp);
            }
            
            // Also extract location if available
            if (worldState.location) {
                currentLocation = worldState.location;
                console.log('[Weather] Location:', currentLocation);
            }
            
            return { type: 'weather', value: weather, source: 'json', worldState };
        }
    }
    
    // Fallback to keyword scanning
    console.log('[Weather] No JSON found, scanning keywords...');
    const keywordResult = scanForKeywords(message, isUser);
    
    if (keywordResult) {
        console.log('[Weather] ✓ Keyword detected:', keywordResult);
        
        if (keywordResult.type === 'special') {
            setSpecialEffect(keywordResult.value);
        } else if (keywordResult.type === 'weather') {
            // Clear any lingering special effect when real weather is detected
            if (currentSpecial) {
                console.log('[Weather] Clearing special effect', currentSpecial, '- normal weather detected');
                currentSpecial = null;
            }
            setWeather(keywordResult.value);
        } else if (keywordResult.type === 'period') {
            // Clear any lingering special effect when period changes
            if (currentSpecial) {
                console.log('[Weather] Clearing special effect', currentSpecial, '- period change detected');
                currentSpecial = null;
            }
            setPeriod(keywordResult.value);
        }
        
        return { ...keywordResult, source: 'keywords' };
    }
    
    console.log('[Weather] No weather data found in message');
    return null;
}

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
    
    console.log('[Weather] setWeather:', previous.weather, '→', currentWeather);
    renderEffects();
    
    // Always emit so subscribers get updates
    emit('weatherChange', { 
        weather: currentWeather, 
        period: currentPeriod, 
        special: currentSpecial, 
        intensity: effectIntensity, 
        temp: currentTemp,
        location: currentLocation,
        previous 
    });
}

export function setPeriod(period) {
    const previous = { weather: currentWeather, period: currentPeriod, special: currentSpecial };
    currentPeriod = period;
    console.log('[Weather] setPeriod:', previous.period, '→', currentPeriod);
    renderEffects();
    emit('periodChange', { weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity, previous });
}

export function setSpecialEffect(effect) {
    const previous = { weather: currentWeather, period: currentPeriod, special: currentSpecial };
    currentSpecial = effect;
    console.log('[Weather] setSpecialEffect:', previous.special, '→', currentSpecial);
    renderEffects();
    emit('specialChange', { weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity, previous });
}

export function setIntensity(intensity) {
    if (['light', 'medium', 'heavy'].includes(intensity)) { effectIntensity = intensity; renderEffects(); }
}

export function setEnabled(enabled) { effectsEnabled = enabled; renderEffects(); }

export function getState() {
    return { 
        enabled: effectsEnabled, 
        weather: currentWeather, 
        period: currentPeriod, 
        special: currentSpecial, 
        intensity: effectIntensity,
        temp: currentTemp,
        location: currentLocation
    };
}

export function triggerPale() { 
    window.TribunalConditionFX?.triggerPale?.();
}

export function exitPale() { 
    window.TribunalConditionFX?.exitPale?.();
}

export function isInPale() { 
    return window.TribunalConditionFX?.isInPale?.() || false;
}

export function triggerHorror(duration = 15000) {
    window.TribunalConditionFX?.triggerHorror?.();
    if (duration > 0) {
        setTimeout(() => window.TribunalConditionFX?.exitHorror?.(), duration);
    }
}

export function exitHorror() { 
    window.TribunalConditionFX?.exitHorror?.();
}
export function getAvailableEffects() {
    return { weather: ['rain', 'snow', 'storm', 'fog', 'wind', 'waves', 'smoke', 'clear'], period: ['day', 'city-night', 'quiet-night', 'indoor'], special: ['pale', 'horror'] };
}

export function testEffect(effectType) {
    injectCSS();
    clearEffects();
    currentWeather = null; currentPeriod = null; currentSpecial = null;
    if (!effectType || effectType === 'clear') return true;
    return addEffect(effectType);
}

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN INTEGRATION
// ═══════════════════════════════════════════════════════════════

function scanChatForWeather(messageCount = 5) {
    if (!config.autoDetect) {
        console.log('[Weather] Auto-detect disabled, skipping scan');
        return;
    }
    
    try {
        const ctx = getContext();
        if (!ctx?.chat?.length) {
            console.log('[Weather] No chat context available');
            return;
        }
        
        console.log('[Weather] Scanning last', messageCount, 'messages...');
        
        // Scan from newest to oldest, stop on first match
        const messages = ctx.chat.slice(-messageCount).reverse();
        for (const msg of messages) {
            if (msg?.mes) {
                const result = processMessageForWeather(msg.mes, !!msg.is_user);
                if (result) {
                    console.log('[Weather] ✓ Found weather in chat:', result);
                    return; // Stop after first match
                }
            }
        }
        
        console.log('[Weather] No weather found in recent messages');
    } catch (e) { 
        console.error('[Weather] Scan error:', e.message); 
    }
}

function onChatChanged() { 
    console.log('[Weather] Chat changed event');
    
    // Reset state so effects from previous chat don't bleed over
    currentWeather = null;
    currentPeriod = null;
    currentSpecial = null;
    currentTemp = null;
    currentLocation = null;
    clearEffects();
    
    setTimeout(() => scanChatForWeather(10), 500); 
}

function onMessageReceived() {
    try {
        const ctx = getContext();
        if (ctx?.chat?.length && config.autoDetect) {
            const lastMessage = ctx.chat[ctx.chat.length - 1];
            if (lastMessage?.mes) {
                console.log('[Weather] New message received, processing...');
                processMessageForWeather(lastMessage.mes, !!lastMessage.is_user);
            }
        }
    } catch (e) {
        console.error('[Weather] Message handler error:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN INIT
// ═══════════════════════════════════════════════════════════════

export function initWeatherSystem(options = {}) {
    if (initialized) { 
        console.log('[Weather] Already initialized'); 
        return true; 
    }
    
    config = { ...config, ...options };
    console.log('[Weather] Initializing with config:', config);
    
    injectCSS();
    effectsEnabled = config.effectsEnabled;
    effectIntensity = config.intensity;
    
    if (!config.skipEventListeners) {
        console.log('[Weather] Registering event listeners...');
        if (event_types.CHAT_CHANGED) {
            eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
            console.log('[Weather] ✓ Registered CHAT_CHANGED listener');
        }
        if (event_types.MESSAGE_RECEIVED) {
            eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
            console.log('[Weather] ✓ Registered MESSAGE_RECEIVED listener');
        }
    }
    
    // Initial scan after a delay
    setTimeout(() => { 
        const ctx = getContext(); 
        if (ctx?.chat?.length > 0) {
            console.log('[Weather] Initial chat scan...');
            scanChatForWeather(10); 
        }
    }, 1000);
    
    initialized = true;
    console.log('[Weather] ✓ System ready!');
    console.log('[Weather] Subscribers:', listeners.anyChange.length);
    return true;
}

// Aliases for index.js
export const setWeatherState = setWeather;
export const setEffectsEnabled = setEnabled;
export const setEffectsIntensity = setIntensity;
export const processMessage = processMessageForWeather;

export function syncWithWeatherTime(watchState) {
    if (!watchState?.time) return;
    const hour = parseInt(watchState.time.split(':')[0], 10);
    if (isNaN(hour)) return;
    const state = getState();
    if (!state.weather && !state.special) {
        if (hour >= 6 && hour < 18) setPeriod('day');
        else if (hour >= 22 || hour < 5) setPeriod('quiet-night');
        else setPeriod('city-night');
    }
}

export function debugWeather() {
    const debug = { 
        config, 
        state: getState(), 
        available: getAvailableEffects(), 
        initialized, 
        cssInjected: !!document.getElementById('tribunal-weather-css'), 
        layerCount: document.querySelectorAll('.tribunal-weather-layer').length,
        subscribers: {
            weatherChange: listeners.weatherChange.length,
            periodChange: listeners.periodChange.length,
            specialChange: listeners.specialChange.length,
            anyChange: listeners.anyChange.length
        }
    };
    console.log('[Weather Debug]', debug);
    return debug;
}

export function rescanChat() { 
    console.log('[Weather] Manual rescan triggered');
    scanChatForWeather(10); 
}

export function setAutoDetect(enabled) { 
    config.autoDetect = enabled; 
    console.log('[Weather] Auto-detect:', enabled);
}

// Force an immediate update with specific weather (for testing)
export function forceWeather(weather) {
    console.log('[Weather] Force setting weather to:', weather);
    setWeather(weather);
}

export default {
    initWeatherSystem, setWeather, setPeriod, setSpecialEffect, setIntensity, setEnabled, getState,
    triggerPale, exitPale, isInPale, triggerHorror, exitHorror, processMessage: processMessageForWeather,
    testEffect, getAvailableEffects, onWeatherChange, subscribe, debugWeather, rescanChat, setAutoDetect,
    syncWithWeatherTime, setWeatherState: setWeather, setEffectsEnabled: setEnabled, setEffectsIntensity: setIntensity,
    forceWeather
};
