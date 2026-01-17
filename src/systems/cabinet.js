/**
 * src/systems/cabinet.js - Thought cabinet logic
 * Imports from: core/
 */

import { thoughtCabinet, saveState } from '../core/state.js';

export function startResearch(thoughtId, context) {
    const thought = thoughtCabinet.discovered.find(t => t.id === thoughtId);
    if (!thought) return false;
    
    thoughtCabinet.researching[thoughtId] = {
        thought,
        startedAt: Date.now(),
        progress: 0
    };
    
    thoughtCabinet.discovered = thoughtCabinet.discovered.filter(t => t.id !== thoughtId);
    saveState(context);
    return true;
}

export function completeResearch(thoughtId, context) {
    const research = thoughtCabinet.researching[thoughtId];
    if (!research) return false;
    
    thoughtCabinet.internalized.push(research.thought);
    delete thoughtCabinet.researching[thoughtId];
    saveState(context);
    return true;
}

export function getResearchPenalties() {
    // Returns skill penalties from researching thoughts
    return {};
}
