/**
 * The Tribunal - FELD MREF Plus+ Radio
 * Ambient soundscape player synced with weather effects
 * 
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// STATION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const STATIONS = [
    {
        id: 'static',
        freq: '87.5',
        name: 'THE PALE',
        type: 'VOID',
        file: 'mixkit-broken-radio-frequency-signal-2563.wav',
        weather: ['pale'],
        description: 'Between stations. Between worlds.'
    },
    {
        id: 'snow',
        freq: '89.1',
        name: 'SNOWFALL',
        type: 'AMBIENT',
        file: 'Cold_Winter_Snow_and_Wind.wav',
        weather: ['snow'],
        description: 'Cold winds across frozen fields.'
    },
    {
        id: 'rain',
        freq: '91.7',
        name: 'RAINFALL',
        type: 'AMBIENT',
        file: 'heavy-rain_A_minor.wav',
        weather: ['rain'],
        description: 'Steady rain on Martinaise rooftops.'
    },
    {
        id: 'storm',
        freq: '93.3',
        name: 'TEMPEST',
        type: 'AMBIENT',
        file: 'rain-and-thunder_A_minor.wav',
        weather: ['storm'],
        description: 'Thunder rolls across the bay.'
    },
    {
        id: 'day',
        freq: '95.9',
        name: 'DAYBREAK',
        type: 'AMBIENT',
        file: 'Morning_Bird_Songs.wav',
        weather: ['day', 'clear'],
        description: 'Morning light filters through.'
    },
    {
        id: 'night',
        freq: '97.5',
        name: 'NIGHTSIDE',
        type: 'AMBIENT',
        file: 'Crickets_and_Woodpecker_at_Dusk.wav',
        weather: ['quiet-night'],
        description: 'The world settles into darkness.'
    },
    {
        id: 'wind',
        freq: '99.1',
        name: 'GALE',
        type: 'AMBIENT',
        file: 'wind-noise-long-fx_126bpm_B_major.wav',
        weather: ['wind'],
        description: 'Relentless winds off the sea.'
    },
    {
        id: 'fog',
        freq: '100.7',
        name: 'THE MIST',
        type: 'AMBIENT',
        file: 'mixkit-scary-graveyard-wind-1157.wav',
        weather: ['fog'],
        description: 'Shapes move in the grey.'
    },
    {
        id: 'horror',
        freq: '101.3',
        name: 'DREAD',
        type: 'SPECIAL',
        file: 'mixkit-cinematic-horror-heartbeat-transition-489.wav',
        weather: ['horror'],
        description: 'Your heart pounds. Something is wrong.'
    },
    {
        id: 'waves',
        freq: '103.9',
        name: 'HARBOR',
        type: 'AMBIENT',
        file: 'mixkit-close-sea-waves-loop-1195.wav',
        weather: ['waves'],
        description: 'Waves lap against the pier.'
    },
    {
        id: 'city',
        freq: '105.5',
        name: 'NEON DISTRICT',
        type: 'AMBIENT',
        file: 'night-city-ambient.wav',
        weather: ['city-night'],
        description: 'The city hums with electric life.'
    },
    {
        id: 'indoor',
        freq: '107.9',
        name: 'THE WHIRLING',
        type: 'AMBIENT',
        file: 'coffee-shop-recording-crowd-noise.wav',
        weather: ['indoor', 'smoke'],
        description: 'Murmurs and clinking glasses.'
    }
];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentStation = null;
let isPlaying = false;
let autoTune = true;
let volume = 0.5;
let audioElement = null;
let eqAnimationFrame = null;
let weatherUnsubscribe = null;
let initialized = false;

// Base path for audio files (absolute from ST webserver root)
const AUDIO_BASE_PATH = '/scripts/extensions/third-party/The-Tribunal/assets/audio/';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the radio system
 */
export function initRadio() {
    if (initialized) return;
    
    // Create audio element
    audioElement = new Audio();
    audioElement.loop = true;
    audioElement.volume = volume;
    
    // Audio event handlers
    audioElement.addEventListener('ended', () => {
        if (!audioElement.loop) {
            stopPlayback();
        }
    });
    
    audioElement.addEventListener('error', (e) => {
        console.error('[Radio] Audio error:', e);
        updateStationDisplay('NO SIGNAL');
    });
    
    audioElement.addEventListener('canplay', () => {
        console.log('[Radio] Audio ready:', currentStation?.name);
    });
    
    // Rebuild station list in DOM
    rebuildStationList();
    
    // Bind UI handlers
    bindRadioHandlers();
    
    // Connect to weather system
    connectToWeather();
    
    // Set initial station (daybreak default)
    currentStation = STATIONS.find(s => s.id === 'day') || STATIONS[0];
    updateRadioUI();
    
    // Expose to window for settings integration
    window.tribunalRadio = {
        play: startPlayback,
        stop: stopPlayback,
        toggle: togglePlayback,
        tune: tuneToStation,
        setAutoTune,
        setVolume,
        getState: getRadioState
    };
    
    initialized = true;
    console.log('[Radio] FELD MREF Plus+ initialized with', STATIONS.length, 'stations');
}

