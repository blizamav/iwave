# SEO-028 — marca de navegador y buscadores

Favicons ICO/PNG y Apple Touch Icon son derivados mecánicos del emblema de `img/logo/iwave.jpg`, sin redibujado ni recoloración, sobre Midnight #050B14. El logo completo de Organization sigue siendo el JPG oficial. No se sustituyen imágenes de la landing ni OG, no se cambian tokens, CSS, tipografías, dimensiones o animaciones; comparación de página completa idéntica en tres tamaños. Coordenadas y generación reproducible en [SEO-028](seo028/README.md).

# FIX-024 — sincronización y limpieza visual

El Coverflow conserva dimensiones, posiciones, perspectiva, tarjetas y respiración de UX-022. Movimiento y fragmentación comparten 800 ms; ambas marcas se estabilizan al terminar. Se conserva el anillo CSS del escenario. Se desactiva el grupo WebGL ambiental de contornos de cajas y conexiones que cruzaba las marcas; partículas e iluminación permanecen. WhatsApp permanece visible durante todo el recorrido con su capa y tamaño existentes.

# UX-022 / CURSOR-023 — presentación vigente de marcas y cursor

Sustituye únicamente la composición de carrusel y cursor de las entradas históricas. Escenario de altura estable; placa central de hasta 480px / 52% en escritorio, 62% en tablet y 72% en móvil, con alto 200px o 170px hasta 540px. Anterior y siguiente se muestran como placas reales con perspectiva, escala .78 y opacidad .72; en móvil las previsualizaciones son parciales. Cuarta tarjeta oculta e inert. Las laterales tienen semántica de botón y centran la marca anterior/siguiente; la central conserva semántica de enlace y abre su sitio oficial en pestaña nueva. Enter y Space activan las tres posiciones sin scroll por Space; las tarjetas conservan aspecto, perspectiva y dimensiones. Mantiene el anillo discreto y el halo ambiental del escenario.

La marca central conserva opacidad 1 y los assets oficiales sin filtros. Logos con object-fit:contain y 24px de resguardo; respiración exclusiva de la imagen, escala 1–1,008 / 5 segundos, suspendida durante desplazamiento, reconstrucción, pausa y fuera de vista. Las placas no animan dimensiones. Fragmentación/reconstrucción GPU con la contención de FIX-021, coordinada durante el movimiento de las placas (FIX-024).

Cursor nativo más estela estrecha Electric Cyan / Royal Blue, curva continua con capas de profundidad visual, sin círculos ni puntos independientes durante el movimiento. CLICK-025 y TOUCH-026 muestran en clic real de mouse o tap válido sobre un control dos ondas circulares concéntricas: borde principal de 1px y secundario de 0,65px al 25% de intensidad, gradiente Electric Cyan `#35D6FF` → Digital Mint `#67E8C8`, radio de 3 a 39px y desaparición en 640ms. Expansión cúbica suave, sin alterar estilos de controles. Capa fija a z-index 102 sin interacción, sobre WhatsApp (101); desaparece progresivamente en reposo. La estela se suprime en touch y puntero no preciso; las ondas táctiles nacen en el punto presionado al confirmar el tap (hasta 10px y 500ms), sin cursor artificial. Movimiento reducido suprime ambos efectos. Canvas 2D también sirve como alternativa sin WebGL; no añade contexto GPU.

# FIX-019 / SEO-020 — ajustes de legibilidad

Prevalece sobre la placa fija UX-014: cada marca utiliza blanco puro, tamaño ajustado a sus proporciones y 16px de margen local. El escenario oscuro, órbita, luz cian y fragmentación se conservan. En reposo se presenta el asset original sin filtros, mezcla ni transparencia; la geometría aparece durante la reconstrucción. No se recolorean assets.

La composición social exclusiva de iWave usa Midnight, iluminación Electric Cyan, Space Grotesk y Plus Jakarta Sans, con el logo original del Hero completo y el mensaje aprobado. Archivo JPG de 1200×630; no incluye marcas de terceros.

