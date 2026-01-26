/**
 * The Tribunal - Investigation Module v6.0
 * "La Revacholière" - Environmental Scanner & Item Discovery
 * 
 * PURPOSE: Scan environments for objects, items, and details to populate inventory
 * NOT FOR: Character analysis or dialogue reactions (that's the voice system)
 * 
 * IMPROVEMENTS v6.0:
 * - JSON output format for reliable parsing (RPG Companion pattern)
 * - Context injection: character info, setting, existing inventory
 * - Character disambiguation: knows what the PC IS vs what's in the scene
 * - Discovered items stored for future inventory integration
 * - Setting detection: fantasy, modern, sci-fi, horror, noir
 * - Robust JSON extraction with fallback repair
 * - Fallback to text parsing if JSON fails
 * 
 * CHANGES v5.4:
 * - FIXED: FAB visibility now reads from getSettings() directly
 * - FIXED: Reduced interval watcher from 1s to 5s
 * 
 * CHANGES v5.3:
 * - Added position lock support
 * - FAB visibility respects settings toggle
 * 
 * CHANGES v5.2:
 * - Dynamic object voices - objects speak directly to the player
 * - Objects have dramatic names (THE ROUGH-HEWN DIAMOND, etc.)
 * - Skills REACT/COMMENT instead of "pointing at" things
 */

import { SKILLS } from '../data/skills.js';
import { getSettings, getSkillLevel } from '../core/state.js';
import { getChatState, saveChatState } from '../core/persistence.js';
import { callAPI } from '../voice/api-helpers.js';
import { rollSkillCheck, getDifficultyName } from './dice.js';
import { getResearchPenalties } from './cabinet.js';
import { 
    NARRATOR_CONTEXTS, 
    DEFAULT_NARRATOR_SKILLS,
    getObjectIcon,
    getNarratorDifficulty
} from '../data/discovery-contexts.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isOpen = false;
let sceneContext = '';
let lastResults = null;
let isInvestigating = false;

// ═══════════════════════════════════════════════════════════════
// STYLES (Panel only - FAB uses CSS classes from fab.css)
// ═══════════════════════════════════════════════════════════════

const STYLES = {
    panel: `
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        max-width: 480px;
        width: auto;
        background: 
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139,115,85,0.03) 2px,
                rgba(139,115,85,0.03) 4px
            ),
            linear-gradient(180deg, #f4ead5 0%, #e8dcc8 50%, #ddd0b8 100%);
        border: 2px solid #5c4d3d;
        border-radius: 2px;
        box-shadow: 
            3px 3px 0 #3d3225,
            0 8px 32px rgba(0,0,0,0.5);
        flex-direction: column;
        overflow: hidden;
        font-family: 'Times New Roman', Georgia, serif;
        color: #1a1612;
    `,
    panelMobile: `
        position: fixed !important;
        max-width: 94vw !important;
        width: 94vw !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        max-height: calc(100dvh - 100px) !important;
        overflow-y: auto !important;
    `,
    closeBtn: `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 0;
        background: #2a2318;
        color: #f4ead5;
        border: 1px solid #5c4d3d;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        font-family: 'Times New Roman', serif;
    `,
    masthead: `
        padding: 24px 20px 16px;
        text-align: center;
        border-bottom: 3px double #2a2318;
        background: linear-gradient(180deg, #f4ead5 0%, #ebe0cc 100%);
    `,
    mastheadTitle: `
        font-size: 24px;
        font-weight: 900;
        font-family: 'Times New Roman', Georgia, serif;
        color: #1a1612;
        letter-spacing: 3px;
        text-transform: uppercase;
        text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
        margin: 0;
        line-height: 1;
    `,
    mastheadSub: `
        font-size: 10px;
        font-style: italic;
        color: #5c4d3d;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-top: 8px;
    `,
    dateline: `
        display: flex;
        justify-content: space-between;
        padding: 8px 20px;
        font-size: 10px;
        color: #5c4d3d;
        border-bottom: 1px solid #b8a88a;
        background: #ebe0cc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `,
    headline: `
        padding: 12px 20px;
        text-align: center;
        border-bottom: 1px solid #b8a88a;
        background: #ebe0cc;
    `,
    headlineText: `
        font-size: 14px;
        font-weight: bold;
        color: #1a1612;
        text-transform: uppercase;
        letter-spacing: 2px;
        line-height: 1.3;
        margin: 0;
    `,
    context: `
        padding: 12px 18px;
        background: rgba(0,0,0,0.02);
        border-bottom: 1px solid #b8a88a;
        font-size: 12px;
        font-style: italic;
        color: #3d3225;
        line-height: 1.5;
        max-height: 80px;
        overflow-y: auto;
    `,
    actions: `
        display: flex;
        gap: 10px;
        padding: 10px 20px;
        border-bottom: 2px solid #2a2318;
        background: #ebe0cc;
    `,
    btnPrimary: `
        flex: 1;
        padding: 8px 16px;
        background: #2a2318;
        color: #f4ead5;
        border: none;
        font-size: 12px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 3px;
        text-transform: uppercase;
        cursor: pointer;
    `,
    btnSecondary: `
        padding: 8px 14px;
        background: #f4ead5;
        color: #2a2318;
        border: 1px solid #5c4d3d;
        font-size: 14px;
        font-family: 'Times New Roman', serif;
        cursor: pointer;
    `,
    results: `
        flex: 1;
        min-height: 120px;
        max-height: 280px;
        overflow-y: auto;
        padding: 0;
        background: linear-gradient(180deg, #f4ead5 0%, #ebe0cc 100%);
    `,
    empty: `
        text-align: center;
        padding: 20px 16px;
        color: #5c4d3d;
        font-style: italic;
        font-size: 13px;
    `,
    loading: `
        text-align: center;
        padding: 24px;
        color: #2a2318;
        font-style: italic;
    `,
    envBlock: `
        padding: 12px 18px;
        background: #f4ead5;
        font-size: 13px;
        line-height: 1.55;
        font-style: italic;
        color: #2a2318;
        border-bottom: 1px solid #b8a88a;
    `,
    objectCallout: `
        padding: 10px 18px;
        border-left: 3px solid #2a2318;
        background: rgba(255,255,255,0.25);
        margin: 0;
        border-bottom: 1px dotted #c8b898;
    `,
    skillName: `
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        margin-bottom: 3px;
        font-family: 'Times New Roman', serif;
    `,
    objectText: `
        font-size: 12px;
        line-height: 1.4;
        font-style: italic;
        color: #1a1612;
    `,
    ticker: `
        padding: 10px 18px;
        background: #2a2318;
        color: #c8b898;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        line-height: 1.8;
    `,
    tickerItem: `
        display: inline-flex;
        align-items: center;
        gap: 4px;
    `,
    tickerSeparator: `
        color: #5c4d3d;
    `,
    tickerLabel: `
        color: #a89070;
    `,
    tickerValue: `
        color: #e8d8b8;
    `
};

