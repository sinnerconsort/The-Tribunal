/**
 * The Tribunal - Inventory Tab Template
 * Evidence light table, equipment ticket, and radio
 * 
 * @version 2.1.0 - Added badge scan and manual add buttons
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
        
        <!-- Wallet Section with Scan Badge + Add Button -->
        <div class="inv-wallet-section">
            <!-- RCM Badge - Click to Scan -->
            <button class="inv-rcm-badge" id="ie-inv-scan-btn" title="Scan persona for items">
                <span class="inv-rcm-badge-text">RCM</span>
                <span class="inv-rcm-badge-subtext">SCAN</span>
            </button>
            
            <!-- Leather Wallet -->
            <div class="inv-wallet">
                <div class="inv-wallet-stitching"></div>
                <div class="inv-wallet-content">
                    <span class="inv-wallet-label">RÉAL:</span>
                    <span class="inv-wallet-value" id="ie-currency-value">0.00</span>
                </div>
            </div>
            
            <!-- Add Item Button -->
            <button class="inv-add-btn" id="ie-inv-add-btn" title="Add item manually">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
        
        <!-- Add Form (hidden by default, positioned above wallet) -->
        <div class="inv-add-form" id="ie-inv-add-form">
            <div class="inv-add-form-row">
                <input type="text" class="inv-add-input" id="ie-inv-add-input" placeholder="Item name..." />
                <button class="inv-add-submit" id="ie-inv-add-submit">Add</button>
                <button class="inv-add-cancel" id="ie-inv-add-cancel">✕</button>
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
         RADIO SUBTAB - Slipstream SCA Ambient Radio
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
                            <span class="radio-label-brand">Slipstream SCA</span>
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
                            <div class="radio-dial-station">
                                <span class="radio-station-name" id="ie-station-name">DAYBREAK</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Controls -->
                    <div class="radio-controls">
                        <div class="radio-knob-group">
                            <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(-30deg);"></div></div>
                            <span class="radio-knob-label">POWER</span>
                        </div>
                        <div class="radio-knob-group">
                            <div class="radio-knob radio-tuner" id="ie-radio-tuner"><div class="radio-knob-indicator" style="transform: rotate(0deg);"></div></div>
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
                        <span class="radio-brand">TRICENTENNIAL</span>
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

// ═══════════════════════════════════════════════════════════════
// SUBTAB HANDLER - Initialize this after DOM ready
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize inventory subtab switching
 * Call this after the inventory DOM is injected
 */
