/**
 * src/systems/thought-prompt-builder.js - Thought generation prompts
 * Imports from: core/
 */

import { getPlayerContext, getThemeCounters } from '../core/state.js';

export function buildThoughtSystemPrompt() {
    const player = getPlayerContext();
    return `You are generating a Disco Elysium-style thought for the player character${player.name ? ` named ${player.name}` : ''}.
Generate a thought that could be internalized - a recurring idea, obsession, or realization.
Format: Return JSON with { name, description, effect }`;
}

export function buildThoughtUserPrompt(concept, context) {
    return `Based on this concept: "${concept}"
Scene context: "${context?.message || 'general contemplation'}"
Generate a thought the character might develop.`;
}
