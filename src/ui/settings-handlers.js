/**
 * The Tribunal - Settings Handlers
 * Wires the Settings tab inputs to state persistence
 * 
 * @version 5.2.0 - Added Setting Profile selector (agnosticism refactor)
 *                  Profiles control voice personalities, prompt flavor, and theme styling
 */

import { getSettings, saveSettings } from '../core/state.js';
import { getAvailableProfiles } from '../voice/api-helpers.js';
import { getAvailableProfiles as getSettingProfiles } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// ELEMENT IDS
// ═══════════════════════════════════════════════════════════════

const SETTINGS_IDS = {
    // Setting Profile (Section I)
    settingProfile: 'cfg-setting-profile',
    
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
    deathEnabled: 'cfg-death-enabled',
    autoConsume: 'cfg-auto-consume',
    
    // Auto-Extraction (Section IV.5)
    autoEquipment: 'cfg-auto-equipment',
    autoInventory: 'cfg-auto-inventory',
    extractionNotify: 'cfg-extraction-notify',
    
    // Case Detection (Section V)
    autoCases: 'cfg-auto-cases',
    casesNotify: 'cfg-cases-notify',
    
    // Contact Detection (Section VI)
    autoContacts: 'cfg-auto-contacts',
    contactsNotify: 'cfg-contacts-notify',
    
    // Thought Cabinet (Section VII)
    autoThoughts: 'cfg-auto-thoughts',
    autoGenerateThoughts: 'cfg-auto-generate-thoughts',
    themeThreshold: 'cfg-theme-threshold',
    themeDecay: 'cfg-theme-decay',
    internalizeDischarge: 'cfg-internalize-discharge',
    
    // Weather Source (Section IX)
    weatherSourceRP: 'cfg-weather-source-rp',
    weatherSourceReal: 'cfg-weather-source-real',
    weatherLocation: 'cfg-weather-location',
    weatherAutoLocation: 'cfg-weather-auto-location',
    weatherUnitsF: 'cfg-weather-units-f',
    weatherUnitsC: 'cfg-weather-units-c',
    weatherRefresh: 'cfg-weather-refresh',
    
    // Debug (Section X)
    debugCompartment: 'cfg-debug-compartment',
    debugCrack: 'cfg-debug-crack',
    applyCrack: 'cfg-apply-crack',
    debugStatus: 'debug-status-display',
    // Death testing
    testDeathType: 'cfg-test-death-type',
    testDeath: 'cfg-test-death',
    testSkillCheck: 'cfg-test-skill-check',
    testCloseCall: 'cfg-test-close-call',
    
    // Weather dropdowns (new)
    testWeather: 'cfg-test-weather',
    applyWeather: 'cfg-apply-weather',
    testAmbient: 'cfg-test-ambient',
    applyAmbient: 'cfg-apply-ambient',
    testPeriod: 'cfg-test-period',
    applyPeriod: 'cfg-apply-period',
    testSpecial: 'cfg-test-special',
    applySpecial: 'cfg-apply-special',
    
    // Actions
    lockPositions: 'cfg-lock-positions',
    saveButton: 'cfg-save-settings',
    resetPositions: 'cfg-reset-positions',

    // World State (Section III.6)
    parseWorldTags: 'cfg-parse-world-tags',
    worldSyncWeather: 'cfg-world-sync-weather',
    worldSyncTime: 'cfg-world-sync-time',
    worldNotify: 'cfg-world-notify',
    useAIExtractor: 'cfg-use-ai-extractor',
    injectWorldTag: 'cfg-inject-world-tag',
    copyWorldInject: 'cfg-copy-world-inject',
    
    // Compartment Settings (secret section)
    compartmentSection: 'compartment-settings-section',
    compartmentStatus: 'compartment-unlock-status',
    compartmentDates: 'compartment-unlock-dates',
    resetCompartment: 'cfg-reset-compartment',
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
    
    // Populate setting profile dropdown (DE, Noir, Generic, etc.)
    populateSettingProfiles();
    
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
    
    // Bind weather test buttons (legacy button grid)
    bindWeatherTestButtons();
    
    // Bind weather dropdown handlers (new)
    bindWeatherDropdowns();
    
    // Bind weather source handlers
    bindWeatherSourceHandlers();
    
    // Bind debug handlers (Section X)
    bindDebugHandlers();

    // Bind world state handlers
    bindWorldStateHandlers();
    
    // Bind compartment settings handlers (secret section)
    bindCompartmentSettingsHandlers();
    
    console.log('[Tribunal] Settings handlers initialized');
}

/**
 * Populate the setting profile dropdown with available profiles
 * These control the flavor/personality of the entire extension
 */
