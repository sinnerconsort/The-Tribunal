/**
 * The Tribunal - SillyTavern Extension
 * REBUILD v0.1.3 - Matching working version patterns
 * 
 * Fresh start. No state management, no saves.
 * Just the UI shell that opens and closes.
 */

const extensionName = 'the-tribunal';

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════

const PANEL_HEADER_HTML = `
<div class="ie-right-ruler"></div>
<div class="ie-film-bottom-text"></div>
<span class="ie-panel-marker ie-panel-marker-top">01A15</span>
<span class="ie-panel-marker ie-panel-marker-mid">01A15</span>
<span class="ie-panel-marker-right">FELD ▼   DEVICE</span>

<div class="ie-panel-header">
    <div class="ie-header-top">
        <div class="ie-panel-title">
            <i class="fa-solid fa-folder-open"></i>
            <span class="ie-case-title">CASE FILE</span>
        </div>
        <div class="ie-panel-controls">
            <button class="ie-btn ie-btn-close-panel" title="Close">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    </div>
    <div class="ie-vitals-row">
        <div class="ie-vital-bar ie-vital-health">
            <span class="ie-vital-label">Health</span>
            <div class="ie-vital-track">
                <div class="ie-vital-fill" id="ie-health-fill" style="width: 100%;"></div>
            </div>
            <span class="ie-vital-value" id="ie-health-value">13</span>
        </div>
        <div class="ie-vital-bar ie-vital-morale">
            <span class="ie-vital-label">Morale</span>
            <div class="ie-vital-track">
                <div class="ie-vital-fill" id="ie-morale-fill" style="width: 100%;"></div>
            </div>
            <span class="ie-vital-value" id="ie-morale-value">13</span>
        </div>
    </div>
</div>`;

const TAB_BAR_HTML = `
<div class="ie-tabs">
    <button class="ie-tab ie-tab-active" data-tab="voices" title="Inner Voices">
        <i class="fa-solid fa-masks-theater"></i>
    </button>
    <button class="ie-tab" data-tab="cabinet" title="Thought Cabinet">
        <i class="fa-solid fa-box-archive"></i>
    </button>
    <button class="ie-tab" data-tab="status" title="Status">
        <i class="fa-solid fa-heart-pulse"></i>
    </button>
    <button class="ie-tab" data-tab="ledger" title="Ledger">
        <i class="fa-solid fa-clipboard-list"></i>
    </button>
</div>`;

const VOICES_TAB_HTML = `
<div class="ie-tab-content ie-tab-content-active" data-tab-content="voices">
    <div class="ie-section ie-voices-section">
        <div class="ie-section-header">
            <span>Inner Voices</span>
        </div>
        <div class="ie-voices-container" id="ie-voices-output">
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        </div>
    </div>
    <div class="ie-section ie-manual-section">
        <button class="ie-btn ie-btn-primary ie-btn-trigger" id="ie-manual-trigger">
            <i class="fa-solid fa-bolt"></i>
            <span>Consult Inner Voices</span>
        </button>
    </div>
</div>`;

const CABINET_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="cabinet">
    <div class="ie-section">
        <div class="ie-section-header"><span>Thought Cabinet</span></div>
        <p class="ie-empty-state">No thoughts yet...</p>
    </div>
</div>`;

const STATUS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="status">
    <div class="ie-section">
        <div class="ie-section-header"><span>Status Effects</span></div>
        <p class="ie-empty-state">No active effects</p>
    </div>
</div>`;

const LEDGER_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="ledger">
    <div class="ie-section">
        <div class="ie-section-header"><span>Case Ledger</span></div>
        <p class="ie-empty-state">No open cases</p>
    </div>
</div>`;

const SETTINGS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="settings">
    <div class="ie-section">
        <div class="ie-section-header"><span>Settings</span></div>
        <p class="ie-empty-state">Settings coming soon...</p>
    </div>
</div>`;

const PROFILES_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="profiles">
    <div class="ie-section">
        <div class="ie-section-header"><span>Profiles</span></div>
        <p class="ie-empty-state">Profiles coming soon...</p>
    </div>
