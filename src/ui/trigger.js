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

// Callback holders - set by init.js to avoid circular deps
let _onStartResearch = null;
let _onDismissThought = null;
let _onRefreshCabinet = null;

/**
 * Set callbacks from init.js to avoid circular dependencies
 */
export function setTriggerCallbacks({ onStartResearch, onDismissThought, onRefreshCabinet }) {
    _onStartResearch = onStartResearch;
    _onDismissThought = onDismissThought;
    _onRefreshCabinet = onRefreshCabinet;
}

// Auto-generation tracking
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
        if (thought && _onStartResearch && _onDismissThought) {
            showDiscoveryToast(thought, _onStartResearch, _onDismissThought);
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
                // FIX: Correct argument order - (voiceResults, container)
                renderVoices(voices, container);
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
        
        if (thought && _onStartResearch && _onDismissThought) {
            showDiscoveryToast(thought, _onStartResearch, _onDismissThought);
            if (_onRefreshCabinet) _onRefreshCabinet();
        }
    } catch (error) {
        console.error('[The Tribunal] Auto thought generation failed:', error);
    } finally {
        isAutoGenerating = false;
    }
}
