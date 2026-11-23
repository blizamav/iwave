FROM nginx:alpine

ARG IWAVE_REVISION
LABEL org.opencontainers.image.revision=$IWAVE_REVISION

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY script.js /usr/share/nginx/html/script.js
COPY img /usr/share/nginx/html/img
COPY robots.txt sitemap.xml favicon.ico /usr/share/nginx/html/

EXPOSE 80
