/**
 * The Tribunal - Investigation Case Linking UI
 * Handles the UI for linking discoveries to cases
 * 
 * @version 1.0.1 - Fixed potential load errors with lazy imports
 */

import { getChatState } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// LAZY-LOAD CASE INTELLIGENCE (avoid circular import issues)
// ═══════════════════════════════════════════════════════════════

let caseIntelModule = null;

async function getCaseIntel() {
    if (!caseIntelModule) {
        try {
            caseIntelModule = await import('./case-intelligence.js');
        } catch (e) {
            console.warn('[CaseLink] Could not load case-intelligence:', e);
            return null;
        }
    }
    return caseIntelModule;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MATCH_CONFIDENCE = {
    HIGH: 0.7,
    MEDIUM: 0.4,
    LOW: 0.2
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const CASE_LINK_STYLES = {
    linkBtn: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #5a7a5a;
        background: #3a4a3a;
        color: #c8d8c0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    `,
    linkBtnSuggested: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #8a7a40;
        background: #4a4530;
        color: #e8d8a0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        animation: case-link-pulse 2s ease-in-out infinite;
    `,
    linkBtnLinked: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        border: 1px solid #5a8a5a;
        background: #2a3a2a;
        color: #90b080;
        opacity: 0.8;
        cursor: default;
    `,
    dropdown: `
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        min-width: 220px;
        max-width: 300px;
        background: #f4ead5;
        border: 2px solid #5c4d3d;
        box-shadow: 3px 3px 0 rgba(0,0,0,0.2);
        font-family: 'Times New Roman', serif;
    `,
    dropdownHeader: `
        padding: 8px 12px;
        background: #2a2318;
        color: #e8dcc8;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
    `,
    dropdownItem: `
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #c8b8a0;
        font-size: 12px;
        color: #2a2318;
        display: flex;
        flex-direction: column;
        gap: 2px;
    `,
    dropdownTitle: `
        font-weight: bold;
        color: #2a2318;
    `,
    dropdownMeta: `
        font-size: 10px;
        color: #5c4d3d;
        font-style: italic;
    `,
    dropdownSuggestion: `
        padding: 8px 12px;
        background: rgba(138, 122, 64, 0.1);
        border-bottom: 1px solid #c8b8a0;
        font-size: 11px;
        color: #5a5030;
    `,
    dropdownEmpty: `
        padding: 12px;
        text-align: center;
        color: #5c4d3d;
        font-style: italic;
        font-size: 11px;
    `,
    notification: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background: #2a3a2a;
        border: 2px solid #5a8a5a;
        color: #c8e8c0;
        font-family: 'Times New Roman', serif;
        font-size: 13px;
        box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
        z-index: 10001;
        animation: case-link-slide-in 0.3s ease-out;
        max-width: 300px;
    `,
    notificationTitle: `
        font-weight: bold;
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #90c080;
        margin-bottom: 4px;
    `
};

// ═══════════════════════════════════════════════════════════════
// CSS INJECTION
// ═══════════════════════════════════════════════════════════════

const CASE_LINK_CSS = `
@keyframes case-link-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(138, 122, 64, 0.4); }
    50% { box-shadow: 0 0 0 4px rgba(138, 122, 64, 0); }
}

@keyframes case-link-slide-in {
    from { 
        transform: translateX(100%);
        opacity: 0;
    }
    to { 
        transform: translateX(0);
        opacity: 1;
    }
}

.case-link-dropdown-item:hover {
    background: #e8dcc8 !important;
}
`;

let cssInjected = false;

function injectCSS() {
    if (cssInjected) return;
    if (document.getElementById('tribunal-case-link-styles')) {
        cssInjected = true;
        return;
    }
    try {
        const style = document.createElement('style');
        style.id = 'tribunal-case-link-styles';
        style.textContent = CASE_LINK_CSS;
        document.head.appendChild(style);
        cssInjected = true;
    } catch (e) {
        console.warn('[CaseLink] Could not inject CSS:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let activeDropdown = null;
let linkedDiscoveries = new Map();
let globalClickListenerAdded = false;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 1) + '…';
}

function closeDropdown() {
    if (activeDropdown) {
        // Reset button highlight
        const wrapper = activeDropdown.parentElement;
        if (wrapper) {
            const btn = wrapper.querySelector('.case-link-btn:not(.linked)');
            if (btn) {
                btn.style.borderColor = '';
                btn.style.color = '';
            }
        }
        try {
            activeDropdown.remove();
        } catch (e) {
            // Ignore
        }
        activeDropdown = null;
    }
}

function showNotification(message, title = 'CASE UPDATED') {
    try {
        const existing = document.querySelector('.case-link-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'case-link-notification';
        notification.style.cssText = CASE_LINK_STYLES.notification;
        notification.innerHTML = `
            <div style="${CASE_LINK_STYLES.notificationTitle}">${title}</div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            notification.style.transition = 'all 0.3s ease-out';
            setTimeout(() => {
                try { notification.remove(); } catch (e) {}
            }, 300);
        }, 3000);
    } catch (e) {
        console.warn('[CaseLink] Notification error:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// BUTTON RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render the case link button for a discovery card
 * @param {object} discovery - The discovery object
 * @returns {string} HTML string for the button
 */
export function renderCaseLinkButton(discovery) {
    if (!discovery || !discovery.id) {
        return '';
    }
    
    injectCSS();
    
    // Check if already linked
    if (linkedDiscoveries.has(discovery.id)) {
        const state = getChatState();
        const caseId = linkedDiscoveries.get(discovery.id);
        const caseTitle = state?.cases?.[caseId]?.title || 'Case';
        return `
            <button class="case-link-btn linked" 
                    data-discovery-id="${discovery.id}" 
                    style="${CASE_LINK_STYLES.linkBtnLinked}"
                    disabled>
                📁 ${truncate(caseTitle, 15)}
            </button>
        `;
    }
    
    // Default button
    return `
        <div class="case-link-wrapper" style="position: relative; display: inline-block;">
            <button class="case-link-btn" 
                    data-discovery-id="${discovery.id}"
                    style="${CASE_LINK_STYLES.linkBtn}">
                📁 ADD TO CASE
            </button>
        </div>
    `;
}

/**
 * Render the case selection dropdown
 */
function renderCaseDropdown(discovery, activeCases, suggestions) {
    if (!activeCases || activeCases.length === 0) {
        return `
            <div class="case-link-dropdown" style="${CASE_LINK_STYLES.dropdown}">
                <div style="${CASE_LINK_STYLES.dropdownHeader}">LINK TO CASE</div>
                <div style="${CASE_LINK_STYLES.dropdownEmpty}">
                    No active cases. Create a case first.
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="case-link-dropdown" style="${CASE_LINK_STYLES.dropdown}">
            <div style="${CASE_LINK_STYLES.dropdownHeader}">LINK TO CASE</div>
    `;
    
    // Show suggestions first
    if (suggestions && suggestions.length > 0) {
        const topSuggestion = suggestions[0];
        const confidenceText = topSuggestion.confidence >= MATCH_CONFIDENCE.HIGH ? 'High match' :
                               topSuggestion.confidence >= MATCH_CONFIDENCE.MEDIUM ? 'Possible match' : 'Low match';
        
        html += `
            <div style="${CASE_LINK_STYLES.dropdownSuggestion}">
                ✦ Suggested: <strong>${truncate(topSuggestion.caseTitle, 25)}</strong>
                <br><span style="font-size: 9px;">${confidenceText}</span>
            </div>
        `;
    }
    
    // List all active cases
    for (const caseInfo of activeCases) {
        const priorityIcon = caseInfo.priority === 'main' ? '◉' : 
                            caseInfo.priority === 'optional' ? '○' : '◎';
        const isSuggested = suggestions && suggestions.some(s => s.caseId === caseInfo.id);
        
        html += `
            <div class="case-link-dropdown-item" 
                 data-case-id="${caseInfo.id}"
                 data-discovery-id="${discovery.id}"
                 style="${CASE_LINK_STYLES.dropdownItem}">
                <span style="${CASE_LINK_STYLES.dropdownTitle}">
                    ${priorityIcon} ${truncate(caseInfo.title, 30)}
                    ${isSuggested ? ' ✦' : ''}
                </span>
                <span style="${CASE_LINK_STYLES.dropdownMeta}">
                    ${caseInfo.hintCount || 0} hints • ${caseInfo.priority || 'side'}
                </span>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

async function showDropdown(wrapper, discovery) {
    closeDropdown();
    
    const caseIntel = await getCaseIntel();
    if (!caseIntel) {
        console.warn('[CaseLink] Case intelligence not available');
        if (typeof toastr !== 'undefined') {
            toastr.warning('Case system not available', 'The Tribunal');
        }
        return;
    }
    
    const state = getChatState();
    const cases = state?.cases || {};
    
    let matches = [];
    let activeCases = [];
    
    try {
        if (caseIntel.matchDiscoveryToCase) {
            matches = caseIntel.matchDiscoveryToCase(discovery, cases);
        }
        if (caseIntel.getActiveCasesForLinking) {
            activeCases = caseIntel.getActiveCasesForLinking();
        }
    } catch (e) {
        console.warn('[CaseLink] Error getting case data:', e);
    }
    
    // If no active cases, toast instead of showing a dead-end dropdown
    if (!activeCases || activeCases.length === 0) {
        if (typeof toastr !== 'undefined') {
            toastr.info('No active cases to link to. Create a case first via the Cases tab.', 'No Cases');
        }
        return;
    }
    
    const dropdownHtml = renderCaseDropdown(discovery, activeCases, matches);
    wrapper.insertAdjacentHTML('beforeend', dropdownHtml);
    
    activeDropdown = wrapper.querySelector('.case-link-dropdown');
    
    // Highlight the button as active
    const btn = wrapper.querySelector('.case-link-btn');
    if (btn) {
        btn.style.borderColor = '#8ab88a';
        btn.style.color = '#e0f0d8';
    }
    
    // Wire up dropdown item clicks
    if (activeDropdown) {
        activeDropdown.querySelectorAll('.case-link-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                handleLinkToCase(item.dataset.discoveryId, item.dataset.caseId, wrapper);
            });
        });
    }
}

async function handleLinkToCase(discoveryId, caseId, wrapper) {
    const caseIntel = await getCaseIntel();
    const state = getChatState();
    
    // Find discovery
    const discovery = state?.investigation?.discoveredObjects?.find(d => d.id === discoveryId) ||
                      { id: discoveryId, name: 'Discovery' };
    
    let success = false;
    
    if (caseIntel && caseIntel.linkDiscoveryToCase) {
        try {
            success = caseIntel.linkDiscoveryToCase(discovery, caseId, { autoLinked: false });
        } catch (e) {
            console.warn('[CaseLink] Link failed:', e);
        }
    }
    
    if (success) {
        linkedDiscoveries.set(discoveryId, caseId);
        
        // Update button
        const btn = wrapper.querySelector('.case-link-btn');
        if (btn) {
            const caseTitle = state?.cases?.[caseId]?.title || 'Case';
            btn.style.cssText = CASE_LINK_STYLES.linkBtnLinked;
            btn.innerHTML = `📁 ${truncate(caseTitle, 15)}`;
            btn.disabled = true;
            btn.classList.add('linked');
        }
        
        closeDropdown();
        
        // Toast so the user clearly sees it worked
        const caseTitle = state?.cases?.[caseId]?.title || 'case';
        if (typeof toastr !== 'undefined') {
            toastr.success(`Linked to "${caseTitle}"`, 'Evidence Filed');
        }
        showNotification(`Linked to "${caseTitle}"`);
    } else {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Could not link — may already be linked', 'The Tribunal');
        }
    }
}

/**
 * Initialize case link button handlers within a container
 * @param {Element} containerEl - Container with discovery cards
 * @param {Array} discoveries - Current discoveries array
 */
export function initCaseLinkHandlers(containerEl, discoveries) {
    if (!containerEl) return;
    
    // Add global click listener once
    if (!globalClickListenerAdded) {
        document.addEventListener('click', (e) => {
            if (activeDropdown && !e.target.closest('.case-link-wrapper')) {
                closeDropdown();
            }
        });
        globalClickListenerAdded = true;
    }
    
    // Button click handlers
    containerEl.querySelectorAll('.case-link-btn:not(.linked)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const discoveryId = btn.dataset.discoveryId;
            const discovery = discoveries.find(d => d.id === discoveryId);
            if (!discovery) return;
            
            const wrapper = btn.closest('.case-link-wrapper');
            if (!wrapper) return;
            
            // Toggle dropdown
            if (activeDropdown && activeDropdown.parentElement === wrapper) {
                closeDropdown();
            } else {
                showDropdown(wrapper, discovery);
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// AUTO-LINK PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Process discoveries for auto-linking when scan completes
 * @param {Array} discoveries - Array of discovery objects
 * @param {object} options - { autoLink: boolean }
 * @returns {Promise<Array>} Array of results
 */
export async function processDiscoveriesForAutoLink(discoveries, options = {}) {
    const { autoLink = true } = options;
    const results = [];
    
    if (!discoveries || !Array.isArray(discoveries)) {
        return results;
    }
    
    const caseIntel = await getCaseIntel();
    if (!caseIntel || !caseIntel.processDiscoveryForCases) {
        console.log('[CaseLink] Case intelligence not available for auto-linking');
        return results;
    }
    
    for (const discovery of discoveries) {
        if (!discovery) continue;
        
        try {
            const result = caseIntel.processDiscoveryForCases(discovery, {
                autoLink,
                notifyCallback: (notification) => {
                    if (notification && notification.type === 'auto-linked') {
                        linkedDiscoveries.set(discovery.id, notification.caseId);
                        showNotification(
                            `Auto-linked "${discovery.name}" to "${notification.case}"`,
                            'AUTO-FILED'
                        );
                    }
                }
            });
            
            results.push({
                discoveryId: discovery.id,
                ...result
            });
        } catch (e) {
            console.warn('[CaseLink] Auto-link error for discovery:', discovery.id, e);
        }
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    renderCaseLinkButton,
    initCaseLinkHandlers,
    processDiscoveriesForAutoLink,
    linkedDiscoveries
};
