/**
 * The Tribunal - PÉRIPHÉRIQUE Newspaper Component
 * Full newspaper display matching Disco Elysium's aesthetic
 * 
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// SHIVERS FALLBACK QUIPS
// ═══════════════════════════════════════════════════════════════

const FALLBACK_QUIPS = {
    rain: {
        morning: "The rain arrived before dawn, patient and persistent. It drums against windows and pools in gutters, carrying the district's secrets toward the sea.",
        afternoon: "Afternoon rain transforms the streets into mirrors. Each puddle reflects a different version of the city—older, sadder, more honest.",
        evening: "Evening rain falls heavier now, as if the sky has been saving up its grief. Neon signs bleed color across wet pavement.",
        night: "Night rain speaks in whispers against your collar. The streets empty of everyone except those with nowhere else to be."
    },
    storm: {
        morning: "The storm rolled in like an argument that's been building for days. Lightning illuminates the district's bones—the old architecture, the cracked facades.",
        afternoon: "Thunder shakes the windows in their frames. The air tastes electric, metallic. This storm has opinions about this city.",
        evening: "The evening storm turns violent. Rain comes sideways now, finding every crack in your resolve. Power flickers in the old quarter.",
        night: "Night storms reveal what daylight hides. In the flash of lightning, you see the truth of every alley, every shadow that shouldn't move but does."
    },
    snow: {
        morning: "Snow fell while you slept, erasing yesterday's footprints. The district looks almost innocent now, wrapped in white gauze. But you know what's underneath.",
        afternoon: "The afternoon snow falls thick and silent, muffling the usual arguments and machinery. Even the drunks seem reverent.",
        evening: "Evening snow transforms the streetlights into halos. Everything moves slower, gentler. But the cold is serious—it seeps through boot soles and settles in joints.",
        night: "Snowfall at night carries its own silence, a pressure against the eardrums. Footsteps crunch too loud. Your breath ghosts away."
    },
    fog: {
        morning: "Morning fog hasn't lifted—it rarely does in this district. Shapes emerge from the grey and dissolve back into it. The familiar becomes uncertain.",
        afternoon: "Afternoon, and still the fog persists. Sound travels strangely—voices from unseen conversations, footsteps that could be anywhere.",
        evening: "Evening fog thickens, swallowing the streetlights whole. You navigate by memory and instinct. Everyone you pass could be anyone.",
        night: "Night fog makes the city into a maze of uncertain dimensions. You are walking through clouds that never rose."
    },
    clear: {
        morning: "Clear morning light arrives without mercy, exposing every stain, every crack, every poor decision made in darkness.",
        afternoon: "Clear skies press down with the weight of visibility. Nowhere to hide today—not for you, not for anyone.",
        evening: "The evening sky turns colors you don't have names for. Clear air carries sounds from blocks away—someone practicing accordion, badly.",
        night: "Clear night sky means the stars are watching. They've been watching for longer than this city has existed."
    },
    overcast: {
        morning: "Grey morning, like most mornings here. The clouds are thinking, have been thinking for days. No weather, just waiting.",
        afternoon: "Overcast afternoon—the sky refuses to commit. No rain, no sun, just a pressing weight of grey.",
        evening: "Dusk comes early under heavy clouds. The distinction between day and night blurs at the edges.",
        night: "No moon tonight, no stars—just cloud cover like a lid on a pot. The darkness feels thicker than usual."
    },
    wind: {
        morning: "The morning wind carries voices from the harbor—sailors cursing, gulls screaming, ropes snapping against masts.",
        afternoon: "Afternoon gusts tear through the district, scattering newspapers and regrets equally. Hold onto your hat.",
        evening: "Evening wind howls between buildings like grief finding its voice. Shutters bang. Somewhere, a door slams repeatedly.",
        night: "Night wind speaks in a language older than this city. It remembers what stood here before. It disapproves of what replaced it."
    }
};

function getShiversQuip(weather, period) {
    let weatherKey = (weather || 'overcast').toLowerCase()
        .replace('-day', '').replace('-night', '')
        .replace('rainy', 'rain').replace('stormy', 'storm')
        .replace('snowy', 'snow').replace('foggy', 'fog')
        .replace('windy', 'wind').replace('cloudy', 'overcast')
        .replace('mist', 'fog');
    
    let periodKey = 'afternoon';
    const p = (period || '').toLowerCase();
    if (p.includes('dawn') || p.includes('morning') || p === 'day') periodKey = 'morning';
    else if (p.includes('evening') || p === 'city-night') periodKey = 'evening';
    else if (p.includes('night') || p === 'quiet-night' || p === 'latenight') periodKey = 'night';
    
    const weatherQuips = FALLBACK_QUIPS[weatherKey] || FALLBACK_QUIPS.overcast;
    return weatherQuips[periodKey] || weatherQuips.afternoon;
}

// ═══════════════════════════════════════════════════════════════
// HTML TEMPLATE - Disco Elysium PÉRIPHÉRIQUE Style
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_HTML = `
<div class="peripherique-paper" id="newspaper-strip">
    <!-- Header Row -->
    <div class="peripherique-header">
        <!-- Weather Box -->
        <div class="peripherique-weather-box">
            <div class="weather-label">WEATHER</div>
            <div class="weather-condition" id="newspaper-weather-text">Overcast</div>
            <div class="weather-temp" id="newspaper-weather-temp"></div>
            <i class="weather-icon fa-solid fa-cloud" id="newspaper-weather-icon"></i>
        </div>
        
        <!-- Masthead -->
        <div class="peripherique-masthead">
            <span class="masthead-bracket">═╡</span>
            <span class="masthead-title">PÉRIPHÉRIQUE</span>
            <span class="masthead-bracket">╞═</span>
        </div>
        
        <!-- Publication Info -->
        <div class="peripherique-pub-info">
            <div>The Jamrock</div>
            <div>News Company</div>
        </div>
    </div>
    
    <!-- Date Line -->
    <div class="peripherique-dateline">
        <span class="issue-number">No. <span id="newspaper-issue">????</span></span>
        <span class="dateline-location">REVACHOL, <span id="newspaper-date">??? ??, ??</span></span>
        <span class="paper-price">◉ 1.5</span>
    </div>
    
    <!-- Shivers Section -->
    <div class="peripherique-shivers">
        <p class="shivers-quip" id="shivers-quip">The city watches. It always watches. Even now, it feels your footsteps on its skin.</p>
        <div class="shivers-attribution">— THE CITY SPEAKS</div>
    </div>
    
    <!-- Period Tag -->
    <div class="peripherique-edition">
        <span id="newspaper-period">AFTERNOON EDITION</span>
    </div>
</div>
`;

// ═══════════════════════════════════════════════════════════════
// CSS STYLES - Dark aged newspaper aesthetic
// ═══════════════════════════════════════════════════════════════

export const NEWSPAPER_STRIP_CSS = `
/* ═══════════════════════════════════════════════════════════════
   PÉRIPHÉRIQUE NEWSPAPER - Disco Elysium Style
   ═══════════════════════════════════════════════════════════════ */

