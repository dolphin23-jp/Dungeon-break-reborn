import { Enemy } from '../entities/enemy.js';
import { CONFIG } from '../core/constants.js';
import { rand, randInt, weightedPick } from '../core/utils.js';

export class WaveSystem{
  constructor(game){ this.game=game; this.timer=0; this.spawnTimer=0; this.bossSpawned=false; }
  startWave(wave){ this.timer=CONFIG.wave.duration+wave*2; this.spawnTimer=0; this.bossSpawned=false; this.game.log(`Wave ${wave} 開始`); }
  update(dt){
    this.timer-=dt; this.spawnTimer-=dt;
    const wave=this.game.wave;
    const maxEnemies=CONFIG.wave.maxEnemiesBase+wave*6;
    if(this.timer>0 && this.spawnTimer<=0 && this.game.enemies.length<maxEnemies){
      this.spawnTimer=Math.max(.08,.82-wave*.025);
      const count=wave>8?randInt(2,4):wave>3?randInt(1,3):1;
      for(let i=0;i<count;i++)this.spawnEnemy(this.pickType(wave));
    }
    if(wave%CONFIG.wave.bossEvery===0 && !this.bossSpawned && this.timer<CONFIG.wave.duration*.72){ this.bossSpawned=true; this.spawnEnemy('boss'); this.game.log('Boss出現！'); }
    if(this.timer<=0 && this.game.enemies.length===0){ this.game.nextWave(); }
  }
  pickType(wave){
    const list=[{id:'grunt',weight:40},{id:'charger',weight:wave>=2?16:0},{id:'ranger',weight:wave>=3?12:0},{id:'tank',weight:wave>=4?8:0},{id:'bomber',weight:wave>=4?9:0},{id:'healer',weight:wave>=6?5:0},{id:'buffer',weight:wave>=7?4:0},{id:'summoner',weight:wave>=8?3:0},{id:'elite',weight:wave>=3?Math.min(2+wave*.3,10):0}].filter(x=>x.weight>0);
    return weightedPick(list).id;
  }
  spawnEnemy(type){
    const side=randInt(0,3); let x,y,pad=36;
    if(side===0){x=rand(0,CONFIG.arena.width);y=-pad}else if(side===1){x=CONFIG.arena.width+pad;y=rand(0,CONFIG.arena.height)}else if(side===2){x=rand(0,CONFIG.arena.width);y=CONFIG.arena.height+pad}else{x=-pad;y=rand(0,CONFIG.arena.height)}
    this.game.enemies.push(new Enemy(type,this.game.wave,x,y));
  }
}
