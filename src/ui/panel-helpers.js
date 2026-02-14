/**
 * The Tribunal - Panel Helpers
 * Panel controls, tab switching, and event binding
 * Extracted from rebuild v0.3.0
 * v0.3.3 - Genre change triggers accordion + status refresh
 */

import { toggleWatchMode } from './watch.js';
import { initLedgerHandlers } from '../core/events.js';
import { buildSkillAccordion } from './voices-template.js';

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle the panel open/closed
 */
export function togglePanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');
    if (!panel) return;

    const isOpen = panel.classList.contains('ie-panel-open');
    panel.classList.toggle('ie-panel-open', !isOpen);
    fab?.classList.toggle('ie-fab-active', !isOpen);
}

/**
 * Open the panel
 */
export function openPanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');
    if (!panel) return;
    
    panel.classList.add('ie-panel-open');
    fab?.classList.add('ie-fab-active');
}

/**
 * Close the panel
 */
export function closePanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');
    if (!panel) return;
    
    panel.classList.remove('ie-panel-open');
    fab?.classList.remove('ie-fab-active');
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Switch to a specific tab
 * @param {string} tabName - Tab identifier (voices, cabinet, status, ledger, inventory, settings, profiles)
 */
export function switchTab(tabName) {
    // Update tab button states
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    // Update bottom button states
    document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
        btn.classList.toggle('ie-bottom-btn-active', btn.dataset.panel === tabName)
    );

    // Update tab content visibility
    document.querySelectorAll('.ie-tab-content').forEach(content =>
        content.classList.toggle('ie-tab-content-active', content.dataset.tabContent === tabName)
    );

    // Special handling: settings/profiles are bottom buttons, not main tabs
    if (tabName === 'settings' || tabName === 'profiles') {
        document.querySelectorAll('.ie-tab').forEach(tab => tab.classList.remove('ie-tab-active'));
    }

    // Special handling: main tabs should clear bottom button active states
    const mainTabs = ['voices', 'cabinet', 'status', 'ledger', 'inventory'];
    if (mainTabs.includes(tabName)) {
        document.querySelectorAll('.ie-bottom-btn').forEach(btn => btn.classList.remove('ie-bottom-btn-active'));
    }

    // Refresh accordion when switching to voices tab (picks up stat changes)
    if (tabName === 'voices') {
        buildSkillAccordion();
    }
}

/**
 * Get currently active tab
 * @returns {string|null} Current tab name
 */
export function getCurrentTab() {
    const activeContent = document.querySelector('.ie-tab-content-active');
    return activeContent?.dataset.tabContent ?? null;
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

/**
 * Bind all panel events
 * Call this after the panel is added to the DOM
 */
export function bindEvents() {
    // FAB click (toggle panel, but not if just dragged)
    document.getElementById('inland-empire-fab')?.addEventListener('click', function(e) {
        if (this.dataset.justDragged === 'true') {
            this.dataset.justDragged = 'false';
            return;
        }
        togglePanel();
    });

    // Close button (clicking the metal clipboard clip)
    document.getElementById('ie-close-panel')?.addEventListener('click', togglePanel);

    // Tab switching
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Bottom buttons
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });

    // Ledger sub-tabs
    document.querySelectorAll('.ledger-subtab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.ledgerTab;
            
            // Update tab states
            document.querySelectorAll('.ledger-subtab').forEach(t => t.classList.remove('ledger-subtab-active'));
            tab.classList.add('ledger-subtab-active');
            
            // Update content visibility
            document.querySelectorAll('.ledger-subcontent').forEach(c => c.classList.remove('ledger-subcontent-active'));
            document.querySelector(`[data-ledger-content="${targetTab}"]`)?.classList.add('ledger-subcontent-active');
        });
    });

    // Inventory sub-tabs (INV | EQUIP | RADIO)
    document.querySelectorAll('.inventory-sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.subtab;
            
            // Update tab states
            document.querySelectorAll('.inventory-sub-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content visibility
            document.querySelectorAll('.inventory-subcontent').forEach(c => {
                c.classList.toggle('inventory-subcontent-active', c.dataset.subcontent === targetTab);
            });
        });
    });

    // Watch toggle
    document.getElementById('ie-header-watch')?.addEventListener('click', toggleWatchMode);

    // Manual trigger button
    document.getElementById('ie-consult-voices')?.addEventListener('click', () => {
        console.log('[The Tribunal] Consult voices clicked');
        if (typeof toastr !== 'undefined') toastr.info('Voice generation (not implemented yet)');
    });

    // NOTE: Status checkboxes and copotype selection are handled by
    // status-handlers.js initStatus() — no duplicate handlers here.

    // ESC to close panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('inland-empire-panel');
            if (panel?.classList.contains('ie-panel-open')) togglePanel();
        }
    });
    
    // Initialize ledger handlers (cases + contacts)
    initLedgerHandlers();

    // Build skill accordion on voices tab
    buildSkillAccordion();

    // Rebuild accordion + refresh status when genre changes
    window.addEventListener('tribunal:genreChanged', () => {
        buildSkillAccordion();
        // Refresh status display for genre-adapted skill names in Active Conditions
        window.TribunalStatus?.refreshStatusFromState?.();
    });
}

/**
 * Unbind events (for cleanup)
 */
export function unbindEvents() {
    // Remove ESC listener
    // Note: To properly remove this, we'd need to store the listener reference
    // For now, this is a placeholder for future cleanup needs
    console.log('[The Tribunal] Event cleanup requested');
}
