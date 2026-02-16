/**
 * The Tribunal - Thought Generation
 * 
 * Handles AI-powered generation of thoughts for the Thought Cabinet.
 * Called from cabinet-handler.js when user clicks Generate.
 * 
 * @version 4.6.0 - Quest seed integration:
 *   - Probability gate per theme (THEME_QUEST_PROFILES)
 *   - Cooldown tracking (min messages since last quest-bearing internalization)
 *   - User-adjustable frequency multiplier and cooldown in settings
 * @version 4.2.0 - Improved error surfacing with classified error messages
 *                  instead of raw error.message dumps
 */

import { callAPI } from './api-helpers.js';
import { buildThoughtPrompt, buildQuickThoughtPrompt, buildThemeTriggeredPrompt, parseThoughtResponse, getThemeQuestChance } from '../systems/thought-prompt-builder.js';
import { addGeneratedThought, getSpikingTheme, getThoughtCabinet } from '../systems/cabinet.js';
// FIX: Import from state.js (same as generation.js uses) - persistence.js has different structure
import { getSettings } from '../core/state.js';

// Error classification — shared with voice generation
import { classifyError } from '../utils/notification-helpers.js';

// ═══════════════════════════════════════════════════════════════
// QUEST SEED GATING
// ═══════════════════════════════════════════════════════════════

/**
 * Default quest cooldown in messages since last quest-bearing thought was internalized.
 * Prevents quest spam even in high-probability themes.
 */
const DEFAULT_QUEST_COOLDOWN = 15;

/**
 * Determine whether this thought generation should include quest seed instructions.
 * Checks: user setting enabled → cooldown elapsed → theme probability roll.
 * 
 * @param {string|null} themeId - Theme ID if known (from spike), null for context-based
 * @returns {{ include: boolean, reason: string }}
 */
