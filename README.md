# Uni Hungry — Server

API REST do **Uni Hungry**, plataforma de gestão de restaurantes universitários. Construída com NestJS, Prisma (PostgreSQL via Supabase) e autenticação JWT + OTP por e-mail.

> Parte do ecossistema Uni Hungry: atende o painel [`uni-hungry-admin`](../uni-hungry-admin) e o app mobile [`uni-hungry-app`](../uni-hungry-app).

---

## Pré-requisitos

| Ferramenta | Versão |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| PostgreSQL | 14+ (ou conta Supabase) |

---

## Instalação

```bash
git clone https://github.com/seu-usuario/uni-hungry-server.git
cd uni-hungry-server
npm install
```

### Variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `RESEND_API_KEY` | Chave da API Resend (envio de OTP) |
| `RESEND_FROM` | Endereço de envio (ex: `noreply@seudominio.com`) |
| `FRONTEND_URL` | URL do front-end (CORS) |
| `PORT` | Porta do servidor (padrão: `3001`) |
| `NODE_ENV` | `development` ou `production` |

### Banco de dados

```bash
npx prisma migrate deploy
npx prisma generate   # após alterações no schema
npm run seed:admin    # (opcional) cria admin inicial
```

---

## Execução

```bash
npm run start:dev     # Desenvolvimento (hot reload)
npm run start:prod    # Produção
npm run build         # Compilar
npm run lint          # ESLint
npm run format        # Prettier
```

Servidor: **http://localhost:3001**  
Swagger: **http://localhost:3001/docs**

---

## Testes unitários

Os testes unitários usam **Jest** e ficam em arquivos `*.spec.ts` dentro de `src/`.

```bash
# Rodar todos os testes unitários
npm run test

# Modo watch (reexecuta ao salvar)
npm run test:watch

# Cobertura de código
npm run test:cov

# Debug
npm run test:debug
```

**Testes E2E** (separados dos unitários):

```bash
npm run test:e2e
```

> Não é necessário banco ou `.env` para os testes unitários — serviços e controllers são testados com mocks.

---

## Autenticação

```
POST /auth/sign-in     → envia código OTP por e-mail
POST /auth/verify-otp  → valida o código e retorna JWT
```

Header das requisições autenticadas:

```
Authorization: Bearer <token>
```

---

## Módulos da API

| Prefixo | Descrição | Roles |
|---|---|---|
| `GET /` | Health check | Público |
| `/auth` | Autenticação OTP e funcionários | Público / Autenticado |
| `/restaurants` | Restaurante do usuário | MANAGER, WAITER |
| `/menu` | Cardápio (itens e categorias) | MANAGER, WAITER |
| `/tabs` | Mesas e comandas | MANAGER, WAITER |
| `/users` | Gerenciamento de usuários | ADMIN |
| `/dashboard` | Visão administrativa | ADMIN |
| `/metrics` | Métricas por restaurante | ADMIN |
| `/presence` | Presença online | Autenticado |

---

## Docker

```bash
docker build -t uni-hungry-server .
docker run -p 3001:3001 --env-file .env uni-hungry-server
```

---

## Tecnologias

- NestJS · Prisma · PostgreSQL
- Supabase · Resend · Passport JWT
- Swagger (OpenAPI) · Jest

---

## Equipe

| Nome | RA |
|---|---|
| Elias Santana Santos | 97351 |
| Gabriel da Silva Araujo | 89655 |
| Nathan Rodrigues de Freitas | 98502 |
| Thiago de Almeida Brum | 95574 |

---

## Licença

Projeto privado — todos os direitos reservados.
