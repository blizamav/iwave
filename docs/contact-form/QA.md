# FORM-027 — cierre y validación real

## Commit creado; push pendiente por desbloqueo SSH

- Commit de implementación: `fd39c70ee0ca7b0fd28a605ca7327da299ec0736`, en reconstruccion-iwave, con exactamente los 34 archivos aprobados del manifiesto. Índice comprobado y escaneo final de árbol/índice sin secretos. Archivo privado productivo fuera de Git.
- Configuración productiva completa validada: Zoho, SMTP 465, HTTPS, sin localhost, permisos 600 y HMAC dedicado. Hostname iwave.cl confirmado visualmente por el usuario en el widget iWave - Formulario Contacto.
- Respaldo privado de configuración del Proxy Host 1 y estado de iwave-prod/test/npm creado; no se copiaron claves SSL.
- Push intentado por SSH predeterminado y después con la clave GitHub existente: no se completó. El diagnóstico confirma que GitHub reconoce esa clave, pero está cifrada y no hay agente SSH accesible con ella desbloqueada. No se solicitó ni expuso su contraseña o contenido. Requiere desbloqueo interactivo en un agente accesible; no se generó ni sustituyó la clave.
- Conforme al orden autorizado, construcción y arranque de candidatos quedan pendientes del push. No se ejecutó el corte ni se enviaron correos. Los contenedores protegidos y NPM permanecen intactos.

## Confirmación de hostname productivo y continuación autorizada

El usuario confirmó visualmente que el widget **iWave - Formulario Contacto** permite `iwave.cl` y `localhost`, y ratificó la prueba real de Turnstile, envío, recepción y Reply-To. Esta confirmación resuelve la comprobación pendiente del hostname productivo; la ausencia de token en Chromium automatizado se conserva como limitación de automatización, no como fallo de configuración. No se cambió Cloudflare.

La configuración privada productiva pasa readConfig con Zoho, SMTP 465, orígenes HTTPS y sin localhost; archivo ignorado con permisos 600 y HMAC dedicado. El manifiesto de 34 archivos y los cambios preexistentes de Dockerfile/Nginx/contextos/archivo histórico Caddy fueron revisados para versionado; no se modifica infraestructura activa con ese versionado. Se continúa únicamente con commit, push y candidatos, manteniendo pendiente la autorización del corte público.

## Preparación final — validación de hostname pendiente

Durante la continuación autorizada se recuperó el estado sin commits ni candidatos productivos. Se creó únicamente `.env.form027-production`, ignorado por Git, con permisos 600, credenciales preservadas, HMAC dedicado y origen/hostnames HTTPS de iwave.cl/www, sin localhost. readConfig aprobó la configuración privada. El manifiesto conserva 34 archivos, sin rutas privadas; escaneo de 769 archivos versionables sin coincidencias de secretos.

La comprobación de navegador cargó los assets de pruebas bajo una URL localmente interceptada https://iwave.cl, sin modificar el dominio público, DNS ni NPM. El iframe real de Turnstile cargó, pero no produjo token en la ventana de comprobación; no hubo error 110200 ni POST del formulario. **Resultado inconcluso: no demuestra rechazo ni autorización del hostname.** Se solicitó confirmación de Hostname Management para el widget de las claves privadas.

Por la instrucción de detenerse ante una validación no completada, commit, push, construcción y arranque de candidatos quedan pendientes. No se enviaron correos ni se modificaron los contenedores originales. Las 25 pruebas backend con mocks volvieron a pasar; la regresión de navegador se ejecutó con proveedores simulados. Los resultados reales previamente confirmados por el usuario permanecen válidos para pruebas, pero no se atribuye con ellos la autorización productiva del hostname.

## Estado vigente registrado el 2026-11-23

El usuario confirma que el flujo completo funciona en pruebas: Cloudflare Turnstile genera una verificación válida, la API recibe las solicitudes, Zoho SMTP envía, contacto@iwave.cl recibe y Reply-To permite responder al correo indicado por el visitante. Son **resultados reales informados por el usuario**, no envíos ejecutados ni inspección independiente del buzón en este cierre. No se suministraron fecha de los envíos, IDs de mensaje ni cabeceras; no se inventan. El error localhost 110200 y los pendientes de entrega de las secciones históricas siguientes quedan superados en el entorno de pruebas por esta confirmación.

