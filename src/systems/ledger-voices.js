/**
 * The Tribunal - Ledger Voices & Drawer Dice System
 * Three ledger personalities that respond to dice rolls and dispense fortunes
 * 
 * THE DAMAGED LEDGER - Self-deprecating, observational, tender about being yours
 * THE LEDGER OF OBLIVION - Prophetic, inevitable, fate-speaking  
 * THE LEDGER OF FAILURE AND HATRED - Mocking, 4th-wall, nihilistic-caring
 * 
 * v1.3.0 - FIX: Dice results now target #compartment-dice-result (Bug 3)
 *           Falls back to #compartment-commentary for backwards compat
 */

// Import existing dice system for integration
// Uncomment when in actual extension:
// import { rollSkillCheck, formatCheckResult } from './dice.js';

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
// FORTUNE RESPONSES
// ═══════════════════════════════════════════════════════════════

const FORTUNE_BANKS = {
    damaged: {
        fortunes: [
            "The answer you seek is not in the ledger. It never was.",
            "You are holding something. It might be important. Check your hands.",
            "Someone is lying to you. The ledger doesn't know who. But someone.",
            "The case is closer to solved than you think. Or further. Distance is hard.",
            "There is a detail you've missed. It's small. It matters.",
            "You've forgotten something. The ledger has too. We're even.",
            "The truth is in the water damage. Metaphorically. Maybe literally.",
            "Someone remembers what you've forgotten. They're not telling you.",
            "The evidence exists. You've probably looked at it. Look again.",
            "You're being watched. By the ledger. That counts.",
            "There's a connection you haven't made. The threads are there.",
            "The witness knows more. They always know more.",
            "Something in your inventory is a clue. Probably.",
            "The timing matters. Check when, not just what.",
            "You're asking the wrong question. The right one is nearby."
        ]
    },
    
    oblivion: {
        fortunes: [
            "By morning, you will understand. Or you won't. Both are coming.",
            "The name you seek will be spoken before the day ends.",
            "A door will open. It was never really closed.",
            "Someone will lie to you tomorrow. You'll believe them.",
            "The case will break. Not today. But it will break.",
            "You will make a choice soon. You've already made it.",
            "The truth approaches. It's slower than you'd like.",
            "A face from the past will return. They always do.",
            "You will find what you're not looking for. That's how it works.",
            "The ending is already written. You're just getting there.",
            "Something will be lost. Something else will be found.",
            "A confession is coming. Not the one you expect.",
            "The next conversation will change everything. Or nothing.",
            "You will sleep eventually. The case will still be there.",
            "The killer's name is known to you. You just don't know you know."
        ]
    },
    
    failure: {
        fortunes: [
            "This fortune is a lie. So is the next one. So was the last one.",
            "You're reading paper fortunes in a fake drawer. The case can wait.",
            "The murderer is you. (Not really. But imagine.)",
            "Nothing you do matters. That's freeing if you think about it wrong.",
            "The fortune says: 'go to bed.' The fortune is ignored. Again.",
            "This isn't real. Neither are your problems. Neither am I. Enjoy.",
            "The answer is 'no.' I don't know the question. The answer is still 'no.'",
            "You could close the drawer. You could walk away. You won't.",
            "The ledger sees you. It's not impressed. But it's not leaving either.",
            "Your luck is exactly average. Painfully, consistently average.",
            "The fortune you wanted isn't here. This one is. Deal with it.",
            "I could tell you something useful. I'm choosing not to.",
            "The killer is behind you. (Just kidding. Made you look.)",
            "This fortune was generated by an algorithm. Feel the magic.",
            "You came to a fake drawer for fake wisdom. We deserve each other."
        ],
        deepNight: [
            "It's {time}. You're reading fortunes. I'm a text file. We're both making choices.",
            "The fortune says: sleep. The fortune knows you won't. The fortune is tired of this.",
            "At {time}, the barrier between detective and disaster is just... gone.",
            "You're still here. At {time}. The ledger is concerned. In its way.",
            "This fortune was drawn at {time}. That's not a fortune. That's a cry for help.",
            "{time}. The hour of bad decisions. The fortune says: make another one.",
            "The ledger doesn't sleep. You shouldn't either, apparently. We're both wrong.",
            "It's {time} and you're consulting paper. The real mystery is your sleep schedule."
        ]
    }
};

const EMPTY_FORTUNES = [
    "The wrapper is empty. Some wisdom can't be packaged.",
    "No fortune. The apricot took it. Or there never was one.",
    "Blank. The gum was more forthcoming than the paper.",
    "The fortune has faded. Like everything. Like everyone.",
    "Nothing. The wrapper is as empty as... no, that's too mean. Just empty."
];

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
// ═══════════════════════════════════════════════════════════════

export function drawFortune(forceVoice = null) {
    if (!forceVoice && Math.random() < 0.20) {
        const emptyFortune = EMPTY_FORTUNES[Math.floor(Math.random() * EMPTY_FORTUNES.length)];
        return {
            fortune: emptyFortune,
            voice: 'damaged',
            voiceName: LEDGER_VOICES.damaged.name,
            voiceColor: LEDGER_VOICES.damaged.color,
            isEmpty: true
        };
    }
    
    let selectedVoice;
    if (forceVoice && FORTUNE_BANKS[forceVoice]) {
        selectedVoice = forceVoice;
    } else {
        const roll = Math.random();
        const failureChance = isDeepNight() ? 0.40 : 0.25;
        const damagedChance = isDeepNight() ? 0.30 : 0.40;
        
        if (roll < damagedChance) {
            selectedVoice = 'damaged';
        } else if (roll < damagedChance + (1 - damagedChance - failureChance)) {
            selectedVoice = 'oblivion';
        } else {
            selectedVoice = 'failure';
        }
    }
    
    const bank = FORTUNE_BANKS[selectedVoice];
    let fortunePool = bank.fortunes;
    
    if (selectedVoice === 'failure' && isDeepNight() && bank.deepNight) {
        fortunePool = [...bank.fortunes, ...bank.deepNight, ...bank.deepNight];
    }
    
    let fortune = fortunePool[Math.floor(Math.random() * fortunePool.length)];
    fortune = fortune.replace('{time}', getCurrentTime());
    
    const voice = LEDGER_VOICES[selectedVoice];
    
    return {
        fortune,
        voice: selectedVoice,
        voiceName: voice.name,
        voiceColor: voice.color,
        isEmpty: false
    };
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
            markedTrue: false
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

function handleFortuneDraw(e) {
    e.stopPropagation();
    
    const btn = e.currentTarget;
    if (btn.classList.contains('drawing')) return;
    btn.classList.add('drawing');
    
    const result = drawFortune();
    
    pendingFortune = {
        ...result,
        drawnAt: Date.now(),
        sealed: false
    };
    
    const textEl = document.getElementById('compartment-fortune-text');
    const sigEl = document.querySelector('.letter-signature');
    
    if (textEl) {
        textEl.style.color = result.voiceColor;
        textEl.textContent = result.fortune;
    }
    
    if (sigEl) {
        sigEl.style.color = result.voiceColor;
        sigEl.textContent = `— ${result.voiceName}`;
    }
    
    const envelope = document.getElementById('dora-envelope');
    if (envelope) {
        envelope.classList.remove('envelope-open');
        envelope.classList.add('fortune-pending');
    }
    
    setTimeout(() => btn.classList.remove('drawing'), 500);
    
    window.dispatchEvent(new CustomEvent('tribunal:fortunePending', { 
        detail: { hasPending: true } 
    }));
    
    console.log('[Ledger Voices] Fortune drawn - open envelope to seal fate');
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
