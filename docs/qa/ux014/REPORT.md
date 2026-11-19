# UX-014 — validación local

Fecha de ejecución: 2026-11-19. Chromium 159.0.8154.6 mediante Playwright ya disponible en `/tmp/iwave-qa001`; sin instalar dependencias. Renderizador ANGLE/SwiftShader. No acredita fluidez de GPU real ni aceptación artística equivalente a la referencia Lusion.

## Resultado implementado

| Área | Resultado |
| --- | --- |
| Recorrido | Inicio → Transformación → Soluciones → Experiencia profesional → Capacidades → Cómo trabajamos → Contacto → Footer. Menú coincide; anclas antiguas compatibles. |
| Composición | Contenedor 1320px, espaciado 3.5–6rem en escritorio, Grid/Flex y reglas responsive conservadas. Problemas integrado mediante details, sin sección duplicada. |
| Atmósferas | Midnight/cian en Hero, Deep Navy en transformación, Royal Blue en soluciones/capacidades, neutral para marcas, progreso cian/menta y contacto sereno. |
| Three.js | Un contexto y RAF, mismos buffers y geometrías reutilizadas como contornos orbitales que evolucionan con scroll, partículas en tres profundidades y cámara suave. Capa geométrica omitida en compacto y desvanecida hacia contacto. |
| Hero | H1 y CTA intactos; holograma original, plataforma, proyección, flotación y partículas conservados, mayor equilibrio entre columnas. |
| Transformación | Comparación documental conservada y morph ampliado: fragmentación, integración, automatización, BI, plataformas, productividad y control. Datos conceptuales. |
| Soluciones | Cuatro diagramas distintos y CTA contextuales conservados; repetición autónoma cada 10s solo visible, sin cambiar selección. |
| Marcas | Una escena, placa local clara y entorno oscuro; fragmentos texturizados, rotación XYZ, desplazamiento en profundidad y reconstrucción. GSAP mueve uProgress; fondo/placa reaccionan. |
| Capacidades | Red SVG original conecta núcleo y cinco especialidades; recorrido activo iluminado y ejemplo seleccionado. |
| Proceso | Timeline GSAP existente, barra luminosa, marcador de progreso, estados activos/completos e interacción por etapa. |
| Cursor | Halo 22px con inercia CSS y estela corta translúcida, nativo preservado, sin tubos, sin cursor móvil. |
| Contacto | Copy solicitado, campos/canales conservados, formulario mailto sin backend ni confirmación ficticia. Acceso flotante despejado de carrusel/formulario. |

## Matrices ejecutadas

`results-1440.json`, `results-768.json` y `results-390.json` contienen las tres matrices aprobadas: orden DOM/menú, H1/tokens, capturas de siete capítulos, ausencia de overflow, cuatro soluciones con flechas de teclado, cinco capacidades, explorador de problemas, geometría de transformación sin colisiones, morph, carrusel siguiente/reconstrucción, ciclo autónomo/pausa, validación de campos y menú/Escape/foco/ancla. Sin errores JS/consola ni HTTP locales en las ejecuciones finales.

1440 incluye alternativas aprobadas: movimiento reducido, sin WebGL, sin JS, ahorro de datos y pérdida de contexto. Conservan contenido y logos estáticos, sin overflow. Las mediciones registran un solo contexto WebGL. Las animaciones se capturaron con `animations: allow`; no se infiere su visibilidad solo de la compilación.

Revisión visual directa: Hero, transformación documental/morph, showcase completo y fragmentado, capacidades, proceso y contacto en escritorio; Hero/Soluciones/showcase/contacto en tablet; Hero/showcase/capacidades/proceso/menú en móvil. Correcciones observadas: placa clara inicialmente demasiado amplia; geometría sobre campos/CTA compacto; WhatsApp flotante sobre controles. Las capturas `*-final-*` prevalecen sobre las anteriores para esos componentes.

Marcas completas revisadas visualmente: MetLife, BancoEstado (matriz disponible), Banco de Chile y Scotiabank. `extra-brand-3-results.json` registra el recorrido hasta la cuarta marca; capturas `brand-reconstructed-*` complementan las matrices.

