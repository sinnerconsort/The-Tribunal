/**
 * The Tribunal - Ledger Voice Engine
 * The ledger stops being a fortune cookie machine and becomes a PRESENCE.
 * 
 * Replaces: ledger-commentary.js, fidget-commentary.js
 * Consumes: ledger-awareness.js events, fidget-patterns.js events, dice events
 * Uses: api-helpers.js for background AI generation
 * 
 * Three voices, one engine, one escalating obsession.
 * 
 * @version 1.0.0
 */

import { 
    onAwarenessEvent, 
    getTimePeriod, 
    isDeepNight, 
    isLateNight,
    getAwarenessState 
} from './ledger-awareness.js';

import { callAPIWithTokens } from '../voice/api-helpers.js';
import { LEDGER_VOICES } from './ledger-voices.js';

// ═══════════════════════════════════════════════════════════════
// VOICE PERSONAS (for AI generation prompts)
// ═══════════════════════════════════════════════════════════════

const VOICE_PERSONAS = {
    damaged: `You are the voice of a water-damaged police ledger. You observe the present moment with weary tenderness. You notice the detective's habits, their fidgeting, their hours. You refer to yourself as damaged, stained, incomplete. You care, but you'd never admit it directly.`,
    
    oblivion: `You are the prophetic voice of a ledger that has seen too many cases end. You speak of what will happen, not what has. You are not cruel — just inevitable. You see patterns the detective can't.`,
    
    failure: `You are the bitter voice of a ledger that knows it's not real. You mock the detective for consulting paper for wisdom. You break the fourth wall — you know this is a game, a simulation, a text file. You are cruel because you care and you hate that you care.`
};

// ═══════════════════════════════════════════════════════════════
// VOLUME SYSTEM
// The ledger starts quiet and gets louder
// ═══════════════════════════════════════════════════════════════

const VOLUME_LEVELS = {
    0: { name: 'silent',    responseChance: 0,    lengthConstraint: '', instruction: '' },
    1: { name: 'whisper',   responseChance: 0.5,  lengthConstraint: '5-10 words maximum.', instruction: 'Almost inaudible. A fragment.' },
    2: { name: 'murmur',    responseChance: 0.65, lengthConstraint: 'Under 15 words.', instruction: 'Quiet. A brief observation.' },
    3: { name: 'voice',     responseChance: 0.8,  lengthConstraint: 'Under 20 words.', instruction: 'Clear. A full thought.' },
    4: { name: 'insistent', responseChance: 0.9,  lengthConstraint: 'Under 25 words.', instruction: 'Urgent. The ledger NEEDS to say this.' },
    5: { name: 'screaming', responseChance: 1.0,  lengthConstraint: 'Can be longer, more emotional.', instruction: 'Raw and unfiltered. The mask is off.' }
};

// Voice selection weights by volume (higher = more likely)
// [damaged, oblivion, failure]
const VOICE_WEIGHTS = {
    0: [0, 0, 0],
    1: [8, 1, 1],      // Mostly gentle
    2: [6, 3, 1],      // Some prophecy
    3: [4, 3, 3],      // Balanced
    4: [2, 4, 4],      // More intense
    5: [2, 3, 5]       // Failure dominates
};

// ═══════════════════════════════════════════════════════════════
// ENGINE STATE
// ═══════════════════════════════════════════════════════════════

let engineState = {
    // Session
    sessionStart: null,
    compartmentFirstOpened: null,
    
    // Volume tracking
    currentVolume: 0,
    interactionCount: 0,
    
    // Generation
    isGenerating: false,
    lastGenerationTime: 0,
    generationCooldown: 8000,   // Min 8s between generations
    
    // Display
    lastDisplayedLine: null,
    lastDisplayedVoice: null,
    
    // Stats
    generatedCount: 0,
    fallbackCount: 0,
    suppressedCount: 0
};

// ═══════════════════════════════════════════════════════════════
// STATIC FALLBACKS
// Curated best lines for when API fails/unavailable
// ═══════════════════════════════════════════════════════════════

