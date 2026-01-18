/**
 * The Tribunal - SillyTavern Extension
 * REBUILD v0.3.0 - Clipboard header + CRT vitals
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
    <!-- Metal Clipboard Clip - Click to close panel -->
    <div class="ie-clipboard-clip" id="ie-close-panel" title="Close Case File">
        <div class="ie-clip-lever"></div>
        <div class="ie-clip-rivet ie-clip-rivet-left"></div>
        <div class="ie-clip-rivet ie-clip-rivet-right"></div>
        <div class="ie-clip-grip ie-clip-grip-left"></div>
        <div class="ie-clip-grip ie-clip-grip-right"></div>
        <div class="ie-clip-label">Case File</div>
    </div>
    
    <!-- Paper area with CRT monitor and Watch -->
    <div class="ie-clipboard-paper">
        <div class="ie-header-row">
            <!-- CRT Vitals Monitor -->
            <div class="ie-crt-container">
                <div class="ie-crt-monitor" id="ie-crt-vitals">
                    <div class="ie-crt-screen">
                        <div class="ie-crt-text">
                            <!-- Character name -->
                            <div class="ie-crt-name" id="ie-crt-char-name">UNKNOWN</div>
                            
                            <!-- Health bar -->
                            <div class="ie-crt-vital-row" id="ie-crt-health-row">
                                <span class="ie-crt-vital-label"><i class="fa-solid fa-heart"></i></span>
                                <div class="ie-crt-vital-bar">
                                    <div class="ie-crt-vital-fill" id="ie-health-fill" style="width: 100%"></div>
                                </div>
                                <span class="ie-crt-vital-value" id="ie-health-value">13</span>
                            </div>
                            
                            <!-- Morale bar -->
                            <div class="ie-crt-vital-row" id="ie-crt-morale-row">
                                <span class="ie-crt-vital-label"><i class="fa-solid fa-brain"></i></span>
                                <div class="ie-crt-vital-bar">
                                    <div class="ie-crt-vital-fill" id="ie-morale-fill" style="width: 100%"></div>
                                </div>
                                <span class="ie-crt-vital-value" id="ie-morale-value">13</span>
                            </div>
                            
                            <!-- EKG heartbeat line -->
                            <div class="ie-crt-ekg">
                                <div class="ie-ekg-line">
                                    <svg viewBox="0 0 200 14" preserveAspectRatio="none">
                                        <path d="M0,7 L20,7 L25,7 L27,2 L30,12 L33,4 L36,7 L50,7 L70,7 L75,7 L77,2 L80,12 L83,4 L86,7 L100,7 L120,7 L125,7 L127,2 L130,12 L133,4 L136,7 L150,7 L170,7 L175,7 L177,2 L180,12 L183,4 L186,7 L200,7"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Watch -->
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
<div class="ie-tab-content voices-page ie-tab-content-active" data-tab-content="voices">
    <div class="voices-napkin">
        <div class="napkin-watermark">WHIRLING • IN • RAGS</div>
        <div class="voices-header">
            <span>Inner Voices</span>
        </div>
        <div class="ie-voices-container" id="ie-voices-output">
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        </div>
        <div class="voices-actions">
            <button class="ie-btn ie-btn-primary ie-btn-trigger" id="ie-manual-trigger">
                <i class="fa-solid fa-bolt"></i>
                <span>Consult Inner Voices</span>
            </button>
        </div>
        <div class="napkin-phone-number">555-0139</div>
        <div class="napkin-lipstick"></div>
    </div>
</div>`;

const CABINET_TAB_HTML = `
<div class="ie-tab-content cabinet-page" data-tab-content="cabinet">
    <div class="cabinet-corkboard">
        <div class="cabinet-header">
            <span>Thought Cabinet</span>
        </div>
        <div class="ie-thoughts-container" id="ie-thoughts-container">
            <div class="ie-thoughts-empty">
                <i class="fa-solid fa-brain"></i>
                <span>No thoughts yet...</span>
            </div>
        </div>
        <!-- Pushpins -->
        <div class="cabinet-pushpin cabinet-pushpin-tl"></div>
        <div class="cabinet-pushpin cabinet-pushpin-tr"></div>
        <div class="cabinet-pushpin cabinet-pushpin-bl"></div>
        <div class="cabinet-pushpin cabinet-pushpin-br"></div>
        <!-- Decorations -->
        <div class="cabinet-polaroid"></div>
        <div class="cabinet-faln-poster"></div>
        <div class="cabinet-faln-tape"></div>
        <div class="cabinet-matchbook"><span class="cabinet-matchbook-sub">Martinaise</span></div>
        <div class="cabinet-businesscard">
            <div class="cabinet-businesscard-bend"></div>
            <div class="cabinet-businesscard-logo"></div>
        </div>
        <div class="cabinet-clipping"><div class="cabinet-clipping-pin"></div></div>
        <div class="cabinet-sticky"></div>
        <div class="cabinet-rcm-stamp"></div>
    </div>
</div>`;

const STATUS_TAB_HTML = `
<div class="ie-tab-content status-page" data-tab-content="status">
    <div class="rcm-medical-form">
        <!-- Decorations -->
        <div class="rcm-ink-stain"></div>
        <div class="rcm-fold-mark"></div>
        
        <!-- Header -->
        <div class="rcm-form-header">
            <div class="rcm-form-title">R.C.M. CITIZEN MILITIA<br>MEDICAL EVALUATION FORM</div>
        </div>
        
        <!-- Patient Info -->
        <div class="rcm-patient-info">
            <div class="rcm-field">
                <span class="rcm-field-label">PATIENT:</span>
                <span class="rcm-field-value" id="rcm-patient-name">______________</span>
            </div>
            <div class="rcm-field">
                <span class="rcm-field-label">BADGE #:</span>
                <span class="rcm-field-value">41ST-______</span>
            </div>
        </div>
        
        <!-- Physical Status -->
        <div class="rcm-section">
            <div class="rcm-section-header">PHYSICAL STATUS</div>
            <div class="rcm-section-content">
                <div class="rcm-vital-row" id="rcm-health-row">
                    <span class="rcm-vital-label">HEALTH:</span>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-health-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
                    <span class="rcm-vital-value" id="rcm-health-value">13/13</span>
                </div>
                <div class="rcm-vital-row" id="rcm-morale-row">
                    <span class="rcm-vital-label">MORALE:</span>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-morale-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
                    <span class="rcm-vital-value" id="rcm-morale-value">13/13</span>
                </div>
            </div>
        </div>
        
        <!-- Active Conditions / Effects -->
        <div class="rcm-section">
            <div class="rcm-section-header">ACTIVE CONDITIONS</div>
            <div class="rcm-section-content" id="rcm-conditions-container">
                <div class="rcm-active-effects" id="rcm-active-effects">
                    <span class="rcm-conditions-empty">(none reported)</span>
                </div>
            </div>
        </div>
        
        <!-- Observed States (Status Effects) -->
        <div class="rcm-section">
            <div class="rcm-section-header">OBSERVED STATES (check all apply)</div>
            <div class="rcm-section-content">
                <div class="rcm-states-category">
                    <div class="rcm-states-category-label">PHYSICAL:</div>
                    <div class="rcm-states-grid" id="rcm-physical-states">
                        <div class="rcm-checkbox" data-status="drunk" data-label-off="Drunk" data-label-on="Revacholian Courage">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Drunk</span>
                        </div>
                        <div class="rcm-checkbox" data-status="stimmed" data-label-off="Stimmed" data-label-on="Pyrholidon">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Stimmed</span>
                        </div>
                        <div class="rcm-checkbox" data-status="smoking" data-label-off="Smoking" data-label-on="Nicotine Rush">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Smoking</span>
                        </div>
                        <div class="rcm-checkbox" data-status="hungover" data-label-off="Hungover" data-label-on="Volumetric Shit Compressor">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Hungover</span>
                        </div>
                        <div class="rcm-checkbox" data-status="wounded" data-label-off="Wounded" data-label-on="Finger on the Eject Button">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Wounded</span>
                        </div>
                        <div class="rcm-checkbox" data-status="exhausted" data-label-off="Exhausted" data-label-on="Waste Land">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Exhausted</span>
                        </div>
                        <div class="rcm-checkbox" data-status="dying" data-label-off="Dying" data-label-on="White Mourning">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Dying</span>
                        </div>
                    </div>
                </div>
                <div class="rcm-states-category">
                    <div class="rcm-states-category-label">MENTAL:</div>
                    <div class="rcm-states-grid" id="rcm-mental-states">
                        <div class="rcm-checkbox" data-status="manic" data-label-off="Manic" data-label-on="Tequila Sunset">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Manic</span>
                        </div>
                        <div class="rcm-checkbox" data-status="dissociated" data-label-off="Dissociated" data-label-on="The Pale">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Dissociated</span>
                        </div>
                        <div class="rcm-checkbox" data-status="infatuated" data-label-off="Infatuated" data-label-on="Homo-Sexual Underground">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Infatuated</span>
                        </div>
                        <div class="rcm-checkbox" data-status="lucky" data-label-off="Lucky" data-label-on="Jamrock Shuffle">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Lucky</span>
                        </div>
                        <div class="rcm-checkbox" data-status="terrified" data-label-off="Terrified" data-label-on="Caustic Echo">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Terrified</span>
                        </div>
                        <div class="rcm-checkbox" data-status="enraged" data-label-off="Enraged" data-label-on="Law-Jaw">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Enraged</span>
                        </div>
                        <div class="rcm-checkbox" data-status="grieving" data-label-off="Grieving" data-label-on="The Expression">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Grieving</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Copotypes -->
        <div class="rcm-section">
            <div class="rcm-section-header">OFFICER CLASSIFICATION (copotype)</div>
            <div class="rcm-section-content">
                <div class="rcm-copotype-grid" id="rcm-copotypes">
                    <div class="rcm-copotype-item" data-copotype="apocalypse-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Apocalypse Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="sorry-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Sorry Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="boring-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Boring Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="honour-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Honour Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="art-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Art Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="hobocop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Hobocop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="superstar-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Superstar Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="dick-mullen">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Dick Mullen</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="human-can-opener">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Human Can-Opener</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="innocence">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Innocence</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ancient Voices -->
        <div class="rcm-section">
            <div class="rcm-section-header">PSYCHOLOGICAL ANOMALIES (ancient voices)</div>
            <div class="rcm-section-content">
                <div class="rcm-ancient-voices" id="rcm-ancient-voices">
                    <div class="rcm-ancient-voice-entry">
                        <i class="fa-solid fa-dragon rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Ancient Reptilian Brain</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: The Pale</span>
                        </div>
                    </div>
                    <div class="rcm-ancient-voice-entry">
                        <i class="fa-solid fa-brain rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Limbic System</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: The Pale</span>
                        </div>
                    </div>
                    <div class="rcm-ancient-voice-entry rcm-ancient-combo">
                        <i class="fa-solid fa-bone rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Spinal Cord</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: Tequila Sunset + Revacholian Courage</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="rcm-form-footer">
            <div class="rcm-officer-field">
                <span class="rcm-officer-label">EXAMINING OFFICER:</span>
                <span class="rcm-signature">Nix Gottlieb<span class="rcm-signature-title">Station Lazareth</span></span>
            </div>
            <div class="rcm-stamp">R.C.M.<br>MEDICAL<br>DIVISION</div>
        </div>
    </div>
</div>`;

const LEDGER_TAB_HTML = `
<div class="ie-tab-content ledger-page" data-tab-content="ledger">
    <!-- Sub-tabs bar -->
    <div class="ledger-subtabs">
        <button class="ledger-subtab ledger-subtab-active" data-ledger-tab="cases">CASES</button>
        <button class="ledger-subtab" data-ledger-tab="map">MAP</button>
    </div>
    
    <!-- CASES sub-content - Notebook paper -->
    <div class="ledger-subcontent ledger-subcontent-active ledger-paper notebook-paper" data-ledger-content="cases">
        <div class="ledger-section-header">
            ACTIVE CASES
            <div class="ledger-doodle"></div>
        </div>
        <p class="ledger-empty">No open cases</p>
        <div class="ledger-coffee-ring"></div>
    </div>
    
    <!-- MAP sub-content - Grid paper -->
    <div class="ledger-subcontent ledger-paper grid-paper" data-ledger-content="map">
        <!-- District Map -->
        <div class="district-map">
            <div class="map-sticky-note">
                remember to check the dumpster
            </div>
            <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
                <!-- The Bay (water) -->
                <rect x="0" y="0" width="400" height="80" fill="#b8c8d4"/>
                <text x="200" y="50" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-style="italic" fill="#6a7a84">The Bay</text>
                
                <!-- Land -->
                <rect x="0" y="80" width="400" height="200" fill="#d4cbb8"/>
                
                <!-- District label -->
                <text x="320" y="120" font-family="Arial, sans-serif" font-size="12" letter-spacing="2" fill="#7a7060">MARTINAISE</text>
                
                <!-- Roads -->
                <line x1="0" y1="140" x2="400" y2="140" stroke="#9a9080" stroke-width="8"/>
                <line x1="150" y1="80" x2="150" y2="280" stroke="#9a9080" stroke-width="6" stroke-dasharray="4,4"/>
                <line x1="250" y1="140" x2="250" y2="280" stroke="#9a9080" stroke-width="6"/>
                
                <!-- Location markers -->
                <circle cx="150" cy="115" r="8" class="map-marker map-marker-primary"/>
                <text x="175" y="105" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Crime Scene</text>
                
                <circle cx="150" cy="160" r="10" class="map-marker map-marker-primary"/>
                <text x="95" y="185" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Whirling</text>
                
                <circle cx="250" cy="190" r="6" class="map-marker map-marker-secondary"/>
                <text x="225" y="220" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Bookstore</text>
                
                <circle cx="330" cy="180" r="6" class="map-marker map-marker-secondary"/>
                <text x="305" y="210" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Pawn Shop</text>
            </svg>
        </div>
        <div class="map-caption">DISTRICT MAP — NOT TO SCALE</div>
        
        <div class="ledger-section-header">
            POINTS OF INTEREST
        </div>
        <p class="ledger-empty">No locations discovered</p>
        
        <div class="ledger-section-header">
            NOTES
        </div>
        <textarea class="ledger-notes" placeholder="Write your notes here..."></textarea>
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
// CRT VITALS FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════

let currentVitals = {
    health: 13,
    maxHealth: 13,
    morale: 13,
    maxMorale: 13,
    characterName: 'UNKNOWN'
};

/**
 * Update CRT vitals display
 * @param {number} health - Current health
 * @param {number} maxHealth - Max health
 * @param {number} morale - Current morale
 * @param {number} maxMorale - Max morale
 * @param {string} characterName - Character name to display
 */
