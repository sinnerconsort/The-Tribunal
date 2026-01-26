/**
 * The Tribunal - Event Handlers
 * Hooks into SillyTavern's event system
 * 
 * @version 4.3.0 - Added cases handlers initialization
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

// Lazy-loaded modules (won't break if missing)
let _contactIntel = null;
let _contactIntelLoaded = false;

let _caseIntel = null;
let _caseIntelLoaded = false;

let _casesHandlers = null;
let _casesHandlersLoaded = false;

let _contactsHandlers = null;
let _contactsHandlersLoaded = false;

async function getContactIntelligence() {
    if (_contactIntelLoaded) return _contactIntel;
    
    try {
        _contactIntel = await import('../systems/contact-intelligence.js');
        console.log('[Tribunal] Contact intelligence loaded');
    } catch (e) {
        console.log('[Tribunal] Contact intelligence not available (optional)');
        _contactIntel = null;
    }
    
    _contactIntelLoaded = true;
    return _contactIntel;
}

async function getCaseIntelligence() {
    if (_caseIntelLoaded) return _caseIntel;
    
    try {
        _caseIntel = await import('../systems/case-intelligence.js');
        console.log('[Tribunal] Case intelligence loaded');
    } catch (e) {
        console.log('[Tribunal] Case intelligence not available (optional):', e.message);
        _caseIntel = null;
    }
    
    _caseIntelLoaded = true;
    return _caseIntel;
}

async function getCasesHandlers() {
    if (_casesHandlersLoaded) return _casesHandlers;
    
    try {
        _casesHandlers = await import('../ui/cases-handlers.js');
        console.log('[Tribunal] Cases handlers loaded');
    } catch (e) {
        console.log('[Tribunal] Cases handlers not available (optional):', e.message);
        _casesHandlers = null;
    }
    
    _casesHandlersLoaded = true;
    return _casesHandlers;
}

async function getContactsHandlers() {
    if (_contactsHandlersLoaded) return _contactsHandlers;
    
    try {
        _contactsHandlers = await import('../ui/contacts-handlers.js');
        console.log('[Tribunal] Contacts handlers loaded');
    } catch (e) {
        console.log('[Tribunal] Contacts handlers not available (optional):', e.message);
        _contactsHandlers = null;
    }
    
    _contactsHandlersLoaded = true;
    return _contactsHandlers;
}

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
// LEDGER INITIALIZATION (Cases + Contacts)
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize ledger tab handlers (cases and contacts)
 * Call this when the ledger tab is first rendered
 */
export async function initLedgerHandlers() {
    console.log('[Tribunal] Initializing ledger handlers...');
    
    // Initialize cases handlers
    try {
        const casesHandlers = await getCasesHandlers();
        if (casesHandlers?.initCasesHandlers) {
            await casesHandlers.initCasesHandlers();
        }
    } catch (e) {
        console.log('[Tribunal] Cases init skipped:', e.message);
    }
    
    // Initialize contacts handlers
    try {
        const contactsHandlers = await getContactsHandlers();
        if (contactsHandlers?.initContactsHandlers) {
            await contactsHandlers.initContactsHandlers();
        }
    } catch (e) {
        console.log('[Tribunal] Contacts init skipped:', e.message);
    }
    
    console.log('[Tribunal] Ledger handlers initialized');
}

/**
 * Refresh ledger displays (cases and contacts)
 * Call this on chat change
 */
export async function refreshLedger() {
    try {
        const casesHandlers = await getCasesHandlers();
        if (casesHandlers?.refreshCases) {
            await casesHandlers.refreshCases();
        }
    } catch (e) {
        // Silently ignore
    }
    
    try {
        const contactsHandlers = await getContactsHandlers();
        if (contactsHandlers?.refreshContacts) {
            await contactsHandlers.refreshContacts();
        }
    } catch (e) {
        // Silently ignore
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
        
        // STEP 3: Refresh ledger (cases + contacts) for new chat
        await refreshLedger();
        
        // STEP 4: Delay refresh to ensure state is fully loaded
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
async function onMessageReceived(messageId) {
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
    
    // ═══════════════════════════════════════════════════════════════
    // CONTACT INTELLIGENCE - Basic NPC tracking (optional feature)
    // Full analysis happens after voice generation via analyzeVoiceSentimentForNPCs()
    // ═══════════════════════════════════════════════════════════════
    try {
        const contactIntel = await getContactIntelligence();
        if (contactIntel && messageText) {
            // Just track mentions - voice sentiment analysis happens separately
            const detected = contactIntel.detectPotentialNPCs(messageText);
            
            if (detected && detected.size > 0) {
                for (const [name, data] of detected) {
                    contactIntel.trackPendingContact(name, messageText);
                }
                console.log('[Tribunal] Tracking NPCs:', Array.from(detected.keys()));
            }
        }
    } catch (error) {
        // Contact intelligence is optional - don't break on errors
        console.log('[Tribunal] Contact scan skipped:', error.message);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CASE INTELLIGENCE - Auto-detect tasks/quests in messages
    // ═══════════════════════════════════════════════════════════════
    try {
        const caseIntel = await getCaseIntelligence();
        if (caseIntel && messageText) {
            const settings = getSettings();
            const autoCreate = settings.autoDetectCases ?? false; // Off by default
            
            const results = await caseIntel.processMessageForQuests(messageText, {
                autoCreate,
                notifyCallback: autoCreate ? (msg) => {
                    if (typeof toastr !== 'undefined') toastr.info(msg, 'Case Detected');
                } : null
            });
            
            if (results.detected.length > 0) {
                console.log('[Tribunal] Detected quests:', results.detected.map(q => q.title));
            }
            
            if (results.created.length > 0) {
                console.log('[Tribunal] Auto-created cases:', results.created.map(c => c.title));
                // Refresh the cases list if any were created
                const casesHandlers = await getCasesHandlers();
                if (casesHandlers?.renderCasesList) {
                    await casesHandlers.renderCasesList();
                }
            }
        }
    } catch (error) {
        console.log('[Tribunal] Case detection skipped:', error.message);
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
// VOICE SENTIMENT ANALYSIS
// Call this after voice generation to update NPC opinions
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze voice lines for NPC sentiment
 * Call this after generateVoices() completes
 * @param {Array} voiceResults - Array of { skillId, content } from generation
 * @param {string} messageText - The message that triggered generation
 */
export async function analyzeVoiceSentimentForNPCs(voiceResults, messageText) {
    try {
        const contactIntel = await getContactIntelligence();
        if (!contactIntel) return;
        
        // This is the main entry point that handles everything:
        // - Detects NPCs in the message
        // - Tracks pending contacts
        // - Updates voice opinions on existing contacts
        // - Checks for disposition shifts
        await contactIntel.updateContactIntelligence(voiceResults, { message: messageText });
        
    } catch (error) {
        console.log('[Tribunal] Voice sentiment analysis skipped:', error.message);
    }
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
