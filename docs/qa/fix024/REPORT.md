# FIX-024 — sincronización, WhatsApp y limpieza visual

Trabajo local del 2026-11-20. Sin deploy, commit ni push. Se preservaron los cambios existentes de UX-022/CURSOR-023 y los demás cambios pendientes, incluida infraestructura.

## Causas y correcciones

**Retardo Three.js.** `change()` notificaba `animate:false` al mover las tarjetas. Un `setTimeout(finishMotion, 820)` esperaba la llegada; solo `finishMotion()` emitía `animate:true`. Entonces `exp009.js` creaba una timeline GSAP adicional de 800 ms. No era una carga tardía de texturas: las cuatro texturas y shaders ya se precalentaban. El motor iniciaba la reconstrucción después de terminar la transición CSS de 800 ms.

**Sincronización.** `coverflow.js` dirige una timeline GSAP de 800 ms y cuatro pistas WAAPI pausadas. Cada actualización busca `currentTime = progreso × 800` y comunica ese mismo progreso a WebGL mediante `coverflowchange`. La marca saliente se fragmenta y se estabiliza en el lateral; la entrante reconstruye continuamente desde `uProgress=0,48` hasta `0`, conservando la intensidad inicial de reconstrucción preexistente. Ambas sustituyen temporalmente su imagen DOM, evitando duplicados. No existe timeline independiente ni temporizador de llegada. Solo permanece el temporizador de autoplay de 7,5 segundos.

El shader conserva las celdas texturadas InstancedMesh, rotaciones tridimensionales, dispersión y envolvente FIX-021. Proyecta el resultado local usando la matriz CSS real de cada tarjeta y la perspectiva de 1100px del escenario. Scissor independiente limita el dibujo al escenario y a la placa móvil. Al completar, se limpian mallas, uniformes, atributos y raster anterior antes de volver a los assets originales. No se añadió renderer, contexto WebGL, geometría por frame ni render loop.

Todos los controles comparten un bloqueo breve mientras hay una transición activa. Pausa/reanudación, visibilidad y salida del viewport suspenden el mismo reloj. Sin WebGL o si una textura todavía no está lista, la navegación DOM continúa sin esperar. Reduced motion navega instantáneamente, sin autoplay ni cursor artificial.

**WhatsApp.** El observador de `.logo-showcase,#contacto` agregaba `body.is-contact-context`; una regla final aplicaba `visibility:hidden; opacity:0; pointer-events:none`. Se retiraron el observador y esa regla. Además, el menú fullscreen pertenece al contexto de apilamiento del header (`100`), superior al botón original (`40`). El botón usa ahora `101`, derivado de esa capa, conservando su posición fija como hijo de body, enlace original y tamaño mínimo de 48px. Canvas WebGL permanece en `12`; no se alteró la navegación ni el tamaño/posición de sus controles.

**Geometría no deseada.** El grupo `system` de `journey.js` contenía cajas con `EdgesGeometry`/`LineSegments`, conexiones y pulsos. En escritorio estaba visible, se transformaba según el scroll y el compositor lo dibujaba sobre el DOM. La captura anterior muestra esos polígonos cruzando Banco de Chile. Se desactivó únicamente la representación de ese grupo, tanto en inicialización como en resize. El guard existente evita sus actualizaciones por cuadro al estar oculto. Permanecen partículas, atmósferas, anillo CSS del Coverflow, cursor Canvas 2D, fragmentación y escenas funcionales de transformación.

## Medición temporal

La reproducción anterior usa las fuentes preservadas en `/tmp/iwave-fix024/before/`, sin capturas durante el muestreo (`before-timing.json`).

| Marca entrante | Primera muestra de movimiento | Inicio fragmentación desde solicitud | Desfase observado |
| --- | ---: | ---: | ---: |
| BancoEstado | 65,0 ms | 821,7 ms | 756,7 ms |
| Banco de Chile | 609,5 ms | 822,4 ms | 212,9 ms |
| Scotiabank | 285,9 ms | 821,2 ms | 535,3 ms |
| MetLife | 244,2 ms | 824,3 ms | 580,1 ms |

Las primeras muestras de movimiento varían por los bloqueos de SwiftShader. Lo estable es el inicio posterior de fragmentación a los **821–824 ms desde la solicitud**, coincidente con el final del movimiento. Su final anterior ocurrió entre 1685 y 4049 ms desde la solicitud en esa ejecución.

Después: activación WebGL en el propio evento `start`, **0 ms de separación lógica** entre las actualizaciones de tiempo de tarjetas y progreso GPU, y finalización en el mismo evento `complete`. Los JSON por resolución registran los tiempos de eventos, progreso, `currentTime` de las cuatro pistas, uniformes y limpieza final, para las cuatro marcas en manual y autoplay real. Se comprueba que la reconstrucción entrante decrezca continuamente durante el movimiento y que cada pista coincida con `progreso × 800` con tolerancia de 0,01 ms.

Esta medición comprueba la orquestación JavaScript y el estado entregado al renderer; no mide latencia física de presentación de píxeles. El renderer existente tiene su propia cadencia adaptativa. Las pausas del software renderer pueden alargar el tiempo real total, aun compartiendo ambos mecanismos el mismo progreso. **No se certifican 60 FPS reales ni fluidez en Android/iOS físicos.** `before.json` corresponde a la primera captura diagnóstica con screenshots intermedios; no se usa como medición comparable.

