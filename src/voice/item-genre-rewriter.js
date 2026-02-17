/**
 * The Tribunal - Item Genre Rewriter
 * 
 * Shared system for equipment AND inventory genre theming.
 * 
 * Two tiers:
 *   1. Genre-aware fallbacks (instant) — when AI generation fails,
 *      produce themed descriptions and quips instead of DE-hardcoded ones.
 *   2. API re-enrichment (manual) — re-generate description and quips
 *      for existing items using the active genre's framing.
 * 
 * Also provides genre-aware skill references for generation prompts.
 * 
 * @version 1.0.0
 */

import { callAPIWithTokens } from './api-helpers.js';
import { getProfileValue } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// GENRE-AWARE SKILL REFERENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Get the skill reference block for generation prompts.
 * Uses genre-mapped skill names instead of hardcoded DE names.
 * 
 * The mechanical IDs stay the same (logic, inland_empire, etc.)
 * but the prompt presents them with genre-appropriate labels so
 * the AI writes quips in the right voice.
 */
export function getGenreSkillReference() {
    // Try to get genre-mapped skill names
    const getSkill = (id) => {
        const mapped = getProfileValue(`skillNames.${id}`);
        return mapped || id.replace(/_/g, ' ');
    };
    
    return `
INTELLECT: ${getSkill('logic')}, ${getSkill('encyclopedia')}, ${getSkill('rhetoric')}, ${getSkill('drama')}, ${getSkill('conceptualization')}, ${getSkill('visual_calculus')}
PSYCHE: ${getSkill('volition')}, ${getSkill('inland_empire')}, ${getSkill('empathy')}, ${getSkill('authority')}, ${getSkill('esprit_de_corps')}, ${getSkill('suggestion')}
PHYSIQUE: ${getSkill('endurance')}, ${getSkill('pain_threshold')}, ${getSkill('physical_instrument')}, ${getSkill('electrochemistry')}, ${getSkill('shivers')}, ${getSkill('half_light')}
MOTORICS: ${getSkill('hand_eye_coordination')}, ${getSkill('perception')}, ${getSkill('reaction_speed')}, ${getSkill('savoir_faire')}, ${getSkill('interfacing')}, ${getSkill('composure')}
`;
}

/**
 * Get genre-aware bonus guidelines for equipment generation.
 * Maps "Intimidating → authority" style hints to genre-appropriate language.
 */
export function getGenreBonusGuidelines() {
    const frame = getProfileValue('promptFrames.itemBonusGuide');
    
    if (frame) return frame;
    
    // Default (genre-neutral descriptions of what skills respond to)
    return `BONUS GUIDELINES (1-3 skills, values -2 to +2):
- Intimidating/tough items → physical skills, authority
- Stylish/flashy items → social skills, composure, drama
- Worn/rugged items → endurance, perception
- Technical/gadgets → interfacing, analytical skills
- Weird/mystical items → intuition, creativity
- Revealing/bold items → drama, composure, impulse`;
}

// ═══════════════════════════════════════════════════════════════
// GENRE FALLBACKS (instant, free)
// ═══════════════════════════════════════════════════════════════

/**
 * Get a genre-appropriate fallback description for an item
 * Used when AI generation fails entirely
 * 
 * @param {string} name - Item name
 * @param {string} type - Item type (jacket, cigarettes, key, etc.)
 * @param {string} category - 'equipment' or 'inventory'
 * @returns {string}
 */
export function getGenreFallbackDescription(name, type, category = 'inventory') {
    const templates = getProfileValue('promptFrames.itemFallbacks');
    
    if (templates?.description) {
        // Genre profile has a description template
        const tmpl = typeof templates.description === 'function'
            ? templates.description
            : (n) => templates.description.replace('{name}', n);
        return tmpl(name);
    }
    
    // Neutral default
    return `A ${name.toLowerCase()}. It's yours.`;
}

/**
 * Get genre-appropriate fallback quips for an item type
 * Used when AI generation fails
 * 
 * @param {string} type - Item type (cigarettes, alcohol, key, etc.)
 * @returns {Array<{skill: string, text: string, approves: boolean}>}
 */
