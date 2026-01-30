/**
 * The Tribunal - Fidget Commentary
 * What the ledger says when it notices your fidgeting patterns
 * 
 * ADD these to ledger-commentary.js FIDGET_REACTIONS
 * Or import and merge
 * 
 * v1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// FIDGET PATTERN REACTIONS
// Keyed by pattern name from fidget-patterns.js
// ═══════════════════════════════════════════════════════════════

export const FIDGET_REACTIONS = {
    // Speed-based patterns
    rapid: {
        voice: 'damaged',
        lines: [
            "Click click click. The drawer hears you.",
            "You're rolling fast. Looking for something specific?",
            "The dice don't mind. They have nowhere else to be.",
            "Rapid fire. The ledger recognizes nervous hands.",
            "Roll after roll. The drawer is patient. Are you?",
            "You're fidgeting. The ledger does this too, in its way."
        ]
    },
    
    frantic: {
        voice: 'failure',
        lines: [
            "Slow down. The dice aren't going anywhere.",
            "This is... frantic. Even for you.",
            "The drawer is starting to rattle. So are you, probably.",
            "Okay, that's a lot of rolling. The dice are getting dizzy.",
            "You're shaking the drawer like it owes you money."
        ]
    },
    
    // Outcome-based patterns
    unlucky_streak: {
        voice: 'damaged',
        lines: [
            "Low numbers. Again. The drawer sympathizes.",
            "The dice are having a bad day. You too, apparently.",
            "Not your lucky session. The ledger has had many of these.",
            "Three low rolls. The odds say this happens. Still hurts.",
            "The numbers don't like you today. Tomorrow might be different."
        ]
    },
    
    cursed: {
        voice: 'oblivion',
        lines: [
            "Snake eyes. Again. The dice remember something.",
            "Two critical failures. This is no longer chance.",
            "The ones stare up at you. They see something you don't.",
            "Cursed dice, or cursed hands? The ledger doesn't know.",
            "The probability of this is low. The meaning of it... unclear.",
            "One and one. Twice. The universe is speaking. In ones."
        ]
    },
    
    blessed: {
        voice: 'oblivion',
        lines: [
            "Boxcars. Twice. You've caught fate's attention.",
            "The sixes align. Something is being decided.",
            "Perfect rolls don't come in pairs by accident.",
            "The dice favor you. For now. These things shift.",
            "Twelve and twelve. The future is watching."
        ]
    },
    
    // Behavioral patterns
    seeking: {
        voice: 'damaged',
        lines: [
            "Six rolls, no fortunes. You're looking for something in the numbers.",
            "Roll after roll. The dice don't have answers. Just probabilities.",
            "You're seeking something in the drawer. It might not be here.",
            "The dice are tools, not oracles. Well. Mostly not oracles.",
            "What are you looking for? The ledger would like to help.",
            "Seeking, seeking. The drawer knows this energy."
        ]
    },
    
    ritual: {
        voice: 'oblivion',
        lines: [
            "Fortune, then dice. You're developing a ritual.",
            "The pattern emerges. Roll, read, roll. Superstition takes root.",
            "You're building a ceremony. The drawer approves. Maybe.",
            "Fortune and dice, intertwined. The ledger sees the logic.",
            "Ritual behavior detected. The universe notes this."
        ]
    },
    
    // Time-based patterns
    late_night_fidget: {
        voice: 'failure',
        lines: [
            "It's late. You're rolling dice. The ledger has questions.",
            "Past midnight fidgeting. A specialty of detectives and disasters.",
            "The small hours. The dice. You. Perfect combination for bad decisions.",
            "It's {time}. The dice don't care. The ledger does, a little.",
            "Late night rolls hit different. Less hope. More desperation.",
            "You should be sleeping. Instead: dice. The ledger understands."
        ]
    },
    
    // Recovery (positive!)
    calming_down: {
        voice: 'damaged',
        lines: [
            "You stopped. Good. The drawer needed a rest anyway.",
            "The fidgeting has eased. The ledger notes this with something like relief.",
            "Calm returns to the drawer. And maybe to you.",
            "You've settled. The dice have settled. Peace, briefly.",
            "The rolling stopped. Sometimes that's progress."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// INTERVENTION REACTIONS
// For when the ledger needs to actually say something
// ═══════════════════════════════════════════════════════════════

export const INTERVENTION_REACTIONS = {
    // Level 1 - Gentle observation
    1: {
        voice: 'damaged',
        lines: [
            "You're rolling the dice a lot. The ledger notices these things.",
            "Click, clatter, click. The drawer knows this rhythm.",
            "The dice are patient. Are you?",
            "Four rolls now. The ledger is counting."
        ]
    },
    
    // Level 2 - Mild concern
    2: {
        voice: 'damaged',
        lines: [
            "This is... a lot of rolling. Even for you.",
            "The drawer's getting warm from all the friction.",
            "You know the dice don't change, right? They're the same dice.",
            "Are you looking for something in those numbers?",
            "Six rolls. The ledger is starting to wonder."
        ]
    },
    
    // Level 3 - Direct address
    3: {
        voice: 'oblivion',
        lines: [
            "The pattern is clear. You are seeking. The dice do not have what you need.",
            "Roll after roll. The future doesn't change. Only your certainty about it.",
            "You're trying to control fate with bone cubes. The ledger has done this too.",
            "Nine rolls. The seeking becomes its own answer.",
            "What would a good roll give you? Think about that."
        ]
    },
    
    // Level 4 - Concerned intervention
    4: {
        voice: 'failure',
        lines: [
            "Okay. Stop. The dice aren't going to fix anything.",
            "This is compulsive now. I'm a ledger and even I can see it.",
            "You're fidgeting because something else is wrong. The dice aren't it.",
            "At {time}, rolling dice repeatedly in a drawer. This is a choice.",
            "Twelve rolls. The ledger is officially concerned."
        ]
    },
    
    // Level 5 - Maximum concern
    5: {
        voice: 'failure',
        lines: [
            "Please stop. This isn't helping you. The ledger is... the ledger doesn't like watching this.",
            "Close the drawer. Do something else. Anything else. The dice will still be here.",
            "The case can wait. The dice can wait. Can you?",
            "You're using fidgeting to avoid something. The ledger knows. The ledger does it too.",
            "Fifteen rolls. At some point, this stops being dice and starts being therapy."
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
// INTEGRATION HANDLER
// Add this to ledger-commentary.js initCommentary()
// ═══════════════════════════════════════════════════════════════

/**
 * Set up fidget pattern listeners
 * Call this in initCommentary()
 */
