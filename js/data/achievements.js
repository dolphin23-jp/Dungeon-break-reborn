export const ACHIEVEMENTS = [
  { id:'w5', name:'初めての深層', desc:'Wave 5に到達する', rewardText:'破砕の腕力 +1', upgrade:'power', amount:1, condition:s=>s.bestWave>=5 },
  { id:'w10', name:'深淵の入口', desc:'Wave 10に到達する', rewardText:'深淵共鳴 +1', upgrade:'stoneGain', amount:1, condition:s=>s.bestWave>=10 },
  { id:'w15', name:'圧壊回廊', desc:'Wave 15に到達する', rewardText:'元素増幅 +2', upgrade:'elemental', amount:2, condition:s=>s.bestWave>=15 },
  { id:'k100', name:'百体斬り', desc:'累計100体撃破する', rewardText:'生命力 +1', upgrade:'vitality', amount:1, condition:s=>s.totalKills>=100 },
  { id:'k500', name:'群れを砕く者', desc:'累計500体撃破する', rewardText:'攻撃速度 +2', upgrade:'haste', amount:2, condition:s=>s.totalKills>=500 },
  { id:'boss1', name:'初Boss撃破', desc:'Bossを1体倒す', rewardText:'財宝嗅覚 +1', upgrade:'dropRate', amount:1, condition:s=>s.totalBossKills>=1 },
  { id:'legend1', name:'黄金の鼓動', desc:'Legendary以上の装備を入手する', rewardText:'高レア運 +2', upgrade:'rarityLuck', amount:2, condition:s=>s.legendaryFound>=1 },
  { id:'depth3', name:'深度III解放者', desc:'深度III以上で探索を開始する', rewardText:'深淵石 +15000', stones:15000, condition:s=>s.maxDepthStarted>=3 },
  { id:'stone50k', name:'石喰らい', desc:'累計50,000個の深淵石を獲得する', rewardText:'深淵共鳴 +3', upgrade:'stoneGain', amount:3, condition:s=>s.lifetimeStones>=50000 },
];
