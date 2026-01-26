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
 * @param {object} overrides - Properties to override
 * @returns {object} New contact object
 */
export function createContact(overrides = {}) {
    return {
        id: overrides.id || `contact_${Date.now()}`,
        name: overrides.name || 'Unknown',
        
        // User-provided context (replaces 'relationship' as primary field)
        context: overrides.context || '',
        
        // Legacy field - still supported for edit modal
        relationship: overrides.relationship || '',
        notes: overrides.notes || '',
        
        // Disposition (starts neutral, voices suggest changes)
        disposition: overrides.disposition || 'neutral',
        
        // Auto-derived type, but can be overridden
        type: overrides.type || getTypeFromDisposition(overrides.disposition || 'neutral'),
        
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
        
        // For contact intelligence (voice opinion tracking)
        voiceOpinions: overrides.voiceOpinions || {},
        /* voiceOpinions structure:
        {
            'logic': { score: 3, lastQuote: "His alibi checks out.", timestamp: ... },
            'half_light': { score: -5, lastQuote: "Something's wrong.", timestamp: ... }
        }
        */
        
        // Detected traits from chat scanning
        detectedTraits: overrides.detectedTraits || [],
        
        // Was this manually edited? (suppresses auto-disposition suggestions)
        manuallyEdited: overrides.manuallyEdited || false,
        
        // Spread any additional overrides
        ...overrides
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
