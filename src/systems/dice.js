/**
 * The Tribunal - Dice System
 * Disco Elysium 2d6 skill checks with criticals
 * v0.3.1 - Integrated with status effect modifiers
 */

import { STATUS_EFFECTS } from '../data/statuses.js';

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY THRESHOLDS (from DE)
// ═══════════════════════════════════════════════════════════════

export const DIFFICULTIES = {
    trivial: { threshold: 6, name: 'Trivial' },
    easy: { threshold: 8, name: 'Easy' },
    medium: { threshold: 10, name: 'Medium' },
    challenging: { threshold: 12, name: 'Challenging' },
    heroic: { threshold: 14, name: 'Heroic' },
    legendary: { threshold: 16, name: 'Legendary' },
    impossible: { threshold: 18, name: 'Impossible' }
};

// ═══════════════════════════════════════════════════════════════
// STATUS MODIFIER CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate total modifier for a skill from active status effects
 * Uses the existing STATUS_EFFECTS structure (boosts/debuffs arrays)
 * 
 * @param {string} skillId - Skill ID (e.g., 'logic', 'inland_empire')
 * @param {string[]} activeStatusIds - Array of active status effect IDs
 * @returns {number} Total modifier (can be positive or negative)
 */
export function calculateStatusModifier(skillId, activeStatusIds = []) {
    let modifier = 0;
    
    for (const statusId of activeStatusIds) {
        const status = STATUS_EFFECTS[statusId];
        if (!status) continue;
        
        // Check if this skill is boosted (+1 per status that boosts it)
        if (status.boosts && status.boosts.includes(skillId)) {
            modifier += 1;
        }
        
        // Check if this skill is debuffed (-1 per status that debuffs it)
        if (status.debuffs && status.debuffs.includes(skillId)) {
            modifier -= 1;
        }
    }
    
    return modifier;
}

/**
 * Get all skill modifiers from active statuses
 * @param {string[]} activeStatusIds - Array of active status effect IDs
 * @returns {object} Map of skillId -> total modifier
 */
export function getAllStatusModifiers(activeStatusIds = []) {
    const modifiers = {};
    
    for (const statusId of activeStatusIds) {
        const status = STATUS_EFFECTS[statusId];
        if (!status) continue;
        
        // Process boosts
        if (status.boosts) {
            for (const skillId of status.boosts) {
                modifiers[skillId] = (modifiers[skillId] || 0) + 1;
            }
        }
        
        // Process debuffs
        if (status.debuffs) {
            for (const skillId of status.debuffs) {
                modifiers[skillId] = (modifiers[skillId] || 0) - 1;
            }
        }
    }
    
    return modifiers;
}

// ═══════════════════════════════════════════════════════════════
// CORE ROLL FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Roll 2d6 skill check (Disco Elysium style)
 * @param {number} skillLevel - Base skill level (1-10+)
 * @param {number} difficulty - Target threshold (6-20)
 * @param {number} modifier - Bonus/penalty from status effects (default 0)
 * @returns {object} Check result with all details
 */
export function rollSkillCheck(skillLevel, difficulty, modifier = 0) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;
    
    // Effective skill = base + modifier from statuses
    const effectiveSkill = skillLevel + modifier;
    const total = roll + effectiveSkill;
    
    // Criticals override normal success/fail (DE rules)
    const isBoxcars = die1 === 6 && die2 === 6;    // Double 6 = auto-success
    const isSnakeEyes = die1 === 1 && die2 === 1;  // Double 1 = auto-fail
    
    let success;
    if (isBoxcars) {
        success = true;  // Always succeeds, no matter the odds
    } else if (isSnakeEyes) {
        success = false; // Always fails, even on a sure thing
    } else {
        success = total >= difficulty;
    }
    
    return {
        success,
        die1,
        die2,
        roll,                   // Just the 2d6 total
        skillLevel,             // Base skill level
        modifier,               // Status effect modifier
        effectiveSkill,         // skillLevel + modifier
        total,                  // 2d6 + effective skill
        difficulty,
        threshold: difficulty,
        difficultyName: getDifficultyName(difficulty),
        isBoxcars,              // Critical success
        isSnakeEyes,            // Critical failure
        isCritical: isBoxcars || isSnakeEyes,
        margin: total - difficulty  // Positive = over, negative = under
    };
}

/**
 * Roll skill check with automatic status modifier calculation
 * This is the main function to use from voice generation!
 * 
 * @param {string} skillId - Skill ID (e.g., 'logic', 'inland_empire')
 * @param {number} skillLevel - Base skill level (1-10+)
 * @param {number} difficulty - Target threshold (6-20)
 * @param {string[]} activeStatusIds - Array of active status effect IDs
 * @returns {object} Check result with all details
 */
