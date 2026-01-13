/**
 * The Tribunal - Psyche Panel
 * Main panel structure and tab switching
 * Phase 1 Restructure: Header + Vitals, New Tabs, Bottom Buttons
 */

import { extensionSettings, saveState } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// DISCO BALL SVG ICON
// ═══════════════════════════════════════════════════════════════

const DISCO_BALL_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <ellipse cx="12" cy="12" rx="8" ry="3"/>
    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(120 12 12)"/>
    <line x1="12" y1="4" x2="12" y2="1"/>
    <line x1="10" y1="1" x2="14" y2="1"/>
</svg>`;

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
// ═══════════════════════════════════════════════════════════════

export function createPsychePanel() {
    const panel = document.createElement('div');
    panel.id = 'inland-empire-panel';
    panel.className = 'inland-empire-panel';

    panel.innerHTML = `
        <div class="ie-right-ruler"></div>
        <div class="ie-film-bottom-text"></div>
        <span class="ie-panel-marker ie-panel-marker-top">01A15</span>
        <span class="ie-panel-marker ie-panel-marker-mid">01A13</span>
        <span class="ie-panel-marker-right">FELD  ▼  DEVICE</span>
        
        <!-- Header with Case File Title + Vitals -->
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
                    <span class="ie-vital-value" id="ie-health-value">100</span>
                </div>
                <div class="ie-vital-bar ie-vital-morale">
                    <span class="ie-vital-label">Morale</span>
                    <div class="ie-vital-track">
                        <div class="ie-vital-fill" id="ie-morale-fill" style="width: 100%;"></div>
                    </div>
                    <span class="ie-vital-value" id="ie-morale-value">100</span>
                </div>
            </div>
        </div>

        <!-- Main Tabs: Voices, Cabinet, Status, Ledger, Inventory -->
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
            <button class="ie-tab" data-tab="inventory" title="Inventory">
                <i class="fa-solid fa-briefcase"></i>
            </button>
        </div>

        <div class="ie-panel-content">
            <!-- Voices Tab (formerly Skills) -->
            <div class="ie-tab-content ie-tab-content-active" data-tab-content="voices">
                <div class="ie-section ie-skills-overview">
                    <div class="ie-section-header"><span>Attributes</span></div>
                    <div class="ie-attributes-grid" id="ie-attributes-display"></div>
                </div>
                <div class="ie-section ie-voices-section">
                    <div class="ie-section-header">
                        <span>Inner Voices</span>
                        <button class="ie-btn ie-btn-sm ie-btn-clear-voices" title="Clear">
                            <i class="fa-solid fa-eraser"></i>
                        </button>
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
            </div>

            <!-- Cabinet Tab -->
            <div class="ie-tab-content" data-tab-content="cabinet" id="ie-cabinet-content"></div>

            <!-- Status Tab -->
            <div class="ie-tab-content" data-tab-content="status">
                <div class="ie-section">
                    <div class="ie-section-header"><span>Vitals Detail</span></div>
                    <div class="ie-vitals-detail">
                        <div class="ie-vital-detail-row ie-health">
                            <div class="ie-vital-detail-header">
                                <span class="ie-vital-detail-label">Health</span>
                                <span class="ie-vital-detail-value" id="ie-health-detail-value">100 / 100</span>
                            </div>
                            <div class="ie-vital-detail-track">
                                <div class="ie-vital-detail-fill" id="ie-health-detail-fill" style="width: 100%; background: #f3650b;"></div>
                            </div>
                        </div>
                        <div class="ie-vital-detail-row ie-morale">
                            <div class="ie-vital-detail-header">
                                <span class="ie-vital-detail-label">Morale</span>
                                <span class="ie-vital-detail-value" id="ie-morale-detail-value">100 / 100</span>
                            </div>
                            <div class="ie-vital-detail-track">
                                <div class="ie-vital-detail-fill" id="ie-morale-detail-fill" style="width: 100%; background: #0e7989;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Active Effects</span></div>
                    <div class="ie-active-effects-summary" id="ie-active-effects-summary">
                        <em>No active status effects</em>
                    </div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Toggle Status Effects</span></div>
                    <div id="ie-status-grid"></div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Ancient Voices</span></div>
                    <div class="ie-ancient-voices-info" id="ie-ancient-voices-info">
                        <div class="ie-ancient-voice-pill">
                            <i class="ie-ancient-icon fa-solid fa-dragon"></i>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Ancient Reptilian Brain</span>
                                <span class="ie-ancient-triggers">Triggers: The Pale</span>
                            </div>
                        </div>
                        <div class="ie-ancient-voice-pill">
                            <i class="ie-ancient-icon fa-solid fa-brain"></i>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Limbic System</span>
                                <span class="ie-ancient-triggers">Triggers: The Pale</span>
                            </div>
                        </div>
                        <div class="ie-ancient-voice-pill ie-ancient-voice-combo">
                            <i class="ie-ancient-icon fa-solid fa-bone"></i>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Spinal Cord</span>
                                <span class="ie-ancient-triggers">Triggers: Tequila Sunset + Revacholian Courage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ledger Tab (NEW) -->
            <div class="ie-tab-content" data-tab-content="ledger">
                <div class="ie-section">
                    <div class="ie-section-header"><span>Active Cases</span></div>
                    <div class="ie-ledger-empty" id="ie-active-cases">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>No active cases</span>
                    </div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Case Notes</span></div>
                    <div class="ie-ledger-empty" id="ie-case-notes">
                        <i class="fa-solid fa-note-sticky"></i>
                        <span>No notes recorded</span>
                    </div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Weather</span></div>
                    <div class="ie-weather-display" id="ie-weather-display">
                        <div class="ie-weather-current">
                            <i class="fa-solid fa-cloud-sun"></i>
                            <span>Conditions unknown</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inventory Tab (NEW) -->
            <div class="ie-tab-content" data-tab-content="inventory">
                <div class="ie-section">
                    <div class="ie-section-header">
                        <span>Carried Items</span>
                        <span class="ie-section-count" id="ie-carried-count">0</span>
                    </div>
                    <div class="ie-inventory-grid" id="ie-carried-items">
                        <div class="ie-inventory-empty">
                            <i class="fa-solid fa-hand-holding"></i>
                            <span>Nothing in hand</span>
                        </div>
                    </div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header">
                        <span>Worn / Equipped</span>
                        <span class="ie-section-count" id="ie-worn-count">0</span>
                    </div>
                    <div class="ie-inventory-grid" id="ie-worn-items">
                        <div class="ie-inventory-empty">
                            <i class="fa-solid fa-shirt"></i>
                            <span>Nothing equipped</span>
                        </div>
                    </div>
                </div>
                <div class="ie-section ie-money-section">
                    <div class="ie-section-header"><span>Currency</span></div>
                    <div class="ie-money-display">
                        <span class="ie-money-amount" id="ie-money-amount">0</span>
                        <span class="ie-money-unit">Réal</span>
                    </div>
                </div>
            </div>

            <!-- Settings Panel (accessed via bottom button) -->
            <div class="ie-tab-content" data-tab-content="settings">
                <div class="ie-section">
                    <div class="ie-section-header"><span>API Configuration</span></div>
                    <div class="ie-form-group">
                        <label>API Endpoint</label>
                        <input type="text" id="ie-api-endpoint" placeholder="https://api.example.com/v1" />
                    </div>
                    <div class="ie-form-group">
                        <label>API Key</label>
                        <input type="password" id="ie-api-key" placeholder="Your API key" />
                    </div>
                    <div class="ie-form-group">
                        <label>Model</label>
                        <input type="text" id="ie-model" placeholder="glm-4-plus" />
                    </div>
                    <div class="ie-form-row">
                        <div class="ie-form-group">
                            <label>Temperature</label>
                            <input type="number" id="ie-temperature" min="0" max="2" step="0.1" value="0.9" />
                        </div>
                        <div class="ie-form-group">
                            <label>Max Tokens</label>
                            <input type="number" id="ie-max-tokens" min="50" max="1000" value="300" />
                        </div>
                    </div>
                    <button class="ie-btn ie-btn-test-api" id="ie-test-api-btn">
                        <i class="fa-solid fa-plug"></i>
                        <span>Test API Connection</span>
                    </button>
                </div>

                <div class="ie-section">
                    <div class="ie-section-header"><span>Voice Behavior</span></div>
                    <div class="ie-form-row">
                        <div class="ie-form-group">
                            <label>Min Voices</label>
                            <input type="number" id="ie-min-voices" min="0" max="6" value="1" />
                        </div>
                        <div class="ie-form-group">
                            <label>Max Voices</label>
                            <input type="number" id="ie-max-voices" min="1" max="10" value="4" />
                        </div>
                    </div>
                    <div class="ie-form-group">
                        <label>Trigger Delay (ms)</label>
                        <input type="number" id="ie-trigger-delay" min="0" max="5000" step="100" value="1000" />
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-show-dice-rolls" checked />
                            <span>Show dice roll results</span>
                        </label>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-show-failed-checks" checked />
                            <span>Show failed skill checks</span>
                        </label>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-auto-trigger" checked />
                            <span>Auto-trigger on new messages</span>
                        </label>
                    </div>
                </div>

                <div class="ie-section">
                    <div class="ie-section-header"><span>Investigation Mode</span></div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-investigation-enabled" />
                            <span>Enable Investigation System</span>
                        </label>
                        <small class="ie-form-hint">Track clues, discoveries, and case progress</small>
                    </div>
                </div>

                <div class="ie-section">
                    <div class="ie-section-header"><span>Context & Memory</span></div>
                    <div class="ie-form-group">
                        <label>Context Messages</label>
                        <input type="number" id="ie-context-messages" min="1" max="20" value="5" />
                        <small class="ie-form-hint">How many recent messages to include for voice context</small>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-include-thoughts" checked />
                            <span>Include thought cabinet in context</span>
                        </label>
                    </div>
                </div>

                <div class="ie-section">
                    <div class="ie-section-header"><span>Character Integration</span></div>
                    <div class="ie-form-group">
                        <label>Player Name Override</label>
                        <input type="text" id="ie-player-name" placeholder="Leave empty to use ST persona" />
                        <small class="ie-form-hint">Name used when voices address the player</small>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-use-char-persona" checked />
                            <span>Include character persona in prompts</span>
                        </label>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-second-person" />
                            <span>Second-person narration mode</span>
                        </label>
                        <small class="ie-form-hint">Help voices convert third-person scene text to correct POV.</small>
                    </div>
                    <button class="ie-btn ie-btn-primary ie-btn-save-settings" style="width: 100%; margin-top: 10px;">
                        <i class="fa-solid fa-save"></i>
                        <span>Save Settings</span>
                    </button>
                    <button class="ie-btn ie-btn-reset-fab" style="width: 100%; margin-top: 8px;">
                        <i class="fa-solid fa-arrows-to-dot"></i>
                        <span>Reset Icon Positions</span>
                    </button>
                </div>
            </div>

            <!-- Profiles Panel (accessed via bottom button) -->
            <div class="ie-tab-content" data-tab-content="profiles">
                <div class="ie-section">
                    <div class="ie-section-header"><span>Persona Profiles</span></div>
                    <div class="ie-profiles-list" id="ie-profiles-list"></div>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Save Current as Profile</span></div>
                    <div class="ie-form-group">
                        <label>Profile Name</label>
                        <input type="text" id="ie-new-profile-name" placeholder="e.g. Harry Du Bois" />
                    </div>
                    <button class="ie-btn ie-btn-primary" id="ie-save-profile-btn" style="width: 100%;">
                        <i class="fa-solid fa-save"></i>
                        <span>Save Profile</span>
                    </button>
                </div>
                <div class="ie-section">
                    <div class="ie-section-header"><span>Build Editor</span></div>
                    <div class="ie-build-intro">
                        <div class="ie-points-remaining">Points: <span id="ie-points-remaining">12</span> / 12</div>
                    </div>
                    <div class="ie-attributes-editor" id="ie-attributes-editor"></div>
                    <button class="ie-btn ie-btn-primary ie-btn-apply-build" style="width: 100%; margin-top: 10px;">
                        <i class="fa-solid fa-check"></i>
                        <span>Apply Build</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bottom Buttons: Settings & Profiles -->
        <div class="ie-bottom-buttons">
            <button class="ie-bottom-btn" data-panel="settings" title="Settings">
                <i class="fa-solid fa-gear"></i>
                <span>Settings</span>
            </button>
            <button class="ie-bottom-btn" data-panel="profiles" title="Profiles">
                <span class="ie-disco-ball-icon">${DISCO_BALL_SVG}</span>
                <span>Profiles</span>
            </button>
        </div>
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB CREATION
// ═══════════════════════════════════════════════════════════════

