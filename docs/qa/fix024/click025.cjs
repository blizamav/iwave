/* Focused CLICK-025 QA; reuses the external browser from FIX-024. */
const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const out=__dirname,report={errors:[],checks:[],clicks:[]};
const server=spawn('python3',['-m','http.server','11025','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
const source=fs.readFileSync('img/experience/cursor.js','utf8');
(async()=>{try{
 await new Promise(r=>setTimeout(r,350));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 async function open(options={}){
  const page=await context.newPage();
  if(options.mobile){await page.setViewportSize({width:390,height:844});}
  await page.emulateMedia({reducedMotion:options.reduced?'reduce':'no-preference'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  if(options.noWebgl)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
  await page.route('**/cursor.js?*',route=>route.fulfill({contentType:'application/javascript',body:source+'\nwindow.__cursor={ripples,get frame(){return frame},get canvas(){return canvas},clear,draw,freeze(t){cancelAnimationFrame(frame);draw(t);cancelAnimationFrame(frame);frame=0;}};'}));
  await page.goto('http://127.0.0.1:11025');await page.waitForSelector('.is-coverflow');await page.waitForFunction(()=>!!window.__cursor);return page;
 }
 const page=await open();
 await page.waitForSelector('.logo-showcase.is-webgl');
 await page.evaluate(()=>{
  window.__events=[];window.__shifts=0;
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)__shifts+=e.value;}).observe({type:'layout-shift',buffered:false});
  // Keep external destinations local; verify the application has not cancelled them.
  document.addEventListener('click',e=>{__events.push({trusted:e.isTrusted,prevented:e.defaultPrevented,href:e.target.closest('a')?.getAttribute('href')});},{capture:true});
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&/^(https:|mailto:)/.test(a.href))e.preventDefault();});
 });
 async function click(selector,name){
  const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await page.waitForTimeout(1500);
  const box=await el.boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);
  await page.mouse.click(x,y);
  const state=await page.evaluate(()=>{const c=__cursor,r=c.ripples.at(-1);return {r:r&&{...r},count:c.ripples.length,pointerEvents:getComputedStyle(c.canvas).pointerEvents,event:__events.at(-1)};});
  assert(state.r,name+' ripple');assert(Math.abs(state.r.x-x)<1&&Math.abs(state.r.y-y)<1,name+' origin');assert.equal(state.pointerEvents,'none');assert.equal(state.event.prevented,false);assert(state.event.trusted);
  report.clicks.push({name,x,y,...state});console.log(name,'PASS');return state.r;
 }
 await click('[data-logo-next]','carousel next');await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await page.locator('.logo-showcase').getAttribute('data-logo'),'1');
 await click('[data-logo-prev]','carousel previous');await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await page.locator('.logo-showcase').getAttribute('data-logo'),'0');
 await click('[data-position="1"]','right lateral');await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await page.locator('.logo-showcase').getAttribute('data-logo'),'1');
 await click('[data-position="-1"]','left lateral');await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');assert.equal(await page.locator('.logo-showcase').getAttribute('data-logo'),'0');
 await click('.hero-actions .button-primary','primary CTA');await click('.hero-actions .button-secondary','secondary CTA');
 await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>location.hash),'#servicios');
 await click('.menu-toggle','navigation open');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
 await click('.site-nav a[href="#contacto"]','navigation contact');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>location.hash),'#contacto');
 await click('.contact-direct a[href^="mailto:"]','contact email');await click('.contact-direct a[href^="https:"]','contact WhatsApp');await click('.whatsapp-float','floating WhatsApp');
 // Isolated ring after the trail has stopped. Freeze only this evidence frame at 140ms.
 await page.mouse.move(600,450);await page.waitForTimeout(1400);await page.evaluate(()=>{__cursor.clear();window.__layoutBefore=[document.documentElement.scrollWidth,document.documentElement.scrollHeight,document.querySelector('main').getBoundingClientRect().width];});await page.mouse.click(600,450);
 await page.waitForFunction(()=>__cursor.ripples.length===0&&__cursor.frame===0);
 const empty=await page.evaluate(()=>{const c=__cursor.canvas,ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height).data;let count=0,minX=Infinity,maxX=0,minY=Infinity,maxY=0,maxAlpha=0;for(let i=3;i<d.length;i+=4)if(d[i]){const p=(i-3)/4,x=p%c.width,y=Math.floor(p/c.width);count++;maxAlpha=Math.max(maxAlpha,d[i]);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}return {count,minX,maxX,minY,maxY,maxAlpha,frame:__cursor.frame,rings:__cursor.ripples.length,dimensions:[c.width,c.height,innerWidth,innerHeight],transform:ctx.getTransform().toString()};});report.cleanup=empty;console.log('natural cleanup',empty);assert.equal(empty.count,0);
 await page.screenshot({path:out+'/click025-desktop-cleared.png'});
 await page.mouse.click(600,450);
 const visual=await page.evaluate(()=>{
  const c=__cursor,r=c.ripples.at(-1),ctx=c.canvas.getContext('2d'),arcs=[],arc=ctx.arc.bind(ctx);
  ctx.arc=(...args)=>{arcs.push(args);arc(...args);};c.freeze(r.born+140);ctx.arc=arc;
  const dpr=c.canvas.width/innerWidth,data=ctx.getImageData(0,0,c.canvas.width,c.canvas.height).data;let count=0,minX=Infinity,maxX=0,minY=Infinity,maxY=0;
  for(let i=3;i<data.length;i+=4)if(data[i]>8){const p=(i-3)/4,x=p%c.canvas.width/dpr,y=Math.floor(p/c.canvas.width)/dpr;count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  return {arcs,count,minX,maxX,minY,maxY};
 });
 report.visual=visual;console.log('ring pixels',visual);assert(visual.count>100);assert.equal(visual.arcs.length,2);assert(visual.arcs.every(a=>a[0]===600&&a[1]===450));assert(Math.abs((visual.minX+visual.maxX)/2-600)<1);assert(Math.abs((visual.minY+visual.maxY)/2-450)<1);report.visual=visual;
 await page.screenshot({path:out+'/click025-desktop-ripple.png'});
 await page.evaluate(()=>__cursor.clear());
 await page.mouse.click(600,450,{button:'right'});assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);await page.keyboard.press('Escape');
 await page.evaluate(()=>document.body.click());assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);
 await page.locator('.menu-toggle').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);await page.keyboard.press('Escape');
 await page.mouse.move(650,450,{steps:10});assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);
 await page.mouse.click(600,450,{clickCount:12,delay:1});assert((await page.evaluate(()=>__cursor.ripples.length))<=8);
 report.layoutShift=await page.evaluate(()=>__shifts);report.rippleLayout=await page.evaluate(()=>({before:__layoutBefore,after:[document.documentElement.scrollWidth,document.documentElement.scrollHeight,document.querySelector('main').getBoundingClientRect().width],position:getComputedStyle(__cursor.canvas).position}));assert.deepEqual(report.rippleLayout.before,report.rippleLayout.after);assert.equal(report.rippleLayout.position,'fixed');
 await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);await page.mouse.click(500,400);assert.equal(await page.evaluate(()=>__cursor.ripples.at(-1).x),500);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);assert.equal(await page.evaluate(()=>__cursor.frame),0);await page.mouse.click(500,400);assert.equal(await page.evaluate(()=>__cursor.ripples.length),0);

 report.checks.push('Real mouse clicks on controls, both laterals, navigation, both CTAs and contact; exact viewport origins and unblocked handlers','Two visible concentric rings; complete transparent cleanup and RAF idle','Right click, keyboard, scripted clicks and movement ignored','Rapid clicks bounded to eight; resize and live reduced-motion clear and stop','Fixed ripple canvas; document and main dimensions unchanged; overall page CLS recorded separately');
 await page.close();
 const reduced=await open({reduced:true});await reduced.mouse.click(600,450);assert.equal(await reduced.locator('.cursor-trail').count(),0);await reduced.close();
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>report.errors.push(e.message));await mobile.goto('http://127.0.0.1:11025');await mobile.waitForSelector('.is-coverflow');await mobile.touchscreen.tap(180,400);assert.equal(await mobile.locator('.cursor-trail').count(),0);await mobile.evaluate(()=>scrollTo(0,500));assert((await mobile.evaluate(()=>scrollY))>0);await mobile.screenshot({path:out+'/click025-mobile.png'});await mobileContext.close();
 const fallback=await open({noWebgl:true});await fallback.mouse.click(600,450);assert.equal(await fallback.evaluate(()=>__cursor.ripples.length),1);
 // Time only cursor rendering, excluding WebGL and pixel readback/screenshot costs.
 report.cursorRender=await fallback.evaluate(()=>{const c=__cursor,t=performance.now();for(let i=0;i<7;i++)c.ripples.push({x:100+i*70,y:300,born:t});const timings=[];for(let i=0;i<120;i++){const start=performance.now();c.freeze(t+100+i);timings.push(performance.now()-start);}c.clear();return {samples:timings.length,meanMs:timings.reduce((a,b)=>a+b)/timings.length,maxMs:Math.max(...timings)};});
 await fallback.close();report.checks.push('Initial reduced-motion and mobile touch: no artificial cursor; mobile scroll available','No WebGL: ripple available; 120 draw samples with eight rings measured');assert.deepEqual(report.errors,[]);console.log('CLICK-025 PASS',JSON.stringify(report.cursorRender));
}finally{fs.writeFileSync(out+'/click025.json',JSON.stringify(report,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
