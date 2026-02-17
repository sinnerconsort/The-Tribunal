/**
 * The Tribunal - Voices Tab Template
 * Whirling-in-Rags napkin with collapsible skill accordion
 * 
 * @version 2.0.0 - Accordion rebuild with genre-aware names/descriptions
 */

import { getSettings, getChatState } from '../core/state.js';
import { ATTRIBUTES, SKILLS } from '../data/skills.js';
import {
    getActiveProfile,
    getSkillName,
    getCategoryName,
    getSkillDescription,
    getAncientName
} from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// STATIC HTML SHELL
// ═══════════════════════════════════════════════════════════════

export const VOICES_TAB_HTML = `
<div class="ie-tab-content voices-page ie-tab-content-active" data-tab-content="voices">
    <div class="voices-napkin">
        <!-- Decorations -->
        <div class="napkin-watermark">WHIRLING • IN • RAGS</div>
        <div class="napkin-lipstick"></div>
        <div class="napkin-phone-number">555-0139</div>
        
        <!-- Skill Accordion (populated by JS) -->
        <div class="skill-accordion" id="skill-accordion"></div>
        
        <!-- Inner Voices Section -->
        <div class="napkin-voices-section">
            <div class="napkin-voices-header">Inner Voices</div>
            
            <div class="napkin-voices-container" id="tribunal-voices-output">
                <div class="tribunal-voices-empty">
                    <i class="fa-solid fa-comment-slash"></i>
                    <span>...waiting for something to happen...</span>
                </div>
            </div>
        </div>
        
        <!-- Button pushed to bottom -->
        <div class="napkin-actions">
            <button class="btn-stamp" id="tribunal-rescan-btn">
                <i class="fa-solid fa-rotate"></i> CONSULT VOICES
            </button>
        </div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// ACCORDION STATE
// ═══════════════════════════════════════════════════════════════

let lastChangedCategory = null;
let expandedCategories = new Set();

// ═══════════════════════════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get effective skill level with proper inheritance
 * Priority: explicit skillLevels → parent attribute → default 3
 */
function getEffectiveSkillLevel(skillId, chatState) {
    if (!chatState) return 3;

    // Explicit individual override
    if (chatState.skillLevels?.[skillId] !== undefined) {
        const base = chatState.skillLevels[skillId];
        const bonus = chatState.skillBonuses?.[skillId] || 0;
        return Math.max(1, base + bonus);
    }

    // Inherit from parent attribute
    const skill = SKILLS[skillId];
    if (!skill) return 3;
    const attrId = skill.attribute.toLowerCase(); // 'INTELLECT' → 'intellect'
    const attrScore = chatState.attributes?.[attrId] ?? 3;
    const bonus = chatState.skillBonuses?.[skillId] || 0;
    return Math.max(1, attrScore + bonus);
}

/**
 * Get attribute score from state
 */
function getAttributeScore(attrId, chatState) {
    return chatState?.attributes?.[attrId] ?? 3;
}

// ═══════════════════════════════════════════════════════════════
// ACCORDION BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the skill accordion from current genre profile and chat state.
 * Call after tab is inserted into DOM.
 */
export function buildSkillAccordion() {
    const container = document.getElementById('skill-accordion');
    if (!container) return;

    const chatState = getChatState() || {};
    const profile = getActiveProfile();

    // Category order
    const categories = [
        { key: 'INTELLECT', stateKey: 'intellect' },
        { key: 'PSYCHE',    stateKey: 'psyche' },
        { key: 'PHYSIQUE',  stateKey: 'physique' },
        { key: 'MOTORICS',  stateKey: 'motorics' }
    ];

    let html = '';

    for (const cat of categories) {
        const attr = ATTRIBUTES[cat.key];
        if (!attr) continue;

        const score = getAttributeScore(cat.stateKey, chatState);
        const displayName = getCategoryName(cat.stateKey, attr.name);
        const isExpanded = lastChangedCategory === cat.stateKey
            || (lastChangedCategory === null && cat.key === 'INTELLECT'); // Default: first

        if (isExpanded) expandedCategories.add(cat.stateKey);

        // Build skill rows
        let skillRows = '';
        for (const skillId of attr.skills) {
            const skill = SKILLS[skillId];
            if (!skill) continue;

            const skillScore = getEffectiveSkillLevel(skillId, chatState);
            const skillDisplayName = getSkillName(skillId, skill.name);
            const skillFlavor = getSkillDescription(skillId);

            skillRows += `
                <div class="skill-row" data-skill="${skillId}">
                    <div class="skill-name-row">
                        <span class="skill-color-pip" style="background: ${attr.color}"></span>
                        <span class="skill-display-name">${skillDisplayName}</span>
                        <span class="skill-dots"></span>
                        <span class="skill-score">${skillScore}</span>
                    </div>
                    ${skillFlavor ? `<div class="skill-flavor">${skillFlavor}</div>` : ''}
                </div>`;
        }

        html += `
            <div class="skill-category${isExpanded ? ' expanded' : ''}" data-category="${cat.stateKey}">
                <div class="skill-category-header" data-category="${cat.stateKey}">
                    <span class="category-color-bar" style="background: ${attr.color}"></span>
                    <span class="category-arrow">${isExpanded ? '▾' : '▸'}</span>
                    <span class="category-name">${displayName.toUpperCase()}</span>
                    <span class="category-equals">=</span>
                    <span class="category-score" id="accordion-${cat.stateKey}-score">${score}</span>
                </div>
                <div class="skill-category-body" style="display: ${isExpanded ? 'block' : 'none'}">
                    ${skillRows}
                </div>
            </div>`;
    }

    container.innerHTML = html;

    // Bind click handlers
    container.querySelectorAll('.skill-category-header').forEach(header => {
        header.addEventListener('click', () => {
            const catId = header.dataset.category;
            const categoryEl = header.closest('.skill-category');
            const body = categoryEl?.querySelector('.skill-category-body');
            const arrow = header.querySelector('.category-arrow');
            if (!body || !arrow) return;

            const isOpen = categoryEl.classList.contains('expanded');
            if (isOpen) {
                categoryEl.classList.remove('expanded');
                body.style.display = 'none';
                arrow.textContent = '▸';
                expandedCategories.delete(catId);
            } else {
                categoryEl.classList.add('expanded');
                body.style.display = 'block';
                arrow.textContent = '▾';
                expandedCategories.add(catId);
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// SCORE UPDATES
// ═══════════════════════════════════════════════════════════════

/**
 * Refresh all displayed scores from current state.
 * Call after attribute/skill changes.
 */
export function updateSkillScores() {
    const chatState = getChatState() || {};
    const container = document.getElementById('skill-accordion');
    if (!container) return;

    // Update category scores
    for (const [key, attr] of Object.entries(ATTRIBUTES)) {
        const stateKey = attr.id; // 'intellect', 'psyche', etc.
        const scoreEl = document.getElementById(`accordion-${stateKey}-score`);
        if (scoreEl) {
            scoreEl.textContent = getAttributeScore(stateKey, chatState);
        }

        // Update individual skill scores
        for (const skillId of attr.skills) {
            const skillScoreEl = container.querySelector(`[data-skill="${skillId}"] .skill-score`);
            if (skillScoreEl) {
                skillScoreEl.textContent = getEffectiveSkillLevel(skillId, chatState);
            }
        }
    }
}

/**
 * Expand a specific category (call when that category's scores change).
 * Collapses others if desired.
 */
export function expandCategory(categoryId, collapseOthers = false) {
    lastChangedCategory = categoryId;

    const container = document.getElementById('skill-accordion');
    if (!container) return;

    if (collapseOthers) {
        container.querySelectorAll('.skill-category').forEach(cat => {
            const body = cat.querySelector('.skill-category-body');
            const arrow = cat.querySelector('.category-arrow');
            if (cat.dataset.category !== categoryId) {
                cat.classList.remove('expanded');
                if (body) body.style.display = 'none';
                if (arrow) arrow.textContent = '▸';
            }
        });
    }

    const target = container.querySelector(`[data-category="${categoryId}"].skill-category`);
    if (target) {
        const body = target.querySelector('.skill-category-body');
        const arrow = target.querySelector('.category-arrow');
        target.classList.add('expanded');
        if (body) body.style.display = 'block';
        if (arrow) arrow.textContent = '▾';
        expandedCategories.add(categoryId);
    }
}

/**
 * Full rebuild — call on genre change or chat switch
 */
export function refreshAccordion() {
    lastChangedCategory = null;
    expandedCategories.clear();
    buildSkillAccordion();
}
