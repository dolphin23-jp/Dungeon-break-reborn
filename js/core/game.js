import { CONFIG, GAME_STATE } from './constants.js';
import { clamp, distSq, format, pick, weightedPick } from './utils.js';
import { Player } from '../entities/player.js';
import { InputSystem } from '../systems/input.js';
import { CombatSystem } from '../systems/combat.js';
import { WaveSystem } from '../systems/wave.js';
import { Renderer } from '../ui/renderer.js';
import { $, modal, closeModal } from '../ui/dom.js';
import { SKILL_POOL, SKILL_RARITY_WEIGHTS } from '../data/skills.js';
import { saveGame } from './storage.js';
import { rollEquipment } from '../systems/loot.js';

export class Game{
  constructor(app, canvas){
    this.app=app; this.save=app.save; this.canvas=canvas; this.renderer=new Renderer(canvas); this.input=new InputSystem(canvas); this.combat=new CombatSystem(this); this.waveSystem=new WaveSystem(this); this.last=0; this.raf=0;
  }
  start(){
    this.player=new Player(this.save); this.enemies=[]; this.projectiles=[]; this.pickups=[]; this.effects=[]; this.wave=1; this.runStones=0; this.kills=0; this.autoMove=false; this.pendingLevelUps=0; this.state=GAME_STATE.RUNNING; this.waveSystem.startWave(this.wave); this.log('探索開始'); this.last=performance.now(); cancelAnimationFrame(this.raf); this.raf=requestAnimationFrame(t=>this.loop(t));
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
    for(const e of this.enemies) e.update(dt,this.player,this.enemies);
    this.updatePickups(dt); this.cleanupDead(); this.effects=this.effects.filter(f=>(f.life-=dt)>0);
    if(this.player.hp<=0) this.gameOver();
  }
  getAutoDir(){
    let ax=0, ay=0; const p=this.player;
    for(const e of this.enemies){ const dx=p.x-e.x, dy=p.y-e.y, d2=dx*dx+dy*dy; if(d2<145*145){ const inv=1/Math.max(40,Math.sqrt(d2)); ax+=dx*inv; ay+=dy*inv; } }
    if(Math.abs(ax)+Math.abs(ay)<.05){ const target=this.pickups[0]||this.enemies[0]; if(target){ ax=target.x-p.x; ay=target.y-p.y; } }
    const l=Math.hypot(ax,ay)||1; return {x:ax/l,y:ay/l};
  }
  updatePickups(dt){
    const p=this.player;
    for(let i=this.pickups.length-1;i>=0;i--){ const it=this.pickups[i]; const d2=distSq(p,it); const attract=(p.magnet+it.r)**2;
      if(d2<attract){ const d=Math.sqrt(d2)||1; it.x+=(p.x-it.x)/d*340*dt; it.y+=(p.y-it.y)/d*340*dt; }
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
    this.kills++; this.pickups.push({kind:'xp',x:e.x,y:e.y,r:7,value:e.xp});
    const stoneChance=e.flags.boss?1:e.flags.elite?.35:.08;
    if(Math.random()<stoneChance){ const value=Math.ceil((e.flags.boss?22:3)*Math.pow(1.22,this.wave-1)*(1+this.player.stoneGain)); this.pickups.push({kind:'stone',x:e.x+8,y:e.y-8,r:6,value}); }
    if(e.flags.explode){ for(const other of this.enemies){ if(other!==e&&distSq(e,other)<90*90) other.hp-=e.damage*2; } this.effects.push({type:'circle',x:e.x,y:e.y,r:90,life:.2,color:'#ff5d73'}); }
    if(e.flags.boss){ const eq=rollEquipment(this.wave); this.log(`${eq.name} 獲得: ${eq.effect} / Power ${format(eq.power)}`); this.floatText(e.x,e.y,eq.rarity,'#ffd36e'); }
  }
  nextWave(){
    this.wave++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); saveGame(this.save); this.waveSystem.startWave(this.wave); const bonus=Math.ceil(Math.pow(this.wave,1.75)*(1+this.player.stoneGain)); this.runStones+=bonus; this.log(`Wave突破報酬: 深淵石 +${format(bonus)}`);
  }
  chooseSkillOptions(){
    const options=[]; const used=new Set();
    while(options.length<3){ const rarity=weightedPick(SKILL_RARITY_WEIGHTS).rarity; const candidates=SKILL_POOL.filter(s=>s.rarity===rarity&&!used.has(s.id)); const s=pick(candidates.length?candidates:SKILL_POOL.filter(x=>!used.has(x.id))); if(!s)break; used.add(s.id); options.push(s); }
    return options;
  }
  openLevelUp(){
    if(this.state!==GAME_STATE.RUNNING)return; this.state=GAME_STATE.LEVELUP; const options=this.chooseSkillOptions();
    modal(`<h2>レベルアップ！</h2><p class="lead">スキルを1つ選択してください。カード境界・レアリティ・タグをPhase 1から明確に表示しています。</p><div class="skill-grid">${options.map((s,i)=>`<button class="skill-card rarity-${s.rarity}" data-i="${i}"><span class="rarity rarity-${s.rarity}">${s.rarity}</span><h3>${s.name}</h3><p>${s.desc}</p><div class="tag-row">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></button>`).join('')}</div>`);
    document.querySelectorAll('.skill-card').forEach(btn=>btn.addEventListener('click',()=>{ const s=options[Number(btn.dataset.i)]; s.apply(this.player); this.log(`${s.name} を習得`); this.pendingLevelUps--; closeModal(); this.state=GAME_STATE.RUNNING; if(this.pendingLevelUps>0) setTimeout(()=>this.openLevelUp(),80); }));
  }
  gameOver(){
    this.state=GAME_STATE.GAMEOVER; this.save.totalRuns++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); const total=Math.ceil(this.runStones + Math.pow(this.wave,1.9) + this.kills*.18); this.save.abyssStones+=total; this.unlockAchievements(); saveGame(this.save); this.app.refreshTitle();
    modal(`<h2>ゲームオーバー</h2><p class="lead">探索結果が保存されました。深層ほど深淵石は加速度的に増加します。</p><div class="result-grid"><div><span>到達Wave</span><strong>${this.wave}</strong></div><div><span>撃破数</span><strong>${this.kills}</strong></div><div><span>獲得深淵石</span><strong>${format(total)}</strong></div></div><div class="modal-actions"><button id="retryBtn" class="btn primary">再挑戦</button><button id="toTitleBtn" class="btn">タイトルへ</button><button id="toMetaBtn" class="btn">永続強化へ</button></div>`);
    $('#retryBtn').onclick=()=>{closeModal();this.app.startRun();}; $('#toTitleBtn').onclick=()=>{closeModal();this.app.toTitle();}; $('#toMetaBtn').onclick=()=>{closeModal();this.app.toMeta();};
  }
  unlockAchievements(){
    const rewards=[{id:'w5',cond:this.wave>=5,up:'power',msg:'実績: Wave5到達。破砕の腕力 +1'},{id:'k100',cond:this.kills>=100,up:'vitality',msg:'実績: 100体撃破。生命力 +1'},{id:'w10',cond:this.wave>=10,up:'stoneGain',msg:'実績: Wave10到達。深淵共鳴 +1'}];
    for(const r of rewards){ if(r.cond&&!this.save.achievements[r.id]){ this.save.achievements[r.id]=true; this.save.upgrades[r.up]=(this.save.upgrades[r.up]||0)+1; this.log(r.msg); } }
  }
  togglePause(){ if(this.state===GAME_STATE.RUNNING){this.state=GAME_STATE.PAUSED;this.log('一時停止');} else if(this.state===GAME_STATE.PAUSED){this.state=GAME_STATE.RUNNING;this.log('再開');} }
  updateHud(){ const p=this.player; if(!p)return; $('#hudWave').textContent=this.wave; $('#hudLevel').textContent=p.level; $('#hudStones').textContent=format(this.runStones); $('#hudEnemies').textContent=this.enemies.length; $('#hpText').textContent=`${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`; $('#hpBar').style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`; $('#xpText').textContent=`${Math.floor(p.xp)}/${p.nextXp}`; $('#xpBar').style.width=`${clamp(p.xp/p.nextXp*100,0,100)}%`; const box=$('#runStats'); if(box){ box.innerHTML=Object.entries(p.statsForUi()).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join(''); } }
  log(text){ const el=$('#battleLog'); if(!el)return; const div=document.createElement('div'); div.className='log-entry'; div.textContent=text; el.prepend(div); while(el.children.length>18)el.lastChild.remove(); }
  floatText(x,y,text,color='#fff'){ const layer=$('#floatingTextLayer'); if(!layer)return; const div=document.createElement('div'); div.className='float-text'; div.textContent=text; div.style.left=`${(x/CONFIG.arena.width)*100}%`; div.style.top=`${(y/CONFIG.arena.height)*100}%`; div.style.color=color; layer.appendChild(div); setTimeout(()=>div.remove(),800); }
}
