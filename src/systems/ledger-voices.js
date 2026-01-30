/**
 * The Tribunal - Ledger Voices & Drawer Dice System
 * Three ledger personalities that respond to dice rolls and dispense fortunes
 * 
 * THE DAMAGED LEDGER - Self-deprecating, observational, tender about being yours
 * THE LEDGER OF OBLIVION - Prophetic, inevitable, fate-speaking  
 * THE LEDGER OF FAILURE AND HATRED - Mocking, 4th-wall, nihilistic-caring
 * 
 * v1.1.0 - Option B: Open envelope to seal your fate (no take-backs!)
 */

// Import existing dice system for integration
// Uncomment when in actual extension:
// import { rollSkillCheck, formatCheckResult } from './dice.js';
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
        // The ledger knows it's a sad, smelly, water-damaged prop
        // But it's YOUR sad, smelly, water-damaged prop
    },
    oblivion: {
        name: 'THE LEDGER OF OBLIVION',
        color: 'var(--psyche, #9b6b9e)',  // Purple
        tone: 'Prophetic, inevitable, ominous',
        domain: 'What WILL BE - the future, fate',
        // Speaks in certainties about uncertain things
        // Sometimes right. Sometimes not. Always confident.
    },
    failure: {
        name: 'THE LEDGER OF FAILURE AND HATRED',
        color: 'var(--physique, #b54b4b)',  // Red
        tone: 'Mocking, bitter, 4th-wall breaking',
        domain: 'Lies and cruelty (but are they lies?)',
        // Knows it's a text file. Knows you're reading it at 3am.
        // Judges you. Cares about you. Won't admit either.
    }
};

// ═══════════════════════════════════════════════════════════════
// DICE ROLL RESPONSES
// The ledger comments when you fidget with the dice
// ═══════════════════════════════════════════════════════════════

