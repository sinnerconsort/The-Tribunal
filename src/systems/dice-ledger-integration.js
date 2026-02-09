/**
 * The Tribunal - Dice + Ledger + Investigation Integration
 * 
 * Connects drawer dice luck to:
 * 1. dice.js skill checks (modifier to rolls)
 * 2. investigation.js environmental scans (prompt injection + difficulty)
 * 
 * When you roll crits in the drawer, it affects your next investigation!
 */

import { 
    getLedgerCommentForCheck,
    getCurrentLuckModifier, 
    consumeLuckModifier,
    LEDGER_VOICES
} from './ledger-voices.js';

import {
    rollSkillCheck,
    rollSkillCheckWithStatuses,
    calculateStatusModifier
} from './dice.js';

// ═══════════════════════════════════════════════════════════════
// INTEGRATION 1: LEDGER COMMENTARY ON SKILL CHECKS
// Add ledger voice flavor to dice.js results
// ═══════════════════════════════════════════════════════════════

/**
 * Roll a skill check and get optional ledger commentary
 * Use this if you want the ledger to comment on crits
 * 
 * @param {string} skillId - Skill ID 
 * @param {number} skillLevel - Base skill level
 * @param {number} difficulty - Target threshold
 * @param {string[]} activeStatusIds - Active status effects
 * @param {boolean} includeLedgerComment - Whether to add ledger commentary
 * @returns {Object} Standard check result + optional ledgerComment
 */
