FROM node:22-slim

WORKDIR /workdir/server-ts

RUN npm install -g pnpm

# monorepo root
COPY ./pnpm-workspace.yaml pnpm-lock.yaml package.json /workdir/
# database
COPY ./database/package.json ./database/tsconfig.json /workdir/database/
# server-ts
COPY ./server-ts/package.json ./server-ts/tsconfig.json /workdir/server-ts/

RUN pnpm install #--filter server-ts database

CMD ["pnpm", "dev"]
