// ============================================================================
// main.ts - Application Bootstrap
// ============================================================================

import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { Transport } from '@nestjs/microservices';

import { ConfigService } from '@shamba/config';
import { SuccessionModule } from './succession.module';

/**
 * Bootstrap function - Initializes and starts the Succession microservice
 * 
 * SETUP STEPS:
 * 1. Create NestJS app with custom logger
 * 2. Connect RabbitMQ microservice transport (event consumer)
 * 3. Configure global pipes (validation)
 * 4. Configure global interceptors (serialization)
 * 5. Enable CORS, versioning, and global prefix
 * 6. Setup Swagger documentation
 * 7. Start microservice listener + HTTP server
 */
async function bootstrap() {
  // --- Create Application ---
  const app = await NestFactory.create(SuccessionModule, {
    bufferLogs: true, // Buffer logs until custom logger is ready
  });

  // --- Dependency Injection ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Logging Configuration ---
  app.useLogger(logger);

  // --- Graceful Shutdown ---
  // Ensures database connections and RabbitMQ close cleanly
  app.enableShutdownHooks();

  // --- Connect RabbitMQ Microservice Transport ---
  // This allows the service to consume events from other services
  const rabbitmqUrl = configService.get('RABBITMQ_URI') || 'amqp://localhost:5672';
  
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'succession.events',
      noAck: false,        // Require explicit acknowledgment
      persistent: true,    // Persist messages to disk
      queueOptions: {
        durable: true,     // Queue survives broker restart
      },
      // Prefetch 1 message at a time for better load distribution
      prefetchCount: 1,
    },
  });

  logger.log(`RabbitMQ microservice connected: ${rabbitmqUrl}`);

  // --- Global Validation Pipe ---
  // Automatically validates all incoming DTOs using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true,            // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // --- Global Serialization Interceptor ---
  // CRITICAL: Removes @Exclude() fields from all responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // --- CORS Configuration ---
  const corsOrigins = configService.get('CORS_ORIGINS') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    .setTitle('Shamba Sure - Succession Service')
    .setDescription(
      'API for estate and succession planning management.\n\n' +
      '**Features:**\n' +
      '- Will creation and management\n' +
      '- Asset registration and tracking\n' +
      '- Family tree management (HeirLink™)\n' +
      '- Beneficiary assignment with share distribution\n' +
      '- Will status workflow (Draft → Active → Revoked/Executed)'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',
    )
    .addTag('Wills', 'Will creation, management, and beneficiary assignments')
    .addTag('Assets', 'Asset registration and tracking')
    .addTag('Families', 'Family tree management (HeirLink™)')
    .addServer(`http://localhost:${configService.get('PORT')}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/v1/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Succession API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    swaggerOptions: {
      persistAuthorization: true, // Remember auth token in browser
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // --- Start All Transports ---
  // This starts the RabbitMQ microservice listener
  await app.startAllMicroservices();
  logger.log('Microservice transports started successfully');

  // --- Start HTTP Server ---
  const port = configService.get('PORT') || 3003;
  const host = configService.get('HOST') || '0.0.0.0';
  
  await app.listen(port, host);

  // --- Startup Logs ---
  logger.log(`🚀 Succession Service is running`);
  logger.log(`📍 Server: http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${globalPrefix}/v1/docs`);
  logger.log(`🔗 Health Check: http://localhost:${port}/${globalPrefix}/v1/health`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV') || 'development'}`);
  logger.log(`🐰 RabbitMQ: ${rabbitmqUrl}`);
  logger.log(`🔒 CORS Origins: ${corsOrigins}`);
}

// --- Bootstrap with Error Handling ---
bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:');
  console.error(error);
  process.exit(1);
});