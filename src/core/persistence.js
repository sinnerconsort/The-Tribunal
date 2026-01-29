/**
 * The Tribunal - Persistence Layer
 * Handles save/load to SillyTavern's storage systems
 * 
 * Storage locations:
 * - Per-Chat: chat_metadata.tribunal
 * - Global: extension_settings.tribunal
 */

import { extension_settings, getContext } from '../../../../../extensions.js';
import { chat_metadata, saveSettingsDebounced, saveChatDebounced } from '../../../../../../script.js';
import { getDefaultChatState, getDefaultGlobalSettings } from '../data/defaults.js';

const EXT_ID = 'tribunal';

// ═══════════════════════════════════════════════════════════════
// GLOBAL SETTINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the global settings object (creates if doesn't exist)
 * @returns {object} Global settings
 */
export function getSettings() {
    if (!extension_settings[EXT_ID]) {
        extension_settings[EXT_ID] = getDefaultGlobalSettings();
    }
    return extension_settings[EXT_ID];
}

/**
 * Save global settings (debounced)
 */
export function saveSettings() {
    saveSettingsDebounced();
}

/**
 * Initialize and sanitize global settings
 * Call this on extension load
 */
export function initSettings() {
    const defaults = getDefaultGlobalSettings();
    
    if (!extension_settings[EXT_ID]) {
        extension_settings[EXT_ID] = defaults;
        console.log('[Tribunal] Created default global settings');
        return;
    }
    
    const s = extension_settings[EXT_ID];
    
    // Ensure all top-level keys exist
    for (const key of Object.keys(defaults)) {
        if (s[key] === undefined) {
            s[key] = defaults[key];
        }
    }
    
    // Ensure nested objects exist
    if (!s.api) s.api = { ...defaults.api };
    if (!s.ui) s.ui = { ...defaults.ui };
    if (!s.voices) s.voices = { ...defaults.voices };
    if (!s.thoughts) s.thoughts = { ...defaults.thoughts };
    if (!s.vitals) s.vitals = { ...defaults.vitals };
    if (!s.dice) s.dice = { ...defaults.dice };
    if (!s.progression) s.progression = { ...defaults.progression };
    
    // Ensure progression sub-objects
    if (!s.progression.secretPanel) s.progression.secretPanel = { ...defaults.progression.secretPanel };
    if (!s.progression.totalStats) s.progression.totalStats = { ...defaults.progression.totalStats };
    if (!Array.isArray(s.progression.achievements)) s.progression.achievements = [];
    if (!Array.isArray(s.progression.secretPanel.crackDates)) s.progression.secretPanel.crackDates = [];
    
    // Run migrations
    migrateSettings(s);
    
    console.log('[Tribunal] Global settings initialized');
}

/**
 * Migrate settings to newer versions
 * @param {object} settings - Settings object to migrate
 */
function migrateSettings(settings) {
    const currentVersion = settings.settingsVersion || 1;
    let changed = false;
    
    // Future migrations go here:
    // if (currentVersion < 2) {
    //     // Migrate to v2
    //     settings.settingsVersion = 2;
    //     changed = true;
    // }
    
    if (changed) {
        saveSettings();
        console.log(`[Tribunal] Migrated settings to v${settings.settingsVersion}`);
    }
}

/**
 * Get a specific setting value with dot notation
 * @param {string} path - Dot-notation path (e.g., 'api.voiceModel')
 * @param {*} defaultValue - Default if path doesn't exist
 * @returns {*} Setting value
 */
export function getSetting(path, defaultValue = undefined) {
    const settings = getSettings();
    const parts = path.split('.');
    let current = settings;
    
    for (const part of parts) {
        if (current === undefined || current === null) {
            return defaultValue;
        }
        current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
}

/**
 * Set a specific setting value with dot notation
 * @param {string} path - Dot-notation path
 * @param {*} value - Value to set
 */
export function setSetting(path, value) {
    const settings = getSettings();
    const parts = path.split('.');
    let current = settings;
    
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    saveSettings();
}


// ═══════════════════════════════════════════════════════════════
// PER-CHAT STATE
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current chat's state (creates if doesn't exist)
 * @returns {object|null} Chat state or null if no chat
 */
export function getChatState() {
    if (!chat_metadata) {
        console.warn('[Tribunal] No chat_metadata available');
        return null;
    }
    
    if (!chat_metadata[EXT_ID]) {
        chat_metadata[EXT_ID] = getDefaultChatState();
        chat_metadata[EXT_ID].meta.createdAt = Date.now();
    }
    
    return chat_metadata[EXT_ID];
}

/**
 * Save the current chat state (debounced)
 */
export function saveChatState() {
    if (!chat_metadata) {
        console.warn('[Tribunal] Cannot save - no chat_metadata');
        return;
    }
    
    const state = getChatState();
    if (state) {
        state.meta.lastModified = Date.now();
    }
    
    saveChatDebounced();
}

/**
 * Load chat state for current chat
 * Call this on CHAT_CHANGED event
 * @returns {object} The loaded (or default) chat state
 */
export function loadChatState() {
    if (!chat_metadata) {
        console.warn('[Tribunal] No chat_metadata - cannot load');
        return getDefaultChatState();
    }
    
    if (!chat_metadata[EXT_ID]) {
        // No existing data - create fresh state
        chat_metadata[EXT_ID] = getDefaultChatState();
        chat_metadata[EXT_ID].meta.createdAt = Date.now();
        console.log('[Tribunal] Created new chat state');
    } else {
        // Existing data - sanitize and migrate
        sanitizeChatState(chat_metadata[EXT_ID]);
        migrateChatState(chat_metadata[EXT_ID]);
        console.log('[Tribunal] Loaded existing chat state');
    }
    
    return chat_metadata[EXT_ID];
}

