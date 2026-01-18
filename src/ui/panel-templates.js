/**
 * The Tribunal - Panel HTML Templates
 * Extracted from rebuild v0.3.0
 */

export const PANEL_HEADER_HTML = `
<div class="ie-right-ruler"></div>
<div class="ie-film-bottom-text"></div>
<span class="ie-panel-marker ie-panel-marker-first" style="top: 300px !important;">01A15</span>
<span class="ie-panel-marker ie-panel-marker-bottom">01A15</span>
<span class="ie-panel-marker-right">FELD ▼   DEVICE</span>

<div class="ie-panel-header">
    <!-- Metal Clipboard Clip - Click to close panel -->
    <div class="ie-clipboard-clip" id="ie-close-panel" title="Close Case File">
        <div class="ie-clip-lever"></div>
        <div class="ie-clip-rivet ie-clip-rivet-left"></div>
        <div class="ie-clip-rivet ie-clip-rivet-right"></div>
        <div class="ie-clip-grip ie-clip-grip-left"></div>
        <div class="ie-clip-grip ie-clip-grip-right"></div>
        <div class="ie-clip-label">Case File</div>
    </div>
    
    <!-- Paper area with CRT monitor and Watch -->
    <div class="ie-clipboard-paper">
        <div class="ie-header-row">
            <!-- CRT Vitals Monitor -->
            <div class="ie-crt-container">
                <div class="ie-crt-monitor" id="ie-crt-vitals">
                    <div class="ie-crt-screen">
                        <div class="ie-crt-text">
                            <!-- Character name -->
                            <div class="ie-crt-name" id="ie-crt-char-name">UNKNOWN</div>
                            
                            <!-- Health bar -->
                            <div class="ie-crt-vital-row" id="ie-crt-health-row">
                                <span class="ie-crt-vital-label"><i class="fa-solid fa-heart"></i></span>
                                <div class="ie-crt-vital-bar">
                                    <div class="ie-crt-vital-fill" id="ie-health-fill" style="width: 100%"></div>
                                </div>
                                <span class="ie-crt-vital-value" id="ie-health-value">13</span>
                            </div>
                            
                            <!-- Morale bar -->
                            <div class="ie-crt-vital-row" id="ie-crt-morale-row">
                                <span class="ie-crt-vital-label"><i class="fa-solid fa-brain"></i></span>
                                <div class="ie-crt-vital-bar">
                                    <div class="ie-crt-vital-fill" id="ie-morale-fill" style="width: 100%"></div>
                                </div>
                                <span class="ie-crt-vital-value" id="ie-morale-value">13</span>
                            </div>
                            
                            <!-- EKG heartbeat line -->
                            <div class="ie-crt-ekg">
                                <div class="ie-ekg-line">
                                    <svg viewBox="0 0 200 14" preserveAspectRatio="none">
                                        <path d="M0,7 L20,7 L25,7 L27,2 L30,12 L33,4 L36,7 L50,7 L70,7 L75,7 L77,2 L80,12 L83,4 L86,7 L100,7 L120,7 L125,7 L127,2 L130,12 L133,4 L136,7 L150,7 L170,7 L175,7 L177,2 L180,12 L183,4 L186,7 L200,7"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Watch -->
            <div class="tribunal-watch real-mode" id="ie-header-watch" title="Click to toggle Real/RP time">
                <div class="watch-clip"></div>
                <div class="watch-case">
                    <div class="watch-bezel">
                        <div class="watch-dial">
                            <div class="watch-weather clear-day" id="ie-watch-weather">
                                <i class="fa-solid fa-sun" id="ie-watch-weather-icon"></i>
                            </div>
                            <div class="watch-date" id="ie-watch-date">18</div>
                            <div class="watch-hands">
                                <div class="watch-hand watch-hand-hour" id="ie-watch-hour"></div>
                                <div class="watch-hand watch-hand-minute" id="ie-watch-minute"></div>
                                <div class="watch-hand watch-hand-second" id="ie-watch-second"></div>
                                <div class="watch-center"></div>
                            </div>
                            <div class="watch-crack"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

export const TAB_BAR_HTML = `
<div class="ie-tabs">
    <button class="ie-tab ie-tab-active" data-tab="voices" title="Inner Voices">
        <i class="fa-solid fa-masks-theater"></i>
    </button>
    <button class="ie-tab" data-tab="cabinet" title="Thought Cabinet">
        <i class="fa-solid fa-box-archive"></i>
    </button>
    <button class="ie-tab" data-tab="status" title="Status">
        <i class="fa-solid fa-heart-pulse"></i>
    </button>
    <button class="ie-tab" data-tab="ledger" title="Ledger">
        <i class="fa-solid fa-clipboard-list"></i>
    </button>
    <button class="ie-tab" data-tab="radio" title="Speedfreaks FM">
        <i class="fa-solid fa-radio"></i>
    </button>
