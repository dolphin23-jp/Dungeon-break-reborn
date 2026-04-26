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

class App{
  constructor(){ this.save=loadSave(); this.game=null; this.bind(); setupMeta(this); this.refreshTitle(); this.renderDepthSelect(); }
  bind(){
    $('#startRunBtn').addEventListener('click',()=>this.startRun());
    $('#openMetaBtn').addEventListener('click',()=>this.toMeta());
    $('#backTitleFromMetaBtn').addEventListener('click',()=>this.toTitle());
    $('#toggleAutoBtn').addEventListener('click',()=>{ if(!this.game)return; this.game.autoMove=!this.game.autoMove; $('#toggleAutoBtn').textContent=`移動: ${this.game.autoMove?'オート':'手動'}`; });
    $('#pauseBtn').addEventListener('click',()=>this.game?.togglePause());
    $('#openHelpBtn').addEventListener('click',()=>this.help());
    $('#openInventoryBtn')?.addEventListener('click',()=>this.showInventory());
    $('#openAchievementsBtn')?.addEventListener('click',()=>this.showAchievements());
    $('#openCodexBtn')?.addEventListener('click',()=>this.showCodex());
    $('#openSaveBtn')?.addEventListener('click',()=>this.showSaveTools());
    $('#openBuildBtn')?.addEventListener('click',()=>this.game?.showBuild());
    window.addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='m') $('#toggleAutoBtn')?.click(); if(e.key==='Escape') closeModal(); });
  }
  startRun(){ showScreen('#gameScreen'); $('#battleLog').innerHTML=''; this.game=new Game(this,$('#gameCanvas')); $('#toggleAutoBtn').textContent='移動: 手動'; this.game.start(); }
  toMeta(){ showScreen('#metaScreen'); renderMeta(this); }
  toTitle(){ showScreen('#titleScreen'); this.refreshTitle(); this.renderDepthSelect(); }
  refreshTitle(){ $('#titleAbyssStones').textContent=format(this.save.abyssStones); $('#titleBestWave').textContent=this.save.bestWave||0; const d=getDepth(this.save.settings.selectedDepth); const el=$('#titleDepthName'); if(el) el.textContent=d.name; }
  renderDepthSelect(){
    const box=$('#depthSelect'); if(!box) return;
    const unlocked=unlockedDepths(this.save.bestWave||0);
    box.innerHTML=DEPTHS.map(d=>{
      const ok=unlocked.some(x=>x.id===d.id); const selected=Number(this.save.settings.selectedDepth)===d.id;
      return `<button class="depth-card ${selected?'active':''} ${ok?'':'locked'}" data-depth="${d.id}" ${ok?'':'disabled'}><strong>${d.name}</strong><span>${ok?d.desc:`最高Wave ${d.unlockWave}で解放`}</span><em>敵HPx${d.enemyHp} / 報酬x${d.reward}</em></button>`;
    }).join('');
    box.querySelectorAll('.depth-card:not(.locked)').forEach(btn=>btn.addEventListener('click',()=>{ this.save.settings.selectedDepth=Number(btn.dataset.depth); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); }));
  }
  showInventory(){
    const inv=[...(this.save.inventory||[])].sort((a,b)=>(RARITIES[b.rarity]?.order||0)-(RARITIES[a.rarity]?.order||0) || b.power-a.power);
    const rows=inv.map(item=>`<div class="inventory-item rarity-${item.rarity}"><div><span class="rarity rarity-${item.rarity}">${item.rarity}</span><h3>${item.name}</h3><p>${item.slot} / Power ${format(item.power)} / ${item.setId?'Set: '+EQUIPMENT_SETS[item.setId]?.name+' / ':''}${item.statLines.join(' / ')}</p>${item.legendaryDesc?`<p class="legendary-desc">${item.legendaryDesc}</p>`:''}</div><div class="item-actions"><button class="btn small equip-one" data-id="${item.id}">装備</button><button class="btn small ghost lock-one" data-id="${item.id}">${item.locked?'解除':'ロック'}</button><button class="btn small ghost dismantle-one" data-id="${item.id}" ${item.locked?'disabled':''}>分解</button></div></div>`).join('') || '<p class="lead">まだ装備を入手していません。</p>';
    const equipped=Object.entries(this.save.equipment||{}).map(([slot,it])=>`<div class="equip-row rarity-${it?.rarity||'Common'}"><span>${slot}</span><strong>${it?it.name:'未装備'}</strong></div>`).join('');
    modal(`<h2>装備管理</h2><p class="lead">Phase 5ではセット効果、ロック、低レア一括分解に対応しました。Powerだけでなくセットと固有効果も見て選べます。</p><div class="two-col"><div><h3>現在装備</h3><div class="equipment-mini big">${equipped}</div><h3>セット効果</h3><div class="set-list">${Object.entries(EQUIPMENT_SETS).map(([id,set])=>{ const n=Object.values(this.save.equipment||{}).filter(x=>x?.setId===id).length; return `<div class="set-row ${n>=2?'active':''}"><strong>${set.name}</strong><span>${n}/9</span><small>2: ${set.two}<br>4: ${set.four}</small></div>`; }).join('')}</div></div><div><h3>所持装備 ${inv.length}</h3><div class="inventory-list">${rows}</div></div></div><div class="modal-actions"><button id="dismantleCommonBtn" class="btn ghost">Common/Rareを一括分解</button><button id="closeInventoryBtn" class="btn primary">閉じる</button></div>`);
    document.querySelectorAll('.equip-one').forEach(b=>b.onclick=()=>{ equipItem(this.save,b.dataset.id); this.showInventory(); this.refreshTitle(); });
    document.querySelectorAll('.lock-one').forEach(b=>b.onclick=()=>{ toggleLock(this.save,b.dataset.id); this.showInventory(); });
    document.querySelectorAll('.dismantle-one').forEach(b=>b.onclick=()=>{ dismantleItem(this.save,b.dataset.id); this.showInventory(); this.refreshTitle(); });
    $('#dismantleCommonBtn').onclick=()=>{ const ids=(this.save.inventory||[]).filter(x=>!x.locked && (RARITIES[x.rarity]?.order||0)<=2).map(x=>x.id); ids.forEach(id=>dismantleItem(this.save,id)); this.showInventory(); this.refreshTitle(); };
    $('#closeInventoryBtn').onclick=closeModal;
  }

  showCodex(){
    const evoCards=EVOLUTIONS.map(e=>{ const req=Object.entries(e.requires).map(([id,lv])=>{ const s=SKILL_POOL.find(x=>x.id===id); return (s?s.name:id)+' Lv'+lv; }).join(' + '); return `<div class="achievement-card rarity-${e.rarity}"><h3>${e.name}</h3><p>条件: ${req}</p><p>${e.desc}</p><strong>${e.rarity} / ${e.tags.join('・')}</strong></div>`; }).join('');
    const setCards=Object.entries(EQUIPMENT_SETS).map(([id,set])=>`<div class="achievement-card"><h3>${set.name}セット</h3><p>2部位: ${set.two}</p><p>4部位: ${set.four}</p><strong>装備に付与されるセットタグ</strong></div>`).join('');
    modal(`<h2>図鑑 / 進化</h2><p class="lead">Phase 5では、条件を満たすとスキルが自動進化します。装備にはセットタグが付き、2部位・4部位で追加効果が発動します。</p><h3>スキル進化</h3><div class="achievement-list">${evoCards}</div><h3>装備セット</h3><div class="achievement-list">${setCards}</div><div class="modal-actions"><button id="closeCodexBtn" class="btn primary">閉じる</button></div>`);
    $('#closeCodexBtn').onclick=closeModal;
  }
  showAchievements(){
    const cards=ACHIEVEMENTS.map(a=>{ const done=!!this.save.achievements[a.id]; return `<div class="achievement-card ${done?'done':''}"><h3>${done?'達成済 ':'未達成 '}${a.name}</h3><p>${a.desc}</p><strong>${a.rewardText}</strong></div>`; }).join('');
    modal(`<h2>実績</h2><p class="lead">達成時に深淵石や永続強化レベルが直接付与されます。</p><div class="achievement-list">${cards}</div><div class="modal-actions"><button id="closeAchievementsBtn" class="btn primary">閉じる</button></div>`);
    $('#closeAchievementsBtn').onclick=closeModal;
  }
  showSaveTools(){
    modal(`<h2>セーブ管理</h2><p class="lead">localStorageのセーブデータを文字列としてバックアップできます。</p><textarea id="saveText" class="save-text" placeholder="ここにエクスポート結果、またはインポートしたい文字列を入れます"></textarea><div class="modal-actions"><button id="exportSaveBtn" class="btn">エクスポート</button><button id="importSaveBtn" class="btn danger">インポート</button><button id="closeSaveBtn" class="btn primary">閉じる</button></div>`);
    $('#exportSaveBtn').onclick=()=>{ $('#saveText').value=exportSave(this.save); $('#saveText').select(); };
    $('#importSaveBtn').onclick=()=>{ try{ this.save=importSave($('#saveText').value); saveGame(this.save); this.refreshTitle(); this.renderDepthSelect(); alert('インポートしました。'); closeModal(); }catch(e){ alert('インポートに失敗しました。文字列を確認してください。'); } };
    $('#closeSaveBtn').onclick=closeModal;
  }
  help(){ modal(`<h2>操作説明</h2><div class="help-list"><p>PC: WASD / 矢印キーで移動。Mキーまたはボタンで手動移動とオート移動を切替。</p><p>iPad/スマホ: 左下の仮想スティックで移動。攻撃とスキルは自動発動します。</p><p>Phase 5ではスキル進化、装備セット、深淵の裂け目イベント、装備ロックを追加しました。</p><p>深度を上げるほど敵HP・攻撃・出現数が増え、深淵石と高レア装備が大きく増えます。</p></div><div class="modal-actions"><button id="closeHelpBtn" class="btn primary">閉じる</button></div>`); $('#closeHelpBtn').onclick=closeModal; }
}

window.addEventListener('DOMContentLoaded',()=>{ window.DBR = new App(); });
