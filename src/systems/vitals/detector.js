/**
 * src/systems/vitals/detector.js - Text analysis
 * Imports from: patterns.js
 */

import { 
    HEALTH_DAMAGE_KEYWORDS, HEALTH_HEAL_KEYWORDS,
    MORALE_DAMAGE_KEYWORDS, MORALE_HEAL_KEYWORDS,
    SEVERITY_VALUES 
} from './patterns.js';

export function mightContainVitalsContent(text) {
    const lower = text.toLowerCase();
    const allKeywords = [
        ...HEALTH_DAMAGE_KEYWORDS, ...HEALTH_HEAL_KEYWORDS,
        ...MORALE_DAMAGE_KEYWORDS, ...MORALE_HEAL_KEYWORDS
    ];
    return allKeywords.some(k => lower.includes(k));
}

export function detectVitalsChanges(text) {
    const lower = text.toLowerCase();
    let healthDelta = 0;
    let moraleDelta = 0;
    
    HEALTH_DAMAGE_KEYWORDS.forEach(k => { if (lower.includes(k)) healthDelta -= 1; });
    HEALTH_HEAL_KEYWORDS.forEach(k => { if (lower.includes(k)) healthDelta += 1; });
    MORALE_DAMAGE_KEYWORDS.forEach(k => { if (lower.includes(k)) moraleDelta -= 1; });
    MORALE_HEAL_KEYWORDS.forEach(k => { if (lower.includes(k)) moraleDelta += 1; });
    
    return { healthDelta, moraleDelta };
}
