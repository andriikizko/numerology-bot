FROM node:18-alpine

WORKDIR /app

COPY bot/package*.json ./

RUN npm install --production

COPY bot/src ./src

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "src/bot.js"]
