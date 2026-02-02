/**
 * The Tribunal - SillyTavern Extension
 * A standalone text based Disco Elysium system
 * 
 * v0.12.0 - World State Parser integration
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS - SillyTavern
// ═══════════════════════════════════════════════════════════════

import { getContext } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// IMPORTS - State Management
// ═══════════════════════════════════════════════════════════════

import { 
    initSettings, 
    loadChatState, 
    hasActiveChat,
    getChatState,
    exportDebugState
} from './src/core/persistence.js';

import { EQUIPMENT_TYPES } from './src/data/equipment.js';

import { registerEvents, onStateRefresh } from './src/core/events.js';
// FIX: Added getVoiceState and setLastGeneratedVoices for voice persistence
import { getSettings, saveSettings, setPersona, getVoiceState, setLastGeneratedVoices, getEquipmentItems, addEquipment } from './src/core/state.js';
// ═══════════════════════════════════════════════════════════════
// IMPORTS - UI Components
// ═══════════════════════════════════════════════════════════════

import { createPsychePanel, createToggleFAB } from './src/ui/panel.js';
import { bindEvents, openPanel, closePanel, switchTab, togglePanel } from './src/ui/panel-helpers.js';
import { startWatch, setRPTime, setRPWeather } from './src/ui/watch.js';
import { updateCRTVitals, setRCMCopotype, setCRTCharacterName } from './src/ui/crt-vitals.js';
import { initProfiles, refreshProfilesFromState } from './src/ui/profiles-handlers.js';
import { initStatus, refreshStatusFromState } from './src/ui/status-handlers.js';
import { initSettingsTab } from './src/ui/settings-handlers.js';
import { initCabinetHandlers, refreshCabinet } from './src/ui/cabinet-handler.js';
import { initNewspaperStrip, updateNewspaperStrip } from './src/ui/newspaper-strip.js';
import { initLocationHandlers, refreshLocations } from './src/ui/location-handlers.js';
import { initAwareness } from './src/systems/ledger-awareness.js';
import { initCommentary } from './src/systems/ledger-commentary.js';
import { initFortuneInjection } from './src/systems/fortune-injection.js';
import { initFidgetPatterns } from './src/systems/fidget-patterns.js';
import { initFidgetCommentary } from './src/systems/fidget-commentary.js';
import { initInventoryTemplateHandlers } from './src/ui/inventory-template.js';
import { initAutoConsume } from './src/systems/auto-consume.js';
import './src/ui/contextual-animations.js';
import { initDeathHandler } from './src/systems/death-handler.js';
// ═══════════════════════════════════════════════════════════════
// IMPORTS - Weather System (lazy loaded - see init())
// ═══════════════════════════════════════════════════════════════

// Weather functions are loaded dynamically in init() to prevent blocking
let weatherLoaded = false;
let initWeatherSystem = () => {};
let syncWithWeatherTime = () => {};
let processWeatherMessage = () => {};
let setWeatherState = () => {};
let setSpecialEffect = () => {};
let triggerPale = () => {};
let exitPale = () => {};
let triggerHorror = () => {};
let isInPale = () => false;
let setEffectsEnabled = () => {};
let setEffectsIntensity = () => {};
let debugWeather = () => console.log('[Tribunal] Weather not loaded');

// ═══════════════════════════════════════════════════════════════
// IMPORTS - Voice Generation & Extraction (lazy loaded)
// ═══════════════════════════════════════════════════════════════
let extractFromMessage = async () => ({ error: 'not loaded' });
let processExtractionResults = async () => ({});
let generateEquipmentFromMessage = async () => ({ equipment: [], removed: [] });

// World State Parser (lazy loaded)
let processWorldTag = () => ({ updated: false, noTag: true });
let worldParserLoaded = false;

import { generateVoicesForMessage } from './src/voice/generation.js';
import { renderVoices, appendVoicesToChat, clearVoices } from './src/voice/render-voices.js';

// ═══════════════════════════════════════════════════════════════
// IMPORTS - Investigation (standalone module)
// ═══════════════════════════════════════════════════════════════

import { 
    initInvestigation, 
    updateSceneContext,
    openInvestigation,
    closeInvestigation 
} from './src/systems/investigation.js';

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS - For external access
// ═══════════════════════════════════════════════════════════════

// UI functions
export { togglePanel, switchTab, openPanel, closePanel } from './src/ui/panel-helpers.js';
export { updateCRTVitals, flashCRTEffect, setCRTCharacterName } from './src/ui/crt-vitals.js';
export { setRCMStatus, setRCMCopotype, addRCMAncientVoice, addRCMActiveEffect } from './src/ui/crt-vitals.js';
export { setRPTime, setRPWeather, getWatchMode } from './src/ui/watch.js';
export { updateNewspaperStrip } from './src/ui/newspaper-strip.js';

// Weather effects - exported via window.tribunal* helpers (dynamically loaded)

// State accessors
export { 
    getVitals, updateVitals, setHealth, setMorale, applyDamage, applyHealing,
    setCopotype, addActiveEffect, removeActiveEffect,
    getAttributes, setAttribute, getSkillLevel, setSkillBonus,
    getThoughtCabinet, discoverThought, startResearch, progressResearch, internalizeThought, forgetThought, addTheme,
    getInventory, addItem, removeItem, moveItem, updateMoney, setMoneyUnit,
    getLedger, addCase, updateCase, addNote, setWeather, setTime, addLocation,
    getRelationships, getRelationship, addRelationship, updateFavor, setVoiceOpinion, getDominantVoice,
    getVoiceState, setLastGeneratedVoices, awakenVoice, setActiveInvestigation, addDiscoveredClue,
    getPersona, setPersona,
    incrementMessageCount, getMessageCount, getEquipmentItems, addEquipment
} from './src/core/state.js';

// Voice functions
export { generateVoicesForMessage, renderVoices, appendVoicesToChat };

// Investigation functions
export { initInvestigation, updateSceneContext, openInvestigation, closeInvestigation } from './src/systems/investigation.js';

// Condition Effects
import('./ui/condition-effects.js').then(module => {
    module.initConditionEffects();
    module.startHealthMonitor();  // Auto-monitor health for visual effects
    console.log('[Tribunal] Condition effects initialized');
}).catch(err => {
    console.warn('[Tribunal] Condition effects not loaded:', err);
});
// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'the-tribunal';
const extensionVersion = '0.12.0';

// ═══════════════════════════════════════════════════════════════
// CHAT-ONLY FAB VISIBILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Check if we're currently in a chat view (no drawers/menus/panels open)
 * @returns {boolean}
 */
