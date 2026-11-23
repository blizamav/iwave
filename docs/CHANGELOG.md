# 2026-11-23 — FORM-027: cierre definitivo en producción

- Usuario confirmó formulario funcional en https://iwave.cl y recepción real en contacto@iwave.cl. Se registra esta evidencia sin inventar fecha/ID de envío ni reenviar correos.
- Verificado en lectura: HTTPS/HTML y recursos correctos, API pública config 200, rechazos 400/405, web/API healthy, NPM válido y autenticación Zoho desde API correcta. Navegador sin errores JS/HTTP ni overflow con movimiento reducido; no certifica visualmente WebGL.
- Proxy Host 1 ya activo con web iwave-form027-web:80 y dos ubicaciones de prefijo API hacia iwave-form027-api:3000. Referencias SSL preservadas; iwave-prod disponible como respaldo. Procedimiento/arquitectura/QA actualizados al estado real.
- Se incluye la corrección tmpfs autorizada pendiente de versionar. Sin modificaciones de producción, reinicios, cambios DNS/MX/Cloudflare, diseño o correos adicionales durante el cierre. [QA](contact-form/QA.md), [operación y rollback](deployment/FORM-027.md).

# 2026-11-23 — FORM-027: tmpfs corregido y candidatos saludables

- Único cambio de ejecución: tmpfs de API convertido a lista con un string entre comillas; Compose v5.7.1 normaliza un solo montaje. Reutilizadas imágenes de 12aae42, sin reconstrucción.
- API/web candidatas running/healthy, en iwave-web sin puertos públicos; DNS, comunicación bidireccional, Nginx y autenticación Zoho TLS465 correctos. Montaje real 8 MiB/noexec/nosuid; ningún correo enviado. [Resultados](contact-form/QA.md), [estado y procedimiento](deployment/FORM-027.md).
- IDs/fechas/reinicios de iwave-prod/test/npm y hash del host NPM sin cambios. Sin corte público ni cambios SSL/Cloudflare/DNS/MX; sin commits ni push. Cambios documentales anteriores preservados.

# 2026-11-23 — FORM-027: imágenes candidatas construidas; arranque detenido

- Confirmados fd39c70/12aae42 en reconstruccion-iwave remota por HTTPS de lectura. Configuración privada productiva validada y ambas imágenes construidas desde 12aae42, sin nuevos commits/push.
- Arranque rechazado por Docker: tmpfs inline de la API se separa en tres elementos e interpreta noexec como ruta. Detención conforme a la instrucción del usuario; corrección propuesta en QA, sin aplicar ni reintentar. Ningún candidato quedó creado; volumen nuevo conservado.
- IDs/fechas de arranque/reinicios de iwave-prod/test/npm y hash del host NPM iguales al respaldo. Sin corte público, modificación de protegidos/DNS/Cloudflare ni correos nuevos. [Evidencia y límites](contact-form/QA.md).

# 2026-11-23 — FORM-027: commit realizado; push pendiente de agente SSH

- Creado commit fd39c70 con exactamente los 34 archivos aprobados, sin secretos ni archivos privados. Configuración productiva validada y hostname confirmado por el usuario. Respaldo privado NPM/estado creado.
- Push no completado: GitHub reconoce la clave existente, pero requiere contraseña y no hay agente accesible con ella desbloqueada. Pendiente desbloqueo interactivo; no se imprimieron ni solicitaron secretos.
- Candidatos pendientes del push; no hubo cambios públicos, modificaciones de los contenedores protegidos ni correos nuevos. [Estado y evidencia](contact-form/QA.md).

# 2026-11-23 — FORM-027: hostname confirmado y preparación de candidatos autorizada

- El usuario confirmó visualmente iwave.cl en el widget iWave - Formulario Contacto y ratificó la prueba real completa. Se resuelve la validación pendiente; Chromium sin token queda como limitación de automatización.
- Configuración privada productiva validada sin localhost, secretos excluidos y manifiesto de 34 archivos revisado, incluidos cambios preexistentes. Autorizados commit/push a reconstruccion-iwave y candidatos aislados; corte NPM/público permanece sin autorizar.

# 2026-11-23 — FORM-027: preparación privada y pausa antes de candidatos

- Recuperado el estado tras interrupción, sin reconstruir la aplicación. Preparado archivo privado productivo ignorado, permisos 600, credenciales existentes y HMAC dedicado; validación completa y ausencia de localhost productivo.
- Manifiesto de 34 archivos comprobado, sin secretos ni rutas privadas; 25 pruebas backend con mocks aprobadas. Turnstile cargó con hostname iwave.cl mediante interceptación local del navegador, sin token ni resultado concluyente sobre autorización.
- Solicitada confirmación del hostname en el widget correspondiente. Commit, push y candidatos pendientes de resolver esta validación; sin envíos ni corte público, y sin cambios en NPM/producción/DNS/MX. [Detalle](contact-form/QA.md).

