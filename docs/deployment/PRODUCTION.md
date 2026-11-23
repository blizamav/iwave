# Estado vigente — FORM-027 operativo en producción

Cierre registrado el 2026-11-23. El usuario confirmó funcionamiento y recepción de correos reales desde https://iwave.cl. Comprobación independiente de lectura: HTTPS 200, HTML/assets FORM-027, API config 200 y rechazos 400/405, NPM válido y Zoho SMTP autenticado sin enviar correos adicionales.

El Proxy Host 1 de **iwave-npm** atiende iwave.cl/www con SSL existente: web hacia **iwave-form027-web:80** y ubicaciones de prefijo `/api/contact` y `/api/contact/config` hacia **iwave-form027-api:3000**. Web/API healthy, conectadas a iwave-web, sin puertos publicados. **iwave-prod** se conserva activo como respaldo en loopback 8081; iwave-test permanece en 8080 y FORM-027 de pruebas en 8127/3027. Referencias SSL y contenedores originales preservados.

Operación, imágenes y rollback en [FORM-027.md](FORM-027.md); resultados y límites en [QA](../contact-form/QA.md). No se modificó producción ni se reinició ningún servicio durante el cierre.

**Las secciones DEPLOY-017 siguientes son historia de Caddy**, no instrucciones para el proxy vigente. No ejecutar sus comandos de instalación/recarga ni modificar certificados/DNS a partir de ese historial. Se conservan para trazabilidad.

# DEPLOY-017 — producción UX-014

Diagnóstico y despliegue: 2026-11-19. **HTTPS público operativo a través de Cloudflare**: `https://iwave.cl/` responde 200 y `https://www.iwave.cl/` redirige 301 al dominio canónico. Caddy conserva certificados públicos Let's Encrypt válidos para ambos hosts. El usuario confirmó haber reactivado Proxied y configurado Full (strict); se verificaron DNS del edge, HTTPS público, TLS directo del origen, recursos y navegador. No se dispone de API del panel para leer independientemente el nombre del modo SSL.

## Estado anterior y versión

- VPS Ubuntu, dirección observada `37.59.109.88`; IPv6 `2001:41d0:305:2100::1:14bb`.
- Rama `reconstruccion-iwave`, commit `940fd73a420cb7224dbb4276cd2d9fc51447a601`, mensaje `feat(iwave): implement immersive corporate experience UX-014`.
- Árbol limpio antes de DEPLOY-017. HTML, CSS, JavaScript y recursos de la aplicación permanecen iguales al commit aprobado; solo cambian archivos de entrega y documentación.
- Único contenedor anterior: `iwave-test`, imagen `iwave-landing:ux014`, `127.0.0.1:8080:80`, reinicio `unless-stopped`, red `bridge`. Se conserva operativo e intacto.
- Sin contenedores proxy detenidos o activos; Nginx, Apache y Caddy no están instalados como servicios. No hay listeners en 80/443. No se encontraron `/etc/nginx`, `/etc/letsencrypt`, `/opt/npm` ni `/opt/nginx-proxy-manager`.
- `sudo -n` requiere contraseña; no se accedió a claves, credenciales ni certificados privados. El listado no privilegiado de sockets sí permite observar los puertos abiertos.
- No existía un host local `iwave.cl` cuyo enrutamiento o configuración de certificados se pudiera respaldar. La configuración real de origen en Cloudflare no es visible mediante DNS público.

## Arquitectura de producción

```text
Internet → Cloudflare → iwave-caddy:443 → iwave-prod:80
                       red compartida iwave-web
Full (strict): confirmado por el usuario en el panel
Local: 127.0.0.1:8081 → iwave-prod:80
Pruebas: 127.0.0.1:8080 → iwave-test:80 (preservado)
```