# UX-014 — ecosistema corporativo continuo

Esta identidad prevalece sobre las paletas, tamaños y efectos de los experimentos históricos inferiores. Aplica el recorrido UX-014 documentado en ARCHITECTURE.md. Fuente ejecutable: `styles.css`, la capa final UX-014 de `img/experience/refinement.css` y `journey.js`.

## Paleta y semántica

| Color | Valor | Token de marca | Función |
| --- | --- | --- | --- |
| Midnight | `#050B14` | `--iwave-midnight` | Fondo principal y campos |
| Deep Navy | `#0B1C2B` | `--iwave-deep-navy` | Superficies y profundidad |
| Electric Cyan | `#35D6FF` | `--iwave-electric-cyan` | Energía, foco, diagramas y selección |
| Digital Mint | `#67E8C8` | `--iwave-digital-mint` | CTA principales y estados positivos |
| Royal Blue | `#246BFD` | `--iwave-royal-blue` | Profundidad, redes y ambiente |
| Ice White | `#F3F8FF` | `--iwave-ice-white` | Títulos y contenido principal |

Tokens semánticos: `--bg-primary`, `--bg-surface`, `--bg-elevated` (`#10283B`), `--text-primary`, `--text-secondary` (`#B0C3D6`), `--text-tertiary` (`#8EA8BF`), `--accent-primary`, `--accent-action`, `--accent-depth`, `--border-subtle` (`#35D6FF26`), `--border-strong` (`#35D6FF66`), `--state-positive`, `--state-error` (`#FFB6AC`). Los alias `--bg`, `--panel`, `--text`, `--muted`, `--cyan`, `--mint` y `--line` mantienen compatibilidad con componentes anteriores. No recolorear los logotipos ni sustituir colores de advertencia por colores de energía.

Gradiente tipográfico cian → menta exclusivo del concepto «productividad digital» del H1 aprobado. CTA principal menta sólida con texto Midnight; secundario Deep Navy y borde cian. Energía y trazos cian/azul, menta reservada a acciones o estados positivos.

## Composición y superficies

Paneles con `--radius-panel:12px`, controles con `--radius-control:6px`; `--shadow-panel` aporta profundidad y un borde interior tenue. Soluciones mantiene navegación editorial y diagrama; transformación utiliza escenario contenido; trayectoria conserva placa clara para respetar los colores de marcas; capacidades combina mapa y panel; metodología utiliza línea abierta y etapas; contacto presenta una superficie serena. Evitar convertir cada bloque en una tarjeta equivalente.

Espaciado de secciones adaptable entre 3.5 y 6rem en escritorio, 4rem en tablet y 3.25rem en móvil. Se conserva el ancho máximo de 1320px y los contenedores existentes. No hay scroll capturado ni secciones fijadas.

## Tipografía y legibilidad

Space Grotesk en títulos y Plus Jakarta Sans en cuerpo, con sus fallbacks existentes. Ice White en títulos; texto descriptivo de 1rem y line-height 1.85; texto secundario `#B0C3D6`. H1 de 2.8–4.6rem en escritorio, ajuste móvil de 2.55–3.25rem; H2 de 2–3.25rem. Etiquetas y controles habituales de 0.875rem, algunas etiquetas secundarias de 0.75–0.8125rem en móvil. Los microtextos de los diagramas ilustrativos conservan su composición y no sustituyen la explicación comercial en HTML. Párrafos sin brillo ni gradiente.

## Universo de datos y atmósferas

Un único renderer Three r170 y RAF centralizado. Fondo de 660 partículas en escritorio y 270 en compacto, distribuidas determinísticamente en tres capas Z; puntos de 1.75–7.5px CSS según tamaño y perspectiva, multiplicados por DPR. Fragment shader gaussiano con núcleo y borde transparente: sin cuadrados opacos, texturas de imagen ni bloom. Órbitas locales, ascenso oscilante y cámara de amplitud mínima dan movimiento continuo aun sin puntero. Conexiones locales escasas, con aparición/desaparición gradual y buffers persistentes. Sin menta en el fondo.

