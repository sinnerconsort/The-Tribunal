/**
 * The Tribunal - Contact Intelligence System
 * NPC Detection, Trait Extraction, Voice Opinion Tracking
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  DEFENSIVE BUILD - Every function guards itself, fully async             ║
 * ║  This module can NEVER break voice generation - it's a bonus feature     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * Deploy AFTER voice-affinities.js is confirmed working
 */

// ═══════════════════════════════════════════════════════════════
// LAZY IMPORTS - Defensive loading with full error isolation
// ═══════════════════════════════════════════════════════════════

let _persistence = null;
let _affinities = null;
let _initPromise = null;
let _initialized = false;

/**
 * Initialize all dependencies ONCE
 * Safe to call multiple times - will only run once
 */
async function ensureInitialized() {
    // Already done
    if (_initialized) return true;
    
    // In progress - wait for it
    if (_initPromise) return _initPromise;
    
    // Start initialization
    _initPromise = (async () => {
        try {
            // Load persistence
            try {
                _persistence = await import('../core/persistence.js');
                console.log('[Contact Intelligence] Persistence loaded');
            } catch (e) {
                console.warn('[Contact Intelligence] Persistence unavailable:', e.message);
                _persistence = null;
            }
            
            // Load affinities
            try {
                _affinities = await import('../data/voice-affinities.js');
                console.log('[Contact Intelligence] Voice affinities loaded');
            } catch (e) {
                console.warn('[Contact Intelligence] Voice affinities unavailable:', e.message);
                _affinities = null;
            }
            
            _initialized = true;
            return true;
        } catch (e) {
            console.error('[Contact Intelligence] Init failed:', e.message);
            _initialized = true; // Mark done so we don't retry forever
            return false;
        }
    })();
    
    return _initPromise;
}

// ═══════════════════════════════════════════════════════════════
// SAFE STATE ACCESS - Every function checks its own dependencies
// ═══════════════════════════════════════════════════════════════

/**
 * Safely get chat state - returns null if unavailable
 */
function getChatState() {
    try {
        return _persistence?.getChatState?.() || null;
    } catch (e) {
        console.warn('[Contact Intelligence] getChatState error:', e.message);
        return null;
    }
}

/**
 * Safely save chat state - silent no-op if unavailable
 */
function saveChatState() {
    try {
        _persistence?.saveChatState?.();
    } catch (e) {
        console.warn('[Contact Intelligence] saveChatState error:', e.message);
    }
}

/**
 * Get contacts from state - returns empty object if unavailable
 */
function getContacts() {
    const state = getChatState();
    if (!state) return {};
    if (!state.relationships) state.relationships = {};
    return state.relationships;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    // Sentiment thresholds for auto-disposition suggestions
    DISPOSITION_THRESHOLDS: {
        trusted: 15,      // +15 to +20
        neutral: 5,       // +5 to +14
        cautious: -4,     // -4 to +4
        suspicious: -14,  // -14 to -5
        hostile: -20      // -20 to -15
    },
    
    // How many mentions before suggesting "Add contact?"
    // Raised from 3→5 to reduce false positives from noisy detection
    MENTION_THRESHOLD: 5,
    
    // How many top voices to show opinions from
    TOP_VOICES_COUNT: 3,
    
    // Score range for voice opinions
    OPINION_SCORE_RANGE: { min: -10, max: 10 }
};

// ═══════════════════════════════════════════════════════════════
// DISPOSITION MAPPING (Local copy to avoid import dependency)
// ═══════════════════════════════════════════════════════════════

const DISPOSITION_TO_TYPE = {
    trusted: 'informant',
    neutral: 'unknown', 
    cautious: 'witness',
    suspicious: 'accomplice',
    hostile: 'suspect'
};

function getTypeFromDisposition(disposition) {
    return DISPOSITION_TO_TYPE[disposition] || 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER NAME EXCLUSION
// Gets player + AI character names to prevent adding them as contacts
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current player character name (to EXCLUDE from detection)
 * Only excludes the USER — the AI character should be a contact
 * Checks multiple sources since ctx.name1 may be the ST username, not the persona
 * @returns {string[]} Array of names to exclude
 */
function getExcludedNames() {
    const names = new Set();
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (ctx) {
            if (ctx.name1) names.add(ctx.name1); // Player character — always exclude
            // NOTE: ctx.name2 (AI character) intentionally NOT excluded
            // The AI character should be detected and auto-added as first contact
        }
        
        // Also check persona name — this is what {{user}} resolves to
        if (window.power_user?.persona_name) {
            names.add(window.power_user.persona_name);
        }
        if (window.power_user?.default_persona) {
            names.add(window.power_user.default_persona);
        }
    } catch (e) {
        // Silent fail
    }
    return [...names].filter(Boolean);
}

/**
 * Get the AI character name for auto-contact seeding
 * Returns null for world cards / group chats where there's no single character
 * @returns {{ name: string, isWorldCard: boolean } | null}
 */
