# FIX-019 / SEO-020 — validación local

Fecha de cierre: 2026-11-20. Landing UX-014 conservada. Sin Docker, infraestructura, despliegue, commit ni push.

## Diagnóstico y alcance de la corrección

**El oscurecimiento reportado no se reprodujo en Chromium local.** Las capturas previas de 390px ya muestran los colores originales. No hay evidencia suficiente para atribuir ese síntoma exacto en el teléfono del usuario a una causa única ni para declarar probado un fallo de su GPU.

Se identificaron dos fragilidades concretas: `refinement.css` utilizaba una placa general Ice White con `inset` fijo, ampliada al 80% en móvil, sin relación con las proporciones del asset; `.is-webgl .logo-still` ocultaba el original incluso en reposo, mostrando siempre su textura fragmentada. El renderizado dependía por completo del muestreo GPU y su resolución. No se encontraron filtros de oscurecimiento ni mix-blend-mode sobre las marcas; el shader usa opacidad 1 en reposo y colores sRGB, sin iluminación física. El canvas está sobre el DOM, pero limpia el viewport de cada marca antes de dibujar; la iluminación ambiental no es una causa demostrada. Los colores oscuros de MetLife y BancoEstado y el azul de Banco de Chile pertenecen a sus assets.

La corrección muestra el archivo original nítido al completar la reconstrucción y usa WebGL durante la fragmentación. El tamaño del DOM y la placa comparte la proyección real de cada marca. Blanco puro y 16px de resguardo local, sin grandes superficies grises. Se conservan escenario, órbita, fragmentación, reconstrucción, enlaces, autoplay, pausa, teclado, swipe y nombres accesibles. No se sustituyeron ni recolorearon logos.

**BancoEstado:** continúa el recurso matriz existente con identificación textual de Corredores de Seguros. Falta el arte oficial específico de la filial; no se inventó una variante. Procedencia: `img/experience/brands/SOURCES.md`.

## Imagen social y metadatos

[Imagen generada](../../../img/social/iwave-og.jpg): JPG, 1200×630, logo original de `iwave-hologram.svg` (incluido su eslogan), Midnight, iluminación Electric Cyan y fuentes corporativas Space Grotesk/Plus Jakarta Sans. Mensaje exacto: «Elevamos la forma de trabajar con productividad digital.» Sin logos de terceros. Revisión visual efectuada.

`index.html` carecía de Open Graph y Twitter; por ello no indicaba una imagen social propia. Esto permite selección automática por los consumidores; no se inspeccionó el algoritmo ni la caché de LinkedIn. Añadidos una sola vez `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `og:site_name`, además de MIME y texto alternativo; Twitter card, title, description e image. URLs canónicas HTTPS absolutas.

Prueba local: GET del JPG con estado 200, MIME `image/jpeg`, decodificación 1200×630 y referencia exacta `https://iwave.cl/img/social/iwave-og.jpg`. Ausencia de duplicados comprobada en el DOM. Resultado en [after-1440-results.json](after-1440-results.json).

## Pruebas reales

Playwright existente y Chromium 159.0.8154.6, GPU por SwiftShader. No se instalaron dependencias. Viewports móviles con emulación táctil, DPR 1. Capturas de los cuatro logos reconstruidos en 360×950, 390×950, 430×950, 768×950 y 1440×900; sin overflow horizontal, sin errores JS/consola ni recursos locales HTTP >=400 registrados. Estados computados: filtro `none`, mezcla `normal`, opacidad `1`, placa `rgb(255, 255, 255)`.

- Revisión visual de móvil, tablet, escritorio, fragmentación y fallbacks. Colores del asset intactos y placas blancas legibles; no se aplica un umbral WCAG de texto a los colores de un logotipo. No se afirma auditoría de contraste WCAG completa.
- Avance y reconstrucción de las cuatro marcas; [fragmentación](transition-360.png).
- Flecha de teclado hacia atrás con ciclo, swipe horizontal con ciclo, pausa manual y reanudación de autoplay comprobados. [Resultados](interactions-results.json).
- [Movimiento reducido](fallback-reduce.png) y [sin WebGL](fallback-no-webgl.png): MetLife estático, controles deshabilitados e índice de cuatro enlaces, conforme al fallback preexistente. No rotan los cuatro assets en este modo.
- Sintaxis `node --check` de los módulos modificados y scripts QA; `git diff --check`.

