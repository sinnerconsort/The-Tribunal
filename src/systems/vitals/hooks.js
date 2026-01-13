/**
 * The Tribunal - Vitals Event Hooks
 * Integrates vitals detection with SillyTavern message events
 * Phase 2 Implementation
 */

import { detectVitalsChanges, formatDetectionResult, mightContainVitalsContent } from './detector.js';

// ═══════════════════════════════════════════════════════════════
// MODULE STATE
// ═══════════════════════════════════════════════════════════════

// Track last processed message to avoid duplicates
let lastProcessedMessageId = null;

// Callback references (set during initialization)
let onVitalsChange = null;
let getSettings = null;
let getContext = null;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the vitals hooks system
 * @param {Object} config - Configuration object
 * @param {Function} config.modifyHealth - Function to modify health
 * @param {Function} config.modifyMorale - Function to modify morale
 * @param {Function} config.getSettings - Function to get current settings
 * @param {Function} config.getContext - Function to get ST context
 * @param {Function} config.showToast - Function to show notifications
 * @param {Function} config.refreshVitals - Function to refresh UI
 */
export function initVitalsHooks(config) {
    const {
        modifyHealth,
        modifyMorale,
        getSettings: settingsGetter,
        getContext: contextGetter,
        showToast,
        refreshVitals
    } = config;
    
    getSettings = settingsGetter;
    getContext = contextGetter;
    
    // Create the change handler
    onVitalsChange = (result, context) => {
        const settings = getSettings();
        
        // Apply health change
        if (result.healthDelta !== 0) {
            modifyHealth(result.healthDelta, context);
            console.log(`[Vitals] Health ${result.healthDelta > 0 ? '+' : ''}${result.healthDelta}: ${result.healthReasons.join(', ')}`);
        }
        
        // Apply morale change
        if (result.moraleDelta !== 0) {
            modifyMorale(result.moraleDelta, context);
            console.log(`[Vitals] Morale ${result.moraleDelta > 0 ? '+' : ''}${result.moraleDelta}: ${result.moraleReasons.join(', ')}`);
        }
        
        // Refresh UI
        if (refreshVitals) {
            refreshVitals();
        }
        
        // Show notification if enabled
        if (settings.vitalsShowNotifications !== false && showToast) {
            const message = formatDetectionResult(result);
            const type = (result.healthDelta < 0 || result.moraleDelta < 0) ? 'warning' : 'success';
            showToast(message, type, 3000);
        }
        
        // Dispatch custom event for other extensions
        document.dispatchEvent(new CustomEvent('ie:vitals-changed', {
            detail: {
                healthDelta: result.healthDelta,
                moraleDelta: result.moraleDelta,
                severity: result.severity,
                reasons: {
                    health: result.healthReasons,
                    morale: result.moraleReasons
                }
            }
        }));
    };
    
    console.log('[Vitals] Hooks initialized');
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message for vitals detection
 * Call this from the MESSAGE_RECEIVED event handler
 * @param {string} messageText - The AI response text
 * @param {string} messageId - Unique message identifier (optional, for dedup)
 * @returns {Object|null} Detection result or null if skipped
 */
export function processMessageForVitals(messageText, messageId = null) {
    // Get settings
    const settings = getSettings?.() || {};
    
    // Check if auto-detection is enabled
    if (!settings.autoDetectVitals) {
        return null;
    }
    
    // Check if extension is enabled
    if (!settings.enabled) {
        return null;
    }
    
    // Deduplicate by message ID if provided
    if (messageId && messageId === lastProcessedMessageId) {
        console.log('[Vitals] Skipping duplicate message');
        return null;
    }
    lastProcessedMessageId = messageId;
    
    // Quick filter - skip if unlikely to contain vitals content
    if (!mightContainVitalsContent(messageText)) {
        return null;
    }
    
    // Run detection
    const result = detectVitalsChanges(messageText, {
        protagonistName: settings.characterName || '',
        sensitivity: settings.vitalsSensitivity || 'medium',
        requireProtagonist: true
    });
    
    // If changes detected, apply them
    if (result.detected && onVitalsChange) {
        const context = getContext?.();
        onVitalsChange(result, context);
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// MANUAL ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Manually analyze text without applying changes
 * Useful for testing or preview
 * @param {string} text - Text to analyze
 * @param {Object} options - Override options
 * @returns {Object} Detection result
 */
export function analyzeTextForVitals(text, options = {}) {
    const settings = getSettings?.() || {};
    
    return detectVitalsChanges(text, {
        protagonistName: options.protagonistName || settings.characterName || '',
        sensitivity: options.sensitivity || settings.vitalsSensitivity || 'medium',
        requireProtagonist: options.requireProtagonist ?? true
    });
}

/**
 * Manually trigger vitals change (bypass detection)
 * @param {number} healthDelta - Health change
 * @param {number} moraleDelta - Morale change
 * @param {string} reason - Reason for change
 */
export function manualVitalsChange(healthDelta, moraleDelta, reason = 'manual') {
    if (!onVitalsChange) {
        console.warn('[Vitals] Hooks not initialized');
        return;
    }
    
    const result = {
        healthDelta,
        moraleDelta,
        healthReasons: healthDelta !== 0 ? [reason] : [],
        moraleReasons: moraleDelta !== 0 ? [reason] : [],
        severity: 'moderate',
        detected: healthDelta !== 0 || moraleDelta !== 0
    };
    
    if (result.detected) {
        const context = getContext?.();
        onVitalsChange(result, context);
    }
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS DEFAULTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get default settings for vitals detection
 * Merge these into your extension's DEFAULT_SETTINGS
 */
export const VITALS_DETECTION_DEFAULTS = {
    autoDetectVitals: false,          // Master toggle for auto-detection
    vitalsSensitivity: 'medium',      // 'low', 'medium', 'high'
    vitalsShowNotifications: true,    // Show toast on change
    vitalsRequireProtagonist: true    // Only detect when protagonist mentioned
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR GLOBAL API
// ═══════════════════════════════════════════════════════════════

/**
 * Get functions to expose on window.InlandEmpire
 */
export function getVitalsAPI() {
    return {
        analyzeVitals: analyzeTextForVitals,
        manualVitalsChange,
        formatVitalsResult: formatDetectionResult
    };
}