.peripherique-paper {
    position: relative;
    margin: -10px -12px 12px -12px;
    background: #2a2520;
    font-family: 'Times New Roman', Georgia, 'Noto Serif', serif;
    user-select: none;
    border: 3px solid #4a4035;
    box-shadow: 
        0 4px 16px rgba(0,0,0,0.4),
        inset 0 0 100px rgba(0,0,0,0.3);
    
    /* Aged paper texture overlay */
    background-image: 
        linear-gradient(180deg, 
            rgba(42, 37, 32, 0.95) 0%, 
            rgba(35, 30, 25, 0.98) 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
}

/* ═══════════════════════════════════════════════════════════════
   HEADER ROW
   ═══════════════════════════════════════════════════════════════ */

.peripherique-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #4a4035;
    background: linear-gradient(180deg, rgba(50,45,38,0.9) 0%, rgba(42,37,32,0.95) 100%);
}

/* Weather Box */
.peripherique-weather-box {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    gap: 2px 8px;
    padding: 6px 10px;
    border: 1px solid #5a5045;
    background: rgba(35, 30, 25, 0.8);
    font-size: 10px;
    line-height: 1.3;
}

.peripherique-weather-box .weather-label {
    grid-column: 1 / -1;
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #8a7a65;
    border-bottom: 1px solid #4a4035;
    padding-bottom: 3px;
    margin-bottom: 2px;
}

