# CLICK-025 — interacción funcional del Coverflow

Trabajo local del 2026-11-20. Evidencia junto a FIX-024; conserva la entrega previa de ondas. Sin infraestructura, dependencias nuevas, deploy, commit ni push.

## Inspección del estado recibido

`coverflow.js` ya generaba cuatro enlaces persistentes a partir de `.trust-brand` del HTML. Cada clon conservaba `target="_blank"` y `rel="noopener noreferrer"` de `.logo-viewport`.

- El handler de cada tarjeta ya cancelaba el enlace lateral y llamaba a `change(-1/1)`; la central en reposo conservaba navegación nativa.
- Touch ya compartía los clics laterales y tenía swipe horizontal con `touch-action:pan-y`, sin cancelar gestos verticales.
- Enter ya activaba los enlaces; faltaba Space, que desplazaba la página. Los laterales se anunciaban como enlaces aunque su acción era centrar una marca.
- `change()` ya bloqueaba solicitudes mientras existía `animation`, reiniciaba `remaining=7500`, usaba una única timeline GSAP de 800ms y buscaba las cuatro pistas WAAPI; FIX-024 compartía ese progreso con ambas marcas GPU.
- `stop()` cancelaba el temporizador activo antes de programar otro; hover/foco, pausa, viewport y visibilidad suspendían autoplay. No se añadió otro scheduler.

## Cambios mínimos

- `img/experience/coverflow.js`: Space activa la tarjeta mediante el enlace existente, evita scroll y repetición. Enter conserva su comportamiento nativo. Rol `button` para laterales y `link` para la central; tarjeta oculta sigue inert.
- El filtro del clic posterior a swipe deja pasar las activaciones de teclado (`detail=0`). Cada nuevo pointerdown, también de mouse, limpia el flag residual. La prueba combinada reprodujo que un swipe sin clic posterior podía consumir un clic nuevo de mouse; este reinicio corrige el caso.
- `index.html`: solo versión del recurso Coverflow respecto del estado recibido. Documentación permanente actualizada en arquitectura, diseño e historial.
- `cursor.js` y sus ondas, logos, CSS, motor Three.js, timeline y scheduler originales preservados. Copias de archivos recibidos en `/tmp/iwave-click025-coverflow/before/`; se distinguen de todos los cambios previos sin confirmar.

## Validación reproducible

- `node --check img/experience/coverflow.js`
- `node --check docs/qa/fix024/coverflow-click025.cjs`
- `node docs/qa/fix024/coverflow-click025.cjs`
- `node docs/qa/fix024/coverflow-click025.cjs gpu`
- `git diff --check`, diff propio frente a copia recibida y `git status --short`.

El verificador reutiliza Playwright/Chromium externo, sin instalar dependencias. Sirve el sitio en un servidor temporal en 11026 y lo detiene al terminar. Requiere ejecución fuera del sandbox porque este bloquea Chromium.

La matriz 360/390/430/768/1440 comprueba el controlador DOM sin WebGL; el modo GPU adicional usa Chromium/SwiftShader a 1440px. Mouse, taps, teclado y swipe se envían mediante entradas de navegador; la ráfaga de diez solicitudes usa clics DOM en una tarea para comprobar el bloqueo de forma determinista. En el modo GPU, el inicio y la pausa se solicitan en una misma tarea mediante los botones existentes para asegurar una muestra congelada antes del primer frame lento de SwiftShader. La instrumentación de QA lee el estado del módulo y los eventos de transición solo mediante rutas interceptadas en memoria.

Las cuatro páginas oficiales se interceptan localmente **en sus pestañas nuevas**, verificando las URLs ya presentes en el HTML. No se certifica disponibilidad ni contenido remoto. Cada ancho espera un ciclo real de autoplay de 7,5 segundos y cuenta sus timers activos, incluidos los reanudados con tiempo restante.

## Resultados de la matriz DOM

| Ancho | Clics laterales / central | Touch y swipe | Enter / Space | Autoplay / pausa / ráfaga | Errores |
| --- | --- | --- | --- | --- | --- |
| 360px | PASS | PASS | PASS | PASS | 0 |
| 390px | PASS | PASS | PASS | PASS | 0 |
| 430px | PASS | PASS | PASS | PASS | 0 |
| 768px | PASS | PASS | PASS | PASS | 0 |
| 1440px | PASS | PASS | PASS | PASS | 0 |

En cada ancho se abrieron las cuatro URLs existentes en pestañas nuevas, Space no desplazó la página, los taps centraron ambos laterales y el swipe avanzó una sola posición. Una ráfaga de diez solicitudes inició una transición. Pausa congeló el reloj y reanudar completó el movimiento. Autoplay avanzó tras un ciclo real con **máximo un temporizador activo**; navegación manual pausada restableció 7500ms sin programar otro. Las cuatro imágenes cargaron, no hubo overflow horizontal y las pistas WAAPI coincidieron con `progreso × 800ms`. Capturas del componente guardadas por ancho; inspección visual de la captura de 360px.

`cursor.js` coincide byte a byte con la copia recibida; el HTML solo cambia la versión del recurso Coverflow. Sintaxis y whitespace comprobados, diff propio y estado Git revisados.

## Resultado GPU adicional

Chromium/SwiftShader a 1440px: **PASS**, con las mismas interacciones y cero errores registrados. Los eventos `start` y `progress` activaron fragmentación, las cuatro pistas WAAPI buscaron el mismo progreso compartido y todos los eventos `complete` dejaron sin atributo de fragmentación al escenario y ambas mallas con opacidad cero. Pausa/reanudación y autoplay también pasaron con un máximo de un timer.

La función `change()` completa y las funciones de scheduler se compararon con la copia recibida y son idénticas; se conserva la timeline de FIX-024. No se agregó otro render loop ni renderer.

## Evidencia y límites

Resultados: `coverflow-click025.json`, `coverflow-click025-gpu.json` y capturas `coverflow-click025-*.png`. No se sustituyen los informes ni las capturas anteriores de FIX-024 o de ondas CLICK-025.

Prueba local automatizada en Chromium; dispositivos táctiles físicos, lectores de pantalla, otros navegadores y rendimiento de producción pendientes. Swipe real emulado mediante entrada touch de Chromium y comprobación de `pan-y`; no equivale a probar gestos físicos en iOS/Android. Sin auditoría ajena al Coverflow.
