# SEO-028 — metadatos y artefactos estáticos preparados

`index.html` incorpora únicamente en cabecera metadatos es-CL/OG/Twitter y JSON-LD Organization/WebSite/Service; body, módulos visuales y FORM-027 permanecen idénticos. Los iconos nuevos derivan del JPG oficial en `img/logo`; logo de Organization usa el JPG original público. `robots.txt`, `sitemap.xml` y `favicon.ico` se preparan en raíz. La imagen vigente aún no empaqueta esos archivos: `docs/seo028/static-publication.patch` contiene el ajuste mínimo revisable de entrega, sin aplicarlo a Dockerfile/Nginx/.dockerignore ni a producción. Cloudflare mantiene su robots gestionado. Evidencia y despliegue futuro en [SEO-028](seo028/README.md).

# FORM-027 — contacto mediante API (vigente)

El formulario de `index.html` conserva sus cinco campos y estilos; `img/experience/contact.js` envía JSON a `POST /api/contact`, carga la sitekey desde `GET /api/contact/config` e integra Turnstile sin recarga. El servicio independiente `contact-api/` usa Node >=24, Zoho SMTP mediante Nodemailer o Resend HTTPS seleccionable por entorno, validación Siteverify de hostname/action, Reply-To del visitante y SQLite persistente para límites/deduplicación. No depende del motor visual ni añade librerías al frontend. Las descripciones mailto inferiores son históricas y quedan sustituidas por esta entrada. Sin JS se muestran instrucciones para los canales directos; el envío API requiere JS y verificación.

Producción operativa: Internet → Cloudflare → iwave-npm (Proxy Host 1, SSL existente) → iwave-form027-web:80 para la landing y iwave-form027-api:3000 para `/api/contact` y `/api/contact/config`. Las dos ubicaciones efectivas son de prefijo y tienen prioridad sobre `/`; la ruta config usa el prefijo más largo. Los servicios FORM-027 están healthy en la red externa existente `iwave-web`, sin puertos publicados. El Compose productivo conserva un único tmpfs API mediante lista de string entre comillas. SQLite usa el volumen propio iwave-form027-prod_contact-state; solo almacena HMAC/contadores/estados, sin contenido del formulario. iwave-prod se conserva como respaldo e iwave-test permanece independiente. SSL, Cloudflare y MX de Zoho se mantienen.

Zoho exige TLS/certificado válido y From igual al usuario autenticado; no hay fallback automático. Las reservas SMTP inciertas bloquean reintentos idénticos 24 h incluso tras reinicio. El usuario confirmó Turnstile real, recepción y Reply-To, incluidas pruebas de recepción en producción. El cierre comprobó HTTPS, rutas, recursos y autenticación SMTP sin enviar correo ni cambiar servicios. `verify-smtp.mjs` valida solo el transporte mediante `readMailConfig`; la API exige la configuración completa. Nodemailer fijado por lockfile es la única dependencia de servidor. Operación, configuración efectiva y rollback en [FORM-027 producción](deployment/FORM-027.md); evidencia y límites en [QA](contact-form/QA.md).

# TOUCH-026 — ondas táctiles en el motor existente

`cursor.js` conserva un Canvas 2D, DPR máximo 1,5, ocho ondas de 640 ms y el RAF bajo demanda de CLICK-025. Pointer Events en captura pasiva validan un único toque primario sobre controles habilitados: recorrido máximo 10px y duración máxima 500ms. Se evalúa todo el recorrido, no solo sus extremos. Scroll, pointercancel, contextmenu y multitouch descartan el candidato. Se dibuja en pointerup desde las coordenadas iniciales; ningún listener cancela eventos ni ejecuta acciones del control. El click posterior de touch queda excluido por pointerType del handler exclusivo de mouse. No se añaden listeners touchstart/touchend ni bucles.

La estela exige mouse y puntero fino; touch nunca la siembra. El Canvas se crea de forma perezosa también para un tap válido y permanece transparente al terminar; su RAF se detiene al agotar ondas/estela. Movimiento reducido impide creación y animación. Se conserva limpieza por resize, blur, visibilidad, preferencias y pagehide; salida definitiva aborta listeners y elimina Canvas. CSS permite ondas en puntero grueso y usa capa 102 para verlas sobre WhatsApp (101), sin hit testing. Coverflow y reloj FIX-024 intactos. Evidencias y límites: [TOUCH-026](qa/touch026/REPORT.md). Estas reglas amplían las restricciones táctiles originales de CLICK-025/CURSOR-023 descritas debajo.

# CLICK-025 — interacción de tarjetas Coverflow

La inspección de `coverflow.js` confirmó navegación lateral por clic/tap, apertura central nativa en pestaña nueva, swipe, bloqueo durante transición, reloj FIX-024 y reinicio manual de autoplay a 7500ms ya existentes. Se completa Space mediante `keydown` sin repetición ni scroll; Enter conserva la activación nativa del enlace. Las tarjetas laterales anuncian rol `button` y la central `link`; la cuarta sigue inert. La supresión del clic posterior a swipe ignora activaciones de teclado (`detail === 0`) y se reinicia con cada nuevo pointerdown, incluido mouse; evita que un swipe sin clic residual consuma una interacción posterior. No se modifica la timeline, el scheduler, los cuatro assets ni el cursor/ondas. Evidencia y límites: [Coverflow CLICK-025](qa/fix024/COVERFLOW-CLICK-025.md).

# CLICK-025 — reacción al clic

