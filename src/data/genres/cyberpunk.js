/** Genre: Cyberpunk — stub, to be fleshed out. */
export const profile = {
    id: 'cyberpunk', name: 'Cyberpunk',
    description: 'Chrome and wetware arguing inside an augmented skull',
    author: 'The Tribunal',
    systemIntro: `You generate internal mental voices for a cyberpunk setting.`,
    toneGuide: `WRITING STYLE: Street-level tech noir. The human and the machine arguing. Corporate language corrupting organic thought. Slang-heavy, brand-saturated, identity-fractured.\nSENTENCE PATTERN: Tech voices: data-stream, metrics, cold. Street voices: slang, clipped, hostile. The tension is wetware vs chrome.\nEXAMPLE:\nINTERFACING - Three ICE layers. Military grade. Beautiful architecture. Almost a shame to crack it. Almost.\nHALF LIGHT - That smile's running facial-affect software. Nobody smiles like that with their actual face.\nELECTROCHEMISTRY - Synapse booster. One hit. Colors get sharper. Time gets slower. You get stupider. Worth it.`,
    thoughtSystemName: 'the fragmented inner process', thoughtStyleName: 'the cache',
    thoughtStyleDescription: 'cyberpunk-tinged introspection',
    currency: 'eddies',
    defaultWeather: { condition: 'smog', description: 'Acid rain and neon. The sky is a screen.', icon: 'fa-city' },
    equipmentSectionName: 'Loadout',
    liminalEffect: { name: 'The Signal', cssClass: 'pale', pattern: /\b(signal|void|unconscious|flatline|braindance|the\s+net|cyberspace|glitch)\b/i, description: 'The space between meat and machine.' },
    archetypeLabel: 'Role', archetypeLabelPlural: 'Roles',
    skillPersonalities: {}, ancientPersonalities: {},
    substanceKeywords: ['synapse', 'stim', 'boost', 'chrome'], currencyKeywords: ['eddie', 'cred', 'nuyen'],
};
