import { NestFactory } from '@nestjs/core';
import { AnalyticsReportingModule } from './analytics-reporting.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsReportingModule);
  const configService = app.get(ConfigService)
  const kafkaService = app.get<KafkaService>(KafkaService)
  app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('REPORTS'))
  await app.listen(configService.get('PORT'));
  await app.startAllMicroservices();
}

bootstrap();

