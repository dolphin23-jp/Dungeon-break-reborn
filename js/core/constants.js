export const CONFIG = {
  storageKey: 'dungeonBreakReborn.phase6.save',
  arena: { width: 960, height: 620 },
  player: { radius: 16, baseHp: 120, baseSpeed: 250, baseDamage: 13, baseAttackSpeed: 1.18, baseRange: 195 },
  xp: { base: 12, growth: 1.22 },
  wave: { duration: 28, bossEvery: 5, maxEnemiesBase: 54 },
  inventory: { maxItems: 160 },
  debug: { stones: 100000 },
};

export const RARITIES = {
  Common: { mult: 1, color: '#aab4c5', order: 1 },
  Rare: { mult: 1.45, color: '#4fb7ff', order: 2 },
  Epic: { mult: 2.1, color: '#b36bff', order: 3 },
  Legendary: { mult: 3.2, color: '#ffd36e', order: 4 },
  Mythic: { mult: 5, color: '#ff6ec7', order: 5 },
  Abyssal: { mult: 8, color: '#69ffe7', order: 6 },
};

export const EQUIPMENT_SLOTS = ['武器','防具','指輪','首飾り','レリック','靴','手袋','魔導書','召喚具'];

export const GAME_STATE = { TITLE:'title', META:'meta', RUNNING:'running', LEVELUP:'levelup', PAUSED:'paused', GAMEOVER:'gameover' };
