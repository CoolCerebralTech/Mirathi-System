// apps/api-gateway/src/main.ts
// ============================================================================
// main.ts - API Gateway Bootstrap
// ============================================================================
import { ClassSerializerInterceptor, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { AppModule as GatewayModule } from './app.module';

async function bootstrap() {
  // ============================================================================
  // CRITICAL: Disable body parser to let http-proxy-middleware handle it
  // ============================================================================
  const app = await NestFactory.create(GatewayModule, {
    bufferLogs: true,
    bodyParser: false, // ← CRITICAL: Disable global body parser
  });

  // Core services
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();

  // ============================================================================
  // CRITICAL: CUSTOM BODY PARSER MIDDLEWARE
  // Selectively enable body parsing ONLY for non-proxied routes
  // ============================================================================
  app.use((req, res, next) => {
    const path = req.path;

    // Skip body parsing for proxied microservice routes
    const isProxiedRoute =
      path.startsWith('/api/accounts') ||
      path.startsWith('/api/succession') ||
      path.startsWith('/api/documents') ||
      path.startsWith('/api/notifications') ||
      path.startsWith('/api/auditing');

    if (isProxiedRoute) {
      // Don't parse body - let http-proxy-middleware handle it
      logger.debug({ msg: 'Skipping body parser for proxied route', path });
      return next();
    }

    // For non-proxied routes (like /health, /docs), parse the body normally
    logger.debug({ msg: 'Parsing body for non-proxied route', path });
    json({ limit: '50mb' })(req, res, (err) => {
      if (err) return next(err);
      urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
  });

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  // Rate limiting
  const rateLimitTtl = configService.get('RATE_LIMIT_TTL') || 60;
  const rateLimitMax = configService.get('RATE_LIMIT_LIMIT') || 100;
  app.use(
    rateLimit({
      windowMs: rateLimitTtl * 1000,
      max: rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
      },
    }),
  );

  // ============================================================================
  // GLOBAL VALIDATION & SERIALIZATION
  // ============================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  const corsOriginsRaw = configService.get('CORS_ORIGINS');
  const corsOrigins =
    corsOriginsRaw.length === 1 && corsOriginsRaw[0] === '*' ? '*' : corsOriginsRaw;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  });

  // ============================================================================
  // API CONFIGURATION
  // ============================================================================
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';

  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/liveness', method: RequestMethod.ALL },
      { path: 'health/readiness', method: RequestMethod.ALL },
      { path: 'docs', method: RequestMethod.ALL },
    ],
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - API Gateway')
    .setDescription('Unified API entry point for the Shamba Sure platform.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Health', 'Health checks and monitoring')
    .addServer(`http://localhost:${configService.get('GATEWAY_PORT')}`, 'Local Development')
    .addServer('https://api.shambasure.co.ke', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Shamba Sure API Gateway',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // ============================================================================
  // START SERVER
  // ============================================================================
  const port = configService.get('GATEWAY_PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';
  const nodeEnv = configService.get('NODE_ENV') || 'development';

  await app.listen(port, host);

  // ============================================================================
  // STARTUP LOGS
  // ============================================================================
  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - API Gateway v1.0');
  logger.log('='.repeat(70));
  logger.log(`📍 Server URL:      http://localhost:${port}`);
  logger.log(`📚 Docs:            http://localhost:${port}/docs`);
  logger.log(`🩺 Health:          http://localhost:${port}/health`);
  logger.log(`   - Liveness:      http://localhost:${port}/health/liveness`);
  logger.log(`   - Readiness:     http://localhost:${port}/health/readiness`);
  logger.log('─'.repeat(70));
  logger.log(`🌍 Environment:     ${nodeEnv}`);
  logger.log(`🔒 CORS Origins:    ${corsOriginsRaw.join(', ')}`);
  logger.log(`🏷️  Global Prefix:   /${globalPrefix}`);
  logger.log('─'.repeat(70));
  logger.log('🔄 Proxy Routes (configured):');
  logger.log(`   /${globalPrefix}/accounts      → ${configService.get('ACCOUNTS_SERVICE_URL')}`);
  logger.log(`   /${globalPrefix}/succession    → ${configService.get('SUCCESSION_SERVICE_URL')}`);
  logger.log(`   /${globalPrefix}/documents     → ${configService.get('DOCUMENTS_SERVICE_URL')}`);
  logger.log(
    `   /${globalPrefix}/notifications → ${configService.get('NOTIFICATIONS_SERVICE_URL')}`,
  );
  logger.log(`   /${globalPrefix}/auditing      → ${configService.get('AUDITING_SERVICE_URL')}`);
  logger.log('─'.repeat(70));
  logger.log('✅ API Gateway ready to accept requests');
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
