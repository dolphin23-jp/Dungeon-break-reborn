import { ENEMY_TYPES } from '../data/enemies.js';
import { CONFIG } from '../core/constants.js';
import { clamp, normalize, rand, randInt } from '../core/utils.js';
import { Projectile } from './projectile.js';

export class Enemy{
  constructor(typeId, wave, x, y, depth={enemyHp:1, enemyAtk:1}){
    const t = ENEMY_TYPES[typeId] || ENEMY_TYPES.grunt;
    const hpScale = Math.pow(1.18, wave-1);
    const atkScale = Math.pow(1.14, wave-1);
    this.typeId=typeId; this.name=t.name; this.x=x; this.y=y; this.r=t.radius; this.color=t.color;
    this.maxHp=t.hp*hpScale*depth.enemyHp*(t.boss?1+wave*0.22:1)*(t.elite?1+wave*0.035:1); this.hp=this.maxHp;
    this.speed=t.speed*(1+wave*0.014); this.damage=t.damage*atkScale*depth.enemyAtk; this.xp=t.xp*Math.pow(1.1,wave-1);
    this.score=t.score; this.flags=t;
    this.cd=rand(0,1.4); this.shootCd=rand(.4,2.2); this.specialCd=rand(1.2,3.5); this.summonCd=rand(3,5);
    this.slow=0; this.poison=0; this.poisonDps=0; this.bleed=0; this.bleedDps=0;
    this.critResist=Math.min(.55,(t.critResist||0)+wave*.006+(t.boss?.08:0));
    this.statusResist=Math.min(.72,(t.statusResist||0)+wave*.008+(t.boss?.1:0));
    this.areaResist=t.areaResist||0;
    this.buff=1;
  }
  update(dt, game){
    const player=game.player, enemies=game.enemies;
    if(this.poison>0){ this.poison-=dt; this.hp-=this.poisonDps*dt; }
    if(this.bleed>0){ this.bleed-=dt; this.hp-=this.bleedDps*dt; }
    if(this.slow>0) this.slow-=dt;
    const n = normalize(player.x-this.x, player.y-this.y);
    let desiredRange = this.flags.ranged ? 230 : 0;
    const d = Math.hypot(player.x-this.x, player.y-this.y);
    let mult = this.slow>0 ? 0.55 : 1;
    if (this.flags.charge){
      this.cd -= dt;
      if(this.cd<0){
        if(this.cd>-0.25){ game.effects.push({type:'line',x1:this.x,y1:this.y,x2:player.x,y2:player.y,life:.08,color:'rgba(255,120,80,.9)'}); }
        mult=2.8;
        if(this.cd<-0.52) this.cd=2.4 + Math.random()*1.2;
      }
    }
    if (d > desiredRange+10){ this.x += n.x*this.speed*mult*this.buff*dt; this.y += n.y*this.speed*mult*this.buff*dt; }
    else if (this.flags.ranged && d < desiredRange-36){ this.x -= n.x*this.speed*.58*dt; this.y -= n.y*this.speed*.58*dt; }

    if(this.flags.shoot) this.tryShoot(dt, game, d);
    if(this.flags.healer) this.tryHeal(dt, game);
    if(this.flags.buffer) this.tryBuff(dt, enemies);
    if(this.flags.summoner) this.trySummon(dt, game);
    if(this.flags.boss) this.tryBossAttack(dt, game);

    this.buff = Math.max(1, this.buff - dt*.18);
    this.x=clamp(this.x,this.r,CONFIG.arena.width-this.r); this.y=clamp(this.y,this.r,CONFIG.arena.height-this.r);
  }
  tryShoot(dt, game, d){
    this.shootCd-=dt;
    if(this.shootCd>0 || d>520) return;
    this.shootCd=this.flags.boss?1.2: this.flags.elite?1.55:2.15;
    const n=normalize(game.player.x-this.x, game.player.y-this.y);
    const spread=this.flags.boss?[-.18,0,.18]:[0];
    for(const s of spread){
      const cs=Math.cos(s), sn=Math.sin(s);
      const vx=n.x*cs-n.y*sn, vy=n.x*sn+n.y*cs;
      game.projectiles.push(new Projectile(this.x,this.y,null,this.damage*.9,{owner:'enemy',vx,vy,speed:this.flags.boss?300:260,r:this.flags.boss?7:5,life:3,color:this.flags.boss?'#ff5d73':'#80d7ff'}));
    }
    game.effects.push({type:'circle',x:this.x,y:this.y,r:this.r+8,life:.18,color:'#80d7ff'});
  }
  tryHeal(dt, game){
    this.specialCd-=dt;
    if(this.specialCd>0) return;
    this.specialCd=2.6;
    for(const e of game.enemies){ const dx=e.x-this.x,dy=e.y-this.y; if(dx*dx+dy*dy<135*135) e.hp=Math.min(e.maxHp,e.hp+this.maxHp*.075); }
    game.effects.push({type:'circle',x:this.x,y:this.y,r:135,life:.25,color:'#76f2aa'});
  }
  tryBuff(dt, enemies){
    this.specialCd-=dt;
    if(this.specialCd>0) return;
    this.specialCd=2.2;
    for(const e of enemies){ const dx=e.x-this.x,dy=e.y-this.y; if(e!==this && dx*dx+dy*dy<155*155) e.buff=Math.min(1.55,e.buff+.22); }
  }
  trySummon(dt, game){
    this.summonCd-=dt;
    if(this.summonCd>0 || game.enemies.length>Math.floor((CONFIG.wave.maxEnemiesBase+game.wave*8)*(game.depth?.enemyCount||1))) return;
    this.summonCd=4.8;
    for(let i=0;i<2;i++){ game.waveSystem.spawnEnemy('grunt', this.x+rand(-28,28), this.y+rand(-28,28)); }
    game.effects.push({type:'circle',x:this.x,y:this.y,r:48,life:.25,color:'#c289ff'});
  }
  tryBossAttack(dt, game){
    this.specialCd-=dt;
    if(this.specialCd>0) return;
    this.specialCd=3.4;
    const p=game.player;
    if(randInt(0,1)===0){
      game.hazards.push({x:p.x,y:p.y,r:72,timer:.82,damage:this.damage*1.8,color:'#ff5d73'});
      game.effects.push({type:'telegraph',x:p.x,y:p.y,r:72,life:.82,color:'#ff5d73'});
    }else{
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3 + Math.random()*.2;
        game.projectiles.push(new Projectile(this.x,this.y,null,this.damage*.78,{owner:'enemy',vx:Math.cos(a),vy:Math.sin(a),speed:240,r:6,life:3.2,color:'#ff79b3'}));
      }
      game.effects.push({type:'circle',x:this.x,y:this.y,r:88,life:.28,color:'#ff79b3'});
    }
  }
}
