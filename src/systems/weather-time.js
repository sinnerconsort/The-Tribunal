/**
 * The Tribunal - Weather & Time System
 * Core data layer for META (real-world) and AUTO (story) modes
 * 
 * META MODE: Real IRL time + Open-Meteo weather API
 * AUTO MODE: Story-extracted time + weather transitions
 * 
 * @version 1.0.0
 */

import { getSettings, saveSettings, getSetting, setSetting } from '../core/persistence.js';
import { getChatState, saveChatState } from '../core/persistence.js';
import { eventSource, event_types, getContext } from '../../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Cache duration for weather data (5 minutes) */
const WEATHER_CACHE_DURATION = 5 * 60 * 1000;

/** WMO Weather Code descriptions */
const WMO_WEATHER_CODES = {
    0: { text: 'Clear sky', type: 'clear', icon: 'clear-day' },
    1: { text: 'Mainly clear', type: 'clear', icon: 'clear-day' },
    2: { text: 'Partly cloudy', type: 'cloudy', icon: 'cloudy' },
    3: { text: 'Overcast', type: 'cloudy', icon: 'cloudy' },
    45: { text: 'Foggy', type: 'mist', icon: 'foggy' },
    48: { text: 'Rime fog', type: 'mist', icon: 'foggy' },
    51: { text: 'Light drizzle', type: 'rain', icon: 'rainy' },
    53: { text: 'Moderate drizzle', type: 'rain', icon: 'rainy' },
    55: { text: 'Dense drizzle', type: 'rain', icon: 'rainy' },
    56: { text: 'Freezing drizzle', type: 'rain', icon: 'rainy' },
    57: { text: 'Heavy freezing drizzle', type: 'rain', icon: 'rainy' },
    61: { text: 'Slight rain', type: 'rain', icon: 'rainy' },
    63: { text: 'Moderate rain', type: 'rain', icon: 'rainy' },
    65: { text: 'Heavy rain', type: 'rain', icon: 'rainy' },
    66: { text: 'Freezing rain', type: 'rain', icon: 'rainy' },
    67: { text: 'Heavy freezing rain', type: 'rain', icon: 'rainy' },
    71: { text: 'Slight snow', type: 'snow', icon: 'snowy' },
    73: { text: 'Moderate snow', type: 'snow', icon: 'snowy' },
    75: { text: 'Heavy snow', type: 'snow', icon: 'snowy' },
    77: { text: 'Snow grains', type: 'snow', icon: 'snowy' },
    80: { text: 'Rain showers', type: 'rain', icon: 'rainy' },
    81: { text: 'Moderate rain showers', type: 'rain', icon: 'rainy' },
    82: { text: 'Violent rain showers', type: 'storm', icon: 'stormy' },
    85: { text: 'Snow showers', type: 'snow', icon: 'snowy' },
    86: { text: 'Heavy snow showers', type: 'blizzard', icon: 'snowy' },
    95: { text: 'Thunderstorm', type: 'storm', icon: 'stormy' },
    96: { text: 'Thunderstorm with hail', type: 'storm', icon: 'stormy' },
    99: { text: 'Severe thunderstorm', type: 'storm', icon: 'stormy' }
};

/** US State abbreviations for geocoding */
const US_STATE_ABBREV = {
    'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas',
    'ca': 'california', 'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware',
    'fl': 'florida', 'ga': 'georgia', 'hi': 'hawaii', 'id': 'idaho',
    'il': 'illinois', 'in': 'indiana', 'ia': 'iowa', 'ks': 'kansas',
    'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
    'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi',
    'mo': 'missouri', 'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada',
    'nh': 'new hampshire', 'nj': 'new jersey', 'nm': 'new mexico', 'ny': 'new york',
    'nc': 'north carolina', 'nd': 'north dakota', 'oh': 'ohio', 'ok': 'oklahoma',
    'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode island', 'sc': 'south carolina',
    'sd': 'south dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah',
    'vt': 'vermont', 'va': 'virginia', 'wa': 'washington', 'wv': 'west virginia',
    'wi': 'wisconsin', 'wy': 'wyoming'
};

