/**
 * The Tribunal - Equipment Handlers
 * Martinaise Cleaners ticket system with WARDROBE HISTORY
 * 
 * WARDROBE SYSTEM:
 * - Items are generated ONCE, then cached in wardrobe forever
 * - Remove item = moves to wardrobe (still saved)
 * - Re-add same item = instant from cache (no API call)
 * - Only truly NEW items need generation
 */

import { getContext } from '../../../../../extensions.js';
import { eventSource, event_types } from '../../../../../../script.js';

import {
    normalizeWardrobeKey,
    quickExtractItemNames,
    generateSingleItem,
    generateMultipleItems
} from '../voice/equipment-generation.js';

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// We need to integrate with your existing state.js
// For now, this shows the structure - adapt to your state system
// ═══════════════════════════════════════════════════════════════

// Try to import from state, fallback to local
let stateModule = null;
try {
    stateModule = await import('../core/state.js');
} catch (e) {
    console.warn('[Equipment] Could not import state module, using local state');
}

// Local state fallback
let localEquipmentState = {
    ticketNumber: generateTicketNumber(),
    items: [],      // Active items on the ticket
    wardrobe: {}    // All items ever generated (permanent cache)
};

function generateTicketNumber() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Get equipment state (integrates with your state.js)
 */
function getEquipmentState() {
    if (stateModule?.getChatState) {
        const chatState = stateModule.getChatState();
        if (chatState) {
            // Initialize equipment structure if missing
            if (!chatState.equipment) {
                chatState.equipment = {
                    ticketNumber: generateTicketNumber(),
                    items: [],
                    wardrobe: {}
                };
            }
            // Ensure wardrobe exists (for older saves)
            if (!chatState.equipment.wardrobe) {
                chatState.equipment.wardrobe = {};
            }
            return chatState.equipment;
        }
    }
    return localEquipmentState;
}

/**
 * Save state (triggers your persistence)
 */
function saveEquipmentState() {
    if (stateModule?.saveState) {
        stateModule.saveState();
    }
}

// ═══════════════════════════════════════════════════════════════
// WARDROBE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if item exists in wardrobe
 */
function getFromWardrobe(itemName) {
    const state = getEquipmentState();
    const key = normalizeWardrobeKey(itemName);
    return state.wardrobe[key] || null;
}

/**
 * Save item to wardrobe (permanent cache)
 */
function saveToWardrobe(item) {
    const state = getEquipmentState();
    const key = normalizeWardrobeKey(item.name);
    state.wardrobe[key] = {
        ...item,
        wardrobeKey: key,
        savedAt: Date.now()
    };
    console.log('[Equipment] Saved to wardrobe:', key);
    saveEquipmentState();
}

/**
 * Get all items from wardrobe (for browsing)
 */
