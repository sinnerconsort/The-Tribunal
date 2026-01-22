/**
 * The Tribunal - Status Tab Template
 * RCM Medical Evaluation Form
 * v0.3.1 - Added ID to badge number field
 */

export const STATUS_TAB_HTML = `
<div class="ie-tab-content status-page" data-tab-content="status">
    <div class="rcm-medical-form">
        <!-- Coffee stain decoration -->
        <div class="rcm-coffee-stain"></div>
        <div class="rcm-fold-mark"></div>
        
        <!-- Header -->
        <div class="rcm-form-header">
            <div class="rcm-form-title">R.C.M. CITIZEN MILITIA<br>MEDICAL EVALUATION FORM</div>
        </div>
        
        <!-- Patient Info -->
        <div class="rcm-patient-info">
            <div class="rcm-field">
                <span class="rcm-field-label">PATIENT:</span>
                <span class="rcm-field-value" id="rcm-patient-name">______________</span>
            </div>
            <div class="rcm-field">
                <span class="rcm-field-label">BADGE #:</span>
                <span class="rcm-field-value" id="rcm-badge-number">41ST-______</span>
            </div>
        </div>
        
        <!-- Physical Status -->
        <div class="rcm-section">
            <div class="rcm-section-header">PHYSICAL STATUS</div>
            <div class="rcm-section-content">
                <div class="rcm-vital-row" id="rcm-health-row">
                    <span class="rcm-vital-label">HEALTH:</span>
                    <button class="rcm-vital-btn rcm-vital-minus" data-vital="health" data-delta="-1">−</button>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-health-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
                    <button class="rcm-vital-btn rcm-vital-plus" data-vital="health" data-delta="1">+</button>
                    <span class="rcm-vital-value" id="rcm-health-value">13/13</span>
                </div>
                <div class="rcm-vital-row" id="rcm-morale-row">
                    <span class="rcm-vital-label">MORALE:</span>
                    <button class="rcm-vital-btn rcm-vital-minus" data-vital="morale" data-delta="-1">−</button>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-morale-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
                    <button class="rcm-vital-btn rcm-vital-plus" data-vital="morale" data-delta="1">+</button>
                    <span class="rcm-vital-value" id="rcm-morale-value">13/13</span>
                </div>
            </div>
        </div>
        
        <!-- Active Conditions / Effects -->
        <div class="rcm-section">
            <div class="rcm-section-header">ACTIVE CONDITIONS</div>
            <div class="rcm-section-content" id="rcm-conditions-container">
                <div class="rcm-active-effects" id="rcm-active-effects">
                    <span class="rcm-conditions-empty">(none reported)</span>
                </div>
            </div>
        </div>
        
        <!-- Observed States (Status Effects) -->
        <div class="rcm-section">
            <div class="rcm-section-header">OBSERVED STATES (check all apply)</div>
            <div class="rcm-section-content">
                <div class="rcm-states-category">
                    <div class="rcm-states-category-label">PHYSICAL:</div>
                    <div class="rcm-states-grid" id="rcm-physical-states">
                        <div class="rcm-checkbox" data-status="drunk" data-label-off="Drunk" data-label-on="Revacholian Courage">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Drunk</span>
                        </div>
                        <div class="rcm-checkbox" data-status="stimmed" data-label-off="Stimmed" data-label-on="Pyrholidon">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Stimmed</span>
                        </div>
                        <div class="rcm-checkbox" data-status="smoking" data-label-off="Smoking" data-label-on="Nicotine Rush">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Smoking</span>
                        </div>
                        <div class="rcm-checkbox" data-status="hungover" data-label-off="Hungover" data-label-on="Volumetric Shit Compressor">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Hungover</span>
                        </div>
                        <div class="rcm-checkbox" data-status="wounded" data-label-off="Wounded" data-label-on="Finger on the Eject Button">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Wounded</span>
                        </div>
                        <div class="rcm-checkbox" data-status="exhausted" data-label-off="Exhausted" data-label-on="Waste Land">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Exhausted</span>
                        </div>
                        <div class="rcm-checkbox" data-status="dying" data-label-off="Dying" data-label-on="White Mourning">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Dying</span>
                        </div>
                    </div>
                </div>
                <div class="rcm-states-category">
                    <div class="rcm-states-category-label">MENTAL:</div>
                    <div class="rcm-states-grid" id="rcm-mental-states">
                        <div class="rcm-checkbox" data-status="manic" data-label-off="Manic" data-label-on="Tequila Sunset">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Manic</span>
                        </div>
                        <div class="rcm-checkbox" data-status="dissociated" data-label-off="Dissociated" data-label-on="The Pale">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Dissociated</span>
                        </div>
                        <div class="rcm-checkbox" data-status="infatuated" data-label-off="Infatuated" data-label-on="Homo-Sexual Underground">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Infatuated</span>
                        </div>
                        <div class="rcm-checkbox" data-status="lucky" data-label-off="Lucky" data-label-on="Jamrock Shuffle">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Lucky</span>
                        </div>
                        <div class="rcm-checkbox" data-status="terrified" data-label-off="Terrified" data-label-on="Caustic Echo">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Terrified</span>
                        </div>
                        <div class="rcm-checkbox" data-status="enraged" data-label-off="Enraged" data-label-on="Law-Jaw">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Enraged</span>
                        </div>
                        <div class="rcm-checkbox" data-status="grieving" data-label-off="Grieving" data-label-on="The Expression">
                            <span class="rcm-checkbox-box"></span>
                            <span class="rcm-checkbox-label">Grieving</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Copotypes -->
        <div class="rcm-section">
            <div class="rcm-section-header">OFFICER CLASSIFICATION (copotype)</div>
            <div class="rcm-section-content">
                <div class="rcm-copotype-grid" id="rcm-copotypes">
                    <div class="rcm-copotype-item" data-copotype="apocalypse-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Apocalypse Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="sorry-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Sorry Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="boring-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Boring Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="honour-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Honour Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="art-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Art Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="hobocop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Hobocop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="superstar-cop">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Superstar Cop</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="dick-mullen">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Dick Mullen</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="human-can-opener">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Human Can-Opener</span>
                    </div>
                    <div class="rcm-copotype-item" data-copotype="innocence">
                        <span class="rcm-copotype-box">□</span>
                        <span class="rcm-copotype-label">Innocence</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ancient Voices -->
        <div class="rcm-section">
            <div class="rcm-section-header">PSYCHOLOGICAL ANOMALIES (ancient voices)</div>
            <div class="rcm-section-content">
                <div class="rcm-ancient-voices" id="rcm-ancient-voices">
                    <span class="rcm-conditions-empty">(no anomalies detected)</span>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="rcm-form-footer">
            <div class="rcm-officer-field">
                <span class="rcm-officer-label">EXAMINING OFFICER:</span>
                <span class="rcm-signature">Nix Gottlieb<span class="rcm-signature-title">Station Lazareth</span></span>
            </div>
            <div class="rcm-stamp">R.C.M.<br>MEDICAL<br>DIVISION</div>
        </div>
    </div>
</div>`;
