FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY mqtt ./mqtt
COPY tsconfig.json ./

CMD ["npx", "tsx", "mqtt/worker.ts"]
