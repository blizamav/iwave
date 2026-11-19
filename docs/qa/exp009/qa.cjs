/* Requiere Playwright de desarrollo; no añade dependencias a la landing. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/tmp/iwave-qa001/node_modules/playwright');
const fs = require('fs');
const assert = require('assert/strict');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const server = require('child_process').spawn('python3', ['-m', 'http.server', '8769', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => server.kill());
const results = [];
const captures = [];
const clean = '.site-header,.whatsapp-float,.skip-link{visibility:hidden!important}';
async function capture(page, name, locator) {
  if (locator) { await locator.scrollIntoViewIfNeeded(); await page.waitForTimeout(160); }
  const state=await page.evaluate(()=>({logo:{...document.querySelector('.logo-showcase').dataset},morph:{...document.querySelector('.morph-system').dataset},lifecycle:document.querySelector('#proceso').dataset.progress}));
  await page.waitForTimeout(450);
  const png=await page.screenshot({path:path.join(__dirname,name+'.png'),timeout:30000});
  if(name.includes('-morph-')&&!name.startsWith('no-')&&!name.startsWith('reduced')) {
    state.luminousPixels=await page.evaluate(async encoded=>{
      const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const r=document.querySelector('.morph-viewport').getBoundingClientRect();
      const x=Math.max(0,Math.ceil(r.x+5)),y=Math.max(0,Math.ceil(r.y+5));
      const w=Math.floor(Math.min(img.width,r.right-5)-x),h=Math.floor(Math.min(img.height,r.bottom-5)-y);
      const pixels=ctx.getImageData(x,y,w,h).data;let count=0;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i+1]>95&&pixels[i+2]>130&&pixels[i+2]>pixels[i]*1.3)count++;
      return count;
    },png.toString('base64'));

    assert(state.luminousPixels>50,'La escena WebGL no es visible en '+name+': '+state.luminousPixels);
  }
  captures.push({name,...state});fs.writeFileSync(path.join(__dirname,'capture-states-'+page.viewportSize().width+'.json'),JSON.stringify(captures.filter(c=>c.name.startsWith(page.viewportSize().width+'-')||(page.viewportSize().width===390&&!/^\d+-/.test(c.name))),null,2));
  console.log('Captured '+name+' '+JSON.stringify(state));
}
async function waitProgress(page, selector, min, max, pause=null, phase=null) {
  await page.waitForFunction(({selector,min,max,pause,phase}) => {
    const el=document.querySelector(selector), n=Number(el.dataset.progress);
    const ok=n>=min&&n<=max&&(!phase||el.dataset.phase===phase);
    if(ok&&pause&&document.querySelector(pause).getAttribute('aria-pressed')==='false')document.querySelector(pause).click();
    return ok;
  }, {selector,min,max,pause,phase}, {timeout:60000, polling:'raf'});
}
async function toggle(page,selector){await page.locator(selector).evaluate(el=>el.click());}
async function holdLogo(page,index){await page.waitForFunction(index=>{const e=document.querySelector('.logo-showcase');if(e.dataset.logo===String(index)&&e.dataset.transition==='complete'){document.querySelector('[data-logo-pause]').click();return true;}return false;},index,{timeout:60000});}
(async () => {
  await new Promise(r=>setTimeout(r,500));
  const browser = await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:process.env.LD_LIBRARY_PATH || '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
  try {
    for (const [width,height] of [[1440,900],[768,1024],[390,844]]) {
      if(process.argv[2]&&width!==Number(process.argv[2]))continue;
      const context = await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width===390});
      const page = await context.newPage(); page.setDefaultTimeout(30000);
      const errors=[],http=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') {errors.push(m.text());console.log('BROWSER ERROR',m.text());}});
      page.on('response',r=>{if(r.status()>=400) http.push([r.status(),r.url()]);});
      await page.goto('http://127.0.0.1:8769',{waitUntil:'networkidle'});
      await page.addStyleTag({content:clean});
      await page.waitForSelector('body.exp009-ready');
      await capture(page,width+'-cursor-initial');
      if(width===1440) {
        for(let i=0;i<32;i++) {await page.mouse.move(240+i*22,440+Math.sin(i*.14)*125);await page.waitForTimeout(22);}
        await capture(page,width+'-cursor-trail');
        await page.waitForTimeout(400); await capture(page,width+'-cursor-inertia');
        await page.waitForTimeout(2700); await capture(page,width+'-cursor-dissipated');
      }
      const morph=page.locator('.morph-system');await morph.scrollIntoViewIfNeeded();await page.waitForTimeout(350);
      await capture(page,width+'-morph-fragmented');
      for(const shape of ['integrated','automated','analytics','platforms']) {
        await page.locator(`[data-morph="${shape}"]`).click();
        await waitProgress(page,'.morph-system',.2,.75,'[data-morph-pause]');await capture(page,width+'-morph-'+shape+'-intermediate');await toggle(page,'[data-morph-pause]');
        await waitProgress(page,'.morph-system',1,1,'[data-morph-pause]');await capture(page,width+'-morph-'+shape);await toggle(page,'[data-morph-pause]');
      }
      const morphSnapshot=await page.locator('.morph-system').getAttribute('data-shape');
      // Idle must keep the shader/energy scene alive, even without a pointer.
      await page.waitForTimeout(700);await capture(page,width+'-energy-idle');
      await page.waitForFunction(()=>document.querySelector('.morph-system').dataset.shape!=='platforms',null,{timeout:25000});
      await waitProgress(page,'.morph-system',1,1,'[data-morph-pause]');await capture(page,width+'-morph-automatic');await toggle(page,'[data-morph-pause]');
      const logos=page.locator('.logo-showcase');await logos.scrollIntoViewIfNeeded();await toggle(page,'[data-logo-pause]');
      await page.mouse.move(1,1);await page.evaluate(()=>document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));await page.waitForTimeout(200);
      await capture(page,width+'-logo-complete');
      await page.locator('[data-logo-next]').click();await toggle(page,'[data-logo-pause]');
      await waitProgress(page,'.logo-showcase',.25,.75,'[data-logo-pause]','outgoing');await capture(page,width+'-logo-disintegration');await toggle(page,'[data-logo-pause]');
      await waitProgress(page,'.logo-showcase',.35,.55,'[data-logo-pause]','incoming');await capture(page,width+'-logo-reconstruction');await toggle(page,'[data-logo-pause]');
      await holdLogo(page,1);await capture(page,width+'-logo-next-complete');await toggle(page,'[data-logo-pause]');
      for (let i=2;i<4;i++) {
        await page.locator('[data-logo-next]').click();
        await holdLogo(page,i);await capture(page,width+'-logo-'+i+'-complete');await toggle(page,'[data-logo-pause]');
      }
      await page.locator('[data-logo-next]').focus();await page.keyboard.press('ArrowLeft');
      await holdLogo(page,2);await toggle(page,'[data-logo-pause]');
      assert.equal(await page.locator('[data-logo-link]').getAttribute('href'),'https://www.bancochile.cl/');
      // Pause auto cycle on hover/focus, then prove it resumes without input.
      const hoverIndex=await logos.getAttribute('data-logo');await page.waitForTimeout(4800);
      assert.equal(await logos.getAttribute('data-logo'),hoverIndex);
      await page.locator('[data-logo-next]').evaluate(el=>el.blur());await page.mouse.move(1,1);
      await page.waitForFunction(i=>document.querySelector('.logo-showcase').dataset.logo!==i,hoverIndex,{timeout:18000});
      if(width===390) {
        await page.waitForFunction(()=>document.querySelector('.logo-showcase').dataset.transition==='complete');
        const old=await logos.getAttribute('data-logo');const box=await page.locator('.logo-viewport').boundingBox();
        await page.locator('.logo-viewport').dispatchEvent('pointerdown',{pointerType:'touch',clientX:box.x+box.width-25,clientY:box.y+100});
        await page.locator('.logo-viewport').dispatchEvent('pointerup',{pointerType:'touch',clientX:box.x+25,clientY:box.y+105});
        await page.waitForFunction(i=>document.querySelector('.logo-showcase').dataset.logo!==i,old);
      }
      const life=page.locator('#proceso');await page.locator('.lifecycle-controls').scrollIntoViewIfNeeded();
      await page.locator('.lifecycle-select').first().click();await capture(page,width+'-lifecycle-0');
      await page.locator('[data-lifecycle-resume]').click();
      for (const [n,min,max] of [[25,.25,.25],[50,.5,.5],[75,.75,.75],[100,1,1]]) {
        await waitProgress(page,'#proceso',min,max,'[data-lifecycle-resume]');await capture(page,width+'-lifecycle-'+n);await toggle(page,'[data-lifecycle-resume]');
      }
      await waitProgress(page,'#proceso',0,.02,'[data-lifecycle-resume]');await capture(page,width+'-lifecycle-restart');await toggle(page,'[data-lifecycle-resume]');
      const overflow=[];
      for(const id of ['inicio','transformacion','servicios','capacidades','experiencia','proceso','contacto']) {
        await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(120);
        if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)) overflow.push(id);
      }
      const links=await page.locator('.trust-brand').evaluateAll(els=>els.map(a=>({href:a.href,loaded:a.querySelector('img').complete&&a.querySelector('img').naturalWidth>0})));
      assert(links.every(l=>l.loaded&&/^https:/.test(l.href)));assert.equal(overflow.length,0,JSON.stringify(overflow));
      const scrollBefore=await page.evaluate(()=>scrollY);await page.mouse.move(5,Math.floor(height*.5));await page.mouse.wheel(0,-400);await page.waitForFunction(y=>scrollY<y,scrollBefore,{timeout:5000});
      for(let i=0;i<4;i++){await page.locator('.solution-tab').nth(i).click();assert.equal(await page.locator('.solution-panel:visible').count(),1);}
      for(let i=0;i<5;i++){await page.locator('[data-capability]').nth(i).click();assert.equal(await page.locator('.capability-panel:visible').count(),1);}
      if(width<761){await page.locator('.site-header').evaluate(el=>el.style.setProperty('visibility','visible','important'));await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');}
      await page.locator('.morph-system').scrollIntoViewIfNeeded();
      const scheduler=await page.evaluate(()=>new Promise(resolve=>{let last;const values=[];function tick(t){if(last)values.push(t-last);last=t;if(values.length<45)requestAnimationFrame(tick);else {values.sort((a,b)=>a-b);resolve({samples:values.length,medianMs:values[22],p95Ms:values[42],maxMs:values[44]});}}requestAnimationFrame(tick);}));
      const record={width,height,errors,http,overflow,links,morphSnapshot,automaticMorph:true,automaticLogos:true,lifecycleRestart:true,scheduler};results.push(record);
      fs.writeFileSync(path.join(__dirname,'results-'+(process.argv[2]||'all')+'.json'),JSON.stringify(results,null,2));
      assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(http.length,0,JSON.stringify(http));
      await context.close();
    }
    for(const mode of ['reduced','no-webgl','no-js']) {
      const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
      if(mode==='no-webgl')await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
      const page=await context.newPage();await page.goto('http://127.0.0.1:8769',{waitUntil:'networkidle'});
      await capture(page,mode+'-morph',page.locator('.morph-system'));await capture(page,mode+'-logos',page.locator('.logo-showcase'));
      assert(await page.locator('.logo-still').isVisible());assert(await page.locator('.morph-fallback').isVisible());
      assert.equal(await page.locator('body.exp009-ready').count(),0);
      results.push({mode,fallback:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)});
      await context.close();
    }
    fs.writeFileSync(path.join(__dirname,'results-'+(process.argv[2]||'all')+'.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally {await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
