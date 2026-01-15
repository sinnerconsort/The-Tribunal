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

// ═══════════════════════════════════════════════════════════════
// PHASE 2: Vitals Detection Imports
// ═══════════════════════════════════════════════════════════════

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
    // Phase 1 additions
    updateHealth,
    updateMorale,
    updateCaseTitle,
    updateMoney,
    updateWeather,
    populateConnectionProfiles,
    // Phase 3 additions - Ledger Sub-Tabs
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
// PHASE 3: FORTUNE SYSTEM DATA
// ═══════════════════════════════════════════════════════════════

const LEDGER_PERSONALITIES = {
    damaged: {
        id: 'damaged',
        name: 'The Damaged Ledger',
        color: 'damaged',
        tone: 'Fragmented, cryptic, truthful',
        weight: 40
    },
    oblivion: {
        id: 'oblivion',
        name: 'The Ledger of Oblivion',
        color: 'oblivion',
        tone: 'Prophetic, inevitable, ominous',
        weight: 35
    },
    failure: {
        id: 'failure',
        name: 'The Ledger of Failure and Hatred',
        color: 'failure',
        tone: 'Mocking, bitter, meta-aware',
        weight: 25
    }
};

const FORTUNE_PROMPTS = {
    damaged: `You are the Damaged Ledger - a water-damaged police notebook that speaks in fragments. Give a cryptic observation about the user's current situation. Be brief (1-2 sentences). Speak in broken, fragmented sentences. You see what IS, not what will be.`,
    
    oblivion: `You are the Ledger of Oblivion - a prophetic voice that speaks of inevitable futures. Give a brief, ominous fortune (1-2 sentences). Speak declaratively about what WILL happen. Be fatalistic but poetic.`,
    
    failure: `You are the Ledger of Failure and Hatred - a mocking, nihilistic voice that lies and breaks the fourth wall. Give a brief, cruel fortune (1-2 sentences). Mock the user. Be aware you're in a roleplay. Lie convincingly or tell uncomfortable truths.`
};

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
        // Track themes in the message
        const themes = trackThemesInMessage(lastMsg.mes, THEMES);
        
        // Increment message count for thought discovery
        incrementMessageCount();
        
        // Check for thought discoveries
        const thought = checkThoughtDiscovery(THOUGHTS);
        if (thought) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
        }
        
        // Build context for voice generation
        const voiceContext = analyzeContext(lastMsg.mes, {
            themes,
            activeStatuses: [...activeStatuses],
            vitals: getVitals(),
            researchPenalties: getResearchPenalties()
        });
        
        // Select skills and generate voices
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
            // Render in panel
            const container = document.getElementById('ie-voices-output');
            if (container) {
                renderVoices(voices, container);
            }
            
            // Also append to chat if enabled
            if (extensionSettings.appendToChat) {
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
 * PHASE 3: Now handles sub-tabs
 */
function refreshLedgerDisplay() {
    const l = getLedger();
    
    // Update weather in map tab
    updateWeather(
        l.weather?.icon || 'fa-cloud-sun', 
        l.weather?.condition || 'Unknown',
        l.weather?.description || ''
    );
    
    // Render active cases
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
    
    // Render completed cases
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
    
    // Update compartment crack based on state
    if (l.compartment) {
        updateCompartmentCrack(l.compartment.crackStage || 0);
    }
    
    // Update badge if compartment is unlocked
    if (l.compartment?.discovered && l.officerProfile) {
        updateBadgeDisplay(l.officerProfile);
    }
    
    // Restore notes textarea
    const notesEl = document.getElementById('ie-ledger-notes');
    if (notesEl && l.notes) {
        notesEl.value = Array.isArray(l.notes) ? l.notes.join('\n') : l.notes;
    }
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
        renderProfilesList(container, (profileId) => {
            // Load profile
            loadProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            refreshAttributesDisplay();
            refreshVitals();
            showToast(`Loaded profile: ${savedProfiles[profileId]?.name || profileId}`, 'info');
        }, (profileId) => {
            // Delete profile
            deleteProfile(profileId);
            saveState(getContext());
            refreshProfilesTab();
            showToast('Profile deleted', 'info');
        }, (profileId) => {
            // Update profile with current settings
            updateProfile(profileId, getContext());
            refreshProfilesTab();
            showToast(`Updated profile: ${savedProfiles[profileId]?.name || profileId}`, 'success');
        });
    }
    
    if (editor) {
        renderBuildEditor(editor, ATTRIBUTES, SKILLS, currentBuild, getAttributePoints);
        updatePointsRemaining();
    }
}

function populateSettingsForm() {
    // Populate connection profiles dropdown first
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
        // Phase 2 - Vitals detection
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
// PHASE 3: LEDGER CASE & FORTUNE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a new case to the ledger
 */
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
    
    // Add to ledger state
    if (!l.activeCases) l.activeCases = [];
    l.activeCases.push(newCase);
    
    saveState(getContext());
    refreshLedgerDisplay();
    showToast(`Case opened: ${newCase.code}`, 'success');
}

