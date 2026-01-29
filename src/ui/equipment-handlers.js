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
    initializeEquipment,
    getChatState,
    getEquipmentItems,
    getPersona
} from '../core/state.js';

import { getContext } from '../../../../../extensions.js';
import { eventSource, event_types } from '../../../../../../script.js';

// Lazy-loaded generation function
let generateEquipmentFromMessage = null;

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
    
    // CRITICAL: Check for active chat state first
    const chatState = getChatState();
    if (!chatState) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        if (ticketNumber) ticketNumber.textContent = '----';
        return;
    }
    
    // Initialize equipment state if needed (only if we have valid chat)
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
    // Check for active chat first
    const chatState = getChatState();
    if (!chatState) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No active chat - start a conversation first', 'Equipment');
        }
        return;
    }
    
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
// SCAN FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════

/**
 * Scan persona + recent messages for equipment
 */
async function scanForEquipment() {
    // Check for active chat
    const chatState = getChatState();
    if (!chatState) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No active chat', 'Equipment');
        }
        return;
    }
    
    // Lazy-load generation module if needed
    if (!generateEquipmentFromMessage) {
        try {
            const module = await import('../voice/equipment-generation.js');
            generateEquipmentFromMessage = module.generateEquipmentFromMessage;
        } catch (e) {
            console.error('[Tribunal] Failed to load equipment generation:', e);
            if (typeof toastr !== 'undefined') {
                toastr.error('Equipment generation not available', 'Equipment');
            }
            return;
        }
    }
    
    // Gather text to scan - focus on USER/PLAYER, not AI character
    const textParts = [];
    
    // 1. Tribunal's persona context (player character)
    const persona = getPersona();
    if (persona?.context) {
        textParts.push(`[PLAYER CHARACTER]\n${persona.context}`);
    }
    
    // 2. SillyTavern user persona (if available)
    const ctx = getContext();
    if (ctx?.name1) {
        // Try to get ST user persona
        const userPersona = ctx.persona?.description || ctx.default_persona?.description;
        if (userPersona) {
            textParts.push(`[USER PERSONA]\n${userPersona}`);
        }
    }
    
    // 3. Recent chat messages - look for player actions/descriptions
    // (where player might describe what they're wearing)
    if (ctx?.chat) {
        const recentMessages = ctx.chat.slice(-10);
        for (const msg of recentMessages) {
            if (msg.mes) {
                // Include user messages (they might describe their outfit)
                // and AI messages (might describe player's appearance)
                textParts.push(msg.mes);
            }
        }
    }
    
    if (textParts.length === 0) {
        if (typeof toastr !== 'undefined') {
            toastr.info('Nothing to scan', 'Equipment');
        }
        return;
    }
    
    // Combine and scan (limit to ~8000 chars to avoid overwhelming AI)
    let combinedText = textParts.join('\n\n');
    if (combinedText.length > 8000) {
        console.log('[Tribunal] Truncating scan text from', combinedText.length, 'to 8000 chars');
        combinedText = combinedText.substring(0, 8000);
    }
    
    console.log('[Tribunal] Scanning', combinedText.length, 'chars for equipment');
    
    if (typeof toastr !== 'undefined') {
        toastr.info('Scanning for equipment...', 'Equipment', { timeOut: 2000 });
    }
    
    try {
        const results = await generateEquipmentFromMessage(combinedText, {
            existingEquipment: getEquipmentItems()
        });
        
        if (results.error) {
            console.warn('[Tribunal] Scan error:', results.error);
            if (typeof toastr !== 'undefined') {
                toastr.warning(`Scan issue: ${results.error}`, 'Equipment');
            }
            return;
        }
        
        if (results.equipment?.length > 0) {
            let addedCount = 0;
            for (const item of results.equipment) {
                const added = addEquipment({
                    ...item,
                    equipped: true
                });
                if (added) addedCount++;
            }
            
            refreshEquipment();
            
            if (typeof toastr !== 'undefined') {
                toastr.success(`Found ${addedCount} item(s)`, 'Equipment');
            }
            console.log(`[Tribunal] Scan found ${addedCount} equipment items`);
        } else {
            if (typeof toastr !== 'undefined') {
                toastr.info('No equipment found', 'Equipment');
            }
        }
        
    } catch (e) {
        console.error('[Tribunal] Scan failed:', e);
        if (typeof toastr !== 'undefined') {
            toastr.error('Scan failed', 'Equipment');
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
    
    // Scan button - create dynamically if not in template
    let scanBtn = document.getElementById('ie-equip-scan-btn');
    if (!scanBtn && addBtn) {
        // Create scan button next to add button
        scanBtn = document.createElement('button');
        scanBtn.id = 'ie-equip-scan-btn';
        scanBtn.className = 'equip-scan-btn';
        scanBtn.innerHTML = '🔍 SCAN';
        scanBtn.title = 'Scan persona & chat for equipment';
        addBtn.parentNode.insertBefore(scanBtn, addBtn);
    }
    if (scanBtn) {
        scanBtn.addEventListener('click', scanForEquipment);
    }
    
    // Event delegation for items list
    const container = document.getElementById('ie-equip-items-list');
    if (container) {
        container.addEventListener('click', handleEquipmentClick);
    }
    
    // Listen for chat changes to refresh UI
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            setTimeout(refreshEquipment, 100); // Small delay for state to load
        });
        console.log('[Tribunal] Equipment listening for CHAT_CHANGED');
    }
    
    // Initial render
    refreshEquipment();
    
    console.log('[Tribunal] Equipment handlers initialized');
}

// Export scan function for external use
export { scanForEquipment };
