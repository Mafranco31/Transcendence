FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

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


WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
RUN npm install @fastify/jwt @fastify/cookie


COPY --from=builder /usr/src/app/dist ./dist/

CMD ["node", "dist/usermanagement.js"]