/**
 * The Tribunal - Weather System Integration
 * Connects weather-time.js (data) to weather-effects.js (visuals)
 * 
 * Handles:
 * - Auto-detection from AI messages
 * - Pale status integration
 * - Time-based period detection
 * - ST event hooks
 * 
 * @version 1.0.0
 */

import {
    initWeatherEffects,
    setWeatherState,
    setSpecialEffect,
    processMessageForWeather,
    triggerPale,
    exitPale,
    isInPale,
    triggerHorror,
    getWeatherEffectsState,
    setEffectsEnabled,
    setEffectsIntensity
} from './weather-effects.js';

import {
    getWeatherTimeState,
    formatPeriodForDisplay
} from './weather-time.js';

// ═══════════════════════════════════════════════════════════════
// STATE & CONFIG
// ═══════════════════════════════════════════════════════════════

let autoDetectEnabled = true;
let lastProcessedMessageId = null;

// Settings defaults
const DEFAULT_SETTINGS = {
    effectsEnabled: true,
    autoDetect: true,
    intensity: 'light',
    horrorDuration: 30000,  // 30 seconds auto-clear for horror
    syncWithTimeOfDay: true
};

// ═══════════════════════════════════════════════════════════════
// PERIOD MAPPING
// ═══════════════════════════════════════════════════════════════

/**
 * Map weather-time period to effects period
 * @param {string} period - Period from weather-time.js
 * @param {Object} options - Additional context
 * @returns {string} Effects period
 */
function mapPeriodToEffects(period, options = {}) {
    const { location = 'outdoor' } = options;
    
    // Indoor overrides period effects
    if (location === 'indoor') {
        return null;  // Indoor uses special effect instead
    }
    
    switch (period) {
        case 'MORNING':
        case 'AFTERNOON':
        case 'LATE_AFTERNOON':
            return 'day';
            
        case 'EVENING':
        case 'NIGHT':
        case 'LATE_NIGHT':
            // Default to city night, can be overridden by keywords
            return 'city-night';
            
        default:
            return 'day';
    }
}

/**
 * Map weather-time weather to effects weather
 * @param {Object} weatherData - Data from weather-time.js
 * @returns {string|null} Effects weather type
 */
