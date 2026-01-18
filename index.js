/**
 * The Tribunal - SillyTavern Extension
 * A standalone text based Disco Elysium system
 * 
 * REBUILD v0.4.0 - Modular architecture
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

// UI Components
import { createPsychePanel, createToggleFAB } from './src/ui/panel.js';
import { bindEvents } from './src/ui/panel-helpers.js';
import { startWatch } from './src/ui/watch.js';

// Re-export commonly used functions for external access
export { togglePanel, switchTab, openPanel, closePanel } from './src/ui/panel-helpers.js';
export { updateCRTVitals, flashCRTEffect, setCRTCharacterName } from './src/ui/crt-vitals.js';
export { setRCMStatus, setRCMCopotype, addRCMAncientVoice, addRCMActiveEffect } from './src/ui/crt-vitals.js';
export { setRPTime, setRPWeather, getWatchMode } from './src/ui/watch.js';

// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'the-tribunal';
const extensionVersion = '0.4.0';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the extension
 */
function init() {
    console.log(`[The Tribunal] Initializing v${extensionVersion}...`);

    // Create UI elements
    const panel = createPsychePanel();
    const fab = createToggleFAB();

    // Add to DOM
    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // Bind all events
    bindEvents();
    
    // Start the watch
    startWatch();

    console.log('[The Tribunal] UI ready!');
    if (typeof toastr !== 'undefined') {
        toastr.success('The Tribunal loaded!', 'Extension', { timeOut: 2000 });
    }
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error(`Init failed: ${error.message}`, 'The Tribunal');
        }
    }
});
