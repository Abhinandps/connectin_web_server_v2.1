import { NestFactory } from '@nestjs/core';
import { CloudGatewayModule } from './cloud-gateway.module';
import * as cookieParser from 'cookie-parser'

import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(CloudGatewayModule);

  app.use(cookieParser());
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })


  await app.listen(3000);
}

bootstrap();