function mapWeatherToEffects(weatherData) {
    if (!weatherData) return null;
    
    const { conditions, description } = weatherData;
    
    // Check conditions text
    const lower = (conditions || description || '').toLowerCase();
    
    if (lower.includes('rain') || lower.includes('storm') || lower.includes('drizzle') || lower.includes('shower')) {
        return 'rain';
    }
    if (lower.includes('snow') || lower.includes('blizzard') || lower.includes('flurr')) {
        return 'snow';
    }
    if (lower.includes('fog') || lower.includes('mist') || lower.includes('haz')) {
        return 'fog';
    }
    if (lower.includes('wind') || lower.includes('gust') || lower.includes('breez')) {
        return 'wind';
    }
    if (lower.includes('clear') || lower.includes('sunny') || lower.includes('cloud')) {
        return 'clear';
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// SYNC WITH WEATHER-TIME DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Sync visual effects with weather-time.js data
 * Called when weather-time state updates
 */
export function syncWithWeatherTime() {
    const timeState = getWeatherTimeState();
    if (!timeState) return;
    
    const { period, weather, location } = timeState;
    
    // Don't sync if in Pale (Pale overrides everything)
    if (isInPale()) return;
    
    const effectsPeriod = mapPeriodToEffects(period, { location });
    const effectsWeather = mapWeatherToEffects(weather);
    
    // Check if indoor
    const special = (location === 'indoor') ? 'indoor' : null;
    
    setWeatherState({
        weather: effectsWeather,
        period: effectsPeriod,
        special: special
    });
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Process AI message for weather/horror/pale triggers
 * @param {string} messageText - The message content
 * @param {string} messageId - Unique message ID (to prevent double-processing)
 */
export function processMessage(messageText, messageId = null) {
    // Prevent double-processing
    if (messageId && messageId === lastProcessedMessageId) return;
    if (messageId) lastProcessedMessageId = messageId;
    
    if (!autoDetectEnabled) return;
    
    // Detect conditions from text
    const detected = processMessageForWeather(messageText, false);  // Don't apply yet
    
    // Handle special cases first
    if (detected.special === 'pale') {
        triggerPale();
        return;  // Pale overrides everything
    }
    
    if (detected.special === 'horror') {
        triggerHorror(DEFAULT_SETTINGS.horrorDuration);
        // Horror can layer on top, so continue processing
        delete detected.special;
    }
    
    // Apply remaining detected conditions
    if (Object.keys(detected).length > 0) {
        setWeatherState(detected);
    }
}

// ═══════════════════════════════════════════════════════════════
// PALE STATUS INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Called when Pale status is applied (from state.js)
 */
export function onPaleStatusApplied() {
    triggerPale();
}

/**
 * Called when Pale status is removed
 */
export function onPaleStatusRemoved() {
    exitPale();
    // Resync with current time/weather
    syncWithWeatherTime();
}

/**
 * Check a status object for Pale-like conditions
 * @param {Object} status - Status object from game state
 * @returns {boolean} Whether this indicates Pale state
 */
export function isPaleStatus(status) {
    if (!status || !status.name) return false;
    
    const paleTriggers = [
        'pale', 'unconscious', 'passed out', 'fainted', 'blackout',
        'dissociating', 'dissociation', 'catatonic', 'coma'
    ];
    
    const lower = status.name.toLowerCase();
    return paleTriggers.some(trigger => lower.includes(trigger));
}

// ═══════════════════════════════════════════════════════════════
// ST EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Hook into SillyTavern events
 * Call this in index.js init
 */
export function setupWeatherEventListeners() {
    try {
        const { eventSource, event_types } = SillyTavern.getContext();
        
        // Process incoming AI messages
        eventSource.on(event_types.MESSAGE_RECEIVED, (messageIndex) => {
            try {
                const context = SillyTavern.getContext();
                const message = context.chat?.[messageIndex];
                
                if (message && !message.is_user) {
                    processMessage(message.mes, `msg-${messageIndex}`);
                }
            } catch (e) {
                console.warn('[WeatherIntegration] Error processing message:', e);
            }
        });
        
        // Clear effects on chat change (optional - can remove if you want persistence)
        eventSource.on(event_types.CHAT_CHANGED, () => {
            // Resync with weather-time
            syncWithWeatherTime();
        });
        
        console.log('[WeatherIntegration] Event listeners registered');
        
    } catch (e) {
        console.warn('[WeatherIntegration] Could not register ST events:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Apply settings from extension settings
 * @param {Object} settings - Settings object
 */
export function applyWeatherSettings(settings = {}) {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    
    setEffectsEnabled(merged.effectsEnabled);
    setEffectsIntensity(merged.intensity);
    autoDetectEnabled = merged.autoDetect;
    
    if (merged.syncWithTimeOfDay) {
        syncWithWeatherTime();
    }
}

/**
 * Get current settings for saving
 */
export function getWeatherSettings() {
    const state = getWeatherEffectsState();
    return {
        effectsEnabled: state.enabled,
        autoDetect: autoDetectEnabled,
        intensity: state.intensity
    };
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the complete weather system
 * @param {Object} settings - Optional initial settings
 * @param {boolean} settings.skipEventListeners - Skip ST event registration (if handled externally)
 */
export function initWeatherSystem(settings = {}) {
    // Init visual effects
    initWeatherEffects();
    
    // Apply settings
    applyWeatherSettings(settings);
    
    // Setup ST event hooks (unless handled externally)
    if (!settings.skipEventListeners) {
        setupWeatherEventListeners();
    }
    
    // Initial sync with weather-time
    syncWithWeatherTime();
    
    console.log('[WeatherIntegration] Weather system initialized');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR MANUAL CONTROL
// ═══════════════════════════════════════════════════════════════

export {
    // Re-export from weather-effects for convenience
    setWeatherState,
    setSpecialEffect,
    triggerPale,
    exitPale,
    triggerHorror,
    isInPale,
    getWeatherEffectsState,
    setEffectsEnabled,
    setEffectsIntensity
};

// Debug helpers
export function debugWeather() {
    console.log('Weather Effects State:', getWeatherEffectsState());
    console.log('Weather Time State:', getWeatherTimeState());
    console.log('Auto-detect enabled:', autoDetectEnabled);
}
