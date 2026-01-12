# THE TRIBUNAL - Rebuild Specification

> *Formerly "Inland Empire" - A Disco Elysium internal voice simulator for SillyTavern*
> 
> **Film Strip Text:** `THE · TRIBUNAL · VOICES · PASSING · JUDGMENT · THE · TRIBUNAL ·`

---

## Project Overview

**Goal:** Merge Inland Empire (voice system) + Interfacing (game systems) into a single, clean, modular extension with the existing beautiful UI preserved.

**Key Principles:**
- Keep the gorgeous UI exactly as-is (side drawer, vertical text, color-coded attributes)
- Modular architecture - systems can be enabled/disabled independently
- Mobile-first (Termux development)
- Custom background support
- Profile/build system preserved

---

## Current Feature Inventory

### From Inland Empire (KEEP ALL)

| Feature | Status | Priority |
|---------|--------|----------|
| Voice Generation | ✅ Working | P0 |
| Cascade System (skill arguments) | ✅ Working | P0 |
| Investigation/Discovery | ✅ Working | P0 |
| Thought Cabinet | ✅ Working | P1 |
| Theme Tracker | ✅ Working | P1 |
| Status Effects (Physical/Mental) | ✅ Working | P1 |
| Cop Archetypes | ✅ Working | P2 |
| Ancient Voices | ✅ Working | P2 |
| Intrusive Thoughts | ✅ Working | P2 |
| Profile System | ✅ Working | P1 |
| Build Editor (12 points) | ✅ Working | P1 |
| Observer/Participant modes | ✅ Working | P2 |
| POV conversion (2nd/3rd person) | ✅ Working | P1 |

### From Interfacing (TO INTEGRATE)

| Feature | Status | Priority |
|---------|--------|----------|
| Health/Morale bars | ? | P2 |
| Inventory system | ? | P3 |
| Ledger (money) | ? | P3 |
| Suggestion system | ✅ Exists | P2 |
| Equipment with skill modifiers | ? | P3 |

### New Features (FUTURE)

| Feature | Priority |
|---------|----------|
| Custom panel backgrounds | P1 |
| Weather effects (from skill) | P4 |
| Slay the Princess voice pack | P4 |

---

## Architecture

### Directory Structure

```
PSYCHE/
├── manifest.json
├── index.js                    # Entry point, event wiring
├── styles.css                  # THE BEAUTIFUL UI (preserved)
│
├── src/
│   ├── core/
│   │   ├── config.js           # Default settings, constants
│   │   ├── state.js            # Central state management
│   │   ├── persistence.js      # Save/load to ST extension data
│   │   └── api.js              # Public API (window.PSYCHE)
│   │
│   ├── data/
│   │   ├── skills.js           # 24 skills + 3 ancient voices
│   │   ├── relationships.js    # Cascade rules, rivalries, nicknames
│   │   ├── statuses.js         # Physical/Mental status effects
│   │   ├── thoughts.js         # Thought cabinet content
│   │   └── archetypes.js       # Cop archetypes
│   │
│   ├── voice/                  # THE CORE MAGIC
│   │   ├── generation.js       # Context analysis, prompt building
│   │   ├── discovery.js        # Investigation system
│   │   ├── cascade.js          # Skill reaction logic
│   │   └── intrusive.js        # Intrusive thought voices
│   │
│   ├── systems/
│   │   ├── dice.js             # 2d6 skill checks
│   │   ├── cabinet.js          # Thought research/internalization
│   │   ├── themes.js           # Theme tracking from chat
│   │   ├── status.js           # Status effect management
│   │   ├── profiles.js         # Save/load character profiles
│   │   ├── suggestion.js       # Action suggestions (from Interfacing)
│   │   ├── health.js           # Health/Morale (future)
│   │   └── inventory.js        # Items/Equipment (future)
│   │
│   └── ui/
│       ├── drawer.js           # Side drawer open/close
│       ├── panel.js            # Main panel container
│       ├── tabs.js             # Tab switching logic
│       ├── attributes.js       # Tab 1: Skills display
│       ├── cabinet-ui.js       # Tab 2: Thought cabinet
│       ├── effects-ui.js       # Tab 3: Status effects
│       ├── settings-ui.js      # Tab 4: Settings
│       ├── profiles-ui.js      # Tab 5: Profiles
│       ├── investigation-ui.js # Investigation modal
│       ├── voices-ui.js        # Voice output rendering
│       ├── fab.js              # Floating action buttons
│       └── toasts.js           # Notifications
│
└── assets/
    └── backgrounds/            # Custom background images
```

