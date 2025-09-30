import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';
import { DocumentsModule } from './documents.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(DocumentsModule, {
    bufferLogs: true,
  });

  // --- Get Core Services ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Core Application Setup ---
  app.useLogger(logger);
  app.enableShutdownHooks();

  // --- Global Pipes and Interceptors ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // CRITICAL: This ensures all API responses are serialized through our Entity classes.
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
    .setTitle('Shamba Sure - Documents Service')
    .setDescription('API for secure document upload, storage, and management.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Documents', 'Endpoints for managing user documents')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // --- Start Application ---
  // A dedicated port for this microservice, fetched from config.
  const port = configService.get('DOCUMENTS_SERVICE_PORT');
  await app.listen(port);

  logger.log(`🚀 Documents Service is running on port ${port}`);
  logger.log(`📚 API documentation available at /${configService.get('GLOBAL_PREFIX')}/v1/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during application bootstrap:', error);
  process.exit(1);
});