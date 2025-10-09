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
import { NotificationsModule } from './notifications.module';

/**
 * Bootstrap function - Initializes and starts the Notifications microservice
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
  const app = await NestFactory.create(NotificationsModule, {
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
  const rabbitmqUrl = configService.get('RABBITMQ_URL') || 'amqp://localhost:5672';
  
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'notifications.events',
      noAck: false,        // Require explicit acknowledgment
      persistent: true,    // Persist messages to disk
      queueOptions: {
        durable: true,     // Queue survives broker restart
      },
      prefetchCount: 1,    // Process 1 message at a time
    },
  });

  logger.log(`RabbitMQ microservice connected: ${rabbitmqUrl}`);

  // --- Global Validation Pipe ---
  // Automatically validates all incoming DTOs using class-validator
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
    .setTitle('Shamba Sure - Notifications Service')
    .setDescription(
      'API for notification and template management.\n\n' +
      '**Features:**\n' +
      '- Email delivery via SMTP\n' +
      '- SMS delivery via Africa\'s Talking\n' +
      '- Template management with Handlebars\n' +
      '- Event-driven notification triggers\n' +
      '- Scheduled batch processing\n' +
      '- Delivery tracking and retry logic'
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
    .addTag('Notifications', 'View notification history')
    .addTag('Templates (Admin)', 'Manage notification templates (admin only)')
    .addServer(`http://localhost:${configService.get('PORT')}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/v1/docs`, app, document, {
    customSiteTitle: 'Shamba Sure Notifications API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // --- Start All Transports ---
  // This starts the RabbitMQ microservice listener
  await app.startAllMicroservices();
  logger.log('Microservice transports started successfully');

  // --- Start HTTP Server ---
  const port = configService.get('PORT') || 3004;
  const host = configService.get('HOST') || '0.0.0.0';
  
  await app.listen(port, host);

  // --- Startup Logs ---
  const nodeEnv = configService.get('NODE_ENV') || 'development';
  
  logger.log(`🚀 Notifications Service is running`);
  logger.log(`📍 Server: http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${globalPrefix}/v1/docs`);
  logger.log(`🔗 Health Check: http://localhost:${port}/${globalPrefix}/v1/health`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🐰 RabbitMQ: ${rabbitmqUrl}`);
  logger.log(`📧 Email Provider: ${configService.get('EMAIL_PROVIDER') || 'smtp'}`);
  logger.log(`📱 SMS Provider: ${configService.get('SMS_PROVIDER') || 'africas-talking'}`);
  logger.log(`🔒 CORS Origins: ${corsOrigins}`);
}

// --- Bootstrap with Error Handling ---
bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:');
  console.error(error);
  process.exit(1);
});