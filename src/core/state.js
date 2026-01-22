/**
 * The Tribunal - State Management
 * Central state accessors and mutators
 * 
 * This is the main API for accessing/modifying state.
 * All state changes go through these functions.
 */

import { 
    getChatState, 
    saveChatState, 
    getSettings as _getSettings, 
    saveSettings as _saveSettings,
    getProgression 
} from './persistence.js';

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS from persistence.js
// So other modules can import everything from state.js
// ═══════════════════════════════════════════════════════════════

export { getSettings, saveSettings, getChatState } from './persistence.js';

// ═══════════════════════════════════════════════════════════════
// VITALS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current vitals
 * @returns {object} Vitals object
 */
export function getVitals() {
    const state = getChatState();
    return state?.vitals || { health: 100, maxHealth: 100, morale: 100, maxMorale: 100, status: 'stable' };
}

/**
 * Update vitals
 * @param {object} updates - Partial vitals update
 */
export function updateVitals(updates) {
    const state = getChatState();
    if (!state) return;
    
    Object.assign(state.vitals, updates);
    
    // Auto-calculate status
    const healthPercent = state.vitals.maxHealth > 0 
        ? (state.vitals.health / state.vitals.maxHealth) * 100 
        : 0;
    const moralePercent = state.vitals.maxMorale > 0 
        ? (state.vitals.morale / state.vitals.maxMorale) * 100 
        : 0;
    const lowest = Math.min(healthPercent, moralePercent);
    
    if (state.vitals.health <= 0 || state.vitals.morale <= 0) {
        state.vitals.status = 'dead';
    } else if (lowest < 15) {
        state.vitals.status = 'critical';
    } else if (lowest < 30) {
        state.vitals.status = 'compromised';
    } else if (lowest > 80) {
        state.vitals.status = 'thriving';
    } else {
        state.vitals.status = 'stable';
    }
    
    saveChatState();
}

/**
 * Set health value
 * @param {number} value - New health value
 */
export function setHealth(value) {
    updateVitals({ health: Math.max(0, value) });
}

/**
 * Set morale value
 * @param {number} value - New morale value
 */
export function setMorale(value) {
    updateVitals({ morale: Math.max(0, value) });
}

/**
 * Apply damage
 * @param {number} amount - Damage amount
 * @param {'health'|'morale'} type - Damage type
 */
export function applyDamage(amount, type = 'health') {
    const vitals = getVitals();
    if (type === 'health') {
        setHealth(vitals.health - amount);
    } else {
        setMorale(vitals.morale - amount);
    }
}

/**
 * Apply healing
 * @param {number} amount - Heal amount
 * @param {'health'|'morale'} type - Heal type
 */
export function applyHealing(amount, type = 'health') {
    const vitals = getVitals();
    if (type === 'health') {
        setHealth(Math.min(vitals.health + amount, vitals.maxHealth));
    } else {
        setMorale(Math.min(vitals.morale + amount, vitals.maxMorale));
    }
}

/**
 * Set copotype
 * @param {string|null} copotype - Copotype identifier
 */
export function setCopotype(copotype) {
    updateVitals({ copotype });
}

/**
 * Add active effect
 * @param {object} effect - { id, name, description, type: 'boost'|'debuff' }
 */
export function addActiveEffect(effect) {
    const state = getChatState();
    if (!state) return;
    
    // Remove existing effect with same ID
    state.vitals.activeEffects = state.vitals.activeEffects.filter(e => e.id !== effect.id);
    state.vitals.activeEffects.push(effect);
    saveChatState();
}

/**
 * Remove active effect
 * @param {string} effectId - Effect ID to remove
 */