# 2026-11-23 — FORM-027: cierre de pruebas y preparación productiva

- Registrada confirmación del usuario: Turnstile real, API, envío Zoho, recepción en contacto@iwave.cl y Reply-To con respuesta al visitante. Sin repetir envíos ni inventar fechas/IDs de mensajes.
- Preparado Compose productivo separado con API/web en iwave-web, nombres exclusivos, sin puertos publicados y conservando iwave-prod/test/npm. NPM mantiene SSL y recibe solo ubicaciones API exactas y un cambio reversible de upstream al candidato web. Nada desplegado.
- Documentados manifiesto explícito de versionado, archivos privados, comandos de commit/push/despliegue sujetos a autorización, validaciones y rollback; historial Caddy identificado como superado por NPM. Exclusiones ampliadas para logs, material privado y respaldos; origen de ejemplo alineado con 8127.
- 25/25 pruebas backend y navegador con mocks en 390/768/1440 px aprobados. Compose válido y snippet nginx -t aprobado sin red. Sin secretos detectados en archivos versionables/logs de pruebas inspeccionados; .env ignorado y no rastreado. [QA y límites](contact-form/QA.md), [procedimiento](deployment/FORM-027.md).
- Sin cambios de diseño, animaciones, infraestructura activa, certificados, Cloudflare o DNS/MX; sin commit/push. Cambios preexistentes preservados.

# 2026-11-23 — FORM-027: activación aislada en pruebas

- Validada configuración privada completa sin exponer valores; Compose ajustado al puerto libre 8127 para evitar `iwave-test` (8080), con API local 3027, proveedor Zoho, origen/hostname locales, red y volumen independientes. `.env` intacto.
- Construida imagen Node 24 y arrancados solo web/API de `iwave-form027-test`; API healthy, Nginx válido, frontend → config/POST comprobado, archivos privados no accesibles. AUTH Zoho correcto desde Docker, sin correo; Siteverify real rechaza token inválido.
- Widget real bloqueado por 110200: falta permitir localhost en Turnstile. No requiere dominio público ni DNS; pendiente validar token real y autorizar primer envío. 25/25 pruebas backend y navegador con mocks en 390/768/1440 px aprobados. [Acceso y pasos pendientes](contact-form/README.md), [evidencias](contact-form/QA.md).
- Contenedores existentes conservan IDs/arranques/reinicios. Sin cambios del proxy público, producción, DNS/MX, diseño o animaciones; sin commits ni push.

# 2026-11-23 — FORM-027: autenticación Zoho verificada y diagnóstico corregido

- Causa del fallo original: `verify-smtp.mjs` exigía configuración completa de API y se detenía por `CONTACT_HASH_SECRET` vacío antes de conectar. Claves Turnstile también pendientes para la API. No hubo evidencia de rechazo de credenciales.
- Extraída validación compartida `readMailConfig`; verificador independiente de secretos ajenos a SMTP, con destino/TLS, etapa, categoría y códigos saneados, sin respuestas crudas ni valores AUTH. API conserva sus requisitos. Plantilla y documentación actualizadas.
- Autenticación real aprobada fuera del sandbox hacia `smtp.zoho.com:465`, TLS/certificado validado, salida 0. Sin envío de correo; aceptación y entrega pendientes. 25/25 pruebas con mocks aprobadas y sintaxis comprobada. Detalles en [QA](contact-form/QA.md).
- `.env` y cambios preexistentes preservados; sin cambios propios de infraestructura, DNS, producción, commits ni push.

# 2026-11-23 — FORM-027: diagnóstico SMTP tras reanudación SSH

- Recuperados los avances y resultados previos; sin reconstrucción ni cambios de aplicación. El mismo diagnóstico reproduce EPERM/gaierror dentro del sandbox y confirma fuera de él resolución DNS, TCP 465/587, TLS 1.3 con certificado válido y EHLO 250 hacia smtp.zoho.com desde la VPS.
- Evidencia y límites añadidos a [QA de contacto](contact-form/QA.md). La causa reproducida es la restricción de red del sandbox; no se requiere corregir DNS de Ubuntu con esta evidencia. Autenticación de la cuenta y entrega siguen pendientes. Sin credenciales, envío de correos, cambios de infraestructura/DNS/producción, despliegues, commits ni push.

# 2026-11-23 — FORM-027: simplificar mediante Zoho SMTP

