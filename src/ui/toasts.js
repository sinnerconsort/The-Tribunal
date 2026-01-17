/**
 * src/ui/toasts.js - Toast notifications
 */

export function showToast(message, type = 'info', duration = 3000) {
    if (window.toastr) {
        switch (type) {
            case 'success': window.toastr.success(message); break;
            case 'error': window.toastr.error(message); break;
            case 'warning': window.toastr.warning(message); break;
            default: window.toastr.info(message);
        }
        return;
    }
    console.log(`[Tribunal ${type}] ${message}`);
}
