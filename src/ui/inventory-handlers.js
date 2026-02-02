/**
 * The Tribunal - Inventory Handlers
 * State management, item operations, and UI rendering
 * 
 * FIXED: Added resetLocalState() and onChatChanged() for proper chat switching
 * NEW: AI-powered scan that checks persona + chat context (like RPG Companion)
 * 
 * Mirrors equipment-handlers.js patterns
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - loaded when needed
// ═══════════════════════════════════════════════════════════════

let eventSource = null;
let event_types = {};
let eventsLoaded = false;

async function loadEvents() {
    if (eventsLoaded) return;
    try {
        const script = await import('../../../../../script.js');
        eventSource = script.eventSource;
        event_types = script.event_types;
        eventsLoaded = true;
    } catch (e) {
        console.warn('[Inventory] Events not available:', e.message);
    }
}

// AI Extractor for smart scanning
let aiExtractor = null;
async function getAIExtractor() {
    if (aiExtractor) return aiExtractor;
    try {
        aiExtractor = await import('../systems/ai-extractor.js');
        return aiExtractor;
    } catch (e) {
        console.warn('[Inventory] AI Extractor not available:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// PERSONA + CHAT CONTEXT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the user's persona description
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
 * Get recent chat messages for context
 * @param {number} maxMessages - Maximum messages to include
 * @returns {string} Combined message text
 */
function getRecentChatContext(maxMessages = 10) {
    try {
        const context = window.SillyTavern?.getContext?.() || window.getContext?.();
        if (!context?.chat) return '';
        
        const messages = context.chat.slice(0, maxMessages);
        return messages
            .filter(m => m.mes)
            .map(m => m.mes)
            .join('\n\n');
    } catch (e) {
        console.warn('[Inventory] Could not get chat context:', e.message);
        return '';
    }
}

// Inventory data - inline defaults, will be overwritten if inventory.js loads
let INVENTORY_TYPES = {
    cigarette: { icon: '🚬', category: 'consumable' },
    alcohol: { icon: '🍺', category: 'consumable' },
    drug: { icon: '💊', category: 'consumable' },
    lighter: { icon: '🔥', category: 'tool' },
    weapon: { icon: '🔪', category: 'weapon' },
    money: { icon: '💰', category: 'valuable' },
    document: { icon: '📄', category: 'document' },
    other: { icon: '📦', category: 'misc' }
};

function inferInventoryType(name) {
    if (!name) return 'other';
    const lower = name.toLowerCase();
    if (/cigarette|cig|smoke|astra/.test(lower)) return 'cigarette';
    if (/beer|wine|whiskey|vodka|alcohol|booze/.test(lower)) return 'alcohol';
    if (/pill|drug|speed|pyrholidon/.test(lower)) return 'drug';
    if (/lighter|zippo|match/.test(lower)) return 'lighter';
    if (/gun|pistol|knife|weapon/.test(lower)) return 'weapon';
    if (/money|coin|cash|réal/.test(lower)) return 'money';
    if (/note|letter|document|photo/.test(lower)) return 'document';
    return 'other';
}

function isConsumable(type) {
    return ['cigarette', 'alcohol', 'drug', 'food', 'medicine'].includes(type);
}

function isAddictive(type) {
    return ['cigarette', 'alcohol', 'drug'].includes(type);
}

function getAddictionData(type) {
    const data = {
        cigarette: { name: 'Nicotine', withdrawalTime: 30 * 60 * 1000 },
        alcohol: { name: 'Alcohol', withdrawalTime: 60 * 60 * 1000 },
        drug: { name: 'Stimulants', withdrawalTime: 45 * 60 * 1000 }
    };
    return data[type] || null;
}

// Generation helpers - inline defaults
function normalizeStashKey(name) {
    return name?.toLowerCase().replace(/\s+/g, '_') || '';
}

async function generateSingleItem(name) {
    return { 
        name, 
        type: inferInventoryType(name), 
        category: isConsumable(inferInventoryType(name)) ? 'consumable' : 'misc',
        quantity: 1
    };
}

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let stateModule = null;
let stateLoaded = false;

