/**
 * The Tribunal - Condition Effects Controller
 * Visual effects for consumption (smoke, drunk, stimulant) and health states
 * 
 * FIXED: Added resetConditionState() and onChatChanged() for proper chat switching
 * 
 * INDEPENDENT from weather - these stack on top and coexist
 * 
 * Usage:
 *   triggerConsumptionEffect('smoke');   // 15 sec burst
 *   setHealthEffect('low-health');       // Persistent until cleared
 *   clearHealthEffect();                 // Remove health overlay
 */

// ═══════════════════════════════════════════════════════════════
// EFFECT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONSUMPTION_EFFECTS = {
    smoke: {
        duration: 15000,          // 15 seconds
        className: 'effect-smoke-active',
        particles: true,
        particleCount: 8
    },
    drunk: {
        duration: 20000,          // 20 seconds
        className: 'effect-drunk-active'
    },
    stimulant: {
        duration: 12000,          // 12 seconds
        className: 'effect-stimulant-active'
    }
};

const HEALTH_EFFECTS = {
    'low-health': {
        className: 'effect-low-health',
        threshold: 0.3            // Below 30% health
    },
    'dying': {
        className: 'effect-dying',
        threshold: 0.15           // Below 15% health
    },
    'low-morale': {
        className: 'effect-low-morale',
        threshold: 0.3
    }
};

/**
 * Scene effects - horror and pale (moved from weather!)
 * These can now OVERLAP with weather effects
 */
