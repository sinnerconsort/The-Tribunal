/**
 * The Tribunal - Wallet Profiles Template
 * @version 1.1.0 - Genre-adapted labels + genre selector
 */

// Named exports (confirmed working)
import { getActiveProfile, getCategoryName } from '../data/setting-profiles.js';
// Default export (for getAvailableProfiles, getActiveProfileId)
import settingProfilesAPI from '../data/setting-profiles.js';
import { getSettings } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// COPOTYPE DISPLAY NAMES (Profile-Aware)
// ═══════════════════════════════════════════════════════════════

const COPOTYPE_SIMPLE_NAMES = {
    'apocalypse_cop': 'Nihilist',
    'sorry_cop': 'Apologetic',
    'boring_cop': 'Professional',
    'honour_cop': 'Honourable',
    'art_cop': 'Artistic',
    'hobocop': 'Vagrant',
    'superstar_cop': 'Showoff',
    'dick_mullen': 'Detective',
    'human_can_opener': 'Charming',
    'innocence': 'Innocent'
};

const COPOTYPE_DE_NAMES = {
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
// ABBREVIATION HELPERS
// ═══════════════════════════════════════════════════════════════

function getCategoryAbbrev(categoryId) {
    const name = getCategoryName(categoryId, null);
    if (!name) {
        const defaults = { intellect: 'INT', psyche: 'PSY', physique: 'PHY', motorics: 'MOT' };
        return defaults[categoryId] || categoryId.slice(0, 3).toUpperCase();
    }
    if (name.length <= 4) return name.toUpperCase();
    return name.slice(0, 3).toUpperCase();
}

function getCategoryFullName(categoryId) {
    const defaults = { intellect: 'Intellect', psyche: 'Psyche', physique: 'Physique', motorics: 'Motorics' };
    return getCategoryName(categoryId, defaults[categoryId] || categoryId);
}

function getCardOrgLine() {
    const profile = getActiveProfile();
    if (profile?.id === 'disco_elysium') return 'RCM • Revachol Citizens Militia';
    return profile?.name || 'The Tribunal';
}

function getArchetypeLabel() {
    const profile = getActiveProfile();
    return profile?.archetypeLabel || 'Archetype';
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILES TAB HTML
// ═══════════════════════════════════════════════════════════════

export const PROFILES_TAB_HTML = `
<div class="ie-tab-content profiles-page" data-tab-content="profiles">
    <div class="tribunal-wallet">
        <div class="wallet-coffee-stain"></div>
        
        <div class="wallet-id-window">
            <div class="card-flip" id="tribunal-active-card">
                <div class="card-inner">
                    
                    <!-- CARD FRONT -->
                    <div class="card-front">
                        <div class="id-card">
                            <div class="hologram-shield">
                                <div class="hologram-shield-inner">
                                    <span class="hologram-text">RCM</span>
                                    <span class="hologram-year">'51</span>
                                </div>
                            </div>
                            
                            <div class="card-org" id="tribunal-card-org">RCM • Revachol Citizens Militia</div>
                            
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
                                    <div class="card-stat-label" id="tribunal-stat-label-int">INT</div>
                                    <div class="card-stat-value" id="tribunal-stat-int">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label" id="tribunal-stat-label-psy">PSY</div>
                                    <div class="card-stat-value" id="tribunal-stat-psy">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label" id="tribunal-stat-label-fys">PHY</div>
                                    <div class="card-stat-value" id="tribunal-stat-fys">3</div>
                                </div>
                                <div class="card-stat">
                                    <div class="card-stat-label" id="tribunal-stat-label-mot">MOT</div>
                                    <div class="card-stat-value" id="tribunal-stat-mot">3</div>
                                </div>
                            </div>
                            
                            <div class="card-copotype">
                                <div class="copotype-label" id="tribunal-archetype-label">Copotype</div>
                                <div class="copotype-value" id="tribunal-copotype">Unknown</div>
                            </div>
                            
                            <div class="tap-hint">tap card to edit ↻</div>
                        </div>
                    </div>
                    
                    <!-- CARD BACK -->
                    <div class="card-back">
                        <div class="id-card-back">
                            <div class="form-header">
                                <span>// Personnel File</span>
                                <button class="btn btn-flip" id="tribunal-flip-back">↻ Flip</button>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Genre Profile</label>
                                <select class="form-select" id="tribunal-genre-selector"></select>
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
                            
                            <div class="build-editor">
                                <div class="build-title">// Build Editor</div>
                                <div class="build-points">Points: <span id="tribunal-build-points">12</span> / 12</div>
                                
                                <div class="stat-row">
                                    <span class="stat-name" id="tribunal-build-label-int">Intellect</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="int">−</button>
                                        <span class="stat-val" id="tribunal-edit-int">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="int">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name" id="tribunal-build-label-psy">Psyche</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="psy">−</button>
                                        <span class="stat-val" id="tribunal-edit-psy">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="psy">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name" id="tribunal-build-label-fys">Physique</span>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="dec" data-attr="fys">−</button>
                                        <span class="stat-val" id="tribunal-edit-fys">3</span>
                                        <button class="stat-btn" data-action="inc" data-attr="fys">+</button>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-name" id="tribunal-build-label-mot">Motorics</span>
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
        
        <div class="card-slots" id="tribunal-card-slots">
            <div class="card-slot">
                <div class="slot-empty" data-action="create-persona">+ New Identity</div>
            </div>
            <div class="card-slot"><div class="slot-decorative"></div></div>
            <div class="card-slot"><div class="slot-decorative"></div></div>
        </div>
        
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
// SLOT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const SLOT_CARD_TEMPLATE = (persona) => `
<div class="card-slot">
    <div class="slot-card${persona.active ? ' active' : ''}" data-persona-id="${escapeHtml(persona.id)}">
        <div class="hologram-star"></div>
        <div class="slot-card-name">${escapeHtml(persona.name) || 'UNNAMED'}</div>
        <div class="slot-card-meta">${getBuildType(persona.stats)} • ${formatPronouns(persona.pronouns)}</div>
    </div>
</div>`;

export const EMPTY_SLOT_TEMPLATE = `
<div class="card-slot">
    <div class="slot-empty" data-action="create-persona">+ New Identity</div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getBuildType(stats) {
    if (!stats) return 'Balanced Build';
    const { int = 3, psy = 3, fys = 3, mot = 3 } = stats;
    const max = Math.max(int, psy, fys, mot);
    const atMax = [
        int === max ? 'int' : null, psy === max ? 'psy' : null,
        fys === max ? 'fys' : null, mot === max ? 'mot' : null
    ].filter(Boolean);
    if (atMax.length > 1) return 'Balanced Build';
    const catName = getCategoryFullName(
        atMax[0] === 'int' ? 'intellect' : atMax[0] === 'psy' ? 'psyche' :
        atMax[0] === 'fys' ? 'physique' : 'motorics'
    );
    return `${catName} Build`;
}

function formatPronouns(pronouns) {
    const map = { 'they': 'They/Them', 'he': 'He/Him', 'she': 'She/Her', 'it': 'It/Its' };
    return map[pronouns] || pronouns || 'They/Them';
}

export function generateBadgeNumber(personaId) {
    if (!personaId) return 'LTN-????';
    const hash = personaId.slice(-4).toUpperCase();
    return `LTN-${hash.replace(/[^A-Z0-9]/g, '0').padEnd(4, '0').slice(0, 4)}`;
}

// ═══════════════════════════════════════════════════════════════
// COPOTYPE DISPLAY
// ═══════════════════════════════════════════════════════════════

export function getCopotypeDisplayName(copotype, useDE = false) {
    if (!copotype) return 'Unknown';
    const nameMap = useDE ? COPOTYPE_DE_NAMES : COPOTYPE_SIMPLE_NAMES;
    if (typeof copotype === 'string') return nameMap[copotype] || COPOTYPE_SIMPLE_NAMES[copotype] || formatCopotypeId(copotype);
    if (typeof copotype === 'object') return determineCopotypeFromScores(copotype, useDE);
    return 'Unknown';
}

function formatCopotypeId(id) {
    if (!id) return 'Unknown';
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('Can Opener', 'Can-Opener');
}

function determineCopotypeFromScores(scores, useDE = false) {
    if (!scores) return 'Unknown';
    const { superstar = 0, sorry = 0, hobo = 0, apocalypse = 0 } = scores;
    const max = Math.max(superstar, sorry, hobo, apocalypse);
    if (max === 0) return 'Unknown';
    const nameMap = useDE ? COPOTYPE_DE_NAMES : COPOTYPE_SIMPLE_NAMES;
    if (superstar === max) return nameMap['superstar_cop'];
    if (sorry === max) return nameMap['sorry_cop'];
    if (hobo === max) return nameMap['hobocop'];
    if (apocalypse === max) return nameMap['apocalypse_cop'];
    return 'Unknown';
}

export function renderPersonaSlots(personas = [], activeId = null) {
    const slots = personas.map(p => SLOT_CARD_TEMPLATE({ ...p, active: p.id === activeId }));
    slots.push(EMPTY_SLOT_TEMPLATE);
    return slots.join('');
}

// ═══════════════════════════════════════════════════════════════
// CARD FLIP
// ═══════════════════════════════════════════════════════════════

export function initCardFlip() {
    const cardFlip = document.getElementById('tribunal-active-card');
    const idCard = cardFlip?.querySelector('.id-card');
    const flipBackBtn = document.getElementById('tribunal-flip-back');
    if (!cardFlip) return;
    idCard?.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        cardFlip.classList.add('flipped');
    });
    flipBackBtn?.addEventListener('click', () => { cardFlip.classList.remove('flipped'); });
}

