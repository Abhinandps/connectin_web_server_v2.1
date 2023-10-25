import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  // const kafkaService = app.get<KafkaService>(KafkaService)
  // app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('USER'))
  const configService = app.get(ConfigService)
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();

