/**
 * The Tribunal - Global API
 * window.InlandEmpire for external extension integration
 */

import { SKILLS } from '../data/skills.js';
import {
    extensionSettings,
    activeStatuses,
    currentBuild,
    saveState,
    getEffectiveSkillLevel,
    getVitals,
    setHealth,
    setMorale,
    modifyHealth,
    modifyMorale,
    getLedger
} from './state.js';
import { getContext } from './st-helpers.js';
import { getResearchPenalties } from '../systems/cabinet.js';
import { rollSkillCheck } from '../systems/dice.js';
import { triggerVoices } from './trigger.js';
import { togglePanel, updateCompartmentCrack, generateCaseCode } from '../ui/panel.js';
import { updateFABState } from './st-helpers.js';
import { showToast } from '../ui/toasts.js';
import { analyzeTextForVitals } from '../systems/vitals/hooks.js';
import { refreshVitals, refreshLedgerDisplay, checkCompartmentProgress } from './ui-handlers.js';
import { isDeepNight } from '../systems/fortune.js';

// ═══════════════════════════════════════════════════════════════
// GLOBAL API CREATION
// ═══════════════════════════════════════════════════════════════

export function createGlobalAPI() {
    window.InlandEmpire = {
        // Version for compatibility checks
        version: '3.0.0',
        
        // ─────────────────────────────────────────────────────────
        // READ: Skill & State Queries
        // ─────────────────────────────────────────────────────────
        getSkills: () => ({ ...SKILLS }),
        getSkillData: (skillId) => SKILLS[skillId] ? { ...SKILLS[skillId] } : null,
        getSkillLevel: (skillId) => currentBuild[skillId] || 1,
        getEffectiveSkillLevel: (skillId) => {
            const base = getEffectiveSkillLevel(skillId, getResearchPenalties());
            const external = window.InlandEmpire._externalModifiers[skillId] || 0;
            return base + external;
        },
        getActiveStatuses: () => [...activeStatuses],
        isEnabled: () => extensionSettings.enabled,
        
        // ─────────────────────────────────────────────────────────
        // WRITE: External Modifier Registry
        // ─────────────────────────────────────────────────────────
        _externalModifiers: {},
        _modifierSources: {},
        
        /**
         * Register a modifier from an external source
         */
        registerModifier: (sourceId, skillId, value) => {
            const api = window.InlandEmpire;
            
            if (!api._modifierSources[sourceId]) {
                api._modifierSources[sourceId] = {};
            }
            
            const oldValue = api._modifierSources[sourceId][skillId] || 0;
            api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - oldValue;
            
            api._modifierSources[sourceId][skillId] = value;
            api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) + value;
            
            console.log(`[The Tribunal API] Modifier registered: ${sourceId} → ${skillId} ${value >= 0 ? '+' : ''}${value}`);
            
            document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                detail: { sourceId, skillId, value, totals: { ...api._externalModifiers } }
            }));
        },
        
        /**
         * Remove all modifiers from a source
         */
        removeModifierSource: (sourceId) => {
            const api = window.InlandEmpire;
            const source = api._modifierSources[sourceId];
            
            if (!source) return;
            
            for (const [skillId, value] of Object.entries(source)) {
                api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - value;
                if (api._externalModifiers[skillId] === 0) {
                    delete api._externalModifiers[skillId];
                }
            }
            
            delete api._modifierSources[sourceId];
            console.log(`[The Tribunal API] Modifier source removed: ${sourceId}`);
            
            document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                detail: { sourceId, removed: true, totals: { ...api._externalModifiers } }
            }));
        },
        
        /**
         * Get all modifiers from a specific source
         */
        getModifiersFromSource: (sourceId) => {
            return { ...window.InlandEmpire._modifierSources[sourceId] } || {};
        },
        
        /**
         * Get total external modifier for a skill
         */
        getExternalModifier: (skillId) => {
            return window.InlandEmpire._externalModifiers[skillId] || 0;
        },
        
        // ─────────────────────────────────────────────────────────
        // ACTIONS: Trigger things
        // ─────────────────────────────────────────────────────────
        
        /**
         * Roll a skill check
         */
        rollCheck: (skillId, difficulty) => {
            const effectiveLevel = window.InlandEmpire.getEffectiveSkillLevel(skillId);
            const result = rollSkillCheck(effectiveLevel, difficulty);
            
            document.dispatchEvent(new CustomEvent('ie:skill-check', {
                detail: { skillId, difficulty, effectiveLevel, ...result }
            }));
            
            // Check compartment progress on critical failure during deep night
            if (result.isSnakeEyes && isDeepNight()) {
                checkCompartmentProgress();
            }
            
            return result;
        },
        
        /**
         * Trigger the voice generation manually
         */
        triggerVoices: () => triggerVoices(getContext()),
        
        /**
         * Open/close the Psyche panel
         */
        togglePanel: () => togglePanel(),
        
        /**
         * Update FAB visibility
         */
        updateFABState: () => updateFABState(),
        
        // ─────────────────────────────────────────────────────────
        // Vitals API
        // ─────────────────────────────────────────────────────────
        
        getVitals: () => getVitals(),
        
        setHealth: (value) => {
            setHealth(value, getContext());
            refreshVitals();
        },
        
        setMorale: (value) => {
            setMorale(value, getContext());
            refreshVitals();
        },
        
        modifyHealth: (delta) => {
            modifyHealth(delta, getContext());
            refreshVitals();
        },
        
        modifyMorale: (delta) => {
            modifyMorale(delta, getContext());
            refreshVitals();
        },
        
        // ─────────────────────────────────────────────────────────
        // Vitals Detection API
        // ─────────────────────────────────────────────────────────
        
        /**
         * Analyze text for vitals impacts without applying
         */
        analyzeVitals: (text) => {
            return analyzeTextForVitals(text, {
                protagonistName: extensionSettings.characterName,
                sensitivity: extensionSettings.vitalsSensitivity || 'medium'
            });
        },
        
        /**
         * Manually trigger vitals change with reason
         */
        applyVitalsChange: (healthDelta, moraleDelta, reason = 'manual') => {
            if (healthDelta !== 0) {
                modifyHealth(healthDelta, getContext());
            }
            if (moraleDelta !== 0) {
                modifyMorale(moraleDelta, getContext());
            }
            refreshVitals();
            
            if (extensionSettings.vitalsShowNotifications) {
                const parts = [];
                if (healthDelta !== 0) parts.push(`Health ${healthDelta > 0 ? '+' : ''}${healthDelta}`);
                if (moraleDelta !== 0) parts.push(`Morale ${moraleDelta > 0 ? '+' : ''}${moraleDelta}`);
                showToast(`${parts.join(', ')} (${reason})`, healthDelta < 0 || moraleDelta < 0 ? 'warning' : 'success');
            }
            
            document.dispatchEvent(new CustomEvent('ie:vitals-changed', {
                detail: { healthDelta, moraleDelta, reason }
            }));
        },
        
        // ─────────────────────────────────────────────────────────
        // Ledger API
        // ─────────────────────────────────────────────────────────
        
        getLedger: () => getLedger(),
        
        /**
         * Add a case to the ledger
         */
        addCase: (title, description = '') => {
            const l = getLedger();
            const caseCount = (l.activeCases?.length || 0) + (l.completedCases?.length || 0) + 1;
            
            const newCase = {
                id: `case_${Date.now()}`,
                code: generateCaseCode(41, caseCount),
                title: title.toUpperCase(),
                description,
                status: 'active',
                session: l.officerProfile?.sessions || 1,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                created: Date.now()
            };
            
            if (!l.activeCases) l.activeCases = [];
            l.activeCases.push(newCase);
            
            saveState(getContext());
            refreshLedgerDisplay();
            return newCase;
        },
        
        /**
         * Check if compartment is discovered
         */
        isCompartmentDiscovered: () => {
            const l = getLedger();
            return l.compartment?.discovered || false;
        },
        
        /**
         * Force reveal the compartment (for testing/cheats)
         */
        revealCompartment: () => {
            const l = getLedger();
            if (!l.compartment) {
                l.compartment = { discovered: false, deepNightCritFails: 0, crackStage: 0 };
            }
            l.compartment.discovered = true;
            l.compartment.crackStage = 3;
            updateCompartmentCrack(3);
            saveState(getContext());
            showToast('Compartment revealed', 'info');
        }
    };
    
    console.log('[The Tribunal] Global API ready: window.InlandEmpire');
    
    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('ie:ready', { 
        detail: { version: window.InlandEmpire.version } 
    }));
}
