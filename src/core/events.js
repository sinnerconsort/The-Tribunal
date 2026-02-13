/**
 * The Tribunal - Event Handlers
 * Hooks into SillyTavern's event system
 * 
 * @version 4.6.0 - AI-primary vitals/status detection
 *   - Wired processMessageStatuses into message flow
 *   - Regex vitals/status skipped when AI extraction is active (prevents double-processing)
 *   - AI extractor now applies vitals + condition-to-status mapping as primary source
 */

import { eventSource, event_types, chat } from '../../../../../../script.js';
import { 
    loadChatState, 
    saveChatState, 
    getChatState,
    hasActiveChat,
    getSettings
} from './persistence.js';
import { incrementMessageCount } from './state.js';

// Import vitals extraction for HP/Morale parsing from AI messages
import { processMessageVitals } from '../systems/vitals-extraction.js';

// Import status detection for auto-applying status effects from narrative
import { processMessageStatuses } from '../systems/status-detection.js';

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

let _aiExtractor = null;
let _aiExtractorLoaded = false;

let _casesHandlers = null;
let _casesHandlersLoaded = false;

let _contactsHandlers = null;
let _contactsHandlersLoaded = false;

let _casesData = null;
let _casesDataLoaded = false;

let _contactsData = null;
let _contactsDataLoaded = false;

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

async function getAIExtractor() {
    if (_aiExtractorLoaded) return _aiExtractor;
    
    try {
        _aiExtractor = await import('../systems/ai-extractor.js');
        console.log('[Tribunal] AI Extractor loaded');
    } catch (e) {
        console.log('[Tribunal] AI Extractor not available (optional):', e.message);
        _aiExtractor = null;
    }
    
    _aiExtractorLoaded = true;
    return _aiExtractor;
}

async function getCasesData() {
    if (_casesDataLoaded) return _casesData;
    
    try {
        _casesData = await import('../data/cases.js');
    } catch (e) {
        _casesData = null;
    }
    
    _casesDataLoaded = true;
    return _casesData;
}

