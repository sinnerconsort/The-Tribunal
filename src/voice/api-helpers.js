/**
 * src/voice/api-helpers.js - API calls, connection management
 * Imports from: core/state.js
 */

import { extensionSettings } from '../core/state.js';

export async function callAPI(systemPrompt, userPrompt, getContext) {
    const ctx = typeof getContext === 'function' ? getContext() : getContext;
    
    // Try ST Connection Manager
    if (ctx?.ConnectionManagerRequestService) {
        return await callAPIViaConnectionManager(ctx, systemPrompt, userPrompt);
    }
    
    // Try generateRaw
    if (ctx?.generateRaw) {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        return await ctx.generateRaw(prompt, null, false, false, {
            max_tokens: extensionSettings.maxTokens || 400
        });
    }
    
    throw new Error('No API connection available');
}

async function callAPIViaConnectionManager(ctx, systemPrompt, userPrompt) {
    const profile = extensionSettings.connectionProfile;
    const service = ctx.ConnectionManagerRequestService;
    
    const response = await service.sendRequest({
        profileId: profile === 'current' ? undefined : profile,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: extensionSettings.maxTokens || 400
    });
    
    return extractResponseContent(response);
}

export function extractResponseContent(response) {
    if (typeof response === 'string') return response;
    if (response?.content) {
        if (typeof response.content === 'string') return response.content;
        if (Array.isArray(response.content)) {
            return response.content.map(c => c.text || '').join('');
        }
    }
    if (response?.choices?.[0]?.message?.content) {
        return response.choices[0].message.content;
    }
    return String(response);
}

export function getAvailableProfiles(ctx) {
    // Return available connection profiles
    return [{ id: 'current', name: 'Use Current' }];
}