`cursor.js` comparte el Canvas 2D y el RAF bajo demanda de CURSOR-023 con un máximo de ocho ondas de 640 ms. Escucha `click` en captura pasiva, únicamente eventos confiables de mouse primario con `detail > 0`; conserva eventos, cursor nativo y navegación. Centro fijo en `clientX/clientY`, expansión cúbica y dos bordes cian/menta sin nodos por clic. El reloj termina cuando no quedan estela ni ondas. Resize, blur, salida del puntero, preferencias, visibilidad y pagehide limpian ambos efectos; mismo AbortController. TOUCH-026 permite el mismo Canvas en taps válidos; reduced-motion sigue sin crearlo. FIX-024 y el motor WebGL permanecen intactos. Evidencia: [CLICK-025](qa/fix024/CLICK-025.md).

# FIX-024 — transición compartida y capas limpias

Prevalece sobre la secuencia de UX-022. `coverflow.js` controla una única timeline GSAP de 800 ms: busca el tiempo de cuatro pistas WAAPI pausadas y publica el mismo progreso mediante `coverflowchange` (`start`, `progress`, `complete`). No hay temporizador de llegada ni timeline GPU posterior. Bloqueo breve de nuevas solicitudes durante la transición; pausa, visibilidad y viewport suspenden el mismo reloj. Sin WebGL o texturas precalentadas, continúa la transición DOM sin esperar; movimiento reducido navega instantáneamente.

`exp009.js` conserva InstancedMesh, texturas y envolvente FIX-021. Dos marcas se fragmentan/reconstruyen con el progreso compartido; sus vértices se proyectan mediante la matriz CSS real de cada tarjeta y la perspectiva del escenario. Scissor del escenario y placa móvil, sin render de logos en reposo ni nuevo renderer/RAF. Finalización limpia uniformes, raster previo y atributos antes de restaurar los originales. La reconstrucción entrante termina al llegar al centro; la saliente se estabiliza en el lateral.

`journey.js` desactiva solamente el grupo ambiental de cajas, aristas, conexiones y pulsos que seguía el scroll; conserva el campo de partículas y las atmósferas. WhatsApp conserva su posición fija como hijo de body, z-index 101 sobre el contexto 100 del header/menú y canvas 12, enlace y tamaño; se retiran el observador y la regla que lo ocultaban junto al carrusel/contacto.

Evidencias y límites: [FIX-024](qa/fix024/REPORT.md). Trabajo local sin infraestructura ni publicación.

# UX-022 / CURSOR-023 — carrusel y cursor vigentes

- `coverflow.js`: controlador DOM independiente de WebGL para las cuatro marcas existentes. Cuatro tarjetas persistentes, tres posiciones visibles, perspectiva CSS y movimiento circular direccional. Un temporizador de autoplay de 7,5 segundos visibles; pausa manual, hover/foco, visibilidad e IntersectionObserver. Pausa/reanudación de transiciones CSS en curso mediante Web Animations API; el mismo estado suspende la reconstrucción GPU. Navegación anterior/siguiente, laterales, flechas y swipe horizontal; movimiento reducido mantiene los controles sin animación/autoplay.
- `exp009.js`: el evento `coverflowchange` sincroniza la marca central con la reconstrucción InstancedMesh/GSAP existente. Conserva envolvente de vértices y scissor de FIX-021; lee la placa central real después del desplazamiento. Mismo renderer/RAF GPU y recursos precalentados. El motor ya no controla el autoplay ni recibe eventos del cursor retirado.
- `cursor.js`: estela original con spline cuadrática continua en Canvas 2D y tres capas estrechas cian/azul que sugieren profundidad. Independiente de Three.js, WebGL y ScrollTrigger. Historial persistente de 32 posiciones; relajación exponencial con subpasos hasta 120 Hz, largo máximo de 200px, DPR máximo 1,5 y un RAF bajo demanda que termina tras 1,25 segundos de reposo. Coordenadas clientX/clientY sobre canvas fijo, pointer-events:none; cursor nativo conservado. Solo mouse con hover/puntero preciso; sin crear canvas por movimiento táctil o con reduced-motion (TOUCH-026 lo permite tras un tap válido); los cambios de preferencia en vivo limpian y detienen el bucle. Resize, blur, pointerleave, preferencias, visibilidad y pagehide limpian la estela; AbortController libera listeners al abandonar la página.
- `journey.js` comprueba el mismo contexto WebGL2 antes de entregarlo al renderer, evitando errores de inicialización en la alternativa sin WebGL. No añade contextos ni cambia la escena ambiental.
- `script.js`: conserva las respuestas de superficies preexistentes, retirando únicamente el círculo DOM anterior. `refinement.css` oculta el halo obsoleto y contiene el estilo del Coverflow/canvas.
- HTML comercial, metadatos SEO-020, assets oficiales e infraestructura preservados. URLs de recursos afectados versionadas. Evidencias y límites: [QA UX-022 / CURSOR-023](qa/ux022-cursor023/REPORT.md).

# FIX-021 — carrusel con placa estable

Sustituye únicamente las decisiones de tamaño/movimiento de la placa de FIX-019 y UX-014.

