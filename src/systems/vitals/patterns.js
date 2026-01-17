/**
 * src/systems/vitals/patterns.js - Keyword dictionaries
 * Pure data - imports nothing
 */

export const HEALTH_DAMAGE_KEYWORDS = [
    'punch', 'hit', 'wound', 'stab', 'shot', 'hurt', 'bleed', 'pain', 'injury'
];

export const HEALTH_HEAL_KEYWORDS = [
    'heal', 'bandage', 'medicine', 'recover', 'rest'
];

export const MORALE_DAMAGE_KEYWORDS = [
    'despair', 'hopeless', 'shame', 'guilt', 'humiliate', 'reject', 'abandon'
];

export const MORALE_HEAL_KEYWORDS = [
    'encourage', 'hope', 'comfort', 'praise', 'support', 'proud'
];

export const SEVERITY_VALUES = {
    minor: 1,
    moderate: 2,
    major: 3,
    critical: 4
};
