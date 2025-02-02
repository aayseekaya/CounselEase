import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, SmsService],
  exports: [NotificationService],
})
export class NotificationModule {} 