function getAICharacterInfo() {
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                     (typeof getContext === 'function' ? getContext() : null);
        if (!ctx) return null;
        
        const name = ctx.name2;
        if (!name) return null;
        
        // Detect world cards: typically have no single character identity
        // Group chats have multiple characters
        const isGroup = ctx.groups?.length > 0 || ctx.groupId;
        
        // Check if the character description suggests a world/narrator card
        // (cards named things like "Revachol", "The World", "Narrator", etc.)
        const worldCardIndicators = /\b(world|narrator|system|setting|scenario|adventure|realm|kingdom|lands?)\b/i;
        const looksLikeWorldCard = worldCardIndicators.test(name);
        
        return {
            name: name,
            isWorldCard: isGroup || looksLikeWorldCard
        };
    } catch (e) {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// NPC DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Common words to exclude from NPC detection
 * Massively expanded to prevent false positives from sentence-start capitalization,
 * common RP nouns, verbs, adjectives, and other non-name words.
 */
const COMMON_WORDS = new Set([
    // ── Pronouns & determiners ──
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
    'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
    'someone', 'anyone', 'everyone', 'nobody', 'somebody', 'anybody', 'everybody',
    'something', 'anything', 'everything', 'nothing',
    'somewhere', 'anywhere', 'everywhere', 'nowhere',

    // ── Conjunctions & prepositions ──
    'and', 'but', 'or', 'so', 'if', 'then', 'because', 'although', 'though',
    'while', 'when', 'where', 'since', 'until', 'unless', 'after', 'before',
    'about', 'above', 'across', 'against', 'along', 'among', 'around',
    'at', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
    'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside',
    'into', 'like', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside',
    'over', 'past', 'through', 'to', 'toward', 'towards', 'under', 'up',
    'upon', 'with', 'within', 'without',

    // ── Common verbs (including RP action verbs) ──
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing', 'done',
    'will', 'would', 'could', 'should', 'shall', 'may', 'might', 'must', 'can',
    'get', 'got', 'gets', 'getting', 'gotten',
    'go', 'goes', 'went', 'going', 'gone',
    'come', 'came', 'comes', 'coming',
    'make', 'made', 'makes', 'making',
    'take', 'took', 'takes', 'taking', 'taken',
    'give', 'gave', 'gives', 'giving', 'given',
    'say', 'said', 'says', 'saying',
    'tell', 'told', 'tells', 'telling',
    'think', 'thought', 'thinks', 'thinking',
    'know', 'knew', 'knows', 'knowing', 'known',
    'see', 'saw', 'sees', 'seeing', 'seen',
    'look', 'looked', 'looks', 'looking',
    'find', 'found', 'finds', 'finding',
    'want', 'wanted', 'wants', 'wanting',
    'need', 'needed', 'needs', 'needing',
    'feel', 'felt', 'feels', 'feeling',
    'try', 'tried', 'tries', 'trying',
    'leave', 'left', 'leaves', 'leaving',
    'call', 'called', 'calls', 'calling',
    'keep', 'kept', 'keeps', 'keeping',
    'let', 'lets', 'letting',
    'begin', 'began', 'begins', 'beginning', 'begun',
    'seem', 'seemed', 'seems', 'seeming',
    'help', 'helped', 'helps', 'helping',
    'show', 'showed', 'shows', 'showing', 'shown',
    'hear', 'heard', 'hears', 'hearing',
    'play', 'played', 'plays', 'playing',
    'run', 'ran', 'runs', 'running',
    'move', 'moved', 'moves', 'moving',
    'live', 'lived', 'lives', 'living',
    'believe', 'believed', 'believes',
    'bring', 'brought', 'brings', 'bringing',
    'happen', 'happened', 'happens',
    'write', 'wrote', 'writes', 'writing', 'written',
    'sit', 'sat', 'sits', 'sitting',
    'stand', 'stood', 'stands', 'standing',
    'lose', 'lost', 'loses', 'losing',
    'pay', 'paid', 'pays', 'paying',
    'meet', 'met', 'meets', 'meeting',
    'include', 'included', 'includes',
    'continue', 'continued', 'continues',
    'set', 'sets', 'setting',
    'learn', 'learned', 'learns',
    'change', 'changed', 'changes',
    'lead', 'led', 'leads', 'leading',
    'understand', 'understood', 'understands',
    'watch', 'watched', 'watches', 'watching',
    'follow', 'followed', 'follows',
    'stop', 'stopped', 'stops',
    'create', 'created', 'creates',
    'speak', 'spoke', 'speaks', 'speaking', 'spoken',
    'read', 'reads', 'reading',
    'allow', 'allowed', 'allows',
    'add', 'added', 'adds',
    'spend', 'spent', 'spends',
    'grow', 'grew', 'grows', 'growing', 'grown',
    'open', 'opened', 'opens', 'opening',
    'walk', 'walked', 'walks', 'walking',
    'win', 'won', 'wins', 'winning',
    'offer', 'offered', 'offers',
    'remember', 'remembered', 'remembers',
    'consider', 'considered', 'considers',
    'appear', 'appeared', 'appears', 'appearing',
    'buy', 'bought', 'buys',
    'wait', 'waited', 'waits', 'waiting',
    'serve', 'served', 'serves',
    'die', 'died', 'dies', 'dying',
    'send', 'sent', 'sends',
    'build', 'built', 'builds',
    'stay', 'stayed', 'stays', 'staying',
    'fall', 'fell', 'falls', 'falling', 'fallen',
    'cut', 'cuts', 'cutting',
    'reach', 'reached', 'reaches', 'reaching',
    'kill', 'killed', 'kills', 'killing',
    'remain', 'remained', 'remains',
    'raise', 'raised', 'raises',
    'pass', 'passed', 'passes', 'passing',
    'hold', 'held', 'holds', 'holding',
    'turn', 'turned', 'turns', 'turning',
    'put', 'puts', 'putting',
    'agree', 'agreed', 'agrees', 'agreeing',
    'pick', 'picked', 'picks', 'picking',
    'drop', 'dropped', 'drops', 'dropping',
    'grab', 'grabbed', 'grabs', 'grabbing',
    'catch', 'caught', 'catches', 'catching',
    'throw', 'threw', 'throws', 'throwing', 'thrown',
    'hit', 'hits', 'hitting',
    'break', 'broke', 'breaks', 'breaking', 'broken',
    'wear', 'wore', 'wears', 'wearing', 'worn',
    'step', 'stepped', 'steps', 'stepping',
    'stare', 'stared', 'stares', 'staring',
    'glance', 'glanced', 'glances', 'glancing',
    'nod', 'nodded', 'nods', 'nodding',
    'shake', 'shook', 'shakes', 'shaking',
    'smile', 'smiled', 'smiles', 'smiling',
    'laugh', 'laughed', 'laughs', 'laughing',
    'cry', 'cried', 'cries', 'crying',
    'sigh', 'sighed', 'sighs', 'sighing',
    'frown', 'frowned', 'frowns', 'frowning',
    'whisper', 'whispered', 'whispers', 'whispering',
    'shout', 'shouted', 'shouts', 'shouting',
    'scream', 'screamed', 'screams', 'screaming',
    'gasp', 'gasped', 'gasps', 'gasping',
    'mutter', 'muttered', 'mutters', 'muttering',
    'murmur', 'murmured', 'murmurs',
    'crumple', 'crumpled', 'crumples',
    'notice', 'noticed', 'notices', 'noticing',
    'realize', 'realized', 'realizes',
    'wonder', 'wondered', 'wonders', 'wondering',
    'press', 'pressed', 'presses', 'pressing',
    'squeeze', 'squeezed', 'squeezes',
    'lean', 'leaned', 'leans', 'leaning',
    'wrap', 'wrapped', 'wraps', 'wrapping',
    'slip', 'slipped', 'slips', 'slipping',
    'drag', 'dragged', 'drags', 'dragging',
    'lift', 'lifted', 'lifts', 'lifting',
    'carry', 'carried', 'carries', 'carrying',
    'swing', 'swung', 'swings', 'swinging',
    'kick', 'kicked', 'kicks', 'kicking',
    'shut', 'shuts', 'shutting',
    'crawl', 'crawled', 'crawls', 'crawling',
    'climb', 'climbed', 'climbs', 'climbing',
    'jump', 'jumped', 'jumps', 'jumping',
    'duck', 'ducked', 'ducks', 'ducking',
    'pull', 'pulled', 'pulls', 'pulling',
    'push', 'pushed', 'pushes', 'pushing',

    // ── Adverbs & adjectives ──
    'not', 'only', 'just', 'also', 'very', 'too', 'really', 'quite',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any', 'no',
    'still', 'already', 'always', 'never', 'often', 'sometimes', 'again',
    'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
    'perhaps', 'maybe', 'probably', 'certainly', 'definitely', 'actually',
    'suddenly', 'slowly', 'quickly', 'quietly', 'softly', 'gently', 'heavily',
    'carefully', 'barely', 'hardly', 'nearly', 'almost', 'finally', 'clearly',
    'enough', 'however', 'instead', 'rather', 'otherwise', 'anyway', 'somehow',
    'even', 'ever', 'once', 'twice', 'first', 'last', 'next',
    'such', 'much', 'many', 'several', 'certain', 'other', 'another',
    'same', 'different', 'whole', 'entire', 'possible', 'potential',
    'new', 'old', 'young', 'good', 'bad', 'great', 'small', 'big', 'large',
    'long', 'short', 'high', 'low', 'dark', 'light', 'bright', 'dim',
    'hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'soft', 'hard',
    'right', 'wrong', 'true', 'false', 'real', 'sure', 'ready', 'able',
    'own', 'full', 'empty', 'free', 'clear', 'close',
    'early', 'late', 'fast', 'slow', 'deep', 'wide', 'thin', 'thick',
    'heavy', 'tough', 'rough', 'smooth', 'sharp', 'flat', 'round',
    'best', 'worst', 'better', 'worse', 'least', 'less',
    'main', 'major', 'minor', 'single', 'double', 'final',
    'likely', 'unlikely', 'necessary', 'important', 'special', 'particular',

    // ── Common RP/story nouns that are NOT names ──
    'door', 'room', 'floor', 'wall', 'window', 'table', 'chair', 'bed',
    'hand', 'hands', 'eyes', 'face', 'head', 'voice', 'words', 'body',
    'arms', 'legs', 'feet', 'foot', 'finger', 'fingers', 'lips', 'mouth',
    'heart', 'mind', 'soul', 'chest', 'back', 'shoulder', 'shoulders',
    'hair', 'skin', 'blood', 'breath', 'tears', 'teeth', 'tongue',
    'moment', 'time', 'day', 'night', 'morning', 'evening', 'afternoon',
    'way', 'thing', 'things', 'place', 'world', 'life', 'death',
    'house', 'houses', 'home', 'street', 'road', 'path', 'ground',
    'water', 'fire', 'air', 'earth', 'sky', 'sun', 'moon', 'star', 'stars',
    'tree', 'trees', 'grass', 'stone', 'rock', 'dirt', 'dust', 'sand',
    'light', 'shadow', 'shadows', 'darkness', 'silence',
    'sound', 'noise', 'music', 'song', 'word',
    'food', 'drink', 'coffee', 'tea', 'beer', 'wine', 'bottle',
    'car', 'bus', 'train', 'boat', 'ship', 'plane',
    'book', 'paper', 'letter', 'note', 'card', 'page', 'sign',
    'phone', 'screen', 'glass', 'mirror', 'clock', 'key', 'keys',
    'knife', 'gun', 'weapon', 'sword', 'shield', 'blade',
    'money', 'bag', 'box', 'case', 'coat', 'dress', 'shirt', 'shoes',
    'hat', 'ring', 'chain', 'rope', 'wire', 'thread',
    'corner', 'edge', 'end', 'side', 'top', 'bottom', 'center', 'middle',
    'city', 'town', 'village', 'country', 'state', 'building',
    'office', 'school', 'church', 'store', 'shop', 'bar', 'hotel',
    'hospital', 'station', 'park', 'bridge', 'tower', 'castle',
    'man', 'men', 'woman', 'women', 'child', 'children', 'girl', 'boy',
    'people', 'person', 'friend', 'friends', 'family', 'mother', 'father',
    'brother', 'sister', 'son', 'daughter', 'husband', 'wife',
    'creature', 'creatures', 'monster', 'monsters', 'beast', 'beasts',
    'animal', 'animals', 'bird', 'birds', 'birdie', 'dog', 'cat', 'horse',
    'god', 'gods', 'king', 'queen', 'lord', 'prince', 'princess',
    'captain', 'officer', 'soldier', 'guard', 'doctor', 'nurse',
    'master', 'sir', 'madam', 'miss', 'mister',

    // ── Occupations, roles, titles (RP/fantasy/noir/generic) ──
    // These are descriptions, not proper names
    'butcher', 'baker', 'merchant', 'vendor', 'trader', 'shopkeeper', 'storekeeper',
    'bartender', 'barkeep', 'barman', 'barmaid', 'innkeeper', 'landlord', 'landlady',
    'blacksmith', 'smith', 'tailor', 'cobbler', 'tanner', 'weaver', 'potter',
    'farmer', 'fisherman', 'fisher', 'hunter', 'trapper', 'woodsman', 'lumberjack',
    'servant', 'maid', 'butler', 'footman', 'steward', 'attendant', 'valet',
    'cook', 'chef', 'waiter', 'waitress', 'hostess',
    'priest', 'priestess', 'monk', 'nun', 'cleric', 'preacher', 'bishop', 'cardinal',
    'knight', 'squire', 'warrior', 'ranger', 'paladin', 'rogue', 'assassin',
    'mage', 'wizard', 'witch', 'warlock', 'sorcerer', 'sorceress', 'druid', 'shaman',
    'thief', 'bandit', 'brigand', 'pirate', 'smuggler', 'outlaw',
    'sailor', 'navigator', 'pilot', 'engineer', 'mechanic', 'technician',
    'bard', 'healer', 'herbalist', 'alchemist', 'apothecary', 'midwife',
    'detective', 'inspector', 'constable', 'sheriff', 'marshal', 'deputy',
    'judge', 'lawyer', 'prosecutor', 'attorney', 'magistrate', 'bailiff',
    'mayor', 'governor', 'senator', 'minister', 'ambassador', 'diplomat',
    'professor', 'teacher', 'scholar', 'librarian', 'tutor', 'student', 'apprentice',
    'general', 'commander', 'lieutenant', 'sergeant', 'corporal', 'private',
    'admiral', 'colonel', 'major', 'ensign', 'cadet',
    'spy', 'informant', 'agent', 'operative', 'handler',
    'courier', 'messenger', 'herald', 'crier', 'scribe',
    'beggar', 'vagrant', 'drifter', 'hermit', 'nomad', 'refugee',
    'noble', 'baron', 'baroness', 'duke', 'duchess', 'earl', 'count', 'countess',
    'emperor', 'empress', 'regent', 'heir', 'consort',
    'warden', 'jailer', 'executioner', 'hangman',
    'bouncer', 'doorman', 'receptionist', 'clerk', 'secretary', 'accountant',
    'driver', 'cabbie', 'chauffeur', 'conductor',
    'janitor', 'custodian', 'caretaker', 'groundskeeper',
    'singer', 'dancer', 'musician', 'performer', 'entertainer', 'acrobat', 'jester',
    'painter', 'sculptor', 'artist', 'writer', 'poet', 'author',
    'photographer', 'journalist', 'reporter', 'editor',
    'stagehand', 'roadie', 'bouncer', 'promoter',
    'boss', 'chief', 'leader', 'elder', 'elder', 'chief',
    'companion', 'partner', 'ally', 'rival', 'enemy', 'foe', 'nemesis',
    'victim', 'witness', 'suspect', 'accomplice', 'bystander',
    'stranger', 'traveler', 'visitor', 'guest', 'patron', 'customer', 'client',
    'figure', 'silhouette', 'shadow', 'phantom', 'ghost', 'spirit', 'specter',

    // ── Generic descriptors used as identifiers ──
    'guy', 'dude', 'fella', 'fellow', 'bloke', 'lad', 'lass', 'gal', 'dame', 'chap',
    'gentleman', 'gentlemen', 'lady', 'ladies',
    'someone', 'whoever', 'nobody',
    'group', 'team', 'crowd', 'army', 'force', 'power', 'energy',
    'game', 'games', 'show', 'shows', 'part', 'parts',
    'idea', 'plan', 'reason', 'question', 'answer', 'problem', 'issue',
    'fact', 'truth', 'lie', 'lies', 'secret', 'secrets', 'mystery',
    'fear', 'hope', 'love', 'hate', 'pain', 'joy', 'anger', 'rage',
    'horror', 'terror', 'scare', 'panic', 'shock', 'surprise',
    'rest', 'sleep', 'dream', 'dreams', 'memory', 'memories',
    'war', 'fight', 'battle', 'attack', 'defense',
    'zone', 'zones', 'area', 'areas', 'spot', 'point',
    'story', 'stories', 'history', 'news', 'report',
    'test', 'trial', 'chance', 'risk', 'danger', 'threat',
    'control', 'order', 'rule', 'rules', 'law', 'laws',
    'sense', 'touch', 'smell', 'taste', 'sight',
    'color', 'shape', 'size', 'type', 'kind', 'sort',
    'number', 'half', 'third', 'quarter',
    'north', 'south', 'east', 'west',
    'inside', 'outside', 'ahead',
]);

/**
 * Words that commonly start article+noun phrases (never start real NPC names)
 */
const ARTICLE_PREFIXES = new Set(['the', 'a', 'an', 'some', 'any', 'no', 'every', 'each', 'this', 'that']);

/**
 * Validate that a detected string actually looks like a proper character name
 * Rejects common English words, article phrases, verb phrases, etc.
 * This is the PRIMARY quality gate for NPC detection.
 * @param {string} name - Detected name to validate
 * @returns {boolean} True if it looks like a real character name
 */
function looksLikeName(name) {
    if (!name || name.length < 2) return false;
    
    const words = name.trim().split(/\s+/);
    const lowerName = name.toLowerCase().trim();
    
    // ── Reject template variables that survived stripping ──
    if (/\{\{|\}\}/.test(name)) return false;
    
    // Single word names
    if (words.length === 1) {
        // Must not be in common words
        if (COMMON_WORDS.has(lowerName)) return false;
        // Reject words ending in common non-name suffixes
        if (/(?:ing|tion|sion|ment|ness|ful|less|ous|ive|able|ible|ally|edly|erly|enly|ily|ity|ance|ence|ure|ism|ist|ery|ary|ory|ical|ious|eous|uous|ular|ular)$/i.test(name)) return false;
        // Reject common plurals of non-name words (words ending in -es, -ies but check it's not a name)
        if (/(?:houses|creatures|zones|shows|games|places|spaces|voices|faces|forces|pieces|sources)$/i.test(lowerName)) return false;
        // Must be at least 3 characters
        if (name.length < 3) return false;
        return true;
    }
    
    // Multi-word: first word must NOT be article/determiner
    // Rejects: "The Horror", "The Food", "The Scare", "The Games"
    if (ARTICLE_PREFIXES.has(words[0].toLowerCase())) return false;
    
    // Multi-word: reject if ALL words are common (not names)
    // Rejects: "Be At", "Be Here", "Be Out", "Bring To"
    const allCommon = words.every(w => COMMON_WORDS.has(w.toLowerCase()));
    if (allCommon) return false;
    
    // Multi-word: reject if first word is a common verb
    // Rejects: "Crumple The", "Bring To", "Agree With"
    const firstLower = words[0].toLowerCase();
    if (COMMON_WORDS.has(firstLower) && words.length === 2) {
        // First word is common AND it's only 2 words - likely verb+prep not a name
        return false;
    }
    
    // ── NEW: Reject generic descriptor phrases ──
    // Catches "Old Man", "Guy In Hat", "Tall Woman", "Hooded Figure", etc.
    // Check if first word is a descriptor adjective (not a name)
    const DESCRIPTOR_STARTERS = new Set([
        'old', 'young', 'tall', 'short', 'big', 'small', 'fat', 'thin', 'large',
        'hooded', 'masked', 'cloaked', 'robed', 'armored', 'armed', 'scarred',
        'dark', 'pale', 'blind', 'deaf', 'one-eyed', 'bearded', 'bald',
        'drunk', 'angry', 'nervous', 'mysterious', 'strange', 'weird', 'creepy',
        'local', 'nearby', 'foreign', 'unknown', 'unnamed', 'random',
        'other', 'another', 'second', 'third', 'first', 'last',
        'poor', 'rich', 'wealthy', 'dirty', 'clean', 'injured', 'wounded',
        'little', 'elderly', 'frail', 'burly', 'grizzled', 'weathered',
        'pretty', 'beautiful', 'ugly', 'handsome', 'lovely'
    ]);
    
    if (DESCRIPTOR_STARTERS.has(firstLower)) return false;
    
    // Reject if ALL words are common — no proper name component at all
    // "Guy In Hat" = all common → rejected
    // "John Smith" = "john" not common → passes
    if (allCommon) return false;  // (already checked above, but explicit for clarity)
    
    return true;
}

/**
 * Dialogue patterns that indicate NPC names (high confidence)
 * These are the MOST reliable signals: "X said", "asked X", etc.
 */
const DIALOGUE_PATTERNS = [
    /[""\u201C]([^""\u201D]+)[""\u201D]\s*(?:said|asked|replied|muttered|whispered|shouted|exclaimed|answered)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|muttered|whispered|shouted|exclaimed|answered)\s*[,:]?\s*[""\u201C]([^""\u201D]+)[""\u201D]/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says|asks|replies|mutters|whispers|shouts|exclaims|answers)/gi
];

