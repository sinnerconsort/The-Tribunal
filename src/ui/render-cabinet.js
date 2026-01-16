/**
 * The Tribunal - Thought Cabinet Rendering
 * Themes, research, discovery, and internalization display
 */

import { SKILLS } from '../data/skills.js';
import { THOUGHTS } from '../data/thoughts.js';
import { thoughtCabinet, getPlayerContext, savePlayerContext } from '../core/state.js';
import { getResearchPenalties, getTopThemes } from '../systems/cabinet.js';

// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET
// ═══════════════════════════════════════════════════════════════

// Constants - should match cabinet.js
const MAX_INTERNALIZED_THOUGHTS = 5;
const RESEARCH_TIME_MULTIPLIER = 3;

// Helper to get thought from either THOUGHTS or customThoughts
function getThought(id) {
    return THOUGHTS[id] || thoughtCabinet.customThoughts?.[id];
}

// Format bonus with flavor text
function formatBonus(skillId, bonusData, isNegative = false) {
    const skill = SKILLS[skillId];
    const skillName = skill?.signature || skill?.name || skillId;
    
    // Handle both old format (just number) and new format (object with value/flavor)
    if (typeof bonusData === 'number') {
        const sign = bonusData > 0 ? '+' : '';
        return `<span class="${bonusData > 0 ? 'ie-bonus-positive' : 'ie-bonus-negative'}">${sign}${bonusData} ${skillName}</span>`;
    }
    
    const value = bonusData.value;
    const flavor = bonusData.flavor;
    const sign = value > 0 ? '+' : '';
    const cls = value > 0 ? 'ie-bonus-positive' : 'ie-bonus-negative';
    
    if (flavor) {
        return `<span class="${cls}">${sign}${value} <span class="ie-bonus-skill">${skillName}</span>: <em>${flavor}</em></span>`;
    }
    return `<span class="${cls}">${sign}${value} ${skillName}</span>`;
}

