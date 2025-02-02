import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, CreateExpertScheduleDto } from './dto';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    const { clientId, expertId, startTime, endTime, type, notes } = createAppointmentDto;

    // Çakışma kontrolü
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        expertId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException('Bu zaman diliminde başka bir randevu bulunmakta');
    }

    // Uzmanın müsaitlik kontrolü
    const dayOfWeek = new Date(startTime).getDay();
    const appointmentStartTime = new Date(startTime).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const expertSchedule = await this.prisma.expertSchedule.findFirst({
      where: {
        expertId,
        dayOfWeek,
        isAvailable: true,
        startTime: { lte: appointmentStartTime },
        endTime: { gte: appointmentStartTime },
      },
    });

    if (!expertSchedule) {
      throw new BadRequestException('Uzman bu saatte müsait değil');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        clientId,
        expertId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        notes,
        status: 'PENDING',
        meetingLink: type === 'ONLINE' ? this.generateMeetingLink() : null,
      },
    });

    return {
      message: 'Randevu başarıyla oluşturuldu',
      appointment,
    };
  }

  async createExpertSchedule(createScheduleDto: CreateExpertScheduleDto) {
    const { expertId, schedules } = createScheduleDto;

    await this.prisma.expertSchedule.deleteMany({
      where: { expertId },
    });

    const newSchedules = await this.prisma.expertSchedule.createMany({
      data: schedules.map(schedule => ({
        expertId,
        ...schedule,
      })),
    });

    return {
      message: 'Çalışma saatleri güncellendi',
      schedules: newSchedules,
    };
  }

  async updateAppointmentStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto) {
    const { status, cancelReason } = updateStatusDto;

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        cancelReason: status === 'CANCELLED' ? cancelReason : undefined,
      },
    });

    return {
      message: 'Randevu durumu güncellendi',
      appointment,
    };
  }

  async getExpertAppointments(expertId: string) {
    return this.prisma.appointment.findMany({
      where: { expertId },
      orderBy: { startTime: 'asc' },
    });
  }

  async getClientAppointments(clientId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId },
      orderBy: { startTime: 'asc' },
    });
  }

  private generateMeetingLink(): string {
    return `meet.counselease.com/${Math.random().toString(36).substr(2, 9)}`;
  }
} 