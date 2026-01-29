/**
 * The Tribunal - Equipment Handlers (Minimal)
 * Martinaise Cleaners ticket system
 * 
 * Kept deliberately simple to avoid import chain issues
 */

import { 
    getEquipment, 
    addEquipment, 
    removeEquipment, 
    toggleEquipment,
    initializeEquipment 
} from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// INLINE HELPERS (avoid external imports)
// ═══════════════════════════════════════════════════════════════

const EQUIPMENT_EMOJI = {
    hat: '🎩', headwear: '🎩',
    jacket: '🧥', coat: '🧥', shirt: '👔', top: '👕',
    pants: '👖', trousers: '👖',
    shoes: '👞', boots: '🥾', footwear: '👟',
    gloves: '🧤',
    glasses: '👓', eyewear: '🕶️',
    jewelry: '💍', ring: '💍', necklace: '📿',
    watch: '⌚',
    bag: '👜', briefcase: '💼',
    weapon: '🔫',
    badge: '🪪',
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

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Refresh the equipment display
 */
export function refreshEquipment() {
    const container = document.getElementById('ie-equip-items-list');
    const ticketNumber = document.getElementById('ie-ticket-number');
    
    if (!container) return;
    
    // Initialize equipment state if needed
    initializeEquipment();
    
    const equipment = getEquipment();
    
    // Update ticket number
    if (ticketNumber && equipment.ticketNumber) {
        ticketNumber.textContent = equipment.ticketNumber;
    }
    
    // Clear and rebuild
    container.innerHTML = '';
    
    if (!equipment.items || equipment.items.length === 0) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        return;
    }
    
    // Render each item
    equipment.items.forEach(item => {
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
        
        container.appendChild(itemEl);
    });
}

// ═══════════════════════════════════════════════════════════════
// ADD ITEM DIALOG
// ═══════════════════════════════════════════════════════════════

function showAddItemDialog() {
    // Simple prompt-based for now - can upgrade to modal later
    const name = prompt('Item name:');
    if (!name || !name.trim()) return;
    
    const type = prompt('Type (hat, jacket, pants, shoes, glasses, jewelry, watch, bag, badge, other):', 'other');
    
    const bonusInput = prompt('Skill bonus? (e.g., "logic +1" or leave blank):');
    
    // Parse bonus
    const bonuses = {};
    if (bonusInput && bonusInput.trim()) {
        const match = bonusInput.match(/(\w+)\s*([+-]?\d+)/);
        if (match) {
            const skill = match[1].toLowerCase().replace(/\s+/g, '_');
            const value = parseInt(match[2], 10);
            if (!isNaN(value)) {
                bonuses[skill] = value;
            }
        }
    }
    
    const item = addEquipment({
        name: name.trim(),
        type: (type || 'other').toLowerCase().trim(),
        bonuses,
        equipped: true,
        source: 'manual'
    });
    
    if (item) {
        refreshEquipment();
        if (typeof toastr !== 'undefined') {
            toastr.success(`Added: ${item.name}`, 'Equipment');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleEquipmentClick(e) {
    const target = e.target;
    
    // Remove button
    if (target.classList.contains('equip-item-remove')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
            const removed = removeEquipment(itemId);
            if (removed) {
                refreshEquipment();
                if (typeof toastr !== 'undefined') {
                    toastr.info(`Removed: ${removed.name}`, 'Equipment');
                }
            }
        }
        return;
    }
    
    // Toggle equipped (click on item row or checkbox)
    const itemEl = target.closest('.equip-ticket-item');
    if (itemEl && !target.classList.contains('equip-item-remove')) {
        const itemId = itemEl.dataset.itemId;
        if (itemId) {
            const newState = toggleEquipment(itemId);
            refreshEquipment();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize equipment handlers
 */
export function initEquipmentHandlers() {
    // Add button
    const addBtn = document.getElementById('ie-equip-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddItemDialog);
    }
    
    // Event delegation for items list
    const container = document.getElementById('ie-equip-items-list');
    if (container) {
        container.addEventListener('click', handleEquipmentClick);
    }
    
    // Initial render
    refreshEquipment();
    
    console.log('[Tribunal] Equipment handlers initialized');
}
