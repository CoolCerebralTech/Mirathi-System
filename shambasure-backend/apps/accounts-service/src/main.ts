// apps/accounts-service/src/main.ts
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  // 2. Connect the Microservice Strategy (RabbitMQ)
  const rmqUrl = configService.get('RABBITMQ_URL');
  if (rmqUrl) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: 'accounts_queue',
        queueOptions: { durable: true },
      },
    });
  } else {
    logger.warn('⚠️ RABBITMQ_URL not found. Microservice listeners will not start.');
  }

  // ============================================================================
  // GLOBAL VALIDATION
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ============================================================================
  // API CONFIGURATION (CRITICAL FIXES)
  // ============================================================================

  // 1. DISABLE GLOBAL PREFIX
  // The Gateway already strips "/api/accounts". If we add "api" here again,
  // the path becomes "/api/auth/register", causing a 404.
  // app.setGlobalPrefix('api');  <--- COMMENTED OUT FOR GATEWAY COMPATIBILITY

  // 2. DISABLE FORCED VERSIONING (Optional)
  // If you want to use versioning, your URL must be /api/accounts/v1/auth/register.
  // For now, let's disable it to make your test URL work.
  /*
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  */

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Accounts Service')
    .setDescription('Handles user identity, authentication, and profile management.')
    .setVersion('1.0.0') // Changed to match package.json usually
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Health', 'Service health checks')
    .addServer(`http://localhost:${configService.get('ACCOUNTS_SERVICE_PORT', 3001)}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Setup Swagger at root '/docs' since we removed the prefix
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Shamba Sure Accounts API',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // ============================================================================
  // START SERVER
  // ============================================================================
  const port = configService.get('ACCOUNTS_SERVICE_PORT', 3001);
  const host = configService.get('HOST', '0.0.0.0');

  await app.startAllMicroservices();
  await app.listen(port, host);

  // ============================================================================
  // STARTUP LOGS
  // ============================================================================
  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - Accounts Service (Ready for Gateway)');
  logger.log('='.repeat(70));
  logger.log(`📍 Service URL:     http://localhost:${port}`);
  logger.log(`📚 API Docs:        http://localhost:${port}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${port}/health`); // Matches Gateway's expected path
  logger.log('─'.repeat(70));
  logger.log(`🌍 Environment:     ${configService.get('NODE_ENV')}`);
  logger.log(`🔗 Gateway Path:    /api/accounts/*  -->  /*`);
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Application failed to start');
  console.error(error);
  process.exit(1);
});
