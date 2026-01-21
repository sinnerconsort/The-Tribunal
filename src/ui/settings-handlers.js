/**
 * The Tribunal - Settings Handlers
 * Wires the Settings tab inputs to state persistence
 * v0.4.0 - Added Thought Cabinet settings
 */

import { getSettings, saveSettings } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// ELEMENT IDS
// ═══════════════════════════════════════════════════════════════

const SETTINGS_IDS = {
    // Connection (Section II)
    connectionProfile: 'cfg-connection-profile',
    temperature: 'cfg-temperature',
    maxTokens: 'cfg-max-tokens',
    testConnection: 'cfg-test-connection',
    
    // Voice Behavior (Section III)
    minVoices: 'cfg-min-voices',
    maxVoices: 'cfg-max-voices',
    triggerDelay: 'cfg-trigger-delay',
    showDiceRolls: 'cfg-show-dice',
    showFailedChecks: 'cfg-show-failed',
    autoTrigger: 'cfg-auto-trigger',
    
    // Investigation (Section III.5)
    showInvestigationFab: 'cfg-show-fab',
    
    // Vitals Detection (Section IV)
    autoVitals: 'cfg-auto-vitals',
    vitalsSensitivity: 'cfg-vitals-sensitivity',
    vitalsNotify: 'cfg-vitals-notify',
    
    // Thought Cabinet (Section V)
    trackThemes: 'cfg-track-themes',
    allowThoughts: 'cfg-allow-thoughts',
    researchSpeed: 'cfg-research-speed',
    maxInternalized: 'cfg-max-internalized',
    
    // Actions
    saveButton: 'cfg-save-settings',
    resetPositions: 'cfg-reset-positions'
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize settings tab handlers - call after DOM is ready
 */
export function initSettingsTab() {
    // Load current settings into UI
    refreshSettingsFromState();
    
    // Bind save button
    bindSaveButton();
    
    // Bind reset positions button
    bindResetPositions();
    
    // Bind test connection button
    bindTestConnection();
    
    // Bind individual change handlers for immediate feedback
    bindInputHandlers();
    
    console.log('[Tribunal] Settings handlers initialized');
}

/**
 * Refresh all settings UI from current state
 */
export function refreshSettingsFromState() {
    const settings = getSettings();
    if (!settings) return;
    
    // Connection settings
    setSelectValue(SETTINGS_IDS.connectionProfile, settings.connectionProfile || 'current');
    setInputValue(SETTINGS_IDS.temperature, settings.temperature ?? 0.8);
    setInputValue(SETTINGS_IDS.maxTokens, settings.maxTokens ?? 600);
    
    // Voice Behavior
    setInputValue(SETTINGS_IDS.minVoices, settings.voices?.minVoices ?? 3);
    setInputValue(SETTINGS_IDS.maxVoices, settings.voices?.maxVoicesPerTurn ?? 7);
    setInputValue(SETTINGS_IDS.triggerDelay, settings.voices?.triggerDelay ?? 1000);
    setCheckbox(SETTINGS_IDS.showDiceRolls, settings.showDiceRolls ?? true);
    setCheckbox(SETTINGS_IDS.showFailedChecks, settings.showFailedChecks ?? true);
    setCheckbox(SETTINGS_IDS.autoTrigger, settings.voices?.autoGenerate ?? false);
    
    // Investigation FAB
    setCheckbox(SETTINGS_IDS.showInvestigationFab, settings.investigation?.showFab ?? true);
    
    // Vitals Detection
    setCheckbox(SETTINGS_IDS.autoVitals, settings.vitals?.autoDetect ?? true);
    setSelectValue(SETTINGS_IDS.vitalsSensitivity, settings.vitals?.sensitivity || 'medium');
    setCheckbox(SETTINGS_IDS.vitalsNotify, settings.vitals?.showNotifications ?? true);
    
    // Thought Cabinet
    setCheckbox(SETTINGS_IDS.trackThemes, settings.thoughts?.trackThemes ?? true);
    setCheckbox(SETTINGS_IDS.allowThoughts, settings.thoughts?.allowCustomThoughts ?? true);
    setSelectValue(SETTINGS_IDS.researchSpeed, String(settings.thoughts?.researchRate ?? 1));
    setInputValue(SETTINGS_IDS.maxInternalized, settings.thoughts?.maxInternalized ?? 5);
    
    console.log('[Tribunal] Settings UI refreshed from state');
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setCheckbox(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
}

function getInputValue(id, defaultVal = '') {
    const el = document.getElementById(id);
    return el ? el.value : defaultVal;
}

function getInputNumber(id, defaultVal = 0) {
    const el = document.getElementById(id);
    return el ? (parseInt(el.value, 10) || defaultVal) : defaultVal;
}

function getInputFloat(id, defaultVal = 0) {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || defaultVal) : defaultVal;
}

function getCheckbox(id, defaultVal = false) {
    const el = document.getElementById(id);
    return el ? el.checked : defaultVal;
}

// ═══════════════════════════════════════════════════════════════
// SAVE HANDLER
// ═══════════════════════════════════════════════════════════════

function bindSaveButton() {
    const btn = document.getElementById(SETTINGS_IDS.saveButton);
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        saveAllSettings();
        
        // Show feedback
        if (typeof toastr !== 'undefined') {
            toastr.success('Settings saved', 'The Tribunal', { timeOut: 2000 });
        }
    });
}

