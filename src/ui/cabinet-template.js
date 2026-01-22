/**
 * The Tribunal - Cabinet Tab Template
 * Corkboard thought cabinet with index cards
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
