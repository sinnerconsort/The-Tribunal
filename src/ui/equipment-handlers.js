/**
 * The Tribunal - Equipment Handlers
 * Clean inline UI - no modals, no duplicate buttons
 * 
 * @version 1.0.1 - Removed unused getContext import
 */

import { eventSource, event_types } from '../../../../../../script.js';

import {
    normalizeWardrobeKey,
    generateSingleItem,
    generateMultipleItems
} from '../voice/equipment-generation.js';

// AI-based extraction (replaces regex)
import { extractEquipmentFromPersona } from '../systems/ai-extractor.js';

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
    if (stateModule?.saveChatState) stateModule.saveChatState();
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
    
    const itemName = itemNameOrData;
    const key = normalizeWardrobeKey(itemName);
    if (state.items.some(i => normalizeWardrobeKey(i.name) === key)) return null;
    
    let itemData = getFromWardrobe(itemName);
    if (itemData) {
        toast(`From wardrobe: ${itemName}`, 'success');
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
// PERSONA SCAN
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
    
    toast('AI scanning persona for clothing...', 'info');
    
    // Use AI extraction - much smarter than regex!
    const names = await extractEquipmentFromPersona(persona);
    if (names.length === 0) { toast('No clothing items found', 'info'); return; }
    
    toast(`Found ${names.length} clothing items...`, 'info');
    
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
        refreshDisplay();
    }
    
    toast(`Added ${cached + generated} items`, 'success');
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatBonuses(bonuses) {
    if (!bonuses || Object.keys(bonuses).length === 0) return '';
    return Object.entries(bonuses)
        .map(([s, m]) => `${m > 0 ? '+' : ''}${m} ${s.replace(/_/g, ' ')}`)
        .join(', ');
}

function formatSkillName(skill) {
    return skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
    
    // Items
    if (state.items.length === 0) {
        container.innerHTML = '<p class="equip-empty">No items checked in</p>';
    } else {
        for (const item of state.items) {
            container.appendChild(renderItem(item));
        }
    }
    
    // Buttons & forms (only add if not already in HTML template)
    if (!document.getElementById('ie-equip-scan-btn')) {
        container.appendChild(renderControls());
    }
}

function renderItem(item) {
    const isExpanded = uiState.expandedItemId === item.id;
    const div = document.createElement('div');
    div.className = `equip-item ${item.equipped ? 'equipped' : 'stored'} ${isExpanded ? 'expanded' : ''}`;
    div.dataset.itemId = item.id;
    
    // Collapsed: just checkbox + name
    // Expanded: full details
    
    if (!isExpanded) {
        div.innerHTML = `
            <div class="equip-item-row">
                <i class="fa-solid ${item.equipped ? 'fa-square-check' : 'fa-square'} equip-checkbox"></i>
                <span class="equip-name">${item.name}</span>
                <i class="fa-solid fa-chevron-right equip-expand"></i>
            </div>
        `;
    } else {
        const bonusText = formatBonuses(item.bonuses);
        const quipsHtml = (item.voiceQuips || []).map(q => `
            <div class="equip-quip ${q.approves ? 'approves' : 'disapproves'}">
                <span class="equip-quip-skill">${formatSkillName(q.skill)}:</span>
                <span class="equip-quip-text">"${q.text}"</span>
            </div>
        `).join('');
        
        div.innerHTML = `
            <div class="equip-item-row">
                <i class="fa-solid ${item.equipped ? 'fa-square-check' : 'fa-square'} equip-checkbox"></i>
                <span class="equip-name">${item.name}</span>
                <i class="fa-solid fa-chevron-down equip-expand"></i>
            </div>
            <div class="equip-details">
                ${bonusText ? `<div class="equip-bonuses">(${bonusText})</div>` : ''}
                ${item.description ? `<p class="equip-desc">${item.description}</p>` : ''}
                ${quipsHtml ? `<div class="equip-quips">${quipsHtml}</div>` : ''}
                <div class="equip-actions">
                    <button class="equip-btn equip-toggle">${item.equipped ? 'Store' : 'Equip'}</button>
                    <button class="equip-btn equip-remove">Remove</button>
                </div>
            </div>
        `;
        
        // Action buttons
        div.querySelector('.equip-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleItemEquipped(item.id);
            refreshDisplay();
        });
        
        div.querySelector('.equip-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeItemFromTicket(item.id);
            toast(`Removed: ${item.name}`, 'info');
            uiState.expandedItemId = null;
            refreshDisplay();
        });
    }
    
    // Click to expand/collapse
    div.querySelector('.equip-item-row').addEventListener('click', () => {
        uiState.expandedItemId = isExpanded ? null : item.id;
        refreshDisplay();
    });
    
    // Checkbox toggle
    div.querySelector('.equip-checkbox').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleItemEquipped(item.id);
        refreshDisplay();
    });
    
    return div;
}

