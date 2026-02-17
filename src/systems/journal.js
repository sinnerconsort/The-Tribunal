/**
 * The Tribunal - Journal System
 * 
 * Compiles data from contacts, cases, locations, inventory, and chat
 * into a genre-narrated journal entry. Caches results and tracks staleness.
 * 
 * @module journal
 * @version 1.0.0
 */

import { getNarrator } from '../data/journal-narrators.js';
import { getActiveProfileId } from '../data/setting-profiles.js';
import { getSettings, getChatState, getVitals } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════

/**
 * Journal cache stored per-chat in the chat state.
 * Shape: {
 *   content: string (rendered HTML),
 *   narrative: string (raw AI text),
 *   generatedAt: number (timestamp),
 *   messageCountAtGen: number,
 *   genreAtGen: string,
 *   sections: { contacts: string, cases: string, locations: string, inventory: string }
 * }
 */

function getJournalCache() {
    const state = getChatState();
    return state?.journal || null;
}

function setJournalCache(cache) {
    const state = getChatState();
    if (!state) return;
    state.journal = cache;
}

/**
 * Check if the journal is stale (new events since last generation)
 * @returns {{ stale: boolean, reason: string|null }}
 */
export function checkStaleness() {
    const cache = getJournalCache();
    if (!cache) return { stale: true, reason: 'never_generated' };
    
    const state = getChatState();
    if (!state) return { stale: true, reason: 'no_state' };
    
    // Check message count
    const currentMessages = state._messageCount || 0;
    if (currentMessages > (cache.messageCountAtGen || 0)) {
        return { stale: true, reason: 'new_messages' };
    }
    
    // Check genre change
    const currentGenre = getActiveProfileId() || 'generic';
    if (currentGenre !== cache.genreAtGen) {
        return { stale: true, reason: 'genre_changed' };
    }
    
    return { stale: false, reason: null };
}

/**
 * Get cached journal content if available
 * @returns {{ content: string, narrative: string, stale: boolean, narrator: object }|null}
 */
export function getCachedJournal() {
    const cache = getJournalCache();
    if (!cache?.content) return null;
    
    const { stale } = checkStaleness();
    const genreId = cache.genreAtGen || 'generic';
    
    return {
        content: cache.content,
        narrative: cache.narrative,
        sections: cache.sections || {},
        stale,
        narrator: getNarrator(genreId),
        generatedAt: cache.generatedAt
    };
}

// ═══════════════════════════════════════════════════════════════
// DATA GATHERING
// ═══════════════════════════════════════════════════════════════

/**
 * Compile all game state into a data summary for the AI
 * @returns {object} compiled data
 */