</div>`;

const BOTTOM_BUTTONS_HTML = `
<div class="ie-bottom-buttons">
    <button class="ie-bottom-btn" data-panel="settings" title="Settings">
        <i class="fa-solid fa-gear"></i>
        <span>Settings</span>
    </button>
    <button class="ie-bottom-btn" data-panel="profiles" title="Profiles">
        <i class="fa-solid fa-user"></i>
        <span>Profiles</span>
    </button>
</div>`;

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION (Vanilla JS - matching working version)
// ═══════════════════════════════════════════════════════════════

function createPsychePanel() {
    const panel = document.createElement('div');
    panel.id = 'inland-empire-panel';
    panel.className = 'inland-empire-panel';

    panel.innerHTML = `
        ${PANEL_HEADER_HTML}
        ${TAB_BAR_HTML}
        <div class="ie-panel-content">
            ${VOICES_TAB_HTML}
            ${CABINET_TAB_HTML}
            ${STATUS_TAB_HTML}
            ${LEDGER_TAB_HTML}
            ${SETTINGS_TAB_HTML}
            ${PROFILES_TAB_HTML}
        </div>
        ${BOTTOM_BUTTONS_HTML}
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION (Vanilla JS - matching working version EXACTLY)
// ═══════════════════════════════════════════════════════════════

function createToggleFAB() {
    const fab = document.createElement('div');
    fab.id = 'inland-empire-fab';
    fab.className = 'ie-fab';
    fab.title = 'Toggle Psyche Panel';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-address-card"></i></span>';
    fab.style.display = 'flex';
    fab.style.top = '140px';
    fab.style.left = '10px';

    // Dragging state
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
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
        fab.style.transition = 'all 0.3s ease';
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        if (hasMoved) {
            fab.dataset.justDragged = 'true';
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

function togglePanel() {
    const panel = document.getElementById('inland-empire-panel');
    const fab = document.getElementById('inland-empire-fab');

    if (!panel) return;

    const isOpen = panel.classList.contains('ie-panel-open');

    if (isOpen) {
        panel.classList.remove('ie-panel-open');
        fab?.classList.remove('ie-fab-active');
    } else {
        panel.classList.add('ie-panel-open');
        fab?.classList.add('ie-fab-active');
    }
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabName) {
    // Handle main tabs
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    // Handle bottom buttons (settings/profiles)
    document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
        btn.classList.toggle('ie-bottom-btn-active', btn.dataset.panel === tabName)
    );

    // Show/hide tab content - NOTE: uses data-tab-content not data-tab
    document.querySelectorAll('.ie-tab-content').forEach(content =>
        content.classList.toggle('ie-tab-content-active', content.dataset.tabContent === tabName)
    );

    // Clear active state from main tabs if switching to bottom panel
    if (tabName === 'settings' || tabName === 'profiles') {
        document.querySelectorAll('.ie-tab').forEach(tab =>
            tab.classList.remove('ie-tab-active')
        );
    }

    // Clear active state from bottom buttons if switching to main tab
    const mainTabs = ['voices', 'cabinet', 'status', 'ledger'];
    if (mainTabs.includes(tabName)) {
        document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
            btn.classList.remove('ie-bottom-btn-active')
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

function bindEvents() {
    // FAB click
    document.getElementById('inland-empire-fab')?.addEventListener('click', function(e) {
        if (this.dataset.justDragged === 'true') {
            this.dataset.justDragged = 'false';
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

    // Bottom buttons
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });

    // Manual trigger (placeholder)
    document.getElementById('ie-manual-trigger')?.addEventListener('click', () => {
        console.log('[The Tribunal] Manual trigger clicked');
        if (typeof toastr !== 'undefined') {
            toastr.info('Voice trigger (not implemented yet)');
        }
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
    console.log('[The Tribunal] Initializing UI shell v0.1.3...');

    // Create and append UI elements (vanilla JS style)
    const panel = createPsychePanel();
    const fab = createToggleFAB();

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // Bind events
    bindEvents();

    console.log('[The Tribunal] UI shell ready!');
    
    if (typeof toastr !== 'undefined') {
        toastr.success('The Tribunal loaded!', 'Extension', { timeOut: 2000 });
    }
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error(`Init failed: ${error.message}`, 'The Tribunal');
        }
    }
});
