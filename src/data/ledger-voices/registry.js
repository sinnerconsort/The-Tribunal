/**
 * The Tribunal - Ledger Voice Registry
 * 
 * Same pattern as setting-profiles.js — thin import layer + accessor.
 * Each genre file exports its ledger voice data (identities, personas,
 * fallback lines, dice responses, fortune prompts).
 * 
 * The three ROLES are constant across all genres:
 *   damaged  → observes NOW with damaged care (The Tender One)
 *   oblivion → sees WHAT'S COMING, inevitable (The Prophet)  
 *   failure  → 4th wall, mocking, cares too much (The Bitter One)
 * 
 * But their IDENTITY changes completely per genre.
 * 
 * To add ledger voices for a new genre:
 *   1. Create src/data/ledger-voices/my-genre.js
 *   2. Export { ledgerVoices } matching the shape below
 *   3. Import it here and add to REGISTRY
 *   4. Done — engine picks it up automatically
 * 
 * @version 1.0.0
 */

import { getActiveProfileId } from '../setting-profiles.js';

// ── Genre Ledger Voice Imports ──
import { ledgerVoices as discoElysium } from './disco-elysium.js';
import { ledgerVoices as noirDetective } from './noir-detective.js';
import { ledgerVoices as romance } from './romance.js';
import { ledgerVoices as thrillerHorror } from './thriller-horror.js';
import { ledgerVoices as generic } from './generic.js';
import { ledgerVoices as fantasy } from './fantasy.js';
import { ledgerVoices as spaceOpera } from './space-opera.js';
import { ledgerVoices as sliceOfLife } from './slice-of-life.js';
import { ledgerVoices as postApocalyptic } from './post-apocalyptic.js';
import { ledgerVoices as cyberpunk } from './cyberpunk.js';
import { ledgerVoices as grimdark } from './grimdark.js';

// ═══════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════

const REGISTRY = {
    disco_elysium: discoElysium,
    noir_detective: noirDetective,
    romance: romance,
    thriller_horror: thrillerHorror,
    generic: generic,
    fantasy: fantasy,
    space_opera: spaceOpera,
    slice_of_life: sliceOfLife,
    post_apocalyptic: postApocalyptic,
    cyberpunk: cyberpunk,
    grimdark: grimdark,
};

// ═══════════════════════════════════════════════════════════════
// ACCESSORS
// ═══════════════════════════════════════════════════════════════

/**
 * Get ledger voices for the currently active genre.
 * Falls back to Disco Elysium if genre has no ledger voices.
 * @returns {object} Complete ledger voice data for active genre
 */
export function getLedgerVoices() {
    const profileId = getActiveProfileId();
    return REGISTRY[profileId] || REGISTRY.disco_elysium;
}

/**
 * Get a specific section of ledger voice data.
 * @param {string} section - 'voices' | 'personas' | 'fortunePersonas' | 'fallbacks' | 'diceResponses' | 'emptyFortunes'
 * @returns {object} The requested section, falling back to DE
 */
export function getLedgerVoiceSection(section) {
    const data = getLedgerVoices();
    if (data[section]) return data[section];
    // Fallback to DE for missing sections
    return REGISTRY.disco_elysium[section] || {};
}

/**
 * Get voice identity (name, color, tone) for a specific voice role.
 * @param {string} role - 'damaged' | 'oblivion' | 'failure'
 * @returns {object} { name, color, tone, domain }
 */
export function getLedgerVoiceIdentity(role) {
    const voices = getLedgerVoiceSection('voices');
    return voices[role] || REGISTRY.disco_elysium.voices[role];
}

/**
 * Get the AI persona prompt for a specific voice role.
 * @param {string} role - 'damaged' | 'oblivion' | 'failure'
 * @returns {string} System prompt for AI generation
 */
export function getLedgerPersona(role) {
    const personas = getLedgerVoiceSection('personas');
    return personas[role] || REGISTRY.disco_elysium.personas[role];
}

/**
 * Get the fortune-specific AI persona for a voice role.
 * @param {string} role - 'damaged' | 'oblivion' | 'failure'
 * @returns {string} Fortune generation prompt
 */
export function getFortunePersona(role) {
    const fortunePersonas = getLedgerVoiceSection('fortunePersonas');
    return fortunePersonas[role] || REGISTRY.disco_elysium.fortunePersonas[role];
}

/**
 * Get static fallback lines for a trigger/voice combo.
 * @param {string} trigger - Event type
 * @param {string} voice - Voice role
 * @returns {string[]} Array of fallback lines
 */
export function getLedgerFallbacks(trigger, voice) {
    const fallbacks = getLedgerVoiceSection('fallbacks');
    return fallbacks[trigger]?.[voice] || 
           REGISTRY.disco_elysium.fallbacks[trigger]?.[voice] || 
           REGISTRY.disco_elysium.fallbacks.compartmentOpen.damaged;
}

/**
 * Get dice response lines for a roll type.
 * @param {string} rollType - 'snakeEyes' | 'boxcars' | 'doubles' | 'high' | 'low' | 'normal'
 * @returns {object} { voice, lines }
 */
export function getDiceResponses(rollType) {
    const diceResponses = getLedgerVoiceSection('diceResponses');
    return diceResponses[rollType] || 
           REGISTRY.disco_elysium.diceResponses[rollType];
}

/**
 * Get contextual fortune pools for a voice.
 * @param {string} voice - Voice role
 * @returns {object} { generic, withCharacter, deepNight, lowMorale, themes }
 */
export function getContextualFortunes(voice) {
    const fortunes = getLedgerVoiceSection('contextualFortunes');
    return fortunes[voice] || REGISTRY.disco_elysium.contextualFortunes[voice];
}

/**
 * Get empty fortune lines.
 * @returns {string[]}
 */
export function getEmptyFortunes() {
    const data = getLedgerVoices();
    return data.emptyFortunes || REGISTRY.disco_elysium.emptyFortunes;
}

export default {
    getLedgerVoices,
    getLedgerVoiceSection,
    getLedgerVoiceIdentity,
    getLedgerPersona,
    getFortunePersona,
    getLedgerFallbacks,
    getDiceResponses,
    getContextualFortunes,
    getEmptyFortunes,
};