.peripherique-weather-box .weather-condition {
    font-style: italic;
    color: #c8b8a0;
    font-size: 11px;
}

.peripherique-weather-box .weather-temp {
    font-weight: bold;
    color: #d4c4a8;
    text-align: right;
    font-size: 11px;
}

.peripherique-weather-box .weather-icon {
    grid-column: 2;
    grid-row: 2 / 4;
    font-size: 16px;
    color: #8a7a60;
    justify-self: end;
    align-self: center;
}

/* Masthead */
.peripherique-masthead {
    text-align: center;
    padding: 0 15px;
}

.masthead-bracket {
    font-size: 20px;
    color: #6a5a48;
    vertical-align: middle;
    font-weight: 300;
}

.masthead-title {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: 6px;
    color: #d4c8b8;
    text-transform: uppercase;
    text-shadow: 
        1px 1px 2px rgba(0,0,0,0.5),
        0 0 20px rgba(180, 160, 130, 0.1);
}

/* Publication Info */
.peripherique-pub-info {
    text-align: right;
    font-size: 8px;
    line-height: 1.4;
    color: #7a6a58;
    font-style: italic;
}

/* ═══════════════════════════════════════════════════════════════
   DATE LINE
   ═══════════════════════════════════════════════════════════════ */

.peripherique-dateline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    font-size: 10px;
    color: #9a8a78;
    border-bottom: 2px solid #5a5045;
    background: rgba(35, 30, 25, 0.6);
}

.issue-number {
    font-weight: bold;
    letter-spacing: 1px;
    color: #8a7a68;
}

.dateline-location {
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #b0a090;
}

.paper-price {
    font-weight: bold;
    color: #8a7a60;
}

/* ═══════════════════════════════════════════════════════════════
   SHIVERS QUIP SECTION
   ═══════════════════════════════════════════════════════════════ */

.peripherique-shivers {
    padding: 14px 20px 12px;
    text-align: center;
    background: linear-gradient(180deg, 
        rgba(35, 30, 25, 0.4) 0%, 
        rgba(40, 35, 28, 0.6) 100%);
    border-bottom: 1px solid #4a4035;
}