function isInChatView() {
    // Must have chat element
    const chat = document.getElementById('chat');
    if (!chat) return false;
    
    // Must have active character/group
    const ctx = getContext();
    if (!ctx?.characterId && !ctx?.groupId) return false;
    
    // Hide if ANY ST drawer is open
    const anyOpenDrawer = document.querySelector('.openDrawer');
    if (anyOpenDrawer) {
        return false;
    }
    
    // Hide if Tribunal panel is open
    const tribunalPanel = document.getElementById('inland-empire-panel');
    if (tribunalPanel && tribunalPanel.classList.contains('ie-panel-open')) {
        return false;
    }
    
    return true;
}

/**
 * Update FAB visibility based on current view AND settings
 */
function updateFABVisibility() {
    const settings = getSettings();
    const mainFab = document.getElementById('inland-empire-fab');
    const invFab = document.getElementById('tribunal-investigation-fab');
    
    // Check if extension is enabled
    const extensionEnabled = settings?.enabled !== false;
    const inChatView = isInChatView();
    
    // Main FAB visibility
    if (mainFab) {
        const showMainFab = extensionEnabled && (settings?.ui?.showFab !== false) && inChatView;
        mainFab.style.display = showMainFab ? 'flex' : 'none';
    }
    
    // Investigation FAB visibility - check both old and new setting paths
    if (invFab) {
        const showInvFab = extensionEnabled && 
            (settings?.investigation?.showFab !== false) && 
            (settings?.ui?.showInvestigationFab !== false) && 
            inChatView;
        invFab.style.display = showInvFab ? 'flex' : 'none';
    }
}

/**
 * Set up observers and listeners for FAB visibility
 */
function setupFABVisibilityWatchers() {
    // Initial check (delayed to let ST finish loading)
    setTimeout(updateFABVisibility, 500);
    
    // Watch for SillyTavern events
    const stEvents = [
        event_types.CHAT_CHANGED,
        event_types.CHARACTER_MESSAGE_RENDERED,
        event_types.GROUP_UPDATED
    ];
    
    stEvents.forEach(eventType => {
        if (eventType) {
            eventSource.on(eventType, () => {
                setTimeout(updateFABVisibility, 100);
            });
        }
    });
    
    // Watch for ANY class changes in the document (catches drawer open/close)
    const globalObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateFABVisibility();
                return;
            }
        }
    });
    
    // Observe the entire body for class changes (subtree catches all elements)
    globalObserver.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
    });
    
    // Periodic check as fallback (every 1 second)
    setInterval(updateFABVisibility, 1000);
    
    console.log('[Tribunal] FAB visibility watchers initialized');
}

// ═══════════════════════════════════════════════════════════════
// VOICE GENERATION SYSTEM
// ═══════════════════════════════════════════════════════════════

let isGenerating = false;

