/**
 * src/data/relationships.js - CASCADE_RULES, SKILL_DYNAMICS
 * Pure data - imports nothing
 */

export const CASCADE_RULES = {
    logic: { rivals: ['inlandEmpire'], allies: ['encyclopedia'] },
    inlandEmpire: { rivals: ['logic'], allies: ['shivers'] },
    authority: { rivals: ['empathy'], allies: ['physicalInstrument'] },
    empathy: { rivals: ['authority'], allies: ['suggestion'] }
};

export const SKILL_NICKNAMES = {
    logic: ['Detective', 'The Brain'],
    inlandEmpire: ['The Dreamer', 'Weird One'],
    electrochemistry: ['Party Animal', 'Hedonist']
};