function renderControls() {
    const div = document.createElement('div');
    div.className = 'equip-controls';
    
    if (!uiState.addFormOpen) {
        div.innerHTML = `
            <button class="equip-ctrl-btn equip-scan"><i class="fa-solid fa-magnifying-glass"></i> Scan Persona</button>
            <button class="equip-ctrl-btn equip-add"><i class="fa-solid fa-plus"></i> Add Item</button>
            <button class="equip-ctrl-btn equip-wardrobe-btn"><i class="fa-solid fa-shirt"></i> Wardrobe (${getAllWardrobeItems().length})</button>
        `;
        
        div.querySelector('.equip-scan').addEventListener('click', scanForEquipment);
        div.querySelector('.equip-add').addEventListener('click', () => {
            uiState.addFormOpen = true;
            refreshDisplay();
        });
        div.querySelector('.equip-wardrobe-btn').addEventListener('click', () => {
            uiState.wardrobeOpen = !uiState.wardrobeOpen;
            refreshDisplay();
        });
    } else {
        div.innerHTML = `
            <div class="equip-add-form">
                <input type="text" class="equip-input" id="equip-add-input" placeholder="Item name..." />
                <div class="equip-form-btns">
                    <button class="equip-btn equip-cancel">Cancel</button>
                    <button class="equip-btn equip-submit">Add</button>
                </div>
            </div>
        `;
        
        const input = div.querySelector('#equip-add-input');
        setTimeout(() => input?.focus(), 50);
        
        div.querySelector('.equip-cancel').addEventListener('click', () => {
            uiState.addFormOpen = false;
            refreshDisplay();
        });
        
        const submit = async () => {
            const name = input.value.trim();
            if (!name) return;
            uiState.addFormOpen = false;
            refreshDisplay();
            await addItemToTicket(name);
            refreshDisplay();
        };
        
        div.querySelector('.equip-submit').addEventListener('click', submit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    }
    
    // Wardrobe list
    if (uiState.wardrobeOpen) {
        div.appendChild(renderWardrobe());
    }
    
    return div;
}

function renderWardrobe() {
    const items = getAllWardrobeItems();
    const activeKeys = getEquipmentState().items.map(i => normalizeWardrobeKey(i.name));
    
    const list = document.createElement('div');
    list.className = 'equip-wardrobe';
    
    if (items.length === 0) {
        list.innerHTML = '<p class="equip-empty">Wardrobe empty</p>';
        return list;
    }
    
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
        const isOnTicket = activeKeys.includes(item.wardrobeKey);
        const row = document.createElement('div');
        row.className = `equip-wardrobe-item ${isOnTicket ? 'on-ticket' : ''}`;
        row.innerHTML = `
            <span class="equip-wardrobe-name">${item.name}</span>
            ${isOnTicket 
                ? '<i class="fa-solid fa-check equip-wardrobe-check"></i>'
                : '<button class="equip-wardrobe-add"><i class="fa-solid fa-plus"></i></button>'
            }
            <button class="equip-wardrobe-del"><i class="fa-solid fa-trash"></i></button>
        `;
        
        if (!isOnTicket) {
            row.querySelector('.equip-wardrobe-add').addEventListener('click', async () => {
                await addItemToTicket(item);
                refreshDisplay();
            });
        }
        
        row.querySelector('.equip-wardrobe-del').addEventListener('click', () => {
            if (confirm(`Delete "${item.name}"?`)) {
                const state = getEquipmentState();
                const ticketItem = state.items.find(i => normalizeWardrobeKey(i.name) === item.wardrobeKey);
                if (ticketItem) removeItemFromTicket(ticketItem.id);
                deleteFromWardrobe(item.wardrobeKey);
                refreshDisplay();
            }
        });
        
        list.appendChild(row);
    }
    
    return list;
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

export function initEquipmentHandlers() {
    console.log('[Equipment] Initializing...');
    
    // Remove any existing buttons from HTML template to avoid duplicates
    document.getElementById('ie-equip-scan-btn')?.remove();
    document.getElementById('ie-equip-add-btn')?.remove();
    document.getElementById('ie-equip-wardrobe-btn')?.remove();
    
    const container = document.getElementById('ie-equip-items-list');
    if (!container) {
        console.warn('[Equipment] Container not found');
        return;
    }
    
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