Atmósferas interpoladas con smoothstep entre los siete capítulos DOM de UX-014:

| Sección | Ambiente |
| --- | --- |
| Inicio | Oscuridad, profundidad azul y foco alrededor de la marca |
| Soluciones | Actividad contenida, diagramas protagonistas |
| Impacto / Transformación | Mayor brillo y actividad de conexiones |
| Cómo trabajamos | Flujo cian/azul; energía modulada por el progreso del ciclo existente |
| Trayectoria | Casi negro, menor presencia de partículas y logos protagonistas |
| Capacidades | Mayor matiz Royal Blue y red de datos |
| Contacto | Movimiento y brillo mínimos, campos de alto contraste |

`journey.js` lee los tokens cian/azul desde CSS al iniciar. Publica `--space-glow`, `--space-x` y `--space-y` en `.journey-scene` para interpolar el ambiente CSS; `data-atmosphere` identifica el hito más próximo para inspección. Las luces locales de secciones se desvanecen dentro de sus límites y complementan la atmósfera continua.

El escenario de marcas es oscuro con placa clara local de tamaño proporcionado; no una superficie blanca a todo el ancho. FIX-021 mantiene la placa inmóvil y con dimensiones comunes a las cuatro marcas: 84% del escenario hasta 680px de ancho, 200px de alto (170px hasta 540px). El logo dispone de 24px de resguardo interior y conserva colores/proporciones; la fragmentación 3D permanece dentro de la placa mediante envolvente proyectada y scissor GPU. La iluminación ambiental es estática y suave. Los cuatro enlaces textuales forman un índice discreto sin tarjetas duplicadas. Metodología añade un punto luminoso de progreso y estados cian/menta. Transformación conserva la comparación documental y amplía el morph con productividad y control operativo. Soluciones repite autónomamente cada diagrama sin cambiar la selección.

## Holograma y microinteracciones

Arte original de `iwave-hologram.svg` intacto, incluyendo eslogan incorporado y filtro de transparencia previo. No es vectorización ni aumenta la resolución del JPG. Plataforma elíptica cian con profundidad azul, arcos finos, respiración, escaneo tenue y partículas ascendentes/microdestellos. Pausa por visibilidad y fuera del Hero reutiliza el controlador existente.

`--motion-ui:220ms`; hover con desplazamiento máximo de 2px e iluminación local discreta, foco exterior cian de 2px/5px. Halo de puntero de 22px, estela corta translúcida, borde tenue e inercia CSS de 140ms, sin tubos, sin otro RAF y sin sustituir el cursor nativo. Primera muestra posicionada directamente; oculto sobre campos, al salir, con blur/página oculta, movimiento reducido, hover no disponible y puntero grueso.

## Responsive, accesibilidad y rendimiento

Hero se apila hasta 820px; controles y redes simplificados en móvil (sin constelación de contornos sobre la lectura), ocho partículas holográficas visibles hasta 540px. Controles principales de al menos 44px. Menú ordenado según DOM de UX-014; contenido, diagramas y enlaces disponibles sin WebGL. Movimiento reducido conserva composición estática; ahorro de datos y memoria declarada de 2GB o menos evitan iniciar Three. No se añaden librerías ni peticiones de assets nuevos. El acceso flotante de WhatsApp se oculta mientras el carrusel o el contacto están en pantalla para despejar controles; los canales directos permanecen disponibles.

DPR hasta 2 con presupuesto de 8MP; render a máximo 30fps con adaptación a 20fps al detectar cuadros lentos. La cantidad inicial de partículas depende del ancho al cargar; el resize adapta proyección/DPR sin reconstruir buffers. Pausas por visibilidad/main, bfcache y liberación ante salida, movimiento reducido o pérdida de contexto. Geometrías, materiales, texturas, targets, listeners y triggers se liberan mediante los controladores existentes. Buffers de conexiones no se regeneran por cuadro; constelación de contornos reutilizada desde la geometría existente, sin superficies sólidas.

