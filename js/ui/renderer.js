import { CONFIG } from '../core/constants.js';

export class Renderer{
  constructor(canvas){ this.canvas=canvas; this.ctx=canvas.getContext('2d'); }
  render(game){
    const c=this.ctx,w=CONFIG.arena.width,h=CONFIG.arena.height;
    c.clearRect(0,0,w,h);
    const g=c.createRadialGradient(w/2,h/2,80,w/2,h/2,600); g.addColorStop(0,'#10213b'); g.addColorStop(1,'#070b12'); c.fillStyle=g; c.fillRect(0,0,w,h);
    this.grid(c,w,h); this.hazards(c,game); this.effects(c,game); this.pickups(c,game); this.enemies(c,game); this.projectiles(c,game); this.player(c,game.player); this.overlay(c,game);
  }
  grid(c,w,h){ c.save(); c.strokeStyle='rgba(130,170,230,.08)'; c.lineWidth=1; for(let x=0;x<w;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()} for(let y=0;y<h;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()} c.strokeStyle='rgba(255,255,255,.16)'; c.lineWidth=3; c.strokeRect(4,4,w-8,h-8); c.restore(); }
  player(c,p){ if(!p)return; c.save(); if(p.shield>0){c.strokeStyle='rgba(103,212,255,.65)';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,p.r+7,0,Math.PI*2);c.stroke()} c.fillStyle='#eaf1ff'; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); c.fillStyle='#67d4ff'; c.beginPath(); c.arc(p.x+5,p.y-5,5,0,Math.PI*2); c.fill(); c.restore(); }
  enemies(c,game){
    for(const e of game.enemies){
      c.save(); c.fillStyle=e.color; c.beginPath(); c.arc(e.x,e.y,e.r,0,Math.PI*2); c.fill();
      if(e.slow>0){c.strokeStyle='#8ce9ff';c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,e.r+4,0,Math.PI*2);c.stroke()}
      if(e.poison>0){c.strokeStyle='#76f2aa';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.r+7,0,Math.PI*2);c.stroke()}
      if(e.burn>0){c.strokeStyle='#ff8a56';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.r+10,0,Math.PI*2);c.stroke()}
      if(e.bleed>0){c.strokeStyle='#ff86c8';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.r+13,0,Math.PI*2);c.stroke()}
      c.strokeStyle=e.flags.boss?'#fff':e.flags.elite?'#ffd36e':'rgba(0,0,0,.45)'; c.lineWidth=e.flags.boss?4:e.flags.elite?3:2; c.stroke();
      const bw=e.r*2, bh=4; c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(e.x-e.r,e.y-e.r-10,bw,bh); c.fillStyle=e.flags.boss?'#ff5d73':e.flags.elite?'#ffd36e':'#76f2aa'; c.fillRect(e.x-e.r,e.y-e.r-10,bw*Math.max(0,e.hp/e.maxHp),bh); c.restore();
    }
  }
  projectiles(c,game){ const arr=game.projectiles.length>260?game.projectiles.slice(-260):game.projectiles; for(const p of arr){ c.fillStyle=p.color; c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); } }
  pickups(c,game){ const arr=game.pickups.length>150?game.pickups.slice(-150):game.pickups; for(const xp of arr){ c.fillStyle=xp.kind==='stone'?'#ffd36e':'#76f2aa'; c.beginPath(); c.arc(xp.x,xp.y,xp.r,0,Math.PI*2); c.fill(); } }
  hazards(c,game){ for(const h of game.hazards||[]){ c.save(); c.globalAlpha=.28+Math.max(0,h.timer)*.18; c.fillStyle=h.color || '#ff5d73'; c.beginPath(); c.arc(h.x,h.y,h.r,0,Math.PI*2); c.fill(); c.globalAlpha=.9; c.strokeStyle=h.color || '#ff5d73'; c.lineWidth=3; c.setLineDash([8,6]); c.beginPath(); c.arc(h.x,h.y,h.r,0,Math.PI*2); c.stroke(); c.restore(); } }
  effects(c,game){ const arr=game.effects.length>140?game.effects.slice(-140):game.effects; for(const fx of arr){ c.save(); c.globalAlpha=Math.max(0,fx.life/(fx.type==='telegraph'?0.82:0.25)); c.strokeStyle=fx.color; c.fillStyle=fx.color; c.lineWidth=3; if(fx.type==='line'){c.beginPath();c.moveTo(fx.x1,fx.y1);c.lineTo(fx.x2,fx.y2);c.stroke()} if(fx.type==='circle'||fx.type==='telegraph'){if(fx.type==='telegraph'){c.setLineDash([10,6]);c.globalAlpha=.7;} c.beginPath();c.arc(fx.x,fx.y,fx.r,0,Math.PI*2);c.stroke()} c.restore(); } }
  overlay(c,game){ if(game.autoMove){ c.fillStyle='rgba(103,212,255,.9)'; c.font='700 13px sans-serif'; c.fillText('AUTO MOVE',16,24); } }
}
