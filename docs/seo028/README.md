# SEO-028 — SEO técnico y branding de iWave

**Publicado en https://iwave.cl** desde el commit aprobado `1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9`. Web iniciada a las 2026-11-23T22:07:49.241228238Z y publicación validada a las 2026-11-23T22:08:42Z. Se actualizó únicamente el servicio web, aplicando el parche estático aprobado. NPM, API/volúmenes, Cloudflare, DNS y servicios de respaldo se conservaron. No se enviaron correos reales.

Evidencia, imágenes, estado de todos los servicios y rollback en [DEPLOYMENT.md](DEPLOYMENT.md), [HTTP público](production-http-results.json) y [navegador público](production-browser-results.json). La preparación previa se validó sin desplegar sobre la referencia 5549c26; sus resultados y capturas se conservan abajo. El empaquetado probado ya se incorporó en Dockerfile, nginx.conf y .dockerignore de esta rama; el parche permanece como registro reproducible.

## Antes y después

| Área | Auditoría inicial | Versión publicada |
| --- | --- | --- |
| Idioma | es | es-CL |
| Title | iWave / productividad digital / operación | iWave / automatización y productividad digital / Chile; 55 caracteres |
| Descripción | Comercial, sin foco geográfico explícito | 154 caracteres; procesos, datos, soluciones, BI y empresas en Chile |
| Canonical y viewport | Correctos | Conservados, canonical https://iwave.cl/ |
| Robots HTML | Sin etiqueta explícita | index,follow,max-image-preview:large |
| OG / Twitter | Presentes; descripción muy breve | Título/descripción coherentes, locale es_CL, alt de imagen en Twitter |
| Logo para buscadores | Sin Organization | Organization.logo usa el JPG oficial existente y público |
| JSON-LD | Ausente | Organization, WebSite y cuatro Service del contenido real |
| Favicon | Sin etiquetas; /favicon.ico público 404 | ICO 16/32/48 y PNG 48/192/512; Apple 180 |
| Sitemap | No hay archivo; público 404 | XML con solo https://iwave.cl/, sin fechas inventadas |
| robots.txt | Público 200, gestionado por Cloudflare; sin Sitemap | Archivo del origen permite landing/recursos y excluye rutas técnicas; conserva política Cloudflare |
| Encabezados y ALT | H1 único; 7 img con ALT y dimensiones | Conservados íntegramente |
| Apariencia / FORM-027 | Diseño vigente | Body idéntico; CSS, JS, API y texturas originales intactos |

Metadatos y JSON-LD solo cambian `<head>`; `lang` cambia en html. No se añadieron textos visibles, títulos H1-H4, keywords ocultas, métricas, clientes, certificaciones, ratings, direcciones ni perfiles sociales. No existe SearchAction inventada. Service expresa los cuatro servicios presentes; no promete un resultado enriquecido específico de Google.

## Identidad: fuente oficial y derivados

Fuente única: **img/logo/iwave.jpg**, 1254×1254, 72.884 bytes. No se sustituye el arte de header, Hero, holograma o redes sociales. Organization referencia ese JPG completo; no se genera una copia de mayor peso.

Derivados mecánicos del emblema existente: recorte x=300, y=275, ancho=720, alto=365 del JPG; escalado proporcional, centrado con margen y fondo Midnight #050B14. No hay redibujado, cambio de colores del emblema, IA generativa ni deformación. Los PNG usan compresión sin pérdida; el JPG original conserva su hash.

| Archivo nuevo | Tamaño | Bytes |
| --- | --- | --- |
| favicon.ico | PNG internos 16, 32 y 48 | 3.596 |
| img/logo/favicon-48x48.png | 48×48 | 2.031 |
| img/logo/favicon-192x192.png | 192×192 | 18.927 |
| img/logo/favicon-512x512.png | 512×512 | 91.717 |
| img/logo/apple-touch-icon.png | 180×180 | 17.097 |

Se conservó la imagen OG existente, 1200×630 y 88.239 bytes, y sus dimensiones/tipo/alt. Se declararon URLs estables para los iconos; no se creó manifest de PWA ni nuevas dependencias de ejecución.

