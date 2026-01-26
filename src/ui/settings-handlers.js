/**
 * The Tribunal - Settings Handlers
 * Wires the Settings tab inputs to state persistence
 * 
 * @version 4.4.0 - FIXED: Settings actually save now (was creating new object instead of mutating)
 */

import { getSettings, saveSettings } from '../core/state.js';
import { getAvailableProfiles } from '../voice/api-helpers.js';

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
    
    // Case Detection (Section V)
    autoCases: 'cfg-auto-cases',
    casesNotify: 'cfg-cases-notify',
    
    // Actions
    lockPositions: 'cfg-lock-positions',
    saveButton: 'cfg-save-settings',
    resetPositions: 'cfg-reset-positions'
};

// Track if handlers are bound to prevent duplicates
let handlersInitialized = false;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize settings tab handlers - call after DOM is ready
 */
export function initSettingsTab() {
    // Populate connection profiles dropdown
    populateConnectionProfiles();
    
    // Load current settings into UI
    refreshSettingsFromState();
    
    // Apply initial states that affect elements outside the settings panel
    applyInitialStates();
    
    // Bind save button
    bindSaveButton();
    
    // Bind reset positions button
    bindResetPositions();
    
    // Bind test connection button
    bindTestConnection();
    
    // Bind individual change handlers for immediate feedback
    // Use retry logic in case elements aren't ready yet
    bindInputHandlersWithRetry();
    
    console.log('[Tribunal] Settings handlers initialized');
}

/**
 * Apply initial states from saved settings
 * This handles things like FAB visibility that need to be set on load
 */
function applyInitialStates() {
    const settings = getSettings();
    if (!settings) return;
    
    // Apply Investigation FAB visibility
    const showFab = settings?.investigation?.showFab ?? true;
    updateInvestigationFabVisibility(showFab);
    
    // Apply position lock state
    const lockPositions = settings?.ui?.lockPositions ?? false;
    updatePositionLockState(lockPositions);
    
    console.log('[Tribunal] Applied initial states - FAB:', showFab, 'Lock:', lockPositions);
}

/**
 * Populate the connection profile dropdown with available ST profiles
 * Exported so it can be called when panel is shown
 */
export function populateConnectionProfiles() {
    const select = document.getElementById(SETTINGS_IDS.connectionProfile);
    if (!select) {
        console.warn('[Tribunal] Connection profile select not found');
        return;
    }
    
    // Clear existing options except the first two defaults
    select.innerHTML = `
        <option value="current">Current Chat Connection</option>
        <option value="default">SillyTavern Default</option>
    `;
    
    // Get available profiles from ST Connection Manager
    try {
        const profiles = getAvailableProfiles();
        
        if (profiles && profiles.length > 0) {
            // Add separator
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '── Connection Profiles ──';
            select.appendChild(separator);
            
            // Add each profile
            profiles.forEach(profile => {
                const option = document.createElement('option');
                option.value = profile.id || profile.name;
                option.textContent = profile.name;
                select.appendChild(option);
            });
            
            console.log(`[Tribunal] Populated ${profiles.length} connection profiles`);
        } else {
            console.log('[Tribunal] No connection profiles found in ST');
        }
    } catch (err) {
        console.error('[Tribunal] Error loading connection profiles:', err);
    }
}

/**
 * Refresh all settings UI from current state
 */
