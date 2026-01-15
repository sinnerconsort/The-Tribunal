/**
 * The Tribunal - Panel Helper Functions
 * Utility functions for updating panel displays
 * 
 * Split from panel.js for maintainability
 * Updated: Dynamic HSL colors for vitals (consolidated from render-vitals.js)
 */

// ═══════════════════════════════════════════════════════════════
// VITALS HELPERS (with dynamic HSL colors)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate HSL hue based on vital percentage
 * 0% = red (0), 100% = green (120)
 * @param {number} percent - 0-100
 * @returns {number} HSL hue value
 */
function getVitalHue(percent) {
    return (percent / 100) * 120;
}

/**
 * Update a vital bar (shared logic for health/morale)
 * @param {string} type - 'health' or 'morale'
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 */
function updateVitalBar(type, current, max = 100) {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    const hue = getVitalHue(percent);
    const color = `hsl(${hue}, 65%, 45%)`;
    
    // Header bar
    const headerFill = document.getElementById(`ie-${type}-fill`);
    const headerValue = document.getElementById(`ie-${type}-value`);
    const headerBar = headerFill?.closest('.ie-vital-bar');
    
    if (headerFill) {
        headerFill.style.width = `${percent}%`;
        headerFill.style.background = color;
    }
    if (headerValue) headerValue.textContent = Math.round(current);
    
    // Add low/critical state classes
    if (headerBar) {
        headerBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            headerBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            headerBar.classList.add('ie-vital-low');
        }
    }
    
    // Status tab detail bar
    const detailFill = document.getElementById(`ie-${type}-detail-fill`);
    const detailValue = document.getElementById(`ie-${type}-detail-value`);
    const detailBar = detailFill?.closest('.ie-vital-bar');
    
    if (detailFill) {
        detailFill.style.width = `${percent}%`;
        detailFill.style.background = color;
    }
    if (detailValue) detailValue.textContent = `${Math.round(current)} / ${max}`;
    
    if (detailBar) {
        detailBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) {
            detailBar.classList.add('ie-vital-critical');
        } else if (percent <= 30) {
            detailBar.classList.add('ie-vital-low');
        }
    }
}

/**
 * Update health display in header and status tab
 * @param {number} current - Current health value
 * @param {number} max - Max health value (default 100)
 */
export function updateHealth(current, max = 100) {
    updateVitalBar('health', current, max);
}

/**
 * Update morale display in header and status tab
 * @param {number} current - Current morale value
 * @param {number} max - Max morale value (default 100)
 */
export function updateMorale(current, max = 100) {
    updateVitalBar('morale', current, max);
}

// ═══════════════════════════════════════════════════════════════
// VITALS BUTTON EVENT BINDING
// Call this after panel is created to wire up +/- buttons
// ═══════════════════════════════════════════════════════════════

/**
 * Bind vitals +/- button events
 * @param {Object} callbacks - { onHealthChange: (delta) => {}, onMoraleChange: (delta) => {} }
 */
export function bindVitalsControls(callbacks = {}) {
    // Health buttons
    document.getElementById('ie-health-minus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(-1);
    });
    document.getElementById('ie-health-plus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(1);
    });
    
    // Morale buttons
    document.getElementById('ie-morale-minus')?.addEventListener('click', () => {
        if (callbacks.onMoraleChange) callbacks.onMoraleChange(-1);
    });
    document.getElementById('ie-morale-plus')?.addEventListener('click', () => {
        if (callbacks.onMoraleChange) callbacks.onMoraleChange(1);
    });
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Update the case file title in header
 * @param {string} name - Character/persona name
 */
export function updateCaseTitle(name) {
    const titleEl = document.querySelector('.ie-case-title');
    if (titleEl) {
        titleEl.textContent = name ? `CASE FILE: ${name}` : 'CASE FILE';
    }
}

/**
 * Update money display in inventory tab
 * @param {number} amount - Currency amount
 */
export function updateMoney(amount) {
    const moneyEl = document.getElementById('ie-money-amount');
    if (moneyEl) {
        moneyEl.textContent = amount.toLocaleString();
    }
}

/**
 * Update weather display in ledger tab
 * @param {string} icon - FontAwesome icon class (e.g., 'fa-cloud-rain')
 * @param {string} condition - Weather condition name
 * @param {string} flavor - Flavor text description
 */
export function updateWeather(icon, condition, flavor = '') {
    const weatherEl = document.getElementById('ie-weather-display');
    if (weatherEl) {
        weatherEl.innerHTML = `
            <div class="ie-weather-current">
                <i class="fa-solid ${icon}"></i>
                <div>
                    <div class="ie-weather-condition">${condition}</div>
                    ${flavor ? `<div class="ie-weather-flavor">"${flavor}"</div>` : ''}
                </div>
            </div>
        `;
    }
}

/**
 * Populate the connection profile dropdown with available ST profiles
 * @param {Array} profiles - Array of { id, name } objects from getAvailableProfiles()
 * @param {string} selectedProfile - Currently selected profile name
 */
