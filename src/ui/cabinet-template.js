/**
 * The Tribunal - Cabinet Tab Template
 * Tabbed index card filing system for thoughts
 * 
 * @version 5.0.0 - Redesigned as tabbed stack with colored index card tabs
 */

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
            <div class="cabinet-header">// THEMES</div>
            <div class="cabinet-themes-list" id="cabinet-themes-list">
                <div class="cabinet-themes-empty">No themes tracked yet</div>
            </div>
        </div>
        
        <!-- RESEARCHING - Tabbed Stack -->
        <div class="cabinet-research-section">
            <div class="cabinet-section-header">
                <div class="cabinet-header" style="margin-bottom: 0;">// RESEARCHING</div>
                <div class="cabinet-slots-counter">// <span class="filled" id="cabinet-research-count">0</span>/4 SLOTS</div>
            </div>
            
            <div class="cabinet-tabbed-stack" id="cabinet-research-stack">
                <div class="cabinet-tab-row" id="cabinet-research-tabs">
                    <!-- Tabs render here dynamically -->
                </div>
                <div class="cabinet-tab-content" id="cabinet-research-content">
                    <div class="cabinet-empty-message">No thoughts being researched</div>
                </div>
            </div>
        </div>
        
        <!-- DISCOVERED - Tabbed Stack -->
        <div class="cabinet-discovered-section">
            <div class="cabinet-header">// DISCOVERED</div>
            
            <div class="cabinet-tabbed-stack" id="cabinet-discovered-stack">
                <div class="cabinet-tab-row" id="cabinet-discovered-tabs">
                    <!-- Tabs render here dynamically -->
                </div>
                <div class="cabinet-tab-content" id="cabinet-discovered-content">
                    <div class="cabinet-empty-message">No thoughts discovered</div>
                </div>
            </div>
        </div>
        
        <!-- INTERNALIZED - Tabbed Stack -->
        <div class="cabinet-internalized-section">
            <div class="cabinet-section-header">
                <div class="cabinet-header" style="margin-bottom: 0;">// INTERNALIZED</div>
                <div class="cabinet-slots-counter">// <span class="filled" id="cabinet-internalized-count">0</span>/5</div>
            </div>
            
            <div class="cabinet-tabbed-stack" id="cabinet-internalized-stack">
                <div class="cabinet-tab-row" id="cabinet-internalized-tabs">
                    <!-- Tabs render here dynamically -->
                </div>
                <div class="cabinet-tab-content" id="cabinet-internalized-content">
                    <div class="cabinet-empty-message">No internalized thoughts</div>
                </div>
            </div>
        </div>
        
        <!-- GENERATE THOUGHT - Yellow Legal Pad -->
        <div class="cabinet-generate-section">
            <div class="cabinet-legal-pad">
                <div class="cabinet-legal-pad-header-row">
                    <div class="cabinet-legal-pad-header">Generate Thought</div>
                </div>
                
                <div class="cabinet-controls-row">
                    <label class="cabinet-from-chat-toggle">
                        <input type="checkbox" id="cabinet-from-chat" />
                        From chat
                    </label>
                    
                    <div class="cabinet-perspective-toggle">
                        <button class="cabinet-perspective-btn active" data-perspective="observer">
                            <i class="fa-solid fa-magnifying-glass"></i> Observer
                        </button>
                        <button class="cabinet-perspective-btn" data-perspective="participant">
                            <i class="fa-solid fa-masks-theater"></i> Participant
                        </button>
                    </div>
                </div>
                
                <input type="text" class="cabinet-legal-input" id="cabinet-role-input" 
                    placeholder="Who are you? (e.g. 'a survivor who escaped')" />
                
                <textarea class="cabinet-legal-textarea" id="cabinet-concept-input" 
                    placeholder="Enter a concept, obsession, or idea to mull over..."></textarea>
                
                <button class="cabinet-btn-stamp cabinet-btn-stamp-green" id="cabinet-generate-btn">
                    <i class="fa-solid fa-lightbulb"></i> Generate
                </button>
            </div>
        </div>
    </div>
</div>`;

/**
 * Theme color mapping for index card tabs
 * These match the DE aesthetic - muted, slightly worn colors
 */
export const THEME_COLORS = {
    identity: { bg: '#a8d4e6', border: '#7fb8d4' },      // Soft blue
    death: { bg: '#d4d4d4', border: '#a8a8a8' },         // Gray
    love: { bg: '#f8c8dc', border: '#e8a0b8' },          // Pink
    violence: { bg: '#e8a8a8', border: '#d08080' },      // Dusty red
    mystery: { bg: '#d8c8e8', border: '#b8a0d0' },       // Lavender
    substance: { bg: '#c8e8c8', border: '#98c898' },     // Pale green
    failure: { bg: '#e8d8b8', border: '#d0c090' },       // Tan/beige
    authority: { bg: '#f8e8a8', border: '#e0c878' },     // Yellow
    paranoia: { bg: '#e8c8a8', border: '#d0a880' },      // Orange/peach
    philosophy: { bg: '#c8d8e8', border: '#a0b8d0' },    // Slate blue
    money: { bg: '#c8e8b8', border: '#a0d090' },         // Money green
    supernatural: { bg: '#e0d0f0', border: '#c0a8e0' }   // Mystic purple
};

// Default color for thoughts without a theme
export const DEFAULT_CARD_COLOR = { bg: '#f5f5dc', border: '#d4d4aa' }; // Cream/ivory