- Revisada documentación oficial: Zoho publica SMTP para organizaciones gratuitas. Conectividad desde VPS confirmada con certificado TLS válido en smtp.zoho.com:465 y STARTTLS en :587, EHLO 250 y AUTH LOGIN/PLAIN anunciados. No se probó autenticación ni envío real del buzón. Sonda reproducible en `docs/contact-form/check-smtp.py`.
- API preparada para `CONTACT_MAIL_PROVIDER=zoho` con Nodemailer fijado por lockfile, TLS obligatorio, From igual al usuario SMTP y Reply-To del visitante. Resend permanece como alternativa manual compatible con las configuraciones anteriores. Variables de ejemplo orientadas a Zoho; verificador de autenticación sin envío en `contact-api/verify-smtp.mjs` para ejecutar después con configuración privada.
- Validación, Turnstile, límites, SQLite, diseño y animaciones conservados. Resultado SMTP ambiguo bloquea reenvío idéntico durante 24 h y muestra aviso sin confirmar entrega; no cambia automáticamente a Resend. Plantilla Docker de la API incorpora instalación reproducible de su única dependencia; infraestructura raíz intacta.
- 22 pruebas API/MIME aprobadas con mocks y navegador 390/768/1440 px, incluido aviso de envío incierto. Configuración y límites actualizados en [guía](contact-form/README.md) y [QA](contact-form/QA.md). Sin credenciales reales, envíos, cambios DNS/MX, despliegues, commits ni push. Cambios preexistentes preservados.

# 2026-11-21 — FORM-027: API de contacto comercial

- Sustituido el transporte mailto del formulario por POST JSON sin recarga; campos, CSS y animaciones conservados. Añadido widget Turnstile, validación accesible, bloqueo de doble envío y estados que distinguen aceptación de entrega.
- API Docker independiente preparada con Node >=24 sin dependencias npm: HTTPS Resend, Reply-To del visitante, validación servidor de Turnstile/hostname/action, límites persistentes por IP y presupuestos globales, deduplicación SQLite e idempotencia Resend. Sin contenido personal en almacenamiento ni logs de solicitudes.
- Añadidos `.env.example`, exclusiones de secretos/estado, plantillas Docker de pruebas y NPM, y [guía de configuración](contact-form/README.md). Sin modificaciones propias a infraestructura existente; se preservan sus cambios recibidos y `docs/deployment/`.
- 13 pruebas API con mocks aprobadas; QA Chromium en 390/768/1440 px, revisión de capturas móvil/escritorio y comprobaciones de sintaxis/Compose/whitespace. Evidencias y límites en [QA](contact-form/QA.md). No hubo correos reales, construcción/arranque Docker, cambios DNS/MX, despliegue, commit ni push.

# 2026-11-20 — TOUCH-026: ondas interactivas móviles

- Extendidas las ondas cian/menta de CLICK-025 a taps en controles habilitados, con el mismo Canvas/RAF, duración de 640ms y límite de ocho. Sin estela táctil ni duplicación por click de compatibilidad.
- Pointer Events pasivos distinguen tap mediante recorrido máximo de 10px y duración de 500ms; scroll, cancelación, multitouch y contexto descartan el candidato. Acciones, foco, gestos y transición FIX-024 conservados; reduced-motion desactiva las ondas.
- CSS permite ondas móviles y sitúa el Canvas sobre WhatsApp sin recibir eventos; URLs afectadas versionadas. QA reproducible, capturas, métricas y límites en [TOUCH-026](qa/touch026/REPORT.md). Sin dependencias nuevas, infraestructura, despliegue, commit ni push; cambios recibidos preservados.

# 2026-11-20 — CLICK-025: completar interacción Coverflow

- Confirmados en el código recibido los clics laterales, enlace central en pestaña nueva, touch/swipe, bloqueo de solicitudes durante transición y reinicio manual del autoplay. Se reutilizan sin duplicarlos, conservando reloj sincronizado FIX-024 y cuatro logos oficiales.
- Añadida activación por Space sin scroll/repetición, con Enter nativo; semántica de botón en laterales y enlace en central. El filtro del clic posterior a swipe permite activaciones de teclado y se reinicia ante un nuevo pointerdown; corrige un clic de mouse perdido después de un swipe sin clic residual. Ondas y cursor preservados íntegramente.
- Recurso Coverflow versionado; pruebas responsive, destinos, teclado, touch, autoplay y límites en [informe](qa/fix024/COVERFLOW-CLICK-025.md). Sin infraestructura, dependencias nuevas, despliegue, commit ni push.

# 2026-11-20 — CLICK-025: Water Ripple de escritorio

- Añadidas ondas cian/menta de 640 ms en las coordenadas del clic primario real, con borde fino, segundo anillo tenue y límite de ocho ondas. Se reutilizan Canvas 2D, RAF y cleanup del cursor; sin bloquear controles ni cambiar sus estilos.
- Desactivadas en touch, teclado, clic derecho, eventos sintéticos y movimiento reducido. Recurso del cursor versionado; FIX-024 y cambios previos conservados.
- Validación, capturas y límites en [CLICK-025 junto a FIX-024](qa/fix024/CLICK-025.md). Sin dependencias nuevas, infraestructura, despliegue, commit ni push.

# 2026-11-20 — FIX-024: Coverflow sincronizado, WhatsApp y geometría ambiental

