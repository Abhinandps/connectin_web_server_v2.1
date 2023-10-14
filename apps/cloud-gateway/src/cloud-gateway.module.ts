import { Module } from '@nestjs/common';
import { CloudGatewayController } from './cloud-gateway.controller';
import { CloudGatewayService } from './cloud-gateway.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AUTH_SERVICE_URI: Joi.string().required(),
      }),
      envFilePath: './apps/cloud-gateway/.env'
    })
  ],
  controllers: [CloudGatewayController],
  providers: [CloudGatewayService],
})
export class CloudGatewayModule { }
