export const SKILL_POOL = [
  { id:'might', name:'攻撃訓練', rarity:'Common', tags:['基礎能力'], desc:'ダメージ +18%。', apply:p=>p.mods.damageMult+=0.18 },
  { id:'haste', name:'高速詠唱', rarity:'Common', tags:['基礎能力'], desc:'攻撃速度 +16%。', apply:p=>p.mods.attackSpeedMult+=0.16 },
  { id:'runner', name:'疾走', rarity:'Common', tags:['基礎能力','回避'], desc:'移動速度 +14%。', apply:p=>p.mods.speedMult+=0.14 },
  { id:'vital', name:'生命増幅', rarity:'Common', tags:['防御'], desc:'最大HP +35、即時回復。', apply:p=>{p.maxHp+=35;p.hp=Math.min(p.maxHp,p.hp+35)} },
  { id:'critEdge', name:'会心刃', rarity:'Rare', tags:['クリティカル'], desc:'会心率 +8%、会心ダメージ +20%。', apply:p=>{p.mods.critChance+=0.08;p.mods.critDamage+=0.2} },
  { id:'thunder', name:'雷の連鎖', rarity:'Rare', tags:['雷'], desc:'攻撃命中時、一定確率で近くの敵へ連鎖雷。', apply:p=>p.flags.chainLightning=(p.flags.chainLightning||0)+1 },
  { id:'fireAura', name:'火炎円環', rarity:'Rare', tags:['火','設置'], desc:'周囲の敵へ継続ダメージを与える。', apply:p=>p.flags.fireAura=(p.flags.fireAura||0)+1 },
  { id:'iceShot', name:'凍結弾', rarity:'Rare', tags:['氷'], desc:'攻撃した敵を短時間鈍足化する。', apply:p=>p.flags.iceSlow=(p.flags.iceSlow||0)+1 },
  { id:'poison', name:'毒蝕', rarity:'Rare', tags:['毒'], desc:'攻撃命中時、毒を付与する。', apply:p=>p.flags.poison=(p.flags.poison||0)+1 },
  { id:'barrier', name:'障壁生成', rarity:'Epic', tags:['障壁','防御'], desc:'最大HPの30%分の障壁を得る。', apply:p=>p.shield+=p.maxHp*0.3 },
  { id:'blood', name:'出血連撃', rarity:'Epic', tags:['出血'], desc:'攻撃が追加ヒットする確率を得る。', apply:p=>p.flags.doubleHit=(p.flags.doubleHit||0)+1 },
  { id:'execute', name:'処刑者', rarity:'Epic', tags:['処刑'], desc:'HP25%未満の敵へ大ダメージ。', apply:p=>p.flags.execute=(p.flags.execute||0)+1 },
  { id:'mirror', name:'反射障壁', rarity:'Legendary', tags:['反射','障壁'], desc:'接触ダメージの一部を敵へ反射する。', apply:p=>p.flags.reflect=(p.flags.reflect||0)+1 },
  { id:'storm', name:'深層雷嵐', rarity:'Legendary', tags:['雷','設置'], desc:'Waveが深いほど雷撃数が増える。', apply:p=>p.flags.storm=(p.flags.storm||0)+1 },
  { id:'abyssCall', name:'深淵の召喚具', rarity:'Legendary', tags:['召喚'], desc:'自動攻撃する従魔を追加する。', apply:p=>p.flags.minions=(p.flags.minions||0)+1 },
];

export const SKILL_RARITY_WEIGHTS = [
  { rarity:'Common', weight:58 }, { rarity:'Rare', weight:30 }, { rarity:'Epic', weight:10 }, { rarity:'Legendary', weight:2 }
];