export function populateConnectionProfiles(profiles, selectedProfile) {
    const select = document.getElementById('ie-connection-profile');
    if (!select) return;
    
    // Clear existing options except "current"
    select.innerHTML = '<option value="current">Use Current ST Profile</option>';
    
    // Add available profiles
    if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            option.textContent = profile.name;
            select.appendChild(option);
        });
    }
    
    // Set selected value
    if (selectedProfile) {
        select.value = selectedProfile;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEDGER SUB-TAB HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize ledger sub-tab switching
 * Call this after panel is created
 */
export function initLedgerSubTabs() {
    const subTabs = document.querySelectorAll('.ledger-sub-tab');
    const subContents = document.querySelectorAll('.ledger-sub-content');
    
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.subtab;
            
            // Skip if it's the secret tab and not revealed
            if (tab.classList.contains('ledger-tab-secret') && 
                !tab.classList.contains('revealed')) {
                return;
            }
            
            // Remove active from all
            subTabs.forEach(t => t.classList.remove('active'));
            subContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            const content = document.querySelector(`[data-subtab-content="${targetTab}"]`);
            if (content) content.classList.add('active');
        });
    });
}

/**
 * Update the compartment crack visual based on unlock progress
 * @param {number} stage - 0 (hidden), 1, 2, or 3 (revealed)
 */
export function updateCompartmentCrack(stage) {
    const crack = document.getElementById('ie-compartment-crack');
    const tab = document.getElementById('ie-secret-tab');
    
    if (!crack || !tab) return;
    
    // Reset classes
    crack.className = 'ledger-crack-line';
    tab.classList.remove('cracking', 'revealed');
    
    switch (stage) {
        case 1:
            crack.classList.add('stage-1');
            break;
        case 2:
            crack.classList.add('stage-2');
            tab.classList.add('cracking');
            break;
        case 3:
            crack.classList.add('stage-3');
            tab.classList.add('revealed');
            break;
    }
}

/**
 * Render a case card
 * @param {Object} caseData - Case object with title, code, description, etc.
 * @returns {string} HTML string
 */
export function renderCaseCard(caseData) {
    const statusClass = caseData.status || 'active';
    return `
        <div class="ledger-case-card ${statusClass}" data-case-id="${caseData.id}">
            <div class="ledger-case-code">${caseData.code || 'HDB-??-????-??'}</div>
            <div class="ledger-case-title">${caseData.title || 'UNTITLED CASE'}</div>
            <div class="ledger-case-filed">FILED — Session ${caseData.session || '?'}, ${caseData.time || '??:??'}</div>
            <div class="ledger-case-description">${caseData.description || ''}</div>
            <div class="ledger-case-status ${statusClass}">${statusClass}</div>
        </div>
    `;
}

/**
 * Update the RCM badge with officer profile data
 * @param {Object} profile - Officer profile object
 */
export function updateBadgeDisplay(profile) {
    const nameEl = document.getElementById('ie-badge-name');
    const rankEl = document.getElementById('ie-badge-rank');
    const badgeIdEl = document.getElementById('ie-badge-id');
    const regEl = document.getElementById('ie-badge-reg');
    const sessionsEl = document.getElementById('ie-stat-sessions');
    const voicesEl = document.getElementById('ie-stat-voices');
    const critFailsEl = document.getElementById('ie-stat-critfails');
    const dotsEl = document.getElementById('ie-perforation-dots');
    
    if (nameEl) nameEl.textContent = profile.name || 'NAME UNKNOWN';
    if (rankEl) rankEl.textContent = profile.rank || 'RANK UNKNOWN';
    if (badgeIdEl) badgeIdEl.textContent = profile.badgeId || 'LTN-????';
    if (regEl) regEl.textContent = profile.regNumber || 'REV??-??-??-???';
    
    if (sessionsEl) sessionsEl.textContent = profile.sessions || 0;
    if (voicesEl) voicesEl.textContent = profile.voicesHeard || 0;
    if (critFailsEl) critFailsEl.textContent = profile.criticalFailures || 0;
    
    // Perforation dots
    if (dotsEl) {
        const count = Math.min(profile.sessions || 0, 20);
        const filled = '●'.repeat(count);
        const empty = '○'.repeat(Math.max(0, 10 - count));
        dotsEl.textContent = `${filled}${empty} (${profile.sessions || 0})`;
    }
}

/**
 * Display a fortune in the compartment
 * @param {Object} fortune - Fortune object with text, ledger type, etc.
 */
export function displayFortune(fortune) {
    const wrapper = document.getElementById('ie-fortune-display');
    const textEl = document.getElementById('ie-fortune-text');
    const sourceEl = document.getElementById('ie-fortune-source');
    
    if (!wrapper || !textEl || !sourceEl) return;
    
    textEl.textContent = `"${fortune.text}"`;
    
    // Set source with color class
    sourceEl.textContent = `— ${fortune.ledgerName}`;
    sourceEl.className = 'ledger-fortune-source ' + fortune.ledgerType;
    
    wrapper.style.display = 'block';
}

/**
 * Generate alphanumeric case code
 * @param {number} precinct - Precinct number (default 41)
 * @param {number} sequence - Case sequence number
 * @returns {string} Case code like "HDB-41-0115-03"
 */
export function generateCaseCode(precinct = 41, sequence = 1) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(sequence).padStart(2, '0');
    return `HDB-${precinct}-${month}${day}-${seq}`;
}