export function createToggleFAB(getContext) {
    const fab = document.createElement('div');
    fab.id = 'inland-empire-fab';
    fab.className = 'ie-fab';
    fab.title = 'Toggle Psyche Panel';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-address-card"></i></span>';
    fab.style.display = 'flex';
    fab.style.top = `${extensionSettings.fabPositionTop ?? 140}px`;
    fab.style.left = `${extensionSettings.fabPositionLeft ?? 10}px`;

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
            extensionSettings.fabPositionTop = fab.offsetTop;
            extensionSettings.fabPositionLeft = fab.offsetLeft;
            if (getContext) saveState(getContext());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

/**
 * Create the Suggestions FAB (lightbulb icon)
 * Hidden by default, toggleable in settings
 */
export function createSuggestionsFAB(getContext) {
    const fab = document.createElement('div');
    fab.id = 'ie-suggestions-fab';
    fab.className = 'ie-fab ie-fab-suggestions';
    fab.title = 'Get Suggestions';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-lightbulb"></i></span>';
    fab.style.display = extensionSettings.showSuggestionsFab ? 'flex' : 'none';
    fab.style.top = `${extensionSettings.suggestionsFabTop ?? 200}px`;
    fab.style.left = `${extensionSettings.suggestionsFabLeft ?? 10}px`;

    // Reuse same drag logic pattern
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
            extensionSettings.suggestionsFabTop = fab.offsetTop;
            extensionSettings.suggestionsFabLeft = fab.offsetLeft;
            if (getContext) saveState(getContext());
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    return fab;
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

export function togglePanel() {
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
        // Trigger peek animation when opening
        triggerFabLoading();
    }
}

/**
 * Trigger the "peek-up" loading animation on the main FAB
 * Call this when voices are being generated
 */
export function triggerFabLoading() {
    const fab = document.getElementById('inland-empire-fab');
    if (!fab) return;
    
    fab.classList.add('ie-fab-loading');
    // Remove after animation completes
    setTimeout(() => {
        fab.classList.remove('ie-fab-loading');
    }, 800);
}

/**
 * Toggle suggestions FAB active state (lightbulb on/off)
 */
export function setSuggestionsFabActive(active) {
    const fab = document.getElementById('ie-suggestions-fab');
    if (!fab) return;
    
    fab.classList.toggle('ie-fab-active', active);
    const icon = fab.querySelector('i');
    if (icon) {
        icon.className = active ? 'fa-solid fa-lightbulb' : 'fa-regular fa-lightbulb';
    }
}

/**
 * Show/hide the suggestions FAB
 */
export function setSuggestionsFabVisible(visible) {
    const fab = document.getElementById('ie-suggestions-fab');
    if (fab) {
        fab.style.display = visible ? 'flex' : 'none';
    }
}

export function switchTab(tabName, callbacks = {}) {
    // Handle main tabs
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    // Handle bottom buttons (settings/profiles)
    document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
        btn.classList.toggle('ie-bottom-btn-active', btn.dataset.panel === tabName)
    );

    // Show/hide tab content
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
    const mainTabs = ['voices', 'cabinet', 'status', 'ledger', 'inventory'];
    if (mainTabs.includes(tabName)) {
        document.querySelectorAll('.ie-bottom-btn').forEach(btn =>
            btn.classList.remove('ie-bottom-btn-active')
        );
    }

    // Tab-specific callbacks
    if (tabName === 'profiles' && callbacks.onProfiles) {
        callbacks.onProfiles();
    }
    if (tabName === 'settings' && callbacks.onSettings) {
        callbacks.onSettings();
    }
    if (tabName === 'status' && callbacks.onStatus) {
        callbacks.onStatus();
    }
    if (tabName === 'cabinet' && callbacks.onCabinet) {
        callbacks.onCabinet();
    }
    if (tabName === 'voices' && callbacks.onVoices) {
        callbacks.onVoices();
    }
    if (tabName === 'ledger' && callbacks.onLedger) {
        callbacks.onLedger();
    }
    if (tabName === 'inventory' && callbacks.onInventory) {
        callbacks.onInventory();
    }
}