- Imagen: `iwave-landing:ux014-prod`.
- ID: `sha256:d0ab77c0f6eb6922e2de0842f5f9e98dfa6684ffa23afd75dc8c23932b335a8f`.
- Etiqueta OCI de revisión: commit completo indicado arriba. El contexto incluye ajustes de infraestructura locales documentados aquí, sin nuevo commit.
- Base resuelta durante la construcción: `nginx:alpine@sha256:0563c36f94a6d3ec3584161b77859f740f7e20b4853f52c796a864ce6908e8ea`.
- Contenedor: `iwave-prod`; red bridge propia `iwave-web`; puerto publicado **solo** `127.0.0.1:8081:80`.
- Usuario `101:101`, raíz de solo lectura, capacidades eliminadas, `no-new-privileges`, directorios de ejecución efímeros en tmpfs.
- Reinicio `unless-stopped`, healthcheck HTTP cada 30 segundos, timeout 5 segundos y tres intentos; período inicial de 10 segundos.
- Logs `json-file`, máximo `10m` por archivo y tres archivos. Sin socket Docker, secretos ni montajes del repositorio.
- La imagen solo copia HTML/CSS/JS e `img`. `.dockerignore` restringe además el contexto; no incluye `.git`, documentación ni `.env`.

Nginx sirve únicamente el índice y extensiones estáticas conocidas, con 404 para rutas internas/desconocidas; no devuelve HTML como sustituto de un módulo inexistente. Se conservan los MIME types de la imagen oficial, comprobados mediante HTTP. `Cache-Control: no-cache` exige revalidación sin caducidad prolongada, también para módulos sin consulta de versión. Cabeceras: `nosniff`, `SAMEORIGIN` y `strict-origin-when-cross-origin`; versión de servidor oculta. La directiva `user` global de la imagen oficial emite un aviso por ejecutar Nginx sin root; la prueba de configuración y el servicio funcionan correctamente.

## DNS, Cloudflare y HTTPS

Diagnóstico público inicial, antes de corregir los registros:

| Consulta | Respuesta |
| --- | --- |
| NS | `elisa.ns.cloudflare.com`, `everton.ns.cloudflare.com` |
| A de raíz y www | `172.67.186.74`, `104.21.59.247` (edge Cloudflare) |
| AAAA de raíz y www | `2606:4700:3037::6815:3bf7`, `2606:4700:3031::ac43:ba4a` (edge Cloudflare) |
| CNAME público de www | Sin respuesta; el proxy puede ocultar/aplanar el registro |
| HTTP raíz | 308 hacia `https://iwave.cl/` |
| HTTPS raíz | 525; fallo de handshake TLS con el origen |
| HTTPS www | 525; fallo de handshake TLS con el origen |

En aquel estado, los registros proxied ocultaban el destino real y ambos hosts fallaban con 525. Eso no acreditaba Full (strict). El usuario identificó posteriormente el origen incorrecto en el panel y lo corrigió.

El usuario identificó que ambos registros web A apuntaban a `148.113.197.246` y los corrigió a `37.59.109.88`. Los autoritativos y resolvers 1.1.1.1/8.8.8.8 ya responden con la IP correcta; los autoritativos no devuelven AAAA para estos hosts. El resolver local conservó temporalmente respuestas anteriores y después confirmó también la IP correcta. Se reinició solo Caddy para reintentar ACME tras la corrección, con éxito para ambos dominios.

Estado comprobado el 2026-11-19 a las 19:50 UTC:

| Prueba pública IPv4 | Resultado |
| --- | --- |
| A raíz/www | `37.59.109.88`, DNS only |
| AAAA autoritativo raíz/www | Sin respuesta; no se usa origen IPv6 en DNS |
| Puerto 80, HTTP raíz | 308 hacia HTTPS |
| Puerto 443, HTTPS raíz | TLS 1.3 válido, HTTP/2 200 |
| HTTPS www | TLS 1.3 válido, 301 hacia `https://iwave.cl/` |
| www con ruta/consulta | Conservadas al redirigir |
| Certificado raíz | Let's Encrypt YE2, SAN `iwave.cl`, válido hasta 2027-02-17 18:50:16 UTC |
| Certificado www | Let's Encrypt YE1, SAN `www.iwave.cl`, válido hasta 2027-02-17 18:50:17 UTC |

