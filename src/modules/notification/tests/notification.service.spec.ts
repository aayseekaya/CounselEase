import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { EmailService } from '../email.service';
import { SmsService } from '../sms.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { createMockContext, MockContext } from '../../../test/setup';
import { NotificationStatus, NotificationType, NotificationChannel } from '@prisma/client';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockContext: MockContext;
  let emailService: EmailService;
  let smsService: SmsService;

  beforeEach(async () => {
    mockContext = createMockContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockContext.prisma,
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendSMS: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);
  });

  describe('sendNotification', () => {
    const createNotificationDto = {
      userId: '1',
      type: 'APPOINTMENT_REMINDER' as NotificationType,
      channel: 'EMAIL' as NotificationChannel,
      title: 'Randevu Hatırlatması',
      content: 'Yarın saat 10:00\'da randevunuz var.',
      metadata: { appointmentId: '123' },
    };

    it('should create and send an email notification', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      mockContext.prisma.notification.create.mockResolvedValue({
        id: '1',
        ...createNotificationDto,
        status: 'PENDING' as NotificationStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);

      jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      mockContext.prisma.notification.update.mockResolvedValue({
        id: '1',
        ...createNotificationDto,
        status: 'SENT' as NotificationStatus,
        sentAt: new Date(),
      });

      const result = await service.sendNotification(createNotificationDto);

      expect(result).toHaveProperty('message', 'Bildirim başarıyla gönderildi');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        createNotificationDto.title,
        createNotificationDto.content,
      );
    });

    it('should handle notification failure', async () => {
      mockContext.prisma.notification.create.mockResolvedValue({
        id: '1',
        ...createNotificationDto,
        status: 'PENDING',
      });

      mockContext.prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('SMTP error'));

      const result = await service.sendNotification(createNotificationDto);

      expect(result.status).toBe('FAILED');
      expect(mockContext.prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      });
    });
  });

  describe('createAppointmentReminder', () => {
    const reminderDto = {
      appointmentId: '1',
      userId: '1',
      appointmentTime: '2024-03-20T10:00:00Z',
      expertName: 'Dr. Test',
    };

    it('should create an appointment reminder notification', async () => {
      const mockNotification = {
        id: '1',
        type: 'APPOINTMENT_REMINDER',
        status: 'PENDING',
        channel: 'EMAIL',
      };

      mockContext.prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createAppointmentReminder(reminderDto);

      expect(result).toHaveProperty('notification');
      expect(result.notification.type).toBe('APPOINTMENT_REMINDER');
    });
  });

  describe('getNotificationHistory', () => {
    it('should return user notification history', async () => {
      const mockNotifications = [
        { id: '1', userId: '1', type: 'APPOINTMENT_REMINDER' },
        { id: '2', userId: '1', type: 'PAYMENT_CONFIRMATION' },
      ];

      mockContext.prisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationHistory('1');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('1');
    });
  });
}); 