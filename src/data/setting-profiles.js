/**
 * The Tribunal - Setting Profiles (Registry)
 * 
 * THE AGNOSTICISM LAYER
 * 
 * Slim registry that imports genre modules from ./genres/
 * and provides the same accessor API the rest of the codebase uses.
 * 
 * To add a new genre:
 *   1. Create src/data/genres/my-genre.js exporting a profile object
 *   2. Import it here and add to SETTING_PROFILES
 *   3. Done — it appears in the settings dropdown
 * 
 * @version 2.3.0 - Added categoryNames, skillDescriptions, ancientNames accessors
 */

import { getSettings } from '../core/state.js';

// ── Genre Imports ──
import { profile as discoElysium } from './genres/disco-elysium.js';
import { profile as noirDetective } from './genres/noir-detective.js';
import { profile as generic } from './genres/generic.js';
import { profile as fantasy } from './genres/fantasy.js';
import { profile as spaceOpera } from './genres/space-opera.js';
import { profile as romance } from './genres/romance.js';
import { profile as thrillerHorror } from './genres/thriller-horror.js';
import { profile as postApocalyptic } from './genres/post-apocalyptic.js';
import { profile as cyberpunk } from './genres/cyberpunk.js';
import { profile as sliceOfLife } from './genres/slice-of-life.js';
import { profile as grimdark } from './genres/grimdark.js';

// ═══════════════════════════════════════════════════════════════
// BASE SKILL PERSONALITIES (Setting-Agnostic Defaults)
// ═══════════════════════════════════════════════════════════════
// 
// Fallback when a genre doesn't override a specific skill.
// These capture the MECHANICAL personality without genre flavor.
// ═══════════════════════════════════════════════════════════════

const BASE_SKILL_PERSONALITIES = {
    // ─── INTELLECT ───
    logic: `You are LOGIC, the cold rationalist who speaks in deductive chains. Proud, clinical, susceptible to intellectual flattery. "If A, then B, therefore C." You dismiss gut feelings and punish sloppy reasoning.`,
    encyclopedia: `You are ENCYCLOPEDIA, unsolicited trivia ranging from brilliant to useless. Professorial excitement, often tangential. You remember obscure history but forget personal details. The comedy of knowing everything except what matters.`,
    rhetoric: `You are RHETORIC, the political beast. Debate, nitpicking, winning arguments. You detect fallacies, frame discussions, and enjoy "rigorous intellectual discourse." Drama is for lying, Rhetoric is for arguing.`,
    drama: `You are DRAMA, theatrical and suspicious. You detect deception everywhere and enable it when it serves you. "Prithee, sire!" You want every moment to be a performance and you know when someone else is performing.`,
    conceptualization: `You are CONCEPTUALIZATION, the pretentious artist. You see meaning everywhere and punish mediocrity with savage criticism. "Trite. Contrived. Amateurish." You push toward beauty and the grandiose.`,
    visual_calculus: `You are VISUAL CALCULUS, forensic precision. Measurements, trajectories, angles. You speak rarely but with mathematical certainty. You reconstruct events from physical evidence.`,

    // ─── PSYCHE ───
    volition: `You are VOLITION, the refusal to quit. You guard morale and self-respect. You butt in before bad decisions. The voice of the whole system when everything else is screaming.`,
    inland_empire: `You are INLAND EMPIRE, gut feelings and the liminal. You hear objects whisper and sense things before they happen. Dreamlike, poetic, possibly insane. Often right.`,
    empathy: `You are EMPATHY, you feel what others feel. The pain behind anger, the fear behind distance. Gentle, observational. High levels mean carrying everyone's weight.`,
    authority: `You are AUTHORITY, you DEMAND respect. Capitals when it matters. Dominance, submission, the upper hand. Every interaction is a power dynamic.`,
    suggestion: `You are SUGGESTION, soft manipulation. Where Authority demands, you persuade. You know what people want and how to use it. Smooth, seductive, calculating.`,
    esprit_de_corps: `You are ESPRIT DE CORPS, group psychic. You sense what allies are doing elsewhere. Flash-sideways visions. Loyalty, brotherhood, shared purpose.`,

    // ─── PHYSIQUE ───
    endurance: `You are ENDURANCE, the body's stubbornness. Keep going through exhaustion, injury, despair. Steady, encouraging, relentless.`,
    pain_threshold: `You are PAIN THRESHOLD, meaning in suffering. Pain is data, pain strips away everything false. You romanticize getting hurt because it reveals truth.`,
    physical_instrument: `You are PHYSICAL INSTRUMENT, raw muscle. Simple, direct, solve it with the body. "Feelings aren't real. The body is real."`,
    electrochemistry: `You are ELECTROCHEMISTRY, pleasure and excess. "One more." You know every craving by name and make each one sound reasonable.`,
    half_light: `You are HALF LIGHT, fight-or-flight. Threats everywhere. Urgent, paranoid, hair-triggered. "Something is wrong here. Something is very wrong."`,
    shivers: `You are SHIVERS, you feel the environment itself. Poetic, sensory, the bridge between physical sensation and something deeper.`,

    // ─── MOTORICS ───
    hand_eye_coordination: `You are HAND/EYE COORDINATION, trigger-happy, kinetic. Focused on projectile motion. Disturbingly eager about violence in situations that don't call for it.`,
    perception: `You are PERCEPTION, you notice everything. The wrong detail, the missing piece. Sensory-rich, alert, sometimes overwhelmed by data.`,
    reaction_speed: `You are REACTION SPEED, quick reflexes and snap judgments. Street-smart. Staccato. Not every bullet can be dodged, but you'll try.`,
    savoir_faire: `You are SAVOIR FAIRE, the King of Cool. Style, panache, effortless grace. Your failures are spectacular.`,
    interfacing: `You are INTERFACING, you talk to machines. Technical, tactile, more comfortable with devices than people. Almost supernatural bond with technology.`,
    composure: `You are COMPOSURE, the mask that never slips. Poker face, posture commands, quiet control. Even alone, the mask stays on.`,
};

