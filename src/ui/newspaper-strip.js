/**
 * The Tribunal - Newspaper Strip Component
 * Torn paper date/weather bar for the Ledger map tab
 * 
 * Sits at top of map section showing:
 * - Day/Date
 * - Weather condition + icon
 * - Time period
 * 
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATE
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_HTML = `
<div class="newspaper-strip" id="newspaper-strip">
    <div class="newspaper-torn-edge newspaper-torn-top"></div>
    <div class="newspaper-content">
        <span class="newspaper-title">THE REVACHOL CITIZEN</span>
        <span class="newspaper-divider">·</span>
        <span class="newspaper-date" id="newspaper-date">MON 26</span>
        <span class="newspaper-divider">·</span>
        <span class="newspaper-weather" id="newspaper-weather">
            <i class="fa-solid fa-sun" id="newspaper-weather-icon"></i>
            <span id="newspaper-weather-text">Clear</span>
            <span id="newspaper-weather-temp">52°</span>
        </span>
        <span class="newspaper-divider">·</span>
        <span class="newspaper-period" id="newspaper-period">AFTERNOON</span>
    </div>
    <div class="newspaper-torn-edge newspaper-torn-bottom"></div>
</div>
`;

// ═══════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_CSS = `
/* ═══════════════════════════════════════════════════════════════
   NEWSPAPER STRIP - Torn paper date/weather bar
   ═══════════════════════════════════════════════════════════════ */

.newspaper-strip {
    position: relative;
    margin: -10px -12px 12px -12px;
    background: #f5f0e6;
    font-family: 'Times New Roman', Georgia, serif;
    user-select: none;
}

.newspaper-torn-edge {
    position: absolute;
    left: 0;
    right: 0;
    height: 8px;
    background-repeat: repeat-x;
    background-size: 16px 8px;
}

