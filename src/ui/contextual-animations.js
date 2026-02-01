/**
 * The Tribunal - Contextual Animation Controller
 * Toggle animation states on tabs and FABs based on game state
 * 
 * Usage:
 *   import { TabAnimations, FabAnimations } from './contextual-animations.js';
 *   
 *   // Tab animations
 *   TabAnimations.setVoicesGenerating(true);
 *   TabAnimations.setHealthLow(true);
 *   TabAnimations.triggerThoughtDiscovered(); // One-shot animation
 *   
 *   // FAB animations  
 *   FabAnimations.setUrgent(true);
 *   FabAnimations.setScanning(true);
 */

// ═══════════════════════════════════════════════════════════════
// TAB ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const TabAnimations = {
    // Get tab element by name
    _getTab(name) {
        return document.querySelector(`.ie-tab[data-tab="${name}"]`);
    },
    
    // Generic toggle
    _toggle(tabName, className, state) {
        const tab = this._getTab(tabName);
        if (tab) {
            tab.classList.toggle(className, state);
        }
    },
    
    // One-shot animation (add class, remove after animation)
    _oneShot(tabName, className, duration = 600) {
        const tab = this._getTab(tabName);
        if (tab) {
            tab.classList.add(className);
            setTimeout(() => tab.classList.remove(className), duration);
        }
    },
    
    // ─── VOICES TAB ───────────────────────────────────────────
    setVoicesGenerating(active) {
        this._toggle('voices', 'voices-generating', active);
    },
    
    setVoicesReady(active) {
        this._toggle('voices', 'voices-ready', active);
    },
    
    // ─── CABINET TAB ──────────────────────────────────────────
    setThoughtReady(active) {
        this._toggle('cabinet', 'thought-ready', active);
    },
    
    triggerThoughtDiscovered() {
        this._oneShot('cabinet', 'thought-discovered', 500);
    },
    
    setResearching(active) {
        this._toggle('cabinet', 'researching', active);
    },
    
    // ─── STATUS TAB ───────────────────────────────────────────
    setHealthLow(active) {
        this._toggle('status', 'health-low', active);
        // Remove critical if just low
        if (active) {
            this._toggle('status', 'health-critical', false);
        }
    },
    
    setHealthCritical(active) {
        this._toggle('status', 'health-critical', active);
        // Critical implies low
        if (active) {
            this._toggle('status', 'health-low', false);
        }
    },
    
    setMoraleLow(active) {
        this._toggle('status', 'morale-low', active);
    },
    
    setConditionActive(active) {
        this._toggle('status', 'condition-active', active);
    },
    
    setConditionHorror(active) {
        this._toggle('status', 'condition-horror', active);
    },
    
    setConditionPale(active) {
        this._toggle('status', 'condition-pale', active);
    },
    
    // ─── LEDGER TAB ───────────────────────────────────────────
    triggerCaseUpdated() {
        this._oneShot('ledger', 'case-updated', 600);
    },
    
    setHasUnread(active) {
        this._toggle('ledger', 'has-unread', active);
    },
    
    // ─── INVENTORY TAB ────────────────────────────────────────
    triggerItemAdded() {
        this._oneShot('inventory', 'item-added', 400);
    },
    
    setLowSupplies(active) {
        this._toggle('inventory', 'low-supplies', active);
    },
    
    // ─── RADIO SUBTAB (under Inventory) ───────────────────────
    _getRadioSubtab() {
        return document.querySelector('.inventory-sub-tab[data-subtab="radio"]');
    },
    
    setRadioPlaying(active) {
        const subtab = this._getRadioSubtab();
        if (subtab) {
            subtab.classList.toggle('radio-playing', active);
            if (active) subtab.classList.remove('radio-static');
        }
    },
    
    setRadioStatic(active) {
        const subtab = this._getRadioSubtab();
        if (subtab) {
            subtab.classList.toggle('radio-static', active);
        }
    },
    
    // ─── UTILITY ──────────────────────────────────────────────
    clearAll() {
        const allClasses = [
            'voices-generating', 'voices-ready',
            'thought-ready', 'thought-discovered', 'researching',
            'health-low', 'health-critical', 'morale-low', 
            'condition-active', 'condition-horror', 'condition-pale',
            'case-updated', 'has-unread',
            'item-added', 'low-supplies'
        ];
        
        document.querySelectorAll('.ie-tab').forEach(tab => {
            allClasses.forEach(cls => tab.classList.remove(cls));
        });
        
        // Clear radio subtab animations
        const radioSubtab = this._getRadioSubtab();
        if (radioSubtab) {
            radioSubtab.classList.remove('radio-playing', 'radio-static');
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// FAB ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const FabAnimations = {
    _getMainFab() {
        return document.getElementById('inland-empire-fab');
    },
    
    _getInvestigationFab() {
        return document.getElementById('tribunal-investigation-fab');
    },
    
    _toggle(fab, className, state) {
        if (fab) {
            fab.classList.toggle(className, state);
        }
    },
    
    _oneShot(fab, className, duration = 600) {
        if (fab) {
            fab.classList.add(className);
            setTimeout(() => fab.classList.remove(className), duration);
        }
    },
    
    // ─── MAIN FAB ─────────────────────────────────────────────
    setHasNotification(active) {
        this._toggle(this._getMainFab(), 'has-notification', active);
    },
    
    setUrgent(active) {
        this._toggle(this._getMainFab(), 'urgent', active);
    },
    
    setVoicesActive(active) {
        this._toggle(this._getMainFab(), 'voices-active', active);
    },
    
    // ─── INVESTIGATION FAB ────────────────────────────────────
    setScanning(active) {
        this._toggle(this._getInvestigationFab(), 'scanning', active);
    },
    
    setReady(active) {
        this._toggle(this._getInvestigationFab(), 'ready', active);
    },
    
    triggerFoundClue() {
        this._oneShot(this._getInvestigationFab(), 'found-clue', 1000);
    },
    
    // ─── UTILITY ──────────────────────────────────────────────
    clearAll() {
        const mainFab = this._getMainFab();
        const invFab = this._getInvestigationFab();
        
        const classes = ['has-notification', 'urgent', 'voices-active', 
                        'scanning', 'ready', 'found-clue'];
        
        [mainFab, invFab].forEach(fab => {
            if (fab) {
                classes.forEach(cls => fab.classList.remove(cls));
            }
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// AUTO-UPDATE FROM STATE (Optional integration helper)
// ═══════════════════════════════════════════════════════════════

/**
 * Update all animations based on current game state
 * Call this periodically or after state changes
 * 
 * @param {Object} state - Current state object
 * @param {number} state.health - Current health (0-max)
 * @param {number} state.maxHealth - Maximum health
 * @param {number} state.morale - Current morale (0-max)
 * @param {number} state.maxMorale - Maximum morale
 * @param {boolean} state.voicesGenerating - Are voices being generated
 * @param {boolean} state.hasNewVoices - Are there unread voices
 * @param {boolean} state.thoughtReady - Is a thought ready to internalize
 * @param {boolean} state.isResearching - Is a thought being researched
 * @param {boolean} state.horrorActive - Is horror effect active
 * @param {boolean} state.paleActive - Is pale effect active
 * @param {boolean} state.radioPlaying - Is radio playing
 */
export function updateAnimationsFromState(state) {
    if (!state) return;
    
    // Health states
    if (state.health !== undefined && state.maxHealth) {
        const healthPercent = (state.health / state.maxHealth) * 100;
        TabAnimations.setHealthCritical(healthPercent < 15);
        TabAnimations.setHealthLow(healthPercent >= 15 && healthPercent < 30);
        
        // Urgent FAB if critical
        FabAnimations.setUrgent(healthPercent < 15);
    }
    
    // Morale states
    if (state.morale !== undefined && state.maxMorale) {
        const moralePercent = (state.morale / state.maxMorale) * 100;
        TabAnimations.setMoraleLow(moralePercent < 30);
    }
    
    // Voice states
    if (state.voicesGenerating !== undefined) {
        TabAnimations.setVoicesGenerating(state.voicesGenerating);
        FabAnimations.setVoicesActive(state.voicesGenerating);
    }
    
    if (state.hasNewVoices !== undefined) {
        TabAnimations.setVoicesReady(state.hasNewVoices);
    }
    
    // Cabinet states
    if (state.thoughtReady !== undefined) {
        TabAnimations.setThoughtReady(state.thoughtReady);
    }
    
    if (state.isResearching !== undefined) {
        TabAnimations.setResearching(state.isResearching);
    }
    
    // Condition effects
    if (state.horrorActive !== undefined) {
        TabAnimations.setConditionHorror(state.horrorActive);
    }
    
    if (state.paleActive !== undefined) {
        TabAnimations.setConditionPale(state.paleActive);
    }
    
    // Radio
    if (state.radioPlaying !== undefined) {
        TabAnimations.setRadioPlaying(state.radioPlaying);
    }
}

// ═══════════════════════════════════════════════════════════════
// DEBUG - Expose globally for testing
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalDebug = window.TribunalDebug || {};
    window.TribunalDebug.TabAnimations = TabAnimations;
    window.TribunalDebug.FabAnimations = FabAnimations;
    window.TribunalDebug.updateAnimationsFromState = updateAnimationsFromState;
}
