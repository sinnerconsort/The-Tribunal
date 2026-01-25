/**
 * The Tribunal - Wallet Profiles Template
 * Leather wallet with flipping RCM ID card, persona slots, and money pocket
 */

// ═══════════════════════════════════════════════════════════════
// COPOTYPE ID TO DISPLAY NAME MAP
// ═══════════════════════════════════════════════════════════════

const COPOTYPE_DISPLAY_NAMES = {
    'apocalypse_cop': 'Apocalypse Cop',
    'sorry_cop': 'Sorry Cop',
    'boring_cop': 'Boring Cop',
    'honour_cop': 'Honour Cop',
    'art_cop': 'Art Cop',
    'hobocop': 'Hobocop',
    'superstar_cop': 'Superstar Cop',
    'dick_mullen': 'Dick Mullen',
    'human_can_opener': 'Human Can-Opener',
    'innocence': 'Innocence'
};

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILES TAB HTML
// ═══════════════════════════════════════════════════════════════

export const PROFILES_TAB_HTML = `
<div class="ie-tab-content profiles-page" data-tab-content="profiles">
    
    <!-- THE WALLET -->
    <div class="tribunal-wallet">
        <div class="wallet-coffee-stain"></div>
        
        <!-- ═══════════════════════════════════════════════════════════════
             ACTIVE IDENTITY WINDOW
             ═══════════════════════════════════════════════════════════════ -->
        <div class="wallet-id-window">
            <div class="card-flip" id="tribunal-active-card">
                <div class="card-inner">
                    
                    <!-- ═══════════════════════════════════════════════════
                         CARD FRONT - Display View
                         ═══════════════════════════════════════════════════ -->
                    <div class="card-front">
                        <div class="id-card">
                            <!-- Holographic Shield -->
                            <div class="hologram-shield">
                                <div class="hologram-shield-inner">
                                    <span class="hologram-text">RCM</span>
                                    <span class="hologram-year">'51</span>
                                </div>
                            </div>
                            
                            <div class="card-org">RCM • Revachol Citizens Militia</div>
                            
                            <div class="card-header">
                                <div class="card-photo">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div class="card-info">
                                    <div class="card-name-wrapper">
                                        <input type="text" class="card-name" id="tribunal-card-name" value="" placeholder="NAME">
                                    </div>
                                    <div class="card-pronouns-wrapper">
                                        <span class="pronouns-label">Pronouns:</span>
                                        <select class="card-pronouns-select" id="tribunal-card-pronouns">
                                            <option value="they">They/Them</option>
                                            <option value="he">He/Him</option>
                                            <option value="she">She/Her</option>
                                            <option value="it">It/Its</option>
                                        </select>
                                    </div>
                                    <div class="card-details">
                                        <div class="card-detail">
                                            <div class="card-detail-label">Badge</div>
                                            <div class="card-detail-value" id="tribunal-badge-num">LTN-????</div>
                                        </div>
                                        <div class="card-detail">
                                            <div class="card-detail-label">Precinct</div>
                                            <div class="card-detail-value" id="tribunal-precinct">41st</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-stats">
                                <div class="card-stat">
                                    <div class="card-stat-label">INT</div>
                                    <div class="card-stat-value" id="tribunal-stat-int">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label">PSY</div>
                                    <div class="card-stat-value" id="tribunal-stat-psy">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label">PHY</div>
                                    <div class="card-stat-value" id="tribunal-stat-fys">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label">MOT</div>
                                    <div class="card-stat-value" id="tribunal-stat-mot">3</div>
                                </div>
                            </div>
                            
                            <div class="card-copotype">
                                <div class="copotype-label">Copotype</div>
                                <div class="copotype-value" id="tribunal-copotype">Unknown</div>
                            </div>
                            
                            <div class="tap-hint">tap card to edit ↻</div>
                        </div>
                    </div>
                    
                    <!-- ═══════════════════════════════════════════════════
                         CARD BACK - Edit Form
                         ═══════════════════════════════════════════════════ -->
                    <div class="card-back">
                        <div class="id-card-back">
                            <div class="form-header">
                                <span>// Personnel File</span>
                                <button class="btn btn-flip" id="tribunal-flip-back">↻ Flip</button>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">POV Style</label>
                                <select class="form-select" id="tribunal-pov-style">
                                    <option value="second">Second Person (you/your)</option>
                                    <option value="first">First Person (I/my)</option>
                                    <option value="third">Third Person (they/their)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Character Context</label>
                                <textarea class="form-textarea" id="tribunal-char-context" placeholder="Describe who YOU are - the character whose head these voices are in."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Scene Perspective Notes</label>
                                <textarea class="form-textarea" id="tribunal-scene-notes" placeholder="Help voices convert POV correctly."></textarea>
                            </div>
                            
                            <!-- Build Editor -->
                            <div class="build-editor">
                                <div class="build-title">// Build Editor</div>
                                <div class="build-points">Points: <span id="tribunal-build-points">12</span> / 12</div>
                                
                                <div class="stat-row">
                                    <span class="stat-name">Intellect</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="int">−</button>
                                        <span class="stat-val" id="tribunal-edit-int">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="int">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name">Psyche</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="psy">−</button>
                                        <span class="stat-val" id="tribunal-edit-psy">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="psy">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name">Physique</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="fys">−</button>
                                        <span class="stat-val" id="tribunal-edit-fys">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="fys">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name">Motorics</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="mot">−</button>
                                        <span class="stat-val" id="tribunal-edit-mot">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="mot">+</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button class="btn btn-save" id="tribunal-save-persona">💾 Save</button>
                                <button class="btn btn-delete" id="tribunal-delete-persona">🗑 Delete</button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
        
        <!-- ═══════════════════════════════════════════════════════════════
             CARD SLOTS (Saved Personas)
             ═══════════════════════════════════════════════════════════════ -->
        
        <!-- ═══════════════════════════════════════════════════════════════
             CARD SLOTS (Saved Personas)
             ═══════════════════════════════════════════════════════════════ -->
        <div class="card-slots" id="tribunal-card-slots">
            <!-- New Identity button -->
            <div class="card-slot">
                <div class="slot-empty" data-action="create-persona">+ New Identity</div>
            </div>
            <!-- Decorative empty slots for wallet look -->
            <div class="card-slot">
                <div class="slot-decorative"></div>
            </div>
            <div class="card-slot">
                <div class="slot-decorative"></div>
            </div>
        </div>
        
        <!-- ═══════════════════════════════════════════════════════════════
             MONEY POCKET
             ═══════════════════════════════════════════════════════════════ -->
        <div class="money-pocket">
            <div class="money-bills">
                <div class="bill"><span id="tribunal-bill-1">50</span> ʁ</div>
                <div class="bill"><span id="tribunal-bill-2">20</span> ʁ</div>
            </div>
            <div class="money-label"><span class="money-amount" id="tribunal-money-total">0</span> ʁ on hand</div>
        </div>
        
        <div class="wallet-brand">Frittte™</div>
    </div>
    
</div>`;

