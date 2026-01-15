/**
 * Ledger & Fortune Handlers
 * Extracted from index.js for maintainability
 * Handles case management, fortune drawing, and compartment progression
 */

import {
    LEDGER_PERSONALITIES,
    FORTUNE_PROMPTS,
    selectLedgerPersonality,
    getStaticFortune,
    isDeepNight
} from '../data/fortune.js';

import {
    getLedger,
    getVitals,
    saveState
} from '../core/state.js';

import {
    generateCaseCode,
    updateCompartmentCrack,
    displayFortune
} from './panel.js';

import { showToast, hideToast } from './toasts.js';

// ═══════════════════════════════════════════════════════════════
// CASE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function handleAddCase(getContext, refreshLedgerDisplay) {
    const title = prompt('Enter case title (e.g., "THE HANGED MAN"):');
    if (!title) return;
    
    const description = prompt('Brief description (optional):') || '';
    
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
    showToast(`Case opened: ${newCase.code}`, 'success');
}

// ═══════════════════════════════════════════════════════════════
// FORTUNE SYSTEM
// ═══════════════════════════════════════════════════════════════

export async function handleDrawFortune(getContext) {
    // 20% chance of empty wrapper
    if (Math.random() < 0.2) {
        showToast('Your fingers find only crumbs and dust.', 'info');
        return;
    }
    
    const loadingToast = showToast('Reaching into the compartment...', 'loading');
    
    try {
        const personality = selectLedgerPersonality();
        const prompt = FORTUNE_PROMPTS[personality.id];
        
        const v = getVitals();
        const l = getLedger();
        const contextHints = [];
        
        if (v.health < v.maxHealth * 0.3) contextHints.push('near death');
        if (v.morale < v.maxMorale * 0.3) contextHints.push('broken spirit');
        if (l.activeCases?.length > 0) contextHints.push(`working on: ${l.activeCases[0].title}`);
        if (isDeepNight()) contextHints.push('deep night hours');
        
        const fullPrompt = `${prompt}\n\nContext hints: ${contextHints.join(', ') || 'nothing special'}`;
        
        const response = await generateFortuneText(fullPrompt, personality, getContext);
        
        hideToast(loadingToast);
        
        if (response) {
            displayFortune({
                text: response,
                ledgerName: personality.name,
                ledgerType: personality.color
            });
            
            const ledger = getLedger();
            if (!ledger.fortunes) ledger.fortunes = [];
            ledger.fortunes.push({
                text: response,
                personality: personality.id,
                timestamp: Date.now()
            });
            saveState(getContext());
        } else {
            showToast('The wrapper is blank.', 'info');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('[The Tribunal] Fortune generation failed:', error);
        showToast('The fortune crumbles to dust.', 'error');
    }
}

async function generateFortuneText(prompt, personality, getContext) {
    try {
        const context = getContext();
        
        if (context?.generateQuietPrompt) {
            const result = await context.generateQuietPrompt(prompt, false, false);
            return result?.trim() || null;
        }
        
        // Fallback to static fortune
        return getStaticFortune(personality.id);
        
    } catch (error) {
        console.warn('[The Tribunal] API fortune failed, using fallback:', error);
        return getStaticFortune(personality.id);
    }
}

// ═══════════════════════════════════════════════════════════════
// SECRET COMPARTMENT PROGRESSION
// ═══════════════════════════════════════════════════════════════

export function checkCompartmentProgress(getContext) {
    const l = getLedger();
    if (!l.compartment) {
        l.compartment = {
            discovered: false,
            deepNightCritFails: 0,
            crackStage: 0,
            timesOpened: 0,
            lastOpened: null,
            countedThisSession: false
        };
    }
    
    if (l.compartment.discovered) return;
    if (l.compartment.countedThisSession) return;
    if (!isDeepNight()) return;
    
    l.compartment.countedThisSession = true;
    l.compartment.deepNightCritFails++;
    
    if (l.compartment.deepNightCritFails >= 3) {
        l.compartment.crackStage = 3;
        l.compartment.discovered = true;
        showToast('Something shifts in the binding. A smell. Apricot.', 'info', 5000);
    } else if (l.compartment.deepNightCritFails >= 2) {
        l.compartment.crackStage = 2;
    } else if (l.compartment.deepNightCritFails >= 1) {
        l.compartment.crackStage = 1;
    }
    
    updateCompartmentCrack(l.compartment.crackStage);
    saveState(getContext());
}

// ═══════════════════════════════════════════════════════════════
// NOTES HANDLING
// ═══════════════════════════════════════════════════════════════

export function handleLedgerNotesChange(e, getContext) {
    const l = getLedger();
    l.notes = e.target.value;
    saveState(getContext());
}
