import { loadSave, saveGame } from './core/storage.js';
import { Game } from './core/game.js';
import { $, showScreen, modal, closeModal } from './ui/dom.js';
import { setupMeta, renderMeta } from './ui/metaView.js';
import { format } from './core/utils.js';

class App{
  constructor(){ this.save=loadSave(); this.game=null; this.bind(); setupMeta(this); this.refreshTitle(); }
  bind(){
    $('#startRunBtn').addEventListener('click',()=>this.startRun());
    $('#openMetaBtn').addEventListener('click',()=>this.toMeta());
    $('#backTitleFromMetaBtn').addEventListener('click',()=>this.toTitle());
    $('#toggleAutoBtn').addEventListener('click',()=>{ if(!this.game)return; this.game.autoMove=!this.game.autoMove; $('#toggleAutoBtn').textContent=`移動: ${this.game.autoMove?'オート':'手動'}`; });
    $('#pauseBtn').addEventListener('click',()=>this.game?.togglePause());
    $('#openHelpBtn').addEventListener('click',()=>this.help());
    window.addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='m') $('#toggleAutoBtn')?.click(); if(e.key==='Escape') closeModal(); });
  }
  startRun(){ showScreen('#gameScreen'); $('#battleLog').innerHTML=''; this.game=new Game(this,$('#gameCanvas')); $('#toggleAutoBtn').textContent='移動: 手動'; this.game.start(); }
  toMeta(){ showScreen('#metaScreen'); renderMeta(this); }
  toTitle(){ showScreen('#titleScreen'); this.refreshTitle(); }
  refreshTitle(){ $('#titleAbyssStones').textContent=format(this.save.abyssStones); $('#titleBestWave').textContent=this.save.bestWave||0; }
  help(){ modal(`<h2>操作説明</h2><div class="help-list"><p>PC: WASD / 矢印キーで移動。Mキーまたはボタンで手動移動とオート移動を切替。</p><p>iPad/スマホ: 左下の仮想スティックで移動。攻撃とスキルは自動発動します。</p><p>敵を倒して経験値を回収するとレベルアップし、スキルカードを選択できます。Waveを進めるほど敵・報酬・深淵石がインフレします。</p><p>Phase 2では敵弾、範囲予兆、役割別の敵、装備ドロップ、自動装備、Legendary固有効果が有効です。装備はスロットごとにPowerが高いものへ自動更新されます。</p></div><div class="modal-actions"><button id="closeHelpBtn" class="btn primary">閉じる</button></div>`); $('#closeHelpBtn').onclick=closeModal; }
}

window.addEventListener('DOMContentLoaded',()=>{ window.DBR = new App(); });
