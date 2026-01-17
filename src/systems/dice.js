/**
 * src/systems/dice.js - Skill check rolling
 * Imports from: data/, core/
 */

import { getEffectiveSkillLevel } from '../core/state.js';

export function rollDice(count = 2, sides = 6) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
}

export function rollSkillCheck(skillId, difficulty = 10) {
    const level = getEffectiveSkillLevel(skillId);
    const roll = rollDice(2, 6);
    const total = roll + level;
    
    return {
        skillId,
        level,
        roll,
        total,
        difficulty,
        success: total >= difficulty,
        critical: roll === 12,
        fumble: roll === 2,
        margin: total - difficulty
    };
}

export function determineCheckDifficulty(context) {
    // Simple difficulty based on context intensity
    if (context.dangerLevel > 0.7) return 14;
    if (context.emotionalIntensity > 0.7) return 12;
    return 10;
}