| Validación integral en pruebas | Resultado | Fuente |
| --- | --- | --- |
| Turnstile real | Confirmada | Usuario |
| Recepción de solicitudes por API | Confirmada | Usuario |
| Envío mediante Zoho SMTP | Confirmado | Usuario |
| Recepción en contacto@iwave.cl | Confirmada | Usuario |
| Reply-To y respuesta al visitante | Confirmados | Usuario |

## Verificaciones finales del cierre

- `node --test contact-api/test/contact.test.mjs contact-api/test/verify-smtp.test.mjs`: **25/25 aprobadas**, con mocks; sin correos reales.
- `node docs/contact-form/browser.cjs`: aprobado en 390/768/1440 px, widget y POST simulados. Sin cambios de diseño/animaciones.
- `contact-api/compose.production.yml`: válido con `config --no-env-resolution --quiet`; configuración efectiva de producción validada mediante readConfig en memoria usando los secretos locales existentes. El archivo privado productivo todavía no se creó ni se verificaron sus claves para los hostnames productivos. No se construyeron ni arrancaron sus servicios.
- `iwave-web` existe y contiene iwave-prod/iwave-npm. Host NPM 1 apunta a iwave-prod:80, sin rutas API. El Compose prepara servicios DNS exclusivos, sin puertos publicados, en esa red externa; no se conectaron ni modificaron los existentes.
- `docs/deployment/form027/npm.locations.conf`: sintaxis aprobada por nginx -t en contenedor temporal sin red, con upstream resuelto solo para esa comprobación. Pendiente comprobar dentro del host real y resolver candidatos después de autorizar despliegue.
- `.env` ignorado y no rastreado; no había archivos staged. Comprobación en memoria de secretos locales, AUTH codificado y patrones de claves privadas/tokens sobre archivos versionables y últimos 1000 registros de cada servicio de pruebas: **sin coincidencias**. Logs observados: 1 línea API y 92 líneas web. No se imprimieron contenidos ni secretos. Esto no certifica todo el historial Git o logs externos.
- Procedimiento, manifiesto de archivos, configuración NPM y rollback en [FORM-027 producción](../deployment/FORM-027.md). No hubo despliegue, envío, cambios de infraestructura activa, certificados, DNS/MX/Cloudflare, commit ni push durante este cierre.

Las siguientes secciones conservan la evidencia histórica de implementación, autenticación y activación inicial. Sus pendientes no describen el estado funcional de pruebas confirmado arriba.

# Historial — resultados locales

Ejecución inicial el 2026-11-21 y ampliación SMTP verificada el 2026-11-23, con Node v26.13.1. No se cargaron credenciales reales ni se enviaron correos. El runtime previsto en Docker es Node 24; no se construyó ni ejecutó la imagen, por lo que falta verificarla en el entorno de pruebas.

## API

Comando: `node --test contact-api/test/contact.test.mjs`.

**22 pruebas aprobadas, 0 fallidas, 0 omitidas** en la ejecución final. Son grupos con varios casos por prueba:

