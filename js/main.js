import { Game } from './core/game.js';
import { loadSave } from './core/storage.js';
import { $, showScreen, modal, closeModal } from './ui/dom.js';
import { setupMeta, renderMeta } from './ui/metaView.js';
import { format } from './core/utils.js';

class App {
  constructor() {
    this.save = loadSave();
    this.game = new Game(this, $('#gameCanvas'));
    this.bindUi();
    setupMeta(this);
    this.refreshTitle();
    this.toTitle();
  }

  bindUi() {
    $('#startRunBtn').addEventListener('click', () => this.startRun());
    $('#openMetaBtn').addEventListener('click', () => this.toMeta());
    $('#openHelpBtn').addEventListener('click', () => this.openHelp());
    $('#backTitleFromMetaBtn').addEventListener('click', () => this.toTitle());
    $('#toggleAutoBtn').addEventListener('click', () => {
      this.game.autoMove = !this.game.autoMove;
      $('#toggleAutoBtn').textContent = `移動: ${this.game.autoMove ? 'オート' : '手動'}`;
    });
    $('#pauseBtn').addEventListener('click', () => this.game.togglePause());
  }

  refreshTitle() {
    $('#titleAbyssStones').textContent = format(this.save.abyssStones);
    $('#titleBestWave').textContent = this.save.bestWave;
    $('#metaStones').textContent = format(this.save.abyssStones);
  }

  startRun() {
    closeModal();
    showScreen('#gameScreen');
    $('#toggleAutoBtn').textContent = '移動: 手動';
    this.game.start();
  }

  toMeta() {
    showScreen('#metaScreen');
    renderMeta(this);
  }

  toTitle() {
    showScreen('#titleScreen');
    this.refreshTitle();
  }

  openHelp() {
    modal('<h2>操作説明</h2><ul class="help-list"><li>移動: WASD / 方向キー / 画面左下の仮想スティック</li><li>攻撃・スキルは自動で発動します</li><li>「移動: オート」で自動移動に切り替えできます</li><li>ゲームオーバー時に深淵石を獲得し、永続強化に使用できます</li></ul><div class="modal-actions"><button id="closeHelpBtn" class="btn primary">閉じる</button></div>');
    $('#closeHelpBtn').addEventListener('click', () => closeModal());
  }
}

new App();
