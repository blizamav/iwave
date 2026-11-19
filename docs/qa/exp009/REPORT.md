# EXP-009 — implementación y validación

Implementación local del 2026-11-18. Sin despliegue, commit, push, staging ni cambios de infraestructura. Los resultados finales de Chromium se registran en `results-all.json`; el estado de cada captura queda en `capture-states-<ancho>.json`.

**Resultado funcional:** [matriz principal aprobada](results-all.json) en 1440×900, 768×1024 y 390×844. Cero errores JS/consola de shader y cero respuestas HTTP fallidas en esas tres ejecuciones; cuatro texturas cargadas, ciclos automáticos comprobados y fallbacks iniciales sin JS, sin WebGL y con movimiento reducido disponibles. [Pruebas adicionales aprobadas](extra-results.json): inercia, vistas completas del ciclo y cambio dinámico a reduced-motion en los tres tamaños, sin errores ni overflow medido contra clientWidth. Se conservan **84 capturas finales**; las preliminares fallidas se archivaron en `/tmp/iwave-exp009/qa-preliminary/`.

**Rendimiento:** no se acredita fluidez de producción. Chromium usa SwiftShader y se observaron pausas largas. Los intervalos rAF medidos durante la escena de transformación son los siguientes; no representan un benchmark de GPU física ni FPS del renderizador.

| Viewport | Mediana rAF | P95 rAF | Máximo |
| --- | --- | --- | --- |
| 1440×900 | 533,4 ms | 716,7 ms | 1016,6 ms |
| 768×1024 | 16,7 ms | 733,3 ms | 983,3 ms |
| 390×844 | 16,7 ms | 200,0 ms | 466,6 ms |

La validación de hardware real, batería, temperatura y fluidez móvil queda pendiente. Esta entrega verifica ejecución y visibilidad de mecanismos; no declara aprobación del presupuesto de rendimiento.

## Evidencia enlazada

| Efecto | 1440 × 900 | 768 × 1024 | 390 × 844 |
| --- | --- | --- | --- |
| Logos | [Salida](1440-logo-disintegration.png) · [Entrada](1440-logo-reconstruction.png) · [Completo](1440-logo-next-complete.png) | [Salida](768-logo-disintegration.png) · [Entrada](768-logo-reconstruction.png) · [Completo](768-logo-next-complete.png) | [Salida](390-logo-disintegration.png) · [Entrada](390-logo-reconstruction.png) · [Completo](390-logo-next-complete.png) |
| Tubos | [Inicio](1440-cursor-initial.png) · [Recorrido](1440-cursor-trail.png) · [Inercia](1440-cursor-inertia.png) · [Disipación](1440-cursor-dissipated.png) | Desactivados en puntero táctil | Desactivados en puntero táctil |
| Morphing | [Nube](1440-morph-fragmented.png) · [Red](1440-morph-integrated.png) · [Flujo](1440-morph-automated.png) · [BI](1440-morph-analytics.png) · [Módulos](1440-morph-platforms.png) · [Transición](1440-morph-platforms-intermediate.png) | [Nube](768-morph-fragmented.png) · [Red](768-morph-integrated.png) · [Flujo](768-morph-automated.png) · [BI](768-morph-analytics.png) · [Módulos](768-morph-platforms.png) · [Transición](768-morph-platforms-intermediate.png) | [Nube](390-morph-fragmented.png) · [Red](390-morph-integrated.png) · [Flujo](390-morph-automated.png) · [BI](390-morph-analytics.png) · [Módulos](390-morph-platforms.png) · [Transición](390-morph-platforms-intermediate.png) |
| Energía | [Actividad idle](1440-energy-idle.png) | [Actividad idle](768-energy-idle.png) | [Actividad idle](390-energy-idle.png) |
| Lifecycle | [0](1440-lifecycle-0.png) · [25](1440-lifecycle-25.png) · [50](1440-lifecycle-50.png) · [75](1440-lifecycle-75.png) · [100](1440-lifecycle-100.png) · [Reinicio](1440-lifecycle-restart.png) | [0](768-lifecycle-0.png) · [25](768-lifecycle-25.png) · [50](768-lifecycle-50.png) · [75](768-lifecycle-75.png) · [100](768-lifecycle-100.png) · [Reinicio](768-lifecycle-restart.png) | [0](390-lifecycle-0.png) · [25](390-lifecycle-25.png) · [50](390-lifecycle-50.png) · [75](390-lifecycle-75.png) · [100](390-lifecycle-100.png) · [Reinicio](390-lifecycle-restart.png) |

## 1. Desintegración y reconstrucción de marcas