</div>`;

export const VOICES_TAB_HTML = `
<div class="ie-tab-content voices-page ie-tab-content-active" data-tab-content="voices">
    <div class="voices-napkin">
        <!-- Decorations -->
        <div class="napkin-watermark">WHIRLING • IN • RAGS</div>
        <div class="napkin-lipstick"></div>
        <div class="napkin-phone-number">555-0139</div>
        
        <!-- Attributes - Back of napkin math -->
        <div class="napkin-calc-block napkin-calc-int">
            <div class="napkin-attr-main">
                <span class="napkin-attr-name">INTELLECT</span>
                <span class="napkin-attr-score" id="napkin-int-score">3</span>
            </div>
            <div class="napkin-skills-scatter">
                <span class="napkin-skill"><span class="name">Log</span> <span class="val" data-skill="logic">3</span></span>
                <span class="napkin-skill"><span class="name">Enc</span> <span class="val" data-skill="encyclopedia">3</span></span>
                <span class="napkin-skill"><span class="name">Rhet</span> <span class="val" data-skill="rhetoric">3</span></span>
                <span class="napkin-skill"><span class="name">Drama</span> <span class="val" data-skill="drama">3</span></span>
                <span class="napkin-skill"><span class="name">Conc</span> <span class="val" data-skill="conceptualization">3</span></span>
                <span class="napkin-skill"><span class="name">VisCal</span> <span class="val" data-skill="visual-calculus">3</span></span>
            </div>
        </div>
        
        <div class="napkin-plus">+</div>
        
        <div class="napkin-calc-block napkin-calc-psy">
            <div class="napkin-attr-main">
                <span class="napkin-attr-name">PSYCHE</span>
                <span class="napkin-attr-score" id="napkin-psy-score">3</span>
            </div>
            <div class="napkin-skills-scatter">
                <span class="napkin-skill"><span class="name">Vol</span> <span class="val" data-skill="volition">3</span></span>
                <span class="napkin-skill"><span class="name">InlEmp</span> <span class="val" data-skill="inland-empire">3</span></span>
                <span class="napkin-skill"><span class="name">Emp</span> <span class="val" data-skill="empathy">3</span></span>
                <span class="napkin-skill"><span class="name">Auth</span> <span class="val" data-skill="authority">3</span></span>
                <span class="napkin-skill"><span class="name">Sugg</span> <span class="val" data-skill="suggestion">3</span></span>
                <span class="napkin-skill"><span class="name">EspCorp</span> <span class="val" data-skill="esprit-de-corps">3</span></span>
            </div>
        </div>
        
        <div class="napkin-plus">+</div>
        
        <div class="napkin-calc-block napkin-calc-fys">
            <div class="napkin-attr-main">
                <span class="napkin-attr-name">PHYSIQUE</span>
                <span class="napkin-attr-score" id="napkin-fys-score">3</span>
            </div>
            <div class="napkin-skills-scatter">
                <span class="napkin-skill"><span class="name">End</span> <span class="val" data-skill="endurance">3</span></span>
                <span class="napkin-skill"><span class="name">Pain</span> <span class="val" data-skill="pain-threshold">3</span></span>
                <span class="napkin-skill"><span class="name">PhysIns</span> <span class="val" data-skill="physical-instrument">3</span></span>
                <span class="napkin-skill"><span class="name">Electro</span> <span class="val" data-skill="electrochemistry">3</span></span>
                <span class="napkin-skill"><span class="name">HalfLt</span> <span class="val" data-skill="half-light">3</span></span>
                <span class="napkin-skill"><span class="name">Shiv</span> <span class="val" data-skill="shivers">3</span></span>
            </div>
        </div>
        
        <div class="napkin-plus">+</div>
        
        <div class="napkin-calc-block napkin-calc-mot">
            <div class="napkin-attr-main">
                <span class="napkin-attr-name">MOTORICS</span>
                <span class="napkin-attr-score" id="napkin-mot-score">3</span>
            </div>
            <div class="napkin-skills-scatter">
                <span class="napkin-skill"><span class="name">H/E</span> <span class="val" data-skill="hand-eye">3</span></span>
                <span class="napkin-skill"><span class="name">Perc</span> <span class="val" data-skill="perception">3</span></span>
                <span class="napkin-skill"><span class="name">React</span> <span class="val" data-skill="reaction-speed">3</span></span>
                <span class="napkin-skill"><span class="name">Sav</span> <span class="val" data-skill="savoir-faire">3</span></span>
                <span class="napkin-skill"><span class="name">Inter</span> <span class="val" data-skill="interfacing">3</span></span>
                <span class="napkin-skill"><span class="name">Comp</span> <span class="val" data-skill="composure">3</span></span>
            </div>
        </div>
        
        <!-- Inner Voices Section -->
        <div class="napkin-voices-section">
            <div class="napkin-voices-header">Inner Voices</div>
            
            <div class="napkin-voices-container" id="napkin-voices-output">
                <div class="napkin-voices-empty" id="napkin-voices-empty">
                    ...waiting for something to happen...
                </div>
            </div>
        </div>
        
        <!-- Button pushed to bottom -->
        <div class="napkin-actions">
            <button class="btn-stamp" id="ie-consult-voices">
                <i class="fa-solid fa-play"></i> CONSULT VOICES
            </button>
        </div>
    </div>
