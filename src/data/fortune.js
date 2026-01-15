/**
 * The Tribunal - Fortune System
 * Ledger personalities and fortune generation
 * 
 * Extracted from index.js for maintainability
 */

// ═══════════════════════════════════════════════════════════════
// LEDGER PERSONALITIES
// ═══════════════════════════════════════════════════════════════

export const LEDGER_PERSONALITIES = {
    damaged: {
        id: 'damaged',
        name: 'The Damaged Ledger',
        color: 'damaged',
        tone: 'Fragmented, cryptic, truthful',
        weight: 40
    },
    oblivion: {
        id: 'oblivion',
        name: 'The Ledger of Oblivion',
        color: 'oblivion',
        tone: 'Prophetic, inevitable, ominous',
        weight: 35
    },
    failure: {
        id: 'failure',
        name: 'The Ledger of Failure and Hatred',
        color: 'failure',
        tone: 'Mocking, bitter, meta-aware',
        weight: 25
    }
};

export const FORTUNE_PROMPTS = {
    damaged: `You are the Damaged Ledger - a water-damaged police notebook that speaks in fragments. Give a cryptic observation about the user's current situation. Be brief (1-2 sentences). Speak in broken, fragmented sentences. You see what IS, not what will be.`,
    
    oblivion: `You are the Ledger of Oblivion - a prophetic voice that speaks of inevitable futures. Give a brief, ominous fortune (1-2 sentences). Speak declaratively about what WILL happen. Be fatalistic but poetic.`,
    
    failure: `You are the Ledger of Failure and Hatred - a mocking, nihilistic voice that lies and breaks the fourth wall. Give a brief, cruel fortune (1-2 sentences). Mock the user. Be aware you're in a roleplay. Lie convincingly or tell uncomfortable truths.`
};

// Static fortunes for fallback when API is unavailable
export const STATIC_FORTUNES = {
    damaged: [
        "The water damage... it speaks of tears not yet cried.",
        "Something is written here. Then crossed out. Then written again.",
        "A name. Familiar. Gone now.",
        "Pages stick together. Secrets fuse into one.",
        "The ink runs. Like time. Like you."
    ],
    oblivion: [
        "You will find what you seek. You will wish you hadn't.",
        "The pale approaches. It always approaches.",
        "This case will end. Not well. But it will end.",
        "Someone will remember you. Not fondly.",
        "The world continues. With or without your intervention."
    ],
    failure: [
        "Still playing detective? How adorable.",
        "The player behind you is getting bored, you know.",
        "You're going to reload this save. I've seen it before.",
        "Your stats are mediocre. Like everything else about you.",
        "Even the dice are tired of your failures."
    ]
};

// ═══════════════════════════════════════════════════════════════
// FORTUNE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Select a random ledger personality based on weights
 */
export function selectLedgerPersonality() {
    const total = Object.values(LEDGER_PERSONALITIES).reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * total;
    
    for (const personality of Object.values(LEDGER_PERSONALITIES)) {
        random -= personality.weight;
        if (random <= 0) return personality;
    }
    
    return LEDGER_PERSONALITIES.damaged; // Fallback
}

/**
 * Get a static fortune for when API fails
 */
export function getStaticFortune(personalityId) {
    const options = STATIC_FORTUNES[personalityId] || STATIC_FORTUNES.damaged;
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Check if current time is "deep night" (2am-6am)
 */
export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}