Inventario de **todas las imágenes** con dimensiones, bytes y SHA-256: [audit.json](audit.json). No hay binarios duplicados que deban eliminarse; las referencias repetidas de MetLife corresponden a fallback, muro y textura del carrusel. Las dimensiones declaradas de las marcas son sus cajas de composición existentes: cambiarlas por el aspect ratio nativo podría alterar el layout. Por eso no se renombró, eliminó, recomprimió ni reencuadró ninguna imagen visible o textura Three.js. Ya había lazy loading en referencias secundarias y prioridad alta en el Hero; se preservan esas decisiones.

## Rastreo y acceso público: alcance real

[public-baseline.json](public-baseline.json) registra la lectura del sitio antes del despliegue: home, logo oficial, OG y robots responden 200; favicon raíz y sitemap responden 404. **Estado posterior:** los archivos nuevos ya responden HTTP 200 en producción; ver [resultados públicos](production-http-results.json). El baseline se conserva como evidencia del antes.

El origen anterior no copiaba robots.txt/sitemap.xml/favicon.ico a la imagen ni admitía sus rutas estáticas. La versión publicada ya los empaqueta y sirve. El parche [static-publication.patch](static-publication.patch) añade solo el empaquetado y las dos rutas estáticas exactas. No modifica las rutas API, seguridad general, imágenes o JavaScript. Se aplicó solo tras la autorización de publicación; `git apply --reverse --check` confirma su incorporación en la fuente actual.

Se probó la configuración propuesta en un Nginx temporal **sin red ni puertos publicados**, con usuario 101, filesystem de solo lectura y archivos públicos montados. nginx -t correcto; HTTP 200 interno para robots, sitemap, ICO, cuatro PNG y logo oficial. Ese ensayo fue la validación previa; el despliegue posterior y las verificaciones del dominio se registran por separado.

El robots público incluye contenido administrado por Cloudflare. Según [su documentación](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/), al recibir un robots propio del origen con 200, Cloudflare antepone su contenido gestionado. No se borran ni copian sus reglas en el repositorio: se conserva la política del panel. Googlebot y Bingbot pueden rastrear la home actual y la política del origen propuesta. Las restricciones existentes para otros agentes, incluidos Baiduspider/PetalBot, continúan bajo la política Cloudflare; no se habilitaron bots bloqueados. Revisar el resultado combinado después de una publicación autorizada.

El sitemap contiene únicamente la URL canónica de la landing. Se excluyen API, health, documentación, administración, privados y anclas de secciones. No se inventan lastmod, prioridades o frecuencias. Robots no es una barrera de seguridad ni garantiza desindexar URLs técnicas: se conservan las restricciones HTTP existentes y se evitan esas URLs en el sitemap. CSS, JS, fuentes e imágenes no se bloquean.

## Estructura, enlaces y accesibilidad

Auditoría estática: HTML balanceado, IDs únicos, anclas internas válidas, archivos enlazados presentes y metadatos no duplicados. Se conservan 1 H1, 6 H2, 14 H3, 4 H4 y 7 imágenes con ALT/dimensiones. Los SVG informativos ya tienen nombre accesible y los lienzos/capas decorativas permanecen aria-hidden. No se cambian etiquetas o textos que afecten al diseño ni se ocultan contenidos comerciales.

Enlaces externos auditados en [external-links.json](external-links.json): iWave, WhatsApp, BancoEstado y Scotiabank respondieron 200. MetLife rechazó la solicitud automatizada con 403; Banco de Chile no completó HEAD antes del timeout. Se conservan sus URLs oficiales; esas respuestas no prueban que estén rotas ni autorizan sustituirlas. Las variantes de WhatsApp preservan teléfono y texto comercial; no se envían mensajes.

## Evidencia visual y funcional

[Resultados de navegador](browser-results.json):

| Vista | Tamaño de captura | Píxeles diferentes | Geometría |
| --- | --- | --- | --- |
| Móvil | 390×9552 | 0 | Idéntica |
| Tablet | 768×8120 | 0 | Idéntica |
| Escritorio | 1440×7693 | 0 | Idéntica |

Capturas completas, no mockups de diseño: [móvil antes](evidence/before-390.png), [móvil después](evidence/after-390.png), [tablet antes](evidence/before-768.png), [tablet después](evidence/after-768.png), [escritorio antes](evidence/before-1440.png), [escritorio después](evidence/after-1440.png).