- `exp009.js`: misma fragmentación InstancedMesh y timeline GSAP única; envolvente conservadora de vértices que incluye rotación, dispersión y perspectiva. Ajuste uniforme de la marca al espacio útil de la placa, 24px de margen; scissor GPU a 8px del borde como resguardo independiente del overflow DOM. Sin giro continuo de la malla completa.
- Placa CSS fija por breakpoint (ancho máximo 680px, 84% del escenario; alto 200px, 170px en móvil), independiente de la marca activa. El asset estático y la textura comparten proyección y proporciones. El escenario mantiene sus alturas UX-014 y los recursos oficiales se conservan.
- Layout/proyección se invalidan por scroll, resize, ResizeObserver o cambio de marca; se eliminan lecturas y escrituras de dimensiones por cuadro en reposo. Shaders/texturas precalentados una vez; la escena de logos solo dibuja fragmentos durante transiciones. Un renderer, RAF y ciclo de liberación existentes, sin dependencias nuevas.
- Versionado de las URLs locales afectadas a `fix021`; HTML comercial y metadatos SEO-020 intactos. Verificación y límites: [FIX-021](qa/fix021/REPORT.md).

# FIX-019 / SEO-020 — marcas y vista previa social

- `exp009.js` conserva la fragmentación InstancedMesh y calcula el tamaño proyectado de cada marca para compartirlo con el DOM mediante `--logo-width`/`--logo-height`. En reposo muestra el asset original; durante la transición lo sustituye temporalmente por sus fragmentos. Un renderer y RAF existentes, mismos controles y enlaces.
- `refinement.css` proporciona una placa blanca local proporcional al logo, con 16px de resguardo. Sin filtros, mezcla ni reducción de opacidad sobre el arte estático. Los fallbacks conservan MetLife y el índice de cuatro enlaces.
- `index.html` declara una única serie Open Graph/Twitter con URLs HTTPS canónicas. Imagen local `img/social/iwave-og.jpg`, 1200×630, compuesta con el holograma original y fuentes corporativas. Fuente de composición y generador reproducible en `qa/fix019-seo020/social.html` y `social.cjs`.
- Validación focalizada: `node docs/qa/fix019-seo020/qa.cjs after ANCHO` (360, 390, 430, 768, 1440), `interactions.cjs` y `social.cjs`. Usan Playwright externo ya disponible y servidores locales temporales. Evidencia y límites en [informe](qa/fix019-seo020/REPORT.md). Sin publicación.

# UX-014 — recorrido corporativo continuo

Decisión vigente del 2026-11-19; sustituye el orden UX-011/EXP-010 descrito debajo.

- DOM y menú: Inicio → Transformación → Soluciones → Experiencia profesional → Capacidades → Cómo trabajamos → Contacto → Footer. Siete capítulos y pie. `#informacion` y `#impacto` son anclas compatibles dentro de Transformación; los controles de problemas sobreviven en un `details` accesible, sin sección duplicada.
- `journey.js`: siete anchors, ScrollTrigger y atmósferas alineadas; metodología vinculada al índice 5. Se reutiliza la geometría existente como constelación de contornos, con superficies sólidas ocultas: órbita, fragmentación, organización, hélice y red. Un renderer, un RAF, buffers y ciclo de vida existentes. Los viewports siguen usando scissor en `exp009.js`.
- `exp009.js`: fragmentos de marcas con InstancedMesh/ShaderMaterial y GSAP existentes; movimiento angular suave y reacción CSS de energía durante salida/reconstrucción. Avance tras 7.5 segundos visibles de reposo, pausa/teclado/swipe preservados. Siete formas (fragmentación + integración, automatización, BI, plataformas, productividad y control), sin buffers creados por frame.
- `script.js`: repetición cada 10 segundos de la demostración seleccionada, suspendida fuera de vista, página oculta o movimiento reducido. Halo existente con inercia CSS y estela corta, sin bucle adicional.
- `refinement.css`: reglas vigentes de composición modificadas en su lugar y declaraciones antiguas conflictivas retiradas. Superficies corporativas, contenedor de 1320px, placa clara localizada en escenario oscuro y enlaces textuales integrados; no segundo carrusel ni tarjetas de marcas.
- Formulario mailto y canales conservados. No hay backend ni confirmación de recepción. No hay dependencias nuevas, infraestructura ni publicación.

Validación reproducible: `node docs/qa/ux014/qa.cjs 1440` (también `768` y `390`) El verificador gestiona un servidor HTTP en el puerto `8771 + ancho`; las pruebas adicionales usan 9555/9655. Evidencias y límites en `qa/ux014/REPORT.md`. La copia previa de los archivos de aplicación afectados está en `/tmp/iwave-ux014/before/`; no sustituye al control de versiones.

---

# UX-011 — evolución visual sobre EXP-010

Esta entrada prevalece sobre los experimentos históricos afectados. Se confirmó EXP-010 en el código; se mantienen sus ocho secciones y este orden: inicio → informacion → servicios → transformacion → proceso → experiencia → capacidades → contacto. Menú alineado con los siete destinos posteriores al Hero; marca vuelve a Inicio. No se aplica el orden alternativo del encargo porque ya existe EXP-010.

