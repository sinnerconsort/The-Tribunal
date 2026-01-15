/**
 * The Tribunal - Settings Rendering
 * UI/Settings synchronization
 */

import { extensionSettings } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// SETTINGS SYNC
// ═══════════════════════════════════════════════════════════════

export function syncSettingsToUI() {
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = value;
        else el.value = value;
    };

    setValue('ie-api-endpoint', extensionSettings.apiEndpoint);
    setValue('ie-api-key', extensionSettings.apiKey);
    setValue('ie-model', extensionSettings.model);
    setValue('ie-temperature', extensionSettings.temperature);
    setValue('ie-max-tokens', extensionSettings.maxTokens);
    setValue('ie-min-voices', extensionSettings.voicesPerMessage?.min || 1);
    setValue('ie-max-voices', extensionSettings.voicesPerMessage?.max || 4);
    setValue('ie-trigger-delay', extensionSettings.triggerDelay);
    setValue('ie-show-dice-rolls', extensionSettings.showDiceRolls);
    setValue('ie-show-failed-checks', extensionSettings.showFailedChecks);
    setValue('ie-auto-trigger', extensionSettings.autoTrigger);
    setValue('ie-auto-detect-status', extensionSettings.autoDetectStatus);
    setValue('ie-intrusive-enabled', extensionSettings.intrusiveEnabled);
    setValue('ie-intrusive-in-chat', extensionSettings.intrusiveInChat);
    setValue('ie-intrusive-chance', (extensionSettings.intrusiveChance || 0.15) * 100);
    setValue('ie-object-voices-enabled', extensionSettings.objectVoicesEnabled);
    setValue('ie-object-chance', (extensionSettings.objectVoiceChance || 0.4) * 100);
    setValue('ie-thought-discovery-enabled', extensionSettings.thoughtDiscoveryEnabled);
    setValue('ie-auto-discover-thoughts', extensionSettings.autoDiscoverThoughts);
    setValue('ie-auto-generate-thoughts', extensionSettings.autoGenerateThoughts);
    setValue('ie-auto-gen-threshold', extensionSettings.autoGenThreshold || 10);
    setValue('ie-auto-gen-cooldown', extensionSettings.autoGenCooldown || 5);
    setValue('ie-auto-gen-perspective', extensionSettings.autoGenPerspective || 'observer');
    setValue('ie-auto-gen-player-context', extensionSettings.autoGenPlayerContext || '');
    setValue('ie-pov-style', extensionSettings.povStyle);
    setValue('ie-character-name', extensionSettings.characterName);
    setValue('ie-character-pronouns', extensionSettings.characterPronouns);
    setValue('ie-character-context', extensionSettings.characterContext);
    setValue('ie-show-in-chat', extensionSettings.showInChat);
    setValue('ie-auto-scan-enabled', extensionSettings.autoScanEnabled);

    // Show/hide auto-gen options
    const autoGenOptions = document.querySelectorAll('.ie-auto-gen-options');
    const showAutoGen = extensionSettings.autoGenerateThoughts;
    autoGenOptions.forEach(el => el.classList.toggle('ie-visible', showAutoGen));

    // Show/hide third person options
    const thirdPersonOptions = document.querySelectorAll('.ie-third-person-options');
    const showThird = extensionSettings.povStyle === 'third';
    thirdPersonOptions.forEach(el => el.style.display = showThird ? 'block' : 'none');
}

export function syncUIToSettings() {
    const getValue = (id, defaultVal) => {
        const el = document.getElementById(id);
        if (!el) return defaultVal;
        if (el.type === 'checkbox') return el.checked;
        if (el.type === 'number') return parseFloat(el.value) || defaultVal;
        return el.value || defaultVal;
    };

    extensionSettings.apiEndpoint = getValue('ie-api-endpoint', '');
    extensionSettings.apiKey = getValue('ie-api-key', '');
    extensionSettings.model = getValue('ie-model', 'glm-4-plus');
    extensionSettings.temperature = getValue('ie-temperature', 0.9);
    extensionSettings.maxTokens = getValue('ie-max-tokens', 300);
    extensionSettings.voicesPerMessage = {
        min: getValue('ie-min-voices', 1),
        max: getValue('ie-max-voices', 4)
    };
    extensionSettings.triggerDelay = getValue('ie-trigger-delay', 1000);
    extensionSettings.showDiceRolls = getValue('ie-show-dice-rolls', true);
    extensionSettings.showFailedChecks = getValue('ie-show-failed-checks', true);
    extensionSettings.autoTrigger = getValue('ie-auto-trigger', false);
    extensionSettings.autoDetectStatus = getValue('ie-auto-detect-status', false);
    extensionSettings.intrusiveEnabled = getValue('ie-intrusive-enabled', true);
    extensionSettings.intrusiveInChat = getValue('ie-intrusive-in-chat', true);
    extensionSettings.intrusiveChance = getValue('ie-intrusive-chance', 15) / 100;
    extensionSettings.objectVoicesEnabled = getValue('ie-object-voices-enabled', true);
    extensionSettings.objectVoiceChance = getValue('ie-object-chance', 40) / 100;
    extensionSettings.thoughtDiscoveryEnabled = getValue('ie-thought-discovery-enabled', true);
    extensionSettings.autoDiscoverThoughts = getValue('ie-auto-discover-thoughts', true);
    extensionSettings.autoGenerateThoughts = getValue('ie-auto-generate-thoughts', false);
    extensionSettings.autoGenThreshold = getValue('ie-auto-gen-threshold', 10);
    extensionSettings.autoGenCooldown = getValue('ie-auto-gen-cooldown', 5);
    extensionSettings.autoGenPerspective = getValue('ie-auto-gen-perspective', 'observer');
    extensionSettings.autoGenPlayerContext = getValue('ie-auto-gen-player-context', '');
    extensionSettings.povStyle = getValue('ie-pov-style', 'second');
    extensionSettings.characterName = getValue('ie-character-name', '');
    extensionSettings.characterPronouns = getValue('ie-character-pronouns', 'they');
    extensionSettings.characterContext = getValue('ie-character-context', '');
    extensionSettings.showInChat = getValue('ie-show-in-chat', true);
    extensionSettings.autoScanEnabled = getValue('ie-auto-scan-enabled', false);
}

/**
 * Additional settings sync for new fields
 * Add these to your existing syncSettingsToUI function
 */
export function syncNewSettingsToUI(extSettings) {
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = value;
        else el.value = value;
    };

    setValue('ie-show-suggestions-fab', extSettings.showSuggestionsFab);
    setValue('ie-auto-suggestions', extSettings.autoSuggestions);
}

/**
 * Additional settings sync from UI
 * Add these to your existing syncUIToSettings function
 */
export function syncNewSettingsFromUI(extSettings) {
    const getValue = (id, defaultVal) => {
        const el = document.getElementById(id);
        if (!el) return defaultVal;
        if (el.type === 'checkbox') return el.checked;
        if (el.type === 'number') return parseFloat(el.value) || defaultVal;
        return el.value || defaultVal;
    };

    extSettings.showSuggestionsFab = getValue('ie-show-suggestions-fab', false);
    extSettings.autoSuggestions = getValue('ie-auto-suggestions', false);
}