function showVoicesLoading() {
    const container = document.getElementById('tribunal-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="tribunal-voices-loading">
                <div class="loading-spinner"></div>
                <span>Consulting the voices...</span>
            </div>
        `;
    }
}

function hideVoicesLoading() {
    const loading = document.querySelector('.tribunal-voices-loading');
    if (loading) {
        loading.remove();
    }
}

/**
 * Handle generation of voices for a message
 * @param {string} messageText - The message text to analyze
 * @param {boolean} manualTrigger - Whether this was manually triggered
 */
async function triggerVoiceGeneration(messageText = null, manualTrigger = false) {
    if (isGenerating) {
        console.log('[Tribunal] Generation already in progress');
        return;
    }
    
    const settings = getSettings();
    
    // Check if extension is enabled
    if (settings.enabled === false) {
        console.log('[Tribunal] Extension disabled, skipping voice generation');
        return;
    }
    
    // Check auto-generate setting (unless manual)
    if (!manualTrigger && settings.voices?.autoGenerate === false) {
        console.log('[Tribunal] Auto-generate disabled');
        return;
    }
    
    // Get message text if not provided
    if (!messageText) {
        const ctx = getContext();
        const chat = ctx?.chat;
        if (!chat || chat.length === 0) return;
        
        const lastMsg = chat[chat.length - 1];
        if (!lastMsg || lastMsg.is_user) return;
        
        messageText = lastMsg.mes;
    }
    
    if (!messageText) return;
    
    isGenerating = true;
    showVoicesLoading();
    
    try {
        const voices = await generateVoicesForMessage(messageText);
        hideVoicesLoading();
        
        if (voices && voices.length > 0) {
            const container = document.getElementById('tribunal-voices-output');
            if (container) {
                renderVoices(voices, container);
            }
            
            // Append to chat (default: ON unless explicitly disabled)
            if (settings.voices?.appendToChat !== false) {
                const chatContainer = document.getElementById('chat');
                if (chatContainer) {
                    appendVoicesToChat(voices, chatContainer);
                }
            }
            
            // FIX: Save generated voices to state for persistence
            setLastGeneratedVoices(voices);
            
            console.log(`[Tribunal] Generated ${voices.length} voices`);
        } else {
            console.log('[Tribunal] No voices generated');
        }
    } catch (error) {
        console.error('[Tribunal] Voice generation failed:', error);
        hideVoicesLoading();
        
        const container = document.getElementById('tribunal-voices-output');
        if (container) {
            container.innerHTML = `
                <div class="tribunal-voices-error">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>Voice generation failed</span>
                </div>
            `;
        }
    } finally {
        isGenerating = false;
    }
}

/**
 * Handler for new AI messages
 */
/**
 * NEW onNewAIMessage function with WORLD tag parsing + extraction support:
 */

function onNewAIMessage(messageIndex) {
    const ctx = getContext();
    const chat = ctx?.chat;
    
    if (!chat || messageIndex < 0 || messageIndex >= chat.length) return;
    
    const message = chat[messageIndex];
    if (!message || message.is_user) return;
    
    console.log('[Tribunal] New AI message detected, index:', messageIndex);
    
    const settings = getSettings();
    
    // ═══════════════════════════════════════════════════════════════
    // WORLD TAG PARSING - Fast, no API call, runs first
    // Parses <!--- WORLD{"weather":"...","location":"...",...} --->
    // ═══════════════════════════════════════════════════════════════
    
    if (worldParserLoaded && settings?.worldState?.parseWorldTags !== false) {
        try {
            const worldResult = processWorldTag(message.mes, {
                updateLocation: true,
                updateWeather: settings?.worldState?.syncWeather !== false,
                updateTime: settings?.worldState?.syncTime !== false,
                notify: settings?.worldState?.showNotifications ?? true
            });
            
            if (worldResult.updated) {
                console.log('[Tribunal] World state updated from WORLD tag:', worldResult);
            }
        } catch (e) {
            console.warn('[Tribunal] World tag processing failed:', e.message);
        }
    }
    
    // Process message for weather/horror/pale keywords (if weather loaded)
    if (weatherLoaded && processWeatherMessage) {
        processWeatherMessage(message.mes, `msg-${messageIndex}`);
    }
    
    // Small delay to ensure message is fully rendered
    setTimeout(() => {
        triggerVoiceGeneration(message.mes, false);
    }, 500);


    
    // ═══════════════════════════════════════════════════════════════
    // EQUIPMENT EXTRACTION - Extract clothing/accessories from message
    // ═══════════════════════════════════════════════════════════════
    
    setTimeout(async () => {
        try {
            const equipResults = await generateEquipmentFromMessage(message.mes, {
                existingEquipment: getEquipmentItems()
            });
            
            if (equipResults.equipment?.length > 0) {
                for (const item of equipResults.equipment) {
                    addEquipment({
                        ...item,
                        equipped: true
                    });
                }
                console.log(`[Tribunal] Extracted ${equipResults.equipment.length} equipment items`);
                
                // Show toastr for each item
                if (typeof toastr !== 'undefined') {
                    for (const item of equipResults.equipment) {
                        toastr.success(`Found: ${item.name}`, 'Equipment', { timeOut: 3000 });
                    }
                }
            }
        } catch (e) {
            console.warn('[Tribunal] Equipment extraction failed:', e.message);
        }
    }, 1000);  // Slight delay after voice gen
    
    // ═══════════════════════════════════════════════════════════════
    // AI EXTRACTION - Extract quests, contacts, locations from message
    // Only runs if enabled AND world tag didn't provide location
    // ═══════════════════════════════════════════════════════════════
    
    if (settings?.extraction?.enabled !== false || settings?.worldState?.useAIExtractor) {
        runExtraction(message.mes);
    }
}

/**
 * Run AI extraction on a message (separate async function to not block)
 */
async function runExtraction(messageText) {
    try {
        const state = getChatState();
        if (!state) return;
        
        // Get existing data for context
        const existingCases = Object.values(state.cases || {});
        const existingContacts = Object.values(state.contacts || {});
        const existingLocations = state.ledger?.locations || [];
        
        // Extract data from message
        const results = await extractFromMessage(messageText, {
            existingCases,
            existingContacts,
            existingLocations
        });
        
        if (results.error) {
            console.warn('[Tribunal] Extraction error:', results.error);
            return;
        }
        
        // Process results and update state
        // Note: casesModule and contactsModule need to be imported if you want 
        // those to auto-track too. For now, just locations:
        const processed = await processExtractionResults(results, {
            notifyCallback: (msg, type) => {
                console.log(`[Tribunal] ${type}: ${msg}`);
                if (typeof toastr !== 'undefined') {
                    if (type.includes('location')) {
                        toastr.info(msg, 'Location', { timeOut: 3000 });
                    }
                }
            },
            locationsModule: true  // Enable location processing
            // casesModule: casesModule,     // Uncomment if you have cases module
            // contactsModule: contactsModule // Uncomment if you have contacts module
        });
        
        // Refresh UI if anything was extracted
        if (processed.locationsCreated.length > 0 || 
            processed.locationsVisited.length > 0 ||
            processed.currentLocationSet) {
            refreshLocations();
            console.log('[Tribunal] Locations refreshed after extraction');
        }
        
    } catch (e) {
        console.warn('[Tribunal] Extraction failed:', e.message);
    }
}


/**
 * Manual rescan of last message
 */
function rescanLastMessage() {
    const ctx = getContext();
    const chat = ctx?.chat;
    
    if (!chat || chat.length === 0) {
        console.log('[Tribunal] No messages to rescan');
        return;
    }
    
    // Find last AI message
    for (let i = chat.length - 1; i >= 0; i--) {
        if (!chat[i].is_user) {
            console.log('[Tribunal] Rescanning message index:', i);
            triggerVoiceGeneration(chat[i].mes, true);
            return;
        }
    }
    
    console.log('[Tribunal] No AI messages found to rescan');
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse time string to hours/minutes
 * @param {string} timeStr - Time string like "3:30 PM" or "15:30"
 * @returns {{hours: number, minutes: number}}
 */
function parseTimeString(timeStr) {
    if (!timeStr) return { hours: 12, minutes: 0 };
    
    // Try 12-hour format first
    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const isPM = ampmMatch[3].toUpperCase() === 'PM';
        
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        return { hours, minutes };
    }
    
    // Try 24-hour format
    const militaryMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
        return {
            hours: parseInt(militaryMatch[1], 10),
            minutes: parseInt(militaryMatch[2], 10)
        };
    }
    
    return { hours: 12, minutes: 0 };
}

/**
 * Get character name from context with fallback
 */
function getCharacterName() {
    const ctx = getContext();
    return ctx?.name1 || 'UNKNOWN';
}

/**
 * Generate a badge number from character ID
 */
function generateBadgeNumber(charId) {
    if (!charId) return '000-000';
    
    // Create a simple hash from the character ID
    let hash = 0;
    for (let i = 0; i < charId.length; i++) {
        const char = charId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Convert to badge format
    const part1 = Math.abs(hash % 1000).toString().padStart(3, '0');
    const part2 = Math.abs((hash >> 10) % 1000).toString().padStart(3, '0');
    
    return `${part1}-${part2}`;
}

/**
 * Update badge display
 * @param {string} badgeNumber - Badge to display
 */
function updateBadgeDisplay(badgeNumber) {
    const el = document.getElementById('rcm-badge-number');
    if (el) {
        el.textContent = badgeNumber;
    }
}

/**
 * Update character info from ST context
 */
function updateCharacterInfo() {
    const ctx = getContext();
    const charName = ctx?.name1 || 'UNKNOWN';  // Use persona name, not AI character
    const charId = ctx?.characterId || '';
    
    // Update CRT header
    setCRTCharacterName(charName);
    
    // Update badge
    const badge = generateBadgeNumber(charId);
    updateBadgeDisplay(badge);
    
    console.log(`[Tribunal] Character info: ${charName} (${badge})`);
}

function refreshAllPanels() {
    const state = getChatState();
    if (!state) return;
    
    // Update character info (name + badge) from ST context
    updateCharacterInfo();
    
    // Get character name with fallback
    const characterName = getCharacterName();
    
    const v = state.vitals;
    updateCRTVitals(v.health, v.maxHealth, v.morale, v.maxMorale, characterName);
    
    // Also update the CRT character name display directly
    setCRTCharacterName(characterName);
    
    if (state.ledger?.time?.display) {
        const { hours, minutes } = parseTimeString(state.ledger.time.display);
        setRPTime(hours, minutes);
    }
    if (state.ledger?.weather?.condition) {
        setRPWeather(state.ledger.weather.condition);
    }
    
    // Update newspaper strip with time/weather data
    const now = new Date();
    const hour = now.getHours();
    let period = 'AFTERNOON';
    if (hour >= 5 && hour < 7) period = 'DAWN';
    else if (hour >= 7 && hour < 12) period = 'MORNING';
    else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
    else if (hour >= 17 && hour < 20) period = 'EVENING';
    else if (hour >= 20 && hour < 23) period = 'NIGHT';
    else period = 'LATE_NIGHT';
    
    updateNewspaperStrip({
        dayOfWeek: state.ledger?.time?.dayOfWeek || now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: state.ledger?.time?.day || now.getDate(),
        weather: state.ledger?.weather?.type || (hour >= 6 && hour < 20 ? 'clear-day' : 'clear-night'),
        weatherText: state.ledger?.weather?.condition || 'Clear',
        temp: state.ledger?.weather?.temp,
        period: state.ledger?.time?.period || period
    });
    
    if (state.vitals?.copotype) {
        setRCMCopotype(state.vitals.copotype, true);
    }
    
    if (state.attributes) {
        const a = state.attributes;
        const intEl = document.getElementById('napkin-int-score');
        const psyEl = document.getElementById('napkin-psy-score');
        const fysEl = document.getElementById('napkin-fys-score');
        const motEl = document.getElementById('napkin-mot-score');
        if (intEl) intEl.textContent = a.intellect || 3;
        if (psyEl) psyEl.textContent = a.psyche || 3;
        if (fysEl) fysEl.textContent = a.physique || 3;
        if (motEl) motEl.textContent = a.motorics || 3;
    }
    
    refreshProfilesFromState();
    refreshStatusFromState();
    refreshCabinet();
    refreshLocations();
    
    // Refresh contacts list (lazy to avoid breaking if not loaded)
    import('./src/ui/contacts-handlers.js').then(module => {
        module.refreshContacts();
    }).catch(() => {});
    
    // FIX: Restore last generated voices from state (persistence!)
    const voiceState = getVoiceState();
    if (voiceState?.lastGenerated?.length > 0) {
        const voicesContainer = document.getElementById('tribunal-voices-output');
        if (voicesContainer) {
            renderVoices(voiceState.lastGenerated, voicesContainer);
            console.log('[Tribunal] Restored saved voices:', voiceState.lastGenerated.length);
        }
    }
    
    // Sync weather effects with current state (if loaded)
    if (weatherLoaded) {
        syncWithWeatherTime();
    }
    
    console.log('[Tribunal] UI refreshed from state');
}

refreshLocations();
// ═══════════════════════════════════════════════════════════════
// EXTENSION SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════

/**
 * Add extension settings to the Extensions panel
 * Creates the toggle in the sidebar Extensions tab
 */
async function addExtensionSettings() {
    try {
        // Direct HTML injection (more reliable than template loading)
        const settingsHtml = `
        <div class="inline-drawer" id="tribunal-extension-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>⚖️ The Tribunal</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div style="padding: 10px;">
                    <label class="checkbox_label">
                        <input type="checkbox" id="tribunal-extension-enabled">
                        <span>Enable The Tribunal</span>
                    </label>
                    
                    <p class="hint" style="margin-top: 8px; font-size: 0.85em; color: #888;">
                        Toggle to enable/disable the Disco Elysium voice system.<br>
                        Configure additional settings within the panel itself.
                    </p>
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <a href="#" id="tribunal-debug-export" class="menu_button" style="flex: 1; text-align: center;">
                            <i class="fa-solid fa-bug"></i> Debug
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Append to extensions settings container
        $('#extensions_settings2').append(settingsHtml);
        
        // Wire up the enable/disable toggle
        const settings = getSettings();
        $('#tribunal-extension-enabled')
            .prop('checked', settings.enabled !== false)
            .on('change', function() {
                const enabled = $(this).prop('checked');
                settings.enabled = enabled;
                saveSettings();
                
                // Show/hide the FAB and panel
                const fab = document.getElementById('ie-toggle-fab');
                const panel = document.getElementById('ie-panel');
                
                if (enabled) {
                    if (fab) fab.style.display = '';
                    toastr.success('The Tribunal enabled', 'Extension');
                } else {
                    if (fab) fab.style.display = 'none';
                    if (panel) panel.classList.remove('ie-panel-open');
                    toastr.info('The Tribunal disabled', 'Extension');
                }
            });
        
        // Wire up debug export button
        $('#tribunal-debug-export').on('click', (e) => {
            e.preventDefault();
            const debugData = exportDebugState();
            console.log('[Tribunal] Debug Export:', debugData);
            
            // Copy to clipboard
            const text = JSON.stringify(debugData, null, 2);
            navigator.clipboard.writeText(text).then(() => {
                toastr.success('Debug data copied to clipboard', 'The Tribunal');
            }).catch(() => {
                // Fallback: show in console
                console.log('Debug data:\n', text);
                toastr.info('Debug data logged to console', 'The Tribunal');
            });
        });
        
        console.log('[Tribunal] Extension settings panel added');
    } catch (error) {
        console.warn('[Tribunal] Could not add settings panel:', error.message);
        // Non-critical - extension still works without the settings panel
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    console.log(`[The Tribunal] Initializing v${extensionVersion}...`);

    initSettings();
    
    // Add settings panel to Extensions tab (non-critical)
    await addExtensionSettings();

    const panel = createPsychePanel();
    const mainFab = createToggleFAB();

    document.body.appendChild(panel);
    document.body.appendChild(mainFab);

    // Initialize investigation module (standalone)
    initInvestigation();

    setupFABVisibilityWatchers();

    bindEvents();
    initProfiles();
    initStatus();
    initSettingsTab();
    initCabinetHandlers();
    initNewspaperStrip();
    initAwareness();
    initCommentary();
    initFortuneInjection();
    initFidgetPatterns();
    initFidgetCommentary();
    initInventoryTemplateHandlers();
    initAutoConsume();
    initDeathHandler(getContext);  //

    // Lazy load extractor
try {
    const extractor = await import('./src/systems/ai-extractor.js');
    extractFromMessage = extractor.extractFromMessage;
    processExtractionResults = extractor.processExtractionResults;
    console.log('[Tribunal] AI Extractor loaded');
} catch (e) {
    console.warn('[Tribunal] AI Extractor not loaded:', e.message);
}

    // ═══════════════════════════════════════════════════════════════
    // WORLD STATE PARSER - Lazy load
    // ═══════════════════════════════════════════════════════════════
    try {
        const worldParser = await import('./src/systems/world-parser.js');
        processWorldTag = worldParser.processWorldTag;
        worldParserLoaded = true;
        console.log('[Tribunal] World Parser loaded');
        
        // Expose debug helper
        window.tribunalWorldParser = worldParser.debugWorldParser;
    } catch (e) {
        console.warn('[Tribunal] World Parser not loaded:', e.message);
    }
    
    // Initialize weather effects system (lazy loaded)
    try {
        const weatherModule = await import('./src/systems/weather-integration.js');
        initWeatherSystem = weatherModule.initWeatherSystem;
        syncWithWeatherTime = weatherModule.syncWithWeatherTime;
        processWeatherMessage = weatherModule.processMessage;
        setWeatherState = weatherModule.setWeatherState;
        setSpecialEffect = weatherModule.setSpecialEffect;
        triggerPale = weatherModule.triggerPale;
        exitPale = weatherModule.exitPale;
        triggerHorror = weatherModule.triggerHorror;
        isInPale = weatherModule.isInPale;
        setEffectsEnabled = weatherModule.setEffectsEnabled;
        setEffectsIntensity = weatherModule.setEffectsIntensity;
        debugWeather = weatherModule.debugWeather;
        
        initWeatherSystem({
            effectsEnabled: true,
            autoDetect: true,
            intensity: 'light',
            syncWithTimeOfDay: true,
            skipEventListeners: false
        });
        weatherLoaded = true;
        console.log('[Tribunal] Weather effects system initialized');
    } catch (e) {
        console.warn('[Tribunal] Weather system not loaded:', e.message);
        // Store error for display in settings panel
        window.tribunalWeatherError = e.message || String(e);
        if (typeof toastr !== 'undefined') {
            toastr.warning(`Weather: ${e.message}`, 'The Tribunal', { timeOut: 5000 });
        }
    }
    
    // Initialize contacts handlers (lazy import to be safe)
    import('./src/ui/contacts-handlers.js').then(module => {
        module.initContactsHandlers();
        console.log('[Tribunal] Contacts handlers initialized');
    }).catch(err => {
        console.warn('[Tribunal] Contacts handlers not loaded:', err.message);
    });

    // Initialize equipment handlers
import('./src/ui/equipment-handlers.js').then(module => {
    module.initEquipmentHandlers();
    console.log('[Tribunal] Equipment handlers initialized');
}).catch(err => {
    console.warn('[Tribunal] Equipment handlers not loaded:', err.message);
});

    // Initialize inventory subtabs
initInventoryTemplateHandlers();
console.log('[Tribunal] Inventory template handlers initialized');

    initLocationHandlers();
    console.log('[Tribunal] Location handlers initialized');

    startWatch();

    import('./src/voice/equipment-generation.js').then(module => {
    generateEquipmentFromMessage = module.generateEquipmentFromMessage;
    console.log('[Tribunal] Equipment generation loaded');
}).catch(err => {
    console.warn('[Tribunal] Equipment generation not loaded:', err.message);
});
    
    // Initialize radio
    import('./src/ui/radio.js').then(module => {
        module.initRadio();
        console.log('[Tribunal] Radio initialized');
    }).catch(err => {
        console.warn('[Tribunal] Radio not loaded:', err.message);
    });
    
    // Initialize ledger voices (drawer dice + fortunes in secret compartment)
    import('./src/systems/ledger-voices.js').then(module => {
        // Delay init slightly to ensure compartment DOM exists
        setTimeout(() => {
            module.initLedgerVoices();
            console.log('[Tribunal] Ledger voices initialized');
        }, 1000);

        // Initialize inventory system (handlers first, then link generation)
import('./src/ui/inventory-handlers.js').then(handlersModule => {
    handlersModule.initInventoryHandlers();
    console.log('[Tribunal] Inventory handlers initialized');
    
    // Expose for debugging and template access
    window.TribunalInventoryHandlers = handlersModule;
    
    // Now link generation module to template
    import('./src/voice/inventory-generation.js').then(genModule => {
        import('./src/ui/inventory-template.js').then(templateModule => {
            templateModule.setInventoryModules(genModule, handlersModule);
            console.log('[Tribunal] Inventory modules linked');
        });
    });
}).catch(err => {
    console.warn('[Tribunal] Inventory handlers not loaded:', err.message);
});

        // Initialize inventory effects system
import('./src/systems/inventory-effects.js').then(effectsModule => {
    // Expose globally for handlers to use
    window.TribunalEffects = effectsModule;

    // Initialize timers from saved state
    effectsModule.initEffectTimers();

        // Initialize timed effects display
import('./src/ui/timed-effects-display.js').then(module => {
    // Delay to ensure DOM is ready
    setTimeout(() => {
        module.initTimedEffectsDisplay();
        console.log('[Tribunal] Timed effects display initialized');
    }, 500);
}).catch(err => {
    console.warn('[Tribunal] Timed effects display not loaded:', err.message);
});
    
    
    console.log('[Tribunal] Inventory effects system initialized');
    
    // Listen for effect events
    window.addEventListener('tribunal:effectApplied', (e) => {
        console.log('[Tribunal] Effect applied:', e.detail.statusId);
        // Could trigger UI updates here
    });
    
    window.addEventListener('tribunal:effectRemoved', (e) => {
        console.log('[Tribunal] Effect expired:', e.detail.statusId);
        // Could trigger UI updates here
    });
    
}).catch(err => {
    console.warn('[Tribunal] Effects system not loaded:', err.message);
});

// Also expose state module globally for effects to access
import('./src/core/state.js').then(stateModule => {
    window.TribunalState = stateModule;
}).catch(err => {
    console.warn('[Tribunal] State module not exposed:', err.message);
});

        // Reinitialize effect timers when chat changes
eventSource.on(event_types.CHAT_CHANGED, () => {
    setTimeout(() => {
        if (window.TribunalEffects?.initEffectTimers) {
            window.TribunalEffects.initEffectTimers();
            console.log('[Tribunal] Effect timers reinitialized for new chat');
        }
    }, 300);
});
        
        // Expose debug helpers
        window.TribunalLedger = {
            rollDice: module.rollDrawerDice,
            drawFortune: module.drawFortune,
            getDiceStats: module.getDiceStats,
            getFortuneStats: module.getFortuneStats,
            getCurrentLuck: module.getCurrentLuckModifier,
            updateFAB: module.updateFABLuckIndicator,
            VOICES: module.LEDGER_VOICES
        };
    }).catch(err => {
        console.warn('[Tribunal] Ledger voices not loaded:', err.message);
    });
    
    // Initialize compartment unlock system (secret tab revelation)
    import('./src/systems/compartment-unlock.js').then(module => {
        setTimeout(() => {
            module.initCompartmentUnlock();
            
            // Check for unlock progression when panel opens
            // Also check periodically in case user leaves panel open past midnight
            setInterval(() => {
                if (document.querySelector('.ledger-subtab-secret')) {
                    module.checkCompartmentProgression();
                }
            }, 60000); // Check every minute
            
            console.log('[Tribunal] Compartment unlock system initialized');
        }, 1500);
        
        // Expose debug helpers
        window.TribunalCompartment = {
            check: module.checkCompartmentProgression,
            getStage: module.getCrackStage,
            isRevealed: module.isCompartmentRevealed,
            isLateNight: module.isLateNight,
            forceReveal: module.forceReveal,
            reset: module.resetCompartment
        };
    }).catch(err => {
        console.warn('[Tribunal] Compartment unlock not loaded:', err.message);
    });
    
    registerEvents();
    
    eventSource.on(event_types.MESSAGE_RECEIVED, onNewAIMessage);
    if (window.TribunalEffects?.onMessageTick) {
        const tickResult = window.TribunalEffects.onMessageTick();
        window.dispatchEvent(new CustomEvent('tribunal:messageTick', { detail: tickResult }));
        if (tickResult.expired.length > 0) {
            console.log('[Tribunal] Effects expired:', tickResult.expired.map(e => e.statusId));
        }
    }  //
    console.log('[Tribunal] Voice trigger registered for MESSAGE_RECEIVED');
    
    const rescanBtn = document.getElementById('tribunal-rescan-btn');
    if (rescanBtn) {
        rescanBtn.addEventListener('click', rescanLastMessage);
        console.log('[Tribunal] Rescan button wired');
    }
    
    onStateRefresh(refreshAllPanels);

    const ctx = getContext();
    if (ctx?.chat?.length > 0) {
        loadChatState();
        refreshAllPanels();
    }

    // Debug helpers
    window.tribunalDebug = exportDebugState;
    window.tribunalRefresh = refreshAllPanels;
    window.tribunalRescan = rescanLastMessage;
    window.tribunalGenerate = triggerVoiceGeneration;
    window.tribunalUpdateFabVisibility = updateFABVisibility;
    window.tribunalIsInChatView = isInChatView;
    window.tribunalOpenInv = openInvestigation;
    window.tribunalCloseInv = closeInvestigation;
    window.tribunalUpdateCharacter = updateCharacterInfo;
    window.tribunalRefreshCabinet = refreshCabinet;
    window.tribunalUpdateNewspaper = updateNewspaperStrip;  // Debug helper for newspaper
    
    // Weather effects debug helpers
    window.tribunalWeatherDebug = debugWeather;
    window.tribunalSetWeather = setWeatherState;
    window.tribunalTriggerHorror = triggerHorror;
    window.tribunalTriggerPale = triggerPale;
    window.tribunalExitPale = exitPale;
    window.tribunalSetEffectsIntensity = setEffectsIntensity;
    window.tribunalSetEffectsEnabled = setEffectsEnabled;
    
    // Contacts debug helper
    import('./src/ui/contacts-handlers.js').then(module => {
        window.tribunalRefreshContacts = module.refreshContacts;
    }).catch(() => {});
    
    import('./src/voice/api-helpers.js').then(api => {
        window.tribunalTestAPI = async () => {
            try {
                const result = await api.callAPI(
                    'You are a test. Respond with exactly: "Connection OK"',
                    'Test. Reply: "Connection OK"'
                );
                console.log('[Tribunal] API Test Result:', result);
                if (typeof toastr !== 'undefined') {
                    toastr.success(`API: ${result.substring(0, 50)}`, 'Test Passed');
                }
                return result;
            } catch (e) {
                console.error('[Tribunal] API Test Failed:', e);
                if (typeof toastr !== 'undefined') {
                    toastr.error(e.message, 'API Test Failed');
                }
                throw e;
            }
        };
    });

    console.log('[The Tribunal] UI ready!');
    if (typeof toastr !== 'undefined') {
        toastr.success('The Tribunal loaded!', 'Extension', { timeOut: 2000 });
    }
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error(`Init failed: ${error.message}`, 'The Tribunal');
        }
    }
});
