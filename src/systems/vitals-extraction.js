/**
 * The Tribunal - Vitals Extraction
 * 
 * THE MISSING PIECE: Extracts HP/Morale changes from AI responses
 * and updates state accordingly.
 * 
 * v2.0 - DEATH SYSTEM INTEGRATION
 * Now checks for death before applying damage, triggers skill checks
 * 
 * Call processMessageVitals() on MESSAGE_RECEIVED to auto-update vitals.
 */

// ═══════════════════════════════════════════════════════════════
// DAMAGE/HEAL PATTERNS
// ═══════════════════════════════════════════════════════════════

/**
 * Patterns that indicate HEALTH damage
 */
const HEALTH_DAMAGE_PATTERNS = [
    // Explicit damage numbers
    /(?:you\s+)?(?:take|receive|suffer)\s+(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?(?:damage|injury|harm)/gi,
    /(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?(?:damage|injury|harm)\s+(?:to\s+you|dealt)/gi,
    
    // Physical harm descriptions (estimate 1-3 damage)
    /(?:you\s+(?:are|get)\s+)?(?:shot|stabbed|slashed|cut|burned|punched|kicked|hit|struck|wounded)/gi,
    /(?:bullet|knife|blade|fist)\s+(?:hits?|strikes?|pierces?)\s+(?:you|your)/gi,
    
    // Health critical
    /(?:you\s+)?(?:collapse|fall\s+unconscious|black\s*out|pass\s*out)/gi,
    /(?:your\s+)?health\s+(?:drops?|falls?|plummets?)/gi,
    
    // Disco Elysium style
    /\[HEALTH\s*[-–]\s*(\d+)\]/gi,
    /HEALTH:\s*[-–]\s*(\d+)/gi,
    /-(\d+)\s+HEALTH/gi,
];

/**
 * Patterns that indicate HEALTH healing
 */
const HEALTH_HEAL_PATTERNS = [
    // Explicit healing numbers
    /(?:you\s+)?(?:heal|recover|restore|regain)\s+(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?(?:health|hp|hit\s*points?)/gi,
    /(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?(?:health|hp)\s+(?:restored|recovered|healed)/gi,
    
    // Medicine/treatment (estimate 2-3 healing)
    /(?:you\s+)?(?:apply|use|take)\s+(?:a\s+)?(?:bandage|medkit|medicine|pills?|painkillers?)/gi,
    /(?:wounds?\s+)?(?:are\s+)?(?:bandaged|treated|dressed|healed)/gi,
    
    // Sleep/rest (estimate 3-4 healing)
    /(?:you\s+)?(?:fall\s+asleep|drift\s+off|sleep|rest|nap|doze)/gi,
    /(?:you\s+)?(?:wake\s+up|awaken)\s+(?:feeling\s+)?(?:better|refreshed|rested|restored)/gi,
    /(?:a\s+)?(?:good\s+)?(?:night'?s?\s+)?(?:sleep|rest)\s+(?:helps?|heals?|restores?)/gi,
    /(?:you\s+)?(?:get\s+some\s+)?(?:sleep|rest|shut-?eye)/gi,
    
    // Food/eating (estimate 1-2 healing)
    /(?:you\s+)?(?:eat|consume|have)\s+(?:a\s+)?(?:meal|food|breakfast|lunch|dinner|snack)/gi,
    /(?:the\s+)?(?:food|meal)\s+(?:helps?|restores?|nourishes?)/gi,
    /(?:you\s+)?(?:feel\s+)?(?:nourished|fed|satiated|full)/gi,
    
    // Disco Elysium style
    /\[HEALTH\s*\+\s*(\d+)\]/gi,
    /HEALTH:\s*\+\s*(\d+)/gi,
    /\+(\d+)\s+HEALTH/gi,
];

/**
 * Patterns that indicate MORALE damage
 */
const MORALE_DAMAGE_PATTERNS = [
    // Explicit morale damage
    /(?:you\s+)?(?:take|receive|suffer)\s+(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?(?:morale|psychic|mental)\s+(?:damage|harm)/gi,
    /(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?morale\s+(?:damage|lost)/gi,
    
    // Emotional harm descriptions (estimate 1-3 damage)
    /(?:you\s+(?:are|feel)\s+)?(?:devastated|crushed|humiliated|ashamed|horrified|traumatized)/gi,
    /(?:your\s+)?(?:spirit|will|resolve|confidence)\s+(?:breaks?|shatters?|crumbles?)/gi,
    /(?:waves?\s+of\s+)?(?:shame|guilt|despair|horror|dread)\s+(?:wash(?:es)?|crashes?)\s+over\s+you/gi,
    
    // Failed checks (Disco Elysium style)
    /(?:you\s+)?fail(?:ed)?\s+(?:the\s+)?(?:composure|volition|authority|empathy)\s+check/gi,
    
    // Morale critical
    /(?:you\s+)?(?:break\s+down|lose\s+it|snap|crack)/gi,
    /(?:your\s+)?morale\s+(?:drops?|falls?|plummets?)/gi,
    
    // Disco Elysium style tags
    /\[MORALE\s*[-–]\s*(\d+)\]/gi,
    /MORALE:\s*[-–]\s*(\d+)/gi,
    /-(\d+)\s+MORALE/gi,
];

/**
 * Patterns that indicate MORALE recovery
 */
const MORALE_HEAL_PATTERNS = [
    // Explicit morale recovery
    /(?:you\s+)?(?:recover|restore|regain)\s+(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?morale/gi,
    /(\d+)\s+(?:point(?:s)?\s+(?:of\s+)?)?morale\s+(?:restored|recovered)/gi,
    
    // ─────────────────────────────────────────────────────────────
    // SUCCESS / ACCOMPLISHMENT (opposite of failed checks)
    // ─────────────────────────────────────────────────────────────
    /(?:you\s+)?(?:succeed|manage|accomplish|achieve|complete|solve|figure\s*(?:it\s+)?out)/gi,
    /(?:you\s+)?(?:pass(?:ed)?|succeed(?:ed)?)\s+(?:the\s+)?(?:\w+\s+)?check/gi,
    /(?:you\s+)?(?:did\s+it|made\s+it|pull(?:ed)?\s+it\s+off|got\s+it\s+right)/gi,
    /(?:a\s+)?(?:success|victory|breakthrough|triumph|accomplishment)/gi,
    
    // ─────────────────────────────────────────────────────────────
    // VALIDATION / APPROVAL (opposite of humiliation)
    // ─────────────────────────────────────────────────────────────
    /(?:they|she|he)\s+(?:agree|nod|approve|praise|thank|compliment)/gi,
    /(?:they|she|he)\s+(?:look(?:s)?|seem(?:s)?)\s+(?:impressed|proud|pleased)/gi,
    /(?:well\s+done|good\s+job|nice\s+work|that'?s?\s+(?:good|great|impressive))/gi,
    /(?:you\s+)?(?:earn(?:ed)?|gain(?:ed)?|won)\s+(?:their\s+)?(?:respect|trust|approval|admiration)/gi,
    
    // ─────────────────────────────────────────────────────────────
    // CONNECTION / BONDING (opposite of rejection)
    // ─────────────────────────────────────────────────────────────
    /(?:they|she|he)\s+(?:smile(?:s)?|laugh(?:s)?|grin(?:s)?)\s+(?:at|with)\s+you/gi,
    /(?:they|she|he)\s+(?:hug(?:s)?|embrace(?:s)?|hold(?:s)?|comfort(?:s)?)\s+you/gi,
    /(?:you\s+(?:feel|are)\s+)?(?:welcome|accepted|included|understood|loved)/gi,
    /(?:a\s+)?(?:moment\s+of\s+)?(?:connection|understanding|intimacy|closeness|warmth)/gi,
    /(?:you'?re?\s+)?not\s+alone/gi,
    
    // ─────────────────────────────────────────────────────────────
    // EMOTIONAL RECOVERY (existing)
    // ─────────────────────────────────────────────────────────────
    /(?:you\s+(?:feel|are)\s+)?(?:relieved|reassured|comforted|encouraged|validated)/gi,
    /(?:a\s+)?(?:sense\s+of\s+)?(?:calm|peace|relief|hope|pride)\s+(?:washes?|settles?|fills?)/gi,
    /(?:your\s+)?(?:spirits?|mood|confidence)\s+(?:lifts?|rises?|improves?|brightens?)/gi,
    
    // ─────────────────────────────────────────────────────────────
    // POSITIVE EMOTIONS / HUMOR
    // ─────────────────────────────────────────────────────────────
    /(?:you\s+)?(?:laugh|chuckle|smile|grin)\s+(?:to\s+yourself|genuinely|warmly)?/gi,
    /(?:you\s+(?:feel|are)\s+)?(?:happy|joyful|content|satisfied|proud|confident)/gi,
    /(?:you\s+)?(?:can't\s+help\s+but\s+)?(?:smile|laugh|feel\s+good)/gi,
    
    // ─────────────────────────────────────────────────────────────
    // SLEEP / FOOD / SUBSTANCES
    // ─────────────────────────────────────────────────────────────
    /(?:you\s+)?(?:wake\s+up|awaken)\s+(?:feeling\s+)?(?:better|refreshed|rested)/gi,
    /(?:a\s+)?(?:good\s+)?(?:night'?s?\s+)?(?:sleep|rest)\s+(?:clears?\s+your\s+(?:head|mind)|helps?)/gi,
    /(?:the\s+)?(?:food|meal|breakfast|lunch|dinner)\s+(?:helps?|lifts?\s+your\s+spirits?|makes?\s+you\s+feel\s+better)/gi,
    /(?:you\s+)?(?:eat|enjoy)\s+(?:a\s+)?(?:good|warm|hot|hearty)\s+(?:meal|food)/gi,
    /(?:the\s+)?(?:alcohol|drink|cigarette|smoke)\s+(?:calms?|soothes?|helps?|takes?\s+the\s+edge\s+off)/gi,
    
    // Disco Elysium style tags
    /\[MORALE\s*\+\s*(\d+)\]/gi,
    /MORALE:\s*\+\s*(\d+)/gi,
    /\+(\d+)\s+MORALE/gi,
];

// ═══════════════════════════════════════════════════════════════
// EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract vital changes from message text
 * @param {string} messageText - The AI message to analyze
 * @returns {{healthDelta: number, moraleDelta: number, events: string[]}}
 */
export function extractVitalsFromMessage(messageText) {
    if (!messageText || messageText.length < 20) {
        return { healthDelta: 0, moraleDelta: 0, events: [] };
    }
    
    let healthDelta = 0;
    let moraleDelta = 0;
    const events = [];
    
    // HEALTH DAMAGE
    for (const pattern of HEALTH_DAMAGE_PATTERNS) {
        const matches = messageText.matchAll(pattern);
        for (const match of matches) {
            const explicitDamage = match[1] ? parseInt(match[1], 10) : 0;
            
            if (explicitDamage > 0) {
                healthDelta -= explicitDamage;
                events.push(`Health -${explicitDamage} (explicit)`);
            } else {
                const severity = estimateSeverity(match[0]);
                healthDelta -= severity;
                events.push(`Health -${severity} (${match[0].trim().substring(0, 30)})`);
            }
        }
    }
    
    // HEALTH HEALING
    for (const pattern of HEALTH_HEAL_PATTERNS) {
        const matches = messageText.matchAll(pattern);
        for (const match of matches) {
            const explicitHeal = match[1] ? parseInt(match[1], 10) : 0;
            
            if (explicitHeal > 0) {
                healthDelta += explicitHeal;
                events.push(`Health +${explicitHeal} (explicit)`);
            } else {
                const severity = estimateHealSeverity(match[0]);
                healthDelta += severity;
                events.push(`Health +${severity} (${match[0].trim().substring(0, 30)})`);
            }
        }
    }
    
    // MORALE DAMAGE
    for (const pattern of MORALE_DAMAGE_PATTERNS) {
        const matches = messageText.matchAll(pattern);
        for (const match of matches) {
            const explicitDamage = match[1] ? parseInt(match[1], 10) : 0;
            
            if (explicitDamage > 0) {
                moraleDelta -= explicitDamage;
                events.push(`Morale -${explicitDamage} (explicit)`);
            } else {
                const severity = estimateSeverity(match[0]);
                moraleDelta -= severity;
                events.push(`Morale -${severity} (${match[0].trim().substring(0, 30)})`);
            }
        }
    }
    
    // MORALE RECOVERY
    for (const pattern of MORALE_HEAL_PATTERNS) {
        const matches = messageText.matchAll(pattern);
        for (const match of matches) {
            const explicitHeal = match[1] ? parseInt(match[1], 10) : 0;
            
            if (explicitHeal > 0) {
                moraleDelta += explicitHeal;
                events.push(`Morale +${explicitHeal} (explicit)`);
            } else {
                const severity = estimateHealSeverity(match[0]);
                moraleDelta += severity;
                events.push(`Morale +${severity} (${match[0].trim().substring(0, 30)})`);
            }
        }
    }
    
    // Cap deltas to reasonable bounds per message
    healthDelta = Math.max(-6, Math.min(6, healthDelta));
    moraleDelta = Math.max(-6, Math.min(6, moraleDelta));
    
    return { healthDelta, moraleDelta, events };
}

function estimateSeverity(text) {
    const lower = text.toLowerCase();
    if (/fatal|critical|devastating|massive|collapse|unconscious|black\s*out/.test(lower)) return 3;
    if (/shot|stabbed|slashed|crushed|shattered|horrified|traumatized/.test(lower)) return 2;
    return 1;
}

function estimateHealSeverity(text) {
    const lower = text.toLowerCase();
    
    // Major healing = 3 (big successes, deep connection, full rest)
    if (/fully\s+heal|complete|medkit|surgery|major|good\s+night|breakthrough|triumph|loved|intimacy/.test(lower)) return 3;
    
    // Moderate = 2 (success, validation, rest, bonding)
    if (/succeed|accomplish|solve|pass|impressed|proud|respect|trust|hug|embrace|comfort|bandage|medicine|treated|relieved|sleep|rest|nap|refreshed|smile.*at\s+you|laugh.*with/.test(lower)) return 2;
    
    // Minor = 1 (small wins, food, minor comfort)
    return 1;
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION WITH STATE (v2.0 - DEATH SYSTEM)
// ═══════════════════════════════════════════════════════════════

/**
 * Process a message and update vitals state
 * v2.0: Integrates with death-handler.js for skill checks
 */
export function processMessageVitals(messageText) {
    const { healthDelta, moraleDelta, events } = extractVitalsFromMessage(messageText);
    
    if (healthDelta === 0 && moraleDelta === 0) {
        return { applied: false, healthDelta: 0, moraleDelta: 0, events: [], death: null };
    }
    
    const { getChatState, saveChatState } = window.TribunalState || {};
    if (!getChatState) {
        console.warn('[Vitals] TribunalState not available');
        return { applied: false, healthDelta, moraleDelta, events, death: null };
    }
    
    const state = getChatState();
    if (!state.vitals) state.vitals = { health: 10, maxHealth: 13, morale: 10, maxMorale: 13 };
    
    const vitals = state.vitals;
    let deathResult = null;
    let finalHealthDelta = healthDelta;
    let finalMoraleDelta = moraleDelta;
    
    // ═══════════════════════════════════════════════════════════
    // DEATH CHECK BEFORE APPLYING DAMAGE
    // ═══════════════════════════════════════════════════════════
    
    if (healthDelta < 0 || moraleDelta < 0) {
        const deathHandler = window.TribunalDeath;
        
        if (deathHandler?.checkForDeath) {
            deathResult = deathHandler.checkForDeath(
                vitals.health,
                vitals.morale,
                healthDelta,
                moraleDelta,
                messageText
            );
            
            if (deathResult.prevented) {
                // Skill check saved us
                const wouldDieHealth = vitals.health + healthDelta <= 0;
                const wouldDieMorale = vitals.morale + moraleDelta <= 0;
                
                if (wouldDieHealth) finalHealthDelta = -(vitals.health - 1);
                if (wouldDieMorale) finalMoraleDelta = -(vitals.morale - 1);
                
                events.push(`[CLOSE CALL - ${deathResult.skillCheck.skill.toUpperCase()} saved you!]`);
            }
            
            // Death triggered - screen handles reset
            if (!deathResult.prevented && (deathResult.newHealth <= 0 || deathResult.newMorale <= 0)) {
                console.log('[Vitals] Death triggered');
                return { applied: true, healthDelta, moraleDelta, events, death: deathResult };
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // APPLY CHANGES
    // ═══════════════════════════════════════════════════════════
    
    let changed = false;
    
    if (finalHealthDelta !== 0) {
        const oldHealth = vitals.health;
        vitals.health = Math.max(0, Math.min(vitals.maxHealth, vitals.health + finalHealthDelta));
        changed = vitals.health !== oldHealth;
        
        if (changed) {
            console.log(`[Vitals] Health ${finalHealthDelta > 0 ? '+' : ''}${finalHealthDelta} → ${vitals.health}/${vitals.maxHealth}`);
            
            if (finalHealthDelta <= -2 && typeof toastr !== 'undefined') {
                toastr.warning(`Health ${finalHealthDelta}`, 'Damage!', { timeOut: 2000 });
            }
        }
    }
    
    if (finalMoraleDelta !== 0) {
        const oldMorale = vitals.morale;
        vitals.morale = Math.max(0, Math.min(vitals.maxMorale, vitals.morale + finalMoraleDelta));
        changed = changed || vitals.morale !== oldMorale;
        
        if (vitals.morale !== oldMorale) {
            console.log(`[Vitals] Morale ${finalMoraleDelta > 0 ? '+' : ''}${finalMoraleDelta} → ${vitals.morale}/${vitals.maxMorale}`);
            
            if (finalMoraleDelta <= -2 && typeof toastr !== 'undefined') {
                toastr.warning(`Morale ${finalMoraleDelta}`, 'Psychic damage!', { timeOut: 2000 });
            }
        }
    }
    
    if (changed) {
        if (saveChatState) saveChatState();
        
        window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
            detail: {
                health: vitals.health,
                maxHealth: vitals.maxHealth,
                morale: vitals.morale,
                maxMorale: vitals.maxMorale,
                healthDelta: finalHealthDelta,
                moraleDelta: finalMoraleDelta
            }
        }));
    }
    
    return { applied: changed, healthDelta: finalHealthDelta, moraleDelta: finalMoraleDelta, events, death: deathResult };
}

/**
 * Get Author's Note text for vitals tracking
 */
export function getVitalsPromptInjection() {
    return `[System: When the protagonist takes physical damage or heals, note it as [HEALTH -X] or [HEALTH +X]. When they suffer emotional damage, note it as [MORALE -X] or [MORALE +X]. Values: minor=1, moderate=2, severe=3.]`;
}

/**
 * Directly adjust vitals (for item use, etc.)
 */
export function adjustVitals(healthDelta, moraleDelta, source = 'manual') {
    const { getChatState, saveChatState } = window.TribunalState || {};
    if (!getChatState) return { success: false };
    
    const state = getChatState();
    if (!state.vitals) return { success: false };
    
    const vitals = state.vitals;
    
    // Check for death if taking damage
    if ((healthDelta < 0 || moraleDelta < 0) && window.TribunalDeath?.checkForDeath) {
        const deathResult = window.TribunalDeath.checkForDeath(
            vitals.health, vitals.morale, healthDelta, moraleDelta, source
        );
        
        if (!deathResult.prevented && (deathResult.newHealth <= 0 || deathResult.newMorale <= 0)) {
            return { success: true, death: true, deathResult };
        }
        
        if (deathResult.prevented) {
            healthDelta = vitals.health - deathResult.newHealth;
            moraleDelta = vitals.morale - deathResult.newMorale;
        }
    }
    
    vitals.health = Math.max(0, Math.min(vitals.maxHealth, vitals.health + healthDelta));
    vitals.morale = Math.max(0, Math.min(vitals.maxMorale, vitals.morale + moraleDelta));
    
    if (saveChatState) saveChatState();
    
    window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
        detail: { health: vitals.health, maxHealth: vitals.maxHealth, morale: vitals.morale, maxMorale: vitals.maxMorale, healthDelta, moraleDelta, source }
    }));
    
    return { success: true, death: false };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    extractVitalsFromMessage,
    processMessageVitals,
    adjustVitals,
    getVitalsPromptInjection
};
