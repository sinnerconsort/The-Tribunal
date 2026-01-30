/**
 * The Tribunal - Inventory Handlers
 * Evidence bags, consumption, and Electrochemistry's grip
 * 
 * "Your body knows what it needs. Trust it." — Electrochemistry
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS (to avoid circular dependencies)
// ═══════════════════════════════════════════════════════════════

let stateModule = null;
let statusModule = null;

async function ensureImports() {
    if (!stateModule) {
        try {
            stateModule = await import('../core/state.js');
        } catch (e) {
            console.warn('[Inventory] State module not available:', e);
        }
    }
    if (!statusModule) {
        try {
            statusModule = await import('../data/statuses.js');
        } catch (e) {
            console.warn('[Inventory] Status module not available:', e);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// LOCAL IMPORTS
// ═══════════════════════════════════════════════════════════════

import {
    INVENTORY_TYPES,
    INVENTORY_CATEGORIES,
    ADDICTION_TYPES,
    inferInventoryType,
    getItemCategory,
    isConsumable,
    isAddictive,
    getAddictionData,
    getAddictionMessage,
    getInventoryEmoji,
    createInventoryItem,
    DEFAULT_INVENTORY_STATE
} from '../data/inventory.js';

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let localState = { ...DEFAULT_INVENTORY_STATE };

function getInventoryState() {
    if (stateModule?.getChatState) {
        const chatState = stateModule.getChatState();
        if (chatState) {
            if (!chatState.inventory) {
                chatState.inventory = { ...DEFAULT_INVENTORY_STATE };
            }
            return chatState.inventory;
        }
    }
    return localState;
}

function saveState() {
    const state = getInventoryState();
    state.lastUpdated = Date.now();
    if (stateModule?.saveChatState) {
        stateModule.saveChatState();
    }
}

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

let uiState = {
    selectedItemId: null,
    isDetailOpen: false
};

// ═══════════════════════════════════════════════════════════════
// INVENTORY OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add item to inventory
 * @param {object} itemData - Item data (or just { name } for auto-generation)
 * @returns {object|null} Added item or null
 */
export function addInventoryItem(itemData) {
    const state = getInventoryState();
    
    // Check for existing item of same name to stack
    const existingIndex = state.items.findIndex(
        i => i.name.toLowerCase() === itemData.name.toLowerCase()
    );
    
    if (existingIndex !== -1) {
        // Stack quantity
        const quantity = itemData.quantity || 1;
        state.items[existingIndex].quantity += quantity;
        saveState();
        refreshDisplay();
        return state.items[existingIndex];
    }
    
    // Create new item
    const newItem = createInventoryItem(itemData);
    state.items.push(newItem);
    saveState();
    refreshDisplay();
    return newItem;
}

/**
 * Remove item from inventory (or reduce quantity)
 * @param {string} itemId - Item ID
 * @param {number} quantity - Amount to remove (default: all)
 * @returns {object|null} Removed/modified item
 */
export function removeInventoryItem(itemId, quantity = null) {
    const state = getInventoryState();
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    
    const item = state.items[idx];
    
    if (quantity === null || quantity >= item.quantity) {
        // Remove entirely
        state.items.splice(idx, 1);
        if (uiState.selectedItemId === itemId) {
            closeDetailPanel();
        }
    } else {
        // Reduce quantity
        item.quantity -= quantity;
    }
    
    saveState();
    refreshDisplay();
    return item;
}

/**
 * Get item by ID
 * @param {string} itemId - Item ID
 * @returns {object|null} Item or null
 */
export function getInventoryItem(itemId) {
    const state = getInventoryState();
    return state.items.find(i => i.id === itemId) || null;
}

/**
 * Get all items in a category
 * @param {string} category - 'consumable' or 'misc'
 * @returns {array} Items in category
 */
export function getItemsByCategory(category) {
    const state = getInventoryState();
    return state.items.filter(i => i.category === category);
}

/**
 * Find items by addiction type
 * @param {string} addictionType - 'nicotine', 'alcohol', 'stimulants'
 * @returns {array} Matching items
 */
export function getItemsByAddictionType(addictionType) {
    const state = getInventoryState();
    return state.items.filter(i => i.addictionType === addictionType && i.quantity > 0);
}

// ═══════════════════════════════════════════════════════════════
// CONSUMPTION SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Consume an item
 * @param {string} itemId - Item ID
 * @param {boolean} isAutoConsume - Whether this is an addiction-triggered auto-consume
 * @returns {object|null} Consumption result
 */