// ═══════════════════════════════════════════════════════════════
// SLOT CARD TEMPLATE (For saved personas)
// ═══════════════════════════════════════════════════════════════

export const SLOT_CARD_TEMPLATE = (persona) => `
<div class="card-slot">
    <div class="slot-card${persona.active ? ' active' : ''}" data-persona-id="${escapeHtml(persona.id)}">
        <div class="hologram-star"></div>
        <div class="slot-card-name">${escapeHtml(persona.name) || 'UNNAMED'}</div>
        <div class="slot-card-meta">${getBuildType(persona.stats)} • ${formatPronouns(persona.pronouns)}</div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// EMPTY SLOT TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const EMPTY_SLOT_TEMPLATE = `
<div class="card-slot">
    <div class="slot-empty" data-action="create-persona">+ New Identity</div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Get build type from stats
 */
function getBuildType(stats) {
    if (!stats) return 'Balanced Build';
    
    const { int = 3, psy = 3, fys = 3, mot = 3 } = stats;
    const max = Math.max(int, psy, fys, mot);
    
    // Check for ties at max
    const atMax = [
        int === max ? 'int' : null,
        psy === max ? 'psy' : null,
        fys === max ? 'fys' : null,
        mot === max ? 'mot' : null
    ].filter(Boolean);
    
    if (atMax.length > 1) return 'Balanced Build';
    
    switch (atMax[0]) {
        case 'int': return 'Thinker Build';
        case 'psy': return 'Sensitive Build';
        case 'fys': return 'Physical Build';
        case 'mot': return 'Motorik Build';
        default: return 'Balanced Build';
    }
}

/**
 * Format pronouns for display
 */
function formatPronouns(pronouns) {
    if (!pronouns) return 'They/Them';
    
    const map = {
        'they': 'They/Them',
        'he': 'He/Him',
        'she': 'She/Her',
        'it': 'It/Its'
    };
    
    return map[pronouns] || pronouns;
}

/**
 * Generate badge number from persona ID
 */
export function generateBadgeNumber(personaId) {
    if (!personaId) return 'LTN-????';
    const hash = personaId.slice(-4).toUpperCase();
    return `LTN-${hash.replace(/[^A-Z0-9]/g, '0').padEnd(4, '0').slice(0, 4)}`;
}

/**
 * Get copotype display name from ID or scores
 * @param {string|object|null} copotype - Either a copotype ID string or score object
 * @returns {string} Display name
 */
export function getCopotypeDisplayName(copotype) {
    // If null/undefined
    if (!copotype) return 'Unknown';
    
    // If it's a direct ID string (from vitals.copotype)
    if (typeof copotype === 'string') {
        return COPOTYPE_DISPLAY_NAMES[copotype] || formatCopotypeId(copotype);
    }
    
    // If it's a scores object (legacy/fallback)
    if (typeof copotype === 'object') {
        return determineCopotypeFromScores(copotype);
    }
    
    return 'Unknown';
}

/**
 * Format a copotype ID as display name (fallback)
 * e.g., 'human_can_opener' -> 'Human Can-Opener'
 */
