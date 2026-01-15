/**
 * The Tribunal - Status Rendering
 * Status grid and effects summary
 */

import { SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS, getStatusDisplayName, getStatusIcon } from '../data/statuses.js';
import { activeStatuses } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// STATUS GRID
// ═══════════════════════════════════════════════════════════════

export function renderStatusGrid(container, onToggle) {
    if (!container) return;

    // Group statuses by category
    const categories = {
        physical: { name: 'Physical', statuses: [] },
        mental: { name: 'Mental', statuses: [] },
        copotype: { name: 'Copotypes', statuses: [] }
    };

    Object.entries(STATUS_EFFECTS).forEach(([statusId, status]) => {
        const cat = categories[status.category] || categories.mental;
        cat.statuses.push({ id: statusId, ...status });
    });

    let html = '';

    for (const [catId, category] of Object.entries(categories)) {
        if (category.statuses.length === 0) continue;

        html += `<div class="ie-status-category">
            <div class="ie-status-category-header">${category.name}</div>
            <div class="ie-status-grid ${catId === 'copotype' ? 'ie-copotype-grid' : ''}">`;

        for (const status of category.statuses) {
            const isActive = activeStatuses.has(status.id);
            const boostList = status.boosts.map(s => SKILLS[s]?.signature || s).join(', ');
            const debuffList = status.debuffs.map(s => SKILLS[s]?.signature || s).join(', ');
            const displayName = getStatusDisplayName(status.id, isActive);
            const iconClass = getStatusIcon(status.id, isActive);

            html += `
                <div class="ie-status-card ${isActive ? 'ie-status-active' : ''} ${catId === 'copotype' ? 'ie-copotype-card' : ''}" 
                     data-status="${status.id}" 
                     title="${status.description}&#10;&#10;↑ ${boostList}&#10;↓ ${debuffList}">
                    <i class="ie-status-icon ${iconClass}"></i>
                    <span class="ie-status-name">${displayName}</span>
                </div>
            `;
        }

        html += `</div></div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.ie-status-card').forEach(card => {
        card.addEventListener('click', () => {
            const statusId = card.dataset.status;
            if (onToggle) onToggle(statusId);
        });
    });
}

export function renderActiveEffectsSummary(container) {
    if (!container) return;

    if (activeStatuses.size === 0) {
        container.innerHTML = '<em>No active status effects</em>';
        return;
    }

    const effects = [...activeStatuses].map(id => STATUS_EFFECTS[id]).filter(Boolean);

    const boosts = {};
    const debuffs = {};

    effects.forEach(status => {
        status.boosts.forEach(s => { boosts[s] = (boosts[s] || 0) + 1; });
        status.debuffs.forEach(s => { debuffs[s] = (debuffs[s] || 0) + 1; });
    });

    const boostHtml = Object.entries(boosts)
        .map(([s, c]) => `<span class="ie-effect-boost">+${c} ${SKILLS[s]?.signature || s}</span>`)
        .join('');

    const debuffHtml = Object.entries(debuffs)
        .map(([s, c]) => `<span class="ie-effect-debuff">-${c} ${SKILLS[s]?.signature || s}</span>`)
        .join('');

    container.innerHTML = `
        <div class="ie-effects-row ie-effects-boosts">${boostHtml || '<em>No boosts</em>'}</div>
        <div class="ie-effects-row ie-effects-debuffs">${debuffHtml || '<em>No debuffs</em>'}</div>
    `;
}