async function loadStateModule() {
    if (stateLoaded) return;
    try {
        stateModule = await import('../core/state.js');
        stateLoaded = true;
        console.log('[Inventory] State module loaded');
    } catch (e) {
        console.warn('[Inventory] Using local state:', e.message);
        stateLoaded = true;
    }
}

let localState = {
    items: [],           // Active inventory items
    stash: {},           // Cached item data (like wardrobe)
    currency: 0,         // Réal
    addictions: {}       // { type: { level, lastFix, withdrawing } }
};

// ═══════════════════════════════════════════════════════════════
// CHAT SWITCH HANDLING (FIX)
// ═══════════════════════════════════════════════════════════════

/**
 * Reset local fallback state when switching chats
 * Prevents stale items from appearing if getChatState() temporarily returns null
 */
export function resetLocalState() {
    localState = {
        items: [],
        stash: {},
        currency: 0,
        addictions: {}
    };
    console.log('[Inventory] Local state reset');
}

/**
 * Full handler for chat switch - resets state and refreshes display
 */
export function onChatChanged() {
    // 1. Clear selection
    selectedItemId = null;
    
    // 2. Reset local fallback state to prevent bleed
    resetLocalState();
    
    // 3. Wait for chat_metadata to be fully updated, then refresh
    // 150ms gives ST time to update chat_metadata
    setTimeout(() => {
        refreshDisplay();
    }, 150);
    
    console.log('[Inventory] Chat changed, refreshing...');
}

// ═══════════════════════════════════════════════════════════════
// STATE ACCESSORS
// ═══════════════════════════════════════════════════════════════

// Empty fallback - NEVER contains real data, just prevents crashes
const EMPTY_INVENTORY = Object.freeze({
    items: [],
    stash: {},
    currency: 0,
    addictions: {}
});

function getInventoryState() {
    // Try to get from proper chat state
    if (stateModule?.getChatState) {
        const chatState = stateModule.getChatState();
        if (chatState) {
            if (!chatState.inventory) {
                chatState.inventory = { 
                    carried: [],    // Active items
                    worn: [],       // Equipped  
                    stored: [],     // Stashed
                    stash: {},      // Item data cache
                    money: 0,
                    moneyUnit: 'Réal',
                    addictions: {}
                };
            }
            // Ensure all fields exist (migration)
            if (!chatState.inventory.carried) chatState.inventory.carried = [];
            if (!chatState.inventory.stash) chatState.inventory.stash = {};
            if (!chatState.inventory.addictions) chatState.inventory.addictions = {};
            
            // Map 'carried' to 'items' interface for handlers
            return {
                get items() { return chatState.inventory.carried; },
                set items(v) { chatState.inventory.carried = v; },
                get stash() { return chatState.inventory.stash; },
                set stash(v) { chatState.inventory.stash = v; },
                get currency() { return chatState.inventory.money; },
                set currency(v) { chatState.inventory.money = v; },
                get addictions() { return chatState.inventory.addictions; },
                set addictions(v) { chatState.inventory.addictions = v; }
            };
        }
    }
    
    // NO CHAT AVAILABLE - return empty object, NOT localState!
    // This prevents cross-chat contamination
    console.log('[Inventory] No chat state - returning empty inventory');
    return EMPTY_INVENTORY;
}

function saveState() {
    if (stateModule?.saveChatState) stateModule.saveChatState();
}

// ═══════════════════════════════════════════════════════════════
// STASH (Item Data Cache)
// ═══════════════════════════════════════════════════════════════

export function getFromStash(name) {
    return getInventoryState().stash[normalizeStashKey(name)] || null;
}

export function saveToStash(item) {
    const state = getInventoryState();
    const key = normalizeStashKey(item.name);
    state.stash[key] = { ...item, stashKey: key, savedAt: Date.now() };
    saveState();
}

export function deleteFromStash(key) {
    const state = getInventoryState();
    if (state.stash[key]) {
        delete state.stash[key];
        saveState();
        return true;
    }
    return false;
}

