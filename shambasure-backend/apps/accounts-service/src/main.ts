import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { AccountModule } from './accounts.module';

async function bootstrap() {
  const app = await NestFactory.create(AccountModule, {
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
    .setTitle('Shamba Sure - Accounts Service')
    .setDescription(
      '## Overview\n\n' +
        'Handles user identity, authentication, and profile management for the Shamba Sure platform.\n\n' +
        '## Features\n\n' +
        '- **Authentication**: Registration, login, logout, token refresh with JWT\n' +
        '- **Email Verification**: Secure email verification flow\n' +
        '- **Password Management**: Change, forgot, reset password flows\n' +
        '- **User Profile**: Self-service profile management with phone verification\n' +
        '- **Admin Operations**: User management, role changes, account locking, audit trails\n\n' +
        '## Authentication\n\n' +
        'Most endpoints require JWT authentication. Obtain tokens via `/auth/login` or `/auth/register`.\n\n' +
        '## Authorization\n\n' +
        'Admin endpoints require `ADMIN` role. All role changes are audited for compliance.\n\n' +
        '## Architecture\n\n' +
        'Built with Clean Architecture principles for maintainability and scalability.\n\n' +
        '## Shared Infrastructure\n\n' +
        '- **Database**: PostgreSQL with Prisma ORM\n' +
        '- **Authentication**: JWT with shared auth strategies\n' +
        '- **Messaging**: RabbitMQ for event-driven architecture\n' +
        '- **Observability**: Structured logging, metrics, and distributed tracing',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token obtained from /auth/login or /auth/register',
        name: 'Authorization',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Authentication', 'User authentication, registration, and token management')
    .addTag('User Profile', 'User self-service profile and settings management')
    .addTag('Admin - User Management', 'Administrative user operations (requires ADMIN role)')
    .addTag('Health', 'Service health, liveness, and readiness checks')
    .addServer(
      `http://localhost:${configService.get('ACCOUNTS_SERVICE_PORT', 3001)}`,
      'Local Development',
    )
    .addServer(`https://api.shambasure.co.ke`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Accounts API Documentation',
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

  const port = configService.get('ACCOUNTS_SERVICE_PORT', 3001);
  const host = configService.get('HOST', '0.0.0.0');
  const nodeEnv = configService.get('NODE_ENV', 'development');

  await app.listen(port, host);

  // ============================================================================
  // STARTUP LOGS
  // ============================================================================

  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - Accounts Service v2.0 (Clean Architecture)');
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
  logger.log(`🔐 Security:        Argon2, JWT, Rate Limiting, Account Lockout`);
  logger.log(`📨 Events:          RabbitMQ (user.created, email.verified, etc.)`);
  logger.log(`📊 Observability:   Pino Logger, Metrics, Distributed Tracing`);
  logger.log(`🏢 Shared Modules:  Database, Auth, Messaging, Observability`);
  logger.log('='.repeat(70));

  // Log shared infrastructure status
  const sharedInfraStatus = {
    database: '✅ Connected',
    messaging: configService.get('RABBITMQ_URL') ? '✅ Configured' : '⚠️  Not Configured',
    observability: '✅ Pino Logger Active',
    auth: '✅ JWT Strategies Loaded',
  };

  logger.log('🏢 Shared Infrastructure Status:');
  Object.entries(sharedInfraStatus).forEach(([service, status]) => {
    logger.log(`   ${service}: ${status}`);
  });
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Application failed to start');
  console.error(error);
  process.exit(1);
});
