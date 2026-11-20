/* CURSOR-023 — original layered spline ribbon; independent of WebGL availability.
 * One on-demand RAF, persistent history, viewport coordinates and capped DPR. */
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const abort = new AbortController();
const on = (el, type, fn, options = {}) => el.addEventListener(type,fn,{...options,signal:abort.signal});
let canvas, ctx, frame = 0, previous = 0, moved = 0, interactive = false, seeded = false;
const head = {x:0,y:0};
const points = Array.from({length:32},()=>({x:0,y:0}));
const ripples = [], rippleDuration = 640, maxRipples = 8;
const allowed = () => !reduced.matches && !document.hidden;
let tap = null;
const control = target => target instanceof Element ? target.closest('a[href],button,input:not([type="hidden"]),textarea,select,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])') : null;
const enabled = el => el && !el.matches(':disabled') && !el.closest('[inert],[aria-disabled="true"]');
function clear() {
  cancelAnimationFrame(frame); frame=0;previous=0;seeded=false;
  ripples.length=0;tap=null;
  if(ctx)ctx.clearRect(0,0,innerWidth,innerHeight);
}
function resize() {
  clear();
  if(!canvas)return;
  const dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function setup() {
  if(canvas)return;
  canvas=document.createElement('canvas');canvas.className='cursor-trail';canvas.setAttribute('aria-hidden','true');
  ctx=canvas.getContext('2d');
  if(!ctx){canvas=null;return;}
  document.body.append(canvas);resize();
}
function path(offset) {
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y+offset);
  for(let i=1;i<points.length-1;i++) {
    const a=points[i],b=points[i+1];
    ctx.quadraticCurveTo(a.x,a.y+offset,(a.x+b.x)/2,(a.y+b.y)/2+offset);
  }
  const last=points.at(-1);ctx.lineTo(last.x,last.y+offset);
}
function draw(now) {
  frame=0;
  if(!allowed()){clear();return;}
  const age=seeded?(now-moved)/1000:Infinity;
  for(let i=ripples.length-1;i>=0;i--)if(now-ripples[i].born>=rippleDuration)ripples.splice(i,1);
  if(age>1.25&&!ripples.length){clear();return;}
  const dt=previous?Math.min((now-previous)/1000,.06):1/60;previous=now;
  // Exponential relaxation is stable across refresh rates. A temporal chain gives a continuous tail.
  const steps=Math.ceil(dt*120), step=dt/steps;
  const follow=1-Math.exp(-step*42), lag=1-Math.exp(-step*55);
  for(let n=0;seeded&&n<steps;n++) {
    points[0].x+=(head.x-points[0].x)*follow;points[0].y+=(head.y-points[0].y)*follow;
    for(let i=1;i<points.length;i++) {
      const p=points[i];p.x+=(points[i-1].x-p.x)*lag;p.y+=(points[i-1].y-p.y)*lag;
      const distance=Math.hypot(p.x-head.x,p.y-head.y);
      if(distance>200){p.x=head.x+(p.x-head.x)*200/distance;p.y=head.y+(p.y-head.y)*200/distance;}
    }
  }
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const tail=points.at(-1),distance=Math.hypot(head.x-tail.x,head.y-tail.y);
  const alpha=Math.min(1,distance/24)*Math.max(0,1-Math.max(0,age-.08)/.95);
  if(seeded&&fine.matches&&alpha>.002&&distance>1) {
    const gradient=ctx.createLinearGradient(tail.x,tail.y,head.x,head.y);
    gradient.addColorStop(0,'#246bfd00');gradient.addColorStop(.38,'#246bfd80');gradient.addColorStop(1,'#35d6ff');
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=gradient;
    // Soft blue depth layer, narrow cyan ribbon and fine illuminated edge.
    ctx.globalAlpha=alpha*.28;ctx.lineWidth=interactive?7:6;path(1.8);ctx.stroke();
    ctx.globalAlpha=alpha*.9;ctx.lineWidth=interactive?2.6:2.1;path(0);ctx.stroke();
    ctx.globalAlpha=alpha*.65;ctx.lineWidth=.7;ctx.strokeStyle='#b3f4ff';path(-.5);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // Cubic ease-out gives a quick liquid expansion followed by a quiet fade.
  for(const ripple of ripples) {
    const t=Math.max(0,(now-ripple.born)/rippleDuration);
    const radius=3+36*(1-Math.pow(1-t,3));
    const opacity=.64*Math.pow(1-t,1.6)*Math.min(1,t/.07);
    const gradient=ctx.createLinearGradient(ripple.x-radius,ripple.y-radius,ripple.x+radius,ripple.y+radius);
    gradient.addColorStop(0,'#35D6FF');gradient.addColorStop(1,'#67E8C8');
    ctx.strokeStyle=gradient;ctx.lineWidth=1;ctx.globalAlpha=opacity;
    ctx.beginPath();ctx.arc(ripple.x,ripple.y,radius,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=opacity*.25;ctx.lineWidth=.65;
    ctx.beginPath();ctx.arc(ripple.x,ripple.y,Math.max(1,radius*.76),0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;
  frame=requestAnimationFrame(draw);
}
// Capture also observes controls that stop propagation; never cancels their action.
function ripple(x,y) {
  setup();if(!ctx)return;
  if(ripples.length===maxRipples)ripples.shift();
  ripples.push({x,y,born:performance.now()});
  if(!frame)frame=requestAnimationFrame(draw);
}
on(document,'click',e=>{
  if(!e.isTrusted||e.pointerType!=='mouse'||e.button!==0||e.detail===0||!fine.matches||!allowed())return;
  ripple(e.clientX,e.clientY);
},{capture:true,passive:true});
// Touch uses pointerup only: compatibility clicks never enter the mouse path.
// Track the entire path, so moving away and returning cannot become a tap.
on(document,'pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  const el=control(e.target);
  if(!e.isTrusted||!e.isPrimary||tap||!allowed()||!enabled(el)){tap=null;return;}
  seeded=false;
  tap={id:e.pointerId,el,x:e.clientX,y:e.clientY,born:e.timeStamp};
},{capture:true,passive:true});
on(document,'pointermove',e=>{
  if(tap&&e.pointerId===tap.id&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10)tap=null;
},{capture:true,passive:true});
on(document,'pointerup',e=>{
  if(!tap||e.pointerId!==tap.id)return;
  const start=tap;tap=null;
  if(!e.isTrusted||!allowed()||!enabled(start.el)||control(e.target)!==start.el||e.timeStamp-start.born>500||Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)return;
  ripple(start.x,start.y);
},{capture:true,passive:true});
on(document,'pointercancel',()=>{tap=null;},{capture:true,passive:true});
on(document,'scroll',()=>{tap=null;},{capture:true,passive:true});
on(document,'contextmenu',()=>{tap=null;},{capture:true,passive:true});
on(document,'pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  if(!fine.matches||!allowed()){clear();return;}
  if(e.target.closest('input,textarea,select')){clear();return;}
  setup();if(!ctx)return;
  head.x=e.clientX;head.y=e.clientY;moved=performance.now();
  interactive=!!e.target.closest('a,button,[role="button"]');
  if(!seeded){points.forEach(p=>{p.x=head.x;p.y=head.y;});seeded=true;}
  if(!frame)frame=requestAnimationFrame(draw);
},{passive:true});
on(window,'resize',resize,{passive:true});
on(window,'blur',clear);on(document.documentElement,'pointerleave',e=>{if(e.pointerType==='mouse')clear();});
on(document,'visibilitychange',clear);on(fine,'change',clear);on(reduced,'change',clear);
on(window,'pagehide',e=>{clear();if(!e.persisted){abort.abort();canvas?.remove();}});