Pruebas adicionales aprobadas en `extra-interactions-results.json`: pausa/reanudación, teclado anterior, swipe horizontal y preservación de gesto vertical, avance automático, estados Productividad/Control y contacto final. `final-results.json` comprueba recapturas responsive, ausencia de overflow, WhatsApp fuera de controles y selección de conexiones.

Contraste calculado a partir de tokens sRGB: texto secundario/superficie 9.56:1; títulos/fondo 18.49:1; texto terciario/superficie 7.00:1; CTA principal 13.11:1. Todos superan 4.5:1 para estas parejas; no se generaliza a cada microtexto de la escena.

## Evidencia

Capturas PNG en esta carpeta, por capítulo y ancho; estados `carousel-fragments-*`, `carousel-next-*`, `transformacion-after-*`, `morph-*`, `solution-0..3-*`, `process-intermediate-*`, `process-selected-*`, `cursor-1440`, `menu-*` y `fallback-*`. Capturas finales específicas y resultados adicionales acompañan a las matrices.

## Reproducción

Desde la raíz: `node docs/qa/ux014/qa.cjs 1440`, repetir con `768` y `390`. Cada ejecución inicia/cierra su servidor en `8771 + ancho`. `extra.cjs interactions` usa 9555 para gestos, avance automático, formas nuevas y contraste; `final.cjs` usa 9655 para recapturas y controles despejados. No ejecutar otro servidor en esos puertos. Rutas externas de Playwright y bibliotecas Chromium ajustables en el verificador principal mediante IWAVE_PLAYWRIGHT/IWAVE_CHROMIUM_LIBS.

Comprobaciones estáticas: `node --check` para JS afectado y verificadores; `git diff --check`; IDs únicos, anclas, referencias ARIA y recursos locales HTML. Diff propio comparado con `/tmp/iwave-ux014/before/`; styles.css base preservado byte a byte. README.md y AGENTS.md no editados por UX-014.

## Incidencias y límites

Una ejecución inicial de escritorio se interrumpió al cerrarse Chromium durante una captura. Una primera ejecución tablet perdió recursos porque se cerró el servidor anterior durante la carga; se corrigió aislando puertos. Los resultados finales sustituyen esas ejecuciones. Las pruebas adicionales se dividieron para contener la duración de la sesión Chromium.

- SwiftShader fue lento (mediciones crudas en JSON); no afirmar rendimiento físico. Faltan dispositivos reales, GPU real y otros navegadores.
- El arte del Hero sigue derivado del JPG original incorporado en SVG; no es vectorización. No se alteró la identidad para compensarlo.
- BancoEstado emplea la marca matriz disponible con identificación textual de Corredores de Seguros. Falta arte específico y comprobantes de autorización de las cuatro marcas; revisión de fuentes en `img/experience/brands/SOURCES.md`. No se presenta como clientes de iWave ni patrocinio.
- Contraste de tokens no equivale a auditoría exhaustiva de cada píxel de shaders, logos y microtexto SVG. Apertura/envío efectivo desde clientes de correo y destinos externos no probados.
- No se desplegó, no se hizo staging, commit ni push y no se modificó infraestructura. El git status mantiene los cambios preexistentes sin descartar ninguno.

## Estado de Git al cierre

Rama `reconstruccion-iwave`; `M README.md`, `M index.html`, `M script.js`, `M styles.css`, `?? AGENTS.md`, `?? docs/`, `?? img/experience/`. El mismo conjunto de rutas raíz estaba modificado/sin seguimiento antes de UX-014. No se añade nada al índice. README.md, styles.css y AGENTS.md no editados en esta solicitud.

Archivos de aplicación editados por UX-014: `index.html`, `script.js`, `img/experience/journey.js`, `img/experience/exp009.js`, `img/experience/refinement.css`, `img/experience/enterprise.js`. Documentación: `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md`, `img/experience/brands/SOURCES.md` y esta carpeta QA. No confundir el diff total respecto de HEAD con el diff de UX-014: incluye la reconstrucción pendiente del usuario.
