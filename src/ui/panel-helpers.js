/**
 * The Tribunal - Panel Helper Functions
 * Utility functions for updating panel displays
 */

// ═══════════════════════════════════════════════════════════════
// VITALS HELPERS (with dynamic HSL colors)
// ═══════════════════════════════════════════════════════════════

function getVitalHue(percent) {
    return (percent / 100) * 120;
}

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
    
    if (headerBar) {
        headerBar.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) headerBar.classList.add('ie-vital-critical');
        else if (percent <= 30) headerBar.classList.add('ie-vital-low');
    }
    
    // Status tab detail bar
    const detailFill = document.getElementById(`ie-${type}-detail-fill`);
    const detailValue = document.getElementById(`ie-${type}-detail-value`);
    const detailRow = detailFill?.closest('.ie-vital-detail-row');
    
    if (detailFill) {
        detailFill.style.width = `${percent}%`;
        detailFill.style.background = color;
    }
    if (detailValue) detailValue.textContent = `${Math.round(current)} / ${max}`;
    
    if (detailRow) {
        detailRow.classList.remove('ie-vital-low', 'ie-vital-critical');
        if (percent <= 15) detailRow.classList.add('ie-vital-critical');
        else if (percent <= 30) detailRow.classList.add('ie-vital-low');
    }
}

export function updateHealth(current, max = 100) {
    updateVitalBar('health', current, max);
}

export function updateMorale(current, max = 100) {
    updateVitalBar('morale', current, max);
}

// ═══════════════════════════════════════════════════════════════
// VITALS BUTTON EVENT BINDING
// ═══════════════════════════════════════════════════════════════

export function bindVitalsControls(callbacks = {}) {
    document.getElementById('ie-health-minus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(-1);
    });
    document.getElementById('ie-health-plus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(1);
    });
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

export function updateCaseTitle(name) {
    const titleEl = document.querySelector('.ie-case-title');
    if (titleEl) titleEl.textContent = name ? `CASE FILE: ${name}` : 'CASE FILE';
}

export function updateMoney(amount) {
    const moneyEl = document.getElementById('ie-money-amount');
    if (moneyEl) moneyEl.textContent = amount.toLocaleString();
}

export function populateConnectionProfiles(profiles, selectedProfile) {
    const select = document.getElementById('ie-connection-profile');
    if (!select) return;
    
    select.innerHTML = '<option value="current">Use Current ST Profile</option>';
    
    if (profiles && profiles.length > 0) {
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            option.textContent = profile.name;
            select.appendChild(option);
        });
    }
    
    if (selectedProfile) select.value = selectedProfile;
}
