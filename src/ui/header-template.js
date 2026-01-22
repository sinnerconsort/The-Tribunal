/**
 * The Tribunal - Header Templates
 * Panel header with CRT vitals, watch, tab bar, and bottom buttons
 */

export const PANEL_HEADER_HTML = `
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
        <i class="fa-solid fa-suitcase"></i>
    </button>
</div>`;

export const BOTTOM_BUTTONS_HTML = `
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