export function removeActiveEffect(effectId) {
    const state = getChatState();
    if (!state) return;
    
    state.vitals.activeEffects = state.vitals.activeEffects.filter(e => e.id !== effectId);
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// ATTRIBUTES & SKILLS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all attributes
 * @returns {object} Attributes object
 */
export function getAttributes() {
    const state = getChatState();
    return state?.attributes || { intellect: 3, psyche: 3, physique: 3, motorics: 3 };
}

/**
 * Set an attribute value
 * @param {string} attr - Attribute name
 * @param {number} value - New value (1-6)
 */
export function setAttribute(attr, value) {
    const state = getChatState();
    if (!state) return;
    
    state.attributes[attr] = Math.max(1, Math.min(6, value));
    saveChatState();
}

/**
 * Get effective skill level (base + bonuses)
 * @param {string} skillId - Skill identifier
 * @returns {number} Effective skill level
 */
export function getSkillLevel(skillId) {
    const state = getChatState();
    if (!state) return 1;
    
    const base = state.skillLevels?.[skillId] || getBaseSkillLevel(skillId);
    const bonus = state.skillBonuses?.[skillId] || 0;
    
    return base + bonus;
}

/**
 * Get base skill level from parent attribute
 * @param {string} skillId - Skill identifier
 * @returns {number} Base level from attribute
 */
function getBaseSkillLevel(skillId) {
    // TODO: Map skills to attributes when skills.js is implemented
    return 3; // Default to middle value
}

/**
 * Set a skill bonus
 * @param {string} skillId - Skill identifier
 * @param {number} bonus - Bonus value (can be negative)
 */
export function setSkillBonus(skillId, bonus) {
    const state = getChatState();
    if (!state) return;
    
    if (bonus === 0) {
        delete state.skillBonuses[skillId];
    } else {
        state.skillBonuses[skillId] = bonus;
    }
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// THOUGHT CABINET
// ═══════════════════════════════════════════════════════════════

/**
 * Get thought cabinet state
 * @returns {object} Thought cabinet data
 */
export function getThoughtCabinet() {
    const state = getChatState();
    return state?.thoughtCabinet || { slots: 4, discovered: [], researching: {}, internalized: [] };
}

/**
 * Discover a new thought
 * @param {string} thoughtId - Thought ID
 */
export function discoverThought(thoughtId) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.thoughtCabinet.discovered.includes(thoughtId)) {
        state.thoughtCabinet.discovered.push(thoughtId);
        saveChatState();
    }
}

/**
 * Start researching a thought
 * @param {string} thoughtId - Thought ID
 * @param {string} slot - Slot to use ('int', 'psy', 'fys', 'mot')
 * @returns {boolean} Success
 */
export function startResearch(thoughtId, slot) {
    const state = getChatState();
    if (!state) return false;
    
    // Check if slot is already in use
    const existingInSlot = Object.values(state.thoughtCabinet.researching).find(r => r.slot === slot);
    if (existingInSlot) return false;
    
    // Check if thought is already being researched
    if (state.thoughtCabinet.researching[thoughtId]) return false;
    
    state.thoughtCabinet.researching[thoughtId] = {
        progress: 0,
        startedAt: Date.now(),
        slot
    };
    
    // Remove from discovered
    state.thoughtCabinet.discovered = state.thoughtCabinet.discovered.filter(id => id !== thoughtId);
    
    saveChatState();
    return true;
}

/**
 * Progress research on a thought
 * @param {string} thoughtId - Thought ID
 * @param {number} amount - Progress amount (default from settings)
 * @returns {boolean} True if completed
 */
export function progressResearch(thoughtId, amount = null) {
    const state = getChatState();
    if (!state) return false;
    
    const research = state.thoughtCabinet.researching[thoughtId];
    if (!research) return false;
    
    const settings = _getSettings();
    const progressAmount = amount ?? settings.thoughts?.researchRate ?? 1;
    
    research.progress += progressAmount;
    
    // Check completion (100% = done)
    if (research.progress >= 100) {
        return internalizeThought(thoughtId);
    }
    
    saveChatState();
    return false;
}

/**
 * Internalize a thought (complete research)
 * @param {string} thoughtId - Thought ID
 * @returns {boolean} Success
 */
