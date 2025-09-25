import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigModule, ShambaConfigService } from '@shamba/config';
import { ObservabilityModule, LoggerService } from '@shamba/observability';
import { SuccessionModule } from './succession.module';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(SuccessionModule, {
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
    .setTitle('Shamba Sure Succession Service')
    .setDescription('Estate and inheritance planning service for Shamba Sure platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Wills', 'Will management endpoints')
    .addTag('Assets', 'Asset management endpoints')
    .addTag('Families', 'Family management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.app.port || 3001;
  await app.listen(port);

  logger.log(`Succession service started successfully on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.app.environment}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start succession service:', error);
  process.exit(1);
});