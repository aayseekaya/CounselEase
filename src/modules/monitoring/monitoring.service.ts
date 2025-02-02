import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MonitoringService implements OnModuleInit {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.setupMetrics();
  }

  private setupMetrics() {
    // Sistem metriklerini kaydet
    this.prometheusService.registerSystemMetrics();
    
    // Özel iş metriklerini kaydet
    this.prometheusService.registerBusinessMetrics();
  }

  recordAppointmentCreated() {
    this.prometheusService.incrementAppointments();
  }

  recordPaymentProcessed(amount: number) {
    this.prometheusService.recordPaymentAmount(amount);
  }

  recordActiveUsers(count: number) {
    this.prometheusService.setActiveUsers(count);
  }

  getMetrics() {
    return this.prometheusService.getMetrics();
  }
} 