/**
 * UI Refresh Functions
 * Extracted from index.js for maintainability
 * These functions read state and update DOM - no side effects beyond rendering
 */

import { ATTRIBUTES } from '../data/skills.js';
import { THEMES, THOUGHTS } from '../data/thoughts.js';
import {
    extensionSettings,
    savedProfiles,
    getVitals,
    getLedger,
    getInventory
} from '../core/state.js';

import { getAvailableProfiles } from '../voice/generation.js';
import { showToast } from './toasts.js';

import {
    updateHealth,
    updateMorale,
    updateCaseTitle,
    updateMoney,
    updateWeather,
    populateConnectionProfiles,
    updateCompartmentCrack,
    renderCaseCard,
    updateBadgeDisplay
} from './panel.js';

import {
    renderAttributesDisplay,
    renderBuildEditor,
    updatePointsRemaining,
    renderStatusGrid,
    renderActiveEffectsSummary,
    renderProfilesList,
    renderThoughtCabinet
} from './render.js';

// ═══════════════════════════════════════════════════════════════
// BUILD POINTS DISPLAY
// ═══════════════════════════════════════════════════════════════

export function updateBuildPointsDisplay(pointsDisplay) {
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

// ═══════════════════════════════════════════════════════════════
// TAB REFRESH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function refreshAttributesDisplay() {
    const container = document.getElementById('ie-attributes-display');
    if (container) {
        renderAttributesDisplay(container);
    }
}

export function refreshStatusTab(toggleStatusCallback, saveStateCallback) {
    const statusGrid = document.getElementById('ie-status-grid');
    const effectsSummary = document.getElementById('ie-active-effects-summary');
    
    if (statusGrid) {
        renderStatusGrid(statusGrid, (statusId) => {
            toggleStatusCallback(statusId);
            saveStateCallback();
            refreshStatusTab(toggleStatusCallback, saveStateCallback);
            refreshAttributesDisplay();
        });
    }
    
    if (effectsSummary) {
        renderActiveEffectsSummary(effectsSummary);
    }
}

export function refreshCabinetTab(handlers) {
    const container = document.getElementById('ie-cabinet-content');
    if (container) {
        renderThoughtCabinet(container, {
            onResearch: handlers.onResearch,
            onAbandon: handlers.onAbandon,
            onDismiss: handlers.onDismiss,
            onForget: handlers.onForget,
            showThemeTracker: extensionSettings.showThemeTracker
        });
    }
}

export function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
    updateCaseTitle(extensionSettings.characterName);
}

export function refreshLedgerDisplay() {
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

export function refreshInventoryDisplay() {
    const inv = getInventory();
    updateMoney(inv.money);
}

export function refreshProfilesTab(callbacks) {
    const { loadProfile, deleteProfile, updateProfile, saveState, getContext, 
            onStatusRefresh, onCabinetRefresh } = callbacks;
    
    const container = document.getElementById('ie-profiles-list');
    const editor = document.getElementById('ie-attributes-editor');
    const pointsDisplay = document.getElementById('ie-points-remaining');
    
    if (container) {
        // LOAD callback
        renderProfilesList(container, (profileId) => {
            const profile = savedProfiles[profileId];
            const profileName = profile?.name || 'Profile';
            
            const success = loadProfile(profileId);
            if (success) {
                saveState(getContext());
                
                // Refresh ALL UI sections
                refreshProfilesTab(callbacks);
                refreshAttributesDisplay();
                refreshVitals();
                refreshLedgerDisplay();
                refreshInventoryDisplay();
                populateSettingsForm();
                
                // These need handlers from index.js, call if provided
                if (onStatusRefresh) onStatusRefresh();
                if (onCabinetRefresh) onCabinetRefresh();
                
                showToast(`Loaded: ${profileName}`, 'success');
            } else {
                showToast(`Failed to load profile`, 'error');
            }
        }, 
        // DELETE callback
        (profileId) => {
            const profile = savedProfiles[profileId];
            const profileName = profile?.name || 'Profile';
            
            deleteProfile(profileId);
            saveState(getContext());
            refreshProfilesTab(callbacks);
            showToast(`Deleted: ${profileName}`, 'info');
        }, 
        // UPDATE callback
        (profileId) => {
            const profile = savedProfiles[profileId];
            const profileName = profile?.name || 'Profile';
            
            // Sync current form values to extensionSettings BEFORE updating profile
            const formSettings = {
                povStyle: document.getElementById('ie-pov-style')?.value || 'second',
                characterName: document.getElementById('ie-character-name')?.value || '',
                characterPronouns: document.getElementById('ie-character-pronouns')?.value || 'they',
                characterContext: document.getElementById('ie-character-context')?.value || '',
                scenePerspective: document.getElementById('ie-scene-perspective')?.value || ''
            };
            // We need updateSettings - import it or call via a callback
            // For now, directly update extensionSettings since we imported it
            Object.assign(extensionSettings, formSettings);
            
            updateProfile(profileId, getContext());
            refreshProfilesTab(callbacks);
            showToast(`Updated: ${profileName}`, 'success');
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

// ═══════════════════════════════════════════════════════════════
// SETTINGS FORM
// ═══════════════════════════════════════════════════════════════

export function populateSettingsForm() {
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

// ═══════════════════════════════════════════════════════════════
// MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function closeAllModals(toggleDiscoveryModal) {
    const thoughtModal = document.getElementById('ie-thought-modal');
    if (thoughtModal) thoughtModal.remove();
    
    const discoveryOverlay = document.getElementById('ie-discovery-overlay');
    if (discoveryOverlay?.classList.contains('ie-discovery-open')) {
        toggleDiscoveryModal();
    }
}
