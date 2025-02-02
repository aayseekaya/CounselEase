import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

const prisma = new PrismaClient();

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class NotificationController {
  private app: Elysia;

  constructor() {
    this.app = new Elysia()
      // Bildirim oluşturma
      .post(
        '/send',
        async ({ body }) => {
          const { userId, type, channel, title, content, metadata } = body;

          const notification = await prisma.notification.create({
            data: {
              userId,
              type,
              channel,
              title,
              content,
              status: 'PENDING',
              metadata,
            },
          });

          // Bildirimi hemen gönder
          await this.processNotification(notification);

          return {
            message: 'Bildirim kuyruğa alındı',
            notification,
          };
        },
        {
          body: t.Object({
            userId: t.String(),
            type: t.Enum({
              enum: [
                'APPOINTMENT_REMINDER',
                'APPOINTMENT_CONFIRMATION',
                'APPOINTMENT_CANCELLATION',
                'SUBSCRIPTION_EXPIRING',
                'PAYMENT_SUCCESS',
                'PAYMENT_FAILED',
              ],
            }),
            channel: t.Enum({ enum: ['EMAIL', 'SMS', 'BOTH'] }),
            title: t.String(),
            content: t.String(),
            metadata: t.Optional(t.Object({})),
          }),
        }
      )
      // Randevu hatırlatması oluşturma
      .post(
        '/reminder/appointment',
        async ({ body }) => {
          const { appointmentId, userId, appointmentTime, expertName } = body;

          // 24 saat öncesi için hatırlatma
          const reminder = await prisma.notification.create({
            data: {
              userId,
              type: 'APPOINTMENT_REMINDER',
              channel: 'BOTH',
              title: 'Randevu Hatırlatması',
              content: `${expertName} ile ${new Date(appointmentTime).toLocaleString('tr-TR')} tarihindeki randevunuza 24 saat kaldı.`,
              status: 'PENDING',
              metadata: { appointmentId },
            },
          });

          return {
            message: 'Randevu hatırlatması oluşturuldu',
            reminder,
          };
        },
        {
          body: t.Object({
            appointmentId: t.String(),
            userId: t.String(),
            appointmentTime: t.String(),
            expertName: t.String(),
          }),
        }
      )
      // Kullanıcının bildirim geçmişi
      .get('/history/:userId', async ({ params }) => {
        const { userId } = params;

        return await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      });
  }

  private async processNotification(notification: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
      });

      if (!user) throw new Error('Kullanıcı bulunamadı');

      if (notification.channel === 'EMAIL' || notification.channel === 'BOTH') {
        await this.sendEmail(user.email, notification.title, notification.content);
      }

      if (notification.channel === 'SMS' || notification.channel === 'BOTH') {
        // Kullanıcının telefon numarası metadata'da saklandığını varsayıyoruz
        const phoneNumber = user.phoneNumber || notification.metadata?.phoneNumber;
        if (phoneNumber) {
          await this.sendSMS(phoneNumber, notification.content);
        }
      }

      // Bildirim durumunu güncelle
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...notification.metadata,
            error: error.message,
          },
        },
      });
    }
  }

  private async sendEmail(to: string, subject: string, content: string) {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: content,
    });
  }

  private async sendSMS(to: string, content: string) {
    await twilioClient.messages.create({
      body: content,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  }

  getApp() {
    return this.app;
  }
} 