export function populateSettingProfiles() {
    const select = document.getElementById(SETTINGS_IDS.settingProfile);
    if (!select) {
        console.warn('[Tribunal] Setting profile select not found');
        return;
    }
    
    // Clear existing options
    select.innerHTML = '';
    
    // Get available profiles from setting-profiles.js
    try {
        const profiles = getSettingProfiles();
        
        if (profiles && profiles.length > 0) {
            profiles.forEach(profile => {
                const option = document.createElement('option');
                option.value = profile.id;
                option.textContent = profile.name;
                if (profile.description) {
                    option.title = profile.description;
                }
                select.appendChild(option);
            });
            
            console.log(`[Tribunal] Populated ${profiles.length} setting profiles`);
        } else {
            // Fallback if no profiles found
            const fallback = document.createElement('option');
            fallback.value = 'disco_elysium';
            fallback.textContent = 'Disco Elysium (Default)';
            select.appendChild(fallback);
            console.warn('[Tribunal] No setting profiles found, using fallback');
        }
    } catch (err) {
        console.error('[Tribunal] Error loading setting profiles:', err);
        // Add fallback option
        const fallback = document.createElement('option');
        fallback.value = 'disco_elysium';
        fallback.textContent = 'Disco Elysium (Default)';
        select.appendChild(fallback);
    }
    
    // Set current value from settings
    const settings = getSettings();
    if (settings?.activeProfile) {
        select.value = settings.activeProfile;
    }
    
    // Bind immediate change handler — switching profiles takes effect live
    select.addEventListener('change', () => {
        const settings = getSettings();
        settings.activeProfile = select.value;
        saveSettings();
        
        // Update description note below dropdown
        const descEl = document.getElementById('cfg-setting-profile-desc');
        if (descEl) {
            const selectedOption = select.options[select.selectedIndex];
            descEl.textContent = selectedOption?.title || 'Controls voice personalities, prompt flavor, and world defaults';
        }
        
        if (typeof toastr !== 'undefined') {
            const selectedOption = select.options[select.selectedIndex];
            toastr.success(
                `Profile: ${selectedOption?.textContent || select.value}`,
                'Setting Changed',
                { timeOut: 2000 }
            );
        }
        
        console.log('[Tribunal] Active profile changed to:', select.value);
    });
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
    
    // Setting Profile
    setSelectValue(SETTINGS_IDS.settingProfile, settings.activeProfile || 'disco_elysium');
    
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
    setCheckbox(SETTINGS_IDS.deathEnabled, settings.vitals?.deathEnabled ?? true);
    setCheckbox(SETTINGS_IDS.autoConsume, settings.vitals?.autoConsume ?? true);
    
    // Auto-Extraction
    setCheckbox(SETTINGS_IDS.autoEquipment, settings.extraction?.autoEquipment ?? false);
    setCheckbox(SETTINGS_IDS.autoInventory, settings.extraction?.autoInventory ?? false);
    setCheckbox(SETTINGS_IDS.extractionNotify, settings.extraction?.showNotifications ?? true);
    
    // Case Detection
    setCheckbox(SETTINGS_IDS.autoCases, settings.cases?.autoDetect ?? false);
    setCheckbox(SETTINGS_IDS.casesNotify, settings.cases?.showNotifications ?? true);
    
    // Contact Detection
    setCheckbox(SETTINGS_IDS.autoContacts, settings.contacts?.autoDetect ?? false);
    setCheckbox(SETTINGS_IDS.contactsNotify, settings.contacts?.showNotifications ?? true);

    // World State
    setCheckbox(SETTINGS_IDS.parseWorldTags, settings.worldState?.parseWorldTags ?? true);
    setCheckbox(SETTINGS_IDS.worldSyncWeather, settings.worldState?.syncWeather ?? true);
    setCheckbox(SETTINGS_IDS.worldSyncTime, settings.worldState?.syncTime ?? true);
    setCheckbox(SETTINGS_IDS.worldNotify, settings.worldState?.showNotifications ?? true);
    setCheckbox(SETTINGS_IDS.useAIExtractor, settings.worldState?.useAIExtractor ?? false);
    setCheckbox(SETTINGS_IDS.injectWorldTag, settings.worldState?.injectWorldTag ?? false);
    
    // Update inject preview visibility
    updateWorldTagInjectPreview();
    
    // Thought Cabinet
    setCheckbox(SETTINGS_IDS.autoThoughts, settings.thoughts?.autoSuggest ?? false);
    setCheckbox(SETTINGS_IDS.autoGenerateThoughts, settings.thoughts?.autoGenerate ?? false);
    setInputValue(SETTINGS_IDS.themeThreshold, settings.thoughts?.spikeThreshold ?? 8);
    setCheckbox(SETTINGS_IDS.themeDecay, settings.thoughts?.enableDecay ?? true);
    setInputValue(SETTINGS_IDS.internalizeDischarge, settings.thoughts?.internalizeDischarge ?? 5);
    
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
    if (!settings.worldState) settings.worldState = {};
    if (!settings.vitals) settings.vitals = {};
    if (!settings.cases) settings.cases = {};
    if (!settings.contacts) settings.contacts = {};
    if (!settings.thoughts) settings.thoughts = {};
    if (!settings.ui) settings.ui = {};
    if (!settings.weather) settings.weather = {};
    
    // FIX: Mutate the existing object instead of creating a new one
    // Setting Profile
    settings.activeProfile = getInputValue(SETTINGS_IDS.settingProfile, 'disco_elysium');
    
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
    settings.vitals.deathEnabled = getCheckbox(SETTINGS_IDS.deathEnabled, true);
    settings.vitals.autoConsume = getCheckbox(SETTINGS_IDS.autoConsume, true);
    
    // Auto-Extraction
    if (!settings.extraction) settings.extraction = {};
    settings.extraction.autoEquipment = getCheckbox(SETTINGS_IDS.autoEquipment, false);
    settings.extraction.autoInventory = getCheckbox(SETTINGS_IDS.autoInventory, false);
    settings.extraction.showNotifications = getCheckbox(SETTINGS_IDS.extractionNotify, true);
    
    // Case Detection
    settings.cases.autoDetect = getCheckbox(SETTINGS_IDS.autoCases, false);
    settings.cases.showNotifications = getCheckbox(SETTINGS_IDS.casesNotify, true);
    
    // Contact Detection
    settings.contacts.autoDetect = getCheckbox(SETTINGS_IDS.autoContacts, false);
    settings.contacts.showNotifications = getCheckbox(SETTINGS_IDS.contactsNotify, true);

    // World State
    settings.worldState.parseWorldTags = getCheckbox(SETTINGS_IDS.parseWorldTags, true);
    settings.worldState.syncWeather = getCheckbox(SETTINGS_IDS.worldSyncWeather, true);
    settings.worldState.syncTime = getCheckbox(SETTINGS_IDS.worldSyncTime, true);
    settings.worldState.showNotifications = getCheckbox(SETTINGS_IDS.worldNotify, true);
    settings.worldState.useAIExtractor = getCheckbox(SETTINGS_IDS.useAIExtractor, false);
    settings.worldState.injectWorldTag = getCheckbox(SETTINGS_IDS.injectWorldTag, false);
    
    // Thought Cabinet
    settings.thoughts.autoSuggest = getCheckbox(SETTINGS_IDS.autoThoughts, false);
    settings.thoughts.autoGenerate = getCheckbox(SETTINGS_IDS.autoGenerateThoughts, false);
    settings.thoughts.spikeThreshold = getInputNumber(SETTINGS_IDS.themeThreshold, 8);
    settings.thoughts.enableDecay = getCheckbox(SETTINGS_IDS.themeDecay, true);
    settings.thoughts.internalizeDischarge = getInputNumber(SETTINGS_IDS.internalizeDischarge, 5);
    
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
// WORLD STATE HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Update world tag injection preview visibility
 */
function updateWorldTagInjectPreview() {
    const checkbox = document.getElementById('cfg-inject-world-tag');
    const preview = document.getElementById('world-tag-inject-preview');
    
    if (checkbox && preview) {
        preview.style.display = checkbox.checked ? 'block' : 'none';
    }
}

/**
 * Bind World State handlers
 * Call this from initSettingsTab()
 */
function bindWorldStateHandlers() {
    // Inject toggle - show/hide preview
    const injectCheckbox = document.getElementById('cfg-inject-world-tag');
    if (injectCheckbox) {
        injectCheckbox.addEventListener('change', () => {
            updateWorldTagInjectPreview();
            // Auto-save this setting
            const settings = getSettings();
            if (!settings.worldState) settings.worldState = {};
            settings.worldState.injectWorldTag = injectCheckbox.checked;
            saveSettings();
        });
    }
    
    // Copy button
    const copyBtn = document.getElementById('cfg-copy-world-inject');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const injectionText = `[Always start responses with: <!--- WORLD{"weather":"...","temp":##,"location":"Place, Area","time":"H:MM PM"} --->]`;
            
            try {
                await navigator.clipboard.writeText(injectionText);
                copyBtn.textContent = '✓ Copied!';
                if (typeof toastr !== 'undefined') {
                    toastr.success('Copied to clipboard', 'World Tag');
                }
            } catch (e) {
                // Fallback for mobile/non-https
                const codeEl = document.getElementById('world-tag-inject-code');
                if (codeEl) {
                    // Select the text
                    const range = document.createRange();
                    range.selectNodeContents(codeEl);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                copyBtn.textContent = '📋 Select & Copy';
            }
            
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy to Clipboard';
            }, 2000);
        });
    }
    
    // Auto-save on change for all world state checkboxes
    const worldStateIds = [
        'cfg-parse-world-tags',
        'cfg-world-sync-weather', 
        'cfg-world-sync-time',
        'cfg-world-notify',
        'cfg-use-ai-extractor'
    ];
    
    worldStateIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                const settings = getSettings();
                if (!settings.worldState) settings.worldState = {};
                
                settings.worldState.parseWorldTags = document.getElementById('cfg-parse-world-tags')?.checked ?? true;
                settings.worldState.syncWeather = document.getElementById('cfg-world-sync-weather')?.checked ?? true;
                settings.worldState.syncTime = document.getElementById('cfg-world-sync-time')?.checked ?? true;
                settings.worldState.showNotifications = document.getElementById('cfg-world-notify')?.checked ?? true;
                settings.worldState.useAIExtractor = document.getElementById('cfg-use-ai-extractor')?.checked ?? false;
                
                saveSettings();
                console.log('[Tribunal] World state settings saved');
            });
        }
    });
    
    console.log('[Tribunal] World state handlers bound');
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
 * Get current contact detection settings
 * @returns {object} Contact detection settings
 */
