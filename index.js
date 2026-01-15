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

// Fortune System (extracted for maintainability)
import {
    LEDGER_PERSONALITIES,
    FORTUNE_PROMPTS,
    STATIC_FORTUNES,
    selectLedgerPersonality,
    getStaticFortune,
    isDeepNight
} from './src/data/fortune.js';

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
    updateProfile,
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

// Phase 2: Vitals Detection Imports
import {
    initVitalsHooks,
    processMessageForVitals,
    getVitalsAPI,
    analyzeTextForVitals
} from './src/systems/vitals/hooks.js';

// UI
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
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
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
// THOUGHT CABINET HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleStartResearch(thoughtId) {
    const result = startResearch(thoughtId, THOUGHTS);
    if (result.success) {
        saveState(getContext());
        refreshCabinetTab();
        showToast(`Researching: ${THOUGHTS[thoughtId]?.name || thoughtId}`, 'info');
    } else {
        showToast(result.reason || 'Cannot research this thought', 'error');
    }
}

function handleAbandonResearch(thoughtId) {
    abandonResearch(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Research abandoned', 'info');
}

function handleDismissThought(thoughtId) {
    dismissThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
}

function handleForgetThought(thoughtId) {
    forgetThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Thought forgotten', 'info');
}

async function handleAutoThoughtGeneration() {
    if (isAutoGenerating) return;
    if (!extensionSettings.enabled) return;
    
    isAutoGenerating = true;
    
    try {
        const thought = checkThoughtDiscovery(THOUGHTS);
        if (thought) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
            refreshCabinetTab();
        }
    } catch (error) {
        console.error('[The Tribunal] Auto thought generation failed:', error);
    } finally {
        isAutoGenerating = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// UI REFRESH HELPERS
// ═══════════════════════════════════════════════════════════════

function updateBuildPointsDisplay(pointsDisplay) {
    if (!pointsDisplay) return;
    
    let total = 0;
    Object.keys(ATTRIBUTES).forEach(attrId => {
        const valueEl = document.getElementById(`ie-attr-${attrId}`);
        if (valueEl) {
            total += parseInt(valueEl.textContent) || 1;
        }
    });
    
    const remaining = 12 - total;
    updatePointsRemaining(pointsDisplay, remaining);
}

function refreshAttributesDisplay() {
    const container = document.getElementById('ie-attributes-display');
    if (container) {
        renderAttributesDisplay(container);
    }
}

function refreshStatusTab() {
    const statusGrid = document.getElementById('ie-status-grid');
    const effectsSummary = document.getElementById('ie-active-effects-summary');
    
    if (statusGrid) {
        renderStatusGrid(statusGrid, (statusId) => {
            toggleStatus(statusId);
            saveState(getContext());
            refreshStatusTab();
            refreshAttributesDisplay();
        });
    }
    
    if (effectsSummary) {
        renderActiveEffectsSummary(effectsSummary);
    }
}

function refreshCabinetTab() {
    const container = document.getElementById('ie-cabinet-content');
    if (container) {
        renderThoughtCabinet(container, {
            onResearch: handleStartResearch,
            onAbandon: handleAbandonResearch,
            onDismiss: handleDismissThought,
            onForget: handleForgetThought,
            showThemeTracker: extensionSettings.showThemeTracker
        });
    }
}

function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
    updateCaseTitle(extensionSettings.characterName);
}

function refreshLedgerDisplay() {
    const l = getLedger();
    
    updateWeather(
        l.weather?.icon || 'fa-cloud-sun', 
        l.weather?.condition || 'Unknown',
        l.weather?.description || ''
    );
    
    const activeCasesList = document.getElementById('ie-active-cases-list');
    if (activeCasesList) {
        if (l.activeCases && l.activeCases.length > 0) {
            activeCasesList.innerHTML = l.activeCases.map(c => renderCaseCard(c)).join('');
        } else {
            activeCasesList.innerHTML = `
                <div class="ie-ledger-empty">
                    <i class="fa-solid fa-folder-open"></i>
                    <span>No active cases</span>
                </div>
            `;
        }
    }
    
    const completedCasesList = document.getElementById('ie-completed-cases-list');
    if (completedCasesList) {
        if (l.completedCases && l.completedCases.length > 0) {
            completedCasesList.innerHTML = l.completedCases.map(c => renderCaseCard(c)).join('');
        } else {
            completedCasesList.innerHTML = `
                <div class="ie-ledger-empty">
                    <i class="fa-solid fa-folder"></i>
                    <span>No closed cases</span>
                </div>
            `;
        }
    }
    
    if (l.compartment) {
        updateCompartmentCrack(l.compartment.crackStage || 0);
    }
    
    if (l.compartment?.discovered && l.officerProfile) {
        updateBadgeDisplay(l.officerProfile);
    }
    
    const notesEl = document.getElementById('ie-ledger-notes');
    if (notesEl && l.notes) {
        notesEl.value = Array.isArray(l.notes) ? l.notes.join('\n') : l.notes;
    }
}

function refreshInventoryDisplay() {
    const inv = getInventory();
    updateMoney(inv.money);
}

function refreshProfilesTab() {
    const container = document.getElementById('ie-profiles-list');
    const editor = document.getElementById('ie-attributes-editor');
    const pointsDisplay = document.getElementById('ie-points-remaining');
    
    if (container) {
        renderProfilesList(container, (profileId) => {
            loadProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            refreshAttributesDisplay();
            refreshVitals();
            showToast(`Loaded profile: ${savedProfiles[profileId]?.name || profileId}`, 'info');
        }, (profileId) => {
            deleteProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            showToast('Profile deleted', 'info');
        }, (profileId) => {
            updateProfile(profileId, getContext());
            refreshProfilesTab();
            showToast(`Updated profile: ${savedProfiles[profileId]?.name || profileId}`, 'success');
        });
    }
    
    if (editor) {
        renderBuildEditor(editor, (attr, delta) => {
            const valueEl = document.getElementById(`ie-attr-${attr}`);
            if (!valueEl) return;
            
            const current = parseInt(valueEl.textContent) || 1;
            const newValue = Math.max(1, Math.min(6, current + delta));
            
            if (newValue === current) return;
            
            valueEl.textContent = newValue;
            
            const minusBtn = editor.querySelector(`.ie-attr-minus[data-attr="${attr}"]`);
            const plusBtn = editor.querySelector(`.ie-attr-plus[data-attr="${attr}"]`);
            if (minusBtn) minusBtn.disabled = newValue <= 1;
            if (plusBtn) plusBtn.disabled = newValue >= 6;
            
            updateBuildPointsDisplay(pointsDisplay);
        });
        
        updateBuildPointsDisplay(pointsDisplay);
    }
}

function populateSettingsForm() {
    const profiles = getAvailableProfiles();
    populateConnectionProfiles(profiles, extensionSettings.connectionProfile || 'current');
    
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
        'ie-show-investigation-fab': extensionSettings.showInvestigationFab !== false,
        'ie-auto-detect-vitals': extensionSettings.autoDetectVitals,
        'ie-vitals-sensitivity': extensionSettings.vitalsSensitivity || 'medium',
        'ie-vitals-notifications': extensionSettings.vitalsShowNotifications !== false
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
    const thoughtModal = document.getElementById('ie-thought-modal');
    if (thoughtModal) thoughtModal.remove();
    
    const discoveryOverlay = document.getElementById('ie-discovery-overlay');
    if (discoveryOverlay?.classList.contains('ie-discovery-open')) {
        toggleDiscoveryModal();
    }
}

// ═══════════════════════════════════════════════════════════════
// LEDGER CASE & FORTUNE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function handleAddCase() {
    const title = prompt('Enter case title (e.g., "THE HANGED MAN"):');
    if (!title) return;
    
    const description = prompt('Brief description (optional):') || '';
    
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
    showToast(`Case opened: ${newCase.code}`, 'success');
}

