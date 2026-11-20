/* TOUCH-026: trusted Chromium touch input; QA-only module instrumentation. */
const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const report={errors:[],viewports:[],checks:[]},out=__dirname;
const source=fs.readFileSync('img/experience/cursor.js','utf8');
const server=spawn('python3',['-m','http.server','11026','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
(async()=>{try{
 await new Promise(r=>setTimeout(r,350));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 async function open(width,height,mobile=true,reduced=false){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference'});
  const p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await p.route('**/cursor.js?*',r=>r.fulfill({contentType:'application/javascript',body:source+`\nwindow.__cursor={ripples,get frame(){return frame},get seeded(){return seeded},get canvas(){return canvas},clear,freeze(t){seeded=false;cancelAnimationFrame(frame);draw(t);cancelAnimationFrame(frame);frame=0;}};`}));
  await p.goto('http://127.0.0.1:11026');await p.waitForSelector('.is-coverflow');await p.waitForFunction(()=>!!window.__cursor);
  // Observe application actions, then prevent only external navigation in QA.
  await p.evaluate(()=>{window.__links=[];window.__touchEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','scroll'])document.addEventListener(type,e=>__touchEvents.push({type,t:performance.now(),timestamp:e.timeStamp,x:e.clientX,y:e.clientY}),{capture:true,passive:true});document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&/^(https:|mailto:)/.test(a.href)){__links.push({href:a.href,prevented:e.defaultPrevented,card:!!a.closest('.logo-card')});e.preventDefault();}});});
  return {p,context,cdp:await context.newCDPSession(p)};
 }
 async function point(p,selector){const l=p.locator(selector).first();await l.evaluate(e=>{const r=e.getBoundingClientRect();if(r.top<90||r.bottom>innerHeight)e.scrollIntoView({block:'center',behavior:'instant'});});await p.waitForTimeout(180);const b=await l.boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};}
 async function tapAt(p,cdp,q,hold=35){const down=cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q],timestamp:Date.now()/1000});await new Promise(r=>setTimeout(r,hold));const up=cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[],timestamp:Date.now()/1000});await Promise.all([down,up]);}
 async function idle(p){await p.waitForFunction(()=>__cursor.ripples.length===0&&__cursor.frame===0);}
 async function tap(p,cdp,selector){const q=await point(p,selector);await idle(p);await tapAt(p,cdp,q);const r=await p.evaluate(()=>__cursor.ripples.map(r=>({...r})));if(r.length!==1)console.log('tap failure',selector,q,await p.evaluate(q=>({target:document.elementFromPoint(q.x,q.y)?.outerHTML,hidden:document.hidden,events:window.__touchEvents}),q));assert.equal(r.length,1,selector+' exactly one ripple');assert(Math.abs(r[0].x-q.x)<1&&Math.abs(r[0].y-q.y)<1,selector+' origin');return q;}
 async function visual(p,name,q){
  const result=await p.evaluate(()=>{const c=__cursor,r=c.ripples.at(-1);c.freeze(r.born+140);const canvas=c.canvas,data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,dpr=canvas.width/innerWidth;let count=0,minX=Infinity,minY=Infinity,maxX=0,maxY=0;for(let i=3;i<data.length;i+=4)if(data[i]>8){const j=(i-3)/4,x=j%canvas.width/dpr,y=Math.floor(j/canvas.width)/dpr;count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}return {count,minX,minY,maxX,maxY,seeded:c.seeded,display:getComputedStyle(canvas).display,canvasCount:document.querySelectorAll('.cursor-trail').length};});
  console.log('visual',name,q,result);assert(result.count>100);assert(Math.abs((result.minX+result.maxX)/2-q.x)<1);assert(Math.abs((result.minY+result.maxY)/2-q.y)<1);assert.equal(result.canvasCount,1);assert.notEqual(result.display,'none');
  await p.screenshot({path:`${out}/${name}.png`});await p.evaluate(()=>__cursor.clear());return result;
 }
 for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[1440,900]].filter(([w])=>!process.argv[2]||w===Number(process.argv[2]))){
  const mobile=width!==1440,{p,context,cdp}=await open(width,height,mobile);
  const entry={width,height,mobile};
  if(mobile){
   let q=await tap(p,cdp,'.hero-actions .button-primary');entry.visual=await visual(p,`ripple-${width}`,q);assert.equal(entry.visual.seeded,false);
   q=await tap(p,cdp,'.whatsapp-float');await visual(p,`whatsapp-${width}`,q);
   await tap(p,cdp,'[data-logo-next]');await p.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await p.locator('.logo-showcase').getAttribute('data-logo'),'1');
   await tap(p,cdp,'[data-logo-prev]');await p.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await p.locator('.logo-showcase').getAttribute('data-logo'),'0');
   // Side cards are partially clipped on mobile: target their exposed strips.
   const stage=await p.locator('.coverflow-stage').boundingBox();
   for(const [pos,edge,expected] of [['1',.97,'1'],['-1',.03,'0']]){
    await idle(p);const q={x:stage.x+stage.width*edge,y:stage.y+stage.height/2};assert.equal(await p.evaluate(q=>document.elementFromPoint(q.x,q.y)?.closest('.logo-card')?.dataset.position,q),pos);
    await tapAt(p,cdp,q);assert.equal(await p.evaluate(()=>__cursor.ripples.length),1);await p.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await p.locator('.logo-showcase').getAttribute('data-logo'),expected);
   }
   q=await tap(p,cdp,'.logo-card[data-position="0"]');entry.centerVisual=await visual(p,`coverflow-${width}`,q);assert((await p.evaluate(()=>__links)).some(e=>e.href.includes('metlife')));
   if(width===390){
    // Genuine horizontal gesture: normal coverflow navigation, no ripple.
    q=await point(p,'.logo-card[data-position="0"]');await idle(p);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});
    for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q.x-i*16,y:q.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);await p.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await p.locator('.logo-showcase').getAttribute('data-logo'),'1');
    // Vertical drag beginning on a control must scroll and cancel tap.
    q=await point(p,'.logo-card[data-position="0"]');const before=await p.evaluate(()=>scrollY);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});
    for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q.x,y:q.y-i*22}]});await p.waitForTimeout(20);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);assert((await p.evaluate(()=>scrollY))>before);
    // Full-path threshold, cancellation and pinch/multitouch do not become taps.
    q=await point(p,'.logo-card[data-position="0"]');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q.x+18,y:q.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...q,id:1},{x:q.x+60,y:q.y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    // Long press, disabled control, blank space and synthetic events.
    q=await point(p,'.whatsapp-float');await tapAt(p,cdp,q,650);assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    q=await point(p,'[data-logo-pause]');await p.locator('[data-logo-pause]').evaluate(e=>e.disabled=true);await tapAt(p,cdp,q);assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);await p.locator('[data-logo-pause]').evaluate(e=>e.disabled=false);
    await p.evaluate(()=>__cursor.clear());await tapAt(p,cdp,{x:5,y:400});assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    await p.locator('.whatsapp-float').evaluate(e=>e.click());assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    // Keyboard remains functional without a touch ripple.
    await p.locator('[data-logo-next]').focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    await p.waitForTimeout(900);
    await tap(p,cdp,'.menu-toggle');assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await tap(p,cdp,'.site-nav a[href="#contacto"]');await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>location.hash),'#contacto');
    await tap(p,cdp,'#full-name');assert.equal(await p.locator('#full-name').evaluate(e=>document.activeElement===e),true);await p.keyboard.type('QA touch');assert.equal(await p.locator('#full-name').inputValue(),'QA touch');
    // Repeated trusted taps share a single bounded queue.
    q=await point(p,'.whatsapp-float');await p.evaluate(()=>__cursor.clear());for(let i=0;i<12;i++)await tapAt(p,cdp,q,1);assert((await p.evaluate(()=>__cursor.ripples.length))<=8);
    await idle(p);entry.cleanup=await p.evaluate(()=>{const c=__cursor.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return {nonzero:d.some((v,i)=>i%4===3&&v!==0),frame:__cursor.frame,ripples:__cursor.ripples.length};});assert.equal(entry.cleanup.nonzero,false);
    await p.screenshot({path:out+'/cleared-390.png'});
    await tap(p,cdp,'.whatsapp-float');await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>__cursor.frame),0);await tapAt(p,cdp,q);assert.equal(await p.evaluate(()=>__cursor.ripples.length),0);
    await p.emulateMedia({reducedMotion:'no-preference'});
    await tap(p,cdp,'.whatsapp-float');await p.setViewportSize({width:391,height:844});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__cursor.frame),0);await p.setViewportSize({width,height});
    entry.render=await p.evaluate(()=>{const c=__cursor;c.clear();const t=performance.now();for(let i=0;i<8;i++)c.ripples.push({x:50+i*35,y:300,born:t});const times=[];for(let i=0;i<120;i++){const start=performance.now();c.freeze(t+100+i);times.push(performance.now()-start);}c.clear();return {samples:times.length,meanMs:times.reduce((a,b)=>a+b)/times.length,maxMs:Math.max(...times)};});
    await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));assert.equal(await p.locator('.cursor-trail').count(),0);assert.equal(await p.evaluate(()=>__cursor.frame),0);
   }
  }else{
   const q=await point(p,'.hero-actions .button-primary');await p.mouse.move(q.x,q.y);await p.evaluate(()=>__cursor.clear());await p.mouse.click(q.x,q.y);assert.equal(await p.evaluate(()=>__cursor.ripples.length),1);entry.visual=await visual(p,'ripple-1440',q);await idle(p);
   await p.mouse.move(q.x+10,q.y);assert.equal(await p.evaluate(()=>__cursor.seeded),true);await idle(p);
  }
  entry.overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(entry.overflow,false);entry.externalActions=await p.evaluate(()=>__links);assert(entry.externalActions.filter(e=>!e.card).every(e=>!e.prevented));report.viewports.push(entry);await context.close();console.log(width,'PASS');
 }
 const {p,context,cdp}=await open(390,844,true,true);const q=await point(p,'.hero-actions .button-primary');await tapAt(p,cdp,q);assert.equal(await p.locator('.cursor-trail').count(),0);assert.equal(await p.evaluate(()=>__links.length),1);await context.close();
 assert.deepEqual(report.errors,[]);report.checks.push('PASS for selected viewport entries; detailed assertions are in qa.cjs. Gesture, form, menu, repeated tap, cleanup, resize and performance checks run at width 390; mouse checks at 1440; initial reduced motion at 390 runs on every invocation.');report.pass=true;
}finally{fs.writeFileSync(out+'/results'+(process.argv[2]?'-'+process.argv[2]:'')+'.json',JSON.stringify(report,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
