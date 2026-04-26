import { RARITIES } from '../core/constants.js';
import { weightedPick, pick } from '../core/utils.js';

const rarityWeights = [
  {rarity:'Common',weight:58},{rarity:'Rare',weight:27},{rarity:'Epic',weight:10},{rarity:'Legendary',weight:3.5},{rarity:'Mythic',weight:1.2},{rarity:'Abyssal',weight:.3}
];
const slots = ['武器','防具','指輪','首飾り','レリック','靴','手袋','魔導書','召喚具'];
const legendaryEffects = ['連鎖雷','吸引爆発','過剰回復障壁化','毒爆発','処刑強化','深層攻撃回数増加','召喚体増加','敵弾反射'];

export function rollEquipment(wave){
  const rw = rarityWeights.map(r=>({ ...r, weight: r.weight * (1 + wave * (RARITIES[r.rarity].mult-1)*0.035) }));
  const rarity = weightedPick(rw).rarity;
  const slot = pick(slots);
  const power = Math.floor((10 + wave*5) * RARITIES[rarity].mult * Math.pow(1.08,wave));
  const effect = ['Legendary','Mythic','Abyssal'].includes(rarity) ? pick(legendaryEffects) : '数値強化';
  return { slot, rarity, power, effect, name:`${rarity} ${slot}` };
}
