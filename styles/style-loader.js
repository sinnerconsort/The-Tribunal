/**
 * Style Loader for The Tribunal
 * Loads modular CSS files
 */

const STYLE_MODULES = [
    'base',       // CSS variables
    'fab',        // Floating action buttons
    'panel',      // Main panel, film strip, ruler
    'tabs',       // All tab themes
    'sections',   // Sections & buttons
    'forms',      // Form elements, grids
    'voices',     // Voices output
    'cabinet',    // Thought cabinet
    'profiles',   // Profiles & build editor
    'toasts',     // Toast notifications
    'chat',       // Chat integration
    'discovery',  // Discovery modal
    'investigation', // Investigation v2
    'responsive'  // Mobile breakpoints
];

/**
 * Load all style modules
 * @param {string} extensionPath - Path to extension folder
 */
export function loadAllStyles(extensionPath) {
    STYLE_MODULES.forEach(name => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${extensionPath}/styles/${name}.css`;
        document.head.appendChild(link);
    });
    console.log(`[The Tribunal] Loaded ${STYLE_MODULES.length} style modules`);
}

/**
 * Alternative: Load styles using SillyTavern's loadFileToDocument
 * @param {Function} loadFileToDocument - ST's loader function
 * @param {string} extensionPath - Path to extension folder
 */
export function loadStylesWithST(loadFileToDocument, extensionPath) {
    STYLE_MODULES.forEach(name => {
        loadFileToDocument(`${extensionPath}/styles/${name}.css`, 'css');
    });
}

export { STYLE_MODULES };
