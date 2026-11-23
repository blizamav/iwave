# FORM-027 — preparación de producción y rollback

Estado final registrado el 2026-11-23: **FORM-027 operativo en https://iwave.cl**. El usuario confirmó pruebas reales en producción con recepción en contacto@iwave.cl; Turnstile y Reply-To también están confirmados. El cierre no envió correos, modificó NPM, reinició contenedores ni cambió Cloudflare/DNS/MX.

## Estado real de producción

- Implementación fd39c70 y documentación 12aae42 publicadas. La API runtime permanece etiquetada `form027-12aae4243b9f7753e70dbe8faad812df513cd175`; la web fue actualizada posteriormente a `seo028-1c3529d7bc6e4d7b83071c829c082b5fbbed9ba9` sin cambios funcionales de FORM-027. Para rollback de SEO usar solo la imagen web anterior, según [SEO-028](../seo028/DEPLOYMENT.md); no revertir las rutas NPM o la API. La corrección local de tmpfs se incorpora al versionado de cierre, sin reconstruir ni reiniciar los servicios.
- Web y API FORM-027: running/healthy, red externa existente iwave-web y sin puertos publicados. Web: iwave-form027-web:80. API: iwave-form027-api:3000.
- Proxy Host **1**, dominios iwave.cl y www.iwave.cl. Destino web: iwave-form027-web, esquema HTTP, puerto 80. Ubicaciones activas **de prefijo** `/api/contact` y `/api/contact/config` hacia iwave-form027-api:3000. La segunda, más larga, coincide con config; ambas tienen prioridad sobre el frontend `/`.
- La plantilla [npm.locations.conf](form027/npm.locations.conf) conserva una alternativa Advanced con ubicaciones exactas `=`. **No describe literalmente las ubicaciones de prefijo instaladas**; no pegarla adicionalmente ni duplicar las rutas ya activas. El cierre documentó la configuración existente sin modificarla ni acceder a la base de datos.
- SSL y sus referencias coinciden con el respaldo anterior. iwave-prod sigue activo como respaldo en 127.0.0.1:8081; iwave-test y NPM conservan sus IDs y fechas de inicio. Las pruebas de FORM-027 en 8127/3027 permanecen independientes.
- La API usa Zoho, origen/hostname iwave.cl y www.iwave.cl por configuración, sin localhost. La autorización de iwave.cl en el widget iWave - Formulario Contacto fue confirmada visualmente por el usuario; conservar la política existente de www. CONTACT_TRUSTED_PROXY_IPS permanece vacío, con límite compartido conservador por proxy. No modificar confianza de IP sin revisar su estabilidad y real-IP por separado.

## Validaciones del cierre

HTTPS y HTML públicos 200; recursos CSS/JS/imágenes correctos; config pública 200 con solo sitekey; POST vacío 400; GET de envío 405. Navegador con movimiento reducido sin errores de recursos/JS ni overflow; no certifica visualmente WebGL. API health 200; nginx -t correcto en NPM; autenticación Zoho TLS465 correcta desde API sin correo. Recepción real en producción confirmada por el usuario, sin atribuir al agente envíos adicionales. [Detalle QA](../contact-form/QA.md).

## Respaldo y recuperación

Se conserva el respaldo privado previo npm-host-1.before.conf y el estado de contenedores en `.form027-private/tmpfs-fix-20261123T183402Z/`; permisos privados y claves SSL no copiadas. El respaldo queda fuera de Git y no se publica su contenido. No eliminar iwave-prod ni los volúmenes.

Rollback, solo si se autoriza o ante una incidencia durante un despliegue: en el **mismo Proxy Host 1**, por panel/API soportada de NPM, restaurar upstream **iwave-prod:80** y retirar **ambas ubicaciones API de prefijo** activas (y cualquier Advanced FORM-027 si existiera). Conservar todos los campos SSL, opciones de seguridad y otros hosts; validar nginx -t y HTTPS. No sobrescribir archivos generados ni editar SQLite. Conservar web/API actuales, HMAC y volumen contact-state hasta confirmar la restauración; no usar down -v ni borrar reservas. El resto del documento conserva procedimientos de referencia para operaciones futuras, no acciones necesarias para este cierre.

