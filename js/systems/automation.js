import { SKILL_AUTO_PRESETS, AUTO_REWARD_PRESETS, hasCategory, rarityScore } from '../data/automationPresets.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { SKILL_POOL } from '../data/skills.js';

export const DEFAULT_AUTOMATION_SETTINGS = {
  autoRunEnabled: false,
  skillSelectionMode: 'manual',
  waveRewardMode: 'manual',
  autoReturnEnabled: false,
  autoReturnHpThreshold: 30,
  autoReturnWaveTarget: 20,
  skillAutoPreset: 'balanced',
  waveRewardPreset: 'expFixed',
  lightweightMode: false,
  speedLightweightMode: true,
  damageNumberMode: 'normal',
  orbOptimization: true,
  enemyDensityMode: 'balanced',
  autoLogLimit: 50,
};

export class AutomationSystem {
  constructor(game) {
    this.game = game;
    this.settings = { ...DEFAULT_AUTOMATION_SETTINGS, ...(game.save.settings?.automation || {}) };
    this.skillTimer = 0;
    this.rewardTimer = 0;
    this.pendingSkillOptions = null;
    this.pendingRewardChoices = null;
  }

  isSkillAuto() { return this.settings.skillSelectionMode === 'auto'; }
  isSkillSemi() { return this.settings.skillSelectionMode === 'semiAuto'; }
  isRewardAuto() { return this.settings.waveRewardMode === 'auto'; }
  isRewardSemi() { return this.settings.waveRewardMode === 'semiAuto'; }

  evaluateSkill(skill) {
    const p = this.game.player;
    const lv = this.game.runSkillLevels[skill.id] || 0;
    if (lv >= skill.maxLevel) return -99999;

    const preset = SKILL_AUTO_PRESETS[this.settings.skillAutoPreset] || SKILL_AUTO_PRESETS.balanced;
    const hpRate = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    let score = rarityScore(skill.rarity) * 100 * preset.rarity;

    const tags = skill.tags || [];
    if (tags.some((t) => this.game.selectedCharacter.favorableTags.includes(t))) score += 26 * preset.affinity;
    if (tags.some((t) => this.game.selectedCharacter.unfavorableTags.includes(t))) score -= 20;

    if (hasCategory(tags, 'offense')) score += 14 * preset.offense;
    if (hasCategory(tags, 'defense')) score += 14 * preset.defense;
    if (hasCategory(tags, 'summon')) score += 14 * preset.summon;
    if (hasCategory(tags, 'reward')) score += 14 * preset.reward;
    if (hasCategory(tags, 'evolution')) score += 10 * preset.evolution;

    if ((lv > 0) && lv < skill.maxLevel) score += 8; // build continuity
    if (lv === 0 && skill.rarity === 'Common' && (tags.includes('基礎能力') || tags.includes('報酬'))) score += 7;

    if (hpRate < 0.45 && hasCategory(tags, 'defense')) score += 28;
    if (this.settings.waveRewardPreset === 'expFixed' && hasCategory(tags, 'reward')) score += 7;

    score += this.evolutionScore(skill.id) * preset.evolution;
    score += Math.random() * 0.75;
    return score;
  }

  evolutionScore(skillId) {
    let score = 0;
    for (const evo of EVOLUTIONS) {
      const req = evo.requires || {};
      if (!req[skillId]) continue;
      let progress = 0;
      let total = 0;
      for (const [id, lv] of Object.entries(req)) {
        total += lv;
        progress += Math.min(lv, this.game.runSkillLevels[id] || 0);
      }
      score += Math.max(0, (progress / Math.max(1, total)) * 45);
      const current = this.game.runSkillLevels[skillId] || 0;
      if (current + 1 >= req[skillId]) score += 24;
    }
    return score;
  }

  pickSkill(options = []) {
    if (!options.length) return null;
    const ranked = options
      .map((skill) => ({ skill, score: this.evaluateSkill(skill) }))
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.skill || options[0] || null;
  }

  pickWaveReward(choices = []) {
    const preset = AUTO_REWARD_PRESETS[this.settings.waveRewardPreset] || AUTO_REWARD_PRESETS.expFixed;
    if (!choices.length) return null;
    if (preset.mode === 'exp') return choices.find((c) => c.kind === 'xp') || choices[0];
    if (preset.mode === 'stone') return choices.find((c) => c.kind === 'stone') || choices[0];
    if (preset.mode === 'equipment') return choices.find((c) => c.kind === 'equipment') || choices[0];
    if (preset.mode === 'safe') {
      const hpRate = this.game.player.hp / Math.max(1, this.game.player.maxHp);
      if (hpRate < 0.45) return choices.find((c) => c.kind === 'heal') || choices[0];
      return choices.find((c) => c.kind === 'xp') || choices[0];
    }
    // balanced
    const hpRate = this.game.player.hp / Math.max(1, this.game.player.maxHp);
    if (hpRate < 0.4) return choices.find((c) => c.kind === 'heal') || choices[0];
    return choices.find((c) => c.kind === 'xp') || choices[0];
  }

  shouldAutoReturn() {
    if (!this.settings.autoReturnEnabled) return null;
    const hpRate = this.game.player.hp / Math.max(1, this.game.player.maxHp);
    if (hpRate * 100 <= this.settings.autoReturnHpThreshold) {
      return `HP ${this.settings.autoReturnHpThreshold}%以下`;
    }
    if (this.game.wave >= this.settings.autoReturnWaveTarget) {
      return `Wave ${this.settings.autoReturnWaveTarget}到達`;
    }
    return null;
  }

  normalizeSettings() {
    if (!SKILL_AUTO_PRESETS[this.settings.skillAutoPreset]) this.settings.skillAutoPreset = 'balanced';
    if (!AUTO_REWARD_PRESETS[this.settings.waveRewardPreset]) this.settings.waveRewardPreset = 'expFixed';
    this.settings.autoReturnHpThreshold = Math.max(10, Math.min(50, Number(this.settings.autoReturnHpThreshold || 30)));
    this.settings.autoReturnWaveTarget = Math.max(4, Math.min(999, Number(this.settings.autoReturnWaveTarget || 20)));
    this.settings.autoLogLimit = Math.max(20, Math.min(100, Number(this.settings.autoLogLimit || 50)));
  }

  allSkillModes() { return ['manual', 'semiAuto', 'auto']; }
  allRewardModes() { return ['manual', 'semiAuto', 'auto']; }
  allSkillPresets() { return Object.keys(SKILL_AUTO_PRESETS); }
  allWavePresets() { return Object.keys(AUTO_REWARD_PRESETS); }
  allDensityModes() { return ['enemyCount', 'balanced', 'lightweight']; }
}

export function isValidSkill(skillId) {
  return SKILL_POOL.some((s) => s.id === skillId);
}