export function internalizeThought(thoughtId) {
    const state = getChatState();
    if (!state) return false;
    
    const settings = _getSettings();
    const maxInternalized = settings.thoughts?.maxInternalized ?? 5;
    
    // Check capacity
    if (state.thoughtCabinet.internalized.length >= maxInternalized) {
        return false;
    }
    
    // Remove from researching
    delete state.thoughtCabinet.researching[thoughtId];
    
    // Add to internalized
    state.thoughtCabinet.internalized.push({
        id: thoughtId,
        internalizedAt: Date.now()
    });
    
    saveChatState();
    return true;
}

/**
 * Forget (remove) an internalized thought
 * @param {string} thoughtId - Thought ID
 */
export function forgetThought(thoughtId) {
    const state = getChatState();
    if (!state) return;
    
    state.thoughtCabinet.internalized = state.thoughtCabinet.internalized.filter(
        t => t.id !== thoughtId
    );
    saveChatState();
}

/**
 * Add a theme to the cabinet (for thought discovery)
 * @param {string} theme - Theme identifier
 */
export function addTheme(theme) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.thoughtCabinet.themes) {
        state.thoughtCabinet.themes = {};
    }
    
    state.thoughtCabinet.themes[theme] = (state.thoughtCabinet.themes[theme] || 0) + 1;
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Get inventory
 * @returns {object} Inventory data
 */
export function getInventory() {
    const state = getChatState();
    return state?.inventory || { carried: [], worn: [], stored: [], money: 0, moneyUnit: 'réal' };
}

/**
 * Add an item to inventory
 * @param {object} item - Item object
 * @param {string} location - 'carried', 'worn', or 'stored'
 */
export function addItem(item, location = 'carried') {
    const state = getChatState();
    if (!state) return;
    
    if (!item.id) {
        item.id = `item_${Date.now()}`;
    }
    
    const inv = state.inventory;
    if (location === 'carried') inv.carried.push(item);
    else if (location === 'worn') inv.worn.push(item);
    else if (location === 'stored') inv.stored.push(item);
    
    saveChatState();
}

/**
 * Remove an item from inventory
 * @param {string} itemId - Item ID
 * @returns {object|null} Removed item or null
 */
export function removeItem(itemId) {
    const state = getChatState();
    if (!state) return null;
    
    const inv = state.inventory;
    
    for (const location of ['carried', 'worn', 'stored']) {
        const idx = inv[location].findIndex(i => i.id === itemId);
        if (idx !== -1) {
            const [removed] = inv[location].splice(idx, 1);
            saveChatState();
            return removed;
        }
    }
    
    return null;
}

/**
 * Move an item between inventory locations
 * @param {string} itemId - Item ID
 * @param {string} toLocation - Target location
 */
export function moveItem(itemId, toLocation) {
    const item = removeItem(itemId);
    if (item) {
        addItem(item, toLocation);
    }
}

/**
 * Update money amount
 * @param {number} delta - Change in money (can be negative)
 */
export function updateMoney(delta) {
    const state = getChatState();
    if (!state) return;
    
    state.inventory.money = Math.max(0, (state.inventory.money || 0) + delta);
    saveChatState();
}

/**
 * Set money unit (e.g., réal, credits)
 * @param {string} unit - Unit name
 */