/** Time period definitions */
const TIME_PERIODS = {
    DAWN: { start: 5, end: 7, label: 'Dawn', icon: '🌅' },
    MORNING: { start: 7, end: 12, label: 'Morning', icon: '☀️' },
    AFTERNOON: { start: 12, end: 17, label: 'Afternoon', icon: '🌤️' },
    EVENING: { start: 17, end: 20, label: 'Evening', icon: '🌆' },
    NIGHT: { start: 20, end: 23, label: 'Night', icon: '🌙' },
    LATE_NIGHT: { start: 23, end: 5, label: 'Late Night', icon: '🌑' }
};

/** Weather transition rules for AUTO mode */
const WEATHER_TRANSITIONS = {
    clear: { minor: ['cloudy'], moderate: ['cloudy', 'mist'], major: ['rain', 'wind'] },
    cloudy: { minor: ['clear', 'cloudy'], moderate: ['rain', 'mist'], major: ['storm', 'clear'] },
    rain: { minor: ['rain', 'cloudy'], moderate: ['storm', 'clear'], major: ['clear', 'snow'] },
    storm: { minor: ['rain'], moderate: ['rain', 'cloudy'], major: ['clear'] },
    snow: { minor: ['snow', 'cloudy'], moderate: ['blizzard', 'cloudy'], major: ['clear'] },
    blizzard: { minor: ['snow'], moderate: ['snow', 'cloudy'], major: ['clear'] },
    mist: { minor: ['mist', 'cloudy'], moderate: ['cloudy', 'clear'], major: ['rain', 'clear'] },
    wind: { minor: ['cloudy'], moderate: ['clear', 'rain'], major: ['storm', 'clear'] }
};

/** Keywords for extracting time from text */
const TIME_KEYWORDS = {
    'dawn': 6, 'sunrise': 6, 'daybreak': 6,
    'early morning': 7, 'morning': 9,
    'midday': 12, 'noon': 12, 'mid-day': 12,
    'afternoon': 14, 'late afternoon': 16,
    'evening': 19, 'dusk': 19, 'sunset': 19, 'twilight': 20,
    'night': 22, 'nighttime': 22, 'nightfall': 20,
    'midnight': 0, 'late night': 2, 'dead of night': 3
};

/** Keywords for extracting weather from text */
const WEATHER_KEYWORDS = {
    clear: ['clear', 'sunny', 'bright', 'cloudless', 'blue sky'],
    cloudy: ['cloud', 'overcast', 'grey', 'gray', 'gloomy'],
    rain: ['rain', 'drizzle', 'shower', 'downpour', 'wet'],
    storm: ['storm', 'thunder', 'lightning', 'tempest'],
    snow: ['snow', 'flurr', 'frost', 'ice', 'frozen'],
    blizzard: ['blizzard', 'whiteout'],
    mist: ['fog', 'mist', 'haze', 'murky'],
    wind: ['wind', 'breeze', 'gust', 'gale', 'blustery']
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let cachedMetaWeather = null;
let cacheTimestamp = 0;
let lastActivityTimestamp = Date.now();
let geolocationAttempted = false;

// ═══════════════════════════════════════════════════════════════
// MODE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get current watch mode
 * @returns {'meta'|'auto'} Current mode
 */
export function getWatchMode() {
    return getSetting('watch.mode', 'meta');
}

/**
 * Set watch mode
 * @param {'meta'|'auto'} mode - Mode to set
 */
export function setWatchMode(mode) {
    if (mode !== 'meta' && mode !== 'auto') {
        console.warn('[WeatherTime] Invalid mode:', mode);
        return;
    }
    setSetting('watch.mode', mode);
    console.log('[WeatherTime] Mode set to:', mode);
    
    // Emit event for UI updates
    eventSource.emit('TRIBUNAL_WATCH_MODE_CHANGED', { mode });
}

/**
 * Toggle between meta and auto modes
 * @returns {'meta'|'auto'} New mode
 */
export function toggleWatchMode() {
    const current = getWatchMode();
    const newMode = current === 'meta' ? 'auto' : 'meta';
    setWatchMode(newMode);
    return newMode;
}

// ═══════════════════════════════════════════════════════════════
// META MODE: REAL TIME
// ═══════════════════════════════════════════════════════════════

/**
 * Get current real-world time
 * @returns {Object} Time data
 */
export function getMetaTime() {
    const now = new Date();
    return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        period: getTimePeriod(now.getHours()),
        formatted: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        timestamp: now.getTime()
    };
}

