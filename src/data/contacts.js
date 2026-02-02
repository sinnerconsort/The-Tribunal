/**
 * The Tribunal - Contacts Data Definitions
 * Pure data - NO IMPORTS - safe to add without breaking anything
 * 
 * Updated: Added context field, dossier structure
 */

// ═══════════════════════════════════════════════════════════════
// CONTACT TYPES (Detective flavor, auto-derived from disposition)
// ═══════════════════════════════════════════════════════════════

export const CONTACT_TYPES = {
    informant: {
        id: 'informant',
        label: 'INFORMANT',
        shortLabel: 'I',
        color: '#4a9f4a',
        description: 'Someone who feeds you information'
    },
    witness: {
        id: 'witness', 
        label: 'WITNESS',
        shortLabel: 'W',
        color: '#7a7a4a',
        description: 'Someone who saw something'
    },
    unknown: {
        id: 'unknown',
        label: 'UNKNOWN',
        shortLabel: '?',
        color: '#6a6a6a',
        description: 'Role unclear'
    },
    accomplice: {
        id: 'accomplice',
        label: 'ACCOMPLICE', 
        shortLabel: 'A',
        color: '#9f7a4a',
        description: 'Possibly involved'
    },
    suspect: {
        id: 'suspect',
        label: 'SUSPECT',
        shortLabel: 'S',
        color: '#9f4a4a',
        description: 'Person of interest'
    }
};

// ═══════════════════════════════════════════════════════════════
// CONTACT DISPOSITIONS (How YOU feel about them)
// ═══════════════════════════════════════════════════════════════

export const CONTACT_DISPOSITIONS = {
    trusted: {
        id: 'trusted',
        label: 'Trusted',
        color: '#4a9f4a',
        borderColor: '#3d8b3d',
        score: 20
    },
    neutral: {
        id: 'neutral',
        label: 'Neutral',
        color: '#7a7a7a',
        borderColor: '#6a6a6a', 
        score: 10
    },
    cautious: {
        id: 'cautious',
        label: 'Cautious',
        color: '#9f9f4a',
        borderColor: '#8b8b3d',
        score: 0
    },
    suspicious: {
        id: 'suspicious',
        label: 'Suspicious',
        color: '#9f7a4a',
        borderColor: '#8b6a3d',
        score: -10
    },
    hostile: {
        id: 'hostile',
        label: 'Hostile',
        color: '#9f4a4a',
        borderColor: '#8b3d3d',
        score: -20
    }
};

// ═══════════════════════════════════════════════════════════════
// DISPOSITION → TYPE MAPPING
// ═══════════════════════════════════════════════════════════════

const DISPOSITION_TO_TYPE = {
    trusted: 'informant',
    neutral: 'unknown',
    cautious: 'witness', 
    suspicious: 'accomplice',
    hostile: 'suspect'
};

// ═══════════════════════════════════════════════════════════════
// BASELINE OPINION SEEDING
// Gives voices immediate differentiated reactions to new contacts
// ═══════════════════════════════════════════════════════════════

/**
 * Base opinion score from contact's disposition
 * Represents "how should voices generally feel about this person?"
 */
const DISPOSITION_BASELINE = {
    trusted: 5,
    neutral: 0,
    cautious: -2,
    suspicious: -4,
    hostile: -6
};

/**
 * Per-skill temperament variance
 * Represents each skill's natural bias when meeting people
 * Positive = trusting/warm, Negative = suspicious/guarded
 */
