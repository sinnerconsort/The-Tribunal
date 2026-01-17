/**
 * src/ui/render-voices.js - Voice rendering
 */

import { getVoiceTemplate, escapeHtml } from './panel-templates.js';

let lastVoices = [];

export function renderVoices(voices) {
    const container = document.querySelector('.ie-voices');
    if (!container) return;
    
    if (voices) lastVoices = voices;
    
    if (!lastVoices.length) {
        container.innerHTML = '<div class="ie-voices-empty"><i class="fa-solid fa-brain"></i><p>Voices will appear here...</p></div>';
        return;
    }
    
    container.innerHTML = lastVoices.map(v => getVoiceTemplate(v)).join('');
}

export function showVoicesLoading() {
    const container = document.querySelector('.ie-voices');
    if (container) container.innerHTML = '<div class="ie-voices-loading"><i class="fa-solid fa-spinner fa-spin"></i><p>The voices are deliberating...</p></div>';
}

export function showVoicesError(msg) {
    const container = document.querySelector('.ie-voices');
    if (container) container.innerHTML = '<div class="ie-voices-error"><i class="fa-solid fa-exclamation-triangle"></i><p>' + escapeHtml(msg) + '</p></div>';
}

export function getLastVoices() { return [...lastVoices]; }
