import { CONFIG, EQUIPMENT_SLOTS } from './constants.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';

export function defaultSave(){
  const upgrades = {};
  for (const u of UPGRADE_DEFS) upgrades[u.id] = 0;
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;
  return { version:2, abyssStones:0, bestWave:0, totalRuns:0, achievements:{}, upgrades, equipment, inventory:[] };
}
export function loadSave(){
  try{
    const raw = localStorage.getItem(CONFIG.storageKey);
    const legacy = localStorage.getItem('dungeonBreakReborn.phase1.save');
    const parsed = raw ? JSON.parse(raw) : legacy ? JSON.parse(legacy) : {};
    const base = defaultSave();
    const save = { ...base, ...parsed, version: 2 };
    save.upgrades = { ...base.upgrades, ...(parsed.upgrades || {}) };
    save.achievements = { ...(parsed.achievements || {}) };
    save.equipment = { ...base.equipment, ...(parsed.equipment || {}) };
    save.inventory = Array.isArray(parsed.inventory) ? parsed.inventory.slice(0, CONFIG.inventory.maxItems) : [];
    return save;
  }catch(e){ console.warn('Save load failed', e); return defaultSave(); }
}
export function saveGame(save){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(save)); }
export function addStones(save, amount){ save.abyssStones = Math.max(0, Math.floor(save.abyssStones + amount)); saveGame(save); }
