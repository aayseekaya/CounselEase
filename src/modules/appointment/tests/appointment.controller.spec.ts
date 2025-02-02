import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from '../appointment.controller';
import { AppointmentService } from '../appointment.service';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let service: AppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            createAppointment: jest.fn(),
            createExpertSchedule: jest.fn(),
            updateAppointmentStatus: jest.fn(),
            getExpertAppointments: jest.fn(),
            getClientAppointments: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
    service = module.get<AppointmentService>(AppointmentService);
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const createDto = {
        clientId: '1',
        expertId: '2',
        startTime: '2024-03-20T10:00:00Z',
        endTime: '2024-03-20T11:00:00Z',
        type: 'ONLINE' as AppointmentType,
        notes: 'Test randevu',
      };

      const expectedResult = {
        message: 'Randevu başarıyla oluşturuldu',
        appointment: {
          id: '1',
          ...createDto,
          status: 'PENDING',
        },
      };

      jest.spyOn(service, 'createAppointment').mockResolvedValue(expectedResult);

      const result = await controller.createAppointment(createDto);
      expect(result).toBe(expectedResult);
      expect(service.createAppointment).toHaveBeenCalledWith(createDto);
    });
  });

  // Diğer controller metodları için benzer testler...
}); 