export function flipCard(toBack = true) {
    const cardFlip = document.getElementById('tribunal-active-card');
    if (!cardFlip) return;
    if (toBack) cardFlip.classList.add('flipped');
    else cardFlip.classList.remove('flipped');
}

// ═══════════════════════════════════════════════════════════════
// CARD DISPLAY UPDATE
// ═══════════════════════════════════════════════════════════════

export function updateCardDisplay(persona) {
    if (!persona) return;
    const nameInput = document.getElementById('tribunal-card-name');
    if (nameInput) nameInput.value = persona.name || '';
    const pronounsSelect = document.getElementById('tribunal-card-pronouns');
    if (pronounsSelect) pronounsSelect.value = persona.pronouns || 'they';
    const badge = document.getElementById('tribunal-badge-num');
    if (badge) badge.textContent = generateBadgeNumber(persona.id);

    const stats = persona.stats || { int: 3, psy: 3, fys: 3, mot: 3 };
    ['int', 'psy', 'fys', 'mot'].forEach(attr => {
        const el = document.getElementById(`tribunal-stat-${attr}`);
        if (el) el.textContent = stats[attr] || 3;
        const editEl = document.getElementById(`tribunal-edit-${attr}`);
        if (editEl) editEl.textContent = stats[attr] || 3;
    });

    const total = (stats.int || 3) + (stats.psy || 3) + (stats.fys || 3) + (stats.mot || 3);
    const pointsEl = document.getElementById('tribunal-build-points');
    if (pointsEl) pointsEl.textContent = total;

    const copotypeEl = document.getElementById('tribunal-copotype');
    if (copotypeEl) copotypeEl.textContent = getCopotypeDisplayName(persona.copotype || persona.copotypes);

    const povSelect = document.getElementById('tribunal-pov-style');
    if (povSelect) povSelect.value = persona.povStyle || 'second';
    const contextArea = document.getElementById('tribunal-char-context');
    if (contextArea) contextArea.value = persona.context || '';
    const notesArea = document.getElementById('tribunal-scene-notes');
    if (notesArea) notesArea.value = persona.sceneNotes || '';

    updateCardLabelsForGenre();
}

