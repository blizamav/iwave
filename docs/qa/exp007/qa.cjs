const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs'); const assert=require('assert');
const out='/opt/iwave/proyectos/landing-iwave/docs/qa/exp007';
const server=require('child_process').spawn('python3',['-m','http.server','8768','--bind','127.0.0.1'],{cwd:'/opt/iwave/proyectos/landing-iwave',stdio:'ignore'});process.on('exit',()=>server.kill());
(async()=>{
 await new Promise(r=>setTimeout(r,600));
 const browser=await chromium.launch({args:['--no-sandbox']});const results=[];
 for(const [width,height] of [[1440,900],[768,1024],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});const errors=[],http=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)http.push([r.status(),r.url()])});
  await page.goto('http://127.0.0.1:8768',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-transformation]').scrollIntoViewIfNeeded();await page.waitForTimeout(4200);
  const bounds=await page.evaluate(()=>{const a=document.querySelector('.transform-canvas').getBoundingClientRect();return [...document.querySelectorAll('.transform-file,.control-room,.transform-core')].map(el=>{const b=el.getBoundingClientRect();return {class:el.className,inside:b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom}})});assert(bounds.every(x=>x.inside),JSON.stringify(bounds));
  await page.locator('[data-transform-state="before"]').click();await page.waitForTimeout(1500);await page.locator('[data-transformation]').screenshot({style:'.site-header,.skip-link,.whatsapp-float { visibility:hidden !important; }',path:`${out}/${width}-antes.png`});
  await page.locator('[data-transform-play]').click();await page.waitForTimeout(1900);assert.equal(await page.locator('[data-transformation]').getAttribute('data-state'),'connecting');await page.locator('[data-transformation]').screenshot({style:'.site-header,.skip-link,.whatsapp-float { visibility:hidden !important; }',path:`${out}/${width}-conexion.png`});
  await page.waitForTimeout(2300);assert.equal(await page.locator('[data-transformation]').getAttribute('data-state'),'after');await page.locator('[data-transformation]').screenshot({style:'.site-header,.skip-link,.whatsapp-float { visibility:hidden !important; }',path:`${out}/${width}-despues.png`});
  await page.locator('#experiencia').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);await page.locator('#experiencia').screenshot({style:'.site-header,.skip-link,.whatsapp-float { visibility:hidden !important; }',path:`${out}/${width}-experiencia.png`});
  const logos=await page.locator('.trust-logo img').evaluateAll(els=>els.map(el=>({alt:el.alt,loaded:el.complete&&el.naturalWidth>0,natural:[el.naturalWidth,el.naturalHeight]})));assert(logos.length===4&&logos.every(x=>x.loaded),JSON.stringify(logos));
  const overflow=[];for(const id of ['inicio','informacion','transformacion','servicios','capacidades','experiencia','proceso','contacto']){await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(200);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))overflow.push(id)}assert.equal(overflow.length,0);
  for(let i=0;i<4;i++){await page.locator('.solution-tab').nth(i).click();assert.equal(await page.locator('.solution-panel:visible').count(),1)}
  for(let i=0;i<5;i++){await page.locator('[data-capability]').nth(i).click();assert.equal(await page.locator('.capability-panel:visible').count(),1)}
  await page.locator('[data-transform-state="before"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-transform-state="before"]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Tab');await page.keyboard.press('Enter');assert.equal(await page.locator('[data-transform-state="after"]').getAttribute('aria-pressed'),'true');
  if(width<761){await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false')}
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);await page.screenshot({path:`${out}/${width}-home.png`,fullPage:true});
  assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(http.length,0,JSON.stringify(http));results.push({width,height,bounds,logos,errors,http,overflow});await page.close();
 }
 for(const mode of ['no-js','reduced','no-webgl']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(mode==='no-webgl')await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return /webgl/.test(t)?null:get.call(this,t,...args)}});
  const p=await ctx.newPage();await p.goto('http://127.0.0.1:8768',{waitUntil:'networkidle'});await p.locator('[data-transformation]').scrollIntoViewIfNeeded();await p.waitForTimeout(4200);await p.locator('[data-transformation]').screenshot({style:'.site-header,.skip-link,.whatsapp-float { visibility:hidden !important; }',path:`${out}/${mode}.png`});assert.equal(await p.locator('[data-transformation]').getAttribute('data-state'),'after');assert(await p.locator('.control-room').isVisible());results.push({mode,state:'after',overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await ctx.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.kill();
})().catch(e=>{console.error(e);process.exit(1)});
