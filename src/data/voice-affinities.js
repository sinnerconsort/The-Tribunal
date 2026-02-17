/**
 * The Tribunal - Voice Affinities
 * Maps each voice's personality to NPC trait preferences
 * 
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  PURE DATA FILE - NO IMPORTS - SAFE TO ADD WITHOUT BREAKING ANYTHING  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 * 
 * Deploy this FIRST, test voices still work, THEN add contact-intelligence.js
 */

// ═══════════════════════════════════════════════════════════════
// VOICE AFFINITIES
// Each voice has traits they like (+) and dislike (-)
// Score range: -3 (strong dislike) to +3 (strong like)
// ═══════════════════════════════════════════════════════════════

export const VOICE_AFFINITIES = {
    // ─────────────────────────────────────────────────────────────
    // INTELLECT
    // ─────────────────────────────────────────────────────────────
    logic: {
        name: 'Logic',
        likes: ['competent', 'honest', 'calm', 'clever'],
        dislikes: ['deceptive', 'mysterious', 'emotional'],
        weights: {
            competent: 2,
            honest: 2,
            clever: 3,
            deceptive: -3,
            mysterious: -1,
            emotional: -1
        }
    },
    
    encyclopedia: {
        name: 'Encyclopedia',
        likes: ['clever', 'mysterious', 'historical'],
        dislikes: ['ignorant', 'dismissive'],
        weights: {
            clever: 2,
            mysterious: 2,
            historical: 3,
            cop: 1,
            ignorant: -2,
            dismissive: -2
        }
    },
    
    rhetoric: {
        name: 'Rhetoric',
        likes: ['clever', 'charming', 'political'],
        dislikes: ['honest', 'simple', 'evasive'],
        weights: {
            clever: 2,
            charming: 2,
            political: 3,
            honest: -1,  // Too straightforward, no game
            evasive: -2,
            simple: -1
        }
    },
    
    drama: {
        name: 'Drama',
        likes: ['deceptive', 'charming', 'mysterious', 'theatrical'],
        dislikes: ['honest', 'boring', 'competent'],
        weights: {
            deceptive: 2,  // Respects the craft
            charming: 3,
            mysterious: 2,
            theatrical: 3,
            honest: -2,  // So tedious
            boring: -3,
            competent: -1  // Where's the DRAMA?
        }
    },
    
    conceptualization: {
        name: 'Conceptualization',
        likes: ['mysterious', 'creative', 'vulnerable', 'artistic'],
        dislikes: ['boring', 'cruel', 'practical'],
        weights: {
            mysterious: 2,
            creative: 3,
            vulnerable: 2,  // Broken things are beautiful
            artistic: 3,
            boring: -3,
            cruel: -2,
            practical: -1
        }
    },
    
    visual_calculus: {
        name: 'Visual Calculus',
        likes: ['competent', 'dangerous', 'strong', 'methodical'],
        dislikes: ['chaotic', 'clumsy'],
        weights: {
            competent: 2,
            dangerous: 2,
            strong: 1,
            methodical: 3,
            cop: 2,
            chaotic: -2,
            clumsy: -2
        }
    },
    
    // ─────────────────────────────────────────────────────────────
    // PSYCHE
    // ─────────────────────────────────────────────────────────────
    volition: {
        name: 'Volition',
        likes: ['honest', 'strong', 'kind', 'determined'],
        dislikes: ['deceptive', 'cruel', 'manipulative'],
        weights: {
            honest: 3,
            strong: 2,
            kind: 2,
            determined: 2,
            deceptive: -3,
            cruel: -3,
            manipulative: -2
        }
    },
    
    inland_empire: {
        name: 'Inland Empire',
        likes: ['mysterious', 'vulnerable', 'strange', 'haunted'],
        dislikes: ['boring', 'dismissive', 'skeptical'],
        weights: {
            mysterious: 3,
            vulnerable: 3,
            strange: 3,
            haunted: 3,
            boring: -2,
            dismissive: -3,
            skeptical: -2
        }
    },
    
    empathy: {
        name: 'Empathy',
        likes: ['kind', 'vulnerable', 'honest', 'wounded'],
        dislikes: ['cruel', 'cold', 'hostile'],
        weights: {
            kind: 3,
            vulnerable: 3,
            honest: 2,
            wounded: 2,
            cruel: -3,
            cold: -2,
            hostile: -2
        }
    },
    
    authority: {
        name: 'Authority',
        likes: ['strong', 'dangerous', 'cop', 'competent'],
        dislikes: ['weak', 'disrespectful', 'criminal'],
        weights: {
            strong: 3,
            dangerous: 2,
            cop: 3,
            competent: 2,
            weak: -2,
            disrespectful: -3,
            criminal: -2
        }
    },
    
    suggestion: {
        name: 'Suggestion',
        likes: ['charming', 'vulnerable', 'receptive', 'emotional'],
        dislikes: ['hostile', 'cold', 'guarded'],
        weights: {
            charming: 2,
            vulnerable: 2,
            receptive: 3,
            emotional: 2,
            hostile: -3,
            cold: -2,
            guarded: -2
        }
    },
    
    esprit_de_corps: {
        name: 'Esprit de Corps',
        likes: ['cop', 'competent', 'loyal', 'wounded'],
        dislikes: ['criminal', 'hostile', 'disloyal'],
        weights: {
            cop: 3,
            competent: 2,
            loyal: 3,
            wounded: 2,  // Fallen brothers
            criminal: -3,
            hostile: -2,
            disloyal: -3
        }
    },
    
    // ─────────────────────────────────────────────────────────────
    // PHYSIQUE
    // ─────────────────────────────────────────────────────────────
    endurance: {
        name: 'Endurance',
        likes: ['strong', 'determined', 'tough'],
        dislikes: ['weak', 'fragile'],
        weights: {
            strong: 3,
            determined: 2,
            tough: 3,
            weak: -2,
            fragile: -1
        }
    },
    
    pain_threshold: {
        name: 'Pain Threshold',
        likes: ['dangerous', 'wounded', 'strong'],
        dislikes: ['weak', 'cowardly'],
        weights: {
            dangerous: 2,
            wounded: 2,  // Knows what it costs
            strong: 2,
            weak: -2,
            cowardly: -2
        }
    },
    
    physical_instrument: {
        name: 'Physical Instrument',
        likes: ['strong', 'dangerous', 'tough', 'imposing'],
        dislikes: ['weak', 'small', 'cowardly'],
        weights: {
            strong: 3,
            dangerous: 2,
            tough: 2,
            imposing: 3,
            weak: -3,
            small: -1,
            cowardly: -2
        }
    },
    
    electrochemistry: {
        name: 'Electrochemistry',
        likes: ['charming', 'dangerous', 'fun', 'hedonistic'],
        dislikes: ['boring', 'judgmental', 'uptight'],
        weights: {
            charming: 3,
            dangerous: 2,
            fun: 3,
            hedonistic: 3,
            boring: -3,
            judgmental: -2,
            uptight: -2
        }
    },
    
    shivers: {
        name: 'Shivers',
        likes: ['mysterious', 'haunted', 'historical', 'local'],
        dislikes: ['outsider', 'destructive'],
        weights: {
            mysterious: 3,
            haunted: 3,
            historical: 2,
            local: 2,
            outsider: -1,
            destructive: -2
        }
    },
    
    half_light: {
        name: 'Half Light',
        likes: ['dangerous', 'hostile', 'threatening', 'criminal'],
        dislikes: ['kind', 'safe', 'boring'],
        weights: {
            dangerous: 3,
            hostile: 2,
            threatening: 3,
            criminal: 2,
            kind: -1,  // Suspects kindness
            safe: -2,
            boring: -2
        }
    },
    
    // ─────────────────────────────────────────────────────────────
    // MOTORICS
    // ─────────────────────────────────────────────────────────────
    hand_eye_coordination: {
        name: 'Hand/Eye Coordination',
        likes: ['competent', 'precise', 'skilled'],
        dislikes: ['clumsy', 'reckless'],
        weights: {
            competent: 2,
            precise: 3,
            skilled: 2,
            clumsy: -3,
            reckless: -1
        }
    },
    
    perception: {
        name: 'Perception',
        likes: ['mysterious', 'deceptive', 'hidden'],
        dislikes: ['obvious', 'boring'],
        weights: {
            mysterious: 2,
            deceptive: 2,  // Loves to catch liars
            hidden: 3,
            obvious: -2,
            boring: -1
        }
    },
    
    reaction_speed: {
        name: 'Reaction Speed',
        likes: ['dangerous', 'fast', 'threatening'],
        dislikes: ['slow', 'predictable'],
        weights: {
            dangerous: 3,
            fast: 3,
            threatening: 2,
            slow: -2,
            predictable: -1
        }
    },
    
    savoir_faire: {
        name: 'Savoir Faire',
        likes: ['charming', 'cool', 'stylish', 'dangerous'],
        dislikes: ['clumsy', 'boring', 'uptight'],
        weights: {
            charming: 2,
            cool: 3,
            stylish: 3,
            dangerous: 2,
            clumsy: -3,
            boring: -2,
            uptight: -2
        }
    },
    
    interfacing: {
        name: 'Interfacing',
        likes: ['competent', 'mechanical', 'clever', 'skilled'],
        dislikes: ['clumsy', 'destructive'],
        weights: {
            competent: 2,
            mechanical: 3,
            clever: 2,
            skilled: 2,
            clumsy: -2,
            destructive: -2
        }
    },
    
    composure: {
        name: 'Composure',
        likes: ['calm', 'cool', 'competent', 'controlled'],
        dislikes: ['emotional', 'chaotic', 'nervous'],
        weights: {
            calm: 3,
            cool: 3,
            competent: 2,
            controlled: 2,
            emotional: -2,
            chaotic: -2,
            nervous: -1
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Pure, no state access)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate a voice's initial opinion score based on detected traits
 * @param {string} voiceId - The voice/skill ID
 * @param {string[]} traits - Array of detected trait IDs
 * @returns {number} Score from -10 to +10
 */
export function calculateSeedScore(voiceId, traits = []) {
    const affinity = VOICE_AFFINITIES[voiceId];
    if (!affinity || !traits || traits.length === 0) return 0;
    
    let score = 0;
    
    for (const trait of traits) {
        const weight = affinity.weights?.[trait];
        if (weight !== undefined) {
            score += weight;
        }
    }
    
    // Clamp to -10 to +10
    return Math.max(-10, Math.min(10, score));
}

/**
 * Get voices that would have the strongest opinions about these traits
 * Returns both positive and negative - whoever cares most
 * @param {string[]} traits - Array of detected trait IDs
 * @param {number} count - How many to return
 * @returns {Array} [{ voiceId, score, name }]
 */
export function getVoicesWithStrongestOpinions(traits = [], count = 3) {
    if (!traits || traits.length === 0) return [];
    
    const scores = [];
    
    for (const [voiceId, affinity] of Object.entries(VOICE_AFFINITIES)) {
        const score = calculateSeedScore(voiceId, traits);
        if (score !== 0) {
            scores.push({
                voiceId,
                score,
                absScore: Math.abs(score),
                name: affinity.name
            });
        }
    }
    
    // Sort by absolute score (who cares most, positive or negative)
    scores.sort((a, b) => b.absScore - a.absScore);
    
    return scores.slice(0, count);
}

/**
 * Get all voices with positive opinions of these traits
 * @param {string[]} traits - Array of detected trait IDs
 * @returns {Array} [{ voiceId, score, name }]
 */
export function getVoicesWhoLike(traits = []) {
    return getVoicesWithStrongestOpinions(traits, 24)
        .filter(v => v.score > 0);
}

/**
 * Get all voices with negative opinions of these traits
 * @param {string[]} traits - Array of detected trait IDs
 * @returns {Array} [{ voiceId, score, name }]
 */
export function getVoicesWhoDislike(traits = []) {
    return getVoicesWithStrongestOpinions(traits, 24)
        .filter(v => v.score < 0);
}

/**
 * Get a specific voice's affinity data
 * @param {string} voiceId - The voice/skill ID
 * @returns {object|null} The affinity object or null
 */
export function getVoiceAffinity(voiceId) {
    return VOICE_AFFINITIES[voiceId] || null;
}

/**
 * Check if a voice likes a specific trait
 * @param {string} voiceId - The voice/skill ID
 * @param {string} trait - The trait ID
 * @returns {boolean}
 */
export function voiceLikesTrait(voiceId, trait) {
    const affinity = VOICE_AFFINITIES[voiceId];
    return affinity?.likes?.includes(trait) || false;
}

/**
 * Check if a voice dislikes a specific trait
 * @param {string} voiceId - The voice/skill ID
 * @param {string} trait - The trait ID
 * @returns {boolean}
 */
export function voiceDislikesTrait(voiceId, trait) {
    const affinity = VOICE_AFFINITIES[voiceId];
    return affinity?.dislikes?.includes(trait) || false;
}
