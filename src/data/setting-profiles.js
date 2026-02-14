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
        const profileId = settings?.activeProfile || 'disco_elysium';
        return SETTING_PROFILES[profileId] || SETTING_PROFILES.disco_elysium;
    } catch {
        return SETTING_PROFILES.disco_elysium;
    }
}

/**
 * Get the active profile ID
 */
export function getActiveProfileId() {
    try {
        const settings = getSettings();
        return settings?.activeProfile || 'disco_elysium';
    } catch {
        return 'disco_elysium';
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
 * Priority: Active Profile skillDescriptions → base description
 */
export function getSkillDescription(skillId) {
    const profile = getActiveProfile();
    if (profile.skillDescriptions?.[skillId]) {
        return profile.skillDescriptions[skillId];
    }
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
 * Active Profile → Disco Elysium default → provided fallback
 */
export function getProfileValue(key, fallback = '') {
    const profile = getActiveProfile();
    if (profile[key] !== undefined && profile[key] !== null) {
        return profile[key];
    }
    const de = SETTING_PROFILES.disco_elysium;
    if (de[key] !== undefined && de[key] !== null) {
        return de[key];
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
