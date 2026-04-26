import { CONFIG } from '../core/constants.js';
import { clamp } from '../core/utils.js';
import { setCounts, collectEquipmentStats } from '../systems/loot.js';

const sumBonus = (equipment, key) => Object.values(equipment || {}).reduce((a,it)=>a + (it?.stats?.[key] || 0), 0);
const hasLegendary = (equipment, id) => Object.values(equipment || {}).some(it => it?.legendaryId === id);
const countLegendary = (equipment, id) => Object.values(equipment || {}).filter(it => it?.legendaryId === id).length;

export class Player{
  constructor(save, character){
    const up = save.upgrades;
    const lv = id => up[id] || 0;
    const eq = save.equipment || {};
    const sets = setCounts(eq);
    const eqStats = collectEquipmentStats(eq);
    const sumBase = (key) => eqStats.base[key] || 0;
    const sumAffix = (key) => eqStats.affix[key] || 0;
    const hasSet = (id,n)=> (sets[id]||0) >= n;
    this.character = character;
    this.characterGrowth = character?.growth || {};
    this.statusDamage = 1 + (character?.initialStats?.statusDamage || 0);
    this.statusDuration = 1;
    this.aoePower = 1;
    this.summonDamage = 1 + (character?.initialStats?.summonDamage || 0);
    this.summonAttackSpeed = 1;
    this.cooldownReduction = 0;
    this.x = CONFIG.arena.width/2; this.y = CONFIG.arena.height/2; this.r = CONFIG.player.radius;
    this.maxHp = CONFIG.player.baseHp + lv('vitality')*4 + sumBase('hp') + (hasSet('Guardian',2)?45:0) + (character?.initialStats?.maxHp||0);
    this.hp = this.maxHp; this.shield = Math.floor(this.maxHp*(lv('barrier')*0.01 + sumBase('barrier') + (hasSet('Guardian',2)?.08:0) + (character?.initialStats?.shieldRate||0))); 
    this.level = 1; this.xp = 0; this.nextXp = CONFIG.xp.base;
    this.baseDamage = CONFIG.player.baseDamage + lv('power')*1.8 + lv('summon')*0.8 + sumBase('damageFlat') + (hasSet('Inferno',2)?4:0) + (hasSet('Storm',2)?2:0);
    this.baseDamage *= 1 + (character?.initialStats?.damageMult||0);
    this.baseSpeed = CONFIG.player.baseSpeed + lv('speed')*1.5;
    this.baseAttackSpeed = CONFIG.player.baseAttackSpeed * (1 + lv('haste')*0.018 + (hasSet('Storm',2)?.08:0) + (character?.initialStats?.attackSpeedMult||0));
    this.baseRange = CONFIG.player.baseRange + lv('range')*2.2 + sumBase('range') + (hasSet('Storm',4)?28:0);
    this.magnet = 72 + lv('magnet')*3 + sumBase('magnet');
    this.regen = lv('regen')*0.08 + sumBase('regen');
    this.guard = Math.min(0.72, lv('guard')*0.006 + sumBase('guard') + (character?.initialStats?.guard||0));
    this.evasion = Math.min(0.42, lv('evasion')*0.0025 + sumBase('evasion'));
    this.stoneGain = lv('stoneGain')*0.035 + sumBase('stoneGain');
    this.dropRate = lv('dropRate')*0.006 + sumBase('dropRate');
    this.rarityLuck = lv('rarityLuck')*0.01 + sumBase('rarityLuck');
    this.xpGain = lv('xpGain')*0.015 + sumBase('xpGain');
    this.execution = lv('execution')*0.015 + (hasSet('Execution',2)?.10:0);
    this.elemental = lv('elemental')*0.012 + sumBase('elemental') + (hasSet('Inferno',2)?.08:0) + (hasSet('Venom',2)?.08:0) + (hasSet('Frost',2)?.06:0) + (character?.initialStats?.elemental||0);
    this.mods = {
      damageMult:sumBase('damageMult'), speedMult:sumBase('speedMult'), attackSpeedMult:sumBase('attackSpeedMult'),
      critChance:0.05+lv('critical')*0.004+sumBase('critChance') + (character?.initialStats?.critChance||0), critDamage:1.5+lv('critDamage')*0.01+sumBase('critDamage')
    };

    this.maxHp *= 1 + sumAffix('hpPercent');
    this.mods.damageMult += sumAffix('damageMult');
    this.mods.attackSpeedMult += sumAffix('attackSpeedMult');
    this.cooldownReduction = Math.min(0.7, this.cooldownReduction + sumAffix('cooldownReduction'));
    this.guard = Math.min(0.88, this.guard + sumAffix('damageReduction'));
    this.xpGain += sumAffix('xpGain');
    this.stoneGain += sumAffix('stoneGain');
    this.dropRate += sumAffix('dropRate') + (save.missionDropRateBonus || 0);
    this.summonDamage += sumAffix('summonDamage');
    const elemAffix = sumAffix('fireDamage') + sumAffix('lightningDamage') + sumAffix('iceDamage') + sumAffix('poisonDamage') + sumAffix('bleedDamage');
    this.elemental += elemAffix;

    this.flags = {
      chainLightning: countLegendary(eq,'stormBook'),
      fireExplosion: countLegendary(eq,'emberCore'),
      overhealBarrier: hasLegendary(eq,'mercyPlate') ? 1 : 0,
      poisonBurst: countLegendary(eq,'venomFang'),
      execute: countLegendary(eq,'executionCrown'),
      waveAttacks: countLegendary(eq,'abyssEngine'),
      minions: countLegendary(eq,'spiritTotem'),
      reflectBullets: countLegendary(eq,'mirrorShard'),
      setStorm: sets.Storm||0, setInferno: sets.Inferno||0, setVenom: sets.Venom||0, setFrost: sets.Frost||0, setGuardian: sets.Guardian||0, setLegion: sets.Legion||0, setExecution: sets.Execution||0,
      undying:0,
    };
    if(hasSet('Storm',4)) this.flags.chainLightning=(this.flags.chainLightning||0)+1;
    if(hasSet('Inferno',4)) this.flags.fireExplosion=(this.flags.fireExplosion||0)+1;
    if(hasSet('Venom',4)) this.flags.poisonBurst=(this.flags.poisonBurst||0)+1;
    if(hasSet('Frost',4)) this.flags.frostNova=(this.flags.frostNova||0)+1;
    if(hasSet('Guardian',4)) this.flags.barrierRegen=(this.flags.barrierRegen||0)+1;
    if(hasSet('Legion',2)) this.flags.minions=(this.flags.minions||0)+1;
    if(hasSet('Legion',4)) this.flags.minions=(this.flags.minions||0)+1;
    if(hasSet('Execution',4)) this.flags.executionNova=(this.flags.executionNova||0)+1;
    this.sets=sets;
    this.attackTimer = 0; this.auraTimer = 0; this.stormTimer = 0; this.minionTimer = 0; this.barrierTimer = 0; this.frostTimer = 0; this.bladeTimer = 0; this.blackHoleTimer = 0; this.guardianFieldTimer=0;
  }
  get damage(){ return this.baseDamage * (1 + this.mods.damageMult); }
  get speed(){ return this.baseSpeed * (1 + this.mods.speedMult); }
  get attackSpeed(){ return this.baseAttackSpeed * (1 + this.mods.attackSpeedMult); }
  get range(){ return this.baseRange; }
  update(dt, input, autoDir){
    let dx = input.x, dy = input.y;
    if (autoDir) { dx = autoDir.x; dy = autoDir.y; }
    this.isMoving = Math.abs(dx)+Math.abs(dy)>0.1;
    this.x = clamp(this.x + dx*this.speed*dt, this.r, CONFIG.arena.width-this.r);
    this.y = clamp(this.y + dy*this.speed*dt, this.r, CONFIG.arena.height-this.r);
    if (this.regen){
      const lowHpMult = this.flags.recoveryBoost && this.hp/this.maxHp<0.35 ? 1.8 : 1;
      const before=this.hp; this.hp = Math.min(this.maxHp, this.hp + this.regen*dt*lowHpMult);
      if(this.flags.overhealBarrier && before>=this.maxHp) this.shield=Math.min(this.maxHp*1.5,this.shield+this.regen*dt*.7);
    }
    if(this.flags.barrierRegen){ this.barrierTimer-=dt; if(this.barrierTimer<=0){this.barrierTimer=5.5; this.shield=Math.min(this.maxHp*1.3,this.shield+this.maxHp*(0.08+0.03*this.flags.barrierRegen));} }
  }
  gainXp(amount){
    this.xp += amount*(1+this.xpGain); let ups = 0;
    while(this.xp >= this.nextXp){
      this.xp -= this.nextXp; this.level++; ups++;
      this.nextXp = Math.floor(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, this.level-1));
    }
    return ups;
  }
  heal(amount){
    const healMult=this.healingMultiplier||1;
    amount*=healMult;
    const before=this.hp; this.hp=Math.min(this.maxHp,this.hp+amount);
    const over=Math.max(0,before+amount-this.maxHp);
    if(this.flags.overhealBarrier && over>0) this.shield=Math.min(this.maxHp*1.8,this.shield+over*.75);
  }
  takeDamage(amount){
    if(this.flags.dodgeWhileMoving && this.isMoving && Math.random()<Math.min(0.75, 0.08*this.flags.dodgeWhileMoving)) return { dodged:true, taken:0 };
    if(Math.random()<this.evasion) return { dodged:true, taken:0 };
    amount *= (1-this.guard);
    if(this.flags.shieldGuard && this.shield>0) amount*=Math.max(0.5,1-0.08*this.flags.shieldGuard);
    if (this.shield > 0){ const s = Math.min(this.shield, amount); this.shield -= s; amount -= s; }
    if(this.flags.contactGuard) amount*=Math.max(.65,1-0.05*this.flags.contactGuard);
    if(amount>=this.hp && this.flags.undying>0){
      this.flags.undying=0;
      this.hp=Math.max(1, this.maxHp*(0.15 + (this.flags.undyingRecovery||0)*0.04));
      this.flags.undyingInvuln=(this.flags.undyingRecovery||0)*0.55 + 0.8;
      return { dodged:false, taken:0, undying:true };
    }
    this.hp -= amount;
    return { dodged:false, taken:amount };
  }
  statsForUi(){
    return {
      HP: `${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)}`,
      障壁: Math.ceil(this.shield), 攻撃: this.damage.toFixed(1), 攻速: this.attackSpeed.toFixed(2),
      射程: Math.floor(this.range), 速度: Math.floor(this.speed), 会心率: `${Math.floor(this.mods.critChance*100)}%`, 会心倍率: `${this.mods.critDamage.toFixed(2)}x`,
      軽減: `${Math.floor(this.guard*100)}%`, 回避: `${Math.floor(this.evasion*100)}%`, ドロップ: `${Math.floor(this.dropRate*100)}%`
    };
  }
}
