import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.2.245:3000',
      'http://192.168.2.174:3000',
      'http://192.168.3.58:3000',
      'http://110.39.23.107:3000',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedDevOrigins: true,
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
