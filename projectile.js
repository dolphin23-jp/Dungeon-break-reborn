export class Projectile{
  constructor(x,y,target,damage,options={}){
    Object.assign(this,{x,y,target,damage,r:5,speed:560,life:1.4,pierce:0,color:'#67d4ff',owner:'player',vx:0,vy:0,hit:new Set(),effect:null},options);
  }
  update(dt){
    this.life-=dt;
    if(this.target && this.target.hp>0){
      const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy)||1;
      this.x+=dx/d*this.speed*dt; this.y+=dy/d*this.speed*dt;
    }else{
      this.x+=this.vx*this.speed*dt; this.y+=this.vy*this.speed*dt;
    }
  }
}
