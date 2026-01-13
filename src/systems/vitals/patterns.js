/**
 * The Tribunal - Vitals Detection Patterns
 * Keyword dictionaries and severity mappings for auto-detecting health/morale changes
 * Phase 2 Implementation
 */

// ═══════════════════════════════════════════════════════════════
// HEALTH KEYWORDS
// ═══════════════════════════════════════════════════════════════

export const HEALTH_DAMAGE_KEYWORDS = {
    // Physical impact - minor
    minor: [
        'scratched', 'scraped', 'bruised', 'bumped', 'grazed',
        'nicked', 'scuffed', 'stung', 'pinched', 'stubbed'
    ],
    
    // Physical impact - moderate (default)
    moderate: [
        'hurt', 'wounded', 'injured', 'bleeding', 'cut',
        'punched', 'kicked', 'struck', 'hit', 'slapped',
        'burned', 'scalded', 'twisted', 'sprained', 'pulled',
        'bitten', 'clawed', 'headache', 'aching', 'throbbing'
    ],
    
    // Physical impact - major
    major: [
        'badly hurt', 'severely wounded', 'heavily injured',
        'broken bone', 'fractured', 'dislocated', 'concussion',
        'deep cut', 'gash', 'laceration', 'torn', 'shattered',
        'crushed', 'smashed', 'battered', 'mauled'
    ],
    
    // Physical impact - critical
    critical: [
        'collapsed', 'unconscious', 'dying', 'critical condition',
        'mortally wounded', 'fatal', 'life-threatening',
        'hemorrhaging', 'internal bleeding', 'comatose',
        'flatlined', 'stopped breathing', 'no pulse'
    ]
};

export const HEALTH_RESTORE_KEYWORDS = {
    minor: [
        'feels better', 'easing', 'subsiding', 'fading pain',
        'catching breath', 'steadying'
    ],
    
    moderate: [
        'healed', 'bandaged', 'treated', 'mended', 'patched up',
        'recovered', 'rested', 'restored', 'tended to',
        'stitched', 'splinted', 'medicated'
    ],
    
    major: [
        'fully healed', 'completely recovered', 'good as new',
        'miraculously healed', 'wounds closed', 'bones set'
    ],
    
    critical: [
        'brought back', 'resuscitated', 'revived', 'stabilized',
        'pulled from death', 'saved your life'
    ]
};

// ═══════════════════════════════════════════════════════════════
// MORALE KEYWORDS
// ═══════════════════════════════════════════════════════════════

export const MORALE_DAMAGE_KEYWORDS = {
    minor: [
        'annoyed', 'irritated', 'frustrated', 'bothered',
        'uncomfortable', 'uneasy', 'awkward', 'flustered',
        'embarrassed', 'self-conscious'
    ],
    
    moderate: [
        'demoralized', 'discouraged', 'disheartened', 'dejected',
        'humiliated', 'ashamed', 'guilty', 'regretful',
        'failed', 'disappointed', 'rejected', 'dismissed',
        'insulted', 'mocked', 'ridiculed', 'belittled',
        'anxious', 'worried', 'stressed', 'overwhelmed'
    ],
    
    major: [
        'crushed', 'devastated', 'heartbroken', 'shattered',
        'deeply ashamed', 'utterly humiliated', 'traumatized',
        'broken spirit', 'lost all hope', 'complete failure',
        'publicly shamed', 'betrayed', 'abandoned'
    ],
    
    critical: [
        'hopeless', 'despairing', 'suicidal ideation', 'given up',
        'completely broken', 'soul crushed', 'will to live',
        'existential crisis', 'total collapse', 'mental breakdown'
    ]
};

export const MORALE_RESTORE_KEYWORDS = {
    minor: [
        'relieved', 'calmer', 'steadier', 'reassured',
        'slightly better', 'less anxious', 'breathing easier'
    ],
    
    moderate: [
        'encouraged', 'inspired', 'motivated', 'confident',
        'proud', 'validated', 'appreciated', 'respected',
        'comforted', 'supported', 'understood', 'accepted',
        'succeeded', 'accomplished', 'praised', 'complimented',
        'hopeful', 'optimistic', 'determined'
    ],
    
    major: [
        'elated', 'triumphant', 'victorious', 'euphoric',
        'deeply moved', 'profoundly grateful', 'breakthrough',
        'overcame', 'conquered fears', 'found purpose',
        'redemption', 'forgiven', 'reconciled'
    ],
    
    critical: [
        'transformed', 'rebirth', 'new lease on life',
        'found meaning', 'spiritual awakening', 'revelation',
        'complete turnaround', 'saved soul'
    ]
};

