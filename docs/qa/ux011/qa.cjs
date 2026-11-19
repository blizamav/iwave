/* Local QA only. Uses existing external Playwright; does not install project dependencies. */
const {chromium}=require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const out=__dirname;
const origin=process.env.IWAVE_QA_URL || 'http://127.0.0.1:8771';
const sections=['inicio','informacion','servicios','transformacion','proceso','experiencia','capacidades','contacto'];
const report={browser:null,renderer:null,matrices:[],fallbacks:[],performance:[],errors:[],failedRequests:[]};
function instrument(){
  window.__ux011={frames:[],contexts:0};
  const seen=new WeakSet();const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
    const gl=get.call(this,type,...args);
    if(gl && /webgl/i.test(type) && !seen.has(gl)){
      seen.add(gl);window.__ux011.contexts++;
      const draw=gl.drawArrays.bind(gl);
      gl.drawArrays=function(mode,first,count){
        if(mode===0 && (count===660 || count===270)){
          window.__ux011.frames.push(performance.now());
          if(window.__ux011.frames.length>2000)window.__ux011.frames.shift();
        }
        return draw(mode,first,count);
      };
    }
    return gl;
  };
}
async function gotoSection(page,id,offset=0){
  await page.locator('#'+id).evaluate((el,offset)=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-96+offset,behavior:'instant'}),offset);
  await page.waitForTimeout(700);
}
async function capture(page,name){await page.screenshot({path:path.join(out,name+'.png'),animations:'allow'});}
async function timing(page,label){
  await page.evaluate(()=>window.__ux011.frames=[]);
  await page.waitForTimeout(4200);
  const sample=await page.evaluate(()=>({times:window.__ux011.frames,contexts:window.__ux011.contexts,atmosphere:document.querySelector('.journey-scene').dataset.atmosphere}));
  assert(sample.times.length>2,'ambient renderer stopped');
  const gaps=sample.times.slice(1).map((t,i)=>t-sample.times[i]).sort((a,b)=>a-b);
  const result={label,drawnFrames:sample.times.length,contexts:sample.contexts,atmosphere:sample.atmosphere,
    renderedFps:+((sample.times.length-1)*1000/(sample.times.at(-1)-sample.times[0])).toFixed(2),
    medianMs:+gaps[Math.floor(gaps.length*.5)].toFixed(2),p95Ms:+gaps[Math.min(gaps.length-1,Math.floor(gaps.length*.95))].toFixed(2),maxMs:+gaps.at(-1).toFixed(2)};
  assert.equal(sample.contexts,1,'more than one WebGL context');report.performance.push(result);console.log('TIMING',JSON.stringify(result));
}
(async()=>{
 const browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:process.env.IWAVE_CHROMIUM_LIBS || '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 report.browser=browser.version();
 try{
  for(const [width,height] of [[1440,900],[768,1024],[390,844]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width===390?2:1,isMobile:width===390,hasTouch:width===390});
   const errors=[],http=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(origin))http.push([r.status(),r.url()])});
   page.on('requestfailed',r=>report.failedRequests.push({width,url:r.url(),reason:r.failure()?.errorText}));
   await page.addInitScript(instrument);
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.waitForSelector('body.exp009-ready');
   await page.waitForFunction(()=>document.querySelector('.logo-showcase').classList.contains('is-webgl'));
   const order=await page.locator('main section[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.deepEqual(order,sections);
   assert.deepEqual(await page.locator('#main-menu a').evaluateAll(a=>a.map(e=>e.hash.slice(1))),sections.slice(1));
   assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' '),'Elevamos la forma de trabajar con productividad digital.');
   const tokens=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--iwave-midnight','--iwave-deep-navy','--iwave-electric-cyan','--iwave-digital-mint','--iwave-royal-blue','--iwave-ice-white'].map(k=>[k,s.getPropertyValue(k).trim()]))});
   for(const id of sections){
    await gotoSection(page,id);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+id+' '+width);
    await capture(page,id+'-'+width);
    if(id==='inicio'){
      await timing(page,'hero-'+width);
      await capture(page,'ambient-t2-'+width);
      const gl=await page.evaluate(()=>{const gl=document.querySelector('#journey-canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight],dpr:devicePixelRatio}});report.renderer=gl.renderer;
      console.log('RENDERER',width,JSON.stringify(gl));
    }
    if(id==='transformacion'){
      await page.locator('[data-transform-state=after]').click();
      await page.waitForTimeout(1400);
      await gotoSection(page,id,300);await capture(page,'transformacion-after-'+width);
      const geometry=await page.locator('.transform-demo').evaluate(el=>{
        const boxes=[...el.querySelectorAll('.transform-file,.transform-core,.control-room')].map(e=>{const b=e.getBoundingClientRect();return {class:e.className,l:b.left,r:b.right,t:b.top,b:b.bottom}});
        const collisions=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.r,b.r)-Math.max(a.l,b.l)>2 && Math.min(a.b,b.b)-Math.max(a.t,b.t)>2)collisions.push([a.class,b.class])}return {collisions,svgFill:el.querySelector('svg').getAttribute('fill')};
      });assert.deepEqual(geometry.collisions,[],'transformation overlaps');assert.equal(geometry.svgFill,'none');
      await page.locator('[data-morph=integrated]').click();await page.waitForTimeout(3000);
      assert.equal(await page.locator('.morph-system').getAttribute('data-shape'),'integrated');
      await gotoSection(page,id,750);await capture(page,'morph-'+width);
    }
    if(id==='experiencia'){
      const old=Number(await page.locator('.logo-showcase').getAttribute('data-logo'));
      await page.locator('[data-logo-next]').click();
      await page.waitForFunction(old=>Number(document.querySelector('.logo-showcase').dataset.logo)===(old+1)%4,old,{timeout:20000});
      await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete',{timeout:20000});
      const active=await page.locator('[data-logo-art]').getAttribute('href');assert.equal(active,await page.locator('[data-logo-link]').getAttribute('href'));
      await capture(page,'carousel-next-'+width);
    }
   }
   await gotoSection(page,'servicios');
   const tabs=page.locator('.solution-tab');
   for(let i=0;i<4;i++){await tabs.nth(i).click();assert.equal(await tabs.nth(i).getAttribute('aria-selected'),'true');assert.equal(await page.locator('.solution-panel:visible').count(),1);}
   await tabs.nth(0).focus();await page.keyboard.press('ArrowRight');assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
   await gotoSection(page,'capacidades');const choices=page.locator('[data-capability]');
   for(let i=0;i<5;i++){await choices.nth(i).click();assert.equal(await choices.nth(i).getAttribute('aria-current'),'true');}
   await choices.nth(0).focus();await page.keyboard.press('ArrowDown');
   await gotoSection(page,'informacion');await page.locator('[data-problem=dispersa]').click();assert((await page.locator('.operation-result h3').innerText()).includes('base común'));
   await gotoSection(page,'proceso');const p1=await page.locator('.lifecycle-track').getAttribute('aria-valuenow');await page.waitForTimeout(1200);const p2=await page.locator('.lifecycle-track').getAttribute('aria-valuenow');assert.notEqual(p1,p2,'process does not animate');
   await page.locator('[data-lifecycle-resume]').click();await page.waitForTimeout(100);const paused=await page.locator('.lifecycle-track').getAttribute('aria-valuenow');await page.waitForTimeout(400);assert.equal(await page.locator('.lifecycle-track').getAttribute('aria-valuenow'),paused);
   await gotoSection(page,'contacto');await page.locator('#contact-form button[type=submit]').click();assert(await page.locator('#full-name').evaluate(e=>!e.validity.valid));
   await page.locator('#full-name').fill('Revisión local');await page.locator('#email').fill('invalido');assert(await page.locator('#email').evaluate(e=>!e.validity.valid));
   if(width===1440){
    await page.mouse.move(400,500);await page.waitForTimeout(250);assert(await page.locator('.pointer-halo').evaluate(e=>e.classList.contains('is-visible')));
    await page.locator('#email').hover();assert(!(await page.locator('.pointer-halo').evaluate(e=>e.classList.contains('is-visible'))));
    await page.mouse.move(60,360);await page.waitForTimeout(250);await capture(page,'cursor-1440');
   }else if(width===390){assert.equal(await page.locator('.pointer-halo').evaluate(e=>getComputedStyle(e).display),'none');}
   await page.locator('.menu-toggle').click();await page.waitForTimeout(400);
   await capture(page,'menu-'+width);assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   assert(await page.locator('.menu-toggle').evaluate(e=>document.activeElement===e));
   await page.locator('.menu-toggle').click();await page.locator('#main-menu a[href="#capacidades"]').click();await page.waitForTimeout(500);assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   assert.deepEqual(errors,[],'JS/console errors');assert.deepEqual(http,[],'missing resources');
   report.matrices.push({width,height,tokens,order,overflow:false,errors,http,checks:['all sections captured','solutions 4 + keyboard','capabilities 5','problems','before/after no collisions','SVG fill none','morph','carousel','process auto/pause','form validation','menu/Escape/focus/anchor','cursor mode']});
   console.log('MATRIX OK',width);await page.close();
  }
  for(const mode of ['reduce','no-webgl','no-js','save-data','context-loss']){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(mode==='no-webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:get.call(this,t,...a)}});
   if(mode==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
   await page.goto(origin,{waitUntil:'networkidle'});
   if(mode==='context-loss'){await page.waitForSelector('body.exp009-ready');await page.evaluate(()=>document.querySelector('#journey-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.waitForTimeout(400);}
   assert(!(await page.locator('body').evaluate(e=>e.classList.contains('exp009-ready'))));
   assert(await page.locator('.scene-fallback').isVisible());assert(await page.locator('.logo-still').isVisible());assert.equal(await page.locator('.trust-brand').count(),4);
   await gotoSection(page,'transformacion');assert(await page.locator('.control-room').isVisible());await capture(page,'fallback-'+mode+'-transformacion');
   await gotoSection(page,'experiencia');await capture(page,'fallback-'+mode+'-experiencia');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
   report.fallbacks.push({mode,passed:true});console.log('FALLBACK OK',mode);await page.close();
  }
 }catch(e){report.errors.push(e.stack);throw e;}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