const SCENE_EFFECTS = {
    horror: {
        className: 'effect-horror-active',
        particles: ['vignette', 'heartbeat', 'flicker', 'blood-drips'],
        audioEvent: 'tribunal:horrorStart',  // Radio listens for this
        audioStopEvent: 'tribunal:horrorEnd',
        bloodDripCount: 5
    },
    pale: {
        className: 'effect-pale-active',
        particles: ['void', 'static', 'shimmer', 'wisps', 'symbols'],
        audioEvent: 'tribunal:paleStart',
        audioStopEvent: 'tribunal:paleEnd',
        wispCount: 4,
        symbolCount: 6,
        symbols: ['∞', '◊', '△', '○', '□', '◇', '⟡', '✧', '⌘', '∴', '∵', '⊕']
    }
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let conditionLayer = null;
let activeConsumptionTimers = {};
let currentHealthEffect = null;
let currentSceneEffect = null;  // 'horror' or 'pale'

// ═══════════════════════════════════════════════════════════════
// CHAT SWITCH HANDLING (FIX)
// ═══════════════════════════════════════════════════════════════

/**
 * Reset all condition effects when switching chats
 * Clears visual effects and resets tracking state
 */
export function resetConditionState() {
    // Clear all visual effect classes from the layer
    if (conditionLayer) {
        // Remove all effect classes but keep the base class
        conditionLayer.className = 'tribunal-condition-layer';
        
        // Clear any lingering particles
        clearSmokeParticles();
        clearHorrorParticles();
        clearPaleParticles();
    }
    
    // Clear all active consumption timers
    Object.values(activeConsumptionTimers).forEach(timerId => {
        if (timerId) clearTimeout(timerId);
    });
    activeConsumptionTimers = {};
    
    // Reset state tracking
    currentHealthEffect = null;
    currentSceneEffect = null;
    
    console.log('[Condition FX] State reset for new chat');
}

/**
 * Full handler for chat switch
 */
export function onChatChanged() {
    // 1. Clear all visual effects
    resetConditionState();
    
    // 2. Re-check vitals for the new chat to apply appropriate effects
    // Small delay to ensure chat_metadata is updated
    setTimeout(() => {
        checkVitalsForEffects();
    }, 100);
    
    console.log('[Condition FX] Reset complete for chat switch');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the condition effects layer
 * Call this once on extension load
 */
export function initConditionEffects() {
    if (conditionLayer) return;
    
    conditionLayer = document.createElement('div');
    conditionLayer.className = 'tribunal-condition-layer';
    conditionLayer.id = 'tribunal-condition-layer';
    document.body.appendChild(conditionLayer);
    
    console.log('[Condition FX] Layer initialized');
}

// ═══════════════════════════════════════════════════════════════
// CONSUMPTION EFFECTS (temporary bursts)
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger a consumption visual effect
 * @param {string} effectType - 'smoke', 'drunk', 'stimulant'
 */
export function triggerConsumptionEffect(effectType) {
    if (!conditionLayer) initConditionEffects();
    
    const config = CONSUMPTION_EFFECTS[effectType];
    if (!config) {
        console.warn('[Condition FX] Unknown consumption effect:', effectType);
        return;
    }
    
    // Clear existing timer for this effect
    if (activeConsumptionTimers[effectType]) {
        clearTimeout(activeConsumptionTimers[effectType]);
        conditionLayer.classList.remove(config.className);
    }
    
    // Add smoke particles if needed
    if (config.particles) {
        addSmokeParticles(config.particleCount);
    }
    
    // Activate effect
    conditionLayer.classList.add(config.className);
    console.log(`[Condition FX] ${effectType} effect started`);
    
    // Auto-clear after duration
    activeConsumptionTimers[effectType] = setTimeout(() => {
        conditionLayer.classList.remove(config.className);
        
        // Clean up particles
        if (config.particles) {
            clearSmokeParticles();
        }
        
        console.log(`[Condition FX] ${effectType} effect ended`);
    }, config.duration);
}

/**
 * Add smoke particle elements
 */
function addSmokeParticles(count) {
    if (!conditionLayer) return;
    
    // Clear existing
    clearSmokeParticles();
    
    // Add ember
    const ember = document.createElement('div');
    ember.className = 'smoke-ember';
    conditionLayer.appendChild(ember);
    
    // Add particles
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'smoke-particle';
        conditionLayer.appendChild(particle);
    }
}

/**
 * Remove smoke particles
 */
function clearSmokeParticles() {
    if (!conditionLayer) return;
    
    conditionLayer.querySelectorAll('.smoke-ember, .smoke-particle').forEach(el => el.remove());
}

// ═══════════════════════════════════════════════════════════════
// HEALTH EFFECTS (persistent)
// ═══════════════════════════════════════════════════════════════

/**
 * Set a health-based visual effect (persistent until cleared)
 * @param {string} effectType - 'low-health', 'dying', 'low-morale', 'horror'
 */
export function setHealthEffect(effectType) {
    if (!conditionLayer) initConditionEffects();
    
    const config = HEALTH_EFFECTS[effectType];
    if (!config) {
        console.warn('[Condition FX] Unknown health effect:', effectType);
        return;
    }
    
    // Clear previous health effect
    if (currentHealthEffect && currentHealthEffect !== effectType) {
        const prevConfig = HEALTH_EFFECTS[currentHealthEffect];
        if (prevConfig) {
            conditionLayer.classList.remove(prevConfig.className);
        }
    }
    
    // Apply new effect
    conditionLayer.classList.add(config.className);
    currentHealthEffect = effectType;
    
    console.log(`[Condition FX] Health effect set: ${effectType}`);
    
    // Horror is temporary
    if (effectType === 'horror' && config.duration) {
        setTimeout(() => {
            if (currentHealthEffect === 'horror') {
                clearHealthEffect();
            }
        }, config.duration);
    }
}

/**
 * Clear all health effects
 */
export function clearHealthEffect() {
    if (!conditionLayer) return;
    
    Object.values(HEALTH_EFFECTS).forEach(config => {
        conditionLayer.classList.remove(config.className);
    });
    
    currentHealthEffect = null;
    console.log('[Condition FX] Health effects cleared');
}

// ═══════════════════════════════════════════════════════════════
// SCENE EFFECTS (Horror, The Pale)
// These are SEPARATE from weather and can overlap!
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger horror scene effect
 * Overlays on top of weather - rain + horror works!
 */
export function triggerHorror() {
    if (!conditionLayer) initConditionEffects();
    
    const config = SCENE_EFFECTS.horror;
    
    // Clear any existing scene effect
    if (currentSceneEffect) {
        exitSceneEffect(currentSceneEffect);
    }
    
    // Add horror particles
    addHorrorParticles(config.bloodDripCount);
    
    // Activate effect
    conditionLayer.classList.add(config.className);
    currentSceneEffect = 'horror';
    
    // Dispatch audio event for radio
    window.dispatchEvent(new CustomEvent(config.audioEvent));
    
    console.log('[Condition FX] Horror triggered');
}

/**
 * Exit horror effect
 */
export function exitHorror() {
    exitSceneEffect('horror');
}

/**
 * Trigger The Pale (dreaming/unconscious)
 * Overlays on top of weather!
 */
export function triggerPale() {
    if (!conditionLayer) initConditionEffects();
    
    const config = SCENE_EFFECTS.pale;
    
    // Clear any existing scene effect
    if (currentSceneEffect) {
        exitSceneEffect(currentSceneEffect);
    }
    
    // Add pale particles
    addPaleParticles(config);
    
    // Activate effect
    conditionLayer.classList.add(config.className);
    currentSceneEffect = 'pale';
    
    // Dispatch audio event for radio
    window.dispatchEvent(new CustomEvent(config.audioEvent));
    
    console.log('[Condition FX] The Pale triggered');
}

/**
 * Exit The Pale
 */
export function exitPale() {
    exitSceneEffect('pale');
}

/**
 * Check if currently in The Pale
 */
export function isInPale() {
    return currentSceneEffect === 'pale';
}

/**
 * Generic scene effect exit
 */
function exitSceneEffect(effectName) {
    if (!conditionLayer) return;
    
    const config = SCENE_EFFECTS[effectName];
    if (!config) return;
    
    conditionLayer.classList.remove(config.className);
    
    // Clear particles
    if (effectName === 'horror') {
        clearHorrorParticles();
    } else if (effectName === 'pale') {
        clearPaleParticles();
    }
    
    // Dispatch audio stop event
    if (config.audioStopEvent) {
        window.dispatchEvent(new CustomEvent(config.audioStopEvent));
    }
    
    if (currentSceneEffect === effectName) {
        currentSceneEffect = null;
    }
    
    console.log(`[Condition FX] ${effectName} exited`);
}

/**
 * Add horror particles (blood drips)
 */
function addHorrorParticles(dripCount) {
    if (!conditionLayer) return;
    
    clearHorrorParticles();
    
    // Vignette
    const vignette = document.createElement('div');
    vignette.className = 'fx-horror-vignette';
    conditionLayer.appendChild(vignette);
    
    // Heartbeat pulse
    const heartbeat = document.createElement('div');
    heartbeat.className = 'fx-horror-heartbeat';
    conditionLayer.appendChild(heartbeat);
    
    // Flicker
    const flicker = document.createElement('div');
    flicker.className = 'fx-horror-flicker';
    conditionLayer.appendChild(flicker);
    
    // Blood drips
    for (let i = 0; i < dripCount; i++) {
        const drip = document.createElement('div');
        drip.className = 'fx-blood-drip';
        drip.style.left = `${10 + Math.random() * 80}%`;
        drip.style.animationDuration = `${3 + Math.random() * 4}s`;
        drip.style.animationDelay = `${Math.random() * 3}s`;
        conditionLayer.appendChild(drip);
    }
}

/**
 * Clear horror particles
 */
function clearHorrorParticles() {
    if (!conditionLayer) return;
    
    conditionLayer.querySelectorAll(
        '.fx-horror-vignette, .fx-horror-heartbeat, .fx-horror-flicker, .fx-blood-drip'
    ).forEach(el => el.remove());
}

/**
 * Add pale particles (wisps, symbols)
 */
function addPaleParticles(config) {
    if (!conditionLayer) return;
    
    clearPaleParticles();
    
    // Void overlay
    const voidEl = document.createElement('div');
    voidEl.className = 'fx-pale-void';
    conditionLayer.appendChild(voidEl);
    
    // Static
    const staticEl = document.createElement('div');
    staticEl.className = 'fx-pale-static';
    conditionLayer.appendChild(staticEl);
    
    // Shimmer
    const shimmer = document.createElement('div');
    shimmer.className = 'fx-pale-shimmer';
    conditionLayer.appendChild(shimmer);
    
    // Memory wisps
    for (let i = 0; i < config.wispCount; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'fx-memory-wisp';
        wisp.style.left = `${10 + Math.random() * 80}%`;
        wisp.style.top = `${10 + Math.random() * 80}%`;
        wisp.style.animationDuration = `${4 + Math.random() * 4}s`;
        wisp.style.animationDelay = `${Math.random() * 2}s`;
        conditionLayer.appendChild(wisp);
    }
    
    // Thought symbols
    const symbols = config.symbols || ['∞', '◊', '△', '○'];
    for (let i = 0; i < config.symbolCount; i++) {
        const symbol = document.createElement('div');
        symbol.className = 'fx-thought-symbol';
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        symbol.style.left = `${5 + Math.random() * 90}%`;
        symbol.style.top = `${20 + Math.random() * 60}%`;
        symbol.style.animationDuration = `${5 + Math.random() * 5}s`;
        symbol.style.animationDelay = `${Math.random() * 3}s`;
        conditionLayer.appendChild(symbol);
    }
}

/**
 * Clear pale particles
 */
function clearPaleParticles() {
    if (!conditionLayer) return;
    
    conditionLayer.querySelectorAll(
        '.fx-pale-void, .fx-pale-static, .fx-pale-shimmer, .fx-memory-wisp, .fx-thought-symbol'
    ).forEach(el => el.remove());
}

// ═══════════════════════════════════════════════════════════════
// AUTOMATIC HEALTH MONITORING
// ═══════════════════════════════════════════════════════════════

/**
 * Update health effects based on current vitals
 * Call this whenever health/morale changes
 * 
 * @param {number} healthPercent - Current health as 0-1
 * @param {number} moralePercent - Current morale as 0-1
 */
export function updateHealthEffects(healthPercent, moralePercent) {
    if (!conditionLayer) initConditionEffects();
    
    // Priority: dying > low-health > low-morale > none
    if (healthPercent < 0.15) {
        setHealthEffect('dying');
    } else if (healthPercent < 0.3) {
        setHealthEffect('low-health');
    } else if (moralePercent < 0.3) {
        setHealthEffect('low-morale');
    } else {
        clearHealthEffect();
    }
}

/**
 * Start automatic health monitoring from vitals state
 * Call this once on extension init
 */
export function startHealthMonitor() {
    // Check health every 2 seconds
    setInterval(() => {
        // Don't run if extension is disabled
        const settings = window.TribunalState?.getSettings?.();
        if (!settings?.enabled) return;
        
        checkVitalsForEffects();
    }, 2000);
    
    // Also listen for vitals change events
    window.addEventListener('tribunal:vitalsChanged', () => {
        const settings = window.TribunalState?.getSettings?.();
        if (!settings?.enabled) return;
        
        checkVitalsForEffects();
    });
    
    console.log('[Condition FX] Health monitor started');
}

function checkVitalsForEffects() {
    try {
        // Try to get vitals from state
        const { getChatState } = window.TribunalState || {};
        if (!getChatState) return;
        
        const state = getChatState();
        const vitals = state?.vitals || {};
        
        const health = vitals.health ?? 10;
        const maxHealth = vitals.maxHealth ?? 13;
        const morale = vitals.morale ?? 10;
        const maxMorale = vitals.maxMorale ?? 13;
        
        const healthPercent = health / maxHealth;
        const moralePercent = morale / maxMorale;
        
        updateHealthEffects(healthPercent, moralePercent);
    } catch (e) {
        // Silent fail - don't break things
    }
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION HOOK
// This is what inventory-effects.js calls
// ═══════════════════════════════════════════════════════════════

/**
 * Hook for inventory-effects.js triggerParticleEffect
 * Maps particle names to consumption effects
 */
export function triggerParticleEffect(effectType) {
    const mapping = {
        'smoke': 'smoke',
        'drunk': 'drunk',
        'stimulant': 'stimulant',
        'pale': null  // Pale is handled by weather system
    };
    
    const mappedEffect = mapping[effectType];
    if (mappedEffect) {
        triggerConsumptionEffect(mappedEffect);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS & GLOBAL ACCESS
// ═══════════════════════════════════════════════════════════════

// Expose globally for other modules
window.TribunalConditionFX = {
    init: initConditionEffects,
    triggerConsumption: triggerConsumptionEffect,
    setHealth: setHealthEffect,
    clearHealth: clearHealthEffect,
    // Scene effects (moved from weather!)
    triggerHorror,
    exitHorror,
    triggerPale,
    exitPale,
    isInPale,
    // Health monitor
    updateHealth: updateHealthEffects,
    startMonitor: startHealthMonitor,
    triggerParticleEffect,
    // Chat switch (NEW)
    resetState: resetConditionState,
    onChatChanged
};

export default {
    initConditionEffects,
    triggerConsumptionEffect,
    setHealthEffect,
    clearHealthEffect,
    triggerHorror,
    exitHorror,
    triggerPale,
    exitPale,
    isInPale,
    updateHealthEffects,
    startHealthMonitor,
    triggerParticleEffect,
    // Chat switch (NEW)
    resetConditionState,
    onChatChanged
};