.newspaper-torn-top {
    top: 0;
    /* Torn paper effect using CSS */
    background-image: 
        linear-gradient(135deg, #d4cbb8 25%, transparent 25%),
        linear-gradient(225deg, #d4cbb8 25%, transparent 25%);
    background-position: 0 0, 8px 0;
}

.newspaper-torn-bottom {
    bottom: 0;
    /* Inverted torn paper effect */
    background-image: 
        linear-gradient(315deg, #d4cbb8 25%, transparent 25%),
        linear-gradient(45deg, #d4cbb8 25%, transparent 25%);
    background-position: 0 0, 8px 0;
}

.newspaper-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 14px 12px;
    background: linear-gradient(
        180deg,
        #f8f4eb 0%,
        #f5f0e6 20%,
        #f0ebe0 80%,
        #ebe5d8 100%
    );
    /* Subtle paper texture */
    background-image: 
        linear-gradient(180deg, #f8f4eb 0%, #ebe5d8 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    border-top: 1px solid #c8c0b0;
    border-bottom: 1px solid #c8c0b0;
    /* Old newsprint shadow */
    box-shadow: 
        inset 0 1px 2px rgba(0,0,0,0.05),
        inset 0 -1px 2px rgba(0,0,0,0.03);
}

.newspaper-title {
    font-size: 11px;
    font-weight: bold;
    font-style: italic;
    letter-spacing: 1px;
    color: #2a2318;
    text-transform: uppercase;
}

.newspaper-divider {
    color: #8a7a60;
    font-size: 14px;
    font-weight: bold;
}

.newspaper-date {
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 1.5px;
    color: #3d3225;
    text-transform: uppercase;
}

.newspaper-weather {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #4a4035;
}

.newspaper-weather i {
    font-size: 12px;
    color: #6a5a40;
}

#newspaper-weather-text {
    font-style: italic;
}

#newspaper-weather-temp {
    font-weight: bold;
    color: #3d3225;
}

.newspaper-period {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #5c4d3d;
    text-transform: uppercase;
    padding: 2px 6px;
    background: rgba(92, 77, 61, 0.1);
    border-radius: 2px;
}

/* ═══════════════════════════════════════════════════════════════
   WEATHER-SPECIFIC STYLING
   ═══════════════════════════════════════════════════════════════ */

.newspaper-strip.weather-rain {
    background: #e8e4dc;
}

.newspaper-strip.weather-rain .newspaper-content {
    background: linear-gradient(180deg, #eae6de 0%, #e0dcd4 100%);
}

.newspaper-strip.weather-storm {
    background: #ddd9d0;
}

.newspaper-strip.weather-storm .newspaper-content {
    background: linear-gradient(180deg, #e0dcd4 0%, #d6d2ca 100%);
}

.newspaper-strip.weather-snow {
    background: #f0f0f0;
}

.newspaper-strip.weather-snow .newspaper-content {
    background: linear-gradient(180deg, #f5f5f5 0%, #eaeaea 100%);
}

.newspaper-strip.weather-mist {
    background: #e5e5e0;
}

.newspaper-strip.weather-mist .newspaper-content {
    background: linear-gradient(180deg, #eaeae5 0%, #e0e0db 100%);
    opacity: 0.95;
}

/* Night mode - darker paper */
.newspaper-strip.period-night,
.newspaper-strip.period-late-night {
    background: #e0dcd0;
}

.newspaper-strip.period-night .newspaper-content,
.newspaper-strip.period-late-night .newspaper-content {
    background: linear-gradient(180deg, #e5e0d5 0%, #d8d4c8 100%);
}

.newspaper-strip.period-night .newspaper-title,
.newspaper-strip.period-late-night .newspaper-title {
    color: #3d3830;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE - Smaller screens
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 400px) {
    .newspaper-title {
        display: none; /* Hide title on very small screens */
    }
    
    .newspaper-content {
        gap: 4px;
        padding: 10px 8px;
    }
    
    .newspaper-date,
    .newspaper-weather,
    .newspaper-period {
        font-size: 10px;
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// WEATHER ICON MAPPING
// ═══════════════════════════════════════════════════════════════

const WEATHER_ICONS = {
    'clear': 'fa-sun',
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
    'wind': 'fa-wind'
};

const PERIOD_NAMES = {
    'DAWN': 'Dawn',
    'MORNING': 'Morning',
    'AFTERNOON': 'Afternoon',
    'EVENING': 'Evening',
    'NIGHT': 'Night',
    'LATE_NIGHT': 'Late Night'
};

// ═══════════════════════════════════════════════════════════════
// UPDATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Update the newspaper strip with current data
 * @param {Object} data - Time/weather data
 * @param {string} data.dayOfWeek - e.g., "MON"
 * @param {number|string} data.day - e.g., 26
 * @param {string} data.weather - Weather type (clear, rain, etc.)
 * @param {string} data.weatherText - Display text (e.g., "Light Rain")
 * @param {number} data.temp - Temperature (optional)
 * @param {string} data.period - Time period (MORNING, AFTERNOON, etc.)
 */
export function updateNewspaperStrip(data) {
    const strip = document.getElementById('newspaper-strip');
    if (!strip) return;
    
    // Update date
    const dateEl = document.getElementById('newspaper-date');
    if (dateEl && data.dayOfWeek && data.day) {
        dateEl.textContent = `${data.dayOfWeek} ${data.day}`;
    }
    
    // Update weather icon
    const iconEl = document.getElementById('newspaper-weather-icon');
    if (iconEl && data.weather) {
        const iconClass = WEATHER_ICONS[data.weather] || 'fa-cloud';
        iconEl.className = 'fa-solid ' + iconClass;
    }
    
    // Update weather text
    const textEl = document.getElementById('newspaper-weather-text');
    if (textEl) {
        textEl.textContent = data.weatherText || data.weather || 'Unknown';
    }
    
    // Update temperature
    const tempEl = document.getElementById('newspaper-weather-temp');
    if (tempEl) {
        if (data.temp !== undefined) {
            tempEl.textContent = `${data.temp}°`;
            tempEl.style.display = '';
        } else {
            tempEl.style.display = 'none';
        }
    }
    
    // Update period
    const periodEl = document.getElementById('newspaper-period');
    if (periodEl && data.period) {
        periodEl.textContent = PERIOD_NAMES[data.period] || data.period;
    }
    
    // Update weather class for styling
    strip.className = 'newspaper-strip';
    if (data.weather) {
        strip.classList.add('weather-' + data.weather.replace('-day', '').replace('-night', ''));
    }
    if (data.period) {
        strip.classList.add('period-' + data.period.toLowerCase().replace('_', '-'));
    }
}

/**
 * Update from watch.js data (simpler interface)
 * Call this from your watch update or refresh functions
 */
export function updateNewspaperFromWatch() {
    // Try to get data from watch module if available
    // Falls back to sensible defaults
    
    const now = new Date();
    const hour = now.getHours();
    
    // Determine period from hour
    let period = 'AFTERNOON';
    if (hour >= 5 && hour < 7) period = 'DAWN';
    else if (hour >= 7 && hour < 12) period = 'MORNING';
    else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
    else if (hour >= 17 && hour < 20) period = 'EVENING';
    else if (hour >= 20 && hour < 23) period = 'NIGHT';
    else period = 'LATE_NIGHT';
    
    // Simple day/night weather
    const isNight = hour >= 20 || hour < 6;
    
    updateNewspaperStrip({
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: now.getDate(),
        weather: isNight ? 'clear-night' : 'clear-day',
        weatherText: 'Clear',
        period: period
    });
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Inject the newspaper strip into the map section
 */
export function initNewspaperStrip() {
    // Inject CSS if not already present
    if (!document.getElementById('newspaper-strip-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'newspaper-strip-styles';
        styleEl.textContent = NEWSPAPER_STRIP_CSS;
        document.head.appendChild(styleEl);
    }
    
    // Find the map content area
    const mapContent = document.querySelector('[data-ledger-content="map"]');
    if (!mapContent) {
        console.warn('[NewspaperStrip] Map content area not found');
        return;
    }
    
    // Check if already inserted
    if (document.getElementById('newspaper-strip')) {
        console.log('[NewspaperStrip] Already initialized');
        return;
    }
    
    // Insert at the beginning of map content
    mapContent.insertAdjacentHTML('afterbegin', NEWSPAPER_STRIP_HTML);
    
    // Initial update with current time
    updateNewspaperFromWatch();
    
    console.log('[NewspaperStrip] Initialized');
}
