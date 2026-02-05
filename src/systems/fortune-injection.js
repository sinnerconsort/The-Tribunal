/**
 * The Tribunal - Fortune Injection System
 * Batch 3: Fortunes seed the AI's context
 * 
 * When a fortune is drawn, it gets injected into the Author's Note
 * so the AI can weave its theme into the response organically.
 * 
 * The fortune "comes true" not because we force it, but because
 * we plant the seed and let the AI grow it naturally.
 * 
 * @version 1.1.0 - Fixed: Use proper ST imports instead of fragile window lookup
 */

import { getContext } from '../../../../../extensions.js';
import { eventSource, event_types } from '../../../../../../script.js';
import { 
    getPendingInjection, 
    hasPendingInjection,
    onAwarenessEvent 
} from './ledger-awareness.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    // Whether fortune injection is enabled
    enabled: true,
    
    // Injection method: 'authors_note' or 'system_prompt'
    method: 'authors_note',
    
    // How prominently to inject (affects prompt strength)
    // 'subtle' = hint, 'moderate' = suggest, 'strong' = direct
    strength: 'moderate',
    
    // Auto-clear fortune after injection
    autoClear: true,
    
    // Show notification when fortune is injected
    showNotification: true,
    
    // Maximum fortune age before it expires (ms) - 30 minutes
    maxAge: 30 * 60 * 1000
};

// Track injection state
let lastInjectedFortune = null;
let injectionCount = 0;

// ═══════════════════════════════════════════════════════════════
// FORTUNE FORMATTING
// Format the fortune for context injection
// ═══════════════════════════════════════════════════════════════

/**
 * Format templates by strength level
 * These wrap the fortune text to guide the AI
 */
const INJECTION_TEMPLATES = {
    subtle: {
        prefix: '[Narrative thread to weave naturally if appropriate: ',
        suffix: ']'
    },
    moderate: {
        prefix: '[The atmosphere carries a sense that ',
        suffix: ' — let this color the scene subtly.]'
    },
    strong: {
        prefix: '[Important thematic element for this scene: ',
        suffix: ' — incorporate this meaningfully into the narrative.]'
    }
};

/**
 * Voice-specific formatting adjustments
 */
const VOICE_ADJUSTMENTS = {
    damaged: {
        // Damaged ledger fortunes are observational, present-tense
        prefix: 'something feels ',
        tone: 'melancholic observation'
    },
    oblivion: {
        // Oblivion fortunes are prophetic, future-tense
        prefix: 'fate whispers that ',
        tone: 'inevitable prophecy'
    },
    failure: {
        // Failure fortunes are sardonic, meta
        prefix: 'the universe suggests ',
        tone: 'darkly humorous irony'
    }
};

/**
 * Format a fortune for injection into AI context
 * @param {Object} fortune - Fortune object from getPendingInjection()
 * @param {string} strength - 'subtle', 'moderate', or 'strong'
 * @returns {string} Formatted injection text
 */
