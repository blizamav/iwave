/* FORM-027: transporte independiente de las animaciones del sitio. */
const form = document.getElementById('contact-form');
if (form) {
  form.noValidate = true;
  const status = document.getElementById('contact-status');
  const button = form.querySelector('[type="submit"]');
  const fields = [...form.querySelectorAll('[required]')];
  const container = document.getElementById('contact-verification');
  let widget, token = '', busy = false;
  const validate = field => {
    const empty = !field.value.trim();
    const invalid = empty || !field.validity.valid;
    field.setAttribute('aria-invalid', String(invalid));
    const error = document.getElementById(field.getAttribute('aria-describedby'));
    if (error) error.textContent = invalid ? (empty ? 'Completa este campo.' : field.type === 'email' ? 'Ingresa un correo electrónico válido.' : 'Revisa este campo.') : '';
    return !invalid;
  };
  fields.forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => {
      status.textContent = '';
      if (field.hasAttribute('aria-invalid')) validate(field);
    });
  });
  async function initialize() {
    try {
      const response = await fetch('/api/contact/config', { signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok) throw new Error('config');
      const { sitekey } = await response.json();
      if (typeof sitekey !== 'string' || !sitekey) throw new Error('sitekey');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => reject(new Error('timeout')), 15000);
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); reject(new Error('script')); };
        document.head.append(script);
      });
      widget = window.turnstile.render(container, {
        sitekey, action: 'contact', theme: 'dark', size: 'flexible',
        callback: value => { token = value; },
        'expired-callback': () => { token = ''; status.textContent = 'La verificación expiró. Complétala nuevamente.'; },
        'error-callback': () => { token = ''; status.textContent = 'No pudimos completar la verificación. Recarga la página o usa nuestros canales directos.'; }
      });
    } catch {
      status.textContent = 'El formulario no está disponible. Escríbenos a contacto@iwave.cl o utiliza WhatsApp.';
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const results = fields.map(validate);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      status.textContent = 'Revisa los campos indicados antes de enviar tu solicitud.';
      firstInvalid.focus();
      return;
    }
    if (!token) {
      status.textContent = 'Completa la verificación de seguridad antes de enviar.';
      container.focus();
      return;
    }
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value).trim()]));
    busy = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Enviando tu solicitud…';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, token }), signal: AbortSignal.timeout(30000)
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        const messages = {
          400: 'Revisa los campos y sus longitudes antes de reintentar.',
          403: 'Completa nuevamente la verificación de seguridad.',
          409: 'Esta solicitud se está procesando. Espera un momento antes de reintentar.',
          429: 'Alcanzaste el límite de intentos. Intenta más tarde o escríbenos a contacto@iwave.cl.'
        };
        status.textContent = result.code === 'delivery_uncertain' ? 'No pudimos confirmar esta solicitud. Para evitar duplicados, no la reenvíes; consulta directamente a contacto@iwave.cl.' : messages[response.status] || 'No pudimos confirmar el envío. Reintenta el mismo mensaje o escríbenos a contacto@iwave.cl.';
        return;
      }
      status.textContent = typeof result.message === 'string' ? result.message : 'Tu solicitud fue aceptada para envío.';
      form.reset();
      fields.forEach(field => field.removeAttribute('aria-invalid'));
    } catch {
      status.textContent = 'No pudimos confirmar el envío. Reintenta el mismo mensaje o escríbenos a contacto@iwave.cl.';
    } finally {
      token = '';
      if (widget !== undefined) window.turnstile.reset(widget);
      busy = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
  initialize();
}
