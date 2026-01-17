/**
 * src/ui/discovery-ui.js - Investigation FAB, modal
 */

import { investigateObject } from '../voice/discovery.js';
import { showToast } from './toasts.js';

export function createDiscoveryFAB() {
    // Placeholder for discovery FAB creation
}

export async function handleInvestigation(object, getContext) {
    try {
        showToast('Investigating...', 'info');
        const result = await investigateObject(object, {}, getContext);
        showToast('Discovery made!', 'success');
        return result;
    } catch (e) {
        showToast('Investigation failed: ' + e.message, 'error');
        return null;
    }
}