export function refreshSettingsFromState() {
    const settings = getSettings();
    if (!settings) return;
    
    // API / Connection settings
    const apiSettings = settings.api || {};
    setSelectValue(SETTINGS_IDS.connectionProfile, apiSettings.connectionProfile || 'current');
    setInputValue(SETTINGS_IDS.temperature, apiSettings.temperature ?? 0.8);
    setInputValue(SETTINGS_IDS.maxTokens, apiSettings.maxTokens ?? 600);
    
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
    
    // Case Detection
    setCheckbox(SETTINGS_IDS.autoCases, settings.cases?.autoDetect ?? false);
    setCheckbox(SETTINGS_IDS.casesNotify, settings.cases?.showNotifications ?? true);
    
    // UI settings
    setCheckbox(SETTINGS_IDS.lockPositions, settings.ui?.lockPositions ?? false);
    
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
// SAVE HANDLER - FIXED
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
 * FIXED: Now mutates the existing settings object instead of creating a new one
 */
export function saveAllSettings() {
    // Get the actual settings reference (this is the live object in extension_settings)
    const settings = getSettings();
    if (!settings) {
        console.error('[Tribunal] No settings object to save to!');
        return;
    }
    
    // FIX: Ensure nested objects exist before assigning to them
    if (!settings.api) settings.api = {};
    if (!settings.voices) settings.voices = {};
    if (!settings.investigation) settings.investigation = {};
    if (!settings.vitals) settings.vitals = {};
    if (!settings.cases) settings.cases = {};
    if (!settings.ui) settings.ui = {};
    
    // FIX: Mutate the existing object instead of creating a new one
    // Connection settings
    settings.api.connectionProfile = getInputValue(SETTINGS_IDS.connectionProfile, 'current');
    settings.api.temperature = getInputFloat(SETTINGS_IDS.temperature, 0.8);
    settings.api.maxTokens = getInputNumber(SETTINGS_IDS.maxTokens, 600);
    
    // Voice Behavior
    settings.voices.minVoices = getInputNumber(SETTINGS_IDS.minVoices, 3);
    settings.voices.maxVoicesPerTurn = getInputNumber(SETTINGS_IDS.maxVoices, 7);
    settings.voices.triggerDelay = getInputNumber(SETTINGS_IDS.triggerDelay, 1000);
    settings.voices.autoGenerate = getCheckbox(SETTINGS_IDS.autoTrigger, false);
    
    // Top-level settings
    settings.showDiceRolls = getCheckbox(SETTINGS_IDS.showDiceRolls, true);
    settings.showFailedChecks = getCheckbox(SETTINGS_IDS.showFailedChecks, true);
    
    // Investigation
    settings.investigation.showFab = getCheckbox(SETTINGS_IDS.showInvestigationFab, true);
    
    // Vitals Detection
    settings.vitals.autoDetect = getCheckbox(SETTINGS_IDS.autoVitals, true);
    settings.vitals.sensitivity = getInputValue(SETTINGS_IDS.vitalsSensitivity, 'medium');
    settings.vitals.showNotifications = getCheckbox(SETTINGS_IDS.vitalsNotify, true);
    
    // Case Detection
    settings.cases.autoDetect = getCheckbox(SETTINGS_IDS.autoCases, false);
    settings.cases.showNotifications = getCheckbox(SETTINGS_IDS.casesNotify, true);
    
    // UI settings
    settings.ui.lockPositions = getCheckbox(SETTINGS_IDS.lockPositions, false);
    
    // NOW save - this triggers the debounced save to localStorage/server
    saveSettings();
    
    // Handle Investigation FAB visibility
    updateInvestigationFabVisibility(settings.investigation.showFab);
    
    // Handle position lock state
    updatePositionLockState(settings.ui.lockPositions);
    
    console.log('[Tribunal] Settings saved:', settings);
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION FAB TOGGLE - FIXED
// ═══════════════════════════════════════════════════════════════

/**
 * Show or hide the Investigation FAB based on setting
 * @param {boolean} show - Whether to show the FAB
 */
function updateInvestigationFabVisibility(show) {
    // Try multiple possible IDs for the investigation FAB
    const possibleIds = [
        'tribunal-investigation-fab',
        'investigation-fab',
        'ie-investigation-fab'
    ];
    
    let found = false;
    for (const id of possibleIds) {
        const fab = document.getElementById(id);
        if (fab) {
            // Set data attribute so investigation.js visibility watcher respects it
            fab.dataset.settingsHidden = show ? 'false' : 'true';
            
            // Only set display if we're hiding, or if no panel/drawer is open
            if (!show) {
                fab.style.display = 'none';
            } else {
                // Check if we should actually show (respect panel/drawer state)
                const tribunalPanel = document.getElementById('inland-empire-panel');
                const mainPanelOpen = tribunalPanel?.classList.contains('ie-panel-open');
                const anyDrawerOpen = document.querySelector('.openDrawer');
                
                if (!mainPanelOpen && !anyDrawerOpen) {
                    fab.style.display = 'flex';
                }
                // If panel/drawer is open, leave display as-is; 
                // the interval watcher will show it when they close
            }
            
            found = true;
            console.log(`[Tribunal] Investigation FAB (${id}) settings: show=${show}, settingsHidden=${fab.dataset.settingsHidden}`);
            break;
        }
    }
    
    if (!found) {
        console.warn('[Tribunal] Investigation FAB not found - tried:', possibleIds);
    }
}

// ═══════════════════════════════════════════════════════════════
// POSITION LOCKING
// ═══════════════════════════════════════════════════════════════

/**
 * Update position lock state on draggable elements
 * @param {boolean} locked - Whether positions should be locked
 */
function updatePositionLockState(locked) {
    // Add/remove a data attribute and class that drag handlers can check
    const draggables = [
        document.getElementById('tribunal-investigation-fab'),
        document.getElementById('inland-empire-fab'),  // Main panel FAB
        document.getElementById('ie-psyche-panel'),
        document.getElementById('inland-empire-panel')
    ];
    
    draggables.forEach(el => {
        if (el) {
            el.dataset.positionLocked = locked ? 'true' : 'false';
            el.classList.toggle('position-locked', locked);
        }
    });
    
    console.log(`[Tribunal] Position lock ${locked ? 'enabled' : 'disabled'}`);
}

/**
 * Check if positions are currently locked
 * Call this from drag handlers to prevent movement
 * @returns {boolean}
 */
export function arePositionsLocked() {
    const settings = getSettings();
    return settings?.ui?.lockPositions ?? false;
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
            // Try to import testConnection - it might not exist yet
            const apiHelpers = await import('../voice/api-helpers.js');
            
            // Check if testConnection exists in the module
            if (typeof apiHelpers.testConnection === 'function') {
                const result = await apiHelpers.testConnection();
                
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
            } else {
                // testConnection doesn't exist - use callAPI as a fallback test
                if (typeof apiHelpers.callAPI === 'function') {
                    // Simple ping test - just see if we can call the API
                    const testResponse = await apiHelpers.callAPI(
                        'You are a connection test. Respond with exactly: OK',
                        'Test connection. Reply with just: OK'
                    );
                    
                    if (testResponse) {
                        btn.textContent = '✓ Connected!';
                        if (typeof toastr !== 'undefined') {
                            toastr.success('API responded successfully', 'Connection Test');
                        }
                    } else {
                        btn.textContent = '✗ No response';
                        if (typeof toastr !== 'undefined') {
                            toastr.error('API did not respond', 'Connection Test');
                        }
                    }
                } else {
                    throw new Error('No API test function available');
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
// IMMEDIATE CHANGE HANDLERS - FIXED WITH RETRY
// ═══════════════════════════════════════════════════════════════

/**
 * Bind change handlers with retry logic for elements that may not exist yet
 */
function bindInputHandlersWithRetry(retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = 200;
    
    const fabToggle = document.getElementById(SETTINGS_IDS.showInvestigationFab);
    const lockToggle = document.getElementById(SETTINGS_IDS.lockPositions);
    const autoTrigger = document.getElementById(SETTINGS_IDS.autoTrigger);
    
    // Check if critical elements exist
    if (!fabToggle && retryCount < maxRetries) {
        console.log(`[Tribunal] FAB toggle not found, retry ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => bindInputHandlersWithRetry(retryCount + 1), retryDelay);
        return;
    }
    
    if (handlersInitialized) {
        console.log('[Tribunal] Input handlers already initialized, skipping');
        return;
    }
    
    // Bind Investigation FAB toggle - immediate effect
    if (fabToggle) {
        // Remove any existing listeners by cloning
        const newFabToggle = fabToggle.cloneNode(true);
        fabToggle.parentNode.replaceChild(newFabToggle, fabToggle);
        
        newFabToggle.addEventListener('change', (e) => {
            const show = e.target.checked;
            console.log(`[Tribunal] FAB toggle changed: show=${show}`);
            updateInvestigationFabVisibility(show);
            
            // FIX: Mutate the actual settings object, then save
            const settings = getSettings();
            if (settings) {
                if (!settings.investigation) settings.investigation = {};
                settings.investigation.showFab = show;
                saveSettings();
            }
        });
        console.log('[Tribunal] FAB toggle handler bound');
    } else {
        console.warn('[Tribunal] FAB toggle element not found after retries');
    }
    
    // Bind Lock positions toggle - immediate effect
    if (lockToggle) {
        const newLockToggle = lockToggle.cloneNode(true);
        lockToggle.parentNode.replaceChild(newLockToggle, lockToggle);
        
        newLockToggle.addEventListener('change', (e) => {
            const locked = e.target.checked;
            updatePositionLockState(locked);
            
            // FIX: Also save this immediately
            const settings = getSettings();
            if (settings) {
                if (!settings.ui) settings.ui = {};
                settings.ui.lockPositions = locked;
                saveSettings();
            }
            
            if (typeof toastr !== 'undefined') {
                toastr.info(
                    locked ? 'Positions locked' : 'Positions unlocked',
                    'The Tribunal',
                    { timeOut: 1500 }
                );
            }
        });
        console.log('[Tribunal] Lock toggle handler bound');
    }
    
    // Bind Auto-trigger toggle
    if (autoTrigger) {
        const newAutoTrigger = autoTrigger.cloneNode(true);
        autoTrigger.parentNode.replaceChild(newAutoTrigger, autoTrigger);
        
        newAutoTrigger.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            console.log(`[Tribunal] Auto-trigger ${enabled ? 'enabled' : 'disabled'}`);
            
            // FIX: Save auto-trigger immediately too
            const settings = getSettings();
            if (settings) {
                if (!settings.voices) settings.voices = {};
                settings.voices.autoGenerate = enabled;
                saveSettings();
            }
        });
    }
    
    handlersInitialized = true;
    console.log('[Tribunal] Input handlers initialized');
}

/**
 * Reset handlers flag - call when panel is destroyed/recreated
 */
export function resetHandlersState() {
    handlersInitialized = false;
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
 * Get current case detection settings
 * @returns {object} Case detection settings
 */
export function getCaseSettings() {
    const settings = getSettings();
    return {
        autoDetect: settings?.cases?.autoDetect ?? false,
        showNotifications: settings?.cases?.showNotifications ?? true
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
