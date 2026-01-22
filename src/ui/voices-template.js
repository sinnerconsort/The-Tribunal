/**
 * The Tribunal - Voices Tab Template
 * Whirling-in-Rags napkin with skill calculations
 */

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
            
            <div class="napkin-voices-container" id="tribunal-voices-output">
                <div class="tribunal-voices-empty">
                    <i class="fa-solid fa-comment-slash"></i>
                    <span>...waiting for something to happen...</span>
                </div>
            </div>
        </div>
        
        <!-- Button pushed to bottom -->
        <div class="napkin-actions">
            <button class="btn-stamp" id="tribunal-rescan-btn">
                <i class="fa-solid fa-rotate"></i> CONSULT VOICES
            </button>
        </div>
    </div>
</div>`;
