/* Capture the actual pre-task source snapshot; not Git HEAD. */
const {chromium}=require(process.env.IWAVE_PLAYWRIGHT||'/tmp/iwave-qa001/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const server=require('node:child_process').spawn('python3',['-m','http.server','11023','--bind','127.0.0.1'],{stdio:'ignore'});
(async()=>{let browser;try{
 await new Promise(r=>setTimeout(r,400));
 browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.route('**/*',route=>{
  const path=new URL(route.request().url()).pathname;
  const files={'/':'index.html','/script.js':'script.js','/img/experience/refinement.css':'refinement.css','/img/experience/journey.js':'journey.js','/img/experience/exp009.js':'exp009.js'};
  const file=files[path];if(file)return route.fulfill({path:'/tmp/iwave-ux022/before/'+file,contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'text/html'});
  return route.continue();
 });
 await page.goto('http://127.0.0.1:11023');await page.waitForSelector('body.exp009-ready');
 await page.mouse.move(500,350);await page.mouse.move(650,430,{steps:12});await page.waitForTimeout(250);
 const result=await page.locator('.pointer-halo').evaluate(el=>{const s=getComputedStyle(el);return {bodyReady:document.body.classList.contains('exp009-ready'),classes:el.className,opacity:s.opacity,display:s.display,zIndex:s.zIndex,pointerEvents:s.pointerEvents,transform:s.transform,matchingOpacityRules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(r=>r.selectorText&&r.style.opacity&&el.matches(r.selectorText)).map(r=>({selector:r.selectorText,opacity:r.style.opacity}));}catch{return [];}}),fine:matchMedia('(hover:hover) and (pointer:fine)').matches,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};});
 assert(result.classes.includes('is-visible'));assert.equal(result.opacity,'0');
 await page.screenshot({path:__dirname+'/before-invisible-cursor.png'});
 fs.writeFileSync(__dirname+'/diagnosis.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