const DICE_RESPONSES = {
    // Snake Eyes (1-1) - Critical Failure
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
    
    // Boxcars (6-6) - Critical Success  
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
    
    // Normal Rolls - The Damaged Ledger comments
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
    
    // High rolls (10-11) - Damaged but encouraging
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
    
    // Low rolls (3-4) - Damaged, sympathetic
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
    
    // Doubles (not crits) - Oblivion notices patterns
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
// Drawn from the envelope in the compartment
// ═══════════════════════════════════════════════════════════════

const FORTUNE_BANKS = {
    damaged: {
        // Present tense, observations, incomplete truths
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
        // Future tense, prophecy, fate
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
        // Lies, cruelty, 4th wall breaks, nihilism with care
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
        // Special deep night variants
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

// Empty fortune (20% chance)
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
// Uses same 2d6 as skill checks, but just for fidgeting + ledger commentary
// ═══════════════════════════════════════════════════════════════

/**
 * Roll two dice in the drawer and get a ledger response
 * This is the "fidget" roll - no skill check, just vibes
 * @returns {Object} { die1, die2, total, type, voice, response, isDouble, isCrit }
 */
export function rollDrawerDice() {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDouble = die1 === die2;
    const isBoxcars = die1 === 6 && die2 === 6;
    const isSnakeEyes = die1 === 1 && die2 === 1;
    
    let type, responseBank;
    
    // Determine roll type and response bank
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
    
    // Pick random response
    const lines = responseBank.lines;
    let response = lines[Math.floor(Math.random() * lines.length)];
    
    // Replace time placeholder if present
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

/**
 * Get a ledger response for an EXISTING skill check result
 * Use this to add ledger commentary to dice.js skill checks
 * 
 * @param {Object} checkResult - Result from dice.js rollSkillCheck()
 * @returns {Object} { voice, voiceName, voiceColor, response }
 */
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

/**
 * Calculate luck modifier for next skill check based on drawer dice roll
 * Decays over time/use - just a small bonus, not game-breaking
 * @param {string} rollType - The type of roll from rollDrawerDice()
 * @returns {number} Modifier (-1 to +1)
 */
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

/**
 * Draw a fortune from the compartment
 * @param {boolean} forceVoice - Optional: force a specific voice ('damaged', 'oblivion', 'failure')
 * @returns {Object} { fortune, voice, voiceName, voiceColor, isEmpty }
 */
export function drawFortune(forceVoice = null) {
    // 20% chance of empty fortune
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
    
    // Select voice based on weights (or forced)
    let selectedVoice;
    if (forceVoice && FORTUNE_BANKS[forceVoice]) {
        selectedVoice = forceVoice;
    } else {
        // Weights: Damaged 40%, Oblivion 35%, Failure 25%
        // Deep night increases Failure chance
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
    
    // Get fortune bank
    const bank = FORTUNE_BANKS[selectedVoice];
    let fortunePool = bank.fortunes;
    
    // For Failure voice at deep night, mix in deep night variants
    if (selectedVoice === 'failure' && isDeepNight() && bank.deepNight) {
        fortunePool = [...bank.fortunes, ...bank.deepNight, ...bank.deepNight]; // Weight deep night
    }
    
    // Pick random fortune
    let fortune = fortunePool[Math.floor(Math.random() * fortunePool.length)];
    
    // Replace time placeholder
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

// Track dice rolls for compartment unlock and stats
let diceHistory = {
    totalRolls: 0,
    snakeEyes: 0,
    boxcars: 0,
    lastRoll: null,
    luckModifier: 0,
    luckExpiry: null
};

// Track fortunes
let fortuneHistory = {
    totalDrawn: 0,
    lastFortune: null,
    fortunes: [] // Array of { fortune, voice, timestamp, markedTrue }
};

// PENDING FORTUNE - drawn but not yet opened/sealed
let pendingFortune = null;

/**
 * Record a dice roll for stats
 */
export function recordDiceRoll(rollResult) {
    diceHistory.totalRolls++;
    diceHistory.lastRoll = rollResult;
    
    if (rollResult.type === 'snakeEyes') diceHistory.snakeEyes++;
    if (rollResult.type === 'boxcars') diceHistory.boxcars++;
    
    // Set luck modifier (expires after 10 minutes or next investigation)
    diceHistory.luckModifier = getLuckModifier(rollResult.type);
    diceHistory.luckExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    return diceHistory;
}

/**
 * Record a fortune draw (called when fate is SEALED, not when drawn)
 */
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
        
        // Keep only last 20 fortunes
        if (fortuneHistory.fortunes.length > 20) {
            fortuneHistory.fortunes = fortuneHistory.fortunes.slice(-20);
        }
    }
    
    return fortuneHistory;
}

/**
 * Get current luck modifier (if not expired)
 */
export function getCurrentLuckModifier() {
    if (!diceHistory.luckExpiry || Date.now() > diceHistory.luckExpiry) {
        diceHistory.luckModifier = 0;
        return 0;
    }
    return diceHistory.luckModifier;
}

/**
 * Consume luck modifier (call after using in investigation)
 */
export function consumeLuckModifier() {
    const luck = getCurrentLuckModifier();
    diceHistory.luckModifier = 0;
    diceHistory.luckExpiry = null;
    return luck;
}

/**
 * Get dice stats for officer profile
 */
export function getDiceStats() {
    return {
        totalRolls: diceHistory.totalRolls,
        criticalFailures: diceHistory.snakeEyes,
        criticalSuccesses: diceHistory.boxcars
    };
}

/**
 * Get fortune stats
 */
export function getFortuneStats() {
    return {
        totalDrawn: fortuneHistory.totalDrawn,
        fortunes: fortuneHistory.fortunes
    };
}

// ═══════════════════════════════════════════════════════════════
// UI INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Update investigation FAB to show luck status
 * Call this after dice rolls or on interval
 */
export function updateFABLuckIndicator() {
    const fab = document.getElementById('tribunal-investigation-fab');
    if (!fab) return;
    
    const luck = getCurrentLuckModifier();
    
    // Remove existing luck classes
    fab.classList.remove('luck-positive', 'luck-negative');
    
    // Add appropriate class
    if (luck > 0) {
        fab.classList.add('luck-positive');
    } else if (luck < 0) {
        fab.classList.add('luck-negative');
    }
}

/**
 * Initialize drawer dice click handlers
 * Call after DOM is ready
 */
export function initDrawerDice() {
    const diceContainer = document.querySelector('.compartment-dice');
    if (!diceContainer) {
        console.warn('[Ledger Voices] Dice container not found');
        return;
    }
    
    diceContainer.style.cursor = 'pointer';
    diceContainer.addEventListener('click', handleDiceClick);
    
    // Also update FAB when luck expires (check every 30s)
    setInterval(updateFABLuckIndicator, 30000);
    
    console.log('[Ledger Voices] Drawer dice initialized');
}

/**
 * Handle dice click - roll and display result
 */
async function handleDiceClick(e) {
    const diceContainer = e.currentTarget;
    const dice = diceContainer.querySelectorAll('.siren-die');
    
    // Prevent spam clicking
    if (diceContainer.classList.contains('rolling')) return;
    diceContainer.classList.add('rolling');
    
    // Add shake animation
    dice.forEach(die => die.classList.add('die-rolling'));
    
    // Roll after animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Get roll result
    const result = rollDrawerDice();
    recordDiceRoll(result);
    
    // Remove animation
    dice.forEach(die => die.classList.remove('die-rolling'));
    
    // Update visual dice (optional - could show dots)
    updateDiceVisuals(dice[0], result.die1);
    updateDiceVisuals(dice[1], result.die2);
    
    // Add crit visual effects
    diceContainer.classList.remove('crit-fail', 'crit-success');
    if (result.isSnakeEyes) {
        diceContainer.classList.add('crit-fail');
        setTimeout(() => diceContainer.classList.remove('crit-fail'), 1500);
    } else if (result.isBoxcars) {
        diceContainer.classList.add('crit-success');
        setTimeout(() => diceContainer.classList.remove('crit-success'), 1500);
    }
    
    // Display result in commentary
    displayDiceResult(result);
    
    // Remove rolling lock
    setTimeout(() => diceContainer.classList.remove('rolling'), 500);
    
    // Dispatch events for other systems
    window.dispatchEvent(new CustomEvent('tribunal:diceRoll', { detail: result }));
    
    // Update FAB luck indicator
    updateFABLuckIndicator();
    
    // Dispatch specific crit events for investigation integration
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

/**
 * Update dice visual appearance based on roll
 */
function updateDiceVisuals(dieElement, value) {
    // Could add pips or number display
    // For now, just add a subtle pulse on the result
    dieElement.classList.add('die-result');
    setTimeout(() => dieElement.classList.remove('die-result'), 1000);
}

/**
 * Display dice result in the compartment commentary area
 */
function displayDiceResult(result) {
    const commentary = document.getElementById('compartment-commentary');
    if (!commentary) return;
    
    // Format the display
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
// You drew it. Now you have to OPEN it. No take-backs.
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize fortune button AND envelope handler
 */
export function initFortuneButton() {
    const btn = document.getElementById('fortune-draw-btn');
    const envelope = document.getElementById('dora-envelope');
    
    if (!btn) {
        console.warn('[Ledger Voices] Fortune button not found');
        return;
    }
    
    // Draw button - creates fortune but CLOSES envelope
    btn.addEventListener('click', handleFortuneDraw);
    
    // Envelope click - OPENING seals your fate
    if (envelope) {
        envelope.addEventListener('click', handleEnvelopeClick);
    }
    
    console.log('[Ledger Voices] Fortune system initialized (Open to seal fate)');
}

/**
 * Handle fortune draw - creates fortune but doesn't activate it
 * You must OPEN the envelope to seal your fate
 */
function handleFortuneDraw(e) {
    e.stopPropagation(); // Don't toggle envelope
    
    const btn = e.currentTarget;
    if (btn.classList.contains('drawing')) return;
    btn.classList.add('drawing');
    
    // Draw fortune (but don't activate yet!)
    const result = drawFortune();
    
    // Store as pending - not yet sealed
    pendingFortune = {
        ...result,
        drawnAt: Date.now(),
        sealed: false
    };
    
    // Update display (hidden behind closed envelope)
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
    
    // CLOSE the envelope - must open to read/activate
    const envelope = document.getElementById('dora-envelope');
    if (envelope) {
        envelope.classList.remove('envelope-open');
        envelope.classList.add('fortune-pending'); // Visual hint
    }
    
    // Remove drawing lock
    setTimeout(() => btn.classList.remove('drawing'), 500);
    
    // Dispatch pending event (not the full fortuneDrawn yet)
    window.dispatchEvent(new CustomEvent('tribunal:fortunePending', { 
        detail: { hasPending: true } 
    }));
    
    console.log('[Ledger Voices] Fortune drawn - open envelope to seal fate');
}

/**
 * Handle envelope click - opening seals your fate
 */
function handleEnvelopeClick(e) {
    if (e.target.closest('.draw-fortune-btn')) return;
    
    // DEBOUNCE: Prevent mobile double-fire
    if (envelopeClickCooldown) return;
    envelopeClickCooldown = true;
    setTimeout(() => { envelopeClickCooldown = false; }, 300);
    
    const envelope = e.currentTarget;
    const isCurrentlyOpen = envelope.classList.contains('envelope-open');
    
    if (isCurrentlyOpen) {
        envelope.classList.remove('envelope-open');
    } else {
        envelope.classList.add('envelope-open');
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
    
    // Mark as sealed
    fortune.sealed = true;
    const sealedFortune = { ...fortune };
    pendingFortune = null;
    
    // NOW record it for injection
    recordFortune(sealedFortune);
    
    // Remove pending visual hint
    const envelope = document.getElementById('dora-envelope');
    if (envelope) {
        envelope.classList.remove('fortune-pending');
        envelope.classList.add('fate-sealed');
        
        // Brief dramatic effect
        setTimeout(() => {
            envelope.classList.remove('fate-sealed');
            envelope.classList.add('envelope-open'); // FORCE stay open
        }, 1500);
    }
    
    // Dispatch the real event - fortune is now active
    window.dispatchEvent(new CustomEvent('tribunal:fortuneDrawn', { 
        detail: sealedFortune 
    }));
    
    // Dramatic toast
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

/**
 * Check if there's a pending (unsealed) fortune
 */
export function hasPendingFortune() {
    return pendingFortune !== null && !pendingFortune.sealed;
}

/**
 * Get pending fortune (for display/debug)
 */
export function getPendingFortuneInfo() {
    return pendingFortune;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize all ledger voice systems
 */
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
        // Drawer dice (fidget roll)
        rollDice: rollDrawerDice,
        
        // Hook for dice.js skill checks
        getCommentForCheck: getLedgerCommentForCheck,
        
        // Fortune system
        drawFortune,
        hasPendingFortune,
        getPendingFortuneInfo,
        
        // Stats
        getDiceStats,
        getFortuneStats,
        
        // Luck integration
        getCurrentLuckModifier,
        consumeLuckModifier,
        updateFABLuckIndicator,
        
        // Voice definitions
        LEDGER_VOICES,
        
        // Init
        init: initLedgerVoices
    };
}

export default {
    // Core systems
    rollDrawerDice,
    getLedgerCommentForCheck,  // Hook for dice.js integration
    drawFortune,
    
    // State tracking
    recordDiceRoll,
    recordFortune,
    getDiceStats,
    getFortuneStats,
    hasPendingFortune,
    getPendingFortuneInfo,
    
    // Luck system
    getCurrentLuckModifier,
    consumeLuckModifier,
    getLuckModifier,
    updateFABLuckIndicator,
    
    // Initialization
    initLedgerVoices,
    initDrawerDice,
    initFortuneButton,
    
    // Data
    LEDGER_VOICES,
    
    // Utilities
    isDeepNight,
    isLateNight,
    getCurrentTime
};
