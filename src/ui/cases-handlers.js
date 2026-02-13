/**
 * The Tribunal - Cases Handlers
 * UI logic for the DE-style journal/task list
 * 
 * Layout mirrors Disco Elysium:
 * - Left side: Task list grouped by day
 * - Right side (or expanded): Task details
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _casesData = null;

async function getPersistence() {
    if (!_persistence) {
        try {
            _persistence = await import('../core/persistence.js');
        } catch (e) {
            console.error('[Cases] Could not load persistence:', e.message);
            _persistence = {
                getChatState: () => null,
                saveChatState: () => {}
            };
        }
    }
    return _persistence;
}

async function getCasesData() {
    if (!_casesData) {
        try {
            _casesData = await import('../data/cases.js');
        } catch (e) {
            console.error('[Cases] Could not load cases data:', e.message);
            _casesData = {
                CASE_STATUS: { ACTIVE: 'active', COMPLETED: 'completed', FAILED: 'failed', TIMED: 'timed' },
                CASE_PRIORITY: { MAIN: 'main', SIDE: 'side', OPTIONAL: 'optional' },
                createCase: (o) => ({ id: `case_${Date.now()}`, title: 'Untitled', ...o }),
                formatFiledTime: () => 'UNKNOWN',
                groupCasesByDay: () => ({}),
                separateActiveClosed: () => ({ active: {}, closed: {} })
            };
        }
    }
    return _casesData;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let selectedCaseId = null;  // Currently selected case for detail view

async function getCases() {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state) return {};
    if (!state.cases) state.cases = {};
    return state.cases;
}

async function saveCase(caseObj) {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state) return;
    if (!state.cases) state.cases = {};
    
    caseObj.lastModified = Date.now();
    state.cases[caseObj.id] = caseObj;
    persistence.saveChatState();
}

async function deleteCase(caseId) {
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state?.cases) return;
    
    delete state.cases[caseId];
    persistence.saveChatState();
}

// ═══════════════════════════════════════════════════════════════
// RENDERING - TASK LIST (LEFT PANEL)
// ═══════════════════════════════════════════════════════════════

/**
 * Render a single task item in the list
 */
function renderTaskItem(caseObj, casesData) {
    const isSelected = selectedCaseId === caseObj.id;
    const isCompleted = caseObj.status === casesData.CASE_STATUS.COMPLETED;
    const isFailed = caseObj.status === casesData.CASE_STATUS.FAILED;
    const isTimed = caseObj.deadline != null;
    
    const statusClass = isCompleted ? 'completed' : isFailed ? 'failed' : '';
    const selectedClass = isSelected ? 'selected' : '';
    const priorityClass = `priority-${caseObj.priority || 'side'}`;
    
    // Timed icon for tasks with deadlines
    const timedIcon = isTimed ? '<span class="case-timed-icon">⏱</span>' : '';
    
    // Main task marker (like DE's clock icon for important tasks)
    const mainMarker = caseObj.priority === 'main' ? '<span class="case-main-marker">◉</span>' : '';
    
    return `
        <div class="case-item ${statusClass} ${selectedClass} ${priorityClass}" 
             data-case-id="${caseObj.id}"
             data-priority="${caseObj.priority || 'side'}">
            ${mainMarker}${timedIcon}
            <span class="case-title">${caseObj.title}</span>
        </div>
    `;
}

/**
 * Render a day group header
 */
function renderDayHeader(day) {
    return `<div class="case-day-header">${day}</div>`;
}

/**
 * Render the full task list grouped by day
 */
async function renderTaskList(cases, status = 'active') {
    const casesData = await getCasesData();
    const { active, closed } = casesData.separateActiveClosed(cases);
    
    const casesToRender = status === 'active' ? active : closed;
    const grouped = casesData.groupCasesByDay(casesToRender);
    
    if (Object.keys(grouped).length === 0) {
        return `<p class="ledger-empty">${status === 'active' ? 'No open cases' : 'No closed cases'}</p>`;
    }
    
    let html = '';
    
    // Render each day group
    for (const [day, dayCases] of Object.entries(grouped)) {
        html += renderDayHeader(day);
        for (const caseObj of dayCases) {
            html += renderTaskItem(caseObj, casesData);
        }
    }
    
    return html;
}

