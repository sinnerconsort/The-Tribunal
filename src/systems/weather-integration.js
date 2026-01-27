/**
 * Weather Integration - MINIMAL TEST VERSION
 * If this loads, the imports are fine
 */

import { getContext } from '../../../../extensions.js';
import { eventSource, event_types } from '../../../../../script.js';

console.log('[Weather] Module loaded successfully!');

// Minimal state
let effectsEnabled = true;
let currentWeather = null;
let currentPeriod = null;
let currentSpecial = null;
let effectIntensity = 'light';
let initialized = false;

// Stub functions that index.js expects
export function initWeatherSystem(options = {}) {
    console.log('[Weather] initWeatherSystem called', options);
    initialized = true;
    return true;
}

export function setWeatherState(state) {
    console.log('[Weather] setWeatherState', state);
    if (typeof state === 'string') currentWeather = state;
    else if (state?.weather) currentWeather = state.weather;
}

export function setWeather(weather) { currentWeather = weather; }
export function setPeriod(period) { currentPeriod = period; }
export function setSpecialEffect(effect) { currentSpecial = effect; }
export function setIntensity(i) { effectIntensity = i; }
export function setEnabled(e) { effectsEnabled = e; }
export function getState() { return { enabled: effectsEnabled, weather: currentWeather, period: currentPeriod, special: currentSpecial, intensity: effectIntensity }; }

export function triggerPale() { currentSpecial = 'pale'; }
export function exitPale() { currentSpecial = null; }
export function isInPale() { return currentSpecial === 'pale'; }
export function triggerHorror(d) { currentSpecial = 'horror'; }
export function exitHorror() { currentSpecial = null; }

export function setEffectsEnabled(e) { effectsEnabled = e; }
export function setEffectsIntensity(i) { effectIntensity = i; }
export function processMessage(m) { return null; }
export function syncWithWeatherTime(w) {}
export function debugWeather() { return { initialized, state: getState() }; }

export function onWeatherChange(e, cb) { return () => {}; }
export function subscribe(cb) { return () => {}; }
export function getAvailableEffects() { return { weather: [], period: [], special: [] }; }
export function testEffect(t) { return true; }

export default { initWeatherSystem, setWeatherState, setWeather, setPeriod, setSpecialEffect, triggerPale, exitPale, isInPale, triggerHorror, exitHorror, getState, setEffectsEnabled, setEffectsIntensity, processMessage, syncWithWeatherTime, debugWeather };
