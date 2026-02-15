/**
 * The Tribunal - Contact Genre Rewriter
 * Genre-aware theming for the contacts system
 * 
 * v1.0.0
 * 
 * WHAT THIS DOES:
 * - Themes contact type labels (INFORMANT → ALLY in Fantasy, ASSET in Cyberpunk)
 * - Provides genre-framed dossier prompts for AI generation
 * - Selects genre-appropriate default voices for new contacts
 * - Generates themed fallback consensus text when AI fails
 * 
 * WHAT IT DOESN'T DO:
 * - Detection stays universal (contact-intelligence.js unchanged)
 * - Sentiment analysis stays universal (same patterns work across genres)
 * - Voice opinion mechanics stay universal (scores, seeding, thresholds)
 * - Data structures unchanged (contacts.js untouched)
 * 
 * GENRE DATA LOCATION:
 * All themed content lives in genre profile promptFrames:
 *   promptFrames.contactTypes      — { informant: { label, shortLabel }, ... }
 *   promptFrames.contactDossier    — String frame for dossier AI prompts
 *   promptFrames.defaultDossierVoices — [skillId, skillId, skillId]
 *   promptFrames.contactFallbacks  — { trusted: "...", hostile: "...", ... }
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Detection is universal. Presentation is themed.                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// DEFAULTS (Disco Elysium / Noir Detective)
// Used when no genre profile provides overrides
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONTACT_TYPES = {
    informant: { label: 'INFORMANT', shortLabel: 'I', color: '#4a9f4a' },
    witness:   { label: 'WITNESS',   shortLabel: 'W', color: '#7a7a4a' },
    unknown:   { label: 'UNKNOWN',   shortLabel: '?', color: '#6a6a6a' },
    accomplice:{ label: 'ACCOMPLICE',shortLabel: 'A', color: '#9f7a4a' },
    suspect:   { label: 'SUSPECT',   shortLabel: 'S', color: '#9f4a4a' }
};

const DEFAULT_DOSSIER_VOICES = ['logic', 'inland_empire', 'half_light'];

const DEFAULT_FALLBACK_CONSENSUS = {
    trusted:    (name) => `${name}. Someone the voices agree on — a rare thing. Trustworthy, or at least useful enough to keep close.`,
    neutral:    (name) => `${name}. Not enough data to form a consensus. The voices are still making up their minds.`,
    cautious:   (name) => `${name}. Something about them keeps the voices on edge. Not hostile — but not relaxed either.`,
    suspicious: (name) => `${name}. The voices don't agree on much, but they agree on this: watch this one carefully.`,
    hostile:    (name) => `${name}. Danger. Every voice says the same thing, just in different tones of alarm.`
};

// ═══════════════════════════════════════════════════════════════
// CONTACT TYPE LABELS (for UI display)
// ═══════════════════════════════════════════════════════════════

/**
 * Get themed label for a single contact type
 * UI calls this when rendering contact cards/badges
 * 
 * @param {string} typeId - One of: informant, witness, unknown, accomplice, suspect
 * @returns {{ label: string, shortLabel: string, color?: string }}
 */
export function getGenreContactTypeLabel(typeId) {
    const genreTypes = getProfileValue('promptFrames.contactTypes');
    
    if (genreTypes && genreTypes[typeId]) {
        // Genre provides override — merge with defaults for any missing fields
        const defaults = DEFAULT_CONTACT_TYPES[typeId] || DEFAULT_CONTACT_TYPES.unknown;
        return { ...defaults, ...genreTypes[typeId] };
    }
    
    return DEFAULT_CONTACT_TYPES[typeId] || DEFAULT_CONTACT_TYPES.unknown;
}

/**
 * Get all themed contact type labels
 * UI calls this for dropdowns, legends, etc.
 * 
 * @returns {object} { informant: { label, shortLabel, color }, ... }
 */
