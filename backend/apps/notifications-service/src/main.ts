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
import { NotificationsModule } from './notifications.module';
import { Queue } from '@shamba/messaging';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URI')],
      queue: Queue.NOTIFICATIONS_EVENTS,
      noAck: false,
      persistent: true,
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  
  app.enableCors({ origin: configService.get('CORS_ORIGINS'), credentials: true });
  app.setGlobalPrefix(configService.get('GLOBAL_PREFIX'));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Notifications Service')
    .setDescription('API for managing and viewing notifications and templates.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Notifications', 'Endpoints for users to view their notifications')
    .addTag('Templates (Admin)', 'Endpoints for administrators to manage templates')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  
  await app.startAllMicroservices();
  const port = configService.get('NOTIFICATIONS_SERVICE_PORT'); // Dedicated port
  await app.listen(port);

  logger.log(`🚀 Notifications Service is running on port ${port}`);
  logger.log(`📚 API documentation available at /${configService.get('GLOBAL_PREFIX')}/v1/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:', error);
  process.exit(1);
});