export function getContactSettings() {
    const settings = getSettings();
    return {
        autoDetect: settings?.contacts?.autoDetect ?? false,
        showNotifications: settings?.contacts?.showNotifications ?? true
    };
}

/**
 * Get current thought cabinet settings
 * @returns {object} Thought cabinet settings
 */
export function getThoughtSettings() {
    const settings = getSettings();
    return {
        autoSuggest: settings?.thoughts?.autoSuggest ?? false,
        autoGenerate: settings?.thoughts?.autoGenerate ?? false,
        spikeThreshold: settings?.thoughts?.spikeThreshold ?? 8,
        enableDecay: settings?.thoughts?.enableDecay ?? true,
        internalizeDischarge: settings?.thoughts?.internalizeDischarge ?? 5
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

// ═══════════════════════════════════════════════════════════════
// DEBUG HANDLERS (Section X)
// ═══════════════════════════════════════════════════════════════

/**
 * Bind debug section handlers
 */
function bindDebugHandlers() {
    const compartmentBtn = document.getElementById(SETTINGS_IDS.debugCompartment);
    const crackSelect = document.getElementById(SETTINGS_IDS.debugCrack);
    const applyCrackBtn = document.getElementById(SETTINGS_IDS.applyCrack);
    const statusDisplay = document.getElementById(SETTINGS_IDS.debugStatus);
    
    // Toggle compartment button
    if (compartmentBtn) {
        compartmentBtn.addEventListener('click', () => {
            const secretTab = document.querySelector('.ledger-subtab-secret');
            const isRevealed = secretTab?.classList.contains('revealed');
            
            if (isRevealed) {
                // Hide it
                hideCompartment();
                if (statusDisplay) statusDisplay.innerHTML = '<em>Compartment: Hidden</em>';
                if (typeof toastr !== 'undefined') {
                    toastr.info('Compartment hidden', 'Debug');
                }
            } else {
                // Reveal it
                setCrackStage(3);
                setTimeout(() => {
                    revealCompartment();
                    if (statusDisplay) statusDisplay.innerHTML = '<em>Compartment: Revealed ✓</em>';
                    if (typeof toastr !== 'undefined') {
                        toastr.success('Compartment revealed!', 'Debug');
                    }
                }, 300);
            }
        });
        console.log('[Tribunal] Debug: Compartment toggle bound');
    }
    
    // Crack stage apply button
    if (applyCrackBtn && crackSelect) {
        applyCrackBtn.addEventListener('click', () => {
            const stage = parseInt(crackSelect.value) || 0;
            setCrackStage(stage);
            
            if (typeof toastr !== 'undefined') {
                toastr.info(`Crack stage: ${stage}`, 'Debug');
            }
        });
        console.log('[Tribunal] Debug: Crack stage bound');
    }
    
    // ═══════════════════════════════════════════════════════════
    // DEATH SYSTEM TEST HANDLERS
    // ═══════════════════════════════════════════════════════════
    
    const deathTypeSelect = document.getElementById(SETTINGS_IDS.testDeathType);
    const testDeathBtn = document.getElementById(SETTINGS_IDS.testDeath);
    const testSkillCheckBtn = document.getElementById(SETTINGS_IDS.testSkillCheck);
    const testCloseCallBtn = document.getElementById(SETTINGS_IDS.testCloseCall);
    
    // Test Death Screen button
    if (testDeathBtn && deathTypeSelect) {
        testDeathBtn.addEventListener('click', () => {
            const deathType = deathTypeSelect.value || 'health';
            
            if (window.TribunalDeath?.test) {
                console.log(`[Debug] Triggering ${deathType} death screen`);
                window.TribunalDeath.test(deathType);
            } else {
                // Try dynamic import
                import('../systems/death-handler.js').then(module => {
                    if (module.testDeathScreen) {
                        module.testDeathScreen(deathType);
                    } else {
                        if (typeof toastr !== 'undefined') {
                            toastr.error('Death handler not loaded', 'Debug');
                        }
                    }
                }).catch(e => {
                    console.error('[Debug] Could not load death handler:', e);
                    if (typeof toastr !== 'undefined') {
                        toastr.error('Death handler not available', 'Debug');
                    }
                });
            }
        });
        console.log('[Tribunal] Debug: Death test button bound');
    }
    
    // Test Skill Check button
    if (testSkillCheckBtn) {
        testSkillCheckBtn.addEventListener('click', () => {
            const skills = ['endurance', 'volition', 'composure', 'inland_empire', 'shivers'];
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            
            if (window.TribunalDeath?.testSkill) {
                window.TribunalDeath.testSkill(randomSkill, 10);
            } else {
                // Simulate a skill check visually
                const die1 = Math.floor(Math.random() * 6) + 1;
                const die2 = Math.floor(Math.random() * 6) + 1;
                const total = die1 + die2 + 3; // Base skill of 3
                const success = total >= 10;
                
                if (typeof toastr !== 'undefined') {
                    const msg = `[${die1}+${die2}] + 3 = ${total} vs 10`;
                    if (success) {
                        toastr.success(msg, `${randomSkill.toUpperCase()} [Success]`);
                    } else {
                        toastr.error(msg, `${randomSkill.toUpperCase()} [Failure]`);
                    }
                }
            }
        });
        console.log('[Tribunal] Debug: Skill check test bound');
    }
    
    // Test Close Call button
    if (testCloseCallBtn) {
        testCloseCallBtn.addEventListener('click', () => {
            if (window.TribunalDeath?.testCloseCall) {
                window.TribunalDeath.testCloseCall();
            } else {
                // Simulate close call toast
                if (typeof toastr !== 'undefined') {
                    toastr.warning(
                        '[6+5] + 3 + 0 = 14 vs 10',
                        'ENDURANCE [Success] - Health saved!',
                        { timeOut: 5000 }
                    );
                }
            }
        });
        console.log('[Tribunal] Debug: Close call test bound');
    }
    
    console.log('[Tribunal] Debug handlers initialized');
}

/**
 * Reveal the secret compartment
 */
function revealCompartment() {
    const secretTab = document.querySelector('.ledger-subtab-secret');
    const subtabsContainer = document.querySelector('.ledger-subtabs');
    
    if (secretTab) {
        secretTab.classList.add('revealed');
        subtabsContainer?.classList.add('compartment-revealed');
        
        // Initialize envelope click handler
        initEnvelopeHandler();
        
        console.log('[Tribunal] Compartment revealed');
    }
}

/**
 * Initialize envelope click handler
 */
function initEnvelopeHandler() {
    const envelope = document.getElementById('dora-envelope');
    if (envelope && !envelope.dataset.handlerBound) {
        envelope.addEventListener('click', (e) => {
            // Don't toggle if clicking the draw button
            if (e.target.closest('.draw-fortune-btn')) return;
            envelope.classList.toggle('envelope-open');
        });
        envelope.dataset.handlerBound = 'true';
        console.log('[Tribunal] Envelope handler initialized');
    }
}

/**
 * Hide the secret compartment
 */
function hideCompartment() {
    const secretTab = document.querySelector('.ledger-subtab-secret');
    const subtabsContainer = document.querySelector('.ledger-subtabs');
    const crackLine = document.querySelector('.ledger-crack-line');
    
    secretTab?.classList.remove('revealed', 'cracking');
    subtabsContainer?.classList.remove('compartment-revealed');
    crackLine?.classList.remove('stage-1', 'stage-2', 'stage-3');
    
    // Switch back to cases tab if on compartment
    const casesTab = document.querySelector('[data-ledger-tab="cases"]');
    casesTab?.click();
    
    console.log('[Tribunal] Compartment hidden');
}

/**
 * Set crack stage (0-3)
 */
function setCrackStage(stage) {
    const crackLine = document.querySelector('.ledger-crack-line');
    if (!crackLine) {
        console.warn('[Tribunal] .ledger-crack-line not found');
        return;
    }
    
    // Remove all stage classes
    crackLine.classList.remove('stage-1', 'stage-2', 'stage-3');
    
    // Add appropriate stage
    if (stage >= 1) crackLine.classList.add('stage-1');
    if (stage >= 2) crackLine.classList.add('stage-2');
    if (stage >= 3) {
        crackLine.classList.add('stage-3');
        // At stage 3, show the tab as "cracking"
        document.querySelector('.ledger-subtab-secret')?.classList.add('cracking');
    }
    
    console.log(`[Tribunal] Crack stage: ${stage}`);
}

// ═══════════════════════════════════════════════════════════════
// COMPARTMENT SETTINGS HANDLERS (Secret Section)
// ═══════════════════════════════════════════════════════════════

/**
 * Bind compartment settings section handlers
 * This section only appears when the compartment has been unlocked
 */
function bindCompartmentSettingsHandlers() {
    const section = document.getElementById(SETTINGS_IDS.compartmentSection);
    const resetBtn = document.getElementById(SETTINGS_IDS.resetCompartment);
    const statusEl = document.getElementById(SETTINGS_IDS.compartmentStatus);
    const datesEl = document.getElementById(SETTINGS_IDS.compartmentDates);
    
    // Check if compartment is unlocked and show/hide section
    updateCompartmentSettingsVisibility();
    
    // Bind reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Confirm before resetting
            const confirmed = confirm(
                'Re-seal the compartment?\n\n' +
                'You\'ll need to find it again through late-night sessions (10pm - 3am).\n\n' +
                'This cannot be undone.'
            );
            
            if (confirmed) {
                // Reset compartment state using the global progression
                if (window.TribunalCompartment?.reset) {
                    window.TribunalCompartment.reset();
                } else {
                    // Fallback: reset directly via settings
                    const settings = getSettings();
                    if (settings?.progression?.secretPanel) {
                        settings.progression.secretPanel = {
                            unlocked: false,
                            crackCount: 0,
                            crackDates: [],
                            lastCrackDate: null
                        };
                        saveSettings();
                    }
                    
                    // Update UI
                    hideCompartment();
                }
                
                // Hide this settings section
                if (section) {
                    section.style.display = 'none';
                }
                
                if (typeof toastr !== 'undefined') {
                    toastr.info('The compartment has been re-sealed...', 'The Tribunal', { timeOut: 4000 });
                }
                
                console.log('[Tribunal] Compartment reset by user');
            }
        });
        console.log('[Tribunal] Compartment reset button bound');
    }
    
    console.log('[Tribunal] Compartment settings handlers initialized');
}