export function getGenreContactTypes() {
    const genreTypes = getProfileValue('promptFrames.contactTypes');
    const result = {};
    
    for (const typeId of Object.keys(DEFAULT_CONTACT_TYPES)) {
        result[typeId] = getGenreContactTypeLabel(typeId);
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER PROMPT FRAME (for AI generation)
// ═══════════════════════════════════════════════════════════════

/**
 * Get genre-specific framing for dossier generation prompts
 * Injected into the system prompt of buildDossierPrompt()
 * 
 * @returns {string} Genre frame string, or empty string if none
 */
export function getGenreDossierFrame() {
    return getProfileValue('promptFrames.contactDossier') || '';
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT DOSSIER VOICES (when no opinions exist yet)
// ═══════════════════════════════════════════════════════════════

/**
 * Get genre-appropriate default voices for dossier generation
 * Used when a contact has no voice opinions yet
 * 
 * Returns 3 skill IDs that make thematic sense for the genre:
 * - Noir: logic (analytical), inland_empire (intuitive), half_light (paranoid)
 * - Romance: empathy (emotional), drama (theatrical), suggestion (social)
 * - Fantasy: encyclopedia (lore), inland_empire (mystical), authority (power)
 * - Cyberpunk: interfacing (tech), visual_calculus (analytical), half_light (threat)
 * 
 * @returns {Array<{ voiceId: string, score: number, stance: string }>}
 */
export function getGenreDefaultDossierVoices() {
    const genreVoices = getProfileValue('promptFrames.defaultDossierVoices');
    const voiceIds = (Array.isArray(genreVoices) && genreVoices.length >= 3)
        ? genreVoices.slice(0, 3)
        : DEFAULT_DOSSIER_VOICES;
    
    return voiceIds.map(id => ({
        voiceId: id,
        score: 0,
        stance: 'neutral'
    }));
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK CONSENSUS (when AI generation fails)
// ═══════════════════════════════════════════════════════════════

/**
 * Get genre-themed fallback consensus text
 * Used when the dossier API call fails completely
 * 
 * @param {string} name - Contact's name
 * @param {string} disposition - Contact's disposition (trusted, neutral, etc.)
 * @returns {string} Themed fallback consensus
 */
export function getGenreFallbackConsensus(name, disposition = 'neutral') {
    const genreFallbacks = getProfileValue('promptFrames.contactFallbacks');
    
    if (genreFallbacks && typeof genreFallbacks[disposition] === 'function') {
        return genreFallbacks[disposition](name);
    }
    if (genreFallbacks && typeof genreFallbacks[disposition] === 'string') {
        return genreFallbacks[disposition].replace(/\{name\}/g, name);
    }
    
    const fallbackFn = DEFAULT_FALLBACK_CONSENSUS[disposition] || DEFAULT_FALLBACK_CONSENSUS.neutral;
    return fallbackFn(name);
}

// ═══════════════════════════════════════════════════════════════
// GENRE PROFILE REFERENCE
// ═══════════════════════════════════════════════════════════════
//
// Genre profiles should add these to their promptFrames:
//
// promptFrames: {
//     contactDossier: "Frame the assessment as a mystic reading of this person's 
//                      aura and fate-threads. The voices sense destiny, not evidence.",
//
//     contactTypes: {
//         informant:  { label: 'ALLY',        shortLabel: 'A' },
//         witness:    { label: 'BYSTANDER',   shortLabel: 'B' },
//         unknown:    { label: 'UNKNOWN',     shortLabel: '?' },
//         accomplice: { label: 'CONSPIRATOR', shortLabel: 'C' },
//         suspect:    { label: 'ADVERSARY',   shortLabel: 'X' }
//     },
//
//     defaultDossierVoices: ['encyclopedia', 'inland_empire', 'authority'],
//
//     contactFallbacks: {
//         trusted:    '{name}. The stars align around them — a kindred spirit.',
//         neutral:    '{name}. The runes reveal nothing yet. Patience.',
//         cautious:   '{name}. Something stirs in their shadow. Tread carefully.',
//         suspicious: '{name}. Dark threads connect them to something larger.',
//         hostile:    '{name}. Every ward flares red. This one means harm.'
//     }
// }
//
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    getGenreContactTypeLabel,
    getGenreContactTypes,
    getGenreDossierFrame,
    getGenreDefaultDossierVoices,
    getGenreFallbackConsensus
};
