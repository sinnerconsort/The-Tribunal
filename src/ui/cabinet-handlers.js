/**
 * Thought Cabinet UI Handlers
 * Extracted from index.js for maintainability
 * Bridges UI actions to cabinet.js system functions
 */

import { THOUGHTS } from '../data/thoughts.js';
import { thoughtCabinet, saveState } from '../core/state.js';
import {
    checkThoughtDiscovery,
    startResearch,
    abandonResearch,
    dismissThought,
    forgetThought,
    getThought
} from '../systems/cabinet.js';
import { showToast, showDiscoveryToast } from './toasts.js';

// ═══════════════════════════════════════════════════════════════
// RESEARCH HANDLERS
// ═══════════════════════════════════════════════════════════════

export function handleStartResearch(thoughtId, getContext, refreshCabinetTab) {
    // Get thought name for toast (from THOUGHTS or custom)
    const thought = getThought(thoughtId);
    const thoughtName = thought?.name || thoughtId;
    
    // startResearch returns: true (success), false (not found/slots full), or { error: 'cap_reached' }
    const result = startResearch(thoughtId, getContext());
    
    if (result === true) {
        saveState(getContext());
        refreshCabinetTab();
        showToast(`Researching: ${thoughtName}`, 'info');
    } else if (result && result.error === 'cap_reached') {
        showToast('Cannot research: Internalized thoughts at maximum (5/5)', 'error');
    } else {
        showToast('Cannot research this thought', 'error');
    }
}

export function handleAbandonResearch(thoughtId, getContext, refreshCabinetTab) {
    abandonResearch(thoughtId, getContext());
    saveState(getContext());
    refreshCabinetTab();
    showToast('Research abandoned', 'info');
}

export function handleDismissThought(thoughtId, getContext, refreshCabinetTab) {
    dismissThought(thoughtId, getContext());
    saveState(getContext());
    refreshCabinetTab();
}

export function handleForgetThought(thoughtId, getContext, refreshCabinetTab) {
    forgetThought(thoughtId, getContext());
    saveState(getContext());
    refreshCabinetTab();
    showToast('Thought forgotten', 'info');
}

// ═══════════════════════════════════════════════════════════════
// AUTO DISCOVERY
// ═══════════════════════════════════════════════════════════════

let isAutoGenerating = false;

export async function handleAutoThoughtGeneration(getContext, refreshCabinetTab, handleStartResearchBound, handleDismissThoughtBound) {
    if (isAutoGenerating) return;
    
    isAutoGenerating = true;
    
    try {
        // checkThoughtDiscovery returns array of newly discovered thoughts
        const newThoughts = checkThoughtDiscovery();
        
        if (newThoughts && newThoughts.length > 0) {
            // Show discovery toast for each new thought
            for (const thought of newThoughts) {
                showDiscoveryToast(thought, handleStartResearchBound, handleDismissThoughtBound);
            }
            refreshCabinetTab();
        }
    } catch (error) {
        console.error('[The Tribunal] Auto thought generation failed:', error);
    } finally {
        isAutoGenerating = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FOR BOUND HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Creates bound handler functions for use in index.js
 * This avoids circular dependencies while keeping handlers testable
 */
export function createCabinetHandlers(getContext, refreshCabinetTab) {
    const handlers = {
        onResearch: (thoughtId) => handleStartResearch(thoughtId, getContext, refreshCabinetTab),
        onAbandon: (thoughtId) => handleAbandonResearch(thoughtId, getContext, refreshCabinetTab),
        onDismiss: (thoughtId) => handleDismissThought(thoughtId, getContext, refreshCabinetTab),
        onForget: (thoughtId) => handleForgetThought(thoughtId, getContext, refreshCabinetTab)
    };
    
    return handlers;
}