## Qué versionar y qué conservar privado

La lista explícita está en [form027/version-files.txt](form027/version-files.txt). Incluye API, lockfile, pruebas, plantillas, frontend FORM-027 y documentación. No contiene secretos ni dependencias instaladas. `Dockerfile`, `nginx.conf`, `.dockerignore` y el archivo histórico Caddy ya tenían cambios sin confirmar antes del cierre: están identificados para revisión, **no fueron reescritos en este cierre** y no autorizan recrear la infraestructura actual. Revisar sus diferencias antes de incluirlos en el commit futuro.

Permanecen privados: `.env`, `.env.form027-production`, cualquier `.env.*` excepto `.env.example`, contraseñas, claves de aplicación, claves privadas/certificados, secretos Turnstile/HMAC, logs, SQLite/WAL/SHM, volúmenes, respaldos NPM y `.form027-private/`. Sitekey es pública por contrato pero no se copian sus valores reales a la documentación. `.gitignore` protege estos patrones y los contextos Docker usan listas permitidas; nunca montar el repositorio o `.env` en la web. No ejecutar `git add .`, `git add -A` ni `git add -f`.

La revisión comparó en memoria los valores privados locales y AUTH codificado con archivos versionables y hasta 1000 líneas por contenedor de pruebas, además de patrones de claves privadas/tokens. No hubo coincidencias. Había cero archivos staged. Es una comprobación del árbol actual y de esos logs, no certifica todo el historial Git ni archivos privados externos.

## Referencia de commit y push

Solo después de autorización explícita para cada acción, desde la raíz del repositorio. El manifiesto evita incluir nuevos archivos por accidente; revisar también el contenido antes de confirmar. Nunca imprimir un diff si se sospecha que contiene un secreto: corregirlo privadamente primero. No cambiar de rama ni descartar la reconstrucción local.

```bash
set -euo pipefail
git status --short
git diff --check
# Detenerse si ya existen cambios staged ajenos; no limpiarlos automáticamente.
git diff --cached --quiet
git add --pathspec-from-file=docs/deployment/form027/version-files.txt
git diff --cached --name-only
git diff --cached --check
# Revisar localmente todos los cambios preparados, incluidos los preexistentes.
git diff --cached --stat
# Tras revisión del contenido y comprobación de secretos, con autorización de commit:
git commit -m 'feat(contact): preparar FORM-027 con Zoho y Turnstile'
# Solo con autorización de push; destino explícito, sin force:
git push origin HEAD:reconstruccion-iwave
```

Los commits fd39c70 y 12aae42 ya están publicados; este bloque queda como referencia futura. La corrección tmpfs se validó sin escritura Git; el usuario autorizó expresamente el commit y push de los cambios legítimos para este cierre definitivo. Antes de añadir el manifiesto comprobar que el índice no contiene cambios ajenos; si los tiene, resolver su alcance con el usuario sin limpiarlo automáticamente. El push de esta rama no autoriza publicar ni fusionar en otra rama.

## Preparación privada y respaldo — ejecutar solo al autorizar despliegue

Usar el SHA aprobado y un árbol limpio, sin perder cambios locales. No construir una release desde un árbol distinto del revisado. No reutilizar etiquetas de imágenes. No usar la `.env` de pruebas como configuración productiva sin revisar el par de claves Turnstile y destinatario.

```bash
set -euo pipefail
export FORM027_REVISION="$(git rev-parse HEAD)"
export FORM027_API_IMAGE="iwave-contact-api:form027-${FORM027_REVISION}"
export FORM027_WEB_IMAGE="iwave-landing:form027-${FORM027_REVISION}"
test -z "$(git status --porcelain)"
# Primera activación: negarse a sobrescribir un archivo productivo existente.
test ! -e .env.form027-production
install -m 600 .env .env.form027-production
```

