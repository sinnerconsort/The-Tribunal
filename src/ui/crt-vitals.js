/**
 * The Tribunal - CRT Vitals & RCM Medical Form
 * Header CRT monitor display + Status tab medical form
 * Extracted from rebuild v0.3.0
 * UPDATED: Added ST context fallback for character name
 */

import { getContext } from '../../../../../extensions.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentVitals = {
    health: 13,
    maxHealth: 13,
    morale: 13,
    maxMorale: 13,
    characterName: 'UNKNOWN'
};

// ═══════════════════════════════════════════════════════════════
// HELPER - Get character name from ST context
// ═══════════════════════════════════════════════════════════════

/**
 * Get character name, with fallback to ST context
 * @param {string} providedName - Name that was provided
 * @returns {string} Best available name
 */
function resolveCharacterName(providedName) {
    // If we have a good name, use it
    if (providedName && providedName !== 'UNKNOWN' && providedName !== '') {
        return providedName;
    }
    
    // Try to get from ST context - use name1 (persona/player) not name2 (AI character)
    try {
        const ctx = getContext();
        if (ctx?.name1 && ctx.name1 !== '') {
            return ctx.name1;
        }
    } catch (e) {
        console.warn('[Tribunal] Could not get context for persona name:', e);
    }
    
    return 'UNKNOWN';
}

// ═══════════════════════════════════════════════════════════════
// CRT VITALS DISPLAY (Header Monitor)
// ═══════════════════════════════════════════════════════════════

/**
 * Update CRT vitals display in the header
 * @param {number} health - Current health
 * @param {number} maxHealth - Max health
 * @param {number} morale - Current morale
 * @param {number} maxMorale - Max morale
 * @param {string} characterName - Character name to display
 */
export function updateCRTVitals(health, maxHealth, morale, maxMorale, characterName) {
    // Resolve character name with fallback
    const resolvedName = resolveCharacterName(characterName);
    
    // Store current values
    currentVitals = { health, maxHealth, morale, maxMorale, characterName: resolvedName };
    
    // Update name
    const nameEl = document.getElementById('ie-crt-char-name');
    if (nameEl) {
        nameEl.textContent = resolvedName;
    }
    
    // Calculate percentages
    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
    const moralePercent = maxMorale > 0 ? (morale / maxMorale) * 100 : 0;
    
    // Update health bar
    const healthFill = document.getElementById('ie-health-fill');
    const healthValue = document.getElementById('ie-health-value');
    const healthRow = document.getElementById('ie-crt-health-row');
    
    if (healthFill) healthFill.style.width = `${healthPercent}%`;
    if (healthValue) healthValue.textContent = health;
    
    // Update morale bar
    const moraleFill = document.getElementById('ie-morale-fill');
    const moraleValue = document.getElementById('ie-morale-value');
    const moraleRow = document.getElementById('ie-crt-morale-row');
    
    if (moraleFill) moraleFill.style.width = `${moralePercent}%`;
    if (moraleValue) moraleValue.textContent = morale;
    
    // Apply low/critical states
    const monitor = document.getElementById('ie-crt-vitals');
    
    // Health states
    if (healthRow) {
        healthRow.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (healthPercent < 15) {
            healthRow.classList.add('ie-vital-critical');
        } else if (healthPercent < 30) {
            healthRow.classList.add('ie-vital-low');
        }
    }
    
    // Morale states
    if (moraleRow) {
        moraleRow.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (moralePercent < 15) {
            moraleRow.classList.add('ie-vital-critical');
        } else if (moralePercent < 30) {
            moraleRow.classList.add('ie-vital-low');
        }
    }
    
    // Overall monitor state (affects EKG speed)
    if (monitor) {
        monitor.classList.remove('ie-vital-low', 'ie-vital-critical', 'ie-vital-dead');
        const lowestPercent = Math.min(healthPercent, moralePercent);
        if (health <= 0 || morale <= 0) {
            monitor.classList.add('ie-vital-dead');
        } else if (lowestPercent < 15) {
            monitor.classList.add('ie-vital-critical');
        } else if (lowestPercent < 30) {
            monitor.classList.add('ie-vital-low');
        }
    }
    
    // Also update RCM Medical Form
    updateRCMFormVitals(health, maxHealth, morale, maxMorale);
    
    // Also update RCM patient name
    const rcmNameEl = document.getElementById('rcm-patient-name');
    if (rcmNameEl) {
        rcmNameEl.textContent = resolvedName !== 'UNKNOWN' ? resolvedName : '______________';
        rcmNameEl.classList.toggle('rcm-field-filled', resolvedName !== 'UNKNOWN');
    }
}

