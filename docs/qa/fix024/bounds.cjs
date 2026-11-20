const {chromium}=require('/tmp/iwave-qa001/node_modules/playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const server=spawn('python3',['-m','http.server','11025','--bind','127.0.0.1'],{stdio:'ignore'});let browser;const results=[];
(async()=>{try{await new Promise(r=>setTimeout(r,350));browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('**/exp009.js?*',route=>route.fulfill({body:fs.readFileSync('img/experience/exp009.js','utf8').replace('function render(scene, camera, dt, time) {','function render(scene, camera, dt, time) { window.__fx={meshes:logoMeshes};'),contentType:'application/javascript'}));
await page.goto('http://127.0.0.1:11025');await page.waitForSelector('.logo-showcase.is-webgl');
for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[1440,900]]){await page.setViewportSize({width,height});await page.locator('.logo-showcase').scrollIntoViewIfNeeded();await page.waitForTimeout(400);const report={width,height};
report.bounds = await page.evaluate(()=>{
    const {meshes}=window.__fx;let vertices=0,worstRatio=0;
    for(const mesh of meshes) {
     const a=mesh.geometry.attributes,u=mesh.material.uniforms,b=u.uBounds.value;
     for(let step=0;step<=100;step++) {
      const t=step/100,p=t*t*(3-2*t),reach=u.uRadius.value*Math.min(2,14*p);
      const fit=Math.min(1,b.x*(1-(p+reach)/u.uCameraZ.value)/(u.uHalfSize.value.x+1.25*p+reach),b.y*(1-(p+reach)/u.uCameraZ.value)/(u.uHalfSize.value.y+.75*p+reach));
      for(let i=0;i<mesh.count;i++)for(let corner=0;corner<a.position.count;corner++) {
       let x=a.position.getX(corner),y=a.position.getY(corner),z=0;
       let angle=a.aRotation.getX(i)*p,c=Math.cos(angle),s=Math.sin(angle);[y,z]=[c*y-s*z,s*y+c*z];
       angle=a.aRotation.getY(i)*p;c=Math.cos(angle);s=Math.sin(angle);[x,z]=[c*x+s*z,-s*x+c*z];
       angle=a.aRotation.getZ(i)*p;c=Math.cos(angle);s=Math.sin(angle);[x,y]=[c*x-s*y,s*x+c*y];
       x=(x+a.aHome.getX(i)+a.aOffset.getX(i)*p)*fit;y=(y+a.aHome.getY(i)+a.aOffset.getY(i)*p)*fit;z+=a.aOffset.getZ(i)*p;
       const perspective=1-z/u.uCameraZ.value;
       worstRatio=Math.max(worstRatio,Math.abs(x)/(perspective*b.x),Math.abs(y)/(perspective*b.y));vertices++;
      }
     }
    }
    return {vertices,progressSteps:101,worstRatio,contained:worstRatio<=1.00001};
   });assert(report.bounds.contained);
results.push(report);console.log(width,report.bounds);}
}finally{fs.writeFileSync(__dirname+'/bounds.json',JSON.stringify(results,null,2));await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
