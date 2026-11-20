# FIX-021 — estabilidad del carrusel

Validación local del 2026-11-20. Sin despliegue, commit, push, instalación de dependencias ni cambios propios en infraestructura. Se conserva el estado pendiente anterior a esta solicitud.

## Diagnóstico comprobado

La geometría exterior de `.logo-showcase` ya era estable. La respiración visible procedía de su placa blanca (`.logo-viewport::before`): dependía del alto de cada marca y, durante cada transición, interpolaba durante un segundo `perspective(800px) rotateY(7deg) scale(.96)` y una sombra grande. Al reconstruir, regresaba a su transformación original. No se encontró una animación continua de width/height/padding/margin del contenedor principal ni una segunda timeline del carrusel.

La referencia anterior a 390px registró 21,7187px de variación en el alto de la placa y 112 matrices de transformación diferentes, con ancho/alto del contenedor constantes. Se revisaron HTML, cascada CSS, `exp009.js`, `journey.js`, controlador `enterprise.js`, GSAP y recursos locales; ScrollTrigger no controla la placa.

El logo DOM y los fragmentos estaban desacoplados: el DOM desaparecía mientras la placa se inclinaba/encogía; la malla añadía giro completo y desplazamientos XYZ. Su scissor correspondía al escenario completo, no a la placa. El canvas global está fuera del enlace DOM, por lo que `overflow:hidden` del enlace no podía contener WebGL. Esto permitía salir de los 16px de resguardo originales, especialmente con marcas anchas como BancoEstado.

Además, cada render llamaba `layout()`, actualizaba matrices de cámara, leía rectángulos y escribía tamaños de la marca; cada cuadro también escribía energía CSS para repintar el gradiente. Estas operaciones coexistían con las transiciones de placa y sombra. Son costes eliminados y una fuente de discontinuidad visual comprobada; no se atribuyen todos los cuadros lentos a una única causa ni se presume que la GPU de un teléfono reproduzca SwiftShader.

## Corrección

- Placa común a las cuatro marcas: 84% del ancho del escenario, máximo 680px; alto 200px o 170px hasta 540px. Sin cambios de tamaño por slide, inclinación ni escala. Alturas del escenario UX-014 conservadas.
- Logos originales con `object-fit:contain`, ajuste proporcional y 24px de margen interior. Sin recolorear, filtros ni alteración de recursos. BancoEstado conserva el arte matriz disponible y su identificación textual de Corredores de Seguros.
- Fragmentación/reconstrucción GSAP/InstancedMesh preservada. Envolvente conservadora en GLSL para los vértices, desplazamientos, rotaciones y perspectiva; contención mediante ajuste uniforme, sin cortar fragmentos. Scissor GPU a 8px del borde de la placa como resguardo adicional, por dentro de sus esquinas redondeadas.
- Retirado giro sinusoidal de la malla completa; la profundidad permanece en las piezas. Fondo de luz tenue estático, sin gradiente/sombra animados por cuadro. Botón Pausar/Reanudar con ancho mínimo constante.
- Layout invalidado por scroll, resize, ResizeObserver y cambio de marca; sin releer ni reescribir dimensiones en cada render en reposo. Se sincroniza de nuevo si GSAP cambia de marca dentro de ese cuadro.
- Texturas y shaders inicializados una vez antes de habilitar controles. Materiales y geometrías persistentes; depthWrite desactivado para fragmentos transparentes. Sin draw de fragmentos en reposo. Renderer, RAF, timeline única, pausas, controles y liberación de recursos existentes conservados.

## Matriz y rendimiento medido

Playwright externo ya disponible, Chromium headless con ANGLE SwiftShader. Los FPS son renders del motor por segundo, instrumentados solo durante QA; no son la frecuencia del RAF ni un benchmark de Android. La ventana incluye interacción, pausas para capturas y capturas. Algunas ejecuciones coincidieron con otra prueba de navegador; no es una comparación controlada de rendimiento físico.

| Ancho | Logos estables | Capturas inicio/entrada/final | Variación placa / contenedor | Overflow horizontal | FPS aprox. | Gap p95 (ms) | Long tasks | CLS sin entrada reciente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 360 | 4/4 | Sí | 0px / 0px | 0px | 20,1 | 56,7 | 1 (71ms) | 0 |
| 390 | 4/4 | Sí | 0px / 0px | 0px | 21,1 | 52,8 | 0 | 0 |
| 430 | 4/4 | Sí | 0px / 0px | 0px | 16,2 | 106,6 | 1 (54ms) | 0 |
| 768 | 4/4 | Sí | 0px / 0px | 0px | 10,3 | 296,2 | 1 (157ms) | 0,00000197 |
| 1440 | 4/4 | Sí | 0px / 0px | 0px | 9,1 | 409,5 | 1 (328ms) | 0,00000077 |

La referencia anterior a 390px produjo 17,3 FPS, gap p95 de 109,1ms y 610 mutaciones DOM del carrusel; la versión corregida produjo 21,1 FPS, p95 de 52,8ms y 293 mutaciones. Estas cifras son observaciones del laboratorio por software, no una promesa de mejora porcentual en dispositivos. La transformación de placa permanece única en todas las muestras corregidas. Los desplazamientos residuales registrados en vistas grandes son inferiores a 0,000002; no hubo variación de dimensiones del contenedor o placa. No se declara CLS cero en todas las vistas.

