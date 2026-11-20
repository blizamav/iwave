# UX-022 / CURSOR-023 — Coverflow y cursor

Trabajo local del 2026-11-20. Alcance: carrusel de experiencia profesional y cursor de escritorio. Sin deploy, commit, push, dependencias nuevas ni escrituras de infraestructura.

## Causa raíz comprobada

La regla `body.exp009-ready .pointer-halo, .pointer-halo` declaraba `opacity:0`. Su selector con `body.exp009-ready` tiene mayor especificidad que `.pointer-halo.is-visible`, incluso frente a las declaraciones posteriores de opacidad .75/.65. Al quedar listo el motor WebGL, el halo permanecía transparente.

Playwright reprodujo el estado previo real, conservado antes de editar: después de movimientos de mouse, `pointer-halo is-visible`, transformación a (650,430), display:block, z-index:100, pointer-events:none, puntero preciso y reduced-motion desactivado; opacidad calculada **0**. No era un bloqueo de clics ni una coordenada incorrecta. [Diagnóstico y reglas coincidentes](diagnosis.json), [captura previa](before-invisible-cursor.png).

Además, `exp009.js` tenía `pointerMove`, `pointerDown` y `hideTrail` vacíos: la estela WebGL anterior se había retirado. `script.js` solo movía el círculo DOM, sin geometría continua, disipación en reposo ni render de rastro. La respiración de placa se había retirado deliberadamente en FIX-021; ahora se recupera exclusivamente en la imagen. La animación ambiental, el morph y sus ritmos existentes se mantienen.

## Implementación

- **Coverflow:** cuatro tarjetas DOM persistentes con las cuatro marcas originales; tres posiciones visibles, central opaca y lateral atenuada .72. Perspectiva 1100px, rotación lateral ±34°, profundidad −140px y escala .78. La cuarta tarjeta, oculta e inert, se prepara en el lado de entrada; la que sale abandona el lado correcto. Transición de 800ms sin sustituir imágenes durante el desplazamiento.
- **Controles:** anterior/siguiente, clic en ambas previsualizaciones, flechas de teclado y swipe horizontal. Se conservan enlaces oficiales y nombres accesibles. El gesto vertical no navega. Autoplay circular cada 7,5s de reposo visible, suspendido por pausa, foco, hover, página oculta y salida del viewport. Web Animations API permite pausar/reanudar un desplazamiento en curso; ese estado también suspende la reconstrucción GPU. La navegación manual funciona sin WebGL y con movimiento reducido.
- **Respiración:** escala 1–1,008 en 5s sobre el `<img>` central. Sin animación de width, height, padding o margin. Se restablece durante desplazamiento/reconstrucción y se suspende en pausa/fuera de vista. Anillo y halo ambiental discretos conservados.
- **Contención:** imágenes originales con object-fit:contain, sin filtros, 24px de resguardo, proporciones y opacidad central 1. Placas de dimensiones comunes a las cuatro marcas. La fragmentación/reconstrucción InstancedMesh/GSAP existente se sincroniza con la llegada al centro mediante `coverflowchange`; conserva la envolvente de vértices y el scissor GPU de FIX-021. Mismo renderer, RAF, geometrías, materiales y precalentamiento. El área GPU se obtiene de la placa central real, incluido su espacio interior.
- **Cursor:** implementación original Canvas 2D de spline cuadrática continua con tres capas estrechas Electric Cyan/Royal Blue que sugieren profundidad. No utiliza tubos ni un segundo contexto WebGL. Historial persistente de 32 posiciones, relajación exponencial con subpasos hasta 120Hz, largo máximo 200px y DPR máximo 1,5. Un único RAF del cursor bajo demanda; termina después de 1,25s de reposo. El renderer GPU ambiental conserva su ciclo independiente.
- **Entrada y ciclo de vida:** mouse + hover/puntero preciso; coordenadas clientX/clientY en canvas fijo, z-index:100 y pointer-events:none. Cursor nativo conservado. Grosor ligeramente mayor sobre enlaces/botones; se suprime sobre campos. Sin canvas inicial en touch/reduced-motion. Resize, blur, pointerleave, preferencias y visibilidad limpian el rastro; AbortController libera listeners en pagehide definitivo, conservando bfcache. Independiente de ScrollTrigger/WebGL. El motor comprueba el mismo contexto WebGL2 antes de construir el renderer para evitar errores en el fallback.

## Archivos

Aplicación:

- `img/experience/coverflow.js` y `img/experience/cursor.js`: módulos nuevos.
- `img/experience/exp009.js`: sincronización y contención de la reconstrucción central; retirada de funciones vacías del cursor.
- `img/experience/journey.js`: URLs versionadas, retirada de llamadas a funciones vacías y comprobación del contexto existente.
- `img/experience/refinement.css`: Coverflow, respiración y capa de cursor; retiradas reglas del halo obsoleto.
- `script.js`: retirada del halo DOM; respuestas previas de superficies conservadas.
- `index.html`: únicamente versiones de recursos e inclusión de los dos módulos. Contenido y metadatos idénticos a la copia inicial.

