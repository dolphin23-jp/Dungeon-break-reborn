const pct = (v) => `${Math.round(v * 100)}%`;

export const AFFIX_POOL = [
  { id:'attackPercent', label:'攻撃力 +%', key:'damageMult', min:0.03, max:0.14, type:'offense', format:pct },
  { id:'attackSpeedPercent', label:'攻撃速度 +%', key:'attackSpeedMult', min:0.02, max:0.1, type:'offense', format:pct },
  { id:'cooldownReduction', label:'クールダウン短縮 +%', key:'cooldownReduction', min:0.015, max:0.09, type:'offense', format:pct },
  { id:'maxHpPercent', label:'最大HP +%', key:'hpPercent', min:0.03, max:0.16, type:'defense', format:pct },
  { id:'damageReduction', label:'被ダメージ軽減 +%', key:'damageReduction', min:0.01, max:0.07, type:'defense', format:pct },
  { id:'xpGainPercent', label:'経験値獲得量 +%', key:'xpGain', min:0.02, max:0.12, type:'reward', format:pct },
  { id:'stoneGainPercent', label:'深淵石獲得量 +%', key:'stoneGain', min:0.02, max:0.15, type:'reward', format:pct },
  { id:'dropRatePercent', label:'装備ドロップ率 +%', key:'dropRate', min:0.01, max:0.08, type:'reward', format:pct },
  { id:'fireDamage', label:'火ダメージ +%', key:'fireDamage', min:0.03, max:0.16, type:'element', format:pct },
  { id:'lightningDamage', label:'雷ダメージ +%', key:'lightningDamage', min:0.03, max:0.16, type:'element', format:pct },
  { id:'iceDamage', label:'氷ダメージ +%', key:'iceDamage', min:0.03, max:0.16, type:'element', format:pct },
  { id:'poisonDamage', label:'毒ダメージ +%', key:'poisonDamage', min:0.03, max:0.16, type:'element', format:pct },
  { id:'bleedDamage', label:'出血ダメージ +%', key:'bleedDamage', min:0.03, max:0.16, type:'element', format:pct },
  { id:'summonDamage', label:'召喚体ダメージ +%', key:'summonDamage', min:0.03, max:0.18, type:'summon', format:pct },
];

export const RARITY_AFFIX_COUNT = {
  Common: [0,1],
  Rare: [1,2],
  Epic: [2,3],
  Legendary: [3,3],
  Mythic: [3,4],
  Abyssal: [4,5],
};

function pickWithoutDup(pool, count) {
  const arr = [...pool];
  const out = [];
  for (let i = 0; i < count && arr.length; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    out.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return out;
}

export function rollAffixes({ rarity, itemLevel = 1, affixPower = 1 }) {
  const [min, max] = RARITY_AFFIX_COUNT[rarity] || [0, 1];
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const defs = pickWithoutDup(AFFIX_POOL, count);
  const scale = Math.max(0.8, affixPower) * (1 + itemLevel * 0.018);
  return defs.map((def) => {
    const raw = def.min + Math.random() * (def.max - def.min);
    const value = +(raw * scale).toFixed(4);
    return {
      id: def.id,
      label: def.label,
      key: def.key,
      value,
      text: `${def.label} ${def.format ? def.format(value) : value}`,
    };
  });
}

export function aggregateAffixStats(items = []) {
  const totals = {};
  for (const item of items) {
    for (const affix of item?.affixes || []) {
      totals[affix.key] = (totals[affix.key] || 0) + (affix.value || 0);
    }
  }
  return totals;
}

export function enhanceAffixes(item, powerMult = 1.06) {
  if (!Array.isArray(item.affixes)) return;
  item.affixes = item.affixes.map((a) => {
    const value = +(a.value * powerMult).toFixed(4);
    return { ...a, value, text: `${a.label} ${pct(value)}` };
  });
}
