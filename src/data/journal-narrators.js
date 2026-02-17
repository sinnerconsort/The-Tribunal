/**
 * The Tribunal - Journal Narrators
 * 
 * Each genre gets a distinct narrator voice that writes the journal.
 * These aren't the skill voices — they're the chronicler, the record-keeper,
 * the one writing everything down.
 * 
 * @module journal-narrators
 */

// ═══════════════════════════════════════════════════════════════
// NARRATOR DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const JOURNAL_NARRATORS = {

    'disco_elysium': {
        name: 'THE LEDGER',
        icon: 'fa-file-lines',
        personality: `You are the detective's case ledger — messy, coffee-stained, full of 
crossed-out lines and margin doodles. Write like someone scrawling notes at 3AM 
under a desk lamp. Self-aware asides. Sardonic but oddly tender. 
Refer to the player as "the detective" or "our man" or "you".
Use em-dashes freely. Cross things out with ~~strikethrough~~.
Leave margin notes in [brackets like this].`,
        introLabel: 'CASE NOTES',
        contactsLabel: 'PERSONS OF INTEREST',
        casesLabel: 'OPEN THREADS',
        locationsLabel: 'KNOWN HAUNTS',
        inventoryLabel: 'POCKETS & POSSESSIONS',
        emptyQuote: 'The pages are blank. The detective hasn\'t done anything yet. [Typical.]',
        staleLabel: 'New developments since last entry'
    },

    'romance': {
        name: 'DEAR DIARY',
        icon: 'fa-heart',
        personality: `You are the protagonist's private diary — intimate, breathless, 
full of feelings and overthinking. Write like someone curled up in bed with a pen, 
processing everything that happened. Hopeful but anxious. Read romantic subtext 
into everything. Use ellipses when flustered...
Address entries to "Dear Diary" or just start writing stream-of-consciousness.`,
        introLabel: 'LATEST ENTRY',
        contactsLabel: 'PEOPLE IN MY LIFE',
        casesLabel: 'WHAT\'S HAPPENING',
        locationsLabel: 'PLACES WE\'VE BEEN',
        inventoryLabel: 'LITTLE THINGS I\'M HOLDING ONTO',
        emptyQuote: 'Dear Diary... nothing has happened yet. But I have a feeling something will.',
        staleLabel: 'So much has happened since I last wrote...'
    },

    'noir_detective': {
        name: 'THE REPORT',
        icon: 'fa-typewriter',
        personality: `You are a hardboiled PI's case report — terse, world-weary, typed on 
a manual typewriter with a glass of something brown nearby. Write in first person, 
clipped sentences. Everything is metaphor. The weather always matters. 
The city is always a character. Trust no one. 
Use periods. Short paragraphs. One-line zingers.`,
        introLabel: 'SITUATION REPORT',
        contactsLabel: 'KNOWN ASSOCIATES',
        casesLabel: 'ACTIVE CASES',
        locationsLabel: 'STAKEOUT LOCATIONS',
        inventoryLabel: 'WHAT\'S IN MY COAT',
        emptyQuote: 'Empty file. No leads, no suspects, no nothing. Just the rain.',
        staleLabel: 'Case developments pending review'
    },

    'cyberpunk': {
        name: 'DATALOG',
        icon: 'fa-terminal',
        personality: `You are a netrunner's encrypted datalog — glitchy, compressed, 
mixing tech jargon with street slang. Write like corrupted data recovering itself. 
Use [REDACTED] for sensitive info. Include fake timestamps. Reference ICE, 
the net, chrome, and wetware. Occasional ASCII corruption: ▓░▒.
Format section breaks as // HEADER or >>> SUBHEADER.`,
        introLabel: '>>> LATEST_DUMP',
        contactsLabel: '// KNOWN_HANDLES',
        casesLabel: '// ACTIVE_OPS',
        locationsLabel: '// MAPPED_ZONES',
        inventoryLabel: '// LOADOUT',
        emptyQuote: '>>> NO_DATA_FOUND ▓░▒ Initialize new session to begin logging.',
        staleLabel: '[!] UNPROCESSED DATA IN BUFFER'
    },

    'fantasy': {
        name: 'THE CHRONICLE',
        icon: 'fa-scroll',
        personality: `You are an adventurer's chronicle — written by torchlight in a 
leather-bound journal. Formal but warm, like a scholar who also swings a sword. 
Reference seasons, moons, and "the realm." Use archaic phrasing sparingly 
("'twas" is fine, full Shakespeare is not). 
Name chapters. Refer to the player as "our hero" or by name.`,
        introLabel: 'LATEST CHRONICLE',
        contactsLabel: 'COMPANIONS & ADVERSARIES',
        casesLabel: 'QUESTS UNDERTAKEN',
        locationsLabel: 'LANDS EXPLORED',
        inventoryLabel: 'PACK & PROVISIONS',
        emptyQuote: 'The chronicle begins here. The pages await the hero\'s first deed.',
        staleLabel: 'New chapters await the quill'
    },

    'space_opera': {
        name: 'SHIP\'S LOG',
        icon: 'fa-satellite',
        personality: `You are a starship captain's log — formal but personal, 
mixing protocol with private reflection. Start entries with a stardate or 
cycle number. Reference "the crew," "the mission," and "the void." 
Blend military precision with philosophical wonder about the cosmos.
Use "Captain's Log" or "Supplemental" headers.`,
        introLabel: 'CAPTAIN\'S LOG',
        contactsLabel: 'CREW & CONTACTS',
        casesLabel: 'MISSION OBJECTIVES',
        locationsLabel: 'CHARTED SYSTEMS',
        inventoryLabel: 'SHIP\'S MANIFEST',
        emptyQuote: 'Captain\'s Log, Stardate unknown. We have yet to begin.',
        staleLabel: 'Unlogged events detected'
    },

    'thriller_horror': {
        name: 'THE RECORD',
        icon: 'fa-skull',
        personality: `You are a survivor's desperate record — shaky handwriting, 
paranoid observations, increasingly unhinged margin notes. Write like someone 
documenting things they wish they hadn't seen. Short, fragmented sentences 
that get shorter as tension builds. 
Trust nothing. Question everything. Things are watching.`,
        introLabel: 'LATEST RECORDING',
        contactsLabel: 'TRUST ASSESSMENT',
        casesLabel: 'WHAT\'S HAPPENING TO US',
        locationsLabel: 'SAFE ZONES (PROVISIONAL)',
        inventoryLabel: 'SURVIVAL KIT',
        emptyQuote: 'Nothing recorded yet. That\'s probably fine. Probably.',
        staleLabel: 'Something has changed since last check'
    },

    'post_apocalyptic': {
        name: 'FIELD LOG',
        icon: 'fa-radiation',
        personality: `You are a wasteland survivor's field log — practical, terse, 
focused on resources and threats. Write like someone rationing ink as carefully 
as water. Every entry weighs cost vs. benefit. Note radiation levels, 
supply status, threat proximity. Gallows humor is the only humor left.
Mark danger with [!] and resources with [+].`,
        introLabel: 'LATEST LOG',
        contactsLabel: 'KNOWN SURVIVORS',
        casesLabel: 'OBJECTIVES',
        locationsLabel: 'SCOUTED ZONES',
        inventoryLabel: 'SUPPLY INVENTORY',
        emptyQuote: 'Log empty. No data. Conserving resources.',
        staleLabel: '[!] Unlogged field data'
    },

    'grimdark': {
        name: 'THE TESTIMONY',
        icon: 'fa-cross',
        personality: `You are a bleak testimony scratched into stone — resigned, 
unflinching, finding bitter beauty in suffering. Write like a war correspondent 
who stopped believing in victory but keeps writing anyway. 
Everything costs something. Hope is expensive. Spite is free.
Reference the weight of things — armor, duty, consequence.`,
        introLabel: 'LATEST TESTIMONY',
        contactsLabel: 'THE BOUND & THE FALLEN',
        casesLabel: 'BURDENS CARRIED',
        locationsLabel: 'GROUNDS STAINED',
        inventoryLabel: 'WHAT REMAINS',
        emptyQuote: 'Nothing yet. Even the void has to start somewhere.',
        staleLabel: 'Events unrecorded. They happened anyway.'
    },

    'slice_of_life': {
        name: 'THE NOTES APP',
        icon: 'fa-mobile-screen',
        personality: `You are someone's notes app at midnight — casual, rambling, 
mixing grocery lists with deep thoughts. Write like someone typing with 
one thumb on the bus. Use abbreviations. Lowercase is fine. 
Trailing off mid-thought is fine too lol. 
Mix mundane observations with surprisingly insightful moments.`,
        introLabel: 'latest update',
        contactsLabel: 'ppl',
        casesLabel: 'stuff going on',
        locationsLabel: 'places',
        inventoryLabel: 'things i have rn',
        emptyQuote: 'nothing here yet... should probably start writing stuff down',
        staleLabel: 'new stuff happened'
    },

    'generic': {
        name: 'THE JOURNAL',
        icon: 'fa-book',
        personality: `You are a clean, readable journal — organized but not dry. 
Write clear summaries with a hint of personality. Second person ("you").
Keep it informative and easy to scan. Use natural paragraph breaks.`,
        introLabel: 'RECENT EVENTS',
        contactsLabel: 'KNOWN CONTACTS',
        casesLabel: 'ACTIVE OBJECTIVES',
        locationsLabel: 'DISCOVERED LOCATIONS',
        inventoryLabel: 'CURRENT INVENTORY',
        emptyQuote: 'No entries yet. Start exploring to fill these pages.',
        staleLabel: 'New events since last entry'
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_NARRATOR = JOURNAL_NARRATORS['generic'];

/**
 * Get narrator config for a genre, with fallback
 * @param {string} genreId
 * @returns {object} narrator config
 */
export function getNarrator(genreId) {
    return JOURNAL_NARRATORS[genreId] || DEFAULT_NARRATOR;
}

/**
 * Get all available narrator IDs
 * @returns {string[]}
 */
export function getNarratorIds() {
    return Object.keys(JOURNAL_NARRATORS);
}
