/**
 * The Tribunal - Journal Handlers
 * 
 * Wires generate button, manages stale indicator, loads cached content.
 * Lazy-loads the journal system module on first use.
 * 
 * @module journal-handlers
 * @version 1.0.0
 */

let _journalModule = null;
let _initialized = false;

// ═══════════════════════════════════════════════════════════════
// LAZY LOADING
// ═══════════════════════════════════════════════════════════════

async function getJournalModule() {
    if (_journalModule) return _journalModule;
    try {
        _journalModule = await import('../systems/journal.js');
    } catch (e) {
        console.error('[Tribunal] Failed to load journal module:', e);
        _journalModule = null;
    }
    return _journalModule;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize journal handlers — call after panel DOM is ready
 */
export function initJournal() {
    if (_initialized) return;
    
    const btn = document.getElementById('journal-generate-btn');
    if (!btn) return;
    
    btn.addEventListener('click', handleGenerate);
    
    _initialized = true;
    console.log('[Tribunal] Journal handlers initialized');
}

// ═══════════════════════════════════════════════════════════════
// REFRESH (called when switching to journal tab or after events)
// ═══════════════════════════════════════════════════════════════

/**
 * Refresh journal display — load cache and update stale indicator
 */
export async function refreshJournal() {
    const journal = await getJournalModule();
    if (!journal) return;
    
    const contentEl = document.getElementById('journal-content');
    const staleEl = document.getElementById('journal-stale-banner');
    const staleTextEl = document.getElementById('journal-stale-text');
    
    // Load cached content
    const cached = journal.getCachedJournal();
    
    if (cached?.content) {
        contentEl.innerHTML = cached.content;
        
        // Show/hide stale banner
        if (cached.stale && staleEl) {
            staleEl.style.display = 'flex';
            if (staleTextEl && cached.narrator?.staleLabel) {
                staleTextEl.textContent = cached.narrator.staleLabel;
            }
        } else if (staleEl) {
            staleEl.style.display = 'none';
        }
    }
    
    // Update button text based on state
    const btn = document.getElementById('journal-generate-btn');
    if (btn) {
        const span = btn.querySelector('span');
        if (cached?.content) {
            span.textContent = cached.stale ? 'Update Entry' : 'Regenerate';
        } else {
            span.textContent = 'Write Entry';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function handleGenerate() {
    const journal = await getJournalModule();
    if (!journal) return;
    
    if (journal.isGenerating()) return;
    
    const btn = document.getElementById('journal-generate-btn');
    const contentEl = document.getElementById('journal-content');
    const staleEl = document.getElementById('journal-stale-banner');
    const icon = btn?.querySelector('i');
    const span = btn?.querySelector('span');
    
    // Loading state
    btn?.classList.add('generating');
    btn.disabled = true;
    if (icon) icon.className = 'fa-solid fa-spinner';
    if (span) span.textContent = 'Writing...';
    
    try {
        const result = await journal.generateJournal((stage) => {
            if (span) {
                switch (stage) {
                    case 'gathering': span.textContent = 'Gathering data...'; break;
                    case 'generating': span.textContent = 'Writing...'; break;
                    case 'parsing': span.textContent = 'Formatting...'; break;
                }
            }
        });
        
        if (result.success) {
            contentEl.innerHTML = result.content;
            if (staleEl) staleEl.style.display = 'none';
            
            if (span) span.textContent = 'Regenerate';
        } else {
            // Error state
            if (span) span.textContent = 'Failed — try again';
            console.error('[Tribunal] Journal error:', result.error);
            
            // Show error briefly in content area
            const errorEl = document.createElement('div');
            errorEl.className = 'journal-empty';
            errorEl.innerHTML = `<p class="journal-empty-quote" style="color: #8a4030;">
                Generation failed: ${result.error || 'Unknown error'}
            </p>`;
            contentEl.prepend(errorEl);
            
            // Auto-remove error after 5s
            setTimeout(() => errorEl.remove(), 5000);
        }
        
    } catch (e) {
        console.error('[Tribunal] Journal generation error:', e);
        if (span) span.textContent = 'Error — try again';
    }
    
    // Reset button
    btn?.classList.remove('generating');
    btn.disabled = false;
    if (icon) icon.className = 'fa-solid fa-feather-pointed';
}

// ═══════════════════════════════════════════════════════════════
// STALENESS MARKER
// Called by events.js after processing a new message
// ═══════════════════════════════════════════════════════════════

/**
 * Mark that new events have occurred (increment message counter)
 * This doesn't regenerate — just flags the journal as stale
 */
export function markNewEvents() {
    // The journal system checks _messageCount from chat state,
    // which is already incremented by events.js.
    // We just need to update the stale banner if the journal tab is visible.
    const staleEl = document.getElementById('journal-stale-banner');
    const contentEl = document.getElementById('journal-content');
    
    // Only update if there's existing content (not empty state)
    if (staleEl && contentEl?.querySelector('.journal-header')) {
        staleEl.style.display = 'flex';
    }
}