const SKILL_TEMPERAMENT = {
    // INTELLECT - Generally analytical, neutral
    logic: 0,
    encyclopedia: 0,
    rhetoric: 1,           // Likes people (needs audience)
    drama: 1,              // Theatrical, drawn to interesting people
    conceptualization: 0,
    visual_calculus: 0,
    
    // PSYCHE - Varied, personality-driven
    volition: 0,
    inland_empire: 0,      // Vibes-based, seeded randomly below
    empathy: 2,            // Sees the best in people
    authority: -1,         // Skeptical, needs to be convinced
    esprit_de_corps: 1,    // Team player, loyal
    suggestion: 1,         // Charming, assumes others are too
    
    // PHYSIQUE - Instinct-driven
    endurance: 0,
    pain_threshold: 0,
    physical_instrument: 0,
    electrochemistry: 2,   // Loves everyone (party friend)
    shivers: 0,            // City speaks, not people
    half_light: -2,        // Paranoid, fight-or-flight
    
    // MOTORICS - Observational
    hand_eye_coordination: 0,
    perception: 0,
    reaction_speed: -1,    // Twitchy, on guard
    savoir_faire: 1,       // Cool with everyone
    interfacing: 0,
    composure: 0
};

/**
 * Skills that get random variance (chaotic personalities)
 */
const CHAOTIC_SKILLS = ['inland_empire', 'electrochemistry', 'shivers'];

/**
 * Generate baseline voice opinions for a new contact
 * @param {string} disposition - Contact's disposition (trusted, neutral, etc.)
 * @returns {object} Seeded voiceOpinions object
 */
export function seedVoiceOpinions(disposition) {
    const baseline = DISPOSITION_BASELINE[disposition] ?? 0;
    const opinions = {};
    
    for (const [skillId, temperament] of Object.entries(SKILL_TEMPERAMENT)) {
        let score = baseline + temperament;
        
        // Chaotic skills get extra random variance (-2 to +2)
        if (CHAOTIC_SKILLS.includes(skillId)) {
            score += Math.floor(Math.random() * 5) - 2;
        }
        
        // Clamp to valid range (-10 to +10)
        score = Math.max(-10, Math.min(10, score));
        
        // Only store non-zero opinions (sparse storage)
        if (score !== 0) {
            opinions[skillId] = {
                score,
                source: 'baseline',
                timestamp: Date.now()
            };
        }
    }
    
    return opinions;
}

/**
 * Reseed opinions when disposition changes significantly
 * Blends existing opinions with new baseline (doesn't wipe history)
 * @param {object} existingOpinions - Current voiceOpinions
 * @param {string} oldDisposition - Previous disposition
 * @param {string} newDisposition - New disposition  
 * @returns {object} Updated voiceOpinions
 */
export function reseedOnDispositionChange(existingOpinions, oldDisposition, newDisposition) {
    const oldBaseline = DISPOSITION_BASELINE[oldDisposition] ?? 0;
    const newBaseline = DISPOSITION_BASELINE[newDisposition] ?? 0;
    const shift = newBaseline - oldBaseline;
    
    // If no significant shift, keep existing
    if (Math.abs(shift) < 2) {
        return existingOpinions;
    }
    
    const updated = { ...existingOpinions };
    
    for (const [skillId, data] of Object.entries(updated)) {
        // Shift existing scores toward new baseline
        const newScore = Math.max(-10, Math.min(10, data.score + Math.round(shift * 0.5)));
        updated[skillId] = {
            ...data,
            score: newScore,
            lastShift: Date.now()
        };
    }
    
    // Add any skills that didn't have opinions yet
    const freshSeed = seedVoiceOpinions(newDisposition);
    for (const [skillId, data] of Object.entries(freshSeed)) {
        if (!updated[skillId]) {
            updated[skillId] = data;
        }
    }
    
    return updated;
}

/**
 * Get contact type based on disposition
 * @param {string} disposition - The disposition ID
 * @returns {string} The type ID
 */
export function getTypeFromDisposition(disposition) {
    return DISPOSITION_TO_TYPE[disposition] || 'unknown';
}

/**
 * Get full type object from disposition
 * @param {string} disposition - The disposition ID
 * @returns {object} The type definition
 */
export function getTypeObjectFromDisposition(disposition) {
    const typeId = getTypeFromDisposition(disposition);
    return CONTACT_TYPES[typeId] || CONTACT_TYPES.unknown;
}

/**
 * Get disposition object by ID
 * @param {string} dispositionId - The disposition ID
 * @returns {object} The disposition definition
 */
