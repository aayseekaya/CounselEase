import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from '../appointment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { createMockContext, MockContext } from '../../../test/setup';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockContext: MockContext;

  beforeEach(async () => {
    mockContext = createMockContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: PrismaService,
          useValue: mockContext.prisma,
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  describe('createAppointment', () => {
    const createAppointmentDto = {
      clientId: '1',
      expertId: '2',
      startTime: '2024-03-20T10:00:00Z',
      endTime: '2024-03-20T11:00:00Z',
      type: 'ONLINE' as AppointmentType,
      notes: 'Test randevu',
    };

    it('should create a new appointment when no conflicts exist', async () => {
      // Mock çakışma kontrolü
      mockContext.prisma.appointment.findFirst.mockResolvedValue(null);

      // Mock uzman programı kontrolü
      mockContext.prisma.expertSchedule.findFirst.mockResolvedValue({
        id: '1',
        expertId: '2',
        dayOfWeek: 3, // Çarşamba
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock randevu oluşturma
      mockContext.prisma.appointment.create.mockResolvedValue({
        id: '2',
        clientId: '1',
        expertId: '2',
        startTime: new Date(), // Date formatında
        endTime: new Date(),   // Date formatında
        type: 'ONLINE' as AppointmentType,
        status: 'PENDING' as AppointmentStatus,
        notes: 'Test randevu',
        meetingLink: 'meeting_link',
        cancelReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createAppointment(createAppointmentDto);

      expect(result).toHaveProperty('message', 'Randevu başarıyla oluşturuldu');
      expect(result.appointment).toHaveProperty('meetingLink');
      expect(result.appointment.status).toBe('PENDING');
    });

    it('should throw BadRequestException when there is a conflicting appointment', async () => {
      mockContext.prisma.appointment.findFirst.mockResolvedValue({
        id: '2',
        ...createAppointmentDto,
        status: 'CONFIRMED',
      });

      await expect(service.createAppointment(createAppointmentDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException when expert is not available', async () => {
      mockContext.prisma.appointment.findFirst.mockResolvedValue(null);
      mockContext.prisma.expertSchedule.findFirst.mockResolvedValue(null);

      await expect(service.createAppointment(createAppointmentDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status', async () => {
      const updateDto = {
        status: 'CANCELLED' as AppointmentStatus,
        cancelReason: 'Test iptal',
      };

      mockContext.prisma.appointment.update.mockResolvedValue({
        id: '1',
        clientId: '1',
        expertId: '2',
        startTime: new Date(),
        endTime: new Date(),
        type: 'ONLINE' as AppointmentType,
        status: updateDto.status,
        notes: null,
        meetingLink: null,
        cancelReason: updateDto.cancelReason,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateAppointmentStatus('1', updateDto);

      expect(result.message).toBe('Randevu durumu güncellendi');
      expect(result.appointment.status).toBe('CANCELLED');
      expect(result.appointment.cancelReason).toBe('Test iptal');
    });
  });

  describe('getExpertAppointments', () => {
    it('should return expert appointments', async () => {
      const mockAppointments = [
        { id: '1', clientId: '1', expertId: '2', startTime: new Date(), endTime: new Date() }, // Date formatında
        { id: '2', clientId: '1', expertId: '2', startTime: new Date(), endTime: new Date() }, // Date formatında
      ];

      mockContext.prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getExpertAppointments('2');

      expect(result).toHaveLength(2);
      expect(result[0].expertId).toBe('2');
    });
  });

  describe('getClientAppointments', () => {
    it('should return client appointments', async () => {
      const mockAppointments = [
        { id: '1', clientId: '1', expertId: '2', startTime: new Date(), endTime: new Date() }, // Date formatında
        { id: '2', clientId: '1', expertId: '2', startTime: new Date(), endTime: new Date() }, // Date formatında
      ];

      mockContext.prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getClientAppointments('1');

      expect(result).toHaveLength(2);
      expect(result[0].clientId).toBe('1');
    });
  });
});
