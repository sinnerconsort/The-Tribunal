/**
 * The Tribunal - Fidget Pattern Detection
 * Watches how you interact with the drawer items and notices patterns
 * 
 * The ledger sees you rolling dice at 3am.
 * The ledger has opinions about this.
 * 
 * v1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// FIDGET SESSION TRACKING
// A "session" is a burst of fidget activity
// ═══════════════════════════════════════════════════════════════

const fidgetState = {
    // Current session
    session: {
        active: false,
        startTime: null,
        rollCount: 0,
        fortuneCount: 0,
        patterns: [],
        peakIntensity: 0
    },
    
    // Roll history (more detailed than awareness.js)
    rolls: [],        // Last 20 rolls with full timestamps
    maxRolls: 20,
    
    // Pattern tracking
    lastPattern: null,
    patternCooldowns: {},  // Prevent spam of same pattern
    
    // Intervention level (escalates with continued fidgeting)
    interventionLevel: 0,  // 0-5
    lastIntervention: null,
    
    // Recovery tracking
    calmPeriodStart: null,
    wasRecentlyFidgeting: false
};

// Session timeout (30 seconds of no activity = session ends)
const SESSION_TIMEOUT = 30000;
// Minimum time between same pattern reactions
const PATTERN_COOLDOWN = 60000;
// Time to consider "calm" (2 minutes no fidgeting)
const CALM_THRESHOLD = 120000;

// ═══════════════════════════════════════════════════════════════
// PATTERN DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const PATTERNS = {
    // Speed-based patterns
    rapid: {
        name: 'rapid',
        detect: (state) => {
            const recent = getRecentRolls(10000); // Last 10 seconds
            return recent.length >= 3;
        },
        intensity: (state) => Math.min(getRecentRolls(10000).length, 10),
        visualClass: 'fidget-rapid'
    },
    
    frantic: {
        name: 'frantic',
        detect: (state) => {
            const recent = getRecentRolls(5000); // Last 5 seconds
            return recent.length >= 4;
        },
        intensity: () => 8,
        visualClass: 'fidget-frantic'
    },
    
    // Outcome-based patterns
    unlucky_streak: {
        name: 'unlucky_streak',
        detect: (state) => {
            const last5 = fidgetState.rolls.slice(-5);
            if (last5.length < 3) return false;
            const lowCount = last5.filter(r => r.total <= 5).length;
            return lowCount >= 3;
        },
        intensity: (state) => {
            const last5 = fidgetState.rolls.slice(-5);
            return last5.filter(r => r.total <= 5).length * 2;
        },
        visualClass: 'fidget-unlucky'
    },
    
    cursed: {
        name: 'cursed',
        detect: (state) => {
            const snakeEyesCount = fidgetState.rolls
                .slice(-10)
                .filter(r => r.isSnakeEyes).length;
            return snakeEyesCount >= 2;
        },
        intensity: () => 10,
        visualClass: 'fidget-cursed'
    },
    
    blessed: {
        name: 'blessed',
        detect: (state) => {
            const boxcarsCount = fidgetState.rolls
                .slice(-10)
                .filter(r => r.isBoxcars).length;
            return boxcarsCount >= 2;
        },
        intensity: () => 7,
        visualClass: 'fidget-blessed'
    },
    
    // Behavioral patterns
    seeking: {
        name: 'seeking',
        detect: (state) => {
            // Rolling repeatedly without doing anything else
            // High roll count in session, no fortune draws
            return fidgetState.session.rollCount >= 6 && 
                   fidgetState.session.fortuneCount === 0;
        },
        intensity: (state) => Math.min(fidgetState.session.rollCount, 10),
        visualClass: 'fidget-seeking'
    },
    
    ritual: {
        name: 'ritual',
        detect: (state) => {
            // Fortune draw followed by dice roll (superstitious behavior)
            const recentActivity = getRecentActivity(30000);
            const pattern = recentActivity.map(a => a.type).join(',');
            return pattern.includes('fortune,roll') || pattern.includes('roll,fortune,roll');
        },
        intensity: () => 5,
        visualClass: 'fidget-ritual'
    },
    
    // Time-based patterns
    late_night_fidget: {
        name: 'late_night_fidget',
        detect: (state) => {
            const hour = new Date().getHours();
            const isLateNight = hour >= 23 || hour < 5;
            return isLateNight && fidgetState.session.rollCount >= 3;
        },
        intensity: (state) => {
            const hour = new Date().getHours();
            // Worse the later it gets
            if (hour >= 2 && hour < 5) return 10;
            if (hour >= 0 && hour < 2) return 8;
            return 6;
        },
        visualClass: 'fidget-latenight'
    },
    
    // Recovery pattern (good!)
    calming_down: {
        name: 'calming_down',
        detect: (state) => {
            return fidgetState.wasRecentlyFidgeting && 
                   fidgetState.calmPeriodStart &&
                   Date.now() - fidgetState.calmPeriodStart > CALM_THRESHOLD;
        },
        intensity: () => 0, // Positive pattern
        visualClass: 'fidget-calm'
    }
};

// ═══════════════════════════════════════════════════════════════
// INTERVENTION RESPONSES
// The ledger's concern escalates
// ═══════════════════════════════════════════════════════════════

const INTERVENTION_LEVELS = {
    0: null, // No intervention
    
    1: {
        // Gentle observation
        voice: 'damaged',
        lines: [
            "You're rolling the dice a lot. The ledger notices these things.",
            "Click, clatter, click. The drawer knows this rhythm.",
            "The dice are patient. Are you?"
        ]
    },
    
    2: {
        // Mild concern
        voice: 'damaged',
        lines: [
            "This is... a lot of rolling. Even for you.",
            "The drawer's getting warm from all the friction.",
            "You know the dice don't change, right? They're the same dice.",
            "Are you looking for something in those numbers?"
        ]
    },
    
    3: {
        // Direct address
        voice: 'oblivion',
        lines: [
            "The pattern is clear. You are seeking. The dice do not have what you need.",
            "Roll after roll. The future doesn't change. Only your certainty about it.",
            "You're trying to control fate with bone cubes. The ledger has done this too."
        ]
    },
    
    4: {
        // Concerned intervention
        voice: 'failure',
        lines: [
            "Okay. Stop. The dice aren't going to fix anything.",
            "This is compulsive now. I'm a ledger and even I can see it.",
            "You're fidgeting because something else is wrong. The dice aren't it.",
            "At {time}, rolling dice repeatedly in a drawer. This is a choice."
        ]
    },
    
    5: {
        // Maximum concern
        voice: 'failure',
        lines: [
            "Please stop. This isn't helping you. The ledger is... the ledger doesn't like watching this.",
            "Close the drawer. Do something else. Anything else. The dice will still be here.",
            "The case can wait. The dice can wait. Can you?",
            "You're using fidgeting to avoid something. The ledger knows. The ledger does it too."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getRecentRolls(timeWindow) {
    const now = Date.now();
    return fidgetState.rolls.filter(r => now - r.timestamp < timeWindow);
}

function getRecentActivity(timeWindow) {
    // Combines rolls and other drawer activity
    const now = Date.now();
    const activity = [];
    
    fidgetState.rolls.forEach(r => {
        if (now - r.timestamp < timeWindow) {
            activity.push({ type: 'roll', timestamp: r.timestamp, data: r });
        }
    });
    
    // Could add fortune draws here too
    
    return activity.sort((a, b) => a.timestamp - b.timestamp);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function isOnCooldown(patternName) {
    const lastTime = fidgetState.patternCooldowns[patternName];
    if (!lastTime) return false;
    return Date.now() - lastTime < PATTERN_COOLDOWN;
}

function setCooldown(patternName) {
    fidgetState.patternCooldowns[patternName] = Date.now();
}

// ═══════════════════════════════════════════════════════════════
// CORE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Record a dice roll and analyze patterns
 * Call this from ledger-voices.js handleDiceClick
 */
