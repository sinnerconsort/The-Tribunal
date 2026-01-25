/**
 * The Tribunal - Event Handlers
 * Hooks into SillyTavern's event system
 * 
 * @version 4.1.0 - Added research advancement on MESSAGE_RECEIVED
 */

import { eventSource, event_types, chat } from '../../../../../../script.js';
import { 
    loadChatState, 
    saveChatState, 
    hasActiveChat,
    initSettings,
    getSettings
} from './persistence.js';
import { incrementMessageCount, getVitals } from './state.js';

// Import investigation module for scene context updates
import { updateSceneContext } from '../systems/investigation.js';

// Import cabinet for research advancement + theme tracking
import { advanceResearch, trackThemesInMessage } from '../systems/cabinet.js';

// Callback registry for UI refresh
let refreshCallbacks = [];

/**
 * Register a callback to be called when state changes require UI refresh
 * @param {function} callback - Function to call on refresh
 */
export function onStateRefresh(callback) {
    if (typeof callback === 'function') {
        refreshCallbacks.push(callback);
    }
}

/**
 * Trigger all registered refresh callbacks
 */
export function triggerRefresh() {
    for (const callback of refreshCallbacks) {
        try {
            callback();
        } catch (error) {
            console.error('[Tribunal] Refresh callback error:', error);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle chat switch
 * Loads per-chat state for the new chat
 * FIX: Reset cabinet state BEFORE loading to prevent phantom bleed
 */
async function onChatChanged() {
    console.log('[Tribunal] Chat changed - resetting and loading state');
    
    // STEP 1: Reset cabinet state FIRST (clears old thoughts from UI)
    // Uses dynamic import so missing function won't break extension
    try {
        const cabinet = await import('../systems/cabinet.js');
        if (typeof cabinet.resetCabinetState === 'function') {
            cabinet.resetCabinetState();
            console.log('[Tribunal] Cabinet state reset');
        }
    } catch (e) {
        // Function not available - that's okay
    }
    
    // STEP 2: Load new chat state
    if (hasActiveChat()) {
        loadChatState();
        
        // STEP 3: Delay refresh to ensure state is fully loaded
        // This prevents the UI from rendering stale data
        setTimeout(() => {
            triggerRefresh();
            console.log('[Tribunal] Delayed refresh complete');
        }, 100);
    } else {
        // No active chat - still trigger refresh to clear UI
        triggerRefresh();
    }
}

/**
 * Handle message sent by user
 */
function onMessageSent() {
    console.log('[Tribunal] Message sent');
    // Could set flags here for generation
}

/**
 * Handle message received from AI
 * @param {number} messageId - The message index
 */
function onMessageReceived(messageId) {
    console.log('[Tribunal] Message received:', messageId);
    
    incrementMessageCount();
    
    // Get the message text
    let messageText = '';
    
    try {
        const message = chat[messageId];
        if (message && !message.is_user && message.mes) {
            messageText = message.mes;
            
            // Update investigation scene context
            updateSceneContext(message.mes);
            console.log('[Tribunal] Scene context updated');
        }
    } catch (error) {
        console.error('[Tribunal] Failed to update scene context:', error);
    }
    
    // Track themes in message (fills theme meters)
    try {
        trackThemesInMessage(messageText);
    } catch (error) {
        console.error('[Tribunal] Failed to track themes:', error);
    }
    
    // Advance research for any thoughts being researched
    try {
        const completed = advanceResearch(messageText);
        if (completed.length > 0) {
            console.log('[Tribunal] Research completed:', completed);
            // The advanceResearch function auto-internalizes
            // UI refresh happens via triggerRefresh below
        }
    } catch (error) {
        console.error('[Tribunal] Failed to advance research:', error);
    }
    
    saveChatState();
    triggerRefresh();
}

/**
 * Handle user swiping to different generation
 * @param {object} data - Swipe event data
 */
function onMessageSwiped(data) {
    console.log('[Tribunal] Message swiped');
    
    // Update scene context when swiping to a different AI response
    try {
        if (chat && chat.length > 0) {
            // Get the last AI message after swipe
            for (let i = chat.length - 1; i >= 0; i--) {
                if (!chat[i].is_user && chat[i].mes) {
                    updateSceneContext(chat[i].mes);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('[Tribunal] Failed to update scene context on swipe:', error);
    }
    
    triggerRefresh();
}

/**
 * Handle generation starting
 * Opportunity to inject prompts
 */
function onGenerationStarted() {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    // TODO: Inject context via setExtensionPrompt()
    console.log('[Tribunal] Generation started');
}

/**
 * Handle generation ending
 */
function onGenerationEnded() {
    console.log('[Tribunal] Generation ended');
}

// ═══════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Register all event handlers with SillyTavern
 */
export function registerEvents() {
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.MESSAGE_SWIPED, onMessageSwiped);
    eventSource.on(event_types.GENERATION_STARTED, onGenerationStarted);
    eventSource.on(event_types.GENERATION_ENDED, onGenerationEnded);
    
    console.log('[Tribunal] Event handlers registered');
}

/**
 * Unregister all event handlers (for cleanup)
 */
export function unregisterEvents() {
    eventSource.off(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.off(event_types.MESSAGE_SENT, onMessageSent);
    eventSource.off(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.off(event_types.MESSAGE_SWIPED, onMessageSwiped);
    eventSource.off(event_types.GENERATION_STARTED, onGenerationStarted);
    eventSource.off(event_types.GENERATION_ENDED, onGenerationEnded);
    
    console.log('[Tribunal] Event handlers unregistered');
}
