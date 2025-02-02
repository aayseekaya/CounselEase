import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreatePlanDto, SubscribeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Yeni abonelik planı oluştur (Admin)' })
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionService.createPlan(createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Tüm abonelik planlarını listele' })
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Abonelik oluştur' })
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.subscriptionService.subscribe(subscribeDto);
  }

  @Get('subscriptions/:userId')
  @ApiOperation({ summary: 'Kullanıcının aboneliklerini getir' })
  async getUserSubscriptions(@Param('userId') userId: string) {
    return this.subscriptionService.getUserSubscriptions(userId);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Abonelik iptali' })
  async cancelSubscription(@Body('subscriptionId') subscriptionId: string) {
    return this.subscriptionService.cancelSubscription(subscriptionId);
  }
} 