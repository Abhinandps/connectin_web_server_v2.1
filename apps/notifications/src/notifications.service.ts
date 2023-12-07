import { Injectable, Inject } from '@nestjs/common';
import { NotifyEmailDto } from './dto/notify-email.dto';
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config';
import { NOTIFICATIONS_SERVICE } from '@app/common';
import { SocketClient } from './websocket/user.socketClient';

@Injectable()
export class NotificationsService {

  constructor(
    private readonly configService: ConfigService,
    private readonly socketClient: SocketClient

  ) { }

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

  async sendInvitation(data: any) {
    this.socketClient.emitInvitationToUser(data)
  }

  async send_interview_schedule_notification(data: any) {
    this.socketClient.emitInterviewSchedule(data)
  }


}
