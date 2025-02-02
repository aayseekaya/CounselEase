import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { CreateNotificationDto, CreateAppointmentReminderDto } from './dto';
import { NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async sendNotification(createNotificationDto: CreateNotificationDto) {
    const { userId, type, channel, title, content, metadata } = createNotificationDto;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        title,
        content,
        status: NotificationStatus.PENDING,
        metadata,
      },
    });

    await this.processNotification(notification);

    return {
      message: 'Bildirim kuyruğa alındı',
      notification,
    };
  }

  async createAppointmentReminder(reminderDto: CreateAppointmentReminderDto) {
    const { appointmentId, userId, appointmentTime, expertName } = reminderDto;

    const reminder = await this.prisma.notification.create({
      data: {
        userId,
        type: 'APPOINTMENT_REMINDER',
        channel: 'BOTH',
        title: 'Randevu Hatırlatması',
        content: `${expertName} ile ${new Date(appointmentTime).toLocaleString('tr-TR')} tarihindeki randevunuza 24 saat kaldı.`,
        status: NotificationStatus.PENDING,
        metadata: { appointmentId },
      },
    });

    return {
      message: 'Randevu hatırlatması oluşturuldu',
      reminder,
    };
  }

  async getNotificationHistory(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async processNotification(notification: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: notification.userId },
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (notification.channel === 'EMAIL' || notification.channel === 'BOTH') {
        await this.emailService.sendEmail(user.email, notification.title, notification.content);
      }

      if (notification.channel === 'SMS' || notification.channel === 'BOTH') {
        const phoneNumber = user.phoneNumber || notification.metadata?.phoneNumber;
        if (phoneNumber) {
          await this.smsService.sendSMS(phoneNumber, notification.content);
        }
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          metadata: {
            ...notification.metadata,
            error: error.message,
          },
        },
      });
    }
  }
} 