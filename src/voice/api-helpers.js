/**
 * API Helpers for The Tribunal
 * Connection management, response extraction, and API calls
 * Extracted from generation.js for maintainability
 */

import { extensionSettings } from '../core/state.js';

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
        console.log('[The Tribunal] No connection manager found');
        return null;
    }
    
    const connectionManager = ctx.extensionSettings.connectionManager;
    
    // "current" or empty = currently active profile
    if (profileName === 'current' || !profileName) {
        console.log('[The Tribunal] Using current profile:', connectionManager.selectedProfile);
        return connectionManager.selectedProfile;
    }
    
    // Find by name
    const profile = connectionManager.profiles?.find(p => p.name === profileName);
    if (profile) {
        console.log('[The Tribunal] Found profile by name:', profile.name, profile.id);
        return profile.id;
    }
    
    // Fallback to current
    console.log('[The Tribunal] Profile not found, using current:', connectionManager.selectedProfile);
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
    
    console.warn('[The Tribunal] Unknown response format:', JSON.stringify(response).substring(0, 500));
    return null;
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

/**
 * Main API call function - tries multiple methods
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {Object} options - Optional overrides { maxTokens, temperature }
 */
export async function callAPI(systemPrompt, userPrompt, options = {}) {
    const ctx = getContext();
    const useSTConnection = extensionSettings.connectionProfile && extensionSettings.connectionProfile !== 'none';
    
    console.log('[The Tribunal] API call config:', {
        connectionProfile: extensionSettings.connectionProfile,
        useSTConnection,
        hasConnectionManager: !!ctx?.ConnectionManagerRequestService,
        optionOverrides: options
    });
    
    // Method 1: Use ST Connection Manager if configured
    if (useSTConnection && ctx?.ConnectionManagerRequestService) {
        try {
            return await callAPIViaConnectionManager(ctx, systemPrompt, userPrompt, options);
        } catch (err) {
            console.error('[The Tribunal] ConnectionManager failed:', err);
            // Fall through to direct fetch
        }
    }
    
    // Method 2: Direct fetch with extension's own API settings
    return await callAPIDirectFetch(systemPrompt, userPrompt, options);
}

/**
 * Specialized API call for thought generation
 * Uses higher maxTokens to ensure JSON completes
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 */
export async function callAPIForThoughts(systemPrompt, userPrompt) {
    // Force higher maxTokens for thought generation to prevent truncation
    // Even concise thoughts need ~400-500 tokens for full JSON structure
    return await callAPI(systemPrompt, userPrompt, {
        maxTokens: 800,
        temperature: 0.85  // Slightly lower temp for more consistent JSON output
    });
}

/**
 * Call API via SillyTavern's ConnectionManagerRequestService
 */
async function callAPIViaConnectionManager(ctx, systemPrompt, userPrompt, options = {}) {
    const profileName = extensionSettings.connectionProfile || 'current';
    const profileId = getProfileIdByName(profileName);
    
    if (!profileId) {
        throw new Error('No connection profile found');
    }
    
    // Use option overrides if provided, otherwise fall back to settings
    const maxTokens = options.maxTokens || extensionSettings.maxTokens || 600;
    const temperature = options.temperature || extensionSettings.temperature || 0.9;
    
    console.log('[The Tribunal] Calling via ConnectionManager, profile:', profileName, 'id:', profileId, 'maxTokens:', maxTokens);
    
    const response = await ctx.ConnectionManagerRequestService.sendRequest(
        profileId,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        maxTokens,
        {
            extractData: true,
            includePreset: false,
            includeInstruct: false
        },
        {
            temperature: temperature
        }
    );
    
    console.log('[The Tribunal] Raw response type:', typeof response);
    console.log('[The Tribunal] Raw response keys:', response ? Object.keys(response) : 'null');
    
    const content = extractResponseContent(response);
    
    if (!content) {
        console.error('[The Tribunal] Could not extract content from response:', response);
        throw new Error('Empty response from ConnectionManagerRequestService');
    }
    
    console.log('[The Tribunal] Extracted content length:', content.length);
    return content;
}

/**
 * Direct fetch to external API
 */
async function callAPIDirectFetch(systemPrompt, userPrompt, options = {}) {
    let { apiEndpoint, apiKey, model, maxTokens, temperature } = extensionSettings;

    // Use option overrides if provided
    maxTokens = options.maxTokens || maxTokens || 600;
    temperature = options.temperature || temperature || 0.9;

    if (!apiEndpoint || !apiKey) {
        throw new Error('API not configured. Set API endpoint and key in settings, or select a ST connection profile.');
    }

    // Strip trailing slashes
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');
    
    // Ensure we have the full path
    const fullUrl = apiEndpoint.includes('/chat/completions') 
        ? apiEndpoint 
        : apiEndpoint + '/chat/completions';

    console.log('[The Tribunal] Direct fetch to:', fullUrl, 'Model:', model, 'maxTokens:', maxTokens);

    let response;
    try {
        response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'glm-4-plus',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: maxTokens,
                temperature: temperature
            })
        });
    } catch (fetchError) {
        console.error('[The Tribunal] Fetch error:', fetchError);
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
