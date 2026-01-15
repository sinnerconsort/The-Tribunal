/**
 * The Tribunal - SillyTavern Extension
 * Main entry point - orchestrates modular components
 * 
 * A Disco Elysium-inspired internal skill voice system for roleplay
 * Phase 2: Vitals Auto-Detection
 * Phase 3: Ledger Sub-Tabs & Fortune System
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

// Core initialization
import { init } from './src/core/init.js';
import { createGlobalAPI } from './src/core/api.js';

// Re-export for external use (maintains backward compatibility)
import { triggerVoices } from './src/core/trigger.js';
import { togglePanel } from './src/ui/panel.js';
import { extensionSettings } from './src/core/state.js';
import { updateFABState, updateInvestigationFABVisibility } from './src/core/st-helpers.js';

// ═══════════════════════════════════════════════════════════════
// EXTENSION METADATA
// ═══════════════════════════════════════════════════════════════

const extensionName = 'inland-empire';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// ═══════════════════════════════════════════════════════════════
// JQUERY READY HOOK
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        await init();
        createGlobalAPI();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
    }
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS (for potential external use)
// ═══════════════════════════════════════════════════════════════

export {
    triggerVoices,
    togglePanel,
    extensionSettings,
    updateFABState,
    updateInvestigationFABVisibility
};