// ═══════════════════════════════════════════════════════════════
// SETTING DETECTION (NEW v6.0)
// ═══════════════════════════════════════════════════════════════

const SETTING_INDICATORS = {
    fantasy: {
        keywords: ['magic', 'spell', 'dragon', 'elf', 'dwarf', 'sword', 'castle', 'kingdom', 'wizard', 'enchanted', 'potion', 'mana', 'quest', 'tavern', 'guild', 'monster', 'demon', 'angel', 'wings', 'claws', 'fangs', 'fur', 'scales', 'enchant', 'arcane', 'sorcery'],
        weight: 0
    },
    scifi: {
        keywords: ['ship', 'space', 'planet', 'alien', 'robot', 'android', 'laser', 'computer', 'terminal', 'hologram', 'cybernetic', 'station', 'reactor', 'plasma', 'neural', 'AI', 'drone', 'starship', 'hyperspace'],
        weight: 0
    },
    modern: {
        keywords: ['phone', 'car', 'office', 'apartment', 'street', 'city', 'police', 'gun', 'money', 'computer', 'internet', 'café', 'bar', 'hospital', 'school', 'subway', 'taxi'],
        weight: 0
    },
    horror: {
        keywords: ['blood', 'dark', 'shadow', 'scream', 'death', 'corpse', 'ghost', 'haunted', 'creature', 'monster', 'nightmare', 'terror', 'fear', 'decay', 'rot', 'abandoned', 'eldritch', 'dread'],
        weight: 0
    },
    noir: {
        keywords: ['detective', 'case', 'murder', 'cigarette', 'rain', 'night', 'fedora', 'dame', 'crime', 'suspect', 'witness', 'alley', 'shadows', 'bourbon', 'revolver', 'trenchcoat'],
        weight: 0
    }
};

/**
 * Detect the likely setting/genre from scene text
 * @param {string} text - Scene text to analyze
 * @returns {string} Detected setting
 */