Documentación: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md` y esta carpeta QA. Las entradas históricas se conservan; las nuevas decisiones se indican al principio.

## Pruebas y evidencia

`qa.cjs` usa Playwright externo existente con Chromium/ANGLE SwiftShader. Cada ejecución levanta y cierra un servidor Python en loopback. La matriz usa los cinco anchos solicitados, movimiento reducido y WebGL anulado; también emula DPR 2 para comprobar el límite del cursor. Registra errores de página/consola y recursos HTTP fallidos.

Las aserciones cubren cuatro marcas, tres posiciones, vuelta circular, ambos sentidos/laterales, teclado, swipe horizontal y gesto vertical; además de autoplay, pausa/reanudación, respiración y contención. La prueba geométrica proyecta los vértices de las cuatro mallas en 101 pasos de fragmentación antes del scissor, conservando la comprobación de FIX-021.

El cursor se prueba con `page.mouse.move`, clic real en un control y scroll real. Se leen píxeles del canvas: cantidad, huella, límites y conectividad. La aprobación exige siete cuadros diferentes con píxeles visibles y más del 95% conectados; no se basa en la carga del script. Se muestrea el decaimiento hasta cero y se comprueba que el RAF deja de ejecutarse. Se verifica el cambio de reduced-motion en vivo y la ausencia de canvas en cargas móviles/reducidas.

Para las capturas de cursor, la instrumentación de QA congela únicamente el siguiente RAF del cursor después de medir un frame real, captura y lo reanuda. Esto evita que el tiempo de captura de Chromium haga desaparecer el rastro. La congelación no existe en producción. El video de escritorio conserva la secuencia de movimiento, interacción y reposo, además de estos breves intervalos de captura. La reconstrucción GPU se congela solo para su evidencia; la prueba retoma después la animación.

Evidencias principales:

- [Coverflow móvil, BancoEstado](390-brand-1.png), [escritorio, MetLife](desktop-brand-0.png).
- [Fragmentación/reconstrucción GPU](desktop-fragment.png).
- [Cursor en movimiento](desktop-cursor-motion-2.png), [junto a controles](desktop-cursor-button.png), [sobre la sección con scroll](desktop-cursor-scroll.png), [reposo](desktop-cursor-idle.png).
- [Fallback sin WebGL con cursor visible](no-webgl-cursor-motion-2.png), [movimiento reducido](reduced-brand-0.png).
- [Video de escritorio](desktop.webm). Secuencias `desktop-cursor-motion-0.png` a `-6.png` y equivalentes sin WebGL.

La prueba adicional [boot.json](boot.json) retuvo la textura de Scotiabank, navegó a BancoEstado antes de completar la precarga y confirmó que no se inicia fragmentación parcial ni se restablece la selección al llegar las texturas. Pasó sin errores.

Los JSON de cada modo contienen las aserciones, estados, geometría, píxeles y métricas; `diagnosis.json` prueba la causa raíz y `preservation.json` delimita el alcance. Se inspeccionaron directamente capturas móviles, tablet, escritorio y estela; no se declara revisión visual manual de cada imagen de la matriz.

## Resultados medidos

| Modo | Comprobaciones aprobadas | Errores de página/consola/HTTP | Overflow | CLS después de estabilizar |
| --- | ---: | ---: | ---: | ---: |
| 360 | 7 | 0 | 0px | 0.000000000 |
| 390 | 7 | 0 | 0px | 0.000000000 |
| 430 | 7 | 0 | 0px | 0.000000000 |
| 768 | 11 | 0 | 0px | 0.000001974 |
| 1440 | 12 | 0 | 0px | 0.000000731 |
| desktop | 17 | 0 | 0px | 0.000000731 |
| no-webgl | 12 | 0 | 0px | 0.000000731 |
| reduced | 7 | 0 | 0px | 0.000000000 |

Los cinco anchos aprobaron las cuatro marcas contenidas en las tres posiciones previstas. La evaluación GPU de 101 estados por malla verificó 206.848 vértices por viewport compacto y 310.272 a 1440px: razón proyectada máxima menor o igual a 1, sin depender de recortar fragmentos con el scissor.

Escritorio final: respiración medida **1,00001–1,00798**, con dimensiones de placa/contenedor constantes. Los siete cuadros del cursor tuvieron **549–717 píxeles visibles**, todos en un único componente conectado (100%). En la muestra de reposo, la suma de alfa descendió **84.686 → 70.370 → 51.660 → 9.067 → 0**. Se comprobó después que no aumentaba el número de llamadas al RAF del cursor. En el fallback con deviceScaleFactor 2 se midió un DPR efectivo del cursor de **1,5**. Los modos móviles/reducidos no crearon canvas de cursor.

| Carga de prueba | Intervalo mediano del RAF de cursor | p95 | Long tasks de toda la página |
| --- | ---: | ---: | ---: |
| 768px sin video | 16.7ms | 100.0ms | 4 |
| 1440px sin video | 33.4ms | 316.8ms | 5 |
| 1440px con video | 116.7ms | 233.4ms | 5 |
| Sin WebGL, DPR emulado 2 | 16.7ms | 33.3ms | 2 |

El cursor aislado de WebGL mantuvo una mediana próxima a 60Hz (16,7ms); bajo la carga completa de SwiftShader y grabación de video se observaron cuadros mucho más lentos. La ejecución sin video a 1440px dio una mediana de 33,4ms; la grabada, 116,7ms. Estos intervalos incluyen el trabajo del sitio, captura e instrumentación y **no permiten certificar fluidez en GPU real**. El RAF del cursor se detiene por completo en reposo y no se inicia en móvil/reduced-motion. No se agregó otro renderer/contexto WebGL ni otro bucle al carrusel.

CLS total desde la carga: 0 en 360/390/430; 0,015571240 en 768; 0,003661621 en 1440/escritorio; 0,000392388 sin WebGL y 0,000372132 con reduced-motion. El CLS posterior a estabilizar fue 0 en móvil/reduced-motion y menor a 0,000002 en las demás pruebas. No se declara CLS cero universal ni se atribuye su origen sin medición específica de cada fuente.

Incidencias del verificador: la primera prueba a 768px movía el mouse hasta 1080px y salía del viewport; se ajustó el recorrido al ancho real y se repitió correctamente. La ejecución agrupada final terminó con código 143 del entorno después de aprobar escritorio; la última comprobación sin WebGL se repitió aislada y aprobó, con cero errores de consola sin excepciones excluidas.


## Reproducción

Desde la raíz del repositorio:

```sh
node docs/qa/ux022-cursor023/qa.cjs matrix
node docs/qa/ux022-cursor023/qa.cjs desktop
node docs/qa/ux022-cursor023/qa.cjs boot
node --input-type=module --check < img/experience/coverflow.js
node --input-type=module --check < img/experience/cursor.js
node --input-type=module --check < img/experience/exp009.js
node --input-type=module --check < img/experience/journey.js
node --check script.js
node --check docs/qa/ux022-cursor023/qa.cjs
node --check docs/qa/ux022-cursor023/diagnose.cjs
node --check docs/qa/ux022-cursor023/boot.cjs
git diff --check
```

`qa.cjs before` reproduce únicamente el diagnóstico inicial y requiere `/tmp/iwave-ux022/before/`, copia del estado preexistente, no de HEAD. `qa.cjs final` ejecuta ese diagnóstico, escritorio y fallback sin WebGL. Playwright reside en `/tmp/iwave-qa001/node_modules/playwright`; se puede sustituir con `IWAVE_PLAYWRIGHT`. Bibliotecas Chromium externas preexistentes en `/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu`. En este entorno Chromium requirió ejecución fuera del sandbox.

## Git, preservación y límites

Ya estaban modificados Dockerfile, nginx.conf, index.html, exp009.js, journey.js, refinement.css y los tres documentos. Ya estaban sin seguimiento `.dockerignore`, `docs/deployment/`, `docs/qa/fix019-seo020/`, `docs/qa/fix021/` e `img/social/`. Se conserva ese trabajo. Los cambios nuevos son los dos módulos, `script.js`, esta carpeta QA y las modificaciones acotadas descritas sobre archivos previamente pendientes.

La comparación con la copia inicial confirma que HTML comercial/SEO-020 es idéntico excepto recursos; el código de morph/energía entre su declaración y resize es idéntico; los documentos iniciales se conservan íntegros después de las entradas nuevas. No se escribieron Dockerfile, nginx.conf ni infraestructura. Los assets de marcas, Hero, Soluciones, Transformación, Tecnologías, Metodología, Contacto, navegación y pie no se modificaron. FIX-019/SEO-020 y la contención de FIX-021 se preservan; la presentación de una sola placa se sustituye por el Coverflow solicitado.

Pendiente: fluidez y percepción de profundidad en GPU real, Android/iOS físicos y navegadores distintos de Chromium. La estela es una composición 2D con profundidad visual, no una malla 3D real. Las métricas de SwiftShader incluyen capturas, lecturas de píxeles, instrumentación y pausas; no son un benchmark físico ni certifican 60 FPS. No se atribuyen todos los cuadros lentos al cursor. Los enlaces externos se validan por correspondencia y clic del componente, sin certificar disponibilidad de los sitios externos. Las limitaciones previas de procedencia de las marcas permanecen.
