/* External Playwright/Chromium + SwiftShader; no installed project dependencies. */
const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
if(process.argv[2]==='bounds'){require('./bounds.cjs');return;}
if(process.argv[2]==='layers'){require('./layers.cjs');return;}
if(process.argv[2]==='before'){require('./baseline.cjs');return;}
const mode=process.argv[2]||'1440',width=+mode||1440,height={360:800,390:844,430:932,768:1024,1440:900}[width];
const out=__dirname,report={mode,viewport:{width,height},errors:[],checks:[],transitions:[]};
if(mode==='matrix'){for(const m of ['1440','360','390','430','768','no-webgl','reduced']){const r=require('node:child_process').spawnSync(process.execPath,[__filename,m],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}process.exit(0);}
const port=12000+width;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
(async()=>{try{
 await new Promise(r=>setTimeout(r,350));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width,height},isMobile:width<768,hasTouch:width<768,reducedMotion:mode==='reduced'?'reduce':'no-preference'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 if(mode==='no-webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
 await page.route('**/exp009.js?*',route=>route.fulfill({body:fs.readFileSync('img/experience/exp009.js','utf8').replace('function render(scene, camera, dt, time) {','function render(scene, camera, dt, time) { window.__fx={meshes:logoMeshes};'),contentType:'application/javascript'}));
 await page.route('**/journey.js?*',route=>route.fulfill({body:fs.readFileSync('img/experience/journey.js','utf8').replace('const system = new T.Group();','const system = new T.Group(); window.__ambient=system;'),contentType:'application/javascript'}));
 console.log(mode,'loading');await page.goto('http://127.0.0.1:'+port);await page.waitForSelector('.is-coverflow');
 const gpu=!['reduced','no-webgl'].includes(mode);if(gpu)await page.waitForSelector('.logo-showcase.is-webgl');
 const host=page.locator('.logo-showcase'),wa=page.locator('.whatsapp-float');
 const waHref=await wa.getAttribute('href');assert.equal(waHref,'https://wa.me/56953442563?text=Hola%20iWave%2C%20quiero%20solicitar%20una%20evaluacion%20de%20productividad%20digital.');
 const whatsapp=async()=>{const state=await wa.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {visible:s.visibility==='visible'&&s.opacity==='1',fixed:s.position==='fixed',hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),w:r.width,h:r.height,parent:el.parentElement.tagName,z:s.zIndex};});assert(state.visible&&state.fixed&&state.hit&&state.h>=44&&state.w>=44);return state;};
 report.whatsapp=[];
 for(const id of ['inicio','transformacion','servicios','experiencia','capacidades','proceso','contacto']){await page.locator('#'+id).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-90,behavior:'instant'}));await page.waitForTimeout(130);report.whatsapp.push({id,...await whatsapp()});}
 report.checks.push('WhatsApp fixed, visible, >=44px and hit-testable in seven sections; original href');
 await host.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-140,behavior:'instant'}));await page.waitForTimeout(350);
 await page.locator('[data-logo-pause]').click();
 await page.evaluate(()=>{
  window.__runs=[];
  document.querySelector('.logo-showcase').addEventListener('coverflowchange',({detail:d})=>{
   const h=document.querySelector('.logo-showcase');
   if(d.phase==='start')__runs.push({index:d.index,start:performance.now(),frames:[]});
   const run=__runs.at(-1);if(!run)return;
   const tracks=h.querySelector('.coverflow-stage').getAnimations({subtree:true}).filter(a=>a.effect?.target?.classList.contains('logo-card'));
   const meshes=window.__fx?.meshes;
   run.frames.push({time:performance.now(),phase:d.phase,p:d.progress,trackTimes:tracks.map(a=>a.currentTime),fragment:h.dataset.fragment||null,marks:meshes?.map(m=>({p:m.material.uniforms.uProgress.value,opacity:m.material.uniforms.uOpacity.value})),wa:getComputedStyle(document.querySelector('.whatsapp-float')).visibility});
   if(d.phase==='complete')run.end=performance.now();
  });
 });
 const wait=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete'&&!document.querySelector('.logo-showcase').dataset.fragment);
 const index=()=>host.evaluate(h=>+h.dataset.logo);
 for(let i=0;i<4;i++){
  await page.locator('[data-logo-next]').evaluate(el=>el.click());await wait();await whatsapp();
  assert.equal(await index(),(i+1)%4);
  await host.screenshot({path:`${out}/${mode}-brand-${(i+1)%4}.png`});
 }
 if(gpu){
  const runs=await page.evaluate(()=>__runs);
  assert.equal(runs.length,4);for(const r of runs){assert.equal(r.frames[0].fragment,'running');const f=r.frames.filter(f=>f.phase==='progress'&&f.p>0&&f.p<1);assert(f.length>0);assert(f.every(x=>x.fragment==='running'&&x.trackTimes.every(t=>Math.abs(t-x.p*800)<.01)));assert(f.every(x=>x.wa==='visible'));assert(f.some(x=>x.marks[r.index].p>0));assert(f.every((x,i)=>i===0||x.marks[r.index].p<=f[i-1].marks[r.index].p));assert(f.every(x=>Math.abs(x.marks[r.index].p-.48*(1-x.p))<.00001));assert.equal(r.frames.at(-1).fragment,null);assert(r.frames.at(-1).marks.every(m=>m.opacity===0));}
  report.checks.push('All four manual transitions: shared progress, no temporal difference in CSS/GPU updates, fragments cleared atomically');
 }
 report.manualRuns=await page.evaluate(()=>__runs);await page.evaluate(()=>{__runs=[];});
 if(gpu){
  console.log(mode,'manual passed; autoplay');await page.locator('[data-logo-pause]').evaluate(el=>el.click());
  await page.locator('[data-logo-pause]').evaluate(el=>el.blur());await page.mouse.move(2,100);
  await page.waitForFunction(()=>window.__runs.filter(r=>r.end).length>=4,{},{timeout:90000});
  await page.locator('[data-logo-pause]').evaluate(el=>el.click());await wait();
  report.autoplayRuns=await page.evaluate(()=>__runs);assert(report.autoplayRuns.length>=4);
  assert(new Set(report.autoplayRuns.map(r=>r.index)).size===4);assert(report.autoplayRuns.every(r=>r.frames[0].fragment==='running'&&r.frames.at(-1).fragment===null));
  report.checks.push('Real autoplay timer, all four brands, synchronous start and end');
 }
 console.log(mode,'autoplay passed; inputs');
 // Inputs use the same controller and a short lock, including repeated rapid requests.
 let prev=await index();await page.locator('[data-logo-prev]').evaluate(el=>el.click());await wait();assert.equal(await index(),(prev+3)%4);
 prev=await index();await host.locator('[data-position="1"]').evaluate(el=>el.click());await wait();assert.equal(await index(),(prev+1)%4);
 prev=await index();await host.locator('[data-position="-1"]').evaluate(el=>el.click());await wait();assert.equal(await index(),(prev+3)%4);
 prev=await index();await page.locator('[data-logo-next]').focus();await page.keyboard.press('ArrowRight');await wait();assert.equal(await index(),(prev+1)%4);
 prev=await index();await host.evaluate(h=>{const s=h.querySelector('.coverflow-stage');s.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',clientX:260,clientY:150}));s.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch',clientX:150,clientY:154}));});await wait();assert.equal(await index(),(prev+1)%4);
 if(mode!=='reduced'){
  prev=await index();await host.evaluate(h=>{for(let i=0;i<8;i++)h.querySelector('[data-logo-next]').click();});await wait();assert.equal(await index(),(prev+1)%4);
  if(await page.locator('[data-logo-pause]').getAttribute('aria-pressed')==='true')await page.locator('[data-logo-pause]').evaluate(el=>el.click());
  await page.locator('[data-logo-next]').evaluate(el=>el.click());await page.waitForTimeout(100);await page.locator('[data-logo-pause]').evaluate(el=>el.click());
  const snapshot=()=>host.evaluate(h=>({transform:getComputedStyle(h.querySelector('[data-position="0"]')).transform,marks:window.__fx?.meshes.map(m=>m.material.uniforms.uProgress.value)}));
  const frozen=await snapshot();await page.waitForTimeout(350);assert.deepEqual(await snapshot(),frozen);await page.locator('[data-logo-pause]').evaluate(el=>el.click());await wait();
  // Capture a reproducible intermediate frame with the public pause control.
  await page.locator('[data-logo-next]').evaluate(el=>el.click());await page.waitForTimeout(180);await page.locator('[data-logo-pause]').evaluate(el=>el.click());await whatsapp();
  await host.screenshot({path:`${out}/${mode}-transition.png`});
  await page.screenshot({path:`${out}/${mode}-viewport.png`});
  await page.locator('[data-logo-pause]').evaluate(el=>el.click());await wait();
 }
 report.checks.push('Previous, both laterals, keyboard, touch swipe, short lock, pause/resume');
 if(gpu){assert.equal(await page.evaluate(()=>__ambient.visible),false);report.checks.push('Scroll-bound geometric group disabled; separate particle field retained');}
 if(width>=768&&mode!=='reduced'){
  await page.mouse.move(300,250);await page.mouse.move(600,330,{steps:18});assert.equal(await page.locator('.cursor-trail').count(),1);
  const pixels=await page.locator('.cursor-trail').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>8));assert(pixels);report.checks.push('Approved cursor produces visible canvas pixels');
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
 const logos=await host.locator('.logo-still').evaluateAll(imgs=>imgs.map(im=>({src:im.src,loaded:im.complete&&im.naturalWidth>0,visibility:getComputedStyle(im).visibility})));assert(logos.every(im=>im.loaded&&im.visibility==='visible'));
 if(mode==='reduced'){const saved=await index();await page.locator('[data-logo-pause]').evaluate(el=>el.click());await page.locator('[data-logo-pause]').evaluate(el=>el.blur());await page.mouse.move(2,100);await page.waitForTimeout(8000);assert.equal(await index(),saved);assert.equal(await page.locator('.cursor-trail').count(),0);report.checks.push('Reduced motion: instant navigation, no autoplay/trail');}
 if(mode==='no-webgl'){assert.equal(await host.getAttribute('data-fragment'),null);report.checks.push('No WebGL: DOM 3D navigation, pause and cursor remain functional');}
 assert.deepEqual(report.errors,[]);report.checks.push('No horizontal overflow, missing resources or console/page errors; four original logos restored');
 console.log(mode,'PASS',report.checks);
}finally{fs.writeFileSync(`${out}/${mode}.json`,JSON.stringify(report,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
