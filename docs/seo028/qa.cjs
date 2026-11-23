/* QA SEO-028 local. No credenciales ni conexiones al API de producción. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/iwave-qa001/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const out = process.env.SEO_QA_OUTPUT || '/tmp/iwave-seo028'; fs.mkdirSync(out, { recursive: true });
const base = process.env.SEO_BASE_REVISION || '5549c26';
const before = execFileSync('git', ['show', `${base}:index.html`], { cwd: root, encoding: 'utf8' });
const after = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal(after.split('<body>')[1], before.split('<body>')[1], 'body visible y FORM-027 idénticos');
for (const p of ['styles.css', 'script.js', 'img/experience/contact.js', 'img/experience/journey.js', 'img/experience/exp009.js', 'img/experience/coverflow.js', 'img/experience/cursor.js', 'img/experience/lifecycle.js', 'img/experience/enterprise.js']) {
  assert(fs.readFileSync(path.join(root, p)).equals(execFileSync('git', ['show', `${base}:${p}`], { cwd: root })), p + ' intacto');
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost'), pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(url.searchParams.get('variant') === 'before' ? before : after); }
  if (!/^\/(?:index\.html|styles\.css|script\.js|robots\.txt|sitemap\.xml|favicon\.ico|img\/)/.test(pathname) || pathname.split('/').some(p => p === '..' || p.startsWith('.'))) { res.writeHead(404).end(); return; }
  const file = path.join(root, pathname);
  try {
    const data = await fs.promises.readFile(file);
    res.setHeader('Content-Type', ({ '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.xml':'application/xml', '.txt':'text/plain' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
  } catch { res.writeHead(404).end(); }
});
const mock = `window.turnstile={render(el,opts){window.challenge=opts;el.textContent='Verificación simulada para QA';return 0},reset(){}};`;
(async () => {
  let browser; const results = [], externalCache = new Map();
  try {
    await new Promise(r => server.listen(0, '127.0.0.1', r)); const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LIBS || '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu' }, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    async function prepare(page) {
      await page.addInitScript(() => { const OriginalDate = Date; window.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : ['2026-11-23T12:00:00Z'])); } static now() { return 1795435200000; } }; let n=28; Math.random=()=>((n=(n*1664525+1013904223)>>>0)/4294967296); });
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'challenges.cloudflare.com') return route.fulfill({ contentType: 'text/javascript', body: mock });
        if (url.pathname === '/api/contact/config') return route.fulfill({ json: { sitekey: 'mock-sitekey' } });
        if (url.pathname === '/api/contact') throw new Error('QA SEO nunca envía formulario');
        if (url.origin === origin) return route.continue();
        if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
          const key = url.href;
          if (!externalCache.has(key)) { const response = await route.fetch(); assert(response.ok(), 'Fuente externa accesible'); externalCache.set(key, { status: response.status(), headers: response.headers(), body: await response.body() }); }
          return route.fulfill(externalCache.get(key));
        }
        return route.abort();
      });
    }
    for (const width of [390, 768, 1440]) {
      const shots = [], layout = []; const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
      for (const variant of ['before', 'after']) {
        const page = await context.newPage(); await prepare(page); const errors = [], bad = [];
        page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.url().startsWith(origin) && r.status() >= 400) bad.push([r.status(), new URL(r.url()).pathname]); });
        await page.goto(`${origin}/?variant=${variant}`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => !!window.challenge); await page.waitForTimeout(100);
        await page.evaluate(() => { document.querySelectorAll('main section').forEach(el => el.getBoundingClientRect()); window.scrollTo(0, document.body.scrollHeight); }); await page.waitForTimeout(100);
        await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100);
        layout.push(await page.locator('main section[id]').evaluateAll(nodes => nodes.map(el => { const r=el.getBoundingClientRect(); return { id:el.id,x:r.x,y:r.y,width:r.width,height:r.height }; })));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin overflow');
        assert.deepEqual(errors, []); assert.deepEqual(bad, []);
        if (variant === 'after') {
          assert.equal(await page.locator('html').getAttribute('lang'), 'es-CL');
          assert.equal(await page.title(), 'iWave | Automatización y productividad digital en Chile');
          const nodes = await page.locator('script[type="application/ld+json"]').evaluateAll(ns => JSON.parse(ns[0].textContent)['@graph']);
          assert.equal(nodes.filter(n=>n['@type']==='Service').length,4); assert(nodes.some(n=>n['@type']==='Organization')); assert(nodes.some(n=>n['@type']==='WebSite'));
          const sizes = await page.evaluate(async () => {
            const urls=['/img/logo/favicon-48x48.png','/img/logo/favicon-192x192.png','/img/logo/favicon-512x512.png','/img/logo/apple-touch-icon.png'];
            return Promise.all(urls.map(async src=>{const im=new Image();im.src=src;await im.decode();return[im.naturalWidth,im.naturalHeight]}));
          }); assert.deepEqual(sizes, [[48,48],[192,192],[512,512],[180,180]]);
        }
        shots.push(await page.screenshot({ path: path.join(out, `${variant}-${width}.png`), fullPage: true, animations: 'disabled' })); await page.close();
      }
      assert.deepEqual(layout[0], layout[1], 'geometría idéntica');
      const page = await context.newPage();
      const diff = await page.evaluate(async images => {
        const decoded = await Promise.all(images.map(src => new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;})));
        const [a,b]=decoded;if(a.width!==b.width||a.height!==b.height)return{pixels:-1};const canvas=document.createElement('canvas');canvas.width=a.width;canvas.height=a.height;const c=canvas.getContext('2d');c.drawImage(a,0,0);const x=c.getImageData(0,0,a.width,a.height).data;c.clearRect(0,0,a.width,a.height);c.drawImage(b,0,0);const y=c.getImageData(0,0,b.width,b.height).data;let pixels=0;for(let i=0;i<x.length;i+=4)if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2]||x[i+3]!==y[i+3])pixels++;return{pixels,width:a.width,height:a.height};
      }, shots.map(b => 'data:image/png;base64,' + b.toString('base64')));
      assert.equal(diff.pixels,0,'comparación visual sin cambios'); results.push({ width, ...diff, layoutIdentical:true, noErrors:true }); await context.close(); console.log('PASS visual '+width+'px: 0 píxeles distintos, geometría idéntica.');
    }
    const page=await browser.newPage({viewport:{width:1440,height:950}});await prepare(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin,{waitUntil:'networkidle'});await page.waitForSelector('.journey-scene.is-ready');await page.locator('#experiencia').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelectorAll('.logo-card').length===4);const old=await page.locator('.logo-showcase').getAttribute('data-logo');await page.locator('[data-logo-next]').click();await page.waitForFunction(previous=>document.querySelector('.logo-showcase').dataset.logo!==previous,old);assert.deepEqual(errors,[]);results.push({webglReady:true,coverflowInteractive:true,noErrors:true});console.log('PASS WebGL activo y Coverflow interactivo.');
    await page.close();
    for(const path of ['/robots.txt','/sitemap.xml','/favicon.ico'])assert.equal((await fetch(origin+path)).status,200);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baseRevision:base,results,externalFontsCached:externalCache.size,bodyIdentical:true,formAndAnimationsByteIdentical:true},null,2));
  } finally { if(browser)await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