async function handleDrawFortune() {
    if (Math.random() < 0.2) {
        showToast('Your fingers find only crumbs and dust.', 'info');
        return;
    }
    
    const loadingToast = showToast('Reaching into the compartment...', 'loading');
    
    try {
        const personality = selectLedgerPersonality();
        const prompt = FORTUNE_PROMPTS[personality.id];
        
        const v = getVitals();
        const l = getLedger();
        const contextHints = [];
        
        if (v.health < v.maxHealth * 0.3) contextHints.push('near death');
        if (v.morale < v.maxMorale * 0.3) contextHints.push('broken spirit');
        if (l.activeCases?.length > 0) contextHints.push(`working on: ${l.activeCases[0].title}`);
        if (isDeepNight()) contextHints.push('deep night hours');
        
        const fullPrompt = `${prompt}\n\nContext hints: ${contextHints.join(', ') || 'nothing special'}`;
        
        const response = await generateFortuneText(fullPrompt, personality);
        
        hideToast(loadingToast);
        
        if (response) {
            displayFortune({
                text: response,
                ledgerName: personality.name,
                ledgerType: personality.color
            });
            
            const ledger = getLedger();
            if (!ledger.fortunes) ledger.fortunes = [];
            ledger.fortunes.push({
                text: response,
                personality: personality.id,
                timestamp: Date.now()
            });
            saveState(getContext());
        } else {
            showToast('The wrapper is blank.', 'info');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('[The Tribunal] Fortune generation failed:', error);
        showToast('The fortune crumbles to dust.', 'error');
    }
}

async function generateFortuneText(prompt, personality) {
    try {
        const context = getContext();
        
        if (context?.generateQuietPrompt) {
            const result = await context.generateQuietPrompt(prompt, false, false);
            return result?.trim() || null;
        }
        
        // Fallback to static fortune
        return getStaticFortune(personality.id);
        
    } catch (error) {
        console.warn('[The Tribunal] API fortune failed, using fallback:', error);
        return getStaticFortune(personality.id);
    }
}

function checkCompartmentProgress() {
    const l = getLedger();
    if (!l.compartment) {
        l.compartment = {
            discovered: false,
            deepNightCritFails: 0,
            crackStage: 0,
            timesOpened: 0,
            lastOpened: null,
            countedThisSession: false
        };
    }
    
    if (l.compartment.discovered) return;
    if (l.compartment.countedThisSession) return;
    if (!isDeepNight()) return;
    
    l.compartment.countedThisSession = true;
    l.compartment.deepNightCritFails++;
    
    if (l.compartment.deepNightCritFails >= 3) {
        l.compartment.crackStage = 3;
        l.compartment.discovered = true;
        showToast('Something shifts in the binding. A smell. Apricot.', 'info', 5000);
    } else if (l.compartment.deepNightCritFails >= 2) {
        l.compartment.crackStage = 2;
    } else if (l.compartment.deepNightCritFails >= 1) {
        l.compartment.crackStage = 1;
    }
    
    updateCompartmentCrack(l.compartment.crackStage);
    saveState(getContext());
}

function handleLedgerNotesChange(e) {
    const l = getLedger();
    l.notes = e.target.value;
    saveState(getContext());
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
