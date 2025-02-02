import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

describe('PaymentController (e2e)', () => {
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
    await prisma.payment.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/payments/create (POST)', () => {
    it('should create a payment intent', () => {
      return request(app.getHttpServer())
        .post('/payments/create')
        .send({
          userId: '1',
          amount: 100,
          currency: 'TRY',
          description: 'Test ödemesi',
          paymentMethodId: 'pm_test',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('paymentId');
          expect(res.body).toHaveProperty('clientSecret');
        });
    });
  });

  describe('/payments/webhook (POST)', () => {
    it('should handle webhook events', () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            status: 'succeeded',
          },
        },
      };

      return request(app.getHttpServer())
        .post('/payments/webhook')
        .send(webhookEvent)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message', 'Webhook işlendi');
        });
    });
  });

  describe('/payments/history/:userId (GET)', () => {
    it('should return payment history', async () => {
      // Önce test verisi oluştur
      await prisma.payment.create({
        data: {
          userId: '1',
          amount: 100,
          currency: 'TRY',
          status: 'COMPLETED' as PaymentStatus,
          stripePaymentIntentId: 'pi_test',
        },
      });

      return request(app.getHttpServer())
        .get('/payments/history/1')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('userId', '1');
        });
    });
  });

  describe('/payments/refund/:paymentId (POST)', () => {
    it('should process refund', async () => {
      // Önce test ödemesi oluştur
      const payment = await prisma.payment.create({
        data: {
          userId: '1',
          amount: 100,
          currency: 'TRY',
          status: 'COMPLETED' as PaymentStatus,
          stripePaymentIntentId: 'pi_test',
        },
      });

      return request(app.getHttpServer())
        .post(`/payments/refund/${payment.id}`)
        .send({ reason: 'İade talebi' })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message', 'Ödeme iade edildi');
          expect(res.body.payment).toHaveProperty('status', 'REFUNDED');
        });
    });
  });
}); 