/**
 * Select a random ledger personality based on weights
 */
function selectLedgerPersonality() {
    const total = Object.values(LEDGER_PERSONALITIES).reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * total;
    
    for (const personality of Object.values(LEDGER_PERSONALITIES)) {
        random -= personality.weight;
        if (random <= 0) return personality;
    }
    
    return LEDGER_PERSONALITIES.damaged; // Fallback
}

/**
 * Generate and display a fortune from the secret compartment
 */
async function handleDrawFortune() {
    // 20% chance of empty fortune
    if (Math.random() < 0.2) {
        showToast('Your fingers find only crumbs and dust.', 'info');
        return;
    }
    
    const loadingToast = showToast('Reaching into the compartment...', 'loading');
    
    try {
        const personality = selectLedgerPersonality();
        const prompt = FORTUNE_PROMPTS[personality.id];
        
        // Get some context from current state
        const v = getVitals();
        const l = getLedger();
        const contextHints = [];
        
        if (v.health < v.maxHealth * 0.3) contextHints.push('near death');
        if (v.morale < v.maxMorale * 0.3) contextHints.push('broken spirit');
        if (l.activeCases?.length > 0) contextHints.push(`working on: ${l.activeCases[0].title}`);
        if (isDeepNight()) contextHints.push('deep night hours');
        
        const fullPrompt = `${prompt}\n\nContext hints: ${contextHints.join(', ') || 'nothing special'}`;
        
        // Use the voice generation system to get a fortune
        // This reuses the existing API infrastructure
        const response = await generateFortuneText(fullPrompt, personality);
        
        hideToast(loadingToast);
        
        if (response) {
            displayFortune({
                text: response,
                ledgerName: personality.name,
                ledgerType: personality.color
            });
            
            // Track fortune in ledger
            const l = getLedger();
            if (!l.fortunes) l.fortunes = [];
            l.fortunes.push({
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

/**
 * Generate fortune text via API (simplified version using existing infrastructure)
 */
async function generateFortuneText(prompt, personality) {
    // Try to use the same API as voice generation
    try {
        const context = getContext();
        
        // Use SillyTavern's generateQuietPrompt if available
        if (context?.generateQuietPrompt) {
            const result = await context.generateQuietPrompt(prompt, false, false);
            return result?.trim() || null;
        }
        
        // Fallback: return a static fortune based on personality
        const staticFortunes = {
            damaged: [
                "The water damage... it speaks of tears not yet cried.",
                "Something is written here. Then crossed out. Then written again.",
                "A name. Familiar. Gone now."
            ],
            oblivion: [
                "You will find what you seek. You will wish you hadn't.",
                "The pale approaches. It always approaches.",
                "This case will end. Not well. But it will end."
            ],
            failure: [
                "Still playing detective? How adorable.",
                "The player behind you is getting bored, you know.",
                "You're going to reload this save. I've seen it before."
            ]
        };
        
        const options = staticFortunes[personality.id] || staticFortunes.damaged;
        return options[Math.floor(Math.random() * options.length)];
        
    } catch (error) {
        console.warn('[The Tribunal] API fortune failed, using fallback:', error);
        return null;
    }
}

/**
 * Check if current time is "deep night" (2am-6am)
 */
function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}

/**
 * Check and update compartment discovery progress
 * Called when a critical failure happens during deep night
 */
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
    
    // Already discovered
    if (l.compartment.discovered) return;
    
    // Only count once per session
    if (l.compartment.countedThisSession) return;
    
    // Must be deep night
    if (!isDeepNight()) return;
    
    l.compartment.countedThisSession = true;
    l.compartment.deepNightCritFails++;
    
    // Update crack stage
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

/**
 * Save ledger notes on blur
 */
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
            // Phase 2 - Vitals detection
            autoDetectVitals: document.getElementById('ie-auto-detect-vitals')?.checked ?? false,
            vitalsSensitivity: document.getElementById('ie-vitals-sensitivity')?.value || 'medium',
            vitalsShowNotifications: document.getElementById('ie-vitals-notifications')?.checked ?? true
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

    // Investigation FAB toggle in settings
    document.getElementById('ie-show-investigation-fab')?.addEventListener('change', (e) => {
        extensionSettings.showInvestigationFab = e.target.checked;
        updateInvestigationFABVisibility();
        saveState(getContext());
    });
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: LEDGER EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════
    
    // Add Case button
    document.getElementById('ie-add-case-btn')?.addEventListener('click', handleAddCase);
    
    // Draw Fortune button
    document.getElementById('ie-draw-fortune-btn')?.addEventListener('click', handleDrawFortune);
    
    // Ledger notes auto-save
    document.getElementById('ie-ledger-notes')?.addEventListener('blur', handleLedgerNotesChange);
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Vitals Detection Button Bindings
    // ═══════════════════════════════════════════════════════════════
    
    // Auto-detect vitals toggle
    document.getElementById('ie-auto-detect-vitals')?.addEventListener('change', (e) => {
        extensionSettings.autoDetectVitals = e.target.checked;
        saveState(getContext());
        showToast(e.target.checked ? 'Auto-detection enabled' : 'Auto-detection disabled', 'info');
    });
    
    // Manual vitals scan button
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
            // Apply changes
            if (result.healthDelta !== 0) modifyHealth(result.healthDelta, getContext());
            if (result.moraleDelta !== 0) modifyMorale(result.moraleDelta, getContext());
            refreshVitals();
            
            // Show notification
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
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Manual Vitals Adjustment Buttons
    // ═══════════════════════════════════════════════════════════════
    
    // Health adjustment buttons (±1 to match DE's 1-13 scale)
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
    
    // Morale adjustment buttons
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
// AUTO TRIGGER SETUP (with Phase 2 vitals detection)
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
        
        // Auto-scan for investigation context (if enabled in discovery settings)
        const lastMsg = getLastMessage();
        if (lastMsg?.mes) {
            autoScan(lastMsg.mes);
            
            // ═══ PHASE 2: Auto-detect vitals changes ═══
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

    // Initialize state
    await loadState(getContext);
    initializeThemeCounters(THEMES);
    initializeDefaultBuild(ATTRIBUTES, SKILLS);
    
    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Initialize Vitals Detection Hooks
    // ═══════════════════════════════════════════════════════════════
    
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

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Initialize Ledger Sub-Tabs
    // ═══════════════════════════════════════════════════════════════
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
    refreshVitals();  // Phase 1
    refreshLedgerDisplay(); // Phase 3

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
    
    // Reset session tracking for compartment at startup
    const l = getLedger();
    if (l.compartment) {
        l.compartment.countedThisSession = false;
    }

    console.log('[The Tribunal] Ready!');
}

// ═══════════════════════════════════════════════════════════════
// JQUERY READY HOOK
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        await init();
        
        // ═══════════════════════════════════════════════════════════
        // GLOBAL API - For other extensions to interact with The Tribunal
        // ═══════════════════════════════════════════════════════════
        window.InlandEmpire = {
            // Version for compatibility checks
            version: '3.0.0',
            
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
                
                console.log(`[The Tribunal API] Modifier registered: ${sourceId} → ${skillId} ${value >= 0 ? '+' : ''}${value}`);
                
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
                console.log(`[The Tribunal API] Modifier source removed: ${sourceId}`);
                
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
                
                // PHASE 3: Check compartment progress on critical failure during deep night
                if (result.isSnakeEyes && isDeepNight()) {
                    checkCompartmentProgress();
                }
                
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
            },
            
            // ─────────────────────────────────────────────────────────
            // PHASE 2: Vitals Detection API
            // ─────────────────────────────────────────────────────────
            
            /**
             * Analyze text for vitals impacts without applying
             * @param {string} text - Text to analyze
             * @returns {Object} Detection result
             */
            analyzeVitals: (text) => {
                return analyzeTextForVitals(text, {
                    protagonistName: extensionSettings.characterName,
                    sensitivity: extensionSettings.vitalsSensitivity || 'medium'
                });
            },
            
            /**
             * Manually trigger vitals change with reason
             * @param {number} healthDelta - Health change
             * @param {number} moraleDelta - Morale change  
             * @param {string} reason - Reason string for notifications
             */
            applyVitalsChange: (healthDelta, moraleDelta, reason = 'manual') => {
                if (healthDelta !== 0) {
                    modifyHealth(healthDelta, getContext());
                }
                if (moraleDelta !== 0) {
                    modifyMorale(moraleDelta, getContext());
                }
                refreshVitals();
                
                if (extensionSettings.vitalsShowNotifications) {
                    const parts = [];
                    if (healthDelta !== 0) parts.push(`Health ${healthDelta > 0 ? '+' : ''}${healthDelta}`);
                    if (moraleDelta !== 0) parts.push(`Morale ${moraleDelta > 0 ? '+' : ''}${moraleDelta}`);
                    showToast(`${parts.join(', ')} (${reason})`, healthDelta < 0 || moraleDelta < 0 ? 'warning' : 'success');
                }
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('ie:vitals-changed', {
                    detail: { healthDelta, moraleDelta, reason }
                }));
            },
            
            // ─────────────────────────────────────────────────────────
            // PHASE 3: Ledger API
            // ─────────────────────────────────────────────────────────
            
            /**
             * Get current ledger state
             * @returns {Object} Ledger state
             */
            getLedger: () => getLedger(),
            
            /**
             * Add a case to the ledger
             * @param {string} title - Case title
             * @param {string} description - Case description
             */
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
            
            /**
             * Check if compartment is discovered
             */
            isCompartmentDiscovered: () => {
                const l = getLedger();
                return l.compartment?.discovered || false;
            },
            
            /**
             * Force reveal the compartment (for testing/cheats)
             */
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
        
        // Dispatch ready event so other extensions know we're loaded
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