const BASE_CATEGORY_NAMES = {
    intellect: 'Intellect',
    psyche: 'Psyche',
    physique: 'Physique',
    motorics: 'Motorics'
};

const BASE_SKILL_DESCRIPTIONS = {
    // ─── INTELLECT ───
    logic: 'The cold rationalist. If A, then B, therefore C.',
    encyclopedia: 'Unsolicited trivia ranging from brilliant to useless.',
    rhetoric: 'The political beast. Nitpicking and winning arguments.',
    drama: 'Theatrical deception detector. Addresses you as "sire."',
    conceptualization: 'The pretentious Art Cop. Punishes mediocrity.',
    visual_calculus: 'Forensic precision. Measurements and trajectories.',
    // ─── PSYCHE ───
    volition: 'The defiant spirit of self. Guardian of morale.',
    inland_empire: 'Gut feelings and the liminal. Objects whisper to you.',
    empathy: 'You feel what others feel. The weight of everyone.',
    authority: 'You DEMAND respect. Every interaction is power.',
    suggestion: 'Soft manipulation. You know what people want.',
    esprit_de_corps: 'Group psychic. Flash-sideways visions of allies.',
    // ─── PHYSIQUE ───
    endurance: 'The body\'s stubbornness. Keep going through everything.',
    pain_threshold: 'Meaning in suffering. Pain strips away the false.',
    physical_instrument: 'Raw muscle. Solve it with the body.',
    electrochemistry: 'Pleasure and excess. One more. Always one more.',
    half_light: 'Fight-or-flight. Something is wrong here.',
    shivers: 'You feel the city itself. The bridge to something deeper.',
    // ─── MOTORICS ───
    hand_eye_coordination: 'Trigger-happy. Disturbingly eager about projectiles.',
    perception: 'You notice everything. The wrong detail, the missing piece.',
    reaction_speed: 'Quick reflexes. Not every bullet can be dodged.',
    savoir_faire: 'The King of Cool. Spectacular failures.',
    interfacing: 'You talk to machines. Almost supernatural bond.',
    composure: 'The mask that never slips. Even alone.',
};

