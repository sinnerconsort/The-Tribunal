/**
 * The Tribunal - Voice Rendering
 * Panel and chat voice display
 */

import { extensionSettings } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// VOICE RENDERING
// ═══════════════════════════════════════════════════════════════

export function renderVoices(voiceResults, container) {
    if (!container) return;

    if (!voiceResults || voiceResults.length === 0) {
        container.innerHTML = `
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>The voices are silent...</span>
            </div>
        `;
        return;
    }

    container.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                // Critical success - show dramatically
                checkBadge = `<span class="ie-check-badge ie-critical-success" title="Double Sixes!">⚡ CRITICAL</span>`;
            } else if (voice.checkResult.isSnakeEyes) {
                // Critical failure - show dramatically
                checkBadge = `<span class="ie-check-badge ie-critical-failure" title="Snake Eyes!">💀 FUMBLE</span>`;
            } else if (extensionSettings.showDiceRolls) {
                // Normal check - show difficulty name + pass/fail like the game
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const cls = voice.checkResult.success ? 'ie-success' : 'ie-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="ie-check-badge ${cls}" title="${voice.checkResult.total} vs ${voice.checkResult.threshold}">${diffName} [${result}]</span>`;
            }
        } else if (voice.isAncient) {
            // Different icons for different ancient voices
            let ancientIcon = '🦎'; // Default: ARB
            if (voice.id === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.id === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="ie-check-badge ie-primal" title="Primal Voice">${ancientIcon}</span>`;
        } else if (voice.isIntrusive) {
            checkBadge = `<span class="ie-check-badge ie-intrusive" title="Intrusive Thought">💭</span>`;
        } else if (voice.isObject) {
            checkBadge = `<span class="ie-check-badge ie-object" title="Object Voice">${voice.icon || '📦'}</span>`;
        }

        return `
            <div class="ie-voice-line" style="border-left-color: ${voice.color}">
                <div class="ie-voice-header">
                    <span class="ie-voice-signature" style="color: ${voice.color}">${voice.signature || voice.name}</span>
                    ${checkBadge}
                </div>
                <div class="ie-voice-content">${voice.content}</div>
            </div>
        `;
    }).join('');
}

export function appendVoicesToChat(voiceResults, chatContainer) {
    if (!voiceResults || voiceResults.length === 0 || !chatContainer) return;

    // Find the last message element (SillyTavern uses .mes class)
    const messages = chatContainer.querySelectorAll('.mes');
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage) {
        console.warn('[Inland Empire] No messages found in chat container');
        return;
    }

    // Remove any existing voice block from this message to avoid duplicates
    const existingVoices = lastMessage.querySelector('.ie-chat-voices-block');
    if (existingVoices) existingVoices.remove();

    // Create the voices block
    const wrapper = document.createElement('div');
    wrapper.className = 'ie-chat-voices-block';
    
    // Add a subtle header
    const header = document.createElement('div');
    header.className = 'ie-chat-voices-header';
    header.innerHTML = `
        <span class="ie-chat-voices-title">
            <i class="fa-solid fa-brain"></i> Inner Voices
        </span>
        <button class="ie-chat-voices-toggle" title="Toggle voices">
            <i class="fa-solid fa-chevron-up"></i>
        </button>
    `;
    wrapper.appendChild(header);

    // Create voices container
    const voicesContainer = document.createElement('div');
    voicesContainer.className = 'ie-chat-voices-content';
    
    voicesContainer.innerHTML = voiceResults.map(voice => {
        let checkBadge = '';
        let checkClass = '';
        
        if (voice.checkResult) {
            if (voice.checkResult.isBoxcars) {
                checkBadge = '<span class="ie-chat-badge ie-chat-crit-success">⚡ CRITICAL</span>';
                checkClass = 'ie-chat-critical-success';
            } else if (voice.checkResult.isSnakeEyes) {
                checkBadge = '<span class="ie-chat-badge ie-chat-crit-fail">💀 FUMBLE</span>';
                checkClass = 'ie-chat-critical-failure';
            } else {
                const result = voice.checkResult.success ? 'Success' : 'Failure';
                const badgeClass = voice.checkResult.success ? 'ie-chat-badge-success' : 'ie-chat-badge-failure';
                const diffName = voice.checkResult.difficultyName || 'Check';
                checkBadge = `<span class="ie-chat-badge ${badgeClass}">${diffName} [${result}]</span>`;
                checkClass = voice.checkResult.success ? 'ie-chat-success' : 'ie-chat-failure';
            }
        } else if (voice.isAncient) {
            let ancientIcon = '🦎';
            if (voice.skillId === 'limbic_system') ancientIcon = '❤️‍🔥';
            else if (voice.skillId === 'spinal_cord') ancientIcon = '🦴';
            checkBadge = `<span class="ie-chat-badge ie-chat-badge-primal">${ancientIcon} Primal</span>`;
            checkClass = 'ie-chat-primal';
        } else if (voice.isIntrusive) {
            checkBadge = '<span class="ie-chat-badge ie-chat-badge-intrusive">💭 Intrusive</span>';
            checkClass = 'ie-chat-intrusive';
        } else if (voice.isObject) {
            checkBadge = `<span class="ie-chat-badge ie-chat-badge-object">${voice.icon || '📦'} Object</span>`;
            checkClass = 'ie-chat-object';
        }
        // Passive voices (no check) get no badge - they just observe

        return `
            <div class="ie-chat-voice ${checkClass}">
                <div class="ie-chat-voice-header">
                    <span class="ie-chat-voice-sig" style="color: ${voice.color}">${voice.signature || voice.name}</span>
                    ${checkBadge}
                </div>
                <span class="ie-chat-voice-text">${voice.content}</span>
            </div>
        `;
    }).join('');

    wrapper.appendChild(voicesContainer);

    // Add toggle functionality
    header.querySelector('.ie-chat-voices-toggle').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const content = wrapper.querySelector('.ie-chat-voices-content');
        const isCollapsed = content.classList.toggle('ie-collapsed');
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

export function clearVoices() {
    const container = document.getElementById('ie-voices-output');
    if (container) {
        container.innerHTML = `
            <div class="ie-voices-empty">
                <i class="fa-solid fa-comment-slash"></i>
                <span>Waiting for something to happen...</span>
            </div>
        `;
    }
}
