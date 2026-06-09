# backend/profile-service/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm i --omit=dev

COPY server.mjs ./
EXPOSE 3001
CMD ["node", "server.mjs"]