// ═══════════════════════════════════════════════════════════════
// RENDERING - TASK DETAIL (RIGHT PANEL / EXPANDED)
// ═══════════════════════════════════════════════════════════════

/**
 * Render the detail view for a selected case
 */
async function renderCaseDetail(caseId) {
    const cases = await getCases();
    const caseObj = cases[caseId];
    const casesData = await getCasesData();
    
    if (!caseObj) {
        return `<div class="case-detail-empty">Select a task to view details</div>`;
    }
    
    const filedTime = casesData.formatFiledTime(caseObj.filedAt, caseObj.filedDay);
    const isCompleted = caseObj.status === casesData.CASE_STATUS.COMPLETED;
    const isFailed = caseObj.status === casesData.CASE_STATUS.FAILED;
    const isClosed = isCompleted || isFailed;
    
    // Completion timestamp
    let completionHtml = '';
    if (isClosed && caseObj.completedAt) {
        const completedTime = casesData.formatFiledTime(caseObj.completedAt, caseObj.filedDay);
        const statusWord = isCompleted ? 'COMPLETED' : 'FAILED';
        completionHtml = `<div class="case-detail-completed">${statusWord} — ${completedTime}</div>`;
    }
    
    // Render hints/leads (orange bullets in DE)
    let hintsHtml = '';
    if (caseObj.hints && caseObj.hints.length > 0) {
        hintsHtml = `
            <ul class="case-hints">
                ${caseObj.hints.map(hint => `
                    <li class="case-hint ${hint.completed ? 'completed' : ''}" 
                        data-hint-id="${hint.id}"
                        data-case-id="${caseId}">
                        ${hint.text}
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    // Action buttons based on status
    let actionsHtml = '';
    if (!isClosed) {
        actionsHtml = `
            <div class="case-detail-actions">
                <button class="case-action-btn case-complete-btn" data-case-id="${caseId}">
                    <i class="fa-solid fa-check"></i> Complete
                </button>
                <button class="case-action-btn case-fail-btn" data-case-id="${caseId}">
                    <i class="fa-solid fa-times"></i> Failed
                </button>
                <button class="case-action-btn case-edit-btn" data-case-id="${caseId}">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
        `;
    } else {
        actionsHtml = `
            <div class="case-detail-actions">
                <button class="case-action-btn case-reopen-btn" data-case-id="${caseId}">
                    <i class="fa-solid fa-undo"></i> Reopen
                </button>
            </div>
        `;
    }
    
    // Add hint button (if not closed)
    let addHintHtml = '';
    if (!isClosed) {
        addHintHtml = `
            <button class="case-add-hint-btn" data-case-id="${caseId}">
                <i class="fa-solid fa-plus"></i> Add lead
            </button>
        `;
    }
    
    return `
        <div class="case-detail ${isClosed ? 'case-detail-closed' : ''}" data-case-id="${caseId}">
            <div class="case-detail-header">
                <h3 class="case-detail-title">${caseObj.title}</h3>
                <div class="case-detail-filed">FILED — ${filedTime}</div>
            </div>
            
            ${caseObj.description ? `
                <div class="case-detail-description">
                    ${caseObj.description}
                </div>
            ` : ''}
            
            ${hintsHtml}
            ${addHintHtml}
            
            ${completionHtml}
            
            ${actionsHtml}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Render the full cases section
 */
let _casesRenderRetries = 0;
const MAX_RENDER_RETRIES = 2;

export async function renderCasesList() {
    // ═══ STATE NULL GUARD ═══
    // During ST save/load cycles, getChatState() can transiently return null.
    // If we render during that window, we'd blank the list with "No open cases"
    // even though cases exist. Skip render entirely — stale content > blank content.
    const persistence = await getPersistence();
    const state = persistence.getChatState();
    if (!state) {
        console.log('[Cases] State transiently null - skipping render');
        if (_casesRenderRetries < MAX_RENDER_RETRIES) {
            _casesRenderRetries++;
            setTimeout(() => renderCasesList(), 150);
        }
        return;
    }
    _casesRenderRetries = 0;  // Reset on successful state access
    
    const activeListEl = document.getElementById('cases-active-list');
    const closedListEl = document.getElementById('cases-closed-list');
    const activeEmptyEl = document.getElementById('cases-active-empty');
    const closedEmptyEl = document.getElementById('cases-closed-empty');
    
    const cases = await getCases();
    const casesData = await getCasesData();
    const { active, closed } = casesData.separateActiveClosed(cases);
    
    // Render active cases
    if (activeListEl) {
        if (Object.keys(active).length === 0) {
            activeListEl.innerHTML = '';
            if (activeEmptyEl) activeEmptyEl.style.display = 'block';
        } else {
            activeListEl.innerHTML = await renderTaskList(cases, 'active');
            if (activeEmptyEl) activeEmptyEl.style.display = 'none';
        }
    }
    
    // Render closed cases
    if (closedListEl) {
        if (Object.keys(closed).length === 0) {
            closedListEl.innerHTML = '';
            if (closedEmptyEl) closedEmptyEl.style.display = 'block';
        } else {
            closedListEl.innerHTML = await renderTaskList(cases, 'closed');
            if (closedEmptyEl) closedEmptyEl.style.display = 'none';
        }
    }
    
    // Attach click handlers
    attachTaskListHandlers();
}

/**
 * Render case detail panel (call when a case is selected)
 */
export async function renderSelectedCaseDetail() {
    const detailEl = document.getElementById('case-detail-panel');
    if (!detailEl) return;
    
    // State null guard
    const persistence = await getPersistence();
    if (!persistence.getChatState()) return;
    
    if (selectedCaseId) {
        detailEl.innerHTML = await renderCaseDetail(selectedCaseId);
        detailEl.style.display = 'block';
        attachDetailHandlers();
    } else {
        detailEl.innerHTML = '';
        detailEl.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function attachTaskListHandlers() {
    // Click on a task to select it
    document.querySelectorAll('.case-item').forEach(item => {
        item.addEventListener('click', async () => {
            const caseId = item.dataset.caseId;
            
            // Toggle selection
            if (selectedCaseId === caseId) {
                selectedCaseId = null;
            } else {
                selectedCaseId = caseId;
            }
            
            // Update UI
            document.querySelectorAll('.case-item').forEach(el => {
                el.classList.toggle('selected', el.dataset.caseId === selectedCaseId);
            });
            
            await renderSelectedCaseDetail();
        });
    });
}

function attachDetailHandlers() {
    // Complete button
    document.querySelectorAll('.case-complete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const caseId = btn.dataset.caseId;
            const cases = await getCases();
            const casesData = await getCasesData();
            
            if (cases[caseId]) {
                const updated = casesData.completeCase(cases[caseId]);
                await saveCase(updated);
                await renderCasesList();
                await renderSelectedCaseDetail();
            }
        });
    });
    
    // Fail button
    document.querySelectorAll('.case-fail-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const caseId = btn.dataset.caseId;
            const cases = await getCases();
            const casesData = await getCasesData();
            
            if (cases[caseId]) {
                const updated = casesData.failCase(cases[caseId]);
                await saveCase(updated);
                await renderCasesList();
                await renderSelectedCaseDetail();
            }
        });
    });
    
    // Reopen button
    document.querySelectorAll('.case-reopen-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const caseId = btn.dataset.caseId;
            const cases = await getCases();
            const casesData = await getCasesData();
            
            if (cases[caseId]) {
                const updated = casesData.reopenCase(cases[caseId]);
                await saveCase(updated);
                await renderCasesList();
                await renderSelectedCaseDetail();
            }
        });
    });
    
    // Hint toggle (click to mark complete/incomplete)
    document.querySelectorAll('.case-hint').forEach(hint => {
        hint.addEventListener('click', async () => {
            const caseId = hint.dataset.caseId;
            const hintId = hint.dataset.hintId;
            const cases = await getCases();
            const casesData = await getCasesData();
            
            if (cases[caseId]) {
                const updated = casesData.toggleHint(cases[caseId], hintId);
                await saveCase(updated);
                await renderSelectedCaseDetail();
            }
        });
    });
    
    // Add lead button - show inline form
    document.querySelectorAll('.case-add-hint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const caseId = btn.dataset.caseId;
            showAddHintForm(caseId, btn);
        });
    });
    
    // Edit button - show edit form
    document.querySelectorAll('.case-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const caseId = btn.dataset.caseId;
            showEditCaseForm(caseId);
        });
    });
}

/**
 * Show inline form for adding a hint/lead
 */
function showAddHintForm(caseId, buttonEl) {
    // Remove existing form if any
    document.getElementById('case-add-hint-form')?.remove();
    
    const formHtml = `
        <div class="case-hint-form" id="case-add-hint-form">
            <input type="text" class="case-hint-input" id="case-hint-input" 
                   placeholder="New lead..." autocomplete="off">
            <button class="case-hint-save" id="case-hint-save" data-case-id="${caseId}">+</button>
            <button class="case-hint-cancel" id="case-hint-cancel">✕</button>
        </div>
    `;
    
    buttonEl.insertAdjacentHTML('beforebegin', formHtml);
    buttonEl.style.display = 'none';
    
    const input = document.getElementById('case-hint-input');
    input?.focus();
    
    // Save hint
    document.getElementById('case-hint-save')?.addEventListener('click', async () => {
        const text = input?.value?.trim();
        if (text) {
            const cases = await getCases();
            const casesData = await getCasesData();
            if (cases[caseId]) {
                const updated = casesData.addHint(cases[caseId], text);
                await saveCase(updated);
                await renderSelectedCaseDetail();
            }
        }
    });
    
    // Cancel
    document.getElementById('case-hint-cancel')?.addEventListener('click', async () => {
        await renderSelectedCaseDetail();
    });
    
    // Enter to save
    input?.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('case-hint-save')?.click();
        } else if (e.key === 'Escape') {
            await renderSelectedCaseDetail();
        }
    });
}

/**
 * Show edit form for a case
 */
async function showEditCaseForm(caseId) {
    const cases = await getCases();
    const caseObj = cases[caseId];
    if (!caseObj) return;
    
    const detailPanel = document.getElementById('case-detail-panel');
    if (!detailPanel) return;
    
    detailPanel.innerHTML = `
        <div class="case-detail case-edit-mode" data-case-id="${caseId}">
            <div class="case-edit-form">
                <input type="text" class="case-form-input" id="case-edit-title" 
                       value="${caseObj.title || ''}" placeholder="Task title...">
                <textarea class="case-form-textarea" id="case-edit-description" 
                          placeholder="Description...">${caseObj.description || ''}</textarea>
                <div class="case-edit-actions">
                    <button class="case-mini-btn case-mini-cancel" id="case-edit-cancel">Cancel</button>
                    <button class="case-mini-btn case-mini-save" id="case-edit-save">Save</button>
                    <button class="case-mini-btn case-delete-btn" id="case-edit-delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Save
    document.getElementById('case-edit-save')?.addEventListener('click', async () => {
        const title = document.getElementById('case-edit-title')?.value?.trim();
        const description = document.getElementById('case-edit-description')?.value?.trim();
        
        if (title) {
            caseObj.title = title;
            caseObj.description = description || '';
            await saveCase(caseObj);
            await renderCasesList();
            await renderSelectedCaseDetail();
        }
    });
    
    // Cancel
    document.getElementById('case-edit-cancel')?.addEventListener('click', async () => {
        await renderSelectedCaseDetail();
    });
    
    // Delete
    document.getElementById('case-edit-delete')?.addEventListener('click', async () => {
        if (confirm('Delete this task?')) {
            await deleteCase(caseId);
            selectedCaseId = null;
            await renderCasesList();
            await renderSelectedCaseDetail();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// ADD CASE (inline form similar to contacts)
// ═══════════════════════════════════════════════════════════════

/**
 * Show the add case form
 */
export function showAddCaseForm() {
    const addBtn = document.getElementById('cases-add-btn');
    if (!addBtn) return;
    
    // Check if form already exists
    if (document.getElementById('case-inline-add-form')) {
        return;
    }
    
    addBtn.style.display = 'none';
    
    const formHtml = `
        <div class="case-inline-form" id="case-inline-add-form">
            <div class="case-mini-row">
                <input type="text" id="case-input-title" class="case-form-input" 
                       placeholder="Task title..." autocomplete="off">
            </div>
            <div class="case-mini-row">
                <input type="text" id="case-input-description" class="case-form-input" 
                       placeholder="Description (optional)..." autocomplete="off">
            </div>
            <div class="case-mini-row case-form-options">
                <select id="case-input-priority" class="case-form-select">
                    <option value="side">Side Task</option>
                    <option value="main">Main Task</option>
                    <option value="optional">Optional</option>
                </select>
                <label class="case-timed-toggle">
                    <input type="checkbox" id="case-input-timed">
                    <span>⏱ Timed</span>
                </label>
            </div>
            <div class="case-mini-actions">
                <button class="case-mini-btn case-mini-cancel" id="case-inline-cancel">✕</button>
                <button class="case-mini-btn case-mini-save" id="case-inline-save">ADD</button>
            </div>
        </div>
    `;
    
    addBtn.insertAdjacentHTML('afterend', formHtml);
    
    // Focus title input
    const titleInput = document.getElementById('case-input-title');
    setTimeout(() => titleInput?.focus(), 50);
    
    // Wire up buttons
    document.getElementById('case-inline-cancel')?.addEventListener('click', hideAddCaseForm);
    document.getElementById('case-inline-save')?.addEventListener('click', handleAddCaseSave);
    
    // Enter to save
    titleInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCaseSave();
        }
    });
}

function hideAddCaseForm() {
    const form = document.getElementById('case-inline-add-form');
    const addBtn = document.getElementById('cases-add-btn');
    
    form?.remove();
    if (addBtn) addBtn.style.display = '';
}

async function handleAddCaseSave() {
    const titleInput = document.getElementById('case-input-title');
    const title = titleInput?.value?.trim();
    
    if (!title) {
        titleInput?.classList.add('case-input-error');
        titleInput?.focus();
        return;
    }
    
    const casesData = await getCasesData();
    const priority = document.getElementById('case-input-priority')?.value || 'side';
    const isTimed = document.getElementById('case-input-timed')?.checked || false;
    
    const newCase = casesData.createCase({
        title,
        description: document.getElementById('case-input-description')?.value?.trim() || '',
        priority: priority,
        deadline: isTimed ? Date.now() + (24 * 60 * 60 * 1000) : null, // Default 24h deadline if timed
        manuallyAdded: true
    });
    
    await saveCase(newCase);
    hideAddCaseForm();
    await renderCasesList();
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize cases handlers
 */
export async function initCasesHandlers() {
    console.log('[Cases] Initializing handlers...');
    
    // Add Case button
    const addBtn = document.getElementById('cases-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddCaseForm);
    }
    
    // Initial render
    await renderCasesList();
    
    console.log('[Cases] Handlers initialized');
}

/**
 * Refresh cases display
 */
export async function refreshCases() {
    hideAddCaseForm();
    selectedCaseId = null;
    await renderCasesList();
    await renderSelectedCaseDetail();
}
