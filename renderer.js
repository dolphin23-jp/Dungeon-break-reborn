import { CONFIG } from '../core/constants.js';

export class Renderer{
  constructor(canvas){ this.canvas=canvas; this.ctx=canvas.getContext('2d'); }
  render(game){
    const c=this.ctx,w=CONFIG.arena.width,h=CONFIG.arena.height;
    c.clearRect(0,0,w,h);
    const g=c.createRadialGradient(w/2,h/2,80,w/2,h/2,600); g.addColorStop(0,'#10213b'); g.addColorStop(1,'#070b12'); c.fillStyle=g; c.fillRect(0,0,w,h);
    this.grid(c,w,h); this.effects(c,game); this.pickups(c,game); this.enemies(c,game); this.projectiles(c,game); this.player(c,game.player); this.overlay(c,game);
  }
  grid(c,w,h){ c.save(); c.strokeStyle='rgba(130,170,230,.08)'; c.lineWidth=1; for(let x=0;x<w;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()} for(let y=0;y<h;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()} c.strokeStyle='rgba(255,255,255,.16)'; c.lineWidth=3; c.strokeRect(4,4,w-8,h-8); c.restore(); }
  player(c,p){ c.save(); if(p.shield>0){c.strokeStyle='rgba(103,212,255,.65)';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,p.r+7,0,Math.PI*2);c.stroke()} c.fillStyle='#eaf1ff'; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); c.fillStyle='#67d4ff'; c.beginPath(); c.arc(p.x+5,p.y-5,5,0,Math.PI*2); c.fill(); c.restore(); }
  enemies(c,game){ for(const e of game.enemies){ c.save(); c.fillStyle=e.color; c.beginPath(); c.arc(e.x,e.y,e.r,0,Math.PI*2); c.fill(); c.strokeStyle=e.flags.boss?'#fff':'rgba(0,0,0,.45)'; c.lineWidth=e.flags.boss?4:2; c.stroke(); const bw=e.r*2, bh=4; c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(e.x-e.r,e.y-e.r-10,bw,bh); c.fillStyle=e.flags.boss?'#ff5d73':'#76f2aa'; c.fillRect(e.x-e.r,e.y-e.r-10,bw*Math.max(0,e.hp/e.maxHp),bh); c.restore(); } }
  projectiles(c,game){ for(const p of game.projectiles){ c.fillStyle=p.color; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); } }
  pickups(c,game){ for(const xp of game.pickups){ c.fillStyle=xp.kind==='stone'?'#ffd36e':'#76f2aa'; c.beginPath(); c.arc(xp.x,xp.y,xp.r,0,Math.PI*2); c.fill(); } }
  effects(c,game){ for(const fx of game.effects){ c.save(); c.globalAlpha=Math.max(0,fx.life/.2); c.strokeStyle=fx.color; c.lineWidth=3; if(fx.type==='line'){c.beginPath();c.moveTo(fx.x1,fx.y1);c.lineTo(fx.x2,fx.y2);c.stroke()} if(fx.type==='circle'){c.beginPath();c.arc(fx.x,fx.y,fx.r,0,Math.PI*2);c.stroke()} c.restore(); } }
  overlay(c,game){ if(game.autoMove){ c.fillStyle='rgba(103,212,255,.9)'; c.font='700 13px sans-serif'; c.fillText('AUTO MOVE',16,24); } }
}
