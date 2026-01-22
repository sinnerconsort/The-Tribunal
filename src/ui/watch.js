/**
 * The Tribunal - Watch Functionality
 * Real-time / RP-time toggle with weather display
 * Extracted from rebuild v0.3.0
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let watchMode = 'real';
let watchInterval = null;
let rpTime = { hours: 14, minutes: 30 };
let rpWeather = 'rainy';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const WEATHER_ICONS = {
    'clear-day': 'fa-sun',
    'clear-night': 'fa-moon',
    'cloudy': 'fa-cloud',
    'rainy': 'fa-cloud-rain',
    'stormy': 'fa-cloud-bolt',
    'snowy': 'fa-snowflake',
    'foggy': 'fa-smog'
};

// ═══════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get weather based on time of day (placeholder for real weather integration)
 * @returns {string} Weather key
 */
function getRealWeather() {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 20) ? 'clear-day' : 'clear-night';
}

/**
 * Update the watch display
 */
export function updateWatch() {
    const hourHand = document.getElementById('ie-watch-hour');
    const minuteHand = document.getElementById('ie-watch-minute');
    const secondHand = document.getElementById('ie-watch-second');
    const dateEl = document.getElementById('ie-watch-date');
    const weatherEl = document.getElementById('ie-watch-weather');
    const weatherIcon = document.getElementById('ie-watch-weather-icon');
    
    if (!hourHand) return;
    
    let hours, minutes, seconds, day, weather;
    
    if (watchMode === 'real') {
        const now = new Date();
        hours = now.getHours() % 12;
        minutes = now.getMinutes();
        seconds = now.getSeconds();
        day = now.getDate();
        weather = getRealWeather();
    } else {
        hours = rpTime.hours % 12;
        minutes = rpTime.minutes;
        seconds = 0;
        day = '??';
        weather = rpWeather;
    }
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    const secondDeg = seconds * 6;
    
    hourHand.style.transform = `rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;
    if (dateEl) dateEl.textContent = day;
    
    if (weatherEl && weatherIcon) {
        weatherEl.className = 'watch-weather ' + weather;
        weatherIcon.className = 'fa-solid ' + (WEATHER_ICONS[weather] || 'fa-cloud');
    }
}

/**
 * Toggle between real time and RP time modes
 */
export function toggleWatchMode() {
    const watchEl = document.getElementById('ie-header-watch');
    if (!watchEl) return;
    
    watchMode = (watchMode === 'real') ? 'rp' : 'real';
    watchEl.classList.toggle('real-mode', watchMode === 'real');
    watchEl.classList.toggle('rp-mode', watchMode === 'rp');
    updateWatch();
}

/**
 * Start the watch interval
 */
export function startWatch() {
    updateWatch();
    watchInterval = setInterval(updateWatch, 1000);
}

/**
 * Stop the watch interval
 */
export function stopWatch() {
    if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
    }
}

/**
 * Set RP time manually
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 */
export function setRPTime(hours, minutes) {
    rpTime.hours = hours;
    rpTime.minutes = minutes;
    if (watchMode === 'rp') {
        updateWatch();
    }
}

/**
 * Set RP weather manually
 * @param {string} weather - Weather key (clear-day, rainy, etc.)
 */
export function setRPWeather(weather) {
    rpWeather = weather;
    if (watchMode === 'rp') {
        updateWatch();
    }
}

/**
 * Get current watch mode
 * @returns {string} 'real' or 'rp'
 */
export function getWatchMode() {
    return watchMode;
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
