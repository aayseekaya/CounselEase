import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { PrometheusService } from './prometheus.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [MonitoringService, PrometheusService],
  exports: [MonitoringService, PrometheusService],
})
export class MonitoringModule {} 