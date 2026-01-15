/**
 * The Tribunal - Attributes Rendering
 * Attribute display and build editor
 */

import { ATTRIBUTES, SKILLS } from '../data/skills.js';
import {
    getAttributePoints,
    getSkillLevel,
    getEffectiveSkillLevel
} from '../core/state.js';
import { getResearchPenalties } from '../systems/cabinet.js';

// ═══════════════════════════════════════════════════════════════
// ATTRIBUTES DISPLAY
// ═══════════════════════════════════════════════════════════════

export function renderAttributesDisplay(container) {
    if (!container) return;

    const attrPoints = getAttributePoints();
    const researchPenalties = getResearchPenalties();

    container.innerHTML = Object.entries(ATTRIBUTES).map(([attrId, attr]) => {
        const points = attrPoints[attrId] || 1;

        const skillsHtml = attr.skills.map(skillId => {
            const skill = SKILLS[skillId];
            const base = getSkillLevel(skillId);
            const effective = getEffectiveSkillLevel(skillId, researchPenalties);
            const diff = effective - base;
            const diffStr = diff > 0 ? `<span class="ie-mod-plus">+${diff}</span>` :
                           diff < 0 ? `<span class="ie-mod-minus">${diff}</span>` : '';

            return `
                <div class="ie-skill-row" title="${skill.name}">
                    <span class="ie-skill-name">${skill.signature}</span>
                    <span class="ie-skill-level">${base}${diffStr}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="ie-attribute-card" style="border-left-color: ${attr.color}">
                <div class="ie-attribute-header" style="background: linear-gradient(90deg, ${attr.color}66 0%, ${attr.color}22 50%, transparent 100%)">
                    <span class="ie-attribute-name">${attr.name}</span>
                    <span class="ie-attribute-points">${points}</span>
                </div>
                <div class="ie-attribute-skills">${skillsHtml}</div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
// BUILD EDITOR
// ═══════════════════════════════════════════════════════════════

export function renderBuildEditor(container, onPointChange) {
    if (!container) return;

    const attrPoints = getAttributePoints();

    container.innerHTML = Object.entries(ATTRIBUTES).map(([attrId, attr]) => {
        const points = attrPoints[attrId] || 1;

        return `
            <div class="ie-attr-editor-row">
                <span class="ie-attr-editor-name" style="color: ${attr.color}">${attr.name}</span>
                <div class="ie-attr-editor-controls">
                    <button class="ie-btn ie-btn-sm ie-attr-minus" data-attr="${attrId}" ${points <= 1 ? 'disabled' : ''}>−</button>
                    <span class="ie-attr-editor-value" id="ie-attr-${attrId}">${points}</span>
                    <button class="ie-btn ie-btn-sm ie-attr-plus" data-attr="${attrId}" ${points >= 6 ? 'disabled' : ''}>+</button>
                </div>
            </div>
        `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.ie-attr-minus, .ie-attr-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const attr = btn.dataset.attr;
            const delta = btn.classList.contains('ie-attr-plus') ? 1 : -1;
            if (onPointChange) onPointChange(attr, delta);
        });
    });
}

export function updatePointsRemaining(container, points) {
    if (container) {
        container.textContent = points;
        container.style.color = points === 0 ? '#4CAF50' : points < 0 ? '#f44336' : '#FFC107';
    }
}