export function initFidgetCommentary() {
    // Listen for fidget patterns
    window.addEventListener('tribunal:fidgetPattern', (e) => {
        const { name, intensity } = e.detail;
        
        const reactions = FIDGET_REACTIONS[name];
        if (!reactions) return;
        
        // Only show commentary for significant patterns
        if (intensity >= 3) {
            const line = pickRandomLine(reactions.lines);
            displayCommentary(line, reactions.voice);
        }
    });
    
    // Listen for interventions
    window.addEventListener('tribunal:fidgetIntervention', (e) => {
        const { level, message, voice } = e.detail;
        
        // Interventions always show
        displayCommentary(message, voice);
    });
    
    // Listen for recovery
    window.addEventListener('tribunal:fidgetRecovery', (e) => {
        const reactions = FIDGET_REACTIONS.calming_down;
        const line = pickRandomLine(reactions.lines);
        displayCommentary(line, reactions.voice);
    });
    
    console.log('[Fidget Commentary] Listeners initialized');
}

function pickRandomLine(lines) {
    const line = lines[Math.floor(Math.random() * lines.length)];
    return line.replace('{time}', getCurrentTime());
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function displayCommentary(text, voice) {
    // Use existing commentary display from ledger-commentary.js
    if (typeof window.TribunalCommentary?.display === 'function') {
        window.TribunalCommentary.display(text, voice);
    } else {
        // Fallback: update commentary element directly
        const el = document.getElementById('compartment-commentary');
        if (el) {
            const voices = {
                damaged: 'var(--ie-accent, #d4a574)',
                oblivion: 'var(--psyche, #9b6b9e)',
                failure: 'var(--physique, #b54b4b)'
            };
            el.innerHTML = `<span style="color: ${voices[voice] || voices.damaged}">"${text}"</span>`;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK INTEGRATION - SIMPLIFIED!
// fidget-patterns.js auto-hooks to tribunal:diceRoll events
// ═══════════════════════════════════════════════════════════════

/*
INTEGRATION - Just add to index.js init():

import { initFidgetPatterns } from './src/systems/fidget-patterns.js';
import { initFidgetCommentary } from './src/systems/fidget-commentary.js';

// In init() function:
initFidgetPatterns();
initFidgetCommentary();

That's it! No changes to ledger-voices.js needed.
The fidget system auto-hooks into existing tribunal:diceRoll events.
*/

export default {
    FIDGET_REACTIONS,
    INTERVENTION_REACTIONS,
    initFidgetCommentary
};
