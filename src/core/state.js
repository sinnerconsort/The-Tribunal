/**
 * The Tribunal - State Management
 * Handles saves, loads, profiles, and build management
 * Phase 1 Update: Added vitals, suggestions FAB, ledger, inventory state
 * Phase 5 Update: Added playerContext for thought generation
 */

import { ATTRIBUTES, SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, ARCHETYPE_IDS, SPINAL_CORD_COMBO } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// STATE VARIABLES
// ═══════════════════════════════════════════════════════════════

export let activeStatuses = new Set();
export let currentBuild = null;
export let savedProfiles = {};

// Discovery context for thought cabinet
export let discoveryContext = {
    messageCount: 0,
    objectsSeen: new Set(),
    criticalSuccesses: {},
    criticalFailures: {},
    ancientVoiceTriggered: false,
    firstDiscoveryDone: false
};

// Theme counters for thought cabinet
export let themeCounters = {};

// Thought cabinet state
export let thoughtCabinet = {
    slots: 3,
    maxSlots: 12,
    discovered: [],          // Array of thought IDs
    customThoughts: {},      // Map of ID → thought object (for generated thoughts)
    researching: {},
    internalized: [],
    dismissed: []
};

// Vitals state (Phase 2) - DE caps at 13
export let vitals = {
    health: 13,
    maxHealth: 13,
    morale: 13,
    maxMorale: 13
};

// Ledger state (Phase 3)
export let ledger = {
    activeCases: [],
    completedCases: [],
    notes: [],
    weather: {
        condition: 'unknown',
        description: 'Conditions unknown',
        icon: 'fa-cloud-sun'
    }
};

// Inventory state (Phase 4)
export let inventory = {
    carried: [],
    worn: [],
    stored: [],
    money: 0
};

// Default settings
export const DEFAULT_SETTINGS = {
    enabled: true,
    showDiceRolls: true,
    showFailedChecks: true,
    voicesPerMessage: { min: 1, max: 4 },
    apiEndpoint: '',
    apiKey: '',
    model: 'glm-4-plus',
    maxTokens: 300,
    temperature: 0.9,
    povStyle: 'second',
    characterName: '',
    characterPronouns: 'they',
    characterContext: '',
    scenePerspective: '',
    autoDetectStatus: false,
    autoTrigger: false,
    triggerDelay: 1000,
    contextMessages: 5,
    includeThoughts: true,
    useCharPersona: true,
    
    // Main FAB position
    fabPositionTop: 140,
    fabPositionLeft: 10,
    
    // Investigation FAB position and visibility
    discoveryFabTop: 200,
    discoveryFabLeft: 10,
    showInvestigationFab: true,
    autoScanEnabled: false,
    
    // Suggestions FAB (Phase 1)
    suggestionsFabTop: 260,
    suggestionsFabLeft: 10,
    showSuggestionsFab: false, // Hidden by default per spec
    autoSuggestions: false,
    suggestionsPrompt: '',
    
    // Intrusive thoughts
    intrusiveEnabled: true,
    intrusiveChance: 0.15,
    intrusiveInChat: true,
    
    // Object voices
    objectVoicesEnabled: true,
    objectVoiceChance: 0.4,
    
    // Thought cabinet
    thoughtDiscoveryEnabled: true,
    showThemeTracker: true,
    autoDiscoverThoughts: true,
    
    // Vitals system (Phase 2)
    vitalsEnabled: true,
    autoDetectVitals: false,
    vitalsSensitivity: 'medium',
    vitalsShowNotifications: true,
    
    // Weather system (Phase 3)
    weatherEnabled: true,
    injectWeatherContext: true,
    
    // Inventory system (Phase 4)
    inventoryEnabled: true,
    autoParseInventory: false,
    aiGenerateItems: false,
    
    // ═══════════════════════════════════════════════════════════════
    // THOUGHT GENERATION (Phase 5) - NEW
    // ═══════════════════════════════════════════════════════════════
    thoughtGeneration: {
        enableAutoThoughts: false,      // Auto-gen from chat context
        autoTriggerThreshold: 5,        // Theme count to trigger auto-gen
        cooldownMinutes: 10,            // Min time between auto-gens
        lastAutoGenTime: 0              // Timestamp of last auto-gen
    },
    
    // Global fallback player context (used if profile doesn't have one)
    playerContext: {
        perspective: 'observer',        // 'observer' | 'participant'
        identity: ''                    // "spawn of Bhaal", "survivor", etc.
    }
};

export let extensionSettings = { ...DEFAULT_SETTINGS };

