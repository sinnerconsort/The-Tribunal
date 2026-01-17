/**
 * src/ui/panel.js - Panel creation, tab switching
 */

import { getPanelTemplate } from './panel-templates.js';

let isPanelOpen = false;

export function createFAB() {
    const fab = document.createElement('div');
    fab.id = 'ie-fab';
    fab.className = 'ie-fab';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-id-card"></i></span>';
    fab.title = 'The Tribunal';
    return fab;
}

export function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'ie-panel';
    panel.className = 'ie-panel';
    panel.innerHTML = getPanelTemplate();
    return panel;
}

export function togglePanel() {
    const panel = document.getElementById('ie-panel');
    const fab = document.getElementById('ie-fab');
    if (!panel) return;
    
    isPanelOpen = !isPanelOpen;
    panel.classList.toggle('ie-panel-open', isPanelOpen);
    fab?.classList.toggle('ie-fab-active', isPanelOpen);
}

export function openPanel() { if (!isPanelOpen) togglePanel(); }
export function closePanel() { if (isPanelOpen) togglePanel(); }

export function switchTab(tabName) {
    document.querySelectorAll('.ie-tab').forEach(t => t.classList.toggle('ie-tab-active', t.dataset.tab === tabName));
    document.querySelectorAll('.ie-tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tabName));
}

export function updateFABState(enabled) {
    const fab = document.getElementById('ie-fab');
    if (fab) fab.style.display = enabled ? 'flex' : 'none';
}
