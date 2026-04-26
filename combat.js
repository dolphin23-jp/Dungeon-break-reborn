import { Projectile } from '../entities/projectile.js';
import { CONFIG } from '../core/constants.js';
import { distSq, pick, normalize } from '../core/utils.js';

export class CombatSystem{
  constructor(game){ this.game=game; }
  update(dt){
    const p=this.game.player;
    p.attackTimer -= dt; p.auraTimer -= dt; p.stormTimer -= dt; p.minionTimer -= dt;
    if(p.attackTimer<=0){
      const waveBonus = p.flags.waveAttacks ? Math.min(4, Math.floor(this.game.wave/5)) : 0;
      p.attackTimer = 1/Math.max(.1,p.attackSpeed);
      this.fireBasic(1+waveBonus);
    }
    if(p.flags.fireAura && p.auraTimer<=0){ p.auraTimer=.45; this.fireAura(); }
    if(p.flags.storm && p.stormTimer<=0){ p.stormTimer=1.35; this.storm(); }
    if(p.flags.minions && p.minionTimer<=0){ p.minionTimer=.75/Math.max(1,p.flags.minions); this.minionShot(); }
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
    if(low && p.flags.execute) dmg*=1+0.75*p.flags.execute+p.execution;
    const critChance=Math.max(.02,p.mods.critChance-(target.critResist||0));
    if(Math.random()<critChance){ dmg*=p.mods.critDamage; this.game.floatText(target.x,target.y,'CRIT','#ffd36e'); }
    return dmg;
  }
  fireBasic(count=1){
    for(let i=0;i<count;i++){
      const target=this.findNearest(this.game.player.range); if(!target)return;
      this.game.projectiles.push(new Projectile(this.game.player.x,this.game.player.y,target,this.calcDamage(target),{color:i?'#9de8ff':'#67d4ff'}));
    }
  }
  minionShot(){ const target=this.findNearest(480); if(!target)return; const angle=Math.random()*Math.PI*2; const x=this.game.player.x+Math.cos(angle)*34; const y=this.game.player.y+Math.sin(angle)*34; this.game.projectiles.push(new Projectile(x,y,target,this.calcDamage(target,.55+this.game.player.elemental*.25),{color:'#c289ff',speed:620,r:4})); }
  updateProjectiles(dt){
    const arr=this.game.projectiles;
    for(let i=arr.length-1;i>=0;i--){ const pr=arr[i]; pr.update(dt); let remove=pr.life<=0 || pr.x<-60 || pr.x>CONFIG.arena.width+60 || pr.y<-60 || pr.y>CONFIG.arena.height+60;
      if(pr.owner==='enemy'){
        const p=this.game.player; const dx=p.x-pr.x,dy=p.y-pr.y;
        if(dx*dx+dy*dy<(p.r+pr.r)**2){
          if(p.flags.reflectBullets && Math.random()<0.22*p.flags.reflectBullets){
            const t=this.findNearest(520, p); if(t){ pr.owner='player'; pr.target=t; pr.color='#69ffe7'; pr.damage*=1.35; continue; }
          }
          const res=p.takeDamage(pr.damage); if(res.dodged) this.game.floatText(p.x,p.y,'EVADE','#9de8ff'); remove=true;
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
    if(p.flags.iceSlow && Math.random()>e.statusResist){e.slow=.9+.25*p.flags.iceSlow; this.game.effects.push({type:'circle',x:e.x,y:e.y,r:e.r+6,life:.12,color:'#8ce9ff'});}
    if(p.flags.poison && Math.random()>e.statusResist){e.poison=3.2;e.poisonDps=p.damage*(.18+.08*p.flags.poison)*(1+p.elemental);}
    if(p.flags.bleed && Math.random()>e.statusResist){e.bleed=2.4;e.bleedDps=p.damage*(.16+.08*p.flags.bleed)*(1+p.elemental);}
    if(p.flags.doubleHit && Math.random()<0.18*p.flags.doubleHit){e.hp-=dmg*.55; this.game.floatText(e.x+12,e.y-8,'追撃','#ff86c8');}
    if(p.flags.chainLightning && Math.random()<0.22*p.flags.chainLightning){ this.chain(e,dmg*(.55+p.elemental*.25)); }
    if(p.flags.fireExplosion && Math.random()<0.05*p.flags.fireExplosion){ this.explosion(e.x,e.y,74,dmg*.55,'#ff8a56'); }
  }
  chain(source,dmg){
    let current=source;
    const jumps=Math.min(1+this.game.player.flags.chainLightning,5);
    const used=new Set([source]);
    for(let i=0;i<jumps;i++){
      const candidates=this.game.enemies.filter(e=>!used.has(e) && distSq(current,e)<190*190); const target=pick(candidates); if(!target)return;
      used.add(target); target.hp-=dmg*(1-(target.areaResist||0)*.5); this.game.effects.push({type:'line',x1:current.x,y1:current.y,x2:target.x,y2:target.y,life:.16,color:'#67d4ff'}); this.game.floatText(target.x,target.y,'雷','#67d4ff'); current=target;
    }
  }
  explosion(x,y,r,dmg,color='#ff8a56'){
    this.game.effects.push({type:'circle',x,y,r,life:.22,color});
    for(const e of this.game.enemies){ if((e.x-x)**2+(e.y-y)**2<r*r) this.applyHit(e,dmg,{area:true}); }
  }
  fireAura(){ const p=this.game.player; const r=98+12*p.flags.fireAura; this.game.effects.push({type:'circle',x:p.x,y:p.y,r,life:.16,color:'#ff8a56'}); for(const e of this.game.enemies){ if(distSq(p,e)<r*r){ this.applyHit(e,p.damage*(.24+.08*p.flags.fireAura)*(1+p.elemental),{area:true}); } } }
  storm(){ const p=this.game.player; const count=Math.min(2+Math.floor(this.game.wave/3),10)*p.flags.storm; for(let i=0;i<count;i++){ const e=pick(this.game.enemies); if(!e)continue; e.hp-=p.damage*.7*(1+p.elemental); this.game.effects.push({type:'line',x1:e.x,y1:0,x2:e.x,y2:e.y,life:.2,color:'#67d4ff'}); } }
  updateHazards(dt){
    const p=this.game.player;
    for(let i=this.game.hazards.length-1;i>=0;i--){
      const h=this.game.hazards[i]; h.timer-=dt;
      if(h.timer<=0){
        this.game.effects.push({type:'circle',x:h.x,y:h.y,r:h.r,life:.22,color:h.color || '#ff5d73'});
        if((p.x-h.x)**2+(p.y-h.y)**2<(p.r+h.r)**2) p.takeDamage(h.damage);
        this.game.hazards.splice(i,1);
      }
    }
  }
  enemyContact(dt){ const p=this.game.player; for(const e of this.game.enemies){ const dx=e.x-p.x,dy=e.y-p.y,d2=dx*dx+dy*dy; if(d2<(e.r+p.r)**2){ const res=p.takeDamage(e.damage*dt*.9); if(res.dodged) this.game.floatText(p.x,p.y,'EVADE','#9de8ff'); if(p.flags.reflect){ e.hp-=e.damage*dt*2.8*p.flags.reflect; } } } }
}
