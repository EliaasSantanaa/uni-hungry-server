# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte e arquivos necessários
COPY . .

# Gerar Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build da aplicação
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar schema do Prisma
COPY prisma ./prisma

# Gerar Prisma Client na imagem de produção
RUN npx prisma generate --schema=prisma/schema.prisma

# Copiar build da aplicação
COPY --from=builder /app/dist ./dist

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expor porta da aplicação
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]
