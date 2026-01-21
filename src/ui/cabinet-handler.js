/**
 * The Tribunal - Cabinet Handler
 * Wires the cabinet template UI to the cabinet.js logic
 */

import { getChatState, saveChatState } from '../core/state.js';
import { SKILLS } from '../data/skills.js';
import { THEMES } from '../data/thoughts.js';
import {
    getTopThemes,
    getThemeCounters,
    getThought,
    getDiscoveredThoughts,
    startResearch,
    abandonResearch,
    getResearchProgress,
    internalizeThought,
    forgetThought,
    dismissThought,
    getPlayerContext,
    setPlayerContext,
    getCabinetSummary,
    MAX_INTERNALIZED,
    MAX_RESEARCH_SLOTS
} from '../systems/cabinet.js';
import { handleGenerateThought } from '../voice/thought-generation.js';
import { showToast } from './toasts.js';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize cabinet tab handlers
 * Call this after the template is inserted into DOM
 */
export function initCabinetHandlers() {
    console.log('[Tribunal] Initializing cabinet handlers');
    
    // Generate button
    const generateBtn = document.getElementById('cabinet-generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', onGenerateClick);
    }
    
    // Perspective toggle buttons
    const perspectiveBtns = document.querySelectorAll('.cabinet-perspective-btn');
    perspectiveBtns.forEach(btn => {
        btn.addEventListener('click', onPerspectiveClick);
    });
    
    // From chat checkbox
    const fromChatCheckbox = document.getElementById('cabinet-from-chat');
    if (fromChatCheckbox) {
        fromChatCheckbox.checked = true; // Default on
    }
    
    // Role input - save on blur
    const roleInput = document.getElementById('cabinet-role-input');
    if (roleInput) {
        roleInput.addEventListener('blur', onRoleInputBlur);
        // Load existing context
        const ctx = getPlayerContext();
        roleInput.value = ctx.identity || '';
    }
    
    // Set initial perspective button state
    updatePerspectiveButtons();
    
    // Initial render
    refreshCabinet();
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle Generate button click
 */
async function onGenerateClick() {
    const conceptInput = document.getElementById('cabinet-concept-input');
    const roleInput = document.getElementById('cabinet-role-input');
    const fromChatCheckbox = document.getElementById('cabinet-from-chat');
    const generateBtn = document.getElementById('cabinet-generate-btn');
    
    const concept = conceptInput?.value?.trim() || '';
    const fromContext = fromChatCheckbox?.checked ?? true;
    const playerIdentity = roleInput?.value?.trim() || '';
    
    // Get current perspective
    const activeBtn = document.querySelector('.cabinet-perspective-btn.active');
    const perspective = activeBtn?.dataset?.perspective || 'observer';
    
    // Disable button during generation
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        const thought = await handleGenerateThought(
            { concept, fromContext, perspective, playerIdentity },
            refreshCabinet,
            showToast
        );
        
        if (thought) {
            // Clear concept input on success
            if (conceptInput) conceptInput.value = '';
        }
    } finally {
        // Re-enable button
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Generate';
        }
    }
}

/**
 * Handle perspective toggle click
 */
