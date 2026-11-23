import { isIP } from 'node:net';

const required = (env, name) => {
  const value = env[name]?.trim();
  if (!value || /[\r\n]/.test(value)) throw new Error(`Configurar ${name}`);
  return value;
};
const integer = (env, name, fallback, max) => {
  const value = Number(env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Revisar ${name}`);
  return value;
};

export function readConfig(env = process.env) {
  const origins = required(env, 'CONTACT_ALLOWED_ORIGINS').split(',').map(s => s.trim());
  if (origins.some(o => { try { const u = new URL(o); return u.origin !== o || !['http:', 'https:'].includes(u.protocol); } catch { return true; } })) throw new Error('Revisar CONTACT_ALLOWED_ORIGINS');
  const hostnames = required(env, 'TURNSTILE_HOSTNAMES').split(',').map(s => s.trim());
  if (hostnames.some(h => !/^[a-z0-9.-]+$/i.test(h))) throw new Error('Revisar TURNSTILE_HOSTNAMES');
  const trustedProxies = (env.CONTACT_TRUSTED_PROXY_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (trustedProxies.some(ip => !isIP(ip))) throw new Error('Revisar CONTACT_TRUSTED_PROXY_IPS');
  const { provider, from, to, smtp, timeout } = readMailConfig(env);
  const hashSecret = required(env, 'CONTACT_HASH_SECRET');
  if (hashSecret.length < 32) throw new Error('CONTACT_HASH_SECRET requiere al menos 32 caracteres');
  return {
    port: integer(env, 'PORT', 3000, 65535), host: env.CONTACT_BIND || '0.0.0.0',
    provider, smtp, resendKey: provider === 'resend' ? required(env, 'RESEND_API_KEY') : undefined, turnstileSecret: required(env, 'TURNSTILE_SECRET_KEY'),
    sitekey: required(env, 'TURNSTILE_SITE_KEY'), hostnames, origins, trustedProxies, from, to, hashSecret,
    dbPath: required(env, 'CONTACT_DB_PATH'),
    rateMax: integer(env, 'CONTACT_RATE_MAX', 5, 100), rateWindow: integer(env, 'CONTACT_RATE_WINDOW_SECONDS', 600, 86400) * 1000,
    dailyMax: integer(env, 'CONTACT_DAILY_MAX', 80, 1000), monthlyMax: integer(env, 'CONTACT_MONTHLY_MAX', 2400, 100000),
    timeout
  };
}

// Transporte independiente de Turnstile, límites y SQLite; no habilita la API.
export function readMailConfig(env = process.env) {
  const provider = (env.CONTACT_MAIL_PROVIDER || 'resend').trim();
  if (!['resend', 'zoho'].includes(provider)) throw new Error('Revisar CONTACT_MAIL_PROVIDER');
  const from = required(env, 'CONTACT_FROM');
  const to = required(env, 'CONTACT_TO');
  const domain = provider === 'zoho' ? 'iwave\\.cl' : 'notificaciones\\.iwave\\.cl';
  if (!new RegExp("^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@" + domain + '$', 'i').test(from)) throw new Error('Revisar CONTACT_FROM para el proveedor');
  let smtp;
  if (provider === 'zoho') {
    const user = required(env, 'ZOHO_SMTP_USER');
    const host = (env.ZOHO_SMTP_HOST || 'smtp.zoho.com').trim();
    const port = integer(env, 'ZOHO_SMTP_PORT', 465, 65535);
    if (!/^smtp\.zoho\.(com|eu|in|com\.au|jp|ca|sa|com\.cn)$/.test(host) || ![465, 587].includes(port)) throw new Error('Revisar ZOHO_SMTP_HOST / ZOHO_SMTP_PORT');
    if (user.toLowerCase() !== from.toLowerCase()) throw new Error('ZOHO_SMTP_USER debe coincidir con CONTACT_FROM');
    smtp = { host, port, user, pass: required(env, 'ZOHO_SMTP_PASSWORD') };
  }
  if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(to)) throw new Error('Revisar CONTACT_TO');
  return { provider, from, to, smtp, timeout: integer(env, 'CONTACT_UPSTREAM_TIMEOUT_MS', 10000, 30000) };
}
