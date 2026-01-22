/**
 * Simple toast wrapper
 */
export function showToast(message, type = 'info', duration = 3000) {
    if (typeof toastr !== 'undefined') {
        toastr[type]?.(message, 'The Tribunal', { timeOut: duration });
    }
} 
