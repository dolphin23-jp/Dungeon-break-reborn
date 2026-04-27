import { CONFIG, EQUIPMENT_SLOTS } from './constants.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';
import { DEFAULT_CHARACTER_ID, CHARACTERS } from '../data/characters.js';
import { getUnlockedMasteryRewards, calculateMasteryLevel } from '../data/mastery.js';
import { DEFAULT_AUTOMATION_SETTINGS } from '../systems/automation.js';

const DEFAULT_AUTOMATION_SETTINGS = {
  autoRunEnabled: false,
  skillSelectionMode: 'manual',
  waveRewardMode: 'manual',
  autoReturnEnabled: false,
  autoReturnHpThreshold: 30,
  autoReturnWaveTarget: 20,
  skillAutoPreset: 'balanced',
  waveRewardPreset: 'expFixed',
  lightweightMode: false,
  speedLightweightMode: true,
  damageNumberMode: 'normal',
  orbOptimization: true,
  enemyDensityMode: 'balanced',
  autoLogLimit: 50,
};

function defaultCharacterMastery() {
  return {
    masteryExp: 0,
    masteryLevel: 1,
    highestWave: 0,
    highestDepth: 1,
    totalRuns: 0,
    totalKills: 0,
    totalAbyssStonesEarned: 0,
    discoveredCharacterEvolutions: {},
    unlockedMasteryRewards: [],
  };
}

export function defaultSave() {
  const upgrades = {}; for (const u of UPGRADE_DEFS) upgrades[u.id] = 0;
  const equipment = {}; for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;
  const characterMastery = {};
  for (const c of CHARACTERS) characterMastery[c.id] = defaultCharacterMastery();
  return {
    version: 8,
    abyssStones: 0,
    bestWave: 0,
    totalRuns: 0,
    totalKills: 0,
    totalBossKills: 0,
    lifetimeStones: 0,
    legendaryFound: 0,
    maxDepthStarted: 1,
    achievements: {},
    upgrades,
    equipment,
    inventory: [],
    discoveredEvolutions: {},
    characterStats: {},
    characterMastery,
    depthMissions: {},
    characterMissionRecords: {},
    missionDropRateBonus: 0,
    challengeProgress: { unlocked: {}, cleared: {} },
    settings: {
      selectedDepth: 1,
      autoDismantleRarity: 'None',
      selectedCharacter: DEFAULT_CHARACTER_ID,
      selectedChallenge: 'none',
      automation: { ...DEFAULT_AUTOMATION_SETTINGS },
      lastRunSummary: null,
    },
  };
}

function normalizeItem(item = {}) {
  if (!item || typeof item !== 'object') return null;
  return {
    ...item,
    affixes: Array.isArray(item.affixes) ? item.affixes : [],
    affixPower: Number(item.affixPower || 1),
    itemLevel: Number(item.itemLevel || item.waveFound || 1),
    locked: !!item.locked,
    enhanceLevel: Number(item.enhanceLevel || 0),
    sourceDepth: Number(item.sourceDepth || 1),
    sourceWave: Number(item.sourceWave || item.waveFound || 1),
  };
}

export function normalizeSave(parsed = {}) {
  const base = defaultSave();
  const normalized = {
    ...base,
    ...parsed,
    version: 8,
    upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
    achievements: { ...(parsed.achievements || {}) },
    equipment: { ...base.equipment, ...(parsed.equipment || {}) },
    inventory: Array.isArray(parsed.inventory) ? parsed.inventory.slice(0, CONFIG.inventory.maxItems).map(normalizeItem) : [],
    settings: { ...base.settings, ...(parsed.settings || {}) },
    discoveredEvolutions: { ...(parsed.discoveredEvolutions || {}) },
    characterStats: { ...(parsed.characterStats || {}) },
    depthMissions: { ...(parsed.depthMissions || {}) },
    characterMissionRecords: { ...(parsed.characterMissionRecords || {}) },
    challengeProgress: { ...base.challengeProgress, ...(parsed.challengeProgress || {}) },
    missionDropRateBonus: Number(parsed.missionDropRateBonus || 0),
  };

  const cm = { ...base.characterMastery, ...(parsed.characterMastery || {}) };
  for (const char of CHARACTERS) {
    const current = { ...defaultCharacterMastery(), ...(cm[char.id] || {}) };
    if (current.masteryExp > 0 && (!current.masteryLevel || current.masteryLevel <= 1)) {
      current.masteryLevel = calculateMasteryLevel(current.masteryExp).level;
    }
    current.unlockedMasteryRewards = Array.from(new Set([
      ...(current.unlockedMasteryRewards || []),
      ...getUnlockedMasteryRewards(current.masteryLevel || 1),
    ]));
    cm[char.id] = current;
  }
  normalized.characterMastery = cm;
  normalized.settings.automation = { ...DEFAULT_AUTOMATION_SETTINGS, ...(normalized.settings.automation || {}) };
  normalized.settings.lastRunSummary = normalized.settings.lastRunSummary || null;

  for (const slot of EQUIPMENT_SLOTS) normalized.equipment[slot] = normalizeItem(normalized.equipment[slot]) || null;
  for (const [k, v] of Object.entries(normalized.equipment)) if (!v || !v.id) normalized.equipment[k] = null;

  return normalized;
}

export function loadSave() {
  try {
    const keys = [
      CONFIG.storageKey,
      'dungeonBreakReborn.phase7.save',
      'dungeonBreakReborn.phase6.save',
      'dungeonBreakReborn.phase5.save',
      'dungeonBreakReborn.phase4.save',
      'dungeonBreakReborn.phase3.save',
      'dungeonBreakReborn.phase2.save',
      'dungeonBreakReborn.phase1.save',
    ];
    let parsed = {};
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) { parsed = JSON.parse(raw); break; }
    }
    return normalizeSave(parsed);
  } catch (e) {
    console.warn('Save load failed', e);
    return defaultSave();
  }
}

export function saveGame(save) { localStorage.setItem(CONFIG.storageKey, JSON.stringify(save)); }
export function addStones(save, amount) { save.abyssStones = Math.max(0, Math.floor(save.abyssStones + amount)); save.lifetimeStones = (save.lifetimeStones || 0) + Math.max(0, Math.floor(amount)); saveGame(save); }
export function exportSave(save) { return btoa(unescape(encodeURIComponent(JSON.stringify(normalizeSave(save))))); }
export function importSave(text) { return normalizeSave(JSON.parse(decodeURIComponent(escape(atob(text.trim()))))); }
