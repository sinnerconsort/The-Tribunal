/**
 * The Tribunal - API Helpers
 * Connection management, response extraction, and API calls
 * 
 * REBUILD v0.1.5 - Added callAPIWithTokens for equipment generation
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
 * Wait for ConnectionManagerRequestService to be available
 * @param {number} maxWaitMs - Maximum time to wait
 * @param {number} checkIntervalMs - How often to check
 * @returns {Promise<object|null>} The context with ConnectionManager, or null if timeout
 */
async function waitForConnectionManager(maxWaitMs = 2000, checkIntervalMs = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
        const ctx = getContext();
        if (ctx?.ConnectionManagerRequestService) {
            return ctx;
        }
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }
    
    console.warn('[Tribunal] ConnectionManager not available after', maxWaitMs, 'ms');
    return getContext(); // Return whatever we have
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
 * Get profile ID by name OR ID from connection manager
 * FIXED: Dropdown stores ID but old code searched by name - now handles both!
 */
function getProfileIdByName(profileNameOrId) {
    const ctx = getContext();
    if (!ctx?.extensionSettings?.connectionManager) {
        console.log('[Tribunal] No connection manager found');
        return null;
    }
    
    const connectionManager = ctx.extensionSettings.connectionManager;
    const profiles = connectionManager.profiles || [];
    
    // "current" or empty = currently active profile
    if (profileNameOrId === 'current' || !profileNameOrId) {
        console.log('[Tribunal] Using current profile:', connectionManager.selectedProfile);
        return connectionManager.selectedProfile;
    }
    
    // "default" = use ST default (same as current for our purposes)
    if (profileNameOrId === 'default') {
        console.log('[Tribunal] Using default profile:', connectionManager.selectedProfile);
        return connectionManager.selectedProfile;
    }
    
    const searchTerm = profileNameOrId.trim();
    const searchLower = searchTerm.toLowerCase();
    
    // First: Try exact ID match (dropdown stores IDs!)
    const byId = profiles.find(p => p.id === searchTerm);
    if (byId) {
        console.log('[Tribunal] Found profile by ID:', byId.name, '→', byId.id);
        return byId.id;
    }
    
    // Second: Try name match (case-insensitive)
    const byName = profiles.find(p => 
        p.name?.trim().toLowerCase() === searchLower
    );
    if (byName) {
        console.log('[Tribunal] Found profile by name:', byName.name, '→', byName.id);
        return byName.id;
    }
    
    // Third: Try partial name match
    const byPartial = profiles.find(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        searchLower.includes(p.name?.toLowerCase())
    );
    if (byPartial) {
        console.log('[Tribunal] Found profile by partial match:', byPartial.name, '→', byPartial.id);
        return byPartial.id;
    }
    
    // Fallback to current
    console.log('[Tribunal] Profile "' + profileNameOrId + '" not found.');
    console.log('[Tribunal] Available profiles:', profiles.map(p => `${p.name} (${p.id})`).join(', '));
    console.log('[Tribunal] Falling back to current:', connectionManager.selectedProfile);
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
 * 
 * IMPROVED: More aggressive extraction, handles more edge cases
 */
export function extractResponseContent(response) {
    if (!response) {
        console.warn('[Tribunal] extractResponseContent: response is null/undefined');
        return null;
    }
    
    // If it's already a string, strip thinking tags and return
    if (typeof response === 'string') {
        const cleaned = stripThinkingTags(response);
        if (cleaned) return cleaned;
        console.warn('[Tribunal] extractResponseContent: string response was empty after cleaning');
        return null;
    }
    
    // Log what we're working with
    console.log('[Tribunal] extractResponseContent: type=' + typeof response + ', keys=' + Object.keys(response).join(','));
    
    // Try various known response formats in order of likelihood
    const extractors = [
        // Direct content fields
        () => response.content,
        () => response.text,
        () => response.message,
        () => response.response,
        
        // Nested content
        () => response.message?.content,
        () => response.data?.content,
        () => response.data?.text,
        () => response.result?.content,
        () => response.result?.text,
        () => response.output?.content,
        () => response.output?.text,
        
        // OpenAI-style
        () => response.choices?.[0]?.message?.content,
        () => response.choices?.[0]?.text,
        () => response.choices?.[0]?.delta?.content,
        
        // Anthropic-style
        () => response.content?.[0]?.text,
        
        // Generic array handling
        () => Array.isArray(response.content) ? response.content.map(c => c.text || c).join('') : null,
        
        // Last resort: stringify if it's an object with content-like structure
        () => {
            if (typeof response === 'object') {
                // Look for any string property that looks like content
                for (const key of Object.keys(response)) {
                    const val = response[key];
                    if (typeof val === 'string' && val.length > 20) {
                        console.log('[Tribunal] Found content in field:', key);
                        return val;
                    }
                }
            }
            return null;
        }
    ];
    
    for (const extractor of extractors) {
        try {
            const result = extractor();
            if (result && typeof result === 'string') {
                const cleaned = stripThinkingTags(result);
                if (cleaned && cleaned.length > 0) {
                    return cleaned;
                }
            }
        } catch (e) {
            // Ignore extraction errors, try next method
        }
    }

    console.warn('[Tribunal] Could not extract content. Full response:', JSON.stringify(response).substring(0, 1000));
    return null;
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

/**
 * Main API call function - uses settings for maxTokens
 * (Voices use this - 600 tokens default)
 */
export async function callAPI(systemPrompt, userPrompt) {
    const settings = getSettings();
    const maxTokens = settings?.api?.maxTokens || 600;
    return await callAPIWithTokens(systemPrompt, userPrompt, maxTokens);
}

/**
 * API call with CUSTOM token limit
 * Use this for equipment generation (needs 3000+)
 * 
 * @param {string} systemPrompt - System message
 * @param {string} userPrompt - User message
 * @param {number} maxTokens - Maximum tokens for response
 * @returns {Promise<string>} Response text
 */
export async function callAPIWithTokens(systemPrompt, userPrompt, maxTokens = 600) {
    const settings = getSettings();
    
    // Defensive: ensure settings exists
    if (!settings) {
        console.error('[Tribunal] getSettings() returned null!');
        throw new Error('Settings not loaded. Try refreshing the page.');
    }
    
    const apiSettings = settings.api || {};
    
    const connectionProfile = apiSettings.connectionProfile || 'current';
    const useSTConnection = connectionProfile && connectionProfile !== 'none';
    
    // If we want to use ST connection, wait for it to be ready
    let ctx;
    if (useSTConnection) {
        ctx = await waitForConnectionManager(2000, 100);
    } else {
        ctx = getContext();
    }
    
    console.log('[Tribunal] API call config:', {
        connectionProfile,
        useSTConnection,
        maxTokens,  // Log the token limit being used
        hasConnectionManager: !!ctx?.ConnectionManagerRequestService,
        systemPromptLength: systemPrompt?.length || 0,
        userPromptLength: userPrompt?.length || 0
    });
    
    // Method 1: Use ST Connection Manager if configured AND available
    if (useSTConnection && ctx?.ConnectionManagerRequestService) {
        try {
            return await callAPIViaConnectionManagerWithTokens(ctx, systemPrompt, userPrompt, maxTokens);
        } catch (err) {
            console.error('[Tribunal] ConnectionManager failed:', err);
            // Fall through to direct fetch only if we have direct API settings
            const hasDirectSettings = apiSettings.apiEndpoint && apiSettings.apiKey;
            if (!hasDirectSettings) {
                // Re-throw with clearer message
                throw new Error(`Connection Manager error: ${err.message}. Configure a connection profile in settings.`);
            }
            console.log('[Tribunal] Falling back to direct fetch...');
        }
    }
    
    // Method 2: Direct fetch with extension's own API settings
    return await callAPIDirectFetchWithTokens(systemPrompt, userPrompt, maxTokens);
}

/**
 * Call API via SillyTavern's ConnectionManagerRequestService
 * With custom token limit
 */
async function callAPIViaConnectionManagerWithTokens(ctx, systemPrompt, userPrompt, maxTokens) {
    const settings = getSettings();
    const apiSettings = settings.api || {};
    
    const profileName = apiSettings.connectionProfile || 'current';
    const profileId = getProfileIdByName(profileName);
    
    if (!profileId) {
        throw new Error('No connection profile found. Check that Connection Manager extension is enabled.');
    }
    
    console.log('[Tribunal] Calling via ConnectionManager, profile:', profileName, '→ id:', profileId, 'maxTokens:', maxTokens);
    
    let response;
    try {
        response = await ctx.ConnectionManagerRequestService.sendRequest(
            profileId,
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            maxTokens,  // Use the passed maxTokens instead of settings
            {
                extractData: true,
                includePreset: false,
                includeInstruct: false
            },
            {
                temperature: apiSettings.temperature || 0.8
            }
        );
    } catch (sendError) {
        console.error('[Tribunal] sendRequest threw:', sendError);
        throw new Error(`API request failed: ${sendError.message || sendError}`);
    }
    
    // Detailed response logging
    console.log('[Tribunal] Raw response:', {
        type: typeof response,
        isNull: response === null,
        isUndefined: response === undefined,
        keys: response ? Object.keys(response) : 'N/A',
        preview: typeof response === 'string' 
            ? response.substring(0, 100) 
            : JSON.stringify(response)?.substring(0, 200)
    });
    
    const content = extractResponseContent(response);
    
    if (!content) {
        // More detailed error
        const responseInfo = response 
            ? `Got ${typeof response} with keys: ${Object.keys(response).join(', ')}`
            : 'Response was null/undefined';
        console.error('[Tribunal] Empty content extracted.', responseInfo);
        throw new Error(`Empty response from API. ${responseInfo}`);
    }
    
    console.log('[Tribunal] Extracted content length:', content.length, 'preview:', content.substring(0, 80));
    return content;
}

/**
 * Direct fetch to external API with custom token limit
 */
async function callAPIDirectFetchWithTokens(systemPrompt, userPrompt, maxTokens) {
    const settings = getSettings();
    const apiSettings = settings.api || {};
    
    let { apiEndpoint, apiKey, model, temperature } = apiSettings;

    if (!apiEndpoint || !apiKey) {
        throw new Error('API not configured. Set API endpoint and key in settings, or select a ST connection profile.');
    }

    // Strip trailing slashes
    apiEndpoint = apiEndpoint.replace(/\/+$/, '');
    
    // Ensure we have the full path
    const fullUrl = apiEndpoint.includes('/chat/completions') 
        ? apiEndpoint 
        : apiEndpoint + '/chat/completions';

    console.log('[Tribunal] Direct fetch to:', fullUrl, 'Model:', model, 'maxTokens:', maxTokens);

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
                max_tokens: maxTokens,  // Use the passed maxTokens
                temperature: temperature || 0.8
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
    return settings?.api || {};
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

/**
 * Test the current API configuration
 * Returns { success: boolean, message: string, responseTime?: number }
 */
export async function testAPIConnection() {
    const startTime = Date.now();
    try {
        const result = await callAPI(
            'You are a connection test. Respond with exactly: "OK"',
            'Test. Reply only: "OK"'
        );
        const responseTime = Date.now() - startTime;
        return {
            success: true,
            message: `Connected! Response: "${result.substring(0, 50)}"`,
            responseTime
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}
