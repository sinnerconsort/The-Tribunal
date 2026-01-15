/**
 * Discovery UI Components
 * FAB, Modal, and rendering functions for investigation system
 * Extracted from discovery.js for maintainability
 */

import { extensionSettings, saveState } from '../core/state.js';
import { SKILLS } from '../data/skills.js';
import { getObjectIcon } from '../data/discovery-contexts.js';

// ═══════════════════════════════════════════════════════════════
// MODULE STATE
// ═══════════════════════════════════════════════════════════════

let getContextRef = null;
let currentInvestigation = null;

export function setContextRef(ref) {
    getContextRef = ref;
}

export function setCurrentInvestigation(investigation) {
    currentInvestigation = investigation;
}

export function getCurrentInvestigation() {
    return currentInvestigation;
}

// ═══════════════════════════════════════════════════════════════
// SCENE PREVIEW
// ═══════════════════════════════════════════════════════════════

export function updateScenePreview(sceneText) {
    const preview = document.getElementById('ie-scene-preview');
    if (preview && sceneText) {
        const truncated = sceneText.length > 100 
            ? sceneText.substring(0, 100) + '...' 
            : sceneText;
        preview.textContent = truncated;
        preview.title = sceneText.substring(0, 500);
    }
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION
// ═══════════════════════════════════════════════════════════════

export function createThoughtBubbleFAB(getContext, toggleModalFn) {
    getContextRef = getContext;
    
    const fab = document.createElement('div');
    fab.id = 'ie-thought-fab';
    fab.className = 'ie-thought-fab';
    fab.title = 'Investigate Surroundings';
    
    fab.innerHTML = `
        <span class="ie-thought-fab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
    `;

    fab.style.top = `${(extensionSettings.discoveryFabTop ?? extensionSettings.fabPositionTop ?? 140) + 60}px`;
    fab.style.left = `${extensionSettings.discoveryFabLeft ?? extensionSettings.fabPositionLeft ?? 10}px`;

    // Main FAB click opens modal
    fab.addEventListener('click', (e) => {
        if (fab.dataset.justDragged === 'true') {
            fab.dataset.justDragged = 'false';
            return;
        }
        toggleModalFn();
    });

    setupFabDragging(fab);
    return fab;
}

function setupFabDragging(fab) {
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        if (e.target.closest('button')) return;
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.2s ease';
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            extensionSettings.discoveryFabTop = fab.offsetTop;
            extensionSettings.discoveryFabLeft = fab.offsetLeft;
            if (getContextRef) saveState(getContextRef());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
}

// ═══════════════════════════════════════════════════════════════
// MODAL CREATION
// ═══════════════════════════════════════════════════════════════

export function createDiscoveryModal(callbacks) {
    const { toggleModal, investigate, rescan, ensureSceneContext } = callbacks;
    
    const overlay = document.createElement('div');
    overlay.id = 'ie-discovery-overlay';
    overlay.className = 'ie-discovery-overlay';

    overlay.innerHTML = `
        <div class="ie-discovery-modal">
            <div class="ie-discovery-header">
                <div class="ie-discovery-title">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Investigation</span>
                </div>
                <button class="ie-discovery-close" title="Close">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="ie-scene-context">
                <div class="ie-scene-label">
                    <i class="fa-solid fa-map-marker-alt"></i>
                    <span>Current Scene:</span>
                </div>
                <div class="ie-scene-preview" id="ie-scene-preview">
                    No scene loaded...
                </div>
            </div>
            
            <div class="ie-discovery-actions">
                <button class="ie-btn ie-btn-primary ie-discovery-investigate" id="ie-investigate-btn">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Investigate</span>
                </button>
                <button class="ie-btn ie-discovery-rescan" id="ie-rescan-btn" title="Re-investigate with potentially different narrator">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Rescan</span>
                </button>
            </div>
            
            <div class="ie-investigation-results" id="ie-investigation-results">
                <div class="ie-discovery-empty">
                    <i class="fa-solid fa-eye-slash"></i>
                    <span>Click Investigate to examine your surroundings...</span>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    overlay.querySelector('.ie-discovery-close').addEventListener('click', toggleModal);
    
    overlay.querySelector('#ie-investigate-btn').addEventListener('click', () => {
        if (getContextRef) ensureSceneContext(getContextRef);
        investigate({ silent: false, source: 'modal' });
    });
    
    overlay.querySelector('#ie-rescan-btn').addEventListener('click', () => {
        if (getContextRef) ensureSceneContext(getContextRef);
        currentInvestigation = null;
        rescan({ silent: false, source: 'rescan' });
    });
    
    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleModal();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('ie-discovery-open')) {
            toggleModal();
        }
    });

    return overlay;
}

export function toggleDiscoveryModal(ensureSceneContextFn, lastSceneContext) {
    const overlay = document.getElementById('ie-discovery-overlay');
    if (!overlay) return;

    const isOpen = overlay.classList.contains('ie-discovery-open');
    
    if (isOpen) {
        overlay.classList.remove('ie-discovery-open');
    } else {
        if (getContextRef && ensureSceneContextFn) {
            ensureSceneContextFn(getContextRef);
        }
        overlay.classList.add('ie-discovery-open');
        updateScenePreview(lastSceneContext);
        
        // Render existing investigation if any
        if (currentInvestigation) {
            renderInvestigation(currentInvestigation);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION RENDERING
// ═══════════════════════════════════════════════════════════════

export function renderInvestigation(investigation) {
    const container = document.getElementById('ie-investigation-results');
    if (!container) return;
    
    const check = investigation.narrator.checkResult;
    
    // Build check result badge
    let checkBadge = '';
    if (check) {
        if (check.isBoxcars) {
            checkBadge = `<span class="ie-check-badge ie-critical-success">⚡ Critical Success</span>`;
        } else if (check.isSnakeEyes) {
            checkBadge = `<span class="ie-check-badge ie-critical-failure">💀 Critical Failure</span>`;
        } else if (check.success) {
            checkBadge = `<span class="ie-check-badge ie-success">${check.difficultyName} [Success]</span>`;
        } else {
            checkBadge = `<span class="ie-check-badge ie-failure">${check.difficultyName} [Failure]</span>`;
        }
    }
    
    // Narrator block
    const narratorHtml = `
        <div class="ie-narrator-block" style="border-left-color: ${investigation.narrator.color}">
            <div class="ie-narrator-header">
                <span class="ie-narrator-name" style="color: ${investigation.narrator.color}">
                    ${investigation.narrator.signature}
                </span>
                ${checkBadge}
                <span class="ie-narrator-label">NARRATOR</span>
            </div>
            <div class="ie-narrator-content">
                "${investigation.narrator.content}"
            </div>
        </div>
    `;
    
    // Reactor lines
    const reactorsHtml = investigation.reactors.map(reactor => {
        const icon = reactor.isObject ? (reactor.icon || '📦') : '';
        const objectClass = reactor.isObject ? 'ie-reactor-object' : '';
        const typeLabel = reactor.isObject ? '<span class="ie-reactor-type">OBJECT</span>' : '';
        
        return `
            <div class="ie-reactor-line ${objectClass}" style="border-left-color: ${reactor.color}">
                ${icon ? `<span class="ie-reactor-icon">${icon}</span>` : ''}
                <span class="ie-reactor-name" style="color: ${reactor.color}">
                    ${reactor.signature}
                </span>
                ${typeLabel}
                <span class="ie-reactor-dash">—</span>
                <span class="ie-reactor-content">${reactor.content}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        ${narratorHtml}
        ${investigation.reactors.length > 0 ? `
            <div class="ie-reactors-section">
                <div class="ie-reactors-divider"></div>
                ${reactorsHtml}
            </div>
        ` : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════
// UI STATE HELPERS
// ═══════════════════════════════════════════════════════════════

export function setInvestigateButtonLoading(loading) {
    const btn = document.getElementById('ie-investigate-btn');
    const rescanBtn = document.getElementById('ie-rescan-btn');
    
    if (btn) {
        btn.disabled = loading;
        btn.innerHTML = loading 
            ? `<i class="fa-solid fa-spinner fa-spin"></i><span>Investigating...</span>`
            : `<i class="fa-solid fa-magnifying-glass"></i><span>Investigate</span>`;
    }
    if (rescanBtn) {
        rescanBtn.disabled = loading;
    }
}

export function updateEmptyState(message) {
    const container = document.getElementById('ie-investigation-results');
    if (container) {
        container.innerHTML = `
            <div class="ie-discovery-empty">
                <i class="fa-solid fa-eye-slash"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

export function setFABScanning(isScanning) {
    const fab = document.getElementById('ie-thought-fab');
    if (fab) {
        if (isScanning) {
            fab.classList.add('ie-scanning');
        } else {
            fab.classList.remove('ie-scanning');
        }
    }
}

export function showFABSuccess() {
    const fab = document.getElementById('ie-thought-fab');
    if (fab) {
        fab.classList.add('ie-scan-success');
        setTimeout(() => fab.classList.remove('ie-scan-success'), 1500);
    }
}
