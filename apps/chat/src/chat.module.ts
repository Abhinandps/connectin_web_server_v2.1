import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE } from './constants/services';
import { DatabaseModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { chatRepository } from './chat.repository';
import { SocketClient } from './websocket/user.socketClient';
import { UserGatewayModule } from './websocket/user.gateway.module';

@Module({
  imports: [
    UserGatewayModule,
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/chat/.env'
    }),
    DatabaseModule
  ],
  controllers: [ChatController],
  providers: [ChatService, chatRepository, SocketClient],
})

export class ChatModule { }