export async function consumeItem(itemId, isAutoConsume = false) {
    await ensureImports();
    
    const item = getInventoryItem(itemId);
    if (!item || item.quantity <= 0) return null;
    if (!isConsumable(item.type)) return null;
    
    const typeData = INVENTORY_TYPES[item.type];
    const result = {
        item,
        statusApplied: null,
        healthRestored: 0,
        moraleRestored: 0,
        electrochemistryMessage: null,
        isAutoConsume
    };
    
    // Reduce quantity
    item.quantity -= 1;
    
    // Apply status effect if applicable
    if (typeData.statusId && statusModule?.STATUS_EFFECTS) {
        result.statusApplied = typeData.statusId;
        
        // Track active effect for duration/addiction
        const state = getInventoryState();
        const duration = item.effect?.duration || typeData.defaultDuration || 3;
        
        // Remove existing effect of same type
        state.activeEffects = state.activeEffects.filter(e => e.statusId !== typeData.statusId);
        
        // Add new effect
        state.activeEffects.push({
            itemId: item.id,
            itemName: item.name,
            statusId: typeData.statusId,
            remainingDuration: duration,
            addictionType: item.addictionType,
            startedAt: Date.now()
        });
        
        // Get satisfaction message
        if (item.addictionType) {
            result.electrochemistryMessage = getAddictionMessage(item.addictionType, 'satisfied');
        }
    }
    
    // Apply health/morale restoration
    if (typeData.healthRestore && stateModule?.applyHealing) {
        result.healthRestored = typeData.healthRestore;
        stateModule.applyHealing(typeData.healthRestore, 'health');
    }
    if (typeData.moraleRestore && stateModule?.applyHealing) {
        result.moraleRestored = typeData.moraleRestore;
        stateModule.applyHealing(typeData.moraleRestore, 'morale');
    }
    
    // Remove item if depleted
    if (item.quantity <= 0) {
        removeInventoryItem(itemId, null);
        
        // Despair message if addictive and no more left
        if (item.addictionType) {
            const moreOfType = getItemsByAddictionType(item.addictionType);
            if (moreOfType.length === 0) {
                result.emptyMessage = getAddictionMessage(item.addictionType, 'empty');
            }
        }
    }
    
    saveState();
    refreshDisplay();
    
    // Show toast
    const toastMsg = isAutoConsume 
        ? `ELECTROCHEMISTRY: ${item.name} consumed automatically`
        : `Consumed: ${item.name}`;
    toast(toastMsg, 'success');
    
    return result;
}

/**
 * Process effect duration tick (call after each message)
 * Handles addiction auto-consume when effects expire
 */
export async function tickEffectDurations() {
    await ensureImports();
    
    const state = getInventoryState();
    const expiredEffects = [];
    
    // Tick down all active effects
    for (const effect of state.activeEffects) {
        effect.remainingDuration -= 1;
        if (effect.remainingDuration <= 0) {
            expiredEffects.push(effect);
        }
    }
    
    // Remove expired effects
    state.activeEffects = state.activeEffects.filter(e => e.remainingDuration > 0);
    
    // Handle addiction auto-consume for expired effects
    for (const expired of expiredEffects) {
        if (expired.addictionType && state.addictionSettings.autoConsume) {
            await handleAddictionAutoConsume(expired.addictionType);
        }
    }
    
    saveState();
    refreshDisplay();
}

/**
 * Handle Electrochemistry's auto-consume when effect expires
 * @param {string} addictionType - Type of addiction
 */
async function handleAddictionAutoConsume(addictionType) {
    const items = getItemsByAddictionType(addictionType);
    
    if (items.length === 0) {
        // No items left - show craving message
        const message = getAddictionMessage(addictionType, 'empty');
        showElectrochemistryNotification(message, 'craving');
        return;
    }
    
    // Pick first available item
    const item = items[0];
    
    // Show auto-consume message
    const message = getAddictionMessage(addictionType, 'autoConsume');
    showElectrochemistryNotification(message, 'autoConsume');
    
    // Consume after brief delay for dramatic effect
    setTimeout(async () => {
        await consumeItem(item.id, true);
    }, 500);
}

/**
 * Show Electrochemistry notification
 * @param {string} message - Message text
 * @param {string} type - 'autoConsume', 'craving', 'satisfied'
 */
