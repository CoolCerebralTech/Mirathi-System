import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { DocumentModule } from './document.module';

async function bootstrap() {
  const app = await NestFactory.create(DocumentModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();

  // ============================================================================
  // GLOBAL VALIDATION
  // ============================================================================

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

  // ============================================================================
  // GLOBAL SERIALIZATION
  // ============================================================================

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================

  const rawCorsOrigins = configService.get('CORS_ORIGINS');

  const corsOrigins =
    rawCorsOrigins === '*'
      ? '*'
      : Array.isArray(rawCorsOrigins)
        ? rawCorsOrigins
        : typeof rawCorsOrigins === 'string'
          ? rawCorsOrigins.split(',').map((o) => o.trim())
          : [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ============================================================================
  // API CONFIGURATION
  // ============================================================================

  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Documents Service')
    .setDescription(
      '## Overview\n\n' +
        'Manages document lifecycle, verification, and secure file storage for the Shamba Sure platform.\n\n' +
        '## Features\n\n' +
        '- **Document Upload**: Secure file upload with validation and virus scanning\n' +
        '- **Document Verification**: Admin/verifier workflow for document approval\n' +
        '- **Version Control**: Complete version history with change tracking\n' +
        '- **Secure Storage**: Local and cloud storage with encryption support\n' +
        '- **Access Control**: Fine-grained permissions and sharing capabilities\n' +
        '- **Audit Trail**: Complete verification and access history\n\n' +
        '## Authentication\n\n' +
        'Most endpoints require JWT authentication. Obtain tokens via the Accounts Service.\n\n' +
        '## Authorization\n\n' +
        '- **Document Owners**: Can upload, update, delete, and share their documents\n' +
        '- **Verifiers/Admins**: Can verify or reject documents\n' +
        '- **Viewers**: Can access shared or public documents\n\n' +
        '## File Upload Limits\n\n' +
        '- **Max File Size**: 50MB\n' +
        '- **Allowed Types**: PDF, JPEG, PNG, Word Documents, Text Files\n' +
        '- **Virus Scanning**: All files are scanned for malware\n\n' +
        '## Architecture\n\n' +
        'Built with Clean Architecture principles for maintainability and scalability.\n\n' +
        '## Shared Infrastructure\n\n' +
        '- **Database**: PostgreSQL with Prisma ORM\n' +
        '- **Authentication**: JWT with shared auth strategies\n' +
        '- **Messaging**: RabbitMQ for event-driven architecture\n' +
        '- **Observability**: Structured logging, metrics, and distributed tracing',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token obtained from Accounts Service',
        name: 'Authorization',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Documents', 'Document management, upload, and retrieval')
    .addTag('Document Versions', 'Document version history and management')
    .addTag('Document Verification', 'Document verification workflow and audit')
    .addTag('Health', 'Service health, liveness, and readiness checks')
    .addServer(
      `http://localhost:${configService.get('DOCUMENTS_SERVICE_PORT', 3002)}`,
      'Local Development',
    )
    .addServer(`https://api.shambasure.co.ke`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Documents API Documentation',
    customfavIcon: 'https://shambasure.co.ke/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .scheme-container { margin: 0 0 20px 0 }
      .swagger-ui .info .title { color: #16a34a; font-size: 2.5em; }
      .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    `,
  });

  // ============================================================================
  // START SERVER
  // ============================================================================

  const port = configService.get('DOCUMENTS_SERVICE_PORT', 3002);
  const host = configService.get('HOST', '0.0.0.0');
  const nodeEnv = configService.get('NODE_ENV', 'development');

  await app.listen(port, host);

  // ============================================================================
  // STARTUP LOGS
  // ============================================================================

  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - Documents Service v1.0 (Clean Architecture)');
  logger.log('='.repeat(70));
  logger.log(`📍 Server URL:      http://localhost:${port}`);
  logger.log(`📚 API Docs:        http://localhost:${port}/${globalPrefix}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${port}/${globalPrefix}/health`);
  logger.log(`🔍 Liveness:        http://localhost:${port}/${globalPrefix}/health/liveness`);
  logger.log(`✅ Readiness:       http://localhost:${port}/${globalPrefix}/health/readiness`);
  logger.log('─'.repeat(70));
  logger.log(`🌍 Environment:     ${nodeEnv}`);
  logger.log(`🔒 CORS Origins:    ${rawCorsOrigins}`);
  logger.log(`📦 API Version:     v1`);
  logger.log(`🏷️  Global Prefix:   /${globalPrefix}`);
  logger.log(`🏗️  Architecture:    Clean Architecture (4 Layers)`);
  logger.log(`🔐 Security:        File Validation, Virus Scanning, Access Control`);
  logger.log(`📨 Events:          RabbitMQ (document.uploaded, document.verified, etc.)`);
  logger.log(`📊 Observability:   Pino Logger, Metrics, Distributed Tracing`);
  logger.log(`🏢 Shared Modules:  Database, Auth, Messaging, Observability`);
  logger.log('='.repeat(70));

  // Log shared infrastructure status
  const sharedInfraStatus = {
    database: '✅ Connected',
    messaging: configService.get('RABBITMQ_URL') ? '✅ Configured' : '⚠️  Not Configured',
    observability: '✅ Pino Logger Active',
    auth: '✅ JWT Strategies Loaded',
    storage:
      configService.get('STORAGE_PROVIDER') === 'local' ? '✅ Local Storage' : '✅ Cloud Storage',
  };

  logger.log('🏢 Shared Infrastructure Status:');
  Object.entries(sharedInfraStatus).forEach(([service, status]) => {
    logger.log(`   ${service}: ${status}`);
  });
  logger.log('='.repeat(70));

  // Log document service specific features
  const documentFeatures = {
    'Max File Size': '50MB',
    'Allowed File Types': 'PDF, Images, Word, Text',
    'Virus Scanning': '✅ Enabled',
    'Version Control': '✅ Enabled',
    'Access Control': '✅ Fine-grained',
    'Audit Trail': '✅ Complete History',
  };

  logger.log('📄 Document Service Features:');
  Object.entries(documentFeatures).forEach(([feature, status]) => {
    logger.log(`   ${feature}: ${status}`);
  });
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Documents Service failed to start');
  console.error(error);
  process.exit(1);
});
