# EXP-006 — implementación y evidencia local

Ejecución: 2026-11-17. Rama `reconstruccion-iwave`. Sin despliegue, staging, commit, push ni cambios de infraestructura.

## Cambios

Motor compartido Three r170 con siete hitos narrativos, alineación DOM del Hero, movimiento ambiental continuo y selección de especialidades vinculada al color/fase del campo. GSAP y ScrollTrigger 3.14.2 locales; sin bundler. Un renderer y composición de estado de scroll, puntero y ambiente antes de renderizar.

GLSL: ascenso/circulación de partículas, reorganización gradual y desplazamiento mediante TouchTexture Canvas 128² con decaimiento. Fragment shader circular aditivo sin posprocesamiento. 960 partículas desktop y 360 compacto; buffers reutilizados. La textura registra pulsos según desplazamiento entre eventos, no una simulación hidrodinámica.

Hero conserva logo original, transparencia SVG, plataforma y anillos preexistentes; añade campo continuo y presencia espacial. Menú fullscreen con GSAP, acceso a capacidades/experiencia, foco y Escape. Antes/Después, cuatro soluciones SVG, capacidades, carrusel CSS 3D con partículas y formulario mailto se preservan; no se atribuyen como rediseños nuevos de EXP-006.

## Pruebas

Playwright/Chromium de QA-001, bibliotecas en `/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu`. Servidores locales temporales 8765/8766 cerrados al terminar. Scripts conservados en esta carpeta para reproducir (requieren Playwright y bibliotecas externas al proyecto).

- Matriz 1440×900, 768×1024 y 390×844: secciones, intermedio de transformación, cuatro soluciones, cinco capacidades, tres transiciones del carrusel, menú móvil, formulario vacío, overflow horizontal y cruces de nodos. Resultados en `results.json`: WebGL activo, sin errores de consola/HTTP en la matriz, sin overflow ni cruces medidos y SVG sin rellenos negros.
- Sin JS, sin WebGL y movimiento reducido a 390×844: Hero y transformación capturados, salida accesible visible y renderer sin activar.
- Comprobación adicional: canvas cambia durante movimiento del mouse (incluye ambiente, no aísla causalidad del shader), foco inicial del menú, Shift+Tab, Escape y capturas de menú/holograma/cursor a los tres tamaños. `extra-results.json` registra errores y media de intervalos RAF del navegador; no mide FPS del renderer ni rendimiento físico.
- Sintaxis de `script.js` y `journey.js`, `git diff --check`. Matriz ejecutada de nuevo tras corregir inicialización de composiciones. Revisión visual directa de capturas de Hero escritorio/móvil, transformación escritorio, capacidades tablet y menú; no equivale a inspección manual individual de todas las capturas.
- Incidencias corregidas durante desarrollo: ruta inicial incorrecta de libatk; referencia prematura a uniforms en la creación de registros; recorte fullscreen por backdrop-filter del header. La última requiere evidencia de menú regenerada tras su corrección.

## Evidencias

Archivos PNG en esta carpeta: `{ancho}-inicio`, `-informacion`, `-transformacion`, `-transformacion-mid`, `-servicios`, `-capacidades`, `-experiencia`, `-proceso`, `-contacto`, `-form`, `-solution-N`, `-enterprise-N`; adicionalmente `-menu`, `-cursor`, `-hologram`, `-final-{seccion}`. Alternativas: `no-js`, `no-webgl`, `reduced`.

## Límites y aceptación pendiente

Esta entrega implementa el núcleo inmersivo y navegación. No representa una aprobación de equivalencia artística con las referencias ni cumplimiento completo del brief: Antes/Después mantiene el diagrama existente y no una nueva simulación de documentos convergentes; las soluciones siguen en SVG; la trayectoria conserva dispersión CSS conceptual, sin reconstrucción del contorno de marcas ni autoplay. No se incorporaron máscaras espaciales complejas, físicas ni bloom porque no son necesarios para este núcleo.

La perturbación es sutil y requiere revisión perceptual con GPU física. No se certifican 60 FPS, memoria prolongada, touch físico, Safari/Firefox, contraste integral ni envío de correo externo. Logo raster original limita definición. Enlaces profesionales conservados, sin nueva verificación de MetLife/BancoEstado ni atribución de contratos. Las referencias Lusion/Prestaholic se consultaron por web; no se realizó auditoría visual interactiva de sus animaciones.

Git inicial: README, index, script y estilos modificados; AGENTS/docs/img/experience sin seguimiento. Se preserva esa reconstrucción. Cambios propios: index, script, estilos, journey, dos recursos GSAP locales y documentación/evidencias. Revisión mediante copias previas en `/tmp/iwave-exp006`; ningún cambio de infraestructura.

## Cierre de comprobación

Menú regenerado tras corregir backdrop-filter: comprobación adicional completada en las tres resoluciones, sin errores de consola; revisión directa del panel fullscreen 1440 y holograma 390. Media RAF orientativa: 29.28/17.06/16.56 ms respectivamente; no es medición de FPS WebGL. Sintaxis adicional de contacto y enterprise correcta. Diff propio de script comparado con copia previa; diff total de Git incluye la reconstrucción anterior y no representa exclusivamente EXP-006.

Dependencias descargadas de jsDelivr npm `gsap@3.14.2/dist`, servidas localmente, sin acceso CDN en runtime. SHA-256:
- gsap.min.js: `c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280`
- ScrollTrigger.min.js: `45327f639648f7e8ea20e3789b59723cb8f6d4fcbb0024648cf65978ca323926`
