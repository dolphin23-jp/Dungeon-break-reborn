import { UPGRADE_DEFS } from '../data/upgrades.js';
import { $, $$ } from './dom.js';
import { saveGame, addStones } from '../core/storage.js';
import { CONFIG } from '../core/constants.js';
import { format } from '../core/utils.js';

let bulkMode='1';
export function upgradeCost(def, lv){ return Math.floor(def.baseCost * Math.pow(def.costScale, lv)); }
function canBuy(save, def){ return save.abyssStones >= upgradeCost(def, save.upgrades[def.id]||0); }
function buyOne(save, def){ const lv=save.upgrades[def.id]||0; const cost=upgradeCost(def,lv); if(save.abyssStones<cost)return false; save.abyssStones-=cost; save.upgrades[def.id]=lv+1; return true; }
export function setupMeta(app){
  $$('.bulk-mode').forEach(b=>b.addEventListener('click',()=>{ $$('.bulk-mode').forEach(x=>x.classList.remove('active')); b.classList.add('active'); bulkMode=b.dataset.mode; }));
  $('#debugAddStonesBtn').addEventListener('click',()=>{ addStones(app.save, CONFIG.debug.stones); renderMeta(app); app.refreshTitle(); });
  $('#upgradeCategoryBtn').addEventListener('click',()=>{ const cat=prompt('一括強化するカテゴリ名を入力: 基礎 / 攻撃 / 防御 / 機動 / クリティカル / 属性 / 補助 / 報酬 / 召喚 / 処刑'); if(!cat)return; for(const def of UPGRADE_DEFS.filter(u=>u.category===cat)){ while(canBuy(app.save,def)) buyOne(app.save,def); } saveGame(app.save); renderMeta(app); });
  $('#upgradeBalancedBtn').addEventListener('click',()=>{ let guard=0,bought=true; while(bought&&guard++<10000){ bought=false; const sorted=[...UPGRADE_DEFS].sort((a,b)=>(app.save.upgrades[a.id]||0)-(app.save.upgrades[b.id]||0)); for(const def of sorted){ if(buyOne(app.save,def)){bought=true;break;} } } saveGame(app.save); renderMeta(app); });
}
export function renderMeta(app){
  const save=app.save; $('#metaStones').textContent=format(save.abyssStones); $('#metaTotalLv').textContent=Object.values(save.upgrades).reduce((a,b)=>a+b,0);
  const list=$('#upgradeList'); list.innerHTML='';
  for(const def of UPGRADE_DEFS){ const lv=save.upgrades[def.id]||0; const card=document.createElement('div'); card.className='upgrade-card'; const cost=upgradeCost(def,lv); card.innerHTML=`<div><h3>${def.name} <small>Lv.${lv}</small></h3><p>${def.desc}</p><div class="upgrade-meta">${def.category} / 次コスト ${format(cost)}</div></div><button class="btn small">強化</button>`; card.querySelector('button').addEventListener('click',()=>{ let n=bulkMode==='max'?999999:Number(bulkMode); for(let i=0;i<n;i++){ if(!buyOne(save,def))break; } saveGame(save); renderMeta(app); app.refreshTitle(); }); list.appendChild(card); }
}
