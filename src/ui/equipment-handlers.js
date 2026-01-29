/**
 * The Tribunal - Equipment Handlers (DIAGNOSTIC VERSION)
 * Martinaise Cleaners ticket system
 * 
 * This version includes detailed persona location logging
 * to help debug why user persona isn't being found
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
// PERSONA DIAGNOSTIC - Checks ALL possible locations
// ═══════════════════════════════════════════════════════════════

/**
 * Comprehensive persona finder with detailed logging
 * Returns the best persona found and logs everything
 */
function findUserPersona() {
    console.log('[Tribunal] ╔════════════════════════════════════════════╗');
    console.log('[Tribunal] ║       PERSONA LOCATION DIAGNOSTIC          ║');
    console.log('[Tribunal] ╚════════════════════════════════════════════╝');
    
    const found = [];
    
    // ─────────────────────────────────────────────────────────────
    // Location 1: window.power_user.persona_description
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 1: window.power_user.persona_description');
    try {
        if (window.power_user?.persona_description) {
            const desc = window.power_user.persona_description;
            console.log('[Tribunal]    ✓ FOUND! Length:', desc.length);
            console.log('[Tribunal]    Preview:', desc.substring(0, 150));
            found.push({ source: 'power_user.persona_description', value: desc, priority: 1 });
        } else {
            console.log('[Tribunal]    ❌ Empty or missing');
            if (window.power_user) {
                console.log('[Tribunal]    power_user exists but persona_description is:', window.power_user.persona_description);
            } else {
                console.log('[Tribunal]    window.power_user does not exist');
            }
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 2: window.power_user.personas (saved personas object)
    // THIS IS LIKELY WHERE YOUR PERSONA LIVES!
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 2: window.power_user.personas');
    try {
        if (window.power_user?.personas && typeof window.power_user.personas === 'object') {
            const keys = Object.keys(window.power_user.personas);
            console.log('[Tribunal]    ✓ Found personas object with', keys.length, 'entries');
            console.log('[Tribunal]    Keys:', keys.join(', '));
            
            // Check which one is currently selected
            const selectedName = window.power_user.persona_name || window.power_user.default_persona;
            console.log('[Tribunal]    🎯 SELECTED persona_name:', selectedName || 'NONE');
            
            // If we have a selected persona, prioritize it
            if (selectedName && window.power_user.personas[selectedName]) {
                const selectedDesc = window.power_user.personas[selectedName];
                console.log('[Tribunal]    ✓ SELECTED PERSONA FOUND!');
                console.log('[Tribunal]    Description:', selectedDesc.substring(0, 200));
                found.push({ source: `personas["${selectedName}"] (SELECTED)`, value: selectedDesc, priority: 0 }); // Highest priority!
            }
            
            // Also log other personas for reference
            for (const [name, desc] of Object.entries(window.power_user.personas)) {
                if (name === selectedName) continue; // Already added
                if (desc && typeof desc === 'string' && desc.length > 10) {
                    console.log('[Tribunal]    → Other: "' + name + '":', desc.substring(0, 60) + '...');
                    found.push({ source: `personas["${name}"]`, value: desc, priority: 3 });
                }
            }
        } else {
            console.log('[Tribunal]    ❌ No personas object');
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 2b: Check user_avatar to find matching persona
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 2b: user_avatar matching');
    try {
        const userAvatar = window.user_avatar || getContext()?.user_avatar;
        console.log('[Tribunal]    user_avatar:', userAvatar);
        
        if (userAvatar && window.power_user?.personas) {
            // Sometimes the persona key is the avatar filename
            if (window.power_user.personas[userAvatar]) {
                const desc = window.power_user.personas[userAvatar];
                console.log('[Tribunal]    ✓ Found persona by avatar key!');
                console.log('[Tribunal]    Description:', desc.substring(0, 150));
                found.push({ source: `personas[user_avatar="${userAvatar}"]`, value: desc, priority: 0 });
            }
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 3: DOM element #persona_description
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 3: DOM #persona_description');
    try {
        const el = document.getElementById('persona_description');
        if (el && el.value) {
            console.log('[Tribunal]    ✓ FOUND in DOM! Length:', el.value.length);
            console.log('[Tribunal]    Preview:', el.value.substring(0, 150));
            found.push({ source: 'DOM #persona_description', value: el.value, priority: 1 });
        } else if (el) {
            console.log('[Tribunal]    ⚠️ Element exists but value is empty');
        } else {
            console.log('[Tribunal]    ❌ Element not found');
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 4: jQuery (if available)
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 4: jQuery');
    try {
        if (window.$ || window.jQuery) {
            const $ = window.$ || window.jQuery;
            const val = $('#persona_description').val();
            if (val) {
                console.log('[Tribunal]    ✓ FOUND via jQuery! Length:', val.length);
                console.log('[Tribunal]    Preview:', val.substring(0, 150));
                // Don't double-add if DOM already found it
                if (!found.some(f => f.value === val)) {
                    found.push({ source: 'jQuery #persona_description', value: val, priority: 1 });
                }
            } else {
                console.log('[Tribunal]    ❌ jQuery found element but no value');
            }
        } else {
            console.log('[Tribunal]    ⚠️ jQuery not available');
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 5: SillyTavern.getContext()
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 5: SillyTavern.getContext()');
    try {
        if (window.SillyTavern?.getContext) {
            const stCtx = window.SillyTavern.getContext();
            if (stCtx.power_user?.persona_description) {
                console.log('[Tribunal]    ✓ FOUND! Length:', stCtx.power_user.persona_description.length);
                console.log('[Tribunal]    Preview:', stCtx.power_user.persona_description.substring(0, 150));
                found.push({ source: 'ST.getContext().power_user', value: stCtx.power_user.persona_description, priority: 1 });
            } else {
                console.log('[Tribunal]    ❌ No persona in ST context');
            }
        } else {
            console.log('[Tribunal]    ⚠️ SillyTavern.getContext not available');
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 6: getContext() from extensions.js (RPG Companion style)
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 6: getContext() import (RPG Companion style)');
    try {
        const ctx = getContext();
        console.log('[Tribunal]    name1 (user):', ctx.name1);
        console.log('[Tribunal]    name2 (AI):', ctx.name2);
        console.log('[Tribunal]    user_avatar:', ctx.user_avatar);
        
        // Check if there's a persona object
        if (ctx.persona) {
            console.log('[Tribunal]    ✓ ctx.persona exists:', typeof ctx.persona);
            if (typeof ctx.persona === 'string') {
                found.push({ source: 'getContext().persona', value: ctx.persona, priority: 0 });
            }
        }
        
        // Check for persona_description in context
        if (ctx.persona_description) {
            console.log('[Tribunal]    ✓ ctx.persona_description found!');
            console.log('[Tribunal]    Preview:', ctx.persona_description.substring(0, 150));
            found.push({ source: 'getContext().persona_description', value: ctx.persona_description, priority: 0 });
        }
        
        // Check extensionSettings for persona data
        if (ctx.extensionSettings?.persona) {
            console.log('[Tribunal]    ✓ extensionSettings.persona found');
        }
        
        // IMPORTANT: Check if user_avatar matches a persona key
        if (ctx.user_avatar && window.power_user?.personas?.[ctx.user_avatar]) {
            const desc = window.power_user.personas[ctx.user_avatar];
            console.log('[Tribunal]    ✓ Found persona via ctx.user_avatar key!');
            console.log('[Tribunal]    Preview:', desc.substring(0, 150));
            if (!found.some(f => f.value === desc)) {
                found.push({ source: `personas[ctx.user_avatar]`, value: desc, priority: 0 });
            }
        }
        
        // List all context keys for debugging
        const ctxKeys = Object.keys(ctx).filter(k => 
            k.toLowerCase().includes('persona') || 
            k.toLowerCase().includes('user') ||
            k.toLowerCase().includes('avatar') ||
            k.toLowerCase().includes('name')
        );
        console.log('[Tribunal]    Relevant context keys:', ctxKeys.join(', '));
        
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Location 7: window.user_avatar / persona management
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] 📍 Check 7: User avatar / persona management');
    try {
        if (window.user_avatar) {
            console.log('[Tribunal]    user_avatar:', window.user_avatar);
        }
        if (window.getUserAvatar) {
            console.log('[Tribunal]    getUserAvatar function exists');
        }
        if (window.setUserAvatar) {
            console.log('[Tribunal]    setUserAvatar function exists');
        }
    } catch (e) {
        console.log('[Tribunal]    ❌ Error:', e.message);
    }
    
    // ─────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────
    console.log('[Tribunal] ╔════════════════════════════════════════════╗');
    console.log('[Tribunal] ║              DIAGNOSTIC SUMMARY            ║');
    console.log('[Tribunal] ╚════════════════════════════════════════════╝');
    console.log('[Tribunal] Found', found.length, 'persona sources');
    
    if (found.length === 0) {
        console.log('[Tribunal] ❌ NO PERSONA FOUND ANYWHERE!');
        console.log('[Tribunal] ');
        console.log('[Tribunal] 👉 Make sure you have:');
        console.log('[Tribunal]    1. Created a persona in ST Settings > User Settings');
        console.log('[Tribunal]    2. SELECTED/ACTIVATED that persona');
        console.log('[Tribunal]    3. Added a description with your appearance');
        return null;
    }
    
    // Sort by priority and return best match
    found.sort((a, b) => a.priority - b.priority);
    
    // Look for one that contains punk/leather/mesh (user's actual persona)
    const userPersona = found.find(f => {
        const lower = f.value.toLowerCase();
        return lower.includes('leather') || lower.includes('mesh') || lower.includes('punk') || lower.includes('jacket');
    });
    
    if (userPersona) {
        console.log('[Tribunal] 🎯 Best match (contains your keywords):', userPersona.source);
        return userPersona.value;
    }
    
    // Otherwise return first found
    console.log('[Tribunal] 📝 Using first found:', found[0].source);
    return found[0].value;
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

export function refreshEquipment() {
    const container = document.getElementById('ie-equip-items-list');
    const ticketNumber = document.getElementById('ie-ticket-number');
    
    if (!container) return;
    
    const chatState = getChatState();
    if (!chatState) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        if (ticketNumber) ticketNumber.textContent = '----';
        return;
    }
    
    initializeEquipment();
    const equipment = getEquipment();
    
    if (ticketNumber && equipment.ticketNumber) {
        ticketNumber.textContent = equipment.ticketNumber;
    }
    
    container.innerHTML = '';
    
    if (!equipment.items || equipment.items.length === 0) {
        container.innerHTML = '<p class="equip-ticket-empty">No items checked in</p>';
        return;
    }
    
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
// SCAN FUNCTIONALITY (WITH DIAGNOSTIC)
// ═══════════════════════════════════════════════════════════════

async function scanForEquipment() {
    console.log('[Tribunal] ');
    console.log('[Tribunal] ████████████████████████████████████████████');
    console.log('[Tribunal] ██       EQUIPMENT SCAN STARTING          ██');
    console.log('[Tribunal] ████████████████████████████████████████████');
    console.log('[Tribunal] ');
    
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
    
    // ═══════════════════════════════════════════════════════════
    // RUN PERSONA DIAGNOSTIC
    // ═══════════════════════════════════════════════════════════
    const userPersonaText = findUserPersona();
    
    // Gather text to scan
    const textParts = [];
    const ctx = getContext();
    
    // ─────────────────────────────────────────────────────────────
    // Source 1: User Persona (from diagnostic) - HIGHEST PRIORITY
    // ─────────────────────────────────────────────────────────────
    if (userPersonaText) {
        console.log('[Tribunal] ✓ Adding USER PERSONA to scan');
        textParts.push(`[USER PERSONA]\n${userPersonaText}`);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Source 2: Tribunal's internal persona (if different)
    // ─────────────────────────────────────────────────────────────
    const tribunalPersona = getPersona();
    if (tribunalPersona?.context && tribunalPersona.context !== userPersonaText) {
        console.log('[Tribunal] ✓ Adding Tribunal persona context');
        textParts.push(`[TRIBUNAL PERSONA]\n${tribunalPersona.context}`);
    }
    
    // ─────────────────────────────────────────────────────────────
    // Source 3: Recent chat (ONLY if no persona found)
    // ─────────────────────────────────────────────────────────────
    if (textParts.length === 0 && ctx?.chat && ctx.chat.length > 0) {
        console.log('[Tribunal] ⚠️ No persona found, falling back to chat scan');
        const recentMessages = ctx.chat.slice(-10);
        let chatText = '';
        for (const msg of recentMessages) {
            if (msg.mes) chatText += msg.mes + '\n';
        }
        if (chatText.trim()) {
            textParts.push(`[RECENT CHAT]\n${chatText}`);
        }
    }
    
    // ─────────────────────────────────────────────────────────────
    // NOTE: We're NOT including AI character description anymore
    // That was causing the journalist clothes to appear
    // ─────────────────────────────────────────────────────────────
    
    console.log('[Tribunal] ');
    console.log('[Tribunal] Total scan sources:', textParts.length);
    
    if (textParts.length === 0) {
        console.log('[Tribunal] ❌ Nothing to scan!');
        if (typeof toastr !== 'undefined') {
            toastr.warning('No persona found. Check ST Settings > User Settings', 'Equipment', { timeOut: 5000 });
        }
        return;
    }
    
    // Combine text
    let combinedText = textParts.join('\n\n');
    if (combinedText.length > 8000) {
        combinedText = combinedText.substring(0, 8000);
    }
    
    console.log('[Tribunal] ');
    console.log('[Tribunal] ════════════════════════════════════════════');
    console.log('[Tribunal] SENDING TO AI:');
    console.log('[Tribunal] ════════════════════════════════════════════');
    console.log('[Tribunal] ', combinedText.substring(0, 500));
    console.log('[Tribunal] ... (', combinedText.length, 'total chars)');
    console.log('[Tribunal] ════════════════════════════════════════════');
    
    if (typeof toastr !== 'undefined') {
        toastr.info('Scanning for equipment...', 'Equipment', { timeOut: 2000 });
    }
    
    try {
        const results = await generateEquipmentFromMessage(combinedText, {
            existingEquipment: getEquipmentItems()
        });
        
        console.log('[Tribunal] ');
        console.log('[Tribunal] ════════════════════════════════════════════');
        console.log('[Tribunal] SCAN RESULTS:');
        console.log('[Tribunal] ════════════════════════════════════════════');
        console.log('[Tribunal] Error:', results.error || 'none');
        console.log('[Tribunal] Equipment found:', results.equipment?.length || 0);
        
        if (results.equipment?.length > 0) {
            results.equipment.forEach((item, i) => {
                console.log(`[Tribunal]   ${i + 1}. ${item.name} (${item.type})`);
            });
        }
        
        if (results.error) {
            console.warn('[Tribunal] ❌ Scan error:', results.error);
            if (typeof toastr !== 'undefined') {
                toastr.warning(`Scan issue: ${results.error}`, 'Equipment');
            }
            return;
        }
        
        if (results.equipment?.length > 0) {
            let addedCount = 0;
            for (const item of results.equipment) {
                console.log('[Tribunal] Adding item:', item.name);
                const added = addEquipment({
                    ...item,
                    equipped: true
                });
                if (added) {
                    addedCount++;
                    console.log('[Tribunal] ✓ Successfully added:', added.name);
                } else {
                    console.log('[Tribunal] ⚠️ addEquipment returned null/false for:', item.name);
                }
            }
            
            refreshEquipment();
            
            if (typeof toastr !== 'undefined') {
                toastr.success(`Found ${addedCount} item(s)`, 'Equipment');
            }
            console.log('[Tribunal] ✅ Scan complete:', addedCount, 'items added');
        } else {
            console.log('[Tribunal] No new equipment found');
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

export function initEquipmentHandlers() {
    console.log('[Tribunal] Initializing equipment handlers (diagnostic version)...');
    
    const addBtn = document.getElementById('ie-equip-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddItemDialog);
    }
    
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
    }
    
    const container = document.getElementById('ie-equip-items-list');
    if (container) {
        container.addEventListener('click', handleEquipmentClick);
    }
    
    if (eventSource && event_types?.CHAT_CHANGED) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            setTimeout(refreshEquipment, 100);
        });
    }
    
    refreshEquipment();
    console.log('[Tribunal] Equipment handlers initialized');
}

export { scanForEquipment, findUserPersona };
