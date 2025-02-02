import { Module } from '@nestjs/common';
import { ApiGatewayService } from './gateway.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PaymentModule } from '../payment/payment.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { NotificationModule } from '../notification/notification.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    AuthModule,
    SubscriptionModule,
    PaymentModule,
    AppointmentModule,
    NotificationModule,
    MonitoringModule,
  ],
  providers: [ApiGatewayService],
  exports: [ApiGatewayService],
})
export class GatewayModule {} 