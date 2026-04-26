import { RARITIES, EQUIPMENT_SLOTS, CONFIG } from '../core/constants.js';
import { weightedPick, pick, randInt } from '../core/utils.js';
import { saveGame } from '../core/storage.js';
import { rollAffixes, aggregateAffixStats, enhanceAffixes } from '../data/affixes.js';

const baseRarityWeights = [
  { rarity: 'Common', weight: 58 }, { rarity: 'Rare', weight: 27 }, { rarity: 'Epic', weight: 10 }, { rarity: 'Legendary', weight: 3.5 }, { rarity: 'Mythic', weight: 1.2 }, { rarity: 'Abyssal', weight: 0.3 },
];

export const AUTO_DISMANTLE_ORDER = ['None', 'Common', 'Rare', 'Epic'];
export const ENHANCE_CAPS = { Common: 3, Rare: 5, Epic: 8, Legendary: 10, Mythic: 15, Abyssal: 20 };

export const EQUIPMENT_SETS = {
  Storm: { name: '嵐', two: '雷・攻撃速度が上昇', four: '連鎖雷+1、射程上昇' }, Inferno: { name: '紅蓮', two: '火・爆発ダメージが上昇', four: '撃破時爆発が強化' },
  Venom: { name: '瘴気', two: '毒ダメージが上昇', four: '毒雲と毒爆発が強化' }, Frost: { name: '氷霜', two: '氷・鈍足が強化', four: '定期的に氷晶ノヴァ+1相当' },
  Guardian: { name: '守護', two: 'HPと障壁が上昇', four: '再展開障壁+1' }, Legion: { name: '群霊', two: '召喚体が強化', four: '召喚体+1' }, Execution: { name: '処刑', two: '低HP敵へのダメージ上昇', four: '処刑波が強化' },
};
const setIds = Object.keys(EQUIPMENT_SETS);
const legendaryEffects = [
  { id: 'stormBook', setId: 'Storm', name: '嵐呼びの魔導書', desc: '通常攻撃時、連鎖雷が発生しやすくなる。' }, { id: 'emberCore', setId: 'Inferno', name: '紅蓮核の首飾り', desc: '敵撃破時、小爆発を起こす。' },
  { id: 'mercyPlate', setId: 'Guardian', name: '慈雨の防具', desc: '過剰回復を障壁へ変換する。' }, { id: 'venomFang', setId: 'Venom', name: '深緑の毒牙', desc: '毒状態の敵が倒れると毒霧爆発。' },
  { id: 'executionCrown', setId: 'Execution', name: '処刑王の指輪', desc: '低HPの敵への処刑ダメージが増える。' }, { id: 'abyssEngine', setId: 'Execution', name: '深層機関のレリック', desc: 'Waveが深いほど追加攻撃が増える。' },
  { id: 'spiritTotem', setId: 'Legion', name: '群霊の召喚具', desc: '召喚体を追加する。' }, { id: 'mirrorShard', setId: 'Guardian', name: '反射王の盾片', desc: '敵弾を一定確率で反射する。' },
];
const names = {
  武器: ['錆びた剣', '自動弩', '破砕杖', '裂空刃'], 防具: ['旅人の外套', '硬化鎧', '障壁衣', '深層甲殻'], 指輪: ['青銅の指輪', '会心環', '処刑環', '星見の輪'],
  首飾り: ['護符', '紅蓮核', '雷紋の首飾り', '深淵首飾り'], レリック: ['古びた歯車', '深層機関', '血晶石', '奈落の核'], 靴: ['軽靴', '影走りの靴', '旋風靴', '幽歩靴'],
  手袋: ['革手袋', '射手の手袋', '裂傷手甲', '魔導グローブ'], 魔導書: ['入門書', '雷術書', '氷霜典', '嵐呼びの魔導書'], 召喚具: ['小さな笛', '霊鳥の籠', '群霊の召喚具', '契約印'],
};
const statPool = [
  ['damageMult', '攻撃%', 0.025], ['attackSpeedMult', '攻速%', 0.018], ['speedMult', '移動%', 0.014], ['hp', 'HP', 8], ['guard', '軽減', 0.004], ['critChance', '会心率', 0.008],
  ['critDamage', '会心倍率', 0.025], ['range', '射程', 5], ['magnet', '回収', 5], ['regen', '再生', 0.05], ['stoneGain', '深淵石%', 0.012], ['dropRate', 'ドロップ%', 0.004], ['rarityLuck', '高レア%', 0.006], ['xpGain', '経験値%', 0.008], ['elemental', '属性%', 0.01],
];