Ejecuciones iniciales: el sandbox bloqueó sockets y Chromium; se reintentó con permisos ampliados. Dos matrices largas se interrumpieron tras capturas parciales; los resultados completos de 360/390 quedaron en `after-results.json` y los otros anchos en sus archivos individuales. Los scripts fueron ajustados para correr por ancho y liberar el proceso del servidor al terminar; no se ocultan los intentos parciales. La comparación previa usa respuestas interceptadas desde `/tmp/iwave-fix019/before/` y nunca revierte el código actual.

## Capturas comparativas

Índice de marca: 0 MetLife, 1 BancoEstado, 2 Banco de Chile, 3 Scotiabank.

| Marca | Antes móvil | Después móvil | Antes escritorio | Después escritorio |
| --- | --- | --- | --- | --- |
| MetLife | [390](before-390-brand-0.png) | [390](after-390-brand-0.png) | [1440](before-1440-brand-0.png) | [1440](after-1440-brand-0.png) |
| BancoEstado | [390](before-390-brand-1.png) | [390](after-390-brand-1.png) | [1440](before-1440-brand-1.png) | [1440](after-1440-brand-1.png) |
| Banco de Chile | [390](before-390-brand-2.png) | [390](after-390-brand-2.png) | [1440](before-1440-brand-2.png) | [1440](after-1440-brand-2.png) |
| Scotiabank | [390](before-390-brand-3.png) | [390](after-390-brand-3.png) | [1440](before-1440-brand-3.png) | [1440](after-1440-brand-3.png) |

Matriz responsive completa:

| Ancho | MetLife | BancoEstado | Banco de Chile | Scotiabank |
| --- | --- | --- | --- | --- |
| 360 | [Captura](after-360-brand-0.png) | [Captura](after-360-brand-1.png) | [Captura](after-360-brand-2.png) | [Captura](after-360-brand-3.png) |
| 390 | [Captura](after-390-brand-0.png) | [Captura](after-390-brand-1.png) | [Captura](after-390-brand-2.png) | [Captura](after-390-brand-3.png) |
| 430 | [Captura](after-430-brand-0.png) | [Captura](after-430-brand-1.png) | [Captura](after-430-brand-2.png) | [Captura](after-430-brand-3.png) |
| 768 | [Captura](after-768-brand-0.png) | [Captura](after-768-brand-1.png) | [Captura](after-768-brand-2.png) | [Captura](after-768-brand-3.png) |
| 1440 | [Captura](after-1440-brand-0.png) | [Captura](after-1440-brand-1.png) | [Captura](after-1440-brand-2.png) | [Captura](after-1440-brand-3.png) |

## Reproducción

Desde la raíz del repositorio, con Playwright y Chromium ya disponibles en las rutas de los scripts:

```sh
node docs/qa/fix019-seo020/social.cjs
node docs/qa/fix019-seo020/qa.cjs after 360
node docs/qa/fix019-seo020/qa.cjs after 390
node docs/qa/fix019-seo020/qa.cjs after 430
node docs/qa/fix019-seo020/qa.cjs after 768
node docs/qa/fix019-seo020/qa.cjs after 1440
node docs/qa/fix019-seo020/interactions.cjs
```

`IWAVE_PLAYWRIGHT` admite otra instalación existente; `IWAVE_QA_URL` permite usar otro servidor. La comparación `before` requiere la copia previa de los cuatro archivos en `/tmp/iwave-fix019/before/`. La composición social requiere acceso a Google Fonts; el generador comprueba la fuente corporativa antes de producir el JPG. No añade fuentes remotas a la landing: esta ya las utilizaba.

## Archivos y Git

Aplicación: `index.html`, `img/experience/exp009.js`, `img/experience/journey.js` (consulta de caché), `img/experience/refinement.css`, nuevo `img/social/iwave-og.jpg`. Documentación: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, entrada propia en `docs/CHANGELOG.md`, esta carpeta de QA.

Preexistentes preservados: `Dockerfile`, `nginx.conf`, cambios DEPLOY-017 en `docs/CHANGELOG.md`, `.dockerignore` y `docs/deployment/`. `styles.css`, `script.js` y los cuatro assets de terceros intactos. Sin staging, commit, push ni publicación.

## Pendientes y límites

- Reproducir el oscurecimiento original en el teléfono/navegador afectado; no atribuirlo retrospectivamente a una causa no demostrada.
- Arte oficial específico de BancoEstado Corredores de Seguros; el recurso matriz es el límite heredado.
- Validación en teléfonos físicos, Safari/Firefox y rendimiento GPU físico: SwiftShader no acredita fluidez real.
- Los cambios son locales. La URL HTTPS de la imagen está preparada para una publicación futura autorizada; no se ha comprobado el nuevo recurso en producción ni actualizado/verificado públicamente la caché de LinkedIn.
