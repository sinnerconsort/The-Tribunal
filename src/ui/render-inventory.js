/**
 * The Tribunal - Inventory Rendering
 * Items, equipment, and currency display
 */

import { SKILLS } from '../data/skills.js';

// ═══════════════════════════════════════════════════════════════
// INVENTORY RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render inventory items
 * @param {HTMLElement} container - The inventory grid container
 * @param {Array} items - Array of item objects
 * @param {Function} onItemClick - Callback when item is clicked
 */
export function renderInventoryItems(container, items = [], onItemClick = null) {
    if (!container) return;

    const category = container.id.replace('ie-inventory-', ''); // carried, worn, stored

    if (!items || items.length === 0) {
        const emptyIcons = {
            'carried': 'fa-hand',
            'worn': 'fa-shirt',
            'stored': 'fa-warehouse'
        };
        const emptyTexts = {
            'carried': 'Nothing in hand',
            'worn': 'Nothing equipped',
            'stored': 'Nothing stashed'
        };
        
        container.innerHTML = `
            <div class="ie-inventory-empty">
                <i class="fa-solid ${emptyIcons[category] || 'fa-box'}"></i>
                <span>${emptyTexts[category] || 'No items'}</span>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {
        const equippedClass = item.equipped ? 'ie-item-equipped' : '';
        
        // Build modifier badges
        let modifiersHtml = '';
        if (item.modifiers && item.modifiers.length > 0) {
            modifiersHtml = `<div class="ie-item-modifiers">
                ${item.modifiers.map(mod => {
                    const skill = SKILLS[mod.skill];
                    const sign = mod.value > 0 ? '+' : '';
                    const modClass = mod.value > 0 ? 'ie-mod-boost' : 'ie-mod-debuff';
                    return `<span class="ie-item-mod ${modClass}">${sign}${mod.value} ${skill?.signature || mod.skill}</span>`;
                }).join('')}
            </div>`;
        }

        return `
            <div class="ie-item-card ${equippedClass}" data-item-id="${item.id}">
                <span class="ie-item-icon">${item.icon || '📦'}</span>
                <div class="ie-item-info">
                    <div class="ie-item-name">${item.name}</div>
                    ${item.description ? `<div class="ie-item-desc">${item.description}</div>` : ''}
                    ${modifiersHtml}
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    if (onItemClick) {
        container.querySelectorAll('.ie-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.itemId;
                const item = items.find(i => i.id === itemId);
                if (item) onItemClick(item);
            });
        });
    }
}

/**
 * Update inventory count badges
 * @param {Object} counts - { carried: number, worn: number, stored: number }
 */
export function updateInventoryCounts(counts = {}) {
    const carriedEl = document.getElementById('ie-carried-count');
    const wornEl = document.getElementById('ie-worn-count');
    const storedEl = document.getElementById('ie-stored-count');

    if (carriedEl) carriedEl.textContent = counts.carried || 0;
    if (wornEl) wornEl.textContent = counts.worn || 0;
    if (storedEl) storedEl.textContent = counts.stored || 0;
}

/**
 * Render money display
 * @param {HTMLElement} container - #ie-money-display element
 * @param {number} amount - Amount of currency
 * @param {string} unit - Currency unit name (default: Réal)
 */
export function renderMoney(container, amount = 0, unit = 'Réal') {
    if (!container) return;

    container.innerHTML = `
        <span class="ie-money-amount">${amount.toLocaleString()}</span>
        <span class="ie-money-unit">${unit}</span>
    `;
}

/**
 * Render entire Inventory tab content
 * @param {Object} data - { carried, worn, stored, money }
 * @param {Function} onItemClick - Callback for item clicks
 */
export function renderInventoryTab(data = {}, onItemClick = null) {
    renderInventoryItems(
        document.getElementById('ie-inventory-carried'),
        data.carried,
        onItemClick
    );
    renderInventoryItems(
        document.getElementById('ie-inventory-worn'),
        data.worn,
        onItemClick
    );
    renderInventoryItems(
        document.getElementById('ie-inventory-stored'),
        data.stored,
        onItemClick
    );
    
    updateInventoryCounts({
        carried: data.carried?.length || 0,
        worn: data.worn?.length || 0,
        stored: data.stored?.length || 0
    });

    renderMoney(
        document.getElementById('ie-money-display'),
        data.money || 0
    );
}
