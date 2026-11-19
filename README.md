# iWave Landing

Landing corporativa de iWave, enfocada en productividad digital: automatización, Inteligencia de Negocios, gestión de información y desarrollo de soluciones digitales.

## Objetivo

Comunicar de forma clara como iWave ayuda a empresas a:

- Reducir trabajo manual.
- Disminuir errores operativos.
- Automatizar tareas repetitivas.
- Conectar datos dispersos.
- Mejorar la toma de decisiones con informacion clara.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Docker
- Nginx

No usa frameworks.

## Estructura

```text
.
├── Dockerfile
├── index.html
├── nginx.conf
├── script.js
├── styles.css
└── img/
    └── logo/
        └── iwave.jpg
```

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador o usar un servidor local:

```bash
python3 -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080
```

## Ejecutar con Docker

Construir la imagen:

```bash
docker build -t iwave-landing:latest .
```

Ejecutar el contenedor:

```bash
docker run -d --name iwave-landing -p 80:80 iwave-landing:latest
```

Verificar:

```bash
curl -I http://localhost
```

## Redeploy

```bash
docker build -t iwave-landing:latest .
docker rm -f iwave-landing
docker run -d --name iwave-landing -p 80:80 iwave-landing:latest
```

## Contacto configurado

- WhatsApp: `+56 9 5344 2563`
- Correo: `contacto@iwave.cl`

## Reconstrucción local

La página conserva la identidad oscura, con acentos cian y animaciones moderadas.
La sección Antes / Después representa la transformación con nodos conectados:
horizontal en escritorio y vertical hasta 820 px. No muestra métricas reales.

El contenido y la navegación permanecen disponibles sin JavaScript. El menú móvil
se mejora progresivamente; incluye cierre con Escape y al cambiar de breakpoint.
Las animaciones respetan `prefers-reduced-motion`.

Validación estática: `node --check script.js` y `git diff --check`.
Antes de publicar, revisar en navegador desktop, tablet y móvil: desbordamientos,
textos, flujo animado, navegación por teclado y comportamiento sin JavaScript.
La reconstrucción no modifica Docker ni Nginx y no implica un despliegue.