const DEFAULT_ATTRIBUTE_POINTS = { INTELLECT: 3, PSYCHE: 3, PHYSIQUE: 3, MOTORICS: 3 };

// ═══════════════════════════════════════════════════════════════
// BUILD MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function createBuild(attributePoints = DEFAULT_ATTRIBUTE_POINTS, name = 'Custom Build') {
    const skillLevels = {};
    const skillCaps = {};

    for (const [attrId, attr] of Object.entries(ATTRIBUTES)) {
        const attrPoints = attributePoints[attrId] || 1;
        for (const skillId of attr.skills) {
            skillLevels[skillId] = attrPoints;
            skillCaps[skillId] = {
                starting: attrPoints + 1,
                learning: attrPoints + 4
            };
        }
    }

    return {
        id: `build_${Date.now()}`,
        name,
        attributePoints: { ...attributePoints },
        skillLevels,
        skillCaps,
        createdAt: Date.now()
    };
}

export function initializeDefaultBuild() {
    currentBuild = createBuild(DEFAULT_ATTRIBUTE_POINTS, 'Balanced Detective');
}

export function getSkillLevel(skillId) {
    if (!currentBuild) initializeDefaultBuild();
    return currentBuild.skillLevels[skillId] || 1;
}

export function getAllSkillLevels() {
    if (!currentBuild) initializeDefaultBuild();
    return { ...currentBuild.skillLevels };
}

export function getAttributePoints() {
    if (!currentBuild) initializeDefaultBuild();
    return { ...currentBuild.attributePoints };
}

export function applyAttributeAllocation(attributePoints) {
    const total = Object.values(attributePoints).reduce((a, b) => a + b, 0);
    if (total !== 12) {
        throw new Error(`Invalid attribute total: ${total}`);
    }
    currentBuild = createBuild(attributePoints, currentBuild?.name || 'Custom Build');
}

export function getSkillCap(skillId) {
    if (!currentBuild?.skillCaps?.[skillId]) return 6;
    return Math.min(10, currentBuild.skillCaps[skillId].learning);
}

// ═══════════════════════════════════════════════════════════════
// STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function toggleStatus(statusId, context = null) {
    const status = STATUS_EFFECTS[statusId];
    
    if (activeStatuses.has(statusId)) {
        // Turning off
        activeStatuses.delete(statusId);
    } else {
        // Turning on
        // If this is an archetype, remove any other active archetypes first
        if (status && status.exclusive === 'archetype') {
            for (const archetypeId of ARCHETYPE_IDS) {
                activeStatuses.delete(archetypeId);
            }
        }
        activeStatuses.add(statusId);
    }
    if (context) saveState(context);
}

export function getSkillModifier(skillId, researchPenalties = {}) {
    let modifier = 0;

    // Status effects
    for (const statusId of activeStatuses) {
        const status = STATUS_EFFECTS[statusId];
        if (!status) continue;
        if (status.boosts.includes(skillId)) modifier += 1;
        if (status.debuffs.includes(skillId)) modifier -= 1;
    }

    // Research penalties from thought cabinet
    if (researchPenalties[skillId]) {
        modifier += researchPenalties[skillId];
    }

    return modifier;
}

export function getEffectiveSkillLevel(skillId, researchPenalties = {}) {
    const base = getSkillLevel(skillId);
    const modifier = getSkillModifier(skillId, researchPenalties);
    const cap = getSkillCap(skillId);
    return Math.max(1, Math.min(cap, base + modifier));
}

export function getActiveAncientVoices() {
    const ancientVoices = new Set();
    
    // Check individual status triggers
    for (const statusId of activeStatuses) {
        const status = STATUS_EFFECTS[statusId];
        if (status && status.ancientVoice) {
            if (status.ancientVoice === 'both') {
                // Special case: The Pale triggers both ancient voices
                ancientVoices.add('ancient_reptilian_brain');
                ancientVoices.add('limbic_system');
            } else {
                ancientVoices.add(status.ancientVoice);
            }
        }
    }
    
    // Check spinal cord combo
    const hasSpinalCombo = SPINAL_CORD_COMBO.every(id => activeStatuses.has(id));
    if (hasSpinalCombo) {
        ancientVoices.add('spinal_cord');
    }
    
    return ancientVoices;
}

// ═══════════════════════════════════════════════════════════════
// VITALS MANAGEMENT (Phase 2)
// ═══════════════════════════════════════════════════════════════

export function getVitals() {
    return { ...vitals };
}

