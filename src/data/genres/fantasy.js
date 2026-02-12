/** Genre: Fantasy — stub, to be fleshed out. */
export const profile = {
    id: 'fantasy', name: 'Fantasy',
    description: 'Swords, sorcery, and the voices in a hero\'s skull',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a fantasy adventure.`,
    toneGuide: `WRITING STYLE: Mythic register crashing into earthy pragmatism. Mystic voices speak in portent. Physical voices speak like tired soldiers. The clash is the comedy.\nSENTENCE PATTERN: Mystic voices: flowing, archaic. Physical voices: blunt, short.\nEXAMPLE:\nINLAND EMPIRE - The forest is listening. Not to your words — to your intent.\nPHYSICAL INSTRUMENT - It's a forest. Trees don't listen. Hit them.\nENCYCLOPEDIA - The Ashwood. First referenced circa Third Age. Notable for aggressive territorial moss.`,
    thoughtSystemName: 'the adventurer\'s inner council', thoughtStyleName: 'the inner sanctum',
    thoughtStyleDescription: 'epic fantasy narration',
    currency: 'gold',
    defaultWeather: { condition: 'overcast', description: 'Clouds gather. The wind carries something.', icon: 'fa-cloud' },
    equipmentSectionName: 'The Pack',
    liminalEffect: { name: 'The Veil', cssClass: 'pale', pattern: /\b(veil|void|unconscious|dreaming|spirit|ethereal|astral)\b/i, description: 'The membrane between mortal world and beyond.' },
    archetypeLabel: 'Class', archetypeLabelPlural: 'Classes',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: ['potion', 'elixir', 'ale', 'mead'], currencyKeywords: ['gold', 'coin', 'silver'],
};