export function recordFidgetRoll(rollResult) {
    const now = Date.now();
    
    // Add to roll history
    fidgetState.rolls.push({
        timestamp: now,
        ...rollResult
    });
    
    // Trim to max
    if (fidgetState.rolls.length > fidgetState.maxRolls) {
        fidgetState.rolls.shift();
    }
    
    // Update session
    updateSession('roll');
    
    // Reset calm period tracking
    fidgetState.calmPeriodStart = null;
    
    // Detect patterns
    const detectedPatterns = detectAllPatterns();
    
    // Apply visual effects
    applyVisualEffects(detectedPatterns);
    
    // Check for intervention
    checkIntervention(detectedPatterns);
    
    // Emit events for detected patterns
    detectedPatterns.forEach(pattern => {
        if (!isOnCooldown(pattern.name)) {
            emitPattern(pattern);
            setCooldown(pattern.name);
        }
    });
    
    return detectedPatterns;
}

/**
 * Record a fortune draw (affects pattern detection)
 */
export function recordFidgetFortune() {
    updateSession('fortune');
    fidgetState.session.fortuneCount++;
}

/**
 * Update the fidget session
 */
function updateSession(activityType) {
    const now = Date.now();
    
    // Start new session if none active or timed out
    if (!fidgetState.session.active || 
        (fidgetState.session.startTime && 
         now - fidgetState.session.startTime > SESSION_TIMEOUT)) {
        
        // If previous session was active, mark recovery
        if (fidgetState.session.active && fidgetState.session.rollCount >= 5) {
            fidgetState.wasRecentlyFidgeting = true;
            fidgetState.calmPeriodStart = now;
        }
        
        // Start fresh session
        fidgetState.session = {
            active: true,
            startTime: now,
            rollCount: 0,
            fortuneCount: 0,
            patterns: [],
            peakIntensity: 0
        };
        
        // Reset intervention level for new session
        fidgetState.interventionLevel = 0;
    }
    
    // Update session
    if (activityType === 'roll') {
        fidgetState.session.rollCount++;
    }
    fidgetState.session.lastActivity = now;
}

