/**
 * The Tribunal - Settings Tab Template
 * RC-41-CFG Configuration Form
 * v1.0.0 - Release version (debug sections removed)
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
        
        <!-- Section III.6: World State -->
        <div class="rcm-section">
            <div class="rcm-section-header">III.6 WORLD STATE</div>
            <div class="rcm-section-content">
                <div class="rcm-field-note" style="margin-bottom: 10px;">
                    <em>🌍 Auto-sync location, weather & time from chat</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-parse-world-tags" checked>
                    <span>Parse WORLD tags</span>
                </label>
                <div class="rcm-field-note">
                    <em>Extract &lt;!--- WORLD{...} ---&gt; from messages</em>
                </div>
                
                <div style="margin-left: 20px; margin-top: 8px;">
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-world-sync-weather" checked>
                        <span>Sync weather to watch</span>
                    </label>
                    
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-world-sync-time" checked>
                        <span>Sync time to watch</span>
                    </label>
                    
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-world-notify" checked>
                        <span>Show location notifications</span>
                    </label>
                </div>
                
                <div style="border-top: 1px dashed rgba(255,255,255,0.2); margin: 12px 0; padding-top: 12px;">
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-use-ai-extractor">
                        <span>AI location extraction</span>
                    </label>
                    <div class="rcm-field-note">
                        <em>⚠️ Uses extra API call if no WORLD tag found</em>
                    </div>
                </div>
                
                <div style="border-top: 1px dashed rgba(255,255,255,0.2); margin: 12px 0; padding-top: 12px;">
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-inject-world-tag" checked>
                        <span>Show injection prompt</span>
                    </label>
                    <div id="world-tag-inject-preview" style="display: none; margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 10px;">
                        <div style="color: #888; margin-bottom: 4px;">Add to Author's Note or System Prompt:</div>
                        <code id="world-tag-inject-code" style="display: block; word-break: break-all; color: #a8d4a8; font-family: monospace; font-size: 9px;">[Always start responses with: &lt;!--- WORLD{"weather":"...","temp":##,"location":"Place, Area","time":"H:MM PM"} ---&gt;]</code>
                        <button id="cfg-copy-world-inject" class="rcm-btn rcm-btn-small" style="margin-top: 6px; width: 100%;">
                            📋 Copy to Clipboard
                        </button>
                    </div>
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
                
                <div style="border-top: 1px dashed rgba(255,255,255,0.2); margin: 12px 0; padding-top: 12px;">
                    <div class="rcm-field-note" style="margin-bottom: 8px;">
                        <em>💀 Death System</em>
                    </div>
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-death-enabled" checked>
                        <span>Enable death system</span>
                    </label>
                    <div class="rcm-field-note">
                        <em>Skill checks when HP/Morale hits 0. Fail = newspaper death screen</em>
                    </div>
                </div>
                
                <div style="border-top: 1px dashed rgba(255,255,255,0.2); margin: 12px 0; padding-top: 12px;">
                    <div class="rcm-field-note" style="margin-bottom: 8px;">
                        <em>🧪 Auto-Consume (Addiction)</em>
                    </div>
                    <label class="rcm-checkbox-row">
                        <input type="checkbox" id="cfg-auto-consume" checked>
                        <span>Enable auto-consume</span>
                    </label>
                    <div class="rcm-field-note">
                        <em>Addicted characters auto-use substances. Volition resists</em>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Section IV.5: Auto-Extraction -->
        <div class="rcm-section">
            <div class="rcm-section-header">IV.5 AUTO-EXTRACTION</div>
            <div class="rcm-section-content">
                <div class="rcm-field-note" style="margin-bottom: 10px;">
                    <em>🤖 AI extracts game state from chat messages</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-equipment">
                    <span>Auto-extract equipment</span>
                </label>
                <div class="rcm-field-note">
                    <em>Clothing, accessories gained/lost in chat</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-inventory">
                    <span>Auto-extract inventory</span>
                </label>
                <div class="rcm-field-note">
                    <em>Items, weapons, consumables from chat</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-extraction-notify" checked>
                    <span>Show extraction notifications</span>
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
                    <span>Auto-detect contacts from chat</span>
                </label>
                <div class="rcm-field-note">
                    <em>Scan messages for new NPCs and names</em>
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
                    <span>Auto-suggest thoughts</span>
                </label>
                <div class="rcm-field-note">
                    <em>Suggest thoughts based on conversation themes</em>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-auto-generate-thoughts">
                    <span>AI-generate new thoughts</span>
                </label>
                <div class="rcm-field-note">
                    <em>Create custom thoughts via API</em>
                </div>
                
                <div class="rcm-field-grid">
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">SPIKE THRESHOLD:</label>
                        <input type="number" id="cfg-theme-threshold" class="rcm-input" 
                               value="8" min="3" max="20">
                    </div>
                    <div class="rcm-field-item">
                        <label class="rcm-field-label">INTERNALIZE DISCHARGE:</label>
                        <input type="number" id="cfg-internalize-discharge" class="rcm-input" 
                               value="5" min="1" max="10">
                    </div>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-theme-decay" checked>
                    <span>Enable theme decay</span>
                </label>
            </div>
        </div>
        
        <!-- Section VIII: Weather Effects -->
        <div class="rcm-section">
            <div class="rcm-section-header">VIII. WEATHER EFFECTS</div>
            <div class="rcm-section-content">
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-weather-enabled" checked>
                    <span>Enable weather particles</span>
                </label>
                
                <div class="rcm-field-row">
                    <label class="rcm-field-label">INTENSITY:</label>
                    <select id="cfg-weather-intensity" class="rcm-select">
                        <option value="light">Light (subtle)</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy (performance impact)</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Section IX: Weather Source -->
        <div class="rcm-section">
            <div class="rcm-section-header">IX. WEATHER SOURCE</div>
            <div class="rcm-section-content">
                <div class="rcm-field-note" style="margin-bottom: 10px;">
                    <em>Where should time & weather come from?</em>
                </div>
                
                <div class="rcm-radio-group" style="margin-bottom: 12px;">
                    <label class="rcm-radio-row">
                        <input type="radio" name="cfg-weather-source" id="cfg-weather-source-rp" value="rp" checked>
                        <span>📖 RP Mode (chat-detected)</span>
                    </label>
                    <div class="rcm-field-note" style="margin-left: 24px; margin-bottom: 8px;">
                        <em>Scans messages for weather keywords</em>
                    </div>
                    
                    <label class="rcm-radio-row">
                        <input type="radio" name="cfg-weather-source" id="cfg-weather-source-real" value="real">
                        <span>🌍 Real-World (Open-Meteo API)</span>
                    </label>
                    <div class="rcm-field-note" style="margin-left: 24px;">
                        <em>Your actual local weather & time</em>
                    </div>
                </div>
                
                <div id="weather-real-options" style="display: none; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; margin-bottom: 12px;">
                    <div class="rcm-field-row" style="margin-bottom: 8px;">
                        <label class="rcm-field-label">📍 LOCATION:</label>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="cfg-weather-location" class="rcm-input" 
                                   placeholder="Seattle, WA" style="flex: 1;">
                            <button id="cfg-weather-auto-location" class="rcm-btn rcm-btn-small" title="Auto-detect from IP">
                                🎯
                            </button>
                        </div>
                    </div>
                    
                    <div class="rcm-field-row" style="margin-bottom: 8px;">
                        <label class="rcm-field-label">🌡️ UNITS:</label>
                        <div class="rcm-radio-group-inline" style="display: flex; gap: 16px;">
                            <label class="rcm-radio-row">
                                <input type="radio" name="cfg-weather-units" id="cfg-weather-units-f" value="fahrenheit" checked>
                                <span>°F</span>
                            </label>
                            <label class="rcm-radio-row">
                                <input type="radio" name="cfg-weather-units" id="cfg-weather-units-c" value="celsius">
                                <span>°C</span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="weather-current-display" style="text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 4px;">CURRENT CONDITIONS</div>
                        <div id="weather-current-info" style="font-size: 14px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Loading...
                        </div>
                        <div id="weather-current-location" style="font-size: 10px; color: #666; margin-top: 4px;"></div>
                    </div>
                    
                    <button id="cfg-weather-refresh" class="rcm-btn rcm-btn-dashed" style="width: 100%;">
                        🔄 Refresh Weather
                    </button>
                </div>
                
                <label class="rcm-checkbox-row">
                    <input type="checkbox" id="cfg-weather-auto" checked>
                    <span>Auto-detect keywords (RP mode)</span>
                </label>
                <div class="rcm-field-note">
                    <em>Scan chat for weather/horror/pale keywords</em>
                </div>
            </div>
        </div>
        
        <!-- Secret Compartment Settings (hidden until unlocked) -->
        <div class="rcm-section rcm-compartment-settings" id="compartment-settings-section" style="display: none;">
            <div class="rcm-section-header" style="color: #d4a574;">
                <i class="fa-solid fa-lock-open" style="margin-right: 6px;"></i>
                COMPARTMENT
            </div>
            <div class="rcm-section-content">
                <div class="rcm-field-note" style="margin-bottom: 12px; color: #a8a8a8;">
                    <em>🍑 The binding gave way. You found it.</em>
                </div>
                
                <div style="padding: 10px; background: rgba(212, 165, 116, 0.1); border: 1px dashed rgba(212, 165, 116, 0.3); border-radius: 4px; margin-bottom: 12px;">
                    <div style="font-size: 11px; color: #d4a574; margin-bottom: 6px;">UNLOCK STATUS</div>
                    <div id="compartment-unlock-status" style="font-size: 12px; color: #888;">
                        <i class="fa-solid fa-check" style="color: #4a7c4a;"></i> Fully Unlocked
                    </div>
                    <div id="compartment-unlock-dates" style="font-size: 10px; color: #666; margin-top: 4px;"></div>
                </div>
                
                <button id="cfg-reset-compartment" class="rcm-btn rcm-btn-dashed" style="width: 100%; border-color: rgba(212, 165, 116, 0.4); color: #d4a574;">
                    <i class="fa-solid fa-rotate-left"></i> Re-seal Compartment
                </button>
                <div class="rcm-field-note" style="margin-top: 6px;">
                    <em>Reset unlock progress. You'll need to find it again...</em>
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
