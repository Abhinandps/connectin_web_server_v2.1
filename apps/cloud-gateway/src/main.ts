import { NestFactory } from '@nestjs/core';
import { CloudGatewayModule } from './cloud-gateway.module';
import cookieParser from 'cookie-parser';

import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(CloudGatewayModule);

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })

  // const kafkaService = app.get<KafkaService>(KafkaService)
  // app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('CLOUD'))
  // const configService = app.get(ConfigService)
  // await app.startAllMicroservices();


  await app.listen(3000);
}

bootstrap();