function updateCRTVitals(health, maxHealth, morale, maxMorale, characterName) {
    // Store current values
    currentVitals = { health, maxHealth, morale, maxMorale, characterName };
    
    // Update name
    const nameEl = document.getElementById('ie-crt-char-name');
    if (nameEl) {
        nameEl.textContent = characterName || 'UNKNOWN';
    }
    
    // Calculate percentages
    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
    const moralePercent = maxMorale > 0 ? (morale / maxMorale) * 100 : 0;
    
    // Update health bar
    const healthFill = document.getElementById('ie-health-fill');
    const healthValue = document.getElementById('ie-health-value');
    const healthRow = document.getElementById('ie-crt-health-row');
    
    if (healthFill) healthFill.style.width = `${healthPercent}%`;
    if (healthValue) healthValue.textContent = health;
    
    // Update morale bar
    const moraleFill = document.getElementById('ie-morale-fill');
    const moraleValue = document.getElementById('ie-morale-value');
    const moraleRow = document.getElementById('ie-crt-morale-row');
    
    if (moraleFill) moraleFill.style.width = `${moralePercent}%`;
    if (moraleValue) moraleValue.textContent = morale;
    
    // Apply low/critical states
    const monitor = document.getElementById('ie-crt-vitals');
    
    // Health states
    if (healthRow) {
        healthRow.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (healthPercent < 15) {
            healthRow.classList.add('ie-vital-critical');
        } else if (healthPercent < 30) {
            healthRow.classList.add('ie-vital-low');
        }
    }
    
    // Morale states
    if (moraleRow) {
        moraleRow.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (moralePercent < 15) {
            moraleRow.classList.add('ie-vital-critical');
        } else if (moralePercent < 30) {
            moraleRow.classList.add('ie-vital-low');
        }
    }
    
    // Overall monitor state (affects EKG speed)
    if (monitor) {
        monitor.classList.remove('ie-vital-low', 'ie-vital-critical', 'ie-vital-dead');
        const lowestPercent = Math.min(healthPercent, moralePercent);
        if (health <= 0 || morale <= 0) {
            monitor.classList.add('ie-vital-dead');
        } else if (lowestPercent < 15) {
            monitor.classList.add('ie-vital-critical');
        } else if (lowestPercent < 30) {
            monitor.classList.add('ie-vital-low');
        }
    }
    
    // Also update RCM Medical Form
    updateRCMFormVitals(health, maxHealth, morale, maxMorale);
}

