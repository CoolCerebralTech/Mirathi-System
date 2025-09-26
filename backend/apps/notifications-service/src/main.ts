import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigModule, ShambaConfigService } from '@shamba/config';
import { ObservabilityModule, LoggerService } from '@shamba/observability';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(NotificationModule, {
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
  });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix(configService.app.globalPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Shamba Sure Notification Service')
    .setDescription('Email, SMS, and push notification service for Shamba Sure platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Notifications', 'Notification management endpoints')
    .addTag('Templates', 'Notification template management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.app.port || 3002;
  await app.listen(port);

  logger.log(`Notification service started successfully on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.app.environment}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});