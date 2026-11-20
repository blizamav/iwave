const {chromium}=require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const server=require('child_process').spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{stdio:'ignore'});
 server.unref();
 process.on('exit',()=>server.kill());
 await new Promise(r=>setTimeout(r,500));
 const browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:'/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu'},args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.goto((process.env.IWAVE_QA_URL || 'http://127.0.0.1:8766')+'/docs/qa/fix019-seo020/social.html');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));if(!document.fonts.check('500 48px "Space Grotesk"'))throw Error('Corporate font missing');});
  fs.mkdirSync('img/social',{recursive:true});
  await page.screenshot({path:'img/social/iwave-og.jpg',type:'jpeg',quality:95});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
