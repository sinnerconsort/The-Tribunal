/**
 * The Tribunal - Watch Functionality
 * Real-time / RP-time toggle with weather display
 * 
 * v2.0.1 - Fixed import path for weather-integration.js
 *        - Added fallback weather detection
 *        - Added debug logging for weather connection
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let watchMode = 'rp';  // Default to RP mode (chat-detected)
let watchInterval = null;
let rpTime = { hours: 14, minutes: 30 };
let rpWeather = 'clear-day';
let realWeatherCache = null;
let realWeatherLastFetch = 0;
let userLocation = null;
let weatherUnsubscribe = null;

// Weather effects module (lazy loaded)
let weatherEffects = null;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
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
    'fog': 'fa-smog',
    'foggy': 'fa-smog',
    'wind': 'fa-wind',
    'windy': 'fa-wind',
    'mist': 'fa-smog'
};

// Map weather effects → watch weather keys
const EFFECTS_TO_WATCH = {
    'rain': 'rainy',
    'snow': 'snowy',
    'storm': 'stormy',
    'fog': 'foggy',
    'wind': 'windy',
    'waves': 'cloudy',
    'smoke': 'foggy',
    'clear': 'clear-day'
};

// Map WMO codes → watch weather keys
const WMO_TO_WATCH = {
    0: 'clear',      // Clear sky
    1: 'clear',      // Mainly clear
    2: 'cloudy',     // Partly cloudy
    3: 'overcast',   // Overcast
    45: 'foggy',     // Fog
    48: 'foggy',     // Depositing rime fog
    51: 'rainy',     // Light drizzle
    53: 'rainy',     // Moderate drizzle
    55: 'rainy',     // Dense drizzle
    61: 'rainy',     // Slight rain
    63: 'rainy',     // Moderate rain
    65: 'rainy',     // Heavy rain
    71: 'snowy',     // Slight snow
    73: 'snowy',     // Moderate snow
    75: 'snowy',     // Heavy snow
    80: 'rainy',     // Rain showers
    81: 'rainy',     // Moderate rain showers
    82: 'stormy',    // Violent rain showers
    95: 'stormy',    // Thunderstorm
    96: 'stormy',    // Thunderstorm with hail
    99: 'stormy'     // Thunderstorm with heavy hail
};

// ═══════════════════════════════════════════════════════════════
// OPEN-METEO API (Free, no key required)
// ═══════════════════════════════════════════════════════════════

/**
 * Get user's approximate location via IP geolocation
 */
async function getUserLocation() {
    if (userLocation) return userLocation;
    
    try {
        // Use ip-api.com for free geolocation
        const response = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName,country');
        const data = await response.json();
        
        if (data.lat && data.lon) {
            userLocation = {
                latitude: data.lat,
                longitude: data.lon,
                name: `${data.city}, ${data.regionName}`
            };
            console.log('[Watch] Location detected:', userLocation.name);
            return userLocation;
        }
    } catch (e) {
        console.warn('[Watch] Geolocation failed:', e.message);
    }
    
    // Fallback: somewhere temperate
    return { latitude: 40.7128, longitude: -74.0060, name: 'New York' };
}

/**
 * Fetch real weather from Open-Meteo API
 */
