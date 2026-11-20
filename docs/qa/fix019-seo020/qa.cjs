/* Local Playwright QA; existing tooling, no project dependencies. */
const { chromium } = require(process.env.IWAVE_PLAYWRIGHT || '/tmp/iwave-qa001/node_modules/playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const phase = process.argv[2] || 'after';
const onlyWidth = Number(process.argv[3] || 0);
const port = 8765 + onlyWidth + (phase === 'before' ? 10000 : 0);
const origin = process.env.IWAVE_QA_URL || 'http://127.0.0.1:' + port;
const out = __dirname;
(async () => {
  const server = require('child_process').spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
  server.unref();
 process.on('exit',()=>server.kill());
  await new Promise(r=>setTimeout(r,500));
  const browser = await chromium.launch({ env: { ...process.env, LD_LIBRARY_PATH: '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu' }, args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const report = { phase, browser: browser.version(), matrices: [], errors: [] };
  try {
    for (const width of (phase === 'before' ? (process.env.IWAVE_QA_WIDTH ? [+process.env.IWAVE_QA_WIDTH] : [390,1440]) : [360,390,430,768,1440]).filter(w => !onlyWidth || w === onlyWidth)) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 950 }, isMobile: width < 768, hasTouch: width < 768 });
      page.on('pageerror', e => report.errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
      page.on('response', r => { if (r.url().startsWith(origin) && r.status() >= 400) report.errors.push(r.status() + ' ' + r.url()); });
      if (phase === 'before') await page.route('**/*', route => {
        const pathname = new URL(route.request().url()).pathname;
        const files = { '/': 'index.html', '/index.html': 'index.html', '/img/experience/refinement.css': 'refinement.css', '/img/experience/exp009.js': 'exp009.js', '/img/experience/journey.js': 'journey.js' };
        const saved = files[pathname];
        return saved ? route.fulfill({ path: '/tmp/iwave-fix019/before/' + saved, contentType: saved.endsWith('.html') ? 'text/html' : saved.endsWith('.css') ? 'text/css' : 'application/javascript' }) : route.continue();
      });
      await page.goto(origin);
      await page.waitForSelector('.logo-showcase.is-webgl', { timeout: 30000 });
      const host = page.locator('.logo-showcase');
      await host.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 150, behavior: 'instant' }));
      await host.hover(); // suspend autoplay while capturing deterministic brand states
      const states = [];
      for (let i = 0; i < 4; i++) {
        if (i) {
          await page.locator('[data-logo-next]').click();
          await page.waitForFunction(() => document.querySelector('.logo-showcase').dataset.transition === 'complete', null, { timeout: 60000 });
        }
        await page.waitForTimeout(400);
        assert.equal(await host.getAttribute('data-logo'), String(i));
        await page.screenshot({ path: `${out}/${phase}-${width}-brand-${i}.png` });
        states.push(await host.evaluate(el => {
          const img = el.querySelector('img'), s = getComputedStyle(img), plate = getComputedStyle(el.querySelector('.logo-viewport'), '::before');
          return { brand: el.dataset.brand, progress: el.dataset.progress, image: img.currentSrc, filter: s.filter, blend: s.mixBlendMode, opacity: s.opacity, plate: plate.backgroundColor, transition: el.dataset.transition };
        }));
        if (phase === 'after' && width === 360 && i === 0) {
          await page.locator('[data-logo-next]').click();
          await page.waitForFunction(() => +document.querySelector('.logo-showcase').dataset.progress > .08);
          await page.screenshot({ path: `${out}/transition-${width}.png` });
          await page.waitForFunction(() => document.querySelector('.logo-showcase').dataset.transition === 'complete', null, { timeout: 60000 });
          await page.locator('[data-logo-prev]').click();
          await page.waitForFunction(() => document.querySelector('.logo-showcase').dataset.transition === 'complete', null, { timeout: 60000 });
        }
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      report.matrices.push({ width, states });
      console.log(phase, width, 'four brands captured');
      await page.close();
    }
    if (phase === 'after' && (!onlyWidth || onlyWidth === 1440)) {
      for (const mode of ['reduce', 'no-webgl']) {
        const page = await browser.newPage({ viewport: { width: 390, height: 950 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
        if (mode === 'no-webgl') await page.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type,...args) { return /webgl/i.test(type) ? null : get.call(this,type,...args); }; });
        await page.goto(origin);
        await page.locator('.logo-showcase').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        assert(await page.locator('.logo-still').isVisible());
        assert.equal(await page.locator('.trust-brand').count(), 4);
        await page.screenshot({ path: `${out}/fallback-${mode}.png` });
        await page.close();
      }
      const response = await fetch(origin + '/img/social/iwave-og.jpg');
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /^image\/jpeg/);
      const page = await browser.newPage(); await page.goto(origin);
      report.social = await page.evaluate(async () => {
        const img = new Image(); img.src = '/img/social/iwave-og.jpg'; await img.decode();
        return { width: img.naturalWidth, height: img.naturalHeight, og: [...document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')].map(e=>[e.getAttribute('property') || e.name,e.content]) };
      });
      assert.equal(report.social.width,1200); assert.equal(report.social.height,630);
      assert.equal(new Set(report.social.og.map(([k])=>k)).size,report.social.og.length);
      assert(report.social.og.some(([k,v])=>k === 'og:image' && v === 'https://iwave.cl/img/social/iwave-og.jpg'));
      await page.close();
      assert.deepEqual(report.errors, []);
    }
  } finally {
    fs.writeFileSync(`${out}/${phase}${onlyWidth ? "-" + onlyWidth : ""}-results.json`, JSON.stringify(report,null,2));
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