function detectSetting(text) {
    const lowerText = text.toLowerCase();
    
    // Reset weights
    for (const setting of Object.values(SETTING_INDICATORS)) {
        setting.weight = 0;
    }
    
    // Count keyword matches
    for (const [settingName, setting] of Object.entries(SETTING_INDICATORS)) {
        for (const keyword of setting.keywords) {
            if (lowerText.includes(keyword)) {
                setting.weight++;
            }
        }
    }
    
    // Find highest weight
    let bestSetting = 'fantasy'; // default
    let bestWeight = 0;
    
    for (const [settingName, setting] of Object.entries(SETTING_INDICATORS)) {
        if (setting.weight > bestWeight) {
            bestWeight = setting.weight;
            bestSetting = settingName;
        }
    }
    
    return bestSetting;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT BUILDING (NEW v6.0 - RPG Companion Pattern)
// ═══════════════════════════════════════════════════════════════

/**
 * Build context block for the AI prompt
 * Includes character info, setting, inventory, previously discovered items
 * @param {string} sceneText - Current scene
 * @returns {Object} Context data
 */
function buildInvestigationContext(sceneText) {
    const settings = getSettings();
    const state = getChatState();
    
    // Character info
    const charName = settings?.persona?.name || 'the detective';
    const charDescription = settings?.persona?.description || '';
    
    // Detect setting from scene + character description
    const detectedSetting = detectSetting(sceneText + ' ' + charDescription);
    
    // Get inventory (if exists)
    const inventory = state?.inventory?.items || [];
    const inventoryNames = inventory.map(i => i.name).join(', ') || 'empty';
    
    // Get previously discovered objects (from this chat)
    const discovered = state?.investigation?.discoveredObjects || [];
    const discoveredNames = discovered.map(d => d.name).join(', ') || 'none yet';
    
    // Build character context - CRITICAL for disambiguation
    let characterContext = `${charName}`;
    if (charDescription) {
        const traits = extractCharacterTraits(charDescription);
        if (traits.length > 0) {
            characterContext += ` (${traits.join(', ')})`;
        }
    }
    
    return {
        charName,
        charDescription,
        characterContext,
        setting: detectedSetting,
        inventory: inventoryNames,
        discovered: discoveredNames,
        inventoryItems: inventory,
        discoveredItems: discovered
    };
}

/**
 * Extract key physical traits from character description
 * Helps AI understand what the character IS vs what's in the environment
 * @param {string} description - Character description
 * @returns {string[]} Key traits
 */
function extractCharacterTraits(description) {
    const traits = [];
    const lowerDesc = description.toLowerCase();
    
    // Species/creature type
    const creatureTypes = [
        'bat', 'cat', 'wolf', 'fox', 'dragon', 'demon', 'angel', 'vampire',
        'elf', 'dwarf', 'orc', 'human', 'android', 'robot', 'alien',
        'monster', 'creature', 'beast', 'spirit', 'ghost', 'skeleton',
        'fae', 'fairy', 'mermaid', 'werewolf', 'shapeshifter', 'elemental'
    ];
    
    for (const type of creatureTypes) {
        if (lowerDesc.includes(type)) {
            traits.push(type + ' creature');
            break; // Only take first match
        }
    }
    
    // Physical features that might confuse the AI
    const features = [
        { keywords: ['wings', 'winged'], trait: 'has wings' },
        { keywords: ['tail'], trait: 'has a tail' },
        { keywords: ['claws'], trait: 'has claws' },
        { keywords: ['fur', 'furry'], trait: 'has fur' },
        { keywords: ['scales', 'scaled'], trait: 'has scales' },
        { keywords: ['horns'], trait: 'has horns' },
        { keywords: ['fangs', 'teeth'], trait: 'has fangs' },
        { keywords: ['antennae'], trait: 'has antennae' },
        { keywords: ['tentacles'], trait: 'has tentacles' },
        { keywords: ['feathers'], trait: 'has feathers' }
    ];
    
    for (const feature of features) {
        if (feature.keywords.some(kw => lowerDesc.includes(kw))) {
            traits.push(feature.trait);
        }
    }
    
    return traits;
}

// ═══════════════════════════════════════════════════════════════
// JSON EXTRACTION (NEW v6.0 - RPG Companion Pattern)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract JSON objects from text using brace matching
 * More robust than regex for nested structures
 * @param {string} text - Text potentially containing JSON
 * @returns {Object[]} Extracted JSON objects
 */
function extractJSONObjects(text) {
    const objects = [];
    let depth = 0;
    let start = -1;
    
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (text[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                const jsonStr = text.substring(start, i + 1);
                try {
                    const obj = JSON.parse(jsonStr);
                    objects.push(obj);
                } catch (e) {
                    // Try to repair common issues
                    const repaired = repairJSON(jsonStr);
                    if (repaired) {
                        try {
                            objects.push(JSON.parse(repaired));
                        } catch (e2) {
                            console.log('[Investigation] JSON repair failed:', e2.message);
                        }
                    }
                }
                start = -1;
            }
        }
    }
    
    return objects;
}

/**
 * Attempt to repair common JSON formatting issues from AI
 * @param {string} jsonStr - Potentially malformed JSON
 * @returns {string|null} Repaired JSON or null
 */
function repairJSON(jsonStr) {
    let repaired = jsonStr;
    
    // Remove markdown code fences
    repaired = repaired.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Fix trailing commas before closing brackets
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted keys (simple cases)
    repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix single quotes to double quotes (careful with apostrophes in text)
    // Only do this outside of string values - simplified approach
    repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Try to fix truncated JSON by closing brackets
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}';
    }
    
    return repaired;
}

// ═══════════════════════════════════════════════════════════════
// UI CREATION
// ═══════════════════════════════════════════════════════════════

