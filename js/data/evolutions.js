export const EVOLUTIONS = [
  {
    id:'infernoOrbit', name:'煉獄円環', rarity:'Legendary', tags:['火','設置'],
    desc:'火炎円環Lv8 + 紅蓮爆破Lv4。火炎円環が拡大し、炎上敵への爆発連鎖が強くなる。',
    requires:{fireAura:8, fireBurst:4}, apply:p=>{ p.flags.infernoOrbit=1; p.flags.fireAura=(p.flags.fireAura||0)+2; p.flags.fireExplosion=(p.flags.fireExplosion||0)+2; p.flags.burn=(p.flags.burn||0)+2; }
  },
  {
    id:'thunderJudgement', name:'雷裁処刑', rarity:'Legendary', tags:['雷','処刑'],
    desc:'雷の連鎖Lv8 + 処刑者Lv4。処刑対象への雷ダメージが増え、処刑撃破時に雷が再連鎖する。',
    requires:{thunder:8, execute:4}, apply:p=>{ p.flags.thunderJudgement=1; p.flags.chainLightning=(p.flags.chainLightning||0)+2; p.flags.execute=(p.flags.execute||0)+1; }
  },
  {
    id:'plagueAbyss', name:'疫毒深淵', rarity:'Mythic', tags:['毒','設置'],
    desc:'毒蝕Lv8 + 腐食毒雲Lv4。毒雲が大型化し、毒状態の敵が倒れるたびに毒が広がる。',
    requires:{poison:8, toxicCloud:4}, apply:p=>{ p.flags.plagueAbyss=1; p.flags.poison=(p.flags.poison||0)+2; p.flags.toxicCloud=(p.flags.toxicCloud||0)+2; p.flags.poisonBurst=(p.flags.poisonBurst||0)+2; }
  },
  {
    id:'absoluteZeroStorm', name:'絶零雷嵐', rarity:'Mythic', tags:['氷','雷'],
    desc:'氷晶ノヴァLv8 + 深層雷嵐Lv2。雷嵐が敵を鈍足化し、凍った敵へ追加雷撃を落とす。',
    requires:{frostNova:8, storm:2}, apply:p=>{ p.flags.absoluteZeroStorm=1; p.flags.frostNova=(p.flags.frostNova||0)+1; p.flags.storm=(p.flags.storm||0)+1; }
  },
  {
    id:'spiritCitadel', name:'群霊城塞', rarity:'Mythic', tags:['召喚','障壁'],
    desc:'使い魔召喚Lv8 + 再展開障壁Lv4。使い魔の攻撃が障壁を補充し、召喚弾が貫通する。',
    requires:{summonWisp:8, barrierRegen:4}, apply:p=>{ p.flags.spiritCitadel=1; p.flags.minions=(p.flags.minions||0)+2; p.flags.minionSwarm=(p.flags.minionSwarm||0)+2; p.shield+=p.maxHp*.35; }
  },
  {
    id:'abyssalOverlord', name:'深淵覇王化', rarity:'Abyssal', tags:['召喚','雷','処刑','報酬'],
    desc:'深淵特異点Lv2 + 支配者の深淵王冠Lv2。黒穴・雷嵐・召喚・深淵石獲得がまとめて強化される最終進化。',
    requires:{abyssalSingularity:2, abyssalDominion:2}, apply:p=>{ p.flags.abyssalOverlord=1; p.flags.blackHole=(p.flags.blackHole||0)+2; p.flags.storm=(p.flags.storm||0)+2; p.flags.minions=(p.flags.minions||0)+3; p.stoneGain+=.25; }
  },
];

export function unlockedEvolutions(game){
  const levels=game.runSkillLevels||{};
  return EVOLUTIONS.filter(e=>!game.runEvolutions?.[e.id] && Object.entries(e.requires).every(([id,lv])=>(levels[id]||0)>=lv));
}
