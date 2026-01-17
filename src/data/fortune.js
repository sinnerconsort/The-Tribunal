/**
 * src/data/fortune.js - LEDGER_PERSONALITIES, FORTUNE_PROMPTS
 * Pure data - imports nothing
 */

export const LEDGER_PERSONALITIES = {
    cryptic: 'Speaks in riddles and metaphors',
    direct: 'Blunt and to the point',
    poetic: 'Everything is verse'
};

export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 0 && hour < 5;
}