export function setHealth(value, context = null) {
    vitals.health = Math.max(0, Math.min(vitals.maxHealth, value));
    if (context) saveState(context);
    return vitals.health;
}

export function setMorale(value, context = null) {
    vitals.morale = Math.max(0, Math.min(vitals.maxMorale, value));
    if (context) saveState(context);
    return vitals.morale;
}

export function modifyHealth(delta, context = null) {
    return setHealth(vitals.health + delta, context);
}

export function modifyMorale(delta, context = null) {
    return setMorale(vitals.morale + delta, context);
}

export function setMaxHealth(value, context = null) {
    vitals.maxHealth = Math.max(1, value);
    vitals.health = Math.min(vitals.health, vitals.maxHealth);
    if (context) saveState(context);
}

export function setMaxMorale(value, context = null) {
    vitals.maxMorale = Math.max(1, value);
    vitals.morale = Math.min(vitals.morale, vitals.maxMorale);
    if (context) saveState(context);
}

// ═══════════════════════════════════════════════════════════════
// LEDGER MANAGEMENT (Phase 3)
// ═══════════════════════════════════════════════════════════════

export function getLedger() {
    return ledger;
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT (Phase 4)
// ═══════════════════════════════════════════════════════════════

export function addItem(item, location = 'carried', context = null) {
    const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: item.name || 'Unknown Item',
        description: item.description || '',
        icon: item.icon || '📦',
        effects: item.effects || [],
        tags: item.tags || [],
        addedAt: Date.now()
    };
    
    if (location === 'carried') inventory.carried.push(newItem);
    else if (location === 'worn') inventory.worn.push(newItem);
    else if (location === 'stored') inventory.stored.push(newItem);
    
    if (context) saveState(context);
    return newItem;
}

export function removeItem(itemId, context = null) {
    for (const loc of ['carried', 'worn', 'stored']) {
        const idx = inventory[loc].findIndex(i => i.id === itemId);
        if (idx !== -1) {
            const removed = inventory[loc].splice(idx, 1)[0];
            if (context) saveState(context);
            return removed;
        }
    }
    return null;
}

export function equipItem(itemId, context = null) {
    const item = removeItem(itemId);
    if (item) {
        inventory.worn.push(item);
        if (context) saveState(context);
        return item;
    }
    return null;
}

export function unequipItem(itemId, context = null) {
    const idx = inventory.worn.findIndex(i => i.id === itemId);
    if (idx !== -1) {
        const item = inventory.worn.splice(idx, 1)[0];
        inventory.carried.push(item);
        if (context) saveState(context);
        return item;
    }
    return null;
}

export function setMoney(amount, context = null) {
    inventory.money = Math.max(0, amount);
    if (context) saveState(context);
    return inventory.money;
}

export function modifyMoney(delta, context = null) {
    return setMoney(inventory.money + delta, context);
}