- Sustituida la secuencia 820 ms de espera + 800 ms de reconstrucción por un único reloj GSAP de 800 ms que dirige las pistas WAAPI de tarjetas y el progreso de ambas marcas Three.js. Matriz CSS 3D por tarjeta, texturas precalentadas, contención, bloqueo breve y pausa común; sin timelines GPU independientes.
- Retirados el observador y la regla que ocultaban WhatsApp junto a Experiencia/Contacto, conservando enlace, posición fija y tamaño; capa 101 sobre el contexto 100 del menú fullscreen. Desactivado el grupo ambiental de cajas/aristas/conexiones vinculado al scroll, conservando partículas, cursor, anillo y demás efectos.
- Pruebas, métricas, capturas, archivos y limitaciones en [QA FIX-024](qa/fix024/REPORT.md). Cambios preexistentes preservados; sin dependencias nuevas, infraestructura, deploy, commit ni push.

# UX-022 / CURSOR-023 — Coverflow y estela de escritorio

Cambio local del 2026-11-20; sin deploy, commit ni push.

- Carrusel de cuatro marcas con tres posiciones, previsualizaciones navegables, movimiento 3D circular, autoplay, controles, teclado y swipe. Navegación DOM disponible sin WebGL y con reduced-motion.
- Respiración de la imagen 1–1,008 / 5s, sin modificar dimensiones de placas. Se mantienen marcas originales y contención GPU de FIX-021, con reconstrucción sincronizada tras el desplazamiento.
- Se reemplaza el halo tenue y las funciones WebGL vacías por una estela Canvas 2D original de spline continua con profundidad visual, cian/azul, DPR limitado y RAF que se detiene en reposo. Cursor nativo, clics y scroll preservados; sin efecto en touch/reduced-motion.
- Alcance, pruebas reales, métricas, estado Git y límites en [informe QA](qa/ux022-cursor023/REPORT.md). Se preservan cambios preexistentes, FIX-019, SEO-020 e infraestructura.

# Historial de cambios

## 2026-11-20 — FIX-021: estabilidad y contención del carrusel
- Respiración localizada en la placa CSS: giro/escala/sombra durante transición y alto dependiente de la marca; contenedor exterior ya estable. Placa ahora fija por breakpoint, con 24px de margen para logos originales y controles de pausa con ancho constante.
- Fragmentación 3D preservada con envolvente proyectada de vértices y scissor GPU dentro de la placa. Retirados giro global de malla y energía CSS escrita por cuadro; layout por invalidación, texturas/shaders precalentados y sin draw de fragmentos en reposo. Renderer/RAF, GSAP, controles, enlaces y recursos existentes conservados.
- Chromium/SwiftShader en 360/390/430/768/1440: cuatro marcas, cuadros de transición, contención, placa estable y sin overflow. Dos vueltas de autoplay, teclado/swipe, pausa/reanudación/resize, foco/hover y tres fallbacks verificados; cero errores JavaScript en las ejecuciones finales. Métricas y límites en [informe FIX-021](qa/fix021/REPORT.md); SwiftShader no certifica fluidez Android. Sintaxis y whitespace comprobados.
- HTML y journey solo versionan recursos afectados; SEO-020 y otras secciones intactos. Cambios preexistentes preservados, sin infraestructura, dependencias, despliegue, commit ni push.

## 2026-11-20 — FIX-019 / SEO-020: marcas y vista previa social
- Placa blanca ajustada a cada marca y asset original nítido en reposo; se mantienen fragmentación 3D, controles y escenario UX-014. Recursos originales sin recolorear. El oscurecimiento reportado no se reprodujo en Chromium local; se corrige la dependencia de textura GPU en reposo y la placa fija.
- Imagen exclusiva iWave de 1200×630 con arte original y fuentes corporativas; Open Graph y Twitter únicos con URLs HTTPS absolutas.
- Evidencias, scripts y limitaciones en [informe FIX-019 / SEO-020](qa/fix019-seo020/REPORT.md). Sin infraestructura, despliegue, commit ni push; cambios previos preservados.

## 2026-11-19 — DEPLOY-017: HTTPS público de UX-014
- Construida `iwave-landing:ux014-prod` desde UX-014 (`940fd73`), sin cambios al código o recursos aprobados. Contexto Docker restringido y Nginx con revalidación de caché, cabeceras HTTP y bloqueo de rutas internas.
- Creado `iwave-prod` saludable, usuario sin privilegios, filesystem de solo lectura, healthcheck, logs limitados, red `iwave-web` y puerto exclusivo `127.0.0.1:8081`. `iwave-test` preservado.
- Diagnóstico inicial: sin proxy en el VPS, Cloudflare devolvía 525. Con autorización expresa se instaló `iwave-caddy` en 80/443 TCP, red `iwave-web`, sin privilegios ni socket Docker y con volúmenes persistentes de renovación.
- El usuario corrigió los A web desde una IP ajena a `37.59.109.88`, temporalmente DNS only. Let's Encrypt emitió certificados válidos para raíz y www; HTTPS público raíz responde 200, www redirige 301 al canónico, HTTP redirige a HTTPS. Recursos públicos idénticos al código aprobado y rutas internas bloqueadas. DNS de Zoho intacto.
- Tras confirmar el usuario Proxied y Full (strict), verificado el recorrido por Cloudflare: raíz 200, www 301, TLS público y de origen válidos, recursos UX-014 y tres matrices Chromium aprobadas sin errores de consola ni contenido mixto. Contenedores saludables y Zoho preservado. El modo del panel se basa en la confirmación del usuario; no hay acceso API para leerlo.
- Arquitectura, pruebas, certificados, operación, actualización y rollback documentados en [PRODUCTION.md](deployment/PRODUCTION.md). Sin nuevos commits ni push.