</div>`;

export const CABINET_TAB_HTML = `
<div class="ie-tab-content cabinet-page" data-tab-content="cabinet">
    <div class="cabinet-corkboard">
        <!-- Decorations -->
        <div class="cabinet-decor-fingerprint"></div>
        
        <div class="cabinet-decor-businesscard">
            <div class="cabinet-decor-businesscard-name">EVRART CLAIRE</div>
            <div class="cabinet-decor-businesscard-title">President, Dockworkers' Union</div>
            <div class="cabinet-decor-businesscard-logo"></div>
        </div>
        
        <div class="cabinet-decor-polaroid">
            <div class="cabinet-decor-polaroid-inner"></div>
        </div>
        
        <div class="cabinet-decor-faln">
            <div class="cabinet-decor-faln-logo">FALN</div>
            <div class="cabinet-decor-faln-text">20% off</div>
        </div>
        
        <div class="cabinet-decor-matchbook">
            <div class="cabinet-decor-matchbook-title">WHIRLING<br>IN RAGS</div>
            <div class="cabinet-decor-matchbook-sub">Martinaise</div>
        </div>
        
        <!-- THEMES -->
        <div class="cabinet-themes-section">
            <div class="cabinet-header">Themes</div>
            <div class="cabinet-themes-container" id="cabinet-themes-container">
                <div class="cabinet-themes-empty">No themes tracked yet</div>
            </div>
        </div>
        
        <!-- RESEARCHING - 4 cards, one per attribute -->
        <div class="cabinet-research-section">
            <div class="cabinet-section-header">
                <div class="cabinet-header" style="margin-bottom: 0;">Researching</div>
                <div class="cabinet-slots-counter">// <span class="filled" id="cabinet-research-count">0</span>/4 SLOTS</div>
            </div>
            <div class="cabinet-card-stack" id="cabinet-research-stack">
                <!-- INT slot -->
                <div class="cabinet-cascade-card card-int empty-slot" data-slot="1" data-attr="int" onclick="this.classList.toggle('flipped')">
                    <div class="cabinet-card-inner">
                        <div class="cabinet-card-front">
                            <div class="cabinet-empty-slot-text">Empty slot...</div>
                        </div>
                        <div class="cabinet-card-back">
                            <div class="cabinet-card-back-header">Solution</div>
                            <div class="cabinet-card-back-content"></div>
                        </div>
                    </div>
                </div>
                <!-- PSY slot -->
                <div class="cabinet-cascade-card card-psy empty-slot" data-slot="2" data-attr="psy" onclick="this.classList.toggle('flipped')">
                    <div class="cabinet-card-inner">
                        <div class="cabinet-card-front">
                            <div class="cabinet-empty-slot-text">Empty slot...</div>
                        </div>
                        <div class="cabinet-card-back">
                            <div class="cabinet-card-back-header">Solution</div>
                            <div class="cabinet-card-back-content"></div>
                        </div>
                    </div>
                </div>
                <!-- FYS slot -->
                <div class="cabinet-cascade-card card-fys empty-slot" data-slot="3" data-attr="fys" onclick="this.classList.toggle('flipped')">
                    <div class="cabinet-card-inner">
                        <div class="cabinet-card-front">
                            <div class="cabinet-empty-slot-text">Empty slot...</div>
                        </div>
                        <div class="cabinet-card-back">
                            <div class="cabinet-card-back-header">Solution</div>
                            <div class="cabinet-card-back-content"></div>
                        </div>
                    </div>
                </div>
                <!-- MOT slot -->
                <div class="cabinet-cascade-card card-mot empty-slot" data-slot="4" data-attr="mot" onclick="this.classList.toggle('flipped')">
                    <div class="cabinet-card-inner">
                        <div class="cabinet-card-front">
                            <div class="cabinet-empty-slot-text">Empty slot...</div>
                        </div>
                        <div class="cabinet-card-back">
                            <div class="cabinet-card-back-header">Solution</div>
                            <div class="cabinet-card-back-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- DISCOVERED -->
        <div class="cabinet-discovered-section">
            <div class="cabinet-header">Discovered</div>
            <div class="cabinet-clippings-stack" id="cabinet-discovered-stack">
                <div class="cabinet-discovered-empty">No thoughts discovered</div>
            </div>
        </div>
        
        <!-- INTERNALIZED -->
        <div class="cabinet-internalized-section">
            <div class="cabinet-section-header">
                <div class="cabinet-header" style="margin-bottom: 0;">Internalized</div>
                <div class="cabinet-slots-counter">// <span class="filled" id="cabinet-internalized-count">0</span>/5</div>
            </div>
            <div class="cabinet-internalized-stack" id="cabinet-internalized-stack">
                <div class="cabinet-internalized-empty">No internalized thoughts</div>
            </div>
        </div>
    </div>
