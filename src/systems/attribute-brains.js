/**
 * Attribute Brains — Shared Cognitive Memory for Voice Groups
 * 
 * Four attribute-level brains (Intellect, Psyche, Physique, Motorics) store
 * neutral factual observations. The 6 voices within each attribute share a
 * brain, reading the same observations but interpreting them through their
 * own personality lens.
 * 
 * Brain entries are genre-agnostic — they store facts, not interpretations.
 * Genre coloring comes from voice personalities and setting profiles.
 * 
 * @version 1.0.0
 */

import { getChatState, saveChatState, getSettings } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const ATTRIBUTE_IDS = ['intellect', 'psyche', 'physique', 'motorics'];

export const ATTRIBUTE_DESCRIPTIONS = {
    intellect: 'Theories, contradictions, evidence, patterns, knowledge gaps',
    psyche: 'Emotional reads, trust assessments, social dynamics, willpower states',
    physique: 'Bodily states, threats detected, cravings, pain, sensory memory',
    motorics: 'Spatial layout, mechanical details, environmental observations'
};

/**
 * Maps all 24 voices to their attribute brain.
 * When a voice speaks, it reads from and can write to this brain.
 */
export const VOICE_TO_ATTRIBUTE = {
    // Intellect
    logic: 'intellect',
    encyclopedia: 'intellect',
    rhetoric: 'intellect',
    drama: 'intellect',
    conceptualization: 'intellect',
    visual_calculus: 'intellect',
    // Psyche
    volition: 'psyche',
    inland_empire: 'psyche',
    empathy: 'psyche',
    authority: 'psyche',
    suggestion: 'psyche',
    esprit_de_corps: 'psyche',
    // Physique
    endurance: 'physique',
    pain_threshold: 'physique',
    physical_instrument: 'physique',
    electrochemistry: 'physique',
    shivers: 'physique',
    half_light: 'physique',
    // Motorics
    hand_eye_coordination: 'motorics',
    perception: 'motorics',
    reaction_speed: 'motorics',
    savoir_faire: 'motorics',
    interfacing: 'motorics',
    composure: 'motorics'
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════

/**
 * Default attribute brains state shape.
 * Added to DEFAULT_CHAT_STATE in defaults.js
 */
export function getDefaultBrainState() {
    return {
        _config: {
            messagesSinceUpdate: 0,
            lastUpdateAt: null
        },
        intellect: { thoughts: {}, lastUpdated: null },
        psyche: { thoughts: {}, lastUpdated: null },
        physique: { thoughts: {}, lastUpdated: null },
        motorics: { thoughts: {}, lastUpdated: null }
    };
}

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the attribute brains from current chat state.
 * Creates default state if missing (defensive initialization).
 * @returns {Object|null} The attributeBrains state object, or null if no chat
 */
export function getAttributeBrains() {
    const state = getChatState();
    if (!state) return null;
    
    if (!state.attributeBrains) {
        state.attributeBrains = getDefaultBrainState();
    }
    return state.attributeBrains;
}

/**
 * Get a single attribute brain by ID.
 * @param {string} attributeId - 'intellect' | 'psyche' | 'physique' | 'motorics'
 * @returns {Object|null} The brain object { thoughts, lastUpdated } or null
 */
export function getAttributeBrain(attributeId) {
    if (!ATTRIBUTE_IDS.includes(attributeId)) return null;
    const brains = getAttributeBrains();
    if (!brains) return null;
    return brains[attributeId] || null;
}

/**
 * Get the brain that a specific voice reads from.
 * @param {string} skillId - Voice/skill ID (e.g., 'logic', 'empathy')
 * @returns {Object|null} The attribute brain this voice reads
 */
export function getBrainForVoice(skillId) {
    const attributeId = VOICE_TO_ATTRIBUTE[skillId];
    if (!attributeId) return null;
    return getAttributeBrain(attributeId);
}

/**
 * Get the attribute ID for a given voice/skill.
 * @param {string} skillId
 * @returns {string|null}
 */
export function getAttributeForVoice(skillId) {
    return VOICE_TO_ATTRIBUTE[skillId] || null;
}

/**
 * Check if brain system is enabled in global settings.
 * @returns {boolean}
 */
export function isBrainEnabled() {
    const settings = getSettings();
    return settings?.brains?.enabled !== false; // Default true
}

/**
 * Get brain config values (from global settings, with defaults).
 * @returns {Object} { updateInterval, maxThoughtsPerBrain }
 */
export function getBrainConfig() {
    const settings = getSettings();
    const brainSettings = settings?.brains || {};
    return {
        updateInterval: brainSettings.updateInterval ?? 4,
        maxThoughtsPerBrain: brainSettings.maxThoughts ?? 10
    };
}

// ═══════════════════════════════════════════════════════════════
// BRAIN CRUD
// ═══════════════════════════════════════════════════════════════

/**
 * Add or update a thought in an attribute brain.
 * New entries are refused when brain is full (at maxThoughtsPerBrain).
 * 
 * @param {string} attributeId - Target attribute brain
 * @param {string} key - snake_case thought key (1-4 words)
 * @param {string} observation - Neutral factual observation (one sentence)
 * @returns {boolean} Whether the write succeeded
 */
export function writeToBrain(attributeId, key, observation) {
    const brain = getAttributeBrain(attributeId);
    if (!brain) return false;

    const { maxThoughtsPerBrain } = getBrainConfig();
    const isUpdate = key in brain.thoughts;

    // If new entry, check cap
    if (!isUpdate && Object.keys(brain.thoughts).length >= maxThoughtsPerBrain) {
        console.warn(`[Tribunal Brains] ${attributeId} brain full (${maxThoughtsPerBrain}). Refusing: ${key}`);
        return false;
    }

    brain.thoughts[key] = observation;
    brain.lastUpdated = new Date().toISOString();
    saveChatState();
    return true;
}

/**
 * Delete a thought from an attribute brain.
 * @param {string} attributeId - Target attribute brain
 * @param {string} key - Thought key to remove
 * @returns {boolean} Whether the delete succeeded
 */
export function deleteFromBrain(attributeId, key) {
    const brain = getAttributeBrain(attributeId);
    if (!brain || !(key in brain.thoughts)) return false;

    delete brain.thoughts[key];
    brain.lastUpdated = new Date().toISOString();
    saveChatState();
    return true;
}

/**
 * Voice-time write: A voice adds an observation to its own attribute brain.
 * @param {string} skillId - The voice/skill writing the observation
 * @param {string} key - snake_case thought key
 * @param {string} observation - Neutral factual observation
 * @returns {boolean}
 */
export function voiceWriteToBrain(skillId, key, observation) {
    const attributeId = VOICE_TO_ATTRIBUTE[skillId];
    if (!attributeId) return false;
    return writeToBrain(attributeId, key, observation);
}

// ═══════════════════════════════════════════════════════════════
// BATCH UPDATE APPLICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Apply parsed brain operations from a batch update response.
 * Saves state ONCE after all operations.
 * 
 * @param {Array<{ attributeId: string, operations: Array<{ type: string, key: string, value?: string }> }>} updateSet
 * @returns {Object} Summary: { applied, skipped, byAttribute }
 */
export function applyBatchUpdate(updateSet) {
    const summary = { applied: 0, skipped: 0, byAttribute: {} };

    for (const { attributeId, operations } of updateSet) {
        if (!ATTRIBUTE_IDS.includes(attributeId)) continue;
        summary.byAttribute[attributeId] = { added: 0, updated: 0, deleted: 0, skipped: 0 };

        for (const op of operations) {
            const brain = getAttributeBrain(attributeId);
            if (!brain) continue;

            let success = false;

            if (op.type === 'delete') {
                if (op.key in brain.thoughts) {
                    delete brain.thoughts[op.key];
                    brain.lastUpdated = new Date().toISOString();
                    success = true;
                    summary.byAttribute[attributeId].deleted++;
                }
            } else if (op.type === 'set') {
                const isUpdate = op.key in brain.thoughts;
                const { maxThoughtsPerBrain } = getBrainConfig();
                
                if (isUpdate || Object.keys(brain.thoughts).length < maxThoughtsPerBrain) {
                    brain.thoughts[op.key] = op.value;
                    brain.lastUpdated = new Date().toISOString();
                    success = true;
                    summary.byAttribute[attributeId][isUpdate ? 'updated' : 'added']++;
                }
            }

            if (success) summary.applied++;
            else {
                summary.skipped++;
                summary.byAttribute[attributeId].skipped++;
            }
        }
    }

    // Save once after all operations
    saveChatState();
    return summary;
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE COUNTER
// ═══════════════════════════════════════════════════════════════

/**
 * Increment the message counter. Returns true when a batch update is due.
 * @returns {boolean} Whether a batch update should be triggered
 */
export function incrementBrainCounter() {
    if (!isBrainEnabled()) return false;
    
    const brains = getAttributeBrains();
    if (!brains) return false;

    brains._config.messagesSinceUpdate++;
    saveChatState();

    const { updateInterval } = getBrainConfig();
    return brains._config.messagesSinceUpdate >= updateInterval;
}

/**
 * Reset the message counter after a batch update completes.
 */
export function resetBrainCounter() {
    const brains = getAttributeBrains();
    if (!brains) return;
    
    brains._config.messagesSinceUpdate = 0;
    brains._config.lastUpdateAt = new Date().toISOString();
    saveChatState();
}

/**
 * Get current counter value (for UI display).
 * @returns {{ current: number, interval: number }}
 */
export function getBrainCounterStatus() {
    const brains = getAttributeBrains();
    const { updateInterval } = getBrainConfig();
    return {
        current: brains?._config?.messagesSinceUpdate || 0,
        interval: updateInterval
    };
}

// ═══════════════════════════════════════════════════════════════
// SERIALIZATION (for AI prompts)
// ═══════════════════════════════════════════════════════════════

/**
 * Serialize a single attribute brain for an AI prompt.
 * @param {string} attributeId
 * @returns {string} Formatted brain block
 */
export function serializeBrainForPrompt(attributeId) {
    const brain = getAttributeBrain(attributeId);
    const desc = ATTRIBUTE_DESCRIPTIONS[attributeId] || '';
    const header = `[${attributeId.toUpperCase()}] ${desc}`;

    if (!brain?.thoughts || Object.keys(brain.thoughts).length === 0) {
        return `${header}\n(No observations yet.)`;
    }

    const entries = Object.entries(brain.thoughts)
        .map(([k, v]) => `  ${k}: "${v}"`)
        .join('\n');

    return `${header}\n${entries}`;
}

/**
 * Serialize all four brains for the batch update prompt.
 * @returns {string} Full brain state block
 */
export function serializeAllBrainsForPrompt() {
    return ATTRIBUTE_IDS
        .map(id => serializeBrainForPrompt(id))
        .join('\n\n');
}

/**
 * Serialize just one attribute brain for a voice prompt.
 * Returns only the thought entries (no header), or null if empty.
 * 
 * @param {string} skillId - Voice/skill that will read this
 * @returns {string|null} Brain entries or null if empty/unavailable
 */
export function serializeBrainForVoice(skillId) {
    const attributeId = VOICE_TO_ATTRIBUTE[skillId];
    if (!attributeId) return null;

    const brain = getAttributeBrain(attributeId);
    if (!brain?.thoughts || Object.keys(brain.thoughts).length === 0) return null;

    return Object.entries(brain.thoughts)
        .map(([k, v]) => `  ${k}: "${v}"`)
        .join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MIGRATION & SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize loaded brain state. Called from persistence.js sanitizeChatState().
 * Ensures all expected keys exist without losing existing data.
 * 
 * @param {Object} loadedBrains - The raw attributeBrains from chat_metadata
 * @returns {Object} Properly shaped attributeBrains
 */
export function sanitizeBrainState(loadedBrains) {
    const defaults = getDefaultBrainState();

    if (!loadedBrains) return defaults;

    // Merge config
    const config = { ...defaults._config, ...(loadedBrains._config || {}) };

    // Merge each attribute brain
    const merged = { _config: config };
    for (const id of ATTRIBUTE_IDS) {
        merged[id] = {
            thoughts: loadedBrains[id]?.thoughts || {},
            lastUpdated: loadedBrains[id]?.lastUpdated || null
        };
    }

    return merged;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Total thought count across all brains (for UI/budget display).
 * @returns {number}
 */
export function getTotalThoughtCount() {
    const brains = getAttributeBrains();
    if (!brains) return 0;
    return ATTRIBUTE_IDS.reduce((sum, id) => {
        return sum + Object.keys(brains[id]?.thoughts || {}).length;
    }, 0);
}

/**
 * Summary of all brains for UI display.
 * @returns {Object} { intellect: { count, max, thoughts, lastUpdated }, ... }
 */
export function getBrainSummary() {
    const brains = getAttributeBrains();
    const { maxThoughtsPerBrain } = getBrainConfig();
    const summary = {};
    
    for (const id of ATTRIBUTE_IDS) {
        const brain = brains?.[id];
        summary[id] = {
            count: Object.keys(brain?.thoughts || {}).length,
            max: maxThoughtsPerBrain,
            thoughts: brain?.thoughts || {},
            lastUpdated: brain?.lastUpdated
        };
    }
    return summary;
}

/**
 * Clear all brains (reset). Preserves config.
 */
export function clearAllBrains() {
    const brains = getAttributeBrains();
    if (!brains) return;
    
    for (const id of ATTRIBUTE_IDS) {
        brains[id] = { thoughts: {}, lastUpdated: null };
    }
    brains._config.messagesSinceUpdate = 0;
    brains._config.lastUpdateAt = null;
    saveChatState();
    
    console.log('[Tribunal Brains] All brains cleared');
}
