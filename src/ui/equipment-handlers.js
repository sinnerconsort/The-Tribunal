/**
 * The Tribunal - Equipment Handlers (FIXED)
 * Martinaise Cleaners ticket system
 * 
 * FIXES:
 * - Better persona retrieval (checks multiple locations)
 * - Improved debug logging for mobile troubleshooting
 * - More robust scan function
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
// PERSONA RETRIEVAL (IMPROVED)
// Checks multiple locations for user persona description
// ═══════════════════════════════════════════════════════════════

/**
 * Get ST user persona description from all possible locations
 * @returns {string|null} Persona description or null
 */
function getSTPersonaDescription() {
    let found = null;
    let source = null;
    
    // Method 1: window.power_user (most common)
    if (window.power_user?.persona_description) {
        found = window.power_user.persona_description;
        source = 'window.power_user.persona_description';
    }
    
    // Method 2: SillyTavern context
    if (!found) {
        try {
            const ctx = getContext();
            if (ctx?.power_user?.persona_description) {
                found = ctx.power_user.persona_description;
                source = 'context.power_user.persona_description';
            }
        } catch (e) {
            // Ignore
        }
    }
    
    // Method 3: Global SillyTavern object
    if (!found) {
        try {
            if (window.SillyTavern?.getContext) {
                const stCtx = window.SillyTavern.getContext();
                if (stCtx?.power_user?.persona_description) {
                    found = stCtx.power_user.persona_description;
                    source = 'SillyTavern.getContext().power_user';
                }
            }
        } catch (e) {
            // Ignore
        }
    }
    
    // Method 4: Check for persona in user object
    if (!found) {
        try {
            if (window.user?.persona) {
                found = window.user.persona;
                source = 'window.user.persona';
            }
        } catch (e) {
            // Ignore
        }
    }
    
    // Method 5: Check name1_description (some ST versions use this)
    if (!found) {
        try {
            if (window.name1_description) {
                found = window.name1_description;
                source = 'window.name1_description';
            }
        } catch (e) {
            // Ignore
        }
    }
    
    if (found) {
        console.log('[Tribunal] Found persona via:', source);
        console.log('[Tribunal] Persona preview:', found.substring(0, 200));
    } else {
        console.log('[Tribunal] No persona found in any location');
    }
    
    return found;
}

/**
 * Get user persona name
 */
function getSTPersonaName() {
    // Try various locations
    if (window.power_user?.persona_name) return window.power_user.persona_name;
    if (window.name1) return window.name1;
    
    try {
        const ctx = getContext();
        if (ctx?.name1) return ctx.name1;
    } catch (e) {
        // Ignore
    }
    
    return 'User';
}

// ═══════════════════════════════════════════════════════════════
// INLINE HELPERS
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
    bag: '👜', briefcase: '💼', backpack: '🎒',
    weapon: '🔫',
    badge: '🪪',
    mask: '🎭',
    vest: '🦺',
    scarf: '🧣',
    belt: '🪢',
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
    
    // Check for active chat state
    const chatState = getChatState();
    if (!chatState) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        if (ticketNumber) ticketNumber.textContent = '----';
        return;
    }
    
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
    const chatState = getChatState();
    if (!chatState) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No active chat - start a conversation first', 'Equipment');
        }
        return;
    }
    
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
// SCAN FUNCTIONALITY (IMPROVED)
// ═══════════════════════════════════════════════════════════════

/**
 * Scan persona + recent messages for equipment
 */