// ═══════════════════════════════════════════════════════════════
// META MODE: GEOLOCATION
// ═══════════════════════════════════════════════════════════════

/**
 * Attempt to get user's location via browser geolocation
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function tryGeolocation() {
    if (!navigator.geolocation) {
        console.log('[WeatherTime] Geolocation not supported');
        return null;
    }
    
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                console.log('[WeatherTime] Geolocation success:', coords);
                
                // Save to settings
                setSetting('watch.meta.coordinates', coords);
                setSetting('watch.meta.locationSource', 'geolocation');
                
                resolve(coords);
            },
            (error) => {
                console.log('[WeatherTime] Geolocation failed:', error.message);
                resolve(null);
            },
            { timeout: 10000, maximumAge: 300000 } // 10s timeout, 5min cache
        );
    });
}

/**
 * Geocode a location string to coordinates
 * @param {string} locationString - City, State/Country format
 * @returns {Promise<Object|null>} Location data or null
 */
export async function geocodeLocation(locationString) {
    if (!locationString) return null;
    
    try {
        const parts = locationString.split(',').map(s => s.trim());
        const cityName = parts[0];
        const regionName = parts.length >= 2 ? parts[1].toLowerCase() : null;
        
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`;
        
        const response = await fetch(geoUrl);
        const data = await response.json();
        
        if (!data.results?.length) {
            console.warn('[WeatherTime] Location not found:', cityName);
            return null;
        }
        
        // Find best match if region specified
        let result = data.results[0];
        if (regionName) {
            const normalized = US_STATE_ABBREV[regionName] || regionName;
            const match = data.results.find(r => {
                const admin1 = (r.admin1 || '').toLowerCase();
                const country = (r.country || '').toLowerCase();
                return admin1.includes(normalized) || country.includes(normalized);
            });
            if (match) result = match;
        }
        
        const location = {
            latitude: result.latitude,
            longitude: result.longitude,
            name: result.name,
            region: result.admin1,
            country: result.country,
            displayName: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`
        };
        
        // Save to settings
        setSetting('watch.meta.coordinates', { latitude: location.latitude, longitude: location.longitude });
        setSetting('watch.meta.locationName', location.displayName);
        setSetting('watch.meta.locationSource', 'manual');
        
        console.log('[WeatherTime] Geocoded location:', location.displayName);
        return location;
        
    } catch (error) {
        console.error('[WeatherTime] Geocoding error:', error);
        return null;
    }
}

/**
 * Get current META location (coordinates)
 * Tries: saved coords → geolocation → null
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function getMetaLocation() {
    // Check for saved coordinates
    const saved = getSetting('watch.meta.coordinates');
    if (saved?.latitude && saved?.longitude) {
        return saved;
    }
    
    // Try geolocation (only once per session to avoid spam)
    if (!geolocationAttempted) {
        geolocationAttempted = true;
        const geo = await tryGeolocation();
        if (geo) return geo;
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// META MODE: WEATHER API
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch weather from Open-Meteo API
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Weather data
 */
async function fetchWeatherAPI(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const current = data.current;
    const tempC = Math.round(current.temperature_2m);
    const tempF = Math.round((tempC * 9/5) + 32);
    const windKmh = Math.round(current.wind_speed_10m);
    const windMph = Math.round(windKmh * 0.621371);
    const codeInfo = WMO_WEATHER_CODES[current.weather_code] || WMO_WEATHER_CODES[0];
    
    return {
        tempC,
        tempF,
        humidity: current.relative_humidity_2m,
        windKmh,
        windMph,
        code: current.weather_code,
        condition: codeInfo.text,
        type: codeInfo.type,
        icon: codeInfo.icon,
        timestamp: Date.now()
    };
}

/**
 * Get META mode weather (with caching)
 * @param {boolean} forceRefresh - Skip cache
 * @returns {Promise<Object|null>} Weather data
 */
