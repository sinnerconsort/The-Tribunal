/**
 * The Tribunal - Secret Compartment Unlock System
 * 
 * The secret tab in the ledger starts completely hidden.
 * It reveals itself through late night use (10pm - 3am IRL).
 * 
 * UNLOCK PROGRESSION:
 * - Session 1: Faint hint toast, tab invisible
 * - Session 2: Stronger hint toast, tab ghosts in (barely visible)
 * - Session 3: Final reveal toast with apricot, tab fully visible
 * 
 * STATE TRACKING:
 * - lateNightSessions: count of qualifying sessions
 * - lastSessionDate: prevent multiple counts per night
 * - crackStage: 0 (hidden) → 1 (hint) → 2 (ghosting) → 3 (revealed)
 * - isRevealed: permanent flag once unlocked
 */

import { getChatState, saveChatState } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Check if current time is late night (10pm - 3am)
 */
export function isLateNight() {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 3;
}

/**
 * Get today's date as YYYY-MM-DD string
 * (for tracking "one session per night")
 */
function getTodayKey() {
    const now = new Date();
    // If it's between midnight and 3am, count as previous day
    if (now.getHours() < 3) {
        now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get compartment state from chat state
 */
function getCompartmentState() {
    const state = getChatState();
    if (!state) return null;
    
    if (!state.compartment) {
        state.compartment = {
            lateNightSessions: 0,
            lastSessionDate: null,
            crackStage: 0,
            isRevealed: false
        };
    }
    
    return state.compartment;
}

/**
 * Save compartment state
 */
function saveCompartmentState(compartmentState) {
    const state = getChatState();
    if (!state) return;
    
    state.compartment = compartmentState;
    saveChatState();
}

/**
 * Get current crack stage (0-3)
 */
export function getCrackStage() {
    const comp = getCompartmentState();
    return comp?.crackStage || 0;
}

/**
 * Check if compartment is fully revealed
 */
export function isCompartmentRevealed() {
    const comp = getCompartmentState();
    return comp?.isRevealed || false;
}

// ═══════════════════════════════════════════════════════════════
// HINT MESSAGES
// ═══════════════════════════════════════════════════════════════

const HINT_MESSAGES = {
    // Stage 1 hints - very subtle
    stage1: [
        { title: "PERCEPTION", message: "There's a smell. Faint. Familiar. Gone now." },
        { title: "INLAND EMPIRE", message: "The ledger feels... heavier tonight. Pregnant with something." },
        { title: "INTERFACING", message: "Your fingers find a seam in the binding. Was that always there?" }
    ],
    
    // Stage 2 hints - building
    stage2: [
        { title: "PERCEPTION (SMELL)", message: "Apricot. Definitely apricot. But from where?" },
        { title: "INLAND EMPIRE", message: "The ledger is hiding something. It wants to tell you. Not yet." },
        { title: "SHIVERS", message: "The binding loosens in the dark hours. Like it's breathing." }
    ],
    
    // Stage 3 - the reveal
    reveal: {
        title: "SOMETHING SHIFTS",
        message: "A smell. Apricot. The binding gives way to your fingers.\n\nThere was always a compartment here. You just couldn't see it."
    }
};

// ═══════════════════════════════════════════════════════════════
// TOAST DISPLAY
// ═══════════════════════════════════════════════════════════════

/**
 * Show a compartment hint toast
 */
function showHintToast(stage) {
    // Get random hint for this stage
    const hints = HINT_MESSAGES[`stage${stage}`];
    if (!hints) return;
    
    const hint = hints[Math.floor(Math.random() * hints.length)];
    
    // Try to use the extension's toast system
    if (window.tribunalToast) {
        window.tribunalToast({
            type: 'compartment-hint',
            title: hint.title,
            message: hint.message,
            duration: 6000
        });
    } else {
        // Fallback to creating our own
        showCustomToast(hint.title, hint.message, 'ie-toast-compartment-hint');
    }
    
    console.log(`[Compartment] Stage ${stage} hint shown:`, hint.title);
}

/**
 * Show the final reveal toast
 */
function showRevealToast() {
    const reveal = HINT_MESSAGES.reveal;
    
    if (window.tribunalToast) {
        window.tribunalToast({
            type: 'compartment-reveal',
            title: reveal.title,
            message: reveal.message,
            duration: 10000
        });
    } else {
        showCustomToast(reveal.title, reveal.message, 'ie-toast-compartment-reveal');
    }
    
    console.log('[Compartment] REVEALED!');
}

/**
 * Fallback toast creator
 */
function showCustomToast(title, message, cssClass) {
    // Find or create toast container
    let container = document.querySelector('.ie-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'ie-toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `ie-toast ${cssClass} ie-toast-enter`;
    toast.innerHTML = `
        <div class="ie-toast-content">
            <div class="ie-toast-text">
                <div class="ie-toast-title">${title}</div>
                <div class="ie-toast-message">${message.replace(/\n/g, '<br>')}</div>
            </div>
        </div>
        <button class="ie-toast-dismiss">×</button>
    `;
    
    // Dismiss on click
    toast.querySelector('.ie-toast-dismiss').addEventListener('click', () => {
        toast.classList.remove('ie-toast-enter');
        toast.classList.add('ie-toast-exit');
        setTimeout(() => toast.remove(), 400);
    });
    
    container.appendChild(toast);
    
    // Auto dismiss
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('ie-toast-enter');
            toast.classList.add('ie-toast-exit');
            setTimeout(() => toast.remove(), 400);
        }
    }, 8000);
}

