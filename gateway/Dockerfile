FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY server.js .

EXPOSE 3333
CMD ["node", "server.js"]