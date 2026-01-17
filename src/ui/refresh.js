/**
 * src/ui/refresh.js - All refresh functions
 */

import { getVitals } from '../core/state.js';
import { updateHealth, updateMorale } from './panel-helpers.js';
import { renderVoices } from './render-voices.js';
import { renderCabinet } from './render-cabinet.js';
import { renderLedger } from './render-ledger.js';

export function refreshVitals() {
    const v = getVitals();
    updateHealth(v.health, v.maxHealth);
    updateMorale(v.morale, v.maxMorale);
}

export function refreshVoicesTab() {
    renderVoices();
}

export function refreshCabinetTab() {
    renderCabinet();
}

export function refreshLedgerTab() {
    renderLedger();
}

export function refreshAll() {
    refreshVitals();
    refreshVoicesTab();
    refreshCabinetTab();
    refreshLedgerTab();
}