function showElectrochemistryNotification(message, type) {
    // Use toastr if available, otherwise log
    const title = 'ELECTROCHEMISTRY';
    
    if (typeof toastr !== 'undefined') {
        const opts = { timeOut: 5000, positionClass: 'toast-top-center' };
        if (type === 'craving') {
            toastr.warning(message, title, opts);
        } else {
            toastr.info(message, title, opts);
        }
    }
    
    console.log(`[Inventory] ${title}: ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// CURRENCY
// ═══════════════════════════════════════════════════════════════

/**
 * Update currency amount
 * @param {number} delta - Amount to add (negative to subtract)
 */
export function updateCurrency(delta) {
    const state = getInventoryState();
    state.currency = Math.max(0, (state.currency || 0) + delta);
    saveState();
    refreshCurrencyDisplay();
}

/**
 * Set currency amount
 * @param {number} amount - New amount
 */
export function setCurrency(amount) {
    const state = getInventoryState();
    state.currency = Math.max(0, amount);
    saveState();
    refreshCurrencyDisplay();
}

/**
 * Get current currency
 * @returns {number}
 */
export function getCurrency() {
    return getInventoryState().currency || 0;
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Main display refresh
 */
export function refreshDisplay() {
    renderConsumablesGrid();
    renderMiscGrid();
    refreshCurrencyDisplay();
    updateActiveEffectsDisplay();
}

/**
 * Render consumables evidence bags
 */
function renderConsumablesGrid() {
    const grid = document.getElementById('ie-consumables-grid');
    if (!grid) return;
    
    const items = getItemsByCategory('consumable');
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="inv-evidence-empty">No items</p>';
        return;
    }
    
    grid.innerHTML = items.map(item => renderEvidenceBag(item)).join('');
    attachBagHandlers(grid);
}

/**
 * Render miscellaneous evidence bags
 */
function renderMiscGrid() {
    const grid = document.getElementById('ie-misc-grid');
    if (!grid) return;
    
    const items = getItemsByCategory('misc');
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="inv-evidence-empty">No items</p>';
        return;
    }
    
    grid.innerHTML = items.map(item => renderEvidenceBag(item)).join('');
    attachBagHandlers(grid);
}

/**
 * Render a single evidence bag
 * @param {object} item - Item data
 * @returns {string} HTML
 */
function renderEvidenceBag(item) {
    const emoji = getInventoryEmoji(item.type);
    const quantityDisplay = item.quantity > 1 ? `${item.quantity}×` : '';
    const isSelected = uiState.selectedItemId === item.id;
    const addictiveClass = item.addictive ? 'addictive' : '';
    const activeEffect = getActiveEffectForItem(item);
    const activeClass = activeEffect ? 'active-effect' : '';
    
    return `
        <div class="inv-evidence-bag ${isSelected ? 'selected' : ''} ${addictiveClass} ${activeClass}" 
             data-item-id="${item.id}">
            <div class="inv-evidence-bag-top">
                <div class="inv-evidence-bag-seal"></div>
            </div>
            <div class="inv-evidence-bag-content">
                <span class="inv-evidence-bag-emoji">${emoji}</span>
                <span class="inv-evidence-bag-name">${quantityDisplay} ${item.name}</span>
            </div>
            ${activeEffect ? `<div class="inv-evidence-bag-timer">${activeEffect.remainingDuration}</div>` : ''}
        </div>
    `;
}

/**
 * Attach click handlers to evidence bags
 * @param {HTMLElement} container - Grid container
 */
function attachBagHandlers(container) {
    container.querySelectorAll('.inv-evidence-bag').forEach(bag => {
        bag.addEventListener('click', () => {
            const itemId = bag.dataset.itemId;
            selectItem(itemId);
        });
    });
}

/**
 * Select an item and show detail panel
 * @param {string} itemId - Item ID
 */
function selectItem(itemId) {
    const item = getInventoryItem(itemId);
    if (!item) return;
    
    uiState.selectedItemId = itemId;
    uiState.isDetailOpen = true;
    
    // Update selected state in grids
    document.querySelectorAll('.inv-evidence-bag').forEach(bag => {
        bag.classList.toggle('selected', bag.dataset.itemId === itemId);
    });
    
    showDetailPanel(item);
}

/**
 * Show item detail panel
 * @param {object} item - Item data
 */
function showDetailPanel(item) {
    const panel = document.getElementById('ie-item-detail');
    const iconEl = document.getElementById('ie-detail-icon');
    const nameEl = document.getElementById('ie-detail-name');
    const descEl = document.getElementById('ie-detail-desc');
    const effectEl = document.getElementById('ie-detail-effect');
    const consumeBtn = document.getElementById('ie-consume-btn');
    
    if (!panel) return;
    
    // Populate data
    iconEl.textContent = getInventoryEmoji(item.type);
    nameEl.textContent = item.quantity > 1 ? `${item.quantity}× ${item.name}` : item.name;
    descEl.textContent = item.description || 'No description available.';
    
    // Effect info
    let effectHtml = '';
    const typeData = INVENTORY_TYPES[item.type];
    
    if (typeData?.statusId) {
        effectHtml = `<div class="inv-effect-status">Applies: <strong>${formatStatusName(typeData.statusId)}</strong></div>`;
    }
    if (typeData?.healthRestore) {
        effectHtml += `<div class="inv-effect-health">+${typeData.healthRestore} Health</div>`;
    }
    if (typeData?.moraleRestore) {
        effectHtml += `<div class="inv-effect-morale">+${typeData.moraleRestore} Morale</div>`;
    }
    if (item.addictive) {
        effectHtml += `<div class="inv-effect-warning">⚠️ Addictive</div>`;
    }
    
    // Voice quips
    if (item.voiceQuips && item.voiceQuips.length > 0) {
        effectHtml += '<div class="inv-quips">';
        for (const quip of item.voiceQuips) {
            const approvalClass = quip.approves ? 'approves' : 'disapproves';
            effectHtml += `
                <div class="inv-quip ${approvalClass}">
                    <span class="inv-quip-skill">${formatSkillName(quip.skill)}:</span>
                    <span class="inv-quip-text">"${quip.text}"</span>
                </div>
            `;
        }
        effectHtml += '</div>';
    }
    
    effectEl.innerHTML = effectHtml;
    
    // Show/hide consume button
    if (isConsumable(item.type)) {
        consumeBtn.style.display = 'block';
        consumeBtn.onclick = () => consumeItem(item.id);
    } else {
        consumeBtn.style.display = 'none';
    }
    
    panel.style.display = 'block';
}

/**
 * Close detail panel
 */
function closeDetailPanel() {
    uiState.selectedItemId = null;
    uiState.isDetailOpen = false;
    
    const panel = document.getElementById('ie-item-detail');
    if (panel) panel.style.display = 'none';
    
    document.querySelectorAll('.inv-evidence-bag').forEach(bag => {
        bag.classList.remove('selected');
    });
}

/**
 * Refresh currency display
 */
function refreshCurrencyDisplay() {
    const valueEl = document.getElementById('ie-currency-value');
    if (valueEl) {
        const currency = getCurrency();
        valueEl.textContent = currency.toFixed(2);
    }
}

/**
 * Update active effects display (timers on bags)
 */
function updateActiveEffectsDisplay() {
    const state = getInventoryState();
    
    document.querySelectorAll('.inv-evidence-bag').forEach(bag => {
        const itemId = bag.dataset.itemId;
        const effect = state.activeEffects.find(e => e.itemId === itemId);
        
        const timerEl = bag.querySelector('.inv-evidence-bag-timer');
        if (effect) {
            bag.classList.add('active-effect');
            if (timerEl) {
                timerEl.textContent = effect.remainingDuration;
            }
        } else {
            bag.classList.remove('active-effect');
            if (timerEl) timerEl.remove();
        }
    });
}

/**
 * Get active effect for an item
 * @param {object} item - Item data
 * @returns {object|null} Active effect or null
 */
function getActiveEffectForItem(item) {
    const state = getInventoryState();
    const typeData = INVENTORY_TYPES[item.type];
    if (!typeData?.statusId) return null;
    return state.activeEffects.find(e => e.statusId === typeData.statusId) || null;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatStatusName(statusId) {
    return statusId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatSkillName(skill) {
    return skill
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function toast(msg, type = 'info') {
    if (typeof toastr !== 'undefined') {
        toastr[type](msg, 'Inventory');
    } else {
        console.log(`[Inventory] ${type}: ${msg}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize inventory handlers
 */
export async function initInventoryHandlers() {
    console.log('[Inventory] Initializing handlers...');
    
    await ensureImports();
    
    // Close button handler
    const closeBtn = document.getElementById('ie-detail-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailPanel);
    }
    
    // Initial render
    refreshDisplay();
    
    console.log('[Inventory] ✅ Handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR EXTERNAL USE
// ═══════════════════════════════════════════════════════════════

export {
    getInventoryState,
    refreshDisplay as refreshInventoryDisplay
};
