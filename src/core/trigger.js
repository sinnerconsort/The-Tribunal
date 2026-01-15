/**
 * The Tribunal - Voice Trigger
 * Main voice generation trigger function
 */

import { THEMES, THOUGHTS } from '../data/thoughts.js';
import {
    extensionSettings,
    activeStatuses,
    currentBuild,
    saveState,
    getVitals
} from './state.js';
import { getContext, getLastMessage, getChatContainer } from './st-helpers.js';
import {
    trackThemesInMessage,
    checkThoughtDiscovery,
    incrementMessageCount,
    getResearchPenalties
} from '../systems/cabinet.js';
import {
    analyzeContext,
    selectSpeakingSkills,
    generateVoices
} from '../voice/generation.js';
import { showToast, hideToast, showDiscoveryToast } from '../ui/toasts.js';
import { renderVoices, appendVoicesToChat } from '../ui/render.js';

// Import handlers that we need for callbacks
import { handleStartResearch, handleDismissThought, refreshCabinetTab } from './ui-handlers.js';

// Auto-generation tracking
let messagesSinceAutoGen = 0;
let isAutoGenerating = false;

// ═══════════════════════════════════════════════════════════════
// MAIN TRIGGER FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function triggerVoices(externalContext = null) {
    if (!extensionSettings.enabled) return;
    
    const context = externalContext || getContext();
    const lastMsg = getLastMessage();
    
    if (!lastMsg?.mes) {
        showToast('No message to analyze', 'info');
        return;
    }
    
    const loadingToast = showToast('Consulting inner voices...', 'loading');
    
    try {
        // Track themes in the message
        const themes = trackThemesInMessage(lastMsg.mes, THEMES);
        
        // Increment message count for thought discovery
        incrementMessageCount();
        
        // Check for thought discoveries
        const thought = checkThoughtDiscovery(THOUGHTS);
        if (thought) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
        }
        
        // Build context for voice generation
        const voiceContext = analyzeContext(lastMsg.mes, {
            themes,
            activeStatuses: [...activeStatuses],
            vitals: getVitals(),
            researchPenalties: getResearchPenalties()
        });
        
        // Select skills and generate voices
        const selectedSkills = selectSpeakingSkills(voiceContext, {
            currentBuild,
            activeStatuses: [...activeStatuses],
            settings: extensionSettings
        });
        
        if (selectedSkills.length === 0) {
            hideToast(loadingToast);
            showToast('No skills triggered', 'info');
            return;
        }
        
        const voices = await generateVoices(selectedSkills, voiceContext, {
            settings: extensionSettings,
            researchPenalties: getResearchPenalties()
        });
        
        hideToast(loadingToast);
        
        if (voices.length > 0) {
            // Render in panel
            const container = document.getElementById('ie-voices-output');
            if (container) {
                renderVoices(container, voices, extensionSettings);
            }
            
            // Also append to chat if enabled
            if (extensionSettings.appendToChat) {
                appendVoicesToChat(getChatContainer(), voices);
            }
            
            showToast(`${voices.length} voice${voices.length > 1 ? 's' : ''} spoke`, 'success');
        } else {
            showToast('Voices are silent...', 'info');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('[The Tribunal] Voice generation failed:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO THOUGHT GENERATION
// ═══════════════════════════════════════════════════════════════

export async function handleAutoThoughtGeneration() {
    if (isAutoGenerating) return;
    if (!extensionSettings.enabled) return;
    
    isAutoGenerating = true;
    
    try {
        const thought = checkThoughtDiscovery(THOUGHTS);
        
        if (thought) {
            showDiscoveryToast(thought, handleStartResearch, handleDismissThought);
            refreshCabinetTab();
        }
    } catch (error) {
        console.error('[The Tribunal] Auto thought generation failed:', error);
    } finally {
        isAutoGenerating = false;
    }
}

// Export tracking state for external access if needed
export function getAutoGenState() {
    return { messagesSinceAutoGen, isAutoGenerating };
}

export function incrementAutoGenCounter() {
    messagesSinceAutoGen++;
}

export function resetAutoGenCounter() {
    messagesSinceAutoGen = 0;
}
