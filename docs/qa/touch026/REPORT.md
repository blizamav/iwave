# TOUCH-026 — ondas interactivas móviles

Trabajo local del 2026-11-20. Sin despliegue, commit, push ni cambios de infraestructura.

## Implementación

- `img/experience/cursor.js`: reutiliza el Canvas 2D y el RAF bajo demanda de CLICK-025. Dos anillos cian `#35D6FF` / menta `#67E8C8`, radio 3–39px, expansión cúbica, desvanecimiento completo en 640ms y máximo ocho ondas. No se añaden canvas por toque, temporizadores ni otro RAF.
- Captura pasiva de Pointer Events: un toque primario sobre un control habilitado inicia un candidato. Se confirma en pointerup si todo su recorrido permanece dentro de 10px y dura como máximo 500ms, medidos con `event.timeStamp` para evitar que el tiempo de procesamiento altere la clasificación. Se dibuja desde las coordenadas clientX/clientY iniciales.
- Un movimiento que supera el umbral descarta definitivamente el candidato aunque vuelva al inicio. Scroll (también en contenedores), pointercancel, contextmenu, multitouch y limpieza general lo invalidan. Long press no crea ondas ni repeticiones. No se bloquean eventos ni se invocan acciones desde el motor.
- Delegación para enlaces, botones, inputs visibles, textarea, select, summary, roles button/link y controles con tabindex. Respeta `:disabled`, incluidos fieldsets, `inert` y ancestros con `aria-disabled=true`. Decoración y zonas vacías quedan fuera del efecto táctil.
- Touch solo usa pointerup; el handler de click acepta exclusivamente mouse primario confiable, con detail mayor que cero y puntero fino. El click de compatibilidad táctil no duplica la onda. Teclado y clic programático no dibujan. No se añaden listeners touch/click por control.
- La estela solo se actualiza con mouse fino; touch no dibuja cursor artificial. Se conserva el comportamiento CLICK-025 del clic de escritorio. Movimiento reducido impide el efecto incluso al cambiar en vivo.
- `img/experience/refinement.css`: permite mostrar el Canvas táctil y lo coloca en z-index 102 para dibujar sobre WhatsApp (101), conservando pointer-events:none. `index.html` solo versiona las dos URLs afectadas respecto del estado recibido. Sin cambio en SEO ni transiciones 3D.
- Canvas perezoso, DPR máximo 1,5, borrado completo y RAF detenido cuando no quedan ondas/estela. Canvas transparente reutilizable en reposo; la salida definitiva elimina el nodo y aborta los listeners. Resize, blur, visibilidad y preferencias conservan la limpieza común.

## Reproducción y método

```sh
node --check img/experience/cursor.js
node --check docs/qa/touch026/qa.cjs
git diff --check
node docs/qa/touch026/qa.cjs 360
node docs/qa/touch026/qa.cjs 390
node docs/qa/touch026/qa.cjs 430
node docs/qa/touch026/qa.cjs 768
node docs/qa/touch026/qa.cjs 1440
```

Ejecutar cada tamaño por separado y en secuencia. El script crea y detiene su servidor local en 11026 y reutiliza Playwright/Chromium externo ya disponible en `/tmp/iwave-qa001`, sin instalar dependencias. Chromium requiere permiso fuera del sandbox; el primer intento quedó bloqueado por el sandbox. Render usa SwiftShader, no una GPU Android.

La instrumentación del módulo se añade solo en memoria mediante interceptación de la respuesta. Los taps se envían como input confiable mediante CDP, con timestamp de generación y sin esperar a que el procesamiento de touchStart termine para programar touchEnd. La instrumentación original que esperaba ese procesamiento convirtió un tap corto en una pulsación de 649ms en tablet bajo SwiftShader; se corrigió el generador y la clasificación usa las marcas del evento.

Las capturas congelan únicamente el reloj del cursor a 140ms para documentar el anillo. Se comprueba su centro mediante los píxeles del Canvas (tolerancia menor de 1px) y se limpia la instrumentación después. La limpieza natural, transparencia y reposo del RAF se comprueban por separado, sin congelar el reloj. La captura de mouse aísla la onda de la estela antes del clic; la primera comprobación visual que mezclaba ambas fue corregida.

Los destinos externos se observan y luego se cancelan exclusivamente en QA; no se envían mensajes ni se abren aplicaciones externas. Los laterales mantienen su preventDefault propio para navegar dentro del Coverflow. La tarjeta central conserva enlace oficial y target nativo. Las capturas de menú, formulario y toda la landing no constituyen una auditoría visual completa.

## Resultados

Pendiente de consolidar la ejecución final.

## Archivos y preservación

Modificados por TOUCH-026: `img/experience/cursor.js`, `img/experience/refinement.css`, `index.html`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md` y los nuevos archivos de esta carpeta. `coverflow.js`, FIX-024, assets, SEO e infraestructura no se modificaron.

Se recibieron cambios pendientes en Dockerfile, nginx.conf, arquitectura/diseño/historial, exp009.js, journey.js, refinement.css, index.html y script.js; también archivos sin seguimiento, incluidos cursor.js, coverflow.js y evidencias anteriores. Se preservan. Copia de los archivos afectados recibidos y estado inicial en `/tmp/iwave-touch026/`; diff final revisado frente a esa copia y contra Git, sin staging.

## Límites

Chromium emulado local, sin Android físico ni otros navegadores. La medición corresponde únicamente al dibujo Canvas de las ondas con SwiftShader; excluye WebGL, GPU real y lectura de píxeles. No certifica fluidez, consumo o rendimiento en Android de gama media. No se certifican pinch zoom físico, lectores de pantalla ni aplicaciones externas; el motor no cancela eventos, oculta el Canvas a accesibilidad y preserva los controles nativos. Sin cambios de touch-action ni del gesto del Coverflow. No se repite la auditoría de SEO ni de toda la página.
