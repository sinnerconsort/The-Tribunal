/**
 * The Tribunal - Ledger Awareness System
 * Batch 1: Event Listener Foundation
 * 
 * The ledger is AWARE. It notices:
 * - Time of day shifts
 * - How long you've been away
 * - RP events (vitals, location, cases)
 * - Your fidgeting patterns
 * 
 * This module TRACKS state and EMITS events.
 * Batch 2 will add the actual commentary.
 * 
 * @version 1.0.0
 */

import { getChatState, saveChatState } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let awarenessState = {
    // Session tracking
    sessionStart: null,
    lastInteraction: null,
    lastCompartmentOpen: null,
    
    // Time awareness
    lastKnownPeriod: null,
    periodChanges: 0,
    
    // Fidget tracking (dice rolls)
    recentRolls: [],        // Timestamps of recent rolls
    rollStreak: 0,          // Consecutive rolls without other actions
    lastRollTime: null,
    
    // RP event tracking
    lastKnownVitals: { health: null, morale: null },
    lastKnownLocation: null,
    lastKnownCaseCount: 0,
    
    // Fortune tracking
    lastFortune: null,
    fortuneDrawnAt: null,
    pendingInjection: null, // Fortune waiting to be injected
    
    // Reaction cooldowns (prevent spam)
    lastReactionTime: {},   // { eventType: timestamp }
    reactionCooldown: 30000 // 30 seconds between same reaction type
};

// Event listeners
const listeners = {
    timeShift: [],
    absence: [],
    vitalsChange: [],
    locationChange: [],
    caseChange: [],
    fidgetPattern: [],
    compartmentOpen: [],
    fortuneReady: []
};

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get current time period
 */
export function getTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 2) return 'late_night';
    return 'deep_night'; // 2am - 6am - the witching hours
}

/**
 * Check if it's deep night (2am-6am)
 */
export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}

/**
 * Check if it's late night (10pm-6am)
 */
export function isLateNight() {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 6;
}

