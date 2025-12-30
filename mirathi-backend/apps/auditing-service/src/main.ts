// ============================================================================
// main.ts - Application Bootstrap
// ============================================================================
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

import { AuditingModule } from './auditing.module';

async function bootstrap() {
  const app = await NestFactory.create(AuditingModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();

  const rabbitmqUrl = configService.get('RABBITMQ_URL') || 'amqp://localhost:5672';

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'auditing.events',
      noAck: false,
      persistent: true,
      queueOptions: { durable: true },
      prefetchCount: 1,
    },
  });

  logger.log(`RabbitMQ connected: ${rabbitmqUrl}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const corsOrigins = configService.get('CORS_ORIGINS') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - Auditing Service')
    .setDescription('Immutable audit logging for security and compliance.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Auditing (Admin)', 'Audit log access and analytics (admin only)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/v1/docs`, app, document);

  await app.startAllMicroservices();
  logger.log('Microservice transports started');

  const port = configService.get('PORT') || 3005;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Auditing Service running on port ${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${globalPrefix}/v1/docs`);
  logger.log(`🐰 RabbitMQ: ${rabbitmqUrl}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
