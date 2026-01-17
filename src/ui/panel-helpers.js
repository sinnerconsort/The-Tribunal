/**
 * src/ui/panel-helpers.js - Vitals updates, display utils
 */

import { closePanel, switchTab } from './panel.js';
import { updateSettings } from '../core/state.js';

export function updateHealth(current, max) {
    const fill = document.querySelector('.ie-health-fill');
    const text = document.querySelector('.ie-health-text');
    if (fill && text) {
        const pct = (current / max) * 100;
        fill.style.width = pct + '%';
        text.textContent = current + '/' + max;
    }
}

export function updateMorale(current, max) {
    const fill = document.querySelector('.ie-morale-fill');
    const text = document.querySelector('.ie-morale-text');
    if (fill && text) {
        const pct = (current / max) * 100;
        fill.style.width = pct + '%';
        text.textContent = current + '/' + max;
    }
}

export function bindPanelEvents(getContext, callbacks = {}) {
    document.querySelector('.ie-close')?.addEventListener('click', closePanel);
    document.querySelector('.ie-settings-btn')?.addEventListener('click', toggleSettingsPanel);
    document.querySelector('.ie-rescan')?.addEventListener('click', () => callbacks.onRescan?.());
    
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    document.getElementById('ie-auto-trigger')?.addEventListener('change', e => {
        updateSettings({ autoTrigger: e.target.checked }, getContext());
    });
    document.getElementById('ie-tokens')?.addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        if (v >= 100 && v <= 2000) updateSettings({ maxTokens: v }, getContext());
    });
}

let settingsOpen = false;
export function toggleSettingsPanel() {
    const settings = document.querySelector('.ie-settings');
    const content = document.querySelector('.ie-content');
    settingsOpen = !settingsOpen;
    if (settings) settings.style.display = settingsOpen ? 'block' : 'none';
    if (content) content.style.display = settingsOpen ? 'none' : 'block';
}
