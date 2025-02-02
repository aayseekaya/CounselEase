import { PaymentController } from '../PaymentController';
import { prismaMock } from '../../test/setup';
import Stripe from 'stripe';

jest.mock('stripe');

describe('PaymentController', () => {
  let paymentController: PaymentController;
  const stripeMock = new Stripe('mock-key', { apiVersion: '2023-10-16' });

  beforeEach(() => {
    paymentController = new PaymentController();
  });

  describe('createPayment', () => {
    const mockPayment = {
      userId: '1',
      subscriptionId: '1',
      amount: 199.99,
      currency: 'TRY',
      paymentMethod: 'CREDIT_CARD',
    };

    it('başarılı ödeme oluşturmalı', async () => {
      (stripeMock.paymentIntents.create as jest.Mock).mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
      });

      prismaMock.payment.create.mockResolvedValue({
        id: '1',
        ...mockPayment,
        status: 'PENDING',
        stripePaymentId: 'pi_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await paymentController.getApp().handle({
        method: 'POST',
        path: '/create',
        body: mockPayment,
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('clientSecret');
    });

    it('geçersiz tutar ile ödeme oluşturulmamalı', async () => {
      const invalidPayment = { ...mockPayment, amount: -100 };

      await expect(
        paymentController.getApp().handle({
          method: 'POST',
          path: '/create',
          body: invalidPayment,
        })
      ).rejects.toThrow();
    });
  });

  describe('webhook', () => {
    it('başarılı ödeme webhook\'i işlenmeli', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
          },
        },
      };

      prismaMock.payment.update.mockResolvedValue({
        id: '1',
        status: 'COMPLETED',
        updatedAt: new Date(),
      } as any);

      const result = await paymentController.getApp().handle({
        method: 'POST',
        path: '/webhook',
        body: mockEvent,
        headers: {
          'stripe-signature': 'mock-signature',
        },
      });

      expect(result.status).toBe(200);
    });
  });
}); 