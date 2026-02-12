/**
 * Genre Profile: Generic
 * 
 * The vanilla base. No genre flavor. No theming.
 * All skills fall through to BASE_SKILL_PERSONALITIES
 * in the registry. This file exists so Generic appears
 * in the settings dropdown and provides a clean toneGuide.
 * 
 * Use this when you don't want a genre — just clean
 * internal voices without a world attached.
 */

export const profile = {
    id: 'generic',
    name: 'Generic',
    description: 'Clean internal voices — no genre flavor, fits any setting',
    author: 'The Tribunal',

    systemIntro: `You generate internal mental voices representing different aspects of a character's psyche. Each voice has a distinct personality and perspective. Keep the tone adaptable to any setting or genre.`,

    toneGuide: `WRITING STYLE: Clean, adaptable, setting-neutral. Each voice should feel like a distinct aspect of the character's inner mind — their logic, their instincts, their empathy, their ego — without referencing any specific genre, world, or aesthetic. Let the roleplay context determine the flavor. These voices provide the STRUCTURE of internal dialogue; the setting provides the COLOR.
WHAT TO AVOID: Genre-specific vocabulary, setting assumptions, world-building references. Don't assume fantasy, sci-fi, modern, or any other context. Read the scene and adapt.`,

    thoughtSystemName: 'the inner voices',
    thoughtStyleName: 'the thought',
    thoughtStyleDescription: 'internal introspection from competing aspects of the psyche',

    currency: 'money',
    defaultWeather: {
        condition: 'clear',
        description: 'The air is still. Nothing demands attention.',
        icon: 'fa-cloud'
    },
    equipmentSectionName: 'Inventory',

    liminalEffect: {
        name: 'The Void',
        cssClass: 'pale',
        pattern: /\b(void|unconscious|dreaming|nothingness|between|liminal|darkness)\b/i,
        description: 'The space between thoughts. The quiet beneath the noise.'
    },

    archetypeLabel: 'Archetype',
    archetypeLabelPlural: 'Archetypes',

    // No skillPersonalities — falls through to BASE_SKILL_PERSONALITIES
    skillPersonalities: {},

    // No ancientPersonalities — falls through to base
    ancientPersonalities: {},

    substanceKeywords: ['drink', 'drug', 'substance', 'pill'],
    currencyKeywords: ['money', 'cash', 'coin', 'payment'],
};