export function getAllStashItems() {
    return Object.values(getInventoryState().stash);
}

// ═══════════════════════════════════════════════════════════════
// ITEM OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add item to inventory
 * @param {object} itemData - Item data from generation or stash
 * @param {number} quantity - How many to add (default 1)
 * @returns {object|null} The added item or null if duplicate
 */
export function addInventoryItem(itemData, quantity = 1) {
    const state = getInventoryState();
    
    // Defensive: ensure items array exists
    if (!state.items) {
        state.items = [];
    }
    
    const key = normalizeStashKey(itemData.name);
    
    // Check for existing item with same name
    const existing = state.items.find(i => normalizeStashKey(i.name) === key);
    if (existing) {
        // Stack quantity for consumables
        if (existing.category === 'consumable') {
            existing.quantity = (existing.quantity || 1) + quantity;
            saveState();
            return existing;
        }
        // Non-consumables don't stack
        return null;
    }
    
    // Ensure item is in stash
    if (!state.stash) state.stash = {};
    if (!state.stash[key]) {
        saveToStash(itemData);
    }
    
    // Create active inventory item
    const newItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...itemData,
        quantity: quantity,
        addedAt: Date.now()
    };
    
    state.items.push(newItem);
    saveState();
    
    console.log('[Inventory] Added:', newItem.name, 'x', quantity);
    return newItem;
}

/**
 * Remove item from inventory by ID
 */
export function removeInventoryItem(itemId) {
    const state = getInventoryState();
    if (!state.items) state.items = [];
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    
    const removed = state.items.splice(idx, 1)[0];
    saveState();
    
    console.log('[Inventory] Removed:', removed.name);
    return removed;
}

/**
 * Remove item from inventory by name (fuzzy match)
 */
export function removeInventoryItemByName(name) {
    const state = getInventoryState();
    const key = normalizeStashKey(name);
    
    const idx = state.items.findIndex(i => normalizeStashKey(i.name) === key);
    if (idx === -1) return null;
    
    const item = state.items[idx];
    
    // For consumables, decrement quantity
    if (item.category === 'consumable' && item.quantity > 1) {
        item.quantity--;
        saveState();
        console.log('[Inventory] Decremented:', item.name, 'now', item.quantity);
        return { ...item, removed: false };
    }
    
    // Remove entirely
    const removed = state.items.splice(idx, 1)[0];
    saveState();
    console.log('[Inventory] Removed:', removed.name);
    return { ...removed, removed: true };
}

/**
 * Consume an item (use it)
 * Handles addiction tracking for addictive items
 */
export function consumeItem(itemId) {
    const state = getInventoryState();
    if (!state.items) state.items = [];
    const item = state.items.find(i => i.id === itemId);
    
    if (!item) return { consumed: false, error: 'Item not found' };
    if (item.category !== 'consumable') return { consumed: false, error: 'Not consumable' };
    
    // Apply status effect via effects system
    let effectResult = null;
    if (window.TribunalEffects?.applyConsumptionEffect) {
        effectResult = window.TribunalEffects.applyConsumptionEffect(item.type, { item });
    }
    
    // Handle addiction tracking
    if (item.addictive || isAddictive(item.type)) {
        const addictionType = item.addictionType || item.type;
        if (!state.addictions) state.addictions = {};
        if (!state.addictions[addictionType]) {
            state.addictions[addictionType] = { level: 0, lastFix: 0, withdrawing: false };
        }
        state.addictions[addictionType].lastFix = Date.now();
        state.addictions[addictionType].withdrawing = false;
        // Increase addiction level slightly
        state.addictions[addictionType].level = Math.min(10, (state.addictions[addictionType].level || 0) + 0.5);
    }
    
    // Decrement or remove
    if (item.quantity > 1) {
        item.quantity--;
        saveState();
        return { 
            consumed: true, 
            remaining: item.quantity, 
            item,
            effect: effectResult
        };
    }
    
    // Remove last one
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx >= 0) state.items.splice(idx, 1);
    saveState();
    
    return { 
        consumed: true, 
        remaining: 0, 
        item,
        effect: effectResult
    };
}

