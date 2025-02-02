import { AppointmentController } from '../AppointmentController';
import { prismaMock } from '../../test/setup';

describe('AppointmentController', () => {
  let appointmentController: AppointmentController;

  beforeEach(() => {
    appointmentController = new AppointmentController();
  });

  describe('createAppointment', () => {
    const mockAppointment = {
      clientId: '1',
      expertId: '2',
      startTime: '2024-02-20T10:00:00Z',
      endTime: '2024-02-20T11:00:00Z',
      type: 'ONLINE',
    };

    it('müsait zaman diliminde randevu oluşturmalı', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.expertSchedule.findFirst.mockResolvedValue({
        id: '1',
        expertId: '2',
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      });

      prismaMock.appointment.create.mockResolvedValue({
        id: '1',
        ...mockAppointment,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await appointmentController.getApp().handle({
        method: 'POST',
        path: '/create',
        body: mockAppointment,
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('appointment');
    });

    it('çakışan randevu olduğunda hata vermeli', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: '1',
        ...mockAppointment,
        status: 'CONFIRMED',
      } as any);

      await expect(
        appointmentController.getApp().handle({
          method: 'POST',
          path: '/create',
          body: mockAppointment,
        })
      ).rejects.toThrow('Bu zaman diliminde başka bir randevu bulunmakta');
    });

    it('uzman müsait olmadığında hata vermeli', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.expertSchedule.findFirst.mockResolvedValue(null);

      await expect(
        appointmentController.getApp().handle({
          method: 'POST',
          path: '/create',
          body: mockAppointment,
        })
      ).rejects.toThrow('Uzman bu saatte müsait değil');
    });
  });
}); 