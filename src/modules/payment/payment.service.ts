import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentDto } from './dto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { userId, subscriptionId, amount, currency, paymentMethod } = createPaymentDto;

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        subscriptionId,
      },
    });

    const payment = await this.prisma.payment.create({
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
  }

  async handleWebhook(event: any) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

     await this.prisma.payment.update({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'COMPLETED' },
      });

      await this.prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },  // Bu, benzersiz olmayan alanlarla çalışır
        data: { status: 'COMPLETED' },
      });

      await this.createInvoice(paymentIntent.id);
    }

    return { received: true };
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        payment: { userId },
      },
      include: { payment: true },
    });
  }

  private async createInvoice(stripePaymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId },
    });

    if (!payment) {
      throw new BadRequestException('Ödeme bulunamadı');
    }

    const taxRate = 18;
    const taxAmount = payment.amount * (taxRate / 100);
    const totalAmount = payment.amount + taxAmount;

    await this.prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNo: `INV-${Date.now()}`,
        taxRate,
        taxAmount,
        totalAmount,
      },
    });
  }
} 