FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./

#compile webServer
COPY src/ ./src
RUN npm run build

#compile frontend
COPY ./frontEnd/ ./frontEnd/
WORKDIR /usr/src/app/frontEnd
RUN npm install
RUN npm run build
RUN npx tailwindcss -i ./website/src/styles/input.css -o ./website/dist/styles/output.css

FROM debian:bullseye-slim
ARG NODE_MAJOR_LTS=20

RUN apt-get update && \
	apt-get install -y curl ca-certificates gnupg --no-install-recommends && \
	mkdir -p /etc/apt/keyrings && \
	curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
	echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR_LTS.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
	apt-get update && \
	apt-get install nodejs -y --no-install-recommends && \
	rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

RUN mkdir -p /var/www/html/website
RUN mkdir -p /var/www/html/website/public/avatars

COPY --from=builder /usr/src/app/dist ./var/www/html/dist/
COPY --from=builder /usr/src/app/frontEnd/website/dist ./var/www/html/website/dist
COPY --from=builder /usr/src/app/frontEnd/website/index.html ./var/www/html/website
COPY --from=builder /usr/src/app/frontEnd/website/src/components/ ./var/www/html/website/dist/components/
COPY --from=builder /usr/src/app/frontEnd/website/public/avatars ./var/www/html/website/public/avatars

WORKDIR /var/www/html

CMD ["node", "dist/webserver.js"]