function formatFortuneForInjection(fortune, strength = CONFIG.strength) {
    if (!fortune || !fortune.fortune) return '';
    
    const template = INJECTION_TEMPLATES[strength] || INJECTION_TEMPLATES.moderate;
    const voiceAdj = VOICE_ADJUSTMENTS[fortune.voice] || VOICE_ADJUSTMENTS.damaged;
    
    // Clean the fortune text (remove quotes if present)
    let fortuneText = fortune.fortune.trim();
    fortuneText = fortuneText.replace(/^["']|["']$/g, '');
    
    // For subtle, just use the text
    if (strength === 'subtle') {
        return `${template.prefix}${fortuneText}${template.suffix}`;
    }
    
    // For moderate/strong, add voice context
    return `${template.prefix}${voiceAdj.prefix}${fortuneText.toLowerCase()}${template.suffix}`;
}

/**
 * Create the full injection block with metadata
 */
function createInjectionBlock(fortune) {
    const formatted = formatFortuneForInjection(fortune);
    
    return {
        text: formatted,
        source: 'tribunal_fortune',
        voice: fortune.voice,
        voiceName: fortune.voiceName,
        original: fortune.fortune,
        timestamp: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// INJECTION METHODS
// Different ways to get the fortune into AI context
// ═══════════════════════════════════════════════════════════════

/**
 * Inject via Author's Note (preferred method)
 * Appends to existing Author's Note temporarily
 */
function injectViaAuthorsNote(injectionBlock) {
    try {
        const context = getContext();
        if (!context) {
            console.warn('[Fortune Injection] No context available');
            return false;
        }
        
        // Get current Author's Note
        const currentAN = context.extensionSettings?.note?.content || '';
        
        // Append fortune (with separator if there's existing content)
        const separator = currentAN.trim() ? '\n\n' : '';
        const newAN = `${currentAN}${separator}${injectionBlock.text}`;
        
        // Update Author's Note
        if (context.extensionSettings?.note) {
            context.extensionSettings.note.content = newAN;
            
            // Mark that we modified it (so we can clean up later)
            context.extensionSettings.note._tribunalFortune = {
                injected: true,
                originalContent: currentAN,
                fortuneText: injectionBlock.text,
                timestamp: injectionBlock.timestamp
            };
            
            console.log('[Fortune Injection] Injected via Author\'s Note');
            console.log('[Fortune Injection] Text:', injectionBlock.text);
            
            return true;
        }
        
        return false;
    } catch (e) {
        console.error('[Fortune Injection] Author\'s Note injection failed:', e);
        return false;
    }
}

/**
 * Clean up Author's Note after message generation
 * Restores original content
 */
function cleanupAuthorsNote() {
    try {
        const context = getContext();
        if (!context?.extensionSettings?.note?._tribunalFortune) return;
        
        const tracking = context.extensionSettings.note._tribunalFortune;
        
        if (tracking.injected) {
            // Restore original content
            context.extensionSettings.note.content = tracking.originalContent;
            delete context.extensionSettings.note._tribunalFortune;
            
            console.log('[Fortune Injection] Author\'s Note cleaned up');
        }
    } catch (e) {
        console.error('[Fortune Injection] Cleanup failed:', e);
    }
}

/**
 * Alternative: Inject via chat injection (more visible but reliable)
 * Uses SillyTavern's chat injection system
 */
function injectViaChatInjection(injectionBlock) {
    try {
        const context = getContext();
        if (!context) return false;
        
        // Use setExtensionPrompt if available
        if (typeof context.setExtensionPrompt === 'function') {
            context.setExtensionPrompt(
                'tribunal_fortune',
                injectionBlock.text,
                1, // extension_prompt_types.IN_CHAT (after scenario)
                0  // depth (0 = closest to latest message)
            );
            
            console.log('[Fortune Injection] Injected via chat injection');
            return true;
        }
        
        return false;
    } catch (e) {
        console.error('[Fortune Injection] Chat injection failed:', e);
        return false;
    }
}

/**
 * Clear chat injection after use
 */
function clearChatInjection() {
    try {
        const context = getContext();
        if (context && typeof context.setExtensionPrompt === 'function') {
            context.setExtensionPrompt('tribunal_fortune', '', 1, 0);
            console.log('[Fortune Injection] Chat injection cleared');
        }
    } catch (e) {
        console.error('[Fortune Injection] Clear injection failed:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN INJECTION LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a fortune should be injected
 */
function shouldInject() {
    if (!CONFIG.enabled) return false;
    if (!hasPendingInjection()) return false;
    
    const pending = getPendingInjection(false); // Don't consume yet
    if (!pending) return false;
    
    // Check age
    const age = Date.now() - pending.drawnAt;
    if (age > CONFIG.maxAge) {
        console.log('[Fortune Injection] Fortune expired, skipping');
        getPendingInjection(true); // Consume and discard
        return false;
    }
    
    return true;
}

/**
 * Perform the injection
 * Call this before message generation
 */
export function injectFortune() {
    if (!shouldInject()) return null;
    
    // Get and consume the pending fortune
    const fortune = getPendingInjection(true);
    if (!fortune) return null;
    
    // Create injection block
    const injectionBlock = createInjectionBlock(fortune);
    
    // Try injection method
    let success = false;
    
    if (CONFIG.method === 'authors_note') {
        success = injectViaAuthorsNote(injectionBlock);
    } else {
        success = injectViaChatInjection(injectionBlock);
    }
    
    if (success) {
        lastInjectedFortune = injectionBlock;
        injectionCount++;
        
        // Show notification
        if (CONFIG.showNotification && typeof toastr !== 'undefined') {
            toastr.info(
                `Fortune seeded: "${fortune.fortune.substring(0, 50)}..."`,
                'The Ledger Speaks',
                { timeOut: 3000, positionClass: 'toast-bottom-right' }
            );
        }
        
        console.log('[Fortune Injection] Success!', {
            voice: fortune.voiceName,
            text: fortune.fortune.substring(0, 50) + '...'
        });
        
        return injectionBlock;
    }
    
    return null;
}

/**
 * Clean up after message generation
 * Call this after the AI response is received
 */
export function cleanupInjection() {
    if (CONFIG.method === 'authors_note') {
        cleanupAuthorsNote();
    } else {
        clearChatInjection();
    }
    
    lastInjectedFortune = null;
}

// ═══════════════════════════════════════════════════════════════
// EVENT HOOKS
// Wire into SillyTavern's message generation
// ═══════════════════════════════════════════════════════════════

/**
 * Hook into message generation start
 * This is where we inject the fortune
 */
function onGenerationStart() {
    console.log('[Fortune Injection] Generation starting, checking for fortune...');
    injectFortune();
}

/**
 * Hook into message generation end
 * This is where we clean up
 */
function onGenerationEnd() {
    console.log('[Fortune Injection] Generation ended, cleaning up...');
    cleanupInjection();
}

/**
 * Hook into new AI message
 * Alternative cleanup point
 */
function onNewMessage(messageId) {
    // Clean up injection after message is received
    setTimeout(() => {
        cleanupInjection();
    }, 100);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the fortune injection system
 * Hooks into SillyTavern events
 */
export function initFortuneInjection() {
    // Hook into ST events using proper imports
    try {
        if (eventSource && event_types) {
            // Before generation starts
            eventSource.on(event_types.GENERATION_STARTED, onGenerationStart);
            
            // After generation ends
            eventSource.on(event_types.GENERATION_ENDED, onGenerationEnd);
            
            // After message received (backup cleanup)
            eventSource.on(event_types.MESSAGE_RECEIVED, onNewMessage);
            
            console.log('[Fortune Injection] Hooked into ST events');
        } else {
            console.warn('[Fortune Injection] eventSource or event_types not available');
        }
    } catch (e) {
        console.warn('[Fortune Injection] Event hook failed:', e);
    }
    
    // Also listen for fortune ready events from awareness
    onAwarenessEvent('fortuneReady', (fortune) => {
        console.log('[Fortune Injection] Fortune queued:', fortune.fortune.substring(0, 30) + '...');
    });
    
    console.log('[Fortune Injection] Initialized');
    console.log('[Fortune Injection] Method:', CONFIG.method);
    console.log('[Fortune Injection] Strength:', CONFIG.strength);
}

// ═══════════════════════════════════════════════════════════════
// MANUAL CONTROL
// For testing and manual triggering
// ═══════════════════════════════════════════════════════════════

/**
 * Manually inject a fortune (bypasses queue)
 */
export function manualInject(fortuneText, voiceKey = 'damaged') {
    const fortune = {
        fortune: fortuneText,
        voice: voiceKey,
        voiceName: voiceKey === 'damaged' ? 'THE DAMAGED LEDGER' : 
                   voiceKey === 'oblivion' ? 'THE LEDGER OF OBLIVION' :
                   'THE LEDGER OF FAILURE AND HATRED',
        drawnAt: Date.now()
    };
    
    const injectionBlock = createInjectionBlock(fortune);
    
    let success = false;
    if (CONFIG.method === 'authors_note') {
        success = injectViaAuthorsNote(injectionBlock);
    } else {
        success = injectViaChatInjection(injectionBlock);
    }
    
    if (success) {
        lastInjectedFortune = injectionBlock;
        console.log('[Fortune Injection] Manual injection success');
    }
    
    return success;
}

/**
 * Get current injection status
 */
export function getInjectionStatus() {
    return {
        enabled: CONFIG.enabled,
        method: CONFIG.method,
        strength: CONFIG.strength,
        hasPending: hasPendingInjection(),
        lastInjected: lastInjectedFortune,
        totalInjections: injectionCount
    };
}

/**
 * Update configuration
 */
export function setConfig(key, value) {
    if (key in CONFIG) {
        CONFIG[key] = value;
        console.log(`[Fortune Injection] Config updated: ${key} = ${value}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// DEBUG / EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.TribunalFortuneInjection = {
        init: initFortuneInjection,
        inject: injectFortune,
        cleanup: cleanupInjection,
        manual: manualInject,
        status: getInjectionStatus,
        setConfig,
        
        // Test helpers
        testInject: () => manualInject("Something unexpected will arrive before the conversation ends."),
        testOblivion: () => manualInject("The answer you seek is already known. You're afraid to admit it.", 'oblivion'),
        testFailure: () => manualInject("This will go wrong. It always does. That's the fun part.", 'failure'),
        
        // Config shortcuts
        setStrength: (s) => setConfig('strength', s),
        setMethod: (m) => setConfig('method', m),
        enable: () => setConfig('enabled', true),
        disable: () => setConfig('enabled', false)
    };
}

export default {
    initFortuneInjection,
    injectFortune,
    cleanupInjection,
    manualInject,
    getInjectionStatus,
    setConfig
};