La confianza, cadena y hostname se verificaron con el almacén de CA del sistema, sin `-k`, `verify=False` ni `ignoreHTTPSErrors`. Solo se consultaron metadatos de certificados públicos durante el handshake; no se leyeron claves privadas.

Procedimiento de Cloudflare, sin entregar credenciales por chat:

1. A `@` → `37.59.109.88`; A `www` → `37.59.109.88`. Corregidos por el usuario y temporalmente en DNS only para permitir la emisión inicial ACME.
2. Revisar si existen AAAA de origen: las respuestas públicas anteriores son del edge y no prueban su existencia. Conservar/configurar uno solo si el origen IPv6 sirve HTTPS correctamente; no dejar un origen IPv6 antiguo para los hosts web.
3. Caddy en Docker está instalado con autorización expresa, exclusivo de iWave y conectado a `iwave-web`, para certificados ACME y redirección www → raíz. No se usa Flexible, certificados autofirmados ni verificaciones TLS desactivadas.
4. TLS del origen ya está validado: el usuario puede establecer `SSL/TLS → Overview → Full (strict)` y reactivar `Proxied` en los dos registros A web. Los requisitos de certificado, hostname, vigencia y puerto 443 están comprobados. Confirmar después HTTPS y ausencia de 525/526/bucles a través de Cloudflare. Conservar renovación y volúmenes persistentes; no tocar reglas globales de otros servicios.
5. Respaldar los valores anteriores de los registros y reglas específicas de iWave antes de modificar el panel. Verificar ambos dominios con HTTPS y redirecciones sin bucles.

No se dispone de conexión autorizada a la API/panel de Cloudflare. El agente no modificó DNS, nameservers, reglas ni modo SSL; el usuario realizó la corrección web descrita y confirmó después haber reactivado el proxy y configurado Full (strict). La validación posterior a través de Cloudflare está completada y se detalla al final.

## Caddy y renovación

- Contenedor `iwave-caddy`, Caddy `v2.11.9`, imagen oficial `caddy:2-alpine`, digest `sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0`.
- Configuración versionable: `docs/deployment/caddy/Caddyfile`, directorio montado de solo lectura en `/etc/caddy`. `iwave.cl` → `iwave-prod:80`; `www.iwave.cl` → `https://iwave.cl{uri}` permanente, conservando ruta y consulta.
- Puertos publicados únicamente 80/TCP y 443/TCP, IPv4/IPv6. 443/UDP y 2019/TCP figuran como metadatos de la imagen pero **no están publicados**. HTTP/3 del origen desactivado; HTTP/1.1 y HTTP/2 habilitados.
- Administración en `localhost:2019` dentro del contenedor, sin acceso desde la red Docker o el host. Sin Docker socket.
- Usuario `1000:1000`, filesystem de solo lectura, todas las capacidades eliminadas, `no-new-privileges`. `net.ipv4.ip_unprivileged_port_start=0` se aplica exclusivamente al namespace del contenedor para permitir puertos bajos sin root.
- Volúmenes exclusivos persistentes `iwave-caddy-data:/data` y `iwave-caddy-config:/config`; propiedad inicial 1000:1000. Contienen material de renovación sensible: no abrir, imprimir, publicar ni incluir en Git. Conservarlos al actualizar o revertir. `/tmp` usa tmpfs limitado a 16 MB.
- Reinicio `unless-stopped`, logs `json-file` limitados a tres archivos de 10 MB. Healthcheck verifica la API local y el upstream cada 30 segundos; no sustituye la prueba HTTPS pública.
- Emisión/renovación automática Let's Encrypt mediante HTTP-01. TLS-ALPN-01 desactivado para compatibilidad con Cloudflare. Mantener 80 abierto y la ruta `/.well-known/acme-challenge/` alcanzable, sin bloqueos ni redirecciones externas que impidan la validación. Revalidar renovación si cambian reglas del edge.
- El primer intento falló con 525 al validar el origen anterior. Un intento posterior todavía resolvió `148.113.197.246`; tras la corrección del usuario se reinició solo Caddy y Let's Encrypt de producción emitió ambos certificados. No se sustituyeron certificados por otros inseguros. La configuración y los datos de renovación permanecen montados en volúmenes persistentes.

