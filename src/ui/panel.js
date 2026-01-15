/**
 * The Tribunal - Psyche Panel
 * Main panel structure and tab switching
 * Phase 1 Restructure: Header + Vitals, New Tabs, Bottom Buttons
 * 
 * UPDATED: Expanded Ledger tab with sub-tabs, clock, paper textures
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
// HANGMAN SVG (for Map tab decoration)
// ═══════════════════════════════════════════════════════════════

const HANGMAN_SVG = `
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
                                <div class="ie-vital-controls">
                                    <button class="ie-vital-btn ie-vital-btn-minus" id="ie-health-minus" title="-1 Health">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                    <span class="ie-vital-detail-value" id="ie-health-detail-value">13 / 13</span>
                                    <button class="ie-vital-btn ie-vital-btn-plus" id="ie-health-plus" title="+1 Health">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="ie-vital-detail-track">
                                <div class="ie-vital-detail-fill" id="ie-health-detail-fill" style="width: 100%;"></div>
                            </div>
                        </div>
                        <div class="ie-vital-detail-row ie-morale">
                            <div class="ie-vital-detail-header">
                                <span class="ie-vital-detail-label">Morale</span>
                                <div class="ie-vital-controls">
                                    <button class="ie-vital-btn ie-vital-btn-minus" id="ie-morale-minus" title="-1 Morale">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                    <span class="ie-vital-detail-value" id="ie-morale-detail-value">13 / 13</span>
                                    <button class="ie-vital-btn ie-vital-btn-plus" id="ie-morale-plus" title="+1 Morale">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="ie-vital-detail-track">
                                <div class="ie-vital-detail-fill" id="ie-morale-detail-fill" style="width: 100%;"></div>
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

            <!-- ═══════════════════════════════════════════════════════════
                 LEDGER TAB (Expanded with Sub-Tabs)
                 ═══════════════════════════════════════════════════════════ -->
            <div class="ie-tab-content" data-tab-content="ledger">
                
                <!-- Ledger Header with Clock -->
                <div class="ledger-header">
                    <span class="ledger-title">Damaged Ledger</span>
                    <div class="ledger-clock" id="ie-ledger-clock">
                        <div class="ledger-clock-face">
                            <div class="ledger-clock-weather" id="ie-clock-weather">
                                <i class="fa-solid fa-sun" id="ie-clock-weather-icon"></i>
                            </div>
                            <div class="ledger-clock-hand ledger-clock-hour" id="ie-clock-hour"></div>
                            <div class="ledger-clock-hand ledger-clock-minute" id="ie-clock-minute"></div>
                            <div class="ledger-clock-center"></div>
                            <div class="ledger-clock-crack"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Sub-Tab Navigation -->
                <div class="ledger-sub-tabs">
                    <button class="ledger-sub-tab active" data-subtab="cases">Cases</button>
                    <button class="ledger-sub-tab" data-subtab="map">Map</button>
                    <button class="ledger-sub-tab ledger-tab-secret" data-subtab="compartment" id="ie-secret-tab">???</button>
                    <div class="ledger-crack-overlay">
                        <div class="ledger-crack-line" id="ie-compartment-crack"></div>
                    </div>
                </div>
                
                <!-- ═══════════════════════════════════════════════════════
                     CASES SUB-TAB
                     ═══════════════════════════════════════════════════════ -->
                <div class="ledger-sub-content ledger-paper cases-tab active" data-subtab-content="cases">
                    <!-- Coffee Stain - Top Right -->
                    <div class="ledger-coffee-stain"></div>
                    
                    <!-- Active Cases Section -->
                    <div class="ledger-section-header">Active Cases</div>
                    <div id="ie-active-cases-list">
                        <div class="ie-ledger-empty">
                            <i class="fa-solid fa-folder-open"></i>
                            <span>No active cases</span>
                        </div>
                    </div>
                    
                    <!-- Completed Cases Section -->
                    <div class="ledger-section-header" style="margin-top: 16px;">Closed Cases</div>
                    <div id="ie-completed-cases-list">
                        <div class="ie-ledger-empty">
                            <i class="fa-solid fa-folder"></i>
                            <span>No closed cases</span>
                        </div>
                    </div>
                    
                    <!-- Add Case Button -->
                    <button class="ie-btn ie-btn-sm" id="ie-add-case-btn" style="margin-top: 12px;">
                        <i class="fa-solid fa-plus"></i>
                        <span>Open New Case</span>
                    </button>
                </div>
                
                <!-- ═══════════════════════════════════════════════════════
                     MAP SUB-TAB
                     ═══════════════════════════════════════════════════════ -->
                <div class="ledger-sub-content ledger-paper map-tab" data-subtab-content="map">
                    <!-- Hangman Doodle - Bottom Left -->
                    <div class="ledger-hangman-doodle">${HANGMAN_SVG}</div>
                    
                    <!-- Weather Section -->
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
                    
                    <!-- Points of Interest Section -->
                    <div class="ledger-section-header" style="margin-top: 16px;">Points of Interest</div>
                    <div id="ie-poi-list">
                        <div class="ie-ledger-empty">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>No locations recorded</span>
                        </div>
                    </div>
                    
                    <!-- Notes Section -->
                    <div class="ledger-section-header" style="margin-top: 16px;">Notes</div>
                    <textarea class="ie-textarea" id="ie-ledger-notes" rows="4" 
                              placeholder="Write your notes here..."></textarea>
                </div>
                
                <!-- ═══════════════════════════════════════════════════════
                     SECRET COMPARTMENT SUB-TAB
                     ═══════════════════════════════════════════════════════ -->
                <div class="ledger-sub-content ledger-compartment" data-subtab-content="compartment">
                    <!-- Apricot Scent -->
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
                        
                        <!-- Officer Stats -->
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
                                <div class="rcm-badge-stat-row">
                                    <span class="rcm-badge-stat-label">Deep Night Sessions</span>
                                    <span class="rcm-badge-stat-value" id="ie-stat-deepnight">0</span>
                                </div>
                            </div>
                            
                            <div class="rcm-badge-perforations" id="ie-perforation-dots">
                                ○○○○○○○○○○ (0)
                            </div>
                        </div>
                        
                        <!-- RCM Logo -->
                        <div class="rcm-badge-logo">
                            <div class="inner"></div>
                        </div>
                    </div>
                    
                    <!-- Fortune Section -->
                    <div style="text-align: center; margin-top: 16px;">
                        <button class="ie-btn ie-btn-sm" id="ie-draw-fortune-btn">
                            <i class="fa-solid fa-hand-holding"></i>
                            <span>Reach Inside</span>
                        </button>
                    </div>
                    
                    <!-- Fortune Display (hidden until drawn) -->
                    <div class="ledger-fortune-wrapper" id="ie-fortune-display" style="display: none;">
                        <div class="ledger-fortune-title">～ APRICOT PROPHECY ～</div>
                        <div class="ledger-fortune-text" id="ie-fortune-text"></div>
                        <div class="ledger-fortune-source" id="ie-fortune-source"></div>
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
                    <div class="ie-section-header"><span>// CONNECTION</span></div>
                    <div class="ie-form-group">
                        <label>Connection Profile</label>
                        <select id="ie-connection-profile" class="ie-select">
                            <option value="current">Use Current ST Profile</option>
                            <!-- Populated dynamically -->
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
                    <div class="ie-section-header"><span>Display</span></div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-inject-voices" checked />
                            <span>Display voices in chat</span>
                        </label>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-show-toasts" checked />
                            <span>Show toast notifications</span>
                        </label>
                    </div>
                    <div class="ie-form-group">
                        <label class="ie-checkbox">
                            <input type="checkbox" id="ie-compact-mode" />
                            <span>Compact mode</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Profiles Panel (accessed via bottom button) -->
            <div class="ie-tab-content" data-tab-content="profiles">
                <div class="ie-section">
                    <div class="ie-section-header"><span>Character Build</span></div>
                    <div class="ie-form-group">
                        <label>Profile Name</label>
                        <input type="text" id="ie-profile-name" placeholder="Enter profile name..." />
                    </div>
                    <div class="ie-attributes-grid ie-build-grid" id="ie-build-attributes"></div>
                    <div class="ie-form-row" style="margin-top: 12px;">
                        <button class="ie-btn ie-btn-sm" id="ie-save-profile">
                            <i class="fa-solid fa-save"></i>
                            <span>Save</span>
                        </button>
                        <button class="ie-btn ie-btn-sm" id="ie-reset-build">
                            <i class="fa-solid fa-undo"></i>
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                <div class="ie-section">
                    <div class="ie-section-header"><span>Saved Profiles</span></div>
                    <div id="ie-saved-profiles">
                        <div class="ie-profiles-empty">
                            <i class="fa-solid fa-user-slash"></i>
                            <span>No saved profiles</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Buttons -->
        <div class="ie-bottom-buttons">
            <button class="ie-btn ie-btn-bottom" data-tab="settings" title="Settings">
                <i class="fa-solid fa-gear"></i>
            </button>
            <button class="ie-btn ie-btn-bottom" data-tab="profiles" title="Profiles">
                <i class="fa-solid fa-user-pen"></i>
            </button>
        </div>
    `;

    return panel;
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize tab switching for the panel
 * @param {Object} callbacks - Optional callbacks for tab-specific initialization
 */
