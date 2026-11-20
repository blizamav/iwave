const {chromium}=require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs'), assert=require('node:assert/strict');
(async()=>{
 const server=require('child_process').spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{stdio:'ignore'});server.unref();
 process.on('exit',()=>server.kill());
 await new Promise(r=>setTimeout(r,500));
 const browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report={checks:[],errors:[]};
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8767');await page.waitForSelector('.logo-showcase.is-webgl');
  const host=page.locator('.logo-showcase');await host.scrollIntoViewIfNeeded();
  const complete=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete',null,{timeout:60000});
  await page.locator('[data-logo-prev]').focus();await page.keyboard.press('ArrowLeft');await complete();assert.equal(await host.getAttribute('data-logo'),'3');report.checks.push('keyboard previous wraps to Scotiabank');
  const art=page.locator('[data-logo-art]');
  await art.dispatchEvent('pointerdown',{pointerType:'touch',clientX:280,clientY:250});await art.dispatchEvent('pointerup',{pointerType:'touch',clientX:170,clientY:255});await complete();assert.equal(await host.getAttribute('data-logo'),'0');report.checks.push('horizontal swipe wraps to MetLife');
  await page.locator('[data-logo-pause]').click();assert.equal(await page.locator('[data-logo-pause]').getAttribute('aria-pressed'),'true');
  await page.locator('.menu-toggle').focus();await page.waitForTimeout(8500);assert.equal(await host.getAttribute('data-logo'),'0');report.checks.push('manual pause preserves brand');
  await page.locator('[data-logo-pause]').click();await page.locator('.menu-toggle').focus();await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.logo==='1',null,{timeout:60000});await complete();report.checks.push('autoplay resumes and reconstructs BancoEstado');
  assert.deepEqual(report.errors,[]);
 } finally {fs.writeFileSync(__dirname+'/interactions-results.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
