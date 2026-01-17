/**
 * The Tribunal - Panel HTML Templates
 * All HTML template strings for the panel UI
 */

// ═══════════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════════

export const DISCO_BALL_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <ellipse cx="12" cy="12" rx="8" ry="3"/>
    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(120 12 12)"/>
    <line x1="12" y1="4" x2="12" y2="1"/>
    <line x1="10" y1="1" x2="14" y2="1"/>
</svg>`;

// ═══════════════════════════════════════════════════════════════
// PANEL HEADER TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const PANEL_HEADER_HTML = `
<div class="ie-right-ruler"></div>
<div class="ie-film-bottom-text"></div>
<span class="ie-panel-marker ie-panel-marker-top">01A15</span>
<span class="ie-panel-marker ie-panel-marker-mid">01A13</span>
<span class="ie-panel-marker-right">FELD  ▼  DEVICE</span>

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
</div>`;

// ═══════════════════════════════════════════════════════════════
// TAB BAR TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const TAB_BAR_HTML = `
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
</div>`;

// ═══════════════════════════════════════════════════════════════
// VOICES TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const VOICES_TAB_HTML = `
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
</div>`;

// ═══════════════════════════════════════════════════════════════
// CABINET TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const CABINET_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="cabinet" id="ie-cabinet-content">
    <div class="ie-cabinet-empty">
        <i class="fa-solid fa-box-archive"></i>
        <span>Thought Cabinet is empty</span>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// STATUS TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const STATUS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="status">
    <div class="ie-section">
        <div class="ie-section-header"><span>Vitals Detail</span></div>
        <div class="ie-vitals-detail">
            <div class="ie-vital-detail-row ie-health">
                <div class="ie-vital-detail-header">
                    <span class="ie-vital-detail-label">Health</span>
                    <div class="ie-vital-controls">
                        <button class="ie-vital-btn ie-vital-btn-minus" id="ie-health-minus" title="Decrease Health">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="ie-vital-detail-value" id="ie-health-detail-value">13 / 13</span>
                        <button class="ie-vital-btn ie-vital-btn-plus" id="ie-health-plus" title="Increase Health">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="ie-vital-detail-track">
                    <div class="ie-vital-detail-fill" id="ie-health-detail-fill" style="width: 100%; background: #f3650b;"></div>
                </div>
            </div>
            <div class="ie-vital-detail-row ie-morale">
                <div class="ie-vital-detail-header">
                    <span class="ie-vital-detail-label">Morale</span>
                    <div class="ie-vital-controls">
                        <button class="ie-vital-btn ie-vital-btn-minus" id="ie-morale-minus" title="Decrease Morale">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="ie-vital-detail-value" id="ie-morale-detail-value">13 / 13</span>
                        <button class="ie-vital-btn ie-vital-btn-plus" id="ie-morale-plus" title="Increase Morale">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="ie-vital-detail-track">
                    <div class="ie-vital-detail-fill" id="ie-morale-detail-fill" style="width: 100%; background: #0e7989;"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="ie-section">
        <div class="ie-section-header"><span>Active Effects</span></div>
        <div id="ie-status-grid">
            <em>No active status effects</em>
        </div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// LEDGER TAB TEMPLATE (Simplified)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="ledger">
    <div class="ie-section">
        <div class="ie-section-header"><span>Cases</span></div>
        <div id="ie-cases-list">
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-folder-open"></i>
                <span>No active cases</span>
            </div>
        </div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// INVENTORY TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const INVENTORY_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="inventory">
    <div class="ie-section">
        <div class="ie-section-header"><span>Carried Items</span></div>
        <div class="ie-inventory-grid" id="ie-carried-items">
            <div class="ie-inventory-empty">
                <i class="fa-solid fa-hand-holding"></i>
                <span>Nothing in hand</span>
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
</div>`;

// ═══════════════════════════════════════════════════════════════
// SETTINGS TAB TEMPLATE (Simplified)
// ═══════════════════════════════════════════════════════════════

export const SETTINGS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="settings">
    <div class="ie-section">
        <div class="ie-section-header"><span>// EXTENSION</span></div>
        <div class="ie-form-group">
            <label class="ie-checkbox">
                <input type="checkbox" id="ie-enabled" checked />
                <span>Enable The Tribunal</span>
            </label>
        </div>
        <div class="ie-form-group">
            <label class="ie-checkbox">
                <input type="checkbox" id="ie-auto-trigger" />
                <span>Auto-trigger on new messages</span>
            </label>
        </div>
    </div>
    <div class="ie-section">
        <div class="ie-section-header"><span>// CONNECTION</span></div>
        <div class="ie-form-group">
            <label>Connection Profile</label>
            <select id="ie-connection-profile" class="ie-select">
                <option value="current">Use Current ST Profile</option>
            </select>
        </div>
        <div class="ie-form-group">
            <label>Max Tokens</label>
            <input type="number" id="ie-max-tokens" min="50" max="1000" value="400" />
        </div>
    </div>
    <div class="ie-section">
        <div class="ie-section-header"><span>// ACTIONS</span></div>
        <button class="ie-btn ie-btn-primary ie-btn-save-settings" style="width: 100%;">
            <i class="fa-solid fa-save"></i>
            <span>Save Settings</span>
        </button>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// PROFILES TAB TEMPLATE (Simplified)
// ═══════════════════════════════════════════════════════════════

export const PROFILES_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="profiles">
    <div class="ie-section">
        <div class="ie-section-header"><span>Persona Profiles</span></div>
        <div class="ie-profiles-list" id="ie-profiles-list">
            <em>No profiles saved</em>
        </div>
    </div>
    <div class="ie-section">
        <div class="ie-section-header"><span>Build Editor</span></div>
        <div class="ie-build-intro">
            <div class="ie-points-remaining">Points: <span id="ie-points-remaining">12</span> / 12</div>
        </div>
        <div class="ie-attributes-editor" id="ie-attributes-editor"></div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// BOTTOM BUTTONS TEMPLATE
// ═══════════════════════════════════════════════════════════════

export function getBottomButtonsHTML() {
    return `
<div class="ie-bottom-buttons">
    <button class="ie-bottom-btn" data-panel="settings" title="Settings">
        <i class="fa-solid fa-gear"></i>
        <span>Settings</span>
    </button>
    <button class="ie-bottom-btn" data-panel="profiles" title="Profiles">
        <span class="ie-disco-ball-icon">${DISCO_BALL_SVG}</span>
        <span>Profiles</span>
    </button>
</div>`;
}
