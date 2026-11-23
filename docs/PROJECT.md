## FORM-027 — contacto comercial vigente

El formulario utiliza una API independiente `POST /api/contact` con Zoho SMTP como primera opción preparada y Resend como alternativa explícita; Turnstile se valida en servidor. Zoho usa `contacto@iwave.cl` como remitente y destinatario, con Reply-To del visitante; no requiere un nuevo subdominio de envío. Resend conserva el remitente dedicado en `notificaciones.iwave.cl`. La VPS alcanza SMTP 465/587 con TLS válido; el usuario confirmó en pruebas el flujo completo Turnstile/API/Zoho, recepción y Reply-To. Conserva nombre, empresa opcional, correo, solución y mensaje; muestra estados sin recargar. Sustituye el transporte mailto temporal descrito en las entradas históricas inferiores. Correo directo y WhatsApp permanecen disponibles. Docker de pruebas activado solo en loopback (web 8127, API 3027); producción y DNS intactos. Pruebas reales confirmadas por el usuario; preparación de producción con Compose separado, NPM y rollback en [FORM-027 producción](deployment/FORM-027.md), sin activación pública. Configuración y despliegue primero en pruebas: [FORM-027](contact-form/README.md).

## UX-014 — recorrido vigente

Inicio → Transformación/Impacto → Soluciones → Experiencia profesional → Tecnologías y capacidades → Cómo trabajamos → Contacto → Footer. “Qué resolvemos” se integra en Transformación mediante un desplegable, conservando `#informacion`; `#impacto` también enlaza al mismo capítulo. Prevalece sobre los órdenes históricos siguientes. Identidad comercial y canales conservados; contacto invita a optimizar, conectar o desarrollar.

## UX-011 — identidad vigente

Deep Space + Electric Cyan aplicada sobre EXP-010 existente: se conserva el recorrido de ocho secciones. Menú: Qué resolvemos → Soluciones → Impacto → Cómo trabajamos → Trayectoria → Capacidades → Contacto; marca vuelve a Inicio. La identidad, tokens, atmósferas y reglas responsive están en `DESIGN_SYSTEM.md`. Contenido comercial, logotipos y contacto mailto conservados.

## EXP-010 — alcance comercial vigente

Hero usa la descripción aprobada: “Optimizamos tareas, estructuramos información y desarrollamos soluciones digitales que fortalecen la gestión, agilizan decisiones e impulsan operaciones más eficientes, visibles y escalables.” Etiquetas: Optimización, Información, Gestión e Inteligencia de Negocios. Se mantiene el título aprobado.

Recorrido: Hero → Qué resolvemos → Soluciones → Impacto → Cómo trabajamos → Trayectoria → Tecnologías y capacidades → Contacto → Footer. Las cuatro familias agrupan productividad y optimización, información e integración, inteligencia de negocios y plataformas digitales. Contacto incluye además integración, alertas/monitoreo y plataformas operativas.

# Proyecto iWave

## Identidad y propuesta de valor
 iWave vende **Productividad Digital** a personas, equipos y organizaciones. Automatiza tareas repetitivas, estructura información y crea soluciones digitales para mejorar la gestión, agilizar decisiones y fortalecer el crecimiento. La landing actual enfatiza gerencias, operaciones, ventas y administración.

## Hero aprobado como referencia de trabajo
Texto conservado de `index.html` en la reconstrucción actual:
- Insignia: “Soluciones digitales para productividad operacional”.
- Título: “Elevamos la forma de trabajar con productividad digital.”
- Descripción: “Optimizamos tareas, estructuramos información y desarrollamos soluciones digitales que fortalecen la gestión, agilizan decisiones e impulsan operaciones más eficientes, visibles y escalables.”
- CTA principal: “Solicitar evaluación” (WhatsApp).
- CTA secundario: “Conocer soluciones” (`#servicios`).

## Servicios
- Automatización: tareas repetitivas y flujos de trabajo con menor intervención manual.
- Inteligencia de Negocios: indicadores, reportes y plataformas de análisis.
- Gestión de información: integración, estructura y organización de fuentes para mejorar disponibilidad y confiabilidad.
- Soluciones digitales: herramientas y plataformas adaptadas a necesidades de gestión y productividad.

## Comunicación
Tono corporativo, tecnológico, moderno y claro; expresar beneficios operativos concretos. Evitar posicionar iWave como proveedora de IA, promesas absolutas, métricas no respaldadas, tecnicismos innecesarios y efectos o mensajes exagerados. Antes/Después ilustra una transformación conceptual, sin métricas reales.

## Enlaces y canales existentes
- Sitio y URL canónica: https://iwave.cl/ (no implica verificación de despliegue).
- WhatsApp público: +56 9 5344 2563; enlace base https://wa.me/56953442563. Hero, contacto y botón flotante añaden el mismo mensaje prellenado de evaluación de productividad digital.
- Correo público: [contacto@iwave.cl](mailto:contacto@iwave.cl).
- Navegación: `#servicios`, `#transformacion`, `#proceso`, `#contacto`; marca y pie enlazan a `#inicio`; salto accesible a `#contenido`.

Fuente: contenido actual de `index.html` y decisiones permanentes del encargo. Para cambios, seguir `../AGENTS.md`.

## EXP-002 — contacto y narrativa
- Recorrido actual: identidad → qué resolvemos (incluye Antes/Después) → soluciones → cómo trabajamos → contacto. Se mantiene íntegra la propuesta aprobada del Hero y ambos CTA.
- Formulario temporal a `contacto@iwave.cl`: nombre, correo, solución y mensaje obligatorios; empresa opcional. Abre el cliente de correo y requiere que el visitante complete el envío. No existe backend, almacenamiento ni confirmación de recepción; WhatsApp sigue disponible.
- El original de marca es JPG. UI-005 conserva ese arte en un SVG con filtro de transparencia y encuadre ajustado para el Hero; header conserva el JPG. No es una vectorización: la definición sigue limitada por el original de 1254 × 1254.

## EXP-003 — capacidades y trayectoria
- Recorrido ampliado entre Soluciones y Proceso: Tecnología aplicada a desafíos reales (`#capacidades`) y Experiencia en entornos empresariales (`#experiencia`). El menú principal y los CTA existentes se conservan.
- Cinco especialidades: Python/automatización, SQL Server/datos, BI, plataformas/aplicaciones e infraestructura/integraciones. Tecnologías como herramientas aplicadas, sin certificaciones atribuidas.
- EXP-007 incorpora MetLife, BancoEstado Corredores de Seguros, Banco de Chile y Scotiabank en un muro de marcas, en el contexto de experiencia profesional del fundador en otros empleos; no se presentan como clientes directos, aliados o patrocinadores de iWave. Logos locales proporcionados; BancoEstado usa la marca matriz con identificación textual de Corredores de Seguros. Fuentes en `../img/experience/brands/SOURCES.md`.
