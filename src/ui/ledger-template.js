/**
 * The Tribunal - Ledger Tab Template
 * Notebook paper with cases, contacts, and grid paper map
 */

export const LEDGER_TAB_HTML = `
<div class="ie-tab-content ledger-page" data-tab-content="ledger">
    <!-- Sub-tabs bar -->
    <div class="ledger-subtabs">
        <button class="ledger-subtab ledger-subtab-active" data-ledger-tab="cases">CASES</button>
        <button class="ledger-subtab" data-ledger-tab="contacts">CONTACTS</button>
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
    
    <!-- CONTACTS sub-content - Notebook paper -->
    <div class="ledger-subcontent ledger-paper notebook-paper" data-ledger-content="contacts">
        <div class="ledger-section-header">
            KNOWN CONTACTS
            <div class="ledger-doodle"></div>
        </div>
        
        <!-- Add Contact Button -->
        <button class="contacts-add-btn" id="contacts-add-btn">
            <i class="fa-solid fa-plus"></i> Add Contact
        </button>
        
        <!-- Contacts List Container -->
        <div id="contacts-list" class="contacts-list">
            <!-- Contacts will be rendered here -->
        </div>
        
        <!-- Empty state (shown when no contacts) -->
        <p class="ledger-empty contacts-empty" id="contacts-empty">No known contacts</p>
        
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