- `styles.css`: tokens oficiales de marca y semánticos, alias compatibles, H1 cian/menta y CTA menta.
- `img/experience/refinement.css`: capa UX-011 de composición, superficies, tipografía, atmósferas, holograma, diagramas, controles, formulario, navegación, pie y cursor; respeta las reglas responsive/estructurales existentes.
- `journey.js`: conserva renderer, ciclo de vida, resolución y RAF. Sustituye solo el campo de partículas por tres capas deterministas con atributos de tamaño/semilla, shaders suaves y conexiones ocasionales persistentes. CSS y WebGL comparten tokens al inicio; ocho presets interpolados controlan brillo, actividad, matiz y posición/intensidad de luz. El ciclo de metodología modula la actividad en su hito. La geometría ambiental oculta previa sigue oculta y ya no se actualiza por cuadro.
- `exp009.js`: misma composición render-to-texture y viewports DOM para marcas/morph; energía actualizada a cian/azul y composición ambiental ajustada. Sin nuevo contexto ni RAF, sin cambios al arte empresarial.
- `script.js`: primera muestra del halo se posiciona sin barrer desde la esquina; continúa por eventos y transiciones CSS, con supresión sobre campos y según preferencias.
- `index.html`: menú ordenado y recursos modificados con consulta `ux011`; contenido comercial y secciones preservados. Logo y eslogan incorporado intactos.

Sin cambios a infraestructura, dependencias, backend, formulario mailto ni procesos de publicación. QA local en `docs/qa/ux011/qa.cjs` requiere Playwright/Chromium externos existentes y un servidor HTTP local. Resultados y límites en `docs/qa/ux011/REPORT.md`.

---

## EXP-010 — refinamiento del recorrido

Prevalece sobre las entradas históricas afectadas. Orden DOM: inicio → informacion → servicios → transformacion → proceso → experiencia → capacidades → contacto. El motor usa esos ocho hitos en orden creciente. El fondo reutiliza el renderizador y compositor existentes, con partículas distribuidas a todo el ancho; se oculta la geometría de bloques anterior. Se retiran completamente las mallas tubulares del cursor; `script.js` controla un halo DOM por eventos, sin RAF adicional. Se conserva el cursor nativo.

Trayectoria combina carrusel y un índice textual de enlaces oficiales en una sola composición. Las imágenes ocultas del índice suministran las cuatro texturas al motor y sus nombres accesibles se mantienen en los enlaces. La placa de marca activa también enlaza al sitio oficial. Sin WebGL/JS se muestra MetLife y los cuatro enlaces; la rotación y disolución requieren WebGL. BancoEstado continúa usando el logo matriz disponible.

`img/experience/refinement.css` ajusta composición, superficies, cursor y responsive. No hay dependencias nuevas ni cambios de infraestructura. Contacto mantiene mailto, sin backend ni confirmación de recepción.

# Arquitectura y mapa práctico

## EXP-009 — cinco mecanismos y composición WebGL compartida

- `img/experience/exp009.js` se importa desde `journey.js`. Reutiliza su único WebGLRenderer y RAF: renderiza el ambiente a un WebGLRenderTarget, lo compone con alfa moderada y dibuja escenas con viewport/scissor ligados al DOM. El canvas decorativo se sitúa sobre DOM con `pointer-events:none`; cada viewport se limpia antes de dibujar para preservar placas y legibilidad. No se añaden contextos WebGL.
- Carrusel `.logo-showcase` adicional al muro de enlaces permanente: cuatro texturas locales, InstancedMesh con celdas UV, atributos de posición/desplazamiento/rotación y matrices GLSL. GSAP controla salida/entrada. Flechas, teclado, swipe horizontal sin cancelar gestos verticales; pausa de avance automático por hover/foco. La marca matriz de BancoEstado sigue siendo el recurso disponible, identificada textualmente como Corredores de Seguros; no se acredita permiso de animación de las marcas.
- `.morph-system` amplía Operación Conectada sin sustituirla: 1.200 puntos en escritorio, 480 en compacto; cinco Float32Array (fragmentación, integración, flujo, indicadores, módulos), buffers source/target/current/swarm reutilizados y Bézier cuadrática CPU. Ruido/respiración GLSL, selección manual con suspensión automática de 12 segundos visibles, ciclo automático fuera de esa pausa.
- Energía en el mismo viewport: TorusGeometry con rotaciones independientes y ShaderMaterial de pulsos, cuatro QuadraticBezierCurve3 muestreadas una sola vez con TubeGeometry y paquetes que recorren las curvas. Núcleo reacciona con intensidad y escala. Se usa emisión aditiva contenida; no se incorpora UnrealBloomPass ni su coste de targets extra para conservar nitidez.
- Cursor original: CatmullRomCurve3 sobre historial de 36 Vector3, tres mallas tubulares circulares de BufferGeometry dinámica, 56 segmentos × 8 lados. Buffers e índices persistentes; sin recrear TubeGeometry por frame. Inercia, variación Z, disipación, mayor energía en CTA, pulso de clic y supresión sobre formularios; desactivado con puntero no preciso. No usa threejs-components.
- `lifecycle.js`: un único timeline GSAP repetitivo para progreso 0–100%, cuatro etapas seleccionables, pausa/reanudación, pausa manual de 12 segundos. Funciona sin WebGL; conserva las explicaciones originales. IntersectionObserver, visibilidad y reduced-motion controlan la ejecución.
- Resize, reloj y entrada global de puntero WebGL centralizados en `journey.js`; el controlador transmite los eventos a la estela. Escenas fuera de viewport no actualizan sus efectos. Liberación de targets, geometrías, materiales, texturas, timelines y listeners en la disposición del motor; bfcache conserva el contexto pausado. Movimiento reducido, saveData, memoria limitada, importación fallida o WebGL no disponible mantienen DOM y marcas estáticas.
- `exp009.css` contiene los nuevos estilos, sin reescribir el sistema previo. No se añadieron dependencias ni build. QA reproducible y evidencia en `docs/qa/exp009/`.

