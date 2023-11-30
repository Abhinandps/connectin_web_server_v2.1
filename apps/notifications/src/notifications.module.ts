import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaModule, KafkaService, NOTIFICATIONS_SERVICE } from '@app/common';
import { UserGatewayModule } from './websocket/user.gateway.module';
import { SocketClient } from './websocket/user.socketClient';

@Module({
  imports: [
    UserGatewayModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.string().required(),
        EMAIL_SERVICE:Joi.string().required(),
        EMAIL_USER :Joi.string().required(),
        EMAIL_PASSWORD :Joi.string().required(),
      }),
      envFilePath: './apps/notifications/.env'
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, KafkaService,SocketClient],
})
export class NotificationsModule { }