### State Shape

```javascript
const state = {
    // Settings
    settings: {
        enabled: true,
        apiEndpoint: '',
        apiKey: '',
        model: 'glm-4-plus',
        temperature: 0.8,
        maxTokens: 600,
        
        // Voice behavior
        minVoices: 1,
        maxVoices: 3,
        triggerDelay: 1000,
        showDiceRolls: true,
        showFailedChecks: true,
        showVoicesInChat: true,
        autoTrigger: false,
        autoDetectStatus: false,
        
        // Investigation
        showInvestigationButton: false,
        autoInvestigate: false,
        
        // Thought Cabinet
        enableThoughtDiscovery: true,
        showThemeTracker: true,
        autoGenerateThoughts: true,
        
        // Intrusive
        enableIntrusiveVoices: true,
        intrusiveChance: 10,
        showIntrusiveInChat: true,
        
        // Character
        povStyle: 'second',
        characterName: '',
        characterPronouns: 'they',
        characterContext: '',
        scenePerspectiveNotes: '',
        
        // UI
        panelBackground: null,  // Custom background path
    },
    
    // Character build
    build: {
        intellect: 3,
        psyche: 3,
        physique: 3,
        motorics: 3
    },
    
    // Derived skill levels (from build + equipment + statuses)
    skills: {
        logic: { base: 3, modifiers: [], effective: 3 },
        // ... all 24 skills
    },
    
    // Active status effects
    activeStatuses: new Set(),
    
    // Cop archetype (only one active)
    copArchetype: null,
    
    // Ancient voices (can have multiple)
    activeAncientVoices: new Set(),
    
    // Thought Cabinet
    cabinet: {
        researching: [],        // { id, progress, startTime }
        discovered: [],         // thought IDs
        internalized: [],       // thought IDs (max 5)
        maxResearchSlots: 3,
        maxInternalizedSlots: 5
    },
    
    // Theme tracker
    themes: {
        paranoia: 0,
        substances: 0,
        identity: 0,
        authority: 0,
        violence: 0
    },
    
    // Profiles
    profiles: [],               // { name, date, build, skills, statuses, cabinet }
    
    // Runtime
    lastSceneContext: '',
    currentInvestigation: null,
    voiceHistory: []
};
```

---

## Implementation Phases

### Phase 1: Foundation (This Session?)

**Goal:** Get the skeleton running with core voice generation

1. [ ] Create manifest.json
2. [ ] Create index.js with ST integration
3. [ ] Port config.js and state.js
4. [ ] Port skills.js and relationships.js
5. [ ] Port dice.js
6. [ ] Port generation.js (voice generation)
7. [ ] Basic UI shell (drawer, panel container)
8. [ ] Test: Can generate voices

### Phase 2: UI Recreation

**Goal:** Recreate the beautiful tabbed interface

1. [ ] Port styles.css (THE BIG ONE - 3700+ lines?)
2. [ ] Implement drawer.js (slide in/out)
3. [ ] Implement tabs.js
4. [ ] Tab 1: Attributes display
5. [ ] Tab 4: Settings (need this for API config)
6. [ ] FAB buttons
7. [ ] Test: Can configure and trigger voices

### Phase 3: Investigation System

**Goal:** Full investigation/discovery workflow

1. [ ] Port discovery.js
2. [ ] Investigation modal UI
3. [ ] Scene context management
4. [ ] Object voice generation
5. [ ] Test: Can investigate scenes

### Phase 4: Thought Cabinet

**Goal:** Research and internalize thoughts

1. [ ] Port cabinet.js
2. [ ] Port thoughts.js (thought definitions)
3. [ ] Tab 2: Cabinet UI
4. [ ] Theme tracking integration
5. [ ] Thought generation
6. [ ] Test: Can research and internalize thoughts

