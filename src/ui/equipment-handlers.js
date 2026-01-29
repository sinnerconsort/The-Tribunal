/**
 * The Tribunal - Equipment Handlers
 * Uses INLINE forms (like Cases/Contacts) - no modals!
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
// STATE
// ═══════════════════════════════════════════════════════════════

let stateModule = null;
try {
    stateModule = await import('../core/state.js');
} catch (e) {
    console.warn('[Equipment] Using local state');
}

let localState = {
    ticketNumber: String(Math.floor(1000 + Math.random() * 9000)),
    items: [],
    wardrobe: {}
};

function getEquipmentState() {
    if (stateModule?.getChatState) {
        const chatState = stateModule.getChatState();
        if (chatState) {
            if (!chatState.equipment) {
                chatState.equipment = { ticketNumber: localState.ticketNumber, items: [], wardrobe: {} };
            }
            if (!chatState.equipment.wardrobe) chatState.equipment.wardrobe = {};
            return chatState.equipment;
        }
    }
    return localState;
}

function saveState() {
    if (stateModule?.saveState) stateModule.saveState();
}

// ═══════════════════════════════════════════════════════════════
// WARDROBE
// ═══════════════════════════════════════════════════════════════

function getFromWardrobe(name) {
    return getEquipmentState().wardrobe[normalizeWardrobeKey(name)] || null;
}

function saveToWardrobe(item) {
    const state = getEquipmentState();
    const key = normalizeWardrobeKey(item.name);
    state.wardrobe[key] = { ...item, wardrobeKey: key, savedAt: Date.now() };
    saveState();
}

function deleteFromWardrobe(key) {
    const state = getEquipmentState();
    if (state.wardrobe[key]) {
        delete state.wardrobe[key];
        saveState();
        return true;
    }
    return false;
}

function getAllWardrobeItems() {
    return Object.values(getEquipmentState().wardrobe);
}

// ═══════════════════════════════════════════════════════════════
// TICKET OPERATIONS
// ═══════════════════════════════════════════════════════════════

async function addItemToTicket(itemNameOrData, options = {}) {
    const state = getEquipmentState();
    const { equipped = true } = options;
    
    // If passed full item data
    if (typeof itemNameOrData === 'object' && itemNameOrData.name) {
        const item = itemNameOrData;
        const key = normalizeWardrobeKey(item.name);
        if (state.items.some(i => normalizeWardrobeKey(i.name) === key)) return null;
        
        if (!state.wardrobe[key]) saveToWardrobe(item);
        
        const activeItem = {
            id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...item, equipped, addedAt: Date.now()
        };
        state.items.push(activeItem);
        saveState();
        return activeItem;
    }
    
    // String name - check wardrobe or generate
    const itemName = itemNameOrData;
    const key = normalizeWardrobeKey(itemName);
    if (state.items.some(i => normalizeWardrobeKey(i.name) === key)) return null;
    
    let itemData = getFromWardrobe(itemName);
    if (itemData) {
        toast(`✓ From wardrobe: ${itemName}`, 'success');
    } else {
        toast(`Generating ${itemName}...`, 'info');
        itemData = await generateSingleItem(itemName);
        if (itemData) saveToWardrobe(itemData);
    }
    
    if (!itemData) return null;
    
    const activeItem = {
        id: `equip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...itemData, equipped, addedAt: Date.now()
    };
    state.items.push(activeItem);
    saveState();
    return activeItem;
}

function removeItemFromTicket(itemId) {
    const state = getEquipmentState();
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    const removed = state.items.splice(idx, 1)[0];
    saveState();
    return removed;
}

function toggleItemEquipped(itemId) {
    const state = getEquipmentState();
    const item = state.items.find(i => i.id === itemId);
    if (item) { item.equipped = !item.equipped; saveState(); }
    return item;
}

// ═══════════════════════════════════════════════════════════════
// PERSONA & SCAN
// ═══════════════════════════════════════════════════════════════

function findUserPersona() {
    if (window.power_user?.personas) {
        const name = window.power_user.persona_name || window.power_user.default_persona;
        if (name && window.power_user.personas[name]) return window.power_user.personas[name];
    }
    if (window.power_user?.persona_description) return window.power_user.persona_description;
    return document.getElementById('persona_description')?.value || null;
}

async function scanForEquipment() {
    const persona = findUserPersona();
    if (!persona) { toast('No persona found!', 'warning'); return; }
    
    const names = quickExtractItemNames(persona);
    if (names.length === 0) { toast('No items found in persona', 'info'); return; }
    
    toast(`Found ${names.length} items...`, 'info');
    
    let cached = 0, generated = 0;
    for (const name of names) {
        const fromCache = getFromWardrobe(name);
        if (fromCache) {
            await addItemToTicket(fromCache);
            cached++;
        } else {
            const item = await addItemToTicket(name);
            if (item) generated++;
        }
    }
    
    refreshDisplay();
    toast(`Added ${cached + generated} items (${cached} cached, ${generated} new)`, 'success');
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const EMOJI = {
    jacket: '🧥', coat: '🧥', shirt: '👔', top: '👕', pants: '👖',
    shoes: '👞', boots: '🥾', hat: '🎩', glasses: '👓', gloves: '🧤',
    ring: '💍', necklace: '📿', watch: '⌚', bag: '👜', mask: '🎭',
    badge: '🪪', other: '📦'
};

function getEmoji(type) { return EMOJI[type?.toLowerCase()] || '📦'; }

function formatBonuses(bonuses) {
    if (!bonuses || Object.keys(bonuses).length === 0) return '';
    return Object.entries(bonuses)
        .map(([s, m]) => `${m > 0 ? '+' : ''}${m} ${s.replace(/_/g, ' ')}`)
        .join(', ');
}

function toast(msg, type = 'info') {
    if (typeof toastr !== 'undefined') toastr[type](msg, 'Equipment');
    else console.log(`[Equipment] ${type}: ${msg}`);
}

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

let uiState = {
    addFormOpen: false,
    wardrobeOpen: false,
    expandedItemId: null
};

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════

function refreshDisplay() {
    const container = document.getElementById('ie-equip-items-list');
    const ticketEl = document.getElementById('ie-ticket-number');
    if (!container) return;
    
    const state = getEquipmentState();
    if (ticketEl) ticketEl.textContent = state.ticketNumber;
    
    container.innerHTML = '';
    
    // Items on ticket
    if (state.items.length === 0) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
    } else {
        for (const item of state.items) {
            container.appendChild(renderTicketItem(item));
        }
    }
    
    // Inline add form
    container.appendChild(renderAddForm());
    
    // Inline wardrobe section
    container.appendChild(renderWardrobeSection());
}

function renderTicketItem(item) {
    const isExpanded = uiState.expandedItemId === item.id;
    const div = document.createElement('div');
    div.className = `equip-ticket-item ${item.equipped ? 'equipped' : 'stored'} ${isExpanded ? 'expanded' : ''}`;
    div.dataset.itemId = item.id;
    
    const bonusText = formatBonuses(item.bonuses);
    
    div.innerHTML = `
        <div class="equip-item-row">
            <span class="equip-item-checkbox">${item.equipped ? '☑' : '☐'}</span>
            <span class="equip-item-emoji">${getEmoji(item.type)}</span>
            <span class="equip-item-name">${item.name}</span>
            ${bonusText ? `<span class="equip-item-bonus">(${bonusText})</span>` : ''}
            <span class="equip-item-expand">${isExpanded ? '▼' : '▶'}</span>
        </div>
        ${isExpanded ? `
            <div class="equip-item-details">
                ${item.description ? `<p class="equip-item-desc">${item.description}</p>` : ''}
                ${item.voiceQuips?.length ? `
                    <div class="equip-item-quips">
                        ${item.voiceQuips.map(q => `
                            <div class="equip-quip ${q.approves ? 'approves' : 'disapproves'}">
                                <strong>${q.skill.replace(/_/g, ' ')}</strong>: "${q.text}"
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="equip-item-actions">
                    <button class="equip-action-btn equip-toggle-btn">${item.equipped ? '📦 Store' : '✓ Equip'}</button>
                    <button class="equip-action-btn equip-remove-btn">✕ Remove</button>
                </div>
            </div>
        ` : ''}
    `;
    
    // Click row to expand/collapse
    div.querySelector('.equip-item-row').addEventListener('click', () => {
        uiState.expandedItemId = isExpanded ? null : item.id;
        refreshDisplay();
    });
    
    // Action buttons
    if (isExpanded) {
        div.querySelector('.equip-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleItemEquipped(item.id);
            refreshDisplay();
        });
        div.querySelector('.equip-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeItemFromTicket(item.id);
            toast(`Removed: ${item.name}`, 'info');
            uiState.expandedItemId = null;
            refreshDisplay();
        });
    }
    
    return div;
}

function renderAddForm() {
    const div = document.createElement('div');
    div.className = 'equip-add-section';
    
    if (!uiState.addFormOpen) {
        div.innerHTML = `
            <button class="equip-section-btn equip-scan-btn">🔍 Scan Persona</button>
            <button class="equip-section-btn equip-add-btn">+ Add Item</button>
        `;
        div.querySelector('.equip-scan-btn').addEventListener('click', scanForEquipment);
        div.querySelector('.equip-add-btn').addEventListener('click', () => {
            uiState.addFormOpen = true;
            refreshDisplay();
        });
    } else {
        div.innerHTML = `
            <div class="equip-inline-form">
                <input type="text" class="equip-input" id="equip-add-input" placeholder="Item name..." />
                <div class="equip-form-actions">
                    <button class="equip-form-btn equip-cancel-btn">✕</button>
                    <button class="equip-form-btn equip-submit-btn">ADD</button>
                </div>
            </div>
        `;
        const input = div.querySelector('#equip-add-input');
        setTimeout(() => input?.focus(), 50);
        
        div.querySelector('.equip-cancel-btn').addEventListener('click', () => {
            uiState.addFormOpen = false;
            refreshDisplay();
        });
        
        const submit = async () => {
            const name = input.value.trim();
            if (!name) return;
            uiState.addFormOpen = false;
            refreshDisplay();
            const item = await addItemToTicket(name);
            if (item) toast(`Added: ${item.name}`, 'success');
            refreshDisplay();
        };
        
        div.querySelector('.equip-submit-btn').addEventListener('click', submit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    }
    
    return div;
}

function renderWardrobeSection() {
    const div = document.createElement('div');
    div.className = 'equip-wardrobe-section';
    
    const items = getAllWardrobeItems();
    const activeKeys = getEquipmentState().items.map(i => normalizeWardrobeKey(i.name));
    
    div.innerHTML = `
        <button class="equip-section-btn equip-wardrobe-toggle">
            👕 Wardrobe (${items.length}) ${uiState.wardrobeOpen ? '▼' : '▶'}
        </button>
    `;
    
    div.querySelector('.equip-wardrobe-toggle').addEventListener('click', () => {
        uiState.wardrobeOpen = !uiState.wardrobeOpen;
        refreshDisplay();
    });
    
    if (uiState.wardrobeOpen && items.length > 0) {
        const list = document.createElement('div');
        list.className = 'equip-wardrobe-list';
        
        for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
            const isOnTicket = activeKeys.includes(item.wardrobeKey);
            const row = document.createElement('div');
            row.className = `equip-wardrobe-item ${isOnTicket ? 'on-ticket' : ''}`;
            row.innerHTML = `
                <span class="equip-wardrobe-emoji">${getEmoji(item.type)}</span>
                <span class="equip-wardrobe-name">${item.name}</span>
                <span class="equip-wardrobe-bonus">${formatBonuses(item.bonuses) || ''}</span>
                ${isOnTicket 
                    ? '<span class="equip-wardrobe-status">✓</span>'
                    : '<button class="equip-wardrobe-add">+</button>'
                }
                <button class="equip-wardrobe-delete">🗑️</button>
            `;
            
            if (!isOnTicket) {
                row.querySelector('.equip-wardrobe-add').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await addItemToTicket(item);
                    toast(`Added: ${item.name}`, 'success');
                    refreshDisplay();
                });
            }
            
            row.querySelector('.equip-wardrobe-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${item.name}" from wardrobe?`)) {
                    // Remove from ticket if present
                    const state = getEquipmentState();
                    const ticketItem = state.items.find(i => normalizeWardrobeKey(i.name) === item.wardrobeKey);
                    if (ticketItem) removeItemFromTicket(ticketItem.id);
                    
                    deleteFromWardrobe(item.wardrobeKey);
                    toast(`Deleted: ${item.name}`, 'info');
                    refreshDisplay();
                }
            });
            
            list.appendChild(row);
        }
        
        div.appendChild(list);
    } else if (uiState.wardrobeOpen && items.length === 0) {
        div.innerHTML += '<p class="equip-wardrobe-empty">Wardrobe empty</p>';
    }
    
    return div;
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

export function initEquipmentHandlers() {
    console.log('[Equipment] Initializing...');
    
    const container = document.getElementById('ie-equip-items-list');
    if (!container) {
        console.warn('[Equipment] Container not found');
        return;
    }
    
    // Chat change listener
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            uiState = { addFormOpen: false, wardrobeOpen: false, expandedItemId: null };
            setTimeout(refreshDisplay, 100);
        });
    }
    
    refreshDisplay();
    console.log('[Equipment] ✅ Initialized');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
    scanForEquipment,
    addItemToTicket,
    removeItemFromTicket,
    toggleItemEquipped,
    getFromWardrobe,
    getAllWardrobeItems,
    deleteFromWardrobe,
    refreshDisplay as refreshEquipmentDisplay
};
