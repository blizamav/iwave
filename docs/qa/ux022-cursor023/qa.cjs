/* Focused local QA; external Playwright, no project dependencies. */
const {chromium}=require(process.env.IWAVE_PLAYWRIGHT||'/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'), assert=require('node:assert/strict');
const out=__dirname, mode=process.argv[2]||'desktop';
if(mode==='boot'){require('./boot.cjs');return;}
if(mode==='before'){require('./diagnose.cjs');return;}
if(mode==='final'){for(const m of ['before','desktop','no-webgl']){const r=require('node:child_process').spawnSync(process.execPath,[__filename,m],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}process.exit(0);}
if(mode==='matrix'){for(const m of ['360','390','430','768','1440','no-webgl','reduced']){const r=require('node:child_process').spawnSync(process.execPath,[__filename,m],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}process.exit(0);}
const server=require('node:child_process').spawn('python3',['-m','http.server','11022','--bind','127.0.0.1'],{stdio:'ignore'});
const report={mode,errors:[],checks:[],metrics:{}};
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 await sleep(400);
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const width=+mode||1440, mobile=width<768;
 const page=await browser.newPage({viewport:{width,height:950},hasTouch:mobile,isMobile:mobile, deviceScaleFactor:mode==='no-webgl'?2:1, reducedMotion:mode==='reduced'?'reduce':'no-preference',recordVideo:mode==='desktop'?{dir:out+'/video',size:{width:1440,height:950}}:undefined});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 if(mode==='no-webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
 await page.addInitScript(()=>{
  window.__long=[];window.__cls=[];window.__cursorFrames=[];
  new PerformanceObserver(l=>window.__long.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>window.__cls.push(...l.getEntries().filter(e=>!e.hadRecentInput).map(e=>({start:e.startTime,value:e.value})))).observe({type:'layout-shift',buffered:true});
  const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf(t=>{if(fn.name==='draw'){if(window.__freezeCursor){window.__resumeCursor=()=>fn(performance.now());return;}window.__cursorFrames.push(t);}fn(t);});
 });
 await page.route('**/exp009.js?*',route=>{let code=fs.readFileSync('img/experience/exp009.js','utf8').replace('function render(scene, camera, dt, time) {','function render(scene, camera, dt, time) { window.__qaLogo ||= {meshes:logoMeshes};').replace('if (logoSlot.visible && !logoHost.dataset.motionPaused) advance','if (logoSlot.visible && !logoHost.dataset.motionPaused && !window.__freezeLogo) advance');return route.fulfill({body:code,contentType:'application/javascript'});});
 console.log('launch', mode);await page.goto('http://127.0.0.1:11022');console.log('loaded');await page.waitForSelector('.is-coverflow');
 if(!['no-webgl','reduced'].includes(mode))await page.waitForSelector('.logo-showcase.is-webgl');
 console.log('webgl ready');const host=page.locator('.logo-showcase');await host.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-170,behavior:'instant'}));await page.waitForTimeout(600);await page.evaluate(()=>{window.__steady=performance.now();});
 const wait=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete'&&!document.querySelector('.logo-showcase').dataset.fragment);
 const check=label=>report.checks.push(label);
 const state=()=>host.evaluate(h=>({index:+h.dataset.logo,cards:[...h.querySelectorAll('.logo-card')].map(c=>{const im=c.querySelector('img'),r=c.getBoundingClientRect(),ir=im.getBoundingClientRect();return {name:im.alt,pos:+c.dataset.position,w:r.width,h:r.height,image:{w:ir.width,h:ir.height},contained:ir.x>=r.x&&ir.y>=r.y&&ir.right<=r.right&&ir.bottom<=r.bottom,opacity:getComputedStyle(c).opacity,naturalWidth:im.naturalWidth};}),overflow:document.documentElement.scrollWidth-innerWidth}));
 if(mode==='desktop'){
  await page.locator('[data-logo-next]').focus();
  report.breath=[];
  for(let i=0;i<28;i++){report.breath.push(await host.evaluate(h=>{const c=h.querySelector('[data-position="0"]'),im=c.querySelector('img'),r=h.getBoundingClientRect();return {scale:new DOMMatrix(getComputedStyle(im).transform).a,w:c.offsetWidth,h:c.offsetHeight,hostW:r.width,hostH:r.height};}));await page.waitForTimeout(100);}
  const scales=report.breath.map(s=>s.scale);assert(Math.max(...scales)>Math.min(...scales)+.0001);assert(Math.min(...scales)>=1&&Math.max(...scales)<=1.0081);assert.equal(new Set(report.breath.map(s=>s.w+','+s.h+','+s.hostW+','+s.hostH)).size,1);check('Breathing scale 1–1.008 with stable card and host dimensions');
 }
 await page.locator('[data-logo-pause]').click();
 report.states=[];
 for(let i=0;i<4;i++){
  console.log('brand',i);await wait();const s=await state();assert.equal(s.index,i);assert.equal(s.overflow,0);assert.equal(s.cards.filter(c=>Math.abs(c.pos)<=1).length,3);assert(s.cards.every(c=>c.naturalWidth>0));assert(s.cards.every(c=>c.contained));report.states.push(s);
  await host.screenshot({path:`${out}/${mode}-brand-${i}.png`});
  await page.locator('[data-logo-next]').click();if(i===0){await page.waitForTimeout(330);await host.screenshot({path:`${out}/${mode}-transition.png`});}await wait();
 }
 assert.equal((await state()).index,0);check('Four brands, circular next, three positions, loaded assets and no horizontal overflow');
 await page.locator('[data-logo-prev]').click();await wait();assert.equal((await state()).index,3);check('Circular previous');
 await host.locator('.logo-card[data-position="1"]').click();await wait();assert.equal((await state()).index,0);
 await host.locator('.logo-card[data-position="-1"]').click();await wait();assert.equal((await state()).index,3);check('Both lateral cards navigate');
 await page.locator('[data-logo-next]').focus();await page.keyboard.press('ArrowRight');await wait();assert.equal((await state()).index,0);check('Arrow keyboard navigation');
 await host.evaluate(h=>{const s=h.querySelector('.coverflow-stage');s.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:250,clientY:100}));s.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:160,clientY:103}));});await wait();assert.equal((await state()).index,1);check('Touch horizontal swipe');
 await host.evaluate(h=>{const s=h.querySelector('.coverflow-stage');s.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:200,clientY:100}));s.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:205,clientY:200}));});await wait();assert.equal((await state()).index,1);check('Vertical gesture does not navigate');
 if(mode==='desktop'){
  // Pause in-flight CSS motion through the actual control, then resume.
  await page.locator('[data-logo-pause]').click();
  await page.locator('[data-logo-next]').evaluate(el=>el.click());await page.waitForTimeout(150);
  await page.locator('[data-logo-pause]').evaluate(el=>el.click());
  const frozen=await host.locator('.logo-card[data-position="0"]').evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(1000);assert.equal(await host.locator('.logo-card[data-position="0"]').evaluate(el=>getComputedStyle(el).transform),frozen);
  assert.equal(await host.getAttribute('data-transition'),'running');
  await page.locator('[data-logo-pause]').click();await wait();check('Pause/resume freezes an in-flight 3D transition');
  await page.locator('[data-logo-prev]').click();await wait();
  await page.locator('[data-logo-pause]').click();
  await page.locator('[data-logo-next]').click();await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.fragment==='running');
  await page.evaluate(()=>{window.__freezeLogo=true;});
  report.fragment=await page.evaluate(()=>({index:+document.querySelector('.logo-showcase').dataset.logo,progress:window.__qaLogo.meshes[+document.querySelector('.logo-showcase').dataset.logo].material.uniforms.uProgress.value}));
  await host.screenshot({path:out+'/desktop-fragment.png'});
  await page.evaluate(()=>{window.__freezeLogo=false;});await wait();await page.locator('[data-logo-prev]').click();await wait();check('GPU fragment reconstruction captured with original containment');
  await page.locator('[data-logo-pause]').click();await page.locator('[data-logo-pause]').evaluate(el=>el.blur());await page.mouse.move(10,170);
  await page.waitForTimeout(9000);await wait();assert.equal((await state()).index,2);check('Autoplay resumes');
  await page.locator('[data-logo-pause]').click();await page.locator('[data-logo-pause]').evaluate(el=>el.blur());await page.mouse.move(10,170);await page.waitForTimeout(8500);assert.equal((await state()).index,2);check('Autoplay pause holds');
 }
 // Canvas alpha bounds prove actual visible pixels, not merely script loading.
 const pixels=()=>page.evaluate(()=>{const c=document.querySelector('.cursor-trail');if(!c)return {count:0};const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const active=new Set();let count=0,alphaSum=0,hash=0,minX=c.width,minY=c.height,maxX=0,maxY=0;for(let i=3;i<d.length;i+=4)if(d[i]>8){const p=(i-3)/4,x=p%c.width,y=Math.floor(p/c.width);active.add(p);count++;alphaSum+=d[i];hash=(hash+i*d[i])%1000000007;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}let components=0,largest=0;while(active.size){components++;const todo=[active.values().next().value];active.delete(todo[0]);let size=0;while(todo.length){const p=todo.pop();size++;for(const off of [-c.width-1,-c.width,-c.width+1,-1,1,c.width-1,c.width,c.width+1]){const q=p+off;if(active.delete(q))todo.push(q);}}largest=Math.max(largest,size);}return {count,alphaSum,hash,components,connectedFraction:largest/Math.max(1,count),bounds:{minX,minY,maxX,maxY},dpr:c.width/innerWidth};});
 if(!mobile&&mode!=='reduced'){
  await page.mouse.move(width*.2,360);report.cursor=[];
  for(let n=0;n<7;n++){
   for(let j=0;j<10;j++){const t=(n*10+j)/69;await page.mouse.move(width*.2+t*width*.55,360+Math.sin(t*Math.PI*2)*85);await page.waitForTimeout(12);}
   report.cursor.push(await pixels());await page.evaluate(()=>{window.__freezeCursor=true;});await page.screenshot({path:`${out}/${mode}-cursor-motion-${n}.png`});await page.evaluate(()=>{window.__freezeCursor=false;window.__resumeCursor?.();window.__resumeCursor=null;});
  }
  assert(report.cursor.every(s=>s.count>35));assert(report.cursor.every(s=>s.connectedFraction>.95));assert(new Set(report.cursor.map(s=>s.hash)).size>4);check('Mouse movement produces visible changing spline pixels in seven frames with >95% connected pixels');
  const button=page.locator('[data-logo-next]'),box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:15});
  report.nearButton=await pixels();await page.evaluate(()=>{window.__freezeCursor=true;});await page.screenshot({path:`${out}/${mode}-cursor-button.png`});await page.evaluate(()=>{window.__freezeCursor=false;window.__resumeCursor?.();window.__resumeCursor=null;});const before=(await state()).index;await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await wait();assert.equal((await state()).index,(before+1)%4);check('Cursor overlay preserves real button click');
  await page.mouse.wheel(0,180);for(let i=0;i<15;i++){await page.mouse.move(width*.4+i*5,400+Math.sin(i/3)*25);await page.waitForTimeout(15);}assert((await pixels()).count>35);await page.screenshot({path:`${out}/${mode}-cursor-scroll.png`});check('Trail remains visible while scrolling');
  await page.mouse.move(width*.7,450,{steps:20});report.fade=[];for(const delay of [0,120,240,400,600]){await page.waitForTimeout(delay);report.fade.push(await pixels());}assert(report.fade[0].count>35);assert.equal(report.fade.at(-1).count,0);assert(report.fade.some(s=>s.alphaSum>0&&s.alphaSum<report.fade[0].alphaSum));check('Progressive trail decay sampled before reaching zero');
  await page.waitForTimeout(1500);assert.equal((await pixels()).count,0);const frames=await page.evaluate(()=>window.__cursorFrames.length);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__cursorFrames.length),frames);await page.screenshot({path:`${out}/${mode}-cursor-idle.png`});check('Idle pixels clear and cursor RAF stops');
  await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(400,300,{steps:8});assert.equal((await pixels()).count,0);check('Live reduced motion disables trail');
 } else {await page.mouse.move(400,300,{steps:8});assert.equal((await pixels()).count,0);assert.equal(await page.locator('.cursor-trail').count(),0);check('No artificial cursor for mobile/reduced motion');}
 report.metrics=await page.evaluate(()=>{const t=window.__cursorFrames,g=t.slice(1).map((v,i)=>v-t[i]).filter(v=>v<1000).sort((a,b)=>a-b);return {cursorFrames:t.length,cursorGapMedianMs:g[Math.floor(g.length*.5)],cursorGapP95Ms:g[Math.floor(g.length*.95)],longTasks:window.__long,cls:window.__cls.reduce((a,b)=>a+b.value,0),steadyCls:window.__cls.filter(e=>e.start>=window.__steady).reduce((a,b)=>a+b.value,0),overflow:document.documentElement.scrollWidth-innerWidth};});
 if(!['no-webgl','reduced'].includes(mode)){
   report.bounds = await page.evaluate(()=>{
    const {meshes}=window.__qaLogo;let vertices=0,worstRatio=0;
    for(const mesh of meshes) {
     const a=mesh.geometry.attributes,u=mesh.material.uniforms,b=u.uBounds.value;
     for(let step=0;step<=100;step++) {
      const t=step/100,p=t*t*(3-2*t),reach=u.uRadius.value*Math.min(2,14*p);
      const fit=Math.min(1,b.x*(1-(p+reach)/u.uCameraZ.value)/(u.uHalfSize.value.x+1.25*p+reach),b.y*(1-(p+reach)/u.uCameraZ.value)/(u.uHalfSize.value.y+.75*p+reach));
      for(let i=0;i<mesh.count;i++)for(let corner=0;corner<a.position.count;corner++) {
       let x=a.position.getX(corner),y=a.position.getY(corner),z=0;
       let angle=a.aRotation.getX(i)*p,c=Math.cos(angle),s=Math.sin(angle);[y,z]=[c*y-s*z,s*y+c*z];
       angle=a.aRotation.getY(i)*p;c=Math.cos(angle);s=Math.sin(angle);[x,z]=[c*x+s*z,-s*x+c*z];
       angle=a.aRotation.getZ(i)*p;c=Math.cos(angle);s=Math.sin(angle);[x,y]=[c*x-s*y,s*x+c*y];
       x=(x+a.aHome.getX(i)+a.aOffset.getX(i)*p)*fit;y=(y+a.aHome.getY(i)+a.aOffset.getY(i)*p)*fit;z+=a.aOffset.getZ(i)*p;
       const perspective=1-z/u.uCameraZ.value;
       worstRatio=Math.max(worstRatio,Math.abs(x)/(perspective*b.x),Math.abs(y)/(perspective*b.y));vertices++;
      }
     }
    }
    return {vertices,progressSteps:101,worstRatio,contained:worstRatio<=1.00001};
   });assert(report.bounds.contained);
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({mode,checks:report.checks,metrics:{...report.metrics,longTasks:report.metrics.longTasks.length}}));
 const video=page.video();await page.close();if(video)fs.renameSync(await video.path(),out+'/desktop.webm');
}finally{fs.writeFileSync(`${out}/${mode}.json`,JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