### Phase 5: Status & Effects

**Goal:** Full status effect system

1. [ ] Port statuses.js
2. [ ] Port archetypes.js
3. [ ] Tab 3: Effects UI
4. [ ] Ancient voice triggers
5. [ ] Skill modifier calculations
6. [ ] Test: Statuses affect skill checks

### Phase 6: Profiles & Polish

**Goal:** Character management

1. [ ] Port profiles.js
2. [ ] Tab 5: Profiles UI
3. [ ] Build editor
4. [ ] Import/export
5. [ ] Custom backgrounds
6. [ ] Test: Full workflow

### Phase 7: Interfacing Features (Optional)

**Goal:** Add game systems from Interfacing

1. [ ] Suggestion system
2. [ ] Health/Morale bars
3. [ ] Inventory (if desired)
4. [ ] Ledger (if desired)

---

## Dice System Decision

**Approach: DE-Specific 2d6 Skill Checks**

RPG Companion's dice is generic (any NdX) with modal UI - overkill for our needs.
The Tribunal uses pure Disco Elysium mechanics:

- 2d6 + skill level vs difficulty threshold
- Boxcars (6+6) = automatic success (critical)
- Snake Eyes (1+1) = automatic failure (critical)
- No modal needed - checks happen during voice generation
- Results display in voice output badges

---

## File Checklist

### Files Received
- [x] generation.js - Voice generation, context analysis
- [x] discovery.js - Investigation system
- [x] skills.js - 24 skills + 3 ancient voices
- [x] relationships.js - Cascade rules, rivalries
- [x] styles.css - THE BEAUTIFUL 3745-line CSS
- [x] state.js - State management, profiles, builds
- [x] index.js - Entry point, event wiring, global API
- [x] dice.js (RPG Companion) - Generic NdX (reference only)
- [ ] statuses.js - Status effect definitions
- [ ] thoughts.js - Thought cabinet content
- [ ] cabinet.js - Thought research logic
- [ ] UI component files (panel.js, render.js, toasts.js)

### Files to Create
- [ ] manifest.json
- [ ] Rebuilt index.js
- [ ] Rebuilt state.js
- [ ] All UI components

---

## Naming Candidates

The extension needs a new name that captures "internal voices / psyche simulation":

1. **PSYCHE** - Clean, matches the attribute, already used in header
2. **The Chorus** - The voices arguing in your head
3. **Inner Empire** - Slight twist on Inland Empire
4. **The Parliament** - All the voices having a vote
5. **Thought Police** - DE reference + cop theme
6. **The Tribunal** - Voices passing judgment

**Current favorite: PSYCHE** (based on your existing header)

---

## Questions to Resolve

1. **Name decision** - ✅ **THE TRIBUNAL** 
   - Film strip: `THE · TRIBUNAL · VOICES · PASSING · JUDGMENT`

2. **Drawer direction** - ✅ **Slide from RIGHT**
   - Better for mobile thumb reach
   - Change CSS: `right: -420px` → `right: 0` when open

3. **Background images** - User-upload + optional presets

4. **Interfacing features** - To review when spec provided
   - Suggestion system: YES
   - Health/Morale: TBD
   - Inventory/Ledger: Later

5. **The vertical sidebar text** - ✅ Resolved: `::after` pseudo-element on `.inland-empire-panel`

6. **FABs** - Keep brain (main) + magnifying glass (investigation)

---

## Session Boundaries

Given context limits, we should tackle this in chunks:

**Session 1 (Current):** 
- Finalize spec
- Get remaining critical files (styles.css, state.js, etc.)
- Start Phase 1 foundation

**Session 2:**
- Complete Phase 1-2 (core + UI shell)

**Session 3:**
- Phase 3 (Investigation)

**Session 4:**
- Phase 4-5 (Cabinet + Status)

**Session 5:**
- Phase 6-7 (Profiles + Polish + Interfacing)

---

## Notes

- Mobile-first: Test everything in Termux
- No console access: Need good toast/UI feedback for debugging
- GitHub issues: Can't amend files manually, need full file outputs

---

*Last updated: 2026-01-12*
*Status: PLANNING*
