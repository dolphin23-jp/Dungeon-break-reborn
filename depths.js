export const DEPTHS = [
  { id:1, name:'深度 I', enemyHp:1, enemyAtk:1, enemyCount:1, reward:1, rare:0, unlockWave:0, desc:'標準難度。Phase 3の基本バランス。' },
  { id:2, name:'深度 II', enemyHp:1.65, enemyAtk:1.35, enemyCount:1.15, reward:2.2, rare:.08, unlockWave:5, desc:'敵が硬くなり、深淵石と装備の質が上がる。' },
  { id:3, name:'深度 III', enemyHp:2.8, enemyAtk:1.9, enemyCount:1.28, reward:5.2, rare:.18, unlockWave:10, desc:'永続強化前提。Legendary以上を狙いやすい。' },
  { id:4, name:'深度 IV', enemyHp:5.2, enemyAtk:2.85, enemyCount:1.42, reward:12, rare:.34, unlockWave:15, desc:'大きくインフレする挑戦用深度。' },
  { id:5, name:'深度 V', enemyHp:10, enemyAtk:4.4, enemyCount:1.6, reward:32, rare:.6, unlockWave:20, desc:'報酬も敵も暴走する実験的深度。' },
];
export function getDepth(id){ return DEPTHS.find(d=>d.id===Number(id)) || DEPTHS[0]; }
export function unlockedDepths(bestWave){ return DEPTHS.filter(d=>(bestWave||0)>=d.unlockWave); }