export function initTabSwitching(callbacks = {}) {
    const panel = document.getElementById('inland-empire-panel');
    if (!panel) return;

    // Main tabs
    const mainTabs = panel.querySelectorAll('.ie-tab');
    const bottomTabs = panel.querySelectorAll('.ie-btn-bottom');
    const allTabs = [...mainTabs, ...bottomTabs];
    const tabContents = panel.querySelectorAll('.ie-tab-content');

    allTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchToTab(tabName, allTabs, tabContents, callbacks);
        });
    });

    // Initialize ledger sub-tabs
    initLedgerSubTabs();
    
    // Start ledger clock
    initLedgerClock();
}

function switchToTab(tabName, allTabs, tabContents, callbacks) {
    // Remove active class from all tabs
    allTabs.forEach(t => t.classList.remove('ie-tab-active'));

    // Hide all tab contents
    tabContents.forEach(c => c.classList.remove('ie-tab-content-active'));

    // Find and activate the clicked tab
    const targetTab = [...allTabs].find(t => t.dataset.tab === tabName);
    if (targetTab) {
        targetTab.classList.add('ie-tab-active');
    }

    // Show the corresponding content
    const targetContent = [...tabContents].find(
        c => c.dataset.tabContent === tabName
    );
    if (targetContent) {
        targetContent.classList.add('ie-tab-content-active');
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
// LEDGER SUB-TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize ledger sub-tab switching
 */
export function initLedgerSubTabs() {
    const subTabs = document.querySelectorAll('.ledger-sub-tab');
    const subContents = document.querySelectorAll('.ledger-sub-content');
    
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.subtab;
            
            // Skip if it's the secret tab and not revealed
            if (tab.classList.contains('ledger-tab-secret') && 
                !tab.classList.contains('revealed')) {
                return;
            }
            
            // Remove active from all
            subTabs.forEach(t => t.classList.remove('active'));
            subContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            const content = document.querySelector(`[data-subtab-content="${targetTab}"]`);
            if (content) content.classList.add('active');
        });
    });
}

