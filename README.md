# The Tribunal

> *"You're a disgrace to the uniform." — AUTHORITY*
> *"But the uniform... it's seen things." — INLAND EMPIRE*

A **Disco Elysium-inspired internal voice system** for [SillyTavern](https://github.com/SillyTavern/SillyTavern). Your skills have opinions. They interrupt each other. They judge you. They care about you in ways that hurt.

Originally built around Disco Elysium's 24-skill system, The Tribunal now supports **11 genre profiles** that adapt skill names, personalities, visual theming, and voice generation to match your story — from noir detective fiction to space opera to romance.

Built on mobile over two months using Termux + Claude. Heavily inspired by [Marinara's RPG Companion](https://github.com/SpicyMarinara/rpg-companion-sillytavern).

---

## Quick Start (First-Time Setup)

### Step 1: Install the Extension

Download or clone this repo into your SillyTavern extensions folder:

```
SillyTavern/public/scripts/extensions/third-party/The-Tribunal
```

Restart SillyTavern after placing the folder.

### Step 2: Set Up a Connection Profile in SillyTavern

**This is the most common issue new users hit.** The Tribunal uses SillyTavern's Connection Manager to make its own API calls for generating skill voices, and it needs a working connection profile to do this.

**What is a Connection Profile?**

A Connection Profile is a saved API configuration in SillyTavern. It stores your API type (OpenAI, Claude, etc.), your API key, and your model selection so extensions can make their own LLM calls without hijacking your main chat.

**How to create one:**

1. Open SillyTavern
2. Click the **API Connection** button (plug icon, top bar)
3. Set up your API connection as normal (select API type, enter key, pick model)
4. Make sure you can actually **send a message and get a response** — the connection must be working
5. Look for a **Save/Load Preset** or **Connection Profile** option and save your current setup with a name like "My Claude" or "My GPT"

If you can chat with a character normally, your connection is working. The Tribunal will use that same connection.

### Step 3: Enable The Tribunal

1. Go to **Extensions** panel in SillyTavern (puzzle piece icon)
2. Find **The Tribunal** and make sure it is enabled (checkbox)
3. A floating eye icon button should appear — this opens the main panel

### Step 4: Configure The Tribunal

1. Click the **eye button** to open the panel
2. Go to **Settings** tab (gear icon at the bottom)
3. Under **Connection**, select your Connection Profile from the dropdown
4. Set your **character name** and **pronouns** under Character Context
5. (Optional) Choose a **Genre Profile** to change the flavor from Disco Elysium to another genre

### Step 5: Start Chatting

1. **Select a character** and open a chat (The Tribunal needs an active chat to work)
2. Send a message
3. Skill voices will generate automatically based on what happens in the conversation
4. Click the eye button to see the voices, check the ledger, roll dice, and more

---

## Troubleshooting

### "INVESTIGATION FAILED: Connection Manager error: No connection profile found"

Your Connection Profile is not set up. See Step 2 above. You need a working API connection saved as a profile in SillyTavern before The Tribunal can generate anything.

### "Connection Manager error: API request failed"

Your connection profile exists but the API call is failing. Check that:
- Your API key is valid and has credits/quota remaining
- You can send a normal chat message to a character (if regular chat works, the connection is fine)
- The model selected in your connection profile is available to your account

### The eye button is flashing/pulsing

This means you do not have a character selected or a chat open yet. Select a character and start (or open) a chat — the button will stabilize.

### The eye button is flashing even with a chat open

This is a known issue being investigated. Try refreshing the page. If it persists, disable and re-enable the extension in the Extensions panel.

### Weather effects (rain, snow, fireflies) are showing when the extension is disabled

Refresh the page after disabling. Fixed in recent updates — the weather system now properly cleans up when you toggle the extension off.

### The panel is too small / too big on desktop

The Tribunal was designed primarily for mobile. Desktop scaling has been improved but may still need tweaking. If the panel is unusable on your screen, please open an issue on GitHub with your screen resolution and browser, and I will adjust the responsive CSS.

### Skill descriptions or CRT colors are not changing when I switch genres

Make sure you are running the latest version. Earlier releases had a key mismatch bug where genre changes from the Profiles tab did not properly propagate to all systems. Pull the latest commit.

### Nothing happens when I send a message

Check these in order:
1. Is the extension enabled? (Extensions panel, checkbox)
2. Is a Connection Profile selected? (Tribunal Settings tab)
3. Is "Auto-trigger voices" enabled? (Tribunal Settings tab, Voice Behavior section)
4. Is the connection working? (Can you send a regular chat message?)

---

## What Does It Do?

When something happens in your chat, your skills react. Inland Empire whispers about the supernatural. Encyclopedia dumps unwanted trivia. Electrochemistry notices every drink, every cigarette, every opportunity for poor decisions. Half Light sees threats everywhere.

They speak in a sidebar panel styled like a worn case file, complete with coffee stains and typewriter fonts.

### The 24 Skills

Organized into four attributes:

| INTELLECT | PSYCHE | PHYSIQUE | MOTORICS |
|-----------|--------|----------|----------|
| Logic | Volition | Endurance | Hand/Eye Coordination |
| Encyclopedia | Inland Empire | Pain Threshold | Perception |
| Rhetoric | Empathy | Physical Instrument | Reaction Speed |
| Drama | Authority | Electrochemistry | Savoir Faire |
| Conceptualization | Esprit de Corps | Shivers | Interfacing |
| Visual Calculus | Suggestion | Half Light | Composure |

Each skill has its own personality, trigger conditions, and opinions about the others. In non-DE genres, these skills get renamed and re-flavored to match the setting.

### Ancient Voices

In extreme states, older voices emerge — the **Ancient Reptilian Brain**, the **Limbic System**, and the **Spinal Cord**. These speak from beneath consciousness, triggered by specific combinations of substances and mental states.

### Thought Cabinet

Ruminate on ideas that emerge from your roleplay. Thoughts are generated dynamically based on themes in your conversations — death, identity, love, money, violence. Research them to internalize bonuses (and sometimes penalties).

### The Ledger

A detective's case file containing:
- **Cases** — Tasks and objectives extracted from your story
- **Contacts** — NPCs with voice-generated dossiers and relationship tracking
- **Locations** — A field notebook of places you have visited
- **Weather and Time** — Syncs with your story or real-world conditions, with visual particle effects

### Inventory

Track what you are carrying, wearing, and consuming. Items have skill affinities — that leather jacket makes Authority happy. The cigarettes... Electrochemistry is already reaching for them. Consumption triggers visual effects and temporary status modifications.

### Skill Checks

Roll 2d6 against your skill levels. Critical successes (boxcars) and critical failures (snake eyes). The dice do not care about your feelings, but the skills will comment on the results.

### Investigation

Scan scenes for objects, clues, and environmental details. Your skills analyze what they find, each noticing different things based on their specialties.

### Slipstream Radio

Ambient soundscapes that sync with weather conditions. Rain brings soft static. Snow brings cold winds.

### Visual Effects

Weather particles (rain, snow, mist, fireflies), consumption effects (smoke wisps, drunk blur), health state overlays, and genre-specific atmospheric theming.

---

## Genre Profiles

The Tribunal is not just for Disco Elysium. Switch genres in Settings or Profiles and everything adapts:

| Genre | Vibe |
|-------|------|
| **Disco Elysium** | The original. RCM detective in Revachol. |
| **Noir Detective** | Hardboiled PI. Bourbon and betrayal. |
| **Romance** | Slow burns and dramatic confessions. Butterflies included. |
| **Cyberpunk** | Chrome and neon. Street-level corporate espionage. |
| **Fantasy** | Swords, sorcery, and court intrigue. |
| **Space Opera** | Captains, crews, and the void between stars. |
| **Thriller / Horror** | Something is wrong here. Do not go upstairs. |
| **Post-Apocalyptic** | Dust, ruins, and survival math. |
| **Grimdark** | No heroes. Only survivors. Suffering is a feature. |
| **Slice of Life** | PTA meetings, grocery math, and stepping on LEGO. |
| **Generic** | Clean, neutral defaults for anything else. |

Each genre changes: skill names, skill descriptions, voice personalities, CRT monitor colors, morale system labels, death themes, and atmospheric content.

---

## The Panel

Click the floating eye button to open the main panel. Tabs along the bottom:

| Tab | What It Does |
|-----|-------------|
| **Voices** | Skill commentary, generation controls, skill accordion with scores |
| **Cabinet** | Thought research and internalization |
| **Status** | Medical form — conditions, copotype, morale |
| **Ledger** | Cases, contacts, locations, weather |
| **Inventory** | Items, equipment, currency |
| **Settings** | Connection, voice behavior, character context, genre |
| **Profiles** | Character builds, skill allocation, persona switching |

---

## Status Effects

Toggle conditions that modify your skills:

**Substances**: Drunk, Hungover, Nicotine Rush, Stimulated, and more.
**Mental States**: Sleep Deprived, Heartbroken, Paranoid, Manic, and more.
**Copotypes**: Sorry Cop, Apocalypse Cop, Superstar Cop, and more.

Each status boosts some skills and debuffs others. Some combinations unlock Ancient Voices.

---

## Tips

- **Let the skills breathe.** Do not generate voices every message. Let tension build.
- **Embrace failure.** Critical failures are where the best moments happen.
- **Use status effects.** They dramatically change which skills speak and how.
- **Check the ledger.** It tracks more than you realize.
- **Try different genres.** Romance Electrochemistry hits different than Disco Elysium Electrochemistry.
- **Trust Inland Empire.** Even when it is wrong, it is onto something.

---

## Included Assets

The `assets/` folder contains optional SillyTavern theme presets:

- **The Tribunal.json** — A SillyTavern UI theme designed to complement the extension
- **The Tribunal (Psyche).json** — A variant with psyche-focused coloring
- **[Moonlit] versions** — Presets for the Moonlit Echoes theme extension
- **audio/** — Sound files for Slipstream Radio ambient effects

To use the themes: import them through SillyTavern's theme settings.

---

## Requirements

- **SillyTavern** (recent version with Extension support)
- **A working LLM API connection** (Claude, GPT-4, or similar — anything good at maintaining distinct character voices)
- **Connection Manager extension** enabled in SillyTavern (usually enabled by default)

---

## Credits

Inspired by **Disco Elysium** by ZA/UM — one of the greatest RPGs ever made.

Built with help from Marinara's [RPG Companion](https://github.com/SpicyMarinara/rpg-companion-sillytavern) as structural inspiration, particularly for the inventory system.

---

## Known Issues

- Desktop scaling may need adjustment depending on screen resolution
- The investigation FAB button may flash inappropriately on some page states
- Weather effects from a previous session may briefly appear on page load before the extension state is fully restored

If you hit a bug, please open an issue on GitHub with:
1. What you expected to happen
2. What actually happened
3. Your browser and whether you are on mobile or desktop
4. Any error messages from the browser console (F12 > Console tab) if possible

---

*"The only way out is through. The only way through is to become the kind of person who can make it through."*
*— VOLITION*
