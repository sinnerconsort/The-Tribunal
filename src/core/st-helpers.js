/**
 * The Tribunal - SillyTavern Helpers
 * Context access and FAB state management
 */

import { extensionSettings } from './state.js';

// SillyTavern context reference (cached)
let stContext = null;

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN INTEGRATION
// ═══════════════════════════════════════════════════════════════

export function getContext() {
    if (stContext) return stContext;
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        stContext = SillyTavern.getContext();
    }
    return stContext;
}

export function getLastMessage() {
    const context = getContext();
    if (!context?.chat?.length) return null;
    return context.chat[context.chat.length - 1];
}

export function getChatContainer() {
    return document.getElementById('chat');
}

// ═══════════════════════════════════════════════════════════════
// FAB VISIBILITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Updates the visibility and state of both FABs based on settings.
 * - Main FAB: Hidden when extension is disabled
 * - Investigation FAB: Hidden when extension is disabled OR when showInvestigationFab is false
 */
export function updateFABState() {
    const fab = document.getElementById('inland-empire-fab');
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    // Main FAB visibility
    if (fab) {
        if (extensionSettings.enabled) {
            fab.style.display = 'flex';
            fab.classList.remove('ie-fab-disabled');
            fab.title = 'Open Psyche Panel';
        } else {
            // Hide completely instead of just dimming
            fab.style.display = 'none';
            fab.classList.add('ie-fab-disabled');
            fab.title = 'The Tribunal (Disabled)';
        }
    }
    
    // Investigation FAB visibility - controlled by both enabled AND showInvestigationFab
    if (thoughtFab) {
        if (extensionSettings.enabled && extensionSettings.showInvestigationFab !== false) {
            thoughtFab.style.display = 'flex';
            thoughtFab.classList.remove('ie-thought-fab-disabled');
        } else {
            thoughtFab.style.display = 'none';
            thoughtFab.classList.add('ie-thought-fab-disabled');
        }
    }
}

/**
 * Updates just the Investigation FAB visibility (for settings toggle)
 */
export function updateInvestigationFABVisibility() {
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    if (thoughtFab) {
        // Only show if BOTH extension is enabled AND setting allows it
        if (extensionSettings.enabled && extensionSettings.showInvestigationFab !== false) {
            thoughtFab.style.display = 'flex';
            thoughtFab.classList.remove('ie-thought-fab-disabled');
        } else {
            thoughtFab.style.display = 'none';
            thoughtFab.classList.add('ie-thought-fab-disabled');
        }
    }
}
