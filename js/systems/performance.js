import { clamp } from '../core/utils.js';

export function getEnemyCap(game, hasBoss = false) {
  const s = game.automation?.settings || {};
  const depth = game.depth?.id || 1;
  const wave = game.wave || 1;

  let cap = depth <= 2 ? 84 : depth <= 4 ? 64 : 44;
  cap += Math.min(14, Math.floor(wave / 5) * 2);

  if (s.enemyDensityMode === 'enemyCount') cap *= 1.12;
  if (s.enemyDensityMode === 'lightweight') cap *= 0.75;
  if (s.lightweightMode) cap *= 0.72;
  if (s.speedLightweightMode && game.speedMultiplier >= 3) cap *= 0.85;
  if (game.speedMultiplier >= 5) cap *= 0.62;
  if (hasBoss) cap *= 0.62;

  return Math.floor(clamp(cap, 20, 92));
}

export function getPerformanceProfile(game) {
  const s = game.automation?.settings || {};
  const highSpeed = game.speedMultiplier >= 5;
  const light = !!s.lightweightMode || (s.speedLightweightMode && game.speedMultiplier >= 3);
  return {
    maxProjectiles: highSpeed ? 240 : light ? 340 : 460,
    maxEffects: highSpeed ? 100 : light ? 140 : 220,
    maxPickups: highSpeed ? 90 : light ? 120 : 200,
    reduceDamageText: s.damageNumberMode === 'less' || s.damageNumberMode === 'off' || highSpeed,
    hideDamageText: s.damageNumberMode === 'off',
    directXpMode: highSpeed || (s.autoRunEnabled && s.orbOptimization),
  };
}

export function getEnemyQualityMultiplier(game, cap) {
  const baseTarget = 84;
  const ratio = clamp(baseTarget / Math.max(24, cap), 1, 2.7);
  const depthBonus = 1 + Math.max(0, (game.depth?.id || 1) - 1) * 0.07;
  return ratio * depthBonus;
}