/**
 * Get all items in inventory
 */
export function getInventoryItems() {
    return getInventoryState().items;
}

/**
 * Get items by category
 */
export function getItemsByCategory(category) {
    const state = getInventoryState();
    if (!state.items) state.items = [];
    return state.items.filter(i => i.category === category);
}

// ═══════════════════════════════════════════════════════════════
// CURRENCY
// ═══════════════════════════════════════════════════════════════

export function getCurrency() {
    return getInventoryState().currency || 0;
}

export function addCurrency(amount) {
    const state = getInventoryState();
    state.currency = (state.currency || 0) + amount;
    saveState();
    updateCurrencyDisplay();
    return state.currency;
}

export function spendCurrency(amount) {
    const state = getInventoryState();
    if ((state.currency || 0) < amount) return false;
    state.currency -= amount;
    saveState();
    updateCurrencyDisplay();
    return true;
}

function updateCurrencyDisplay() {
    const el = document.getElementById('ie-currency-value');
    if (el) {
        el.textContent = getCurrency().toFixed(2);
    }
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

let selectedItemId = null;

/**
 * Refresh the inventory display
 */
export function refreshDisplay() {
    renderConsumables();
    renderMiscItems();
    updateCurrencyDisplay();
    updateDetailPanel();
}

function renderConsumables() {
    const grid = document.getElementById('ie-consumables-grid');
    if (!grid) return;
    
    const items = getItemsByCategory('consumable');
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="inv-evidence-empty">No items</p>';
        return;
    }
    
    grid.innerHTML = '';
    for (const item of items) {
        grid.appendChild(createEvidenceBag(item));
    }
}

function renderMiscItems() {
    const grid = document.getElementById('ie-misc-grid');
    if (!grid) return;
    
    const items = getItemsByCategory('misc');
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="inv-evidence-empty">No items</p>';
        return;
    }
    
    grid.innerHTML = '';
    for (const item of items) {
        grid.appendChild(createEvidenceBag(item));
    }
}

/**
 * Create an evidence bag element for an item
 */
function createEvidenceBag(item) {
    const typeInfo = INVENTORY_TYPES[item.type] || INVENTORY_TYPES.other;
    const isSelected = selectedItemId === item.id;
    
    const bag = document.createElement('div');
    bag.className = `inv-evidence-bag ${isSelected ? 'selected' : ''} ${item.addictive ? 'addictive' : ''}`;
    bag.dataset.itemId = item.id;
    
    bag.innerHTML = `
        ${item.quantity > 1 ? `<span class="inv-evidence-qty">×${item.quantity}</span>` : ''}
        <span class="inv-evidence-icon">${typeInfo.icon || '📦'}</span>
        <span class="inv-evidence-name">${item.name}</span>
        <span class="inv-evidence-type">${item.type?.toUpperCase() || 'ITEM'}</span>
    `;
    
    bag.addEventListener('click', () => selectItem(item.id));
    
    return bag;
}

/**
 * Select an item to show details
 */
function selectItem(itemId) {
    selectedItemId = selectedItemId === itemId ? null : itemId;
    refreshDisplay();
}

/**
 * Update the detail panel
 */