/**
 * Detect all active patterns
 */
function detectAllPatterns() {
    const detected = [];
    
    for (const [name, pattern] of Object.entries(PATTERNS)) {
        if (pattern.detect(fidgetState)) {
            const intensity = pattern.intensity(fidgetState);
            detected.push({
                name,
                intensity,
                visualClass: pattern.visualClass,
                timestamp: Date.now()
            });
            
            // Track peak intensity in session
            if (intensity > fidgetState.session.peakIntensity) {
                fidgetState.session.peakIntensity = intensity;
            }
        }
    }
    
    // Sort by intensity (highest first)
    return detected.sort((a, b) => b.intensity - a.intensity);
}

/**
 * Apply visual CSS classes to dice container
 */
function applyVisualEffects(patterns) {
    const diceContainer = document.querySelector('.compartment-dice');
    if (!diceContainer) return;
    
    // Remove all fidget classes
    diceContainer.classList.remove(
        'fidget-rapid', 'fidget-frantic', 'fidget-unlucky',
        'fidget-cursed', 'fidget-blessed', 'fidget-seeking',
        'fidget-ritual', 'fidget-latenight', 'fidget-calm'
    );
    
    // Apply highest intensity pattern's class
    if (patterns.length > 0) {
        diceContainer.classList.add(patterns[0].visualClass);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            diceContainer.classList.remove(patterns[0].visualClass);
        }, 3000);
    }
}

/**
 * Check if intervention is needed
 */
function checkIntervention(patterns) {
    // Calculate intervention level based on session
    const rollCount = fidgetState.session.rollCount;
    const peakIntensity = fidgetState.session.peakIntensity;
    
    let newLevel = 0;
    
    if (rollCount >= 15 || peakIntensity >= 9) {
        newLevel = 5;
    } else if (rollCount >= 12 || peakIntensity >= 7) {
        newLevel = 4;
    } else if (rollCount >= 9 || peakIntensity >= 5) {
        newLevel = 3;
    } else if (rollCount >= 6) {
        newLevel = 2;
    } else if (rollCount >= 4) {
        newLevel = 1;
    }
    
    // Only escalate, never de-escalate during a session
    if (newLevel > fidgetState.interventionLevel) {
        fidgetState.interventionLevel = newLevel;
        triggerIntervention(newLevel);
    }
}

