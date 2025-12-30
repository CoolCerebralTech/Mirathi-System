import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { EstateModule } from './estate.module';

async function bootstrap() {
  const app = await NestFactory.create(EstateModule, {
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
        queue: 'estate_service_queue',
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

  // ============================================================================
  // GLOBAL SERIALIZATION
  // ============================================================================
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
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Estate & Will Service')
    .setDescription(
      'Manages Testamentary Instruments (Wills), Estate Inventory, Debt Solvency (S.45), and Distribution Logic.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Wills (Commands)', 'Drafting, Execution & Revocation')
    .addTag('Wills (Queries)', 'Audit, Compliance Radar & Search')
    .addTag('Estate Assets', 'Inventory Management')
    .addTag('Estate Debts', 'S.45 Priority Management')
    .addServer(
      `http://localhost:${configService.get('ESTATE_SERVICE_PORT', 3004)}`,
      'Local Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Shamba Sure Estate API',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // ============================================================================
  // START SERVER
  // ============================================================================
  const port = configService.get('ESTATE_SERVICE_PORT', 3004);
  const host = configService.get('HOST', '0.0.0.0');

  await app.startAllMicroservices();
  await app.listen(port, host);

  // ============================================================================
  // LOGS
  // ============================================================================
  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - Estate & Will Service');
  logger.log('='.repeat(70));
  logger.log(`📍 Service URL:     http://localhost:${port}`);
  logger.log(`📚 API Docs:        http://localhost:${port}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${port}/health`);
  logger.log('─'.repeat(70));
  logger.log(`🔗 Gateway Path:    /api/estate/*  -->  /*`);
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Estate Service failed to start');
  console.error(error);
  process.exit(1);
});