function createFAB() {
    const fab = document.createElement('div');
    fab.id = 'tribunal-investigation-fab';
    fab.className = 'ie-fab';
    fab.title = 'Investigation - La Revacholière';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>';
    
    // Set initial position
    fab.style.display = 'flex';
    fab.style.top = '135px';
    fab.style.left = '10px';
    
    // ─────────────────────────────────────────────────────────
    // DRAG LOGIC
    // ─────────────────────────────────────────────────────────
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        if (fab.dataset.positionLocked === 'true') {
            return;
        }
        
        isDragging = true;
        hasMoved = false;
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        fabStartX = fab.offsetLeft;
        fabStartY = fab.offsetTop;
        fab.style.transition = 'none';
        fab.classList.add('dragging');
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;
        fab.style.left = `${Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, fabStartX + deltaX))}px`;
        fab.style.top = `${Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, fabStartY + deltaY))}px`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'all 0.3s ease';
        fab.classList.remove('dragging');
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        
        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            setTimeout(() => { fab.dataset.justDragged = ''; }, 100);
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
    
    fab.addEventListener('click', (e) => {
        if (fab.dataset.justDragged === 'true') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        toggle();
    });
    
    return fab;
}

function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'tribunal-inv-panel';
    panel.style.cssText = STYLES.panel;
    panel.style.display = 'none';
    
    panel.innerHTML = `
        <button id="tribunal-inv-close" style="${STYLES.closeBtn}">✕</button>
        
        <div style="${STYLES.masthead}">
            <div style="${STYLES.mastheadTitle}">LA REVACHOLIÈRE</div>
            <div style="${STYLES.mastheadSub}">❦ THE VOICE OF THE CITIZENS ❦</div>
        </div>
        
        <div style="${STYLES.dateline}">
            <span>MARTINAISE, '51</span>
            <span>VOL. XLII NO. 308</span>
            <span>5 RÉAL</span>
        </div>
        
        <div style="${STYLES.headline}">
            <div style="${STYLES.headlineText}">— ENVIRONMENTAL REPORT —</div>
        </div>
        
        <div id="tribunal-inv-context" style="${STYLES.context}">
            The scene awaits your investigation...
        </div>
        
        <div style="${STYLES.actions}">
            <button id="tribunal-inv-scan" style="${STYLES.btnPrimary}">⬤ INVESTIGATE</button>
            <button id="tribunal-inv-rescan" style="${STYLES.btnSecondary}">↻</button>
        </div>
        
        <div id="tribunal-inv-results" style="${STYLES.results}">
            <div style="${STYLES.empty}">Your skills await your command, detective...</div>
        </div>
        
        <div id="tribunal-inv-ticker" style="${STYLES.ticker}">
            <span style="${STYLES.tickerItem}">
                <span style="${STYLES.tickerLabel}">SCAN:</span>
                <span style="${STYLES.tickerValue}">AWAITING</span>
            </span>
        </div>
    `;
    
    panel.querySelector('#tribunal-inv-close').addEventListener('click', close);
    panel.querySelector('#tribunal-inv-scan').addEventListener('click', doInvestigate);
    panel.querySelector('#tribunal-inv-rescan').addEventListener('click', doInvestigate);
    
    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB VISIBILITY
// ═══════════════════════════════════════════════════════════════

function updateInvestigationFABVisibility() {
    const invFab = document.getElementById('tribunal-investigation-fab');
    if (!invFab) return;
    
    const settings = getSettings();
    const showFabSetting = settings?.investigation?.showFab ?? true;
    
    invFab.dataset.settingsHidden = showFabSetting ? 'false' : 'true';
    
    if (!showFabSetting) {
        invFab.style.display = 'none';
        return;
    }
    
    const tribunalPanel = document.getElementById('inland-empire-panel');
    const mainPanelOpen = tribunalPanel?.classList.contains('ie-panel-open');
    const anyDrawerOpen = document.querySelector('.openDrawer');
    
    if (mainPanelOpen || anyDrawerOpen) {
        invFab.style.display = 'none';
    } else {
        invFab.style.display = 'flex';
    }
}

function setupFABVisibilityWatcher() {
    const observer = new MutationObserver(() => {
        updateInvestigationFABVisibility();
    });
    
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
    });
    
    setTimeout(updateInvestigationFABVisibility, 500);
    setInterval(updateInvestigationFABVisibility, 5000);
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

function open() {
    const panel = document.getElementById('tribunal-inv-panel');
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!panel) return;
    
    const isMobile = window.innerWidth <= 1000;
    
    if (isMobile) {
        const topBar = document.getElementById('top-settings-holder');
        const topBarHeight = topBar ? topBar.offsetHeight : 60;
        const topPosition = topBarHeight + 10;
        
        panel.style.cssText = STYLES.panel + STYLES.panelMobile;
        panel.style.top = topPosition + 'px';
        panel.style.display = 'flex';
    } else {
        panel.style.cssText = STYLES.panel;
        panel.style.top = '100px';
        panel.style.left = '70px';
        panel.style.display = 'flex';
    }
    
    isOpen = true;
    
    if (fab) fab.classList.add('ie-fab-active');
    
    updateContextDisplay();
}

function close() {
    const panel = document.getElementById('tribunal-inv-panel');
    const fab = document.getElementById('tribunal-investigation-fab');
    
    if (panel) {
        panel.style.display = 'none';
        isOpen = false;
    }
    
    if (fab) fab.classList.remove('ie-fab-active');
}

