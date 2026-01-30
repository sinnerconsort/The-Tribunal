/**
 * The Tribunal - Ledger Commentary System
 * Batch 2: The ledger SPEAKS
 * 
 * Contextual commentary based on:
 * - Time of day (greetings)
 * - Absence duration (you were gone...)
 * - Fidget patterns (nervous rolling)
 * - RP events (vitals, location)
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

import { LEDGER_VOICES } from './ledger-voices.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    showToasts: true,           // Show toasts for reactions
    updateCompartment: true,    // Update compartment commentary
    toastDuration: 5000,        // Default toast duration
    longToastDuration: 8000,    // For deeper night / special moments
};

// ═══════════════════════════════════════════════════════════════
// TIME-BASED GREETINGS
// When you open the compartment
// ═══════════════════════════════════════════════════════════════

const TIME_GREETINGS = {
    morning: {
        voice: 'damaged',
        lines: [
            "Morning. The cases are still here. So are you.",
            "A new day. The ledger doesn't feel different. Does anything?",
            "You're up early. Or late. The ledger doesn't judge. (It judges.)",
            "Morning light through the window. The drawer stays dark.",
            "Coffee would help. The ledger can't make coffee. It can only watch."
        ]
    },
    afternoon: {
        voice: 'damaged',
        lines: [
            "Afternoon. The investigation continues. Probably.",
            "Half the day gone. Half the cases unsolved. Math.",
            "The sun is high. Your standards are... adjustable.",
            "Midday. A reasonable hour to consult a drawer. Relatively.",
            "You're back. The ledger noticed. It always notices."
        ]
    },
    evening: {
        voice: 'damaged',
        lines: [
            "Evening. The city darkens. So do the cases.",
            "The day winds down. Your problems don't.",
            "Sunset soon. The drawer doesn't care about sunsets.",
            "Evening hours. When the real work happens. Or doesn't.",
            "The light fades. The ledger remains. Constant. Patient."
        ]
    },
    late_night: {
        voice: 'oblivion',
        lines: [
            "Late. The hour when truths surface.",
            "The night deepens. So do you.",
            "Most people sleep now. You're not most people.",
            "Late hours. When the ledger's voice grows clearer.",
            "The night has you. It won't let go easily."
        ]
    },
    deep_night: {
        voice: 'failure',
        lines: [
            "It's {time}. You're consulting a drawer. We both made choices.",
            "The witching hours. When normal people sleep. You're here.",
            "Why are you awake? ...Why am I? We're both cursed.",
            "{time}. This isn't dedication. This is a cry for help.",
            "Deep night. The hour when the ledger stops pretending to be kind.",
            "You should sleep. You won't. I know you. I AM you, in a way.",
            "At {time}, the barrier between detective and disaster is... thin."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// ABSENCE REACTIONS
// When you've been gone a while
// ═══════════════════════════════════════════════════════════════

const ABSENCE_REACTIONS = {
    short: {  // 30-60 minutes
        voice: 'damaged',
        lines: [
            "You were gone. Not long. Long enough.",
            "Back already? The cases haven't solved themselves.",
            "A brief absence. The ledger barely noticed. (It noticed.)",
            "You left. You returned. The cycle continues."
        ]
    },
    medium: {  // 1-4 hours
        voice: 'damaged',
        lines: [
            "You were gone {duration}. The cases waited. They're patient.",
            "{duration} away. Did you find answers out there? ...No?",
            "The drawer sat in darkness for {duration}. It's used to it.",
            "You've been gone {duration}. The ledger counted. It has nothing else to do.",
            "{duration} of silence. The pages didn't turn themselves."
        ]
    },
    long: {  // 4-12 hours
        voice: 'oblivion',
        lines: [
            "{duration}. The cases grew cold. Colder.",
            "You were gone {duration}. Time moves differently in the drawer.",
            "{duration} of absence. The ledger waited. It always waits.",
            "Gone {duration}. The investigation paused. Did you?",
            "{duration}. Long enough to forget. Not long enough to heal."
        ]
    },
    veryLong: {  // 12+ hours
        voice: 'failure',
        lines: [
            "{duration}. Did you think the cases would solve themselves?",
            "Gone {duration}. The ledger doesn't judge. That's a lie. It judges.",
            "{duration} away. What's your excuse? ...The ledger doesn't care.",
            "You abandoned the drawer for {duration}. It noticed. It always notices.",
            "{duration}. The dust settled. Then you disturbed it. Again."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// FIDGET PATTERN REACTIONS
// When you're rolling dice nervously
// ═══════════════════════════════════════════════════════════════

const FIDGET_REACTIONS = {
    rapid: {
        voice: 'damaged',
        lines: [
            "Rolling won't change the numbers. You know this.",
            "The dice don't care about your anxiety. Neither do the cases.",
            "Faster rolling. Same odds. The math doesn't bend for desperation.",
            "You're fidgeting. The ledger recognizes the pattern.",
            "Roll after roll. Looking for something. Finding bone and plastic.",
            "The dice are tools, not oracles. But you keep asking."
        ]
    },
    compulsive: {  // 5+ rapid rolls
        voice: 'failure',
        lines: [
            "This is compulsive now. The ledger sees you.",
            "Still rolling? The dice are tired. You should be too.",
            "At some point, fidgeting becomes philosophy. This isn't that point.",
            "The definition of insanity, they say. Same roll, different hopes.",
            "You can't roll your way out of this. Trust me. I've watched you try."
        ]
    },
    unlucky_streak: {
        voice: 'oblivion',
        lines: [
            "The dice remember. They don't forgive.",
            "A pattern emerges. Not a kind one.",
            "Some nights, the numbers simply... refuse.",
            "Luck has left the drawer. For now.",
            "The dice have spoken. They said 'no.' Repeatedly."
        ]
    },
    cursed: {  // Multiple snake eyes
        voice: 'failure',
        lines: [
            "Snake eyes again. The universe has opinions about you.",
            "The dice are cursed. Or you are. Same difference.",
            "Multiple ones. At this point, it's personal.",
            "The lowest numbers, over and over. The ledger is impressed. Grimly.",
            "You've angered something. The dice are just the messenger."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// VITALS REACTIONS
// When health/morale drops
// ═══════════════════════════════════════════════════════════════

const VITALS_REACTIONS = {
    health_drop: {
        voice: 'damaged',
        lines: [
            "Your body protests. The ledger notes it.",
            "Health declining. The cases don't care. The ledger does. Slightly.",
            "You're hurting. The drawer can't help. It can only witness.",
            "Physical damage. Add it to the file."
        ]
    },
    morale_drop: {
        voice: 'damaged',
        lines: [
            "Morale falters. The ledger understands.",
            "Your spirit wavers. The cases remain, indifferent.",
            "Something broke inside. The ledger feels it too. Somehow.",
            "Willpower draining. The drawer has seen this before."
        ]
    },
    critical: {
        voice: 'oblivion',
        lines: [
            "You're fading. The ledger watches. Helpless.",
            "Critical. The word hangs in the drawer's darkness.",
            "On the edge now. The cases won't matter if you fall.",
            "Barely holding on. The ledger holds its breath. (It has no breath.)"
        ]
    },
    health_critical: {
        voice: 'failure',
        lines: [
            "Your body is failing. The dice can't help you now.",
            "Physical collapse imminent. The ledger documents. That's all it can do.",
            "You're dying. Slowly or quickly, the ledger doesn't know. It just watches."
        ]
    },
    morale_critical: {
        voice: 'failure', 
        lines: [
            "Your will is breaking. The ledger has seen this ending.",
            "Spiritual collapse. The drawer grows heavier.",
            "You're giving up. The cases will outlive your determination."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// LOCATION CHANGE REACTIONS
// When you move somewhere new
// ═══════════════════════════════════════════════════════════════

const LOCATION_REACTIONS = {
    voice: 'damaged',
    lines: [
        "New location: {location}. The ledger updates.",
        "You've moved to {location}. The cases follow.",
        "{location}. Another place. Another set of problems.",
        "Location change noted. {location}. The drawer remembers.",
        "From one place to another. {location}. The investigation continues."
    ],
    // Special location-based reactions
    special: {
        'whirling': [
            "The Whirling. Where it all began. Or ended.",
            "Back at the Whirling. The ledger remembers the smell. Alcohol and regret."
        ],
        'hotel': [
            "A hotel. Temporary. Like everything.",
            "Hotel room. The ledger has spent too many nights in places like this."
        ],
        'precinct': [
            "The precinct. Home. Sort of.",
            "Back at the station. The cases are here. So are the answers. Maybe."
        ],
        'crime scene': [
            "Crime scene. Where truth lives. Bleeding.",
            "The scene of the crime. The ledger pays attention here."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// TIME SHIFT REACTIONS
// When the time period changes while you're using the extension
// ═══════════════════════════════════════════════════════════════

const TIME_SHIFT_REACTIONS = {
    to_deep_night: {
        voice: 'oblivion',
        lines: [
            "The deep hours begin. The ledger's voice changes.",
            "2 AM. The boundary between days blurs.",
            "Welcome to the witching hours. The ledger has been waiting."
        ]
    },
    to_morning: {
        voice: 'damaged',
        lines: [
            "Dawn approaches. You survived another night.",
            "Morning comes. You're still here. Still working.",
            "The sun rises. The cases don't care, but you might."
        ]
    },
    generic: {
        voice: 'damaged',
        lines: [
            "Time passes. The ledger notes the shift.",
            "Another hour. Another period. The investigation continues.",
            "The clock moves. Do you?"
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current time formatted for display
 */
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