La validación reproducible, contraste medido, capturas y límites de rendimiento se registran en `qa/ux014/REPORT.md`. No inferir fluidez de dispositivos reales a partir de SwiftShader.

---

## Referencias históricas

## EXP-010 — profundidad contenida

Prevalece sobre decisiones históricas afectadas: fondo de partículas de profundidad a todo el ancho, cursor DOM de 28px sin tubos, escaneo suave sobre el holograma existente y trayecto consultivo con impacto después de soluciones. Trayectoria pasa a una sola placa de marca con transición de fragmentos acotada y un índice textual integrado, sin segundo muro de logos. Espaciado vertical adaptable, encabezados secundarios ampliados y foco reforzado del formulario. Movimiento reducido conserva composición estática y puntero nativo. El arte original del logo conserva su definición y texto incorporado.

# Sistema de diseño

## EXP-009 — movimiento con una función por sección

- Trayectoria: carrusel de piezas 3D sobre placa clara, marcas completas y proporcionales entre transiciones; muro y contexto del fundador conservados.
- Transformación: escenario oscuro adicional con cinco estructuras reconocibles, anillos de integración y paquetes de energía en arcos. El diagrama de Operación Conectada se conserva íntegro.
- Interacción: tres tubos de cian eléctrico, azul y blanco azulado; inercia y desaparición, cursor nativo y scroll intactos. Sin estela permanente en táctil, sin luz sobre campos del formulario.
- Metodología: barra continua luminosa, porcentaje, etapas activas y completadas; explicaciones aprobadas siempre legibles y botón para pausar/reanudar. Disposición vertical previa preservada en móvil.
- Compacto: menos partículas y fragmentos, cámara que encuadra sin estirar, controles de al menos 44px. Reduced-motion conserva referencias estáticas y permite leer/seleccionar etapas sin animación.
- Bloom resuelto con shaders y mezcla aditiva moderada, sin postprocesado borroso. No se incorporan librerías ni código bajo licencia no comercial.

## EXP-007 — demostración de transformación y muro de trayectoria

- Los mismos seis documentos cambian de posiciones dispersas a fuentes alineadas. Cuadrículas de planilla, estados de duplicidad, canales, núcleo de integración y centro de control sustituyen explicaciones y listas del diagrama anterior. Tres momentos finitos, comparación directa y repetición; scroll nativo sin fijación ni captura de gestos.
- Dashboard y datos explícitamente conceptuales; no presenta cifras de rendimiento comercial. Versión estática completa sin JS, WebGL o con movimiento reducido. Composición horizontal en escritorio/tablet y vertical hasta 700px.
- Trayectoria como muro de cuatro marcas visibles: logos originales en placas claras con `object-fit:contain`, color y proporciones preservados, enlaces oficiales, aparición existente y microinteracción de borde/flecha con foco o hover. Aclaración de experiencia profesional del fundador; BancoEstado matriz identificado como Corredores de Seguros mediante texto separado.
- Introducciones de Soluciones y Capacidades abreviadas para priorizar las demostraciones existentes. Fondo inmersivo preexistente conservado; sin nuevas partículas, filtros costosos ni dependencias.

Las tablas base describen la reconstrucción previa; las decisiones EXP-001 al final sustituyen las reglas afectadas.

Fuente de verdad: `styles.css` y carga de fuentes en `index.html`. No existe una escala de espaciado tokenizada; los siguientes valores describen el código, no una escala nueva.

## Tokens de `:root`
| Variable | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#050c15` | Fondo |
| `--panel` | `#0b1623` | Panel de menú / botón |
| `--text` | `#f4f8ff` | Texto principal |
| `--muted` | `#a5b6c9` | Texto secundario |
| `--cyan` | `#79d7ff` | Acentos y foco |
| `--mint` | `#77edce` | Acento complementario |
| `--line` | `rgba(121, 215, 255, .16)` | Bordes |
| `--radius` | `20px` | Tarjetas y paneles |
| `--container` | `1240px` | Ancho máximo |

