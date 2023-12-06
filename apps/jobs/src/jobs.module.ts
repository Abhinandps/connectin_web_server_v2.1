import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './schemas/jobs.schema';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { ApplyRepository, JobRepository, ResumeRepository } from './jobs.repository';
import { CloudinaryMiddleware, DatabaseModule, NOTIFICATIONS_SERVICE } from '@app/common';
import { Apply, ApplySchema } from './schemas/apply.schema';
import { ResumeSchema, Resumes } from './schemas/resume.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Apply.name, schema: ApplySchema },
      { name: Resumes.name, schema: ResumeSchema }
    ]),
    ClientsModule.register([
      {
        name: NOTIFICATIONS_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: `${NOTIFICATIONS_SERVICE}-consumer`
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
      envFilePath: './apps/jobs/.env'
    }),
    DatabaseModule
  ],
  controllers: [JobsController],
  providers: [JobsService, JobRepository, ResumeRepository, ApplyRepository],
})

export class JobsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CloudinaryMiddleware).forRoutes('api/v1/jobs/resume')
  }
}