async function scanForEquipment() {
    console.log('[Tribunal] ═══════════════════════════════════════');
    console.log('[Tribunal] Starting Equipment Scan...');
    console.log('[Tribunal] ═══════════════════════════════════════');
    
    // Check for active chat
    const chatState = getChatState();
    if (!chatState) {
        console.log('[Tribunal] ❌ No active chat state');
        if (typeof toastr !== 'undefined') {
            toastr.warning('No active chat', 'Equipment');
        }
        return;
    }
    
    // Lazy-load generation module
    if (!generateEquipmentFromMessage) {
        try {
            console.log('[Tribunal] Loading equipment-generation module...');
            const module = await import('../voice/equipment-generation.js');
            generateEquipmentFromMessage = module.generateEquipmentFromMessage;
            console.log('[Tribunal] ✓ Module loaded');
        } catch (e) {
            console.error('[Tribunal] ❌ Failed to load equipment generation:', e);
            if (typeof toastr !== 'undefined') {
                toastr.error('Equipment generation not available', 'Equipment');
            }
            return;
        }
    }
    
    // Gather text to scan from multiple sources
    const textParts = [];
    const ctx = getContext();
    
    console.log('[Tribunal] Gathering text sources...');
    
    // ─────────────────────────────────────────────────────────────
    // Source 1: Tribunal's persona context (if set)
    // ─────────────────────────────────────────────────────────────
    const persona = getPersona();
    if (persona?.context) {
        console.log('[Tribunal] ✓ Source 1: Tribunal persona context');
        console.log('[Tribunal]   Preview:', persona.context.substring(0, 100));
        textParts.push(`[TRIBUNAL PERSONA]\n${persona.context}`);
    } else {
        console.log('[Tribunal] ⏭️ Source 1: No Tribunal persona');
    }
    
    // ─────────────────────────────────────────────────────────────
    // Source 2: SillyTavern user persona
    // ─────────────────────────────────────────────────────────────
    const stPersona = getSTPersonaDescription();
    if (stPersona) {
        console.log('[Tribunal] ✓ Source 2: ST persona description');
        console.log('[Tribunal]   Length:', stPersona.length, 'chars');
        textParts.push(`[USER PERSONA - ${getSTPersonaName()}]\n${stPersona}`);
    } else {
        console.log('[Tribunal] ⏭️ Source 2: No ST persona');
    }
    
    // ─────────────────────────────────────────────────────────────
    // Source 3: AI Character description (sometimes describes player)
    // ─────────────────────────────────────────────────────────────
    if (ctx?.characters && ctx?.characterId !== undefined) {
        const char = ctx.characters[ctx.characterId];
        if (char?.description) {
            console.log('[Tribunal] ✓ Source 3: AI character description');
            textParts.push(`[CHARACTER: ${char.name || 'Unknown'}]\n${char.description}`);
        }
        if (char?.first_mes) {
            console.log('[Tribunal] ✓ Source 3b: AI first message');
            textParts.push(`[GREETING]\n${char.first_mes}`);
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // Source 4: Recent chat messages
    // ─────────────────────────────────────────────────────────────
    if (ctx?.chat && ctx.chat.length > 0) {
        const recentMessages = ctx.chat.slice(-10);
        let chatText = '';
        for (const msg of recentMessages) {
            if (msg.mes) {
                chatText += msg.mes + '\n';
            }
        }
        if (chatText.trim()) {
            console.log('[Tribunal] ✓ Source 4: Recent chat (', recentMessages.length, 'messages)');
            textParts.push(`[RECENT CHAT]\n${chatText}`);
        }
    } else {
        console.log('[Tribunal] ⏭️ Source 4: No chat messages');
    }
    
    // ─────────────────────────────────────────────────────────────
    // Check if we have anything to scan
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] Total sources found:', textParts.length);
    
    if (textParts.length === 0) {
        console.log('[Tribunal] ❌ No text sources found!');
        if (typeof toastr !== 'undefined') {
            toastr.warning('No persona or chat to scan.\nSet your character description in ST settings!', 'Equipment', { timeOut: 5000 });
        }
        return;
    }
    
    // Combine and limit size
    let combinedText = textParts.join('\n\n');
    if (combinedText.length > 8000) {
        console.log('[Tribunal] Truncating from', combinedText.length, 'to 8000 chars');
        combinedText = combinedText.substring(0, 8000);
    }
    
    console.log('[Tribunal] ═══════════════════════════════════════');
    console.log('[Tribunal] Scanning', combinedText.length, 'chars for equipment');
    console.log('[Tribunal] ═══════════════════════════════════════');
    
    if (typeof toastr !== 'undefined') {
        toastr.info('Scanning for equipment...', 'Equipment', { timeOut: 2000 });
    }
    
    try {
        const results = await generateEquipmentFromMessage(combinedText, {
            existingEquipment: getEquipmentItems()
        });
        
        console.log('[Tribunal] Scan results:', results);
        
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
                if (added) {
                    addedCount++;
                    console.log('[Tribunal] ✓ Added:', added.name);
                }
            }
            
            refreshEquipment();
            
            if (typeof toastr !== 'undefined') {
                toastr.success(`Found ${addedCount} item(s)`, 'Equipment');
            }
            console.log('[Tribunal] ✅ Scan complete:', addedCount, 'items added');
        } else {
            console.log('[Tribunal] Scan complete: No new equipment found');
            if (typeof toastr !== 'undefined') {
                toastr.info('No equipment found', 'Equipment');
            }
        }
        
    } catch (e) {
        console.error('[Tribunal] Scan failed:', e);
        if (typeof toastr !== 'undefined') {
            toastr.error('Scan failed: ' + e.message, 'Equipment');
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
            toggleEquipment(itemId);
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
    console.log('[Tribunal] Initializing equipment handlers...');
    
    // Add button
    const addBtn = document.getElementById('ie-equip-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddItemDialog);
        console.log('[Tribunal] ✓ Add button handler');
    }
    
    // Scan button
    let scanBtn = document.getElementById('ie-equip-scan-btn');
    if (!scanBtn && addBtn) {
        scanBtn = document.createElement('button');
        scanBtn.id = 'ie-equip-scan-btn';
        scanBtn.className = 'equip-scan-btn';
        scanBtn.innerHTML = '🔍 SCAN';
        scanBtn.title = 'Scan persona & chat for equipment';
        addBtn.parentNode.insertBefore(scanBtn, addBtn);
    }
    if (scanBtn) {
        scanBtn.addEventListener('click', scanForEquipment);
        console.log('[Tribunal] ✓ Scan button handler');
    }
    
    // Event delegation for items list
    const container = document.getElementById('ie-equip-items-list');
    if (container) {
        container.addEventListener('click', handleEquipmentClick);
        console.log('[Tribunal] ✓ Items list click handler');
    }
    
    // Listen for chat changes
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            console.log('[Tribunal] Chat changed - refreshing equipment');
            setTimeout(refreshEquipment, 100);
        });
        console.log('[Tribunal] ✓ CHAT_CHANGED listener');
    }
    
    // Initial render
    refreshEquipment();
    
    console.log('[Tribunal] Equipment handlers initialized');
}

// Export scan function for external use
export { scanForEquipment };
