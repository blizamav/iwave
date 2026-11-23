import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, validate } from '../server.mjs';
import { readConfig } from '../config.mjs';
import { smtpOptions } from '../smtp.mjs';
import nodemailer from 'nodemailer';

const env = {
  CONTACT_ALLOWED_ORIGINS: 'http://localhost:8080', TURNSTILE_HOSTNAMES: 'localhost',
  TURNSTILE_SITE_KEY: 'mock-sitekey', TURNSTILE_SECRET_KEY: 'mock-secret', RESEND_API_KEY: 'mock-resend',
  CONTACT_FROM: 'formulario@notificaciones.iwave.cl', CONTACT_TO: 'contacto@iwave.cl',
  CONTACT_HASH_SECRET: 'test-only-private-hash-secret-32-chars', CONTACT_DB_PATH: ':memory:'
};
const valid = { nombre: 'María Pérez', empresa: 'Empresa ejemplo', correo: 'maria@example.com', solucion: 'Otra consulta', mensaje: 'Necesitamos conectar nuestra operación.', token: 'mock-token' };
async function fixture(t, overrides = {}, handler, smtpTransport) {
  const calls = [];
  let time = Date.UTC(2026, 0, 15, 12);
  const config = { ...readConfig(env), ...overrides };
  const app = createApp(config, { smtpTransport, now: () => time, fetcher: async (url, options) => {
    calls.push({ url, ...options });
    if (handler) return handler(url, options, calls);
    return Response.json(url.includes('siteverify') ? { success: true, hostname: 'localhost', action: 'contact' } : { id: 'mock-email-id' });
  } });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    await new Promise(resolve => { app.close(resolve); app.closeAllConnections(); });
  };
  t.after(stop);
  const base = `http://127.0.0.1:${app.address().port}`;
  const send = (body = valid, headers = {}, method = 'POST', path = '/api/contact') => fetch(base + path, {
    method, headers: { Origin: 'http://localhost:8080', 'Content-Type': 'application/json', ...headers },
    ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) })
  });
  return { send, calls, base, stop, advance: ms => { time += ms; } };
}