.shivers-quip {
    font-size: 13px;
    font-style: italic;
    line-height: 1.6;
    color: #c8b8a0;
    margin: 0 0 8px 0;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.shivers-attribution {
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 3px;
    color: #6a5a48;
    text-transform: uppercase;
}

/* Loading state */
.shivers-quip.shivers-loading {
    opacity: 0.5;
    animation: shivers-pulse 1.5s ease-in-out infinite;
}

@keyframes shivers-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

/* ═══════════════════════════════════════════════════════════════
   EDITION TAG
   ═══════════════════════════════════════════════════════════════ */

.peripherique-edition {
    text-align: center;
    padding: 6px 12px 8px;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 3px;
    color: #7a6a58;
    text-transform: uppercase;
    background: linear-gradient(180deg, rgba(40,35,28,0.5) 0%, rgba(35,30,25,0.7) 100%);
}

/* ═══════════════════════════════════════════════════════════════
   WEATHER-SPECIFIC STYLING
   ═══════════════════════════════════════════════════════════════ */

.peripherique-paper.weather-rain,
.peripherique-paper.weather-storm {
    background-color: #252220;
    border-color: #3a3530;
}

.peripherique-paper.weather-rain .shivers-quip,
.peripherique-paper.weather-storm .shivers-quip {
    color: #b8c8d0;
}

.peripherique-paper.weather-snow {
    background-color: #2a2a30;
    border-color: #4a4a55;
}

.peripherique-paper.weather-snow .masthead-title {
    color: #e0e0e8;
}

.peripherique-paper.weather-snow .shivers-quip {
    color: #d0d8e0;
}

.peripherique-paper.weather-fog,
.peripherique-paper.weather-mist {
    background-color: #282828;
}

.peripherique-paper.weather-fog .shivers-quip,
.peripherique-paper.weather-mist .shivers-quip {
    color: #a8a8a0;
}

/* Clear weather - slightly warmer */
.peripherique-paper.weather-clear {
    border-color: #5a4a35;
}

.peripherique-paper.weather-clear .masthead-title {
    color: #e0d0b8;
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE RESPONSIVE
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 480px) {
    .peripherique-masthead {
        padding: 0 8px;
    }
    
    .masthead-title {
        font-size: 20px;
        letter-spacing: 3px;
    }
    
    .masthead-bracket {
        font-size: 14px;
    }
    
    .peripherique-weather-box {
        padding: 4px 6px;
        font-size: 9px;
    }
    
    .peripherique-weather-box .weather-icon {
        font-size: 14px;
    }
    
    .peripherique-pub-info {
        display: none;
    }
    
    .shivers-quip {
        font-size: 12px;
        padding: 0 8px;
    }
    
    .dateline-location {
        font-size: 9px;
        letter-spacing: 1px;
    }
    
    .issue-number,
    .paper-price {
        font-size: 9px;
    }
    
    .peripherique-header {
        padding: 6px 8px;
    }
    
    .peripherique-dateline {
        padding: 4px 8px;
    }
}

@media (max-width: 360px) {
    .masthead-title {
        font-size: 16px;
        letter-spacing: 2px;
    }
    
    .masthead-bracket {
        display: none;
    }
    
    .peripherique-weather-box {
        display: none;
    }
    
    .peripherique-header {
        grid-template-columns: 1fr;
        justify-items: center;
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
    'overcast': 'fa-cloud',
    'rain': 'fa-cloud-rain',
    'rainy': 'fa-cloud-rain',
    'storm': 'fa-cloud-bolt',
    'stormy': 'fa-cloud-bolt',
    'snow': 'fa-snowflake',
    'snowy': 'fa-snowflake',
    'blizzard': 'fa-snowflake',
    'fog': 'fa-smog',
    'mist': 'fa-smog',
    'foggy': 'fa-smog',
    'wind': 'fa-wind',
    'windy': 'fa-wind'
};

const PERIOD_EDITIONS = {
    'DAWN': 'EARLY EDITION',
    'MORNING': 'MORNING EDITION', 
    'AFTERNOON': 'AFTERNOON EDITION',
    'EVENING': 'EVENING EDITION',
    'NIGHT': 'NIGHT EDITION',
    'LATE_NIGHT': 'LATE EDITION',
    'day': 'DAILY EDITION',
    'city-night': 'NIGHT EDITION',
    'quiet-night': 'LATE EDITION',
    'indoor': 'SPECIAL EDITION'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentState = {
    weather: 'overcast',
    period: 'afternoon',
    location: null
};

let weatherSubscription = null;
let issueNumber = Math.floor(Math.random() * 9000) + 1000;

// ═══════════════════════════════════════════════════════════════
// UPDATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Update the newspaper strip with current data
 */
export function updateNewspaperStrip(data) {
    const strip = document.getElementById('newspaper-strip');
    if (!strip) return;
    
    // Track state
    if (data.weather) currentState.weather = data.weather;
    if (data.period) currentState.period = data.period;
    if (data.location) currentState.location = data.location;
    
    // Update issue number
    const issueEl = document.getElementById('newspaper-issue');
    if (issueEl) {
        issueEl.textContent = issueNumber;
    }
    
    // Update date
    const dateEl = document.getElementById('newspaper-date');
    if (dateEl) {
        if (data.dayOfWeek && data.day) {
            const now = new Date();
            const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
            dateEl.textContent = `${data.dayOfWeek}, ${month} ${data.day}, '51`;
        }
    }
    
    // Update weather icon
    const iconEl = document.getElementById('newspaper-weather-icon');
    if (iconEl && data.weather) {
        const iconClass = WEATHER_ICONS[data.weather] || 'fa-cloud';
        iconEl.className = 'weather-icon fa-solid ' + iconClass;
    }
    
    // Update weather text
    const textEl = document.getElementById('newspaper-weather-text');
    if (textEl) {
        const weatherText = data.weatherText || data.weather || 'Overcast';
        textEl.textContent = weatherText.charAt(0).toUpperCase() + weatherText.slice(1);
    }
    
    // Update temperature
    const tempEl = document.getElementById('newspaper-weather-temp');
    if (tempEl) {
        if (data.temp !== undefined && data.temp !== null) {
            const low = Math.max(0, data.temp - 8);
            const high = data.temp + 5;
            tempEl.textContent = `${low}-${high}°`;
        } else {
            tempEl.textContent = '';
        }
    }
    
    // Update period/edition
    const periodEl = document.getElementById('newspaper-period');
    if (periodEl && data.period) {
        periodEl.textContent = PERIOD_EDITIONS[data.period] || 'EDITION';
    }
    
    // Update weather class for styling
    strip.className = 'peripherique-paper';
    if (data.weather) {
        const weatherClass = data.weather.replace('-day', '').replace('-night', '');
        strip.classList.add('weather-' + weatherClass);
    }
    if (data.period) {
        strip.classList.add('period-' + data.period.toLowerCase().replace('_', '-'));
    }
    
    // Update Shivers quip
    updateShiversQuip(data.weather, data.period);
}

/**
 * Update the Shivers quip based on weather/period
 */
function updateShiversQuip(weather, period) {
    const quipEl = document.getElementById('shivers-quip');
    if (!quipEl) return;
    
    const quip = getShiversQuip(weather || currentState.weather, period || currentState.period);
    
    quipEl.classList.add('shivers-loading');
    
    setTimeout(() => {
        quipEl.textContent = quip;
        quipEl.classList.remove('shivers-loading');
    }, 300);
}

/**
 * Handle weather change event from weather-integration.js
 */
function onWeatherChange(data) {
    console.log('[Périphérique] Weather change event:', data);
    
    const { weather, period, special, temp, location } = data;
    
    if (special) return;
    
    updateNewspaperStrip({
        weather: weather,
        period: period,
        temp: temp?.value,
        location: location
    });
}

/**
 * Update from watch.js data
 */
export function updateNewspaperFromWatch() {
    const now = new Date();
    const hour = now.getHours();
    
    let period = 'AFTERNOON';
    if (hour >= 5 && hour < 7) period = 'DAWN';
    else if (hour >= 7 && hour < 12) period = 'MORNING';
    else if (hour >= 12 && hour < 17) period = 'AFTERNOON';
    else if (hour >= 17 && hour < 20) period = 'EVENING';
    else if (hour >= 20 && hour < 23) period = 'NIGHT';
    else period = 'LATE_NIGHT';
    
    const isNight = hour >= 20 || hour < 6;
    
    updateNewspaperStrip({
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
        day: now.getDate(),
        weather: isNight ? 'clear-night' : 'clear-day',
        weatherText: 'Clear',
        period: period
    });
}

/**
 * Connect to weather-integration events
 */
async function connectToWeatherSystem() {
    try {
        const weatherModule = await import('../systems/weather-integration.js');
        
        if (weatherModule.subscribe) {
            weatherSubscription = weatherModule.subscribe(onWeatherChange);
            console.log('[Périphérique] ✓ Subscribed to weather events');
            
            if (weatherModule.getState) {
                const state = weatherModule.getState();
                if (state.weather || state.period) {
                    onWeatherChange(state);
                }
            }
        }
    } catch (e) {
        console.warn('[Périphérique] Weather integration not available:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initNewspaperStrip() {
    if (!document.getElementById('peripherique-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'peripherique-styles';
        styleEl.textContent = NEWSPAPER_STRIP_CSS;
        document.head.appendChild(styleEl);
    }
    
    const mapContent = document.querySelector('[data-ledger-content="map"]');
    if (!mapContent) {
        console.warn('[Périphérique] Map content area not found');
        return;
    }
    
    if (document.getElementById('newspaper-strip')) {
        console.log('[Périphérique] Already initialized');
        return;
    }
    
    mapContent.insertAdjacentHTML('afterbegin', NEWSPAPER_STRIP_HTML);
    
    connectToWeatherSystem();
    updateNewspaperFromWatch();
    
    console.log('[Périphérique] ✓ Newspaper initialized');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG HELPERS
// ═══════════════════════════════════════════════════════════════

export function debugNewspaper() {
    return {
        currentState,
        subscribed: !!weatherSubscription,
        element: !!document.getElementById('newspaper-strip'),
        quipElement: !!document.getElementById('shivers-quip')
    };
}

export function testWeather(weather, period = 'afternoon') {
    updateNewspaperStrip({ weather, period });
}
