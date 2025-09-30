import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { Transport } from '@nestjs/microservices';

import { ConfigService } from '@shamba/config';
import { AuditingModule } from './auditing.module';
import { Queue } from '@shamba/messaging';

async function bootstrap() {
  const app = await NestFactory.create(AuditingModule, {
    bufferLogs: true,
  });

  // --- Get Core Services ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Core Application Setup ---
  app.useLogger(logger);
  app.enableShutdownHooks();

  // --- Connect Microservice Transports ---
  // This is the crucial step that allows this service to LISTEN for events.
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URI')],
      queue: Queue.AUDITING_EVENTS,
      noAck: false,
      persistent: true,
      queueOptions: {
        durable: true,
      },
    },
  });

  // --- Global Pipes and Interceptors ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // --- API Configuration ---
  app.enableCors({
    origin: configService.get('CORS_ORIGINS'),
    credentials: true,
  });
  app.setGlobalPrefix(configService.get('GLOBAL_PREFIX'));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // --- Swagger (OpenAPI) Documentation ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Auditing Service')
    .setDescription('API for querying immutable audit logs and security events.')
    .setVersion('1.0')
    .addBearerAuth() // API is protected
    .addTag('Auditing', 'Endpoints for querying audit data')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // --- Start All Transports ---
  await app.startAllMicroservices();
  const port = configService.get('AUDITING_SERVICE_PORT'); // Dedicated port
  await app.listen(port);

  logger.log(`🚀 Auditing Service is running on port ${port}`);
  logger.log(`📚 API documentation available at /${configService.get('GLOBAL_PREFIX')}/v1/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:', error);
  process.exit(1);
});