import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, readMailConfig } from '../config.mjs';
import { verifySmtp, smtpDiagnostic } from '../verify-smtp.mjs';
import { smtpOptions } from '../smtp.mjs';

const env = { CONTACT_MAIL_PROVIDER: 'zoho', CONTACT_FROM: 'contacto@iwave.cl', CONTACT_TO: 'contacto@iwave.cl', ZOHO_SMTP_USER: 'contacto@iwave.cl', ZOHO_SMTP_PASSWORD: 'private-test-password' };

test('verificación independiente de secretos API; API conserva validación completa', async () => {
  assert.throws(() => readConfig(env));
  assert.equal(smtpOptions(readMailConfig(env)).secure, true);
  let closed = false;
  let verified = false;
  const output = [];
  assert.equal(await verifySmtp({ env, log: s => output.push(s), report: s => output.push(s), createTransport: config => {
    assert.equal(config.smtp.host, 'smtp.zoho.com');
    assert.equal(config.smtp.port, 465);
    assert.equal(smtpOptions(config).tls.rejectUnauthorized, true);
    return { verify: async () => { verified = true; }, close: () => { closed = true; }, sendMail: () => assert.fail('No enviar correo') };
  } }), true);
  assert(verified && closed);
  assert(!output.join('').includes(env.ZOHO_SMTP_PASSWORD));
});

test('configuración inválida detiene la conexión y señala variable sin valores', async () => {
  for (const patch of [{ CONTACT_MAIL_PROVIDER: 'resend' }, { ZOHO_SMTP_PASSWORD: '' }, { ZOHO_SMTP_USER: 'otro@iwave.cl' }, { ZOHO_SMTP_HOST: 'evil.example' }, { ZOHO_SMTP_PORT: '25' }]) {
    const output = [];
    assert.equal(await verifySmtp({ env: { ...env, ...patch }, log: () => {}, report: s => output.push(s), createTransport: () => assert.fail('No conectar') }), false);
    assert.match(output[0], /etapa=configuracion; categoria=configuracion; codigo=ECONFIG/);
    assert.match(output[0], /variables=/);
    assert(!output[0].includes('otro@iwave.cl'));
  }
});

test('fallos SMTP/DNS/TLS clasificados y saneados; transporte siempre cierra', async () => {
  const cases = [
    [{ code: 'EAUTH', command: 'AUTH LOGIN private-auth-value', responseCode: 535 }, 'autenticacion', 'autenticacion-rechazada'],
    [{ code: 'EDNS' }, 'dns', 'conexion'],
    [{ code: 'ETIMEDOUT', command: 'CONN' }, 'conexion-tls-saludo', 'conexion'],
    [{ code: 'ESOCKET', command: 'CONN' }, 'conexion-tls-saludo', 'conexion'],
    [{ code: 'ERR_TLS_CERT_ALTNAME_INVALID' }, 'tls', 'tls'],
    [{ code: 'ETLS', command: 'STARTTLS' }, 'tls', 'tls'],
    [{ code: 'EPROTOCOL', command: 'EHLO', responseCode: 500 }, 'saludo-smtp', 'protocolo-smtp'],
    [{ code: 'private-code', command: 'private-command', responseCode: 'private-code' }, 'verificacion-smtp', 'protocolo-smtp']
  ];
  for (const [details, stage, category] of cases) {
    const error = Object.assign(new Error('private-message'), { response: 'private-response', ...details });
    const output = [];
    let closed = false;
    assert.equal(await verifySmtp({ env, log: () => {}, report: s => output.push(s), createTransport: () => ({ verify: async () => { throw error; }, close: () => { closed = true; } }) }), false);
    assert(closed);
    assert.match(output[0], new RegExp(`etapa=${stage}; categoria=${category};`));
    assert(!output[0].includes('private-'));
    assert(!smtpDiagnostic(error, 'verificacion-smtp').includes('AUTH LOGIN'));
  }
});
