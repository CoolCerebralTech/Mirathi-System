// ============================================================================
// main.ts - API Gateway Bootstrap
// ============================================================================

import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';
import { GatewayModule } from './gateway.module';

// Security middlewares
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

/**
 * Bootstrap function - Initializes and starts the API Gateway
 *
 * SETUP STEPS:
 * 1. Create NestJS app with custom logger
 * 2. Apply security middlewares (helmet, rate limiting)
 * 3. Configure global pipes and interceptors
 * 4. Enable CORS and versioning
 * 5. Setup Swagger documentation
 * 6. Start HTTP server
 */
async function bootstrap() {
  // --- Create Application ---
  const app = await NestFactory.create(GatewayModule, {
    bufferLogs: true,
  });

  // --- Dependency Injection ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Logging Configuration ---
  app.useLogger(logger);

  // --- Graceful Shutdown ---
  app.enableShutdownHooks();

  // --- Security Middlewares ---
  // Helmet: Sets various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https://unpkg.com`], // Allow scripts from unpkg for Swagger UI
        },
      },
      crossOriginEmbedderPolicy: false, // Keep this for now
    }),
  );

  // Compression: Compress response bodies
  app.use(compression());

  // Rate Limiting: Protect against brute force attacks
  const rateLimitTtl = configService.get('RATE_LIMIT_TTL') || 60; // 60 seconds
  const rateLimitMax = configService.get('RATE_LIMIT_LIMIT') || 100; // 100 requests

  app.use(
    rateLimit({
      windowMs: rateLimitTtl * 1000,
      max: rateLimitMax,
      standardHeaders: true, // Return rate limit info in headers
      legacyHeaders: false, // Disable X-RateLimit-* headers
      message: {
        statusCode: 429,
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
      },
    }),
  );

  logger.log(`Rate limiting enabled: ${rateLimitMax} requests per ${rateLimitTtl}s`);

  // --- Global Validation Pipe ---
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

  // --- Global Serialization Interceptor ---
  // Gateway rarely uses this, but good for any local DTOs
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // --- CORS Configuration ---
  const corsOriginsRaw = configService.get('CORS_ORIGINS');
  let corsOrigins: string[] = []; // Initialize as an array

  if (corsOriginsRaw && typeof corsOriginsRaw === 'string') {
    // Split the comma-separated string from the .env file into an array
    corsOrigins = corsOriginsRaw.split(',').map((origin) => origin.trim());
    logger.log(`🔒 CORS Origins configured: ${corsOrigins.join(', ')}`);
  } else {
    // Fallback for safety if the .env variable is missing
    corsOrigins = ['*'];
    logger.warn(`🔒 CORS_ORIGINS not set, allowing all origins (development only).`);
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        // Origin is in the allow list
        callback(null, true);
        return;
      } else {
        // Origin is not allowed
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
        return;
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
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
    .setTitle('Shamba Sure - API Gateway')
    .setDescription(
      'The unified API entry point for Shamba Sure platform.\n\n' +
        '**Architecture:**\n' +
        '- Single gateway for all client requests\n' +
        '- Routes to 3 microservices (accounts, documents, succession)\n' +
        '- JWT authentication at gateway level\n' +
        '- Rate limiting and security headers\n\n' +
        '**Microservices:**\n' +
        '- **Accounts Service**: Authentication, users, profiles\n' +
        '- **Documents Service**: Document upload, verification, storage\n' +
        '- **Succession Service**: Wills, assets, family management',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token from /auth/login or /auth/register',
      },
      'JWT',
    )
    .addTag('Health', 'Health checks for gateway and downstream services')
    .addTag('Auth & Profile', 'Authentication and profile management (accounts-service)')
    .addTag('Users (Admin)', 'User administration (accounts-service)')
    .addTag('Documents', 'Document management (documents-service)')
    .addTag('Wills', 'Will creation and management (succession-service)')
    .addTag('Assets', 'Asset registration and tracking (succession-service)')
    .addTag('Families', 'Family tree management - HeirLink™ (succession-service)')
    .addServer(`http://localhost:${configService.get('PORT')}`, 'Local Development')
    .addServer('https://api.shamba.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/v1/docs`, app, document, {
    customSiteTitle: 'Shamba Sure API Gateway',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'none',
      filter: true,
    },
  });

  // --- Start HTTP Server ---
  const port = configService.get('GATEWAY_PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  // --- Startup Logs ---
  const nodeEnv = configService.get('NODE_ENV') || 'development';

  logger.log(`🚀 API Gateway is running`);
  logger.log(`📍 Server: http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${globalPrefix}/v1/docs`);
  logger.log(`🔗 Health Check: http://localhost:${port}/${globalPrefix}/v1/health`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 CORS Origins: ${corsOrigins.join(', ')}`);
  logger.log(`🛡️  Rate Limit: ${rateLimitMax} requests/${rateLimitTtl}s`);
  logger.log(`🔗 Accounts Service: ${configService.get('ACCOUNTS_SERVICE_URL')}`);
  logger.log(`🔗 Documents Service: ${configService.get('DOCUMENTS_SERVICE_URL')}`);
  logger.log(`🔗 Succession Service: ${configService.get('SUCCESSION_SERVICE_URL')}`);
}

// --- Bootstrap with Error Handling ---
bootstrap().catch((error) => {
  console.error('❌ Fatal error during API Gateway bootstrap:');
  console.error(error);
  process.exit(1);
});
