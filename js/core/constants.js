export const CONFIG = {
  storageKey: 'dungeonBreakReborn.phase1.save',
  arena: { width: 960, height: 620 },
  player: { radius: 16, baseHp: 110, baseSpeed: 245, baseDamage: 12, baseAttackSpeed: 1.15, baseRange: 185 },
  xp: { base: 12, growth: 1.22 },
  wave: { duration: 26, bossEvery: 5, maxEnemiesBase: 45 },
  debug: { stones: 100000 },
};

export const RARITIES = {
  Common: { mult: 1, color: '#aab4c5' },
  Rare: { mult: 1.45, color: '#4fb7ff' },
  Epic: { mult: 2.1, color: '#b36bff' },
  Legendary: { mult: 3.2, color: '#ffd36e' },
  Mythic: { mult: 5, color: '#ff6ec7' },
  Abyssal: { mult: 8, color: '#69ffe7' },
};

export const GAME_STATE = {
  TITLE: 'title', META: 'meta', RUNNING: 'running', LEVELUP: 'levelup', PAUSED: 'paused', GAMEOVER: 'gameover'
};
