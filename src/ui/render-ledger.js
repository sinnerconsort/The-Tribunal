/**
 * src/ui/render-ledger.js - Ledger/cases
 */

import { ledger } from '../core/state.js';

export function renderLedger() {
    const container = document.querySelector('.ie-ledger');
    if (!container) return;
    
    if (!ledger.cases.length) {
        container.innerHTML = '<div class="ie-ledger-empty"><i class="fa-solid fa-book"></i><p>No ledger entries yet</p></div>';
        return;
    }
    
    // Render cases
}
