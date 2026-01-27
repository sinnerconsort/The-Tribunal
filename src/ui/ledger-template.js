/**
 * The Tribunal - Ledger Tab Template
 * Notebook paper with cases (including contacts section) and grid paper map
 * SECRET COMPARTMENT - Hidden third tab with dark leather interior
 */

export const LEDGER_TAB_HTML = `
<div class="ie-tab-content ledger-page" data-tab-content="ledger">
    <!-- Sub-tabs bar -->
    <div class="ledger-subtabs">
        <button class="ledger-subtab ledger-subtab-active" data-ledger-tab="cases">CASES</button>
        <button class="ledger-subtab" data-ledger-tab="map">MAP</button>
        <button class="ledger-subtab ledger-subtab-secret" data-ledger-tab="compartment">???</button>
        
        <!-- Crack overlay - appears as compartment is discovered -->
        <div class="ledger-crack-overlay">
            <div class="ledger-crack-line"></div>
        </div>
    </div>
    
    <!-- CASES sub-content - Notebook paper -->
    <div class="ledger-subcontent ledger-subcontent-active ledger-paper notebook-paper" data-ledger-content="cases">
        <div class="ledger-section-header">
            // ACTIVE CASES
            <div class="ledger-doodle"></div>
        </div>
        <p class="ledger-empty" id="cases-active-empty">No open cases</p>
        <div id="cases-active-list"></div>
        
        <!-- Add Case Button -->
        <button class="cases-add-btn" id="cases-add-btn">
            <i class="fa-solid fa-plus"></i> Add Task
        </button>
        
        <!-- Case Detail Panel (shows when a case is selected) -->
        <div id="case-detail-panel" style="display: none;"></div>
        
        <div class="ledger-section-header">
            // CLOSED CASES
        </div>
        <p class="ledger-empty" id="cases-closed-empty">No closed cases</p>
        <div id="cases-closed-list"></div>
        
        <div class="ledger-section-header">
            // CASE CONTACTS <span id="contacts-count"></span>
        </div>
        
        <!-- Contacts List Container -->
        <div id="contacts-list" class="contacts-list">
            <!-- Contacts will be rendered here -->
        </div>
        
        <!-- Empty state (shown when no contacts) -->
        <p class="ledger-empty contacts-empty" id="contacts-empty">No known contacts</p>
        
        <!-- Add Contact Button -->
        <button class="contacts-add-btn" id="contacts-add-btn">
            <i class="fa-solid fa-diamond"></i> Add Contact
        </button>
        
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
    
    <!-- SECRET COMPARTMENT sub-content - Dark leather interior -->
    <div class="ledger-subcontent ledger-compartment" data-ledger-content="compartment">
        <!-- Floating apricot scent -->
        <span class="ledger-apricot-scent">~ apricot ~</span>
        
        <!-- Compartment interior layout -->
        <div class="compartment-interior">
            
            <!-- Police Dice -->
            <div class="compartment-item compartment-dice">
                <div class="dice-pair">
                    <div class="die die-one">
                        <span class="pip"></span>
                    </div>
                    <div class="die die-one">
                        <span class="pip"></span>
                    </div>
                </div>
                <div class="dice-label">POLICE DICE</div>
                <div class="dice-subtext">Snake eyes. Of course.</div>
            </div>
            
            <!-- Gum Wrapper / Fortune -->
            <div class="compartment-item compartment-fortune">
                <div class="fortune-wrapper">
                    <div class="wrapper-brand">AROMA</div>
                    <div class="wrapper-flavor">Apricot</div>
                    <div class="fortune-paper">
                        <div class="fortune-text" id="compartment-fortune-text">
                            The answer you seek is not in the ledger.
                            It never was.
                        </div>
                        <div class="fortune-source">— The Damaged Ledger</div>
                    </div>
                </div>
                <button class="fortune-draw-btn" id="fortune-draw-btn">
                    <i class="fa-solid fa-rotate"></i> Draw Fortune
                </button>
            </div>
            
            <!-- RCM Badge -->
            <div class="compartment-item compartment-badge">
                <div class="rcm-badge">
                    <div class="badge-header">
                        <div class="badge-org">RCM • REVACHOL CITIZENS MILITIA</div>
                    </div>
                    <div class="badge-photo">
                        <div class="photo-placeholder">
                            <i class="fa-solid fa-user-secret"></i>
                        </div>
                    </div>
                    <div class="badge-info">
                        <div class="badge-name" id="badge-name">NAME UNKNOWN</div>
                        <div class="badge-rank" id="badge-rank">RANK UNKNOWN</div>
                        <div class="badge-number" id="badge-number">LTN-????</div>
                    </div>
                    <div class="badge-perforations">
                        <span class="perf-dots" id="badge-perforations">●●●●●○○○○○</span>
                        <span class="perf-label">SESSIONS</span>
                    </div>
                </div>
            </div>
            
        </div>
        
        <!-- Ledger Commentary -->
        <div class="compartment-commentary">
            <div class="commentary-text" id="compartment-commentary">
                "You found it. The hidden drawer. The one I pretend doesn't exist."
            </div>
        </div>
    </div>
</div>`;