/**
 * Trigger an intervention response
 */
function triggerIntervention(level) {
    const intervention = INTERVENTION_LEVELS[level];
    if (!intervention) return;
    
    // Don't spam interventions
    if (fidgetState.lastIntervention && 
        Date.now() - fidgetState.lastIntervention < 15000) {
        return;
    }
    
    fidgetState.lastIntervention = Date.now();
    
    // Pick random line
    let line = intervention.lines[Math.floor(Math.random() * intervention.lines.length)];
    line = line.replace('{time}', getCurrentTime());
    
    // Emit intervention event
    window.dispatchEvent(new CustomEvent('tribunal:fidgetIntervention', {
        detail: {
            level,
            voice: intervention.voice,
            message: line,
            sessionRolls: fidgetState.session.rollCount
        }
    }));
    
    console.log(`[Fidget] Intervention level ${level}:`, line);
}

/**
 * Emit a pattern detection event
 */
function emitPattern(pattern) {
    window.dispatchEvent(new CustomEvent('tribunal:fidgetPattern', {
        detail: {
            ...pattern,
            sessionRolls: fidgetState.session.rollCount,
            sessionDuration: Date.now() - fidgetState.session.startTime
        }
    }));
    
    console.log(`[Fidget] Pattern detected: ${pattern.name} (intensity: ${pattern.intensity})`);
}

// ═══════════════════════════════════════════════════════════════
// RECOVERY DETECTION
// Notice when they calm down
// ═══════════════════════════════════════════════════════════════

/**
 * Check for recovery (call periodically or on tab focus)
 */
