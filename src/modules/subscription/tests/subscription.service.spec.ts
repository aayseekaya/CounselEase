import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from '../subscription.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';
import { createMockContext, MockContext } from '../../../test/setup';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockContext: MockContext;
  let paymentService: PaymentService;

  beforeEach(async () => {
    mockContext = createMockContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: mockContext.prisma,
        },
        {
          provide: PaymentService,
          useValue: {
            createPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe('createSubscriptionPlan', () => {
    const createPlanDto = {
      name: 'Premium Plan',
      description: 'Premium özellikleri içerir',
      price: 199.99,
      duration: 30,
      features: ['7/24 Destek', 'Sınırsız Görüşme'],
    };

    it('should create a subscription plan', async () => {
      mockContext.prisma.subscriptionPlan.create.mockResolvedValue({
        id: '1',
        ...createPlanDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createSubscriptionPlan(createPlanDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createPlanDto.name);
      expect(result.features).toEqual(createPlanDto.features);
    });

    it('should throw BadRequestException when plan with same name exists', async () => {
      mockContext.prisma.subscriptionPlan.findFirst.mockResolvedValue({
        id: '1',
        name: createPlanDto.name,
      });

      await expect(service.createSubscriptionPlan(createPlanDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('subscribeUser', () => {
    const subscribeDto = {
      userId: '1',
      planId: '1',
      paymentMethodId: 'pm_test',
    };

    it('should create a subscription successfully', async () => {
      const mockPlan = {
        id: '1',
        name: 'Premium Plan',
        price: 199.99,
        duration: 30,
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };

      mockContext.prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);

      jest.spyOn(paymentService, 'createPayment').mockResolvedValue({
        paymentId: 'pay_1',
        clientSecret: 'secret',
      });

      mockContext.prisma.subscription.create.mockResolvedValue({
        id: '1',
        userId: subscribeDto.userId,
        planId: subscribeDto.planId,
        status: 'ACTIVE' as SubscriptionStatus,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });

      const result = await service.subscribeUser(subscribeDto);

      expect(result).toHaveProperty('subscription');
      expect(result).toHaveProperty('paymentIntent');
      expect(result.subscription.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockContext.prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.subscribeUser(subscribeDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getUserSubscription', () => {
    it('should return active user subscription', async () => {
      const mockSubscription = {
        id: '1',
        userId: '1',
        status: 'ACTIVE' as SubscriptionStatus,
        plan: {
          name: 'Premium Plan',
          features: ['7/24 Destek'],
        },
      };

      mockContext.prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.getUserSubscription('1');

      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
      expect(result.plan.name).toBe('Premium Plan');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      const mockSubscription = {
        id: '1',
        status: 'ACTIVE' as SubscriptionStatus,
      };

      mockContext.prisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockContext.prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: 'CANCELLED' as SubscriptionStatus,
      });

      const result = await service.cancelSubscription('1');

      expect(result).toHaveProperty('message', 'Abonelik iptal edildi');
      expect(result.subscription.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException when no active subscription found', async () => {
      mockContext.prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancelSubscription('1'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
}); 