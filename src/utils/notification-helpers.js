/**
 * The Tribunal - Notification Helpers
 * 
 * Shared error classification and user notification system.
 * Used by both voice generation and thought generation pipelines
 * to surface failures instead of swallowing them silently.
 * 
 * @version 1.0.0 — Error surfacing (Reddit feedback)
 */

// ═══════════════════════════════════════════════════════════════
// USER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Notify the user of generation events via toastr
 * Falls back to console if toastr isn't available
 * 
 * @param {string} title - Short error title
 * @param {string} detail - Longer explanation (shown as body)
 * @param {'error'|'warning'|'info'|'success'} level - Notification level
 */
export function notifyUser(title, detail, level = 'error') {
    const message = detail ? `${title}: ${detail}` : title;
    
    if (typeof toastr !== 'undefined') {
        const options = { 
            timeOut: level === 'error' ? 8000 : 4000, 
            extendedTimeOut: 3000,
            preventDuplicates: true 
        };
        
        switch (level) {
            case 'error':
                toastr.error(detail || '', `⚡ ${title}`, options);
                break;
            case 'warning':
                toastr.warning(detail || '', title, options);
                break;
            case 'success':
                toastr.success(detail || '', title, options);
                break;
            default:
                toastr.info(detail || '', title, options);
        }
    }
    
    // Always log to console too
    const consoleFn = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    console[consoleFn](`[Tribunal] ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Classify an API/generation error into a user-friendly message
 * 
 * Instead of showing raw error strings like "TypeError: Failed to fetch"
 * or "API 429: rate limit exceeded", this translates errors into
 * actionable messages the user can actually do something about.
 * 
 * @param {Error|string} error - The caught error
 * @returns {{ title: string, detail: string, level: 'error'|'warning' }}
 */
export function classifyError(error) {
    const msg = error?.message || String(error);
    
    // ── Connection / Network ──
    if (msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('Network error')) {
        return {
            title: 'Connection Failed',
            detail: 'Could not reach the API. Check your internet connection or ST connection profile.',
            level: 'error'
        };
    }
    
    // ── CORS ──
    if (msg.includes('CORS')) {
        return {
            title: 'CORS Error',
            detail: 'Cross-origin request blocked. Use a SillyTavern connection profile instead of direct API.',
            level: 'error'
        };
    }
    
    // ── Auth / API Key ──
    if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Invalid API')) {
        return {
            title: 'Auth Error',
            detail: 'API key invalid or expired. Check your connection profile settings.',
            level: 'error'
        };
    }
    
    // ── Rate Limits ──
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
        return {
            title: 'Rate Limited',
            detail: 'Too many requests. Wait a moment and try again.',
            level: 'warning'
        };
    }
    
    // ── Model Not Found ──
    if (msg.includes('model') && (msg.includes('not found') || msg.includes('404'))) {
        return {
            title: 'Model Error',
            detail: 'Model not found or unavailable. Check your connection profile\'s model setting.',
            level: 'error'
        };
    }
    
    // ── Generic 404 ──
    if (msg.includes('404')) {
        return {
            title: 'Not Found',
            detail: 'API endpoint returned 404. Check that the endpoint URL is correct.',
            level: 'error'
        };
    }
    
    // ── Token / Context Length ──
    if (msg.includes('token') || msg.includes('context length') || msg.includes('too long')) {
        return {
            title: 'Too Long',
            detail: 'Message was too long for the model\'s context window. Try a shorter scene.',
            level: 'warning'
        };
    }
    
    // ── Empty Response ──
    if (msg.includes('Empty response') || msg.includes('empty content')) {
        return {
            title: 'Empty Response',
            detail: 'API returned nothing. The model may be overloaded — try again.',
            level: 'warning'
        };
    }
    
    // ── Connection Manager ──
    if (msg.includes('Connection Manager') || msg.includes('connection profile')) {
        return {
            title: 'Connection Error',
            detail: msg.length > 120 ? msg.substring(0, 120) + '...' : msg,
            level: 'error'
        };
    }
    
    // ── Settings Missing ──
    if (msg.includes('Settings not loaded') || msg.includes('not configured') || msg.includes('No API configured')) {
        return {
            title: 'Not Configured',
            detail: 'API settings not found. Open The Tribunal settings and configure a connection.',
            level: 'error'
        };
    }
    
    // ── Parse Failures ──
    if (msg.includes('JSON') || msg.includes('parse') || msg.includes('Unexpected token')) {
        return {
            title: 'Parse Error',
            detail: 'Got a response but couldn\'t understand it. The model may have returned malformed output.',
            level: 'warning'
        };
    }
    
    // ── Server Errors (500, 502, 503) ──
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('Internal Server')) {
        return {
            title: 'Server Error',
            detail: 'The API server is having issues. Try again in a few minutes.',
            level: 'warning'
        };
    }
    
    // ── Generic Fallback — show actual error, truncated ──
    return {
        title: 'Generation Failed',
        detail: msg.length > 150 ? msg.substring(0, 150) + '...' : msg,
        level: 'error'
    };
}

/**
 * Classify and immediately notify the user about an error
 * Convenience combo of classifyError + notifyUser
 * 
 * @param {Error|string} error - The caught error
 * @param {string} context - Optional context prefix (e.g., "Voice generation", "Thought generation")
 */
export function surfaceError(error, context = '') {
    const classified = classifyError(error);
    const title = context ? `${context}: ${classified.title}` : classified.title;
    notifyUser(title, classified.detail, classified.level);
}