export function initInventorySubtabs() {
    const subtabs = document.querySelectorAll('.inventory-sub-tab');
    const subcontents = document.querySelectorAll('.inventory-subcontent');
    
    if (!subtabs.length) {
        console.warn('[Inventory] No subtabs found');
        return;
    }
    
    subtabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.subtab;
            
            // Skip if clicking already active tab
            if (tab.classList.contains('active')) return;
            
            // Update active subtab
            subtabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            subcontents.forEach(content => {
                const isTarget = content.dataset.subcontent === targetTab;
                content.classList.toggle('inventory-subcontent-active', isTarget);
            });
            
            console.log(`[Inventory] Switched to subtab: ${targetTab}`);
        });
    });
    
    console.log('[Inventory] Subtab handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// WALLET SECTION HANDLERS
// ═══════════════════════════════════════════════════════════════

// Module references (set by initWalletHandlers)
let inventoryGeneration = null;
let inventoryHandlers = null;

/**
 * Find user persona text (same pattern as equipment)
 */
function findUserPersona() {
    if (window.power_user?.personas) {
        const name = window.power_user.persona_name || window.power_user.default_persona;
        if (name && window.power_user.personas[name]) return window.power_user.personas[name];
    }
    if (window.power_user?.persona_description) return window.power_user.persona_description;
    return document.getElementById('persona_description')?.value || null;
}

/**
 * Toast helper
 */
function toast(msg, type = 'info') {
    if (typeof toastr !== 'undefined') {
        toastr[type](msg, 'Inventory');
    } else {
        console.log(`[Inventory] ${type}: ${msg}`);
    }
}

/**
 * Scan persona for inventory items
 */
async function scanForInventory() {
    const badge = document.getElementById('ie-inv-scan-btn');
    const persona = findUserPersona();
    
    if (!persona) {
        toast('No persona found!', 'warning');
        return;
    }
    
    if (!inventoryGeneration) {
        toast('Inventory generation not loaded', 'error');
        return;
    }
    
    // Add scanning animation
    badge?.classList.add('scanning');
    toast('Scanning persona...', 'info');
    
    try {
        const names = inventoryGeneration.quickExtractItemNames(persona);
        
        if (names.length === 0) {
            toast('No items found in persona', 'info');
            return;
        }
        
        toast(`Found ${names.length} items...`, 'info');
        
        let added = 0;
        for (const name of names) {
            // Check stash first, then generate
            const existing = inventoryHandlers?.getFromStash?.(name);
            if (existing) {
                await inventoryHandlers?.addInventoryItem?.(existing);
                added++;
            } else {
                const itemData = await inventoryGeneration.generateSingleItem(name);
                if (itemData) {
                    inventoryHandlers?.saveToStash?.(itemData);
                    await inventoryHandlers?.addInventoryItem?.(itemData);
                    added++;
                }
            }
            inventoryHandlers?.refreshDisplay?.();
        }
        
        toast(`Added ${added} items!`, 'success');
        
    } catch (error) {
        console.error('[Inventory] Scan error:', error);
        toast('Scan failed: ' + error.message, 'error');
    } finally {
        badge?.classList.remove('scanning');
    }
}

/**
 * Show/hide add item form
 */
function toggleAddForm(show) {
    const form = document.getElementById('ie-inv-add-form');
    const input = document.getElementById('ie-inv-add-input');
    
    if (show) {
        form?.classList.add('active');
        setTimeout(() => input?.focus(), 50);
    } else {
        form?.classList.remove('active');
        if (input) input.value = '';
    }
}

/**
 * Handle manual item add
 */
async function handleAddItem() {
    const input = document.getElementById('ie-inv-add-input');
    const name = input?.value.trim();
    
    if (!name) return;
    
    if (!inventoryGeneration) {
        toast('Inventory generation not loaded', 'error');
        return;
    }
    
    toggleAddForm(false);
    toast(`Adding ${name}...`, 'info');
    
    try {
        // Check stash first
        const existing = inventoryHandlers?.getFromStash?.(name);
        if (existing) {
            await inventoryHandlers?.addInventoryItem?.(existing);
            toast(`Added from stash: ${name}`, 'success');
        } else {
            const itemData = await inventoryGeneration.generateSingleItem(name);
            if (itemData) {
                inventoryHandlers?.saveToStash?.(itemData);
                await inventoryHandlers?.addInventoryItem?.(itemData);
                toast(`Generated: ${name}`, 'success');
            } else {
                toast(`Failed to generate: ${name}`, 'error');
            }
        }
        inventoryHandlers?.refreshDisplay?.();
    } catch (error) {
        console.error('[Inventory] Add error:', error);
        toast('Add failed: ' + error.message, 'error');
    }
}

/**
 * Initialize wallet section handlers
 */
function initWalletHandlers() {
    // Scan button (RCM badge)
    const scanBtn = document.getElementById('ie-inv-scan-btn');
    scanBtn?.addEventListener('click', scanForInventory);
    
    // Add button (+)
    const addBtn = document.getElementById('ie-inv-add-btn');
    addBtn?.addEventListener('click', () => toggleAddForm(true));
    
    // Add form submit
    const submitBtn = document.getElementById('ie-inv-add-submit');
    submitBtn?.addEventListener('click', handleAddItem);
    
    // Add form cancel
    const cancelBtn = document.getElementById('ie-inv-add-cancel');
    cancelBtn?.addEventListener('click', () => toggleAddForm(false));
    
    // Enter key in input
    const input = document.getElementById('ie-inv-add-input');
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddItem();
        if (e.key === 'Escape') toggleAddForm(false);
    });
    
    // Click outside to close form
    document.addEventListener('click', (e) => {
        const form = document.getElementById('ie-inv-add-form');
        const addBtn = document.getElementById('ie-inv-add-btn');
        if (form?.classList.contains('active') && 
            !form.contains(e.target) && 
            !addBtn?.contains(e.target)) {
            toggleAddForm(false);
        }
    });
    
    console.log('[Inventory] Wallet handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// COMBINED INIT - Call this once after inventory DOM exists
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize all inventory template handlers
 * @param {object} options - Optional module references
 * @param {object} options.generation - inventory-generation.js module
 * @param {object} options.handlers - inventory-handlers.js module  
 */
export function initInventoryTemplateHandlers(options = {}) {
    // Store module references for wallet handlers
    inventoryGeneration = options.generation || null;
    inventoryHandlers = options.handlers || null;
    
    initInventorySubtabs();
    initWalletHandlers();
    
    console.log('[Inventory] Template handlers initialized');
}

/**
 * Set module references after lazy loading
 */
export function setInventoryModules(generation, handlers) {
    inventoryGeneration = generation;
    inventoryHandlers = handlers;
    console.log('[Inventory] Modules linked');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG - Expose globally for testing
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalDebug = window.TribunalDebug || {};
    window.TribunalDebug.initInventorySubtabs = initInventorySubtabs;
    window.TribunalDebug.initWalletHandlers = initWalletHandlers;
    window.TribunalDebug.scanForInventory = scanForInventory;
    window.TribunalDebug.toggleAddForm = toggleAddForm;
}
