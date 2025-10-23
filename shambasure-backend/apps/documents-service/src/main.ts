// ============================================================================
// main.ts - Application Bootstrap
// ============================================================================

import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';

import { ConfigService } from '@shamba/config';
import { DocumentsModule } from './documents.module';

/**
 * Bootstrap function - Initializes and starts the Documents microservice
 *
 * SETUP STEPS:
 * 1. Create NestJS app with custom logger
 * 2. Configure file upload limits
 * 3. Configure global pipes (validation)
 * 4. Configure global interceptors (serialization)
 * 5. Enable CORS, versioning, and global prefix
 * 6. Setup Swagger documentation
 * 7. Start HTTP server
 */
async function bootstrap() {
  // --- Create Application ---
  const app = await NestFactory.create<NestExpressApplication>(DocumentsModule, {
    bufferLogs: true, // Buffer logs until custom logger is ready
    bodyParser: true,
  });

  // --- Dependency Injection ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Logging Configuration ---
  app.useLogger(logger);

  // --- Graceful Shutdown ---
  // Ensures database connections and RabbitMQ close cleanly
  app.enableShutdownHooks();

  // --- File Upload Configuration ---
  // Configure Express to handle larger file uploads
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // --- Global Validation Pipe ---
  // Automatically validates all incoming DTOs using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // --- Global Serialization Interceptor ---
  // CRITICAL: Removes @Exclude() fields from all responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // --- CORS Configuration ---
  const corsOrigins = configService.get('CORS_ORIGINS') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // --- API Prefix and Versioning ---
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // --- Swagger Documentation ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Documents Service')
    .setDescription(
      'API for secure document upload, storage, and verification management.\n\n' +
        '**Features:**\n' +
        '- Document upload with validation (PDF, JPEG, PNG)\n' +
        '- Version control and history\n' +
        '- Admin verification workflow\n' +
        '- Secure file download\n' +
        '- Storage statistics and quotas',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',
    )
    .addTag('Documents', 'Document upload, download, and management')
    .addServer(`http://localhost:${configService.get('PORT')}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/v1/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Documents API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    swaggerOptions: {
      persistAuthorization: true, // Remember auth token in browser
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // --- Start Server ---
  const port = configService.get('PORT') || 3002;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  // --- Startup Logs ---
  logger.log(`🚀 Documents Service is running`);
  logger.log(`📍 Server: http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${globalPrefix}/v1/docs`);
  logger.log(`🔗 Health Check: http://localhost:${port}/${globalPrefix}/v1/health`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV') || 'development'}`);
  logger.log(`📁 Storage Path: ${configService.get('STORAGE_LOCAL_PATH') || 'uploads'}`);
  logger.log(`🔒 CORS Origins: ${corsOrigins}`);
}

// --- Bootstrap with Error Handling ---
bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:');
  console.error(error);
  process.exit(1);
});