function toggle() {
    if (isOpen) {
        close();
    } else {
        open();
    }
}

// ═══════════════════════════════════════════════════════════════
// SCENE CONTEXT
// ═══════════════════════════════════════════════════════════════

export function updateSceneContext(text) {
    if (text && typeof text === 'string') {
        sceneContext = text;
        updateContextDisplay();
    }
}

function updateContextDisplay() {
    const el = document.getElementById('tribunal-inv-context');
    if (el && sceneContext) {
        const truncated = sceneContext.length > 250 
            ? sceneContext.substring(0, 250) + '...' 
            : sceneContext;
        el.textContent = truncated;
    } else if (el) {
        el.textContent = 'The scene awaits your investigation...';
    }
}

export function getSceneContext() {
    return sceneContext;
}

// ═══════════════════════════════════════════════════════════════
// SKILL SELECTION
// ═══════════════════════════════════════════════════════════════

function analyzeEnvironment(sceneText) {
    const lowerScene = sceneText.toLowerCase();
    const contextScores = {};
    
    for (const [contextId, context] of Object.entries(NARRATOR_CONTEXTS)) {
        const matches = context.keywords.filter(kw => lowerScene.includes(kw));
        if (matches.length > 0) {
            contextScores[contextId] = {
                score: matches.length,
                matches: matches,
                primary: context.primary,
                secondary: context.secondary
            };
        }
    }
    
    return contextScores;
}

function selectEnvironmentSkills(sceneText, count = 3) {
    const researchPenalties = getResearchPenalties();
    const contextScores = analyzeEnvironment(sceneText);
    const skillPool = [];
    
    for (const [contextId, data] of Object.entries(contextScores)) {
        for (const skillId of [...data.primary, ...data.secondary]) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getSkillLevel(skillId);
            const penalty = researchPenalties[skillId]?.value || 0;
            const effectiveLevel = Math.max(1, level + penalty); // penalty is negative
            
            const existing = skillPool.find(s => s.skillId === skillId);
            
            if (existing) {
                existing.weight += data.score;
            } else {
                skillPool.push({
                    skillId,
                    skill,
                    level: effectiveLevel,
                    weight: data.score * 2 + effectiveLevel,
                    isPrimary: data.primary.includes(skillId)
                });
            }
        }
    }
    
    if (skillPool.length === 0) {
        for (const skillId of DEFAULT_NARRATOR_SKILLS.slice(0, 6)) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getSkillLevel(skillId);
            skillPool.push({
                skillId,
                skill,
                level,
                weight: level + Math.random() * 3,
                isPrimary: false
            });
        }
    }
    
    skillPool.sort((a, b) => b.weight - a.weight);
    return skillPool.slice(0, count);
}

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION GENERATION (IMPROVED v6.0)
// ═══════════════════════════════════════════════════════════════

async function doInvestigate() {
    const resultsEl = document.getElementById('tribunal-inv-results');
    const scanBtn = document.getElementById('tribunal-inv-scan');
    
    if (!resultsEl || !scanBtn) return;
    
    if (isInvestigating) {
        console.log('[Investigation] Already investigating...');
        return;
    }
    
    if (!sceneContext || sceneContext.trim().length === 0) {
        resultsEl.innerHTML = `<div style="${STYLES.empty}">
            No scene to investigate. Send a message first, detective.
        </div>`;
        return;
    }
    
    isInvestigating = true;
    scanBtn.disabled = true;
    scanBtn.textContent = '⏳ SCANNING...';
    resultsEl.innerHTML = `<div style="${STYLES.loading}">
        <div style="font-size: 16px; margin-bottom: 8px;">◉ ◉ ◉</div>
        <div style="font-size: 11px; letter-spacing: 2px;">EXTENDING SENSES...</div>
    </div>`;
    
    try {
        const selectedSkills = selectEnvironmentSkills(sceneContext, 3);
        console.log('[Investigation] Selected skills:', selectedSkills.map(s => s.skill.signature));
        
        const investigation = await generateEnvironmentScan(sceneContext, selectedSkills);
        showResults(investigation);
        
        console.log('[Investigation] Generated environmental scan');
        
    } catch (error) {
        console.error('[Investigation] Failed:', error);
        resultsEl.innerHTML = `<div style="${STYLES.empty}">
            INVESTIGATION FAILED: ${error.message || 'Unknown error'}
        </div>`;
    } finally {
        isInvestigating = false;
        scanBtn.disabled = false;
        scanBtn.textContent = '⬤ INVESTIGATE';
    }
}

/**
 * Generate environment scan with improved context and JSON output
 * @param {string} sceneText - Scene to investigate
 * @param {Array} selectedSkills - Skills to use for checks
 * @returns {Object} Investigation results
 */
