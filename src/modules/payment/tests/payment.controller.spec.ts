import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../payment.service';
import { PaymentStatus } from '@prisma/client';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            createPayment: jest.fn(),
            handlePaymentWebhook: jest.fn(),
            getPaymentHistory: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      const createPaymentDto = {
        userId: '1',
        amount: 100,
        currency: 'TRY',
        description: 'Test ödemesi',
        paymentMethodId: 'pm_test',
      };

      const expectedResult = {
        paymentId: '1',
        clientSecret: 'test_secret',
      };

      jest.spyOn(service, 'createPayment').mockResolvedValue(expectedResult);

      const result = await controller.createPayment(createPaymentDto);
      
      expect(result).toBe(expectedResult);
      expect(service.createPayment).toHaveBeenCalledWith(createPaymentDto);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook events', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } },
      };

      const expectedResult = {
        message: 'Webhook işlendi',
      };

      jest.spyOn(service, 'handlePaymentWebhook').mockResolvedValue(expectedResult);

      const result = await controller.handleWebhook(webhookEvent);
      
      expect(result).toBe(expectedResult);
      expect(service.handlePaymentWebhook).toHaveBeenCalledWith(webhookEvent);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history', async () => {
      const userId = '1';
      const mockPayments = [
        { id: '1', userId, amount: 100, status: 'COMPLETED' as PaymentStatus },
        { id: '2', userId, amount: 200, status: 'PENDING' as PaymentStatus },
      ];

      jest.spyOn(service, 'getPaymentHistory').mockResolvedValue(mockPayments);

      const result = await controller.getPaymentHistory(userId);
      
      expect(result).toBe(mockPayments);
      expect(service.getPaymentHistory).toHaveBeenCalledWith(userId);
    });
  });

  describe('refundPayment', () => {
    it('should process refund', async () => {
      const paymentId = '1';
      const refundDto = { reason: 'İade talebi' };

      const expectedResult = {
        message: 'Ödeme iade edildi',
        payment: {
          id: paymentId,
          status: 'REFUNDED' as PaymentStatus,
        },
      };

      jest.spyOn(service, 'refundPayment').mockResolvedValue(expectedResult);

      const result = await controller.refundPayment(paymentId, refundDto);
      
      expect(result).toBe(expectedResult);
      expect(service.refundPayment).toHaveBeenCalledWith(paymentId, refundDto.reason);
    });
  });
}); 