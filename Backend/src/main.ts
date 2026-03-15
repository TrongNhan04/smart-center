import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useBodyParser('json',{limit:'50mb'}) // cho request tối đa 50 mb
  app.use(urlencoded({extended:true, limit:'50mb'}))
  app.enableCors()
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