Referencias operativas: [Caddy en Docker](https://caddyserver.com/docs/running#docker-compose), [configuración TLS](https://caddyserver.com/docs/caddyfile/directives/tls) y [requisitos Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

Creación ejecutada con volúmenes nuevos; no repetir sobre contenedores o datos existentes:

```bash
docker volume create --label com.iwave.purpose=tls iwave-caddy-data
docker volume create --label com.iwave.purpose=config iwave-caddy-config
docker run --rm --network none --cap-drop ALL --cap-add CHOWN \
  --mount type=volume,src=iwave-caddy-data,dst=/data \
  --mount type=volume,src=iwave-caddy-config,dst=/config \
  --entrypoint sh caddy:2-alpine -c 'chown 1000:1000 /data /config'
docker run -d --name iwave-caddy --network iwave-web \
  --publish 80:80/tcp --publish 443:443/tcp --restart unless-stopped \
  --user 1000:1000 --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --sysctl net.ipv4.ip_unprivileged_port_start=0 \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m,uid=1000,gid=1000 \
  --mount type=bind,src=/opt/iwave/proyectos/landing-iwave/docs/deployment/caddy,dst=/etc/caddy,readonly \
  --mount type=volume,src=iwave-caddy-data,dst=/data \
  --mount type=volume,src=iwave-caddy-config,dst=/config \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --health-cmd 'wget -q -O /dev/null http://127.0.0.1:2019/config/ && wget -q -O /dev/null http://iwave-prod/' \
  --health-interval 30s --health-timeout 5s --health-start-period 15s --health-retries 3 \
  --label com.iwave.purpose=production-proxy caddy:2-alpine
```

Para una recreación futura, preferir la imagen por el digest registrado, conservando ambos volúmenes. Antes de modificar el Caddyfile, guardar copia fechada de ese archivo de configuración sin copiar claves. Validar y recargar:

```bash
docker exec iwave-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec iwave-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
docker logs --since 5m iwave-caddy
```

## Correo

MX observados: prioridad 10 `mx.zoho.com`, 20 `mx2.zoho.com`, 50 `mx3.zoho.com`. TXT públicos: SPF `v=spf1 include:zohomail.com ~all` y verificación Zoho existente. La consulta pública `_dmarc` no devolvió TXT; no se creó ni modificó ninguno. No se conocen selectores DKIM y no se investigaron ni cambiaron. No se modificó ningún registro DNS, incluidos MX/SPF/DKIM/DMARC/TXT.

El formulario conserva `mailto:contacto@iwave.cl`, validación y apertura del cliente de correo; no existe envío automático ni backend. MAIL-016 queda fuera de este despliegue. Las consultas DNS no certifican envío/recepción real de Zoho.

## Administración y reproducción

Desde `/opt/iwave/proyectos/landing-iwave`:

```bash
docker ps --filter name=iwave
docker inspect iwave-prod --format '{{.State.Health.Status}}'
docker logs --tail 100 iwave-prod
docker exec iwave-prod nginx -t
curl -I http://127.0.0.1:8081/
```

Construcción ejecutada:

```bash
docker build --build-arg IWAVE_REVISION=940fd73a420cb7224dbb4276cd2d9fc51447a601 -t iwave-landing:ux014-prod .
docker network create --label com.iwave.purpose=production iwave-web
docker run -d --name iwave-prod --network iwave-web \
  --publish 127.0.0.1:8081:80 --restart unless-stopped \
  --user 101:101 --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=32m,uid=101,gid=101 \
  --tmpfs /var/run:rw,noexec,nosuid,size=1m,uid=101,gid=101 \
  --tmpfs /tmp:rw,noexec,nosuid,size=8m,uid=101,gid=101 \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --health-cmd 'wget -q --spider http://127.0.0.1/' \
  --health-interval 30s --health-timeout 5s --health-start-period 10s --health-retries 3 \
  --label com.iwave.version=UX-014 \
  --label org.opencontainers.image.revision=940fd73a420cb7224dbb4276cd2d9fc51447a601 \
  --entrypoint nginx iwave-landing:ux014-prod -g 'daemon off;'
```

Estos comandos de creación no son idempotentes: no repetir sobre un nombre existente ni eliminarlo automáticamente.

Para actualizar, identificar primero el commit y preservar cambios locales; construir con etiqueta nueva e inmutable, conservar el ID anterior y probar un contenedor candidato con otro nombre y puerto local libre. Conectarlo a `iwave-web`; comprobar recursos, navegador y healthcheck antes de cambiar únicamente el destino de `reverse_proxy` de iWave en el Caddyfile. Validar y recargar mediante los comandos anteriores. No sobrescribir etiquetas antiguas durante una actualización ni borrar contenedores/imágenes previos hasta completar la validación.

## Rollback

Antes de este proxy no existía servicio en 80/443. Para revertir únicamente su instalación, `docker stop iwave-caddy`; esto retira el HTTPS público y reproduce la ausencia anterior de proxy, no recupera un sitio funcional previo. Conservar contenedor, logs y los dos volúmenes. `iwave-prod` puede permanecer saludable localmente; detenerlo con `docker stop iwave-prod` solo si se decide retirar también esa preparación. No detener ni reutilizar `iwave-test` y no ejecutar limpiezas globales.

Para revertir una futura actualización de la landing, restaurar el upstream anterior en la copia del Caddyfile, validar y recargar Caddy. Para cambios DNS, restaurar únicamente los valores web respaldados y decididos por el usuario; no restaurar automáticamente la IP anterior errónea `148.113.197.246`. No tocar correo ni otros hosts. Conservar certificados, volúmenes de renovación y logs.

## Pruebas y límites

- `git diff --exit-code HEAD -- index.html styles.css script.js img`: sin cambios al código aprobado.
- `nginx -t`: correcto, con el aviso de usuario no root descrito arriba.
- `iwave-prod`: running/healthy; puerto limitado a localhost. `iwave-test` sigue running en 8080.
- HTTP local: índice y 19 recursos servidos con contenido idéntico al árbol aprobado; JavaScript/CSS con MIME correcto, caché revalidable y `nosniff`.
- Nueve rutas privadas/inexistentes devuelven 404: `.env`, `.git/config`, documentación, Dockerfile, configuración Nginx, fuentes documentales de marcas, LICENSE, un JS inexistente y una página inexistente.
- DNS y HTTPS reales consultados sin `-k`: ambos A correctos; TLS público válido con Let's Encrypt, raíz 200 y www 301. HTTP redirige sin bucles. TLS 1.3 y cadena/hostname verificados en ambos hosts; no hay 525/526 en el recorrido directo actual.
- Los 19 recursos públicos coinciden byte a byte con UX-014; JavaScript/CSS con MIME correcto y cabeceras de caché/seguridad. Nueve rutas internas/inexistentes bloqueadas con 404. Ruta y consulta conservadas al redirigir www. El código y recursos siguen idénticos al commit aprobado.
- Chromium local: aprobadas matrices 1440×900, 768×1024 y 390×844. Carga WebGL del showcase, GSAP/ScrollTrigger 3.14.2, canvas único, orden de siete secciones y navegación, H1, ausencia de overflow por capítulo y validación de formulario vacío comprobados. Sin errores JS/consola ni respuestas HTTP locales fallidas. Seis capturas (Hero/contacto por ancho), resultados y verificador en `/tmp/iwave-deploy017-*`; son evidencia temporal y no sustituyen control de versiones ni pruebas del dominio público. Se conservó `mailto`; no se envió correo. SwiftShader no acredita rendimiento GPU físico.
- Chromium sobre **`https://iwave.cl`**: aprobadas también las tres matrices 1440×900, 768×1024 y 390×844, sin omitir validaciones TLS. WebGL/Three.js y showcase activos, GSAP/ScrollTrigger 3.14.2, un canvas, contenido/navegación UX-014, siete capítulos sin overflow y validación de formulario aprobados; sin errores JS/consola, HTTP de recursos locales ni solicitudes de contenido mixto. Resultados públicos en `/tmp/iwave-deploy017-results.json` y capturas Hero/contacto en `/tmp/iwave-deploy017-*.png`; esta ejecución reemplazó las evidencias temporales locales. Reproducción: `IWAVE_DEPLOY_URL=https://iwave.cl node /tmp/iwave-deploy017-qa.cjs` (requiere Playwright/Chromium externos preexistentes). No acredita todos los navegadores, dispositivos físicos o rendimiento GPU.

Comandos de validación posterior a reactivar Cloudflare:

```bash
dig +short iwave.cl A
dig +short www.iwave.cl A
curl -4 -I https://iwave.cl/
curl -4 -I https://www.iwave.cl/
curl -4 -IL --max-redirs 5 http://www.iwave.cl/
curl -4 -I --resolve iwave.cl:443:37.59.109.88 https://iwave.cl/
IWAVE_DEPLOY_URL=https://iwave.cl node /tmp/iwave-deploy017-qa.cjs
```

Con proxy activo, las respuestas DNS mostrarán IP de Cloudflare; comprobar 200 raíz y 301 canónico, TLS válido, ausencia de 525/526/502 y bucles, recursos y navegador. La prueba `--resolve` conserva validación TLS y permite comprobar el origen por separado. El modo Full (strict) debe confirmarse en el panel: una respuesta HTTP exitosa por sí sola no revela ese ajuste.

## Cierre tras activar Cloudflare

Verificación del 2026-11-19, aproximadamente 19:57–19:59 UTC, después de la confirmación del usuario:

- DNS público de ambos hosts vuelve a `172.67.186.74` y `104.21.59.247`, correspondiente al proxy Cloudflare. Respuestas HTTPS con `server: cloudflare`, `cf-ray` y raíz `via: 1.1 Caddy` confirman el recorrido por el edge y el proxy de origen.
- `https://iwave.cl/`: 200, TLS validado. `https://www.iwave.cl/`: 301 a raíz. La cadena HTTP www → HTTPS www → HTTPS raíz termina en 200, sin bucles, 502, 525 ni 526. Las consultas y rutas se conservan.
- Conexión TLS directa a `37.59.109.88`, SNI `iwave.cl`, mediante `curl --resolve`: validación correcta y 200. El certificado público del origen sigue vigente; no se deshabilitaron verificaciones.
- CSS, JavaScript, Three.js, GSAP y gráficos: 18 recursos con HTTP 200 y hash idéntico a UX-014 a través de Cloudflare. Una comprobación posterior de `index.html` también coincide exactamente con el original. Un primer cliente Python recibió 403 del edge y una primera respuesta HTML difirió; no se alteraron controles para evitarlo. Las comprobaciones finales con curl y Chromium fueron satisfactorias.
- Chromium a través de Cloudflare: aprobadas las matrices 1440×900, 768×1024 y 390×844, incluyendo WebGL/showcase, GSAP/ScrollTrigger, navegación, ausencia de overflow, formulario y ausencia de errores de consola, respuestas locales fallidas y contenido mixto. Resultados temporales actualizados en `/tmp/iwave-deploy017-results.json`.
- `iwave-caddy` e `iwave-prod` saludables; `iwave-test` operativo. Código aprobado sin cambios; MX/TXT de Zoho conservados. No se ejecutaron nuevos commits ni push.
- Full (strict) está confirmado por el usuario; la lectura independiente del ajuste del panel no es posible sin una conexión autorizada. El comportamiento público y la validez del origen son compatibles con ese modo. No quedan bloqueos de publicación identificados en las pruebas realizadas; no se certifican todos los navegadores o dispositivos físicos.

No se han realizado nuevos commits, push, cambios visuales, instalaciones globales, cambios en Zoho ni modificaciones de otros servicios.