## 2026-11-19 — UX-014: experiencia corporativa continua
- Recorrido reorganizado: Inicio, Transformación/Impacto, Soluciones, Experiencia profesional, Capacidades, Proceso, Contacto y Footer. Fusionado Qué resolvemos en un desplegable, conservando funcionalidad y anclas `#informacion`/`#impacto`. Menú y siete hitos ScrollTrigger alineados.
- Contenedores y ritmo de espaciado ajustados en la capa activa; declaraciones antiguas conflictivas retiradas. Escena de contornos orbitales y conexiones reutilizada con el renderer existente, menor geometría en compacto y desvanecimiento junto al formulario. H1, holograma original y CTA preservados.
- Siete formas de transformación, incluyendo productividad y control; demostraciones de Soluciones autónomas sin cambiar la selección; capacidades con conexiones activas; ciclo con marcador luminoso y estados cian/menta. Cursor con estela corta, sin tubos ni RAF adicional.
- Showcase único oscuro con placa clara local, fragmentación/reconstrucción InstancedMesh/GLSL/GSAP, movimiento angular suave y reacción de fondo. Avance lento, controles y fallback conservados; swipe no abre accidentalmente el enlace. Contexto del fundador y límites de marcas documentados.
- Contacto con mensaje solicitado y mailto honesto. WhatsApp flotante se oculta junto a carrusel/contacto para despejar controles. Sin backend, librerías nuevas, infraestructura, staging, commits, push ni despliegues.
- Matrices Chromium 1440×900, 768×1024 y 390×844 y cinco alternativas accesibles verificadas; informe, capturas y límites en [UX-014](qa/ux014/REPORT.md). SwiftShader no acredita rendimiento físico. Cambios preexistentes preservados, copia de componentes afectados en `/tmp/iwave-ux014/before/`.

## 2026-11-18 — UX-011: cierre de validación local
- Retomada la validación interrumpida de la identidad Deep Space + Electric Cyan ya implementada sobre EXP-010; código y cambios previos preservados.
- Completadas las matrices Chromium de 1440×900, 768×1024 y 390×844, controles interactivos, navegación, formulario, overflow y errores. Aprobadas alternativas sin JS/WebGL, movimiento reducido, ahorro de datos y pérdida de contexto.
- Añadido [informe UX-011](qa/ux011/REPORT.md) con reproducción, contraste calculado, inspección visual parcial, evidencia y límites. Sintaxis y whitespace verificados. Medición SwiftShader lenta; fluidez física y otros navegadores pendientes.
- Archivos de esta continuación: informe, resultados/capturas de QA e historial. Sin cambios a código de aplicación, dependencias o infraestructura; sin despliegue, commit ni push.

## 2026-11-18 — EXP-009: mecanismos WebGL y metodología animada
- Implementados fragmentación/reconstrucción real de marcas con InstancedMesh y rotaciones GLSL; tubos de cursor originales con geometría dinámica; morphing Bézier entre cinco estructuras; toros, arcos y paquetes con shaders de energía; ciclo de metodología controlado por un timeline GSAP.
- Un renderer y RAF existentes, reloj/resize/entrada de puntero compartidos, viewports DOM con scissor, buffers reutilizados, pausa fuera de vista y liberación de recursos. Sin nuevas dependencias, Three incompatible ni código con licencia no comercial. Operación Conectada, muro de marcas, textos aprobados y controladores previos preservados.
- Contenido estático sin JS/WebGL y con movimiento reducido; controles de pausa, teclado y swipe. Contenido del Hero conservado; se contiene su barrido preexistente para corregir un overflow móvil intermitente que desalineaba canvas y scissor.
- QA principal Playwright/Chromium aprobada en 1440×900, 768×1024 y 390×844: ejecución y estados intermedios, avance automático, navegación, carga de texturas, consola/HTTP y fallbacks. Evidencia, reproducción y límites en [informe EXP-009](qa/exp009/REPORT.md).
- Fluidez de producción no acreditada: SwiftShader muestra pausas largas y faltan dispositivos físicos. BancoEstado conserva la marca matriz existente; pendientes arte específico de Corredores de Seguros y comprobantes de autorización de animación de marcas. Sin despliegue, commit, push, staging ni cambios de infraestructura.

