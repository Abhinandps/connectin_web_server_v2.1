import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CloudGatewayController } from './cloud-gateway.controller';
import { CloudGatewayService } from './cloud-gateway.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import * as cookieParser from 'cookie-parser';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, JwtAuthGuard, KafkaService } from '@app/common';

@Module({
  imports: [
    HttpModule,
    // ClientsModule.register([
    //   {
    //     name: AUTH_SERVICE,
    //     transport: Transport.KAFKA,
    //     options: {
    //       client: {
    //         brokers: ['localhost:9092'],
    //       },
    //       consumer: {
    //         groupId: `${AUTH_SERVICE}-consumer`
    //       }
    //     }
    //   },
    // ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AUTH_SERVICE_URI: Joi.string().required(),
      }),
      envFilePath: './apps/cloud-gateway/.env'
    })
  ],
  controllers: [CloudGatewayController],
  providers: [CloudGatewayService,
    // KafkaService,JwtAuthGuard
  ],
})

export class CloudGatewayModule { }
