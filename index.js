/**
 * The Tribunal - Main Entry Point
 * index.js
 * 
 * Disco Elysium-inspired internal voice system for SillyTavern
 * v4.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS - State
// ═══════════════════════════════════════════════════════════════════════════════

import {
    extensionSettings,
    loadState,
    saveState,
    getVitals,
    modifyHealth,
    modifyMorale,
    setHealth,
    setMorale,
    getEffectiveSkillLevel,
    getThemeCounters,
    getPlayerContext,
    getDiscoveredThoughts
} from './src/core/state.js';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS - UI
// ═══════════════════════════════════════════════════════════════════════════════

import { createFAB, createPanel, togglePanel, openPanel, closePanel, updateFABState, switchTab } from './src/ui/panel.js';
import { bindPanelEvents, updateHealth, updateMorale } from './src/ui/panel-helpers.js';
import { showToast } from './src/ui/toasts.js';
import { renderVoices, showVoicesLoading, showVoicesError } from './src/ui/render-voices.js';
import { populateSettingsForm } from './src/ui/render-settings.js';
import { refreshVitals, refreshAll } from './src/ui/refresh.js';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS - Voice Generation
// ═══════════════════════════════════════════════════════════════════════════════

import { selectSpeakingSkills, generateVoices } from './src/voice/generation.js';
import { analyzeContext } from './src/voice/prompt-builder.js';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS - Systems
// ═══════════════════════════════════════════════════════════════════════════════

import { rollSkillCheck } from './src/systems/dice.js';
import { analyzeTextForVitals } from './src/systems/vitals/hooks.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SILLYTAVERN CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

let stContext = null;

function getContext() {
    if (stContext) return stContext;
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        stContext = SillyTavern.getContext();
    }
    return stContext;
}

function getLastMessage() {
    const ctx = getContext();
    if (!ctx?.chat?.length) return null;
    return ctx.chat[ctx.chat.length - 1];
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

let isGenerating = false;

async function triggerVoices() {
    if (!extensionSettings.enabled) return;
    if (isGenerating) return;
    
    const lastMsg = getLastMessage();
    if (!lastMsg?.mes) {
        showToast('No message to analyze', 'info');
        return;
    }
    
    isGenerating = true;
    
    try {
        showVoicesLoading();
        openPanel();
        
        const context = analyzeContext(lastMsg.mes);
        const selectedSkills = selectSpeakingSkills(context);
        const voices = await generateVoices(selectedSkills, context, getContext);
        
        renderVoices(voices);
        showToast('Voices generated', 'success');
        
    } catch (error) {
        console.error('[The Tribunal] Generation failed:', error);
        showVoicesError(error.message || 'Generation failed');
        showToast('Error: ' + error.message, 'error');
    } finally {
        isGenerating = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO TRIGGER
// ═══════════════════════════════════════════════════════════════════════════════

function setupAutoTrigger() {
    const ctx = getContext();
    if (!ctx?.eventSource) {
        console.warn('[The Tribunal] Event source not available');
        return;
    }

    ctx.eventSource.on('message_received', async () => {
        if (!extensionSettings.enabled || !extensionSettings.autoTrigger) return;
        await new Promise(r => setTimeout(r, extensionSettings.triggerDelay || 1000));
        triggerVoices();
    });
    
    ctx.eventSource.on('chat_changed', () => {
        loadState(getContext);
        refreshAll();
        populateSettingsForm(getContext());
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

async function init() {
    console.log('[The Tribunal] Initializing v4.0.0...');

    await loadState(getContext);
    
    // Extension settings panel in ST sidebar
    const container = document.getElementById('extensions_settings');
    if (container) {
        container.insertAdjacentHTML('beforeend', `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b><i class="fa-solid fa-brain"></i> The Tribunal</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="flex-container">
                        <label class="checkbox_label">
                            <input id="ie-ext-enabled" type="checkbox" ${extensionSettings.enabled ? 'checked' : ''}>
                            <span>Enable The Tribunal</span>
                        </label>
                        <small>When disabled, the FAB will be hidden.</small>
                    </div>
                </div>
            </div>
        `);
        
        document.getElementById('ie-ext-enabled')?.addEventListener('change', (e) => {
            extensionSettings.enabled = e.target.checked;
            saveState(getContext());
            updateFABState(e.target.checked);
            showToast(e.target.checked ? 'The Tribunal enabled' : 'The Tribunal disabled', 'info');
        });
    }

    // Create UI
    const fab = createFAB();
    const panel = createPanel();
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    
    updateFABState(extensionSettings.enabled);
    
    // Events
    fab.addEventListener('click', togglePanel);
    bindPanelEvents(getContext, { onRescan: triggerVoices });
    
    // Initial render
    populateSettingsForm(getContext());
    refreshAll();
    setupAutoTrigger();

    console.log('[The Tribunal] Ready!');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        await init();
        
        // Global API
        window.InlandEmpire = {
            version: '4.0.0',
            getSettings: () => ({ ...extensionSettings }),
            getVitals,
            getEffectiveSkillLevel,
            getThemeCounters,
            getPlayerContext,
            getDiscoveredThoughts,
            setHealth: (v) => { setHealth(v, getContext()); refreshVitals(); },
            modifyHealth: (d) => { modifyHealth(d, getContext()); refreshVitals(); },
            setMorale: (v) => { setMorale(v, getContext()); refreshVitals(); },
            modifyMorale: (d) => { modifyMorale(d, getContext()); refreshVitals(); },
            rollCheck: rollSkillCheck,
            analyzeVitals: analyzeTextForVitals,
            triggerVoices,
            togglePanel
        };
        
        console.log('[The Tribunal] Global API ready: window.InlandEmpire');
        
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
    }
});

export { triggerVoices, togglePanel, extensionSettings };
