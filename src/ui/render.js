/**
 * The Tribunal - Render Functions
 * 
 * Main entry point that re-exports all render modules:
 * - Voices display (panel & chat)
 * - Attributes & Build Editor
 * - Status grid & effects
 * - Thought Cabinet
 * - Profiles
 * - Vitals detail
 * - Ledger (quests, events, weather)
 * - Inventory
 * - Settings sync
 */

// ═══════════════════════════════════════════════════════════════
// VOICE RENDERING
// ═══════════════════════════════════════════════════════════════
export { 
    renderVoices, 
    appendVoicesToChat,
    clearVoices
} from './render-voices.js';

// ═══════════════════════════════════════════════════════════════
// ATTRIBUTES & BUILD EDITOR
// ═══════════════════════════════════════════════════════════════
export { 
    renderAttributesDisplay, 
    renderBuildEditor,
    updatePointsRemaining
} from './render-attributes.js';

// ═══════════════════════════════════════════════════════════════
// STATUS & EFFECTS
// ═══════════════════════════════════════════════════════════════
export { 
    renderStatusGrid, 
    renderActiveEffectsSummary 
} from './render-status.js';

// ═══════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════
export { renderProfilesList } from './render-profiles.js';

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET
// ═══════════════════════════════════════════════════════════════
export { 
    renderThoughtCabinet,
    renderThoughtModal
} from './render-cabinet.js';

// ═══════════════════════════════════════════════════════════════
// SETTINGS SYNC
// ═══════════════════════════════════════════════════════════════
export { 
    syncSettingsToUI, 
    syncUIToSettings,
    syncNewSettingsToUI,
    syncNewSettingsFromUI
} from './render-settings.js';

// ═══════════════════════════════════════════════════════════════
// VITALS
// ═══════════════════════════════════════════════════════════════
export { renderVitalsDetail } from './render-vitals.js';

// ═══════════════════════════════════════════════════════════════
// LEDGER (Quests, Events, Weather)
// ═══════════════════════════════════════════════════════════════
export { 
    renderQuests, 
    renderEventsLog, 
    renderWeather,
    renderLedgerTab
} from './render-ledger.js';

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════
export { 
    renderInventoryItems, 
    updateInventoryCounts, 
    renderMoney,
    renderInventoryTab
} from './render-inventory.js';
