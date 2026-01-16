/**
 * The Tribunal - Thought Generator Handlers
 * Wires Generate Thought UI to the prompt builder and API
 * 
 * Location: src/ui/thought-generator-handlers.js
 */

import { extensionSettings, saveState, getThemeCounters, getCurrentProfile } from '../core/state.js';
import { 
    buildThoughtSystemPrompt, 
    buildThoughtUserPrompt, 
    parseThoughtResponse,
    formatThoughtForCabinet 
} from '../systems/thought-prompt-builder.js';
import { callAPIForThoughts } from '../voice/api-helpers.js';
import { showToast } from './toasts.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isGenerating = false;

// ═══════════════════════════════════════════════════════════════
// CHAT CONTEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract recent chat context for thought generation
 * @param {number} messageCount - How many recent messages to include
 * @returns {string} Formatted chat excerpt
 */
function getRecentChatContext(messageCount = 5) {
    try {
        const context = SillyTavern.getContext();
        if (!context?.chat?.length) {
            return '';
        }

        const recentMessages = context.chat.slice(-messageCount);
        
        return recentMessages
            .map(msg => {
                const speaker = msg.is_user ? 'Player' : (msg.name || 'Character');
                const text = msg.mes || '';
                // Truncate very long messages
                const truncated = text.length > 500 
                    ? text.substring(0, 500) + '...' 
                    : text;
                return `${speaker}: ${truncated}`;
            })
            .join('\n\n');
    } catch (e) {
        console.error('[Tribunal] Failed to get chat context:', e);
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════
// PLAYER CONTEXT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get player context from current profile
 * Falls back to extension settings if profile doesn't have it
 * @returns {Object} { perspective: string, identity: string }
 */
function getPlayerContext() {
    const profile = getCurrentProfile();
    
    // Check profile first
    if (profile?.playerContext) {
        return {
            perspective: profile.playerContext.perspective || 'observer',
            identity: profile.playerContext.identity || ''
        };
    }
    
    // Fallback to extension settings (global default)
    return {
        perspective: extensionSettings.playerContext?.perspective || 'observer',
        identity: extensionSettings.playerContext?.identity || ''
    };
}

/**
 * Save player context to current profile
 * @param {Object} playerContext - { perspective, identity }
 * @param {Function} getContext - SillyTavern context getter
 */
function savePlayerContext(playerContext, getContext) {
    const profile = getCurrentProfile();
    
    if (profile) {
        profile.playerContext = playerContext;
        saveState(getContext());
    } else {
        // No profile loaded, save to extension settings as fallback
        extensionSettings.playerContext = playerContext;
        saveState(getContext());
    }
}

// ═══════════════════════════════════════════════════════════════
// UI STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Set loading state on Generate button
 * @param {boolean} loading - Whether currently generating
 */
function setGeneratingState(loading) {
    isGenerating = loading;
    
    const btn = document.querySelector('.ie-btn-generate-thought');
    const section = document.querySelector('.ie-thought-generator-section');
    
    if (btn) {
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
            btn.classList.add('ie-generating');
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> GENERATE';
            btn.classList.remove('ie-generating');
        }
    }
    
    if (section) {
        section.classList.toggle('ie-disabled', loading);
    }
}

/**
 * Update perspective toggle UI to match state
 * @param {string} perspective - 'observer' or 'participant'
 */
function updatePerspectiveUI(perspective) {
    const buttons = document.querySelectorAll('.ie-perspective-btn');
    buttons.forEach(btn => {
        const btnPerspective = btn.dataset.perspective;
        btn.classList.toggle('ie-perspective-active', btnPerspective === perspective);
    });
}

/**
 * Populate the generator UI with current player context
 */
function populateGeneratorUI() {
    const playerContext = getPlayerContext();
    
    // Set perspective toggle
    updatePerspectiveUI(playerContext.perspective);
    
    // Set identity input
    const identityInput = document.querySelector('.ie-player-identity-input');
    if (identityInput) {
        identityInput.value = playerContext.identity || '';
    }
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a thought from user input
 * @param {string} concept - User-provided concept/obsession
 * @param {Function} getContext - SillyTavern context getter
 * @param {Function} onSuccess - Callback when thought is added
 * @returns {Object|null} Generated thought or null
 */
async function generateThoughtFromConcept(concept, getContext, onSuccess) {
    if (isGenerating) {
        showToast('Already generating...', 'warning');
        return null;
    }
    
    if (!concept?.trim()) {
        showToast('Enter a concept or obsession first', 'warning');
        return null;
    }
    
    setGeneratingState(true);
    
    try {
        const playerContext = getPlayerContext();
        const themeData = getThemeCounters();
        const chatContext = getRecentChatContext(5);
        
        // Build prompts
        const systemPrompt = buildThoughtSystemPrompt(playerContext, themeData);
        const userPrompt = buildThoughtUserPrompt(concept, chatContext, {
            autoGenerated: false
        });
        
        // Call API with thought-specific settings (higher maxTokens)
        const response = await callAPIForThoughts(systemPrompt, userPrompt);
        
        // DEBUG 1: Check if we got a response
        showToast(`DEBUG 1: Response ${response ? 'received' : 'NULL'}`, 'info', 5000);
        
        if (!response) {
            showToast('No response from API', 'error');
            return null;
        }
        
        // DEBUG 2: Show first 100 chars of response
        showToast(`DEBUG 2: ${response.substring(0, 80)}...`, 'info', 8000);
        
        // Parse response
        const parsed = parseThoughtResponse(response);
        
        // DEBUG 3: Check if parsing worked
        showToast(`DEBUG 3: Parsed = ${parsed ? parsed.name : 'NULL'}`, 'info', 5000);
        
        if (!parsed) {
            showToast('Failed to parse thought - check API response', 'error');
            return null;
        }
        
        // Format for cabinet
        const thoughtId = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const thought = formatThoughtForCabinet(parsed, thoughtId);
        
        // DEBUG 4: Check formatted thought
        showToast(`DEBUG 4: Formatted ID = ${thought?.id}`, 'info', 5000);
        
        // Success callback (adds to cabinet, refreshes UI)
        if (onSuccess) {
            // DEBUG 5: About to call onSuccess
            showToast(`DEBUG 5: Calling onSuccess`, 'info', 5000);
            onSuccess(thought);
            // DEBUG 6: onSuccess completed
            showToast(`DEBUG 6: onSuccess done`, 'info', 5000);
        }
        
        showToast(`Discovered: ${thought.name}`, 'success');
        return thought;
        
    } catch (e) {
        console.error('[Tribunal] Thought generation failed:', e);
        showToast(`Generation failed: ${e.message}`, 'error');
        return null;
    } finally {
        setGeneratingState(false);
    }
}

/**
 * Auto-generate a thought from chat context (no user concept)
 * Called when themes hit thresholds or significant events detected
 * @param {Array} triggeringThemes - Themes that triggered generation
 * @param {string} emotionalTone - Detected emotional tone
 * @param {Function} getContext - SillyTavern context getter
 * @param {Function} onSuccess - Callback when thought is added
 * @returns {Object|null} Generated thought or null
 */
async function autoGenerateThought(triggeringThemes, emotionalTone, getContext, onSuccess) {
    if (isGenerating) {
        return null; // Silently skip if already generating
    }
    
    // Check if auto-gen is enabled
    if (!extensionSettings.thoughtGeneration?.enableAutoThoughts) {
        return null;
    }
    
    setGeneratingState(true);
    
    try {
        const playerContext = getPlayerContext();
        const themeData = getThemeCounters();
        const chatContext = getRecentChatContext(8); // More context for auto-gen
        
        if (!chatContext) {
            return null; // Need chat context for auto-gen
        }
        
        // Build prompts
        const systemPrompt = buildThoughtSystemPrompt(playerContext, themeData);
        const userPrompt = buildThoughtUserPrompt(null, chatContext, {
            autoGenerated: true,
            triggeringThemes,
            emotionalTone
        });
        
        // Call API with thought-specific settings
        const response = await callAPIForThoughts(systemPrompt, userPrompt);
        
        if (!response) {
            return null;
        }
        
        // Parse response
        const parsed = parseThoughtResponse(response);
        
        if (!parsed) {
            return null;
        }
        
        // Format for cabinet
        const thoughtId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const thought = formatThoughtForCabinet(parsed, thoughtId);
        thought.autoGenerated = true;
        thought.triggeringThemes = triggeringThemes;
        
        // Success callback
        if (onSuccess) {
            onSuccess(thought);
        }
        
        showToast(`💭 New thought emerged: ${thought.name}`, 'info', 4000);
        return thought;
        
    } catch (e) {
        console.error('[Tribunal] Auto thought generation failed:', e);
        return null;
    } finally {
        setGeneratingState(false);
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Bind all Generate Thought UI events
 * Call this after panel is created
 * @param {Function} getContext - SillyTavern context getter
 * @param {Function} addDiscoveredThought - Function to add thought to cabinet
 * @param {Function} refreshCabinet - Function to refresh cabinet UI
 */
export function bindThoughtGeneratorEvents(getContext, addDiscoveredThought, refreshCabinet) {
    const section = document.querySelector('.ie-thought-generator-section');
    if (!section) {
        console.warn('[Tribunal] Thought generator section not found');
        return;
    }
    
    // Populate UI with current context
    populateGeneratorUI();
    
    // ─────────────────────────────────────────────────────────────
    // Perspective Toggle (Observer / Participant)
    // ─────────────────────────────────────────────────────────────
    section.querySelectorAll('.ie-perspective-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const perspective = btn.dataset.perspective;
            if (!perspective) return;
            
            // Update UI
            updatePerspectiveUI(perspective);
            
            // Save to profile
            const current = getPlayerContext();
            savePlayerContext({ ...current, perspective }, getContext);
        });
    });
    
    // ─────────────────────────────────────────────────────────────
    // Identity Input (Who are you?)
    // ─────────────────────────────────────────────────────────────
    const identityInput = section.querySelector('.ie-player-identity-input');
    if (identityInput) {
        // Debounced save on input
        let saveTimeout;
        identityInput.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const current = getPlayerContext();
                savePlayerContext({ ...current, identity: identityInput.value }, getContext);
            }, 500);
        });
        
        // Immediate save on blur
        identityInput.addEventListener('blur', () => {
            clearTimeout(saveTimeout);
            const current = getPlayerContext();
            savePlayerContext({ ...current, identity: identityInput.value }, getContext);
        });
    }
    
    // ─────────────────────────────────────────────────────────────
    // From Chat Checkbox (auto-pull context)
    // ─────────────────────────────────────────────────────────────
    const fromChatCheckbox = section.querySelector('.ie-from-chat-checkbox');
    const conceptTextarea = section.querySelector('.ie-thought-concept-input');
    
    if (fromChatCheckbox && conceptTextarea) {
        fromChatCheckbox.addEventListener('change', () => {
            if (fromChatCheckbox.checked) {
                // Auto-fill with hint about auto-extraction
                conceptTextarea.placeholder = 'Leave empty to auto-extract from chat, or add focus keywords...';
                conceptTextarea.classList.add('ie-auto-context');
            } else {
                conceptTextarea.placeholder = 'Enter a concept, obsession, or idea to mull over...';
                conceptTextarea.classList.remove('ie-auto-context');
            }
        });
    }
    
    // ─────────────────────────────────────────────────────────────
    // Generate Button
    // ─────────────────────────────────────────────────────────────
    const generateBtn = section.querySelector('.ie-btn-generate-thought');
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const concept = conceptTextarea?.value?.trim() || '';
            const fromChat = fromChatCheckbox?.checked || false;
            
            // If "From Chat" is checked and no concept, do auto-gen style
            if (fromChat && !concept) {
                const themes = Object.entries(getThemeCounters())
                    .filter(([_, count]) => count >= 3)
                    .map(([theme]) => theme);
                
                await autoGenerateThought(
                    themes.length > 0 ? themes : ['introspection'],
                    null,
                    getContext,
                    (thought) => {
                        addDiscoveredThought(thought);
                        refreshCabinet();
                        // Clear textarea
                        if (conceptTextarea) conceptTextarea.value = '';
                    }
                );
            } else {
                // Standard concept-based generation
                await generateThoughtFromConcept(
                    concept,
                    getContext,
                    (thought) => {
                        addDiscoveredThought(thought);
                        refreshCabinet();
                        // Clear textarea
                        if (conceptTextarea) conceptTextarea.value = '';
                    }
                );
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
    generateThoughtFromConcept,
    autoGenerateThought,
    getPlayerContext,
    savePlayerContext,
    populateGeneratorUI,
    getRecentChatContext
};
