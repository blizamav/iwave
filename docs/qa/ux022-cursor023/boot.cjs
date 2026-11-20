/* Early navigation while a texture is pending: no partial GPU logo or reset to brand zero. */
const {chromium}=require(process.env.IWAVE_PLAYWRIGHT||'/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const server=require('node:child_process').spawn('python3',['-m','http.server','11024','--bind','127.0.0.1'],{stdio:'ignore'});
(async()=>{let browser;try{
 await new Promise(r=>setTimeout(r,400));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 let release;const pending=new Promise(r=>{release=r;});
 await page.route('**/scotiabank.svg',async route=>{await pending;await route.continue();});
 await page.route('**/exp009.js?*',route=>{const code=fs.readFileSync('img/experience/exp009.js','utf8').replace('function render(scene, camera, dt, time) {','function render(scene, camera, dt, time) { window.__qaBoot ||= {meshes:logoMeshes};');return route.fulfill({body:code,contentType:'application/javascript'});});
 await page.goto('http://127.0.0.1:11024',{waitUntil:'domcontentloaded'});await page.waitForSelector('.is-coverflow');
 await page.locator('.logo-showcase').scrollIntoViewIfNeeded();await page.locator('[data-logo-next]').click();
 await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');
 const before=await page.locator('.logo-showcase').evaluate(h=>({index:+h.dataset.logo,webgl:h.classList.contains('is-webgl'),fragment:h.dataset.fragment||null}));
 assert.equal(before.index,1);assert.equal(before.webgl,false);assert.equal(before.fragment,null);
 release();await page.waitForSelector('.logo-showcase.is-webgl');await page.waitForTimeout(250);
 const after=await page.evaluate(()=>({index:+document.querySelector('.logo-showcase').dataset.logo,visible:window.__qaBoot.meshes.map(m=>m.visible),fragment:document.querySelector('.logo-showcase').dataset.fragment||null}));
 assert.equal(after.index,1);assert.deepEqual(after.visible,[false,true,false,false]);assert.equal(after.fragment,null);assert.deepEqual(errors,[]);
 const report={before,after,errors,passed:true};fs.writeFileSync(__dirname+'/boot.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
