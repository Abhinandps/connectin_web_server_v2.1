import { Module } from '@nestjs/common';
import { AnalyticsReportingController } from './analytics-reporting.controller';
import { AnalyticsReportingService } from './analytics-reporting.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { AUTH_SERVICE, DatabaseModule, KafkaModule } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReportsRepository } from './reports.repository';
import { USER_SERVICE } from './constant/services';

@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema }
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
      }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required()
      }),
      envFilePath: './apps/analytics-reporting/.env'
    }),
    DatabaseModule
  ],
  controllers: [AnalyticsReportingController],
  providers: [AnalyticsReportingService, ReportsRepository],
})
export class AnalyticsReportingModule { }