## 2026-11-18 — EXP-007: transformación visual y trayectoria protagonista
- Antes/Después reemplazado por documentos dispersos que se ordenan, conexiones y dashboard conceptual. Tres momentos finitos, comparación y repetición accesibles; sin renderizador adicional, con resultado estático sin JS/WebGL y movimiento reducido.
- Carrusel tipográfico sustituido por muro de cuatro marcas locales y enlaces oficiales: MetLife, BancoEstado Corredores de Seguros, Banco de Chile y Scotiabank. Proporciones y colores preservados, microinteracciones y contexto de experiencia profesional del fundador. BancoEstado emplea logo matriz e identificación textual de la filial; procedencia documentada.
- Reducción de listas explicativas e introducciones redundantes; fondo y demostraciones anteriores conservados. Sin dependencias, infraestructura, commits, push ni despliegue.
- Chromium real responsive, comparaciones y teclado, logos, consola/HTTP, overflow, soluciones/capacidades/menú y alternativas accesibles. Capturas, resultados y límites en [informe EXP-007](qa/exp007/REPORT.md). Verificaciones estáticas de HTML/CSS/JS y whitespace. Cambios previos preservados y diff propio comparado con `/tmp/iwave-exp007`.

## Reconstrucción local existente — sin fecha atribuida
Estado observado en la rama `reconstruccion-iwave`, sin confirmar: cambios en `README.md`, `index.html`, `styles.css` y `script.js`. No se atribuye versión ni despliegue.

- Contenido centrado en productividad digital, servicios, impacto, proceso y contacto.
- Diseño oscuro con acentos cian; Hero con órbita decorativa.
- Transformación Antes/Después con nodos y conectores; disposición horizontal y vertical hasta 820px.
- Menú móvil progresivo, apariciones con IntersectionObserver y soporte para movimiento reducido.

Resumen del código observado, no certificación de validación visual ni de publicación.

## 2026-11-16 — Metodología y documentación persistente
- Creado `AGENTS.md` con identidad, flujo incremental, preservación de cambios y límites de seguridad.
- Creados `docs/PROJECT.md`, `docs/ARCHITECTURE.md` y `docs/DESIGN_SYSTEM.md` a partir del código actual y de las decisiones del encargo.
- Iniciado este historial sin inventar versiones ni fechas de la reconstrucción.
- Alcance exclusivamente documental: sin cambios a la landing, infraestructura, commits o despliegues.

## 2026-11-16 — UI-001: fondo tecnológico animado
- Añadida red Canvas 2D cian al fondo del Hero, con conexiones finas, profundidad y movimiento suave; sin cambios a textos ni enlaces.
- Densidad móvil reducida, máximo 30 fps y DPR 1.5; pausa en pestaña oculta y fuera de pantalla; composición estática con movimiento reducido.
- Actualizados mapa de arquitectura y sistema de diseño. Sin dependencias, infraestructura ni despliegues.


## 2026-11-16 — EXP-001: primera experiencia del viaje digital
- Hero asimétrico con logo original protagonista y contenido comercial conservado; nueva etapa de información dispersa, servicios con diagramas propios y Antes/Después con documentos e indicadores conceptuales.
- Retirada red UI-001; escena Three.js 0.170.0 local compartida, canales deterministas y composición progresiva por scroll. Motor separado de navegación, límites de resolución y cuadros, pausa en reposo/oculto, fallback CSS y liberación de recursos.
- Navegación contextual, scroll nativo y contenido independiente del 3D. Arquitectura y diseño actualizados; sin bundler, infraestructura, commits ni despliegues.
- Verificado: sintaxis JS, importación del módulo local r170 y geometría, casos aislados de movimiento reducido, ahorro de datos, WebGL desactivado y carga fallida. HTML: anidación, IDs, referencias ARIA, recursos locales y anclas; balance de llaves CSS y whitespace del diff.
- Pendiente: revisión en navegador de composición, responsive/desbordamientos, teclado, contraste, sin JS, contexto WebGL real y rendimiento. No hay navegador instalado en este entorno; las pruebas aisladas no certifican el comportamiento visual.

