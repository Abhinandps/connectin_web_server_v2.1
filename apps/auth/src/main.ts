import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.use(cookieParser())
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}
bootstrap();
