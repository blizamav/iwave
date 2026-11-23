// Solo verifica TLS y autenticación. Nunca llama sendMail, MAIL FROM, RCPT TO ni DATA.
import { readMailConfig } from './config.mjs';
import { createZohoTransport } from './smtp.mjs';

export function smtpDiagnostic(error, phase) {
  // Lista cerrada: nunca imprimir message, response, stack, command ni AUTH sin filtrar.
  const codes = ['EAUTH', 'EDNS', 'EAI_AGAIN', 'ENOTFOUND', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'ETLS', 'EPROTOCOL', 'EPERM', 'EACCES', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID'];
  const code = codes.includes(error?.code) ? error.code : 'UNKNOWN';
  const smtpCode = Number.isInteger(error?.responseCode) && error.responseCode >= 100 && error.responseCode <= 599 ? error.responseCode : null;
  let stage = phase;
  let category = 'protocolo-smtp';
  if (phase === 'configuracion') {
    category = 'configuracion';
  } else if (code === 'EAUTH' || /^AUTH\b/.test(error?.command || '')) {
    stage = 'autenticacion';
    category = smtpCode === 535 ? 'autenticacion-rechazada' : 'autenticacion';
  } else if (['EDNS', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) {
    stage = 'dns'; category = 'conexion';
  } else if (code === 'ETLS' || /CERT|SELF_SIGNED|VERIFY_LEAF/.test(code) || error?.command === 'STARTTLS') {
    stage = 'tls'; category = 'tls';
  } else if (['ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'EPERM', 'EACCES'].includes(code)) {
    stage = error?.command === 'CONN' ? 'conexion-tls-saludo' : 'conexion'; category = 'conexion';
  } else if (['EHLO', 'HELO'].includes(error?.command)) {
    stage = 'saludo-smtp';
  }
  const fields = phase === 'configuracion' ? (error?.message?.match(/\b(?:CONTACT|ZOHO|TURNSTILE)_[A-Z_]+\b/g) || []).join(',') : '';
  return `etapa=${stage}; categoria=${category}; codigo=${phase === 'configuracion' ? 'ECONFIG' : code}; smtp=${smtpCode ?? 'sin-respuesta'}${fields ? `; variables=${fields}` : ''}`;
}

export async function verifySmtp({ env = process.env, createTransport = createZohoTransport, log = console.log, report = console.error } = {}) {
  let transport;
  let phase = 'configuracion';
  try {
    if ((env.CONTACT_MAIL_PROVIDER || '').trim() !== 'zoho') throw new Error('Revisar CONTACT_MAIL_PROVIDER');
    const config = readMailConfig(env);
    log(`Zoho SMTP: destino=${config.smtp.host}:${config.smtp.port}; TLS=${config.smtp.port === 465 ? 'implicito' : 'STARTTLS-obligatorio'}; certificado=validado; autenticacion=requerida.`);
    phase = 'verificacion-smtp';
    transport = createTransport(config);
    await transport.verify();
    log('Zoho SMTP: etapa=completada; categoria=correcto; TLS y autenticación correctos. No se envió correo. Aceptación y entrega pendientes de un envío autorizado.');
    return true;
  } catch (error) {
    report(`Zoho SMTP: ${smtpDiagnostic(error, phase)}`);
    return false;
  } finally {
    transport?.close?.();
  }
}

if (import.meta.main) process.exitCode = await verifySmtp() ? 0 : 1;