function updateDetailPanel() {
    const panel = document.getElementById('ie-item-detail');
    const consumeBtn = document.getElementById('ie-consume-btn');
    
    if (!panel) return;
    
    if (!selectedItemId) {
        panel.style.display = 'none';
        return;
    }
    
    const item = getInventoryState().items.find(i => i.id === selectedItemId);
    if (!item) {
        panel.style.display = 'none';
        selectedItemId = null;
        return;
    }
    
    const typeInfo = INVENTORY_TYPES[item.type] || INVENTORY_TYPES.other;
    
    // Update panel content
    document.getElementById('ie-detail-icon').textContent = typeInfo.icon || '📦';
    document.getElementById('ie-detail-name').textContent = item.name;
    document.getElementById('ie-detail-desc').textContent = item.description || 'No description.';
    
    // Status effect preview (what will happen when consumed)
    const statsEl = document.getElementById('ie-detail-stats');
    if (statsEl && item.category === 'consumable') {
        const effectPreview = getEffectPreview(item.type);
        if (effectPreview) {
            statsEl.innerHTML = effectPreview;
            statsEl.style.display = 'block';
        } else {
            statsEl.style.display = 'none';
        }
    } else if (statsEl) {
        statsEl.style.display = 'none';
    }
    
    // Voice quips
    const effectEl = document.getElementById('ie-detail-effect');
    if (item.voiceQuips && item.voiceQuips.length > 0) {
        effectEl.innerHTML = item.voiceQuips.map(q => `
            <div class="inv-detail-quip ${q.approves ? 'approves' : 'disapproves'}">
                <span class="inv-quip-skill">${formatSkillName(q.skill)}:</span>
                <span class="inv-quip-text">"${q.text}"</span>
            </div>
        `).join('');
    } else {
        effectEl.innerHTML = '';
    }
    
    // Consume button
    if (consumeBtn) {
        consumeBtn.style.display = item.category === 'consumable' ? 'block' : 'none';
    }
    
    panel.style.display = 'block';
}

/**
 * Get preview of what status effect an item will apply
 */
function getEffectPreview(itemType) {
    // Try to get from TribunalEffects
    const effectConfig = window.TribunalEffects?.CONSUMPTION_EFFECTS?.[itemType];
    if (!effectConfig || !effectConfig.statusId) return null;
    
    // Get status data - try window.TribunalStatuses or inline fallback
    const STATUS_EFFECTS = window.TribunalStatuses?.STATUS_EFFECTS || getInlineStatusEffects();
    const status = STATUS_EFFECTS[effectConfig.statusId];
    if (!status) return null;
    
    const boosts = (status.boosts || []).map(s => `<span class="stat-boost">+1 ${formatSkillName(s)}</span>`);
    const debuffs = (status.debuffs || []).map(s => `<span class="stat-debuff">-1 ${formatSkillName(s)}</span>`);
    
    // Use message count (duration field is now message count)
    const messages = effectConfig.duration || effectConfig.messages || 6;
    
    // Show what this clears if anything
    const clearsText = (effectConfig.clears && effectConfig.clears.length > 0) 
        ? `<div class="inv-effect-clears">Clears: ${effectConfig.clears.map(getWithdrawalName).join(', ')}</div>` 
        : '';
    
    return `
        <div class="inv-effect-preview">
            <div class="inv-effect-name">${status.name}</div>
            <div class="inv-effect-duration">${messages} messages</div>
            ${clearsText}
            <div class="inv-effect-stats">
                ${boosts.join(' ')}
                ${debuffs.join(' ')}
            </div>
        </div>
    `;
}

/**
 * Fallback status effects if module not loaded
 */
function getInlineStatusEffects() {
    return {
        nicotine_rush: {
            name: 'Nicotine Rush',
            boosts: ['composure', 'volition', 'conceptualization', 'logic'],
            debuffs: ['endurance']
        },
        revacholian_courage: {
            name: 'Revacholian Courage',
            boosts: ['electrochemistry', 'inland_empire', 'drama', 'suggestion', 'physical_instrument'],
            debuffs: ['logic', 'hand_eye_coordination', 'reaction_speed', 'composure']
        },
        pyrholidon: {
            name: 'Pyrholidon',
            boosts: ['reaction_speed', 'perception', 'logic', 'visual_calculus', 'volition'],
            debuffs: ['composure', 'empathy', 'inland_empire']
        }
    };
}