async function generateEnvironmentScan(sceneText, selectedSkills) {
    const context = buildInvestigationContext(sceneText);
    
    // Roll skill checks
    const skillsWithChecks = selectedSkills.map(s => {
        const difficulty = getNarratorDifficulty(s.isPrimary ? 'primary' : 'secondary');
        const checkResult = rollSkillCheck(s.level, difficulty);
        return {
            ...s,
            checkResult,
            difficultyName: getDifficultyName(difficulty)
        };
    });
    
    const skillDescriptions = skillsWithChecks.map(s => {
        const checkStatus = s.checkResult.success ? 'SUCCESS' : 'FAILED';
        return `${s.skill.signature} [${checkStatus}]: ${s.skill.personality?.substring(0, 100) || 'A skill voice'}`;
    }).join('\n');

    const systemPrompt = `You are generating an ENVIRONMENTAL SCAN for a Disco Elysium-style RPG.
You scan the ENVIRONMENT for OBJECTS and ITEMS. Objects can SPEAK DIRECTLY to the player.

CRITICAL CHARACTER INFO:
- Player Character: ${context.characterContext}
- DO NOT confuse the character's body parts/features with environmental objects!
- If the character IS a bat creature, "bat" references are about THEM, not a weapon
- If the character has wings, those are THEIR wings, not something to discover

SETTING: ${context.setting}
CURRENT INVENTORY: ${context.inventory}
PREVIOUSLY DISCOVERED: ${context.discovered}

PARTICIPATING SKILLS:
${skillDescriptions}

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "environment": "2-3 sentence atmospheric description of the PLACE (not the character)",
  "objects": [
    {
      "name": "THE DRAMATIC NAME",
      "type": "weapon|evidence|consumable|container|furniture|document|clothing|key_item|misc",
      "voice": "First-person speech from the object to ${context.charName}. Objects remember, feel, speak of their history.",
      "canCollect": true,
      "location": "where in the scene"
    }
  ],
  "skillReactions": [
    {
      "skill": "SKILL SIGNATURE",
      "success": true,
      "reaction": "One sentence reaction/comment from the skill"
    }
  ],
  "discoverable": [
    { "item": "Item Name", "status": "available|lost|wanted|danger", "hint": "brief hint" }
  ]
}

RULES:
- Objects speak FIRST PERSON, directly to ${context.charName}
- Give objects dramatic names: THE + DESCRIPTOR + NOUN
- 1-2 objects maximum, make them meaningful
- Skills REACT/COMMENT (1 sentence), don't "point at" things
- Match the ${context.setting} setting - appropriate objects and tone
- If a skill FAILED, they might misread or miss something
- NEVER include the player character's body as a discoverable object
- canCollect: false for furniture/large items, true for portable items
- Keep it atmospheric but brief`;

    const userPrompt = `Scene to scan:
"${sceneText.substring(0, 1200)}"

Generate the environmental scan as JSON. Remember: ${context.charName} ${context.characterContext ? 'is a ' + context.characterContext : ''} - don't confuse their features with objects!`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parseInvestigationResponse(response, skillsWithChecks, context);
    } catch (error) {
        console.error('[Investigation] API call failed:', error);
        throw error;
    }
}

/**
 * Parse investigation response - tries JSON first, falls back to text
 * @param {string} response - AI response
 * @param {Array} skillsWithChecks - Skills with check results
 * @param {Object} context - Investigation context
 * @returns {Object} Parsed investigation results
 */
function parseInvestigationResponse(response, skillsWithChecks, context) {
    console.log('[Investigation] Parsing response...');
    
    // Try JSON extraction first
    const jsonObjects = extractJSONObjects(response);
    
    if (jsonObjects.length > 0) {
        const data = jsonObjects[0];
        console.log('[Investigation] Successfully parsed JSON');
        
        // Convert to display format
        const result = {
            environment: data.environment || '',
            objects: [],
            ticker: []
        };
        
        // Process object voices
        if (data.objects && Array.isArray(data.objects)) {
            for (const obj of data.objects) {
                result.objects.push({
                    type: 'object',
                    signature: obj.name || 'THE UNKNOWN OBJECT',
                    color: '#8b7355',
                    content: obj.voice || '',
                    checkResult: null,
                    objectData: obj // Store full data for inventory
                });
            }
        }
        
        // Process skill reactions
        if (data.skillReactions && Array.isArray(data.skillReactions)) {
            for (const reaction of data.skillReactions) {
                const skillData = skillsWithChecks.find(s => 
                    s.skill.signature.toUpperCase() === reaction.skill?.toUpperCase() ||
                    s.skill.name.toUpperCase() === reaction.skill?.toUpperCase()
                );
                
                if (skillData) {
                    result.objects.push({
                        type: 'skill',
                        skillId: skillData.skillId,
                        signature: skillData.skill.signature,
                        color: skillData.skill.color,
                        content: reaction.reaction || '',
                        checkResult: skillData.checkResult
                    });
                } else {
                    const anySkill = Object.values(SKILLS).find(s =>
                        s.signature.toUpperCase() === reaction.skill?.toUpperCase() ||
                        s.name.toUpperCase() === reaction.skill?.toUpperCase()
                    );
                    if (anySkill) {
                        result.objects.push({
                            type: 'skill',
                            skillId: anySkill.id,
                            signature: anySkill.signature,
                            color: anySkill.color,
                            content: reaction.reaction || '',
                            checkResult: null
                        });
                    }
                }
            }
        }
        
        // Process discoverable items for ticker
        if (data.discoverable && Array.isArray(data.discoverable)) {
            for (const item of data.discoverable) {
                result.ticker.push({
                    type: (item.status || 'available').toUpperCase(),
                    value: item.item + (item.hint ? ` (${item.hint})` : ''),
                    itemData: item
                });
            }
        }
        
        // Store discovered objects for future context
        storeDiscoveredObjects(data.objects || [], context);
        
        if (result.ticker.length === 0) {
            result.ticker.push({ type: 'SCAN', value: 'COMPLETE' });
        }
        
        return result;
    }
    
    // Fallback to text parsing (original method)
    console.log('[Investigation] JSON parse failed, falling back to text parsing');
    return parseTextResponse(response, skillsWithChecks);
}

