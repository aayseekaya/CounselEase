import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from '../monitoring/prometheus.service';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private readonly PUBLIC_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/health',
    '/payment/webhook'
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService,
  ) {}

  onModuleInit() {
    this.setupMetrics();
  }

  isPublicRoute(path: string): boolean {
    return this.PUBLIC_ROUTES.includes(path);
  }

  private setupMetrics() {
    // HTTP metriklerini kaydet
    this.prometheusService.registerHttpMetrics();
  }

  async logRequestMetrics(method: string, path: string, statusCode: number, duration: number) {
    this.prometheusService.recordHttpRequest(method, path, statusCode, duration);
  }
} 