/**
 * Flash damage/heal effect on CRT
 * @param {'damage'|'heal'} type - Effect type
 */
function flashCRTEffect(type) {
    const monitor = document.getElementById('ie-crt-vitals');
    if (!monitor) return;
    
    const className = type === 'damage' ? 'ie-crt-damage' : 'ie-crt-heal';
    monitor.classList.add(className);
    
    setTimeout(() => {
        monitor.classList.remove(className);
    }, 300);
}

/**
 * Set character name in CRT display
 * @param {string} name - Character name
 */
function setCRTCharacterName(name) {
    const nameEl = document.getElementById('ie-crt-char-name');
    if (nameEl) {
        nameEl.textContent = name || 'UNKNOWN';
    }
    currentVitals.characterName = name;
    
    // Also update RCM form
    const rcmNameEl = document.getElementById('rcm-patient-name');
    if (rcmNameEl) {
        rcmNameEl.textContent = name || '______________';
        rcmNameEl.classList.toggle('rcm-field-filled', !!name);
    }
}

/**
 * Update RCM Medical Form vitals display
 */
function updateRCMFormVitals(health, maxHealth, morale, maxMorale) {
    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
    const moralePercent = maxMorale > 0 ? (morale / maxMorale) * 100 : 0;
    
    // Update health
    const rcmHealthFill = document.getElementById('rcm-health-fill');
    const rcmHealthValue = document.getElementById('rcm-health-value');
    const rcmHealthRow = document.getElementById('rcm-health-row');
    
    if (rcmHealthFill) rcmHealthFill.style.width = `${healthPercent}%`;
    if (rcmHealthValue) rcmHealthValue.textContent = `${health}/${maxHealth}`;
    
    if (rcmHealthRow) {
        rcmHealthRow.classList.remove('rcm-vital-low', 'rcm-vital-critical');
        if (healthPercent < 15) {
            rcmHealthRow.classList.add('rcm-vital-critical');
        } else if (healthPercent < 30) {
            rcmHealthRow.classList.add('rcm-vital-low');
        }
    }
    
    // Update morale
    const rcmMoraleFill = document.getElementById('rcm-morale-fill');
    const rcmMoraleValue = document.getElementById('rcm-morale-value');
    const rcmMoraleRow = document.getElementById('rcm-morale-row');
    
    if (rcmMoraleFill) rcmMoraleFill.style.width = `${moralePercent}%`;
    if (rcmMoraleValue) rcmMoraleValue.textContent = `${morale}/${maxMorale}`;
    
    if (rcmMoraleRow) {
        rcmMoraleRow.classList.remove('rcm-vital-low', 'rcm-vital-critical');
        if (moralePercent < 15) {
            rcmMoraleRow.classList.add('rcm-vital-critical');
        } else if (moralePercent < 30) {
            rcmMoraleRow.classList.add('rcm-vital-low');
        }
    }
}

