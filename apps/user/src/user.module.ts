import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { DatabaseModule, KafkaModule, KafkaService } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Education, EducationSchema } from './schemas/education.schema';
import { WorkExperience, WorkExperienceSchema } from './schemas/workexperience.schema';
import { UserRepository } from './user.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE } from './constant/services';

@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Education.name, schema: EducationSchema },
      { name: WorkExperience.name, schema: WorkExperienceSchema }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/user/.env'
    }),
    DatabaseModule
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule { }
