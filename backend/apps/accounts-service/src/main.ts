import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino'; 

import { ConfigService } from '@shamba/config';
import { AccountsModule } from './accounts.module';

async function bootstrap() {
  // Create the NestJS application instance.
  // bufferLogs: true ensures that logs during bootstrap are buffered
  // and handled by our custom logger once it's ready.
  const app = await NestFactory.create(AccountsModule, {
    bufferLogs: true,
  });

  // --- Get Core Services ---
  // These services are available because we imported their modules in AccountsModule.
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const reflector = app.get(Reflector);

  // --- Core Application Setup ---
  app.useLogger(logger);
  app.enableShutdownHooks(); // Ensures graceful shutdown

  // --- Global Pipes and Interceptors ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );
  // This global interceptor is CRITICAL for safely removing sensitive data
  // (like password hashes) from all API responses.
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
    .setTitle('Shamba Sure - Accounts Service')
    .setDescription('API for user identity, authentication, and profile management.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth & Profile', 'Endpoints for authentication and user profile management')
    .addTag('Users (Admin)', 'Endpoints for administrators to manage all users')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document); // Setup at /api/v1/docs

  // --- Start Application ---
  const port = configService.get('PORT');
  await app.listen(port);

  logger.log(`🚀 Accounts Service is running on port ${port}`);
  logger.log(`📚 API documentation available at /${configService.get('GLOBAL_PREFIX')}/v1/docs`);
}

bootstrap().catch((error) => {
  // Use a simple console.error here because the custom logger might not be initialized.
  console.error('❌ Fatal error during application bootstrap:', error);
  process.exit(1);
});