export function updateMoneyDisplay(amount = 0) {
    const total = document.getElementById('tribunal-money-total');
    if (total) total.textContent = amount;
    const bill1 = document.getElementById('tribunal-bill-1');
    const bill2 = document.getElementById('tribunal-bill-2');
    if (amount >= 50 && bill1) bill1.textContent = '50';
    else if (bill1) bill1.textContent = Math.min(amount, 20);
    if (amount >= 70 && bill2) bill2.textContent = '20';
    else if (amount >= 50 && bill2) bill2.textContent = amount - 50;
    else if (bill2) bill2.textContent = Math.max(0, amount - 20);
}

// ═══════════════════════════════════════════════════════════════
// GENRE-ADAPTED LABEL UPDATES
// ═══════════════════════════════════════════════════════════════

export function updateCardLabelsForGenre() {
    // Card front stat abbreviations
    const labelMap = {
        'tribunal-stat-label-int': 'intellect',
        'tribunal-stat-label-psy': 'psyche',
        'tribunal-stat-label-fys': 'physique',
        'tribunal-stat-label-mot': 'motorics'
    };
    for (const [elId, catId] of Object.entries(labelMap)) {
        const el = document.getElementById(elId);
        if (el) el.textContent = getCategoryAbbrev(catId);
    }

    // Build editor full names
    const buildMap = {
        'tribunal-build-label-int': 'intellect',
        'tribunal-build-label-psy': 'psyche',
        'tribunal-build-label-fys': 'physique',
        'tribunal-build-label-mot': 'motorics'
    };
    for (const [elId, catId] of Object.entries(buildMap)) {
        const el = document.getElementById(elId);
        if (el) el.textContent = getCategoryFullName(catId);
    }

    // Org line and archetype
    const orgEl = document.getElementById('tribunal-card-org');
    if (orgEl) orgEl.textContent = getCardOrgLine();
    const archEl = document.getElementById('tribunal-archetype-label');
    if (archEl) archEl.textContent = getArchetypeLabel();

    updateGenreSelector();
}

export function updateGenreSelector() {
    const selector = document.getElementById('tribunal-genre-selector');
    if (!selector) return;

    // Use default import to access getAvailableProfiles + getActiveProfileId
    const profiles = settingProfilesAPI?.getAvailableProfiles?.() || [];
    const currentId = getActiveProfile()?.id || 'disco_elysium';

    selector.innerHTML = profiles.map(p =>
        `<option value="${escapeHtml(p.id)}"${p.id === currentId ? ' selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
}

export function updateMEFLabelsForProfile(useDE = false) {
    const copotypes = document.querySelectorAll('.rcm-copotype-item[data-label-off][data-label-on]');
    copotypes.forEach(item => {
        const label = item.querySelector('.rcm-copotype-label');
        if (label) label.textContent = useDE ? item.dataset.labelOn : item.dataset.labelOff;
    });
    const statuses = document.querySelectorAll('.rcm-checkbox[data-label-off][data-label-on]');
    statuses.forEach(item => {
        const label = item.querySelector('.rcm-checkbox-label');
        if (!label) return;
        const isActive = item.classList.contains('rcm-checkbox-checked');
        label.textContent = (useDE && isActive) ? item.dataset.labelOn : item.dataset.labelOff;
    });
}