/**
 * Update compartment settings section visibility based on unlock state
 * Shows the section only when the compartment is unlocked
 */
export function updateCompartmentSettingsVisibility() {
    const section = document.getElementById(SETTINGS_IDS.compartmentSection);
    const statusEl = document.getElementById(SETTINGS_IDS.compartmentStatus);
    const datesEl = document.getElementById(SETTINGS_IDS.compartmentDates);
    
    if (!section) return;
    
    // Check unlock state from global settings
    const settings = getSettings();
    const secretPanel = settings?.progression?.secretPanel;
    const isUnlocked = secretPanel?.unlocked || false;
    
    if (isUnlocked) {
        section.style.display = 'block';
        
        // Update status display
        if (statusEl) {
            statusEl.innerHTML = '<i class="fa-solid fa-check" style="color: #4a7c4a;"></i> Fully Unlocked';
        }
        
        // Show unlock dates
        if (datesEl && secretPanel?.crackDates?.length > 0) {
            const dateStr = secretPanel.crackDates.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }).join(' → ');
            datesEl.textContent = `Found: ${dateStr}`;
        }
        
        console.log('[Tribunal] Compartment settings section shown (unlocked)');
    } else {
        section.style.display = 'none';
        console.log('[Tribunal] Compartment settings section hidden (locked)');
    }
}

