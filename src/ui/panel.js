/**
 * The Tribunal - Panel & FAB Creation
 * Creates the main psyche panel and floating action button
 * Extracted from rebuild v0.3.0
 * UPDATED: Radio tab → Inventory tab with subtabs
 * v0.3.1 - Added position lock support
 */

import {
    PANEL_HEADER_HTML,
    TAB_BAR_HTML,
    VOICES_TAB_HTML,
    CABINET_TAB_HTML,
    STATUS_TAB_HTML,
    LEDGER_TAB_HTML,
    INVENTORY_TAB_HTML,  // Changed from RADIO_TAB_HTML
    SETTINGS_TAB_HTML,
    PROFILES_TAB_HTML,
    BOTTOM_BUTTONS_HTML
} from './panel-templates.js';

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
// ═══════════════════════════════════════════════════════════════

/**
 * Create the main psyche panel element
 * @returns {HTMLElement} The panel element
 */
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
        ${BOTTOM_BUTTONS_HTML}
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION
// ═══════════════════════════════════════════════════════════════

/**
 * Create the floating action button for toggling the panel
 * @returns {HTMLElement} The FAB element
 */
export function createToggleFAB() {
    const fab = document.createElement('div');
    fab.id = 'inland-empire-fab';
    fab.className = 'ie-fab';
    fab.title = 'Toggle Psyche Panel';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-address-card"></i></span>';
    fab.style.display = 'flex';
    fab.style.top = '140px';
    fab.style.left = '10px';

    // Draggable FAB implementation
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        // Check if positions are locked via data attribute
        if (fab.dataset.positionLocked === 'true') {
            return;
        }
        
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
        if (hasMoved) fab.dataset.justDragged = 'true';
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

/**
 * Get the panel element
 * @returns {HTMLElement|null}
 */
export function getPanel() {
    return document.getElementById('inland-empire-panel');
}

/**
 * Get the FAB element
 * @returns {HTMLElement|null}
 */
export function getFAB() {
    return document.getElementById('inland-empire-fab');
}

/**
 * Check if panel is open
 * @returns {boolean}
 */
export function isPanelOpen() {
    const panel = getPanel();
    return panel?.classList.contains('ie-panel-open') ?? false;
}
