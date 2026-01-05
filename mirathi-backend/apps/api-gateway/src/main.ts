// ============================================================================
// main.ts - API Gateway Bootstrap (Cleaned & Modernized)
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
  // 1. Create App (disable default body parser for proxy streams)
  const app = await NestFactory.create(GatewayModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // 2. Logger & Shutdown
  app.useLogger(logger);
  app.enableShutdownHooks();

  // 3. Security Headers
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

  // 4. Rate Limiting
  const rateLimitTtl = configService.get('RATE_LIMIT_TTL') || 60;
  const rateLimitMax = configService.get('RATE_LIMIT_LIMIT') || 100;
  app.use(
    rateLimit({
      windowMs: rateLimitTtl * 1000,
      max: rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 5. Intelligent Body Parser
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';

  app.use((req, res, next) => {
    // Keep raw stream for proxied routes only
    if (req.path.startsWith(`/${globalPrefix}/`)) return next();

    json({ limit: '50mb' })(req, res, (err) => {
      if (err) return next(err);
      urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
  });

  // 6. Global Validation & Serialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // 7. CORS
  const corsOriginsRaw = configService.get('CORS_ORIGINS');
  const corsOrigins =
    corsOriginsRaw.length === 1 && corsOriginsRaw[0] === '*' ? '*' : corsOriginsRaw;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // 8. Global Prefix - ✅ FIXED: Use *path syntax (path-to-regexp v8)
  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/*path', method: RequestMethod.ALL },
      { path: 'docs', method: RequestMethod.ALL },
      { path: 'docs/*path', method: RequestMethod.ALL },
      { path: 'api-json', method: RequestMethod.ALL },
    ],
  });

  // 9. Swagger Docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mirathi - API Gateway')
    .setDescription('Unified API entry point for the Mirathi platform.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Health', 'Health checks')
    .addServer(`http://localhost:${configService.get('GATEWAY_PORT') || 3000}`, 'Local Dev')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true, filter: true },
  });

  // 10. Start Server
  const port = configService.get('GATEWAY_PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';
  await app.listen(port, host);

  // 11. Startup Logs
  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - API Gateway v1.0 (Standardized)');
  logger.log('='.repeat(70));
  logger.log(`📍 URL:           http://localhost:${port}`);
  logger.log(`📚 Docs:          http://localhost:${port}/docs`);
  logger.log(`🩺 Health:        http://localhost:${port}/health/readiness`);
  logger.log('─'.repeat(70));
  logger.log(`🔀 Proxies:       /${globalPrefix}/*path --> Microservices`);
  logger.log(`🛡️  Auth:          Enabled (JWT)`);
  logger.log('='.repeat(70));
}

bootstrap().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