function shouldIncludeQuestSeed(themeId = null) {
    const settings = getSettings();
    
    // Master toggle — user can disable quest seeds entirely
    if (settings?.thoughts?.questSeeds === false) {
        return { include: false, reason: 'disabled_by_user' };
    }
    
    // Cooldown check — messages since last quest-bearing internalization
    const cabinet = getThoughtCabinet();
    const cooldown = settings?.thoughts?.questCooldown ?? DEFAULT_QUEST_COOLDOWN;
    const lastQuestMessage = cabinet?.lastQuestSeedMessage ?? 0;
    const currentMessage = cabinet?.messageCount ?? 0;
    const elapsed = currentMessage - lastQuestMessage;
    
    if (elapsed < cooldown) {
        return { include: false, reason: `cooldown (${elapsed}/${cooldown} messages)` };
    }
    
    // Theme probability — roll against theme's quest chance
    const baseChance = getThemeQuestChance(themeId);
    const userMultiplier = settings?.thoughts?.questFrequency ?? 1.0;
    const finalChance = Math.min(baseChance * userMultiplier, 0.85); // Cap at 85%
    const roll = Math.random();
    
    if (roll > finalChance) {
        return { include: false, reason: `probability (rolled ${roll.toFixed(2)} > ${finalChance.toFixed(2)} for ${themeId || 'unknown'})` };
    }
    
    console.log(`[Tribunal] Quest seed INCLUDED: theme=${themeId || 'context'}, chance=${finalChance.toFixed(2)}, roll=${roll.toFixed(2)}, cooldown=${elapsed}/${cooldown}`);
    return { include: true, reason: 'passed' };
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Handle thought generation request from UI
 * @param {Object} options - Generation options from cabinet-handler
 * @param {string} options.concept - Optional concept/question to base thought on
 * @param {boolean} options.fromContext - Whether to use chat context
 * @param {string} options.perspective - 'observer' or 'participant'
 * @param {string} options.playerIdentity - Who the player is in this story
 * @param {Function} refreshCallback - Called after successful generation
 * @param {Function} toastCallback - For showing notifications
 * @returns {Object|null} Generated thought or null on failure
 */
export async function handleGenerateThought(options, refreshCallback, toastCallback) {
    const { concept, fromContext, perspective, playerIdentity } = options;
    
    const toast = toastCallback || ((msg, type) => console.log(`[Tribunal] ${type}: ${msg}`));
    const refresh = refreshCallback || (() => {});
    
    try {
        // Check if API is configured
        const settings = getSettings();
        
        console.log('[Tribunal] Settings check:', {
            hasSettings: !!settings,
            connectionProfile: settings?.connectionProfile,
            apiSource: settings?.api?.source
        });
        
        // FIX: Be very permissive - if settings exist at all, assume we can use ST's connection
        // The only failure case is if getSettings() returns null/undefined entirely
        // 'current' or undefined both mean "use ST's main connection"
        const connectionProfile = settings?.connectionProfile;
        const hasConnection = settings && (
            connectionProfile === 'current' || 
            connectionProfile === 'st_default' ||
            connectionProfile === undefined ||  // No setting = use default
            connectionProfile === '' ||          // Empty = use default
            settings?.api?.source ||
            settings?.api?.endpoint
        );
        
        if (!hasConnection) {
            console.log('[Tribunal] No connection - settings object:', settings);
            toast('No API configured. Check Settings tab.', 'error');
            return null;
        }
        
        console.log('[Tribunal] Connection OK, proceeding with generation');
        
        // Build the prompt
        let prompt;
        
        // Check quest seed eligibility (theme unknown for concept/context-based)
        const questGate = shouldIncludeQuestSeed(null);
        console.log('[Tribunal] Quest seed gate:', questGate.reason);
        
        if (concept && concept.trim()) {
            // User provided a specific concept - use quick prompt
            prompt = buildQuickThoughtPrompt(concept.trim(), questGate.include);
            console.log('[Tribunal] Generating thought from concept:', concept);
        } else if (fromContext) {
            // Use full context-aware prompt
            prompt = buildThoughtPrompt({
                messageCount: 10,
                perspective,
                playerIdentity,
                includeQuestSeed: questGate.include
            });
            console.log('[Tribunal] Generating thought from chat context');
        } else {
            toast('Enter a concept or enable "From chat"', 'warning');
            return null;
        }
        
        console.log('[Tribunal] Thought prompt meta:', prompt.meta);
        
        // Call the API
        toast('Generating thought...', 'info');
        
        const response = await callAPI(prompt.system, prompt.user);
        
        if (!response) {
            toast('API returned an empty response. The model may be overloaded — try again.', 'error');
            return null;
        }
        
        // Parse the response
        const thought = parseThoughtResponse(response);
        
        if (!thought) {
            toast('Got a response but couldn\'t parse it into a thought. Try generating again.', 'error');
            console.error('[Tribunal] Raw response that failed to parse:', response.substring(0, 500));
            return null;
        }
        
        // Add to cabinet
        const savedThought = addGeneratedThought(thought);
        
        if (savedThought) {
            const questNote = savedThought.questSeed ? ' (carries a quest)' : '';
            toast(`Discovered: ${savedThought.name}${questNote}`, 'success');
            refresh();
            return savedThought;
        } else {
            toast('Generated a thought but failed to save it to the cabinet.', 'error');
            return null;
        }
        
    } catch (error) {
        console.error('[Tribunal] Thought generation failed:', error);
        
        // ═══════════════════════════════════════════════════════════
        // IMPROVED: Use classifyError for user-friendly messages
        // instead of dumping raw error.message
        // ═══════════════════════════════════════════════════════════
        const classified = classifyError(error);
        toast(`${classified.title}: ${classified.detail}`, classified.level);
        
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-GENERATION (when themes spike)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a thought should be auto-suggested based on theme levels
 * Call this after processing messages
 * @param {Function} notifyCallback - Called with spiking theme if found
 * @returns {Object|null} Spiking theme or null
 */
export function checkForThoughtSuggestion(notifyCallback) {
    const settings = getSettings();
    
    // Check if auto-suggest is enabled
    if (!settings?.thoughts?.autoSuggest) {
        return null;
    }
    
    const threshold = settings?.thoughts?.spikeThreshold || 8;
    const spiking = getSpikingTheme(threshold);
    
    if (spiking && notifyCallback) {
        notifyCallback(spiking);
    }
    
    return spiking;
}

/**
 * Auto-generate a thought based on a spiking theme
 * Uses buildThemeTriggeredPrompt for focused, theme-aware generation.
 * @param {Object} spikingTheme - The theme that triggered this { id, name, icon, count }
 * @param {Function} refreshCallback - UI refresh callback
 * @param {Function} toastCallback - Toast notification callback
 * @returns {Object|null} Generated thought or null
 */
export async function autoGenerateFromTheme(spikingTheme, refreshCallback, toastCallback) {
    if (!spikingTheme) return null;
    
    const toast = toastCallback || ((msg, type) => console.log(`[Tribunal] ${type}: ${msg}`));
    
    toast(`A thought emerges from ${spikingTheme.name}...`, 'info');
    
    try {
        // Check API connection
        const settings = getSettings();
        const connectionProfile = settings?.connectionProfile;
        const hasConnection = settings && (
            connectionProfile === 'current' || 
            connectionProfile === 'st_default' ||
            connectionProfile === undefined ||
            connectionProfile === '' ||
            settings?.api?.source ||
            settings?.api?.endpoint
        );
        
        if (!hasConnection) {
            toast('No API configured. Check Settings tab.', 'error');
            return null;
        }
        
        // Quest seed gate — theme is known, so use theme-specific chance
        const questGate = shouldIncludeQuestSeed(spikingTheme.id);
        console.log(`[Tribunal] Theme-triggered quest seed gate (${spikingTheme.id}):`, questGate.reason);
        
        // Build theme-specific prompt
        const prompt = buildThemeTriggeredPrompt(spikingTheme, questGate.include);
        console.log('[Tribunal] Theme-triggered thought prompt meta:', prompt.meta);
        
        // Call the API
        const response = await callAPI(prompt.system, prompt.user);
        
        if (!response) {
            toast('API returned an empty response. Try again.', 'error');
            return null;
        }
        
        // Parse the response
        const thought = parseThoughtResponse(response);
        
        if (!thought) {
            toast('Got a response but couldn\'t parse it into a thought. Try generating again.', 'error');
            console.error('[Tribunal] Raw response that failed to parse:', response.substring(0, 500));
            return null;
        }
        
        // Log quest seed result
        if (thought.questSeed) {
            console.log(`[Tribunal] Thought "${thought.name}" carries quest seed: "${thought.questSeed.title}"`);
        }
        
        // Add to cabinet
        const savedThought = addGeneratedThought(thought);
        
        if (savedThought) {
            const questNote = savedThought.questSeed ? ' (carries a quest)' : '';
            toast(`Discovered: ${savedThought.name}${questNote}`, 'success');
            refreshCallback?.();
            return savedThought;
        } else {
            toast('Generated a thought but failed to save it to the cabinet.', 'error');
            return null;
        }
        
    } catch (error) {
        console.error('[Tribunal] Theme-triggered thought generation failed:', error);
        const classified = classifyError(error);
        toast(`${classified.title}: ${classified.detail}`, classified.level);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    handleGenerateThought,
    checkForThoughtSuggestion,
    autoGenerateFromTheme,
    shouldIncludeQuestSeed
};
