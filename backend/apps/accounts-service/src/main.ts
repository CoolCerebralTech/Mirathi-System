import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigModule, ShambaConfigService } from '@shamba/config';
import { ObservabilityModule, LoggerService } from '@shamba/observability';
import { AccountsModule } from './accounts.module';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AccountsModule, {
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
    .setTitle('Shamba Sure Accounts Service')
    .setDescription('User identity and management service for Shamba Sure platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.app.port;
  await app.listen(port);

  logger.log(`Accounts service started successfully on port ${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.app.environment}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start accounts service:', error);
  process.exit(1);
});