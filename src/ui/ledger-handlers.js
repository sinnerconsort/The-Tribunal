/**
 * src/ui/ledger-handlers.js - Ledger/fortune event handlers
 */

import { ledger, saveState } from '../core/state.js';
import { refreshLedgerTab } from './refresh.js';
import { showToast } from './toasts.js';

export function handleAddCase(title, description, getContext) {
    ledger.cases.push({ id: Date.now(), title, description, createdAt: Date.now() });
    saveState(getContext());
    refreshLedgerTab();
    showToast('Case added', 'success');
}
