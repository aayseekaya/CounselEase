import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppointmentType } from '@prisma/client';

describe('AppointmentController (e2e)', () => {
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
    await prisma.appointment.deleteMany();
    await prisma.expertSchedule.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/appointments/create (POST)', () => {
    it('should create a new appointment', () => {
      return request(app.getHttpServer())
        .post('/appointments/create')
        .send({
          clientId: '1',
          expertId: '2',
          startTime: '2024-03-20T10:00:00Z',
          endTime: '2024-03-20T11:00:00Z',
          type: 'ONLINE' as AppointmentType,
          notes: 'Test randevu',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('appointment');
          expect(res.body.appointment).toHaveProperty('id');
        });
    });
  });

  // Diğer endpoint'ler için benzer e2e testler...
}); 