/**
 * Gather all settings from UI and save to state
 */
export function saveAllSettings() {
    // Get current settings to merge with
    const currentSettings = getSettings() || {};
    
    // Build updated settings object
    const updatedSettings = {
        ...currentSettings,
        
        // Connection
        connectionProfile: getInputValue(SETTINGS_IDS.connectionProfile, 'current'),
        temperature: getInputFloat(SETTINGS_IDS.temperature, 0.8),
        maxTokens: getInputNumber(SETTINGS_IDS.maxTokens, 600),
        
        // Voice Behavior
        voices: {
            ...currentSettings.voices,
            minVoices: getInputNumber(SETTINGS_IDS.minVoices, 3),
            maxVoicesPerTurn: getInputNumber(SETTINGS_IDS.maxVoices, 7),
            triggerDelay: getInputNumber(SETTINGS_IDS.triggerDelay, 1000),
            autoGenerate: getCheckbox(SETTINGS_IDS.autoTrigger, false)
        },
        showDiceRolls: getCheckbox(SETTINGS_IDS.showDiceRolls, true),
        showFailedChecks: getCheckbox(SETTINGS_IDS.showFailedChecks, true),
        
        // Investigation
        investigation: {
            ...currentSettings.investigation,
            showFab: getCheckbox(SETTINGS_IDS.showInvestigationFab, true)
        },
        
        // Vitals Detection
        vitals: {
            ...currentSettings.vitals,
            autoDetect: getCheckbox(SETTINGS_IDS.autoVitals, true),
            sensitivity: getInputValue(SETTINGS_IDS.vitalsSensitivity, 'medium'),
            showNotifications: getCheckbox(SETTINGS_IDS.vitalsNotify, true)
        },
        
        // Thought Cabinet
        thoughts: {
            ...currentSettings.thoughts,
            trackThemes: getCheckbox(SETTINGS_IDS.trackThemes, true),
            allowCustomThoughts: getCheckbox(SETTINGS_IDS.allowThoughts, true),
            researchRate: getInputFloat(SETTINGS_IDS.researchSpeed, 1),
            maxInternalized: getInputNumber(SETTINGS_IDS.maxInternalized, 5)
        }
    };
    
    // Save using the correct function
    saveSettings(updatedSettings);
    
    // Handle Investigation FAB visibility
    updateInvestigationFabVisibility(updatedSettings.investigation.showFab);
    
    console.log('[Tribunal] Settings saved:', updatedSettings);
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION FAB TOGGLE
// ═══════════════════════════════════════════════════════════════

/**
 * Show or hide the Investigation FAB based on setting
 * @param {boolean} show - Whether to show the FAB
 */
function updateInvestigationFabVisibility(show) {
    const fab = document.getElementById('tribunal-investigation-fab');
    if (fab) {
        fab.style.display = show ? '' : 'none';
        console.log(`[Tribunal] Investigation FAB ${show ? 'shown' : 'hidden'}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// RESET POSITIONS
// ═══════════════════════════════════════════════════════════════

function bindResetPositions() {
    const btn = document.getElementById(SETTINGS_IDS.resetPositions);
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        // Reset FAB positions to defaults
        const investigationFab = document.getElementById('tribunal-investigation-fab');
        if (investigationFab) {
            investigationFab.style.right = '20px';
            investigationFab.style.bottom = '80px';
            investigationFab.style.left = '';
            investigationFab.style.top = '';
        }
        
        // Reset panel position if needed
        const panel = document.getElementById('ie-psyche-panel');
        if (panel) {
            panel.style.right = '10px';
            panel.style.top = '50px';
            panel.style.left = '';
            panel.style.bottom = '';
        }
        
        // Clear saved positions from localStorage
        localStorage.removeItem('tribunal-fab-position');
        localStorage.removeItem('tribunal-panel-position');
        
        if (typeof toastr !== 'undefined') {
            toastr.info('Icon positions reset', 'The Tribunal', { timeOut: 2000 });
        }
        
        console.log('[Tribunal] Icon positions reset to defaults');
    });
}

// ═══════════════════════════════════════════════════════════════
// TEST CONNECTION
// ═══════════════════════════════════════════════════════════════

function bindTestConnection() {
    const btn = document.getElementById(SETTINGS_IDS.testConnection);
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ Testing...';
        
        try {
            // Import API helper dynamically to avoid circular deps
            const { testConnection } = await import('../voice/api-helpers.js');
            const result = await testConnection();
            
            if (result.success) {
                btn.textContent = '✓ Connected!';
                if (typeof toastr !== 'undefined') {
                    toastr.success(`Connected to ${result.model || 'API'}`, 'Connection Test');
                }
            } else {
                btn.textContent = '✗ Failed';
                if (typeof toastr !== 'undefined') {
                    toastr.error(result.error || 'Connection failed', 'Connection Test');
                }
            }
        } catch (error) {
            btn.textContent = '✗ Error';
            console.error('[Tribunal] Connection test error:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error(error.message, 'Connection Test');
            }
        }
        
        // Reset button after delay
        setTimeout(() => {
            btn.textContent = '⚡ Test Connection';
            btn.disabled = false;
        }, 3000);
    });
}

// ═══════════════════════════════════════════════════════════════
// IMMEDIATE CHANGE HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind change handlers for immediate feedback on certain settings
 */
function bindInputHandlers() {
    // Investigation FAB toggle - immediate effect
    const fabToggle = document.getElementById(SETTINGS_IDS.showInvestigationFab);
    if (fabToggle) {
        fabToggle.addEventListener('change', () => {
            updateInvestigationFabVisibility(fabToggle.checked);
        });
    }
    
    // Auto-trigger toggle - could trigger immediate behavior change
    const autoTrigger = document.getElementById(SETTINGS_IDS.autoTrigger);
    if (autoTrigger) {
        autoTrigger.addEventListener('change', () => {
            console.log(`[Tribunal] Auto-trigger ${autoTrigger.checked ? 'enabled' : 'disabled'}`);
        });
    }
    
    // Theme tracking toggle - immediate effect
    const trackThemes = document.getElementById(SETTINGS_IDS.trackThemes);
    if (trackThemes) {
        trackThemes.addEventListener('change', () => {
            console.log(`[Tribunal] Theme tracking ${trackThemes.checked ? 'enabled' : 'disabled'}`);
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API
// ═══════════════════════════════════════════════════════════════

/**
 * Get current vitals detection settings
 * @returns {object} Vitals settings
 */
export function getVitalsSettings() {
    const settings = getSettings();
    return {
        autoDetect: settings?.vitals?.autoDetect ?? true,
        sensitivity: settings?.vitals?.sensitivity || 'medium',
        showNotifications: settings?.vitals?.showNotifications ?? true
    };
}

/**
 * Check if investigation FAB should be visible
 * @returns {boolean}
 */
export function isInvestigationFabEnabled() {
    const settings = getSettings();
    return settings?.investigation?.showFab ?? true;
}

/**
 * Get current thought cabinet settings
 * @returns {object} Thought settings
 */
export function getThoughtSettings() {
    const settings = getSettings();
    return {
        trackThemes: settings?.thoughts?.trackThemes ?? true,
        allowCustomThoughts: settings?.thoughts?.allowCustomThoughts ?? true,
        researchRate: settings?.thoughts?.researchRate ?? 1,
        maxInternalized: settings?.thoughts?.maxInternalized ?? 5
    };
}
