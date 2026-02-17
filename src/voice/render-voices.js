/**
 * The Tribunal - Voice Rendering
 * Panel and chat voice display
 * 
 * REBUILD VERSION: Minor updates for new state system
 */

import { getSettings } from '../core/state.js';
import { getSkillName } from '../data/setting-profiles.js';

// ═══════════════════════════════════════════════════════════════
// VOICE RENDERING (Panel Display)
// ═══════════════════════════════════════════════════════════════

export function renderVoices(voiceResults, container) {
    if (!container) return;

    if (!voiceResults || voiceResults.length === 0) {
        container.innerHTML = `
            <div class="tribunal-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>The voices are silent...</span>
            </div>
        `;
        return;
    }

    const settings = getSettings();
    const showDiceRolls = settings?.dice?.showRolls ?? true;

    container.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                // Critical success - show dramatically
                checkBadge = `<span class="tribunal-check-badge tribunal-critical-success" title="Double Sixes!">⚡ CRITICAL</span>`;
            } else if (voice.checkResult.isSnakeEyes) {
                // Critical failure - show dramatically
                checkBadge = `<span class="tribunal-check-badge tribunal-critical-failure" title="Snake Eyes!">💀 FUMBLE</span>`;
            } else if (showDiceRolls) {
                // Normal check - show difficulty name + pass/fail like the game
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const cls = voice.checkResult.success ? 'tribunal-success' : 'tribunal-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="tribunal-check-badge ${cls}" title="${voice.checkResult.total} vs ${voice.checkResult.threshold}">${diffName} [${result}]</span>`;
            }
        } else if (voice.isAncient) {
            // Different icons for different ancient voices
            let ancientIcon = '🦎'; // Default: ARB
            if (voice.skillId === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.skillId === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="tribunal-check-badge tribunal-primal" title="Primal Voice">${ancientIcon}</span>`;
        } else if (voice.isIntrusive) {
            checkBadge = `<span class="tribunal-check-badge tribunal-intrusive" title="Intrusive Thought">💭</span>`;
        } else if (voice.isObject) {
            checkBadge = `<span class="tribunal-check-badge tribunal-object" title="Object Voice">${voice.icon || '📦'}</span>`;
        }

        return `
            <div class="tribunal-voice-line" style="border-left-color: ${voice.color}">
                <div class="tribunal-voice-header">
                    <span class="tribunal-voice-signature" style="color: ${voice.color}">${getSkillName(voice.skillId, voice.signature || voice.skillName)}</span>
                    ${checkBadge}
                </div>
                <div class="tribunal-voice-content">${voice.content}</div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
// CHAT VOICE RENDERING (Inline with messages)
// ═══════════════════════════════════════════════════════════════

export function appendVoicesToChat(voiceResults, chatContainer) {
    if (!voiceResults || voiceResults.length === 0 || !chatContainer) return;

    const settings = getSettings();
    const showDiceRolls = settings?.dice?.showRolls ?? true;

    // Find the last message element (SillyTavern uses .mes class)
    const messages = chatContainer.querySelectorAll('.mes');
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage) {
        console.warn('[The Tribunal] No messages found in chat container');
        return;
    }

    // Remove any existing voice block from this message to avoid duplicates
    const existingVoices = lastMessage.querySelector('.tribunal-chat-voices-block');
    if (existingVoices) existingVoices.remove();

    // Create the voices block
    const wrapper = document.createElement('div');
    wrapper.className = 'tribunal-chat-voices-block';
    
    // Add a subtle header
    const header = document.createElement('div');
    header.className = 'tribunal-chat-voices-header';
    header.innerHTML = `
        <span class="tribunal-chat-voices-title">
            <i class="fa-solid fa-brain"></i> Inner Voices
        </span>
        <button class="tribunal-chat-voices-toggle" title="Toggle voices">
            <i class="fa-solid fa-chevron-up"></i>
        </button>
    `;
    wrapper.appendChild(header);

    // Create voices container
    const voicesContainer = document.createElement('div');
    voicesContainer.className = 'tribunal-chat-voices-content';
    
    voicesContainer.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        let checkClass = '';
        
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                checkBadge = '<span class="tribunal-chat-badge tribunal-chat-crit-success">⚡ CRITICAL</span>';
                checkClass = 'tribunal-chat-critical-success';
            } else if (voice.checkResult.isSnakeEyes) {
                checkBadge = '<span class="tribunal-chat-badge tribunal-chat-crit-fail">💀 FUMBLE</span>';
                checkClass = 'tribunal-chat-critical-failure';
            } else if (showDiceRolls) {
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const badgeClass = voice.checkResult.success ? 'tribunal-chat-badge-success' : 'tribunal-chat-badge-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="tribunal-chat-badge ${badgeClass}">${diffName} [${result}]</span>`;
                checkClass = voice.checkResult.success ? 'tribunal-chat-success' : 'tribunal-chat-failure';
            }
        } else if (voice.isAncient) {
            let ancientIcon = '🦎';
            if (voice.skillId === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.skillId === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="tribunal-chat-badge tribunal-chat-badge-primal">${ancientIcon} Primal</span>`;
            checkClass = 'tribunal-chat-primal';
        } else if (voice.isIntrusive) {
            checkBadge = '<span class="tribunal-chat-badge tribunal-chat-badge-intrusive">💭 Intrusive</span>';
            checkClass = 'tribunal-chat-intrusive';
        } else if (voice.isObject) {
            checkBadge = `<span class="tribunal-chat-badge tribunal-chat-badge-object">${voice.icon || '📦'} Object</span>`;
            checkClass = 'tribunal-chat-object';
        }
        // Passive voices (no check) get no badge - they just observe

        return `
            <div class="tribunal-chat-voice ${checkClass}">
                <div class="tribunal-chat-voice-header">
                    <span class="tribunal-chat-voice-sig" style="color: ${voice.color}">${getSkillName(voice.skillId, voice.signature || voice.skillName)}</span>
                    ${checkBadge}
                </div>
                <span class="tribunal-chat-voice-text">${voice.content}</span>
            </div>
        `;
    }).join('');

    wrapper.appendChild(voicesContainer);

    // Add toggle functionality
    header.querySelector('.tribunal-chat-voices-toggle').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const content = wrapper.querySelector('.tribunal-chat-voices-content');
        const isCollapsed = content.classList.toggle('tribunal-collapsed');
        btn.innerHTML = isCollapsed ? 
            '<i class="fa-solid fa-chevron-down"></i>' : 
            '<i class="fa-solid fa-chevron-up"></i>';
    });

    // Find the message text container and append after it
    const mesText = lastMessage.querySelector('.mes_text');
    if (mesText) {
        mesText.insertAdjacentElement('afterend', wrapper);
    } else {
        // Fallback: just append to the message
        lastMessage.appendChild(wrapper);
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function clearVoices() {
    const container = document.getElementById('tribunal-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="tribunal-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        `;
    }
}

/**
 * Remove all voice blocks from chat
 */
export function clearChatVoices() {
    const voiceBlocks = document.querySelectorAll('.tribunal-chat-voices-block');
    voiceBlocks.forEach(block => block.remove());
}

/**
 * Get the last generated voices from a specific message
 * @param {number} messageIndex - Index of the message
 * @returns {HTMLElement|null} The voice block element if found
 */
export function getVoiceBlockFromMessage(messageIndex) {
    const messages = document.querySelectorAll('.mes');
    if (messageIndex < 0 || messageIndex >= messages.length) return null;
    
    return messages[messageIndex].querySelector('.tribunal-chat-voices-block');
}
