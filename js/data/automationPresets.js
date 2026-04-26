const CATEGORY_SETS = {
  offense: ['火', '雷', '氷', '毒', '出血', '処刑', 'クリティカル'],
  defense: ['防御', '障壁', '反射', '回避', '回復', '不屈'],
  summon: ['召喚'],
  reward: ['報酬', '基礎能力'],
  evolution: ['処刑', '設置', '雷', '火', '氷', '毒', '召喚', '出血'],
};

export const SKILL_AUTO_PRESETS = {
  balanced: { rarity: 1.1, affinity: 1.1, offense: 1, defense: 1, summon: 0.9, reward: 0.95, evolution: 1.05 },
  characterAffinity: { rarity: 1, affinity: 1.8, offense: 1, defense: 1, summon: 1, reward: 0.9, evolution: 1.1 },
  highRarity: { rarity: 2, affinity: 0.95, offense: 1, defense: 1, summon: 1, reward: 0.85, evolution: 1.1 },
  evolution: { rarity: 1, affinity: 1, offense: 1, defense: 1, summon: 1, reward: 0.8, evolution: 2.2 },
  offense: { rarity: 1.05, affinity: 1, offense: 2, defense: 0.7, summon: 0.8, reward: 0.85, evolution: 1 },
  defense: { rarity: 1.05, affinity: 1, offense: 0.8, defense: 2.1, summon: 0.85, reward: 0.9, evolution: 1 },
  summon: { rarity: 1, affinity: 1, offense: 0.85, defense: 0.9, summon: 2.3, reward: 0.9, evolution: 1 },
  reward: { rarity: 0.95, affinity: 1, offense: 0.8, defense: 0.9, summon: 0.8, reward: 2.4, evolution: 0.9 },
  equipmentFarm: { rarity: 1.3, affinity: 1, offense: 0.9, defense: 1.2, summon: 0.8, reward: 2.0, evolution: 1 },
};

export const AUTO_REWARD_PRESETS = {
  expFixed: { mode: 'exp', value: 1.3 },
  abyssStone: { mode: 'stone', value: 1 },
  equipment: { mode: 'equipment', value: 1 },
  safe: { mode: 'safe', value: 1 },
  balanced: { mode: 'balanced', value: 1 },
};

export function hasCategory(tags = [], category = 'offense') {
  const set = CATEGORY_SETS[category] || [];
  return tags.some((tag) => set.includes(tag));
}

export function rarityScore(rarity = 'Common') {
  return {
    Common: 1,
    Rare: 1.35,
    Epic: 1.7,
    Legendary: 2.5,
    Mythic: 3.4,
    Abyssal: 4.2,
  }[rarity] || 1;
}