/**
 * Format duration for display
 */
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        const remainingMins = minutes % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hours`;
    }
    return `${minutes} minutes`;
}

// ═══════════════════════════════════════════════════════════════
// EVENT SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Subscribe to awareness events
 * @param {string} event - Event type
 * @param {Function} callback - Handler function
 * @returns {Function} Unsubscribe function
 */
export function onAwarenessEvent(event, callback) {
    if (!listeners[event]) {
        console.warn(`[Ledger Awareness] Unknown event type: ${event}`);
        return () => {};
    }
    
    listeners[event].push(callback);
    return () => {
        const idx = listeners[event].indexOf(callback);
        if (idx > -1) listeners[event].splice(idx, 1);
    };
}

/**
 * Emit an awareness event
 */
function emit(event, data) {
    // Check cooldown
    const now = Date.now();
    const lastReaction = awarenessState.lastReactionTime[event] || 0;
    
    if (now - lastReaction < awarenessState.reactionCooldown) {
        console.log(`[Ledger Awareness] ${event} on cooldown, skipping`);
        return;
    }
    
    awarenessState.lastReactionTime[event] = now;
    
    console.log(`[Ledger Awareness] Emitting ${event}:`, data);
    listeners[event]?.forEach(cb => {
        try {
            cb(data);
        } catch (e) {
            console.error(`[Ledger Awareness] Listener error for ${event}:`, e);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// TIME SHIFT DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Check if time period has changed
 * Call this periodically or on interaction
 */
export function checkTimeShift() {
    const currentPeriod = getTimePeriod();
    
    if (awarenessState.lastKnownPeriod && 
        awarenessState.lastKnownPeriod !== currentPeriod) {
        
        const shift = {
            from: awarenessState.lastKnownPeriod,
            to: currentPeriod,
            isDeepNight: isDeepNight(),
            isLateNight: isLateNight()
        };
        
        awarenessState.periodChanges++;
        emit('timeShift', shift);
    }
    
    awarenessState.lastKnownPeriod = currentPeriod;
    return currentPeriod;
}

// ═══════════════════════════════════════════════════════════════
// ABSENCE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Record an interaction (call this on panel open, dice roll, etc)
 */
export function recordInteraction() {
    const now = Date.now();
    awarenessState.lastInteraction = now;
    saveAwarenessState();
}

/**
 * Check how long since last interaction
 * @returns {Object|null} Absence data if significant, null otherwise
 */
export function checkAbsence() {
    const now = Date.now();
    const lastInteraction = awarenessState.lastInteraction;
    
    if (!lastInteraction) {
        awarenessState.lastInteraction = now;
        return null;
    }
    
    const absenceMs = now - lastInteraction;
    const absenceMinutes = Math.floor(absenceMs / 60000);
    
    // Only care about absences > 30 minutes
    if (absenceMinutes < 30) {
        return null;
    }
    
    return {
        duration: absenceMs,
        minutes: absenceMinutes,
        hours: Math.floor(absenceMinutes / 60),
        formatted: formatDuration(absenceMs),
        currentPeriod: getTimePeriod(),
        isDeepNight: isDeepNight()
    };
}

/**
 * Called when compartment is opened
 * Checks for absence and emits event
 */
export function onCompartmentOpen() {
    const now = Date.now();
    const absence = checkAbsence();
    
    // Emit compartment open event with absence data
    emit('compartmentOpen', {
        absence,
        timePeriod: getTimePeriod(),
        isDeepNight: isDeepNight(),
        isLateNight: isLateNight(),
        timestamp: now
    });
    
    // If significant absence, also emit absence event
    if (absence && absence.minutes >= 60) {
        emit('absence', absence);
    }
    
    awarenessState.lastCompartmentOpen = now;
    recordInteraction();
}

// ═══════════════════════════════════════════════════════════════
// FIDGET PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Record a dice roll for fidget pattern tracking
 */
export function recordDiceRoll(rollResult) {
    const now = Date.now();
    
    // Add to recent rolls (keep last 10)
    awarenessState.recentRolls.push({
        timestamp: now,
        result: rollResult
    });
    if (awarenessState.recentRolls.length > 10) {
        awarenessState.recentRolls.shift();
    }
    
    // Check for streak (rolls within 10 seconds of each other)
    if (awarenessState.lastRollTime && 
        now - awarenessState.lastRollTime < 10000) {
        awarenessState.rollStreak++;
    } else {
        awarenessState.rollStreak = 1;
    }
    
    awarenessState.lastRollTime = now;
    
    // Detect fidget patterns
    const pattern = detectFidgetPattern();
    if (pattern) {
        emit('fidgetPattern', pattern);
    }
    
    recordInteraction();
}

/**
 * Analyze recent rolls for patterns
 */
function detectFidgetPattern() {
    const rolls = awarenessState.recentRolls;
    const streak = awarenessState.rollStreak;
    
    // Rapid rolling (3+ in quick succession)
    if (streak >= 3) {
        return {
            type: 'rapid',
            streak,
            message: streak >= 5 ? 'compulsive' : 'nervous'
        };
    }
    
    // Check for all low rolls (frustration?)
    if (rolls.length >= 3) {
        const lastThree = rolls.slice(-3);
        const allLow = lastThree.every(r => r.result?.total <= 5);
        if (allLow) {
            return {
                type: 'unlucky_streak',
                count: 3,
                message: 'bad_luck'
            };
        }
    }
    
    // Check for repeat snake eyes (cursed)
    const recentSnakeEyes = rolls.filter(r => r.result?.isSnakeEyes).length;
    if (recentSnakeEyes >= 2) {
        return {
            type: 'cursed',
            snakeEyesCount: recentSnakeEyes,
            message: 'the_dice_remember'
        };
    }
    
    return null;
}

/**
 * Reset fidget tracking (call when doing something else)
 */
export function resetFidgetTracking() {
    awarenessState.rollStreak = 0;
}

// ═══════════════════════════════════════════════════════════════
// RP EVENT TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Update vitals and check for significant changes
 * @param {Object} vitals - { health, morale, maxHealth, maxMorale }
 */
export function updateVitals(vitals) {
    const prev = awarenessState.lastKnownVitals;
    
    if (prev.health !== null && prev.morale !== null) {
        const healthDrop = prev.health - vitals.health;
        const moraleDrop = prev.morale - vitals.morale;
        
        // Significant health drop (3+ points)
        if (healthDrop >= 3) {
            emit('vitalsChange', {
                type: 'health_drop',
                amount: healthDrop,
                current: vitals.health,
                max: vitals.maxHealth,
                isCritical: vitals.health <= 3
            });
        }
        
        // Significant morale drop (3+ points)
        if (moraleDrop >= 3) {
            emit('vitalsChange', {
                type: 'morale_drop',
                amount: moraleDrop,
                current: vitals.morale,
                max: vitals.maxMorale,
                isCritical: vitals.morale <= 3
            });
        }
        
        // Critical state
        if ((vitals.health <= 3 || vitals.morale <= 3) && 
            (prev.health > 3 && prev.morale > 3)) {
            emit('vitalsChange', {
                type: 'critical',
                health: vitals.health,
                morale: vitals.morale
            });
        }
    }
    
    awarenessState.lastKnownVitals = {
        health: vitals.health,
        morale: vitals.morale
    };
}

/**
 * Update location and check for changes
 * @param {Object} location - Location object from WORLD tag
 */
export function updateLocation(location) {
    const prev = awarenessState.lastKnownLocation;
    const locationName = location?.name || location;
    
    if (prev && prev !== locationName) {
        emit('locationChange', {
            from: prev,
            to: locationName,
            location: location,
            timePeriod: getTimePeriod()
        });
    }
    
    awarenessState.lastKnownLocation = locationName;
}

/**
 * Update case count and check for new cases
 * @param {number} caseCount - Current number of cases
 */
export function updateCaseCount(caseCount) {
    const prev = awarenessState.lastKnownCaseCount;
    
    if (prev !== null && caseCount > prev) {
        emit('caseChange', {
            type: 'new_case',
            count: caseCount,
            added: caseCount - prev
        });
    } else if (prev !== null && caseCount < prev) {
        emit('caseChange', {
            type: 'case_closed',
            count: caseCount,
            closed: prev - caseCount
        });
    }
    
    awarenessState.lastKnownCaseCount = caseCount;
}

// ═══════════════════════════════════════════════════════════════
// FORTUNE INJECTION TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Record a fortune draw for potential injection
 * @param {Object} fortune - Fortune result from drawFortune()
 */
export function recordFortune(fortune) {
    const now = Date.now();
    
    awarenessState.lastFortune = fortune;
    awarenessState.fortuneDrawnAt = now;
    
    // Mark as pending injection if not empty
    if (!fortune.isEmpty) {
        awarenessState.pendingInjection = {
            fortune: fortune.fortune,
            voice: fortune.voice,
            voiceName: fortune.voiceName,
            drawnAt: now
        };
        
        emit('fortuneReady', awarenessState.pendingInjection);
    }
}

/**
 * Get pending fortune injection (and optionally consume it)
 * @param {boolean} consume - If true, clears the pending injection
 * @returns {Object|null} Pending fortune or null
 */
export function getPendingInjection(consume = false) {
    const pending = awarenessState.pendingInjection;
    
    if (consume && pending) {
        awarenessState.pendingInjection = null;
        saveAwarenessState();
    }
    
    return pending;
}

/**
 * Check if a fortune is pending injection
 */
export function hasPendingInjection() {
    return awarenessState.pendingInjection !== null;
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Save awareness state to chat state
 */
function saveAwarenessState() {
    const state = getChatState();
    if (!state) return;
    
    // Only save the stuff that should persist
    state.ledgerAwareness = {
        lastInteraction: awarenessState.lastInteraction,
        lastKnownPeriod: awarenessState.lastKnownPeriod,
        lastKnownVitals: awarenessState.lastKnownVitals,
        lastKnownLocation: awarenessState.lastKnownLocation,
        lastKnownCaseCount: awarenessState.lastKnownCaseCount,
        pendingInjection: awarenessState.pendingInjection
    };
    
    saveChatState();
}

/**
 * Load awareness state from chat state
 */
function loadAwarenessState() {
    const state = getChatState();
    if (!state?.ledgerAwareness) return;
    
    const saved = state.ledgerAwareness;
    
    awarenessState.lastInteraction = saved.lastInteraction || null;
    awarenessState.lastKnownPeriod = saved.lastKnownPeriod || null;
    awarenessState.lastKnownVitals = saved.lastKnownVitals || { health: null, morale: null };
    awarenessState.lastKnownLocation = saved.lastKnownLocation || null;
    awarenessState.lastKnownCaseCount = saved.lastKnownCaseCount || 0;
    awarenessState.pendingInjection = saved.pendingInjection || null;
    
    console.log('[Ledger Awareness] State loaded:', awarenessState);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the awareness system
 * Call this once when the extension loads
 */
export function initAwareness() {
    // Load persisted state
    loadAwarenessState();
    
    // Set session start
    awarenessState.sessionStart = Date.now();
    
    // Initial time period
    awarenessState.lastKnownPeriod = getTimePeriod();
    
    // Set up periodic time check (every minute)
    setInterval(() => {
        checkTimeShift();
    }, 60000);
    
    // ═══════════════════════════════════════════════════════════════
    // WIRE INTO EXISTING TRIBUNAL EVENTS
    // These are already dispatched by other modules
    // ═══════════════════════════════════════════════════════════════
    
    // Dice rolls (from ledger-voices.js)
    window.addEventListener('tribunal:diceRoll', (e) => {
        recordDiceRoll(e.detail);
    });
    
    // Fortune draws (from ledger-voices.js)
    window.addEventListener('tribunal:fortuneDrawn', (e) => {
        recordFortune(e.detail);
    });
    
    // Vitals changes (add dispatch to crt-vitals.js)
    window.addEventListener('tribunal:vitalsChanged', (e) => {
        updateVitals(e.detail);
    });
    
    // Location changes (from world-parser.js)
    window.addEventListener('tribunal:locationChanged', (e) => {
        updateLocation(e.detail);
    });
    
    // Compartment tab opened (custom event if dispatched)
    window.addEventListener('tribunal:compartmentOpened', (e) => {
        onCompartmentOpen();
    });
    
    // FALLBACK: Direct click listener on compartment tab
    // This way we don't need to modify the subtab handler
    setTimeout(() => {
        const compartmentTab = document.querySelector('.ledger-subtab[data-ledger-tab="compartment"]');
        if (compartmentTab) {
            compartmentTab.addEventListener('click', () => {
                console.log('[Ledger Awareness] Compartment tab clicked');
                onCompartmentOpen();
            });
            console.log('[Ledger Awareness] Compartment tab listener attached');
        }
    }, 1000); // Delay to ensure DOM is ready
    
    console.log('[Ledger Awareness] Initialized');
    console.log(`[Ledger Awareness] Time period: ${getTimePeriod()}`);
    console.log(`[Ledger Awareness] Deep night: ${isDeepNight()}`);
    console.log('[Ledger Awareness] Listening for tribunal events');
    
    return true;
}

// ═══════════════════════════════════════════════════════════════
// DEBUG / EXPORT
// ═══════════════════════════════════════════════════════════════

export function getAwarenessState() {
    return { ...awarenessState };
}

export function debugAwareness() {
    const state = getAwarenessState();
    console.log('[Ledger Awareness Debug]', {
        timePeriod: getTimePeriod(),
        isDeepNight: isDeepNight(),
        isLateNight: isLateNight(),
        state,
        listeners: Object.fromEntries(
            Object.entries(listeners).map(([k, v]) => [k, v.length])
        )
    });
    return state;
}

// Window export for debugging
if (typeof window !== 'undefined') {
    window.TribunalAwareness = {
        init: initAwareness,
        getState: getAwarenessState,
        debug: debugAwareness,
        
        // Event subscription
        on: onAwarenessEvent,
        
        // Manual triggers (for testing)
        checkTimeShift,
        checkAbsence,
        onCompartmentOpen,
        recordDiceRoll,
        recordFortune,
        
        // RP event updates
        updateVitals,
        updateLocation,
        updateCaseCount,
        
        // Fortune injection
        getPendingInjection,
        hasPendingInjection,
        
        // Time utilities
        getTimePeriod,
        isDeepNight,
        isLateNight
    };
}

export default {
    initAwareness,
    getAwarenessState,
    
    // Event system
    onAwarenessEvent,
    
    // Time
    getTimePeriod,
    isDeepNight,
    isLateNight,
    checkTimeShift,
    
    // Tracking
    recordInteraction,
    checkAbsence,
    onCompartmentOpen,
    recordDiceRoll,
    resetFidgetTracking,
    
    // RP events
    updateVitals,
    updateLocation,
    updateCaseCount,
    
    // Fortune
    recordFortune,
    getPendingInjection,
    hasPendingInjection,
    
    // Debug
    debugAwareness
};
