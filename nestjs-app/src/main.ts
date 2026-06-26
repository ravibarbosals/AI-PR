import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // BUG (segurança): CORS aberto para qualquer origem em produção
  app.enableCors({ origin: '*' });

  await app.listen(3000);
  console.log(`Application running on port 3000`);
}

bootstrap();
