/**
 * The Tribunal - Main Entry Point
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

import { 
    createToggleFAB, 
    createPsychePanel, 
    togglePanel, 
    updateFABState, 
    switchTab,
    updateHealth,
    updateMorale,
    bindVitalsControls
} from './src/ui/panel.js';
import { showToast } from './src/ui/toasts.js';

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
// VOICE RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

function renderVoicesToPanel(voices) {
    const container = document.getElementById('ie-voices-output');
    if (!container) return;
    
    if (!voices || voices.length === 0) {
        container.innerHTML = `
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = voices.map(v => `
        <div class="ie-voice-block" style="border-left-color: ${v.color || '#a3a3a3'}">
            <div class="ie-voice-header">
                <span class="ie-voice-skill" style="color: ${v.color || '#a3a3a3'}">${v.skill}</span>
            </div>
            <div class="ie-voice-text">${v.text}</div>
        </div>
    `).join('');
}

function showVoicesLoading() {
    const container = document.getElementById('ie-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="ie-voices-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>The voices are deliberating...</span>
            </div>
        `;
    }
}

function showVoicesError(message) {
    const container = document.getElementById('ie-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="ie-voices-error">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VITALS REFRESH
// ═══════════════════════════════════════════════════════════════════════════════

function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
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
        
        const context = analyzeContext(lastMsg.mes);
        const selectedSkills = selectSpeakingSkills(context);
        const voices = await generateVoices(selectedSkills, context, getContext);
        
        renderVoicesToPanel(voices);
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
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════════════════════

function bindPanelEvents() {
    // Close button
    document.querySelector('.ie-btn-close-panel')?.addEventListener('click', togglePanel);
    
    // Tab switching
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Bottom buttons
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });
    
    // Manual trigger button
    document.getElementById('ie-manual-trigger')?.addEventListener('click', triggerVoices);
    
    // Clear voices button
    document.querySelector('.ie-btn-clear-voices')?.addEventListener('click', () => {
        renderVoicesToPanel([]);
    });
    
    // Vitals controls
    bindVitalsControls({
        onHealthChange: (delta) => {
            modifyHealth(delta, getContext());
            refreshVitals();
        },
        onMoraleChange: (delta) => {
            modifyMorale(delta, getContext());
            refreshVitals();
        }
    });
    
    // Settings save
    document.querySelector('.ie-btn-save-settings')?.addEventListener('click', () => {
        extensionSettings.enabled = document.getElementById('ie-enabled')?.checked ?? true;
        extensionSettings.autoTrigger = document.getElementById('ie-auto-trigger')?.checked ?? false;
        extensionSettings.maxTokens = parseInt(document.getElementById('ie-max-tokens')?.value) || 400;
        extensionSettings.connectionProfile = document.getElementById('ie-connection-profile')?.value || 'current';
        saveState(getContext());
        updateFABState(extensionSettings.enabled);
        showToast('Settings saved', 'success');
    });
}

function populateSettings() {
    const enabledEl = document.getElementById('ie-enabled');
    const autoTriggerEl = document.getElementById('ie-auto-trigger');
    const maxTokensEl = document.getElementById('ie-max-tokens');
    const profileEl = document.getElementById('ie-connection-profile');
    
    if (enabledEl) enabledEl.checked = extensionSettings.enabled;
    if (autoTriggerEl) autoTriggerEl.checked = extensionSettings.autoTrigger;
    if (maxTokensEl) maxTokensEl.value = extensionSettings.maxTokens;
    if (profileEl) profileEl.value = extensionSettings.connectionProfile;
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
        refreshVitals();
        populateSettings();
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
    const fab = createToggleFAB(getContext);
    const panel = createPsychePanel();
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    
    updateFABState(extensionSettings.enabled);
    
    // FAB click (with drag check)
    fab.addEventListener('click', (e) => {
        if (fab.dataset.justDragged === 'true') {
            fab.dataset.justDragged = 'false';
            return;
        }
        togglePanel();
    });
    
    // Bind all panel events
    bindPanelEvents();
    
    // Initial render
    populateSettings();
    refreshVitals();
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
