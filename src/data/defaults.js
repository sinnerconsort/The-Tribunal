/**
 * The Tribunal - Default State Structures
 * Reference: tribunal-state-design.md
 * 
 * v1.1.0 - Added worldState defaults
 * 
 * Three-layer persistence model:
 * - Per-Chat: chat_metadata.tribunal
 * - Global Settings: extension_settings.tribunal
 * - Permanent Progression: extension_settings.tribunal.progression
 */

// ═══════════════════════════════════════════════════════════════
// PER-CHAT STATE (Unique to each conversation/playthrough)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_CHAT_STATE = {
    // Version for migrations
    version: 1,
    
    // ───────────────────────────────────────────────────────────
    // ATTRIBUTES & SKILLS
    // ───────────────────────────────────────────────────────────
    attributes: {
        intellect: 3,
        psyche: 3,
        physique: 3,
        motorics: 3
    },
    
    skillLevels: {
        // Populated from attributes, can have individual bonuses
        // e.g., 'logic': 4, 'drama': 5
    },
    
    skillBonuses: {
        // Temporary/permanent modifiers from thoughts, items, etc.
        // e.g., 'empathy': +1, 'authority': -2
    },
    
    // ───────────────────────────────────────────────────────────
    // VITALS (CRT Display) - DE uses 1-13 scale
    // ───────────────────────────────────────────────────────────
    vitals: {
        health: 13,
        maxHealth: 13,
        morale: 13,
        maxMorale: 13,
        
        status: 'stable',   // 'stable', 'critical', 'compromised', 'thriving'
        copotype: null,     // 'MORALIST', 'SORRY COP', 'APOCALYPSE COP', etc.
        
        activeEffects: [],  // Temporary status effects
        ancientVoices: []   // Cryptic messages from the Pale/beyond
    },
    
    // ───────────────────────────────────────────────────────────
    // THOUGHT CABINET
    // ───────────────────────────────────────────────────────────
    thoughtCabinet: {
        slots: 4,           // Max concurrent research slots (one per attribute)
        discovered: [],     // Thought IDs available to research
        researching: {},    // { thoughtId: { progress: number, startedAt: timestamp, slot: 'int'|'psy'|'fys'|'mot' } }
        internalized: [],   // Completed thought IDs (max 5)
        
        customThoughts: {}, // AI-generated thoughts: { id: thoughtObject }
        
        themes: {},         // Tracked themes: { 'mortality': 5, 'identity': 3 }
        
        // Player context for thought generation
        playerContext: '',
        perspective: 'observer' // 'observer' or 'participant'
    },
    
    // ───────────────────────────────────────────────────────────
    // INVENTORY
    // ───────────────────────────────────────────────────────────
    inventory: {
        carried: [],    // Items in hand/pockets
        worn: [],       // Equipped clothing/accessories
        stored: [],     // Stashed items (hotel room, car, etc.)
        money: 0,
        moneyUnit: 'Réal'
    },
    
    // ───────────────────────────────────────────────────────────
    // EQUIPMENT (Martinaise Cleaners - Clothing & Accessories)
    // ───────────────────────────────────────────────────────────
    equipment: {
        items: [],          // Equipment items with bonuses
        ticketNumber: null, // Generated on first use
        lastUpdated: null
    },
    
    // ───────────────────────────────────────────────────────────
    // LEDGER (Cases, Notes, Weather, Locations)
    // ───────────────────────────────────────────────────────────
    ledger: {
        cases: [],
        notes: [],
        
        weather: {
            condition: 'overcast',
            description: 'Grey clouds hang low. Smells like rain.',
            icon: 'fa-cloud'
        },
        
        time: {
            display: '08:32',
            period: 'morning'  // morning, afternoon, evening, night, witching
        },
        
        locations: [],          // Discovered points of interest
        currentLocation: null   // Current location object (from WORLD tag)
    },
    
    // ───────────────────────────────────────────────────────────
    // RELATIONSHIPS (NPCs)
    // ───────────────────────────────────────────────────────────
    relationships: {
        // Keyed by NPC ID
        // 'gortash': { id, name, role, favor, voiceOpinions, dominantVoice, metAt, notes }
    },
    
    // ───────────────────────────────────────────────────────────
    // VOICE GENERATION STATE
    // ───────────────────────────────────────────────────────────
    voices: {
        lastGenerated: [],      // Most recent voice lines for display
        awakenedVoices: [],     // Voice IDs that have "spoken" this playthrough
        activeInvestigation: null,
        discoveredClues: []
    },
    
    // ───────────────────────────────────────────────────────────
    // PERSONA / POV
    // ───────────────────────────────────────────────────────────
    persona: {
        name: '',
        pronouns: 'they',       // they, he, she, it
        povStyle: 'second',     // first, second, third
        context: '',            // Brief character description for AI context
        sceneNotes: ''          // Scene perspective notes for POV conversion
    },
    
    // ───────────────────────────────────────────────────────────
    // META
    // ───────────────────────────────────────────────────────────
    meta: {
        createdAt: null,
        lastModified: null,
        messageCount: 0
    }
};


