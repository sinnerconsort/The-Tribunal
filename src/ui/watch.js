/**
 * The Tribunal - Watch Module v2.0 (Standalone)
 * Works without weather-time.js dependency
 * 
 * @version 2.0.0-standalone
 */

import { eventSource } from '../../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// STATE (internal, no external dependencies)
// ═══════════════════════════════════════════════════════════════

let watchInterval = null;
let watchMode = 'real'; // 'real' or 'rp'
let rpTime = { hours: 12, minutes: 0 };
let rpWeather = 'clear';

// ═══════════════════════════════════════════════════════════════
// WEATHER ICONS
// ═══════════════════════════════════════════════════════════════

const WEATHER_ICONS = {
    'clear': 'fa-sun',
    'clear-day': 'fa-sun',
    'clear-night': 'fa-moon',
    'cloudy': 'fa-cloud',
    'rain': 'fa-cloud-rain',
    'rainy': 'fa-cloud-rain',
    'storm': 'fa-cloud-bolt',
    'stormy': 'fa-cloud-bolt',
    'snow': 'fa-snowflake',
    'snowy': 'fa-snowflake',
    'blizzard': 'fa-snowflake',
    'mist': 'fa-smog',
    'foggy': 'fa-smog',
    'wind': 'fa-wind'
};

// ═══════════════════════════════════════════════════════════════
// TIME HELPERS
// ═══════════════════════════════════════════════════════════════

function getRealTime() {
    const now = new Date();
    return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        day: now.getDate()
    };
}

function getCurrentTime() {
    if (watchMode === 'real') {
        return getRealTime();
    } else {
        return {
            hours: rpTime.hours,
            minutes: rpTime.minutes,
            seconds: 0,
            day: '??'
        };
    }
}

function getRealWeather() {
    // Simple day/night detection for real mode
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 20) {
        return { type: 'clear', icon: 'clear-day' };
    } else {
        return { type: 'clear', icon: 'clear-night' };
    }
}

function getCurrentWeather() {
    if (watchMode === 'real') {
        return getRealWeather();
    } else {
        const hour = rpTime.hours;
        const isNight = hour >= 20 || hour < 6;
        let icon = rpWeather;
        if (rpWeather === 'clear') {
            icon = isNight ? 'clear-night' : 'clear-day';
        }
        return { type: rpWeather, icon: icon };
    }
}

// ═══════════════════════════════════════════════════════════════
// WATCH DISPLAY
// ═══════════════════════════════════════════════════════════════

function updateWatch() {
    const hourHand = document.getElementById('ie-watch-hour');
    const minuteHand = document.getElementById('ie-watch-minute');
    const secondHand = document.getElementById('ie-watch-second');
    const dateEl = document.getElementById('ie-watch-date');
    const weatherIcon = document.getElementById('ie-watch-weather-icon');
    
    if (!hourHand) return;
    
    const time = getCurrentTime();
    
    // Calculate hand rotations
    const hours = time.hours % 12;
    const minutes = time.minutes;
    const seconds = time.seconds || 0;
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    const secondDeg = seconds * 6;
    
    // Apply rotations
    hourHand.style.transform = `rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    
    if (secondHand) {
        if (watchMode === 'real') {
            secondHand.style.transform = `rotate(${secondDeg}deg)`;
            secondHand.style.display = 'block';
        } else {
            secondHand.style.display = 'none';
        }
    }
    
    // Update date
    if (dateEl) {
        dateEl.textContent = time.day || '??';
    }
    
    // Update weather icon
    if (weatherIcon) {
        const weather = getCurrentWeather();
        const iconClass = WEATHER_ICONS[weather.icon] || WEATHER_ICONS[weather.type] || 'fa-cloud';
        weatherIcon.className = 'fa-solid ' + iconClass;
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Start the watch interval
 */
export function startWatch() {
    updateWatch();
    watchInterval = setInterval(updateWatch, 1000);
    console.log('[Watch] Started in', watchMode, 'mode');
}

/**
 * Stop the watch interval
 */
export function stopWatch() {
    if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
        console.log('[Watch] Stopped');
    }
}

/**
 * Get current watch mode
 * @returns {'real'|'rp'}
 */
export function getWatchMode() {
    return watchMode;
}

/**
 * Toggle between real and RP modes
 * @returns {'real'|'rp'} The new mode
 */
export function toggleWatchMode() {
    watchMode = watchMode === 'real' ? 'rp' : 'real';
    console.log('[Watch] Mode toggled to:', watchMode);
    updateWatch();
    return watchMode;
}

/**
 * Set RP time manually
 * @param {number} hours - 0-23
 * @param {number} minutes - 0-59
 */
export function setRPTime(hours, minutes = 0) {
    rpTime.hours = Math.max(0, Math.min(23, hours));
    rpTime.minutes = Math.max(0, Math.min(59, minutes));
    console.log('[Watch] RP time set to:', rpTime.hours + ':' + rpTime.minutes);
    if (watchMode === 'rp') {
        updateWatch();
    }
}

/**
 * Set RP weather manually
 * @param {string} weather - Weather type
 */
export function setRPWeather(weather) {
    rpWeather = weather || 'clear';
    console.log('[Watch] RP weather set to:', rpWeather);
    if (watchMode === 'rp') {
        updateWatch();
    }
}

/**
 * Get current RP time
 * @returns {{hours: number, minutes: number}}
 */
export function getRPTime() {
    return { ...rpTime };
}

/**
 * Get current RP weather
 * @returns {string}
 */
export function getRPWeather() {
    return rpWeather;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize watch (same as startWatch for compatibility)
 */
export function initWatch() {
    startWatch();
}