// ═══════════════════════════════════════════════════════════════
// SEVERITY MAPPINGS
// ═══════════════════════════════════════════════════════════════

export const SEVERITY_VALUES = {
    minor: 5,
    moderate: 15,
    major: 30,
    critical: 50
};

// Sensitivity multipliers - adjust detection thresholds
export const SENSITIVITY_MULTIPLIERS = {
    low: 0.5,      // Halve the effect, require more explicit language
    medium: 1.0,   // Default
    high: 1.5      // Increase sensitivity, catch more subtle language
};

// ═══════════════════════════════════════════════════════════════
// CONTEXT PATTERNS
// ═══════════════════════════════════════════════════════════════

// Words that indicate the protagonist is the subject
export const PROTAGONIST_INDICATORS = [
    'you', 'your', 'yourself', "you're", "you've", "you'd",
    'i', 'me', 'my', 'myself', "i'm", "i've", "i'd"
];

// Words that negate the meaning (e.g., "you didn't get hurt")
export const NEGATION_WORDS = [
    'not', "n't", 'never', 'no', 'none', 'neither',
    'barely', 'hardly', 'almost', 'nearly', 'narrowly',
    'avoided', 'dodged', 'missed', 'escaped', 'evaded'
];

// Patterns that indicate dialogue (should be ignored)
export const DIALOGUE_PATTERNS = [
    /[""][^""]*[""]/g,           // Quoted speech
    /[''][^'']*['']/g,           // Single-quoted speech
    /\*[^*]+\*/g,                // Asterisk actions (sometimes dialogue)
    /said|says|replied|asked/gi  // Dialogue tags
];

// Past tense indicators (more likely to be narrative, not hypothetical)
export const PAST_TENSE_INDICATORS = [
    'was', 'were', 'had', 'got', 'became', 'felt',
    'took', 'received', 'suffered', 'experienced'
];

// ═══════════════════════════════════════════════════════════════
// COMPOUND PHRASES (multi-word patterns)
// ═══════════════════════════════════════════════════════════════

// These override single-word detection for more accuracy
export const COMPOUND_HEALTH_DAMAGE = {
    'knocked out': 'major',
    'passed out': 'major',
    'black out': 'major',
    'blacked out': 'major',
    'lost consciousness': 'major',
    'doubled over': 'moderate',
    'fell down': 'minor',
    'tripped': 'minor',
    'took a hit': 'moderate',
    'took damage': 'moderate',
    'got hurt': 'moderate',
    'in pain': 'moderate',
    'bleeding out': 'critical',
    'life draining': 'critical',
    'at death\'s door': 'critical'
};

export const COMPOUND_MORALE_DAMAGE = {
    'lost hope': 'major',
    'gave up': 'major',
    'broke down': 'major',
    'fell apart': 'major',
    'lost it': 'moderate',
    'snapped at': 'moderate',
    'lashed out': 'moderate',
    'felt stupid': 'minor',
    'felt foolish': 'minor',
    'made a fool': 'moderate',
    'looked stupid': 'moderate',
    'wants to die': 'critical',
    'wished for death': 'critical',
    'couldn\'t go on': 'critical'
};

export const COMPOUND_HEALTH_RESTORE = {
    'patched up': 'moderate',
    'good as new': 'major',
    'back on feet': 'moderate',
    'feeling better': 'minor',
    'pain subsided': 'minor',
    'wounds healed': 'major',
    'fully recovered': 'major',
    'stabilized': 'critical'
};

export const COMPOUND_MORALE_RESTORE = {
    'felt proud': 'moderate',
    'spirits lifted': 'moderate',
    'weight lifted': 'moderate',
    'found hope': 'major',
    'found strength': 'major',
    'pulled together': 'moderate',
    'got it together': 'moderate',
    'felt confident': 'moderate',
    'believed in': 'moderate',
    'new perspective': 'major',
    'turned around': 'major'
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get all keywords flat
// ═══════════════════════════════════════════════════════════════

export function getAllKeywords(keywordObj) {
    const all = [];
    for (const severity of Object.keys(keywordObj)) {
        all.push(...keywordObj[severity]);
    }
    return all;
}

export function getSeverityForKeyword(keyword, keywordObj) {
    for (const [severity, keywords] of Object.entries(keywordObj)) {
        if (keywords.includes(keyword.toLowerCase())) {
            return severity;
        }
    }
    return null;
}