async function getContactsData() {
    if (_contactsDataLoaded) return _contactsData;
    
    try {
        _contactsData = await import('../data/contacts.js');
    } catch (e) {
        _contactsData = null;
    }
    
    _contactsDataLoaded = true;
    return _contactsData;
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
// HELPER: Check if extension is enabled
// ═══════════════════════════════════════════════════════════════

/**
 * Check if the extension is currently enabled
 * Used as a gate at the top of every event handler
 * @returns {boolean}
 */
function isEnabled() {
    try {
        const settings = getSettings();
        return settings?.enabled !== false;
    } catch (e) {
        // If we can't even read settings, don't run
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get character names to exclude from NPC detection
// ═══════════════════════════════════════════════════════════════

/**
 * Get player + AI character names for NPC detection filtering
 * Prevents user persona and AI character from being added as contacts
 * Checks multiple sources since ctx.name1 may be the ST username, not the persona name
 * @returns {string[]}
 */
function getCharacterNames() {
    const names = new Set();
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (ctx) {
            if (ctx.name1) names.add(ctx.name1);
            if (ctx.name2) names.add(ctx.name2);
        }
        
        // Also check persona name — this is what {{user}} resolves to
        // ctx.name1 might be the ST username, not the character being played
        if (window.power_user?.persona_name) {
            names.add(window.power_user.persona_name);
        }
        if (window.power_user?.default_persona) {
            names.add(window.power_user.default_persona);
        }
    } catch (e) { /* silent */ }
    return [...names].filter(Boolean);
}

/**
 * Lazy-loaded looksLikeName from contact-intelligence
 * Used as final quality gate before promoting contacts
 */
let _looksLikeName = null;
async function getLooksLikeName() {
    if (_looksLikeName) return _looksLikeName;
    try {
        // FIX: Corrected import path (was './contact-intelligence.js')
        const mod = await import('../systems/contact-intelligence.js');
        _looksLikeName = mod.looksLikeName || (() => true);
    } catch (e) {
        _looksLikeName = () => true; // Fallback: allow all
    }
    return _looksLikeName;
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
 * Resets ALL module states BEFORE loading to prevent cross-chat bleeding
 */
async function onChatChanged() {
    // Skip ALL processing if extension is disabled
    if (!isEnabled()) {
        console.log('[Tribunal] Chat changed but extension is disabled - skipping');
        return;
    }
    
    console.log('[Tribunal] Chat changed - resetting and loading state');
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Reset ALL module states BEFORE loading new chat
    // This prevents stale data from bleeding between chats
    // ═══════════════════════════════════════════════════════════════
    
    // Reset cabinet state
    try {
        const cabinet = await import('../systems/cabinet.js');
        if (typeof cabinet.resetCabinetState === 'function') {
            cabinet.resetCabinetState();
            console.log('[Tribunal] Cabinet state reset');
        }
    } catch (e) {
        // Function not available - that's okay
    }
    
    // Reset inventory handlers (CRITICAL for preventing item bleed)
    try {
        const inventoryHandlers = await import('../ui/inventory-handlers.js');
        if (typeof inventoryHandlers.onChatChanged === 'function') {
            inventoryHandlers.onChatChanged();
            console.log('[Tribunal] Inventory handlers reset');
        } else if (typeof inventoryHandlers.resetLocalState === 'function') {
            inventoryHandlers.resetLocalState();
            console.log('[Tribunal] Inventory local state reset');
        }
    } catch (e) {
        console.log('[Tribunal] Inventory reset skipped:', e.message);
    }
    
    // Reset status handlers
    try {
        const statusHandlers = await import('../ui/status-handlers.js');
        if (typeof statusHandlers.onChatChanged === 'function') {
            statusHandlers.onChatChanged();
            console.log('[Tribunal] Status handlers reset');
        }
    } catch (e) {
        // Function not available - that's okay
    }
    
    // Reset timed effects display
    try {
        const timedEffects = await import('../ui/timed-effects-display.js');
        if (typeof timedEffects.onChatChanged === 'function') {
            timedEffects.onChatChanged();
            console.log('[Tribunal] Timed effects display reset');
        }
    } catch (e) {
        // Function not available - that's okay
    }
    
    // Reset condition effects
    try {
        const conditionEffects = await import('../ui/condition-effects.js');
        if (typeof conditionEffects.onChatChanged === 'function') {
            conditionEffects.onChatChanged();
            console.log('[Tribunal] Condition effects reset');
        }
    } catch (e) {
        // Function not available - that's okay
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Load new chat state
    // ═══════════════════════════════════════════════════════════════
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
    if (!isEnabled()) return;
    console.log('[Tribunal] Message sent');
    // Could set flags here for generation
}

/**
 * Handle message received from AI
 * @param {number} messageId - The message index
 */
async function onMessageReceived(messageId) {
    // Skip ALL processing if extension is disabled
    if (!isEnabled()) {
        return;
    }
    
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
    
    // ═══════════════════════════════════════════════════════════════
    // VITALS & STATUS DETECTION (Regex Fallback)
    // Only runs if AI extraction is NOT active for this message.
    // When AI extraction runs, it handles vitals + condition→status
    // mapping more accurately (understands metaphors, NPC context).
    // Regex serves as the fallback for when AI extraction is disabled.
    // ═══════════════════════════════════════════════════════════════
    const settings = getSettings();
    
    // Determine if AI extraction will handle vitals/status
    const extractCases = settings?.cases?.autoDetect;
    const extractContacts = settings?.contacts?.autoDetect;
    const extractEquipment = settings?.extraction?.autoEquipment ?? false;
    const extractInventory = settings?.extraction?.autoInventory ?? false;
    const aiWillHandle = extractCases || extractContacts || extractEquipment || extractInventory;
    
    if (!aiWillHandle) {
        // Regex vitals (fallback when AI extraction is off)
        try {
            if (messageText) {
                const vitalsResult = processMessageVitals(messageText);
                if (vitalsResult.applied) {
                    console.log('[Tribunal] Vitals updated (regex):', vitalsResult.events);
                    if (vitalsResult.healthDelta !== 0) {
                        console.log(`[Tribunal] Health ${vitalsResult.healthDelta > 0 ? '+' : ''}${vitalsResult.healthDelta}`);
                    }
                    if (vitalsResult.moraleDelta !== 0) {
                        console.log(`[Tribunal] Morale ${vitalsResult.moraleDelta > 0 ? '+' : ''}${vitalsResult.moraleDelta}`);
                    }
                }
            }
        } catch (error) {
            console.log('[Tribunal] Vitals extraction skipped:', error.message);
        }
        
        // Regex status detection (fallback when AI extraction is off)
        try {
            if (messageText && settings?.autoDetectStatus !== false) {
                const statusResult = processMessageStatuses(messageText);
                if (statusResult.applied.length > 0 || statusResult.removed.length > 0) {
                    if (statusResult.applied.length > 0) {
                        console.log('[Tribunal] Statuses applied (regex):', statusResult.applied.join(', '));
                    }
                    if (statusResult.removed.length > 0) {
                        console.log('[Tribunal] Statuses removed (regex):', statusResult.removed.join(', '));
                    }
                    triggerRefresh();
                }
            }
        } catch (error) {
            console.log('[Tribunal] Status detection skipped:', error.message);
        }
    } else {
        console.log('[Tribunal] Regex vitals/status skipped (AI extraction active)');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // THOUGHT CABINET - Theme tracking and research advancement
    // ═══════════════════════════════════════════════════════════════
    
    // Track themes in message (fills theme meters)
    try {
        if (settings?.thoughts?.trackThemes !== false) {
            trackThemesInMessage(messageText);
        }
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
            // Exclude player + AI character from NPC detection
            const excludeNames = getCharacterNames();
            
            // Just track mentions - voice sentiment analysis happens separately
            const detected = contactIntel.detectPotentialNPCs(messageText, excludeNames);
            
            if (detected && detected.size > 0) {
                for (const [name, data] of detected) {
                    contactIntel.trackPendingContact(name, messageText);
                }
                console.log('[Tribunal] Tracking NPCs:', Array.from(detected.keys()));
                
                // Check for contacts ready to promote
                if (settings?.contacts?.autoDetect) {
                    await promoteReadyContacts(contactIntel);
                }
            }
        }
    } catch (error) {
        // Contact intelligence is optional - don't break on errors
        console.log('[Tribunal] Contact scan skipped:', error.message);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // AI EXTRACTION - Extract ALL game state using AI
    // Handles: cases, contacts, locations, equipment, inventory,
    //          vitals (HP/Morale), and condition→status detection
    // ═══════════════════════════════════════════════════════════════
    try {
        if (aiWillHandle && messageText) {
            const aiExtractor = await getAIExtractor();
            
            if (aiExtractor) {
                // Gather ALL existing data for context
                const state = getChatState() || {};
                const existingCases = state.ledger?.cases || [];
                const existingContacts = Object.values(state.contacts || {});
                const existingLocations = state.ledger?.locations || [];
                const existingEquipment = state.equipment?.items || [];
                const existingInventory = state.inventory?.carried || [];
                
                console.log('[Tribunal] Running AI extraction (full)...');
                
                // Extract ALL types from message
                const results = await aiExtractor.extractFromMessage(messageText, {
                    existingCases,
                    existingContacts,
                    existingLocations,
                    existingEquipment,
                    existingInventory,
                    excludeNames: getCharacterNames()
                });
                
                if (results.error) {
                    console.warn('[Tribunal] AI extraction error:', results.error);
                } else {
                    // Process results with notifications
                    const showNotifications = settings.extraction?.showNotifications ?? true;
                    
                    const processed = await aiExtractor.processExtractionResults(results, {
                        excludeNames: getCharacterNames(),
                        notifyCallback: showNotifications ? (msg, type) => {
                            if (typeof toastr === 'undefined') return;
                            
                            // Determine notification style based on type
                            if (type.includes('complete') || type.includes('gain')) {
                                toastr.success(msg, 'The Tribunal');
                            } else if (type.includes('lost') || type.includes('loss')) {
                                toastr.warning(msg, 'The Tribunal');
                            } else {
                                toastr.info(msg, 'The Tribunal');
                            }
                        } : null
                    });
                    
                    // Log what was extracted
                    const extracted = [];
                    if (processed.casesCreated.length) extracted.push(`${processed.casesCreated.length} quests`);
                    if (processed.casesCompleted.length) extracted.push(`${processed.casesCompleted.length} completed`);
                    if (processed.contactsCreated.length) extracted.push(`${processed.contactsCreated.length} contacts`);
                    if (processed.locationsCreated.length) extracted.push(`${processed.locationsCreated.length} locations`);
                    if (processed.equipmentGained.length) extracted.push(`${processed.equipmentGained.length} clothing`);
                    if (processed.equipmentLost.length) extracted.push(`-${processed.equipmentLost.length} clothing`);
                    if (processed.inventoryGained.length) extracted.push(`${processed.inventoryGained.length} items`);
                    if (processed.inventoryLost.length) extracted.push(`-${processed.inventoryLost.length} items`);
                    if (processed.healthChange) extracted.push(`HP ${processed.healthChange > 0 ? '+' : ''}${processed.healthChange}`);
                    if (processed.moraleChange) extracted.push(`Morale ${processed.moraleChange > 0 ? '+' : ''}${processed.moraleChange}`);
                    if (processed.statusesApplied?.length) extracted.push(`+${processed.statusesApplied.length} statuses`);
                    if (processed.statusesCleared?.length) extracted.push(`-${processed.statusesCleared.length} statuses`);
                    
                    if (extracted.length > 0) {
                        console.log('[Tribunal] AI extracted:', extracted.join(', '));
                    }
                    
                    // Refresh UI for all changed sections
                    if (processed.casesCreated.length > 0 || processed.casesCompleted.length > 0) {
                        const casesHandlers = await getCasesHandlers();
                        if (casesHandlers?.renderCasesList) await casesHandlers.renderCasesList();
                    }
                    
                    if (processed.contactsCreated.length > 0 || processed.contactsUpdated.length > 0) {
                        const contactsHandlers = await getContactsHandlers();
                        if (contactsHandlers?.renderContactsList) await contactsHandlers.renderContactsList();
                    }
                    
                    if (processed.locationsCreated.length > 0 || processed.currentLocationSet) {
                        // Trigger location UI refresh
                        triggerRefresh();
                    }
                    
                    if (processed.equipmentGained.length > 0 || processed.equipmentLost.length > 0) {
                        // Refresh equipment display
                        try {
                            const equipHandlers = await import('../ui/equipment-handlers.js');
                            if (equipHandlers?.refreshEquipmentDisplay) equipHandlers.refreshEquipmentDisplay();
                        } catch (e) { /* optional */ }
                    }
                    
                    if (processed.inventoryGained.length > 0 || processed.inventoryLost.length > 0) {
                        // Refresh inventory display
                        try {
                            const invHandlers = await import('../ui/inventory-handlers.js');
                            if (invHandlers?.refreshDisplay) invHandlers.refreshDisplay();
                        } catch (e) { /* optional */ }
                    }
                    
                    if (processed.healthChange !== 0 || processed.moraleChange !== 0) {
                        // Update vitals display
                        triggerRefresh();
                    }
                    
                    if (processed.statusesApplied?.length > 0 || processed.statusesCleared?.length > 0) {
                        // Update status display
                        triggerRefresh();
                    }
                }
            } else {
                // Fallback to regex-based case intelligence if AI extractor not available
                console.log('[Tribunal] AI Extractor not available, using regex fallback');
                await fallbackRegexExtraction(messageText, settings);
            }
        }
    } catch (error) {
        console.log('[Tribunal] AI extraction skipped:', error.message);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // THOUGHT CABINET - Check for theme spikes and auto-suggest/generate
    // ═══════════════════════════════════════════════════════════════
    try {
        const thoughtSettings = settings?.thoughts || {};
        
        if (thoughtSettings.autoSuggest || thoughtSettings.autoGenerate) {
            const cabinet = await import('../systems/cabinet.js');
            const threshold = thoughtSettings.spikeThreshold || 8;
            
            // Check if any theme is spiking
            const spikingTheme = cabinet.getSpikingTheme?.(threshold);
            
            if (spikingTheme) {
                console.log('[Tribunal] Theme spiking:', spikingTheme.name, 'at', spikingTheme.count);
                
                if (thoughtSettings.autoGenerate) {
                    // Auto-generate thought without asking
                    const thoughtGen = await import('../voice/thought-generation.js');
                    if (thoughtGen?.autoGenerateFromTheme) {
                        console.log('[Tribunal] Auto-generating thought from theme:', spikingTheme.name);
                        
                        const thought = await thoughtGen.autoGenerateFromTheme(
                            spikingTheme,
                            () => triggerRefresh(),
                            (msg, type) => {
                                if (typeof toastr !== 'undefined') {
                                    if (type === 'success') toastr.success(msg, 'Thought');
                                    else if (type === 'error') toastr.error(msg, 'Thought');
                                    else toastr.info(msg, 'Thought');
                                }
                            }
                        );
                        
                        if (thought) {
                            // Discharge the theme after generating
                            cabinet.dischargeTheme?.(spikingTheme.id);
                        }
                    }
                } else if (thoughtSettings.autoSuggest) {
                    // Just notify the user
                    if (typeof toastr !== 'undefined') {
                        toastr.info(
                            `Theme "${spikingTheme.name}" is building... Open the Cabinet to generate a thought.`,
                            'Thought Surfacing',
                            { timeOut: 5000 }
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.log('[Tribunal] Thought spike check skipped:', error.message);
    }
    
    saveChatState();
    triggerRefresh();
}

// ═══════════════════════════════════════════════════════════════
// CONTACT PROMOTION
// Promotes pending contacts that have hit the mention threshold
// ═══════════════════════════════════════════════════════════════

/**
 * Check for pending contacts ready to be promoted to real contacts
 * Creates them in state.relationships so they appear in the UI
 * @param {object} contactIntel - Contact intelligence module
 */
async function promoteReadyContacts(contactIntel) {
    try {
        const suggestions = contactIntel.getContactSuggestions?.();
        if (!suggestions || suggestions.length === 0) return;
        
        const contactsData = await getContactsData();
        if (!contactsData?.createContact) return;
        
        const state = getChatState();
        if (!state) return;
        if (!state.relationships) state.relationships = {};
        
        let promoted = 0;
        
        // Get character names to exclude
        const charNames = getCharacterNames();
        const excludedLower = new Set();
        for (const n of charNames) {
            if (!n) continue;
            excludedLower.add(n.toLowerCase().trim());
            const first = n.trim().split(/\s+/)[0];
            if (first && first.length > 1) excludedLower.add(first.toLowerCase());
        }
        
        // Load name validator as final quality gate
        const validateName = await getLooksLikeName();
        
        for (const suggestion of suggestions) {
            // Skip player/AI character names
            const nameLower = suggestion.name?.toLowerCase()?.trim();
            if (excludedLower.has(nameLower)) {
                contactIntel.clearPendingContact?.(suggestion.name);
                continue;
            }
            
            // QUALITY GATE: Reject names that don't look like real character names
            if (!validateName(suggestion.name)) {
                console.log(`[Tribunal] Rejected non-name: "${suggestion.name}"`);
                contactIntel.clearPendingContact?.(suggestion.name);
                continue;
            }
            
            // Don't duplicate - check if already in relationships
            const alreadyExists = Object.values(state.relationships).some(
                c => c.name?.toLowerCase() === suggestion.name?.toLowerCase()
            );
            if (alreadyExists) {
                // Clear from pending since they're already a contact
                contactIntel.clearPendingContact?.(suggestion.name);
                continue;
            }
            
            // Create the contact
            const contact = contactsData.createContact({
                name: suggestion.name,
                context: suggestion.contexts?.[0] || '',
                disposition: 'neutral',
                manuallyEdited: false
            });
            
            state.relationships[contact.id] = contact;
            promoted++;
            
            // Clear from pending
            contactIntel.clearPendingContact?.(suggestion.name);
            
            // Seed voice opinions from context if available
            if (contactIntel.seedContactOpinions) {
                const contextText = suggestion.contexts?.join(' ') || '';
                if (contextText) {
                    await contactIntel.seedContactOpinions(contact.id, contextText);
                }
            }
            
            console.log(`[Tribunal] Auto-promoted contact: ${suggestion.name} (mentioned ${suggestion.mentionCount}x)`);
            
            // Toast notification
            if (typeof toastr !== 'undefined') {
                toastr.info(
                    `${suggestion.name} added to contacts`,
                    'New Contact',
                    { timeOut: 3000 }
                );
            }
        }
        
        if (promoted > 0) {
            saveChatState();
            
            // Refresh contacts UI
            const contactsHandlers = await getContactsHandlers();
            if (contactsHandlers?.renderContactsList) {
                await contactsHandlers.renderContactsList();
            }
        }
    } catch (error) {
        console.log('[Tribunal] Contact promotion skipped:', error.message);
    }
}

/**
 * Fallback to regex-based extraction when AI extractor is not available
 */
async function fallbackRegexExtraction(messageText, settings) {
    // Case intelligence (regex)
    if (settings.cases?.autoDetect) {
        try {
            const caseIntel = await getCaseIntelligence();
            if (caseIntel) {
                const showNotify = settings.cases?.showNotifications ?? true;
                
                const results = await caseIntel.processMessageForQuests(messageText, {
                    autoCreate: true,
                    notifyCallback: showNotify ? (msg) => {
                        if (typeof toastr !== 'undefined') toastr.info(msg, 'Case Detected');
                    } : null
                });
                
                if (results.created.length > 0) {
                    const casesHandlers = await getCasesHandlers();
                    if (casesHandlers?.renderCasesList) {
                        await casesHandlers.renderCasesList();
                    }
                }
            }
        } catch (e) {
            console.log('[Tribunal] Regex case detection failed:', e.message);
        }
    }
    
    // Contact regex fallback - uses pending→promotion pipeline
    if (settings.contacts?.autoDetect) {
        try {
            const contactIntel = await getContactIntelligence();
            if (contactIntel?.detectPotentialNPCs) {
                // Exclude player + AI character from NPC detection
                const excludeNames = getCharacterNames();
                const detected = contactIntel.detectPotentialNPCs(messageText, excludeNames);
                
                if (detected && detected.size > 0) {
                    // Track all detected names as pending
                    for (const [name, data] of detected) {
                        contactIntel.trackPendingContact(name, data.contexts?.[0] || messageText);
                    }
                    
                    // Promote any that have reached the mention threshold
                    await promoteReadyContacts(contactIntel);
                }
            }
        } catch (e) {
            console.log('[Tribunal] Regex contact detection failed:', e.message);
        }
    }
    
    saveChatState();
    triggerRefresh();
}

/**
 * Handle user swiping to different generation
 * @param {object} data - Swipe event data
 */
function onMessageSwiped(data) {
    if (!isEnabled()) return;
    
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
    if (!isEnabled()) return;
    
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
    if (!isEnabled()) return;
    
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