// ═══════════════════════════════════════════════════════════════
// VITALS HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Update health display in header and status tab
 * @param {number} current - Current health value (0-100)
 * @param {number} max - Max health value (default 100)
 */
export function updateHealth(current, max = 100) {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    
    // Header bar
    const headerFill = document.getElementById('ie-health-fill');
    const headerValue = document.getElementById('ie-health-value');
    const headerBar = headerFill?.closest('.ie-vital-bar');
    
    if (headerFill) headerFill.style.width = `${percent}%`;
    if (headerValue) headerValue.textContent = Math.round(current);
    
    // Add low/critical state classes
    if (headerBar) {
        headerBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            headerBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            headerBar.classList.add('ie-vital-low');
        }
    }
    
    // Status tab detail
    const detailFill = document.getElementById('ie-health-detail-fill');
    const detailValue = document.getElementById('ie-health-detail-value');
    const detailBar = detailFill?.closest('.ie-vital-bar');
    
    if (detailFill) detailFill.style.width = `${percent}%`;
    if (detailValue) detailValue.textContent = `${Math.round(current)} / ${max}`;
    
    if (detailBar) {
        detailBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            detailBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            detailBar.classList.add('ie-vital-low');
        }
    }
}

/**
 * Update morale display in header and status tab
 * @param {number} current - Current morale value (0-100)
 * @param {number} max - Max morale value (default 100)
 */
