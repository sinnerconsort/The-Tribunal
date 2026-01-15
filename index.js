/**
 * The Tribunal - SillyTavern Extension
 * Main entry point - brings together all modular components
 * 
 * A Disco Elysium-inspired internal skill voice system for roleplay
 * Phase 2: Vitals Auto-Detection
 * Phase 3: Ledger Sub-Tabs & Fortune System
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

// Data
import { SKILLS, ATTRIBUTES, ANCIENT_VOICES } from './src/data/skills.js';
import { STATUS_EFFECTS } from './src/data/statuses.js';
import { THEMES, THOUGHTS } from './src/data/thoughts.js';
import { isDeepNight } from './src/data/fortune.js';

// Core State
import {
    extensionSettings,
    activeStatuses,
    currentBuild,
    savedProfiles,
    themeCounters,
    thoughtCabinet,
    discoveryContext,
    loadState,
    saveState,
    toggleStatus,
    getAttributePoints,
    applyAttributeAllocation,
    getEffectiveSkillLevel,
    updateSettings,
    saveProfile,
    loadProfile,
    deleteProfile,
    updateProfile,
    initializeDefaultBuild,
    vitals,
    getVitals,
    setHealth,
    setMorale,
    modifyHealth,
    modifyMorale,
    ledger,
    getLedger,
    inventory,
    getInventory,
    setMoney as setMoneyState
} from './src/core/state.js';

// Systems
import { rollSkillCheck } from './src/systems/dice.js';

import {
    initializeThemeCounters,
    trackThemesInMessage,
    checkThoughtDiscovery,
    startResearch,
    incrementMessageCount,
    getResearchPenalties,
    getTopThemes,
    MAX_INTERNALIZED_THOUGHTS
} from './src/systems/cabinet.js';

import {
    analyzeContext,
    selectSpeakingSkills,
    generateVoices,
    getAvailableProfiles
} from './src/voice/generation.js';

import {
    createThoughtBubbleFAB,
    createDiscoveryModal,
    updateSceneContext,
    toggleDiscoveryModal,
    autoScan
} from './src/voice/discovery.js';

import {
    initVitalsHooks,
    processMessageForVitals,
    getVitalsAPI,
    analyzeTextForVitals
} from './src/systems/vitals/hooks.js';

// UI - Panel & Toasts
import {
    createPsychePanel,
    createToggleFAB,
    togglePanel,
    switchTab,
    updateHealth,
    updateMorale,
    updateCaseTitle,
    updateMoney,
    updateWeather,
    populateConnectionProfiles,
    initLedgerSubTabs,
    updateCompartmentCrack,
    renderCaseCard,
    updateBadgeDisplay,
    displayFortune,
    generateCaseCode
} from './src/ui/panel.js';

import {
    showToast,
    hideToast,
    showDiscoveryToast,
    showInternalizedToast
} from './src/ui/toasts.js';

import {
    renderVoices,
    appendVoicesToChat,
    renderAttributesDisplay,
    renderBuildEditor,
    updatePointsRemaining,
    renderStatusGrid,
    renderActiveEffectsSummary,
    renderProfilesList,
    renderThoughtCabinet,
    renderThoughtModal
} from './src/ui/render.js';

// UI - Extracted Handlers
import {
    updateBuildPointsDisplay,
    refreshAttributesDisplay,
    refreshStatusTab as refreshStatusTabBase,
    refreshCabinetTab as refreshCabinetTabBase,
    refreshVitals,
    refreshLedgerDisplay,
    refreshInventoryDisplay,
    refreshProfilesTab as refreshProfilesTabBase,
    populateSettingsForm,
    closeAllModals as closeAllModalsBase
} from './src/ui/refresh.js';

import {
    handleAddCase as handleAddCaseBase,
    handleDrawFortune as handleDrawFortuneBase,
    checkCompartmentProgress as checkCompartmentProgressBase,
    handleLedgerNotesChange as handleLedgerNotesChangeBase
} from './src/ui/ledger-handlers.js';

import {
    createCabinetHandlers,
    handleStartResearch,
    handleAbandonResearch,
    handleDismissThought,
    handleForgetThought,
    handleAutoThoughtGeneration
} from './src/ui/cabinet-handlers.js';

// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'inland-empire';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

let stContext = null;
let messagesSinceAutoGen = 0;

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN INTEGRATION
// ═══════════════════════════════════════════════════════════════

function getContext() {
    if (stContext) return stContext;
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        stContext = SillyTavern.getContext();
    }
    return stContext;
}

function getLastMessage() {
    const context = getContext();
    if (!context?.chat?.length) return null;
    return context.chat[context.chat.length - 1];
}

function getChatContainer() {
    return document.getElementById('chat');
}

// ═══════════════════════════════════════════════════════════════
// BOUND HANDLER WRAPPERS
// ═══════════════════════════════════════════════════════════════

// Bound versions of extracted handlers that include getContext
function refreshStatusTab() {
    refreshStatusTabBase((statusId) => {
        toggleStatus(statusId);
    }, () => saveState(getContext()));
}

function refreshCabinetTab() {
    const handlers = createCabinetHandlers(getContext, refreshCabinetTab);
    refreshCabinetTabBase(handlers);
}

function refreshProfilesTab() {
    refreshProfilesTabBase({
        loadProfile,
        deleteProfile,
        updateProfile,
        saveState,
        getContext,
        onStatusRefresh: () => refreshStatusTab(),
        onCabinetRefresh: () => refreshCabinetTab()
    });
}

function closeAllModals() {
    closeAllModalsBase(toggleDiscoveryModal);
}

function handleAddCase() {
    handleAddCaseBase(getContext, refreshLedgerDisplay);
}

function handleDrawFortune() {
    handleDrawFortuneBase(getContext);
}

function checkCompartmentProgress() {
    checkCompartmentProgressBase(getContext);
}

function handleLedgerNotesChange(e) {
    handleLedgerNotesChangeBase(e, getContext);
}

// Cabinet handler wrappers
function onStartResearch(thoughtId) {
    handleStartResearch(thoughtId, getContext, refreshCabinetTab);
}

function onAbandonResearch(thoughtId) {
    handleAbandonResearch(thoughtId, getContext, refreshCabinetTab);
}

function onDismissThought(thoughtId) {
    handleDismissThought(thoughtId, getContext, refreshCabinetTab);
}

function onForgetThought(thoughtId) {
    handleForgetThought(thoughtId, getContext, refreshCabinetTab);
}

// ═══════════════════════════════════════════════════════════════
// FAB VISIBILITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function updateFABState() {
    const fab = document.getElementById('inland-empire-fab');
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    if (fab) {
        if (extensionSettings.enabled) {
            fab.style.display = 'flex';
            fab.classList.remove('ie-fab-disabled');
            fab.title = 'Open Psyche Panel';
        } else {
            fab.style.display = 'none';
            fab.classList.add('ie-fab-disabled');
            fab.title = 'The Tribunal (Disabled)';
        }
    }
    
    if (thoughtFab) {
        if (extensionSettings.enabled && extensionSettings.showInvestigationFab !== false) {
            thoughtFab.style.display = 'flex';
            thoughtFab.classList.remove('ie-thought-fab-disabled');
        } else {
            thoughtFab.style.display = 'none';
            thoughtFab.classList.add('ie-thought-fab-disabled');
        }
    }
}

function updateInvestigationFABVisibility() {
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    if (thoughtFab) {
        if (extensionSettings.enabled && extensionSettings.showInvestigationFab !== false) {
            thoughtFab.style.display = 'flex';
            thoughtFab.classList.remove('ie-thought-fab-disabled');
        } else {
            thoughtFab.style.display = 'none';
            thoughtFab.classList.add('ie-thought-fab-disabled');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN TRIGGER FUNCTION
// ═══════════════════════════════════════════════════════════════

async function triggerVoices(externalContext = null) {
    if (!extensionSettings.enabled) return;
    
    const context = externalContext || getContext();
    const lastMsg = getLastMessage();
    
    if (!lastMsg?.mes) {
        showToast('No message to analyze', 'info');
        return;
    }
    
    const loadingToast = showToast('Consulting inner voices...', 'loading');
    
    try {
        const themes = trackThemesInMessage(lastMsg.mes, THEMES);
        incrementMessageCount();
        
        const thought = checkThoughtDiscovery(THOUGHTS);
        if (thought) {
            showDiscoveryToast(thought, onStartResearch, onDismissThought);
        }
        
        const voiceContext = analyzeContext(lastMsg.mes, {
            themes,
            activeStatuses: [...activeStatuses],
            vitals: getVitals(),
            researchPenalties: getResearchPenalties()
        });
        
        const selectedSkills = selectSpeakingSkills(voiceContext, {
            currentBuild,
            activeStatuses: [...activeStatuses],
            settings: extensionSettings
        });
        
        if (selectedSkills.length === 0) {
            hideToast(loadingToast);
            showToast('No skills triggered', 'info');
            return;
        }
        
        const voices = await generateVoices(selectedSkills, voiceContext, {
            settings: extensionSettings,
            researchPenalties: getResearchPenalties()
        });
        
        hideToast(loadingToast);
        
        if (voices.length > 0) {
            const container = document.getElementById('ie-voices-output');
            if (container) {
                renderVoices(voices, container);
            }
            
            if (extensionSettings.appendToChat !== false) {
                appendVoicesToChat(voices, getChatContainer());
            }
            
            showToast(`${voices.length} voice${voices.length > 1 ? 's' : ''} spoke`, 'success');
        } else {
            showToast('Voices are silent...', 'info');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('[The Tribunal] Voice generation failed:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

function bindEvents() {
    // FAB click
    document.getElementById('inland-empire-fab')?.addEventListener('click', function(e) {
        if (this.dataset.justDragged === 'true') {
            this.dataset.justDragged = 'false';
            return;
        }
        togglePanel();
        
        const panel = document.getElementById('inland-empire-panel');
        if (panel?.classList.contains('ie-panel-open')) {
            refreshVitals();
        }
    });

    // Close panel button
    document.querySelector('.ie-btn-close-panel')?.addEventListener('click', togglePanel);

    // Tab switching (main 5 tabs)
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab, {
                onProfiles: refreshProfilesTab,
                onSettings: populateSettingsForm,
                onStatus: refreshStatusTab,
                onCabinet: refreshCabinetTab,
                onVoices: refreshAttributesDisplay,
                onLedger: refreshLedgerDisplay,
                onInventory: refreshInventoryDisplay
            });
        });
    });

    // Bottom buttons (Settings/Profiles)
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            switchTab(panel, {
                onProfiles: refreshProfilesTab,
                onSettings: populateSettingsForm,
                onStatus: refreshStatusTab,
                onCabinet: refreshCabinetTab,
                onVoices: refreshAttributesDisplay,
                onLedger: refreshLedgerDisplay,
                onInventory: refreshInventoryDisplay
            });
        });
    });

    // Manual trigger button
    document.getElementById('ie-manual-trigger')?.addEventListener('click', () => triggerVoices());

    // Clear voices
    document.querySelector('.ie-btn-clear-voices')?.addEventListener('click', () => {
        const container = document.getElementById('ie-voices-output');
        if (container) {
            container.innerHTML = `
                <div class="ie-voices-empty">
                    <i class="fa-solid fa-comment-slash"></i>
                    <span>Waiting for something to happen...</span>
                </div>
            `;
        }
    });

    // Test API
    document.getElementById('ie-test-api-btn')?.addEventListener('click', async () => {
        const endpoint = document.getElementById('ie-api-endpoint')?.value;
        const apiKey = document.getElementById('ie-api-key')?.value;
        const model = document.getElementById('ie-model')?.value;

        if (!endpoint || !apiKey) {
            showToast('Please fill in API endpoint and key', 'error');
            return;
        }

        const loadingToast = showToast('Testing API connection...', 'loading');

        try {
            const response = await fetch(endpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model || 'glm-4-plus',
                    messages: [{ role: 'user', content: 'Say "connection successful" in exactly those words.' }],
                    max_tokens: 20
                })
            });

            hideToast(loadingToast);

            if (response.ok) {
                showToast('API connection successful!', 'success');
            } else {
                const error = await response.json().catch(() => ({}));
                showToast(`API error: ${error.error?.message || response.statusText}`, 'error');
            }
        } catch (error) {
            hideToast(loadingToast);
            showToast(`Connection failed: ${error.message}`, 'error');
        }
    });

    // Save settings
    document.querySelector('.ie-btn-save-settings')?.addEventListener('click', () => {
        const newSettings = {
            connectionProfile: document.getElementById('ie-connection-profile')?.value || 'current',
            apiEndpoint: document.getElementById('ie-api-endpoint')?.value || '',
            apiKey: document.getElementById('ie-api-key')?.value || '',
            model: document.getElementById('ie-model')?.value || 'glm-4-plus',
            temperature: parseFloat(document.getElementById('ie-temperature')?.value) || 0.9,
            maxTokens: parseInt(document.getElementById('ie-max-tokens')?.value) || 300,
            voicesPerMessage: {
                min: parseInt(document.getElementById('ie-min-voices')?.value) || 1,
                max: parseInt(document.getElementById('ie-max-voices')?.value) || 4
            },
            triggerDelay: parseInt(document.getElementById('ie-trigger-delay')?.value) || 1000,
            enabled: document.getElementById('ie-enabled')?.checked ?? true,
            showDiceRolls: document.getElementById('ie-show-dice-rolls')?.checked ?? true,
            showFailedChecks: document.getElementById('ie-show-failed-checks')?.checked ?? true,
            autoTrigger: document.getElementById('ie-auto-trigger')?.checked ?? false,
            intrusiveEnabled: document.getElementById('ie-intrusive-enabled')?.checked ?? true,
            intrusiveChance: (parseInt(document.getElementById('ie-intrusive-chance')?.value) || 15) / 100,
            intrusiveInChat: document.getElementById('ie-intrusive-in-chat')?.checked ?? true,
            povStyle: document.getElementById('ie-pov-style')?.value || 'second',
            characterName: document.getElementById('ie-character-name')?.value || '',
            characterPronouns: document.getElementById('ie-character-pronouns')?.value || 'they',
            characterContext: document.getElementById('ie-character-context')?.value || '',
            scenePerspective: document.getElementById('ie-scene-perspective')?.value || '',
            showInvestigationFab: document.getElementById('ie-show-investigation-fab')?.checked ?? true,
            autoDetectVitals: document.getElementById('ie-auto-detect-vitals')?.checked ?? false,
            vitalsSensitivity: document.getElementById('ie-vitals-sensitivity')?.value || 'medium',
            vitalsShowNotifications: document.getElementById('ie-vitals-notifications')?.checked ?? true
        };

        updateSettings(newSettings);
        saveState(getContext());
        updateFABState();
        
        const extCheckbox = document.getElementById('ie-ext-enabled');
        if (extCheckbox) extCheckbox.checked = newSettings.enabled;

        showToast('Settings saved!', 'success');
    });

    // Reset FAB position
    document.querySelector('.ie-btn-reset-fab')?.addEventListener('click', () => {
        const fab = document.getElementById('inland-empire-fab');
        const thoughtFab = document.getElementById('ie-thought-fab');
        
        if (fab) {
            fab.style.top = '140px';
            fab.style.left = '10px';
            extensionSettings.fabPositionTop = 140;
            extensionSettings.fabPositionLeft = 10;
        }
        
        if (thoughtFab) {
            thoughtFab.style.top = '200px';
            thoughtFab.style.left = '10px';
            extensionSettings.discoveryFabTop = 200;
            extensionSettings.discoveryFabLeft = 10;
        }
        
        saveState(getContext());
        showToast('Icon positions reset', 'info');
    });

    // Save profile
    document.getElementById('ie-save-profile-btn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('ie-new-profile-name');
        const name = nameInput?.value?.trim();
        
        if (!name) {
            showToast('Please enter a profile name', 'error');
            return;
        }

        saveProfile(name);
        saveState(getContext());
        nameInput.value = '';
        refreshProfilesTab();
        showToast(`Profile saved: ${name}`, 'success');
    });

    // Apply build
    document.querySelector('.ie-btn-apply-build')?.addEventListener('click', () => {
        const allocation = {};
        
        Object.keys(ATTRIBUTES).forEach(attrId => {
            const valueEl = document.getElementById(`ie-attr-${attrId}`);
            if (valueEl) {
                allocation[attrId] = parseInt(valueEl.textContent) || 1;
            }
        });
        
        const result = applyAttributeAllocation(allocation);
        
        if (result.valid) {
            saveState(getContext());
            refreshAttributesDisplay();
            refreshProfilesTab();
            showToast('Build applied!', 'success');
        } else {
            showToast(`Invalid build: ${result.reason}`, 'error');
        }
    });

    // Investigation FAB toggle in settings
    document.getElementById('ie-show-investigation-fab')?.addEventListener('change', (e) => {
        extensionSettings.showInvestigationFab = e.target.checked;
        updateInvestigationFABVisibility();
        saveState(getContext());
    });
    
    // Ledger event bindings
    document.getElementById('ie-add-case-btn')?.addEventListener('click', handleAddCase);
    document.getElementById('ie-draw-fortune-btn')?.addEventListener('click', handleDrawFortune);
    document.getElementById('ie-ledger-notes')?.addEventListener('blur', handleLedgerNotesChange);
    
    // Vitals detection toggle
    document.getElementById('ie-auto-detect-vitals')?.addEventListener('change', (e) => {
        extensionSettings.autoDetectVitals = e.target.checked;
        saveState(getContext());
        showToast(e.target.checked ? 'Auto-detection enabled' : 'Auto-detection disabled', 'info');
    });
    
    // Manual vitals scan
    document.getElementById('ie-scan-vitals-btn')?.addEventListener('click', () => {
        const lastMsg = getLastMessage();
        if (!lastMsg?.mes) {
            showToast('No message to scan', 'info');
            return;
        }
        
        const result = analyzeTextForVitals(lastMsg.mes, {
            protagonistName: extensionSettings.characterName,
            sensitivity: extensionSettings.vitalsSensitivity || 'medium'
        });
        
        if (result.healthDelta !== 0 || result.moraleDelta !== 0) {
            if (result.healthDelta !== 0) modifyHealth(result.healthDelta, getContext());
            if (result.moraleDelta !== 0) modifyMorale(result.moraleDelta, getContext());
            refreshVitals();
            
            const parts = [];
            if (result.healthDelta !== 0) {
                const sign = result.healthDelta > 0 ? '+' : '';
                parts.push(`Health ${sign}${result.healthDelta}`);
            }
            if (result.moraleDelta !== 0) {
                const sign = result.moraleDelta > 0 ? '+' : '';
                parts.push(`Morale ${sign}${result.moraleDelta}`);
            }
            showToast(`Detected: ${parts.join(', ')} [${result.severity}]`, 'info', 5000);
        } else {
            showToast('No vitals changes detected in last message', 'info');
        }
    });
    
    // Manual vitals adjustment buttons
    document.getElementById('ie-health-minus')?.addEventListener('click', () => {
        modifyHealth(-1, getContext());
        refreshVitals();
        showToast('Health -1', 'warning', 1500);
    });
    
    document.getElementById('ie-health-plus')?.addEventListener('click', () => {
        modifyHealth(1, getContext());
        refreshVitals();
        showToast('Health +1', 'success', 1500);
    });
    
    document.getElementById('ie-morale-minus')?.addEventListener('click', () => {
        modifyMorale(-1, getContext());
        refreshVitals();
        showToast('Morale -1', 'warning', 1500);
    });
    
    document.getElementById('ie-morale-plus')?.addEventListener('click', () => {
        modifyMorale(1, getContext());
        refreshVitals();
        showToast('Morale +1', 'success', 1500);
    });
}

// ═══════════════════════════════════════════════════════════════
// AUTO TRIGGER SETUP
// ═══════════════════════════════════════════════════════════════

function setupAutoTrigger() {
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
        
        const lastMsg = getLastMessage();
        if (lastMsg?.mes) {
            autoScan(lastMsg.mes);
            
            if (extensionSettings.autoDetectVitals) {
                processMessageForVitals(lastMsg.mes, lastMsg.send_date);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    console.log('[The Tribunal] Initializing...');

    await loadState(getContext);
    initializeThemeCounters(THEMES);
    initializeDefaultBuild(ATTRIBUTES, SKILLS);
    
    // Initialize Vitals Detection Hooks
    initVitalsHooks({
        modifyHealth: (delta, ctx) => modifyHealth(delta, ctx),
        modifyMorale: (delta, ctx) => modifyMorale(delta, ctx),
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
        
        document.getElementById('ie-ext-enabled')?.addEventListener('change', (e) => {
            extensionSettings.enabled = e.target.checked;
            saveState(getContext());
            updateFABState();
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

    // Create Discovery UI
    const thoughtFab = createThoughtBubbleFAB(getContext);
    const discoveryModal = createDiscoveryModal();

    document.body.appendChild(thoughtFab);
    document.body.appendChild(discoveryModal);
    
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
            const panel = document.getElementById('inland-empire-panel');
            if (panel?.classList.contains('ie-panel-open')) {
                togglePanel();
            }
        }
    });

    setupAutoTrigger();
    
    // Reset session tracking for compartment
    const l = getLedger();
    if (l.compartment) {
        l.compartment.countedThisSession = false;
    }
    saveState(getContext());

    console.log('[The Tribunal] Ready!');
}

// ═══════════════════════════════════════════════════════════════
// JQUERY READY - ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        await init();
        
        // Create global API
        window.InlandEmpire = {
            version: '3.1.0',
            _externalModifiers: {},
            _modifierSources: {},
            
            // Getters
            getSettings: () => ({ ...extensionSettings }),
            isEnabled: () => extensionSettings.enabled,
            getBuild: () => currentBuild ? { ...currentBuild } : null,
            getAttributePoints: () => getAttributePoints(),
            getActiveStatuses: () => [...activeStatuses],
            getThemeCounters: () => ({ ...themeCounters }),
            getTopThemes: (n = 5) => getTopThemes(n),
            getThoughtCabinet: () => ({ ...thoughtCabinet }),
            getDiscoveryContext: () => ({ ...discoveryContext }),
            getSkillLevel: (skillId) => currentBuild?.skills?.[skillId]?.level ?? 0,
            getEffectiveSkillLevel: (skillId) => getEffectiveSkillLevel(skillId, getResearchPenalties()),
            getVitals: () => getVitals(),
            getLedger: () => getLedger(),
            
            // Setters
            setHealth: (value) => {
                setHealth(value, getContext());
                refreshVitals();
            },
            setMorale: (value) => {
                setMorale(value, getContext());
                refreshVitals();
            },
            modifyHealth: (delta) => {
                modifyHealth(delta, getContext());
                refreshVitals();
            },
            modifyMorale: (delta) => {
                modifyMorale(delta, getContext());
                refreshVitals();
            },
            
            // External modifier system
            applyModifiers: (sourceId, modifiers) => {
                const api = window.InlandEmpire;
                if (!api._modifierSources[sourceId]) {
                    api._modifierSources[sourceId] = {};
                }
                
                for (const [skillId, value] of Object.entries(modifiers)) {
                    const oldValue = api._modifierSources[sourceId][skillId] || 0;
                    api._modifierSources[sourceId][skillId] = value;
                    api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - oldValue + value;
                }
                
                document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                    detail: { sourceId, modifiers, totals: { ...api._externalModifiers } }
                }));
            },
            
            removeModifiers: (sourceId) => {
                const api = window.InlandEmpire;
                if (!api._modifierSources[sourceId]) return;
                
                for (const [skillId, value] of Object.entries(api._modifierSources[sourceId])) {
                    api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - value;
                    if (api._externalModifiers[skillId] === 0) {
                        delete api._externalModifiers[skillId];
                    }
                }
                
                delete api._modifierSources[sourceId];
                
                document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                    detail: { sourceId, removed: true, totals: { ...api._externalModifiers } }
                }));
            },
            
            getModifiersFromSource: (sourceId) => {
                return { ...window.InlandEmpire._modifierSources[sourceId] } || {};
            },
            
            getExternalModifier: (skillId) => {
                return window.InlandEmpire._externalModifiers[skillId] || 0;
            },
            
            // Actions
            rollCheck: (skillId, difficulty) => {
                const effectiveLevel = window.InlandEmpire.getEffectiveSkillLevel(skillId);
                const result = rollSkillCheck(effectiveLevel, difficulty);
                
                document.dispatchEvent(new CustomEvent('ie:skill-check', {
                    detail: { skillId, difficulty, effectiveLevel, ...result }
                }));
                
                if (result.isSnakeEyes && isDeepNight()) {
                    checkCompartmentProgress();
                }
                
                return result;
            },
            
            triggerVoices: () => triggerVoices(getContext()),
            togglePanel: () => togglePanel(),
            updateFABState: () => updateFABState(),
            
            // Vitals detection
            analyzeVitals: (text) => {
                return analyzeTextForVitals(text, {
                    protagonistName: extensionSettings.characterName,
                    sensitivity: extensionSettings.vitalsSensitivity || 'medium'
                });
            },
            
            applyVitalsChange: (healthDelta, moraleDelta, reason = 'manual') => {
                if (healthDelta !== 0) modifyHealth(healthDelta, getContext());
                if (moraleDelta !== 0) modifyMorale(moraleDelta, getContext());
                refreshVitals();
                
                if (extensionSettings.vitalsShowNotifications) {
                    const parts = [];
                    if (healthDelta !== 0) parts.push(`Health ${healthDelta > 0 ? '+' : ''}${healthDelta}`);
                    if (moraleDelta !== 0) parts.push(`Morale ${moraleDelta > 0 ? '+' : ''}${moraleDelta}`);
                    showToast(`${parts.join(', ')} (${reason})`, healthDelta < 0 || moraleDelta < 0 ? 'warning' : 'success');
                }
                
                document.dispatchEvent(new CustomEvent('ie:vitals-changed', {
                    detail: { healthDelta, moraleDelta, reason }
                }));
            },
            
            // Ledger API
            addCase: (title, description = '') => {
                const l = getLedger();
                const caseCount = (l.activeCases?.length || 0) + (l.completedCases?.length || 0) + 1;
                
                const newCase = {
                    id: `case_${Date.now()}`,
                    code: generateCaseCode(41, caseCount),
                    title: title.toUpperCase(),
                    description,
                    status: 'active',
                    session: l.officerProfile?.sessions || 1,
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    created: Date.now()
                };
                
                if (!l.activeCases) l.activeCases = [];
                l.activeCases.push(newCase);
                
                saveState(getContext());
                refreshLedgerDisplay();
                return newCase;
            },
            
            isCompartmentDiscovered: () => {
                const l = getLedger();
                return l.compartment?.discovered || false;
            },
            
            revealCompartment: () => {
                const l = getLedger();
                if (!l.compartment) {
                    l.compartment = { discovered: false, deepNightCritFails: 0, crackStage: 0 };
                }
                l.compartment.discovered = true;
                l.compartment.crackStage = 3;
                updateCompartmentCrack(3);
                saveState(getContext());
                showToast('Compartment revealed', 'info');
            }
        };
        
        console.log('[The Tribunal] Global API ready: window.InlandEmpire');
        
        document.dispatchEvent(new CustomEvent('ie:ready', { 
            detail: { version: window.InlandEmpire.version } 
        }));
        
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
    }
});

// Export for potential external use
export {
    triggerVoices,
    togglePanel,
    extensionSettings,
    updateFABState,
    updateInvestigationFABVisibility
};
