/**
 * The Tribunal - Contacts Data Definitions
 * Pure data - NO IMPORTS - safe to add without breaking anything
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
        relationship: overrides.relationship || '',
        notes: overrides.notes || '',
        disposition: overrides.disposition || 'neutral',
        // Auto-derived, but can be overridden
        type: overrides.type || getTypeFromDisposition(overrides.disposition || 'neutral'),
        // Metadata
        createdAt: overrides.createdAt || Date.now(),
        lastModified: overrides.lastModified || Date.now(),
        // For contact intelligence (Phase 2+)
        voiceOpinions: overrides.voiceOpinions || {},
        detectedTraits: overrides.detectedTraits || [],
        manuallyEdited: overrides.manuallyEdited || false,
        ...overrides
    };
}
