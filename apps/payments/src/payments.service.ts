import { CreateChargeDto, CreateSubscriptionDto } from '@app/common/dto';
import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe'
import { SubscriptionRepository } from './payment.repository';
import { ClientKafka } from '@nestjs/microservices';
import { USER_SERVICE } from './constant/services';
import { NOTIFICATIONS_SERVICE } from '@app/common';


@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
  })

  constructor(
    private readonly configService: ConfigService,
    private readonly subsRepository: SubscriptionRepository,
    @Inject(USER_SERVICE) private readonly userClient: ClientKafka,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notificationClient: ClientKafka
  ) { }

  async createCharge({ amount }: CreateChargeDto) {

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      confirm: true,
      payment_method: "pm_card_visa",
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    })

    return paymentIntent


  }

  async addSubscription(data: CreateSubscriptionDto, { _id, email }: any, res: any) {

    try {
      const existingSubscription = await this.subsRepository.findOne({
        userId: _id,
        expiration: { $gt: new Date() }
      });

      console.log(existingSubscription)

      if (existingSubscription) {
        throw new Error('User already have an active subscription.');
      }

      const expirationDate = this.calculateExpirationDate(data.billingCycle);

      const newSubscription = await this.subsRepository.create({
        ...data,
        expiration: new Date(expirationDate),
        invoiceId: data.invoiceId,
        amount: data.charge.amount,
        userId: _id
      });

      await this.userClient.emit('create_charge', newSubscription)

      this.notificationClient.emit('notify_email', { email, text: `Your payment of ₹${data.charge.amount} has completed successfully.` })

      res.json(newSubscription)

      return newSubscription;
      
    } catch (error) {
      // Handle the error here, log it, or rethrow it if needed
      console.log(error);

      throw new BadRequestException(error)
    }
  }

  private calculateExpirationDate(billingCycle: string): string {
    const currentDate = new Date()

    if (billingCycle === 'monthly') {
      currentDate.setDate(currentDate.getDate() + 28)
    } else if (billingCycle === 'yearly') {
      currentDate.setDate(currentDate.getDate() + 365)
    }

    const expirationDate = currentDate.toISOString().split('T')[0]
    return expirationDate


  }

}


