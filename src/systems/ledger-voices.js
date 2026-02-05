/**
 * The Tribunal - Ledger Voices & Drawer Dice System
 * Three ledger personalities that respond to dice rolls and dispense fortunes
 * 
 * THE DAMAGED LEDGER - Self-deprecating, observational, tender about being yours
 * THE LEDGER OF OBLIVION - Prophetic, inevitable, fate-speaking  
 * THE LEDGER OF FAILURE AND HATRED - Mocking, 4th-wall, nihilistic-caring
 * 
 * v1.4.0 - FEATURE: Contextual fortune generation via fortune-generator.js
 *          Fortunes now know the character, time, themes, and emotional state
 */

// Import existing dice system for integration
// Uncomment when in actual extension:
// import { rollSkillCheck, formatCheckResult } from './dice.js';

// Import the contextual fortune generator
import { 
    drawContextualFortune, 
    drawContextualFortuneSync 
} from './fortune-generator.js';

// Debounce flag for mobile double-click prevention
let envelopeClickCooldown = false;

// ═══════════════════════════════════════════════════════════════
// LEDGER VOICE DEFINITIONS
// These are DISTINCT from skill voices - they're about the LEDGER ITSELF
// ═══════════════════════════════════════════════════════════════

export const LEDGER_VOICES = {
    damaged: {
        name: 'THE DAMAGED LEDGER',
        color: 'var(--ie-accent, #d4a574)',  // Orange-gold
        tone: 'Self-deprecating, observational, weirdly tender',
        domain: 'What IS - the present state of things',
    },
    oblivion: {
        name: 'THE LEDGER OF OBLIVION',
        color: 'var(--psyche, #9b6b9e)',  // Purple
        tone: 'Prophetic, inevitable, ominous',
        domain: 'What WILL BE - the future, fate',
    },
    failure: {
        name: 'THE LEDGER OF FAILURE AND HATRED',
        color: 'var(--physique, #b54b4b)',  // Red
        tone: 'Mocking, bitter, 4th-wall breaking',
        domain: 'Lies and cruelty (but are they lies?)',
    }
};

// ═══════════════════════════════════════════════════════════════
// DICE ROLL RESPONSES
// ═══════════════════════════════════════════════════════════════

