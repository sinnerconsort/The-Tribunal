/**
 * The Tribunal - SillyTavern Extension
 * REBUILD v0.1.8 - Better header layout
 * 
 * Header layout:
 * [📁 CASE FILE]              [⌚]
 * [❤️ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 13]
 * [🧠 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 13]
 */

const extensionName = 'the-tribunal';

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════

const PANEL_HEADER_HTML = `
<div class="ie-right-ruler"></div>
<div class="ie-film-bottom-text"></div>
<span class="ie-panel-marker ie-panel-marker-first" style="top: 300px !important;">01A15</span>
<span class="ie-panel-marker ie-panel-marker-bottom">01A15</span>
<span class="ie-panel-marker-right">FELD ▼   DEVICE</span>

<div class="ie-panel-header">
    <!-- Top row: Case File + Watch -->
    <div class="ie-header-top">
        <button class="ie-panel-title ie-btn-close-panel" title="Close Panel">
            <i class="fa-solid fa-folder-open"></i>
            <span class="ie-case-title">CASE FILE</span>
        </button>
        
        <div class="tribunal-watch real-mode" id="ie-header-watch" title="Click to toggle Real/RP time">
            <div class="watch-clip"></div>
            <div class="watch-case">
                <div class="watch-bezel">
                    <div class="watch-dial">
                        <div class="watch-weather clear-day" id="ie-watch-weather">
                            <i class="fa-solid fa-sun" id="ie-watch-weather-icon"></i>
                        </div>
                        <div class="watch-date" id="ie-watch-date">18</div>
                        <div class="watch-hands">
                            <div class="watch-hand watch-hand-hour" id="ie-watch-hour"></div>
                            <div class="watch-hand watch-hand-minute" id="ie-watch-minute"></div>
                            <div class="watch-hand watch-hand-second" id="ie-watch-second"></div>
                            <div class="watch-center"></div>
                        </div>
                        <div class="watch-crack"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Vitals rows below -->
    <div class="ie-vitals-row">
        <div class="ie-vital-bar ie-vital-health">
            <span class="ie-vital-icon"><i class="fa-solid fa-heart"></i></span>
            <div class="ie-vital-track">
                <div class="ie-vital-fill" id="ie-health-fill" style="width: 100%;"></div>
            </div>
            <span class="ie-vital-value" id="ie-health-value">13</span>
        </div>
        <div class="ie-vital-bar ie-vital-morale">
            <span class="ie-vital-icon"><i class="fa-solid fa-brain"></i></span>
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
    <button class="ie-tab" data-tab="radio" title="Speedfreaks FM">
        <i class="fa-solid fa-radio"></i>
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

const RADIO_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="radio">
    <div class="ie-section ie-radio-section">
        <div class="ie-section-header"><span>Speedfreaks FM</span></div>
        
        <!-- Radio Component -->
        <div class="tribunal-radio radio-compact" id="ie-radio">
            <div class="radio-antenna"></div>
            
            <div class="radio-body">
                <div class="radio-display">
                    <div class="radio-display-header">
                        <span class="radio-label-fm">FM</span>
                        <span class="radio-label-brand">ULTRA POWER</span>
                        <span class="radio-label-am">AM</span>
                    </div>
                    
                    <div class="radio-dial">
                        <div class="radio-dial-markers">
                            <span class="radio-dial-marker">88</span>
                            <span class="radio-dial-marker">92</span>
                            <span class="radio-dial-marker">98</span>
                            <span class="radio-dial-marker">104</span>
                            <span class="radio-dial-marker">108</span>
                        </div>
                        <div class="radio-needle" id="ie-radio-needle" style="left: 50%;"></div>
                        <div class="radio-station-display" id="ie-radio-station">98.3 — SPEEDFREAKS</div>
                    </div>
                    
                    <div class="radio-scale">
                        <span>LOG</span>
                        <span>• 1 • 2 • 3 • 5 • 7 • 9 • 11 •</span>
                        <span>SCALE</span>
                    </div>
                </div>
                
                <div class="radio-controls">
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(-30deg);"></div></div>
                        <span class="radio-knob-label">FM</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator"></div></div>
                        <span class="radio-knob-label">AFC</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(45deg);"></div></div>
                        <span class="radio-knob-label">VOL</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator"></div></div>
                        <span class="radio-knob-label">TUNE</span>
                    </div>
                </div>
                
                <div class="radio-speaker">
                    <div class="radio-visualizer" id="ie-radio-viz">
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                    </div>
                </div>
                
                <div class="radio-bottom">
                    <div class="radio-on-air">
                        <div class="radio-on-air-light"></div>
                        <span class="radio-on-air-text">ON AIR</span>
                    </div>
                    <span class="radio-brand">SHAUN</span>
                </div>
            </div>
        </div>
        
        <button class="ie-btn ie-btn-primary ie-radio-play-btn" id="ie-radio-play">
            <i class="fa-solid fa-play"></i>
            <span>PLAY</span>
        </button>
        
        <div class="radio-station-list" id="ie-station-list">
            <div class="radio-station-item" data-station="0">
                <span class="radio-station-item-freq">87.5</span>
                <span class="radio-station-item-name">STATIC</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
            <div class="radio-station-item" data-station="1">
                <span class="radio-station-item-freq">92.3</span>
                <span class="radio-station-item-name">WHIRLING</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
            <div class="radio-station-item active" data-station="2">
                <span class="radio-station-item-freq">98.3</span>
                <span class="radio-station-item-name">SPEEDFREAKS</span>
                <span class="radio-station-item-type">music</span>
            </div>
            <div class="radio-station-item" data-station="3">
                <span class="radio-station-item-freq">103.7</span>
                <span class="radio-station-item-name">REVACHOL</span>
                <span class="radio-station-item-type">music</span>
            </div>
            <div class="radio-station-item" data-station="4">
                <span class="radio-station-item-freq">108.0</span>
                <span class="radio-station-item-name">DOLORES DEI</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
        </div>
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
// WATCH FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════

let watchMode = 'real';
let watchInterval = null;
let rpTime = { hours: 14, minutes: 30 };
let rpWeather = 'rainy';

const WEATHER_ICONS = {
    'clear-day': 'fa-sun',
    'clear-night': 'fa-moon',
    'cloudy': 'fa-cloud',
    'rainy': 'fa-cloud-rain',
    'stormy': 'fa-cloud-bolt',
    'snowy': 'fa-snowflake',
    'foggy': 'fa-smog'
};

function updateWatch() {
    const hourHand = document.getElementById('ie-watch-hour');
    const minuteHand = document.getElementById('ie-watch-minute');
    const secondHand = document.getElementById('ie-watch-second');
    const dateEl = document.getElementById('ie-watch-date');
    const weatherEl = document.getElementById('ie-watch-weather');
    const weatherIcon = document.getElementById('ie-watch-weather-icon');
    
    if (!hourHand) return;
    
    let hours, minutes, seconds, day, weather;
    
    if (watchMode === 'real') {
        const now = new Date();
        hours = now.getHours() % 12;
        minutes = now.getMinutes();
        seconds = now.getSeconds();
        day = now.getDate();
        weather = getRealWeather();
    } else {
        hours = rpTime.hours % 12;
        minutes = rpTime.minutes;
        seconds = 0;
        day = '??';
        weather = rpWeather;
    }
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    const secondDeg = seconds * 6;
    
    hourHand.style.transform = `rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;
    if (dateEl) dateEl.textContent = day;
    
    if (weatherEl && weatherIcon) {
        weatherEl.className = 'watch-weather ' + weather;
        weatherIcon.className = 'fa-solid ' + (WEATHER_ICONS[weather] || 'fa-cloud');
    }
}

