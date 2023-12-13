import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyEmailDto } from './dto/notify-email.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @EventPattern('notify_email')
  async notifyEmail(@Payload() data: NotifyEmailDto) {
    this.notificationsService.notifyEmail(data)
  }

  @EventPattern('send_invitation')
  async sendInvitation(@Payload() data: any) {
    this.notificationsService.sendInvitation(data)
  }

  @EventPattern('send_interview_schedule_notification')
  async send_interview_schedule_notification(@Payload() data: any) {
    this.notificationsService.send_interview_schedule_notification(data)
  }


}
