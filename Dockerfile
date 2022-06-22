FROM node:18.4.0-alpine as base

FROM base as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build:release

FROM base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY --from=builder /app/build ./build

ENV CONFIG_PATH /app/conf
ENV CACHE_DIR /app/cache

CMD ["node", "build/src/main.js", "--daemon"]