</div>`;

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
                <span class="rcm-field-value">41ST-______</span>
            </div>
        </div>
        
        <!-- Physical Status -->
        <div class="rcm-section">
            <div class="rcm-section-header">PHYSICAL STATUS</div>
            <div class="rcm-section-content">
                <div class="rcm-vital-row" id="rcm-health-row">
                    <span class="rcm-vital-label">HEALTH:</span>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-health-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
                    <span class="rcm-vital-value" id="rcm-health-value">13/13</span>
                </div>
                <div class="rcm-vital-row" id="rcm-morale-row">
                    <span class="rcm-vital-label">MORALE:</span>
                    <div class="rcm-vital-bar-container">
                        <span class="rcm-vital-bar-bracket">[</span>
                        <div class="rcm-vital-bar">
                            <div class="rcm-vital-bar-fill" id="rcm-morale-fill" style="width: 100%"></div>
                        </div>
                        <span class="rcm-vital-bar-bracket">]</span>
                    </div>
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
                    <div class="rcm-ancient-voice-entry">
                        <i class="fa-solid fa-dragon rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Ancient Reptilian Brain</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: The Pale</span>
                        </div>
                    </div>
                    <div class="rcm-ancient-voice-entry">
                        <i class="fa-solid fa-brain rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Limbic System</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: The Pale</span>
                        </div>
                    </div>
                    <div class="rcm-ancient-voice-entry rcm-ancient-combo">
                        <i class="fa-solid fa-bone rcm-ancient-voice-icon"></i>
                        <div class="rcm-ancient-voice-details">
                            <span class="rcm-ancient-voice-name">Spinal Cord</span>
                            <span class="rcm-ancient-voice-triggers">Triggers: Tequila Sunset + Revacholian Courage</span>
                        </div>
                    </div>
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

export const LEDGER_TAB_HTML = `
<div class="ie-tab-content ledger-page" data-tab-content="ledger">
    <!-- Sub-tabs bar -->
    <div class="ledger-subtabs">
        <button class="ledger-subtab ledger-subtab-active" data-ledger-tab="cases">CASES</button>
        <button class="ledger-subtab" data-ledger-tab="map">MAP</button>
    </div>
    
    <!-- CASES sub-content - Notebook paper -->
    <div class="ledger-subcontent ledger-subcontent-active ledger-paper notebook-paper" data-ledger-content="cases">
        <div class="ledger-section-header">
            ACTIVE CASES
            <div class="ledger-doodle"></div>
        </div>
        <p class="ledger-empty">No open cases</p>
        <div class="ledger-coffee-ring"></div>
    </div>
    
    <!-- MAP sub-content - Grid paper -->
    <div class="ledger-subcontent ledger-paper grid-paper" data-ledger-content="map">
        <!-- District Map -->
        <div class="district-map">
            <div class="map-sticky-note">
                remember to check the dumpster
            </div>
            <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
                <!-- The Bay (water) -->
                <rect x="0" y="0" width="400" height="80" fill="#b8c8d4"/>
                <text x="200" y="50" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-style="italic" fill="#6a7a84">The Bay</text>
                
                <!-- Land -->
                <rect x="0" y="80" width="400" height="200" fill="#d4cbb8"/>
                
                <!-- District label -->
                <text x="320" y="120" font-family="Arial, sans-serif" font-size="12" letter-spacing="2" fill="#7a7060">MARTINAISE</text>
                
                <!-- Roads -->
                <line x1="0" y1="140" x2="400" y2="140" stroke="#9a9080" stroke-width="8"/>
                <line x1="150" y1="80" x2="150" y2="280" stroke="#9a9080" stroke-width="6" stroke-dasharray="4,4"/>
                <line x1="250" y1="140" x2="250" y2="280" stroke="#9a9080" stroke-width="6"/>
                
                <!-- Location markers -->
                <circle cx="150" cy="115" r="8" class="map-marker map-marker-primary"/>
                <text x="175" y="105" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Crime Scene</text>
                
                <circle cx="150" cy="160" r="10" class="map-marker map-marker-primary"/>
                <text x="95" y="185" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Whirling</text>
                
                <circle cx="250" cy="190" r="6" class="map-marker map-marker-secondary"/>
                <text x="225" y="220" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Bookstore</text>
                
                <circle cx="330" cy="180" r="6" class="map-marker map-marker-secondary"/>
                <text x="305" y="210" font-family="Arial, sans-serif" font-size="10" fill="#5a5347">Pawn Shop</text>
            </svg>
        </div>
        <div class="map-caption">DISTRICT MAP — NOT TO SCALE</div>
        
        <div class="ledger-section-header">
            POINTS OF INTEREST
        </div>
        <p class="ledger-empty">No locations discovered</p>
        
        <div class="ledger-section-header">
            NOTES
        </div>
        <textarea class="ledger-notes" placeholder="Write your notes here..."></textarea>
    </div>
