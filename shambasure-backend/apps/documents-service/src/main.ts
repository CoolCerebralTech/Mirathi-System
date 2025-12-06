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
  // MICROSERVICE CONNECTION (RabbitMQ) - ADDED
  // ============================================================================
  const rmqUrl = configService.get('RABBITMQ_URL');
  if (rmqUrl) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: 'documents_queue', // Unique queue for this service
        queueOptions: {
          durable: true,
        },
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
  // CORS CONFIGURATION (FIXED)
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
  // API CONFIGURATION
  // ============================================================================
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix);

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Documents Service')
    .setDescription('Manages document lifecycle...') // (Shortened for brevity)
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header', name: 'Authorization' },
      'JWT',
    )
    .addTag('Documents')
    .addServer(
      `http://localhost:${configService.get('DOCUMENTS_SERVICE_PORT', 3002)}`,
      'Local Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  // ============================================================================
  // START SERVER
  // ============================================================================
  const port = configService.get('DOCUMENTS_SERVICE_PORT', 3002);
  const host = configService.get('HOST', '0.0.0.0');

  // Start BOTH Microservices and HTTP Server
  await app.startAllMicroservices();
  await app.listen(port, host);

  // ... (Logs remain the same)
  logger.log(`🚀 Shamba Sure - Documents Service is running`);
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Documents Service failed to start');
  console.error(error);
  process.exit(1);
});