export function renderThoughtCabinet(container, callbacks = {}) {
    if (!container) return;

    const topThemes = getTopThemes(5);
    const researchPenalties = getResearchPenalties();

    // Theme tracker
    const themesHtml = topThemes.length > 0 ?
        topThemes.map(t => `<span class="ie-theme-tag">${t.icon} ${t.name}: ${t.count}</span>`).join('') :
        '<em>No themes tracked yet</em>';

    // Discovered thoughts (including custom)
    const discoveredHtml = thoughtCabinet.discovered.length > 0 ?
        thoughtCabinet.discovered.map(id => {
            const thought = getThought(id);
            if (!thought) return '';
            const customBadge = thought.isCustom ? '<span class="ie-custom-badge">Custom</span>' : '';
            
            // Short description for discovered (first sentence of problemText or description)
            const shortDesc = thought.problemText 
                ? thought.problemText.split('\n')[0].substring(0, 100) + '...'
                : thought.description || '';
            
            return `
                <div class="ie-thought-card ie-thought-discovered ${thought.isCustom ? 'ie-thought-custom' : ''}">
                    <div class="ie-thought-header">
                        <span class="ie-thought-icon">${thought.icon}</span>
                        <span class="ie-thought-name">${thought.name}</span>
                        ${customBadge}
                    </div>
                    <div class="ie-thought-desc">${shortDesc}</div>
                    <div class="ie-thought-actions">
                        <button class="ie-btn ie-btn-sm ie-btn-research" data-thought="${id}">Research</button>
                        <button class="ie-btn ie-btn-sm ie-btn-dismiss-thought" data-thought="${id}">Dismiss</button>
                    </div>
                </div>
            `;
        }).join('') :
        '<div class="ie-thoughts-empty"><em>No thoughts discovered</em></div>';

    // Researching thoughts with PROBLEM tab
    const researchingHtml = Object.entries(thoughtCabinet.researching).map(([id, research]) => {
        const thought = getThought(id);
        if (!thought) return '';
        const effectiveTime = (thought.researchTime || 10) * RESEARCH_TIME_MULTIPLIER;
        const progress = Math.min(100, (research.progress / effectiveTime) * 100);

        // Format research penalties with flavor
        const penaltyHtml = thought.researchBonus 
            ? Object.entries(thought.researchBonus)
                .map(([skillId, data]) => formatBonus(skillId, data))
                .join('<br>')
            : '';

        // Problem text (truncated for card view)
        const problemPreview = thought.problemText 
            ? thought.problemText.substring(0, 200).replace(/\n/g, ' ') + '...'
            : thought.description || '';

        return `
            <div class="ie-thought-card ie-thought-researching ${thought.isCustom ? 'ie-thought-custom' : ''}">
                <div class="ie-thought-header">
                    <span class="ie-thought-icon">${thought.icon}</span>
                    <span class="ie-thought-name">${thought.name}</span>
                    <button class="ie-btn ie-btn-xs ie-btn-expand-thought" data-thought="${id}" title="Read full thought">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                </div>
                <div class="ie-thought-progress">
                    <div class="ie-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="ie-thought-tab-label">PROBLEM</div>
                <div class="ie-thought-problem-preview">${problemPreview}</div>
                ${penaltyHtml ? `<div class="ie-thought-bonuses ie-research-penalties">${penaltyHtml}</div>` : ''}
                <button class="ie-btn ie-btn-sm ie-btn-abandon" data-thought="${id}">Abandon</button>
            </div>
        `;
    }).join('') || '<div class="ie-thoughts-empty"><em>Not researching anything</em></div>';

    // Internalized thoughts with SOLUTION and full bonuses
    const internalizedCount = thoughtCabinet.internalized.length;
    const atCap = internalizedCount >= MAX_INTERNALIZED_THOUGHTS;
    
    const internalizedHtml = internalizedCount > 0 ?
        thoughtCabinet.internalized.map(id => {
            const thought = getThought(id);
            if (!thought) return '';

            // Format internalized bonuses with flavor
            const bonusHtml = thought.internalizedBonus 
                ? Object.entries(thought.internalizedBonus)
                    .map(([skillId, data]) => formatBonus(skillId, data))
                    .join('<br>')
                : '';

            // Solution text preview
            const solutionPreview = thought.solutionText 
                ? thought.solutionText.substring(0, 150).replace(/\n/g, ' ') + '...'
                : thought.flavorText || '';

            return `
                <div class="ie-thought-card ie-thought-internalized ${thought.isCustom ? 'ie-thought-custom' : ''}">
                    <div class="ie-thought-header">
                        <span class="ie-thought-icon">${thought.icon}</span>
                        <span class="ie-thought-name">${thought.name}</span>
                        <button class="ie-btn ie-btn-xs ie-btn-expand-thought" data-thought="${id}" title="Read full thought">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                        <button class="ie-btn ie-btn-xs ie-btn-forget" data-thought="${id}" title="Forget this thought">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="ie-thought-tab-label ie-tab-solution">SOLUTION</div>
                    <div class="ie-thought-solution-preview">${solutionPreview}</div>
                    ${bonusHtml ? `<div class="ie-thought-bonuses">${bonusHtml}</div>` : ''}
                </div>
            `;
        }).join('') :
        '<div class="ie-thoughts-empty"><em>No internalized thoughts</em></div>';

    // Slots info
    const slotsUsed = Object.keys(thoughtCabinet.researching).length;
    const slotsAvailable = thoughtCabinet.slots;

    container.innerHTML = `
        <div class="ie-section">
            <div class="ie-section-header"><span>Themes</span></div>
            <div class="ie-themes-tracker">${themesHtml}</div>
        </div>

        <div class="ie-section">
            <div class="ie-section-header">
                <span>Researching</span>
                <span class="ie-slots-info">${slotsUsed}/${slotsAvailable} slots</span>
            </div>
            <div class="ie-thoughts-researching">${researchingHtml}</div>
        </div>

        <div class="ie-section">
            <div class="ie-section-header"><span>Discovered</span></div>
            <div class="ie-thoughts-discovered">${discoveredHtml}</div>
        </div>

        <div class="ie-section">
            <div class="ie-section-header">
                <span>Internalized</span>
                <span class="ie-slots-info ${atCap ? 'ie-cap-reached' : ''}">${internalizedCount}/${MAX_INTERNALIZED_THOUGHTS}</span>
            </div>
            ${atCap ? '<div class="ie-cap-warning">Cabinet full. Forget a thought to make room.</div>' : ''}
            <div class="ie-thoughts-internalized">${internalizedHtml}</div>
        </div>

        <div class="ie-section ie-thought-generator-section">
            <div class="ie-section-header">
                <span>Generate Thought</span>
            </div>
            <div class="ie-thought-generator-options">
                <label class="ie-checkbox ie-checkbox-sm">
                    <input type="checkbox" id="ie-thought-from-context" />
                    <span>From chat</span>
                </label>
                <div class="ie-perspective-toggle">
                    <button class="ie-perspective-btn ie-perspective-active" data-perspective="observer" title="You're processing what you witnessed">
                        👁️ Observer
                    </button>
                    <button class="ie-perspective-btn" data-perspective="participant" title="You're embodying this mindset">
                        🎭 Participant
                    </button>
                </div>
            </div>
            <div class="ie-player-context-row">
                <input type="text" id="ie-player-context" placeholder="Who are you? (e.g., 'a survivor who escaped', 'detective investigating')" />
            </div>
            <div class="ie-thought-generator">
                <textarea id="ie-thought-prompt" rows="2" placeholder="Enter a concept, obsession, or idea to mull over..."></textarea>
                <button class="ie-btn ie-btn-primary ie-btn-generate-thought" id="ie-generate-thought-btn">
                    <i class="fa-solid fa-lightbulb"></i>
                    <span>Generate</span>
                </button>
            </div>
            <small class="ie-form-hint" id="ie-perspective-hint">Observer: You're wrestling with what you've seen, like Harry processing the world.</small>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════
    // POPULATE FROM CURRENT PROFILE'S PLAYER CONTEXT
    // ═══════════════════════════════════════════════════════════════
    
    const playerCtx = getPlayerContext();
    const identityInput = document.getElementById('ie-player-context');
    
    // Load identity from profile
    if (identityInput && playerCtx.identity) {
        identityInput.value = playerCtx.identity;
    }
    
    // Set correct perspective button active based on profile
    if (playerCtx.perspective) {
        container.querySelectorAll('.ie-perspective-btn').forEach(btn => {
            btn.classList.toggle('ie-perspective-active', btn.dataset.perspective === playerCtx.perspective);
        });
        // Update hint text to match
        const hint = document.getElementById('ie-perspective-hint');
        if (hint) {
            hint.textContent = playerCtx.perspective === 'observer'
                ? "Observer: You're wrestling with what you've seen, like Harry processing the world."
                : "Participant: You're embodying this mindset, thinking from within it.";
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SAVE IDENTITY ON BLUR
    // ═══════════════════════════════════════════════════════════════
    
    identityInput?.addEventListener('blur', () => {
        const perspectiveBtn = container.querySelector('.ie-perspective-btn.ie-perspective-active');
        savePlayerContext({
            perspective: perspectiveBtn?.dataset?.perspective || 'observer',
            identity: identityInput.value.trim()
        }, callbacks.getContext?.());
    });

    // ═══════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════

    // Research button
    container.querySelectorAll('.ie-btn-research').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onResearch) callbacks.onResearch(btn.dataset.thought);
        });
    });

    // Dismiss button
    container.querySelectorAll('.ie-btn-dismiss-thought').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onDismiss) callbacks.onDismiss(btn.dataset.thought);
        });
    });

    // Abandon button
    container.querySelectorAll('.ie-btn-abandon').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onAbandon) callbacks.onAbandon(btn.dataset.thought);
        });
    });

    // Forget button
    container.querySelectorAll('.ie-btn-forget').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onForget) callbacks.onForget(btn.dataset.thought);
        });
    });

    // Expand button
    container.querySelectorAll('.ie-btn-expand-thought').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onExpand) callbacks.onExpand(btn.dataset.thought);
        });
    });

    // Generate thought button
    document.getElementById('ie-generate-thought-btn')?.addEventListener('click', () => {
        const prompt = document.getElementById('ie-thought-prompt')?.value?.trim();
        const fromContext = document.getElementById('ie-thought-from-context')?.checked;
        const playerContext = document.getElementById('ie-player-context')?.value?.trim();
        const perspectiveBtn = container.querySelector('.ie-perspective-btn.ie-perspective-active');
        const perspective = perspectiveBtn?.dataset?.perspective || 'observer';
        if (callbacks.onGenerate) callbacks.onGenerate(prompt, fromContext, perspective, playerContext);
    });

    // Perspective toggle - now saves to profile
    container.querySelectorAll('.ie-perspective-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.ie-perspective-btn').forEach(b => b.classList.remove('ie-perspective-active'));
            btn.classList.add('ie-perspective-active');
            
            // Update hint text
            const hint = document.getElementById('ie-perspective-hint');
            if (hint) {
                hint.textContent = btn.dataset.perspective === 'observer'
                    ? "Observer: You're wrestling with what you've seen, like Harry processing the world."
                    : "Participant: You're embodying this mindset, thinking from within it.";
            }
            
            // Save to profile
            const identityInput = document.getElementById('ie-player-context');
            savePlayerContext({
                perspective: btn.dataset.perspective,
                identity: identityInput?.value?.trim() || ''
            }, callbacks.getContext?.());
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// FULL THOUGHT MODAL / EXPANDED VIEW
// ═══════════════════════════════════════════════════════════════

export function renderThoughtModal(thoughtId, container) {
    const thought = getThought(thoughtId);
    if (!thought || !container) return;

    const isInternalized = thoughtCabinet.internalized.includes(thoughtId);
    const isResearching = thoughtId in thoughtCabinet.researching;

    // Format bonuses
    const researchBonusHtml = thought.researchBonus 
        ? Object.entries(thought.researchBonus)
            .map(([skillId, data]) => formatBonus(skillId, data))
            .join('<br>')
        : '';

    const internalizedBonusHtml = thought.internalizedBonus 
        ? Object.entries(thought.internalizedBonus)
            .map(([skillId, data]) => formatBonus(skillId, data))
            .join('<br>')
        : '';

    container.innerHTML = `
        <div class="ie-thought-modal">
            <div class="ie-thought-modal-header">
                <span class="ie-thought-icon-large">${thought.icon}</span>
                <h2 class="ie-thought-modal-name">${thought.name}</h2>
                <button class="ie-btn ie-btn-close-modal">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="ie-thought-modal-bonuses">
                <div class="ie-thought-modal-bonus-section">
                    <span class="ie-bonus-label">Bonuses from the thought:</span>
                    ${internalizedBonusHtml || '<em>None</em>'}
                </div>
                ${researchBonusHtml ? `
                <div class="ie-thought-modal-bonus-section ie-research-section">
                    <span class="ie-bonus-label">While researching:</span>
                    ${researchBonusHtml}
                </div>
                ` : ''}
            </div>

            <div class="ie-thought-modal-tabs">
                <button class="ie-thought-tab ${!isInternalized ? 'ie-thought-tab-active' : ''}" data-tab="problem">PROBLEM</button>
                <button class="ie-thought-tab ${isInternalized ? 'ie-thought-tab-active' : ''}" data-tab="solution">SOLUTION</button>
            </div>

            <div class="ie-thought-modal-content">
                <div class="ie-thought-tab-content ${!isInternalized ? 'ie-thought-tab-content-active' : ''}" data-tab-content="problem">
                    ${(thought.problemText || thought.description || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                <div class="ie-thought-tab-content ${isInternalized ? 'ie-thought-tab-content-active' : ''}" data-tab-content="solution">
                    ${isInternalized || isResearching 
                        ? (thought.solutionText || thought.flavorText || '').split('\n\n').map(p => `<p>${p}</p>`).join('')
                        : '<p class="ie-solution-locked"><i class="fa-solid fa-lock"></i> Complete research to unlock</p>'
                    }
                </div>
            </div>
        </div>
    `;

    // Tab switching
    container.querySelectorAll('.ie-thought-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.ie-thought-tab').forEach(t => t.classList.remove('ie-thought-tab-active'));
            container.querySelectorAll('.ie-thought-tab-content').forEach(c => c.classList.remove('ie-thought-tab-content-active'));
            tab.classList.add('ie-thought-tab-active');
            container.querySelector(`[data-tab-content="${tab.dataset.tab}"]`)?.classList.add('ie-thought-tab-content-active');
        });
    });

    // Close button handler
    const closeBtn = container.querySelector('.ie-btn-close-modal');
    closeBtn?.addEventListener('click', () => {
        container.remove();
    });
    
    // Close on overlay click (clicking outside modal box)
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            container.remove();
        }
    });

    return closeBtn;
}