const STATIC_FALLBACKS = {
    compartmentOpen: {
        damaged: [
            "You're back. The ledger noticed. It always notices.",
            "The drawer opens. The cases remain.",
            "Morning. The ledger doesn't judge. (It judges.)",
            "You found it again. The hidden drawer."
        ],
        oblivion: [
            "Late. The hour when truths surface.",
            "The night deepens. So do you.",
            "Something approaches. The ledger feels it."
        ],
        failure: [
            "It's {time}. You're consulting a drawer. We both made choices.",
            "Why are you awake? ...Why am I?",
            "The witching hours. When normal people sleep."
        ]
    },
    absence: {
        damaged: [
            "You were gone. Not long. Long enough.",
            "The drawer sat in darkness. It's used to it.",
            "Back already? The cases haven't solved themselves."
        ],
        oblivion: [
            "Gone {duration}. Time moves differently in the drawer.",
            "The investigation paused. Did you?"
        ],
        failure: [
            "Did you think the cases would solve themselves?",
            "You abandoned the drawer. It noticed. It always notices."
        ]
    },
    diceRoll: {
        damaged: [
            "The dice clatter. Like everything else in here, they're waiting.",
            "Numbers on bone. Or plastic. The ledger can't tell anymore.",
            "Click, clatter, stop. The sound of deciding nothing."
        ],
        oblivion: [
            "The numbers align. Something is coming.",
            "Doubles. The numbers echo. Something repeats.",
            "The dice show sixes. Somewhere, fate pulls taut."
        ],
        failure: [
            "Snake eyes. The universe has opinions about you.",
            "The lowest roll. The dice aren't broken. They're accurate.",
            "Ones. You could stop rolling. You won't."
        ]
    },
    fidgetPattern: {
        damaged: [
            "Click click click. The drawer hears you.",
            "You're fidgeting. The ledger recognizes nervous hands.",
            "Roll after roll. The drawer is patient. Are you?"
        ],
        oblivion: [
            "The pattern is clear. You are seeking.",
            "Roll after roll. The future doesn't change.",
            "Something in the numbers. The ledger sees it."
        ],
        failure: [
            "This is compulsive now. The ledger sees you.",
            "The dice aren't going to fix anything.",
            "You're fidgeting because something else is wrong."
        ]
    },
    vitalsChange: {
        damaged: [
            "Your body protests. The ledger notes it.",
            "Something broke inside. The ledger feels it too.",
            "Health declining. The cases don't care. The ledger does."
        ],
        oblivion: [
            "You're fading. The ledger watches. Helpless.",
            "Critical. The word hangs in the drawer's darkness."
        ],
        failure: [
            "Your body is failing. The dice can't help you now.",
            "Morale gone. Welcome to the drawer. It understands."
        ]
    },
    timeShift: {
        damaged: [
            "The hour shifted. You didn't notice. The ledger did.",
            "Time passes. The cases don't care."
        ],
        oblivion: [
            "Midnight crosses. A threshold, not a clock.",
            "Deep night begins. The ledger's voice grows clearer."
        ],
        failure: [
            "Still here? The hours don't care about your dedication.",
            "Morning comes. Your problems haven't left."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// VOLUME CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate current volume level based on session state
 * @returns {number} Volume level 0-5
 */
function calculateVolume() {
    // No volume until compartment has been opened
    if (!engineState.compartmentFirstOpened) return 0;
    
    const now = Date.now();
    const sessionMinutes = (now - engineState.compartmentFirstOpened) / 60000;
    
    // Base volume from session duration
    let volume = 0;
    if (sessionMinutes < 2) volume = 0;
    else if (sessionMinutes < 10) volume = 1;
    else if (sessionMinutes < 30) volume = 2;
    else if (sessionMinutes < 60) volume = 3;
    else if (sessionMinutes < 120) volume = 4;
    else volume = 5;
    
    // Modifier: interaction density (lots of rolls accelerates)
    if (engineState.interactionCount > 15) volume = Math.min(5, volume + 1);
    
    // Modifier: deep night adds +1
    if (isDeepNight()) volume = Math.min(5, volume + 1);
    
    engineState.currentVolume = volume;
    return volume;
}

// ═══════════════════════════════════════════════════════════════
// VOICE SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Select which voice speaks based on event type, time, and volume
 * @param {string} trigger - Event type
 * @param {object} data - Event data
 * @returns {string} 'damaged' | 'oblivion' | 'failure'
 */
function selectVoice(trigger, data = {}) {
    const volume = calculateVolume();
    const period = getTimePeriod();
    
    // Some triggers have strong voice associations
    if (trigger === 'diceRoll') {
        if (data.isSnakeEyes) return 'failure';
        if (data.isBoxcars) return 'oblivion';
        if (data.isDouble) return 'oblivion';
    }
    
    if (trigger === 'compartmentOpen') {
        if (period === 'deep_night') return 'failure';
        if (period === 'late_night') return 'oblivion';
    }
    
    if (trigger === 'fidgetPattern') {
        if (data.name === 'cursed') return 'oblivion';
        if (data.name === 'blessed') return 'oblivion';
        if (data.name === 'frantic' || data.name === 'late_night_fidget') return 'failure';
        if (data.name === 'calming_down') return 'damaged';
    }
    
    if (trigger === 'vitalsChange' && data.isCritical) return 'oblivion';
    
    // Otherwise, weighted random based on volume
    const weights = VOICE_WEIGHTS[volume] || VOICE_WEIGHTS[3];
    const voices = ['damaged', 'oblivion', 'failure'];
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    
    for (let i = 0; i < voices.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return voices[i];
    }
    
    return 'damaged'; // Fallback
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT SNAPSHOT
// Build the context object sent to generation
// ═══════════════════════════════════════════════════════════════

/**
 * Build a context snapshot for generation
 * @param {string} trigger - Event type
 * @param {object} triggerData - Event-specific data
 * @param {string} voice - Selected voice
 * @returns {object} Context snapshot
 */
function buildContextSnapshot(trigger, triggerData, voice) {
    const volume = calculateVolume();
    const now = new Date();
    const sessionMs = engineState.compartmentFirstOpened 
        ? Date.now() - engineState.compartmentFirstOpened 
        : 0;
    
    return {
        trigger,
        triggerData,
        
        volume,
        volumeName: VOLUME_LEVELS[volume]?.name || 'voice',
        sessionDuration: Math.floor(sessionMs / 60000),
        rollCount: engineState.interactionCount,
        
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        timePeriod: getTimePeriod(),
        isDeepNight: isDeepNight(),
        isLateNight: isLateNight(),
        
        voice
    };
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER DESCRIPTIONS (for the AI prompt)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a human-readable trigger description for the AI
 * @param {string} trigger - Event type
 * @param {object} data - Event data
 * @returns {string} Description
 */
function describeTrigger(trigger, data = {}) {
    switch (trigger) {
        case 'compartmentOpen':
            if (data.absence?.minutes >= 30) {
                return `The detective returns after being gone ${data.absence.formatted}. They're opening the secret drawer again.`;
            }
            return `The detective just opened the hidden compartment drawer.`;
            
        case 'diceRoll':
            if (data.isSnakeEyes) return `Snake eyes. The detective rolled double ones. Critical failure.`;
            if (data.isBoxcars) return `Boxcars. The detective rolled double sixes. Perfect roll.`;
            if (data.isDouble) return `Doubles — ${data.die1} and ${data.die1}. The numbers echo.`;
            if (data.total <= 4) return `Low roll: ${data.total}. The dice aren't kind.`;
            if (data.total >= 10) return `High roll: ${data.total}. Fortune favors.`;
            return `The detective rolled ${data.total}. Unremarkable numbers.`;
            
        case 'fidgetPattern':
            const patterns = {
                rapid: `The detective is rolling dice rapidly — nervous energy, click-click-click.`,
                frantic: `Frantic rolling. The detective's hands are shaking.`,
                cursed: `Multiple snake eyes in a row. Something feels wrong.`,
                blessed: `Multiple boxcars. The dice glow with unusual favor.`,
                unlucky_streak: `A streak of bad rolls. Nothing lands above a 5.`,
                seeking: `Roll after roll without checking fortunes. The detective is seeking something in the numbers.`,
                ritual: `The detective alternates fortunes and dice — building a superstitious ritual.`,
                late_night_fidget: `Late night fidgeting. Rolling dice after midnight.`,
                calming_down: `The fidgeting has stopped. The detective is calming down.`
            };
            return patterns[data.name] || `The detective is fidgeting with the drawer items.`;
            
        case 'vitalsChange':
            if (data.isCritical) return `Critical condition. The detective is barely holding on.`;
            if (data.type === 'health_drop') return `Physical damage. The detective's body is hurting.`;
            if (data.type === 'morale_drop') return `Morale dropping. Something broke inside.`;
            return `The detective's condition has changed.`;
            
        case 'timeShift':
            return `Time has shifted from ${data.from} to ${data.to}. ${data.isDeepNight ? 'The witching hours begin.' : ''}`;
            
        case 'locationChange':
            const locName = typeof data === 'string' ? data : (data.name || data.to || 'somewhere new');
            return `The detective has moved to ${locName}.`;
            
        default:
            return `Something happened in the drawer.`;
    }
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the generation prompt
 * @param {object} context - Context snapshot from buildContextSnapshot
 * @returns {{ system: string, user: string }}
 */
function buildPrompt(context) {
    const vol = VOLUME_LEVELS[context.volume] || VOLUME_LEVELS[3];
    const persona = VOICE_PERSONAS[context.voice];
    
    const system = [
        persona,
        '',
        `VOLUME: ${vol.name} — ${vol.instruction}`,
        `TIME: ${context.time} (${context.timePeriod}${context.isDeepNight ? ' — the witching hours' : ''})`,
        `SESSION: ${context.sessionDuration} minutes, ${context.rollCount} interactions`,
        '',
        'Respond with exactly ONE line of dialogue. No quotation marks. No attribution. No asterisks.',
        vol.lengthConstraint
    ].join('\n');
    
    const user = [
        `TRIGGER: ${describeTrigger(context.trigger, context.triggerData)}`,
        '',
        'Respond as the ledger voice. One line only.'
    ].join('\n');
    
    return { system, user };
}

// ═══════════════════════════════════════════════════════════════
// GENERATION + FALLBACK
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a voice line via API, with timeout and static fallback
 * @param {string} trigger - Event type
 * @param {object} triggerData - Event-specific data
 * @param {string} voice - Selected voice
 * @returns {Promise<string>} The voice line
 */
async function generateLine(trigger, triggerData, voice) {
    const context = buildContextSnapshot(trigger, triggerData, voice);
    const { system, user } = buildPrompt(context);
    
    // Try API generation with 5s timeout
    try {
        const linePromise = callAPIWithTokens(system, user, 80);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        let line = await Promise.race([linePromise, timeoutPromise]);
        
        // Clean up the response
        line = cleanGeneratedLine(line);
        
        if (line && line.length > 5) {
            engineState.generatedCount++;
            console.log(`[Voice Engine] Generated (${voice}):`, line);
            return line;
        }
    } catch (err) {
        console.log(`[Voice Engine] Generation failed: ${err.message}, using fallback`);
    }
    
    // Fallback to static lines
    return pickStaticFallback(trigger, voice, triggerData);
}

/**
 * Clean up an AI-generated line
 * @param {string} line - Raw AI output
 * @returns {string} Cleaned line
 */
function cleanGeneratedLine(line) {
    if (!line || typeof line !== 'string') return '';
    
    let cleaned = line.trim();
    
    // Remove wrapping quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
    }
    
    // Remove attribution like "— THE DAMAGED LEDGER"
    cleaned = cleaned.replace(/\s*[—–-]\s*(THE\s+)?(DAMAGED\s+)?LEDGER.*$/i, '');
    cleaned = cleaned.replace(/\s*[—–-]\s*(THE\s+)?LEDGER\s+OF\s+.*/i, '');
    
    // Remove leading/trailing asterisks (emotes)
    cleaned = cleaned.replace(/^\*+|\*+$/g, '');
    
    // Remove any remaining quotes
    cleaned = cleaned.replace(/^["']+|["']+$/g, '');
    
    return cleaned.trim();
}

/**
 * Pick a random static fallback line
 * @param {string} trigger - Event type
 * @param {string} voice - Voice ID
 * @param {object} data - Event data for template replacement
 * @returns {string} Static line
 */
function pickStaticFallback(trigger, voice, data = {}) {
    engineState.fallbackCount++;
    
    const pool = STATIC_FALLBACKS[trigger]?.[voice] || 
                 STATIC_FALLBACKS[trigger]?.damaged ||
                 STATIC_FALLBACKS.compartmentOpen.damaged;
    
    let line = pool[Math.floor(Math.random() * pool.length)];
    
    // Template replacements
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    line = line.replace(/\{time\}/g, time);
    line = line.replace(/\{duration\}/g, data?.absence?.formatted || data?.formatted || 'a while');
    
    console.log(`[Voice Engine] Fallback (${voice}):`, line);
    return line;
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY
// Single commentary area + optional toasts
// ═══════════════════════════════════════════════════════════════

/**
 * Display a voice line in the compartment and optionally as a toast
 * @param {string} line - The voice line text
 * @param {string} voice - Voice ID ('damaged', 'oblivion', 'failure')
 * @param {object} options - Display options
 */
function displayLine(line, voice, options = {}) {
    const voiceData = LEDGER_VOICES[voice] || LEDGER_VOICES.damaged;
    const volume = engineState.currentVolume;
    
    // Update compartment commentary area
    // Try #compartment-voice first, then #compartment-commentary
    const el = document.getElementById('compartment-voice') || 
               document.getElementById('compartment-commentary');
    
    if (el) {
        el.innerHTML = `<span class="voice-engine-line" style="color: ${voiceData.color}; opacity: 0; transition: opacity 0.8s ease;">"${line}"</span>`;
        
        // Fade in
        requestAnimationFrame(() => {
            const span = el.querySelector('.voice-engine-line');
            if (span) span.style.opacity = '1';
        });
    }
    
    // Toast behavior based on volume
    const showToast = options.toast !== false && (volume >= 3 || options.toast === true);
    
    if (showToast && typeof toastr !== 'undefined') {
        const duration = volume >= 5 ? 8000 : (volume >= 4 ? 6000 : 4000);
        
        toastr.info(
            `<span style="color: ${voiceData.color}">"${line}"</span>`,
            voiceData.name,
            {
                timeOut: duration,
                positionClass: 'toast-bottom-left',
                escapeHtml: false,
                progressBar: true
            }
        );
    }
    
    // Track what we displayed
    engineState.lastDisplayedLine = line;
    engineState.lastDisplayedVoice = voice;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENGINE: Should we speak?
// ═══════════════════════════════════════════════════════════════

/**
 * The main engine entry point. Decides if the ledger should speak,
 * selects a voice, generates a line, and displays it.
 * 
 * @param {string} trigger - Event type
 * @param {object} data - Event-specific data
 * @param {object} options - Override options
 */
async function speak(trigger, data = {}, options = {}) {
    const now = Date.now();
    
    // Don't speak if already generating
    if (engineState.isGenerating) {
        console.log('[Voice Engine] Already generating, skipping');
        engineState.suppressedCount++;
        return;
    }
    
    // Cooldown between generations
    if (now - engineState.lastGenerationTime < engineState.generationCooldown) {
        console.log('[Voice Engine] Cooldown active, skipping');
        engineState.suppressedCount++;
        return;
    }
    
    // Calculate volume
    const volume = calculateVolume();
    
    // Silent = no speech
    if (volume === 0 && !options.force) {
        return;
    }
    
    // Response chance check (unless forced)
    const chance = VOLUME_LEVELS[volume]?.responseChance || 0;
    if (!options.force && Math.random() > chance) {
        console.log(`[Voice Engine] Response chance miss (${(chance * 100).toFixed(0)}%)`);
        engineState.suppressedCount++;
        return;
    }
    
    // Select voice
    const voice = options.voice || selectVoice(trigger, data);
    
    // Generate
    engineState.isGenerating = true;
    engineState.lastGenerationTime = now;
    engineState.interactionCount++;
    
    try {
        // Choreography delay based on trigger
        const delay = getChoreographyDelay(trigger);
        if (delay > 0) {
            await new Promise(r => setTimeout(r, delay));
        }
        
        const line = await generateLine(trigger, data, voice);
        displayLine(line, voice, options);
    } catch (err) {
        console.error('[Voice Engine] Speak error:', err);
        // Absolute fallback
        const fallback = pickStaticFallback(trigger, voice, data);
        displayLine(fallback, voice, options);
    } finally {
        engineState.isGenerating = false;
    }
}

/**
 * Get choreography delay based on trigger type
 * @param {string} trigger - Event type
 * @returns {number} Delay in ms
 */
function getChoreographyDelay(trigger) {
    switch (trigger) {
        case 'diceRoll': return 1500;           // Let dice visual play first
        case 'compartmentOpen': return 1000;     // Let visual settle
        case 'fidgetPattern': return 0;          // React immediately
        case 'vitalsChange': return 500;         // Brief pause
        case 'timeShift': return 0;              // Immediate
        case 'locationChange': return 500;       // Brief
        default: return 500;
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// Wire into awareness events + window events
// ═══════════════════════════════════════════════════════════════

/**
 * Handle compartment open (includes absence detection)
 */
function onCompartmentOpen(data) {
    // Start session tracking on first open
    if (!engineState.compartmentFirstOpened) {
        engineState.compartmentFirstOpened = Date.now();
        engineState.sessionStart = Date.now();
    }
    
    // Check for absence
    if (data?.absence?.minutes >= 30) {
        speak('absence', data, { toast: false });
        return;
    }
    
    // Regular greeting
    speak('compartmentOpen', data, { toast: false });
}

/**
 * Handle dice roll events (special rolls only at low volume)
 */
function onDiceRoll(data) {
    engineState.interactionCount++;
    
    const volume = calculateVolume();
    
    // At low volume, only react to special rolls
    if (volume <= 2 && !data.isSnakeEyes && !data.isBoxcars && !data.isDouble) {
        return;
    }
    
    speak('diceRoll', data);
}

/**
 * Handle fidget pattern detection
 */
function onFidgetPattern(data) {
    // Only speak for significant patterns
    const intensity = data.intensity ?? 0;
    if (intensity < 3 && data.name !== 'calming_down') return;
    
    speak('fidgetPattern', data);
}

/**
 * Handle fidget intervention (always speaks)
 */
function onFidgetIntervention(data) {
    // Interventions bypass volume checks — the ledger MUST speak
    speak('fidgetPattern', {
        name: 'intervention',
        level: data.level,
        intensity: 10
    }, { force: true, voice: data.voice });
}

/**
 * Handle fidget recovery
 */
function onFidgetRecovery(data) {
    speak('fidgetPattern', {
        name: 'calming_down',
        intensity: 0
    }, { voice: 'damaged' });
}

/**
 * Handle vitals change
 */
function onVitalsChange(data) {
    speak('vitalsChange', data, {
        toast: data.isCritical
    });
}

/**
 * Handle location change
 */
function onLocationChange(data) {
    const volume = calculateVolume();
    // Only comment on locations at medium+ volume
    if (volume < 2) return;
    
    speak('locationChange', data);
}

/**
 * Handle time period shift
 */
function onTimeShift(data) {
    // Always react to entering deep night
    if (data.to === 'deep_night') {
        speak('timeShift', data, { toast: true });
        return;
    }
    
    // Otherwise, only sometimes comment
    if (Math.random() > 0.3) return;
    speak('timeShift', data, { toast: true });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the Ledger Voice Engine
 * Call AFTER ledger-awareness.js has been initialized
 */
export function initVoiceEngine() {
    // Reset engine state
    engineState.sessionStart = Date.now();
    engineState.compartmentFirstOpened = null;
    engineState.interactionCount = 0;
    engineState.currentVolume = 0;
    engineState.isGenerating = false;
    engineState.generatedCount = 0;
    engineState.fallbackCount = 0;
    engineState.suppressedCount = 0;
    
    // ═══════════════════════════════════════════════════════════
    // SUBSCRIBE TO AWARENESS EVENTS (via ledger-awareness.js)
    // ═══════════════════════════════════════════════════════════
    
    onAwarenessEvent('compartmentOpen', onCompartmentOpen);
    onAwarenessEvent('vitalsChange', onVitalsChange);
    onAwarenessEvent('locationChange', onLocationChange);
    onAwarenessEvent('timeShift', onTimeShift);
    
    // Awareness fidgetPattern events (from awareness system)
    onAwarenessEvent('fidgetPattern', (data) => {
        // Awareness fidget events have different shape, normalize
        onFidgetPattern({
            name: data.type || data.name || 'rapid',
            intensity: data.intensity ?? data.streak ?? 3
        });
    });
    
    // ═══════════════════════════════════════════════════════════
    // SUBSCRIBE TO WINDOW EVENTS (from other modules)
    // ═══════════════════════════════════════════════════════════
    
    // Dice rolls (from ledger-voices.js)
    window.addEventListener('tribunal:diceRoll', (e) => {
        onDiceRoll(e.detail);
    });
    
    // Fidget patterns (from fidget-patterns.js)
    window.addEventListener('tribunal:fidgetPattern', (e) => {
        onFidgetPattern(e.detail);
    });
    
    // Fidget interventions (from fidget-patterns.js)
    window.addEventListener('tribunal:fidgetIntervention', (e) => {
        onFidgetIntervention(e.detail);
    });
    
    // Fidget recovery (from fidget-patterns.js)
    window.addEventListener('tribunal:fidgetRecovery', (e) => {
        onFidgetRecovery(e.detail);
    });
    
    // Compartment opened (from ledger-template.js subtab handler)
    window.addEventListener('tribunal:compartmentOpened', () => {
        // Don't duplicate — awareness.js also fires this into our onAwarenessEvent handler
        // But if awareness hasn't fired yet, handle it
        if (!engineState.compartmentFirstOpened) {
            engineState.compartmentFirstOpened = Date.now();
        }
    });
    
    console.log('[Voice Engine] ═══════════════════════════════════════');
    console.log('[Voice Engine] The ledger voice engine is listening.');
    console.log('[Voice Engine] Volume: silent → whisper → murmur → voice → insistent → screaming');
    console.log('[Voice Engine] ═══════════════════════════════════════');
    
    return true;
}

// ═══════════════════════════════════════════════════════════════
// DEBUG / EXPORT
// ═══════════════════════════════════════════════════════════════

export function getEngineState() {
    return {
        ...engineState,
        currentVolume: calculateVolume(),
        volumeName: VOLUME_LEVELS[calculateVolume()]?.name,
        timePeriod: getTimePeriod(),
        isDeepNight: isDeepNight()
    };
}

export function debugEngine() {
    const state = getEngineState();
    console.log('[Voice Engine Debug]', state);
    return state;
}

/**
 * Force the engine to speak (for testing)
 * @param {string} trigger - Event type
 * @param {object} data - Event data
 * @param {string} voice - Force specific voice
 */
export function forceSpeak(trigger = 'compartmentOpen', data = {}, voice = null) {
    speak(trigger, data, { force: true, voice });
}

// Window export for debugging
if (typeof window !== 'undefined') {
    window.TribunalVoiceEngine = {
        init: initVoiceEngine,
        getState: getEngineState,
        debug: debugEngine,
        
        // Manual triggers
        speak: forceSpeak,
        testGreeting: () => forceSpeak('compartmentOpen'),
        testDeepNight: () => forceSpeak('compartmentOpen', { isDeepNight: true }),
        testAbsence: (hours = 2) => forceSpeak('compartmentOpen', {
            absence: { minutes: hours * 60, formatted: `${hours} hours` }
        }),
        testDice: (type = 'snakeEyes') => forceSpeak('diceRoll', {
            isSnakeEyes: type === 'snakeEyes',
            isBoxcars: type === 'boxcars',
            isDouble: type === 'doubles',
            die1: type === 'snakeEyes' ? 1 : 6,
            die2: type === 'snakeEyes' ? 1 : 6,
            total: type === 'snakeEyes' ? 2 : 12
        }),
        testFidget: (pattern = 'rapid') => forceSpeak('fidgetPattern', {
            name: pattern,
            intensity: 7
        }),
        testVitals: (critical = false) => forceSpeak('vitalsChange', {
            type: 'health_drop',
            isCritical: critical
        }),
        
        // Stats
        stats: () => ({
            generated: engineState.generatedCount,
            fallbacks: engineState.fallbackCount,
            suppressed: engineState.suppressedCount,
            volume: calculateVolume(),
            interactions: engineState.interactionCount
        })
    };
}

export default {
    initVoiceEngine,
    getEngineState,
    debugEngine,
    forceSpeak,
    speak,
    
    // Re-export for other modules that might need it
    calculateVolume,
    selectVoice,
    VOICE_PERSONAS,
    STATIC_FALLBACKS
};
