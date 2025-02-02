import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../payment.service';
import { StripeService } from '../stripe.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { createMockContext, MockContext } from '../../../test/setup';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockContext: MockContext;
  let stripeService: StripeService;

  beforeEach(async () => {
    mockContext = createMockContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockContext.prisma,
        },
        {
          provide: StripeService,
          useValue: {
            createPaymentIntent: jest.fn(),
            createCustomer: jest.fn(),
            handleWebhookEvent: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-stripe-key'),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    stripeService = module.get<StripeService>(StripeService);
  });

  describe('createPayment', () => {
    const createPaymentDto = {
      userId: '1',
      amount: 100,
      currency: 'TRY',
      description: 'Test ödemesi',
      paymentMethodId: 'pm_test',
    };

    it('should create a payment successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        client_secret: 'test_secret',
        status: 'requires_payment_method',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(stripeService, 'createPaymentIntent').mockResolvedValue(mockPaymentIntent);

      mockContext.prisma.payment.create.mockResolvedValue({
        id: '1',
        ...createPaymentDto,
        status: 'PENDING' as PaymentStatus,
        stripePaymentIntentId: mockPaymentIntent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createPayment(createPaymentDto);

      expect(result).toHaveProperty('clientSecret');
      expect(result).toHaveProperty('paymentId');
      expect(stripeService.createPaymentIntent).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user not found', async () => {
      mockContext.prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createPayment(createPaymentDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('handlePaymentWebhook', () => {
    it('should handle successful payment webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            status: 'succeeded',
            amount: 1000,
          },
        },
      };

      mockContext.prisma.payment.findFirst.mockResolvedValue({
        id: '1',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_test',
      });

      mockContext.prisma.payment.update.mockResolvedValue({
        id: '1',
        status: 'COMPLETED',
      });

      const result = await service.handlePaymentWebhook(webhookEvent);

      expect(result).toHaveProperty('message', 'Webhook işlendi');
      expect(mockContext.prisma.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_test' },
        data: { status: 'COMPLETED' },
      });
    });
  });

  describe('getPaymentHistory', () => {
    it('should return user payment history', async () => {
      const mockPayments = [
        { id: '1', userId: '1', amount: 100, status: 'COMPLETED' },
        { id: '2', userId: '1', amount: 200, status: 'PENDING' },
      ];

      mockContext.prisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getPaymentHistory('1');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('1');
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const mockPayment = {
        id: '1',
        stripePaymentIntentId: 'pi_test',
        status: 'COMPLETED',
        amount: 1000,
      };

      mockContext.prisma.payment.findUnique.mockResolvedValue(mockPayment);
      jest.spyOn(stripeService, 'createRefund').mockResolvedValue({ id: 're_test' });

      mockContext.prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
      });

      const result = await service.refundPayment('1', 'İade talebi');

      expect(result).toHaveProperty('message', 'Ödeme iade edildi');
      expect(result.payment.status).toBe('REFUNDED');
    });
  });
}); 