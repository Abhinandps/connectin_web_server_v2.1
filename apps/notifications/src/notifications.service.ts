import { Injectable } from '@nestjs/common';
import { NotifyEmailDto } from './dto/notify-email.dto';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {

  constructor(private readonly configService: ConfigService) { }

  private readonly transporter = nodemailer.createTransport({
    service: this.configService.get('EMAIL_SERVICE'),
    auth: {
      user: this.configService.get('EMAIL_USER'),
      pass: this.configService.get('EMAIL_PASSWORD'),
    },
  });


  async notifyEmail({ email, text }: NotifyEmailDto) {
    console.log(email, text)
    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_SERVICE'),
      to: email,
      subject: 'ConnectIn Notification',
      text,
    })
  }
}