function formatSkillName(skill) {
    return skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function initDetailPanelHandlers() {
    // Close button
    document.getElementById('ie-detail-close')?.addEventListener('click', () => {
        selectedItemId = null;
        refreshDisplay();
    });
    
    // Consume button
    document.getElementById('ie-consume-btn')?.addEventListener('click', () => {
        if (!selectedItemId) return;
        
        const result = consumeItem(selectedItemId);
        if (result?.consumed) {
            // Show cleared effects toast first
            const clearedEffects = result.effect?.clearedEffects || [];
            if (clearedEffects.length > 0) {
                const clearedNames = clearedEffects.map(getWithdrawalName).join(', ');
                toast(`${clearedNames} cleared`, 'success');
            }
            
            // Show effect toast with Electrochemistry quote
            if (result.effect?.electrochemistryQuote) {
                // Fancy DE-style toast
                setTimeout(() => {
                    toastWithVoice(
                        result.effect.electrochemistryQuote,
                        'electrochemistry',
                        result.effect.effect?.name || 'Effect applied'
                    );
                }, clearedEffects.length > 0 ? 500 : 0);
            } else {
                toast(`Used: ${result.item.name}`, 'success');
            }
            
            // Show remaining messages info
            if (result.effect?.remainingMessages) {
                setTimeout(() => {
                    toast(`${result.effect.effect?.name || result.effect.statusId} (${result.effect.remainingMessages} msgs)`, 'info');
                }, 600);
            }
            
            if (result.remaining === 0) {
                selectedItemId = null;
            }
            refreshDisplay();
        }
    });
}

/**
 * Get human-readable name for status effects
 */
function getWithdrawalName(statusId) {
    const names = {
        'volumetric_shit_compressor': 'Hangover',
        'waste_land': 'Exhaustion',
        'finger_on_the_eject_button': 'Wounded'
    };
    return names[statusId] || statusId;
}

/**
 * Show toast with skill voice flavor
 */
function toastWithVoice(quote, skillId, title) {
    // Try to use existing toast system with voice styling
    if (typeof toastr !== 'undefined') {
        const msg = `<div class="inv-voice-toast">
            <span class="inv-voice-skill">${formatSkillName(skillId)}:</span>
            <span class="inv-voice-quote">"${quote}"</span>
        </div>`;
        toastr.info(msg, title, { 
            timeOut: 4000,
            escapeHtml: false 
        });
    } else {
        console.log(`[${skillId}] "${quote}"`);
    }
}

function toast(msg, type = 'info') {
    if (typeof toastr !== 'undefined') {
        toastr[type](msg, 'Inventory');
    } else {
        console.log(`[Inventory] ${type}: ${msg}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// AI-POWERED INVENTORY SCAN (like RPG Companion's Refresh)
// Scans persona + chat context for items
// ═══════════════════════════════════════════════════════════════

/**
 * Scan persona AND chat context for inventory items
 * This mimics RPG Companion's multi-source scanning behavior
 */
export async function scanForInventory() {
    toast('AI scanning for inventory...', 'info');
    
    const persona = findUserPersona();
    const chatContext = getRecentChatContext(10);
    
    if (!persona && !chatContext) {
        toast('No persona or chat context found!', 'warning');
        return;
    }
    
    const extractor = await getAIExtractor();
    if (!extractor) {
        toast('AI Extractor not available', 'error');
        return;
    }
    
    // Check if we have a valid chat state
    if (!stateModule?.getChatState) {
        await loadStateModule();
    }
    
    const chatState = stateModule?.getChatState?.();
    if (!chatState) {
        toast('No active chat - open a chat first!', 'warning');
        return;
    }
    
    try {
        // Use combined extraction (persona + chat)
        const items = await extractor.extractInventoryFromContext(persona, chatContext);
        
        if (!items || items.length === 0) {
            toast('No items found', 'info');
            return;
        }
        
        // Get state (will create inventory structure if needed)
        const state = getInventoryState();
        
        // Double-check we have a mutable state
        if (Object.isFrozen(state) || Object.isFrozen(state.items)) {
            toast('No active chat - cannot save items', 'warning');
            return;
        }
        
        // Add items that don't already exist
        let added = 0;
        let skipped = 0;
        
        const existingNames = state.items.map(i => i.name.toLowerCase());
        
        for (const item of items) {
            // Check for duplicates
            if (existingNames.includes(item.name.toLowerCase())) {
                skipped++;
                continue;
            }
            
            // Create proper item structure
            const newItem = {
                id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: item.name,
                type: item.type || inferInventoryType(item.name),
                category: isConsumable(item.type || inferInventoryType(item.name)) ? 'consumable' : 'misc',
                quantity: item.quantity || 1,
                description: item.reason || null,
                source: 'ai-scan',
                addedAt: Date.now()
            };
            
            state.items.push(newItem);
            existingNames.push(item.name.toLowerCase());
            added++;
        }
        
        if (added > 0) {
            saveState();
            refreshDisplay();
            toast(`Added ${added} item${added !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} already had)` : ''}`, 'success');
        } else {
            toast(`All ${items.length} items already in inventory`, 'info');
        }
        
    } catch (error) {
        console.error('[Inventory] Scan error:', error);
        toast('Scan failed: ' + error.message, 'error');
    }
}

