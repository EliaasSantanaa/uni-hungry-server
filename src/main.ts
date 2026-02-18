import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Application');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
  
  app.useGlobalPipes(new ValidationPipe()); 

  await app.listen(process.env.PORT ?? 5000);
  logger.debug(`Servidor rodando http://localhost:${process.env.PORT ?? 5000}`);
}
bootstrap();
