/* Evidencia focalizada: inercia sin retraso de captura, ciclo completo en móvil
 * y disposición de recursos al activar reduced-motion durante la sesión. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..');
const server=require('child_process').spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
process.on('exit',()=>server.kill());
(async()=>{
  await new Promise(r=>setTimeout(r,500));
  const browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:process.env.LD_LIBRARY_PATH||'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-angle=swiftshader']});
  const output=path.join(__dirname,'extra-results.json');
  const results=process.argv[2]&&fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')).filter(r=>r.width!==Number(process.argv[2])):[];
  try {
    for(const [width,height]of[[1440,900],[768,1024],[390,844]]){
      if(process.argv[2]&&width!==Number(process.argv[2]))continue;
      const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width===390});
      const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto('http://127.0.0.1:8771',{waitUntil:'networkidle'});await page.waitForSelector('body.exp009-ready');
      await page.addStyleTag({content:'.site-header,.whatsapp-float,.skip-link{visibility:hidden!important}'});
      const record={width,height,errors,lifecycle:[]};
      if(width===1440){
        await page.screenshot({path:path.join(__dirname,'1440-cursor-initial.png')});
        for(let i=0;i<32;i++){
          await page.mouse.move(240+i*22,440+Math.sin(i*.14)*125);await page.waitForTimeout(22);
          if(i===23){const start=await page.evaluate(()=>performance.now());await page.screenshot({path:path.join(__dirname,'1440-cursor-trail.png')});record.trailCaptureMs=await page.evaluate(t=>performance.now()-t,start);}
        }
        const stopped=await page.evaluate(()=>performance.now());
        await page.waitForTimeout(80);
        await page.screenshot({path:path.join(__dirname,'1440-cursor-inertia.png')});
        record.inertiaCaptureMs=await page.evaluate(t=>performance.now()-t,stopped);
        await page.waitForTimeout(2700);await page.screenshot({path:path.join(__dirname,'1440-cursor-dissipated.png')});
      }
      for(const step of await page.locator('.timeline-step').all()){await step.scrollIntoViewIfNeeded();await page.waitForTimeout(700);}
      await page.locator('.lifecycle-controls').scrollIntoViewIfNeeded();
      await page.locator('.lifecycle-select').first().click();
      // Cancelar la pausa temporal y fijar una pausa explícita sin esperar otro frame.
      await page.locator('[data-lifecycle-resume]').evaluate(e=>{e.click();e.click();});
      const shot=async(label)=>{
        const progress=await page.locator('#proceso').getAttribute('data-progress');
        const started=Date.now();await page.locator('#proceso').screenshot({path:path.join(__dirname,`${width}-lifecycle-${label}.png`)});
        const durationMs=Date.now()-started;
        record.lifecycle.push({label,progress,durationMs});console.log(width+' lifecycle '+label+' '+progress+' '+durationMs+'ms');
      };
      const resume=async()=>{await page.locator('.lifecycle-controls').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await page.locator('[data-lifecycle-resume]').evaluate(e=>e.click());};
      await shot(0);await resume();
      for(const milestone of[.25,.5,.75,1]){
        await page.waitForFunction(t=>{const h=document.querySelector('#proceso');if(Number(h.dataset.progress)===t){document.querySelector('[data-lifecycle-resume]').click();return true;}return false;},milestone,{timeout:60000}).catch(async e=>{console.log('LIFECYCLE DEBUG',await page.locator('#proceso').evaluate(h=>({progress:h.dataset.progress,rect:h.getBoundingClientRect().toJSON(),hidden:document.hidden,scroll:scrollY,viewport:[innerWidth,innerHeight],button:h.querySelector('[data-lifecycle-resume]').outerHTML})));throw e;});
        await shot(milestone*100);await resume();
      }
      await page.waitForFunction(()=>{if(Number(document.querySelector('#proceso').dataset.progress)<.02){document.querySelector('[data-lifecycle-resume]').click();return true;}return false;},{},{timeout:30000});await shot('restart');
      record.overflowSections=[];
      for(const id of['inicio','transformacion','servicios','capacidades','experiencia','proceso','contacto']){
        await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(100);
        if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))record.overflowSections.push(id);
      }
      assert.equal(record.overflowSections.length,0,JSON.stringify(record.overflowSections));
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.body.classList.contains('exp009-ready'));
      assert(await page.locator('.logo-still').isVisible());assert(await page.locator('.morph-fallback').isVisible());
      assert.equal(await page.locator('.trust-brand').count(),4);
      await page.locator('.morph-system').screenshot({path:path.join(__dirname,`${width}-dynamic-reduced.png`)});
      record.dynamicReduced=true;record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
      assert.equal(record.overflow,false);assert.equal(errors.length,0,JSON.stringify(errors));results.push(record);
      fs.writeFileSync(path.join(__dirname,'extra-results.json'),JSON.stringify(results,null,2));await ctx.close();
    }
    console.log(JSON.stringify(results,null,2));
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);server.kill();process.exitCode=1;});
