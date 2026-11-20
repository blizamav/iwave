# CLICK-025 — Water Ripple / Digital Liquid Touch

Cambio local del 2026-11-20, junto a la evidencia de FIX-024. Sin deploy, commit ni push.

## Implementación y alcance

- `img/experience/cursor.js`: dos anillos concéntricos con gradiente Electric Cyan / Digital Mint, expansión cúbica de 3 a 39px y desvanecimiento en 640ms. Límite de ocho ondas; descarta la más antigua al llegar al límite.
- Comparte Canvas 2D, DPR máximo 1,5 y RAF bajo demanda con la estela. No añade nodos por clic, renderizadores, dependencias ni loops. `pointer-events:none` y coordenadas viewport. El handler pasivo en captura permite observar también las tarjetas que detienen propagación.
- Solo clic primario confiable de mouse; sin ondas por movimiento, teclado, clic derecho, scripts o touch. Reduced-motion desactiva el efecto también al cambiar en vivo. Resize, blur, pointerleave, visibilidad y pagehide comparten limpieza de estela/ondas; AbortController libera listeners en salida definitiva.
- `index.html`: cambia únicamente la versión de carga del cursor respecto del estado recibido. Documentación actualizada en arquitectura, diseño e historial.
- Carrusel, sincronización GPU/DOM, WhatsApp, partículas, CSS, contenidos e infraestructura de FIX-024 no se modifican. Cambios preexistentes preservados; copia de los archivos afectados recibidos en `/tmp/iwave-click025/before/`.

## Reproducción

`node --check img/experience/cursor.js`, `node --check docs/qa/fix024/click025.cjs`, `git diff --check` y `node docs/qa/fix024/click025.cjs`.

El verificador reutiliza Playwright/Chromium externo de FIX-024, crea un servidor temporal en 11025 y lo detiene al terminar. La primera ejecución requirió permiso fuera del sandbox porque este bloqueó el inicio de Chromium. No se instalaron dependencias. El navegador usa SwiftShader.

La instrumentación de QA expone estado del cursor únicamente mediante una respuesta interceptada en memoria. Los clics se envían con el mouse de Playwright y llegan como eventos confiables. Los enlaces externos se interceptan en el documento de prueba para conservar la página; se comprueba que el cursor no cancele el evento y se registran los destinos, sin abrir correo ni enviar mensajes. Los laterales conservan su cancelación propia para navegar dentro del carrusel.

La captura de onda a 140ms congela solo el reloj del cursor mediante instrumentación de QA, después de un clic real y una limpieza de la estela previa; no se modifica el código servido en producción. La desaparición se comprueba antes, con un clic independiente, mediante el RAF natural y transparencia total del canvas. El cuadro congelado se limpia explícitamente al terminar su captura para no mezclar instrumentación y comprobación del ciclo natural.

## Resultado de la ejecución final

- Chromium/SwiftShader: **PASS**, 11 clics de controles registrados. Anterior/siguiente y ambos laterales cambian el índice esperado; menú, navegación, CTAs y contacto conservan su comportamiento.
- Centro comprobado frente a las coordenadas del mouse y los dos arcos renderizados. Imagen de prueba a 140ms: 316 píxeles con alfa superior a 8; caja visible centrada en (600,450). Se inspeccionó visualmente la captura de onda.
- Ciclo natural completo: **cero píxeles con alfa distinto de cero**, cero ondas activas y RAF detenido. Sin ondas por movimiento, clic derecho, teclado ni clic programático; ráfaga, resize y cambio de preferencia comprobados.
- Canvas fijo; ancho/alto del documento y ancho del contenido iguales antes y después de los clics. El CLS total de la página se registra aparte en el JSON, pues incluye el recorrido y las animaciones existentes.
- Móvil 390×844: tap sin canvas artificial y desplazamiento disponible. Desktop 1440×900 y resize a 1280×800; reduced-motion inicial sin canvas y cambio en vivo con limpieza. Sin WebGL, onda disponible.
- **Cero errores registrados** de consola, ejecución o recursos en la ejecución final. Sintaxis del cursor y del verificador, `git diff --check`, diff propio frente al estado recibido y estado Git revisados. Verificada igualdad exacta del HTML recibido salvo la versión del recurso del cursor.
- 120 muestras con ocho ondas: media **0.083ms**, máximo **0.400ms**, exclusivamente para el dibujo del cursor. Sin render loop adicional. No se certifica rendimiento en hardware físico.

## Límites

Prueba automatizada local de Chromium, sin dispositivos físicos ni otros navegadores. La medida del cursor excluye WebGL, capturas y lectura de píxeles; no certifica fluidez de producción ni el coste GPU final. No se repite la auditoría completa del sitio ni se abren aplicaciones externas. Evidencia específica en [resultados JSON](click025.json), [onda](click025-desktop-ripple.png), [borrado](click025-desktop-cleared.png) y [móvil](click025-mobile.png); los informes y capturas previos de FIX-024 se conservan.
