export const CHALLENGES = [
  { id:'none', name:'なし', description:'通常探索', modifiers:{}, rewardMultiplier:1, unlockCondition:null, enabled:true },
  { id:'enemy_surge', name:'敵群増幅', description:'敵出現数 +50%', modifiers:{ enemyCountMultiplier:1.5 }, rewardMultiplier:1.25, unlockCondition:null, enabled:true },
  { id:'hardened_depths', name:'硬質深層', description:'敵HP +80%', modifiers:{ enemyHpMultiplier:1.8 }, rewardMultiplier:1.3, unlockCondition:{ depth:3 }, enabled:true },
  { id:'bullet_hell', name:'魔弾地獄', description:'敵弾量増加', modifiers:{ projectileMultiplier:1.8, enemyCountMultiplier:1.15 }, rewardMultiplier:1.35, unlockCondition:{ depth:4 }, enabled:true },
  { id:'healing_ban', name:'癒し封じ', description:'回復効果 -50%', modifiers:{ healingMultiplier:0.5 }, rewardMultiplier:1.4, unlockCondition:{ depth:3 }, enabled:true },
  { id:'speed_abyss', name:'高速深淵', description:'敵移動速度 +30%', modifiers:{ enemySpeedMultiplier:1.3 }, rewardMultiplier:1.3, unlockCondition:{ depth:2 }, enabled:true },
];

export function getChallengeById(id) {
  return CHALLENGES.find((c) => c.id === id) || CHALLENGES[0];
}

export function isChallengeUnlocked(save, challenge) {
  if (challenge.id === 'none') return true;
  if (!challenge.enabled) return false;
  if (save?.challengeProgress?.unlocked?.[challenge.id]) return true;
  if (!challenge.unlockCondition) return true;
  if (challenge.unlockCondition.depth && (save?.maxDepthStarted || 1) >= challenge.unlockCondition.depth) return true;
  return false;
}

export function availableChallenges(save) {
  return CHALLENGES.filter((c) => isChallengeUnlocked(save, c));
}

export function ensureChallengeProgress(save) {
  save.challengeProgress = save.challengeProgress || { unlocked:{}, cleared:{} };
  if (!save.settings.selectedChallenge) save.settings.selectedChallenge = 'none';
}
