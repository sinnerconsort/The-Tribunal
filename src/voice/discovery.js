/**
 * src/voice/discovery.js - Investigation system
 * Imports from: data/, core/, voice/
 */

import { NARRATOR_CONTEXTS } from '../data/discovery-contexts.js';
import { discoveryContext, saveState } from '../core/state.js';
import { callAPI } from './api-helpers.js';

export async function investigateObject(object, context, getContext) {
    const systemPrompt = `You are a narrator in a Disco Elysium-style investigation.
Describe what the detective discovers when examining: ${object.name}
Be evocative, mysterious, and hint at deeper meaning.`;

    const userPrompt = `The detective examines: ${object.description || object.name}`;
    
    const response = await callAPI(systemPrompt, userPrompt, getContext);
    
    discoveryContext.investigationCount++;
    saveState(typeof getContext === 'function' ? getContext() : getContext);
    
    return {
        object,
        discovery: response,
        narrator: selectNarrator(object)
    };
}

function selectNarrator(object) {
    // Simple narrator selection
    return 'inlandEmpire';
}

export function getInvestigationCount() {
    return discoveryContext.investigationCount;
}
