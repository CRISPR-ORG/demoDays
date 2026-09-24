FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build


FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/ ./


FROM node:20-alpine

WORKDIR /app

COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server ./server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server/src/index.js"]