export function rollSkillCheckWithStatuses(skillId, skillLevel, difficulty, activeStatusIds = []) {
    const modifier = calculateStatusModifier(skillId, activeStatusIds);
    const result = rollSkillCheck(skillLevel, difficulty, modifier);
    
    // Add skill info to result for debugging/display
    result.skillId = skillId;
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK DETERMINATION
// ═══════════════════════════════════════════════════════════════

/**
 * Determine if a check should happen and at what difficulty
 * Based on skill relevance to the current context
 * 
 * @param {object} selectedSkill - Skill selection data with score
 * @param {object} context - Analysis context
 * @returns {object} { shouldCheck, difficulty }
 */
export function determineCheckDifficulty(selectedSkill, context) {
    // Ancient/Primal voices don't make checks - they just speak
    if (selectedSkill.isAncient) {
        return { shouldCheck: false, difficulty: 0 };
    }
    
    // Cascade responders get slightly harder checks (they're butting in)
    if (selectedSkill.isCascade) {
        return { 
            shouldCheck: true, 
            difficulty: 12 + Math.floor(Math.random() * 3) // 12-14 (Challenging-Heroic)
        };
    }
    
    const relevanceScore = selectedSkill.score || 0.5;
    
    // Higher relevance = easier check (skill is in their wheelhouse)
    // Lower relevance = harder check (why is this skill even talking?)
    let baseDifficulty;
    
    if (relevanceScore > 0.7) {
        baseDifficulty = 8;   // Easy - this is their domain
    } else if (relevanceScore > 0.5) {
        baseDifficulty = 10;  // Medium - reasonable insight
    } else if (relevanceScore > 0.3) {
        baseDifficulty = 12;  // Challenging - reaching a bit
    } else {
        baseDifficulty = 14;  // Heroic - why are you even here?
    }
    
    // Context intensity can modify difficulty
    const intensity = Math.max(
        context.emotionalIntensity || 0,
        context.dangerLevel || 0,
        context.socialComplexity || 0
    );
    
    // High intensity = slightly easier (more to react to)
    if (intensity > 0.6) {
        baseDifficulty -= 1;
    }
    
    // Add small variance for unpredictability
    const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const finalDifficulty = Math.max(6, Math.min(18, baseDifficulty + variance * 2));
    
    return {
        shouldCheck: true,
        difficulty: finalDifficulty
    };
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get human-readable difficulty name
 * @param {number} difficulty - Numeric threshold
 * @returns {string} Difficulty name
 */
export function getDifficultyName(difficulty) {
    if (difficulty <= 6) return 'Trivial';
    if (difficulty <= 8) return 'Easy';
    if (difficulty <= 10) return 'Medium';
    if (difficulty <= 12) return 'Challenging';
    if (difficulty <= 14) return 'Heroic';
    if (difficulty <= 16) return 'Legendary';
    return 'Impossible';
}

/**
 * Format check result for display in voice output
 * @param {object} result - Result from rollSkillCheck
 * @returns {string} Formatted string
 */
export function formatCheckResult(result) {
    const diceStr = `${result.die1}+${result.die2}`;
    
    // Show modifier in the breakdown if present
    let skillStr;
    if (result.modifier && result.modifier !== 0) {
        const modSign = result.modifier > 0 ? '+' : '';
        skillStr = `${result.skillLevel}${modSign}${result.modifier}`;
    } else {
        skillStr = `${result.skillLevel}`;
    }
    
    const totalStr = `${result.roll}+${skillStr}=${result.total}`;
    
    if (result.isBoxcars) {
        return `⚡ Critical Success [${diceStr}] ${result.difficultyName}`;
    }
    if (result.isSnakeEyes) {
        return `💀 Critical Failure [${diceStr}] ${result.difficultyName}`;
    }
    if (result.success) {
        return `${result.difficultyName} [Success: ${totalStr} vs ${result.difficulty}]`;
    }
    return `${result.difficultyName} [Failure: ${totalStr} vs ${result.difficulty}]`;
}

/**
 * Get short badge text for UI
 * @param {object} result - Result from rollSkillCheck
 * @returns {string} Short badge text
 */
export function getCheckBadge(result) {
    if (result.isBoxcars) return '⚡ Critical';
    if (result.isSnakeEyes) return '💀 Critical';
    if (result.success) return '✓ Success';
    return '✗ Failure';
}

/**
 * Check if we should show this result (based on settings)
 * @param {object} result - Result from rollSkillCheck
 * @param {object} settings - Extension settings
 * @returns {boolean} Whether to show
 */
export function shouldShowCheck(result, settings = {}) {
    // Always show criticals - they're important!
    if (result.isCritical) return true;
    
    // Show failures only if setting enabled
    if (!result.success && !settings.showFailedChecks) return false;
    
    // Show dice rolls only if setting enabled
    if (!settings.showDiceRolls) return false;
    
    return true;
}