/**
 * Rebuild station list HTML to match STATIONS array
 */
function rebuildStationList() {
    const listEl = document.getElementById('ie-station-list');
    if (!listEl) {
        console.warn('[Radio] Station list element not found');
        return;
    }
    
    listEl.innerHTML = STATIONS.map((station, index) => `
        <div class="radio-station-item" data-station="${index}" data-id="${station.id}">
            <span class="station-freq">${station.freq}</span>
            <span class="station-name">${station.name}</span>
            <span class="station-type">${station.type}</span>
        </div>
    `).join('');
}

/**
 * Connect to weather integration events
 */
async function connectToWeather() {
    try {
        const weatherModule = await import('../systems/weather-integration.js');
        
        if (weatherModule.subscribe) {
            weatherUnsubscribe = weatherModule.subscribe((data) => {
                if (autoTune) {
                    onWeatherChange(data);
                }
            });
            console.log('[Radio] Connected to weather system');
        }
        
        // Get initial weather state
        if (weatherModule.getState) {
            const state = weatherModule.getState();
            if (state && autoTune) {
                onWeatherChange(state);
            }
        }
    } catch (e) {
        console.warn('[Radio] Weather system not available:', e.message);
    }
}

/**
 * Handle weather changes - auto-tune to matching station
 */