## EXP-007 — componentes vigentes de transformación y trayectoria

Esta entrada sustituye el diagrama de tres columnas, el progreso por scroll de transformación y el carrusel empresarial descritos en entradas históricas inferiores.

- `index.html`: `.transform-demo[data-transformation]`, seis documentos HTML, conexiones SVG con `fill="none"`, núcleo y dashboard ilustrativo. Controles Antes/Después y repetición; estado inicial HTML Después, disponible sin JS y sin WebGL.
- `img/experience/enterprise.js`: mejora progresiva de comparación, secuencia finita Dispersión → Conexión → Control una vez al entrar al viewport, cancelación fuera de vista o con página oculta y resultado estático con movimiento reducido. Solo temporizadores breves de secuencia; sin renderizador ni bucle permanente adicional. Conserva el explorador de capacidades; retira la lógica del carrusel sustituido.
- `.trust-wall`: cuatro enlaces siempre accesibles a sitios oficiales; recursos locales en `img/experience/brands/`. Grilla 4/2 columnas y reacción de hover/foco; no oculta marcas ni requiere JS.
- CSS/enterprise con consulta `exp007`. Sin cambios al motor, navegación, formulario, infraestructura ni dependencias.
- Evidencia y reproducción: `docs/qa/exp007/REPORT.md` y `qa.cjs` (Playwright externo al proyecto).

Landing estática en HTML5, CSS3 y JavaScript puro. Sin framework, bundler, gestor de paquetes ni suite de pruebas configurada. Three.js se sirve como módulo local versionado; no requiere construcción.

## Archivos y entradas
| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Metadatos, contenido, secciones, anclas, enlaces comerciales y carga de recursos. |
| `styles.css` | Tokens, base, componentes, animaciones, responsive y movimiento reducido. Cargado en el head. |
| `script.js` | Menú progresivo, apariciones y navegación contextual. Cargado al final del body, después del DOM. |
| `img/logo/iwave.jpg` | Logo del header. |
| `README.md` | Presentación y comandos locales; contiene también instrucciones de infraestructura que no autorizan su ejecución. |
| `Dockerfile`, `nginx.conf` | Infraestructura existente; fuera del alcance sin autorización expresa. |
| `AGENTS.md`, `docs/` | Reglas permanentes y conocimiento para cambios incrementales. |

Fuentes externas: Google Fonts (Plus Jakarta Sans y Space Grotesk); enlaces comerciales a WhatsApp y correo. Three.js 0.170.0 está vendorizado localmente (licencia MIT); no usa CDN en ejecución.

## Mapa de componentes base (consultar cambios EXP-001 al final)
Cada fila orienta la lectura al bloque HTML y sus selectores en CSS; revisar JS solo cuando la interacción lo requiera.

| Cambio | HTML / IDs | CSS principal | JS relacionado |
| --- | --- | --- | --- |
| Navegación / marca | `header.site-header`, `nav#main-menu`, `.menu-toggle` | `.nav-bar`, `.brand*`, `.site-nav`, `.menu-toggle`, `.is-enhanced`, `.is-open`, `body.menu-open` | `setMenu`, eventos y `mobileQuery` |
| Hero | `section#inicio`, `h1#hero-title` | `.hero-section`, `.hero-grid`, `.hero-copy`, `.hero-badge`, `.hero-text`, `.hero-actions`, `.signal-strip`, `.hero-orbit`, `.orbit-*`, `.text-gradient` | Apariciones para `[data-reveal]`; `.hero-network` usa Canvas 2D; órbita es CSS |
| Resultados | sección sin ID, `aria-label="Resultados iWave"` | `.outcome-section`, `.outcome-strip` | Aparición del contenedor |
| Servicios | `section#servicios` | `.services-grid`, `.service-card`, `.service-icon`, `.icon-automation`, `.icon-analytics`, `.icon-information`, `.icon-digital` | Apariciones |
| Transformación Antes/Después | `section#transformacion`, `h2#transformation-title` | `.transformation-*`, `.state-*`, `.flow-node`, `.node-symbol`, `.engine-core`, `.flow-connector`, `.connector-in`, `.connector-out`, `.flow-caption` | Apariciones; transferencia y nodos son CSS |
| Impacto | `section#impacto` | `.impact-grid`, `.impact-copy`, `.benefits-grid`, `.benefit-highlight`, `.benefit-number`, `.impact-card`, `.impact-icon` | Apariciones |
| Proceso | `section#proceso` | `.timeline`, `.timeline-step` | Apariciones |
| Contacto | `section#contacto` | `.contact-section`, `.contact-panel`, `.contact-copy`, `.contact-actions`, `.contact-data` | Aparición del panel |
| Pie / WhatsApp flotante | `footer.site-footer`, `a.whatsapp-float` | `.footer-content`, `.whatsapp-float`, `.whatsapp-icon` | Ninguno |
| Accesibilidad de salto | `.skip-link` → `main#contenido` | `.skip-link`, `:focus-visible`, márgenes de scroll | Ninguno |

Los IDs de la base anterior eran `main-menu`, `contenido`, `inicio`, `hero-title`, `servicios`, `transformacion`, `transformation-title`, `impacto`, `proceso` y `contacto`. Los títulos con ID sirven a `aria-labelledby`; `impacto` no figura en el menú.