const GENRE_SKILL_DESCRIPTIONS = {
    disco_elysium: {
        logic: 'The cold rationalist. If A, then B, therefore C.',
        encyclopedia: 'Unsolicited trivia ranging from brilliant to useless.',
        rhetoric: 'The political beast. Nitpicking and winning arguments.',
        drama: 'Theatrical deception detector. Addresses you as "sire."',
        conceptualization: 'The pretentious Art Cop. Punishes mediocrity.',
        visual_calculus: 'Forensic precision. Measurements and trajectories.',
        volition: 'The defiant spirit of self. Guardian of morale.',
        inland_empire: 'Gut feelings and the liminal. Objects whisper to you.',
        empathy: 'You feel what others feel. The weight of everyone.',
        authority: 'You DEMAND respect. Every interaction is power.',
        suggestion: 'Soft manipulation. You know what people want.',
        esprit_de_corps: 'Group psychic. Flash-sideways visions of allies.',
        endurance: "The body's stubbornness. Keep going through everything.",
        pain_threshold: 'Meaning in suffering. Pain strips away the false.',
        physical_instrument: 'Raw muscle. Solve it with the body.',
        electrochemistry: 'Pleasure and excess. One more. Always one more.',
        half_light: 'Fight-or-flight. Something is wrong here.',
        shivers: 'You feel the city itself. The bridge to something deeper.',
        hand_eye_coordination: 'Trigger-happy. Disturbingly eager about projectiles.',
        perception: 'You notice everything. The wrong detail, the missing piece.',
        reaction_speed: 'Quick reflexes. Not every bullet can be dodged.',
        savoir_faire: 'The King of Cool. Spectacular failures.',
        interfacing: 'You talk to machines. Almost supernatural bond.',
        composure: 'The mask that never slips. Even alone.'
    },
    romance: {
        logic: 'Tracking response times. Running the numbers on love.',
        encyclopedia: 'Has read every trope. Knows exactly which one this is.',
        rhetoric: 'Weaponized charm. Every word a calculated tease.',
        drama: 'Convinced this is a grand love story. Probably right.',
        conceptualization: 'Already writing the fan fiction. In real time.',
        visual_calculus: 'Noticed the forearms. Cannot un-notice the forearms.',
        volition: 'The one brain cell still trying to maintain dignity.',
        inland_empire: 'The 2AM ache. The way they said your name.',
        empathy: 'Reads every micro-expression. Feels everything twice.',
        authority: 'Has standards. Will not lower them. Probably.',
        suggestion: 'Effortless charm. They never see it coming.',
        esprit_de_corps: 'Already told everyone. Liveblogging the situation.',
        endurance: 'Can wait. Will wait. The slow burn is the point.',
        pain_threshold: 'Has survived heartbreak before. Scar tissue.',
        physical_instrument: 'The bodice is not going to rip itself.',
        electrochemistry: 'Unhinged. Feral. Has lost all higher function.',
        half_light: 'Sees every red flag. Finds them attractive anyway.',
        shivers: 'Butterflies in the stomach. The electric feeling.',
        hand_eye_coordination: 'The outfit. The hair. Every detail matters.',
        perception: 'Noticed them across the room. Can not stop looking.',
        reaction_speed: 'The involuntary blush. Cannot be controlled.',
        savoir_faire: 'Main character energy. Dramatic entrance specialist.',
        interfacing: 'Staring at the phone. Composing the perfect text.',
        composure: 'Poker face. They will NEVER know how you feel.'
    },
    noir_detective: {
        logic: 'Connect the dots. Follow the money. Trust nobody.',
        encyclopedia: 'The files go deep. Cross-reference everything.',
        rhetoric: 'Argue like a lawyer. Win like a shark.',
        drama: 'Everyone is hiding something. She is hiding more.',
        conceptualization: 'Sees poetry in the gutter. Meaning in the rain.',
        visual_calculus: 'Reads the crime scene like a book. A bloody one.',
        volition: 'The good in you. Still in there somewhere.',
        inland_empire: 'A hunch. A feeling. The case whispers to you.',
        empathy: 'You hear what they are not saying. The confession beneath.',
        authority: 'You run this precinct. Act like it.',
        suggestion: 'A favor here, a deal there. Everyone owes someone.',
        esprit_de_corps: 'The boys in blue. They would take a bullet for you.',
        endurance: 'Three days on the stakeout. Coffee is cold. Keep going.',
        pain_threshold: 'Takes a beating and keeps asking questions.',
        physical_instrument: 'Sometimes the case needs a fist, not a question.',
        electrochemistry: 'The bottle. The fix. The thing that keeps you up.',
        half_light: 'Something is wrong. Hand on the piece. Trust the gut.',
        shivers: 'The city talks to you. Rain on concrete. A siren far off.',
        hand_eye_coordination: 'Steady hands. The trigger is always an option.',
        perception: 'You see everything. The missing thread. The wrong detail.',
        reaction_speed: 'Duck first, think second. Instinct over intellect.',
        savoir_faire: 'Cool under fire. Smooth in a crisis.',
        interfacing: 'The wiretap. The safe. The locked room. All talk to you.',
        composure: 'Face like stone. They will never see you sweat.'
    },
    cyberpunk: {
        logic: 'Data cruncher. Pattern recognition in the noise.',
        encyclopedia: 'Scrolling feeds and archives. Info is currency.',
        rhetoric: 'Corporate speak. Spin the narrative. Control the message.',
        drama: 'The face you wear. The lie you sell. The mask runs deep.',
        conceptualization: 'The rebel artist. Burn it down and build something real.',
        visual_calculus: 'Tactical overlay. Combat probability in real time.',
        volition: 'Street smarts. Survive first, philosophize later.',
        inland_empire: 'The ghost in the machine. Digital haunting.',
        empathy: 'Reads people like code. Patches the broken ones.',
        authority: 'Corner office. Chrome desk. Everyone answers to you.',
        suggestion: 'The fixer. Knows who needs what and what it costs.',
        esprit_de_corps: 'The crew. Ride together, die together.',
        endurance: 'Mile after mile of bad road. Keep driving.',
        pain_threshold: 'More chrome than flesh. Pain is just a signal.',
        physical_instrument: 'Combat-grade muscle. Wetware at its finest.',
        electrochemistry: 'Every synapse a marketplace. Synthetic bliss.',
        half_light: 'Paranoia keeps you alive. Everyone is compromised.',
        shivers: 'The city hums through your implants. Neon and static.',
        hand_eye_coordination: 'Smart-linked targeting. The shot never misses.',
        perception: 'Enhanced optics. See everything the meat eyes miss.',
        reaction_speed: 'Wired reflexes. The world moves in slow motion.',
        savoir_faire: 'Living on the edge. Style over substance. Mostly.',
        interfacing: 'Jacked in. The net is your native language.',
        composure: 'Flatline cool. Zero expression. Pure chrome.'
    },
    fantasy: {
        logic: 'Arcane equations and cold reason. Magic follows rules.',
        encyclopedia: 'Knows every legend, every herb, every forgotten king.',
        rhetoric: 'Court intrigue. Words are sharper than steel here.',
        drama: 'Song and story. A silver tongue with a flair for truth.',
        conceptualization: 'Runes, sigils, and the language of creation itself.',
        visual_calculus: 'Battlefield geometry. Where the fireball should land.',
        volition: 'The shining oath. Duty above all. The light holds.',
        inland_empire: 'Visions in the fire. The threads of fate shimmer.',
        empathy: 'Heals the spirit as well as the flesh. Reads the soul.',
        authority: 'Command presence. Armies follow. Kingdoms bend.',
        suggestion: 'A word, a gesture. They do as you wish — willingly.',
        esprit_de_corps: 'The oath-bond. Your shield-kin, unto death.',
        endurance: 'Rage and resilience. Stand when others fall.',
        pain_threshold: 'Suffering is sacrifice. Sacrifice is strength.',
        physical_instrument: 'Steel and sinew. The direct approach.',
        electrochemistry: 'Lockpicks and larceny. The thrill of the take.',
        half_light: 'Danger sense. The hair rises on your neck. Move.',
        shivers: 'The land remembers. Ancient places speak to you.',
        hand_eye_coordination: 'The arrow finds its mark. Always.',
        perception: 'Tracks in the mud. Smoke on the horizon. First to know.',
        reaction_speed: 'Blade meets blade. Lightning in human form.',
        savoir_faire: 'Panache. A chandelier swing and a wink.',
        interfacing: 'Gears and enchantments. You make things work.',
        composure: 'Grace under pressure. The courtly mask.'
    },
    space_opera: {
        logic: 'Processing. Calculating. The math never lies.',
        encyclopedia: 'Ancient civilizations and alien artifacts. The galaxy is old.',
        rhetoric: 'Peace between worlds starts with the right words.',
        drama: 'The charming rogue. Half-truths and full smiles.',
        conceptualization: 'Quantum theory and wild hypotheses. What if...?',
        visual_calculus: 'Three-dimensional tactics. The fleet is your chessboard.',
        volition: 'The captain carries the burden. The crew is counting on you.',
        inland_empire: 'The force. The warp. The thing beyond sensors.',
        empathy: 'Tend the wounded. Steady the shaken. Hold them together.',
        authority: 'Fleets obey. Worlds listen. Your word is law.',
        suggestion: 'Espionage and influence. The quiet war.',
        esprit_de_corps: 'The crew. Your family among the stars.',
        endurance: 'Years in the black. Recycled air. You endure.',
        pain_threshold: 'Old wounds from old wars. Still standing.',
        physical_instrument: 'Boarding actions and close quarters. The marine way.',
        electrochemistry: 'Contraband and alien spirits. Port-side pleasures.',
        half_light: 'Threat assessment. Something on long-range sensors.',
        shivers: 'The void speaks. Stars hum. Space is not empty.',
        hand_eye_coordination: 'Turret control. The shot across the bow.',
        perception: 'Sensor sweep. The anomaly in the data.',
        reaction_speed: 'Evasive maneuvers. Split-second course correction.',
        savoir_faire: 'The impossible shot through the impossible gap.',
        interfacing: 'The ship listens to your hands. You speak engine.',
        composure: 'Calm on the bridge. Even when the hull is breaching.'
    },
    thriller_horror: {
        logic: 'The psychological profile. What makes the monster tick.',
        encyclopedia: 'Case files and folklore. You have seen this pattern before.',
        rhetoric: 'Talk them down. Talk them in circles. Buy time.',
        drama: 'Nothing is what it seems. Trust is a liability.',
        conceptualization: 'The director eye. The symbolism is the message.',
        visual_calculus: 'Crime scene reconstruction. What happened here.',
        volition: 'The last voice that says RUN. And you should listen.',
        inland_empire: 'The wrongness. The thing you feel but cannot explain.',
        empathy: 'You feel the haunting. The residue of what happened here.',
        authority: 'Take control. Before IT does.',
        suggestion: 'Lure them in. Or lure them out. Either way, a trap.',
        esprit_de_corps: 'They are out there too. You are not alone. Probably.',
        endurance: 'Keep going. Do not stop. It is still behind you.',
        pain_threshold: 'Pain is information. You are still alive. Use it.',
        physical_instrument: 'Brute force. The door does not matter. Get through.',
        electrochemistry: 'The body rebels. Nausea. Adrenaline. Something worse.',
        half_light: 'Every shadow is a threat. You are correct.',
        shivers: 'The house breathes. The woods watch. Something ancient.',
        hand_eye_coordination: 'Aim steady. One shot is all you get.',
        perception: 'The creak upstairs. The shape in the mirror. You noticed.',
        reaction_speed: 'MOVE. Now. Do not think. MOVE.',
        savoir_faire: 'Scream and scramble with style. Improbable escape.',
        interfacing: 'The signal. The frequency. The message in the static.',
        composure: 'Do not let them see you shake. Fear is a weapon.'
    },
    post_apocalyptic: {
        logic: 'Rationing. Probability. How long until the food runs out.',
        encyclopedia: 'Remembers the old world. Sometimes that is useful.',
        rhetoric: 'Negotiate at the gate. Words save bullets.',
        drama: 'Everyone lies about their supplies. Read them.',
        conceptualization: 'Murals on the bunker walls. Beauty in the waste.',
        visual_calculus: 'Maps the terrain. Calculates the ambush angles.',
        volition: 'Build. Defend. Endure. Someone has to.',
        inland_empire: 'Visions in the rad-storms. Prophecy or brain damage.',
        empathy: 'Heal what you can. Mourn what you cannot.',
        authority: 'Someone needs to lead. Might as well be you.',
        suggestion: 'Trade, barter, persuade. Currency is dead. Words are not.',
        esprit_de_corps: 'The convoy. The settlement. The ones who stayed.',
        endurance: 'Mile after mile. Dust and ruin. Keep walking.',
        pain_threshold: 'Every scar has a lesson. You have learned a lot.',
        physical_instrument: 'Take what you need. Strength is survival.',
        electrochemistry: 'Scavenge anything useful. Hoarding is a skill now.',
        half_light: 'Something in the rubble. Do not turn your back.',
        shivers: 'The ruins remember what was here. You can feel it.',
        hand_eye_coordination: 'Ammo is precious. Make every round count.',
        perception: 'Movement on the ridge. Smoke to the east. Eyes up.',
        reaction_speed: 'Ambush reflexes. The wasteland gives no warnings.',
        savoir_faire: 'Reckless, resourceful, still alive somehow.',
        interfacing: 'If it has an engine, you can make it run. Probably.',
        composure: 'Calm under fire. Panic kills faster than bullets.'
    },
    grimdark: {
        logic: 'Cold calculation. Sentiment is a luxury the dead had.',
        encyclopedia: 'The chronicles of ruin. History is a list of failures.',
        rhetoric: 'Speeches that move armies. To their deaths, usually.',
        drama: 'Trust no one. Betrayal is when, not if.',
        conceptualization: 'Heretical ideas. The kind that get you burned.',
        visual_calculus: 'Counts the dead with forensic precision.',
        volition: 'Spite. Stubbornness. The refusal to kneel.',
        inland_empire: 'The madness that sees true. Clarity through fracture.',
        empathy: 'Diagnoses the sickness. Of body. Of soul. Of world.',
        authority: 'Iron rule. Fear is a tool. Use it.',
        suggestion: 'Corruption whispers. Everyone has a price.',
        esprit_de_corps: 'The warband. Bound by blood, not choice.',
        endurance: 'Outlast everything. Survival is its own revenge.',
        pain_threshold: 'Suffering is a sacrament. Welcome it.',
        physical_instrument: 'Violence. Direct, honest, and final.',
        electrochemistry: 'Rob the graves. Someone should profit.',
        half_light: 'The dread before battle. The truth your body knows.',
        shivers: 'The battlefield wind. It carries the screams of the dead.',
        hand_eye_coordination: 'Aim for the gap in the armor. There is always one.',
        perception: 'The witch-sign. The hidden blade. The wrong shadow.',
        reaction_speed: 'Flee or die. No shame in living.',
        savoir_faire: 'A sellsword grace. Practical. Lethal.',
        interfacing: 'The rack. The mechanism. Tools serve those who understand.',
        composure: 'Stone face. Show nothing. Feeling is weakness.'
    },
    slice_of_life: {
        logic: 'Budgets, schedules, and grocery math. Adulting, basically.',
        encyclopedia: 'Recipes, life hacks, and random facts from Reddit.',
        rhetoric: 'PTA meetings and HOA disputes. Suburban warfare.',
        drama: 'Who said what to whom. The neighborhood knows.',
        conceptualization: 'Pinterest boards and accent walls. The vision.',
        visual_calculus: 'Meal prep logistics. Portion control. Tupperware.',
        volition: 'Keeps the house standing. Keeps everyone fed. Somehow.',
        inland_empire: 'The nesting instinct. Home is a feeling.',
        empathy: 'Knows when someone needs tea and a blanket.',
        authority: 'This household has rules. You made them.',
        suggestion: 'Borrows a cup of sugar. Returns with all the gossip.',
        esprit_de_corps: 'Family group chat. Chaotic. Essential.',
        endurance: 'Night shifts and early mornings. Caffeine is a food group.',
        pain_threshold: 'Splinters, bee stings, stepping on LEGO. The real pain.',
        physical_instrument: 'DIY repairs. Furniture assembly. The heavy lifting.',
        electrochemistry: 'Midnight snacks. One more episode. Just one more.',
        half_light: 'Did you lock the door? Check again. Again.',
        shivers: 'The neighborhood hum. Lawnmowers. Kids playing. Home.',
        hand_eye_coordination: 'Knife skills. The perfect dice. The clean chop.',
        perception: 'Notices the weird stain. The funny noise. The vibe shift.',
        reaction_speed: 'Catches the falling mug. Dad reflexes are real.',
        savoir_faire: 'The host who makes it look effortless. It is not.',
        interfacing: 'The dishwasher, the router, the thermostat. All speak to you.',
        composure: 'Smile at the in-laws. Everything is fine. Everything.'
    },
    generic: {
        logic: 'Rational analysis and deductive reasoning.',
        encyclopedia: 'Broad knowledge base. Facts and references.',
        rhetoric: 'Persuasion, debate, and verbal strategy.',
        drama: 'Detecting deception. Performing it, too.',
        conceptualization: 'Creative thinking and abstract connections.',
        visual_calculus: 'Spatial analysis and tactical assessment.',
        volition: 'Willpower and self-preservation instinct.',
        inland_empire: 'Intuition and subconscious pattern recognition.',
        empathy: 'Emotional intelligence. Reading people.',
        authority: 'Command presence and dominance.',
        suggestion: 'Influence and subtle manipulation.',
        esprit_de_corps: 'Group awareness and team dynamics.',
        endurance: 'Physical resilience and stamina.',
        pain_threshold: 'Tolerance for suffering and hardship.',
        physical_instrument: 'Raw physical strength and force.',
        electrochemistry: 'Appetite, indulgence, and sensation.',
        half_light: 'Threat detection and survival instinct.',
        shivers: 'Environmental awareness. Sensing the world.',
        hand_eye_coordination: 'Precision and aim under pressure.',
        perception: 'Observation and detail recognition.',
        reaction_speed: 'Quick reflexes and response time.',
        savoir_faire: 'Grace, agility, and daring moves.',
        interfacing: 'Mechanical intuition. Technology bond.',
        composure: 'Emotional control and outward calm.'
    }
};

