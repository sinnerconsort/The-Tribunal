/**
 * The Tribunal - Thought Generation
 * 
 * Handles AI-powered generation of Disco Elysium-style thoughts.
 * Called from cabinet-handler.js when user clicks Generate.
 * 
 * @version 4.1.1 - Fixed API check
 */

import { callAPI } from './api-helpers.js';
import { buildThoughtPrompt, buildQuickThoughtPrompt, parseThoughtResponse } from '../systems/thought-prompt-builder.js';
import { addGeneratedThought, getThemeCounters, getSpikingTheme } from '../systems/cabinet.js';
// FIX: Import from state.js (same as generation.js uses) - persistence.js has different structure
import { getSettings } from '../core/state.js';

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
        
        if (concept && concept.trim()) {
            // User provided a specific concept - use quick prompt
            prompt = buildQuickThoughtPrompt(concept.trim());
            console.log('[Tribunal] Generating thought from concept:', concept);
        } else if (fromContext) {
            // Use full context-aware prompt
            prompt = buildThoughtPrompt({
                messageCount: 10,
                perspective,
                playerIdentity
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
            toast('No response from API', 'error');
            return null;
        }
        
        // Parse the response
        const thought = parseThoughtResponse(response);
        
        if (!thought) {
            toast('Failed to parse thought response', 'error');
            console.error('[Tribunal] Raw response:', response);
            return null;
        }
        
        // Add to cabinet
        const savedThought = addGeneratedThought(thought);
        
        if (savedThought) {
            toast(`Discovered: ${savedThought.name}`, 'success');
            refresh();
            return savedThought;
        } else {
            toast('Failed to save thought', 'error');
            return null;
        }
        
    } catch (error) {
        console.error('[Tribunal] Thought generation failed:', error);
        toast(`Generation failed: ${error.message}`, 'error');
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
 * @param {Object} spikingTheme - The theme that triggered this
 * @param {Function} refreshCallback - UI refresh callback
 * @param {Function} toastCallback - Toast notification callback
 * @returns {Object|null} Generated thought or null
 */
export async function autoGenerateFromTheme(spikingTheme, refreshCallback, toastCallback) {
    if (!spikingTheme) return null;
    
    const toast = toastCallback || ((msg, type) => console.log(`[Tribunal] ${type}: ${msg}`));
    
    toast(`A thought emerges from ${spikingTheme.name}...`, 'info');
    
    // Generate with the theme as concept
    return handleGenerateThought(
        {
            concept: `A thought about ${spikingTheme.name.toLowerCase()} (${spikingTheme.description || ''})`,
            fromContext: true,
            perspective: 'observer'
        },
        refreshCallback,
        toastCallback
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    handleGenerateThought,
    checkForThoughtSuggestion,
    autoGenerateFromTheme
};
