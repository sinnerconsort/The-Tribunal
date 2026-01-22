/**
 * The Tribunal - API Helpers
 * Connection management, response extraction, and API calls
 * 
 * REBUILD v0.1.2 - Adapted for new state structure
 */

import { getSettings, saveSettings } from '../core/persistence.js';

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN CONTEXT
// ═══════════════════════════════════════════════════════════════

/**
 * Get SillyTavern context
 */
export function getContext() {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
    }
    return null;
}

/**
 * Get available connection profiles for UI dropdown
 */
export function getAvailableProfiles() {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager?.profiles) {
        return [];
    }
    return ctx.extensionSettings.connectionManager.profiles.map(p => ({
        id: p.id,
        name: p.name
    }));
}

/**
 * Get profile ID by name from connection manager
 */
function getProfileIdByName(profileName) {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager) {
        console.log('[Tribunal] No connection manager found');
        return null;
    }
    
    const connectionManager = ctx.extensionSettings.connectionManager;
    
    // "current" or empty = currently active profile
    if (profileName === 'current' || !profileName) {
        console.log('[Tribunal] Using current profile:', connectionManager.selectedProfile);
        return connectionManager.selectedProfile;
    }
    
    // Find by name
    const profile = connectionManager.profiles?.find(p => p.name === profileName);
    if (profile) {
        console.log('[Tribunal] Found profile by name:', profile.name, profile.id);
        return profile.id;
    }
    
    // Fallback to current
    console.log('[Tribunal] Profile not found, using current:', connectionManager.selectedProfile);
    return connectionManager.selectedProfile;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Strip thinking model tags from response
 * Handles <think>, <thinking>, and similar patterns
 */
function stripThinkingTags(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Remove <think>...</think> and <thinking>...</thinking> blocks
    let cleaned = text.replace(/<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi, '');
    
    // Handle unclosed thinking tags at the start
    cleaned = cleaned.replace(/^[\s\S]*?<\/think(?:ing)?>/gi, '');
    
    // Remove any remaining opening tags without closing
    cleaned = cleaned.replace(/<think(?:ing)?>/gi, '');
    
    return cleaned.trim();
}

/**
 * Extract text content from various response formats
 * Handles thinking model output by stripping <think> tags
 */
export function extractResponseContent(response) {
    if (!response) return null;
    
    // If it's already a string, strip thinking tags and return
    if (typeof response === 'string') {
        return stripThinkingTags(response);
    }
    
    // Try various known response formats
    if (response.content && typeof response.content === 'string') {
        return stripThinkingTags(response.content);
    }
    
    if (response.text && typeof response.text === 'string') {
        return stripThinkingTags(response.text);
    }
    
    if (response.message && typeof response.message === 'string') {
        return stripThinkingTags(response.message);
    }
    
    if (response.message?.content) {
        return stripThinkingTags(response.message.content);
    }
    
    // OpenAI-style
    if (response.choices?.[0]?.message?.content) {
        return stripThinkingTags(response.choices[0].message.content);
    }
    
    if (response.choices?.[0]?.text) {
        return stripThinkingTags(response.choices[0].text);
    }
    
    if (response.data?.content) {
        return stripThinkingTags(response.data.content);
    }
    
    if (response.response && typeof response.response === 'string') {
        return stripThinkingTags(response.response);
    }
    
    console.warn('[Tribunal] Unknown response format:', JSON.stringify(response).substring(0, 500));
    return null;
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

/**
 * Main API call function - tries multiple methods
 */
export async function callAPI(systemPrompt, userPrompt) {
    const ctx = getContext();
    const settings = getSettings();
    const apiSettings = settings.api || {};
    
    const connectionProfile = apiSettings.connectionProfile || 'current';
    const useSTConnection = connectionProfile && connectionProfile !== 'none';
    
    console.log('[Tribunal] API call config:', {
        connectionProfile,
        useSTConnection,
        hasConnectionManager: !!ctx?.ConnectionManagerRequestService
    });
    
    // Method 1: Use ST Connection Manager if configured
    if (useSTConnection && ctx?.ConnectionManagerRequestService) {
        try {
            return await callAPIViaConnectionManager(ctx, systemPrompt, userPrompt);
        } catch (err) {
            console.error('[Tribunal] ConnectionManager failed:', err);
            // Fall through to direct fetch
        }
    }
    
    // Method 2: Direct fetch with extension's own API settings
    return await callAPIDirectFetch(systemPrompt, userPrompt);
}

/**
 * Call API via SillyTavern's ConnectionManagerRequestService
 */
async function callAPIViaConnectionManager(ctx, systemPrompt, userPrompt) {
    const settings = getSettings();
    const apiSettings = settings.api || {};
    
    const profileName = apiSettings.connectionProfile || 'current';
    const profileId = getProfileIdByName(profileName);
    
    if (!profileId) {
        throw new Error('No connection profile found');
    }
    
    console.log('[Tribunal] Calling via ConnectionManager, profile:', profileName, 'id:', profileId);
    
    const response = await ctx.ConnectionManagerRequestService.sendRequest(
        profileId,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        apiSettings.maxTokens || 500,
        {
            extractData: true,
            includePreset: false,
            includeInstruct: false
        },
        {
            temperature: apiSettings.temperature || 0.9
        }
    );
    
    console.log('[Tribunal] Raw response type:', typeof response);
    console.log('[Tribunal] Raw response keys:', response ? Object.keys(response) : 'null');
    
    const content = extractResponseContent(response);
    
    if (!content) {
        console.error('[Tribunal] Could not extract content from response:', response);
        throw new Error('Empty response from ConnectionManagerRequestService');
    }
    
    console.log('[Tribunal] Extracted content length:', content.length);
    return content;
}

/**
 * Direct fetch to external API
 */
async function callAPIDirectFetch(systemPrompt, userPrompt) {
    const settings = getSettings();
    const apiSettings = settings.api || {};
    
    let { apiEndpoint, apiKey, model, maxTokens, temperature } = apiSettings;

    if (!apiEndpoint || !apiKey) {
        throw new Error('API not configured. Set API endpoint and key in settings, or select a ST connection profile.');
    }

    // Strip trailing slashes
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');
    
    // Ensure we have the full path
    const fullUrl = apiEndpoint.includes('/chat/completions') 
        ? apiEndpoint 
        : apiEndpoint + '/chat/completions';

    console.log('[Tribunal] Direct fetch to:', fullUrl, 'Model:', model);

    let response;
    try {
        response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: maxTokens || 500,
                temperature: temperature || 0.9
            })
        });
    } catch (fetchError) {
        console.error('[Tribunal] Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. This may be a CORS issue - try using a ST connection profile instead.`);
    }

    if (!response.ok) {
        let errorDetail = '';
        try {
            const errorBody = await response.text();
            errorDetail = errorBody.substring(0, 200);
        } catch (e) {}
        throw new Error(`API ${response.status}: ${errorDetail || response.statusText}`);
    }

    const data = await response.json();
    const content = extractResponseContent(data);
    
    if (!content) {
        throw new Error('Empty response from API');
    }
    
    return content;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS HELPERS (for Settings UI)
// ═══════════════════════════════════════════════════════════════

/**
 * Get current API settings
 */
export function getAPISettings() {
    const settings = getSettings();
    return settings.api || {};
}

/**
 * Update API settings
 */
export function updateAPISettings(updates) {
    const settings = getSettings();
    if (!settings.api) settings.api = {};
    Object.assign(settings.api, updates);
    saveSettings();
}