`color-scheme: dark`. Colores adicionales existentes: botones secundarios `#0b1825` / hover `#122436`; tarjetas hover `#102132`; panel Antes `#0a1522`; nodos `#0d1a29`; núcleo `#0d1f30`; contacto `#0b1724`; WhatsApp `#85edc9` con texto `#06251b`.

## Tipografía y tamaños
Google Fonts: Plus Jakarta Sans 400/500/600/700/800 para cuerpo; Space Grotesk 400/500/700 para títulos y marca; fallback `sans-serif`.

| Elemento | Tamaño y ajustes |
| --- | --- |
| Cuerpo | line-height `1.6` |
| H1 hero | `clamp(2.6rem, 4.8vw, 4.5rem)`, peso 500, línea 1.08, tracking `-.045em` |
| H2 | `clamp(2rem, 3.6vw, 3rem)`, peso 500, línea 1.15, tracking `-.035em` |
| H3 | `1.16rem`, línea 1.35 |
| Texto hero | `1rem`, línea 1.85; móvil pequeño `.9rem` |
| Texto tarjetas / proceso | `.85rem`, línea 1.8 |
| Botones / menú | `.84rem` / `.83rem` |
| Eyebrow | `.67rem`, peso 700, tracking `.17em`, mayúsculas |
| Marca | `1.5rem`, peso 700, línea 1.2 |

H1 hasta 820px: `clamp(2.6rem, 6.5vw, 4rem)`; hasta 540px: `clamp(2.35rem, 9.5vw, 3.25rem)`. Microtextos decorativos llegan a `.42rem` en la etiqueta orbital de tablet; no usar esa medida como base para información comercial nueva.

## Dimensiones, espaciado y reutilización
- `.container`: `min(calc(100% - 3rem), 1240px)`; hasta 540px ancho `calc(100% - 2rem)`.
- `.section`: padding vertical `4.5rem`, hasta 760px `3rem`. Hero: `clamp(3.5rem, 7vw, 6.5rem) 0 3rem`; hasta 760px `3rem 0 2rem`.
- `.section-heading`: ancho máximo `780px`, margen inferior `2.5rem`; párrafo final máximo `680px`.
- Grillas compartidas: gap `1rem`; hero gap `3rem` (tablet `2rem`); impacto `2rem` (tablet `1.5rem`).
- `.info-card`, `.benefit-highlight`, `.timeline-step`: padding `1.6rem`, radio `20px`, borde `1px`; hasta 540px padding `1.4rem`.
- `.button`: mínimo alto `48px`, padding `.8rem 1.2rem`, radio `10px`, gap `1.2rem`. Variantes primaria y secundaria; hover desplaza `-2px`.
- `.menu-toggle`: `44px` por `44px`. Header sticky, altura mínima de barra `5rem`.
- Contacto: padding `3rem`, radio `24px`; hasta 820px padding `2rem`; hasta 540px `1.5rem`.
- Otras medidas recurrentes reales: `.5rem`, `.65rem`, `.75rem`, `.8rem`, `1rem`, `1.2rem`, `1.5rem`, `1.6rem`, `1.7rem`, `1.8rem`, `2rem`, `3rem`. No hay variables para estos espacios.

