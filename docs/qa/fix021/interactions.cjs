const {chromium}=require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const server=require('node:child_process').spawn('python3',['-m','http.server','10211','--bind','127.0.0.1'],{stdio:'ignore'});
 const report={checks:[],cycles:[],errors:[]};let browser;
 try {
  await new Promise(r=>setTimeout(r,500));
  browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:390,height:950},isMobile:true,hasTouch:true});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:10211');await page.waitForSelector('.logo-showcase.is-webgl');
  const host=page.locator('.logo-showcase'),pause=page.locator('[data-logo-pause]');
  await host.scrollIntoViewIfNeeded();
  const complete=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete',null,{timeout:90000});
  const leave=async()=>{await page.locator('.menu-toggle').focus();await page.mouse.move(0,0);};
  await page.locator('[data-logo-prev]').focus();await page.keyboard.press('ArrowLeft');await complete();assert.equal(await host.getAttribute('data-logo'),'3');report.checks.push('Keyboard previous wraps to Scotiabank');
  const art=page.locator('[data-logo-art]');
  await art.dispatchEvent('pointerdown',{pointerType:'touch',clientX:280,clientY:250});await art.dispatchEvent('pointerup',{pointerType:'touch',clientX:170,clientY:255});await complete();assert.equal(await host.getAttribute('data-logo'),'0');report.checks.push('Horizontal swipe wraps to MetLife');
  await art.dispatchEvent('pointerdown',{pointerType:'touch',clientX:180,clientY:250});await art.dispatchEvent('pointerup',{pointerType:'touch',clientX:170,clientY:350});assert.equal(await host.getAttribute('data-logo'),'0');report.checks.push('Vertical gesture does not change brand');
  await pause.click();await leave();await page.waitForTimeout(8500);assert.equal(await host.getAttribute('data-logo'),'0');report.checks.push('Manual pause suppresses autoplay');
  await pause.click();await page.locator('[data-logo-next]').click();
  await page.waitForFunction(()=>+document.querySelector('.logo-showcase').dataset.progress>.1);await pause.click();
  const frozen=await host.getAttribute('data-progress');await page.waitForTimeout(1000);assert.equal(await host.getAttribute('data-progress'),frozen);report.checks.push('Pause freezes a running transition');
  await page.setViewportSize({width:390,height:949});assert.equal(await host.getAttribute('data-transition'),'running');assert.equal(await host.getAttribute('data-progress'),frozen);await page.setViewportSize({width:390,height:950});
  await pause.click();await complete();assert.equal(await host.getAttribute('data-logo'),'1');report.checks.push('Minor resize preserves running timeline; resume finishes BancoEstado');
  // Every official href is preserved from the source index; no external navigation required.
  report.links=await page.locator('.trust-brand').evaluateAll(a=>a.map(e=>({name:e.querySelector('img').alt,href:e.href})));
  await leave();
  for(let n=0;n<8;n++) {
   const previous=await host.getAttribute('data-logo');
   await page.waitForFunction(old=>document.querySelector('.logo-showcase').dataset.logo!==old,previous,{timeout:90000});await complete();
   const current=await host.getAttribute('data-logo');assert.equal(+current,(+previous+1)%4);
   const href=await art.getAttribute('href');assert.equal(href,report.links[+current].href);
   report.cycles.push({n,brand:current,href});console.log("Autoplay",n+1,"/ 8",current);
   await host.screenshot({path:`${__dirname}/autoplay-390-${n}.png`});
  }
  report.checks.push('Eight consecutive autoplay changes: two full cycles and matching official links');
  await page.locator('[data-logo-next]').focus();const focused=await host.getAttribute('data-logo');await page.waitForTimeout(8500);assert.equal(await host.getAttribute('data-logo'),focused);report.checks.push('Focus suspends autoplay');
  await leave();await host.dispatchEvent('pointerenter',{pointerType:'mouse'});await page.waitForTimeout(8500);assert.equal(await host.getAttribute('data-logo'),focused);await host.dispatchEvent('pointerleave',{pointerType:'mouse'});report.checks.push('Mouse hover suspends autoplay');
  for(const mode of ['reduce','no-webgl','no-js']) {
   const fallback=await browser.newPage({viewport:{width:390,height:950},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
   if(mode==='no-webgl')await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
   await fallback.goto('http://127.0.0.1:10211');await fallback.locator('.logo-showcase').scrollIntoViewIfNeeded();await fallback.waitForTimeout(500);
   assert(await fallback.locator('.logo-still').isVisible());assert.equal(await fallback.locator('.trust-brand').count(),4);assert(await fallback.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await fallback.locator('.logo-showcase').screenshot({path:`${__dirname}/fallback-${mode}-390.png`});await fallback.close();report.checks.push('Fallback '+mode+': complete static logo and four links');
  }
  assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report));
 } finally {fs.writeFileSync(__dirname+'/interactions.json',JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