/**
 * Flash damage/heal effect on CRT
 * @param {'damage'|'heal'} type - Effect type
 */
export function flashCRTEffect(type) {
    const monitor = document.getElementById('ie-crt-vitals');
    if (!monitor) return;
    
    const className = type === 'damage' ? 'ie-crt-damage' : 'ie-crt-heal';
    monitor.classList.add(className);
    
    setTimeout(() => {
        monitor.classList.remove(className);
    }, 300);
}

/**
 * Set character name in CRT display
 * @param {string} name - Character name
 */
export function setCRTCharacterName(name) {
    // Resolve with fallback
    const resolvedName = resolveCharacterName(name);
    
    const nameEl = document.getElementById('ie-crt-char-name');
    if (nameEl) {
        nameEl.textContent = resolvedName;
    }
    currentVitals.characterName = resolvedName;
    
    // Also update RCM form
    const rcmNameEl = document.getElementById('rcm-patient-name');
    if (rcmNameEl) {
        rcmNameEl.textContent = resolvedName !== 'UNKNOWN' ? resolvedName : '______________';
        rcmNameEl.classList.toggle('rcm-field-filled', resolvedName !== 'UNKNOWN');
    }
}

/**
 * Get current vitals state
 * @returns {object} Current vitals
 */
export function getCurrentVitals() {
    return { ...currentVitals };
}

// ═══════════════════════════════════════════════════════════════
// RCM MEDICAL FORM (Status Tab)
// ═══════════════════════════════════════════════════════════════

/**
 * Update RCM Medical Form vitals display
 * @param {number} health - Current health
 * @param {number} maxHealth - Max health  
 * @param {number} morale - Current morale
 * @param {number} maxMorale - Max morale
 */
export function updateRCMFormVitals(health, maxHealth, morale, maxMorale) {
    const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
    const moralePercent = maxMorale > 0 ? (morale / maxMorale) * 100 : 0;
    
    // Update health
    const rcmHealthFill = document.getElementById('rcm-health-fill');
    const rcmHealthValue = document.getElementById('rcm-health-value');
    const rcmHealthRow = document.getElementById('rcm-health-row');
    
    if (rcmHealthFill) rcmHealthFill.style.width = `${healthPercent}%`;
    if (rcmHealthValue) rcmHealthValue.textContent = `${health}/${maxHealth}`;
    
    if (rcmHealthRow) {
        rcmHealthRow.classList.remove('rcm-vital-low', 'rcm-vital-critical');
        if (healthPercent < 15) {
            rcmHealthRow.classList.add('rcm-vital-critical');
        } else if (healthPercent < 30) {
            rcmHealthRow.classList.add('rcm-vital-low');
        }
    }
    
    // Update morale
    const rcmMoraleFill = document.getElementById('rcm-morale-fill');
    const rcmMoraleValue = document.getElementById('rcm-morale-value');
    const rcmMoraleRow = document.getElementById('rcm-morale-row');
    
    if (rcmMoraleFill) rcmMoraleFill.style.width = `${moralePercent}%`;
    if (rcmMoraleValue) rcmMoraleValue.textContent = `${morale}/${maxMorale}`;
    
    if (rcmMoraleRow) {
        rcmMoraleRow.classList.remove('rcm-vital-low', 'rcm-vital-critical');
        if (moralePercent < 15) {
            rcmMoraleRow.classList.add('rcm-vital-critical');
        } else if (moralePercent < 30) {
            rcmMoraleRow.classList.add('rcm-vital-low');
        }
    }
}

