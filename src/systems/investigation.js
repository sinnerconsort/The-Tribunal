/**
 * The Tribunal - Investigation Module v5.2
 * "La Revacholière" - Environmental Scanner & Item Discovery
 * 
 * PURPOSE: Scan environments for objects, items, and details to populate inventory
 * NOT FOR: Character analysis or dialogue reactions (that's the voice system)
 * 
 * CHANGES v5.2:
 * - NEW: Dynamic object voices - objects speak directly to the player
 * - Objects have dramatic names (THE ROUGH-HEWN DIAMOND, THE SILVER INKSTAND)
 * - Skills now REACT/COMMENT instead of "pointing at" things
 * - Setting-agnostic: fantasy objects for fantasy, modern for modern
 * - Object voices styled distinctly with double border and ✦ icon
 * 
 * CHANGES v5.1:
 * - FAB now uses correct ID (tribunal-investigation-fab) matching fab.css
 * - FAB uses .ie-fab class for shared styling
 * - FAB has proper drag logic (same as main FAB)
 * - FAB hides when main panel is open
 * - Ticker no longer scrolls - uses flex-wrap
 */

import { SKILLS } from '../data/skills.js';
import { getSettings, getSkillLevel } from '../core/state.js';
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
    // FIXED: Ticker now wraps instead of scrolling
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
// UI CREATION
// ═══════════════════════════════════════════════════════════════

function createFAB() {
    const fab = document.createElement('div');
    fab.id = 'tribunal-investigation-fab';
    fab.className = 'ie-fab';
    fab.title = 'Investigation - La Revacholière';
    fab.innerHTML = '<span class="ie-fab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>';
    
    // Set initial position (fab.css has defaults but we set explicitly)
    fab.style.display = 'flex';
    fab.style.top = '135px';
    fab.style.left = '10px';
    
    // ─────────────────────────────────────────────────────────
    // DRAG LOGIC (same as main FAB in panel.js)
    // ─────────────────────────────────────────────────────────
    let isDragging = false;
    let dragStartX, dragStartY, fabStartX, fabStartY;
    let hasMoved = false;

    function startDrag(e) {
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
        
        // Mark as just dragged to prevent click from firing
        if (hasMoved) {
            fab.dataset.justDragged = 'true';
            setTimeout(() => { fab.dataset.justDragged = ''; }, 100);
        }
    }

    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });
    
    // Click handler (only fires if not dragged)
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
// Hide investigation FAB when main Tribunal panel is open
// ═══════════════════════════════════════════════════════════════

function updateInvestigationFABVisibility() {
    const invFab = document.getElementById('tribunal-investigation-fab');
    if (!invFab) return;
    
    // Hide if main Tribunal panel is open
    const tribunalPanel = document.getElementById('inland-empire-panel');
    const mainPanelOpen = tribunalPanel?.classList.contains('ie-panel-open');
    
    // Hide if any ST drawer is open
    const anyDrawerOpen = document.querySelector('.openDrawer');
    
    if (mainPanelOpen || anyDrawerOpen) {
        invFab.style.display = 'none';
    } else {
        invFab.style.display = 'flex';
    }
}

function setupFABVisibilityWatcher() {
    // Watch for class changes (drawer open/close, panel open/close)
    const observer = new MutationObserver(() => {
        updateInvestigationFABVisibility();
    });
    
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
    });
    
    // Initial check
    setTimeout(updateInvestigationFABVisibility, 500);
    
    // Periodic fallback
    setInterval(updateInvestigationFABVisibility, 1000);
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
    
    // Add active class to FAB
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
    
    // Remove active class from FAB
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
            const penalty = researchPenalties[skillId] || 0;
            const effectiveLevel = Math.max(1, level - penalty);
            
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
// INVESTIGATION GENERATION
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