- Arranque cerrado ante configuración incompleta/incorrecta.
- Campos, límites de longitud, lista de soluciones, tipos y caracteres de control.
- Contrato HTTPS Resend: To fijo, From dedicado, Reply-To, texto plano e Idempotency-Key; token excluido.
- Rechazo de Origin ajeno/ausente, método/formato incorrecto, JSON inválido y cuerpo excesivo.
- Siteverify: rechazos por success/hostname/action; errores HTTP/JSON y timeout simulados.
- Duplicados con token nuevo y mensajes diferentes; dos solicitudes simultáneas provocan una sola llamada a Resend.
- Fallos HTTP/timeout/red/JSON/ID faltante de Resend: error y posterior reintento con payload/clave estables.
- Límites por IP, expiración de ventana, cabeceras falsificadas, proxy explícito y presupuestos diario/mensual.
- Config pública sin secretos.
- Zoho seleccionable sin API key Resend; validación de host/puerto/usuario/From y contraseña requerida.
- TLS obligatorio, certificado validado y logs desactivados en las opciones SMTP.
- Ruta Zoho con destinatario/Reply-To correctos, Turnstile, límite IP y deduplicación; sin fallback Resend.
- Rechazo SMTP/autenticación permite reintento; timeout tras DATA o respuesta sin destinatario aceptado no anuncia éxito y bloquea reenvío idéntico, también tras reiniciar SQLite.
- MIME Unicode y Reply-To generado en memoria con Nodemailer, sin conexión ni transmisión.
- Cierre y reapertura de la API/SQLite: conserva límites y deduplicación; no contiene valores personales ni tokens en claro en DB/WAL.

El sandbox inicial bloqueó puertos de loopback con EPERM; las ejecuciones aprobadas se realizaron con permiso para localhost. Los proveedores fueron mocks en todas las pruebas automatizadas de envío. No se probó un timeout real de red externa.

## Conectividad SMTP desde VPS

Sonda `python3 docs/contact-form/check-smtp.py`, sin credenciales ni autenticación, repetida al finalizar la ampliación. Certificado verificado con el almacén de confianza del sistema, sin desactivar validaciones:

| Servidor | Puerto | Seguridad | EHLO | AUTH anunciado |
| --- | --- | --- | --- | --- |
| smtp.zoho.com | 465 | TLS verificado | 250 | LOGIN / PLAIN |
| smtp.zoho.com | 587 | STARTTLS verificado | 250 | LOGIN / PLAIN |

Solo saludo/EHLO, STARTTLS cuando corresponde y QUIT. Nunca se ejecutó AUTH, MAIL FROM, RCPT TO ni DATA. La lectura pública de MX devuelve mx.zoho.com, mx2.zoho.com y mx3.zoho.com. Se requirió permiso de red fuera del sandbox; no se cambiaron registros. Estos resultados prueban conectividad del host y compatibilidad de protocolo; **no prueban permisos SMTP de contacto@iwave.cl, aceptación de un mensaje ni recepción**. El verificador de autenticación quedó preparado para configuración privada posterior; no se ejecutó con credenciales reales.

## Reanudación tras SSH: sandbox frente a VPS — 2026-11-23

Se recuperaron los archivos existentes de FORM-027, la integración Zoho/Nodemailer, el verificador sin envío y los resultados registrados de **22 pruebas API/MIME aprobadas** y navegador 390/768/1440 px. Esos resultados son previos; no se volvió a ejecutar la suite completa en esta comprobación de red. La sintaxis de server/config/store/smtp/verify-smtp y contact.js volvió a comprobarse sin errores.

Para aislar los `gaierror`, se ejecutó el mismo diagnóstico Python sin credenciales dentro del sandbox (15:49:24 UTC) y fuera de él en la VPS (15:49:47 UTC). Usó el resolvedor normal del sistema (`socket.getaddrinfo`), conexiones TCP separadas y SMTP TLS/STARTTLS con validación de certificado. El script temporal quedó en `/tmp/iwave-form027-connectivity.py`; no modifica la sonda existente del repositorio.

| Comprobación | Sandbox | VPS fuera del sandbox |
| --- | --- | --- |
| Crear socket TCP IPv4 | PermissionError, EPERM (errno 1) | Correcto |
| Resolver smtp.zoho.com | gaierror, EAI_AGAIN (errno -3) | Correcto: 136.143.182.56 en esa consulta |
| TCP 465 | Bloqueado antes de conectar por resolución fallida | Correcto |
| TLS implícito 465 | No alcanzado | TLS 1.3, certificado verificado |
| TCP 587 | Bloqueado antes de conectar por resolución fallida | Correcto |
| STARTTLS 587 | No alcanzado | TLS 1.3, certificado verificado |
| EHLO tras TLS | No alcanzado | 250 en ambos; AUTH LOGIN/PLAIN anunciado |

