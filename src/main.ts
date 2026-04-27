import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Application');
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir frontend
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8081',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // ── Swagger ────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Uni Hungry API')
    .setDescription(
      'API REST do sistema Uni Hungry — gestão de restaurantes universitários.\n\n' +
        '## Autenticação\n' +
        'A maioria dos endpoints exige um token JWT enviado no header:\n\n' +
        '```\nAuthorization: Bearer <token>\n```\n\n' +
        'O token é obtido pelo fluxo de login (`POST /auth/sign-in` → `POST /auth/verify-otp`).\n\n' +
        '## Roles\n' +
        '| Role | Descrição |\n' +
        '|---|---|\n' +
        '| `ADMIN` | Acesso total ao sistema (dashboard, métricas, usuários) |\n' +
        '| `MANAGER` | Gerencia seu restaurante, cardápio, mesas e comandas |\n' +
        '| `WAITER` | Acessa mesas e comandas do restaurante vinculado |\n' +
        '| `USER` | Usuário básico |',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Informe o token JWT obtido no login',
      },
      'JWT',
    )
    .addTag('Status', 'Health check e status da aplicação')
    .addTag('Auth', 'Autenticação e gestão de funcionários')
    .addTag('Restaurants', 'Gestão de restaurantes')
    .addTag('Menu', 'Cardápio — itens e categorias')
    .addTag('Tabs', 'Comandas e mesas')
    .addTag('Users', 'Gestão de usuários (apenas ADMIN)')
    .addTag('Dashboard', 'Visão geral administrativa (apenas ADMIN)')
    .addTag('Metrics', 'Métricas por restaurante (apenas ADMIN)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Uni Hungry API Docs',
  });
  // ──────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.debug(`Servidor rodando http://localhost:${port}`);
  logger.debug(`Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
