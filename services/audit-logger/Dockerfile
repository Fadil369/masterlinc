FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g tsx

COPY . .

EXPOSE 3001

CMD ["tsx", "src/index.ts"]
