import { Elysia } from 'elysia';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import os from 'os';

export class MonitoringService {
  private app: Elysia;
  private logger: winston.Logger;

  // Prometheus metrikleri
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private errorCounter: Counter;
  private activeConnections: Gauge;
  private cpuUsage: Gauge;
  private memoryUsage: Gauge;

  constructor() {
    // Başlangıç değerleri ata
    this.app = new Elysia();
    this.logger = winston.createLogger();
    
    // Prometheus metriklerini başlat
    this.requestCounter = new Counter({
      name: 'counselease_http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'path', 'status'],
    });
    
    this.requestDuration = new Histogram({
      name: 'counselease_http_request_duration_seconds',
      help: 'HTTP istek süreleri',
      labelNames: ['method', 'path'],
    });
    
    this.errorCounter = new Counter({
      name: 'counselease_errors_total',
      help: 'Toplam hata sayısı',
      labelNames: ['service', 'type'],
    });
    
    this.activeConnections = new Gauge({
      name: 'counselease_active_connections',
      help: 'Aktif bağlantı sayısı',
    });
    
    this.cpuUsage = new Gauge({
      name: 'counselease_cpu_usage_percentage',
      help: 'CPU kullanım yüzdesi',
    });
    
    this.memoryUsage = new Gauge({
      name: 'counselease_memory_usage_bytes',
      help: 'Bellek kullanımı (bytes)',
    });

    // Setup metodlarını çağır
    this.setupLogger();
    this.setupMetrics();
    this.setupApp();
  }

  private setupLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        // File transport
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
        // Elasticsearch transport
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            index: 'counselease-logs',
          },
        }),
      ],
    });
  }

  private setupMetrics() {
    // İstek sayacı
    this.requestCounter = new Counter({
      name: 'counselease_http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'path', 'status'],
    });

    // İstek süresi
    this.requestDuration = new Histogram({
      name: 'counselease_http_request_duration_seconds',
      help: 'HTTP istek süreleri',
      labelNames: ['method', 'path'],
    });

    // Hata sayacı
    this.errorCounter = new Counter({
      name: 'counselease_errors_total',
      help: 'Toplam hata sayısı',
      labelNames: ['service', 'type'],
    });

    // Aktif bağlantı sayısı
    this.activeConnections = new Gauge({
      name: 'counselease_active_connections',
      help: 'Aktif bağlantı sayısı',
    });

    // CPU kullanımı
    this.cpuUsage = new Gauge({
      name: 'counselease_cpu_usage_percentage',
      help: 'CPU kullanım yüzdesi',
    });

    // Bellek kullanımı
    this.memoryUsage = new Gauge({
      name: 'counselease_memory_usage_bytes',
      help: 'Bellek kullanımı (bytes)',
    });

    // Sistem metriklerini periyodik olarak güncelle
    setInterval(this.updateSystemMetrics.bind(this), 15000);
  }

  private setupApp() {
    this.app = new Elysia()
      // Metrics endpoint'i
      .get('/metrics', async () => {
        return await register.metrics();
      })
      // Logs endpoint'i
      .get('/logs', async ({ query }) => {
        const { level = 'info', limit = '100', from, to } = query;
        
        // Log dosyasından okuma örneği
        // Gerçek uygulamada Elasticsearch'ten çekilebilir
        return {
          message: 'Loglar başarıyla getirildi',
          logs: [], // Elasticsearch'ten logları çek
        };
      })
      // Health check
      .get('/health', () => {
        const healthInfo = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            elasticsearch: true, // Elasticsearch bağlantı kontrolü
            prometheus: true,    // Prometheus bağlantı kontrolü
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
        };

        return healthInfo;
      });
  }

  private async updateSystemMetrics() {
    // CPU kullanımını güncelle
    const cpuUsagePercent = os.loadavg()[0] * 100;
    this.cpuUsage.set(cpuUsagePercent);

    // Bellek kullanımını güncelle
    const usedMemory = os.totalmem() - os.freemem();
    this.memoryUsage.set(usedMemory);
  }

  // Loglama metodları
  public log(level: string, message: string, meta: any = {}) {
    this.logger.log(level, message, meta);
  }

  public error(message: string, meta: any = {}) {
    this.logger.error(message, meta);
    this.errorCounter.inc({ type: meta.type || 'unknown' });
  }

  // Metrik metodları
  public trackRequest(method: string, path: string, status: number, duration: number) {
    this.requestCounter.inc({ method, path, status });
    this.requestDuration.observe({ method, path }, duration);
  }

  public setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  getApp() {
    return this.app;
  }
} 