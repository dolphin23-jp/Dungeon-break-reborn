import { saveGame } from '../core/storage.js';
import { DEFAULT_AUTOMATION_SETTINGS } from '../systems/automation.js';

export function renderAutomationSettings(app) {
  const box = document.querySelector('#automationSettings');
  if (!box) return;
  const settings = { ...DEFAULT_AUTOMATION_SETTINGS, ...(app.save.settings.automation || {}) };
  app.save.settings.automation = settings;

  box.innerHTML = `
    <div class="automation-grid">
      <label>自動周回 <select data-key="autoRunEnabled"><option value="false">OFF</option><option value="true">ON</option></select></label>
      <label>スキル選択 <select data-key="skillSelectionMode"><option value="manual">手動</option><option value="semiAuto">半自動</option><option value="auto">自動</option></select></label>
      <label>Wave報酬 <select data-key="waveRewardMode"><option value="manual">手動</option><option value="semiAuto">半自動</option><option value="auto">自動</option></select></label>
      <label>自動選択プリセット <select data-key="skillAutoPreset"><option>balanced</option><option>characterAffinity</option><option>highRarity</option><option>evolution</option><option>offense</option><option>defense</option><option>summon</option><option>reward</option><option>equipmentFarm</option></select></label>
      <label>自動Waveプリセット <select data-key="waveRewardPreset"><option>expFixed</option><option>abyssStone</option><option>equipment</option><option>safe</option><option>balanced</option></select></label>
      <label>自動帰還 <select data-key="autoReturnEnabled"><option value="false">OFF</option><option value="true">ON</option></select></label>
      <label>HP閾値 <select data-key="autoReturnHpThreshold"><option>10</option><option>20</option><option selected>30</option><option>40</option><option>50</option></select></label>
      <label>目標Wave <select data-key="autoReturnWaveTarget"><option>8</option><option>12</option><option>16</option><option selected>20</option><option>25</option><option>30</option></select></label>
      <label>軽量モード <select data-key="lightweightMode"><option value="false">OFF</option><option value="true">ON</option></select></label>
      <label>高速時軽量化 <select data-key="speedLightweightMode"><option value="true">ON</option><option value="false">OFF</option></select></label>
      <label>ダメージ表示 <select data-key="damageNumberMode"><option value="normal">通常</option><option value="less">少なめ</option><option value="off">非表示</option></select></label>
      <label>オーブ軽量化 <select data-key="orbOptimization"><option value="true">ON</option><option value="false">OFF</option></select></label>
      <label>敵密度 <select data-key="enemyDensityMode"><option value="enemyCount">敵数優先</option><option value="balanced">バランス</option><option value="lightweight">軽量</option></select></label>
    </div>`;

  box.querySelectorAll('select').forEach((sel) => {
    const key = sel.dataset.key;
    const value = settings[key];
    if (typeof value === 'boolean') sel.value = String(value);
    else sel.value = String(value ?? sel.value);
    sel.onchange = () => {
      const raw = sel.value;
      if (raw === 'true' || raw === 'false') settings[key] = raw === 'true';
      else if (/^\d+$/.test(raw)) settings[key] = Number(raw);
      else settings[key] = raw;
      app.save.settings.automation = settings;
      saveGame(app.save);
    };
  });
}