function gatherJournalData() {
    const state = getChatState() || {};
    const vitals = getVitals() || {};
    
    // Contacts
    const contacts = Object.values(state.contacts || state.relationships || {})
        .filter(c => c && c.name)
        .map(c => ({
            name: c.name,
            disposition: c.disposition || 'neutral',
            description: c.description || '',
            context: c.context || ''
        }));
    
    // Cases/Quests
    const activeCases = (state.ledger?.cases || [])
        .filter(c => c.status === 'open' || c.status === 'active');
    const closedCases = (state.ledger?.cases || [])
        .filter(c => c.status === 'closed' || c.status === 'complete');
    
    // Locations
    const locations = (state.ledger?.locations || [])
        .filter(l => l && l.name);
    const currentLocation = state.currentLocation || null;
    
    // Inventory
    const inventory = (state.inventory?.carried || [])
        .filter(i => i && i.name);
    
    // Equipment
    const equipment = (state.equipment?.items || [])
        .filter(e => e && e.name);
    
    // Recent chat context (last few messages for narrative flavor)
    let recentContext = '';
    try {
        const ctx = window.SillyTavern?.getContext?.() ||
                    (typeof getContext === 'function' ? getContext() : null);
        if (ctx?.chat?.length > 0) {
            const recent = ctx.chat.slice(-6); // last 6 messages
            recentContext = recent
                .filter(m => m.mes)
                .map(m => m.is_user ? `[Player]: ${m.mes.substring(0, 200)}` : `[Story]: ${m.mes.substring(0, 300)}`)
                .join('\n');
        }
    } catch { /* silent */ }
    
    return {
        contacts,
        activeCases,
        closedCases,
        locations,
        currentLocation,
        inventory,
        equipment,
        health: vitals.health ?? null,
        morale: vitals.morale ?? null,
        recentContext,
        hasData: contacts.length > 0 || activeCases.length > 0 || 
                 locations.length > 0 || inventory.length > 0
    };
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the journal generation prompt
 * @param {object} data - from gatherJournalData()
 * @param {object} narrator - from getNarrator()
 * @returns {{ system: string, user: string }}
 */
function buildJournalPrompt(data, narrator) {
    const system = `You are ${narrator.name} — a journal/chronicle narrator for a roleplay game.

${narrator.personality}

You will receive game state data (contacts, quests, locations, inventory) and recent story context.
Write a journal entry with TWO parts:

PART 1 — NARRATIVE INTRO (2-4 paragraphs)
A flowing narrative summary of recent events, written entirely in your narrator voice.
Ground it in the actual story context and data provided. Don't just list things — tell the story.

PART 2 — STRUCTURED SECTIONS
After the narrative, provide structured summaries using these exact section headers 
(wrapped in double brackets):

[[${narrator.contactsLabel}]] — Brief note on each known contact and their relationship
[[${narrator.casesLabel}]] — Status of active and recently closed objectives
[[${narrator.locationsLabel}]] — Known locations with brief descriptions
[[${narrator.inventoryLabel}]] — Notable items being carried

Write each section in your narrator voice. If a section has no data, write a brief 
in-character note about having nothing to report.

Keep the total response under 800 tokens. Be vivid but concise.`;

    // Build user prompt with actual data
    const parts = [];
    
    if (data.recentContext) {
        parts.push(`RECENT STORY CONTEXT:\n${data.recentContext}`);
    }
    
    if (data.contacts.length > 0) {
        const contactList = data.contacts.map(c => 
            `- ${c.name} [${c.disposition}]: ${c.description || c.context || 'No details'}`
        ).join('\n');
        parts.push(`KNOWN CONTACTS:\n${contactList}`);
    } else {
        parts.push('KNOWN CONTACTS: None');
    }
    
    if (data.activeCases.length > 0) {
        const caseList = data.activeCases.map(c => 
            `- ${c.title}: ${c.description || 'No details'}`
        ).join('\n');
        parts.push(`ACTIVE QUESTS/CASES:\n${caseList}`);
    } else {
        parts.push('ACTIVE QUESTS/CASES: None');
    }
    
    if (data.closedCases.length > 0) {
        const closedList = data.closedCases.map(c => 
            `- ${c.title} [COMPLETED]: ${c.resolution || ''}`
        ).join('\n');
        parts.push(`COMPLETED:\n${closedList}`);
    }
    
    if (data.locations.length > 0) {
        const locList = data.locations.map(l => 
            `- ${l.name}${l.district ? ` (${l.district})` : ''}: ${l.description || ''}`
        ).join('\n');
        const current = data.currentLocation ? `\nCurrently at: ${data.currentLocation}` : '';
        parts.push(`KNOWN LOCATIONS:${current}\n${locList}`);
    } else {
        parts.push('KNOWN LOCATIONS: None discovered');
    }
    
    const allItems = [
        ...data.equipment.map(e => `- [WORN] ${e.name}`),
        ...data.inventory.map(i => `- ${i.name}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`)
    ];
    if (allItems.length > 0) {
        parts.push(`ITEMS:\n${allItems.join('\n')}`);
    } else {
        parts.push('ITEMS: Nothing notable');
    }
    
    if (data.health !== null || data.morale !== null) {
        parts.push(`CONDITION: Health ${data.health ?? '?'}/20, Morale ${data.morale ?? '?'}/20`);
    }
    
    return {
        system,
        user: `Write a journal entry based on this game state:\n\n${parts.join('\n\n')}`
    };
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

let _generating = false;

/**
 * Generate a fresh journal entry
 * @param {function} onProgress - optional callback for loading state
 * @returns {Promise<{ success: boolean, content: string, error?: string }>}
 */
export async function generateJournal(onProgress) {
    if (_generating) {
        return { success: false, error: 'Generation already in progress' };
    }
    
    _generating = true;
    onProgress?.('gathering');
    
    try {
        const genreId = getActiveProfileId() || 'generic';
        const narrator = getNarrator(genreId);
        const data = gatherJournalData();
        
        if (!data.hasData && !data.recentContext) {
            // Nothing to journal about — return empty state
            const emptyContent = renderJournalHTML(narrator, null, {});
            setJournalCache({
                content: emptyContent,
                narrative: '',
                generatedAt: Date.now(),
                messageCountAtGen: getChatState()?._messageCount || 0,
                genreAtGen: genreId,
                sections: {}
            });
            _generating = false;
            return { success: true, content: emptyContent, empty: true };
        }
        
        onProgress?.('generating');
        
        // Build prompt and call API
        const { system, user } = buildJournalPrompt(data, narrator);
        
        let callAPIFn;
        try {
            const apiModule = await import('../voice/api-helpers.js');
            callAPIFn = apiModule.callAPIWithTokens || apiModule.callAPI;
        } catch {
            _generating = false;
            return { success: false, error: 'API not available' };
        }
        
        const response = await callAPIFn(system, user, 1000);
        
        if (!response) {
            _generating = false;
            return { success: false, error: 'No response from API' };
        }
        
        onProgress?.('parsing');
        
        // Parse response into narrative + sections
        const parsed = parseJournalResponse(response, narrator);
        
        // Render to HTML
        const content = renderJournalHTML(narrator, parsed.narrative, parsed.sections);
        
        // Cache it
        const state = getChatState();
        setJournalCache({
            content,
            narrative: parsed.narrative,
            generatedAt: Date.now(),
            messageCountAtGen: state?._messageCount || 0,
            genreAtGen: genreId,
            sections: parsed.sections
        });
        
        _generating = false;
        return { success: true, content };
        
    } catch (error) {
        _generating = false;
        console.error('[Tribunal] Journal generation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if generation is in progress
 */
export function isGenerating() {
    return _generating;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Parse AI response into narrative intro + structured sections
 */
function parseJournalResponse(text, narrator) {
    const result = {
        narrative: '',
        sections: {}
    };
    
    // Find all [[SECTION HEADER]] blocks
    const sectionLabels = [
        narrator.contactsLabel,
        narrator.casesLabel,
        narrator.locationsLabel,
        narrator.inventoryLabel
    ];
    
    // Build regex to split on section headers
    const escapedLabels = sectionLabels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const sectionRegex = new RegExp(`\\[\\[(${escapedLabels.join('|')})\\]\\]`, 'gi');
    
    // Find first section marker
    const firstMatch = text.match(sectionRegex);
    
    if (firstMatch) {
        // Everything before first section is the narrative
        const firstIndex = text.search(sectionRegex);
        result.narrative = text.substring(0, firstIndex).trim();
        
        // Split remaining text by section headers
        const remaining = text.substring(firstIndex);
        const parts = remaining.split(sectionRegex);
        
        // parts alternates: ['', label1, content1, label2, content2, ...]
        // Actually the split with capture group returns: [pre, capture1, post1, capture2, post2...]
        for (let i = 1; i < parts.length; i += 2) {
            const label = parts[i]?.trim();
            const content = parts[i + 1]?.trim() || '';
            
            if (label && content) {
                // Map label back to section key
                const key = mapLabelToKey(label, narrator);
                if (key) {
                    result.sections[key] = content;
                }
            }
        }
    } else {
        // No section markers found — treat entire response as narrative
        result.narrative = text.trim();
    }
    
    return result;
}

/**
 * Map a section label back to a standardized key
 */
function mapLabelToKey(label, narrator) {
    const lower = label.toLowerCase();
    const map = {
        [narrator.contactsLabel.toLowerCase()]: 'contacts',
        [narrator.casesLabel.toLowerCase()]: 'cases',
        [narrator.locationsLabel.toLowerCase()]: 'locations',
        [narrator.inventoryLabel.toLowerCase()]: 'inventory'
    };
    return map[lower] || null;
}

// ═══════════════════════════════════════════════════════════════
// HTML RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render journal content as styled HTML
 */
function renderJournalHTML(narrator, narrative, sections) {
    const parts = [];
    
    // Header
    parts.push(`<div class="journal-header">
        <i class="fa-solid ${narrator.icon}"></i>
        <span class="journal-narrator-name">${narrator.name}</span>
    </div>`);
    
    if (!narrative && Object.keys(sections).length === 0) {
        // Empty state
        parts.push(`<div class="journal-empty">
            <p class="journal-empty-quote">${narrator.emptyQuote}</p>
        </div>`);
        return parts.join('\n');
    }
    
    // Narrative intro
    if (narrative) {
        parts.push(`<div class="journal-narrative">
            <div class="journal-section-label">${narrator.introLabel}</div>
            <div class="journal-narrative-text">${formatNarrativeHTML(narrative)}</div>
        </div>`);
    }
    
    // Structured sections
    const sectionOrder = [
        { key: 'cases', label: narrator.casesLabel },
        { key: 'contacts', label: narrator.contactsLabel },
        { key: 'locations', label: narrator.locationsLabel },
        { key: 'inventory', label: narrator.inventoryLabel }
    ];
    
    for (const { key, label } of sectionOrder) {
        const content = sections[key];
        if (content) {
            parts.push(`<div class="journal-section" data-section="${key}">
                <div class="journal-section-label">${label}</div>
                <div class="journal-section-content">${formatNarrativeHTML(content)}</div>
            </div>`);
        }
    }
    
    // Timestamp
    parts.push(`<div class="journal-timestamp">
        Generated ${new Date().toLocaleString()}
    </div>`);
    
    return parts.join('\n');
}

/**
 * Convert plain text narrative to HTML with basic formatting
 */
function formatNarrativeHTML(text) {
    return text
        // Strikethrough ~~text~~
        .replace(/~~(.+?)~~/g, '<s>$1</s>')
        // Bold **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic *text*
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        // Bracket notes [text]
        .replace(/\[([^\]]+)\]/g, '<span class="journal-margin-note">[$1]</span>')
        // Paragraphs
        .split(/\n\n+/)
        .map(p => `<p>${p.trim()}</p>`)
        .join('\n')
        // Line breaks within paragraphs
        .replace(/\n/g, '<br>');
}