## Gradientes, luz y movimiento
- Fondo: radial `#102b413b` hacia transparente sobre `--bg`.
- Texto destacado: gradiente 110° `#a6edff`, `#79d7ff 48%`, `#77edce`.
- Botón primario: gradiente 115° `#8de3ff` → `#77edce`, texto `#061923`.
- Tarjetas: gradiente 140° `#11223588` → `#0b162388`. Contacto combina radial tenue con fondo sólido.
- Neón controlado mediante bordes translúcidos y sombras locales: insignia `0 0 12px #77edce55`; núcleo `0 0 35px #79d7ff0b`; conectores `0 0 12px #79d7ff66`. Conservar intensidad discreta.
- `orbit`: anillos del hero, rotación lineal infinita de 60s y 18s.
- `transfer-x` / `transfer-y`: pulso en conectores, 5s lineal infinito; salida retrasada 2.5s; eje vertical hasta 820px.
- `node-activate`: nodos Después, 5s ease-in-out infinito, retrasos 0/.25/.5/.75/1s.
- `reveal-in`: `.is-entering` en `[data-reveal]`, .55s ease both, opacidad .3→1 y desplazamiento vertical 12px→0; JS lo activa una sola vez por elemento.
- Transiciones: menú y botones .2s; tarjetas .25s. El nombre `.badge-pulse` no implica una animación: actualmente solo tiene luz estática.

## Breakpoints (`max-width`)
| Ancho | Cambios principales |
| --- | --- |
| 1080px | Hero más compacto; servicios y proceso a 2 columnas; motor a 190px de columna / núcleo 150px. |
| 820px | Hero a 1 columna y órbita oculta; resultados a 3 columnas; impacto y contacto a 1 columna; transformación vertical, máximo 560px. |
| 760px | Menú móvil progresivo; secciones más compactas; WhatsApp flotante oculta su texto. JS usa este mismo breakpoint. |
| 540px | Servicios, beneficios y proceso a 1 columna; resultados a 2; CTA hero apilados al 100%; footer vertical. |

Escritorio: servicios/proceso 4 columnas, resultados 5, beneficios 2. Transformación: dos paneles con motor central de 250px.

## Nuevas secciones y accesibilidad
Reutilizar contenedor, sección, encabezados, tarjetas y botones; respetar jerarquía semántica y anclas únicas. Mantener fondo oscuro, acentos cian limitados y lectura comercial clara. Añadir solo los estilos necesarios y revisar sus breakpoints; no agregar dependencias ni efectos excesivos.

Conservar `lang="es"`, viewport, salto a `#contenido`, foco visible de `2px` cian con offset `5px`, etiquetas ARIA y decoraciones `aria-hidden`. El scroll usa compensación de `6rem`. Mantener navegación y contenido disponibles sin JS, sincronización ARIA del menú y manejo de foco/Escape. No ocultar contenido esperando al observador.

`prefers-reduced-motion: reduce` desactiva animaciones, transiciones y scroll suave, y oculta el pulso del conector; el flujo estático permanece visible. Revisar contraste, teclado, zoom y tamaños táctiles al cambiar componentes: los valores documentados no certifican cumplimiento de accesibilidad ni sustituyen una prueba visual.

## UI-001 — Red tecnológica del Hero
Canvas absoluto detrás del contenido, sin eventos de puntero, ancho y alto al 100% del Hero; no añade dimensiones al flujo. Máscara vertical transparente en extremos, opaca entre 12% y 80%. Usa `--cyan`, conexiones de .7px hasta una distancia de `min(240px, ancho × .42)`, y nodos de radio `1 + profundidad` px (profundidad .45 a .99). La opacidad de líneas y nodos aumenta hacia la derecha para preservar legibilidad del texto.

Movimiento sinusoidal lento (.12–.17 rad/s), amplitud de 20px en escritorio y 10px hasta 760px; 38/18 nodos respectivamente. Sin destellos ni interacción con el puntero. Movimiento reducido muestra una composición estática. La red y los anillos del Hero se pausan con pestaña oculta o Hero fuera de pantalla.


