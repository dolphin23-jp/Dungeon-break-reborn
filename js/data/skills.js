export const SKILL_POOL = [
  {
    id:'might', name:'攻撃訓練', rarity:'Common', maxLevel:20, tags:['基礎能力'],
    desc:'すべての直接ダメージを伸ばす基本強化。', perLevel:'ダメージ +8%。',
    applyLevel:p=>{ p.mods.damageMult += 0.08; }
  },
  {
    id:'haste', name:'高速詠唱', rarity:'Common', maxLevel:20, tags:['基礎能力'],
    desc:'通常攻撃と一部自動スキルの回転率を上げる。', perLevel:'攻撃速度 +7%。',
    applyLevel:p=>{ p.mods.attackSpeedMult += 0.07; }
  },
  {
    id:'runner', name:'疾走', rarity:'Common', maxLevel:15, tags:['基礎能力','回避'],
    desc:'移動で敵群をさばきやすくする。', perLevel:'移動速度 +6%。',
    applyLevel:p=>{ p.mods.speedMult += 0.06; }
  },
  {
    id:'vital', name:'生命増幅', rarity:'Common', maxLevel:20, tags:['防御'],
    desc:'最大HPを増やし、その場で回復する。', perLevel:'最大HP +18、即時回復。',
    applyLevel:p=>{ p.maxHp += 18; p.heal(18); }
  },
  {
    id:'magnet', name:'吸魂磁場', rarity:'Common', maxLevel:12, tags:['基礎能力','報酬'],
    desc:'経験値と深淵石を回収しやすくする。', perLevel:'回収範囲 +18。',
    applyLevel:p=>{ p.magnet += 18; }
  },
  {
    id:'focus', name:'集中射撃', rarity:'Common', maxLevel:12, tags:['基礎能力'],
    desc:'射程を伸ばし、遠くの危険な敵へ攻撃しやすくする。', perLevel:'射程 +16。',
    applyLevel:p=>{ p.baseRange += 16; }
  },
  {
    id:'guardTraining', name:'受け流し訓練', rarity:'Common', maxLevel:12, tags:['防御'],
    desc:'接触ダメージと敵弾ダメージを軽減する。', perLevel:'ダメージ軽減 +2%。',
    applyLevel:p=>{ p.guard = Math.min(0.78, p.guard + 0.02); }
  },
  {
    id:'soulHarvest', name:'魂狩り', rarity:'Common', maxLevel:10, tags:['報酬','基礎能力'],
    desc:'成長速度を上げる周回向けスキル。', perLevel:'経験値獲得 +5%、深淵石獲得 +3%。',
    applyLevel:p=>{ p.xpGain += 0.05; p.stoneGain += 0.03; }
  },

  {
    id:'critEdge', name:'会心刃', rarity:'Rare', maxLevel:12, tags:['クリティカル'],
    desc:'会心率と会心ダメージを伸ばす。敵の会心耐性で相殺される。', perLevel:'会心率 +4%、会心ダメージ +10%。',
    applyLevel:p=>{ p.mods.critChance += 0.04; p.mods.critDamage += 0.10; }
  },
  {
    id:'thunder', name:'雷の連鎖', rarity:'Rare', maxLevel:10, tags:['雷'],
    desc:'攻撃命中時、近くの敵へ跳ねる雷を発生させる。', perLevel:'連鎖確率・跳躍数・威力が上昇。',
    milestones:{3:'連鎖距離が拡大',6:'雷が追加で1体へ跳ねやすくなる',10:'連鎖雷が小範囲ダメージ化'},
    applyLevel:p=>{ p.flags.chainLightning = (p.flags.chainLightning||0) + 1; }
  },
  {
    id:'fireAura', name:'火炎円環', rarity:'Rare', maxLevel:10, tags:['火','設置'],
    desc:'プレイヤー周囲に火炎円環を発生させ、近い敵を焼く。', perLevel:'円環のダメージ・半径・発動頻度が上昇。',
    milestones:{3:'半径が大きく伸びる',5:'敵へ炎上を付与',8:'火炎円環が二重化',10:'灼熱輪となり高頻度化'},
    applyLevel:p=>{ p.flags.fireAura = (p.flags.fireAura||0) + 1; if((p.flags.fireAura||0)>=5) p.flags.burn = (p.flags.burn||0)+1; }
  },
  {
    id:'fireBurst', name:'紅蓮爆破', rarity:'Rare', maxLevel:10, tags:['火'],
    desc:'攻撃命中時、一定確率で小爆発を起こす。', perLevel:'爆発確率・半径・威力が上昇。',
    milestones:{5:'撃破時にも爆発しやすくなる',10:'爆発が連鎖しやすくなる'},
    applyLevel:p=>{ p.flags.fireExplosion = (p.flags.fireExplosion||0) + 1; }
  },
  {
    id:'iceShot', name:'凍結弾', rarity:'Rare', maxLevel:10, tags:['氷'],
    desc:'攻撃命中時、敵を鈍足化する。深層の敵は状態異常耐性を持つ。', perLevel:'鈍足時間・鈍足率・追加氷ダメージが上昇。',
    milestones:{4:'鈍足敵へのダメージ増加',8:'まれに凍結寸前まで減速'},
    applyLevel:p=>{ p.flags.iceSlow = (p.flags.iceSlow||0) + 1; }
  },
  {
    id:'poison', name:'毒蝕', rarity:'Rare', maxLevel:10, tags:['毒'],
    desc:'攻撃命中時、毒を付与して継続ダメージを与える。', perLevel:'毒DPS・毒時間が上昇。',
    milestones:{5:'毒状態の敵への与ダメージ増加',10:'毒の拡散力が上昇'},
    applyLevel:p=>{ p.flags.poison = (p.flags.poison||0) + 1; }
  },
  {
    id:'evasionDance', name:'幻影歩法', rarity:'Rare', maxLevel:10, tags:['回避','防御'],
    desc:'敵群の中を抜けやすくする。', perLevel:'回避率 +3%、移動速度 +2%。',
    applyLevel:p=>{ p.evasion = Math.min(0.55, p.evasion + 0.03); p.mods.speedMult += 0.02; }
  },
  {
    id:'pierce', name:'貫通弾', rarity:'Rare', maxLevel:8, tags:['基礎能力'],
    desc:'通常弾が敵を貫通し、密集した敵に強くなる。', perLevel:'貫通数と弾威力が上昇。',
    applyLevel:p=>{ p.flags.pierce = (p.flags.pierce||0) + 1; p.mods.damageMult += 0.03; }
  },
  {
    id:'recovery', name:'再生因子', rarity:'Rare', maxLevel:10, tags:['防御'],
    desc:'少しずつHPを回復する。', perLevel:'HP自動回復 +0.8/秒。',
    applyLevel:p=>{ p.regen += 0.8; }
  },


  {
    id:'steelSkin', name:'鋼の皮膚', rarity:'Rare', maxLevel:10, tags:['防御'],
    desc:'被ダメージを恒常軽減し、高Lvで接触耐性も得る。', perLevel:'軽減 +2.4%。',
    milestones:{7:'接触ダメージ追加軽減が発動'},
    applyLevel:p=>{ p.guard = Math.min(0.82, p.guard + 0.024); if((p.flags.steelSkinLv=(p.flags.steelSkinLv||0)+1)>=7) p.flags.contactGuard=(p.flags.contactGuard||0)+1; }
  },
  {
    id:'emergencyBarrier', name:'緊急障壁', rarity:'Rare', maxLevel:8, tags:['障壁','防御'],
    desc:'HPが一定以下で自動障壁を展開する。', perLevel:'発動時障壁量と再発動間隔が改善。',
    applyLevel:p=>{ p.flags.emergencyBarrier=(p.flags.emergencyBarrier||0)+1; }
  },
  {
    id:'dodgeInstinct', name:'回避本能', rarity:'Rare', maxLevel:10, tags:['回避','防御'],
    desc:'移動中の回避率が大きく上昇。オート移動でも有効。', perLevel:'移動中回避率 +8%。',
    applyLevel:p=>{ p.flags.dodgeWhileMoving=(p.flags.dodgeWhileMoving||0)+1; }
  },
  {
    id:'arcDeflect', name:'魔弾偏向', rarity:'Epic', maxLevel:8, tags:['反射','防御'],
    desc:'敵弾を無効化し、確率で反射する。', perLevel:'偏向率と反射弾威力上昇。',
    applyLevel:p=>{ p.flags.reflectBullets=(p.flags.reflectBullets||0)+1; }
  },
  {
    id:'thornRevenge', name:'報復の棘', rarity:'Epic', maxLevel:8, tags:['反射','制御'],
    desc:'被弾時に周囲へ反射ダメージを返す。', perLevel:'反撃威力・範囲上昇。',
    applyLevel:p=>{ p.flags.thornRevenge=(p.flags.thornRevenge||0)+1; }
  },
  {
    id:'unyielding', name:'不屈', rarity:'Legendary', maxLevel:3, tags:['不屈','防御'],
    desc:'致死ダメージを一度だけ耐える。Lvで回復量と無敵増加。', perLevel:'不屈回復量+無敵時間上昇。',
    applyLevel:p=>{ p.flags.undying=1; p.flags.undyingRecovery=(p.flags.undyingRecovery||0)+1; }
  },
  {
    id:'overhealGuard', name:'過剰治癒', rarity:'Epic', maxLevel:8, tags:['回復','障壁'],
    desc:'最大HP超過分の回復を障壁化する。', perLevel:'変換効率・障壁上限上昇。',
    applyLevel:p=>{ p.flags.overhealBarrier=(p.flags.overhealBarrier||0)+1; p.regen+=0.35; }
  },
  {
    id:'guardianField', name:'守護領域', rarity:'Epic', maxLevel:8, tags:['防御','制御'],
    desc:'一定時間ごとに守護領域を展開し被ダメージを抑える。', perLevel:'領域時間・軽減率上昇。',
    applyLevel:p=>{ p.flags.guardianField=(p.flags.guardianField||0)+1; }
  },
  {
    id:'repulseCarapace', name:'弾き返す甲殻', rarity:'Epic', maxLevel:8, tags:['反射','防御'],
    desc:'接触してきた敵へ反射ダメージを与える。', perLevel:'接触反射ダメージ上昇。',
    applyLevel:p=>{ p.flags.reflect=(p.flags.reflect||0)+1; p.flags.contactThorns=(p.flags.contactThorns||0)+1; }
  },
  {
    id:'recoveryCore', name:'再生因子改', rarity:'Rare', maxLevel:8, tags:['回復','防御'],
    desc:'低HP時の回復量が増加する再生。', perLevel:'再生 +0.7/秒、低HP補正増加。',
    applyLevel:p=>{ p.regen += 0.7; p.flags.recoveryBoost=(p.flags.recoveryBoost||0)+1; }
  },

  {
    id:'barrier', name:'障壁生成', rarity:'Epic', maxLevel:8, tags:['障壁','防御'],
    desc:'最大HPに応じた障壁を即時獲得する。', perLevel:'障壁 +最大HPの18%。',
    applyLevel:p=>{ p.shield += p.maxHp * 0.18; }
  },
  {
    id:'barrierRegen', name:'再展開障壁', rarity:'Epic', maxLevel:8, tags:['障壁','防御'],
    desc:'数秒ごとに障壁を自動再展開する。', perLevel:'再展開量が増加し、間隔が短縮。',
    applyLevel:p=>{ p.flags.barrierRegen = (p.flags.barrierRegen||0) + 1; }
  },
  {
    id:'blood', name:'出血連撃', rarity:'Epic', maxLevel:8, tags:['出血'],
    desc:'攻撃が追加ヒットし、出血を付与する。', perLevel:'追撃確率・出血DPSが上昇。',
    applyLevel:p=>{ p.flags.doubleHit=(p.flags.doubleHit||0)+1; p.flags.bleed=(p.flags.bleed||0)+1; }
  },
  {
    id:'execute', name:'処刑者', rarity:'Epic', maxLevel:8, tags:['処刑'],
    desc:'HPが減った敵を一気に削る。', perLevel:'低HP敵への処刑ダメージが上昇。',
    applyLevel:p=>{ p.flags.execute=(p.flags.execute||0)+1; p.execution += 0.04; }
  },
  {
    id:'frostNova', name:'氷晶ノヴァ', rarity:'Epic', maxLevel:8, tags:['氷','設置'],
    desc:'一定間隔で周囲に氷の衝撃波を放つ。', perLevel:'ノヴァ威力・半径・鈍足時間が上昇。',
    milestones:{4:'発動間隔短縮',8:'ノヴァ中心部の敵へ大ダメージ'},
    applyLevel:p=>{ p.flags.frostNova=(p.flags.frostNova||0)+1; }
  },
  {
    id:'toxicCloud', name:'腐食毒雲', rarity:'Epic', maxLevel:8, tags:['毒','設置'],
    desc:'毒状態の敵を倒すと毒雲を残す。', perLevel:'毒雲の半径・威力・持続時間が上昇。',
    applyLevel:p=>{ p.flags.toxicCloud=(p.flags.toxicCloud||0)+1; p.flags.poisonBurst=(p.flags.poisonBurst||0)+1; }
  },
  {
    id:'summonWisp', name:'使い魔召喚', rarity:'Epic', maxLevel:8, tags:['召喚'],
    desc:'自動攻撃する使い魔を増やす。', perLevel:'使い魔の攻撃数・威力が上昇。',
    applyLevel:p=>{ p.flags.minions=(p.flags.minions||0)+1; }
  },
  {
    id:'bladeOrbit', name:'旋回刃', rarity:'Epic', maxLevel:8, tags:['設置','出血'],
    desc:'周囲を回る刃で近距離の敵を切り刻む。', perLevel:'半径・威力・出血付与が上昇。',
    applyLevel:p=>{ p.flags.bladeOrbit=(p.flags.bladeOrbit||0)+1; p.flags.bleed=(p.flags.bleed||0)+1; }
  },
  {
    id:'multiCast', name:'多重詠唱', rarity:'Epic', maxLevel:6, tags:['基礎能力'],
    desc:'通常攻撃の発射数を増やす。', perLevel:'追加弾 +1、攻撃速度少し低下。',
    applyLevel:p=>{ p.flags.multiShot=(p.flags.multiShot||0)+1; p.mods.attackSpeedMult -= 0.025; }
  },

  {
    id:'mirror', name:'反射障壁', rarity:'Legendary', maxLevel:5, tags:['反射','障壁'],
    desc:'接触ダメージの一部を敵へ反射する。', perLevel:'反射量と障壁量が上昇。',
    applyLevel:p=>{ p.flags.reflect=(p.flags.reflect||0)+1; p.shield += p.maxHp*0.15; }
  },
  {
    id:'storm', name:'深層雷嵐', rarity:'Legendary', maxLevel:5, tags:['雷','設置'],
    desc:'Waveが深いほど雷撃数が増える自動雷嵐。', perLevel:'雷撃数・威力・発動頻度が上昇。',
    applyLevel:p=>{ p.flags.storm=(p.flags.storm||0)+1; }
  },
  {
    id:'mirrorBolt', name:'弾返しの秘法', rarity:'Legendary', maxLevel:5, tags:['反射'],
    desc:'敵弾を確率で味方弾へ変換する。', perLevel:'反射確率と反射弾威力が上昇。',
    applyLevel:p=>{ p.flags.reflectBullets=(p.flags.reflectBullets||0)+1; }
  },
  {
    id:'venomNova', name:'毒爆葬', rarity:'Legendary', maxLevel:5, tags:['毒','処刑'],
    desc:'毒状態の敵が死亡すると毒霧爆発を起こす。', perLevel:'毒爆発の範囲・威力が上昇。',
    applyLevel:p=>{ p.flags.poisonBurst=(p.flags.poisonBurst||0)+2; p.flags.poison=(p.flags.poison||0)+1; }
  },
  {
    id:'blackHole', name:'虚無吸引核', rarity:'Legendary', maxLevel:5, tags:['設置','処刑'],
    desc:'一定間隔で敵を吸引して爆発する黒い核を生む。', perLevel:'吸引範囲・爆発威力・発動頻度が上昇。',
    applyLevel:p=>{ p.flags.blackHole=(p.flags.blackHole||0)+1; }
  },
  {
    id:'overheal', name:'慈悲の過剰治癒', rarity:'Legendary', maxLevel:5, tags:['障壁','防御'],
    desc:'最大HPを超えた回復を障壁に変換する。', perLevel:'変換効率・障壁上限が上昇し、再生も得る。',
    applyLevel:p=>{ p.flags.overhealBarrier=(p.flags.overhealBarrier||0)+1; p.regen+=0.7; }
  },
  {
    id:'abyssEngine', name:'深度連撃機関', rarity:'Legendary', maxLevel:5, tags:['基礎能力','処刑'],
    desc:'Waveが深いほど通常攻撃回数が増える。', perLevel:'Wave由来の追加攻撃数が増える。',
    applyLevel:p=>{ p.flags.waveAttacks=(p.flags.waveAttacks||0)+1; }
  },
  {
    id:'phoenix', name:'不死鳥の残火', rarity:'Legendary', maxLevel:3, tags:['火','防御'],
    desc:'致命傷を一度だけ耐え、周囲を爆炎で吹き飛ばす。', perLevel:'復活回数・復活時火力が上昇。',
    applyLevel:p=>{ p.flags.revive=(p.flags.revive||0)+1; p.maxHp+=25; p.heal(25); }
  },
  {
    id:'executionNova', name:'断罪の連鎖処刑', rarity:'Legendary', maxLevel:5, tags:['処刑'],
    desc:'処刑で倒した敵が周囲に断罪波を放つ。', perLevel:'処刑閾値・断罪波威力が上昇。',
    applyLevel:p=>{ p.flags.executionNova=(p.flags.executionNova||0)+1; p.flags.execute=(p.flags.execute||0)+1; }
  },

  {
    id:'mythicTrinity', name:'三属性共鳴', rarity:'Mythic', maxLevel:4, tags:['雷','火','氷'],
    desc:'雷・火・氷が互いに誘発し、画面制圧力を高める。', perLevel:'連鎖雷・火炎円環・氷晶ノヴァを同時強化。',
    applyLevel:p=>{ p.flags.chainLightning=(p.flags.chainLightning||0)+1; p.flags.fireAura=(p.flags.fireAura||0)+1; p.flags.frostNova=(p.flags.frostNova||0)+1; p.elemental+=0.08; }
  },
  {
    id:'mythicLegion', name:'群霊軍勢', rarity:'Mythic', maxLevel:4, tags:['召喚'],
    desc:'使い魔が群れになり、敵集団を自動で削る。', perLevel:'使い魔数と召喚攻撃速度が大幅上昇。',
    applyLevel:p=>{ p.flags.minions=(p.flags.minions||0)+2; p.flags.minionSwarm=(p.flags.minionSwarm||0)+1; }
  },
  {
    id:'mythicBloodMoon', name:'血月の狂宴', rarity:'Mythic', maxLevel:4, tags:['出血','クリティカル'],
    desc:'出血中の敵へ会心が出やすくなり、撃破時に回復する。', perLevel:'出血・会心・撃破回復が上昇。',
    applyLevel:p=>{ p.flags.bleed=(p.flags.bleed||0)+2; p.flags.bloodHeal=(p.flags.bloodHeal||0)+1; p.mods.critChance+=0.04; p.mods.critDamage+=0.12; }
  },

  {
    id:'abyssalSingularity', name:'深淵特異点', rarity:'Abyssal', maxLevel:3, tags:['設置','処刑','雷'],
    desc:'画面内に深淵核を発生させ、吸引・雷撃・処刑をまとめて行う。', perLevel:'深淵核の頻度・吸引力・処刑性能が上昇。',
    applyLevel:p=>{ p.flags.blackHole=(p.flags.blackHole||0)+2; p.flags.storm=(p.flags.storm||0)+1; p.flags.execute=(p.flags.execute||0)+2; p.flags.abyssalCore=(p.flags.abyssalCore||0)+1; }
  },
  {
    id:'abyssalDominion', name:'支配者の深淵王冠', rarity:'Abyssal', maxLevel:3, tags:['召喚','障壁','報酬'],
    desc:'召喚体・障壁・深淵石獲得を同時に押し上げる最上位スキル。', perLevel:'使い魔+3、障壁大幅増加、深淵石獲得増加。',
    applyLevel:p=>{ p.flags.minions=(p.flags.minions||0)+3; p.shield+=p.maxHp*0.45; p.stoneGain+=0.18; p.flags.overhealBarrier=(p.flags.overhealBarrier||0)+1; }
  }
];

export const SKILL_RARITY_WEIGHTS = [
  { rarity:'Common', weight:48 },
  { rarity:'Rare', weight:30 },
  { rarity:'Epic', weight:15 },
  { rarity:'Legendary', weight:5 },
  { rarity:'Mythic', weight:1.4 },
  { rarity:'Abyssal', weight:0.35 }
];

export function getSkillLevel(game, id){ return game.runSkillLevels?.[id] || 0; }
export function isSkillMastered(game, skill){ return getSkillLevel(game, skill.id) >= (skill.maxLevel || 1); }
export function describeNextSkillLevel(skill, nextLevel){
  const milestone = skill.milestones?.[nextLevel];
  if(milestone) return `Lv${nextLevel}: ${skill.perLevel} / ${milestone}`;
  return `Lv${nextLevel}: ${skill.perLevel || skill.desc}`;
}
export function applySkillLevel(player, skill){
  if(typeof skill.applyLevel === 'function') skill.applyLevel(player);
}
