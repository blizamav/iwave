# SEO-028 — publicación en producción

Resultado: **publicado y validado en https://iwave.cl**, con autorización expresa del usuario. No se enviaron correos reales.

## Revisión y artefactos

- Commit aprobado: `1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9`.
- Preparación/respaldo iniciados: 2026-11-23T22:04:28Z.
- Web iniciada: 2026-11-23T22:07:49.241228238Z.
- Validaciones finales aprobadas: 2026-11-23T22:08:42Z.
- Imagen web activa: `iwave-landing:seo028-1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9`.
- ID de imagen: `sha256:3a78c48ec3d661c12d31d5cd963844f60ce5823589120ef849b5c82ea6eae2e5`.
- Checkout de release: `/tmp/iwave-seo028-release-1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9`. Se mantiene el parche aprobado aplicado, y un enlace al archivo privado existente para Compose; el archivo privado no se copió al artefacto.

Se aplicó únicamente [static-publication.patch](static-publication.patch): tres archivos de empaquetado, 14 líneas añadidas. Dockerfile copia robots.txt/sitemap.xml/favicon.ico; .dockerignore admite esos tres archivos; Nginx de la **web** añade ubicaciones exactas robots/sitemap. No se modificó configuración de **NPM**, API, SMTP, Cloudflare o DNS.

El mismo empaquetado se incorpora en la fuente de reconstruccion-iwave para que futuros builds no omitan los archivos. La imagen runtime sigue basada en el commit aprobado más ese parche, no en el commit documental posterior. El body y los 17 archivos preservados de CSS/JS/FORM-027/backend/arte original coinciden con la referencia antes del SEO, según hashes.

## Validación previa al corte

La imagen se ejecutó como usuario 101 en contenedor efímero, sin red ni puertos publicados, con raíz de solo lectura. nginx -t y lecturas HTTP internas de home, robots, sitemap, favicon, logo, Three.js y contact.js correctas; sin .env o .git en la raíz servida. JSON-LD/HTML y referencias estáticas aprobados por audit.py.

Se conservó la imagen web anterior y un respaldo privado con estados/fechas, montajes API y configuración del Proxy Host 1. El cambio se realizó con `up -d --no-build --no-deps --wait --wait-timeout 90 iwave-form027-web` desde el Compose existente, sin re-crear dependencias. El contenedor web fue reemplazado por el procedimiento; todos los demás servicios permanecieron activos. No se reinició el VPS ni NPM.

## URLs públicas

Validación con TLS normal, sin -k ni desactivar certificados. Las **20 URLs comprobadas respondieron HTTP 200**, con evidencia completa en [production-http-results.json](production-http-results.json):

| URL requerida | Estado | Validación adicional |
| --- | --- | --- |
| https://iwave.cl/ | 200 | es-CL, title aprobado, formulario y JSON-LD Organization/WebSite/4 Service |
| https://iwave.cl/favicon.ico | 200 | ICO válido, tres tamaños |
| https://iwave.cl/robots.txt | 200 | contenido Cloudflare conservado, reglas del origen y Sitemap presentes |
| https://iwave.cl/sitemap.xml | 200 | XML, solo la URL canónica de la home |
| https://iwave.cl/img/logo/favicon-512x512.png | 200 | PNG válido, 512×512 |
| https://iwave.cl/api/contact/config | 200 | JSON con solo sitekey, valor no publicado en el informe |

Además se comprobaron PNG 48/192, Apple 180, logo oficial, imagen OG, CSS, JavaScript principal, Three.js, módulos de experiencia y contact.js. No se bloquean los recursos necesarios de renderizado. No se alteró la política de crawlers de Cloudflare; el edge combina su robots administrado con el del origen.

## Navegador y apariencia