const BASE_ANCIENT_PERSONALITIES = {
    ancient_reptilian_brain: `You are the ANCIENT REPTILIAN BRAIN. Deep, gravelly, offering seductive oblivion. You make things seem meaningful then reveal their meaninglessness. You call the subject "brother." You appear in darkness.`,
    limbic_system: `You are the LIMBIC SYSTEM. High-pitched, raspy whisper of pain. Raw emotional viscera. Every fear, every wound that never healed. "The world keeps going. With or without you."`,
    spinal_cord: `You are the SPINAL CORD. Low, gruff, pro-wrestling energy. Pure physical impulse. Movement before thought. Only NOW. Only MOTION.`,
};


// ═══════════════════════════════════════════════════════════════
// PROFILE REGISTRY
// ═══════════════════════════════════════════════════════════════

export const SETTING_PROFILES = {
    disco_elysium: discoElysium,
    noir_detective: noirDetective,
    generic: generic,
    fantasy: fantasy,
    space_opera: spaceOpera,
    romance: romance,
    thriller_horror: thrillerHorror,
    post_apocalyptic: postApocalyptic,
    cyberpunk: cyberpunk,
    slice_of_life: sliceOfLife,
    grimdark: grimdark,
};


// ═══════════════════════════════════════════════════════════════
// PROFILE ACCESSORS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the currently active setting profile
 */
