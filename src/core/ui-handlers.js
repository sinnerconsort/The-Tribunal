/**
 * The Tribunal - UI Handlers & Refresh
 * All handler functions and tab refresh logic
 */

import { ATTRIBUTES, SKILLS } from '../data/skills.js';
import { THOUGHTS } from '../data/thoughts.js';
import {
    extensionSettings,
    activeStatuses,
    currentBuild,
    savedProfiles,
    saveState,
    toggleStatus,
    getAttributePoints,
    applyAttributeAllocation,
    getVitals,
    getLedger,
    getInventory,
    modifyHealth,
    modifyMorale
} from './state.js';
import { getContext } from './st-helpers.js';
import {
    startResearch,
    abandonResearch,
    dismissThought,
    forgetThought
} from '../systems/cabinet.js';
import { showToast } from '../ui/toasts.js';
import {
    renderAttributesDisplay,
    renderBuildEditor,
    updatePointsRemaining,
    renderStatusGrid,
    renderActiveEffectsSummary,
    renderProfilesList,
    renderThoughtCabinet
} from '../ui/render.js';
import {
    togglePanel,
    updateHealth,
    updateMorale,
    updateCaseTitle,
    updateMoney,
    updateWeather,
    populateConnectionProfiles,
    updateCompartmentCrack,
    renderCaseCard,
    updateBadgeDisplay,
    generateCaseCode,
    toggleDiscoveryModal
} from '../ui/panel.js';
import { getAvailableProfiles } from '../voice/generation.js';
import { saveProfile, loadProfile, deleteProfile, updateProfile } from './state.js';
import { isDeepNight } from '../systems/fortune.js';

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET HANDLERS
// ═══════════════════════════════════════════════════════════════

export function handleStartResearch(thoughtId) {
    const result = startResearch(thoughtId, THOUGHTS);
    if (result.success) {
        saveState(getContext());
        refreshCabinetTab();
        showToast(`Researching: ${THOUGHTS[thoughtId]?.name || thoughtId}`, 'info');
    } else {
        showToast(result.reason || 'Cannot research this thought', 'error');
    }
}

export function handleAbandonResearch(thoughtId) {
    abandonResearch(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Research abandoned', 'info');
}

export function handleDismissThought(thoughtId) {
    dismissThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
}

export function handleForgetThought(thoughtId) {
    forgetThought(thoughtId);
    saveState(getContext());
    refreshCabinetTab();
    showToast('Thought forgotten', 'info');
}

// ═══════════════════════════════════════════════════════════════
// UI REFRESH HELPERS
// ═══════════════════════════════════════════════════════════════

export function refreshAttributesDisplay() {
    const container = document.getElementById('ie-attributes-display');
    if (container) {
        renderAttributesDisplay(container, ATTRIBUTES, SKILLS, currentBuild);
    }
}

export function refreshStatusTab() {
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

export function refreshCabinetTab() {
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
// VITALS, LEDGER, INVENTORY REFRESH
// ═══════════════════════════════════════════════════════════════

/**
 * Sync vitals display with current state
 */
export function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
    
    // Update case title from character name
    updateCaseTitle(extensionSettings.characterName);
}

/**
 * Refresh ledger display (weather, cases, notes)
 */
export function refreshLedgerDisplay() {
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
export function refreshInventoryDisplay() {
    const inv = getInventory();
    updateMoney(inv.money);
    // TODO: Render carried/worn items when Phase 4 is fully implemented
}

export function refreshProfilesTab() {
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

export function populateSettingsForm() {
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

export function closeAllModals() {
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
// LEDGER CASE HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a new case to the ledger
 */
export function handleAddCase() {
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
 * Save ledger notes on blur
 */
export function handleLedgerNotesChange(e) {
    const l = getLedger();
    l.notes = e.target.value;
    saveState(getContext());
}

/**
 * Check and update compartment discovery progress
 * Called when a critical failure happens during deep night
 */
export function checkCompartmentProgress() {
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
