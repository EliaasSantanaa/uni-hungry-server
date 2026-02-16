import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Application');
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe()); 

  await app.listen(process.env.PORT ?? 5000);
  logger.debug(`Servidor rodando http://192.168.1.29:${process.env.PORT ?? 5000}`);
}
bootstrap();
