// apps/api-gateway/src/infrastructure/infrastructure.module.ts
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@shamba/config';

import { HttpClientService } from './http/http-client.service';
import { RoutingService } from './routing/routing.service';

/**
 * InfrastructureModule
 *
 * This module encapsulates the HTTP client infrastructure for proxying
 * requests to microservices. It uses http-proxy-middleware for efficient
 * and reliable request forwarding.
 */
@Module({
  imports: [
    // Configure HttpModule with proper settings
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: parseInt(configService.get('HTTP_TIMEOUT') || '30000'),
        maxRedirects: 5,
        maxContentLength: parseInt(configService.get('HTTP_MAX_CONTENT_LENGTH') || '52428800'), // 50MB
        headers: {
          'User-Agent': `ShambaSure-API-Gateway/${process.env.npm_package_version || '1.0.0'}`,
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [HttpClientService, RoutingService],
  exports: [HttpClientService, RoutingService],
})
export class InfrastructureModule {}
