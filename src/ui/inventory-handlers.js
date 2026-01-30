/**
 * The Tribunal - Inventory Handlers
 * State management, item operations, and UI rendering
 * 
 * Mirrors equipment-handlers.js patterns
 */

import { eventSource, event_types } from '../../../../../../script.js';
import { 
    INVENTORY_TYPES, 
    inferInventoryType, 
    isConsumable, 
    isAddictive, 
    getAddictionData 
} from '../data/inventory.js';
import { 
    normalizeStashKey, 
    generateSingleItem,
    processMessageForInventory 
} from '../voice/inventory-generation.js';

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let stateModule = null;
try {
    stateModule = await import('../core/state.js');
} catch (e) {
    console.warn('[Inventory] Using local state');
}

let localState = {
    items: [],           // Active inventory items
    stash: {},           // Cached item data (like wardrobe)
    currency: 0,         // Réal
    addictions: {}       // { type: { level, lastFix, withdrawing } }
};

function getInventoryState() {
    if (stateModule?.getChatState) {
        const chatState = stateModule.getChatState();
        if (chatState) {
            if (!chatState.inventory) {
                chatState.inventory = { 
                    items: [], 
                    stash: {}, 
                    currency: 0,
                    addictions: {}
                };
            }
            if (!chatState.inventory.stash) chatState.inventory.stash = {};
            if (!chatState.inventory.addictions) chatState.inventory.addictions = {};
            return chatState.inventory;
        }
    }
    return localState;
}

function saveState() {
    if (stateModule?.saveState) stateModule.saveState();
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
    const item = state.items.find(i => i.id === itemId);
    
    if (!item) return null;
    if (!item.category === 'consumable') return null;
    
    // Handle addiction
    if (item.addictive && item.addictionType) {
        const addictionType = item.addictionType;
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
        return { consumed: true, remaining: item.quantity, item };
    }
    
    // Remove last one
    const idx = state.items.findIndex(i => i.id === itemId);
    state.items.splice(idx, 1);
    saveState();
    
    return { consumed: true, remaining: 0, item };
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
    return getInventoryState().items.filter(i => i.category === category);
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
        <div class="inv-evidence-bag-top"></div>
        <div class="inv-evidence-bag-content">
            <span class="inv-evidence-icon">${typeInfo.icon || '📦'}</span>
            <span class="inv-evidence-name">${item.name}</span>
            ${item.quantity > 1 ? `<span class="inv-evidence-qty">×${item.quantity}</span>` : ''}
        </div>
        <div class="inv-evidence-label">${item.type.toUpperCase()}</div>
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
    
    // Effect/quips
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
            toast(`Used: ${result.item.name}`, 'success');
            if (result.remaining === 0) {
                selectedItemId = null;
            }
            refreshDisplay();
        }
    });
}

function toast(msg, type = 'info') {
    if (typeof toastr !== 'undefined') {
        toastr[type](msg, 'Inventory');
    } else {
        console.log(`[Inventory] ${type}: ${msg}`);
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

export function initInventoryHandlers() {
    console.log('[Inventory] Initializing handlers...');
    
    initDetailPanelHandlers();
    
    // Hook MESSAGE_RECEIVED for auto-extraction
    if (eventSource && event_types?.MESSAGE_RECEIVED) {
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        console.log('[Inventory] MESSAGE_RECEIVED hook registered');
    }
    
    // Hook CHAT_CHANGED to refresh display
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            selectedItemId = null;
            setTimeout(refreshDisplay, 100);
        });
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
    
    // Config
    setAutoExtract,
    
    // Init
    initInventoryHandlers
};