async function fetchRealWeather() {
    // Cache for 10 minutes
    const now = Date.now();
    if (realWeatherCache && (now - realWeatherLastFetch) < 600000) {
        return realWeatherCache;
    }
    
    try {
        const location = await getUserLocation();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const weatherCode = data.current.weather_code;
        const tempF = Math.round(data.current.temperature_2m);
        const hour = new Date().getHours();
        
        // Determine day/night variant
        let watchWeather = WMO_TO_WATCH[weatherCode] || 'cloudy';
        if (watchWeather === 'clear') {
            watchWeather = (hour >= 6 && hour < 20) ? 'clear-day' : 'clear-night';
        }
        
        realWeatherCache = {
            weather: watchWeather,
            temp: tempF,
            code: weatherCode,
            location: location.name
        };
        realWeatherLastFetch = now;
        
        console.log('[Watch] Real weather:', realWeatherCache);
        return realWeatherCache;
        
    } catch (e) {
        console.warn('[Watch] Weather API failed:', e.message);
        // Fallback based on time
        const hour = new Date().getHours();
        return {
            weather: (hour >= 6 && hour < 20) ? 'clear-day' : 'clear-night',
            temp: null,
            code: 0,
            location: 'Unknown'
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// WEATHER EFFECTS INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Connect to weather effects system
 * FIXED: Correct import path from ui/ to systems/
 */
async function connectWeatherEffects() {
    if (weatherEffects) return;
    
    try {
        // FIXED: Correct relative path from src/ui/ to src/systems/
        weatherEffects = await import('../systems/weather-integration.js');
        console.log('[Watch] Weather effects module loaded successfully');
        
        // Subscribe to weather changes
        if (weatherEffects.subscribe) {
            weatherUnsubscribe = weatherEffects.subscribe((data) => {
                console.log('[Watch] Received weather event:', data);
                if (watchMode === 'rp') {
                    onWeatherEffectChange(data);
                }
            });
            console.log('[Watch] ✓ Subscribed to weather effects');
        } else {
            console.warn('[Watch] Weather effects module has no subscribe function');
        }
        
        // Also try to get initial state
        if (weatherEffects.getState) {
            const initialState = weatherEffects.getState();
            console.log('[Watch] Initial weather state:', initialState);
            if (initialState.weather && watchMode === 'rp') {
                onWeatherEffectChange(initialState);
            }
        }
        
    } catch (e) {
        console.error('[Watch] ✗ Failed to connect weather effects:', e.message);
        console.error('[Watch] Stack:', e.stack);
    }
}

/**
 * Handle weather effect changes (in RP mode)
 */
function onWeatherEffectChange(data) {
    console.log('[Watch] Processing weather change:', data);
    
    // Update RP weather from effects
    if (data.weather) {
        rpWeather = EFFECTS_TO_WATCH[data.weather] || data.weather;
        console.log('[Watch] Set rpWeather to:', rpWeather);
    } else if (data.period) {
        // Use period to determine day/night if no weather
        if (data.period === 'day') rpWeather = 'clear-day';
        else if (data.period.includes('night')) rpWeather = 'clear-night';
    }
    
    // Sync time from period
    if (data.period === 'day') {
        rpTime.hours = 14; // Afternoon
    } else if (data.period === 'city-night') {
        rpTime.hours = 20; // Evening
    } else if (data.period === 'quiet-night') {
        rpTime.hours = 2; // Late night
    }
    
    updateWatch();
    updateNewspaper();
}

/**
 * Push watch state TO weather effects (when watch changes)
 */
function syncEffectsFromWatch() {
    if (!weatherEffects || watchMode !== 'rp') return;
    
    // Only sync if effects module is loaded
    const hour = rpTime.hours;
    const timeString = `${hour.toString().padStart(2, '0')}:${rpTime.minutes.toString().padStart(2, '0')}`;
    
    if (weatherEffects.syncWithWeatherTime) {
        weatherEffects.syncWithWeatherTime({ time: timeString });
    }
}

// ═══════════════════════════════════════════════════════════════
// WATCH DISPLAY
// ═══════════════════════════════════════════════════════════════

/**
 * Get current weather based on mode
 */
async function getCurrentWeather() {
    if (watchMode === 'real') {
        const data = await fetchRealWeather();
        return data.weather;
    } else {
        return rpWeather;
    }
}

/**
 * Update the watch display
 */
export async function updateWatch() {
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
        weather = await getCurrentWeather();
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
 * Update newspaper strip to match watch
 */
export function updateNewspaper() {
    const strip = document.getElementById('newspaper-strip');
    if (!strip) {
        console.log('[Watch] Newspaper strip not found');
        return;
    }
    
    const now = new Date();
    const hour = watchMode === 'real' ? now.getHours() : rpTime.hours;
    
    // Determine period
    let period = 'AFTERNOON';
    if (hour >= 5 && hour < 7) period = 'DAWN';
    else if (hour >= 7 && hour < 12) period = 'MORNING';
    else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
    else if (hour >= 17 && hour < 20) period = 'EVENING';
    else if (hour >= 20 && hour < 23) period = 'NIGHT';
    else period = 'LATE_NIGHT';
    
    // Get weather text
    const weather = watchMode === 'real' ? (realWeatherCache?.weather || 'clear') : rpWeather;
    const weatherText = weather.replace('-day', '').replace('-night', '');
    
    console.log('[Watch] Updating newspaper - weather:', weather, 'period:', period);
    
    // Update elements
    const dateEl = document.getElementById('newspaper-date');
    const periodEl = document.getElementById('newspaper-period');
    const weatherTextEl = document.getElementById('newspaper-weather-text');
    const weatherIconEl = document.getElementById('newspaper-weather-icon');
    const tempEl = document.getElementById('newspaper-weather-temp');
    
    if (dateEl) {
        if (watchMode === 'real') {
            dateEl.textContent = `${now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} ${now.getDate()}`;
        } else {
            dateEl.textContent = '??? ??';
        }
    }
    
    if (periodEl) periodEl.textContent = period;
    if (weatherTextEl) weatherTextEl.textContent = weatherText.charAt(0).toUpperCase() + weatherText.slice(1);
    if (weatherIconEl) weatherIconEl.className = 'fa-solid ' + (WEATHER_ICONS[weather] || 'fa-cloud');
    
    if (tempEl) {
        if (watchMode === 'real' && realWeatherCache?.temp) {
            tempEl.textContent = `${realWeatherCache.temp}°`;
            tempEl.style.display = '';
        } else {
            tempEl.style.display = 'none';
        }
    }
    
    // Update strip classes
    strip.className = 'newspaper-strip';
    strip.classList.add('weather-' + weather.replace('-day', '').replace('-night', ''));
    strip.classList.add('period-' + period.toLowerCase().replace('_', '-'));
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle between real time and RP time modes
 */
export function toggleWatchMode() {
    const watchEl = document.getElementById('ie-header-watch');
    
    watchMode = (watchMode === 'real') ? 'rp' : 'real';
    
    if (watchEl) {
        watchEl.classList.toggle('real-mode', watchMode === 'real');
        watchEl.classList.toggle('rp-mode', watchMode === 'rp');
    }
    
    console.log('[Watch] Mode:', watchMode);
    updateWatch();
    updateNewspaper();
    
    // If switching to real mode, sync effects from real weather
    if (watchMode === 'real' && weatherEffects) {
        fetchRealWeather().then(data => {
            // Map real weather to effects
            const effectsWeather = Object.entries(EFFECTS_TO_WATCH)
                .find(([k, v]) => v === data.weather)?.[0] || 'clear';
            if (weatherEffects.setWeather) {
                weatherEffects.setWeather(effectsWeather);
            }
        });
    }
}

/**
 * Start the watch interval
 */
export async function startWatch() {
    console.log('[Watch] Starting...');
    
    // Connect to weather effects
    await connectWeatherEffects();
    
    // Initial update
    await updateWatch();
    updateNewspaper();
    
    // Start interval (every second for clock, weather refreshes less often)
    watchInterval = setInterval(async () => {
        await updateWatch();
        // Update newspaper less frequently
        if (Date.now() % 60000 < 1000) {
            updateNewspaper();
        }
    }, 1000);
    
    console.log('[Watch] Started in', watchMode, 'mode');
}

/**
 * Stop the watch interval
 */
export function stopWatch() {
    if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
    }
    if (weatherUnsubscribe) {
        weatherUnsubscribe();
        weatherUnsubscribe = null;
    }
}

/**
 * Set RP time manually
 */
export function setRPTime(hours, minutes) {
    rpTime.hours = hours;
    rpTime.minutes = minutes !== undefined ? minutes : rpTime.minutes;
    
    if (watchMode === 'rp') {
        updateWatch();
        updateNewspaper();
        syncEffectsFromWatch();
    }
}

/**
 * Set RP weather manually
 */
export function setRPWeather(weather) {
    rpWeather = weather;
    console.log('[Watch] setRPWeather called with:', weather);
    
    if (watchMode === 'rp') {
        updateWatch();
        updateNewspaper();
        
        // Sync to effects
        if (weatherEffects?.setWeather) {
            const effectsWeather = Object.entries(EFFECTS_TO_WATCH)
                .find(([k, v]) => v === weather)?.[0] || weather;
            weatherEffects.setWeather(effectsWeather);
        }
    }
}

/**
 * Get current watch mode
 */
export function getWatchMode() {
    return watchMode;
}

/**
 * Get current RP time
 */
export function getRPTime() {
    return { ...rpTime };
}

/**
 * Get current RP weather
 */
export function getRPWeather() {
    return rpWeather;
}

/**
 * Set watch mode directly
 */
export function setWatchMode(mode) {
    if (mode === 'real' || mode === 'rp') {
        watchMode = mode;
        updateWatch();
        updateNewspaper();
    }
}

/**
 * Get current state for persistence
 */
export function getWatchState() {
    return {
        mode: watchMode,
        rpTime: { ...rpTime },
        rpWeather
    };
}

/**
 * Restore state from persistence
 */
export function restoreWatchState(state) {
    if (!state) return;
    if (state.mode) watchMode = state.mode;
    if (state.rpTime) rpTime = { ...state.rpTime };
    if (state.rpWeather) rpWeather = state.rpWeather;
    updateWatch();
    updateNewspaper();
}

/**
 * Force refresh weather from effects
 */
export function refreshFromEffects() {
    if (weatherEffects?.getState) {
        const state = weatherEffects.getState();
        console.log('[Watch] Force refresh from effects:', state);
        if (state.weather && watchMode === 'rp') {
            onWeatherEffectChange(state);
        }
    }
}

/**
 * Debug: Log current state
 */
export function debugWatch() {
    console.log('[Watch Debug]', {
        watchMode,
        rpTime,
        rpWeather,
        weatherEffectsLoaded: !!weatherEffects,
        subscribed: !!weatherUnsubscribe,
        realWeatherCache
    });
    
    if (weatherEffects?.debugWeather) {
        console.log('[Watch Debug] Weather effects:', weatherEffects.debugWeather());
    }
}