// ═══════════════════════════════════════════════════════════════
// TAB VISIBILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Update the secret tab's visual state based on crack stage
 */
export function updateTabVisibility(stage = null) {
    const tab = document.querySelector('.ledger-subtab-secret');
    if (!tab) return;
    
    if (stage === null) {
        stage = getCrackStage();
    }
    
    // Remove all state classes
    tab.classList.remove('cracking', 'revealed');
    
    switch (stage) {
        case 0:
            // Completely hidden (default CSS handles this)
            break;
        case 1:
            // Still hidden, but we've started the process
            // No visual change yet - just hints
            break;
        case 2:
            // Ghosting in - barely visible
            tab.classList.add('cracking');
            break;
        case 3:
            // Fully revealed
            tab.classList.add('revealed');
            break;
    }
    
    console.log(`[Compartment] Tab visibility updated to stage ${stage}`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN CHECK FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Check if we should progress the compartment unlock
 * Call this when the panel is opened or periodically
 * 
 * @returns {boolean} True if progression happened
 */
export function checkCompartmentProgression() {
    const comp = getCompartmentState();
    if (!comp) return false;
    
    // Already fully revealed - nothing to do
    if (comp.isRevealed) {
        updateTabVisibility(3);
        return false;
    }
    
    // Must be late night
    if (!isLateNight()) {
        // Still update tab visibility for current stage
        updateTabVisibility(comp.crackStage);
        return false;
    }
    
    // Check if this is a new night (haven't counted this session yet)
    const todayKey = getTodayKey();
    if (comp.lastSessionDate === todayKey) {
        // Already counted tonight
        updateTabVisibility(comp.crackStage);
        return false;
    }
    
    // NEW LATE NIGHT SESSION!
    comp.lastSessionDate = todayKey;
    comp.lateNightSessions++;
    
    console.log(`[Compartment] Late night session #${comp.lateNightSessions}`);
    
    // Progress based on session count
    if (comp.lateNightSessions >= 3 && comp.crackStage < 3) {
        // FULL REVEAL
        comp.crackStage = 3;
        comp.isRevealed = true;
        saveCompartmentState(comp);
        
        // Delay the reveal toast slightly for drama
        setTimeout(() => {
            showRevealToast();
            updateTabVisibility(3);
        }, 2000);
        
        return true;
        
    } else if (comp.lateNightSessions >= 2 && comp.crackStage < 2) {
        // Stage 2 - ghosting
        comp.crackStage = 2;
        saveCompartmentState(comp);
        
        setTimeout(() => {
            showHintToast(2);
            updateTabVisibility(2);
        }, 1500);
        
        return true;
        
    } else if (comp.lateNightSessions >= 1 && comp.crackStage < 1) {
        // Stage 1 - first hint
        comp.crackStage = 1;
        saveCompartmentState(comp);
        
        setTimeout(() => {
            showHintToast(1);
            updateTabVisibility(1);
        }, 1500);
        
        return true;
    }
    
    saveCompartmentState(comp);
    updateTabVisibility(comp.crackStage);
    return false;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize compartment unlock system
 * Call this after the ledger tab DOM exists
 */
export function initCompartmentUnlock() {
    // Initial visibility check
    const comp = getCompartmentState();
    if (comp) {
        updateTabVisibility(comp.crackStage);
    }
    
    // Check for progression when panel opens
    // (Hook this into panel open event)
    
    console.log('[Compartment] Unlock system initialized');
    console.log(`[Compartment] Current state: stage ${comp?.crackStage || 0}, sessions ${comp?.lateNightSessions || 0}`);
}

/**
 * Force reveal the compartment (debug/cheat)
 */
export function forceReveal() {
    const comp = getCompartmentState();
    if (!comp) return;
    
    comp.crackStage = 3;
    comp.isRevealed = true;
    comp.lateNightSessions = 3;
    saveCompartmentState(comp);
    
    showRevealToast();
    updateTabVisibility(3);
    
    console.log('[Compartment] Force revealed!');
}

/**
 * Reset compartment state (debug)
 */
export function resetCompartment() {
    const state = getChatState();
    if (!state) return;
    
    state.compartment = {
        lateNightSessions: 0,
        lastSessionDate: null,
        crackStage: 0,
        isRevealed: false
    };
    saveChatState();
    
    updateTabVisibility(0);
    console.log('[Compartment] Reset to hidden');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalCompartment = {
        check: checkCompartmentProgression,
        getState: getCompartmentState,
        getStage: getCrackStage,
        isRevealed: isCompartmentRevealed,
        isLateNight,
        forceReveal,
        reset: resetCompartment,
        updateTab: updateTabVisibility
    };
}

export default {
    initCompartmentUnlock,
    checkCompartmentProgression,
    getCrackStage,
    isCompartmentRevealed,
    isLateNight,
    updateTabVisibility,
    forceReveal,
    resetCompartment
};