## JavaScript y dependencias del DOM
- `menuToggle` y `siteNav` buscan `.menu-toggle` y `.site-nav`. El bloque solo se activa si ambos existen.
- `mobileQuery`: `matchMedia('(max-width: 760px)')`, coordinado con CSS.
- `setMenu(open, restoreFocus = false)`: sincroniza `aria-expanded`, etiqueta del botón, `.is-open`, bloqueo de scroll y devolución opcional del foco. Función local al bloque del menú.
- Eventos: clic del botón alterna; enlace cierra y enfoca el destino con `tabindex=-1`; Escape cierra y devuelve foco; clic exterior cierra; `focusout` comprueba el foco mediante `requestAnimationFrame`; cambio de breakpoint cierra. `.is-enhanced` habilita el menú colapsable solo tras instalar los eventos.
- `motionQuery`: `matchMedia('(prefers-reduced-motion: reduce)')`.
- `IntersectionObserver` se crea si está disponible y no se pide movimiento reducido; umbral `0.08`. Añade `.is-entering` a `[data-reveal]` una sola vez, retira la clase en `animationend` y deja de observar ese elemento. Si se activa movimiento reducido, desconecta el observador y elimina clases activas. No hay funciones exportadas ni módulos.
- Sin JS, contenido y enlaces siguen visibles. No introducir ocultamiento previo a la observación.

## Compartidos y animaciones
Reutilizar `.container`, `.section`, `.section-heading`, `.eyebrow`, `.cards-grid`, `.info-card`, `.button` y sus variantes. Iconos de servicios y de flujo se dibujan con CSS/pseudoelementos. Las clases modificadoras `impact-card-*` existen en HTML pero no tienen reglas individuales actuales.

CSS define `orbit`, `transfer-x`, `transfer-y`, `node-activate` y `reveal-in`; detalles en `DESIGN_SYSTEM.md`. Transformación cambia de horizontal a vertical hasta 820px; menú hasta 760px. Toda animación y transición se anula con movimiento reducido.

## Validación disponible y uso focalizado
- `node --check script.js`: sintaxis JavaScript; ejecutar si se toca JS. No valida interacción.
- `git diff --check`: errores de whitespace del diff versionado.
- `git diff -- <archivos>` y `git status --short --branch`: revisar alcance y preservar cambios previos. Los archivos nuevos requieren lectura directa o diff contra `/dev/null` hasta que estén versionados; no hacer staging sin autorización.
- `python3 -m http.server 8080`: servidor local opcional, abrir `http://localhost:8080` para revisión manual.
- Cambios visuales o de interacción: revisar en navegador escritorio, tablet y móvil, overflow, teclado, anclas, menú, sin JS y movimiento reducido según alcance. Informar si no se realizó.
- No hay comando de build de aplicación ni pruebas automatizadas configuradas. No ejecutar Docker ni despliegues como validación rutinaria.

Para texto o enlaces, tocar el bloque correspondiente en HTML; para apariencia, su bloque CSS y media queries pertinentes; para menú o apariciones, añadir solo el bloque JS relacionado. Para cambios de identidad o diseño permanente, actualizar también el documento afectado.

## UI-001 — Fondo del Hero
Implementación histórica retirada por EXP-001: `canvas.hero-network` era decorativo (`aria-hidden`, sin eventos de puntero) y queda detrás del contenido mediante el contexto aislado del Hero. El bloque final de `script.js` usa `drawNetwork`, `tick`, `syncNetwork` y `resizeNetwork`, con `motionQuery` compartido. Canvas 2D nativo, sin librerías; si no está disponible, el contenido permanece igual.

El bucle requestAnimationFrame dibuja como máximo a 30 fps; DPR limitado a 1.5. ResizeObserver adapta dimensiones y densidad (18 nodos hasta 760px, 38 sobre ese ancho), con fallback a resize. IntersectionObserver pausa fuera del Hero; visibilitychange pausa en pestaña oculta; movimiento reducido deja una red estática. Las pausas también detienen los anillos CSS del Hero mediante `.is-network-paused`. No afecta las otras secciones.


## EXP-001 — Escena y recorrido actuales
Esta sección sustituye las referencias anteriores a órbita, red Canvas 2D, servicios uniformes y animación de nodos.

- `index.html`: `.journey-scene` fija, decorativa y sin eventos; canvas `#journey-canvas` y fallback `.scene-fallback` CSS. Hero con `.hero-system` y logo original sin deformar. Sección nueva `#informacion`/`#friction-title` antes de resultados. Cuatro `.service-visual` diferenciados. Antes/Después añade documentos y vista de indicadores conceptuales, sin datos reales.
- `journey.js` comprueba el mismo contexto WebGL2 antes de entregarlo al renderer, evitando errores de inicialización en la alternativa sin WebGL. No añade contextos ni cambia la escena ambiental.
- `script.js`: conserva menú y apariciones, retira completamente el motor UI-001 y añade `aria-current=location` al observar las secciones de navegación.
- `img/experience/journey.js`: módulo independiente, importación dinámica de `vendor/three.module.min.js` (Three.js 0.170.0 / r170). Sin descarga de Three en movimiento reducido, ahorro de datos o memoria declarada de 2 GB o menos. La licencia está en `img/experience/vendor/LICENSE`.
- Un `WebGLRenderer`, una escena y un bucle RAF a máximo 30 fps. 24 bloques de información (12 en móvil al iniciar), aristas y cuatro transferencias sobre canales deterministas; sin partículas aleatorias, texturas, sombras ni postprocesado. Scroll interpola fuentes dispersas, canales y matriz organizada; cámara y puntero tienen desplazamiento acotado. Los hitos son `inicio`, `informacion`, `servicios`, `transformacion`, `contacto`.
- DPR máximo 1.5 en escritorio / 1 en móvil al iniciar; baja a .8 al acumular cuadros lentos. Pausa tras 4.2 segundos sin interacción, en pestaña oculta, fuera del main y durante pagehide con bfcache. ResizeObserver actualiza hitos ante cambios de layout.
- Movimiento reducido activado durante la sesión libera recursos y conserva el fallback hasta recargar. Error de importación, WebGL no disponible o pérdida de contexto mantienen el esquema CSS. Se liberan geometrías, materiales, renderer, observadores y listeners; bfcache pausa y reanuda sin duplicar el motor.
- Archivos bajo `img/experience/` para aprovechar el COPY existente de `img` en Docker. Sin modificar infraestructura ni añadir paso de build. Servir mediante HTTP; los módulos no se prueban con file://.
- Sin JS: enlaces, menú completo, contenido comercial, diagramas y fallback CSS permanecen disponibles; el canvas nunca contiene información exclusiva.