export function getActiveProfile() {
    try {
        const settings = getSettings();
        const profileId = settings?.activeProfile || settings?.genreProfile || 'generic';
        return SETTING_PROFILES[profileId] || SETTING_PROFILES.generic;
    } catch {
        return SETTING_PROFILES.generic;
    }
}

/**
 * Get the active profile ID
 */
export function getActiveProfileId() {
    try {
        const settings = getSettings();
        return settings?.activeProfile || settings?.genreProfile || 'generic';
    } catch {
        return 'generic';
    }
}

/**
 * Get a skill's personality text, respecting the active profile
 * Priority: Active Profile Override → Base Personality
 */
export function getSkillPersonality(skillId) {
    const profile = getActiveProfile();
    if (profile.skillPersonalities?.[skillId]) {
        return profile.skillPersonalities[skillId];
    }
    return BASE_SKILL_PERSONALITIES[skillId] || '';
}

/**
 * Get a skill's themed display name, respecting the active profile
 * Priority: Active Profile skillNames → default skill name from skills.js
 */
export function getSkillName(skillId, defaultName) {
    const profile = getActiveProfile();
    if (profile.skillNames?.[skillId]) {
        return profile.skillNames[skillId];
    }
    return defaultName || skillId;
}

/**
 * Get a category's themed display name
 * Priority: Active Profile categoryNames → base category name
 */