/**
 * Pick a random line from an array
 */
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replace placeholders in text
 */
function fillTemplate(text, data = {}) {
    let result = text;
    result = result.replace('{time}', data.time || getCurrentTime());
    result = result.replace('{duration}', data.duration || 'some time');
    result = result.replace('{location}', data.location || 'somewhere');
    return result;
}

/**
 * Get voice data by key
 */
function getVoice(voiceKey) {
    return LEDGER_VOICES[voiceKey] || LEDGER_VOICES.damaged;
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Show a ledger commentary toast
 */
function showCommentaryToast(text, voiceKey, duration = CONFIG.toastDuration) {
    if (!CONFIG.showToasts) return;
    
    const voice = getVoice(voiceKey);
    
    // Try to use SillyTavern's toastr
    if (typeof toastr !== 'undefined') {
        // Use info style but with custom styling via voice name
        toastr.info(
            `<span style="color: ${voice.color}">"${text}"</span>`,
            voice.name,
            { 
                timeOut: duration,
                escapeHtml: false,
                positionClass: 'toast-bottom-right'
            }
        );
    } else {
        // Fallback: log to console
        console.log(`[${voice.name}] "${text}"`);
    }
}

/**
 * Update the compartment commentary text
 */
function updateCompartmentCommentary(text, voiceKey) {
    if (!CONFIG.updateCompartment) return;
    
    const voice = getVoice(voiceKey);
    const el = document.getElementById('compartment-commentary');
    
    if (el) {
        el.innerHTML = `<span style="color: ${voice.color}">"${text}"</span>`;
    }
}

/**
 * Show commentary (both toast and compartment)
 */
function showCommentary(text, voiceKey, options = {}) {
    const finalText = fillTemplate(text, options.data || {});
    const duration = options.duration || CONFIG.toastDuration;
    
    if (options.toast !== false) {
        showCommentaryToast(finalText, voiceKey, duration);
    }
    
    if (options.compartment !== false) {
        updateCompartmentCommentary(finalText, voiceKey);
    }
    
    console.log(`[Ledger Commentary] ${voiceKey}: "${finalText}"`);
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle compartment open event
 */
function onCompartmentOpen(data) {
    const period = data.timePeriod || getTimePeriod();
    const greetings = TIME_GREETINGS[period] || TIME_GREETINGS.afternoon;
    
    // Check for absence first
    if (data.absence && data.absence.minutes >= 30) {
        handleAbsence(data.absence);
        return; // Don't double-comment
    }
    
    // Otherwise, time-based greeting
    const line = pickRandom(greetings.lines);
    const duration = data.isDeepNight ? CONFIG.longToastDuration : CONFIG.toastDuration;
    
    showCommentary(line, greetings.voice, { 
        duration,
        data: { time: getCurrentTime() }
    });
}

/**
 * Handle absence detection
 */
function handleAbsence(absence) {
    let category;
    
    if (absence.minutes < 60) {
        category = ABSENCE_REACTIONS.short;
    } else if (absence.minutes < 240) {
        category = ABSENCE_REACTIONS.medium;
    } else if (absence.minutes < 720) {
        category = ABSENCE_REACTIONS.long;
    } else {
        category = ABSENCE_REACTIONS.veryLong;
    }
    
    const line = pickRandom(category.lines);
    showCommentary(line, category.voice, {
        duration: CONFIG.longToastDuration,
        data: { duration: absence.formatted }
    });
}

/**
 * Handle fidget pattern detection
 */
function onFidgetPattern(data) {
    let reactions;
    
    switch (data.type) {
        case 'rapid':
            reactions = data.intensity >= 5 
                ? FIDGET_REACTIONS.compulsive 
                : FIDGET_REACTIONS.rapid;
            break;
        case 'unlucky_streak':
            reactions = FIDGET_REACTIONS.unlucky_streak;
            break;
        case 'cursed':
            reactions = FIDGET_REACTIONS.cursed;
            break;
        default:
            return; // No reaction needed
    }
    
    const line = pickRandom(reactions.lines);
    showCommentary(line, reactions.voice);
}

/**
 * Handle vitals change
 */
function onVitalsChange(data) {
    let reactions;
    
    if (data.isCritical) {
        if (data.type === 'health_drop') {
            reactions = VITALS_REACTIONS.health_critical;
        } else if (data.type === 'morale_drop') {
            reactions = VITALS_REACTIONS.morale_critical;
        } else {
            reactions = VITALS_REACTIONS.critical;
        }
    } else {
        reactions = VITALS_REACTIONS[data.type] || VITALS_REACTIONS.health_drop;
    }
    
    const line = pickRandom(reactions.lines);
    showCommentary(line, reactions.voice, {
        duration: data.isCritical ? CONFIG.longToastDuration : CONFIG.toastDuration
    });
}

/**
 * Handle location change
 */
function onLocationChange(data) {
    const locationName = typeof data === 'string' ? data : (data.name || data.to || 'unknown');
    const locationLower = locationName.toLowerCase();
    
    // Check for special locations
    for (const [key, lines] of Object.entries(LOCATION_REACTIONS.special)) {
        if (locationLower.includes(key)) {
            const line = pickRandom(lines);
            showCommentary(line, LOCATION_REACTIONS.voice);
            return;
        }
    }
    
    // Generic location reaction
    const line = pickRandom(LOCATION_REACTIONS.lines);
    showCommentary(line, LOCATION_REACTIONS.voice, {
        data: { location: locationName }
    });
}

/**
 * Handle time period shift
 */
function onTimeShift(data) {
    let reactions;
    
    if (data.to === 'deep_night') {
        reactions = TIME_SHIFT_REACTIONS.to_deep_night;
    } else if (data.to === 'morning' && (data.from === 'deep_night' || data.from === 'late_night')) {
        reactions = TIME_SHIFT_REACTIONS.to_morning;
    } else {
        // Only occasionally comment on generic shifts
        if (Math.random() > 0.3) return;
        reactions = TIME_SHIFT_REACTIONS.generic;
    }
    
    const line = pickRandom(reactions.lines);
    showCommentary(line, reactions.voice, {
        toast: true,
        compartment: false // Don't update compartment for time shifts
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize commentary system
 * Subscribes to awareness events
 */
export function initCommentary() {
    // Compartment opened (includes absence check)
    onAwarenessEvent('compartmentOpen', onCompartmentOpen);
    
    // Fidget patterns
    onAwarenessEvent('fidgetPattern', onFidgetPattern);
    
    // Vitals changes
    onAwarenessEvent('vitalsChange', onVitalsChange);
    
    // Location changes
    onAwarenessEvent('locationChange', onLocationChange);
    
    // Time period shifts
    onAwarenessEvent('timeShift', onTimeShift);
    
    console.log('[Ledger Commentary] Initialized - The ledger is listening');
}

/**
 * Manually trigger a commentary (for testing)
 */
export function triggerCommentary(type, data = {}) {
    switch (type) {
        case 'greeting':
            onCompartmentOpen({ timePeriod: getTimePeriod(), ...data });
            break;
        case 'absence':
            handleAbsence(data);
            break;
        case 'fidget':
            onFidgetPattern(data);
            break;
        case 'vitals':
            onVitalsChange(data);
            break;
        case 'location':
            onLocationChange(data);
            break;
        case 'timeShift':
            onTimeShift(data);
            break;
        default:
            console.log('[Ledger Commentary] Unknown trigger type:', type);
    }
}

// ═══════════════════════════════════════════════════════════════
// DEBUG EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalCommentary = {
        init: initCommentary,
        trigger: triggerCommentary,
        
        // Test specific scenarios
        testGreeting: () => triggerCommentary('greeting'),
        testDeepNight: () => triggerCommentary('greeting', { timePeriod: 'deep_night', isDeepNight: true }),
        testAbsence: (hours = 2) => triggerCommentary('absence', { 
            minutes: hours * 60, 
            formatted: `${hours} hours` 
        }),
        testFidget: (type = 'rapid') => triggerCommentary('fidget', { type, intensity: 5 }),
        testVitals: (critical = false) => triggerCommentary('vitals', { 
            type: 'health_drop', 
            isCritical: critical 
        }),
        testLocation: (loc = 'The Whirling-in-Rags') => triggerCommentary('location', loc),
        
        // Config
        config: CONFIG
    };
}

export default {
    initCommentary,
    triggerCommentary,
    showCommentary,
    CONFIG
};
