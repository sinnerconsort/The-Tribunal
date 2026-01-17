/**
 * src/ui/render-settings.js - Settings form
 */

import { extensionSettings } from '../core/state.js';
import { getAvailableProfiles } from '../voice/api-helpers.js';

export function populateSettingsForm(context) {
    const autoTrigger = document.getElementById('ie-auto-trigger');
    const tokens = document.getElementById('ie-tokens');
    const profile = document.getElementById('ie-profile');
    
    if (autoTrigger) autoTrigger.checked = extensionSettings.autoTrigger;
    if (tokens) tokens.value = extensionSettings.maxTokens;
    if (profile) {
        const profiles = getAvailableProfiles(context);
        profile.innerHTML = profiles.map(p => '<option value="' + p.id + '">' + p.name + '</option>').join('');
        profile.value = extensionSettings.connectionProfile;
    }
}
