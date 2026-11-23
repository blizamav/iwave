/* QA local: todos los endpoints externos se interceptan. No envía correos. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/iwave-qa001/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const mock = `window.turnstile={render(el,opts){window.challenge=opts;el.textContent='Verificación simulada para pruebas';return 0},reset(){window.resets=(window.resets||0)+1}};`;
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!/^\/(?:index\.html|styles\.css|script\.js|img\/[^.][^?]*)?$/.test(pathname) || pathname.includes('..')) { res.writeHead(404).end(); return; }
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  try {
    const body = await fs.readFile(file);
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LIBS || '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu' }, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let mode = 'ok', calls = 0;
      await page.route('**/*', async route => {
        const url = route.request().url();
        if (url.includes('challenges.cloudflare.com')) return route.fulfill({ contentType: 'text/javascript', body: mock });
        if (url.endsWith('/api/contact/config')) return route.fulfill({ json: { sitekey: 'mock-sitekey' } });
        if (url.endsWith('/api/contact')) {
          calls++;
          const data = route.request().postDataJSON();
          assert.equal(data.empresa, 'Empresa QA');
          assert.equal(data.token, 'browser-mock-token');
          await new Promise(resolve => setTimeout(resolve, 120));
          if (mode === 'network') return route.abort();
          return route.fulfill({ status: mode === 'uncertain' ? 503 : Number(mode) || 200, json: mode === 'ok' ? { ok: true, message: 'Tu solicitud fue aceptada para envío.' } : mode === 'uncertain' ? { code: 'delivery_uncertain', message: 'error simulado' } : { message: 'error simulado' } });
        }
        if (url.startsWith('http://127.0.0.1:')) return route.continue();
        return route.fulfill({ body: '' });
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => !!window.challenge);
      const submit = page.locator('#contact-form [type=submit]');
      await submit.click();
      assert.equal(await page.locator(':focus').getAttribute('name'), 'nombre');
      await page.locator('[name=nombre]').fill('María QA');
      await page.locator('[name=empresa]').fill('Empresa QA');
      await page.locator('[name=correo]').fill('maria@example.com');
      await page.locator('[name=solucion]').selectOption({ label: 'Otra consulta' });
      await page.locator('[name=mensaje]').fill('Consulta de prueba, sin envío real.');
      await submit.click();
      assert.match(await page.locator('#contact-status').innerText(), /verificación/);
      assert.equal(calls, 0);
      for (const error of ['503', '429', '409', '403', '400', 'network', 'uncertain']) {
        mode = error;
        await page.evaluate(() => challenge.callback('browser-mock-token'));
        await submit.click();
        await page.waitForFunction(() => !document.querySelector('#contact-form').hasAttribute('aria-busy'));
        assert.equal(await page.locator('[name=nombre]').inputValue(), 'María QA');
        assert(!(await submit.isDisabled()));
        assert(await page.locator('#contact-status').innerText());
        if (error === 'uncertain') assert.match(await page.locator('#contact-status').innerText(), /no la reenvíes/);
      }
      mode = 'ok';
      const before = calls;
      await page.evaluate(() => {
        challenge.callback('browser-mock-token');
        const form = document.querySelector('#contact-form');
        form.requestSubmit(); form.requestSubmit();
      });
      await page.waitForFunction(() => document.querySelector('#contact-form').hasAttribute('aria-busy'));
      assert(await submit.isDisabled());
      await page.waitForFunction(() => !document.querySelector('#contact-form').hasAttribute('aria-busy'));
      assert.equal(calls, before + 1);
      assert.equal(await page.locator('[name=nombre]').inputValue(), '');
      assert.match(await page.locator('#contact-status').innerText(), /aceptada/);
      assert.equal(await page.locator('[name=nombre]').getAttribute('aria-invalid'), null);
      await page.evaluate(() => challenge['expired-callback']());
      assert.match(await page.locator('#contact-status').innerText(), /expiró/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#contacto').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/iwave-form027-${width}.png`, fullPage: false });
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: validación, token, errores, datos conservados, bloqueo doble envío, éxito, reset, expiración, resultado SMTP incierto, sin overflow ni excepciones JS.`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
