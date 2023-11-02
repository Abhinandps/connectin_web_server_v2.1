import { NestFactory } from '@nestjs/core';
import { PostModule } from './post.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(PostModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}

bootstrap();

