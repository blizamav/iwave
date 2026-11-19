const {chromium}=require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const server=require('child_process').spawn('python3',['-m','http.server','9555'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
const report={checks:[],errors:[]};
const path=__dirname;
const mode=process.argv[2] || 'interactions';
const brandOnly=mode.startsWith('brand-');
(async()=>{
await new Promise(r=>setTimeout(r,400));
const browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>report.errors.push(e.message));
await page.goto('http://127.0.0.1:9555',{waitUntil:'load'});await page.waitForSelector('body.exp009-ready');
async function jump(selector){await page.locator(selector).evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-120,behavior:'instant'}));await page.waitForTimeout(1500);}
async function shot(name){console.log('CAPTURE',name);await page.screenshot({path:path+'/'+name+'.png',animations:'allow'});}
if(mode==='brands'){await shot('inicio-final-1440');await jump('#capacidades');await page.locator('[data-capability=bi]').click();await shot('capacidades-final-1440');}
await jump('#experiencia');await page.locator('.logo-showcase').hover();
await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition!=='running');
const complete=()=>page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete',null,{timeout:40000});
const host=page.locator('.logo-showcase');
await page.locator('[data-logo-pause]').click();const stable=await host.getAttribute('data-logo');await page.waitForTimeout(900);assert.equal(await host.getAttribute('data-logo'),stable);await page.locator('[data-logo-pause]').click();
if(mode==='brands' || brandOnly) for(let i=0;i<(brandOnly?Number(mode.slice(6)):4);i++){await page.locator('[data-logo-next]').click();await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='running');await complete();console.log('RECONSTRUCTED',await host.getAttribute('data-brand'));if(!brandOnly || i>=1) await shot('brand-reconstructed-'+await host.getAttribute('data-brand'));}
report.checks.push(mode==='brands'?'all four brands reconstructed, pause/resume':'pause/resume');
if(mode==='brands' || brandOnly) { report.checks.push('reconstructed '+await host.getAttribute('data-brand'));return; }
await host.focus();await page.locator('[data-logo-next]').focus();const old=Number(await host.getAttribute('data-logo'));await page.keyboard.press('ArrowLeft');await complete();assert.equal(Number(await host.getAttribute('data-logo')),(old+3)%4);report.checks.push('carousel keyboard previous');
const art=page.locator('[data-logo-art]');const before=Number(await host.getAttribute('data-logo'));
await art.dispatchEvent('pointerdown',{pointerType:'touch',clientX:280,clientY:250});await art.dispatchEvent('pointerup',{pointerType:'touch',clientX:280,clientY:350});assert.equal(Number(await host.getAttribute('data-logo')),before);
await art.dispatchEvent('pointerdown',{pointerType:'touch',clientX:280,clientY:250});await art.dispatchEvent('pointerup',{pointerType:'touch',clientX:170,clientY:255});await complete();assert.equal(Number(await host.getAttribute('data-logo')),(before+1)%4);report.checks.push('touch horizontal changes brand; vertical keeps scroll gesture');
await page.mouse.move(10,100);await page.locator('.menu-toggle').focus();const auto=await host.getAttribute('data-logo');await page.waitForFunction(old=>document.querySelector('.logo-showcase').dataset.logo!==old,auto,{timeout:40000});await complete();report.checks.push('automatic rotation');
for(const shape of ['productivity','control']){await jump('.morph-system');await page.locator('[data-morph='+shape+']').click();await page.waitForTimeout(6500);assert.equal(await page.locator('.morph-system').getAttribute('data-shape'),shape);await shot('morph-'+shape);}
await jump('#contacto');await page.waitForTimeout(5000);await shot('contacto-final-1440');
const result=await page.evaluate(()=>{
const css=getComputedStyle(document.documentElement);const hex=t=>css.getPropertyValue(t).trim();
const luminance=h=>{const rgb=h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
const ratio=(a,b)=>{const x=luminance(hex(a)),y=luminance(hex(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
return {body:ratio('--text-secondary','--bg-surface'),heading:ratio('--text-primary','--bg-primary'),muted:ratio('--text-tertiary','--bg-surface'),action:ratio('--bg-primary','--accent-action')};});
for(const n of Object.values(result))assert(n>=4.5);report.contrast=result;
assert.deepEqual(report.errors,[]);
report.checks.push('productivity/control visual states','contact final','token contrast >=4.5:1');
}finally{await browser.close();fs.writeFileSync(path+'/extra-'+mode+'-results.json',JSON.stringify(report,null,2));server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
