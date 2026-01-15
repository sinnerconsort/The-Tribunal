/**
 * The Tribunal - Initialization
 * Extension setup and auto-trigger configuration
 */

import { THEMES } from '../data/thoughts.js';
import {
    extensionSettings,
    loadState,
    saveState,
    initializeDefaultBuild,
    getLedger
} from './state.js';
import { getContext, getLastMessage, updateFABState } from './st-helpers.js';
import { initializeThemeCounters } from '../systems/cabinet.js';
import { initVitalsHooks, processMessageForVitals } from '../systems/vitals/hooks.js';
import { modifyHealth, modifyMorale } from './state.js';
import {
    createPsychePanel,
    createToggleFAB,
    togglePanel,
    initLedgerSubTabs
} from '../ui/panel.js';
import { createThoughtBubbleFAB, createDiscoveryModal, autoScan } from '../voice/discovery.js';
import { showToast } from '../ui/toasts.js';
import { triggerVoices, setTriggerCallbacks } from './trigger.js';
import {
    refreshAttributesDisplay,
    refreshStatusTab,
    refreshCabinetTab,
    refreshVitals,
    refreshLedgerDisplay,
    closeAllModals,
    handleStartResearch,
    handleDismissThought
} from './ui-handlers.js';
import { bindEvents } from './events.js';

// ═══════════════════════════════════════════════════════════════
// AUTO TRIGGER SETUP
// ═══════════════════════════════════════════════════════════════

export function setupAutoTrigger() {
    const context = getContext();
    if (!context?.eventSource) {
        console.warn('[The Tribunal] Event source not available');
        return;
    }

    context.eventSource.on('message_received', async () => {
        if (!extensionSettings.enabled) return;
        
        await new Promise(r => setTimeout(r, extensionSettings.triggerDelay || 1000));
        
        if (extensionSettings.autoTrigger) {
            triggerVoices();
        }
        
        // Auto-scan for investigation context
        const lastMsg = getLastMessage();
        if (lastMsg?.mes) {
            autoScan(lastMsg.mes);
            
            // Auto-detect vitals changes
            if (extensionSettings.autoDetectVitals) {
                processMessageForVitals(lastMsg.mes, lastMsg.send_date);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export async function init() {
    console.log('[The Tribunal] Initializing...');

    // Initialize state
    await loadState(getContext);
    initializeThemeCounters(THEMES);
    initializeDefaultBuild(); // No parameters - uses defaults from state.js
    
    // Wire up trigger callbacks to avoid circular dependencies
    setTriggerCallbacks({
        onStartResearch: handleStartResearch,
        onDismissThought: handleDismissThought,
        onRefreshCabinet: refreshCabinetTab
    });
    
    // Initialize Vitals Detection Hooks
    initVitalsHooks({
        modifyHealth: (delta, ctx) => {
            modifyHealth(delta, ctx);
        },
        modifyMorale: (delta, ctx) => {
            modifyMorale(delta, ctx);
        },
        getSettings: () => extensionSettings,
        getContext: getContext,
        showToast: showToast,
        refreshVitals: refreshVitals
    });

    // Create extension settings panel entry
    const extensionSettingsContainer = document.getElementById('extensions_settings');
    if (extensionSettingsContainer) {
        const settingsHtml = `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-address-card"></i> The Tribunal</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="flex-container">
                        <label class="checkbox_label">
                            <input id="ie-ext-enabled" type="checkbox" ${extensionSettings.enabled ? 'checked' : ''}>
                            <span>Enable The Tribunal</span>
                        </label>
                        <small>When disabled, voices won't trigger and the FAB will be hidden.</small>
                    </div>
                </div>
            </div>
        `;
        extensionSettingsContainer.insertAdjacentHTML('beforeend', settingsHtml);
        
        // Bind the enable toggle
        document.getElementById('ie-ext-enabled')?.addEventListener('change', (e) => {
            extensionSettings.enabled = e.target.checked;
            saveState(getContext());
            updateFABState();
            // Sync with the settings panel checkbox too
            const settingsCheckbox = document.getElementById('ie-enabled');
            if (settingsCheckbox) settingsCheckbox.checked = e.target.checked;
            showToast(e.target.checked ? 'The Tribunal enabled' : 'The Tribunal disabled', 'info');
        });
    }

    // Create UI
    const panel = createPsychePanel();
    const fab = createToggleFAB(getContext);

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // Initialize Ledger Sub-Tabs
    initLedgerSubTabs();

    // Create Discovery UI (Thought Bubble)
    const thoughtFab = createThoughtBubbleFAB(getContext);
    const discoveryModal = createDiscoveryModal();

    document.body.appendChild(thoughtFab);
    document.body.appendChild(discoveryModal);
    
    // Set initial FAB state
    updateFABState();

    // Initial renders
    refreshAttributesDisplay();
    refreshStatusTab();
    refreshCabinetTab();
    refreshVitals();
    refreshLedgerDisplay();

    // Bind events
    bindEvents();

    // Global ESC key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            
            // Also close panel if open and no modals were open
            const panel = document.getElementById('inland-empire-panel');
            if (panel?.classList.contains('ie-panel-open')) {
                togglePanel();
            }
        }
    });

    // Setup auto-trigger
    setupAutoTrigger();
    
    // Reset session tracking for compartment at startup
    const l = getLedger();
    if (l.compartment) {
        l.compartment.countedThisSession = false;
    }

    console.log('[The Tribunal] Ready!');
}
