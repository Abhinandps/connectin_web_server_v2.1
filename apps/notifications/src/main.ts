import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  const kafkaService = app.get<KafkaService>(KafkaService)
  app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('NOTIFICATIONS'))

  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
  await app.startAllMicroservices();
}
bootstrap();
