/**
 * Inland Empire - Psyche Panel
 * Main panel structure and tab switching
 */

import { extensionSettings, saveState } from '../core/state.js';

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
        <div class="ie-panel-header">
            <div class="ie-panel-title">
                <i class="fa-solid fa-address-card"></i>
                <span>Psyche</span>
            </div>
            <div class="ie-panel-controls">
                <button class="ie-btn ie-btn-close-panel" title="Close">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        </div>

        <div class="ie-tabs">
            <button class="ie-tab ie-tab-active" data-tab="skills" title="Skills">
                <i class="fa-solid fa-chart-bar"></i>
            </button>
            <button class="ie-tab" data-tab="cabinet" title="Thought Cabinet">
                <i class="fa-solid fa-box-archive"></i>
            </button>
            <button class="ie-tab" data-tab="status" title="Status">
                <i class="fa-solid fa-heart-pulse"></i>
            </button>
            <button class="ie-tab" data-tab="settings" title="Settings">
                <i class="fa-solid fa-gear"></i>
            </button>
            <button class="ie-tab" data-tab="profiles" title="Profiles">
                <i class="fa-solid fa-user-circle"></i>
            </button>
        </div>

        <div class="ie-panel-content">
            <!-- Skills Tab -->
            <div class="ie-tab-content ie-tab-content-active" data-tab-content="skills">
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
                        <div class="ie-ancient-voice-item">
                            <span class="ie-ancient-icon">🦎</span>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Ancient Reptilian Brain</span>
                                <span class="ie-ancient-triggers">Triggers: The Pale</span>
                            </div>
                        </div>
                        <div class="ie-ancient-voice-item">
                            <span class="ie-ancient-icon">❤️‍🔥</span>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Limbic System</span>
                                <span class="ie-ancient-triggers">Triggers: The Pale</span>
                            </div>
                        </div>
                        <div class="ie-ancient-voice-item ie-ancient-voice-combo">
                            <span class="ie-ancient-icon">🦴</span>
                            <div class="ie-ancient-details">
                                <span class="ie-ancient-name">Spinal Cord</span>
                                <span class="ie-ancient-triggers">Triggers: Tequila Sunset + Revacholian Courage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Tab -->
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

            <!-- Profiles Tab -->
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

export function switchTab(tabName, callbacks = {}) {
    document.querySelectorAll('.ie-tab').forEach(tab =>
        tab.classList.toggle('ie-tab-active', tab.dataset.tab === tabName)
    );

    document.querySelectorAll('.ie-tab-content').forEach(content =>
        content.classList.toggle('ie-tab-content-active', content.dataset.tabContent === tabName)
    );

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
}
