/**
 * The Tribunal - Thought Cabinet System (STUB)
 * 
 * This is a minimal stub to allow voice generation to work.
 * The full thought cabinet system will be migrated later.
 * 
 * TODO: Migrate from main branch when implementing Phase 4
 */

// ═══════════════════════════════════════════════════════════════
// STUB EXPORTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get research penalties from thoughts being researched
 * Thoughts being researched can impose skill penalties.
 * 
 * For now, returns empty object (no penalties)
 * 
 * @returns {object} Map of skillId -> penalty value
 */
export function getResearchPenalties() {
    // TODO: Implement when thought cabinet is migrated
    // Should read from thoughtCabinet.researching and return
    // accumulated skill bonuses/penalties from research effects
    return {};
}

/**
 * Check if a special thought effect is active
 * @param {string} effectName - Effect name to check
 * @returns {boolean} Whether effect is active
 */
export function hasSpecialEffect(effectName) {
    // TODO: Implement when thought cabinet is migrated
    return false;
}

/**
 * Increment message count for thought discovery
 */
export function incrementMessageCount() {
    // TODO: Implement when thought cabinet is migrated
    // For now, this is handled by state.js incrementMessageCount()
}

/**
 * Record a critical success for thought discovery
 * @param {string} skillId - Skill that critted
 */
export function recordCriticalSuccess(skillId) {
    // TODO: Implement when thought cabinet is migrated
    console.log('[The Tribunal] Critical success recorded:', skillId);
}

/**
 * Record a critical failure for thought discovery
 * @param {string} skillId - Skill that fumbled
 */
export function recordCriticalFailure(skillId) {
    // TODO: Implement when thought cabinet is migrated
    console.log('[The Tribunal] Critical failure recorded:', skillId);
}

/**
 * Record an ancient voice trigger for thought discovery
 */
export function recordAncientVoiceTriggered() {
    // TODO: Implement when thought cabinet is migrated
    console.log('[The Tribunal] Ancient voice triggered');
}

/**
 * Track themes in message for thought discovery
 * @param {string} text - Message text to analyze
 */
export function trackThemesInMessage(text) {
    // TODO: Implement when thought cabinet is migrated
}

/**
 * Check if any thoughts should be discovered based on current state
 * @returns {array} Array of newly discovered thoughts
 */
export function checkThoughtDiscovery() {
    // TODO: Implement when thought cabinet is migrated
    return [];
}

/**
 * Advance research progress
 * @param {string} messageText - Current message text (for keyword bonuses)
 * @returns {array} Array of completed thought IDs
 */
export function advanceResearch(messageText = '') {
    // TODO: Implement when thought cabinet is migrated
    return [];
}
