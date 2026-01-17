/**
 * src/systems/vitals/hooks.js - ST event integration
 * Imports from: detector.js, core/state.js
 */

import { detectVitalsChanges, mightContainVitalsContent } from './detector.js';
import { modifyHealth, modifyMorale, extensionSettings } from '../../core/state.js';

export function setupVitalsHooks(getContext) {
    // Will be called from index.js to set up auto-vitals detection
}

export function analyzeTextForVitals(text) {
    if (!mightContainVitalsContent(text)) return null;
    return detectVitalsChanges(text);
}

export function applyVitalsFromText(text, context) {
    if (!extensionSettings.autoVitals) return;
    
    const changes = analyzeTextForVitals(text);
    if (!changes) return;
    
    if (changes.healthDelta !== 0) modifyHealth(changes.healthDelta, context);
    if (changes.moraleDelta !== 0) modifyMorale(changes.moraleDelta, context);
}