export function checkRecovery() {
    if (!fidgetState.wasRecentlyFidgeting) return null;
    if (!fidgetState.calmPeriodStart) return null;
    
    const calmDuration = Date.now() - fidgetState.calmPeriodStart;
    
    if (calmDuration > CALM_THRESHOLD) {
        fidgetState.wasRecentlyFidgeting = false;
        
        const recovery = {
            type: 'calming_down',
            calmDuration,
            previousSessionRolls: fidgetState.session.rollCount
        };
        
        window.dispatchEvent(new CustomEvent('tribunal:fidgetRecovery', {
            detail: recovery
        }));
        
        console.log('[Fidget] Recovery detected - user calmed down');
        return recovery;
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// CSS FOR VISUAL EFFECTS
// ═══════════════════════════════════════════════════════════════

export const FIDGET_CSS = `
/* Rapid rolling - dice vibrate */
.compartment-dice.fidget-rapid .siren-die {
    animation: fidget-shake 0.1s ease-in-out infinite;
}

/* Frantic rolling - intense vibration */
.compartment-dice.fidget-frantic .siren-die {
    animation: fidget-shake 0.05s ease-in-out infinite;
}

/* Unlucky streak - dice dim and desaturate */
.compartment-dice.fidget-unlucky .siren-die {
    filter: brightness(0.7) saturate(0.5);
    transition: filter 0.3s ease;
}

/* Cursed - red glow, ominous */
.compartment-dice.fidget-cursed .siren-die {
    box-shadow: 0 0 15px rgba(181, 75, 75, 0.8);
    animation: fidget-pulse-red 1s ease-in-out infinite;
}

/* Blessed - golden glow */
.compartment-dice.fidget-blessed .siren-die {
    box-shadow: 0 0 15px rgba(212, 165, 116, 0.8);
    animation: fidget-pulse-gold 1s ease-in-out infinite;
}

/* Seeking - subtle pulse, searching */
.compartment-dice.fidget-seeking .siren-die {
    animation: fidget-seeking 2s ease-in-out infinite;
}

/* Ritual - mystical purple glow */
.compartment-dice.fidget-ritual .siren-die {
    box-shadow: 0 0 12px rgba(155, 107, 158, 0.6);
}

/* Late night - drowsy dim */
.compartment-dice.fidget-latenight .siren-die {
    filter: brightness(0.8) hue-rotate(-10deg);
    animation: fidget-drowsy 3s ease-in-out infinite;
}

/* Calm - everything soft and settled */
.compartment-dice.fidget-calm .siren-die {
    filter: brightness(1.1) saturate(0.9);
    transition: all 1s ease;
}

/* Keyframes */
@keyframes fidget-shake {
    0%, 100% { transform: translateX(0) rotate(var(--die-rotation, 0deg)); }
    25% { transform: translateX(-2px) rotate(var(--die-rotation, 0deg)); }
    75% { transform: translateX(2px) rotate(var(--die-rotation, 0deg)); }
}

@keyframes fidget-pulse-red {
    0%, 100% { box-shadow: 0 0 10px rgba(181, 75, 75, 0.5); }
    50% { box-shadow: 0 0 20px rgba(181, 75, 75, 0.9); }
}

@keyframes fidget-pulse-gold {
    0%, 100% { box-shadow: 0 0 10px rgba(212, 165, 116, 0.5); }
    50% { box-shadow: 0 0 20px rgba(212, 165, 116, 0.9); }
}

@keyframes fidget-seeking {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

@keyframes fidget-drowsy {
    0%, 100% { filter: brightness(0.8) hue-rotate(-10deg); }
    50% { filter: brightness(0.6) hue-rotate(-15deg); }
}
`;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize fidget pattern detection
 */
export function initFidgetPatterns() {
    // Inject CSS
    if (!document.getElementById('tribunal-fidget-css')) {
        const style = document.createElement('style');
        style.id = 'tribunal-fidget-css';
        style.textContent = FIDGET_CSS;
        document.head.appendChild(style);
    }
    
    // AUTO-HOOK: Listen to existing dice roll events from ledger-voices.js
    // No manual integration needed!
    window.addEventListener('tribunal:diceRoll', (e) => {
        recordFidgetRoll(e.detail);
    });
    
    // Also listen for fortune draws
    window.addEventListener('tribunal:fortuneDrawn', (e) => {
        recordFidgetFortune();
    });
    
    // Periodically check for recovery
    setInterval(() => {
        checkRecovery();
    }, 30000);
    
    console.log('[Fidget Patterns] Initialized - auto-hooked to dice events');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG / EXPORT
// ═══════════════════════════════════════════════════════════════

export function getFidgetState() {
    return { ...fidgetState };
}

export function getSessionStats() {
    return {
        active: fidgetState.session.active,
        duration: fidgetState.session.startTime 
            ? Date.now() - fidgetState.session.startTime 
            : 0,
        rollCount: fidgetState.session.rollCount,
        fortuneCount: fidgetState.session.fortuneCount,
        peakIntensity: fidgetState.session.peakIntensity,
        interventionLevel: fidgetState.interventionLevel
    };
}

if (typeof window !== 'undefined') {
    window.TribunalFidget = {
        record: recordFidgetRoll,
        recordFortune: recordFidgetFortune,
        getState: getFidgetState,
        getSession: getSessionStats,
        checkRecovery,
        
        // Debug helpers
        simulateRapid: () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    recordFidgetRoll({
                        die1: Math.floor(Math.random() * 6) + 1,
                        die2: Math.floor(Math.random() * 6) + 1,
                        total: 7,
                        isSnakeEyes: false,
                        isBoxcars: false
                    });
                }, i * 500);
            }
        },
        
        simulateCursed: () => {
            recordFidgetRoll({ die1: 1, die2: 1, total: 2, isSnakeEyes: true, isBoxcars: false });
            setTimeout(() => {
                recordFidgetRoll({ die1: 1, die2: 1, total: 2, isSnakeEyes: true, isBoxcars: false });
            }, 1000);
        }
    };
}

export default {
    recordFidgetRoll,
    recordFidgetFortune,
    getFidgetState,
    getSessionStats,
    checkRecovery,
    initFidgetPatterns,
    FIDGET_CSS
};
