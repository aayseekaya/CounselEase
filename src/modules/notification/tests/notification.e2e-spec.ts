import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, NotificationChannel } from '@prisma/client';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Test veritabanını temizle
    await prisma.notification.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/notifications/send (POST)', () => {
    it('should create and send a notification', () => {
      return request(app.getHttpServer())
        .post('/notifications/send')
        .send({
          userId: '1',
          type: 'APPOINTMENT_REMINDER' as NotificationType,
          channel: 'EMAIL' as NotificationChannel,
          title: 'Test Bildirimi',
          content: 'Test içeriği',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('notification');
          expect(res.body.notification).toHaveProperty('id');
        });
    });
  });

  describe('/notifications/reminder/appointment (POST)', () => {
    it('should create an appointment reminder', () => {
      return request(app.getHttpServer())
        .post('/notifications/reminder/appointment')
        .send({
          appointmentId: '1',
          userId: '1',
          appointmentTime: '2024-03-20T10:00:00Z',
          expertName: 'Dr. Test',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('notification');
          expect(res.body.notification.type).toBe('APPOINTMENT_REMINDER');
        });
    });
  });

  describe('/notifications/history/:userId (GET)', () => {
    it('should return notification history', async () => {
      // Önce test verisi oluştur
      await prisma.notification.create({
        data: {
          userId: '1',
          type: 'APPOINTMENT_REMINDER',
          channel: 'EMAIL',
          title: 'Test',
          content: 'Test',
          status: 'SENT',
        },
      });

      return request(app.getHttpServer())
        .get('/notifications/history/1')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('userId', '1');
        });
    });
  });
}); 