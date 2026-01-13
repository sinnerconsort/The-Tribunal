/**
 * Inland Empire - SillyTavern Extension
 * Main entry point - brings together all modular components
 * 
 * A Disco Elysium-inspired internal skill voice system for roleplay
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

// Data
import { SKILLS, ATTRIBUTES, ANCIENT_VOICES } from './src/data/skills.js';
import { STATUS_EFFECTS } from './src/data/statuses.js';
// voices.js removed - objects now AI-generated in discovery.js v3
import { THEMES, THOUGHTS } from './src/data/thoughts.js';

// Systems
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
    initializeDefaultBuild,
    // Phase 1 additions - Vitals
    vitals,
    getVitals,
    setHealth,
    setMorale,
    modifyHealth,
    modifyMorale,
    // Phase 1 additions - Ledger
    ledger,
    getLedger,
    // Phase 1 additions - Inventory
    inventory,
    getInventory,
    setMoney as setMoneyState
} from './src/core/state.js';

import { rollSkillCheck } from './src/systems/dice.js';

import {
    initializeThemeCounters,
    trackThemesInMessage,
    checkThoughtDiscovery,
    startResearch,
    abandonResearch,
    advanceResearch,
    dismissThought,
    forgetThought,
    addCustomThought,
    incrementMessageCount,
    getResearchPenalties,
    getTopThemes,
    MAX_INTERNALIZED_THOUGHTS
} from './src/systems/cabinet.js';

import {
    analyzeContext,
    selectSpeakingSkills,
    generateVoices
} from './src/voice/generation.js';

// UPDATED: Added autoScan import
import {
    createThoughtBubbleFAB,
    createDiscoveryModal,
    updateSceneContext,
    toggleDiscoveryModal,
    autoScan
} from './src/voice/discovery.js';

// UI
import {
    createPsychePanel,
    createToggleFAB,
    togglePanel,
    switchTab,
    // Phase 1 additions
    updateHealth,
    updateMorale,
    updateCaseTitle,
    updateMoney,
    updateWeather
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

// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'inland-empire';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// SillyTavern context reference
let stContext = null;

// Auto-generation tracking
let messagesSinceAutoGen = 0;
let isAutoGenerating = false;

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
// FAB VISIBILITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Updates the visibility and state of both FABs based on settings.
 * - Main FAB: Hidden when extension is disabled
 * - Investigation FAB: Hidden when extension is disabled OR when showInvestigationFab is false
 */
