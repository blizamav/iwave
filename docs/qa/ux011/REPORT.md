# UX-011 — validación local

Fecha de revisión: 2026-11-18. Alcance: identidad Deep Space + Electric Cyan ya implementada sobre EXP-010. Se preservan los ocho hitos, el contenido comercial y los cambios locales previos.

## Reproducción

Usar un servidor HTTP local, por ejemplo `python3 -m http.server 8771 --bind 127.0.0.1`, y ejecutar `node docs/qa/ux011/qa.cjs`. El script utiliza Playwright y bibliotecas Chromium externos existentes en `/tmp/iwave-qa001`; no instala dependencias del proyecto. Se pueden indicar otras ubicaciones con `IWAVE_PLAYWRIGHT` e `IWAVE_CHROMIUM_LIBS`, y otra URL con `IWAVE_QA_URL`.

La salida estructurada está en `results.json`; las capturas se guardan en este directorio. Una ejecución anterior quedó interrumpida durante las capturas móviles. Durante la reanudación, escritorio completó sus comprobaciones, pero la vista previa dejó de responder antes de tablet (`ERR_CONNECTION_REFUSED`); se inició un servidor local para repetir la matriz completa.

## Comprobaciones estáticas

Pasaron `node --check script.js`, `node --input-type=module --check < img/experience/journey.js`, `node --input-type=module --check < img/experience/exp009.js`, `node --check docs/qa/ux011/qa.cjs` y `git diff --check`.

## Resultado final de navegador

Ejecución completa con salida 0 en Chromium 159.0.8154.6. `results.json` registra tres matrices aprobadas y cinco alternativas aprobadas, sin errores finales ni solicitudes fallidas.

| Tamaño | Resultado |
| --- | --- |
| 1440 × 900 | Aprobado |
| 768 × 1024 | Aprobado |
| 390 × 844, DPR 2 y táctil emulado | Aprobado |

En los tres tamaños se comprobaron orden de secciones y menú, título aprobado, capturas de las ocho secciones, ausencia de overflow horizontal, cuatro soluciones y teclado, cinco capacidades, selector de problemas, geometría sin colisiones en Después, SVG sin relleno negro, morphing, avance del carrusel y enlace activo, metodología automática y pausa, validación de campos, menú/Escape/foco/ancla y modo de cursor. Sin errores JavaScript, consola o HTTP local durante esas matrices. El script registra los tokens; el contraste se calculó por separado.

Las alternativas de movimiento reducido, WebGL desactivado, JavaScript desactivado, ahorro de datos y pérdida de contexto mostraron fondo alternativo, marca estática, cuatro enlaces de trayectoria y resultado de transformación visibles, sin desbordamiento horizontal ni errores de página.

Un solo contexto WebGL observado por tamaño. Muestras del Hero: 6.40 fps en escritorio, 7.09 fps en tablet y 11.56 fps en móvil; máximos entre cuadros de 263.4, 253.6 y 153.6 ms respectivamente. Son muestras breves instrumentadas con renderizado por software: no cumplen una expectativa de fluidez de 20–30 fps en este entorno y no permiten atribuir ese rendimiento a equipos reales.

## Contraste de los tokens

Relaciones calculadas con luminancia relativa sRGB, para colores opacos:

| Texto / fondo | Relación |
| --- | --- |
| Ice White / Midnight | 18.49:1 |
| Secundario / Midnight | 10.92:1 |
| Secundario / Deep Navy | 9.56:1 |
| Terciario / Deep Navy | 7.00:1 |
| Midnight / Digital Mint | 13.11:1 |
| Electric Cyan / Deep Navy | 10.05:1 |

Estas parejas superan 4.5:1; el cálculo no certifica todos los estados con opacidad, gradientes, superposiciones ni microtextos animados de los diagramas.

## Inspección visual y límites

Revisadas capturas de Hero y Soluciones a 1440px, transformación Después, Trayectoria y Contacto a 768px, y metodología a 390px. En esas vistas no se observaron solapamientos evidentes ni cortes horizontales. La inspección es parcial: las capturas de viewport no muestran toda la altura de cada sección.

Chromium usa ANGLE/SwiftShader por software. Sus tiempos describen este entorno y no acreditan fluidez en dispositivos físicos. Quedan fuera otros navegadores, interacción física, aceptación artística final y apertura/envío real en aplicaciones de correo o WhatsApp. El formulario mantiene transporte mailto sin backend ni confirmación de recepción.

Esta continuación solo completa QA y documentación; conserva el código de la implementación existente. Sin despliegue, commit, push ni cambios de infraestructura.
