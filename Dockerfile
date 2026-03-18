FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3030 3000

CMD ["sh", "-c", "npm run start:dev"]

