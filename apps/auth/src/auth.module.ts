import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'
import { DatabaseModule, KafkaService, RedisModule, RedisPubSubService, } from '@app/common';
import { AuthRepository } from './auth.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenJwtStrategy } from './strategies/refresh_jwt-strategy';
import { AccessTokenJwtStrategy } from './strategies/access_jwt-strategy';
import { EmailConfirmationController } from './emailConfirmation.controller';
import { EmailConfirmationService } from './emailConfirmation.service';
import EmailService from './email.service';
import { USER_SERVICE } from './constant/services';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_FILTER } from '@nestjs/core';


@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: `${USER_SERVICE}-consumer`
          }
        }
      },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        EMAIL_SERVICE: Joi.string().required(),
        EMAIL_USER: Joi.string().required(),
        EMAIL_PASSWORD: Joi.string().required(),
        EMAIL_CONFIRMATION_URL: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required(),
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: './apps/auth/.env'
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
    DatabaseModule,
    RedisModule
  ],
  controllers: [AuthController, EmailConfirmationController],
  providers: [AuthService, AuthRepository,
    RefreshTokenJwtStrategy, AccessTokenJwtStrategy, EmailConfirmationService,
    EmailService, KafkaService, RedisPubSubService],
  exports: [RedisPubSubService]
})
export class AuthModule {

}
