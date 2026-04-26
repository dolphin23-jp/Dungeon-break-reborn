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
import { SKILL_POOL, SKILL_RARITY_WEIGHTS, getSkillLevel, isSkillMastered, describeNextSkillLevel, applySkillLevel } from '../data/skills.js';
import { saveGame } from './storage.js';
import { rollEquipment, addEquipment } from '../systems/loot.js';
import { evaluateDepthMissions, applyMissionRewards } from '../data/depthMissions.js';
import { getChallengeById } from '../data/challenges.js';
import { calcMasteryExpGain, calculateMasteryLevel, getUnlockedMasteryRewards, getMasteryBonuses } from '../data/mastery.js';
import { EVOLUTIONS, unlockedEvolutions } from '../data/evolutions.js';
import { getCharacterById } from '../data/characters.js';

export class Game{
  constructor(app, canvas){
    this.app=app; this.save=app.save; this.canvas=canvas; this.renderer=new Renderer(canvas); this.input=new InputSystem(canvas); this.combat=new CombatSystem(this); this.waveSystem=new WaveSystem(this); this.last=0; this.raf=0;
    this.speedOptions=[1,2,3,5]; this.speedMultiplier=1;
    this.skillPool=SKILL_POOL;
  }
  start(){
    this.depth=getDepth(this.save.settings?.selectedDepth || 1);
    this.selectedCharacter=getCharacterById(this.save.settings?.selectedCharacter);
    this.selectedChallenge=getChallengeById(this.save.settings?.selectedChallenge || 'none');
    this.challengeModifiers={ rewardMultiplier:this.selectedChallenge.rewardMultiplier||1, ...(this.selectedChallenge.modifiers||{}) };
    this.characterMastery=this.save.characterMastery?.[this.selectedCharacter.id] || { masteryLevel:1, masteryExp:0, unlockedMasteryRewards:[] };
    this.masteryBonuses=getMasteryBonuses(this.characterMastery);
    this.save.characterStats[this.selectedCharacter.id]=this.save.characterStats[this.selectedCharacter.id]||{runs:0,bestWave:0,bestDepth:1};
    this.save.characterStats[this.selectedCharacter.id].runs++;
    this.save.maxDepthStarted=Math.max(this.save.maxDepthStarted||1,this.depth.id);
    saveGame(this.save);
    this.player=new Player(this.save, this.selectedCharacter);
    this.player.healingMultiplier=this.challengeModifiers.healingMultiplier||1;
    this.enemies=[]; this.projectiles=[]; this.pickups=[]; this.effects=[]; this.hazards=[]; this.wave=1; this.runStones=0; this.kills=0; this.bossKillsThisRun=0; this.runSkills=[]; this.autoDismantledCount=0; this.autoDismantledStones=0; this.runMissionRewards={stones:0,masteryExp:0}; this.runMissionCompletions=[]; this.runSkillLevels={}; this.runEvolutions={}; this.runDrops=[]; this.autoMove=false; this.pendingLevelUps=0; this.levelGrowthQueue=[]; this.state=GAME_STATE.RUNNING; this.runResult='gameover';
    this.applyCharacterStart();
    this.waveSystem.startWave(this.wave);
    this.log(`探索開始: ${this.depth.name} / ${this.selectedCharacter.name}`);
    if(this.selectedChallenge.id!=='none') this.log(`チャレンジ: ${this.selectedChallenge.name} / 報酬x${this.selectedChallenge.rewardMultiplier}`);
    this.last=performance.now(); cancelAnimationFrame(this.raf); this.raf=requestAnimationFrame(t=>this.loop(t));
  }
  applyCharacterStart(){
    for(const id of this.selectedCharacter.initialSkills||[]){
      const s=SKILL_POOL.find(x=>x.id===id); if(!s) continue;
      const startLv=1 + (this.masteryBonuses.startSkillLevelBonus||0);
      this.runSkillLevels[id]=startLv;
      for(let lv=1; lv<=startLv; lv++) applySkillLevel(this.player,s);
      this.runSkills.push({...s, chosenLevel:startLv});
    }
    if(this.selectedCharacter.id==='stormcaller'){ this.player.flags.chainLightning=(this.player.flags.chainLightning||0)+1; this.player.elemental+=0.2; }
    this.player.stoneGain += this.masteryBonuses.startStoneRate || 0;
    if(this.masteryBonuses.specialDamageBonus) this.player.elemental += this.masteryBonuses.specialDamageBonus;
    if(this.selectedCharacter.id==='pilgrim'){ this.player.flags.reflectBullets=(this.player.flags.reflectBullets||0)+1; this.player.flags.shieldGuard=(this.player.flags.shieldGuard||0)+1; }
    if(this.selectedCharacter.id==='witch'){ this.player.flags.toxicCloud=(this.player.flags.toxicCloud||0)+1; }
    if(this.selectedCharacter.id==='spiritmaster'){ this.player.flags.minions=(this.player.flags.minions||0)+1; }
  }
  loop(t){
    const rawDt=Math.min(.05,(t-this.last)/1000||0); this.last=t;
    const maxCap=this.currentSpeedCap();
    if(this.speedMultiplier>maxCap) this.speedMultiplier=maxCap;
    let sim=rawDt*this.speedMultiplier;
    const step=0.016;
    while(sim>0){
      const dt=Math.min(step, sim);
      if(this.state===GAME_STATE.RUNNING) this.update(dt);
      sim-=dt;
    }
    this.renderer.render(this); this.updateHud();
    this.raf=requestAnimationFrame(n=>this.loop(n));
  }
  currentSpeedCap(){
    const hasBoss=this.enemies.some(e=>e.flags?.boss);
    if(!this.autoMove) return 2;
    return hasBoss ? 3 : 5;
  }
  setSpeed(mult){ this.speedMultiplier=mult; }
  update(dt){
    if(this.player.flags.undyingInvuln>0) this.player.flags.undyingInvuln-=dt;
    const input=this.input.update();
    const autoDir=this.autoMove?this.getAutoDir():null;
    this.player.update(dt,input,autoDir);
    this.waveSystem.update(dt); this.combat.update(dt);
    for(const e of this.enemies) e.update(dt,this);
    this.updatePickups(dt); this.cleanupDead(); this.effects=this.effects.filter(f=>(f.life-=dt)>0);
    if(this.player.hp<=0) this.handlePlayerDeath();
  }
  handlePlayerDeath(){
    const p=this.player;
    if(p.flags.revive && p.flags.revive>0){
      p.flags.revive--; p.hp=p.maxHp*(0.35+0.1*(p.flags.revive||0)); p.shield+=p.maxHp*.35;
      this.combat.explosion(p.x,p.y,180,p.damage*(4+(p.flags.fireAura||0)*.25),'#ff8a56');
      this.floatText(p.x,p.y,'不死鳥','#ffd36e'); this.log('不死鳥の残火で復活');
      return;
    }
    this.gameOver('gameover');
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
        if(it.kind==='xp'){ const ups=p.gainXp(it.value); if(ups>0){ for(let j=0;j<ups;j++) this.levelGrowthQueue.push(this.applyBaseGrowth()); this.pendingLevelUps+=ups; this.openLevelUp(); } }
        if(it.kind==='stone'){ this.runStones+=it.value; }
        this.pickups.splice(i,1);
      }
    }
  }
  applyBaseGrowth(){
    const g=this.player.characterGrowth||{};
    const summary=[];
    const hp=(8+(g.hp||0)); this.player.maxHp+=hp; this.player.hp+=hp; summary.push(`最大HP +${Math.floor(hp)}`);
    const dmg=(1.4+(g.damage||0)); this.player.baseDamage+=dmg; summary.push(`攻撃力 +${dmg.toFixed(1)}`);
    const def=(0.0025+(g.defense||0)); this.player.guard=Math.min(0.88,this.player.guard+def); summary.push(`防御 +${Math.round(def*100)}%`);
    const mag=(1+(g.magnet||0)); this.player.magnet+=mag; summary.push(`経験値吸引 +${Math.floor(mag)}`);
    if(g.attackSpeed){ this.player.mods.attackSpeedMult+=g.attackSpeed; summary.push(`${this.selectedCharacter.name}補正: 攻速 +${Math.round(g.attackSpeed*100)}%`); }
    if(g.cooldown){ this.player.cooldownReduction=Math.min(0.45,this.player.cooldownReduction+g.cooldown); summary.push(`${this.selectedCharacter.name}補正: CD -${Math.round(g.cooldown*100)}%`); }
    if(g.critChance){ this.player.mods.critChance+=g.critChance; summary.push(`${this.selectedCharacter.name}補正: 会心 +${Math.round(g.critChance*100)}%`); }
    if(g.barrier){ this.player.shield+=this.player.maxHp*g.barrier; summary.push(`${this.selectedCharacter.name}補正: 障壁強化`); }
    if(g.statusDamage){ this.player.statusDamage+=g.statusDamage; summary.push(`${this.selectedCharacter.name}補正: 状態異常威力+`); }
    if(g.statusDuration){ this.player.statusDuration+=g.statusDuration; summary.push(`${this.selectedCharacter.name}補正: 状態異常時間+`); }
    if(g.summonDamage){ this.player.summonDamage+=g.summonDamage; summary.push(`${this.selectedCharacter.name}補正: 召喚ダメージ+`); }
    if(g.summonAttackSpeed){ this.player.summonAttackSpeed+=g.summonAttackSpeed; summary.push(`${this.selectedCharacter.name}補正: 召喚攻速+`); }
    if(g.summonCount){ this.player.flags.minions=(this.player.flags.minions||0)+(Math.random()<g.summonCount?1:0); }
    return summary;
  }
  cleanupDead(){ for(let i=this.enemies.length-1;i>=0;i--){ const e=this.enemies[i]; if(e.hp<=0){ this.onEnemyKilled(e); this.enemies.splice(i,1); } } }
  onEnemyKilled(e){
    const p=this.player;
    this.kills++; if(e.flags.boss) this.bossKillsThisRun++;
    if(this.selectedCharacter.id==='wanderer' && e.bleed>0){ p.mods.attackSpeedMult+=0.06; }
    this.pickups.push({kind:'xp',x:e.x,y:e.y,r:7,value:e.xp});
    const stoneChance=e.flags.boss?1:e.flags.elite?.62:.12;
    if(Math.random()<stoneChance){
      const value=Math.ceil((e.flags.boss?55:e.flags.elite?12:4)*Math.pow(1.3,this.wave-1)*(1+p.stoneGain)*this.depth.reward);
      this.pickups.push({kind:'stone',x:e.x+8,y:e.y-8,r:6,value});
    }
    if(p.flags.toxicCloud && e.poison>0){ this.hazards.push({kind:'playerDot',x:e.x,y:e.y,r:70+7*p.flags.toxicCloud+(p.flags.plagueAbyss?32:0),timer:3.4+(p.flags.plagueAbyss?1.2:0),damage:p.damage*(.18+.04*p.flags.toxicCloud+(p.flags.plagueAbyss?.06:0)),color:'#76f2aa',tick:.25}); }
    if(e.flags.boss || e.flags.elite || Math.random() < (.04 + p.dropRate + this.wave*.0025)){
      const eq=rollEquipment(this.wave,p.rarityLuck + this.depth.rare, this.depth.id); this.runDrops.push(eq); if((RARITIES[eq.rarity]?.order||0)>=4) this.save.legendaryFound=(this.save.legendaryFound||0)+1;
      const added=addEquipment(this.save,eq);
      if(added.autoDismantled){
        this.autoDismantledCount++;
        this.autoDismantledStones+=added.gained;
        this.log(`自動分解: ${eq.name} / +${added.gained} 深淵石`);
      } else {
        this.log(`${added.equipped?'装備更新':'装備入手'}: ${eq.name}`);
      }
    }
  }
  nextWave(){
    this.wave++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); saveGame(this.save); this.waveSystem.startWave(this.wave); if(this.wave>1 && this.wave % 4 === 1) this.openRiftEvent(); const bonus=Math.ceil(Math.pow(this.wave,2.1)*(1+this.player.stoneGain)*this.depth.reward*1.8); this.runStones+=bonus; this.log(`Wave突破報酬: 深淵石 +${format(bonus)}`);
  }
  getSkillWeight(skill){
    const rarityWeight=(SKILL_RARITY_WEIGHTS.find(r=>r.rarity===skill.rarity)?.weight||1)/12;
    const depthFactor=1+this.depth.id*0.03;
    const waveFactor=1+Math.min(0.35,this.wave*0.012);
    const owned=(this.runSkillLevels[skill.id]||0)>0 ? 1.12 : 1;
    let tagFactor=1;
    if(skill.tags?.some(t=>this.selectedCharacter.favorableTags.includes(t))) tagFactor*=this.selectedCharacter.skillWeightBias.favorable*(1+(this.masteryBonuses.favoredTagBoost||0));
    if(skill.tags?.some(t=>this.selectedCharacter.unfavorableTags.includes(t))) tagFactor*=this.selectedCharacter.skillWeightBias.unfavorable;
    const rarityBonus=(skill.rarity==='Legendary'||skill.rarity==='Mythic')?(1+(this.masteryBonuses.highRaritySkillBoost||0)):1;
    const evoNear=EVOLUTIONS.some(e=>{
      const req=(e.requires&&e.requires[skill.id])||0;
      if(req && (this.runSkillLevels[skill.id]||0)<req){
        const ready=Object.entries(e.requires||{}).filter(([id])=>id!==skill.id).some(([id,lv])=>(this.runSkillLevels[id]||0)>=Math.max(1,lv-1));
        return ready;
      }
      return false;
    }) ? 1.15 : 1;
    return Math.max(0.01, rarityWeight*depthFactor*waveFactor*owned*tagFactor*evoNear*rarityBonus*(0.85+Math.random()*0.3));
  }
  chooseSkillOptions(){
    const options=[]; const used=new Set(); let guard=0;
    while(options.length<3 && guard++<120){
      let candidates=SKILL_POOL.filter(s=>!used.has(s.id) && !isSkillMastered(this,s));
      const weighted=candidates.map(s=>({skill:s,weight:this.getSkillWeight(s)}));
      const pickSkill=weightedPick(weighted);
      if(!pickSkill) break;
      used.add(pickSkill.skill.id); options.push(pickSkill.skill);
    }
    return options;
  }
  skillCardHtml(s,i){
    const lv=getSkillLevel(this,s.id); const next=lv+1; const mode=lv>0?'UPGRADE':'NEW';
    return `<button class="skill-card rarity-${s.rarity}" data-i="${i}"><div class="skill-top"><span class="rarity rarity-${s.rarity}">${s.rarity}</span><span class="skill-mode">${mode}</span></div><h3>${s.name}</h3><div class="skill-level">Lv ${lv} → ${next} / ${s.maxLevel}</div><p>${s.desc}</p><p class="next-effect">${describeNextSkillLevel(s,next)}</p><div class="tag-row">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></button>`;
  }
  openLevelUp(){
    if(this.state!==GAME_STATE.RUNNING)return; this.state=GAME_STATE.LEVELUP; const options=this.chooseSkillOptions();
    const growth=(this.levelGrowthQueue.shift()||[]).map(x=>`<li>${x}</li>`).join('');
    modal(`<h2>レベルアップ！</h2><p class="lead">基礎成長: </p><ul class="compact-list">${growth}</ul><div class="skill-grid">${options.map((s,i)=>this.skillCardHtml(s,i)).join('')}</div>`);
    document.querySelectorAll('.skill-card').forEach(btn=>btn.addEventListener('click',()=>{ const s=options[Number(btn.dataset.i)]; const lv=(this.runSkillLevels[s.id]||0)+1; this.runSkillLevels[s.id]=lv; applySkillLevel(this.player,s); this.runSkills.push({...s, chosenLevel:lv}); this.checkEvolutions(); this.log(`${s.name} Lv${lv}`); this.pendingLevelUps--; closeModal(); this.state=GAME_STATE.RUNNING; if(this.pendingLevelUps>0) setTimeout(()=>this.openLevelUp(),80); }));
  }
  checkEvolutions(){
    const unlocked=unlockedEvolutions(this);
    for(const evo of unlocked){
      this.runEvolutions[evo.id]=true;
      this.save.discoveredEvolutions[evo.id]=true;
      evo.apply(this.player);
      this.runSkills.push({id:evo.id,name:evo.name,rarity:evo.rarity,chosenLevel:'EVOLVE',tags:evo.tags});
      this.log(`スキル進化: ${evo.name}`);
      this.floatText(this.player.x,this.player.y,'EVOLVE','#69ffe7');
    }
  }
  openRiftEvent(){
    if(this.state!==GAME_STATE.RUNNING) return;
    this.state=GAME_STATE.LEVELUP;
    const choices=[
      {name:'深淵宝箱',desc:'現在Wave相当の装備を3個獲得。',run:()=>{ for(let i=0;i<3;i++){ const eq=rollEquipment(this.wave+3,this.player.rarityLuck+this.depth.rare+.08,this.depth.id); this.runDrops.push(eq); addEquipment(this.save,eq); } }},
      {name:'魂の圧縮',desc:'即座に大量経験値を獲得。',run:()=>{ const ups=this.player.gainXp(this.player.nextXp*1.8); for(let j=0;j<ups;j++) this.levelGrowthQueue.push(this.applyBaseGrowth()); this.pendingLevelUps+=ups; }},
      {name:'深淵石大量獲得',desc:'深淵石を大量に獲得。',run:()=>{ const gain=Math.ceil((450+this.wave*140)*this.depth.reward*(1+this.player.stoneGain)); this.runStones+=gain; this.log(`裂け目報酬: 深淵石 +${gain}`); }},
    ].sort(()=>Math.random()-.5).slice(0,3);
    modal(`<h2>深淵の裂け目</h2><div class="skill-grid">${choices.map((c,i)=>`<button class="skill-card rarity-Epic" data-i="${i}"><h3>${c.name}</h3><p>${c.desc}</p></button>`).join('')}</div>`);
    document.querySelectorAll('.skill-card').forEach(btn=>btn.addEventListener('click',()=>{ const c=choices[Number(btn.dataset.i)]; c.run(); closeModal(); this.state=GAME_STATE.RUNNING; if(this.pendingLevelUps>0) setTimeout(()=>this.openLevelUp(),80); }));
  }
  requestReturn(){
    if(this.state!==GAME_STATE.RUNNING) return;
    if(confirm('帰還して探索を終了しますか？獲得済み報酬を持ち帰ります。')) this.gameOver('return');
  }
  gameOver(type='gameover'){
    this.runResult=type;
    this.state=GAME_STATE.GAMEOVER; this.save.totalRuns++; this.save.bestWave=Math.max(this.save.bestWave,this.wave); this.save.totalKills=(this.save.totalKills||0)+this.kills; this.save.totalBossKills=(this.save.totalBossKills||0)+this.bossKillsThisRun;
    const carryRate=type==='return'?1:0.72;
    const challengeRate=this.challengeModifiers.rewardMultiplier||1;
    const total=Math.ceil((this.runStones + Math.pow(this.wave,2.02) + this.kills*.22)*this.depth.reward*carryRate*challengeRate);
    this.save.abyssStones+=total; this.save.lifetimeStones=(this.save.lifetimeStones||0)+total;

    const cs=this.save.characterStats[this.selectedCharacter.id]; cs.bestWave=Math.max(cs.bestWave||0,this.wave); cs.bestDepth=Math.max(cs.bestDepth||1,this.depth.id);
    const cm=this.save.characterMastery[this.selectedCharacter.id];
    cm.totalRuns=(cm.totalRuns||0)+1; cm.totalKills=(cm.totalKills||0)+this.kills; cm.totalAbyssStonesEarned=(cm.totalAbyssStonesEarned||0)+total;
    cm.highestWave=Math.max(cm.highestWave||0,this.wave); cm.highestDepth=Math.max(cm.highestDepth||1,this.depth.id);
    const gainedMasteryExp=calcMasteryExpGain({wave:this.wave, depth:this.depth.id, bossKills:this.bossKillsThisRun, result:type, challengeRewardMultiplier:challengeRate});
    const beforeLevel=cm.masteryLevel||1;
    cm.masteryExp=(cm.masteryExp||0)+gainedMasteryExp;
    const masteryResult=calculateMasteryLevel(cm.masteryExp);
    cm.masteryLevel=masteryResult.level;
    cm.unlockedMasteryRewards=Array.from(new Set([...(cm.unlockedMasteryRewards||[]), ...getUnlockedMasteryRewards(cm.masteryLevel)]));

    const rarityOrder=['Common','Rare','Epic','Legendary','Mythic','Abyssal'];
    const highestRarity=this.runDrops.reduce((best,it)=>rarityOrder.indexOf(it.rarity)>rarityOrder.indexOf(best)?it.rarity:best,'Common');
    this.runMissionCompletions=evaluateDepthMissions(this.save,{ depth:this.depth.id, wave:this.wave, bossKills:this.bossKillsThisRun, result:type, highestRarityFound:highestRarity, masteryLevel:cm.masteryLevel, characterId:this.selectedCharacter.id });
    this.runMissionRewards=applyMissionRewards(this.save,cm,this.runMissionCompletions);
    if(this.selectedChallenge.id!=='none' && this.wave>=10){
      this.save.challengeProgress.cleared[this.selectedChallenge.id]=Math.max(this.save.challengeProgress.cleared[this.selectedChallenge.id]||0,this.wave);
    }

    const after=calculateMasteryLevel(cm.masteryExp);
    const achievementMsgs=this.unlockAchievements(); saveGame(this.save); this.app.refreshTitle();
    const levelUpMsg=after.level>beforeLevel?`<div class='notice'>熟練度 Lv${beforeLevel} → Lv${after.level}</div>`:'';
    const missionRows=this.runMissionCompletions.map(m=>`<div>達成: ${m.name}</div>`).join('');
    modal(`<h2>${type==='return'?'帰還成功':'ゲームオーバー'}</h2><p class="lead">${this.selectedCharacter.name} / ${this.depth.name}</p><div class="result-grid"><div><span>到達Wave</span><strong>${this.wave}</strong></div><div><span>獲得深淵石</span><strong>${format(total)}</strong></div><div><span>Boss撃破</span><strong>${this.bossKillsThisRun}</strong></div><div><span>入手装備</span><strong>${this.runDrops.length}</strong></div><div><span>熟練EXP</span><strong>+${gainedMasteryExp + (this.runMissionRewards.masteryExp||0)}</strong></div><div><span>自動分解</span><strong>${this.autoDismantledCount}件 / +${this.autoDismantledStones}</strong></div><div><span>チャレンジ</span><strong>${this.selectedChallenge.name}</strong></div><div><span>倍率</span><strong>x${challengeRate.toFixed(2)}</strong></div></div>${levelUpMsg}${missionRows?`<div class='notice-list'>${missionRows}</div>`:''}${achievementMsgs.length?`<div class="notice-list">${achievementMsgs.map(x=>`<div>${x}</div>`).join('')}</div>`:''}<div class="modal-actions"><button id="retryBtn" class="btn primary">再挑戦</button><button id="toTitleBtn" class="btn">タイトルへ</button></div>`);
    $('#retryBtn').onclick=()=>{closeModal();this.app.startRun();}; $('#toTitleBtn').onclick=()=>{closeModal();this.app.toTitle();};
  }
  unlockAchievements(){
    const msgs=[];
    for(const a of ACHIEVEMENTS){ if(!this.save.achievements[a.id] && a.condition(this.save)){ this.save.achievements[a.id]=true; if(a.upgrade) this.save.upgrades[a.upgrade]=(this.save.upgrades[a.upgrade]||0)+(a.amount||1); if(a.stones) this.save.abyssStones+=a.stones; msgs.push('実績解除: '+a.name+' / '+a.rewardText); } }
    for(const m of msgs) this.log(m); return msgs;
  }
  showBuild(){ /* unchanged simple */
    const skillRows=Object.entries(this.runSkillLevels||{}).sort((a,b)=>b[1]-a[1]).map(([id,lv])=>{ const s=SKILL_POOL.find(x=>x.id===id); return s?`<li class="rarity-${s.rarity}"><strong>${s.name}</strong> <span>${s.rarity} / Lv${lv}</span></li>`:''; }).join('') || '<li>なし</li>';
    const evoRows=Object.keys(this.runEvolutions||{}).map(id=>{ const e=EVOLUTIONS.find(x=>x.id===id); return e?`<li class="rarity-${e.rarity}"><strong>${e.name}</strong> <span>${e.rarity} / EVOLVE</span></li>`:''; }).join('') || '<li>なし</li>';
    modal('<h2>今回のビルド</h2><div class="two-col"><div><h3>スキルLv</h3><ul class="compact-list">'+skillRows+'</ul><h3>進化</h3><ul class="compact-list">'+evoRows+'</ul></div></div><div class="modal-actions"><button id="closeBuildBtn" class="btn primary">閉じる</button></div>');
    $('#closeBuildBtn').onclick=closeModal;
  }
  togglePause(){ if(this.state===GAME_STATE.RUNNING){this.state=GAME_STATE.PAUSED;} else if(this.state===GAME_STATE.PAUSED){this.state=GAME_STATE.RUNNING;} }
  updateHud(){ const p=this.player; if(!p)return; $('#hudWave').textContent=this.wave; $('#hudLevel').textContent=p.level; $('#hudStones').textContent=format(this.runStones); $('#hudEnemies').textContent=this.enemies.length; $('#hpText').textContent=`${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`; $('#hpBar').style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`; $('#xpText').textContent=`${Math.floor(p.xp)}/${p.nextXp}`; $('#xpBar').style.width=`${clamp(p.xp/p.nextXp*100,0,100)}%`; $('#speedLabel').textContent=`${this.speedMultiplier}x`; const box=$('#runStats'); if(box){ box.innerHTML=Object.entries(p.statsForUi()).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join(''); } }
  log(text){ const el=$('#battleLog'); if(!el)return; const div=document.createElement('div'); div.className='log-entry'; div.textContent=text; el.prepend(div); while(el.children.length>22)el.lastChild.remove(); }
  floatText(x,y,text,color='#fff'){ const layer=$('#floatingTextLayer'); if(!layer)return; const div=document.createElement('div'); div.className='float-text'; div.textContent=text; div.style.left=`${(x/CONFIG.arena.width)*100}%`; div.style.top=`${(y/CONFIG.arena.height)*100}%`; div.style.color=color; layer.appendChild(div); setTimeout(()=>div.remove(),800); }
}
