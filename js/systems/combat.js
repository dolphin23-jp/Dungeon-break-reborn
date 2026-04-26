import { Projectile } from '../entities/projectile.js';
import { CONFIG } from '../core/constants.js';
import { distSq, pick, normalize } from '../core/utils.js';

export class CombatSystem{
  constructor(game){ this.game=game; }
  update(dt){
    const p=this.game.player;
    p.attackTimer -= dt; p.auraTimer -= dt; p.stormTimer -= dt; p.minionTimer -= dt; p.frostTimer -= dt; p.bladeTimer -= dt; p.blackHoleTimer -= dt;
    if(p.attackTimer<=0){
      const waveBonus = p.flags.waveAttacks ? Math.min(4 + p.flags.waveAttacks, Math.floor(this.game.wave/5)*p.flags.waveAttacks) : 0;
      const skillBonus = p.flags.multiShot || 0;
      p.attackTimer = 1/Math.max(.1,p.attackSpeed)*(1-p.cooldownReduction);
      this.fireBasic(1+waveBonus+skillBonus);
    }
    if(p.flags.fireAura && p.auraTimer<=0){ p.auraTimer=Math.max(.16,.48-.025*p.flags.fireAura); this.fireAura(); }
    if(p.flags.storm && p.stormTimer<=0){ p.stormTimer=Math.max(.45,1.35-.08*p.flags.storm); this.storm(); }
    if(p.flags.minions && p.minionTimer<=0){ p.minionTimer=.75/Math.max(1,(p.flags.minions||0)+(p.flags.minionSwarm||0))*Math.max(.45,1-p.summonAttackSpeed*0.2); this.minionShot(); }
    if(p.flags.frostNova && p.frostTimer<=0){ p.frostTimer=Math.max(1.2,3.6-.18*p.flags.frostNova); this.frostNova(); }
    if(p.flags.bladeOrbit && p.bladeTimer<=0){ p.bladeTimer=Math.max(.16,.58-.035*p.flags.bladeOrbit); this.bladeOrbit(); }
    if(p.flags.blackHole && p.blackHoleTimer<=0){ p.blackHoleTimer=Math.max(2.0,6.4-.38*p.flags.blackHole); this.blackHole(); }
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.enemyContact(dt);
  }
  findNearest(range=9999, from=this.game.player){
    let best=null, bd=range*range;
    for(const e of this.game.enemies){ const d=distSq(from,e); if(d<bd){bd=d; best=e;} }
    return best;
  }
  calcDamage(target, mult=1){
    const p=this.game.player; let dmg=p.damage*mult; const low=target.hp/target.maxHp<0.25;
    if(low && p.flags.execute){ dmg*=1+0.75*p.flags.execute+p.execution; if(p.flags.executionNova) target.wasExecuted=true; }
    if(target.bleed>0 && p.flags.bloodHeal) dmg*=1+.08*p.flags.bloodHeal;
    const critChance=Math.max(.02,p.mods.critChance-(target.critResist||0) + (target.bleed>0 && p.flags.bloodHeal ? .04*p.flags.bloodHeal : 0));
    if(Math.random()<critChance){ dmg*=p.mods.critDamage; this.game.floatText(target.x,target.y,'CRIT','#ffd36e'); }
    return dmg;
  }
  fireBasic(count=1){
    for(let i=0;i<count;i++){
      const target=this.findNearest(this.game.player.range); if(!target)return;
      const pierce=Math.floor((this.game.player.flags.pierce||0)/2);
      this.game.projectiles.push(new Projectile(this.game.player.x,this.game.player.y,target,this.calcDamage(target,1+0.03*(this.game.player.flags.pierce||0)),{color:i?'#9de8ff':'#67d4ff',pierce}));
    }
  }
  minionShot(){
    const target=this.findNearest(480); if(!target)return; const angle=Math.random()*Math.PI*2; const x=this.game.player.x+Math.cos(angle)*34; const y=this.game.player.y+Math.sin(angle)*34;
    this.game.projectiles.push(new Projectile(x,y,target,this.calcDamage(target,(.55+this.game.player.elemental*.25+0.04*(this.game.player.flags.minions||0))*this.game.player.summonDamage),{color:'#c289ff',speed:620,r:4,pierce:Math.floor((this.game.player.flags.minionSwarm||0)/2)+(this.game.player.flags.spiritCitadel?1:0)})); if(this.game.player.flags.spiritCitadel){ this.game.player.shield=Math.min(this.game.player.maxHp*1.8,this.game.player.shield+this.game.player.maxHp*.01); }
  }
  updateProjectiles(dt){
    const arr=this.game.projectiles;
    for(let i=arr.length-1;i>=0;i--){ const pr=arr[i]; pr.update(dt); let remove=pr.life<=0 || pr.x<-60 || pr.x>CONFIG.arena.width+60 || pr.y<-60 || pr.y>CONFIG.arena.height+60;
      if(pr.owner==='enemy'){
        const p=this.game.player; const dx=p.x-pr.x,dy=p.y-pr.y;
        if(dx*dx+dy*dy<(p.r+pr.r)**2){
          if(p.flags.reflectBullets && Math.random()<Math.min(.82,0.18*p.flags.reflectBullets)){
            const t=this.findNearest(520, p); if(t){ pr.owner='player'; pr.target=t; pr.color='#69ffe7'; pr.damage*=1.35+.08*p.flags.reflectBullets; continue; }
          }
          const res=p.takeDamage(pr.damage); if(res.dodged) this.game.floatText(p.x,p.y,'EVADE','#9de8ff'); if(res.undying) this.game.floatText(p.x,p.y,'不屈','#ffd36e'); if(p.flags.thornRevenge) this.explosion(p.x,p.y,80+10*p.flags.thornRevenge,p.damage*(0.35+0.12*p.flags.thornRevenge),'#ff86c8'); remove=true;
        }
      }else{
        for(const e of this.game.enemies){ if(pr.hit.has(e)) continue; const dx=e.x-pr.x,dy=e.y-pr.y; if(dx*dx+dy*dy<(e.r+pr.r)**2){ this.applyHit(e,pr.damage); pr.hit.add(e); if(pr.pierce>0){pr.pierce--; } else {remove=true;} break; } }
      }
      if(remove)arr.splice(i,1);
    }
  }
  applyHit(e,dmg,{area=false}={}){
    const p=this.game.player; if(area) dmg*=1-(e.areaResist||0);
    e.hp-=dmg; this.game.floatText(e.x,e.y,Math.floor(dmg),'#fff');
    if(p.flags.iceSlow && Math.random()>e.statusResist){e.slow=.9+.25*p.flags.iceSlow; this.game.effects.push({type:'circle',x:e.x,y:e.y,r:e.r+6,life:.12,color:'#8ce9ff'}); if(p.flags.frostNova) e.hp-=p.damage*.07*p.flags.frostNova;}
    if(p.flags.poison && Math.random()>e.statusResist){e.poison=(3.2+.12*p.flags.poison+(p.flags.plagueAbyss?.8:0))*p.statusDuration;e.poisonDps=p.damage*(.18+.08*p.flags.poison+(p.flags.plagueAbyss?.08:0))*(1+p.elemental)*p.statusDamage;}
    if(p.flags.bleed && Math.random()>e.statusResist){e.bleed=(2.4+.12*p.flags.bleed)*p.statusDuration;e.bleedDps=p.damage*(.16+.08*p.flags.bleed)*(1+p.elemental)*p.statusDamage;}
    if(p.flags.burn && Math.random()>e.statusResist){e.burn=(2.2+.1*p.flags.burn)*p.statusDuration;e.burnDps=p.damage*(.15+.055*p.flags.burn)*(1+p.elemental)*p.statusDamage;}
    if(p.flags.doubleHit && Math.random()<Math.min(.75,0.16*p.flags.doubleHit)){e.hp-=dmg*.55; this.game.floatText(e.x+12,e.y-8,'追撃','#ff86c8');}
    if(p.flags.chainLightning && Math.random()<Math.min(.88,0.18*p.flags.chainLightning)){ this.chain(e,dmg*(.55+p.elemental*.25)); }
    if(p.flags.thunderJudgement && e.hp/e.maxHp<0.28){ this.chain(e,dmg*.75); }
    if(p.flags.fireExplosion && Math.random()<Math.min(.5,0.045*p.flags.fireExplosion)){ this.explosion(e.x,e.y,74+4*p.flags.fireExplosion,dmg*.55,'#ff8a56'); }
  }
  chain(source,dmg){
    let current=source; const lv=this.game.player.flags.chainLightning||0;
    const jumps=Math.min(1+lv, lv>=10?8:6); const range=lv>=3?230:190;
    const used=new Set([source]);
    for(let i=0;i<jumps;i++){
      const candidates=this.game.enemies.filter(e=>!used.has(e) && distSq(current,e)<range*range); const target=pick(candidates); if(!target)return;
      used.add(target); target.hp-=dmg*(1-(target.areaResist||0)*.5); this.game.effects.push({type:'line',x1:current.x,y1:current.y,x2:target.x,y2:target.y,life:.16,color:'#67d4ff'}); this.game.floatText(target.x,target.y,'雷','#67d4ff'); if(lv>=10) this.explosion(target.x,target.y,42,dmg*.35,'#67d4ff'); current=target;
    }
  }
  explosion(x,y,r,dmg,color='#ff8a56'){
    this.game.effects.push({type:'circle',x,y,r,life:.22,color});
    for(const e of this.game.enemies){ if((e.x-x)**2+(e.y-y)**2<r*r) this.applyHit(e,dmg,{area:true}); }
  }
  fireAura(){
    const p=this.game.player; const r=96+11*p.flags.fireAura+(p.flags.fireAura>=3?20:0)+(p.flags.infernoOrbit?42:0); const dmg=p.damage*(.22+.07*p.flags.fireAura+(p.flags.infernoOrbit?.10:0))*(1+p.elemental);
    this.game.effects.push({type:'circle',x:p.x,y:p.y,r,life:.16,color:'#ff8a56'}); if(p.flags.fireAura>=8) this.game.effects.push({type:'circle',x:p.x,y:p.y,r:r*.62,life:.16,color:'#ffd36e'});
    for(const e of this.game.enemies){ if(distSq(p,e)<r*r){ this.applyHit(e,dmg,{area:true}); if(p.flags.fireAura>=5 && Math.random()>e.statusResist){ e.burn=2.8; e.burnDps=p.damage*(.18+.035*p.flags.fireAura)*(1+p.elemental); } } }
  }
  storm(){
    const p=this.game.player; const count=Math.min(2+Math.floor(this.game.wave/3),10)*p.flags.storm + (p.flags.abyssalCore||0)*2 + (p.flags.abyssalOverlord||0)*3;
    for(let i=0;i<count;i++){ const e=pick(this.game.enemies); if(!e)continue; this.applyHit(e,p.damage*(.7+.06*p.flags.storm)*(1+p.elemental),{area:true}); if(p.flags.absoluteZeroStorm && Math.random()>e.statusResist){ e.slow=1.2+.12*p.flags.absoluteZeroStorm; } this.game.effects.push({type:'line',x1:e.x,y1:0,x2:e.x,y2:e.y,life:.2,color:'#67d4ff'}); }
  }
  frostNova(){
    const p=this.game.player; const r=125+12*p.flags.frostNova+(p.flags.absoluteZeroStorm?28:0); const dmg=p.damage*(.55+.08*p.flags.frostNova+(p.flags.absoluteZeroStorm?.12:0))*(1+p.elemental);
    this.game.effects.push({type:'circle',x:p.x,y:p.y,r,life:.28,color:'#8ce9ff'});
    for(const e of this.game.enemies){ if(distSq(p,e)<r*r){ this.applyHit(e,dmg*(distSq(p,e)<(r*.45)**2 && p.flags.frostNova>=8?1.8:1),{area:true}); if(Math.random()>e.statusResist){ e.slow=1.6+.16*p.flags.frostNova; } } }
  }
  bladeOrbit(){
    const p=this.game.player; const r=75+10*p.flags.bladeOrbit; const dmg=p.damage*(.26+.045*p.flags.bladeOrbit);
    this.game.effects.push({type:'circle',x:p.x,y:p.y,r,life:.12,color:'#ff86c8'});
    for(const e of this.game.enemies){ if(distSq(p,e)<r*r){ this.applyHit(e,dmg,{area:true}); if(Math.random()>e.statusResist){ e.bleed=2.6; e.bleedDps=p.damage*(.14+.04*p.flags.bladeOrbit); } } }
  }
  blackHole(){
    const p=this.game.player; const target=pick(this.game.enemies) || p; const r=135+15*p.flags.blackHole+(p.flags.abyssalOverlord?35:0); const x=target.x, y=target.y;
    this.game.effects.push({type:'telegraph',x,y,r,life:.75,color:'#c289ff'});
    this.game.hazards.push({kind:'blackHole',x,y,r,timer:.75,damage:p.damage*(1.8+.28*p.flags.blackHole),color:'#c289ff',pull:80+16*p.flags.blackHole});
  }
  updateHazards(dt){
    const p=this.game.player;
    for(let i=this.game.hazards.length-1;i>=0;i--){
      const h=this.game.hazards[i]; h.timer-=dt;
      if(h.kind==='blackHole'){
        for(const e of this.game.enemies){ const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1; if(d<h.r*1.25){ e.x+=dx/d*h.pull*dt; e.y+=dy/d*h.pull*dt; } }
      }
      if(h.kind==='playerDot'){
        h.tick=(h.tick||.25)-dt;
        if(h.tick<=0){ h.tick=.25; for(const e of this.game.enemies){ if((e.x-h.x)**2+(e.y-h.y)**2<h.r*h.r) this.applyHit(e,h.damage,{area:true}); } }
        if(h.timer<=0) this.game.hazards.splice(i,1);
        continue;
      }
      if(h.timer<=0){
        this.game.effects.push({type:'circle',x:h.x,y:h.y,r:h.r,life:.22,color:h.color || '#ff5d73'});
        if(h.kind==='blackHole') this.explosion(h.x,h.y,h.r,h.damage,h.color || '#c289ff');
        else if((p.x-h.x)**2+(p.y-h.y)**2<(p.r+h.r)**2) p.takeDamage(h.damage);
        this.game.hazards.splice(i,1);
      }
    }
  }
  enemyContact(dt){ const p=this.game.player; for(const e of this.game.enemies){ const dx=e.x-p.x,dy=e.y-p.y,d2=dx*dx+dy*dy; if(d2<(e.r+p.r)**2){ const res=p.takeDamage(e.damage*dt*.9); if(res.dodged) this.game.floatText(p.x,p.y,'EVADE','#9de8ff'); if(p.flags.reflect||p.flags.contactThorns){ e.hp-=e.damage*dt*2.8*((p.flags.reflect||0)+(p.flags.contactThorns||0)); } } } }
}
