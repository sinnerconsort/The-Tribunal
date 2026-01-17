/**
 * src/ui/panel-templates.js - HTML templates
 */

export function getPanelTemplate() {
    return `
        <div class="ie-header">
            <span class="ie-title">THE TRIBUNAL</span>
            <div class="ie-header-buttons">
                <button class="ie-btn ie-rescan" title="Rescan"><i class="fa-solid fa-rotate"></i></button>
                <button class="ie-btn ie-settings-btn" title="Settings"><i class="fa-solid fa-cog"></i></button>
                <button class="ie-btn ie-close" title="Close"><i class="fa-solid fa-times"></i></button>
            </div>
        </div>
        <div class="ie-vitals">
            <div class="ie-vital">
                <span class="ie-vital-label">HEALTH</span>
                <div class="ie-vital-bar ie-health-bar">
                    <div class="ie-vital-fill ie-health-fill"></div>
                    <span class="ie-vital-text ie-health-text">13/13</span>
                </div>
            </div>
            <div class="ie-vital">
                <span class="ie-vital-label">MORALE</span>
                <div class="ie-vital-bar ie-morale-bar">
                    <div class="ie-vital-fill ie-morale-fill"></div>
                    <span class="ie-vital-text ie-morale-text">13/13</span>
                </div>
            </div>
        </div>
        <div class="ie-tabs">
            <button class="ie-tab ie-tab-active" data-tab="voices"><i class="fa-solid fa-brain"></i> Voices</button>
            <button class="ie-tab" data-tab="cabinet"><i class="fa-solid fa-box-archive"></i> Cabinet</button>
            <button class="ie-tab" data-tab="ledger"><i class="fa-solid fa-book"></i> Ledger</button>
        </div>
        <div class="ie-content">
            <div class="ie-tab-content ie-voices-tab active" data-tab="voices">
                <div class="ie-voices"><div class="ie-voices-empty"><i class="fa-solid fa-brain"></i><p>Voices will appear here...</p></div></div>
            </div>
            <div class="ie-tab-content ie-cabinet-tab" data-tab="cabinet">
                <div class="ie-cabinet"><div class="ie-cabinet-empty"><i class="fa-solid fa-box-archive"></i><p>Thought Cabinet is empty</p></div></div>
            </div>
            <div class="ie-tab-content ie-ledger-tab" data-tab="ledger">
                <div class="ie-ledger"><div class="ie-ledger-empty"><i class="fa-solid fa-book"></i><p>No ledger entries yet</p></div></div>
            </div>
        </div>
        <div class="ie-settings" style="display: none;">
            <div class="ie-settings-section">
                <label><input type="checkbox" id="ie-auto-trigger" checked> Enable Auto-Trigger</label>
            </div>
            <div class="ie-settings-section">
                <label>Connection Profile</label>
                <select id="ie-profile"><option value="current">Use Current</option></select>
            </div>
            <div class="ie-settings-section">
                <label>Max Tokens</label>
                <input type="number" id="ie-tokens" value="400" min="100" max="2000">
            </div>
        </div>
    `;
}

export function getVoiceTemplate(voice) {
    return \`<div class="ie-voice" style="--voice-color: \${voice.color || '#a3a3a3'}">
        <div class="ie-voice-header"><span class="ie-voice-skill">\${escapeHtml(voice.skill)}</span></div>
        <div class="ie-voice-text">\${escapeHtml(voice.text)}</div>
    </div>\`;
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}
