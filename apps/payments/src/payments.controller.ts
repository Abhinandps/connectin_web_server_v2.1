import { Controller, UsePipes, Get, ValidationPipe, Post, Body, Response, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateChargeDto, CreateSubscriptionDto } from '@app/common/dto';
import { ConfigService } from '@nestjs/config';

@Controller('/api/v1/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) { }

  // @UsePipes(new ValidationPipe())
  @Post('create-payment-intent')
  async createPaymentIntent(@Body() data: CreateChargeDto, @Query() query: any, @Response() res) {
    const request: any = data.data

    const result = await this.paymentsService.createCharge(request)
    return res.json({ clientSecret: result.client_secret })
  }

  // CreateSubscriptionDto

  @Post('store-payment-details')
  async storePaymentDetails(@Body() data: { data: CreateSubscriptionDto }, @Query() query: any, @Response() res) {
    const request: any = data.data
    await this.paymentsService.addSubscription(request,query,res)
  }


  @Get('/config')
  async getPubliKey(@Response() res) {
    res.json({ publishableKey: this.configService.get('STRIPE_PUBLISHABLE_KEY') })
  }

}
