/**
 * The Tribunal - Psyche Panel
 * Main panel structure, FABs, and tab switching
 * 
 * Templates: ./panel-templates.js
 * Helpers: ./panel-helpers.js
 */

import { extensionSettings, saveState } from '../core/state.js';

// Import templates
import {
    PANEL_HEADER_HTML,
    TAB_BAR_HTML,
    VOICES_TAB_HTML,
    CABINET_TAB_HTML,
    STATUS_TAB_HTML,
    LEDGER_TAB_HTML,
    INVENTORY_TAB_HTML,
    SETTINGS_TAB_HTML,
    PROFILES_TAB_HTML,
    getBottomButtonsHTML
} from './panel-templates.js';

// Import and re-export helpers for backward compatibility
export {
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
} from './panel-helpers.js';

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
// ═══════════════════════════════════════════════════════════════

export function createPsychePanel() {
    const panel = document.createElement('div');
    panel.id = 'inland-empire-panel';
    panel.className = 'inland-empire-panel';

    panel.innerHTML = `
        ${PANEL_HEADER_HTML}
        ${TAB_BAR_HTML}
        <div class="ie-panel-content">
            ${VOICES_TAB_HTML}
            ${CABINET_TAB_HTML}
            ${STATUS_TAB_HTML}
            ${LEDGER_TAB_HTML}
            ${INVENTORY_TAB_HTML}
            ${SETTINGS_TAB_HTML}
            ${PROFILES_TAB_HTML}
        </div>
        ${getBottomButtonsHTML()}
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION
// ═══════════════════════════════════════════════════════════════

export function createToggleFAB(getContext) {
    const fab = document.createElement('div');
    fab.id = 'inland-empire-fab';
    fab.className = 'ie-fab';
    fab.title = 'Toggle Psyche Panel';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-address-card"></i></span>';
    fab.style.display = 'flex';
    fab.style.top = `${extensionSettings.fabPositionTop ?? 140}px`;
    fab.style.left = `${extensionSettings.fabPositionLeft ?? 10}px`;

    // Dragging state
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.3s ease';
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            extensionSettings.fabPositionTop = fab.offsetTop;
            extensionSettings.fabPositionLeft = fab.offsetLeft;
            if (getContext) saveState(getContext());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

/**
 * Create the Suggestions FAB (lightbulb icon)
 * Hidden by default, toggleable in settings
 */
export function createSuggestionsFAB(getContext) {
    const fab = document.createElement('div');
    fab.id = 'ie-suggestions-fab';
    fab.className = 'ie-fab ie-fab-suggestions';
    fab.title = 'Get Suggestions';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-lightbulb"></i></span>';
    fab.style.display = extensionSettings.showSuggestionsFab ? 'flex' : 'none';
    fab.style.top = `${extensionSettings.suggestionsFabTop ?? 200}px`;
    fab.style.left = `${extensionSettings.suggestionsFabLeft ?? 10}px`;

    // Reuse same drag logic pattern
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.3s ease';
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            extensionSettings.suggestionsFabTop = fab.offsetTop;
            extensionSettings.suggestionsFabLeft = fab.offsetLeft;
            if (getContext) saveState(getContext());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

export function togglePanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');

    if (!panel) return;

    const isOpen = panel.classList.contains('ie-panel-open');

    if (isOpen) {
        panel.classList.remove('ie-panel-open');
        fab?.classList.remove('ie-fab-active');
    } else {
        panel.classList.add('ie-panel-open');
        fab?.classList.add('ie-fab-active');
        // Trigger peek animation when opening
        triggerFabLoading();
    }
}

/**
 * Trigger the "peek-up" loading animation on the main FAB
 * Call this when voices are being generated
 */
export function triggerFabLoading() {
    const fab = document.getElementById('inland-empire-fab');
    if (!fab) return;
    
    fab.classList.add('ie-fab-loading');
    // Remove after animation completes
    setTimeout(() => {
        fab.classList.remove('ie-fab-loading');
    }, 800);
}

/**
 * Toggle suggestions FAB active state (lightbulb on/off)
 */
export function setSuggestionsFabActive(active) {
    const fab = document.getElementById('ie-suggestions-fab');
    if (!fab) return;
    
    fab.classList.toggle('ie-fab-active', active);
    const icon = fab.querySelector('i');
    if (icon) {
        icon.className = active ? 'fa-solid fa-lightbulb' : 'fa-regular fa-lightbulb';
    }
}

/**
 * Show/hide the suggestions FAB
 */
export function setSuggestionsFabVisible(visible) {
    const fab = document.getElementById('ie-suggestions-fab');
    if (fab) {
        fab.style.display = visible ? 'flex' : 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

export function switchTab(tabName, callbacks = {}) {
    // Handle main tabs
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    // Handle bottom buttons (settings/profiles)
    document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
        btn.classList.toggle('ie-bottom-btn-active', btn.dataset.panel === tabName)
    );

    // Show/hide tab content
    document.querySelectorAll('.ie-tab-content').forEach(content =>
        content.classList.toggle('ie-tab-content-active', content.dataset.tabContent === tabName)
    );

    // Clear active state from main tabs if switching to bottom panel
    if (tabName === 'settings' || tabName === 'profiles') {
        document.querySelectorAll('.ie-tab').forEach(tab =>
            tab.classList.remove('ie-tab-active')
        );
    }

    // Clear active state from bottom buttons if switching to main tab
    const mainTabs = ['voices', 'cabinet', 'status', 'ledger', 'inventory'];
    if (mainTabs.includes(tabName)) {
        document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
            btn.classList.remove('ie-bottom-btn-active')
        );
    }

    // Tab-specific callbacks
    if (tabName === 'profiles' && callbacks.onProfiles) {
        callbacks.onProfiles();
    }
    if (tabName === 'settings' && callbacks.onSettings) {
        callbacks.onSettings();
    }
    if (tabName === 'status' && callbacks.onStatus) {
        callbacks.onStatus();
    }
    if (tabName === 'cabinet' && callbacks.onCabinet) {
        callbacks.onCabinet();
    }
    if (tabName === 'voices' && callbacks.onVoices) {
        callbacks.onVoices();
    }
    if (tabName === 'ledger' && callbacks.onLedger) {
        callbacks.onLedger();
    }
    if (tabName === 'inventory' && callbacks.onInventory) {
        callbacks.onInventory();
    }
}
