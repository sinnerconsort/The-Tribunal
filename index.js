/**
 * The Tribunal - SillyTavern Extension
 * REBUILD v0.1.0 - UI Shell Only
 * 
 * This is a fresh start. No state management, no saves.
 * Just the UI shell that opens and closes.
 */

const extensionName = 'the-tribunal';

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATES (inline for now)
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
            
            <!-- Vitals bars placeholder -->
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

// ═══════════════════════════════════════════════════════════════
// UI CREATION
// ═══════════════════════════════════════════════════════════════

function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'inland-empire-panel';
    panel.className = 'inland-empire-panel';
    panel.innerHTML = getPanelHTML();
    return panel;
}

function createFAB() {
    const fab = document.createElement('div');
    fab.id = 'inland-empire-fab';
    fab.className = 'ie-fab';
    fab.title = 'Open Psyche Panel';
    fab.innerHTML = `
        <div class="ie-fab-icon">
            <i class="fa-solid fa-address-card"></i>
        </div>
    `;
    
    // Position
    fab.style.top = '140px';
    fab.style.left = '10px';
    
    // Make draggable
    makeDraggable(fab);
    
    return fab;
}

// ═══════════════════════════════════════════════════════════════
// DRAGGABLE FAB
// ═══════════════════════════════════════════════════════════════

function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    let hasMoved = false;
    
    const onStart = (e) => {
        isDragging = true;
        hasMoved = false;
        
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        startLeft = element.offsetLeft;
        startTop = element.offsetTop;
        
        element.style.transition = 'none';
        element.style.cursor = 'grabbing';
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
        }
        
        const newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, startLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, startTop + dy));
        
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
    };
    
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        element.style.transition = '';
        element.style.cursor = '';
        
        if (hasMoved) {
            element.dataset.justDragged = 'true';
            setTimeout(() => {
                element.dataset.justDragged = 'false';
            }, 100);
        }
    };
    
    // Mouse events
    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    
    // Touch events
    element.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
}

// ═══════════════════════════════════════════════════════════════
// PANEL TOGGLE
// ═══════════════════════════════════════════════════════════════

function togglePanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');
    
    if (panel) {
        panel.classList.toggle('ie-panel-open');
        
        if (fab) {
            fab.classList.toggle('ie-fab-active', panel.classList.contains('ie-panel-open'));
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll('.ie-tab-content').forEach(content => {
        content.classList.toggle('ie-tab-content-active', content.dataset.tab === tabId);
    });
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

function bindEvents() {
    // FAB click
    document.getElementById('inland-empire-fab')?.addEventListener('click', function(e) {
        if (this.dataset.justDragged === 'true') {
            return;
        }
        togglePanel();
    });
    
    // Close button
    document.querySelector('.ie-btn-close-panel')?.addEventListener('click', togglePanel);
    
    // Tab switching
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Bottom buttons (just switch tabs for now)
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            // For now, just log - we'll add these tabs later
            console.log('[The Tribunal] Bottom button clicked:', panel);
        });
    });
    
    // Manual trigger (placeholder)
    document.getElementById('ie-manual-trigger')?.addEventListener('click', () => {
        console.log('[The Tribunal] Manual trigger clicked');
    });
    
    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('inland-empire-panel');
            if (panel?.classList.contains('ie-panel-open')) {
                togglePanel();
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log('[The Tribunal] Initializing UI shell...');
    
    // Create and append UI elements
    const panel = createPanel();
    const fab = createFAB();
    
    document.body.appendChild(panel);
    document.body.appendChild(fab);
    
    // Bind events
    bindEvents();
    
    console.log('[The Tribunal] UI shell ready!');
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
    }
});
