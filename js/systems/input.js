import { normalize } from '../core/utils.js';
export class InputSystem{
  constructor(canvas){
    this.keys=new Set(); this.vector={x:0,y:0}; this.touchVector={x:0,y:0}; this.touching=false;
    window.addEventListener('keydown',e=>{this.keys.add(e.key.toLowerCase());});
    window.addEventListener('keyup',e=>{this.keys.delete(e.key.toLowerCase());});
    const stick=document.getElementById('mobileStick'); const knob=stick?.querySelector('.stick-knob');
    const updateTouch=e=>{ const t=e.touches[0]; if(!t)return; const rect=stick.getBoundingClientRect(); const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2; const dx=t.clientX-cx,dy=t.clientY-cy; const n=normalize(dx,dy); const len=Math.min(45,Math.hypot(dx,dy)); this.touchVector={x:n.x*(len/45),y:n.y*(len/45)}; if(knob){knob.style.left=`${41+n.x*len}px`; knob.style.top=`${41+n.y*len}px`;}};
    stick?.addEventListener('touchstart',e=>{this.touching=true;updateTouch(e);},{passive:false});
    stick?.addEventListener('touchmove',e=>{e.preventDefault();updateTouch(e);},{passive:false});
    stick?.addEventListener('touchend',()=>{this.touching=false;this.touchVector={x:0,y:0}; if(knob){knob.style.left='41px';knob.style.top='41px';}});
  }
  update(){
    let x=0,y=0; if(this.keys.has('arrowleft')||this.keys.has('a'))x--; if(this.keys.has('arrowright')||this.keys.has('d'))x++; if(this.keys.has('arrowup')||this.keys.has('w'))y--; if(this.keys.has('arrowdown')||this.keys.has('s'))y++;
    const n=normalize(x,y); this.vector=this.touching?this.touchVector:{x:x?n.x:0,y:y?n.y:0}; return this.vector;
  }
}