export async function getMetaWeather(forceRefresh = false) {
    // Check cache
    if (!forceRefresh && cachedMetaWeather && (Date.now() - cacheTimestamp) < WEATHER_CACHE_DURATION) {
        return cachedMetaWeather;
    }
    
    // Get location
    const coords = await getMetaLocation();
    if (!coords) {
        console.log('[WeatherTime] No location for META weather');
        return null;
    }
    
    try {
        const weather = await fetchWeatherAPI(coords.latitude, coords.longitude);
        weather.locationName = getSetting('watch.meta.locationName', 'Unknown');
        
        // Update cache
        cachedMetaWeather = weather;
        cacheTimestamp = Date.now();
        
        console.log('[WeatherTime] META weather updated:', weather.condition);
        return weather;
        
    } catch (error) {
        console.error('[WeatherTime] Weather API error:', error);
        return cachedMetaWeather; // Return stale cache if available
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO MODE: TIME TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Get AUTO mode time from chat state
 * @returns {Object} Time data
 */
export function getAutoTime() {
    const state = getChatState();
    const timeData = state?.ledger?.time || {
        hours: 12,
        minutes: 0,
        period: 'AFTERNOON',
        dayOfWeek: 'MON',
        day: 1
    };
    
    return {
        hours: timeData.hours,
        minutes: timeData.minutes || 0,
        seconds: 0,
        day: timeData.day || '??',
        dayOfWeek: timeData.dayOfWeek || '???',
        period: getTimePeriod(timeData.hours),
        formatted: formatTime(timeData.hours, timeData.minutes || 0),
        timestamp: null
    };
}

/**
 * Set AUTO mode time
 * @param {number} hours - 0-23
 * @param {number} minutes - 0-59
 */
export function setAutoTime(hours, minutes = 0) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.ledger) state.ledger = {};
    if (!state.ledger.time) state.ledger.time = {};
    
    state.ledger.time.hours = hours;
    state.ledger.time.minutes = minutes;
    state.ledger.time.period = getTimePeriod(hours).key;
    
    saveChatState();
    console.log('[WeatherTime] AUTO time set:', formatTime(hours, minutes));
    
    eventSource.emit('TRIBUNAL_TIME_CHANGED', { hours, minutes, mode: 'auto' });
}

/**
 * Advance AUTO time by duration
 * @param {number} hours - Hours to advance
 * @param {number} minutes - Minutes to advance
 */
export function advanceAutoTime(hours = 0, minutes = 0) {
    const current = getAutoTime();
    let newMinutes = current.minutes + minutes;
    let newHours = current.hours + hours + Math.floor(newMinutes / 60);
    newMinutes = newMinutes % 60;
    newHours = newHours % 24;
    
    setAutoTime(newHours, newMinutes);
}

// ═══════════════════════════════════════════════════════════════
// AUTO MODE: WEATHER TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Get AUTO mode weather from chat state
 * @returns {Object} Weather data
 */
export function getAutoWeather() {
    const state = getChatState();
    const weatherData = state?.ledger?.weather || {
        type: 'clear',
        condition: 'Clear',
        icon: 'clear-day',
        tempF: 70,
        tempC: 21
    };
    
    return {
        ...weatherData,
        timestamp: weatherData.timestamp || null
    };
}

/**
 * Set AUTO mode weather
 * @param {string} type - Weather type (clear, rain, snow, etc.)
 * @param {Object} details - Optional additional details
 */
export function setAutoWeather(type, details = {}) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.ledger) state.ledger = {};
    
    // Determine icon based on type and time
    const time = getAutoTime();
    const isNight = time.hours >= 20 || time.hours < 6;
    let icon = type;
    if (type === 'clear') {
        icon = isNight ? 'clear-night' : 'clear-day';
    }
    
    state.ledger.weather = {
        type,
        condition: details.condition || capitalizeFirst(type),
        icon,
        tempF: details.tempF ?? state.ledger.weather?.tempF ?? 70,
        tempC: details.tempC ?? state.ledger.weather?.tempC ?? 21,
        timestamp: Date.now()
    };
    
    saveChatState();
    console.log('[WeatherTime] AUTO weather set:', type);
    
    eventSource.emit('TRIBUNAL_WEATHER_CHANGED', { type, mode: 'auto' });
}

// ═══════════════════════════════════════════════════════════════
// AUTO MODE: MESSAGE SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Scan text for time keywords
 * @param {string} text - Text to scan
 * @returns {number|null} Extracted hour or null
 */