/**
 * Toggle a status effect checkbox on the RCM form
 * @param {string} status - Status ID (e.g., 'drunk', 'manic')
 * @param {boolean} active - Whether the status is active
 */
function setRCMStatus(status, active) {
    const checkbox = document.querySelector(`.rcm-checkbox[data-status="${status}"]`);
    if (checkbox) {
        checkbox.classList.toggle('rcm-checked', active);
        const label = checkbox.querySelector('.rcm-checkbox-label');
        if (label) {
            const labelOff = checkbox.dataset.labelOff;
            const labelOn = checkbox.dataset.labelOn;
            label.textContent = active ? labelOn : labelOff;
        }
    }
}

/**
 * Toggle a copotype on the RCM form
 * @param {string} copotype - Copotype ID (e.g., 'sorry-cop', 'art-cop')
 * @param {boolean} active - Whether it's active
 */
function setRCMCopotype(copotype, active) {
    const item = document.querySelector(`.rcm-copotype-item[data-copotype="${copotype}"]`);
    if (item) {
        item.classList.toggle('rcm-copotype-active', active);
        const box = item.querySelector('.rcm-copotype-box');
        if (box) {
            box.textContent = active ? '☒' : '□';
        }
    }
}

/**
 * Add an ancient voice entry to the RCM form
 * @param {string} name - Voice name
 * @param {string} icon - FontAwesome icon class (e.g., 'fa-ghost')
 * @param {string} triggers - Trigger description
 * @param {boolean} isCombo - Whether this is a combo voice
 */
