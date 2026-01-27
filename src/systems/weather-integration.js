/**
 * Weather Integration Module - The Tribunal
 * Bridges weather-effects.js with SillyTavern events
 * 
 * v2.0.0 - Clean rewrite with chat scanning + event emitter
 */

import { getContext } from '../../../../extensions.js';
import { eventSource, event_types } from '../../../../../script.js';

// Import everything from weather-effects
import {
    initWeatherEffects,
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
    getAvailableEffects,
    onWeatherChange,
    subscribe
} from './weather-effects.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let config = {
    effectsEnabled: true,
    autoDetect: true,
    intensity: 'light',
    syncWithTimeOfDay: true,
    skipEventListeners: false
};

let initialized = false;

// ═══════════════════════════════════════════════════════════════
// CHAT SCANNING
// ═══════════════════════════════════════════════════════════════

/**
 * Scan recent chat messages for weather hints
 * Called on CHAT_CHANGED to set initial weather state
 */
function scanChatForWeather(messageCount = 5) {
    if (!config.autoDetect) return;
    
    try {
        const ctx = getContext();
        if (!ctx?.chat?.length) return;
        
        const recentMessages = ctx.chat.slice(-messageCount);
        
        // Scan oldest to newest so most recent wins
        for (const msg of recentMessages) {
            if (msg?.mes) {
                const result = processMessageForWeather(msg.mes);
                if (result) {
                    console.log('[WeatherIntegration] Auto-detected from chat:', result);
                }
            }
        }
    } catch (e) {
        console.warn('[WeatherIntegration] Error scanning chat:', e.message);
    }
}

/**
 * Process a single new message for weather keywords
 */
function processNewMessage(message) {
    if (!config.autoDetect || !message) return;
    
    const result = processMessageForWeather(message);
    if (result) {
        console.log('[WeatherIntegration] Detected from new message:', result);
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function onChatChanged() {
    console.log('[WeatherIntegration] Chat changed - scanning');
    setTimeout(() => scanChatForWeather(5), 500);
}

function onMessageReceived(data) {
    try {
        const ctx = getContext();
        if (!ctx?.chat?.length) return;
        
        const lastMessage = ctx.chat[ctx.chat.length - 1];
        if (lastMessage?.mes) {
            processNewMessage(lastMessage.mes);
        }
    } catch (e) {
        console.warn('[WeatherIntegration] Error on message:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the weather system
 */
export function initWeatherSystem(options = {}) {
    if (initialized) {
        console.log('[WeatherIntegration] Already initialized');
        return true;
    }
    
    config = { ...config, ...options };
    console.log('[WeatherIntegration] Initializing with config:', config);
    
    // Initialize CSS and effects
    initWeatherEffects();
    
    // Apply settings
    setEnabled(config.effectsEnabled);
    setIntensity(config.intensity);
    
    // Register event listeners
    if (!config.skipEventListeners) {
        if (event_types.CHAT_CHANGED) {
            eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
        }
        if (event_types.MESSAGE_RECEIVED) {
            eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        }
    }
    
    // Initial scan
    setTimeout(() => {
        const ctx = getContext();
        if (ctx?.chat?.length > 0) {
            scanChatForWeather(5);
        }
    }, 1000);
    
    initialized = true;
    console.log('[WeatherIntegration] Initialization complete');
    return true;
}

/**
 * Set weather state (wrapper for index.js)
 */
export function setWeatherState(weatherOrState) {
    return setWeather(weatherOrState);
}

/**
 * Set effects enabled
 */
export function setEffectsEnabled(enabled) {
    config.effectsEnabled = enabled;
    return setEnabled(enabled);
}

/**
 * Set effects intensity
 */
export function setEffectsIntensity(intensity) {
    config.intensity = intensity;
    return setIntensity(intensity);
}

/**
 * Enable/disable auto-detection
 */
export function setAutoDetect(enabled) {
    config.autoDetect = enabled;
}

/**
 * Manual chat scan trigger
 */
export function rescanChat() {
    scanChatForWeather(10);
}

/**
 * Get debug info
 */
export function debugWeather() {
    const state = getState();
    const available = getAvailableEffects();
    return {
        config,
        state,
        available,
        initialized
    };
}

/**
 * Process a message (for external callers)
 */
export function processMessage(message) {
    return processMessageForWeather(message);
}

/**
 * Sync weather with watch time
 */
export function syncWithWeatherTime(watchState) {
    if (!watchState?.time) return;
    
    const hour = parseInt(watchState.time.split(':')[0], 10);
    if (isNaN(hour)) return;
    
    const state = getState();
    // Only set period if no weather/special active
    if (!state.weather && !state.special) {
        if (hour >= 6 && hour < 18) {
            setPeriod('day');
        } else if (hour >= 22 || hour < 5) {
            setPeriod('quiet-night');
        } else {
            setPeriod('city-night');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS - Everything index.js and radio might need
// ═══════════════════════════════════════════════════════════════

export {
    // Core functions
    setWeather,
    setPeriod,
    setSpecialEffect,
    setIntensity,
    setEnabled,
    getState,
    
    // Special effects
    triggerPale,
    exitPale,
    isInPale,
    triggerHorror,
    exitHorror,
    
    // Utilities
    testEffect,
    getAvailableEffects,
    
    // Event system for Radio
    onWeatherChange,
    subscribe
};

export default {
    initWeatherSystem,
    setWeatherState,
    setEffectsEnabled,
    setEffectsIntensity,
    setAutoDetect,
    rescanChat,
    debugWeather,
    processMessage,
    syncWithWeatherTime,
    // Direct exports
    setWeather,
    setPeriod,
    setSpecialEffect,
    triggerPale,
    exitPale,
    isInPale,
    triggerHorror,
    exitHorror,
    getState,
    testEffect,
    getAvailableEffects,
    // Event system
    onWeatherChange,
    subscribe
};
