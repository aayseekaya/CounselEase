import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, CreateAppointmentReminderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Yeni bildirim gönder' })
  async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.sendNotification(createNotificationDto);
  }

  @Post('reminder/appointment')
  @ApiOperation({ summary: 'Randevu hatırlatması oluştur' })
  async createAppointmentReminder(@Body() reminderDto: CreateAppointmentReminderDto) {
    return this.notificationService.createAppointmentReminder(reminderDto);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Bildirim geçmişini getir' })
  async getNotificationHistory(@Param('userId') userId: string) {
    return this.notificationService.getNotificationHistory(userId);
  }
} 