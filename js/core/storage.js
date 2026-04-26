import { CONFIG, EQUIPMENT_SLOTS } from './constants.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';

export function defaultSave(){
  const upgrades = {};
  for (const u of UPGRADE_DEFS) upgrades[u.id] = 0;
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;
  return {
    version:5,
    abyssStones:0,
    bestWave:0,
    totalRuns:0,
    totalKills:0,
    totalBossKills:0,
    lifetimeStones:0,
    legendaryFound:0,
    maxDepthStarted:1,
    achievements:{},
    upgrades,
    equipment,
    inventory:[],
    settings:{ selectedDepth:1, autoDismantleRarity:'None' }
  };
}
export function normalizeSave(parsed={}){
  const base = defaultSave();
  return {
    ...base,
    ...parsed,
    version:5,
    upgrades:{ ...base.upgrades, ...(parsed.upgrades || {}) },
    achievements:{ ...(parsed.achievements || {}) },
    equipment:{ ...base.equipment, ...(parsed.equipment || {}) },
    inventory:Array.isArray(parsed.inventory) ? parsed.inventory.slice(0, CONFIG.inventory.maxItems) : [],
    settings:{ ...base.settings, ...(parsed.settings || {}) }
  };
}
export function loadSave(){
  try{
    const raw = localStorage.getItem(CONFIG.storageKey);
    const legacy4 = localStorage.getItem('dungeonBreakReborn.phase4.save');
    const legacy3 = localStorage.getItem('dungeonBreakReborn.phase3.save');
    const legacy2 = localStorage.getItem('dungeonBreakReborn.phase2.save');
    const legacy1 = localStorage.getItem('dungeonBreakReborn.phase1.save');
    const parsed = raw ? JSON.parse(raw) : legacy4 ? JSON.parse(legacy4) : legacy3 ? JSON.parse(legacy3) : legacy2 ? JSON.parse(legacy2) : legacy1 ? JSON.parse(legacy1) : {};
    return normalizeSave(parsed);
  }catch(e){ console.warn('Save load failed', e); return defaultSave(); }
}
export function saveGame(save){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(save)); }
export function addStones(save, amount){ save.abyssStones = Math.max(0, Math.floor(save.abyssStones + amount)); save.lifetimeStones = Math.max(save.lifetimeStones||0, (save.lifetimeStones||0) + Math.max(0, Math.floor(amount))); saveGame(save); }
export function exportSave(save){ return btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
export function importSave(text){ return normalizeSave(JSON.parse(decodeURIComponent(escape(atob(text.trim()))))); }
