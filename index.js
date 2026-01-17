/**
 * The Tribunal - SillyTavern Extension
 * REBUILD v0.1.1 - UI Shell Only (jQuery + Mobile Fix)
 * 
 * Fresh start. No state management, no saves.
 * Just the UI shell that opens and closes.
 */

const extensionName = 'the-tribunal';

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════

function getPanelHTML() {
    return `
        <!-- Left ruler edge -->
        <div class="ie-right-ruler"></div>
        
        <!-- Film strip bottom text -->
        <div class="ie-film-bottom-text"></div>
        
        <!-- Panel markers -->
        <div class="ie-panel-marker ie-panel-marker-top">01A15</div>
        <div class="ie-panel-marker-right">02B23</div>
        
        <!-- Header -->
        <div class="ie-panel-header">
            <div class="ie-header-top">
                <div class="ie-panel-title">
                    <i class="fa-solid fa-address-card"></i>
                    <span>THE TRIBUNAL</span>
                </div>
                <div class="ie-panel-controls">
                    <button class="ie-btn-close-panel" title="Close">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Vitals bars -->
            <div class="ie-header-vitals">
                <div class="ie-vital-row">
                    <span class="ie-vital-label">HEALTH</span>
                    <div class="ie-vital-bar ie-health-bar">
                        <div class="ie-vital-fill" style="width: 100%"></div>
                    </div>
                    <span class="ie-vital-value">13/13</span>
                </div>
                <div class="ie-vital-row">
                    <span class="ie-vital-label">MORALE</span>
                    <div class="ie-vital-bar ie-morale-bar">
                        <div class="ie-vital-fill" style="width: 100%"></div>
                    </div>
                    <span class="ie-vital-value">13/13</span>
                </div>
            </div>
        </div>
        
        <!-- Tab bar -->
        <div class="ie-tabs">
            <button class="ie-tab ie-tab-active" data-tab="voices">
                <i class="fa-solid fa-comments"></i>
                <span>Voices</span>
            </button>
            <button class="ie-tab" data-tab="cabinet">
                <i class="fa-solid fa-brain"></i>
                <span>Cabinet</span>
            </button>
            <button class="ie-tab" data-tab="status">
                <i class="fa-solid fa-bolt"></i>
                <span>Status</span>
            </button>
            <button class="ie-tab" data-tab="ledger">
                <i class="fa-solid fa-book"></i>
                <span>Ledger</span>
            </button>
        </div>
        
        <!-- Tab content area -->
        <div class="ie-panel-content">
            <!-- Voices Tab -->
            <div class="ie-tab-content ie-tab-content-active" data-tab="voices">
                <div class="ie-section">
                    <div class="ie-section-header">
                        <h3>Inner Voices</h3>
                        <button class="ie-btn ie-btn-small" id="ie-manual-trigger">
                            <i class="fa-solid fa-play"></i> Trigger
                        </button>
                    </div>
                    <div id="ie-voices-output" class="ie-voices-container">
                        <div class="ie-voices-empty">
                            <i class="fa-solid fa-comment-slash"></i>
                            <span>Waiting for something to happen...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Cabinet Tab -->
            <div class="ie-tab-content" data-tab="cabinet">
                <div class="ie-section">
                    <h3>Thought Cabinet</h3>
                    <p class="ie-empty-state">No thoughts yet...</p>
                </div>
            </div>
            
            <!-- Status Tab -->
            <div class="ie-tab-content" data-tab="status">
                <div class="ie-section">
                    <h3>Status Effects</h3>
                    <p class="ie-empty-state">No active effects</p>
                </div>
            </div>
            
            <!-- Ledger Tab -->
            <div class="ie-tab-content" data-tab="ledger">
                <div class="ie-section">
                    <h3>Case Ledger</h3>
                    <p class="ie-empty-state">No open cases</p>
                </div>
            </div>
        </div>
        
        <!-- Bottom buttons -->
        <div class="ie-panel-footer">
            <button class="ie-bottom-btn" data-panel="profiles">
                <i class="fa-solid fa-user"></i>
                <span>Profiles</span>
            </button>
            <button class="ie-bottom-btn" data-panel="settings">
                <i class="fa-solid fa-cog"></i>
                <span>Settings</span>
            </button>
        </div>
    `;
}

