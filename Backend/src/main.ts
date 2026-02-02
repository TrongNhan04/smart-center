import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalInterceptors(new TransformInterceptor())
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'POST, GET, PUT, PATCH, DELETE',
    credentials: true
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