/**
 * Action patterns that suggest names (medium confidence)
 * FIXED: Removed the over-broad preposition pattern that caught "to Houses", "at Creatures"
 * Now only matches possessive patterns (Elena's eyes) and action-start patterns
 */
const NAME_PATTERNS = [
    // "Elena looks at the door" - Name at start of action sentence
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:looks|watches|stares|glances|turns|walks|moves|steps|reaches|grabs|takes|pulls|pushes|opens|closes|picks|drops|lifts|throws|catches|sits|stands|leans|nods|shakes|smiles|frowns|sighs|laughs|cries)/gim,
    // "Elena's eyes narrow" - Possessive (very reliable)
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:eyes|face|voice|hand|hands|expression|tone|gaze|lips|mouth|smile|frown|grip|arm|arms|body|head|hair)/gi
];

/**
 * Detect potential NPC names from message text
 * @param {string} messageText - The chat message to scan
 * @param {string[]} excludeNames - Names to exclude (player character, AI character, etc.)
 * @returns {Map} Map of name -> { count, confidence, contexts }
 */
export function detectPotentialNPCs(messageText, excludeNames = []) {
    if (!messageText || typeof messageText !== 'string') {
        return new Map();
    }
    
    // ═══════════════════════════════════════════════════════════
    // PRE-PROCESSING: Strip template variables BEFORE detection
    // Catches {{user}}, {{char}}, {{User}}, etc.
    // ═══════════════════════════════════════════════════════════
    const cleanedText = messageText.replace(/\{\{[^}]+\}\}/g, ' ');
    
    // Build exclusion set from provided names (case-insensitive, includes first names)
    const excluded = new Set();
    for (const name of excludeNames) {
        if (!name) continue;
        excluded.add(name.toLowerCase().trim());
        const firstName = name.trim().split(/\s+/)[0];
        if (firstName && firstName.length > 1) {
            excluded.add(firstName.toLowerCase());
        }
    }
    
    const detected = new Map();
    
    const addDetection = (name, confidence, context) => {
        const normalized = name?.trim();
        if (!normalized || normalized.length < 2) return;
        
        // Check common words
        if (COMMON_WORDS.has(normalized.toLowerCase())) return;
        
        // FIX (Bug 4): Skip player character and AI character names
        if (excluded.has(normalized.toLowerCase())) return;
        const detectedFirst = normalized.split(/\s+/)[0];
        if (detectedFirst && excluded.has(detectedFirst.toLowerCase())) return;
        
        // QUALITY GATE: Must actually look like a name
        if (!looksLikeName(normalized)) return;
        
        // Skip single short words
        const words = normalized.split(/\s+/);
        if (words.length === 1 && words[0].length < 3) return;
        
        if (!detected.has(normalized)) {
            detected.set(normalized, { count: 0, confidence: 0, contexts: [] });
        }
        
        const entry = detected.get(normalized);
        entry.count++;
        entry.confidence = Math.max(entry.confidence, confidence);
        if (context && entry.contexts.length < 3) {
            entry.contexts.push(context.substring(0, 100));
        }
    };
    
    // Check dialogue patterns (high confidence)
    for (const pattern of DIALOGUE_PATTERNS) {
        try {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(cleanedText)) !== null) {
                const potentialNames = match.slice(1).filter(m => m && /^[A-Z]/.test(m));
                for (const name of potentialNames) {
                    if (!name.startsWith('"') && !name.startsWith('\u201C')) {
                        addDetection(name, 0.9, match[0]);
                    }
                }
            }
        } catch (e) {
            // Regex failed, skip this pattern
        }
    }
    
    // Check name patterns (medium confidence)
    for (const pattern of NAME_PATTERNS) {
        try {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(cleanedText)) !== null) {
                if (match[1]) {
                    addDetection(match[1], 0.7, match[0]);
                }
            }
        } catch (e) {
            // Regex failed, skip this pattern
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // REMOVED: Simple capitalized word detection (was confidence 0.3)
    // This was the #1 source of garbage contacts - it caught every
    // capitalized word at the start of every sentence.
    // Now we rely ONLY on dialogue patterns and action patterns.
    // ═══════════════════════════════════════════════════════════════
    
    return detected;
}

