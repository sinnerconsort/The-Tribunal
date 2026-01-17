/**
 * src/data/statuses.js - STATUS_EFFECTS, COPOTYPE_IDS
 * Pure data - imports nothing
 */

export const STATUS_EFFECTS = {
    drunk: { name: 'Drunk', modifiers: { electrochemistry: 2, logic: -1 } },
    hungover: { name: 'Hungover', modifiers: { endurance: -2, volition: -1 } },
    caffeinated: { name: 'Caffeinated', modifiers: { perception: 1, composure: -1 } },
    wounded: { name: 'Wounded', modifiers: { painThreshold: -2, physicalInstrument: -1 } }
};

export const COPOTYPE_IDS = {
    sorry: 'sorry_cop',
    artCop: 'art_cop',
    boring: 'boring_cop',
    superstar: 'superstar_cop',
    hoboCop: 'hobo_cop',
    apocalypse: 'apocalypse_cop'
};