Revisar `.env.form027-production` con editor privado. Credenciales Zoho y From/To deben ser los ya validados para contacto@iwave.cl; claves Turnstile del widget autorizado para iwave.cl/www; HMAC aleatorio estable >=32 caracteres, dedicado al estado productivo. No rotarlo tras empezar a recibir solicitudes. El Compose sobrescribe proveedor, bind/puerto, origen/hostname, ruta DB y proxies de confianza; no usa RESEND_API_KEY. Para actualizaciones conservar el archivo existente: no repetir la copia ni generar otro HMAC.

Guardar el SHA y las etiquetas anteriores de API/web en un respaldo privado por cada actualización. Respaldar la configuración de campos Advanced/Details del host NPM desde el panel, sin exportar claves TLS. El siguiente respaldo de configuración no contiene los archivos de certificados; sigue siendo privado:

```bash
set -euo pipefail
export FORM027_BACKUP_DIR="$PWD/.form027-private/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$FORM027_BACKUP_DIR"
docker inspect --format '{{.Name}} {{.Config.Image}} {{.Id}} {{.State.StartedAt}}' iwave-prod iwave-test iwave-npm > "$FORM027_BACKUP_DIR/containers-before.txt"
docker cp iwave-npm:/data/nginx/proxy_host/1.conf "$FORM027_BACKUP_DIR/npm-host-1.before.conf"
chmod 600 "$FORM027_BACKUP_DIR/containers-before.txt" "$FORM027_BACKUP_DIR/npm-host-1.before.conf"
docker exec iwave-npm nginx -t
```

No imprimir `docker inspect` completo, `env`, logs sin sanear ni `docker compose config` expandido. No copiar/leer claves SSL. Conservar los volúmenes de NPM y todos los certificados actuales.

## Procedimiento de arranque y validación de candidatos

Desde la misma shell con las tres variables FORM027 exportadas y el archivo privado revisado:

```bash
set -euo pipefail
docker network inspect iwave-web --format '{{.Name}}'
docker compose -f contact-api/compose.production.yml config --quiet
docker compose -f contact-api/compose.production.yml build
docker compose -f contact-api/compose.production.yml up -d --wait --wait-timeout 90
docker compose -f contact-api/compose.production.yml ps
docker compose -f contact-api/compose.production.yml exec -T iwave-form027-api node verify-smtp.mjs
docker compose -f contact-api/compose.production.yml exec -T iwave-form027-web nginx -t
docker compose -f contact-api/compose.production.yml exec -T iwave-form027-api node --input-type=module -e 'for(const url of ["http://127.0.0.1:3000/healthz","http://iwave-form027-web/"]){const r=await fetch(url);if(!r.ok)throw new Error("health-failed");}console.log("API y web candidatas: OK");'
docker exec iwave-npm getent hosts iwave-form027-api iwave-form027-web
```

Nombres propios y ausencia de puertos publicados evitan colisiones con los cinco contenedores existentes. No ejecutar `docker compose up` genérico, `docker network connect` sobre los existentes, `docker restart iwave-npm`, limpieza global ni `down -v`. `verify-smtp` no envía correo. Si algo falla, detener los candidatos y mantener NPM apuntando a iwave-prod.

## Referencia de activación NPM — ya completada fuera del cierre

Abrir la administración existente mediante su túnel seguro. En **el Proxy Host existente** `iwave.cl / www.iwave.cl`:

- Conservar Scheme `http`, puerto `80` y todas las opciones/SSL actuales.
- Después de validar los candidatos, cambiar únicamente Forward Hostname/IP de `iwave-prod` a `iwave-form027-web`.
- Añadir al final de Advanced el contenido exacto de [form027/npm.locations.conf](form027/npm.locations.conf), conservando cualquier configuración anterior. No pegar un bloque `server`, no reemplazar Advanced completo y no añadir Custom Locations duplicadas.

El snippet contiene dos ubicaciones exactas `/api/contact` y `/api/contact/config`, ambas con `proxy_pass http://iwave-form027-api:3000` **sin barra final**, conservando URI. Solo POST maneja el límite de 16 KiB. No publica `/healthz` ni hace que Nginx estático gestione la API. `X-Contact-Client-IP` se sobrescribe, aunque inicialmente la API lo ignora por la confianza vacía. Access log apagado en estas ubicaciones para reducir registro de datos de solicitudes.