// ═══════════════════════════════════════════════════════════════
// CONTACT MATCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Get known contacts by lowercase name
 * @returns {Map} lowercase name -> contact object
 */
export function getKnownContactsByName() {
    const contacts = getContacts();
    const byName = new Map();
    
    for (const contact of Object.values(contacts)) {
        if (contact?.name) {
            byName.set(contact.name.toLowerCase(), contact);
        }
    }
    return byName;
}

/**
 * Find a contact matching a detected name
 * @param {string} detectedName 
 * @returns {object|null}
 */
export function findMatchingContact(detectedName) {
    if (!detectedName) return null;
    
    const knownContacts = getKnownContactsByName();
    const lowerName = detectedName.toLowerCase();
    
    // Exact match
    if (knownContacts.has(lowerName)) {
        return knownContacts.get(lowerName);
    }
    
    // Partial match
    for (const [contactName, contact] of knownContacts) {
        if (contactName.startsWith(lowerName) || lowerName.startsWith(contactName)) {
            return contact;
        }
        // First name match
        const firstName = contactName.split(/\s+/)[0];
        if (firstName === lowerName) {
            return contact;
        }
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// TRAIT EXTRACTION
// ═══════════════════════════════════════════════════════════════

const TRAIT_KEYWORDS = {
    // Positive
    kind: ['kind', 'gentle', 'caring', 'compassionate', 'warm', 'tender'],
    competent: ['competent', 'skilled', 'capable', 'efficient', 'professional'],
    honest: ['honest', 'truthful', 'sincere', 'genuine', 'frank'],
    calm: ['calm', 'composed', 'collected', 'steady', 'controlled'],
    strong: ['strong', 'powerful', 'muscular', 'tough', 'brawny'],
    clever: ['clever', 'smart', 'intelligent', 'sharp', 'bright'],
    charming: ['charming', 'charismatic', 'suave', 'smooth', 'alluring'],
    mysterious: ['mysterious', 'enigmatic', 'cryptic', 'secretive', 'strange'],
    dangerous: ['dangerous', 'threatening', 'menacing', 'intimidating'],
    vulnerable: ['vulnerable', 'wounded', 'hurt', 'broken', 'fragile'],
    
    // Role-based
    cop: ['cop', 'police', 'officer', 'detective', 'rcm', 'lieutenant'],
    criminal: ['criminal', 'thug', 'crook', 'gangster', 'dealer'],
    
    // Negative
    cruel: ['cruel', 'sadistic', 'vicious', 'brutal', 'heartless'],
    deceptive: ['deceptive', 'lying', 'dishonest', 'manipulative'],
    hostile: ['hostile', 'aggressive', 'antagonistic', 'confrontational'],
    arrogant: ['arrogant', 'condescending', 'superior', 'smug']
};

/**
 * Extract traits about an NPC from message context
 * @param {string} npcName 
 * @param {string} messageText 
 * @returns {string[]} Array of trait IDs
 */
export function extractTraitsFromContext(npcName, messageText) {
    if (!npcName || !messageText) return [];
    
    const detectedTraits = new Set();
    const lowerText = messageText.toLowerCase();
    const lowerName = npcName.toLowerCase();
    
    // Find sentences containing the NPC
    const sentences = messageText.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
        s.toLowerCase().includes(lowerName)
    );
    
    const contextText = relevantSentences.length > 0 
        ? relevantSentences.join(' ').toLowerCase()
        : lowerText;
    
    // Scan for trait keywords
    for (const [traitId, keywords] of Object.entries(TRAIT_KEYWORDS)) {
        for (const keyword of keywords) {
            if (contextText.includes(keyword)) {
                detectedTraits.add(traitId);
                break;
            }
        }
    }
    
    return Array.from(detectedTraits);
}

// ═══════════════════════════════════════════════════════════════
// VOICE OPINION SEEDING
// ═══════════════════════════════════════════════════════════════

/**
 * Generate initial voice opinions for a contact based on traits
 * @param {string[]} detectedTraits 
 * @returns {object} { voiceId: { score, comment, lastUpdated } }
 */
export function generateInitialVoiceOpinions(detectedTraits = []) {
    const opinions = {};
    
    // Check if affinities loaded
    if (!_affinities?.getVoicesWithStrongestOpinions) {
        return opinions;
    }
    
    try {
        const strongestVoices = _affinities.getVoicesWithStrongestOpinions(
            detectedTraits, 
            CONFIG.TOP_VOICES_COUNT * 2
        );
        
        for (const { voiceId, score } of strongestVoices.slice(0, CONFIG.TOP_VOICES_COUNT)) {
            opinions[voiceId] = {
                score: score,
                comment: null,
                lastUpdated: Date.now(),
                traits: detectedTraits
            };
        }
    } catch (e) {
        console.warn('[Contact Intelligence] generateInitialVoiceOpinions error:', e.message);
    }
    
    return opinions;
}

/**
 * Seed a contact with initial voice opinions
 * @param {string} contactId 
 * @param {string} contextText 
 */
export async function seedContactOpinions(contactId, contextText) {
    await ensureInitialized();
    
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return;
    
    try {
        const traits = extractTraitsFromContext(contact.name, contextText);
        const opinions = generateInitialVoiceOpinions(traits);
        
        contact.voiceOpinions = opinions;
        contact.detectedTraits = traits;
        
        saveChatState();
        
        console.log(`[Contact Intelligence] Seeded ${contact.name} with traits:`, traits);
    } catch (e) {
        console.warn('[Contact Intelligence] seedContactOpinions error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════

const POSITIVE_INDICATORS = [
    /\b(trust|like|good|kind|honest|reliable|friend|ally|help|safe)\b/i,
    /\b(admire|respect|appreciate|understand|genuine|sincere)\b/i,
    /\b(on your side|got your back|can count on|believe in)\b/i
];

const NEGATIVE_INDICATORS = [
    /\b(danger|threat|suspicious|lying|hiding|can't trust|don't trust)\b/i,
    /\b(enemy|hostile|cruel|manipulat|decei|betray|scheming)\b/i,
    /\b(something off|something wrong|bad feeling|watch out|be careful)\b/i,
    /\b(hate|despise|loathe|disgust)\b/i
];

const NEUTRAL_INDICATORS = [
    /\b(unclear|unknown|uncertain|hard to read|can't tell)\b/i,
    /\b(maybe|perhaps|might be|could be|not sure)\b/i
];

/**
 * Analyze voice dialogue for sentiment about an NPC
 * @param {string} voiceContent 
 * @param {string} npcName 
 * @returns {{ mentioned: boolean, sentiment: number, reason: string }}
 */
export function analyzeVoiceSentiment(voiceContent, npcName) {
    if (!voiceContent || !npcName) {
        return { mentioned: false, sentiment: 0, reason: null };
    }
    
    const lowerContent = voiceContent.toLowerCase();
    const lowerName = npcName.toLowerCase();
    const firstName = lowerName.split(' ')[0];
    
    // Check if NPC mentioned
    const mentioned = lowerContent.includes(lowerName) || lowerContent.includes(firstName);
    
    if (!mentioned) {
        return { mentioned: false, sentiment: 0, reason: null };
    }
    
    let sentiment = 0;
    let reasons = [];
    
    for (const pattern of POSITIVE_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment += 1;
            reasons.push('positive');
        }
    }
    
    for (const pattern of NEGATIVE_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment -= 1;
            reasons.push('negative');
        }
    }
    
    for (const pattern of NEUTRAL_INDICATORS) {
        if (pattern.test(voiceContent)) {
            sentiment = Math.round(sentiment * 0.5);
            reasons.push('uncertain');
        }
    }
    
    // Clamp to -3 to +3
    sentiment = Math.max(-3, Math.min(3, sentiment));
    
    return {
        mentioned: true,
        sentiment,
        reason: reasons.length > 0 ? reasons.join(', ') : 'mentioned'
    };
}

// ═══════════════════════════════════════════════════════════════
// VOICE OPINION UPDATES
// ═══════════════════════════════════════════════════════════════

/**
 * Update a voice's opinion of a contact
 * @param {string} contactId 
 * @param {string} voiceId 
 * @param {number} sentimentDelta 
 * @param {string} newContent 
 */
export function updateVoiceOpinion(contactId, voiceId, sentimentDelta, newContent = null) {
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return;
    
    try {
        if (!contact.voiceOpinions) {
            contact.voiceOpinions = {};
        }
        
        if (!contact.voiceOpinions[voiceId]) {
            // Get seed score from affinities if available
            let seedScore = 0;
            if (_affinities?.calculateSeedScore) {
                seedScore = _affinities.calculateSeedScore(voiceId, contact.detectedTraits || []);
            }
            
            contact.voiceOpinions[voiceId] = {
                score: seedScore,
                comment: null,
                lastUpdated: Date.now(),
                observationCount: 0
            };
        }
        
        const opinion = contact.voiceOpinions[voiceId];
        
        // Diminishing returns on repeated observations
        const impactFactor = Math.max(0.3, 1 - (opinion.observationCount * 0.1));
        const adjustedDelta = Math.round(sentimentDelta * impactFactor);
        
        opinion.score = Math.max(
            CONFIG.OPINION_SCORE_RANGE.min,
            Math.min(CONFIG.OPINION_SCORE_RANGE.max, opinion.score + adjustedDelta)
        );
        opinion.lastUpdated = Date.now();
        opinion.observationCount = (opinion.observationCount || 0) + 1;
        
        if (newContent && newContent.length > 10 && newContent.length < 150) {
            opinion.lastObservation = newContent;
        }
        
        saveChatState();
        
        console.log(`[Contact Intelligence] ${voiceId} → ${contact.name}: ${opinion.score} (${sentimentDelta > 0 ? '+' : ''}${adjustedDelta})`);
    } catch (e) {
        console.warn('[Contact Intelligence] updateVoiceOpinion error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// DISPOSITION CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate voice consensus score
 * @param {object} voiceOpinions 
 * @returns {number}
 */
export function calculateVoiceConsensus(voiceOpinions) {
    if (!voiceOpinions || Object.keys(voiceOpinions).length === 0) {
        return 0;
    }
    
    const scores = Object.values(voiceOpinions).map(o => o.score || 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
}

/**
 * Derive disposition from sentiment score
 * @param {number} score 
 * @returns {string}
 */
export function deriveDispositionFromScore(score) {
    const t = CONFIG.DISPOSITION_THRESHOLDS;
    
    if (score >= t.trusted) return 'trusted';
    if (score >= t.neutral) return 'neutral';
    if (score >= t.cautious) return 'cautious';
    if (score >= t.suspicious) return 'suspicious';
    return 'hostile';
}

/**
 * Recalculate a contact's disposition from voice opinions
 * @param {string} contactId 
 * @param {boolean} autoUpdate 
 * @returns {object|null}
 */
export function recalculateSentiment(contactId, autoUpdate = false) {
    const state = getChatState();
    const contact = state?.relationships?.[contactId];
    if (!contact) return null;
    
    const consensus = calculateVoiceConsensus(contact.voiceOpinions);
    const suggestedDisposition = deriveDispositionFromScore(consensus);
    const currentDisposition = contact.disposition || 'neutral';
    const shouldChange = suggestedDisposition !== currentDisposition;
    
    if (autoUpdate && shouldChange && !contact.manuallyEdited) {
        contact.disposition = suggestedDisposition;
        contact.sentimentScore = consensus;
        saveChatState();
        console.log(`[Contact Intelligence] Auto-updated ${contact.name}: ${currentDisposition} → ${suggestedDisposition}`);
    }
    
    return {
        contactId,
        contactName: contact.name,
        currentDisposition,
        suggestedDisposition,
        sentimentScore: consensus,
        shouldChange,
        manuallyEdited: contact.manuallyEdited || false
    };
}

// ═══════════════════════════════════════════════════════════════
// PENDING CONTACTS BUFFER
// ═══════════════════════════════════════════════════════════════

/**
 * Get pending contacts buffer
 * @returns {object}
 */
export function getPendingContacts() {
    const state = getChatState();
    return state?.pendingContacts || {};
}

/**
 * Track a potential NPC mention
 * @param {string} name 
 * @param {string} context 
 */
export function trackPendingContact(name, context) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.pendingContacts) {
        state.pendingContacts = {};
    }
    
    const normalized = name?.trim();
    if (!normalized) return;
    
    const now = Date.now();
    
    if (!state.pendingContacts[normalized]) {
        state.pendingContacts[normalized] = {
            count: 0,
            firstSeen: now,
            lastSeen: now,
            contexts: []
        };
    }
    
    const pending = state.pendingContacts[normalized];
    pending.count++;
    pending.lastSeen = now;
    if (context && pending.contexts.length < 5) {
        pending.contexts.push(context.substring(0, 150));
    }
    
    saveChatState();
}

/**
 * Get contacts ready to suggest
 * @returns {Array}
 */
export function getContactSuggestions() {
    const pending = getPendingContacts();
    const suggestions = [];
    
    for (const [name, data] of Object.entries(pending)) {
        if (findMatchingContact(name)) continue;
        
        if (data.count >= CONFIG.MENTION_THRESHOLD) {
            suggestions.push({
                name,
                mentionCount: data.count,
                firstSeen: data.firstSeen,
                contexts: data.contexts
            });
        }
    }
    
    return suggestions;
}

/**
 * Clear a name from pending
 * @param {string} name 
 */
export function clearPendingContact(name) {
    const state = getChatState();
    if (state?.pendingContacts?.[name]) {
        delete state.pendingContacts[name];
        saveChatState();
    }
}

// ═══════════════════════════════════════════════════════════════
// DISPOSITION SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get pending disposition suggestions
 * @returns {object}
 */
export function getDispositionSuggestions() {
    const state = getChatState();
    return state?.dispositionSuggestions || {};
}

/**
 * Accept a disposition suggestion
 * @param {string} contactId 
 */
export function acceptDispositionSuggestion(contactId) {
    const state = getChatState();
    const suggestion = state?.dispositionSuggestions?.[contactId];
    const contact = state?.relationships?.[contactId];
    
    if (suggestion && contact) {
        contact.disposition = suggestion.to;
        contact.sentimentScore = suggestion.score;
        delete state.dispositionSuggestions[contactId];
        saveChatState();
        console.log(`[Contact Intelligence] Accepted: ${contact.name} → ${suggestion.to}`);
    }
}

/**
 * Dismiss a disposition suggestion
 * @param {string} contactId 
 */
export function dismissDispositionSuggestion(contactId) {
    const state = getChatState();
    if (state?.dispositionSuggestions?.[contactId]) {
        delete state.dispositionSuggestions[contactId];
        saveChatState();
    }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Enrich contact traits from VOICE content
// This captures what the USER'S voices think, not the AI narration
// ═══════════════════════════════════════════════════════════════

function enrichTraitsFromVoices(voiceResults, mentionedContacts) {
    if (!voiceResults?.length || !mentionedContacts?.size) return;
    
    for (const [npcName, contact] of mentionedContacts) {
        try {
            // Combine all voice content that mentions this NPC
            const relevantVoiceText = voiceResults
                .filter(v => v.content && typeof v.content === 'string')
                .map(v => v.content)
                .filter(content => {
                    const lower = content.toLowerCase();
                    const lowerName = npcName.toLowerCase();
                    const firstName = lowerName.split(' ')[0];
                    return lower.includes(lowerName) || lower.includes(firstName);
                })
                .join(' ');
            
            if (!relevantVoiceText) continue;
            
            // Extract traits from what the VOICES said about this person
            const voiceTraits = extractTraitsFromContext(npcName, relevantVoiceText);
            
            if (voiceTraits.length > 0) {
                // Merge with existing traits (voice-derived traits take precedence)
                const state = getChatState();
                const stateContact = state?.relationships?.[contact.id];
                if (stateContact) {
                    const existing = new Set(stateContact.detectedTraits || []);
                    for (const trait of voiceTraits) {
                        existing.add(trait);
                    }
                    stateContact.detectedTraits = Array.from(existing);
                    saveChatState();
                    
                    console.log(`[Contact Intelligence] Voice-enriched traits for ${npcName}:`, voiceTraits);
                }
            }
        } catch (e) {
            // Skip this contact
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Process voice opinions for mentioned contacts
// ═══════════════════════════════════════════════════════════════

function processVoiceOpinions(voiceResults, mentionedContacts) {
    if (!voiceResults?.length || !mentionedContacts?.size) return;
    
    for (const voice of voiceResults) {
        if (!voice.content || !voice.skillId) continue;
        
        for (const [npcName, contact] of mentionedContacts) {
            try {
                const analysis = analyzeVoiceSentiment(voice.content, npcName);
                
                if (analysis.mentioned && analysis.sentiment !== 0) {
                    updateVoiceOpinion(
                        contact.id,
                        voice.skillId,
                        analysis.sentiment,
                        voice.content
                    );
                }
            } catch (e) {
                // Skip this voice/contact pair
            }
        }
    }
}

function checkDispositionShifts(mentionedContacts) {
    for (const [npcName, contact] of mentionedContacts) {
        try {
            const result = recalculateSentiment(contact.id, false);
            
            if (result?.shouldChange && !result.manuallyEdited) {
                console.log(`[Contact Intelligence] Shift suggested: ${contact.name} ${result.currentDisposition} → ${result.suggestedDisposition}`);
                
                const state = getChatState();
                if (state) {
                    if (!state.dispositionSuggestions) {
                        state.dispositionSuggestions = {};
                    }
                    state.dispositionSuggestions[contact.id] = {
                        from: result.currentDisposition,
                        to: result.suggestedDisposition,
                        score: result.sentimentScore,
                        timestamp: Date.now()
                    };
                    saveChatState();
                }
            }
        } catch (e) {
            // Skip this contact
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN INTEGRATION HOOK
// Called from generation.js AFTER voices are generated
// 
// ⚠️ THIS FUNCTION MUST NEVER THROW - It's fire-and-forget
// ═══════════════════════════════════════════════════════════════

/**
 * Main hook called after voice generation
 * Scans for NPCs, updates opinions, tracks pending contacts
 * 
 * @param {array} voiceResults - Generated voice responses
 * @param {object} context - Context with message text
 */
export async function updateContactIntelligence(voiceResults, context) {
    // ═══════════════════════════════════════════════════════════
    // CRITICAL: Wrap EVERYTHING in try/catch
    // This function can NEVER break voice generation
    // ═══════════════════════════════════════════════════════════
    try {
        // Initialize dependencies
        await ensureInitialized();
        
        // Validate input
        if (!context?.message || typeof context.message !== 'string') {
            return;
        }
        
        console.log('[Contact Intelligence] Scanning for NPCs...');
        
        // Only exclude the USER name — AI character is a valid contact
        const excludeNames = getExcludedNames();
        
        // Detect potential NPCs
        const detected = detectPotentialNPCs(context.message, excludeNames);
        
        // ═══════════════════════════════════════════════════════
        // AUTO-DETECT AI CHARACTER as first contact
        // Skip for world cards / group chats
        // ═══════════════════════════════════════════════════════
        const charInfo = getAICharacterInfo();
        if (charInfo && !charInfo.isWorldCard) {
            const charName = charInfo.name;
            const existingChar = findMatchingContact(charName);
            if (!existingChar) {
                // AI character not yet a contact — track them with high confidence
                // They'll pass the mention threshold quickly since they appear in every message
                trackPendingContact(charName, 'Primary character');
            }
        }
        
        if (detected.size === 0) {
            return;
        }
        
        console.log('[Contact Intelligence] Found:', Array.from(detected.keys()));
        
        // Find known contacts that were mentioned
        const mentionedContacts = new Map();
        
        for (const [name, data] of detected) {
            const existingContact = findMatchingContact(name);
            
            if (existingContact) {
                mentionedContacts.set(name, existingContact);
            } else if (data.confidence >= 0.5) {
                trackPendingContact(name, data.contexts?.[0]);
            }
        }
        
        // ═══════════════════════════════════════════════════════
        // Process voice opinions from VOICE RESULTS (not AI text)
        // Voices' actual words determine sentiment, not narration
        // ═══════════════════════════════════════════════════════
        if (mentionedContacts.size > 0 && voiceResults?.length > 0) {
            processVoiceOpinions(voiceResults, mentionedContacts);
            
            // Also extract traits from voice content (not just AI narration)
            enrichTraitsFromVoices(voiceResults, mentionedContacts);
            
            checkDispositionShifts(mentionedContacts);
        }
        
        // Check for suggestions
        const suggestions = getContactSuggestions();
        if (suggestions.length > 0) {
            console.log('[Contact Intelligence] Suggestions ready:', suggestions.map(s => s.name));
        }
        
    } catch (e) {
        // NEVER let this error propagate
        console.warn('[Contact Intelligence] updateContactIntelligence error (non-fatal):', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { CONFIG, looksLikeName };
