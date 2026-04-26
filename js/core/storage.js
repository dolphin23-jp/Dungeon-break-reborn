import { CONFIG } from './constants.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';

export function defaultSave(){
  const upgrades = {};
  for (const u of UPGRADE_DEFS) upgrades[u.id] = 0;
  return { version:1, abyssStones:0, bestWave:0, totalRuns:0, achievements:{}, upgrades };
}
export function loadSave(){
  try{
    const raw = localStorage.getItem(CONFIG.storageKey);
    const save = raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
    save.upgrades = { ...defaultSave().upgrades, ...(save.upgrades || {}) };
    return save;
  }catch(e){ console.warn('Save load failed', e); return defaultSave(); }
}
export function saveGame(save){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(save)); }
export function addStones(save, amount){ save.abyssStones = Math.max(0, Math.floor(save.abyssStones + amount)); saveGame(save); }
export function exportSave(save){ return btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
export function importSave(text){ return JSON.parse(decodeURIComponent(escape(atob(text)))); }
