/**
 * The Tribunal - Profile Rendering
 * Saved profiles list display
 */

import { savedProfiles } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// PROFILES LIST
// ═══════════════════════════════════════════════════════════════

export function renderProfilesList(container, onLoad, onDelete, onUpdate) {
    if (!container) return;

    const profiles = Object.values(savedProfiles);

    if (profiles.length === 0) {
        container.innerHTML = '<div class="ie-profiles-empty"><em>No saved profiles</em></div>';
        return;
    }

    container.innerHTML = profiles.map(profile => `
        <div class="ie-profile-card" data-profile="${profile.id}">
            <div class="ie-profile-info">
                <span class="ie-profile-name">${profile.name}</span>
                <span class="ie-profile-date">${new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="ie-profile-actions">
                <button class="ie-btn ie-btn-sm ie-btn-load-profile" data-profile="${profile.id}" title="Load">
                    <i class="fa-solid fa-upload"></i>
                </button>
                <button class="ie-btn ie-btn-sm ie-btn-update-profile" data-profile="${profile.id}" title="Update with current settings">
                    <i class="fa-solid fa-save"></i>
                </button>
                <button class="ie-btn ie-btn-sm ie-btn-delete-profile" data-profile="${profile.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.ie-btn-load-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onLoad) onLoad(btn.dataset.profile);
        });
    });

    container.querySelectorAll('.ie-btn-update-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onUpdate) onUpdate(btn.dataset.profile);
        });
    });

    container.querySelectorAll('.ie-btn-delete-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onDelete) onDelete(btn.dataset.profile);
        });
    });
}
