// apps/succession-automation-service/src/main.ts
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { SuccessionAutomationModule } from './succession-automation.module';

async function bootstrap() {
  const app = await NestFactory.create(SuccessionAutomationModule, {
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
        queue: 'succession_service_queue',
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
    Array.isArray(corsOriginsRaw) && corsOriginsRaw.length === 1 && corsOriginsRaw[0] === '*'
      ? '*'
      : corsOriginsRaw;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ============================================================================
  // SWAGGER DOCUMENTATION
  // ============================================================================
  const servicePort = configService.get('SUCCESSION_AUTOMATION_SERVICE_PORT', 3005);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Succession Automation Service')
    .setDescription(
      'The "Digital Lawyer" Brain. Handles Readiness Assessments, Compliance Rules (LSA), Risk Detection, and P&A Form Generation.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag(
      'Readiness Assessment',
      'Evaluate estate readiness for probate filing based on LSA rules.',
    )
    .addTag('Probate Forms', 'Generate Kenyan Court Forms (P&A 80, P&A 1, P&A 5).')
    .addTag('Succession Roadmaps', 'Step-by-step executor guidance.')
    .addTag('Legal Guides', 'Educational content for users.')
    .addServer(`http://localhost:${servicePort}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Shamba Sure Succession API',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // ============================================================================
  // START SERVER
  // ============================================================================
  const host = configService.get('HOST', '0.0.0.0');

  await app.startAllMicroservices();
  await app.listen(servicePort, host);

  // ============================================================================
  // LOGS
  // ============================================================================
  logger.log('='.repeat(70));
  logger.log('🚀 Shamba Sure - Succession Automation Service');
  logger.log('='.repeat(70));
  logger.log(`📍 Service URL:     http://localhost:${servicePort}`);
  logger.log(`📚 API Docs:        http://localhost:${servicePort}/docs`);
  logger.log(`💚 Health Check:    http://localhost:${servicePort}/health`);
  logger.log('─'.repeat(70));
  logger.log(`🔗 Gateway Path:    /api/succession/*  -->  /*`);
  logger.log('='.repeat(70));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR: Succession Service failed to start');
  console.error(error);
  process.exit(1);
});