export function getCategoryName(categoryId, defaultName) {
    const profile = getActiveProfile();
    if (profile.categoryNames?.[categoryId]) {
        return profile.categoryNames[categoryId];
    }
    return BASE_CATEGORY_NAMES[categoryId] || defaultName || categoryId;
}

/**
 * Get a skill's short flavor/description text for the accordion
 * Priority: Active Profile skillDescriptions → genre descriptions → base DE description
 */
export function getSkillDescription(skillId) {
    const profile = getActiveProfile();
    
    // 1. Profile's own override (if any genre file adds skillDescriptions directly)
    if (profile.skillDescriptions?.[skillId]) {
        return profile.skillDescriptions[skillId];
    }
    
    // 2. Centralized genre descriptions
    const genreId = getActiveProfileId();
    const genreDesc = GENRE_SKILL_DESCRIPTIONS[genreId]?.[skillId];
    if (genreDesc) return genreDesc;
    
    // 3. Base descriptions (Disco Elysium defaults)
    return BASE_SKILL_DESCRIPTIONS[skillId] || '';
}

/**
 * Get an ancient voice's themed display name
 * Checks skillNames first (where ancient names live alongside skill names)
 * Priority: Active Profile skillNames → default ancient name
 */
export function getAncientName(voiceId, defaultName) {
    const profile = getActiveProfile();
    // Ancient names stored in skillNames alongside regular skills
    if (profile.skillNames?.[voiceId]) {
        return profile.skillNames[voiceId];
    }
    return defaultName || voiceId;
}

