/**
 * The Tribunal - Settings Tab Template
 * RC-41-CFG Configuration Form
 * v0.3.3 - Added Lock Positions toggle
 */

export const SETTINGS_TAB_HTML = `
<div class="ie-tab-content settings-page" data-tab-content="settings">
    <div class="rcm-config-form">
        <!-- Header -->
        <div class="rcm-form-header">
            <div class="rcm-form-title">R.C.M. EQUIPMENT REQUISITION<br>CONFIGURATION FORM</div>
        </div>
        
        <!-- Section II: Connection -->
        <div class="rcm-section">
            <div class="rcm-section-header">II. CONNECTION PROFILE</div>
            <div class="rcm-section-content">
                <div class="rcm-field-row">
                    <label class="rcm-field-label">PROFILE:</label>
                    <select id="cfg-connection-profile" class="rcm-select">
                        <option value="current">Current Chat Connection</option>
                        <option value="default">SillyTavern Default</option>
                    </select>
                </div>
                
                <div class="rcm-field-grid">
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">TEMPERATURE:</label>
                        <input type="number" id="cfg-temperature" class="rcm-input" 
                               value="0.8" min="0" max="2" step="0.1">
                    </div>
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">MAX TOKENS:</label>
                        <input type="number" id="cfg-max-tokens" class="rcm-input" 
                               value="600" min="100" max="2000" step="50">
                    </div>
                </div>
                
                <button id="cfg-test-connection" class="rcm-btn rcm-btn-dashed">
                    ⚡ TEST CONNECTION
                </button>
            </div>
        </div>
        
        <!-- Section III: Voice Behavior -->
        <div class="rcm-section">
            <div class="rcm-section-header">III. VOICE BEHAVIOR</div>
            <div class="rcm-section-content">
                <div class="rcm-field-grid">
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">MIN VOICES:</label>
                        <input type="number" id="cfg-min-voices" class="rcm-input" 
                               value="3" min="1" max="10">
                    </div>
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">MAX VOICES:</label>
                        <input type="number" id="cfg-max-voices" class="rcm-input" 
                               value="7" min="1" max="15">
                    </div>
                </div>
                
                <div class="rcm-field-row">
                    <label class="rcm-field-label">TRIGGER DELAY (MS):</label>
                    <input type="number" id="cfg-trigger-delay" class="rcm-input" 
                           value="1000" min="0" max="5000" step="100">
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-show-dice" checked>
                    <span>Show dice roll results</span>
                </label>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-show-failed" checked>
                    <span>Show failed skill checks</span>
                </label>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-trigger">
                    <span>Auto-trigger on new messages</span>
                </label>
            </div>
        </div>
        
        <!-- Section III.5: Investigation -->
        <div class="rcm-section">
            <div class="rcm-section-header">III.5 INVESTIGATION</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-show-fab" checked>
                    <span>Show Investigation FAB</span>
                </label>
                <div class="rcm-field-note">
                    <em>Floating action button for scene investigation</em>
                </div>
            </div>
        </div>
        
        <!-- Section IV: Vitals Detection -->
        <div class="rcm-section">
            <div class="rcm-section-header">IV. VITALS DETECTION</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-vitals" checked>
                    <span>Auto-detect vitals changes</span>
                </label>
                <div class="rcm-field-note">
                    <em>Automatically scan messages for health/morale impacts</em>
                </div>
                
                <div class="rcm-field-row">
                    <label class="rcm-field-label">DETECTION SENSITIVITY:</label>
                    <select id="cfg-vitals-sensitivity" class="rcm-select">
                        <option value="low">Low (major events only)</option>
                        <option value="medium" selected>Medium (balanced)</option>
                        <option value="high">High (sensitive)</option>
                    </select>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-vitals-notify" checked>
                    <span>Show vitals notifications</span>
                </label>
            </div>
        </div>
        
        <!-- Section V: Case Detection -->
        <div class="rcm-section">
            <div class="rcm-section-header">V. CASE DETECTION</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-cases">
                    <span>Auto-detect tasks from chat</span>
                </label>
                <div class="rcm-field-note">
                    <em>Scan messages for quests and objectives</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-cases-notify" checked>
                    <span>Show detection notifications</span>
                </label>
            </div>
        </div>
        
        <!-- Section VI: Contact Detection -->
        <div class="rcm-section">
            <div class="rcm-section-header">VI. CONTACT DETECTION</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-contacts">
                    <span>Auto-detect NPCs from chat</span>
                </label>
                <div class="rcm-field-note">
                    <em>Scan messages for new characters</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-contacts-notify" checked>
                    <span>Show detection notifications</span>
                </label>
            </div>
        </div>
        
        <!-- Section VII: Thought Cabinet -->
        <div class="rcm-section">
            <div class="rcm-section-header">VII. THOUGHT CABINET</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-thoughts">
                    <span>Auto-suggest thoughts from themes</span>
                </label>
                <div class="rcm-field-note">
                    <em>When themes spike, suggest generating a thought</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-generate-thoughts">
                    <span>Auto-generate (no confirmation)</span>
                </label>
                <div class="rcm-field-note">
                    <em>Automatically create thoughts when themes are high</em>
                </div>
                
                <div class="rcm-field-row">
                    <label for="cfg-theme-threshold">Theme spike threshold</label>
                    <input type="number" id="cfg-theme-threshold" min="3" max="10" value="8" class="rcm-input-small">
                </div>
                <div class="rcm-field-note">
                    <em>How high themes must reach (3-10, default 8)</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-theme-decay" checked>
                    <span>Enable theme decay</span>
                </label>
                <div class="rcm-field-note">
                    <em>Themes decrease when not reinforced</em>
                </div>
                
                <div class="rcm-field-row">
                    <label for="cfg-internalize-discharge">Internalize discharge</label>
                    <input type="number" id="cfg-internalize-discharge" min="1" max="10" value="5" class="rcm-input-small">
                </div>
                <div class="rcm-field-note">
                    <em>Theme reduction when thought completes (1-10)</em>
                </div>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="rcm-section rcm-actions">
            <label class="rcm-checkbox-row">
                <input type="checkbox" id="cfg-lock-positions">
                <span>Lock icon positions</span>
            </label>
            <div class="rcm-field-note">
                <em>Prevent accidental dragging of FAB and panel</em>
            </div>
            
            <button id="cfg-save-settings" class="rcm-btn rcm-btn-primary">
                💾 SAVE SETTINGS
            </button>
            
            <button id="cfg-reset-positions" class="rcm-btn rcm-btn-secondary">
                ◇ RESET ICON POSITIONS
            </button>
        </div>
        
        <!-- Footer -->
        <div class="rcm-form-footer">
            <span class="rcm-form-id">FORM RC-41-CFG</span>
            <span class="rcm-form-rev">REV. '52</span>
            <span class="rcm-internal-stamp">INTERNAL USE ONLY</span>
        </div>
    </div>
</div>`;