// ═══════════════════════════════════════════════════════════════
// WEATHER EFFECTS HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind weather test button handlers (legacy button grid)
 * Uses window.tribunal* functions set up by index.js
 */
function bindWeatherTestButtons() {
    // Retry if elements not ready yet
    const testButtons = document.querySelectorAll('.weather-test-btn');
    if (testButtons.length === 0) {
        // No buttons found - might be using new dropdown UI, skip silently
        return;
    }
    
    // Bind each test button
    testButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const weather = btn.dataset.weather;
            const special = btn.dataset.special;
            const period = btn.dataset.period;
            
            // Use window functions (set up by index.js)
            if (weather && window.tribunalSetWeather) {
                window.tribunalSetWeather({ weather });
                updateWeatherStatus(`Weather: ${weather}`);
            } else if (special === 'horror' && window.tribunalTriggerHorror) {
                window.tribunalTriggerHorror(15000); // 15 seconds
                updateWeatherStatus('Horror mode (15s)');
            } else if (special === 'pale' && window.tribunalTriggerPale) {
                window.tribunalTriggerPale();
                updateWeatherStatus('The Pale active');
            } else if (period && window.tribunalSetWeather) {
                window.tribunalSetWeather({ period });
                updateWeatherStatus(`Period: ${period}`);
            } else {
                updateWeatherStatus('Weather system not loaded!');
            }
        });
    });
    
    // Bind clear button
    const clearBtn = document.getElementById('cfg-weather-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (window.tribunalSetWeather) {
                window.tribunalSetWeather({ weather: null, period: null, special: null });
                if (window.tribunalExitPale) window.tribunalExitPale();
                updateWeatherStatus('Effects cleared');
            }
        });
    }
    
    // Bind settings checkboxes
    const enabledCheckbox = document.getElementById('cfg-weather-enabled');
    if (enabledCheckbox) {
        enabledCheckbox.addEventListener('change', () => {
            const settings = getSettings();
            if (!settings.weather) settings.weather = {};
            settings.weather.enabled = enabledCheckbox.checked;
            saveSettings();
            
            if (window.tribunalSetEffectsEnabled) {
                window.tribunalSetEffectsEnabled(enabledCheckbox.checked);
            }
        });
    }
    
    const intensitySelect = document.getElementById('cfg-weather-intensity');
    if (intensitySelect) {
        intensitySelect.addEventListener('change', () => {
            const settings = getSettings();
            if (!settings.weather) settings.weather = {};
            settings.weather.intensity = intensitySelect.value;
            saveSettings();
            
            if (window.tribunalSetEffectsIntensity) {
                window.tribunalSetEffectsIntensity(intensitySelect.value);
            }
        });
    }
    
    // Check and update status
    setTimeout(() => {
        const loaded = !!(window.tribunalSetWeather && window.tribunalTriggerHorror);
        if (loaded) {
            updateWeatherStatus('Ready ✓');
        } else if (window.tribunalWeatherError) {
            updateWeatherStatus(`Error: ${window.tribunalWeatherError}`);
        } else {
            updateWeatherStatus('Not loaded ✗');
        }
    }, 1000);
    
    console.log('[Tribunal] Weather test buttons bound');
}

