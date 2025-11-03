// ============================================================================
// main.ts - API Gateway Bootstrap
// ============================================================================

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';
import { AppModule as GatewayModule } from './app.module';

import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(GatewayModule, { bufferLogs: true });

  // Core services
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`], // safer: no external CDN
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

  // Validation & serialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // CORS
  const corsOriginsRaw = configService.get('CORS_ORIGINS');
  const corsOrigins =
    typeof corsOriginsRaw === 'string'
      ? corsOriginsRaw.split(',').map((o) => o.trim())
      : ['http://localhost:3000']; // safe default
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  } as CorsOptions);

  // Global prefix (exclude health)
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - API Gateway')
    .setDescription('Unified API entry point for the Shamba Sure platform.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Health', 'Health checks')
    .addServer(`http://localhost:${configService.get('GATEWAY_PORT')}`, 'Local Development')
    .addServer('https://api.shamba.com', 'Production')
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
    },
  });

  // Start server
  const port = configService.get('GATEWAY_PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';
  await app.listen(port, host);

  // Logs
  logger.log(`🚀 Server running at http://${host}:${port}`);
  logger.log(`📚 Docs at http://${host}:${port}/docs`);
  logger.log(`🩺 Health at http://${host}:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
