import nodemailer from 'nodemailer';

export function smtpOptions(config) {
  return {
    host: config.smtp.host, port: config.smtp.port,
    secure: config.smtp.port === 465, requireTLS: true,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true, servername: config.smtp.host },
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    connectionTimeout: config.timeout, greetingTimeout: config.timeout,
    socketTimeout: config.timeout, dnsTimeout: config.timeout,
    logger: false, debug: false, transactionLog: false,
    disableFileAccess: true, disableUrlAccess: true
  };
}
export function createZohoTransport(config) {
  return nodemailer.createTransport(smtpOptions(config));
}
export async function sendZoho(transport, payload, key) {
  try {
    const result = await transport.sendMail({
      from: payload.from, to: payload.to, replyTo: payload.reply_to,
      subject: payload.subject, text: payload.text,
      // Identificación estable; SMTP no garantiza idempotencia por Message-ID.
      messageId: `<contact-${key}@iwave.cl>`,
      disableFileAccess: true, disableUrlAccess: true
    });
    if (!Array.isArray(result.accepted) || !result.accepted.some(address => String(address).toLowerCase() === payload.to[0].toLowerCase())) {
      throw new Error('unconfirmed');
    }
  } catch (error) {
    const failure = new Error('smtp-delivery-failed');
    // Un fallo anterior a DATA o un rechazo SMTP explícito permite reintento.
    // Pérdida de conexión/respuesta después de DATA: resultado ambiguo, no reenviar.
    failure.retrySafe = error.code === 'EAUTH' ||
      ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'MAIL FROM', 'RCPT TO'].includes(error.command) ||
      /^AUTH\b/.test(error.command || '') ||
      (error.command === 'DATA' && Number.isInteger(error.responseCode) && error.responseCode >= 400 && error.responseCode <= 599);
    throw failure;
  }
}