export function updateMorale(current, max = 100) {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    
    // Header bar
    const headerFill = document.getElementById('ie-morale-fill');
    const headerValue = document.getElementById('ie-morale-value');
    const headerBar = headerFill?.closest('.ie-vital-bar');
    
    if (headerFill) headerFill.style.width = `${percent}%`;
    if (headerValue) headerValue.textContent = Math.round(current);
    
    // Add low/critical state classes
    if (headerBar) {
        headerBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            headerBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            headerBar.classList.add('ie-vital-low');
        }
    }
    
    // Status tab detail
    const detailFill = document.getElementById('ie-morale-detail-fill');
    const detailValue = document.getElementById('ie-morale-detail-value');
    const detailBar = detailFill?.closest('.ie-vital-bar');
    
    if (detailFill) detailFill.style.width = `${percent}%`;
    if (detailValue) detailValue.textContent = `${Math.round(current)} / ${max}`;
    
    if (detailBar) {
        detailBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            detailBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            detailBar.classList.add('ie-vital-low');
        }
    }
}

/**
 * Update the case file title in header
 * @param {string} name - Character/persona name
 */
export function updateCaseTitle(name) {
    const titleEl = document.querySelector('.ie-case-title');
    if (titleEl) {
        titleEl.textContent = name ? `CASE FILE: ${name}` : 'CASE FILE';
    }
}

/**
 * Update money display in inventory tab
 * @param {number} amount - Currency amount
 */
export function updateMoney(amount) {
    const moneyEl = document.getElementById('ie-money-amount');
    if (moneyEl) {
        moneyEl.textContent = amount.toLocaleString();
    }
}

/**
 * Update weather display in ledger tab
 * @param {string} icon - FontAwesome icon class (e.g., 'fa-cloud-rain')
 * @param {string} description - Weather description text
 */
export function updateWeather(icon, description) {
    const weatherEl = document.getElementById('ie-weather-display');
    if (weatherEl) {
        weatherEl.innerHTML = `
            <div class="ie-weather-current">
                <i class="fa-solid ${icon}"></i>
                <span>${description}</span>
            </div>
        `;
    }
}
