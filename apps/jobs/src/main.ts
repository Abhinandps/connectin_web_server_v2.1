import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(JobsModule);
  app.useGlobalPipes(new ValidationPipe())

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}

bootstrap();