function getRealWeather() {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 20) ? 'clear-day' : 'clear-night';
}

function toggleWatchMode() {
    const watchEl = document.getElementById('ie-header-watch');
    if (!watchEl) return;
    
    watchMode = (watchMode === 'real') ? 'rp' : 'real';
    watchEl.classList.toggle('real-mode', watchMode === 'real');
    watchEl.classList.toggle('rp-mode', watchMode === 'rp');
    updateWatch();
}

function startWatch() {
    updateWatch();
    watchInterval = setInterval(updateWatch, 1000);
}

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
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
            ${RADIO_TAB_HTML}
            ${SETTINGS_TAB_HTML}
            ${PROFILES_TAB_HTML}
        </div>
        ${BOTTOM_BUTTONS_HTML}
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION
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
        if (hasMoved) fab.dataset.justDragged = 'true';
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
    panel.classList.toggle('ie-panel-open', !isOpen);
    fab?.classList.toggle('ie-fab-active', !isOpen);
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabName) {
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
        btn.classList.toggle('ie-bottom-btn-active', btn.dataset.panel === tabName)
    );

    document.querySelectorAll('.ie-tab-content').forEach(content =>
        content.classList.toggle('ie-tab-content-active', content.dataset.tabContent === tabName)
    );

    if (tabName === 'settings' || tabName === 'profiles') {
        document.querySelectorAll('.ie-tab').forEach(tab => tab.classList.remove('ie-tab-active'));
    }

    const mainTabs = ['voices', 'cabinet', 'status', 'ledger', 'radio'];
    if (mainTabs.includes(tabName)) {
        document.querySelectorAll('.ie-bottom-btn').forEach(btn => btn.classList.remove('ie-bottom-btn-active'));
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

    // Close button (now the folder)
    document.querySelector('.ie-btn-close-panel')?.addEventListener('click', togglePanel);

    // Tab switching
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Bottom buttons
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });

    // Watch toggle
    document.getElementById('ie-header-watch')?.addEventListener('click', toggleWatchMode);

    // Manual trigger
    document.getElementById('ie-manual-trigger')?.addEventListener('click', () => {
        console.log('[The Tribunal] Manual trigger clicked');
        if (typeof toastr !== 'undefined') toastr.info('Voice trigger (not implemented yet)');
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('inland-empire-panel');
            if (panel?.classList.contains('ie-panel-open')) togglePanel();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log('[The Tribunal] Initializing UI shell v0.1.8...');

    const panel = createPsychePanel();
    const fab = createToggleFAB();

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    bindEvents();
    startWatch();

    console.log('[The Tribunal] UI shell ready!');
    if (typeof toastr !== 'undefined') toastr.success('The Tribunal loaded!', 'Extension', { timeOut: 2000 });
}

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    try {
        init();
    } catch (error) {
        console.error('[The Tribunal] Failed to initialize:', error);
        if (typeof toastr !== 'undefined') toastr.error(`Init failed: ${error.message}`, 'The Tribunal');
    }
});
