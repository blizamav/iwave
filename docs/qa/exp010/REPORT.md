# EXP-010 — validación local

Ejecutado en Chromium con Playwright externo al proyecto y WebGL SwiftShader. `node docs/qa/exp010/qa.cjs` requiere el entorno de desarrollo existente en `/tmp/iwave-qa001` y guarda capturas en `/tmp/iwave-exp010`.

- 1440×900, 768×900 y 390×900: orden de ocho secciones verificado, sin overflow horizontal ni errores de página; avance del carrusel y enlace de la marca activa comprobados.
- 390×844: fallbacks con movimiento reducido, WebGL deshabilitado y JavaScript deshabilitado. Marca estática y cuatro enlaces disponibles.
- Capturas inspeccionadas: Hero escritorio y trayectoria móvil. No se declara revisión visual integral de todas las secciones.
- Sintaxis de script principal y módulos modificados, `git diff --check` y revisión de diferencias respecto de copias previas en `/tmp/iwave-exp010`.

Pendiente: revisión artística completa de secciones y transiciones, contraste medido, teclado/menú/formulario tras esta entrega, Safari/Firefox, dispositivos físicos, DPR real, rendimiento GPU y nitidez de marca. SwiftShader no acredita rendimiento de producción. No se verificó disponibilidad de sitios externos. El logo BancoEstado es la marca matriz disponible; no se recibió arte específico de la corredora. Contacto sigue usando la aplicación de correo del visitante.
