import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAppointmentDTO {
  clientId: string;
  expertId: string;
  startTime: string;
  endTime: string;
  type: 'ONLINE' | 'IN_PERSON';
  notes?: string;
}

export class AppointmentController {
  private app: Elysia;

  constructor() {
    this.app = new Elysia()
      .use(
        jwt({
          name: 'jwt',
          secret: process.env.JWT_SECRET || 'gizli-anahtar',
        })
      )
      // Randevu oluşturma
      .post(
        '/create',
        async ({ body }) => {
          const { clientId, expertId, startTime, endTime, type, notes }: CreateAppointmentDTO = body;

          // Çakışma kontrolü
          const conflictingAppointment = await prisma.appointment.findFirst({
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
            throw new Error('Bu zaman diliminde başka bir randevu bulunmakta');
          }

          // Uzmanın müsaitlik kontrolü
          const dayOfWeek = new Date(startTime).getDay();
          const appointmentStartTime = new Date(startTime).toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });

          const expertSchedule = await prisma.expertSchedule.findFirst({
            where: {
              expertId,
              dayOfWeek,
              isAvailable: true,
              startTime: { lte: appointmentStartTime },
              endTime: { gte: appointmentStartTime },
            },
          });

          if (!expertSchedule) {
            throw new Error('Uzman bu saatte müsait değil');
          }

          // Randevu oluşturma
          const appointment = await prisma.appointment.create({
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
        },
        {
          body: t.Object({
            clientId: t.String(),
            expertId: t.String(),
            startTime: t.String(),
            endTime: t.String(),
            type: t.Enum({ enum: ['ONLINE', 'IN_PERSON'] }),
            notes: t.Optional(t.String()),
          }),
        }
      )
      // Uzman müsaitlik ayarları
      .post(
        '/schedule/expert',
        async ({ body }) => {
          const { expertId, schedules } = body;

          // Mevcut programı temizle
          await prisma.expertSchedule.deleteMany({
            where: { expertId },
          });

          // Yeni program oluştur
          const newSchedules = await prisma.expertSchedule.createMany({
            data: schedules.map((schedule: any) => ({
              expertId,
              ...schedule,
            })),
          });

          return {
            message: 'Çalışma saatleri güncellendi',
            schedules: newSchedules,
          };
        },
        {
          body: t.Object({
            expertId: t.String(),
            schedules: t.Array(
              t.Object({
                dayOfWeek: t.Number(),
                startTime: t.String(),
                endTime: t.String(),
                isAvailable: t.Boolean(),
              })
            ),
          }),
        }
      )
      // Randevu durumu güncelleme
      .patch(
        '/status/:id',
        async ({ params, body }) => {
          const { id } = params;
          const { status, cancelReason } = body;

          const appointment = await prisma.appointment.update({
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
        },
        {
          body: t.Object({
            status: t.Enum({ 
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED'] 
            }),
            cancelReason: t.Optional(t.String()),
          }),
        }
      )
      // Randevuları listeleme
      .get('/expert/:expertId', async ({ params }) => {
        const { expertId } = params;
        return await prisma.appointment.findMany({
          where: { expertId },
          orderBy: { startTime: 'asc' },
        });
      })
      .get('/client/:clientId', async ({ params }) => {
        const { clientId } = params;
        return await prisma.appointment.findMany({
          where: { clientId },
          orderBy: { startTime: 'asc' },
        });
      });
  }

  private generateMeetingLink(): string {
    // Örnek bir meeting linki oluşturma
    return `meet.counselease.com/${Math.random().toString(36).substr(2, 9)}`;
  }

  getApp() {
    return this.app;
  }
} 