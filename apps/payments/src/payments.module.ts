import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { DatabaseModule, KafkaService } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE } from './constant/services';
import { SubscriptionRepository } from './payment.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema, Subscription } from './schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: PaymentSchema }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required()
      }),
      envFilePath: './apps/payments/.env'
    }),
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
    DatabaseModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, KafkaService, SubscriptionRepository],
})
export class PaymentsModule { }
