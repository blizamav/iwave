# EXP-007 — rediseño visual y evidencia

Fecha de ejecución: 2026-11-18. Trabajo local en `reconstruccion-iwave`; sin infraestructura, dependencias de aplicación, staging, commits, push ni despliegue.

## Resultado

Antes/Después sustituye el diagrama estático por la transformación de seis documentos: cuadrículas y avisos de duplicidad → fuentes organizadas → canales de integración y centro de control. Animación finita de tres momentos, comparación inmediata y repetición. Dashboard conceptual con gráfico, estados y alertas; sin cifras comerciales inventadas. El estado HTML inicial Después conserva el contenido sin JS. Movimiento reducido elimina animación; salir del viewport u ocultar la pestaña cancela la secuencia y deja el resultado.

El muro de trayectoria presenta cuatro marcas visibles y enlazadas: MetLife, BancoEstado Corredores de Seguros, Banco de Chile y Scotiabank. Grilla 4/2 columnas, placas claras que conservan colores y proporciones, aparición y reacción de borde/flecha a hover/foco. Aclaración de experiencia del fundador en otros contextos laborales; sin atribución de contratos con iWave. BancoEstado utiliza el logo matriz con identificación textual de la filial: no se obtuvo el arte específico de Corredores de Seguros. Procedencia y formato en `../../../img/experience/brands/SOURCES.md`.

Se retiraron listas explicativas de transformación y mensajes repetidos de trayectoria; introducciones de Soluciones y Capacidades abreviadas. Fondo y demás demostraciones existentes conservados. No hay nuevo renderizador ni animación continua adicional.

## Validación

Chromium real headless con Playwright local, resoluciones 1440×900, 768×1024 y 390×844. Resultados estructurados en `results.json`.

- Estados Antes, Conexión y Después, repetición y selección mediante teclado; `aria-pressed` sincronizado.
- Documentos, núcleo y dashboard dentro del escenario en las tres resoluciones. Sin overflow horizontal al recorrer las ocho anclas principales.
- Cuatro imágenes cargadas con dimensiones intrínsecas, incluidas Scotiabank y BancoEstado. Enlaces oficiales presentes; no se atribuye disponibilidad permanente de sitios externos que aplican bloqueos.
- Sin errores de consola, excepciones de página ni respuestas HTTP de error en la matriz final.
- Regresión focalizada: cuatro soluciones, cinco capacidades y apertura/Escape del menú móvil.
- Alternativas móvil: sin JavaScript, sin WebGL y movimiento reducido; resultado Después visible y sin overflow.
- HTML: anidación, IDs únicos, anclas, ARIA y recursos locales. Sintaxis de `script.js` y `enterprise.js`, balance CSS y `git diff --check`.
- Revisión visual directa de capturas de Antes, Después y trayectoria en escritorio, tablet y móvil. Scroll nativo conservado; no hay scroll hijacking.

La primera matriz detectó que el dashboard excedía el escenario en escritorio y móvil. Corregidas alturas y repetida la prueba. Otra ejecución completó las aserciones pero quedó esperando al servidor hijo; el script final cierra servidor y navegador explícitamente. No se confunde ese problema del proceso de QA con un error del sitio.

## Capturas y reproducción

`{1440,768,390}-antes.png`, `-conexion.png`, `-despues.png`, `-experiencia.png`, `-home.png`; además `no-js.png`, `reduced.png` y `no-webgl.png`. Las capturas de componente ocultan únicamente header, salto accesible y WhatsApp fijos durante la toma para evitar superposición; las capturas completas de home mantienen la interfaz real.

`qa.cjs` inicia y cierra un servidor local 8768. Requiere las herramientas de QA ya existentes en `/tmp/iwave-qa001` y Chromium instalado fuera del repositorio:

```bash
LD_LIBRARY_PATH=/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu node docs/qa/exp007/qa.cjs
```

No se instalaron dependencias en el proyecto. No hay build configurado para esta landing estática.

## Alcance y límites

Cambios propios: `index.html`, `styles.css`, `img/experience/enterprise.js`, cuatro recursos en `img/experience/brands/`, fuentes, documentación de proyecto/arquitectura/diseño/historial y esta evidencia. `script.js`, `README.md`, motor Three.js, contacto e infraestructura no se editaron en EXP-007.

Estado Git inicial y final: README/index/script/estilos modificados; AGENTS/docs/img/experience sin seguimiento. Son cambios acumulados de la reconstrucción. Copia anterior de los tres componentes y diffs propios en `/tmp/iwave-exp007`; no se descartaron cambios previos.

No se certifican Safari/Firefox, dispositivos físicos, rendimiento de GPU real, auditoría integral de contraste ni recepción de correo. El PNG MetLife original tiene 354×80, suficiente para su tamaño mostrado; BancoEstado tiene 1280×249 y las otras dos marcas son SVG. La valoración artística final corresponde a revisión del usuario.