/**
 * Bind weather dropdown handlers (new dropdown UI)
 */
function bindWeatherDropdowns() {
    // Weather dropdown
    const weatherSelect = document.getElementById(SETTINGS_IDS.testWeather);
    const applyWeatherBtn = document.getElementById(SETTINGS_IDS.applyWeather);
    
    if (applyWeatherBtn && weatherSelect) {
        applyWeatherBtn.addEventListener('click', () => {
            const value = weatherSelect.value;
            if (value && window.tribunalSetWeather) {
                window.tribunalSetWeather({ weather: value });
                updateWeatherStatus(`Weather: ${value}`);
            } else if (value) {
                updateWeatherStatus(`Weather: ${value} (system not ready)`);
            }
        });
    }
    
    // Ambient dropdown
    const ambientSelect = document.getElementById(SETTINGS_IDS.testAmbient);
    const applyAmbientBtn = document.getElementById(SETTINGS_IDS.applyAmbient);
    
    if (applyAmbientBtn && ambientSelect) {
        applyAmbientBtn.addEventListener('click', () => {
            const value = ambientSelect.value;
            if (value && window.tribunalSetWeather) {
                window.tribunalSetWeather({ weather: value });
                updateWeatherStatus(`Ambient: ${value}`);
            } else if (value) {
                updateWeatherStatus(`Ambient: ${value} (system not ready)`);
            }
        });
    }
    
    // Time/Period dropdown
    const periodSelect = document.getElementById(SETTINGS_IDS.testPeriod);
    const applyPeriodBtn = document.getElementById(SETTINGS_IDS.applyPeriod);
    
    if (applyPeriodBtn && periodSelect) {
        applyPeriodBtn.addEventListener('click', () => {
            const value = periodSelect.value;
            if (value && window.tribunalSetWeather) {
                window.tribunalSetWeather({ period: value });
                updateWeatherStatus(`Period: ${value}`);
            } else if (value) {
                updateWeatherStatus(`Period: ${value} (system not ready)`);
            }
        });
    }
    
    // Special dropdown
    const specialSelect = document.getElementById(SETTINGS_IDS.testSpecial);
    const applySpecialBtn = document.getElementById(SETTINGS_IDS.applySpecial);
    
    if (applySpecialBtn && specialSelect) {
        applySpecialBtn.addEventListener('click', () => {
            const value = specialSelect.value;
            if (value === 'horror' && window.tribunalTriggerHorror) {
                window.tribunalTriggerHorror(15000);
                updateWeatherStatus('Horror mode (15s)');
            } else if (value === 'pale' && window.tribunalTriggerPale) {
                window.tribunalTriggerPale();
                updateWeatherStatus('The Pale active');
            } else if (value) {
                updateWeatherStatus(`Special: ${value} (system not ready)`);
            }
        });
    }
    
    console.log('[Tribunal] Weather dropdown handlers bound');
}