export function getInventory() {
    return { ...inventory };
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET HELPERS (Phase 5)
// ═══════════════════════════════════════════════════════════════

/**
 * Add a discovered thought to the cabinet
 * Stores the thought object in customThoughts and adds ID to discovered array
 * @param {Object} thought - Thought object from generator (must have .id)
 */
export function addDiscoveredThought(thought) {
    if (!thought?.id) {
        console.error('[Tribunal] Cannot add thought without ID:', thought);
        return;
    }
    
    // Ensure customThoughts exists
    if (!thoughtCabinet.customThoughts) {
        thoughtCabinet.customThoughts = {};
    }
    
    // Ensure discovered exists
    if (!thoughtCabinet.discovered) {
        thoughtCabinet.discovered = [];
    }
    
    // Store the thought object by ID
    thoughtCabinet.customThoughts[thought.id] = thought;
    
    // Add the ID to discovered array (if not already there)
    if (!thoughtCabinet.discovered.includes(thought.id)) {
        thoughtCabinet.discovered.push(thought.id);
    }
}

/**
 * Get all discovered thoughts (returns array of IDs)
 * @returns {Array} Discovered thought IDs
 */
export function getDiscoveredThoughts() {
    return thoughtCabinet.discovered || [];
}

/**
 * Get a custom thought by ID
 * @param {string} thoughtId - The thought ID
 * @returns {Object|null} The thought object or null
 */
export function getCustomThought(thoughtId) {
    return thoughtCabinet.customThoughts?.[thoughtId] || null;
}

/**
 * Get theme counters
 * @returns {Object} Theme counter object
 */
export function getThemeCounters() {
    return { ...themeCounters };
}

/**
 * Get the current profile (for playerContext)
 * @returns {Object|null} Current profile or null
 */
export function getCurrentProfile() {
    // Find the profile that matches current build
    for (const profile of Object.values(savedProfiles)) {
        if (profile.build?.id === currentBuild?.id) {
            return profile;
        }
    }
    return null;
}

/**
 * Get player context (from current profile or global fallback)
 * @returns {Object} { perspective: string, identity: string }
 */
export function getPlayerContext() {
    const profile = getCurrentProfile();
    
    if (profile?.playerContext) {
        return {
            perspective: profile.playerContext.perspective || 'observer',
            identity: profile.playerContext.identity || ''
        };
    }
    
    return {
        perspective: extensionSettings.playerContext?.perspective || 'observer',
        identity: extensionSettings.playerContext?.identity || ''
    };
}

/**
 * Save player context to current profile or global settings
 * @param {Object} playerContext - { perspective, identity }
 * @param {Object} context - SillyTavern context for saving
 */
export function savePlayerContext(playerContext, context = null) {
    const profile = getCurrentProfile();
    
    if (profile) {
        profile.playerContext = playerContext;
    } else {
        extensionSettings.playerContext = playerContext;
    }
    
    if (context) saveState(context);
}

// ═══════════════════════════════════════════════════════════════
// PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function createProfile(name) {
    return {
        id: `profile_${Date.now()}`,
        name,
        createdAt: Date.now(),
        build: currentBuild ? { ...currentBuild } : createBuild(),
        povStyle: extensionSettings.povStyle,
        characterName: extensionSettings.characterName,
        characterPronouns: extensionSettings.characterPronouns,
        characterContext: extensionSettings.characterContext,
        scenePerspective: extensionSettings.scenePerspective,
        activeStatuses: Array.from(activeStatuses),
        thoughtCabinet: JSON.parse(JSON.stringify(thoughtCabinet)),
        themeCounters: { ...themeCounters },
        // Phase 2+ state
        vitals: { ...vitals },
        ledger: JSON.parse(JSON.stringify(ledger)),
        inventory: JSON.parse(JSON.stringify(inventory)),
        // Phase 5: Player context for thought generation
        playerContext: getPlayerContext()
    };
}

export function saveProfile(name, context = null) {
    const profile = createProfile(name);
    savedProfiles[profile.id] = profile;
    if (context) saveState(context);
    return profile;
}

export function updateProfile(profileId, context = null) {
    const existing = savedProfiles[profileId];
    if (!existing) return false;
    
    // Keep the original name and id, update everything else
    const updated = createProfile(existing.name);
    updated.id = existing.id;
    updated.createdAt = existing.createdAt;
    updated.updatedAt = Date.now();
    
    savedProfiles[profileId] = updated;
    if (context) saveState(context);
    return updated;
}

export function loadProfile(profileId, context = null) {
    const profile = savedProfiles[profileId];
    if (!profile) return false;

    if (profile.build) currentBuild = { ...profile.build };
    extensionSettings.povStyle = profile.povStyle || 'second';
    extensionSettings.characterName = profile.characterName || '';
    extensionSettings.characterPronouns = profile.characterPronouns || 'they';
    extensionSettings.characterContext = profile.characterContext || '';
    extensionSettings.scenePerspective = profile.scenePerspective || '';
    activeStatuses = new Set(profile.activeStatuses || []);

    if (profile.thoughtCabinet) {
        thoughtCabinet = JSON.parse(JSON.stringify(profile.thoughtCabinet));
        // Ensure customThoughts exists after load
        if (!thoughtCabinet.customThoughts) {
            thoughtCabinet.customThoughts = {};
        }
    }
    if (profile.themeCounters) {
        themeCounters = { ...profile.themeCounters };
    }
    
    // Phase 2+ state
    if (profile.vitals) {
        vitals = { ...vitals, ...profile.vitals };
    }
    if (profile.ledger) {
        ledger = JSON.parse(JSON.stringify(profile.ledger));
    }
    if (profile.inventory) {
        inventory = JSON.parse(JSON.stringify(profile.inventory));
    }
    
    // Phase 5: Restore player context
    if (profile.playerContext) {
        extensionSettings.playerContext = { ...profile.playerContext };
    }

    if (context) saveState(context);
    return true;
}

