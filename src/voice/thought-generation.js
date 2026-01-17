/**
 * src/voice/thought-generation.js - Thought generation
 * Imports from: systems/, core/, voice/
 */

import { buildThoughtSystemPrompt, buildThoughtUserPrompt } from '../systems/thought-prompt-builder.js';
import { addDiscoveredThought, saveState } from '../core/state.js';
import { callAPI } from './api-helpers.js';

export async function generateThought(concept, context, getContext) {
    const systemPrompt = buildThoughtSystemPrompt();
    const userPrompt = buildThoughtUserPrompt(concept, context);
    
    const response = await callAPI(systemPrompt, userPrompt, getContext);
    
    try {
        const thought = JSON.parse(response);
        thought.id = `thought_${Date.now()}`;
        thought.discoveredAt = Date.now();
        
        addDiscoveredThought(thought);
        saveState(typeof getContext === 'function' ? getContext() : getContext);
        
        return thought;
    } catch (e) {
        // If not valid JSON, create basic thought
        return {
            id: `thought_${Date.now()}`,
            name: concept,
            description: response,
            effect: null,
            discoveredAt: Date.now()
        };
    }
}