/**
 * Initialize scan button handler
 */
function initScanButton() {
    const scanBtn = document.getElementById('ie-scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', scanForInventory);
    }
    
    // Also check for alternative button IDs
    const altScanBtn = document.getElementById('inv-scan-persona');
    if (altScanBtn) {
        altScanBtn.addEventListener('click', scanForInventory);
    }
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE_RECEIVED AUTO-EXTRACTION
// ═══════════════════════════════════════════════════════════════

let autoExtractEnabled = true;

/**
 * Handle incoming AI message for auto-extraction
 */
async function onMessageReceived(messageIndex) {
    if (!autoExtractEnabled) return;
    
    try {
        const context = window.SillyTavern?.getContext?.();
        if (!context?.chat) return;
        
        const message = context.chat[messageIndex];
        if (!message || message.is_user) return;
        
        // processMessageForInventory should be imported or available globally
        if (typeof processMessageForInventory !== 'function') {
            console.warn('[Inventory] processMessageForInventory not available');
            return;
        }
        
        const { toAdd, toRemove } = await processMessageForInventory(message.mes, {
            getFromStash,
            saveToStash
        });
        
        let changes = false;
        
        // Add new items
        for (const itemData of toAdd) {
            const result = addInventoryItem(itemData);
            if (result) {
                changes = true;
                console.log('[Inventory] Auto-added:', itemData.name);
            }
        }
        
        // Remove lost items
        for (const name of toRemove) {
            const result = removeInventoryItemByName(name);
            if (result) {
                changes = true;
                console.log('[Inventory] Auto-removed:', name);
            }
        }
        
        if (changes) {
            refreshDisplay();
        }
        
    } catch (error) {
        console.error('[Inventory] Auto-extract error:', error);
    }
}

export function setAutoExtract(enabled) {
    autoExtractEnabled = enabled;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export async function initInventoryHandlers() {
    console.log('[Inventory] Initializing handlers...');
    
    // Load dependencies
    await loadEvents();
    await loadStateModule();
    
    initDetailPanelHandlers();
    initScanButton();
    
    // Hook MESSAGE_RECEIVED for auto-extraction
    if (eventSource && event_types?.MESSAGE_RECEIVED) {
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        console.log('[Inventory] MESSAGE_RECEIVED hook registered');
    } else {
        console.warn('[Inventory] Events not available, auto-extraction disabled');
    }
    
    // Hook CHAT_CHANGED to refresh display (FIXED: use onChatChanged)
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
        console.log('[Inventory] CHAT_CHANGED hook registered');
    }
    
    // Initial render
    refreshDisplay();
    
    console.log('[Inventory] ✅ Handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    // State
    getInventoryState,
    getInventoryItems,
    getItemsByCategory,
    
    // Stash
    getFromStash,
    saveToStash,
    deleteFromStash,
    getAllStashItems,
    
    // Item operations
    addInventoryItem,
    removeInventoryItem,
    removeInventoryItemByName,
    consumeItem,
    
    // Currency
    getCurrency,
    addCurrency,
    spendCurrency,
    
    // UI
    refreshDisplay,
    
    // Scanning
    scanForInventory,
    
    // Config
    setAutoExtract,
    
    // Init
    initInventoryHandlers,
    
    // Chat switch (NEW)
    resetLocalState,
    onChatChanged
};
