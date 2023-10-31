import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { ConfigModule } from '@nestjs/config';
import * as  Joi from 'joi';
import { AUTH_SERVICE, AuthModule, CloudinaryMiddleware, JwtAuthGuard } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // EventEmitterModule.forRoot(),
    AuthModule,
    ClientsModule.register([
      {
        name: AUTH_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: `${AUTH_SERVICE}-consumer`
          }
        }
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/post/.env'
    })
  ],
  controllers: [PostController],
  providers: [PostService],
})

export class PostModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CloudinaryMiddleware).forRoutes(
      'test'
    )
  }
}
