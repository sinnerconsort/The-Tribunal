/**
 * The Tribunal - Investigation Module v7.0
 * "La Revacholière" - Perception-First Environmental Scanner
 * 
 * REDESIGN v7.0:
 * - NEW: Perception-first scan replaces generateEnvironmentScan
 * - NEW: Shivers investigation seed integration (from newspaper-strip.js)
 * - NEW: Discovery card UI with EXAMINE and COLLECT actions
 * - NEW: Weather effects modify discovery types and skill difficulties
 * - Skill reactions now triggered on-demand via EXAMINE button
 * 
 * The flow is now:
 * 1. Shivers generates atmospheric quip + hidden seed
 * 2. User presses INVESTIGATE → Perception scans (with optional seed hint)
 * 3. Discoveries appear as tappable cards
 * 4. User taps EXAMINE → Relevant skills react to that specific discovery
 * 
 * @version 7.1.0 - Integrated newspaper atmosphere into investigation panel
 */

import { SKILLS } from '../data/skills.js';
import { getSettings, getSkillLevel } from '../core/state.js';
import { getChatState, saveChatState } from '../core/persistence.js';
import { callAPI } from '../voice/api-helpers.js';
import { rollSkillCheck } from './dice.js';
import { getResearchPenalties } from './cabinet.js';
import { 
    NARRATOR_CONTEXTS, 
    DEFAULT_NARRATOR_SKILLS,
    getObjectIcon,
    getNarratorDifficulty
} from '../data/discovery-contexts.js';
import { 
    renderCaseLinkButton, 
    initCaseLinkHandlers, 
    processDiscoveriesForAutoLink 
} from './investigation-case-link.js';

// ═══════════════════════════════════════════════════════════════
// SHIVERS SEED INTEGRATION
// ═══════════════════════════════════════════════════════════════

let getInvestigationSeed = () => null;
let clearInvestigationSeed = () => {};
let getNewspaperState = () => ({ weather: 'overcast', period: 'afternoon', lastQuip: null });
let regenerateShiversQuip = () => {};

// Dynamic import to avoid circular dependency
import('../ui/newspaper-strip.js')
    .then(m => {
        if (m.getInvestigationSeed) getInvestigationSeed = m.getInvestigationSeed;
        if (m.clearInvestigationSeed) clearInvestigationSeed = m.clearInvestigationSeed;
        if (m.getNewspaperState) getNewspaperState = m.getNewspaperState;
        if (m.regenerateShiversQuip) regenerateShiversQuip = m.regenerateShiversQuip;
        console.log('[Investigation] ✓ Shivers seed + atmosphere integration loaded');
    })
    .catch(() => {
        console.log('[Investigation] Newspaper module not available (seeds disabled)');
    });

// ═══════════════════════════════════════════════════════════════
// WEATHER EFFECTS ON INVESTIGATION
// ═══════════════════════════════════════════════════════════════

const WEATHER_EFFECTS = {
    rain: {
        revealTypes: ['tracks', 'evidence', 'reflections'],
        hideTypes: ['documents', 'fragile'],
        boostSkills: ['shivers', 'perception'],
        hinderSkills: ['hand_eye_coordination'],
        promptModifier: "Rain washes away concealment — tracks are visible in mud, reflections reveal hidden details. Paper items may be damaged or illegible."
    },
    snow: {
        revealTypes: ['footprints', 'blood', 'warm_objects'],
        hideTypes: ['small_items', 'ground_level'],
        boostSkills: ['shivers', 'visual_calculus'],
        hinderSkills: ['interfacing'],
        promptModifier: "Snow preserves footprints and blood perfectly but buries small ground-level items. Cold preserves evidence. Anything warm stands out."
    },
    fog: {
        revealTypes: ['sounds', 'emotions', 'psychic'],
        hideTypes: ['distant_objects', 'visual_details'],
        boostSkills: ['inland_empire', 'empathy', 'half_light'],
        hinderSkills: ['perception', 'visual_calculus'],
        promptModifier: "Fog limits visual discovery but heightens psychic and emotional sensitivity. Close details vivid, distant things invisible."
    },
    storm: {
        revealTypes: ['hidden_by_lightning', 'displaced_objects'],
        hideTypes: ['sounds', 'subtle_details'],
        boostSkills: ['half_light', 'shivers'],
        hinderSkills: ['composure', 'empathy'],
        promptModifier: "Lightning briefly reveals everything. Thunder drowns subtle sounds. Wind displaces lightweight evidence."
    },
    wind: {
        revealTypes: ['displaced_items', 'scent_trails'],
        hideTypes: ['lightweight_evidence', 'ash'],
        boostSkills: ['perception'],
        hinderSkills: ['composure'],
        promptModifier: "Wind scatters lightweight evidence from original positions. Follow the wind's trail."
    },
    clear: {
        revealTypes: [],
        hideTypes: [],
        boostSkills: [],
        hinderSkills: [],
        promptModifier: "Clear conditions — standard visibility, nothing weather-assisted."
    },
    overcast: {
        revealTypes: [],
        hideTypes: [],
        boostSkills: [],
        hinderSkills: [],
        promptModifier: "Overcast conditions — flat light, no shadows to hide in, no sun to reveal."
    }
};

