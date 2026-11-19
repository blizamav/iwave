# Metodología de desarrollo iWave

## Identidad y experiencia
- iWave vende **Productividad Digital**: automatización, gestión de información, inteligencia de negocios y soluciones digitales.
- No posicionar la empresa como proveedora de IA.
- Mantener tono corporativo, tecnológico, moderno y claro.
- Conservar diseño oscuro y acentos cian controlados, sin efectos visuales exagerados.
- Priorizar rendimiento, accesibilidad, responsive y claridad comercial.

## Flujo obligatorio por solicitud
1. Identificar el componente afectado y consultar este archivo y la documentación relacionada: [proyecto](docs/PROJECT.md), [arquitectura y mapa](docs/ARCHITECTURE.md), [diseño](docs/DESIGN_SYSTEM.md) e [historial](docs/CHANGELOG.md).
2. Inspeccionar únicamente los archivos y bloques necesarios. No repetir auditorías completas ni usar exploración masiva cuando ya se conoce el componente.
3. Implementar el cambio mínimo necesario. No modificar componentes ajenos ni reescribir archivos completos si basta una modificación puntual. No instalar dependencias innecesarias.
4. Ejecutar verificaciones focalizadas y comprobar errores antes de finalizar; usar los comandos de validación documentados según el alcance.
5. Revisar `git diff` y `git status`, distinguiendo los cambios propios de los preexistentes.
6. Actualizar documentación únicamente si cambia la arquitectura, el diseño o una decisión permanente. Si está desactualizada, el código real es la fuente de verdad: corregir la documentación afectada.
7. Registrar un resumen en `docs/CHANGELOG.md` cuando el cambio sea relevante. No inventar fechas, versiones, resultados de pruebas ni despliegues.
8. Entregar un informe breve con archivos modificados, pruebas ejecutadas y limitaciones. No declarar que una prueba visual pasó si no se realizó.

## Seguridad y preservación
- Preservar íntegramente los cambios existentes del usuario, incluida la reconstrucción sin confirmar. No descartar cambios.
- No acceder ni exponer secretos. No incluir contraseñas, claves SSH privadas, tokens ni certificados en documentación o salidas.
- No modificar infraestructura salvo autorización expresa; esto incluye `Dockerfile`, `nginx.conf`, Cloudflare y configuraciones de despliegue.
- No realizar despliegues, commits ni `git push` sin autorización expresa para la acción correspondiente. Esta tarea documental no autoriza ninguno.

Estas reglas se aplican automáticamente a las próximas solicitudes en este repositorio.
