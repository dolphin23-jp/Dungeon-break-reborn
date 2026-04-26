import { ENEMY_TYPES } from '../data/enemies.js';
import { CONFIG } from '../core/constants.js';
import { clamp, normalize, rand } from '../core/utils.js';

export class Enemy{
  constructor(typeId, wave, x, y){
    const t = ENEMY_TYPES[typeId];
    const scale = Math.pow(1.15, wave-1);
    this.typeId=typeId; this.name=t.name; this.x=x; this.y=y; this.r=t.radius; this.color=t.color;
    this.maxHp=t.hp*scale*(t.boss?1+wave*0.18:1); this.hp=this.maxHp;
    this.speed=t.speed*(1+wave*0.012); this.damage=t.damage*scale; this.xp=t.xp*Math.pow(1.08,wave-1);
    this.score=t.score; this.flags=t; this.cd=rand(0,2); this.slow=0; this.poison=0; this.poisonDps=0;
  }
  update(dt, player, enemies){
    if(this.poison>0){ this.poison-=dt; this.hp-=this.poisonDps*dt; }
    if(this.slow>0) this.slow-=dt;
    const n = normalize(player.x-this.x, player.y-this.y);
    let desiredRange = this.flags.ranged ? 210 : 0;
    const d = Math.hypot(player.x-this.x, player.y-this.y);
    let mult = this.slow>0 ? 0.55 : 1;
    if (this.flags.charge){ this.cd -= dt; if(this.cd<0){ mult=2.25; if(this.cd<-0.45) this.cd=2.4; } }
    if (d > desiredRange+10){ this.x += n.x*this.speed*mult*dt; this.y += n.y*this.speed*mult*dt; }
    else if (this.flags.ranged && d < desiredRange-30){ this.x -= n.x*this.speed*.55*dt; this.y -= n.y*this.speed*.55*dt; }
    if(this.flags.healer){ this.cd-=dt; if(this.cd<=0){ this.cd=2.2; for(const e of enemies){ const dx=e.x-this.x,dy=e.y-this.y; if(dx*dx+dy*dy<120*120) e.hp=Math.min(e.maxHp,e.hp+this.maxHp*.06); } } }
    if(this.flags.buffer){ for(const e of enemies){ const dx=e.x-this.x,dy=e.y-this.y; if(e!==this && dx*dx+dy*dy<135*135) e.speed += dt*0.25; } }
    this.x=clamp(this.x,this.r,CONFIG.arena.width-this.r); this.y=clamp(this.y,this.r,CONFIG.arena.height-this.r);
  }
}
