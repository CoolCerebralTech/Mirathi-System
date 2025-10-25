import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';
import { AccountsModule } from './accounts.module';

async function bootstrap() {
  const app = await NestFactory.create(AccountsModule, {
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

  const corsOrigins = configService.get('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ============================================================================
  // API CONFIGURATION
  // ============================================================================

  const globalPrefix = configService.get('GLOBAL_PREFIX', 'api');
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
        'Handles user identity, authentication, and profile management.\n\n' +
        '## Features\n\n' +
        '- **Authentication**: Registration, login, logout, token refresh\n' +
        '- **Password Management**: Change, forgot, reset password flows\n' +
        '- **User Profile**: Get and update profile information\n' +
        '- **Admin Operations**: User management, role changes, audit trails\n\n' +
        '## Authentication\n\n' +
        'Most endpoints require JWT authentication. Obtain tokens via `/auth/login` or `/auth/register`.\n\n' +
        '## Authorization\n\n' +
        'Admin endpoints require `ADMIN` role. Role changes are audited.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
        name: 'Authorization',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Authentication', 'User authentication and token management')
    .addTag('Admin - User Management', 'Administrative user operations')
    .addTag('Health', 'Service health and readiness checks')
    .addServer(
      `http://localhost:${configService.get('ACCOUNTS_SERVICE_PORT', 3001)}`,
      'Local Development',
    )
    .addServer(`https://api.shambasure.com`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Accounts API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
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

  logger.log('='.repeat(60));
  logger.log('🚀 Shamba Sure - Accounts Service');
  logger.log('='.repeat(60));
  logger.log(`📍 Server URL:      http://localhost:${port}`);
  logger.log(`📚 API Docs:        http://localhost:${port}/${globalPrefix}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${port}/${globalPrefix}/health`);
  logger.log(`🔍 Liveness:        http://localhost:${port}/${globalPrefix}/health/liveness`);
  logger.log(`✅ Readiness:       http://localhost:${port}/${globalPrefix}/health/readiness`);
  logger.log('─'.repeat(60));
  logger.log(`🌍 Environment:     ${nodeEnv}`);
  logger.log(`🔒 CORS Origins:    ${corsOrigins}`);
  logger.log(`📦 API Version:     v1`);
  logger.log(`🏷️  Global Prefix:   /${globalPrefix}`);
  logger.log('='.repeat(60));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Application failed to start');
  console.error(error);
  process.exit(1);
});
