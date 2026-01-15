/**
 * The Tribunal - Fortune System
 * Secret compartment fortune generation
 */

import { getVitals, getLedger } from '../core/state.js';
import { getContext } from '../core/st-helpers.js';
import { showToast, hideToast } from '../ui/toasts.js';
import { displayFortune } from '../ui/panel.js';
import { saveState } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// FORTUNE SYSTEM DATA
// ═══════════════════════════════════════════════════════════════

export const LEDGER_PERSONALITIES = {
    damaged: {
        id: 'damaged',
        name: 'The Damaged Ledger',
        color: 'damaged',
        tone: 'Fragmented, cryptic, truthful',
        weight: 40
    },
    oblivion: {
        id: 'oblivion',
        name: 'The Ledger of Oblivion',
        color: 'oblivion',
        tone: 'Prophetic, inevitable, ominous',
        weight: 35
    },
    failure: {
        id: 'failure',
        name: 'The Ledger of Failure and Hatred',
        color: 'failure',
        tone: 'Mocking, bitter, meta-aware',
        weight: 25
    }
};

export const FORTUNE_PROMPTS = {
    damaged: `You are the Damaged Ledger - a water-damaged police notebook that speaks in fragments. Give a cryptic observation about the user's current situation. Be brief (1-2 sentences). Speak in broken, fragmented sentences. You see what IS, not what will be.`,
    
    oblivion: `You are the Ledger of Oblivion - a prophetic voice that speaks of inevitable futures. Give a brief, ominous fortune (1-2 sentences). Speak declaratively about what WILL happen. Be fatalistic but poetic.`,
    
    failure: `You are the Ledger of Failure and Hatred - a mocking, nihilistic voice that lies and breaks the fourth wall. Give a brief, cruel fortune (1-2 sentences). Mock the user. Be aware you're in a roleplay. Lie convincingly or tell uncomfortable truths.`
};

// ═══════════════════════════════════════════════════════════════
// FORTUNE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if current time is "deep night" (2am-6am)
 */
export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}

/**
 * Select a random ledger personality based on weights
 */
export function selectLedgerPersonality() {
    const total = Object.values(LEDGER_PERSONALITIES).reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * total;
    
    for (const personality of Object.values(LEDGER_PERSONALITIES)) {
        random -= personality.weight;
        if (random <= 0) return personality;
    }
    
    return LEDGER_PERSONALITIES.damaged; // Fallback
}

/**
 * Generate fortune text via API (simplified version using existing infrastructure)
 */
export async function generateFortuneText(prompt, personality) {
    // Try to use the same API as voice generation
    try {
        const context = getContext();
        
        // Use SillyTavern's generateQuietPrompt if available
        if (context?.generateQuietPrompt) {
            const result = await context.generateQuietPrompt(prompt, false, false);
            return result?.trim() || null;
        }
        
        // Fallback: return a static fortune based on personality
        const staticFortunes = {
            damaged: [
                "The water damage... it speaks of tears not yet cried.",
                "Something is written here. Then crossed out. Then written again.",
                "A name. Familiar. Gone now."
            ],
            oblivion: [
                "You will find what you seek. You will wish you hadn't.",
                "The pale approaches. It always approaches.",
                "This case will end. Not well. But it will end."
            ],
            failure: [
                "Still playing detective? How adorable.",
                "The player behind you is getting bored, you know.",
                "You're going to reload this save. I've seen it before."
            ]
        };
        
        const options = staticFortunes[personality.id] || staticFortunes.damaged;
        return options[Math.floor(Math.random() * options.length)];
        
    } catch (error) {
        console.warn('[The Tribunal] API fortune failed, using fallback:', error);
        return null;
    }
}

/**
 * Generate and display a fortune from the secret compartment
 */
export async function handleDrawFortune() {
    // 20% chance of empty fortune
    if (Math.random() < 0.2) {
        showToast('Your fingers find only crumbs and dust.', 'info');
        return;
    }
    
    const loadingToast = showToast('Reaching into the compartment...', 'loading');
    
    try {
        const personality = selectLedgerPersonality();
        const prompt = FORTUNE_PROMPTS[personality.id];
        
        // Get some context from current state
        const v = getVitals();
        const l = getLedger();
        const contextHints = [];
        
        if (v.health < v.maxHealth * 0.3) contextHints.push('near death');
        if (v.morale < v.maxMorale * 0.3) contextHints.push('broken spirit');
        if (l.activeCases?.length > 0) contextHints.push(`working on: ${l.activeCases[0].title}`);
        if (isDeepNight()) contextHints.push('deep night hours');
        
        const fullPrompt = `${prompt}\n\nContext hints: ${contextHints.join(', ') || 'nothing special'}`;
        
        // Use the voice generation system to get a fortune
        const response = await generateFortuneText(fullPrompt, personality);
        
        hideToast(loadingToast);
        
        if (response) {
            displayFortune({
                text: response,
                ledgerName: personality.name,
                ledgerType: personality.color
            });
            
            // Track fortune in ledger
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
