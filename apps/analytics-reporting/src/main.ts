import { NestFactory } from '@nestjs/core';
import { AnalyticsReportingModule } from './analytics-reporting.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsReportingModule);
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
}

bootstrap();

