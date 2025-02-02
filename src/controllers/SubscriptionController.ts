import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatePlanDTO {
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
}

interface SubscribeDTO {
  planId: string;
  userId: string;
}

export class SubscriptionController {
  private app: Elysia;

  constructor() {
    this.app = new Elysia()
      .use(
        jwt({
          name: 'jwt',
          secret: process.env.JWT_SECRET || 'gizli-anahtar',
        })
      )
      // Abonelik planı oluşturma (Sadece admin)
      .post(
        '/plans',
        async ({ body, jwt, headers }) => {
          // Admin kontrolü
          const authHeader = headers.authorization;
          if (!authHeader) throw new Error('Yetkilendirme gerekli');
          
          const { name, description, price, duration, features }: CreatePlanDTO = body;

          const plan = await prisma.subscriptionPlan.create({
            data: {
              name,
              description,
              price: price,
              duration,
              features,
            },
          });

          return {
            message: 'Abonelik planı oluşturuldu',
            plan,
          };
        },
        {
          body: t.Object({
            name: t.String(),
            description: t.String(),
            price: t.Number(),
            duration: t.Number(),
            features: t.Array(t.String()),
          }),
        }
      )
      // Tüm planları listeleme
      .get('/plans', async () => {
        const plans = await prisma.subscriptionPlan.findMany();
        return plans;
      })
      // Abonelik oluşturma
      .post(
        '/subscribe',
        async ({ body, jwt, headers }) => {
          const authHeader = headers.authorization;
          if (!authHeader) throw new Error('Yetkilendirme gerekli');

          const { planId, userId }: SubscribeDTO = body;

          // Plan kontrolü
          const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
          });

          if (!plan) throw new Error('Plan bulunamadı');

          // Aktif abonelik kontrolü
          const activeSubscription = await prisma.subscription.findFirst({
            where: {
              userId,
              status: 'ACTIVE',
            },
          });

          if (activeSubscription) {
            throw new Error('Zaten aktif bir aboneliğiniz bulunmakta');
          }

          // Yeni abonelik oluşturma
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + plan.duration);

          const subscription = await prisma.subscription.create({
            data: {
              userId,
              planId,
              startDate,
              endDate,
              status: 'ACTIVE',
            },
          });

          return {
            message: 'Abonelik başarıyla oluşturuldu',
            subscription,
          };
        },
        {
          body: t.Object({
            planId: t.String(),
            userId: t.String(),
          }),
        }
      )
      // Kullanıcının aboneliklerini getirme
      .get('/subscriptions/:userId', async ({ params }) => {
        const { userId } = params;

        const subscriptions = await prisma.subscription.findMany({
          where: { userId },
          include: { plan: true },
        });

        return subscriptions;
      })
      // Abonelik iptali
      .post(
        '/cancel',
        async ({ body }) => {
          const { subscriptionId } = body;

          const subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'CANCELLED' },
          });

          return {
            message: 'Abonelik iptal edildi',
            subscription,
          };
        },
        {
          body: t.Object({
            subscriptionId: t.String(),
          }),
        }
      );
  }

  getApp() {
    return this.app;
  }
} 