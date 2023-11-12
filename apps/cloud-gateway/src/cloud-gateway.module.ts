import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CloudGatewayController } from './cloud-gateway.controller';
import { CloudGatewayService } from './cloud-gateway.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'
import * as cookieParser from 'cookie-parser';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, JwtAuthGuard, KafkaService } from '@app/common';
import { ServiceRegistryService } from './service-refistry.service';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenJwtStrategy } from './strategies/access_jwt-strategy';
import { RefreshTokenJwtStrategy } from './strategies/refresh_jwt-strategy';

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
    }),
    PassportModule.register({ defaultStrategy: "jwt", session: false }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}`
        }
      }),
      inject: [ConfigService]
    }),
  ],
  controllers: [CloudGatewayController],
  providers: [CloudGatewayService,
    ServiceRegistryService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AccessTokenJwtStrategy,
    RefreshTokenJwtStrategy
  ],
})


export class CloudGatewayModule {
  constructor(private serviceRegistry: ServiceRegistryService) {
    this.serviceRegistry.registerService({
      name: 'auth',
      urls: ['http://localhost:3001/api/v1/auth'],
      openRoutes: ['/login']
    });
  }
}