export function deleteProfile(profileId, context = null) {
    if (savedProfiles[profileId]) {
        delete savedProfiles[profileId];
        if (context) saveState(context);
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════

export function saveState(context) {
    const state = {
        settings: extensionSettings,
        currentBuild,
        activeStatuses: Array.from(activeStatuses),
        savedProfiles,
        themeCounters,
        thoughtCabinet,
        discoveryContext: {
            ...discoveryContext,
            objectsSeen: Array.from(discoveryContext.objectsSeen)
        },
        // Phase 2+ state
        vitals,
        ledger,
        inventory
    };

    try {
        if (context?.extensionSettings) {
            context.extensionSettings.inland_empire = state;
            context.saveSettingsDebounced?.();
        }
        localStorage.setItem('inland_empire_state', JSON.stringify(state));
    } catch (e) {
        console.error('[The Tribunal] Failed to save state:', e);
    }
}

export function loadState(context) {
    try {
        let state = context?.extensionSettings?.inland_empire ||
            JSON.parse(localStorage.getItem('inland_empire_state') || 'null');

        if (state) {
            extensionSettings = { ...DEFAULT_SETTINGS, ...state.settings };
            
            // Ensure nested objects are properly merged
            if (state.settings?.thoughtGeneration) {
                extensionSettings.thoughtGeneration = {
                    ...DEFAULT_SETTINGS.thoughtGeneration,
                    ...state.settings.thoughtGeneration
                };
            }
            if (state.settings?.playerContext) {
                extensionSettings.playerContext = {
                    ...DEFAULT_SETTINGS.playerContext,
                    ...state.settings.playerContext
                };
            }
            
            currentBuild = state.currentBuild || createBuild();
            activeStatuses = new Set(state.activeStatuses || []);
            savedProfiles = state.savedProfiles || {};
            themeCounters = state.themeCounters || {};
            thoughtCabinet = state.thoughtCabinet || {
                slots: 3,
                maxSlots: 12,
                discovered: [],
                customThoughts: {},
                researching: {},
                internalized: [],
                dismissed: []
            };
            
            // Ensure discovered array exists (migration)
            if (!thoughtCabinet.discovered) {
                thoughtCabinet.discovered = [];
            }
            
            // Ensure customThoughts exists (migration)
            if (!thoughtCabinet.customThoughts) {
                thoughtCabinet.customThoughts = {};
            }
            
            // Migration: If discovered contains objects instead of IDs, fix it
            if (thoughtCabinet.discovered.length > 0 && typeof thoughtCabinet.discovered[0] === 'object') {
                const oldDiscovered = thoughtCabinet.discovered;
                thoughtCabinet.discovered = [];
                for (const thought of oldDiscovered) {
                    if (thought?.id) {
                        thoughtCabinet.customThoughts[thought.id] = thought;
                        thoughtCabinet.discovered.push(thought.id);
                    }
                }
            }

            if (state.discoveryContext) {
                discoveryContext = {
                    ...state.discoveryContext,
                    objectsSeen: new Set(state.discoveryContext.objectsSeen || [])
                };
            }
            
            // Phase 2+ state
            if (state.vitals) {
                vitals = { ...vitals, ...state.vitals };
                
                // Migration: Convert from 100-scale to 13-scale (DE style)
                if (vitals.maxHealth === 100) {
                    vitals.maxHealth = 13;
                    vitals.health = Math.min(13, Math.round(vitals.health * 13 / 100));
                }
                if (vitals.maxMorale === 100) {
                    vitals.maxMorale = 13;
                    vitals.morale = Math.min(13, Math.round(vitals.morale * 13 / 100));
                }
            }
            if (state.ledger) {
                ledger = { ...ledger, ...state.ledger };
            }
            if (state.inventory) {
                inventory = { ...inventory, ...state.inventory };
            }
        } else {
            initializeDefaultBuild();
        }
    } catch (e) {
        console.error('[The Tribunal] Failed to load state:', e);
        initializeDefaultBuild();
    }
}

// ═══════════════════════════════════════════════════════════════
// SETTERS (for external modules to update state)
// ═══════════════════════════════════════════════════════════════

export function setCurrentBuild(build) {
    currentBuild = build;
}

export function setThemeCounters(counters) {
    themeCounters = counters;
}

export function setThoughtCabinet(cabinet) {
    thoughtCabinet = cabinet;
}

export function setDiscoveryContext(ctx) {
    discoveryContext = ctx;
}

export function setVitals(newVitals) {
    vitals = { ...vitals, ...newVitals };
}

export function setLedger(newLedger) {
    ledger = { ...ledger, ...newLedger };
}

export function setInventory(newInventory) {
    inventory = { ...inventory, ...newInventory };
}

export function updateSettings(newSettings) {
    extensionSettings = { ...extensionSettings, ...newSettings };
}
