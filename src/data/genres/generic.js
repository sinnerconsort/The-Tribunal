/** Genre: Generic — clean voices, no genre flavor. Uses base personalities. */
export const profile = {
    id: 'generic', name: 'Generic',
    description: 'Clean internal voices for any setting',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a roleplayer.`,
    toneGuide: `WRITING STYLE: Clean, modern, conversational but sharp. No genre affectation.\nSENTENCE PATTERN: Natural mix of short and medium.\nEXAMPLE:\nLOGIC - Three options. Two are bad. The third is worse but honest.\nEMPATHY - They're scared. Not of you — of what happens if they trust you.`,
    thoughtSystemName: 'the inner council', thoughtStyleName: 'the thought cabinet',
    thoughtStyleDescription: 'introspective internal thought',
    currency: 'coins',
    defaultWeather: { condition: 'clear', description: 'Clear skies.', icon: 'fa-sun' },
    equipmentSectionName: 'Belongings',
    liminalEffect: { name: 'The Void', cssClass: 'pale', pattern: /\b(void|unconscious|dreaming|limbo|nothingness)\b/i, description: 'The space between thoughts.' },
    archetypeLabel: 'Archetype', archetypeLabelPlural: 'Archetypes',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: [], currencyKeywords: [],
};
