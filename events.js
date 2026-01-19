/**
 * The Tribunal - Event Handlers
 * Hooks into SillyTavern's event system
 */

import { eventSource, event_types } from '../../../../script.js';
import { 
    loadChatState, 
    saveChatState, 
    hasActiveChat,
    initSettings,
    getSettings
} from './persistence.js';
import { incrementMessageCount, getVitals } from './state.js';

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
 */
function onChatChanged() {
    console.log('[Tribunal] Chat changed - loading state');
    
    if (hasActiveChat()) {
        loadChatState();
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
    
    // TODO: Parse response for tracker data if auto-tracking enabled
    // TODO: Trigger voice generation if enabled
    
    saveChatState();
    triggerRefresh();
}

/**
 * Handle user swiping to different generation
 * @param {object} data - Swipe event data
 */
function onMessageSwiped(data) {
    console.log('[Tribunal] Message swiped');
    // TODO: Load swipe-specific data if implementing per-swipe storage
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
