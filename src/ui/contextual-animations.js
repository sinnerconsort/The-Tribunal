/**
 * The Tribunal - Contextual Animations (Self-Initializing)
 * Automatically hooks into existing events - just import and forget!
 * 
 * Listens for:
 *   - tribunal:vitalsChanged → health/morale animations
 *   - tribunal:effectApplied/Removed → status effect animations
 *   - tribunal:voicesGenerating/Complete → voice tab animations
 *   - tribunal:thoughtDiscovered/Ready → cabinet animations
 *   - tribunal:investigationStart/Complete → FAB animations
 */

// ═══════════════════════════════════════════════════════════════
// TAB ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════

function getTab(name) {
    return document.querySelector(`.ie-tab[data-tab="${name}"]`);
}

function toggleTabClass(tabName, className, state) {
    const tab = getTab(tabName);
    if (tab) {
        tab.classList.toggle(className, state);
    }
}

function oneShotTabAnimation(tabName, className, duration = 600) {
    const tab = getTab(tabName);
    if (tab) {
        tab.classList.add(className);
        setTimeout(() => tab.classList.remove(className), duration);
    }
}

// ═══════════════════════════════════════════════════════════════
// FAB ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════

function getMainFab() {
    return document.getElementById('inland-empire-fab');
}

function getInvestigationFab() {
    return document.getElementById('tribunal-investigation-fab');
}

function toggleFabClass(fab, className, state) {
    if (fab) {
        fab.classList.toggle(className, state);
    }
}

// ═══════════════════════════════════════════════════════════════
// VITALS HANDLER - Health & Morale
// ═══════════════════════════════════════════════════════════════

function handleVitalsChanged(event) {
    const { health, maxHealth, morale, maxMorale } = event.detail;
    
    // Calculate percentages
    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 100;
    const moralePercent = maxMorale > 0 ? (morale / maxMorale) * 100 : 100;
    
    const statusTab = getTab('status');
    const mainFab = getMainFab();
    
    if (statusTab) {
        // Clear previous states
        statusTab.classList.remove('health-low', 'health-critical', 'morale-low');
        
        // Apply health state
        if (healthPercent < 15) {
            statusTab.classList.add('health-critical');
        } else if (healthPercent < 30) {
            statusTab.classList.add('health-low');
        }
        
        // Apply morale state
        if (moralePercent < 30) {
            statusTab.classList.add('morale-low');
        }
    }
    
    // FAB urgent state for critical health
    if (mainFab) {
        toggleFabClass(mainFab, 'urgent', healthPercent < 15 || moralePercent < 15);
    }
    
    console.log(`[Animations] Vitals: H${healthPercent.toFixed(0)}% M${moralePercent.toFixed(0)}%`);
}

// ═══════════════════════════════════════════════════════════════
// STATUS EFFECT HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleEffectApplied(event) {
    const statusTab = getTab('status');
    if (statusTab) {
        statusTab.classList.add('condition-active');
    }
    
    // Check for special conditions (horror/pale)
    const effectId = event.detail?.id || event.detail?.effectId;
    if (effectId === 'the_pale' || effectId === 'dissociated') {
        toggleTabClass('status', 'condition-pale', true);
    }
    if (effectId === 'caustic_echo' || effectId === 'terrified') {
        toggleTabClass('status', 'condition-horror', true);
    }
}

function handleEffectRemoved(event) {
    const effectId = event.detail?.id || event.detail?.effectId;
    
    // Remove specific condition classes
    if (effectId === 'the_pale' || effectId === 'dissociated') {
        toggleTabClass('status', 'condition-pale', false);
    }
    if (effectId === 'caustic_echo' || effectId === 'terrified') {
        toggleTabClass('status', 'condition-horror', false);
    }
    
    // Check if any effects remain active
    const hasActiveEffects = document.querySelectorAll('.rcm-checkbox.rcm-checked').length > 0;
    toggleTabClass('status', 'condition-active', hasActiveEffects);
}

// ═══════════════════════════════════════════════════════════════
// VOICE GENERATION HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleVoicesGenerating() {
    toggleTabClass('voices', 'voices-generating', true);
    toggleFabClass(getMainFab(), 'voices-active', true);
}