/**
 * Reset chat state to defaults (for new playthroughs)
 */
export function resetChatState() {
    if (!chat_metadata) {
        console.warn('[Tribunal] No chat_metadata - cannot reset');
        return;
    }
    
    chat_metadata[EXT_ID] = getDefaultChatState();
    chat_metadata[EXT_ID].meta.createdAt = Date.now();
    saveChatState();
    
    console.log('[Tribunal] Chat state reset to defaults');
}

/**
 * Sanitize chat state - ensure all expected properties exist
 * @param {object} state - State to sanitize
 */
function sanitizeChatState(state) {
    const defaults = getDefaultChatState();
    
    // Ensure all top-level keys
    for (const key of Object.keys(defaults)) {
        if (state[key] === undefined) {
            state[key] = defaults[key];
        }
    }
    
    // Ensure nested objects
    if (!state.attributes) state.attributes = { ...defaults.attributes };
    if (!state.skillLevels) state.skillLevels = {};
    if (!state.skillBonuses) state.skillBonuses = {};
    if (!state.vitals) state.vitals = { ...defaults.vitals };
    if (!state.thoughtCabinet) state.thoughtCabinet = { ...defaults.thoughtCabinet };
    if (!state.inventory) state.inventory = { ...defaults.inventory };
    if (!state.equipment) state.equipment = { ...defaults.equipment };
    if (!state.ledger) state.ledger = { ...defaults.ledger };
    if (!state.relationships) state.relationships = {};
    if (!state.voices) state.voices = { ...defaults.voices };
    if (!state.persona) state.persona = { ...defaults.persona };
    if (!state.meta) state.meta = { ...defaults.meta };
    
    // Ensure arrays exist
    if (!Array.isArray(state.vitals.activeEffects)) state.vitals.activeEffects = [];
    if (!Array.isArray(state.vitals.ancientVoices)) state.vitals.ancientVoices = [];
    if (!Array.isArray(state.thoughtCabinet.discovered)) state.thoughtCabinet.discovered = [];
    if (!Array.isArray(state.thoughtCabinet.internalized)) state.thoughtCabinet.internalized = [];
    if (!Array.isArray(state.inventory.carried)) state.inventory.carried = [];
    if (!Array.isArray(state.inventory.worn)) state.inventory.worn = [];
    if (!Array.isArray(state.inventory.stored)) state.inventory.stored = [];
    if (!Array.isArray(state.equipment.items)) state.equipment.items = [];
    if (!Array.isArray(state.ledger.cases)) state.ledger.cases = [];
    if (!Array.isArray(state.ledger.notes)) state.ledger.notes = [];
    if (!Array.isArray(state.ledger.locations)) state.ledger.locations = [];
    if (!Array.isArray(state.voices.lastGenerated)) state.voices.lastGenerated = [];
    if (!Array.isArray(state.voices.awakenedVoices)) state.voices.awakenedVoices = [];
    if (!Array.isArray(state.voices.discoveredClues)) state.voices.discoveredClues = [];
    
    // Ensure objects
    if (!state.thoughtCabinet.researching) state.thoughtCabinet.researching = {};
    if (!state.thoughtCabinet.customThoughts) state.thoughtCabinet.customThoughts = {};
    if (!state.thoughtCabinet.themes) state.thoughtCabinet.themes = {};
    if (!state.ledger.weather) state.ledger.weather = { ...defaults.ledger.weather };
    if (!state.ledger.time) state.ledger.time = { ...defaults.ledger.time };
}

/**
 * Migrate chat state to newer versions
 * @param {object} state - State to migrate
 */
function migrateChatState(state) {
    const currentVersion = state.version || 1;
    let changed = false;
    
    // Future migrations go here:
    // if (currentVersion < 2) {
    //     // Migrate to v2
    //     state.version = 2;
    //     changed = true;
    // }
    
    if (changed) {
        saveChatState();
        console.log(`[Tribunal] Migrated chat state to v${state.version}`);
    }
}


// ═══════════════════════════════════════════════════════════════
// PROGRESSION (Permanent, survives everything)
// ═══════════════════════════════════════════════════════════════

/**
 * Get progression data
 * @returns {object} Progression data
 */
export function getProgression() {
    const settings = getSettings();
    return settings.progression;
}

/**
 * Update progression and save
 * @param {object} updates - Partial progression updates
 */
export function updateProgression(updates) {
    const settings = getSettings();
    Object.assign(settings.progression, updates);
    saveSettings();
}

/**
 * Increment a total stat counter
 * @param {string} statName - Name of stat (e.g., 'voicesGenerated')
 * @param {number} amount - Amount to increment (default 1)
 */
export function incrementTotalStat(statName, amount = 1) {
    const prog = getProgression();
    if (prog.totalStats[statName] !== undefined) {
        prog.totalStats[statName] += amount;
        saveSettings();
    }
}


// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Check if there's an active chat
 * @returns {boolean}
 */
export function hasActiveChat() {
    const ctx = getContext();
    return ctx?.chat?.length > 0;
}

/**
 * Get the current character/group name
 * @returns {string|null}
 */
export function getCurrentEntityName() {
    const ctx = getContext();
    if (ctx?.groupId) {
        return ctx.groups?.find(g => g.id === ctx.groupId)?.name || 'Group';
    }
    return ctx?.name || null;
}

/**
 * Export current state for debugging
 * @returns {object}
 */
export function exportDebugState() {
    return {
        globalSettings: getSettings(),
        chatState: getChatState(),
        hasChat: hasActiveChat(),
        entityName: getCurrentEntityName()
    };
}
