/**
 * The Tribunal - Location Handlers
 * Handles current location, events, and discovered locations in MAP tab
 * 
 * @version 1.0.0
 */

import { 
    getLedger,
    getCurrentLocation,
    setCurrentLocation,
    addLocation, 
    updateLocation,
    removeLocation,
    addLocationEvent,
    removeLocationEvent
} from '../core/state.js';
import { saveChatState } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// STATE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all discovered locations
 */
function getLocations() {
    const ledger = getLedger();
    return ledger?.locations || [];
}

/**
 * Get events for current location
 */
function getCurrentLocationEvents() {
    const current = getCurrentLocation();
    if (!current) return [];
    
    const locations = getLocations();
    const loc = locations.find(l => l.id === current.id);
    return loc?.events || [];
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render current location display
 */
function renderCurrentLocation() {
    const nameEl = document.getElementById('current-location-name');
    const current = getCurrentLocation();
    
    if (nameEl) {
        nameEl.textContent = current?.name || 'Unknown Location';
    }
}

/**
 * Render events list for current location
 */
function renderEvents() {
    const listEl = document.getElementById('events-list');
    const emptyEl = document.getElementById('events-empty');
    
    if (!listEl) return;
    
    const events = getCurrentLocationEvents();
    
    if (events.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    
    // Show most recent events first (max 5)
    const recentEvents = events.slice(-5).reverse();
    
    listEl.innerHTML = recentEvents.map((event, index) => `
        <li data-event-index="${events.length - 1 - index}">
            ${escapeHtml(event.text)}
            <button class="event-delete" data-index="${events.length - 1 - index}" title="Remove event">
                <i class="fa-solid fa-times"></i>
            </button>
        </li>
    `).join('');
}

/**
 * Render discovered locations list
 */
function renderLocations() {
    const listEl = document.getElementById('locations-list');
    const emptyEl = document.getElementById('locations-empty');
    const countEl = document.getElementById('locations-count');
    
    if (!listEl) return;
    
    const locations = getLocations();
    const current = getCurrentLocation();
    
    // Update count
    if (countEl) {
        countEl.textContent = locations.length > 0 ? `(${locations.length})` : '';
    }
    
    if (locations.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    
    listEl.innerHTML = locations.map(loc => {
        const isCurrent = current?.id === loc.id;
        const eventCount = loc.events?.length || 0;
        
        return `
            <div class="location-card ${isCurrent ? 'current' : ''}" data-location-id="${loc.id}">
                <div class="location-card-header">
                    <i class="fa-solid fa-location-dot location-card-icon"></i>
                    <span class="location-card-name">${escapeHtml(loc.name)}</span>
                    ${loc.district ? `<span class="location-card-district">${escapeHtml(loc.district)}</span>` : ''}
                </div>
                ${loc.description ? `<div class="location-card-desc">${escapeHtml(loc.description)}</div>` : ''}
                <div class="location-card-meta">
                    <span class="location-visited ${loc.visited ? 'visited' : ''}">
                        <i class="fa-solid ${loc.visited ? 'fa-check' : 'fa-circle-dot'}"></i>
                        ${loc.visited ? 'Visited' : 'Unvisited'}
                    </span>
                    ${eventCount > 0 ? `<span class="location-events-count"><i class="fa-solid fa-list"></i> ${eventCount} event${eventCount !== 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Refresh all location UI
 */
export function refreshLocations() {
    renderCurrentLocation();
    renderEvents();
    renderLocations();
}

// ═══════════════════════════════════════════════════════════════
// MODALS / PROMPTS
// ═══════════════════════════════════════════════════════════════

/**
 * Show prompt to change current location
 */
function promptChangeLocation() {
    const locations = getLocations();
    const current = getCurrentLocation();
    
    // Build options list
    let options = locations.map(loc => 
        `<option value="${loc.id}" ${current?.id === loc.id ? 'selected' : ''}>${loc.name}</option>`
    ).join('');
    
    const html = `
        <div class="tribunal-modal-overlay" id="location-modal">
            <div class="tribunal-modal location-modal">
                <div class="tribunal-modal-header">
                    <span>Set Current Location</span>
                    <button class="tribunal-modal-close">&times;</button>
                </div>
                <div class="tribunal-modal-body">
                    <div class="form-group">
                        <label>Select Location</label>
                        <select id="location-select" class="tribunal-input">
                            <option value="">-- Choose existing --</option>
                            ${options}
                        </select>
                    </div>
                    <div class="form-divider">— or —</div>
                    <div class="form-group">
                        <label>New Location Name</label>
                        <input type="text" id="location-new-name" class="tribunal-input" placeholder="e.g. Whirling-in-Rags">
                    </div>
                    <div class="form-group">
                        <label>District (optional)</label>
                        <input type="text" id="location-new-district" class="tribunal-input" placeholder="e.g. Martinaise">
                    </div>
                </div>
                <div class="tribunal-modal-footer">
                    <button class="tribunal-btn tribunal-btn-secondary" id="location-cancel">Cancel</button>
                    <button class="tribunal-btn tribunal-btn-primary" id="location-save">Set Location</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const modal = document.getElementById('location-modal');
    const closeBtn = modal.querySelector('.tribunal-modal-close');
    const cancelBtn = document.getElementById('location-cancel');
    const saveBtn = document.getElementById('location-save');
    const selectEl = document.getElementById('location-select');
    const newNameEl = document.getElementById('location-new-name');
    const newDistrictEl = document.getElementById('location-new-district');
    
    const close = () => modal.remove();
    
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    
    saveBtn.addEventListener('click', () => {
        const selectedId = selectEl.value;
        const newName = newNameEl.value.trim();
        
        if (selectedId) {
            // Set existing location as current
            const loc = locations.find(l => l.id === selectedId);
            if (loc) {
                setCurrentLocation(loc);
                saveChatState();
                refreshLocations();
            }
        } else if (newName) {
            // Create new location and set as current
            const newLoc = {
                id: `loc_${Date.now()}`,
                name: newName,
                district: newDistrictEl.value.trim() || null,
                description: '',
                visited: true,
                events: [],
                discovered: new Date().toISOString()
            };
            
            addLocation(newLoc);
            setCurrentLocation(newLoc);
            saveChatState();
            refreshLocations();
        }
        
        close();
    });
}

/**
 * Show prompt to add an event
 */
function promptAddEvent() {
    const current = getCurrentLocation();
    
    if (!current) {
        // Need to set location first
        promptChangeLocation();
        return;
    }
    
    const html = `
        <div class="tribunal-modal-overlay" id="event-modal">
            <div class="tribunal-modal event-modal">
                <div class="tribunal-modal-header">
                    <span>Add Event at ${escapeHtml(current.name)}</span>
                    <button class="tribunal-modal-close">&times;</button>
                </div>
                <div class="tribunal-modal-body">
                    <div class="form-group">
                        <label>What happened?</label>
                        <input type="text" id="event-text" class="tribunal-input" placeholder="e.g. Found a suspicious letter">
                    </div>
                </div>
                <div class="tribunal-modal-footer">
                    <button class="tribunal-btn tribunal-btn-secondary" id="event-cancel">Cancel</button>
                    <button class="tribunal-btn tribunal-btn-primary" id="event-save">Add Event</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const modal = document.getElementById('event-modal');
    const closeBtn = modal.querySelector('.tribunal-modal-close');
    const cancelBtn = document.getElementById('event-cancel');
    const saveBtn = document.getElementById('event-save');
    const textEl = document.getElementById('event-text');
    
    const close = () => modal.remove();
    
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    
    // Focus input
    setTimeout(() => textEl.focus(), 50);
    
    // Enter key to save
    textEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
    });
    
    saveBtn.addEventListener('click', () => {
        const text = textEl.value.trim();
        if (!text) return;
        
        addLocationEvent(current.id, {
            text: text,
            timestamp: new Date().toISOString()
        });
        
        saveChatState();
        refreshLocations();
        close();
    });
}

/**
 * Show prompt to add a new location
 */
function promptAddLocation() {
    const html = `
        <div class="tribunal-modal-overlay" id="new-location-modal">
            <div class="tribunal-modal new-location-modal">
                <div class="tribunal-modal-header">
                    <span>Discover New Location</span>
                    <button class="tribunal-modal-close">&times;</button>
                </div>
                <div class="tribunal-modal-body">
                    <div class="form-group">
                        <label>Location Name *</label>
                        <input type="text" id="new-loc-name" class="tribunal-input" placeholder="e.g. Whirling-in-Rags">
                    </div>
                    <div class="form-group">
                        <label>District</label>
                        <input type="text" id="new-loc-district" class="tribunal-input" placeholder="e.g. Martinaise">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="new-loc-desc" class="tribunal-input" rows="2" placeholder="Brief description..."></textarea>
                    </div>
                    <div class="form-group form-checkbox">
                        <input type="checkbox" id="new-loc-visited" checked>
                        <label for="new-loc-visited">Mark as visited</label>
                    </div>
                    <div class="form-group form-checkbox">
                        <input type="checkbox" id="new-loc-set-current">
                        <label for="new-loc-set-current">Set as current location</label>
                    </div>
                </div>
                <div class="tribunal-modal-footer">
                    <button class="tribunal-btn tribunal-btn-secondary" id="new-loc-cancel">Cancel</button>
                    <button class="tribunal-btn tribunal-btn-primary" id="new-loc-save">Add Location</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const modal = document.getElementById('new-location-modal');
    const closeBtn = modal.querySelector('.tribunal-modal-close');
    const cancelBtn = document.getElementById('new-loc-cancel');
    const saveBtn = document.getElementById('new-loc-save');
    
    const close = () => modal.remove();
    
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    
    // Focus input
    setTimeout(() => document.getElementById('new-loc-name').focus(), 50);
    
    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('new-loc-name').value.trim();
        if (!name) return;
        
        const newLoc = {
            id: `loc_${Date.now()}`,
            name: name,
            district: document.getElementById('new-loc-district').value.trim() || null,
            description: document.getElementById('new-loc-desc').value.trim() || null,
            visited: document.getElementById('new-loc-visited').checked,
            events: [],
            discovered: new Date().toISOString()
        };
        
        addLocation(newLoc);
        
        if (document.getElementById('new-loc-set-current').checked) {
            setCurrentLocation(newLoc);
        }
        
        saveChatState();
        refreshLocations();
        close();
    });
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle clicking on a location card (set as current)
 */
function handleLocationClick(e) {
    const card = e.target.closest('.location-card');
    if (!card) return;
    
    const locId = card.dataset.locationId;
    const locations = getLocations();
    const loc = locations.find(l => l.id === locId);
    
    if (loc) {
        setCurrentLocation(loc);
        
        // Also mark as visited if not already
        if (!loc.visited) {
            updateLocation(locId, { visited: true });
        }
        
        saveChatState();
        refreshLocations();
    }
}

/**
 * Handle deleting an event
 */
function handleEventDelete(e) {
    const deleteBtn = e.target.closest('.event-delete');
    if (!deleteBtn) return;
    
    e.stopPropagation();
    
    const index = parseInt(deleteBtn.dataset.index, 10);
    const current = getCurrentLocation();
    
    if (current && !isNaN(index)) {
        removeLocationEvent(current.id, index);
        saveChatState();
        refreshLocations();
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initLocationHandlers() {
    // Edit location button
    const editBtn = document.getElementById('location-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', promptChangeLocation);
    }
    
    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', promptAddEvent);
    }
    
    // Add location button
    const addLocBtn = document.getElementById('locations-add-btn');
    if (addLocBtn) {
        addLocBtn.addEventListener('click', promptAddLocation);
    }
    
    // Location card clicks (delegated)
    const locList = document.getElementById('locations-list');
    if (locList) {
        locList.addEventListener('click', handleLocationClick);
    }
    
    // Event delete clicks (delegated)
    const eventsList = document.getElementById('events-list');
    if (eventsList) {
        eventsList.addEventListener('click', handleEventDelete);
    }
    
    // Initial render
    refreshLocations();
    
    console.log('[Tribunal] Location handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG HELPERS
// ═══════════════════════════════════════════════════════════════

export function debugLocations() {
    return {
        current: getCurrentLocation(),
        locations: getLocations(),
        events: getCurrentLocationEvents()
    };
}