**Conclusión:** los errores reproducidos se deben a las restricciones de sockets/red del sandbox. La resolución de nombres y la salida SMTP de la VPS funcionan en esta prueba; no se justifica modificar el DNS de Ubuntu. La IP es evidencia puntual, no una dirección que deba fijarse en configuración. Solo se ejecutaron saludo/EHLO/STARTTLS/QUIT; no hubo AUTH, MAIL FROM, RCPT TO ni DATA.

Pendiente para conectar el formulario: confirmar acceso SMTP de la cuenta mediante autenticación privada cuando se autorice, completar Turnstile/entorno, comprobar la imagen y red del contenedor en pruebas y, después de autorizarlo, verificar un envío real y su recepción en contacto@iwave.cl con Reply-To del visitante. Accesibilidad desde el host no certifica aún la red del futuro contenedor. No se solicitaron ni leyeron credenciales, ni se ejecutó verify-smtp con secretos. No hubo cambios de aplicación, infraestructura, producción, registros DNS, despliegues, commits ni push. Solo se añadieron este diagnóstico y su registro en CHANGELOG; los avances existentes se preservaron.

## Navegador

Comando: `node docs/contact-form/browser.cjs`, con Playwright/Chromium externos ya disponibles. Servidor efímero local; config/widget/POST simulados e interceptados. Recursos externos sin acceso real. Movimiento reducido para una comprobación estable del formulario.

| Ancho | Resultado |
| --- | --- |
| 390 px | Aprobado |
| 768 px | Aprobado |
| 1440 px | Aprobado |

En cada tamaño: campos vacíos y foco al primer error, token obligatorio, errores 400/403/409/429/503 y red, texto conservado al fallar, botón bloqueado durante envío, dos submits con una sola petición, éxito sin navegación, limpieza tras aceptación y caducidad del token. Ampliado con respuesta `delivery_uncertain`: conserva contenido y advierte no reenviar. Cero excepciones JavaScript y sin desbordamiento horizontal. Capturas locales `/tmp/iwave-form027-390.png`, `-768.png` y `-1440.png` (temporales, no se versionan). Se inspeccionaron visualmente las de 390 y 1440 px: controles y superficie oscura existentes conservados; se añade el espacio del widget y se actualizan los textos operativos. El widget visible es una simulación, no certifica el tamaño o comportamiento del widget real de Cloudflare.

## Comprobaciones estáticas y alcance

- Sintaxis: `node --check` de server/config/store/smtp/verify-smtp y `node --input-type=module --check < img/experience/contact.js`.
- Compose: `docker compose -f contact-api/compose.test.yml config --quiet --no-env-resolution` y `docker compose -f contact-api/compose.npm.example.yml config --quiet --no-env-resolution --no-interpolate`; validan estructura sin cargar `.env`, resolver secretos ni contactar el daemon. Red externa/variables de NPM y secretos requieren validación posterior con la configuración real.
- `git diff --check` aprobado; diff/status revisados. Sin cambios a CSS ni motores de animación. Los cambios HTML quedan en el formulario y el versionado de su módulo.
- Cambios preexistentes preservados: `Dockerfile`, `nginx.conf`, `.dockerignore` y `docs/deployment/`.

Pendiente: build/arranque Docker, salud con volumen nuevo bajo usuario node, HTTPS/rutas NPM y confianza de proxy, widget real y su accesibilidad, autenticación y aceptación real de Zoho SMTP (o verificación del subdominio/Resend solo si se elige esa alternativa), entrega/spam/rebotes en Zoho y Reply-To en el buzón. No se realizaron auditorías completas de accesibilidad, rendimiento ni animaciones de otras secciones. No hubo cambios en Cloudflare/MX, despliegues, commits o pushes.

## 2026-11-23 — diagnóstico de autenticación real

El verificador original fallaba en `readConfig()` con `Configurar CONTACT_HASH_SECRET`, antes de crear el transporte o ejecutar AUTH. La comprobación privada de presencia también detectó claves Turnstile vacías. Proveedor Zoho, host/puerto previstos, usuario coincidente con From y contraseña de aplicación estaban presentes; no se imprimieron sus valores privados ni se modificó `.env`.

