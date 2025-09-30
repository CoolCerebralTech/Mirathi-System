import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';
import { GatewayModule } from './gateway.module';
import { GlobalExceptionFilter } from '@shamba/common';
import { HttpAdapterHost } from '@nestjs/core';

// --- Import Security Middlewares ---
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, { bufferLogs: true });

  // --- Get Core Services ---
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // --- Core Application Setup ---
  app.useLogger(logger);
  app.enableShutdownHooks();

  // --- Use Security Middlewares Directly ---
  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: configService.get('RATE_LIMIT_TTL') * 1000,
      max: configService.get('RATE_LIMIT_LIMIT'),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // --- Global Filters, Pipes, and Interceptors ---
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  // Note: The Gateway itself rarely needs a ClassSerializerInterceptor, as it mostly streams raw JSON.
  // However, it's good practice to have it in case any local DTOs are returned.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // --- API Configuration ---
  app.enableCors({
    origin: configService.get('CORS_ORIGINS'),
    credentials: true,
  });

  // --- Swagger (OpenAPI) Documentation ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shamba Sure - API Gateway')
    .setDescription('The single entry point for all Shamba Sure microservices. This API documentation is a composite of all downstream services.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Gateway and downstream service health checks')
    .addTag('Accounts', 'Proxied endpoints for the Accounts Service')
    .addTag('Documents', 'Proxied endpoints for the Documents Service')
    .addTag('Succession', 'Proxied endpoints for the Succession Service')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // --- Start Application ---
  const port = configService.get('GATEWAY_PORT');
  await app.listen(port);

  logger.log(`🚀 API Gateway is running on port ${port}`);
  logger.log(`📚 API documentation available at /docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during API Gateway bootstrap:', error);
  process.exit(1);
});