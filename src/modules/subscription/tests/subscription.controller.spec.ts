import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from '../subscription.controller';
import { SubscriptionService } from '../subscription.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: {
            createSubscriptionPlan: jest.fn(),
            subscribeUser: jest.fn(),
            getUserSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            getAllPlans: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('createPlan', () => {
    it('should create a subscription plan', async () => {
      const createPlanDto = {
        name: 'Premium Plan',
        description: 'Premium özellikleri içerir',
        price: 199.99,
        duration: 30,
        features: ['7/24 Destek', 'Sınırsız Görüşme'],
      };

      const expectedResult = {
        id: '1',
        ...createPlanDto,
      };

      jest.spyOn(service, 'createSubscriptionPlan').mockResolvedValue(expectedResult);

      const result = await controller.createPlan(createPlanDto);
      
      expect(result).toBe(expectedResult);
      expect(service.createSubscriptionPlan).toHaveBeenCalledWith(createPlanDto);
    });
  });

  describe('subscribe', () => {
    it('should create a subscription', async () => {
      const subscribeDto = {
        userId: '1',
        planId: '1',
        paymentMethodId: 'pm_test',
      };

      const expectedResult = {
        subscription: {
          id: '1',
          status: 'ACTIVE' as SubscriptionStatus,
        },
        paymentIntent: {
          clientSecret: 'test_secret',
        },
      };

      jest.spyOn(service, 'subscribeUser').mockResolvedValue(expectedResult);

      const result = await controller.subscribe(subscribeDto);
      
      expect(result).toBe(expectedResult);
      expect(service.subscribeUser).toHaveBeenCalledWith(subscribeDto);
    });
  });

  describe('getUserSubscription', () => {
    it('should return user subscription', async () => {
      const userId = '1';
      const mockSubscription = {
        id: '1',
        status: 'ACTIVE' as SubscriptionStatus,
        plan: {
          name: 'Premium Plan',
        },
      };

      jest.spyOn(service, 'getUserSubscription').mockResolvedValue(mockSubscription);

      const result = await controller.getUserSubscription(userId);
      
      expect(result).toBe(mockSubscription);
      expect(service.getUserSubscription).toHaveBeenCalledWith(userId);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const userId = '1';
      const expectedResult = {
        message: 'Abonelik iptal edildi',
        subscription: {
          id: '1',
          status: 'CANCELLED' as SubscriptionStatus,
        },
      };

      jest.spyOn(service, 'cancelSubscription').mockResolvedValue(expectedResult);

      const result = await controller.cancelSubscription(userId);
      
      expect(result).toBe(expectedResult);
      expect(service.cancelSubscription).toHaveBeenCalledWith(userId);
    });
  });

  describe('getAllPlans', () => {
    it('should return all subscription plans', async () => {
      const mockPlans = [
        { id: '1', name: 'Basic Plan', price: 99.99 },
        { id: '2', name: 'Premium Plan', price: 199.99 },
      ];

      jest.spyOn(service, 'getAllPlans').mockResolvedValue(mockPlans);

      const result = await controller.getAllPlans();
      
      expect(result).toBe(mockPlans);
      expect(service.getAllPlans).toHaveBeenCalled();
    });
  });
}); 