Validación adicional: `node --input-type=module --check < img/experience/journey.js`. La validación visual real en escritorio/tablet/móvil, contraste, teclado, overflow, WebGL y rendimiento sigue siendo necesaria; las comprobaciones estáticas no la sustituyen.

## EXP-002 — experiencia corporativa interactiva
Esta sección sustituye el mapa EXP-001 en los componentes indicados.

- Cinco secciones principales: `inicio`, `informacion`, `servicios`, `proceso`, `contacto`. `transformacion` permanece como ancla dentro de `informacion`. Se integró Antes/Después en problemas y se retiraron los bloques redundantes de resultados e impacto.
- `script.js`: menú y apariciones conservados; navegación contextual observa las cinco secciones. Explorador `[data-problem]` con cuatro botones y respuesta anunciada mediante `aria-live`. Sin JS los botones están deshabilitados y queda explicación estática.
- Halo `.pointer-halo` sin eventos y con interpolación CSS, solo para hover/puntero preciso y sin movimiento reducido. Iluminación y profundidad local mediante variables CSS en `[data-reactive]`. Se detiene al salir, ocultar página o cambiar preferencias. El renderizador WebGL mantiene el único loop de animación; el halo usa transiciones del navegador sin RAF adicional.
- `img/experience/journey.js`: conserva un renderer, límites y ciclo de vida EXP-001. Hitos ahora `inicio`, `informacion`, `servicios`, `proceso`, `contacto`, en orden DOM. Composiciones: circuito de identidad, dispersión, canales, matriz y columnas de indicadores. Transferencias siguen segmentos reales entre registros. Reacción de cámara restringida también por hover/puntero preciso.
- `img/experience/contact.js`: módulo comercial separado del renderizado y navegación. `buildContactMailto(values)` codifica asunto y cuerpo; `prepareContact(values)` concentra el transporte temporal para reemplazarlo por un endpoint sin cambiar el diseño. Validación de campos requeridos, espacios en blanco y correo, errores por campo, foco al primer error y estado anunciado. Sin almacenamiento ni logs. No borra el formulario ni confirma entrega. Límites de longitud reducen el tamaño del URI, cuya compatibilidad depende del cliente de correo.
- Sin JS o si el módulo de contacto falla: formulario HTML con validación nativa y acción mailto, además de enlaces directos de correo/WhatsApp. La construcción explícita de asunto/cuerpo requiere el módulo. No hay backend ni garantía de apertura o recepción.
- Verificar también `node --input-type=module --check < img/experience/contact.js`. Las pruebas aisladas no certifican WebGL, interacción física, responsive o entrega de correo.

## UI-003 — explorador de Soluciones
- Solo `#servicios`: `.solutions-explorer` con navegación y cuatro `.solution-panel`. `script.js` mejora enlaces a pestañas ARIA con selección exclusiva, foco itinerante, flechas, Home/End y Enter/Espacio; sin JS conserva los cuatro artículos y sus enlaces internos.
- Diagramas SVG inline diferenciados para escritorio y móvil, con descripciones accesibles y CTA WhatsApp específico por servicio. HTML/CSS independientes de WebGL, sin dependencias ni otro renderizador. No se modifica `journey.js`.
- Secuencias CSS finitas al entrar o seleccionar; botón para repetir. IntersectionObserver y visibilidad detienen las secuencias fuera de vista/pestaña oculta. `prefers-reduced-motion` conserva el estado estático y oculta repetición. El puntero reutiliza las variables del controlador `[data-reactive]`; no intercepta gestos táctiles.

## UI-004 — resolución y ambiente
- `journey.js`: antialiasing en desktop y móvil. DPR recalculado en resize: mínimo entre DPR nativo, 2 y presupuesto de 8 millones de píxeles (sin bajar de 1× por presupuesto). Sustituye los límites EXP-001 y la reducción a .8×; ante 45 cuadros lentos baja de 30 a 20 fps. Conserva pausas, fallback y liberación de recursos.
- Progreso interpolado publicado en `--scene-progress` para desplazar suavemente la luz CSS dentro del mismo bucle. Oscilación angular discreta durante las secuencias activas; continúa el reposo a los 4.2 segundos.
- `styles.css`: gradientes CSS a resolución nativa, iluminación por sección y separadores progresivos; sin recursos raster, dependencias ni cambios al contenido comercial.