export function rollWithLedgerComment(skillId, skillLevel, difficulty, activeStatusIds = [], includeLedgerComment = true) {
    const result = rollSkillCheckWithStatuses(skillId, skillLevel, difficulty, activeStatusIds);
    
    if (includeLedgerComment && result.isCritical) {
        // Only comment on crits - don't spam every roll
        result.ledgerComment = getLedgerCommentForCheck(result);
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION 2: DRAWER LUCK MODIFIER
// Apply luck from drawer dice to skill checks
// ═══════════════════════════════════════════════════════════════

/**
 * Roll a skill check with luck modifier from drawer dice
 * The luck modifier is CONSUMED after use (one-time bonus)
 * 
 * @param {string} skillId - Skill ID
 * @param {number} skillLevel - Base skill level  
 * @param {number} difficulty - Target threshold
 * @param {string[]} activeStatusIds - Active status effects
 * @param {boolean} useLuck - Whether to consume drawer luck (default: true)
 * @returns {Object} Check result with luckApplied field
 */
export function rollWithLuck(skillId, skillLevel, difficulty, activeStatusIds = [], useLuck = true) {
    // Get status modifier
    const statusMod = calculateStatusModifier(skillId, activeStatusIds);
    
    // Get and consume luck modifier (if enabled)
    let luckMod = 0;
    if (useLuck) {
        luckMod = Math.round(consumeLuckModifier()); // Rounds 0.5 to 1, -0.5 to 0
    }
    
    // Total modifier = status effects + luck
    const totalMod = statusMod + luckMod;
    
    // Roll with combined modifier
    const result = rollSkillCheck(skillLevel, difficulty, totalMod);
    result.skillId = skillId;
    
    // Track what modifiers were applied
    result.statusModifier = statusMod;
    result.luckModifier = luckMod;
    result.luckApplied = luckMod !== 0;
    
    // Add flavor text for luck
    if (luckMod > 0) {
        result.luckFlavor = "The dice remember your good fortune.";
    } else if (luckMod < 0) {
        result.luckFlavor = "Snake eyes cast a shadow on your inquiry.";
    }
    
    return result;
}

/**
 * Check if there's active luck waiting to be used
 * Good for UI indicators
 * 
 * @returns {Object} { hasLuck, isPositive, modifier }
 */
export function checkActiveLuck() {
    const luck = getCurrentLuckModifier();
    return {
        hasLuck: luck !== 0,
        isPositive: luck > 0,
        modifier: luck
    };
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION 3: INVESTIGATION PROMPT INJECTION
// Add luck context to investigation.js prompts
// ═══════════════════════════════════════════════════════════════

/**
 * Get luck context for investigation prompt injection
 * Call this at the start of generateEnvironmentScan()
 * 
 * @param {boolean} consume - Whether to consume the luck (default: true)
 * @returns {Object} { hasLuck, promptInjection, difficultyModifier, voice }
 */
export function getInvestigationLuck(consume = true) {
    const luck = consume ? consumeLuckModifier() : getCurrentLuckModifier();
    
    if (luck === 0) {
        return {
            hasLuck: false,
            promptInjection: '',
            difficultyModifier: 0,
            voice: null
        };
    }
    
    let promptInjection, voice;
    
    if (luck >= 1) {
        // Boxcars - Oblivion speaks of fortune
        voice = LEDGER_VOICES.oblivion;
        promptInjection = `
[FORTUNE FAVORS THIS SCAN: The detective recently rolled boxcars (double sixes).
The universe briefly aligns. Be slightly more generous - perhaps reveal an extra detail,
make an object's voice more forthcoming, or have a skill notice something they might have missed.
This is subtle - a small gift from fate, not a treasure trove.]`;
    } else if (luck > 0) {
        // High roll - mild good luck
        voice = LEDGER_VOICES.damaged;
        promptInjection = `
[MILD FORTUNE: A recent good roll lingers. The scan might reveal one small extra detail.]`;
    } else if (luck <= -1) {
        // Snake eyes - Failure & Hatred curses the search
        voice = LEDGER_VOICES.failure;
        promptInjection = `
[MISFORTUNE SHADOWS THIS SCAN: The detective recently rolled snake eyes (double ones).
Bad luck clings to their inquiry. Be slightly more cryptic - perhaps an object is evasive,
a skill misreads something minor, or a detail stays just out of reach.
This is subtle - a small curse, not a catastrophe. The scan still works.]`;
    } else {
        // Low roll - mild bad luck
        voice = LEDGER_VOICES.failure;
        promptInjection = `
[MILD MISFORTUNE: Recent bad luck lingers. One detail might be slightly harder to read.]`;
    }
    
    return {
        hasLuck: true,
        promptInjection,
        difficultyModifier: luck >= 1 ? -1 : (luck <= -1 ? 1 : 0), // ±1 to difficulty
        voice,
        luckValue: luck
    };
}

/**
 * Apply luck to investigation skill checks
 * Use this in investigation.js where skill checks are rolled
 * 
 * @param {number} baseDifficulty - Base difficulty threshold
 * @param {Object} luck - Luck object from getInvestigationLuck()
 * @returns {number} Adjusted difficulty
 */
export function applyLuckToDifficulty(baseDifficulty, luck) {
    if (!luck || !luck.hasLuck) return baseDifficulty;
    
    // Luck modifies difficulty: good luck = easier (lower), bad luck = harder (higher)
    const adjusted = baseDifficulty + luck.difficultyModifier;
    
    // Clamp to valid range (6-18)
    return Math.max(6, Math.min(18, adjusted));
}

// ═══════════════════════════════════════════════════════════════
// FULL INTEGRATION: BOTH FEATURES
// ═══════════════════════════════════════════════════════════════

/**
 * The "full experience" roll - luck + ledger commentary
 * 
 * @param {string} skillId - Skill ID
 * @param {number} skillLevel - Base skill level
 * @param {number} difficulty - Target threshold  
 * @param {string[]} activeStatusIds - Active status effects
 * @returns {Object} Full result with luck and commentary
 */
export function rollFullIntegration(skillId, skillLevel, difficulty, activeStatusIds = []) {
    const result = rollWithLuck(skillId, skillLevel, difficulty, activeStatusIds, true);
    
    // Add ledger comment on crits
    if (result.isCritical) {
        result.ledgerComment = getLedgerCommentForCheck(result);
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

/**
 * Listen for drawer dice roll events
 * @param {Function} callback - Called with roll result
 * @returns {Function} Cleanup function
 */
export function onDiceRoll(callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener('tribunal:diceRoll', handler);
    return () => window.removeEventListener('tribunal:diceRoll', handler);
}

/**
 * Listen for fortune draw events
 * @param {Function} callback - Called with fortune result
 * @returns {Function} Cleanup function  
 */
export function onFortuneDraw(callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener('tribunal:fortuneDrawn', handler);
    return () => window.removeEventListener('tribunal:fortuneDrawn', handler);
}

export default {
    // Integration functions
    rollWithLedgerComment,
    rollWithLuck,
    rollFullIntegration,
    checkActiveLuck,
    
    // Investigation-specific
    getInvestigationLuck,
    applyLuckToDifficulty,
    
    // Event listeners
    onDiceRoll,
    onFortuneDraw
};

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION.JS MODIFICATION EXAMPLE
// Copy this pattern into your generateEnvironmentScan() function
// ═══════════════════════════════════════════════════════════════

/*
STEP 1: Add import at top of investigation.js:

import { getInvestigationLuck, applyLuckToDifficulty } from './dice-ledger-integration.js';


STEP 2: Modify generateEnvironmentScan() like this:

async function generateEnvironmentScan(sceneText, selectedSkills) {
    const context = buildInvestigationContext(sceneText);
    
    // ═══ NEW: Check for drawer dice luck ═══
    const luck = getInvestigationLuck(true); // Consumes luck
    
    // Roll skill checks (with luck-modified difficulty)
    const skillsWithChecks = selectedSkills.map(s => {
        let difficulty = getNarratorDifficulty(s.isPrimary ? 'primary' : 'secondary');
        
        // ═══ NEW: Apply luck to difficulty ═══
        if (luck.hasLuck) {
            difficulty = applyLuckToDifficulty(difficulty, luck);
        }
        
        const checkResult = rollSkillCheck(s.level, difficulty);
        return {
            ...s,
            checkResult,
            difficultyName: getDifficultyName(difficulty)
        };
    });
    
    // ... skill descriptions ...

    const systemPrompt = `You are generating an ENVIRONMENTAL SCAN...
    
${luck.promptInjection}  // ═══ NEW: Inject luck context into prompt ═══

CRITICAL CHARACTER INFO:
...rest of prompt...`;

    // ... rest of function ...
}


STEP 3 (Optional): Show luck indicator in UI

In doInvestigate(), before calling generateEnvironmentScan:

const luck = checkActiveLuck(); // Don't consume yet, just check
if (luck.hasLuck) {
    resultsEl.innerHTML = `<div style="${STYLES.loading}">
        <div style="font-size: 16px; margin-bottom: 8px;">◉ ◉ ◉</div>
        <div style="font-size: 11px; letter-spacing: 2px; color: ${luck.isPositive ? '#9b6b9e' : '#b54b4b'}">
            ${luck.isPositive ? '✦ FORTUNE FAVORS YOU ✦' : '✕ MISFORTUNE LINGERS ✕'}
        </div>
    </div>`;
}

*/