/**
 * Update the compartment crack visual based on unlock progress
 * @param {number} stage - 0 (hidden), 1, 2, or 3 (revealed)
 */
export function updateCompartmentCrack(stage) {
    const crack = document.getElementById('ie-compartment-crack');
    const tab = document.getElementById('ie-secret-tab');
    
    if (!crack || !tab) return;
    
    // Reset classes
    crack.className = 'ledger-crack-line';
    tab.classList.remove('cracking', 'revealed');
    
    switch (stage) {
        case 1:
            crack.classList.add('stage-1');
            break;
        case 2:
            crack.classList.add('stage-2');
            tab.classList.add('cracking');
            break;
        case 3:
            crack.classList.add('stage-3');
            tab.classList.add('revealed');
            break;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEDGER CLOCK
// ═══════════════════════════════════════════════════════════════

let clockInterval = null;

/**
 * Initialize the ledger analog clock
 */
export function initLedgerClock() {
    updateLedgerClock();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateLedgerClock, 1000);
}

/**
 * Update clock hands to current time
 */
function updateLedgerClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    
    const hourHand = document.getElementById('ie-clock-hour');
    const minuteHand = document.getElementById('ie-clock-minute');
    
    if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
}

/**
 * Update the clock weather indicator
 * @param {string} weather - Weather type: sunny, cloudy, rainy, night, stormy, snowy
 */
export function updateClockWeather(weather) {
    const weatherEl = document.getElementById('ie-clock-weather');
    const iconEl = document.getElementById('ie-clock-weather-icon');
    
    if (!weatherEl || !iconEl) return;
    
    // Weather icon mapping
    const icons = {
        sunny: 'fa-sun',
        cloudy: 'fa-cloud',
        rainy: 'fa-cloud-rain',
        night: 'fa-moon',
        stormy: 'fa-cloud-bolt',
        snowy: 'fa-snowflake',
        clear_night: 'fa-moon',
        clear_day: 'fa-sun'
    };
    
    // Update class for styling
    weatherEl.className = 'ledger-clock-weather ' + weather;
    
    // Update icon
    iconEl.className = 'fa-solid ' + (icons[weather] || 'fa-sun');
}

// ═══════════════════════════════════════════════════════════════
// LEDGER CASE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Render a case card
 * @param {Object} caseData - Case object with title, code, description, etc.
 * @returns {string} HTML string
 */
export function renderCaseCard(caseData) {
    const statusClass = caseData.status || 'active';
    return `
        <div class="ledger-case-card ${statusClass}" data-case-id="${caseData.id}">
            <div class="ledger-case-code">${caseData.code || 'HDB-??-????-??'}</div>
            <div class="ledger-case-title">${caseData.title || 'UNTITLED CASE'}</div>
            <div class="ledger-case-filed">FILED — Session ${caseData.session || '?'}, ${caseData.time || '??:??'}</div>
            <div class="ledger-case-description">${caseData.description || ''}</div>
            <div class="ledger-case-status ${statusClass}">${statusClass}</div>
        </div>
    `;
}

