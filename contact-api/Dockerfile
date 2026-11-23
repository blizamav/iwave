FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-fund --no-audit
COPY --chown=node:node config.mjs store.mjs server.mjs smtp.mjs verify-smtp.mjs ./
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