function onPerspectiveClick(e) {
    const btn = e.currentTarget;
    const perspective = btn.dataset.perspective;
    
    // Update button states
    document.querySelectorAll('.cabinet-perspective-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    // Save to state
    const state = getChatState();
    if (state) {
        state.thoughtCabinet.perspective = perspective;
        saveChatState();
    }
}

/**
 * Handle role input blur - save context
 */
function onRoleInputBlur(e) {
    const value = e.target.value?.trim() || '';
    setPlayerContext(value);
}

/**
 * Update perspective buttons to match state
 */
function updatePerspectiveButtons() {
    const ctx = getPlayerContext();
    const perspective = ctx.perspective || 'observer';
    
    document.querySelectorAll('.cabinet-perspective-btn').forEach(btn => {
        if (btn.dataset.perspective === perspective) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// RESEARCH SLOT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle clicking a discovered thought to research it
 */
function onDiscoveredThoughtClick(thoughtId) {
    const result = startResearch(thoughtId);
    
    if (result === true) {
        const thought = getThought(thoughtId);
        showToast(`Researching: ${thought?.name || 'thought'}`, 'info');
        refreshCabinet();
    } else if (result?.error === 'no_slots') {
        showToast('All research slots full', 'warning');
    } else if (result?.error === 'cap_reached') {
        showToast('Internalized thoughts at max (5)', 'warning');
    } else {
        showToast('Cannot research this thought', 'error');
    }
}

/**
 * Handle abandoning research
 */
function onAbandonResearch(thoughtId, e) {
    e?.stopPropagation();
    
    if (abandonResearch(thoughtId)) {
        showToast('Research abandoned', 'info');
        refreshCabinet();
    }
}

/**
 * Handle dismissing a discovered thought
 */
function onDismissThought(thoughtId, e) {
    e?.stopPropagation();
    
    if (dismissThought(thoughtId)) {
        showToast('Thought dismissed', 'info');
        refreshCabinet();
    }
}

/**
 * Handle forgetting an internalized thought
 */
function onForgetThought(thoughtId, e) {
    e?.stopPropagation();
    
    const thought = getThought(thoughtId);
    if (forgetThought(thoughtId)) {
        showToast(`Forgot: ${thought?.name || 'thought'}`, 'info');
        refreshCabinet();
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Full cabinet refresh
 */
export function refreshCabinet() {
    renderThemes();
    renderResearchSlots();
    renderDiscovered();
    renderInternalized();
    updateCounters();
}

/**
 * Render theme badges
 */
function renderThemes() {
    const container = document.getElementById('cabinet-themes-container');
    if (!container) return;
    
    const topThemes = getTopThemes(6);
    
    if (topThemes.length === 0) {
        container.innerHTML = '<div class="cabinet-themes-empty">No themes tracked yet</div>';
        return;
    }
    
    container.innerHTML = topThemes.map(theme => `
        <div class="cabinet-theme-badge" title="${theme.name}: ${theme.count}/10">
            <span class="cabinet-theme-icon">${theme.icon}</span>
            <span class="cabinet-theme-name">${theme.name}</span>
            <span class="cabinet-theme-count">${theme.count}</span>
        </div>
    `).join('');
}

/**
 * Render research slots (4 cards)
 */
function renderResearchSlots() {
    const state = getChatState();
    if (!state) return;
    
    const researching = state.thoughtCabinet.researching;
    const researchingIds = Object.keys(researching);
    
    // Get slot elements
    const slots = document.querySelectorAll('.cabinet-cascade-card');
    
    slots.forEach((slot, index) => {
        const thoughtId = researchingIds[index];
        
        if (thoughtId) {
            const thought = getThought(thoughtId);
            const progress = getResearchProgress(thoughtId);
            
            slot.classList.remove('empty-slot');
            slot.classList.add('has-thought');
            
            const front = slot.querySelector('.cabinet-card-front');
            const back = slot.querySelector('.cabinet-card-back-content');
            
            if (front) {
                front.innerHTML = `
                    <div class="cabinet-card-header">
                        <span class="cabinet-card-icon">${thought?.icon || '💭'}</span>
                        <span class="cabinet-card-title">${thought?.name || 'Unknown'}</span>
                    </div>
                    <div class="cabinet-card-progress">
                        <div class="cabinet-progress-bar">
                            <div class="cabinet-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="cabinet-progress-text">${progress}%</span>
                    </div>
                    <div class="cabinet-card-problem">${truncateText(thought?.problemText, 150)}</div>
                    <div class="cabinet-card-bonuses">${renderBonuses(thought?.researchBonus, 'research')}</div>
                    <button class="cabinet-abandon-btn" data-thought-id="${thoughtId}">
                        <i class="fa-solid fa-xmark"></i> Abandon
                    </button>
                `;
                
                // Wire abandon button
                const abandonBtn = front.querySelector('.cabinet-abandon-btn');
                if (abandonBtn) {
                    abandonBtn.addEventListener('click', (e) => onAbandonResearch(thoughtId, e));
                }
            }
            
            if (back) {
                back.innerHTML = `
                    <div class="cabinet-card-solution">${thought?.solutionText || ''}</div>
                    <div class="cabinet-card-bonuses">${renderBonuses(thought?.internalizedBonus, 'internalized')}</div>
                `;
            }
        } else {
            // Empty slot
            slot.classList.add('empty-slot');
            slot.classList.remove('has-thought', 'flipped');
            
            const front = slot.querySelector('.cabinet-card-front');
            if (front) {
                front.innerHTML = '<div class="cabinet-empty-slot-text">Empty slot...</div>';
            }
            
            const back = slot.querySelector('.cabinet-card-back-content');
            if (back) {
                back.innerHTML = '';
            }
        }
    });
}

/**
 * Render discovered thoughts
 */
function renderDiscovered() {
    const container = document.getElementById('cabinet-discovered-stack');
    if (!container) return;
    
    const discovered = getDiscoveredThoughts();
    
    if (discovered.length === 0) {
        container.innerHTML = '<div class="cabinet-discovered-empty">No thoughts discovered</div>';
        return;
    }
    
    container.innerHTML = discovered.map(thought => `
        <div class="cabinet-discovered-card" data-thought-id="${thought.id}">
            <div class="cabinet-discovered-header">
                <span class="cabinet-discovered-icon">${thought.icon || '💭'}</span>
                <span class="cabinet-discovered-title">${thought.name}</span>
            </div>
            <div class="cabinet-discovered-preview">${truncateText(thought.problemText, 100)}</div>
            <div class="cabinet-discovered-actions">
                <button class="cabinet-research-btn" data-thought-id="${thought.id}">
                    <i class="fa-solid fa-flask"></i> Research
                </button>
                <button class="cabinet-dismiss-btn" data-thought-id="${thought.id}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Wire up buttons
    container.querySelectorAll('.cabinet-research-btn').forEach(btn => {
        btn.addEventListener('click', () => onDiscoveredThoughtClick(btn.dataset.thoughtId));
    });
    
    container.querySelectorAll('.cabinet-dismiss-btn').forEach(btn => {
        btn.addEventListener('click', (e) => onDismissThought(btn.dataset.thoughtId, e));
    });
}

/**
 * Render internalized thoughts
 */
function renderInternalized() {
    const container = document.getElementById('cabinet-internalized-stack');
    if (!container) return;
    
    const state = getChatState();
    if (!state) return;
    
    const internalized = state.thoughtCabinet.internalized;
    
    if (internalized.length === 0) {
        container.innerHTML = '<div class="cabinet-internalized-empty">No internalized thoughts</div>';
        return;
    }
    
    container.innerHTML = internalized.map(thoughtId => {
        const thought = getThought(thoughtId);
        if (!thought) return '';
        
        return `
            <div class="cabinet-internalized-card" data-thought-id="${thoughtId}">
                <div class="cabinet-internalized-header">
                    <span class="cabinet-internalized-icon">${thought.icon || '💭'}</span>
                    <span class="cabinet-internalized-title">${thought.name}</span>
                </div>
                <div class="cabinet-internalized-bonuses">${renderBonuses(thought.internalizedBonus, 'internalized')}</div>
                ${thought.specialEffect ? `<div class="cabinet-special-effect">${thought.specialEffect}</div>` : ''}
                <button class="cabinet-forget-btn" data-thought-id="${thoughtId}">
                    <i class="fa-solid fa-brain"></i> Forget
                </button>
            </div>
        `;
    }).join('');
    
    // Wire up forget buttons
    container.querySelectorAll('.cabinet-forget-btn').forEach(btn => {
        btn.addEventListener('click', (e) => onForgetThought(btn.dataset.thoughtId, e));
    });
}

/**
 * Update slot counters
 */
function updateCounters() {
    const state = getChatState();
    if (!state) return;
    
    const researchCount = document.getElementById('cabinet-research-count');
    const internalizedCount = document.getElementById('cabinet-internalized-count');
    
    if (researchCount) {
        researchCount.textContent = Object.keys(state.thoughtCabinet.researching).length;
    }
    
    if (internalizedCount) {
        internalizedCount.textContent = state.thoughtCabinet.internalized.length;
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Render bonuses as HTML
 */
function renderBonuses(bonuses, type) {
    if (!bonuses || Object.keys(bonuses).length === 0) {
        return '';
    }
    
    return Object.entries(bonuses).map(([skillId, bonus]) => {
        const skill = SKILLS[skillId];
        const skillName = skill?.name || skillId;
        const value = bonus.value || bonus;
        const flavor = bonus.flavor || '';
        const sign = value > 0 ? '+' : '';
        const colorClass = value > 0 ? 'bonus-positive' : 'bonus-negative';
        
        return `
            <div class="cabinet-bonus ${colorClass}">
                <span class="cabinet-bonus-value">${sign}${value}</span>
                <span class="cabinet-bonus-skill">${skillName}</span>
                ${flavor ? `<span class="cabinet-bonus-flavor">: ${flavor}</span>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS FOR EXTERNAL USE
// ═══════════════════════════════════════════════════════════════

export { refreshCabinet as refreshCabinetTab };
