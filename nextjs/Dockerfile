FROM node:22-slim

WORKDIR /workdir/nextjs

RUN npm install -g pnpm

# Monorepo root
COPY ./pnpm-workspace.yaml pnpm-lock.yaml package.json /workdir
# Database workspace
COPY ./database/package.json ./database/tsconfig.json /workdir/database/
# Server-ts workspace
COPY ./server-ts/package.json ./database/tsconfig.json /workdir/server-ts/
# Next.js workspace
COPY ./nextjs/package.json ./nextjs/tsconfig.json /workdir/nextjs/

RUN pnpm install #--filter nextjs server-ts database

CMD ["pnpm", "next", "dev"]
