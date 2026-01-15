/**
 * The Tribunal - Ledger Rendering
 * Quests, events log, and weather display
 */

// ═══════════════════════════════════════════════════════════════
// LEDGER / QUEST RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render active quests/cases
 * @param {HTMLElement} container - #ie-quests-active element
 * @param {Array} quests - Array of quest objects
 */
export function renderQuests(container, quests = []) {
    if (!container) return;

    if (!quests || quests.length === 0) {
        container.innerHTML = `
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-folder-open"></i>
                <span>No active cases</span>
            </div>
        `;
        return;
    }

    container.innerHTML = quests.map(quest => {
        const typeClass = quest.main ? 'ie-quest-main' : 'ie-quest-optional';
        const completeClass = quest.complete ? 'ie-quest-complete' : '';
        const checkedAttr = quest.complete ? 'checked disabled' : '';

        return `
            <div class="ie-quest-item ${typeClass} ${completeClass}" data-quest-id="${quest.id}">
                <input type="checkbox" class="ie-quest-checkbox" ${checkedAttr} />
                <div class="ie-quest-content">
                    <div class="ie-quest-title">${quest.title}</div>
                    ${quest.description ? `<div class="ie-quest-desc">${quest.description}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render events log
 * @param {HTMLElement} container - #ie-events-log element
 * @param {Array} events - Array of event objects { time, text }
 */
export function renderEventsLog(container, events = []) {
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="ie-ledger-empty">
                <i class="fa-solid fa-book-open"></i>
                <span>No notes recorded</span>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="ie-event-item">
            <span class="ie-event-time">${event.time || ''}</span>
            <span class="ie-event-text">${event.text}</span>
        </div>
    `).join('');
}

/**
 * Render weather display
 * @param {HTMLElement} container - #ie-weather-display element
 * @param {Object} weather - { condition: string, icon: string, description: string }
 */
export function renderWeather(container, weather = {}) {
    if (!container) return;

    const condition = weather.condition || 'unknown';
    const description = weather.description || 'Unknown conditions';
    
    // Map conditions to icons
    const iconMap = {
        'clear': 'fa-sun',
        'sunny': 'fa-sun',
        'cloudy': 'fa-cloud',
        'overcast': 'fa-cloud',
        'rain': 'fa-cloud-rain',
        'drizzle': 'fa-cloud-rain',
        'storm': 'fa-cloud-bolt',
        'thunder': 'fa-cloud-bolt',
        'snow': 'fa-snowflake',
        'fog': 'fa-smog',
        'mist': 'fa-smog',
        'wind': 'fa-wind',
        'night': 'fa-moon',
        'unknown': 'fa-cloud'
    };

    const icon = weather.icon || iconMap[condition.toLowerCase()] || 'fa-cloud';

    container.innerHTML = `
        <div class="ie-weather-current">
            <i class="fa-solid ${icon}"></i>
            <span>${description}</span>
        </div>
    `;
}

/**
 * Render entire Ledger tab content
 * @param {Object} data - { quests, events, weather }
 */
export function renderLedgerTab(data = {}) {
    renderQuests(
        document.getElementById('ie-quests-active'),
        data.quests
    );
    renderEventsLog(
        document.getElementById('ie-events-log'),
        data.events
    );
    renderWeather(
        document.getElementById('ie-weather-display'),
        data.weather
    );
}