export function setMoneyUnit(unit) {
    const state = getChatState();
    if (!state) return;
    
    state.inventory.moneyUnit = unit;
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// LEDGER (Cases, Notes, Weather, Time)
// ═══════════════════════════════════════════════════════════════

/**
 * Get ledger data
 * @returns {object} Ledger data
 */
export function getLedger() {
    const state = getChatState();
    return state?.ledger || { cases: [], notes: [], weather: {}, time: {}, locations: [] };
}

/**
 * Add a case
 * @param {object} caseData - Case object
 */
export function addCase(caseData) {
    const state = getChatState();
    if (!state) return;
    
    if (!caseData.id) {
        caseData.id = `case_${Date.now()}`;
    }
    
    state.ledger.cases.push({
        ...caseData,
        status: caseData.status || 'open',
        createdAt: Date.now()
    });
    
    saveChatState();
}

/**
 * Update a case
 * @param {string} caseId - Case ID
 * @param {object} updates - Partial updates
 */
export function updateCase(caseId, updates) {
    const state = getChatState();
    if (!state) return;
    
    const caseIdx = state.ledger.cases.findIndex(c => c.id === caseId);
    if (caseIdx === -1) return;
    
    Object.assign(state.ledger.cases[caseIdx], updates);
    saveChatState();
}

/**
 * Add a note to the ledger
 * @param {string} text - Note text
 */
export function addNote(text) {
    const state = getChatState();
    if (!state) return;
    
    const ledgerTime = state.ledger.time?.display || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    state.ledger.notes.push({
        timestamp: ledgerTime,
        text,
        createdAt: Date.now()
    });
    saveChatState();
}

/**
 * Set weather
 * @param {object} weather - { condition, description, icon }
 */
export function setWeather(weather) {
    const state = getChatState();
    if (!state) return;
    
    state.ledger.weather = { ...state.ledger.weather, ...weather };
    saveChatState();
}

/**
 * Set time
 * @param {object} time - { display, period }
 */
export function setTime(time) {
    const state = getChatState();
    if (!state) return;
    
    state.ledger.time = { ...state.ledger.time, ...time };
    saveChatState();
}

/**
 * Add a location
 * @param {object} location - { id, name, description, discovered }
 */
export function addLocation(location) {
    const state = getChatState();
    if (!state) return;
    
    if (!location.id) {
        location.id = `loc_${Date.now()}`;
    }
    
    // Don't add duplicates
    if (!state.ledger.locations.find(l => l.id === location.id)) {
        state.ledger.locations.push(location);
        saveChatState();
    }
}


// ═══════════════════════════════════════════════════════════════
// RELATIONSHIPS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all relationships
 * @returns {object} Relationships keyed by NPC ID
 */
export function getRelationships() {
    const state = getChatState();
    return state?.relationships || {};
}

/**
 * Get a specific relationship
 * @param {string} npcId - NPC identifier
 * @returns {object|null} Relationship data
 */
export function getRelationship(npcId) {
    const relationships = getRelationships();
    return relationships[npcId] || null;
}

/**
 * Add or update a relationship
 * @param {object} npcData - NPC relationship data
 */
export function addRelationship(npcData) {
    const state = getChatState();
    if (!state) return;
    
    if (!npcData.id) return;
    
    // Merge with existing if present
    const existing = state.relationships[npcData.id] || {};
    state.relationships[npcData.id] = {
        ...existing,
        ...npcData,
        voiceOpinions: { ...existing.voiceOpinions, ...npcData.voiceOpinions }
    };
    
    saveChatState();
}

/**
 * Update favor for an NPC
 * @param {string} npcId - NPC ID
 * @param {number} delta - Amount to change (-5 to +5 scale)
 */
export function updateFavor(npcId, delta) {
    const state = getChatState();
    if (!state) return;
    
    const rel = state.relationships[npcId];
    if (!rel) return;
    
    rel.favor = Math.max(-5, Math.min(5, (rel.favor || 0) + delta));
    saveChatState();
}

/**
 * Set a voice's opinion of an NPC
 * @param {string} npcId - NPC ID
 * @param {string} voiceId - Voice/skill ID
 * @param {number} value - Opinion value (-5 to +5)
 * @param {string} quip - Optional quip text
 */
export function setVoiceOpinion(npcId, voiceId, value, quip = '') {
    const state = getChatState();
    if (!state) return;
    
    const rel = state.relationships[npcId];
    if (!rel) return;
    
    if (!rel.voiceOpinions) rel.voiceOpinions = {};
    
    rel.voiceOpinions[voiceId] = {
        value: Math.max(-5, Math.min(5, value)),
        quip
    };
    
    // Update dominant voice
    updateDominantVoice(npcId);
    saveChatState();
}

/**
 * Calculate and update dominant voice for an NPC
 * @param {string} npcId - NPC ID
 */
function updateDominantVoice(npcId) {
    const state = getChatState();
    if (!state) return;
    
    const rel = state.relationships[npcId];
    if (!rel?.voiceOpinions) return;
    
    let dominant = null;
    let strongestAbs = 0;
    
    for (const [voiceId, opinion] of Object.entries(rel.voiceOpinions)) {
        const abs = Math.abs(opinion.value);
        if (abs > strongestAbs) {
            strongestAbs = abs;
            dominant = { voiceId, ...opinion };
        }
    }
    
    if (dominant) {
        rel.dominantVoice = dominant.voiceId;
        rel.dominantQuip = dominant.quip;
    }
}

/**
 * Get dominant voice for an NPC
 * @param {string} npcId - NPC ID
 * @returns {object|null} { voiceId, value, quip }
 */
export function getDominantVoice(npcId) {
    const rel = getRelationship(npcId);
    if (!rel?.voiceOpinions) return null;
    
    let dominant = null;
    let strongestAbs = 0;
    
    for (const [voiceId, opinion] of Object.entries(rel.voiceOpinions)) {
        const abs = Math.abs(opinion.value);
        if (abs > strongestAbs) {
            strongestAbs = abs;
            dominant = { voiceId, ...opinion };
        }
    }
    
    return dominant;
}


// ═══════════════════════════════════════════════════════════════
// VOICES
// ═══════════════════════════════════════════════════════════════

/**
 * Get voice state
 * @returns {object} Voice state data
 */
export function getVoiceState() {
    const state = getChatState();
    return state?.voices || { lastGenerated: [], awakenedVoices: [], activeInvestigation: null, discoveredClues: [] };
}

/**
 * Set last generated voices
 * @param {array} voices - Array of generated voice lines
 */
export function setLastGeneratedVoices(voices) {
    const state = getChatState();
    if (!state) return;
    
    state.voices.lastGenerated = voices;
    saveChatState();
}

/**
 * Mark a voice as awakened (has spoken this playthrough)
 * @param {string} voiceId - Voice ID
 */
export function awakenVoice(voiceId) {
    const state = getChatState();
    if (!state) return;
    
    if (!state.voices.awakenedVoices.includes(voiceId)) {
        state.voices.awakenedVoices.push(voiceId);
        saveChatState();
    }
}

/**
 * Set active investigation
 * @param {object|null} investigation - Investigation context
 */
export function setActiveInvestigation(investigation) {
    const state = getChatState();
    if (!state) return;
    
    state.voices.activeInvestigation = investigation;
    saveChatState();
}

/**
 * Add a discovered clue
 * @param {object} clue - Clue object
 */
export function addDiscoveredClue(clue) {
    const state = getChatState();
    if (!state) return;
    
    if (!clue.id) {
        clue.id = `clue_${Date.now()}`;
    }
    
    state.voices.discoveredClues.push(clue);
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// PERSONA
// ═══════════════════════════════════════════════════════════════

/**
 * Get persona data
 * @returns {object} Persona data
 */
export function getPersona() {
    const state = getChatState();
    return state?.persona || { name: '', pronouns: 'they', povStyle: 'second', context: '' };
}

/**
 * Update persona
 * @param {object} updates - Partial persona update
 */
export function setPersona(updates) {
    const state = getChatState();
    if (!state) return;
    
    Object.assign(state.persona, updates);
    saveChatState();
}


// ═══════════════════════════════════════════════════════════════
// META
// ═══════════════════════════════════════════════════════════════

/**
 * Increment message count
 */
export function incrementMessageCount() {
    const state = getChatState();
    if (!state) return;
    
    state.meta.messageCount++;
    saveChatState();
}

/**
 * Get message count
 * @returns {number}
 */
export function getMessageCount() {
    const state = getChatState();
    return state?.meta?.messageCount || 0;
}
