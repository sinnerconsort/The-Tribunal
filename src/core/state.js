/**
 * The Tribunal - State Management
 * src/core/state.js
 * 
 * Central state - imports NOTHING from src/
 */

export let extensionSettings = {
    enabled: true,
    autoTrigger: true,
    triggerDelay: 1000,
    maxTokens: 400,
    connectionProfile: 'current',
    fabPositionTop: 140,
    fabPositionLeft: 10
};

export let activeStatuses = new Set();
export let currentBuild = null;
export let savedProfiles = {};
export let themeCounters = {};
export let thoughtCabinet = { discovered: [], researching: {}, internalized: [], dismissed: [] };
export let discoveryContext = { lastNarrator: null, investigationCount: 0 };
export let vitals = { health: 13, maxHealth: 13, morale: 13, maxMorale: 13 };
export let ledger = { cases: [], fortune: null, compartmentDiscovered: false };
export let inventory = { money: 0, items: [] };
export let playerContext = { name: '', pronouns: 'they/them', copotype: null };

const SETTINGS_KEY = 'tribunal_settings';
function getChatKey(ctx) { return ctx?.chatId ? `tribunal_chat_${ctx.chatId}` : null; }

export async function loadState(getContext) {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) Object.assign(extensionSettings, JSON.parse(saved));
    } catch (e) { console.warn('[Tribunal] Load settings failed:', e); }
    
    const ctx = typeof getContext === 'function' ? getContext() : getContext;
    const key = getChatKey(ctx);
    if (key) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const p = JSON.parse(data);
                if (p.vitals) Object.assign(vitals, p.vitals);
                if (p.activeStatuses) activeStatuses = new Set(p.activeStatuses);
                if (p.currentBuild) currentBuild = p.currentBuild;
                if (p.thoughtCabinet) Object.assign(thoughtCabinet, p.thoughtCabinet);
                if (p.ledger) Object.assign(ledger, p.ledger);
                if (p.inventory) Object.assign(inventory, p.inventory);
                if (p.playerContext) Object.assign(playerContext, p.playerContext);
                if (p.themeCounters) themeCounters = p.themeCounters;
            }
        } catch (e) { console.warn('[Tribunal] Load chat state failed:', e); }
    }
}

export function saveState(ctx) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(extensionSettings));
    const key = getChatKey(ctx);
    if (key) {
        localStorage.setItem(key, JSON.stringify({
            vitals, activeStatuses: [...activeStatuses], currentBuild,
            thoughtCabinet, ledger, inventory, playerContext, themeCounters
        }));
    }
}

export function getVitals() { return { ...vitals }; }
export function setHealth(v, ctx) { vitals.health = Math.max(0, Math.min(v, vitals.maxHealth)); saveState(ctx); }
export function modifyHealth(d, ctx) { setHealth(vitals.health + d, ctx); }
export function setMorale(v, ctx) { vitals.morale = Math.max(0, Math.min(v, vitals.maxMorale)); saveState(ctx); }
export function modifyMorale(d, ctx) { setMorale(vitals.morale + d, ctx); }
export function getDiscoveredThoughts() { return [...thoughtCabinet.discovered]; }
export function addDiscoveredThought(t) { thoughtCabinet.discovered.push(t); }
export function getThemeCounters() { return { ...themeCounters }; }
export function getPlayerContext() { return { ...playerContext }; }
export function savePlayerContext(p, ctx) { Object.assign(playerContext, p); saveState(ctx); }
export function getEffectiveSkillLevel(id) { return currentBuild?.[id] || 1; }
export function updateSettings(u, ctx) { Object.assign(extensionSettings, u); saveState(ctx); }
export function isEnabled() { return extensionSettings.enabled; }