Para comparar píxeles se fija reloj/azar y se usa movimiento reducido con fuentes reales y widget simulado idéntico en ambas versiones. Esto no mide fluidez ni certifica por sí solo WebGL animado. Se hizo además una ejecución sin movimiento reducido: canvas `.journey-scene.is-ready`, WebGL activo, cuatro tarjetas Coverflow y navegación siguiente correctos, sin excepciones JS. El body, CSS, módulos de experiencia, formulario y backend coinciden con la versión anterior; no se cambiaron animaciones ni ciclos.

FORM-027: **25/25 pruebas backend aprobadas**; `docs/contact-form/browser.cjs` aprobado en 390/768/1440 px con widget/API simulados, incluidos errores, doble envío y resultado incierto. Sin .env ni envío real. No se revalidó el buzón ni se consumieron tokens reales de Turnstile. No se midió un CLS, Lighthouse o Core Web Vitals numérico; no se inventan puntuaciones. No se ejecutó el validador online de Google: la sintaxis JSON-LD y sus referencias/tipos se validaron localmente.

## Reproducir las verificaciones

No añade dependencias al sitio. Node >=24 para herramientas; Python estándar; Playwright de desarrollo ya instalado fuera del repo. Si hace falta, indicar PLAYWRIGHT_MODULE y PLAYWRIGHT_LIBS como en FORM-027.

```bash
python3 docs/seo028/audit.py
node docs/seo028/qa.cjs
node --test contact-api/test/contact.test.mjs contact-api/test/verify-smtp.test.mjs
node docs/contact-form/browser.cjs
git apply --reverse --check docs/seo028/static-publication.patch
git diff --check
```

Generación opcional de iconos: `node docs/seo028/generate-icons.cjs`. Usa únicamente el JPG oficial y Canvas; no requiere ImageMagick, Pillow ni paquetes de producción. Las capturas nuevas se guardan en /tmp/iwave-seo028 por defecto; no sobrescriben automáticamente la evidencia versionada.

## Procedimiento de publicación — ejecutado con autorización

La publicación se autorizó y ejecutó para el parche estático y la actualización de **solo la web**. Los comandos siguientes quedan como referencia para futuras publicaciones autorizadas. No basta reconstruir el Dockerfile actual sin el parche: robots/sitemap seguirían sin servirse en el origen. No ejecutar el procedimiento durante el desarrollo ni modificar NPM, API, credenciales o Cloudflare. Al reemplazar únicamente el contenedor web puede existir una interrupción breve; realizarlo en la ventana autorizada y conservar la imagen anterior para volver atrás.

Usar un checkout separado del SHA SEO aprobado. No aplicar el parche sobre un árbol con cambios ajenos. Este checkout temporal contiene una aplicación reproducible del parche que ya está versionado dentro del SHA; no se afirma que el archivo Dockerfile raíz del commit haya cambiado.

```bash
set -euo pipefail
cd /opt/iwave/proyectos/landing-iwave
# Sustituir por el SHA completo publicado de SEO-028, no usar una rama mutable.
export SEO028_REVISION=SHA_SEO_APROBADO
export SEO028_RELEASE_DIR="/tmp/iwave-seo028-release-${SEO028_REVISION}"
git worktree add --detach "$SEO028_RELEASE_DIR" "$SEO028_REVISION"
cd "$SEO028_RELEASE_DIR"
if git apply --reverse --check docs/seo028/static-publication.patch 2>/dev/null; then
  printf 'Empaquetado estático ya incorporado en esta revisión.\n'
else
  git apply --check docs/seo028/static-publication.patch
  git apply docs/seo028/static-publication.patch
fi
# Compartir solo el archivo privado existente con Compose, sin copiarlo al contexto servido.
ln -s /opt/iwave/proyectos/landing-iwave/.env.form027-production .env.form027-production
export SEO028_PREVIOUS_WEB_IMAGE="$(docker inspect --format '{{.Config.Image}}' iwave-form027-prod-iwave-form027-web-1)"
export FORM027_REVISION="$SEO028_REVISION"
export FORM027_API_IMAGE=iwave-contact-api:form027-12aae4243b9f7753e70dbe8faad812df513cd175
export FORM027_WEB_IMAGE="iwave-landing:seo028-${SEO028_REVISION}"
docker compose -f contact-api/compose.production.yml config --quiet
docker compose -f contact-api/compose.production.yml build iwave-form027-web
# Solo después de comprobar el artefacto construido, en la ventana autorizada:
docker compose -f contact-api/compose.production.yml up -d --no-build --no-deps --wait --wait-timeout 90 iwave-form027-web
docker compose -f contact-api/compose.production.yml exec -T iwave-form027-web nginx -t
for resource in / /robots.txt /sitemap.xml /favicon.ico /img/logo/favicon-48x48.png /img/logo/favicon-192x192.png /img/logo/favicon-512x512.png /img/logo/apple-touch-icon.png /img/logo/iwave.jpg
 do
 curl --fail --silent --show-error --output /dev/null "https://iwave.cl$resource"
 done
curl --fail --silent --show-error --output /dev/null https://iwave.cl/api/contact/config
```