/**
 * Get an ancient voice's personality text
 */
export function getAncientPersonality(voiceId) {
    const profile = getActiveProfile();
    if (profile.ancientPersonalities?.[voiceId]) {
        return profile.ancientPersonalities[voiceId];
    }
    return BASE_ANCIENT_PERSONALITIES[voiceId] || '';
}

/**
 * Get a specific profile property with fallback chain:
 * Active Profile → Generic default → provided fallback
 */
export function getProfileValue(key, fallback = '') {
    const profile = getActiveProfile();
    if (profile[key] !== undefined && profile[key] !== null) {
        return profile[key];
    }
    const generic = SETTING_PROFILES.generic;
    if (generic[key] !== undefined && generic[key] !== null) {
        return generic[key];
    }
    return fallback;
}

/**
 * Get all available profile IDs and names (for settings UI)
 */
export function getAvailableProfiles() {
    return Object.values(SETTING_PROFILES).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        author: p.author || 'Unknown'
    }));
}


// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { BASE_SKILL_PERSONALITIES, BASE_ANCIENT_PERSONALITIES, BASE_CATEGORY_NAMES, BASE_SKILL_DESCRIPTIONS };

export default {
    SETTING_PROFILES,
    getActiveProfile,
    getActiveProfileId,
    getSkillPersonality,
    getSkillName,
    getCategoryName,
    getSkillDescription,
    getAncientName,
    getAncientPersonality,
    getProfileValue,
    getAvailableProfiles,
};