function onWeatherChange(data) {
    if (!autoTune) return;
    
    // Priority: special > weather > period
    let targetWeather = null;
    
    if (data.special) {
        targetWeather = data.special;
    } else if (data.weather && data.weather !== 'clear') {
        targetWeather = data.weather;
    } else if (data.period) {
        targetWeather = data.period;
    }
    
    if (!targetWeather) return;
    
    // Find matching station
    const matchingStation = STATIONS.find(s => 
        s.weather.includes(targetWeather)
    );
    
    if (matchingStation && matchingStation.id !== currentStation?.id) {
        console.log('[Radio] Weather auto-tune:', targetWeather, '→', matchingStation.name);
        
        const wasPlaying = isPlaying;
        tuneToStation(matchingStation.id);
        
        // Continue playing if was playing
        if (wasPlaying) {
            startPlayback();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// UI BINDING
// ═══════════════════════════════════════════════════════════════

/**
 * Bind radio UI event handlers
 */
function bindRadioHandlers() {
    // Station list clicks (use event delegation)
    const stationList = document.getElementById('ie-station-list');
    if (stationList) {
        stationList.addEventListener('click', (e) => {
            const item = e.target.closest('.radio-station-item');
            if (item) {
                const stationId = item.dataset.id;
                if (stationId) {
                    tuneToStation(stationId);
                    startPlayback();
                }
            }
        });
    }
    
    // Knob clicks
    const knobGroups = document.querySelectorAll('.radio-knob-group');
    knobGroups.forEach(group => {
        const label = group.querySelector('.radio-knob-label')?.textContent;
        const knob = group.querySelector('.radio-knob');
        
        if (!knob) return;
        
        knob.style.cursor = 'pointer';
        
        if (label === 'POWER') {
            knob.addEventListener('click', togglePlayback);
        } else if (label === 'VOL') {
            knob.addEventListener('click', cycleVolume);
        } else if (label === 'TUNE') {
            knob.addEventListener('click', tuneNext);
        }
    });
    
    // FM/AM band toggle
    const fmBtn = document.querySelector('.radio-label-fm');
    const amBtn = document.querySelector('.radio-label-am');
    
    if (fmBtn) fmBtn.addEventListener('click', () => setBand('fm'));
    if (amBtn) amBtn.addEventListener('click', () => setBand('am'));
    
    console.log('[Radio] UI handlers bound');
}

/**
 * Cycle through volume levels
 */
function cycleVolume() {
    const levels = [0.25, 0.5, 0.75, 1.0];
    const currentIdx = levels.findIndex(l => Math.abs(l - volume) < 0.1);
    const nextIdx = (currentIdx + 1) % levels.length;
    setVolume(levels[nextIdx]);
    
    if (typeof toastr !== 'undefined') {
        toastr.info(`Volume: ${Math.round(levels[nextIdx] * 100)}%`, 'Radio', { timeOut: 1000 });
    }
}

/**
 * Tune to next station
 */
function tuneNext() {
    const currentIdx = currentStation 
        ? STATIONS.findIndex(s => s.id === currentStation.id)
        : -1;
    const nextIdx = (currentIdx + 1) % STATIONS.length;
    tuneToStation(STATIONS[nextIdx].id);
    
    if (isPlaying) {
        startPlayback();
    }
}

/**
 * Set FM/AM band (visual only for now)
 */
function setBand(band) {
    const fm = document.querySelector('.radio-label-fm');
    const am = document.querySelector('.radio-label-am');
    
    if (fm && am) {
        const isFM = band === 'fm';
        
        fm.style.background = isFM ? 'var(--radio-needle)' : 'transparent';
        fm.style.color = isFM ? 'white' : '#6a5a4a';
        fm.style.border = isFM ? 'none' : '1px solid #8b7355';
        
        am.style.background = !isFM ? 'var(--radio-needle)' : 'transparent';
        am.style.color = !isFM ? 'white' : '#6a5a4a';
        am.style.border = !isFM ? 'none' : '1px solid #8b7355';
    }
}

// ═══════════════════════════════════════════════════════════════
// PLAYBACK CONTROL
// ═══════════════════════════════════════════════════════════════

/**
 * Tune to a specific station (by ID)
 */
export function tuneToStation(stationId) {
    const station = STATIONS.find(s => s.id === stationId);
    if (!station) {
        console.warn('[Radio] Station not found:', stationId);
        return false;
    }
    
    currentStation = station;
    
    // Load new audio source (but don't play yet)
    if (audioElement) {
        const wasPlaying = isPlaying;
        if (wasPlaying) {
            audioElement.pause();
        }
        audioElement.src = AUDIO_BASE_PATH + station.file;
        // Don't autoplay - let startPlayback handle it
    }
    
    updateRadioUI();
    console.log('[Radio] Tuned to:', station.name, `(${station.freq} MHz)`);
    return true;
}

/**
 * Start audio playback
 */
export function startPlayback() {
    if (!currentStation) {
        console.warn('[Radio] No station selected');
        if (typeof toastr !== 'undefined') {
            toastr.warning('No station selected', 'Radio');
        }
        return;
    }
    
    if (!audioElement) {
        console.error('[Radio] Audio element not initialized');
        return;
    }
    
    // Build full audio path
    const audioSrc = AUDIO_BASE_PATH + currentStation.file;
    console.log('[Radio] Loading audio:', audioSrc);
    
    // Always set source (in case it changed)
    audioElement.src = audioSrc;
    audioElement.load(); // Force reload
    
    audioElement.play().then(() => {
        isPlaying = true;
        updatePlayingState(true);
        startEQAnimation();
        console.log('[Radio] Playing:', currentStation.name);
        if (typeof toastr !== 'undefined') {
            toastr.success(`Now playing: ${currentStation.name}`, 'Radio', { timeOut: 2000 });
        }
    }).catch(e => {
        console.error('[Radio] Playback failed:', e.message);
        isPlaying = false;
        updatePlayingState(false);
        
        if (typeof toastr !== 'undefined') {
            if (e.name === 'NotAllowedError') {
                toastr.warning('Click again to play (browser blocked autoplay)', 'Radio', { timeOut: 3000 });
            } else if (e.name === 'NotSupportedError') {
                toastr.error(`Audio file not found: ${currentStation.file}`, 'Radio', { timeOut: 5000 });
            } else {
                toastr.error(`Playback error: ${e.message}`, 'Radio', { timeOut: 3000 });
            }
        }
    });
}

/**
 * Stop audio playback
 */
export function stopPlayback() {
    if (!audioElement) return;
    
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
    updatePlayingState(false);
    stopEQAnimation();
    console.log('[Radio] Stopped');
}

/**
 * Toggle playback on/off
 */
export function togglePlayback() {
    console.log('[Radio] Toggle called, isPlaying:', isPlaying);
    if (isPlaying) {
        stopPlayback();
        if (typeof toastr !== 'undefined') {
            toastr.info('Radio OFF', 'Radio', { timeOut: 1000 });
        }
    } else {
        startPlayback();
    }
}

/**
 * Set volume (0-1)
 */
export function setVolume(vol) {
    volume = Math.max(0, Math.min(1, vol));
    if (audioElement) {
        audioElement.volume = volume;
    }
    updateVolumeKnob();
}

/**
 * Set auto-tune mode
 */
export function setAutoTune(enabled) {
    autoTune = enabled;
    console.log('[Radio] Auto-tune:', enabled ? 'ON' : 'OFF');
}

// ═══════════════════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════════════════

/**
 * Update all radio UI elements
 */
function updateRadioUI() {
    if (!currentStation) return;
    
    updateStationDisplay(currentStation.name);
    updateNeedle(currentStation.freq);
    updateStationList();
}

/**
 * Update the station name display
 */
function updateStationDisplay(name) {
    const display = document.getElementById('ie-station-name');
    if (display) {
        display.textContent = name;
    }
}

/**
 * Update needle position based on frequency
 */
function updateNeedle(freq) {
    const needle = document.getElementById('ie-radio-needle');
    if (!needle) return;
    
    // Map frequency (87.5 - 108.0) to percentage (5% - 95%)
    const freqNum = parseFloat(freq);
    const minFreq = 87.5;
    const maxFreq = 108.0;
    const percentage = ((freqNum - minFreq) / (maxFreq - minFreq)) * 90 + 5;
    
    needle.style.left = `${percentage}%`;
}

/**
 * Update station list active state
 */
function updateStationList() {
    const items = document.querySelectorAll('.radio-station-item');
    items.forEach(item => {
        const stationId = item.dataset.id;
        item.classList.toggle('active', stationId === currentStation?.id);
    });
}

/**
 * Update playing state UI (antenna, ON AIR light)
 */
function updatePlayingState(playing) {
    const radio = document.getElementById('ie-radio');
    if (radio) {
        radio.classList.toggle('is-playing', playing);
    }
    
    // Update power knob
    const powerKnob = document.querySelector('.radio-knob-group .radio-knob-indicator');
    if (powerKnob) {
        powerKnob.style.transform = playing ? 'rotate(30deg)' : 'rotate(-30deg)';
    }
}

/**
 * Update volume knob indicator
 */
function updateVolumeKnob() {
    const knobGroups = document.querySelectorAll('.radio-knob-group');
    knobGroups.forEach(group => {
        const label = group.querySelector('.radio-knob-label')?.textContent;
        if (label === 'VOL') {
            const indicator = group.querySelector('.radio-knob-indicator');
            if (indicator) {
                // Map 0-1 to -135° to 135°
                const rotation = (volume * 270) - 135;
                indicator.style.transform = `rotate(${rotation}deg)`;
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// EQ VISUALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Start EQ bar animation
 */
function startEQAnimation() {
    const bars = document.querySelectorAll('#ie-radio-eq .radio-eq-bar');
    if (bars.length === 0) return;
    
    function animateBars() {
        bars.forEach(bar => {
            const height = 10 + Math.random() * 40;
            bar.style.height = `${height}px`;
        });
        
        if (isPlaying) {
            eqAnimationFrame = requestAnimationFrame(() => {
                setTimeout(animateBars, 80 + Math.random() * 50);
            });
        }
    }
    
    animateBars();
}

/**
 * Stop EQ bar animation
 */
function stopEQAnimation() {
    if (eqAnimationFrame) {
        cancelAnimationFrame(eqAnimationFrame);
        eqAnimationFrame = null;
    }
    
    // Reset bars
    const bars = document.querySelectorAll('#ie-radio-eq .radio-eq-bar');
    bars.forEach(bar => {
        bar.style.height = '100%';
    });
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get current radio state
 */
export function getRadioState() {
    return {
        station: currentStation?.id || null,
        stationName: currentStation?.name || null,
        isPlaying,
        autoTune,
        volume
    };
}

/**
 * Get all available stations
 */
export function getStations() {
    return [...STATIONS];
}

/**
 * Find station for weather condition
 */
export function getStationForWeather(weather) {
    return STATIONS.find(s => s.weather.includes(weather));
}

/**
 * Restore radio state (for persistence)
 */
export function restoreRadioState(state) {
    if (!state) return;
    
    if (state.station) {
        tuneToStation(state.station);
    }
    if (typeof state.autoTune === 'boolean') {
        autoTune = state.autoTune;
    }
    if (typeof state.volume === 'number') {
        setVolume(state.volume);
    }
    // Don't auto-resume playback
}

/**
 * Clean up radio resources
 */
export function destroyRadio() {
    stopPlayback();
    
    if (weatherUnsubscribe) {
        weatherUnsubscribe();
        weatherUnsubscribe = null;
    }
    
    if (audioElement) {
        audioElement.src = '';
        audioElement = null;
    }
    
    initialized = false;
    console.log('[Radio] Destroyed');
}

// Export stations constant
export { STATIONS };