## EXP-001 — Viaje de los datos
- Composición editorial asimétrica: Hero en dos columnas (1.25:1), título hasta 4.7rem, logo original en plano frontal sin deformación, escena arquitectónica detrás. Hasta 820px se apilan mensaje y escena de identidad; logo visible también en móvil.
- Fondo profundo `#050c15`, bordes cian contenidos y velo de contraste sobre la escena compartida fija. Ningún elemento 3D captura interacción ni condiciona el scroll.
- Secuencia: identidad → archivos dispersos → conexión y cuatro servicios → demostración Antes/Después → contacto. Los números de etapa indican orden, no resultados comerciales.
- Servicios en dos columnas asimétricas y escalonadas, una hasta 540px; separadores editoriales y cuatro diagramas: flujo de validación, indicadores, consolidación de fuentes y plataforma. Se retiran órbita y red genérica UI-001.
- Antes/Después combina documentos separados y vista de barras con las etiquetas comerciales existentes. Indicación explícita de demostración conceptual sin datos reales. Se retira el pulso repetido de los nodos Después.
- Botones, motor y paneles de transformación/contacto con radios 3–4px; impacto y proceso usan separadores y menos superficies de tarjeta. Se preservan fuentes, foco y menú progresivo.
- Fallback CSS geométrico permanente sin JS, sin WebGL, con ahorro de datos o movimiento reducido. Los servicios y la demostración son HTML/CSS independientes del motor. El render 3D descansa después de una transferencia breve y se reactiva al recorrer o mover el puntero.
- Sin scroll hijacking, pantallas de carga, cifras inventadas ni posicionamiento como proveedor de IA.

## EXP-002 — dirección editorial corporativa
- Se conservan fondo, fuentes, propuesta comercial y acentos aprobados. Cinco bloques con menos repetición: identidad, problemas con Antes/Después, soluciones, proceso, contacto.
- Logo JPG original completo y proporcionado: header sin marco/radio/recorte; Hero hasta 440px (340px en tamaños compactos), sin sombra de contenedor. El archivo incluye fondo oscuro, márgenes y texto; no hay transparencia ni versión vectorial. No se altera la marca para compensarlo.
- Problemas: controles editoriales con estado seleccionado y respuesta comercial. Servicios: flujo de validación sobre retícula, indicadores sobre guías, consolidación central y vista de plataforma en perspectiva; composición escalonada, una columna en móvil.
- Proceso: línea de continuidad y hitos, vertical en móvil. Contacto: composición asimétrica con canales y formulario; campos a una o dos columnas, controles de al menos 48px y fuente de 16px.
- Puntero: halo radial tenue de 340px, cursor nativo preservado, profundidad máxima aproximada de 2 grados por eje. Sin halo con movimiento reducido ni puntero táctil. Feedback táctil mediante `:active`, sin cancelar gestos ni simular cursor.
- Se retira el pulso CSS continuo del conector Antes/Después; visualizaciones HTML siempre disponibles. Foco visible y movimiento reducido conservados. Los estilos no constituyen certificación visual ni de contraste.

## UI-003 — Soluciones en acción
- Soluciones sustituye los bloques escalonados por navegación editorial y escenario amplio en dos áreas; hasta 820px navegación compacta en dos columnas sobre la demostración. Hasta 540px se usan diagramas SVG de composición vertical, sin desplazamiento horizontal interno.
- Cada experiencia presenta desafío, proceso visual conceptual, resultado y CTA de evaluación contextual. Sin métricas atribuidas; dashboard explícitamente ilustrativo.
- Automatización recorre conexiones y estados; información integra fuentes y organiza registros; BI construye barras y trazado; plataforma ensambla módulos conectados. Secuencias finitas, repetibles y sin movimiento cuando se solicita reducción. Se mantiene el cian controlado, fondo oscuro, cursor y scroll nativos.

