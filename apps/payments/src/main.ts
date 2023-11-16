import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
  // const kafkaService = app.get<KafkaService>(KafkaService)
  // app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('PAYMENT'))
  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
  await app.startAllMicroservices();
}
bootstrap();