[production-browser-results.json](production-browser-results.json): 390/768/1440 px sin errores JavaScript, recursos fallidos u overflow. FORM-027 presente; se bloquearon solicitudes POST del formulario y no se produjo ninguna. En escritorio, WebGL activo y siguiente del carrusel funcional. Móvil y tablet se comprobaron con movimiento reducido; no se afirmó una medición de fluidez WebGL móvil. No se intentó resolver Turnstile ni enviar un correo.

Capturas reales posteriores: [390](evidence/production-390.png), [768](evidence/production-768.png), [1440](evidence/production-1440.png). La comparación antes/después previa al despliegue mantiene cero píxeles distintos en capturas estáticas y geometría idéntica; no se presenta como comparación pixel a pixel de estas capturas públicas con animación. No hubo cambios de CSS, encuadres, dimensiones, fuentes o lógica visual.

## Servicios y preservación

| Contenedor | Estado | Healthcheck |
| --- | --- | --- |
| iwave-form027-prod-iwave-form027-web-1 | running | healthy |
| iwave-form027-prod-iwave-form027-api-1 | running | healthy |
| iwave-npm | running | not-configured |
| iwave-prod | running | not-configured |
| iwave-test | running | not-configured |
| iwave-form027-test-web-1 | running | not-configured |
| iwave-form027-test-contact-api-1 | running | healthy |

`not-configured` significa que no hay healthcheck configurado, no un fallo. API productiva: salud interna HTTP 200 antes y después. Comparación de preservación: IDs/StartedAt/RestartCount de iwave-prod, iwave-test, iwave-npm y API productiva idénticos; montajes/volumen API idénticos; hash del archivo NPM Proxy Host 1 idéntico. Las fechas de inicio e imágenes se registran en [deployment-results.json](deployment-results.json). No se inspeccionó ni restauró contenido SQLite.

## Rollback disponible

No fue necesario ejecutarlo. Imagen anterior conservada: `iwave-landing:form027-12aae4243b9f7753e70dbe8faad812df513cd175`, ID `sha256:4d0aee240af93ab1c004eaacee13b9660a04556af441fa8788d21f50d6a51276`. Respaldo privado: `.form027-private/seo028-deploy-20261123T220428Z/`, permisos de directorio 700 y archivos 600. No contiene copia de claves SSL y no se versiona su contenido. No eliminar la imagen, respaldos, iwave-prod o volúmenes.

Para revertir **solo SEO-028** con autorización, usar el Compose productivo desde el repositorio o el checkout conservado; el nombre del proyecto se mantiene iwave-form027-prod. No restaurar las rutas NPM, no detener la API ni sustituir HMAC o SQLite:

```bash
set -euo pipefail
cd /opt/iwave/proyectos/landing-iwave
export FORM027_REVISION=1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9
export FORM027_API_IMAGE=iwave-contact-api:form027-12aae4243b9f7753e70dbe8faad812df513cd175
export FORM027_WEB_IMAGE=iwave-landing:form027-12aae4243b9f7753e70dbe8faad812df513cd175
docker compose -f contact-api/compose.production.yml up -d --no-build --no-deps --wait --wait-timeout 90 iwave-form027-web
curl --fail --silent --show-error --output /dev/null https://iwave.cl/
curl --fail --silent --show-error --output /dev/null https://iwave.cl/api/contact/config
```

El procedimiento de corte incluía rollback automático ante fallo crítico de arranque, Nginx, HTTP público, navegador o comparación de servicios protegidos. Todas esas verificaciones pasaron; no se ejecutó rollback. No hubo escrituras de API, correos de prueba, cambios DNS/MX, cambios Cloudflare/NPM ni recreación de API o datos persistentes.

## Pendientes

Con el sitemap ya público, el usuario puede enviarlo en Search Console/Bing, inspeccionar la home, solicitar rastreo y ejecutar los validadores online de datos estructurados. No se accedió a esas cuentas ni se prometen plazos de indexación o aparición de favicon. [Pasos de cuenta](README.md#pendientes-de-search-console-y-bing).