/**
 * Fallback text-based parsing (original method)
 */
function parseTextResponse(response, skillsWithChecks) {
    const result = {
        environment: '',
        objects: [],
        ticker: []
    };
    
    const envMatch = response.match(/\[ENVIRONMENT\]\s*\n?([\s\S]*?)(?=\[OBJECTS\]|$)/i);
    if (envMatch) {
        result.environment = envMatch[1].trim();
    } else {
        const lines = response.split('\n').filter(l => l.trim() && l.trim().length > 30);
        result.environment = lines[0] || 'The scene reveals itself to your trained eye.';
    }
    
    const objectsMatch = response.match(/\[OBJECTS\]\s*\n?([\s\S]*?)(?=\[TICKER\]|$)/i);
    if (objectsMatch) {
        const objectLines = objectsMatch[1].trim().split('\n').filter(l => l.trim());
        
        for (const line of objectLines) {
            const match = line.match(/^([A-Z][A-Z\s\/'-]+)\s*[-–—:]\s*(.+)$/i);
            if (match) {
                const speakerName = match[1].trim().toUpperCase();
                const content = match[2].trim();
                
                if (speakerName.startsWith('THE ')) {
                    result.objects.push({
                        type: 'object',
                        signature: speakerName,
                        color: '#8b7355',
                        content: content,
                        checkResult: null
                    });
                } else {
                    const skillData = skillsWithChecks.find(s => 
                        s.skill.signature.toUpperCase() === speakerName ||
                        s.skill.name.toUpperCase() === speakerName
                    );
                    
                    if (skillData) {
                        result.objects.push({
                            type: 'skill',
                            skillId: skillData.skillId,
                            signature: skillData.skill.signature,
                            color: skillData.skill.color,
                            content: content,
                            checkResult: skillData.checkResult
                        });
                    } else {
                        const anySkill = Object.values(SKILLS).find(s =>
                            s.signature.toUpperCase() === speakerName ||
                            s.name.toUpperCase() === speakerName
                        );
                        if (anySkill) {
                            result.objects.push({
                                type: 'skill',
                                skillId: anySkill.id,
                                signature: anySkill.signature,
                                color: anySkill.color,
                                content: content,
                                checkResult: null
                            });
                        }
                    }
                }
            }
        }
    }
    
    const tickerMatch = response.match(/\[TICKER\]\s*\n?([\s\S]*?)$/i);
    if (tickerMatch) {
        const tickerLines = tickerMatch[1].trim().split('\n').filter(l => l.trim());
        
        for (const line of tickerLines) {
            const match = line.match(/^(AVAILABLE|LOST|WANTED|ROOMS?|DANGER|NOTE):\s*(.+)$/i);
            if (match) {
                result.ticker.push({
                    type: match[1].toUpperCase(),
                    value: match[2].trim()
                });
            }
        }
    }
    
    if (result.ticker.length === 0) {
        result.ticker.push({ type: 'SCAN', value: 'COMPLETE' });
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════
// DISCOVERED OBJECTS STORAGE (NEW v6.0 - For Future Inventory)
// ═══════════════════════════════════════════════════════════════

/**
 * Store discovered objects in chat state
 * @param {Array} objects - Objects discovered in this scan
 * @param {Object} context - Investigation context
 */
function storeDiscoveredObjects(objects, context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.investigation) {
        state.investigation = {
            discoveredObjects: [],
            collectedItems: []
        };
    }
    
    const timestamp = Date.now();
    
    for (const obj of objects) {
        if (!obj || !obj.name) continue;
        
        // Check if already discovered
        const existing = state.investigation.discoveredObjects.find(
            d => d.name === obj.name
        );
        
        if (!existing) {
            state.investigation.discoveredObjects.push({
                name: obj.name,
                type: obj.type,
                voice: obj.voice,
                canCollect: obj.canCollect,
                location: obj.location,
                discoveredAt: timestamp
            });
            
            console.log('[Investigation] Stored discovered object:', obj.name);
        }
    }
    
    saveChatState();
}

/**
 * Get all discovered objects for this chat
 * @returns {Array} Discovered objects
 */
export function getDiscoveredObjects() {
    const state = getChatState();
    return state?.investigation?.discoveredObjects || [];
}

/**
 * Collect an item (move from discovered to inventory)
 * @param {string} objectName - Name of object to collect
 * @returns {Object|null} Collected item or null if not found/can't collect
 */
export function collectItem(objectName) {
    const state = getChatState();
    if (!state?.investigation?.discoveredObjects) return null;
    
    const index = state.investigation.discoveredObjects.findIndex(
        d => d.name === objectName && d.canCollect
    );
    
    if (index === -1) return null;
    
    const item = state.investigation.discoveredObjects[index];
    
    // Remove from discovered
    state.investigation.discoveredObjects.splice(index, 1);
    
    // Add to collected (future inventory)
    if (!state.investigation.collectedItems) {
        state.investigation.collectedItems = [];
    }
    state.investigation.collectedItems.push({
        ...item,
        collectedAt: Date.now()
    });
    
    saveChatState();
    console.log('[Investigation] Collected item:', objectName);
    
    return item;
}

/**
 * Get collected items (proto-inventory)
 * @returns {Array} Collected items
 */
export function getCollectedItems() {
    const state = getChatState();
    return state?.investigation?.collectedItems || [];
}

// ═══════════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════════

function showResults(investigation) {
    const resultsEl = document.getElementById('tribunal-inv-results');
    const tickerEl = document.getElementById('tribunal-inv-ticker');
    
    if (!resultsEl) return;
    
    lastResults = investigation;
    
    let html = '';
    
    if (investigation.environment) {
        html += `<div style="${STYLES.envBlock}">${investigation.environment}</div>`;
    }
    
    for (const obj of investigation.objects) {
        if (obj.type === 'object') {
            // OBJECT VOICE - distinct styling
            html += `
                <div style="${STYLES.objectCallout} border-left: 4px double #a08060; background: rgba(160,128,96,0.08);">
                    <div style="${STYLES.skillName} color: #705030; font-style: normal;">
                        <span style="margin-right: 4px;">✦</span>${obj.signature}
                    </div>
                    <div style="${STYLES.objectText} font-style: italic;">${obj.content}</div>
                </div>
            `;
        } else {
            // SKILL REACTION - original styling with color
            const borderColor = obj.color || '#2a2318';
            
            let checkIndicator = '';
            if (obj.checkResult) {
                if (obj.checkResult.isBoxcars) {
                    checkIndicator = ' ⬥⬥';
                } else if (obj.checkResult.isSnakeEyes) {
                    checkIndicator = ' ✕✕';
                } else if (obj.checkResult.success) {
                    checkIndicator = ' ⬥';
                } else {
                    checkIndicator = ' ✕';
                }
            }
            
            html += `
                <div style="${STYLES.objectCallout} border-left-color: ${borderColor};">
                    <div style="${STYLES.skillName} color: ${borderColor};">${obj.signature}${checkIndicator} —</div>
                    <div style="${STYLES.objectText}">${obj.content}</div>
                </div>
            `;
        }
    }
    
    if (!investigation.environment && investigation.objects.length === 0) {
        html = `<div style="${STYLES.empty}">The scene reveals nothing of interest, detective.</div>`;
    }
    
    resultsEl.innerHTML = html;
    
    // Ticker display
    if (tickerEl && investigation.ticker.length > 0) {
        const tickerItems = investigation.ticker.map((item, i) => {
            const separator = i < investigation.ticker.length - 1 
                ? `<span style="${STYLES.tickerSeparator}">◆</span>` 
                : '';
            return `
                <span style="${STYLES.tickerItem}">
                    <span style="${STYLES.tickerLabel}">${item.type}:</span>
                    <span style="${STYLES.tickerValue}">${item.value}</span>
                </span>
                ${separator}
            `;
        }).join('');
        
        tickerEl.innerHTML = tickerItems;
        tickerEl.style.cssText = STYLES.ticker;
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function initInvestigation() {
    console.log('[Investigation] initInvestigation() called');
    
    if (document.getElementById('tribunal-investigation-fab')) {
        console.log('[Investigation] Already initialized, skipping');
        return;
    }
    
    const fab = createFAB();
    const panel = createPanel();
    
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    
    // Check saved settings for initial FAB visibility
    const settings = getSettings();
    const showFab = settings?.investigation?.showFab ?? true;
    if (!showFab) {
        fab.dataset.settingsHidden = 'true';
        fab.style.display = 'none';
        console.log('[Investigation] FAB hidden per saved settings');
    }
    
    // Set up visibility watcher
    setupFABVisibilityWatcher();
    
    console.log('[Investigation] Module initialized - Environmental Scanner v6.0 ready');
}

export function openInvestigation() {
    open();
}

export function closeInvestigation() {
    close();
}

export function isInvestigationOpen() {
    return isOpen;
}

export function displayResults(investigation) {
    showResults(investigation);
}

// Export helpers for external use
export { detectSetting, buildInvestigationContext, extractJSONObjects };