const DICE_RESPONSES = {
    snakeEyes: {
        voice: 'failure',
        lines: [
            "Ones. The universe's way of saying 'no, and also, I don't like you.'",
            "Snake eyes. The dice remember what you did. They don't forgive.",
            "Two ones. That's not bad luck. That's a *choice* the cosmos made about you specifically.",
            "The lowest roll. The dice aren't broken. They're accurate.",
            "Ones. You could stop rolling. You won't. That's the real failure.",
            "Snake eyes again? At some point this stops being chance and starts being personality.",
            "The dice have spoken. They said 'no.' Repeatedly. With emphasis.",
            "Two ones. The probability was low. Your dignity, lower."
        ]
    },
    
    boxcars: {
        voice: 'oblivion',
        lines: [
            "Sixes. The numbers align. Something is coming.",
            "Boxcars. The future opens like a door. Step through.",
            "Twelve. The maximum. For now, you are favored.",
            "The dice show sixes. Somewhere, a thread of fate pulls taut.",
            "Perfect. Suspiciously perfect. Enjoy it while you can.",
            "Boxcars. The ledger sees what comes next. It says nothing.",
            "Sixes twice. The odds were against you. The future is not.",
            "Twelve pips stare up. They know something. They always know."
        ]
    },
    
    normal: {
        voice: 'damaged',
        lines: [
            "You rolled the dice. They landed. Nothing changed.",
            "The dice clatter in the drawer. Like everything else in here, they're just... waiting.",
            "A roll. Numbers. The ledger doesn't judge. That's a lie. It judges.",
            "You're rolling dice in a hidden drawer at {time}. The ledger has no comment. (It has many comments.)",
            "The dice settle. So does the dust. So do you, eventually.",
            "Numbers on bone. Or plastic. The ledger can't tell anymore.",
            "A roll of the dice. As meaningful as anything else you do.",
            "They rolled. You watched. The investigation hasn't moved.",
            "The dice don't care about your cases. Neither does the drawer. But you're here anyway.",
            "Click, clatter, stop. The sound of deciding nothing."
        ]
    },
    
    high: {
        voice: 'damaged',
        lines: [
            "Good numbers. The ledger is... pleased? Is that the word?",
            "A strong roll. It means nothing, but it feels like something.",
            "High marks. If only your cases resolved this easily.",
            "The dice favor you today. The ledger makes no promises about tomorrow.",
            "Good roll. Write it down. In the ledger. That's what it's for. (It's not.)"
        ]
    },
    
    low: {
        voice: 'damaged',
        lines: [
            "Low numbers. The drawer understands. It's been low for a while too.",
            "Not great. But not snake eyes. The ledger calls this 'progress.'",
            "A poor roll. The dice are water-damaged too, probably.",
            "Low. Like morale. Like standards. Like the bar you've set.",
            "The numbers aren't good. Neither is the coffee ring on page 34. We persist."
        ]
    },
    
    doubles: {
        voice: 'oblivion',
        lines: [
            "Doubles. The numbers echo. Something repeats.",
            "The same number, twice. Patterns emerge. The ledger watches.",
            "Matching dice. Coincidence is just fate being subtle.",
            "Doubles. Like seeing yourself in a mirror. Which version is real?",
            "Two of the same. The universe rhymes when it's planning something."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

export function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}

export function isLateNight() {
    const hour = new Date().getHours();
    return hour >= 21 || hour < 6;
}

// ═══════════════════════════════════════════════════════════════
// DRAWER DICE ROLLING
// ═══════════════════════════════════════════════════════════════

export function rollDrawerDice() {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDouble = die1 === die2;
    const isBoxcars = die1 === 6 && die2 === 6;
    const isSnakeEyes = die1 === 1 && die2 === 1;
    
    let type, responseBank;
    
    if (isSnakeEyes) {
        type = 'snakeEyes';
        responseBank = DICE_RESPONSES.snakeEyes;
    } else if (isBoxcars) {
        type = 'boxcars';
        responseBank = DICE_RESPONSES.boxcars;
    } else if (isDouble) {
        type = 'doubles';
        responseBank = DICE_RESPONSES.doubles;
    } else if (total >= 10) {
        type = 'high';
        responseBank = DICE_RESPONSES.high;
    } else if (total <= 4) {
        type = 'low';
        responseBank = DICE_RESPONSES.low;
    } else {
        type = 'normal';
        responseBank = DICE_RESPONSES.normal;
    }
    
    const lines = responseBank.lines;
    let response = lines[Math.floor(Math.random() * lines.length)];
    response = response.replace('{time}', getCurrentTime());
    
    const voice = LEDGER_VOICES[responseBank.voice];
    
    return {
        die1,
        die2,
        total,
        type,
        voice: responseBank.voice,
        voiceName: voice.name,
        voiceColor: voice.color,
        response,
        isDouble,
        isBoxcars,
        isSnakeEyes,
        isCrit: isBoxcars || isSnakeEyes,
        isSuccess: isBoxcars,
        isFailure: isSnakeEyes
    };
}

export function getLedgerCommentForCheck(checkResult) {
    let responseBank;
    
    if (checkResult.isSnakeEyes) {
        responseBank = DICE_RESPONSES.snakeEyes;
    } else if (checkResult.isBoxcars) {
        responseBank = DICE_RESPONSES.boxcars;
    } else if (checkResult.die1 === checkResult.die2) {
        responseBank = DICE_RESPONSES.doubles;
    } else if (checkResult.roll >= 10) {
        responseBank = DICE_RESPONSES.high;
    } else if (checkResult.roll <= 4) {
        responseBank = DICE_RESPONSES.low;
    } else {
        responseBank = DICE_RESPONSES.normal;
    }
    
    const lines = responseBank.lines;
    let response = lines[Math.floor(Math.random() * lines.length)];
    response = response.replace('{time}', getCurrentTime());
    
    const voice = LEDGER_VOICES[responseBank.voice];
    
    return {
        voice: responseBank.voice,
        voiceName: voice.name,
        voiceColor: voice.color,
        response
    };
}

export function getLuckModifier(rollType) {
    switch (rollType) {
        case 'boxcars': return 1;
        case 'high': return 0.5;
        case 'snakeEyes': return -1;
        case 'low': return -0.5;
        default: return 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// FORTUNE SYSTEM
// Now delegates to the contextual fortune generator
// ═══════════════════════════════════════════════════════════════

/**
 * Draw a fortune - delegates to the new contextual system
 * Kept for backwards compatibility with other modules
 * @param {string} forceVoice - Optional: force a specific voice
 * @returns {Object} Fortune result
 */
export function drawFortune(forceVoice = null) {
    // Delegate to the new contextual system (sync version for backwards compat)
    return drawContextualFortuneSync(forceVoice);
}

// ═══════════════════════════════════════════════════════════════
// STATE TRACKING
// ═══════════════════════════════════════════════════════════════

let diceHistory = {
    totalRolls: 0,
    snakeEyes: 0,
    boxcars: 0,
    lastRoll: null,
    luckModifier: 0,
    luckExpiry: null
};

let fortuneHistory = {
    totalDrawn: 0,
    lastFortune: null,
    fortunes: []
};

let pendingFortune = null;

export function recordDiceRoll(rollResult) {
    diceHistory.totalRolls++;
    diceHistory.lastRoll = rollResult;
    
    if (rollResult.type === 'snakeEyes') diceHistory.snakeEyes++;
    if (rollResult.type === 'boxcars') diceHistory.boxcars++;
    
    diceHistory.luckModifier = getLuckModifier(rollResult.type);
    diceHistory.luckExpiry = Date.now() + (10 * 60 * 1000);
    
    return diceHistory;
}

export function recordFortune(fortuneResult) {
    fortuneHistory.totalDrawn++;
    fortuneHistory.lastFortune = fortuneResult;
    
    if (!fortuneResult.isEmpty) {
        fortuneHistory.fortunes.push({
            fortune: fortuneResult.fortune,
            voice: fortuneResult.voice,
            timestamp: Date.now(),
            markedTrue: false,
            isGenerated: fortuneResult.isGenerated || false,
            context: fortuneResult.context || null
        });
        
        if (fortuneHistory.fortunes.length > 20) {
            fortuneHistory.fortunes = fortuneHistory.fortunes.slice(-20);
        }
    }
    
    return fortuneHistory;
}

export function getCurrentLuckModifier() {
    if (!diceHistory.luckExpiry || Date.now() > diceHistory.luckExpiry) {
        diceHistory.luckModifier = 0;
        return 0;
    }
    return diceHistory.luckModifier;
}

export function consumeLuckModifier() {
    const luck = getCurrentLuckModifier();
    diceHistory.luckModifier = 0;
    diceHistory.luckExpiry = null;
    return luck;
}

export function getDiceStats() {
    return {
        totalRolls: diceHistory.totalRolls,
        criticalFailures: diceHistory.snakeEyes,
        criticalSuccesses: diceHistory.boxcars
    };
}

export function getFortuneStats() {
    return {
        totalDrawn: fortuneHistory.totalDrawn,
        fortunes: fortuneHistory.fortunes
    };
}

// ═══════════════════════════════════════════════════════════════
// UI INTEGRATION
// ═══════════════════════════════════════════════════════════════

export function updateFABLuckIndicator() {
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!fab) return;
    
    const luck = getCurrentLuckModifier();
    
    fab.classList.remove('luck-positive', 'luck-negative');
    
    if (luck > 0) {
        fab.classList.add('luck-positive');
    } else if (luck < 0) {
        fab.classList.add('luck-negative');
    }
}

export function initDrawerDice() {
    const diceContainer = document.querySelector('.compartment-dice');
    if (!diceContainer) {
        console.warn('[Ledger Voices] Dice container not found');
        return;
    }
    
    diceContainer.style.cursor = 'pointer';
    diceContainer.addEventListener('click', handleDiceClick);
    
    setInterval(updateFABLuckIndicator, 30000);
    
    console.log('[Ledger Voices] Drawer dice initialized');
}

async function handleDiceClick(e) {
    const diceContainer = e.currentTarget;
    const dice = diceContainer.querySelectorAll('.siren-die');
    
    if (diceContainer.classList.contains('rolling')) return;
    diceContainer.classList.add('rolling');
    
    dice.forEach(die => die.classList.add('die-rolling'));
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const result = rollDrawerDice();
    recordDiceRoll(result);
    
    dice.forEach(die => die.classList.remove('die-rolling'));
    
    updateDiceVisuals(dice[0], result.die1);
    updateDiceVisuals(dice[1], result.die2);
    
    diceContainer.classList.remove('crit-fail', 'crit-success');
    if (result.isSnakeEyes) {
        diceContainer.classList.add('crit-fail');
        setTimeout(() => diceContainer.classList.remove('crit-fail'), 1500);
    } else if (result.isBoxcars) {
        diceContainer.classList.add('crit-success');
        setTimeout(() => diceContainer.classList.remove('crit-success'), 1500);
    }
    
    displayDiceResult(result);
    
    setTimeout(() => diceContainer.classList.remove('rolling'), 500);
    
    window.dispatchEvent(new CustomEvent('tribunal:diceRoll', { detail: result }));
    
    updateFABLuckIndicator();
    
    if (result.isCrit) {
        window.dispatchEvent(new CustomEvent('tribunal:drawerCrit', { 
            detail: {
                ...result,
                luckModifier: result.isBoxcars ? 1 : -1,
                affectsNextInvestigation: true
            }
        }));
        console.log(`[Ledger] Drawer crit: ${result.isBoxcars ? 'BOXCARS' : 'SNAKE EYES'} - luck stored for next investigation`);
    }
}

function updateDiceVisuals(dieElement, value) {
    dieElement.classList.add('die-result');
    setTimeout(() => dieElement.classList.remove('die-result'), 1000);
}

/**
 * Display dice result
 * FIX (Bug 3): Now targets #compartment-dice-result first to avoid
 * overwriting contextual commentary in #compartment-voice / #compartment-commentary
 */
function displayDiceResult(result) {
    // Prefer dedicated dice result element, fall back to commentary
    const commentary = document.getElementById('compartment-dice-result') 
                    || document.getElementById('compartment-commentary');
    if (!commentary) return;
    
    const diceDisplay = `[${result.die1}][${result.die2}] = ${result.total}`;
    
    commentary.innerHTML = `
        <span class="dice-result-display" style="color: ${result.voiceColor}; opacity: 0.5; font-size: 10px;">
            ${diceDisplay}
        </span>
        <br>
        <span style="color: ${result.voiceColor}">
            "${result.response}"
        </span>
    `;
}

// ═══════════════════════════════════════════════════════════════
// FORTUNE SYSTEM - "Open to Seal Your Fate"
// ═══════════════════════════════════════════════════════════════

export function initFortuneButton() {
    const btn = document.getElementById('fortune-draw-btn');
    const envelope = document.getElementById('dora-envelope');
    
    if (!btn) {
        console.warn('[Ledger Voices] Fortune button not found');
        return;
    }
    
    btn.addEventListener('click', handleFortuneDraw);
    
    if (envelope) {
        envelope.addEventListener('click', handleEnvelopeClick);
    }
    
    console.log('[Ledger Voices] Fortune system initialized (Open to seal fate)');
}

/**
 * Handle fortune draw button click
 * Now async to support AI-generated contextual fortunes
 */
async function handleFortuneDraw(e) {
    e.stopPropagation();
    
    const btn = e.currentTarget;
    if (btn.classList.contains('drawing')) return;
    btn.classList.add('drawing');
    
    // Show loading state
    const textEl = document.getElementById('compartment-fortune-text');
    const sigEl = document.querySelector('.letter-signature');
    
    if (textEl) {
        textEl.style.opacity = '0.5';
        textEl.textContent = 'The ledger stirs...';
    }
    
    let result;
    try {
        // Try the new contextual fortune generator (async, may use AI)
        result = await drawContextualFortune();
    } catch (err) {
        console.warn('[Ledger Voices] Contextual fortune failed, using sync fallback:', err);
        // Fall back to sync version (static fortunes only)
        result = drawContextualFortuneSync();
    }
    
    // Store pending fortune
    pendingFortune = {
        ...result,
        drawnAt: Date.now(),
        sealed: false
    };
    
    // Update display
    if (textEl) {
        textEl.style.opacity = '1';
        textEl.style.color = result.voiceColor;
        textEl.textContent = result.fortune;
    }
    
    if (sigEl) {
        sigEl.style.color = result.voiceColor;
        sigEl.textContent = `— ${result.voiceName}`;
    }
    
    // Update envelope state
    const envelope = document.getElementById('dora-envelope');
    if (envelope) {
        envelope.classList.remove('envelope-open');
        envelope.classList.add('fortune-pending');
    }
    
    setTimeout(() => btn.classList.remove('drawing'), 500);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('tribunal:fortunePending', { 
        detail: { hasPending: true } 
    }));
    
    // Log with context info if available
    const contextInfo = result.context 
        ? ` [${result.context.timePeriod}${result.context.characterName ? ', ' + result.context.characterName : ''}${result.isGenerated ? ', AI' : ''}]`
        : '';
    console.log(`[Ledger Voices] Fortune drawn${contextInfo} - open envelope to seal fate`);
}

/**
 * Handle envelope click - opening seals your fate
 * PATCHED: Debounce for mobile, explicit add/remove instead of toggle
 */
function handleEnvelopeClick(e) {
    // Don't trigger if clicking the draw button
    if (e.target.closest && e.target.closest('.draw-fortune-btn')) return;
    
    // DEBOUNCE: Prevent mobile double-fire (touch + click)
    if (envelopeClickCooldown) {
        console.log('[Ledger Voices] Envelope click debounced');
        return;
    }
    envelopeClickCooldown = true;
    setTimeout(() => { envelopeClickCooldown = false; }, 400);
    
    const envelope = e.currentTarget;
    if (!envelope) return;
    
    const isCurrentlyOpen = envelope.classList.contains('envelope-open');
    
    console.log('[Ledger Voices] Envelope clicked, currently open:', isCurrentlyOpen);
    
    if (isCurrentlyOpen) {
        // CLOSING the envelope
        envelope.classList.remove('envelope-open');
        console.log('[Ledger Voices] Envelope closed');
    } else {
        // OPENING the envelope
        envelope.classList.add('envelope-open');
        console.log('[Ledger Voices] Envelope opened');
        
        // If there's a pending fortune, SEAL IT
        if (pendingFortune && !pendingFortune.sealed) {
            sealFate(pendingFortune, envelope);
        }
    }
}

/**
 * Seal the fate - activates the fortune for injection
 * No take-backs!
 */
function sealFate(fortune, envelope) {
    console.log('[Ledger Voices] ⚡ FATE SEALED:', fortune.fortune);
    
    fortune.sealed = true;
    const sealedFortune = { ...fortune };
    pendingFortune = null;
    
    recordFortune(sealedFortune);
    
    if (!envelope) {
        envelope = document.getElementById('dora-envelope');
    }
    
    if (envelope) {
        envelope.classList.remove('fortune-pending');
        
        // FORCE envelope to stay open
        envelope.classList.add('envelope-open');
        
        envelope.classList.add('fate-sealed');
        
        // Remove flash effect but KEEP OPEN
        setTimeout(() => {
            envelope.classList.remove('fate-sealed');
            envelope.classList.add('envelope-open'); // Ensure still open
        }, 1500);
    }
    
    window.dispatchEvent(new CustomEvent('tribunal:fortuneDrawn', { 
        detail: sealedFortune 
    }));
    
    if (typeof toastr !== 'undefined') {
        toastr.warning(
            `"${fortune.fortune.substring(0, 60)}${fortune.fortune.length > 60 ? '...' : ''}"`,
            '⚡ Fate Sealed',
            { 
                timeOut: 4000, 
                positionClass: 'toast-bottom-left',
                escapeHtml: false
            }
        );
    }
}

export function hasPendingFortune() {
    return pendingFortune !== null && !pendingFortune.sealed;
}

export function getPendingFortuneInfo() {
    return pendingFortune;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initLedgerVoices() {
    initDrawerDice();
    initFortuneButton();
    console.log('[Ledger Voices] All systems initialized');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG / EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalLedger = {
        rollDice: rollDrawerDice,
        getCommentForCheck: getLedgerCommentForCheck,
        drawFortune,
        drawContextualFortune,
        drawContextualFortuneSync,
        hasPendingFortune,
        getPendingFortuneInfo,
        getDiceStats,
        getFortuneStats,
        getCurrentLuckModifier,
        consumeLuckModifier,
        updateFABLuckIndicator,
        LEDGER_VOICES,
        init: initLedgerVoices
    };
}

export default {
    rollDrawerDice,
    getLedgerCommentForCheck,
    drawFortune,
    recordDiceRoll,
    recordFortune,
    getDiceStats,
    getFortuneStats,
    hasPendingFortune,
    getPendingFortuneInfo,
    getCurrentLuckModifier,
    consumeLuckModifier,
    getLuckModifier,
    updateFABLuckIndicator,
    initLedgerVoices,
    initDrawerDice,
    initFortuneButton,
    LEDGER_VOICES,
    isDeepNight,
    isLateNight,
    getCurrentTime
};
