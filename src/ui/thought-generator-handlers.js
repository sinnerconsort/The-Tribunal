/**
 * src/ui/thought-generator-handlers.js - Thought generation UI handlers
 */

import { generateThought } from '../voice/thought-generation.js';
import { refreshCabinetTab } from './refresh.js';
import { showToast } from './toasts.js';

export async function handleGenerateThought(concept, context, getContext) {
    try {
        showToast('Generating thought...', 'info');
        const thought = await generateThought(concept, context, getContext);
        refreshCabinetTab();
        showToast('New thought discovered!', 'success');
        return thought;
    } catch (e) {
        showToast('Failed to generate thought: ' + e.message, 'error');
        return null;
    }
}
