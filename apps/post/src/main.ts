import { NestFactory } from '@nestjs/core';
import { PostModule } from './post.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(PostModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}

bootstrap();

