import { RARITIES, EQUIPMENT_SLOTS, CONFIG } from '../core/constants.js';
import { weightedPick, pick } from '../core/utils.js';
import { saveGame } from '../core/storage.js';

const baseRarityWeights = [
  {rarity:'Common',weight:58},{rarity:'Rare',weight:27},{rarity:'Epic',weight:10},{rarity:'Legendary',weight:3.5},{rarity:'Mythic',weight:1.2},{rarity:'Abyssal',weight:.3}
];
export const EQUIPMENT_SETS = {
  Storm:{name:'嵐', two:'雷・攻撃速度が上昇', four:'連鎖雷+1、射程上昇'},
  Inferno:{name:'紅蓮', two:'火・爆発ダメージが上昇', four:'撃破時爆発が強化'},
  Venom:{name:'瘴気', two:'毒ダメージが上昇', four:'毒雲と毒爆発が強化'},
  Frost:{name:'氷霜', two:'氷・鈍足が強化', four:'定期的に氷晶ノヴァ+1相当'},
  Guardian:{name:'守護', two:'HPと障壁が上昇', four:'再展開障壁+1'},
  Legion:{name:'群霊', two:'召喚体が強化', four:'召喚体+1'},
  Execution:{name:'処刑', two:'低HP敵へのダメージ上昇', four:'処刑波が強化'}
};
const setIds=Object.keys(EQUIPMENT_SETS);
const legendaryEffects = [
  {id:'stormBook', setId:'Storm', name:'嵐呼びの魔導書', desc:'通常攻撃時、連鎖雷が発生しやすくなる。'},
  {id:'emberCore', setId:'Inferno', name:'紅蓮核の首飾り', desc:'敵撃破時、小爆発を起こす。'},
  {id:'mercyPlate', setId:'Guardian', name:'慈雨の防具', desc:'過剰回復を障壁へ変換する。'},
  {id:'venomFang', setId:'Venom', name:'深緑の毒牙', desc:'毒状態の敵が倒れると毒霧爆発。'},
  {id:'executionCrown', setId:'Execution', name:'処刑王の指輪', desc:'低HPの敵への処刑ダメージが増える。'},
  {id:'abyssEngine', setId:'Execution', name:'深層機関のレリック', desc:'Waveが深いほど追加攻撃が増える。'},
  {id:'spiritTotem', setId:'Legion', name:'群霊の召喚具', desc:'召喚体を追加する。'},
  {id:'mirrorShard', setId:'Guardian', name:'反射王の盾片', desc:'敵弾を一定確率で反射する。'},
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
  let legendaryId=null, legendaryDesc='', setId=null; let baseName=pick(names[slot] || [slot]);
  if(['Legendary','Mythic','Abyssal'].includes(rarity)){
    const leg=pick(legendaryEffects); legendaryId=leg.id; legendaryDesc=leg.desc; setId=leg.setId; baseName=leg.name;
  }
  if(!setId && (RARITIES[rarity].order||0)>=2) setId=pick(setIds);
  return { id:`eq_${Date.now()}_${Math.random().toString(36).slice(2)}`, slot, rarity, power, stats, statLines, legendaryId, legendaryDesc, setId, locked:false, name:`${rarity} ${baseName}`, waveFound:wave };
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
export function itemScore(item){ return (item?.power || 0) + (item?.legendaryId?500:0) + (RARITIES[item?.rarity]?.order || 0)*35 + (item?.setId?18:0); }
export function setCounts(equipment){ const out={}; for(const it of Object.values(equipment||{})){ if(it?.setId) out[it.setId]=(out[it.setId]||0)+1; } return out; }
export function toggleLock(save,itemId){ const item=save.inventory.find(x=>x.id===itemId); if(!item)return false; item.locked=!item.locked; saveGame(save); return item.locked; }

export function equipItem(save, itemId){
  const item = save.inventory.find(x=>x.id===itemId);
  if(!item) return false;
  save.equipment[item.slot]=item;
  saveGame(save);
  return true;
}
export function dismantleItem(save, itemId){
  const idx=save.inventory.findIndex(x=>x.id===itemId);
  if(idx<0) return 0;
  const item=save.inventory[idx];
  const order=RARITIES[item.rarity]?.order || 1;
  const gained=Math.max(1, Math.floor((item.power||1)*order*.18));
  save.inventory.splice(idx,1);
  if(item.locked) return 0;
  if(save.equipment[item.slot]?.id===itemId) save.equipment[item.slot]=null;
  save.abyssStones+=gained;
  save.lifetimeStones=(save.lifetimeStones||0)+gained;
  saveGame(save);
  return gained;
}
