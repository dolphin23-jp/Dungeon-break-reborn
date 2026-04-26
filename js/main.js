import { loadSave, saveGame, exportSave, importSave } from './core/storage.js';
import { Game } from './core/game.js';
import { $, showScreen, modal, closeModal } from './ui/dom.js';
import { setupMeta, renderMeta } from './ui/metaView.js';
import { format } from './core/utils.js';
import { DEPTHS, getDepth, unlockedDepths } from './data/depths.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { equipItem, dismantleItem, toggleLock, EQUIPMENT_SETS } from './systems/loot.js';
import { RARITIES } from './core/constants.js';
import { EVOLUTIONS } from './data/evolutions.js';
import { SKILL_POOL } from './data/skills.js';
import { CHARACTERS, getCharacterById } from './data/characters.js';

class App{
  constructor(){ this.save=loadSave(); this.game=null; this.bind(); setupMeta(this); this.refreshTitle(); this.renderDepthSelect(); this.renderCharacterSelect(); }
  bind(){
    $('#startRunBtn').addEventListener('click',()=>this.startRun());
    $('#openMetaBtn').addEventListener('click',()=>this.toMeta());
    $('#backTitleFromMetaBtn').addEventListener('click',()=>this.toTitle());
    $('#toggleAutoBtn').addEventListener('click',()=>{ if(!this.game)return; this.game.autoMove=!this.game.autoMove; $('#toggleAutoBtn').textContent=`移動: ${this.game.autoMove?'オート':'手動'}`; if(!this.game.autoMove&&this.game.speedMultiplier>2) this.game.setSpeed(2); });
    $('#pauseBtn').addEventListener('click',()=>this.game?.togglePause());
    $('#speedBtn').addEventListener('click',()=>{ if(!this.game) return; const idx=this.game.speedOptions.indexOf(this.game.speedMultiplier); const next=this.game.speedOptions[(idx+1)%this.game.speedOptions.length]; this.game.setSpeed(Math.min(next,this.game.currentSpeedCap())); });
    $('#retreatBtn').addEventListener('click',()=>this.game?.requestReturn());
    $('#openHelpBtn').addEventListener('click',()=>this.help());
    $('#openInventoryBtn')?.addEventListener('click',()=>this.showInventory());
    $('#openAchievementsBtn')?.addEventListener('click',()=>this.showAchievements());
    $('#openCodexBtn')?.addEventListener('click',()=>this.showCodex());
    $('#openSaveBtn')?.addEventListener('click',()=>this.showSaveTools());
    $('#openBuildBtn')?.addEventListener('click',()=>this.game?.showBuild());
  }
  startRun(){ showScreen('#gameScreen'); $('#battleLog').innerHTML=''; this.game=new Game(this,$('#gameCanvas')); $('#toggleAutoBtn').textContent='移動: 手動'; $('#speedLabel').textContent='1x'; this.game.start(); }
  toMeta(){ showScreen('#metaScreen'); renderMeta(this); }
  toTitle(){ showScreen('#titleScreen'); this.refreshTitle(); this.renderDepthSelect(); this.renderCharacterSelect(); }
  refreshTitle(){ $('#titleAbyssStones').textContent=format(this.save.abyssStones); $('#titleBestWave').textContent=this.save.bestWave||0; const d=getDepth(this.save.settings.selectedDepth); $('#titleDepthName').textContent=d.name; const c=getCharacterById(this.save.settings.selectedCharacter); $('#titleCharacterName').textContent=c.name; }
  renderCharacterSelect(){
    const box=$('#characterSelect'); if(!box) return;
    const selected=this.save.settings.selectedCharacter;
    box.innerHTML=CHARACTERS.map(c=>`<button class="depth-card ${c.id===selected?'active':''}" data-char="${c.id}"><strong>${c.name}</strong><span>${c.title}</span><em>得意: ${c.favorableTags.join(' / ')}</em></button>`).join('');
    box.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ this.save.settings.selectedCharacter=btn.dataset.char; saveGame(this.save); this.refreshTitle(); this.renderCharacterSelect(); this.renderSelectedCharacterInfo(); });
    this.renderSelectedCharacterInfo();
  }
  renderSelectedCharacterInfo(){
    const c=getCharacterById(this.save.settings.selectedCharacter);
    $('#selectedCharacterInfo').innerHTML=`<h3>${c.name} <small>${c.title}</small></h3><p>${c.description}</p><p>得意: ${c.favorableTags.join('・')}</p><p>苦手: ${c.unfavorableTags.join('・')}</p><p>固有: ${c.passive.join(' / ')}</p>`;
  }
  renderDepthSelect(){ const box=$('#depthSelect'); if(!box) return; const unlocked=unlockedDepths(this.save.bestWave||0); box.innerHTML=DEPTHS.map(d=>{ const ok=unlocked.some(x=>x.id===d.id); const selected=Number(this.save.settings.selectedDepth)===d.id; return `<button class="depth-card ${selected?'active':''} ${ok?'':'locked'}" data-depth="${d.id}" ${ok?'':'disabled'}><strong>${d.name}</strong><span>${ok?d.desc:`最高Wave ${d.unlockWave}で解放`}</span><em>敵HPx${d.enemyHp} / 報酬x${d.reward}</em></button>`; }).join(''); box.querySelectorAll('.depth-card:not(.locked)').forEach(btn=>btn.addEventListener('click',()=>{ this.save.settings.selectedDepth=Number(btn.dataset.depth); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); })); }
  showInventory(){ /* keep existing simplified */
    const inv=[...(this.save.inventory||[])].sort((a,b)=>(RARITIES[b.rarity]?.order||0)-(RARITIES[a.rarity]?.order||0) || b.power-a.power);
    const rows=inv.map(item=>`<div class="inventory-item rarity-${item.rarity}"><div><span class="rarity rarity-${item.rarity}">${item.rarity}</span><h3>${item.name}</h3><p>${item.slot} / Power ${format(item.power)} / ${item.statLines.join(' / ')}</p></div><div class="item-actions"><button class="btn small equip-one" data-id="${item.id}">装備</button><button class="btn small ghost lock-one" data-id="${item.id}">${item.locked?'解除':'ロック'}</button><button class="btn small ghost dismantle-one" data-id="${item.id}" ${item.locked?'disabled':''}>分解</button></div></div>`).join('') || '<p class="lead">まだ装備を入手していません。</p>';
    modal(`<h2>装備管理</h2><div class="inventory-list">${rows}</div><div class="modal-actions"><button id="closeInventoryBtn" class="btn primary">閉じる</button></div>`);
    document.querySelectorAll('.equip-one').forEach(b=>b.onclick=()=>{ equipItem(this.save,b.dataset.id); this.showInventory(); this.refreshTitle(); });
    document.querySelectorAll('.lock-one').forEach(b=>b.onclick=()=>{ toggleLock(this.save,b.dataset.id); this.showInventory(); });
    document.querySelectorAll('.dismantle-one').forEach(b=>b.onclick=()=>{ dismantleItem(this.save,b.dataset.id); this.showInventory(); this.refreshTitle(); });
    $('#closeInventoryBtn').onclick=closeModal;
  }
  showCodex(){
    const evoCards=EVOLUTIONS.map(e=>`<div class="achievement-card rarity-${e.rarity}"><h3>${e.name}</h3><p>条件: ${e.desc}${e.characterId?` / 専用: ${getCharacterById(e.characterId).name}`:''}</p><strong>${e.rarity} / ${e.tags.join('・')}</strong></div>`).join('');
    modal(`<h2>図鑑 / 進化</h2><div class="achievement-list">${evoCards}</div><div class="modal-actions"><button id="closeCodexBtn" class="btn primary">閉じる</button></div>`); $('#closeCodexBtn').onclick=closeModal;
  }
  showAchievements(){ const cards=ACHIEVEMENTS.map(a=>{ const done=!!this.save.achievements[a.id]; return `<div class="achievement-card ${done?'done':''}"><h3>${done?'達成済 ':'未達成 '}${a.name}</h3><p>${a.desc}</p><strong>${a.rewardText}</strong></div>`; }).join(''); modal(`<h2>実績</h2><div class="achievement-list">${cards}</div><div class="modal-actions"><button id="closeAchievementsBtn" class="btn primary">閉じる</button></div>`); $('#closeAchievementsBtn').onclick=closeModal; }
  showSaveTools(){ modal(`<h2>セーブ管理</h2><textarea id="saveText" class="save-text"></textarea><div class="modal-actions"><button id="exportSaveBtn" class="btn">エクスポート</button><button id="importSaveBtn" class="btn danger">インポート</button><button id="closeSaveBtn" class="btn primary">閉じる</button></div>`); $('#exportSaveBtn').onclick=()=>{ $('#saveText').value=exportSave(this.save); }; $('#importSaveBtn').onclick=()=>{ try{ this.save=importSave($('#saveText').value); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); this.renderCharacterSelect(); closeModal(); }catch(e){ alert('失敗'); } }; $('#closeSaveBtn').onclick=closeModal; }
  help(){ modal(`<h2>操作説明</h2><div class="help-list"><p>Phase 6: キャラクター選択、帰還、速度切替(1x/2x/3x/5x)を追加。</p></div><div class="modal-actions"><button id="closeHelpBtn" class="btn primary">閉じる</button></div>`); $('#closeHelpBtn').onclick=closeModal; }
}
window.addEventListener('DOMContentLoaded',()=>{ window.DBR = new App(); });