function updateFABState() {
    const fab = document.getElementById('inland-empire-fab');
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    // Main FAB visibility
    if (fab) {
        if (extensionSettings.enabled) {
            fab.style.display = 'flex';
            fab.classList.remove('ie-fab-disabled');
            fab.title = 'Open Psyche Panel';
        } else {
            // CHANGED: Hide completely instead of just dimming
            fab.style.display = 'none';
            fab.classList.add('ie-fab-disabled');
            fab.title = 'The Tribunal (Disabled)';
        }
    }
    
    // Investigation FAB visibility - controlled by both enabled AND showInvestigationFab
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

/**
 * Updates just the Investigation FAB visibility (for settings toggle)
 */
function updateInvestigationFABVisibility() {
    const thoughtFab = document.getElementById('ie-thought-fab');
    
    if (thoughtFab) {
        // Only show if BOTH extension is enabled AND setting allows it
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

async function triggerVoices(messageText = null) {
    if (!extensionSettings.enabled) {
        showToast('Extension is disabled', 'error', 3000);
        return;
    }

    const context = getContext();
    
    // Debug: Check if we can get context
    if (!context) {
        showToast('Could not get ST context', 'error', 5000);
        return;
    }

    const lastMsg = getLastMessage();
    const text = messageText || lastMsg?.mes || '';

    // Update scene context for investigation
    updateSceneContext(text);

    // Debug: Show what we're working with
    if (!text.trim()) {
        const chatLen = context?.chat?.length || 0;
        showToast(`No message found (chat has ${chatLen} messages)`, 'info', 5000);
        return;
    }

    showToast(`Analyzing: "${text.substring(0, 30)}..."`, 'info', 2000);
    const loadingToast = showToast('The voices stir...', 'loading');

    try {
        // Analyze context
        const analysisContext = analyzeContext(text);

        // Track themes
        trackThemesInMessage(text);
        incrementMessageCount();

        // Select speaking skills
        const selectedSkills = selectSpeakingSkills(analysisContext, {
            minVoices: extensionSettings.voicesPerMessage?.min || 1,
            maxVoices: extensionSettings.voicesPerMessage?.max || 4
        });

        if (selectedSkills.length === 0) {
            hideToast(loadingToast);
            showToast('No skills selected (context too vague?)', 'info', 5000);
            return;
        }

        showToast(`${selectedSkills.length} skills speaking...`, 'info', 2000);

        // Generate voices
        const voiceResults = await generateVoices(selectedSkills, analysisContext);
        
        showToast(`Generated ${voiceResults.length} voices`, 'info', 2000);

        // Advance research
        const completedThoughts = advanceResearch(text);
        for (const thoughtId of completedThoughts) {
            const thought = THOUGHTS[thoughtId];
            if (thought) {
                showInternalizedToast(thought, SKILLS);
            }
        }

        // Check for new thought discoveries
        const newThoughts = checkThoughtDiscovery();
        for (const thought of newThoughts) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
        }

        // Check for auto-generation of custom thoughts
        messagesSinceAutoGen++;
        if (shouldAutoGenerateThought(newThoughts.length)) {
            autoGenerateThought(text);
        }

        // Combine results
        const allVoices = [];

        // Add main voices (filter failed checks if setting disabled)
        const filteredVoices = extensionSettings.showFailedChecks ?
            voiceResults :
            voiceResults.filter(v => !v.checkResult || v.checkResult.success || v.isAncient);

        allVoices.push(...filteredVoices);

        // Render to panel
        const voicesContainer = document.getElementById('ie-voices-output');
        renderVoices(allVoices, voicesContainer);

        // Append to chat if enabled
        if (extensionSettings.showInChat !== false) {
            appendVoicesToChat(allVoices, getChatContainer());
        }

        hideToast(loadingToast);

    } catch (error) {
        console.error('[Inland Empire] Voice generation failed:', error);
        hideToast(loadingToast);
        showToast(`Error: ${error.message}`, 'error', 5000);
    }
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleStartResearch(thoughtId) {
    const result = startResearch(thoughtId);
    if (result.success) {
        saveState(getContext());
        refreshCabinetTab();
        showToast(`Researching: ${THOUGHTS[thoughtId]?.name || thoughtId}`, 'info');
    } else {
        showToast(result.reason, 'error');
    }
}

function handleDismissThought(thoughtId) {
    dismissThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
}

function handleAbandonResearch(thoughtId) {
    abandonResearch(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Research abandoned', 'info');
}

function handleForgetThought(thoughtId) {
    forgetThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Thought forgotten', 'info');
}

// ═══════════════════════════════════════════════════════════════
// AUTO THOUGHT GENERATION
// ═══════════════════════════════════════════════════════════════

function shouldAutoGenerateThought(recentDiscoveries) {
    if (!extensionSettings.autoDiscoverThoughts) return false;
    if (isAutoGenerating) return false;
    if (recentDiscoveries > 0) return false;
    
    const discovered = thoughtCabinet.discovered?.length || 0;
    const researching = Object.keys(thoughtCabinet.researching || {}).length;
    const internalized = thoughtCabinet.internalized?.length || 0;
    
    if (internalized >= MAX_INTERNALIZED_THOUGHTS) return false;
    if (discovered + researching >= 5) return false;
    if (messagesSinceAutoGen < 8) return false;
    
    return Math.random() < 0.15;
}

async function autoGenerateThought(contextText) {
    isAutoGenerating = true;
    messagesSinceAutoGen = 0;
    
    try {
        const topThemes = getTopThemes(3);
        const thought = await addCustomThought(contextText, topThemes);
        
        if (thought) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
            refreshCabinetTab();
        }
    } catch (error) {
        console.error('[Inland Empire] Auto thought generation failed:', error);
    } finally {
        isAutoGenerating = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// UI REFRESH HELPERS
// ═══════════════════════════════════════════════════════════════

function refreshAttributesDisplay() {
    const container = document.getElementById('ie-attributes-display');
    if (container) {
        renderAttributesDisplay(container, ATTRIBUTES, SKILLS, currentBuild);
    }
}

function refreshStatusTab() {
    const statusGrid = document.getElementById('ie-status-grid');
    const effectsSummary = document.getElementById('ie-active-effects-summary');
    
    if (statusGrid) {
        renderStatusGrid(statusGrid, STATUS_EFFECTS, activeStatuses, (statusId) => {
            toggleStatus(statusId);
            saveState(getContext());
            refreshStatusTab();
            refreshAttributesDisplay();
        });
    }
    
    if (effectsSummary) {
        renderActiveEffectsSummary(effectsSummary, activeStatuses, STATUS_EFFECTS);
    }
}

function refreshCabinetTab() {
    const container = document.getElementById('ie-cabinet-content');
    if (container) {
        renderThoughtCabinet(
            container,
            thoughtCabinet,
            THOUGHTS,
            THEMES,
            themeCounters,
            SKILLS,
            {
                onStartResearch: handleStartResearch,
                onAbandonResearch: handleAbandonResearch,
                onForget: handleForgetThought,
                showThemeTracker: extensionSettings.showThemeTracker
            }
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: VITALS, LEDGER, INVENTORY REFRESH
// ═══════════════════════════════════════════════════════════════

/**
 * Sync vitals display with current state
 * Call this when panel opens, profile loads, or vitals change
 */
function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
    
    // Update case title from character name
    updateCaseTitle(extensionSettings.characterName);
}

/**
 * Refresh ledger display (weather, cases, notes)
 */
function refreshLedgerDisplay() {
    const l = getLedger();
    updateWeather(l.weather.icon, l.weather.description);
    // TODO: Render cases/notes when Phase 3 is fully implemented
}

/**
 * Refresh inventory display (items, money)
 */
function refreshInventoryDisplay() {
    const inv = getInventory();
    updateMoney(inv.money);
    // TODO: Render carried/worn items when Phase 4 is fully implemented
}

function refreshProfilesTab() {
    const container = document.getElementById('ie-profiles-list');
    const editor = document.getElementById('ie-attributes-editor');
    
    if (container) {
        renderProfilesList(container, savedProfiles, currentBuild, (profileId) => {
            loadProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            refreshAttributesDisplay();
            refreshVitals();  // Phase 1: sync vitals on profile load
            showToast(`Loaded profile: ${savedProfiles[profileId]?.name || profileId}`, 'info');
        }, (profileId) => {
            deleteProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            showToast('Profile deleted', 'info');
        });
    }
    
    if (editor) {
        renderBuildEditor(editor, ATTRIBUTES, SKILLS, currentBuild, getAttributePoints);
        updatePointsRemaining();
    }
}

function populateSettingsForm() {
    const fields = {
        'ie-api-endpoint': extensionSettings.apiEndpoint,
        'ie-api-key': extensionSettings.apiKey,
        'ie-model': extensionSettings.model,
        'ie-temperature': extensionSettings.temperature,
        'ie-max-tokens': extensionSettings.maxTokens,
        'ie-min-voices': extensionSettings.voicesPerMessage?.min,
        'ie-max-voices': extensionSettings.voicesPerMessage?.max,
        'ie-trigger-delay': extensionSettings.triggerDelay,
        'ie-enabled': extensionSettings.enabled,
        'ie-show-dice-rolls': extensionSettings.showDiceRolls,
        'ie-show-failed-checks': extensionSettings.showFailedChecks,
        'ie-auto-trigger': extensionSettings.autoTrigger,
        'ie-intrusive-enabled': extensionSettings.intrusiveEnabled,
        'ie-intrusive-chance': (extensionSettings.intrusiveChance * 100).toFixed(0),
        'ie-intrusive-in-chat': extensionSettings.intrusiveInChat,
        'ie-pov-style': extensionSettings.povStyle,
        'ie-character-name': extensionSettings.characterName,
        'ie-character-pronouns': extensionSettings.characterPronouns,
        'ie-character-context': extensionSettings.characterContext,
        'ie-scene-perspective': extensionSettings.scenePerspective,
        'ie-show-investigation-fab': extensionSettings.showInvestigationFab !== false // NEW
    };
    
    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (!el) continue;
        
        if (el.type === 'checkbox') {
            el.checked = !!value;
        } else {
            el.value = value ?? '';
        }
    }
}

function closeAllModals() {
    // Close thought modal
    const thoughtModal = document.getElementById('ie-thought-modal');
    if (thoughtModal) thoughtModal.remove();
    
    // Close discovery modal
    const discoveryOverlay = document.getElementById('ie-discovery-overlay');
    if (discoveryOverlay?.classList.contains('ie-discovery-open')) {
        toggleDiscoveryModal();
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
        
        // Refresh vitals display when opening - Phase 1
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

    // Bottom buttons (Settings/Profiles) - Phase 1
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
            showInvestigationFab: document.getElementById('ie-show-investigation-fab')?.checked ?? true // NEW
        };

        updateSettings(newSettings);
        saveState(getContext());
        updateFABState(); // Update FAB visibility after settings change
        
        // Sync extension panel checkbox
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
        const editorInputs = document.querySelectorAll('.ie-attr-input');
        const allocation = {};
        
        editorInputs.forEach(input => {
            allocation[input.dataset.attr] = parseInt(input.value) || 1;
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

    // Investigation FAB toggle in settings - NEW
    document.getElementById('ie-show-investigation-fab')?.addEventListener('change', (e) => {
        extensionSettings.showInvestigationFab = e.target.checked;
        updateInvestigationFABVisibility();
        saveState(getContext());
    });
}

// ═══════════════════════════════════════════════════════════════
// AUTO TRIGGER SETUP
// ═══════════════════════════════════════════════════════════════

function setupAutoTrigger() {
    const context = getContext();
    if (!context?.eventSource) {
        console.warn('[Inland Empire] Event source not available');
        return;
    }

    context.eventSource.on('message_received', async () => {
        if (!extensionSettings.enabled) return;
        
        await new Promise(r => setTimeout(r, extensionSettings.triggerDelay || 1000));
        
        if (extensionSettings.autoTrigger) {
            triggerVoices();
        }
        
        // Auto-scan for investigation context (if enabled in discovery settings)
        const lastMsg = getLastMessage();
        if (lastMsg?.mes) {
            autoScan(lastMsg.mes);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    console.log('[Inland Empire] Initializing...');

    // Initialize state
    await loadState(getContext);
    initializeThemeCounters(THEMES);
    initializeDefaultBuild(ATTRIBUTES, SKILLS);

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

    // Create Discovery UI (Thought Bubble) - UPDATED: pass getContext
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
    refreshVitals();  // Phase 1

    // Bind events
    bindEvents();

    // Global ESC key handler - escape from any modal
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

    console.log('[Inland Empire] Ready!');
}

// ═══════════════════════════════════════════════════════════════
// JQUERY READY HOOK
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        await init();
        
        // ═══════════════════════════════════════════════════════════
        // GLOBAL API - For other extensions to interact with Inland Empire
        // ═══════════════════════════════════════════════════════════
        window.InlandEmpire = {
            // Version for compatibility checks
            version: '1.0.0',
            
            // ─────────────────────────────────────────────────────────
            // READ: Skill & State Queries
            // ─────────────────────────────────────────────────────────
            getSkills: () => ({ ...SKILLS }),
            getSkillData: (skillId) => SKILLS[skillId] ? { ...SKILLS[skillId] } : null,
            getSkillLevel: (skillId) => currentBuild[skillId] || 1,
            getEffectiveSkillLevel: (skillId) => {
                const base = getEffectiveSkillLevel(skillId, getResearchPenalties());
                const external = window.InlandEmpire._externalModifiers[skillId] || 0;
                return base + external;
            },
            getActiveStatuses: () => [...activeStatuses],
            isEnabled: () => extensionSettings.enabled,
            
            // ─────────────────────────────────────────────────────────
            // WRITE: External Modifier Registry
            // Other extensions can push/remove skill modifiers
            // ─────────────────────────────────────────────────────────
            _externalModifiers: {}, // { skillId: totalModifier }
            _modifierSources: {},   // { sourceId: { skillId: value, ... } }
            
            /**
             * Register a modifier from an external source (e.g., equipment)
             * @param {string} sourceId - Unique ID for the source (e.g., 'horrific_necktie', 'drunk_status')
             * @param {string} skillId - The skill to modify (e.g., 'inland_empire')
             * @param {number} value - The modifier value (+1, -2, etc.)
             */
            registerModifier: (sourceId, skillId, value) => {
                const api = window.InlandEmpire;
                
                // Initialize source tracking
                if (!api._modifierSources[sourceId]) {
                    api._modifierSources[sourceId] = {};
                }
                
                // Remove old value from total if exists
                const oldValue = api._modifierSources[sourceId][skillId] || 0;
                api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - oldValue;
                
                // Add new value
                api._modifierSources[sourceId][skillId] = value;
                api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) + value;
                
                console.log(`[Inland Empire API] Modifier registered: ${sourceId} → ${skillId} ${value >= 0 ? '+' : ''}${value}`);
                
                // Dispatch event for UI updates
                document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                    detail: { sourceId, skillId, value, totals: { ...api._externalModifiers } }
                }));
            },
            
            /**
             * Remove all modifiers from a source (e.g., when unequipping an item)
             * @param {string} sourceId - The source to remove
             */
            removeModifierSource: (sourceId) => {
                const api = window.InlandEmpire;
                const source = api._modifierSources[sourceId];
                
                if (!source) return;
                
                // Subtract all modifiers from this source
                for (const [skillId, value] of Object.entries(source)) {
                    api._externalModifiers[skillId] = (api._externalModifiers[skillId] || 0) - value;
                    if (api._externalModifiers[skillId] === 0) {
                        delete api._externalModifiers[skillId];
                    }
                }
                
                delete api._modifierSources[sourceId];
                console.log(`[Inland Empire API] Modifier source removed: ${sourceId}`);
                
                document.dispatchEvent(new CustomEvent('ie:modifier-changed', {
                    detail: { sourceId, removed: true, totals: { ...api._externalModifiers } }
                }));
            },
            
            /**
             * Get all modifiers from a specific source
             * @param {string} sourceId - The source to query
             */
            getModifiersFromSource: (sourceId) => {
                return { ...window.InlandEmpire._modifierSources[sourceId] } || {};
            },
            
            /**
             * Get total external modifier for a skill
             * @param {string} skillId - The skill to query
             */
            getExternalModifier: (skillId) => {
                return window.InlandEmpire._externalModifiers[skillId] || 0;
            },
            
            // ─────────────────────────────────────────────────────────
            // ACTIONS: Trigger things
            // ─────────────────────────────────────────────────────────
            
            /**
             * Roll a skill check
             * @param {string} skillId - The skill to check
             * @param {number} difficulty - Target difficulty (6-20)
             * @returns {object} { success, roll, total, isBoxcars, isSnakeEyes }
             */
            rollCheck: (skillId, difficulty) => {
                const effectiveLevel = window.InlandEmpire.getEffectiveSkillLevel(skillId);
                const result = rollSkillCheck(effectiveLevel, difficulty);
                
                // Dispatch event so other extensions can react
                document.dispatchEvent(new CustomEvent('ie:skill-check', {
                    detail: { skillId, difficulty, effectiveLevel, ...result }
                }));
                
                return result;
            },
            
            /**
             * Trigger the voice generation manually
             */
            triggerVoices: () => triggerVoices(getContext()),
            
            /**
             * Open/close the Psyche panel
             */
            togglePanel: () => togglePanel(),
            
            /**
             * Update FAB visibility (useful for external control)
             */
            updateFABState: () => updateFABState(),
            
            // ─────────────────────────────────────────────────────────
            // PHASE 1: Vitals API
            // ─────────────────────────────────────────────────────────
            
            /**
             * Get current vitals state
             * @returns {object} { health, maxHealth, morale, maxMorale }
             */
            getVitals: () => getVitals(),
            
            /**
             * Set health value (0 to maxHealth)
             * @param {number} value - New health value
             */
            setHealth: (value) => {
                setHealth(value, getContext());
                refreshVitals();
            },
            
            /**
             * Set morale value (0 to maxMorale)
             * @param {number} value - New morale value
             */
            setMorale: (value) => {
                setMorale(value, getContext());
                refreshVitals();
            },
            
            /**
             * Modify health by delta (positive or negative)
             * @param {number} delta - Amount to change health by
             */
            modifyHealth: (delta) => {
                modifyHealth(delta, getContext());
                refreshVitals();
            },
            
            /**
             * Modify morale by delta (positive or negative)
             * @param {number} delta - Amount to change morale by
             */
            modifyMorale: (delta) => {
                modifyMorale(delta, getContext());
                refreshVitals();
            }
        };
        
        console.log('[Inland Empire] Global API ready: window.InlandEmpire');
        
        // Dispatch ready event so other extensions know we're loaded
        document.dispatchEvent(new CustomEvent('ie:ready', { 
            detail: { version: window.InlandEmpire.version } 
        }));
        
    } catch (error) {
        console.error('[Inland Empire] Failed to initialize:', error);
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
