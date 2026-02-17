/**
 * The Tribunal - Panel Templates Hub
 * Modular re-exports from individual template files
 * 
 * This file now serves as a central import/export hub.
 * Each tab has its own template file for easier maintenance.
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS FROM MODULAR TEMPLATE FILES
// ═══════════════════════════════════════════════════════════════

export { PANEL_HEADER_HTML, TAB_BAR_HTML, BOTTOM_BUTTONS_HTML } from './header-template.js';
export { VOICES_TAB_HTML, buildSkillAccordion, updateSkillScores, expandCategory, refreshAccordion } from './voices-template.js';
export { CABINET_TAB_HTML } from './cabinet-template.js';
export { STATUS_TAB_HTML } from './status-template.js';
export { LEDGER_TAB_HTML } from './ledger-template.js';
export { INVENTORY_TAB_HTML } from './inventory-template.js';
export { PROFILES_TAB_HTML, initCardFlip, updateCardDisplay, updateMoneyDisplay, renderPersonaSlots } from './profiles-template.js';
export { SETTINGS_TAB_HTML } from './settings-template.js';