export function extractTimeFromText(text) {
    if (!text) return null;
    
    const lower = text.toLowerCase();
    
    // Check keyword phrases (longer first)
    const sortedKeywords = Object.entries(TIME_KEYWORDS)
        .sort((a, b) => b[0].length - a[0].length);
    
    for (const [keyword, hour] of sortedKeywords) {
        if (lower.includes(keyword)) {
            return hour;
        }
    }
    
    // Try parsing explicit times: "3:00 PM", "15:00", "3 PM"
    const ampmMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const isPM = ampmMatch[3].toLowerCase() === 'pm';
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        return hour;
    }
    
    // 24-hour format
    const militaryMatch = lower.match(/(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
        const hour = parseInt(militaryMatch[1], 10);
        if (hour >= 0 && hour <= 23) return hour;
    }
    
    return null;
}

/**
 * Scan text for weather keywords
 * @param {string} text - Text to scan
 * @returns {string|null} Extracted weather type or null
 */
export function extractWeatherFromText(text) {
    if (!text) return null;
    
    const lower = text.toLowerCase();
    
    // Check each weather type's keywords
    for (const [type, keywords] of Object.entries(WEATHER_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return type;
            }
        }
    }
    
    return null;
}

/**
 * Scan recent chat messages for time/weather cues
 * @param {number} messageCount - Number of recent messages to scan
 * @returns {Object} Extracted data
 */
export function scanRecentMessages(messageCount = 5) {
    const context = getContext();
    const chat = context?.chat || [];
    
    if (chat.length === 0) return { time: null, weather: null };
    
    // Get last N messages
    const recent = chat.slice(-messageCount);
    
    let extractedTime = null;
    let extractedWeather = null;
    
    // Scan from newest to oldest
    for (let i = recent.length - 1; i >= 0; i--) {
        const msg = recent[i];
        if (!msg.mes) continue;
        
        // Extract time (take first found)
        if (extractedTime === null) {
            extractedTime = extractTimeFromText(msg.mes);
        }
        
        // Extract weather (take first found)
        if (extractedWeather === null) {
            extractedWeather = extractWeatherFromText(msg.mes);
        }
        
        // Stop if we found both
        if (extractedTime !== null && extractedWeather !== null) break;
    }
    
    return {
        time: extractedTime,
        weather: extractedWeather
    };
}

/**
 * Update AUTO state from recent messages
 * Called after AI message received
 */
