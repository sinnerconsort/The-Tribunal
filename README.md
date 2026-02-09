# The Tribunal

> *"You're a disgrace to the uniform." — AUTHORITY*  
> *"But the uniform... it's seen things." — INLAND EMPIRE*

A **Disco Elysium-inspired internal voice system** for SillyTavern. Your skills have opinions. They interrupt each other. They judge you. They care about you in ways that hurt.

---

## What Is This?

The Tribunal adds a layer of internal monologue to your roleplay — 24 skills that react to what's happening in your story, comment on your choices, and occasionally fail you at the worst possible moment.

When something happens in chat, your skills notice. Inland Empire whispers about the supernatural. Encyclopedia dumps unwanted trivia. Electrochemistry notices every drink, every cigarette, every opportunity for poor decisions. Half Light sees threats everywhere.

They speak in a sidebar panel styled like a worn case file, complete with coffee stains and typewriter fonts.

---

## Features

### 🎭 The 24 Skills

Organized into four attributes, just like the game:

| INTELLECT | PSYCHE | PHYSIQUE | MOTORICS |
|-----------|--------|----------|----------|
| Logic | Volition | Endurance | Hand/Eye Coordination |
| Encyclopedia | Inland Empire | Pain Threshold | Perception |
| Rhetoric | Empathy | Physical Instrument | Reaction Speed |
| Drama | Authority | Electrochemistry | Savoir Faire |
| Conceptualization | Esprit de Corps | Shivers | Interfacing |
| Visual Calculus | Suggestion | Half Light | Composure |

Each skill has its own personality, trigger conditions, and opinions about the others.

### 🦎 Ancient Voices

In extreme states, older voices emerge — the **Ancient Reptilian Brain**, the **Limbic System**, and the **Spinal Cord**. These speak from beneath consciousness, triggered by specific combinations of substances and mental states.

### 💭 Thought Cabinet

Ruminate on ideas that emerge from your roleplay. Thoughts are generated dynamically based on themes in your conversations — death, identity, love, money, violence. Research them to internalize bonuses (and sometimes penalties).

Themes fill up as you talk about them. When one spikes, a new thought crystallizes.

### 📋 The Ledger

A detective's case file containing:

- **Cases** — Tasks and objectives extracted from your story
- **Contacts** — NPCs with voice-generated dossiers and relationship tracking
- **Locations** — A field notebook of places you've visited
- **Weather & Time** — Syncs with your story or real-world conditions

### 🎒 Inventory

Track what you're carrying, wearing, and consuming. Items have skill affinities — that leather jacket makes Authority happy. The cigarettes... Electrochemistry is already reaching for them.

Consumption triggers visual effects and temporary status modifications.

### 🎲 Skill Checks

Roll 2d6 against your skill levels. Watch for critical successes (boxcars) and critical failures (snake eyes). The dice don't care about your feelings, but the skills will comment on the results.

### 📻 Slipstream Radio

Ambient soundscapes that sync with weather conditions. Rain brings soft static. Snow brings cold winds. The Pale brings... something else.

### 🔍 Investigation System

Scan scenes for objects, clues, and environmental details. Your skills analyze what they find, each noticing different things based on their specialties.

### ✨ Visual Effects

- Weather particles (rain, snow, mist, fog)
- Consumption effects (smoke wisps, drunk blur, stimulant pulse)
- Health state overlays (damage vignette, critical warnings)
- Horror and Pale encounters

### 👤 Profiles & Personas

Save different character builds with their own skill allocations, copotypes, and settings. Switch between detectives mid-session.

---

## Installation

1. Download or clone this repository
2. Place the `The-Tribunal` folder in your SillyTavern extensions directory:
   ```
   SillyTavern/public/scripts/extensions/third-party/The-Tribunal
   ```
3. Restart SillyTavern
4. Enable "The Tribunal" in Extensions settings
5. Configure your API connection in the extension's Settings tab

---

## Configuration

### API Setup

The Tribunal needs an LLM connection to generate voice responses. In the **Settings** tab:

1. Select a **Connection Profile** from your SillyTavern presets, OR
2. Configure a direct API endpoint and key

Recommended models: Claude, GPT-4, or any model good at maintaining distinct character voices.

### Voice Behavior

- **Voices per message**: How many skills speak (1-4 recommended)
- **Auto-trigger**: Generate voices automatically on new messages
- **Intrusive thoughts**: Random skill interjections
- **Object voices**: Items in the scene can speak

### Character Context

- **POV Style**: Second person ("You notice...") or third person ("Harry notices...")
- **Character Name**: Your detective's name
- **Pronouns**: For accurate voice references

---

## The Panel

Click the floating action button (the eye icon) to open the main panel. Five tabs await:

| Tab | Contents |
|-----|----------|
| **Voices** | Recent skill commentary and generation controls |
| **Cabinet** | Thought research and internalization |
| **Status** | RCM Medical Form — track conditions and copotype |
| **Ledger** | Cases, contacts, locations, weather |
| **Inventory** | Items, equipment, currency |

Plus **Settings** and **Profiles** in the bottom drawer.

---

## Status Effects

Toggle conditions that modify your skills:

**Substances**: Drunk, Hungover, Nicotine Rush, Stimulated, etc.  
**Mental States**: Sleep Deprived, Heartbroken, Paranoid, Manic, etc.  
**Copotypes**: Sorry Cop, Apocalypse Cop, Superstar Cop, etc.

Each status boosts some skills and debuffs others. Some combinations unlock Ancient Voices.

---

## Tips

- **Let the skills breathe** — Don't generate voices every message. Let tension build.
- **Embrace failure** — Critical failures are where the best moments happen.
- **Use status effects** — They dramatically change which skills speak and how.
- **Check the ledger** — It tracks more than you realize.
- **Trust Inland Empire** — Even when it's wrong, it's onto something.

---

## Credits

Inspired by **Disco Elysium** by ZA/UM — one of the greatest RPGs ever made. If you haven't played it, close SillyTavern and go buy it immediately.

This extension is a love letter to that game's brilliant skill system and internal monologue mechanics.

---

## License

MIT — Do what you want, but maybe credit the source.

---

*"The only way out is through. The only way through is to become the kind of person who can make it through."*  
*— VOLITION*
