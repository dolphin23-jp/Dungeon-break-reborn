import { RARITIES, EQUIPMENT_SLOTS, CONFIG } from '../core/constants.js';
import { weightedPick, pick } from '../core/utils.js';
import { saveGame } from '../core/storage.js';

const baseRarityWeights = [
  {rarity:'Common',weight:58},{rarity:'Rare',weight:27},{rarity:'Epic',weight:10},{rarity:'Legendary',weight:3.5},{rarity:'Mythic',weight:1.2},{rarity:'Abyssal',weight:.3}
];
const legendaryEffects = [
  {id:'stormBook', name:'嵐呼びの魔導書', desc:'通常攻撃時、連鎖雷が発生しやすくなる。'},
  {id:'emberCore', name:'紅蓮核の首飾り', desc:'敵撃破時、小爆発を起こす。'},
  {id:'mercyPlate', name:'慈雨の防具', desc:'過剰回復を障壁へ変換する。'},
  {id:'venomFang', name:'深緑の毒牙', desc:'毒状態の敵が倒れると毒霧爆発。'},
  {id:'executionCrown', name:'処刑王の指輪', desc:'低HPの敵への処刑ダメージが増える。'},
  {id:'abyssEngine', name:'深層機関のレリック', desc:'Waveが深いほど追加攻撃が増える。'},
  {id:'spiritTotem', name:'群霊の召喚具', desc:'召喚体を追加する。'},
  {id:'mirrorShard', name:'反射王の盾片', desc:'敵弾を一定確率で反射する。'},
];
const names = {
  武器:['錆びた剣','自動弩','破砕杖','裂空刃'], 防具:['旅人の外套','硬化鎧','障壁衣','深層甲殻'], 指輪:['青銅の指輪','会心環','処刑環','星見の輪'],
  首飾り:['護符','紅蓮核','雷紋の首飾り','深淵首飾り'], レリック:['古びた歯車','深層機関','血晶石','奈落の核'], 靴:['軽靴','影走りの靴','旋風靴','幽歩靴'],
  手袋:['革手袋','射手の手袋','裂傷手甲','魔導グローブ'], 魔導書:['入門書','雷術書','氷霜典','嵐呼びの魔導書'], 召喚具:['小さな笛','霊鳥の籠','群霊の召喚具','契約印']
};
const statPool = [
  ['damageMult','攻撃%',.025], ['attackSpeedMult','攻速%',.018], ['speedMult','移動%',.014], ['hp','HP',8], ['guard','軽減',.004], ['critChance','会心率',.008],
  ['critDamage','会心倍率',.025], ['range','射程',5], ['magnet','回収',5], ['regen','再生',.05], ['stoneGain','深淵石%',.012], ['dropRate','ドロップ%',.004], ['rarityLuck','高レア%',.006], ['xpGain','経験値%',.008], ['elemental','属性%',.01]
];

export function rollEquipment(wave, luck=0){
  const rw = baseRarityWeights.map(r=>({ ...r, weight: r.weight * (1 + wave * (RARITIES[r.rarity].mult-1)*0.035 + luck*(RARITIES[r.rarity].order-1)) }));
  const rarity = weightedPick(rw).rarity;
  const slot = pick(EQUIPMENT_SLOTS);
  const rarityMult = RARITIES[rarity].mult;
  const power = Math.floor((10 + wave*5.8) * rarityMult * Math.pow(1.095,wave));
  const affixes = rarity==='Common'?1:rarity==='Rare'?2:rarity==='Epic'?3:4;
  const stats = {};
  const statLines=[];
  for(let i=0;i<affixes;i++){
    const [key,label,base]=pick(statPool);
    const v = +(base * rarityMult * (1+wave*.04) * (0.75+Math.random()*.55)).toFixed(4);
    stats[key]=(stats[key]||0)+v; statLines.push(`${label}+${formatStat(key,v)}`);
  }
  let legendaryId=null, legendaryDesc=''; let baseName=pick(names[slot] || [slot]);
  if(['Legendary','Mythic','Abyssal'].includes(rarity)){
    const leg=pick(legendaryEffects); legendaryId=leg.id; legendaryDesc=leg.desc; baseName=leg.name;
  }
  return { id:`eq_${Date.now()}_${Math.random().toString(36).slice(2)}`, slot, rarity, power, stats, statLines, legendaryId, legendaryDesc, name:`${rarity} ${baseName}`, waveFound:wave };
}
export function formatStat(key,v){
  if(['damageMult','attackSpeedMult','speedMult','guard','critChance','stoneGain','dropRate','rarityLuck','xpGain','elemental'].includes(key)) return `${Math.round(v*100)}%`;
  if(key==='critDamage') return `${v.toFixed(2)}x`;
  return `${Math.round(v)}`;
}
export function addEquipment(save, item){
  save.inventory.unshift(item);
  if(save.inventory.length>CONFIG.inventory.maxItems) save.inventory.length=CONFIG.inventory.maxItems;
  const current=save.equipment[item.slot];
  const equipped = !current || itemScore(item)>itemScore(current);
  if(equipped) save.equipment[item.slot]=item;
  saveGame(save);
  return equipped;
}
export function itemScore(item){ return (item?.power || 0) + (item?.legendaryId?500:0) + (RARITIES[item?.rarity]?.order || 0)*35; }
