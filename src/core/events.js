/**
 * The Tribunal - Event Bindings
 * All DOM event handlers
 */

import {
    extensionSettings,
    saveState,
    updateSettings,
    saveProfile,
    applyAttributeAllocation,
    modifyHealth,
    modifyMorale
} from './state.js';
import { getContext, getLastMessage, updateFABState, updateInvestigationFABVisibility } from './st-helpers.js';
import { triggerVoices } from './trigger.js';
import {
    refreshAttributesDisplay,
    refreshStatusTab,
    refreshCabinetTab,
    refreshVitals,
    refreshLedgerDisplay,
    refreshInventoryDisplay,
    refreshProfilesTab,
    populateSettingsForm,
    closeAllModals,
    handleAddCase,
    handleLedgerNotesChange
} from './ui-handlers.js';
import { handleDrawFortune } from '../systems/fortune.js';
import { togglePanel, switchTab } from '../ui/panel.js';
import { showToast, hideToast } from '../ui/toasts.js';
import { analyzeTextForVitals } from '../systems/vitals/hooks.js';

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

export function bindEvents() {
    // FAB click
    document.getElementById('inland-empire-fab')?.addEventListener('click', function(e) {
        if (this.dataset.justDragged === 'true') {
            this.dataset.justDragged = 'false';
            return;
        }
        togglePanel();
        
        // Refresh vitals display when opening
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
            // Phase 2 - Vitals detection
            autoDetectVitals: document.getElementById('ie-auto-detect-vitals')?.checked ?? false,
            vitalsSensitivity: document.getElementById('ie-vitals-sensitivity')?.value || 'medium',
            vitalsShowNotifications: document.getElementById('ie-vitals-notifications')?.checked ?? true
        };

        updateSettings(newSettings);
        saveState(getContext());
        updateFABState();
        
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
    // LEDGER EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════
    
    // Add Case button
    document.getElementById('ie-add-case-btn')?.addEventListener('click', handleAddCase);
    
    // Draw Fortune button
    document.getElementById('ie-draw-fortune-btn')?.addEventListener('click', handleDrawFortune);
    
    // Ledger notes auto-save
    document.getElementById('ie-ledger-notes')?.addEventListener('blur', handleLedgerNotesChange);
    
    // ═══════════════════════════════════════════════════════════════
    // VITALS DETECTION BINDINGS
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
    // MANUAL VITALS ADJUSTMENT BUTTONS
    // ═══════════════════════════════════════════════════════════════
    
    // Health adjustment buttons
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
