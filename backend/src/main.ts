import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Aceita várias origens separadas por vírgula; o padrão é o `ng serve` do Angular.
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map((o) => o.trim()),
  });
  await app.listen(process.env.PORT ?? 3333);
}
await bootstrap();
