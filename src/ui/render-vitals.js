/**
 * The Tribunal - Vitals Rendering
 * Health and Morale display with controls
 */

// ═══════════════════════════════════════════════════════════════
// VITALS RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render expanded vitals view in Status tab
 * @param {HTMLElement} container - #ie-vitals-detail element
 * @param {Object} vitals - { health: number, morale: number }
 * @param {Object} callbacks - { onHealthChange, onMoraleChange }
 */
export function renderVitalsDetail(container, vitals = {}, callbacks = {}) {
    if (!container) return;

    const health = Math.max(0, Math.min(100, vitals.health ?? 100));
    const morale = Math.max(0, Math.min(100, vitals.morale ?? 100));
    const maxHealth = vitals.maxHealth ?? 100;
    const maxMorale = vitals.maxMorale ?? 100;

    // Calculate colors (red to green gradient)
    const healthHue = (health / maxHealth) * 120;
    const moraleHue = (morale / maxMorale) * 120;

    container.innerHTML = `
        <div class="ie-vital-detail-row ie-health">
            <div class="ie-vital-detail-header">
                <span class="ie-vital-detail-label">
                    <i class="fa-solid fa-heart"></i> Health
                </span>
                <div class="ie-vital-controls">
                    <button class="ie-btn ie-btn-xs ie-vital-btn" id="ie-health-minus" title="−1 Health">−</button>
                    <span class="ie-vital-detail-value">${Math.round(health)} / ${maxHealth}</span>
                    <button class="ie-btn ie-btn-xs ie-vital-btn" id="ie-health-plus" title="+1 Health">+</button>
                </div>
            </div>
            <div class="ie-vital-detail-track">
                <div class="ie-vital-detail-fill" style="width: ${(health/maxHealth)*100}%; background: hsl(${healthHue}, 65%, 45%)"></div>
            </div>
        </div>
        <div class="ie-vital-detail-row ie-morale">
            <div class="ie-vital-detail-header">
                <span class="ie-vital-detail-label">
                    <i class="fa-solid fa-brain"></i> Morale
                </span>
                <div class="ie-vital-controls">
                    <button class="ie-btn ie-btn-xs ie-vital-btn" id="ie-morale-minus" title="−1 Morale">−</button>
                    <span class="ie-vital-detail-value">${Math.round(morale)} / ${maxMorale}</span>
                    <button class="ie-btn ie-btn-xs ie-vital-btn" id="ie-morale-plus" title="+1 Morale">+</button>
                </div>
            </div>
            <div class="ie-vital-detail-track">
                <div class="ie-vital-detail-fill" style="width: ${(morale/maxMorale)*100}%; background: hsl(${moraleHue}, 65%, 45%)"></div>
            </div>
        </div>
    `;

    // Attach event listeners
    container.querySelector('#ie-health-minus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(-1);
    });
    container.querySelector('#ie-health-plus')?.addEventListener('click', () => {
        if (callbacks.onHealthChange) callbacks.onHealthChange(1);
    });
    container.querySelector('#ie-morale-minus')?.addEventListener('click', () => {
        if (callbacks.onMoraleChange) callbacks.onMoraleChange(-1);
    });
    container.querySelector('#ie-morale-plus')?.addEventListener('click', () => {
        if (callbacks.onMoraleChange) callbacks.onMoraleChange(1);
    });
}
