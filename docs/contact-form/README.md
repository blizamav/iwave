# FORM-027 — Contacto comercial

FORM-027 está operativo en **https://iwave.cl**. El usuario confirmó recepción real en contacto@iwave.cl; Turnstile, Zoho y Reply-To fueron comprobados. El cierre verificó HTTPS, recursos, API y autenticación SMTP sin nuevos correos ni cambios de producción. El Proxy Host 1 de NPM sirve iwave-form027-web y las rutas API mediante iwave-form027-api. Pruebas locales permanecen independientes en loopback. Estado efectivo y rollback en [FORM-027 producción](../deployment/FORM-027.md); evidencia y límites en [QA](QA.md).

## Decisión de envío: Zoho primero

La documentación oficial de [Zoho SMTP](https://www.zoho.com/mail/help/zoho-smtp.html) incluye organizaciones gratuitas: `smtp.zoho.com`, TLS en 465 o STARTTLS en 587, con autenticación. Que Free no incluya IMAP/POP no implica por sí mismo que SMTP esté bloqueado ([planes](https://www.zoho.com/mail/zohomail-pricing.html)). El servidor exacto y acceso efectivo dependen de la cuenta/centro de datos; comprobarlos en Configuración → Cuentas de correo → Configuración del servidor. El 2026-11-23 se verificó autenticación SMTP de la cuenta desde la VPS, sin envío; no se inspeccionaron sus ajustes privados.

La sonda inicial sin credenciales alcanzó ambos puertos, validó certificados TLS y recibió EHLO 250 con AUTH LOGIN/PLAIN. Después se verificó AUTH en 465 desde la VPS y desde el contenedor Node 24. No se ejecutó MAIL FROM, RCPT TO ni DATA: **la entrega sigue pendiente**. La consulta de MX fue solo lectura y devolvió mx.zoho.com/mx2.zoho.com/mx3.zoho.com; no se modificaron registros.

La opción más simple preparada es `CONTACT_MAIL_PROVIDER=zoho`: usar el buzón existente como From y To, sin Resend ni subdominio de envío adicional ni cambios DNS. Requiere validar acceso SMTP con una contraseña de aplicación local antes de activar. Si la cuenta rechaza SMTP o Zoho confirma que su plan no lo permite, permanece disponible `CONTACT_MAIL_PROVIDER=resend`, como selección manual. Resend aporta el transporte de salida que faltaría; el buzón Zoho sigue siendo el destinatario. No hay fallback automático para evitar doble envío. Cambiar de proveedor ante un resultado incierto también puede duplicar: revisar primero el buzón/Enviados.

## Componentes y contrato

- `contact-api/server.mjs`: servidor Node >=24, HTTPS nativo a Siteverify y Resend opcional. `smtp.mjs` integra Nodemailer fijado por lockfile para Zoho SMTP, con TLS obligatorio y certificado validado; sin debug ni lectura de archivos/URLs en el correo. No sirve archivos del repositorio.
- `config.mjs`: validación de variables al arrancar; falla cerrada sin configuración.
- `store.mjs`: SQLite nativo de Node, volumen persistente. Solo HMAC, contadores, estados y fechas; no guarda contenido, IP, correo ni tokens en claro. Estos hashes son datos seudonimizados: proteger el volumen y la clave HMAC. Las filas vencidas se eliminan con la siguiente solicitud; esto no equivale a borrado forense del disco/backups.
- `GET /api/contact/config`: publica únicamente la sitekey (pública), con `no-store`.
- `GET /healthz`: salud del proceso; no confirma DNS, proveedores ni entrega.
- `POST /api/contact`: requiere `Origin` autorizado y `Content-Type: application/json`. Campos `nombre`, `empresa` opcional, `correo`, `solucion`, `mensaje`, `token`. Longitudes máximas 120/160/254/100/1500/2048; nombre, correo, solución y mensaje no pueden estar vacíos. Solución pertenece a las nueve opciones actuales. Límite corporal 16 KiB; rechaza controles/inyección de cabeceras, tipos incorrectos y correos inválidos.
- Turnstile: validación **en servidor** de `success === true`, `hostname` exacto y `action === contact`. Nunca se desactiva por estar en pruebas. Token no se registra ni envía a Resend.
- Notificación en texto plano, From configurado en `iwave.cl` e idéntico al usuario autenticado para Zoho, o en `notificaciones.iwave.cl` para Resend, To fijo por configuración y Reply-To del visitante. No hay autorespuesta al visitante ni destinatarios controlados por el navegador.
- Respuestas: 200 aceptada por el proveedor elegido o duplicado previamente aceptado; 400 campos/JSON; 403 origen/verificación; 405 método; 409 envío en curso o envío SMTP de resultado incierto; 413 tamaño; 415 formato; 429 límites; 503 indisponibilidad/timeout. Un 200 **no confirma recepción en Zoho**. No hay webhooks ni cola de reintentos automáticos: ante rechazo confirmado el visitante puede reintentar con un token nuevo. Una respuesta SMTP ambigua bloquea ese contenido durante las 24 h de la reserva y avisa que no debe reenviarse; no se anuncia éxito. La reserva se marca antes del envío SMTP para cubrir también una caída del proceso.

## Variables

Copiar `.env.example` a `.env` en un entorno privado y restringir permisos (`chmod 600 .env`). No compartir `docker compose config` sin `--quiet`: puede expandir secretos. No colocar `.env` ni este repositorio completo en el directorio servido por Nginx.

| Variable | Uso |
| --- | --- |
| `CONTACT_MAIL_PROVIDER` | `zoho` en el ejemplo nuevo; `resend` conserva la alternativa. Si se omite, se mantiene `resend` por compatibilidad con configuraciones anteriores. |
| `ZOHO_SMTP_HOST` / `ZOHO_SMTP_PORT` | `smtp.zoho.com` / `465`; admite `587` con STARTTLS obligatorio. Usar los datos de la cuenta. |
| `ZOHO_SMTP_USER` | `contacto@iwave.cl`, debe coincidir con From. |
| `ZOHO_SMTP_PASSWORD` | Contraseña privada de aplicación; requerida solo con Zoho. No pasar por argumentos, chat ni logs. |
| `RESEND_API_KEY` | Requerida solo con Resend, permiso de envío restringido al dominio dedicado. |
| `TURNSTILE_SITE_KEY` | Clave pública del widget; se entrega por config. |
| `TURNSTILE_SECRET_KEY` | Secreto de Siteverify, solo servidor. |
| `TURNSTILE_HOSTNAMES` | Hostnames exactos admitidos, separados por coma, sin esquema/puerto; en pruebas `localhost`. |
| `CONTACT_ALLOWED_ORIGINS` | Orígenes exactos con esquema y puerto si corresponde, sin `/` final; pruebas `http://localhost:8127`. En producción futura `https://iwave.cl` y solo otros orígenes realmente servidos. |
| `CONTACT_FROM` | Zoho: `contacto@iwave.cl`. Resend: `formulario@notificaciones.iwave.cl`. Sin nombre de presentación. |
| `CONTACT_TO` | `contacto@iwave.cl`; en primeras pruebas externas usar un buzón controlado de pruebas. |
| `CONTACT_HASH_SECRET` | Valor aleatorio privado estable de al menos 32 caracteres; generar con un gestor de secretos. No rotarlo entre reinicios. |
| `CONTACT_DB_PATH` | Docker: `/data/contact.sqlite`; ejecución directa: ruta privada escribible fuera del sitio servido. |
| `CONTACT_TRUSTED_PROXY_IPS` | IPs **exactas** del proxy inmediato que puede establecer `X-Contact-Client-IP`. Vacío ignora todos los encabezados IP. No admite CIDR ni comodines. |
| `CONTACT_RATE_MAX` / `CONTACT_RATE_WINDOW_SECONDS` | Por defecto 5 intentos por IP y ventana fija de 600 s, incluidos errores de validación. Puede haber dos ráfagas en un borde de ventana. |
| `CONTACT_DAILY_MAX` / `CONTACT_MONTHLY_MAX` | 80 y 2400 intentos de envío globales por día/mes UTC. Los intentos fallidos del proveedor también consumen cupo de forma conservadora. |
| `CONTACT_UPSTREAM_TIMEOUT_MS` | 10000 ms por petición HTTPS o fase SMTP, máximo 30000; varias fases SMTP pueden superar ese total. Un timeout HTTP no demuestra que SMTP haya fallado. |
| `PORT` / `CONTACT_BIND` | Docker: 3000 / 0.0.0.0. En ejecución directa local se recomienda bind 127.0.0.1. |
| `CONTACT_PROXY_NETWORK` | Solo interpolación de la plantilla NPM: nombre de la red Docker externa del NPM de pruebas. Definir en el entorno del comando o mediante `--env-file .env`. |

Límites y deduplicación sobreviven reinicios si se conserva el volumen y `CONTACT_HASH_SECRET`. No escalar esta API a varias réplicas: las reservas y contadores asumen un solo proceso. Hay bloqueo de envíos simultáneos idénticos, reserva recuperable a los 60 s y deduplicación local de 24 h. Solo Resend recibe además una `Idempotency-Key` HMAC estable del payload, también durante reintentos tras fallo ambiguo; su ventana es de 24 h. Cambiar contenido o configuración de remitente/destinatario produce otra clave. Eliminar el volumen o rotar la clave reinicia protecciones. SMTP no ofrece esa garantía remota de idempotencia: Message-ID estable solo identifica el mensaje. El estado incierto evita el reintento automático, pero no existe garantía de exactamente una entrega. El presupuesto es del formulario, no de otros usos del proveedor.

## Pruebas sin credenciales y sin envíos reales

Instalar la dependencia SMTP fijada, sin scripts, desde `contact-api/` con `npm ci --ignore-scripts --no-fund --no-audit`. Desde la raíz:

```bash
node --test contact-api/test/contact.test.mjs contact-api/test/verify-smtp.test.mjs
node --check contact-api/server.mjs
node --check contact-api/config.mjs
node --check contact-api/store.mjs
node --check contact-api/smtp.mjs
node --check contact-api/verify-smtp.mjs
node --input-type=module --check < img/experience/contact.js
git diff --check
```

La suite usa HTTP real en loopback y reemplaza Siteverify, Resend y SMTP por mocks. La generación MIME se comprueba en memoria con Nodemailer, sin conexión. No carga `.env` ni contacta sus APIs. Se necesita permiso para abrir un puerto efímero local. No existe un modo mock ni una puerta para omitir Turnstile en el servidor distribuido.

QA de navegador reutiliza Playwright externo disponible, sin añadir dependencias al sitio:

```bash
node docs/contact-form/browser.cjs
```

En otros equipos definir `PLAYWRIGHT_MODULE` con la ruta al módulo Playwright instalado y `PLAYWRIGHT_LIBS` con las bibliotecas locales si son necesarias. El script simula config, widget y POST, intercepta recursos externos y prueba 390/768/1440 px. Capturas en `/tmp/iwave-form027-ANCHO.png`. No valida el widget real ni la recepción de correo. Resultados realizados en [QA.md](QA.md).

## Verificar Zoho sin exponer credenciales

1. Completar localmente `.env` (permisos 600) con `CONTACT_MAIL_PROVIDER=zoho`, `CONTACT_FROM=contacto@iwave.cl`, `CONTACT_TO=contacto@iwave.cl`, servidor/puerto de la cuenta, usuario y contraseña de aplicación. Usar contraseña de aplicación si MFA/política lo requiere. Nunca copiar el secreto al chat. No es necesario crear `notificaciones.iwave.cl` para Zoho. Mantener las variables Turnstile, orígenes y almacenamiento del entorno de pruebas.
2. La conectividad sin credenciales puede repetirse con `python3 docs/contact-form/check-smtp.py`. Solo hace TLS/STARTTLS/EHLO/QUIT y no lee `.env`.
3. Con todas las variables del ejemplo ya configuradas, comprobar TLS y autenticación, **sin enviar correo**:

```bash
node --env-file=.env contact-api/verify-smtp.mjs
```

El verificador usa `readMailConfig`: valida proveedor Zoho, From/To, usuario, contraseña, host, puerto y timeout; no requiere claves Turnstile, hash ni SQLite. La API sigue exigiendo su configuración completa. Solo ejecuta `verify()`, sin `sendMail`. Informa destino/TLS, etapa, categoría y códigos permitidos de error/SMTP; nunca imprime respuestas crudas, usuario, contraseña ni valores AUTH. Un 535 indica rechazo de autenticación, pero no distingue por sí solo contraseña, usuario o restricción de cuenta. La autenticación real pasó el 2026-11-23 fuera del sandbox contra `smtp.zoho.com:465`, con TLS y certificado validado. El verificador aislado no prueba aceptación ni entrega; las pruebas integrales posteriores, confirmadas por el usuario y registradas en QA, sí incluyen recepción y Reply-To. Un nuevo envío productivo requerirá autorización explícita.

4. Si AUTH es rechazado, confirmar servidor, contraseña de aplicación y acceso SMTP del buzón/organización. No concluir que el plan carece de SMTP por un fallo de contraseña. Si Zoho confirma la restricción, conservar Resend cambiando explícitamente proveedor/From/API key en el entorno. Bajo la restricción actual de **no cambiar ningún registro DNS**, Resend solo podrá activarse si el dominio de envío ya está verificado; de lo contrario queda pendiente, sin modificar registros ni atribuirle funcionamiento real.

## Resend como alternativa opcional

Estos son pasos de referencia para una futura autorización de Resend; **no se ejecutaron y no autorizan cambios DNS bajo el encargo actual**. Omitirlos cuando se utiliza Zoho SMTP.

1. Crear cuenta en el plan gratuito de Resend. Añadir exclusivamente `notificaciones.iwave.cl` como dominio de envío. No activar recepción ni migrar el correo de `iwave.cl`.
2. Resend mostrará registros específicos de DKIM/SPF y eventualmente MX del Return-Path de envío, según región/configuración. Revisar esos nombres y valores en el panel; no inventarlos. Solo añadir los registros de ese subdominio/Return-Path después de autorizar el cambio DNS por separado. **No reemplazar, editar ni eliminar los MX de Zoho en `iwave.cl`**, ni crear un segundo SPF en la raíz. El MX del Return-Path, si se exige, sirve para rebotes del envío y no sustituye al MX del buzón Zoho. Si no se permite ningún registro MX adicional de subdominio, dejar la verificación pendiente y revisar con Resend antes de activar; no eludirla cambiando los MX existentes.
3. Esperar estado verificado. Crear API key de solo envío restringida al dominio, guardarla en el entorno privado y configurar From. No usar la dirección del visitante como From.
4. En pruebas externas, verificar en Resend la aceptación y luego la llegada efectiva al buzón controlado. Tras esto probar `contacto@iwave.cl` y que Responder en Zoho apunte al visitante. Revisar spam/rebotes y encabezados SPF/DKIM/DMARC. Una aceptación API no demuestra entrega.

Referencias oficiales consultadas: [dominios dedicados](https://resend.com/docs/dashboard/domains/introduction), [POST emails y Reply-To](https://resend.com/docs/api-reference/emails/send-email), [idempotencia de 24 horas](https://resend.com/docs/dashboard/emails/idempotency-keys), [plan y cuotas](https://resend.com/pricing). Comprobar cuotas vigentes en la cuenta antes de activar y mantener plan gratuito, sin contratar complementos. Los límites locales no garantizan cupo si otras aplicaciones usan la misma cuenta.

## Activar Turnstile después de las pruebas locales

1. Crear widget Managed del plan Free para el entorno de pruebas; permitir su hostname exacto (`localhost` para el Compose local). Crear otro widget para el sitio definitivo al activarlo. No requiere modificar DNS ni MX.
2. Guardar sitekey y secret en sus variables; configurar `TURNSTILE_HOSTNAMES` y `CONTACT_ALLOWED_ORIGINS` del entorno correspondiente. El módulo envía action `contact`; la API exige ese valor y el hostname esperado.
3. Si existe CSP, permitir los recursos de `https://challenges.cloudflare.com` en `script-src` y `frame-src` según la documentación, sin relajar toda la política. Confirmar carga del widget, caducidad y errores.
4. Las claves públicas de prueba de Cloudflare sirven para ensayar su widget, pero no validan la configuración real de hostname/action. No cambiar las comprobaciones del servidor para aceptarlas; usar los mocks automatizados sin credenciales o un widget real de pruebas para la comprobación integral. Nunca usar claves dummy en producción.

Referencias: [validación obligatoria en servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [pruebas](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), [plan gratuito](https://developers.cloudflare.com/turnstile/plans/).

## Desplegar primero en pruebas aisladas

No ejecutar contra los proyectos Docker existentes. El 2026-11-23 se construyó y arrancó únicamente `iwave-form027-test`: web en `127.0.0.1:8127` y API en `127.0.0.1:3027`, con red y volumen propios. El puerto 8080 ya pertenece a `iwave-test`; 8081 pertenece a `iwave-prod`. No se conectó la red del proxy público.

1. Completar `.env` en el servidor de pruebas y usar inicialmente un buzón controlado. El Compose fuerza `CONTACT_MAIL_PROVIDER=zoho`, `CONTACT_DB_PATH=/data/contact.sqlite`, `PORT=3000`, `CONTACT_BIND=0.0.0.0`, origen `http://localhost:8127`, hostname `localhost` y proxies de confianza vacíos; estos ajustes sobrescriben solo el entorno del contenedor y no modifican `.env`. Sin credenciales, la API debe negarse a arrancar.
2. Comprobar configuración sin imprimir secretos, construir y arrancar el **nuevo** proyecto aislado:

```bash
docker compose -f contact-api/compose.test.yml config --quiet
docker compose -f contact-api/compose.test.yml build
docker compose -f contact-api/compose.test.yml up -d
```

3. Abrir `http://localhost:8127` desde el host de pruebas, o ejecutar en el equipo local `ssh -N -L 8127:127.0.0.1:8127 usuario@VPS` y abrir esa misma URL. Usar `localhost`, que es el hostname permitido por la API de pruebas. No enviar un formulario válido hasta autorizar explícitamente el primer correo. La API queda en `127.0.0.1:3027` para salud, sin exposición pública. El Nginx de pruebas sirve solo los assets explícitos, no `.env`, código API ni documentación privada. Por defecto el rate limit agrupa visitantes por IP del proxy; esto es conservador y seguro para la prueba local.
4. Verificar validación, éxito, errores de proveedor, caducidad, conservación del texto al fallar, doble clic y 429. Confirmar entrega real y Reply-To por separado, solo cuando se haya autorizado un envío de prueba con credenciales. Reiniciar la API y comprobar que no se repite la notificación con el mismo contenido y un token nuevo.
5. Detener el proyecto de pruebas conservando el volumen:

```bash
docker compose -f contact-api/compose.test.yml down
```

No usar `down -v` para reiniciar: borraría los límites/deduplicación.

### Resultado integral confirmado por el usuario

El usuario confirmó Turnstile real, recepción API, envío Zoho, recepción en contacto@iwave.cl y respuesta al visitante por Reply-To. El bloqueo 110200 observado en la activación inicial queda como evidencia histórica en QA; no permanece como pendiente de pruebas. No se repitieron envíos durante el cierre. Los mocks de navegador siguen siendo regresiones automatizadas, no la fuente de esa confirmación real.

Antes del corte productivo revisar que el widget permita iwave.cl y www.iwave.cl cuando sirvan el formulario. La validación de localhost no acredita esa configuración. No se cambia Cloudflare ni se activa producción en este cierre.

### Ensayo con Nginx Proxy Manager

`compose.npm.example.yml` es una plantilla independiente para un **NPM de pruebas**, sin puertos publicados. Conectar API y NPM a una red Docker dedicada existente, definir `CONTACT_PROXY_NETWORK` y revisar colisiones del nombre DNS `contact-api`. Crear el proxy host de pruebas para la landing de pruebas, conservar HTTPS y añadir esta ubicación en su configuración avanzada (no duplicarla como Custom Location):

```nginx
location ^~ /api/contact {
    client_max_body_size 16k;
    proxy_pass http://contact-api:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Contact-Client-IP $remote_addr;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

Mantiene la URI completa e incluye `/api/contact/config`. Revisar con `nginx -t` en la instancia de pruebas antes de recargar. En `CONTACT_TRUSTED_PROXY_IPS` colocar únicamente la IP exacta con que **ese NPM** conecta a la API; mantenerla estable en su red. El NPM debe sobrescribir siempre `X-Contact-Client-IP`, nunca copiarla del visitante. La API ignora `X-Forwarded-For` y `CF-Connecting-IP`. Si NPM está detrás de Cloudflare, `$remote_addr` solo representa al visitante cuando NPM ya tiene real-IP configurado correctamente y limitado a proxies de confianza. Si no es así, mantendrá un límite compartido conservador; no confiar indiscriminadamente en cabeceras ni rangos completos de Docker. Cerrar acceso directo a la API desde redes no autorizadas.

```bash
docker compose --env-file .env -f contact-api/compose.npm.example.yml config --quiet
docker compose --env-file .env -f contact-api/compose.npm.example.yml up -d --build
```

Una futura activación en producción requiere autorización separada: validar primero este ensayo y las credenciales/dominio, respaldar la configuración vigente, desplegar API con su volumen y enrutar ambas rutas, y recién entonces publicar los assets modificados. No tocar los cambios previos del Dockerfile/Nginx de este checkout. Para revertir, restaurar los assets previos y retirar solo las rutas/API nuevas; conservar volumen y buzón. Ninguno de esos pasos de producción se ejecutó aquí.
