import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './schemas/jobs.schema';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { JobRepository } from './jobs.repository';
import { DatabaseModule } from '@app/common';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/jobs/.env'
    }),
    DatabaseModule
  ],
  controllers: [JobsController],
  providers: [JobsService, JobRepository],
})

export class JobsModule { }

