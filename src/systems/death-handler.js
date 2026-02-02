/**
 * The Tribunal - Death Handler
 * 
 * Handles game over when HP or Morale hits 0:
 * 1. Detect death type from recent context
 * 2. Trigger skill check for close call
 * 3. Generate Périphérique newspaper via AI
 * 4. Show dramatic game over overlay
 * 5. Reset vitals on dismiss
 * 
 * Inspired by Disco Elysium's iconic death screens
 */

// ═══════════════════════════════════════════════════════════════
// DEATH TYPE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

const DEATH_TYPES = {
    // HEALTH DEATHS (HP → 0)
    cardiac: {
        triggers: ['heart', 'cardiac', 'chest pain', 'ticker', 'attack'],
        headlines: [
            "COP SUFFERS FINAL HEART ATTACK",
            "DETECTIVE'S HEART GIVES OUT",
            "OFFICER'S TICKER STOPS MID-INVESTIGATION"
        ],
        skill: 'endurance'
    },
    violence: {
        triggers: ['shot', 'stabbed', 'beaten', 'killed', 'murdered', 'attack', 'fight', 'bullet', 'knife', 'blood'],
        headlines: [
            "OFFICER FOUND DEAD IN MARTINAISE",
            "DETECTIVE KILLED IN LINE OF DUTY",
            "RCM LIEUTENANT SLAIN"
        ],
        skill: 'physical_instrument'
    },
    overdose: {
        triggers: ['overdose', 'drugs', 'pills', 'alcohol', 'drunk', 'poisoning', 'intoxication'],
        headlines: [
            "DETECTIVE'S FINAL BENDER",
            "OFFICER DIES OF SUBSTANCE ABUSE",
            "COP'S DEMONS FINALLY WIN"
        ],
        skill: 'electrochemistry'
    },
    environmental: {
        triggers: ['cold', 'freeze', 'drown', 'fall', 'exposure', 'hypothermia', 'water', 'river', 'canal'],
        headlines: [
            "BODY RECOVERED FROM CANAL",
            "OFFICER LOST TO THE ELEMENTS",
            "DETECTIVE SUCCUMBS TO HYPOTHERMIA",
            "RCM OFFICER FOUND FROZEN IN MARTINAISE"
        ],
        skill: 'shivers'
    },
    
    // MORALE DEATHS (Morale → 0)
    breakdown: {
        triggers: ['cry', 'sob', 'break', 'snap', 'scream', 'despair', 'hopeless'],
        headlines: [
            "DISGRACED COP SLEEPS IN TRASH",
            "OFFICER'S MENTAL BREAKDOWN PUBLIC SPECTACLE",
            "DETECTIVE LAST SEEN WEEPING IN ALLEY"
        ],
        skill: 'volition',
        isMorale: true
    },
    humiliation: {
        triggers: ['shame', 'humiliat', 'embarrass', 'laugh', 'mock', 'ridicul'],
        headlines: [
            "COP GIVES UP THE DETECTIVE GENRE FOR SOCIAL REALISM",
            "OFFICER RESIGNS AFTER PUBLIC HUMILIATION",
            "DETECTIVE'S REPUTATION IN TATTERS"
        ],
        skill: 'composure',
        isMorale: true
    },
    existential: {
        triggers: ['meaning', 'purpose', 'why', 'nothing', 'empty', 'pointless', 'futile', 'absurd'],
        headlines: [
            "WEEKS LATER, NO ANSWERS ABOUT EXTRACTED COP",
            "DETECTIVE QUESTIONS EVERYTHING, FINDS NOTHING",
            "OFFICER STARES INTO ABYSS, ABYSS STARES BACK"
        ],
        skill: 'inland_empire',
        isMorale: true
    },
    rejection: {
        triggers: ['reject', 'leave', 'abandon', 'alone', 'nobody', 'hate'],
        headlines: [
            "NOBODY CAME TO THE FUNERAL",
            "FORMER DETECTIVE DIES ALONE",
            "OFFICER'S LAST WORDS: 'I NEVER LOVED THAT WOMAN'"
        ],
        skill: 'empathy',
        isMorale: true
    }
};

