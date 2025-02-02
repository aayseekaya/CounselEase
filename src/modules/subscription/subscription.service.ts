import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, SubscribeDto } from './dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async createPlan(createPlanDto: CreatePlanDto) {
    const { name, description, price, duration, features } = createPlanDto;

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price,
        duration,
        features,
      },
    });

    return {
      message: 'Abonelik planı oluşturuldu',
      plan,
    };
  }

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany();
  }

  async subscribe(subscribeDto: SubscribeDto) {
    const { userId, planId } = subscribeDto;

    // Aktif abonelik kontrolü
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (activeSubscription) {
      throw new BadRequestException('Zaten aktif bir aboneliğiniz bulunmakta');
    }

    // Plan kontrolü
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Abonelik planı bulunamadı');
    }

    // Yeni abonelik oluşturma
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = await this.prisma.subscription.create({
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
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
    });
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonelik bulunamadı');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Bu abonelik zaten iptal edilmiş veya süresi dolmuş');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' },
    });

    return {
      message: 'Abonelik iptal edildi',
      subscription: updatedSubscription,
    };
  }
} 