// ═══════════════════════════════════════════════════════════════
// COMPARTMENT REVEAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Reveal the secret compartment tab
 * Call this when unlock conditions are met (or for debug)
 */
export function revealCompartment() {
    const secretTab = document.querySelector('.ledger-subtab-secret');
    const subtabsContainer = document.querySelector('.ledger-subtabs');
    
    if (secretTab) {
        secretTab.classList.add('revealed');
        subtabsContainer?.classList.add('compartment-revealed');
        console.log('[The Tribunal] Secret compartment revealed');
    }
}

/**
 * Update the crack stage (0-3)
 * 0 = no crack, 1 = hairline, 2 = spreading, 3 = full reveal
 */
export function updateCrackStage(stage) {
    const crackLine = document.querySelector('.ledger-crack-line');
    if (!crackLine) return;
    
    // Remove all stage classes
    crackLine.classList.remove('stage-1', 'stage-2', 'stage-3');
    
    // Add appropriate stage
    if (stage >= 1) crackLine.classList.add('stage-1');
    if (stage >= 2) crackLine.classList.add('stage-2');
    if (stage >= 3) {
        crackLine.classList.add('stage-3');
        // At stage 3, also show the tab as "cracking"
        document.querySelector('.ledger-subtab-secret')?.classList.add('cracking');
    }
    
    console.log(`[The Tribunal] Crack stage: ${stage}`);
}

/**
 * Update badge info from profile
 */
export function updateBadgeInfo(profile = {}) {
    const nameEl = document.getElementById('badge-name');
    const rankEl = document.getElementById('badge-rank');
    const numberEl = document.getElementById('badge-number');
    const perfsEl = document.getElementById('badge-perforations');
    
    if (nameEl) nameEl.textContent = profile.name || 'NAME UNKNOWN';
    if (rankEl) rankEl.textContent = profile.rank || 'RANK UNKNOWN';
    if (numberEl) numberEl.textContent = profile.badgeNumber || 'LTN-????';
    
    // Update perforation dots based on sessions
    if (perfsEl && typeof profile.sessions === 'number') {
        const filled = Math.min(profile.sessions, 10);
        const empty = 10 - filled;
        perfsEl.textContent = '●'.repeat(filled) + '○'.repeat(empty);
    }
}

/**
 * Update fortune text
 */
export function updateFortune(text, source = 'The Damaged Ledger') {
    const textEl = document.getElementById('compartment-fortune-text');
    const sourceEl = document.querySelector('.fortune-source');
    
    if (textEl) textEl.textContent = text;
    if (sourceEl) sourceEl.textContent = `— ${source}`;
}

/**
 * Update compartment commentary
 */
export function updateCommentary(text) {
    const el = document.getElementById('compartment-commentary');
    if (el) el.textContent = `"${text}"`;
}

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES (for future unlock mechanics)
// ═══════════════════════════════════════════════════════════════

export function isDeepNight() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
}

export function isWitchingHour() {
    const now = new Date();
    return now.getHours() === 3 && now.getMinutes() === 33;
}

export function getCurrentTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 2) return 'late_night';
    return 'deep_night';
}

// ═══════════════════════════════════════════════════════════════
// DEBUG FUNCTION - Expose globally for testing
// ═══════════════════════════════════════════════════════════════

/**
 * Debug: Force reveal compartment
 * Usage in browser console: TribunalDebug.revealCompartment()
 */
export function debugRevealCompartment() {
    updateCrackStage(3);
    setTimeout(() => revealCompartment(), 500);
    console.log('[The Tribunal] Debug: Compartment force revealed');
}

// Expose debug functions globally
if (typeof window !== 'undefined') {
    window.TribunalDebug = window.TribunalDebug || {};
    window.TribunalDebug.revealCompartment = debugRevealCompartment;
    window.TribunalDebug.updateCrackStage = updateCrackStage;
    window.TribunalDebug.updateFortune = updateFortune;
    window.TribunalDebug.updateBadge = updateBadgeInfo;
}
