/**
 * Inland Empire - Render Functions
 * All UI rendering for voices, attributes, status grid, and thought cabinet
 */

import { ATTRIBUTES, SKILLS } from '../data/skills.js';
import { STATUS_EFFECTS } from '../data/statuses.js';
import { THEMES, THOUGHTS } from '../data/thoughts.js';
import {
    activeStatuses,
    getAttributePoints,
    getSkillLevel,
    getEffectiveSkillLevel,
    extensionSettings,
    savedProfiles,
    thoughtCabinet,
    themeCounters
} from '../core/state.js';
import { getResearchPenalties, getTopThemes } from '../systems/cabinet.js';

// ═══════════════════════════════════════════════════════════════
// VOICE RENDERING
// ═══════════════════════════════════════════════════════════════

export function renderVoices(voiceResults, container) {
    if (!container) return;

    if (!voiceResults || voiceResults.length === 0) {
        container.innerHTML = `
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>The voices are silent...</span>
            </div>
        `;
        return;
    }

    container.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                // Critical success - show dramatically
                checkBadge = `<span class="ie-check-badge ie-critical-success" title="Double Sixes!">⚡ CRITICAL</span>`;
            } else if (voice.checkResult.isSnakeEyes) {
                // Critical failure - show dramatically
                checkBadge = `<span class="ie-check-badge ie-critical-failure" title="Snake Eyes!">💀 FUMBLE</span>`;
            } else if (extensionSettings.showDiceRolls) {
                // Normal check - show difficulty name + pass/fail like the game
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const cls = voice.checkResult.success ? 'ie-success' : 'ie-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="ie-check-badge ${cls}" title="${voice.checkResult.total} vs ${voice.checkResult.threshold}">${diffName} [${result}]</span>`;
            }
        } else if (voice.isAncient) {
            // Different icons for different ancient voices
            let ancientIcon = '🦎'; // Default: ARB
            if (voice.id === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.id === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="ie-check-badge ie-primal" title="Primal Voice">${ancientIcon}</span>`;
        } else if (voice.isIntrusive) {
            checkBadge = `<span class="ie-check-badge ie-intrusive" title="Intrusive Thought">💭</span>`;
        } else if (voice.isObject) {
            checkBadge = `<span class="ie-check-badge ie-object" title="Object Voice">${voice.icon || '📦'}</span>`;
        }

        return `
            <div class="ie-voice-line" style="border-left-color: ${voice.color}">
                <div class="ie-voice-header">
                    <span class="ie-voice-signature" style="color: ${voice.color}">${voice.signature || voice.name}</span>
                    ${checkBadge}
                </div>
                <div class="ie-voice-content">${voice.content}</div>
            </div>
        `;
    }).join('');
}

export function appendVoicesToChat(voiceResults, chatContainer) {
    if (!voiceResults || voiceResults.length === 0 || !chatContainer) return;

    // Find the last message element (SillyTavern uses .mes class)
    const messages = chatContainer.querySelectorAll('.mes');
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage) {
        console.warn('[Inland Empire] No messages found in chat container');
        return;
    }

    // Remove any existing voice block from this message to avoid duplicates
    const existingVoices = lastMessage.querySelector('.ie-chat-voices-block');
    if (existingVoices) existingVoices.remove();

    // Create the voices block
    const wrapper = document.createElement('div');
    wrapper.className = 'ie-chat-voices-block';
    
    // Add a subtle header
    const header = document.createElement('div');
    header.className = 'ie-chat-voices-header';
    header.innerHTML = `
        <span class="ie-chat-voices-title">
            <i class="fa-solid fa-brain"></i> Inner Voices
        </span>
        <button class="ie-chat-voices-toggle" title="Toggle voices">
            <i class="fa-solid fa-chevron-up"></i>
        </button>
    `;
    wrapper.appendChild(header);

    // Create voices container
    const voicesContainer = document.createElement('div');
    voicesContainer.className = 'ie-chat-voices-content';
    
    voicesContainer.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        let checkClass = '';
        
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                checkBadge = '<span class="ie-chat-badge ie-chat-crit-success">⚡ CRITICAL</span>';
                checkClass = 'ie-chat-critical-success';
            } else if (voice.checkResult.isSnakeEyes) {
                checkBadge = '<span class="ie-chat-badge ie-chat-crit-fail">💀 FUMBLE</span>';
                checkClass = 'ie-chat-critical-failure';
            } else {
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const badgeClass = voice.checkResult.success ? 'ie-chat-badge-success' : 'ie-chat-badge-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="ie-chat-badge ${badgeClass}">${diffName} [${result}]</span>`;
                checkClass = voice.checkResult.success ? 'ie-chat-success' : 'ie-chat-failure';
            }
        } else if (voice.isAncient) {
            let ancientIcon = '🦎';
            if (voice.skillId === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.skillId === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="ie-chat-badge ie-chat-badge-primal">${ancientIcon} Primal</span>`;
            checkClass = 'ie-chat-primal';
        } else if (voice.isIntrusive) {
            checkBadge = '<span class="ie-chat-badge ie-chat-badge-intrusive">💭 Intrusive</span>';
            checkClass = 'ie-chat-intrusive';
        } else if (voice.isObject) {
            checkBadge = `<span class="ie-chat-badge ie-chat-badge-object">${voice.icon || '📦'} Object</span>`;
            checkClass = 'ie-chat-object';
        }
        // Passive voices (no check) get no badge - they just observe

        return `
            <div class="ie-chat-voice ${checkClass}">
                <div class="ie-chat-voice-header">
                    <span class="ie-chat-voice-sig" style="color: ${voice.color}">${voice.signature || voice.name}</span>
                    ${checkBadge}
                </div>
                <span class="ie-chat-voice-text">${voice.content}</span>
            </div>
        `;
    }).join('');

    wrapper.appendChild(voicesContainer);

    // Add toggle functionality
    header.querySelector('.ie-chat-voices-toggle').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const content = wrapper.querySelector('.ie-chat-voices-content');
        const isCollapsed = content.classList.toggle('ie-collapsed');
        btn.innerHTML = isCollapsed ? 
            '<i class="fa-solid fa-chevron-down"></i>' : 
            '<i class="fa-solid fa-chevron-up"></i>';
    });

    // Find the message text container and append after it
    const mesText = lastMessage.querySelector('.mes_text');
    if (mesText) {
        mesText.insertAdjacentElement('afterend', wrapper);
    } else {
        // Fallback: just append to the message
        lastMessage.appendChild(wrapper);
    }
}

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

// ═══════════════════════════════════════════════════════════════
// STATUS GRID
// ═══════════════════════════════════════════════════════════════

export function renderStatusGrid(container, onToggle) {
    if (!container) return;

    // Group statuses by category
    const categories = {
        physical: { name: 'Physical', statuses: [] },
        mental: { name: 'Mental', statuses: [] },
        archetype: { name: 'Cop Archetypes', statuses: [] }
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
            <div class="ie-status-grid ${catId === 'archetype' ? 'ie-archetype-grid' : ''}">`;

        for (const status of category.statuses) {
            const isActive = activeStatuses.has(status.id);
            const boostList = status.boosts.map(s => SKILLS[s]?.signature || s).join(', ');
            const debuffList = status.debuffs.map(s => SKILLS[s]?.signature || s).join(', ');

            html += `
                <div class="ie-status-card ${isActive ? 'ie-status-active' : ''} ${catId === 'archetype' ? 'ie-archetype-card' : ''}" 
                     data-status="${status.id}" 
                     title="${status.description}&#10;&#10;↑ ${boostList}&#10;↓ ${debuffList}">
                    <span class="ie-status-icon">${status.icon}</span>
                    <span class="ie-status-name">${status.name}</span>
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
        .join(' ');

    const debuffHtml = Object.entries(debuffs)
        .map(([s, c]) => `<span class="ie-effect-debuff">-${c} ${SKILLS[s]?.signature || s}</span>`)
        .join(' ');

    container.innerHTML = `
        <div class="ie-effects-row">${boostHtml || '<em>No boosts</em>'}</div>
        <div class="ie-effects-row">${debuffHtml || '<em>No debuffs</em>'}</div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// PROFILES LIST
// ═══════════════════════════════════════════════════════════════

export function renderProfilesList(container, onLoad, onDelete) {
    if (!container) return;

    const profiles = Object.values(savedProfiles);

    if (profiles.length === 0) {
        container.innerHTML = '<div class="ie-profiles-empty"><em>No saved profiles</em></div>';
        return;
    }

    container.innerHTML = profiles.map(profile => `
        <div class="ie-profile-card" data-profile="${profile.id}">
            <div class="ie-profile-info">
                <span class="ie-profile-name">${profile.name}</span>
                <span class="ie-profile-date">${new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="ie-profile-actions">
                <button class="ie-btn ie-btn-sm ie-btn-load-profile" data-profile="${profile.id}" title="Load">
                    <i class="fa-solid fa-upload"></i>
                </button>
                <button class="ie-btn ie-btn-sm ie-btn-delete-profile" data-profile="${profile.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.ie-btn-load-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onLoad) onLoad(btn.dataset.profile);
        });
    });

    container.querySelectorAll('.ie-btn-delete-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onDelete) onDelete(btn.dataset.profile);
        });
    });
}

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

    // Attach callbacks
    container.querySelectorAll('.ie-btn-research').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onResearch) callbacks.onResearch(btn.dataset.thought);
        });
    });

    container.querySelectorAll('.ie-btn-dismiss-thought').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onDismiss) callbacks.onDismiss(btn.dataset.thought);
        });
    });

    container.querySelectorAll('.ie-btn-abandon').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onAbandon) callbacks.onAbandon(btn.dataset.thought);
        });
    });

    container.querySelectorAll('.ie-btn-forget').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbacks.onForget) callbacks.onForget(btn.dataset.thought);
        });
    });

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

    // Perspective toggle
    container.querySelectorAll('.ie-perspective-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.ie-perspective-btn').forEach(b => b.classList.remove('ie-perspective-active'));
            btn.classList.add('ie-perspective-active');
            
            const hint = document.getElementById('ie-perspective-hint');
            if (hint) {
                hint.textContent = btn.dataset.perspective === 'observer'
                    ? "Observer: You're wrestling with what you've seen, like Harry processing the world."
                    : "Participant: You're embodying this mindset, thinking from within it.";
            }
        });
    });
}

// Full thought modal/expanded view
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

    return container.querySelector('.ie-btn-close-modal');
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS SYNC
// ═══════════════════════════════════════════════════════════════

export function syncSettingsToUI() {
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = value;
        else el.value = value;
    };

    setValue('ie-api-endpoint', extensionSettings.apiEndpoint);
    setValue('ie-api-key', extensionSettings.apiKey);
    setValue('ie-model', extensionSettings.model);
    setValue('ie-temperature', extensionSettings.temperature);
    setValue('ie-max-tokens', extensionSettings.maxTokens);
    setValue('ie-min-voices', extensionSettings.voicesPerMessage?.min || 1);
    setValue('ie-max-voices', extensionSettings.voicesPerMessage?.max || 4);
    setValue('ie-trigger-delay', extensionSettings.triggerDelay);
    setValue('ie-show-dice-rolls', extensionSettings.showDiceRolls);
    setValue('ie-show-failed-checks', extensionSettings.showFailedChecks);
    setValue('ie-auto-trigger', extensionSettings.autoTrigger);
    setValue('ie-auto-detect-status', extensionSettings.autoDetectStatus);
    setValue('ie-intrusive-enabled', extensionSettings.intrusiveEnabled);
    setValue('ie-intrusive-in-chat', extensionSettings.intrusiveInChat);
    setValue('ie-intrusive-chance', (extensionSettings.intrusiveChance || 0.15) * 100);
    setValue('ie-object-voices-enabled', extensionSettings.objectVoicesEnabled);
    setValue('ie-object-chance', (extensionSettings.objectVoiceChance || 0.4) * 100);
    setValue('ie-thought-discovery-enabled', extensionSettings.thoughtDiscoveryEnabled);
    setValue('ie-auto-discover-thoughts', extensionSettings.autoDiscoverThoughts);
    setValue('ie-auto-generate-thoughts', extensionSettings.autoGenerateThoughts);
    setValue('ie-auto-gen-threshold', extensionSettings.autoGenThreshold || 10);
    setValue('ie-auto-gen-cooldown', extensionSettings.autoGenCooldown || 5);
    setValue('ie-auto-gen-perspective', extensionSettings.autoGenPerspective || 'observer');
    setValue('ie-auto-gen-player-context', extensionSettings.autoGenPlayerContext || '');
    setValue('ie-pov-style', extensionSettings.povStyle);
    setValue('ie-character-name', extensionSettings.characterName);
    setValue('ie-character-pronouns', extensionSettings.characterPronouns);
    setValue('ie-character-context', extensionSettings.characterContext);
    setValue('ie-show-in-chat', extensionSettings.showInChat);
    setValue('ie-auto-scan-enabled', extensionSettings.autoScanEnabled);

    // Show/hide auto-gen options
    const autoGenOptions = document.querySelectorAll('.ie-auto-gen-options');
    const showAutoGen = extensionSettings.autoGenerateThoughts;
    autoGenOptions.forEach(el => el.classList.toggle('ie-visible', showAutoGen));

    // Show/hide third person options
    const thirdPersonOptions = document.querySelectorAll('.ie-third-person-options');
    const showThird = extensionSettings.povStyle === 'third';
    thirdPersonOptions.forEach(el => el.style.display = showThird ? 'block' : 'none');
}

export function syncUIToSettings() {
    const getValue = (id, defaultVal) => {
        const el = document.getElementById(id);
        if (!el) return defaultVal;
        if (el.type === 'checkbox') return el.checked;
        if (el.type === 'number') return parseFloat(el.value) || defaultVal;
        return el.value || defaultVal;
    };

    extensionSettings.apiEndpoint = getValue('ie-api-endpoint', '');
    extensionSettings.apiKey = getValue('ie-api-key', '');
    extensionSettings.model = getValue('ie-model', 'glm-4-plus');
    extensionSettings.temperature = getValue('ie-temperature', 0.9);
    extensionSettings.maxTokens = getValue('ie-max-tokens', 300);
    extensionSettings.voicesPerMessage = {
        min: getValue('ie-min-voices', 1),
        max: getValue('ie-max-voices', 4)
    };
    extensionSettings.triggerDelay = getValue('ie-trigger-delay', 1000);
    extensionSettings.showDiceRolls = getValue('ie-show-dice-rolls', true);
    extensionSettings.showFailedChecks = getValue('ie-show-failed-checks', true);
    extensionSettings.autoTrigger = getValue('ie-auto-trigger', false);
    extensionSettings.autoDetectStatus = getValue('ie-auto-detect-status', false);
    extensionSettings.intrusiveEnabled = getValue('ie-intrusive-enabled', true);
    extensionSettings.intrusiveInChat = getValue('ie-intrusive-in-chat', true);
    extensionSettings.intrusiveChance = getValue('ie-intrusive-chance', 15) / 100;
    extensionSettings.objectVoicesEnabled = getValue('ie-object-voices-enabled', true);
    extensionSettings.objectVoiceChance = getValue('ie-object-chance', 40) / 100;
    extensionSettings.thoughtDiscoveryEnabled = getValue('ie-thought-discovery-enabled', true);
    extensionSettings.autoDiscoverThoughts = getValue('ie-auto-discover-thoughts', true);
    extensionSettings.autoGenerateThoughts = getValue('ie-auto-generate-thoughts', false);
    extensionSettings.autoGenThreshold = getValue('ie-auto-gen-threshold', 10);
    extensionSettings.autoGenCooldown = getValue('ie-auto-gen-cooldown', 5);
    extensionSettings.autoGenPerspective = getValue('ie-auto-gen-perspective', 'observer');
    extensionSettings.autoGenPlayerContext = getValue('ie-auto-gen-player-context', '');
    extensionSettings.povStyle = getValue('ie-pov-style', 'second');
    extensionSettings.characterName = getValue('ie-character-name', '');
    extensionSettings.characterPronouns = getValue('ie-character-pronouns', 'they');
    extensionSettings.characterContext = getValue('ie-character-context', '');
    extensionSettings.showInChat = getValue('ie-show-in-chat', true);
    extensionSettings.autoScanEnabled = getValue('ie-auto-scan-enabled', false);
}

export function clearVoices() {
    const container = document.getElementById('ie-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        `;
    }
}
