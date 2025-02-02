import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { PrometheusService } from './modules/monitoring/prometheus.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Middleware'ler
  app.use(compression());
  app.use(helmet());
  
  // Validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CounselEase API')
    .setDescription('CounselEase API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Prometheus metrikleri
  const prometheusService = app.get(PrometheusService);
  app.use('/metrics', async (req, res) => {
    res.set('Content-Type', prometheusService.getContentType());
    res.end(await prometheusService.getMetrics());
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Uygulama ${port} portunda çalışıyor`);
  console.log(`📚 Swagger UI: http://localhost:${port}/docs`);
  console.log(`📊 Metrics: http://localhost:${port}/metrics`);
}

bootstrap(); 