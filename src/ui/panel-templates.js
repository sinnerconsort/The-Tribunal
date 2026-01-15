/**
 * The Tribunal - Panel HTML Templates
 * All HTML template strings for the panel UI
 * 
 * Split from panel.js for maintainability
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

export const HANGMAN_SVG = `
<svg viewBox="0 0 50 65" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="60" x2="35" y2="60"/>
    <line x1="12" y1="60" x2="12" y2="8"/>
    <line x1="12" y1="8" x2="32" y2="8"/>
    <line x1="32" y1="8" x2="32" y2="18"/>
    <circle cx="32" cy="23" r="5"/>
    <line x1="32" y1="28" x2="32" y2="42"/>
    <line x1="32" y1="32" x2="24" y2="38"/>
    <line x1="32" y1="32" x2="40" y2="38"/>
    <line x1="32" y1="42" x2="25" y2="52"/>
    <line x1="32" y1="42" x2="39" y2="52"/>
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
<div class="ie-tab-content" data-tab-content="cabinet" id="ie-cabinet-content"></div>`;

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
</div>`;

// ═══════════════════════════════════════════════════════════════
// LEDGER TAB TEMPLATE (UPGRADED with Sub-Tabs)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="ledger">
    
    <!-- Sub-Tab Navigation -->
    <div class="ledger-sub-tabs">
        <button class="ledger-sub-tab active" data-subtab="cases">Cases</button>
        <button class="ledger-sub-tab" data-subtab="map">Map</button>
        <button class="ledger-sub-tab ledger-tab-secret" data-subtab="compartment" id="ie-secret-tab">???</button>
        <div class="ledger-crack-overlay">
            <div class="ledger-crack-line" id="ie-compartment-crack"></div>
        </div>
    </div>
    
    <!-- CASES SUB-TAB -->
    <div class="ledger-sub-content ledger-paper cases-tab active" data-subtab-content="cases">
        <div class="ledger-coffee-stain"></div>
        
        <div class="ledger-section-header">Active Cases</div>
        <div id="ie-active-cases-list">
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-folder-open"></i>
                <span>No active cases</span>
            </div>
        </div>
        
        <div class="ledger-section-header" style="margin-top: 16px;">Closed Cases</div>
        <div id="ie-completed-cases-list">
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-folder"></i>
                <span>No closed cases</span>
            </div>
        </div>
        
        <button class="ie-btn ie-btn-sm" id="ie-add-case-btn" style="margin-top: 12px;">
            <i class="fa-solid fa-plus"></i>
            <span>Open New Case</span>
        </button>
    </div>
    
    <!-- MAP SUB-TAB -->
    <div class="ledger-sub-content ledger-paper map-tab" data-subtab-content="map">
        <div class="ledger-hangman-doodle">
            ${HANGMAN_SVG}
        </div>
        
        <div class="ledger-section-header">Weather</div>
        <div class="ie-weather-display" id="ie-weather-display">
            <div class="ie-weather-current">
                <i class="fa-solid fa-cloud-sun"></i>
                <div>
                    <div class="ie-weather-condition">Conditions Unknown</div>
                    <div class="ie-weather-flavor">"The sky offers no comment."</div>
                </div>
            </div>
        </div>
        
        <div class="ledger-section-header" style="margin-top: 16px;">Points of Interest</div>
        <div id="ie-poi-list">
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-map-pin"></i>
                <span>No locations recorded</span>
            </div>
        </div>
        
        <div class="ledger-section-header" style="margin-top: 16px;">Notes</div>
        <textarea class="ie-textarea" id="ie-ledger-notes" rows="4" 
                  placeholder="Write your notes here..."></textarea>
    </div>
    
    <!-- SECRET COMPARTMENT SUB-TAB -->
    <div class="ledger-sub-content ledger-compartment" data-subtab-content="compartment">
        <span class="ledger-apricot-scent">~ apricot ~</span>
        
        <!-- RCM ID Badge -->
        <div class="rcm-badge-card" id="ie-rcm-badge">
            <div class="rcm-badge-header">
                <div class="rcm-badge-photo" id="ie-badge-photo">
                    <i class="fa-solid fa-user"></i>
                </div>
                <div class="rcm-badge-info">
                    <div class="rcm-badge-org">RCM • Revachol Citizens Militia</div>
                    <div class="rcm-badge-name" id="ie-badge-name">NAME UNKNOWN</div>
                    <div class="rcm-badge-rank" id="ie-badge-rank">RANK UNKNOWN</div>
                    <div class="rcm-badge-numbers">
                        <div class="rcm-badge-field">
                            <span class="rcm-badge-field-label">Badge</span>
                            <span class="rcm-badge-field-value" id="ie-badge-id">LTN-????</span>
                        </div>
                        <div class="rcm-badge-field">
                            <span class="rcm-badge-field-label">Reg</span>
                            <span class="rcm-badge-field-value" id="ie-badge-reg">REV??-??-??-???</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rcm-badge-stats">
                <div class="rcm-badge-stats-title">Copotype Scores</div>
                <div id="ie-copotype-stats">
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Superstar Cop</span>
                        <span class="rcm-badge-stat-value">0</span>
                    </div>
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Sorry Cop</span>
                        <span class="rcm-badge-stat-value">0</span>
                    </div>
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Hobocop</span>
                        <span class="rcm-badge-stat-value">0</span>
                    </div>
                </div>
                
                <div class="rcm-badge-stats-title">Perforations</div>
                <div id="ie-perforation-stats">
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Sessions</span>
                        <span class="rcm-badge-stat-value" id="ie-stat-sessions">0</span>
                    </div>
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Voices Heard</span>
                        <span class="rcm-badge-stat-value" id="ie-stat-voices">0</span>
                    </div>
                    <div class="rcm-badge-stat-row">
                        <span class="rcm-badge-stat-label">Critical Failures</span>
                        <span class="rcm-badge-stat-value" id="ie-stat-critfails">0</span>
                    </div>
                </div>
                
                <div class="rcm-badge-perforations" id="ie-perforation-dots">
                    ○○○○○○○○○○ (0)
                </div>
            </div>
        </div>
        
        <!-- Fortune Section -->
        <div style="text-align: center; margin-top: 16px;">
            <button class="ie-btn ie-btn-sm" id="ie-draw-fortune-btn">
                <i class="fa-solid fa-hand-holding"></i>
                <span>Reach Inside</span>
            </button>
        </div>
        
        <div class="ledger-fortune-wrapper" id="ie-fortune-display" style="display: none;">
            <div class="ledger-fortune-title">～ APRICOT PROPHECY ～</div>
            <div class="ledger-fortune-text" id="ie-fortune-text"></div>
            <div class="ledger-fortune-source" id="ie-fortune-source"></div>
        </div>
    </div>
    
</div>`;

// ═══════════════════════════════════════════════════════════════
// INVENTORY TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const INVENTORY_TAB_HTML = `
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
</div>`;

// ═══════════════════════════════════════════════════════════════
// SETTINGS TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const SETTINGS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="settings">
    <div class="ie-section">
        <div class="ie-section-header"><span>// CONNECTION</span></div>
        <div class="ie-form-group">
            <label>Connection Profile</label>
            <select id="ie-connection-profile" class="ie-select">
                <option value="current">Use Current ST Profile</option>
            </select>
            <small class="ie-form-hint">Select a ST connection profile for voice generation. Create a cheap API profile in ST's Connection Manager.</small>
        </div>
        <div class="ie-form-row">
            <div class="ie-form-group">
                <label>Temperature</label>
                <input type="number" id="ie-temperature" min="0" max="2" step="0.1" value="0.8" />
            </div>
            <div class="ie-form-group">
                <label>Max Tokens</label>
                <input type="number" id="ie-max-tokens" min="50" max="1000" value="600" />
            </div>
        </div>
        <button class="ie-btn ie-btn-test-api" id="ie-test-api-btn">
            <i class="fa-solid fa-plug"></i>
            <span>Test Connection</span>
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
        <div class="ie-section-header"><span>Actions</span></div>
        <button class="ie-btn ie-btn-primary ie-btn-save-settings" style="width: 100%;">
            <i class="fa-solid fa-save"></i>
            <span>Save Settings</span>
        </button>
        <button class="ie-btn ie-btn-reset-fab" style="width: 100%; margin-top: 8px;">
            <i class="fa-solid fa-arrows-to-dot"></i>
            <span>Reset Icon Positions</span>
        </button>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// PROFILES TAB TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const PROFILES_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="profiles">
    <div class="ie-section">
        <div class="ie-section-header"><span>Persona Profiles</span></div>
        <div class="ie-profiles-list" id="ie-profiles-list"></div>
    </div>

    <div class="ie-section">
        <div class="ie-section-header"><span>// CHARACTER CONTEXT</span></div>
        
        <div class="ie-form-group">
            <label>POV Style</label>
            <select id="ie-pov-style" class="ie-select">
                <option value="second">Second Person (you/your)</option>
                <option value="third">Third Person (name/pronouns)</option>
                <option value="first">First Person (I/me/my)</option>
            </select>
        </div>
        
        <div class="ie-form-group">
            <label>Character Name</label>
            <input type="text" id="ie-char-name" placeholder="e.g. Harry Du Bois" />
            <small class="ie-form-hint">Name used when voices address the player</small>
        </div>
        
        <div class="ie-form-group">
            <label>Pronouns</label>
            <select id="ie-pronouns" class="ie-select">
                <option value="they">They/Them</option>
                <option value="she">She/Her</option>
                <option value="he">He/Him</option>
                <option value="it">It/Its</option>
            </select>
        </div>
        
        <div class="ie-form-group">
            <label>Character Context</label>
            <textarea id="ie-char-context" class="ie-textarea" rows="3" 
                placeholder="Describe who YOU are (the character whose head these voices are in). Example: 'Harry Du Bois, amnesiac detective. Kim Kitsuragi is my partner.'"></textarea>
            <small class="ie-form-hint">Who is "you" - the character whose head these voices are in.</small>
        </div>
        
        <div class="ie-form-group">
            <label>Scene Perspective Notes</label>
            <textarea id="ie-scene-notes" class="ie-textarea" rows="3"
                placeholder="e.g. 'Scene is written from Kim's external POV watching Harry. Harry = you/your. Kim = he/him.'"></textarea>
            <small class="ie-form-hint">Help voices convert third-person scene text to correct POV.</small>
        </div>
        
        <div class="ie-form-group">
            <label class="ie-checkbox">
                <input type="checkbox" id="ie-include-persona" checked />
                <span>Include character persona in prompts</span>
            </label>
        </div>
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
</div>`;

// ═══════════════════════════════════════════════════════════════
// BOTTOM BUTTONS TEMPLATE (uses DISCO_BALL_SVG)
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
