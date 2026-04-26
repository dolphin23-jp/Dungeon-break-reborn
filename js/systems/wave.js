import { Enemy } from '../entities/enemy.js';
import { CONFIG } from '../core/constants.js';
import { rand, randInt, weightedPick } from '../core/utils.js';

export class WaveSystem{
  constructor(game){ this.game=game; this.timer=0; this.spawnTimer=0; this.bossSpawned=false; }
  startWave(wave){ this.timer=CONFIG.wave.duration+wave*2.4; this.spawnTimer=0; this.bossSpawned=false; this.game.log(`Wave ${wave} 開始`); }
  update(dt){
    this.timer-=dt; this.spawnTimer-=dt;
    const wave=this.game.wave;
    const maxEnemies=Math.floor((CONFIG.wave.maxEnemiesBase+wave*8) * this.game.depth.enemyCount);
    if(this.timer>0 && this.spawnTimer<=0 && this.game.enemies.length<maxEnemies){
      this.spawnTimer=Math.max(.045,.72-wave*.026) / Math.sqrt(this.game.depth.enemyCount);
      const count=wave>10?randInt(3,6):wave>5?randInt(2,4):wave>2?randInt(1,3):1;
      for(let i=0;i<count;i++)this.spawnEnemy(this.pickType(wave));
    }
    if(wave%CONFIG.wave.bossEvery===0 && !this.bossSpawned && this.timer<CONFIG.wave.duration*.76){ this.bossSpawned=true; this.spawnEnemy('boss'); this.game.log('Boss出現！範囲予兆に注意'); }
    if(this.timer<=0 && this.game.enemies.length===0){ this.game.nextWave(); }
  }
  pickType(wave){
    const list=[{id:'grunt',weight:38},{id:'charger',weight:wave>=2?16:0},{id:'ranger',weight:wave>=3?13:0},{id:'tank',weight:wave>=4?9:0},{id:'bomber',weight:wave>=4?10:0},{id:'healer',weight:wave>=6?6:0},{id:'buffer',weight:wave>=7?5:0},{id:'summoner',weight:wave>=8?4:0},{id:'elite',weight:wave>=3?Math.min(1.5+wave*.35,11):0}].filter(x=>x.weight>0);
    return weightedPick(list).id;
  }
  spawnEnemy(type, forcedX=null, forcedY=null){
    let x=forcedX, y=forcedY, pad=36;
    if(x==null || y==null){
      const side=randInt(0,3);
      if(side===0){x=rand(0,CONFIG.arena.width);y=-pad}else if(side===1){x=CONFIG.arena.width+pad;y=rand(0,CONFIG.arena.height)}else if(side===2){x=rand(0,CONFIG.arena.width);y=CONFIG.arena.height+pad}else{x=-pad;y=rand(0,CONFIG.arena.height)}
    }
    this.game.enemies.push(new Enemy(type,this.game.wave,x,y,this.game.depth));
  }
}