Duración real observada en la ejecución final (ms, reloj de pared; `summary.json`):

| Ancho | Manual, mínimo–máximo | Autoplay, mínimo–máximo |
| --- | ---: | ---: |
| 360 | 792.6–2246.2 | 807.1–818.1 |
| 390 | 798.0–3006.0 | 812.4–862.2 |
| 430 | 748.3–8334.0 | 805.2–815.0 |
| 768 | 785.6–12557.4 | 814.9–839.1 |
| 1440 | 705.7–8855.4 | 803.2–820.9 |

Los máximos manuales incluyen la primera transición bajo SwiftShader. No deben interpretarse como 800 ms garantizados en este entorno ni como resultados de GPU física.

## QA reproducible

Playwright y Chromium existentes fuera del proyecto; sin dependencias instaladas. Chromium headless con SwiftShader y bibliotecas locales. El sandbox impidió arrancar Chromium; las ejecuciones de navegador se realizaron con aprobación fuera del sandbox.

```bash
node docs/qa/fix024/qa.cjs matrix
node docs/qa/fix024/qa.cjs layers
node docs/qa/fix024/qa.cjs bounds
node docs/qa/fix024/qa.cjs before
node --check img/experience/coverflow.js
node --check img/experience/exp009.js
node --check img/experience/journey.js
node --check script.js
git diff --check
```

`before` requiere la copia temporal de fuentes de esta sesión. Los JSON y las capturas anteriores se conservan como evidencia independiente de esa copia.

Matriz: **360×800, 390×844, 430×932, 768×1024, 1440×900**, más no-WebGL y reduced-motion a 1440×900.

- Cuatro marcas en manual y cuatro cambios con el temporizador real de autoplay en cada resolución con WebGL; inicio/progreso/final coordinados, originales visibles al terminar y sin fragmentos activos después.
- Anterior, siguiente, ambas tarjetas laterales, teclado y swipe sintético; ocho solicitudes rápidas producen un solo avance; pausa congela tanto transformaciones como uniformes y reanuda hasta el final.
- WhatsApp visible, fixed, de tamaño accesible y alcanzable con `elementFromPoint` en las siete secciones, durante transición y con menú abierto. Clic Playwright real sobre el enlace, interceptado localmente: URL exacta conservada, sin abrir WhatsApp externo ni enviar mensajes.
- Grupo geométrico ambiental desactivado; capturas laterales y durante transición/autoplay. Contención local evaluada en 101 progresos por marca: **310.272 vértices por resolución**, todos dentro de la envolvente; `bounds.json`. Esta prueba matemática usa la malla de escritorio al redimensionar; la matriz principal también carga las mallas compactas desde el inicio.
- Cursor produce píxeles visibles en desktop/tablet y sin WebGL. Reduced-motion no crea estela ni autoplay y mantiene navegación instantánea. Sin WebGL conserva navegación 3D DOM y controles.
- Sin overflow horizontal, errores JavaScript/de consola ni recursos HTTP faltantes en las ejecuciones finales de la matriz. Sintaxis y whitespace comprobados.

Una ejecución agrupada de la matriz final terminó con señal 143; se completaron los tamaños restantes mediante ejecuciones individuales. El primer instrumento escuchaba el evento en document, pero el evento no propaga. Se corrigió para escuchar en el host y exigir exactamente cuatro transiciones manuales registradas, y se repitió la matriz. Las ejecuciones finales sobrescriben los resultados intermedios.

## Capturas comparativas

- [Antes: polígonos sobre tarjeta lateral y WhatsApp oculto](before-settled.png).
- [Antes: movimiento sin fragmentación](before-transition.png).
- [Después: mismas marcas y lateral limpio](1440-brand-1.png).
- [Después: fragmentación durante desplazamiento](1440-transition.png).
- [Móvil: transición 360px](360-transition.png).
- [WhatsApp durante transición](1440-whatsapp-final.png).
- [WhatsApp sobre menú fullscreen](390-menu-whatsapp.png).

Cada tamaño incluye cuatro marcas (`ANCHO-brand-N.png`), transición, viewport y capturas adicionales de WhatsApp/menú. La inspección visual directa se realizó sobre las capturas diagnósticas de escritorio y una transición móvil y el menú móvil con WhatsApp; la matriz también aplica comprobaciones de estado y geometría. No se afirma una revisión artística exhaustiva de todas las capturas ni validación en otros navegadores/dispositivos.

## Archivos y preservación

Aplicación: `img/experience/coverflow.js`, `exp009.js`, `journey.js`, `refinement.css`, `script.js` y versionado de sus recursos en `index.html`. Documentación: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md`; scripts, JSON, capturas e informe nuevos en `docs/qa/fix024/`.

Se revisaron diff y status. Al inicio ya estaban modificados Dockerfile, nginx.conf, los tres documentos, exp009.js, journey.js, refinement.css, index.html y script.js; coverflow.js ya existía sin seguimiento, junto con cursor.js, .dockerignore, documentación de despliegue, QA anterior y assets sociales. Esos cambios se conservaron. No se editaron Dockerfile, nginx.conf, despliegue, SEO, contenido comercial ni otras secciones. El diff respecto de HEAD incluye trabajo anterior; `changes.patch` delimita las modificaciones de esta solicitud frente a la copia inicial. Estado final completo en `git-status.txt`.
