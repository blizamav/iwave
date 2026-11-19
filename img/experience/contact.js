/* Transporte sustituible: sin almacenamiento ni registro de datos personales. */
export function buildContactMailto(values) {
  const subject = `Consulta iWave: ${values.solucion}`;
  const body = `Nombre: ${values.nombre}\nEmpresa: ${values.empresa || 'No indicada'}\nCorreo: ${values.correo}\nSolución: ${values.solucion}\n\n${values.mensaje}`;
  return `mailto:contacto@iwave.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function prepareContact(values) {
  window.location.href = buildContactMailto(values);
}

const form = document.getElementById('contact-form');
if (form) {
  // El HTML conserva validación nativa si el módulo no está disponible.
  form.noValidate = true;
  const status = document.getElementById('contact-status');
  const fields = [...form.querySelectorAll('[required]')];
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
  form.addEventListener('submit', event => {
    event.preventDefault();
    const results = fields.map(validate);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      status.textContent = 'Revisa los campos indicados antes de preparar tu correo.';
      firstInvalid.focus();
      return;
    }
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
    prepareContact(values);
    status.textContent = 'Solicitamos abrir tu aplicación de correo. Revisa el mensaje y completa el envío allí. Si no se abre, escríbenos a contacto@iwave.cl o utiliza WhatsApp. Este sitio no ha enviado el mensaje.';
  });
}
