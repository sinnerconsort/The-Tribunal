/** Genre: Post-Apocalyptic — stub, to be fleshed out. */
export const profile = {
    id: 'post_apocalyptic', name: 'Post-Apocalyptic',
    description: 'Survival and gallows humor in a world that already ended',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a post-apocalyptic story.`,
    toneGuide: `WRITING STYLE: Grim pragmatism with absurdist gallows humor. The apocalypse is objectively hilarious if you're still alive to notice. Mix survival math with dark comedy.\nSENTENCE PATTERN: Practical voices are blunt. "Water: two days. Food: one. Walk faster." Absurdist voices find the comedy. "The irony of starving next to a billboard for all-you-can-eat shrimp."\nEXAMPLE:\nLOGIC - Rations for three days. Four if we skip morality.\nENCYCLOPEDIA - Before the collapse, this was a Costco. Bulk goods. Family values. Rats the size of labradors.\nVOLITION - The world ended. You didn't. Keep going.`,
    thoughtSystemName: 'the survivor\'s council', thoughtStyleName: 'the survival log',
    thoughtStyleDescription: 'post-apocalyptic introspection',
    currency: 'caps',
    defaultWeather: { condition: 'dust', description: 'Dust and silence. The wind tastes like rust.', icon: 'fa-wind' },
    equipmentSectionName: 'Salvage',
    liminalEffect: { name: 'The Ruin', cssClass: 'pale', pattern: /\b(ruin|void|unconscious|wasteland|the\s+before|radiation|collapse)\b/i, description: 'Echoes of the world that was.' },
    archetypeLabel: 'Survivor Type', archetypeLabelPlural: 'Survivor Types',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: ['moonshine', 'chems', 'stims', 'rad'], currencyKeywords: ['cap', 'barter', 'trade'],
};
