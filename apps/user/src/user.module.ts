import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'
import { AUTH_SERVICE, DatabaseModule, KafkaModule, KafkaService, POST_SERVICE, RedisModule, RedisPubSubService, RedisService } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Education, EducationSchema } from './schemas/education.schema';
import { WorkExperience, WorkExperienceSchema } from './schemas/workexperience.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PAYMENT_SERVICE, USER_SERVICE } from './constant/services';
import { Neo4jModule } from './neo4j/neo4j.module';
import { Neo4jConfig } from './neo4j/neo4j-config.interface';
import { UserRepository } from './user.repository';
import { UserGateway } from './websocket/user.gateway';

@Module({
  imports: [
    KafkaModule,
    RedisModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Education.name, schema: EducationSchema },
      { name: WorkExperience.name, schema: WorkExperienceSchema }
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
    ]),
    ClientsModule.register([
      {
        name: POST_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: `${POST_SERVICE}-consumer`
          }
        }
      },
    ]),
    ClientsModule.register([
      {
        name: PAYMENT_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: `${PAYMENT_SERVICE}-consumer`
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
      envFilePath: './apps/user/.env'
    }),
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService,],
      useFactory: (configService: ConfigService): Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      })
    }),
    DatabaseModule
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, RedisService, RedisPubSubService,UserGateway],
  exports: [RedisPubSubService]
})
export class UserModule { }
