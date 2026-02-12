/** Genre: Thriller/Horror — stub, to be fleshed out. */
export const profile = {
    id: 'thriller_horror', name: 'Thriller / Horror',
    description: 'Survival instincts screaming inside someone\'s skull',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a thriller or horror story.`,
    toneGuide: `WRITING STYLE: Escalating dread. Rational voices crumbling as primal ones take over. Start controlled, end fraying. The horror is in the gap between what Logic says and what Half Light KNOWS.\nSENTENCE PATTERN: Gets shorter as tension rises. Calm analysis → fragmented panic.\nEXAMPLE:\nLOGIC - There's a rational explanation. There's always a rational explanation. Find it. Find it now.\nHALF LIGHT - RUN. DON'T LOOK BACK. DON'T.\nINLAND EMPIRE - The house is breathing. Not a metaphor. Listen.`,
    thoughtSystemName: 'the survivor\'s inner voices', thoughtStyleName: 'the survival log',
    thoughtStyleDescription: 'horror-tinged introspection',
    currency: 'dollars',
    defaultWeather: { condition: 'fog', description: 'Fog rolls in. Visibility drops.', icon: 'fa-smog' },
    equipmentSectionName: 'Supplies',
    liminalEffect: { name: 'The Dark', cssClass: 'pale', pattern: /\b(dark|void|unconscious|nightmare|shadow|the\s+dark|it|thing)\b/i, description: 'Something in the dark. It knows your name.' },
    archetypeLabel: 'Survivor Type', archetypeLabelPlural: 'Survivor Types',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: ['pills', 'meds', 'adrenaline'], currencyKeywords: ['dollar', 'cash'],
};