## UI-004 — ambiente y definición
- Fondo oscuro con capas radiales cian y matiz verde discreto; iluminación localizada por sección: identidad a la derecha, información a la izquierda, soluciones lateral, proceso central y contacto a la derecha. Halos de límites suaves y separadores degradados evitan cortes sólidos.
- Luz global desplazada por el progreso interpolado de la escena, sin segundo bucle ni animación CSS infinita; leve oscilación del sistema durante su actividad. Velo de contraste conservado y adaptado a móvil.
- Canvas con antialiasing también en móvil, hasta DPR 2 con presupuesto de resolución; la adaptación de rendimiento reduce fps en lugar de resolución. Sin imágenes de fondo ni filtros de desenfoque.
- Sin WebGL/JS, ahorro de datos o movimiento reducido: composición CSS estática y esquema geométrico existentes. Sin cambios a tipografía, contenido, navegación, formulario ni diagramas de Soluciones.

## UI-005 — identidad holográfica
- Sustituye el JPG rectangular del Hero por arte original integrado en SVG con transparencia filtrada. Logo completo, proporcional y frontal; resplandor local moderado. Header y demás secciones conservados.
- Plataforma elíptica cian con tres anillos, núcleo luminoso, cono de proyección ascendente y conexiones periféricas conceptuales sin métricas. Sin panel opaco. Flotación de 9px en 8s, escala máxima 1.012, anillos de 19/26s y perspectiva de puntero acotada por el controlador existente.
- Escenario proporcional 500:460, columna derecha en desktop y centrado hasta 500px bajo el contenido en tablet/móvil. Decoraciones sin semántica; logo con texto alternativo. Movimiento reducido conserva holograma estático.

## EXP-003 — escenas operativas y capacidades
- Energía holográfica de baja densidad alrededor del arte original sin modificar el SVG/JPG; iluminación suave y barrido sobre proyección. Pausa compartida, móvil reducido y estado estático accesible.
- Transformación con fuentes en perspectiva, núcleo y dashboard conceptual; scroll nativo enlaza organización, conectividad e indicadores. Sin métricas comerciales inventadas.
- Capacidades: núcleo iWave, cinco categorías conectadas y panel con tecnologías, solución y recorrido conceptual. Móvil en dos columnas de controles, panel debajo. Sin iconos externos ni afirmaciones de certificación.
- Experiencia: escenario de profundidad con centro legible y referencias laterales, transición de partículas CSS y tipografía neutral; nombres no imitan logotipos. Contexto del fundador y aprobación gráfica pendiente visibles. Sin rotación automática. Sin JS las tres referencias permanecen legibles.

## QA-001 — estabilidad de composición
- Antes/Después: tres columnas en escritorio (fuentes, integración/automatización, indicadores); hasta 820px se apilan etapas y las fuentes ocupan tres columnas; hasta 540px también se apilan las fuentes. Alturas determinadas por contenido, etiquetas en bloques y sin atenuación de textos por scroll.
- Las conexiones y barras comunican el recorrido sin condicionar la visibilidad del resultado. Se retiran giros en perspectiva y desplazamientos verticales de las tarjetas.
- Hero: ajuste de proporción y separación de columnas, protección radial local de la marca y reducción de intensidad del canvas compartido a .28 para evitar interferencia con la lectura. Marca y textos comerciales conservados. Esta reducción trata la interferencia del fondo; las figuras negras se corrigen mediante el relleno SVG explícito.

## EXP-006 — Living Digital Ecosystem
- Hero con altura editorial de hasta 860px en escritorio, arte holográfico original y campo ascendente continuo. Mayor presencia del canvas (.7 escritorio/.42 compacto) con velo de contraste preservado; tablet/móvil mantienen flujo vertical.
- Estados espaciales interpolados: identidad orbital, dispersión, conexión, estructuración, ecosistema radial, hélice de trayectoria y composición de indicadores en contacto. Campo GLSL de baja amplitud exclusivo de partículas.
- Menú fullscreen con numeración, tipografía amplia, acceso a capacidades/trayectoria/contacto y entrada escalonada GSAP. Sin JS se conservan enlaces visibles, sin fullscreen obligatorio.
- Las experiencias SVG de soluciones y Antes/Después siguen siendo la capa explicativa accesible; esta entrega amplía su entorno espacial, no sustituye estos diagramas por simulaciones WebGL.
