import { CONFIG, GAME_STATE, RARITIES } from './constants.js';
import { getDepth } from '../data/depths.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { clamp, distSq, format, pick, weightedPick } from './utils.js';
import { Player } from '../entities/player.js';
import { InputSystem } from '../systems/input.js';
import { CombatSystem } from '../systems/combat.js';
import { WaveSystem } from '../systems/wave.js';
import { Renderer } from '../ui/renderer.js';
import { $, modal, closeModal } from '../ui/dom.js';
import { SKILL_POOL, SKILL_RARITY_WEIGHTS } from '../data/skills.js';
import { saveGame } from './storage.js';
import { rollEquipment, addEquipment } from '../systems/loot.js';

export class Game{
  constructor(app, canvas){
    this.app=app; this.save=app.save; this.canvas=canvas; this.renderer=new Renderer(canvas); this.input=new InputSystem(canvas); this.combat=new CombatSystem(this); this.waveSystem=new WaveSystem(this); this.last=0; this.raf=0;
  }
  start(){
    this.depth=getDepth(this.save.settings?.selectedDepth || 1); this.save.maxDepthStarted=Math.max(this.save.maxDepthStarted||1,this.depth.id); saveGame(this.save); this.player=new Player(this.save); this.enemies=[]; this.projectiles=[]; this.pickups=[]; this.effects=[]; this.hazards=[]; this.wave=1; this.runStones=0; this.kills=0; this.bossKillsThisRun=0; this.runSkills=[]; this.runDrops=[]; this.autoMove=false; this.pendingLevelUps=0; this.state=GAME_STATE.RUNNING; this.waveSystem.startWave(this.wave); this.log('探索開始: '+this.depth.name+' / 報酬x'+this.depth.reward); this.last=performance.now(); cancelAnimationFrame(this.raf); this.raf=requestAnimationFrame(t=>this.loop(t));
  }
  loop(t){
    const dt=Math.min(.033,(t-this.last)/1000||0); this.last=t;
    if(this.state===GAME_STATE.RUNNING) this.update(dt);
    this.renderer.render(this); this.updateHud();
    this.raf=requestAnimationFrame(n=>this.loop(n));
  }
  update(dt){
    const input=this.input.update();
    const autoDir=this.autoMove?this.getAutoDir():null;
    this.player.update(dt,input,autoDir);
    this.waveSystem.update(dt); this.combat.update(dt);
    for(const e of this.enemies) e.update(dt,this);
    this.updatePickups(dt); this.cleanupDead(); this.effects=this.effects.filter(f=>(f.life-=dt)>0);
    if(this.player.hp<=0) this.gameOver();
  }
  getAutoDir(){
    let ax=0, ay=0; const p=this.player;
    for(const e of this.enemies){ const dx=p.x-e.x, dy=p.y-e.y, d2=dx*dx+dy*dy; if(d2<165*165){ const inv=1/Math.max(40,Math.sqrt(d2)); ax+=dx*inv; ay+=dy*inv; } }
    if(Math.abs(ax)+Math.abs(ay)<.05){ const target=this.pickups[0]||this.enemies[0]; if(target){ ax=target.x-p.x; ay=target.y-p.y; } }
    const l=Math.hypot(ax,ay)||1; return {x:ax/l,y:ay/l};
  }
  updatePickups(dt){
    const p=this.player;
    for(let i=this.pickups.length-1;i>=0;i--){ const it=this.pickups[i]; const d2=distSq(p,it); const attract=(p.magnet+it.r)**2;
      if(d2<attract){ const d=Math.sqrt(d2)||1; it.x+=(p.x-it.x)/d*380*dt; it.y+=(p.y-it.y)/d*380*dt; }
      if(d2<(p.r+it.r+5)**2){
        if(it.kind==='xp'){ const ups=p.gainXp(it.value); this.pendingLevelUps+=ups; if(ups>0)this.openLevelUp(); }
        if(it.kind==='stone'){ this.runStones+=it.value; }
        this.pickups.splice(i,1);
      }
    }
  }
  cleanupDead(){
    for(let i=this.enemies.length-1;i>=0;i--){ const e=this.enemies[i]; if(e.hp<=0){ this.onEnemyKilled(e); this.enemies.splice(i,1); } }
  }
  onEnemyKilled(e){
    const p=this.player;
    this.kills++; if(e.flags.boss) this.bossKillsThisRun++;
    this.pickups.push({kind:'xp',x:e.x,y:e.y,r:7,value:e.xp});
    const stoneChance=e.flags.boss?1:e.flags.elite?.55:.1;
    if(Math.random()<stoneChance){
      const value=Math.ceil((e.flags.boss?30:e.flags.elite?8:3)*Math.pow(1.27,this.wave-1)*(1+p.stoneGain)*this.depth.reward);
      this.pickups.push({kind:'stone',x:e.x+8,y:e.y-8,r:6,value});
    }
    if(e.flags.explode){
      this.hazards.push({x:e.x,y:e.y,r:92,timer:.34,damage:e.damage*1.7,color:'#ff5d73'});
      this.effects.push({type:'telegraph',x:e.x,y:e.y,r:92,life:.34,color:'#ff5d73'});
    }
    if(p.flags.fireExplosion){ this.combat.explosion(e.x,e.y,70+8*p.flags.fireExplosion,p.damage*(.42+.1*p.flags.fireExplosion)*(1+p.elemental),'#ff8a56'); }
    if(p.flags.poisonBurst && e.poison>0){ this.combat.explosion(e.x,e.y,86+8*p.flags.poisonBurst,p.damage*(.6+.14*p.flags.poisonBurst)*(1+p.elemental),'#76f2aa'); }
    if(e.flags.boss || e.flags.elite || Math.random() < (.035 + p.dropRate + this.wave*.002)){
      const eq=rollEquipment(this.wave,p.rarityLuck + this.depth.rare); this.runDrops.push(eq); if((RARITIES[eq.rarity]?.order||0)>=4) this.save.legendaryFound=(this.save.legendaryFound||0)+1;
      const equipped=addEquipment(this.save,eq);
      this.log(`${equipped?'装備更新':'装備入手'}: ${eq.name} [${eq.slot}] Power ${format(eq.power)} ${eq.statLines.join(' / ')}${eq.legendaryDesc?' / '+eq.legendaryDesc:''}`);
      this.floatText(e.x,e.y,eq.rarity,eq.rarity==='Legendary'?'#ffd36e':'#fff');
    }
  }
  nextWave(){
    this.wave++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); saveGame(this.save); this.waveSystem.startWave(this.wave); const bonus=Math.ceil(Math.pow(this.wave,1.85)*(1+this.player.stoneGain)*this.depth.reward); this.runStones+=bonus; this.log(`Wave突破報酬: 深淵石 +${format(bonus)}`);
  }
  chooseSkillOptions(){
    const options=[]; const used=new Set();
    while(options.length<3){ const rarity=weightedPick(SKILL_RARITY_WEIGHTS).rarity; const candidates=SKILL_POOL.filter(s=>s.rarity===rarity&&!used.has(s.id)); const s=pick(candidates.length?candidates:SKILL_POOL.filter(x=>!used.has(x.id))); if(!s)break; used.add(s.id); options.push(s); }
    return options;
  }
  openLevelUp(){
    if(this.state!==GAME_STATE.RUNNING)return; this.state=GAME_STATE.LEVELUP; const options=this.chooseSkillOptions();
    modal(`<h2>レベルアップ！</h2><p class="lead">スキルを1つ選択してください。属性・防御・召喚・処刑など、今後のビルドの核になります。</p><div class="skill-grid">${options.map((s,i)=>`<button class="skill-card rarity-${s.rarity}" data-i="${i}"><span class="rarity rarity-${s.rarity}">${s.rarity}</span><h3>${s.name}</h3><p>${s.desc}</p><div class="tag-row">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></button>`).join('')}</div>`);
    document.querySelectorAll('.skill-card').forEach(btn=>btn.addEventListener('click',()=>{ const s=options[Number(btn.dataset.i)]; s.apply(this.player); this.runSkills.push(s); this.log(`${s.name} を習得`); this.pendingLevelUps--; closeModal(); this.state=GAME_STATE.RUNNING; if(this.pendingLevelUps>0) setTimeout(()=>this.openLevelUp(),80); }));
  }
  gameOver(){
    this.state=GAME_STATE.GAMEOVER; this.save.totalRuns++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); this.save.totalKills=(this.save.totalKills||0)+this.kills; this.save.totalBossKills=(this.save.totalBossKills||0)+this.bossKillsThisRun; const total=Math.ceil((this.runStones + Math.pow(this.wave,2.02) + this.kills*.22)*this.depth.reward); this.save.abyssStones+=total; this.save.lifetimeStones=(this.save.lifetimeStones||0)+total; const achievementMsgs=this.unlockAchievements(); saveGame(this.save); this.app.refreshTitle();
    modal(`<h2>ゲームオーバー</h2><p class="lead">探索結果が保存されました。今回の深度: ${this.depth.name}</p><div class="result-grid"><div><span>到達Wave</span><strong>${this.wave}</strong></div><div><span>撃破数</span><strong>${this.kills}</strong></div><div><span>獲得深淵石</span><strong>${format(total)}</strong></div><div><span>Boss撃破</span><strong>${this.bossKillsThisRun}</strong></div><div><span>習得スキル</span><strong>${this.runSkills.length}</strong></div><div><span>装備入手</span><strong>${this.runDrops.length}</strong></div></div>${achievementMsgs.length?`<div class="notice-list">${achievementMsgs.map(x=>`<div>${x}</div>`).join('')}</div>`:''}<div class="modal-actions"><button id="retryBtn" class="btn primary">再挑戦</button><button id="buildBtn" class="btn">ビルド確認</button><button id="toTitleBtn" class="btn">タイトルへ</button><button id="toMetaBtn" class="btn">永続強化へ</button></div>`);
    $('#retryBtn').onclick=()=>{closeModal();this.app.startRun();}; $('#buildBtn').onclick=()=>this.showBuild(); $('#toTitleBtn').onclick=()=>{closeModal();this.app.toTitle();}; $('#toMetaBtn').onclick=()=>{closeModal();this.app.toMeta();};
  }
  unlockAchievements(){
    const msgs=[];
    for(const a of ACHIEVEMENTS){
      if(!this.save.achievements[a.id] && a.condition(this.save)){
        this.save.achievements[a.id]=true;
        if(a.upgrade) this.save.upgrades[a.upgrade]=(this.save.upgrades[a.upgrade]||0)+(a.amount||1);
        if(a.stones) this.save.abyssStones+=a.stones;
        msgs.push('実績解除: '+a.name+' / '+a.rewardText);
      }
    }
    for(const m of msgs) this.log(m);
    return msgs;
  }
  showBuild(){
    const skills=this.runSkills.length?this.runSkills.map(s=>'<li><strong>'+s.name+'</strong> <span>'+s.rarity+'</span></li>').join(''):'<li>なし</li>';
    const drops=this.runDrops.slice(0,20).map(d=>'<li class="rarity-'+d.rarity+'"><strong>'+d.name+'</strong> ['+d.slot+'] Power '+format(d.power)+'</li>').join('') || '<li>なし</li>';
    modal('<h2>今回のビルド</h2><div class="two-col"><div><h3>習得スキル</h3><ul class="compact-list">'+skills+'</ul></div><div><h3>入手装備</h3><ul class="compact-list">'+drops+'</ul></div></div><div class="modal-actions"><button id="closeBuildBtn" class="btn primary">閉じる</button></div>');
    $('#closeBuildBtn').onclick=closeModal;
  }
  togglePause(){ if(this.state===GAME_STATE.RUNNING){this.state=GAME_STATE.PAUSED;this.log('一時停止');} else if(this.state===GAME_STATE.PAUSED){this.state=GAME_STATE.RUNNING;this.log('再開');} }
  updateHud(){ const p=this.player; if(!p)return; $('#hudWave').textContent=this.wave; $('#hudLevel').textContent=p.level; $('#hudStones').textContent=format(this.runStones); $('#hudEnemies').textContent=this.enemies.length; $('#hpText').textContent=`${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`; $('#hpBar').style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`; $('#xpText').textContent=`${Math.floor(p.xp)}/${p.nextXp}`; $('#xpBar').style.width=`${clamp(p.xp/p.nextXp*100,0,100)}%`; const box=$('#runStats'); if(box){ box.innerHTML=Object.entries(p.statsForUi()).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join(''); } const eqBox=$('#equipmentMini'); if(eqBox){ eqBox.innerHTML=Object.entries(this.save.equipment||{}).map(([slot,item])=>`<div class="equip-row rarity-${item?.rarity||'Common'}"><span>${slot}</span><strong>${item?item.name.replace(item.rarity+' ',''):'未装備'}</strong></div>`).join(''); } }
  log(text){ const el=$('#battleLog'); if(!el)return; const div=document.createElement('div'); div.className='log-entry'; div.textContent=text; el.prepend(div); while(el.children.length>22)el.lastChild.remove(); }
  floatText(x,y,text,color='#fff'){ const layer=$('#floatingTextLayer'); if(!layer)return; const div=document.createElement('div'); div.className='float-text'; div.textContent=text; div.style.left=`${(x/CONFIG.arena.width)*100}%`; div.style.top=`${(y/CONFIG.arena.height)*100}%`; div.style.color=color; layer.appendChild(div); setTimeout(()=>div.remove(),800); }
}