/**
 * Update weather status display
 */
function updateWeatherStatus(text) {
    const el = document.getElementById('weather-status-display');
    if (el) {
        el.innerHTML = `<em>Status: ${text}</em>`;
    }
}

// ═══════════════════════════════════════════════════════════════
// WEATHER SOURCE HANDLERS (Section IX)
// ═══════════════════════════════════════════════════════════════

/**
 * Bind weather source section handlers
 */
function bindWeatherSourceHandlers() {
    const sourceRP = document.getElementById(SETTINGS_IDS.weatherSourceRP);
    const sourceReal = document.getElementById(SETTINGS_IDS.weatherSourceReal);
    const realOptions = document.getElementById('weather-real-options');
    const locationInput = document.getElementById(SETTINGS_IDS.weatherLocation);
    const autoLocationBtn = document.getElementById(SETTINGS_IDS.weatherAutoLocation);
    const refreshBtn = document.getElementById(SETTINGS_IDS.weatherRefresh);
    const unitsF = document.getElementById(SETTINGS_IDS.weatherUnitsF);
    const unitsC = document.getElementById(SETTINGS_IDS.weatherUnitsC);
    const autoCheckbox = document.getElementById('cfg-weather-auto');
    
    if (!sourceRP || !sourceReal) {
        // Retry if elements not ready
        setTimeout(bindWeatherSourceHandlers, 500);
        return;
    }
    
    // Toggle real options visibility
    function updateRealOptionsVisibility() {
        if (realOptions) {
            realOptions.style.display = sourceReal.checked ? 'block' : 'none';
        }
        
        // Update watch mode if available
        if (window.tribunalSetWatchMode) {
            window.tribunalSetWatchMode(sourceReal.checked ? 'real' : 'rp');
        }
        
        // Fetch weather if switching to real mode
        if (sourceReal.checked) {
            fetchAndDisplayWeather();
        }
    }
    
    sourceRP.addEventListener('change', () => {
        updateRealOptionsVisibility();
        saveWeatherSourceSettings();
    });
    
    sourceReal.addEventListener('change', () => {
        updateRealOptionsVisibility();
        saveWeatherSourceSettings();
    });
    
    // Auto-detect location
    if (autoLocationBtn) {
        autoLocationBtn.addEventListener('click', async () => {
            autoLocationBtn.disabled = true;
            autoLocationBtn.textContent = '⏳';
            
            try {
                const response = await fetch('http://ip-api.com/json/?fields=city,regionName,country');
                const data = await response.json();
                
                if (data.city) {
                    const location = data.regionName 
                        ? `${data.city}, ${data.regionName}`
                        : `${data.city}, ${data.country}`;
                    
                    if (locationInput) {
                        locationInput.value = location;
                    }
                    
                    saveWeatherSourceSettings();
                    fetchAndDisplayWeather();
                    
                    if (typeof toastr !== 'undefined') {
                        toastr.success(`Location: ${location}`, 'Weather', { timeOut: 2000 });
                    }
                }
            } catch (e) {
                console.error('[Weather] Location detection failed:', e);
                if (typeof toastr !== 'undefined') {
                    toastr.error('Could not detect location', 'Weather');
                }
            }
            
            autoLocationBtn.disabled = false;
            autoLocationBtn.textContent = '🎯';
        });
    }
    
    // Refresh weather button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchAndDisplayWeather(true);
        });
    }
    
    // Units toggle
    if (unitsF) {
        unitsF.addEventListener('change', () => {
            saveWeatherSourceSettings();
            fetchAndDisplayWeather();
        });
    }
    if (unitsC) {
        unitsC.addEventListener('change', () => {
            saveWeatherSourceSettings();
            fetchAndDisplayWeather();
        });
    }
    
    // Auto-detect checkbox
    if (autoCheckbox) {
        autoCheckbox.addEventListener('change', () => {
            const settings = getSettings();
            if (!settings.weather) settings.weather = {};
            settings.weather.autoDetect = autoCheckbox.checked;
            saveSettings();
        });
    }
    
    // Location input (save on blur)
    if (locationInput) {
        locationInput.addEventListener('blur', () => {
            saveWeatherSourceSettings();
        });
        locationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveWeatherSourceSettings();
                fetchAndDisplayWeather(true);
            }
        });
    }
    
    // Initialize from saved settings
    loadWeatherSourceSettings();
    updateRealOptionsVisibility();
    
    console.log('[Tribunal] Weather source handlers bound');
}

