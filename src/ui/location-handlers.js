/**
 * The Tribunal - Location Handlers
 * Field Notebook style with INLINE forms (no modals!)
 * 
 * @version 2.1.0 - Clean Field Notebook
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
// UI STATE - tracks which forms are open
// ═══════════════════════════════════════════════════════════════

let uiState = {
    editingLocation: false,
    addingNote: false,
    addingPlace: false
};

function resetUIState() {
    uiState = { editingLocation: false, addingNote: false, addingPlace: false };
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
// MAIN RENDER - Field Notebook
// ═══════════════════════════════════════════════════════════════

export function refreshLocations() {
    const container = document.getElementById('field-notebook-container');
    if (!container) {
        console.warn('[Tribunal] field-notebook-container not found');
        return;
    }
    
    const current = getCurrentLocation();
    const events = getCurrentLocationEvents();
    const locations = getLocations();
    
    let html = `
        <div class="notebook-inner">
            <div class="notebook-spiral"></div>
            <div class="notebook-content">
    `;
    
    // ─────────────────────────────────────────────────────────
    // CURRENT LOCATION
    // ─────────────────────────────────────────────────────────
    
    if (!uiState.editingLocation) {
        html += `
            <div class="notebook-section">
                <div class="notebook-label">currently at:</div>
                <div class="notebook-location" id="notebook-current-loc">
                    ${escapeHtml(current?.name || 'Unknown Location')}
                    ${current?.district ? `<span class="notebook-district">(${escapeHtml(current.district)})</span>` : ''}
                    <button class="notebook-edit-btn" id="notebook-edit-location" title="Change location">✎</button>
                </div>
            </div>
        `;
    } else {
        // Inline edit form
        const options = locations.map(loc => 
            `<option value="${loc.id}" ${current?.id === loc.id ? 'selected' : ''}>${escapeHtml(loc.name)}</option>`
        ).join('');
        
        html += `
            <div class="notebook-section">
                <div class="notebook-label">change location:</div>
                <div class="notebook-form">
                    <select class="notebook-input" id="notebook-loc-select">
                        <option value="">-- pick a place --</option>
                        ${options}
                    </select>
                    <div class="notebook-form-divider">or write new:</div>
                    <input type="text" class="notebook-input" id="notebook-loc-name" placeholder="place name...">
                    <input type="text" class="notebook-input notebook-input-small" id="notebook-loc-district" placeholder="district (optional)">
                    <div class="notebook-form-actions">
                        <button class="notebook-btn notebook-btn-cancel" id="notebook-loc-cancel">cancel</button>
                        <button class="notebook-btn notebook-btn-save" id="notebook-loc-save">set location</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ─────────────────────────────────────────────────────────
    // NOTES FROM HERE (events)
    // ─────────────────────────────────────────────────────────
    
    html += `
        <div class="notebook-section">
            <div class="notebook-label">notes from here:</div>
    `;
    
    if (events.length === 0) {
        html += `<div class="notebook-empty">nothing yet...</div>`;
    } else {
        const recentEvents = events.slice(-5).reverse();
        recentEvents.forEach((event, idx) => {
            const realIndex = events.length - 1 - idx;
            html += `
                <div class="notebook-note" data-index="${realIndex}">
                    <span class="notebook-note-text">${escapeHtml(event.text)}</span>
                    <button class="notebook-note-delete" data-index="${realIndex}" title="remove">×</button>
                </div>
            `;
        });
    }
    
    if (!uiState.addingNote) {
        html += `<button class="notebook-add-link" id="notebook-add-note" ${!current ? 'disabled' : ''}>+ add note...</button>`;
    } else {
        html += `
            <div class="notebook-form notebook-form-inline">
                <input type="text" class="notebook-input" id="notebook-note-input" placeholder="what happened here...">
                <div class="notebook-form-actions">
                    <button class="notebook-btn notebook-btn-cancel" id="notebook-note-cancel">×</button>
                    <button class="notebook-btn notebook-btn-save" id="notebook-note-save">add</button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    // ─────────────────────────────────────────────────────────
    // PLACES I'VE BEEN (locations list)
    // ─────────────────────────────────────────────────────────
    
    html += `
        <div class="notebook-section notebook-places">
            <div class="notebook-label">places I've been:</div>
    `;
    
    if (locations.length === 0) {
        html += `<div class="notebook-empty">nowhere yet...</div>`;
    } else {
        locations.forEach(loc => {
            const isCurrent = current?.id === loc.id;
            const eventCount = loc.events?.length || 0;
            
            html += `
                <div class="notebook-place ${isCurrent ? 'current' : ''} ${loc.visited ? 'visited' : 'unvisited'}" data-id="${loc.id}">
                    <span class="notebook-place-icon">${isCurrent ? '📍' : (loc.visited ? '✓' : '○')}</span>
                    <span class="notebook-place-name">${escapeHtml(loc.name)}</span>
                    ${isCurrent ? '<span class="notebook-place-here">← here</span>' : ''}
                    ${eventCount > 0 ? `<span class="notebook-place-count">(${eventCount})</span>` : ''}
                    <button class="notebook-place-delete" data-id="${loc.id}" title="remove">×</button>
                </div>
            `;
        });
    }
    
    if (!uiState.addingPlace) {
        html += `<button class="notebook-add-link" id="notebook-add-place">+ new place...</button>`;
    } else {
        html += `
            <div class="notebook-form">
                <input type="text" class="notebook-input" id="notebook-place-name" placeholder="place name...">
                <input type="text" class="notebook-input notebook-input-small" id="notebook-place-district" placeholder="district (optional)">
                <div class="notebook-form-row">
                    <label class="notebook-checkbox">
                        <input type="checkbox" id="notebook-place-visited" checked>
                        <span>visited</span>
                    </label>
                    <label class="notebook-checkbox">
                        <input type="checkbox" id="notebook-place-set-current">
                        <span>go there</span>
                    </label>
                </div>
                <div class="notebook-form-actions">
                    <button class="notebook-btn notebook-btn-cancel" id="notebook-place-cancel">cancel</button>
                    <button class="notebook-btn notebook-btn-save" id="notebook-place-save">add place</button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    // Close notebook
    html += `
            </div>
            <div class="notebook-stain"></div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // ─────────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────────
    
    // Edit location button
    container.querySelector('#notebook-edit-location')?.addEventListener('click', () => {
        uiState.editingLocation = true;
        refreshLocations();
    });
    
    // Location form
    if (uiState.editingLocation) {
        container.querySelector('#notebook-loc-cancel')?.addEventListener('click', () => {
            uiState.editingLocation = false;
            refreshLocations();
        });
        
        container.querySelector('#notebook-loc-save')?.addEventListener('click', () => {
            const selectEl = container.querySelector('#notebook-loc-select');
            const nameEl = container.querySelector('#notebook-loc-name');
            const districtEl = container.querySelector('#notebook-loc-district');
            
            const selectedId = selectEl?.value;
            const newName = nameEl?.value.trim();
            
            if (selectedId) {
                // Set existing location as current
                const loc = locations.find(l => l.id === selectedId);
                if (loc) {
                    setCurrentLocation(loc);
                    if (!loc.visited) updateLocation(loc.id, { visited: true });
                }
            } else if (newName) {
                // Create new location and set as current
                const newLoc = {
                    id: `loc_${Date.now()}`,
                    name: newName,
                    district: districtEl?.value.trim() || null,
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
        
        setTimeout(() => container.querySelector('#notebook-loc-select')?.focus(), 50);
    }
    
    // Add note
    container.querySelector('#notebook-add-note')?.addEventListener('click', () => {
        if (!current) return;
        uiState.addingNote = true;
        refreshLocations();
    });
    
    if (uiState.addingNote) {
        const noteInput = container.querySelector('#notebook-note-input');
        
        container.querySelector('#notebook-note-cancel')?.addEventListener('click', () => {
            uiState.addingNote = false;
            refreshLocations();
        });
        
        const saveNote = () => {
            const text = noteInput?.value.trim();
            if (!text || !current) return;
            
            addLocationEvent(current.id, {
                text: text,
                timestamp: new Date().toISOString()
            });
            
            uiState.addingNote = false;
            saveChatState();
            refreshLocations();
        };
        
        container.querySelector('#notebook-note-save')?.addEventListener('click', saveNote);
        noteInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveNote(); });
        
        setTimeout(() => noteInput?.focus(), 50);
    }
    
    // Delete note
    container.querySelectorAll('.notebook-note-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index, 10);
            if (current && !isNaN(index)) {
                removeLocationEvent(current.id, index);
                saveChatState();
                refreshLocations();
            }
        });
    });
    
    // Click place to go there
    container.querySelectorAll('.notebook-place').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.notebook-place-delete')) return;
            
            const locId = el.dataset.id;
            const loc = locations.find(l => l.id === locId);
            if (loc) {
                setCurrentLocation(loc);
                if (!loc.visited) updateLocation(locId, { visited: true });
                saveChatState();
                refreshLocations();
            }
        });
    });
    
    // Delete place
    container.querySelectorAll('.notebook-place-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const locId = btn.dataset.id;
            if (confirm('Remove this place?')) {
                removeLocation(locId);
                if (current?.id === locId) setCurrentLocation(null);
                saveChatState();
                refreshLocations();
            }
        });
    });
    
    // Add place
    container.querySelector('#notebook-add-place')?.addEventListener('click', () => {
        uiState.addingPlace = true;
        refreshLocations();
    });
    
    if (uiState.addingPlace) {
        const placeNameInput = container.querySelector('#notebook-place-name');
        
        container.querySelector('#notebook-place-cancel')?.addEventListener('click', () => {
            uiState.addingPlace = false;
            refreshLocations();
        });
        
        container.querySelector('#notebook-place-save')?.addEventListener('click', () => {
            const name = placeNameInput?.value.trim();
            if (!name) return;
            
            const newLoc = {
                id: `loc_${Date.now()}`,
                name: name,
                district: container.querySelector('#notebook-place-district')?.value.trim() || null,
                visited: container.querySelector('#notebook-place-visited')?.checked ?? true,
                events: [],
                discovered: new Date().toISOString()
            };
            
            addLocation(newLoc);
            
            if (container.querySelector('#notebook-place-set-current')?.checked) {
                setCurrentLocation(newLoc);
            }
            
            uiState.addingPlace = false;
            saveChatState();
            refreshLocations();
        });
        
        setTimeout(() => placeNameInput?.focus(), 50);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initLocationHandlers() {
    console.log('[Tribunal] Initializing location handlers (Field Notebook)...');
    refreshLocations();
    console.log('[Tribunal] Location handlers ✅');
}

// Call from index.js on CHAT_CHANGED if needed
export function onChatChanged() {
    resetUIState();
    refreshLocations();
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