function handleVoicesComplete() {
    toggleTabClass('voices', 'voices-generating', false);
    toggleTabClass('voices', 'voices-ready', true);
    toggleFabClass(getMainFab(), 'voices-active', false);
    
    // Clear "ready" state after user presumably sees it
    setTimeout(() => {
        toggleTabClass('voices', 'voices-ready', false);
    }, 5000);
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleThoughtDiscovered() {
    oneShotTabAnimation('cabinet', 'thought-discovered', 500);
    toggleTabClass('cabinet', 'thought-ready', true);
}

function handleThoughtInternalized() {
    toggleTabClass('cabinet', 'thought-ready', false);
    toggleTabClass('cabinet', 'researching', false);
}

function handleThoughtResearching() {
    toggleTabClass('cabinet', 'researching', true);
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION FAB HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleInvestigationStart() {
    toggleFabClass(getInvestigationFab(), 'scanning', true);
}

function handleInvestigationComplete(event) {
    const fab = getInvestigationFab();
    toggleFabClass(fab, 'scanning', false);
    
    // If something was found, do the sparkle
    if (event.detail?.foundSomething) {
        fab?.classList.add('found-clue');
        setTimeout(() => fab?.classList.remove('found-clue'), 1000);
    }
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleItemAdded() {
    oneShotTabAnimation('inventory', 'item-added', 400);
}

// ═══════════════════════════════════════════════════════════════
// LEDGER HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleCaseUpdated() {
    oneShotTabAnimation('ledger', 'case-updated', 600);
    toggleTabClass('ledger', 'has-unread', true);
}

// ═══════════════════════════════════════════════════════════════
// RADIO HANDLERS (subtab under inventory)
// ═══════════════════════════════════════════════════════════════

function getRadioSubtab() {
    return document.querySelector('.inventory-sub-tab[data-subtab="radio"]');
}

function handleRadioStateChange(event) {
    const subtab = getRadioSubtab();
    if (!subtab) return;
    
    const { playing, tuning } = event.detail || {};
    
    subtab.classList.toggle('radio-playing', !!playing);
    subtab.classList.toggle('radio-static', !!tuning && !playing);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION - Auto-hook into events
// ═══════════════════════════════════════════════════════════════

function init() {
    // Vitals
    window.addEventListener('tribunal:vitalsChanged', handleVitalsChanged);
    
    // Status effects
    window.addEventListener('tribunal:effectApplied', handleEffectApplied);
    window.addEventListener('tribunal:effectRemoved', handleEffectRemoved);
    
    // Voice generation
    window.addEventListener('tribunal:voicesGenerating', handleVoicesGenerating);
    window.addEventListener('tribunal:voicesComplete', handleVoicesComplete);
    window.addEventListener('tribunal:voiceGenerationStart', handleVoicesGenerating);
    window.addEventListener('tribunal:voiceGenerationComplete', handleVoicesComplete);
    
    // Thought cabinet
    window.addEventListener('tribunal:thoughtDiscovered', handleThoughtDiscovered);
    window.addEventListener('tribunal:thoughtInternalized', handleThoughtInternalized);
    window.addEventListener('tribunal:thoughtResearching', handleThoughtResearching);
    
    // Investigation
    window.addEventListener('tribunal:investigationStart', handleInvestigationStart);
    window.addEventListener('tribunal:investigationComplete', handleInvestigationComplete);
    
    // Inventory
    window.addEventListener('tribunal:itemAdded', handleItemAdded);
    
    // Ledger
    window.addEventListener('tribunal:caseUpdated', handleCaseUpdated);
    
    // Radio
    window.addEventListener('tribunal:radioStateChange', handleRadioStateChange);
    
    console.log('[Tribunal] Contextual animations initialized');
}

// ═══════════════════════════════════════════════════════════════
// MANUAL TRIGGERS (for testing or direct use)
// ═══════════════════════════════════════════════════════════════

export const TabAnimations = {
    setVoicesGenerating: (active) => toggleTabClass('voices', 'voices-generating', active),
    setVoicesReady: (active) => toggleTabClass('voices', 'voices-ready', active),
    
    setThoughtReady: (active) => toggleTabClass('cabinet', 'thought-ready', active),
    triggerThoughtDiscovered: () => oneShotTabAnimation('cabinet', 'thought-discovered', 500),
    setResearching: (active) => toggleTabClass('cabinet', 'researching', active),
    
    setHealthLow: (active) => toggleTabClass('status', 'health-low', active),
    setHealthCritical: (active) => toggleTabClass('status', 'health-critical', active),
    setMoraleLow: (active) => toggleTabClass('status', 'morale-low', active),
    setConditionActive: (active) => toggleTabClass('status', 'condition-active', active),
    setConditionHorror: (active) => toggleTabClass('status', 'condition-horror', active),
    setConditionPale: (active) => toggleTabClass('status', 'condition-pale', active),
    
    triggerCaseUpdated: () => oneShotTabAnimation('ledger', 'case-updated', 600),
    setHasUnread: (active) => toggleTabClass('ledger', 'has-unread', active),
    
    triggerItemAdded: () => oneShotTabAnimation('inventory', 'item-added', 400),
    setLowSupplies: (active) => toggleTabClass('inventory', 'low-supplies', active),
    
    setRadioPlaying: (active) => {
        const subtab = getRadioSubtab();
        if (subtab) {
            subtab.classList.toggle('radio-playing', active);
            if (active) subtab.classList.remove('radio-static');
        }
    },
    setRadioStatic: (active) => {
        const subtab = getRadioSubtab();
        if (subtab) subtab.classList.toggle('radio-static', active);
    }
};

export const FabAnimations = {
    setHasNotification: (active) => toggleFabClass(getMainFab(), 'has-notification', active),
    setUrgent: (active) => toggleFabClass(getMainFab(), 'urgent', active),
    setVoicesActive: (active) => toggleFabClass(getMainFab(), 'voices-active', active),
    
    setScanning: (active) => toggleFabClass(getInvestigationFab(), 'scanning', active),
    setReady: (active) => toggleFabClass(getInvestigationFab(), 'ready', active),
    triggerFoundClue: () => {
        const fab = getInvestigationFab();
        if (fab) {
            fab.classList.add('found-clue');
            setTimeout(() => fab.classList.remove('found-clue'), 1000);
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// AUTO-INIT ON LOAD
// ═══════════════════════════════════════════════════════════════

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Also expose for debugging
if (typeof window !== 'undefined') {
    window.TribunalDebug = window.TribunalDebug || {};
    window.TribunalDebug.TabAnimations = TabAnimations;
    window.TribunalDebug.FabAnimations = FabAnimations;
}