/**
 * Save weather source settings
 */
function saveWeatherSourceSettings() {
    const settings = getSettings();
    if (!settings) return;
    
    if (!settings.weather) settings.weather = {};
    
    const sourceReal = document.getElementById(SETTINGS_IDS.weatherSourceReal);
    const locationInput = document.getElementById(SETTINGS_IDS.weatherLocation);
    const unitsC = document.getElementById(SETTINGS_IDS.weatherUnitsC);
    
    settings.weather.source = sourceReal?.checked ? 'real' : 'rp';
    settings.weather.location = locationInput?.value || '';
    settings.weather.units = unitsC?.checked ? 'celsius' : 'fahrenheit';
    
    saveSettings();
}

/**
 * Load weather source settings into UI
 */
function loadWeatherSourceSettings() {
    const settings = getSettings();
    if (!settings?.weather) return;
    
    const sourceRP = document.getElementById(SETTINGS_IDS.weatherSourceRP);
    const sourceReal = document.getElementById(SETTINGS_IDS.weatherSourceReal);
    const locationInput = document.getElementById(SETTINGS_IDS.weatherLocation);
    const unitsF = document.getElementById(SETTINGS_IDS.weatherUnitsF);
    const unitsC = document.getElementById(SETTINGS_IDS.weatherUnitsC);
    const autoCheckbox = document.getElementById('cfg-weather-auto');
    
    if (settings.weather.source === 'real') {
        if (sourceReal) sourceReal.checked = true;
    } else {
        if (sourceRP) sourceRP.checked = true;
    }
    
    if (locationInput && settings.weather.location) {
        locationInput.value = settings.weather.location;
    }
    
    if (settings.weather.units === 'celsius') {
        if (unitsC) unitsC.checked = true;
    } else {
        if (unitsF) unitsF.checked = true;
    }
    
    if (autoCheckbox) {
        autoCheckbox.checked = settings.weather.autoDetect ?? true;
    }
}

/**
 * Fetch and display current weather from Open-Meteo API
 */
async function fetchAndDisplayWeather(forceRefresh = false) {
    const infoEl = document.getElementById('weather-current-info');
    const locationEl = document.getElementById('weather-current-location');
    
    if (!infoEl) return;
    
    infoEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    
    try {
        const settings = getSettings();
        const useCelsius = settings?.weather?.units === 'celsius';
        const locationString = settings?.weather?.location || '';
        
        // Get coordinates
        let lat, lon, locationName;
        
        if (locationString) {
            // Geocode the location
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationString)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();
            
            if (geoData.results?.length > 0) {
                lat = geoData.results[0].latitude;
                lon = geoData.results[0].longitude;
                locationName = `${geoData.results[0].name}, ${geoData.results[0].admin1 || geoData.results[0].country}`;
            } else {
                throw new Error('Location not found');
            }
        } else {
            // Use IP geolocation
            const ipResponse = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName');
            const ipData = await ipResponse.json();
            lat = ipData.lat;
            lon = ipData.lon;
            locationName = `${ipData.city}, ${ipData.regionName}`;
        }
        
        // Fetch weather
        const unit = useCelsius ? 'celsius' : 'fahrenheit';
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${unit}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        const temp = Math.round(weatherData.current.temperature_2m);
        const code = weatherData.current.weather_code;
        const condition = getWeatherConditionText(code);
        const icon = getWeatherIconClass(code);
        
        // Display
        infoEl.innerHTML = `<i class="fa-solid ${icon}"></i> ${condition}, ${temp}°${useCelsius ? 'C' : 'F'}`;
        if (locationEl) {
            locationEl.textContent = locationName;
        }
        
        // Update watch if in real mode
        if (window.tribunalRefreshWeather) {
            window.tribunalRefreshWeather();
        }
        
    } catch (e) {
        console.error('[Weather] Fetch failed:', e);
        infoEl.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${e.message || 'Failed to fetch'}`;
    }
}

/**
 * Get weather condition text from WMO code
 */
function getWeatherConditionText(code) {
    const conditions = {
        0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime Fog',
        51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
        80: 'Rain Showers', 81: 'Showers', 82: 'Heavy Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm + Hail', 99: 'Severe Storm'
    };
    return conditions[code] || 'Unknown';
}

/**
 * Get Font Awesome icon class from WMO code
 */
function getWeatherIconClass(code) {
    if (code === 0 || code === 1) return 'fa-sun';
    if (code === 2 || code === 3) return 'fa-cloud';
    if (code === 45 || code === 48) return 'fa-smog';
    if (code >= 51 && code <= 67) return 'fa-cloud-rain';
    if (code >= 71 && code <= 77) return 'fa-snowflake';
    if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy';
    if (code >= 95) return 'fa-cloud-bolt';
    return 'fa-cloud';
}

/**
 * Get current weather settings (combined effects + source)
 * @returns {object} Weather settings
 */
export function getWeatherSettings() {
    const settings = getSettings();
    return {
        enabled: settings?.weather?.enabled ?? true,
        autoDetect: settings?.weather?.autoDetect ?? true,
        intensity: settings?.weather?.intensity || 'light',
        source: settings?.weather?.source || 'rp',
        location: settings?.weather?.location || '',
        units: settings?.weather?.units || 'fahrenheit'
    };
}
