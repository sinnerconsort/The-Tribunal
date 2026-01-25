/**
 * The Tribunal - Cabinet Handler
 * Wires the cabinet template UI to the cabinet.js logic
 * 
 * @version 5.0.0 - Redesigned for tabbed stack UI
 */

import { getChatState, saveChatState } from '../core/persistence.js';
import { SKILLS } from '../data/skills.js';
import { THEMES } from '../data/thoughts.js';
import { THEME_COLORS, DEFAULT_CARD_COLOR } from './cabinet-template.js';
import {
    getTopThemes,
    getThemeCounters,
    getThought,
    getDiscoveredThoughts,
    getInternalizedThoughts,
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

// Import status system for special effect application
import { setStatusByUIName, refreshStatusFromState } from './status-handlers.js';

// ═══════════════════════════════════════════════════════════════
// TAB SELECTION STATE
// Track which tab is active in each section
// ═══════════════════════════════════════════════════════════════

const selectedTabs = {
    research: null,
    discovered: null,
    internalized: null
};

// ═══════════════════════════════════════════════════════════════
// STATUS ID MAPPING (DE ID → UI Name)
// ═══════════════════════════════════════════════════════════════

const STATUS_ID_TO_UI = {
    // Physical
    'revacholian_courage': 'drunk',
    'pyrholidon': 'stimmed',
    'nicotine_rush': 'smoking',
    'volumetric_shit_compressor': 'hungover',
    'finger_on_the_eject_button': 'wounded',
    'waste_land': 'exhausted',
    'white_mourning': 'dying',
    // Mental
    'tequila_sunset': 'manic',
    'the_pale': 'dissociated',
    'homo_sexual_underground': 'infatuated',
    'jamrock_shuffle': 'lucky',
    'caustic_echo': 'terrified',
    'law_jaw': 'enraged',
    'the_expression': 'grieving'
};

// ═══════════════════════════════════════════════════════════════
// SPECIAL EFFECT APPLICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Apply a special effect when a thought is internalized
 * @param {Object} specialEffect - { type, target, description }
 * @param {Object} thought - The thought being internalized
 */
function applySpecialEffect(specialEffect, thought) {
    if (!specialEffect) return;
    
    console.log('[Tribunal] Applying special effect:', specialEffect);
    
    try {
        switch (specialEffect.type) {
            case 'toggle_state':
                let uiName = specialEffect.target;
                if (STATUS_ID_TO_UI[specialEffect.target]) {
                    uiName = STATUS_ID_TO_UI[specialEffect.target];
                }
                setStatusByUIName(uiName, true);
                showToast(`Effect: ${uiName} enabled`, 'success');
                break;
                
            case 'voice_amplify':
            case 'voice_silence':
            case 'no_buff_from':
                showToast(`Effect active: ${specialEffect.description || specialEffect.type}`, 'info');
                break;
                
            default:
                console.log('[Tribunal] Unknown effect type:', specialEffect.type);
        }
    } catch (error) {
        console.error('[Tribunal] Failed to apply special effect:', error);
    }
}

/**
 * Remove a special effect when a thought is forgotten
 * @param {Object} specialEffect - { type, target, description }
 * @param {Object} thought - The thought being forgotten
 */
function removeSpecialEffect(specialEffect, thought) {
    if (!specialEffect) return;
    
    console.log('[Tribunal] Removing special effect:', specialEffect);
    
    try {
        switch (specialEffect.type) {
            case 'toggle_state':
                let uiName = specialEffect.target;
                if (STATUS_ID_TO_UI[specialEffect.target]) {
                    uiName = STATUS_ID_TO_UI[specialEffect.target];
                }
                setStatusByUIName(uiName, false);
                showToast(`Effect: ${uiName} removed`, 'info');
                break;
                
            default:
                showToast(`Effect removed: ${specialEffect.description || specialEffect.type}`, 'info');
        }
    } catch (error) {
        console.error('[Tribunal] Failed to remove special effect:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize cabinet tab handlers
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
        fromChatCheckbox.checked = true;
    }
    
    // Role input - save on blur
    const roleInput = document.getElementById('cabinet-role-input');
    if (roleInput) {
        roleInput.addEventListener('blur', onRoleInputBlur);
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
    
    const activeBtn = document.querySelector('.cabinet-perspective-btn.active');
    const perspective = activeBtn?.dataset?.perspective || 'observer';
    
    console.log('[Tribunal] Generate clicked:', { concept, fromContext, perspective, playerIdentity });
    
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
            if (conceptInput) conceptInput.value = '';
            console.log('[Tribunal] Thought generated:', thought.name);
        }
    } catch (error) {
        console.error('[Tribunal] Generation error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
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
    
    document.querySelectorAll('.cabinet-perspective-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
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
// TAB CLICK HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle clicking a research tab
 */
function onResearchTabClick(thoughtId) {
    // Toggle: if already selected, deselect; otherwise select
    if (selectedTabs.research === thoughtId) {
        selectedTabs.research = null;
    } else {
        selectedTabs.research = thoughtId;
    }
    renderResearchContent();
    updateTabStates('research');
}

/**
 * Handle clicking a discovered tab
 */
function onDiscoveredTabClick(thoughtId) {
    if (selectedTabs.discovered === thoughtId) {
        selectedTabs.discovered = null;
    } else {
        selectedTabs.discovered = thoughtId;
    }
    renderDiscoveredContent();
    updateTabStates('discovered');
}

/**
 * Handle clicking an internalized tab
 */
function onInternalizedTabClick(thoughtId) {
    if (selectedTabs.internalized === thoughtId) {
        selectedTabs.internalized = null;
    } else {
        selectedTabs.internalized = thoughtId;
    }
    renderInternalizedContent();
    updateTabStates('internalized');
}

/**
 * Update tab active states
 */
function updateTabStates(section) {
    const tabRow = document.getElementById(`cabinet-${section}-tabs`);
    if (!tabRow) return;
    
    const selectedId = selectedTabs[section];
    
    tabRow.querySelectorAll('.cabinet-tab').forEach(tab => {
        if (tab.dataset.thoughtId === selectedId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle abandoning research
 */
function onAbandonResearch(thoughtId, e) {
    e?.stopPropagation();
    
    if (abandonResearch(thoughtId)) {
        if (selectedTabs.research === thoughtId) {
            selectedTabs.research = null;
        }
        showToast('Research abandoned', 'info');
        refreshCabinet();
    }
}

/**
 * Handle starting research on a discovered thought
 */
function onStartResearch(thoughtId, e) {
    e?.stopPropagation();
    
    const result = startResearch(thoughtId);
    
    if (result === true) {
        const thought = getThought(thoughtId);
        if (selectedTabs.discovered === thoughtId) {
            selectedTabs.discovered = null;
        }
        // Auto-select the newly researching thought
        selectedTabs.research = thoughtId;
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
 * Handle dismissing a discovered thought
 */
function onDismissThought(thoughtId, e) {
    e?.stopPropagation();
    
    if (dismissThought(thoughtId)) {
        if (selectedTabs.discovered === thoughtId) {
            selectedTabs.discovered = null;
        }
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
    
    if (thought?.specialEffect) {
        removeSpecialEffect(thought.specialEffect, thought);
    }
    
    if (forgetThought(thoughtId)) {
        if (selectedTabs.internalized === thoughtId) {
            selectedTabs.internalized = null;
        }
        showToast(`Forgot: ${thought?.name || 'thought'}`, 'info');
        refreshCabinet();
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Refresh all cabinet displays
 */
export function refreshCabinet() {
    // FIX: Reset tab selections on refresh to prevent phantom bleed
    // When switching chats, old thought IDs would persist and point to nothing
    selectedTabs.research = null;
    selectedTabs.discovered = null;
    selectedTabs.internalized = null;
    
    renderThemes();
    renderResearchTabs();
    renderResearchContent();
    renderDiscoveredTabs();
    renderDiscoveredContent();
    renderInternalizedTabs();
    renderInternalizedContent();
    updateCounters();
    updatePerspectiveButtons();
}

/**
 * Render theme badges
 */
function renderThemes() {
    const container = document.getElementById('cabinet-themes-list');
    if (!container) return;
    
    const topThemes = getTopThemes(5);
    
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
 * Get color for a thought based on its theme
 */
function getThoughtColor(thought) {
    if (thought?.theme && THEME_COLORS[thought.theme]) {
        return THEME_COLORS[thought.theme];
    }
    return DEFAULT_CARD_COLOR;
}

/**
 * Render research tabs
 */
function renderResearchTabs() {
    const tabRow = document.getElementById('cabinet-research-tabs');
    if (!tabRow) return;
    
    const state = getChatState();
    const researching = state?.thoughtCabinet?.researching || {};
    const researchingIds = Object.keys(researching);
    
    // FIX: Filter out orphaned thought IDs (thoughts that no longer exist)
    const validResearchingIds = researchingIds.filter(id => {
        const thought = getThought(id);
        if (!thought) {
            console.warn('[Tribunal] Orphaned research thought:', id);
            return false;
        }
        return true;
    });
    
    if (validResearchingIds.length === 0) {
        tabRow.innerHTML = '';
        return;
    }
    
    // Auto-select first if none selected
    if (!selectedTabs.research && validResearchingIds.length > 0) {
        selectedTabs.research = validResearchingIds[0];
    }
    
    tabRow.innerHTML = validResearchingIds.map((thoughtId, index) => {
        const thought = getThought(thoughtId);
        const color = getThoughtColor(thought);
        const isActive = selectedTabs.research === thoughtId;
        const progress = getResearchProgress(thoughtId)?.percent || 0;
        
        return `
            <div class="cabinet-tab ${isActive ? 'active' : ''}" 
                 data-thought-id="${thoughtId}"
                 style="--tab-bg: ${color.bg}; --tab-border: ${color.border}; --tab-index: ${index};">
                <span class="cabinet-tab-icon">${thought?.icon || '💭'}</span>
                <span class="cabinet-tab-name">${truncateText(thought?.name || '???', 12)}</span>
                <div class="cabinet-tab-progress" style="width: ${progress}%"></div>
            </div>
        `;
    }).join('');
    
    // Wire click handlers
    tabRow.querySelectorAll('.cabinet-tab').forEach(tab => {
        tab.addEventListener('click', () => onResearchTabClick(tab.dataset.thoughtId));
    });
}

/**
 * Render research content (selected card)
 */
function renderResearchContent() {
    const content = document.getElementById('cabinet-research-content');
    if (!content) return;
    
    const thoughtId = selectedTabs.research;
    
    if (!thoughtId) {
        const state = getChatState();
        const hasAny = Object.keys(state?.thoughtCabinet?.researching || {}).length > 0;
        content.innerHTML = hasAny 
            ? '<div class="cabinet-empty-message">Select a tab to view</div>'
            : '<div class="cabinet-empty-message">No thoughts being researched</div>';
        return;
    }
    
    const thought = getThought(thoughtId);
    const progressData = getResearchProgress(thoughtId);
    const progress = progressData?.percent || 0;
    const color = getThoughtColor(thought);
    
    content.innerHTML = `
        <div class="cabinet-card-expanded" style="--card-bg: ${color.bg}; --card-border: ${color.border};">
            <div class="cabinet-card-header">
                <span class="cabinet-card-icon">${thought?.icon || '💭'}</span>
                <span class="cabinet-card-title">${thought?.name || 'Unknown'}</span>
            </div>
            
            <div class="cabinet-card-progress-bar">
                <div class="cabinet-progress-fill" style="width: ${progress}%"></div>
                <span class="cabinet-progress-text">${progress}%</span>
            </div>
            
            <div class="cabinet-card-body">
                <div class="cabinet-card-text">${thought?.problemText || ''}</div>
            </div>
            
            <div class="cabinet-card-bonuses">
                ${renderBonuses(thought?.researchBonus, 'research')}
            </div>
            
            <div class="cabinet-card-actions">
                <button class="cabinet-abandon-btn" data-thought-id="${thoughtId}">
                    <i class="fa-solid fa-xmark"></i> Abandon
                </button>
            </div>
        </div>
    `;
    
    // Wire abandon button
    content.querySelector('.cabinet-abandon-btn')?.addEventListener('click', (e) => {
        onAbandonResearch(thoughtId, e);
    });
}

/**
 * Render discovered tabs
 */
function renderDiscoveredTabs() {
    const tabRow = document.getElementById('cabinet-discovered-tabs');
    if (!tabRow) return;
    
    const discovered = getDiscoveredThoughts();
    
    // FIX: Filter out orphaned thoughts
    const validDiscovered = discovered.filter(thought => {
        if (!thought || !thought.id) {
            console.warn('[Tribunal] Orphaned discovered thought');
            return false;
        }
        return true;
    });
    
    if (validDiscovered.length === 0) {
        tabRow.innerHTML = '';
        return;
    }
    
    // Auto-select first if none selected
    if (!selectedTabs.discovered && validDiscovered.length > 0) {
        selectedTabs.discovered = validDiscovered[0].id;
    }
    
    tabRow.innerHTML = validDiscovered.map((thought, index) => {
        const color = getThoughtColor(thought);
        const isActive = selectedTabs.discovered === thought.id;
        
        return `
            <div class="cabinet-tab ${isActive ? 'active' : ''}" 
                 data-thought-id="${thought.id}"
                 style="--tab-bg: ${color.bg}; --tab-border: ${color.border}; --tab-index: ${index};">
                <span class="cabinet-tab-icon">${thought.icon || '💭'}</span>
                <span class="cabinet-tab-name">${truncateText(thought.name || '???', 12)}</span>
            </div>
        `;
    }).join('');
    
    // Wire click handlers
    tabRow.querySelectorAll('.cabinet-tab').forEach(tab => {
        tab.addEventListener('click', () => onDiscoveredTabClick(tab.dataset.thoughtId));
    });
}

/**
 * Render discovered content (selected card)
 */
function renderDiscoveredContent() {
    const content = document.getElementById('cabinet-discovered-content');
    if (!content) return;
    
    const thoughtId = selectedTabs.discovered;
    
    if (!thoughtId) {
        const discovered = getDiscoveredThoughts();
        content.innerHTML = discovered.length > 0
            ? '<div class="cabinet-empty-message">Select a tab to view</div>'
            : '<div class="cabinet-empty-message">No thoughts discovered</div>';
        return;
    }
    
    const thought = getThought(thoughtId);
    const color = getThoughtColor(thought);
    
    content.innerHTML = `
        <div class="cabinet-card-expanded" style="--card-bg: ${color.bg}; --card-border: ${color.border};">
            <div class="cabinet-card-header">
                <span class="cabinet-card-icon">${thought?.icon || '💭'}</span>
                <span class="cabinet-card-title">${thought?.name || 'Unknown'}</span>
            </div>
            
            <div class="cabinet-card-body">
                <div class="cabinet-card-text">${thought?.problemText || ''}</div>
            </div>
            
            <div class="cabinet-card-actions">
                <button class="cabinet-research-btn" data-thought-id="${thoughtId}">
                    <i class="fa-solid fa-flask"></i> Research
                </button>
                <button class="cabinet-dismiss-btn" data-thought-id="${thoughtId}">
                    <i class="fa-solid fa-xmark"></i> Dismiss
                </button>
            </div>
        </div>
    `;
    
    // Wire buttons
    content.querySelector('.cabinet-research-btn')?.addEventListener('click', (e) => {
        onStartResearch(thoughtId, e);
    });
    content.querySelector('.cabinet-dismiss-btn')?.addEventListener('click', (e) => {
        onDismissThought(thoughtId, e);
    });
}

/**
 * Render internalized tabs
 */
function renderInternalizedTabs() {
    const tabRow = document.getElementById('cabinet-internalized-tabs');
    if (!tabRow) return;
    
    const internalized = getInternalizedThoughts();
    
    // FIX: Filter out orphaned thoughts
    const validInternalized = internalized.filter(thought => {
        if (!thought || !thought.id) {
            console.warn('[Tribunal] Orphaned internalized thought');
            return false;
        }
        return true;
    });
    
    if (validInternalized.length === 0) {
        tabRow.innerHTML = '';
        return;
    }
    
    // Auto-select first if none selected
    if (!selectedTabs.internalized && validInternalized.length > 0) {
        selectedTabs.internalized = validInternalized[0].id;
    }
    
    tabRow.innerHTML = validInternalized.map((thought, index) => {
        if (!thought) return '';
        const color = getThoughtColor(thought);
        const isActive = selectedTabs.internalized === thought.id;
        
        return `
            <div class="cabinet-tab ${isActive ? 'active' : ''}" 
                 data-thought-id="${thought.id}"
                 style="--tab-bg: ${color.bg}; --tab-border: ${color.border}; --tab-index: ${index};">
                <span class="cabinet-tab-icon">${thought.icon || '💭'}</span>
                <span class="cabinet-tab-name">${truncateText(thought.name || '???', 12)}</span>
            </div>
        `;
    }).filter(Boolean).join('');
    
    // Wire click handlers
    tabRow.querySelectorAll('.cabinet-tab').forEach(tab => {
        tab.addEventListener('click', () => onInternalizedTabClick(tab.dataset.thoughtId));
    });
}

/**
 * Render internalized content (selected card)
 */
function renderInternalizedContent() {
    const content = document.getElementById('cabinet-internalized-content');
    if (!content) return;
    
    const thoughtId = selectedTabs.internalized;
    
    if (!thoughtId) {
        const internalized = getInternalizedThoughts();
        content.innerHTML = internalized.length > 0
            ? '<div class="cabinet-empty-message">Select a tab to view</div>'
            : '<div class="cabinet-empty-message">No internalized thoughts</div>';
        return;
    }
    
    const thought = getThought(thoughtId);
    const color = getThoughtColor(thought);
    
    // Special effect HTML
    let specialEffectHtml = '';
    if (thought?.specialEffect) {
        const effect = thought.specialEffect;
        const desc = effect.description || `${effect.type}: ${effect.target}`;
        specialEffectHtml = `
            <div class="cabinet-special-effect">
                <i class="fa-solid fa-star"></i>
                <span>${desc}</span>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="cabinet-card-expanded" style="--card-bg: ${color.bg}; --card-border: ${color.border};">
            <div class="cabinet-card-header">
                <span class="cabinet-card-icon">${thought?.icon || '💭'}</span>
                <span class="cabinet-card-title">${thought?.name || 'Unknown'}</span>
            </div>
            
            <div class="cabinet-card-body">
                <div class="cabinet-card-label">Solution</div>
                <div class="cabinet-card-text">${thought?.solutionText || ''}</div>
            </div>
            
            <div class="cabinet-card-bonuses">
                ${renderBonuses(thought?.internalizedBonus, 'internalized')}
            </div>
            
            ${specialEffectHtml}
            
            <div class="cabinet-card-actions">
                <button class="cabinet-forget-btn" data-thought-id="${thoughtId}">
                    <i class="fa-solid fa-brain"></i> Forget
                </button>
            </div>
        </div>
    `;
    
    // Wire forget button
    content.querySelector('.cabinet-forget-btn')?.addEventListener('click', (e) => {
        onForgetThought(thoughtId, e);
    });
}

/**
 * Update slot counters
 */
function updateCounters() {
    const summary = getCabinetSummary();
    
    const researchCount = document.getElementById('cabinet-research-count');
    const internalizedCount = document.getElementById('cabinet-internalized-count');
    
    if (researchCount) {
        researchCount.textContent = summary.researching;
    }
    
    if (internalizedCount) {
        internalizedCount.textContent = `${summary.internalized}/${summary.maxInternalized}`;
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
        const skillName = skill?.name || formatSkillId(skillId);
        const value = typeof bonus === 'number' ? bonus : (bonus.value || 0);
        const flavor = typeof bonus === 'object' ? bonus.flavor : '';
        const sign = value > 0 ? '+' : '';
        const colorClass = value > 0 ? 'bonus-positive' : 'bonus-negative';
        
        // Don't show placeholder "reason" text
        const displayFlavor = (flavor && flavor.toLowerCase() !== 'reason') ? flavor : '';
        
        return `
            <div class="cabinet-bonus ${colorClass}">
                <span class="cabinet-bonus-value">${sign}${value}</span>
                <span class="cabinet-bonus-skill">${skillName}</span>
                ${displayFlavor ? `<span class="cabinet-bonus-flavor">: ${displayFlavor}</span>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Format a skill_id to readable name
 */
function formatSkillId(skillId) {
    return skillId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { 
    refreshCabinet as refreshCabinetTab,
    applySpecialEffect,
    removeSpecialEffect
};
