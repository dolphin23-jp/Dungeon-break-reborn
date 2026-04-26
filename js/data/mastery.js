export const MASTERY_MAX_LEVEL = 30;

export const MASTERY_REWARD_TABLE = {
  2: { id: 'favoredTagBoost', name: '得意カテゴリ出現率アップ', value: 0.06 },
  3: { id: 'startStonesBonus', name: '探索開始時 深淵石ボーナス', value: 0.08 },
  5: { id: 'startSkillLevelBonus', name: '初期スキル Lv+1', value: 1 },
  7: { id: 'specialDamageBonus', name: '専用カテゴリダメージアップ', value: 0.1 },
  10: { id: 'evolutionEase', name: '専用進化条件緩和', value: 1 },
  12: { id: 'startRerollBonus', name: '初期リロール +1', value: 1 },
  15: { id: 'characterPassiveBoost', name: '固有パッシブ強化', value: 1 },
  20: { id: 'advancedEvolutionUnlock', name: '専用進化強化版解放', value: 1 },
  25: { id: 'highRaritySkillBoost', name: '高レアスキル出現率アップ', value: 0.08 },
  30: { id: 'masterTitle', name: 'マスター称号', value: 1 },
};

export function masteryExpForLevel(level) {
  if (level <= 1) return 0;
  const n = level - 1;
  return Math.floor(24 * n + 18 * n * n + Math.pow(n, 2.35) * 7);
}

export function totalMasteryExpToLevel(level) {
  let total = 0;
  for (let lv = 2; lv <= level; lv++) total += masteryExpForLevel(lv);
  return total;
}

export function calculateMasteryLevel(exp = 0) {
  let level = 1;
  let remain = Math.max(0, Math.floor(exp));
  while (level < MASTERY_MAX_LEVEL) {
    const need = masteryExpForLevel(level + 1);
    if (remain < need) break;
    remain -= need;
    level++;
  }
  const nextNeed = level >= MASTERY_MAX_LEVEL ? 0 : masteryExpForLevel(level + 1);
  return { level, currentInLevel: remain, nextNeed };
}

export function getUnlockedMasteryRewards(level = 1) {
  return Object.entries(MASTERY_REWARD_TABLE)
    .filter(([lv]) => Number(lv) <= level)
    .map(([, reward]) => reward.id);
}

export function summarizeMasteryRewards(level = 1) {
  return Object.entries(MASTERY_REWARD_TABLE)
    .filter(([lv]) => Number(lv) <= level)
    .map(([lv, reward]) => `Lv${lv}: ${reward.name}`);
}

export function getMasteryBonuses(characterMastery = {}) {
  const level = characterMastery.masteryLevel || 1;
  const rewards = new Set(characterMastery.unlockedMasteryRewards || getUnlockedMasteryRewards(level));
  return {
    favoredTagBoost: rewards.has('favoredTagBoost') ? (MASTERY_REWARD_TABLE[2].value || 0) : 0,
    startStoneRate: rewards.has('startStonesBonus') ? (MASTERY_REWARD_TABLE[3].value || 0) : 0,
    startSkillLevelBonus: rewards.has('startSkillLevelBonus') ? 1 : 0,
    specialDamageBonus: rewards.has('specialDamageBonus') ? (MASTERY_REWARD_TABLE[7].value || 0) : 0,
    evolutionEase: rewards.has('evolutionEase') ? 1 : 0,
    startRerollBonus: rewards.has('startRerollBonus') ? 1 : 0,
    passiveBoost: rewards.has('characterPassiveBoost') ? 1 : 0,
    advancedEvolutionUnlock: rewards.has('advancedEvolutionUnlock') ? 1 : 0,
    highRaritySkillBoost: rewards.has('highRaritySkillBoost') ? (MASTERY_REWARD_TABLE[25].value || 0) : 0,
    masterTitle: rewards.has('masterTitle'),
  };
}

export function calcMasteryExpGain({ wave = 1, depth = 1, bossKills = 0, result = 'gameover', challengeRewardMultiplier = 1 }) {
  const waveTerm = 24 + wave * 5.5;
  const depthTerm = 18 + depth * 18;
  const bossTerm = bossKills * 28;
  const resultBonus = result === 'return' ? 40 : 24;
  const challengeTerm = Math.max(1, challengeRewardMultiplier || 1);
  return Math.max(10, Math.floor((waveTerm + depthTerm + bossTerm + resultBonus) * challengeTerm));
}
