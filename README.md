# 🍽️ Uni Hungry — Server

API REST do sistema **Uni Hungry**, plataforma de gestão de restaurantes universitários.
Construída com **NestJS**, **Prisma** (PostgreSQL via Supabase) e autenticação via **JWT + OTP por e-mail**.

---

## 📋 Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| PostgreSQL | 14+ (ou conta Supabase) |

---

## 🚀 Instalação e execução

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/uni-hungry-server.git
cd uni-hungry-server
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL (ex: `postgresql://user:pass@host:5432/db`) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `RESEND_API_KEY` | Chave da API Resend (envio de e-mails OTP) |
| `RESEND_FROM` | Endereço de envio dos e-mails (ex: `noreply@seudominio.com`) |
| `FRONTEND_URL` | URL do frontend (adicionada ao CORS) |
| `PORT` | Porta em que o servidor vai rodar (padrão: `3001`) |
| `NODE_ENV` | Ambiente (`development` / `production`) |

### 4. Execute as migrations do banco

```bash
npx prisma migrate deploy
```

> Para gerar o Prisma Client após alterações no schema:
> ```bash
> npx prisma generate
> ```

### 5. (Opcional) Seed do banco — criar admin inicial

```bash
npm run seed:admin
```

### 6. Inicie o servidor

```bash
# Modo desenvolvimento (hot reload)
npm run start:dev

# Modo produção
npm run start:prod
```

O servidor estará disponível em: **http://localhost:3001**

---

## 📖 Documentação da API (Swagger)

Com o servidor rodando, acesse:

```
http://localhost:3001/docs
```

A documentação interativa lista todas as rotas, parâmetros, exemplos de payload e respostas.

### Fluxo de autenticação

```
POST /auth/sign-in       → envia código OTP por e-mail
POST /auth/verify-otp    → valida o código e retorna o JWT
```

Use o token retornado no header de todas as requisições autenticadas:

```
Authorization: Bearer <token>
```

---

## 🗂️ Módulos da API

| Prefixo | Descrição | Roles permitidas |
|---|---|---|
| `GET /` | Health check + status do banco | Público |
| `/auth` | Autenticação (OTP) e gestão de funcionários | Público / Autenticado |
| `/restaurants` | Gestão do restaurante do usuário | MANAGER, WAITER |
| `/menu` | Cardápio — itens e categorias | MANAGER, WAITER |
| `/tabs` | Mesas e comandas | MANAGER, WAITER |
| `/users` | Gerenciamento de usuários | ADMIN |
| `/dashboard` | Visão geral administrativa | ADMIN |
| `/metrics` | Métricas por restaurante | ADMIN |

---

## 🐳 Docker

```bash
docker build -t uni-hungry-server .
docker run -p 3001:3001 --env-file .env uni-hungry-server
```

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes E2E
npm run test:e2e
```

---

## 🛠️ Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Inicia em modo desenvolvimento com hot reload |
| `npm run start:debug` | Inicia em modo debug com hot reload |
| `npm run start:prod` | Inicia a build de produção |
| `npm run build` | Compila o projeto |
| `npm run lint` | Executa o ESLint |
| `npm run format` | Formata o código com Prettier |
| `npm run seed:admin` | Cria o usuário administrador inicial |

---

## 🏗️ Tecnologias

- **[NestJS](https://nestjs.com/)** — framework Node.js
- **[Prisma](https://www.prisma.io/)** — ORM com PostgreSQL
- **[Supabase](https://supabase.com/)** — banco de dados e autenticação base
- **[Resend](https://resend.com/)** — envio de e-mails transacionais (OTP)
- **[Passport JWT](https://www.passportjs.org/)** — autenticação por token
- **[@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)** — documentação OpenAPI

---

## 📄 Licença

Projeto privado — todos os direitos reservados.