</div>`;

export const RADIO_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="radio">
    <div class="ie-section ie-radio-section">
        <div class="ie-section-header"><span>Speedfreaks FM</span></div>
        
        <!-- Radio Component -->
        <div class="tribunal-radio radio-compact" id="ie-radio">
            <div class="radio-antenna"></div>
            
            <div class="radio-body">
                <div class="radio-display">
                    <div class="radio-display-header">
                        <span class="radio-label-fm">FM</span>
                        <span class="radio-label-brand">ULTRA POWER</span>
                        <span class="radio-label-am">AM</span>
                    </div>
                    
                    <div class="radio-dial">
                        <div class="radio-dial-markers">
                            <span class="radio-dial-marker">88</span>
                            <span class="radio-dial-marker">92</span>
                            <span class="radio-dial-marker">98</span>
                            <span class="radio-dial-marker">104</span>
                            <span class="radio-dial-marker">108</span>
                        </div>
                        <div class="radio-needle" id="ie-radio-needle" style="left: 50%;"></div>
                    </div>
                    
                    <div class="radio-display-station">
                        <span class="radio-station-name" id="ie-station-name">SPEEDFREAKS FM</span>
                    </div>
                </div>
                
                <div class="radio-controls">
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(-30deg);"></div></div>
                        <span class="radio-knob-label">FM</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator"></div></div>
                        <span class="radio-knob-label">AFC</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator" style="transform: rotate(45deg);"></div></div>
                        <span class="radio-knob-label">VOL</span>
                    </div>
                    <div class="radio-knob-group">
                        <div class="radio-knob"><div class="radio-knob-indicator"></div></div>
                        <span class="radio-knob-label">TUNE</span>
                    </div>
                </div>
                
                <div class="radio-speaker">
                    <div class="radio-visualizer" id="ie-radio-viz">
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                        <div class="radio-viz-bar"></div>
                    </div>
                </div>
                
                <div class="radio-bottom">
                    <div class="radio-on-air">
                        <div class="radio-on-air-light"></div>
                        <span class="radio-on-air-text">ON AIR</span>
                    </div>
                    <span class="radio-brand">SHAUN</span>
                </div>
            </div>
        </div>
        
        <button class="ie-btn ie-btn-primary ie-radio-play-btn" id="ie-radio-play">
            <i class="fa-solid fa-play"></i>
            <span>PLAY</span>
        </button>
        
        <div class="radio-station-list" id="ie-station-list">
            <div class="radio-station-item" data-station="0">
                <span class="radio-station-item-freq">87.5</span>
                <span class="radio-station-item-name">STATIC</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
            <div class="radio-station-item" data-station="1">
                <span class="radio-station-item-freq">92.3</span>
                <span class="radio-station-item-name">WHIRLING</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
            <div class="radio-station-item active" data-station="2">
                <span class="radio-station-item-freq">98.3</span>
                <span class="radio-station-item-name">SPEEDFREAKS</span>
                <span class="radio-station-item-type">music</span>
            </div>
            <div class="radio-station-item" data-station="3">
                <span class="radio-station-item-freq">103.7</span>
                <span class="radio-station-item-name">REVACHOL</span>
                <span class="radio-station-item-type">music</span>
            </div>
            <div class="radio-station-item" data-station="4">
                <span class="radio-station-item-freq">108.0</span>
                <span class="radio-station-item-name">DOLORES DEI</span>
                <span class="radio-station-item-type">ambient</span>
            </div>
        </div>
    </div>
</div>`;

export const SETTINGS_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="settings">
    <div class="ie-section">
        <div class="ie-section-header"><span>Settings</span></div>
        <p class="ie-empty-state">Settings coming soon...</p>
    </div>
</div>`;

export const PROFILES_TAB_HTML = `
<div class="ie-tab-content" data-tab-content="profiles">
    <div class="ie-section">
        <div class="ie-section-header"><span>Profiles</span></div>
        <p class="ie-empty-state">Profiles coming soon...</p>
    </div>
</div>`;

export const BOTTOM_BUTTONS_HTML = `
<div class="ie-bottom-buttons">
    <button class="ie-bottom-btn" data-panel="settings" title="Settings">
        <i class="fa-solid fa-gear"></i>
        <span>Settings</span>
    </button>
    <button class="ie-bottom-btn" data-panel="profiles" title="Profiles">
        <i class="fa-solid fa-user"></i>
        <span>Profiles</span>
    </button>
</div>`;
