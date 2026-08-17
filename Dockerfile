# --- build step ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

ENV NODE_OPTIONS=--max_old_space_size=4096

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

RUN pnpm rebuild lightningcss

COPY . .

# TODO: check if this should be hardcoded here
ARG EXPO_ROUTER_ORIGIN=https://wafrn-rn.app
ENV EXPO_ROUTER_ORIGIN=$EXPO_ROUTER_ORIGIN
RUN pnpm build:web

# --- runtime step ---
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# different from the app's dependency tree, only what the server needs
RUN npm install --omit=dev --no-package-lock --no-fund --no-audit \
  express@5.2.1 \
  @expo/server@0.7.5

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]
