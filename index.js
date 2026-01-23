/**
 * The Tribunal - SillyTavern Extension
 * A standalone text based Disco Elysium system
 * 
 * v0.9.8 - Fixed voice chat injection + voice persistence
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

import { registerEvents, onStateRefresh } from './src/core/events.js';
// FIX: Added getVoiceState and setLastGeneratedVoices for voice persistence
import { getSettings, saveSettings, setPersona, getVoiceState, setLastGeneratedVoices } from './src/core/state.js';

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

// ═══════════════════════════════════════════════════════════════
// IMPORTS - Voice Generation
// ═══════════════════════════════════════════════════════════════

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
    incrementMessageCount, getMessageCount
} from './src/core/state.js';

// Voice functions
export { generateVoicesForMessage, renderVoices, appendVoicesToChat };

// Investigation functions
export { initInvestigation, updateSceneContext, openInvestigation, closeInvestigation } from './src/systems/investigation.js';

// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'the-tribunal';
const extensionVersion = '0.9.8';

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
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>The voices are deliberating...</span>
            </div>
        `;
    }
}

function showVoicesError(message) {
    const container = document.getElementById('tribunal-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="tribunal-voices-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

/**
 * FIXED: Append voices to chat with retry logic
 * Sometimes the chat container isn't ready immediately
 */
function appendVoicesToChatWithRetry(voices, maxRetries = 3, delay = 200) {
    let attempts = 0;
    
    function tryAppend() {
        attempts++;
        const settings = getSettings();
        
        // Check if chat injection is enabled
        if (settings?.voices?.injectInChat === false) {
            console.log('[Tribunal] Chat injection disabled');
            return;
        }
        
        // FIX: Get the chat container element
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) {
            if (attempts < maxRetries) {
                console.log(`[Tribunal] Chat container not found, retrying... (${attempts}/${maxRetries})`);
                setTimeout(tryAppend, delay);
            } else {
                console.warn('[Tribunal] Chat container not found after retries');
            }
            return;
        }
        
        try {
            // FIX: Pass the chat container as second argument
            appendVoicesToChat(voices, chatContainer);
            console.log('[Tribunal] Voices appended to chat');
        } catch (error) {
            if (attempts < maxRetries) {
                console.log(`[Tribunal] Chat append failed, retrying... (${attempts}/${maxRetries})`);
                setTimeout(tryAppend, delay);
            } else {
                console.error('[Tribunal] Failed to append voices to chat:', error);
            }
        }
    }
    
    tryAppend();
}

export async function triggerVoiceGeneration(messageText, options = {}) {
    if (isGenerating) {
        console.log('[Tribunal] Generation already in progress');
        return;
    }
    
    isGenerating = true;
    const voicesContainer = document.getElementById('tribunal-voices-output');
    
    try {
        showVoicesLoading();
        
        if (options.openPanel !== false) {
            openPanel();
            switchTab('voices');
        }
        
        console.log('[Tribunal] Generating voices for:', messageText.substring(0, 50) + '...');
        const voices = await generateVoicesForMessage(messageText, options);
        
        // FIX: Save voices to chat state for persistence
        setLastGeneratedVoices(voices);
        
        // Render to panel
        renderVoices(voices, voicesContainer);
        
        // FIXED: Use retry logic for chat injection (now with proper container)
        appendVoicesToChatWithRetry(voices);
        
        console.log('[Tribunal] Voices generated:', voices.length);
        
        if (typeof toastr !== 'undefined' && voices.length > 0) {
            toastr.info(`${voices.length} voices speak`, 'The Tribunal', { timeOut: 2000 });
        }
        
        return voices;
        
    } catch (error) {
        console.error('[Tribunal] Voice generation failed:', error);
        showVoicesError(error.message || 'Generation failed');
        
        if (typeof toastr !== 'undefined') {
            toastr.error(error.message || 'Voice generation failed', 'The Tribunal');
        }
        
        throw error;
    } finally {
        isGenerating = false;
    }
}

async function onNewAIMessage(messageIndex) {
    // Check if auto-trigger is enabled
    const settings = getSettings();
    if (!settings?.voices?.autoGenerate) {
        console.log('[Tribunal] Auto-trigger disabled, skipping voice generation');
        return;
    }
    
    const ctx = getContext();
    const message = ctx?.chat?.[messageIndex];
    
    if (!message || message.is_user || message.is_system) {
        return;
    }
    
    // Update investigation scene context
    updateSceneContext(message.mes);
    
    // Apply trigger delay if set
    const delay = settings?.voices?.triggerDelay || 0;
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await triggerVoiceGeneration(message.mes, { openPanel: false });
}

export async function rescanLastMessage() {
    const ctx = getContext();
    if (!ctx?.chat?.length) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No chat messages to scan', 'The Tribunal');
        }
        return;
    }
    
    for (let i = ctx.chat.length - 1; i >= 0; i--) {
        const msg = ctx.chat[i];
        if (!msg.is_user && !msg.is_system) {
            await triggerVoiceGeneration(msg.mes);
            return;
        }
    }
    
    if (typeof toastr !== 'undefined') {
        toastr.warning('No AI messages found', 'The Tribunal');
    }
}

// ═══════════════════════════════════════════════════════════════
// UI REFRESH - Sync UI with state
// ═══════════════════════════════════════════════════════════════

function parseTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return { hours: 12, minutes: 0 };
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours: isNaN(hours) ? 12 : hours, minutes: isNaN(minutes) ? 0 : minutes };
}

/**
 * Get character name - tries state.persona first, falls back to ST context
 * @returns {string} Character name
 */
function getCharacterName() {
    const state = getChatState();
    
    // Try state.persona.name first
    if (state?.persona?.name && state.persona.name !== 'UNKNOWN' && state.persona.name !== '') {
        return state.persona.name;
    }
    
    // Fallback to SillyTavern context - use name1 (persona) not name2 (AI character)
    const ctx = getContext();
    const contextName = ctx?.name1;
    
    if (contextName && contextName !== '') {
        // Save to state for future use
        if (state?.persona) {
            state.persona.name = contextName;
        }
        return contextName;
    }
    
    return 'UNKNOWN';
}

/**
 * Generate a consistent badge number from character ID
 * @param {string} charId - Character identifier
 * @returns {string} Badge number like "41ST-7B3F2A"
 */
function generateBadgeNumber(charId) {
    if (!charId) return '41ST-______';
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < charId.length; i++) {
        const char = charId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex and take 6 characters
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
    return `41ST-${hex}`;
}

/**
 * Update badge number display
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
    
    // FIX: Restore last generated voices from state (persistence!)
    const voiceState = getVoiceState();
    if (voiceState?.lastGenerated?.length > 0) {
        const voicesContainer = document.getElementById('tribunal-voices-output');
        if (voicesContainer) {
            renderVoices(voiceState.lastGenerated, voicesContainer);
            console.log('[Tribunal] Restored saved voices:', voiceState.lastGenerated.length);
        }
    }
    
    console.log('[Tribunal] UI refreshed from state');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log(`[The Tribunal] Initializing v${extensionVersion}...`);

    initSettings();

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
    initCabinetHandlers();  // <-- NEW: Initialize cabinet tab handlers
    startWatch();
    registerEvents();
    
    eventSource.on(event_types.MESSAGE_RECEIVED, onNewAIMessage);
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
    window.tribunalRefreshCabinet = refreshCabinet;  // <-- NEW: Debug helper
    
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
