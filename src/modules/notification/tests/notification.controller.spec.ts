import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';
import { NotificationType, NotificationChannel } from '@prisma/client';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
            createAppointmentReminder: jest.fn(),
            getNotificationHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendNotification', () => {
    it('should send a notification', async () => {
      const createNotificationDto = {
        userId: '1',
        type: 'APPOINTMENT_REMINDER' as NotificationType,
        channel: 'EMAIL' as NotificationChannel,
        title: 'Test Bildirimi',
        content: 'Test içeriği',
      };

      const expectedResult = {
        message: 'Bildirim başarıyla gönderildi',
        notification: {
          id: '1',
          ...createNotificationDto,
        },
      };

      jest.spyOn(service, 'sendNotification').mockResolvedValue(expectedResult);

      const result = await controller.sendNotification(createNotificationDto);
      
      expect(result).toBe(expectedResult);
      expect(service.sendNotification).toHaveBeenCalledWith(createNotificationDto);
    });
  });

  describe('createAppointmentReminder', () => {
    it('should create an appointment reminder', async () => {
      const reminderDto = {
        appointmentId: '1',
        userId: '1',
        appointmentTime: '2024-03-20T10:00:00Z',
        expertName: 'Dr. Test',
      };

      const expectedResult = {
        message: 'Randevu hatırlatması oluşturuldu',
        notification: {
          id: '1',
          type: 'APPOINTMENT_REMINDER',
        },
      };

      jest.spyOn(service, 'createAppointmentReminder').mockResolvedValue(expectedResult);

      const result = await controller.createAppointmentReminder(reminderDto);
      
      expect(result).toBe(expectedResult);
      expect(service.createAppointmentReminder).toHaveBeenCalledWith(reminderDto);
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history', async () => {
      const userId = '1';
      const mockNotifications = [
        { id: '1', userId, type: 'APPOINTMENT_REMINDER' },
        { id: '2', userId, type: 'PAYMENT_CONFIRMATION' },
      ];

      jest.spyOn(service, 'getNotificationHistory').mockResolvedValue(mockNotifications);

      const result = await controller.getNotificationHistory(userId);
      
      expect(result).toBe(mockNotifications);
      expect(service.getNotificationHistory).toHaveBeenCalledWith(userId);
    });
  });
}); 