import { NestFactory } from '@nestjs/core';
import { CloudGatewayModule } from './cloud-gateway.module';
import cookieParser from 'cookie-parser';
import { WsAdapter } from '@nestjs/platform-ws';
import { Server } from 'socket.io';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { GatewayModule } from './websocket/user.gateway.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(CloudGatewayModule);

  app.use(cookieParser());

  app.useWebSocketAdapter(new IoAdapter(app))

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: 3002, // Port where the user microservice is running
    },
  });


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

