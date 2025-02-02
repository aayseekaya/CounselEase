import { SubscriptionController } from '../SubscriptionController';
import { prismaMock } from '../../test/setup';

describe('SubscriptionController', () => {
  let subscriptionController: SubscriptionController;

  beforeEach(() => {
    subscriptionController = new SubscriptionController();
  });

  describe('createPlan', () => {
    const mockPlan = {
      name: 'Premium Plan',
      description: 'Premium özellikleri içerir',
      price: 199.99,
      duration: 30,
      features: ['7/24 Destek', 'Sınırsız Görüşme'],
    };

    it('başarılı plan oluşturmalı', async () => {
      prismaMock.subscriptionPlan.create.mockResolvedValue({
        id: '1',
        ...mockPlan,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await subscriptionController.getApp().handle({
        method: 'POST',
        path: '/plans',
        body: mockPlan,
        headers: {
          authorization: 'Bearer mock-token',
        },
      });

      expect(result.status).toBe(200);
      expect(result.data.plan).toHaveProperty('id');
    });
  });

  describe('subscribe', () => {
    const mockSubscription = {
      planId: '1',
      userId: '1',
    };

    it('aktif abonelik yoksa yeni abonelik oluşturmalı', async () => {
      prismaMock.subscriptionPlan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Premium',
        price: 199.99,
        duration: 30,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.subscription.findFirst.mockResolvedValue(null);

      prismaMock.subscription.create.mockResolvedValue({
        id: '1',
        ...mockSubscription,
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await subscriptionController.getApp().handle({
        method: 'POST',
        path: '/subscribe',
        body: mockSubscription,
        headers: {
          authorization: 'Bearer mock-token',
        },
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('subscription');
    });

    it('aktif abonelik varsa hata vermeli', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        id: '1',
        ...mockSubscription,
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        subscriptionController.getApp().handle({
          method: 'POST',
          path: '/subscribe',
          body: mockSubscription,
          headers: {
            authorization: 'Bearer mock-token',
          },
        })
      ).rejects.toThrow('Zaten aktif bir aboneliğiniz bulunmakta');
    });
  });
}); 