- **Archivo:** `img/experience/exp009.js`, bloque 01; integración `.logo-showcase` en `index.html`, estilos en `img/experience/exp009.css`.
- **Three.js:** cuatro texturas locales, PlaneGeometry/BufferGeometry, InstancedMesh y atributos InstancedBufferAttribute `aHome`, `aOffset`, `aRotation`, `aUvOffset`. Una instancia por celda, con UV propias; las instancias conservan una matriz identidad mientras el shader aplica la transformación individual.
- **Shader:** vértices con matrices GLSL de rotación X/Y/Z, desplazamiento tridimensional y `uProgress`; fragmentos con muestreo de la textura, transparencia de origen, interpolación de alfa y conversión de espacio de color. No se usan Geometry ni Face3.
- **Animación:** GSAP lleva progreso 0→1 al salir y 1→0 al entrar; las piezas giran y se alejan/acercan en Z. Una marca completa permanece estable entre transiciones. Cada nueva navegación espera la transición vigente para evitar solapamientos.
- **Activación:** automática tras 4,5 segundos visibles de reposo; flechas, ArrowLeft/ArrowRight y swipe horizontal. Hover/foco suspenden el avance automático; Pausar/Reanudar permite detener la transición misma. Los enlaces al sitio oficial y el muro permanente siguen disponibles.
- **Móvil:** 26 columnas frente a 42 en escritorio, filas según proporción; cámara encuadra sin estirar el arte. `touch-action:pan-y` conserva desplazamiento vertical; sin cancelación de eventos táctiles.
- **Evidencia:** por cada ancho, `*-logo-complete.png`, `*-logo-disintegration.png`, `*-logo-reconstruction.png`, `*-logo-next-complete.png`, `*-logo-2-complete.png`, `*-logo-3-complete.png`. Los JSON distinguen fase outgoing/incoming y progreso, en lugar de inferir la transición por el nombre del archivo.
- **Dependencias nuevas:** ninguna.
- **Límite de marca:** BancoEstado utiliza el recurso matriz existente con identificación textual de Corredores de Seguros. No se dispone del arte específico de la filial ni de comprobantes de autorización para animar las cuatro marcas. Véase [procedencia y revisión](../../../img/experience/brands/SOURCES.md). Se conserva la aclaración sobre experiencia profesional del fundador y ausencia de contratos directos, alianza o patrocinio de iWave.

## 2. Tubos de cursor

- **Archivo:** `img/experience/exp009.js`, bloque 02; canvas compartido y estilos `exp009.css`.
- **Three.js:** 36 posiciones Vector3 persistentes, CatmullRomCurve3, tres BufferGeometry dinámicas con 56 segmentos y sección circular de ocho lados. Posiciones, UV e índices se asignan una vez; el barrido de anillos actualiza el mismo buffer. No se reconstruye TubeGeometry por cuadro. Los vectores auxiliares se reutilizan.
- **Shader:** variación luminosa en la sección del tubo, pulso longitudinal, degradación hacia la cola y opacidad temporal; colores fijos cian, azul profundo y blanco azulado. Mezcla aditiva y profundidad Z controlada. El pulso de clic emplea un pequeño toro 3D reutilizado.
- **Animación:** damp en la cabeza, inercia a lo largo del historial, curvas orgánicas y desplazamientos Z. El paso de la simulación se limita para que una máquina lenta no colapse toda la cola en un cuadro. La disipación conserva tiempo real (2,5 segundos).
- **Activación:** pointermove de ratón con puntero preciso; aumenta energía sobre CTA/botones, desaparece sobre formularios, pointerleave y blur. Clic produce un pulso, sin cambiar colores al azar. El canvas no recibe eventos y el cursor nativo se conserva.
- **Móvil:** desactivado para puntero táctil/no preciso; se conservan las respuestas `:active` y gestos nativos existentes. No hay cursor permanente ni bloqueo del scroll.
- **Evidencia:** `1440-cursor-initial.png`, `1440-cursor-trail.png`, `1440-cursor-inertia.png`, `1440-cursor-dissipated.png`. La captura de estela muestra el recorrido curvo extendido, no solo el punto final.
- **Dependencias nuevas:** ninguna. Implementación original; no se importa ni copia threejs-components/TubesCursor ni código CC BY-NC-SA.

## 3. Particle morphing

