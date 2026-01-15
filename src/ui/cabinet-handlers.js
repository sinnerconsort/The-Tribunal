/**
 * Thought Cabinet UI Handlers
 * Extracted from index.js for maintainability
 * Bridges UI actions to cabinet.js system functions
 */

import { THOUGHTS } from '../data/thoughts.js';
import { saveState } from '../core/state.js';
import {
    checkThoughtDiscovery,
    startResearch,
    abandonResearch,
    dismissThought,
    forgetThought
} from '../systems/cabinet.js';
import { showToast, showDiscoveryToast } from './toasts.js';

// ═══════════════════════════════════════════════════════════════
// RESEARCH HANDLERS
// ═══════════════════════════════════════════════════════════════

export function handleStartResearch(thoughtId, getContext, refreshCabinetTab) {
    const result = startResearch(thoughtId, THOUGHTS);
    if (result.success) {
        saveState(getContext());
        refreshCabinetTab();
        showToast(`Researching: ${THOUGHTS[thoughtId]?.name || thoughtId}`, 'info');
    } else {
        showToast(result.reason || 'Cannot research this thought', 'error');
    }
}

export function handleAbandonResearch(thoughtId, getContext, refreshCabinetTab) {
    abandonResearch(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Research abandoned', 'info');
}

export function handleDismissThought(thoughtId, getContext, refreshCabinetTab) {
    dismissThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
}

export function handleForgetThought(thoughtId, getContext, refreshCabinetTab) {
    forgetThought(thoughtId);
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
        const thought = checkThoughtDiscovery(THOUGHTS);
        if (thought) {
            showDiscoveryToast(thought, handleStartResearchBound, handleDismissThoughtBound);
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
