export const DEPTH_MISSIONS = [
  { id:'d1_wave10', depth:1, name:'深度I: Wave10到達', description:'深度IでWave10に到達', condition:{ minWave:10 }, rewards:{ abyssStones:400, masteryExp:80 } },
  { id:'d1_boss3', depth:1, name:'深度I: Boss3体撃破', description:'深度IでBossを3体撃破', condition:{ minBossKills:3 }, rewards:{ abyssStones:500 } },
  { id:'d2_wave15', depth:2, name:'深度II: Wave15到達', description:'深度IIでWave15到達', condition:{ minWave:15 }, rewards:{ abyssStones:900, dropRateBonus:0.005 } },
  { id:'d2_return', depth:2, name:'深度II: 帰還成功', description:'深度IIで帰還', condition:{ result:'return' }, rewards:{ abyssStones:850, masteryExp:120 } },
  { id:'d3_legendary', depth:3, name:'深度III: Legendary入手', description:'深度IIIでLegendary以上を1個入手', condition:{ minRarityFound:'Legendary' }, rewards:{ abyssStones:1400 } },
  { id:'d3_mastery5_return', depth:3, name:'深度III: 熟練Lv5で帰還', description:'熟練Lv5以上のキャラで帰還', condition:{ minMasteryLevel:5, result:'return' }, rewards:{ abyssStones:1600, masteryExp:180 } },
  { id:'d4_wave20', depth:4, name:'深度IV: Wave20到達', description:'深度IVでWave20到達', condition:{ minWave:20 }, rewards:{ abyssStones:2600, unlockChallenge:'bullet_hell' } },
  { id:'d5_boss', depth:5, name:'深度V: Boss撃破', description:'深度VでBossを1体撃破', condition:{ minBossKills:1 }, rewards:{ abyssStones:3200, unlockChallenge:'hardened_depths' } },
  { id:'d5_wave25_any', depth:5, name:'深度V: Wave25到達', description:'任意キャラで深度V Wave25', condition:{ minWave:25 }, rewards:{ abyssStones:4500 } },
  { id:'char_depth3_wave20', depth:3, name:'キャラ別: 深度III+ Wave20', description:'キャラ別に深度III以上でWave20', condition:{ minWave:20, perCharacter:true }, rewards:{ abyssStones:1300, masteryExp:260 } },
];

const rarityOrder = ['Common','Rare','Epic','Legendary','Mythic','Abyssal'];

export function evaluateDepthMissions(save, runData) {
  const completed = [];
  save.depthMissions = save.depthMissions || {};
  save.characterMissionRecords = save.characterMissionRecords || {};
  for (const mission of DEPTH_MISSIONS) {
    const key = mission.condition?.perCharacter ? `${mission.id}:${runData.characterId}` : mission.id;
    if (save.depthMissions[key]) continue;
    if (runData.depth < mission.depth) continue;
    if (!matchesCondition(mission.condition || {}, runData)) continue;
    save.depthMissions[key] = { completedAt: Date.now(), characterId: runData.characterId, wave: runData.wave, depth: runData.depth };
    if (mission.condition?.perCharacter) {
      save.characterMissionRecords[runData.characterId] = save.characterMissionRecords[runData.characterId] || {};
      save.characterMissionRecords[runData.characterId][mission.id] = true;
    }
    completed.push(mission);
  }
  return completed;
}

function matchesCondition(condition, runData) {
  if (condition.minWave && runData.wave < condition.minWave) return false;
  if (condition.minBossKills && runData.bossKills < condition.minBossKills) return false;
  if (condition.result && runData.result !== condition.result) return false;
  if (condition.minMasteryLevel && runData.masteryLevel < condition.minMasteryLevel) return false;
  if (condition.minRarityFound) {
    const target = rarityOrder.indexOf(condition.minRarityFound);
    const found = rarityOrder.indexOf(runData.highestRarityFound || 'Common');
    if (found < target) return false;
  }
  return true;
}

export function applyMissionRewards(save, characterMastery, missions = []) {
  let stones = 0;
  let masteryExp = 0;
  for (const m of missions) {
    const r = m.rewards || {};
    stones += r.abyssStones || 0;
    masteryExp += r.masteryExp || 0;
    if (r.dropRateBonus) save.missionDropRateBonus = (save.missionDropRateBonus || 0) + r.dropRateBonus;
    if (r.unlockChallenge) {
      save.challengeProgress = save.challengeProgress || { unlocked:{}, cleared:{} };
      save.challengeProgress.unlocked[r.unlockChallenge] = true;
    }
  }
  if (stones > 0) {
    save.abyssStones += stones;
    save.lifetimeStones = (save.lifetimeStones || 0) + stones;
  }
  if (masteryExp > 0 && characterMastery) characterMastery.masteryExp = (characterMastery.masteryExp || 0) + masteryExp;
  return { stones, masteryExp };
}