## 2026-11-16 — EXP-002: experiencia corporativa interactiva
- Conservada la reconstrucción preexistente en `reconstruccion-iwave`, con copia de los cuatro componentes afectados en `/tmp/iwave-exp002` para comparar este alcance. Sin commits, push, publicación ni cambios de infraestructura.
- Recorrido de cinco bloques; Antes/Después integrado en problemas, eliminación de mensajes redundantes de impacto/resultados, explorador de cuatro dificultades y servicios con gráficos diferenciados. Propuesta aprobada del Hero conservada.
- Logo original completo, más presencia y sin marcos/recortes; limitación del JPG documentada. Proceso con continuidad visual, contacto asimétrico y adaptación responsive.
- Escena compartida con cinco composiciones, transferencias por segmentos reales y cámara restringida a puntero preciso. Halo interpolado con CSS sin loop adicional, iluminación localizada y feedback táctil; cursor y scroll nativos preservados.
- Formulario accesible y módulo de transporte mailto separado, validación, errores y anuncio honesto del paso de envío. Sin datos almacenados ni logs; canales directos conservados.
- Verificado: sintaxis de los tres archivos JS, anidación HTML, cinco secciones, IDs, ARIA, anclas, etiquetas, recursos locales, balance de llaves CSS y whitespace. Prueba aislada de formulario: vacío, espacios, correo inválido, envío válido, codificación de caracteres y ausencia de confirmación falsa.
- Prueba aislada de escena: movimiento reducido, ahorro de datos, poca memoria, importación fallida y WebGL no disponible; geometrías con Three r170 real y renderer simulado en cinco posiciones, transforms finitos, reposo y liberación. No equivale a validación WebGL visual.
- Pendiente: navegador real desktop/tablet/móvil, teclado físico, responsive/overflow, contraste, puntero/táctil, animaciones y rendimiento WebGL, y apertura efectiva de aplicaciones de correo. No se encontró Chromium/Firefox; parser CSS no disponible (se verificó únicamente balance estructural). No se afirma validación visual.

## 2026-11-16 — UI-003: explorador interactivo de Soluciones
- Sustituida exclusivamente la sección Soluciones por cuatro experiencias con desafío empresarial, SVG conceptual, resultado y CTA WhatsApp contextual. Vistas móviles propias y navegación compacta; sin dependencias ni cambios al motor 3D.
- Pestañas accesibles, teclado, foco itinerante y enlaces funcionales sin JS. Animaciones de proceso finitas, repetición, pausa fuera de vista/oculto y movimiento reducido; reacción de puntero reutiliza el controlador existente.
- Verificado: sintaxis JS; HTML, IDs, ARIA, anclas, recursos locales y balance CSS; prueba con DOM simulado de selección, flechas/ciclo/Home/End/Enter/Espacio, estados ARIA, repetición, pausas, movimiento reducido y cuatro CTA. Comparación con copia previa confirma HTML intacto fuera de Soluciones.
- Limitación: sin navegador instalado ni herramienta de control visual disponible. No se certifican apariencia, overflow real, interacción física, contraste ni funcionamiento visual con WebGL desactivado. Diagramas independientes de WebGL por implementación. Sin commits, push ni despliegues.

## 2026-11-16 — UI-004: fondo y polish visual
- Corregida la fuente de baja definición del canvas: antialiasing móvil, DPR hasta 2 recalculado en resize y presupuesto de 8 MP; eliminada la degradación a .8×. Adaptación por cadencia 30→20 fps.
- Añadidas capas de iluminación CSS nativas, luz ambiental vinculada al progreso, oscilación discreta del sistema, ambientes por sección, separadores suaves y profundidad contenida de contacto. Sin texturas raster ni dependencias.
- Preservados contenido comercial, lógica, cambios preexistentes, fallback y movimiento reducido. Comparación de alcance contra copias en `/tmp/iwave-ui004`.
- Verificado: sintaxis del motor y script principal, whitespace, balance de llaves CSS y cálculo de resolución en tamaños desktop/móvil.
- Pendiente: validación visual real, nitidez percibida, contraste, overflow, errores de ejecución WebGL y rendimiento en desktop/móvil. No se encontró navegador instalado; las pruebas estáticas no certifican estos puntos. Sin commit, push ni despliegue.

## 2026-11-16 — UI-005: holograma corporativo del Hero
- Hero con marca original en SVG de transparencia filtrada, sin redibujar identidad; plataforma elíptica, anillos cian, proyección ascendente, luz y conexiones discretas CSS/SVG.
- Flotación suave y profundidad limitada; reutilización de puntero, respuesta táctil y pausa fuera de vista/oculto; versión estática con movimiento reducido y composición independiente de WebGL. Sin nuevos renderizadores ni dependencias.
- Cambios previos preservados mediante comparación con `/tmp/iwave-ui005`. Sin infraestructura, commits, push ni despliegues.
- Verificado: sintaxis de script principal y motor, whitespace, XML del SVG y coincidencia exacta del JPG incorporado, IDs/ARIA/recursos, balance CSS y preservación del HTML fuera de la visualización del Hero. Prueba aislada de pausa/reanudación por visibilidad, viewport, pagehide/pageshow y movimiento reducido.
- Limitaciones: referencia visual no adjunta en esta conversación y navegador no disponible; no se certifican nitidez percibida, transparencia renderizada, responsive/overflow, interacción física ni rendimiento real. El SVG conserva un raster original, no una marca vectorizada.

