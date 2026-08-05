# Debian slim avoids musl/native build issues (e.g. argon2).
# Match local dev: `node -v` / `npm -v` (see first RUN below).
FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN node -v && npm -v

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x docker-entrypoint.sh && npm run build

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