Guardar en NPM constituye el cambio público; **no hacerlo antes de aprobación**. La sintaxis del snippet ya pasó en un Nginx temporal sin red; no se ha probado insertado en el host real. Los candidatos ya existen y resuelven entre sí en iwave-web; el enrutamiento público sigue pendiente. Comprobar inmediatamente después de guardar:

```bash
docker exec iwave-npm nginx -t
curl --fail --silent --show-error --output /dev/null https://iwave.cl/
curl --fail --silent --show-error --output /dev/null https://iwave.cl/api/contact/config
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' https://iwave.cl/.env
```

Esperar 200 para página/config y 404 para `.env`. Verificar también www según la política de redirección vigente, certificados sin cambios, JS/CSS/assets sin 404, ausencia de desbordamiento, widget real, errores de validación y protección de doble envío. No consultar ni registrar valores de la configuración pública en este informe. Sin `curl -k` ni desactivar TLS.

Un primer envío **en producción** requiere autorización explícita aparte, aun cuando ya se probaron correos en staging. Confirmar recepción en contacto@iwave.cl y responder al visitante; no anunciar entrega por HTTP 200 solamente. No reenviar contenido con resultado incierto: revisar primero buzón/Enviados y reservas.

## Rollback

Primera activación: en el mismo Proxy Host, restaurar Forward Hostname/IP a **iwave-prod**, Scheme `http`, puerto `80`; retirar solo las dos ubicaciones FORM-027 de prefijo activas o restituir el Advanced respaldado. Conservar SSL, certificados y todas las opciones originales. Guardar y comprobar `docker exec iwave-npm nginx -t`, HTTPS, assets y canales de contacto de la versión anterior. No sobrescribir archivos generados de NPM con `docker cp`: restaurar desde sus campos/panel para que la base de datos y la configuración coincidan.

Después de restaurar el tráfico y verificarlo, detener solo los nuevos servicios:

```bash
set -euo pipefail
docker compose -f contact-api/compose.production.yml stop iwave-form027-web iwave-form027-api
```

Conservar imágenes, `.env.form027-production`, HMAC y volumen `iwave-form027-prod_contact-state`. No usar `down -v`, `docker volume rm`, `git reset`, `git clean` ni alterar DNS/MX/Cloudflare. Si ya hubo solicitudes, hacer un respaldo SQLite consistente con la API detenida antes de cualquier mantenimiento del volumen; no copiar DB viva sin su WAL ni borrar reservas para forzar reenvío.

Actualizaciones posteriores: restaurar las etiquetas API/web de la release productiva anterior y ejecutar `up -d --no-build --wait` **solo** sobre este proyecto con esas etiquetas; conservar volumen/HMAC. Si el rollback funcional exige volver a iwave-prod, restaurar también Advanced/Details del respaldo de la primera activación. Cualquier formato de datos nuevo exigiría comprobar compatibilidad antes de restaurar imágenes; FORM-027 de este cierre no cambia el esquema.

## Historial de validación de la fase documental anterior

25/25 pruebas backend con mocks y regresión navegador 390/768/1440 px aprobadas. Compose productivo validado sin resolver el archivo privado aún no creado; sus variables efectivas, combinadas en memoria con la configuración privada local de pruebas, pasan readConfig con Zoho. Red iwave-web y membresía NPM/iwave-prod inspeccionadas en lectura. Snippet NPM validado por `nginx -t` sin red. Exclusiones/secretos y `git diff --check` revisados; resultados y límites en [QA](../contact-form/QA.md).

No se construyeron imágenes productivas, crearon candidatos, modificaron contenedores existentes, enviaron correos, guardó NPM, cambiaron certificados/DNS/MX/Cloudflare ni ejecutaron commit/push. Preparado para revisión y autorización; faltan archivo privado productivo, revisión del widget para los hosts reales y aprobación del corte.
