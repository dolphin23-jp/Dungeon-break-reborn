import { loadSave, saveGame, exportSave, importSave } from './core/storage.js';
import { Game } from './core/game.js';
import { $, showScreen, modal, closeModal } from './ui/dom.js';
import { setupMeta, renderMeta } from './ui/metaView.js';
import { format } from './core/utils.js';
import { DEPTHS, getDepth, unlockedDepths } from './data/depths.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { equipItem, dismantleItem, toggleLock, enhanceItem, canEnhance, getEnhanceCost, AUTO_DISMANTLE_ORDER } from './systems/loot.js';
import { RARITIES } from './core/constants.js';
import { EVOLUTIONS } from './data/evolutions.js';
import { CHARACTERS, getCharacterById } from './data/characters.js';
import { summarizeMasteryRewards, calculateMasteryLevel, masteryExpForLevel } from './data/mastery.js';
import { DEPTH_MISSIONS } from './data/depthMissions.js';
import { availableChallenges } from './data/challenges.js';

class App {
  constructor() {
    this.save = loadSave();
    this.game = null;
    this.bind();
    setupMeta(this);
    this.refreshTitle();
    this.renderDepthSelect();
    this.renderCharacterSelect();
    this.renderChallengeSelect();
  }
  bind() {
    $('#startRunBtn').addEventListener('click', () => this.startRun());
    $('#openMetaBtn').addEventListener('click', () => this.toMeta());
    $('#backTitleFromMetaBtn').addEventListener('click', () => this.toTitle());
    $('#toggleAutoBtn').addEventListener('click', () => { if (!this.game) return; this.game.autoMove = !this.game.autoMove; $('#toggleAutoBtn').textContent = `移動: ${this.game.autoMove ? 'オート' : '手動'}`; if (!this.game.autoMove && this.game.speedMultiplier > 2) this.game.setSpeed(2); });
    $('#pauseBtn').addEventListener('click', () => this.game?.togglePause());
    $('#speedBtn').addEventListener('click', () => { if (!this.game) return; const idx = this.game.speedOptions.indexOf(this.game.speedMultiplier); const next = this.game.speedOptions[(idx + 1) % this.game.speedOptions.length]; this.game.setSpeed(Math.min(next, this.game.currentSpeedCap())); });
    $('#retreatBtn').addEventListener('click', () => this.game?.requestReturn());
    $('#openHelpBtn').addEventListener('click', () => this.help());
    $('#openInventoryBtn')?.addEventListener('click', () => this.showInventory());
    $('#openAchievementsBtn')?.addEventListener('click', () => this.showAchievements());
    $('#openCodexBtn')?.addEventListener('click', () => this.showCodex());
    $('#openMissionsBtn')?.addEventListener('click', () => this.showMissions());
    $('#openSaveBtn')?.addEventListener('click', () => this.showSaveTools());
    $('#openBuildBtn')?.addEventListener('click', () => this.game?.showBuild());
  }
  startRun() { showScreen('#gameScreen'); $('#battleLog').innerHTML = ''; this.game = new Game(this, $('#gameCanvas')); $('#toggleAutoBtn').textContent = '移動: 手動'; $('#speedLabel').textContent = '1x'; this.game.start(); }
  toMeta() { showScreen('#metaScreen'); renderMeta(this); }
  toTitle() { showScreen('#titleScreen'); this.refreshTitle(); this.renderDepthSelect(); this.renderCharacterSelect(); this.renderChallengeSelect(); }
  refreshTitle() {
    $('#titleAbyssStones').textContent = format(this.save.abyssStones);
    $('#titleBestWave').textContent = this.save.bestWave || 0;
    const d = getDepth(this.save.settings.selectedDepth);
    $('#titleDepthName').textContent = d.name;
    const c = getCharacterById(this.save.settings.selectedCharacter);
    $('#titleCharacterName').textContent = c.name;
    const challengeName = availableChallenges(this.save).find((x) => x.id === this.save.settings.selectedChallenge)?.name || 'なし';
    const ch = $('#titleChallengeName');
    if (ch) ch.textContent = challengeName;
  }
  renderCharacterSelect() {
    const box = $('#characterSelect'); if (!box) return;
    const selected = this.save.settings.selectedCharacter;
    box.innerHTML = CHARACTERS.map((c) => {
      const m = this.save.characterMastery?.[c.id] || { masteryLevel: 1, masteryExp: 0, highestWave: 0, highestDepth: 1 };
      return `<button class="depth-card ${c.id === selected ? 'active' : ''}" data-char="${c.id}"><strong>${c.name}</strong><span>${c.title}</span><em>熟練Lv ${m.masteryLevel || 1} / 最高W${m.highestWave || 0} / 深度${m.highestDepth || 1}</em></button>`;
    }).join('');
    box.querySelectorAll('button').forEach((btn) => btn.onclick = () => { this.save.settings.selectedCharacter = btn.dataset.char; saveGame(this.save); this.refreshTitle(); this.renderCharacterSelect(); this.renderSelectedCharacterInfo(); });
    this.renderSelectedCharacterInfo();
  }
  renderSelectedCharacterInfo() {
    const c = getCharacterById(this.save.settings.selectedCharacter);
    const m = this.save.characterMastery?.[c.id] || { masteryLevel: 1, masteryExp: 0 };
    const calc = calculateMasteryLevel(m.masteryExp || 0);
    const nextNeed = calc.nextNeed || masteryExpForLevel((calc.level || 1) + 1) || 1;
    const progress = nextNeed ? Math.min(100, Math.floor((calc.currentInLevel / nextNeed) * 100)) : 100;
    const rewards = summarizeMasteryRewards(calc.level).slice(-3);
    $('#selectedCharacterInfo').innerHTML = `<h3>${c.name} <small>${c.title}</small></h3><p>${c.description}</p><p>得意: ${c.favorableTags.join('・')}</p><p>苦手: ${c.unfavorableTags.join('・')}</p><p>固有: ${c.passive.join(' / ')}</p><div class='mastery-box'><div>熟練度 Lv${calc.level}</div><div class='bar'><div class='bar-fill xp' style='width:${progress}%'></div></div><small>${calc.currentInLevel}/${nextNeed}</small><small>最高Wave ${m.highestWave || 0} / 最高深度 ${m.highestDepth || 1}</small><small>${rewards.join(' / ') || '報酬未解放'}</small></div>`;
  }
  renderDepthSelect() { const box = $('#depthSelect'); if (!box) return; const unlocked = unlockedDepths(this.save.bestWave || 0); box.innerHTML = DEPTHS.map((d) => { const ok = unlocked.some((x) => x.id === d.id); const selected = Number(this.save.settings.selectedDepth) === d.id; return `<button class="depth-card ${selected ? 'active' : ''} ${ok ? '' : 'locked'}" data-depth="${d.id}" ${ok ? '' : 'disabled'}><strong>${d.name}</strong><span>${ok ? d.desc : `最高Wave ${d.unlockWave}で解放`}</span><em>敵HPx${d.enemyHp} / 報酬x${d.reward}</em></button>`; }).join(''); box.querySelectorAll('.depth-card:not(.locked)').forEach((btn) => btn.addEventListener('click', () => { this.save.settings.selectedDepth = Number(btn.dataset.depth); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); this.renderChallengeSelect(); })); }

  renderChallengeSelect() {
    const box = $('#challengeSelect'); if (!box) return;
    const selected = this.save.settings.selectedChallenge || 'none';
    const list = availableChallenges(this.save);
    if (!list.find((c) => c.id === selected)) this.save.settings.selectedChallenge = 'none';
    box.innerHTML = list.map((c) => `<button class="depth-card ${c.id === this.save.settings.selectedChallenge ? 'active' : ''}" data-challenge="${c.id}"><strong>${c.name}</strong><span>${c.description}</span><em>報酬 x${(c.rewardMultiplier || 1).toFixed(2)}</em></button>`).join('');
    box.querySelectorAll('button').forEach((btn) => btn.onclick = () => { this.save.settings.selectedChallenge = btn.dataset.challenge; saveGame(this.save); this.renderChallengeSelect(); this.refreshTitle(); });
  }

  showInventory() {
    const inv = [...(this.save.inventory || [])].sort((a, b) => (RARITIES[b.rarity]?.order || 0) - (RARITIES[a.rarity]?.order || 0) || b.power - a.power);
    const rows = inv.map((item) => {
      const affixLines = (item.affixes || []).map((a) => `<div class='affix-line'>・${a.text || `${a.label} ${Math.round((a.value || 0) * 100)}%`}</div>`).join('') || '<div class="affix-line">(affixなし)</div>';
      const enhanceCost = getEnhanceCost(item);
      const enhanceDisabled = !canEnhance(item) || this.save.abyssStones < enhanceCost;
      return `<div class="inventory-item rarity-${item.rarity}"><div><span class="rarity rarity-${item.rarity}">${item.rarity}</span><h3>${item.name} ${item.enhanceLevel ? `+${item.enhanceLevel}` : ''}</h3><p>${item.slot} / iLv ${item.itemLevel || 1} / Power ${format(item.power)} / ${item.statLines.join(' / ')}</p><div class='affix-list'>${affixLines}</div></div><div class="item-actions"><button class="btn small equip-one" data-id="${item.id}">装備</button><button class="btn small enhance-one" data-id="${item.id}" ${enhanceDisabled ? 'disabled' : ''}>強化 ${canEnhance(item) ? `(${enhanceCost})` : 'MAX'}</button><button class="btn small ghost lock-one" data-id="${item.id}">${item.locked ? '解除' : 'ロック'}</button><button class="btn small ghost dismantle-one" data-id="${item.id}" ${item.locked ? 'disabled' : ''}>分解</button></div></div>`;
    }).join('') || '<p class="lead">まだ装備を入手していません。</p>';

    const auto = this.save.settings.autoDismantleRarity || 'None';
    const autoOptions = AUTO_DISMANTLE_ORDER.map((r) => `<option value="${r}" ${r === auto ? 'selected' : ''}>${r} 以下を自動分解</option>`).join('');
    modal(`<h2>装備管理</h2><div class='inventory-settings'><label>自動分解:</label><select id='autoDismantleSelect'>${autoOptions}</select><small>Legendary以上/ロック中/装備中は自動分解対象外</small></div><div class="inventory-list">${rows}</div><div class="modal-actions"><button id="closeInventoryBtn" class="btn primary">閉じる</button></div>`);
    $('#autoDismantleSelect').onchange = (e) => { this.save.settings.autoDismantleRarity = e.target.value; saveGame(this.save); };
    document.querySelectorAll('.equip-one').forEach((b) => b.onclick = () => { equipItem(this.save, b.dataset.id); this.showInventory(); this.refreshTitle(); });
    document.querySelectorAll('.enhance-one').forEach((b) => b.onclick = () => { const res = enhanceItem(this.save, b.dataset.id); if (!res.ok && res.reason === 'stones') alert('深淵石が不足しています'); this.showInventory(); this.refreshTitle(); });
    document.querySelectorAll('.lock-one').forEach((b) => b.onclick = () => { toggleLock(this.save, b.dataset.id); this.showInventory(); });
    document.querySelectorAll('.dismantle-one').forEach((b) => b.onclick = () => { const gain = dismantleItem(this.save, b.dataset.id); if (gain > 0) alert(`分解: 深淵石 +${gain}`); this.showInventory(); this.refreshTitle(); });
    $('#closeInventoryBtn').onclick = closeModal;
  }

  showCodex() {
    const evoCards = EVOLUTIONS.map((e) => `<div class="achievement-card rarity-${e.rarity}"><h3>${e.name}</h3><p>条件: ${e.desc}${e.characterId ? ` / 専用: ${getCharacterById(e.characterId).name}` : ''}</p><strong>${e.rarity} / ${e.tags.join('・')}</strong></div>`).join('');
    modal(`<h2>図鑑 / 進化</h2><div class="achievement-list">${evoCards}</div><div class="modal-actions"><button id="closeCodexBtn" class="btn primary">閉じる</button></div>`); $('#closeCodexBtn').onclick = closeModal;
  }
  showAchievements() { const cards = ACHIEVEMENTS.map((a) => { const done = !!this.save.achievements[a.id]; return `<div class="achievement-card ${done ? 'done' : ''}"><h3>${done ? '達成済 ' : '未達成 '}${a.name}</h3><p>${a.desc}</p><strong>${a.rewardText}</strong></div>`; }).join(''); modal(`<h2>実績</h2><div class="achievement-list">${cards}</div><div class="modal-actions"><button id="closeAchievementsBtn" class="btn primary">閉じる</button></div>`); $('#closeAchievementsBtn').onclick = closeModal; }
  showMissions() {
    const rows = DEPTH_MISSIONS.map((m) => {
      const key = m.condition?.perCharacter ? `${m.id}:${this.save.settings.selectedCharacter}` : m.id;
      const done = !!this.save.depthMissions?.[key];
      const rewardTxt = Object.entries(m.rewards || {}).map(([k, v]) => `${k}:${v}`).join(' / ');
      return `<div class='achievement-card ${done ? 'done' : ''}'><h3>${done ? '達成済' : '未達成'} ${m.name}</h3><p>${m.description}</p><strong>${rewardTxt}</strong></div>`;
    }).join('');
    modal(`<h2>深度ミッション</h2><div class='achievement-list'>${rows}</div><div class="modal-actions"><button id="closeMissionBtn" class="btn primary">閉じる</button></div>`);
    $('#closeMissionBtn').onclick = closeModal;
  }
  showSaveTools() { modal(`<h2>セーブ管理</h2><textarea id="saveText" class="save-text"></textarea><div class="modal-actions"><button id="exportSaveBtn" class="btn">エクスポート</button><button id="importSaveBtn" class="btn danger">インポート</button><button id="closeSaveBtn" class="btn primary">閉じる</button></div>`); $('#exportSaveBtn').onclick = () => { $('#saveText').value = exportSave(this.save); }; $('#importSaveBtn').onclick = () => { try { this.save = importSave($('#saveText').value); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); this.renderCharacterSelect(); this.renderChallengeSelect(); closeModal(); } catch (e) { alert('失敗'); } }; $('#closeSaveBtn').onclick = closeModal; }
  help() { modal(`<h2>操作説明</h2><div class="help-list"><p>Phase 7: 熟練度/装備affix/装備強化/深度ミッション/チャレンジを追加。</p></div><div class="modal-actions"><button id="closeHelpBtn" class="btn primary">閉じる</button></div>`); $('#closeHelpBtn').onclick = closeModal; }
}
window.addEventListener('DOMContentLoaded', () => { window.DBR = new App(); });