## 2026-11-17 — EXP-003: holograma, capacidades y experiencia empresarial
- Holograma con energía ascendente, shimmer, iluminación ambiental y trazas, conservando arte y pausas existentes. Antes/Después sustituido por escena HTML/SVG 2.5D vinculada al scroll nativo.
- Cinco capacidades interactivas con tecnologías y aplicaciones; carrusel empresarial con profundidad CSS, botones, teclado, swipe y dispersión/recomposición conceptual de partículas. Referencias tipográficas y contexto de experiencia del fundador; logotipos promocionales pendientes de aprobación.
- Archivos: `index.html`, `styles.css`, nuevo `img/experience/enterprise.js` y documentación relacionada. Copia inicial de componentes en `/tmp/iwave-exp003`; `script.js` intacto. Preservados cambios pendientes, sin infraestructura, commits, push ni despliegue.
- Verificado: sintaxis de script principal, módulo nuevo y motor existente; whitespace; estructura HTML, IDs/anclas/recursos y balance CSS. DOM simulado: selección/teclado de capacidades, carrusel botones/ciclo/teclado, swipe horizontal, gesto vertical preservado, movimiento reducido y progreso acotado.
- Pendiente: navegador real no disponible; no se certifican apariencia, overflow, contraste, nitidez, interacción física, errores de ejecución WebGL ni rendimiento. El efecto de marca no reconstruye contornos reales. MetLife (403) y referencia BancoEstado requieren comprobación manual de enlaces y condiciones de marca; no se descargaron logos.

## 2026-11-17 — QA-001: recuperación visual crítica
- Reproducidos en Chromium los dos triángulos negros y textos concatenados al combinar HTML EXP-003 con CSS anterior. Causa gráfica: relleno negro predeterminado de trazados SVG abiertos; causa de concatenación: ausencia de reglas de disposición de EXP-003. El origen concreto de la respuesta antigua en el navegador del usuario no se puede atribuir a caché o servidor con la evidencia local.
- Añadido relleno SVG explícito y URL versionada de CSS; Antes/Después ahora usa Grid, alturas intrínsecas, etiquetas separadas y contraste constante. Fuentes → integración/automatización → indicadores; conexiones y barras ligadas al recorrido existente.
- Reducida interferencia del canvas compartido sobre contenido, aislada visualmente la marca y ajustadas columnas del Hero. Arte y mensajes comerciales conservados. Sin modificar JavaScript, infraestructura, servicios externos ni dependencias del proyecto.
- Playwright/Chromium y bibliotecas de desarrollo locales; capturas reales de Hero, problemas, transformación/intermedios, Soluciones, Tecnologías, Experiencia, Proceso y formulario a 1440×900, 768×1024 y 390×844. Matriz final sin errores de consola/HTTP, overflow horizontal ni cruces entre nodos; pestañas, capacidades, carrusel, menú móvil y validación de formulario comprobados. Fallback visible sin WebGL, sin JS y con movimiento reducido.
- Sintaxis de cuatro JS, estructura HTML/IDs/anclas/ARIA/recursos, CSS computado y balance estructural, revisión de diff propio/preexistente y `git diff --check`. Informe, capturas y límites en `docs/qa/QA-001.md`.
- Pendiente comparación con referencia aprobada no adjunta, otros navegadores, dispositivos físicos/rendimiento y aplicaciones externas. Sin despliegue, commit, push ni staging.

## 2026-11-17 — EXP-006: núcleo Living Digital Ecosystem
- Motor Three r170 ampliado a siete hitos con ScrollTrigger, campo de partículas GLSL, TouchTexture de puntero y ambiente continuo. Estado de scroll/cursor/ambiente compuesto antes del render, alineación horizontal con DOM y respuesta a especialidades.
- GSAP/ScrollTrigger 3.14.2 servidos localmente; menú fullscreen progresivo con teclado/foco y animación coordinada. Sin bundler, física ni infraestructura.
- Conservados arte comercial, diagramas accesibles, capacidades, carrusel y contacto temporal. No se presenta como rediseño completo de estas experiencias.
- QA Chromium responsive, fallbacks y evidencia en [informe EXP-006](qa/exp006/REPORT.md). Se documentan fallos intermedios corregidos y aceptación artística/rendimiento físico pendientes. Sin despliegue, commit, push ni staging.

## 2026-11-18 — EXP-010: recorrido consultivo y refinamiento visual
- Orden de secciones ajustado al recorrido solicitado; impacto separado de problemas y situado después de soluciones. Mensaje aprobado del Hero y etiquetas actualizados, contacto ampliado a optimización, integración y monitoreo.
- Campo de partículas a todo el ancho en el renderizador existente; retirados bloques ambientales y cursor tubular. Halo DOM discreto, escaneo holográfico suave, mapa gráfico de problemas y ajustes de profundidad/espaciado.
- Trayectoria unificada en carrusel con índice textual y enlaces oficiales, incluida placa activa. Conservado contexto profesional del fundador. Capacidades existentes reubicadas después de trayectoria; ciclo de trabajo existente conservado y evaluación ampliada.
- Chromium en tres tamaños, orden/overflow/errores/carrusel y tres fallbacks verificados. Revisión visual parcial y límites en `qa/exp010/REPORT.md`. Sin dependencias nuevas, infraestructura, despliegue, commit ni push. Cambios previos preservados mediante copias en `/tmp/iwave-exp010`.