## UI-005 — holograma del Hero
- `.hologram-stage` contiene marca, proyección, anillos elípticos y conexiones SVG decorativas. CSS independiente de WebGL, disponible sin JS y sin añadir renderizadores. Motor Three.js compartido intacto.
- `img/experience/iwave-hologram.svg` incorpora el JPG original sin redibujar, con encuadre `890 × 710` y filtro alfa sRGB para retirar tonos próximos al negro. Conserva el texto original; no es arte vectorial ni aumenta su resolución.
- Puntero reutiliza variables de `[data-reactive]`; touch usa `:active` sin interceptar gestos. Script principal pausa animaciones CSS fuera de vista, en pestaña oculta y pagehide; pageshow reanuda. Movimiento reducido desactiva animaciones y perspectiva. Sin otro RAF ni dependencia.

## EXP-003 — capacidades y experiencia
- `img/experience/enterprise.js` separa interacción de contenido y navegación. `#capacidades` mejora cinco enlaces en selector con flechas/Home/End; sin JS conserva todos los artículos. `#experiencia` mejora tres referencias tipográficas en carrusel CSS 3D: botones, teclado y swipe horizontal, sin autoplay ni cancelación del scroll vertical; solo el enlace central recibe foco. Controles y marcas son objetivos separados.
- Antes/Después sustituye los paneles repetidos por `.operation-theatre`: HTML/SVG 2.5D, progreso CSS `--connect` calculado mediante RAF solicitado por scroll/resize, acotado y observado; sin bucle continuo adicional. Sin JS o con movimiento reducido muestra operación conectada estática.
- Holograma conserva arte, renderizador compartido y controlador de pausa UI-005; añade 18 fragmentos CSS (10 en móvil), shimmer, trazas y respiración ambiental. Ninguna dependencia ni otro contexto WebGL.
- Carrusel usa 32 puntos CSS durante 720 ms y fundido nítido de texto; efecto conceptual de dispersión/recomposición, no muestreo del contorno de marcas. Sin movimiento reducido ni actividad fuera de pantalla. No se incorporan logotipos empresariales: autorización promocional pendiente. Banco de Chile accesible en consulta web; MetLife respondió 403 y referencia BancoEstado no accesible, pendientes de comprobación manual.
- Sintaxis: `node --input-type=module --check < img/experience/enterprise.js`. Cambios conservan fallback independiente de WebGL y no modifican `journey.js`, contacto ni infraestructura.

## QA-001 — recuperación visual verificada
- Antes/Después conserva el controlador de scroll de `enterprise.js`, pero sus nodos ahora usan Grid y altura intrínseca, sin coordenadas absolutas ni perspectivas que puedan cruzar las tarjetas. Solo el SVG decorativo se posiciona absolutamente; en tablet/móvil sus conexiones siguen un eje vertical.
- `fill="none"` se declara en el SVG y en cada trazado, independientemente del CSS. `styles.css?v=qa001` solicita una URL nueva para evitar reutilizar la hoja anterior a EXP-003; no cambia políticas del servidor.
- El contenido del diagrama mantiene contraste constante; progreso de conexiones y barras depende de `--connect`. Sin JS y en movimiento reducido se conserva el estado conectado.
- Evidencia de navegador local y límites: [QA-001](qa/QA-001.md). No implica despliegue.

## EXP-006 — núcleo inmersivo
- Conserva Three r170 y la arquitectura estática sin build. GSAP/ScrollTrigger 3.14.2 vendorizados en `img/experience/vendor`, con aviso de licencia en cabecera; condiciones en https://gsap.com/standard-license. No son dependencias MIT ni se modifica la licencia de Three.
- `journey.js` concentra escena, cámara, puntero, efectos, rendimiento y ciclo de vida. Siete hitos DOM: inicio, información, transformación, servicios, capacidades, experiencia y contacto. ScrollTrigger publica un estado numérico; el render interpola ese estado y suma ambiente y cursor. GSAP no escribe transforms de objetos Three.
- Geometrías reutilizadas, 360/960 partículas en un BufferGeometry y ShaderMaterial. Vertex shader aplica circulación, ascenso y desplazamiento desde CanvasTexture 128²; fragment shader dibuja puntos suaves aditivos. No hay compositor ni segundo renderer.
- TouchTexture acumula pulsos de intensidad según desplazamiento de puntero, con decaimiento por cuadro. Touch responde únicamente a pointerdown pasivo. Solo se deforma el campo de partículas; cámara interpolada y logotipo original intacto.
- Alineación horizontal con centro real de `.hero-system` calculada al resize/ResizeObserver. Sin lecturas de layout por cuadro. Selección de soluciones/capacidades cambia color de conexiones y fase del campo.
- Ambientación continua sustituye reposo de 4.2 s; permanecen pausa por visibilidad/main, bfcache, DPR limitado, cadencia adaptativa 30→20 fps y liberación de textura, geometrías, materiales y triggers. No se afirma objetivo de 60 fps.
- Menú fullscreen progresivo en todos los tamaños; GSAP anima enlaces, foco inicial, circuito de Tab con botón de cierre, Escape y retorno de foco. Desactiva backdrop-filter del header al abrir para evitar containing block que recorte navegación fija.
- Diagramas comerciales, carrusel y transporte mailto conservan implementación independiente anterior. Sin Rapier, Lenis, postprocesamiento, bundler ni modificaciones de infraestructura.
