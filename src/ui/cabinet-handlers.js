/**
 * src/ui/cabinet-handlers.js - Thought cabinet event handlers
 */

import { startResearch, completeResearch } from '../systems/cabinet.js';
import { refreshCabinetTab } from './refresh.js';
import { showToast } from './toasts.js';

export function handleResearchStart(thoughtId, getContext) {
    if (startResearch(thoughtId, getContext())) {
        refreshCabinetTab();
        showToast('Research started', 'info');
    }
}

export function handleResearchComplete(thoughtId, getContext) {
    if (completeResearch(thoughtId, getContext())) {
        refreshCabinetTab();
        showToast('Thought internalized!', 'success');
    }
}