Se separó `readMailConfig()` para verificar el transporte sin exigir secretos de la API. Esta conserva todas sus validaciones. El verificador ahora informa destino/TLS, etapa, categoría y código permitido/SMTP, sin respuestas crudas ni valores AUTH.

Con aprobación de red fuera del sandbox, `node --env-file=.env contact-api/verify-smtp.mjs` terminó con código 0: TLS y autenticación correctos en `smtp.zoho.com:465`, certificado validado y autenticación requerida. No se ejecutó `sendMail` ni se enviaron correos; aceptación y entrega siguen pendientes. Este resultado actualiza las limitaciones de autenticación de las comprobaciones históricas anteriores.

Validación de esta corrección: 25/25 pruebas aprobadas con `node --test contact-api/test/contact.test.mjs contact-api/test/verify-smtp.test.mjs` fuera del sandbox, con mocks y sockets locales. Incluye separación de configuración, validación cerrada, clasificación DNS/TLS/AUTH, saneamiento de errores y cierre del transporte. La primera ejecución detectó un mensaje de host/puerto sin nombres de variables y una aserción que confundía el código permitido EAUTH con valores AUTH; ambos corregidos antes de la ejecución final.

## 2026-11-23 — activación aislada Docker

- `.env` validado sin imprimir valores: variables requeridas presentes, configuración completa válida, permisos 600, proveedor Zoho y claves Turnstile reales (no dummy). Archivo privado sin modificar.
- Existentes: `iwave-prod` en 8081, `iwave-test` en 8080 e `iwave-npm` en 80/443 y administración local 8181. IDs, fechas de arranque y contadores de reinicio comparados antes/después, sin cambios. No se tocaron estos contenedores ni sus redes/configuración.
- Se construyó y levantó solo `iwave-form027-test`: `contact-api` con Node v24.22.3 en `127.0.0.1:3027` (healthy), `web` Nginx en `127.0.0.1:8127`; red `iwave-form027-test_default` y volumen `iwave-form027-test_contact-state`. Compose fuerza Zoho y origen/hostname locales, sin editar `.env`.
- Compose local válido; plantilla NPM validada con nombre de red ficticio solo para interpolación, sin crear/conectar esa red. Nginx de pruebas pasa `nginx -t`. No se arrancó otro NPM ni se modificó el público.
- Salud API y página web: HTTP 200. Archivos `.env`, código API y documentación: HTTP 404 desde la web. Config pública contiene solo sitekey y responde 200. Desde navegador contra Docker, POST con token inválido devuelve 403 de verificación, sin reserva/envío.
- AUTH SMTP desde el contenedor correcto, TLS/certificado validado y salida 0; no se enviaron correos. Siteverify real desde el contenedor responde HTTP 200 y `invalid-input-response` al token inválido.
- Widget real en `http://localhost:8127`: iframe Cloudflare presente, error 110200, ningún token válido generado. Según [Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/), significa dominio no autorizado. Pendiente permitir `localhost` en el widget de pruebas; no requiere dominio público ni DNS ([referencia](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)). No se cambió el panel. No se certifica todavía validación real exitosa del par sitekey/secret ni de hostname/action.
- 25/25 pruebas backend aprobadas con mocks. `node docs/contact-form/browser.cjs` aprobado en 390/768/1440 px con widget/POST simulados. Comprobación adicional real con navegador en `/tmp/iwave-form027-live.cjs`, bloqueando POST con tokens válidos; no se envió correo. La tabla deliveries del volumen quedó con 0 filas.
- Acceso mediante túnel: `ssh -N -L 8127:127.0.0.1:8127 usuario@VPS`, luego `http://localhost:8127`. Pendientes: permitir hostname, validar desafío real sin correo y solicitar autorización explícita para primer envío/recepción/Reply-To. Producción, DNS/MX, diseño, animaciones y archivos privados preservados; sin commit/push.
