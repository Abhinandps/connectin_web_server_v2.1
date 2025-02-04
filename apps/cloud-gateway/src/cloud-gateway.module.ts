import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CloudGatewayController } from './cloud-gateway.controller';
import { CloudGatewayService } from './cloud-gateway.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'
import * as cookieParser from 'cookie-parser';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, CloudinaryMiddleware, JwtAuthGuard, KafkaService } from '@app/common';
import { ServiceRegistryService } from './service-refistry.service';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenJwtStrategy } from './strategies/access_jwt-strategy';
import { RefreshTokenJwtStrategy } from './strategies/refresh_jwt-strategy';
import { PAYMENT_SERVICE } from './constant/services';
import { GatewayModule } from './websocket/user.gateway.module';

@Module({
  imports: [
    GatewayModule,
    HttpModule,
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



export class CloudGatewayModule implements NestModule {
  constructor(private serviceRegistry: ServiceRegistryService) {
    this.serviceRegistry.registerService({
      name: 'auth',
      urls: ['http://auth:3001/api/v1/auth'],
      openRoutes: ['/login', '/register']
    });
    this.serviceRegistry.registerService({
      name: 'users',
      urls: ['http://localhost:3002/api/v1/users'],
      openRoutes: ['']
    });
    this.serviceRegistry.registerService({
      name: 'posts',
      urls: ['http://localhost:3003/api/v1/posts'],
      openRoutes: ['/utils/upload-files', '/:postID']
    });
    this.serviceRegistry.registerService({
      name: 'reports',
      urls: ['http://localhost:3004/api/v1/reports'],
      openRoutes: ['']
    });
    this.serviceRegistry.registerService({
      name: 'payments',
      urls: ['http://localhost:3005/api/v1/payments'],
      openRoutes: ['/config']
    });
    this.serviceRegistry.registerService({
      name: 'jobs',
      urls: ['http://localhost:3006/api/v1/jobs'],
      openRoutes: ['/calendly-webhook']
    });
    this.serviceRegistry.registerService({
      name: 'chat',
      urls: ['http://localhost:3008/api/v1/chat'],
      openRoutes: ['']
    });
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CloudinaryMiddleware).forRoutes('posts/utils/upload-files')
    consumer.apply(CloudinaryMiddleware).forRoutes('jobs/resume')
  }
}