- **Archivo:** `img/experience/exp009.js`, bloque 03; `.morph-system` se añade después de Operación Conectada. El diagrama y su controlador `enterprise.js` se preservan.
- **Three.js:** BufferGeometry, Points, ShaderMaterial, Float32Array para cinco formas: nube dispersa, red de integración, tres flujos operativos, cinco indicadores volumétricos y seis módulos de plataforma. 1.200 partículas en escritorio / 480 en compacto.
- **Buffers:** sourcePositions, targetPositions, currentPositions y swarmPositions persistentes. Se actualiza el atributo position existente con Bézier cuadrática `(1-t)² P0 + 2(1-t)t P1 + t² P2`; la posición intermedia añade dispersión, profundidad y remolino. Un cambio manual parte de la posición actual y cancela el tween anterior.
- **Shader:** ruido procedural original de baja amplitud, respiración permanente, tamaño según profundidad y DPR, puntos circulares con núcleo y halo. No se asignan vectores por partícula/cuadro ni se añade simplex-noise.
- **Animación/activación:** tween GSAP de 2,6 segundos; reposo de 4,5 segundos entre formas; solo actualiza estando visible. Selección manual suspende el avance automático durante 12 segundos visibles. Pausar/Reanudar permite inspeccionar una forma intermedia; la energía y respiración idle mantienen actividad visual.
- **Móvil:** menor densidad y cámara adaptada a la proporción; controles de al menos 44px. Fallback DOM explica fuentes → integración → operación conectada.
- **Evidencia:** `*-morph-fragmented.png`, `*-morph-integrated[-intermediate].png`, `*-morph-automated[-intermediate].png`, `*-morph-analytics[-intermediate].png`, `*-morph-platforms[-intermediate].png`, `*-morph-automatic.png`. Capturas de los tres anchos. Los intermedios se detienen mediante el control real, sin asignar posiciones de prueba.
- **Dependencias nuevas:** ninguna.

## 4. Sistema de energía

- **Archivo:** `img/experience/exp009.js`, bloque 04, en el mismo viewport de transformación.
- **Three.js:** tres TorusGeometry con rotación independiente, núcleo IcosahedronGeometry, cuatro módulos y cuatro QuadraticBezierCurve3. Los tubos de los arcos se crean una sola vez; partículas orbitales/paquetes avanzan sobre las curvas con Vector3 reutilizados.
- **Shader:** `uTime`, `uEnergy`, `uColor`, fase y opacidad. Un paquete procedural recorre la coordenada longitudinal; la intensidad varía suavemente y los anillos emiten luz con transparencia controlada.
- **Animación/activación:** rotación independiente de anillos, paquetes en movimiento, respiración del núcleo y aumento de energía durante integración/morphing. Núcleo responde con escala/opacidad. Actualización automática mientras el escenario está visible.
- **Bloom:** evaluado y resuelto con emisión/adición de shaders y halos de puntos. No se incorpora UnrealBloomPass: preserva contornos y evita targets adicionales de postprocesado y sobreexposición. No hay temática de planetas ni OrbitControls que interfieran con el scroll.
- **Móvil:** comparte escenario y cámaras; cuatro arcos y tres anillos, sin un renderer adicional. Pausa fuera de pantalla.
- **Evidencia:** `*-energy-idle.png` comparada con las otras formas; los anillos/paquetes tienen posiciones diferentes en capturas sucesivas. La transformación incluye el mismo ecosistema activo.
- **Dependencias nuevas:** ninguna.

## 5. Ciclo de vida

- **Archivo:** `img/experience/lifecycle.js`; barra, controles y botones de etapas en `index.html`; estilos en `exp009.css`.
- **Técnica:** un timeline GSAP repetitivo con pausas breves en 25/50/75/100%, reinicio interpolado y espera entre ciclos. Sin Three.js/shaders: el progreso es semántico en DOM y sigue funcionando sin WebGL.
- **Animación:** barra luminosa, porcentaje, etapas activas y completadas. Las explicaciones originales permanecen legibles. Selección de una etapa mueve el timeline a esa etapa y pausa 12 segundos; el botón permite pausar/reanudar inmediatamente. No se crean timelines duplicados.
- **Activación:** automática al entrar en viewport; se pausa fuera de vista, con pestaña oculta, pagehide o reduced-motion. Al solicitar movimiento reducido queda el ciclo completo estático y las etapas siguen siendo seleccionables.
- **Móvil:** disposición vertical original, barra horizontal común y botones accesibles de 44px; no captura gestos.
- **Evidencia:** `*-lifecycle-0.png`, `*-lifecycle-25.png`, `*-lifecycle-50.png`, `*-lifecycle-75.png`, `*-lifecycle-100.png`, `*-lifecycle-restart.png` para los tres tamaños. Se utiliza el control de pausa real para capturar exactamente cada cuarto del ciclo.
- **Dependencias nuevas:** ninguna; GSAP local existente.

## Arquitectura, fallbacks y preservación