function getCurrentWeather() {
    try {
        // Try to get weather from newspaper state
        const newspaperModule = window.TribunalNewspaper || {};
        if (newspaperModule.getNewspaperState) {
            return newspaperModule.getNewspaperState().weather || 'overcast';
        }
        // Fallback
        return 'overcast';
    } catch (e) {
        return 'overcast';
    }
}

function getWeatherEffects(weather) {
    const key = (weather || 'overcast').toLowerCase()
        .replace('-day', '').replace('-night', '')
        .replace('rainy', 'rain').replace('stormy', 'storm')
        .replace('snowy', 'snow').replace('foggy', 'fog')
        .replace('windy', 'wind').replace('cloudy', 'overcast');
    
    return WEATHER_EFFECTS[key] || WEATHER_EFFECTS.overcast;
}

// ═══════════════════════════════════════════════════════════════
// DRAWER DICE LUCK (Optional integration with ledger-voices.js)
// ═══════════════════════════════════════════════════════════════

let luckModule = null;

function getInvestigationLuck(consume = true) {
    if (luckModule) {
        return luckModule.getInvestigationLuck(consume);
    }
    return { hasLuck: false, promptInjection: '', difficultyModifier: 0 };
}

function applyLuckToDifficulty(difficulty, luck) {
    if (luckModule) {
        return luckModule.applyLuckToDifficulty(difficulty, luck);
    }
    return difficulty;
}

// Try to load luck module (non-blocking)
import('./dice-ledger-integration.js')
    .then(m => {
        luckModule = m;
        console.log('[Investigation] Drawer dice luck integration loaded');
    })
    .catch(() => {
        console.log('[Investigation] Luck integration not available (optional)');
    });

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isOpen = false;
let sceneContext = '';
let lastResults = null;
let isInvestigating = false;
let currentDiscoveries = [];  // NEW: Stores current scan's discoveries

// ═══════════════════════════════════════════════════════════════
// STYLES
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
    seedHint: `
        padding: 8px 18px;
        background: rgba(88, 130, 140, 0.08);
        border-bottom: 1px solid #b8a88a;
        font-size: 11px;
        font-style: italic;
        color: #4a6670;
        line-height: 1.4;
        display: flex;
        align-items: center;
        gap: 8px;
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
        max-height: 350px;
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
    // NEW: Discovery Card styles
    discoveryCard: `
        margin: 10px 12px;
        padding: 12px 14px;
        background: #f8f4e8;
        border: 1px solid #c8b8a0;
        border-left: 4px solid #a08060;
        box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
    `,
    discoveryHeader: `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    `,
    discoveryIcon: `
        font-size: 16px;
    `,
    discoveryName: `
        font-size: 12px;
        font-weight: bold;
        color: #705030;
        letter-spacing: 1px;
        text-transform: uppercase;
    `,
    discoveryType: `
        font-size: 9px;
        color: #8a7a60;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-left: auto;
        padding: 2px 6px;
        background: rgba(0,0,0,0.05);
        border-radius: 2px;
    `,
    discoveryPeek: `
        font-size: 12px;
        font-style: italic;
        color: #3d3225;
        line-height: 1.5;
        margin-bottom: 10px;
    `,
    discoveryActions: `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    `,
    discoveryBtn: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #5c4d3d;
        background: #2a2318;
        color: #f4ead5;
    `,
    discoveryBtnSecondary: `
        padding: 5px 10px;
        font-size: 10px;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #b8a88a;
        background: #f4ead5;
        color: #3d3225;
    `,
    // Skill reaction (shown after EXAMINE)
    skillReaction: `
        margin: 4px 12px 4px 24px;
        padding: 8px 12px;
        border-left: 3px solid #2a2318;
        background: rgba(0,0,0,0.02);
        font-size: 12px;
        line-height: 1.5;
    `,
    skillName: `
        font-weight: bold;
        font-size: 11px;
        letter-spacing: 1px;
        margin-right: 4px;
    `,
    ticker: `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 18px;
        background: #2a2318;
        font-size: 10px;
        color: #c8b8a0;
        border-top: 2px solid #1a1612;
    `,
    tickerItem: `
        display: inline-flex;
        gap: 4px;
    `,
    tickerLabel: `
        color: #8a7a60;
        text-transform: uppercase;
        letter-spacing: 1px;
    `,
    tickerValue: `
        color: #e8dcc8;
    `,
    tickerSeparator: `
        color: #5c4d3d;
        margin: 0 4px;
    `
};

// ═══════════════════════════════════════════════════════════════
// SETTING DETECTION
// ═══════════════════════════════════════════════════════════════

