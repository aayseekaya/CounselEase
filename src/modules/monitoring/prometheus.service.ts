import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly appointmentsTotal: Counter;
  private readonly paymentsAmount: Counter;
  private readonly activeUsers: Gauge;

  constructor() {
    this.registry = new Registry();
    
    // HTTP metrikleri
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP isteği süre dağılımı',
      labelNames: ['method', 'path', 'status_code'],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'path', 'status_code'],
    });

    // İş metrikleri
    this.appointmentsTotal = new Counter({
      name: 'appointments_created_total',
      help: 'Oluşturulan toplam randevu sayısı',
    });

    this.paymentsAmount = new Counter({
      name: 'payments_amount_total',
      help: 'Toplam ödeme miktarı',
    });

    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Aktif kullanıcı sayısı',
    });

    // Metrikleri kaydet
    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.httpRequestTotal);
    this.registry.registerMetric(this.appointmentsTotal);
    this.registry.registerMetric(this.paymentsAmount);
    this.registry.registerMetric(this.activeUsers);
  }

  registerHttpMetrics() {
    // HTTP metriklerini başlat
    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.httpRequestTotal);
  }

  registerSystemMetrics() {
    // Sistem metriklerini başlat
    this.registry.setDefaultLabels({
      app: 'counselease',
    });
  }

  registerBusinessMetrics() {
    // İş metriklerini başlat
    this.registry.registerMetric(this.appointmentsTotal);
    this.registry.registerMetric(this.paymentsAmount);
    this.registry.registerMetric(this.activeUsers);
  }

  recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, path, status_code: statusCode });
    this.httpRequestDuration.observe({ method, path, status_code: statusCode }, duration);
  }

  incrementAppointments() {
    this.appointmentsTotal.inc();
  }

  recordPaymentAmount(amount: number) {
    this.paymentsAmount.inc(amount);
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  async getMetrics() {
    return this.registry.metrics();
  }
} 