/**
 * The Tribunal - Location Handlers
 * Uses INLINE forms (no modals!) - mobile friendly
 * 
 * @version 2.0.0
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

function getLocations() {
    const ledger = getLedger();
    return ledger?.locations || [];
}

function getCurrentLocationEvents() {
    const current = getCurrentLocation();
    if (!current) return [];
    
    const locations = getLocations();
    const loc = locations.find(l => l.id === current.id);
    return loc?.events || [];
}

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

let uiState = {
    editingLocation: false,
    addingEvent: false,
    addingLocation: false,
    expandedLocationId: null
};

// ═══════════════════════════════════════════════════════════════
// RENDER - CURRENT LOCATION
// ═══════════════════════════════════════════════════════════════

function renderCurrentLocation() {
    const container = document.getElementById('current-location-container');
    if (!container) return;
    
    const current = getCurrentLocation();
    const locations = getLocations();
    
    if (!uiState.editingLocation) {
        // Display mode
        container.innerHTML = `
            <div class="loc-current-display">
                <i class="fa-solid fa-location-dot loc-current-icon"></i>
                <span class="loc-current-name" id="current-location-name">${escapeHtml(current?.name || 'Unknown Location')}</span>
                <button class="loc-edit-btn" id="location-edit-btn" title="Change location">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </div>
        `;
        
        container.querySelector('#location-edit-btn')?.addEventListener('click', () => {
            uiState.editingLocation = true;
            renderCurrentLocation();
        });
    } else {
        // Edit mode - inline form
        const options = locations.map(loc => 
            `<option value="${loc.id}" ${current?.id === loc.id ? 'selected' : ''}>${escapeHtml(loc.name)}</option>`
        ).join('');
        
        container.innerHTML = `
            <div class="loc-edit-form">
                <div class="loc-form-group">
                    <label>Select Existing</label>
                    <select class="loc-input" id="loc-select">
                        <option value="">-- Choose --</option>
                        ${options}
                    </select>
                </div>
                <div class="loc-form-divider">— or create new —</div>
                <div class="loc-form-group">
                    <label>Location Name</label>
                    <input type="text" class="loc-input" id="loc-new-name" placeholder="e.g. Whirling-in-Rags">
                </div>
                <div class="loc-form-group">
                    <label>District (optional)</label>
                    <input type="text" class="loc-input" id="loc-new-district" placeholder="e.g. Martinaise">
                </div>
                <div class="loc-form-actions">
                    <button class="loc-btn loc-btn-cancel" id="loc-edit-cancel">Cancel</button>
                    <button class="loc-btn loc-btn-save" id="loc-edit-save">Set Location</button>
                </div>
            </div>
        `;
        
        const selectEl = container.querySelector('#loc-select');
        const newNameEl = container.querySelector('#loc-new-name');
        const newDistrictEl = container.querySelector('#loc-new-district');
        
        container.querySelector('#loc-edit-cancel')?.addEventListener('click', () => {
            uiState.editingLocation = false;
            renderCurrentLocation();
        });
        
        container.querySelector('#loc-edit-save')?.addEventListener('click', () => {
            const selectedId = selectEl.value;
            const newName = newNameEl.value.trim();
            
            if (selectedId) {
                const loc = locations.find(l => l.id === selectedId);
                if (loc) {
                    setCurrentLocation(loc);
                    if (!loc.visited) updateLocation(loc.id, { visited: true });
                }
            } else if (newName) {
                const newLoc = {
                    id: `loc_${Date.now()}`,
                    name: newName,
                    district: newDistrictEl.value.trim() || null,
                    visited: true,
                    events: [],
                    discovered: new Date().toISOString()
                };
                addLocation(newLoc);
                setCurrentLocation(newLoc);
            }
            
            uiState.editingLocation = false;
            saveChatState();
            refreshLocations();
        });
        
        setTimeout(() => selectEl?.focus(), 50);
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDER - EVENTS
// ═══════════════════════════════════════════════════════════════

function renderEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;
    
    const current = getCurrentLocation();
    const events = getCurrentLocationEvents();
    
    let html = '';
    
    // Events list
    if (events.length === 0) {
        html += '<p class="loc-empty" id="events-empty">No events recorded</p>';
    } else {
        html += '<ul class="loc-events-list" id="events-list">';
        const recentEvents = events.slice(-5).reverse();
        recentEvents.forEach((event, idx) => {
            const realIndex = events.length - 1 - idx;
            html += `
                <li class="loc-event-item" data-index="${realIndex}">
                    <span class="loc-event-text">${escapeHtml(event.text)}</span>
                    <button class="loc-event-delete" data-index="${realIndex}" title="Remove">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </li>
            `;
        });
        html += '</ul>';
    }
    
    // Add event form/button
    if (!uiState.addingEvent) {
        html += `
            <button class="loc-add-btn" id="add-event-btn" ${!current ? 'disabled' : ''}>
                <i class="fa-solid fa-plus"></i> Add Event
            </button>
        `;
    } else {
        html += `
            <div class="loc-inline-form">
                <input type="text" class="loc-input" id="event-input" placeholder="What happened here...">
                <div class="loc-form-actions">
                    <button class="loc-btn loc-btn-cancel" id="event-cancel">Cancel</button>
                    <button class="loc-btn loc-btn-save" id="event-save">Add</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Event listeners
    if (!uiState.addingEvent) {
        container.querySelector('#add-event-btn')?.addEventListener('click', () => {
            if (!current) return;
            uiState.addingEvent = true;
            renderEvents();
        });
    } else {
        const input = container.querySelector('#event-input');
        
        container.querySelector('#event-cancel')?.addEventListener('click', () => {
            uiState.addingEvent = false;
            renderEvents();
        });
        
        const saveEvent = () => {
            const text = input.value.trim();
            if (!text || !current) return;
            
            addLocationEvent(current.id, {
                text: text,
                timestamp: new Date().toISOString()
            });
            
            uiState.addingEvent = false;
            saveChatState();
            renderEvents();
        };
        
        container.querySelector('#event-save')?.addEventListener('click', saveEvent);
        input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEvent(); });
        
        setTimeout(() => input?.focus(), 50);
    }
    
    // Delete listeners
    container.querySelectorAll('.loc-event-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index, 10);
            if (current && !isNaN(index)) {
                removeLocationEvent(current.id, index);
                saveChatState();
                renderEvents();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// RENDER - DISCOVERED LOCATIONS
// ═══════════════════════════════════════════════════════════════

function renderLocations() {
    const container = document.getElementById('locations-container');
    if (!container) return;
    
    const locations = getLocations();
    const current = getCurrentLocation();
    
    let html = `
        <div class="loc-section-header">
            <span>// Discovered Locations</span>
            <span class="loc-count">${locations.length > 0 ? `(${locations.length})` : ''}</span>
        </div>
    `;
    
    // Locations list
    if (locations.length === 0) {
        html += '<p class="loc-empty" id="locations-empty">No locations discovered</p>';
    } else {
        html += '<div class="loc-list" id="locations-list">';
        locations.forEach(loc => {
            const isCurrent = current?.id === loc.id;
            const isExpanded = uiState.expandedLocationId === loc.id;
            const eventCount = loc.events?.length || 0;
            
            html += `
                <div class="loc-card ${isCurrent ? 'current' : ''} ${isExpanded ? 'expanded' : ''}" data-id="${loc.id}">
                    <div class="loc-card-row">
                        <i class="fa-solid fa-location-dot loc-card-icon"></i>
                        <span class="loc-card-name">${escapeHtml(loc.name)}</span>
                        ${loc.district ? `<span class="loc-card-district">${escapeHtml(loc.district)}</span>` : ''}
                        <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} loc-card-expand"></i>
                    </div>
                    ${isExpanded ? `
                        <div class="loc-card-details">
                            ${loc.description ? `<p class="loc-card-desc">${escapeHtml(loc.description)}</p>` : ''}
                            <div class="loc-card-meta">
                                <span class="loc-visited ${loc.visited ? 'yes' : ''}">
                                    <i class="fa-solid ${loc.visited ? 'fa-check' : 'fa-circle'}"></i>
                                    ${loc.visited ? 'Visited' : 'Unvisited'}
                                </span>
                                ${eventCount > 0 ? `<span class="loc-event-count"><i class="fa-solid fa-list"></i> ${eventCount}</span>` : ''}
                            </div>
                            <div class="loc-card-actions">
                                <button class="loc-btn loc-btn-go" data-id="${loc.id}" ${isCurrent ? 'disabled' : ''}>
                                    ${isCurrent ? 'Current' : 'Go Here'}
                                </button>
                                <button class="loc-btn loc-btn-delete" data-id="${loc.id}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Add location form/button
    if (!uiState.addingLocation) {
        html += `
            <button class="loc-add-btn" id="locations-add-btn">
                <i class="fa-solid fa-plus"></i> Add Location
            </button>
        `;
    } else {
        html += `
            <div class="loc-add-form">
                <div class="loc-form-group">
                    <label>Location Name *</label>
                    <input type="text" class="loc-input" id="new-loc-name" placeholder="e.g. Whirling-in-Rags">
                </div>
                <div class="loc-form-group">
                    <label>District</label>
                    <input type="text" class="loc-input" id="new-loc-district" placeholder="e.g. Martinaise">
                </div>
                <div class="loc-form-group">
                    <label>Description</label>
                    <textarea class="loc-input" id="new-loc-desc" rows="2" placeholder="Brief description..."></textarea>
                </div>
                <div class="loc-form-row">
                    <label class="loc-checkbox">
                        <input type="checkbox" id="new-loc-visited" checked>
                        <span>Visited</span>
                    </label>
                    <label class="loc-checkbox">
                        <input type="checkbox" id="new-loc-set-current">
                        <span>Set as current</span>
                    </label>
                </div>
                <div class="loc-form-actions">
                    <button class="loc-btn loc-btn-cancel" id="new-loc-cancel">Cancel</button>
                    <button class="loc-btn loc-btn-save" id="new-loc-save">Add Location</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Add button listener
    if (!uiState.addingLocation) {
        container.querySelector('#locations-add-btn')?.addEventListener('click', () => {
            uiState.addingLocation = true;
            renderLocations();
        });
    } else {
        const nameInput = container.querySelector('#new-loc-name');
        
        container.querySelector('#new-loc-cancel')?.addEventListener('click', () => {
            uiState.addingLocation = false;
            renderLocations();
        });
        
        container.querySelector('#new-loc-save')?.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) return;
            
            const newLoc = {
                id: `loc_${Date.now()}`,
                name: name,
                district: container.querySelector('#new-loc-district').value.trim() || null,
                description: container.querySelector('#new-loc-desc').value.trim() || null,
                visited: container.querySelector('#new-loc-visited').checked,
                events: [],
                discovered: new Date().toISOString()
            };
            
            addLocation(newLoc);
            
            if (container.querySelector('#new-loc-set-current').checked) {
                setCurrentLocation(newLoc);
            }
            
            uiState.addingLocation = false;
            saveChatState();
            refreshLocations();
        });
        
        setTimeout(() => nameInput?.focus(), 50);
    }
    
    // Card click handlers
    container.querySelectorAll('.loc-card').forEach(card => {
        const locId = card.dataset.id;
        
        // Row click = expand/collapse
        card.querySelector('.loc-card-row')?.addEventListener('click', () => {
            uiState.expandedLocationId = uiState.expandedLocationId === locId ? null : locId;
            renderLocations();
        });
        
        // Go here button
        card.querySelector('.loc-btn-go')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const loc = locations.find(l => l.id === locId);
            if (loc) {
                setCurrentLocation(loc);
                if (!loc.visited) updateLocation(locId, { visited: true });
                saveChatState();
                refreshLocations();
            }
        });
        
        // Delete button
        card.querySelector('.loc-btn-delete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this location?')) {
                removeLocation(locId);
                if (current?.id === locId) setCurrentLocation(null);
                uiState.expandedLocationId = null;
                saveChatState();
                refreshLocations();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// MAIN REFRESH
// ═══════════════════════════════════════════════════════════════

export function refreshLocations() {
    renderCurrentLocation();
    renderEvents();
    renderLocations();
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
    console.log('[Tribunal] Initializing location handlers...');
    
    // Reset UI state on chat change
    if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            uiState = {
                editingLocation: false,
                addingEvent: false,
                addingLocation: false,
                expandedLocationId: null
            };
            setTimeout(refreshLocations, 100);
        });
    }
    
    refreshLocations();
    console.log('[Tribunal] Location handlers ✅');
}

// ═══════════════════════════════════════════════════════════════
// DEBUG
// ═══════════════════════════════════════════════════════════════

export function debugLocations() {
    return {
        current: getCurrentLocation(),
        locations: getLocations(),
        events: getCurrentLocationEvents(),
        uiState
    };
}