function formatCopotypeId(id) {
    if (!id) return 'Unknown';
    return id
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('Can Opener', 'Can-Opener');
}

/**
 * Determine copotype from scores (legacy)
 * @deprecated Use direct copotype ID instead
 */
function determineCopotypeFromScores(scores) {
    if (!scores) return 'Unknown';
    
    const { superstar = 0, sorry = 0, hobo = 0, apocalypse = 0 } = scores;
    const max = Math.max(superstar, sorry, hobo, apocalypse);
    
    if (max === 0) return 'Unknown';
    
    if (superstar === max) return 'Superstar Cop';
    if (sorry === max) return 'Sorry Cop';
    if (hobo === max) return 'Hobocop';
    if (apocalypse === max) return 'Apocalypse Cop';
    
    return 'Unknown';
}

/**
 * Render all persona slots
 */
export function renderPersonaSlots(personas = [], activeId = null) {
    const slots = personas.map(persona => 
        SLOT_CARD_TEMPLATE({ ...persona, active: persona.id === activeId })
    );
    
    // Always add empty slot at end
    slots.push(EMPTY_SLOT_TEMPLATE);
    
    return slots.join('');
}

// ═══════════════════════════════════════════════════════════════
// CARD FLIP INTERACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize card flip behavior
 * Call this after the template is added to DOM
 */
export function initCardFlip() {
    const cardFlip = document.getElementById('tribunal-active-card');
    const idCard = cardFlip?.querySelector('.id-card');
    const flipBackBtn = document.getElementById('tribunal-flip-back');
    
    if (!cardFlip) return;
    
    // Click card front to flip to back (edit mode)
    idCard?.addEventListener('click', (e) => {
        // Don't flip if clicking inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            return;
        }
        cardFlip.classList.add('flipped');
    });
    
    // Flip back button
    flipBackBtn?.addEventListener('click', () => {
        cardFlip.classList.remove('flipped');
    });
}

/**
 * Flip card programmatically
 */
export function flipCard(toBack = true) {
    const cardFlip = document.getElementById('tribunal-active-card');
    if (!cardFlip) return;
    
    if (toBack) {
        cardFlip.classList.add('flipped');
    } else {
        cardFlip.classList.remove('flipped');
    }
}

// ═══════════════════════════════════════════════════════════════
// DATA BINDING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Update card front display from persona data
 */
export function updateCardDisplay(persona) {
    if (!persona) return;
    
    // Name
    const nameInput = document.getElementById('tribunal-card-name');
    if (nameInput) nameInput.value = persona.name || '';
    
    // Pronouns
    const pronounsSelect = document.getElementById('tribunal-card-pronouns');
    if (pronounsSelect) pronounsSelect.value = persona.pronouns || 'they';
    
    // Badge
    const badge = document.getElementById('tribunal-badge-num');
    if (badge) badge.textContent = generateBadgeNumber(persona.id);
    
    // Stats
    const stats = persona.stats || { int: 3, psy: 3, fys: 3, mot: 3 };
    ['int', 'psy', 'fys', 'mot'].forEach(attr => {
        const el = document.getElementById(`tribunal-stat-${attr}`);
        if (el) el.textContent = stats[attr] || 3;
        
        // Also update edit fields
        const editEl = document.getElementById(`tribunal-edit-${attr}`);
        if (editEl) editEl.textContent = stats[attr] || 3;
    });
    
    // Build points
    const total = (stats.int || 3) + (stats.psy || 3) + (stats.fys || 3) + (stats.mot || 3);
    const pointsEl = document.getElementById('tribunal-build-points');
    if (pointsEl) pointsEl.textContent = total;
    
    // Copotype - now handles both ID string (from vitals) and score object (legacy)
    const copotypeEl = document.getElementById('tribunal-copotype');
    if (copotypeEl) {
        // Prefer direct copotype ID, fall back to scores-based
        const displayName = getCopotypeDisplayName(persona.copotype || persona.copotypes);
        copotypeEl.textContent = displayName;
    }
    
    // POV and context (back of card)
    const povSelect = document.getElementById('tribunal-pov-style');
    if (povSelect) povSelect.value = persona.povStyle || 'second';
    
    const contextArea = document.getElementById('tribunal-char-context');
    if (contextArea) contextArea.value = persona.context || '';
    
    const notesArea = document.getElementById('tribunal-scene-notes');
    if (notesArea) notesArea.value = persona.sceneNotes || '';
}

/**
 * Update money display
 */
export function updateMoneyDisplay(amount = 0) {
    const total = document.getElementById('tribunal-money-total');
    if (total) total.textContent = amount;
    
    // Update bill denominations (visual flair)
    const bill1 = document.getElementById('tribunal-bill-1');
    const bill2 = document.getElementById('tribunal-bill-2');
    
    if (amount >= 50 && bill1) bill1.textContent = '50';
    else if (bill1) bill1.textContent = Math.min(amount, 20);
    
    if (amount >= 70 && bill2) bill2.textContent = '20';
    else if (amount >= 50 && bill2) bill2.textContent = amount - 50;
    else if (bill2) bill2.textContent = Math.max(0, amount - 20);
}