export function getDisposition(dispositionId) {
    return CONTACT_DISPOSITIONS[dispositionId] || CONTACT_DISPOSITIONS.neutral;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONTACT TEMPLATE
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new contact object with defaults
 * Automatically seeds voice opinions based on disposition
 * @param {object} overrides - Properties to override
 * @returns {object} New contact object
 */
export function createContact(overrides = {}) {
    const disposition = overrides.disposition || 'neutral';
    
    // Seed voice opinions unless explicitly provided
    const seededOpinions = overrides.voiceOpinions || seedVoiceOpinions(disposition);
    
    return {
        id: overrides.id || `contact_${Date.now()}`,
        name: overrides.name || 'Unknown',
        
        // User-provided context (replaces 'relationship' as primary field)
        context: overrides.context || '',
        
        // Legacy field - still supported for edit modal
        relationship: overrides.relationship || '',
        notes: overrides.notes || '',
        
        // Disposition (starts neutral, voices suggest changes)
        disposition: disposition,
        
        // Auto-derived type, but can be overridden
        type: overrides.type || getTypeFromDisposition(disposition),
        
        // AI-generated dossier content
        dossier: overrides.dossier || null,
        /* dossier structure when populated:
        {
            consensus: "A tall man with tired eyes...",
            voiceQuips: [
                { voiceId: 'logic', voiceName: 'LOGIC', text: "The math doesn't add up..." },
                { voiceId: 'inland_empire', voiceName: 'INLAND EMPIRE', text: "He carries old ghosts..." },
                { voiceId: 'half_light', voiceName: 'HALF LIGHT', text: "Don't turn your back on him." }
            ],
            generatedAt: 1737900000000,
            basedOnDisposition: 'neutral'
        }
        */
        
        // Metadata
        createdAt: overrides.createdAt || Date.now(),
        lastModified: overrides.lastModified || Date.now(),
        
        // Voice opinions - NOW SEEDED with baseline
        voiceOpinions: seededOpinions,
        /* voiceOpinions structure:
        {
            'logic': { score: 3, source: 'baseline', timestamp: ... },
            'half_light': { score: -5, source: 'chat', lastQuote: "Something's wrong.", timestamp: ... }
        }
        */
        
        // Detected traits from chat scanning
        detectedTraits: overrides.detectedTraits || [],
        
        // Was this manually edited? (suppresses auto-disposition suggestions)
        manuallyEdited: overrides.manuallyEdited || false,
        
        // Spread any additional overrides
        ...overrides,
        
        // Ensure voiceOpinions isn't overwritten by spread if we seeded it
        voiceOpinions: overrides.voiceOpinions || seededOpinions
    };
}

// ═══════════════════════════════════════════════════════════════
// DOSSIER HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a voice quip object
 * @param {string} voiceId - The voice/skill ID
 * @param {string} voiceName - Display name for the voice
 * @param {string} text - The quip text
 * @returns {object} Voice quip object
 */
export function createVoiceQuip(voiceId, voiceName, text) {
    return {
        voiceId,
        voiceName: voiceName.toUpperCase(),
        text
    };
}

/**
 * Create a dossier object
 * @param {string} consensus - The main description
 * @param {array} voiceQuips - Array of voice quip objects
 * @param {string} basedOnDisposition - What disposition was active when generated
 * @returns {object} Dossier object
 */
export function createDossier(consensus, voiceQuips = [], basedOnDisposition = 'neutral') {
    return {
        consensus,
        voiceQuips,
        generatedAt: Date.now(),
        basedOnDisposition
    };
}

/**
 * Check if a contact's dossier should be regenerated
 * (e.g., disposition changed significantly since generation)
 * @param {object} contact - The contact object
 * @returns {boolean} Whether regeneration is suggested
 */
export function shouldRegenerateDossier(contact) {
    if (!contact.dossier) return true;
    
    // If disposition changed from what the dossier was based on
    if (contact.dossier.basedOnDisposition !== contact.disposition) {
        return true;
    }
    
    return false;
}