async function generateEnvironmentScan(sceneText, selectedSkills) {
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
        return `${s.skill.signature} (${checkStatus}): ${s.skill.personality?.substring(0, 150) || 'A skill voice'}`;
    }).join('\n');
    
    const settings = getSettings();
    const charName = settings?.persona?.name || 'the detective';
    
    const systemPrompt = `You are generating an ENVIRONMENTAL SCAN for a Disco Elysium-style RPG.

CRITICAL FOCUS: You are scanning the ENVIRONMENT for OBJECTS and ITEMS. Objects SPEAK DIRECTLY to the player.

PLAYER CHARACTER: ${charName}
"You" = ${charName} observing the environment

PARTICIPATING SKILLS:
${skillDescriptions}

YOUR TASK:
1. Write a brief environmental description (2-3 sentences about the PLACE)
2. Identify 1-2 NOTABLE OBJECTS in the scene and let them SPEAK DIRECTLY
3. Skills then REACT to what they sense (not "point at" things)
4. Generate a ticker of 2-4 discoverable items

THE NEW APPROACH - OBJECT VOICES:
Objects speak directly to the player in first person. Give them dramatic, setting-appropriate names in ALL CAPS:
- THE ROUGH-HEWN DIAMOND
- THE SILVER INKSTAND
- THE BLOODSTAINED PHOTOGRAPH
- THE RUSTED REVOLVER
- THE HALF-EMPTY BOTTLE

Objects remember. Objects feel. They speak of their history, their purpose, their pain.

Skills then react to what they sense - they don't "point at" things like tour guides.

EXAMPLE OUTPUT FORMAT:

[ENVIRONMENT]
The room reeks of stale cigarettes and desperation. A single lamp casts long shadows across scattered papers.

[OBJECTS]
THE CIGARETTE PACK — "I was thrown aside. My owner fled in panic. But one of us remains—crumpled, waiting. Will you take it?"

ELECTROCHEMISTRY — "It's calling to you. One smoke left. Your lungs remember the warmth."

THE DESK DRAWER — "I've been forced before. The lock remembers—it gave up years ago. I slide easy now. See what's inside."

INTERFACING — "Cheap lock, cheaper wood. Someone's been through this before you."

[TICKER]
AVAILABLE: CIGARETTE PACK (UNDER DESK)
AVAILABLE: DESK CONTENTS (DRAWER)
LOST: ONE SHOE (HALLWAY)
WANTED: INFO RE: DOOR DAMAGE

RULES:
- Objects speak FIRST PERSON, directly to the player
- Give objects dramatic, evocative names (THE + DESCRIPTOR + NOUN)
- Objects have history, memory, personality
- Skills REACT/COMMENT (1 sentence), they don't "point at"
- Match the setting - fantasy objects for fantasy, modern for modern, sci-fi for sci-fi
- If a skill FAILED their check, they might misread the object or miss it entirely
- Keep it atmospheric but brief`;

    const userPrompt = `Scene to scan:
"${sceneText.substring(0, 1200)}"

Generate the environmental scan. Let 1-2 OBJECTS speak directly to ${charName}, then have skills react.

Skills available: ${skillsWithChecks.map(s => `${s.skill.signature} (${s.checkResult.success ? 'SUCCESS' : 'FAILED'})`).join(', ')}`;

    try {
        const response = await callAPI(systemPrompt, userPrompt);
        return parseEnvironmentScan(response, skillsWithChecks);
    } catch (error) {
        console.error('[Investigation] API call failed:', error);
        throw error;
    }
}

function parseEnvironmentScan(response, skillsWithChecks) {
    const result = {
        environment: '',
        objects: [],  // Now includes both object voices AND skill reactions
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
                
                // Check if this is an OBJECT VOICE (starts with "THE ")
                if (speakerName.startsWith('THE ')) {
                    result.objects.push({
                        type: 'object',
                        signature: speakerName,
                        color: '#8b7355',  // Warm brown for objects
                        content: content,
                        checkResult: null
                    });
                } else {
                    // It's a SKILL reaction - find the skill
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
                        // Try to find skill in full SKILLS list
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
    
    // FIXED: Ticker now uses flex-wrap, items separated by diamond
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
    
    // Set up visibility watcher (hide when main panel open)
    setupFABVisibilityWatcher();
    
    console.log('[Investigation] Module initialized - Environmental Scanner ready');
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
