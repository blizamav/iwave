const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const server=spawn('python3',['-m','http.server','11024','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
(async()=>{const results=[];try{await new Promise(r=>setTimeout(r,350));browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:11024');await page.waitForSelector('.is-coverflow');await page.waitForSelector('.logo-showcase.is-webgl');
 const wa=page.locator('.whatsapp-float');
 const check=()=>wa.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),visible:s.visibility==='visible'&&s.opacity==='1',fixed:s.position==='fixed',parent:el.parentElement.tagName,z:s.zIndex,header:getComputedStyle(document.querySelector('.site-header')).zIndex,canvas:getComputedStyle(document.querySelector('#journey-canvas')).zIndex};});
 const sections=[];
 for(const id of ['inicio','transformacion','servicios','experiencia','capacidades','proceso','contacto']){await page.locator('#'+id).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-100,behavior:'instant'}));const state=await check();assert(state.hit&&state.visible&&state.fixed);sections.push({id,...state});}
 await page.locator('.logo-showcase').scrollIntoViewIfNeeded();await page.locator('[data-logo-next]').evaluate(el=>el.click());
 await page.evaluate(()=>new Promise(resolve=>{const h=document.querySelector('.logo-showcase');const listener=({detail})=>{if(detail.phase==='progress'&&detail.progress>=.3){h.removeEventListener('coverflowchange',listener);h.querySelector('[data-logo-pause]').click();resolve();}};h.addEventListener('coverflowchange',listener);}));
 assert((await check()).hit);await page.screenshot({path:`${__dirname}/${width}-whatsapp-final.png`});await page.locator('[data-logo-pause]').evaluate(el=>el.click());
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');const menu=await check();assert(menu.hit&&menu.visible&&+menu.z>+menu.header);await page.screenshot({path:`${__dirname}/${width}-menu-whatsapp.png`});
 const original=await wa.getAttribute('href');let requested;
 await page.route('https://wa.me/**',route=>{requested=route.request().url();return route.fulfill({body:'QA local: WhatsApp link intercepted',contentType:'text/plain'});});
 await wa.click();await page.waitForURL('https://wa.me/**');assert.equal(requested,original);assert.deepEqual(errors,[]);results.push({width,height,sections,menu,original,clickedURL:requested,errors});await page.close();console.log(width,'WhatsApp/menu/click PASS');
}
}finally{fs.writeFileSync(__dirname+'/layers.json',JSON.stringify(results,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