function rarityThreshold(autoRarity = 'None') {
  const table = { None: 0, Common: 1, Rare: 2, Epic: 3 };
  return table[autoRarity] || 0;
}

export function shouldAutoDismantle(save, item) {
  const setting = save.settings?.autoDismantleRarity || 'None';
  const threshold = rarityThreshold(setting);
  if (threshold <= 0) return false;
  const order = RARITIES[item?.rarity]?.order || 1;
  if (order >= 4) return false;
  if (item.locked) return false;
  if (save.equipment[item.slot]?.id === item.id) return false;
  return order <= threshold;
}

export function rollEquipment(wave, luck = 0, depth = 1) {
  const rw = baseRarityWeights.map((r) => ({ ...r, weight: r.weight * (1 + wave * (RARITIES[r.rarity].mult - 1) * 0.035 + luck * (RARITIES[r.rarity].order - 1)) }));
  const rarity = weightedPick(rw).rarity;
  const slot = pick(EQUIPMENT_SLOTS);
  const rarityMult = RARITIES[rarity].mult;
  const itemLevel = Math.max(1, Math.floor(wave + depth * 2 + randInt(0, 3)));
  const enhanceLevel = 0;
  const affixPower = +(1 + depth * 0.12 + wave * 0.02).toFixed(3);
  const power = Math.floor((10 + wave * 5.8) * rarityMult * Math.pow(1.095, wave));
  const stats = {};
  const statLines = [];
  const affixes = rarity === 'Common' ? 1 : rarity === 'Rare' ? 2 : rarity === 'Epic' ? 3 : 4;
  for (let i = 0; i < affixes; i++) {
    const [key, label, base] = pick(statPool);
    const v = +(base * rarityMult * (1 + wave * 0.04) * (0.75 + Math.random() * 0.55)).toFixed(4);
    stats[key] = (stats[key] || 0) + v;
    statLines.push(`${label}+${formatStat(key, v)}`);
  }

  let legendaryId = null, legendaryDesc = '', setId = null; let baseName = pick(names[slot] || [slot]);
  if (['Legendary', 'Mythic', 'Abyssal'].includes(rarity)) {
    const leg = pick(legendaryEffects); legendaryId = leg.id; legendaryDesc = leg.desc; setId = leg.setId; baseName = leg.name;
  }
  if (!setId && (RARITIES[rarity].order || 0) >= 2) setId = pick(setIds);

  const randomAffixes = rollAffixes({ rarity, itemLevel, affixPower });
  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    slot, rarity, power, stats, statLines,
    affixes: randomAffixes,
    affixPower, itemLevel,
    locked: false,
    enhanceLevel,
    sourceDepth: depth,
    sourceWave: wave,
    legendaryId, legendaryDesc, setId,
    name: `${rarity} ${baseName}`,
    waveFound: wave,
  };
}

export function formatStat(key, v) {
  if (['damageMult', 'attackSpeedMult', 'speedMult', 'guard', 'critChance', 'stoneGain', 'dropRate', 'rarityLuck', 'xpGain', 'elemental'].includes(key)) return `${Math.round(v * 100)}%`;
  if (key === 'critDamage') return `${v.toFixed(2)}x`;
  return `${Math.round(v)}`;
}

export function addEquipment(save, item) {
  const autoDismantled = shouldAutoDismantle(save, item);
  if (autoDismantled) {
    const gained = dismantleValue(item);
    save.abyssStones += gained;
    save.lifetimeStones = (save.lifetimeStones || 0) + gained;
    saveGame(save);
    return { equipped: false, autoDismantled: true, gained };
  }

  save.inventory.unshift(item);
  if (save.inventory.length > CONFIG.inventory.maxItems) save.inventory.length = CONFIG.inventory.maxItems;
  const current = save.equipment[item.slot];
  const equipped = !current || itemScore(item) > itemScore(current);
  if (equipped) save.equipment[item.slot] = item;
  saveGame(save);
  return { equipped, autoDismantled: false, gained: 0 };
}