function getFABHTML() {
    return `
        <div id="inland-empire-fab" class="ie-fab" title="Open Psyche Panel">
            <div class="ie-fab-icon">
                <i class="fa-solid fa-address-card"></i>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// UI CREATION (jQuery)
// ═══════════════════════════════════════════════════════════════

function createPanel() {
    const panelHtml = `<div id="inland-empire-panel" class="inland-empire-panel">${getPanelHTML()}</div>`;
    $('body').append(panelHtml);
    return $('#inland-empire-panel');
}

function createFAB() {
    $('body').append(getFABHTML());
    const $fab = $('#inland-empire-fab');
    
    // Explicit positioning - 70px from top to clear ST mobile header
    $fab.css({
        'top': '70px',
        'left': '10px',
        'z-index': '99999'
    });
    
    // Make draggable
    makeDraggable($fab);
    
    return $fab;
}

// ═══════════════════════════════════════════════════════════════
// DRAGGABLE FAB (jQuery + Touch)
// ═══════════════════════════════════════════════════════════════

function makeDraggable($element) {
    let isDragging = false;
    let hasMoved = false;
    let startX, startY, startLeft, startTop;
    let rafId = null;
    let pendingX, pendingY;
    
    const element = $element[0];
    
    function updatePosition() {
        element.style.left = pendingX + 'px';
        element.style.top = pendingY + 'px';
        rafId = null;
    }
    
    function onStart(e) {
        isDragging = true;
        hasMoved = false;
        
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        startLeft = element.offsetLeft;
        startTop = element.offsetTop;
        
        element.style.transition = 'none';
    }
    
    function onMove(e) {
        if (!isDragging) return;
        
        // Prevent scrolling while dragging
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
        }
        
        pendingX = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, startLeft + dx));
        pendingY = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, startTop + dy));
        
        // Use RAF for smooth updates
        if (!rafId) {
            rafId = requestAnimationFrame(updatePosition);
        }
    }
    
    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        element.style.transition = '';
        
        if (hasMoved) {
            $element.data('justDragged', true);
            setTimeout(() => {
                $element.data('justDragged', false);
            }, 100);
        }
    }
    
    // Mouse events
    $element.on('mousedown', onStart);
    $(document).on('mousemove', onMove);
    $(document).on('mouseup', onEnd);
    
    // Touch events - passive: false to allow preventDefault
    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchmove', onMove, { passive: false });
    element.addEventListener('touchend', onEnd, { passive: true });
}

// ═══════════════════════════════════════════════════════════════
// PANEL TOGGLE
// ═══════════════════════════════════════════════════════════════

function togglePanel() {
    const $panel = $('#inland-empire-panel');
    const $fab = $('#inland-empire-fab');
    
    $panel.toggleClass('ie-panel-open');
    $fab.toggleClass('ie-fab-active', $panel.hasClass('ie-panel-open'));
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabId) {
    // Update tab buttons
    $('.ie-tab').removeClass('ie-tab-active');
    $(`.ie-tab[data-tab="${tabId}"]`).addClass('ie-tab-active');
    
    // Update tab content
    $('.ie-tab-content').removeClass('ie-tab-content-active');
    $(`.ie-tab-content[data-tab="${tabId}"]`).addClass('ie-tab-content-active');
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

function bindEvents() {
    // FAB click
    $(document).on('click', '#inland-empire-fab', function() {
        if ($(this).data('justDragged')) {
            return;
        }
        togglePanel();
    });
    
    // Close button
    $(document).on('click', '.ie-btn-close-panel', togglePanel);
    
    // Tab switching
    $(document).on('click', '.ie-tab', function() {
        switchTab($(this).data('tab'));
    });
    
    // Bottom buttons
    $(document).on('click', '.ie-bottom-btn', function() {
        const panel = $(this).data('panel');
        console.log('[The Tribunal] Bottom button:', panel);
        // TODO: Add profiles/settings tabs
    });
    
    // Manual trigger (placeholder)
    $(document).on('click', '#ie-manual-trigger', function() {
        console.log('[The Tribunal] Manual trigger clicked');
        toastr.info('Voice trigger (not implemented yet)');
    });
    
    // ESC to close
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            const $panel = $('#inland-empire-panel');
            if ($panel.hasClass('ie-panel-open')) {
                togglePanel();
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log('[The Tribunal] Initializing UI shell v0.1.2...');
    
    // DEBUG: Add visible indicator that JS ran
    $('body').append(`
        <div id="ie-debug-indicator" style="
            position: fixed !important;
            bottom: 120px !important;
            right: 10px !important;
            background: #f3650b !important;
            color: white !important;
            padding: 8px 12px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            z-index: 999999 !important;
            pointer-events: none !important;
        ">TRIBUNAL JS OK</div>
    `);
    
    // Remove debug indicator after 5 seconds
    setTimeout(() => $('#ie-debug-indicator').fadeOut(), 5000);
    
    // Create UI elements
    createPanel();
    createFAB();
    
    // Bind events
    bindEvents();
    
    console.log('[The Tribunal] UI shell ready!');
    toastr.success('The Tribunal loaded!', 'Extension', { timeOut: 2000 });
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
        toastr.error(`Init failed: ${error.message}`, 'The Tribunal');
    }
});
