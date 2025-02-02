import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

interface CreatePaymentDTO {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER';
}

export class PaymentController {
  private app: Elysia;

  constructor() {
    this.app = new Elysia()
      .use(
        jwt({
          name: 'jwt',
          secret: process.env.JWT_SECRET || 'gizli-anahtar',
        })
      )
      // Ödeme başlatma
      .post(
        '/create',
        async ({ body }) => {
          const { userId, subscriptionId, amount, currency, paymentMethod }: CreatePaymentDTO = body;

          // Stripe ödeme niyeti oluşturma
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe kuruş cinsinden çalışır
            currency: currency.toLowerCase(),
            metadata: {
              userId,
              subscriptionId,
            },
          });

          // Veritabanında ödeme kaydı oluşturma
          const payment = await prisma.payment.create({
            data: {
              userId,
              subscriptionId,
              amount,
              currency,
              status: 'PENDING',
              paymentMethod,
              stripePaymentId: paymentIntent.id,
            },
          });

          return {
            clientSecret: paymentIntent.client_secret,
            paymentId: payment.id,
          };
        },
        {
          body: t.Object({
            userId: t.String(),
            subscriptionId: t.String(),
            amount: t.Number(),
            currency: t.String(),
            paymentMethod: t.Enum({ enum: ['CREDIT_CARD', 'BANK_TRANSFER'] }),
          }),
        }
      )
      // Ödeme webhook'u
      .post('/webhook', async ({ request }) => {
        const sig = request.headers.get('stripe-signature') || '';
        let event;

        try {
          event = stripe.webhooks.constructEvent(
            await request.text(),
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
          );
        } catch (err) {
          throw new Error('Webhook hatası');
        }

        // Ödeme başarılı olduğunda
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object;
          
          await prisma.payment.update({
            where: {
              stripePaymentId: paymentIntent.id,
            },
            data: {
              status: 'COMPLETED',
            },
          });

          // Fatura oluşturma
          await this.createInvoice(paymentIntent.id);
        }

        return { received: true };
      })
      // Fatura listesi
      .get('/invoices/:userId', async ({ params }) => {
        const { userId } = params;

        const invoices = await prisma.invoice.findMany({
          where: {
            payment: {
              userId,
            },
          },
          include: {
            payment: true,
          },
        });

        return invoices;
      })
      // Ödeme geçmişi
      .get('/history/:userId', async ({ params }) => {
        const { userId } = params;

        const payments = await prisma.payment.findMany({
          where: {
            userId,
          },
          include: {
            invoice: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return payments;
      });
  }

  private async createInvoice(stripePaymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId,
      },
    });

    if (!payment) throw new Error('Ödeme bulunamadı');

    const taxRate = 18; // %18 KDV
    const taxAmount = (payment.amount as any) * (taxRate / 100);
    const totalAmount = (payment.amount as any) + taxAmount;

    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNo: `INV-${Date.now()}`,
        taxRate,
        taxAmount,
        totalAmount,
      },
    });
  }

  getApp() {
    return this.app;
  }
} 