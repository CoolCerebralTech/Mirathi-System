import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigModule, ShambaConfigService } from '@shamba/config';
import { ObservabilityModule, LoggerService } from '@shamba/observability';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(ApiGatewayModule, {
    bufferLogs: true,
  });

  // Get configuration service
  const configService = app.get(ShambaConfigService);
  const logger = app.get(LoggerService);

  // Use the logger
  app.useLogger(logger);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: configService.app.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID',
      'X-Request-ID',
    ],
  });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix(configService.app.globalPrefix);

  // Swagger documentation for gateway endpoints
  const config = new DocumentBuilder()
    .setTitle('Shamba Sure API Gateway')
    .setDescription('Single entry point for all Shamba Sure microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Health check endpoints')
    .addTag('Gateway', 'API Gateway endpoints (auto-proxied)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.app.port || 3000;
  await app.listen(port);

  logger.log(`API Gateway started successfully on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.app.environment}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/health`, 'Bootstrap');
  logger.log(`Ready to proxy requests to microservices`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});