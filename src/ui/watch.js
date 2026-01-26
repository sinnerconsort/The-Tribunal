/**
 * The Tribunal - Watch Module v2.0
 * Analog watch display with META/AUTO modes and popup settings
 * 
 * Features:
 * - Animated clock hands (real-time or story time)
 * - Weather icon display
 * - Tap to open settings popup
 * - META mode: Real IRL time + Open-Meteo weather
 * - AUTO mode: Story time + narrative weather
 * 
 * @version 2.0.0
 */

import {
    getWatchMode,
    setWatchMode,
    toggleWatchMode,
    getWatchState,
    getCurrentTime,
    getCurrentWeather,
    getMetaLocation,
    geocodeLocation,
    tryGeolocation,
    setAutoTime,
    setAutoWeather,
    initWeatherTime
} from '../systems/weather-time.js';
import { getSetting, setSetting } from '../core/persistence.js';
import { eventSource } from '../../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let watchInterval = null;
let popupOpen = false;

// ═══════════════════════════════════════════════════════════════
// WEATHER ICONS
// ═══════════════════════════════════════════════════════════════

const WEATHER_ICONS = {
    'clear-day': 'fa-sun',
    'clear-night': 'fa-moon',
    'cloudy': 'fa-cloud',
    'rain': 'fa-cloud-rain',
    'rainy': 'fa-cloud-rain',
    'storm': 'fa-cloud-bolt',
    'stormy': 'fa-cloud-bolt',
    'snow': 'fa-snowflake',
    'snowy': 'fa-snowflake',
    'blizzard': 'fa-snowflake',
    'mist': 'fa-smog',
    'foggy': 'fa-smog',
    'wind': 'fa-wind',
    'clear': 'fa-sun'
};

// ═══════════════════════════════════════════════════════════════
// WATCH DISPLAY
// ═══════════════════════════════════════════════════════════════

/**
 * Update the watch display with current time/weather
 */