function detectSetting(sceneText) {
    const lowerScene = sceneText.toLowerCase();
    
    const settingKeywords = {
        fantasy: ['magic', 'spell', 'wizard', 'dragon', 'elf', 'dwarf', 'sword', 'castle', 'kingdom', 'enchanted', 'potion', 'mage', 'sorcerer', 'quest'],
        scifi: ['spaceship', 'android', 'robot', 'laser', 'cybernetic', 'neural', 'hologram', 'starship', 'alien', 'colony', 'cyberpunk', 'neon', 'augmented'],
        horror: ['blood', 'scream', 'terror', 'monster', 'darkness', 'corpse', 'ghost', 'haunted', 'nightmare', 'dread', 'flesh', 'bone', 'rot'],
        noir: ['detective', 'cigarette', 'rain', 'shadows', 'murder', 'case', 'investigation', 'alley', 'dame', 'fedora', 'whiskey', 'neon sign'],
        modern: ['phone', 'computer', 'car', 'office', 'apartment', 'city', 'street', 'building', 'internet', 'social media']
    };
    
    let bestSetting = 'modern';
    let bestScore = 0;
    
    for (const [setting, keywords] of Object.entries(settingKeywords)) {
        const score = keywords.filter(kw => lowerScene.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestSetting = setting;
        }
    }
    
    return bestSetting;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT BUILDING
// ═══════════════════════════════════════════════════════════════

function buildInvestigationContext(sceneText) {
    const ctx = window.SillyTavern?.getContext?.() ||
                 (typeof getContext === 'function' ? getContext() : null);
    
    const charName = ctx?.name2 || 'The Detective';
    const charDescription = ctx?.characters?.[ctx?.characterId]?.description || '';
    const detectedSetting = detectSetting(sceneText + ' ' + charDescription);
    
    const state = getChatState();
    const inventory = state?.inventory?.items || [];
    const inventoryNames = inventory.map(i => i.name).join(', ') || 'empty';
    
    const discovered = state?.investigation?.discoveredObjects || [];
    const discoveredNames = discovered.map(d => d.name).join(', ') || 'none yet';
    
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

function extractCharacterTraits(description) {
    const traits = [];
    const lowerDesc = description.toLowerCase();
    
    const creatureTypes = [
        'bat', 'cat', 'wolf', 'fox', 'dragon', 'demon', 'angel', 'vampire',
        'elf', 'dwarf', 'orc', 'human', 'android', 'robot', 'alien',
        'monster', 'creature', 'beast', 'spirit', 'ghost', 'skeleton',
        'fae', 'fairy', 'mermaid', 'werewolf', 'shapeshifter', 'elemental'
    ];
    
    for (const type of creatureTypes) {
        if (lowerDesc.includes(type)) {
            traits.push(type + ' creature');
            break;
        }
    }
    
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
// JSON EXTRACTION
// ═══════════════════════════════════════════════════════════════

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

function repairJSON(jsonStr) {
    let repaired = jsonStr;
    repaired = repaired.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
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
    
    fab.style.display = 'flex';
    fab.style.top = '155px';
    fab.style.left = '10px';
    fab.style.zIndex = '9998';  // Below main FAB (9999)
    
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
        if (fab.dataset.positionLocked === 'true') return;
        
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
            <div style="${STYLES.mastheadSub}">❦ PERCEPTION SCAN ❦</div>
        </div>
        
        <div id="tribunal-inv-dateline" style="${STYLES.dateline}">
            <span id="tribunal-inv-date">MARTINAISE, '51</span>
            <span id="tribunal-inv-weather-label">OVERCAST</span>
            <span id="tribunal-inv-period">AFTERNOON</span>
        </div>
        
        <div style="${STYLES.headline}">
            <div style="${STYLES.headlineText}">— ENVIRONMENTAL REPORT —</div>
        </div>
        
        <div id="tribunal-inv-context" style="${STYLES.context}">
            The scene awaits your investigation...
        </div>
        
        <div id="tribunal-inv-seed" style="${STYLES.seedHint}; display: none;">
            <span style="color: #5a8a8a;">◈</span>
            <span id="tribunal-inv-seed-text">Shivers noticed something...</span>
        </div>
        
        <div style="${STYLES.actions}">
            <button id="tribunal-inv-scan" style="${STYLES.btnPrimary}">⬤ INVESTIGATE</button>
            <button id="tribunal-inv-shivers-refresh" style="${STYLES.btnSecondary}" title="Shivers speaks again...">↻</button>
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
    panel.querySelector('#tribunal-inv-shivers-refresh').addEventListener('click', handleShiversRefresh);
    
    return panel;
}

// ═══════════════════════════════════════════════════════════════
// FAB VISIBILITY
// ═══════════════════════════════════════════════════════════════

function updateInvestigationFABVisibility() {
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!fab) return;
    
    if (fab.dataset.settingsHidden === 'true') {
        fab.style.display = 'none';
        return;
    }
    
    const settings = getSettings();
    const showFab = settings?.investigation?.showFab ?? true;
    
    if (!showFab) {
        fab.dataset.settingsHidden = 'true';
        fab.style.display = 'none';
        return;
    }
    
    fab.style.display = 'flex';
}

function setupFABVisibilityWatcher() {
    const observer = new MutationObserver(() => {
        setTimeout(updateInvestigationFABVisibility, 100);
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
    
    updateAtmosphereDisplay();
    updateContextDisplay();
    updateSeedDisplay();
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
        // No scene context — show Shivers atmospheric quip if available
        const state = getNewspaperState();
        if (state.lastQuip) {
            el.textContent = state.lastQuip;
        } else {
            el.textContent = 'The scene awaits your investigation...';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERE DISPLAY (weather/date/period for investigation panel)
// ═══════════════════════════════════════════════════════════════

function updateAtmosphereDisplay() {
    const state = getNewspaperState();
    
    // Update date
    const dateEl = document.getElementById('tribunal-inv-date');
    if (dateEl) {
        const now = new Date();
        const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = now.getDate();
        dateEl.textContent = `${month} ${day}, '51`;
    }
    
    // Update weather — use getCurrentWeather() which already has fallback logic
    const weatherEl = document.getElementById('tribunal-inv-weather-label');
    if (weatherEl) {
        const weather = getCurrentWeather()
            .replace('-day', '').replace('-night', '')
            .replace('clear', 'clear').replace('overcast', 'overcast')
            .toUpperCase();
        weatherEl.textContent = weather;
    }
    
    // Update period — compute from actual clock, don't rely on newspaper state
    const periodEl = document.getElementById('tribunal-inv-period');
    if (periodEl) {
        const hour = new Date().getHours();
        let period = 'AFTERNOON';
        if (hour >= 5 && hour < 7) period = 'DAWN';
        else if (hour >= 7 && hour < 12) period = 'MORNING';
        else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
        else if (hour >= 17 && hour < 20) period = 'EVENING';
        else if (hour >= 20 && hour < 23) period = 'NIGHT';
        else period = 'LATE NIGHT';
        periodEl.textContent = period;
    }
}

/**
 * Handle Shivers refresh button — regenerate atmospheric quip
 * Then update the context area with the new quip after a delay
 */
async function handleShiversRefresh() {
    const btn = document.getElementById('tribunal-inv-shivers-refresh');
    const contextEl = document.getElementById('tribunal-inv-context');
    
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.textContent = '◌';
    }
    
    // Show loading state in context if we're currently showing a quip (no scene context)
    if (contextEl && !sceneContext) {
        contextEl.style.opacity = '0.5';
        contextEl.textContent = 'Shivers reaching out...';
    }
    
    // Trigger regeneration in newspaper module
    regenerateShiversQuip();
    
    // Wait for generation to settle (debounce 500ms + API time)
    setTimeout(() => {
        // Update context display with new quip
        if (!sceneContext) {
            const state = getNewspaperState();
            if (contextEl && state.lastQuip) {
                contextEl.textContent = state.lastQuip;
            }
            if (contextEl) contextEl.style.opacity = '1';
        }
        
        // Update seed display too
        updateSeedDisplay();
        updateAtmosphereDisplay();
        
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = '↻';
        }
    }, 3000);
}

function updateSeedDisplay() {
    const seedEl = document.getElementById('tribunal-inv-seed');
    const seedTextEl = document.getElementById('tribunal-inv-seed-text');
    if (!seedEl || !seedTextEl) return;
    
    const seed = getInvestigationSeed();
    if (seed) {
        seedTextEl.textContent = `Shivers noticed: "${seed}"`;
        seedEl.style.display = 'flex';
    } else {
        seedEl.style.display = 'none';
    }
}

export function getSceneContext() {
    return sceneContext;
}

// ═══════════════════════════════════════════════════════════════
// PERCEPTION-FIRST SCAN (NEW v7.0)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Perception scan - the new primary investigation method
 * Replaces generateEnvironmentScan with a focused Perception-only scan
 * that returns discoverable objects as interactive cards.
 * 
 * @param {string} sceneText - Scene to investigate
 * @returns {Object} Investigation results with discoveries array
 */
async function generatePerceptionScan(sceneText) {
    const context = buildInvestigationContext(sceneText);
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    // Get Shivers investigation seed (if available) and consume it
    const shiversSeed = getInvestigationSeed();
    clearInvestigationSeed();  // Consumed!
    
    // Check for drawer dice luck
    const luck = getInvestigationLuck(true);
    const luckPrompt = luck.hasLuck ? luck.promptInjection : '';
    
    // Roll Perception check
    let perceptionDifficulty = 10;  // Medium baseline
    if (weatherEffects.boostSkills.includes('perception')) {
        perceptionDifficulty -= 2;
    } else if (weatherEffects.hinderSkills.includes('perception')) {
        perceptionDifficulty += 2;
    }
    if (luck.hasLuck) {
        perceptionDifficulty = applyLuckToDifficulty(perceptionDifficulty, luck);
    }
    
    const perceptionLevel = getSkillLevel('perception');
    const perceptionCheck = rollSkillCheck(perceptionLevel, perceptionDifficulty);
    
    console.log('[Investigation] Perception check:', {
        level: perceptionLevel,
        difficulty: perceptionDifficulty,
        success: perceptionCheck.success,
        roll: perceptionCheck.roll,
        total: perceptionCheck.total,
        seed: shiversSeed || 'none',
        weather
    });
    
    // Build the seed injection for prompt
    let seedInjection = '';
    if (shiversSeed) {
        seedInjection = `\nSHIVERS NOTICED: The environment recently drew attention to: "${shiversSeed}". Perception may follow up on this detail, investigate it further, or discover something else entirely. This is a hint, not a requirement.`;
    }

    const systemPrompt = `You are PERCEPTION — the skill of noticing, observing, and finding. You scan environments for concrete, discoverable OBJECTS and DETAILS.
${luckPrompt}
WEATHER CONDITIONS: ${weather}
${weatherEffects.promptModifier}

CRITICAL CHARACTER INFO:
- Player Character: ${context.characterContext}
- DO NOT confuse the character's body parts/features with environmental objects!
- If the character IS a bat creature, "bat" references are about THEM, not a weapon
- If the character has wings, those are THEIR wings, not something to discover

SETTING: ${context.setting}
CURRENT INVENTORY: ${context.inventory}
PREVIOUSLY DISCOVERED: ${context.discovered}
${seedInjection}

PERCEPTION CHECK: ${perceptionCheck.success ? 'SUCCESS' : 'FAILED'} (rolled ${perceptionCheck.total} vs ${perceptionDifficulty})
${perceptionCheck.isBoxcars ? '⚡ CRITICAL SUCCESS — Find something exceptional!' : ''}
${perceptionCheck.isSnakeEyes ? '💀 CRITICAL FAILURE — Miss obvious things, find something misleading.' : ''}

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "environment": "1-2 sentence atmospheric description of what Perception notices about the PLACE",
  "discoveries": [
    {
      "name": "THE DRAMATIC NAME",
      "type": "evidence|weapon|consumable|container|document|clothing|key_item|misc",
      "peek": "A brief, intriguing teaser of what this object is. 10-20 words. Make it want to be examined.",
      "location": "where in the scene",
      "canCollect": true
    }
  ],
  "ticker": [
    { "type": "AVAILABLE|LOST|WANTED|DANGER", "value": "brief status note" }
  ]
}

RULES:
- ${perceptionCheck.success ? '2-4 discoveries' : '1-2 discoveries (failed check = fewer finds)'}
- Give objects dramatic names: THE + DESCRIPTOR + NOUN
- "peek" should intrigue without revealing everything — save details for EXAMINE
- Match the ${context.setting} setting
- canCollect: false for furniture/large items, true for portable items
- NEVER include the player character's body as a discoverable object
- Weather affects what you find: ${weatherEffects.revealTypes.length > 0 ? 'easier to find: ' + weatherEffects.revealTypes.join(', ') : 'no weather bonus'}`;

    const userPrompt = `Scene to scan:
"${sceneText.substring(0, 1200)}"

Generate the Perception scan as JSON. ${context.charName} ${context.characterContext ? 'is a ' + context.characterContext : ''} - don't confuse their features with objects!`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parsePerceptionResponse(response, perceptionCheck, context, weather);
    } catch (error) {
        console.error('[Investigation] Perception scan failed:', error);
        throw error;
    }
}

/**
 * Parse Perception scan response into display format
 */
function parsePerceptionResponse(response, perceptionCheck, context, weather) {
    console.log('[Investigation] Parsing Perception response...');
    
    const jsonObjects = extractJSONObjects(response);
    
    if (jsonObjects.length > 0) {
        const data = jsonObjects[0];
        console.log('[Investigation] Successfully parsed JSON');
        
        const result = {
            environment: data.environment || '',
            discoveries: [],
            ticker: [],
            perceptionCheck,
            weather
        };
        
        // Process discoveries
        if (data.discoveries && Array.isArray(data.discoveries)) {
            for (const disc of data.discoveries) {
                const discovery = {
                    id: 'disc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    name: disc.name || 'THE UNKNOWN OBJECT',
                    type: disc.type || 'misc',
                    peek: disc.peek || 'Something worth examining...',
                    location: disc.location || 'somewhere in the scene',
                    canCollect: disc.canCollect ?? true,
                    examined: false,
                    collected: false,
                    skillReactions: [],
                    weather,
                    timestamp: Date.now()
                };
                result.discoveries.push(discovery);
            }
        }
        
        // Store discoveries for state
        currentDiscoveries = result.discoveries;
        storeDiscoveredObjects(result.discoveries, context);
        
        // Process ticker
        if (data.ticker && Array.isArray(data.ticker)) {
            for (const item of data.ticker) {
                result.ticker.push({
                    type: (item.type || 'available').toUpperCase(),
                    value: item.value || ''
                });
            }
        }
        
        if (result.ticker.length === 0) {
            result.ticker.push({ 
                type: 'SCAN', 
                value: perceptionCheck.success ? 'COMPLETE' : 'PARTIAL' 
            });
        }
        
        return result;
    }
    
    // Fallback
    console.log('[Investigation] JSON parse failed, returning minimal result');
    return {
        environment: 'The scene reveals little to your searching eyes.',
        discoveries: [],
        ticker: [{ type: 'SCAN', value: 'INCOMPLETE' }],
        perceptionCheck,
        weather
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN INVESTIGATION FUNCTION
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
        <div style="font-size: 11px; letter-spacing: 2px;">PERCEPTION EXTENDING...</div>
    </div>`;
    
    // Hide seed hint while scanning
    const seedEl = document.getElementById('tribunal-inv-seed');
    if (seedEl) seedEl.style.display = 'none';
    
    try {
        const investigation = await generatePerceptionScan(sceneContext);
        showDiscoveryResults(investigation);
        
        console.log('[Investigation] Perception scan complete:', {
            discoveries: investigation.discoveries.length,
            success: investigation.perceptionCheck.success
        });
        
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

// ═══════════════════════════════════════════════════════════════
// DISCOVERY CARD DISPLAY
// ═══════════════════════════════════════════════════════════════

function showDiscoveryResults(investigation) {
    const resultsEl = document.getElementById('tribunal-inv-results');
    const tickerEl = document.getElementById('tribunal-inv-ticker');
    
    if (!resultsEl) return;
    
    lastResults = investigation;
    let html = '';
    
    // Perception check indicator
    const checkIcon = investigation.perceptionCheck.isBoxcars ? '⚡' : 
                      investigation.perceptionCheck.isSnakeEyes ? '💀' :
                      investigation.perceptionCheck.success ? '◆' : '◇';
    const checkText = investigation.perceptionCheck.success ? 'SUCCESS' : 'FAILED';
    
    html += `<div style="padding: 8px 18px; background: rgba(0,0,0,0.03); border-bottom: 1px solid #c8b8a0; font-size: 10px; color: #5c4d3d; letter-spacing: 1px;">
        PERCEPTION ${checkIcon} ${checkText} • ${investigation.weather.toUpperCase()}
    </div>`;
    
    // Environment description
    if (investigation.environment) {
        html += `<div style="padding: 12px 18px; font-size: 13px; line-height: 1.55; font-style: italic; color: #2a2318; border-bottom: 1px solid #c8b8a0;">
            ${investigation.environment}
        </div>`;
    }
    
    // Discovery cards
    if (investigation.discoveries.length === 0) {
        html += `<div style="${STYLES.empty}">
            Perception finds nothing of note. Perhaps look again later.
        </div>`;
    } else {
        for (const disc of investigation.discoveries) {
            const icon = getObjectIcon(disc.name);
            const typeColor = disc.type === 'evidence' ? '#8b4513' : 
                              disc.type === 'weapon' ? '#a03030' : 
                              disc.type === 'key_item' ? '#806000' : '#705030';
            
            html += `
                <div class="discovery-card" data-discovery-id="${disc.id}" style="${STYLES.discoveryCard}">
                    <div style="${STYLES.discoveryHeader}">
                        <span style="${STYLES.discoveryIcon}">${icon}</span>
                        <span style="${STYLES.discoveryName}">${disc.name}</span>
                        <span style="${STYLES.discoveryType}; color: ${typeColor};">${disc.type}</span>
                    </div>
                    <div style="${STYLES.discoveryPeek}">${disc.peek}</div>
                    <div style="${STYLES.discoveryActions}">
                    <button class="discovery-examine-btn" data-id="${disc.id}" style="${STYLES.discoveryBtn}">EXAMINE</button>
        ${disc.canCollect ? `<button class="discovery-collect-btn" data-id="${disc.id}" style="${STYLES.discoveryBtnSecondary}">COLLECT</button>` : ''}
        ${renderCaseLinkButton(disc)}
    </div>
                    <div class="discovery-reactions" data-id="${disc.id}"></div>
                </div>
            `;
        }
    }
    
    resultsEl.innerHTML = html;
    
    // Wire up button handlers
    resultsEl.querySelectorAll('.discovery-examine-btn').forEach(btn => {
        btn.addEventListener('click', () => handleExamine(btn.dataset.id));
    });
    
    resultsEl.querySelectorAll('.discovery-collect-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCollect(btn.dataset.id));
    });

    // Wire up case linking handlers
    initCaseLinkHandlers(resultsEl, investigation.discoveries);

    // Process discoveries for auto-linking to cases
    const autoLinkResults = processDiscoveriesForAutoLink(investigation.discoveries, {
        autoLink: true
    });
    console.log('[Investigation] Case linking results:', autoLinkResults);
    
    // Ticker
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
    }
}

// ═══════════════════════════════════════════════════════════════
// EXAMINE HANDLER (Skill Drill-Down)
// ═══════════════════════════════════════════════════════════════

async function handleExamine(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery) return;
    
    const reactionsEl = document.querySelector(`.discovery-reactions[data-id="${discoveryId}"]`);
    const examineBtn = document.querySelector(`.discovery-examine-btn[data-id="${discoveryId}"]`);
    if (!reactionsEl || !examineBtn) return;
    
    // Disable button while loading
    examineBtn.disabled = true;
    examineBtn.textContent = '...';
    
    // Show loading
    reactionsEl.innerHTML = `<div style="padding: 8px 12px; font-size: 11px; color: #5c4d3d; font-style: italic;">Skills examining...</div>`;
    
    try {
        const reactions = await generateSkillReactions(discovery, sceneContext);
        discovery.examined = true;
        discovery.skillReactions = reactions;
        
        let reactionHtml = '';
        for (const reaction of reactions) {
            const skill = SKILLS[reaction.skillId];
            const borderColor = skill?.color || '#2a2318';
            const checkIcon = reaction.checkResult?.isBoxcars ? ' ⚡' : 
                              reaction.checkResult?.isSnakeEyes ? ' 💀' :
                              reaction.checkResult?.success ? ' ◆' : ' ◇';
            
            reactionHtml += `
                <div style="${STYLES.skillReaction} border-left-color: ${borderColor};">
                    <span style="${STYLES.skillName} color: ${borderColor};">${reaction.signature}${checkIcon} —</span>
                    ${reaction.content}
                </div>
            `;
        }
        
        // Add "DIG DEEPER" button if more skills available
        reactionHtml += `
            <button class="dig-deeper-btn" data-id="${discoveryId}" style="${STYLES.discoveryBtnSecondary}; margin: 8px 12px 4px 24px; font-size: 9px;">
                DIG DEEPER (more voices)
            </button>
        `;
        
        reactionsEl.innerHTML = reactionHtml;
        
        // Wire dig deeper
        reactionsEl.querySelector('.dig-deeper-btn')?.addEventListener('click', () => handleDigDeeper(discoveryId));
        
        // Change examine button
        examineBtn.textContent = 'EXAMINED';
        examineBtn.disabled = true;
        examineBtn.style.opacity = '0.6';
        
    } catch (error) {
        console.error('[Investigation] Examine failed:', error);
        reactionsEl.innerHTML = `<div style="padding: 8px 12px; font-size: 11px; color: #8b4513;">Skills failed to react.</div>`;
        examineBtn.textContent = 'EXAMINE';
        examineBtn.disabled = false;
    }
}

/**
 * Generate skill reactions for a specific discovery
 */
async function generateSkillReactions(discovery, sceneText) {
    // Select 2 relevant skills based on discovery type
    const skillMapping = {
        evidence: ['visual_calculus', 'logic', 'perception'],
        weapon: ['hand_eye_coordination', 'half_light', 'physical_instrument'],
        document: ['encyclopedia', 'rhetoric', 'logic'],
        clothing: ['drama', 'composure', 'empathy'],
        consumable: ['electrochemistry', 'endurance', 'perception'],
        container: ['perception', 'interfacing', 'half_light'],
        key_item: ['inland_empire', 'shivers', 'conceptualization'],
        misc: ['perception', 'inland_empire', 'encyclopedia']
    };
    
    const relevantSkills = skillMapping[discovery.type] || skillMapping.misc;
    const selectedSkillIds = relevantSkills.slice(0, 2);
    
    // Get weather effects for difficulty modifiers
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    const reactions = [];
    
    for (const skillId of selectedSkillIds) {
        const skill = SKILLS[skillId];
        if (!skill) continue;
        
        const level = getSkillLevel(skillId);
        
        // Base difficulty with weather adjustment
        let difficulty = getNarratorDifficulty('secondary');
        if (weatherEffects.boostSkills.includes(skillId)) {
            difficulty -= 2;  // Weather favors this skill
        } else if (weatherEffects.hinderSkills.includes(skillId)) {
            difficulty += 2;  // Weather opposes this skill
        }
        
        const checkResult = rollSkillCheck(level, difficulty);
        
        // Generate reaction via API
        const systemPrompt = `You are ${skill.signature} from Disco Elysium. React to a specific discovered object.
        
Your personality: ${skill.personality || 'A skill voice'}

Respond with ONE sentence (max 30 words). React to the object based on your perspective:
- ${checkResult.success ? 'You notice something useful or insightful.' : 'You miss something or misinterpret it.'}
- Stay in character. Be evocative but brief.
- Do NOT repeat the object name in your response.`;

        const userPrompt = `Object: ${discovery.name}
Type: ${discovery.type}
Description: ${discovery.peek}
Scene context: ${sceneText.substring(0, 300)}

React as ${skill.signature}:`;

        try {
            const response = await callAPI(systemPrompt, userPrompt);
            reactions.push({
                skillId,
                signature: skill.signature,
                content: response.trim().substring(0, 200),
                checkResult
            });
        } catch (e) {
            // Fallback reaction
            reactions.push({
                skillId,
                signature: skill.signature,
                content: checkResult.success 
                    ? 'Something about this... I should look closer.'
                    : 'I\'m not sure what to make of this.',
                checkResult
            });
        }
    }
    
    return reactions;
}

/**
 * Handle "DIG DEEPER" - get more skill reactions
 */
async function handleDigDeeper(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery) return;
    
    const reactionsEl = document.querySelector(`.discovery-reactions[data-id="${discoveryId}"]`);
    const digBtn = reactionsEl?.querySelector('.dig-deeper-btn');
    if (!digBtn) return;
    
    digBtn.disabled = true;
    digBtn.textContent = '...';
    
    // Get weather effects for difficulty modifiers
    const weather = getCurrentWeather();
    const weatherEffects = getWeatherEffects(weather);
    
    try {
        // Get 2 different skills
        const usedSkills = discovery.skillReactions.map(r => r.skillId);
        const allSkills = Object.keys(SKILLS).filter(id => !usedSkills.includes(id));
        const newSkillIds = allSkills.sort(() => Math.random() - 0.5).slice(0, 2);
        
        for (const skillId of newSkillIds) {
            const skill = SKILLS[skillId];
            if (!skill) continue;
            
            const level = getSkillLevel(skillId);
            
            // Base difficulty with weather adjustment
            let difficulty = getNarratorDifficulty('tertiary');
            if (weatherEffects.boostSkills.includes(skillId)) {
                difficulty -= 2;  // Weather favors this skill
            } else if (weatherEffects.hinderSkills.includes(skillId)) {
                difficulty += 2;  // Weather opposes this skill
            }
            
            const checkResult = rollSkillCheck(level, difficulty);
            
            const systemPrompt = `You are ${skill.signature} from Disco Elysium. React to a discovered object with fresh perspective.
            
Your personality: ${skill.personality || 'A skill voice'}

Respond with ONE sentence (max 30 words). ${checkResult.success ? 'Find something others missed.' : 'Offer a confused or wrong take.'}`;

            const userPrompt = `Object: ${discovery.name} (${discovery.type})
React as ${skill.signature}:`;

            try {
                const response = await callAPI(systemPrompt, userPrompt);
                const reaction = {
                    skillId,
                    signature: skill.signature,
                    content: response.trim().substring(0, 200),
                    checkResult
                };
                discovery.skillReactions.push(reaction);
                
                // Insert before dig deeper button
                const borderColor = skill.color || '#2a2318';
                const checkIcon = checkResult.isBoxcars ? ' ⚡' : 
                                  checkResult.isSnakeEyes ? ' 💀' :
                                  checkResult.success ? ' ◆' : ' ◇';
                
                const reactionDiv = document.createElement('div');
                reactionDiv.style.cssText = `${STYLES.skillReaction} border-left-color: ${borderColor};`;
                reactionDiv.innerHTML = `
                    <span style="${STYLES.skillName} color: ${borderColor};">${reaction.signature}${checkIcon} —</span>
                    ${reaction.content}
                `;
                
                digBtn.parentNode.insertBefore(reactionDiv, digBtn);
            } catch (e) {
                console.warn('[Investigation] Dig deeper failed for', skillId);
            }
        }
        
        digBtn.textContent = 'DIG DEEPER';
        digBtn.disabled = false;
        
        // After ~6 reactions, hide the button
        if (discovery.skillReactions.length >= 6) {
            digBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('[Investigation] Dig deeper failed:', error);
        digBtn.textContent = 'DIG DEEPER';
        digBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// COLLECT HANDLER
// ═══════════════════════════════════════════════════════════════

function handleCollect(discoveryId) {
    const discovery = currentDiscoveries.find(d => d.id === discoveryId);
    if (!discovery || !discovery.canCollect) return;
    
    const collectBtn = document.querySelector(`.discovery-collect-btn[data-id="${discoveryId}"]`);
    if (!collectBtn) return;
    
    // Mark as collected with clear visual feedback
    discovery.collected = true;
    collectBtn.textContent = '✓ COLLECTED';
    collectBtn.disabled = true;
    collectBtn.style.opacity = '0.6';
    collectBtn.style.background = '#2a3a2a';
    collectBtn.style.borderColor = '#5a7a5a';
    collectBtn.style.color = '#8ab88a';
    
    // Store in inventory
    const item = collectItem(discovery.name);
    if (item) {
        console.log('[Investigation] Collected:', discovery.name);
        // Toast so the user knows it went to inventory
        if (typeof toastr !== 'undefined') {
            toastr.success(`Added "${discovery.name}" to inventory`, 'Item Collected');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DISCOVERED OBJECTS STORAGE
// ═══════════════════════════════════════════════════════════════

function storeDiscoveredObjects(discoveries, context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.investigation) {
        state.investigation = {
            discoveredObjects: [],
            collectedItems: []
        };
    }
    
    for (const disc of discoveries) {
        if (!disc || !disc.name) continue;
        
        const existing = state.investigation.discoveredObjects.find(
            d => d.name === disc.name
        );
        
        if (!existing) {
            state.investigation.discoveredObjects.push({
                name: disc.name,
                type: disc.type,
                peek: disc.peek,
                canCollect: disc.canCollect,
                location: disc.location,
                weather: disc.weather,
                discoveredAt: disc.timestamp
            });
            
            console.log('[Investigation] Stored discovered object:', disc.name);
        }
    }
    
    saveChatState();
}

export function getDiscoveredObjects() {
    const state = getChatState();
    return state?.investigation?.discoveredObjects || [];
}

export function collectItem(objectName) {
    const state = getChatState();
    if (!state?.investigation?.discoveredObjects) return null;
    
    const index = state.investigation.discoveredObjects.findIndex(
        d => d.name === objectName && d.canCollect
    );
    
    if (index === -1) return null;
    
    const item = state.investigation.discoveredObjects[index];
    
    state.investigation.discoveredObjects.splice(index, 1);
    
    if (!state.investigation.collectedItems) {
        state.investigation.collectedItems = [];
    }
    state.investigation.collectedItems.push({
        ...item,
        collectedAt: Date.now()
    });
    
    // ── Also add to actual inventory so it shows in the INV tab ──
    if (!state.inventory) state.inventory = { carried: [], stash: {}, money: 0 };
    if (!state.inventory.carried) state.inventory.carried = [];
    
    // Map investigation types to inventory categories
    const CONSUMABLE_TYPES = ['consumable', 'food', 'medicine', 'drug', 'alcohol', 'cigarette'];
    const invType = item.type || 'misc';
    const category = CONSUMABLE_TYPES.includes(invType) ? 'consumable' : 'misc';
    
    // Don't duplicate if already in inventory
    const alreadyInInventory = state.inventory.carried.some(
        i => i.name?.toLowerCase() === objectName.toLowerCase()
    );
    
    if (!alreadyInInventory) {
        state.inventory.carried.push({
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: objectName,
            type: invType,
            category: category,
            quantity: 1,
            description: item.peek || null,
            source: 'investigation',
            context: item.peek || item.location || null,
            addedAt: Date.now()
        });
        console.log('[Investigation] Added to inventory:', objectName);
        
        // Tell inventory UI to refresh
        try {
            document.dispatchEvent(new CustomEvent('tribunal:inventoryChanged', {
                detail: { source: 'investigation', item: objectName }
            }));
        } catch (e) { /* silent */ }
    }
    
    saveChatState();
    console.log('[Investigation] Collected item:', objectName);
    
    return item;
}

export function getCollectedItems() {
    const state = getChatState();
    return state?.investigation?.collectedItems || [];
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
    
    const settings = getSettings();
    const showFab = settings?.investigation?.showFab ?? true;
    if (!showFab) {
        fab.dataset.settingsHidden = 'true';
        fab.style.display = 'none';
        console.log('[Investigation] FAB hidden per saved settings');
    }
    
    setupFABVisibilityWatcher();
    
    console.log('[Investigation] Module initialized - Perception Scanner v7.0 ready');
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

export { detectSetting, buildInvestigationContext, extractJSONObjects };