export function getGenreFallbackQuips(type) {
    // Check for genre-specific fallback quips
    const genreQuips = getProfileValue('promptFrames.itemFallbackQuips');
    
    if (genreQuips?.[type]) {
        return genreQuips[type];
    }
    
    // If genre has a generic quip generator
    if (genreQuips?.generic) {
        return genreQuips.generic(type);
    }
    
    // Neutral defaults — no personality, just functional
    const neutralQuips = {
        cigarettes: [
            { skill: 'electrochemistry', text: 'The craving speaks for itself.', approves: true },
            { skill: 'volition', text: 'You don\'t need this.', approves: false }
        ],
        alcohol: [
            { skill: 'electrochemistry', text: 'A drink. The easy answer.', approves: true },
            { skill: 'logic', text: 'This solves nothing.', approves: false }
        ],
        stimulants: [
            { skill: 'electrochemistry', text: 'Energy in chemical form.', approves: true },
            { skill: 'endurance', text: 'There will be a cost.', approves: false }
        ],
        medicine: [
            { skill: 'logic', text: 'Take as directed.', approves: true },
            { skill: 'electrochemistry', text: 'Boring but necessary.', approves: false }
        ],
        food: [
            { skill: 'endurance', text: 'Fuel. You need it.', approves: true },
            { skill: 'composure', text: 'At least eat like a person.', approves: false }
        ],
        key: [
            { skill: 'logic', text: 'This opens something. Keep it.', approves: true },
            { skill: 'inland_empire', text: 'What waits on the other side?', approves: true }
        ],
        document: [
            { skill: 'encyclopedia', text: 'Read carefully.', approves: true },
            { skill: 'rhetoric', text: 'What isn\'t it saying?', approves: true }
        ],
        weapon: [
            { skill: 'half_light', text: 'You might need this.', approves: true },
            { skill: 'empathy', text: 'Let\'s hope you don\'t.', approves: false }
        ]
    };
    
    return neutralQuips[type] || [
        { skill: 'perception', text: 'You have this now.', approves: true },
        { skill: 'logic', text: 'Is it useful?', approves: true }
    ];
}

// ═══════════════════════════════════════════════════════════════
// API RE-ENRICHMENT (manual, costs a call per item)
// ═══════════════════════════════════════════════════════════════

const ENRICH_MAX_TOKENS = 400;

/**
 * Re-generate description and quips for an existing item
 * using the active genre's framing.
 * 
 * Does NOT change: name, type, bonuses, effectId, addictive flags
 * DOES change: description, voiceQuips
 * 
 * @param {object} item - Existing item object (equipment or inventory)
 * @param {Object} [options]
 * @param {string} [options.category='inventory'] - 'equipment' or 'inventory'
 * @returns {Promise<{description: string, voiceQuips: Array, enriched: boolean}|null>}
 */
export async function enrichItem(item, { category = 'inventory' } = {}) {
    if (!item?.name) return null;
    
    console.log(`[Tribunal] Enriching ${category} item: ${item.name}`);
    
    const genreIntro = getProfileValue('systemIntro', 
        'You are channeling the internal skill voices of a character.');
    const toneGuide = getProfileValue('toneGuide') || '';
    const genreFrame = category === 'equipment' 
        ? getProfileValue('promptFrames.equipment') || ''
        : getProfileValue('promptFrames.inventory') || '';
    const skillRef = getGenreSkillReference();
    
    const systemPrompt = `${genreIntro}

${toneGuide ? `TONE:\n${toneGuide}\n` : ''}
${genreFrame ? `ITEM STYLE:\n${genreFrame}\n` : ''}
You re-describe items for a roleplay tracking system. 
Output ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Re-describe this ${category} item in the voice of the current setting:

ITEM: ${item.name}
TYPE: ${item.type || 'other'}
${item.addictive ? 'ADDICTIVE: Yes' : ''}

<skills>
${skillRef}
</skills>

Respond with ONLY this JSON:
{
  "description": "2-3 sentence evocative description matching the setting's tone.",
  "voiceQuips": [
    {"skill": "skill_id", "text": "Approving one-liner in the setting's voice", "approves": true},
    {"skill": "other_skill", "text": "Different perspective one-liner", "approves": false}
  ]
}

Use skill IDs from the list above. Keep quips under 15 words.`;

    try {
        const response = await callAPIWithTokens(systemPrompt, userPrompt, ENRICH_MAX_TOKENS);
        if (!response) return null;
        
        // Parse JSON from response
        let parsed;
        try {
            // Try to find JSON in response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('[Tribunal] Could not parse enrichment response:', e);
            return null;
        }
        
        if (!parsed?.description) return null;
        
        console.log(`[Tribunal] Enriched ${item.name}:`, parsed.description.substring(0, 60));
        
        return {
            description: parsed.description,
            voiceQuips: Array.isArray(parsed.voiceQuips) ? parsed.voiceQuips : item.voiceQuips,
            enriched: true
        };
        
    } catch (err) {
        console.error('[Tribunal] Item enrichment failed:', err);
        return null;
    }
}

/**
 * Batch re-enrich items
 * 
 * @param {Array} items - Array of item objects
 * @param {Object} [options]
 * @param {string} [options.category='inventory'] - 'equipment' or 'inventory'
 * @param {number} [options.maxItems=8] - Cap to avoid API spam
 * @param {number} [options.delayMs=500] - Delay between calls
 * @param {boolean} [options.unenrichedOnly=false] - Skip already enriched
 * @returns {Promise<Array>} Array of { itemName, result }
 */
export async function enrichItems(items = [], {
    category = 'inventory',
    maxItems = 8,
    delayMs = 500,
    unenrichedOnly = false
} = {}) {
    const targets = items
        .filter(item => {
            if (unenrichedOnly && item.enriched) return false;
            if (!item.name) return false;
            return true;
        })
        .slice(0, maxItems);
    
    if (targets.length === 0) return [];
    
    console.log(`[Tribunal] Enriching ${targets.length} ${category} items`);
    
    const results = [];
    
    for (const item of targets) {
        const result = await enrichItem(item, { category });
        
        if (result) {
            results.push({ itemName: item.name, result });
        }
        
        if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    
    return results;
}
