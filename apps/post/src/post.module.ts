import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { ConfigModule } from '@nestjs/config';
import * as  Joi from 'joi';
import { AUTH_SERVICE, AuthModule, CloudinaryMiddleware, DatabaseModule, JwtAuthGuard } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/posts.schema';
import { PostRepository } from './posts.repsitory';
import { HashTag, HashTagSchema } from './schemas/hashTag.schema';
import { HashTagRepository } from './hashTags.repository';
import { USER_SERVICE } from './constant/services';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: HashTag.name, schema: HashTagSchema }
    ]),
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
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/post/.env'
    }),
    DatabaseModule
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository, HashTagRepository],
})


export class PostModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CloudinaryMiddleware).forRoutes('api/v1/posts/utils/upload-files')
  }
}



