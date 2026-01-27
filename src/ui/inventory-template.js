/**
 * The Tribunal - Inventory Tab Template
 * Evidence light table, equipment ticket, and radio
 * 
 * @version 2.0.0 - Updated radio with weather-synced stations
 */

export const INVENTORY_TAB_HTML = `
<div class="ie-tab-content inventory-page" data-tab-content="inventory">
    <!-- Inventory Sub-tabs -->
    <div class="inventory-sub-tabs">
        <button class="inventory-sub-tab active" data-subtab="inv">INV</button>
        <button class="inventory-sub-tab" data-subtab="equip">EQUIP</button>
        <button class="inventory-sub-tab" data-subtab="radio">RADIO</button>
    </div>
    
    <!-- ═══════════════════════════════════════════════════════════════
         INV SUBTAB - Evidence Collection Light Table
         ═══════════════════════════════════════════════════════════════ -->
    <div class="inventory-subcontent inventory-subcontent-active inv-evidence-container" data-subcontent="inv">
        <!-- Light Table Surface -->
        <div class="inv-evidence-table">
            <!-- Metal Frame Top -->
            <div class="inv-evidence-frame-top"></div>
            
            <!-- Consumables Section -->
            <div class="inv-evidence-section">
                <div class="inv-evidence-section-label">CONSUMABLES</div>
                <div class="inv-evidence-grid" id="ie-consumables-grid">
                    <!-- Evidence bags will be inserted here -->
                    <p class="inv-evidence-empty">No items</p>
                </div>
            </div>
            
            <!-- Miscellaneous Section -->
            <div class="inv-evidence-section">
                <div class="inv-evidence-section-label">MISCELLANEOUS</div>
                <div class="inv-evidence-grid" id="ie-misc-grid">
                    <!-- Evidence bags will be inserted here -->
                    <p class="inv-evidence-empty">No items</p>
                </div>
            </div>
            
            <!-- Item Detail Panel (shown when item selected) -->
            <div class="inv-evidence-detail" id="ie-item-detail" style="display: none;">
                <div class="inv-evidence-detail-header">
                    <span class="inv-evidence-detail-icon" id="ie-detail-icon"></span>
                    <span class="inv-evidence-detail-name" id="ie-detail-name"></span>
                    <button class="inv-evidence-detail-close" id="ie-detail-close">×</button>
                </div>
                <p class="inv-evidence-detail-desc" id="ie-detail-desc"></p>
                <div class="inv-evidence-detail-effect" id="ie-detail-effect"></div>
                <button class="inv-evidence-consume-btn" id="ie-consume-btn" style="display: none;">
                    ▶ CONSUME
                </button>
            </div>
        </div>
        
        <!-- Wallet Section -->
        <div class="inv-wallet-section">
            <!-- Binder Clip -->
            <div class="inv-wallet-clip">
                <div class="inv-wallet-clip-arm"></div>
            </div>
            
            <!-- Leather Wallet -->
            <div class="inv-wallet">
                <div class="inv-wallet-stitching"></div>
                <div class="inv-wallet-content">
                    <span class="inv-wallet-label">RÉAL:</span>
                    <span class="inv-wallet-value" id="ie-currency-value">0.00</span>
                </div>
            </div>
            
            <!-- RCM Badge -->
            <div class="inv-rcm-badge">
                <span class="inv-rcm-badge-text">RCM</span>
            </div>
        </div>
    </div>
    
    <!-- ═══════════════════════════════════════════════════════════════
         EQUIP SUBTAB - Dry Cleaner's Ticket
         ═══════════════════════════════════════════════════════════════ -->
    <div class="inventory-subcontent equip-ticket-container" data-subcontent="equip">
        <div class="equip-ticket">
            <!-- Top perforation -->
            <div class="equip-ticket-perf-top"></div>
            
            <!-- Header -->
            <div class="equip-ticket-header">
                <div class="equip-ticket-title">MARTINAISE CLEANERS</div>
                <div class="equip-ticket-subtitle">EST. '02 • "WE REMOVE ALL STAINS"</div>
            </div>
            
            <!-- Ticket Number -->
            <div class="equip-ticket-number-bar">
                <span class="equip-ticket-number-label">TICKET #</span>
                <span class="equip-ticket-number-value" id="ie-ticket-number">4471</span>
            </div>
            
            <!-- Items List -->
            <div class="equip-ticket-items">
                <div class="equip-ticket-section-label">ITEMS FOR PICKUP</div>
                
                <div class="equip-ticket-items-list" id="ie-equip-items-list">
                    <!-- Items will be inserted here dynamically -->
                    <p class="equip-ticket-empty">No items checked in</p>
                </div>
                
                <!-- Add Item Button -->
                <button class="equip-ticket-add-btn" id="ie-equip-add-btn">
                    + ADD ITEM
                </button>
            </div>
            
            <!-- Footer -->
            <div class="equip-ticket-footer">
                <div class="equip-ticket-footer-text">
                    ITEMS LEFT OVER 30 DAYS BECOME PROPERTY OF MARTINAISE CLEANERS<br>
                    NO REFUNDS • NO EXCEPTIONS • NO DISCO
                </div>
            </div>
            
            <!-- Bottom perforation -->
            <div class="equip-ticket-perf-bottom"></div>
        </div>
    </div>
    
    <!-- ═══════════════════════════════════════════════════════════════
         RADIO SUBTAB - FELD MREF Plus+ Ambient Radio
         ═══════════════════════════════════════════════════════════════ -->
    <div class="inventory-subcontent radio-subcontent" data-subcontent="radio">
        <div class="ie-radio-section">
            <div class="tribunal-radio" id="ie-radio">
                <div class="radio-antenna"></div>
                
                <div class="radio-body">
                    <!-- Display Panel -->
                    <div class="radio-display">
                        <div class="radio-display-header">
                            <span class="radio-label-fm">FM</span>
                            <span class="radio-label-brand">FELD MREF PLUS+</span>
                            <span class="radio-label-am">AM</span>
                        </div>
                        
                        <div class="radio-dial">
                            <div class="radio-dial-markers">
                                <span>88</span>
                                <span>92</span>
                                <span>98</span>
                                <span>104</span>
                                <span>108</span>
                            </div>
                            <div class="radio-needle" id="ie-radio-needle" style="left: 50%;"></div>
                        </div>
                        
                        <div class="radio-display-station">
                            <span class="radio-station-name" id="ie-station-name">DAYBREAK</span>
                        </div>
                    </div>
                    
                    <!-- Controls -->
                    <div class="radio-controls">
                        <div class="radio-knob-group">
                            <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(-30deg);"></div></div>
                            <span class="radio-knob-label">POWER</span>
                        </div>
                        <div class="radio-knob-group">
                            <div class="radio-knob"><div class="radio-knob-indicator"></div></div>
                            <span class="radio-knob-label">VOL</span>
                        </div>
                        <div class="radio-knob-group">
                            <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(45deg);"></div></div>
                            <span class="radio-knob-label">TUNE</span>
                        </div>
                    </div>
                    
                    <!-- Speaker with EQ bars -->
                    <div class="radio-speaker">
                        <div class="radio-eq" id="ie-radio-eq">
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                            <div class="radio-eq-bar"></div>
                        </div>
                    </div>
                    
                    <!-- Station List (rebuilt by radio.js but fallback here) -->
                    <div class="radio-station-panel" id="ie-station-list">
                        <div class="radio-station-item" data-station="0" data-id="static">
                            <span class="station-freq">87.5</span>
                            <span class="station-name">THE PALE</span>
                            <span class="station-type">VOID</span>
                        </div>
                        <div class="radio-station-item" data-station="1" data-id="snow">
                            <span class="station-freq">89.1</span>
                            <span class="station-name">SNOWFALL</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="2" data-id="rain">
                            <span class="station-freq">91.7</span>
                            <span class="station-name">RAINFALL</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="3" data-id="storm">
                            <span class="station-freq">93.3</span>
                            <span class="station-name">TEMPEST</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item active" data-station="4" data-id="day">
                            <span class="station-freq">95.9</span>
                            <span class="station-name">DAYBREAK</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="5" data-id="night">
                            <span class="station-freq">97.5</span>
                            <span class="station-name">NIGHTSIDE</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="6" data-id="wind">
                            <span class="station-freq">99.1</span>
                            <span class="station-name">GALE</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="7" data-id="fog">
                            <span class="station-freq">100.7</span>
                            <span class="station-name">THE MIST</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="8" data-id="horror">
                            <span class="station-freq">101.3</span>
                            <span class="station-name">DREAD</span>
                            <span class="station-type">SPECIAL</span>
                        </div>
                        <div class="radio-station-item" data-station="9" data-id="waves">
                            <span class="station-freq">103.9</span>
                            <span class="station-name">HARBOR</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="10" data-id="city">
                            <span class="station-freq">105.5</span>
                            <span class="station-name">NEON DISTRICT</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                        <div class="radio-station-item" data-station="11" data-id="indoor">
                            <span class="station-freq">107.9</span>
                            <span class="station-name">THE WHIRLING</span>
                            <span class="station-type">AMBIENT</span>
                        </div>
                    </div>
                    
                    <!-- Bottom Panel -->
                    <div class="radio-bottom">
                        <div class="radio-on-air">
                            <div class="radio-on-air-light"></div>
                            <span class="radio-on-air-text">ON AIR</span>
                        </div>
                        <span class="radio-brand">FELD</span>
                    </div>
                </div>
            </div>
            
            <!-- Auto-tune toggle -->
            <div class="radio-autotune-toggle" style="text-align: center; margin-top: 8px;">
                <label style="font-size: 0.7rem; color: var(--ie-text-muted); cursor: pointer;">
                    <input type="checkbox" id="ie-radio-autotune" checked style="margin-right: 6px;">
                    Auto-tune with weather
                </label>
            </div>
        </div>
    </div>
</div>`;
