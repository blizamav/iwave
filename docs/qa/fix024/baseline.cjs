/* Replays the preserved pre-FIX-024 sources; no screenshots during timing. */
const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright'),fs=require('node:fs'),{spawn}=require('node:child_process');
const server=spawn('python3',['-m','http.server','11024','--bind','127.0.0.1'],{stdio:'ignore'});
(async()=>{let browser;try{
 await new Promise(r=>setTimeout(r,350));browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/*',route=>{const u=new URL(route.request().url());const p='/tmp/iwave-fix024/before'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile()){return route.fulfill({body:fs.readFileSync(p),contentType:p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/html'});}return route.continue();});
 await page.goto('http://127.0.0.1:11024');await page.waitForSelector('.is-webgl.logo-showcase');await page.locator('.logo-showcase').scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.locator('[data-logo-pause]').click();
 const results=[];
 for(let i=0;i<4;i++){
  results.push(await page.evaluate(()=>new Promise(resolve=>{
   const h=document.querySelector('.logo-showcase'),start=performance.now();let motionStart=null,fragmentStart=null,moveEnd=null;
   const card=h.querySelector('[data-position="1"]'),initial=getComputedStyle(card).transform;
   const observe=new MutationObserver(()=>{if(h.dataset.fragment==='running'&&fragmentStart===null)fragmentStart=performance.now()-start;if(h.dataset.transition==='complete'&&moveEnd===null)moveEnd=performance.now()-start;if(fragmentStart!==null&&!h.dataset.fragment){observe.disconnect();resolve({index:+h.dataset.logo,motionStart,fragmentStart,moveEnd,fragmentEnd:performance.now()-start,deltaMs:fragmentStart-motionStart});}});observe.observe(h,{attributes:true,attributeFilter:['data-fragment','data-transition']});
   const sample=()=>{if(motionStart===null&&getComputedStyle(card).transform!==initial)motionStart=performance.now()-start;if(fragmentStart===null)requestAnimationFrame(sample);};
   h.querySelector('[data-logo-next]').click();requestAnimationFrame(sample);
  })));
 }
 fs.writeFileSync(__dirname+'/before-timing.json',JSON.stringify(results,null,2));console.log('Baseline:',results);
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
