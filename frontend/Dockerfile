FROM node:20-alpine
WORKDIR /app
COPY frontend/package.json ./package.json
RUN npm install
COPY frontend ./
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--allowed-hosts", "all", "--proxy-config", "proxy.docker.conf.json", "--poll", "2000"]
