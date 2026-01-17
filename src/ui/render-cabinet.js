/**
 * src/ui/render-cabinet.js - Thought cabinet UI
 */

import { thoughtCabinet } from '../core/state.js';

export function renderCabinet() {
    const container = document.querySelector('.ie-cabinet');
    if (!container) return;
    
    const discovered = thoughtCabinet.discovered || [];
    const internalized = thoughtCabinet.internalized || [];
    
    if (!discovered.length && !internalized.length) {
        container.innerHTML = '<div class="ie-cabinet-empty"><i class="fa-solid fa-box-archive"></i><p>Thought Cabinet is empty</p></div>';
        return;
    }
    
    // Render thoughts
}