function addRCMAncientVoice(name, icon, triggers, isCombo = false) {
    const container = document.getElementById('rcm-ancient-voices');
    if (!container) return;
    
    // Remove empty message if present
    const empty = container.querySelector('.rcm-conditions-empty');
    if (empty) empty.remove();
    
    const entry = document.createElement('div');
    entry.className = 'rcm-ancient-voice-entry' + (isCombo ? ' rcm-ancient-combo' : '');
    entry.innerHTML = `
        <i class="fa-solid ${icon} rcm-ancient-voice-icon"></i>
        <div class="rcm-ancient-voice-details">
            <span class="rcm-ancient-voice-name">${name}</span>
            <span class="rcm-ancient-voice-triggers">${triggers}</span>
        </div>
    `;
    container.appendChild(entry);
}

/**
 * Add an active effect to the conditions display
 * @param {string} text - Effect text
 * @param {'boost'|'debuff'} type - Effect type
 */
function addRCMActiveEffect(text, type) {
    const container = document.getElementById('rcm-active-effects');
    if (!container) return;
    
    // Remove empty message if present
    const empty = container.querySelector('.rcm-conditions-empty');
    if (empty) empty.remove();
    
    const effect = document.createElement('span');
    effect.className = `rcm-effect-item rcm-effect-${type}`;
    effect.textContent = text;
    container.appendChild(effect);
}

