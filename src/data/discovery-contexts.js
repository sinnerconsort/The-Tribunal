/**
 * src/data/discovery-contexts.js - NARRATOR_CONTEXTS
 * Pure data - imports nothing
 */

export const NARRATOR_CONTEXTS = {
    crime_scene: { theme: 'investigation', mood: 'tense' },
    conversation: { theme: 'social', mood: 'varied' },
    internal: { theme: 'reflection', mood: 'contemplative' }
};

export function getObjectIcon(type) {
    const icons = { person: '👤', place: '📍', thing: '📦', idea: '💭' };
    return icons[type] || '❓';
}
