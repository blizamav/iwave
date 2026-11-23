import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { readConfig } from './config.mjs';
import { Store } from './store.mjs';
import { createZohoTransport, sendZoho } from './smtp.mjs';

const solutions = new Set(['Automatización de procesos', 'Gestión de información', 'Inteligencia de Negocios', 'Soluciones digitales', 'Optimización operativa', 'Integración de servicios', 'Alertas y monitoreo', 'Plataformas de apoyo a la operación', 'Otra consulta']);
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const values = {};
  for (const [key, max] of Object.entries({ nombre: 120, empresa: 160, correo: 254, solucion: 100, mensaje: 1500, token: 2048 })) {
    const value = input[key] ?? (key === 'empresa' ? '' : null);
    if (typeof value !== 'string' || value.length > max) return null;
    values[key] = value.trim();
    if ((key !== 'empresa' && !values[key]) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) || (key !== 'mensaje' && /[\r\n]/.test(value))) return null;
  }
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(values.correo) || !solutions.has(values.solucion)) return null;
  return values;
}

export function createApp(config, { fetcher = fetch, now = Date.now, store = new Store(config.dbPath), smtpTransport = config.provider === 'zoho' ? createZohoTransport(config) : null } = {}) {
  const hash = value => createHmac('sha256', config.hashSecret).update(value).digest('hex');
  const upstream = async (url, options) => {
    const response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(config.timeout) });
    const data = await response.json();
    if (!response.ok) throw new Error('upstream');
    return data;
  };
  const server = createServer(async (req, res) => {
    const reply = (code, message, extra = {}) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra });
      res.end(JSON.stringify(typeof message === 'string' ? { message } : message));
    };
    try {
      if (req.url === '/healthz' && req.method === 'GET') return reply(200, { ok: true });
      if (req.url === '/api/contact/config' && req.method === 'GET') return reply(200, { sitekey: config.sitekey });
      if (req.url !== '/api/contact') return reply(404, 'Ruta no disponible.');
      if (req.method !== 'POST') return reply(405, 'Utiliza POST.', { Allow: 'POST' });
      if (!config.origins.includes(req.headers.origin)) return reply(403, 'Origen no permitido.');
      if (!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type'] || '')) return reply(415, 'Se requiere JSON.');
      const time = now();
      store.cleanup(time);
      const peer = req.socket.remoteAddress?.replace(/^::ffff:/, '') || 'unknown';
      const forwarded = req.headers['x-contact-client-ip'];
      const ip = config.trustedProxies.includes(peer) && typeof forwarded === 'string' && isIP(forwarded) ? forwarded : peer;
      const window = Math.floor(time / config.rateWindow);
      if (!store.consume(`ip:${hash(ip)}:${window}`, config.rateMax, (window + 1) * config.rateWindow)) return reply(429, 'Demasiados intentos. Intenta nuevamente más tarde.', { 'Retry-After': String(Math.ceil(((window + 1) * config.rateWindow - time) / 1000)) });
      let bytes = 0;
      const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) { reply(413, 'El formulario supera el tamaño permitido.'); req.resume(); return; }
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(400, 'JSON inválido.'); }
      const values = validate(input);
      if (!values) return reply(400, 'Revisa nombre, correo, solución y mensaje y sus longitudes.');
      let challenge;
      try {
        challenge = await upstream('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: config.turnstileSecret, response: values.token })
        });
      } catch { return reply(503, 'No pudimos validar la verificación. Intenta nuevamente.'); }
      if (challenge.success !== true || !config.hostnames.includes(challenge.hostname) || challenge.action !== 'contact') return reply(403, 'Completa nuevamente la verificación de seguridad.');
      const payload = {
        from: config.from, to: [config.to], reply_to: values.correo,
        subject: `Consulta iWave: ${values.solucion}`,
        text: `Nombre: ${values.nombre}\nEmpresa: ${values.empresa || 'No indicada'}\nCorreo: ${values.correo}\nSolución: ${values.solucion}\n\n${values.mensaje}`
      };
      const key = hash(JSON.stringify(payload));
      const reservation = store.reserve(key, time);
      if (reservation === 'accepted') return reply(200, { ok: true, message: 'Esta solicitud ya fue aceptada para envío. No necesitas repetirla.' });
      if (reservation === 'uncertain') return reply(409, { code: 'delivery_uncertain', message: 'No pudimos confirmar esta solicitud. Para evitar duplicados, no la reenvíes; consulta directamente a contacto@iwave.cl.' });
      if (reservation === 'pending') return reply(409, 'Esta solicitud se está procesando. Espera un momento antes de reintentar.', { 'Retry-After': '60' });
      const date = new Date(time).toISOString();
      // Límites de intentos conservadores: un fallo del proveedor también consume cupo.
      if (!store.consume(`day:${date.slice(0, 10)}`, config.dailyMax, Date.parse(`${date.slice(0, 10)}T00:00:00Z`) + 86400000) ||
          !store.consume(`month:${date.slice(0, 7)}`, config.monthlyMax, Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 1))) {
        store.release(key);
        return reply(429, 'El formulario alcanzó su límite de envíos. Escríbenos a contacto@iwave.cl.', { 'Retry-After': '3600' });
      }
      if (config.provider === 'zoho') store.uncertain(key);
      try {
        if (config.provider === 'zoho') {
          await sendZoho(smtpTransport, payload, key);
        } else {
          const result = await upstream('https://api.resend.com/emails', {
            method: 'POST', headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${key}` },
            body: JSON.stringify(payload)
          });
          if (typeof result.id !== 'string' || !result.id) throw new Error('invalid-response');
        }
        store.accept(key);
      } catch (error) {
        if (config.provider === 'zoho' && !error.retrySafe) return reply(503, { code: 'delivery_uncertain', message: 'No pudimos confirmar esta solicitud. Para evitar duplicados, no la reenvíes; consulta directamente a contacto@iwave.cl.' });
        store.release(key);
        return reply(503, 'No pudimos confirmar el envío. Reintenta el mismo mensaje o escríbenos a contacto@iwave.cl.');
      }
      return reply(200, { ok: true, message: 'Tu solicitud fue aceptada para envío. Gracias por contactar a iWave.' });
    } catch {
      // No registrar cuerpos, cabeceras, credenciales ni respuestas de proveedores.
      if (!res.headersSent) reply(503, 'El formulario no está disponible. Intenta nuevamente más tarde.');
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.timeout = 30000;
  server.maxHeadersCount = 50;
  server.on('close', () => { smtpTransport?.close?.(); store.close(); });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = readConfig();
    const server = createApp(config);
    server.listen(config.port, config.host, () => console.log('Contact API ready'));
    for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
  } catch { console.error('Contact API: configuración o almacenamiento inválidos. Revisar documentación.'); process.exitCode = 1; }
}
