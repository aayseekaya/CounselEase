import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionController (e2e)', () => {
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
    await prisma.subscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/subscriptions/plans (POST)', () => {
    it('should create a subscription plan', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/plans')
        .send({
          name: 'Premium Plan',
          description: 'Premium özellikleri içerir',
          price: 199.99,
          duration: 30,
          features: ['7/24 Destek', 'Sınırsız Görüşme'],
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Premium Plan');
        });
    });
  });

  describe('/subscriptions/subscribe (POST)', () => {
    it('should create a subscription', async () => {
      // Önce plan oluştur
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Test Plan',
          description: 'Test Plan',
          price: 99.99,
          duration: 30,
          features: ['Test Feature'],
        },
      });

      return request(app.getHttpServer())
        .post('/subscriptions/subscribe')
        .send({
          userId: '1',
          planId: plan.id,
          paymentMethodId: 'pm_test',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('subscription');
          expect(res.body).toHaveProperty('paymentIntent');
        });
    });
  });

  describe('/subscriptions/user/:userId (GET)', () => {
    it('should return user subscription', async () => {
      // Önce subscription oluştur
      await prisma.subscription.create({
        data: {
          userId: '1',
          planId: '1',
          status: 'ACTIVE' as SubscriptionStatus,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return request(app.getHttpServer())
        .get('/subscriptions/user/1')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.userId).toBe('1');
          expect(res.body.status).toBe('ACTIVE');
        });
    });
  });

  describe('/subscriptions/cancel/:userId (POST)', () => {
    it('should cancel subscription', async () => {
      // Önce aktif subscription oluştur
      await prisma.subscription.create({
        data: {
          userId: '1',
          planId: '1',
          status: 'ACTIVE' as SubscriptionStatus,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return request(app.getHttpServer())
        .post('/subscriptions/cancel/1')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message', 'Abonelik iptal edildi');
          expect(res.body.subscription.status).toBe('CANCELLED');
        });
    });
  });

  describe('/subscriptions/plans (GET)', () => {
    it('should return all subscription plans', async () => {
      // Önce test planları oluştur
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'Basic Plan',
            description: 'Basic Plan',
            price: 99.99,
            duration: 30,
            features: ['Basic Feature'],
          },
          {
            name: 'Premium Plan',
            description: 'Premium Plan',
            price: 199.99,
            duration: 30,
            features: ['Premium Feature'],
          },
        ],
      });

      return request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[1]).toHaveProperty('price');
        });
    });
  });
}); 