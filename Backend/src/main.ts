import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  // app.useGlobalInterceptors(new TransformInterceptor())
  app.enableCors()
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