export function itemScore(item) {
  const affixScore = (item?.affixes || []).reduce((a, x) => a + (Math.abs(x.value) || 0) * 100, 0);
  const enhanceScore = (item?.enhanceLevel || 0) * 28;
  return (item?.power || 0) + affixScore + enhanceScore + (item?.legendaryId ? 500 : 0) + (RARITIES[item?.rarity]?.order || 0) * 35 + (item?.setId ? 18 : 0);
}

export function setCounts(equipment) { const out = {}; for (const it of Object.values(equipment || {})) { if (it?.setId) out[it.setId] = (out[it.setId] || 0) + 1; } return out; }
export function toggleLock(save, itemId) { const item = save.inventory.find((x) => x.id === itemId); if (!item) return false; item.locked = !item.locked; saveGame(save); return item.locked; }

export function equipItem(save, itemId) {
  const item = save.inventory.find((x) => x.id === itemId);
  if (!item) return false;
  save.equipment[item.slot] = item;
  saveGame(save);
  return true;
}

export function dismantleValue(item) {
  const order = RARITIES[item.rarity]?.order || 1;
  const levelFactor = 1 + (item.itemLevel || 1) * 0.04;
  const enhanceRefund = 1 + (item.enhanceLevel || 0) * 0.18;
  return Math.max(1, Math.floor((item.power || 1) * order * 0.11 * levelFactor * enhanceRefund));
}

export function dismantleItem(save, itemId) {
  const idx = save.inventory.findIndex((x) => x.id === itemId);
  if (idx < 0) return 0;
  const item = save.inventory[idx];
  if (item.locked) return 0;
  const gained = dismantleValue(item);
  save.inventory.splice(idx, 1);
  if (save.equipment[item.slot]?.id === itemId) save.equipment[item.slot] = null;
  save.abyssStones += gained;
  save.lifetimeStones = (save.lifetimeStones || 0) + gained;
  saveGame(save);
  return gained;
}

export function getEnhanceCost(item) {
  const rarityOrder = RARITIES[item?.rarity]?.order || 1;
  const nextLv = (item?.enhanceLevel || 0) + 1;
  return Math.floor(25 + rarityOrder * 22 + nextLv * nextLv * 9 + (item?.itemLevel || 1) * 3.2);
}

export function canEnhance(item) {
  return (item?.enhanceLevel || 0) < (ENHANCE_CAPS[item?.rarity] || 3);
}

export function enhanceItem(save, itemId) {
  const item = save.inventory.find((x) => x.id === itemId);
  if (!item) return { ok: false, reason: 'not_found' };
  if (!canEnhance(item)) return { ok: false, reason: 'max' };
  const cost = getEnhanceCost(item);
  if ((save.abyssStones || 0) < cost) return { ok: false, reason: 'stones', cost };
  save.abyssStones -= cost;
  item.enhanceLevel = (item.enhanceLevel || 0) + 1;
  const growth = 1.08 + (RARITIES[item.rarity]?.order || 1) * 0.008;
  item.power = Math.floor((item.power || 1) * growth + 2);
  for (const [k, v] of Object.entries(item.stats || {})) {
    item.stats[k] = +(v * 1.03).toFixed(4);
  }
  item.affixPower = +(item.affixPower * 1.02 + 0.005).toFixed(4);
  enhanceAffixes(item, 1.03);

  if (save.equipment[item.slot]?.id === item.id) save.equipment[item.slot] = item;
  saveGame(save);
  return { ok: true, cost, level: item.enhanceLevel };
}

export function collectEquipmentStats(equipment = {}) {
  const items = Object.values(equipment).filter(Boolean);
  return {
    base: items.reduce((acc, it) => {
      for (const [k, v] of Object.entries(it.stats || {})) acc[k] = (acc[k] || 0) + v;
      return acc;
    }, {}),
    affix: aggregateAffixStats(items),
  };
}
