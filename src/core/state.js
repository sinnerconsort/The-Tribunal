/**
 * Inland Empire - State Management
 * Handles saves, loads, profiles, and build management
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
    discovered: [],
    researching: {},
    internalized: [],
    dismissed: []
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
    autoDetectStatus: false,
    autoTrigger: false,
    triggerDelay: 1000,
    // Main FAB position
    fabPositionTop: 140,
    fabPositionLeft: 10,
    // Investigation FAB position and visibility
    discoveryFabTop: 200,
    discoveryFabLeft: 10,
    showInvestigationFab: true, // NEW: Toggle Investigation FAB visibility
    autoScanEnabled: false,     // Auto-investigate on new messages
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
    autoDiscoverThoughts: true
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
    
    // Check for Spinal Cord combo (party state: Tequila Sunset + Revacholian Courage)
    const hasAllCombo = SPINAL_CORD_COMBO.every(id => activeStatuses.has(id));
    if (hasAllCombo) {
        ancientVoices.add('spinal_cord');
    }
    
    return ancientVoices;
}

export function detectStatusesFromText(text) {
    const detected = [];
    const lowerText = text.toLowerCase();

    for (const [statusId, status] of Object.entries(STATUS_EFFECTS)) {
        for (const keyword of status.keywords) {
            if (lowerText.includes(keyword)) {
                detected.push(statusId);
                break;
            }
        }
    }

    return [...new Set(detected)];
}

export function getBoostedIntrusiveSkills() {
    const boosted = new Set();
    for (const statusId of activeStatuses) {
        const status = STATUS_EFFECTS[statusId];
        if (status?.intrusiveBoost) {
            status.intrusiveBoost.forEach(s => boosted.add(s));
        }
    }
    return boosted;
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
        activeStatuses: Array.from(activeStatuses),
        thoughtCabinet: JSON.parse(JSON.stringify(thoughtCabinet)),
        themeCounters: { ...themeCounters }
    };
}

export function saveProfile(name, context = null) {
    const profile = createProfile(name);
    savedProfiles[profile.id] = profile;
    if (context) saveState(context);
    return profile;
}

export function loadProfile(profileId, context = null) {
    const profile = savedProfiles[profileId];
    if (!profile) return false;

    if (profile.build) currentBuild = { ...profile.build };
    extensionSettings.povStyle = profile.povStyle || 'second';
    extensionSettings.characterName = profile.characterName || '';
    extensionSettings.characterPronouns = profile.characterPronouns || 'they';
    extensionSettings.characterContext = profile.characterContext || '';
    activeStatuses = new Set(profile.activeStatuses || []);

    if (profile.thoughtCabinet) {
        thoughtCabinet = JSON.parse(JSON.stringify(profile.thoughtCabinet));
    }
    if (profile.themeCounters) {
        themeCounters = { ...profile.themeCounters };
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
        }
    };

    try {
        if (context?.extensionSettings) {
            context.extensionSettings.inland_empire = state;
            context.saveSettingsDebounced?.();
        }
        localStorage.setItem('inland_empire_state', JSON.stringify(state));
    } catch (e) {
        console.error('[Inland Empire] Failed to save state:', e);
    }
}

export function loadState(context) {
    try {
        let state = context?.extensionSettings?.inland_empire ||
            JSON.parse(localStorage.getItem('inland_empire_state') || 'null');

        if (state) {
            extensionSettings = { ...DEFAULT_SETTINGS, ...state.settings };
            currentBuild = state.currentBuild || createBuild();
            activeStatuses = new Set(state.activeStatuses || []);
            savedProfiles = state.savedProfiles || {};
            themeCounters = state.themeCounters || {};
            thoughtCabinet = state.thoughtCabinet || {
                slots: 3,
                maxSlots: 12,
                discovered: [],
                researching: {},
                internalized: [],
                dismissed: []
            };

            if (state.discoveryContext) {
                discoveryContext = {
                    ...state.discoveryContext,
                    objectsSeen: new Set(state.discoveryContext.objectsSeen || [])
                };
            }
        } else {
            initializeDefaultBuild();
        }
    } catch (e) {
        console.error('[Inland Empire] Failed to load state:', e);
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

export function updateSettings(newSettings) {
    extensionSettings = { ...extensionSettings, ...newSettings };
}
