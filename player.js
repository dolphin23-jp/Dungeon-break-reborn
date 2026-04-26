import { CONFIG } from '../core/constants.js';
import { clamp } from '../core/utils.js';
import { UPGRADE_DEFS } from '../data/upgrades.js';

export class Player{
  constructor(save){
    const up = save.upgrades;
    const lv = id => up[id] || 0;
    this.x = CONFIG.arena.width/2; this.y = CONFIG.arena.height/2; this.r = CONFIG.player.radius;
    this.maxHp = CONFIG.player.baseHp + lv('vitality')*4;
    this.hp = this.maxHp; this.shield = 0;
    this.level = 1; this.xp = 0; this.nextXp = CONFIG.xp.base;
    this.baseDamage = CONFIG.player.baseDamage + lv('power')*1.8 + lv('summon')*0.8;
    this.baseSpeed = CONFIG.player.baseSpeed + lv('speed')*1.5;
    this.baseAttackSpeed = CONFIG.player.baseAttackSpeed * (1 + lv('haste')*0.018);
    this.baseRange = CONFIG.player.baseRange + lv('range')*2.2;
    this.magnet = 65 + lv('magnet')*3;
    this.regen = lv('regen')*0.08;
    this.guard = Math.min(0.65, lv('guard')*0.006);
    this.stoneGain = lv('stoneGain')*0.035;
    this.execution = lv('execution')*0.015;
    this.mods = { damageMult:0, speedMult:0, attackSpeedMult:0, critChance:0.05+lv('critical')*0.004, critDamage:1.5 };
    this.flags = {};
    this.attackTimer = 0; this.auraTimer = 0; this.stormTimer = 0; this.minionTimer = 0;
  }
  get damage(){ return this.baseDamage * (1 + this.mods.damageMult); }
  get speed(){ return this.baseSpeed * (1 + this.mods.speedMult); }
  get attackSpeed(){ return this.baseAttackSpeed * (1 + this.mods.attackSpeedMult); }
  get range(){ return this.baseRange; }
  update(dt, input, autoDir){
    let dx = input.x, dy = input.y;
    if (autoDir) { dx = autoDir.x; dy = autoDir.y; }
    this.x = clamp(this.x + dx*this.speed*dt, this.r, CONFIG.arena.width-this.r);
    this.y = clamp(this.y + dy*this.speed*dt, this.r, CONFIG.arena.height-this.r);
    if (this.regen) this.hp = Math.min(this.maxHp, this.hp + this.regen*dt);
  }
  gainXp(amount){
    this.xp += amount; let ups = 0;
    while(this.xp >= this.nextXp){
      this.xp -= this.nextXp; this.level++; ups++;
      this.nextXp = Math.floor(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, this.level-1));
    }
    return ups;
  }
  takeDamage(amount){
    amount *= (1-this.guard);
    if (this.shield > 0){ const s = Math.min(this.shield, amount); this.shield -= s; amount -= s; }
    this.hp -= amount;
  }
  statsForUi(){
    return {
      HP: `${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)}`,
      障壁: Math.ceil(this.shield), 攻撃: this.damage.toFixed(1), 攻速: this.attackSpeed.toFixed(2),
      射程: Math.floor(this.range), 速度: Math.floor(this.speed), 会心率: `${Math.floor(this.mods.critChance*100)}%`, 軽減: `${Math.floor(this.guard*100)}%`
    };
  }
}
