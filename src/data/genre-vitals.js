/**
 * The Tribunal - Genre Vitals Configuration
 * 
 * Labels, icons, and morale keyword triggers per genre theme.
 * 
 * These keywords SUPPLEMENT the base patterns in vitals-extraction.js,
 * they don't replace them. Universal patterns (explicit damage tags,
 * "you get stabbed", etc.) always work. Genre keywords add thematic
 * sensitivity — Romance cares about rejection, Grimdark about despair,
 * Cyberpunk about disconnection.
 * 
 * Genre keywords trigger at severity 1 (soft signal). The base patterns
 * still handle the heavy stuff at severity 2-3.
 * 
 * @module genre-vitals
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULT (used when active genre has no vitals config)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_VITALS = {
    healthLabel: 'HEALTH',
    moraleLabel: 'MORALE',
    healthIcon: 'fa-heart',
    moraleIcon: 'fa-brain',
    crtColor: '#ffb000',           // Amber (classic CRT)
    moraleDamageKeywords: [],
    moraleHealKeywords: []
};

// ═══════════════════════════════════════════════════════════════
// PER-GENRE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export const GENRE_VITALS = {

    // ─────────────────────────────────────────────────────────
    'disco_elysium': {
        healthLabel: 'HEALTH',
        moraleLabel: 'MORALE',
        healthIcon: 'fa-heart',
        moraleIcon: 'fa-brain',
        crtColor: '#ffb000',           // Amber — classic CRT
        moraleDamageKeywords: [
            'failed.*check', 'white.*check', 'your.*pathetic',
            'disgrace.*uniform', 'lost.*badge', 'no.*authority',
            'they.*laugh.*at.*you', 'you.*are.*nothing',
            'bottle.*empty', 'relapse', 'the.*expression'
        ],
        moraleHealKeywords: [
            'passed.*check', 'successful.*check',
            'disco.*inferno', 'hardcore', 'the.*expression.*cracks',
            'badge.*shines', 'kim.*nods', 'kim.*approves',
            'you.*are.*the.*law', 'the.*phasmid'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'romance': {
        healthLabel: 'HEALTH',
        moraleLabel: 'HEARTSTRINGS',
        healthIcon: 'fa-heart',
        moraleIcon: 'fa-heart-crack',
        crtColor: '#ff6b9d',           // Rose — warm, flushed, heartbeat
        moraleDamageKeywords: [
            'rejected', 'ghosted', 'left.*on.*read',
            'they.*didn.t.*text', 'seen.*not.*replied',
            'friend.*zone', 'just.*friends', 'not.*interested',
            'awkward.*silence', 'walked.*away', 'didn.t.*notice',
            'with.*someone.*else', 'moved.*on',
            'butterflies.*died', 'heart.*sinks?', 'ache'
        ],
        moraleHealKeywords: [
            'kissed', 'held.*hands?', 'replied.*instantly',
            'double.*text', 'called.*beautiful', 'called.*handsome',
            'pulled.*close', 'whispered', 'forehead.*kiss',
            'saved.*a.*seat', 'remembered', 'playlist.*for.*you',
            'butterflies', 'pulse.*quicken', 'blush',
            'first.*date', 'love.*confess', 'said.*your.*name'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'noir_detective': {
        healthLabel: 'HEALTH',
        moraleLabel: 'RESOLVE',
        healthIcon: 'fa-heart',
        moraleIcon: 'fa-whiskey-glass',
        crtColor: '#00cc88',           // Cool green — PI's oscilloscope
        moraleDamageKeywords: [
            'dead.*end', 'trail.*cold', 'case.*unsolvable',
            'witness.*recanted', 'evidence.*planted',
            'partner.*betrayed', 'badge.*means.*nothing',
            'city.*doesn.t.*care', 'everyone.*lies',
            'too.*late', 'already.*dead', 'wrong.*all.*along',
            'bottle.*calls', 'the.*dame', 'set.*up'
        ],
        moraleHealKeywords: [
            'lead.*panned.*out', 'the.*case.*breaks',
            'confession', 'caught.*red.*handed',
            'witness.*talked', 'evidence.*holds',
            'justice.*served', 'the.*truth',
            'partner.*came.*through', 'gut.*was.*right',
            'one.*more.*drink', 'cigarette.*glows'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'cyberpunk': {
        healthLabel: 'INTEGRITY',
        moraleLabel: 'SIGNAL',
        healthIcon: 'fa-microchip',
        moraleIcon: 'fa-tower-broadcast',
        crtColor: '#00e5ff',           // Cyan ice — netrunner terminal
        moraleDamageKeywords: [
            'flatlined', 'disconnected', 'signal.*lost',
            'firewall.*breached', 'ICE.*fried', 'bricked',
            'corpo.*owns.*you', 'sold.*out', 'zeroed',
            'glitch(?:ing|ed)?', 'memory.*corrupt',
            'chrome.*rejection', 'cyberpsychosis',
            'humanity.*lost', 'just.*a.*number'
        ],
        moraleHealKeywords: [
            'jacked.*in', 'connected', 'signal.*strong',
            'netrunner.*high', 'clean.*hack', 'daemon.*worked',
            'street.*cred', 'fixer.*impressed', 'eddies.*flow',
            'chrome.*sync', 'upgrade.*installed',
            'off.*the.*grid', 'free.*from.*corpo'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'fantasy': {
        healthLabel: 'VIGOUR',
        moraleLabel: 'SPIRIT',
        healthIcon: 'fa-shield-halved',
        moraleIcon: 'fa-hat-wizard',
        crtColor: '#ffd700',           // Gold — arcane warmth
        moraleDamageKeywords: [
            'curse.*spreads', 'corruption.*grows',
            'oath.*broken', 'dishonored', 'banished',
            'magic.*fails', 'spell.*fizzles', 'mana.*drained',
            'prophecy.*doomed', 'dark.*lord', 'betrayed.*trust',
            'quest.*failed', 'village.*burned', 'fell.*to.*darkness'
        ],
        moraleHealKeywords: [
            'blessing', 'enchanted', 'quest.*complete',
            'oath.*fulfilled', 'magic.*restored',
            'party.*rallies', 'fellowship', 'hearth.*fire',
            'elder.*approves', 'legend.*grows',
            'light.*returns', 'dawn.*breaks', 'tavern.*song'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'space_opera': {
        healthLabel: 'HULL',
        moraleLabel: 'MORALE',
        healthIcon: 'fa-user-astronaut',
        moraleIcon: 'fa-ranking-star',
        crtColor: '#88ccff',           // Blue-white — ship console
        moraleDamageKeywords: [
            'hull.*breach', 'systems.*failing', 'crew.*lost',
            'mayday', 'adrift', 'stranded',
            'court.*martial', 'mutiny', 'dishonorable',
            'colony.*fell', 'signal.*went.*dark',
            'alone.*in.*space', 'oxygen.*low', 'no.*backup'
        ],
        moraleHealKeywords: [
            'crew.*rallies', 'ship.*holds', 'systems.*online',
            'reinforcements', 'hailing.*frequency',
            'mission.*complete', 'commendation',
            'first.*contact', 'the.*stars', 'jump.*successful',
            'crew.*celebrates', 'shore.*leave', 'promoted'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'thriller_horror': {
        healthLabel: 'HEALTH',
        moraleLabel: 'SANITY',
        healthIcon: 'fa-heart',
        moraleIcon: 'fa-eye',
        crtColor: '#ff3333',           // Red — emergency, alarm state
        moraleDamageKeywords: [
            'sanity.*slip', 'losing.*grip', 'can.t.*be.*real',
            'hallucinating', 'the.*walls', 'whispers',
            'something.*watching', 'door.*opened.*itself',
            'it.*knows', 'no.*escape', 'trapped',
            'alone.*in.*the.*dark', 'footsteps.*behind',
            'shouldn.t.*exist', 'impossible', 'mind.*fractur'
        ],
        moraleHealKeywords: [
            'safe.*room', 'barricaded', 'found.*the.*exit',
            'sun.*rose', 'daylight', 'it.s.*over',
            'rational.*explanation', 'just.*a.*dream',
            'someone.*else.*is.*here', 'not.*alone',
            'weapon.*found', 'power.*restored', 'door.*locked'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'post_apocalyptic': {
        healthLabel: 'VITALS',
        moraleLabel: 'WILL',
        healthIcon: 'fa-biohazard',
        moraleIcon: 'fa-fire',
        crtColor: '#b8cc00',           // Sickly yellow-green — Geiger counter
        moraleDamageKeywords: [
            'rations.*gone', 'water.*contaminated',
            'settlement.*fell', 'raiders', 'overrun',
            'radiation.*sick', 'infected', 'mutated',
            'alone.*in.*the.*waste', 'no.*shelter',
            'caravan.*destroyed', 'they.*didn.t.*make.*it',
            'nothing.*left', 'why.*bother'
        ],
        moraleHealKeywords: [
            'found.*supplies', 'clean.*water', 'safe.*haven',
            'settlement.*thriving', 'crops.*growing',
            'survivor.*found', 'not.*alone', 'campfire',
            'radio.*signal', 'trade.*caravan',
            'rebuilt', 'community', 'worth.*fighting.*for'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'grimdark': {
        healthLabel: 'FLESH',
        moraleLabel: 'RESOLVE',
        healthIcon: 'fa-skull',
        moraleIcon: 'fa-hand-fist',
        crtColor: '#66ccbb',           // Spectral teal — soul energy, necromancer flame
        moraleDamageKeywords: [
            'meaningless', 'futile', 'for.*nothing',
            'no.*gods', 'abandoned', 'betrayed.*again',
            'the.*rot', 'corruption', 'innocence.*lost',
            'mercy.*is.*weakness', 'everyone.*dies',
            'the.*pit', 'no.*redemption', 'you.*are.*no.*hero'
        ],
        moraleHealKeywords: [
            'spite', 'defiance', 'refused.*to.*kneel',
            'got.*back.*up', 'teeth.*bared', 'still.*standing',
            'scars.*remind', 'earned.*in.*blood',
            'they.*feared.*you', 'grudging.*respect',
            'bitter.*laugh', 'one.*more.*fight', 'not.*today'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'slice_of_life': {
        healthLabel: 'ENERGY',
        moraleLabel: 'VIBES',
        healthIcon: 'fa-mug-hot',
        moraleIcon: 'fa-face-smile-beam',
        crtColor: '#66ddcc',           // Soft teal — lo-fi, cozy
        moraleDamageKeywords: [
            'awkward.*silence', 'embarrassed', 'cringe',
            'plans.*cancelled', 'stood.*up', 'forgotten',
            'bad.*review', 'deadline.*missed', 'overslept',
            'burned.*dinner', 'lost.*keys', 'traffic',
            'low.*battery', 'rained.*on.*parade', 'monday'
        ],
        moraleHealKeywords: [
            'perfect.*coffee', 'good.*morning', 'sunny',
            'new.*recipe', 'cozy', 'blanket',
            'friend.*called', 'surprise.*visit', 'compliment',
            'found.*parking', 'friday', 'weekend',
            'cat.*purring', 'dog.*tail.*wag', 'small.*win',
            'golden.*hour', 'playlist.*hits'
        ]
    },

    // ─────────────────────────────────────────────────────────
    'generic': {
        healthLabel: 'HEALTH',
        moraleLabel: 'MORALE',
        healthIcon: 'fa-heart',
        moraleIcon: 'fa-brain',
        crtColor: '#ffb000',           // Amber — default
        moraleDamageKeywords: [],
        moraleHealKeywords: []
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get vitals config for the active genre
 * @param {string} genreId - Genre profile ID
 * @returns {object} Vitals config (falls back to DEFAULT_VITALS)
 */
export function getGenreVitals(genreId) {
    return GENRE_VITALS[genreId] || DEFAULT_VITALS;
}

/**
 * Build regex patterns from genre keyword arrays
 * @param {string[]} keywords - Array of regex-safe keyword strings
 * @returns {RegExp[]} Array of compiled regex patterns
 */
export function buildGenrePatterns(keywords) {
    if (!keywords || keywords.length === 0) return [];
    
    return keywords.map(kw => {
        try {
            return new RegExp(`\\b(?:${kw})\\b`, 'gi');
        } catch (e) {
            console.warn('[GenreVitals] Bad keyword pattern:', kw, e.message);
            return null;
        }
    }).filter(Boolean);
}