Antes del comando up, registrar en un respaldo privado las etiquetas/IDs vigentes y comprobar la nueva imagen sin puertos públicos: nginx -t y HTTP interno para los archivos estáticos, como el ensayo realizado. Validar después el robots combinado del edge y HTML/JSON-LD del dominio, recursos, favicon decodificado y formulario sin envío. No re-crear API ni modificar upstream/ubicaciones NPM, certificados, puertos o DNS. La alias de servicio web existente se conserva.

Rollback si falla una comprobación crítica, desde esa misma shell:

```bash
export FORM027_WEB_IMAGE="$SEO028_PREVIOUS_WEB_IMAGE"
docker compose -f contact-api/compose.production.yml up -d --no-build --no-deps --wait --wait-timeout 90 iwave-form027-web
curl --fail --silent --show-error --output /dev/null https://iwave.cl/
curl --fail --silent --show-error --output /dev/null https://iwave.cl/api/contact/config
```

No tocar SQLite, HMAC o volúmenes, no detener iwave-prod/test/npm y no borrar la imagen anterior o el respaldo. La publicación se ejecutó con autorización; no fue necesario aplicar rollback. La imagen anterior y el respaldo siguen disponibles.

## Pendientes de Search Console y Bing

1. Después de publicar y comprobar HTTP 200 real, usar una propiedad de Search Console ya verificada para iwave.cl. No se accedió a ninguna cuenta ni se agregaron verificaciones o DNS. Si no existe propiedad, crear una de prefijo https://iwave.cl/ con un método HTML autorizado; la propiedad Domain necesita verificación DNS y queda fuera de esta tarea.
2. Probar la URL pública con Inspección de URLs y la prueba en vivo; comprobar canonical elegido, rastreo permitido, HTML renderizado, logo e iconos accesibles por Googlebot-Image. Solicitar indexación de la home.
3. Enviar https://iwave.cl/sitemap.xml y revisar su estado. La ruta ya responde 200 y el sitemap puede enviarse; no se accedió a las cuentas de webmaster ni se presentó automáticamente.
4. Ejecutar Rich Results Test y Schema Markup Validator sobre la versión publicada. Revisar Organization/WebSite; Service no implica una presentación enriquecida garantizada. No añadir reviews o direcciones ficticias para satisfacer sugerencias.
5. Revisar después páginas indexadas, canonical, mejoras y rendimiento. El favicon, logo, título y snippet finales los decide el buscador; pueden tardar en actualizarse y no se garantizan posición o fecha.
6. En Bing Webmaster Tools, usar el sitio verificado, enviar el mismo sitemap y comprobar rastreo. Sin claves de API o datos de propiedad inventados ni cambios de políticas Cloudflare.

## Fuentes primarias

- [Favicon en Google](https://developers.google.com/search/docs/appearance/favicon-in-search): formatos, acceso de crawlers y ausencia de garantía de visualización.
- [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [nombre del sitio/WebSite](https://developers.google.com/search/docs/appearance/site-names), [Service](https://schema.org/Service).
- [Robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [protocolo XML](https://www.sitemaps.org/protocol.html).
- [Robots administrado por Cloudflare](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/).
- [Propiedades de Search Console](https://support.google.com/webmasters/answer/34592?hl=en), [verificación](https://support.google.com/webmasters/answer/9008080?hl=en), [sitemaps de Bing](https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed).
