import { Projectile } from '../entities/projectile.js';
import { distSq, pick } from '../core/utils.js';

export class CombatSystem{
  constructor(game){ this.game=game; }
  update(dt){
    const p=this.game.player;
    p.attackTimer -= dt; p.auraTimer -= dt; p.stormTimer -= dt; p.minionTimer -= dt;
    if(p.attackTimer<=0){ p.attackTimer = 1/Math.max(.1,p.attackSpeed); this.fireBasic(); }
    if(p.flags.fireAura && p.auraTimer<=0){ p.auraTimer=.45; this.fireAura(); }
    if(p.flags.storm && p.stormTimer<=0){ p.stormTimer=1.35; this.storm(); }
    if(p.flags.minions && p.minionTimer<=0){ p.minionTimer=.75/Math.max(1,p.flags.minions); this.minionShot(); }
    this.updateProjectiles(dt);
    this.enemyContact(dt);
  }
  findNearest(range=9999){
    const p=this.game.player; let best=null, bd=range*range;
    for(const e of this.game.enemies){ const d=distSq(p,e); if(d<bd){bd=d; best=e;} }
    return best;
  }
  calcDamage(target, mult=1){
    const p=this.game.player; let dmg=p.damage*mult; const low=target.hp/target.maxHp<0.25;
    if(low && p.flags.execute) dmg*=1+0.75*p.flags.execute+p.execution;
    if(Math.random()<p.mods.critChance){ dmg*=p.mods.critDamage; this.game.floatText(target.x,target.y,'CRIT','#ffd36e'); }
    return dmg;
  }
  fireBasic(){ const target=this.findNearest(this.game.player.range); if(!target)return; this.game.projectiles.push(new Projectile(this.game.player.x,this.game.player.y,target,this.calcDamage(target))); }
  minionShot(){ const target=this.findNearest(460); if(!target)return; const angle=Math.random()*Math.PI*2; const x=this.game.player.x+Math.cos(angle)*34; const y=this.game.player.y+Math.sin(angle)*34; this.game.projectiles.push(new Projectile(x,y,target,this.calcDamage(target,.55),{color:'#c289ff',speed:620,r:4})); }
  updateProjectiles(dt){
    const arr=this.game.projectiles;
    for(let i=arr.length-1;i>=0;i--){ const pr=arr[i]; pr.update(dt); let hit=false;
      for(const e of this.game.enemies){ const dx=e.x-pr.x,dy=e.y-pr.y; if(dx*dx+dy*dy<(e.r+pr.r)**2){ this.applyHit(e,pr.damage); hit=true; break; } }
      if(hit||pr.life<=0)arr.splice(i,1);
    }
  }
  applyHit(e,dmg){
    const p=this.game.player; e.hp-=dmg; this.game.floatText(e.x,e.y,Math.floor(dmg),'#fff');
    if(p.flags.iceSlow)e.slow=.9+.25*p.flags.iceSlow;
    if(p.flags.poison){e.poison=3.2;e.poisonDps=p.damage*(.18+.08*p.flags.poison);}
    if(p.flags.doubleHit && Math.random()<0.18*p.flags.doubleHit){e.hp-=dmg*.55; this.game.floatText(e.x+12,e.y-8,'追撃','#ff86c8');}
    if(p.flags.chainLightning && Math.random()<0.22*p.flags.chainLightning){ this.chain(e,dmg*.55); }
  }
  chain(source,dmg){
    const candidates=this.game.enemies.filter(e=>e!==source && distSq(source,e)<170*170); const target=pick(candidates); if(!target)return;
    target.hp-=dmg; this.game.effects.push({type:'line',x1:source.x,y1:source.y,x2:target.x,y2:target.y,life:.16,color:'#67d4ff'}); this.game.floatText(target.x,target.y,'雷','#67d4ff');
  }
  fireAura(){ const p=this.game.player; for(const e of this.game.enemies){ if(distSq(p,e)<95*95){ e.hp-=p.damage*(.24+.08*p.flags.fireAura); this.game.effects.push({type:'circle',x:p.x,y:p.y,r:95,life:.16,color:'#ff8a56'}); } } }
  storm(){ const p=this.game.player; const count=Math.min(2+Math.floor(this.game.wave/3),10)*p.flags.storm; for(let i=0;i<count;i++){ const e=pick(this.game.enemies); if(!e)continue; e.hp-=p.damage*.7; this.game.effects.push({type:'line',x1:e.x,y1:0,x2:e.x,y2:e.y,life:.2,color:'#67d4ff'}); } }
  enemyContact(dt){ const p=this.game.player; for(const e of this.game.enemies){ const dx=e.x-p.x,dy=e.y-p.y,d2=dx*dx+dy*dy; if(d2<(e.r+p.r)**2){ p.takeDamage(e.damage*dt*.85); if(p.flags.reflect){ e.hp-=e.damage*dt*2.8*p.flags.reflect; } } } }
}