- Un renderer, un contexto WebGL y el RAF existente en `journey.js`; reloj y resize comunes. La escena ambiental pasa a un render target y se compone con baja intensidad; los viewports DOM se dibujan con scissor y limpieza local. El canvas superior tiene `pointer-events:none`. Los escenarios fuera de pantalla no avanzan sus efectos.
- La parte física usa delta limitado para conservar curvas y pasos intermedios bajo carga; los tiempos de inactividad/disipación siguen el reloj compartido. Visibilidad, bfcache y disposición se integran con el controlador existente.
- Liberación de texturas, geometrías, materiales, target, timelines, renderer, observadores y listeners al disponer el motor. No se crea otro contexto para cada efecto.
- Fallback con reduced-motion, saveData, memoria limitada o falta de WebGL: marcas HTML, enlaces oficiales, diagrama aprobado y explicación estática de transformación. El lifecycle es independiente del contexto gráfico.
- Corrección focalizada de overflow: el barrido `.hologram-sweep` preexistente ampliaba intermitentemente el viewport móvil hasta 678px y desalineaba scissor/buffer. Se contiene en `.hologram-stage` con `overflow:clip`; el canvas usa unidades de viewport y el render usa el tamaño real asignado. No se modifica el arte del Hero ni su contenido.
- `script.js`, `styles.css` y `img/experience/enterprise.js` se comparan con copia inicial de EXP-009 y se conservan íntegros. La gran reconstrucción preexistente sigue sin confirmar; el diff de Git contra HEAD incluye trabajo anterior. El diff propio de HTML/journey se conserva en `/tmp/iwave-exp009/` para revisión local.

## Reproducción y alcance de QA

```sh
node docs/qa/exp009/qa.cjs
node docs/qa/exp009/extra-evidence.cjs
# Opcional: limitar a un viewport
node docs/qa/exp009/qa.cjs 390
node --input-type=module --check < img/experience/exp009.js
node --input-type=module --check < img/experience/lifecycle.js
node --input-type=module --check < img/experience/journey.js
git diff --check
```

Playwright de desarrollo reutilizado desde `/tmp/iwave-qa001/node_modules/playwright`; Chromium usa bibliotecas locales de QA-001 mediante LD_LIBRARY_PATH (configurado por el script, sobreescribible). Se puede indicar `PLAYWRIGHT_PATH`. No se instala ninguna dependencia del sitio. El servidor HTTP 8769 y el navegador de QA se cierran al terminar.

La prueba comprueba estados automáticos/manuales, flechas/teclado, swipe simulado, pausa/foco, scroll nativo, ausencia de overflow en las secciones, carga de las cuatro marcas, destinos href oficiales, cuatro soluciones y cinco capacidades existentes, menú móvil y fallbacks sin JS/sin WebGL/reduced-motion. Recoge errores JS, errores de shader en consola y respuestas HTTP fallidas. La presencia gráfica se comprueba con píxeles luminosos en la zona WebGL y revisión de las imágenes; los cambios de texto por sí solos no aprueban la escena.

Las capturas de cursor cubren movimiento, inercia y disipación. Las de logo incluyen salida y entrada reales. Las del morphing cubren las cinco formas y sus cuatro transiciones, además del avance automático. Las de lifecycle cubren los cuartos del ciclo y reinicio.

Los intervalos `scheduler` en resultados describen 45 muestras de requestAnimationFrame del navegador emulado, no FPS GPU certificados ni rendimiento de un teléfono físico. SwiftShader fuerza WebGL por software; se requiere prueba en dispositivos físicos para validar presupuesto de batería/temperatura y fluidez de producción. No se afirma certificación de contraste, otros motores de navegador ni autorización legal de las marcas. Los enlaces se verifican en la UI y por sus destinos; las restricciones/redirecciones de proveedores externos quedan fuera del control de la landing.

## Archivos y estado de Git

- Rama observada: `reconstruccion-iwave`. Antes de EXP-009 ya había modificaciones en README.md, index.html, script.js y styles.css; AGENTS.md, docs/ e img/experience/ no estaban versionados.
- Cambios propios de aplicación: index.html, img/experience/journey.js; nuevos img/experience/exp009.js, exp009.css y lifecycle.js. Documentación: ARCHITECTURE.md, DESIGN_SYSTEM.md, CHANGELOG.md, brands/SOURCES.md y esta carpeta QA.
- Comparación contra la copia inicial: script.js, styles.css y enterprise.js idénticos. README.md no fue editado. Los diffs propios de index.html y journey.js se revisaron frente a `/tmp/iwave-exp009/`, porque el diff contra HEAD también contiene la reconstrucción anterior.
- Comprobaciones estáticas aprobadas: sintaxis de tres módulos y dos scripts QA; IDs, referencias ARIA, anclas y archivos locales de HTML; estructura CSS, estilos reales en Chromium y `git diff --check`.
- No se hizo staging, commit, push ni despliegue; no se modificaron Dockerfile, nginx.conf, Cloudflare ni configuración de infraestructura. Los cambios permanecen locales y sin confirmar.
