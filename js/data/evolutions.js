export const EVOLUTIONS = [
  { id:'infernoOrbit', name:'煉獄円環', rarity:'Legendary', tags:['火','設置'], desc:'火炎円環 + 紅蓮爆破', requires:{fireAura:6, fireBurst:4}, apply:p=>{ p.flags.infernoOrbit=1; p.flags.fireAura=(p.flags.fireAura||0)+2; p.flags.fireExplosion=(p.flags.fireExplosion||0)+2; p.flags.burn=(p.flags.burn||0)+2; } },
  { id:'heavenThunder', name:'天雷連鎖', rarity:'Legendary', tags:['雷'], desc:'雷の連鎖 + 深層雷嵐', requires:{thunder:6, storm:2}, apply:p=>{ p.flags.heavenThunder=1; p.flags.chainLightning=(p.flags.chainLightning||0)+3; } },
  { id:'iceWallDomain', name:'氷壁領域', rarity:'Legendary', tags:['氷','障壁'], desc:'氷晶ノヴァ + 再展開障壁', requires:{frostNova:6, barrierRegen:4}, apply:p=>{ p.flags.iceWallDomain=1; p.flags.frostNova=(p.flags.frostNova||0)+2; p.flags.shieldGuard=(p.flags.shieldGuard||0)+2; } },
  { id:'plagueSwamp', name:'疫毒沼', rarity:'Legendary', tags:['毒','設置'], desc:'腐食毒雲 + 毒爆葬', requires:{toxicCloud:5, venomNova:2}, apply:p=>{ p.flags.plagueSwamp=1; p.flags.toxicCloud=(p.flags.toxicCloud||0)+3; p.flags.poisonBurst=(p.flags.poisonBurst||0)+2; } },
  { id:'bloodJudgement', name:'断罪血刃', rarity:'Legendary', tags:['出血','処刑'], desc:'出血系 + 処刑系', requiresTags:[{tag:'出血',lv:5},{tag:'処刑',lv:4}], apply:p=>{ p.flags.bloodJudgement=1; p.flags.bleed=(p.flags.bleed||0)+3; p.flags.executionNova=(p.flags.executionNova||0)+1; } },
  { id:'spiritMarch', name:'群霊大行進', rarity:'Legendary', tags:['召喚'], desc:'使い魔召喚 + 群霊軍勢', requires:{summonWisp:5, mythicLegion:1}, apply:p=>{ p.flags.spiritMarch=1; p.flags.minions=(p.flags.minions||0)+4; p.flags.minionSwarm=(p.flags.minionSwarm||0)+2; } },
  { id:'reflectShell', name:'反射甲殻', rarity:'Legendary', tags:['反射','防御'], desc:'敵弾反射 + 鋼の皮膚', requires:{mirrorBolt:2, steelSkin:4}, apply:p=>{ p.flags.reflectShell=1; p.flags.reflect=(p.flags.reflect||0)+2; p.flags.reflectBullets=(p.flags.reflectBullets||0)+2; } },
  { id:'lifeCycle', name:'生命循環', rarity:'Legendary', tags:['回復','障壁'], desc:'再生因子 + 過剰治癒', requires:{recovery:4, overhealGuard:4}, apply:p=>{ p.flags.lifeCycle=1; p.regen+=1.2; p.flags.overhealBarrier=(p.flags.overhealBarrier||0)+2; } },

  { id:'triResonance', name:'三属性共鳴', rarity:'Mythic', tags:['火','雷','氷'], desc:'火 + 雷 + 氷', requiresTags:[{tag:'火',lv:4},{tag:'雷',lv:4},{tag:'氷',lv:4}], apply:p=>{ p.flags.triResonance=1; p.flags.chainLightning=(p.flags.chainLightning||0)+2; p.flags.fireAura=(p.flags.fireAura||0)+2; p.flags.frostNova=(p.flags.frostNova||0)+2; } },
  { id:'deathSentence', name:'死病執行', rarity:'Mythic', tags:['毒','出血','処刑'], desc:'毒 + 出血 + 処刑', requiresTags:[{tag:'毒',lv:4},{tag:'出血',lv:4},{tag:'処刑',lv:4}], apply:p=>{ p.flags.deathSentence=1; p.flags.poison=(p.flags.poison||0)+2; p.flags.bleed=(p.flags.bleed||0)+2; p.flags.execute=(p.flags.execute||0)+2; } },
  { id:'ironFortress', name:'不落城塞', rarity:'Mythic', tags:['障壁','反射','防御'], desc:'障壁 + 反射 + 防御', requiresTags:[{tag:'障壁',lv:4},{tag:'反射',lv:3},{tag:'防御',lv:5}], apply:p=>{ p.flags.ironFortress=1; p.flags.guardianField=(p.flags.guardianField||0)+3; p.guard=Math.min(0.9,p.guard+0.12); } },
  { id:'holyFormation', name:'聖霊陣', rarity:'Mythic', tags:['召喚','障壁','回復'], desc:'召喚 + 障壁 + 回復', requiresTags:[{tag:'召喚',lv:4},{tag:'障壁',lv:4},{tag:'回復',lv:3}], apply:p=>{ p.flags.holyFormation=1; p.flags.minions=(p.flags.minions||0)+3; p.shield+=p.maxHp*0.5; p.regen+=0.8; } },
  { id:'calamityCore', name:'災厄核', rarity:'Mythic', tags:['設置','火','毒'], desc:'吸引/黒穴 + 火爆発 + 毒雲', requires:{blackHole:3, fireBurst:4, toxicCloud:4}, apply:p=>{ p.flags.calamityCore=1; p.flags.blackHole=(p.flags.blackHole||0)+2; p.flags.fireExplosion=(p.flags.fireExplosion||0)+2; p.flags.toxicCloud=(p.flags.toxicCloud||0)+2; } },

  { id:'stormNet', name:'天罰雷網', rarity:'Abyssal', tags:['雷'], desc:'嵐詠み専用', characterId:'stormcaller', requires:{thunder:5, storm:3}, apply:p=>{ p.flags.stormNet=1; p.flags.chainLightning=(p.flags.chainLightning||0)+4; p.flags.storm=(p.flags.storm||0)+2; } },
  { id:'pestGarden', name:'疫病庭園', rarity:'Abyssal', tags:['毒','設置'], desc:'瘴気の魔女専用', characterId:'witch', requires:{toxicCloud:5, venomNova:4}, apply:p=>{ p.flags.pestGarden=1; p.flags.toxicCloud=(p.flags.toxicCloud||0)+4; p.flags.poisonBurst=(p.flags.poisonBurst||0)+3; } },
  { id:'saintMirror', name:'聖塞反射陣', rarity:'Abyssal', tags:['障壁','反射'], desc:'鉄壁の巡礼者専用', characterId:'pilgrim', requires:{barrierRegen:5, mirrorBolt:4}, apply:p=>{ p.flags.saintMirror=1; p.flags.reflectBullets=(p.flags.reflectBullets||0)+4; p.flags.barrierRegen=(p.flags.barrierRegen||0)+3; } },
  { id:'oniLegion', name:'百鬼軍団', rarity:'Abyssal', tags:['召喚'], desc:'群霊使い専用', characterId:'spiritmaster', requires:{summonWisp:5, mythicLegion:3}, apply:p=>{ p.flags.oniLegion=1; p.flags.minions=(p.flags.minions||0)+6; p.flags.minionSwarm=(p.flags.minionSwarm||0)+4; } },
  { id:'bloodFuneral', name:'血葬連斬', rarity:'Abyssal', tags:['出血','処刑'], desc:'灰刃の放浪者専用', characterId:'wanderer', requiresTags:[{tag:'出血',lv:5},{tag:'処刑',lv:4}], apply:p=>{ p.flags.bloodFuneral=1; p.flags.bleed=(p.flags.bleed||0)+4; p.flags.execute=(p.flags.execute||0)+3; p.flags.executionNova=(p.flags.executionNova||0)+2; } },
];

function tagLevel(levels, pool, tag){
  return pool.filter(s=>s.tags?.includes(tag)).reduce((sum,s)=>sum+(levels[s.id]||0),0);
}

export function unlockedEvolutions(game){
  const levels=game.runSkillLevels||{};
  const pool=game.skillPool||[];
  return EVOLUTIONS.filter(e=>{
    if(game.runEvolutions?.[e.id]) return false;
    if(e.characterId && game.selectedCharacter?.id!==e.characterId) return false;
    const reqOk = !e.requires || Object.entries(e.requires).every(([id,lv])=>(levels[id]||0)>=lv);
    const tagOk = !e.requiresTags || e.requiresTags.every(req=>tagLevel(levels,pool,req.tag)>=req.lv);
    return reqOk && tagOk;
  });
}