/**
 * Clear all ancient voices
 */
function clearRCMAncientVoices() {
    const container = document.getElementById('rcm-ancient-voices');
    if (container) {
        container.innerHTML = '<span class="rcm-conditions-empty">(no anomalies detected)</span>';
    }
}

/**
 * Clear all active effects
 */
function clearRCMActiveEffects() {
    const container = document.getElementById('rcm-active-effects');
    if (container) {
        container.innerHTML = '<span class="rcm-conditions-empty">(none reported)</span>';
    }
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

    // Close button (clicking the metal clipboard clip)
    document.getElementById('ie-close-panel')?.addEventListener('click', togglePanel);

    // Tab switching
    document.querySelectorAll('.ie-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Bottom buttons
    document.querySelectorAll('.ie-bottom-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });

    // Ledger sub-tabs
    document.querySelectorAll('.ledger-subtab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.ledgerTab;
            
            // Update tab states
            document.querySelectorAll('.ledger-subtab').forEach(t => t.classList.remove('ledger-subtab-active'));
            tab.classList.add('ledger-subtab-active');
            
            // Update content visibility
            document.querySelectorAll('.ledger-subcontent').forEach(c => c.classList.remove('ledger-subcontent-active'));
            document.querySelector(`[data-ledger-content="${targetTab}"]`)?.classList.add('ledger-subcontent-active');
        });
    });

    // Watch toggle
    document.getElementById('ie-header-watch')?.addEventListener('click', toggleWatchMode);

    // Manual trigger
    document.getElementById('ie-manual-trigger')?.addEventListener('click', () => {
        console.log('[The Tribunal] Manual trigger clicked');
        if (typeof toastr !== 'undefined') toastr.info('Voice trigger (not implemented yet)');
    });

    // RCM Medical Form checkboxes - swap labels on toggle
    document.querySelectorAll('.rcm-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            checkbox.classList.toggle('rcm-checked');
            const isChecked = checkbox.classList.contains('rcm-checked');
            const label = checkbox.querySelector('.rcm-checkbox-label');
            
            // Swap label text based on state
            if (label) {
                const labelOff = checkbox.dataset.labelOff;
                const labelOn = checkbox.dataset.labelOn;
                label.textContent = isChecked ? labelOn : labelOff;
            }
            
            const status = checkbox.dataset.status;
            console.log(`[The Tribunal] Status ${status}: ${isChecked}`);
        });
    });

    // Copotype selection
    document.querySelectorAll('.rcm-copotype-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('rcm-copotype-active');
            const box = item.querySelector('.rcm-copotype-box');
            if (box) {
                box.textContent = item.classList.contains('rcm-copotype-active') ? '☒' : '□';
            }
            const copotype = item.dataset.copotype;
            const isActive = item.classList.contains('rcm-copotype-active');
            console.log(`[The Tribunal] Copotype ${copotype}: ${isActive}`);
            // TODO: Hook into state management
        });
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
    console.log('[The Tribunal] Initializing UI shell v0.3.0...');

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