export function updateAutoFromMessages() {
    if (getWatchMode() !== 'auto') return;
    
    const extracted = scanRecentMessages(3);
    
    if (extracted.time !== null) {
        const current = getAutoTime();
        if (extracted.time !== current.hours) {
            setAutoTime(extracted.time, 0);
            console.log('[WeatherTime] AUTO time updated from message:', extracted.time);
        }
    }
    
    if (extracted.weather !== null) {
        const current = getAutoWeather();
        if (extracted.weather !== current.type) {
            setAutoWeather(extracted.weather);
            console.log('[WeatherTime] AUTO weather updated from message:', extracted.weather);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO MODE: IDLE-BASED TRANSITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get hours since last activity
 * @returns {number} Idle hours
 */
export function getIdleHours() {
    return (Date.now() - lastActivityTimestamp) / (1000 * 60 * 60);
}

/**
 * Update last activity timestamp
 */
export function updateActivity() {
    lastActivityTimestamp = Date.now();
}

/**
 * Get transition severity based on idle time
 * @param {number} idleHours 
 * @returns {'minor'|'moderate'|'major'|null}
 */
function getTransitionSeverity(idleHours) {
    if (idleHours < 1) return null;
    if (idleHours < 3) return 'minor';
    if (idleHours < 8) return 'moderate';
    return 'major';
}

/**
 * Calculate weather transition based on idle time
 * @returns {Object|null} Transition data or null
 */
export function calculateWeatherTransition() {
    const idleHours = getIdleHours();
    const severity = getTransitionSeverity(idleHours);
    
    if (!severity) return null;
    
    const current = getAutoWeather();
    const transitions = WEATHER_TRANSITIONS[current.type];
    
    if (!transitions || !transitions[severity]) return null;
    
    const options = transitions[severity];
    const newType = options[Math.floor(Math.random() * options.length)];
    
    return {
        from: current.type,
        to: newType,
        severity,
        idleHours: Math.round(idleHours * 10) / 10
    };
}

/**
 * Apply idle-based transitions to AUTO state
 * Call this on chat load or return from idle
 */
export function applyIdleTransitions() {
    if (getWatchMode() !== 'auto') return;
    
    const idleHours = getIdleHours();
    if (idleHours < 1) {
        updateActivity();
        return;
    }
    
    // Advance time proportionally to idle time
    advanceAutoTime(Math.floor(idleHours), Math.floor((idleHours % 1) * 60));
    
    // Maybe transition weather
    const transition = calculateWeatherTransition();
    if (transition) {
        setAutoWeather(transition.to);
        console.log('[WeatherTime] Weather transitioned:', transition.from, '→', transition.to);
        
        eventSource.emit('TRIBUNAL_WEATHER_TRANSITION', transition);
    }
    
    updateActivity();
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED API (Mode-Aware)
// ═══════════════════════════════════════════════════════════════

/**
 * Get current time (mode-aware)
 * @returns {Object} Time data
 */
export function getCurrentTime() {
    return getWatchMode() === 'meta' ? getMetaTime() : getAutoTime();
}

/**
 * Get current weather (mode-aware)
 * @returns {Promise<Object>} Weather data
 */
export async function getCurrentWeather() {
    if (getWatchMode() === 'meta') {
        return await getMetaWeather();
    } else {
        return getAutoWeather();
    }
}

/**
 * Get full watch state for UI
 * @returns {Promise<Object>} Complete watch state
 */
export async function getWatchState() {
    const mode = getWatchMode();
    const time = getCurrentTime();
    const weather = mode === 'meta' ? await getMetaWeather() : getAutoWeather();
    
    return {
        mode,
        time,
        weather,
        locationName: mode === 'meta' 
            ? getSetting('watch.meta.locationName', 'Set Location')
            : (getChatState()?.ledger?.currentLocation || 'Unknown')
    };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get time period from hour
 * @param {number} hour - 0-23
 * @returns {Object} Period data
 */
function getTimePeriod(hour) {
    for (const [key, period] of Object.entries(TIME_PERIODS)) {
        if (period.start <= period.end) {
            if (hour >= period.start && hour < period.end) {
                return { key, ...period };
            }
        } else {
            // Wraps around midnight (LATE_NIGHT: 23-5)
            if (hour >= period.start || hour < period.end) {
                return { key, ...period };
            }
        }
    }
    return { key: 'AFTERNOON', ...TIME_PERIODS.AFTERNOON };
}

/**
 * Format time as string
 * @param {number} hours 
 * @param {number} minutes 
 * @returns {string}
 */
function formatTime(hours, minutes) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMin = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMin} ${period}`;
}

/**
 * Capitalize first letter
 * @param {string} str 
 * @returns {string}
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the weather-time system
 */
export function initWeatherTime() {
    console.log('[WeatherTime] Initializing...');
    
    // Register activity tracking
    eventSource.on(event_types.MESSAGE_SENT, updateActivity);
    eventSource.on(event_types.MESSAGE_RECEIVED, () => {
        updateActivity();
        updateAutoFromMessages();
    });
    
    // Apply idle transitions on chat change
    eventSource.on(event_types.CHAT_CHANGED, () => {
        setTimeout(applyIdleTransitions, 500);
    });
    
    // Initial activity timestamp
    updateActivity();
    
    console.log('[WeatherTime] Initialized - Mode:', getWatchMode());
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR WEATHER EFFECTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get unified weather/time state for weather-effects integration
 * @returns {Object} State object with period, weather, location
 */
export function getWeatherTimeState() {
    const time = getCurrentTime();
    const weather = getAutoWeather();  // Use auto weather (sync version)
    const mode = getWatchMode();
    
    // Determine period from current hour
    const hour = time?.hours ?? 12;
    const periodData = getTimePeriod(hour);
    
    return {
        period: periodData?.key || 'AFTERNOON',
        weather: weather || null,
        location: getChatState()?.ledger?.currentLocation || 'outdoor',
        mode,
        time
    };
}

/**
 * Format period key for display
 * @param {string} periodKey - Period key like 'MORNING', 'LATE_NIGHT'
 * @returns {string} Display string like 'Morning', 'Late Night'
 */
export function formatPeriodForDisplay(periodKey) {
    if (!periodKey) return 'Unknown';
    
    return periodKey
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export { WMO_WEATHER_CODES, TIME_PERIODS, WEATHER_TRANSITIONS };
