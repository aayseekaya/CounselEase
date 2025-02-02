import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { 
  authConfig, 
  databaseConfig, 
  kafkaConfig, 
  emailConfig, 
  smsConfig 
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        authConfig,
        databaseConfig,
        kafkaConfig,
        emailConfig,
        smsConfig,
      ],
    }),
    PrismaModule,
    MonitoringModule,
    AuthModule,
    PaymentModule,
    AppointmentModule,
    NotificationModule,
    SubscriptionModule,
    GatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 