El instrumento de RAF registró como máximo una llamada pendiente del `tick` del motor en cada tamaño. La página también tiene el ticker GSAP/ScrollTrigger existente; el total de llamadas a RAF no equivale al número de bucles del carrusel. No se añade otro RAF.

Se evaluaron las cuatro esquinas de cada celda de las cuatro mallas en 101 pasos de progreso: 206.848 vértices proyectados por vista compacta y 310.272 a 1440px, todos dentro del área segura (tolerancia numérica 0,00001). Se comprueba la geometría antes del scissor; la contención no depende solo de ocultar un desbordamiento.

## Evidencias

- `after-ANCHO-brand-0.png` a `brand-3.png`: cuatro marcas reconstruidas; `brand-N-start.png` y `brand-N-middle.png`: salida inicial y reconstrucción intermedia. Los números de archivo indican el destino; el inicio aún muestra la marca anterior. La pausa permite inspeccionar el cuadro real de WebGL.
- [BancoEstado a 390px](after-390-brand-1.png), [Banco de Chile a 360px](after-360-brand-2.png), [Scotiabank a 360px](after-360-brand-3.png), [fragmentación a 430px](after-430-brand-1-start.png), [reconstrucción a 1440px](after-1440-brand-2-middle.png).
- `before-390*.png` y `before-390.json`: referencia del estado preexistente, no del HEAD.
- `after-ANCHO.json`: métricas, rectángulos de cada marca, enlaces, errores, muestras temporales y cálculo de contención. Las capturas incluyen el canvas global, no solo el HTML del logo.
- Revisión visual directa de muestras móviles/tablet/escritorio, cuatro marcas y fragmentación/reconstrucción. El resto de la matriz tiene capturas y aserciones; no se declara inspección humana de cada imagen.

## Interacciones

Resultados de la prueba larga en `interactions.json`; capturas de cada avance en `autoplay-390-N.png` y alternativas en `fallback-MODO-390.png`. La prueba comprueba teclado con vuelta circular, swipe horizontal/gesto vertical, pausa del autoplay y de una transición, reanudación tras resize menor, dos ciclos completos de autoplay, foco/hover, concordancia de enlaces y fallbacks sin JS/WebGL y con movimiento reducido.

Un primer intento de la prueba larga se interrumpió por cierre de Chromium mientras se ejecutaba también la matriz; había completado cinco avances sin errores JavaScript. La repetición aislada terminó correctamente: 12 comprobaciones, ocho avances consecutivos (dos vueltas completas) y cero errores JavaScript. Pausa/reanudación, resize menor, foco, hover y las tres alternativas estáticas pasaron. Se revisaron también las capturas finales de autoplay y sin JS.

## Reproducción

Desde la raíz del repositorio:

```sh
node docs/qa/fix021/qa.cjs matrix
node docs/qa/fix021/interactions.cjs
node --input-type=module --check < img/experience/exp009.js
node --input-type=module --check < img/experience/journey.js
node --check docs/qa/fix021/qa.cjs
node --check docs/qa/fix021/interactions.cjs
git diff --check
```

La matriz ejecuta los cinco anchos secuencialmente; también admite `qa.cjs after 390`. Servidores temporales Python en loopback, cerrados al terminar. Playwright en `/tmp/iwave-qa001/node_modules/playwright`, bibliotecas Chromium externas preexistentes; `IWAVE_PLAYWRIGHT` permite indicar otro módulo. No son dependencias del proyecto. El modo opcional `qa.cjs before 390` requiere la copia inicial conservada en `/tmp/iwave-fix021/before/`; esa referencia temporal no se distribuye como fuente del sitio. La instrumentación de renders/RAF y acceso a mallas se inyecta por Playwright, sin interfaces de diagnóstico añadidas a producción.

## Alcance, Git y límites

Aplicación: `img/experience/exp009.js`, `img/experience/refinement.css`; `img/experience/journey.js` e `index.html` solo cambian las consultas de versión de los recursos afectados a `fix021`. Documentación: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md` y esta carpeta de QA.

Estado inicial: modificaciones en Dockerfile, nginx.conf, los cuatro archivos de aplicación anteriores y los tres documentos; sin seguimiento `.dockerignore`, `docs/deployment/`, `docs/qa/fix019-seo020/`, `img/social/`. Se conserva todo. `docs/qa/fix021/` es el único directorio nuevo de esta tarea. Comparados los diffs de infraestructura y marcas contra el diff inicial: intactos. Comparado el HTML y journey contra las copias iniciales: únicamente cambian las URLs de recursos indicadas; metadatos SEO, contenido, recorrido UX-014 y otras secciones preservados.

Pendiente: Android de gama media/iOS físicos, percepción de fluidez con GPU real, otros navegadores y evaluación bajo carga térmica. SwiftShader aún registra cuadros lentos y long tasks, especialmente en escritorio; no se certifica ausencia de tirones perceptibles en hardware real. Los enlaces se comprueban por correspondencia de href, nombre y atributos preservados; no se certifica disponibilidad de sitios externos. Los assets de marcas y sus límites de procedencia anteriores se mantienen.
