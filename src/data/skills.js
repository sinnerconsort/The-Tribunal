/**
 * src/data/skills.js - SKILLS, ATTRIBUTES definitions
 * Pure data - imports nothing
 */

export const ATTRIBUTES = {
    INT: { name: 'Intellect', color: '#7ea1c4' },
    PSY: { name: 'Psyche', color: '#9b7eb4' },
    FYS: { name: 'Physique', color: '#c47e7e' },
    MOT: { name: 'Motorics', color: '#c4b47e' }
};

export const SKILLS = {
    logic: { name: 'Logic', attribute: 'INT', color: '#7ea1c4' },
    encyclopedia: { name: 'Encyclopedia', attribute: 'INT', color: '#7ea1c4' },
    rhetoric: { name: 'Rhetoric', attribute: 'INT', color: '#7ea1c4' },
    drama: { name: 'Drama', attribute: 'INT', color: '#7ea1c4' },
    conceptualization: { name: 'Conceptualization', attribute: 'INT', color: '#7ea1c4' },
    visualCalculus: { name: 'Visual Calculus', attribute: 'INT', color: '#7ea1c4' },
    volition: { name: 'Volition', attribute: 'PSY', color: '#9b7eb4' },
    inlandEmpire: { name: 'Inland Empire', attribute: 'PSY', color: '#9b7eb4' },
    empathy: { name: 'Empathy', attribute: 'PSY', color: '#9b7eb4' },
    authority: { name: 'Authority', attribute: 'PSY', color: '#9b7eb4' },
    espritDeCorps: { name: 'Esprit de Corps', attribute: 'PSY', color: '#9b7eb4' },
    suggestion: { name: 'Suggestion', attribute: 'PSY', color: '#9b7eb4' },
    endurance: { name: 'Endurance', attribute: 'FYS', color: '#c47e7e' },
    painThreshold: { name: 'Pain Threshold', attribute: 'FYS', color: '#c47e7e' },
    physicalInstrument: { name: 'Physical Instrument', attribute: 'FYS', color: '#c47e7e' },
    electrochemistry: { name: 'Electrochemistry', attribute: 'FYS', color: '#c47e7e' },
    shivers: { name: 'Shivers', attribute: 'FYS', color: '#c47e7e' },
    halfLight: { name: 'Half Light', attribute: 'FYS', color: '#c47e7e' },
    handEyeCoordination: { name: 'Hand/Eye Coordination', attribute: 'MOT', color: '#c4b47e' },
    perception: { name: 'Perception', attribute: 'MOT', color: '#c4b47e' },
    reactionSpeed: { name: 'Reaction Speed', attribute: 'MOT', color: '#c4b47e' },
    savoirFaire: { name: 'Savoir Faire', attribute: 'MOT', color: '#c4b47e' },
    interfacing: { name: 'Interfacing', attribute: 'MOT', color: '#c4b47e' },
    composure: { name: 'Composure', attribute: 'MOT', color: '#c4b47e' }
};

export const ANCIENT_VOICES = {
    limbicSystem: { name: 'Limbic System', color: '#4a3a2a', trigger: 'unconscious' },
    reptilianBrain: { name: 'Reptilian Brain', color: '#2a3a2a', trigger: 'primal' }
};

export function getSkillColor(id) { return SKILLS[id]?.color || '#a3a3a3'; }
export function getSkillName(id) { return SKILLS[id]?.name || id; }