/**
 * Generate alphanumeric case code
 * @param {number} precinct - Precinct number (default 41)
 * @param {number} sequence - Case sequence number
 * @returns {string} Case code like "HDB-41-0115-03"
 */
export function generateCaseCode(precinct = 41, sequence = 1) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(sequence).padStart(2, '0');
    return `HDB-${precinct}-${month}${day}-${seq}`;
}

// ═══════════════════════════════════════════════════════════════
// BADGE & FORTUNE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Update the RCM badge with officer profile data
 * @param {Object} profile - Officer profile object
 */
export function updateBadgeDisplay(profile) {
    const nameEl = document.getElementById('ie-badge-name');
    const rankEl = document.getElementById('ie-badge-rank');
    const badgeIdEl = document.getElementById('ie-badge-id');
    const regEl = document.getElementById('ie-badge-reg');
    const sessionsEl = document.getElementById('ie-stat-sessions');
    const voicesEl = document.getElementById('ie-stat-voices');
    const critFailsEl = document.getElementById('ie-stat-critfails');
    const deepNightEl = document.getElementById('ie-stat-deepnight');
    const dotsEl = document.getElementById('ie-perforation-dots');
    
    if (nameEl) nameEl.textContent = profile.name || 'NAME UNKNOWN';
    if (rankEl) rankEl.textContent = profile.rank || 'RANK UNKNOWN';
    if (badgeIdEl) badgeIdEl.textContent = profile.badgeId || 'LTN-????';
    if (regEl) regEl.textContent = profile.regNumber || 'REV??-??-??-???';
    
    if (sessionsEl) sessionsEl.textContent = profile.sessions || 0;
    if (voicesEl) voicesEl.textContent = profile.voicesHeard || 0;
    if (critFailsEl) critFailsEl.textContent = profile.criticalFailures || 0;
    if (deepNightEl) deepNightEl.textContent = profile.deepNightSessions || 0;
    
    // Perforation dots
    if (dotsEl) {
        const count = Math.min(profile.sessions || 0, 20);
        const filled = '●'.repeat(count);
        const empty = '○'.repeat(Math.max(0, 10 - count));
        dotsEl.textContent = `${filled}${empty} (${profile.sessions || 0})`;
    }
}

/**
 * Display a fortune in the compartment
 * @param {Object} fortune - Fortune object with text, ledger type, etc.
 */
export function displayFortune(fortune) {
    const wrapper = document.getElementById('ie-fortune-display');
    const textEl = document.getElementById('ie-fortune-text');
    const sourceEl = document.getElementById('ie-fortune-source');
    
    if (!wrapper || !textEl || !sourceEl) return;
    
    textEl.textContent = `"${fortune.text}"`;
    
    // Set source with color class
    sourceEl.textContent = `— ${fortune.ledgerName}`;
    sourceEl.className = 'ledger-fortune-source ' + fortune.ledgerType;
    
    wrapper.style.display = 'block';
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
 * @param {string} flavor - Optional flavor text
 * @param {string} effect - Optional mechanical effect text
 */
export function updateWeather(icon, description, flavor = '', effect = '') {
    const weatherEl = document.getElementById('ie-weather-display');
    if (weatherEl) {
        weatherEl.innerHTML = `
            <div class="ie-weather-current">
                <i class="fa-solid ${icon}"></i>
                <div>
                    <div class="ie-weather-condition">${description}</div>
                    ${flavor ? `<div class="ie-weather-flavor">"${flavor}"</div>` : ''}
                    ${effect ? `<div class="ie-weather-effect">${effect}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Also update the clock weather
    const weatherType = icon.includes('rain') ? 'rainy' :
                       icon.includes('cloud') ? 'cloudy' :
                       icon.includes('snow') ? 'snowy' :
                       icon.includes('bolt') ? 'stormy' :
                       icon.includes('moon') ? 'night' : 'sunny';
    updateClockWeather(weatherType);
}

/**
 * Populate the connection profile dropdown with available ST profiles
 * @param {Array} profiles - Array of { id, name } objects from getAvailableProfiles()
 * @param {string} selectedProfile - Currently selected profile name
 */
export function populateConnectionProfiles(profiles, selectedProfile) {
    const select = document.getElementById('ie-connection-profile');
    if (!select) return;
    
    // Clear existing options except "current"
    select.innerHTML = '<option value="current">Use Current ST Profile</option>';
    
    // Add available profiles
    if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            option.textContent = profile.name;
            select.appendChild(option);
        });
    }
    
    // Set selected value
    if (selectedProfile) {
        select.value = selectedProfile;
    }
}
