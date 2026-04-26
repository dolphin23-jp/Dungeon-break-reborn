export const CHARACTERS = [
  {
    id:'wanderer', name:'灰刃の放浪者', title:'断罪を歩む剣影',
    description:'近接で敵を裂き、出血と処刑で押し切るアタッカー。',
    initialStats:{ maxHp:30, damageMult:0.08 },
    initialSkills:['blood'],
    skillWeightBias:{ favorable:1.85, unfavorable:0.62 },
    favorableTags:['出血','防御','処刑','基礎能力'],
    unfavorableTags:['召喚','設置','毒'],
    passive:['HP50%以下の敵へのダメージ+18%','出血中の敵を倒すと攻撃速度短時間上昇'],
    growth:{ hp:10, damage:1.6, defense:0.002, magnet:1.2, attackSpeed:0.0, cooldown:0, critChance:0, barrier:0, statusDamage:0, statusDuration:0, aoe:0, summonDamage:0, summonAttackSpeed:0, summonCount:0 },
    unlock:{ type:'default' }
  },
  {
    id:'stormcaller', name:'嵐詠み', title:'断続雷歌の継承者',
    description:'雷連鎖と会心で敵群を貫く高速キャスター。',
    initialStats:{ attackSpeedMult:0.12, critChance:0.05 },
    initialSkills:['thunder'],
    skillWeightBias:{ favorable:1.9, unfavorable:0.6 },
    favorableTags:['雷','クリティカル','基礎能力'],
    unfavorableTags:['防御','障壁','毒'],
    passive:['雷スキルの連鎖回数+1','雷スキルダメージ+20%'],
    growth:{ hp:7, damage:1.1, defense:0.0015, magnet:1.2, attackSpeed:0.012, cooldown:0.01, critChance:0.006, barrier:0, statusDamage:0, statusDuration:0, aoe:0, summonDamage:0, summonAttackSpeed:0, summonCount:0 },
    unlock:{ type:'default' }
  },
  {
    id:'pilgrim', name:'鉄壁の巡礼者', title:'聖塞を纏う守護者',
    description:'障壁・反射・軽減で押し返す防御型。',
    initialStats:{ maxHp:45, guard:0.05, shieldRate:0.2 },
    initialSkills:['barrier'],
    skillWeightBias:{ favorable:1.9, unfavorable:0.55 },
    favorableTags:['防御','障壁','反射','回避'],
    unfavorableTags:['火','毒','処刑'],
    passive:['障壁がある間の被ダメージ軽減','敵弾を一定確率で反射'],
    growth:{ hp:13, damage:0.9, defense:0.0045, magnet:0.8, attackSpeed:0.0, cooldown:0, critChance:0, barrier:0.025, statusDamage:0, statusDuration:0, aoe:0, summonDamage:0, summonAttackSpeed:0, summonCount:0 },
    unlock:{ type:'default' }
  },
  {
    id:'witch', name:'瘴気の魔女', title:'疫病庭園の主',
    description:'毒・設置・継続ダメージで戦場を汚染する。',
    initialStats:{ elemental:0.08, statusDamage:0.12 },
    initialSkills:['poison'],
    skillWeightBias:{ favorable:1.85, unfavorable:0.62 },
    favorableTags:['毒','設置','処刑'],
    unfavorableTags:['雷','氷','防御'],
    passive:['毒状態の敵が死亡時に毒霧を残す','毒ダメージ+25%'],
    growth:{ hp:8, damage:1.0, defense:0.0015, magnet:1.0, attackSpeed:0.0, cooldown:0.006, critChance:0, barrier:0, statusDamage:0.02, statusDuration:0.025, aoe:0.015, summonDamage:0, summonAttackSpeed:0, summonCount:0 },
    unlock:{ type:'default' }
  },
  {
    id:'spiritmaster', name:'群霊使い', title:'百鬼を従える契約者',
    description:'召喚と障壁で安定して押し込む支援型。',
    initialStats:{ summonDamage:0.2, shieldRate:0.1 },
    initialSkills:['summonWisp'],
    skillWeightBias:{ favorable:1.85, unfavorable:0.62 },
    favorableTags:['召喚','障壁','基礎能力'],
    unfavorableTags:['出血','処刑','反射'],
    passive:['初期召喚体+1','召喚体ダメージ+20%'],
    growth:{ hp:9, damage:0.9, defense:0.002, magnet:1.0, attackSpeed:0.004, cooldown:0.002, critChance:0, barrier:0.012, statusDamage:0, statusDuration:0, aoe:0, summonDamage:0.02, summonAttackSpeed:0.015, summonCount:0.07 },
    unlock:{ type:'default' }
  },
];

export const DEFAULT_CHARACTER_ID = 'wanderer';

export function getCharacterById(id){
  return CHARACTERS.find(c=>c.id===id) || CHARACTERS[0];
}