function getAllWardrobeItems() {
    const state = getEquipmentState();
    return Object.values(state.wardrobe);
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE ITEMS OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add item to active ticket
 * Checks wardrobe first, generates if not found
 */
async function addItemToTicket(itemNameOrData, options = {}) {
    const state = getEquipmentState();
    const { skipGeneration = false, equipped = true } = options;
    
    // If we received a full item object
    if (typeof itemNameOrData === 'object' && itemNameOrData.name) {
        const item = itemNameOrData;
        const key = normalizeWardrobeKey(item.name);
        
        // Check if already on ticket
        if (state.items.some(i => normalizeWardrobeKey(i.name) === key)) {
            console.log('[Equipment] Already on ticket:', item.name);
            return null;
        }
        
        // Save to wardrobe if not there
        if (!state.wardrobe[key]) {
            saveToWardrobe(item);
        }
        
        // Add to active items
        const activeItem = {
            id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...item,
            equipped,
            addedAt: Date.now()
        };
        
        state.items.push(activeItem);
        saveEquipmentState();
        console.log('[Equipment] ✓ Added to ticket:', activeItem.name);
        return activeItem;
    }
    
    // If we received just a name
    const itemName = itemNameOrData;
    const key = normalizeWardrobeKey(itemName);
    
    // Check if already on ticket
    if (state.items.some(i => normalizeWardrobeKey(i.name) === key)) {
        console.log('[Equipment] Already on ticket:', itemName);
        return null;
    }
    
    // Check wardrobe first (instant, no API)
    let itemData = getFromWardrobe(itemName);
    
    if (itemData) {
        console.log('[Equipment] ✓ Found in wardrobe (no API needed):', itemName);
    } else if (!skipGeneration) {
        // Generate new item data
        console.log('[Equipment] Not in wardrobe, generating:', itemName);
        itemData = await generateSingleItem(itemName);
        
        if (itemData) {
            saveToWardrobe(itemData);
        }
    }
    
    if (!itemData) {
        console.warn('[Equipment] Could not get data for:', itemName);
        return null;
    }
    
    // Add to active items
    const activeItem = {
        id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...itemData,
        equipped,
        addedAt: Date.now()
    };
    
    state.items.push(activeItem);
    saveEquipmentState();
    console.log('[Equipment] ✓ Added to ticket:', activeItem.name);
    return activeItem;
}

/**
 * Remove item from active ticket
 * Item stays in wardrobe for future re-add
 */
function removeItemFromTicket(itemId) {
    const state = getEquipmentState();
    const index = state.items.findIndex(i => i.id === itemId);
    
    if (index === -1) {
        console.warn('[Equipment] Item not found:', itemId);
        return null;
    }
    
    const removed = state.items.splice(index, 1)[0];
    saveEquipmentState();
    
    console.log('[Equipment] Removed from ticket (still in wardrobe):', removed.name);
    return removed;
}

/**
 * Toggle item equipped status
 */
function toggleItemEquipped(itemId) {
    const state = getEquipmentState();
    const item = state.items.find(i => i.id === itemId);
    
    if (item) {
        item.equipped = !item.equipped;
        saveEquipmentState();
        console.log('[Equipment] Toggled:', item.name, '→', item.equipped ? 'equipped' : 'stored');
    }
    
    return item;
}

/**
 * Get all active items on ticket
 */
function getActiveItems() {
    return getEquipmentState().items;
}

/**
 * Get ticket number
 */
function getTicketNumber() {
    return getEquipmentState().ticketNumber;
}

// ═══════════════════════════════════════════════════════════════
// PERSONA RETRIEVAL (from previous diagnostic version)
// ═══════════════════════════════════════════════════════════════

function findUserPersona() {
    console.log('[Equipment] Looking for user persona...');
    
    // Check power_user.personas with selected persona
    if (window.power_user?.personas) {
        const selectedName = window.power_user.persona_name || window.power_user.default_persona;
        
        if (selectedName && window.power_user.personas[selectedName]) {
            console.log('[Equipment] ✓ Found selected persona:', selectedName);
            return window.power_user.personas[selectedName];
        }
        
        // Try user_avatar as key
        const userAvatar = window.user_avatar || getContext()?.user_avatar;
        if (userAvatar && window.power_user.personas[userAvatar]) {
            console.log('[Equipment] ✓ Found persona by avatar:', userAvatar);
            return window.power_user.personas[userAvatar];
        }
    }
    
    // Check power_user.persona_description
    if (window.power_user?.persona_description) {
        console.log('[Equipment] ✓ Found persona_description');
        return window.power_user.persona_description;
    }
    
    // Check DOM
    const el = document.getElementById('persona_description');
    if (el?.value) {
        console.log('[Equipment] ✓ Found persona in DOM');
        return el.value;
    }
    
    // jQuery fallback
    if (window.$) {
        const val = window.$('#persona_description').val();
        if (val) {
            console.log('[Equipment] ✓ Found persona via jQuery');
            return val;
        }
    }
    
    console.log('[Equipment] ❌ No persona found');
    return null;
}

// ═══════════════════════════════════════════════════════════════
// SCAN FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════

async function scanForEquipment() {
    console.log('[Equipment] ════════════════════════════════════════');
    console.log('[Equipment] SCAN STARTED');
    console.log('[Equipment] ════════════════════════════════════════');
    
    // Get persona text
    const personaText = findUserPersona();
    
    if (!personaText) {
        console.log('[Equipment] ❌ No persona to scan');
        if (typeof toastr !== 'undefined') {
            toastr.warning('No persona found. Set up your persona in ST settings!', 'Equipment');
        }
        return;
    }
    
    console.log('[Equipment] Persona preview:', personaText.substring(0, 200));
    
    // Quick extract item names (no AI)
    const itemNames = quickExtractItemNames(personaText);
    
    if (itemNames.length === 0) {
        console.log('[Equipment] No items found in persona');
        if (typeof toastr !== 'undefined') {
            toastr.info('No clothing items found in persona', 'Equipment');
        }
        return;
    }
    
    console.log('[Equipment] Found', itemNames.length, 'potential items:', itemNames);
    
    if (typeof toastr !== 'undefined') {
        toastr.info(`Found ${itemNames.length} items, processing...`, 'Equipment', { timeOut: 2000 });
    }
    
    // Check which items need generation
    const needGeneration = [];
    const fromWardrobe = [];
    
    for (const name of itemNames) {
        const cached = getFromWardrobe(name);
        if (cached) {
            fromWardrobe.push(cached);
            console.log('[Equipment] ✓ From wardrobe:', name);
        } else {
            needGeneration.push(name);
            console.log('[Equipment] → Needs generation:', name);
        }
    }
    
    // Add wardrobe items immediately
    for (const item of fromWardrobe) {
        await addItemToTicket(item);
    }
    
    // Generate new items
    if (needGeneration.length > 0) {
        console.log('[Equipment] Generating', needGeneration.length, 'new items...');
        
        if (typeof toastr !== 'undefined') {
            toastr.info(`Generating ${needGeneration.length} new items...`, 'Equipment', { timeOut: 3000 });
        }
        
        const generated = await generateMultipleItems(needGeneration);
        
        for (const item of generated) {
            await addItemToTicket(item);
        }
    }
    
    // Refresh display
    refreshEquipmentDisplay();
    
    const total = fromWardrobe.length + needGeneration.length;
    console.log('[Equipment] ✅ Scan complete:', fromWardrobe.length, 'from wardrobe,', needGeneration.length, 'generated');
    
    if (typeof toastr !== 'undefined') {
        toastr.success(`Added ${total} items (${fromWardrobe.length} cached, ${needGeneration.length} new)`, 'Equipment');
    }
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

const EQUIPMENT_EMOJI = {
    hat: '🎩', glasses: '👓', jacket: '🧥', coat: '🧥',
    shirt: '👔', top: '👕', vest: '🦺',
    pants: '👖', shorts: '🩳', skirt: '👗', dress: '👗',
    shoes: '👞', boots: '🥾', socks: '🧦',
    gloves: '🧤', scarf: '🧣',
    ring: '💍', necklace: '📿', bracelet: '📿', earring: '💎',
    watch: '⌚', tie: '👔', belt: '🪢',
    bag: '👜', backpack: '🎒', briefcase: '💼', wallet: '👛',
    badge: '🪪', pin: '📍', mask: '🎭',
    other: '📦'
};

function getEmoji(type) {
    return EQUIPMENT_EMOJI[type?.toLowerCase()] || '📦';
}

function formatBonuses(bonuses) {
    if (!bonuses || Object.keys(bonuses).length === 0) return '';
    return Object.entries(bonuses)
        .map(([skill, mod]) => `${mod > 0 ? '+' : ''}${mod} ${skill.replace(/_/g, ' ')}`)
        .join(', ');
}

function refreshEquipmentDisplay() {
    const container = document.getElementById('ie-equip-items-list');
    const ticketNumberEl = document.getElementById('ie-ticket-number');
    
    if (!container) {
        console.warn('[Equipment] Display container not found');
        return;
    }
    
    const state = getEquipmentState();
    
    // Update ticket number
    if (ticketNumberEl) {
        ticketNumberEl.textContent = state.ticketNumber;
    }
    
    // Clear container
    container.innerHTML = '';
    
    if (!state.items || state.items.length === 0) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        return;
    }
    
    // Render items
    for (const item of state.items) {
        const itemEl = document.createElement('div');
        itemEl.className = `equip-ticket-item ${item.equipped ? 'equipped' : 'stored'}`;
        itemEl.dataset.itemId = item.id;
        
        const bonusText = formatBonuses(item.bonuses);
        
        itemEl.innerHTML = `
            <span class="equip-item-checkbox">${item.equipped ? '☑' : '☐'}</span>
            <span class="equip-item-emoji">${getEmoji(item.type)}</span>
            <span class="equip-item-name">${item.name}</span>
            ${bonusText ? `<span class="equip-item-bonus">(${bonusText})</span>` : ''}
            <button class="equip-item-remove" data-item-id="${item.id}" title="Remove">×</button>
        `;
        
        // Add description tooltip or expandable section
        if (item.description) {
            itemEl.title = item.description;
        }
        
        container.appendChild(itemEl);
    }
    
    console.log('[Equipment] Display refreshed:', state.items.length, 'items');
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleItemClick(e) {
    const target = e.target;
    
    // Remove button
    if (target.classList.contains('equip-item-remove')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
            const removed = removeItemFromTicket(itemId);
            if (removed) {
                refreshEquipmentDisplay();
                if (typeof toastr !== 'undefined') {
                    toastr.info(`Removed: ${removed.name} (saved in wardrobe)`, 'Equipment');
                }
            }
        }
        return;
    }
    
    // Toggle equipped (click on row)
    const itemEl = target.closest('.equip-ticket-item');
    if (itemEl && !target.classList.contains('equip-item-remove')) {
        const itemId = itemEl.dataset.itemId;
        if (itemId) {
            toggleItemEquipped(itemId);
            refreshEquipmentDisplay();
        }
    }
}

function showAddItemDialog() {
    const name = prompt('Item name:');
    if (!name?.trim()) return;
    
    const type = prompt('Type (jacket, shirt, pants, shoes, etc.):', 'other');
    
    // Add with generation
    addItemToTicket(name.trim()).then(item => {
        if (item) {
            refreshEquipmentDisplay();
            if (typeof toastr !== 'undefined') {
                toastr.success(`Added: ${item.name}`, 'Equipment');
            }
        }
    });
}

function showWardrobeDialog() {
    const wardrobe = getAllWardrobeItems();
    
    if (wardrobe.length === 0) {
        if (typeof toastr !== 'undefined') {
            toastr.info('Wardrobe is empty', 'Equipment');
        }
        return;
    }
    
    const names = wardrobe.map(i => i.name).join('\n');
    const choice = prompt(`Your wardrobe (${wardrobe.length} items):\n\n${names}\n\nEnter item name to re-add:`);
    
    if (choice?.trim()) {
        addItemToTicket(choice.trim()).then(item => {
            if (item) {
                refreshEquipmentDisplay();
                if (typeof toastr !== 'undefined') {
                    toastr.success(`Re-added: ${item.name}`, 'Equipment');
                }
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initEquipmentHandlers() {
    console.log('[Equipment] Initializing handlers with wardrobe system...');
    
    // Scan button
    const scanBtn = document.getElementById('ie-equip-scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', scanForEquipment);
        console.log('[Equipment] ✓ Scan button ready');
    }
    
    // Add button
    const addBtn = document.getElementById('ie-equip-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddItemDialog);
        console.log('[Equipment] ✓ Add button ready');
    }
    
    // Wardrobe button (if exists)
    const wardrobeBtn = document.getElementById('ie-equip-wardrobe-btn');
    if (wardrobeBtn) {
        wardrobeBtn.addEventListener('click', showWardrobeDialog);
        console.log('[Equipment] ✓ Wardrobe button ready');
    }
    
    // Item list clicks
    const container = document.getElementById('ie-equip-items-list');
    if (container) {
        container.addEventListener('click', handleItemClick);
        console.log('[Equipment] ✓ Item list ready');
    }
    
    // Chat change listener
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            setTimeout(refreshEquipmentDisplay, 100);
        });
    }
    
    // Initial render
    refreshEquipmentDisplay();
    
    // Log wardrobe status
    const wardrobe = getAllWardrobeItems();
    console.log('[Equipment] Wardrobe has', wardrobe.length, 'cached items');
    
    console.log('[Equipment] ✅ Initialization complete');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
    scanForEquipment,
    addItemToTicket,
    removeItemFromTicket,
    toggleItemEquipped,
    getActiveItems,
    getFromWardrobe,
    getAllWardrobeItems,
    refreshEquipmentDisplay
};