test('configuración falla cerrada sin credenciales y valida remitente/orígenes/límites/proxy', () => {
  for (const key of Object.keys(env)) assert.throws(() => readConfig({ ...env, [key]: '' }), key);
  for (const patch of [{ CONTACT_FROM: 'contacto@iwave.cl' }, { CONTACT_ALLOWED_ORIGINS: 'https://iwave.cl/path' }, { CONTACT_HASH_SECRET: 'short' }, { CONTACT_RATE_MAX: '-1' }, { CONTACT_TRUSTED_PROXY_IPS: '0.0.0.0/0' }]) assert.throws(() => readConfig({ ...env, ...patch }));
});
test('validación de todos los campos y límites contra inyección', () => {
  assert(validate(valid));
  assert(validate({ ...valid, empresa: undefined }));
  for (const input of [null, [], {}, { ...valid, nombre: ' ' }, { ...valid, correo: 'bad' }, { ...valid, correo: 'a@example.com\r\nBcc:x@y.cl' }, { ...valid, empresa: {} }, { ...valid, solucion: 'Manipulada' }, { ...valid, mensaje: 'a'.repeat(1501) }, { ...valid, nombre: 'a'.repeat(121) }, { ...valid, empresa: 'a'.repeat(161) }, { ...valid, token: 'a'.repeat(2049) }, { ...valid, mensaje: 'bad\x00' }]) assert.equal(validate(input), null);
});
test('envío HTTPS con Reply-To, destinatario fijo, texto plano e idempotencia sin token en Resend', async t => {
  const f = await fixture(t);
  const response = await f.send({ ...valid, to: 'attacker@example.com', mensaje: '<script>alert(1)</script>' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(f.calls.length, 2);
  const mail = f.calls[1], payload = JSON.parse(mail.body);
  assert.equal(mail.url, 'https://api.resend.com/emails');
  assert.equal(payload.reply_to, valid.correo);
  assert.deepEqual(payload.to, ['contacto@iwave.cl']);
  assert.equal(payload.from, env.CONTACT_FROM);
  assert(payload.text.includes(valid.empresa));
  assert(payload.text.includes('<script>'));
  assert.equal(payload.html, undefined);
  assert(!mail.body.includes(valid.token));
  assert.match(mail.headers['Idempotency-Key'], /^contact\/[a-f0-9]{64}$/);
});
test('rechaza origen, formato, JSON, tamaño y método sin llamar proveedores', async t => {
  const f = await fixture(t, { rateMax: 100 });
  for (const [body, headers, method, expected] of [
    [valid, { Origin: 'https://evil.example' }, 'POST', 403],
    [valid, { Origin: '' }, 'POST', 403],
    [valid, { 'Content-Type': 'text/plain' }, 'POST', 415],
    ['{', {}, 'POST', 400], [{}, {}, 'POST', 400],
    ['x'.repeat(17000), {}, 'POST', 413], [valid, {}, 'GET', 405]
  ]) assert.equal((await f.send(body, headers, method)).status, expected);
  assert.equal(f.calls.length, 0);
});
test('Turnstile rechaza token, hostname, action y respuestas no booleanas', async t => {
  for (const challenge of [{ success: false }, { success: true, hostname: 'evil.example', action: 'contact' }, { success: true, hostname: 'localhost', action: 'login' }, { success: 'true', hostname: 'localhost', action: 'contact' }]) {
    const f = await fixture(t, {}, async () => Response.json(challenge));
    assert.equal((await f.send()).status, 403);
    assert.equal(f.calls.length, 1);
  }
});
test('Turnstile no disponible, timeout o JSON inválido no envían correo', async t => {
  for (const handler of [async () => { throw new DOMException('Timeout', 'TimeoutError'); }, async () => new Response('invalid'), async () => Response.json({}, { status: 500 })]) {
    const f = await fixture(t, {}, handler);
    assert.equal((await f.send()).status, 503);
    assert.equal(f.calls.length, 1);
  }
});
test('deduplica contenido con token nuevo y permite consulta distinta', async t => {
  const f = await fixture(t);
  assert.equal((await f.send()).status, 200);
  assert.equal((await f.send({ ...valid, token: 'new-token' })).status, 200);
  assert.equal(f.calls.filter(c => c.url.includes('resend')).length, 1);
  assert.equal((await f.send({ ...valid, mensaje: 'Otra necesidad' })).status, 200);
  assert.equal(f.calls.filter(c => c.url.includes('resend')).length, 2);
});
test('envíos simultáneos idénticos tienen una sola llamada a Resend', async t => {
  let resolveMail, started;
  const mailStarted = new Promise(resolve => { started = resolve; });
  const f = await fixture(t, {}, async url => {
    if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'localhost', action: 'contact' });
    started();
    return new Promise(resolve => { resolveMail = () => resolve(Response.json({ id: 'mock-id' })); });
  });
  const first = f.send();
  await mailStarted;
  assert.equal((await f.send()).status, 409);
  resolveMail();
  assert.equal((await first).status, 200);
  assert.equal(f.calls.filter(c => c.url.includes('resend')).length, 1);
});
test('fallo/timeout/JSON inválido de Resend conserva clave para reintento', async t => {
  for (const failure of [() => Response.json({}, { status: 429 }), () => { throw new Error('network'); }, () => { throw new DOMException('Timeout', 'TimeoutError'); }, () => new Response('bad'), () => Response.json({})]) {
    let attempt = 0;
    const f = await fixture(t, {}, async url => {
      if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'localhost', action: 'contact' });
      return ++attempt === 1 ? failure() : Response.json({ id: 'mock-id' });
    });
    assert.equal((await f.send()).status, 503);
    assert.equal((await f.send({ ...valid, token: 'new' })).status, 200);
    const mails = f.calls.filter(c => c.url.includes('resend'));
    assert.equal(mails[0].headers['Idempotency-Key'], mails[1].headers['Idempotency-Key']);
    assert.equal(mails[0].body, mails[1].body);
  }
});
test('rate limit no confía en cabeceras IP falsificadas y expira', async t => {
  const f = await fixture(t, { rateMax: 1 });
  assert.equal((await f.send()).status, 200);
  const limited = await f.send(valid, { 'X-Forwarded-For': '1.2.3.4', 'CF-Connecting-IP': '1.2.3.5', 'X-Contact-Client-IP': '1.2.3.6' });
  assert.equal(limited.status, 429);
  assert(Number(limited.headers.get('retry-after')) > 0);
  f.advance(600001);
  assert.equal((await f.send()).status, 200);
});
test('solo proxy explícito puede atribuir IP; configuración pública no expone secretos', async t => {
  const f = await fixture(t, { rateMax: 1, trustedProxies: ['127.0.0.1'] });
  assert.equal((await f.send(valid, { 'X-Contact-Client-IP': '1.2.3.4' })).status, 200);
  assert.equal((await f.send(valid, { 'X-Contact-Client-IP': '1.2.3.5' })).status, 200);
  const response = await fetch(f.base + '/api/contact/config');
  assert.deepEqual(await response.json(), { sitekey: 'mock-sitekey' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('cupos globales diarios y mensuales bloquean consultas distintas', async t => {
  for (const patch of [{ dailyMax: 1 }, { monthlyMax: 1 }]) {
    const f = await fixture(t, patch);
    assert.equal((await f.send()).status, 200);
    assert.equal((await f.send({ ...valid, mensaje: 'Mensaje distinto' })).status, 429);
    assert.equal(f.calls.filter(c => c.url.includes('resend')).length, 1);
  }
});
test('SQLite conserva deduplicación y límites tras reinicio sin contenido personal', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'iwave-form027-'));
  const path = join(dir, 'contact.sqlite');
  const first = await fixture(t, { dbPath: path, dailyMax: 1 });
  assert.equal((await first.send()).status, 200);
  await first.stop();
  const second = await fixture(t, { dbPath: path, dailyMax: 1 });
  assert.equal((await second.send()).status, 200);
  assert.equal((await second.send({ ...valid, mensaje: 'Otro mensaje' })).status, 429);
  assert.equal(second.calls.filter(c => c.url.includes('resend')).length, 0);
  for (const suffix of ['', '-wal']) {
    const content = readFileSync(path + suffix).toString('utf8');
    for (const value of [valid.nombre, valid.correo, valid.mensaje, valid.token, env.RESEND_API_KEY]) assert(!content.includes(value));
  }
  t.after(() => rmSync(dir, { recursive: true, force: true }));
});

const zohoEnv = { ...env, CONTACT_MAIL_PROVIDER: 'zoho', CONTACT_FROM: 'contacto@iwave.cl', ZOHO_SMTP_USER: 'contacto@iwave.cl', ZOHO_SMTP_PASSWORD: 'mock-private-app-password', RESEND_API_KEY: '' };
const zoho = readConfig(zohoEnv);

test('Zoho no requiere Resend; credenciales/From/host/puertos fallan cerrados', () => {
  assert.equal(zoho.provider, 'zoho');
  assert.equal(zoho.resendKey, undefined);
  for (const patch of [{ CONTACT_MAIL_PROVIDER: 'unknown' }, { ZOHO_SMTP_PASSWORD: '' }, { ZOHO_SMTP_USER: 'another@iwave.cl' }, { CONTACT_FROM: 'a@evil.example' }, { ZOHO_SMTP_HOST: 'evil.example' }, { ZOHO_SMTP_PORT: '25' }]) assert.throws(() => readConfig({ ...zohoEnv, ...patch }));
});
test('TLS/certificado obligatorio en 465 y STARTTLS obligatorio en 587, sin logs', () => {
  for (const port of [465, 587]) {
    const options = smtpOptions({ ...zoho, smtp: { ...zoho.smtp, port } });
    assert.equal(options.secure, port === 465);
    assert.equal(options.requireTLS, true);
    assert.equal(options.tls.rejectUnauthorized, true);
    assert.equal(options.tls.minVersion, 'TLSv1.2');
    assert.equal(options.debug, false);
    assert.equal(options.logger, false);
    assert.equal(options.disableUrlAccess, true);
    assert.equal(options.disableFileAccess, true);
  }
});
test('API Zoho conserva Turnstile, destinatario, Reply-To, deduplicación y límite IP', async t => {
  const mails = [];
  const f = await fixture(t, { ...zoho, rateMax: 2 }, undefined, {
    async sendMail(mail) { mails.push(mail); return { accepted: ['contacto@iwave.cl'] }; }
  });
  assert.equal((await f.send()).status, 200);
  assert.equal((await f.send({ ...valid, token: 'new-token' })).status, 200);
  assert.equal((await f.send()).status, 429);
  assert.equal(mails.length, 1);
  assert.equal(f.calls.length, 2);
  assert(f.calls.every(call => call.url.includes('siteverify')));
  assert.equal(mails[0].from, 'contacto@iwave.cl');
  assert.deepEqual(mails[0].to, ['contacto@iwave.cl']);
  assert.equal(mails[0].replyTo, valid.correo);
  assert(mails[0].text.includes(valid.empresa));
  assert(!JSON.stringify(mails).includes(valid.token));
  assert(!JSON.stringify(mails).includes(zohoEnv.ZOHO_SMTP_PASSWORD));
});
test('Zoho con Turnstile inválido no contacta SMTP ni Resend', async t => {
  let calls = 0;
  const f = await fixture(t, zoho, async () => Response.json({ success: false }), {
    async sendMail() { calls++; }
  });
  assert.equal((await f.send()).status, 403);
  assert.equal(calls, 0);
});
test('rechazo SMTP explícito/autenticación permite reintento sin fallback Resend', async t => {
  for (const error of [{ code: 'EAUTH' }, { command: 'CONN', code: 'ECONNECTION' }, { command: 'DATA', responseCode: 550 }]) {
    let calls = 0;
    const f = await fixture(t, zoho, undefined, {
      async sendMail() { if (++calls === 1) throw Object.assign(new Error('PRIVATE ERROR'), error); return { accepted: ['contacto@iwave.cl'] }; }
    });
    const rejected = await f.send();
    assert.equal(rejected.status, 503);
    assert(!(await rejected.text()).includes('PRIVATE ERROR'));
    assert.equal((await f.send()).status, 200);
    assert.equal(calls, 2);
    assert(f.calls.every(call => call.url.includes('siteverify')));
  }
});
test('timeout SMTP tras DATA no se reintenta, no confirma éxito ni cambia a Resend', async t => {
  let calls = 0;
  const f = await fixture(t, zoho, undefined, {
    async sendMail() { calls++; throw Object.assign(new Error('PRIVATE ERROR'), { command: 'DATA', code: 'ETIMEDOUT' }); }
  });
  const first = await f.send();
  assert.equal(first.status, 503);
  assert.equal((await first.json()).code, 'delivery_uncertain');
  f.advance(120000);
  const retry = await f.send({ ...valid, token: 'new-token' });
  assert.equal(retry.status, 409);
  assert.equal((await retry.json()).code, 'delivery_uncertain');
  assert.equal(calls, 1);
  assert(f.calls.every(call => call.url.includes('siteverify')));
});
test('SMTP sin destinatario aceptado nunca anuncia éxito', async t => {
  const f = await fixture(t, zoho, undefined, { async sendMail() { return { accepted: [] }; } });
  assert.equal((await f.send()).status, 503);
  assert.equal((await f.send()).status, 409);
});
test('reserva SMTP incierta sobrevive reinicio SQLite', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'iwave-zoho-'));
  const config = { ...zoho, dbPath: join(dir, 'contact.sqlite') };
  const f = await fixture(t, config, undefined, { async sendMail() { throw new Error('timeout'); } });
  assert.equal((await f.send()).status, 503);
  await f.stop();
  let sends = 0;
  const next = await fixture(t, config, undefined, { async sendMail() { sends++; } });
  assert.equal((await next.send()).status, 409);
  assert.equal(sends, 0);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
});
test('Nodemailer genera MIME con Unicode y Reply-To sin conectarse a red', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const result = await transport.sendMail({ from: 'contacto@iwave.cl', to: 'contacto@iwave.cl', replyTo: valid.correo, subject: 'Consulta iWave: Gestión de información', text: valid.mensaje });
  const mime = result.message.toString();
  assert.match(mime, /Reply-To: maria@example.com/);
  assert.match(mime, /To: contacto@iwave.cl/);
  assert.match(mime, /charset=utf-8/i);
});