// Default fallbacks
const DEFAULT_HEALTH_DEATH = {
    headlines: ["DETECTIVE FOUND DEAD", "OFFICER'S FINAL CASE", "RCM LOSES ANOTHER"],
    skill: 'endurance'
};

const DEFAULT_MORALE_DEATH = {
    headlines: ["COP GIVES UP", "DETECTIVE'S SPIRIT BROKEN", "OFFICER WALKS AWAY"],
    skill: 'volition',
    isMorale: true
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let deathOverlay = null;
let isShowingDeathScreen = false;
let lastDeathContext = null;

// ═══════════════════════════════════════════════════════════════
// DEATH TYPE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze recent context to determine death type
 * @param {string} recentText - Recent chat messages
 * @param {boolean} isMoraleDeath - True if morale death, false if health
 * @returns {object} Death type info
 */
function classifyDeath(recentText, isMoraleDeath) {
    const lower = recentText.toLowerCase();
    
    // Filter to appropriate death types
    const candidates = Object.entries(DEATH_TYPES).filter(([key, data]) => {
        return isMoraleDeath ? data.isMorale : !data.isMorale;
    });
    
    // Score each type by trigger matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, data] of candidates) {
        let score = 0;
        for (const trigger of data.triggers) {
            if (lower.includes(trigger)) {
                score++;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = { key, ...data };
        }
    }
    
    // Fall back to defaults
    if (!bestMatch || bestScore === 0) {
        return isMoraleDeath ? { key: 'default', ...DEFAULT_MORALE_DEATH } 
                            : { key: 'default', ...DEFAULT_HEALTH_DEATH };
    }
    
    return bestMatch;
}

/**
 * Get random headline for death type
 */
function getRandomHeadline(deathType) {
    const headlines = deathType.headlines || DEFAULT_HEALTH_DEATH.headlines;
    return headlines[Math.floor(Math.random() * headlines.length)];
}

// ═══════════════════════════════════════════════════════════════
// SKILL CHECK (Close Call)
// ═══════════════════════════════════════════════════════════════

/**
 * Attempt a skill check to avoid death
 * @param {string} skillId - Skill to check (endurance, volition, etc.)
 * @param {number} difficulty - Check difficulty (default 10)
 * @returns {object} { success, roll, modifier, total, skill }
 */
function attemptDeathSave(skillId, difficulty = 10) {
    // Get skill level (default 3)
    let skillLevel = 3;
    let skillModifier = 0;
    
    try {
        const { getChatState } = window.TribunalState || {};
        if (getChatState) {
            const state = getChatState();
            // Get base from attributes or skill levels
            skillLevel = state?.skillLevels?.[skillId] || state?.attributes?.physique || 3;
            // Get modifiers from effects
            skillModifier = window.TribunalEffects?.getSkillModifier?.(skillId) || 0;
        }
    } catch (e) {
        console.warn('[Death] Could not get skill level:', e);
    }
    
    // Roll 2d6
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;
    
    const total = roll + skillLevel + skillModifier;
    const success = total >= difficulty;
    
    console.log(`[Death] Skill check: ${skillId} - Roll ${die1}+${die2}=${roll} + ${skillLevel} + ${skillModifier} = ${total} vs ${difficulty} → ${success ? 'SUCCESS' : 'FAILURE'}`);
    
    return {
        success,
        roll,
        die1,
        die2,
        skillLevel,
        modifier: skillModifier,
        total,
        difficulty,
        skill: skillId
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN DEATH CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check if damage would kill and handle accordingly
 * Call this BEFORE applying damage
 * 
 * @param {number} currentHealth - Current HP
 * @param {number} currentMorale - Current Morale
 * @param {number} healthDelta - Damage to health (negative)
 * @param {number} moraleDelta - Damage to morale (negative)
 * @param {string} context - Recent text for death classification
 * @returns {object} { prevented, newHealth, newMorale, deathType, skillCheck }
 */
export function checkForDeath(currentHealth, currentMorale, healthDelta, moraleDelta, context = '') {
    const newHealth = currentHealth + healthDelta;
    const newMorale = currentMorale + moraleDelta;
    
    // Check if this would cause death
    const wouldKillHealth = healthDelta < 0 && newHealth <= 0;
    const wouldKillMorale = moraleDelta < 0 && newMorale <= 0;
    
    if (!wouldKillHealth && !wouldKillMorale) {
        // No death, proceed normally
        return {
            prevented: false,
            newHealth: Math.max(0, newHealth),
            newMorale: Math.max(0, newMorale),
            deathType: null,
            skillCheck: null
        };
    }
    
    // Determine death type
    const isMoraleDeath = wouldKillMorale && !wouldKillHealth;
    const deathType = classifyDeath(context, isMoraleDeath);
    
    // Attempt skill check
    const skillCheck = attemptDeathSave(deathType.skill, 10);
    
    if (skillCheck.success) {
        // CLOSE CALL - survive at 1
        showCloseCallToast(skillCheck, isMoraleDeath);
        
        return {
            prevented: true,
            newHealth: wouldKillHealth ? 1 : Math.max(0, newHealth),
            newMorale: wouldKillMorale ? 1 : Math.max(0, newMorale),
            deathType,
            skillCheck
        };
    }
    
    // DEATH - show game over
    lastDeathContext = context;
    triggerDeath(deathType, isMoraleDeath, context);
    
    return {
        prevented: false,
        newHealth: 0,
        newMorale: isMoraleDeath ? 0 : Math.max(0, newMorale),
        deathType,
        skillCheck
    };
}

/**
 * Show close call toast
 */
function showCloseCallToast(skillCheck, isMoraleDeath) {
    if (typeof toastr === 'undefined') return;
    
    const skillNames = {
        endurance: 'ENDURANCE',
        volition: 'VOLITION',
        physical_instrument: 'PHYSICAL INSTRUMENT',
        electrochemistry: 'ELECTROCHEMISTRY',
        shivers: 'SHIVERS',
        composure: 'COMPOSURE',
        inland_empire: 'INLAND EMPIRE',
        empathy: 'EMPATHY'
    };
    
    const skillName = skillNames[skillCheck.skill] || skillCheck.skill.toUpperCase();
    const vital = isMoraleDeath ? 'Morale' : 'Health';
    
    toastr.warning(
        `[${skillCheck.die1}+${skillCheck.die2}]+${skillCheck.skillLevel}+${skillCheck.modifier} = ${skillCheck.total} vs ${skillCheck.difficulty}`,
        `${skillName} [Success] - ${vital} saved!`,
        { timeOut: 5000 }
    );
}

// ═══════════════════════════════════════════════════════════════
// DEATH SCREEN (Périphérique Newspaper)
// ═══════════════════════════════════════════════════════════════

/**
 * Trigger the death screen
 */
async function triggerDeath(deathType, isMoraleDeath, context) {
    if (isShowingDeathScreen) return;
    isShowingDeathScreen = true;
    
    // Get headline
    const headline = getRandomHeadline(deathType);
    
    // Try to generate article via AI
    let article = await generateDeathArticle(headline, deathType, isMoraleDeath, context);
    
    // Show the newspaper
    showDeathScreen(headline, article, isMoraleDeath);
}

/**
 * Generate death article via AI
 */
async function generateDeathArticle(headline, deathType, isMoraleDeath, context) {
    // Default article if AI fails
    const defaultArticle = isMoraleDeath 
        ? "Sources close to the investigation report that the individual's mental state had been deteriorating for some time. \"We all saw it coming,\" said one acquaintance who wished to remain anonymous."
        : "Authorities have declined to comment on the circumstances. An investigation is reportedly underway.";
    
    try {
        // Try to get AI extractor for API access
        const apiModule = await import('../voice/api-helpers.js').catch(() => null);
        const callAPI = apiModule?.callAPIWithTokens || apiModule?.callAPI;
        
        if (!callAPI) {
            console.warn('[Death] No API available for article generation');
            return defaultArticle;
        }
        
        const systemPrompt = `You are writing a brief, somber newspaper article about a ${isMoraleDeath ? 'mental breakdown or disappearance' : 'death'}. Write 2-3 short paragraphs. Be darkly atmospheric and melancholic. Include a quote from a colleague, witness, or acquaintance. Keep it under 120 words. Do NOT use markdown formatting like asterisks or headers. Write plain prose only.`;
        
        const userPrompt = `Write a newspaper article with this headline: "${headline}"

Recent context: ${context.substring(0, 400)}

Write 2-3 paragraphs that:
- Reference details from the context if relevant
- Include one quote from someone who knew them
- Stay atmospheric and somber
- Do NOT include any markdown, asterisks, or formatting
- Do NOT repeat the headline or newspaper name in the body`;

        const response = await (apiModule.callAPIWithTokens 
            ? callAPI(systemPrompt, userPrompt, 350)
            : callAPI(systemPrompt, userPrompt));
        
        if (response && response.length > 50) {
            // Strip any markdown formatting the AI might have added
            let cleaned = response.trim()
                .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
                .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
                .replace(/__([^_]+)__/g, '$1')      // Remove __bold__
                .replace(/_([^_]+)_/g, '$1')        // Remove _italic_
                .replace(/^#+\s*/gm, '')            // Remove # headers
                .replace(/^[-*]\s+/gm, '')          // Remove bullet points
                .replace(/^\d+\.\s+/gm, '');        // Remove numbered lists
            
            return cleaned;
        }
        
    } catch (e) {
        console.warn('[Death] Article generation failed:', e);
    }
    
    return defaultArticle;
}

/**
 * Create and show the death screen overlay
 */
function showDeathScreen(headline, article, isMoraleDeath) {
    // Create overlay if needed
    if (!deathOverlay) {
        deathOverlay = document.createElement('div');
        deathOverlay.id = 'tribunal-death-overlay';
        deathOverlay.className = 'tribunal-death-overlay';
        document.body.appendChild(deathOverlay);
    }
    
    // Build newspaper HTML
    deathOverlay.innerHTML = `
        <div class="death-newspaper">
            <div class="death-newspaper-texture"></div>
            
            <header class="death-newspaper-header">
                <div class="death-masthead">PÉRIPHÉRIQUE</div>
            </header>
            
            <main class="death-newspaper-content">
                <h1 class="death-headline">${headline}</h1>
                <div class="death-article">${article.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}</div>
            </main>
            
            <footer class="death-newspaper-footer">
                <button class="death-end-btn" id="death-end-btn">
                    <span>END</span>
                    <span class="death-end-cursor">■</span>
                </button>
            </footer>
        </div>
    `;
    
    // Show with animation
    deathOverlay.classList.add('active');
    
    // Play death sound if available
    window.dispatchEvent(new CustomEvent('tribunal:deathScreen', { 
        detail: { isMoraleDeath } 
    }));
    
    // Bind end button
    const endBtn = document.getElementById('death-end-btn');
    endBtn?.addEventListener('click', dismissDeathScreen);
    
    // Also allow clicking anywhere after delay
    setTimeout(() => {
        deathOverlay.addEventListener('click', dismissDeathScreen, { once: true });
    }, 2000);
}

/**
 * Dismiss death screen and reset vitals
 */
function dismissDeathScreen() {
    if (!deathOverlay) return;
    
    deathOverlay.classList.remove('active');
    isShowingDeathScreen = false;
    
    // Reset vitals to 50%
    try {
        const { getChatState, saveChatState } = window.TribunalState || {};
        if (getChatState && saveChatState) {
            const state = getChatState();
            if (state.vitals) {
                state.vitals.health = Math.ceil(state.vitals.maxHealth * 0.5);
                state.vitals.morale = Math.ceil(state.vitals.maxMorale * 0.5);
                saveChatState();
                
                // Update displays
                window.dispatchEvent(new CustomEvent('tribunal:vitalsChanged', {
                    detail: {
                        health: state.vitals.health,
                        maxHealth: state.vitals.maxHealth,
                        morale: state.vitals.morale,
                        maxMorale: state.vitals.maxMorale
                    }
                }));
            }
        }
    } catch (e) {
        console.warn('[Death] Could not reset vitals:', e);
    }
    
    // Toast resurrection message
    if (typeof toastr !== 'undefined') {
        toastr.info('You pull yourself back from the edge. Somehow.', 'Resurrection', { timeOut: 3000 });
    }
    
    console.log('[Death] Screen dismissed, vitals reset to 50%');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize death handler
 * Injects CSS for death screen
 */
export function initDeathHandler() {
    // Inject CSS if not already present
    if (!document.getElementById('tribunal-death-css')) {
        const style = document.createElement('style');
        style.id = 'tribunal-death-css';
        style.textContent = DEATH_CSS;
        document.head.appendChild(style);
    }
    
    console.log('[Death Handler] Initialized');
}

// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════

const DEATH_CSS = `
/* Death Screen Overlay */
.tribunal-death-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.8s ease, background 0.8s ease;
}

.tribunal-death-overlay.active {
    pointer-events: auto;
    opacity: 1;
    background: rgba(0, 0, 0, 0.9);
}

/* Newspaper - COMPACT */
.death-newspaper {
    position: relative;
    width: 85%;
    max-width: 480px;
    max-height: 80vh;
    overflow-y: auto;
    background: #1a1a1a;
    border: 1px solid #444;
    padding: 1.25rem;
    transform: scale(0.9);
    opacity: 0;
    transition: transform 0.4s ease, opacity 0.4s ease;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
}

.tribunal-death-overlay.active .death-newspaper {
    transform: scale(1);
    opacity: 1;
    transition-delay: 0.2s;
}

/* Paper texture overlay */
.death-newspaper-texture {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.015) 2px,
            rgba(255, 255, 255, 0.015) 4px
        );
    pointer-events: none;
    opacity: 0.5;
}

/* Masthead - COMPACT */
.death-newspaper-header {
    text-align: center;
    border-bottom: 2px solid #444;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
}

.death-masthead {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 1.6rem;
    font-weight: bold;
    letter-spacing: 0.25em;
    color: #d4c5a9;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

/* Content - COMPACT */
.death-newspaper-content {
    color: #d4c5a9;
}

.death-headline {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 1.3rem;
    font-weight: bold;
    text-align: center;
    line-height: 1.25;
    margin-bottom: 1rem;
    color: #fff;
    text-transform: uppercase;
    border-bottom: 1px solid #555;
    padding-bottom: 0.75rem;
}

.death-article {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #bbb;
    text-align: justify;
}

.death-article p {
    margin-bottom: 0.75rem;
    text-indent: 1em;
}

.death-article p:first-child {
    text-indent: 0;
}

.death-article p:last-child {
    margin-bottom: 0;
}

/* Footer / End Button - COMPACT */
.death-newspaper-footer {
    margin-top: 1rem;
    text-align: center;
    border-top: 1px solid #444;
    padding-top: 1rem;
}

.death-end-btn {
    background: #8B0000;
    border: none;
    color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.6rem 2.5rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: background 0.2s, transform 0.1s;
}

.death-end-btn:hover {
    background: #a00;
    transform: scale(1.02);
}

.death-end-btn:active {
    transform: scale(0.98);
}

.death-end-cursor {
    animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

/* Mobile adjustments */
@media (max-width: 500px) {
    .death-newspaper {
        padding: 1rem;
        width: 92%;
    }
    
    .death-masthead {
        font-size: 1.3rem;
        letter-spacing: 0.15em;
    }
    
    .death-headline {
        font-size: 1.1rem;
    }
    
    .death-article {
        font-size: 0.85rem;
    }
    
    .death-end-btn {
        padding: 0.5rem 2rem;
        font-size: 0.9rem;
    }
}
`;

// ═══════════════════════════════════════════════════════════════
// TEST / DEBUG FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Test death screen with a specific type
 * @param {string} type - 'health' or 'morale' or specific type like 'cardiac', 'breakdown'
 * @param {string} customContext - Optional custom context for AI article generation
 */
export function testDeathScreen(type = 'health', customContext = '') {
    const testContexts = {
        // Health deaths
        cardiac: "Your heart pounds erratically. The years of abuse have caught up. You clutch your chest as the world spins.",
        violence: "The bullet tears through your shoulder. Blood sprays across the wall. You collapse against the filing cabinet.",
        overdose: "The room tilts. You've had too much. Way too much. The empty bottles mock you from the floor.",
        environmental: "The canal water is freezing. Your limbs stop responding. The current pulls you under.",
        
        // Morale deaths
        breakdown: "You can't stop crying. In the middle of the street. People are staring. You don't care anymore.",
        humiliation: "They're all laughing. The whole precinct. Your career is over. Your reputation is garbage.",
        existential: "What's the point? Of any of this? The case, the job, existence itself? Nothing matters.",
        rejection: "She's gone. They're all gone. Nobody came to help. Nobody ever will. You are completely alone."
    };
    
    // Determine death type
    let isMoraleDeath = false;
    let deathType = null;
    let context = customContext;
    
    if (type === 'health') {
        // Random health death
        const healthTypes = ['cardiac', 'violence', 'overdose', 'environmental'];
        const randomType = healthTypes[Math.floor(Math.random() * healthTypes.length)];
        deathType = { key: randomType, ...DEATH_TYPES[randomType] };
        context = context || testContexts[randomType];
        isMoraleDeath = false;
    } else if (type === 'morale') {
        // Random morale death
        const moraleTypes = ['breakdown', 'humiliation', 'existential', 'rejection'];
        const randomType = moraleTypes[Math.floor(Math.random() * moraleTypes.length)];
        deathType = { key: randomType, ...DEATH_TYPES[randomType] };
        context = context || testContexts[randomType];
        isMoraleDeath = true;
    } else if (DEATH_TYPES[type]) {
        // Specific type requested
        deathType = { key: type, ...DEATH_TYPES[type] };
        context = context || testContexts[type] || "Test death scenario.";
        isMoraleDeath = !!DEATH_TYPES[type].isMorale;
    } else {
        console.warn('[Death Test] Unknown type:', type);
        console.log('Available types: health, morale, cardiac, violence, overdose, environmental, breakdown, humiliation, existential, rejection');
        return;
    }
    
    console.log(`[Death Test] Triggering ${deathType.key} death (${isMoraleDeath ? 'morale' : 'health'})`);
    
    // Trigger death screen directly
    triggerDeath(deathType, isMoraleDeath, context);
    
    return { type: deathType.key, isMoraleDeath, context };
}

/**
 * Test skill check without triggering death
 * @param {string} skillId - Skill to test
 * @param {number} difficulty - Check difficulty
 */
export function testSkillCheck(skillId = 'endurance', difficulty = 10) {
    const result = attemptDeathSave(skillId, difficulty);
    
    const msg = `${skillId.toUpperCase()}: [${result.die1}+${result.die2}] + ${result.skillLevel} + ${result.modifier} = ${result.total} vs ${difficulty}`;
    
    if (typeof toastr !== 'undefined') {
        if (result.success) {
            toastr.success(msg, 'Skill Check PASSED');
        } else {
            toastr.error(msg, 'Skill Check FAILED');
        }
    }
    
    console.log('[Death Test] Skill check:', result);
    return result;
}

/**
 * Test close call (skill check that saves from death)
 */
export function testCloseCall() {
    // Temporarily force a success
    const result = {
        success: true,
        die1: 6,
        die2: 5,
        roll: 11,
        skillLevel: 3,
        modifier: 0,
        total: 14,
        difficulty: 10,
        skill: 'endurance'
    };
    
    showCloseCallToast(result, false);
    console.log('[Death Test] Close call toast shown');
    return result;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    checkForDeath,
    initDeathHandler,
    classifyDeath,
    attemptDeathSave,
    // Test functions
    testDeathScreen,
    testSkillCheck,
    testCloseCall
};

// Global access
window.TribunalDeath = {
    checkForDeath,
    init: initDeathHandler,
    // Test functions for console access
    test: testDeathScreen,
    testSkill: testSkillCheck,
    testCloseCall
};
