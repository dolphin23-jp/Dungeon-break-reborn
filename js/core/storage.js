import { CONFIG, EQUIPMENT_SLOTS } from './constants.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';
import { DEFAULT_CHARACTER_ID } from '../data/characters.js';

export function defaultSave(){
  const upgrades = {}; for (const u of UPGRADE_DEFS) upgrades[u.id] = 0;
  const equipment = {}; for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;
  return {
    version:6, abyssStones:0, bestWave:0, totalRuns:0, totalKills:0, totalBossKills:0, lifetimeStones:0, legendaryFound:0, maxDepthStarted:1,
    achievements:{}, upgrades, equipment, inventory:[], discoveredEvolutions:{}, characterStats:{},
    settings:{ selectedDepth:1, autoDismantleRarity:'None', selectedCharacter:DEFAULT_CHARACTER_ID }
  };
}
export function normalizeSave(parsed={}){
  const base = defaultSave();
  return { ...base, ...parsed, version:6,
    upgrades:{ ...base.upgrades, ...(parsed.upgrades || {}) }, achievements:{ ...(parsed.achievements || {}) }, equipment:{ ...base.equipment, ...(parsed.equipment || {}) },
    inventory:Array.isArray(parsed.inventory) ? parsed.inventory.slice(0, CONFIG.inventory.maxItems) : [], settings:{ ...base.settings, ...(parsed.settings || {}) },
    discoveredEvolutions:{ ...(parsed.discoveredEvolutions||{}) }, characterStats:{ ...(parsed.characterStats||{}) }
  };
}
export function loadSave(){
  try{
    const keys=[CONFIG.storageKey,'dungeonBreakReborn.phase5.save','dungeonBreakReborn.phase4.save','dungeonBreakReborn.phase3.save','dungeonBreakReborn.phase2.save','dungeonBreakReborn.phase1.save'];
    let parsed={};
    for(const k of keys){ const raw=localStorage.getItem(k); if(raw){ parsed=JSON.parse(raw); break; } }
    return normalizeSave(parsed);
  }catch(e){ console.warn('Save load failed', e); return defaultSave(); }
}
export function saveGame(save){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(save)); }
export function addStones(save, amount){ save.abyssStones = Math.max(0, Math.floor(save.abyssStones + amount)); save.lifetimeStones = (save.lifetimeStones||0) + Math.max(0, Math.floor(amount)); saveGame(save); }
export function exportSave(save){ return btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
export function importSave(text){ return normalizeSave(JSON.parse(decodeURIComponent(escape(atob(text.trim()))))); }
