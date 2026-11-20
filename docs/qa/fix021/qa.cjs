/* Local-only QA. Playwright is external to the project; Chromium uses SwiftShader. */
const { chromium } = require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const phase = process.argv[2] || 'after', width = +(process.argv[3] || 390);
if (phase === 'matrix') {
 for (const args of [['after','360'],['after','390'],['after','430'],['after','768'],['after','1440']]) {
  const result = require('node:child_process').spawnSync(process.execPath,[__filename,...args],{stdio:'inherit'});
  if(result.status !== 0) process.exit(result.status || 1);
 }
 process.exit(0);
}
const port = 10000 + width;
(async () => {
 const server = require('node:child_process').spawn('python3', ['-m','http.server',String(port),'--bind','127.0.0.1'], {stdio:'ignore'});
 const report = { phase, width, renderer: 'Chromium / ANGLE SwiftShader (software; not Android)', errors: [], states: [], transitions: [] };
 let browser;
 try {
  await new Promise(r => setTimeout(r,500));
  browser = await chromium.launch({env:{...process.env, LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'}, args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width,height:width===1440?900:950},isMobile:width<768,hasTouch:width<768});
  page.on('pageerror', e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.route('**/*', async route => {
   const path = new URL(route.request().url()).pathname;
   const saved = {'/img/experience/exp009.js':'exp009.js','/img/experience/refinement.css':'refinement.css','/img/experience/journey.js':'journey.js','/':'index.html'}[path];
   if (path.endsWith('/exp009.js')) {
    let code = phase==='before' ? fs.readFileSync('/tmp/iwave-fix021/before/exp009.js','utf8') : fs.readFileSync('img/experience/exp009.js','utf8');
    code = code.replace('function render(scene, camera, dt, time) {', 'function render(scene, camera, dt, time) { window.__renderTimes.push(performance.now()); window.__qaLogo ||= {meshes:logoMeshes,slot:logoSlot};');
    return route.fulfill({body:code,contentType:'application/javascript'});
   }
   if(phase==='before' && saved) return route.fulfill({path:'/tmp/iwave-fix021/before/'+saved,contentType:saved.endsWith('.css')?'text/css':saved.endsWith('.js')?'application/javascript':'text/html'});
   return route.continue();
  });
  await page.addInitScript(()=>{
   window.__renderTimes=[]; window.__long=[]; window.__shifts=[]; window.__raf={requested:0,cancelled:0,maxTickPending:0};
   const raf=requestAnimationFrame, cancel=cancelAnimationFrame, ticks=new Set();
   window.requestAnimationFrame=fn=>{window.__raf.requested++;let id=raf(t=>{ticks.delete(id);fn(t);});if(fn.name==='tick')ticks.add(id);window.__raf.maxTickPending=Math.max(window.__raf.maxTickPending,ticks.size);return id;};
   window.cancelAnimationFrame=id=>{window.__raf.cancelled++;ticks.delete(id);return cancel(id);};
   new PerformanceObserver(l=>window.__long.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
   new PerformanceObserver(l=>window.__shifts.push(...l.getEntries().map(e=>({start:e.startTime,value:e.value,recentInput:e.hadRecentInput})))).observe({type:'layout-shift',buffered:true});
  });
  await page.goto('http://127.0.0.1:'+port);
  await page.waitForSelector('.logo-showcase.is-webgl');
  const host=page.locator('.logo-showcase');
  await host.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-140,behavior:'instant'}));
  await page.locator('[data-logo-next]').focus();
  await page.waitForTimeout(500);
  await page.evaluate(()=>{
   window.__samples=[];window.__mutations=0;window.__start=performance.now();
   window.__mo=new MutationObserver(l=>window.__mutations+=l.length);window.__mo.observe(document.querySelector('.logo-showcase'),{attributes:true,subtree:true});
   window.__interval=setInterval(()=>{const h=document.querySelector('.logo-showcase'),v=h.querySelector('.logo-viewport'),i=h.querySelector('img'),p=getComputedStyle(v,'::before'),r=h.getBoundingClientRect();window.__samples.push({w:r.width,h:r.height,plateW:parseFloat(p.width),plateH:parseFloat(p.height),transform:p.transform,brand:h.dataset.logo,progress:h.dataset.progress,imageVisible:getComputedStyle(i).visibility});},50);
  });
  const state=()=>host.evaluate(h=>{
   const v=h.querySelector('.logo-viewport'),r=v.getBoundingClientRect(),p=getComputedStyle(v,'::before'),i=h.querySelector('img'),b=i.getBoundingClientRect(),pr={x:r.x+(r.width-parseFloat(p.width))/2,y:r.y+(r.height-parseFloat(p.height))/2,w:parseFloat(p.width),h:parseFloat(p.height)};
   return {brand:h.dataset.logo,plate:pr,transform:p.transform,image:{x:b.x,y:b.y,w:b.width,h:b.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight},contained:b.x>=pr.x&&b.y>=pr.y&&b.right<=pr.x+pr.w&&b.bottom<=pr.y+pr.h,href:v.href,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const complete=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete',null,{timeout:90000});
  for(let brand=0;brand<4;brand++) {
   if(brand) {
    await page.locator('[data-logo-next]').click();
    {
     for(const [name,test] of [['start',()=>{const h=document.querySelector('.logo-showcase');return h.dataset.phase==='outgoing'&&+h.dataset.progress>.05;}],['middle',()=>{const h=document.querySelector('.logo-showcase');return h.dataset.phase==='incoming'&&+h.dataset.progress<.85&&+h.dataset.progress>.2;}]]) {
      await page.waitForFunction(test,null,{timeout:90000});
      await page.locator('[data-logo-pause]').click();
      report.transitions.push({brand,name,...await state()});
      await host.screenshot({path:`${__dirname}/${phase}-${width}-brand-${brand}-${name}.png`});
      await page.locator('[data-logo-pause]').click();
     }
    }
    await complete();
   }
   await page.waitForTimeout(200);
   const s=await state();report.states.push(s);
   assert.equal(s.brand,String(brand));if(phase==='after'){assert(s.contained);assert(s.overflow<=0);}
   await host.screenshot({path:`${__dirname}/${phase}-${width}-brand-${brand}.png`});
  }
  await page.waitForTimeout(1000);
  report.metrics=await page.evaluate(()=>{
   clearInterval(window.__interval);window.__mo.disconnect();const end=performance.now(),times=window.__renderTimes.filter(t=>t>=window.__start),gaps=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b),s=window.__samples;
   const span=k=>Math.max(...s.map(x=>x[k]))-Math.min(...s.map(x=>x[k]));
   return {durationMs:end-window.__start,renderFrames:times.length,renderFps:1000*(times.length-1)/(times.at(-1)-times[0]),frameGapMedian:gaps[Math.floor(gaps.length*.5)],frameGapP95:gaps[Math.floor(gaps.length*.95)],longTasks:window.__long.filter(e=>e.start>=window.__start),layoutShifts:window.__shifts.filter(e=>e.start>=window.__start),mutations:window.__mutations,raf:window.__raf,hostWidthSpan:span('w'),hostHeightSpan:span('h'),plateWidthSpan:span('plateW'),plateHeightSpan:span('plateH'),plateTransforms:[...new Set(s.map(x=>x.transform))],samples:s};
  });
  if(phase==='after') {assert.equal(report.metrics.plateWidthSpan,0);assert.equal(report.metrics.plateHeightSpan,0);assert.equal(report.metrics.hostHeightSpan,0);assert.equal(report.metrics.plateTransforms.length,1);assert.equal(report.metrics.raf.maxTickPending,1);}
  if(phase==='after') {
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
  assert.deepEqual(report.errors,[]);
  console.log(JSON.stringify({phase,width,metrics:{...report.metrics,samples:undefined,longTasks:report.metrics.longTasks.length,plateTransforms:report.metrics.plateTransforms.length}}));
 } finally {
  fs.writeFileSync(`${__dirname}/${phase}-${width}.json`,JSON.stringify(report,null,2));
  if(browser)await browser.close();server.kill();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
