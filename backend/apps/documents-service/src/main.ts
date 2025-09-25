import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigModule, ShambaConfigService } from '@shamba/config';
import { ObservabilityModule, LoggerService } from '@shamba/observability';
import { DocumentsModule } from './documents.module';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(DocumentsModule, {
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
    .setTitle('Shamba Sure Documents Service')
    .setDescription('Secure document management service for Shamba Sure platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Documents', 'Document management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.app.port || 3002;
  await app.listen(port);

  logger.log(`Documents service started successfully on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.app.environment}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/health`, 'Bootstrap');

  // Start background tasks
  const storageService = app.get(StorageService);
  // Start periodic cleanup of temp files (every 24 hours)
  setInterval(() => {
    storageService.cleanupTempFiles().catch(error => {
      logger.error('Temp files cleanup failed', 'Bootstrap', { error: error.message });
    });
  }, 24 * 60 * 60 * 1000);
}

bootstrap().catch((error) => {
  console.error('Failed to start documents service:', error);
  process.exit(1);
});