export async function updateWatch() {
    const hourHand = document.getElementById('ie-watch-hour');
    const minuteHand = document.getElementById('ie-watch-minute');
    const secondHand = document.getElementById('ie-watch-second');
    const dateEl = document.getElementById('ie-watch-date');
    const weatherEl = document.getElementById('ie-watch-weather');
    const weatherIcon = document.getElementById('ie-watch-weather-icon');
    
    if (!hourHand) return;
    
    const time = getCurrentTime();
    const mode = getWatchMode();
    
    // Calculate hand rotations
    const hours = time.hours % 12;
    const minutes = time.minutes;
    const seconds = time.seconds || 0;
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    const secondDeg = seconds * 6;
    
    // Apply rotations
    hourHand.style.transform = `rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    if (secondHand) {
        // Only animate seconds in META mode
        if (mode === 'meta') {
            secondHand.style.transform = `rotate(${secondDeg}deg)`;
            secondHand.style.display = 'block';
        } else {
            secondHand.style.display = 'none';
        }
    }
    
    // Update date display
    if (dateEl) {
        dateEl.textContent = time.day || '??';
    }
    
    // Update weather icon
    if (weatherEl && weatherIcon) {
        const weather = await getCurrentWeather();
        
        if (weather) {
            const iconKey = weather.icon || weather.type || 'clear';
            const iconClass = WEATHER_ICONS[iconKey] || 'fa-cloud';
            weatherIcon.className = 'fa-solid ' + iconClass;
            weatherEl.className = 'watch-weather ' + (weather.type || 'clear');
            weatherEl.title = weather.condition || 'Weather';
        }
    }
    
    // Update mode indicator on watch frame
    const watchEl = document.getElementById('ie-header-watch');
    if (watchEl) {
        watchEl.classList.toggle('meta-mode', mode === 'meta');
        watchEl.classList.toggle('auto-mode', mode === 'auto');
    }
}

/**
 * Start the watch interval
 */
export function startWatch() {
    updateWatch();
    // Update every second for smooth animation
    watchInterval = setInterval(updateWatch, 1000);
    console.log('[Watch] Started');
}

/**
 * Stop the watch interval
 */
export function stopWatch() {
    if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
        console.log('[Watch] Stopped');
    }
}

// ═══════════════════════════════════════════════════════════════
// POPUP UI
// ═══════════════════════════════════════════════════════════════

/**
 * Create the watch popup HTML
 */
function createPopupHTML() {
    return `
        <div id="tribunal-watch-popup" class="watch-popup">
            <div class="watch-popup-header">
                <span class="watch-popup-title">⚙ CHRONOMETER</span>
                <button id="watch-popup-close" class="watch-popup-close">✕</button>
            </div>
            
            <div class="watch-popup-mode-toggle">
                <button id="watch-mode-meta" class="watch-mode-btn">
                    <i class="fa-solid fa-globe"></i> META
                </button>
                <button id="watch-mode-auto" class="watch-mode-btn">
                    <i class="fa-solid fa-book"></i> AUTO
                </button>
            </div>
            
            <!-- META Mode Panel -->
            <div id="watch-panel-meta" class="watch-panel">
                <div class="watch-panel-section">
                    <div class="watch-label">LOCATION</div>
                    <div id="watch-meta-location" class="watch-value">Loading...</div>
                    <div class="watch-location-actions">
                        <button id="watch-detect-location" class="watch-btn-small">
                            <i class="fa-solid fa-location-crosshairs"></i> Detect
                        </button>
                        <button id="watch-set-location" class="watch-btn-small">
                            <i class="fa-solid fa-pen"></i> Set
                        </button>
                    </div>
                </div>
                
                <div class="watch-panel-section">
                    <div class="watch-label">CONDITIONS</div>
                    <div id="watch-meta-weather" class="watch-weather-display">
                        <span id="watch-meta-condition">--</span>
                        <span id="watch-meta-temp">--°F</span>
                    </div>
                    <button id="watch-refresh-weather" class="watch-btn-small">
                        <i class="fa-solid fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>
            
            <!-- AUTO Mode Panel -->
            <div id="watch-panel-auto" class="watch-panel" style="display: none;">
                <div class="watch-panel-section">
                    <div class="watch-label">STORY TIME</div>
                    <div class="watch-time-setter">
                        <input type="number" id="watch-auto-hour" min="0" max="23" value="12" class="watch-time-input">
                        <span>:</span>
                        <input type="number" id="watch-auto-minute" min="0" max="59" value="0" class="watch-time-input">
                        <button id="watch-set-time" class="watch-btn-small">Set</button>
                    </div>
                    <div id="watch-auto-period" class="watch-period">Afternoon</div>
                </div>
                
                <div class="watch-panel-section">
                    <div class="watch-label">WEATHER</div>
                    <select id="watch-auto-weather" class="watch-weather-select">
                        <option value="clear">☀️ Clear</option>
                        <option value="cloudy">☁️ Cloudy</option>
                        <option value="rain">🌧️ Rain</option>
                        <option value="storm">⛈️ Storm</option>
                        <option value="snow">❄️ Snow</option>
                        <option value="blizzard">🌨️ Blizzard</option>
                        <option value="mist">🌫️ Mist/Fog</option>
                        <option value="wind">💨 Windy</option>
                    </select>
                </div>
                
                <div class="watch-panel-section watch-info">
                    <i class="fa-solid fa-info-circle"></i>
                    <span>AUTO mode extracts time & weather from the story. You can also set them manually.</span>
                </div>
            </div>
            
            <!-- Effects Toggle -->
            <div class="watch-popup-footer">
                <label class="watch-checkbox">
                    <input type="checkbox" id="watch-effects-chat">
                    <span>Weather effects (chat)</span>
                </label>
                <label class="watch-checkbox">
                    <input type="checkbox" id="watch-effects-panel">
                    <span>Weather effects (panel)</span>
                </label>
            </div>
        </div>
    `;
}

/**
 * Create the popup styles
 */
function getPopupStyles() {
    return `
        .watch-popup {
            position: fixed;
            top: 200px;
            right: 20px;
            width: 280px;
            background: linear-gradient(180deg, #2a2318 0%, #1a1612 100%);
            border: 2px solid #5c4d3d;
            border-radius: 4px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            z-index: 10001;
            font-family: 'Times New Roman', Georgia, serif;
            color: #e8d8b8;
            display: none;
        }
        
        .watch-popup.open {
            display: block;
            animation: watchPopupIn 0.2s ease-out;
        }
        
        @keyframes watchPopupIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .watch-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            border-bottom: 1px solid #5c4d3d;
            background: rgba(0,0,0,0.2);
        }
        
        .watch-popup-title {
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #c8b898;
        }
        
        .watch-popup-close {
            background: none;
            border: none;
            color: #8a7a60;
            font-size: 14px;
            cursor: pointer;
            padding: 2px 6px;
        }
        
        .watch-popup-close:hover {
            color: #e8d8b8;
        }
        
        .watch-popup-mode-toggle {
            display: flex;
            padding: 10px;
            gap: 8px;
            border-bottom: 1px solid #3d3225;
        }
        
        .watch-mode-btn {
            flex: 1;
            padding: 8px 12px;
            background: #1a1612;
            border: 1px solid #3d3225;
            color: #8a7a60;
            font-family: inherit;
            font-size: 11px;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .watch-mode-btn:hover {
            background: #2a2318;
            color: #c8b898;
        }
        
        .watch-mode-btn.active {
            background: #3d3225;
            border-color: #8a7a60;
            color: #e8d8b8;
        }
        
        .watch-panel {
            padding: 12px;
        }
        
        .watch-panel-section {
            margin-bottom: 14px;
        }
        
        .watch-panel-section:last-child {
            margin-bottom: 0;
        }
        
        .watch-label {
            font-size: 9px;
            letter-spacing: 2px;
            color: #8a7a60;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        
        .watch-value {
            font-size: 13px;
            color: #e8d8b8;
            margin-bottom: 8px;
        }
        
        .watch-location-actions {
            display: flex;
            gap: 8px;
        }
        
        .watch-btn-small {
            padding: 5px 10px;
            background: #2a2318;
            border: 1px solid #5c4d3d;
            color: #c8b898;
            font-family: inherit;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .watch-btn-small:hover {
            background: #3d3225;
            color: #e8d8b8;
        }
        
        .watch-weather-display {
            display: flex;
            gap: 12px;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .watch-time-setter {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 6px;
        }
        
        .watch-time-input {
            width: 45px;
            padding: 5px;
            background: #1a1612;
            border: 1px solid #5c4d3d;
            color: #e8d8b8;
            font-family: inherit;
            font-size: 13px;
            text-align: center;
        }
        
        .watch-time-setter span {
            color: #8a7a60;
            font-size: 16px;
        }
        
        .watch-period {
            font-size: 11px;
            color: #8a7a60;
            font-style: italic;
        }
        
        .watch-weather-select {
            width: 100%;
            padding: 8px;
            background: #1a1612;
            border: 1px solid #5c4d3d;
            color: #e8d8b8;
            font-family: inherit;
            font-size: 12px;
            cursor: pointer;
        }
        
        .watch-info {
            display: flex;
            gap: 8px;
            align-items: flex-start;
            font-size: 10px;
            color: #6a5a40;
            font-style: italic;
            padding: 8px;
            background: rgba(0,0,0,0.2);
            border-radius: 2px;
        }
        
        .watch-info i {
            margin-top: 2px;
        }
        
        .watch-popup-footer {
            padding: 10px 12px;
            border-top: 1px solid #3d3225;
            background: rgba(0,0,0,0.2);
        }
        
        .watch-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: #a89878;
            cursor: pointer;
            margin-bottom: 6px;
        }
        
        .watch-checkbox:last-child {
            margin-bottom: 0;
        }
        
        .watch-checkbox input {
            accent-color: #c8a868;
        }
        
        /* Location input modal */
        .watch-location-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
        }
        
        .watch-location-modal-content {
            background: #2a2318;
            border: 2px solid #5c4d3d;
            padding: 20px;
            width: 300px;
            border-radius: 4px;
        }
        
        .watch-location-modal-title {
            font-size: 12px;
            letter-spacing: 2px;
            color: #c8b898;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .watch-location-modal input {
            width: 100%;
            padding: 10px;
            background: #1a1612;
            border: 1px solid #5c4d3d;
            color: #e8d8b8;
            font-family: inherit;
            font-size: 13px;
            margin-bottom: 12px;
            box-sizing: border-box;
        }
        
        .watch-location-modal-hint {
            font-size: 10px;
            color: #6a5a40;
            margin-bottom: 12px;
        }
        
        .watch-location-modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        
        /* Mode indicators on watch face */
        #ie-header-watch.meta-mode .watch-mode-indicator::after {
            content: 'M';
        }
        
        #ie-header-watch.auto-mode .watch-mode-indicator::after {
            content: 'A';
        }
    `;
}

/**
 * Open the watch popup
 */
export async function openPopup() {
    let popup = document.getElementById('tribunal-watch-popup');
    
    if (!popup) {
        // Create popup and styles
        const styleEl = document.createElement('style');
        styleEl.id = 'tribunal-watch-popup-styles';
        styleEl.textContent = getPopupStyles();
        document.head.appendChild(styleEl);
        
        const container = document.createElement('div');
        container.innerHTML = createPopupHTML();
        popup = container.firstElementChild;
        document.body.appendChild(popup);
        
        // Bind events
        bindPopupEvents(popup);
    }
    
    // Update state
    await refreshPopupState();
    
    popup.classList.add('open');
    popupOpen = true;
    
    console.log('[Watch] Popup opened');
}

/**
 * Close the watch popup
 */
export function closePopup() {
    const popup = document.getElementById('tribunal-watch-popup');
    if (popup) {
        popup.classList.remove('open');
    }
    popupOpen = false;
    console.log('[Watch] Popup closed');
}

/**
 * Toggle the watch popup
 */
export function togglePopup() {
    if (popupOpen) {
        closePopup();
    } else {
        openPopup();
    }
}

/**
 * Refresh popup state from data layer
 */
async function refreshPopupState() {
    const state = await getWatchState();
    const mode = state.mode;
    
    // Update mode buttons
    document.getElementById('watch-mode-meta')?.classList.toggle('active', mode === 'meta');
    document.getElementById('watch-mode-auto')?.classList.toggle('active', mode === 'auto');
    
    // Show/hide panels
    const metaPanel = document.getElementById('watch-panel-meta');
    const autoPanel = document.getElementById('watch-panel-auto');
    if (metaPanel) metaPanel.style.display = mode === 'meta' ? 'block' : 'none';
    if (autoPanel) autoPanel.style.display = mode === 'auto' ? 'block' : 'none';
    
    // Update META panel
    if (mode === 'meta') {
        const locationEl = document.getElementById('watch-meta-location');
        if (locationEl) {
            locationEl.textContent = state.locationName || 'Not set';
        }
        
        if (state.weather) {
            const conditionEl = document.getElementById('watch-meta-condition');
            const tempEl = document.getElementById('watch-meta-temp');
            if (conditionEl) conditionEl.textContent = state.weather.condition || '--';
            if (tempEl) tempEl.textContent = `${state.weather.tempF || '--'}°F`;
        }
    }
    
    // Update AUTO panel
    if (mode === 'auto') {
        const hourInput = document.getElementById('watch-auto-hour');
        const minuteInput = document.getElementById('watch-auto-minute');
        const periodEl = document.getElementById('watch-auto-period');
        const weatherSelect = document.getElementById('watch-auto-weather');
        
        if (hourInput) hourInput.value = state.time.hours;
        if (minuteInput) minuteInput.value = state.time.minutes;
        if (periodEl) periodEl.textContent = state.time.period?.label || '';
        if (weatherSelect && state.weather) {
            weatherSelect.value = state.weather.type || 'clear';
        }
    }
    
    // Update effect checkboxes
    const effectsChatEl = document.getElementById('watch-effects-chat');
    const effectsPanelEl = document.getElementById('watch-effects-panel');
    if (effectsChatEl) effectsChatEl.checked = getSetting('weather.effectsChat', true);
    if (effectsPanelEl) effectsPanelEl.checked = getSetting('weather.effectsPanel', false);
}

/**
 * Bind popup event handlers
 */
function bindPopupEvents(popup) {
    // Close button
    popup.querySelector('#watch-popup-close')?.addEventListener('click', closePopup);
    
    // Mode buttons
    popup.querySelector('#watch-mode-meta')?.addEventListener('click', async () => {
        setWatchMode('meta');
        await refreshPopupState();
        updateWatch();
    });
    
    popup.querySelector('#watch-mode-auto')?.addEventListener('click', async () => {
        setWatchMode('auto');
        await refreshPopupState();
        updateWatch();
    });
    
    // META: Detect location
    popup.querySelector('#watch-detect-location')?.addEventListener('click', async () => {
        const locationEl = document.getElementById('watch-meta-location');
        if (locationEl) locationEl.textContent = 'Detecting...';
        
        const coords = await tryGeolocation();
        if (coords) {
            // Reverse geocode to get name (simplified - just show coords for now)
            const name = `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`;
            setSetting('watch.meta.locationName', name);
            if (locationEl) locationEl.textContent = name;
            
            // Refresh weather
            await refreshPopupState();
        } else {
            if (locationEl) locationEl.textContent = 'Detection failed';
        }
    });
    
    // META: Set location manually
    popup.querySelector('#watch-set-location')?.addEventListener('click', () => {
        showLocationModal();
    });
    
    // META: Refresh weather
    popup.querySelector('#watch-refresh-weather')?.addEventListener('click', async () => {
        const weather = await getCurrentWeather();
        await refreshPopupState();
    });
    
    // AUTO: Set time
    popup.querySelector('#watch-set-time')?.addEventListener('click', () => {
        const hour = parseInt(document.getElementById('watch-auto-hour')?.value || '12');
        const minute = parseInt(document.getElementById('watch-auto-minute')?.value || '0');
        setAutoTime(hour, minute);
        refreshPopupState();
        updateWatch();
    });
    
    // AUTO: Weather select
    popup.querySelector('#watch-auto-weather')?.addEventListener('change', (e) => {
        setAutoWeather(e.target.value);
        updateWatch();
    });
    
    // Effect toggles
    popup.querySelector('#watch-effects-chat')?.addEventListener('change', (e) => {
        setSetting('weather.effectsChat', e.target.checked);
        eventSource.emit('TRIBUNAL_WEATHER_EFFECTS_CHANGED', { chat: e.target.checked });
    });
    
    popup.querySelector('#watch-effects-panel')?.addEventListener('change', (e) => {
        setSetting('weather.effectsPanel', e.target.checked);
        eventSource.emit('TRIBUNAL_WEATHER_EFFECTS_CHANGED', { panel: e.target.checked });
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (popupOpen && !popup.contains(e.target) && !e.target.closest('#ie-header-watch')) {
            closePopup();
        }
    });
}

/**
 * Show location input modal
 */
function showLocationModal() {
    const modal = document.createElement('div');
    modal.className = 'watch-location-modal';
    modal.innerHTML = `
        <div class="watch-location-modal-content">
            <div class="watch-location-modal-title">Set Location</div>
            <input type="text" id="watch-location-input" placeholder="City, State or City, Country">
            <div class="watch-location-modal-hint">
                Examples: "Portland, OR" or "London, UK"
            </div>
            <div class="watch-location-modal-actions">
                <button id="watch-location-cancel" class="watch-btn-small">Cancel</button>
                <button id="watch-location-save" class="watch-btn-small">Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#watch-location-input');
    input?.focus();
    
    modal.querySelector('#watch-location-cancel')?.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#watch-location-save')?.addEventListener('click', async () => {
        const value = input?.value?.trim();
        if (value) {
            const locationEl = document.getElementById('watch-meta-location');
            if (locationEl) locationEl.textContent = 'Looking up...';
            
            const location = await geocodeLocation(value);
            if (location) {
                if (locationEl) locationEl.textContent = location.displayName;
                await refreshPopupState();
            } else {
                if (locationEl) locationEl.textContent = 'Not found';
            }
        }
        modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Enter key
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#watch-location-save')?.click();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// LEGACY API (for backward compatibility)
// ═══════════════════════════════════════════════════════════════

/**
 * Set RP time manually
 * @deprecated Use setAutoTime() instead
 */
export function setRPTime(hours, minutes) {
    setAutoTime(hours, minutes);
}

/**
 * Set RP weather manually
 * @deprecated Use setAutoWeather() instead
 */
export function setRPWeather(weather) {
    setAutoWeather(weather);
}

/**
 * Get current RP time
 * @deprecated
 */
export function getRPTime() {
    const time = getCurrentTime();
    return { hours: time.hours, minutes: time.minutes };
}

/**
 * Get current RP weather
 * @deprecated
 */
export function getRPWeather() {
    // Return synchronously for legacy compat
    return getSetting('ledger.weather.type', 'clear');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the watch module
 */
export function initWatch() {
    console.log('[Watch] Initializing...');
    
    // Initialize the data layer first
    initWeatherTime();
    
    // Set up watch click handler
    const watchEl = document.getElementById('ie-header-watch');
    if (watchEl) {
        watchEl.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePopup();
        });
        watchEl.style.cursor = 'pointer';
        watchEl.title = 'Click to open chronometer settings';
    }
    
    // Listen for mode changes
    eventSource.on('TRIBUNAL_WATCH_MODE_CHANGED', () => {
        updateWatch();
        if (popupOpen) refreshPopupState();
    });
    
    // Start the watch
    startWatch();
    
    console.log('[Watch] Initialized - Mode:', getWatchMode());
}