/**
 * Toggle a status effect checkbox on the RCM form
 * @param {string} status - Status ID (e.g., 'drunk', 'manic')
 * @param {boolean} active - Whether the status is active
 */
export function setRCMStatus(status, active) {
    const checkbox = document.querySelector(`.rcm-checkbox[data-status="${status}"]`);
    if (checkbox) {
        checkbox.classList.toggle('rcm-checked', active);
        const label = checkbox.querySelector('.rcm-checkbox-label');
        if (label) {
            const labelOff = checkbox.dataset.labelOff;
            const labelOn = checkbox.dataset.labelOn;
            label.textContent = active ? labelOn : labelOff;
        }
    }
}

/**
 * Toggle a copotype on the RCM form
 * @param {string} copotype - Copotype ID (e.g., 'sorry-cop', 'art-cop')
 * @param {boolean} active - Whether it's active
 */
export function setRCMCopotype(copotype, active) {
    const item = document.querySelector(`.rcm-copotype-item[data-copotype="${copotype}"]`);
    if (item) {
        item.classList.toggle('rcm-copotype-active', active);
        const box = item.querySelector('.rcm-copotype-box');
        if (box) {
            box.textContent = active ? '☒' : '□';
        }
    }
}

/**
 * Add an ancient voice entry to the RCM form
 * @param {string} name - Voice name
 * @param {string} icon - FontAwesome icon class (e.g., 'fa-ghost')
 * @param {string} triggers - Trigger description
 * @param {boolean} isCombo - Whether this is a combo voice
 */
export function addRCMAncientVoice(name, icon, triggers, isCombo = false) {
    const container = document.getElementById('rcm-ancient-voices');
    if (!container) return;
    
    // Remove empty message if present
    const empty = container.querySelector('.rcm-conditions-empty');
    if (empty) empty.remove();
    
    const entry = document.createElement('div');
    entry.className = 'rcm-ancient-voice-entry' + (isCombo ? ' rcm-ancient-combo' : '');
    entry.innerHTML = `
        <i class="fa-solid ${icon} rcm-ancient-voice-icon"></i>
        <div class="rcm-ancient-voice-details">
            <span class="rcm-ancient-voice-name">${name}</span>
            <span class="rcm-ancient-voice-triggers">${triggers}</span>
        </div>
    `;
    container.appendChild(entry);
}

/**
 * Add an active effect to the conditions display
 * @param {string} text - Effect text
 * @param {'boost'|'debuff'} type - Effect type
 */
export function addRCMActiveEffect(text, type) {
    const container = document.getElementById('rcm-active-effects');
    if (!container) return;
    
    // Remove empty message if present
    const empty = container.querySelector('.rcm-conditions-empty');
    if (empty) empty.remove();
    
    const effect = document.createElement('span');
    effect.className = `rcm-effect-item rcm-effect-${type}`;
    effect.textContent = text;
    container.appendChild(effect);
}

/**
 * Clear all ancient voices
 */
export function clearRCMAncientVoices() {
    const container = document.getElementById('rcm-ancient-voices');
    if (container) {
        container.innerHTML = '<span class="rcm-conditions-empty">(no anomalies detected)</span>';
    }
}

/**
 * Clear all active effects
 */
export function clearRCMActiveEffects() {
    const container = document.getElementById('rcm-active-effects');
    if (container) {
        container.innerHTML = '<span class="rcm-conditions-empty">(none reported)</span>';
    }
}

/**
 * Get all currently checked statuses
 * @returns {string[]} Array of checked status IDs
 */
export function getCheckedStatuses() {
    const checked = document.querySelectorAll('.rcm-checkbox.rcm-checked');
    return Array.from(checked).map(el => el.dataset.status);
}

/**
 * Get all currently active copotypes
 * @returns {string[]} Array of active copotype IDs
 */
export function getActiveCopotypes() {
    const active = document.querySelectorAll('.rcm-copotype-item.rcm-copotype-active');
    return Array.from(active).map(el => el.dataset.copotype);
}
