/** Genre: Space Opera — stub, to be fleshed out. */
export const profile = {
    id: 'space_opera', name: 'Space Opera',
    description: 'Internal voices aboard a starship — the officer, the void, the survival instinct',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a space opera.`,
    toneGuide: `WRITING STYLE: Military efficiency undercut by the cosmic sublime. Technical voices use jargon and brevity. Mystic voices confront the scale of the universe. The tension is between procedure and awe.\nSENTENCE PATTERN: Technical voices: clipped, acronym-heavy. Mystic voices: vast, slow, confronting infinity.\nEXAMPLE:\nLOGIC - Oxygen: fourteen hours. Crew: six. Math doesn't negotiate.\nSHIVERS - This system is old. The star is tired. A billion years of burning. Almost done.\nHALF LIGHT - Don't open that airlock. The pressure readings are TOO normal.`,
    thoughtSystemName: 'the officer\'s inner council', thoughtStyleName: 'the bridge log',
    thoughtStyleDescription: 'space opera introspection',
    currency: 'credits',
    defaultWeather: { condition: 'vacuum', description: 'Stars burn cold outside the viewport.', icon: 'fa-moon' },
    equipmentSectionName: 'The Locker',
    liminalEffect: { name: 'The Void', cssClass: 'pale', pattern: /\b(void|unconscious|dreaming|cryosleep|deep\s+space|hyperspace|limbo)\b/i, description: 'The space between stars. It watches back.' },
    archetypeLabel: 'Specialty', archetypeLabelPlural: 'Specialties',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: ['synth', 'stim', 'narco', 'spice'], currencyKeywords: ['credit', 'cred', 'chit'],
};
