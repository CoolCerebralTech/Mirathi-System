// apps/documents-service/src/main.ts
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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
  // MICROSERVICE CONNECTION (RabbitMQ)
  // ============================================================================
  const rmqUrl = configService.get('RABBITMQ_URL');
  if (rmqUrl) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: 'documents_queue',
        queueOptions: {
          durable: true,
          deadLetterExchange: 'shamba.events.dead',
          deadLetterRoutingKey: 'documents_queue',
        },
        noAck: false,
        prefetchCount: 10,
      },
    });
    logger.log('✅ RabbitMQ microservice configured');
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

  // ============================================================================
  // GLOBAL SERIALIZATION
  // ============================================================================
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  const corsOriginsRaw = configService.get('CORS_ORIGINS') || ['http://localhost:3000'];
  const corsOrigins =
    corsOriginsRaw.length === 1 && corsOriginsRaw[0] === '*' ? '*' : corsOriginsRaw;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mirathi - Documents Service')
    .setDescription(
      'Smart document verification service for Kenyan succession process.\n\n' +
        'Features:\n' +
        '- OCR extraction of document references (Title Deeds, IDs, KRA PINs)\n' +
        '- Temporary storage with auto-cleanup\n' +
        '- Encrypted permanent reference storage\n' +
        '- Duplicate reference detection\n' +
        '- Verifier workflow for document approval/rejection',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Documents', 'User document upload and management')
    .addTag('Verification', 'Verifier operations (VERIFIER/ADMIN only)')
    .addTag('Health', 'Service health and readiness checks')
    .addServer(
      `http://localhost:${configService.get('DOCUMENTS_SERVICE_PORT', 3003)}`,
      'Local Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // ============================================================================
  // START SERVER
  // ============================================================================
  const port = configService.get('DOCUMENTS_SERVICE_PORT', 3003);
  const host = configService.get('HOST', '0.0.0.0');

  await app.startAllMicroservices();
  await app.listen(port, host);

  // ============================================================================
  // LOGS
  // ============================================================================
  logger.log('='.repeat(70));
  logger.log('📄 Mirathi - Documents Service (Smart Verification Engine)');
  logger.log('='.repeat(70));
  logger.log(`📍 Service URL:     http://localhost:${port}`);
  logger.log(`📚 API Docs:        http://localhost:${port}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${port}/health`);
  logger.log('─'.repeat(70));
  logger.log(`🔗 Gateway Path:    /api/documents/*  -->  /*`);
  logger.log(`🔐 Auth Required:   Yes (JWT Bearer Token)`);
  logger.log(`📦 Storage:         MinIO (Temporary)`);
  logger.log(`🔍 OCR Engine:      Tesseract.js`);
  logger.log(`🔒 Encryption:      AES-256-GCM`);
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Documents Service failed to start');
  console.error(error);
  process.exit(1);
});
