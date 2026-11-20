/* CLICK-025 Coverflow: real mouse/touch/keyboard and locally intercepted official tabs. */
const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const out=__dirname,report={runs:[]},gpu=process.argv[2]==='gpu';
const source=fs.readFileSync('img/experience/coverflow.js','utf8').replace("host.classList.add('is-coverflow');", "window.__coverflow={get timer(){return timer},get remaining(){return remaining},get animation(){return animation},get index(){return index}};host.classList.add('is-coverflow');");
const urls=['https://www.metlife.cl/','https://www.bancoestado.cl/','https://www.bancochile.cl/','https://www.scotiabankchile.cl/'];
const server=spawn('python3',['-m','http.server','11026','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
(async()=>{try{
 await new Promise(r=>setTimeout(r,350));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const width of gpu?[1440]:[360,390,430,768,1440]){
  const run={width,gpu,errors:[],checks:[],opened:[]};report.runs.push(run);
  const context=await browser.newContext({viewport:{width,height:width<768?844:1000},hasTouch:true,isMobile:width<768});
  await context.route(/^https:\/\/www\.(metlife|bancoestado|bancochile|scotiabankchile)\.cl\//,route=>route.fulfill({body:'Official destination intercepted locally by QA',contentType:'text/plain'}));
  const page=await context.newPage();
  page.on('pageerror',e=>run.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')run.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)run.errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(disable=>{
   if(disable){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};}
   const set=window.setTimeout,clear=window.clearTimeout;window.__timers=new Set();window.__maxTimers=0;
   window.setTimeout=function(fn,ms,...args){let id;id=set(()=>{__timers.delete(id);fn(...args);},ms);if(typeof fn==='function'&&fn.toString().includes('change(1)')){__timers.add(id);__maxTimers=Math.max(__maxTimers,__timers.size);}return id;};window.clearTimeout=function(id){__timers.delete(id);return clear(id);};
  },!gpu);
  await page.route('**/coverflow.js?*',route=>route.fulfill({body:source,contentType:'application/javascript'}));
  if(gpu)await page.route('**/exp009.js?*',route=>route.fulfill({body:fs.readFileSync('img/experience/exp009.js','utf8').replace('function render(scene, camera, dt, time) {','function render(scene, camera, dt, time) { window.__fx={meshes:logoMeshes};'),contentType:'application/javascript'}));
  await page.goto('http://127.0.0.1:11026');await page.waitForSelector('.is-coverflow');if(gpu)await page.waitForSelector('.logo-showcase.is-webgl');
  const host=page.locator('.logo-showcase');await host.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-150,behavior:'instant'}));await page.waitForTimeout(300);
  await page.evaluate(()=>{window.__events=[];document.querySelector('.logo-showcase').addEventListener('coverflowchange',({detail:d})=>{const tracks=document.querySelector('.coverflow-stage').getAnimations({subtree:true}).filter(a=>a.effect?.target?.classList.contains('logo-card'));__events.push({...d,times:tracks.map(a=>a.currentTime),fragment:document.querySelector('.logo-showcase').dataset.fragment||null,opacity:window.__fx?.meshes.map(m=>m.material.uniforms.uOpacity.value)});});});
  const idx=()=>host.evaluate(h=>+h.dataset.logo);
  const complete=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');
  async function point(selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),s=el.closest('.coverflow-stage')?.getBoundingClientRect()||{left:0,top:0,right:innerWidth,bottom:innerHeight};const left=Math.max(0,r.left,s.left),right=Math.min(innerWidth,r.right,s.right),top=Math.max(90,r.top,s.top),bottom=Math.min(innerHeight,r.bottom,s.bottom);const hits=[];for(let y=top+5;y<bottom-4;y+=8)for(let x=left+5;x<right-4;x+=8)if(el.contains(document.elementFromPoint(x,y)))hits.push({x,y});if(hits.length){const cx=hits.reduce((n,p)=>n+p.x,0)/hits.length,cy=hits.reduce((n,p)=>n+p.y,0)/hits.length;return hits.reduce((best,p)=>Math.hypot(p.x-cx,p.y-cy)<Math.hypot(best.x-cx,best.y-cy)?p:best);}throw Error('No hit-testable point for '+el.outerHTML.slice(0,140));});}
  async function activate(selector,touch=false){const p=await point(selector);if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
  async function navigate(pos,touch=false){const before=await idx();await activate(`.logo-card[data-position="${pos}"]`,touch);await complete();assert.equal(await idx(),(before+pos+4)%4);assert.equal(await host.locator('[data-position="0"]').getAttribute('role'),'link');assert.equal(await host.locator('[data-position="1"]').getAttribute('role'),'button');}
  await navigate(-1);await navigate(1);run.checks.push('Mouse: left previous, right next, centered with correct roles');
  // All four central links must open a new tab with the URL of the active brand.
  for(let i=0;i<4;i++){
   const active=await idx(),card=host.locator('[data-position="0"]');assert.equal(await card.getAttribute('target'),'_blank');assert.match(await card.getAttribute('rel'),/noopener/);
   const opened=page.waitForEvent('popup');await activate('.logo-card[data-position="0"]');const popup=await opened;await popup.waitForURL(urls[active]);run.opened.push({index:active,url:popup.url()});await popup.close();await page.bringToFront();await navigate(1);
  }
  run.checks.push('Four official central destinations open in new tabs (requests intercepted locally)');
  await navigate(-1,true);await navigate(1,true);run.checks.push('Touch: both laterals navigate without opening a tab');
  // Real touch swipe via Chromium input; pan-y remains native for vertical gestures.
  const stage=await host.locator('.coverflow-stage').boundingBox(),x=stage.x+stage.width*.6,y=stage.y+stage.height*.5,cdp=await context.newCDPSession(page);const beforeSwipe=await idx();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-65,y:y+2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await complete();assert.equal(await idx(),(beforeSwipe+1)%4);
  assert.equal(await host.locator('[data-position="0"]').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');run.checks.push('Real horizontal touch swipe advances once; native pan-y retained');
  for(const key of ['Enter','Space']){
   for(const pos of [-1,1]){const before=await idx(),card=host.locator(`[data-position="${pos}"]`);await card.focus();const scroll=await page.evaluate(()=>scrollY);await page.keyboard.press(key);await complete();assert.equal(await idx(),(before+pos+4)%4);assert.equal(await page.evaluate(()=>scrollY),scroll);}
   const card=host.locator('[data-position="0"]');await card.focus();const before=await idx(),opened=page.waitForEvent('popup');await page.keyboard.press(key);const popup=await opened;await popup.waitForURL(urls[before]);await popup.close();await page.bringToFront();
  }
  run.checks.push('Enter and Space: both laterals navigate, center opens active official tab; Space does not scroll');
  // Rapid clicks cannot start overlapping transitions or open an arriving central link.
  const beforeRapid=await idx();await page.evaluate(()=>{const c=document.querySelector('.logo-card[data-position="1"]');for(let i=0;i<10;i++)c.click();});await complete();assert.equal(await idx(),(beforeRapid+1)%4);run.checks.push('Ten rapid requests accepted as one transition');
  if(gpu)await page.evaluate(()=>{document.querySelector('[data-logo-next]').click();document.querySelector('[data-logo-pause]').click();});else{await page.locator('[data-logo-next]').click();await page.locator('[data-logo-pause]').click();}
  const paused=await page.evaluate(()=>__coverflow.animation?.timeline.time());assert.equal(typeof paused,'number');await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>__coverflow.animation?.timeline.time()),paused);await page.locator('[data-logo-pause]').click();await complete();run.checks.push('Pause freezes same GSAP clock; resume completes');
  await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(2,100);
  const beforeAuto=await idx();await page.waitForFunction(()=>__coverflow.timer!==0);assert.equal(await page.evaluate(()=>__timers.size),1);
  // Wait through one real 7.5s cycle; each manual change resets this same timer.
  await page.waitForFunction(i=>__coverflow.index!==i,beforeAuto,{timeout:gpu?30000:12000});await complete();assert.equal(await idx(),(beforeAuto+1)%4);assert((await page.evaluate(()=>__maxTimers))<=1);run.maxTimers=await page.evaluate(()=>__maxTimers);run.checks.push('Real autoplay advances once; max one 7500ms timer');
  await page.locator('[data-logo-pause]').click();await navigate(1);assert.equal(await page.evaluate(()=>__coverflow.remaining),7500);assert.equal(await page.evaluate(()=>__coverflow.timer),0);run.checks.push('Manual navigation resets remaining to 7500ms while paused; no timer accumulated');
  const events=await page.evaluate(()=>__events);assert(events.filter(e=>e.phase==='progress').every(e=>e.times.length===4&&e.times.every(t=>Math.abs(t-e.progress*800)<.01)));
  if(gpu){assert(events.some(e=>e.phase==='start'&&e.fragment==='running'));assert(events.some(e=>e.phase==='progress'&&e.fragment==='running'));assert(events.filter(e=>e.phase==='complete').every(e=>e.fragment===null&&e.opacity.every(v=>v===0)));run.checks.push('FIX-024 GPU: fragments start with same clock, WAAPI progress matches, both meshes cleared on completion');}
  assert.equal(await host.locator('.logo-card').count(),4);assert(await host.locator('.logo-still').evaluateAll(imgs=>imgs.every(im=>im.complete&&im.naturalWidth>0)));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);assert.deepEqual(run.errors,[]);
  await host.screenshot({path:`${out}/coverflow-click025-${gpu?'gpu-':''}${width}.png`});console.log(width,gpu?'GPU':'DOM','PASS',run.checks);await context.close();
 }
}finally{fs.writeFileSync(`${out}/coverflow-click025${gpu?'-gpu':''}.json`,JSON.stringify(report,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
