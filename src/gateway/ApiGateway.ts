import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { rateLimit } from '@elysiajs/rate-limit';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';

// Service Controllers
import { AuthController } from '../controllers/AuthController';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { PaymentController } from '../controllers/PaymentController';
import { AppointmentController } from '../controllers/AppointmentController';
import { NotificationController } from '../controllers/NotificationController';
import { MonitoringService } from '../monitoring/MonitoringService';

export class ApiGateway {
  private app: Elysia;
  private readonly PUBLIC_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/health',
    '/payment/webhook'
  ];

  constructor() {
    this.app = new Elysia()
      // Middleware ve eklentiler
      .use(cors())
      .use(swagger({
        documentation: {
          info: {
            title: 'CounselEase API',
            version: '1.0.0',
          },
        },
      }))
      .use(rateLimit({
        max: 100, // 100 istek
        window: '1m', // 1 dakika
      }))
      .use(
        jwt({
          name: 'jwt',
          secret: process.env.JWT_SECRET || 'gizli-anahtar',
        })
      )
      // Global hata yakalama
      .onError(({ code, error, set }) => {
        console.error(`Hata: ${code}`, error);
        
        set.status = code === 'NOT_FOUND' ? 404 : 500;
        
        return {
          success: false,
          error: error.message,
          code,
        };
      })
      // Auth middleware
      .derive(({ headers, path }) => {
        return {
          isPublicRoute: this.PUBLIC_ROUTES.includes(path),
        };
      })
      .derive(async ({ headers, jwt, isPublicRoute, set }) => {
        if (isPublicRoute) return {};

        const authHeader = headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          throw new Error('Yetkilendirme gerekli');
        }

        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);

        if (!payload) {
          set.status = 401;
          throw new Error('Geçersiz token');
        }

        return { user: payload };
      })
      // Health check endpoint'i
      .get('/health', () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }))
      // Servis rotaları
      .group('/auth', app => {
        const authController = new AuthController();
        return app.use(authController.getApp());
      })
      .group('/subscription', app => {
        const subscriptionController = new SubscriptionController();
        return app.use(subscriptionController.getApp());
      })
      .group('/payment', app => {
        const paymentController = new PaymentController();
        return app.use(paymentController.getApp());
      })
      .group('/appointment', app => {
        const appointmentController = new AppointmentController();
        return app.use(appointmentController.getApp());
      })
      .group('/notification', app => {
        const notificationController = new NotificationController();
        return app.use(notificationController.getApp());
      })
      // Monitoring servisini ekle
      .group('/monitoring', app => {
        const monitoringService = new MonitoringService();
        return app.use(monitoringService.getApp());
      });
  }

  // Metrics için middleware
  private setupMetrics() {
    const startTime = Date.now();
    return async ({ request, path }, next) => {
      const start = process.hrtime();
      
      await next();
      
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      // Burada Prometheus metriklerini güncelleyebilirsiniz
      console.log(`${request.method} ${path} - ${duration}ms`);
    };
  }

  start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 API Gateway çalışıyor: http://localhost:${port}`);
      console.log(`📚 Swagger UI: http://localhost:${port}/swagger`);
    });
  }
} 