// ═══════════════════════════════════════════════════════════════
// GLOBAL SETTINGS (Same across all chats)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_GLOBAL_SETTINGS = {
    // Version for migrations
    settingsVersion: 1,
    
    // ───────────────────────────────────────────────────────────
    // EXTENSION STATE
    // ───────────────────────────────────────────────────────────
    enabled: true,
    
    // ───────────────────────────────────────────────────────────
    // API CONFIGURATION
    // ───────────────────────────────────────────────────────────
    api: {
        // Connection profile (ST Connection Manager)
        connectionProfile: 'current',  // 'current', 'none', or profile name
        
        // Voice generation model (should be cheap/fast)
        voiceModel: 'claude-3-haiku-20240307',
        voiceEndpoint: '',  // Empty = use ST's connection
        
        // Thought generation model (can be more expensive)
        thoughtModel: 'claude-3-sonnet-20240229',
        thoughtEndpoint: '',
        
        // Direct API settings (fallback if no ST connection)
        apiEndpoint: '',
        apiKey: '',
        model: '',
        
        // Generation settings
        maxTokens: 500,
        temperature: 0.9
    },
    
    // ───────────────────────────────────────────────────────────
    // UI PREFERENCES
    // ───────────────────────────────────────────────────────────
    ui: {
        defaultTab: 'status',
        panelPosition: 'right',
        fabPosition: { x: null, y: null },  // Remembers drag position
        
        showToasts: true,
        toastDuration: 3000,
        
        theme: 'default',       // For future theme support
        compactMode: false,
        
        // Panel visibility memory
        panelOpen: false,
        lastActiveTab: 'status'
    },
    
    // ───────────────────────────────────────────────────────────
    // VOICE SYSTEM SETTINGS
    // ───────────────────────────────────────────────────────────
    voices: {
        autoGenerate: false,        // Auto-generate on message received
        cascadeEnabled: true,       // Allow cascade triggers
        maxVoicesPerTurn: 3,        // Limit voices per generation
        
        // Which voices are enabled (all by default)
        enabledVoices: [],          // Empty = all enabled
        disabledVoices: [],         // Explicit disable list
        
        // POV conversion settings
        povConversion: true,        // Convert AI's "you" to character perspective
        defaultPronouns: 'they'
    },
    
    // ───────────────────────────────────────────────────────────
    // THOUGHT CABINET SETTINGS
    // ───────────────────────────────────────────────────────────
    thoughts: {
        researchRate: 1,            // Progress per message
        maxInternalized: 5,
        allowCustomThoughts: true,
        
        // Theme tracking
        trackThemes: true,
        themeDecayRate: 0          // 0 = no decay
    },
    
    // ───────────────────────────────────────────────────────────
    // VITALS SETTINGS
    // ───────────────────────────────────────────────────────────
    vitals: {
        autoTrack: false,           // Auto-detect damage/healing from chat
        showWarnings: true,         // Flash warnings at low health/morale
        warningThreshold: 30        // Percentage to trigger warnings
    },
    
    // ───────────────────────────────────────────────────────────
    // DICE/SKILL CHECK SETTINGS
    // ───────────────────────────────────────────────────────────
    dice: {
        diceType: '2d6',            // Classic DE style
        criticalSuccessThreshold: 12,
        criticalFailThreshold: 2,
        showModifiers: true,
        animateDice: true
    },
    
    // ───────────────────────────────────────────────────────────
    // WORLD STATE SETTINGS
    // ───────────────────────────────────────────────────────────
    worldState: {
        // WORLD tag parsing (passive, no API cost)
        parseWorldTags: true,       // Parse <!--- WORLD{} ---> from messages
        syncWeather: true,          // Update watch weather from WORLD tag
        syncTime: true,             // Update watch time from WORLD tag
        showNotifications: true,    // Toast on location change
        
        // AI extraction (active, uses API)
        useAIExtractor: false,      // Use AI to detect locations (costs API)
        
        // World tag injection
        injectWorldTag: false       // Show injection prompt in settings
    },
    
    // ───────────────────────────────────────────────────────────
    // PERMANENT PROGRESSION (Survives everything)
    // ───────────────────────────────────────────────────────────
    progression: {
        // Secret panel unlock
        secretPanel: {
            unlocked: false,
            crackCount: 0,          // 0-3, unlock at 3
            crackDates: [],         // Dates when cracks occurred
            lastCrackDate: null
        },
        
        // Achievements/unlocks
        achievements: [],
        
        // Total stats across all playthroughs
        totalStats: {
            playthroughs: 0,
            messagesProcessed: 0,
            voicesGenerated: 0,
            thoughtsInternalized: 0,
            criticalSuccesses: 0,
            criticalFailures: 0
        }
    }
};


// ═══════════════════════════════════════════════════════════════
// HELPER: Deep clone defaults
// ═══════════════════════════════════════════════════════════════

export function getDefaultChatState() {
    return JSON.parse(JSON.stringify(DEFAULT_CHAT_STATE));
}

export function getDefaultGlobalSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
}
